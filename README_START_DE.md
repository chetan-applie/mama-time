# MAMA TIME v2.1.0 – Start und Deployment

Dieses Paket ist der vollständige React-/Node-/PostgreSQL-Produktionsbuild für die MAMA-TIME-Kampagne inklusive geschütztem Backoffice und einwilligungsgesteuertem Meta Pixel.

## Enthalten

- responsive Landingpage und Formulare;
- PostgreSQL-Datenbank mit SQL-Migrationen;
- Lead-Backoffice, Status, Notizen, Exporte und Datenbankstatus;
- Pixel-ID und Aktivierung direkt unter `/admin/settings`;
- MAMA-TIME-Cookie-Banner;
- `PageView`, `ViewContent`, WhatsApp-`Contact` und erfolgreicher `Lead`;
- kein Meta-Skript vor ausdrücklicher Marketing-Einwilligung;
- Impressum und Datenschutz mit den Angaben der Sentinator GmbH;
- Docker Compose, Nginx-, systemd- und PM2-Beispiele;
- Backup-, Restore- und v1-JSON-Import-Werkzeuge.

## Schnellstart mit Docker Compose

```bash
npm ci
npm run setup -- --docker=1 \
  --production=1 \
  --base-url=https://sentinators.ch \
  --admin-email=info@sentinator.li \
  --whatsapp=41XXXXXXXXX

docker compose up -d --build
```

Das Setup zeigt sichere Zufallspasswörter an. Diese sofort in einem Passwortmanager speichern. Die erzeugte `.env` niemals veröffentlichen oder in Git einchecken.

## Ohne Docker

Eine erreichbare PostgreSQL-Datenbank und PostgreSQL-Clientwerkzeuge werden benötigt.

```bash
npm ci
npm run setup -- --production=1 \
  --base-url=https://sentinators.ch \
  --database-url=postgresql://BENUTZER:PASSWORT@HOST:5432/DATENBANK \
  --admin-email=info@sentinator.li \
  --whatsapp=41XXXXXXXXX
npm run db:migrate
npm run verify
npm run doctor
npm start
```

## Backoffice und Meta Pixel

Nach dem Deployment:

1. `https://sentinators.ch/admin` öffnen und anmelden.
2. Das Bootstrap-Passwort sofort ändern.
3. `https://sentinators.ch/admin/settings` öffnen.
4. Unter **Tracking & Meta Pixel** die numerische Pixel-/Datensatz-ID eintragen.
5. Pixel aktivieren und speichern.
6. Einwilligung und Events nach `docs/META_PIXEL_SETUP_DE.md` testen.

## Rechtliche Angaben im Build

- Sentinator GmbH
- Hauptstrasse 11
- 9476 Weite
- Schweiz
- info@sentinator.li

Die Texte sind technisch eingesetzt; die rechtliche Endfreigabe liegt bei der verantwortlichen Betreiberin.

## Vor dem Livegang

```bash
npm run db:migrate
npm run db:status
npm run verify
npm run doctor
npm audit --omit=dev
npm run db:backup
```

Danach Einzel- und Besties-Anfrage, Backoffice, Backup-Wiederherstellung sowie alle Meta-Test-Events auf der Staging-/Produktionsumgebung prüfen.

Ausführliche Checkliste: `OWNER_GO_LIVE_CHECKLIST_DE.md`.
