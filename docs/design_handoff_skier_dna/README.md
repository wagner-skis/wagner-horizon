# Handoff: Wagner Skier DNA

> For a developer using **Claude Code** to implement this inside Wagner's **existing Shopify theme**.
> This README is self-sufficient — you do not need to have seen the original conversation.

---

## 1. Overview

Skier DNA is an interactive five-act experience that takes a prospect from "browsing the Wagner
site" to "talking with a Wagner designer about their custom ski." It is **educational and
ballpark-accurate — not a configurator and not checkout.** Three wins, in priority order:

1. Capture a verified email
2. Book a design call
3. Take a deposit

The signature mechanic: a **live ski silhouette** that is drawn and evolves as the user answers.
No progress bar — the user watches their ski come to life. By Act 5 it feels personally earned.

Full product context lives in `reference/Skier-DNA-Experience-Brief.md`. Read it before building.

---

## 2. About the design files

The files in `wireframe/` are **design references created in HTML** — low-fidelity **wireframes**
showing intended *structure, flow, and behavior*. **They are not production code to copy.** Your
job is to **recreate them inside Wagner's existing Shopify theme + a companion app**, using that
codebase's established patterns, and let Wagner's designer (Roland) layer visual design in through
**theme settings** afterward.

Open `wireframe/index.html` to click through everything: a flow diagram, the eight ski-panel
evolution states, all five acts at desktop (1440 ref) and mobile (390 ref), every modal, and a
universal-component sheet. Each screen carries numbered annotation callouts explaining interactions
and conditional logic — **treat those callouts as part of the spec.**

---

## 3. Fidelity: LOW

These are **wireframes**, intentionally unstyled (grayscale, placeholder image boxes, system type).
That is a feature, not a gap:

- **Locked by these wireframes:** information architecture, the five-act flow, the eight ski-panel
  states, component inventory, copy register, conditional logic, responsive structure.
- **Deliberately deferred to the theme:** color, typography, photography, finished iconography,
  spacing polish. Roland owns these and will dial them in via **theme settings + CSS custom
  properties** (see §5, Theme Contract). Do **not** invent a visual language — wire the structure
  and read every value from theme settings.

---

## 4. Architecture: how this becomes "sections and blocks"

**Can it be built as Shopify sections and blocks? Yes — as a hybrid.** The key decision is what
maps to a block and what does not.

```
┌─ Shopify Theme (Online Store 2.0) ───────────────────────────────────────┐
│                                                                          │
│   Theme App Block: "Skier DNA"  ← merchant drops this on any page        │
│   ├─ Section/App-block SETTINGS  (copy, tokens, Calendly URL, list id)   │
│   ├─ Repeatable BLOCKS           (region / day_type / terrain /          │
│   │                               package_tier / graphic_category)       │
│   └─ <div id="skier-dna-root">   ← mount point only                      │
│            │                                                             │
│            ▼  hydrates                                                   │
│   Client APP ISLAND (React/Preact)  ← the five-act flow + live SVG ski   │
│            │  persists every step                                        │
│            ▼                                                             │
│   Shopify APP backend (Remix/Node)                                       │
│   ├─ sessions / responses / designs / marketing_copy / scheduled_calls   │
│   ├─ Klaviyo webhook on email capture                                    │
│   └─ Calendly design-id pass-through                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

**Rules of thumb that drove this split:**

- **The five acts are NOT five Liquid blocks.** They are stateful steps of one flow that share live
  state and one layered SVG. They live entirely in the **client island** as app state.
- **One app block hosts the whole island.** It needs an app backend (persistence, Klaviyo,
  Calendly, pre-generated copy), so it is a **theme app extension app block**, not a pure section.
- **What legitimately *is* a repeatable block** = the merchant-editable content collections, so
  Roland can add/reorder/re-image them in the theme editor without touching React:
  - `region` — Western NA, Eastern NA, … (label + value)
  - `day_type` — Everyday / Powder / Hard-firm / Touring (label + placeholder image)
  - `terrain` — eight terrain cards (label + placeholder image)
  - `package_tier` — Essential / Silver / Ultra (name + blurb + link)
  - `graphic_category` — House / Artist Series / Niehues / Wood (name + collection ref)
- **What is a section/app-block *setting*** = copy strings, design tokens, and integration config
  (see §5).

> **Scaffold provided:** `shopify-scaffold/sections/skier-dna.liquid` is a working **theme section**
> version of this — settings + nested blocks + the mount div + a JSON config the island reads. A
> theme section is the fastest way to prototype the schema in a dev theme. The
> `{% schema %}` settings/blocks transfer 1:1 when you promote it to a theme app extension app block
> (`extensions/skier-dna/blocks/skier-dna.liquid`) once the app backend exists. Comments in the file
> mark exactly what changes on that promotion.

---

## 4a. Coexisting with your theme header & footer  ← READ THIS

Wagner's theme **already owns the global header (site nav) and footer.** Skier DNA must respect that:

- **It is a page-BODY section, not a full-page takeover.** It renders *between* the theme's existing
  header and footer. Do **not** rebuild, duplicate, or hide the global nav/footer from inside the
  experience.
- **Ship it on a dedicated page template** — `shopify-scaffold/templates/page.skier-dna.json`. Create
  a Shopify page (`/pages/skier-dna`) assigned to it; the theme's header/footer wrap it
  automatically. **This is the canonical (and only) placement for Phase 1** — one page, one entry
  point. (It remains *technically* embeddable elsewhere since it's just a section, but product-page /
  modal embedding is explicitly out of scope here — don't build for it.)
- **Each act fills the space *below* the sticky header — never `100vh`.** Use
  `min-height: calc(100svh - var(--sd-header-offset))`. The scaffold sets `--sd-header-offset` from a
  section setting ("Theme header height"); set it to your header's height, or measure it once in JS
  and write it onto the root. `100vh` would tuck the top of each act under the sticky nav.
- **Two headers, kept distinct (important — the wireframe mocks both):**
  - The **"WAGNER / logo" row** in the wireframe screenshots = **your existing theme header. Don't
    build it.** It's only drawn so the screens read in context.
  - The row beneath it — the **act breadcrumb** (Where & when · Feel · You · Your design) + the
    **"Prefer to talk it through? Book a 20-min call" micro-CTA** — is **Skier DNA's own sub-header**,
    which lives *inside* the section. Style it so it clearly reads as part of the experience, not as a
    second site nav.
- **The footer is reached after the Act 5 reveal / on scroll.** Don't put any footer chrome in the
  island.

---

## 5. Theme Contract — what Roland controls vs. what the app controls

This is the seam that lets design get layered in via the theme. **The island must read all of these
from the block, never hard-code them.** The Liquid serializes them into
`<script type="application/json" data-skier-dna-config>` and as `data-*` / CSS-var attributes on the
root; the island parses that on mount.

### Design tokens (CSS custom properties on `#skier-dna-root`)
| Token | Source | Used for |
|---|---|---|
| `--sd-accent` | `settings.accent` (color) | primary CTAs, selected states, slider fills |
| `--sd-ink` | `settings.ink` (color) | text |
| `--sd-surface` | `settings.surface` (color) | card / panel backgrounds |
| `--sd-font-head` | `settings.heading_font` (font_picker) | headlines |
| `--sd-font-body` | `settings.body_font` (font_picker) | body |
| `--sd-radius` | `settings.corner_radius` (range) | cards, inputs, buttons |

Style the island **only** with these variables. Roland changes the theme settings → the experience
re-skins with zero code. The wireframe's grayscale is just the unstyled fallback.

### Copy (settings)
`heading`, `subhead`, `name_prompt`, `email_save_copy`, `micro_cta_label`, `gate_copy`.
Match the register in §9 ("Tone").

### Content collections (blocks) — see §4.

### Integration config (settings — keep out of the client bundle where sensitive)
`calendly_url`, `klaviyo_list_id`, `show_package_tiers` (checkbox), `true_scale_anchor` (checkbox),
`graphics_collection` (collection picker for the topsheet library).

---

## 6. Screens / Views

Each is wireframed at **Desktop (1440 ref)** and **Mobile (390 ref)** unless noted. The ski
silhouette panel occupies the right 40–50% on desktop and the top third on mobile, on every screen
from Act 1 on. Annotation numbers below match the callouts in `wireframe/index.html`.

### Flow diagram (`00 · Flow`)
Act 1 → 2 → 3 → 4 → 5 with modal branches (Save Design, Book Call, Resume Design) labeled. Build the
router/state machine from this.

### Act 1 — Hello  (ski **State 0**: bare wood-grain outline)
- **Purpose:** set tone, capture first name.
- **Layout:** left form column / right ski panel (desktop); stacked (mobile).
- **Components:** single large text input (auto-focused, blinking caret); primary **Continue**
  *disabled until ≥1 char*; dotted act-label breadcrumb (labels desktop / dots only mobile).
- **Copy register:** ski-shop conversational. Never the word "configurator" — say "build" or "ski".

### Act 2 — Where & When  (ski **States 1→3**)
**Wireframe both layouts** (the brief asks for both):
- **Layout A — one scroll:** all three questions on one screen; ski panel **sticky**, updates live.
- **Layout B — three sequential micro-screens.**
- **Q1 Region:** world-map multi-select **1–3**, fill state on select, "2 of 3 selected" count chip,
  4th selection blocked with a brief hint. Regions: Western NA, Eastern NA, South America, Asia,
  Europe, Australia/NZ. → ski **State 1** (snow-texture overlay on base).
- **Q2 Day type:** four large picture-cards, multi-select **1+**, ring + check when selected.
  Everyday / Powder / Hard-firm on-piste / Touring. → **State 2** (waist morphs toward target).
- **Q3 Terrain:** eight smaller picture-cards in a 4-up grid (2-up mobile), multi-select **1–3**,
  same count-chip limit. → **State 3** (tip/tail rocker forms).

### Act 3 — Feel  (ski **States 4→6**, micro-CTA appears from here on)
- **Stability vs Weight:** bipolar slider, four labeled stops. Live ski flex preview — stiffer toward
  "stable," livelier toward "light." → **State 4** (metallic shimmer toward stable / carbon weave
  toward light).
- **Current skis:** brand, model, year, length(cm), optional photo upload zone, plus two free-text
  fields ("What do you like?" / "Where could they perform better?"). → **State 5** (ghost outline of
  current ski beneath the new ski).
- **Bindings:** single-select radio (large card) — Alpine / Alpine Touring / Telemark / "I don't
  know." → **State 6** (binding silhouette appears).
- **Header micro-CTA from Act 3 onward:** "Prefer to talk it through? Book a 20-min call." Link
  style, low pressure, pauses flow without losing progress.

### Act 4 — You  (ski **State 7**: true-scale beside a body silhouette)
- Gentle gate copy: "Ready for some personal questions? Optional, but they help us nail the spec."
- Height & Weight with **unit toggles** (in/cm, lb/kg); Age optional; BSL optional; skier-ability
  selector (Level I/II/III/III+) feeding flex/length & binding DIN type; "Anything else?" long text;
  **"Skip these"** secondary link.
- → **State 7**: ski stands beside a stick-figure at true scale; tip reaches **between chin and
  forehead** at the recommended length.

### Act 5 — Your Design  (ski **State 8**: final, with topsheet graphic) — most detailed screen
1. **Hero ski** at full true-to-scale with selected topsheet graphic.
2. **Three Ride Personality cards** — names **generated at runtime** (placeholders in wireframe).
   Each: one-line teaser, a **"What's different" list** of key material/construction changes
   (metal vs carbon, core, camber/radius), a **Select** affordance, highlighted selected state.
3. **Description block** — ~90 words skier-voice copy, appears once a personality is selected.
4. **Spec sheet** — recommended **ranges**: length, waist, sidecut radius, tip design, tail design,
   construction, camber, recommended package.
5. **"Play with it" zone** — length slider (within range), waist slider (within range), camber pills
   (Low/Med/High), featured topsheet strip + **"Explore graphics →"** into the full library.
6. **CTAs** — primary **"Book my design call"** (Calendly modal), secondary **"Email me this
   design"** (Save modal).
7. **Mobile:** hero pins top; sticky bottom CTA bar docks "Book my design call."
- **Name-picker interstitial** (wireframed separately): after personality selection — three name
  tiles (one pre-highlighted) + "Surprise me." Names are generated; tiles are placeholders.

### Modals & states (`08`)
- **Save Design:** email field + Klaviyo opt-in checkbox (unticked by default), "Save and email me"
  primary, "Maybe later" link. **Confirmation:** "Saved. Check your inbox." **Error:** inline invalid
  email message (no full-page block).
- **Book Design Call:** one-line design summary above a tall **"[Calendly inline embed]"**
  placeholder. Pass the saved design id through as a Calendly URL param / hidden question.
- **Resume Design:** entry from the saved-design email link — lands on **Act 5** with saved spec
  pre-loaded + a "Welcome back" banner.
- **Output loading (Act 4→5):** 2–3s animated wait with skeleton placeholders (ski skeleton left,
  card/spec skeletons right) before content populates.
- **Required-field error:** brief inline message beneath the field, ski panel unaffected.

### Explore graphics (`09`)
Full-screen overlay from Act 5's "Explore graphics" CTA — flow pauses, nothing lost. **Live preview
keeps the graphic tied to the viewer** (renders on the user's own ski at true scale). Category tabs
(House / Artist Series / James Niehues / Wood Veneers). **Pattern + Color facets come from Shopify
Filters** with a live result count; dense, lazy-loaded grid. Custom graphics are out of scope —
soft-link them to the design call.

---

## 7. The Ski Silhouette Panel (the centerpiece component)

Build as **one reusable, layered SVG**, `viewBox` in millimeters (**1 unit = 1 mm**), with masked
layers per attribute. Animate layer reveals via CSS transitions / Motion One. The wireframe shows all
**eight states** side by side on the `02 · Ski Silhouette Panel` artboard — implement them as a state
machine driven by form answers:

| State | Trigger | What changes |
|---|---|---|
| 0 | Act 1 | bare wood-grain outline, generic length, no rocker, no graphic |
| 1 | Act 2 region | snow-texture overlay on the base |
| 2 | Act 2 day type | waist width morphs toward target range |
| 3 | Act 2 terrain | tip + tail rocker profiles form |
| 4 | Act 3 slider | construction hint (shimmer toward stable / weave toward light) |
| 5 | Act 3 current ski | ghost outline of current ski beneath the new ski |
| 6 | Act 3 bindings | binding silhouette appears |
| 7 | Act 4 height | stick-figure body silhouette beside ski at matching true scale |
| 8 | Act 5 | final ski with topsheet graphic, no body silhouette |

Topsheet graphics apply as SVG `<image>` masked against the ski outline. True-scale anchor (the body
silhouette) enforces visual scale. **No Canvas** unless required for graphic compositing.

---

## 8. Interactions, behavior & state

- **Pacing:** Typeform-style one-prompt-at-a-time *within* an act, but consolidate related prompts to
  keep total perceived length under ~3 minutes.
- **State management:** Zustand or React Context for session state. **Persist a draft to the app API
  every time the user advances an act** (keyed by anonymous session/cookie id until email capture,
  then attach to the lead).
- **Lead capture is layered, never a gate:**
  - Act 1 — first name, soft-required (one retry, then allow Skip).
  - Act 5 reveal — email, framed as **"save this design so you don't lose it,"** never blocking the
    reveal. The reveal earns the email, not the other way around.
  - Scheduling — email + phone only when the user opts into Calendly.
  - If logged into a Shopify customer account, prefill email and skip the save gate.
- **Marketing copy + names:** **no runtime LLM calls.** A build-time batch job pre-generates, for
  every valid `(construction, use case, terrain, stability/weight)` tuple, a description + 3–5 name
  variants stored in the app DB. A lightweight runtime selector picks a name variant from simple
  sentiment/keyword extraction of the user's open-text answers; optionally first-name personalizes.
- **Validation:** inline only (invalid email, skipped required field). Never a full-page block.
- **Animations:** ski-layer reveals on each answer; 2–3s skeleton wait on the Act 4→5 reveal; slow
  flex-loop preview on each personality card. Respect `prefers-reduced-motion`.
- **Analytics:** event per act transition, per ski-attribute change, per CTA impression + click
  (GA4 + an internal funnel table).

---

## 9. Tone for placeholder copy
Friendly, ski-shop conversational, never marketing-jargon. Short sentences. Second person. No
exclamation points except the genuine Act 5 reveal moment. **Avoid "configurator"** — use "design,"
"build," or "ski." Examples to match: "Where do you want to ski with these?" · "Tell us what you love
about your current skis." · "Here's the ski we'd build for you."

---

## 10. Data model (app backend)
`sessions` (anonymous, cookie-keyed) · `skier_dna_responses` (full payload) · `designs` (output
snapshot: ranges, selected personality, selected length/waist/camber/graphic, copy id) ·
`marketing_copy` (pre-seeded by combination tuple) · `customers` (links Shopify customer id) ·
`scheduled_calls` (Calendly event id ↔ design id ↔ customer). This schema also unlocks the Phase 2
"garage."

---

## 11. Integrations
- **Leads:** Klaviyo webhook on email capture. Write profile attributes `last_dna_design_id`,
  `dna_completed_at`, `recommended_personality`, `recommended_length_range`,
  `recommended_waist_range`, `recommended_construction_family`. Trigger save-design + nurture flows.
- **Scheduler:** Calendly inline embed; pass the design id as a URL param / hidden question so the
  Wagner designer sees the spec on the calendar invite.
- **Photo upload:** Shopify Files API (or S3) with size + MIME validation. Optional, never blocking.

---

## 12. Phase boundaries
**Phase 1 (this handoff):** five-act flow, live ski evolution, three personalities, within-range
sliders, save via email, book via embedded scheduler, follow-up email.
**Phase 2 (not now):** customer "garage" in Shopify Customer Accounts, deeper graphic picker,
returning-user resume-in-place, production-status hooks, optional 3D upgrade, admin designer view.

---

## 13. Files in this bundle
```
design_handoff_skier_dna/
├── README.md                        ← you are here
├── reference/
│   ├── Skier-DNA-Experience-Brief.md     full product brief
│   └── Claude-Design-Wireframe-Instructions.md   original wireframe spec
├── wireframe/                       ← DESIGN REFERENCE (HTML, lofi) — open index.html
│   ├── index.html                        design-canvas of every screen + annotations
│   ├── index-print.html                  flat print/PDF layout of the same screens
│   ├── wireframe.css                     wireframe-mode styling primitives
│   ├── ski-panel.jsx                     the 8-state ski silhouette component
│   ├── wf-kit.jsx                        universal components + annotation rail
│   ├── screens-act12.jsx                 Act 1 & 2 screens
│   ├── screens-act345.jsx                Acts 3–5 screens
│   ├── screens-extra.jsx                 modals, states, flow diagram, graphics explorer
│   └── design-canvas.jsx                 pan/zoom canvas host
├── screenshots/                     ← rendered PNG references (lofi)
│   ├── INDEX.md                          numbered map of every screenshot
│   └── 01–31-screen.png                  one per key screen
└── shopify-scaffold/                ← START HERE for the build
    ├── templates/page.skier-dna.json     dedicated page template (theme header/footer wrap it)
    ├── sections/skier-dna.liquid         section schema: settings + nested blocks + mount div
    ├── assets/skier-dna.js               island mount stub (reads the block config)
    └── SCHEMA-MAP.md                     every wireframe control → its setting/block/app-state home
```

**Build order:** read the brief → click through `wireframe/index.html` (or skim `screenshots/`) →
read §4a (header/footer) + `SCHEMA-MAP.md` → add `templates/page.skier-dna.json` and scaffold the
section/app block from `sections/skier-dna.liquid` → build the island into `assets/skier-dna.js`,
reading every token/copy/content value from the block (Theme Contract, §5) → stand up the app backend
+ integrations (§§10–11).
