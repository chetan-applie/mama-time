# API Reference

All API responses use JSON unless stated otherwise. Admin authentication uses a same-origin HttpOnly cookie.

## Public

### `GET /api/health`

Checks PostgreSQL and returns service, version, environment, storage type and server time.

### `GET /api/public/config`

Returns public campaign configuration and computed values, including:

- campaign dates, status and enforcement state;
- single and besties prices, savings and per-person value;
- daytime hours, company display name and location;
- form availability and WhatsApp configuration;
- `metaPixelEnabled` – true only when enabled and the stored ID is valid;
- `metaPixelId` – numeric ID or an empty string.

The public endpoint never returns database credentials, admin configuration or secrets.

### `POST /api/public/leads`

Creates a single or besties lead. Success: HTTP 201 with `reference`, `duplicate` and a German confirmation message.

Important body fields:

- `offer_type`: `single` or `besties`;
- mama contact fields;
- bestie fields for `besties`;
- `preferred_contact`;
- `start_preference`;
- `privacy`;
- honeypot/timing fields;
- UTM, click IDs, referrer and landing URL.

The frontend emits the Meta `Lead` event only after this endpoint returns success. The API itself does not call Meta and does not expose contact data to the Pixel integration.

## Admin authentication

- `POST /api/admin/auth/login`
- `GET /api/admin/auth/me`
- `POST /api/admin/auth/logout` – CSRF required
- `POST /api/admin/auth/change-password` – CSRF required

## Admin leads

- `GET /api/admin/stats`
- `GET /api/admin/leads`
- `GET /api/admin/leads/:id`
- `PATCH /api/admin/leads/:id` – CSRF required
- `GET /api/admin/leads/export.csv`
- `GET /api/admin/backup.json`

Lead-list query parameters: `q`, `status`, `offer`, `source`, `dateFrom`, `dateTo`, `sort`, `page`, `perPage`, `includeArchived`.

## Admin settings and system

### `GET /api/admin/settings`

Returns the editable campaign settings, including:

- `campaign_name`, `company_name`, `company_location`;
- dates, timezone and enforcement;
- prices and daytime hours;
- WhatsApp and notification values;
- `meta_pixel_enabled` as a boolean;
- `meta_pixel_id` as the stored numeric string or empty string;
- `form_enabled`.

### `PATCH /api/admin/settings`

CSRF-protected. Validates and stores the same settings in PostgreSQL. A Pixel ID must contain 5–30 digits; it is required when `meta_pixel_enabled=true`.

### `GET /api/admin/system/database`

Returns PostgreSQL engine, database name/version/size, connection-pool information and migration state.

## Error codes

- `400` invalid timing/request;
- `401` unauthenticated/expired;
- `403` invalid CSRF;
- `404` missing resource;
- `410` campaign/form unavailable;
- `422` validation error;
- `429` rate limit;
- `500` unexpected server or database error.
