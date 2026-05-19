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

**Database tables (Supabase).** `processes`, `steps`, `profiles`, `process_shares`, `comunicados`, `folgas`, `notifications`, `audit_logs`, `user_process_types`, `user_step_types`, `kanban_cards`, `kanban_shares`. Schema and RLS policies are in [supabase_migration.sql](supabase_migration.sql) — when schema changes are needed, provide SQL for the user to run in the Supabase SQL Editor.

**Three Supabase client factories:**
- [src/lib/supabase.ts](src/lib/supabase.ts) — `createClient()` browser singleton, for Client Components.
- [src/lib/supabase-server.ts](src/lib/supabase-server.ts) — `createServerSupabaseClient()` async, for Server Components and Route Handlers.
- [src/proxy.ts](src/proxy.ts) — inline client for the request/response cookie cycle.

**Auth & access control.** The [proxy](src/proxy.ts) enforces three invariants on every request: (1) no session → `/login`; (2) session + `/login` → `/`; (3) session with `user_metadata.force_password_change === true` → `/mudar-senha`. Role-based page guards are handled server-side in layouts/pages via `createServerSupabaseClient` + a `profiles` query — not in the proxy. Client-side helpers are in [src/lib/auth-guard.ts](src/lib/auth-guard.ts) (`canEdit`, `isAdmin`, `canPublish`, `canManageFolgas`).

**Roles.** Three roles stored in `profiles.role`: `admin` (full access + user management), `chefe` (unit dashboard + all processes + manages folgas + publishes comunicados), `servidor` (own + shared processes only). A new user's role defaults to `servidor` via a database trigger; admins promote via `/admin/usuarios`.

**User context.** [src/lib/user-context.tsx](src/lib/user-context.tsx) exposes `UserProvider` and `useUser()` returning `{ user, profile, loading, refreshProfile }`. The root layout fetches `user` + `profile` server-side and passes them as `initialUser`/`initialProfile` props — so `loading` is always `false` on first render and there are no client-side auth round-trips. `useEffect` only subscribes to `onAuthStateChange` for subsequent session changes.

**App shell.** [src/app/layout.tsx](src/app/layout.tsx) nests: `QueryProvider` → `ToastProvider` → `ActionLoaderProvider` → `UserProvider` → `ShellProvider` → `AppShell`. [AppShell](src/components/shell/AppShell.tsx) bypasses the sidebar/topbar chrome on `/login` and `/mudar-senha`. [ShellProvider](src/components/shell/ShellProvider.tsx) holds theme, mobile sidebar open/close, and sidebar **collapsed** state. Collapsed state persists to `localStorage('siga_sidebar_collapsed')` and is read on mount. When collapsed, `AppShell` adds class `sidebar-collapsed` to the root `.app` div; CSS animates the sidebar width from 248 px → 60 px. An inline `<script>` in `<head>` reads `siga_theme` from `localStorage` before hydration to prevent flash.

**Navigation performance.** There are **no `loading.tsx` files** in this project — they were intentionally deleted because Next.js fires them on every navigation including back-navigation, creating a skeleton flash even when TanStack Query has cached data. Do not create `loading.tsx` files. Instead: [NavigationProgress](src/components/shell/NavigationProgress.tsx) detects link clicks via event delegation and shows a thin accent-colored progress bar at the top of the viewport. [PageTransition](src/components/shell/PageTransition.tsx) replaces the `key={pathname}` pattern on the content wrapper — it re-applies the `page-enter` CSS class via `requestAnimationFrame` on pathname change without unmounting the component tree, so TanStack Query cache is never destroyed by navigation.

**Client data layer (TanStack Query).** All client-side data fetching uses TanStack Query v5 via hooks in [src/hooks/](src/hooks/). Query keys are centralised in [src/lib/query-keys.ts](src/lib/query-keys.ts) — always use these constants, never write raw key arrays inline. Key conventions:
- Hooks accept `initialData` from server-fetched props so the first render is synchronous (no skeleton on navigation back to a cached page). Pair with `initialDataUpdatedAt: Date.now()` and an appropriate `staleTime`.
- `keepPreviousData` (`placeholderData: keepPreviousData`) on list hooks prevents flash-of-empty when filters change.
- After a mutation that changes a list, call `queryClient.invalidateQueries({ queryKey: queryKeys.X(...) })`. For insert mutations where the returned row is available, also call `queryClient.setQueryData` first so the item appears immediately without waiting for the background refetch.
- Never call `router.refresh()` after a mutation that has a TanStack Query cache — use `invalidateQueries` instead.

**Global UX feedback.** Two mandatory contexts wrap all mutations:
- [ActionLoaderContext](src/contexts/ActionLoaderContext.tsx) — ref-counted 3 px progress bar at the top of the viewport. Call `showLoader()` at the start and `hideLoader()` in `finally`.
- [ToastContext](src/contexts/ToastContext.tsx) — `showToast(message, type?)` where `type` is `'success'` (default, 2.5 s) or `'error'` (4 s). Fixed bottom-right stack, `zIndex: 300`.

Every write operation (create/update/delete) **must** follow this exact cycle: disable the submit button → `showLoader()` → `supabase` call → `showToast(...)` on success → `showToast(..., 'error')` in catch → `hideLoader()` in finally → re-enable button. Validation errors (checked before the async call) stay as inline `setValidationError` state, never as toasts.

**Modules:**
- `/processes` — own processes (role=servidor: owner only; chefe/admin: all). Sharing via `process_shares`; [ShareModal](src/app/processes/[id]/ShareModal.tsx) inserts share + notification. Admins do not appear in share target list.
- `/compartilhados` — processes shared *with* the current user (servidor role). Sidebar link visible only for `servidor`.
- `/comunicados` — renamed "Comunicado Institucional". chefe/admin publish; servidor sees only `target_user_ids IS NULL` or where their id is in the array. Each comunicado has a `type` (aviso/comunicado/informativo) and optional `target_user_ids uuid[]` (null = broadcast to all non-admin). [ComunicadoForm](src/app/comunicados/ComunicadoForm.tsx) is launched from a modal inside [ComunicadosClient](src/app/comunicados/ComunicadosClient.tsx) — no separate page for new.
- `/calendario` — monthly grid of `folgas` (type: 'folga' | 'ferias') + process deadlines. All roles see all folgas (visibility is not role-scoped — `use-folgas.ts` fetches all records). Process deadlines follow role scoping: `servidor` sees own + shared; `chefe`/`admin` see all. When a day has multiple deadlines, the current user's own deadlines sort first. Chefe/admin register absences via [AusenciaDrawer](src/app/calendario/AusenciaDrawer.tsx) (multi-day selection). [CalendarioClient](src/app/calendario/CalendarioClient.tsx) uses `useMemo` Maps for O(1) date lookups (`folgasByDate`, `deadlinesByDate`). Calendar cells have fixed height (`96px` desktop / `72px` tablet / `56px` mobile) with `overflow: hidden`; the `+N mais` overflow counter is `position: absolute` at the cell bottom so it is always visible. Includes a styled 4-column PDF export (`handlePrint`). Admin profiles are excluded from the server selector.
- `/kanban` — personal Kanban board with 4 fixed columns: A Fazer / Em Andamento / Em Revisão / Concluído. Cards belong to an owner and can be shared read-only with other users via `kanban_shares`. Cards are moved exclusively by drag-and-drop (HTML5 native, no DnD library); shared cards are not draggable. Card actions (edit, share, delete) live in a single `⋮` dropdown menu (`position: absolute`, no layout impact). Long descriptions show a 4-line preview with a "ver mais" button that opens a reading modal. `KanbanCardItem` uses a `scrollHeight > clientHeight` ref check to show "ver mais" only when text is actually truncated. All mutations follow the standard optimistic update cycle: `setQueryData` first, then DB call, then `invalidateQueries`; drag moves roll back on error. SSR on `/kanban/page.tsx` seeds `initialCards` via `initialData` so first render has no skeleton. RLS on `kanban_shares` must NOT reference `kanban_cards` in its SELECT policy — circular reference causes Supabase 500 errors; use `shared_by_user_id = auth.uid() OR shared_with_user_id = auth.uid()` directly.
- `/unidade` — unit dashboard (chefe/admin only, layout guard). Shows aggregate stats + per-servidor breakdown. [/unidade/processos](src/app/unidade/processos/page.tsx) shows all processes in the unit.
- `/admin` — admin-only layout guard. Stats dashboard + user management (`/admin/usuarios` with 20-per-page pagination). User creation via `POST /api/admin/users` (service role, with full payload validation + rate limit + audit log). Deletion via `DELETE /api/admin/users/[id]` (UUID validated + audit log).
- `/admin/tipos` — admin-only. View and manage all users' custom process and step types. Uses service role to bypass RLS. Mutations via `POST|PATCH|DELETE /api/admin/types` (validates table name against allowlist, UUID params, cascades renames into `processes.type` / `steps.step_type` for the affected user).
- `/configuracoes` — available to all roles. Each user manages their own custom types for processes and step types. Direct Supabase client calls (RLS enforces ownership). Renaming cascades automatically: process type rename updates `processes.type` for that owner; step type rename fetches the user's process IDs then updates matching `steps.step_type`.
- `/mudar-senha` — isolated first-access page, no shell chrome. After success uses `window.location.replace('/')` (hard redirect avoids stale JWT cookie race with proxy).
- Notifications — [NotificationBell](src/components/shell/NotificationBell.tsx) in topbar; live updates via Supabase Realtime (`postgres_changes` on `notifications` filtered by `user_id`). [DeadlineNotifier](src/app/DeadlineNotifier.tsx) runs on dashboard mount, inserts `deadline_soon` notifications (deduped per 24 h).

**Security primitives** (all in `src/lib/`):
- [password-policy.ts](src/lib/password-policy.ts) — `validatePassword(pw)`: min 8 chars, 1 uppercase, 1 digit. Use at every password entry point (login, mudar-senha, API).
- [rate-limit.ts](src/lib/rate-limit.ts) — `checkRateLimit(key, limit, windowMs)`: in-memory sliding window. Applied to `POST /api/admin/users` (10 req/h per IP).
- [audit.ts](src/lib/audit.ts) — `logAudit({actorId, action, ...})`: writes to `audit_logs` table via service role. Actions: `user_created`, `user_deleted`, `role_changed`, `password_changed`, `type_created`, `type_updated`, `type_deleted`. Never throws — failures are silently logged server-side.

**Styling.** Single global stylesheet [src/app/globals.css](src/app/globals.css) with CSS variables and utility classes (`.card`, `.btn`, `.pill`, `.tabs`, `.t` for tables, `.tl-*` for timelines). Theme via `data-theme="light|dark"` on `<html>`. No Tailwind, no CSS modules. Use existing classes + inline `style` for one-offs. Pill variants: `.pill.success` (green), `.pill.warning` (amber), `.pill.danger` (red), `.pill.info` (blue) — all have dark-mode overrides in globals.css. Timeline mark variants: `.tl-mark.done` (dark filled), `.tl-mark.accent` (accent border/color, neutral state), `.tl-mark.negative` (red filled, rejection state), `.tl-mark.clickable` (adds pointer cursor + hover scale). Calendar cell layout: `.cal-cell` has fixed height + `overflow: hidden`; overflow counters use `position: absolute` anchored to the cell bottom.

**Mutation pattern.** Client Components call `supabase.from(...)` directly. For data that lives in the TanStack Query cache, use `queryClient.invalidateQueries` (and optionally `setQueryData` for instant optimistic updates) after a successful mutation — do **not** call `router.refresh()` for that data. For data that is only server-rendered (no TanStack Query hook), `router.refresh()` is still appropriate, but check whether a hook should be introduced first. Supabase queries in `useEffect` must use `async function` + `await` — never `.then()` callbacks. **Gotcha:** never call `router.refresh()` immediately after `router.push('/other-route')` — the refresh re-runs the server component before navigation completes, finds null data, and calls `notFound()`, causing a 404 flash.

**Type system.** `Process.type` and `Step.step_type` are free-form strings. A `LEGACY_MAP` in [ProcessForm](src/app/processes/ProcessForm.tsx) translates old enum-key values (e.g. `portal_update` → `Atualização de Portal`) at render time. User-defined custom types are stored per-user in `user_process_types` and `user_step_types` Supabase tables (columns: `id`, `user_id`, `label`, `created_at`), with RLS restricting each user to their own rows. All three type-selection components — [ProcessForm](src/app/processes/ProcessForm.tsx), [AddStepForm](src/app/processes/[id]/AddStepForm.tsx), and [StepTimeline](src/app/processes/[id]/StepTimeline.tsx) — load custom types from Supabase with an explicit `.eq('user_id', user.id)` filter and enforce a limit of 15 custom types per user. `StepTimeline` lifts the types fetch to the parent so all `StepItem` children share one query. `Step` also carries `mark_state: 'neutral' | 'positive' | 'negative' | null` (DB column `steps.mark_state text DEFAULT 'neutral'`). The `tl-mark` in [StepTimeline](src/app/processes/[id]/StepTimeline.tsx) is clickable and cycles through the three states, updating the DB directly from the client — no `router.refresh()` needed.

## Conventions

- All user-facing strings are in Portuguese (pt-BR). Date formatting uses `toLocaleDateString('pt-BR', ...)`.
- Path alias: `@/*` → `src/*` ([tsconfig.json](tsconfig.json)).
- When SQL changes are needed, always provide the full SQL for the user to run in the Supabase SQL Editor — never assume it has been executed.
- When a new env var is needed, ask the user for the value and write it to `.env.local` directly — never leave placeholders.
- API Route Handlers must: (1) authenticate the caller, (2) verify role, (3) validate every field of the payload, (4) return generic error messages to the client (log specifics server-side with `console.error`), (5) call `logAudit` for any state-changing admin action.
- Never expose `err.message` from Supabase or internal exceptions directly to the browser response.
- `hydration`: `new Date()` called at render time causes server/client mismatch. For date formatting that depends on the user's locale/timezone (e.g. `toLocaleString('pt-BR')`), add `suppressHydrationWarning` to the containing element — this is the preferred fix over `useEffect` state for read-only display. For state that drives rendering logic, initialise inside `useEffect`.
- `CSP`: `next.config.ts` sets a Content-Security-Policy. `'unsafe-eval'` is included in `script-src` only in `NODE_ENV === 'development'` (React dev mode requires it). Never add `'unsafe-eval'` to the production CSP.
