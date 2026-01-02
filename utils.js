// utils.js
export function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function smoothstep(t) { return t * t * (3 - 2 * t); }
export function easeOutCubic(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }

export function contrastColor(c, factor) {
  const out = c.clone();
  out.r = clamp((out.r - 0.5) * factor + 0.5, 0, 1);
  out.g = clamp((out.g - 0.5) * factor + 0.5, 0, 1);
  out.b = clamp((out.b - 0.5) * factor + 0.5, 0, 1);
  return out;
}
