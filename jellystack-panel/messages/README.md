# Panel translations

The JellyStack panel uses [next-intl](https://next-intl.dev/) for internationalization. The source of truth is **`en.json`** — every other locale file must mirror its key structure exactly.

## Adding a new language

1. **Copy `en.json`** to `<code>.json`, where `<code>` is the [BCP-47 language tag](https://en.wikipedia.org/wiki/IETF_language_tag) (e.g. `es`, `de`, `pt-BR`, `zh`).
2. **Translate the values** — keep the keys and ICU placeholders (`{name}`, `{count, plural, ...}`) untouched.
3. **Register the locale** in `src/i18n/config.ts`:
   - Add the code to the `locales` array.
   - Add a matching entry to `localeNames` with the native name and flag emoji.

CI will run `pnpm i18n:check` to confirm every locale file has the exact same keys as `en.json`. Missing or extra keys fail the build.

## Translation style guide

- **Never translate** proper nouns: *Jellyfin, Sonarr, Radarr, Prowlarr, Umbrel, qBittorrent*, etc.
- **Mirror the tone of `en.json`**: conversational, second-person, direct.
  - French uses **tutoiement** (informal "tu"), consistent with the self-hosted ecosystem.
- **ICU plurals**: keep the `{count, plural, ...}` block intact; adapt the `one` / `other` / `few` / `many` branches to the target language's pluralization rules.
- **No hard-coded English** in strings (e.g. don't leave "settings" inside a translated sentence).
- **Sentence-case** labels in English, adapt to the target language's conventions.

## Checking your work

```bash
pnpm i18n:check   # verifies all locale files have the same keys as en.json
pnpm dev          # start the dev server and switch languages from the header
```

## Currently shipped

| Code | Language  | Native name | Status  |
|------|-----------|-------------|---------|
| `en` | English   | English     | Source  |
| `fr` | French    | Français    | Shipped |

Want to contribute a new language? Open a PR — we review translation quality, not just key coverage.
