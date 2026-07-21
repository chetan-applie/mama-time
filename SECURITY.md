# Security Reporting

Do not submit real customer data, administrator credentials, database dumps, Pixel IDs tied to private accounts or production `.env` files in public issue trackers or chat. Report security issues privately to the responsible Sentinator GmbH technical contact at `info@sentinator.li`. Include the affected route, reproduction steps, impact and logs with personal data removed.

The application uses PostgreSQL, protected administrator sessions, CSRF protection, rate limiting, parameterized SQL, a restrictive Content-Security-Policy and consent-controlled Meta Pixel loading. Production deployments must use HTTPS, unique secrets, restricted database access and tested backups.
