#!/usr/bin/env python3
"""Add songs to catalog.json interactively."""

import json
from datetime import datetime
from pathlib import Path

CATALOG_PATH = Path(__file__).with_name("catalog.json")


def load_catalog(path):
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_catalog(path, catalog):
    with path.open("w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
        f.write("\n")


def parse_date(value):
    if not value:
        return datetime.min
    iso = value.replace(" ", "T")
    try:
        return datetime.fromisoformat(iso)
    except ValueError:
        return datetime.min


def prompt(question, default=None, required=False):
    while True:
        if default is not None and default != "":
            line = f"{question} [{default}]: "
        elif default == "":
            line = f"{question} (leave blank for none): "
        else:
            line = f"{question}: "
        answer = input(line).strip()
        if not answer:
            answer = default if default is not None else ""
        if required and not answer:
            print("This field is required.")
            continue
        return answer


def ask_time():
    default = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return prompt("timeAdded", default=default)


def main():
    catalog = load_catalog(CATALOG_PATH)
    print(f"Loaded {len(catalog)} songs from {CATALOG_PATH.name}")

    print("\n--- New song ---")
    url = prompt("URL / file path", required=True)

    song_type = prompt("Type (main / vocals / instrumental)", default="main").lower()
    if song_type not in {"main", "vocals", "instrumental"}:
        print(f"Unknown type '{song_type}', treating as main.")
        song_type = "main"

    entry = {"url": url}
    entry["timeAdded"] = ask_time()

    if song_type == "main":
        instrumental_url = prompt("Instrumental URL", default="")
        vocals_url = prompt("Isolated vocals (ISO) URL", default="")
        stems = {}
        if instrumental_url:
            stems["instrumental"] = instrumental_url
        if vocals_url:
            stems["vocals"] = vocals_url
        if stems:
            entry["stems"] = stems
    else:
        full_mix_url = prompt(
            "Full-mix URL for this song", default=url
        )
        other_type = "instrumental" if song_type == "vocals" else "vocals"
        other_url = prompt(f"{other_type.capitalize()} URL", default="")
        entry["url"] = full_mix_url
        entry["stems"] = {}
        if song_type == "vocals":
            entry["stems"]["vocals"] = url
            if other_url:
                entry["stems"]["instrumental"] = other_url
        else:
            entry["stems"]["instrumental"] = url
            if other_url:
                entry["stems"]["vocals"] = other_url

    catalog.append(entry)
    catalog.sort(key=lambda s: parse_date(s.get("timeAdded", "")), reverse=True)
    save_catalog(CATALOG_PATH, catalog)
    print(f"Saved. Catalog now contains {len(catalog)} songs.")
    print("Done.")


if __name__ == "__main__":
    main()
