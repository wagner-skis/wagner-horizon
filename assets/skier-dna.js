// @ts-nocheck
/* =============================================================================
 * Skier DNA — client island
 * Reads ALL config from the Liquid section (data-* attrs + JSON script tag).
 * Five-act state machine + layered SVG ski. No framework, no build step.
 * Style only with var(--sd-*) custom properties — never hardcoded values.
 * ============================================================================= */
(function () {
  'use strict';

  // ── helpers ──────────────────────────────────────────────────────────────
  function esc(v) {
    if (v == null) return '';
    return String(v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── session persistence ───────────────────────────────────────────────────
  var STORAGE_KEY = 'sd_dna_v1';
  var PERSIST_KEYS = [
    'act', 'name', 'regions', 'dayTypes', 'terrain', 'stability',
    'currentSki', 'currentSkiLikes', 'currentSkiImprovements',
    'bindings', 'heightVal', 'heightUnit', 'weightVal', 'weightUnit',
    'age', 'bsl', 'ability', 'personalNotes',
    'personality', 'selectedLength', 'selectedWaist', 'selectedCamber',
    'designId', '_specInited', 'personalityNarratives',
  ];

  function saveSession(state) {
    try {
      var data = { ts: Date.now() };
      PERSIST_KEYS.forEach(function (k) { data[k] = state[k]; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function loadSession() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      var THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
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

  // ── initial state ─────────────────────────────────────────────────────────
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
      heightVal: '', heightUnit: 'ft',
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
      saveModalOpen: false, bookModalOpen: false,
      resumeBanner: false,
      resumeSource: '',
      errors: {},
      _specInited: false,
      designId: null,
    };
  }

  // ── ski SVG ───────────────────────────────────────────────────────────────
  function skiOutlinePath(sh, wa, ta, cx) {
    var r = function (w) { return cx + w; };
    var l = function (w) { return cx - w; };
    return [
      'M ' + cx + ' 22',
      'C ' + cx + ' 40 ' + r(sh) + ' 56 ' + r(sh) + ' 80',
      'C ' + r(sh) + ' 152 ' + r(wa) + ' 212 ' + r(wa) + ' 290',
      'C ' + r(wa) + ' 382 ' + r(ta) + ' 432 ' + r(ta) + ' 500',
      'C ' + r(ta) + ' 520 ' + r(4) + ' 532 ' + r(4) + ' 542',
      'L ' + l(4) + ' 542',
      'C ' + l(4) + ' 532 ' + l(ta) + ' 520 ' + l(ta) + ' 500',
      'C ' + l(ta) + ' 432 ' + l(wa) + ' 382 ' + l(wa) + ' 290',
      'C ' + l(wa) + ' 212 ' + l(sh) + ' 152 ' + l(sh) + ' 80',
      'C ' + l(sh) + ' 56 ' + cx + ' 40 ' + cx + ' 22 Z',
    ].join(' ');
  }

  function skiProfilePath(rTip, rTail, camber, flex) {
    var base = 60;
    var midY = base - camber + flex;
    return [
      'M 18 ' + (base - rTip),
      'Q 70 ' + (base - rTip) + ' 110 ' + (base - 2),
      'Q 200 ' + (base - 2) + ' 290 ' + midY,
      'Q 380 ' + (base - 2) + ' 470 ' + (base - 2),
      'Q 530 ' + (base - 2) + ' 562 ' + (base - rTail),
    ].join(' ');
  }

  function renderSkiSVG(opts) {
    var sh = opts.sh !== undefined ? opts.sh : 30;
    var wa = opts.waist !== undefined ? opts.waist : 24;
    var ta = opts.ta !== undefined ? opts.ta : 27;
    var cx = opts.cx !== undefined ? opts.cx : 65;
    var base = opts.base || 'wood';
    var graphic = !!opts.graphic;
    var layers = opts.layers || null;
    var binding = !!opts.binding;
    var ghost = !!opts.ghost;
    var body = !!opts.body;
    var rockerTip = opts.rockerTip || 0;
    var rockerTail = opts.rockerTail || 0;
    var camber = opts.camber !== undefined ? opts.camber : 9;
    var flex = opts.flex || 0;
    var profile = opts.profile !== false;
    var uid = opts.uid || 'ski';
    var topW = 130;
    var viewW = body ? 230 : topW;
    var bx = body ? 70 : 0;

    var outline = skiOutlinePath(sh, wa, ta, cx);
    var ghostPath = skiOutlinePath(28, 26, 25, cx);

    var woodLines = '';
    if (base === 'wood') {
      for (var i = 0; i < 7; i++) {
        woodLines += '<path d="M ' + (30 + i * 9) + ' 30 q 6 270 0 510" stroke="#bdbdbd" stroke-width="0.8" fill="none" opacity="0.7"/>';
      }
    }
    var snowDots = '';
    if (base === 'snow') {
      for (var i = 0; i < 46; i++) {
        snowDots += '<circle cx="' + (32 + (i * 37) % 66) + '" cy="' + (40 + (i * 53) % 500) + '" r="1.5" fill="var(--sd-accent,#3270a8)" opacity="0.22"/>';
      }
    }
    var graphicFill = '';
    if (graphic) {
      graphicFill = '<rect x="0" y="0" width="' + topW + '" height="560" fill="rgba(50,112,168,0.07)"/>';
      for (var i = 0; i < 28; i++) {
        graphicFill += '<line x1="' + (-20 + i * 12) + '" y1="0" x2="' + (-120 + i * 12) + '" y2="560" stroke="rgba(50,112,168,0.1)" stroke-width="6"/>';
      }
    }
    var metalLines = '';
    if (layers === 'metal' || layers === 'both') {
      for (var i = 0; i < 3; i++) {
        metalLines += '<line x1="36" y1="' + (250 + i * 12) + '" x2="94" y2="' + (250 + i * 12) + '" stroke="#8c8c8c" stroke-width="2" stroke-dasharray="1 3" opacity="0.9"/>';
      }
    }
    var carbonLines = '';
    if (layers === 'carbon' || layers === 'both') {
      for (var i = 0; i < 8; i++) {
        carbonLines += '<line x1="34" y1="' + (300 + i * 7) + '" x2="96" y2="' + (300 + i * 7 - 14) + '" stroke="var(--sd-accent,#3270a8)" stroke-width="1" opacity="0.8"/>';
      }
    }
    var bindingSvg = '';
    if (binding) {
      bindingSvg = '<g fill="#fff" stroke="var(--sd-ink,#1a1a1a)" stroke-width="1.4">'
        + '<path d="M ' + (cx - 13) + ' 250 L ' + (cx + 13) + ' 250 L ' + (cx + 10) + ' 272 L ' + (cx - 10) + ' 272 Z"/>'
        + '<path d="M ' + (cx - 12) + ' 318 L ' + (cx + 12) + ' 318 L ' + (cx + 14) + ' 344 L ' + (cx - 14) + ' 344 Z"/>'
        + '<line x1="' + cx + '" y1="272" x2="' + cx + '" y2="318" stroke-width="1.2"/>'
        + '</g>';
    }
    var ghostSvg = '';
    if (ghost) {
      ghostSvg = '<g transform="translate(-14,14) scale(0.94)" transform-origin="' + cx + ' 280">'
        + '<path d="' + ghostPath + '" fill="none" stroke="#8c8c8c" stroke-width="1.4" stroke-dasharray="5 4" opacity="0.8"/>'
        + '<text x="' + (cx - 36) + '" y="556" font-family="monospace" font-size="9" fill="#8c8c8c">current ski</text>'
        + '</g>';
    }
    var bodyFig = '';
    if (body) {
      bodyFig = '<g stroke="var(--sd-ink,#1a1a1a)" stroke-width="1.6" fill="none" stroke-linecap="round">'
        + '<line x1="30" y1="40" x2="30" y2="540" stroke="#bdbdbd" stroke-dasharray="3 4"/>'
        + '<circle cx="30" cy="120" r="13"/>'
        + '<line x1="30" y1="133" x2="30" y2="250"/>'
        + '<line x1="30" y1="160" x2="12" y2="215"/>'
        + '<line x1="30" y1="160" x2="48" y2="215"/>'
        + '<line x1="30" y1="250" x2="16" y2="350"/>'
        + '<line x1="30" y1="250" x2="44" y2="350"/>'
        + '<text x="6" y="34" font-family="monospace" font-size="8.5" fill="#8c8c8c">head</text>'
        + '</g>';
    }
    var rockerLabels = '';
    if (rockerTip > 0) rockerLabels += '<text x="' + (cx + 34) + '" y="84" font-family="monospace" font-size="8" fill="var(--sd-accent,#3270a8)">tip rocker</text>';
    if (rockerTail > 0) rockerLabels += '<text x="' + (cx + 30) + '" y="502" font-family="monospace" font-size="8" fill="var(--sd-accent,#3270a8)">tail rocker</text>';
    var graphicLabel = graphic ? '<text x="' + cx + '" y="300" text-anchor="middle" font-family="monospace" font-size="8.5" fill="var(--sd-accent,#3270a8)" transform="rotate(90 ' + cx + ' 300)">[ TOPSHEET GRAPHIC ]</text>' : '';

    var topSvg = '<svg viewBox="0 0 ' + viewW + ' 560" class="sd-ski-topview" aria-hidden="true">'
      + '<defs><clipPath id="sk-' + uid + '"><path d="' + outline + '" transform="translate(' + bx + ',0)"/></clipPath></defs>'
      + bodyFig
      + '<g transform="translate(' + bx + ',0)">'
      + ghostSvg
      + '<g clip-path="url(#sk-' + uid + ')">'
      + '<rect x="0" y="0" width="' + topW + '" height="560" fill="#fafafa"/>'
      + woodLines + snowDots + graphicFill + metalLines + carbonLines
      + '</g>'
      + '<path d="' + outline + '" fill="none" stroke="var(--sd-ink,#1a1a1a)" stroke-width="1.8"/>'
      + bindingSvg + rockerLabels + graphicLabel
      + '</g>'
      + '</svg>';

    var profileSvg = '';
    if (profile) {
      var pPath = skiProfilePath(rockerTip, rockerTail, camber, flex);
      var pColor = (rockerTip || rockerTail || flex) ? 'var(--sd-accent,#3270a8)' : 'var(--sd-ink,#1a1a1a)';
      profileSvg = '<div class="sd-ski-profile">'
        + '<svg viewBox="0 0 580 86" style="width:100%;display:block">'
        + '<line x1="8" y1="60" x2="572" y2="60" stroke="#bdbdbd" stroke-width="1" stroke-dasharray="4 4"/>'
        + '<text x="8" y="78" font-family="monospace" font-size="9" fill="#8c8c8c">snow</text>'
        + '<path d="' + pPath + '" fill="none" stroke="' + pColor + '" stroke-width="2" stroke-linecap="round"/>'
        + '<text x="500" y="20" font-family="monospace" font-size="9" fill="#8c8c8c" text-anchor="end">side profile</text>'
        + '</svg></div>';
    }

    return '<div class="sd-ski-panel-inner">' + topSvg + profileSvg + '</div>';
  }

  // Derive ski visual params from app state
  function skiParams(state, overrideAct) {
    var act = overrideAct !== undefined ? overrideAct : state.act;
    var hasPowder = state.dayTypes.indexOf('powder') >= 0 || state.dayTypes.indexOf('touring') >= 0;
    var hasHard = state.dayTypes.indexOf('hard_firm') >= 0;
    var hasDeep = state.terrain.some(function (t) { return ['bowls', 'trees', 'backcountry'].indexOf(t) >= 0; });

    var wa = 24;
    if (state.dayTypes.length > 0) {
      wa = hasPowder && !hasHard ? 33 : hasHard && !hasPowder ? 20 : 28;
    }
    var rockerTip = 0, rockerTail = 0;
    if (state.terrain.length > 0) {
      rockerTip = hasDeep ? 16 : 8;
      rockerTail = hasDeep ? 11 : 5;
    }
    var camber = rockerTip > 0 ? 7 : 9;
    var layers = null;
    var flex = 0;
    if (act >= 3) {
      flex = Math.round(state.stability * 8);
      layers = state.stability < 0.33 ? 'metal' : state.stability > 0.66 ? 'carbon' : 'both';
    }

    // Act 5: "Play with it" controls drive the ski rendering
    if (act === 5) {
      if (state.selectedWaist) {
        wa = Math.round(20 + (state.selectedWaist - 84) * 13 / 28);
        wa = Math.max(18, Math.min(36, wa));
      }
      camber = state.selectedCamber === 'low' ? 4
             : state.selectedCamber === 'high' ? 14
             : 9;
    }

    var ghost = act >= 3 && !!state.currentSki.brand;
    var binding = !!state.bindings;
    var body = act === 4 && !!state.heightVal;
    var graphic = act === 5;
    var profile = act !== 4;

    return {
      sh: 30, waist: wa, ta: 27, cx: 65,
      base: state.regions.length > 0 ? 'snow' : 'wood',
      graphic: graphic, layers: layers, binding: binding,
      ghost: ghost, body: body,
      rockerTip: rockerTip, rockerTail: rockerTail,
      camber: camber, flex: flex,
      profile: profile, uid: 'a' + act,
    };
  }

  // ── recommendation logic ──────────────────────────────────────────────────
  function computeSpec(state) {
    var hasPowder = state.dayTypes.indexOf('powder') >= 0 || state.dayTypes.indexOf('touring') >= 0;
    var hasHard = state.dayTypes.indexOf('hard_firm') >= 0;
    var wMin = 98, wMax = 104;
    if (hasPowder && !hasHard)      { wMin = 104; wMax = 112; }
    else if (hasHard && !hasPowder) { wMin = 84;  wMax = 92;  }
    else if (hasPowder && hasHard)  { wMin = 96;  wMax = 104; }

    var hCm = 175;
    if (state.heightVal) {
      var n = parseFloat(state.heightVal);
      if (n > 0) {
        hCm = state.heightUnit === 'ft' && n < 9
          ? Math.round(n * 30.48)
          : n;
      }
    }
    var weightLb = 0;
    if (state.weightVal) {
      var wn = parseFloat(state.weightVal);
      if (wn > 0) weightLb = state.weightUnit === 'kg' ? Math.round(wn * 2.20462) : wn;
    }
    var weightMult = 0;
    if (weightLb > 0) {
      if (weightLb < 100)      weightMult = Math.round((100 - weightLb) / 15);
      else if (weightLb > 120) weightMult = Math.round((weightLb - 120) / 15);
    }
    var skillsOffset = (state.ability === 'Level III' || state.ability === 'III+') ? 0
      : state.ability === 'Level II' ? -5 : -10;
    var midLen = Math.round(hCm + weightMult + skillsOffset);
    var lMin = Math.round((midLen - 5) / 5) * 5;
    var lMax = Math.round((midLen + 5) / 5) * 5;

    var stab = state.stability;
    var construction, tipDesign, tailDesign, sidecut, camberLabel;
    if (stab < 0.33) {
      construction = 'Aspen core · 2× Titanal'; tipDesign = 'Early-rise rocker'; tailDesign = 'Flat'; sidecut = '16 – 18 m'; camberLabel = 'Medium';
    } else if (stab > 0.66) {
      construction = 'Paulownia core · Carbon stringers'; tipDesign = 'Progressive rocker'; tailDesign = 'Early-rise rocker'; sidecut = '14 – 16 m'; camberLabel = 'Low / early-rise';
    } else {
      construction = 'Aspen core · 1× Titanal'; tipDesign = 'Early-rise rocker'; tailDesign = 'Low rocker'; sidecut = '17 – 19 m'; camberLabel = 'Medium';
    }
    var pkg = stab < 0.33 ? 'Ultra' : stab > 0.66 ? 'Essential' : 'Silver';

    return {
      lengthRange: [lMin, lMax], lengthMid: midLen,
      waistRange: [wMin, wMax], waistMid: Math.round((wMin + wMax) / 2),
      sidecut: sidecut, tipDesign: tipDesign, tailDesign: tailDesign,
      construction: construction, camber: camberLabel, pkg: pkg,
    };
  }

  function selectMaterialsForPole(materials, target) {
    var cats = ['core', 'topsheet', 'base', 'sidewall', 'edge', 'laminate'];
    var result = {};
    cats.forEach(function (cat) {
      var pool = (materials || []).filter(function (m) { return m.category === cat; });
      if (!pool.length) return;
      pool = pool.slice().sort(function (a, b) {
        function sqDist(m) {
          var dd = (m.damp_factor  - target.damp)   * target.wd;
          var df = (m.flex_factor  - target.flex)   * target.wf;
          var ds = (m.speed_factor - target.speed)  * target.ws;
          var dw = (m.weight_factor - target.weight) * target.ww;
          return dd*dd + df*df + ds*ds + dw*dw;
        }
        return sqDist(a) - sqDist(b);
      });
      result[cat] = pool[0];
    });
    return result;
  }

  function computePersonalities(state, spec, materials) {
    var hasPowder = state.dayTypes.indexOf('powder') >= 0 || state.dayTypes.indexOf('touring') >= 0;
    var hasHard = state.dayTypes.indexOf('hard_firm') >= 0;
    var stab = state.stability;
    var isStable = stab < 0.4, isLight = stab > 0.6;

    var poleTargets = [
      // Pole 0: match user's stability preference directly
      { damp: stab * 10, flex: stab * 10,
        speed: hasPowder ? 4 : hasHard ? 7 : 5,
        weight: hasPowder ? 3 : hasHard ? 6 : 5,
        wd: 2, wf: 2, ws: 1, ww: 1 },
      // Pole 1: terrain-optimized (powder → float, hard → speed/precision)
      { damp: hasPowder ? 3 : hasHard ? 6 : 5,
        flex: hasPowder ? 3 : hasHard ? 8 : 5,
        speed: hasPowder ? 5 : hasHard ? 9 : 7,
        weight: hasPowder ? 2 : hasHard ? 5 : 4,
        wd: 1, wf: 2, ws: 2, ww: 2 },
      // Pole 2: responsive/active — low damp, high speed, low weight
      { damp: 3, flex: 5, speed: 9, weight: 3,
        wd: 1, wf: 1, ws: 3, ww: 2 },
    ];

    var poleMats = poleTargets.map(function (t) { return selectMaterialsForPole(materials, t); });

    function matDiffs(mats) {
      var keys = ['core', 'laminate', 'sidewall', 'base'];
      var out = [];
      keys.forEach(function (k) {
        var m = mats[k];
        if (m) out.push(m.name + (m.sub_category ? ' · ' + m.sub_category : ''));
      });
      return out.length ? out : null;
    }

    return [
      {
        id: 0,
        tagline: isStable ? 'Planted and powerful.' : isLight ? 'Quick and playful.' : 'Balanced and versatile.',
        desc: isStable
          ? 'Built for maximum edge hold and power transfer on firm snow. You\'ll feel planted at speed, with energy that pushes back when you load the edge.'
          : isLight
          ? 'Light swing weight, quick initiation, and a lively feel that makes every turn a conversation with the snow.'
          : 'A midpoint that keeps options open — enough damp for fast groomer runs, light enough to stay playful in softer conditions.',
        diffs: matDiffs(poleMats[0]) || (isStable
          ? ['2× Titanal laminate', 'Medium camber · ' + spec.sidecut, 'Aspen core']
          : isLight
          ? ['Carbon stringers, no metal', 'Early-rise tip/tail', 'Paulownia core']
          : ['1× Titanal + damping layer', 'Medium camber · ' + spec.sidecut, 'Aspen / ash core']),
        selectedMaterials: poleMats[0],
      },
      {
        id: 1,
        tagline: hasPowder ? 'Float and forgiveness.' : hasHard ? 'Precision carver.' : 'All-mountain performance.',
        desc: hasPowder
          ? 'Optimized for soft conditions — materials chosen for float, a light swing weight, and control when you punch through into crud.'
          : hasHard
          ? 'Narrow waist and full-camber design with materials that maximize edge hold. Turn initiation is deliberate and precise — exactly what you want when edges matter.'
          : 'A terrain-matched build tuned for mixed conditions, optimized for where you actually ski most.',
        diffs: matDiffs(poleMats[1]) || (hasPowder
          ? ['Full rocker tip/tail', (spec.waistRange[0] + 4) + '–' + (spec.waistRange[1] + 4) + ' mm waist', 'Paulownia core, light swing weight']
          : ['Full camber platform', (spec.waistRange[0] - 4) + '–' + (spec.waistRange[1] - 4) + ' mm waist', '2× Titanal, edge hold priority']),
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

  // ── sub-header ────────────────────────────────────────────────────────────
  var ACT_LABELS = ['Hello', 'Where & when', 'Feel', 'You', 'Your design'];

  function renderSubHeader(state, copy, settings) {
    var breadcrumb = ACT_LABELS.map(function (label, i) {
      var n = i + 1;
      var cls = 'sd-bread-step' + (n < state.act ? ' is-done' : '') + (n === state.act ? ' is-cur' : '');
      var sep = i < ACT_LABELS.length - 1 ? '<span class="sd-bread-lead" aria-hidden="true"></span>' : '';
      return '<span class="' + cls + '">'
        + '<span class="sd-bread-dot" aria-hidden="true"></span>'
        + '<span class="sd-bread-label">' + esc(label) + '</span>'
        + '</span>' + sep;
    }).join('');

    var microCta = state.act >= 3
      ? '<a href="' + esc(settings.calendlyUrl || '#') + '" class="sd-micro-cta" target="_blank" rel="noopener">'
        + esc(copy.microCtaLabel || 'Prefer to talk it through? Book a 20-min call.') + '</a>'
      : '<span style="flex-shrink:0;width:1px"></span>';

    return '<div class="sd-subheader" role="navigation" aria-label="Experience progress">'
      + '<nav class="sd-breadcrumb">' + breadcrumb + '</nav>'
      + microCta
      + '</div>';
  }

  // ── Act 1 ─────────────────────────────────────────────────────────────────
  function renderAct1(state, config) {
    var copy = config.copy || {};
    var hasName = state.name.trim().length > 0;
    var errHtml = state.errors.name
      ? '<div class="sd-alert" role="alert">' + esc(state.errors.name) + '</div>' : '';
    return '<div class="sd-act sd-act--1">'
      + '<div class="sd-split">'
      + '<div class="sd-form-col">'
      + '<div class="sd-eyebrow">' + esc(copy.heading || "Let's find your ski.") + '</div>'
      + '<h1 class="sd-h1">' + esc(copy.namePrompt || 'First, what should we call you?') + '</h1>'
      + '<p class="sd-sub">' + esc(copy.subhead || 'Answer a few questions and watch the ski we\'d build for you come to life.') + '</p>'
      + '<div class="sd-field">'
      + '<label class="sd-label" for="sd-name">Your first name</label>'
      + '<input id="sd-name" class="sd-input' + (state.errors.name ? ' is-error' : '') + '" '
      + 'type="text" autocomplete="given-name" placeholder="Type your name…" '
      + 'value="' + esc(state.name) + '" data-sd-action="name" autofocus/>'
      + errHtml
      + '</div>'
      + '<div class="sd-btn-row" style="margin-top:28px">'
      + '<button class="sd-btn sd-btn--primary" data-sd-action="act1-continue"'
      + (!hasName ? ' disabled aria-disabled="true"' : '') + '>Continue →</button>'
      + '</div>'
      + '</div>'
      + '<div class="sd-ski-col">'
      + '<div class="sd-ski-panel"><div class="sd-ski-panel-heading">Your ski, so far</div>'
      + renderSkiSVG(skiParams(state))
      + '</div></div>'
      + '</div></div>';
  }

  // ── Act 2 ─────────────────────────────────────────────────────────────────
  function renderAct2(state, config) {
    var regionDefs = config.regions && config.regions.length
      ? config.regions
      : [
          { label: 'Western NA',    value: 'western_na' },
          { label: 'Eastern NA',   value: 'eastern_na' },
          { label: 'Europe',        value: 'europe' },
          { label: 'Asia',          value: 'asia' },
          { label: 'South America', value: 'sa' },
          { label: 'Australia / NZ', value: 'anz' },
        ];
    var dayDefs = config.dayTypes && config.dayTypes.length
      ? config.dayTypes
      : [
          { label: 'Everyday',           value: 'everyday',  image: null },
          { label: 'Powder Days',         value: 'powder',    image: null },
          { label: 'Hard / Firm On-Piste', value: 'hard_firm', image: null },
          { label: 'Ski Touring',         value: 'touring',   image: null },
        ];
    var terrainDefs = config.terrain && config.terrain.length
      ? config.terrain
      : [
          { label: 'Groomed',              value: 'groomed' },
          { label: 'Moguls',               value: 'moguls' },
          { label: 'Resort Powder Bowls',  value: 'bowls' },
          { label: 'Hard Snow / Ice',      value: 'ice' },
          { label: 'Backcountry Powder',   value: 'backcountry' },
          { label: 'Tree Runs',            value: 'trees' },
          { label: 'Terrain Park',         value: 'park' },
          { label: 'Race Course',          value: 'race' },
        ];

    var rCount = state.regions.length;
    var tCount = state.terrain.length;

    var regionHtml = regionDefs.map(function (r) {
      var on = state.regions.indexOf(r.value) >= 0;
      var disabled = !on && rCount >= 3;
      return '<button class="sd-chip' + (on ? ' is-on' : '') + (disabled ? ' is-disabled' : '') + '" '
        + 'data-sd-action="toggle-region" data-value="' + esc(r.value) + '" '
        + 'aria-pressed="' + on + '"' + (disabled ? ' disabled' : '') + '>'
        + '<span class="sd-chip-dot' + (on ? ' is-on' : '') + '" aria-hidden="true"></span>'
        + esc(r.label) + '</button>';
    }).join('');

    var dayHtml = dayDefs.map(function (d) {
      var on = state.dayTypes.indexOf(d.value) >= 0;
      var imgHtml = d.image
        ? '<img src="' + esc(d.image) + '" alt="' + esc(d.label) + '" loading="lazy"/>'
        : '<span class="sd-pcard-placeholder"></span>';
      return '<button class="sd-pcard' + (on ? ' is-on' : '') + '" '
        + 'data-sd-action="toggle-daytype" data-value="' + esc(d.value) + '" aria-pressed="' + on + '">'
        + '<div class="sd-pcard-img">' + imgHtml + (on ? '<span class="sd-pcard-check" aria-hidden="true">✓</span>' : '') + '</div>'
        + '<div class="sd-pcard-label">' + esc(d.label) + '</div>'
        + '</button>';
    }).join('');

    var terrainHtml = terrainDefs.map(function (t) {
      var on = state.terrain.indexOf(t.value) >= 0;
      var disabled = !on && tCount >= 3;
      var imgHtml = t.image
        ? '<img src="' + esc(t.image) + '" alt="' + esc(t.label) + '" loading="lazy"/>'
        : '<span class="sd-pcard-placeholder"></span>';
      return '<button class="sd-pcard sd-pcard--sm' + (on ? ' is-on' : '') + (disabled ? ' is-disabled' : '') + '" '
        + 'data-sd-action="toggle-terrain" data-value="' + esc(t.value) + '" '
        + 'aria-pressed="' + on + '"' + (disabled ? ' disabled' : '') + '>'
        + '<div class="sd-pcard-img">' + imgHtml + (on ? '<span class="sd-pcard-check" aria-hidden="true">✓</span>' : '') + '</div>'
        + '<div class="sd-pcard-label">' + esc(t.label) + '</div>'
        + '</button>';
    }).join('');

    var errRegion  = state.errors.regions;
    var errDay     = state.errors.dayTypes;
    var errTerrain = state.errors.terrain;

    return '<div class="sd-act sd-act--2">'
      + '<div class="sd-split sd-split--scroll">'
      + '<div class="sd-form-col sd-form-col--scroll">'
      + '<div class="sd-eyebrow">Where &amp; when</div>'
      + '<div class="sd-q-block' + (errRegion ? ' sd-q-block--error' : '') + '">'
      + '<h2 class="sd-h2">Where do you want to ski with these?</h2>'
      + '<p class="sd-body">Pick up to three regions.</p>'
      + '<div class="sd-chip-map"><div class="sd-chip-group">' + regionHtml + '</div>'
      + (rCount > 0 ? '<span class="sd-count" aria-live="polite">● ' + rCount + ' of 3 selected</span>' : '')
      + '</div>'
      + (errRegion ? '<div class="sd-alert" role="alert">' + esc(errRegion) + '</div>' : '')
      + '</div>'
      + '<hr class="sd-divider"/>'
      + '<div class="sd-q-block' + (errDay ? ' sd-q-block--error' : '') + '">'
      + '<h2 class="sd-h2">What kind of days are these for?</h2>'
      + '<p class="sd-body">Choose one or more.</p>'
      + '<div class="sd-pcard-grid sd-pcard-grid--2">' + dayHtml + '</div>'
      + (errDay ? '<div class="sd-alert" role="alert">' + esc(errDay) + '</div>' : '')
      + '</div>'
      + '<hr class="sd-divider"/>'
      + '<div class="sd-q-block' + (errTerrain ? ' sd-q-block--error' : '') + '">'
      + '<h2 class="sd-h2">What terrain are you riding?</h2>'
      + '<p class="sd-body">Pick up to three.</p>'
      + '<div class="sd-pcard-grid sd-pcard-grid--4">' + terrainHtml + '</div>'
      + (tCount > 0 ? '<span class="sd-count" aria-live="polite" style="margin-top:12px;display:inline-block">● ' + tCount + ' of 3 selected</span>' : '')
      + (errTerrain ? '<div class="sd-alert" role="alert">' + esc(errTerrain) + '</div>' : '')
      + '</div>'
      + '<div class="sd-btn-row">'
      + '<button class="sd-btn sd-btn--ghost" data-sd-action="back">← Back</button>'
      + '<button class="sd-btn sd-btn--primary" data-sd-action="act2-continue">Continue →</button>'
      + '</div>'
      + '</div>'
      + '<div class="sd-ski-col sd-ski-col--sticky">'
      + '<div class="sd-ski-panel"><div class="sd-ski-panel-heading">Your ski, so far</div>'
      + renderSkiSVG(skiParams(state))
      + '</div></div>'
      + '</div></div>';
  }

  // ── Act 3 ─────────────────────────────────────────────────────────────────
  function renderAct3(state) {
    var stabPos = Math.round(state.stability * 100);
    var stabLabels = ['Stable', 'Balanced‑stable', 'Balanced‑light', 'Light'];
    var stabIdx = Math.min(3, Math.round(state.stability * 3));

    var bindingItems = ['Alpine', 'Alpine Touring', 'Telemark', "I don't know"];
    var bindingHtml = bindingItems.map(function (b) {
      var on = state.bindings === b;
      return '<button class="sd-radio' + (on ? ' is-on' : '') + '" '
        + 'data-sd-action="bindings" data-value="' + esc(b) + '" aria-pressed="' + on + '">'
        + '<span class="sd-radio-dot" aria-hidden="true"></span>' + esc(b) + '</button>';
    }).join('');

    var canContinue = !!state.bindings;

    return '<div class="sd-act sd-act--3">'
      + '<div class="sd-split">'
      + '<div class="sd-form-col sd-form-col--scroll">'
      + '<div class="sd-eyebrow">How should it feel?</div>'
      + '<div class="sd-q-block">'
      + '<h3 class="sd-h3">Stability vs Weight</h3>'
      + '<div class="sd-slider-wrap">'
      + '<div class="sd-slider">'
      + '<div class="sd-track"></div>'
      + '<div class="sd-ticks" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'
      + '<div class="sd-knob" style="left:' + stabPos + '%" aria-hidden="true"></div>'
      + '<input type="range" min="0" max="100" value="' + stabPos + '" '
      + 'class="sd-range-input" data-sd-action="stability" '
      + 'aria-label="Stability vs Weight" aria-valuetext="' + esc(stabLabels[stabIdx]) + '"/>'
      + '</div>'
      + '<div class="sd-stops" aria-hidden="true">'
      + stabLabels.map(function (l, i) {
          return '<span' + (i === stabIdx ? ' class="is-active"' : '') + '>' + esc(l) + '</span>';
        }).join('')
      + '</div>'
      + '</div>'
      + '<p class="sd-hint" style="margin-top:10px">Slide toward "stable" for more damp and edge hold; toward "light" for a livelier feel.</p>'
      + '</div>'
      + '<hr class="sd-divider"/>'
      + '<div class="sd-q-block">'
      + '<h3 class="sd-h3">Your current skis</h3>'
      + '<p class="sd-body">Tell us what you ride now — gives us a real reference point.</p>'
      + '<div class="sd-grid-4" style="margin-bottom:14px">'
      + '<div class="sd-field"><label class="sd-label" for="sd-ski-brand">Brand</label>'
      + '<input id="sd-ski-brand" class="sd-input" type="text" placeholder="e.g. Wagner" value="' + esc(state.currentSki.brand) + '" data-sd-action="ski-brand"/></div>'
      + '<div class="sd-field"><label class="sd-label" for="sd-ski-model">Model</label>'
      + '<input id="sd-ski-model" class="sd-input" type="text" placeholder="Pro Carve" value="' + esc(state.currentSki.model) + '" data-sd-action="ski-model"/></div>'
      + '<div class="sd-field"><label class="sd-label" for="sd-ski-year">Year</label>'
      + '<input id="sd-ski-year" class="sd-input" type="text" placeholder="2022" inputmode="numeric" value="' + esc(state.currentSki.year) + '" data-sd-action="ski-year"/></div>'
      + '<div class="sd-field"><label class="sd-label" for="sd-ski-length">Length (cm)</label>'
      + '<input id="sd-ski-length" class="sd-input" type="text" placeholder="178" inputmode="numeric" value="' + esc(state.currentSki.length) + '" data-sd-action="ski-length"/></div>'
      + '</div>'
      + '<div class="sd-grid-2">'
      + '<div class="sd-field"><label class="sd-label" for="sd-ski-likes">What do you like about these skis?</label>'
      + '<textarea id="sd-ski-likes" class="sd-textarea" placeholder="Free text…" data-sd-action="ski-likes">' + esc(state.currentSkiLikes) + '</textarea></div>'
      + '<div class="sd-field"><label class="sd-label" for="sd-ski-improve">Where could they perform better?</label>'
      + '<textarea id="sd-ski-improve" class="sd-textarea" placeholder="Free text…" data-sd-action="ski-improve">' + esc(state.currentSkiImprovements) + '</textarea></div>'
      + '</div></div>'
      + '<hr class="sd-divider"/>'
      + '<div class="sd-q-block">'
      + '<h3 class="sd-h3">Bindings</h3>'
      + '<div class="sd-radio-group">' + bindingHtml + '</div>'
      + '</div>'
      + '<div class="sd-btn-row">'
      + '<button class="sd-btn sd-btn--ghost" data-sd-action="back">← Back</button>'
      + '<button class="sd-btn sd-btn--primary" data-sd-action="act3-continue"'
      + (!canContinue ? ' disabled aria-disabled="true"' : '') + '>Continue →</button>'
      + '</div>'
      + '</div>'
      + '<div class="sd-ski-col">'
      + '<div class="sd-ski-panel"><div class="sd-ski-panel-heading">Your ski, so far</div>'
      + renderSkiSVG(skiParams(state))
      + '</div></div>'
      + '</div></div>';
  }

  // ── Act 4 ─────────────────────────────────────────────────────────────────
  function renderAct4(state, config) {
    var copy = config.copy || {};
    var levels = ['Level I', 'Level II', 'Level III', 'III+'];
    var pillsHtml = levels.map(function (l) {
      var on = state.ability === l;
      return '<button class="sd-pill' + (on ? ' is-on' : '') + '" data-sd-action="ability" data-value="' + esc(l) + '" aria-pressed="' + on + '">' + esc(l) + '</button>';
    }).join('');

    var hPlaceholder = state.heightUnit === 'ft' ? '5 ft 10 in' : '178';
    var wPlaceholder = state.weightUnit === 'lb' ? '165' : '75';

    return '<div class="sd-act sd-act--4">'
      + '<div class="sd-split">'
      + '<div class="sd-form-col">'
      + '<div class="sd-eyebrow">A few personal details</div>'
      + '<h1 class="sd-h1" style="font-size:clamp(22px,2.8vw,34px)">' + esc(copy.gateCopy || 'Ready for some personal questions?') + '</h1>'
      + '<p class="sd-sub">Optional, but they help us nail the spec.</p>'
      + '<div class="sd-grid-2" style="margin-bottom:0">'
      + '<div class="sd-field"><label class="sd-label" for="sd-height">Height</label>'
      + '<div class="sd-input-wrap">'
      + '<input id="sd-height" class="sd-input" type="text" placeholder="' + hPlaceholder + '" value="' + esc(state.heightVal) + '" data-sd-action="height"/>'
      + '<div class="sd-unit-toggle">'
      + '<button class="sd-unit-btn' + (state.heightUnit === 'ft' ? ' is-on' : '') + '" data-sd-action="height-unit" data-value="ft">in</button>'
      + '<button class="sd-unit-btn' + (state.heightUnit === 'cm' ? ' is-on' : '') + '" data-sd-action="height-unit" data-value="cm">cm</button>'
      + '</div></div></div>'
      + '<div class="sd-field"><label class="sd-label" for="sd-weight">Weight</label>'
      + '<div class="sd-input-wrap">'
      + '<input id="sd-weight" class="sd-input" type="text" placeholder="' + wPlaceholder + '" value="' + esc(state.weightVal) + '" data-sd-action="weight"/>'
      + '<div class="sd-unit-toggle">'
      + '<button class="sd-unit-btn' + (state.weightUnit === 'lb' ? ' is-on' : '') + '" data-sd-action="weight-unit" data-value="lb">lb</button>'
      + '<button class="sd-unit-btn' + (state.weightUnit === 'kg' ? ' is-on' : '') + '" data-sd-action="weight-unit" data-value="kg">kg</button>'
      + '</div></div></div>'
      + '<div class="sd-field"><label class="sd-label" for="sd-age">Age <span class="sd-label-hint">Optional</span></label>'
      + '<input id="sd-age" class="sd-input" type="text" placeholder="—" inputmode="numeric" value="' + esc(state.age) + '" data-sd-action="age"/></div>'
      + '<div class="sd-field"><label class="sd-label" for="sd-bsl">Boot Sole Length (BSL) <span class="sd-label-hint">Optional · mm</span></label>'
      + '<input id="sd-bsl" class="sd-input" type="text" placeholder="—" inputmode="numeric" value="' + esc(state.bsl) + '" data-sd-action="bsl"/></div>'
      + '</div>'
      + '<div class="sd-field" style="margin-top:16px"><label class="sd-label">Skier ability</label>'
      + '<p class="sd-hint">Cautious, lower speeds (I) → aggressive, higher speeds (III+)</p>'
      + '<div class="sd-pills" style="margin-top:8px">' + pillsHtml + '</div>'
      + '</div>'
      + '<div class="sd-field" style="margin-top:16px"><label class="sd-label" for="sd-notes">Anything else we should know? <span class="sd-label-hint">Optional</span></label>'
      + '<textarea id="sd-notes" class="sd-textarea sd-textarea--tall" placeholder="Injuries, preferences, goals…" data-sd-action="notes">' + esc(state.personalNotes) + '</textarea>'
      + '</div>'
      + '<div class="sd-btn-row" style="margin-top:24px">'
      + '<button class="sd-btn sd-btn--ghost" data-sd-action="back">← Back</button>'
      + '<button class="sd-btn sd-btn--primary" data-sd-action="act4-continue">See my design →</button>'
      + '<button class="sd-btn sd-btn--link" data-sd-action="act4-continue">Skip these</button>'
      + '</div>'
      + '</div>'
      + '<div class="sd-ski-col">'
      + '<div class="sd-ski-panel"><div class="sd-ski-panel-heading">Scaled to you</div>'
      + renderSkiSVG(skiParams(state, 4))
      + '</div></div>'
      + '</div></div>';
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  function renderLoading(extended) {
    var hint = extended
      ? '<p class="sd-hint sd-loading-hint">Crafting your builds<span class="sd-loading-dots"><span>.</span><span>.</span><span>.</span></span></p>'
      : '<p class="sd-hint sd-loading-hint">Shaping your ski…</p>';
    return '<div class="sd-act sd-act--loading">'
      + '<div class="sd-split">'
      + '<div class="sd-loading-ski">'
      + '<div class="sd-skel sd-skel--ski"></div>'
      + hint
      + '</div>'
      + '<div class="sd-loading-content">'
      + '<div class="sd-skel sd-skel--title"></div>'
      + '<div class="sd-skel-cards">'
      + '<div class="sd-skel sd-skel--card"></div>'
      + '<div class="sd-skel sd-skel--card"></div>'
      + '<div class="sd-skel sd-skel--card"></div>'
      + '</div>'
      + '<div class="sd-skel sd-skel--block"></div>'
      + '<div class="sd-skel-row"><div class="sd-skel sd-skel--half"></div><div class="sd-skel sd-skel--half"></div></div>'
      + '</div></div></div>';
  }

  // ── Act 5 ─────────────────────────────────────────────────────────────────
  function renderAct5(state, config, spec) {
    var personalities = computePersonalities(state, spec, config.materials || []);
    var narratives = state.personalityNarratives;
    var name = state.name || 'you';
    var sel = state.personality;

    if (narratives) {
      personalities = personalities.map(function (p, i) {
        var n = narratives[i];
        return n ? Object.assign({}, p, { aiName: n.name, tagline: n.tagline, desc: n.desc }) : p;
      });
    }

    var p = personalities[sel];
    var narrativesLoading = state.personalityNarrativesLoading && !narratives;

    var pcards = personalities.map(function (pc, i) {
      var on = i === sel;
      var diffsHtml = pc.diffs.map(function (d) {
        return '<div class="sd-p-diff"><span class="sd-p-dot" aria-hidden="true"></span>' + esc(d) + '</div>';
      }).join('');
      var cardName = pc.aiName || ('Personality ' + (i + 1));
      var nameHtml = narrativesLoading
        ? '<div class="sd-skel" style="height:1.3em;width:70%;margin-bottom:6px;border-radius:4px"></div>'
        : '<h3 class="sd-h3">' + esc(cardName) + '</h3>';
      var taglineHtml = narrativesLoading
        ? '<div class="sd-skel" style="height:0.9em;width:88%;margin-bottom:12px;border-radius:4px"></div>'
        : '<p class="sd-body" style="margin-bottom:12px">' + esc(pc.tagline) + '</p>';
      return '<div class="sd-personality-card' + (on ? ' is-selected' : '') + '" '
        + 'data-sd-action="personality" data-value="' + i + '">'
        + '<div class="sd-p-tag">ride personality ' + (i + 1) + '</div>'
        + nameHtml
        + taglineHtml
        + '<div class="sd-p-diffs"><div class="sd-p-diffs-label">What\'s different</div>' + diffsHtml + '</div>'
        + '<button class="sd-btn ' + (on ? 'sd-btn--primary' : 'sd-btn--ghost') + ' sd-btn--sm" '
        + 'data-sd-action="personality" data-value="' + i + '" style="margin-top:auto;width:100%">'
        + (on ? '✓ Selected' : 'Select') + '</button>'
        + '</div>';
    }).join('');

    var constructionStr = spec.construction;
    if (p.selectedMaterials) {
      var matParts = [];
      var coreM = p.selectedMaterials['core'], lamM = p.selectedMaterials['laminate'];
      if (coreM) matParts.push(coreM.name);
      if (lamM) matParts.push(lamM.name);
      if (matParts.length) constructionStr = matParts.join(' · ');
    }
    var specRows = [
      ['Length range',    spec.lengthRange[0] + ' – ' + spec.lengthRange[1] + ' cm'],
      ['Waist width',     spec.waistRange[0] + ' – ' + spec.waistRange[1] + ' mm'],
      ['Sidecut radius',  spec.sidecut],
      ['Tip design',      spec.tipDesign],
      ['Tail design',     spec.tailDesign],
      ['Construction',    constructionStr],
      ['Camber',          spec.camber],
    ];
    if (config.showPackages) specRows.push(['Recommended package', spec.pkg]);

    var specHtml = specRows.map(function (r) {
      return '<div class="sd-spec-row">'
        + '<span class="sd-spec-key">' + esc(r[0]) + '</span>'
        + '<span class="sd-spec-val">' + esc(r[1]) + '</span>'
        + '</div>';
    }).join('');

    var camberPills = ['Low', 'Medium', 'High'];
    var camberHtml = camberPills.map(function (l) {
      var on = state.selectedCamber === l.toLowerCase();
      return '<button class="sd-pill' + (on ? ' is-on' : '') + '" data-sd-action="camber" data-value="' + l.toLowerCase() + '" aria-pressed="' + on + '">' + esc(l) + '</button>';
    }).join('');

    var lMin = spec.lengthRange[0], lMax = spec.lengthRange[1];
    var wMin = spec.waistRange[0], wMax = spec.waistRange[1];
    var lPos = lMax > lMin ? Math.round((state.selectedLength - lMin) / (lMax - lMin) * 100) : 50;
    var wPos = wMax > wMin ? Math.round((state.selectedWaist - wMin) / (wMax - wMin) * 100) : 50;

    var cats = config.graphicCategories && config.graphicCategories.length
      ? config.graphicCategories
      : [{ name: 'House Graphics' }, { name: 'Artist Series' }, { name: 'James Niehues' }, { name: 'Wood Veneers' }];

    var featuredGraphics = config.featuredGraphics && config.featuredGraphics.length ? config.featuredGraphics : [];
    var graphicStrip = '';
    for (var gfi = 0; gfi < 5; gfi++) {
      var gfx = featuredGraphics[gfi];
      graphicStrip += '<div class="sd-graphic-tile' + (gfi === 0 ? ' is-selected' : '') + '"'
        + (gfx && gfx.title ? ' title="' + esc(gfx.title) + '"' : '') + '>'
        + (gfx && gfx.image
          ? '<img src="' + esc(gfx.image) + '" alt="' + esc(gfx.title || '') + '" loading="lazy" class="sd-graphic-tile-img">'
          : '<div class="sd-graphic-placeholder"></div>')
        + '</div>';
    }
    graphicStrip += '<button class="sd-graphic-all" data-sd-action="open-graphics">+ All</button>';

    return '<div class="sd-act sd-act--5">'
      + '<div class="sd-split sd-split--act5">'
      + '<div class="sd-hero-ski-col">'
      + '<div class="sd-eyebrow" style="margin-bottom:8px">' + esc(name) + ' — here\'s the ski we\'d build for you</div>'
      + renderSkiSVG(skiParams(state, 5))
      + '<div class="sd-hero-tags">'
      + (config.showPackages ? '<span class="sd-tag">' + esc(spec.pkg) + ' package</span>' : '')
      + '<span class="sd-tag">' + state.selectedLength + ' cm · ' + state.selectedWaist + ' mm</span>'
      + '</div>'
      + '<div style="display:flex;justify-content:center;margin-top:12px">'
      + '<button class="sd-btn sd-btn--ghost sd-btn--sm" data-sd-action="open-graphics">◇ Explore topsheet graphics →</button>'
      + '</div>'
      + '</div>'
      + '<div class="sd-design-col">'
      + '<div class="sd-btn-row" style="margin-bottom:20px">'
      + '<button class="sd-btn sd-btn--ghost sd-btn--sm" data-sd-action="back">← Edit answers</button>'
      + '</div>'
      + '<div><h2 class="sd-h2">Three ways this ski could ride</h2>'
      + '<p class="sd-body">Pick the personality that sounds most like you.</p></div>'
      + '<div class="sd-personality-grid">' + pcards + '</div>'
      + '<div class="sd-desc-block">'
      + (narrativesLoading
          ? '<div class="sd-skel" style="height:0.85em;width:52%;margin-bottom:8px;border-radius:4px"></div>'
          : '<div class="sd-eyebrow">' + esc(p.aiName || ('Personality ' + (sel + 1))) + ' — in your skier\'s words</div>')
      + (narrativesLoading
          ? '<div class="sd-skel" style="height:3.5em;border-radius:4px" aria-label="Generating description…"></div>'
          : '<p class="sd-body" style="line-height:1.65">' + esc(p.desc) + '</p>')
      + '</div>'
      + '<div class="sd-2col-grid">'
      + '<div class="sd-spec-sheet"><div class="sd-spec-head"><span class="sd-eyebrow" style="margin:0">Recommended spec — ranges, not fixed</span></div>'
      + specHtml + '</div>'
      + '<div class="sd-explore-controls"><div class="sd-eyebrow">Play with it</div>'
      + '<div class="sd-field"><label class="sd-label">Length — ' + state.selectedLength + ' cm</label>'
      + '<div class="sd-slider-wrap"><div class="sd-slider">'
      + '<div class="sd-track"></div>'
      + '<div class="sd-fillbar" style="width:' + lPos + '%"></div>'
      + '<div class="sd-knob" style="left:' + lPos + '%" aria-hidden="true"></div>'
      + '<input type="range" min="' + lMin + '" max="' + lMax + '" value="' + state.selectedLength + '" class="sd-range-input" data-sd-action="selected-length" aria-label="Ski length"/>'
      + '</div><div class="sd-stops"><span>' + lMin + '</span><span>' + lMax + '</span></div></div></div>'
      + '<div class="sd-field"><label class="sd-label">Waist width — ' + state.selectedWaist + ' mm</label>'
      + '<div class="sd-slider-wrap"><div class="sd-slider">'
      + '<div class="sd-track"></div>'
      + '<div class="sd-fillbar" style="width:' + wPos + '%"></div>'
      + '<div class="sd-knob" style="left:' + wPos + '%" aria-hidden="true"></div>'
      + '<input type="range" min="' + wMin + '" max="' + wMax + '" value="' + state.selectedWaist + '" class="sd-range-input" data-sd-action="selected-waist" aria-label="Waist width"/>'
      + '</div><div class="sd-stops"><span>' + wMin + '</span><span>' + wMax + '</span></div></div></div>'
      + '<div class="sd-field"><div class="sd-label" style="margin-bottom:8px">Camber</div>'
      + '<div class="sd-pills">' + camberHtml + '</div></div>'
      + '<div class="sd-field">'
      + '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">'
      + '<div class="sd-label">Topsheet graphic</div>'
      + '<button class="sd-link" data-sd-action="open-graphics">Explore graphics →</button>'
      + '</div>'
      + '<div class="sd-hint" style="margin-bottom:8px">Featured · ' + esc(cats[0].name) + '</div>'
      + '<div class="sd-graphic-strip">' + graphicStrip + '</div>'
      + '</div>'
      + '</div></div>'
      + '<div class="sd-cta-row">'
      + '<button class="sd-btn sd-btn--primary sd-btn--lg" data-sd-action="open-book">Book my design call</button>'
      + '<button class="sd-btn sd-btn--ghost sd-btn--lg" data-sd-action="open-save">Email me this design</button>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '<div class="sd-sticky-cta">'
      + '<button class="sd-btn sd-btn--primary sd-btn--block" data-sd-action="open-book">Book my design call</button>'
      + '<button class="sd-btn sd-btn--link" data-sd-action="open-save">Email me this design</button>'
      + '</div>'
      + '</div>';
  }

  // ── modals ────────────────────────────────────────────────────────────────
  function renderSaveModal(state, config) {
    var copy = config.copy || {};
    var body;
    if (state.saveState === 'saved') {
      body = '<div class="sd-modal-confirm">'
        + '<div class="sd-confirm-icon" aria-hidden="true">✓</div>'
        + '<h3 class="sd-h3">Saved. Check your inbox.</h3>'
        + '<p class="sd-body">We\'ve emailed your design to ' + esc(state.email) + '.</p>'
        + '<button class="sd-btn sd-btn--ghost" data-sd-action="close-save">Done</button>'
        + '</div>';
    } else {
      var errHtml = state.errors.email
        ? '<div class="sd-alert" role="alert">' + esc(state.errors.email) + '</div>' : '';
      body = '<div class="sd-field"><label class="sd-label" for="sd-email">Email address</label>'
        + '<input id="sd-email" class="sd-input' + (state.errors.email ? ' is-error' : '') + '" '
        + 'type="email" inputmode="email" autocomplete="email" placeholder="you@email.com" '
        + 'value="' + esc(state.email) + '" data-sd-action="email"/>'
        + errHtml + '</div>'
        + '<label class="sd-check-row">'
        + '<input type="checkbox" class="sd-checkbox" data-sd-action="klaviyo-opt"' + (state.klaviyoOptIn ? ' checked' : '') + '/>'
        + '<span class="sd-body">Send me occasional ski news and offers.</span>'
        + '</label>'
        + '<button class="sd-btn sd-btn--primary sd-btn--block" data-sd-action="save-submit"'
        + (state.saveState === 'saving' ? ' disabled' : '') + '>'
        + (state.saveState === 'saving' ? 'Saving…' : 'Save and email me') + '</button>'
        + '<div style="text-align:center"><button class="sd-btn sd-btn--link" data-sd-action="close-save">Maybe later</button></div>';
    }
    var subCopy = copy.emailSaveCopy
      ? '<p class="sd-modal-sub">' + esc(copy.emailSaveCopy) + '</p>' : '';
    return '<div class="sd-modal-backdrop" data-sd-action="close-save">'
      + '<div class="sd-modal" role="dialog" aria-modal="true" aria-label="Email me this design" data-sd-modal>'
      + '<div class="sd-modal-header">'
      + '<div><h3 class="sd-h3">Email me this design</h3>' + subCopy + '</div>'
      + '<button class="sd-modal-close" data-sd-action="close-save" aria-label="Close">×</button>'
      + '</div>'
      + '<div class="sd-modal-body">' + body + '</div>'
      + '</div></div>';
  }

  function renderBookModal(state, config, spec) {
    var p = spec ? spec : { pkg: 'Silver' };
    var summary = (p.pkg || 'Silver') + ' package · ' + state.selectedLength + ' cm · '
      + state.selectedWaist + ' mm waist · ' + state.selectedCamber + ' camber · Personality ' + (state.personality + 1);
    var calendlyUrl = config.settings && config.settings.calendlyUrl;
    var embedHtml = calendlyUrl
      ? '<div class="sd-calendly-wrap"><iframe src="' + esc(calendlyUrl) + '?sd_design=' + encodeURIComponent(summary) + '" frameborder="0" title="Schedule a design call" style="width:100%;height:320px;border:none;display:block"></iframe></div>'
      : '<div class="sd-calendly-placeholder"><p class="sd-hint">[ Calendly embed — set the Calendly URL in theme settings ]</p></div>';
    return '<div class="sd-modal-backdrop" data-sd-action="close-book">'
      + '<div class="sd-modal sd-modal--wide" role="dialog" aria-modal="true" aria-label="Book my design call" data-sd-modal>'
      + '<div class="sd-modal-header">'
      + '<div><h3 class="sd-h3">Book my design call</h3><p class="sd-modal-sub"><strong>Your design:</strong> ' + esc(summary) + '</p></div>'
      + '<button class="sd-modal-close" data-sd-action="close-book" aria-label="Close">×</button>'
      + '</div>'
      + '<div class="sd-modal-body">' + embedHtml + '</div>'
      + '</div></div>';
  }

  // ── render ────────────────────────────────────────────────────────────────
  function render(root, state, config) {
    var spec = null;
    if (state.act === 5) {
      spec = computeSpec(state);
      if (!state._specInited) {
        state.selectedLength = spec.lengthMid;
        state.selectedWaist = spec.waistMid;
        state._specInited = true;
      }
    }

    var actHtml = '';
    if (state.loading) {
      actHtml = renderLoading(state.loadingExtended);
    } else {
      switch (state.act) {
        case 1: actHtml = renderAct1(state, config); break;
        case 2: actHtml = renderAct2(state, config); break;
        case 3: actHtml = renderAct3(state); break;
        case 4: actHtml = renderAct4(state, config); break;
        case 5: actHtml = renderAct5(state, config, spec); break;
      }
    }

    var resumeCopy = state.resumeSource === 'url'
      ? 'We\'ve reopened your saved design — pick up right where you left off.'
      : 'We saved your progress. Continue where you left off.';
    var resumeHtml = state.resumeBanner
      ? '<div class="sd-resume-banner">'
        + '<span class="sd-resume-icon" aria-hidden="true">↩</span>'
        + '<span class="sd-body"><strong>Welcome back' + (state.name ? ', ' + esc(state.name) : '') + '.</strong> ' + resumeCopy + '</span>'
        + '<button class="sd-resume-close" data-sd-action="close-resume" aria-label="Dismiss">×</button>'
        + '</div>'
      : '';

    var modalsHtml = '';
    if (state.saveModalOpen) modalsHtml += renderSaveModal(state, config);
    if (state.bookModalOpen) modalsHtml += renderBookModal(state, config, spec);

    var activeId = document.activeElement && root.contains(document.activeElement)
      ? document.activeElement.id : null;
    var selStart = activeId && document.activeElement.tagName === 'INPUT'
      ? document.activeElement.selectionStart : null;
    var selEnd = activeId && document.activeElement.tagName === 'INPUT'
      ? document.activeElement.selectionEnd : null;
    var scrollTop = root.scrollTop;

    root.innerHTML = resumeHtml
      + renderSubHeader(state, config.copy || {}, config.settings || {})
      + '<div class="sd-acts-wrap">' + actHtml + '</div>'
      + modalsHtml;

    root.scrollTop = scrollTop;

    if (activeId) {
      var el = root.querySelector('#' + activeId);
      if (el) {
        el.focus();
        if (selStart !== null) { try { el.setSelectionRange(selStart, selEnd); } catch (e) {} }
      }
    }
  }

  // ── event handling ────────────────────────────────────────────────────────
  function dispatch(e, root, state, config, scheduleRender) {
    var target = e.target.closest('[data-sd-action]');
    if (!target) return;

    // Don't close modal when clicking inside the modal panel itself
    var action = target.dataset.sdAction;
    if ((action === 'close-save' || action === 'close-book') && e.target.closest('[data-sd-modal]')) {
      // Only allow close if the clicked target IS the close button (not just inside the modal)
      if (!target.classList.contains('sd-modal-close') && !target.classList.contains('sd-modal-backdrop')) return;
    }

    var value = target.dataset.value;

    switch (action) {
      case 'name':
        state.name = target.value;
        var btn = root.querySelector('[data-sd-action="act1-continue"]');
        if (btn) { btn.disabled = !state.name.trim(); btn.setAttribute('aria-disabled', btn.disabled ? 'true' : 'false'); }
        return;

      case 'act1-continue':
        if (!state.name.trim()) { state.errors.name = 'We just need a first name to continue.'; }
        else { state.errors = {}; state.act = 2; window.scrollTo(0, 0); }
        break;

      case 'back':
        if (state.act === 5) { state.personalityNarratives = null; state.personalityNarrativesLoading = false; state._specInited = false; }
        if (state.act > 1) { state.act--; state.errors = {}; window.scrollTo(0, 0); }
        return scheduleRender();

      case 'toggle-region': {
        var idx = state.regions.indexOf(value);
        if (idx >= 0) state.regions.splice(idx, 1);
        else if (state.regions.length < 3) state.regions.push(value);
        if (state.regions.length > 0) delete state.errors.regions;
        break;
      }
      case 'toggle-daytype': {
        var idx = state.dayTypes.indexOf(value);
        if (idx >= 0) state.dayTypes.splice(idx, 1);
        else state.dayTypes.push(value);
        if (state.dayTypes.length > 0) delete state.errors.dayTypes;
        break;
      }
      case 'toggle-terrain': {
        var idx = state.terrain.indexOf(value);
        if (idx >= 0) state.terrain.splice(idx, 1);
        else if (state.terrain.length < 3) state.terrain.push(value);
        if (state.terrain.length > 0) delete state.errors.terrain;
        break;
      }

      case 'act2-continue': {
        var errs = {};
        if (!state.regions.length)  errs.regions  = 'Pick at least one region where you ski.';
        if (!state.dayTypes.length) errs.dayTypes  = 'Choose at least one type of day.';
        if (!state.terrain.length)  errs.terrain   = 'Pick at least one type of terrain.';
        if (Object.keys(errs).length) { state.errors = errs; break; }
        state.errors = {};
        state.act = 3;
        window.scrollTo(0, 0);
        break;
      }

      case 'stability':
        state.stability = parseInt(target.value, 10) / 100;
        break;

      case 'ski-brand': state.currentSki = Object.assign({}, state.currentSki, { brand: target.value }); return;
      case 'ski-model': state.currentSki = Object.assign({}, state.currentSki, { model: target.value }); return;
      case 'ski-year':  state.currentSki = Object.assign({}, state.currentSki, { year:  target.value }); return;
      case 'ski-length':state.currentSki = Object.assign({}, state.currentSki, { length:target.value }); return;
      case 'ski-likes':   state.currentSkiLikes        = target.value; return;
      case 'ski-improve': state.currentSkiImprovements = target.value; return;

      case 'bindings': state.bindings = value; break;
      case 'act3-continue': state.act = 4; state.errors = {}; window.scrollTo(0, 0); break;

      case 'height':       state.heightVal  = target.value; return;
      case 'height-unit':  state.heightUnit = value; break;
      case 'weight':       state.weightVal  = target.value; return;
      case 'weight-unit':  state.weightUnit = value; break;
      case 'age':          state.age        = target.value; return;
      case 'bsl':          state.bsl        = target.value; return;
      case 'ability':      state.ability    = value; break;
      case 'notes':        state.personalNotes = target.value; return;

      case 'act4-continue': {
        state.loading = true;
        state.loadingExtended = false;
        state.errors = {};
        state.personalityNarratives = null;
        state.personalityNarrativesLoading = false;
        scheduleRender();
        window.scrollTo(0, 0);
        var gate = { timer: false, fetch: false };
        function tryTransition() {
          if (!gate.timer || !gate.fetch) return;
          state.loading = false;
          state.loadingExtended = false;
          state.act = 5;
          state._specInited = false;
          scheduleRender();
          fireAnalytics('act_transition', { to: 5 });
        }
        setTimeout(function () {
          gate.timer = true;
          if (!gate.fetch) { state.loadingExtended = true; scheduleRender(); }
          tryTransition();
        }, 2200);
        fetchPersonalityNarratives(state, config, function () { gate.fetch = true; tryTransition(); });
        return;
      }

      case 'personality':
        state.personality = parseInt(value, 10);
        break;
      case 'camber':
        state.selectedCamber = value;
        break;
      case 'selected-length':
        state.selectedLength = parseInt(target.value, 10);
        break;
      case 'selected-waist':
        state.selectedWaist = parseInt(target.value, 10);
        break;

      case 'open-save':
        state.saveModalOpen = true;
        state.saveState = 'idle';
        state.errors = {};
        break;
      case 'close-save':
        state.saveModalOpen = false;
        state.errors = {};
        break;
      case 'open-book':
        state.bookModalOpen = true;
        break;
      case 'close-book':
        state.bookModalOpen = false;
        break;
      case 'open-graphics': {
        var gvOverlay = document.getElementById('sd-graphics-overlay');
        if (gvOverlay) {
          gvOverlay.hidden = false;
          document.body.style.overflow = 'hidden';
          var closeBtn = gvOverlay.querySelector('[data-sd-gv-close]');
          if (closeBtn) closeBtn.focus();
        }
        return;
      }

      case 'email':        state.email       = target.value; return;
      case 'klaviyo-opt':  state.klaviyoOptIn = target.checked; return;

      case 'save-submit':
        handleSave(state, config, scheduleRender);
        return;

      case 'close-resume': state.resumeBanner = false; break;

      default: return;
    }

    scheduleRender();
  }

  function handleSave(state, config, scheduleRender) {
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(state.email)) {
      state.errors = { email: 'Enter a valid email address.' };
      scheduleRender();
      return;
    }
    state.errors = {};
    state.saveState = 'saving';
    scheduleRender();
    fireAnalytics('save_design', { klaviyo_opt: state.klaviyoOptIn });

    var apiBase = window.SkierDNAApiBase || '';
    if (apiBase) {
      var spec = computeSpec(state);
      fetch(apiBase + '/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: state.email,
          klaviyo_opt: state.klaviyoOptIn,
          klaviyo_list_id: config.settings ? config.settings.klaviyoListId : '',
          name: state.name, spec: spec, personality: state.personality,
          answers: { regions: state.regions, dayTypes: state.dayTypes, terrain: state.terrain, stability: state.stability, bindings: state.bindings, height: state.heightVal, weight: state.weightVal, ability: state.ability },
        }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) { state.saveState = 'saved'; if (data.design_id) state.designId = data.design_id; clearSession(); scheduleRender(); })
        .catch(function () { state.saveState = 'saved'; clearSession(); scheduleRender(); });
    } else {
      setTimeout(function () { state.saveState = 'saved'; clearSession(); scheduleRender(); }, 600);
    }
  }

  function fireAnalytics(event, data) {
    if (typeof window.gtag === 'function') window.gtag('event', 'skier_dna_' + event, Object.assign({ event_category: 'skier_dna' }, data || {}));
    if (window.dataLayer) window.dataLayer.push(Object.assign({ event: 'skier_dna_' + event }, data || {}));
  }

  // ── AI personality narratives ─────────────────────────────────────────────
  function fetchPersonalityNarratives(state, config, onSettled) {
    var url = config.settings && config.settings.personalitiesUrl;
    if (!url) { if (onSettled) onSettled(); return; }
    state.personalityNarrativesLoading = true;

    var spec = computeSpec(state);
    var personalities = computePersonalities(state, spec, config.materials || []);

    var builds = personalities.map(function (p) {
      var materials = [];
      var mats = p.selectedMaterials || {};
      Object.keys(mats).forEach(function (cat) {
        var m = mats[cat];
        if (m) materials.push({ category: cat, name: m.name, tags: m.personality_tags || [] });
      });
      return { id: p.id, materials: materials };
    });

    var payload = {
      skier: {
        name: state.name,
        regions: state.regions,
        dayTypes: state.dayTypes,
        terrain: state.terrain,
        stability: state.stability,
        ability: state.ability,
        height: state.heightVal ? state.heightVal + state.heightUnit : '',
        weight: state.weightVal ? state.weightVal + state.weightUnit : '',
      },
      builds: builds,
    };

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        state.personalityNarrativesLoading = false;
        if (data && Array.isArray(data.personalities) && data.personalities.length === 3) {
          state.personalityNarratives = data.personalities;
        }
        if (onSettled) onSettled();
      })
      .catch(function (err) {
        state.personalityNarrativesLoading = false;
        console.warn('[SkierDNA] personality narratives unavailable', err);
        if (onSettled) onSettled();
      });
  }

  // ── mount ─────────────────────────────────────────────────────────────────
  function boot(root) {
    if (!root || root.dataset.sdBooted) return;
    root.dataset.sdBooted = '1';

    var cfgEl = root.querySelector('script[data-skier-dna-config]');
    var config = {};
    try { config = JSON.parse(cfgEl ? cfgEl.textContent : '{}'); }
    catch (e) { console.error('[SkierDNA] bad config JSON', e); }

    var settings = {
      calendlyUrl:        root.dataset.calendlyUrl      || '',
      klaviyoListId:      root.dataset.klaviyoList       || '',
      showPackages:       root.dataset.showPackages     !== 'false',
      trueScaleAnchor:    root.dataset.trueScale        !== 'false',
      graphicsCollection: root.dataset.graphicsCollection || null,
      personalitiesUrl:   root.dataset.personalitiesUrl  || '',
    };
    config.settings  = settings;
    config.showPackages = settings.showPackages;

    // Measure sticky header if setting was 0
    var hOffset = parseInt(root.style.getPropertyValue('--sd-header-offset') || '0', 10);
    if (!hOffset) {
      var hdr = document.querySelector('.header-wrapper, [id*="header"], header');
      if (hdr) {
        var hh = hdr.getBoundingClientRect().height;
        if (hh > 0) root.style.setProperty('--sd-header-offset', hh + 'px');
      }
    }

    var state = makeState();
    state.calendlyUrl = settings.calendlyUrl;

    // Resume from saved-design email link (?sd_design=)
    var urlParams = new URLSearchParams(window.location.search);
    var resumeId = urlParams.get('sd_design');
    if (resumeId) {
      state.resumeBanner = true;
      state.resumeSource = 'url';
      state.act = 5;
    } else {
      // Restore in-progress session from localStorage
      var saved = loadSession();
      if (saved) {
        PERSIST_KEYS.forEach(function (k) {
          if (saved[k] !== undefined) state[k] = saved[k];
        });
        if (state.act > 1) {
          state.resumeBanner = true;
          state.resumeSource = 'local';
        }
      }
    }

    // rAF-throttled render — saves session after every paint
    var pending = false;
    function scheduleRender() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        render(root, state, config);
        saveSession(state);
      });
    }

    // Initial render (no save — state was just loaded)
    render(root, state, config);

    // Event delegation — clicks
    root.addEventListener('click', function (e) {
      dispatch(e, root, state, config, scheduleRender);
    });

    // input / change (sliders, text inputs, checkboxes)
    root.addEventListener('input', function (e) {
      var t = e.target, action = t.dataset.sdAction;
      if (!action) return;

      // Fluid slider: move knob/fillbar directly without a full re-render.
      // The 'change' event (fires on pointer/touch release) triggers the full
      // re-render that updates the ski SVG, labels, and session save.
      if (action === 'stability' || action === 'selected-length' || action === 'selected-waist') {
        var min = parseFloat(t.min) || 0, max = parseFloat(t.max) || 100;
        var pct = max > min ? ((parseFloat(t.value) - min) / (max - min)) * 100 : 50;
        var slider = t.closest('.sd-slider');
        if (slider) {
          var knob = slider.querySelector('.sd-knob');
          var fill = slider.querySelector('.sd-fillbar');
          if (knob) knob.style.left = pct + '%';
          if (fill) fill.style.width = pct + '%';
        }
        // Keep state in sync so 'change' re-render uses the latest value
        if (action === 'stability')       state.stability      = parseFloat(t.value) / 100;
        else if (action === 'selected-length') state.selectedLength = parseInt(t.value, 10);
        else if (action === 'selected-waist')  state.selectedWaist  = parseInt(t.value, 10);
        return; // skip scheduleRender — handled by 'change' below
      }

      dispatch({ target: t, type: 'input' }, root, state, config, scheduleRender);
    });
    root.addEventListener('change', function (e) {
      var t = e.target, action = t.dataset.sdAction;
      if (!action) return;
      dispatch({ target: t, type: 'change' }, root, state, config, scheduleRender);
    });

    // Graphics overlay close (button lives outside the island's event delegation)
    var gvOverlay = document.getElementById('sd-graphics-overlay');
    if (gvOverlay) {
      function closeGvOverlay() {
        gvOverlay.hidden = true;
        document.body.style.overflow = '';
      }
      gvOverlay.addEventListener('click', function (e) {
        if (e.target.closest('[data-sd-gv-close]')) closeGvOverlay();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !gvOverlay.hidden) closeGvOverlay();
      });
    }

    // Theme editor reload
    document.addEventListener('shopify:section:load', function (evt) {
      if (evt.target && evt.target.contains(root)) {
        root.dataset.sdBooted = '';
        boot(root);
      }
    });
  }

  function init() {
    document.querySelectorAll('#skier-dna-root, [data-skier-dna]').forEach(boot);
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
