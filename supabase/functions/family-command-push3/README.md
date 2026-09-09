# Morgen- und Abendbericht

`index.ts` ist die am 9. September 2026 aus dem bestehenden Supabase-Projekt
übernommene Funktion `family-command-push3` (Ausgangspunkt: Remote-Version 3).
`digest.mjs` formatiert den vorhandenen Geräte-Snapshot ohne Datenänderungen.

Bestehende Tabellen, VAPID-Schlüssel, Geräte-Token, Versandzeiten und Cron-Aufträge
bleiben bestehen. `verify_jwt` bleibt wie zuvor `false`; die Geräte-Endpunkte prüfen
ihren eigenen Token. Keine Secrets im Repository, keine Datenmigration.

Frontend-CI veröffentlicht diese Funktion nicht automatisch. Nach grünem PR,
Merge und Main-Prüfung beide Dateien gemeinsam unter demselben Funktionsnamen
bereitstellen; vorher den aktuellen Remote-Stand auf konkurrierende Änderungen
prüfen. Danach Version und beide Quellen zurücklesen und mit dem Merge-Stand
vergleichen. Ein leerer POST auf `/sync` muss ohne Schreibzugriff 403 liefern.
`/test`, `/test-evening` und `/cron` senden echte Mitteilungen und sind keine
lesenden Healthchecks; sie dürfen nicht als solche zur Prüfung ausgelöst werden.

Lokaler Formatter-Test: `node family-command/e2e/push-digest.spec.mjs`.
Er prüft Personen, Mitnehmen, überfällige Schulaufgaben, Teilferien, getrennte
Termine, echte Abfahrten, Sommerzeitwechsel und die Push-Payload-Größe.
Der iPhone-Sperrbildschirm kann Inhalte kürzen; der Link öffnet die vollständige
Heute- bzw. Morgenansicht. Zustellung auf einem physischen Gerät und Aktualität
jedes Geräte-Snapshots sind durch diesen Formatter-Test nicht belegt.
