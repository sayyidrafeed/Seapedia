# i18n Migration Plan — Seapedia Frontend

## Goal

Migrate all hardcoded English copy to Bahasa Indonesia using **i18next + react-i18next**, with Indonesian as default + fallback language. Keep English as a secondary option for evaluators.

## Decisions

| Decision          | Choice                                                |
| ----------------- | ----------------------------------------------------- |
| Library           | `i18next` + `react-i18next`                           |
| Default language  | `id` (Indonesia)                                      |
| Fallback language | `id` (primary is Indonesian)                          |
| Persistence       | `localStorage` key `i18nextLng`                       |
| Detection         | Manual toggle only — no browser detection             |
| Scope (Phase 1)   | Public UI: landing, auth, navbar, footer, review form |
| Scope (Phase 2)   | Dashboard pages (later)                               |

## Architecture

```
src/lib/i18n/
  config.ts        # i18next init with id default, localStorage persistence
  locales/
    id.json        # All Indonesian copy (complete)
    en.json        # English copy (fallback for devs/evaluators)
```

## File Migration Order

1. Install: `bun add i18next react-i18next`
2. Create: `config.ts`, `id.json`, `en.json`
3. Wire: `src/main.tsx` — import config
4. Component migration (14 files):
   - `marketplace-hero.tsx`
   - `footer.tsx`
   - `navbar.tsx` + `navbar-mobile.tsx`
   - `login.tsx` + `login-form.tsx`
   - `register.tsx` + `register-form.tsx`
   - `onboard.tsx`
   - `select-role.tsx` + `select-role-panel.tsx`
   - `application-review-form.tsx`
   - `index.tsx` (landing page)
5. Create: `LanguageSwitcher` component
6. Wire: Add switcher to footer
7. Polkadot: `index.html` → `<html lang="id">`

## Key Convention

```
t("key")                     — simple string
t("key", { name })           — interpolation
t("key", { context: role })  — context-aware translations
```

## Components Needing Dynamic Keys

- `select-role-panel.tsx`: `{role} Dashboard` → use `t("dashboard.role", { role })`
- `navbar.tsx`: role badge + dashboard label → pass `t()` with context

## Quality Gates

bun run check bun run fl
Compliances AGENTS.md
