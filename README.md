# Las Vegas

A browser-based arcade management/tycoon game built with TypeScript and Three.js.

Manage your own video arcade: purchase arcade cabinets, place them on a floor plan, hire staff, handle maintenance, and keep customers happy.

## Tech Stack

- TypeScript
- Three.js
- Vite
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
```

## Environment Variables

Copy the example env file and adjust as needed:

```bash
cp packages/game/.env.example packages/game/.env.local
```

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_DEBUG` | `true` | Enable debug mode (axes helper, etc.). Set to `false` to disable. |

`.env.local` is gitignored. You can also override inline: `VITE_DEBUG=false npm run dev`

## Project Structure

```
packages/
  game/          # Main game package (@las-vegas/game)
    src/
      core/      # Game loop, lifecycle, World (entity container), Grid (cell coordinate system)
      entities/  # Entity types and mesh factories
      rendering/ # Scene, camera, renderer, lights
```

## License

MIT
