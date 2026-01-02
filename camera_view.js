import { app, camera } from "./scene_setup.js";
import { buildYTicks } from "./y_axis_scale.js";

// -------- Панорама и зум --------
export const view = {
  zoom: 1.0,   // масштаб (1 = как раньше)
  cx: 0,       // центр по X
  cy: 0        // центр по Y
};

export function updateCameraFrustum() {
  const w = app.clientWidth || 1;
  const h = app.clientHeight || 1;
  const aspect = w / h;

  const baseH = 12;                 // базовая высота сцены
  const viewH = baseH / view.zoom;  // учитываем зум
  const viewW = viewH * aspect;

  camera.left   = view.cx - viewW / 2;
  camera.right  = view.cx + viewW / 2;
  camera.top    = view.cy + viewH / 2;
  camera.bottom = view.cy - viewH / 2;
  camera.updateProjectionMatrix();

  // камера смотрит на центр текущего view
  camera.position.set(view.cx, view.cy, 60);

  // и сразу пересчёт шкалы под новый фрустум
  buildYTicks();
}

export function resetView() {
  view.zoom = 1.0;
  view.cx = 0;
  view.cy = 0;
  updateCameraFrustum();
}
