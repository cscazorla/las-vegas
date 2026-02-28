import * as THREE from 'three';
import type { Cabinet, Entity, EntityManager, MenuContext } from '@/entities/types';
import type { ContextMenuItem } from '@/ui/ContextMenu';
import type { CabinetDefinition } from '@/data/cabinetCatalog';
import { CABINET_CATALOG } from '@/data/cabinetCatalog';
import { createCabinetMesh } from '@/entities/createCabinetMesh';
import { World } from '@/core/World';

export class CabinetManager implements EntityManager {
  readonly entityType = 'cabinet';

  constructor(private world: World) {}

  startPlacement(catalogId: string): void {
    const cabinet = this.add(catalogId, 0, 0);
    this.world.startPlacement(cabinet);
  }

  add(catalogId: string, col: number, row: number, rotation?: THREE.Euler): Cabinet {
    const definition = this.getDefinition(catalogId);
    const mesh = createCabinetMesh(definition.color);
    const worldPos = this.world.grid.cellToWorld(col, row);
    mesh.position.copy(worldPos);
    if (rotation) mesh.rotation.copy(rotation);

    const entity = this.world.addEntity(mesh, 'cabinet', { col, row });
    return { ...entity, type: 'cabinet', cell: { col, row }, catalogId } as Cabinet;
  }

  getAll(): Cabinet[] {
    return this.world.getEntitiesByType<Cabinet>('cabinet');
  }

  remove(id: number): boolean {
    return this.world.removeEntity(id);
  }

  getContextMenuItems(entity: Entity, context: MenuContext): ContextMenuItem[] {
    return [
      {
        label: 'Delete',
        action: () => this.remove(entity.id),
      },
      {
        label: 'Move',
        action: () => context.startMove(entity),
      },
    ];
  }

  private getDefinition(catalogId: string): CabinetDefinition {
    const def = CABINET_CATALOG.find((d) => d.id === catalogId);
    if (!def) {
      throw new Error(`Unknown cabinet catalog ID: "${catalogId}"`);
    }
    return def;
  }
}
