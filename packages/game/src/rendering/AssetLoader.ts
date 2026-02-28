import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class AssetLoader {
  private cache = new Map<string, THREE.Group>();
  private loader = new GLTFLoader();

  async preload(paths: string[]): Promise<void> {
    const results = await Promise.all(paths.map((path) => this.loader.loadAsync(path)));
    for (let i = 0; i < paths.length; i++) {
      this.cache.set(paths[i], results[i].scene);
    }
  }

  get(path: string): THREE.Group {
    const original = this.cache.get(path);
    if (!original) {
      throw new Error(`Model not preloaded: "${path}"`);
    }
    const clone = original.clone(true);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mesh = child as THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
        mesh.material = mesh.material.clone();
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }
}
