# Data Storage and Scaling

## Current architecture

All production data is stored in PostgreSQL. The previous atomic JSON store has been removed from runtime code.

Benefits:

- transactional writes;
- concurrent Node processes;
- indexed search/filtering;
- referential integrity;
- reliable backup/restore tooling;
- managed-database compatibility;
- straightforward future reporting/CRM integration.

## Scaling controls

- keep `DATABASE_POOL_MAX` conservative;
- calculate total connections as pool size × Node instances;
- add application replicas only behind a shared PostgreSQL database;
- monitor slow queries and index usage;
- archive/delete data according to retention policy;
- use managed backups and point-in-time recovery where available;
- consider read replicas only when reporting load justifies them.

## Future extensions

The schema can be extended for:

- multiple campaigns;
- structured staff accounts/roles;
- contact attempt records;
- membership/payment integration;
- webhook/event outbox;
- CRM synchronization;
- analytics warehouse export.

Each change must use a new migration and preserve the public API unless the frontend is deployed simultaneously.
