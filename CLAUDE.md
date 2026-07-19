# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

Despite the CLAUDE.md name and bootstrapped origins, this is now an actively developed Twitter clone (App Router). Auth (Auth0), a Postgres/Prisma data layer, and the first product features (sign-in, nav, Yap composition) are in place.

- Auth: [src/lib/auth0.ts](src/lib/auth0.ts) + [src/proxy.ts](src/proxy.ts) (Next's middleware equivalent — see AGENTS.md note below on why it's not `middleware.ts`). Signed-in routes live under the [src/app/(app)/](<src/app/(app)/>) route group, which redirects to `/signin` when there's no session (see [layout.tsx](<src/app/(app)/layout.tsx>)).
- Data layer: Prisma 7 with the `prisma-client` generator, output to [src/generated/prisma/](src/generated/prisma/) (not the default `node_modules/.prisma`). Schema at [prisma/schema.prisma](prisma/schema.prisma) currently models `User` and `Yap` (self-referencing replies via `parentId`, `YapStatus` enum for draft/published). Client wired in [src/lib/prisma.ts](src/lib/prisma.ts) via `@prisma/adapter-pg`.
- Routes under `(app)`: home feed, `[username]` profile, `bookmarks`, `chat`, `connect`, `explore`, `notifications` — most are still stubs; the feed/composer are the actively developed piece (`yap-actions.ts`, `components/yap/compose-dialog.tsx`).
- Forms: `@conform-to/react` + `@conform-to/zod` for form state/validation (see [src/lib/validations/](src/lib/validations/)), Radix primitives wrapped in [src/components/ui/](src/components/ui/).

## Commands

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- `npm run format` / `npm run format:check` — Prettier
- `npm test` — Vitest unit/component tests (jsdom, config in [vitest.config.ts](vitest.config.ts), setup in `vitest.setup.ts`). Test files sit next to the code they cover (`*.test.ts(x)`).
- `npm run test:e2e` — Playwright e2e tests ([playwright.config.ts](playwright.config.ts), spec dir `./e2e`, runs against `npm run dev` on port 3000, chromium/firefox/webkit).
- `npx prisma migrate dev` / `npx prisma generate` — schema migrations and client generation (regenerate after touching `prisma/schema.prisma`, since the client is checked into `src/generated/`).

## Stack notes

- Next.js 16.2.10 / React 19.2.4, App Router only (no `pages/` directory).
- Styling via Tailwind CSS v4, wired through `@tailwindcss/postcss` (see [postcss.config.mjs](postcss.config.mjs)); theme tokens are defined with `@theme inline` in [src/app/globals.css](src/app/globals.css) rather than a `tailwind.config.js`.
- Path alias `@/*` maps to `./src/*` (see [tsconfig.json](tsconfig.json)).
- Per [AGENTS.md](AGENTS.md), this Next.js version has diverged from prior training data — consult `node_modules/next/dist/docs/` (organized into `01-app`, `02-pages`, `03-architecture`, `04-community`) before relying on remembered Next.js APIs or conventions, especially for anything App Router related. Notably, the middleware convention has moved from `middleware.ts` to [src/proxy.ts](src/proxy.ts)'s exported `proxy` function.
- Auth0 env vars (`AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_DB_CONNECTION`, etc.) are required locally (`.env.local`, gitignored) and stubbed with dummy values in `vitest.config.ts` for tests.
