// data_static.js

// ---------- Data ----------
export const sectors = [
  { id: "stem cells",   group: "stem_cells",   name: "stem cells",   capital: 2985.4, ret: 29.20 },
  { id: "autophagy",    group: "autophagy",    name: "autophagy",    capital: 1344.1, ret: 13.14 },
  { id: "mitochondria", group: "mitochondria", name: "mitochondria", capital: 1182.2, ret: 11.56 },
  { id: "metabolism",   group: "metabolism",   name: "metabolism",   capital: 1297.5, ret: 12.69 },
  { id: "proteostasis", group: "proteostasis", name: "proteostasis", capital: 719.4,  ret: 7.04 },
  { id: "epigenetic",   group: "epigenetic",   name: "epigenetic",   capital: 764.4,  ret: 7.48 },
  { id: "senescence",   group: "senescence",   name: "senescence",   capital: 578.6,  ret: 5.66 },
  { id: "genomic",      group: "genomic",      name: "genomic",      capital: 97.4,   ret: 0.95 },
  { id: "inflammation", group: "inflammation", name: "inflammation", capital: 205.9,  ret: 2.01 },
  { id: "telomeres",    group: "telomeres",    name: "telomeres",    capital: 25.3,   ret: 0.25 },
  { id: "reprogramming",group: "reprogramming",name: "reprogramming",capital: 6.3,    ret: 0.06 }
];

// ---------- Articles data (NEW) ----------
export const ARTICLES_BY_GROUP = {
  senescence:    9435,
  metabolism:    7540,
  epigenetic:     279,
  clocks:           0,
  stem_cells:    2027,
  reprogramming:  132,
  inflammation:  2269,
  mitochondria:  1815,
  proteostasis:   193,
  telomeres:     1091,
  autophagy:     1210,
  microbiome:     960,
  genomic:       1930
};

// ---------- Trials data (NEW) ----------
export const TRIALS_BY_GROUP = {
  metabolism:    239,
  inflammation:  108,
  stem_cells:     88,
  mitochondria:   52,
  epigenetic:     50,
  senescence:    139,
  telomeres:      17,
  genomic:        13,
  autophagy:      12,
  proteostasis:    7,
  reprogramming:   2
};

// ---------- Trials full data from CSV (clinical_trials.csv) ----------
export const CATEGORY_TO_GROUP = {
  "autophagy":            "autophagy",
  "cell reprogramming":   "reprogramming",
  "cell senescence":      "senescence",
  "clocks":               "clocks",
  "epigenetic":           "epigenetic",
  "extracellular matrix": "ECM",
  "genomic":              "genomic",
  "inflammation":         "inflammation",
  "metabolism":           "metabolism",
  "microbiome":           "microbiome",
  "mitochondria":         "mitochondria",
  "proteostasis":         "proteostasis",
  "stem cells":           "stem_cells",
  "telomeres":            "telomeres"
};
