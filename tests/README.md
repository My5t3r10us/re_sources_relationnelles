# Tests

Cette suite couvre 4 niveaux :

| Couche | Outil | Localisation | Commande |
| --- | --- | --- | --- |
| Unitaires (web) | Vitest + Testing Library | `tests/unit/` | `npm run test:unit` |
| API (web) | Vitest + Supertest | `tests/api/` | `npm run test:api` |
| E2E (web) | Playwright | `tests/e2e/` | `npm run test:e2e` |
| Mobile (Expo) | Maestro | `mobile/.maestro/flows/` | `maestro test mobile/.maestro/flows` |

## Pré-requis

Un Postgres de test **dédié** (séparé de la base de dev) est obligatoire pour les tests API et E2E. Le helper `tests/setup/db.ts` tronque toutes les tables entre chaque test, donc ne pointez jamais cette URL vers votre base de dev.

```bash
# .env.test (ou variables shell)
DATABASE_URL_TEST="postgres://postgres:postgres@localhost:5432/resources_test"
```

Avant la première exécution :

```bash
createdb resources_test
npm run db:test:push   # applique le schéma sur la base de test
```

## Lancer

```bash
npm run test            # vitest run (unit + api)
npm run test:watch      # vitest --watch
npm run test:coverage   # rapport coverage (v8 + HTML)

npm run test:e2e        # Playwright (chromium + firefox + mobile-chrome)
npm run test:e2e:ui     # mode UI

# Mobile (nécessite Maestro + un device/emulator où l'app est installée)
cd mobile
maestro test .maestro/flows
```

## Architecture

### Vitest (web + API)

- `vitest.config.ts` : jsdom pour `tests/unit/`, node pour `tests/api/` (via `environmentMatchGlobs`)
- `tests/setup/vitest.setup.ts` : `@testing-library/jest-dom`, mocks de `next-intl`
- `tests/setup/db.ts` : `resetDb`, `createTestUser`, `createTestResource`, etc.
- `tests/setup/next-handler-server.ts` : adapte les route handlers Next.js (App Router) à un serveur HTTP Node sur lequel supertest peut taper
- `tests/setup/api-harness.ts` : `setupApiHarness(routes)` monte/démonte le serveur + reset DB par test

### Playwright (E2E web)

- `playwright.config.ts` : 3 projets (chromium, firefox, mobile-chrome), 1 worker pour éviter les races sur la base de test
- `tests/e2e/global.setup.ts` : seed la base avec un compte admin + citizen + catégorie + ressource publiée avant les specs
- `tests/e2e/helpers/auth.ts` : helpers `login` + credentials E2E

### Maestro (mobile)

- `mobile/.maestro/config.yaml` : appId
- `mobile/.maestro/flows/auth/_login-helper.yaml` : flow réutilisé par les autres scénarios via `runFlow`
- Comptes utilisés : `citizen-e2e@test.local` / `admin-e2e@test.local` / `Password123!`

## CI

`PLAYWRIGHT_NO_SERVER=1` permet de cibler un serveur déjà lancé (CI avec un service à part).
Voir `playwright.config.ts` pour la condition.
