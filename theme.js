import { wall, floor } from "./scene_setup.js";
import { bubbles } from "./bubbles_factory.js";

let strictTheme = false;

export function isStrictTheme() {
  return strictTheme;
}

export function setStrictTheme(on) {
  strictTheme = !!on;
  applyTheme();
}

export function toggleTheme() {
  strictTheme = !strictTheme;
  applyTheme();
}

export function applyTheme() {
  document.body.classList.toggle("strict", strictTheme);

  const btnToggleTheme = document.getElementById("toggleTheme");
  if (btnToggleTheme) {
    // у тебя текст был пустой — оставляю так же (можешь потом дописать)
    btnToggleTheme.textContent = `Тема ${strictTheme ? "" : ""}`;
  }

  // --- 3D "стена" и "пол" под тему ---
  if (strictTheme) {
    // белая стена
    wall.material.color.set(0xffffff);
    wall.material.roughness = 1.0;
    wall.material.metalness = 0.0;
    wall.material.transparent = false;
    wall.material.opacity = 1.0;

    // светлый пол (еле заметный)
    floor.material.color.set(0xffffff);
    floor.material.transparent = true;
    floor.material.opacity = 0.10;
    floor.material.roughness = 1.0;
    floor.material.metalness = 0.0;
  } else {
    // обратно к тёмной сцене
    wall.material.color.set(0x0b1020);
    wall.material.roughness = 1.0;
    wall.material.metalness = 0.0;
    wall.material.transparent = false;
    wall.material.opacity = 1.0;

    floor.material.color.set(0x070a10);
    floor.material.transparent = true;
    floor.material.opacity = 0.35;
    floor.material.roughness = 1.0;
    floor.material.metalness = 0.0;
  }

  wall.material.needsUpdate = true;
  floor.material.needsUpdate = true;

  for (const b of bubbles) {
    // форма свечения: круг/квадрат
    if (b.glowMat?.uniforms?.uSquare) {
      b.glowMat.uniforms.uSquare.value = strictTheme ? 1.0 : 0.0;
    }

    // синхронизируем цвет heatmap
    if (b.flatMat) b.flatMat.color.copy(b.baseColor);
    if (b.mat?.uniforms?.uBaseColor) {
      b.mat.uniforms.uBaseColor.value.set(b.baseColor.r, b.baseColor.g, b.baseColor.b);
    }

    if (strictTheme) {
      b.mesh.material = b.flatMat;
      b.flatMat.transparent = true;
      b.flatMat.opacity = 0.95;
      b.flatMat.needsUpdate = true;
    } else {
      b.mesh.material = b.mat;
      if (b.mat?.uniforms?.uOpacity) {
        b.mat.uniforms.uOpacity.value = 0.98;
      }
      b.mat.needsUpdate = true;
    }
  }
}
