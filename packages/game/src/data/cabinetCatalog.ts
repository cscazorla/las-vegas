export interface CabinetDefinition {
  readonly id: string;
  readonly game: string;
  readonly model: string; // path relative to public/, e.g. 'models/arcade-machine.glb'
  readonly cost: number;
}

export const CABINET_CATALOG: readonly CabinetDefinition[] = [
  {
    id: 'street-fighter-ii',
    game: 'Street Fighter II',
    model: 'models/arcade-machine.glb',
    cost: 500,
  },
  { id: 'pac-man', game: 'Pac-Man', model: 'models/pinball.glb', cost: 300 },
  { id: 'space-invaders', game: 'Space Invaders', model: 'models/dance-machine.glb', cost: 350 },
  { id: 'donkey-kong', game: 'Donkey Kong', model: 'models/gambling-machine.glb', cost: 400 },
];

export const CABINET_MODEL_PATHS: readonly string[] = [
  ...new Set(CABINET_CATALOG.map((d) => d.model)),
];
