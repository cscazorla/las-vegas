import * as THREE from 'three';
import type { Cabinet, Entity, EntityManager, MenuContext } from '@/entities/types';
import type { ContextMenuItem } from '@/ui/ContextMenu';
import type { CabinetDefinition } from '@/data/cabinetCatalog';
import { CABINET_CATALOG } from '@/data/cabinetCatalog';
import { createCabinetMesh } from '@/entities/createCabinetMesh';
import { World } from '@/core/World';
import { AssetLoader } from '@/rendering/AssetLoader';
import { Wallet } from '@/core/Wallet';
import { GameClock } from '@/core/GameClock';

const CONDITION_LOSS_PER_HOUR = 0.83; // ~5 game-days from 100% → 0%
const OUT_OF_ORDER_THRESHOLD = 30;
const OUT_OF_ORDER_EMISSIVE = new THREE.Color(0xff2222);
const OUT_OF_ORDER_INTENSITY = 0.35;

export class CabinetManager implements EntityManager {
  readonly entityType = 'cabinet';
  private catalogIds = new Map<number, string>();
  private conditions = new Map<number, number>();
  private onHourChanged = () => this.degradeAll();

  constructor(
    private world: World,
    private loader: AssetLoader,
    private wallet: Wallet,
    private gameClock: GameClock,
  ) {
    this.gameClock.on('hourChanged', this.onHourChanged);
  }

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
    this.catalogIds.set(entity.id, catalogId);
    this.conditions.set(entity.id, 100);
    entity.object3D.userData.condition = 100;
    return { ...entity, type: 'cabinet', cell: { col, row }, catalogId } as Cabinet;
  }

  getAll(): Cabinet[] {
    return this.world.getEntitiesByType<Cabinet>('cabinet');
  }

  remove(id: number): boolean {
    this.catalogIds.delete(id);
    this.conditions.delete(id);
    return this.world.removeEntity(id);
  }

  getCondition(id: number): number {
    return this.conditions.get(id) ?? 0;
  }

  isOutOfOrder(id: number): boolean {
    return this.getCondition(id) <= OUT_OF_ORDER_THRESHOLD;
  }

  repair(id: number): boolean {
    const entity = this.world.getEntity(id);
    if (!entity) return false;

    const repairCost = this.getRepairCost(id);
    if (repairCost <= 0 || !this.wallet.deduct(repairCost)) return false;

    this.conditions.set(id, 100);
    entity.object3D.userData.condition = 100;
    this.removeOutOfOrderVisual(entity.object3D);
    return true;
  }

  getContextMenuItems(entity: Entity, context: MenuContext): ContextMenuItem[] {
    const repairCost = this.getRepairCost(entity.id);
    const canRepair = repairCost > 0 && this.wallet.canAfford(repairCost);

    return [
      {
        label: `Repair ($${repairCost})`,
        action: canRepair ? () => this.repair(entity.id) : undefined,
      },
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

  dispose(): void {
    this.gameClock.off('hourChanged', this.onHourChanged);
    this.catalogIds.clear();
    this.conditions.clear();
  }

  private degradeAll(): void {
    for (const cabinet of this.getAll()) {
      const current = this.getCondition(cabinet.id);
      if (current <= 0) continue;

      const wasAboveThreshold = current > OUT_OF_ORDER_THRESHOLD;
      const next = Math.max(0, current - CONDITION_LOSS_PER_HOUR);
      this.conditions.set(cabinet.id, next);
      cabinet.object3D.userData.condition = next;

      if (wasAboveThreshold && next <= OUT_OF_ORDER_THRESHOLD) {
        this.applyOutOfOrderVisual(cabinet.object3D);
      }
    }
  }

  private applyOutOfOrderVisual(object3D: THREE.Object3D): void {
    object3D.userData.outOfOrder = true;
    object3D.userData.outOfOrderEmissiveHex = OUT_OF_ORDER_EMISSIVE.getHex();
    object3D.userData.outOfOrderEmissiveIntensity = OUT_OF_ORDER_INTENSITY;

    object3D.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mat = child.material as THREE.MeshStandardMaterial;
      if (!mat.emissive) return;

      // Save true originals if not yet saved
      if (child.userData.originalEmissive == null) {
        child.userData.originalEmissive = mat.emissive.getHex();
        child.userData.originalEmissiveIntensity = mat.emissiveIntensity;
      }

      mat.emissive.copy(OUT_OF_ORDER_EMISSIVE);
      mat.emissiveIntensity = OUT_OF_ORDER_INTENSITY;
    });
  }

  private removeOutOfOrderVisual(object3D: THREE.Object3D): void {
    object3D.userData.outOfOrder = false;
    delete object3D.userData.outOfOrderEmissiveHex;
    delete object3D.userData.outOfOrderEmissiveIntensity;

    object3D.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mat = child.material as THREE.MeshStandardMaterial;
      if (!mat.emissive) return;

      if (child.userData.originalEmissive != null) {
        mat.emissive.setHex(child.userData.originalEmissive as number);
        mat.emissiveIntensity = child.userData.originalEmissiveIntensity as number;
        delete child.userData.originalEmissive;
        delete child.userData.originalEmissiveIntensity;
      }
    });
  }

  private getRepairCost(id: number): number {
    const catalogId = this.catalogIds.get(id);
    if (!catalogId) return 0;
    const definition = this.getDefinition(catalogId);
    const condition = this.getCondition(id);
    return Math.round((definition.maintenanceCost * (100 - condition)) / 100);
  }

  private getDefinition(catalogId: string): CabinetDefinition {
    const def = CABINET_CATALOG.find((d) => d.id === catalogId);
    if (!def) {
      throw new Error(`Unknown cabinet catalog ID: "${catalogId}"`);
    }
    return def;
  }
}
