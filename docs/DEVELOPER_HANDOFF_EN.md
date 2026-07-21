# Developer Handoff – React, Node.js and PostgreSQL

## Product objective

Deploy the MAMA TIME acquisition campaign for Sentinators Gym in Weite SG. The public website is German; this technical handoff is English.

Campaign facts:

- campaign: **MAMA TIME**;
- period: **20 July 2026 through 20 August 2026**;
- single offer: **CHF 550 per mama, member card included**;
- besties offer: **CHF 990 for two mamas, two member cards included**;
- saving: CHF 110 total / 10% per mama;
- effective duo price: CHF 495 per mama;
- default daytime hours: Monday–Friday, 08:00–16:30.

## Implemented system

### React/Vite frontend

- approved premium anthracite/rose/gold campaign design;
- one responsive application for desktop, tablet and mobile;
- accessible lead dialog / mobile bottom sheet;
- German validation and success states;
- single and besties offer logic;
- FAQ, sticky mobile CTA and WhatsApp fallback;
- UTM, `fbclid` and `gclid` capture;
- protected React backoffice;
- campaign settings, lead dashboard, filters, detail view and account page;
- database connection/migration status plus Meta Pixel ID and consent configuration in the settings screen.

### Node/Express API

- strict Zod validation;
- rate limiting, honeypot and minimum-fill-time checks;
- HMAC IP hashing; no raw IP storage;
- duplicate detection by normalized email or phone;
- optional SMTP notification;
- HttpOnly JWT admin cookie and CSRF protection;
- parameterized PostgreSQL queries;
- transactions for lead creation, lead updates and password changes;
- CSV export and sanitized logical JSON export;
- PostgreSQL health and migration status endpoints;
- consent-controlled Meta Pixel events with a neutral parameter allowlist.

### PostgreSQL database

- versioned SQL migrations under `backend/migrations/`;
- migration checksums stored in `schema_migrations`;
- tables: `admins`, `app_settings`, `leads`, `lead_activities`;
- foreign keys, unique references, checks and indexes;
- connection pool via `pg`;
- Docker Compose database service;
- `pg_dump`/`pg_restore` scripts;
- v1 JSON import utility.

## Recommended production topology

```text
Browser
   |
   | HTTPS
   v
Nginx / load balancer
   |
   v
Node.js / Express (one or more instances)
   |
   | PostgreSQL protocol over private network/TLS
   v
PostgreSQL
   |
   +--> encrypted automated backups
```

Multiple Node instances are now supported because writes are coordinated by PostgreSQL. Do not share admin cookies across unrelated domains and do not expose the database port publicly.

## Required handoff tasks

1. Provision staging and production PostgreSQL databases.
2. Create least-privilege database credentials.
3. Configure `.env` without committing it.
4. Run `npm ci` and `npm run db:migrate`.
5. Build and test the React frontend.
6. Review the supplied Sentinator GmbH legal text, set the real WhatsApp number and optional SMTP.
7. Configure the Pixel ID in the backoffice and perform the consent/event tests in `docs/META_PIXEL_SETUP_DE.md`.
8. Perform staging acceptance tests.
9. Configure daily PostgreSQL backups and test a restore.
10. Put the app behind HTTPS.
11. Record final credentials and operating procedures in the client password manager/runbook.

## Non-negotiable rules

1. Do not flatten the page into the 300-dpi image.
2. Do not edit an applied SQL migration; create a new numbered migration.
3. Do not use `DATABASE_USE_PGMEM=true` outside automated tests.
4. Do not expose PostgreSQL, Adminer, `.env`, source code or backup files publicly.
5. Do not leave example passwords active.
6. Do not remove server-side validation, CSRF, rate limiting or security headers.
7. Do not publish sample testimonials as real reviews.
8. Do not run destructive reset/restore/import commands without a verified backup.
9. Do not run schema changes manually in production without recording a migration.
10. Do not change approved German campaign copy without marketing approval.

## Acceptance definition

- `npm run verify` passes;
- real PostgreSQL migration and connection check passes;
- single and besties leads reach the backoffice;
- duplicate detection works;
- status, notes, callback and activity history work;
- dashboard values and revenue are correct;
- CSV and JSON exports work;
- password change invalidates the existing session;
- settings update the public page;
- database backup and restore are tested;
- all required mobile/desktop viewports pass;
- legal/privacy text and Meta consent wording are approved;
- Meta script is absent before consent and PageView, ViewContent, Contact and successful Lead pass Test Events;
- HTTPS and secure cookies are verified.
