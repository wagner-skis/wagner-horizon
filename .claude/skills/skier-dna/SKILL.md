# Skier DNA — AI Integration Skill

Use this skill when working on the Skier DNA feature's Claude/Anthropic connection, prompt engineering, or the Cloudflare Worker.

---

## Feature Architecture

The Skier DNA feature is a 5-act interactive experience that culminates in three AI-named ski personality builds. The data flow:

```
User fills Acts 1–4
  → computeSpec(state)          — derives length/waist ranges
  → computePersonalities()      — algorithm selects materials for 3 builds
  → fetchPersonalityNarratives() — POSTs to Cloudflare Worker
  → Worker calls Claude Haiku    — names, describes, reviews materials
  → Act 5 renders 3 personalities
```

---

## Key Files

| File | Role |
|---|---|
| `assets/skier-dna.js` | Client island — state machine, SVG rendering, fetch call |
| `workers/personalities/index.js` | Cloudflare Worker — proxies to Anthropic API |
| `workers/personalities/wrangler.toml` | Worker deployment config |
| `sections/skier-dna.liquid` | Shopify section — merchant settings, material library JSON |

---

## Free-Form State Fields

These fields are collected from users and sent to Claude:

| State key | Act | UI label |
|---|---|---|
| `state.currentSki.brand/model/year/length` | 3 | Current ski identifier |
| `state.currentSkiLikes` | 3 | "What do you love about these skis?" |
| `state.currentSkiImprovements` | 3 | "Where could they perform better?" |
| `state.personalNotes` | 4 | "Anything else we should know?" |

These are formatted and sent in `payload.skier` by `fetchPersonalityNarratives` in `assets/skier-dna.js`.

---

## Worker: `workers/personalities/index.js`

### Model
`claude-haiku-4-5-20251001` — fast, cost-efficient, sufficient for structured JSON output.

### Secrets
API key stored via Wrangler: `wrangler secret put ANTHROPIC_API_KEY` (run from `workers/personalities/`).

### Prompt structure (`buildPrompt`)
1. **SKIER PROFILE** — structured data (regions, terrain, stability, etc.)
2. **SKIER'S OWN WORDS** — free-form text (only included if any field is non-empty)
3. **THREE CUSTOM BUILDS** — algorithmically-selected materials per build
4. **Instructions** — ask Claude to review materials against the skier's words, then name/describe each build

### Response schema
```json
{
  "personalities": [
    { "name": "...", "tagline": "...", "desc": "...", "materialNote": "..." | null },
    { "name": "...", "tagline": "...", "desc": "...", "materialNote": null },
    { "name": "...", "tagline": "...", "desc": "...", "materialNote": "..." | null }
  ]
}
```

- `name`: 2–4 evocative words, no article "The"
- `tagline`: ≤8 words, punchy
- `desc`: Exactly 2 sentences, second person, sensory
- `materialNote`: One sentence connecting a material to what the skier said, or `null`

### CORS
Allowed origins: `https://wagner-skis.myshopify.com`, `http://localhost:9292`, `http://127.0.0.1:9292`

---

## Extending the Prompt

To add new skier fields to the Claude context:

1. Add the field to `payload.skier` in `fetchPersonalityNarratives` (`assets/skier-dna.js`, around line 1321)
2. Add a line to the `words` array in `buildPrompt` (`workers/personalities/index.js`)
3. If the field affects output format, update the instruction block and example JSON at the bottom of `buildPrompt`
4. Increase `max_tokens` if the response schema grows

To change what Claude outputs per personality, update the `sections.push(...)` instruction block and the example JSON at the end of `buildPrompt`.

---

## Materials System

Materials come from the `material_library` Shopify metaobject, serialized into `config.materials` by `sections/skier-dna.liquid`.

Each material has: `name`, `category`, `sub_category`, `personality_tags`, `damp_factor`, `flex_factor`, `speed_factor`, `weight_factor`.

The `selectMaterialsForPole(pole, materials)` function in `assets/skier-dna.js` scores materials by 4D Euclidean distance from a target point (damp/flex/speed/weight). `computePersonalities()` calls this for three poles, producing three builds.

Claude does not select materials — it reviews and names the algorithm's selections. If Claude's `materialNote` suggests a mismatch, the client currently stores it for display; adjusting the algorithm based on it would require a second round-trip or a client-side override step.

---

## Deploying the Worker

```bash
cd workers/personalities
wrangler deploy
```

To update the API key:
```bash
wrangler secret put ANTHROPIC_API_KEY
```

The worker name is `wagner-skier-dna-personalities` (set in `wrangler.toml`).

---

## Testing

1. `npm run dev` (from project root) — starts Shopify CLI dev server
2. Navigate to a page using the `skier-dna` section
3. Complete Acts 1–4, filling in free-form fields in Act 3 and notes in Act 4
4. DevTools → Network → find the POST to the personalities worker URL
5. Verify request body contains `currentSkiLikes`, `currentSkiImprovements`, `personalNotes`
6. Verify response contains `materialNote` (string or null) on each personality
