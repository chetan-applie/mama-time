# PostgreSQL Backup and Restore

## Backup types

### Native PostgreSQL backup

Recommended disaster-recovery backup:

```bash
npm run db:backup
```

This calls `pg_dump` and creates a custom-format `.dump` file under `backend/backups/`. PostgreSQL client tools must be installed. The supplied Docker image includes them.

Custom destination:

```bash
npm run db:backup -- --file=/secure/path/mama-time.dump
```

### Logical sanitized JSON export

```bash
npm run backup
```

This export contains settings, leads and activities but excludes password hashes, normalized matching fields and IP hashes. It is useful for business review and controlled migration, but the native dump is the primary recovery backup.

## Restore

Always restore to a separate test database first.

```bash
ALLOW_DESTRUCTIVE_RESTORE=true \
  npm run db:restore -- \
  --file=/secure/path/mama-time.dump \
  --confirm=RESTORE-MAMA-TIME
```

After restore:

```bash
npm run db:migrate
npm run db:status
npm test
```

Then verify login, lead counts, sample lead details, settings and exports.

## Operational policy

Recommended minimum:

- daily automated native dump;
- encrypted storage;
- at least one off-server copy;
- retention policy approved by the data controller;
- periodic restore test;
- access limited to authorized personnel;
- backup deletion aligned with privacy retention rules.
