# Las Vegas

A browser-based arcade management/tycoon game built with TypeScript and Three.js.

Manage your own video arcade: purchase arcade cabinets, place them on a floor plan, hire staff, handle maintenance, and keep customers happy.

## Tech Stack

- TypeScript
- Three.js
- Vite
- ESLint 9 + Prettier
- npm workspaces monorepo

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (opens browser)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint and format
npm run lint
npm run format
```

## Environment Variables

Copy the example env file and adjust as needed:

```bash
cp packages/game/.env.example packages/game/.env.local
```

| Variable     | Default | Description                                                       |
| ------------ | ------- | ----------------------------------------------------------------- |
| `VITE_DEBUG` | `true`  | Enable debug mode (axes helper, etc.). Set to `false` to disable. |

`.env.local` is gitignored. You can also override inline: `VITE_DEBUG=false npm run dev`

## Project Structure

```
packages/
  game/          # Main game package (@las-vegas/game)
    src/
      core/      # Game loop, World (entity container), Grid, InteractionManager, GameClock, Wallet
      data/      # Static catalogs (cabinet definitions)
      entities/  # Entity types, mesh factories, and managers (e.g. CabinetManager)
      rendering/ # Scene, camera, renderer, lights, asset loading
      ui/        # HTML overlays — SideMenu, CabinetPanel, ContextMenu, TimeDisplay, MoneyDisplay
    public/
      models/    # 3D GLB models + Textures/colormap.png
      textures/  # Alternate color palettes (variation-a, variation-b)
```

## Game Time

The game has a time system with speed controls:

- **Time conversion:** 1 real second = 2 game minutes at 1x speed
- **Start time:** Day 1, 08:00
- **Speed controls:** 1x, 2x, 3x, and Pause (top-center HUD bar)
- Pausing freezes game time only — camera and interaction remain responsive

## Assets

3D models from [Mini Arcade](https://kenney.nl/assets/mini-arcade) by [Kenney](https://kenney.nl) (CC0 1.0).

## License

MIT
