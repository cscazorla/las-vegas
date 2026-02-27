import * as THREE from 'three';
import type { Entity, Cabinet } from '@/entities/types';
import { createCabinetMesh } from '@/entities/createCabinetMesh';

export class World {
  private entities = new Map<number, Entity>();
  private nextId = 1;

  constructor(private scene: THREE.Scene) {}

  addCabinet(position?: THREE.Vector3, rotation?: THREE.Euler): Cabinet {
    const mesh = createCabinetMesh();

    if (position) mesh.position.copy(position);
    if (rotation) mesh.rotation.copy(rotation);

    this.scene.add(mesh);

    const id = this.nextId++;
    const cabinet: Cabinet = { id, type: 'cabinet', object3D: mesh };
    this.entities.set(id, cabinet);

    return cabinet;
  }

  getCabinets(): Cabinet[] {
    return [...this.entities.values()].filter(
      (e): e is Cabinet => e.type === 'cabinet',
    );
  }

  getEntity(id: number): Entity | undefined {
    return this.entities.get(id);
  }

  dispose(): void {
    for (const entity of this.entities.values()) {
      this.scene.remove(entity.object3D);
    }
    this.entities.clear();
  }
}
