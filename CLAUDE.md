# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Las Vegas** is a browser-based arcade management/tycoon game (similar to Two Point Campus / Arcade Empire Tycoon). The player manages a Video Arcade: purchases arcade cabinets, places them on a floor plan, hires staff, handles maintenance and customers.

- **Stack:** Node.js + TypeScript + Three.js (no game engine framework)
- **Rendering:** Initially Three.js primitives, later 3D models from kenney.nl/assets/mini-arcade

## Project Status

Monorepo scaffolded with game loop, Three.js rendering, and entity tracking working.

- Game design document: `task.md`
- Three.js reference skills: `.claude/skills/`

## Architecture

- npm workspaces monorepo (`packages/*`)
- Single package: `@las-vegas/game` (Vite + TypeScript + Three.js)
- Game loop via `requestAnimationFrame` with `THREE.Clock` and delta clamping
- **Grid system:** `Grid` class (`core/Grid.ts`) defines a cell-based coordinate system. Default floor is 10×10 units with 1-unit cells. Provides `cellToWorld()` / `worldToCell()` conversions and a `createHelper()` factory that returns a `THREE.GridHelper` for debug visualization.
- **Entity system:** `World` class owns the `Grid` and is a generic entity container. It exposes `addEntity()`, `removeEntity()`, and `getEntitiesByType<T>()` — no domain-specific logic. Each entity has a numeric auto-increment ID, a `type` discriminator, and an `object3D` — Three.js `Object3D` is the single source of truth for position/rotation. `World` accepts a `debug` flag; when true, it adds the grid overlay to the scene.
- **CabinetManager** (`entities/CabinetManager.ts`) is owned by `World` and exposed as `world.cabinets`. Provides cabinet-specific operations (`add`, `getAll`, `remove`). Future entity types (customers, staff) should follow the same manager pattern — each manager is created by `World` and accessed as a property (e.g. `world.customers`).
- Cabinet mesh creation lives in `entities/createCabinetMesh.ts` (factory returns a `THREE.Group`)
- Future: State machine for game states (menu, playing, paused)

## Domain Terminology

Project docs mix Spanish and English. Key terms:

| Spanish                   | English                        | Notes                             |
| ------------------------- | ------------------------------ | --------------------------------- |
| Salón                     | Video Arcade / Amusement Alley | The venue the player manages      |
| Máquinas arcades          | Arcade Cabinets ("Cabs")       | 2-player cabinet if multiplayer   |
| Floor Plan (Distribución) | Layout                         | Optimize for foot traffic         |
| Fuera de servicio         | Out of Order                   | Machine health drops below 30%    |
| Recaudación               | Coin Drop / Revenue            | Money accumulated inside machines |
| Mantenimiento             | Upkeep / Servicing             | Repairing CRTs or controls        |
| Monedero / Ranura         | Coin Slot                      | Where players insert money        |

## Build & Development Commands

All commands run from the repo root:

| Command                | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `npm install`          | Install all workspace dependencies                    |
| `npm run dev`          | Start Vite dev server with HMR (opens browser)        |
| `npm run build`        | Type-check + production build → `packages/game/dist/` |
| `npm run preview`      | Preview production build locally                      |
| `npm run lint`         | Run ESLint on all files                               |
| `npm run lint:fix`     | Run ESLint with auto-fix                              |
| `npm run format`       | Format all files with Prettier                        |
| `npm run format:check` | Check formatting without writing                      |

## Linting & Formatting

- **ESLint 9** with flat config (`eslint.config.js` at repo root, ESM)
- **typescript-eslint** `recommendedTypeChecked` — type-aware rules using `projectService: true`
- **eslint-config-prettier** disables formatting-related ESLint rules (must be last in config)
- **Prettier** for code formatting (`.prettierrc` at repo root)
- Underscore-prefixed unused vars are allowed (e.g. `_delta`)
- `.js`/`.mjs` config files have type-checked rules disabled

## Debug Mode

A project-wide `debug` flag is owned by `Game` and passed down to subsystems.

- Defaults to `true` in dev (`import.meta.env.DEV`) unless overridden
- Controlled via `VITE_DEBUG` env var in `packages/game/.env.local` (gitignored)
- `packages/game/.env.example` is the committed template
- When debug is on: `THREE.AxesHelper` visible at world origin, `THREE.GridHelper` overlay on the floor showing cell boundaries
- Production builds always have debug off

## Three.js Skills

Two Claude Code skills are available in `.claude/skills/`:

- **threejs-fundamentals** — Scene setup, cameras, renderer, Object3D hierarchy
- **threejs-game** — Game loops, controllers, physics, animation, performance
