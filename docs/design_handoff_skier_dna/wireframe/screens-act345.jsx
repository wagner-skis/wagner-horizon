// ───────────────────────────────────────────────────────────
// Act 3 (Feel), Act 4 (You), Act 5 (Your Design) + name picker.
// Desktop + mobile. Reusable spec sheet / personality cards /
// exploration controls power both viewports.
// ───────────────────────────────────────────────────────────

const LOREM90 = "You ski like someone who reads the mountain a turn ahead. This build leans into that — a touch more energy underfoot so the ski rebounds out of every arc, with enough width to stay calm when the snow turns soft. It holds an edge on firm morning groomers and shrugs off afternoon chop without beating you up. Think confident, quick, and quietly forgiving. The kind of ski you stop noticing because it just goes where you look. We'd build it a hair longer than your current pair to settle things down at speed.";

// ===== Act 3 — Feel ==========================================
function CurrentSkis({ mobile }) {
  return (
    <div>
      <div className="wf-h3" style={{ marginBottom: 4 }}>Your current skis</div>
      <div className="wf-body" style={{ marginBottom: 16 }}>Tell us what you ride now — it gives us a real reference point.</div>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        <Field label="Brand"><Input placeholder="e.g. Wagner" /></Field>
        <Field label="Model"><Input placeholder="e.g. Pro Carve" /></Field>
        <Field label="Year"><Input placeholder="2022" /></Field>
        <Field label="Length (cm)"><Input placeholder="178" /></Field>
      </div>
      <Drop sub="Optional · jpg or png" />
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 12, marginTop: 14 }}>
        <Field label="What do you like about these skis?"><Textarea placeholder="Free text…" /></Field>
        <Field label="Where could they perform better?"><Textarea placeholder="Free text…" /></Field>
      </div>
    </div>
  );
}
function BindingsQ() {
  const items = ['Alpine', 'Alpine Touring', 'Telemark', "I don't know"];
  return (
    <div>
      <div className="wf-h3" style={{ marginBottom: 12 }}>Bindings</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {items.map((it, i) => <Radio key={it} label={it} on={i === 0} />)}
      </div>
    </div>
  );
}
function Act3Desktop() {
  return (
    <DesktopFrame>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TopBar cur={2} micro />
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <div style={{ flexBasis: '58%', padding: '38px 52px', display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div className="wf-eyebrow">How should it feel?</div>
            <div>
              <div className="wf-h3" style={{ marginBottom: 14 }}>Stability vs Weight</div>
              <Bipolar pos={0.66} active={2} />
              <div className="wf-hint" style={{ marginTop: 8 }}>Live preview: ski flexes stiffer toward "stable", livelier toward "light".</div>
            </div>
            <hr className="wf-div" />
            <CurrentSkis />
            <hr className="wf-div" />
            <BindingsQ />
            <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}><Btn variant="ghost">← Back</Btn><Btn>Continue →</Btn></div>
          </div>
          <div style={{ flexBasis: '42%' }}>
            <SkiSide n={6} h={440}
              evo="States 4→6: slider reveals construction (metal shimmer / carbon weave) and flexes the side profile; a ghost of the current ski sits beneath; a binding silhouette appears once selected." />
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}
function Act3Mobile() {
  return (
    <PhoneFrame>
      <SkiSide n={6} side={false} h={140} heading="Your ski" evo="States 4–6" />
      <div style={{ padding: '18px 18px 26px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><Progress cur={2} compact /></div>
        <MicroCTA />
        <div>
          <div className="wf-h3" style={{ marginBottom: 12 }}>Stability vs Weight</div>
          <Bipolar pos={0.66} active={2} stops={['Stable', 'Bal.', 'Bal.', 'Light']} />
        </div>
        <hr className="wf-div" />
        <CurrentSkis mobile />
        <hr className="wf-div" />
        <BindingsQ />
        <Btn block>Continue →</Btn>
      </div>
    </PhoneFrame>
  );
}

// ===== Act 4 — You ===========================================
function YouFields({ mobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : '1fr 1fr', gap: 14 }}>
        <Field label="Height"><Input placeholder="5 ft 10 in" suffix={<UnitToggle a="in" b="cm" on={0} />} /></Field>
        <Field label="Weight"><Input placeholder="165" suffix={<UnitToggle a="lb" b="kg" on={0} />} /></Field>
        <Field label="Age" hint="Optional"><Input placeholder="—" /></Field>
        <Field label="Boot Sole Length (BSL)" hint="Optional · mm"><Input placeholder="—" /></Field>
      </div>
      <Field label="Skier ability (type)" hint="Cautious, lower speeds (I) → aggressive, higher speeds (III+)">
        <Pills items={['Level I', 'Level II', 'Level III', 'III+']} on={2} />
      </Field>
    </div>
  );
}
function Act4Desktop() {
  return (
    <SplitScreen cur={3} micro n={7} heading="Scaled to you"
      evo="State 7: ski stands beside a stick-figure at true scale. At the recommended length the tip should reach between chin and forehead."
      left={
        <div style={{ maxWidth: 520 }}>
          <div className="wf-eyebrow" style={{ marginBottom: 18 }}>A few personal details</div>
          <div className="wf-h1" style={{ fontSize: 30, marginBottom: 10 }}>Ready for some personal questions?</div>
          <div className="wf-sub" style={{ marginBottom: 24 }}>Optional, but they help us nail the spec.</div>
          <YouFields />
          <Field label="Anything else we should know?" style={{ marginTop: 16 }}><Textarea placeholder="Injuries, preferences, goals… (optional)" /></Field>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 24 }}>
            <Btn>See my design →</Btn><Btn variant="link">Skip these</Btn>
          </div>
        </div>
      } />
  );
}
function Act4Mobile() {
  return (
    <PhoneFrame>
      <SkiSide n={7} side={false} h={150} heading="Scaled to you" evo="State 7 — true scale vs body" />
      <div style={{ padding: '18px 18px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><Progress cur={3} compact /></div>
        <div className="wf-h2" style={{ marginBottom: 8 }}>A few personal questions?</div>
        <div className="wf-body" style={{ marginBottom: 20 }}>Optional, but they help us nail the spec.</div>
        <YouFields mobile />
        <Field label="Anything else?" style={{ marginTop: 14 }}><Textarea placeholder="Optional…" /></Field>
        <Btn block style={{ marginTop: 20 }}>See my design →</Btn>
        <div style={{ textAlign: 'center', marginTop: 10 }}><Btn variant="link">Skip these</Btn></div>
      </div>
    </PhoneFrame>
  );
}

// ===== Act 5 — Your Design ===================================
function PersonalityCards({ sel = 0, dir = 'row' }) {
  const cards = [
    ['Ride Personality 1', 'Quick, energetic, loves to carve.', ['2× Titanal laminate', 'Medium camber · 17 m radius', 'Aspen core']],
    ['Ride Personality 2', 'Calm and planted at speed.', ['2× Titanal + rubber damping', 'Low camber · 19 m radius', 'Aspen / ash core']],
    ['Ride Personality 3', 'Playful all-rounder for soft snow.', ['Carbon stringers, no metal', 'Early-rise tip/tail · 15 m', 'Paulownia core']],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: dir, gap: 12 }}>
      {cards.map((c, i) => (
        <div key={i} className={'wf-surface' + (i === sel ? '' : '')} style={{
          flex: 1, padding: 16, borderRadius: 11, display: 'flex', flexDirection: 'column',
          borderColor: i === sel ? 'var(--wf-sel)' : 'var(--wf-line)',
          boxShadow: i === sel ? '0 0 0 2px var(--wf-sel-line)' : 'none',
          background: i === sel ? 'var(--wf-sel-fill)' : '#fff',
        }}>
          <div className="wf-tag" style={{ marginBottom: 10 }}>auto-generated name</div>
          <div className="wf-h3" style={{ marginBottom: 6 }}>{c[0]}</div>
          <div className="wf-body" style={{ marginBottom: 12 }}>{c[1]}</div>
          <div style={{ borderTop: '1px dashed var(--wf-line)', paddingTop: 10, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="wf-tag" style={{ border: 'none', padding: 0, color: 'var(--wf-ink-3)' }}>What's different</div>
            {c[2].map((m) => (
              <div key={m} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: i === sel ? 'var(--wf-sel)' : 'var(--wf-ink-3)', marginTop: 6, flex: '0 0 auto' }}></span>
                <span style={{ font: '500 12px/1.4 var(--wf-mono)', color: 'var(--wf-ink-2)' }}>{m}</span>
              </div>
            ))}
          </div>
          {i === sel
            ? <Btn size="sm" style={{ width: '100%', marginTop: 'auto' }}>✓ Selected</Btn>
            : <Btn size="sm" variant="ghost" style={{ width: '100%', marginTop: 'auto' }}>Select</Btn>}
        </div>
      ))}
    </div>
  );
}
function SpecSheet() {
  const rows = [
    ['Length range', '176 – 182 cm'], ['Waist width', '98 – 104 mm'], ['Sidecut radius', '17 – 19 m'],
    ['Tip design', 'Early-rise rocker'], ['Tail design', 'Flat / low rocker'],
    ['Construction', 'Aspen core · 2× Titanal'], ['Camber', 'Medium'], ['Recommended package', 'Silver'],
  ];
  return (
    <div className="wf-surface" style={{ borderRadius: 11, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--wf-line-soft)', background: 'var(--wf-fill)' }}>
        <div className="wf-eyebrow">Recommended spec — ranges, not fixed</div>
      </div>
      {rows.map((r, i) => (
        <div key={r[0]} style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '9px 16px', borderTop: i ? '1px solid var(--wf-line-soft)' : 'none' }}>
          <span className="wf-hint" style={{ color: 'var(--wf-ink-3)' }}>{r[0]}</span>
          <span className="wf-label" style={{ fontFamily: 'var(--wf-mono)', fontSize: 13, textWrap: 'pretty' }}>{r[1]}</span>
        </div>
      ))}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--wf-line-soft)' }}>
        <div className="wf-hint">Package tiers: Essential · <b style={{ color: 'var(--wf-sel)' }}>Silver</b> · Ultra</div>
      </div>
    </div>
  );
}
function ExploreControls() {
  return (
    <div className="wf-surface wf-shade" style={{ borderRadius: 11, padding: 18, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="wf-eyebrow">Play with it</div>
      <Field label="Length — 179 cm"><Slider pos={0.5} /><div className="wf-stops"><span>176</span><span>182</span></div></Field>
      <Field label="Waist width — 101 mm"><Slider pos={0.5} /><div className="wf-stops"><span>98</span><span>104</span></div></Field>
      <div>
        <div className="wf-label" style={{ marginBottom: 8 }}>Camber</div>
        <Pills items={['Low', 'Medium', 'High']} on={1} />
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div className="wf-label">Topsheet graphic</div>
          <span className="wf-btn link" style={{ padding: '2px', fontSize: 13 }}>Explore graphics →</span>
        </div>
        <div className="wf-hint" style={{ fontFamily: 'var(--wf-mono)', marginBottom: 8 }}>Featured · House Graphics</div>
        <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
          {[...Array(5)].map((_, i) => <Ph key={i} label={i === 0 ? 'SEL' : '▢'} style={{ flex: '0 0 auto', width: 58, height: 76, borderColor: i === 0 ? 'var(--wf-sel)' : 'var(--wf-line)' }} />)}
          <div style={{ flex: '0 0 auto', width: 58, height: 76, border: '1.5px dashed var(--wf-sel)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', font: '600 10px/1.3 var(--wf-mono)', color: 'var(--wf-sel)' }}>+ All graphics</div>
        </div>
      </div>
    </div>
  );
}
function Act5Desktop() {
  return (
    <DesktopFrame>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TopBar cur={4} micro />
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          {/* hero ski */}
          <div style={{ flexBasis: '38%', background: 'var(--wf-fill)', borderRight: '1px solid var(--wf-line-soft)', padding: '30px 24px', display: 'flex', flexDirection: 'column' }}>
            <div className="wf-eyebrow" style={{ marginBottom: 6 }}>Sarah — here's the ski we'd build for you</div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex' }}><SkiPanel {...skiState(8)} height={520} caption="True-to-scale · selected topsheet" /></div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}><span className="wf-tag">Silver package</span><span className="wf-tag">179 cm · 101 mm</span></div>
            <Btn variant="ghost" size="sm" style={{ marginTop: 12, alignSelf: 'center' }}>◇ Explore topsheet graphics →</Btn>
          </div>
          {/* right column */}
          <div style={{ flexBasis: '62%', padding: '30px 36px', display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div>
              <div className="wf-h2" style={{ marginBottom: 4 }}>Three ways this ski could ride</div>
              <div className="wf-body">Pick the personality that sounds most like you.</div>
            </div>
            <PersonalityCards sel={0} />
            <div className="wf-surface" style={{ borderRadius: 11, padding: 18, background: 'var(--wf-fill)' }}>
              <div className="wf-eyebrow" style={{ marginBottom: 10 }}>Ride Personality 1 — in your skier's words</div>
              <div className="wf-body" style={{ lineHeight: 1.6 }}>{LOREM90}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.15fr)', gap: 20, alignItems: 'start' }}>
              <SpecSheet /><ExploreControls />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 4 }}>
              <Btn size="lg">Book my design call</Btn>
              <Btn variant="ghost" size="lg">Email me this design</Btn>
            </div>
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}
function Act5Mobile() {
  return (
    <PhoneFrame>
      <div style={{ background: 'var(--wf-fill)', padding: '14px 16px 18px', borderBottom: '1px solid var(--wf-line-soft)' }}>
        <div className="wf-eyebrow" style={{ textAlign: 'center', marginBottom: 6 }}>Here's your ski, Sarah</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}><SkiPanel {...skiState(8)} profile={false} height={230} /></div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 6 }}><span className="wf-tag">Silver</span><span className="wf-tag">179 · 101</span></div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}><Btn variant="ghost" size="sm">◇ Explore topsheet graphics →</Btn></div>
      </div>
      <div style={{ padding: '18px 16px 90px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <MicroCTA />
        <div className="wf-h3">Three ways this could ride</div>
        <PersonalityCards sel={0} dir="column" />
        <div className="wf-surface wf-shade" style={{ borderRadius: 11, padding: 14 }}>
          <div className="wf-eyebrow" style={{ marginBottom: 8 }}>Personality 1 — in your words</div>
          <div className="wf-body" style={{ lineHeight: 1.6 }}>{LOREM90}</div>
        </div>
        <SpecSheet />
        <ExploreControls />
      </div>
      {/* sticky CTA */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14, background: '#fff', borderTop: '1px solid var(--wf-line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Btn block>Book my design call</Btn>
        <Btn variant="link">Email me this design</Btn>
      </div>
    </PhoneFrame>
  );
}

// ===== Name picker interstitial ==============================
function NamePicker() {
  const names = ['The Cornice', 'Daybreak', 'Quicksilver'];
  return (
    <DesktopFrame>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', background: 'var(--wf-fill)' }}>
        <div className="wf-eyebrow" style={{ marginBottom: 16 }}>One small thing</div>
        <div className="wf-h1" style={{ fontSize: 34, marginBottom: 10 }}>Which name fits your ski?</div>
        <div className="wf-sub" style={{ marginBottom: 34 }}>Pick a favourite — or let us surprise you.</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          {names.map((nm, i) => (
            <div key={nm} className="wf-surface" style={{ width: 200, padding: 26, borderRadius: 12, background: '#fff', borderColor: i === 0 ? 'var(--wf-sel)' : 'var(--wf-line)', boxShadow: i === 0 ? '0 0 0 2px var(--wf-sel-line)' : 'none' }}>
              <div className="wf-tag" style={{ marginBottom: 12 }}>name variant</div>
              <div className="wf-h2" style={{ fontSize: 22 }}>{nm}</div>
            </div>
          ))}
        </div>
        <Btn variant="ghost">↻ Surprise me</Btn>
      </div>
    </DesktopFrame>
  );
}

Object.assign(window, {
  Act3Desktop, Act3Mobile, Act4Desktop, Act4Mobile, Act5Desktop, Act5Mobile, NamePicker,
  PersonalityCards, SpecSheet, ExploreControls, CurrentSkis, BindingsQ, YouFields,
});
