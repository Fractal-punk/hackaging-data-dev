import { sectors } from "./metrics.js";
import { ensureTrialsLoaded, getTrialsDataByGroup, isTrialsLoaded } from "./trials_loader.js";

import { labelsRoot } from "./scene_setup.js";
import { bubbles } from "./bubbles_factory.js";

import { popBubble } from "./interaction_pointer.js";
import { getCompaniesMode } from "./hud_controls.js";





// Trials panel elements
const trialsPanel  = document.getElementById("trialsPanel");
const trialsTitle  = document.getElementById("trialsTitle");
const trialsList   = document.getElementById("trialsList");
const trialsSearch = document.getElementById("trialsSearch");
const trialsStatus = document.getElementById("trialsStatus");
const trialsClose  = document.getElementById("trialsClose");

export function closeTrialsPanel() {
  if (!trialsPanel) return;
  trialsPanel.style.display = "none";
  trialsPanel.removeAttribute("data-group");
}

function renderTrialsListForGroup(group, query) {
  if (!trialsList) return;

  const data = getTrialsDataByGroup();
  const all = (data && data[group]) || [];
  const q = (query || "").trim().toLowerCase();

  let filtered = all;
  if (q) {
    filtered = all.filter(t => {
      const title = (t.title || "").toLowerCase();
      const cond  = (t.conditions || "").toLowerCase();
      const nct   = (t.nct_id || "").toLowerCase();
      return title.includes(q) || cond.includes(q) || nct.includes(q);
    });
  }

  trialsList.innerHTML = "";

  if (filtered.length === 0) {
    trialsStatus.textContent = q
      ? "По запросу ничего не найдено."
      : "Исследований в базе не найдено.";
    return;
  }

  trialsStatus.textContent = q
    ? `${filtered.length} из ${all.length} исследований`
    : `${all.length} исследований в базе`;

  for (const t of filtered) {
    const div = document.createElement("div");
    div.className = "trialItem";

    const nct = t.nct_id || "";
    const url = nct
      ? `https://clinicaltrials.gov/study/${encodeURIComponent(nct)}`
      : null;

    div.innerHTML = `
      <div class="trialTitle">
        ${
          url
            ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${t.title || "(без названия)"}</a>`
            : (t.title || "(без названия)")
        }
      </div>
      <div class="trialMetaLine">
        ${nct ? `NCT: ${nct} • ` : ""}
        ${t.status || "status n/a"}
        ${t.phase ? ` • phase: ${t.phase}` : ""}
      </div>
      ${
        t.conditions
          ? `<div class="trialConditions">Conditions: ${t.conditions}</div>`
          : ""
      }
      ${
        t.brief_summary
          ? `<div class="trialSummary">${t.brief_summary}</div>`
          : ""
      }
    `;

    trialsList.appendChild(div);
  }
}

export function openTrialsPanelForGroup(group) {
  if (!trialsPanel) return;

  trialsPanel.dataset.group = group;

  const sec = sectors.find(s => s.group === group);
  trialsTitle.textContent = sec ? `Trials — ${sec.name}` : `Trials — ${group}`;

  if (trialsSearch) trialsSearch.value = "";
  if (trialsStatus) trialsStatus.textContent = "Загружаем данные о клинических исследованиях...";
  if (trialsList) trialsList.innerHTML = "";
  trialsPanel.style.display = "flex";

  ensureTrialsLoaded()
    .then(() => {
      const data = getTrialsDataByGroup();
      const arr = (data && data[group]) || [];

      if (!arr.length) {
        trialsStatus.textContent = "Для этого сектора исследований в базе пока нет.";
        trialsList.innerHTML = "";
        return;
      }

      renderTrialsListForGroup(group, "");

      // лёгкий фокус на поиск
      setTimeout(() => {
        try { trialsSearch?.focus(); } catch (e) {}
      }, 10);
    })
    .catch(() => {
      trialsStatus.textContent = "Не удалось загрузить clinical_trials.csv.";
      trialsList.innerHTML = "";
    });
}

// Кнопка закрытия панели
if (trialsClose) {
  trialsClose.addEventListener("click", () => closeTrialsPanel());
}

// Поиск по trials
if (trialsSearch) {
  trialsSearch.addEventListener("input", () => {
    const group = trialsPanel?.dataset.group;
    if (!group || !isTrialsLoaded()) return;
    renderTrialsListForGroup(group, trialsSearch.value);
  });
}

// Клики внутри overlay (цифры, названия, Trials и т.п.)
if (labelsRoot) {
  labelsRoot.addEventListener("click", (e) => {
    // 1) Клик по кнопке Trials — открываем панель и выходим
    const link = e.target.closest('[data-role="trial-link"]');
    if (link) {
      e.stopPropagation();
      e.preventDefault();

      const group = link.dataset.group;
      if (!group) return;

      openTrialsPanelForGroup(group);
      return;
    }

    // 2) Любой клик по карточке сектора (.inball) — либо toggle, либо pop
    const card = e.target.closest(".inball");
    if (!card) return;

    const b = bubbles.find(bb => bb.inEl === card);
    if (!b) return;

    if (getCompaniesMode()) {
      card.classList.toggle("expanded");
    } else {
      popBubble(b);
    }
  });
}
