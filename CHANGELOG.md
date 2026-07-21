# Changelog

## 2.1.0 – 2026-07-21

- Added a consent-controlled Meta Pixel integration to the PostgreSQL production build.
- Added editable Pixel ID and enable/disable switch in the protected backoffice.
- Added PostgreSQL-backed `meta_pixel_enabled` and `meta_pixel_id` settings without changing the relational schema.
- Added MAMA-TIME-styled marketing-consent banner and footer cookie-settings control.
- Added `PageView`, landing-page `ViewContent`, WhatsApp `Contact` and successful-database-write `Lead` events.
- Added strict event-parameter allowlisting so contact details, free text and lead references are never sent as Pixel parameters.
- Updated production CSP for the required Meta endpoints.
- Replaced legal-page placeholders with the supplied Sentinator GmbH operator details and added a Meta Pixel privacy section.
- Added German setup/testing documentation and expanded automated verification.

## 2.0.0 – 2026-07-15

- Replaced the runtime JSON file store with PostgreSQL.
- Added checksum-protected SQL migrations.
- Added relational tables, constraints, foreign keys and indexes.
- Converted lead, admin, settings, dashboard and export services to asynchronous parameterized SQL.
- Added transactions for lead creation, workflow updates and password changes.
- Added PostgreSQL status endpoint and backoffice database status card.
- Added Docker Compose PostgreSQL service and optional localhost-only Adminer profile.
- Added native `pg_dump` and `pg_restore` scripts.
- Added v1 JSON-to-PostgreSQL import utility.
- Added database setup, status, backup, restore and migration commands.
- Added PostgreSQL-specific production validation and system checks.
- Updated all deployment, security, backup and developer documentation.
- Added integration tests using `pg-mem` while preserving the existing React/API contract.

## 1.0.0 – 2026-07-14

- Complete responsive React landing page.
- Node.js/Express public API and protected lead backoffice.
- Single and besties lead flows.
- Original atomic JSON storage implementation.
- Campaign settings, price calculations and timezone normalization.
- Authentication, CSRF, rate limiting, duplicate detection and privacy controls.
- Docker, Nginx, systemd and PM2 deployment examples.
- Automated integration tests and frontend checks.
