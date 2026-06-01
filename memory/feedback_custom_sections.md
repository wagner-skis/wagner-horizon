---
name: feedback_custom_sections
description: Rules for building Wagner custom Shopify sections — locale setup, category naming, file naming
metadata:
  type: feedback
---

When building new custom Wagner sections, follow these rules:

1. **Skip locale/language setup entirely.** Do not add translation keys to `en.default.schema.json` or any other locale file. Hardcode English strings directly in schema labels and section markup for Wagner-specific sections.

**Why:** Wagner is an English-only store. Locale scaffolding for custom sections is unnecessary overhead.

**How to apply:** Use plain English strings in schema `"label"`, `"name"`, `"content"` fields. Do not use `t:` keys for any new Wagner-specific schema strings. Still use existing `t:` keys that already exist in the theme (e.g. `t:settings.columns`, `t:content.padding`) — only skip adding new ones.

2. **Category must be `"Wagner"` in all custom section presets.**

**Why:** Groups Wagner custom sections together in the theme editor's "Add section" list for easy discovery.

**How to apply:** In every custom section schema preset, set `"category": "Wagner"`.

3. **Custom section/block naming convention: `custom-` prefix for sections, `_custom-` prefix for their private blocks.**

**Why:** Confirmed as the correct pattern. Clearly distinguishes Wagner additions from Horizon base components.

**How to apply:** New Wagner sections → `sections/custom-*.liquid`. Their static sub-blocks → `blocks/_custom-*.liquid`.
