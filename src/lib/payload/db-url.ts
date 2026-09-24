/**
 * The connection string, with a lax `sslmode` pinned to `verify-full`.
 *
 * node-postgres treats `prefer`, `require` and `verify-ca` as aliases for `verify-full` today
 * (the certificate and host name are checked), warns about it on every cold start, and will
 * give them libpq's weaker meaning in its next major version. Neon hands out
 * `sslmode=require`, so the URL keeps the provider's spelling — psql, which reads the same
 * strings in DEPLOY.md, would need a root certificate file for `verify-full` — and the
 * adapter gets the behaviour we have now, stated explicitly. A URL without `sslmode` (the
 * local database, the VPS's Postgres on the internal network) is left alone.
 */
export function pinnedDatabaseUrl(url: string | undefined): string {
  if (!url) return ''
  return url.replace(/([?&]sslmode=)(?:prefer|require|verify-ca)(?=&|$)/i, '$1verify-full')
}
