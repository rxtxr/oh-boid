import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { setupGUI } from './gui.js';
import { setupBackground } from './background.js';

// Szene, Kamera und Renderer erstellen
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0x222222);
const nearColor = new THREE.Color(0x000000);
// Use the renderer's clear color so distant boids blend with the background
const farColor = renderer.getClearColor(new THREE.Color());

// Hintergrund
const { update: updateBackground, setParams: setCloudParams, updateSize: updateBackgroundSize } = setupBackground(scene);

renderer.setSize(window.innerWidth, window.innerHeight);
updateBackgroundSize(camera);
window.addEventListener('resize', onWindowResize);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateBackgroundSize(camera);
}
document.body.appendChild(renderer.domElement);
camera.position.z = 100;

function createTextSprite(text) {
    const fontSize = 64;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `bold ${fontSize}px 'Literata', serif`;
    const metrics = ctx.measureText(text);
    canvas.width = metrics.width + 20;
    canvas.height = fontSize * 1.4;
    ctx.font = `bold ${fontSize}px 'Literata', serif`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.strokeText(text, 10, canvas.height / 2);
    ctx.fillText(text, 10, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    const scaleFactor = 0.25;
    sprite.scale.set(canvas.width * scaleFactor, canvas.height * scaleFactor, 1);
    return sprite;
}

let headingSprite;
let headingOpacity = 1.0;
document.fonts.ready.then(() => {
    headingSprite = createTextSprite('Der exquisite Zerfall der Bedeutung im gläsernen Zeitalter');
    headingSprite.position.set(0, 80, 0);
    scene.add(headingSprite);
});

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
        ['x','y'].forEach(axis => {
            if (this.position[axis] > 200) this.position[axis] = -200;
            else if (this.position[axis] < -200) this.position[axis] = 200;
        });
        if (this.position.z > 200) this.position.z = -500;
        else if (this.position.z < -500) this.position.z = 200;
        attractor.influence(this);
    }
}

function createBoidTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,size,size);
    return new THREE.CanvasTexture(canvas);
}

const boids = [];
let colors;
let vertices;
let boidGeometry = new THREE.BufferGeometry();
const boidTexture = createBoidTexture();
const boidMaterial = new THREE.PointsMaterial({
    size: 4,
    vertexColors: true,
    map: boidTexture,
    transparent: true,
    depthWrite: false
});
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

const fpsDisplay = document.getElementById('fps-display');
const frameTimes = [];
const maxFrameSamples = 60;
let lastFrameTime = performance.now();

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
const scale1Input = document.getElementById('cloud-scale1');
const scale2Input = document.getElementById('cloud-scale2');
const noiseMixInput = document.getElementById('cloud-mix');
const lowThInput = document.getElementById('cloud-low-threshold');
const highThInput = document.getElementById('cloud-high-threshold');
const fgColorInput = document.getElementById('foreground-color');
const bgColorInput = document.getElementById('background-color');
const fgBlurInput = document.getElementById('foreground-blur');

const numBoidsValue = document.getElementById('num-boids-value');
const attractorStrengthValue = document.getElementById('attractor-strength-value');
const maxSpeedValue = document.getElementById('max-speed-value');
const alignmentValue = document.getElementById('alignment-strength-value');
const cohesionValue = document.getElementById('cohesion-strength-value');
const separationValue = document.getElementById('separation-strength-value');
const perceptionValue = document.getElementById('perception-radius-value');
const scale1Value = document.getElementById('cloud-scale1-value');
const scale2Value = document.getElementById('cloud-scale2-value');
const noiseMixValue = document.getElementById('cloud-mix-value');
const lowThValue = document.getElementById('cloud-low-threshold-value');
const highThValue = document.getElementById('cloud-high-threshold-value');
const fgBlurValue = document.getElementById('foreground-blur-value');
// We don't display color values, but inputs exist for user adjustments

function updateValueDisplays() {
    if (numBoidsValue) numBoidsValue.textContent = numBoidsInput.value;
    if (attractorStrengthValue) attractorStrengthValue.textContent = attractorStrengthInput.value;
    if (maxSpeedValue) maxSpeedValue.textContent = maxSpeedInput.value;
    if (alignmentValue) alignmentValue.textContent = alignmentInput.value;
    if (cohesionValue) cohesionValue.textContent = cohesionInput.value;
    if (separationValue) separationValue.textContent = separationInput.value;
    if (perceptionValue) perceptionValue.textContent = perceptionInput.value;
    if (scale1Value) scale1Value.textContent = scale1Input.value;
    if (scale2Value) scale2Value.textContent = scale2Input.value;
    if (noiseMixValue) noiseMixValue.textContent = noiseMixInput.value;
    if (lowThValue) lowThValue.textContent = lowThInput.value;
    if (highThValue) highThValue.textContent = highThInput.value;
    if (fgBlurValue) fgBlurValue.textContent = fgBlurInput.value;
}

updateValueDisplays();
if (setCloudParams) {
    setCloudParams({
        scale1: parseFloat(scale1Input.value),
        scale2: parseFloat(scale2Input.value),
        noiseMix: parseFloat(noiseMixInput.value),
        lowThreshold: parseFloat(lowThInput.value),
        highThreshold: parseFloat(highThInput.value)
    });
}

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

if (fgColorInput) {
    nearColor.set(fgColorInput.value);
    fgColorInput.addEventListener('input', () => {
        nearColor.set(fgColorInput.value);
    });
}

if (bgColorInput) {
    renderer.setClearColor(bgColorInput.value);
    farColor.set(bgColorInput.value);
    bgColorInput.addEventListener('input', () => {
        renderer.setClearColor(bgColorInput.value);
        farColor.set(bgColorInput.value);
    });
}

if (fgBlurInput) {
    boidMaterial.size = 4 + parseFloat(fgBlurInput.value);
    fgBlurInput.addEventListener('input', () => {
        boidMaterial.size = 4 + parseFloat(fgBlurInput.value);
        updateValueDisplays();
    });
}

[maxSpeedInput, alignmentInput, cohesionInput, separationInput, perceptionInput].forEach(inp => {
    if (inp) {
        inp.addEventListener('input', updateValueDisplays);
        inp.addEventListener('change', updateValueDisplays);
    }
});

[scale1Input, scale2Input, noiseMixInput, lowThInput, highThInput].forEach(inp => {
    if (inp) {
        inp.addEventListener('input', () => {
            updateValueDisplays();
            setCloudParams({
                scale1: parseFloat(scale1Input.value),
                scale2: parseFloat(scale2Input.value),
                noiseMix: parseFloat(noiseMixInput.value),
                lowThreshold: parseFloat(lowThInput.value),
                highThreshold: parseFloat(highThInput.value)
            });
        });
        inp.addEventListener('change', () => {
            updateValueDisplays();
        });
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
            cloudScale1: scale1Input.value,
            cloudScale2: scale2Input.value,
            cloudMix: noiseMixInput.value,
            cloudLowThreshold: lowThInput.value,
            cloudHighThreshold: highThInput.value,
            foregroundBlur: fgBlurInput ? fgBlurInput.value : 0,
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
        if (settings.cloudScale1 !== undefined) scale1Input.value = settings.cloudScale1;
        if (settings.cloudScale2 !== undefined) scale2Input.value = settings.cloudScale2;
        if (settings.cloudMix !== undefined) noiseMixInput.value = settings.cloudMix;
        if (settings.cloudLowThreshold !== undefined) lowThInput.value = settings.cloudLowThreshold;
        if (settings.cloudHighThreshold !== undefined) highThInput.value = settings.cloudHighThreshold;
        if (settings.foregroundBlur !== undefined && fgBlurInput) {
            fgBlurInput.value = settings.foregroundBlur;
            boidMaterial.size = 4 + parseFloat(fgBlurInput.value);
        }
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
        if (setCloudParams) {
            setCloudParams({
                scale1: parseFloat(scale1Input.value),
                scale2: parseFloat(scale2Input.value),
                noiseMix: parseFloat(noiseMixInput.value),
                lowThreshold: parseFloat(lowThInput.value),
                highThreshold: parseFloat(highThInput.value)
            });
        }
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

function adjustSettings(fps) {
    if (fps < 30) {
        if (boids.length > 100) {
            updateBoidCount(Math.floor(boids.length * 0.9));
            if (numBoidsInput) numBoidsInput.value = boids.length;
            updateValueDisplays();
        }
        if (showLines) {
            showLines = false;
            lineSegments.visible = false;
            if (showLinesInput) showLinesInput.checked = false;
        }
    }
}

const minDistance = 0;
const maxDistance = 500;

function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const delta = now - lastFrameTime;
    lastFrameTime = now;
    frameTimes.push(delta);
    if (frameTimes.length > maxFrameSamples) frameTimes.shift();
    const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const fps = 1000 / avg;
    if (fpsDisplay) fpsDisplay.textContent = fps.toFixed(1);
    adjustSettings(fps);

    updateBackground(now * 0.001, camera);
    boids.forEach((boid, i) => {
        boid.update(boids);
        vertices.set([boid.position.x, boid.position.y, boid.position.z], i * 3);
        let distanceFactor = (boid.position.distanceTo(camera.position) - minDistance) / (maxDistance - minDistance);
        distanceFactor = THREE.MathUtils.clamp(distanceFactor, 0, 1);
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
    if (headingSprite) {
        headingSprite.material.opacity = headingOpacity;
        if (headingOpacity > 0) {
            headingOpacity -= 0.005;
        }
    }
    boidGeometry.attributes.position.needsUpdate = true;
    boidGeometry.attributes.color.needsUpdate = true;
    renderer.render(scene, camera);
}
animate();
