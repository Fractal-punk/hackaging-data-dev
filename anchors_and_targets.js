import { sectors } from "./metrics.js";
import { layout, shareToY } from "./layout.js";
import { clamp, lerp } from "./utils.js";

export function computeAnchors(list) {
  const n = list.length;
  const sorted = [...list].sort((a, b) => b.capital - a.capital);
  const positions = new Map();

  sorted.forEach((s, i) => {
    const t = (i + 0.5) / n;
    const x = lerp(layout.xMax, layout.xMin, t);

    const centerPull =
      0.25 * (sorted[0].capital - s.capital) / Math.max(1, sorted[0].capital);

    const x2 = x * (1 - centerPull);
    const y = shareToY(s.sharePct);
    const z = layout.zBase + (Math.random() - 0.5) * layout.zJitter;

    positions.set(s.id, { ax: x2, ay: y, az: z });
  });

  return positions;
}

export const anchors = computeAnchors(sectors);

// ---------- Overlaps (targets) ----------
export function resolve2DOverlaps(items, iterations = 2) {
  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];

        const dx = b.targetX - a.targetX;
        const dy = b.targetY - a.targetY;

        const dist = Math.sqrt(dx * dx + dy * dy) || 1e-6;
        const minDist = (a.targetR + b.targetR) * 0.98;

        if (dist < minDist) {
          const push = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const ny = dy / dist;

          const wa = 1 / (a.targetR * a.targetR);
          const wb = 1 / (b.targetR * b.targetR);
          const wsum = wa + wb;

          a.targetX -= nx * push * (wa / wsum);
          a.targetY -= ny * push * (wa / wsum);

          b.targetX += nx * push * (wb / wsum);
          b.targetY += ny * push * (wb / wsum);

          a.targetX = clamp(a.targetX, layout.xMin, layout.xMax);
          b.targetX = clamp(b.targetX, layout.xMin, layout.xMax);
          a.targetY = clamp(a.targetY, layout.yMin, layout.yMax);
          b.targetY = clamp(b.targetY, layout.yMin, layout.yMax);
        }
      }
    }
  }
}
