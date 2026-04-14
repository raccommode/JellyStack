#!/usr/bin/env python3
"""Validate the single app manifest at `jellystack-app/umbrel-app.yml`.

JellyStack is a monolithic Umbrel app — the community store ships exactly one
app (the JellyStack bundle). We enforce:

  - All required fields are present.
  - `id` matches `jellystack-app` and the containing directory.
  - `category` is one of the allowed Umbrel categories.
  - `port` is a positive integer.
  - `dependencies` is a list (must be empty — JellyStack has no external app deps).
"""
from __future__ import annotations

import sys
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
MANIFEST = REPO_ROOT / "jellystack-app" / "umbrel-app.yml"
STORE_MANIFEST = REPO_ROOT / "umbrel-app-store.yml"

ALLOWED_CATEGORIES = {
    "media", "networking", "automation", "developer", "utilities", "finance",
    "social", "productivity", "communication", "server", "ai", "bitcoin", "lightning",
}
REQUIRED_FIELDS = [
    "manifestVersion", "id", "category", "name", "version", "tagline",
    "description", "developer", "website", "dependencies", "repo", "support",
    "port", "submitter",
]
EXPECTED_APP_ID = "jellystack-app"


def validate_store() -> list[str]:
    errors: list[str] = []
    with STORE_MANIFEST.open() as f:
        data = yaml.safe_load(f)
    if not isinstance(data, dict):
        return ["umbrel-app-store.yml: top-level must be a mapping"]
    if data.get("id") != "jellystack":
        errors.append(f"umbrel-app-store.yml: `id` must be `jellystack` (got {data.get('id')!r})")
    if not data.get("name"):
        errors.append("umbrel-app-store.yml: missing `name`")
    return errors


def validate_app() -> list[str]:
    errors: list[str] = []
    with MANIFEST.open() as f:
        data = yaml.safe_load(f)
    if not isinstance(data, dict):
        return ["top-level must be a mapping"]

    for field in REQUIRED_FIELDS:
        if field not in data:
            errors.append(f"missing required field `{field}`")

    app_id = data.get("id", "")
    if app_id != EXPECTED_APP_ID:
        errors.append(f"`id` must be {EXPECTED_APP_ID!r} (got {app_id!r})")
    if MANIFEST.parent.name != EXPECTED_APP_ID:
        errors.append(f"directory name {MANIFEST.parent.name!r} does not match `id`")

    category = data.get("category")
    if category and category not in ALLOWED_CATEGORIES:
        errors.append(f"unknown category {category!r}")

    port = data.get("port")
    if port is not None and (not isinstance(port, int) or port <= 0):
        errors.append(f"`port` must be a positive integer (got {port!r})")

    deps = data.get("dependencies", [])
    if not isinstance(deps, list):
        errors.append("`dependencies` must be a list")
    elif deps:
        errors.append(
            f"`dependencies` must be empty for the monolithic bundle (got {deps!r})"
        )

    return errors


def main() -> int:
    if not STORE_MANIFEST.exists():
        print(f"Store manifest not found: {STORE_MANIFEST}", file=sys.stderr)
        return 1
    if not MANIFEST.exists():
        print(f"App manifest not found: {MANIFEST}", file=sys.stderr)
        return 1

    store_errs = validate_store()
    app_errs = validate_app()

    total = 0
    if store_errs:
        total += len(store_errs)
        print(f"❌ {STORE_MANIFEST.relative_to(REPO_ROOT)}")
        for e in store_errs:
            print(f"    - {e}")
    else:
        print(f"✓ {STORE_MANIFEST.relative_to(REPO_ROOT)}")

    if app_errs:
        total += len(app_errs)
        print(f"❌ {MANIFEST.relative_to(REPO_ROOT)}")
        for e in app_errs:
            print(f"    - {e}")
    else:
        print(f"✓ {MANIFEST.relative_to(REPO_ROOT)}")

    print()
    if total:
        print(f"{total} error(s).", file=sys.stderr)
        return 1
    print("Manifests OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
