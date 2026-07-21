# Troubleshooting

## `ECONNREFUSED` or database connection timeout

- verify PostgreSQL is running;
- verify host/port in `DATABASE_URL`;
- in Docker, use hostname `db`, not `127.0.0.1` inside the app container;
- run `docker compose ps` and inspect `docker compose logs db`;
- check firewall/private-network rules;
- check TLS settings for managed databases.

## Authentication failed for PostgreSQL

Confirm `POSTGRES_USER`, `POSTGRES_PASSWORD`, database name and URL encoding. Changing Compose credentials does not change an already initialized PostgreSQL volume. For local development, remove/recreate the volume only when data loss is acceptable.

## Missing table or relation

```bash
npm run db:migrate
npm run db:status
```

Do not create tables manually.

## Migration checksum mismatch

An applied migration file was edited. Restore the committed original file and create a new numbered migration for the change.

## Application starts but form returns 500

Check Node logs and `/api/health`. Confirm migrations, database permissions and available connections.

## Admin login fails

The bootstrap credentials create an account only when no admin exists. Use the current password, the backoffice password-change flow or:

```bash
npm run create-admin -- admin@example.ch 'Strong-New-Password' 'Admin Name'
```

## `pg_dump` or `pg_restore` not found

Install PostgreSQL client tools or execute the command in the supplied Docker application image.

## Docker database volume contains development credentials

Credentials are initialized only on first volume creation. Back up required data, then either change the PostgreSQL role password inside the database or recreate the volume during a controlled development reset.

## Importing the old JSON file fails

Check the file is the v1 `mama-time.json` structure. The target database must have no leads unless `--replace=1` is deliberately used after a backup.
