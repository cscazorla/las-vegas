import * as THREE from 'three';
import type { Entity, EntityManager, MenuContext, CellPosition } from '@/entities/types';
import type { ContextMenuItem } from '@/ui/ContextMenu';
import { Grid } from '@/core/Grid';
import { CabinetManager } from '@/entities/CabinetManager';

export class World {
  readonly grid: Grid;
  readonly cabinets: CabinetManager;
  private entities = new Map<number, Entity>();
  private managers = new Map<string, EntityManager>();
  private nextId = 1;

  constructor(
    private scene: THREE.Scene,
    private debug = false,
  ) {
    this.grid = new Grid({ width: 10, depth: 10, cellSize: 1 });
    this.cabinets = new CabinetManager(this);
    this.registerManager(this.cabinets);

    if (this.debug) {
      this.scene.add(this.grid.createHelper());
    }
  }

  addEntity(object3D: THREE.Object3D, type: string, cell?: CellPosition): Entity {
    this.scene.add(object3D);

    const id = this.nextId++;
    object3D.userData.entityId = id;
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

  getEntityObjects(): THREE.Object3D[] {
    return [...this.entities.values()].map((e) => e.object3D);
  }

  isCellOccupied(col: number, row: number, excludeId?: number): boolean {
    for (const entity of this.entities.values()) {
      if (entity.id === excludeId) continue;
      if (entity.cell && entity.cell.col === col && entity.cell.row === row) return true;
    }
    return false;
  }

  moveEntity(id: number, col: number, row: number): boolean {
    const entity = this.entities.get(id);
    if (!entity || !this.grid.contains(col, row)) return false;
    if (this.isCellOccupied(col, row, id)) return false;
    const worldPos = this.grid.cellToWorld(col, row);
    entity.object3D.position.copy(worldPos);
    this.entities.set(id, { ...entity, cell: { col, row } });
    return true;
  }

  getMenuItems(entity: Entity, context: MenuContext): ContextMenuItem[] {
    return this.managers.get(entity.type)?.getContextMenuItems(entity, context) ?? [];
  }

  private registerManager(manager: EntityManager): void {
    this.managers.set(manager.entityType, manager);
  }

  dispose(): void {
    for (const entity of this.entities.values()) {
      this.scene.remove(entity.object3D);
    }
    this.entities.clear();
  }
}
