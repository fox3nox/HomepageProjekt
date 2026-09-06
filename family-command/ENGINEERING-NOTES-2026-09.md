# Familienzentrale: Zuverlässigkeit und täglicher Fokus

Stand: 6. September 2026. Bestandsaufnahme vor der Umsetzung auf main
`047e52e` (PR #152), keine offenen PRs. Die erste Korrekturgruppe wurde über
[#153](https://github.com/fox3nox/HomepageProjekt/pull/153) ausgeliefert.

## Bestehende Architektur

- Vanilla JS ohne Frameworkwechsel. `core-runtime.js` stellt den lokalen
  Schnellcache, Datum, Stundenplan und Erinnerungsregeln bereit.
- Supabase bleibt kanonisch: revisionierte Zustandszeile, atomarer Schreib-RPC,
  Projektion auf normalisierte `fc_*_v1`-Tabellen und separate Dokumentbeziehungen.
  RLS und privilegierte Schreibfunktionen wurden lesend geprüft. Keine Migration,
  keine Änderung von Zugangsdaten oder Produktionsdatensätzen.
- `cloud-state.js` führt Dreiwege-Merges und Tombstones zusammen. Ein persistiertes
  Journal bewahrt ungesendete Offline-Änderungen auch über einen Neustart. Eine
  Serverantwort darf Eingaben während eines laufenden Speichervorgangs nicht löschen.
- `v9-app.js` besitzt Navigation und Bearbeitungsaktionen.
  `reference-dashboard-v36.js` präsentiert dieselbe Heute-Ansicht auf Telefon und PC.
  Der dahinterliegende Basis-Renderer bleibt für vorhandene Daten-/Modulhaken im DOM
  und wird mit `inert` aus der Tastatur-/Assistenznavigation genommen.
- Der Reference-Loader lädt weitere mobile Darstellungen. Viele ältere CSS-Schichten
  sind noch aktiv. Nur nachweislich redundantes Verhalten wurde entfernt: doppeltes
  Laden des Zukunftsfilters, globale Löschdurchläufe über DOM-Aufgaben, doppelte
  Packnotizen und der Beobachter des gesamten Heute-Unterbaums im Dashboard.
- Der Header bleibt im vorhandenen nativen Rendering. Keine neuen Canvas-,
  Compositing- oder Text-Timer-Eingriffe. Die Uhr der Heute-Ansicht aktualisiert
  zeitabhängige Inhalte bei Rückkehr und beim Minutenwechsel.

## Priorität und Umsetzung

| Priorität | Befund | Ergebnis |
| --- | --- | --- |
| P0 | Änderungen während Speichern/Konflikt oder nach Offline-Neustart gehen verloren | Persistiertes Merge-Journal und Berücksichtigung neuerer Eingaben; vier Lifecycle-Tests |
| P1 | DOM-Filter entfernt überfällige Aufgaben, Hausaufgaben, Historie und laufende Mehrtagestermine | Aufgabenstatus entscheidet; vergangene Kalenderdaten bleiben in bewusster Historie |
| P1 | Wochenend-/Folgewochenauswahl springt zurück; Tag/Woche überlagert sich | Sieben-Tage-Auswahl und stabile Auswahlzustände; komplette WebKit-Navigationsabläufe |
| P1 | Packhinweise doppelt, hartcodiert und in Ferien inkonsistent | Gemeinsames `schoolDayFor` aus gespeicherten Regeln, Stundenplan, Notizen und Ferien |
| P1 | Mobile Heute-Ansicht versteckt Hausaufgaben und wiederholt Routinen | Nächster Zeitpunkt, dringende Aufgaben, Kinder mit Hinweisen, maximal vier direkte Aufgaben; Schulplan aufklappbar |
| P1 | Informationen nur über Kenntnis des jeweiligen Moduls auffindbar | Gemeinsame Suche, gruppierte Ergebnisse und direkte vorhandene Aktionen |
| P2 | Spätere Paperless-Anbindung | Kleiner gemeinsamer Dokument-Metadatenadapter und unten beschriebener Serververtrag |

Abfahrtszeiten werden ausschließlich aus `slot.depart` angezeigt. Ohne gespeicherte
Abfahrt wird der Unterrichtsbeginn verwendet. Sport-/Schwimmhinweise werden nur aus
passenden Stundenplanfeldern abgeleitet. Für krank/frei gibt es derzeit keinen
eigenen verlässlichen Zustandsvertrag; es werden keine solchen Zustände erfunden.

## Suche und Dokumentanbieter

`global-search.js` erstellt einen flüchtigen Leseindex aus dem vorhandenen Zustand:
Termine, Aufgaben, Hausaufgaben, Personen, deren Notizen, Kontakte, Einkaufslisten
und Einträge, Rezepte, Pendenzen sowie allgemeine Notizen. Keine zweite Datenbank.
Vergangene Termine und erledigte Einträge erfordern einen ausdrücklichen Schalter.
Umlaute und kleine Tippfehler werden normalisiert. Ergebnisse öffnen vorhandene
Bearbeitungs-/Detailansichten. Native Dialoge sichern Tastaturbedienung und Fokus.

`document-library.js` nutzt ausschließlich den bisherigen geschützten
`family-command-documents/list`-Endpunkt. Dokumentenzentrale und Suche teilen einen
Metadaten-Leseweg. Erfolgreiche Antworten bleiben maximal eine Minute frisch im
Arbeitsspeicher; gleichzeitige Abrufe werden zusammengefasst. Bei einem Ausfall
bleiben bereits geladene Metadaten nutzbar. Nach einem Offline-Neustart stehen ohne
neuen Abruf nur lokale Familienbereiche zur Verfügung. Originaldateien werden
weiterhin über den vorhandenen Dokumentbetrachter geöffnet.

Für eine spätere serverseitige Paperless-Anbindung ist der kleine Leservertrag:

```js
{
  id: 'stable-family-document-id', // bestehende interne ID und Beziehungen
  provider: 'supabase',           // zukünftig auch 'paperless'
  externalId: 'provider-id',      // nur Zuordnung, keine Zugangsdaten
  title: 'Dokumenttitel',
  personIds: ['existing-person-id'],
  links: [],                     // bestehende source_kind/source_id-Beziehungen
  // bestehende Metadaten bleiben erhalten: Typ, Tags, Zusammenfassung etc.
}
```

Paperless-URL und Token gehören in Supabase-Edge-Function-Secrets. Eine spätere
Backend-Integration verwaltet die Zuordnung interne ID ↔ Anbieter-ID und prüft den
Familienzugang bei Listen-, Such- und Originalabrufen. Das Frontend erhält weder
Paperless-Zugangsdaten noch beliebige externe Original-URLs. Der Adapter allein
implementiert noch keine Paperless-Anbindung und keine OCR-Volltextsuche.

Smart Inbox bleibt der nächste gezielte Ausbau: Original archivieren, strukturierte
Vorschläge mit Person/Datum/Frist/Quelle anzeigen, unsichere Erkennungen ausdrücklich
bestätigen, Duplikate und bestehende manuelle Korrekturen erhalten. Der vorhandene
Dokumentimport und seine Schwelle für automatische Übernahme bleiben in dieser
Etappe unverändert. Rechnungen, Garantien, Inventar und zusätzliche Automatisierung
folgen erst nach einem konkreten Haushaltsbedarf.

## Open-Source-Vergleich

Alle neun genannten Projekte waren unter den folgenden konkreten Repositories
auffindbar. Mehrdeutige Namen beziehen sich hier auf diese Auswahl. Übernommen
wurden Ideen, kein fremder Code und keine Assets.

| Projekt | Nutzbares Muster | Entscheidung für die Familienzentrale |
| --- | --- | --- |
| [Paperless-ngx](https://github.com/paperless-ngx/paperless-ngx) | Originalarchiv, OCR, Metadaten und API | Später serverseitiger Dokumentanbieter; GPL-3.0 |
| [Family Hub](https://github.com/marbaugh/Family-Hub) | Up Next, Aufgaben heute, zeitabhängige Tagesübersicht | Ein nächster Schritt; Wandbildschirmdichte nicht auf iPhone übertragen |
| [Family Organizer](https://github.com/fivestones/family-organizer) | Personen-/Familienansicht, Wiederholungen und Erledigungen | Status und Zuordnung vor weiteren Funktionswelten |
| [Yuvomi](https://github.com/ulsklyc/yuvomi) | Haushaltsmodule mit gemeinsamem Einstieg | Bestehende Module zusammenführen; MIT |
| [Grove](https://github.com/Mati-l33t/grove) | Tagesagenda, Rezept → Mahlzeit → Einkauf | Bestehende Kette über Suche erreichbar machen; MIT |
| [Neiliro](https://github.com/neiliro/neiliro) | Suche, verknüpfte Notizen und Informationen als Aufgaben | Gemeinsamer Sucheinstieg; AGPL-3.0 |
| [Home Assistant Family Panel](https://github.com/calebgab/Home-Assistant-Family-Panel) | Mehrtagestermine, Deduplizierung, Push | Überlappende Termine erhalten; Tablet-Muster selektiv nutzen |
| [Homebox](https://github.com/sysadminsmedia/homebox) | Inventar nach Ort, Tags und Dokumentbeziehungen | Später Garantien/Haushaltsinventar, nach dem täglichen Kern |
| [Grocy](https://github.com/grocy/grocy) | Einkauf, Vorräte, Aufgaben und Mahlzeiten | Kleine zusammenhängende Abläufe statt ERP-Dichte; MIT |

Vor einer späteren tatsächlichen Codeübernahme müssen Lizenz und konkrete Datei
erneut geprüft werden. Die obigen Muster begründen keine neue Runtime-Abhängigkeit.

## Verifikation und Grenzen

Neue Tests: `cloud-state-lifecycle.spec.mjs`, `daily-reliability.spec.mjs`,
`focus-search.spec.mjs` und `pwa-offline.spec.mjs`. WebKit läuft mit Touch und
iPhone-Viewport; die Fokus-/Suchsuite prüft zusätzlich 375, 390, 430 und 1024 Pixel,
Reduced Motion, Tastatur, Fokus, Datenintegrität, Fehlerfälle und doppelte IDs.
Chromium prüft echten Service-Worker-Start, Offline-Neuladen, Suche, Navigation und
Wiederverbindung. Bestehende angrenzende Workflows bleiben Release-Bedingung.

Production Smoke vergleicht Index und kritische Assets bytegenau mit dem jeweiligen
Merge-Commit nach Pages-Deployment. Die reale öffentliche URL wurde im verbundenen
Browser geöffnet; dort ist kein Familienzugang gespeichert. Die private Live-UI
und eine physisch installierte iPhone-PWA sind daher nicht als getestet ausgewiesen.

## Einheitliche Oberfläche V9.70

Ausgangspunkt: main `23ce3c2`, keine offenen PRs. Bildvergleich mit Beispieldaten
in WebKit (390 × 844) und Chromium (1440 × 1000): Aufgabentitel waren mobil
11,8 px, Metadaten 8,7 px, Bearbeiten-Flächen 31 px und Eingabefelder 10,5 px.
Escape schloss die Aufgabenformulare nicht. Auf dem PC stand eine zusätzliche
Tagescheck-Liste vor dem eigentlichen Fokus.

Die gemeinsame Heute-Darstellung ordnet Fokus, Kinder und offene Arbeit links,
Termine und Vorbereitung rechts an; auf Telefonen folgt alles untereinander.
Ein generierter Entwurf diente als Vergleich für Farben, Schrift, Abstände und
Komponenten. Funktionsbedingte Abweichungen: informative Kinderzeilen ohne
klickbare Pfeile, neutrale Bearbeiten-Aktion statt Rot und echte Laufzeitdaten.
Der bestehende native Header bleibt bestehen. Vorhandene CSS-Dateien wurden
überarbeitet; die höhere Begrenzung auf den gemeinsamen Dashboard-Container
verhindert, dass spät geladene alte Stilregeln dessen Zeilen wieder umformatieren.

„Mehr“ gruppiert vorhandene Ziele nach Alltag/Haushalt, Familie/Informationen
und Planung/Verwaltung. Aufgaben und Kalender haben mindestens 14 px Titel,
12 px Metadaten und 44 px hohe Aktionen. Dialogfelder haben mindestens 16 px
Schrift und 48 px Höhe. Die gemeinsame Dialogschicht ergänzt Namen, Fokusführung,
Escape, Rückkehr zum Auslöser, Pflichtfeldmeldungen und inaktive Hintergrundansichten.
Die verzögerten Fokusaufrufe respektieren ein bereits vom Nutzer ausgewähltes Feld.
Navigation setzt sowohl den mobilen Scrollcontainer als auch das Desktopfenster zurück.

26 Symbole aus [Lucide](https://lucide.dev/) `lucide-static@1.41.0` sind als kleiner
lokaler SVG-Katalog eingebunden. Die Paketintegrität wurde vor der Übernahme
geprüft; Quelle, Version, Integritätswert und vollständige ISC-/MIT-Hinweise liegen
unter `vendor/lucide/`. Keine zusätzliche Laufzeitbibliothek und kein Icon-CDN.
Die beiden neuen Skripte gehören zum Startpaket, zum Offline-Cache v110 und zur
Prüfung der ausgelieferten Produktionsdateien.

`unified-experience.spec.mjs` prüft beide Browser-Engines, echte Aufgabenaktionen,
lesbare Schrift und Touchflächen, Formularvalidierung ohne Datenmutation,
Tastaturfokus und verschachtelte Dialoge, Scrollrücksetzung und weitere Bildschirmbreiten.
Die bisherigen Regressionen bleiben aktiv. Geometrieprüfungen wurden dort angepasst,
wo der bewusste Entwurf alte Emoji-Kacheln oder das vierspaltige Zielraster ersetzt;
Dokumenttests warten auf das tatsächlich asynchron geladene Dokument.
Physische iPhones und private produktive Familiendaten sind nicht Teil der lokalen
Browserprüfung; Produktions-Smoke prüft Zugriffsschutz, Release und ausgelieferte Assets.
