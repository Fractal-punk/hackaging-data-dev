
import { bubbles } from "./bubbles_factory.js";
import { view } from "./camera_view.js";

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
    btnToggleTheme.textContent = `Тема ${strictTheme ? "" : ""}`;
  }

  // --- 3D "стена" и "пол" под тему ---
 
  for (const b of bubbles) {
    if (b.glowMat?.uniforms?.uSquare) {
      b.glowMat.uniforms.uSquare.value = strictTheme ? 1.0 : 0.0;
    }

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
      if (b.mat?.uniforms?.uOpacity) b.mat.uniforms.uOpacity.value = 0.98;
      b.mat.needsUpdate = true;
    }
  }

}


