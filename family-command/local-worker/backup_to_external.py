#!/usr/bin/env python3
"""Export Family Command state snapshots + private originals to an external drive.

Requires only the existing private Family Command access key.
Never uses or stores a Supabase service-role key.
"""
from __future__ import annotations

import datetime as dt
import json
import os
import re
import shutil
import sys
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

BACKUPS_API = "https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-backups"
DOCS_API = "https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-documents"
ACCESS_KEY = os.getenv("FC_ACCESS_KEY", "").strip()
ROOT = Path(os.getenv("FC_EXTERNAL_BACKUP_DIR", "/Volumes/FamilyBackup/Familienzentrale")).expanduser()
KEEP = max(2, int(os.getenv("FC_EXTERNAL_BACKUP_KEEP", "14")))


def request_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"x-fc-access": ACCESS_KEY, "accept": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def download(url: str, target: Path) -> None:
    req = urllib.request.Request(url, headers={"user-agent": "FamilyCommandBackup/1.0"})
    with urllib.request.urlopen(req, timeout=300) as response, target.open("wb") as out:
        shutil.copyfileobj(response, out, length=1024 * 1024)


def safe_name(value: str, fallback: str = "Dokument") -> str:
    value = re.sub(r"[\\/:*?\"<>|\x00-\x1f]+", "_", str(value or "")).strip(" ._")
    value = re.sub(r"\s+", " ", value)
    return (value[:120] or fallback)


def extension(mime: str) -> str:
    return {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "text/plain": ".txt",
    }.get((mime or "").lower(), ".bin")


def ensure_external_target() -> None:
    parent = ROOT.parent
    if not parent.exists():
        raise RuntimeError(
            f"Backup-Laufwerk fehlt: {parent}. Es wird bewusst kein stiller Ersatz auf der internen SSD angelegt."
        )
    ROOT.mkdir(parents=True, exist_ok=True)


def export() -> Path:
    if not ACCESS_KEY:
        raise RuntimeError("FC_ACCESS_KEY fehlt.")
    ensure_external_target()

    stamp = dt.datetime.now().astimezone().strftime("%Y-%m-%d_%H-%M-%S")
    final_dir = ROOT / stamp
    tmp_dir = ROOT / f".{stamp}.partial"
    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    (tmp_dir / "documents").mkdir(parents=True)

    latest = request_json(BACKUPS_API + "/latest")
    if not latest.get("ok") or not latest.get("snapshot"):
        raise RuntimeError("Kein Cloud-State-Snapshot verfügbar.")
    (tmp_dir / "family-state.json").write_text(
        json.dumps(latest["snapshot"], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    listing = request_json(DOCS_API + "/list")
    docs = listing.get("documents") if listing.get("ok") else None
    if not isinstance(docs, list):
        raise RuntimeError("Dokumentenliste konnte nicht gelesen werden.")

    manifest = []
    for index, doc in enumerate(docs, start=1):
        doc_id = str(doc.get("id") or "")
        if not doc_id:
            continue
        query = urllib.parse.urlencode({"id": doc_id, "original": "1", "json": "1"})
        info = request_json(DOCS_API + "/file?" + query)
        if not info.get("ok") or not info.get("url"):
            raise RuntimeError(f"Original nicht abrufbar: {doc_id}")
        title = safe_name(doc.get("title") or doc_id)
        ext = extension(info.get("mimeType") or doc.get("mime_type") or "")
        filename = f"{index:04d}_{title}_{safe_name(doc_id, 'id')}{ext}"
        target = tmp_dir / "documents" / filename
        download(info["url"], target)
        manifest.append({
            "id": doc_id,
            "title": doc.get("title"),
            "person_id": doc.get("person_id"),
            "mime_type": info.get("mimeType") or doc.get("mime_type"),
            "created_at": doc.get("created_at"),
            "links": doc.get("links") or [],
            "file": "documents/" + filename,
            "bytes": target.stat().st_size,
        })

    meta = {
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "snapshot_id": latest["snapshot"].get("id"),
        "document_count": len(manifest),
        "documents": manifest,
    }
    (tmp_dir / "manifest.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp_dir.rename(final_dir)

    completed = sorted(
        (p for p in ROOT.iterdir() if p.is_dir() and not p.name.startswith(".")),
        key=lambda p: p.name,
        reverse=True,
    )
    for old in completed[KEEP:]:
        shutil.rmtree(old)
    return final_dir


def main() -> int:
    try:
        target = export()
        print(f"Backup fertig: {target}")
        return 0
    except Exception as exc:
        print(f"Backup fehlgeschlagen: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
