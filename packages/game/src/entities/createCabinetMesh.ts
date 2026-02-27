import * as THREE from 'three';

export function createCabinetMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'cabinet';

  // Cabinet body
  const cabinetGeo = new THREE.BoxGeometry(0.8, 1.8, 0.6);
  const cabinetMat = new THREE.MeshStandardMaterial({ color: 0xcc2233 });
  const body = new THREE.Mesh(cabinetGeo, cabinetMat);
  body.position.y = 0.9; // half height, sits on floor
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Screen (child of body)
  const screenGeo = new THREE.BoxGeometry(0.6, 0.5, 0.05);
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x00ff66,
    emissive: 0x00ff66,
    emissiveIntensity: 0.6,
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0.35, 0.325); // upper-front of cabinet
  body.add(screen);

  return group;
}
