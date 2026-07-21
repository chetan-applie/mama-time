# Form and Backoffice Logic

## Public form

The React form supports:

- `single`: CHF 550, one mama;
- `besties`: CHF 990, two mamas.

Bestie name fields become mandatory only for `besties`. The backend remains authoritative even when client-side validation passes.

## Lead creation transaction

The Node service:

1. loads prices and availability from PostgreSQL settings;
2. normalizes email and phone;
3. finds a non-archived matching lead inside the duplicate window;
4. inserts the lead with either `new` or `duplicate` status;
5. links `duplicate_of` when applicable;
6. inserts a `lead_created` or `lead_created_duplicate` activity;
7. commits both records atomically;
8. returns success to the frontend.

Only after step 8 does the consent-controlled browser integration emit a Meta `Lead` event. Client-side validation failures and API/database errors do not emit `Lead`.

The Meta event receives only `content_name`, `content_category`, `offer_type`, campaign value and `currency=CHF`. Contact fields, bestie data, messages and the returned lead reference are not passed to it.

## WhatsApp tracking

A Meta `Contact` event is emitted only when a configured WhatsApp link is actually clicked and marketing consent is active. Opening the lead form because no WhatsApp number is configured does not emit `Contact`.

## Backoffice functions

- secure login/logout and password change;
- dashboard totals, pipeline value, won revenue and conversion rate;
- source and 30-day lead distribution;
- search, filtering, sorting and pagination;
- responsive lead list and detail view;
- direct phone, email and WhatsApp actions;
- status, assignee, callback, notes and lost reason;
- immutable activity history;
- CSV export;
- sanitized JSON backup;
- campaign/settings editor;
- editable Meta Pixel ID and enable/disable switch;
- PostgreSQL connection, size, pool and migration status.

Meta settings are persisted in `app_settings`, become effective on the next public-config refresh and require no frontend rebuild.

## Lead statuses

- `new` – not yet handled;
- `contacted` – first contact made;
- `callback` – follow-up scheduled;
- `won` – membership completed;
- `lost` – not converted;
- `duplicate` – recent matching request;
- `archived` – hidden from normal lists.

## Revenue rules

- single lead value: current single price at lead creation;
- besties lead value: current besties price at lead creation;
- pipeline: `new`, `contacted`, `callback`;
- won revenue: `won` only;
- duplicate leads are excluded from the qualified-conversion denominator.

Prices already stored on a lead do not change when campaign settings are later edited.

## Data exports

CSV is protected by authentication and spreadsheet-formula escaping. The logical JSON export excludes:

- admin password hashes;
- normalized email/phone matching fields;
- IP hashes.

Native database disaster recovery uses `pg_dump`, not the browser export.
