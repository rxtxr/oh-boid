import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

export function setupBackground(scene) {
  const loader = new THREE.TextureLoader();
  const cloudTex = loader.load('clouds.jpg');
  cloudTex.wrapS = cloudTex.wrapT = THREE.RepeatWrapping;

  const baseWidth = 2000;
  const baseHeight = 1000;
  const geometry = new THREE.PlaneGeometry(baseWidth, baseHeight);
  const uniforms = {
    time: { value: 0 },
    cloudTex: { value: cloudTex },
    scale1: { value: 4.0 },
    scale2: { value: 8.0 },
    noiseMix: { value: 0.5 },
    lowThreshold: { value: 0.3 },
    highThreshold: { value: 0.7 },
    mixStrength: { value: 0.4 }
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float time;
      uniform sampler2D cloudTex;
      uniform float scale1;
      uniform float scale2;
      uniform float noiseMix;
      uniform float lowThreshold;
      uniform float highThreshold;
      uniform float mixStrength;

      float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
      }

      float noise(vec2 p){
        vec2 i = floor(p);
        vec2 f = fract(p);

        float a = rand(i);
        float b = rand(i + vec2(1.0,0.0));
        float c = rand(i + vec2(0.0,1.0));
        float d = rand(i + vec2(1.0,1.0));

        vec2 u = f*f*(3.0-2.0*f);

        return mix(a, b, u.x) +
               (c - a)*u.y*(1.0-u.x) +
               (d - b)*u.x*u.y;
      }

      void main() {
        vec2 uv = vUv;
        vec4 base = texture2D(cloudTex, uv);
        float n = noise(uv*scale1 + vec2(time*0.05));
        float n2 = noise(uv*scale2 - vec2(time*0.03));
        float value = smoothstep(lowThreshold, highThreshold, mix(n, n2, noiseMix));
        vec3 color = mix(base.rgb, vec3(value), mixStrength);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = -500;
  scene.add(mesh);

  function updateSize(camera) {
    if (!camera) return;
    const distance = camera.position.z - mesh.position.z;
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance;
    const width = height * camera.aspect;
    mesh.scale.set(width / baseWidth, height / baseHeight, 1);
  }

  return {
    mesh,
    update(time, camera) {
      uniforms.time.value = time;
      updateSize(camera);
    },
    setParams(params) {
      if (params.scale1 !== undefined) uniforms.scale1.value = params.scale1;
      if (params.scale2 !== undefined) uniforms.scale2.value = params.scale2;
      if (params.noiseMix !== undefined) uniforms.noiseMix.value = params.noiseMix;
      if (params.lowThreshold !== undefined) uniforms.lowThreshold.value = params.lowThreshold;
      if (params.highThreshold !== undefined) uniforms.highThreshold.value = params.highThreshold;
      if (params.mixStrength !== undefined) uniforms.mixStrength.value = params.mixStrength;
    },
    updateSize
  };
}
