# Install — where the files go, and what to do next

The `design_handoff_skier_dna/` folder is a **handoff package**: docs + design reference + a small
scaffold. **Do not deploy the whole folder to your theme** — Shopify only recognizes fixed top-level
theme folders, and the `wireframe/*.html|jsx` files (CDN React/Babel) must never ship to a live theme.

## 1. Drop the package in the repo as docs (not deployed)
Put the folder somewhere Shopify CLI won't push it — e.g. at the repo root or under `docs/`:

```
wagner-theme/                         ← your existing Shopify theme repo
├── assets/  config/  layout/  locales/  sections/  snippets/  templates/   ← real theme
└── docs/
    └── design_handoff_skier_dna/     ← drop the WHOLE package here (reference only)
```
If you use Shopify CLI, add `docs/` to `.shopifyignore` so `shopify theme push` skips it.

## 2. Move the three scaffold files into the REAL theme folders
These are the only files that become live theme code:

| From (in the package) | To (in your theme) |
|---|---|
| `shopify-scaffold/sections/skier-dna.liquid` | `sections/skier-dna.liquid` |
| `shopify-scaffold/assets/skier-dna.js` | `assets/skier-dna.js` |
| `shopify-scaffold/templates/page.skier-dna.json` | `templates/page.skier-dna.json` |

> `SCHEMA-MAP.md` stays in `docs/` — it's reference, not theme code.

## 3. Create the page in Shopify admin
Online Store → **Pages** → **Add page** → title "Skier DNA" → in **Theme template** pick
`page.skier-dna` → Save. It now lives at `/pages/skier-dna`, wrapped by your existing header/footer.
(`shopify theme dev` to preview locally.)

At this point you have a working page that renders the mount point + an empty island stub. The flow
itself is the next job.

## 4. Point Claude Code at the package and build
From the theme repo root, open Claude Code and paste a prompt like:

> Read `docs/design_handoff_skier_dna/README.md` and the files it references (especially
> `SCHEMA-MAP.md`, the wireframe HTML in `wireframe/`, and the screenshots). Implement the Skier DNA
> five-act experience as the client island mounted by `sections/skier-dna.liquid` into
> `#skier-dna-root`, following our theme's existing JS/build conventions. Read all copy, design
> tokens, content cards, and integration config from the block (the Theme Contract in README §5) —
> don't hard-code them. Start with the Act 1→5 state machine and the layered SVG ski (8 states),
> using the wireframes for structure and our theme settings for styling. Respect README §4a: this is
> a page-body experience inside our existing header/footer — don't rebuild global nav.

Claude Code will recreate the wireframes in your theme's real environment.

## 5. The app backend is a SEPARATE repo
Persistence, Klaviyo, Calendly, and the pre-generated copy pipeline (README §§8, 10, 11) live in a
**Shopify app**, not the theme. Scaffold it separately (`shopify app init`, Remix recommended). When
it exists, promote `sections/skier-dna.liquid` to a **theme app extension app block**
(`extensions/skier-dna/blocks/skier-dna.liquid`) per the comment block at the top of that file — the
schema transfers 1:1. Until then, the theme section is a perfectly good way to build and demo the
front end against mocked data.

## Quick checklist
- [ ] Package in `docs/` (or ignored path), not pushed to the theme
- [ ] 3 scaffold files moved into `sections/`, `assets/`, `templates/`
- [ ] Page created in admin on the `page.skier-dna` template
- [ ] `header_offset` setting set to your theme's header height
- [ ] Claude Code pointed at `README.md` to build the island
- [ ] App backend scaffolded separately when you reach persistence/leads/scheduling
