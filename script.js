import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { setupGUI } from './gui.js';

// Szene, Kamera und Renderer erstellen
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xefefef);
const backgroundColor = new THREE.Color(0xcccccc);
const nearColor = new THREE.Color(0x000000);
const farColor = backgroundColor;

// Hintergrund
const loader = new THREE.TextureLoader();
const backgroundTexture = loader.load('clouds.jpg');
const backgroundMaterial = new THREE.MeshBasicMaterial({ map: backgroundTexture });
const backgroundGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
backgroundMesh.position.z = -500;
scene.add(backgroundMesh);

renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener('resize', onWindowResize);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
document.body.appendChild(renderer.domElement);
camera.position.z = 100;

// Attraktor
class Attractor {
    constructor(position, strength) {
        this.position = position;
        this.strength = strength;
    }
    influence(boid) {
        const force = this.position.clone().sub(boid.position);
        force.multiplyScalar(this.strength / force.lengthSq());
        boid.velocity.add(force);
    }
}
const attractor = new Attractor(new THREE.Vector3(0, 0, 0), 0.7);
scene.add(new THREE.Mesh(new THREE.SphereGeometry(0), new THREE.MeshBasicMaterial()).position.copy(attractor.position));

// Boids
class Boid {
    constructor() {
        this.velocity = new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5));
        this.position = new THREE.Vector3(Math.random() * 400 - 200, Math.random() * 400 - 200, Math.random() * 400 - 200);
        this.alignmentStrength = 0.4;
        this.cohesionStrength = 0.003;
        this.separationStrength = 0.08;
        this.maxSpeed = 1.4;
    }
    update(boids) {
        let alignment = new THREE.Vector3();
        let cohesion = new THREE.Vector3();
        let separation = new THREE.Vector3();
        let count = 0;
        for (let other of boids) {
            if (other !== this) {
                cohesion.add(other.position);
                alignment.add(other.velocity);
                if (this.position.distanceTo(other.position) < 5) {
                    separation.subVectors(this.position, other.position);
                }
                count++;
            }
        }
        if (count > 0) {
            cohesion.divideScalar(count).sub(this.position).multiplyScalar(this.cohesionStrength);
            alignment.divideScalar(count).sub(this.velocity).multiplyScalar(this.alignmentStrength);
            separation.multiplyScalar(this.separationStrength);
        }
        this.velocity.add(alignment).add(cohesion).add(separation);
        this.velocity.clampLength(0.5, this.maxSpeed);
        this.position.add(this.velocity);
        ['x','y','z'].forEach(axis => {
            if (this.position[axis] > 200) this.position[axis] = -200;
            else if (this.position[axis] < -200) this.position[axis] = 200;
        });
        attractor.influence(this);
    }
}

const boids = Array.from({ length: 500 }, () => new Boid());
setupGUI(boids);

const colors = new Float32Array(boids.length * 3);
const vertices = new Float32Array(boids.length * 3);
boids.forEach((boid, i) => {
    vertices.set([boid.position.x, boid.position.y, boid.position.z], i * 3);
});

const boidGeometry = new THREE.BufferGeometry();
boidGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
boidGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const boidMaterial = new THREE.PointsMaterial({ size: 2, vertexColors: true });
const points = new THREE.Points(boidGeometry, boidMaterial);
scene.add(points);

const minDistance = 0;
const maxDistance = 500;

function animate() {
    requestAnimationFrame(animate);
    boids.forEach((boid, i) => {
        boid.update(boids);
        vertices.set([boid.position.x, boid.position.y, boid.position.z], i * 3);
        const distanceFactor = (boid.position.distanceTo(camera.position) - minDistance) / (maxDistance - minDistance);
        const boidColor = nearColor.clone().lerp(farColor, distanceFactor);
        colors.set([boidColor.r, boidColor.g, boidColor.b], i * 3);
    });
    boidGeometry.attributes.position.needsUpdate = true;
    boidGeometry.attributes.color.needsUpdate = true;
    renderer.render(scene, camera);
}
animate();