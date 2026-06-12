// ───────────────────────────────────────────────────────────
// SkiPanel — the persistent Ski Silhouette Panel (wireframe).
// Schematic, grayscale. Renders a TOP-VIEW silhouette (shape /
// waist / sidecut / topsheet) plus a SIDE-PROFILE line (camber /
// rocker / flex). Feature flags drive all 8 evolution states.
// Wireframe blue marks whatever just changed.
//
//   <SkiPanel waist={24} base="wood" caption="State 0 — bare" />
//
// Exports: SkiPanel, skiState(n) -> props, SKI_STATES (labels).
// ───────────────────────────────────────────────────────────

const SKI_BLUE = '#3270a8';
const SKI_INK = '#2b2b2b';
const SKI_LINE = '#bdbdbd';
const SKI_MUTE = '#8c8c8c';

// Build the symmetric top-view outline path for given half-widths.
function skiOutline(sh, wa, ta, cx) {
  const r = (w) => cx + w, l = (w) => cx - w;
  return [
    `M ${cx} 22`,
    `C ${cx} 40, ${r(sh)} 56, ${r(sh)} 80`,
    `C ${r(sh)} 152, ${r(wa)} 212, ${r(wa)} 290`,
    `C ${r(wa)} 382, ${r(ta)} 432, ${r(ta)} 500`,
    `C ${r(ta)} 520, ${r(4)} 532, ${r(4)} 542`,
    `L ${l(4)} 542`,
    `C ${l(4)} 532, ${l(ta)} 520, ${l(ta)} 500`,
    `C ${l(ta)} 432, ${l(wa)} 382, ${l(wa)} 290`,
    `C ${l(wa)} 212, ${l(sh)} 152, ${l(sh)} 80`,
    `C ${l(sh)} 56, ${cx} 40, ${cx} 22`,
    'Z',
  ].join(' ');
}

// Side-profile (camber / rocker / flex) as a single stroked path.
function skiProfile(rockerTip, rockerTail, camber, flex) {
  const base = 60;
  const midY = base - camber + flex;          // flex pushes the arch down
  return [
    `M 18 ${base - rockerTip}`,
    `Q 70 ${base - rockerTip} 110 ${base - 2}`,
    `Q 200 ${base - 2} 290 ${midY}`,
    `Q 380 ${base - 2} 470 ${base - 2}`,
    `Q 530 ${base - 2} 562 ${base - rockerTail}`,
  ].join(' ');
}

function SkiPanel(props) {
  const {
    sh = 30, waist = 24, ta = 27, cx = 65,
    base = 'wood',                 // 'none' | 'wood' | 'snow'
    graphic = false,
    layers = null,                 // null | 'metal' | 'carbon' | 'both'
    binding = false,
    ghost = false,
    body = false,
    dimWaist = false,
    rockerTip = 0, rockerTail = 0, camber = 9, flex = 0,
    profile = true,
    caption,
    height = 520,
  } = props;

  const path = skiOutline(sh, waist, ta, cx);
  const uid = React.useId().replace(/:/g, '');
  const clip = 'c' + uid;

  const topW = 130;
  // Top-view SVG (vertical ski). Standing figure optionally to the left.
  const topView = (
    <svg viewBox={`0 0 ${body ? 230 : topW} 560`} style={{ height: '100%', maxHeight: height, width: 'auto', display: 'block' }}>
      <defs>
        <clipPath id={clip}><path d={path} /></clipPath>
      </defs>

      {/* ghost of current ski, offset behind */}
      {ghost && (
        <g transform="translate(-14,14) scale(0.94)" transform-origin="65 280">
          <path d={skiOutline(28, 26, 25, cx)} fill="none" stroke={SKI_MUTE} strokeWidth="1.4" strokeDasharray="5 4" opacity="0.8" />
          <text x={cx - 40} y="556" fontFamily="var(--wf-mono)" fontSize="9" fill={SKI_MUTE}>ghost: current ski</text>
        </g>
      )}

      {/* standing body figure at matching scale */}
      {body && (
        <g stroke={SKI_INK} strokeWidth="1.6" fill="none" strokeLinecap="round">
          <line x1="30" y1="40" x2="30" y2="540" stroke={SKI_LINE} strokeDasharray="3 4" />
          <circle cx="30" cy="120" r="13" />
          <line x1="30" y1="133" x2="30" y2="250" />
          <line x1="30" y1="160" x2="12" y2="215" />
          <line x1="30" y1="160" x2="48" y2="215" />
          <line x1="30" y1="250" x2="16" y2="350" />
          <line x1="30" y1="250" x2="44" y2="350" />
          <text x="6" y="34" fontFamily="var(--wf-mono)" fontSize="8.5" fill={SKI_MUTE}>head</text>
        </g>
      )}

      <g transform={body ? 'translate(70,0)' : ''}>
        {/* base / construction fill */}
        <g clipPath={`url(#${clip})`}>
          <rect x="0" y="0" width={topW} height="560" fill="#fafafa" />
          {base === 'wood' && [...Array(7)].map((_, i) => (
            <path key={i} d={`M ${30 + i * 9} 30 q 6 270 0 510`} stroke={SKI_LINE} strokeWidth="0.8" fill="none" opacity="0.7" />
          ))}
          {base === 'snow' && [...Array(46)].map((_, i) => (
            <circle key={i} cx={32 + (i * 37) % 66} cy={40 + (i * 53) % 500} r="1.5" fill={SKI_BLUE} opacity="0.28" />
          ))}
          {graphic && (
            <>
              <rect x="0" y="0" width={topW} height="560" fill="#eef4fa" />
              {[...Array(28)].map((_, i) => (
                <line key={i} x1={-20 + i * 12} y1="0" x2={-120 + i * 12} y2="560" stroke={SKI_SEL_SOFT} strokeWidth="6" opacity="0.5" />
              ))}
            </>
          )}
          {/* construction layer hints */}
          {layers && (layers === 'metal' || layers === 'both') && (
            <g opacity="0.9">{[...Array(3)].map((_, i) => (
              <line key={i} x1="36" y1={250 + i * 12} x2="94" y2={250 + i * 12} stroke={SKI_MUTE} strokeWidth="2" strokeDasharray="1 3" />
            ))}</g>
          )}
          {layers && (layers === 'carbon' || layers === 'both') && (
            <g opacity="0.8">{[...Array(8)].map((_, i) => (
              <line key={i} x1="34" y1={300 + i * 7} x2="96" y2={300 + i * 7 - 14} stroke={SKI_BLUE} strokeWidth="1" />
            ))}</g>
          )}
        </g>

        {/* outline */}
        <path d={path} fill="none" stroke={SKI_INK} strokeWidth="1.8" />

        {/* topsheet graphic placeholder label */}
        {graphic && (
          <text x={cx} y="300" textAnchor="middle" fontFamily="var(--wf-mono)" fontSize="8.5" fill={SKI_BLUE} transform={`rotate(90 ${cx} 300)`}>[ TOPSHEET GRAPHIC ]</text>
        )}

        {/* binding silhouette */}
        {binding && (
          <g fill="#fff" stroke={SKI_INK} strokeWidth="1.4">
            <path d={`M ${cx - 13} 250 L ${cx + 13} 250 L ${cx + 10} 272 L ${cx - 10} 272 Z`} />
            <path d={`M ${cx - 12} 318 L ${cx + 12} 318 L ${cx + 14} 344 L ${cx - 14} 344 Z`} />
            <line x1={cx} y1="272" x2={cx} y2="318" stroke={SKI_INK} strokeWidth="1.2" />
          </g>
        )}

        {/* waist dimension */}
        {dimWaist && (
          <g stroke={SKI_BLUE} strokeWidth="1.2">
            <line x1={cx - waist} y1="290" x2={cx - waist - 14} y2="290" />
            <line x1={cx + waist} y1="290" x2={cx + waist + 14} y2="290" />
            <text x={cx + waist + 18} y="294" fontFamily="var(--wf-mono)" fontSize="9" fill={SKI_BLUE} stroke="none">waist</text>
          </g>
        )}

        {/* rocker zone hints on top view */}
        {(rockerTip > 0) && <text x={cx + 34} y="84" fontFamily="var(--wf-mono)" fontSize="8" fill={SKI_BLUE}>tip rocker</text>}
        {(rockerTail > 0) && <text x={cx + 30} y="502" fontFamily="var(--wf-mono)" fontSize="8" fill={SKI_BLUE}>tail rocker</text>}
      </g>
    </svg>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, width: '100%' }}>
        {topView}
      </div>
      {profile && (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <svg viewBox="0 0 580 86" style={{ width: '100%', display: 'block' }}>
            <line x1="8" y1="60" x2="572" y2="60" stroke={SKI_LINE} strokeWidth="1" strokeDasharray="4 4" />
            <text x="8" y="78" fontFamily="var(--wf-mono)" fontSize="9" fill={SKI_MUTE}>snow</text>
            <path d={skiProfile(rockerTip, rockerTail, camber, flex)} fill="none"
              stroke={(rockerTip || rockerTail || flex) ? SKI_BLUE : SKI_INK} strokeWidth="2" strokeLinecap="round" />
            <text x="500" y="20" fontFamily="var(--wf-mono)" fontSize="9" fill={SKI_MUTE} textAnchor="end">side profile</text>
          </svg>
        </div>
      )}
      {caption && (
        <div className="wf-ski-note" style={{ textAlign: 'center', maxWidth: 240 }}>{caption}</div>
      )}
    </div>
  );
}

const SKI_SEL_SOFT = '#9cc1de';

// The eight brief-defined evolution states.
const SKI_STATES = [
  { n: 0, act: 'Act 1', label: 'Bare outline', props: { base: 'wood', camber: 9 } },
  { n: 1, act: 'Act 2 · region', label: 'Snow texture on base', props: { base: 'snow', camber: 9 } },
  { n: 2, act: 'Act 2 · day type', label: 'Waist morphs to target', props: { base: 'snow', waist: 33, dimWaist: true, camber: 9 } },
  { n: 3, act: 'Act 2 · terrain', label: 'Tip + tail rocker form', props: { base: 'snow', waist: 33, rockerTip: 16, rockerTail: 11, camber: 7 } },
  { n: 4, act: 'Act 3 · feel', label: 'Construction layer hint', props: { base: 'snow', waist: 31, rockerTip: 16, rockerTail: 11, layers: 'both', flex: 6 } },
  { n: 5, act: 'Act 3 · current skis', label: 'Ghost of current ski', props: { base: 'snow', waist: 31, rockerTip: 16, rockerTail: 11, layers: 'both', ghost: true } },
  { n: 6, act: 'Act 3 · bindings', label: 'Binding silhouette', props: { base: 'snow', waist: 31, rockerTip: 16, rockerTail: 11, layers: 'both', binding: true } },
  { n: 7, act: 'Act 4 · you', label: 'Scaled to body', props: { base: 'snow', waist: 31, rockerTip: 16, rockerTail: 11, binding: true, body: true, profile: false } },
  { n: 8, act: 'Act 5 · final', label: 'Topsheet graphic + spec', props: { base: 'snow', waist: 31, rockerTip: 16, rockerTail: 11, layers: 'both', binding: true, graphic: true, dimWaist: true } },
];

function skiState(n) { return (SKI_STATES.find((s) => s.n === n) || SKI_STATES[0]).props; }

Object.assign(window, { SkiPanel, skiState, SKI_STATES });
