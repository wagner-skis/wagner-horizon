# Schema Map — every wireframe control → where it lives

The point of this table: keep the seam clean. Anything a **merchant or Roland** should change without
a deploy is a **section setting** or a **block**. Anything that is part of the **flow logic or the
recommendation** is **app state / app backend** and must NOT be a theme block.

Legend: **S** = section/app-block setting · **B** = repeatable block · **App** = client island state ·
**API** = app backend.

| Wireframe element | Home | Notes |
|---|---|---|
| Headline, subhead, name prompt, gate copy, micro-CTA label, email-save copy | **S** | Theme Contract copy strings |
| Accent / ink / surface colors, heading & body fonts, corner radius | **S** | Exposed as `--sd-*` CSS vars on root |
| "Show package tag in Act 5" toggle | **S** | `show_package_tiers` |
| "Show true-scale body silhouette" toggle | **S** | `true_scale_anchor` |
| Theme header height (act min-height offset) | **S** | `header_offset` → `--sd-header-offset` |
| Global site header & footer | **Theme** | already exist — island must NOT rebuild them (README §4a) |
| Skier DNA sub-header (act breadcrumb + micro-CTA) | **App** | lives inside the section, distinct from theme nav |
| Calendly event URL | **S** | passed to the Book-Call embed |
| Klaviyo list ID | **S** | used by the email-capture webhook |
| Topsheet graphics collection | **S** (collection picker) | Shopify Filters → Pattern/Color facets |
| **Region options** (Western NA, Eastern NA, …) | **B** `region` | label + stable value key |
| **Day-type cards** (Everyday/Powder/Hard-firm/Touring) | **B** `day_type` | label + value + image |
| **Terrain cards** (eight) | **B** `terrain` | label + value + image |
| **Package tiers** (Essential/Silver/Ultra) | **B** `package_tier` | name + blurb + link |
| **Graphic categories** (House/Artist/Niehues/Wood) | **B** `graphic_category` | name + collection ref |
| Multi-select limits (region 1–3, terrain 1–3, day-type 1+) | **App** | flow rule, not editable content |
| The five acts + their order + breadcrumb | **App** | state machine from the flow diagram |
| Ski silhouette panel + its 8 evolution states | **App** | single layered SVG, mm viewBox |
| Stability/weight slider, current-ski fields, bindings radio | **App** | Act 3 inputs |
| Height/weight unit toggles, ability selector, BSL | **App** | Act 4 inputs |
| Live waist/length/camber sliders, topsheet picker | **App** | Act 5 "play with it" |
| Three ride personalities + names + descriptions | **API** | pre-generated copy table; runtime variant selector |
| Spec-sheet ranges (length/waist/sidecut/…) | **API** | derived from answers; ranges, not single values |
| Draft persistence per act advance | **API** | `sessions` / `skier_dna_responses` keyed by cookie id |
| Saved design + unique link (Resume) | **API** | `designs` table; email link → Act 5 pre-loaded |
| Scheduled call ↔ design id | **API** | Calendly event id stored on `scheduled_calls` |
| Photo upload (current ski) | **API** | Shopify Files API / S3, validated, optional |

## Why the acts aren't blocks (the one mistake to avoid)
It is tempting to make each act a Liquid block "so it's editable." Don't. The acts share one piece of
live state and one SVG that morphs across all of them; splitting them into independently-rendered
Liquid blocks would sever that shared state and the live ski reveal — the whole point of the
experience. Keep the acts in the island. Make only the **content the acts iterate over** (regions,
cards, tiers, categories) into blocks.
