import * as THREE from 'three';
import { AssetLoader } from '@/rendering/AssetLoader';

export function createCabinetMesh(loader: AssetLoader, modelPath: string): THREE.Group {
  const group = loader.get(modelPath);
  group.name = 'cabinet';

  // Fit model to ~1-unit grid cell: normalize based on bounding box
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.z);
  if (maxDim > 0) {
    const scale = 1 / maxDim;
    group.scale.setScalar(scale);
  }

  return group;
}
