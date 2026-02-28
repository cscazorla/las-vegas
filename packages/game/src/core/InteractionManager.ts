import * as THREE from 'three';
import { World } from '@/core/World';
import type { Entity } from '@/entities/types';
import { ContextMenu } from '@/ui/ContextMenu';
import { RotationToolbar } from '@/ui/RotationToolbar';

const CLICK_THRESHOLD = 5; // px — max distance between pointerdown/up to count as click

const HOVER_EMISSIVE = new THREE.Color(0xffffff);
const HOVER_INTENSITY = 0.15;
const SELECT_EMISSIVE = new THREE.Color(0x4488ff);
const SELECT_INTENSITY = 0.3;

export class InteractionManager {
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private hoveredEntity: Entity | null = null;
  private selectedEntity: Entity | null = null;
  private pointerDownPos: { x: number; y: number } | null = null;
  private contextMenu: ContextMenu;

  private floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private moveState: { entity: Entity; originalPos: THREE.Vector3 } | null = null;
  private placementState: { entity: Entity } | null = null;
  private rotationState: { entity: Entity; originalRotationY: number } | null = null;
  private rotationToolbar: RotationToolbar;

  constructor(
    private camera: THREE.Camera,
    private domElement: HTMLElement,
    private world: World,
  ) {
    this.contextMenu = new ContextMenu();
    this.rotationToolbar = new RotationToolbar({
      onRotateCCW: () => this.rotateActive(-Math.PI / 2),
      onRotateCW: () => this.rotateActive(Math.PI / 2),
      onConfirm: () => this.confirmRotation(),
      onCancel: () => this.cancelRotation(),
    });

    this.world.setPlacementHandler((entity) => {
      this.cancelActiveMode();
      this.enterPlacementMode(entity);
    });

    this.domElement.addEventListener('pointermove', this.onPointerMove);
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.domElement.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('keydown', this.onKeyDown);
    this.domElement.addEventListener('contextmenu', this.onContextMenu);
  }

  get selected(): Entity | null {
    return this.selectedEntity;
  }

  update(): void {
    if (this.rotationState) return;

    const activeEntity = this.moveState?.entity ?? this.placementState?.entity;
    if (activeEntity) {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.floorPlane, hit)) {
        const cell = this.world.grid.worldToCell(hit.x, hit.z);
        if (
          this.world.grid.contains(cell.col, cell.row) &&
          !this.world.isCellOccupied(cell.col, cell.row, activeEntity.id)
        ) {
          const snapped = this.world.grid.cellToWorld(cell.col, cell.row);
          activeEntity.object3D.position.copy(snapped);
        }
      }
      return;
    }

    this.raycaster.setFromCamera(this.pointer, this.camera);

    const objects = this.world.getEntityObjects();
    const intersects = this.raycaster.intersectObjects(objects, true);

    let hitEntity: Entity | null = null;

    if (intersects.length > 0) {
      // Walk up parent chain to find tagged entity root
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj) {
        if (obj.userData.entityId != null) {
          hitEntity = this.world.getEntity(obj.userData.entityId as number) ?? null;
          break;
        }
        obj = obj.parent;
      }
    }

    // Hover changed
    if (hitEntity !== this.hoveredEntity) {
      if (this.hoveredEntity) {
        // If the old hovered entity is also selected, restore selection highlight
        if (this.hoveredEntity === this.selectedEntity) {
          applyHighlight(this.hoveredEntity.object3D, 'select');
        } else {
          removeHighlight(this.hoveredEntity.object3D);
        }
      }

      if (hitEntity) {
        // Don't override selection highlight with hover
        if (hitEntity !== this.selectedEntity) {
          applyHighlight(hitEntity.object3D, 'hover');
        }
      }

      this.hoveredEntity = hitEntity;
    }

    // Track context menu to selected entity each frame
    if (this.selectedEntity && this.contextMenu.visible) {
      this.contextMenu.updatePosition(this.projectToScreen(this.selectedEntity.object3D.position));
    }
  }

  dispose(): void {
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('keydown', this.onKeyDown);
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);

    if (this.hoveredEntity) removeHighlight(this.hoveredEntity.object3D);
    if (this.selectedEntity) removeHighlight(this.selectedEntity.object3D);
    this.hoveredEntity = null;
    this.selectedEntity = null;
    this.moveState = null;
    this.placementState = null;
    this.rotationState = null;
    this.contextMenu.dispose();
    this.rotationToolbar.dispose();
  }

  private projectToScreen(position: THREE.Vector3): { x: number; y: number } {
    const projected = position.clone().project(this.camera);
    const rect = this.domElement.getBoundingClientRect();
    return {
      x: ((projected.x + 1) / 2) * rect.width + rect.left + 20,
      y: ((-projected.y + 1) / 2) * rect.height + rect.top - 20,
    };
  }

  // --- Event handlers ---

  private onPointerMove = (event: PointerEvent): void => {
    const rect = this.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };

  private onPointerDown = (event: PointerEvent): void => {
    this.pointerDownPos = { x: event.clientX, y: event.clientY };
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (!this.pointerDownPos) return;

    const dx = event.clientX - this.pointerDownPos.x;
    const dy = event.clientY - this.pointerDownPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.pointerDownPos = null;

    if (distance >= CLICK_THRESHOLD) return; // was a drag, not a click

    // Rotation mode: clicks handled via toolbar, not canvas
    if (this.rotationState) return;

    // Move/placement mode: click to finalize
    if (this.moveState || this.placementState) {
      const entity = (this.moveState?.entity ?? this.placementState?.entity)!;
      const pos = entity.object3D.position;
      const cell = this.world.grid.worldToCell(pos.x, pos.z);
      this.world.moveEntity(entity.id, cell.col, cell.row);
      this.moveState = null;
      this.placementState = null;
      return;
    }

    if (this.hoveredEntity) {
      // Clicking a new entity
      if (this.hoveredEntity !== this.selectedEntity) {
        // Deselect old
        if (this.selectedEntity) {
          removeHighlight(this.selectedEntity.object3D);
        }
        this.contextMenu.hide();

        // Select new
        this.selectedEntity = this.hoveredEntity;
        applyHighlight(this.selectedEntity.object3D, 'select');
        const menuContext = {
          startMove: (entity: Entity) => this.enterMoveMode(entity),
          startRotation: (entity: Entity) => this.enterRotationMode(entity),
        };
        const items = this.world.getMenuItems(this.selectedEntity, menuContext).map((item) => ({
          ...item,
          action: item.action
            ? () => {
                this.selectedEntity = null;
                this.hoveredEntity = null;
                item.action!();
              }
            : undefined,
        }));
        this.contextMenu.show(this.projectToScreen(this.selectedEntity.object3D.position), items);
      }
      // Clicking the already-selected entity does nothing
    } else {
      // Clicked empty space → deselect
      if (this.selectedEntity) {
        removeHighlight(this.selectedEntity.object3D);
        this.selectedEntity = null;
      }
      this.contextMenu.hide();
    }
  };

  enterPlacementMode(entity: Entity): void {
    this.cancelActiveMode();
    this.placementState = { entity };
    this.contextMenu.hide();
    removeHighlight(entity.object3D);
    this.selectedEntity = null;
    this.hoveredEntity = null;
  }

  private enterMoveMode(entity: Entity): void {
    this.moveState = {
      entity,
      originalPos: entity.object3D.position.clone(),
    };
    this.contextMenu.hide();
    removeHighlight(entity.object3D);
    this.selectedEntity = null;
    this.hoveredEntity = null;
  }

  private enterRotationMode(entity: Entity): void {
    this.cancelActiveMode();
    this.rotationState = {
      entity,
      originalRotationY: entity.object3D.rotation.y,
    };
    this.contextMenu.hide();
    removeHighlight(entity.object3D);
    this.selectedEntity = null;
    this.hoveredEntity = null;
    this.rotationToolbar.show();
  }

  private rotateActive(deltaY: number): void {
    if (!this.rotationState) return;
    this.rotationState.entity.object3D.rotation.y += deltaY;
  }

  private confirmRotation(): void {
    this.rotationState = null;
    this.rotationToolbar.hide();
  }

  private cancelRotation(): void {
    if (!this.rotationState) return;
    this.rotationState.entity.object3D.rotation.y = this.rotationState.originalRotationY;
    this.rotationState = null;
    this.rotationToolbar.hide();
  }

  cancelActiveMode(): void {
    if (this.rotationState) {
      this.rotationState.entity.object3D.rotation.y = this.rotationState.originalRotationY;
      this.rotationState = null;
      this.rotationToolbar.hide();
    }
    if (this.moveState) {
      this.moveState.entity.object3D.position.copy(this.moveState.originalPos);
      this.moveState = null;
    }
    if (this.placementState) {
      this.world.removeEntity(this.placementState.entity.id);
      this.placementState = null;
    }
  }

  private cancelMove(): void {
    if (this.rotationState) {
      this.cancelRotation();
      return;
    }
    if (this.moveState) {
      this.moveState.entity.object3D.position.copy(this.moveState.originalPos);
      this.moveState = null;
      return;
    }
    if (this.placementState) {
      this.world.removeEntity(this.placementState.entity.id);
      this.placementState = null;
    }
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.cancelMove();
  };

  private onContextMenu = (event: MouseEvent): void => {
    if (this.moveState || this.placementState || this.rotationState) {
      event.preventDefault();
      this.cancelMove();
    }
  };
}

// --- Highlight helpers ---

function applyHighlight(object3D: THREE.Object3D, type: 'hover' | 'select'): void {
  const emissive = type === 'select' ? SELECT_EMISSIVE : HOVER_EMISSIVE;
  const intensity = type === 'select' ? SELECT_INTENSITY : HOVER_INTENSITY;

  object3D.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const mat = child.material as THREE.MeshStandardMaterial;
    if (!mat.emissive) return;

    // Save originals only once
    if (child.userData.originalEmissive == null) {
      child.userData.originalEmissive = mat.emissive.getHex();
      child.userData.originalEmissiveIntensity = mat.emissiveIntensity;
    }

    mat.emissive.copy(emissive);
    mat.emissiveIntensity = intensity;
  });
}

function removeHighlight(object3D: THREE.Object3D): void {
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
