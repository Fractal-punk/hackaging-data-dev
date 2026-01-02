import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import { scene, labelsRoot } from "./scene_setup.js";
import { anchors, resolve2DOverlaps } from "./anchors_and_targets.js";
import { shareToBaseRadius, capTo01, shareToY } from "./layout.js";
import { heatColorByGroup } from "./heatmap.js";
import { buildJuliaBubble } from "./materials_julia.js";
import { buildGlow } from "./materials_glow.js";
import { clamp } from "./utils.js";

import { sectors, MAX_TRIALS, HEAT_SCORE_BY_GROUP } from "./metrics.js";
import { ARTICLES_BY_GROUP } from "./data_static.js";
import { COMPANIES_BY_GROUP } from "./companies_data.js";

// ---------- Create bubbles ----------
export const bubbles = [];
export const poppedStack = [];

export function createBubble(s, preset = null) {
  const a = anchors.get(s.id);

  const r = shareToBaseRadius(s.sharePct);
  const cap01 = capTo01(s.capital);
  const col = heatColorByGroup(s.group, cap01);

  const targetX = preset?.targetX ?? a.ax;
  const targetY = preset?.targetY ?? shareToY(s.sharePct);
  const baseZ   = preset?.baseZ   ?? a.az;
  const phase   = preset?.phase   ?? (Math.random() * Math.PI * 2);
  const seed    = preset?.seed    ?? Math.random();

  const bubble = buildJuliaBubble(col, preset?.targetR ?? r, seed);
  const mesh = bubble.mesh;

  // trials glow (halo)
  const glow = buildGlow(col);
  const glowMesh = glow.mesh;
  glowMesh.renderOrder = 0;
  mesh.renderOrder = 1;      // шар рисуем поверх свечения
  glowMesh.frustumCulled = false;

  // ставим "за" шаром чуть ближе к стене
  glowMesh.position.set(targetX, targetY, baseZ - 0.02);
  scene.add(glowMesh);

  // сила свечения = trials / MAX
  const trials = s.trials ?? 0;
  const trials01 = clamp(trials / MAX_TRIALS, 0, 1);
  glow.mat.uniforms.uStrength.value = trials01;

  const flatMat = new THREE.MeshBasicMaterial({
    color: col.clone(),
    transparent: true,
    opacity: 0.95,
    depthWrite: false
  });

  // синхраним базовый цвет в шейдер
  if (bubble.mat?.uniforms?.uBaseColor?.value) {
    bubble.mat.uniforms.uBaseColor.value.set(col.r, col.g, col.b);
  }

  mesh.position.set(targetX, targetY, baseZ);
  scene.add(mesh);

  // цифры внутри + список компаний
  const inEl = document.createElement("div");
  const articles = ARTICLES_BY_GROUP[s.group] ?? 0;
  const score = HEAT_SCORE_BY_GROUP[s.group] ?? 0;

  inEl.className = "inball";

  const companies = (COMPANIES_BY_GROUP[s.group] || []);
  const companiesHtml = companies.length
    ? `<ul>${companies.map(n => `<li>${n}</li>`).join("")}</ul>`
    : `<div style="opacity:0.85;font-weight:700;">(нет списка компаний)</div>`;

  inEl.innerHTML = `
    <div class="name">${s.name}</div>
    <div class="meta">$${s.capital.toFixed(1)}M</div>
    <div class="ret">${s.sharePct.toFixed(1)}%</div>

    <div class="companies" data-role="companies">
      <div class="title">
        <span>Companies (${companies.length})</span>
        <span style="opacity:0.75;font-weight:900;">▲</span>
      </div>

      <div class="trialRow">
        <button
          type="button"
          class="trialLink"
          data-role="trial-link"
          data-group="${s.group}"
        >
          Trials: <span class="trialCount">${trials}</span>
        </button>
        <div class="trialHint">Клик — список клинических исследований</div>
      </div>

      <div style="
        font-size:11px;
        font-weight:800;
        opacity:0.9;
        margin-bottom:6px;
        line-height:1.35;
      ">
        <div>Articles: ${articles}</div>
        <div>Articles / $M: ${score.toFixed(3)}</div>
      </div>

      <div style="height:1px;background:rgba(255,255,255,0.12);margin:6px 0 6px;"></div>

      ${companiesHtml}
    </div>
  `;

  labelsRoot.appendChild(inEl);

  return {
    s,
    mesh,
    mat: bubble.mat,
    flatMat,
    baseColor: col.clone(),
    glow: glowMesh,
    glowMat: glow.mat,
    trials,
    trials01,
    inEl,
    targetX,
    targetY,
    targetR: preset?.targetR ?? r,
    baseZ,
    vx: 0, vy: 0,
    phase,
    seed,
    popping: false,
    popT: 0,
    popDur: 0.22
  };
}

// первичное создание + стартовая разводка
export function initBubbles() {
  bubbles.length = 0;

  for (const s of sectors) {
    bubbles.push(createBubble(s));
  }

  resolve2DOverlaps(bubbles, 3);
  for (const b of bubbles) {
    b.mesh.position.x = b.targetX;
    b.mesh.position.y = b.targetY;
  }
}
