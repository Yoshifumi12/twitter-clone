# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

This is a freshly bootstrapped `create-next-app` project (App Router) — currently just the default scaffold in [src/app/](src/app/), with no application-specific routes, components, or data layer yet. Despite the repo name, no Twitter-clone features have been built.

## Commands

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)

There is no test runner configured in this project.

## Stack notes

- Next.js 16.2.10 / React 19.2.4, App Router only (no `pages/` directory).
- Styling via Tailwind CSS v4, wired through `@tailwindcss/postcss` (see [postcss.config.mjs](postcss.config.mjs)); theme tokens are defined with `@theme inline` in [src/app/globals.css](src/app/globals.css) rather than a `tailwind.config.js`.
- Path alias `@/*` maps to `./src/*` (see [tsconfig.json](tsconfig.json)).
- Per [AGENTS.md](AGENTS.md), this Next.js version has diverged from prior training data — consult `node_modules/next/dist/docs/` (organized into `01-app`, `02-pages`, `03-architecture`, `04-community`) before relying on remembered Next.js APIs or conventions, especially for anything App Router related.
