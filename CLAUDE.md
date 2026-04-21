# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A static browser-based UI prototype for **SIGA** (Sistema Integrado de Gestão Administrativa), a fictional Brazilian municipal process management dashboard. No build system, no backend, no npm — everything runs via CDN-loaded React and Babel.

## Running the Project

Open [Painel SIGA.html](Painel%20SIGA.html) directly in a browser, or serve the directory with any static server:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/Painel%20SIGA.html
```

There are no build, lint, or test commands.

## Architecture

**Entry point**: `Painel SIGA.html` loads scripts in dependency order, then boots React via the inline `app.jsx` block at the bottom of the file.

**Load order matters** — scripts are interdependent globals, not modules:

| File | Role |
|------|------|
| [data.jsx](data.jsx) | All mock data exposed as `window.SIGA_*` globals |
| [icons.jsx](icons.jsx) | SVG icon components (16 px, minimal stroke) |
| [shell.jsx](shell.jsx) | `Sidebar`, `Topbar`, `TweaksPanel` |
| [dashboard.jsx](dashboard.jsx) | Dashboard screen + `Chart`/`Sparkline` components |
| [processes.jsx](processes.jsx) | Processes list screen |
| [detail.jsx](detail.jsx) | Process detail screen |
| `app.jsx` (inline in HTML) | Root `<App>` component, routing, settings persistence |

**Routing** is a single `route` string in React state (`"dashboard"`, `"processes"`, `"detail"`). Everything else (Cidadãos, Documentos, etc.) renders a placeholder.

**State**:
- UI state: local `React.useState` in each screen component
- User settings: `localStorage` with `siga_` prefix (theme, density, accent, sidebar collapse, last route)
- Data: `window.SIGA` object populated by `data.jsx`

## Theme and Styling

[styles.css](styles.css) uses CSS custom properties on `:root`. Theme switching is done by changing `data-theme="dark"` on `<html>` and by swapping CSS variable values.

- **Accent palettes**: `terracotta` (default), `government` (blue), `moss` (green), `ink` (black)
- **Density levels**: `compact`, `balanced`, `comfortable` — applied as a `data-density` attribute
- **TweaksPanel** is only shown when the page receives a `postMessage` with `"EDITMODE-BEGIN"` (external editor integration)

## Key Conventions

- All JSX uses Babel standalone transpilation in the browser — no TypeScript, no bundler.
- Components are plain functions using `React.useState` / `React.useEffect`; no context, no Redux.
- Icons are defined in [icons.jsx](icons.jsx) and referenced by name: `<Icon name="clock" />`.
- Mock data shape (processes, KPIs, activities) is defined in [data.jsx](data.jsx) — extend data there when adding new screens.
- [Painel SIGA-print.html](Painel%20SIGA-print.html) is a separate print-optimized variant; keep its structure in sync with the main file when making layout changes.
