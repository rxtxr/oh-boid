import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

let renderer, scene, camera;

export function initScene() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 150;

  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, boids: [] };
}

export function animate(renderer, scene, camera, boids) {
  function frame() {
    requestAnimationFrame(frame);
    boids.forEach(boid => {
      if (typeof boid.flock === 'function') boid.flock(boids);
      if (typeof boid.update === 'function') boid.update();
    });
    renderer.render(scene, camera);
  }
  frame();
}
