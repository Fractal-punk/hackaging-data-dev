import { sectors as rawSectors, ARTICLES_BY_GROUP, TRIALS_BY_GROUP } from "./data_static.js";

// Готовый список секторов, который уже прошёл фильтры и получил рассчитанные поля
export const sectors = (() => {
  // 1) копия объектов, чтобы не мутировать исходные (по желанию, но лучше так)
  const list = rawSectors.map(s => ({ ...s }));

  // 2) Share by capital
  const totalCapital = list.reduce((sum, s) => sum + s.capital, 0) || 1;
  for (const s of list) {
    s.sharePct = (s.capital / totalCapital) * 100;
  }

  // 3) Удаляем сектора, для которых нет данных по статьям
  const filtered = list.filter(s => ARTICLES_BY_GROUP[s.group] !== undefined);

  // 4) Trials counts
  for (const s of filtered) {
    s.trials = TRIALS_BY_GROUP[s.group] ?? 0;
  }

  return filtered;
})();

export const MAX_TRIALS = Math.max(1, ...sectors.map(s => s.trials ?? 0));

// ---------- Heat score: articles per $M funding ----------
export const HEAT_SCORE_BY_GROUP = (() => {
  const out = Object.create(null);
  for (const s of sectors) {
    const a = ARTICLES_BY_GROUP[s.group] ?? 0;
    const cap = Math.max(1e-6, s.capital); // capital в $M
    out[s.group] = a / cap; // статей на 1 млн $
  }
  return out;
})();
