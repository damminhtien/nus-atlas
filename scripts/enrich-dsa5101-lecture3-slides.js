#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const extractionPath = path.join(ROOT, 'data/extracted/DSA5101/lec3_clustering.json');
const outputPath = path.join(ROOT, 'content/courses/DSA5101/slides/dsa5101-lecture3.json');
const sourceId = 'DSA5101/Lec3 - Clustering.pdf';

const data = JSON.parse(fs.readFileSync(extractionPath, 'utf8'));

function sectionFor(page) {
  if (page <= 2) return 'clustering scope and motivation';
  if (page <= 13) return 'applications, similarity, and recommender systems';
  if (page <= 31) return 'hierarchical clustering';
  if (page <= 58) return 'K-means and initialization';
  if (page <= 75) return 'BFR for out-of-core clustering';
  if (page <= 85) return 'CURE representatives';
  return 'evaluating clusters';
}

function titleFor(page, text, section) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const useful = lines.find((line) => {
    if (/^\d+$/.test(line)) return false;
    if (/^DSA\s*5101/i.test(line)) return false;
    if (/^Introduction to|^Big Data for|^Industry$/i.test(line)) return false;
    return line.length >= 4;
  });
  if (useful) return useful.replace(/\s+/g, ' ').slice(0, 120);
  return `${section[0].toUpperCase()}${section.slice(1)} · slide ${page}`;
}

function studyLayer(page, text, section) {
  const lower = text.toLowerCase();
  if (section === 'hierarchical clustering') {
    return {
      type: 'compare',
      prompt: 'Which merge, linkage, representative, or stopping decision is being made on this page, and what geometry does it assume?',
      answer: 'State the linkage or representative rule shown, then explain how it changes which points or clusters are considered close.',
      hint: 'Look for single-link, complete-link, average-link, clustroid, cohesion, or a stopping rule.',
      whatYouSee: 'The page develops a hierarchy by repeatedly comparing clusters or by defining a rule for when the hierarchy should stop.',
      whyItMatters: 'Hierarchical clustering exposes the choice of geometry and stopping criterion instead of hiding both inside one final partition.',
      intuition: 'A merge is a commitment: the chosen notion of closeness says which shape of cluster the method is prepared to preserve.',
      technicalDetail: `Read the linkage, representative, or cohesion definition on lecture page ${page}; it determines the next merge or cut of the dendrogram.`,
      pitfall: 'Do not treat every linkage rule as equivalent: single-link can bridge chains, while complete-link penalises far-apart members.',
      connection: 'This is the hand-worked clustering decision that Assignment 1 asks you to calculate on pages 6–8.'
    };
  }
  if (section === 'K-means and initialization') {
    return {
      type: lower.includes('loss') || lower.includes('objective') ? 'derive' : 'apply',
      prompt: 'What K-means state, update, or objective is shown here, and why does that update reduce the stated loss?',
      answer: 'K-means alternates assigning each point to its closest representative and recomputing representatives; each step does not increase the within-cluster squared-error objective, but the final solution can be only locally optimal.',
      hint: 'Separate assignment, representative recomputation, initialization, convergence, and model-selection choices.',
      whatYouSee: 'The page shows a K-means assignment/update cycle, its squared-error objective, convergence behaviour, or initialization strategy.',
      whyItMatters: 'The algorithm is scalable and simple, but its result depends on initialization, the number of clusters, and the geometry encoded by squared distance.',
      intuition: 'Hold representatives fixed and assignment is obvious; hold assignments fixed and the mean is the best squared-error representative.',
      technicalDetail: `The page’s update is one coordinate-descent step for the K-means distortion; check the exact state transition on lecture page ${page}.`,
      pitfall: 'Convergence of the objective does not prove a global optimum, and a low loss does not prove the number of clusters is semantically correct.',
      connection: 'Use this page to justify every arithmetic step in a K-means calculation before comparing it with hierarchical or streaming methods.'
    };
  }
  if (section === 'BFR for out-of-core clustering') {
    return {
      type: 'apply',
      prompt: 'How does this BFR page keep clustering feasible when the data does not fit in memory?',
      answer: 'It processes chunks and compresses high-confidence points into discard-set sufficient statistics, retains uncertain but structured points in compression sets, and keeps outliers in a retained set until later evidence arrives.',
      hint: 'Name DS, CS, and RS and say what information each keeps or postpones.',
      whatYouSee: 'The page describes BFR’s chunked workflow, summary statistics, Mahalanobis assignment, or its DS/CS/RS state.',
      whyItMatters: 'BFR turns a memory-bound clustering problem into a sequence of compact summaries while preserving a path for uncertain points.',
      intuition: 'Confident points can be replaced by statistics; ambiguous points must keep more identity until a later chunk clarifies them.',
      technicalDetail: `Check which sufficient statistics or distance rule is used on lecture page ${page}; the summary must support later assignment and merge decisions.`,
      pitfall: 'Do not merge every point immediately: forcing uncertain points into a discard set can erase small or emerging clusters.',
      connection: 'BFR is the systems-scale counterpart to K-means and directly tests whether the clustering state fits the memory budget.'
    };
  }
  if (section === 'CURE representatives') {
    return {
      type: 'compare',
      prompt: 'Why does CURE keep multiple dispersed representatives instead of one centroid?',
      answer: 'Multiple representatives preserve non-spherical or dispersed cluster shape, are shrunk toward the mean to reduce noise, and support a scalable two-pass assignment.',
      hint: 'Compare one centroid with several representative points and then connect that choice to the two-pass workflow.',
      whatYouSee: 'The page shows CURE’s representative points, shrinking step, or the first/second pass used to scale clustering.',
      whyItMatters: 'CURE avoids the spherical-cluster assumption of one centroid while keeping the representation small enough to scale.',
      intuition: 'A centroid forgets shape; a few carefully chosen representatives retain the outline that matters for future assignment.',
      technicalDetail: `Use the representative-point and pass definitions on lecture page ${page} to distinguish CURE from centroid-only K-means.`,
      pitfall: 'Representatives are not arbitrary samples: their dispersion and shrinkage are part of the cluster model.',
      connection: 'CURE completes the Lecture 3 comparison between a hierarchy, a centroid objective, and a shape-preserving scalable summary.'
    };
  }
  if (section === 'evaluating clusters') {
    return {
      type: 'critique',
      prompt: 'How should clustering quality be evaluated on this page, and what limitation must be stated?',
      answer: 'Use intrinsic cohesion or separation when labels are unavailable; use external measures such as purity only when labels exist, and state that an external score can reward a partition that is not useful for the application.',
      hint: 'Separate internal geometry from external labels, then name the decision the metric is meant to support.',
      whatYouSee: 'The page discusses cluster quality, purity, or a summary of the assumptions and trade-offs across the lecture.',
      whyItMatters: 'Clustering has no single universally correct answer; evaluation must match the available labels and the downstream decision.',
      intuition: 'A neat partition can still be useless if the similarity metric or the evaluation target is wrong.',
      technicalDetail: `Anchor the metric and caveat to the evaluation definitions on lecture page ${page}; do not infer ground truth from an unlabeled partition.`,
      pitfall: 'Purity can favour many tiny clusters, so never report it without the cluster-count and label context.',
      connection: 'The evaluation section closes the loop from algorithm choice to whether the resulting clusters deserve to guide a decision.'
    };
  }
  if (section === 'applications, similarity, and recommender systems') {
    return {
      type: 'apply',
      prompt: 'What similarity or application decision is this page making, and which representation makes that decision possible?',
      answer: 'Identify the objects being compared, the feature or interaction representation, and the similarity rule; the representation determines which notion of “near” the application can observe.',
      hint: 'Look for users, items, features, ratings, or a distance/similarity definition.',
      whatYouSee: 'The page motivates clustering through applications, high-dimensional representations, or collaborative-filtering examples.',
      whyItMatters: 'A clustering result is only meaningful relative to the representation and similarity measure supplied by the application.',
      intuition: 'Changing the feature space changes the neighbourhoods, so it can change the clusters even when the algorithm is unchanged.',
      technicalDetail: `Use the object representation and similarity language visible on lecture page ${page}; keep application motivation separate from the later clustering algorithms.`,
      pitfall: 'Do not confuse “similar in observed features” with “similar for the business decision”; those are different validation claims.',
      connection: 'This motivation links Lecture 3’s clustering scope to the explicit recommender-system track from Assignment 2.'
    };
  }
  return {
    type: 'recall',
    prompt: 'What is the main clustering scope or takeaway on this page, and which assumption should be carried forward?',
    answer: 'Name the object or workflow introduced on the page and state the scalability or similarity assumption that controls how it should be used.',
    hint: 'Read the title, then write one sentence about the data, objective, and scale constraint.',
    whatYouSee: 'The page introduces the lecture’s clustering problem, workflow, or summary of methods.',
    whyItMatters: 'A method is only appropriate when its data representation, objective, and scale assumptions match the task.',
    intuition: 'Start with the decision and constraints, then choose the clustering summary that preserves the evidence needed later.',
    technicalDetail: `Use the visible definitions and diagrams on lecture page ${page} as the primary technical evidence for this takeaway.`,
    pitfall: 'Do not jump from an attractive diagram to an algorithm claim that the page has not established.',
    connection: 'This page supplies the lecture-level context for the clustering lesson and the later assignment calculations.'
  };
}

const slides = data.pages.map((page) => {
  const sourceText = page.blocks.map((block) => block.text || '').filter(Boolean).join('\n');
  const section = sectionFor(page.page);
  const layer = studyLayer(page.page, sourceText, section);
  const blocks = page.blocks.map((block) => ({
    blockId: block.blockId,
    type: block.type,
    page: block.page,
    sourceId,
    bbox: block.bbox,
    imageId: block.imageId || null,
    text: block.text || ''
  }));
  return {
    slideId: `dsa5101-lecture3-${page.page}`,
    slideNumber: page.page,
    pdfPage: page.page,
    sourceRef: { sourceId, sourceType: 'lecture', page: page.page },
    assetPath: `assets/nus/dsa5101/lecture3/slide-${String(page.page).padStart(2, '0')}.jpg`,
    extraction: { sourceId, page: page.page, blocks },
    sourceText,
    title: titleFor(page.page, sourceText, section),
    explanation: layer,
    socraticQuestions: [{ type: layer.type, prompt: layer.prompt, answer: layer.answer, hint: layer.hint }],
    kind: 'lecture',
    status: page.status === 'review' ? 'review' : 'current',
    reviewReasons: page.reviewReasons || [],
    lecturePriority: [2, 15, 21, 32, 37, 44, 49, 53, 59, 62, 71, 76, 78, 86, 90].includes(page.page) ? 'core' : 'support'
  };
});

const output = {
  schemaVersion: 'nus.slide-set.v1',
  id: 'dsa5101-lecture3',
  courseId: 'DSA5101',
  lessonIds: ['dsa5101-clustering'],
  coreSlideNumbers: slides.filter((slide) => slide.lecturePriority === 'core').map((slide) => slide.slideNumber),
  title: 'Lecture 3 · Clustering',
  summary: 'All 91 slides from the supplied DSA5101 Lecture 3, with hierarchical clustering, K-means, BFR, CURE, evaluation, and application motivation.',
  source: {
    sourceId,
    sourceType: 'lecture',
    pageCount: data.pageCount,
    fileName: 'Lec3_Clustering.pdf',
    access: 'local-only',
    assetPolicy: 'page-renders-only',
    courseCodePrintedOnSlide: 'DSA5101',
    atlasCourseId: 'DSA5101'
  },
  slides
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${output.slides.length} Lecture 3 slides to ${path.relative(ROOT, outputPath)}`);
