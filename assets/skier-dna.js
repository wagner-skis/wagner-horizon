// @ts-nocheck
/* =============================================================================
 * Skier DNA — client island (ESM module)
 * Reads ALL config from the Liquid section (data-* attrs + JSON script tag).
 * Five-act state machine + layered SVG ski. No framework, no build step.
 * Style only with var(--sd-*) custom properties — never hardcoded values.
 * ============================================================================= */

// ── helpers ────────────────────────────────────────────────────────────────────
function esc(v) {
  if (v == null) return '';
  return String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function btnCls(style) {
  if (style === 'theme_secondary') return 'sd-btn--ghost';
  if (style === 'text')            return 'sd-btn--link';
  return 'sd-btn--primary';
}

// ── session persistence ────────────────────────────────────────────────────────
const STORAGE_KEY = 'sd_dna_v1';
const PERSIST_KEYS = [
  'act', 'name', 'regions', 'dayTypes', 'terrain', 'stability',
  'currentSki', 'currentSkiLikes', 'currentSkiImprovements',
  'bindings', 'heightVal', 'heightUnit', 'heightIn', 'weightVal', 'weightUnit',
  'age', 'bsl', 'ability', 'personalNotes',
  'personality', 'selectedLength', 'selectedWaist', 'selectedCamber',
  'designId', '_specInited', 'personalityNarratives',
  '_recLength', '_recWaist', '_recCamber',
];

function saveSession(state) {
  try {
    const data = { ts: Date.now() };
    PERSIST_KEYS.forEach(k => { data[k] = state[k]; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    if (!data.ts || Date.now() - data.ts > THIRTY_DAYS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch (e) { return null; }
}

function clearSession() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

// ── initial state ──────────────────────────────────────────────────────────────
function makeState() {
  return {
    act: 1,
    name: '',
    regions: [],
    dayTypes: [],
    terrain: [],
    stability: 0.5,
    currentSki: { brand: '', model: '', year: '', length: '' },
    currentSkiLikes: '',
    currentSkiImprovements: '',
    bindings: '',
    heightVal: '', heightUnit: 'ft', heightIn: '',
    weightVal: '', weightUnit: 'lb',
    age: '', bsl: '', ability: '', personalNotes: '',
    loading: false,
    loadingExtended: false,
    personalityNarratives: null,
    personalityNarrativesLoading: false,
    personality: 0,
    selectedLength: 179, selectedWaist: 101, selectedCamber: 'medium',
    email: '', klaviyoOptIn: false,
    saveState: 'idle',
    saveModalOpen: false,
    resumeBanner: false,
    resumeSource: '',
    errors: {},
    _specInited: false,
    designId: null,
  };
}

// ── ski SVG ────────────────────────────────────────────────────────────────────
function skiOutlinePath(sh, wa, ta, cx) {
  const r = w => cx + w;
  const l = w => cx - w;
  return [
    `M ${cx} 22`,
    `C ${cx} 40 ${r(sh)} 56 ${r(sh)} 80`,
    `C ${r(sh)} 152 ${r(wa)} 212 ${r(wa)} 290`,
    `C ${r(wa)} 382 ${r(ta)} 432 ${r(ta)} 500`,
    `C ${r(ta)} 520 ${r(4)} 532 ${r(4)} 542`,
    `L ${l(4)} 542`,
    `C ${l(4)} 532 ${l(ta)} 520 ${l(ta)} 500`,
    `C ${l(ta)} 432 ${l(wa)} 382 ${l(wa)} 290`,
    `C ${l(wa)} 212 ${l(sh)} 152 ${l(sh)} 80`,
    `C ${l(sh)} 56 ${cx} 40 ${cx} 22 Z`,
  ].join(' ');
}

function skiProfilePath(rTip, rTail, camber, flex) {
  const base = 60;
  const midY = base - camber + flex;
  return [
    `M 18 ${base - rTip}`,
    `Q 70 ${base - rTip} 110 ${base - 2}`,
    `Q 200 ${base - 2} 290 ${midY}`,
    `Q 380 ${base - 2} 470 ${base - 2}`,
    `Q 530 ${base - 2} 562 ${base - rTail}`,
  ].join(' ');
}

function renderSkiSVG(opts) {
  const sh      = opts.sh      !== undefined ? opts.sh      : 30;
  const wa      = opts.waist   !== undefined ? opts.waist   : 24;
  const ta      = opts.ta      !== undefined ? opts.ta      : 27;
  const cx      = opts.cx      !== undefined ? opts.cx      : 65;
  const base    = opts.base    || 'wood';
  const graphic = !!opts.graphic;
  const layers  = opts.layers  || null;
  const binding = !!opts.binding;
  const ghost   = !!opts.ghost;
  const body    = !!opts.body;
  const rockerTip  = opts.rockerTip  || 0;
  const rockerTail = opts.rockerTail || 0;
  const camber  = opts.camber  !== undefined ? opts.camber  : 9;
  const flex    = opts.flex    || 0;
  const profile = opts.profile !== false;
  const uid     = opts.uid     || 'ski';
  const topW    = 130;
  const viewW   = body ? 230 : topW;
  const bx      = body ? 70 : 0;

  const outline   = skiOutlinePath(sh, wa, ta, cx);
  const ghostPath = skiOutlinePath(28, 26, 25, cx);

  let woodLines = '';
  if (base === 'wood') {
    for (let i = 0; i < 7; i++) {
      woodLines += `<path d="M ${30 + i * 9} 30 q 6 270 0 510" stroke="#bdbdbd" stroke-width="0.8" fill="none" opacity="0.7"/>`;
    }
  }
  let snowDots = '';
  if (base === 'snow') {
    for (let i = 0; i < 46; i++) {
      snowDots += `<circle cx="${32 + (i * 37) % 66}" cy="${40 + (i * 53) % 500}" r="1.5" fill="var(--sd-accent,#3270a8)" opacity="0.22"/>`;
    }
  }
  let graphicFill = '';
  if (graphic) {
    graphicFill = `<rect x="0" y="0" width="${topW}" height="560" fill="rgba(50,112,168,0.07)"/>`;
    for (let i = 0; i < 28; i++) {
      graphicFill += `<line x1="${-20 + i * 12}" y1="0" x2="${-120 + i * 12}" y2="560" stroke="rgba(50,112,168,0.1)" stroke-width="6"/>`;
    }
  }
  let metalLines = '';
  if (layers === 'metal' || layers === 'both') {
    for (let i = 0; i < 3; i++) {
      metalLines += `<line x1="36" y1="${250 + i * 12}" x2="94" y2="${250 + i * 12}" stroke="#8c8c8c" stroke-width="2" stroke-dasharray="1 3" opacity="0.9"/>`;
    }
  }
  let carbonLines = '';
  if (layers === 'carbon' || layers === 'both') {
    for (let i = 0; i < 8; i++) {
      carbonLines += `<line x1="34" y1="${300 + i * 7}" x2="96" y2="${300 + i * 7 - 14}" stroke="var(--sd-accent,#3270a8)" stroke-width="1" opacity="0.8"/>`;
    }
  }

  const bindingSvg = binding ? `
    <g fill="#fff" stroke="var(--sd-ink,#1a1a1a)" stroke-width="1.4">
      <path d="M ${cx-13} 250 L ${cx+13} 250 L ${cx+10} 272 L ${cx-10} 272 Z"/>
      <path d="M ${cx-12} 318 L ${cx+12} 318 L ${cx+14} 344 L ${cx-14} 344 Z"/>
      <line x1="${cx}" y1="272" x2="${cx}" y2="318" stroke-width="1.2"/>
    </g>` : '';

  const ghostSvg = ghost ? `
    <g transform="translate(-14,14) scale(0.94)" transform-origin="${cx} 280">
      <path d="${ghostPath}" fill="none" stroke="#8c8c8c" stroke-width="1.4" stroke-dasharray="5 4" opacity="0.8"/>
      <text x="${cx-36}" y="556" font-family="monospace" font-size="9" fill="#8c8c8c">current ski</text>
    </g>` : '';

  const bodyFig = body ? `
    <g stroke="var(--sd-ink,#1a1a1a)" stroke-width="1.6" fill="none" stroke-linecap="round">
      <line x1="30" y1="40" x2="30" y2="540" stroke="#bdbdbd" stroke-dasharray="3 4"/>
      <circle cx="30" cy="120" r="13"/>
      <line x1="30" y1="133" x2="30" y2="250"/>
      <line x1="30" y1="160" x2="12" y2="215"/>
      <line x1="30" y1="160" x2="48" y2="215"/>
      <line x1="30" y1="250" x2="16" y2="350"/>
      <line x1="30" y1="250" x2="44" y2="350"/>
      <text x="6" y="34" font-family="monospace" font-size="8.5" fill="#8c8c8c">head</text>
    </g>` : '';

  const rockerLabels =
    (rockerTip  > 0 ? `<text x="${cx+34}" y="84"  font-family="monospace" font-size="8" fill="var(--sd-accent,#3270a8)">tip rocker</text>`  : '') +
    (rockerTail > 0 ? `<text x="${cx+30}" y="502" font-family="monospace" font-size="8" fill="var(--sd-accent,#3270a8)">tail rocker</text>` : '');

  const graphicLabel = graphic
    ? `<text x="${cx}" y="300" text-anchor="middle" font-family="monospace" font-size="8.5" fill="var(--sd-accent,#3270a8)" transform="rotate(90 ${cx} 300)">[ TOPSHEET GRAPHIC ]</text>` : '';

  const topSvg = `
    <svg viewBox="0 0 ${viewW} 560" class="sd-ski-topview" aria-hidden="true">
      <defs><clipPath id="sk-${uid}"><path d="${outline}" transform="translate(${bx},0)"/></clipPath></defs>
      ${bodyFig}
      <g transform="translate(${bx},0)">
        ${ghostSvg}
        <g clip-path="url(#sk-${uid})">
          <rect x="0" y="0" width="${topW}" height="560" fill="#fafafa"/>
          ${woodLines}${snowDots}${graphicFill}${metalLines}${carbonLines}
        </g>
        <path d="${outline}" fill="none" stroke="var(--sd-ink,#1a1a1a)" stroke-width="1.8"/>
        ${bindingSvg}${rockerLabels}${graphicLabel}
      </g>
    </svg>`;

  let profileSvg = '';
  if (profile) {
    const pPath  = skiProfilePath(rockerTip, rockerTail, camber, flex);
    const pColor = (rockerTip || rockerTail || flex) ? 'var(--sd-accent,#3270a8)' : 'var(--sd-ink,#1a1a1a)';
    profileSvg = `
      <div class="sd-ski-profile">
        <svg viewBox="0 0 580 86" style="width:100%;display:block">
          <line x1="8" y1="60" x2="572" y2="60" stroke="#bdbdbd" stroke-width="1" stroke-dasharray="4 4"/>
          <text x="8" y="78" font-family="monospace" font-size="9" fill="#8c8c8c">snow</text>
          <path d="${pPath}" fill="none" stroke="${pColor}" stroke-width="2" stroke-linecap="round"/>
          <text x="500" y="20" font-family="monospace" font-size="9" fill="#8c8c8c" text-anchor="end">side profile</text>
        </svg>
      </div>`;
  }

  return `<div class="sd-ski-panel-inner">${topSvg}${profileSvg}</div>`;
}

// ── derive ski visual params from state ────────────────────────────────────────
function skiParams(state, overrideAct) {
  const act       = overrideAct !== undefined ? overrideAct : state.act;
  const hasPowder = state.dayTypes.indexOf('powder') >= 0 || state.dayTypes.indexOf('touring') >= 0;
  const hasHard   = state.dayTypes.indexOf('hard_firm') >= 0;
  const hasDeep   = state.terrain.some(t => ['bowls', 'trees', 'backcountry'].indexOf(t) >= 0);

  let wa = 24;
  if (state.dayTypes.length > 0) {
    wa = hasPowder && !hasHard ? 33 : hasHard && !hasPowder ? 20 : 28;
  }
  let rockerTip = 0, rockerTail = 0;
  if (state.terrain.length > 0) {
    rockerTip  = hasDeep ? 16 : 8;
    rockerTail = hasDeep ? 11 : 5;
  }
  let camber = rockerTip > 0 ? 7 : 9;
  let layers = null;
  let flex   = 0;
  if (act >= 3) {
    flex   = Math.round(state.stability * 8);
    layers = state.stability < 0.33 ? 'metal' : state.stability > 0.66 ? 'carbon' : 'both';
  }
  if (act === 5) {
    if (state.selectedWaist) {
      wa = Math.round(20 + (state.selectedWaist - 84) * 13 / 28);
      wa = Math.max(18, Math.min(36, wa));
    }
    camber = state.selectedCamber === 'low' ? 4 : state.selectedCamber === 'high' ? 14 : 9;
  }

  return {
    sh: 30, waist: wa, ta: 27, cx: 65,
    base:      state.regions.length > 0 ? 'snow' : 'wood',
    graphic:   act === 5,
    layers, binding: !!state.bindings,
    ghost:     act >= 3 && !!state.currentSki.brand,
    body:      act === 4 && !!state.heightVal,
    rockerTip, rockerTail, camber, flex,
    profile:   act !== 4,
    uid:       `a${act}`,
  };
}

// ── field info + delta copy ────────────────────────────────────────────────────
const SD_FIELD_INFO = {
  length: {
    info: 'Ski length affects agility, float in powder, and stability at speed. Longer skis are more stable and float better; shorter skis initiate turns faster.',
    shorter: d => `${Math.abs(d)} cm shorter than recommended — quicker turn initiation and a more playful feel, with less stability at high speed.`,
    longer:  d => `${Math.abs(d)} cm longer than recommended — more stability at speed and better float in powder, but turns take more effort to start.`,
  },
  waist: {
    info: 'Waist width is measured underfoot at the narrowest point. Wider floats better in soft snow; narrower is more responsive edge-to-edge on hardpack.',
    narrower: d => `${Math.abs(d)} mm narrower than recommended — crisper edge-to-edge transitions on hardpack, less float in powder.`,
    wider:    d => `${Math.abs(d)} mm wider than recommended — more float in soft snow and powder, mellower feel on groomers.`,
  },
  camber: {
    info: 'Camber is the arc built into the ski underfoot. More camber = more edge contact and power return. Less camber = easier initiation and more forgiveness.',
    low:    'Lower camber than recommended — more forgiving and easier to initiate turns, best for varied and soft snow conditions.',
    medium: '',
    high:   'Higher camber than recommended — maximum edge grip and energy return for aggressive carving. Most effective on hardpack and groomed runs.',
  },
  graphic: {
    info: 'Your topsheet graphic is the visual design on the top surface of the ski. It has no effect on performance — purely personal style.',
  },
};

// ── recommendation logic ───────────────────────────────────────────────────────
function computeSpec(state) {
  const hasPowder = state.dayTypes.indexOf('powder') >= 0 || state.dayTypes.indexOf('touring') >= 0;
  const hasHard   = state.dayTypes.indexOf('hard_firm') >= 0;
  let wMin = 98, wMax = 104;
  if      (hasPowder && !hasHard) { wMin = 104; wMax = 112; }
  else if (hasHard && !hasPowder) { wMin = 84;  wMax = 92;  }
  else if (hasPowder && hasHard)  { wMin = 96;  wMax = 104; }

  let hCm = 175;
  if (state.heightUnit === 'ft') {
    const hFt = parseFloat(state.heightVal) || 0;
    const hIn = parseFloat(state.heightIn)  || 0;
    if (hFt > 0 || hIn > 0) hCm = Math.round(hFt * 30.48 + hIn * 2.54);
  } else if (state.heightVal) {
    const hN = parseFloat(state.heightVal);
    if (hN > 0) hCm = hN;
  }
  let weightLb = 0;
  if (state.weightVal) {
    const wn = parseFloat(state.weightVal);
    if (wn > 0) weightLb = state.weightUnit === 'kg' ? Math.round(wn * 2.20462) : wn;
  }
  let weightMult = 0;
  if (weightLb > 0) {
    if      (weightLb < 100) weightMult =  Math.round((100 - weightLb) / 15);
    else if (weightLb > 120) weightMult = -Math.round((weightLb - 120) / 15);
  }
  const skillsOffset = (state.ability === 'Level III' || state.ability === 'III+') ? 0
    : state.ability === 'Level II' ? -5 : -10;
  const midLen = Math.round(hCm + weightMult + skillsOffset);
  const lMin   = Math.round((midLen - 5) / 5) * 5;
  const lMax   = Math.round((midLen + 5) / 5) * 5;

  const stab = state.stability;
  let construction, tipDesign, tailDesign, sidecut, camberLabel;
  if (stab < 0.33) {
    construction = 'Aspen core · 2× Titanal'; tipDesign = 'Early-rise rocker'; tailDesign = 'Flat';           sidecut = '16 – 18 m'; camberLabel = 'Medium';
  } else if (stab > 0.66) {
    construction = 'Paulownia core · Carbon stringers'; tipDesign = 'Progressive rocker'; tailDesign = 'Early-rise rocker'; sidecut = '14 – 16 m'; camberLabel = 'Low / early-rise';
  } else {
    construction = 'Aspen core · 1× Titanal'; tipDesign = 'Early-rise rocker'; tailDesign = 'Low rocker'; sidecut = '17 – 19 m'; camberLabel = 'Medium';
  }
  const pkg = stab < 0.33 ? 'Ultra' : stab > 0.66 ? 'Essential' : 'Silver';

  return {
    lengthRange: [lMin, lMax], lengthMid: midLen,
    waistRange:  [wMin, wMax], waistMid:  Math.round((wMin + wMax) / 2),
    sidecut, tipDesign, tailDesign, construction, camber: camberLabel, pkg,
  };
}

function selectMaterialsForPole(materials, target) {
  const cats   = ['core', 'topsheet', 'base', 'sidewall', 'edge', 'laminate'];
  const result = {};
  cats.forEach(cat => {
    let pool = (materials || []).filter(m => m.category === cat);
    if (!pool.length) return;
    const sqDist = m => {
      const dd = (m.damp_factor   - target.damp)   * target.wd;
      const df = (m.flex_factor   - target.flex)   * target.wf;
      const ds = (m.speed_factor  - target.speed)  * target.ws;
      const dw = (m.weight_factor - target.weight) * target.ww;
      return dd*dd + df*df + ds*ds + dw*dw;
    };
    result[cat] = pool.slice().sort((a, b) => sqDist(a) - sqDist(b))[0];
  });
  return result;
}

function computePersonalities(state, spec, materials) {
  const hasPowder = state.dayTypes.indexOf('powder') >= 0 || state.dayTypes.indexOf('touring') >= 0;
  const hasHard   = state.dayTypes.indexOf('hard_firm') >= 0;
  const stab      = state.stability;
  const isStable  = stab < 0.4, isLight = stab > 0.6;

  const poleTargets = [
    { damp: stab*10, flex: stab*10, speed: hasPowder?4:hasHard?7:5, weight: hasPowder?3:hasHard?6:5, wd:2, wf:2, ws:1, ww:1 },
    { damp: hasPowder?3:hasHard?6:5, flex: hasPowder?3:hasHard?8:5, speed: hasPowder?5:hasHard?9:7, weight: hasPowder?2:hasHard?5:4, wd:1, wf:2, ws:2, ww:2 },
    { damp: 3, flex: 5, speed: 9, weight: 3, wd:1, wf:1, ws:3, ww:2 },
  ];
  const poleMats = poleTargets.map(t => selectMaterialsForPole(materials, t));

  const matDiffs = mats => {
    const out = [];
    ['core', 'laminate', 'sidewall', 'base'].forEach(k => {
      const m = mats[k];
      if (m) out.push(m.name + (m.sub_category ? ' · ' + m.sub_category : ''));
    });
    return out.length ? out : null;
  };

  return [
    {
      id: 0,
      tagline: isStable ? 'Planted and powerful.' : isLight ? 'Quick and playful.' : 'Balanced and versatile.',
      desc: isStable
        ? "Built for maximum edge hold and power transfer on firm snow. You'll feel planted at speed, with energy that pushes back when you load the edge."
        : isLight
        ? "Light swing weight, quick initiation, and a lively feel that makes every turn a conversation with the snow."
        : "A midpoint that keeps options open — enough damp for fast groomer runs, light enough to stay playful in softer conditions.",
      diffs: matDiffs(poleMats[0]) || (isStable
        ? ['2× Titanal laminate', `Medium camber · ${spec.sidecut}`, 'Aspen core']
        : isLight
        ? ['Carbon stringers, no metal', 'Early-rise tip/tail', 'Paulownia core']
        : ['1× Titanal + damping layer', `Medium camber · ${spec.sidecut}`, 'Aspen / ash core']),
      selectedMaterials: poleMats[0],
    },
    {
      id: 1,
      tagline: hasPowder ? 'Float and forgiveness.' : hasHard ? 'Precision carver.' : 'All-mountain performance.',
      desc: hasPowder
        ? "Optimized for soft conditions — materials chosen for float, a light swing weight, and control when you punch through into crud."
        : hasHard
        ? "Narrow waist and full-camber design with materials that maximize edge hold. Turn initiation is deliberate and precise — exactly what you want when edges matter."
        : "A terrain-matched build tuned for mixed conditions, optimized for where you actually ski most.",
      diffs: matDiffs(poleMats[1]) || (hasPowder
        ? ['Full rocker tip/tail', `${spec.waistRange[0]+4}–${spec.waistRange[1]+4} mm waist`, 'Paulownia core, light swing weight']
        : ['Full camber platform',  `${spec.waistRange[0]-4}–${spec.waistRange[1]-4} mm waist`, '2× Titanal, edge hold priority']),
      selectedMaterials: poleMats[1],
    },
    {
      id: 2,
      tagline: 'Active and responsive.',
      desc: 'A tighter-radius, more responsive build that executes every turn decision immediately. For skiers who stay active and never let the mountain do the driving.',
      diffs: matDiffs(poleMats[2]) || ['Shorter sidecut radius', 'Livelier flex pattern', 'Carbon / glass hybrid layup'],
      selectedMaterials: poleMats[2],
    },
  ];
}

// ── sub-header ─────────────────────────────────────────────────────────────────
const ACT_LABELS = ['Hello', 'Where & when', 'Feel', 'You', 'Your design'];

function renderSubHeader(state, copy) {
  const breadcrumb = ACT_LABELS.map((label, i) => {
    const n   = i + 1;
    const cls = `sd-bread-step${n < state.act ? ' is-done' : ''}${n === state.act ? ' is-cur' : ''}`;
    const sep = i < ACT_LABELS.length - 1 ? '<span class="sd-bread-lead" aria-hidden="true"></span>' : '';
    return `<span class="${cls}">
        <span class="sd-bread-dot" aria-hidden="true"></span>
        <span class="sd-bread-label">${esc(label)}</span>
      </span>${sep}`;
  }).join('');

  const microCta = state.act >= 3
    ? `<button class="sd-micro-cta" data-sd-action="open-book">${esc(copy.microCtaLabel || 'Prefer to talk it through? Book a 20-min call.')}</button>`
    : '<span style="flex-shrink:0;width:1px"></span>';

  return `
    <div class="sd-subheader" role="navigation" aria-label="Experience progress">
      <nav class="sd-breadcrumb">${breadcrumb}</nav>
      ${microCta}
    </div>`;
}

// ── Act 1 ──────────────────────────────────────────────────────────────────────
function renderAct1(state, config) {
  const copy    = config.copy || {};
  const hasName = state.name.trim().length > 0;
  const errHtml = state.errors.name
    ? `<div class="sd-alert" role="alert">${esc(state.errors.name)}</div>` : '';
  return `
    <div class="sd-act sd-act--1">
      <div class="sd-split">
        <div class="sd-form-col">
          <div class="sd-eyebrow">${esc(copy.heading || "Let's find your ski.")}</div>
          <h1 class="sd-h1">${esc(copy.namePrompt || 'First, what should we call you?')}</h1>
          <p class="sd-sub">${esc(copy.subhead || "Answer a few questions and watch the ski we'd build for you come to life.")}</p>
          ${copy.pageIntro ? `<div class="sd-page-intro">${copy.pageIntro}</div>` : ''}
          <div class="sd-field">
            <label class="sd-label" for="sd-name">Your first name</label>
            <input id="sd-name" class="sd-input${state.errors.name ? ' is-error' : ''}"
              type="text" autocomplete="given-name" placeholder="Type your name…"
              value="${esc(state.name)}" data-sd-action="name" autofocus/>
            ${errHtml}
          </div>
          <div class="sd-btn-row" style="margin-top:28px">
            <button class="sd-btn ${btnCls(config.settings.buttonContinue)}" data-sd-action="act1-continue"
              ${!hasName ? 'disabled aria-disabled="true"' : ''}>Continue →</button>
          </div>
        </div>
        <div class="sd-ski-col">
          <div class="sd-ski-panel">
            <div class="sd-ski-panel-heading">Your ski, so far</div>
            ${renderSkiSVG(skiParams(state))}
          </div>
        </div>
      </div>
    </div>`;
}

// ── Act 2 ──────────────────────────────────────────────────────────────────────
function renderAct2(state, config) {
  const regionDefs = config.regions?.length ? config.regions : [
    { label: 'Western NA',     value: 'western_na' },
    { label: 'Eastern NA',    value: 'eastern_na'  },
    { label: 'Europe',         value: 'europe'      },
    { label: 'Asia',           value: 'asia'        },
    { label: 'South America',  value: 'sa'          },
    { label: 'Australia / NZ', value: 'anz'         },
  ];
  const dayDefs = config.dayTypes?.length ? config.dayTypes : [
    { label: 'Everyday',            value: 'everyday',  image: null },
    { label: 'Powder Days',          value: 'powder',    image: null },
    { label: 'Hard / Firm On-Piste', value: 'hard_firm', image: null },
    { label: 'Ski Touring',          value: 'touring',   image: null },
  ];
  const terrainDefs = config.terrain?.length ? config.terrain : [
    { label: 'Groomed',             value: 'groomed'     },
    { label: 'Moguls',              value: 'moguls'      },
    { label: 'Resort Powder Bowls', value: 'bowls'       },
    { label: 'Hard Snow / Ice',     value: 'ice'         },
    { label: 'Backcountry Powder',  value: 'backcountry' },
    { label: 'Tree Runs',           value: 'trees'       },
    { label: 'Terrain Park',        value: 'park'        },
    { label: 'Race Course',         value: 'race'        },
  ];

  const rCount = state.regions.length;
  const tCount = state.terrain.length;

  const regionHtml = regionDefs.map(r => {
    const on       = state.regions.indexOf(r.value) >= 0;
    const disabled = !on && rCount >= 3;
    return `<button class="sd-chip${on?' is-on':''}${disabled?' is-disabled':''}"
        data-sd-action="toggle-region" data-value="${esc(r.value)}"
        aria-pressed="${on}"${disabled?' disabled':''}>
        <span class="sd-chip-dot${on?' is-on':''}" aria-hidden="true"></span>
        ${esc(r.label)}
      </button>`;
  }).join('');

  const dayHtml = dayDefs.map(d => {
    const on     = state.dayTypes.indexOf(d.value) >= 0;
    const imgHtml = d.image
      ? `<img src="${esc(d.image)}" alt="${esc(d.label)}" loading="lazy"/>`
      : '<span class="sd-pcard-placeholder"></span>';
    return `<button class="sd-pcard${on?' is-on':''}"
        data-sd-action="toggle-daytype" data-value="${esc(d.value)}" aria-pressed="${on}">
        <div class="sd-pcard-img">${imgHtml}${on?'<span class="sd-pcard-check" aria-hidden="true">✓</span>':''}</div>
        <div class="sd-pcard-label">${esc(d.label)}</div>
      </button>`;
  }).join('');

  const terrainHtml = terrainDefs.map(t => {
    const on       = state.terrain.indexOf(t.value) >= 0;
    const disabled = !on && tCount >= 3;
    const imgHtml  = t.image
      ? `<img src="${esc(t.image)}" alt="${esc(t.label)}" loading="lazy"/>`
      : '<span class="sd-pcard-placeholder"></span>';
    return `<button class="sd-pcard sd-pcard--sm${on?' is-on':''}${disabled?' is-disabled':''}"
        data-sd-action="toggle-terrain" data-value="${esc(t.value)}"
        aria-pressed="${on}"${disabled?' disabled':''}>
        <div class="sd-pcard-img">${imgHtml}${on?'<span class="sd-pcard-check" aria-hidden="true">✓</span>':''}</div>
        <div class="sd-pcard-label">${esc(t.label)}</div>
      </button>`;
  }).join('');

  const { regions: errRegion, dayTypes: errDay, terrain: errTerrain } = state.errors;

  return `
    <div class="sd-act sd-act--2">
      <div class="sd-split sd-split--scroll">
        <div class="sd-form-col sd-form-col--scroll">
          <div class="sd-eyebrow">Where &amp; when</div>
          <div class="sd-q-block${errRegion?' sd-q-block--error':''}">
            <h2 class="sd-h2">Where do you want to ski with these?</h2>
            <p class="sd-body">Pick up to three regions.</p>
            <div class="sd-chip-map">
              <div class="sd-chip-group">${regionHtml}</div>
              ${rCount > 0 ? `<span class="sd-count" aria-live="polite">● ${rCount} of 3 selected</span>` : ''}
            </div>
            ${errRegion ? `<div class="sd-alert" role="alert">${esc(errRegion)}</div>` : ''}
          </div>
          <hr class="sd-divider"/>
          <div class="sd-q-block${errDay?' sd-q-block--error':''}">
            <h2 class="sd-h2">What kind of days are these for?</h2>
            <p class="sd-body">Choose one or more.</p>
            <div class="sd-pcard-grid sd-pcard-grid--2">${dayHtml}</div>
            ${errDay ? `<div class="sd-alert" role="alert">${esc(errDay)}</div>` : ''}
          </div>
          <hr class="sd-divider"/>
          <div class="sd-q-block${errTerrain?' sd-q-block--error':''}">
            <h2 class="sd-h2">What terrain are you riding?</h2>
            <p class="sd-body">Pick up to three.</p>
            <div class="sd-pcard-grid sd-pcard-grid--4">${terrainHtml}</div>
            ${tCount > 0 ? `<span class="sd-count" aria-live="polite" style="margin-top:12px;display:inline-block">● ${tCount} of 3 selected</span>` : ''}
            ${errTerrain ? `<div class="sd-alert" role="alert">${esc(errTerrain)}</div>` : ''}
          </div>
          <div class="sd-btn-row">
            <button class="sd-btn ${btnCls(config.settings.buttonBack)}" data-sd-action="back">← Back</button>
            <button class="sd-btn ${btnCls(config.settings.buttonContinue)}" data-sd-action="act2-continue">Continue →</button>
          </div>
        </div>
        <div class="sd-ski-col sd-ski-col--sticky">
          <div class="sd-ski-panel">
            <div class="sd-ski-panel-heading">Your ski, so far</div>
            ${renderSkiSVG(skiParams(state))}
          </div>
        </div>
      </div>
    </div>`;
}

// ── Act 3 ──────────────────────────────────────────────────────────────────────
function renderAct3(state, config) {
  const stabPos    = Math.round(state.stability * 100);
  const stabLabels = ['Stable', 'Balanced‑stable', 'Balanced‑light', 'Light'];
  const stabIdx    = Math.min(3, Math.round(state.stability * 3));

  const bindingItems = ['Alpine', 'Alpine Touring', 'Telemark', "I don't know"];
  const bindingHtml  = bindingItems.map(b => {
    const on = state.bindings === b;
    return `<button class="sd-radio${on?' is-on':''}"
        data-sd-action="bindings" data-value="${esc(b)}" aria-pressed="${on}">
        <span class="sd-radio-dot" aria-hidden="true"></span>${esc(b)}
      </button>`;
  }).join('');

  const stabStops = stabLabels.map((l, i) =>
    `<span${i === stabIdx ? ' class="is-active"' : ''}>${esc(l)}</span>`).join('');

  return `
    <div class="sd-act sd-act--3">
      <div class="sd-split">
        <div class="sd-form-col sd-form-col--scroll">
          <div class="sd-eyebrow">How should it feel?</div>
          <div class="sd-q-block">
            <h3 class="sd-h3">Stability vs Weight</h3>
            <div class="sd-slider-wrap">
              <div class="sd-slider">
                <div class="sd-track"></div>
                <div class="sd-ticks" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
                <div class="sd-knob" style="left:${stabPos}%" aria-hidden="true"></div>
                <input type="range" min="0" max="100" value="${stabPos}"
                  class="sd-range-input" data-sd-action="stability"
                  aria-label="Stability vs Weight" aria-valuetext="${esc(stabLabels[stabIdx])}"/>
              </div>
              <div class="sd-stops" aria-hidden="true">${stabStops}</div>
            </div>
            <p class="sd-hint" style="margin-top:10px">Slide toward "stable" for more damp and edge hold; toward "light" for a livelier feel.</p>
          </div>
          <hr class="sd-divider"/>
          <div class="sd-q-block">
            <h3 class="sd-h3">Your current skis</h3>
            <p class="sd-body">Tell us what you ride now — gives us a real reference point.</p>
            <div class="sd-grid-4" style="margin-bottom:14px">
              <div class="sd-field">
                <label class="sd-label" for="sd-ski-brand">Brand</label>
                <input id="sd-ski-brand" class="sd-input" type="text" placeholder="e.g. Wagner" value="${esc(state.currentSki.brand)}" data-sd-action="ski-brand"/>
              </div>
              <div class="sd-field">
                <label class="sd-label" for="sd-ski-model">Model</label>
                <input id="sd-ski-model" class="sd-input" type="text" placeholder="Pro Carve" value="${esc(state.currentSki.model)}" data-sd-action="ski-model"/>
              </div>
              <div class="sd-field">
                <label class="sd-label" for="sd-ski-year">Year</label>
                <input id="sd-ski-year" class="sd-input" type="text" placeholder="2022" inputmode="numeric" value="${esc(state.currentSki.year)}" data-sd-action="ski-year"/>
              </div>
              <div class="sd-field">
                <label class="sd-label" for="sd-ski-length">Length (cm)</label>
                <input id="sd-ski-length" class="sd-input" type="text" placeholder="178" inputmode="numeric" value="${esc(state.currentSki.length)}" data-sd-action="ski-length"/>
              </div>
            </div>
            <div class="sd-grid-2">
              <div class="sd-field">
                <label class="sd-label" for="sd-ski-likes">What do you like about these skis?</label>
                <textarea id="sd-ski-likes" class="sd-textarea" placeholder="Free text…" data-sd-action="ski-likes">${esc(state.currentSkiLikes)}</textarea>
              </div>
              <div class="sd-field">
                <label class="sd-label" for="sd-ski-improve">Where could they perform better?</label>
                <textarea id="sd-ski-improve" class="sd-textarea" placeholder="Free text…" data-sd-action="ski-improve">${esc(state.currentSkiImprovements)}</textarea>
              </div>
            </div>
          </div>
          <hr class="sd-divider"/>
          <div class="sd-q-block">
            <h3 class="sd-h3">Bindings</h3>
            <div class="sd-radio-group">${bindingHtml}</div>
          </div>
          <div class="sd-btn-row">
            <button class="sd-btn ${btnCls(config.settings.buttonBack)}" data-sd-action="back">← Back</button>
            <button class="sd-btn ${btnCls(config.settings.buttonContinue)}" data-sd-action="act3-continue"
              ${!state.bindings ? 'disabled aria-disabled="true"' : ''}>Continue →</button>
          </div>
        </div>
        <div class="sd-ski-col">
          <div class="sd-ski-panel">
            <div class="sd-ski-panel-heading">Your ski, so far</div>
            ${renderSkiSVG(skiParams(state))}
          </div>
        </div>
      </div>
    </div>`;
}

// ── Act 4 ──────────────────────────────────────────────────────────────────────
function renderAct4(state, config) {
  const copy  = config.copy || {};
  const hErr  = state.errors.height ? ' is-error' : '';
  const levels = ['Level I', 'Level II', 'Level III', 'III+'];
  const pillsHtml = levels.map(l => {
    const on = state.ability === l;
    return `<button class="sd-pill${on?' is-on':''}" data-sd-action="ability" data-value="${esc(l)}" aria-pressed="${on}">${esc(l)}</button>`;
  }).join('');

  const heightInputHtml = state.heightUnit === 'ft'
    ? `<div class="sd-height-imperial">
          <div class="sd-input-with-unit">
            <input id="sd-height" class="sd-input${hErr}" type="text" inputmode="numeric" placeholder="5" value="${esc(state.heightVal)}" data-sd-action="height"/>
            <span class="sd-input-unit-label" aria-hidden="true">ft</span>
          </div>
          <div class="sd-input-with-unit">
            <input id="sd-height-in" class="sd-input${hErr}" type="text" inputmode="numeric" placeholder="10" value="${esc(state.heightIn)}" data-sd-action="height-in"/>
            <span class="sd-input-unit-label" aria-hidden="true">in</span>
          </div>
        </div>`
    : `<div class="sd-input-with-unit">
          <input id="sd-height" class="sd-input${hErr}" type="text" inputmode="numeric" placeholder="178" value="${esc(state.heightVal)}" data-sd-action="height"/>
          <span class="sd-input-unit-label" aria-hidden="true">cm</span>
        </div>`;

  const wPlaceholder = state.weightUnit === 'lb' ? '165' : '75';

  return `
    <div class="sd-act sd-act--4">
      <div class="sd-split">
        <div class="sd-form-col">
          <div class="sd-eyebrow">A few personal details</div>
          <h1 class="sd-h1" style="font-size:clamp(22px,2.8vw,34px)">${esc(copy.gateCopy || 'Ready for some personal questions?')}</h1>
          <p class="sd-sub">These help us nail your spec.</p>
          <div class="sd-grid-2" style="margin-bottom:0">
            <div class="sd-field">
              <label class="sd-label" for="sd-height">Height</label>
              <div class="sd-unit-seg" role="group" aria-label="Height unit">
                <button class="sd-unit-seg-btn${state.heightUnit==='ft'?' is-on':''}" data-sd-action="height-unit" data-value="ft" aria-pressed="${state.heightUnit==='ft'}">ft / in</button>
                <button class="sd-unit-seg-btn${state.heightUnit==='cm'?' is-on':''}" data-sd-action="height-unit" data-value="cm" aria-pressed="${state.heightUnit==='cm'}">cm</button>
              </div>
              ${heightInputHtml}
              ${state.errors.height ? `<div class="sd-alert" role="alert">${esc(state.errors.height)}</div>` : ''}
            </div>
            <div class="sd-field">
              <label class="sd-label" for="sd-weight">Weight</label>
              <div class="sd-unit-seg" role="group" aria-label="Weight unit">
                <button class="sd-unit-seg-btn${state.weightUnit==='lb'?' is-on':''}" data-sd-action="weight-unit" data-value="lb" aria-pressed="${state.weightUnit==='lb'}">lb</button>
                <button class="sd-unit-seg-btn${state.weightUnit==='kg'?' is-on':''}" data-sd-action="weight-unit" data-value="kg" aria-pressed="${state.weightUnit==='kg'}">kg</button>
              </div>
              <div class="sd-input-with-unit">
                <input id="sd-weight" class="sd-input${state.errors.weight?' is-error':''}" type="text" inputmode="numeric"
                  placeholder="${wPlaceholder}" value="${esc(state.weightVal)}" data-sd-action="weight"/>
                <span class="sd-input-unit-label" aria-hidden="true">${esc(state.weightUnit)}</span>
              </div>
              ${state.errors.weight ? `<div class="sd-alert" role="alert">${esc(state.errors.weight)}</div>` : ''}
            </div>
            <div class="sd-field">
              <label class="sd-label" for="sd-age">Age <span class="sd-label-hint">Optional</span></label>
              <input id="sd-age" class="sd-input" type="text" placeholder="—" inputmode="numeric" value="${esc(state.age)}" data-sd-action="age"/>
            </div>
            <div class="sd-field">
              <label class="sd-label" for="sd-bsl">Boot Sole Length (BSL) <span class="sd-label-hint">Optional</span></label>
              <div class="sd-input-with-unit">
                <input id="sd-bsl" class="sd-input" type="text" placeholder="—" inputmode="numeric" value="${esc(state.bsl)}" data-sd-action="bsl"/>
                <span class="sd-input-unit-label" aria-hidden="true">mm</span>
              </div>
            </div>
          </div>
          <div class="sd-field" style="margin-top:16px">
            <label class="sd-label">Skier ability</label>
            <p class="sd-hint">Cautious, lower speeds (I) → aggressive, higher speeds (III+)</p>
            <div class="sd-pills" style="margin-top:8px">${pillsHtml}</div>
            ${state.errors.ability ? `<div class="sd-alert" role="alert">${esc(state.errors.ability)}</div>` : ''}
          </div>
          <div class="sd-field" style="margin-top:16px">
            <label class="sd-label" for="sd-notes">Anything else we should know? <span class="sd-label-hint">Optional</span></label>
            <textarea id="sd-notes" class="sd-textarea sd-textarea--tall" placeholder="Injuries, preferences, goals…" data-sd-action="notes">${esc(state.personalNotes)}</textarea>
          </div>
          <div class="sd-btn-row" style="margin-top:24px">
            <button class="sd-btn ${btnCls(config.settings.buttonBack)}" data-sd-action="back">← Back</button>
            <button class="sd-btn ${btnCls(config.settings.buttonContinue)}" data-sd-action="act4-continue">See my design →</button>
          </div>
        </div>
        <div class="sd-ski-col">
          <div class="sd-ski-panel">
            <div class="sd-ski-panel-heading">Scaled to you</div>
            ${renderSkiSVG(skiParams(state, 4))}
          </div>
        </div>
      </div>
    </div>`;
}

// ── Loading ────────────────────────────────────────────────────────────────────
function renderLoading(extended) {
  const hint = extended
    ? '<p class="sd-hint sd-loading-hint">Crafting your builds<span class="sd-loading-dots"><span>.</span><span>.</span><span>.</span></span></p>'
    : '<p class="sd-hint sd-loading-hint">Shaping your ski…</p>';
  return `
    <div class="sd-act sd-act--loading">
      <div class="sd-split">
        <div class="sd-loading-ski">
          <div class="sd-skel sd-skel--ski"></div>
          ${hint}
        </div>
        <div class="sd-loading-content">
          <div class="sd-skel sd-skel--title"></div>
          <div class="sd-skel-cards">
            <div class="sd-skel sd-skel--card"></div>
            <div class="sd-skel sd-skel--card"></div>
            <div class="sd-skel sd-skel--card"></div>
          </div>
          <div class="sd-skel sd-skel--block"></div>
          <div class="sd-skel-row">
            <div class="sd-skel sd-skel--half"></div>
            <div class="sd-skel sd-skel--half"></div>
          </div>
        </div>
      </div>
    </div>`;
}

// ── Act 5 ──────────────────────────────────────────────────────────────────────
function renderAct5(state, config, spec) {
  const personalities     = computePersonalities(state, spec, config.materials || []);
  const narratives        = state.personalityNarratives;
  const narrativesLoading = state.personalityNarrativesLoading && !narratives;
  const name              = state.name || 'you';
  const sel               = state.personality;

  const finalPersonalities = narratives
    ? personalities.map((p, i) => { const n = narratives[i]; return n ? Object.assign({}, p, { aiName: n.name, tagline: n.tagline, desc: n.desc }) : p; })
    : personalities;

  const p = finalPersonalities[sel];

  const pcards = finalPersonalities.map((pc, i) => {
    const on       = i === sel;
    const diffsHtml = pc.diffs.map(d =>
      `<div class="sd-p-diff"><span class="sd-p-dot" aria-hidden="true"></span>${esc(d)}</div>`).join('');
    const cardName  = pc.aiName || `Personality ${i + 1}`;
    const nameHtml  = narrativesLoading
      ? '<div class="sd-skel" style="height:1.3em;width:70%;margin-bottom:6px;border-radius:4px"></div>'
      : `<h3 class="sd-h3">${esc(cardName)}</h3>`;
    const taglineHtml = narrativesLoading
      ? '<div class="sd-skel" style="height:0.9em;width:88%;margin-bottom:12px;border-radius:4px"></div>'
      : `<p class="sd-body" style="margin-bottom:12px">${esc(pc.tagline)}</p>`;
    return `
      <div class="sd-personality-card${on?' is-selected':''}" data-sd-action="personality" data-value="${i}">
        <div class="sd-p-tag">ride personality ${i + 1}</div>
        ${nameHtml}
        ${taglineHtml}
        <div class="sd-p-diffs">
          <div class="sd-p-diffs-label">What's different</div>
          ${diffsHtml}
        </div>
        <button class="sd-btn ${on ? btnCls(config.settings.buttonContinue) : btnCls(config.settings.buttonBack)} sd-btn--sm"
          data-sd-action="personality" data-value="${i}" style="margin-top:auto;width:100%">
          ${on ? '✓ Selected' : 'Select'}
        </button>
      </div>`;
  }).join('');

  let constructionStr = spec.construction;
  if (p.selectedMaterials) {
    const matParts = [];
    const coreM = p.selectedMaterials['core'], lamM = p.selectedMaterials['laminate'];
    if (coreM) matParts.push(coreM.name);
    if (lamM)  matParts.push(lamM.name);
    if (matParts.length) constructionStr = matParts.join(' · ');
  }
  const specRows = [
    ['Length range',   `${spec.lengthRange[0]} – ${spec.lengthRange[1]} cm`],
    ['Waist width',    `${spec.waistRange[0]} – ${spec.waistRange[1]} mm`],
    ['Sidecut radius', spec.sidecut],
    ['Tip design',     spec.tipDesign],
    ['Tail design',    spec.tailDesign],
    ['Construction',   constructionStr],
    ['Camber',         spec.camber],
  ];
  if (config.showPackages) specRows.push(['Recommended package', spec.pkg]);

  const specHtml = specRows.map(r => `
    <div class="sd-spec-row">
      <span class="sd-spec-key">${esc(r[0])}</span>
      <span class="sd-spec-val">${esc(r[1])}</span>
    </div>`).join('');

  const camberPills = ['Low', 'Medium', 'High'];
  const camberHtml  = camberPills.map(l => {
    const on = state.selectedCamber === l.toLowerCase();
    return `<button class="sd-pill${on?' is-on':''}" data-sd-action="camber" data-value="${l.toLowerCase()}" aria-pressed="${on}">${esc(l)}</button>`;
  }).join('');

  const lMin = spec.lengthRange[0], lMax = spec.lengthRange[1];
  const wMin = spec.waistRange[0],  wMax = spec.waistRange[1];
  const lPos = lMax > lMin ? Math.round((state.selectedLength - lMin) / (lMax - lMin) * 100) : 50;
  const wPos = wMax > wMin ? Math.round((state.selectedWaist  - wMin) / (wMax - wMin) * 100) : 50;

  const cats           = config.graphicCategories?.length ? config.graphicCategories : [{ name: 'House Graphics' }, { name: 'Artist Series' }, { name: 'James Niehues' }, { name: 'Wood Veneers' }];
  const featuredGraphics = config.featuredGraphics?.length ? config.featuredGraphics : [];
  let graphicStrip     = '';
  for (let gfi = 0; gfi < 5; gfi++) {
    const gfx = featuredGraphics[gfi];
    graphicStrip += `<div class="sd-graphic-tile${gfi===0?' is-selected':''}"${gfx?.title?` title="${esc(gfx.title)}"`:''}>
        ${gfx?.image ? `<img src="${esc(gfx.image)}" alt="${esc(gfx.title||'')}" loading="lazy" class="sd-graphic-tile-img">` : '<div class="sd-graphic-placeholder"></div>'}
      </div>`;
  }
  graphicStrip += '<button class="sd-graphic-all" data-sd-action="open-graphics">+ All</button>';

  const activePF  = state._activePlayField;
  const lDelta    = state.selectedLength - (state._recLength || spec.lengthMid);
  const lDeltaMsg = activePF === 'length' && lDelta !== 0
                  ? (lDelta < 0 ? SD_FIELD_INFO.length.shorter(lDelta) : SD_FIELD_INFO.length.longer(lDelta)) : '';
  const wDelta    = state.selectedWaist - (state._recWaist || spec.waistMid);
  const wDeltaMsg = activePF === 'waist' && wDelta !== 0
                  ? (wDelta < 0 ? SD_FIELD_INFO.waist.narrower(wDelta) : SD_FIELD_INFO.waist.wider(wDelta)) : '';
  const recCamber = state._recCamber || 'medium';
  const cDeltaMsg = activePF === 'camber' && state.selectedCamber !== recCamber
                  ? (SD_FIELD_INFO.camber[state.selectedCamber] || '') : '';

  return `
    <div class="sd-act sd-act--5">
      <div class="sd-split sd-split--act5">
        <div class="sd-hero-ski-col">
          <div class="sd-eyebrow" style="margin-bottom:8px">${esc(name)} — here's the ski we'd build for you</div>
          ${renderSkiSVG(skiParams(state, 5))}
          <div class="sd-hero-tags">
            ${config.showPackages ? `<span class="sd-tag">${esc(spec.pkg)} package</span>` : ''}
            <span class="sd-tag">${state.selectedLength} cm · ${state.selectedWaist} mm</span>
          </div>
          <div style="display:flex;justify-content:center;margin-top:12px">
            <button class="sd-btn sd-btn--ghost sd-btn--sm" data-sd-action="open-graphics">◇ Explore topsheet graphics →</button>
          </div>
        </div>
        <div class="sd-design-col">
          <div class="sd-btn-row" style="margin-bottom:20px">
            <button class="sd-btn ${btnCls(config.settings.buttonBack)} sd-btn--sm" data-sd-action="back">← Edit answers</button>
          </div>
          <div>
            <h2 class="sd-h2">Three ways this ski could ride</h2>
            <p class="sd-body">Pick the personality that sounds most like you.</p>
          </div>
          <div class="sd-personality-grid">${pcards}</div>
          <div class="sd-desc-block">
            ${narrativesLoading
              ? '<div class="sd-skel" style="height:0.85em;width:52%;margin-bottom:8px;border-radius:4px"></div>'
              : `<div class="sd-eyebrow">${esc(p.aiName || `Personality ${sel + 1}`)} — in your skier's words</div>`}
            ${narrativesLoading
              ? '<div class="sd-skel" style="height:3.5em;border-radius:4px" aria-label="Generating description…"></div>'
              : `<p class="sd-body" style="line-height:1.65">${esc(p.desc)}</p>`}
          </div>
          <div class="sd-2col-grid">
            <div class="sd-spec-sheet">
              <div class="sd-spec-head"><span class="sd-eyebrow" style="margin:0">Recommended spec — ranges, not fixed</span></div>
              ${specHtml}
            </div>
            <div class="sd-explore-controls">
              <div class="sd-eyebrow">Play with it</div>
              <div class="sd-field">
                <div class="sd-label-row">
                  <label class="sd-label">Length — ${state.selectedLength} cm</label>
                  <button class="sd-info-btn" data-sd-action="toggle-tip" aria-label="About ski length" tabindex="0">ⓘ</button>
                  <div class="sd-tooltip" role="tooltip">${SD_FIELD_INFO.length.info}</div>
                </div>
                <div class="sd-slider-wrap"><div class="sd-slider">
                  <div class="sd-track"></div>
                  <div class="sd-fillbar" style="width:${lPos}%"></div>
                  <div class="sd-knob" style="left:${lPos}%" aria-hidden="true"></div>
                  <input type="range" min="${lMin}" max="${lMax}" value="${state.selectedLength}" class="sd-range-input" data-sd-action="selected-length" aria-label="Ski length"/>
                </div><div class="sd-stops"><span>${lMin}</span><span>${lMax}</span></div></div>
                <div class="sd-delta-msg" data-sd-delta="length">${esc(lDeltaMsg)}</div>
              </div>
              <div class="sd-field">
                <div class="sd-label-row">
                  <label class="sd-label">Waist width — ${state.selectedWaist} mm</label>
                  <button class="sd-info-btn" data-sd-action="toggle-tip" aria-label="About waist width" tabindex="0">ⓘ</button>
                  <div class="sd-tooltip" role="tooltip">${SD_FIELD_INFO.waist.info}</div>
                </div>
                <div class="sd-slider-wrap"><div class="sd-slider">
                  <div class="sd-track"></div>
                  <div class="sd-fillbar" style="width:${wPos}%"></div>
                  <div class="sd-knob" style="left:${wPos}%" aria-hidden="true"></div>
                  <input type="range" min="${wMin}" max="${wMax}" value="${state.selectedWaist}" class="sd-range-input" data-sd-action="selected-waist" aria-label="Waist width"/>
                </div><div class="sd-stops"><span>${wMin}</span><span>${wMax}</span></div></div>
                <div class="sd-delta-msg" data-sd-delta="waist">${esc(wDeltaMsg)}</div>
              </div>
              <div class="sd-field">
                <div class="sd-label-row" style="margin-bottom:8px">
                  <div class="sd-label">Camber</div>
                  <button class="sd-info-btn" data-sd-action="toggle-tip" aria-label="About camber" tabindex="0">ⓘ</button>
                  <div class="sd-tooltip" role="tooltip">${SD_FIELD_INFO.camber.info}</div>
                </div>
                <div class="sd-pills">${camberHtml}</div>
                ${cDeltaMsg ? `<div class="sd-delta-msg">${esc(cDeltaMsg)}</div>` : ''}
              </div>
              <div class="sd-field">
                <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
                  <div class="sd-label-row">
                    <div class="sd-label">Topsheet graphic</div>
                    <button class="sd-info-btn" data-sd-action="toggle-tip" aria-label="About topsheet graphics" tabindex="0">ⓘ</button>
                    <div class="sd-tooltip" role="tooltip">${SD_FIELD_INFO.graphic.info}</div>
                  </div>
                  <button class="sd-link" data-sd-action="open-graphics">Explore graphics →</button>
                </div>
                <div class="sd-hint" style="margin-bottom:8px">Featured · ${esc(cats[0].name)}</div>
                <div class="sd-graphic-strip">${graphicStrip}</div>
              </div>
            </div>
          </div>
          <div class="sd-cta-row">
            <button class="sd-btn ${btnCls(config.settings.buttonContinue)} sd-btn--lg" data-sd-action="open-book">Book my design call</button>
            <button class="sd-btn ${btnCls(config.settings.buttonCta)} sd-btn--lg" data-sd-action="open-save">Email me this design</button>
          </div>
        </div>
      </div>
      <div class="sd-sticky-cta">
        <button class="sd-btn ${btnCls(config.settings.buttonContinue)} sd-btn--block" data-sd-action="open-book">Book my design call</button>
        <button class="sd-btn sd-btn--link" data-sd-action="open-save">Email me this design</button>
      </div>
    </div>`;
}

// ── Save modal ─────────────────────────────────────────────────────────────────
function renderSaveModal(state, config) {
  const copy = config.copy || {};
  let body;
  if (state.saveState === 'saved') {
    body = `
      <div class="sd-modal-confirm">
        <div class="sd-confirm-icon" aria-hidden="true">✓</div>
        <h3 class="sd-h3">Saved. Check your inbox.</h3>
        <p class="sd-body">We've emailed your design to ${esc(state.email)}.</p>
        <button class="sd-btn ${btnCls(config.settings.buttonBack)}" data-sd-action="close-save">Done</button>
      </div>`;
  } else {
    const errHtml = state.errors.email
      ? `<div class="sd-alert" role="alert">${esc(state.errors.email)}</div>` : '';
    body = `
      <div class="sd-field">
        <label class="sd-label" for="sd-email">Email address</label>
        <input id="sd-email" class="sd-input${state.errors.email?' is-error':''}"
          type="email" inputmode="email" autocomplete="email" placeholder="you@email.com"
          value="${esc(state.email)}" data-sd-action="email"/>
        ${errHtml}
      </div>
      <label class="sd-check-row">
        <input type="checkbox" class="sd-checkbox" data-sd-action="klaviyo-opt"${state.klaviyoOptIn?' checked':''}/>
        <span class="sd-body">Send me occasional ski news and offers.</span>
      </label>
      <button class="sd-btn ${btnCls(config.settings.buttonContinue)} sd-btn--block" data-sd-action="save-submit"
        ${state.saveState==='saving'?' disabled':''}>
        ${state.saveState==='saving' ? 'Saving…' : 'Save and email me'}
      </button>
      <div style="text-align:center">
        <button class="sd-btn sd-btn--link" data-sd-action="close-save">Maybe later</button>
      </div>`;
  }
  const subCopy = copy.emailSaveCopy
    ? `<p class="sd-modal-sub">${esc(copy.emailSaveCopy)}</p>` : '';
  return `
    <div class="sd-modal-backdrop" data-sd-action="close-save">
      <div class="sd-modal" role="dialog" aria-modal="true" aria-label="Email me this design" data-sd-modal>
        <div class="sd-modal-header">
          <div><h3 class="sd-h3">Email me this design</h3>${subCopy}</div>
          <button class="sd-modal-close" data-sd-action="close-save" aria-label="Close">×</button>
        </div>
        <div class="sd-modal-body">${body}</div>
      </div>
    </div>`;
}

// ── render ─────────────────────────────────────────────────────────────────────
function render(root, state, config) {
  let spec = null;
  if (state.act === 5) {
    spec = computeSpec(state);
    if (!state._specInited) {
      state.selectedLength    = spec.lengthMid;
      state.selectedWaist     = spec.waistMid;
      state._recLength        = spec.lengthMid;
      state._recWaist         = spec.waistMid;
      state._recCamber        = 'medium';
      state._activePlayField  = null;
      state._specInited       = true;
    }
  }

  let actHtml = '';
  if (state.loading) {
    actHtml = renderLoading(state.loadingExtended);
  } else {
    switch (state.act) {
      case 1: actHtml = renderAct1(state, config); break;
      case 2: actHtml = renderAct2(state, config); break;
      case 3: actHtml = renderAct3(state, config); break;
      case 4: actHtml = renderAct4(state, config); break;
      case 5: actHtml = renderAct5(state, config, spec); break;
    }
  }

  const resumeCopy = state.resumeSource === 'url'
    ? "We've reopened your saved design — pick up right where you left off."
    : 'We saved your progress. Continue where you left off.';
  const resumeHtml = state.resumeBanner ? `
    <div class="sd-resume-banner">
      <span class="sd-resume-icon" aria-hidden="true">↩</span>
      <span class="sd-body"><strong>Welcome back${state.name ? ', ' + esc(state.name) : ''}.</strong> ${resumeCopy}</span>
      <button class="sd-resume-close" data-sd-action="close-resume" aria-label="Dismiss">×</button>
    </div>` : '';

  const modalsHtml = state.saveModalOpen ? renderSaveModal(state, config) : '';

  const activeId  = document.activeElement && root.contains(document.activeElement) ? document.activeElement.id : null;
  const selStart  = activeId && document.activeElement.tagName === 'INPUT' ? document.activeElement.selectionStart : null;
  const selEnd    = activeId && document.activeElement.tagName === 'INPUT' ? document.activeElement.selectionEnd   : null;
  const scrollTop = root.scrollTop;
  const prevDesignCol = root.querySelector('.sd-design-col');
  const designColScrollTop = prevDesignCol ? prevDesignCol.scrollTop : 0;

  root.innerHTML =
    resumeHtml +
    renderSubHeader(state, config.copy || {}) +
    `<div class="sd-acts-wrap">${actHtml}</div>` +
    modalsHtml;

  root.scrollTop = scrollTop;
  if (designColScrollTop) {
    const newDesignCol = root.querySelector('.sd-design-col');
    if (newDesignCol) newDesignCol.scrollTop = designColScrollTop;
  }
  if (activeId) {
    const el = root.querySelector('#' + activeId);
    if (el) {
      el.focus();
      if (selStart !== null) { try { el.setSelectionRange(selStart, selEnd); } catch (e) {} }
    }
  }
}

// ── event handling ─────────────────────────────────────────────────────────────
function dispatch(e, root, state, config, scheduleRender) {
  const target = e.target.closest('[data-sd-action]');
  if (!target) return;

  const action = target.dataset.sdAction;
  if (action === 'close-save' && e.target.closest('[data-sd-modal]')) {
    if (!target.classList.contains('sd-modal-close') && !target.classList.contains('sd-modal-backdrop')) return;
  }

  const value = target.dataset.value;

  switch (action) {
    case 'name': {
      state.name = target.value;
      const btn = root.querySelector('[data-sd-action="act1-continue"]');
      if (btn) { btn.disabled = !state.name.trim(); btn.setAttribute('aria-disabled', btn.disabled ? 'true' : 'false'); }
      return;
    }
    case 'act1-continue':
      if (!state.name.trim()) { state.errors.name = 'We just need a first name to continue.'; }
      else { state.errors = {}; state.act = 2; root.scrollTo(0, 0); }
      break;

    case 'back':
      if (state.act === 5) { state.personalityNarratives = null; state.personalityNarrativesLoading = false; state._specInited = false; state._activePlayField = null; }
      if (state.act > 1)   { state.act--; state.errors = {}; root.scrollTo(0, 0); }
      return scheduleRender();

    case 'toggle-region': {
      const idx = state.regions.indexOf(value);
      if (idx >= 0) state.regions.splice(idx, 1);
      else if (state.regions.length < 3) state.regions.push(value);
      if (state.regions.length > 0) delete state.errors.regions;
      break;
    }
    case 'toggle-daytype': {
      const idx = state.dayTypes.indexOf(value);
      if (idx >= 0) state.dayTypes.splice(idx, 1);
      else state.dayTypes.push(value);
      if (state.dayTypes.length > 0) delete state.errors.dayTypes;
      break;
    }
    case 'toggle-terrain': {
      const idx = state.terrain.indexOf(value);
      if (idx >= 0) state.terrain.splice(idx, 1);
      else if (state.terrain.length < 3) state.terrain.push(value);
      if (state.terrain.length > 0) delete state.errors.terrain;
      break;
    }
    case 'act2-continue': {
      const errs = {};
      if (!state.regions.length)  errs.regions  = 'Pick at least one region where you ski.';
      if (!state.dayTypes.length) errs.dayTypes  = 'Choose at least one type of day.';
      if (!state.terrain.length)  errs.terrain   = 'Pick at least one type of terrain.';
      if (Object.keys(errs).length) { state.errors = errs; break; }
      state.errors = {};
      state.act    = 3;
      root.scrollTo(0, 0);
      break;
    }
    case 'stability':
      state.stability = parseInt(target.value, 10) / 100;
      break;

    case 'ski-brand':   state.currentSki = Object.assign({}, state.currentSki, { brand:  target.value }); return;
    case 'ski-model':   state.currentSki = Object.assign({}, state.currentSki, { model:  target.value }); return;
    case 'ski-year':    state.currentSki = Object.assign({}, state.currentSki, { year:   target.value }); return;
    case 'ski-length':  state.currentSki = Object.assign({}, state.currentSki, { length: target.value }); return;
    case 'ski-likes':   state.currentSkiLikes        = target.value; return;
    case 'ski-improve': state.currentSkiImprovements = target.value; return;

    case 'bindings':      state.bindings = value; break;
    case 'act3-continue': state.act = 4; state.errors = {}; root.scrollTo(0, 0); break;

    case 'height':      state.heightVal  = target.value; if (state.errors.height) delete state.errors.height; return;
    case 'height-in':   state.heightIn   = target.value; if (state.errors.height) delete state.errors.height; return;
    case 'height-unit':
      if (value !== state.heightUnit) { state.heightUnit = value; state.heightVal = ''; state.heightIn = ''; delete state.errors.height; }
      break;
    case 'weight':      state.weightVal  = target.value; if (state.errors.weight) delete state.errors.weight; return;
    case 'weight-unit':
      if (value !== state.weightUnit) { state.weightUnit = value; state.weightVal = ''; delete state.errors.weight; }
      break;
    case 'age':         state.age           = target.value; return;
    case 'bsl':         state.bsl           = target.value; return;
    case 'ability':     state.ability       = value; delete state.errors.ability; break;
    case 'notes':       state.personalNotes = target.value; return;

    case 'act4-continue': {
      const errs = {};
      const hasHeight = state.heightUnit === 'ft'
        ? (parseFloat(state.heightVal) > 0 || parseFloat(state.heightIn) > 0)
        : parseFloat(state.heightVal) > 0;
      if (!hasHeight) errs.height = 'Please enter your height.';
      if (!state.weightVal || parseFloat(state.weightVal) <= 0) errs.weight = 'Please enter your weight.';
      if (!state.ability) errs.ability = 'Please select your skier ability level.';
      if (Object.keys(errs).length) { state.errors = errs; break; }

      state.loading = true; state.loadingExtended = false; state.errors = {};
      state.personalityNarratives = null; state.personalityNarrativesLoading = false;
      scheduleRender();
      root.scrollTo(0, 0);

      const gate = { timer: false, fetch: false };
      const tryTransition = () => {
        if (!gate.timer || !gate.fetch) return;
        state.loading = false; state.loadingExtended = false;
        state.act = 5; state._specInited = false;
        scheduleRender();
        fireAnalytics('act_transition', { to: 5 });
      };
      setTimeout(() => {
        gate.timer = true;
        if (!gate.fetch) { state.loadingExtended = true; scheduleRender(); }
        tryTransition();
      }, 2200);
      fetchPersonalityNarratives(state, config, () => { gate.fetch = true; tryTransition(); });
      return;
    }

    case 'personality':     state.personality    = parseInt(value, 10); break;
    case 'camber':          state._activePlayField = 'camber'; state.selectedCamber = value; break;
    case 'selected-length': state._activePlayField = 'length'; state.selectedLength = parseInt(target.value, 10); break;
    case 'selected-waist':  state._activePlayField = 'waist';  state.selectedWaist  = parseInt(target.value, 10); break;

    case 'toggle-tip': {
      const row = target.closest('.sd-label-row');
      const wasOpen = row?.classList.contains('is-open');
      root.querySelectorAll('.sd-label-row.is-open').forEach(r => r.classList.remove('is-open'));
      if (!wasOpen && row) row.classList.add('is-open');
      return;
    }

    case 'open-save':  state.saveModalOpen = true;  state.saveState = 'idle'; state.errors = {}; break;
    case 'close-save': state.saveModalOpen = false; state.errors = {}; break;

    case 'open-book': {
      const bookDlg = document.getElementById('sd-book-dialog');
      if (bookDlg) {
        const spec2    = state.act === 5 ? computeSpec(state) : null;
        const pkg      = spec2?.pkg || 'Silver';
        const summary  = `${pkg} package · ${state.selectedLength} cm · ${state.selectedWaist} mm waist · ${state.selectedCamber} camber · Personality ${state.personality + 1}`;
        const summaryEl = bookDlg.querySelector('.sd-book-dialog__summary');
        if (summaryEl) summaryEl.textContent = summary;
        const iframeEl = document.getElementById('sd-book-iframe');
        if (iframeEl) {
          const baseUrl = iframeEl.src.split('?')[0];
          iframeEl.src  = `${baseUrl}?sd_design=${encodeURIComponent(summary)}`;
        }
        bookDlg.showDialog();
      }
      return;
    }
    case 'close-book': {
      const bookDlg = document.getElementById('sd-book-dialog');
      if (bookDlg) bookDlg.closeDialog();
      return;
    }
    case 'open-graphics': {
      const gvOverlay = document.getElementById('sd-graphics-overlay');
      if (gvOverlay) {
        gvOverlay.hidden = false;
        document.body.style.overflow = 'hidden';
        const closeBtn = gvOverlay.querySelector('[data-sd-gv-close]');
        if (closeBtn) closeBtn.focus();
      }
      return;
    }

    case 'email':       state.email       = target.value;   return;
    case 'klaviyo-opt': state.klaviyoOptIn = target.checked; return;
    case 'save-submit': handleSave(state, config, scheduleRender); return;
    case 'close-resume': state.resumeBanner = false; break;

    default: return;
  }

  scheduleRender();
}

function handleSave(state, config, scheduleRender) {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(state.email)) {
    state.errors = { email: 'Enter a valid email address.' };
    scheduleRender();
    return;
  }
  state.errors = {}; state.saveState = 'saving';
  scheduleRender();
  fireAnalytics('save_design', { klaviyo_opt: state.klaviyoOptIn });

  const apiBase = window.SkierDNAApiBase || '';
  if (apiBase) {
    const spec = computeSpec(state);
    fetch(`${apiBase}/api/designs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: state.email, klaviyo_opt: state.klaviyoOptIn,
        klaviyo_list_id: config.settings?.klaviyoListId || '',
        name: state.name, spec, personality: state.personality,
        answers: { regions: state.regions, dayTypes: state.dayTypes, terrain: state.terrain, stability: state.stability, bindings: state.bindings, height: state.heightVal, weight: state.weightVal, ability: state.ability },
      }),
    })
      .then(r => r.json())
      .then(data => { state.saveState = 'saved'; if (data.design_id) state.designId = data.design_id; clearSession(); scheduleRender(); })
      .catch(() => { state.saveState = 'saved'; clearSession(); scheduleRender(); });
  } else {
    setTimeout(() => { state.saveState = 'saved'; clearSession(); scheduleRender(); }, 600);
  }
}

function fireAnalytics(event, data) {
  if (typeof window.gtag === 'function') window.gtag('event', `skier_dna_${event}`, Object.assign({ event_category: 'skier_dna' }, data || {}));
  if (window.dataLayer) window.dataLayer.push(Object.assign({ event: `skier_dna_${event}` }, data || {}));
}

// ── AI personality narratives ──────────────────────────────────────────────────
function fetchPersonalityNarratives(state, config, onSettled) {
  const url = config.settings?.personalitiesUrl;
  if (!url) { if (onSettled) onSettled(); return; }
  state.personalityNarrativesLoading = true;

  const spec          = computeSpec(state);
  const personalities = computePersonalities(state, spec, config.materials || []);

  const builds = personalities.map(p => {
    const materials = [];
    Object.entries(p.selectedMaterials || {}).forEach(([cat, m]) => {
      if (m) materials.push({ category: cat, name: m.name, tags: m.personality_tags || [] });
    });
    return { id: p.id, materials };
  });

  const payload = {
    skier: {
      name:       state.name,
      regions:    state.regions,
      dayTypes:   state.dayTypes,
      terrain:    state.terrain,
      stability:  state.stability,
      ability:    state.ability,
      height: state.heightUnit === 'ft'
        ? (state.heightVal ? `${state.heightVal}ft${state.heightIn ? ' ' + state.heightIn + 'in' : ''}` : '')
        : (state.heightVal ? `${state.heightVal}cm` : ''),
      weight: state.weightVal ? `${state.weightVal}${state.weightUnit}` : '',
      currentSki: [
        state.currentSki?.brand,
        state.currentSki?.model,
        state.currentSki?.year,
        state.currentSki?.length ? state.currentSki.length + 'mm' : '',
      ].filter(Boolean).join(' ') || '',
      currentSkiLikes:        state.currentSkiLikes        || '',
      currentSkiImprovements: state.currentSkiImprovements || '',
      personalNotes:          state.personalNotes          || '',
    },
    builds,
  };

  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then(res => res.json())
    .then(data => {
      state.personalityNarrativesLoading = false;
      if (data?.personalities?.length === 3) state.personalityNarratives = data.personalities;
      if (onSettled) onSettled();
    })
    .catch(err => {
      state.personalityNarrativesLoading = false;
      console.warn('[SkierDNA] personality narratives unavailable', err);
      if (onSettled) onSettled();
    });
}

// ── mount ──────────────────────────────────────────────────────────────────────
function boot(root) {
  if (!root || root.dataset.sdBooted) return;
  root.dataset.sdBooted = '1';

  const cfgEl  = root.querySelector('script[data-skier-dna-config]');
  let config   = {};
  try { config = JSON.parse(cfgEl ? cfgEl.textContent : '{}'); }
  catch (e) { console.error('[SkierDNA] bad config JSON', e); }

  const settings = {
    calendlyUrl:        root.dataset.calendlyUrl        || '',
    klaviyoListId:      root.dataset.klaviyoList         || '',
    showPackages:       root.dataset.showPackages       !== 'false',
    trueScaleAnchor:    root.dataset.trueScale          !== 'false',
    graphicsCollection: root.dataset.graphicsCollection || null,
    personalitiesUrl:   root.dataset.personalitiesUrl   || '',
    buttonContinue:     root.dataset.btnContinue        || 'theme_primary',
    buttonBack:         root.dataset.btnBack            || 'theme_secondary',
    buttonCta:          root.dataset.btnCta             || 'theme_secondary',
  };
  config.settings    = settings;
  config.showPackages = settings.showPackages;

  const state = makeState();

  // Resume from saved-design email link (?sd_design=)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('sd_design')) {
    state.resumeBanner = true;
    state.resumeSource = 'url';
    state.act          = 5;
  } else {
    const saved = loadSession();
    if (saved) {
      PERSIST_KEYS.forEach(k => { if (saved[k] !== undefined) state[k] = saved[k]; });
      if (state.act > 1) { state.resumeBanner = true; state.resumeSource = 'local'; }
    }
  }

  // rAF-throttled render — saves session after every paint
  let pending = false;
  const scheduleRender = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; render(root, state, config); saveSession(state); });
  };

  render(root, state, config);

  const signal = root._sdAbort?.signal;

  // Event delegation — clicks
  root.addEventListener('click', e => {
    const actionTarget = e.target.closest('[data-sd-action]');
    if (actionTarget && actionTarget.tagName !== 'A') e.preventDefault();
    dispatch(e, root, state, config, scheduleRender);
  });

  // input / change (sliders, text inputs, checkboxes)
  root.addEventListener('input', e => {
    const t = e.target, action = t.dataset.sdAction;
    if (!action) return;
    if (action === 'stability' || action === 'selected-length' || action === 'selected-waist') {
      const min = parseFloat(t.min) || 0, max = parseFloat(t.max) || 100;
      const pct = max > min ? ((parseFloat(t.value) - min) / (max - min)) * 100 : 50;
      const slider = t.closest('.sd-slider');
      if (slider) {
        const knob = slider.querySelector('.sd-knob');
        const fill = slider.querySelector('.sd-fillbar');
        if (knob) knob.style.left  = `${pct}%`;
        if (fill) fill.style.width = `${pct}%`;
      }
      if (action === 'stability') {
        state.stability = parseFloat(t.value) / 100;
      } else if (action === 'selected-length') {
        state._activePlayField = 'length';
        state.selectedLength = parseInt(t.value, 10);
        const recL  = state._recLength || computeSpec(state).lengthMid;
        const dL    = state.selectedLength - recL;
        const elL   = root.querySelector('[data-sd-delta="length"]');
        if (elL) elL.textContent = dL < 0 ? SD_FIELD_INFO.length.shorter(dL)
                                 : dL > 0 ? SD_FIELD_INFO.length.longer(dL) : '';
        const elW   = root.querySelector('[data-sd-delta="waist"]');
        if (elW) elW.textContent = '';
      } else if (action === 'selected-waist') {
        state._activePlayField = 'waist';
        state.selectedWaist = parseInt(t.value, 10);
        const recW  = state._recWaist || computeSpec(state).waistMid;
        const dW    = state.selectedWaist - recW;
        const elW   = root.querySelector('[data-sd-delta="waist"]');
        if (elW) elW.textContent = dW < 0 ? SD_FIELD_INFO.waist.narrower(dW)
                                 : dW > 0 ? SD_FIELD_INFO.waist.wider(dW) : '';
        const elL   = root.querySelector('[data-sd-delta="length"]');
        if (elL) elL.textContent = '';
      }
      return;
    }
    dispatch({ target: t, type: 'input' }, root, state, config, scheduleRender);
  });

  root.addEventListener('change', e => {
    const t = e.target;
    if (!t.dataset.sdAction) return;
    dispatch({ target: t, type: 'change' }, root, state, config, scheduleRender);
  });

  // Close info tooltips when tapping/clicking outside, or when mouse leaves the row
  document.addEventListener('pointerdown', e => {
    if (!e.target.closest('.sd-label-row')) {
      root.querySelectorAll('.sd-label-row.is-open').forEach(r => r.classList.remove('is-open'));
    }
  }, { signal });
  root.addEventListener('mouseleave', e => {
    if (e.target.classList?.contains('sd-label-row')) e.target.classList.remove('is-open');
  }, { capture: true, signal });

  // Graphics overlay close — AbortController cleans this up on disconnectedCallback
  const gvOverlay = document.getElementById('sd-graphics-overlay');
  if (gvOverlay) {
    const closeGvOverlay = () => { gvOverlay.hidden = true; document.body.style.overflow = ''; };
    gvOverlay.addEventListener('click', e => { if (e.target.closest('[data-sd-gv-close]')) closeGvOverlay(); }, { signal });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !gvOverlay.hidden) closeGvOverlay(); }, { signal });
  }
}

// ── custom element ─────────────────────────────────────────────────────────────
class SkierDNAIsland extends HTMLElement {
  connectedCallback() {
    this._sdAbort = new AbortController();
    boot(this);
  }
  disconnectedCallback() {
    this._sdAbort?.abort();
    this.dataset.sdBooted = '';
  }
}
customElements.define('skier-dna-island', SkierDNAIsland);
