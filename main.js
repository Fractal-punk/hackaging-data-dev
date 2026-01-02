import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import {
  app, labelsRoot, airTip, renderer, scene, camera, wall, floor,
  getHoverBubble, setHoverBubble
} from "./scene_setup.js";

import { view, updateCameraFrustum, resetView } from "./camera_view.js";

// ВАЖНО: sectors берём только из metrics.js
import { sectors, MAX_TRIALS, HEAT_SCORE_BY_GROUP } from "./metrics.js";

import { airValueByGroup, heatColorByGroup } from "./heatmap.js";
import { anchors, resolve2DOverlaps } from "./anchors_and_targets.js";
import { coll, resolveRuntimeCollisions } from "./collisions_runtime.js";

import { buildJuliaBubble } from "./materials_julia.js";
import { buildGlow } from "./materials_glow.js";

import { spawnBurst, updateBursts } from "./particles_bursts.js";
import { bubbles, poppedStack, createBubble, initBubbles } from "./bubbles_factory.js";

import { projectToScreen, updateOverlay } from "./projection_overlay.js";
import { buildYTicks } from "./y_axis_scale.js";

import "./resize_and_zoom.js";
import "./interaction_pointer.js";
import "./animation_loop.js";
import "./ui_trials_panel.js";

import { applyTheme, toggleTheme } from "./theme.js";
import { initHudControls } from "./hud_controls.js";

// --- init только после всех imports ---
initBubbles();
initHudControls();
