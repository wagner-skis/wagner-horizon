// ───────────────────────────────────────────────────────────
// Wireframe primitives shared across every screen.
// Thin wrappers over the classes in wireframe.css. Exported to
// window so each Babel script can use them.
// ───────────────────────────────────────────────────────────

// ----- frames -------------------------------------------------
function DesktopFrame({ url = 'wagnerskis.com/design', children, h = '100%' }) {
  return (
    <div className="wf" style={{ height: h, display: 'flex', flexDirection: 'column' }}>
      <div className="wf-chrome">
        <i></i><i></i><i></i>
        <div className="wf-url">{url}</div>
      </div>
      <div style={{ flex: '1 1 auto', minHeight: 0, position: 'relative' }}>{children}</div>
    </div>
  );
}

function PhoneFrame({ children, time = '9:41' }) {
  return (
    <div className="wf wf-phone">
      <div className="wf-notch"></div>
      <div className="wf-statusbar"><span>{time}</span><span>5G ▢▢ 100%</span></div>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}

// ----- annotation rail + pins --------------------------------
function Pin({ n, x, y, style }) {
  return <div className="wf-pin" style={{ left: x, top: y, ...style }}>{n}</div>;
}

function Rail({ head = 'Notes for build', notes = [], children, w = 360 }) {
  return (
    <div className="wf-rail" style={{ flexBasis: w, maxWidth: w }}>
      <div className="wf-railhead">{head}</div>
      {notes.map((nt, i) => (
        <div key={i} className={'wf-note' + (nt.plain ? ' plain' : '')}>
          <div className="n">{nt.n}</div>
          <div className="tx">{nt.t}</div>
        </div>
      ))}
      {children}
    </div>
  );
}

// board = stage (fixed width) + rail
function Board({ stageW, children, rail, railW = 360 }) {
  return (
    <div className="wf-board">
      <div className="wf-stage" style={{ flexBasis: stageW, width: stageW }}>{children}</div>
      {rail}
    </div>
  );
}

// ----- header / progress -------------------------------------
const ACTS = ['Hello', 'Where & when', 'Feel', 'You', 'Your design'];
function Progress({ cur = 0, compact = false }) {
  return (
    <div className="wf-progress">
      {ACTS.map((a, i) => (
        <React.Fragment key={a}>
          {i > 0 && <span className="lead"></span>}
          <span className={'step' + (i < cur ? ' done' : '') + (i === cur ? ' cur' : '')}>
            <span className="d"></span>{!compact && <span>{a}</span>}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

function MicroCTA() {
  return <div className="wf-micro">Prefer to talk it through? <u>Book a 20-min call</u></div>;
}

function TopBar({ cur = 0, micro = false, compact = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '16px 30px', borderBottom: '1px solid var(--wf-line-soft)' }}>
      <div style={{ font: '700 13px/1 var(--wf-mono)', letterSpacing: '.16em', color: 'var(--wf-ink)' }}>WAGNER<span style={{ color: 'var(--wf-ink-3)' }}> ▢ logo</span></div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}><Progress cur={cur} compact={compact} /></div>
      {micro ? <MicroCTA /> : <div style={{ width: 60 }}></div>}
    </div>
  );
}

// ----- buttons -----------------------------------------------
function Btn({ children, variant = 'primary', size, state, block, style }) {
  const cls = ['wf-btn',
    variant === 'ghost' ? 'ghost' : variant === 'link' ? 'link' : '',
    size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : '',
    state || '', block ? 'block' : ''].filter(Boolean).join(' ');
  return <div className={cls} style={style}>{children}</div>;
}

// ----- inputs ------------------------------------------------
function Field({ label, hint, children, style }) {
  return (
    <div className="wf-field" style={style}>
      {label && <div className="wf-label">{label}</div>}
      {children}
      {hint && <div className="wf-hint">{hint}</div>}
    </div>
  );
}
function Input({ placeholder, value, state, caret, suffix, style }) {
  const cls = 'wf-input' + (value ? ' filled' : '') + (state ? ' ' + state : '');
  return (
    <div className={cls} style={style}>
      <span style={{ flex: 1 }}>{value || placeholder}{caret && <span className="wf-caret"></span>}</span>
      {suffix && <span className="wf-hint">{suffix}</span>}
    </div>
  );
}
function Textarea({ placeholder, value, style }) {
  return <div className={'wf-input wf-textarea' + (value ? ' filled' : '')} style={style}>{value || placeholder}</div>;
}
function UnitToggle({ a, b, on = 0 }) {
  return <span className="wf-toggle"><span className={on === 0 ? 'on' : ''}>{a}</span><span className={on === 1 ? 'on' : ''}>{b}</span></span>;
}
function Drop({ label = 'Drag a photo here, or tap to upload', sub }) {
  return (
    <div className="wf-drop">
      <div className="ic">↑</div>
      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--wf-ink-2)' }}>{label}</div>
      {sub && <div className="wf-hint">{sub}</div>}
    </div>
  );
}

// ----- placeholders ------------------------------------------
function Ph({ label, style }) { return <div className="wf-ph" style={style}>{label}</div>; }
function Greek({ lines = 3, w = ['100%', '92%', '60%'], style }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
    {[...Array(lines)].map((_, i) => <span key={i} className="wf-greek" style={{ width: (w[i] || '80%') }}></span>)}
  </div>;
}

// ----- selection controls ------------------------------------
function Chip({ children, on, remove }) {
  return <span className={'wf-chip' + (on ? ' on' : '')}>{children}{on && remove && <span className="x">×</span>}</span>;
}
function Count({ children }) { return <span className="wf-count">{children}</span>; }
function PCard({ label, photo, on, w, h = 120 }) {
  return (
    <div className={'wf-pcard' + (on ? ' on' : '')} style={{ width: w }}>
      <Ph label={photo} style={{ height: h, border: 'none', borderRadius: 0 }} />
      <div className="cap"><span className="nm">{label}</span><span className="wf-check">{on ? '✓' : ''}</span></div>
    </div>
  );
}
function Radio({ label, on }) {
  return <div className={'wf-radio' + (on ? ' on' : '')}><span className="dot"></span>{label}</div>;
}
function Pills({ items, on = 1 }) {
  return <div className="wf-pills">{items.map((it, i) => <span key={it} className={i === on ? 'on' : ''}>{it}</span>)}</div>;
}

// ----- sliders -----------------------------------------------
// pos 0..1
function Slider({ pos = 0.5, fill = true, stops, active }) {
  return (
    <div style={{ width: '100%' }}>
      <div className="wf-slider">
        <div className="wf-track"></div>
        {fill && <div className="wf-fillbar" style={{ width: `calc(${pos * 100}% )` }}></div>}
        <div className="wf-knob" style={{ left: `${pos * 100}%` }}></div>
      </div>
      {stops && <div className="wf-stops">{stops.map((s, i) => <span key={i} className={i === active ? '' : ''} style={i === active ? { color: 'var(--wf-sel)' } : null}>{s}</span>)}</div>}
    </div>
  );
}
// bipolar slider with 4 labelled stops
function Bipolar({ pos = 0.66, left = 'Stable', right = 'Light', stops = ['Stable', 'Balanced-stable', 'Balanced-light', 'Light'], active = 2 }) {
  return (
    <div style={{ width: '100%' }}>
      <div className="wf-slider">
        <div className="wf-track"></div>
        <div className="wf-ticks">{stops.map((s, i) => <i key={i}></i>)}</div>
        <div className="wf-knob" style={{ left: `${pos * 100}%` }}></div>
      </div>
      <div className="wf-stops">{stops.map((s, i) => <span key={i} style={i === active ? { color: 'var(--wf-sel)' } : null}>{s}</span>)}</div>
    </div>
  );
}

// ----- alerts / misc -----------------------------------------
function Alert({ children }) { return <div className="wf-alert"><span className="ic">!</span>{children}</div>; }
function Modal({ title, w = 440, children, summary }) {
  return (
    <div className="wf-surface" style={{ width: w, borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,.18)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--wf-line-soft)' }}>
        <div className="wf-h3">{title}</div>
        <div style={{ width: 26, height: 26, border: '1.5px solid var(--wf-line)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--wf-ink-3)' }}>×</div>
      </div>
      {summary && <div style={{ padding: '12px 20px', background: 'var(--wf-fill)', borderBottom: '1px solid var(--wf-line-soft)', font: '12px/1.5 var(--wf-sans)', color: 'var(--wf-ink-2)' }}>{summary}</div>}
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </div>
  );
}

// ----- world map region selector -----------------------------
// Schematic blobs + selectable region markers. selected = array of keys.
const REGIONS = [
  { k: 'wna', label: 'Western NA', x: 13, y: 30 },
  { k: 'ena', label: 'Eastern NA', x: 27, y: 33 },
  { k: 'eu', label: 'Europe', x: 51, y: 27 },
  { k: 'asia', label: 'Asia', x: 73, y: 32 },
  { k: 'sa', label: 'South America', x: 31, y: 66 },
  { k: 'anz', label: 'Australia / NZ', x: 82, y: 70 },
];
function WorldMap({ selected = [], h = 260 }) {
  const blobs = [
    { x: 6, y: 14, w: 26, h: 34 },   // N America
    { x: 22, y: 50, w: 16, h: 38 },  // S America
    { x: 45, y: 16, w: 16, h: 22 },  // Europe
    { x: 46, y: 38, w: 18, h: 30 },  // Africa
    { x: 62, y: 16, w: 28, h: 30 },  // Asia
    { x: 78, y: 60, w: 14, h: 16 },  // Australia
  ];
  return (
    <div style={{ position: 'relative', width: '100%', height: h, border: '1.5px dashed var(--wf-line)', borderRadius: 10, background: 'var(--wf-fill)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 8, left: 12, font: '600 10px/1 var(--wf-mono)', color: 'var(--wf-ink-3)', letterSpacing: '.08em' }}>[ STYLIZED WORLD MAP ]</div>
      {blobs.map((b, i) => (
        <div key={i} style={{ position: 'absolute', left: b.x + '%', top: b.y + '%', width: b.w + '%', height: b.h + '%', background: '#e3e3e1', borderRadius: '40% 55% 50% 45%' }}></div>
      ))}
      {REGIONS.map((r) => {
        const on = selected.includes(r.k);
        return (
          <div key={r.k} className={'wf-chip' + (on ? ' on' : '')}
            style={{ position: 'absolute', left: r.x + '%', top: r.y + '%', transform: 'translate(-50%,-50%)', whiteSpace: 'nowrap', boxShadow: on ? '0 0 0 3px rgba(50,112,168,.18)' : '0 1px 4px rgba(0,0,0,.1)' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: on ? 'var(--wf-sel)' : '#fff', border: '1.5px solid ' + (on ? 'var(--wf-sel)' : 'var(--wf-line)') }}></span>
            {r.label}
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  DesktopFrame, PhoneFrame, Pin, Rail, Board, TopBar, Progress, MicroCTA,
  Btn, Field, Input, Textarea, UnitToggle, Drop, Ph, Greek, Chip, Count,
  PCard, Radio, Pills, Slider, Bipolar, Alert, Modal, WorldMap, ACTS,
});
