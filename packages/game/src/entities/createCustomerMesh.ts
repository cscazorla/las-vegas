import * as THREE from 'three';
import { AssetLoader } from '@/rendering/AssetLoader';

export const CUSTOMER_MODEL_PATH = 'models/character-gamer.glb';

export const CUSTOMER_TEXTURE_PATHS = [
  'models/Textures/colormap.png',
  'textures/variation-a.png',
  'textures/variation-b.png',
];

export function createCustomerMesh(loader: AssetLoader, texture?: THREE.Texture): THREE.Group {
  const group = loader.get(CUSTOMER_MODEL_PATH);
  group.name = 'customer';

  // Normalize scale: character should be ~0.6 units tall (shorter than 1-unit cabinets)
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const height = size.y;
  if (height > 0) {
    const scale = 0.6 / height;
    group.scale.setScalar(scale);
  }

  if (texture) {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat.map) {
          mat.map = texture;
        }
      }
    });
  }

  return group;
}
