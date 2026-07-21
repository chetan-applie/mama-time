# MAMA TIME – React + Node + PostgreSQL Production Kit

**Sentinators Gym, Weite SG**  
Version 2.1.0 · German public website and backoffice · English developer documentation

This package is the complete MAMA TIME campaign application with a real PostgreSQL database:

- responsive React/Vite landing page matching the approved visual direction;
- Node.js/Express API;
- PostgreSQL relational database with versioned SQL migrations;
- protected German-language lead backoffice;
- consent-controlled Meta Pixel with PostgreSQL-backed settings and event tracking;
- single-mama and mama-besties forms;
- campaign settings, lead status management, notes, callbacks and activity history;
- revenue statistics, CSV export and sanitized logical JSON export;
- PostgreSQL dump/restore scripts;
- migration tool for the former v1 JSON data file;
- Docker Compose stack with application, PostgreSQL and optional Adminer;
- automated backend integration tests using a PostgreSQL-compatible in-memory test database;
- production build, deployment examples and English developer documentation.

## 1. Fastest complete start: Docker Compose

Requirements: Docker with Compose support.

```bash
npm run setup -- --docker=1
# Store the printed admin and PostgreSQL passwords.
docker compose up -d --build
```

Open:

- landing page: `http://localhost:3000/`
- backoffice: `http://localhost:3000/admin`
- health endpoint: `http://localhost:3000/api/health`
- optional local database UI: `docker compose --profile tools up -d adminer`, then `http://127.0.0.1:8081`

The application container waits for PostgreSQL, applies all pending SQL migrations and then starts Node.

## 2. Local development without Docker for the app

A PostgreSQL server must be running and the database/user in `DATABASE_URL` must exist.

```bash
npm ci
npm run setup -- --database-url=postgresql://USER:PASSWORD@127.0.0.1:5432/mama_time
npm run db:migrate
npm run dev
```

Local URLs:

- React/Vite: `http://localhost:5173`
- Node API: `http://localhost:3000`
- backoffice through Vite: `http://localhost:5173/admin`

The Vite server proxies `/api` to Node.

## 3. Production setup

```bash
npm ci
npm run setup -- --production=1 \
  --base-url=https://YOUR-PRODUCTION-DOMAIN \
  --database-url=postgresql://DB_USER:URL_ENCODED_PASSWORD@DB_HOST:5432/DB_NAME \
  --admin-email=YOUR-ADMIN-EMAIL \
  --whatsapp=YOUR-WHATSAPP-NUMBER
npm run db:migrate
npm run build
npm test
npm run doctor
npm start
```

The setup command prints a random admin password and a PostgreSQL password. Store all credentials in a password manager. Never commit `.env`.

## 4. Database design

PostgreSQL is the only production storage engine. The schema is created by ordered SQL files in `backend/migrations/`.

Main tables:

- `admins` – backoffice accounts and password hashes;
- `app_settings` – editable campaign configuration;
- `leads` – form submissions, attribution, workflow and duplicate links;
- `lead_activities` – immutable workflow/activity history;
- `schema_migrations` – applied migration names and checksums.

A visual entity-relationship diagram is included at `reference/database-erd.svg`.

The backend uses parameterized SQL through `pg`, transactions for multi-step writes, connection pooling and foreign-key constraints. The API contract used by the React frontend is unchanged from v1.

## 5. Important database commands

```bash
npm run db:migrate          # apply pending SQL migrations
npm run db:status           # connection, version, migration and row-count report
npm run db:backup           # PostgreSQL custom-format dump via pg_dump
npm run backup              # sanitized logical JSON export
npm run db:restore -- --file=/path/backup.dump --confirm=RESTORE-MAMA-TIME
npm run db:import-json -- --file=/path/v1-mama-time.json
npm run seed:demo           # staging/development only
npm run reset:data -- --confirm=RESET-MAMA-TIME
```

Detailed instructions are in:

- `docs/DATABASE_POSTGRESQL_EN.md`
- `docs/BACKUP_RESTORE_EN.md`
- `docs/MIGRATION_FROM_V1_JSON_EN.md`

## 6. Critical values before go-live

1. HTTPS production domain in `APP_BASE_URL`;
2. production PostgreSQL connection URL and unique database password;
3. real administrator email and strong password;
4. real WhatsApp number in international format without `+` or spaces;
5. optional SMTP credentials and notification recipient;
6. review the supplied Sentinator GmbH imprint/privacy content and verify the Meta Pixel consent wording;
7. enter and test the Meta Pixel ID in `/admin/settings`;
8. tested backup and restore process;
9. campaign enforcement enabled only after staging verification.

## 7. Package structure

```text
frontend/               React/Vite source and compiled production build
backend/src/            Express API, services, validation and PostgreSQL adapter
backend/migrations/     ordered, checksum-protected SQL migrations
backend/scripts/        migration, admin, seed, import, backup and restore tools
backend/backups/        local backup destination; contents are gitignored
deployment/             Nginx, systemd and cron examples
docs/                   English implementation and operations documentation
reference/              approved design and visual-QA references
Dockerfile              production application image
docker-compose.yml      app + PostgreSQL + optional Adminer
```

## 8. Quality commands

```bash
npm run build
npm test
npm run verify
npm run doctor
npm audit --omit=dev
```

The backend tests run against `pg-mem`, which emulates the PostgreSQL API for repeatable automated tests. Staging and production must always use a real PostgreSQL server.

## 9. Documentation reading order

1. `docs/DEVELOPER_HANDOFF_EN.md`
2. `docs/ARCHITECTURE_EN.md`
3. `docs/DATABASE_POSTGRESQL_EN.md`
4. `docs/ENVIRONMENT_VARIABLES_EN.md`
5. `docs/DEPLOYMENT_EN.md`
6. `docs/FORM_AND_BACKOFFICE_EN.md`
7. `docs/BACKUP_RESTORE_EN.md`
8. `docs/META_PIXEL_SETUP_DE.md`
9. `docs/QA_GO_LIVE_EN.md`

The public site and backoffice intentionally remain German. Technical documentation is English for the development team.
