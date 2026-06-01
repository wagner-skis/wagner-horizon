# Wagner Horizon — CLAUDE.md

AI agent instructions for this Shopify Liquid theme. Keep this file scannable. Update per section 9.

---

## 1. Project Overview

- **Store:** wagner-skis.myshopify.com
- **Theme:** wagner-horizon — a fork of Shopify Horizon v3.4.0
- **Purpose:** Direct-to-consumer ski brand. Primary custom feature is a multi-step factory ski configurator (`product.factory-ski` template).
- **Custom work is additive** — Wagner adds on top of the Horizon base; do not replace base theme patterns when extending.
- **No CI/CD.** All deployments are manual via npm scripts.

---

## 2. Architecture

### Directory map

| Path | Purpose |
|---|---|
| `assets/` | Flat JS/CSS/SVG/font files. No build step — files deploy as-is. |
| `blocks/` | 103 Liquid block files. `_` prefix = private/static sub-component. No prefix = public (theme editor-addable). |
| `config/` | `settings_schema.json` (17 configurable groups) + `settings_data.json` (live values — do not hand-edit). |
| `layout/` | `theme.liquid` (main layout) + `password.liquid`. |
| `locales/` | 31 translation files + 20 schema variants. `en.default.json` is the source of truth. |
| `sections/` | 40 Liquid sections + 2 JSON section group files (`header-group.json`, `footer-group.json`). |
| `snippets/` | 81 Liquid partials. Called via `render` tag; no access to parent scope. |
| `templates/` | 15 JSON + 1 pure Liquid (`gift_card.liquid`). JSON templates are auto-generated — edits survive, but Shopify admin may overwrite structure. |
| `.shopify/` | `metafields.json` — Shopify CLI cache of store metafield schema. Do not edit manually. |
| `.cursor/rules/` | Cursor AI rule files (.mdc). Reference for conventions; no runtime effect. |

### Template type conventions

- **JSON templates** (all except `gift_card.liquid`) — section composition managed in Shopify admin. Do not add raw HTML here.
- **Pure Liquid templates** — only `gift_card.liquid`. Self-contained.
- **Custom template variants** (alternate templates): `collection.factory-skis`, `collection.graphics`, `product.factory-ski`, `page.contact`. Assigned per-resource in Shopify admin.

### Section group patterns

- **Header group** (`header-group.json`, type `"header"`): `header-announcements` + `header` sections, in that order. Menu handle: `2026-menu-left`. Transparent header uses `color_scheme_transparent: "scheme-6"`.
- **Footer group** (`footer-group.json`, type `"footer"`): `footer` + `footer-utilities` sections. 3-column footer groups + payment icons + copyright + policy list.
- Section groups cannot contain arbitrary sections — only sections of matching type are eligible.

### Block tiers

- `_`-prefixed blocks appear with `"static": true` in JSON templates — they are structural sub-components, not user-addable.
- Non-prefixed blocks are available in the theme editor block picker.

---

## 3. CSS Conventions

### Methodology

- **BEM** throughout (`block__element--modifier`). Examples: `password-footer__powered-by`, `predictive-search-results__card--query`.
- Small set of utility/state classes alongside BEM: `visually-hidden`, `list-unstyled`, `button-unstyled`, `disable-section-top-offset`.
- No Tailwind, no atomic classes.

### Where to add styles

| Scenario | Where to put CSS |
|---|---|
| Wagner brand-wide addition | `assets/wagner-brand.css` — additive only, loads after `base.css` |
| Component scoped to one section or snippet | `{% stylesheet %}...{% endstylesheet %}` block inside that Liquid file |
| Feature-specific (new self-contained block) | New `.css` file in `assets/`, loaded via `<link rel="stylesheet" href="{{ 'filename.css' | asset_url }}">` inside the block Liquid |
| Global structural change | `assets/base.css` — Horizon base; avoid editing unless necessary |

### No build step

- Plain vanilla CSS. No Sass, PostCSS, Tailwind, or bundler. Write CSS directly.
- `{% stylesheet %}` blocks are deduplicated server-side by Shopify — safe to use in snippets rendered multiple times.

### CSS custom properties / design tokens

Use existing tokens; do not hardcode values that have a token equivalent.

**Color:** `--color-foreground`, `--color-background`, `--color-border`, `--color-primary-button-background`, etc.
**Typography:** `--font-h1--size`, `--font-h1--family`, `--font-h1--weight`, `--font-heading--weight`, `--font-body--family`, `--font-subheading--family`, etc.
**Spacing:** `--padding-3xs` through `--padding-6xl`; `--margin-2xs` through `--margin-4xl`; `--gap-2xs` through `--gap-lg`.
**Shape:** `--style-border-radius-buttons`, `--style-border-radius-inputs`, `--style-border-width`.
**Animation:** `--animation-speed`, `--animation-speed-medium`, `--animation-easing`.
**Z-index layers:** `--layer-flat`, `--layer-raised`, `--layer-sticky`, etc.

**Wagner brand tokens** (defined in `wagner-brand.css`):
- `--wagner-navy: #1a3a5c`
- `--wagner-ink: #0a0a0a`
- `--wagner-eyebrow-tracking: 0.18em`
- `--wagner-link-underline-duration: 240ms`

### Wagner brand utility classes (from `wagner-brand.css`)

- `.wagner-eyebrow` / `.wagner-eyebrow--with-rule` — uppercase tracking label above headings
- `.wagner-link` / `.wagner-link--reverse` — slide-underline text link animation
- `.wagner-arrow-link` — uppercase text + animated `→` span
- `.wagner-img-hover` — wrapper that scales contained `<img>` on hover (600ms cubic ease)
- `.wagner-rule` — 1px horizontal rule, 0.18 opacity
- All Wagner animations respect `@media (prefers-reduced-motion: reduce)` — maintain this in new additions.

### Global stylesheet load order

1. `overflow-list.css` (preloaded)
2. `base.css` (preloaded, global)
3. `wagner-brand.css` (global, after base)
4. `wagner-fonts.css` (via `snippets/fonts.liquid`, preloads DIN Next LT Pro woff2 files)

---

## 4. JavaScript Conventions

### Paradigm

- **Vanilla JS + custom Web Components**. No React, Vue, Alpine, or other UI framework.
- All interactive UI extends the theme's `Component` base class (`assets/component.js`), which extends `HTMLElement` via `DeclarativeShadowElement`.
- 73 `customElements.define` calls across the codebase.

### Module system

- **ESM with import map** defined in `snippets/scripts.liquid`. Import bare specifiers using `@theme/*`:
  - `import { Component } from '@theme/component';`
  - `import { ThemeEvents } from '@theme/events';`
  - `import { SectionRenderer } from '@theme/section-renderer';`
- The import map maps 29 `@theme/*` specifiers to Shopify CDN asset URLs. Adding a new JS module requires adding it to the import map in `snippets/scripts.liquid`.
- All component scripts load as `type="module" fetchpriority="low"` — browsers defer them automatically.
- `view-transitions.js` and `auto-close-details.js` are IIFEs (not modules) — they do not use `@theme/*` imports.

### Theme global object

- `window.Theme` is set via an inline classic `<script>` in `snippets/scripts.liquid` before module scripts load.
- Contains: `Theme.routes.cart_add_url`, `cart_change_url`, `cart_update_url`, `cart_url`, `predictive_search_url`, `search_url`.
- Consume in modules as: `Theme.routes.cart_add_url` (no need to construct `/cart/add.js` manually).

### ThemeEvents

Use `ThemeEvents` from `@theme/events` for cross-component communication. Do not invent custom event strings.

| Event constant | String value | When fired |
|---|---|---|
| `ThemeEvents.variantUpdate` | `variant:update` | After variant selected and DOM updated |
| `ThemeEvents.variantSelected` | `variant:selected` | When user picks a variant option |
| `ThemeEvents.cartUpdate` | `cart:update` | After cart add/update |
| `ThemeEvents.cartError` | `cart:error` | On cart operation failure |
| `ThemeEvents.FilterUpdate` | `filter:update` | Collection filter change |

### Interactivity wiring

- Declarative event listeners are set up via the `Component` base class using `ref` attributes in HTML.
- Child element refs accessed via `this.refs.refName` (populated automatically by `Component`).
- Use `AbortController` + signal for cleanup in `disconnectedCallback` (see `ski-configurator.js` pattern).
- Cart API calls use `fetch()` directly — no jQuery or ajax cart library.

### Theme editor compatibility

- `assets/theme-editor.js` handles all `shopify:block:select`, `shopify:block:deselect`, `shopify:section:load`, `shopify:section:unload` events. Loaded only in `request.design_mode`.
- Check `window.Shopify?.designMode` or `Shopify.designMode` in component code where editor behavior differs (e.g., disable infinite scroll: see `product-card.js`).
- An `editorStateManager` IIFE in `theme-editor.js` uses `sessionStorage` + `MutationObserver` to persist overlay states across editor refreshes — do not duplicate this logic.

### Custom elements

New web components must:
1. Extend `Component` from `@theme/component`.
2. Register via `customElements.define('my-element', MyElement)`.
3. Add an `@theme/my-module` entry to the import map in `snippets/scripts.liquid`.
4. Load the script in `snippets/scripts.liquid` as `type="module" fetchpriority="low"`.

### Wagner custom element

- `<ski-configurator>` — defined in `assets/ski-configurator.js`, styles in `assets/ski-configurator.css`. Used only in `blocks/ski-configurator.liquid` on `templates/product.factory-ski.json`. Loaded on demand via inline `<script type="module">` inside the block.

---

## 5. Liquid Conventions

### Snippet vs section boundaries

- **Snippets** (`snippets/`) are pure partials — called with `render`, no access to calling scope. Pass all needed data as parameters.
- **Sections** (`sections/`) own their schema and settings. They call snippets; snippets do not call sections.
- **Blocks** (`blocks/`) are section sub-components. Private (`_`-prefix) blocks are `"static": true` in JSON templates. Public blocks are theme editor-addable.
- `section.liquid` (the generic container) calls `{% content_for 'blocks' %}` and delegates to `snippets/section.liquid` for markup.

### Schema setup rules

- All user-visible strings in `{% schema %}` must use `t:` keys that exist in `locales/en.default.json` (and all other locales). Never hardcode English strings directly in schema labels/content.
- Schema `"name"` values use `t:names.*` keys; settings labels use `t:settings.*`; content headers use `t:content.*`.
- `"class"` in section schema adds a wrapper class on the Shopify-generated section container element.
- `"disabled_on": { "groups": ["header"] }` — prevents sections from being added to header group; match existing patterns.

### Translation / locale handling

- Source file: `locales/en.default.json`. Top-level keys: `accessibility`, `actions`, `blocks`, `blogs`, `content`, `fields`, `gift_cards`, `placeholders`, `products`.
- `en.default.json` uses non-strict JSON (JS comments) — Shopify auto-generates this file. Do not edit the comment header.
- When adding new UI strings: add to all locale files. At minimum add to `en.default.json`; add placeholder copy to remaining locales and flag for translation.
- Schema locale strings live in `locales/en.default.schema.json` (and counterparts). Theme editor labels are separate from storefront strings.

### Metafield patterns

**Active metafield namespaces:**

| Namespace | Key | Type | Used where |
|---|---|---|---|
| `reviews` | `rating` | app-managed | `blocks/review.liquid` — reads `product.metafields.reviews.rating.value.rating`, `.scale_max`, `.rating_count` |
| `sensus` | `short_description` | `rich_text_field` | Registered in `.shopify/metafields.json`. Template `collection.factory-skis.json` calls it as `custom.short_description` — **namespace mismatch** (see Gotchas). |
| `sensus` | `usp` | `single_line_text_field` | Registered but not yet rendered in any section/snippet. |
| `custom` | `lock_color` | `list.color` | Registered but not yet rendered. |
| `shopify` | taxonomy fields | `list.metaobject_reference` | Standard taxonomy; not rendered in theme. |

**Known mismatch:** `templates/collection.factory-skis.json` references `custom.short_description` but `.shopify/metafields.json` registers `sensus.short_description`. Verify in Shopify admin which namespace is actually populated before editing either.

**No metafield or metaobject Liquid code** exists in any section or snippet file — all metafield reads happen through template JSON block settings using the `closest.` prefix (e.g., `{{ closest.product.metafields.custom.short_description | metafield_tag }}`).

### Ski configurator Liquid dependencies

`blocks/ski-configurator.liquid` resolves collections by handle at render time:
- Graphic collections: `graphic_collection_1` through `graphic_collection_4` settings (collection pickers) — handles like `house-graphics`, `james-niehues-collection`, `artist-series`.
- Bindings: `collections['bindings']` hardcoded handle.
- Flow Bundle: product picker setting `flow_bundle` resolved via `all_products[handle]`.

These collections and products must exist in the store. If a handle is missing, that section silently renders nothing.

---

## 6. Dev Workflow

### Local commands

```bash
npm run dev          # shopify theme dev --store=wagner-skis.myshopify.com
npm run check        # shopify theme check (Shopify Theme Check linter)
npm run check:fix    # shopify theme check --auto-correct
npm run pull         # pull from live theme on wagner-skis.myshopify.com
npm run pull:dev     # pull from development theme
npm run push:unpublished  # push as new unpublished theme (safe, does not overwrite live)
npm run list         # list themes on store
```

### Build steps

- **None.** No `npm install`, no compile, no bundle. `npm run dev` goes directly to Shopify CLI.
- Files in `assets/` are deployed as-is.

### Local development

- `npm run dev` starts a local proxy via the Shopify CLI with hot-reload for Liquid/CSS/JS changes.
- Store: `wagner-skis.myshopify.com`. No `shopify.theme.toml` — store URL is in each npm script flag.
- No `.shopifyignore` — all files in the repo upload on push. Do not put secrets or build artifacts in the repo.

### Deployment

- Push an unpublished copy: `npm run push:unpublished`, then activate in Shopify admin if approved.
- No automated CI/CD. All deploys are manual.

---

## 7. Constraints & Gotchas

### Liquid limits

- Snippets cannot access parent scope — always pass variables explicitly via `render 'snippet', variable: value`.
- `{% content_for 'blocks' %}` is only valid inside section Liquid files, not snippets.
- JSON templates (`templates/*.json`) are partially auto-generated by Shopify admin. Block order and section IDs can be overwritten. Keep custom logic in Liquid files, not JSON templates.
- `locales/en.default.json` has JS-style comments — not valid JSON. Shopify CLI handles this, but do not parse it with standard JSON parsers.

### Theme editor

- Do not break editor state: the `editorStateManager` in `theme-editor.js` uses `sessionStorage` to persist open overlays across section refreshes. New overlays/drawers must be discoverable by its `MutationObserver` or they will not persist state.
- Avoid JS that assumes a full page load on `shopify:section:load` — the section is re-rendered in place.
- `Shopify.designMode` is true in the editor — disable infinite scroll, auto-loading behaviors, and animations that conflict with block selection.

### Performance rules

- All new component scripts: `type="module" fetchpriority="low"`. Never load component JS synchronously.
- Five core modules are modulepreloaded in `snippets/scripts.liquid`: `utilities.js`, `component.js`, `section-renderer.js`, `section-hydration.js`, `morph.js`. Do not add to this list without reason — it adds network requests on every page.
- New `@theme/*` bare specifiers require an entry in the import map in `snippets/scripts.liquid`. Missing entries cause silent module load failures.
- `view-transitions.js` is loaded `async` by default. When `settings.page_transition_enabled` or `settings.transition_to_main_product` is true, it switches to `blocking="render"` — do not fight this with other render-blocking scripts.

### Non-obvious patterns

- **`morph.js`** — Section Rendering API responses are applied via DOM morphing, not innerHTML replacement. This preserves component state (open dialogs, scroll position, etc.). Do not use innerHTML to apply section renders.
- **`section-hydration.js`** — Sections hydrate at `requestIdleCallback` time. Components may not be connected immediately on paint.
- **`util-*` snippets** — `util-autofill-img-size-attr`, `util-mega-menu-img-sizes-attr`, `util-product-grid-card-size`, `util-product-media-sizes-attr` are image-sizing helpers. Use these when adding new product grid or media contexts to generate correct `sizes` attributes.
- **`color_scheme_transparent: "scheme-6"`** — The header uses scheme-6 for transparent-over-hero state. Do not change scheme-6 colors without checking header transparency appearance.
- **Menu handle `2026-menu-left`** — Must exist as a navigation menu in Shopify admin. If renamed in admin, update `header-group.json` (but note it may be overwritten by admin).
- **Metafield namespace mismatch** — `collection.factory-skis.json` calls `custom.short_description`; `.shopify/metafields.json` registers `sensus.short_description`. These are different namespaces. Verify in Shopify admin before adding new reads of this field.
- **`collections['bindings']`** in `ski-configurator.liquid` is a hardcoded collection handle. If that collection is deleted or renamed in the store, the bindings upsell silently disappears.
- **Font loading** — DIN Next LT Pro woff2 files are preloaded in `snippets/fonts.liquid`. `wagner-fonts.css` is the `@font-face` declaration file. Both must be present for correct font rendering.
- **`base.css` is 4,946 lines** — search it before adding a new style that might already exist as a global rule.
- **No app embed blocks** — `layout/theme.liquid` has no `{% content_for 'blocks' %}` at the layout level. Third-party apps that require embed blocks must be added to `theme.liquid` if needed.

---

## 8. Definition of Done

Before marking a Liquid/JS/CSS change complete, verify:

- [ ] **Theme editor** — Section/block renders correctly in Shopify theme editor. Block select/deselect does not break state.
- [ ] **Mobile** — Tested at 375px width. No layout overflow or broken tap targets.
- [ ] **Translation keys** — Any new user-visible strings added to `locales/en.default.json` (and `.schema.json` if schema-facing). No hardcoded English strings in schema.
- [ ] **Design tokens** — No hardcoded hex values or px sizes that have an equivalent CSS custom property.
- [ ] **CSS scope** — New styles use `{% stylesheet %}` if component-scoped, or `wagner-brand.css` if brand-global. No rogue `<style>` tags in Liquid markup.
- [ ] **JS module registration** — New JS modules added to the import map in `snippets/scripts.liquid` and loaded with `type="module" fetchpriority="low"`.
- [ ] **Reduced motion** — Animations and transitions guarded with `@media (prefers-reduced-motion: reduce)`.
- [ ] **Theme Check** — `npm run check` passes with no new errors.
- [ ] **Collection/product handle dependencies** — Any hardcoded collection or product handles (e.g., `collections['bindings']`) confirmed to exist in the store.
- [ ] **Metafield namespaces** — New metafield reads use the correct namespace (`sensus`, `custom`, `reviews`, etc.) as registered in `.shopify/metafields.json`.
- [ ] **No inline `<style>` tags** — All CSS is in `{% stylesheet %}` blocks or `.css` asset files.
- [ ] **`push:unpublished` tested** — Change pushed as unpublished theme and previewed on store before activating.

---

## 9. Maintaining This File

- **When to update:** New section or template added; new JS module registered in the import map; new CSS file added to global load order; new metafield namespace introduced; recurring gotcha discovered; dev workflow changes (e.g., `shopify.theme.toml` added, CI/CD introduced).
- **How to update:** Focused edits to the relevant section. Do not rewrite unrelated sections. Add a date note inline for significant structural changes (e.g., `<!-- Added 2026-01 -->`).
- **Do not:** Invent conventions not found in the codebase. Do not add vague rules. Keep each bullet actionable and specific.
- **File created:** 2026-06-01. Based on full directory, CSS, JS, config, and tooling audits of wagner-horizon at Horizon v3.4.0.
