# Security and Privacy

## Operator details supplied for the public legal pages

- Sentinator GmbH
- Hauptstrasse 11
- 9476 Weite
- Switzerland
- `info@sentinator.li`

The built-in imprint and privacy pages contain these details and no business-information placeholders. The responsible operator should still obtain a legal review before publication.

## Implemented application controls

- HTTPS required by production validation and deployment guidance;
- Helmet security headers and a restrictive Content-Security-Policy;
- HttpOnly, Secure and SameSite admin cookie;
- JWT issuer/audience and expiration checks;
- `auth_version` invalidates existing tokens after password changes;
- CSRF token required for state-changing admin requests;
- bcrypt password hashes;
- parameterized PostgreSQL queries;
- transactions, constraints and foreign keys;
- rate limits for public submissions and login;
- honeypot and minimum-fill-time checks;
- HMAC IP hash rather than raw IP storage on leads;
- CSV formula-injection protection;
- sanitized logical JSON export;
- destructive maintenance commands require explicit confirmation and environment flags.

## Meta Pixel consent model

The external script at `connect.facebook.net` is inserted only when all of these conditions are true:

1. the Pixel is enabled in PostgreSQL-backed backoffice settings;
2. a valid numeric Pixel ID is configured;
3. the visitor explicitly selects **Marketing akzeptieren**.

Choosing **Nur notwendige** keeps the Pixel unloaded. Direct visits to protected `/admin` routes also do not initialize the Pixel or show the marketing banner. The footer provides a control to reopen cookie settings. On withdrawal, the integration sends Meta consent revocation when possible and attempts to remove `_fbp` and `_fbc` first-party cookies.

Prepared events are limited to:

- `PageView` after consent;
- `ViewContent` for the landing page;
- `Contact` when a WhatsApp link is actually clicked;
- `Lead` only after the API confirms a successful PostgreSQL write.

A strict allowlist permits only neutral event parameters: campaign/content labels, offer type, contact method, value and currency. The Pixel integration does not send names, email addresses, telephone numbers, bestie details, free-text messages, IP hashes or internal lead references as event parameters.

The production CSP allows only the required Meta script and connection endpoints in addition to same-origin application resources.

## Database security

- keep PostgreSQL on a private network;
- do not publish port 5432 to the internet;
- use unique production credentials;
- use TLS for remote or managed databases;
- limit database-user privileges;
- rotate credentials after developer handoff;
- encrypt backups and restrict access;
- monitor failed connections and storage growth;
- patch PostgreSQL and Node dependencies through controlled releases.

## Personal data and retention

Lead records contain contact details, optional bestie details, workflow notes and marketing attribution. The operator must define and document:

- legal basis and final privacy wording;
- retention and deletion periods;
- backoffice access roles;
- deletion/export handling for data-subject requests;
- processor agreements and cross-border access rules;
- incident response and breach notification procedures.

Use synthetic data in development and staging. Do not copy production leads to unmanaged laptops, public issue trackers or chat tools.

## External developer access

Use named time-limited accounts, MFA, VPN/private access and least privilege. Prefer sanitized staging data. Remove access after acceptance and rotate credentials that were visible during development.
