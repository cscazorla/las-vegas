# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Las Vegas** is a browser-based arcade management/tycoon game (similar to Two Point Campus / Arcade Empire Tycoon). The player manages a Video Arcade: purchases arcade cabinets, places them on a floor plan, hires staff, handles maintenance and customers.

- **Stack:** Node.js + TypeScript + Three.js (no game engine framework)
- **Rendering:** Three.js with 3D models from kenney.nl/assets/mini-arcade (CC0)

## Project Status

Monorepo scaffolded with game loop, Three.js rendering, and entity tracking working.

- Game design document: `task.md`
- Three.js reference skills: `.claude/skills/`

## Architecture

- npm workspaces monorepo (`packages/*`)
- Single package: `@las-vegas/game` (Vite + TypeScript + Three.js, build target `es2022` for top-level `await`)
- **`Game`** (`core/Game.ts`) is the top-level orchestrator. It wires subsystems together (scene, world, interaction, UI) but must not contain entity-specific logic or interaction logic. Domain operations like placement belong in the relevant `EntityManager`; interaction wiring belongs in `InteractionManager`. Has an async `load()` method that must be called before `start()` — it preloads assets and creates `World`, `InteractionManager`, and UI.
- Game loop via `requestAnimationFrame` with `THREE.Clock` and delta clamping. `THREE.Clock` provides real-time delta; `GameClock` converts it to game time. The update order is: `gameClock.update(delta)` → `timeDisplay.update(time)` → `customers.update(delta)` (walk system, scales by game speed internally) → `interaction.update()` (always real-time).
- **Grid system:** `Grid` class (`core/Grid.ts`) defines a cell-based coordinate system. Default floor is 10×10 units with 1-unit cells. Provides `cellToWorld()` / `worldToCell()` conversions and a `createHelper()` factory that returns a `THREE.GridHelper` for debug visualization.
- **Entity system:** `World` class owns the `Grid` and is a generic entity container. It exposes `addEntity()`, `removeEntity()`, and `getEntitiesByType<T>()` — no domain-specific logic. Each entity has a numeric auto-increment ID, a `type` discriminator, and an `object3D` — Three.js `Object3D` is the single source of truth for position/rotation. `World` accepts an `AssetLoader`, a `Wallet`, a `GameClock`, and a `debug` flag; when true, it adds the grid overlay to the scene. `World` passes `GameClock` to `CabinetManager` for time-based systems. `World` also holds a generic placement handler (`setPlacementHandler`/`startPlacement`) that any manager can call to enter placement mode without knowing about `InteractionManager`. `startPlacement(entity, onConfirm?)` accepts an optional callback that fires when placement is confirmed — this is how managers deduct costs without coupling to `InteractionManager`.
- **EntityManager** interface (`entities/types.ts`) defines the contract for entity-type managers: `entityType` string and `getContextMenuItems(entity, context)`. Each manager is registered with `World` and provides its own context menu items. `World.getMenuItems(entity, context)` delegates to the appropriate manager by entity type. `MenuContext` (also in `types.ts`) provides callbacks like `startMove()` so managers can trigger InteractionManager modes without a direct dependency.
- **CabinetManager** (`entities/CabinetManager.ts`) implements `EntityManager`, is owned by `World` and exposed as `world.cabinets`. Provides cabinet-specific operations (`add`, `getAll`, `remove`, `startPlacement`) and context menu items. `startPlacement(catalogId)` checks `wallet.canAfford()` before creating the entity, and passes an `onConfirm` callback to `world.startPlacement()` that deducts the cost when placement is confirmed. Cancel (Escape/right-click) removes the entity without charging. `add()` bypasses the wallet entirely (used for demo/free entities). **Condition system:** tracks a `conditions` map (entity ID → 0-100%) that degrades each game hour via `hourChanged` subscription (`CONDITION_LOSS_PER_HOUR = 0.83`, ~5 game-days from 100% → 0%). When condition drops to `OUT_OF_ORDER_THRESHOLD = 30`, a red emissive tint is applied. `repair(id)` deducts a proportional cost (`maintenanceCost × (100 - condition) / 100`, rounded) via wallet and restores condition to 100% — so `maintenanceCost` is the *maximum* repair cost (at 0% condition) and the actual cost scales with damage. Context menu includes a "Repair ($X)" item (disabled at 100% or insufficient funds). `dispose()` unsubscribes from `hourChanged` and clears the conditions map. Out-of-order visuals use `userData.outOfOrder` / `userData.outOfOrderEmissiveHex` / `userData.outOfOrderEmissiveIntensity` flags on the root `object3D` to coordinate with InteractionManager's highlight system. Also writes `userData.condition` (0-100) on the entity's `object3D` — updated in `add()`, `degradeAll()`, and `repair()` — so that InteractionManager's HealthBar can display it without coupling to cabinet-specific APIs. Future entity types (customers, staff) should follow the same manager pattern — each manager implements `EntityManager`, is created by `World` and accessed as a property (e.g. `world.customers`).
- **Cabinet catalog** (`data/cabinetCatalog.ts`) defines available arcade cabinet types as `CabinetDefinition` objects (id, game name, model path, cost, maintenanceCost). `maintenanceCost` is ~25% of purchase cost and represents the *maximum* repair cost (at 0% condition); actual repair cost scales proportionally with damage. `CabinetManager.add()` takes a `catalogId` string, looks up the definition, and passes the model path to the mesh factory. Each placed `Cabinet` entity carries its `catalogId`. Also exports `CABINET_MODEL_PATHS` for preloading.
- Cabinet mesh creation lives in `entities/createCabinetMesh.ts` (factory takes an `AssetLoader` and model path, clones the preloaded GLB model, and normalizes scale to fit the grid cell)
- **CustomerManager** (`entities/CustomerManager.ts`) implements `EntityManager`, is owned by `World` and exposed as `world.customers`. `spawn(col, row)` creates a customer at the given grid cell with a random texture variation (from `CUSTOMER_TEXTURE_PATHS`), registers it with the walk system, and emits `countChanged`. `remove(id)` unregisters from the walk system and removes the entity. `update(delta)` is called each frame from `Game` and delegates to `CustomerWalkSystem`. Pub/sub with `on('countChanged')` / `off()` for the HUD counter. `dispose()` cleans up the walk system and listeners.
- **CustomerWalkSystem** (`entities/CustomerWalkSystem.ts`) drives autonomous customer movement. Each registered customer has a `WalkData` tracking animation mixer, idle/walk actions, current grid cell, and movement progress. `update(delta)` scales by `GameSpeed` (paused = no movement), ticks animation mixers, and per-customer: if idle, counts down a random timer (1-3s) then picks a random free neighbor; if walking, lerps position from cell to cell at `WALK_SPEED = 1.2` cells/real-second, rotating to face direction. On arrival, 20% chance to idle again, otherwise continues to next neighbor. Obstacle avoidance via `world.isCellOccupied()` and `grid.contains()` — if no free neighbor, stays idle. Idle↔walk transitions use `crossFadeTo()` with 0.2s blend. Neighbor selection uses Fisher-Yates shuffle for random direction.
- Customer mesh creation lives in `entities/createCustomerMesh.ts` (factory takes an `AssetLoader` and optional texture, clones the `character-gamer.glb` model, normalizes scale to 0.6 units tall, and swaps the texture map if provided). Exports `CUSTOMER_MODEL_PATH` for preloading and `CUSTOMER_TEXTURE_PATHS` (3 palette variants) for random variation.
- **AssetLoader** (`rendering/AssetLoader.ts`) loads and caches GLB models using `GLTFLoader`. `preload(paths)` loads all models in parallel via `Promise.all`. `get(path)` returns a deep clone with cloned materials (for per-instance changes) and shadow flags enabled. Single instance created by `Game`, passed to `World` → managers. Static assets live in `packages/game/public/models/` (GLBs + `Textures/colormap.png` shared texture atlas) and `packages/game/public/textures/` (alternate color palettes). GLBs reference the colormap as an external file at `Textures/colormap.png` relative to their location — it is not embedded.
- **InteractionManager** (`core/InteractionManager.ts`) handles mouse-based entity picking via `THREE.Raycaster`. Hover highlights entities with a subtle emissive glow; clicking selects them with a stronger blue highlight. Uses `userData.entityId` tags (set by `World.addEntity()`) to map raycaster hits back to entities. Distinguishes clicks from orbit-control drags via pointer distance threshold. Supports two grid-snapping modes — **move mode** (triggered via context menu `MenuContext.startMove()`, cancel restores original position) and **placement mode** (triggered via `enterPlacementMode()`, cancel deletes the entity). Both share the same floor-plane raycasting logic. Placement mode stores an optional `onConfirm` callback that fires when the user clicks to finalize — this is how costs are deducted on placement. `cancelActiveMode()` is the public method to abort either mode from outside. Registers itself as the placement handler on `World` during construction — entity managers call `world.startPlacement()` and InteractionManager handles it automatically. `removeHighlight()` respects `userData.outOfOrder` — when true, it restores to the out-of-order red emissive tint (read from `userData.outOfOrderEmissiveHex`/`Intensity`) instead of the true original, preserving the visual indicator. Context menu action wrappers call `removeHighlight()` before executing the action to properly clear the selection highlight. Owns a `HealthBar` instance — shown on selection if `userData.condition` is present, hidden on deselection, and position-tracked each frame alongside the context menu (offset 40px above).
- **ContextMenu** (`ui/ContextMenu.ts`) is a generic HTML overlay that accepts `ContextMenuItem[]` at `show()` time. Positioned via CSS `fixed` and screen-projected from 3D positions. Has no knowledge of entities or domain logic — callers provide items and position. Owned by `InteractionManager`.
- **HealthBar** (`ui/HealthBar.ts`) is an HTML overlay showing entity condition (0-100%) as a colored progress bar. Positioned via CSS `fixed` with `projectToScreen()` offset 40px above the entity. Color shifts green (>60%) → yellow (30-60%) → red (≤30%). Reads generic `userData.condition` — no coupling to specific entity types. Owned by `InteractionManager`, shown on selection and hidden on deselection. Uses shared `theme.ts` tokens.
- **SideMenu** (`ui/SideMenu.ts`) is a data-driven left-side toolbar (48px wide, fixed position). Constructor takes a `SideMenuButton[]` array — each entry defines `label`, `tooltip`, and a `panel` (`SidePanel`). `SideMenu` owns panel toggle logic and mutual exclusion (only one panel open at a time) and disposes all panels on cleanup. Adding a new button+panel requires no changes to `SideMenu` itself. Uses shared `theme.ts` tokens.
- **CabinetPanel** (`ui/CabinetPanel.ts`) is a slide-out panel (220px) listing all cabinets from `CABINET_CATALOG`. Clicking a card fires `onSelect(catalogId)` and auto-hides. Implements the `SidePanel` interface (`show`/`hide`/`visible`/`dispose`). Future catalog panels for other entity types should follow the same `SidePanel` pattern.
- **GameClock** (`core/GameClock.ts`) is the game-time subsystem. Tracks an accumulator (`_totalMinutes`, starts at 480 = 08:00 Day 1). `update(realDelta)` advances time at 2 game-minutes per real second × speed multiplier. `GameSpeed` enum: `Paused = 0`, `Normal = 1`, `Fast = 2`, `Fastest = 3`. Exposes a `time` getter returning `GameTime` (`totalMinutes`, `minute`, `hour`, `day`). Minimal pub/sub with `on()`/`off()` for three events: `hourChanged`, `dayChanged`, `speedChanged`. Pause stops game-time progression but does not freeze rendering — camera orbit, selection, and placement all work normally. Future systems (revenue, customers, maintenance) should subscribe to `hourChanged`/`dayChanged` rather than checking delta each frame. **Integration pattern:** `Game.load()` passes the `GameClock` instance to each new subsystem's constructor; the subsystem calls `gameClock.on('hourChanged', this.handler)` in its constructor and `gameClock.off('hourChanged', this.handler)` in `dispose()`. This keeps subsystems decoupled from the render loop and from each other — they react to game-time boundaries, not frame deltas.
- **Wallet** (`core/Wallet.ts`) is the money/balance subsystem. Tracks a numeric balance (default `INITIAL_BALANCE = 5000`). Exposes `balance` getter, `canAfford(amount)`, and `deduct(amount): boolean` (returns false if insufficient funds). Minimal pub/sub with `on('balanceChanged')` / `off()` / `dispose()` — mirrors the `GameClock` pattern. Generic service: any subsystem (cabinets, staff, decorations, salaries) can depend on `Wallet` to check and deduct funds. `Game.load()` creates `Wallet` before `World` and passes it down.
- **CustomerCountDisplay** (`ui/CustomerCountDisplay.ts`) is a top-right HUD element (positioned left of MoneyDisplay) showing customer count with a person icon. Event-driven: subscribes to `customers.on('countChanged')`. DOM-efficient with text caching. Uses shared `theme.ts` tokens.
- **MoneyDisplay** (`ui/MoneyDisplay.ts`) is the top-right HUD element showing the player's balance as `$5,000`. Event-driven: subscribes to `wallet.on('balanceChanged')` — no frame update needed. DOM-efficient with text caching like `TimeDisplay`. Formats using `toLocaleString()`. Uses shared `theme.ts` tokens.
- **TimeDisplay** (`ui/TimeDisplay.ts`) is the top-center HUD bar showing `Day N | HH:MM | 1x 2x 3x ⏸`. Speed buttons highlight the active speed. DOM-efficient: caches last-written strings and only updates when text changes. Takes a `GameClock` reference and an `onSpeedChange` callback. Uses shared `theme.ts` tokens.
- **UI Theme** (`ui/theme.ts`) centralizes all UI color tokens (`bg`, `border`, `shadow`, `text`, `textSecondary`, `hover`, `hoverLight`) in a single `theme` object. All UI components import from `theme.ts` instead of hardcoding hex values. New UI components should use `theme.*` tokens for consistency.
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
