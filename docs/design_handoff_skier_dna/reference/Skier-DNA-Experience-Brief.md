# Skier DNA Experience Brief

For wireframe design and web engineering. Drafted June 2026.

---

## 1. Mission

Build a new Skier DNA experience that takes a prospect from "browsing the Wagner site" to "talking with a Wagner designer with a real point of view about their ski." The experience is educational, interactive, and ballpark accurate. It is not a configurator and not a checkout. The three wins, in priority order:

1. Capture a verified email
2. Book a design call
3. Take a deposit

Anything that compromises win #1 (email) should be cut. Anything that mostly serves wins #2 or #3 can be optional.

---

## 2. Platform Decision: Shopify App with Embedded App Blocks

Recommended build: a custom Shopify App (Remix or Node + Polaris on the admin side, React/Preact on the storefront side) that exposes its experience through **Theme App Blocks** in Online Store 2.0. The App handles persistence, lead capture, scheduling integration, and (eventually) integration with Wagner's internal design system.

Why not a pure Theme Section:

- Needs to persist designs across sessions (saved designs, returning users)
- Needs to write to a leads pipeline (Klaviyo or HubSpot) and a scheduler (Cal.com or Calendly)
- Needs a server-side cache of pre-generated marketing copy for the ~2,500 material combinations
- Needs to extend Shopify Customer Accounts later for the "garage" vision

Why Shopify App over a fully custom microsite:

- Native to the storefront, no auth duplication
- Theme block lets Wagner drop the experience into any page (landing page, product page modal)
- Inherits Roland's eventual visual design tokens from the theme
- Future "garage" lives natively in Shopify Customer Accounts

---

## 3. Experience at a Glance

Five acts. Each act is a single full-viewport screen on desktop, a single screen on mobile. The ski silhouette is always on screen. It evolves as the user answers.

| Act | Purpose | User Sees | Ski Evolves |
|---|---|---|---|
| 1. Hello | Set the tone, capture first name | Welcome card + ski silhouette in a "raw blank" state | Bare wood-grain core |
| 2. Where & When | Region, day type, terrain | Map of the world, day-condition cards, terrain photos | Waist width starts to morph, snow texture appears |
| 3. Feel | Stability vs weight, current skis, feedback | Bipolar slider with live ski flex animation, current ski upload | Construction layer "shimmer" reveals, flex animates |
| 4. You | Bindings, height/weight/BSL gate | Personal questions card | Ski scales relative to a body silhouette, binding appears |
| 5. Your Design | Output reveal, material exploration, save/schedule | Full-size ski rendering, three "ride personalities," CTAs | Final |

Use conversational, one-prompt-at-a-time pacing in the style of Typeform within each act, but consolidate related prompts to keep total perceived length under ~3 minutes.

---

## 4. Forward-Progress Visualization (the "Ski Build Reveal")

The single biggest unlock for this experience is that the ski being recommended is **drawn live** as the user answers questions. Every answer changes something visible about the ski silhouette on screen. The user does not see a progress bar. They see their ski coming to life.

Concrete moments where the ski changes:

- **Region selected:** snow texture overlays the base hint (powder grain for Western NA, hardpack sheen for Eastern NA, etc.)
- **Day type:** waist width starts animating toward a target range (wider for powder, narrower for hard snow)
- **Terrain:** tip and tail rocker profiles morph in from the ends
- **Stability vs Weight slider:** construction layer rendering shifts. Slide toward "stable" and a metallic shimmer reveals under the topsheet. Slide toward "light" and a carbon weave hint appears.
- **Bindings:** an appropriate binding silhouette ghosts onto the ski
- **Height/weight (if given):** ski length scales relative to a body silhouette beside it
- **Current ski upload:** a faint outline of "your current ski" appears underneath the new ski for side-by-side comparison

By the time the user reaches Act 5, the ski feels personally earned. The reveal is anticlimactic if done right, because the user has been watching it form the whole time. That is the point.

Engineering note: render this as a single layered SVG with masked layers per attribute. Animate via CSS transitions and Framer Motion (or Motion One for performance). Cache the user's current state in app memory plus a server-side draft record keyed by anonymous session ID until an email is captured, then attach to the lead.

---

## 5. True-to-Scale Ski Silhouette

Use SVG with a fixed viewBox that maps 1 unit = 1 mm. The ski's length, waist width, sidecut, and tip/tail dimensions are rendered directly from the recommendation's range midpoints, with the option to nudge to either end of the range.

Two scale anchors:

- **Body silhouette comparison:** when the user supplies height in Act 4, show a stylized standing skier silhouette at the same scale next to the ski. The ski's tip should reach somewhere between chin and forehead on the silhouette depending on length recommendation. This is a powerful visual cue that the spec is "for them."
- **Current ski overlay:** when the user uploads or describes their current ski (length, brand, model), render a thinner ghosted outline of that ski beneath the new ski silhouette. Visual diff in length and waist width. Caption: "Yours is 172cm at 88mm. We're suggesting 175 to 180cm at 95 to 100mm."

For mobile, default to landscape ski silhouette across the top third of the viewport. Allow tap to expand into a full-screen comparison view.

---

## 6. Recommendation and Material Exploration

The output is not a single spec. It is three "ride personalities," each with a **derived** customer-facing name, a marketing description, and a defensible underlying construction family. The user can flip between them and feel the ski change.

**Personality names are not preset.** They are generated from two axes:

1. **Material combination characteristics** (construction family, base, structural layers) — the "what this ski is" axis.
2. **User personality traits** inferred from their answers — stability/weight slider position, day types, terrain mix, and especially the open-text likes/dislikes on their current skis and "anything else we should know." This is the "who the skier is" axis.

Names should be 2 to 3 words, evocative, and feel-oriented rather than material-jargon. A skier should not need to know what Titanal is to feel what the name promises. Personalization with the user's first name is encouraged where it reads naturally (e.g., "Brian's Edge Composer").

Each personality renders with:

- Animated flex pattern preview (a slow loop of the ski flexing under a hypothetical compression)
- Skier-voice marketing description, pre-generated and stored, not run live. Format:

> "**The Edge Composer** rides like the snow owes it money. You will feel planted at speed, with edge hold that asks for more on hard groomers and broken crud. Expect to point it through variable conditions without the chatter that lighter skis pick up. Best for: aggressive resort days, mixed conditions, skiers who want stability over agility."

(That name is illustrative only. Actual names come out of the generation pipeline below.)

**Pre-generation pipeline.** For every valid `(construction_family, primary_use_case, terrain_emphasis, stability_weight_position)` tuple, the build-time job produces a description **plus 3 to 5 name variants**. At runtime, the system picks a variant based on signals extracted from the user's open-text answers (simple sentiment plus keyword detection for words like "stiff," "lively," "stable," "snappy," etc.). The chosen variant can be optionally first-name personalized.

**Optional emotional hook to consider.** Let the user pick their preferred name from the variants once they land on their personality. Naming creates ownership and gives the saved-design page a personal identity rather than a record number. Worth wireframing as a small post-selection moment in Act 5.

Below the three personalities, a soft "play with it" affordance:

- Waist width slider within the recommended range (e.g., 95 to 100mm)
- Length slider within the recommended range
- Camber: low / medium / high pills
- Topsheet graphic picker (gallery of Wagner house graphics, lazy-loaded)

Every change updates the silhouette and re-fetches the cached description for the new combination.

The user is not picking a final spec. Microcopy says so explicitly: "These ranges are a starting point. Your Wagner designer will dial in the exact build on your call."

---

## 7. Lead Capture Strategy

Capture is layered, friendly, and aligned with the experience, never a gate that blocks the output.

| Moment | Field | Treatment | Required? |
|---|---|---|---|
| Act 1 | First name | Inline, single field, large input | Yes, soft (one retry, then allow "Skip") |
| Act 5, after reveal | Email | "Save this design so you don't lose it" CTA. Captures email and persists the draft as a saved design with a unique link. | No, but heavily encouraged |
| Act 5, schedule-call CTA | Email + phone | Phone only when user opts into scheduling. Standard Cal.com / Calendly fields. | Yes for scheduling only |
| Post-experience email | (already have email) | Triggered email arrives with the rendered ski PNG, the description, and a "Book your design call" button | n/a |

Principles:

- Never block the output reveal behind an email gate. The output reveal earns the email, not the other way around.
- Email request copy frames it as a save action, not a lead capture: "We will email you your design so you don't lose it. No spam." Verified copy testing should follow.
- Phone is only captured when the user voluntarily begins scheduling. Do not ask for phone at any other moment.
- Use Shopify's existing customer record where possible. If the user is logged into a Shopify customer account, prefill email and skip the save gate.

---

## 8. Design-Call CTA Placement

The design call is the highest-value conversion. It appears in three weighted places:

1. **Persistent micro-CTA** in the experience header from Act 3 onward: "Prefer to talk it through? Book a 20-min call." Low pressure, no modal. Tapping it pauses the flow and lets the user book without losing their progress.
2. **Primary CTA in Act 5** after the output reveal: large button labeled "Book my design call." Secondary button: "Email me this design."
3. **Email follow-up CTA:** persistent button in the saved-design email and in any subsequent nurture email (e.g., 3 days, 7 days post-save).

Scheduling integration: embed **Calendly** inline (Wagner already uses Calendly) so the user never leaves the page. Pass the saved design's ID as a URL parameter or hidden Calendly question so the Wagner designer sees the spec when the call appears on their calendar.

---

## 9. Data Model (high level)

App database tables:

- `sessions` (anonymous, cookie-keyed): tracks in-progress drafts before email capture
- `skier_dna_responses`: full form payload, references a session and optionally a customer
- `designs`: the recommendation output snapshot at time of save. Stores ranges, selected personality, selected length / waist / camber / graphic, and reference to the marketing copy ID
- `marketing_copy` (pre-seeded): all pre-generated descriptions keyed by combination tuple
- `customers` (links to Shopify customer ID when present)
- `scheduled_calls`: link to Cal.com / Calendly booking event ID, design ID, customer

This schema is also what unlocks the "garage" vision later. Each design becomes a row a customer can revisit.

---

## 10. Tech Notes for Engineering

- **Front end:** React via Hydrogen or as a Theme App Block. Framer Motion or Motion One for the ski animations. SVG-first rendering, no Canvas unless required for graphic compositing.
- **Ski rendering:** single layered SVG, viewBox in millimeters. Topsheet graphics applied as SVG `<image>` with masking against the ski outline. True-to-scale anchor element on screen (a body silhouette) to enforce visual scale.
- **State:** Zustand or React Context for session state. Persist drafts via the App's API every time the user advances.
- **Marketing copy + name pipeline:** one-time batch job using Gemini or Claude Haiku to generate, for every valid `(construction, use case, terrain, stability/weight)` tuple, a description plus 3 to 5 personality-name variants. Store in Postgres or a flat JSON table in the App's DB. No runtime LLM calls. A lightweight runtime selector picks the name variant using simple sentiment/keyword extraction from the user's open-text answers; optionally first-name personalizes. Roland or a copywriter should sign off on the batch output before it ships.
- **Lead pipeline:** webhook on email capture into **Klaviyo** (Wagner's existing email platform). Klaviyo customer profile attributes to write: `last_dna_design_id`, `dna_completed_at`, `recommended_personality`, `recommended_length_range`, `recommended_waist_range`, `recommended_construction_family`. Trigger Klaviyo flows for the saved-design email and the follow-up nurture sequence.
- **Scheduler:** **Calendly** inline embed (Wagner's existing scheduling platform). Pass design ID through as a URL parameter or hidden question so it appears on the designer's calendar invite.
- **Analytics:** event-level tracking on each act transition, each ski-attribute change, each CTA impression and click. GA4 plus a simple internal table for funnel analysis.
- **Photo upload (current ski):** S3 (or Shopify Files API) with size and MIME validation. Optional, never blocking.

---

## 11. Phase 1 vs Phase 2

**Phase 1 (ship first):**

- Five-act flow with all questions
- Live ski silhouette evolution
- Three personalities at output
- Within-range slider exploration
- Save design via email
- Book call via embedded scheduler
- Email follow-up with saved design

**Phase 2 (next quarter):**

- Customer "garage" inside Shopify customer accounts
- Graphic picker with deeper library and AI-assisted preview
- Returning user picks up where they left off
- Production-update messaging hooks (when Wagner internal system integration happens)
- Optional 3D rendering upgrade

---

## 12. Open Questions for the Working Session

1. Confirm the **naming-generation rules** with Pete: which user signals drive name selection, what tone/voice the names should hit, and whether the user-picks-from-variants moment is in scope for Phase 1. Names themselves are derived from the material combo plus user traits, not hand-picked. See Section 6.
2. Validate the body-silhouette scale anchor with Pete and Roland. Is it on-brand?
3. Lock the email-capture copy. We want it warm, not transactional. A short list of three or four variants for testing would be ideal.
4. Confirm whether package tier (Essential / Silver / Ultra) shows in the output, or stays in the design call. Recommend showing in Phase 1 as a contextual "Recommended Package: Silver" tag under each personality, with a `?` tooltip that links to the package detail page.
5. Pre-generated marketing copy: who owns voice review of the batch output (descriptions and name variants) before it ships? Roland or copywriter sign-off required.
6. Calendly setup: which Wagner designer event type(s) does the DNA flow point to? Single shared pool, or routed by region/use case? Define the Calendly question schema for passing the design ID through.

---

## 13. Success Metrics for Launch

- DNA completion rate (sessions that reach Act 5): target 55 to 65 percent
- Email capture rate on completed sessions: target 70 percent
- Scheduled-call rate on completed sessions: target 8 to 12 percent
- Average time in experience: target 2 to 4 minutes
- Saved-design return rate (user revisits saved design within 14 days): target 20 percent
- Design-call to deposit rate (sales-team metric): track but not gating

End of brief.
