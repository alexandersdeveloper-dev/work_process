# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: Next.js version

This project uses **Next.js 16.2.4 with React 19**. APIs and conventions differ from older Next.js versions you may have in training data. Before writing code that touches Next.js APIs, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.

Notable patterns already in this codebase that you must preserve:
- Dynamic route params are async: `{ params: Promise<{ id: string }> }` — must be `await`ed.
- `cookies()` from `next/headers` is async — `await cookies()` ([src/lib/supabase-server.ts](src/lib/supabase-server.ts)).
- Pages that read from Supabase declare `export const dynamic = 'force-dynamic'` to opt out of static rendering.
- The proxy file is `src/proxy.ts` exporting `proxy()` — **not** `middleware.ts` / `middleware()` (deprecated in Next.js 16).

## Commands

Run all commands from the `siga/` directory.

- `npm run dev` — dev server on http://localhost:3000
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, `eslint-config-next/core-web-vitals` + TypeScript)
- `npx tsc --noEmit` — type-check without building

There is no test runner configured.

## Required environment (`siga/.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # anon/publishable key
SUPABASE_SERVICE_ROLE_KEY=       # service_role key — server-only, never NEXT_PUBLIC_
```

`SUPABASE_SERVICE_ROLE_KEY` is used only in [src/app/api/admin/users/route.ts](src/app/api/admin/users/route.ts) to call `supabase.auth.admin.createUser()`. It bypasses RLS — never expose it to the browser.

## Architecture

**Domain.** SIGA — "Sistema Integrado de Gestão Administrativa". Portuguese-language (pt-BR) internal tool for public-sector work process management. Core entities and their relationships are defined in [src/types/index.ts](src/types/index.ts).

**Database tables (Supabase).** `processes`, `steps`, `profiles`, `process_shares`, `comunicados`, `folgas`, `notifications`. Schema and RLS policies are in [supabase_migration.sql](supabase_migration.sql) — when schema changes are needed, provide SQL for the user to run in the Supabase SQL Editor.

**Three Supabase client factories:**
- [src/lib/supabase.ts](src/lib/supabase.ts) — `createClient()` browser singleton, for Client Components.
- [src/lib/supabase-server.ts](src/lib/supabase-server.ts) — `createServerSupabaseClient()` async, for Server Components and Route Handlers.
- [src/proxy.ts](src/proxy.ts) — inline client for the request/response cookie cycle.

**Auth & access control.** The [proxy](src/proxy.ts) enforces three invariants on every request: (1) no session → `/login`; (2) session + `/login` → `/`; (3) session with `user_metadata.force_password_change === true` → `/mudar-senha`. Role-based page guards are handled server-side in layouts/pages using `createServerSupabaseClient` + a `profiles` query — not in the proxy. Client-side helpers are in [src/lib/auth-guard.ts](src/lib/auth-guard.ts) (`canEdit`, `isAdmin`, `canPublish`, `canManageFolgas`).

**Roles.** Three roles stored in `profiles.role`: `admin` (full access + user management), `chefe` (sees all processes + manages folgas + publishes comunicados), `servidor` (sees only own + shared processes). A new user's role defaults to `servidor` via a database trigger; admins promote via `/admin/usuarios`.

**User context.** [src/lib/user-context.tsx](src/lib/user-context.tsx) exposes `UserProvider` (wraps `AppShell` in the root layout) and `useUser()` hook returning `{ user, profile, loading, refreshProfile }`. Use `useUser()` in any Client Component that needs the current user's identity or role — no prop-drilling needed.

**App shell.** [src/app/layout.tsx](src/app/layout.tsx) nests `UserProvider` → `ShellProvider` → `AppShell`. [AppShell](src/components/shell/AppShell.tsx) bypasses the sidebar/topbar chrome on `/login` and `/mudar-senha`. [ShellProvider](src/components/shell/ShellProvider.tsx) holds theme and mobile sidebar state. An inline `<script>` in `<head>` reads `siga_theme` from `localStorage` before hydration to prevent flash.

**Modules:**
- `/processes` — process list filtered by role (servidor: own + shared; chefe/admin: all). Sharing via `process_shares` table; [ShareModal](src/app/processes/[id]/ShareModal.tsx) inserts share + notification in one flow.
- `/comunicados` — chefe/admin publish; all users read. Publishing notifies every user via the `notifications` table.
- `/calendario` — monthly grid of `folgas`. Chefe/admin register folgas via [AddFolgaModal](src/app/calendario/AddFolgaModal.tsx); saves notification for the affected user.
- `/admin` — admin-only layout guard. Includes stats dashboard and user management (`/admin/usuarios`). User creation calls the Route Handler `POST /api/admin/users` (service role); supports `force_password_change` flag.
- Notifications — [NotificationBell](src/components/shell/NotificationBell.tsx) in topbar; live updates via Supabase Realtime (`postgres_changes` on `notifications` filtered by `user_id`). [DeadlineNotifier](src/app/DeadlineNotifier.tsx) runs on dashboard mount and inserts `deadline_soon` notifications (deduped per 24h).

**Styling.** Single global stylesheet [src/app/globals.css](src/app/globals.css) with CSS variables and utility classes (`.card`, `.btn`, `.pill`, `.tabs`, `.t` for tables, `.tl-*` for timelines). Theme via `data-theme="light|dark"` on `<html>`. No Tailwind, no CSS modules. Use existing classes + inline `style` for one-offs.

**Mutation pattern.** Client Components call `supabase.from(...)` directly, then `router.refresh()` to repaint the parent Server Component. No Server Actions, no SWR/React Query. Supabase queries in `useEffect` must use `async function` + `await` — never `.then()` callbacks (avoids implicit `any` under strict TypeScript).

**Type system.** `Process.type` and `Step.step_type` are free-form strings. Always render through `getProcessTypeLabel()` / `getStepTypeLabel()` so legacy enum-key rows display correctly. User-defined types persist to `localStorage` keys `siga_process_types` and `siga_step_types`.

## Conventions

- All user-facing strings are in Portuguese (pt-BR). Date formatting uses `toLocaleDateString('pt-BR', ...)`.
- Path alias: `@/*` → `src/*` ([tsconfig.json](tsconfig.json)).
- When SQL changes are needed, always provide the full SQL for the user to run in the Supabase SQL Editor — never assume it has been executed.
- When a new env var is needed, ask the user for the value and write it to `.env.local` directly — never leave placeholders.
