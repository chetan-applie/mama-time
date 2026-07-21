# PostgreSQL Database Guide

## 1. Production engine

PostgreSQL is the sole production data store. `pg-mem` is included only as a development dependency for automated tests and must never be enabled in production.

## 2. Connection

The backend reads `DATABASE_URL`:

```text
postgresql://USER:URL_ENCODED_PASSWORD@HOST:5432/DATABASE
```

Use a private database network where possible. For managed PostgreSQL requiring TLS:

```env
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
```

If the provider uses a private/self-signed CA, install the correct CA certificate rather than disabling verification. `DATABASE_SSL_REJECT_UNAUTHORIZED=false` should only be a documented provider-specific exception.

## 3. Tables

A visual entity-relationship diagram is available at `reference/database-erd.svg`.

### `admins`

Stores backoffice accounts:

- lower-case unique email;
- bcrypt password hash;
- display name and role;
- active state;
- `auth_version` for immediate JWT invalidation;
- login and audit timestamps.

### `app_settings`

Key/value settings edited in the backoffice. Environment campaign values seed missing rows only; existing database settings are retained across restarts.

### `leads`

Stores:

- offer and value;
- mama and optional bestie contact data;
- privacy consent timestamp;
- status, assignee, callback, notes and lost reason;
- duplicate relationship;
- UTM/click attribution;
- hashed IP and user agent;
- created, updated and archived timestamps.

### `lead_activities`

Append-only workflow history linked to leads and optional admin actors. `details_json` is `JSONB`.

### `schema_migrations`

Migration name, SHA-256 checksum and applied timestamp.

## 4. Migrations

Migration files are ordered lexically:

```text
backend/migrations/001_initial_schema.sql
backend/migrations/002_additional_indexes.sql
```

Apply them with:

```bash
npm run db:migrate
```

Rules:

- never edit an applied migration;
- add `003_description.sql`, `004_description.sql`, etc.;
- test on a restored staging copy first;
- back up production before any schema change;
- commit the migration with the application code that requires it.

The runner rejects a changed checksum for an already applied file.

## 5. Connection pool

Environment controls:

- `DATABASE_POOL_MAX` default 10;
- `DATABASE_IDLE_TIMEOUT_MS` default 30000;
- `DATABASE_CONNECTION_TIMEOUT_MS` default 10000.

For multiple Node instances, ensure the combined maximum pool size stays below the database connection limit.

## 6. Inspecting the database

```bash
npm run db:status
```

The protected backoffice settings page also shows engine, database name, size, connection pool and migration status.

Optional local Adminer:

```bash
docker compose --profile tools up -d adminer
```

Adminer binds to `127.0.0.1:8081`; do not expose it publicly.

## 7. Database user permissions

The application user needs schema/table/sequence privileges for migrations and normal CRUD. A stricter production setup may use:

- deployment/migration user with DDL rights;
- runtime application user with DML rights only.

If split credentials are implemented later, run migrations in the deployment pipeline with the migration URL, then start the application with the restricted runtime URL.
