const AUTHORED_TEXT_KEYS = new Set([
  'body',
  'prompt',
  'answer',
  'solution',
  'explanation',
  'hint',
  'modelAnswer',
  'front',
  'back',
  'rubric',
  'visualHook',
  'whatYouSee',
  'observation',
  'summary',
  'meaning',
  'whyItMatters',
  'intuition',
  'technicalDetail',
  'pitfall',
  'connection',
  'concept',
  'useWhen',
  'examMove',
  'trap',
  'caveat',
  'detail',
  'distinction',
  'exercise',
  'focus',
  'learningGoal',
  'misconception',
  'note',
  'notes',
  'objectives',
  'purpose',
  'question',
  'reviewReasons',
  'skill',
  'sourceNote',
  'step',
  'steps',
  'description',
  'instruction',
  'objective',
  'takeaway',
  'reflection',
  'feedback',
  'choices',
  'text',
]);

const SKIP_KEYS = new Set([
  'extraction',
  'sourceRef',
  'sourceRefs',
  'provenance',
  'bbox',
  'imageId',
  'assetPath',
  'sourceId',
  'sourceType',
  'schemaVersion',
  'courseId',
  'lessonId',
  'moduleId',
  'slideId',
  'status',
  'role',
  'type',
  'kind',
  'id',
  'title',
  'name',
  'label',
  'icon',
  'language',
  'page',
  'pageStart',
  'pageEnd',
  'slideNumber',
  'pdfPage',
  'url',
  'href',
  'file',
  'asset',
  'code',
  'starter',
  'expected',
  'accepted',
  'answerKey',
]);

const GREEK = {
  alpha: '\\alpha',
  beta: '\\beta',
  delta: '\\delta',
  epsilon: '\\epsilon',
  gamma: '\\gamma',
  lambda: '\\lambda',
  mu: '\\mu',
  phi: '\\phi',
  pi: '\\pi',
  sigma: '\\sigma',
  theta: '\\theta',
  psi: '\\psi',
  Phi: '\\Phi',
  Sigma: '\\Sigma',
  Delta: '\\Delta',
};

const MATH_SPANS = [
  /\$\$[\s\S]*?\$\$/g,
  /\$(?:\\.|[^$])*?\$/g,
  /\\\((?:\\.|[^)])*?\\\)/g,
  /\\\[[\s\S]*?\\\]/g,
];
const CODE_BLOCKS = /```[\s\S]*?```|`[^`\n]+`/g;

function protectCode(value) {
  const blocks = [];
  const protectedValue = value.replace(CODE_BLOCKS, (match) => {
    const key = `\u0002CODE${blocks.length}\u0002`;
    blocks.push(match);
    return key;
  });
  return {
    value: protectedValue,
    restore(text) {
      return text.replace(/\u0002CODE(\d+)\u0002/g, (_, index) => blocks[Number(index)]);
    },
  };
}

function protectMath(value) {
  const spans = [];
  let protectedValue = value;
  for (const pattern of MATH_SPANS) {
    protectedValue = protectedValue.replace(pattern, (match) => {
      const key = `\u0000MATH${spans.length}\u0000`;
      spans.push(normalizeDelimitedMath(match));
      return key;
    });
  }
  return {
    value: protectedValue,
    restore(text) {
      return text.replace(/\u0000MATH(\d+)\u0000/g, (_, index) => spans[Number(index)]);
    },
  };
}

function normalizeDelimitedMath(match) {
  if (match.startsWith('$$')) return `$$${normalizeFormula(match.slice(2, -2))}$$`;
  if (match.startsWith('$')) return `$${normalizeFormula(match.slice(1, -1))}$`;
  if (match.startsWith('\\(')) return `\\(${normalizeFormula(match.slice(2, -2))}\\)`;
  if (match.startsWith('\\[')) return `\\[${normalizeFormula(match.slice(2, -2))}\\]`;
  return match;
}

function identifierToLatex(token) {
  const match = token.match(/^([A-Za-z]+)(?:_([A-Za-z0-9]+))?(?:\^([A-Za-z0-9]+))?$/);
  if (!match) return token;
  const [, base, subscript, superscript] = match;
  const latexBase = GREEK[base] || base;
  const suffix = `${subscript ? `_{${subscript}}` : ''}${superscript ? `^{${superscript === 'T' ? '\\top' : superscript}}` : ''}`;
  return `${latexBase}${suffix}`;
}

function wrapToken(token) {
  if (!token || token.startsWith('$')) return token;
  if (token === 'f*' || token === 'p*') return `$${token[0]}^*$`;
  if (token === 'w-hat') return String.raw`$\hat{w}$`;
  if (token === 'x-bar') return String.raw`$\bar{x}$`;
  if (token === 'y-bar') return String.raw`$\bar{y}$`;
  if (token === 'I-Phi-dagger') return String.raw`$I-\Phi^\dagger\Phi$`;
  if (/^d[A-Za-z]+\/d[A-Za-z]+$/.test(token)) {
    const [, numerator, denominator] = token.match(/^d([A-Za-z]+)\/d([A-Za-z]+)$/);
    return `$\\frac{d${numerator}}{d${denominator}}$`;
  }
  if (token.startsWith('A^(')) return String.raw`$\mathrm{A}^{${token.slice(3, -1)}}$`;
  if (token.startsWith('R_')) return `$${token.replace('_', '_{').replace(/$/, '}')}$`;
  if (/^(sum|argmax|argmin|max|min)_[A-Za-z0-9]+$/.test(token)) {
    const [operator, subscript] = token.split('_');
    const operatorLatex = { sum: '\\sum', argmax: '\\argmax', argmin: '\\argmin', max: '\\max', min: '\\min' }[operator] || operator;
    return `$${operatorLatex}_{${subscript}}$`;
  }
  if (/^[A-Za-z]+_[A-Za-z0-9]+$/.test(token) || /^[A-Za-z]+\^[A-Za-z0-9]+$/.test(token)) {
    return `$${identifierToLatex(token)}$`;
  }
  if (/^(alpha|beta|delta|epsilon|gamma|lambda|mu|phi|pi|sigma|theta|psi)$/.test(token)) {
    return `$${GREEK[token]}$`;
  }
  return `$${token}$`;
}

function normalizeFormula(formula) {
  return formula
    .replace(/(?<!\\)\b(alpha|beta|delta|epsilon|gamma|lambda|mu|phi|pi|sigma|theta|psi)(?=[_^])/g, (_, name) => GREEK[name])
    .replace(/(?<!\\)\b(alpha|beta|delta|epsilon|gamma|lambda|mu|phi|pi|sigma|theta|psi)\b/g, (_, name) => GREEK[name])
    .replace(/(?<!\\)\bPhi\b/g, '\\Phi')
    .replace(/(?<!\\)\b(?:sum|argmax|argmin|max|min)_[A-Za-z0-9]+\b/g, (token) => {
      const [operator, subscript] = token.split('_');
      const operatorLatex = { sum: '\\sum', argmax: '\\argmax', argmin: '\\argmin', max: '\\max', min: '\\min' }[operator] || operator;
      return `${operatorLatex}_{${subscript}}`;
    })
    .replace(/(?<!\\)\b(exp|log|sin|cos|sigmoid|softmax)\b/g, '\\$1')
    .replace(/≈/g, '\\approx')
    .replace(/≤/g, '\\le')
    .replace(/≥/g, '\\ge')
    .replace(/→/g, '\\to')
    .replace(/←/g, '\\leftarrow')
    .replace(/∈/g, '\\in')
    .replace(/≠/g, '\\ne')
    .replace(/±/g, '\\pm')
    .replace(/×/g, '\\times')
    .replace(/÷/g, '\\div')
    .replace(/∞/g, '\\infty')
    .replace(/>=/g, '\\ge ')
    .replace(/<=/g, '\\le ')
    .replace(/(?<!-)\->/g, '\\to ')
    .replace(/\|\|([^|]+)\|\|/g, '\\lVert $1 \\rVert')
    .replace(/\b(\d+)\/(\d+)\b/g, '\\frac{$1}{$2}')
    .replace(/\b([A-Za-z])_hat(?:_([A-Za-z0-9]+))?\b/g, (_, base, subscript) => `\\widehat{${base}}${subscript ? `_{${subscript}}` : ''}`)
    .replace(/\b([Rwyfm])hat(?:_([A-Za-z0-9]+))?\b/g, (_, base, subscript) => `\\widehat{${base}}${subscript ? `_{${subscript}}` : ''}`)
    .replace(/\b([A-Za-z])-hat\b/g, '\\hat{$1}')
    .replace(/\b([A-Za-z])-bar\b/g, '\\bar{$1}')
    .replace(/\b([A-Za-z])\*/g, '$1^*')
    .replace(/\^T\b/g, '^\\top');
}

function isFormulaOnly(value) {
  const text = value.trim();
  if (!text || text.length > 500 || /[.!?]\s+[A-Z][a-z]/.test(text)) return false;
  if (/\b(?:The|This|Compute|Take|Suppose|Examples|Use|When|Small|Large|Differentiate|Only|Both|For|From|An|Show|Define|Create|Display|Find|Write|Give|State|Explain|Consider|How|Why|Under|Does|Can|Should)\b/.test(text)) return false;
  return /(?:\\[A-Za-z]+|[A-Za-z]+[_^][A-Za-z0-9{]|\|\||\b[A-Za-z]\s*=)/.test(text);
}

function hasMalformedDelimiters(value) {
  let dollarMode = null;
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '\\' && value[index + 1] === '$') {
      index += 1;
      continue;
    }
    if (value[index] !== '$') continue;
    const display = value[index + 1] === '$';
    if (display) index += 1;
    if (!dollarMode) {
      dollarMode = display ? 'display' : 'inline';
      continue;
    }
    if (dollarMode === (display ? 'display' : 'inline')) {
      dollarMode = null;
      continue;
    }
    return true;
  }
  if (dollarMode) return true;

  const pairedDelimiters = [['\\(', '\\)'], ['\\[', '\\]']];
  for (const [open, close] of pairedDelimiters) {
    if ((value.split(open).length - 1) !== (value.split(close).length - 1)) return true;
  }
  const hasDollar = /(?<!\\)\$/.test(value);
  const hasPaired = /\\(?:\(|\[|\)|\])/.test(value);
  return hasDollar && hasPaired;
}

function normalizeText(value) {
  if (!value || typeof value !== 'string') return value;
  const protectedCode = protectCode(value);
  const codeSafeValue = protectedCode.value;
  if (hasMalformedDelimiters(codeSafeValue) || /\u0001FORMULA\d+\u0001/.test(codeSafeValue)) return value;
  if (!/\$\$[\s\S]*\$\$|\$(?:\\.|[^$])*\$|\\\(|\\\[/.test(codeSafeValue) && isFormulaOnly(codeSafeValue)) {
    return protectedCode.restore(`$${normalizeFormula(codeSafeValue.trim())}$`);
  }
  const protectedText = protectMath(codeSafeValue);
  let text = protectedText.value;
  const generated = [];
  const mark = (formula) => {
    const key = `\u0001FORMULA${generated.length}\u0001`;
    generated.push(normalizeFormula(formula));
    return key;
  };

  // Preserve complete, unambiguous equations before wrapping individual symbols.
  text = text.replace(/\bA\^\([^)]*\)(?:Phi)?/g, (match) => {
    const exponent = match.slice(3, match.indexOf(')'));
    return mark(String.raw`$\mathrm{A}^{${exponent}}${match.endsWith('Phi') ? '\\Phi' : ''}$`);
  });
  text = text.replace(/\b[A-Za-z]\s*=\s*\[\[[\s\S]*?\]\]/g, (match) => mark(`$${match}$`));
  text = text.replace(/\b[A-Za-z]\s*=\s*\{[^}]+\}/g, (match) => mark(`$${match}$`));
  text = text.replace(/(?<![$\w])(?:\([^.!?]+\)|[A-Za-z]+\([^)]*\))\s*(?:≈|≤|≥|≠|=)\s*[^.!?]+/g, (match) => mark(`$${match.trim()}$`));
  text = text.replace(/\b[A-Za-z][A-Za-z0-9]*(?:\([^)]*\))?(?:[_^][A-Za-z0-9]+)*(?:\([^)]*\))?\s*=\s*(?:[^!?;,.]|\.(?=\d))+?(?=\s+(?:and|has|is|are|gives|while|which|with|can|should|must|from|as)\b|[!?;,]|\.(?=\s|$)|$)/g, (match) => mark(`$${match.trim()}$`));
  text = text.replace(/\b(?:d[A-Za-z]+\s*\/\s*d[A-Za-z]+)\s*=\s*(?:[^!?;,.]|\.(?=\d))+/g, (match) => mark(`$${match.trim()}$`));
  text = text.replace(/\b[A-Za-z]+\s*\/\s*\((?:[^!?;.]|\.(?=\d))+\)/g, (match) => mark(`$${match}$`));
  text = text.replace(/(?<!\w)(?:1\/\((?:[^!?;.]|\.(?=\d))+\)\|\|(?:[^!?;.]|\.(?=\d))+)/g, (match) => mark(`$${match.trim()}$`));
  text = text.replace(/(?<![$\w])(?:[A-Za-z][A-Za-z0-9_]*\([^)]*\)|[A-Za-z][A-Za-z0-9_]*)\s*(?:<=|>=|<|>)\s*\d+(?:\.\d+)?/g, (match) => mark(`$${match}$`));
  text = text.replace(/\b(?:[A-Za-z]+)\s*(?:<=|>=|<|>)\s*\d+(?:\.\d+)?\b/g, (match) => mark(`$${match}$`));
  text = text.replace(/\b(?:[A-Za-z]+)\s*\/\s*(?:\d+(?:\.\d+)?|\([^)]*\))/g, (match) => mark(`$${match}$`));
  text = text.replace(/\b\d+(?:\.\d+)?(?:\s*[+*/-]\s*\d+(?:\.\d+)?){1,}\s*(?:=\s*\d+(?:\.\d+)?)?/g, (match) => mark(`$${match}$`));

  const tokenPattern = /(?<![$\w])(?:I-Phi-dagger|A\^\([^)]*\)|[A-Za-z]+\^†[A-Za-z]*|(?:[A-Za-z]+_[A-Za-z0-9]+|(?:f|p)\*)\([^)]*\)|(?:exp|log|sin|cos|sigmoid|softmax)\([^)]*\)|[A-Za-z]\([^)]*\)|d[A-Za-z]+\/d[A-Za-z]+|[A-Za-z]+_[A-Za-z0-9]+|[A-Za-z]+\^[A-Za-z0-9]+|(?:f|p)\*|w-hat|x-bar|y-bar|(?:sum|argmax|argmin|max|min)_(?:[A-Za-z0-9]+|\{[^}]+\})|(?:alpha|beta|delta|epsilon|gamma|lambda|mu|phi|pi|sigma|theta|psi)(?![A-Za-z])|O\([A-Za-z0-9_+*^ -]+\)|[≈≤≥∑∫∂∇±×÷∞→←∈≠])/g;
  text = text.replace(tokenPattern, (match) => mark(wrapToken(match)));

  const restoredGenerated = text.replace(/\u0001FORMULA(\d+)\u0001/g, (_, index) => generated[Number(index)]);
  return protectedCode.restore(protectedText.restore(restoredGenerated));
}

function normalizeDocument(value, key = '', skipped = false) {
  if (typeof value === 'string') {
    return !skipped && AUTHORED_TEXT_KEYS.has(key) ? normalizeText(value) : value;
  }
  if (Array.isArray(value)) return value.map((item) => normalizeDocument(item, key, skipped));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [
    childKey,
    normalizeDocument(childValue, childKey, skipped || SKIP_KEYS.has(childKey) || childKey === 'latex'),
  ]));
}

module.exports = { AUTHORED_TEXT_KEYS, SKIP_KEYS, hasMalformedDelimiters, normalizeDocument, normalizeText };
