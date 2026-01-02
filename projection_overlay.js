import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import { renderer, camera } from "./scene_setup.js";
import { bubbles } from "./bubbles_factory.js";
import { clamp } from "./utils.js";

// ---------- Projection ----------
const v = new THREE.Vector3();

export function projectToScreen(worldX, worldY, worldZ) {
  const rect = renderer.domElement.getBoundingClientRect();
  v.set(worldX, worldY, worldZ).project(camera);
  return {
    x: (v.x * 0.5 + 0.5) * rect.width,
    y: (-v.y * 0.5 + 0.5) * rect.height
  };
}

export function updateOverlay() {
  for (const b of bubbles) {
    const g = b.mesh;

    const p0 = projectToScreen(g.position.x, g.position.y, g.position.z);
    b.inEl.style.left = `${p0.x}px`;
    b.inEl.style.top = `${p0.y}px`;

    const alphaIn = clamp(
      0.62 + (1.0 - Math.abs(g.position.z) / 5.0) * 0.38,
      0.0,
      1.0
    );
    b.inEl.style.opacity = (b.popping ? alphaIn * 0.3 : alphaIn).toFixed(3);
  }
}
