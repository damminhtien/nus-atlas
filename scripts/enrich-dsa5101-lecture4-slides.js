#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const extractionPath = path.join(ROOT, 'data/extracted/DSA5101/dsa5101-lecture-4---dimensionality-reduction.json');
const outputPath = path.join(ROOT, 'content/courses/DSA5101/slides/dsa5101-lecture4.json');
const sourceId = 'DSA5101/DSA5101 Lecture 4 - Dimensionality Reduction.pdf';

const data = JSON.parse(fs.readFileSync(extractionPath, 'utf8'));

function sectionFor(page) {
  if (page <= 10) return 'motivation, rank, and matrix factorization';
  if (page <= 22) return 'SVD definition and latent factors';
  if (page <= 36) return 'SVD projection, reconstruction, and rank selection';
  if (page <= 43) return 'power iteration and computing SVD';
  if (page <= 50) return 'querying in the concept space';
  return 'CUR decomposition and SVD comparison';
}

function titleFor(page, text, section) {
  const lines = text.split(/\n+/).map(line => line.trim()).filter(Boolean);
  const useful = lines.find(line => {
    if (/^\d+$/.test(line)) return false;
    if (/^DSA\s*5101/i.test(line)) return false;
    if (/^Introduction to|^Big Data for|^Industry$/i.test(line)) return false;
    return line.length >= 4;
  });
  return useful ? useful.replace(/\s+/g, ' ').slice(0, 120) : `${section[0].toUpperCase()}${section.slice(1)} · slide ${page}`;
}

function layerFor(page, text, section) {
  const lower = text.toLowerCase();
  if (section === 'motivation, rank, and matrix factorization') {
    return {
      type: page <= 2 ? 'recall' : 'understand',
      prompt: 'What dimensionality-reduction problem is this page setting up, and what quantity must remain meaningful after compression?',
      answer: 'The goal is to replace a high-dimensional matrix with a lower-dimensional representation while preserving the variation or minimizing reconstruction error that matters for the task.',
      hint: 'Separate the original dimensions, the effective rank, and the loss or variance criterion.',
      whatYouSee: 'The page motivates latent dimensions, effective rank, or matrix factorization before introducing the SVD factors.',
      whyItMatters: 'A reduction is useful only when the retained coordinates preserve the structure needed for reconstruction or downstream queries.',
      intuition: 'Many coordinates can move together, so a smaller set of directions can describe most of the movement.',
      technicalDetail: `Use the rank or projection statement on lecture page ${page}; keep the data matrix and the reduced coordinates distinct.`,
      pitfall: 'Do not equate fewer columns with a useful reduction unless the retained representation preserves the stated variance or error target.',
      connection: 'This setup leads to SVD as the constrained factorization used to choose the best low-rank directions.'
    };
  }
  if (section === 'SVD definition and latent factors') {
    return {
      type: 'apply',
      prompt: 'What does each SVD factor represent here, and how do the dimensions constrain the multiplication?',
      answer: 'For $A\approx U\Sigma V^T$, $U$ contains left singular vectors, $\Sigma$ contains non-negative singular values, and $V$ contains right singular vectors. The shared latent dimension is the number of retained concepts.',
      hint: 'Write the shapes of $A$, $U$, $\Sigma$, and $V$ before interpreting a factor.',
      whatYouSee: 'The page defines the SVD product, its orthonormality restrictions, or a user-to-movie example of latent concepts.',
      whyItMatters: 'The factor roles determine whether a coordinate describes an object, a latent direction, or the strength of that direction.',
      intuition: 'The matrix is rebuilt from a small set of orthogonal patterns, each weighted by how much variation it explains.',
      technicalDetail: `Check the factor shapes and restriction on lecture page ${page}: $U^TU=I$, $V^TV=I$, and singular values are ordered and non-negative.`,
      pitfall: 'Do not swap left and right singular vectors, or treat $\Sigma$ as an arbitrary dense matrix.',
      connection: 'The latent-factor interpretation is used later to project users and queries into the same concept space.'
    };
  }
  if (section === 'SVD projection, reconstruction, and rank selection') {
    return {
      type: lower.includes('choosing') || lower.includes('loss') || lower.includes('best') ? 'tune' : 'derive',
      prompt: 'How does this page connect projection, reconstruction loss, and the choice of retained rank?',
      answer: 'Project onto the leading right singular directions, reconstruct with the retained terms, and discard the smallest singular directions. The squared Frobenius error is the sum of the squared discarded singular values.',
      hint: 'Mark the cutoff after $\sigma_k$ and distinguish retained energy from discarded error.',
      whatYouSee: 'The page shows a projection axis, a low-rank reconstruction, the Frobenius loss, or the energy rule for selecting latent factors.',
      whyItMatters: 'Rank selection is a tuning decision: more factors reduce error but preserve more dimensions and computation.',
      intuition: 'Keep the loudest directions first; quiet directions are cheaper to remove and contribute less to reconstruction.',
      technicalDetail: `For rank $k$, use $\lVert A-A_k\rVert_F^2=\sum_{i>k}\sigma_i^2$ and compare retained energy $\sum_{i\le k}\sigma_i^2$ on lecture page ${page}.`,
      pitfall: 'Do not sum the retained singular values when the question asks for reconstruction error, and do not take a square root unless unsquared Frobenius error is requested.',
      connection: 'This is the core calculation path for choosing a latent dimension before querying or comparing CUR.'
    };
  }
  if (section === 'power iteration and computing SVD') {
    return {
      type: 'derive',
      prompt: 'What invariant lets power iteration recover an SVD direction, and which matrix must be iterated?',
      answer: 'Power iteration repeatedly normalizes multiplication by a symmetric matrix to approach its principal eigenvector. For right singular vectors, iterate on $A^TA$; its eigenvalues are the squared singular values.',
      hint: 'Start from $A=U\Sigma V^T$, derive $A^TA=V\Sigma^2V^T$, then identify the eigenvectors.',
      whatYouSee: 'The page gives the normalized power-iteration update, deflation for later eigenvectors, or the link between $A^TA$ and SVD.',
      whyItMatters: 'The matrix orientation and normalization determine whether the recovered vectors are valid singular directions.',
      intuition: 'Repeated multiplication amplifies the direction that grows fastest; normalization prevents the vector from blowing up.',
      technicalDetail: `Use $x_{t+1}=Mx_t/\lVert Mx_t\rVert$ and $A^TA=V\Sigma^2V^T$ as the two steps shown on lecture page ${page}.`,
      pitfall: 'Do not iterate on $A$ itself when the task asks for right singular vectors, or confuse an eigenvalue of $A^TA$ with $\sigma_i$.',
      connection: 'After the directions are found, the same decomposition supports low-rank reconstruction and concept-space queries.'
    };
  }
  if (section === 'querying in the concept space') {
    return {
      type: 'apply',
      prompt: 'How is a query compared with users or items after SVD, and why can it match an object with no exact overlap?',
      answer: 'Map both the query and the stored rows or columns into the same latent coordinates, such as $q_{concept}=qV$. Similarity can then arise from shared latent concepts even when the original entries do not overlap.',
      hint: 'Check that the query and candidate use the same factor and coordinate orientation.',
      whatYouSee: 'The page maps a movie query or a user vector into the SVD concept space and compares latent coordinates.',
      whyItMatters: 'Latent coordinates expose indirect similarity that is hidden by sparse exact-match comparisons.',
      intuition: 'Two people can like different movies but still align on the same hidden taste directions.',
      technicalDetail: `Follow the projection $q_{concept}=qV$ on lecture page ${page}; use the same column ordering and retained dimensions for every object.`,
      pitfall: 'Do not compare an original-space vector with a concept-space vector, or use $U$ when the query multiplication requires $V$.',
      connection: 'The query example shows why dimensionality reduction is useful beyond compression: it changes what similarity can be observed.'
    };
  }
  return {
    type: lower.includes('empirical') || lower.includes('pros') || lower.includes('results') ? 'compare' : 'tune',
    prompt: 'What representation and trade-off does this CUR page make explicit compared with SVD?',
    answer: 'CUR approximates $A$ with sampled columns $C$, sampled rows $R$, and a small intersection factor $U$. It keeps actual rows and columns, which improves interpretability and can preserve sparsity, but sampling can duplicate columns and lose optimality guarantees relative to SVD.',
    hint: 'Name what is sampled, how the intersection is formed, and whether the basis is an actual data vector or a latent direction.',
    whatYouSee: 'The page describes CUR sampling, the pseudoinverse of the intersection, error bounds, duplicates, or an empirical SVD-versus-CUR comparison.',
    whyItMatters: 'The representation choice balances reconstruction accuracy, sparsity, memory, runtime, and interpretability.',
    intuition: 'SVD invents clean hidden directions; CUR reuses a few real rows and columns so the explanation stays concrete.',
    technicalDetail: `Use $A\approx CUR$ and $\lVert A-CUR\rVert_F\le(2+\epsilon)\lVert A-A_k\rVert_F$ only with the sampling and probability conditions stated on lecture page ${page}.`,
    pitfall: 'Do not call CUR an exact SVD or ignore duplicate samples, and do not quote an error bound without its probability and sample-size assumptions.',
    connection: 'This closes the lecture by turning rank selection into a representation decision: latent optimality versus sampled, sparse, interpretable factors.'
  };
}

const coreSlideNumbers = [3, 7, 9, 12, 13, 15, 17, 22, 25, 28, 30, 34, 35, 36, 38, 40, 41, 42, 43, 48, 50, 51, 53, 54, 56, 57, 58, 60, 61, 63, 64, 65];
const slides = data.pages.map(page => {
  const sourceText = page.blocks.map(block => block.text || '').filter(Boolean).join('\n');
  const section = sectionFor(page.page);
  const layer = layerFor(page.page, sourceText, section);
  const blocks = page.blocks.map(block => ({
    blockId: block.blockId,
    type: block.type,
    page: block.page,
    sourceId,
    bbox: block.bbox,
    imageId: block.imageId || null,
    text: block.text || ''
  }));
  return {
    slideId: `dsa5101-lecture4-${page.page}`,
    slideNumber: page.page,
    pdfPage: page.page,
    sourceRef: { sourceId, sourceType: 'lecture', page: page.page },
    assetPath: `assets/nus/dsa5101/lecture4/slide-${String(page.page).padStart(2, '0')}.jpg`,
    extraction: { sourceId, page: page.page, blocks },
    sourceText,
    title: titleFor(page.page, sourceText, section),
    explanation: layer,
    socraticQuestions: [{ type: layer.type, prompt: layer.prompt, answer: layer.answer, hint: layer.hint }],
    kind: 'lecture',
    status: page.status === 'review' ? 'review' : 'current',
    reviewReasons: page.reviewReasons || [],
    lecturePriority: coreSlideNumbers.includes(page.page) ? 'core' : 'support'
  };
});

const output = {
  schemaVersion: 'nus.slide-set.v1',
  id: 'dsa5101-lecture4',
  courseId: 'DSA5101',
  lessonIds: ['dsa5101-dimensionality-reduction'],
  coreSlideNumbers,
  title: 'Lecture 4 · Dimensionality Reduction',
  summary: 'All 67 slides from the supplied DSA5101 Lecture 4, covering rank, SVD, low-rank reconstruction, power iteration, concept-space queries, CUR, and the SVD/CUR trade-off.',
  source: {
    sourceId,
    sourceType: 'lecture',
    pageCount: data.pageCount,
    fileName: 'DSA5101 Lecture 4 - Dimensionality Reduction.pdf',
    access: 'local-only',
    assetPolicy: 'page-renders-only',
    courseCodePrintedOnSlide: 'DSA5101',
    atlasCourseId: 'DSA5101'
  },
  slides
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${output.slides.length} Lecture 4 slides to ${path.relative(ROOT, outputPath)}`);
