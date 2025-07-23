import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

export function createAttractor(scene) {
  const geometry = new THREE.SphereGeometry(5, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const attractor = new THREE.Mesh(geometry, material);
  scene.add(attractor);

  // Optional: add pulsing animation
  let scaleDirection = 1;
  setInterval(() => {
    attractor.scale.x += 0.01 * scaleDirection;
    attractor.scale.y += 0.01 * scaleDirection;
    attractor.scale.z += 0.01 * scaleDirection;
    if (attractor.scale.x > 1.2 || attractor.scale.x < 0.8) {
      scaleDirection *= -1;
    }
  }, 30);
  return attractor;
}
