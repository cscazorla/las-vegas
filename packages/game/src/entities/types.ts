import type * as THREE from 'three';

export interface Entity {
  readonly id: number;
  readonly type: string;
  readonly object3D: THREE.Object3D;
}

export interface Cabinet extends Entity {
  readonly type: 'cabinet';
}
