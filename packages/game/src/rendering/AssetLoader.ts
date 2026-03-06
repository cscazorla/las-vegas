import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

export class AssetLoader {
  private cache = new Map<string, THREE.Group>();
  private animationsCache = new Map<string, THREE.AnimationClip[]>();
  private textureCache = new Map<string, THREE.Texture>();
  private loader = new GLTFLoader();
  private textureLoader = new THREE.TextureLoader();

  async preload(paths: string[]): Promise<void> {
    const results = await Promise.all(paths.map((path) => this.loader.loadAsync(path)));
    for (let i = 0; i < paths.length; i++) {
      this.cache.set(paths[i], results[i].scene);
      if (results[i].animations.length > 0) {
        this.animationsCache.set(paths[i], results[i].animations);
      }
    }
  }

  async preloadTextures(paths: string[]): Promise<void> {
    const results = await Promise.all(paths.map((p) => this.textureLoader.loadAsync(p)));
    for (let i = 0; i < paths.length; i++) {
      results[i].colorSpace = THREE.SRGBColorSpace;
      results[i].flipY = false;
      this.textureCache.set(paths[i], results[i]);
    }
  }

  getTexture(path: string): THREE.Texture {
    const texture = this.textureCache.get(path);
    if (!texture) {
      throw new Error(`Texture not preloaded: "${path}"`);
    }
    return texture;
  }

  /** Returns a shallow copy of cached animation clips (throws if not preloaded). */
  getAnimations(path: string): THREE.AnimationClip[] {
    const clips = this.animationsCache.get(path);
    if (!clips) {
      throw new Error(`No animations preloaded for: "${path}"`);
    }
    return [...clips];
  }

  get(path: string): THREE.Group {
    const original = this.cache.get(path);
    if (!original) {
      throw new Error(`Model not preloaded: "${path}"`);
    }
    const clone = cloneSkeleton(original) as THREE.Group;
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
