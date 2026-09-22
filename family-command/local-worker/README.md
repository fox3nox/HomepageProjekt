# Familienzentrale · lokaler KI-Worker

Dieser Ordner ist für den späteren 24/7-Mac vorbereitet. Der Worker nutzt die bereits vorhandene private `factory-worker-api` und **schreibt nie direkt Termine/Aufgaben in die produktive Familienzentrale**.

## Sicherheitsmodell

1. Ein Original liegt im privaten Dokumentenspeicher.
2. Der Server stellt einen Analysejob bereit.
3. Der Mac lädt das Original mit einem eigenen Worker-Token.
4. Text/Bilder gehen an **Ollama auf 127.0.0.1**.
5. Das lokale Modell liefert striktes JSON plus `source_quote`.
6. Der Server validiert Person, Zeit, Duplikate und confidence.
7. Unsichere Ergebnisse landen in Review. Erst eine bestätigte Übernahme darf kanonische Familiendaten verändern.

## Empfohlenes Startmodell

`qwen3-vl:8b`

Es ist klein genug für einen 32-GB-Mac, kann Text + Bilder verarbeiten und eignet sich deshalb für Fotos/PDF-Seiten von Schulbriefen.

## Installation auf dem Mac

1. Ollama installieren und starten.
2. Modell laden:

```bash
ollama pull qwen3-vl:8b
```

3. Worker einrichten:

```bash
cd family-command/local-worker
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

4. Einmaligen Worker-Pairing-Code erzeugen (über die gesicherte Admin-/Factory-Seite), dann:

```bash
export AF_PAIRING_CODE='EINMALIGER-CODE'
python family_worker.py
```

Der zurückgegebene Worker-Token wird standardmäßig in `~/.family-command/worker-token` mit restriktiven Dateirechten gespeichert. Danach ist der Pairing-Code nicht mehr nötig.

## 24/7 über launchd

`ch.familycommand.localworker.plist.example` kopieren, die Platzhalter `__PYTHON__`, `__PROJECT__` und `__HOME__` ersetzen und als LaunchAgent laden. Reale Tokens gehören **nicht** in GitHub oder in diese Beispieldatei.

## Noch bewusst nicht aktiviert

Der produktive Dokument-Upload der aktuellen Familienzentrale verwendet weiterhin die bestehende Cloud-Auswertung. Die lokale Queue wird erst mit einer separaten, geprüften Backend-Freigabe verbunden. Dadurch verändert diese Preview weder Live-Daten noch den aktuellen Produktionspfad.


## Externe SSD-Sicherung

`backup_to_external.py` exportiert zusätzlich:
- den neuesten Cloud-State-Snapshot,
- eine Manifest-Datei,
- alle privaten Originaldokumente.

Standardziel: `/Volumes/FamilyBackup/Familienzentrale`. Wenn das Laufwerk fehlt, bricht der Job absichtlich ab und legt **keine scheinbare Sicherung auf der internen SSD** an.

Den privaten Familienzentrale-Zugang auf macOS am besten einmalig im Schlüsselbund speichern:

```bash
security add-generic-password -a "$USER" -s FamilyCommandAccess -w 'DEIN_PRIVATER_ZUGANG' -U
```

Danach kann `backup_to_external.py` den Schlüssel aus dem macOS-Schlüsselbund lesen. Die LaunchAgent-Vorlage enthält deshalb bewusst **kein Secret**.

Die Vorlage `ch.familycommand.externalbackup.plist.example` ist für eine tägliche Sicherung um 03:15 Uhr vorbereitet. Das Ziel-Laufwerk und die Pfade müssen vor der Aktivierung angepasst werden.
