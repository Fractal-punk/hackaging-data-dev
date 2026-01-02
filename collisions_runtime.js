import { clamp } from "./utils.js";
import { layout } from "./layout.js";

// ---------- Runtime collisions ----------
export const coll = { iterations: 3, padding: 1.06, stiffness: 0.85, boundsPad: 0.15 };

export function resolveRuntimeCollisions(dt, bubbles) {
  for (let it = 0; it < coll.iterations; it++) {
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const A = bubbles[i];
        const B = bubbles[j];
        if (A.popping || B.popping) continue;

        const gA = A.mesh;
        const gB = B.mesh;

        const rA = A.targetR * coll.padding;
        const rB = B.targetR * coll.padding;

        const dx = gB.position.x - gA.position.x;
        const dy = gB.position.y - gA.position.y;

        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1e-6) dist = 1e-6;

        const minDist = rA + rB;

        if (dist < minDist) {
          const nx = dx / dist;
          const ny = dy / dist;
          const pen = (minDist - dist);

          const wA = 1 / (rA * rA);
          const wB = 1 / (rB * rB);
          const wSum = wA + wB;

          const moveA = pen * (wA / wSum) * 0.5 * coll.stiffness;
          const moveB = pen * (wB / wSum) * 0.5 * coll.stiffness;

          gA.position.x -= nx * moveA;
          gA.position.y -= ny * moveA;
          gB.position.x += nx * moveB;
          gB.position.y += ny * moveB;

          const impulse = pen / Math.max(dt, 1e-3) * 0.0009;
          A.vx -= nx * impulse * (wA / wSum);
          A.vy -= ny * impulse * (wA / wSum);
          B.vx += nx * impulse * (wB / wSum);
          B.vy += ny * impulse * (wB / wSum);
        }
      }
    }

    for (const b of bubbles) {
      if (b.popping) continue;
      const g = b.mesh;
      const r = b.targetR * coll.padding;
      g.position.x = clamp(g.position.x, layout.xMin + r + coll.boundsPad, layout.xMax - r - coll.boundsPad);
      g.position.y = clamp(g.position.y, layout.yMin + r + coll.boundsPad, layout.yMax - r - coll.boundsPad);
    }
  }
}
