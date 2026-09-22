# Familienzentrale V10.1 Preview · Family Brain

Stand: 22.09.2026

## Ziel

Die Familienzentrale soll nicht von einem LLM "leben", sondern von überprüfbaren Familiendaten. KI darf Inhalte verstehen und Vorschläge erzeugen; Termine, Aufgaben und Originaldokumente bleiben kanonische Daten mit Quellen.

## In dieser Preview umgesetzt

### 1. Read-only Familien-Gehirn

Neue Dateien:
- `family-brain.js`
- `family-brain.css`

Funktionen:
- "Was habe ich nächste Woche?"
- "Welche Termine/Aufgaben hat <Person> nächste Woche?"
- "Was müssen wir morgen mitnehmen?"
- "Wo steht etwas zum Herbstbummel?"
- Suche über vorhandene Dokumentmetadaten
- direkte Quellenaktionen zu Termin oder Originaldokument
- feste Datumslogik statt LLM-Schätzung
- bewusst read-only; keine Schreiboperationen

Ein späteres lokales Modell kann über `window.__fcFamilyBrain.setProvider(fn)` ergänzt werden. Der deterministische Kontext bleibt dabei die Datenquelle.

### 2. Dokumentprüfung mit Original-Beleg

`smart-documents.js` zeigt bei einem KI-Vorschlag den gelieferten `source_quote` direkt an.

Regeln:
- kein Vorschlag ist automatisch ausgewählt
- kein Termin wird vor Bestätigung übernommen
- fehlt ein Textbeleg, erscheint eine Warnung
- niedrige confidence bleibt sichtbar
- bestehende Validierung/Deduplizierung bleibt erhalten
- Originaldokument bleibt unverändert gespeichert und verknüpft

### 3. Lokaler Ollama-Worker für den zukünftigen 24/7-Mac

Ordner: `local-worker/`

Der Worker:
1. holt einen bereits serverseitig angelegten Analysejob,
2. lädt das private Original,
3. verarbeitet Text/Bild/PDF lokal mit Ollama,
4. verlangt strukturiertes JSON,
5. verlangt für jeden Eintrag einen `source_quote`,
6. sendet nur Extraktionsergebnisse zurück,
7. überlässt Konfliktprüfung, Duplikate und Reviews dem Server.

Standardmodell in der Vorlage: `qwen3-vl:8b`.

Der Worker schreibt **niemals direkt** in `window.data`, Kalender oder kanonische Family-Command-Tabellen.

### 4. Bereits vorhandenes Backend wiederverwendet

Im bestehenden Supabase-Projekt existieren bereits die benötigten Bausteine:
- `af_sources`
- `af_jobs`
- `af_extractions`
- `af_items`
- `af_reviews`
- `af_actions`
- `af_workers`
- `af_audit_log`

Die vorhandene `factory-worker-api` unterstützt bereits:
- einmaliges Worker-Pairing
- Heartbeat
- Job Claiming
- privaten Original-Download
- serverseitige Validierung
- confidence-/Person-/Zeit-Prüfung
- Fingerprint-Deduplizierung
- Review-Erstellung
- Audit-Log

Deshalb wurde kein zweites konkurrierendes Datensystem erfunden.

## Bewusst NICHT verändert

- kein Merge nach `main`
- keine Live-Veröffentlichung
- keine bestehenden Familien-, Termin- oder Dokumentdaten verändert
- keine Supabase-Migration
- keine Edge Function neu deployed
- kein Secret im Repository
- aktueller produktiver Dokument-Upload bleibt unverändert

## Noch nötig, wenn der Mac vorhanden ist

1. Ollama installieren.
2. Modell laden.
3. Worker mit einmaligem Pairing-Code koppeln.
4. lokalen Worker als LaunchAgent 24/7 starten.
5. nach separater Prüfung den produktiven Dokument-Upload auf "local preferred" umstellen.
6. erst dann lokale KI-Antworten als optionalen Provider an Family Brain anbinden.

## Sicherheitsprinzip

**Original → Extraktion → Beleg → Validierung → Review → bestätigte Übernahme**

Nie:

**Original → LLM → blind in Kalender schreiben**
