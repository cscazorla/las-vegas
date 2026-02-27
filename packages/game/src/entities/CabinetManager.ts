import * as THREE from 'three';
import type { Cabinet } from '@/entities/types';
import { createCabinetMesh } from '@/entities/createCabinetMesh';
import { World } from '@/core/World';

export class CabinetManager {
  constructor(private world: World) {}

  add(col: number, row: number, rotation?: THREE.Euler): Cabinet {
    const mesh = createCabinetMesh();
    const worldPos = this.world.grid.cellToWorld(col, row);
    mesh.position.copy(worldPos);
    if (rotation) mesh.rotation.copy(rotation);

    const entity = this.world.addEntity(mesh, 'cabinet', { col, row });
    return entity as Cabinet;
  }

  getAll(): Cabinet[] {
    return this.world.getEntitiesByType<Cabinet>('cabinet');
  }

  remove(id: number): boolean {
    return this.world.removeEntity(id);
  }
}
