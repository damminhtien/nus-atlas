#!/usr/bin/env node

/** Keep DSA5101 visual labs close to the worked solution path. */
const { loadCanonicalState } = require("./validate-content");

const CONTRACTS = {
  "dsa5101-frequent-itemsets": {
    type: "deep-dive",
    exercises: ["support", "confidence", "interest", "candidate-guarantee"],
    required: ["\\\\operatorname{conf}", "\\\\operatorname{supp}"]
  },
  "dsa5101-minhash-lsh": {
    type: "derivation-trace",
    minSteps: 8,
    required: ["0.6^4", "0.2^4", "2520"]
  },
  "dsa5101-ranking-streams": {
    type: "deep-dive",
    exercises: ["target", "assignment-prompts", "method-boundary"],
    required: ["2^R", "PageRank", "DGIM", "FM"]
  },
  "dsa5101-clustering": {
    type: "deep-dive",
    exercises: ["hierarchical", "kmeans", "bfr", "cure", "evaluation"],
    required: ["769}{7}", "Mahalanobis", "0.75"]
  },
  "dsa5101-recommenders": {
    type: "deep-dive",
    exercises: ["user-based", "latent-factor", "model-boundary"],
    required: ["8.25", "13.25", "a=1", "b=3", "c=2"]
  },
  "dsa5101-pagerank": {
    type: "deep-dive",
    exercises: ["power-iteration", "teleport", "matrix-boundary"],
    required: ["r_2", "27}{20", "row-stochastic"]
  },
  "dsa5101-streams": {
    type: "deep-dive",
    exercises: ["dgim", "frequency-moments", "ams"],
    required: ["128", "385", "55"]
  },
  "dsa5101-balance": {
    type: "deep-dive",
    exercises: ["four-sequences", "tie-counterexample", "budget-update"],
    required: ["xyyy", "min(2,3)", "TiePaths"]
  }
};

function hasFormula(value) {
  return typeof value === "string" && /\$[^$]+\$|\\\([^)]*\\\)/.test(value);
}

function validateDsa5101VisualLabs() {
  const state = loadCanonicalState();
  const errors = [];

  for (const [labId, contract] of Object.entries(CONTRACTS)) {
    const lab = state.labs[labId];
    if (!lab) {
      errors.push(labId + ": missing canonical lab");
      continue;
    }
    if (lab.type !== contract.type) errors.push(labId + ": expected type=" + contract.type + ", got " + lab.type);

    const payload = JSON.stringify(lab);
    for (const marker of contract.required) {
      if (!payload.includes(marker)) errors.push(labId + ": missing solution checkpoint " + marker);
    }

    if (contract.exercises) {
      const exercises = Array.isArray(lab.exercises) ? lab.exercises : [];
      const exerciseIds = exercises.map(exercise => exercise && exercise.id);
      for (const exerciseId of contract.exercises) {
        if (!exerciseIds.includes(exerciseId)) errors.push(labId + ": missing exercise " + exerciseId);
      }
      for (const exercise of exercises) {
        if (!exercise || !exercise.id) {
          errors.push(labId + ": exercise is missing id");
          continue;
        }
        if (!exercise.prompt || !exercise.takeaway) errors.push(labId + "/" + exercise.id + ": prompt and takeaway are required");
        const steps = Array.isArray(exercise.steps) ? exercise.steps : [];
        if (steps.length < 4) errors.push(labId + "/" + exercise.id + ": expected at least four worked steps");
        steps.forEach((step, index) => {
          if (!Array.isArray(step) || step.length < 3) errors.push(labId + "/" + exercise.id + "/steps[" + index + "]: expected label, formula, explanation");
          else if (!hasFormula(step[1])) errors.push(labId + "/" + exercise.id + "/steps[" + index + "]: value must include an explicit formula");
          else if (!step[2]) errors.push(labId + "/" + exercise.id + "/steps[" + index + "]: explanation is required");
        });
      }
    } else {
      const steps = Array.isArray(lab.steps) ? lab.steps : [];
      if (steps.length < contract.minSteps) errors.push(labId + ": expected at least " + contract.minSteps + " worked steps");
      steps.forEach((step, index) => {
        if (!Array.isArray(step) || step.length < 3) errors.push(labId + "/steps[" + index + "]: expected label, formula, explanation");
        else if (!hasFormula(step[1])) errors.push(labId + "/steps[" + index + "]: value must include an explicit formula");
        else if (!step[2]) errors.push(labId + "/steps[" + index + "]: explanation is required");
      });
    }
  }

  return { ok: errors.length === 0, errors, count: Object.keys(CONTRACTS).length };
}

if (require.main === module) {
  const result = validateDsa5101VisualLabs();
  if (!result.ok) {
    console.error("DSA5101 VISUAL LAB CONTRACT FAILED · " + result.errors.length + " issue(s)");
    result.errors.forEach(error => console.error("- " + error));
    process.exitCode = 1;
  } else {
    console.log("DSA5101 VISUAL LABS GREEN · " + result.count + " solution-complete labs");
  }
}

module.exports = { validateDsa5101VisualLabs };
