import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import { renderer, scene, camera } from "./scene_setup.js";
import { view } from "./camera_view.js";
import { bubbles } from "./bubbles_factory.js";

import { clamp, smoothstep, easeOutCubic } from "./utils.js";
import { resolveRuntimeCollisions } from "./collisions_runtime.js";
import { updateBursts } from "./particles_bursts.js";
import { projectToScreen, updateOverlay } from "./projection_overlay.js";
import { removeBubbleAtIndex } from "./interaction_pointer.js";

// ---------- Animation ----------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.033);
  const time = clock.elapsedTime;

  // Камера закреплена на нашем центре view.cx, view.cy
  camera.lookAt(view.cx, view.cy, 0);

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    const g = b.mesh;

    // glow тоже билборд
    if (b.glow) {
      b.glow.quaternion.copy(camera.quaternion);
      b.glow.position.x = g.position.x;
      b.glow.position.y = g.position.y;
      b.glow.position.z = g.position.z - 0.02;
    }

    // декоративная глубина
    g.position.z = b.baseZ + Math.sin(time * 0.5 + b.phase) * 0.30;

    // билбординг — всегда "лицом" к камере
    g.quaternion.copy(camera.quaternion);

    // время в шейдер
    const m = b.mesh.material;
    if (m && m.uniforms && m.uniforms.uTime) {
      m.uniforms.uTime.value = time;
    }

    if (b.popping) {
      b.popT += dt;
      const t = b.popT / b.popDur;
      const e = easeOutCubic(t);

      const s = b.targetR * (1 - e);
      g.scale.set(
        Math.max(0.0001, s),
        Math.max(0.0001, s),
        Math.max(0.0001, s)
      );

      const fade = clamp(1 - e, 0, 1);
      const m2 = b.mesh.material;
      if (m2 && m2.uniforms && m2.uniforms.uOpacity) {
        m2.uniforms.uOpacity.value = 0.98 * fade;
      } else if (m2 && "opacity" in m2) {
        m2.opacity = 0.95 * fade;
      }

      g.position.y -= dt * 0.9;

      if (t >= 1) {
        removeBubbleAtIndex(i);
      }
      continue;
    }

    // обычная динамика (пружинка к таргету)
    const k = 10.0;
    const d = 6.0;
    const dx = b.targetX - g.position.x;
    const dy = b.targetY - g.position.y;

    b.vx += (dx * k - b.vx * d) * dt;
    b.vy += (dy * k - b.vy * d) * dt;

    g.position.x += b.vx * dt;
    g.position.y += b.vy * dt;

    // дыхание
    const r = b.targetR;
    const breathe = 1 + Math.sin(time * 1.2 + b.phase) * 0.010;
    const pulse = 1 + Math.sin(time * 0.6 + b.phase * 1.7) * 0.006;
    const sc = r * breathe * pulse;
    g.scale.set(sc, sc, sc);

    // --- Glow thickness: max 20px вокруг окружности ---
    if (b.glow && b.glowMat) {
      const glowPx = 5;

      // оценка радиуса шара в пикселях
      const pC = projectToScreen(g.position.x, g.position.y, g.position.z);
      const pR = projectToScreen(g.position.x + sc, g.position.y, g.position.z);
      const radPx = Math.max(1, Math.abs(pR.x - pC.x));

      // scale-factor чтобы добавить ровно N px в экране
      const extra = 1 + (glowPx / radPx);

      b.glow.scale.set(sc * extra, sc * extra, sc * extra);

      // сила свечения остаётся = trials01, но можно мягче через smoothstep
      const tGlow = smoothstep(b.trials01 ?? 0);
      b.glowMat.uniforms.uStrength.value = tGlow;
    }

    const m3 = b.mesh.material;
    if (m3 && m3.uniforms && m3.uniforms.uOpacity) {
      m3.uniforms.uOpacity.value = 0.98;
    } else if (m3 && "opacity" in m3) {
      m3.opacity = 0.95;
    }
  }

  resolveRuntimeCollisions(dt, bubbles);
  updateBursts(dt);

  renderer.render(scene, camera);
  updateOverlay();
}

animate();
