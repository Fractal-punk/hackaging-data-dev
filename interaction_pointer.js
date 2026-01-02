import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import { app, renderer, camera, scene, airTip } from "./scene_setup.js";
import { bubbles, poppedStack } from "./bubbles_factory.js";
import { spawnBurst } from "./particles_bursts.js";
import { airValueByGroup } from "./heatmap.js";
import { projectToScreen } from "./projection_overlay.js";
import { clamp } from "./utils.js";
import { view, updateCameraFrustum, resetView } from "./camera_view.js";
import { getCompaniesMode } from "./hud_controls.js"; // <-- ВАЖНО: имя файла!
import { getHoverBubble, setHoverBubble } from "./scene_setup.js";


const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function setTipVisible(on) {
  airTip.style.display = on ? "block" : "none";
}

// ---------- Pop / remove ----------
export function popBubble(b) {
  if (!b || b.popping) return;

  b.inEl.classList.remove("expanded");

  b.popping = true;
  b.popT = 0;

  const pos = b.mesh.position.clone();
  const col = b.baseColor.clone();
  spawnBurst(pos, col, b.targetR);

  b.vx += (Math.random() - 0.5) * 0.4;
  b.vy += (Math.random() - 0.5) * 0.4;
}

export function removeBubbleAtIndex(idx) {
  const b = bubbles[idx];

  poppedStack.push({
    s: b.s,
    targetX: b.targetX,
    targetY: b.targetY,
    targetR: b.targetR,
    baseZ: b.baseZ,
    phase: b.phase,
    seed: b.seed
  });

  scene.remove(b.mesh);
  if (b.glow) scene.remove(b.glow);

  if (b.inEl && b.inEl.parentNode) b.inEl.parentNode.removeChild(b.inEl);

  if (b.mat) b.mat.dispose();
  if (b.flatMat) b.flatMat.dispose();
  if (b.glowMat) b.glowMat.dispose();

  bubbles.splice(idx, 1);
}

// ---------- Panning state ----------
let isPanning = false;
let lastPanX = 0;
let lastPanY = 0;

// Для различения "клика колёсиком" и панорамирования
let panButton = null; // 1 = средняя, 2 = правая, 0 c Alt+левая
let middleDownTime = 0;
let middleMoved = false;

// отключаем контекстное меню, чтобы правая кнопка не мешала
renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());

// hover off
renderer.domElement.addEventListener("pointerleave", () => {
 // hoverBubble = null;
  setTipVisible(false);
});

// hover move
renderer.domElement.addEventListener("pointermove", (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

  ndc.set(x, y);
  raycaster.setFromCamera(ndc, camera);

  const meshes = bubbles.map(b => b.mesh);
  const hits = raycaster.intersectObjects(meshes, false);

  if (hits.length === 0) {
  setHoverBubble(null);
  setTipVisible(false);
  return;
  }

  const hitMesh = hits[0].object;
  const b = bubbles.find(bb => bb.mesh === hitMesh);
  if (!b) {
  setHoverBubble(null);
  setTipVisible(false);
  return;
  }

  setHoverBubble(b);

  const air = airValueByGroup(b.s.group);
  const airClamped = clamp((air ?? 0), -1, 1);

  // позиция: над кругом
  const g = b.mesh;
  const p = projectToScreen(g.position.x, g.position.y, g.position.z);

  airTip.textContent = `AIR = ${airClamped.toFixed(2)}`;
  airTip.style.left = `${p.x}px`;
  airTip.style.top  = `${p.y}px`;

  setTipVisible(true);
});

// pointerdown
renderer.domElement.addEventListener("pointerdown", (e) => {
  // Панорамирование: правая или средняя кнопка, либо Alt+левая
  if (e.button === 1 || e.button === 2 || e.altKey) {
    isPanning = true;
    panButton = e.button === 1 ? 1 : (e.button === 2 ? 2 : 0);
    lastPanX = e.clientX;
    lastPanY = e.clientY;

    // если это именно средняя кнопка — начинаем отслеживать "быстрый клик"
    if (panButton === 1) {
      middleDownTime = performance.now();
      middleMoved = false;
    }

    e.preventDefault();
    return;
  }

  // Обычный клик по шару (левая кнопка без Alt)
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

  ndc.set(x, y);
  raycaster.setFromCamera(ndc, camera);

  const meshes = bubbles.map(b => b.mesh);
  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length === 0) return;

  const hitMesh = hits[0].object;
  const b = bubbles.find(bb => bb.mesh === hitMesh);
  if (!b) return;

  if (getCompaniesMode()) {
    b.inEl.classList.toggle("expanded");
  } else {
    popBubble(b);
  }
});

// pan move (window-level)
window.addEventListener("pointermove", (e) => {
  if (!isPanning) return;

  const dx = e.clientX - lastPanX;
  const dy = e.clientY - lastPanY;
  lastPanX = e.clientX;
  lastPanY = e.clientY;

  // если это средняя кнопка — отслеживаем, был ли заметный сдвиг
  if (panButton === 1 && !middleMoved) {
    const dist2 = dx * dx + dy * dy;
    if (dist2 > 4 * 4) middleMoved = true;
  }

  // панорамирование выполняем всегда, кроме случая "клик без движения"
  if (panButton === 1 && !middleMoved) return;

  const w = app.clientWidth || 1;
  const h = app.clientHeight || 1;
  const aspect = w / h;

  const baseH = 12;
  const viewH = baseH / view.zoom;
  const viewW = viewH * aspect;

  // dx,dy (пиксели) -> смещение в координатах сцены
  const worldDX = -dx / w * viewW;
  const worldDY =  dy / h * viewH;

  view.cx += worldDX;
  view.cy += worldDY;

  updateCameraFrustum();
});

// pointerup
window.addEventListener("pointerup", (e) => {
  // если отпускали именно среднюю кнопку, проверяем "быстрый клик"
  if (panButton === 1 && e.button === 1) {
    const dt = performance.now() - middleDownTime;
    const isFast = dt < 250;

    if (!middleMoved && isFast) {
      resetView();
    }
  }

  isPanning = false;
  panButton = null;
  middleMoved = false;
});

window.addEventListener("pointerleave", () => {
  isPanning = false;
  panButton = null;
  middleMoved = false;
});
