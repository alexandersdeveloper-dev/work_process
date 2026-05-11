# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: Next.js version

This project uses **Next.js 16.2.4 with React 19**. APIs and conventions differ from older Next.js versions you may have in training data. Before writing code that touches Next.js APIs, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.

Notable patterns already in this codebase that you must preserve:
- Dynamic route params are async: `{ params: Promise<{ id: string }> }` — must be `await`ed.
- `cookies()` from `next/headers` is async — `await cookies()`.
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

`SUPABASE_SERVICE_ROLE_KEY` is used in Route Handlers (`src/app/api/`) and `src/lib/audit.ts` to bypass RLS. Never expose it to the browser or use it in Client Components.

## Architecture

**Domain.** SIGA — "Sistema Integrado de Gestão Administrativa". Portuguese-language (pt-BR) internal tool for public-sector work process management. Core entities and their relationships are defined in [src/types/index.ts](src/types/index.ts).

**Database tables (Supabase).** `processes`, `steps`, `profiles`, `process_shares`, `comunicados`, `folgas`, `notifications`, `audit_logs`. Schema and RLS policies are in [supabase_migration.sql](supabase_migration.sql) — when schema changes are needed, provide SQL for the user to run in the Supabase SQL Editor.

**Three Supabase client factories:**
- [src/lib/supabase.ts](src/lib/supabase.ts) — `createClient()` browser singleton, for Client Components.
- [src/lib/supabase-server.ts](src/lib/supabase-server.ts) — `createServerSupabaseClient()` async, for Server Components and Route Handlers.
- [src/proxy.ts](src/proxy.ts) — inline client for the request/response cookie cycle.

**Auth & access control.** The [proxy](src/proxy.ts) enforces three invariants on every request: (1) no session → `/login`; (2) session + `/login` → `/`; (3) session with `user_metadata.force_password_change === true` → `/mudar-senha`. Role-based page guards are handled server-side in layouts/pages via `createServerSupabaseClient` + a `profiles` query — not in the proxy. Client-side helpers are in [src/lib/auth-guard.ts](src/lib/auth-guard.ts) (`canEdit`, `isAdmin`, `canPublish`, `canManageFolgas`).

**Roles.** Three roles stored in `profiles.role`: `admin` (full access + user management), `chefe` (unit dashboard + all processes + manages folgas + publishes comunicados), `servidor` (own + shared processes only). A new user's role defaults to `servidor` via a database trigger; admins promote via `/admin/usuarios`.

**User context.** [src/lib/user-context.tsx](src/lib/user-context.tsx) exposes `UserProvider` (wraps `AppShell` in the root layout) and `useUser()` hook returning `{ user, profile, loading, refreshProfile }`. Use `useUser()` in any Client Component that needs identity or role.

**App shell.** [src/app/layout.tsx](src/app/layout.tsx) nests `UserProvider` → `ShellProvider` → `AppShell`. [AppShell](src/components/shell/AppShell.tsx) bypasses the sidebar/topbar chrome on `/login` and `/mudar-senha`. [ShellProvider](src/components/shell/ShellProvider.tsx) holds theme, mobile sidebar open/close, and sidebar **collapsed** state. Collapsed state persists to `localStorage('siga_sidebar_collapsed')` and is read on mount. When collapsed, `AppShell` adds class `sidebar-collapsed` to the root `.app` div; CSS animates the sidebar width from 248 px → 60 px. An inline `<script>` in `<head>` reads `siga_theme` from `localStorage` before hydration to prevent flash.

**Modules:**
- `/processes` — own processes (role=servidor: owner only; chefe/admin: all). Sharing via `process_shares`; [ShareModal](src/app/processes/[id]/ShareModal.tsx) inserts share + notification. Admins do not appear in share target list.
- `/compartilhados` — processes shared *with* the current user (servidor role). Sidebar link visible only for `servidor`.
- `/comunicados` — renamed "Comunicado Institucional". chefe/admin publish; servidor sees only `target_user_ids IS NULL` or where their id is in the array. Each comunicado has a `type` (aviso/comunicado/informativo) and optional `target_user_ids uuid[]` (null = broadcast to all non-admin). [ComunicadoForm](src/app/comunicados/ComunicadoForm.tsx) is launched from a modal inside [ComunicadosClient](src/app/comunicados/ComunicadosClient.tsx) — no separate page for new.
- `/calendario` — monthly grid of `folgas` (type: 'folga' | 'ferias') + process deadlines. Folga visibility is role-scoped server-side: `servidor` sees only their own folgas; `chefe`/`admin` see all. Process deadlines (`ProcessDeadline` type, exported from `page.tsx`) follow the same role scoping as `/processes`. Chefe/admin register absences via [AusenciaDrawer](src/app/calendario/AusenciaDrawer.tsx) (multi-day selection). [CalendarioClient](src/app/calendario/CalendarioClient.tsx) uses `useMemo` Maps for O(1) date lookups (`folgasByDate`, `deadlinesByDate`). Calendar cells have fixed height (`96px` desktop / `72px` tablet / `56px` mobile) with `overflow: hidden`; the `+N mais` overflow counter is `position: absolute` at the cell bottom so it is always visible. Includes a styled 4-column PDF export (`handlePrint`). Admin profiles are excluded from the server selector.
- `/unidade` — unit dashboard (chefe/admin only, layout guard). Shows aggregate stats + per-servidor breakdown. [/unidade/processos](src/app/unidade/processos/page.tsx) shows all processes in the unit.
- `/admin` — admin-only layout guard. Stats dashboard + user management (`/admin/usuarios` with 20-per-page pagination). User creation via `POST /api/admin/users` (service role, with full payload validation + rate limit + audit log). Deletion via `DELETE /api/admin/users/[id]` (UUID validated + audit log).
- `/mudar-senha` — isolated first-access page, no shell chrome. After success uses `window.location.replace('/')` (hard redirect avoids stale JWT cookie race with proxy).
- Notifications — [NotificationBell](src/components/shell/NotificationBell.tsx) in topbar; live updates via Supabase Realtime (`postgres_changes` on `notifications` filtered by `user_id`). [DeadlineNotifier](src/app/DeadlineNotifier.tsx) runs on dashboard mount, inserts `deadline_soon` notifications (deduped per 24 h).

**Security primitives** (all in `src/lib/`):
- [password-policy.ts](src/lib/password-policy.ts) — `validatePassword(pw)`: min 8 chars, 1 uppercase, 1 digit. Use at every password entry point (login, mudar-senha, API).
- [rate-limit.ts](src/lib/rate-limit.ts) — `checkRateLimit(key, limit, windowMs)`: in-memory sliding window. Applied to `POST /api/admin/users` (10 req/h per IP).
- [audit.ts](src/lib/audit.ts) — `logAudit({actorId, action, ...})`: writes to `audit_logs` table via service role. Actions: `user_created`, `user_deleted`, `role_changed`, `password_changed`. Never throws — failures are silently logged server-side.

**Styling.** Single global stylesheet [src/app/globals.css](src/app/globals.css) with CSS variables and utility classes (`.card`, `.btn`, `.pill`, `.tabs`, `.t` for tables, `.tl-*` for timelines). Theme via `data-theme="light|dark"` on `<html>`. No Tailwind, no CSS modules. Use existing classes + inline `style` for one-offs. Pill variants: `.pill.success` (green), `.pill.warning` (amber), `.pill.danger` (red), `.pill.info` (blue) — all have dark-mode overrides in globals.css. Timeline mark variants: `.tl-mark.done` (dark filled), `.tl-mark.accent` (accent border/color, neutral state), `.tl-mark.negative` (red filled, rejection state), `.tl-mark.clickable` (adds pointer cursor + hover scale). Calendar cell layout: `.cal-cell` has fixed height + `overflow: hidden`; overflow counters use `position: absolute` anchored to the cell bottom.

**Mutation pattern.** Client Components call `supabase.from(...)` directly, then `router.refresh()` to repaint the parent Server Component. No Server Actions, no SWR/React Query. Supabase queries in `useEffect` must use `async function` + `await` — never `.then()` callbacks. **Gotcha:** never call `router.refresh()` immediately after `router.push('/other-route')` when the current page's data has been invalidated (e.g., after deleting the current resource) — the refresh re-runs the server component before navigation completes, finds null data, and calls `notFound()`, causing a 404 flash.

**Type system.** `Process.type` and `Step.step_type` are free-form strings. Always render through `getProcessTypeLabel()` / `getStepTypeLabel()` so legacy enum-key rows display correctly. User-defined types persist to `localStorage` keys `siga_process_types` and `siga_step_types`. `Step` also carries `mark_state: 'neutral' | 'positive' | 'negative' | null` (DB column `steps.mark_state text DEFAULT 'neutral'`, added via migration). The `tl-mark` in [StepTimeline](src/app/processes/[id]/StepTimeline.tsx) is clickable and cycles through the three states, updating the DB directly from the client — no `router.refresh()` needed.

## Conventions

- All user-facing strings are in Portuguese (pt-BR). Date formatting uses `toLocaleDateString('pt-BR', ...)`.
- Path alias: `@/*` → `src/*` ([tsconfig.json](tsconfig.json)).
- When SQL changes are needed, always provide the full SQL for the user to run in the Supabase SQL Editor — never assume it has been executed.
- When a new env var is needed, ask the user for the value and write it to `.env.local` directly — never leave placeholders.
- API Route Handlers must: (1) authenticate the caller, (2) verify role, (3) validate every field of the payload, (4) return generic error messages to the client (log specifics server-side with `console.error`), (5) call `logAudit` for any state-changing admin action.
- Never expose `err.message` from Supabase or internal exceptions directly to the browser response.
- `hydration`: `new Date()` called at render time causes server/client mismatch. For date formatting that depends on the user's locale/timezone (e.g. `toLocaleString('pt-BR')`), add `suppressHydrationWarning` to the containing element — this is the preferred fix over `useEffect` state for read-only display. For state that drives rendering logic, initialise inside `useEffect`.
- `CSP`: `next.config.ts` sets a Content-Security-Policy. `'unsafe-eval'` is included in `script-src` only in `NODE_ENV === 'development'` (React dev mode requires it). Never add `'unsafe-eval'` to the production CSP.
