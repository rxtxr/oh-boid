import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

export function createBoids(boids, scene) {
  const geometry = new THREE.SphereGeometry(1.5, 6, 6);
  const material = new THREE.MeshBasicMaterial({ color: 0xdddddd });
  const range = 300;

  class Boid {
    constructor() {
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(
        (Math.random() - 0.5) * range,
        (Math.random() - 0.5) * range,
        (Math.random() - 0.5) * range
      );
      scene.add(this.mesh);

      this.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
      this.acceleration = new THREE.Vector3();
      this.maxSpeed = 2;
      this.maxForce = 0.05;
    }

    update() {
      this.velocity.add(this.acceleration);
      this.velocity.clampLength(0, this.maxSpeed);
      this.mesh.position.add(this.velocity);
      this.acceleration.set(0, 0, 0);

      const half = range / 2;
      ['x', 'y', 'z'].forEach(dim => {
        if (this.mesh.position[dim] > half) this.mesh.position[dim] = -half;
        else if (this.mesh.position[dim] < -half) this.mesh.position[dim] = half;
      });
    }

    applyForce(force) {
      this.acceleration.add(force);
    }

    flock(boids) {
      let alignment = new THREE.Vector3();
      let cohesion = new THREE.Vector3();
      let separation = new THREE.Vector3();
      let count = 0;

      for (let other of boids) {
        if (other === this) continue;
        const dist = this.mesh.position.distanceTo(other.mesh.position);
        if (dist < 40) {
          alignment.add(other.velocity);
          cohesion.add(other.mesh.position);
          const diff = new THREE.Vector3().subVectors(this.mesh.position, other.mesh.position).divideScalar(dist);
          separation.add(diff);
          count++;
        }
      }

      if (count > 0) {
        alignment.divideScalar(count).setLength(this.maxSpeed).sub(this.velocity).clampLength(0, this.maxForce);
        cohesion.divideScalar(count).sub(this.mesh.position).setLength(this.maxSpeed).sub(this.velocity).clampLength(0, this.maxForce);
        separation.divideScalar(count).clampLength(0, this.maxForce);

        this.applyForce(alignment);
        this.applyForce(cohesion);
        this.applyForce(separation);
      }
    }
  }

  for (let i = 0; i < 300; i++) {
    boids.push(new Boid());
  }
}
