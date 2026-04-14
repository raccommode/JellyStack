#!/usr/bin/env python3
"""Umbrel-aware validator for every `jellystack-*/docker-compose.yml`.

`docker compose config` rejects Umbrel's `app_proxy` service because it has no
`image:` (the service is injected at runtime by umbrelOS). This script parses
each manifest and enforces the rules we actually care about:

  - Top-level `services:` must exist.
  - Every non-`app_proxy` service must declare an `image:` with a pinned tag.
  - `app_proxy` (if present) must declare `APP_HOST` and `APP_PORT` env vars.
  - Volumes referencing `${UMBREL_ROOT}` / `${APP_DATA_DIR}` / `${JELLYSTACK_ROOT}`
    are allowed (these are the standard Umbrel + JellyStack env vars).
"""
from __future__ import annotations

import sys
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
ALLOWED_ENV_VARS = {"UMBREL_ROOT", "APP_DATA_DIR", "JELLYSTACK_ROOT", "APP_SEED",
                    "APP_HIDDEN_SERVICE", "DEVICE_HOSTNAME", "DEVICE_DOMAIN_NAME",
                    "PUID", "PGID", "UMASK", "TZ",
                    "VPN_SERVICE_PROVIDER", "VPN_TYPE", "WIREGUARD_PRIVATE_KEY",
                    "WIREGUARD_ADDRESSES", "SERVER_CITIES"}


def validate_file(path: Path) -> list[str]:
    errors: list[str] = []
    with path.open() as f:
        try:
            data = yaml.safe_load(f)
        except yaml.YAMLError as e:
            return [f"YAML parse error: {e}"]

    if not isinstance(data, dict):
        return ["top-level must be a mapping"]

    services = data.get("services")
    if not isinstance(services, dict):
        return ["missing or invalid `services:` mapping"]

    has_app_proxy = "app_proxy" in services
    real_services = {k: v for k, v in services.items() if k != "app_proxy"}

    if not real_services:
        errors.append("no real service defined (only app_proxy)")

    for name, svc in real_services.items():
        if not isinstance(svc, dict):
            errors.append(f"service `{name}` is not a mapping")
            continue
        image = svc.get("image")
        if not image:
            errors.append(f"service `{name}` has no `image:`")
        elif ":" not in str(image):
            errors.append(f"service `{name}` image `{image}` is not tagged")

    if has_app_proxy:
        proxy = services["app_proxy"]
        env = proxy.get("environment", {}) if isinstance(proxy, dict) else {}
        if isinstance(env, dict):
            if "APP_HOST" not in env:
                errors.append("app_proxy is missing `APP_HOST`")
            if "APP_PORT" not in env:
                errors.append("app_proxy is missing `APP_PORT`")
        else:
            errors.append("app_proxy `environment:` is not a mapping")

    return errors


def main() -> int:
    compose_files = sorted(REPO_ROOT.glob("jellystack-*/docker-compose.yml"))
    if not compose_files:
        print("No jellystack-*/docker-compose.yml found.", file=sys.stderr)
        return 1

    total_errors = 0
    for f in compose_files:
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
        print(f"{total_errors} error(s) across {len(compose_files)} files.", file=sys.stderr)
        return 1
    print(f"All {len(compose_files)} compose files valid.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
