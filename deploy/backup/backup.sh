#!/bin/sh
# Runs once at start, then every night at BACKUP_HOUR_UTC (default 03). Writes
#   /backups/db-<stamp>.dump          pg_dump custom format (restore: pg_restore -d jaa file)
#   /backups/files-<stamp>.tar.gz     /data/media + /data/application-files, if not empty
# keeps BACKUP_KEEP_DAYS (default 14) locally, and copies every new file to
# s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/ when BACKUP_S3_BUCKET is set (R2 or any S3;
# keys default to the media S3_* values, so one R2 token with access to both buckets is enough).
#
#   BACKUP_NOW=1  runs a single backup and exits (used by the deploy check).
set -eu
: "${BACKUP_KEEP_DAYS:=14}" "${BACKUP_HOUR_UTC:=3}" "${BACKUP_S3_PREFIX:=backups}"
: "${BACKUP_S3_ENDPOINT:=${S3_ENDPOINT:-}}"
: "${BACKUP_S3_ACCESS_KEY_ID:=${S3_ACCESS_KEY_ID:-}}"
: "${BACKUP_S3_SECRET_ACCESS_KEY:=${S3_SECRET_ACCESS_KEY:-}}"
mkdir -p /backups

upload() {
  [ -n "${BACKUP_S3_BUCKET:-}" ] || return 0
  if [ -z "$BACKUP_S3_ENDPOINT" ] || [ -z "$BACKUP_S3_ACCESS_KEY_ID" ] || [ -z "$BACKUP_S3_SECRET_ACCESS_KEY" ]; then
    echo "backup: BACKUP_S3_BUCKET is set but endpoint/keys are missing; keeping the local copy only" >&2
    return 0
  fi
  curl -sS --fail --retry 3 --aws-sigv4 "aws:amz:auto:s3" \
    --user "$BACKUP_S3_ACCESS_KEY_ID:$BACKUP_S3_SECRET_ACCESS_KEY" \
    -T "$1" "${BACKUP_S3_ENDPOINT%/}/$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/$(basename "$1")" \
    && echo "backup: uploaded $(basename "$1")"
}

run_backup() {
  stamp=$(date -u +%Y%m%d-%H%M)
  db="/backups/db-$stamp.dump"
  pg_dump --format=custom --no-owner --file="$db"
  echo "backup: wrote $db ($(du -h "$db" | cut -f1))"
  upload "$db"
  if [ -n "$(ls -A /data/media 2>/dev/null)$(ls -A /data/application-files 2>/dev/null)" ]; then
    files="/backups/files-$stamp.tar.gz"
    tar -czf "$files" -C /data media application-files 2>/dev/null || true
    echo "backup: wrote $files ($(du -h "$files" | cut -f1))"
    upload "$files"
  fi
  find /backups -type f -mtime +"$BACKUP_KEEP_DAYS" -print -delete | sed 's/^/backup: pruned /'
}

run_backup
[ "${BACKUP_NOW:-}" = "1" ] && exit 0
while true; do
  now=$(date -u +%s)
  wait=$(( (86400 - now % 86400 + BACKUP_HOUR_UTC * 3600) % 86400 ))
  [ "$wait" -eq 0 ] && wait=86400
  echo "backup: next run in $((wait / 3600))h$(( (wait % 3600) / 60 ))m"
  sleep "$wait"
  run_backup || echo "backup: FAILED at $(date -u)" >&2
done
