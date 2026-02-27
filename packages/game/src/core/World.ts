import * as THREE from 'three';
import type { Entity, Cabinet } from '@/entities/types';
import { createCabinetMesh } from '@/entities/createCabinetMesh';
import { Grid } from '@/core/Grid';

export class World {
  readonly grid: Grid;
  private entities = new Map<number, Entity>();
  private nextId = 1;

  constructor(private scene: THREE.Scene, private debug = false) {
    this.grid = new Grid({ width: 10, depth: 10, cellSize: 1 });

    if (this.debug) {
      this.scene.add(this.grid.createHelper());
    }
  }

  addCabinet(col: number, row: number, rotation?: THREE.Euler): Cabinet {
    const mesh = createCabinetMesh();
    const worldPos = this.grid.cellToWorld(col, row);
    mesh.position.copy(worldPos);
    if (rotation) mesh.rotation.copy(rotation);

    this.scene.add(mesh);

    const id = this.nextId++;
    const cabinet: Cabinet = { id, type: 'cabinet', object3D: mesh, cell: { col, row } };
    this.entities.set(id, cabinet);

    return cabinet;
  }

  getCabinets(): Cabinet[] {
    return [...this.entities.values()].filter(
      (e): e is Cabinet => e.type === 'cabinet',
    );
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
