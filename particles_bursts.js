import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { scene } from "./scene_setup.js";
import { clamp, lerp, easeOutCubic } from "./utils.js";

// ---------- Particles (burst per pop) ----------
const particleBursts = []; // { points, vel(Float32Array), life, ttl, baseOpacity }

export function spawnBurst(pos, color, radius) {
  if (particleBursts.length > 40) {
    const old = particleBursts.shift();
    scene.remove(old.points);
    old.points.geometry.dispose();
    old.points.material.dispose();
  }

  const count = Math.floor(clamp(80 + radius * 60, 90, 170));
  const positions = new Float32Array(count * 3);
  const colors    = new Float32Array(count * 3);
  const vel       = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    const jitter = radius * 0.08;
    positions[i3 + 0] = pos.x + (Math.random() - 0.5) * jitter;
    positions[i3 + 1] = pos.y + (Math.random() - 0.5) * jitter;
    positions[i3 + 2] = pos.z + (Math.random() - 0.5) * jitter;

    let x = (Math.random() * 2 - 1);
    let y = (Math.random() * 2 - 1);
    let z = (Math.random() * 2 - 1);
    const inv = 1 / (Math.sqrt(x * x + y * y + z * z) || 1e-6);
    x *= inv; y *= inv; z *= inv;

    const speed = lerp(6.0, 14.0, Math.random()) * (0.7 + radius * 0.15);
    vel[i3 + 0] = x * speed;
    vel[i3 + 1] = y * speed;
    vel[i3 + 2] = z * speed;

    const c = color.clone().multiplyScalar(lerp(0.85, 1.10, Math.random()));
    colors[i3 + 0] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: clamp((0.50 + radius * 0.04) * 3.0, 0.60, 5.0),
    transparent: true,
    opacity: 0.9,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geom, mat);
  points.frustumCulled = false;
  scene.add(points);

  particleBursts.push({
    points,
    vel,
    life: 0,
    ttl: lerp(0.35, 0.65, Math.random()),
    baseOpacity: 1.0
  });
}

export function updateBursts(dt) {
  for (let i = particleBursts.length - 1; i >= 0; i--) {
    const b = particleBursts[i];
    b.life += dt;
    const t = b.life / b.ttl;

    const geom = b.points.geometry;
    const posAttr = geom.getAttribute("position");
    const arr = posAttr.array;

    const gy = -10.0;

    for (let k = 0; k < arr.length; k += 3) {
      b.vel[k + 1] += gy * dt;

      b.vel[k + 0] *= (1 - dt * 0.8);
      b.vel[k + 1] *= (1 - dt * 0.8);
      b.vel[k + 2] *= (1 - dt * 0.8);

      arr[k + 0] += b.vel[k + 0] * dt;
      arr[k + 1] += b.vel[k + 1] * dt;
      arr[k + 2] += b.vel[k + 2] * dt;
    }

    posAttr.needsUpdate = true;
    b.points.material.opacity = clamp(1 - easeOutCubic(t), 0, 1);

    if (t >= 1) {
      scene.remove(b.points);
      b.points.geometry.dispose();
      b.points.material.dispose();
      particleBursts.splice(i, 1);
    }
  }
}
