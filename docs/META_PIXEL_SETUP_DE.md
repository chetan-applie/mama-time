# Meta Pixel – Einrichtung und Test für MAMA TIME v2.1.0

Diese Version verwendet React, Node.js/Express und PostgreSQL. Die Pixel-ID wird im Backoffice gespeichert und über die öffentliche Konfigurations-API an das Frontend ausgeliefert.

## 1. Voraussetzungen

- Anwendung und PostgreSQL-Datenbank sind gestartet;
- alle Migrationen sind angewendet;
- die öffentliche Website läuft über HTTPS;
- ein Meta-Datensatz beziehungsweise Pixel ist im Meta Events Manager vorhanden;
- die numerische Pixel-ID ist bekannt.

## 2. Pixel-ID im Backoffice eintragen

1. Als Administrator anmelden.
2. `/admin/settings` öffnen.
3. Zum Abschnitt **Tracking & Meta Pixel** scrollen.
4. Die numerische Pixel-ID eintragen, zum Beispiel `123456789012345`.
5. **Meta Pixel nach Marketing-Einwilligung aktivieren** einschalten.
6. Einstellungen speichern.
7. Die öffentliche Seite neu laden.

Alternativ können Startwerte in `.env` gesetzt werden:

```env
META_PIXEL_ENABLED=true
META_PIXEL_ID=123456789012345
```

Beim ersten Datenbankstart werden diese Werte als fehlende Schlüssel in `app_settings` eingefügt. Danach sind die im Backoffice gespeicherten PostgreSQL-Werte die aktive Quelle.

## 3. Einwilligung testen

1. Privates Browserfenster öffnen.
2. Entwicklerwerkzeuge → Netzwerk öffnen.
3. Landingpage laden.
4. Vor einer Entscheidung im Banner darf kein Request an `connect.facebook.net` oder `facebook.com/tr` erscheinen.
5. **Nur notwendige** wählen: Der Pixel bleibt deaktiviert.
6. Im Footer **Cookie-Einstellungen** öffnen.
7. **Marketing akzeptieren** wählen.
8. Jetzt darf `fbevents.js` geladen werden.

Die Entscheidung wird im Browser unter `mama_time_marketing_consent_v1` gespeichert. Auf direkten `/admin`-Aufrufen wird der Pixel nicht initialisiert und das Marketing-Banner nicht angezeigt.

## 4. Erwartete Events

Im Meta Events Manager den Bereich **Test-Events** öffnen und die Website in demselben Browser verwenden.

| Nutzeraktion | erwartetes Event |
|---|---|
| Marketing akzeptieren beziehungsweise neue Seite mit vorhandener Zustimmung laden | `PageView` |
| MAMA-TIME-Landingpage aufrufen | `ViewContent` |
| WhatsApp-Link tatsächlich anklicken | `Contact` |
| Formular erfolgreich absenden und HTTP 201 erhalten | `Lead` |

Das `Lead`-Event wird im Frontend erst nach erfolgreicher Antwort der Node-API ausgelöst. Folgende Vorgänge dürfen kein `Lead` erzeugen:

- Klick auf den Submit-Button ohne gültige Daten;
- fehlende Datenschutzeinwilligung;
- serverseitige Validierungsfehler;
- deaktiviertes Formular;
- abgelaufener erzwungener Kampagnenzeitraum;
- Datenbank- oder Netzwerkfehler.

## 5. Übermittelte Eventparameter

Die Integration verwendet eine feste Positivliste. Zulässig sind nur:

```text
content_name
content_category
content_type
offer_type
contact_method
value
currency
```

Nicht als Pixel-Eventparameter versendet werden:

- Vor- und Nachname;
- E-Mail-Adresse;
- Telefonnummer;
- Bestie-Kontaktdaten;
- Freitextnachricht;
- interne Lead-ID oder Lead-Referenz;
- IP-Hash;
- UTM- und Klickkennungen aus dem Formularobjekt.

## 6. Meta Pixel Helper

Mit der Browser-Erweiterung Meta Pixel Helper kontrollieren:

- richtige Pixel-ID;
- `PageView` und `ViewContent` jeweils einmal;
- `Contact` beim WhatsApp-Klick;
- `Lead` nur nach erfolgreicher Anfrage;
- `value` und `currency=CHF` beim Lead;
- `offer_type` ist `single` oder `besties`.

## 7. Einwilligung widerrufen

1. Im Footer **Cookie-Einstellungen** öffnen.
2. **Nur notwendige** wählen.
3. Die Integration sendet `consent revoke` an ein bereits geladenes Pixel.
4. Die Anwendung versucht, `_fbp` und `_fbc` auf Host- und Root-Domain zu löschen.
5. Nach einem Seiten-Neuladen darf das externe Meta-Skript nicht erneut geladen werden.

## 8. Content-Security-Policy

Im Produktionsmodus sind zusätzlich freigegeben:

```text
script-src https://connect.facebook.net
connect-src https://connect.facebook.net https://www.facebook.com
```

Bildanfragen über HTTPS sind bereits durch `img-src https:` erlaubt.

## 9. PostgreSQL und Deployment

Es ist keine neue Tabelle erforderlich. Die Schlüssel werden über `ensureDefaultSettings()` automatisch angelegt:

```text
meta_pixel_enabled
meta_pixel_id
```

Vor dem Deployment:

```bash
npm ci
npm run db:migrate
npm run verify
npm run db:status
npm audit --omit=dev
```

Nach dem Deployment eine echte Einzel- und Besties-Testanfrage durchführen und anschliessend die Testleads entfernen oder klar als Test markieren.
