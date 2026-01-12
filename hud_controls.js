import { bubbles, poppedStack, createBubble } from "./bubbles_factory.js";
import { resolve2DOverlaps } from "./anchors_and_targets.js";
import { applyTheme, toggleTheme, isStrictTheme } from "./theme.js";

// ЕДИНЫЙ режим для всех: pointer + overlay-click
let companiesMode = true;
export function getCompaniesMode() { return companiesMode; }
export function setCompaniesMode(v) { companiesMode = !!v; }

const isCoarse = matchMedia("(pointer: coarse)").matches;
let hudCollapsed = isCoarse;


function applyHudState(hud, btnToggleHud) {
  hud.classList.toggle("collapsed", hudCollapsed);
  btnToggleHud.textContent = hudCollapsed ? "≡" : "—";
  btnToggleHud.setAttribute(
    "aria-label",
    hudCollapsed ? "Развернуть панель" : "Свернуть панель"
  );
}

function applyCompaniesModeUI(btnToggleCompanies) {
  btnToggleCompanies.textContent =
    `Отображение подробностей: ${companiesMode ? "вкл" : "выкл"}`;
}

function restoreLastPopped() {
  if (poppedStack.length === 0) return;

  const snap = poppedStack.pop();
  const restored = createBubble(snap.s, snap);

  restored.vx = 0;
  restored.vy = 0;

  // добавляем в систему
  bubbles.push(restored);
  resolve2DOverlaps(bubbles, 2);

  // применяем текущую тему “как есть” (она решает: круг/квадрат, материал, opacity и т.д.)
  applyTheme();

  // если мы в режиме “выкл”, то не оставляем раскрытых карточек
  if (!companiesMode) restored.inEl?.classList.remove("expanded");
}

export function initHudControls() {
  const hud = document.getElementById("hud");
  const btnToggleHud = document.getElementById("toggleHud");
  const btnToggleCompanies = document.getElementById("toggleCompanies");
  const btnToggleTheme = document.getElementById("toggleTheme");
  const btnUndoPop = document.getElementById("undoPop");

  if (btnUndoPop) {
    btnUndoPop.addEventListener("click", restoreLastPopped);
  }

  if (hud && btnToggleHud) {
    btnToggleHud.addEventListener("click", () => {
      hudCollapsed = !hudCollapsed;
      applyHudState(hud, btnToggleHud);
    });
    applyHudState(hud, btnToggleHud);
  }

  if (btnToggleCompanies) {
    applyCompaniesModeUI(btnToggleCompanies);

    btnToggleCompanies.addEventListener("click", () => {
      companiesMode = !companiesMode;
      applyCompaniesModeUI(btnToggleCompanies);

      if (!companiesMode) {
        for (const b of bubbles) b.inEl?.classList.remove("expanded");
      }
    });
  }

  if (btnToggleTheme) {
    btnToggleTheme.addEventListener("click", () => toggleTheme());
  }

  // тема при старте — один раз
  applyTheme();
}
