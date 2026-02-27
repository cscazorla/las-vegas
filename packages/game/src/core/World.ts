import * as THREE from 'three';
import type { Entity, CellPosition } from '@/entities/types';
import { Grid } from '@/core/Grid';
import { CabinetManager } from '@/entities/CabinetManager';

export class World {
  readonly grid: Grid;
  readonly cabinets: CabinetManager;
  private entities = new Map<number, Entity>();
  private nextId = 1;

  constructor(
    private scene: THREE.Scene,
    private debug = false,
  ) {
    this.grid = new Grid({ width: 10, depth: 10, cellSize: 1 });
    this.cabinets = new CabinetManager(this);

    if (this.debug) {
      this.scene.add(this.grid.createHelper());
    }
  }

  addEntity(object3D: THREE.Object3D, type: string, cell?: CellPosition): Entity {
    this.scene.add(object3D);

    const id = this.nextId++;
    const entity: Entity = { id, type, object3D, cell };
    this.entities.set(id, entity);

    return entity;
  }

  removeEntity(id: number): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;

    this.scene.remove(entity.object3D);
    this.entities.delete(id);
    return true;
  }

  getEntitiesByType<T extends Entity>(type: string): T[] {
    return [...this.entities.values()].filter((e): e is T => e.type === type);
  }

  getEntity(id: number): Entity | undefined {
    return this.entities.get(id);
  }

  dispose(): void {
    for (const entity of this.entities.values()) {
      this.scene.remove(entity.object3D);
    }
    this.entities.clear();
  }
}
