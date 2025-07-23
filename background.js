import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

export function setupBackground(scene) {
  const loader = new THREE.TextureLoader();
  const cloudTex = loader.load('clouds.jpg');
  cloudTex.wrapS = cloudTex.wrapT = THREE.RepeatWrapping;

  const geometry = new THREE.PlaneGeometry(2000, 1000);
  const uniforms = {
    time: { value: 0 },
    cloudTex: { value: cloudTex }
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
        float n = noise(uv*4.0 + vec2(time*0.05));
        float n2 = noise(uv*8.0 - vec2(time*0.03));
        float value = smoothstep(0.3,0.7,mix(n,n2,0.5));
        vec3 color = mix(base.rgb, vec3(value), 0.4);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = -500;
  scene.add(mesh);

  return {
    mesh,
    update(time) {
      uniforms.time.value = time;
    }
  };
}
