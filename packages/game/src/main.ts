import { Game } from '@/core/Game';

const debug = import.meta.env.VITE_DEBUG !== 'false' && import.meta.env.DEV;

const game = new Game({ debug });
await game.load();
game.start();
