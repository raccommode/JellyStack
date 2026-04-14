#!/usr/bin/env python3
"""Validate every `jellystack-*/umbrel-app.yml` against the required schema.

The Umbrel App Store enforces a set of conventions. We enforce the subset that
matters for our own store:

  - `id` is a string matching `jellystack-<name>`.
  - `manifestVersion`, `category`, `name`, `version`, `tagline`, `developer`,
    `website`, `repo`, `support`, `port`, `submitter` are present.
  - `category` is one of the allowed Umbrel categories.
  - `port` is a positive integer (or 0 for no-UI apps).
  - `dependencies` is a list (can be empty).
  - `id` matches the containing directory name.
"""
from __future__ import annotations

import sys
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
ALLOWED_CATEGORIES = {
    "media", "networking", "automation", "developer", "utilities", "finance",
    "social", "productivity", "communication", "server", "ai", "bitcoin", "lightning",
}
REQUIRED_FIELDS = [
    "manifestVersion", "id", "category", "name", "version", "tagline",
    "description", "developer", "website", "dependencies", "repo", "support",
    "port", "submitter",
]


def validate_file(path: Path) -> list[str]:
    errors: list[str] = []
    with path.open() as f:
        try:
            data = yaml.safe_load(f)
        except yaml.YAMLError as e:
            return [f"YAML parse error: {e}"]

    if not isinstance(data, dict):
        return ["top-level must be a mapping"]

    for field in REQUIRED_FIELDS:
        if field not in data:
            errors.append(f"missing required field `{field}`")

    app_id = data.get("id", "")
    dir_name = path.parent.name
    if app_id != dir_name:
        errors.append(f"`id` ({app_id!r}) does not match directory ({dir_name!r})")
    if not app_id.startswith("jellystack-"):
        errors.append(f"`id` must start with `jellystack-` (got {app_id!r})")

    category = data.get("category")
    if category and category not in ALLOWED_CATEGORIES:
        errors.append(f"unknown category {category!r} (allowed: {sorted(ALLOWED_CATEGORIES)})")

    port = data.get("port")
    if port is not None and (not isinstance(port, int) or port < 0):
        errors.append(f"`port` must be a non-negative integer (got {port!r})")

    deps = data.get("dependencies", [])
    if not isinstance(deps, list):
        errors.append("`dependencies` must be a list")

    return errors


def main() -> int:
    manifests = sorted(REPO_ROOT.glob("jellystack-*/umbrel-app.yml"))
    if not manifests:
        print("No jellystack-*/umbrel-app.yml found.", file=sys.stderr)
        return 1

    total_errors = 0
    for f in manifests:
        rel = f.relative_to(REPO_ROOT)
        errs = validate_file(f)
        if errs:
            total_errors += len(errs)
            print(f"❌ {rel}")
            for e in errs:
                print(f"    - {e}")
        else:
            print(f"✓ {rel}")

    print()
    if total_errors:
        print(f"{total_errors} error(s) across {len(manifests)} manifests.", file=sys.stderr)
        return 1
    print(f"All {len(manifests)} app manifests valid.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
