# Claude Design Project Instructions: Wagner Skier DNA Low-Fidelity Wireframes

Start a new Claude Design project in **wireframe mode**. Paste this entire document as the opening prompt and attach `Skier-DNA-Experience-Brief.md` as a reference file.

---

## Project Mission

Produce low-fidelity wireframes for the **Wagner Skier DNA** experience: an interactive web form that takes a prospective custom-ski buyer through a five-act flow and ends with a personalized ski recommendation they can explore, save, and use to book a design call with a Wagner ski designer.

The wireframes will brief a web engineer who will build the experience as a Shopify App with embedded Theme App Blocks. They will also brief Roland (Wagner's site designer) on layout and interaction so he can apply visual design afterward.

**These are wireframes, not final designs.** Visual styling, brand colors, typography, photography, and finished iconography are explicitly out of scope.

---

## Hard Constraints

1. **Wireframe mode visual language.** Use Claude Design's wireframe-mode defaults. No Wagner brand colors, logos, or finished typography. Roland will own visual design later.
2. **No final imagery.** Use rectangular placeholder boxes with descriptive labels (e.g., "[PHOTO: terrain, moguls]") instead of real images.
3. **Components, not flourishes.** Show buttons, inputs, sliders, cards, modals, and progress states as plain shapes with clear labels. Skip decorative styling.
4. **Annotations welcome.** Inline callouts explaining interactions, micro-animations, and conditional logic are encouraged. Treat callouts as gifts to the engineer and to Roland.
5. **Both viewports.** Every screen needs a desktop variant (1440 wide reference) and a mobile variant (390 wide reference). Tablet not required.

---

## Output Format

Deliver as a single multi-page Figma-style or HTML mockup with one screen per artboard, organized by act. Each artboard:

- Labeled with act number, screen name, and viewport (e.g., "Act 2 / Region Select / Desktop")
- Includes annotations as callouts off to one side
- Shows the persistent ski-silhouette panel where applicable, with a short note on how the ski has evolved at this point in the flow

If outputting as an interactive HTML prototype, link the screens in flow order so the recipient can click through.

---

## The Five Acts to Wireframe

The experience is structured as five acts, each on its own screen. A persistent **Ski Silhouette Panel** (described below) lives on every screen from Act 1 onward and is the visual centerpiece of the experience. On desktop, it occupies the right 40 to 50 percent of the viewport. On mobile, it sits in the top third.

### Act 1: Hello

- Welcoming headline and short subhead
- Single text input for the user's first name
- Primary "Continue" CTA, disabled until name is entered
- Ski Silhouette Panel: shows a bare, generic wood-grain ski outline, no rocker, no construction layers

### Act 2: Where and When

Three questions, presented as one scroll-friendly screen or three sequential micro-screens (wireframe both options):

1. **Region** (multi-select, 1 to 3): a stylized world map with selectable regions. Selected regions get a fill state. Below the map, a count chip: "2 of 3 selected." Regions: Western NA, Eastern NA, South America, Asia, Europe, Australia / New Zealand.
2. **Day Type** (multi-select, 1+): four large picture-cards, each with a placeholder image rectangle and label. Options: Everyday, Powder Days, Hard/Firm On-Piste, Ski Touring.
3. **Terrain** (multi-select, 1 to 3): eight smaller picture-cards in a grid. Options: Groomed, Moguls, Resort Powder Bowls, Hard Snow/Ice, Backcountry Powder, Tree Runs, Terrain Park, Race Course.

Ski Silhouette Panel: as the user selects, the ski waist visually morphs (annotate this), a snow texture overlay hints at conditions, and tip/tail rocker profiles begin to form.

### Act 3: Feel

Three inputs:

1. **Stability vs Weight slider:** a horizontal bipolar slider with four labeled stops. Live preview of the ski flexing differently as the slider moves (annotate this: "as user slides toward 'stable,' ski animates with a stiffer, less flexed bend; sliding toward 'light' shows a more lively flex"). Construction-layer hints reveal on the ski silhouette (metallic shimmer toward stable, carbon weave toward light).
2. **Current Skis input:** brand (text), model (text), year (number), length (number, cm). Plus an optional photo upload zone. Plus two free-text fields: "What do you like about these skis?" and "Where could they perform better?"
3. **Bindings** (single-select radio): Alpine, Alpine Touring, Telemark, "I don't know."

Ski Silhouette Panel: now showing construction hints, a binding silhouette appears once bindings are selected, and a ghost outline of the user's current ski sits beneath the new ski for visual comparison.

### Act 4: You

A gentle gate: "Ready for some personal questions? Optional, but they help us nail the spec."

- Height (number, in or cm with toggle)
- Weight (number, lb or kg with toggle)
- Age (number, optional)
- BSL (Boot Sole Length, integer, optional)
- "Anything else we should know?" (long free-text, optional)
- "Skip these" link as secondary affordance

Ski Silhouette Panel: ski now scales next to a simple stick-figure body silhouette at true scale. Annotate: "ski length renders relative to user height. Tip should reach somewhere between chin and forehead at the recommended length."

### Act 5: Your Design (the payoff)

This is the most important screen to wireframe in detail. It contains:

1. **Hero ski silhouette** at full true-to-scale size with selected topsheet graphic.
2. **Three Ride Personality Cards** below or beside the hero. Each card shows:
   - Generated personality name (placeholder: "Ride Personality 1," "Ride Personality 2," "Ride Personality 3" — note these are dynamically generated at runtime, not hand-picked)
   - One-line teaser
   - "Select" affordance
   - Currently-selected state with a visible highlight
3. **Description block:** when a personality is selected, a paragraph of skier-voice marketing copy appears below the personality cards. Use a long lorem placeholder of about 90 words.
4. **Spec sheet panel:** shows the recommended ranges: length range, waist width range, sidecut radius range, tip design, tail design, construction, camber, recommended package.
5. **Exploration controls (the "play with it" zone):**
   - Length slider within the recommended range
   - Waist width slider within the recommended range
   - Camber: three pill buttons (Low / Medium / High)
   - Topsheet graphic picker: a horizontal scroll strip of graphic thumbnails (placeholder boxes)
6. **Primary CTAs:**
   - Large: "Book my design call" (opens Calendly inline modal)
   - Secondary: "Email me this design" (opens save-design modal)
7. **Persistent micro-CTA in the header** from Act 3 onward: "Prefer to talk it through? Book a 20-min call." Low-pressure link style.

Wireframe the optional **name-picker moment** as well: a small interstitial after personality selection where the user picks their favorite name variant. Three name tiles plus "Surprise me."

---

## Modals and Sub-Flows to Wireframe

1. **Save Design modal:** email field, opt-in checkbox (Klaviyo marketing consent), "Save and email me" primary button, "Maybe later" secondary link. Confirmation state: "Saved. Check your inbox."
2. **Book Design Call modal:** embedded Calendly widget placeholder (a tall rectangle labeled "[Calendly inline embed]"). Before the embed, a one-line summary of the design they will be discussing.
3. **Resume Design state:** when a user returns via the saved-design email link, they land on Act 5 with their saved spec pre-loaded. Wireframe this entry point.

---

## The Ski Silhouette Panel (component spec)

This is the single most important component. Wireframe it as a reusable panel with the following states:

- **State 0 (Act 1):** bare wood-grain ski outline, generic length, no rocker, no graphic
- **State 1 (Act 2, region selected):** snow-texture overlay on the base
- **State 2 (Act 2, day type selected):** waist width morphs toward target range
- **State 3 (Act 2, terrain selected):** tip and tail rocker profiles form
- **State 4 (Act 3, stability/weight slider):** construction-layer hint visible (shimmer or weave)
- **State 5 (Act 3, current skis entered):** ghost outline of user's current ski beneath the new ski
- **State 6 (Act 3, bindings selected):** binding silhouette appears
- **State 7 (Act 4, body silhouette anchor):** stick-figure body silhouette beside the ski at matching scale
- **State 8 (Act 5, finalized):** full ski with topsheet graphic, no body silhouette, primary recommendation rendered

Wireframe each state as a separate small mockup of just the panel, so the engineer can see the progression. A horizontal strip of all eight states on one artboard is ideal.

---

## Universal Components to Define

Wireframe these as reusable elements with all relevant states (default, hover, focus, selected, disabled, error where applicable):

- Primary button, secondary button, ghost/link button
- Text input, number input, file upload zone
- Single-select radio group (large card variant)
- Multi-select chip group with count limit
- Horizontal slider (single and bipolar)
- Pill toggle group (e.g., for Camber)
- Picture card (selectable, with placeholder image and label)
- World-map region selector
- Progress indicator: a subtle dotted breadcrumb showing the five acts (no percentage bar — Act labels only)
- Persistent micro-CTA strip ("Prefer to talk it through?")
- Inline alert / error message
- Modal frame with close affordance

---

## Empty, Loading, and Error States

- **Empty state for current ski upload:** drop zone with instruction copy
- **Loading state for output reveal (Act 5 → personality cards):** skeleton placeholders, 2 to 3 second animated wait, then content
- **Error state for save-design email:** invalid email format inline error
- **Error state for required field skipped:** brief inline message, no full-page block

---

## Flow Diagram Required

Include one artboard that shows the whole flow as a simple connected diagram: Act 1 → Act 2 → Act 3 → Act 4 → Act 5, with the modal branches (Save Design, Book Call, Resume Design) labeled. No fidelity needed beyond labeled boxes and arrows. This is for the engineer and Pete.

---

## Tone for Placeholder Copy

When writing placeholder copy in the wireframes, match this register:

- Friendly, ski-shop conversational, never marketing-jargony
- Short sentences
- Second person ("you," "your ski")
- No exclamation points unless the moment genuinely warrants celebration (e.g., the Act 5 reveal)
- Avoid the word "configurator." Use "design," "build," or "ski" instead.

Examples to match:

- "Where do you want to ski with these?"
- "Tell us what you love about your current skis."
- "Here's the ski we'd build for you."

---

## Reference Materials to Attach

When starting the project, attach:

1. `Skier-DNA-Experience-Brief.md` — the full brief this wireframe project supports
2. Any existing Wagner Skis pages (URL screenshots ok) for context on the current site, especially the package tiers (Essential / Silver / Ultra)
3. Optional: a screenshot of the existing Skier DNA form so Claude Design can see what is being replaced

---

## Out of Scope for This Wireframe Pass

- Final visual design (Roland will handle)
- Topsheet graphic library (placeholders only)
- 3D ski rendering (Phase 2)
- Customer "garage" dashboard (Phase 2)
- Production-status updates UI (Phase 2)
- Admin-side designer view (the Wagner ski designer's interface for incoming calls)

---

## Definition of Done

Wireframes are ready to hand off when:

1. All five acts are wireframed at desktop and mobile widths
2. Ski Silhouette Panel is shown in all eight evolution states
3. All modals (Save, Book Call, Resume) are wireframed
4. Universal components are defined with their states
5. The flow diagram is included
6. Every screen has annotation callouts explaining interactions and conditional logic
7. The whole set can be reviewed and understood by an engineer who has never seen the brief before

Ship it.
