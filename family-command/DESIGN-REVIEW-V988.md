# Familienzentrale V9.88: weniger Wege und Wiederholungen

15. September 2026. Auftrag: Oberfläche vereinfachen, ohne private Dokumente, Kontakte, Schulzeiten, Abfahrten oder andere Datensätze zu ändern.

## Recherche und Einordnung

[Cozi](https://www.cozi.com/) beschreibt einen gemeinsamen Kalender mit Personenfarben sowie getrennte Einkaufs- und Aufgabenlisten. [FamilyWall](https://www.familywall.com/) trennt ebenfalls Kalender, Listen und weitere Familienfunktionen. Daraus folgt nicht, dass ihre komplette Navigation für diese Familie richtig wäre. Unsere eigene Ableitung aus den Nutzerbeschwerden und dem vorhandenen Code ist eine flachere Hauptnavigation mit drei klaren Zuständigkeiten.

| Ziel | Inhalt | Direkter Weg |
|---|---|---|
| Übersicht | Nächster Schritt, offene Tagesaufgaben, Schule und Mitnehmen | Heute/Morgen direkt im Bereich |
| Plan | Vollständiger Kalender und Aufgabenbestand | Termine/Aufgaben, danach Tag oder Person |
| Familie | Dokumente, Kontakte, Haushalt, Erinnerungen, Pendenzen und Verwaltung | Alle bisherigen Funktionen erhalten |

Die Übersicht ist eine begrenzte Auswahl für den Alltag; Plan bleibt der vollständige Bestand. Eine Aufgabe kann deshalb sowohl in der aktuellen Übersicht als auch im vollständigen Plan vorkommen. Innerhalb der Übersicht werden ihre Texte jedoch nicht nochmals in Kinderkarten und weiteren Vorschauen wiederholt.

## Änderungen

- Drei Hauptknöpfe mit eindeutiger Beschriftung und korrektem Aktivzustand, auch beim direkten Aufruf einer Unteransicht.
- Heute/Morgen kompakt erreichbar. Termine und Aufgaben unter Plan. Bestehende interne Bildschirm-IDs und direkte Links funktionieren weiter.
- Tagesaufgaben mit ausgeschriebener Zuständigkeit an einem Ort. Kinderkarten konzentrieren sich auf hinterlegte Schulzeiten, Abfahrt, schulisches Mitnehmen und Hinweise.
- Einzeltermin im Fokus nicht zusätzlich als weitere Terminzeile. Terminvorbereitung bleibt am Termin; Schulvorbereitung bleibt beim Kind.
- Abends werden morgen fällige Aufgaben in die Arbeitsauswahl aufgenommen. Morgige Termine mit Packhinweisen bleiben in der Vorbereitung erreichbar. Kein Umdeuten bestehender Fristen.
- Zusätzliche vollständige Morgen-/Sieben-Tage-Vorschauen sowie Pendenzenlisten aus Heute entfernt. Inhalte bleiben in Morgen, Plan und Familie.
- Abgeschlossene Schulblöcke entfallen im aktuellen Überblick. Offene Aufgaben werden nie automatisch erledigt; Einträge ohne Endzeit bleiben entsprechend gekennzeichnet.
- Alte rote Navigationszähler stammen aus einer unsichtbaren früheren Ansicht und wurden entfernt; sie repräsentierten den neuen kombinierten Plan nicht zuverlässig.
- Pendenzen werden beim erneuten Öffnen von Familie aktualisiert, wenn ihr Bestand sich geändert hat.
- Keine alten, ungenutzten Zusatzrenderer für Kindertermine, Morgen- oder Zukunftsduplikate mehr im kanonischen Überblick.

## Daten und Tests

Die produktiven Änderungen betreffen ausschließlich Darstellung, Navigation und Cacheversion. Keine Datenmigration, keine Löschung und kein Schreibaufruf auf private Familienbestände. Vorhandene Bearbeitungsfunktionen bleiben ausdrücklich bedienbar; ihre Tests laufen mit isolierten synthetischen Datensätzen.

Navigationstests verwenden echte sichtbare Knöpfe: die drei Hauptbereiche und ihre Tages-/Plan-Auswahl. Alte Erwartungen an fünf Hauptknöpfe und doppelte Datensatzansichten wurden durch Prüfungen der neuen Zuständigkeiten ersetzt. Datenvergleich vor/nach Navigation, Filtern und Rendern, Terminbesitzer, Dokumentoriginale, manuelle Korrekturen, Aufgabenabschluss, Suche, Formulare, Haushalt, Kontakte, Offlinebetrieb und Cloud-Aktualisierungen bleiben Prüffälle.

Browser- und Screenshotprüfung erfolgt in der vorhandenen CI mit WebKit und Chromium, einschließlich 375/390/430/1280 px und weiteren bestehenden Bildschirmgrößen. Die persönliche angemeldete Live-Sitzung auf dem iPhone ist hier nicht verfügbar. Diese Prüfung ersetzt daher keine Behauptung, das persönliche Gerät bedient zu haben. Die Übersicht wurde anhand frischer CI-Screenshots mit drei Kindern auf 390 px betrachtet; sie zeigt den nächsten Schritt und alle drei Schulzeilen im ersten Bildschirm. Veröffentlichung erfolgt nach den ausgelösten Prüfläufen und der Sichtprüfung der übrigen Ansichten. Die konkreten Ergebnisse werden im zugehörigen Pull Request dokumentiert.
