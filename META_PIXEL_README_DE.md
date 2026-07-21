# MAMA TIME v2.1.0 – Meta Pixel und PostgreSQL integriert

Der Meta Pixel ist bereits vollständig in den aktuellen React-/Node-/PostgreSQL-Build eingebaut. Es muss kein Pixel-Code manuell in HTML- oder React-Dateien kopiert werden.

## Enthaltene Funktionen

- Pixel-ID und Aktivierung direkt im geschützten Backoffice;
- Speicherung der Tracking-Einstellungen in PostgreSQL (`app_settings`);
- Marketing-Einwilligungsbanner im MAMA-TIME-Design;
- kein Laden von `connect.facebook.net` vor ausdrücklicher Zustimmung;
- `PageView` nach erteilter Marketing-Einwilligung;
- `ViewContent` auf der MAMA-TIME-Landingpage;
- `Contact` beim tatsächlichen Klick auf WhatsApp;
- `Lead` erst nach einer erfolgreich in PostgreSQL gespeicherten Formularanfrage;
- kein `Lead` bei Validierungs-, Netzwerk- oder Serverfehlern;
- sichere Parameter-Positivliste: Namen, E-Mail-Adressen, Telefonnummern, Nachrichten, Bestie-Daten und Lead-Referenzen werden nicht als Meta-Eventparameter versendet;
- Content-Security-Policy für die erforderlichen Meta-Endpunkte;
- Cookie-Einstellungen im Footer erneut aufrufbar;
- Betreiberangaben der Sentinator GmbH in Impressum und Datenschutzerklärung;
- deutschsprachige Einrichtungs- und Testanleitung.

## Nach dem Deployment

1. Öffne `https://sentinators.ch/admin/settings`.
2. Scrolle zu **Tracking & Meta Pixel**.
3. Trage die numerische Pixel-ID aus dem Meta Events Manager ein.
4. Aktiviere **Meta Pixel nach Marketing-Einwilligung aktivieren**.
5. Speichere die Einstellungen.
6. Öffne die Landingpage in einem privaten Browserfenster.
7. Prüfe zuerst **Nur notwendige**: Das Meta-Skript darf nicht geladen werden.
8. Öffne die Cookie-Einstellungen im Footer erneut und wähle **Marketing akzeptieren**.
9. Prüfe im Meta Events Manager unter **Test-Events** nacheinander `PageView`, `ViewContent`, `Contact` und `Lead`.

Ausführliche Schritte: `docs/META_PIXEL_SETUP_DE.md`.

## Datenbankhinweis

Die neuen Einstellungen `meta_pixel_enabled` und `meta_pixel_id` werden beim ersten Start automatisch als fehlende Schlüssel in `app_settings` ergänzt. Es ist keine manuelle Tabellenänderung erforderlich. Bestehende Leads und PostgreSQL-Daten bleiben unverändert.

## Rechtlicher Hinweis

Impressum und Datenschutzerklärung enthalten die vom Auftraggeber gelieferten Betreiberangaben:

- Sentinator GmbH
- Hauptstrasse 11
- 9476 Weite
- Schweiz
- info@sentinator.li

Die Inhalte sollten vor Veröffentlichung dennoch durch die verantwortliche Stelle rechtlich geprüft werden.
