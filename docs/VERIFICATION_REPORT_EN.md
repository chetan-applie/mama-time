# Verification Report – Version 2.1.0

Verification date: 21 July 2026

## Scope

The complete React/Vite frontend, Node.js/Express API, PostgreSQL persistence layer, SQL migrations, protected backoffice, legal pages, consent-controlled Meta Pixel integration, deployment configuration and documentation were reviewed for the v2.1.0 deliverable.

## Clean-install verification

A separate clean copy was created without `node_modules` or a private `.env`. Exact dependencies were installed from `package-lock.json` using:

```bash
npm ci --no-audit --no-fund
```

The clean install completed successfully. Node.js v22.16.0 and npm 10.9.2 were used in the verification environment. Exact top-level versions are recorded in `docs/DEPENDENCY_VERSIONS.txt`.

## React production build

`npm run verify` rebuilt the Vite production bundle successfully:

- 38 modules transformed;
- production HTML, CSS and JavaScript generated in `frontend/dist/`;
- frontend source/build checker passed;
- CookieConsent, Meta Pixel adapter, legal operator data and backoffice Meta settings are included in the compiled bundle;
- no source-level legal placeholders remain.

## Node/API integration tests

The backend suite passed against `pg-mem`, using the same `pg`-compatible adapter contract as production:

- SQL migrations and bootstrap administrator;
- PostgreSQL health and public campaign configuration;
- invalid form rejection;
- single and besties lead creation;
- duplicate detection;
- admin login and CSRF;
- database status endpoint;
- lead list/detail and workflow update;
- dashboard and revenue calculation;
- CSV export;
- rejection of an invalid enabled Pixel ID;
- settings update including valid `meta_pixel_enabled` and `meta_pixel_id`;
- public-config reflection of valid Meta settings;
- sanitized logical JSON backup;
- password change and session invalidation.

Result: **3 tests passed, 0 failed**.

## Meta Pixel implementation review

The reviewed integration implements the requested behavior:

- Pixel ID and enable/disable state are stored in PostgreSQL `app_settings`;
- missing Meta setting keys are inserted non-destructively by `ensureDefaultSettings()`;
- the external Meta script is not inserted before explicit marketing consent and direct `/admin` routes are excluded from initialization;
- `PageView` is emitted after consent;
- landing-page `ViewContent` is emitted once;
- WhatsApp `Contact` is tied to an actual configured link click;
- `Lead` is emitted only after the public lead API returns success following a committed database transaction;
- client validation and API/network/database errors do not reach the success tracking call;
- a strict allowlist permits only neutral parameters (`content_name`, `content_category`, `content_type`, `offer_type`, `contact_method`, `value`, `currency`);
- contact data, bestie details, messages, IP hashes and internal lead references are not supplied to the Pixel adapter;
- cookie settings can be reopened and consent can be withdrawn;
- production CSP allows the required Meta endpoints.

Real Meta Test Events still require the receiving team’s actual Pixel ID and a browser connected to the production/staging Meta account.

## Security and static checks

Completed checks:

```bash
npm audit --omit=dev
find backend frontend/src frontend/scripts tools -type f ... | xargs node --check
npm run doctor
```

Results:

- production dependency audit: **0 known vulnerabilities** at verification time;
- JavaScript/MJS syntax checks: passed;
- doctor: passed with the expected warning that no private `.env` is included;
- React production build present;
- two SQL migration files present;
- no customer data, database dump, private Pixel ID, production secret or `.env` is included.

Docker was not installed in the build environment, so `docker compose config` and a live Compose launch were not executed here.

## Legal content check

The public imprint and privacy page contain the supplied operator data:

- Sentinator GmbH;
- Hauptstrasse 11;
- 9476 Weite;
- Switzerland;
- `info@sentinator.li`.

The privacy page documents PostgreSQL form storage, attribution data, WhatsApp behavior, Meta consent, prepared events, parameter exclusions, withdrawal and data-subject contact. Final legal approval remains the operator’s responsibility.

## Required deployment-environment acceptance

The build environment did not provide the recipient’s persistent PostgreSQL server, production domain, Meta Pixel account or Docker daemon. Before public launch, the receiving team must therefore complete:

1. create a production `.env` with unique secrets and a real PostgreSQL URL;
2. run `npm run db:migrate` and `npm run db:status` against the actual staging/production database;
3. submit one single and one besties test lead;
4. complete the protected backoffice smoke test;
5. run and restore a `pg_dump` backup on a separate database;
6. enable HTTPS and verify secure cookies/reverse-proxy configuration;
7. enter the real Pixel ID at `/admin/settings`;
8. execute every consent and event step in `docs/META_PIXEL_SETUP_DE.md`;
9. confirm `Lead` occurs exactly once only after successful database storage;
10. remove or clearly mark all staging test leads before launch.

These are environment-specific acceptance tasks, not missing application features.
