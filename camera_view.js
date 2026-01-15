import { app, camera } from "./scene_setup.js";
import { buildYTicks } from "./y_axis_scale.js";

// -------- Панорама и зум --------
export const view = {
  zoom: 1.0,
  cx: 0,
  cy: 0
};

// размеры геометрий (должны совпадать с тем, что ты создаёшь в scene_setup.js)
const WALL_W = 60;
const WALL_H = 34;

// “запас” чтобы края не появлялись при пан/зуме
const BG_PAD = 1.35;

export function updateCameraFrustum() {
  const w = app.clientWidth || 1;
  const h = app.clientHeight || 1;
  const aspect = w / h;

  const baseH = 12;
  const viewH = baseH / view.zoom;
  const viewW = viewH * aspect;

  camera.left   = view.cx - viewW / 2;
  camera.right  = view.cx + viewW / 2;
  camera.top    = view.cy + viewH / 2;
  camera.bottom = view.cy - viewH / 2;
  camera.updateProjectionMatrix();
  updateInballScale();

  camera.position.set(view.cx, view.cy, 60);

  buildYTicks();
}

export function resetView() {
  view.zoom = 1.0;
  view.cx = 0;
  view.cy = 0;
  updateCameraFrustum();
}

function updateInballScale() {
  // масштабируем только на мобилке
  if (!matchMedia("(pointer: coarse)").matches) return;

  // ограничим масштаб, чтобы не уехало
  const k = Math.min(1.6, Math.max(0.85, view.zoom));

  document.documentElement.style.setProperty(
    "--inball-scale",
    k.toFixed(3)
  );
}
