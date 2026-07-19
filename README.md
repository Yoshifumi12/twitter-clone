# Twitter Clone

A Twitter-style app built on Next.js (App Router), with Auth0 authentication and a Postgres/Prisma data layer.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` with the required Auth0 and database variables:

   - `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_DB_CONNECTION`
   - `DATABASE_URL` (Postgres connection string for Prisma)

3. Apply database migrations and generate the Prisma client:

   ```bash
   npx prisma migrate dev
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the app. Signed-in routes live under the `(app)` route group and redirect to `/signin` without a session.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint
- `npm run format` / `npm run format:check` — Prettier
- `npm test` — Vitest unit/component tests
- `npm run test:e2e` — Playwright end-to-end tests

## Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Styling**: Tailwind CSS v4
- **Auth**: Auth0 (`@auth0/nextjs-auth0`)
- **Database**: PostgreSQL via Prisma 7 (`@prisma/adapter-pg`), schema at [prisma/schema.prisma](prisma/schema.prisma)
- **Forms**: Conform + Zod
- **UI primitives**: Radix UI
- **Testing**: Vitest (unit/component) and Playwright (e2e)

> **Note for AI coding agents**: see [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md) — this project pins a Next.js version whose App Router APIs have diverged from most models' training data.
