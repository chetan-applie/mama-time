# Migration from the v1 JSON Store

The v2 package contains `backend/scripts/import-json.js` for a v1 `mama-time.json` file.

## Safe procedure

1. Stop the old application so the JSON file cannot change.
2. Copy the old file to protected backup storage.
3. Provision and migrate the PostgreSQL database.
4. Confirm the target database has no leads.
5. Run:

```bash
npm run db:import-json -- --file=/absolute/path/mama-time.json
```

6. Compare lead, activity and admin counts.
7. Test several leads and duplicate links in the backoffice.
8. Change the admin password after migration.
9. Keep the old JSON backup read-only until sign-off.

## Replacing existing PostgreSQL leads

Only after a verified database backup:

```bash
ALLOW_JSON_IMPORT=true npm run db:import-json -- \
  --file=/absolute/path/mama-time.json \
  --replace=1
```

`--replace=1` removes leads and activities in the target database but preserves/upserts administrators and settings. Never run it casually in production.

## What is migrated

- campaign settings;
- administrators and existing bcrypt hashes;
- leads and duplicate relationships;
- activities and admin actor mappings;
- timestamps and attribution data.
