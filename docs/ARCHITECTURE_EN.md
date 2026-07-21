# Architecture

## Components

```text
frontend/
  React 18 + Vite
  public landing page and legal pages
  consent-controlled Meta Pixel adapter
  protected backoffice UI

backend/
  Express API
  authentication and CSRF middleware
  validation and business services
  PostgreSQL adapter and migration runner

PostgreSQL
  admins
  app_settings
  leads
  lead_activities
  schema_migrations
```

## Request flow: public lead

1. React validates the visible form.
2. React posts JSON to `POST /api/public/leads`.
3. Express rate limiting and Zod validation run.
4. Honeypot and minimum form duration are checked.
5. Campaign and form availability are loaded from `app_settings`.
6. A PostgreSQL transaction searches for a recent duplicate.
7. The lead and creation activity are inserted atomically.
8. The transaction commits.
9. The API returns HTTP 201 and a reference number.
10. Only now does the browser emit the consent-dependent Meta `Lead` event with neutral allowlisted parameters.
11. Optional SMTP notification is sent asynchronously.

Validation errors, campaign closure, network errors and database failures never reach step 10.

## Request flow: Meta Pixel configuration and consent

1. React loads `/api/public/config`.
2. PostgreSQL-backed `meta_pixel_enabled` and `meta_pixel_id` are validated by the API.
3. The frontend configures the local Pixel adapter but does not insert an external script yet.
4. The visitor chooses **Marketing akzeptieren** or **Nur notwendige**.
5. Only affirmative consent inserts `https://connect.facebook.net/en_US/fbevents.js`, initializes the stored ID and emits `PageView`.
6. The landing-page `ViewContent` is emitted once; WhatsApp `Contact` and successful-form `Lead` are event-driven.
7. The footer can reopen consent controls; withdrawal revokes consent and attempts to clear `_fbp`/`_fbc`.

The adapter uses a strict event-parameter allowlist and never receives form contact fields.

## Request flow: admin mutation

1. User logs in and receives an HttpOnly JWT cookie plus a CSRF token.
2. React sends the CSRF token in `X-CSRF-Token` for mutations.
3. Middleware verifies JWT, active admin and `auth_version`.
4. The database transaction locks the target row where required.
5. Lead/settings/password data is updated.
6. A lead activity is written for workflow changes.
7. React receives the updated object.

Meta settings use the same protected settings endpoint and are stored as `app_settings` keys. Existing PostgreSQL installations receive missing keys through `ensureDefaultSettings()`; no destructive schema migration is needed.

## Database access principles

- all user-controlled values use PostgreSQL parameters;
- multi-step writes use transactions;
- IDs are database-generated `BIGSERIAL` values;
- UTC timestamps are stored as `TIMESTAMPTZ`;
- campaign local time is interpreted with `Europe/Zurich`;
- sensitive normalized fields and IP hashes are not exposed in admin exports;
- database connections come from a bounded pool;
- the application fails startup when the database cannot be initialized.

## Frontend/API contract

The public and admin API response shapes remain compatible with the PostgreSQL v2 frontend. Version 2.1.0 adds the two public camelCase Meta fields and two protected snake_case settings fields without changing lead storage or the relational schema.
