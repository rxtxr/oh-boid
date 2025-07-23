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
        const distSq = force.lengthSq();
        if (distSq === 0) return;
        force.multiplyScalar(this.strength / distSq);
        force.clampLength(0, 0.02);
        boid.velocity.add(force);
    }
}
const attractor = new Attractor(new THREE.Vector3(0, 0, 0), 0.3);
scene.add(new THREE.Mesh(new THREE.SphereGeometry(0), new THREE.MeshBasicMaterial()).position.copy(attractor.position));

// Boids
class Boid {
    constructor() {
        this.velocity = new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5));
        this.position = new THREE.Vector3(Math.random() * 400 - 200, Math.random() * 400 - 200, Math.random() * 400 - 200);
        this.alignmentStrength = 0.2;
        this.cohesionStrength = 0.01;
        this.separationStrength = 0.1;
        this.perceptionRadius = 60;
        this.separationDistance = 20;
        this.maxSpeed = 1.0;
    }
    update(boids) {
        let alignment = new THREE.Vector3();
        let cohesion = new THREE.Vector3();
        let separation = new THREE.Vector3();
        let count = 0;
        let sepCount = 0;
        for (let other of boids) {
            if (other !== this) {
                const d = this.position.distanceTo(other.position);
                if (d < this.perceptionRadius) {
                    cohesion.add(other.position);
                    alignment.add(other.velocity);
                    if (d < this.separationDistance) {
                        const diff = new THREE.Vector3().subVectors(this.position, other.position).divideScalar(d);
                        separation.add(diff);
                        sepCount++;
                    }
                    count++;
                }
            }
        }
        if (count > 0) {
            cohesion.divideScalar(count).sub(this.position).multiplyScalar(this.cohesionStrength);
            alignment.divideScalar(count).sub(this.velocity).multiplyScalar(this.alignmentStrength);
        }
        if (sepCount > 0) {
            separation.divideScalar(sepCount).multiplyScalar(this.separationStrength);
        }
        this.velocity.add(alignment).add(cohesion).add(separation);
        this.velocity.multiplyScalar(0.98);
        this.velocity.clampLength(0.5, this.maxSpeed);
        this.position.add(this.velocity);
        ['x','y','z'].forEach(axis => {
            if (this.position[axis] > 200) this.position[axis] = -200;
            else if (this.position[axis] < -200) this.position[axis] = 200;
        });
        attractor.influence(this);
    }
}

const boids = [];
let colors;
let vertices;
let boidGeometry = new THREE.BufferGeometry();
const boidMaterial = new THREE.PointsMaterial({ size: 2, vertexColors: true });
let points = new THREE.Points(boidGeometry, boidMaterial);
scene.add(points);

const lineMaterial = new THREE.LineBasicMaterial({ color: 0x3333ff });
let lineSegments = new THREE.LineSegments(new THREE.BufferGeometry(), lineMaterial);
scene.add(lineSegments);

const coordContainer = document.createElement('div');
coordContainer.style.position = 'absolute';
coordContainer.style.top = '0';
coordContainer.style.left = '0';
coordContainer.style.pointerEvents = 'none';
coordContainer.style.fontSize = '10px';
document.body.appendChild(coordContainer);
let coordSpans = [];

let showLines = false;
let showCoords = false;

addBoids(500);
rebuildGeometry();
setupGUI(boids, attractor);

// Input-Elemente und Anzeige der aktuellen Werte
const numBoidsInput = document.getElementById('num-boids');
const attractorStrengthInput = document.getElementById('attractor-strength');
const maxSpeedInput = document.getElementById('max-speed');
const alignmentInput = document.getElementById('alignment-strength');
const cohesionInput = document.getElementById('cohesion-strength');
const separationInput = document.getElementById('separation-strength');
const perceptionInput = document.getElementById('perception-radius');

const numBoidsValue = document.getElementById('num-boids-value');
const attractorStrengthValue = document.getElementById('attractor-strength-value');
const maxSpeedValue = document.getElementById('max-speed-value');
const alignmentValue = document.getElementById('alignment-strength-value');
const cohesionValue = document.getElementById('cohesion-strength-value');
const separationValue = document.getElementById('separation-strength-value');
const perceptionValue = document.getElementById('perception-radius-value');

function updateValueDisplays() {
    if (numBoidsValue) numBoidsValue.textContent = numBoidsInput.value;
    if (attractorStrengthValue) attractorStrengthValue.textContent = attractorStrengthInput.value;
    if (maxSpeedValue) maxSpeedValue.textContent = maxSpeedInput.value;
    if (alignmentValue) alignmentValue.textContent = alignmentInput.value;
    if (cohesionValue) cohesionValue.textContent = cohesionInput.value;
    if (separationValue) separationValue.textContent = separationInput.value;
    if (perceptionValue) perceptionValue.textContent = perceptionInput.value;
}

updateValueDisplays();

if (numBoidsInput) {
    numBoidsInput.addEventListener('change', () => {
        const value = parseInt(numBoidsInput.value, 10);
        if (!isNaN(value) && value > 0) {
            updateBoidCount(value);
        }
        updateValueDisplays();
    });
    numBoidsInput.addEventListener('input', updateValueDisplays);
}

if (attractorStrengthInput) {
    attractorStrengthInput.addEventListener('input', () => {
        const value = parseFloat(attractorStrengthInput.value);
        if (!isNaN(value)) {
            attractor.strength = value;
        }
        updateValueDisplays();
    });
    attractorStrengthInput.addEventListener('change', updateValueDisplays);
}

const showLinesInput = document.getElementById('show-lines');
if (showLinesInput) {
    showLinesInput.addEventListener('change', () => {
        showLines = showLinesInput.checked;
        lineSegments.visible = showLines;
    });
}

const showCoordsInput = document.getElementById('show-coords');
if (showCoordsInput) {
    showCoordsInput.addEventListener('change', () => {
        showCoords = showCoordsInput.checked;
    });
}

[maxSpeedInput, alignmentInput, cohesionInput, separationInput, perceptionInput].forEach(inp => {
    if (inp) {
        inp.addEventListener('input', updateValueDisplays);
        inp.addEventListener('change', updateValueDisplays);
    }
});

const resetButton = document.getElementById('reset-canvas');
if (resetButton) {
    resetButton.addEventListener('click', () => {
        const ref = boids[0];
        const current = ref ? {
            maxSpeed: ref.maxSpeed,
            alignmentStrength: ref.alignmentStrength,
            cohesionStrength: ref.cohesionStrength,
            separationStrength: ref.separationStrength,
            perceptionRadius: ref.perceptionRadius
        } : {
            maxSpeed: parseFloat(maxSpeedInput.value) || 1,
            alignmentStrength: parseFloat(alignmentInput.value) || 0.2,
            cohesionStrength: parseFloat(cohesionInput.value) || 0.01,
            separationStrength: parseFloat(separationInput.value) || 0.1,
            perceptionRadius: parseFloat(perceptionInput.value) || 60
        };

        boids.splice(0, boids.length);
        const count = parseInt(numBoidsInput.value, 10) || 0;
        addBoids(count, current);
        rebuildGeometry();
        updateCoordinateElements();
    });
}

const saveButton = document.getElementById('save-settings');
if (saveButton) {
    saveButton.addEventListener('click', () => {
        const settings = {
            numBoids: numBoidsInput.value,
            attractorStrength: attractorStrengthInput.value,
            maxSpeed: maxSpeedInput.value,
            alignmentStrength: alignmentInput.value,
            cohesionStrength: cohesionInput.value,
            separationStrength: separationInput.value,
            perceptionRadius: perceptionInput.value,
            showLines: showLinesInput.checked,
            showCoords: showCoordsInput.checked
        };
        localStorage.setItem('boidSettings', JSON.stringify(settings));
    });
}

const loadButton = document.getElementById('load-settings');
if (loadButton) {
    loadButton.addEventListener('click', () => {
        const str = localStorage.getItem('boidSettings');
        if (!str) return;
        const settings = JSON.parse(str);
        if (settings.numBoids !== undefined) numBoidsInput.value = settings.numBoids;
        if (settings.attractorStrength !== undefined) attractorStrengthInput.value = settings.attractorStrength;
        if (settings.maxSpeed !== undefined) maxSpeedInput.value = settings.maxSpeed;
        if (settings.alignmentStrength !== undefined) alignmentInput.value = settings.alignmentStrength;
        if (settings.cohesionStrength !== undefined) cohesionInput.value = settings.cohesionStrength;
        if (settings.separationStrength !== undefined) separationInput.value = settings.separationStrength;
        if (settings.perceptionRadius !== undefined) perceptionInput.value = settings.perceptionRadius;
        if (settings.showLines !== undefined) {
            showLinesInput.checked = settings.showLines;
            showLines = showLinesInput.checked;
            lineSegments.visible = showLines;
        }
        if (settings.showCoords !== undefined) {
            showCoordsInput.checked = settings.showCoords;
            showCoords = showCoordsInput.checked;
        }
        updateValueDisplays();
        const num = parseInt(numBoidsInput.value, 10);
        if (!isNaN(num) && num >= 0) {
            updateBoidCount(num);
        }
    });
}

function rebuildGeometry() {
    colors = new Float32Array(boids.length * 3);
    vertices = new Float32Array(boids.length * 3);
    boids.forEach((boid, i) => {
        vertices.set([boid.position.x, boid.position.y, boid.position.z], i * 3);
    });
    const newGeometry = new THREE.BufferGeometry();
    newGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    newGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    points.geometry.dispose();
    points.geometry = newGeometry;
    boidGeometry = newGeometry;
    updateCoordinateElements();
}

function updateCoordinateElements() {
    while (coordSpans.length < boids.length) {
        const span = document.createElement('span');
        span.style.position = 'absolute';
        span.style.color = 'black';
        coordContainer.appendChild(span);
        coordSpans.push(span);
    }
    while (coordSpans.length > boids.length) {
        const s = coordSpans.pop();
        coordContainer.removeChild(s);
    }
}

function updateLines() {
    if (!showLines) return;
    const positions = [];
    boids.forEach((boid, i) => {
        const sorted = boids
            .map((b, idx) => ({ b, d: boid.position.distanceToSquared(b.position), idx }))
            .filter(o => o.idx !== i)
            .sort((a, b) => a.d - b.d)
            .slice(0, 3);
        sorted.forEach(n => {
            positions.push(boid.position.x, boid.position.y, boid.position.z);
            positions.push(n.b.position.x, n.b.position.y, n.b.position.z);
        });
    });
    const arr = new Float32Array(positions);
    lineSegments.geometry.dispose();
    lineSegments.geometry = new THREE.BufferGeometry();
    lineSegments.geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3));
}

function addBoids(count, settings) {
    for (let i = 0; i < count; i++) {
        const b = new Boid();
        const ref = settings || boids[0];
        if (ref) {
            b.maxSpeed = ref.maxSpeed;
            b.alignmentStrength = ref.alignmentStrength;
            b.cohesionStrength = ref.cohesionStrength;
            b.separationStrength = ref.separationStrength;
            b.perceptionRadius = ref.perceptionRadius;
        }
        boids.push(b);
    }
}

function updateBoidCount(newCount) {
    const diff = newCount - boids.length;
    if (diff > 0) {
        addBoids(diff);
    } else if (diff < 0) {
        boids.splice(newCount);
    }
    rebuildGeometry();
    updateCoordinateElements();
}

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
    if (showLines) {
        updateLines();
        lineSegments.visible = true;
    } else {
        lineSegments.visible = false;
    }
    if (showCoords) {
        coordContainer.style.display = 'block';
        boids.forEach((boid, i) => {
            const proj = boid.position.clone().project(camera);
            const x = (proj.x + 1) / 2 * window.innerWidth;
            const y = (1 - proj.y) / 2 * window.innerHeight;
            const span = coordSpans[i];
            span.style.transform = `translate(${x}px, ${y}px)`;
            span.textContent = `${Math.round(boid.position.x)},${Math.round(boid.position.y)},${Math.round(boid.position.z)}`;
        });
    } else {
        coordContainer.style.display = 'none';
    }
    boidGeometry.attributes.position.needsUpdate = true;
    boidGeometry.attributes.color.needsUpdate = true;
    renderer.render(scene, camera);
}
animate();
