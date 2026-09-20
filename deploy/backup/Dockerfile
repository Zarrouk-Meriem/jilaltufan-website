# Nightly backups: pg_dump (matching the server's major version) + curl for the R2 upload.
FROM postgres:17-alpine
RUN apk add --no-cache curl
COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh
ENTRYPOINT ["/usr/local/bin/backup.sh"]
