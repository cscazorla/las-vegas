# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Las Vegas** is a browser-based arcade management/tycoon game (similar to Two Point Campus / Arcade Empire Tycoon). The player manages a Video Arcade: purchases arcade cabinets, places them on a floor plan, hires staff, handles maintenance and customers.

- **Stack:** Node.js + TypeScript + Three.js (no game engine framework)
- **Rendering:** Initially Three.js primitives, later 3D models from kenney.nl/assets/mini-arcade

## Project Status

Monorepo scaffolded with game loop and Three.js rendering working.

- Game design document: `task.md`
- Three.js reference skills: `.claude/skills/`

## Architecture

- npm workspaces monorepo (`packages/*`)
- Single package: `@las-vegas/game` (Vite + TypeScript + Three.js)
- Game loop via `requestAnimationFrame` with `THREE.Clock` and delta clamping
- Future: Entity system for cabinets, customers, staff
- Future: State machine for game states (menu, playing, paused)

## Domain Terminology

Project docs mix Spanish and English. Key terms:

| Spanish | English | Notes |
|---------|---------|-------|
| Salón | Video Arcade / Amusement Alley | The venue the player manages |
| Máquinas arcades | Arcade Cabinets ("Cabs") | 2-player cabinet if multiplayer |
| Floor Plan (Distribución) | Layout | Optimize for foot traffic |
| Fuera de servicio | Out of Order | Machine health drops below 30% |
| Recaudación | Coin Drop / Revenue | Money accumulated inside machines |
| Mantenimiento | Upkeep / Servicing | Repairing CRTs or controls |
| Monedero / Ranura | Coin Slot | Where players insert money |

## Build & Development Commands

All commands run from the repo root:

| Command | Description |
|---------|-------------|
| `npm install` | Install all workspace dependencies |
| `npm run dev` | Start Vite dev server with HMR (opens browser) |
| `npm run build` | Type-check + production build → `packages/game/dist/` |
| `npm run preview` | Preview production build locally |

## Debug Mode

A project-wide `debug` flag is owned by `Game` and passed down to subsystems.

- Defaults to `true` in dev (`import.meta.env.DEV`) unless overridden
- Controlled via `VITE_DEBUG` env var in `packages/game/.env.local` (gitignored)
- `packages/game/.env.example` is the committed template
- When debug is on: `THREE.AxesHelper` visible at world origin
- Production builds always have debug off

## Three.js Skills

Two Claude Code skills are available in `.claude/skills/`:

- **threejs-fundamentals** — Scene setup, cameras, renderer, Object3D hierarchy
- **threejs-game** — Game loops, controllers, physics, animation, performance
