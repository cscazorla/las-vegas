import * as THREE from 'three';
import type { Cabinet, Entity, EntityManager } from '@/entities/types';
import type { ContextMenuItem } from '@/ui/ContextMenu';
import { createCabinetMesh } from '@/entities/createCabinetMesh';
import { World } from '@/core/World';

export class CabinetManager implements EntityManager {
  readonly entityType = 'cabinet';

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

  getContextMenuItems(entity: Entity): ContextMenuItem[] {
    return [
      {
        label: 'Delete',
        action: () => this.remove(entity.id),
      },
      { label: 'Move', disabled: true },
    ];
  }
}
