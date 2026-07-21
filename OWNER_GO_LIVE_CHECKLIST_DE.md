# MAMA TIME – Go-live-Checkliste für Sentinators Gym

Dieses Paket verwendet eine echte PostgreSQL-Datenbank und enthält die einwilligungsgesteuerte Meta-Pixel-Integration.

## Vor dem Livegang zwingend erledigen

1. Produktionsdomain festlegen und HTTPS aktivieren.
2. PostgreSQL-Datenbank inklusive eigenem Benutzer und starkem Passwort bereitstellen.
3. Im Projektstamm `npm ci` ausführen.
4. Produktionskonfiguration erstellen:

   ```bash
   npm run setup -- --production=1 \
     --base-url=https://IHRE-DOMAIN.CH \
     --database-url=postgresql://BENUTZER:PASSWORT@DB-HOST:5432/DATENBANK \
     --admin-email=IHRE-ADMIN-EMAIL \
     --whatsapp=41XXXXXXXXX
   ```

5. Ausgegebenes Admin- und Datenbankpasswort sofort in einem Passwortmanager speichern.
6. Datenbankmigrationen ausführen: `npm run db:migrate`.
7. Datenbank prüfen: `npm run db:status`.
8. In `.env` bei Bedarf SMTP-Daten und Empfängeradresse ergänzen.
9. Betreiberangaben im Impressum kontrollieren: Sentinator GmbH, Hauptstrasse 11, 9476 Weite, Schweiz, `info@sentinator.li`.
10. Impressum und Datenschutzerklärung vor Veröffentlichung rechtlich prüfen.
11. `npm run verify`, `npm run doctor` und `npm audit --omit=dev` erfolgreich ausführen.
12. Auf Staging eine Einzelanfrage und eine Besties-Anfrage absenden.
13. Im Backoffice Lead, Status, Notiz, Rückrufdatum, Aktivitätsverlauf, CSV und JSON-Export kontrollieren.
14. Ein PostgreSQL-Backup erstellen: `npm run db:backup`.
15. Wiederherstellung auf einer separaten Testdatenbank einmal durchführen und dokumentieren.
16. Erst nach allen Tests den Kampagnenzeitraum technisch erzwingen.

## Meta Pixel

1. Im Meta Events Manager die numerische Pixel-/Datensatz-ID kopieren.
2. `/admin/settings` öffnen.
3. Unter **Tracking & Meta Pixel** die ID eintragen.
4. **Meta Pixel nach Marketing-Einwilligung aktivieren** einschalten und speichern.
5. In einem privaten Browserfenster prüfen, dass vor einer Einwilligung kein Meta-Skript geladen wird.
6. **Nur notwendige** wählen und erneut prüfen: kein Pixel.
7. Cookie-Einstellungen im Footer öffnen und **Marketing akzeptieren** wählen.
8. Im Bereich **Test-Events** prüfen:
   - `PageView`;
   - `ViewContent`;
   - `Contact` beim WhatsApp-Klick;
   - `Lead` genau einmal nach erfolgreicher Formularanfrage.
9. Sicherstellen, dass Validierungs- und Serverfehler kein `Lead` auslösen.
10. Testanfragen vor dem Kampagnenstart löschen oder eindeutig markieren.

Ausführliche Anleitung: `docs/META_PIXEL_SETUP_DE.md`.

## Festgelegtes Angebot

- Einzelangebot: **CHF 550.– pro Mama**, Membercard inklusive.
- Besties-Angebot: **CHF 990.– für zwei Mamas**, zwei Membercards inklusive.
- Ersparnis: **CHF 110.– insgesamt**, entsprechend **10 %**.
- Effektiver Duo-Preis: **CHF 495.– pro Mama**.
- Aktionszeitraum: **20. Juli 2026 bis 20. August 2026**.
- Ausgangswert Daytime: **Montag bis Freitag, 08:00–16:30 Uhr**.

## Backup-Grundregel

- täglich automatisches `pg_dump`;
- Backup verschlüsselt oder auf geschütztem Speicher ablegen;
- mindestens eine Kopie ausserhalb des Webservers;
- Aufbewahrungsdauer und Löschung intern festlegen;
- Wiederherstellung regelmässig testen.

## Nicht im ZIP enthalten

- keine echten Kundendaten;
- keine produktive `.env`;
- keine produktiven Passwörter oder Secrets;
- keine SMTP-Zugangsdaten;
- keine aktive Meta-Pixel-ID;
- kein `node_modules`-Ordner;
- keine externe laufende PostgreSQL-Instanz ausserhalb des Docker-Compose-Angebots.
