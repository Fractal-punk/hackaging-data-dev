import { CATEGORY_TO_GROUP } from "./data_static.js";

export let TRIALS_DATA_BY_GROUP = {};
export let trialsLoaded = false;
export let trialsLoadError = null;

let trialsLoadPromise = null;

export function ensureTrialsLoaded() {
  if (trialsLoadPromise) return trialsLoadPromise;

  trialsLoadPromise = (async () => {
    try {
      const resp = await fetch("https://raw.githubusercontent.com/Fractal-punk/hackaging-data/main/clinical_trials.csv");
      if (!resp.ok) throw new Error("HTTP " + resp.status);

      const text = await resp.text();

      if (typeof Papa === "undefined") {
        console.warn("PapaParse не подключён — не могу распарсить clinical_trials.csv");
        throw new Error("PapaParse missing");
      }

      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true
      });

      const rows = parsed.data || [];
      const map = Object.create(null);

      for (const row of rows) {
        const catRaw = (row.Category || "").trim();
        const group = CATEGORY_TO_GROUP[catRaw];
        if (!group) continue;

        if (!map[group]) map[group] = [];

        map[group].push({
          nct_id:        (row.nct_id || "").trim(),
          title:         (row.title || "").trim(),
          status:        (row.status || "").trim(),
          phase:         (row.phase || "").trim(),
          brief_summary: (row.brief_summary || "").trim(),
          conditions:    (row.conditions || "").trim(),
          query:         (row.Query || "").trim()
        });
      }

      TRIALS_DATA_BY_GROUP = map;
      trialsLoaded = true;
      trialsLoadError = null;
    } catch (err) {
      console.error("Trials load error:", err);
      trialsLoaded = false;
      trialsLoadError = err;
      throw err;
    }
  })();

  return trialsLoadPromise;
}


export function getTrialsDataByGroup() {
  return TRIALS_DATA_BY_GROUP;
}

export function isTrialsLoaded() {
  return trialsLoaded;
}
