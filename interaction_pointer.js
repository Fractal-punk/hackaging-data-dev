import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import { app, renderer, camera, scene, airTip } from "./scene_setup.js";
import { bubbles, poppedStack } from "./bubbles_factory.js";
import { spawnBurst } from "./particles_bursts.js";
import { airValueByGroup } from "./heatmap.js";
import { projectToScreen } from "./projection_overlay.js";
import { clamp } from "./utils.js";
import { view, updateCameraFrustum, resetView } from "./camera_view.js";
import { getCompaniesMode } from "./hud_controls.js";
import { setHoverBubble } from "./scene_setup.js";

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const isCoarse = matchMedia("(pointer: coarse)").matches;

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

// --- multitouch state (for mobile) ---
const touchPts = new Map(); // pointerId -> {x,y}
let pinchActive = false;
let pinchStartDist = 0;
let pinchStartZoom = 1;

// 1-finger pan state
let touchPanEnabled = false;
let touchPanStarted = false;

// tap / double-tap
let downX = 0, downY = 0;
let downTime = 0;
let moved = false;
const TAP_MOVE_PX = 10;
const TAP_TIME_MS = 320;

let lastTapTime = 0;
let lastTapX = 0;
let lastTapY = 0;
const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_PX = 18;

// desktop click candidate
let downBubble = null;
let downButton = 0;
let downOnUI = false;


function distance(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx*dx + dy*dy);
}

function isUIAtPoint(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return false;

  // HUD и trials panel — всегда UI
  if (el.closest("#hudWrap") || el.closest("#trialsPanel")) return true;

  // Внутри карточки UI только "окно", а не заголовки/текст
  // (окном считаем companies и кнопку trials)
  if (el.closest(".companies") || el.closest(".trialLink") || el.closest('[data-role="trial-link"]')) return true;

  // Ссылки тоже UI
  if (el.closest("a")) return true;

  return false;
}


function baseHWorld() {
  return 12; // важно: должно совпадать с тем, что используешь в camera/frustum и pan-логике
}

function worldToPixelsScale(rect) {
  // px per 1 world unit по вертикали
  return (rect.height * view.zoom) / baseHWorld();
}

// Более точный hit-test по экранному радиусу шара
function pickBubbleByScreenDistance(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  const pxPerWorld = worldToPixelsScale(rect);

  let best = null;
  let bestD2 = Infinity;

  for (const b of bubbles) {
    const p = projectToScreen(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z);

    const cx = rect.left + p.x;
    const cy = rect.top  + p.y;

    const dx = clientX - cx;
    const dy = clientY - cy;

    // радиус в пикселях (слегка увеличим для удобства пальцем/мышью)
    const rPx = b.targetR * pxPerWorld * 1.12;
    const r2 = rPx * rPx;

    const d2 = dx*dx + dy*dy;
    if (d2 <= r2 && d2 < bestD2) {
      best = b;
      bestD2 = d2;
    }
  }
  return best;
}

function raycastPick(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 2 - 1;
  const y = -(((clientY - rect.top) / rect.height) * 2 - 1);

  ndc.set(x, y);
  raycaster.setFromCamera(ndc, camera);

  const meshes = bubbles.map(b => b.mesh);
  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length === 0) return null;

  const hitMesh = hits[0].object;
  return bubbles.find(bb => bb.mesh === hitMesh) || null;
}

// отключаем контекстное меню
renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault(), { passive: false });

// hover off
renderer.domElement.addEventListener("pointerleave", () => {
  setHoverBubble(null);
  setTipVisible(false);
}, { passive: true });

// hover move (desktop only)
renderer.domElement.addEventListener("pointermove", (e) => {
  if (isCoarse) return;
  if (isUIAtPoint(e.clientX, e.clientY)) {
    setHoverBubble(null);
    setTipVisible(false);
    return;
  }

  // 1) raycast
  let b = raycastPick(e.clientX, e.clientY);

  // 2) fallback screen-radius (чтобы попадало на краях круга)
  if (!b) b = pickBubbleByScreenDistance(e.clientX, e.clientY);

  if (!b) {
    setHoverBubble(null);
    setTipVisible(false);
    return;
  }

  setHoverBubble(b);

  const air = airValueByGroup(b.s.group);
  const airClamped = clamp((air ?? 0), -1, 1);

  const g = b.mesh;
  const p = projectToScreen(g.position.x, g.position.y, g.position.z);

  airTip.textContent = `AIR = ${airClamped.toFixed(2)}`;
  airTip.style.left = `${p.x}px`;
  airTip.style.top  = `${p.y}px`;
  setTipVisible(true);
}, { passive: false });

// pointerdown
renderer.domElement.addEventListener("pointerdown", (e) => {
  downX = e.clientX;
  downY = e.clientY;
  downTime = performance.now();
  moved = false;

  // MOBILE (touch)
  if (isCoarse && e.pointerType === "touch") {
    renderer.domElement.setPointerCapture?.(e.pointerId);
    touchPts.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // 2 пальца => pinch
    if (touchPts.size === 2) {
      const pts = Array.from(touchPts.values());

      pinchActive = true;
      pinchStartDist = distance(pts[0], pts[1]);
      pinchStartZoom = view.zoom;

      // во время pinch НИКАКОГО pan
      touchPanEnabled = false;
      touchPanStarted = false;
      isPanning = false;
      panButton = null;

      e.preventDefault();
      return;
    }


    // 1 палец => потенциальный pan (но стартуем только после порога движения)
    pinchActive = false;
    touchPanEnabled = true;
    touchPanStarted = false;

    isPanning = true;
    panButton = 0;
    lastPanX = e.clientX;
    lastPanY = e.clientY;

    e.preventDefault();
    return;
  }

  // DESKTOP pan (middle/right/alt+left)
  if (e.button === 1 || e.button === 2 || e.altKey) {
    isPanning = true;
    panButton = e.button === 1 ? 1 : (e.button === 2 ? 2 : 0);
    lastPanX = e.clientX;
    lastPanY = e.clientY;

    if (panButton === 1) {
      middleDownTime = performance.now();
      middleMoved = false;
    }

    e.preventDefault();
    return;
  }

  // DESKTOP click candidate (left)
  if (e.button === 0) {
    downOnUI = isUIAtPoint(e.clientX, e.clientY);
    if (downOnUI) {
      downBubble = null;
      return;
    }

    let b = raycastPick(e.clientX, e.clientY);
    if (!b) b = pickBubbleByScreenDistance(e.clientX, e.clientY);
    if (!b) {
      downBubble = null;
      return;
    }

    downBubble = b;
    downButton = 0;
  }

}, { passive: false });

// pan move (window-level)
window.addEventListener("pointermove", (e) => {
  // MOBILE multitouch
  if (isCoarse && e.pointerType === "touch") {
    if (!touchPts.has(e.pointerId)) return;

    const prev = touchPts.get(e.pointerId);
    const next = { x: e.clientX, y: e.clientY };
    touchPts.set(e.pointerId, next);

    // moved threshold
    if (!moved) {
      const dx0 = e.clientX - downX;
      const dy0 = e.clientY - downY;
      if (dx0*dx0 + dy0*dy0 > TAP_MOVE_PX*TAP_MOVE_PX) moved = true;
    }

    // pinch
    if (touchPts.size === 2) {
      const pts = Array.from(touchPts.values());
      const d = distance(pts[0], pts[1]);
      if (pinchActive && pinchStartDist > 0) {
        const k = d / pinchStartDist;
        view.zoom = clamp(pinchStartZoom * k, 0.5, 3.5);
        updateCameraFrustum();
      }
      e.preventDefault();
      return;
    }

    // 1-finger pan
    if (isPanning && touchPanEnabled) {
      // стартуем пан только после порога (иначе любой тап станет паном)
      if (!touchPanStarted) {
        const dx0 = e.clientX - downX;
        const dy0 = e.clientY - downY;
        if (dx0*dx0 + dy0*dy0 > TAP_MOVE_PX*TAP_MOVE_PX) {
          touchPanStarted = true;
          isPanning = true;
        } else {
          return; // ещё считаем тапом
        }
      }

      const dx = next.x - prev.x;
      const dy = next.y - prev.y;

      const w = app.clientWidth || 1;
      const h = app.clientHeight || 1;
      const aspect = w / h;

      const baseH = baseHWorld();
      const viewH = baseH / view.zoom;
      const viewW = viewH * aspect;

      const worldDX = -dx / w * viewW;
      const worldDY =  dy / h * viewH;

      view.cx += worldDX;
      view.cy += worldDY;

      updateCameraFrustum();
      e.preventDefault();
    }
    return;
  }

  // DESKTOP pan
  if (!isPanning) return;

  const dx = e.clientX - lastPanX;
  const dy = e.clientY - lastPanY;
  lastPanX = e.clientX;
  lastPanY = e.clientY;

  if (panButton === 1 && !middleMoved) {
    const dist2m = dx * dx + dy * dy;
    if (dist2m > 4 * 4) middleMoved = true;
  }

  if (panButton === 1 && !middleMoved) return;

  const w = app.clientWidth || 1;
  const h = app.clientHeight || 1;
  const aspect = w / h;

  const baseH = baseHWorld();
  const viewH = baseH / view.zoom;
  const viewW = viewH * aspect;

  const worldDX = -dx / w * viewW;
  const worldDY =  dy / h * viewH;

  view.cx += worldDX;
  view.cy += worldDY;

  updateCameraFrustum();
}, { passive: false });

// pointerup
window.addEventListener("pointerup", (e) => {
  // MOBILE end
  if (isCoarse && e.pointerType === "touch") {
    touchPts.delete(e.pointerId);

    if (touchPts.size < 2) pinchActive = false;

    const dt = performance.now() - downTime;

    // если это был TAP (не двигали / не панорамировали)
    if (!moved && dt < TAP_TIME_MS) {
      // если тап по UI — не обрабатываем сцену
      if (!isUIAtPoint(e.clientX, e.clientY)) {
        const now = performance.now();
        const dxTap = e.clientX - lastTapX;
        const dyTap = e.clientY - lastTapY;
        const closePos = (dxTap*dxTap + dyTap*dyTap) < (DOUBLE_TAP_PX*DOUBLE_TAP_PX);
        const isDouble = (now - lastTapTime) < DOUBLE_TAP_MS && closePos;

        // bubble pick: raycast или screen-radius
        let b = raycastPick(e.clientX, e.clientY);
        if (!b) b = pickBubbleByScreenDistance(e.clientX, e.clientY);

        if (!b) {
          // тап по фону
          if (isDouble) resetView();
        } else {
          // тап по шару
          if (getCompaniesMode()) b.inEl.classList.toggle("expanded");
          else popBubble(b);
        }

        lastTapTime = now;
        lastTapX = e.clientX;
        lastTapY = e.clientY;
      }
    }

    // reset pan states
    isPanning = false;
    panButton = null;
    touchPanEnabled = false;
    touchPanStarted = false;
    return;
  }

    // DESKTOP: apply click on pointerup (only if not panning)
  if (!isCoarse && (e.button === 0 || e.button === undefined)) {
    if (!isPanning && downBubble && !downOnUI) {
      // если отпустили над UI — не считаем кликом по сцене
      if (!isUIAtPoint(e.clientX, e.clientY)) {
        if (getCompaniesMode()) downBubble.inEl.classList.toggle("expanded");
        else popBubble(downBubble);
      }
    }

    downBubble = null;
    downOnUI = false;
  }

  

  // DESKTOP middle fast click => reset
  if (panButton === 1 && e.button === 1) {
    const dtm = performance.now() - middleDownTime;
    const isFast = dtm < 250;
    if (!middleMoved && isFast) resetView();
  }

  isPanning = false;
  panButton = null;
  middleMoved = false;
}, { passive: false });

window.addEventListener("pointercancel", (e) => {
  if (e.pointerType === "touch") {
    touchPts.delete(e.pointerId);
    if (touchPts.size < 2) pinchActive = false;
  }
  isPanning = false;
  panButton = null;
  touchPanEnabled = false;
  touchPanStarted = false;
}, { passive: true });

window.addEventListener("pointerleave", () => {
  isPanning = false;
  panButton = null;
  middleMoved = false;
  touchPanEnabled = false;
  touchPanStarted = false;
}, { passive: true });
