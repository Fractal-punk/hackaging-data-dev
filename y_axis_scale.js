import { camera } from "./scene_setup.js";
import { sectors } from "./metrics.js";
import { shareToY } from "./layout.js";

// ---------- Y axis ticks ----------
const scaleEl = document.getElementById("scale");

export function buildYTicks() {
  if (!scaleEl) return;
  scaleEl.innerHTML = "";

  if (!sectors.length) return;

  const maxShare = Math.max(...sectors.map(s => s.sharePct));
  if (!(maxShare > 0)) return;

  // базовые “доли” от максимума, чтобы получить несколько уровней ниже
  const baseFractions = [1.0, 0.75, 0.50, 0.30, 0.20, 0.10, 0.05, 0.01];

  const ticks = [];

  // 1) обязательно добавляем сам maxShare как верхнюю метку
  ticks.push({
    share: maxShare,
    label: `${maxShare.toFixed(1)}%`
  });

  // 2) добавляем остальные метки ниже максимума
  for (const f of baseFractions) {
    const v = maxShare * f;
    if (v <= 0) continue;
    if (v >= maxShare * 0.99) continue; // не дублировать максимум
    ticks.push({
      share: v,
      label: `${v.toFixed(1)}%`
    });
  }

  // сортировка сверху вниз
  ticks.sort((a, b) => b.share - a.share);

  const h =
    scaleEl.getBoundingClientRect().height ||
    (window.innerHeight - 26 - 26 - 24);

  for (const t of ticks) {
    // мир: доля → Y через ту же функцию, что и для шаров
    const yWorld = shareToY(t.share);

    // переводим в относительную позицию в текущем фрустуме камеры
    const y01 = (yWorld - camera.bottom) / (camera.top - camera.bottom);

    // если метка вообще не попадает в текущий кадр — пропускаем
    if (y01 < 0 || y01 > 1) continue;

    const yPx = (1 - y01) * h;

    const tick = document.createElement("div");
    tick.className = "tick";
    tick.style.top = `${24 + yPx}px`;

    const lbl = document.createElement("div");
    lbl.className = "ticklabel";
    lbl.style.top = `${24 + yPx}px`;
    lbl.textContent = t.label;

    scaleEl.appendChild(tick);
    scaleEl.appendChild(lbl);
  }
}
