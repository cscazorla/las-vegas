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

## Project Structure

```
packages/
  game/          # Main game package (@las-vegas/game)
    src/
      core/      # Game loop, lifecycle
      rendering/ # Scene, camera, renderer, lights
```

## License

MIT
