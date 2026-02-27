export interface CabinetDefinition {
  readonly id: string;
  readonly game: string;
  readonly color: number; // hex, e.g. 0xcc2233
  readonly cost: number;
}

export const CABINET_CATALOG: readonly CabinetDefinition[] = [
  { id: 'street-fighter-ii', game: 'Street Fighter II', color: 0x2244cc, cost: 500 },
  { id: 'pac-man', game: 'Pac-Man', color: 0xcccc00, cost: 300 },
  { id: 'space-invaders', game: 'Space Invaders', color: 0x22cc44, cost: 350 },
  { id: 'donkey-kong', game: 'Donkey Kong', color: 0xcc2233, cost: 400 },
];
