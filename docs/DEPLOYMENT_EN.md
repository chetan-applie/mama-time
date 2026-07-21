# Deployment Guide

## Option A – Docker Compose (recommended for a single host)

```bash
npm ci
npm run setup -- --docker=1 \
  --production=1 \
  --base-url=https://sentinators.ch \
  --admin-email=info@sentinator.li \
  --whatsapp=41790000000

docker compose up -d --build
docker compose ps
docker compose logs -f mama-time
```

Compose creates:

- `db`: PostgreSQL 17 with a persistent named volume;
- `mama-time`: React production build + Node API;
- optional `adminer` profile bound only to localhost.

The application container runs migrations before Node starts.

### Docker backup

```bash
docker compose exec mama-time npm run db:backup
```

Copy the dump out of the container or mount a protected backup directory.

## Option B – Managed PostgreSQL + systemd

1. Create a Linux service account and application directory.
2. Install Node.js, npm and PostgreSQL client tools.
3. Copy the project and create `.env`.
4. Use a managed PostgreSQL `DATABASE_URL`.
5. Run:

```bash
npm ci
npm run db:migrate
npm run build
npm run doctor
# Optional after a successful build: npm prune --omit=dev
```

6. Install `deployment/mama-time.service.example` as a systemd unit.
7. Put Nginx in front using `deployment/nginx.conf.example`.
8. Enable HTTPS before exposing the site.

## Option C – PM2

Run migrations once during deployment:

```bash
npm run db:migrate
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

PostgreSQL supports multiple Node instances, but increase instances only after sizing the combined database connection pools and verifying sticky-session requirements are not introduced by future features.

## Nginx requirements

- redirect HTTP to HTTPS;
- proxy to `127.0.0.1:3000`;
- forward `X-Forwarded-Proto` and client IP headers;
- set `TRUST_PROXY` correctly;
- never serve source, `.env`, backups or database ports;
- preserve same-origin behavior for auth cookies and CSRF.

## Deployment sequence

1. Back up the current production database.
2. Deploy code to a new release directory/container image.
3. Install exact dependencies with `npm ci`.
4. Apply migrations.
5. Build React.
6. Run automated tests and doctor.
7. Start/restart Node.
8. Check `/api/health`.
9. Perform login, single/besties lead and Meta-consent smoke checks.
10. Enter the Pixel ID in `/admin/settings`, then verify Test Events.
11. Monitor logs and database connections.

## Rollback

Application rollback is safe only when the previous version is compatible with the migrated schema. Prefer backward-compatible additive migrations. For destructive schema changes, document a database rollback or restore plan before deployment.

## Post-deployment Meta Pixel activation

The application contains the integration but ships without an active private Pixel ID. After deployment:

1. open `/admin/settings`;
2. enter the numeric Meta Pixel/Dataset ID;
3. enable the Pixel and save;
4. use a private browser window to verify no Meta request occurs before consent;
5. accept marketing and test `PageView`, `ViewContent`, WhatsApp `Contact` and successful-form `Lead`;
6. confirm failed forms do not create a `Lead`.

See `docs/META_PIXEL_SETUP_DE.md`.
