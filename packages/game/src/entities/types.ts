import type * as THREE from 'three';
import type { ContextMenuItem } from '@/ui/ContextMenu';

export interface CellPosition {
  readonly col: number;
  readonly row: number;
}

export interface Entity {
  readonly id: number;
  readonly type: string;
  readonly object3D: THREE.Object3D;
  readonly cell?: CellPosition;
}

export interface Cabinet extends Entity {
  readonly type: 'cabinet';
  readonly cell: CellPosition;
  readonly catalogId: string;
}

export interface MenuContext {
  startMove: (entity: Entity) => void;
}

export interface EntityManager {
  readonly entityType: string;
  getContextMenuItems(entity: Entity, context: MenuContext): ContextMenuItem[];
}
