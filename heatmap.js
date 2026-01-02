import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { clamp, lerp, smoothstep, contrastColor } from "./utils.js";
import { HEAT_SCORE_BY_GROUP } from "./metrics.js";

export function airValueByGroup(group) {
  const score = HEAT_SCORE_BY_GROUP[group];
  if (score === undefined) return null;

  // score = articles / $M, положительное
  if (score <= 0) return -1;

  const scores = Object.values(HEAT_SCORE_BY_GROUP).filter(v => v > 0);
  const minS = Math.min(...scores);
  const maxS = Math.max(...scores);

  if (!(maxS > minS)) return 0;

  // log-нормировка в [0..1]
  const t01 = clamp(
    (Math.log(score) - Math.log(minS)) / (Math.log(maxS) - Math.log(minS)),
    0, 1
  );

  // перевод в [-1..1]
  return t01 * 2 - 1;
}

export function heatColorByGroup(group, cap01) {
  const air = airValueByGroup(group);
  if (air === null) return new THREE.Color("#B0B6C5");

  // air: [-1..1]
  const a = clamp(air, -1, 1);

  // три опорных цвета: зелёный — серебро — красный
  const cold = new THREE.Color(0x00ff00);  // -1
  const mid  = new THREE.Color(0xe8edf2);  //  0
  const hot  = new THREE.Color(0xff0000);  // +1

  let c;
  if (a < 0) {
    // [-1..0] -> t in [0..1]
    const t = a + 1;            // -1 -> 0, 0 -> 1
    c = cold.clone().lerp(mid, t);
  } else {
    // [0..1] -> t in [0..1]
    const t = a;                // 0 -> 0, 1 -> 1
    c = mid.clone().lerp(hot, t);
  }

  // небольшая "страховка" по читаемости
  const bright = lerp(0.92, 1.10, smoothstep(cap01));
  c.multiplyScalar(bright);

  return contrastColor(c, 1.18);
}
