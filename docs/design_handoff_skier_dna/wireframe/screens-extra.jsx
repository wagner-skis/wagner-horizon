// ───────────────────────────────────────────────────────────
// Flow diagram · Universal component reference · Ski-state strip
// · Modals & empty/loading/error states.
// ───────────────────────────────────────────────────────────

// ===== Flow diagram ==========================================
function FBox({ children, sub, kind = 'act', w = 150 }) {
  const styles = {
    act: { border: '2px solid var(--wf-ink)', background: '#fff' },
    modal: { border: '1.5px dashed var(--wf-sel)', background: 'var(--wf-sel-fill)' },
    entry: { border: '1.5px solid var(--wf-line)', background: 'var(--wf-fill)' },
  }[kind];
  return (
    <div style={{ width: w, borderRadius: 9, padding: '14px 14px', textAlign: 'center', ...styles }}>
      <div style={{ font: '700 13px/1.2 var(--wf-sans)', color: 'var(--wf-ink)' }}>{children}</div>
      {sub && <div className="wf-hint" style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
function Arrow({ dir = '→', label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--wf-ink-3)', minWidth: 32 }}>
      <div style={{ fontSize: 20, lineHeight: 1 }}>{dir}</div>
      {label && <div className="wf-hint" style={{ fontFamily: 'var(--wf-mono)' }}>{label}</div>}
    </div>
  );
}
function FlowDiagram() {
  return (
    <div className="wf" style={{ height: '100%', padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 0, background: '#fff' }}>
      <div className="wf-eyebrow" style={{ marginBottom: 6 }}>End-to-end flow</div>
      <div className="wf-h2" style={{ marginBottom: 32 }}>Skier DNA — five acts + modal branches</div>

      {/* main act chain */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <FBox sub="name">Act 1 · Hello</FBox><Arrow />
        <FBox sub="region · day · terrain">Act 2 · Where &amp; When</FBox><Arrow />
        <FBox sub="slider · current skis · bindings">Act 3 · Feel</FBox><Arrow />
        <FBox sub="height · weight · optional">Act 4 · You</FBox><Arrow label="loading 2–3s" />
        <FBox sub="recommendation" kind="act" w={160}>Act 5 · Your Design</FBox>
      </div>

      {/* name picker interstitial note */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--wf-ink-3)' }}>
          <span className="wf-hint" style={{ fontFamily: 'var(--wf-mono)' }}>after personality select →</span>
          <FBox kind="entry" w={150} sub="3 tiles + surprise me">Name picker</FBox>
        </div>
      </div>

      {/* branches from Act 5 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
        <div style={{ width: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Arrow dir="↓" />
          <div style={{ display: 'flex', gap: 18 }}>
            <FBox kind="modal" sub="category + Shopify filters">Explore Graphics</FBox>
            <FBox kind="modal" sub="email · Klaviyo opt-in">Save Design modal</FBox>
            <FBox kind="modal" sub="Calendly embed">Book Call modal</FBox>
          </div>
        </div>
      </div>

      {/* resume entry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 30, padding: '16px 18px', border: '1px dashed var(--wf-line)', borderRadius: 10, background: 'var(--wf-fill)', alignSelf: 'flex-start' }}>
        <FBox kind="entry" w={170} sub="from saved-design email">Resume Design link</FBox>
        <Arrow label="pre-loads spec" />
        <FBox w={150} sub="spec pre-filled">Act 5 · Your Design</FBox>
      </div>

      <div style={{ display: 'flex', gap: 22, marginTop: 'auto', paddingTop: 24, color: 'var(--wf-ink-3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 22, height: 14, border: '2px solid var(--wf-ink)', borderRadius: 3 }}></span><span className="wf-hint">Act screen</span></span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 22, height: 14, border: '1.5px dashed var(--wf-sel)', background: 'var(--wf-sel-fill)', borderRadius: 3 }}></span><span className="wf-hint">Modal / sub-flow</span></span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 22, height: 14, border: '1.5px solid var(--wf-line)', background: 'var(--wf-fill)', borderRadius: 3 }}></span><span className="wf-hint">Entry point</span></span>
      </div>
    </div>
  );
}

// ===== Component reference ===================================
function Spec({ label, children, w }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: w }}>
      <div className="wf-tag">{label}</div>
      <div>{children}</div>
    </div>
  );
}
function RefBoard({ title, children }) {
  return (
    <div className="wf" style={{ height: '100%', padding: '32px 34px', background: '#fff' }}>
      <div className="wf-eyebrow" style={{ marginBottom: 22 }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' }}>{children}</div>
    </div>
  );
}
function RefButtons() {
  return (
    <RefBoard title="Buttons · links — states">
      <Spec label="Primary / default"><Btn>Continue →</Btn></Spec>
      <Spec label="Primary / focus"><Btn state="focus">Continue →</Btn></Spec>
      <Spec label="Primary / disabled"><Btn state="disabled">Continue →</Btn></Spec>
      <Spec label="Secondary (ghost)"><Btn variant="ghost">← Back</Btn></Spec>
      <Spec label="Large (CTA)"><Btn size="lg">Book my design call</Btn></Spec>
      <Spec label="Small"><Btn size="sm">Select</Btn></Spec>
      <Spec label="Link / text"><Btn variant="link">Skip these</Btn></Spec>
    </RefBoard>
  );
}
function RefInputs() {
  return (
    <RefBoard title="Inputs · number · upload — states">
      <Spec label="Text / empty" w={200}><Input placeholder="Type your name…" /></Spec>
      <Spec label="Text / focus" w={200}><Input placeholder="Type…" state="focus" caret /></Spec>
      <Spec label="Text / filled" w={200}><Input value="Sarah" /></Spec>
      <Spec label="Text / error" w={200}><Input value="sarah@" state="error" /><div style={{ marginTop: 8 }}><Alert>Enter a valid email address.</Alert></div></Spec>
      <Spec label="Number + unit toggle" w={200}><Input value="165" suffix={<UnitToggle a="lb" b="kg" />} /></Spec>
      <Spec label="Textarea" w={220}><Textarea placeholder="Free text…" /></Spec>
      <Spec label="Upload / empty" w={260}><Drop sub="Optional · jpg or png" /></Spec>
    </RefBoard>
  );
}
function RefSelection() {
  return (
    <RefBoard title="Selection — radio · chips · picture cards">
      <Spec label="Radio group (large card)" w={220}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><Radio label="Alpine" on /><Radio label="Telemark" /></div>
      </Spec>
      <Spec label="Multi-select + count limit" w={240}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}><Chip on remove>Western NA</Chip><Chip>Europe</Chip></div>
        <Count>● 2 of 3 selected</Count>
      </Spec>
      <Spec label="Picture card / default" w={170}><PCard label="Everyday" photo="[PHOTO]" h={96} /></Spec>
      <Spec label="Picture card / selected" w={170}><PCard label="Powder Days" photo="[PHOTO]" on h={96} /></Spec>
    </RefBoard>
  );
}
function RefControls() {
  return (
    <RefBoard title="Sliders · pills · progress">
      <Spec label="Single slider (range)" w={240}><Slider pos={0.5} /><div className="wf-stops"><span>176</span><span>182</span></div></Spec>
      <Spec label="Bipolar slider (4 stops)" w={320}><Bipolar pos={0.66} active={2} /></Spec>
      <Spec label="Pill toggle (camber)" w={220}><Pills items={['Low', 'Medium', 'High']} on={1} /></Spec>
      <Spec label="Progress breadcrumb (acts only)" w={420}><Progress cur={2} /></Spec>
      <Spec label="Micro-CTA strip" w={300}><MicroCTA /></Spec>
    </RefBoard>
  );
}

// ===== Ski-state strip =======================================
function SkiStrip() {
  return (
    <div className="wf" style={{ height: '100%', padding: '30px 30px', background: '#fff' }}>
      <div className="wf-eyebrow" style={{ marginBottom: 4 }}>Ski Silhouette Panel — the centerpiece</div>
      <div className="wf-body" style={{ marginBottom: 22 }}>Eight evolution states. Top view shows shape · waist · graphic; side profile shows camber · rocker · flex.</div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        {SKI_STATES.map((s) => (
          <div key={s.n} style={{ flex: 1, textAlign: 'center', borderLeft: s.n ? '1px dashed var(--wf-line-soft)' : 'none', padding: '0 4px' }}>
            <div style={{ height: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <SkiPanel {...s.props} profile={s.n !== 7} height={244} />
            </div>
            <div className="wf-pin" style={{ position: 'static', margin: '10px auto 6px' }}>{s.n}</div>
            <div className="wf-label" style={{ fontSize: 12, marginBottom: 3, textWrap: 'pretty' }}>{s.label}</div>
            <div className="wf-hint" style={{ fontFamily: 'var(--wf-mono)', fontSize: 10 }}>{s.act}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Modals & states =======================================
function Check({ on, label }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ width: 18, height: 18, borderRadius: 4, border: '1.5px solid ' + (on ? 'var(--wf-sel)' : 'var(--wf-line)'), background: on ? 'var(--wf-sel)' : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flex: '0 0 auto', marginTop: 1 }}>{on ? '✓' : ''}</span>
      <span className="wf-body" style={{ color: 'var(--wf-ink-2)' }}>{label}</span>
    </div>
  );
}
function Backdrop({ children, label }) {
  return (
    <div className="wf" style={{ height: '100%', background: 'rgba(40,40,40,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30, position: 'relative' }}>
      {label && <div style={{ position: 'absolute', top: 14, left: 16, font: '600 11px/1 var(--wf-mono)', color: 'rgba(255,255,255,.85)' }}>{label}</div>}
      {children}
    </div>
  );
}
function SaveModal() {
  return (
    <Backdrop label="dimmed page behind">
      <Modal title="Email me this design" w={420}>
        <Field label="Email address"><Input placeholder="you@email.com" /></Field>
        <Check on label="Send me occasional ski news and offers. (Klaviyo marketing consent — unticked by default.)" />
        <Btn block>Save and email me</Btn>
        <div style={{ textAlign: 'center' }}><Btn variant="link">Maybe later</Btn></div>
      </Modal>
    </Backdrop>
  );
}
function SaveConfirm() {
  return (
    <Backdrop label="confirmation state">
      <Modal title="Email me this design" w={420}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, padding: '14px 0' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid var(--wf-sel)', color: 'var(--wf-sel)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✓</div>
          <div className="wf-h3">Saved. Check your inbox.</div>
          <div className="wf-body">We've emailed your design to sarah@email.com. The link reopens it any time.</div>
          <Btn variant="ghost">Done</Btn>
        </div>
      </Modal>
    </Backdrop>
  );
}
function SaveError() {
  return (
    <Backdrop label="invalid email — inline error">
      <Modal title="Email me this design" w={420}>
        <Field label="Email address"><Input value="sarah@" state="error" /></Field>
        <Alert>Enter a valid email address.</Alert>
        <Check label="Send me occasional ski news and offers." />
        <Btn block>Save and email me</Btn>
      </Modal>
    </Backdrop>
  );
}
function BookModal() {
  return (
    <Backdrop label="dimmed page behind">
      <Modal title="Book my design call" w={460}
        summary={<><b>Your design:</b> Silver package · 179 cm · 101 mm waist · medium camber · Ride Personality 1. We'll talk it through with a Wagner designer.</>}>
        <div className="wf-ph" style={{ height: 300, borderRadius: 8 }}>[ Calendly inline embed ]</div>
      </Modal>
    </Backdrop>
  );
}
function ResumeState() {
  return (
    <DesktopFrame>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'var(--wf-sel-fill)', borderBottom: '1px solid var(--wf-sel-line)', padding: '12px 30px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--wf-sel)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>↩</span>
          <span className="wf-body" style={{ color: 'var(--wf-ink)' }}><b>Welcome back, Sarah.</b> We've reopened your saved design — pick up right where you left off.</span>
        </div>
        <TopBar cur={4} micro />
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <div style={{ flexBasis: '38%', background: 'var(--wf-fill)', borderRight: '1px solid var(--wf-line-soft)', display: 'flex', flexDirection: 'column', padding: '24px 20px' }}>
            <div className="wf-eyebrow" style={{ marginBottom: 8 }}>Your saved ski</div>
            <div style={{ flex: 1, display: 'flex' }}><SkiPanel {...skiState(8)} height={420} caption="restored from saved spec" /></div>
          </div>
          <div style={{ flexBasis: '62%', padding: '28px 34px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="wf-h2">Your design, just as you left it</div>
            <SpecSheet />
            <div style={{ display: 'flex', gap: 14 }}><Btn size="lg">Book my design call</Btn><Btn variant="ghost" size="lg">Keep exploring</Btn></div>
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}
function LoadingState() {
  return (
    <DesktopFrame>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TopBar cur={4} micro />
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <div style={{ flexBasis: '38%', background: 'var(--wf-fill)', borderRight: '1px solid var(--wf-line-soft)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
            <div className="wf-skel" style={{ width: 70, height: 360, borderRadius: 40 }}></div>
            <div className="wf-hint" style={{ fontFamily: 'var(--wf-mono)' }}>shaping your ski…</div>
          </div>
          <div style={{ flexBasis: '62%', padding: '30px 36px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="wf-skel" style={{ width: 280, height: 26 }}></div>
            <div style={{ display: 'flex', gap: 12 }}>{[0, 1, 2].map((i) => <div key={i} className="wf-skel" style={{ flex: 1, height: 150, borderRadius: 11 }}></div>)}</div>
            <div className="wf-skel" style={{ width: '100%', height: 120, borderRadius: 11 }}></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}><div className="wf-skel" style={{ height: 240, borderRadius: 11 }}></div><div className="wf-skel" style={{ height: 240, borderRadius: 11 }}></div></div>
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}
function RequiredError() {
  return (
    <DesktopFrame>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TopBar cur={0} />
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <div style={{ flexBasis: '58%', padding: '52px 56px' }}>
            <div style={{ maxWidth: 460 }}>
              <div className="wf-eyebrow" style={{ marginBottom: 18 }}>Let's build your ski</div>
              <div className="wf-h1" style={{ marginBottom: 14 }}>First up — what should we call you?</div>
              <Field label="Your first name" style={{ marginBottom: 10 }}><Input placeholder="Type your name…" state="error" /></Field>
              <div style={{ marginBottom: 26 }}><Alert>We just need a first name to continue.</Alert></div>
              <Btn>Continue →</Btn>
              <div className="wf-hint" style={{ marginTop: 14, fontFamily: 'var(--wf-mono)' }}>Brief inline message — never a full-page block.</div>
            </div>
          </div>
          <div style={{ flexBasis: '42%' }}><SkiSide n={0} h={420} evo="State 0 — unchanged" /></div>
        </div>
      </div>
    </DesktopFrame>
  );
}

// ===== Explore Graphics (dense library) ======================
const GRAPHIC_CATS = ['House Graphics', 'Artist Series', 'James Niehues', 'Wood Veneers'];
const GRAPHIC_NAMES = ['Alpenglow', 'Ridgeline', 'Aurora Fade', 'Timberline', 'Summit Lines', 'Glacier', 'Dawn Patrol', 'Topo Map', 'Spectrum', 'Basalt', 'Meadowlark', 'Cirque'];

function Tabs({ items, active = 1 }) {
  return (
    <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--wf-line-soft)' }}>
      {items.map((t, i) => (
        <div key={t} style={{ padding: '0 0 12px', font: '600 14px/1 var(--wf-sans)', color: i === active ? 'var(--wf-ink)' : 'var(--wf-ink-3)', borderBottom: '2px solid ' + (i === active ? 'var(--wf-sel)' : 'transparent'), marginBottom: -1, whiteSpace: 'nowrap' }}>{t}</div>
      ))}
    </div>
  );
}
function FilterPill({ label, val }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1.5px solid ' + (val ? 'var(--wf-sel)' : 'var(--wf-line)'), background: val ? 'var(--wf-sel-fill)' : '#fff', color: val ? 'var(--wf-sel)' : 'var(--wf-ink-2)', borderRadius: 8, padding: '8px 12px', font: '600 13px/1 var(--wf-sans)' }}>
      {label}{val && <span style={{ fontFamily: 'var(--wf-mono)' }}>: {val}</span>}
      <span style={{ opacity: .6 }}>▾</span>
    </span>
  );
}
function GraphicTile({ name, cat, on, h = 96 }) {
  return (
    <div className={'wf-pcard' + (on ? ' on' : '')}>
      <div style={{ position: 'relative' }}>
        <Ph label="[GRAPHIC]" style={{ height: h, border: 'none', borderRadius: 0 }} />
        {on && <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: 'var(--wf-sel)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</div>}
      </div>
      <div style={{ padding: '7px 9px' }}>
        <div style={{ font: '600 12px/1.2 var(--wf-sans)' }}>{name}</div>
        {cat && <div className="wf-hint" style={{ fontFamily: 'var(--wf-mono)', fontSize: 10 }}>{cat}</div>}
      </div>
    </div>
  );
}
function GraphicsExplorer() {
  return (
    <Backdrop label="full-screen overlay over Act 5">
      <div className="wf-surface" style={{ width: 1040, height: 660, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--wf-line-soft)' }}>
          <div>
            <div className="wf-h3">Explore graphics</div>
            <div className="wf-hint" style={{ fontFamily: 'var(--wf-mono)', marginTop: 3 }}>Ride Personality 1 · 179 × 101 mm</div>
          </div>
          <div style={{ width: 28, height: 28, border: '1.5px solid var(--wf-line)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--wf-ink-3)' }}>×</div>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          {/* live preview — tied to the viewer */}
          <div style={{ flexBasis: '34%', background: 'var(--wf-fill)', borderRight: '1px solid var(--wf-line-soft)', padding: '18px 18px', display: 'flex', flexDirection: 'column' }}>
            <div className="wf-eyebrow" style={{ marginBottom: 4 }}>Live preview</div>
            <div className="wf-hint" style={{ marginBottom: 8 }}>Updates as you browse — on your ski, at scale.</div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center' }}><SkiPanel {...skiState(8)} profile={false} height={330} /></div>
            <div className="wf-surface" style={{ borderRadius: 9, padding: '10px 12px', background: '#fff', marginBottom: 10 }}>
              <div className="wf-hint" style={{ fontFamily: 'var(--wf-mono)' }}>Selected</div>
              <div className="wf-label">Alpenglow · Artist Series</div>
            </div>
            <Btn block>Use this graphic</Btn>
          </div>
          {/* library */}
          <div style={{ flexBasis: '66%', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <Tabs items={GRAPHIC_CATS} active={1} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="wf-hint" style={{ fontWeight: 600 }}>Filter</span>
              <FilterPill label="Pattern" />
              <FilterPill label="Color" val="Blue" />
              <span className="wf-tag">Shopify Filters</span>
              <span className="wf-hint" style={{ marginLeft: 'auto', fontFamily: 'var(--wf-mono)' }}>128 graphics</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, alignContent: 'start', overflow: 'hidden' }}>
              {GRAPHIC_NAMES.map((nm, i) => <GraphicTile key={nm} name={nm} cat={i % 3 === 0 ? 'Artist Series' : null} on={i === 0} h={88} />)}
            </div>
            <div className="wf-hint" style={{ borderTop: '1px solid var(--wf-line-soft)', paddingTop: 10 }}>
              Want something fully custom? <u>We'll explore that together on your design call.</u> <span className="wf-tag" style={{ marginLeft: 6 }}>not in this flow</span>
            </div>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}
function GraphicsExplorerMobile() {
  return (
    <PhoneFrame>
      {/* sticky preview header */}
      <div style={{ background: 'var(--wf-fill)', borderBottom: '1px solid var(--wf-line-soft)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <SkiPanel {...skiState(8)} profile={false} height={70} />
        <div style={{ flex: 1 }}>
          <div className="wf-eyebrow" style={{ marginBottom: 2 }}>Explore graphics</div>
          <div className="wf-hint" style={{ fontFamily: 'var(--wf-mono)' }}>Selected: Alpenglow · Artist Series</div>
        </div>
        <div style={{ width: 26, height: 26, border: '1.5px solid var(--wf-line)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--wf-ink-3)' }}>×</div>
      </div>
      <div style={{ padding: '14px 16px 84px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 16, overflow: 'hidden' }}>
          {GRAPHIC_CATS.map((t, i) => <span key={t} style={{ font: '600 13px/1 var(--wf-sans)', color: i === 1 ? 'var(--wf-ink)' : 'var(--wf-ink-3)', borderBottom: '2px solid ' + (i === 1 ? 'var(--wf-sel)' : 'transparent'), paddingBottom: 8, whiteSpace: 'nowrap' }}>{t}</span>)}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <FilterPill label="Pattern" />
          <FilterPill label="Color" val="Blue" />
          <span className="wf-hint" style={{ marginLeft: 'auto', fontFamily: 'var(--wf-mono)' }}>128</span>
        </div>
        <span className="wf-tag">data from Shopify Filters</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {GRAPHIC_NAMES.slice(0, 6).map((nm, i) => <GraphicTile key={nm} name={nm} cat={i % 3 === 0 ? 'Artist Series' : null} on={i === 0} h={92} />)}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14, background: '#fff', borderTop: '1px solid var(--wf-line)' }}>
        <Btn block>Use this graphic</Btn>
      </div>
    </PhoneFrame>
  );
}

Object.assign(window, {
  FlowDiagram, RefButtons, RefInputs, RefSelection, RefControls, SkiStrip,
  SaveModal, SaveConfirm, SaveError, BookModal, ResumeState, LoadingState, RequiredError,
  GraphicsExplorer, GraphicsExplorerMobile,
});
