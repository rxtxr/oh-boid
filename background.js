import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

export function setupBackground(scene) {
  const loader = new THREE.TextureLoader();
  loader.load('clouds.jpg', texture => {
    const backgroundMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1000, 32, 32),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
    );
    scene.add(backgroundMesh);
  });
}
