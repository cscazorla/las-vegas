import * as THREE from 'three';
import type { Customer } from '@/entities/types';
import { World } from '@/core/World';
import { CustomerManager } from '@/entities/CustomerManager';
import { AssetLoader } from '@/rendering/AssetLoader';
import { GameClock, GameSpeed } from '@/core/GameClock';
import { CUSTOMER_MODEL_PATH } from '@/entities/createCustomerMesh';

const WALK_SPEED = 1.2; // cells per real-second at Normal speed
const IDLE_CHANCE = 0.2;
const IDLE_MIN = 1.0; // real-seconds
const IDLE_MAX = 3.0;
const CROSSFADE_DURATION = 0.2;

interface WalkData {
  mixer: THREE.AnimationMixer;
  idleAction: THREE.AnimationAction;
  walkAction: THREE.AnimationAction;
  state: 'idle' | 'walking';
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  progress: number;
  idleTimer: number;
  currentCol: number;
  currentRow: number;
}

export class CustomerWalkSystem {
  private data = new Map<number, WalkData>();

  constructor(
    private world: World,
    private customers: CustomerManager,
    private loader: AssetLoader,
    private gameClock: GameClock,
  ) {}

  register(customer: Customer, col: number, row: number): void {
    const object3D = customer.object3D;
    const mixer = new THREE.AnimationMixer(object3D);
    const clips = this.loader.getAnimations(CUSTOMER_MODEL_PATH);

    const idleClip = clips.find((c) => c.name === 'idle');
    const walkClip = clips.find((c) => c.name === 'walk');
    if (!idleClip || !walkClip) return;

    const idleAction = mixer.clipAction(idleClip);
    const walkAction = mixer.clipAction(walkClip);

    idleAction.play();

    this.data.set(customer.id, {
      mixer,
      idleAction,
      walkAction,
      state: 'idle',
      fromPos: object3D.position.clone(),
      toPos: object3D.position.clone(),
      progress: 0,
      idleTimer: IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN),
      currentCol: col,
      currentRow: row,
    });
  }

  unregister(id: number): void {
    const d = this.data.get(id);
    if (!d) return;
    d.mixer.stopAllAction();
    this.data.delete(id);
  }

  update(delta: number): void {
    const speed = this.gameClock.speed;
    if (speed === GameSpeed.Paused) return;

    const scaledDelta = delta * speed;

    for (const [id, d] of this.data) {
      d.mixer.update(scaledDelta);

      const customer = this.world.getEntity(id);
      if (!customer) continue;

      if (d.state === 'idle') {
        d.idleTimer -= scaledDelta;
        if (d.idleTimer <= 0) {
          this.tryStartWalking(d, customer.object3D);
        }
      } else {
        d.progress += WALK_SPEED * scaledDelta;
        if (d.progress >= 1) {
          d.progress = 1;
          customer.object3D.position.copy(d.toPos);
          d.currentCol = Math.round(
            (d.toPos.x - this.world.grid.cellSize / 2) / this.world.grid.cellSize,
          );
          d.currentRow = Math.round(
            (d.toPos.z - this.world.grid.cellSize / 2) / this.world.grid.cellSize,
          );

          if (Math.random() < IDLE_CHANCE) {
            this.enterIdle(d);
          } else {
            const neighbor = this.pickNeighbor(d.currentCol, d.currentRow);
            if (neighbor) {
              this.startWalkTo(d, customer.object3D, neighbor.col, neighbor.row);
            } else {
              this.enterIdle(d);
            }
          }
        } else {
          customer.object3D.position.lerpVectors(d.fromPos, d.toPos, d.progress);
        }
      }
    }
  }

  dispose(): void {
    for (const d of this.data.values()) {
      d.mixer.stopAllAction();
    }
    this.data.clear();
  }

  private tryStartWalking(d: WalkData, object3D: THREE.Object3D): void {
    const neighbor = this.pickNeighbor(d.currentCol, d.currentRow);
    if (neighbor) {
      this.startWalkTo(d, object3D, neighbor.col, neighbor.row);
    } else {
      d.idleTimer = IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN);
    }
  }

  private startWalkTo(
    d: WalkData,
    object3D: THREE.Object3D,
    col: number,
    row: number,
  ): void {
    d.fromPos.copy(object3D.position);
    d.toPos.copy(this.world.grid.cellToWorld(col, row));
    d.progress = 0;

    const dx = d.toPos.x - d.fromPos.x;
    const dz = d.toPos.z - d.fromPos.z;
    object3D.rotation.y = Math.atan2(dx, dz);

    if (d.state !== 'walking') {
      d.state = 'walking';
      d.walkAction.reset();
      d.walkAction.play();
      d.idleAction.crossFadeTo(d.walkAction, CROSSFADE_DURATION, true);
    }
  }

  private enterIdle(d: WalkData): void {
    d.state = 'idle';
    d.idleTimer = IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN);
    d.idleAction.reset();
    d.idleAction.play();
    d.walkAction.crossFadeTo(d.idleAction, CROSSFADE_DURATION, true);
  }

  private pickNeighbor(
    col: number,
    row: number,
  ): { col: number; row: number } | null {
    const dirs = [
      { col: col + 1, row },
      { col: col - 1, row },
      { col, row: row + 1 },
      { col, row: row - 1 },
    ];

    // Fisher-Yates shuffle
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }

    for (const d of dirs) {
      if (this.world.grid.contains(d.col, d.row) && !this.world.isCellOccupied(d.col, d.row)) {
        return d;
      }
    }
    return null;
  }
}
