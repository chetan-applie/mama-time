# QA and Go-live

## Automated checks

Run from the project root:

```bash
npm ci
npm run verify
npm run doctor
npm audit --omit=dev
```

Against the actual staging PostgreSQL instance also run:

```bash
npm run db:migrate
npm run db:status
```

## Database checks

- all migrations applied and checksums valid;
- `admins`, `app_settings`, `leads`, `lead_activities` and `schema_migrations` present;
- missing Meta settings are inserted automatically without changing existing leads;
- bootstrap admin can log in and immediately change the initial password;
- database URL is not a development credential;
- TLS configured when the database is remote;
- backup command completes;
- restore tested on a separate database;
- no demo or test leads remain in production.

## Functional checks

1. Submit a valid single lead.
2. Submit a valid besties lead.
3. Confirm references, stored offer values and attribution.
4. Submit a duplicate and verify linkage/status.
5. Log into the backoffice.
6. Test filters, search and pagination.
7. Update status, assignee, callback and notes.
8. Verify immutable activity history.
9. Verify pipeline and won-revenue calculations.
10. Export CSV and sanitized logical JSON.
11. Update campaign settings and confirm the public page refreshes values.
12. Change the admin password and confirm the prior session is invalid.
13. Review the PostgreSQL status card.
14. Confirm the imprint contains Sentinator GmbH, Hauptstrasse 11, 9476 Weite, Switzerland and `info@sentinator.li`.

## Meta Pixel checks

Use a private browser window plus Meta Test Events and, where available, Meta Pixel Helper.

1. Enable the Pixel and save a valid ID in `/admin/settings`.
2. Clear site storage and reload.
3. Before consent, confirm there is no request to `connect.facebook.net` or `facebook.com/tr`.
4. Choose **Nur notwendige** and confirm the Pixel remains unloaded.
5. Reopen cookie settings from the footer and choose **Marketing akzeptieren**.
6. Confirm `PageView` and one landing-page `ViewContent`.
7. Click WhatsApp and confirm `Contact`.
8. Submit an invalid form and confirm no `Lead`.
9. Simulate or observe an API/database failure and confirm no `Lead`.
10. Submit a successful single form and confirm exactly one `Lead` with `offer_type=single`, `value=550`, `currency=CHF`.
11. Submit a successful besties form and confirm exactly one `Lead` with `offer_type=besties`, `value=990`, `currency=CHF`.
12. Inspect the event payload and confirm that no name, email, phone, message, bestie contact or lead reference is present.
13. Withdraw consent and confirm the script is not loaded again after a reload.

## Responsive/browser matrix

- 360 × 800;
- 390 × 844;
- 430 × 932;
- 768 × 1024;
- 1024 × 768;
- 1440 × 900;
- current Chrome, Safari, Firefox and Edge;
- iOS Safari and Android Chrome;
- keyboard-only navigation and visible focus;
- 200% browser zoom;
- cookie banner buttons and legal links at mobile sizes.

## Go-live gate

Do not launch until HTTPS, operator-approved legal content, credentials, backups, database status, both lead forms, Meta consent/event behavior and the complete backoffice workflow have been signed off.
