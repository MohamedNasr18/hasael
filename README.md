# HASAEL — Agricultural Investment Platform

An integrated digital agricultural ecosystem connecting farm owners, investors, and service providers in Egypt's agricultural sector.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/hasael run dev` — run the frontend (port 22250)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (stored in localStorage, signed with SESSION_SECRET)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (users, farms, investments, notifications, services)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, users, farms, feed, investments, notifications, services, dashboard)
- `artifacts/hasael/src/` — React frontend
  - `src/hooks/use-auth.tsx` — auth context and hook
  - `src/pages/` — all app pages
  - `src/index.css` — Tailwind theme tokens

## Architecture decisions

- JWT auth: token stored in localStorage; custom fetch in `lib/api-client-react/src/custom-fetch.ts` auto-attaches it
- Unified Account System: one user account holds multiple roles simultaneously; `active_role` determines marketplace context
- DB schema is flat (no Mongoose nested documents) — location and investment_terms flattened into farm columns
- OpenAPI-first: all types derived from `lib/api-spec/openapi.yaml` via Orval codegen
- Notifications auto-created inside investment controller on key events

## Product

- **Marketplace 1 — Agricultural Investment**: Farm owners list investment opportunities; investors browse the feed and submit interest/investment requests
- **Marketplace 2 — Agricultural Services**: Service providers (machinery, irrigation, logistics) list their services; farm owners browse and connect
- **Unified Account System**: One account, multiple roles — farm_owner, investor, service_provider

## User preferences

- Test users seeded: ahmed@hasael.eg / sara@hasael.eg / khaled@hasael.eg (all password: password123)
- Test seller account (user role): seller@hasael.eg / password123

## Gotchas

- Run `pnpm run typecheck:libs` after adding new DB schema tables before typechecking the API server
- `pnpm --filter @workspace/api-spec run codegen` must be re-run after any OpenAPI spec change
- bcrypt requires build script approval: `pnpm approve-builds`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
