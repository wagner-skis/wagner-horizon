// ───────────────────────────────────────────────────────────
// Act 1 (Hello) + Act 2 (Where & When) screens, desktop + mobile.
// Also defines the in-screen ski side panel + reusable question
// blocks used by the scroll, sequential, and mobile variants.
// ───────────────────────────────────────────────────────────

// In-screen ski panel (desktop right 42%, or mobile top third)
function SkiSide({ n, heading = 'Your ski, so far', evo, side = true, h }) {
  const st = SKI_STATES[n];
  return (
    <div style={{
      height: '100%', background: 'var(--wf-fill)',
      borderLeft: side ? '1px solid var(--wf-line-soft)' : 'none',
      borderBottom: side ? 'none' : '1px solid var(--wf-line-soft)',
      display: 'flex', flexDirection: 'column', padding: '24px 20px', gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="wf-eyebrow">{heading}</div>
        <div className="wf-tag">state {n}</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <SkiPanel {...skiState(n)} height={h || 360} caption={`${st.label}`} />
      </div>
      {evo && <div className="wf-ski-note" style={{ borderTop: '1px dashed var(--wf-line)', paddingTop: 10 }}>↳ {evo}</div>}
    </div>
  );
}

function SplitScreen({ cur, micro, left, n, evo, heading }) {
  return (
    <DesktopFrame>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TopBar cur={cur} micro={micro} />
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <div style={{ flexBasis: '58%', padding: '52px 56px', overflow: 'hidden' }}>{left}</div>
          <div style={{ flexBasis: '42%' }}><SkiSide n={n} evo={evo} heading={heading} h={420} /></div>
        </div>
      </div>
    </DesktopFrame>
  );
}

// ===== reusable question blocks ==============================
function RegionQ({ compact }) {
  return (
    <div>
      <div className="wf-h2" style={{ marginBottom: 8 }}>Where do you want to ski with these?</div>
      <div className="wf-body" style={{ marginBottom: 16 }}>Pick up to three regions.</div>
      <WorldMap selected={['wna', 'eu']} h={compact ? 200 : 250} />
      <div style={{ marginTop: 14 }}><Count>● 2 of 3 selected</Count></div>
    </div>
  );
}
function DayTypeQ({ compact }) {
  const items = [['Everyday', '[PHOTO: all-mountain cruise]'], ['Powder Days', '[PHOTO: deep powder]'], ['Hard / Firm On-Piste', '[PHOTO: carving groomer]'], ['Ski Touring', '[PHOTO: skinning uphill]']];
  const on = [0, 1];
  return (
    <div>
      <div className="wf-h2" style={{ marginBottom: 8 }}>What kind of days are these for?</div>
      <div className="wf-body" style={{ marginBottom: 16 }}>Choose one or more.</div>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr 1fr' : '1fr 1fr', gap: 14 }}>
        {items.map((it, i) => <PCard key={it[0]} label={it[0]} photo={it[1]} on={on.includes(i)} h={compact ? 84 : 116} />)}
      </div>
    </div>
  );
}
function TerrainQ({ compact }) {
  const items = ['Groomed', 'Moguls', 'Resort Powder Bowls', 'Hard Snow / Ice', 'Backcountry Powder', 'Tree Runs', 'Terrain Park', 'Race Course'];
  const on = [0, 4, 5];
  return (
    <div>
      <div className="wf-h2" style={{ marginBottom: 8 }}>What terrain are you riding?</div>
      <div className="wf-body" style={{ marginBottom: 16 }}>Pick up to three.</div>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 12 }}>
        {items.map((it, i) => <PCard key={it} label={it} photo="[PHOTO]" on={on.includes(i)} h={compact ? 64 : 78} />)}
      </div>
      <div style={{ marginTop: 14 }}><Count>● 3 of 3 selected</Count></div>
    </div>
  );
}

// ===== Act 1 =================================================
function Act1Desktop() {
  return (
    <SplitScreen cur={0} n={0} heading="Your ski, so far"
      evo="State 0 — bare wood-grain outline. Generic length, no rocker, no graphic yet."
      left={
        <div style={{ maxWidth: 460 }}>
          <div className="wf-eyebrow" style={{ marginBottom: 18 }}>Let's build your ski</div>
          <div className="wf-h1" style={{ marginBottom: 14 }}>First up — what should we call you?</div>
          <div className="wf-sub" style={{ marginBottom: 34 }}>We'll use your name to keep this personal. Takes about three minutes.</div>
          <Field label="Your first name" style={{ marginBottom: 26 }}>
            <Input placeholder="Type your name…" state="focus" caret />
          </Field>
          <Btn state="disabled">Continue →</Btn>
        </div>
      } />
  );
}
function Act1Mobile() {
  return (
    <PhoneFrame>
      <SkiSide n={0} side={false} h={150} heading="Your ski" evo="State 0 — bare outline" />
      <div style={{ padding: '22px 22px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}><Progress cur={0} compact /></div>
        <div className="wf-eyebrow" style={{ marginBottom: 12 }}>Let's build your ski</div>
        <div className="wf-h2" style={{ marginBottom: 10 }}>What should we call you?</div>
        <div className="wf-body" style={{ marginBottom: 22 }}>Keeps this personal. About three minutes.</div>
        <Field label="Your first name" style={{ marginBottom: 20 }}>
          <Input placeholder="Type your name…" state="focus" caret />
        </Field>
        <Btn state="disabled" block>Continue →</Btn>
      </div>
    </PhoneFrame>
  );
}

// ===== Act 2 desktop — scroll variant ========================
function Act2ScrollDesktop() {
  return (
    <DesktopFrame>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TopBar cur={1} />
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <div style={{ flexBasis: '58%', padding: '40px 56px', display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div className="wf-eyebrow">Where &amp; when · all three on one scroll</div>
            <RegionQ /><hr className="wf-div" /><DayTypeQ /><hr className="wf-div" /><TerrainQ />
            <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}><Btn variant="ghost">← Back</Btn><Btn>Continue →</Btn></div>
          </div>
          <div style={{ flexBasis: '42%', position: 'sticky', top: 0 }}>
            <SkiSide n={3} h={460}
              evo="States 1→3 stack as the user scrolls: snow texture (region) → waist morph (day type) → tip/tail rocker (terrain)." />
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}

// ===== Act 2 desktop — sequential micro-screens ==============
function Act2Seq({ step, title, q, n, evo }) {
  return (
    <SplitScreen cur={1} n={n} heading="Your ski, so far" evo={evo}
      left={
        <div>
          <div className="wf-eyebrow" style={{ marginBottom: 18 }}>Where &amp; when · {step} of 3</div>
          {q}
          <div style={{ display: 'flex', gap: 12, marginTop: 30 }}>
            <Btn variant="ghost">← Back</Btn><Btn>{step === '3' ? 'Continue →' : 'Next →'}</Btn>
          </div>
        </div>
      } />
  );
}

// ===== Act 2 mobile ==========================================
function Act2Mobile({ title, q, n, foot }) {
  return (
    <PhoneFrame>
      <SkiSide n={n} side={false} h={130} heading="Your ski" evo={`State ${n}`} />
      <div style={{ padding: '18px 18px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><Progress cur={1} compact /></div>
        {q}
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}><Btn variant="ghost" block>← Back</Btn><Btn block>{foot}</Btn></div>
      </div>
    </PhoneFrame>
  );
}

Object.assign(window, {
  SkiSide, SplitScreen, RegionQ, DayTypeQ, TerrainQ,
  Act1Desktop, Act1Mobile, Act2ScrollDesktop, Act2Seq, Act2Mobile,
});
