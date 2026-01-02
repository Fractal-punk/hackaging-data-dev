import { sectors } from "./metrics.js";
import { clamp, lerp } from "./utils.js";

// ---------- Layout ----------
export const layout = {
  xMin: -8.5, xMax:  8.5,
  yMin: -4.6, yMax:  4.6,
  zBase: 0, zJitter: 2.0
};

// доля сектора -> координата Y
export function shareToY(sharePct) {
  const maxShare = Math.max(...sectors.map(s => s.sharePct));
  const safeMax = Math.max(1e-6, maxShare);

  const t0 = clamp(sharePct / safeMax, 0, 1);
  const t = Math.pow(t0, 0.70);

  return lerp(layout.yMin, layout.yMax, t);
}

const caps = sectors.map(s => s.capital);
const capMin = Math.min(...caps);
const capMax = Math.max(...caps);

const R_SCALE = 1.20;

export function capTo01(cap) {
  return clamp((cap - capMin) / Math.max(1e-6, (capMax - capMin)), 0, 1);
}

export function shareToBaseRadius(sharePct) {
  const maxPct = Math.max(...sectors.map(s => s.sharePct));
  const t0 = clamp(sharePct / Math.max(1e-6, maxPct), 0, 1);
  const t = Math.pow(t0, 0.70);
  const r = lerp(0.55, 1.85, t);
  return r * R_SCALE;
}
