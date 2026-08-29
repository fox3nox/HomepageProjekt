# Familienzentrale / Family Command — vollständige technische Übergabe für externes Review

**Stand:** 29. August 2026  
**Produktions-Build:** `v9.2-responsive-pdf`  
**Frontend:** GitHub Pages  
**Backend:** Supabase (PostgreSQL, Storage, Edge Functions)  
**Ziel dieses Dokuments:** Einer externen KI oder einem Entwickler ermöglichen, die App technisch fundiert zu bewerten, ohne private Zugangsschlüssel oder personenbezogene Originaldaten zu veröffentlichen.

> **WICHTIGER SICHERHEITSHINWEIS**  
> Dieses Dokument ist bewusst **sanitisiert**. Es enthält keine privaten Access-Keys, Service-Role-Keys, API-Secrets, privaten Dokumentdateien oder Auth-Tokens. Einige Backend-Funktionen verwenden intern Hashes bzw. Environment-Secrets; diese werden hier nicht offengelegt.

---

## 0. Links für das Review

### Live-App
https://fox3nox.github.io/HomepageProjekt/family-command/

### GitHub-Repository
https://github.com/fox3nox/HomepageProjekt

### Produktiver App-Ordner
https://github.com/fox3nox/HomepageProjekt/tree/main/family-command

### Aktueller Startpunkt
https://github.com/fox3nox/HomepageProjekt/blob/main/family-command/index.html

### CI / Quality Gate
https://github.com/fox3nox/HomepageProjekt/blob/main/.github/workflows/family-command-pro67-check.yml

---

# 1. Was ist die App?

Die **Familienzentrale** ist eine private, mobile-first Familien-PWA für eine einzelne Familie. Sie bündelt:

- Tagesübersicht
- Morgen-Vorschau
- Familienkalender
- Stundenpläne
- Schul-/Kindergarteninformationen
- To-dos
- Hausaufgaben
- Checklisten / Packlisten
- Dokumente & Originale
- Family AI (Text / Sprache / Foto / PDF)
- Push-Erinnerungen
- Cloud-Backups
- Tages-/Wochenplan als PDF

Die App ist historisch iterativ entstanden. Frühere Generationen (V6/V8) wurden in V9 weitgehend aus dem aktiven Laufzeitpfad entfernt, liegen aber teilweise noch im Repository.

---

# 2. Tech-Stack

## Frontend

- **HTML5**
- **CSS3**
- **Vanilla JavaScript / ES6+**
- **kein React**
- **kein Next.js**
- **kein Vue / Angular / Svelte**
- keine klassische Produktions-Bundler-Pipeline
- PWA Manifest
- Service Worker
- Web Push APIs
- Web Share API
- localStorage
- clientseitige PDF-Erzeugung

Der produktive Build besteht aus direkt ausgelieferten HTML/CSS/JS-Dateien. `index.html` übernimmt den Bootvorgang, lädt den privaten App-Kern sowie die V9-Module und zeigt erst danach die sichtbare Oberfläche.

## Backend

- **Supabase**
- **PostgreSQL**
- **Supabase Storage**
- **Supabase Edge Functions**
- Edge Functions in **TypeScript**
- **Deno Runtime**
- `@supabase/supabase-js`
- Web Push / VAPID

## Tests / CI

- GitHub Actions
- Node.js für Syntax-/E2E-Testausführung
- Playwright 1.57
- WebKit
- iPhone-nahe Viewports
- automatische Screenshots
- Architektur-/Regression-Gates
- PNG-Dimensionsprüfung für PWA-Icons

Python gehört **nicht** zur Produktions-App; es wird nur gelegentlich für Hilfs-/CI-Aufgaben verwendet.

---

# 3. Hosting und Deployment

## Frontend

Das Frontend läuft öffentlich über **GitHub Pages**:

`https://fox3nox.github.io/HomepageProjekt/family-command/`

Repository:

`fox3nox/HomepageProjekt`

Produktiver Ordner:

`family-command/`

## Backend

Das Backend läuft in einem Supabase-Projekt und stellt bereit:

- Edge Functions
- PostgreSQL
- privaten Storage
- Push-Daten
- Backup-Snapshots
- Dokumentmetadaten
- Chat-Kommandos
- privaten dynamischen App-Kern

## PWA

`manifest.webmanifest` definiert:

- Name: **Familienzentrale**
- Kurzname: **Familie**
- `display: standalone`
- eigenes Homescreen-Icon
- eigenes Apple-Touch-Icon

Der Service Worker verwendet aktuell den Cache-Namen:

`family-command-v42`

Er verwendet für Navigation Network-First und für Assets einen Cache-/Revalidate-Ansatz.

---

# 4. Aktiver Produktions-Bootpfad

`index.html` ist die zentrale Orchestrierung.

## Kritisch geladene Module

Diese werden im aktuellen V9-Startpfad früh geladen:

- `event-details.js`
- `chat-command-sync.js`
- `app-data-rules.js`
- `v9-data.js`
- `event-delete-fix.js`
- `multi-link-ui.js`
- `v9-app.js`
- `v9-professional.js`
- `homework-originals.js`

## Verzögert geladene Module

Diese werden nach dem initialen Start nachgeladen:

- `push-v2.js`
- `runtime-health.js`
- `family-ai-v2.js`
- `ai-budget-guard.js`
- `family-ai-original-links.js`
- `print-planner-v2.js`
- `backup-manager.js`
- `app-selftest-v6.js`

## Aktive Styles

- `v9.css`
- `v9-professional.css`

## PWA-Dateien

- `index.html`
- `manifest.webmanifest`
- `sw.js`
- `icon.svg`
- `apple-touch-icon.png`
- `icon-192.png`
- `icon-512.png`

## Besonderheit: privater App-Kern

Ein historisch großer JavaScript-Kern wird **nicht direkt aus GitHub geladen**. Er liegt als Text-Asset in Supabase (`fc_private_assets`) und wird über die Edge Function `family-command-private-app` ausgeliefert.

`index.html`:

1. liest den privaten Access-Key aus URL/Cookie/localStorage,
2. lädt den privaten Kern aus Supabase,
3. führt ihn in einer abgeschirmten Legacy-Phase aus,
4. unterbindet dabei Legacy-Timer/MutationObserver,
5. lädt V9 CSS und V9-Module,
6. blendet die App erst nach erfolgreichem V9-Start ein.

Diese Konstruktion entstand, um ältere Renderer/Timer nicht mehr die neue V9-Oberfläche überschreiben zu lassen.

---

# 5. UI-Architektur V9

Der aktuelle zentrale Renderer ist `v9-app.js`.

Er besitzt einen gemeinsamen UI-State für:

- `today`
- `tomorrow`
- `events`
- `homework`
- `more`
- intern zusätzlich `people`

Hauptnavigation:

1. **Heute**
2. **Morgen**
3. **Kalender**
4. **Aufgaben**
5. **Mehr**

V9 wurde eingeführt, um frühere konkurrierende Renderer zu ersetzen und pro Oberfläche eine klarere zentrale Renderlogik zu etablieren.

`v9-professional.js` ergänzt:

- Branding „Familienzentrale“
- Kalender-Polish
- Erkennung vergangener Termine
- einklappbaren Bereich „Vergangene Termine (N) anzeigen“
- Badge „Vergangen“

---

# 6. Datenhaltung — sehr wichtig für die Bewertung

## 6.1 Primärer App-State ist derzeit localStorage-first

Der wichtigste Architekturpunkt:

**Die produktive App verwendet derzeit den Browserzustand als primäre Live-Quelle.**

Haupt-State:

`family-command-personal-v4`

Zusätzliche lokale States existieren u. a. für:

- Checklisten
- Chat-To-do-Cache
- dismissed Chat-To-dos
- Pickup-Regeln
- privaten Access-Key
- private App-Code-Caches

Der historische Kern arbeitet sinngemäß so:

```js
let data = load();

function load() {
  const local = JSON.parse(localStorage.getItem(STORE) || 'null');
  if (local) return local;
  return clone(seed);
}

function save() {
  localStorage.setItem(STORE, JSON.stringify(data));
}
```

### Konsequenz

Supabase ist **noch nicht** die kanonische Live-Datenbank für Termine/Stundenpläne/To-dos/Hausaufgaben.

Das ist für eine persönliche Single-Device-/Single-Family-App funktional, aber für mehrere Geräte oder mehrere Familien technisch unzureichend.

---

## 6.2 Cloud-Snapshots

Der vollständige lokale State wird zusätzlich in Supabase gespeichert:

Tabelle:

`fc_state_snapshots`

Funktion:

`family-command-backups`

Eigenschaften:

- Snapshot des gesamten JSON-State
- SHA-/Fingerprint-Deduplizierung
- unveränderte Zustände werden nicht doppelt gespeichert
- max. 30 unterschiedliche Stände
- manuelles Backup
- automatisches Backup
- Liste alter Stände
- Wiederherstellung
- Sicherung vor Restore

Zum Zeitpunkt dieser Dokumentation existieren mehrere historische Snapshots.

**Das ist Backup/Restore, nicht Realtime-Synchronisation.**

---

## 6.3 Chat → App

Serverseitige Queue:

`fc_chat_commands`

Frontend:

`chat-command-sync.js`

Die App:

1. fragt neue Chat-Kommandos ab,
2. normalisiert z. B. `todo_add`,
3. schreibt sie in den lokalen App-State,
4. hält zusätzlich einen lokalen Chat-To-do-Cache,
5. markiert serverseitige Kommandos als angewendet.

Das System wurde gebaut, damit Einträge, die aus dem Chat heraus erstellt werden, dauerhaft in der App ankommen.

---

## 6.4 Dokumente & Originale

Metadaten:

`fc_private_documents`

Links/Zuordnungen:

`fc_private_document_links`

Temporäre Chat-Upload-Chunks:

`fc_chat_upload_chunks`

Storage:

privater Supabase-Bucket `family-command-private`

Edge Function:

`family-command-documents`

Unterstützte Kernaktionen:

- `GET /list`
- `GET /file?id=...`
- `POST /upload`
- `POST /link`
- `DELETE /delete?id=...`
- `POST /chat-chunk`
- `POST /chat-finalize`

Dateien werden privat gespeichert. Beim Öffnen wird eine **Signed URL mit kurzer Laufzeit** erzeugt.

Maximale Uploadgröße der Dokument-Funktion: ungefähr 15 MB.

Ein Dokument kann über `fc_private_document_links` mit mehreren App-Objekten verknüpft werden.

---

## 6.5 Push

Aktives Frontendmodul:

`push-v2.js`

Aktive Edge Function im aktuellen Clientpfad:

`family-command-push3`

Relevante Tabellen:

- `fc_push_devices_v2`
- `fc_push_config_v2`
- `fc_push_reminder_log`

Aktuell vorgesehene Standardzeiten:

- 06:30 Tagesübersicht
- 19:00 Vorschau für morgen

Auf iOS wird für Web Push die installierte Homescreen-PWA benötigt.

---

# 7. Zugriff / Authentifizierung

## Aktuelles Modell

Es gibt **kein normales App-Login mit E-Mail + Passwort**.

Stattdessen verwendet die App einen privaten gemeinsamen Access-Key.

Frontend speichert ihn unter anderem in:

- Secure/SameSite Cookie
- localStorage `fc-private-access-v1`

Backendfunktionen vergleichen nicht den Klartextschlüssel, sondern einen Hash.

Viele Family-Command-Edge-Functions stehen in Supabase auf `verify_jwt: false`, weil sie eine **eigene Access-Key-Prüfung** implementieren.

## Konsequenz

Das ist ein Single-Family-Zugangsmodell und kein vollständiges Benutzer-/Session-System.

Es gibt derzeit nicht:

- individuelle Elternkonten
- Kinderkonten
- Rollen
- Tenant-ID je Familie
- getrennte Workspaces für mehrere Familien
- Passwort-Reset
- Geräteverwaltung als offizielles Auth-Modell

Supabase Auth existiert im Projekt, wird vom aktuellen produktiven Family-Command-Zugriff aber nicht als normales Login-System verwendet.

---

# 8. Single-Family statt Multi-Tenant

Die App ist konkret auf eine einzelne Familie zugeschnitten.

Im State und in Regeln existieren feste Person-IDs und feste familienbezogene Migrations-/Korrekturlogiken.

Beispiele für technisch hart verdrahtete Bereiche:

- personenspezifische Stundenplanregeln
- Abfahrtsregeln
- Tagesschul-/Abholregeln
- einmalige Terminmigrationen
- einzelne To-do-Migrationen
- Duplikatbereinigungen

`v9-data.js` enthält aktuell beispielsweise eine idempotente einmalige Datenkorrektur für einen konkreten To-do-Eintrag sowie eine Termin-Deduplizierung.

`app-data-rules.js` enthält weitere konkrete familienbezogene Migrations-/Schedule-Regeln.

Für eine SaaS-Version muss dies komplett in generische Datenmodelle/Migrationen überführt werden.

---

# 9. Funktionsumfang

## 9.1 Heute

- aktueller Tageskopf
- nächste wichtige Aktion
- Status je Kind
- Schul-/Kindergartenzeiten
- Abfahrtszeiten
- Schulschluss
- Ferien-/schulfrei-Erkennung
- heutige Termine
- offene To-dos
- Prioritäten
- Pack-/Mitnehm-Erinnerungen
- Vorschau auf morgen

## 9.2 Morgen

- Kinderstatus nächster Tag
- Stundenpläne
- Abfahrt
- Schul-/Kindergartenbeginn
- Ende
- Termine morgen
- To-dos morgen
- Vorbereitungshinweise

## 9.3 Kalender

- Agenda
- Woche
- Monatsnavigation
- Personenfilter
- Mehrpersonen-Termine
- mehrtägige Termine
- Ferien
- Eventdetails
- Bearbeiten
- Löschen
- Originaldokument-Verknüpfungen
- vergangene Termine standardmäßig ausgeblendet
- aufklappbare Vergangenheit
- Badge „Vergangen“

## 9.4 Aufgaben / To-dos

- offene/erledigte To-dos
- Priorität
- Datum
- Tagesabschnitt morgens/tagsüber/abends
- Bearbeitung
- Chat-synchronisierte To-dos
- Hausaufgaben nach Kind
- Fach
- Fälligkeit
- Notiz
- erledigt/offen
- Originalverknüpfung

## 9.5 Schule / Kinderinformationen

- Kinderprofile
- Schule/Kindergarten
- Klasseninformationen
- Lehrpersonen
- Telefonnummern
- Stundenpläne
- Morgen-/Nachmittagsblöcke
- Abfahrtslogik
- Tagesschule
- Ferien
- kindbezogene Hinweise

## 9.6 Schnell hinzufügen

Zentraler `+`-Button für neue Inhalte.

## 9.7 Family AI

Frontend:

`family-ai-v2.js`

Aktive API-Ziel-Funktion:

`family-command-ai-budgeted`

Eingabearten:

- Text
- Sprache
- Foto
- PDF

Kann erkannte Einträge als Review darstellen und u. a. folgende Felder bearbeiten lassen:

- Typ
- Person
- Datum
- Zeit
- Enddatum
- Endzeit
- Titel
- Fach
- Notiz
- Erinnerung

Das System zeigt Konfidenzwerte und verlangt vor Übernahme eine Benutzerprüfung.

Originaldokumente können mit den erzeugten App-Objekten verknüpft werden.

Zusätzlich existiert ein AI-Budget-Guard.

## 9.8 Dokumente & Originale

- privater Storage
- Bilder/PDFs
- Zuordnung zu Person
- Zuordnung zu Event/Hausaufgabe/Quelle
- mehrere Links pro Dokument
- Signed URLs
- Löschen
- Upload über UI
- Upload aus Family AI
- Upload aus Chat in Chunks

## 9.9 PDF / Drucken

Modul:

`print-planner-v2.js`

- Tagesplan
- Wochenplan
- responsive Smartphone-Vorschau
- Kinderzeiten
- To-dos
- Checklisten
- Termine
- Hausaufgaben
- Notizbereich
- clientseitig erzeugte PDF
- Übergabe an native Share-Funktion auf iOS

Die mobile Wochenansicht wurde von einer früheren Desktop-artigen 5-Spalten-Darstellung auf breite mobile Tageskarten umgebaut.

## 9.10 Push / Erinnerungen

- Web Push
- iOS PWA
- Morgenzusammenfassung
- Abendvorschau
- Test-Push
- serverseitige Reminder-Logs

Weitere aktive/ergänzende Family-Command-Funktionen existieren für Smart Reminders und Pickup Alerts.

## 9.11 Backups

- automatische Cloud-Snapshots
- manuelles Backup
- Deduplizierung
- max. 30 Stände
- Restore
- Backup vor Restore

## 9.12 PWA

- Homescreen-installierbar
- Standalone
- eigene Icons
- Service Worker
- Push
- Safe Area
- Cache für statische Assets

---

# 10. Supabase — relevante Tabellen

Die folgenden Tabellen sind für die aktuelle Familien-App direkt relevant:

### Kern / privater App-Code

- `fc_private_assets`
- `fc_state_snapshots`

### Dokumente

- `fc_private_documents`
- `fc_private_document_links`
- `fc_chat_upload_chunks`

### Chat → App

- `fc_chat_commands`
- `fc_chat_ingest_config`

### Push

- `fc_push_devices_v2`
- `fc_push_config_v2`
- `fc_push_reminder_log`

### KI-Budget

- `fc_ai_budget_monthly`
- `fc_ai_budget_reservations`

### Legacy / ältere Generation

- `fc_push_devices` (älter)
- weitere ältere Family-Command-Tabellen/Funktionen können noch existieren

## Andere Tabellen im selben Supabase-Projekt

Im Projekt existieren außerdem `af_*`-Tabellen und andere Tabellen (z. B. aus separaten AI-/Factory-/Landi-Projekten). Diese sind **nicht automatisch Bestandteil des produktiven Family-Command-Laufzeitpfads** und dürfen bei einer Bewertung nicht pauschal der Familien-App zugerechnet werden.

---

# 11. Edge-Function-Inventar

Zum Zeitpunkt dieser Dokumentation existieren mehrere Family-Command-Edge-Functions.

## Aktuell direkt aus dem V9-Client referenziert / klar produktionsrelevant

- `family-command-private-app`
- `family-command-documents`
- `family-command-chat-commands`
- `family-command-backups`
- `family-command-push3`
- `family-command-ai-budgeted`

## Ergänzende produktive/operative Funktionen

- `family-command-smart-reminders`
- `family-command-pickup-alert`
- `family-command-key-bootstrap`
- `family-command-code-audit`
- `family-command-chat-ingest`

## Ältere / kompatible Family-Command-Funktionen, die noch ACTIVE sind

- `family-command-app`
- `family-command-push2`
- `family-command-private-data`
- `family-command-push-diag`
- `family-command-ai`
- `family-command-v9`
- `fc-v9-b0`
- `fc-v9-b1`
- `fc-v9-b2`
- `fc-v9-b3`

Diese aktive Existenz bedeutet **nicht**, dass alle noch im aktuellen Browserpfad verwendet werden. Externes Review sollte prüfen, welche davon stillgelegt/gelöscht werden können.

## Unabhängige Funktionen im selben Supabase-Projekt

Es existieren außerdem `factory-*`-Funktionen. Diese gehören zu anderen Projekten/Experimenten und sind nicht automatisch Teil der Familienzentrale.

---

# 12. Repository-Struktur

Der Ordner `family-command/` enthält grob **55–60 Dateien** inklusive:

- aktuelle V9-Dateien
- CSS
- Service Worker
- Manifest
- Icons
- E2E-Tests
- Diagnostics
- ältere V6/V8/Fix-Dateien

Beispiele älterer Dateien, die weiterhin im Repo liegen, aber vom aktuellen V9-Boot **nicht mehr direkt geladen werden**:

- `screen-redesign-v6.js`
- `screen-redesign-v6.css`
- `v8-shell.js` (falls im Baum vorhanden)
- `v8-ui.js` (falls im Baum vorhanden)
- `today-relevance.js`
- `tomorrow-screen.js`
- `todo-list.js`
- `tomorrow-preview.js`
- `today-addons-stabilizer.js`
- `todo-print-addon.js`
- weitere ältere UI-/Fix-Dateien

Der CI-Workflow prüft ausdrücklich, dass eine Reihe dieser Legacy-Dateien **nicht mehr in `index.html` geladen** wird.

---

# 13. Quality Gate / E2E

Workflow:

`.github/workflows/family-command-pro67-check.yml`

Er prüft u. a.:

## Syntax

`node --check` für die wichtigsten V9-Module.

## Architekturregression

Checks auf:

- aktuelle V9-Version
- V9 Boot
- V9 Renderer
- Professional Layer
- PWA Cache-Version
- PDF-Funktion
- erwartete Datenregeln
- Abwesenheit alter Renderer aus `index.html`

## PWA Icons

Python-Minicheck liest die PNG-Header und verifiziert exakt:

- Apple Touch Icon 180×180
- PWA Icon 192×192

## E2E

Playwright WebKit wird installiert und startet:

`family-command/e2e/ui.spec.mjs`

Der Test prüft reale UI-Flows in WebKit/iPhone-nahen Viewports und erzeugt Screenshots als CI-Artefakte.

---

# 14. Historische Hauptprobleme, die bereits adressiert wurden

Während der Entwicklung traten echte Architekturprobleme auf:

## Mehrere konkurrierende Renderer

Frühere V6/V8-/Patch-Schichten konnten dieselben Seiten mehrfach rendern.

## MutationObserver-/DOM-Feedback-Loops

Es gab Fälle, in denen ein Observer eine DOM-Änderung beobachtete, selbst erneut DOM änderte und dadurch wieder ausgelöst wurde. Das führte zu starkem Flickern und hoher CPU-/Renderlast.

V8.2/V9 entfernten die wichtigsten observer-getriebenen Feedback-Loops aus dem aktiven Pfad.

## Legacy-Timer nach dem Boot

Der private alte Kern konnte Timer/Animationen starten, die später neue V9-DOM-Bereiche veränderten. Der heutige Bootloader führt den privaten Kern deshalb in einer kontrollierten Phase aus und räumt Legacy-Timer/Frames auf.

## PWA-Service-Worker-Versionen

Frühere Caching-Logik konnte query-versionierte Dateien uneindeutig behandeln. Der Service Worker wurde auf kanonische Pfadkeys und versionierte Cache-Namen umgebaut.

## Morgen-To-do / Datenrace

Ein Chat-To-do war serverseitig vorhanden, verschwand aber durch Render-/Cache-Reihenfolge. V9 vereinheitlichte den sichtbaren Renderer und behielt zusätzliche idempotente Datenkorrekturen als Sicherheitsnetz.

---

# 15. Bekannte technische Schulden / offene Probleme

## 15.1 Größtes Problem: localStorage als primäre Source of Truth

Das ist die wichtigste strukturelle Schwäche.

Folgen:

- mehrere Geräte können auseinanderlaufen
- kein Konfliktmodell
- keine echte Realtime-Synchronisation
- lokale Daten können aktueller sein als Cloud-Backup
- Offline/Online-Merges sind nicht formal definiert

**Empfehlung:** kanonisches serverseitiges Datenmodell in PostgreSQL; localStorage/IndexedDB nur noch Cache/Offline-Layer.

---

## 15.2 Keine echte Multi-User-/Multi-Family-Architektur

Aktuell:

- eine Familie
- ein privater Access-Key
- feste Personen
- feste Regeln

Für ein Produkt erforderlich:

- `users`
- `families/workspaces`
- `family_members`
- Rollen
- Tenant-Isolation
- Sessions
- Einladungen
- Ownership
- RLS je Familie

---

## 15.3 Access-Key statt vollständigem Auth-System

Der gemeinsame Access-Key ist besser als öffentlich zugängliche Daten, aber kein ideales langfristiges Auth-Modell.

Risiken:

- langlebiges Bearer-Secret
- bei Leak muss zentral rotiert werden
- keine Person-/Geräteidentität
- keine fein granulierten Rollen

Empfehlung: Supabase Auth + Family/Workspace Tenant + RLS.

---

## 15.4 Viele Edge Functions mit `verify_jwt: false`

Viele Family-Command-Funktionen verwenden bewusst Custom-Auth über `x-fc-access` statt Supabase JWT.

Das sollte im Security-Review besonders untersucht werden:

- CORS
- Rate Limiting
- Replay/Brute Force
- Key Rotation
- Logging
- Missbrauch öffentlicher Endpoints
- Service-Role-Nutzung innerhalb der Functions

---

## 15.5 Zwei Codequellen

Produktiver Code lebt gleichzeitig in:

1. GitHub
2. Supabase `fc_private_assets`

Das erschwert:

- reproduzierbare Builds
- Reviews
- Branching
- Rollbacks
- lokale Entwicklung
- automatisierte Tests

Empfehlung: gesamten App-Core in ein versioniertes privates Git-Repository überführen und Supabase nur deployen, nicht als Quellcode-Speicher verwenden.

---

## 15.6 Legacy-Dateien im Repository

Viele alte Dateien sind nicht mehr aktiv, liegen aber weiter im Baum.

Risiken:

- Verwechslung
- versehentliches Wiederladen
- unnötige Wartung
- erschwerte Reviews

Empfehlung: eindeutiges Archiv/Removal nach Bestätigung des aktiven V9-Pfads.

---

## 15.7 Harte personenbezogene Datenregeln/Migrationen im Frontend

Es existieren konkrete einmalige Family-spezifische Regeln in `v9-data.js` und `app-data-rules.js`.

Das ist für eine Einzel-Familien-App pragmatisch, aber kein gutes generisches Modell.

Empfehlung: Migrationen versionieren und serverseitig bzw. datenmodellbasiert ausführen; keine konkreten Familienereignisse in produktiven UI-Modulen.

---

## 15.8 Öffentliches Repository

Der Code liegt in einem öffentlichen GitHub-Repository.

Private Dokumente und geheime Keys werden nicht dort gespeichert, aber einige öffentliche JS-Dateien enthalten familienbezogene Texte/Regeln.

Empfehlung:

- Repository privat machen **oder**
- alle personenbezogenen Seeds/Migrationen vollständig herauslösen.

---

## 15.9 iOS/PWA-Caching

iOS cached Homescreen-Icons/PWA-Assets aggressiv.

Der aktuelle Service Worker ist deutlich robuster, aber Nutzer können bei installierten PWAs weiterhin verzögerte Asset-/Icon-Updates erleben.

---

## 15.10 Dokumentenbereich aktuell noch in Bereinigung

Zum Zeitpunkt dieser Dokumentation existieren in `fc_private_documents` **8 Metadatensätze**.

Es gibt noch Alt-/Zwischenstände aus einer Wiederherstellung, u. a. mehrere Varianten eines Stundenplandokuments und ältere zu stark komprimierte Wiederherstellungen.

Die sauberen neu gelieferten Originalfotos sollen die alten Wiederherstellungsvarianten endgültig ersetzen und danach dedupliziert werden.

Dieser Punkt ist **noch offen** und darf bei einem Review nicht als vollständig abgeschlossen bewertet werden.

---

## 15.11 Temporäre Chunk-Daten

`fc_chat_upload_chunks` enthält derzeit noch temporäre Datensätze aus Chat-/Dokumentimporten.

Die Dokumentfunktion löscht ältere Chunks nach einer Frist und nach erfolgreichem Finalize. Cleanup sollte dennoch robuster/automatisierter werden.

---

## 15.12 Testabdeckung noch nicht vollständig professionell

Positiv:

- WebKit-E2E
- iPhone-Screenshots
- Syntaxchecks
- Architektur-Gates
- PWA-Icon-Prüfung

Fehlt/ausbaufähig:

- echte Supabase-Integrationstests
- Storage-End-to-End gegen Testprojekt
- Multi-Device-Konflikte
- Offline → Online Reconnect
- Auth-/Security-Tests
- Rate-Limit-Tests
- Disaster-Recovery-Test
- Datenmigrations-Unit-Tests
- Lighthouse-/Performance-Budgets
- systematische Accessibility-Tests

---

# 16. Datenschutz / Sicherheitsgrenzen dieses Review-Dokuments

Bewusst **nicht veröffentlicht**:

- privater Access-Key
- Service-Role-Key
- API-Secrets
- KI-Provider-Secrets
- Push-Private-Key
- private Dokumentbilder
- private Chat-Inhalte
- persönliche Rohdaten aus Backups
- der vollständige private Legacy-App-Core mit personenbezogenen Seeds

Ein externes Review kann trotzdem die Architektur beurteilen, weil:

- das öffentliche V9-Frontend vollständig sichtbar ist,
- aktive Modulgrenzen dokumentiert sind,
- Tabellen/Flows dokumentiert sind,
- Edge-Function-Aufgaben beschrieben sind,
- Sicherheitsmodell und bekannte Schwächen transparent genannt werden.

Für ein tieferes **privates** Audit müsste der Reviewer zusätzlich einen vertraulichen, sanitisierten Export der Supabase-Functions und des privaten Cores erhalten.

---

# 17. Zielarchitektur für eine professionelle V10/V11

Empfohlene Richtung:

```text
PWA / Web Client
       │
       ├─ Supabase Auth
       │
       ▼
Family Workspace / Tenant
       │
       ├─ Members / Roles
       ├─ People / Children
       ├─ Events
       ├─ Tasks
       ├─ Homework
       ├─ Schedules
       ├─ Routines / Checklists
       ├─ Documents
       ├─ Reminders
       └─ Audit / Activity
       │
       ▼
PostgreSQL + RLS
       │
       ├─ Realtime / Sync
       ├─ Edge Functions
       ├─ Storage
       └─ Push / AI
```

Frontend:

- kann weiterhin Vanilla JS bleiben, wenn bewusst gewünscht,
- alternativ React/Next/Vite nur dann, wenn der Mehrwert den Umbau rechtfertigt,
- entscheidender als Framework-Wechsel ist zuerst das Daten-/Auth-/Sync-Modell.

LocalStorage/IndexedDB sollte danach nur noch sein:

- Offline Cache
- optimistic UI
- Queue für noch nicht synchronisierte Writes

und **nicht** die kanonische Datenquelle.

---

# 18. Empfohlene Refactoring-Reihenfolge

## Phase 1 — Bestand einfrieren und inventarisieren

- aktiven V9-Pfad dokumentieren
- Legacy-Dateien markieren
- automatische Regressionstests erweitern
- Dokumentbestand bereinigen
- aktuellen State exportieren

## Phase 2 — Datenmodell

PostgreSQL-Tabellen für:

- families/workspaces
- users/members
- people
- schedules
- events
- tasks
- homework
- routines/checklists
- documents
- document_links
- reminder_rules

## Phase 3 — Auth/Tenant

- Supabase Auth
- Family Workspace
- RLS
- Rollen
- Einladungen

## Phase 4 — Sync

- serverseitige Source of Truth
- Realtime oder gezielter Pull/Push
- Konfliktstrategie
- Offline Queue

## Phase 5 — Migration

- aktuellen localStorage-State importieren
- Snapshots validieren
- harte Family-Regeln in Daten migrieren

## Phase 6 — Legacy entfernen

- privater Core aus `fc_private_assets` nach Git
- alte V6/V8-Dateien entfernen/archivieren
- alte Edge Functions deaktivieren

## Phase 7 — Security/Performance

- JWT/Auth
- Rate Limit
- CSP
- Security Headers
- Logging/Audit
- Performance Budget
- Accessibility

---

# 19. Was sollte beim Refactor NICHT verloren gehen?

Die folgenden Dinge funktionieren konzeptionell gut und sollten erhalten werden:

- mobile-first Informationshierarchie
- fünf einfache Haupttabs
- klare Personenfarben
- Heute/Morgen-Fokus
- vergangene Termine aus Hauptagenda ausblenden
- Dokumente als Originale behalten
- Review-Schritt vor AI-Übernahme
- PDFs clientseitig erzeugen
- iPhone-WebKit-E2E-Tests
- Cloud-Snapshots als zusätzliche Disaster-Recovery-Schicht
- Service Worker/PWA
- Push-Erinnerungen

---

# 20. Auftrag an das Review-Tool / Claude

Bitte analysiere **zuerst**, ohne Änderungen vorzunehmen.

Bewerte mindestens:

1. Architektur 1–10
2. Codequalität 1–10
3. Wartbarkeit 1–10
4. Performance 1–10
5. Security 1–10
6. Datenschutz 1–10
7. PWA/iOS-Qualität 1–10
8. Testqualität 1–10
9. Datenmodell 1–10
10. Skalierbarkeit 1–10

Bitte liefere anschließend:

- die 10 größten Risiken nach Priorität
- welche Teile bereits professionell sind
- welche Legacy-Dateien sicher entfernt werden können
- welche Dateien zuerst refaktoriert werden sollten
- eine Zielarchitektur
- ein serverseitiges Supabase-Schema
- Auth-/RLS-Konzept
- Multi-Device-Sync-Konzept
- Migrationsplan ohne Datenverlust
- Maßnahmen für Security/Privacy
- Performance-/PWA-Verbesserungen
- Teststrategie
- Refactoring-Plan in Phasen

**Wichtig:**

- Nichts erfinden.
- Fakten aus Code/Dokumentation klar von Empfehlungen trennen.
- Wenn Backend-Details wegen Sanitization nicht überprüfbar sind, ausdrücklich kennzeichnen.
- Nicht reflexartig React/Next empfehlen; zuerst begründen, ob ein Frameworkwechsel überhaupt nötig ist.
- Bestehende funktionierende UX nicht unnötig neu bauen.

---

# 21. Kurzfazit

Die Familienzentrale ist inzwischen eine **echte, funktionsreiche persönliche PWA** mit:

- GitHub-Pages-Frontend
- Supabase-Backend
- privatem Storage
- Push
- AI
- Backups
- PDFs
- WebKit-E2E

Sie ist aber architektonisch noch eine **historisch gewachsene Single-Family-App mit localStorage als primärer Live-Datenquelle, Custom-Access-Key-Auth, einem privaten Legacy-Core außerhalb von Git und verbliebenen Legacy-/Migrationselementen**.

Für private persönliche Nutzung ist sie leistungsfähig. Für eine robuste langfristige Plattform oder ein Produkt für mehrere Familien sind **Datenmodell, Auth, Tenant-Isolation, Sync und Code-Konsolidierung** die wichtigsten nächsten Schritte.
