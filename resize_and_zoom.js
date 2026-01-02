import { app, renderer } from "./scene_setup.js";
import { view, updateCameraFrustum } from "./camera_view.js";
import { clamp } from "./utils.js";

// ---------- Resize ----------
function resize() {
  const w = app.clientWidth || window.innerWidth;
  const h = app.clientHeight || window.innerHeight;

  renderer.setSize(w, h);

  // всё остальное — через единый помощник
  updateCameraFrustum();
}

window.addEventListener("resize", resize);
resize(); // стартовое вычисление

// -------- Зум колесом мыши --------
renderer.domElement.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();

    // колёсико вниз — отдаляем, вверх — приближаем
    const factor = e.deltaY > 0 ? 1.1 : 1 / 1.1;
    view.zoom = clamp(view.zoom * factor, 0.5, 3.5); // лимиты зума
    updateCameraFrustum();
  },
  { passive: false }
);
