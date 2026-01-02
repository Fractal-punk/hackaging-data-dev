import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

// ---------- Glow (trials halo) ----------
const glowGeo = new THREE.PlaneGeometry(2, 2, 1, 1);

function makeGlowMaterial(color) {
  const base = color.clone();

  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false, // чтобы свечение не резалось глубиной
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uBaseColor: { value: new THREE.Vector3(base.r, base.g, base.b) },
      uStrength:  { value: 0.0 },   // 0..1
      uMargin:    { value: 0.25 },  // толщина (в “радиусах”)
      uOpacity:   { value: 1.0 },
      uFeather:   { value: 0.030 }, // мягкость края (в радиусах)
      uSquare:    { value: 0.0 }    // 0 = круг, 1 = квадрат (для строгой темы)
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;

      uniform vec3  uBaseColor;
      uniform float uStrength;
      uniform float uMargin;
      uniform float uOpacity;
      uniform float uFeather;
      uniform float uSquare;

      void main(){
        vec2 p = vUv * 2.0 - 1.0;

        // rCircle: круг, rSquare: квадрат
        float rCircle = length(p);
        float rSquare = max(abs(p.x), abs(p.y));
        float r = mix(rCircle, rSquare, clamp(uSquare, 0.0, 1.0));

        float w = clamp(uStrength, 0.0, 1.0);
        if (w <= 0.0) discard;

        // --- ВНУТРЕННЕЕ свечение: [1.0 - uMargin .. 1.0] ---
        float innerEdge = smoothstep(1.0 - uMargin - uFeather, 1.0 - uMargin + uFeather, r);
        float outerEdge = 1.0 - smoothstep(1.0 - uFeather, 1.0 + uFeather, r);

        float ring = clamp(innerEdge * outerEdge, 0.0, 1.0);
        if (ring <= 0.0001) discard;

        vec3 col = mix(uBaseColor, vec3(1.0), 0.65 * w);

        float intensity = (0.20 + 1.25 * w) * ring;

        gl_FragColor = vec4(col * intensity, uOpacity * intensity);
      }
    `
  });
}

export function buildGlow(color) {
  const mat = makeGlowMaterial(color);
  const mesh = new THREE.Mesh(glowGeo, mat);
  mesh.frustumCulled = false;
  return { mesh, mat };
}
