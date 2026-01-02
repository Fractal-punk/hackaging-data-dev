import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

// ---------- Julia "balloons" (billboards with shader) ----------
const juliaGeo = new THREE.PlaneGeometry(2, 2, 1, 1);

function makeJuliaMaterial(color, seed = 0) {
  const base = color.clone();

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime:      { value: 0 },
      uBaseColor: { value: new THREE.Vector3(base.r, base.g, base.b) },
      uOpacity:   { value: 0.98 },
      uSeed:      { value: seed },
      uCScale:    { value: 0.83 },
      uZoom:      { value: 1.25 },
      uIters:     { value: 92.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying vec2 vUv;

      uniform float uTime;
      uniform vec3  uBaseColor;
      uniform float uOpacity;
      uniform float uSeed;
      uniform float uCScale;
      uniform float uZoom;
      uniform float uIters;

      vec2 cmul(vec2 a, vec2 b) {
        return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
      }

      void main() {
        vec2 p = vUv * 2.0 - 1.0;

        float r2 = dot(p, p);
        if (r2 > 1.0) discard;

        float shade = 0.70 + 0.30 * sqrt(max(0.0, 1.0 - r2));

        vec2 z = p * uZoom;

        float ang = uTime * 0.35 + uSeed * 6.2831853;
        vec2 c = uCScale * vec2(cos(ang), sin(ang));
        c += 0.08 * vec2(cos(uSeed*13.1), sin(uSeed*9.7));

        float it = 0.0;
        vec2 zz = z;

        for (int i = 0; i < 220; i++) {
          if (float(i) >= uIters) break;
          zz = cmul(zz, zz) + c;
          if (dot(zz, zz) > 4.0) { it = float(i); break; }
        }

        float t;
        if (it == 0.0 && dot(zz, zz) <= 4.0) {
          t = 0.0;
        } else {
          t = it / max(1.0, (uIters - 1.0));
        }

        float edge = smoothstep(0.02, 0.65, t);
        float core = 1.0 - smoothstep(0.0, 0.25, t);

        vec3 col = uBaseColor;
        col = mix(col * 0.10, col * 1.35, edge);
        col += uBaseColor * 0.20 * core;
        col *= 1.0;

        col = mix(col, vec3(0.02, 0.03, 0.05), 0.18);

        float rim = smoothstep(0.85, 1.0, r2);
        col *= shade;
        col += uBaseColor * 0.18 * rim;

        gl_FragColor = vec4(col, uOpacity);
      }
    `
  });

  return mat;
}

export function buildJuliaBubble(color, r, seed) {
  const mat = makeJuliaMaterial(color, seed);
  const mesh = new THREE.Mesh(juliaGeo, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.scale.set(r, r, r);
  return { mesh, mat };
}
