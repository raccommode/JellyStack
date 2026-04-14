#!/usr/bin/env python3
"""Umbrel-aware validator for the monolithic `jellystack-app/docker-compose.yml`.

`docker compose config` rejects Umbrel's `app_proxy` service because it has no
`image:` (the service is injected at runtime by umbrelOS). This script parses
the compose and enforces the rules we care about:

  - Top-level `services:` must exist.
  - Every non-`app_proxy` service must declare an `image:` with a pinned tag.
  - `app_proxy` must declare `APP_HOST` and `APP_PORT` env vars.
  - The compose must include all services listed in the panel's service
    registry (jellystack-app/src/lib/services.ts), so adding a service to the
    registry without adding it to compose fails CI.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
COMPOSE_FILE = REPO_ROOT / "jellystack-app" / "docker-compose.yml"
SERVICES_TS = REPO_ROOT / "jellystack-app" / "src" / "lib" / "services.ts"


def parse_registry_service_ids() -> set[str]:
    """Extract service ids from the `SERVICES` array in `services.ts`."""
    if not SERVICES_TS.exists():
        return set()
    text = SERVICES_TS.read_text()
    ids = re.findall(r'id:\s*"([a-z][a-z0-9-]*)"', text)
    return set(ids)


def validate(data: dict) -> list[str]:
    errors: list[str] = []
    services = data.get("services")
    if not isinstance(services, dict):
        return ["missing or invalid `services:` mapping"]

    if "app_proxy" not in services:
        errors.append("missing required `app_proxy` service")
    else:
        env = services["app_proxy"].get("environment") if isinstance(services["app_proxy"], dict) else None
        if not isinstance(env, dict):
            errors.append("app_proxy `environment:` is not a mapping")
        else:
            if "APP_HOST" not in env:
                errors.append("app_proxy is missing `APP_HOST`")
            if "APP_PORT" not in env:
                errors.append("app_proxy is missing `APP_PORT`")

    real_services = {k: v for k, v in services.items() if k != "app_proxy"}
    if "panel" not in real_services:
        errors.append("missing required `panel` service")

    for name, svc in real_services.items():
        if not isinstance(svc, dict):
            errors.append(f"service `{name}` is not a mapping")
            continue
        image = svc.get("image")
        if not image:
            errors.append(f"service `{name}` has no `image:`")
        elif ":" not in str(image):
            errors.append(f"service `{name}` image `{image}` is not tagged")

    # Every service advertised in the registry must exist in compose.
    registry = parse_registry_service_ids()
    if registry:
        missing = registry - set(real_services.keys())
        if missing:
            errors.append(
                "services advertised in the registry but missing from compose: "
                + ", ".join(sorted(missing))
            )

    return errors


def main() -> int:
    if not COMPOSE_FILE.exists():
        print(f"Compose file not found: {COMPOSE_FILE}", file=sys.stderr)
        return 1

    with COMPOSE_FILE.open() as f:
        try:
            data = yaml.safe_load(f)
        except yaml.YAMLError as e:
            print(f"❌ {COMPOSE_FILE.name}: YAML parse error: {e}", file=sys.stderr)
            return 1

    errors = validate(data)
    rel = COMPOSE_FILE.relative_to(REPO_ROOT)
    if errors:
        print(f"❌ {rel}")
        for e in errors:
            print(f"    - {e}")
        return 1

    services = data.get("services", {})
    real_count = len([k for k in services if k != "app_proxy"])
    print(f"✓ {rel} ({real_count} services)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
