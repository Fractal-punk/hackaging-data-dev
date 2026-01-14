import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

// ---------- Scene ----------
export const app = document.getElementById("app");
export const labelsRoot = document.getElementById("labels");

// ---------- AIR tooltip element ----------
export const airTip = document.createElement("div");
airTip.id = "airTip";
labelsRoot.appendChild(airTip);

// hoverBubble как состояние с доступом извне
let _hoverBubble = null;
export function getHoverBubble() { return _hoverBubble; }
export function setHoverBubble(v) { _hoverBubble = v; }

export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(app.clientWidth, app.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);
// --- Critical for mobile pinch/zoom via Pointer Events ---
// гарантируем, что именно canvas НЕ будет отдавать жесты браузеру
renderer.domElement.style.touchAction = "none";      // важно
renderer.domElement.style.webkitTouchCallout = "none";
renderer.domElement.style.userSelect = "none";

// иногда события фактически приходят в контейнер — тоже запрещаем жесты браузера
if (app) app.style.touchAction = "none";

export const scene = new THREE.Scene();

export const camera = new THREE.OrthographicCamera(-10, 10, 6, -6, 0.1, 200);
camera.position.set(0, 0, 60);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.55));

const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
keyLight.position.set(-12, 16, 18);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -25;
keyLight.shadow.camera.right = 25;
keyLight.shadow.camera.top = 18;
keyLight.shadow.camera.bottom = -18;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.55);
rimLight.position.set(18, 8, 22);
scene.add(rimLight);


