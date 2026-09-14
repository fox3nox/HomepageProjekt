# Familienzentrale: Design- und Bedienprüfung V9.87

Stand: 14. September 2026. Ziel: Person, nächste Handlung, Zeitpunkt und Restzeit ohne gedankliches Zusammenrechnen erkennen. Die Originaldaten bleiben maßgeblich.

## Grundlage und Grenzen

Geprüft: Quellcode der fünf Hauptansichten, Detail- und Bearbeitungswege, bestehende automatisierte Tests und die vom Nutzer gelieferten Screenshots. Der aktuelle persönliche Live-Zugang steht im Prüf-Browser nicht zur Verfügung. Die lokale Browserinstallation ist durch einen fehlgeschlagenen Browser-Download blockiert. Daher keine Behauptung einer vollständigen aktuellen visuellen Live-Prüfung. Browserprüfungen laufen mit isolierten synthetischen Daten in Chromium und WebKit in der vorhandenen CI. Die dort erzeugten Screenshots aller fünf Hauptansichten wurden für 390 px betrachtet. Dabei gefundene uneinheitliche Kalenderfilter und native dunkle Terminränder wurden korrigiert. Das ersetzt keine Sichtprüfung auf dem persönlichen iPhone.

## Vergleich und Entscheidungen

- [Cozi Feature Overview](https://www.cozi.com/feature-overview/) und [Cozi FAQ](https://www.cozi.com/faq/): Personenfarben, gemeinsamer Kalender, Tagesagenda und gemeinsame Listen. Übernommen wird das Prinzip konsistenter Personenkennung. Farben werden durch ausgeschriebene Namen ergänzt; bestehende Farben werden nicht geändert.
- [TimeTree – offizielle Produktbeschreibung](https://play.google.com/store/apps/details?id=works.jubilee.timetree): geteilte Kalender, Informationen direkt am Termin, Notizen und Aufgaben. Übernommen wird der direkte Weg von der Übersicht zum betreffenden Termin. Zusätzliche Kommunikation und neue Datenmodelle gehören nicht zu diesem Designauftrag.
- Eigene Ableitung: Zeitbereiche sind keine exakten Fristen. Ohne hinterlegte Endzeit darf kein geschätztes Ende angezeigt werden. Ein Termin ohne Uhrzeit ist nicht automatisch noch bevorstehend. Eine offene Aufgabe wird nicht durch Zeitablauf erledigt.

## Befunde und Umsetzung

| Bereich | Bisheriges Problem | Änderung |
|---|---|---|
| Kopfbereich | Mehrere alte Gestaltungsschichten; Unschärfe auf Nutzerfoto | Deckender Hintergrund; Filter, Transparenz- und Hintergrundeffects im Kopfbereich explizit ausgeschaltet. Native Schrift bleibt. |
| Nächster Schritt | Anzeige ohne direkten Bedienweg; mehrtägige Termine konnten erneut als Tagesbeginn auftauchen | Lesendes gemeinsames Modell aus tatsächlichen Schulzeiten und Terminen; Klick öffnet Einzeltermin oder richtigen Kalendertag. |
| Zeit | Datum erfordert Rechnen; laufende Termine zeigen keine Restdauer | Heute/Morgen/Übermorgen/In N Tagen plus exakte Zeit; morgen zusätzlich Stunden/Minuten, laufende Termine mit verbleibender Dauer. |
| Zuordnung | Leere Zuordnung wirkt wie Elternzuordnung; gemeinsame Termine schlecht vergleichbar | Alle bekannten Personen sichtbar, fehlende Zuordnung ausdrücklich benannt. Kein Standard-Elternteil zur Anzeige erfunden. |
| Kinder | Vergangene Schulblöcke im aktuellen Überblick; Hausaufgabenhinweis ohne direkten Weg | Aktuelle/bevorstehende Schulblöcke im Überblick, vollständiger Schulplan weiterhin erreichbar; Aufgabenhinweis öffnet Aufgaben dieses Kindes. |
| Morgen | Andere Filterlogik als Kalender; Aufgabenlink führte zu Heute | Gleiche Personenfilter; Aufgabenlink zeigt tatsächlich morgen fällige Aufgaben. |
| Kalender | Tageslinks öffneten Monat; Personenfilter ließ alle Schulkinder stehen; keine direkte Wochennavigation | Richtiger Tag, Filter auch auf Schulzeilen, vorherige/nächste Woche, gut sichtbares relatives und genaues Datum. |
| Aufgaben | Lange flache Liste; undatierte Priorität konnte aktuelle Schulaufgaben verdrängen | Fristgruppen, Heute/Morgen-Filter und Personenfilter; undatierte Aufgaben klar getrennt. |
| Haushalt/Mehr | Uneinheitliche Kachelhöhen, zu viel Dekoration | Gemeinsame Schrift-/Karten-/Abstandsregeln, kompaktere Kacheln, bestehende Funktionen behalten. |
| Leere Kinderkarten | Karten ohne Schulzeit, Aufgabe, Packhinweis oder heutigen Termin verdrängten relevante Informationen | Im Überblick entfallen nur vollständig inhaltsleere Kinderkarten; die Person und alle Daten bleiben erhalten. |
| Wiederaufbau | Geöffnete Tagesdetails verloren ihren Zustand | Offen-Zustand und direkte Tastaturziele bei Zeitaktualisierung erhalten; kein regulärer Wiederaufbau während gedrücktem Zeiger. |

## Daten- und Funktionsgrenzen

Kein Schemawechsel, keine Migration, kein produktiver Datenabruf für Tests und kein Schreibzugriff auf private Familienbestände. Kein Schulbeginn, Schulende, Abfahrtszeitpunkt, Termin, Betrag, Name oder Erledigungsflag wird durch diese Darstellung geändert. Bestehende ausdrücklich ausgelöste Bearbeitungsfunktionen bleiben erhalten. Teständerungen laufen ausschließlich im isolierten privaten Testkern.

## Prüfmatrix

- Modelltests: Start/Ende exakt auf Minutengrenze, unbekanntes Ende, mehrtägige Termine, Sommer-/Winterzeit, unzugeordnete und gemeinsame Einträge, kanonische Schulzeiten, unveränderte Daten.
- Neue Browserprüfung: direkter Terminaufruf, Tages- und Wochenwechsel, Kinder-/Eltern-/unzugeordneter Filter, morgen fällige Aufgaben, alle Zuordnungen bei gemeinsamem Termin, geöffnete Details, fünf Hauptansichten bei 375/390/430/1280 px, Bedienflächen und Datenvergleich.
- Bestehende Browserprüfungen: weitere iPhone-/Tablet-/Desktopbreiten, Vorbereitung, Suche, Dialoge, neue/bearbeitete/erledigte Einträge, Dokumente, Listen, Mahlzeiten, Kontakte, Erinnerungen, Export, Offline- und Cloud-Lebenszyklus.
- Veröffentlichung erst nach Prüfung der für diesen Stand ausgelösten CI-Läufe und Kontrolle der veröffentlichten Version.

Tests können Fehler aufdecken und wichtige Eigenschaften absichern. Eine Garantie, dass jeder denkbare Datenzustand auf jedem Gerät fehlerfrei ist, wird daraus nicht abgeleitet.
