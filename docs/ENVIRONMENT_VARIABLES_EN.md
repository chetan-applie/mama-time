# Environment Variables

Copy `.env.example` to `.env` or use `npm run setup`. Never commit a real `.env` file.

## Core application

| Variable | Required | Description |
|---|---:|---|
| `NODE_ENV` | yes | `development`, `test` or `production` |
| `APP_VERSION` | no | displayed application version; current release `2.1.0` |
| `PORT` | yes | Express port, default `3000` |
| `TRUST_PROXY` | production | number of trusted reverse proxies |
| `APP_BASE_URL` | yes | public base URL; HTTPS in production |
| `FRONTEND_DEV_ORIGIN` | development | Vite origin |

## PostgreSQL

| Variable | Required | Description |
|---|---:|---|
| `DATABASE_URL` | yes | PostgreSQL connection URL used by Node |
| `DATABASE_URL_DOCKER` | Docker | URL with hostname `db` for Compose |
| `DATABASE_SSL` | provider-specific | enable TLS |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | provider-specific | validate DB certificate |
| `DATABASE_POOL_MAX` | no | max connections per Node process |
| `DATABASE_IDLE_TIMEOUT_MS` | no | idle connection timeout |
| `DATABASE_CONNECTION_TIMEOUT_MS` | no | connection attempt timeout |
| `RUN_MIGRATIONS_ON_START` | no | apply migrations on app startup |
| `DATABASE_LOG_QUERIES` | development only | SQL debug logging |
| `DATABASE_USE_PGMEM` | tests only | in-memory PostgreSQL emulator; must be false in production |
| `POSTGRES_DB` | Compose | database created by container |
| `POSTGRES_USER` | Compose | database user created by container |
| `POSTGRES_PASSWORD` | Compose | database password created by container |

## Authentication and security

| Variable | Required | Description |
|---|---:|---|
| `JWT_SECRET` | yes | unique random secret of at least 40 characters |
| `IP_HASH_SECRET` | yes | separate random HMAC secret |
| `ADMIN_COOKIE_NAME` | no | admin auth cookie name |
| `ADMIN_TOKEN_HOURS` | no | admin session lifetime |
| `ADMIN_BOOTSTRAP_EMAIL` | first start | initial admin email if the table is empty |
| `ADMIN_BOOTSTRAP_PASSWORD` | first start | initial strong admin password |
| `ADMIN_BOOTSTRAP_NAME` | no | initial admin display name |
| `SHOW_DEFAULT_PASSWORD_WARNING` | no | show the documented-password warning |
| `PUBLIC_RATE_LIMIT_WINDOW_MINUTES` | no | public lead rate-limit window |
| `PUBLIC_RATE_LIMIT_MAX` | no | maximum public lead requests per window |
| `PUBLIC_MIN_FORM_SECONDS` | no | minimum form completion time |
| `DUPLICATE_WINDOW_HOURS` | no | duplicate matching window |

## Campaign and contact defaults

These values seed missing `app_settings` rows on the first database start. After that, values saved in the protected backoffice are authoritative.

| Variable | Required | Description |
|---|---:|---|
| `CAMPAIGN_ENFORCE` | no | technically enforce start/end dates |
| `CAMPAIGN_START` | yes | ISO timestamp with offset |
| `CAMPAIGN_END` | yes | ISO timestamp with offset |
| `CAMPAIGN_TIMEZONE` | yes | default `Europe/Zurich` |
| `SINGLE_PRICE_CHF` | yes | single-mama price |
| `BESTIES_PRICE_CHF` | yes | two-mama price |
| `DAYTIME_HOURS` | yes | public daytime schedule text |
| `WHATSAPP_NUMBER` | production | international digits without `+` or spaces |
| `WHATSAPP_MESSAGE` | no | pre-filled WhatsApp text |
| `NOTIFICATION_EMAIL` | optional | lead-notification recipient |

## Consent-controlled Meta Pixel

| Variable | Required | Description |
|---|---:|---|
| `META_PIXEL_ENABLED` | no | initial enabled state; default `false` |
| `META_PIXEL_ID` | when enabled | numeric Meta Pixel/Dataset ID, 5–30 digits |

The two Meta values only create missing defaults in PostgreSQL. They can then be changed at `/admin/settings` without rebuilding the application. The external Meta script is never loaded until the visitor explicitly chooses **Marketing akzeptieren**.

Prepared browser events:

- `PageView` after consent;
- `ViewContent` on the MAMA-TIME landing page;
- `Contact` on an actual WhatsApp link click;
- `Lead` only after `POST /api/public/leads` returns success and the lead has been committed to PostgreSQL.

See `docs/META_PIXEL_SETUP_DE.md` for the German setup and test procedure.

## SMTP

| Variable | Required | Description |
|---|---:|---|
| `SMTP_HOST` | optional | mail server host |
| `SMTP_PORT` | optional | default `587` |
| `SMTP_SECURE` | optional | TLS mode |
| `SMTP_USER` | optional | SMTP user |
| `SMTP_PASSWORD` | optional | SMTP password |
| `SMTP_FROM` | optional | default sender display/address |

Leads are stored in PostgreSQL even when SMTP is not configured or a notification fails.

## Maintenance safeguards

- `ALLOW_DESTRUCTIVE_RESET=true` permits production lead reset;
- `ALLOW_DESTRUCTIVE_RESTORE=true` permits production restore;
- `ALLOW_JSON_IMPORT=true` permits v1 JSON import in production.

Leave all three false during normal operation.
