import * as THREE from 'three';
import type { Cabinet, Entity, EntityManager, MenuContext } from '@/entities/types';
import type { ContextMenuItem } from '@/ui/ContextMenu';
import type { CabinetDefinition } from '@/data/cabinetCatalog';
import { CABINET_CATALOG } from '@/data/cabinetCatalog';
import { createCabinetMesh } from '@/entities/createCabinetMesh';
import { World } from '@/core/World';
import { AssetLoader } from '@/rendering/AssetLoader';
import { Wallet } from '@/core/Wallet';

export class CabinetManager implements EntityManager {
  readonly entityType = 'cabinet';

  constructor(
    private world: World,
    private loader: AssetLoader,
    private wallet: Wallet,
  ) {}

  startPlacement(catalogId: string): void {
    const definition = this.getDefinition(catalogId);
    if (!this.wallet.canAfford(definition.cost)) return;
    const cabinet = this.add(catalogId, 0, 0);
    this.world.startPlacement(cabinet, () => this.wallet.deduct(definition.cost));
  }

  add(catalogId: string, col: number, row: number, rotation?: THREE.Euler): Cabinet {
    const definition = this.getDefinition(catalogId);
    const mesh = createCabinetMesh(this.loader, definition.model);
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
      {
        label: 'Rotate',
        action: () => context.startRotation(entity),
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
