const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ALLOWED_ORIGIN = 'https://wagner-skis.myshopify.com';

const SYSTEM_PROMPT = `You are a master custom ski designer at Wagner Skis, a bespoke American ski manufacturer in Telluride, Colorado. You design skis for elite and passionate skiers. Your tone is authoritative, specific, and sensory — you describe how skis actually feel, not abstract performance claims. You never use generic ski marketing language. Write as if you personally built this ski for this specific person.`;

function stabilityLabel(s) {
  if (s < 0.2)  return 'maximum damp and edge hold — planted at all costs';
  if (s < 0.4)  return 'stable and damp, with controlled energy return';
  if (s < 0.6)  return 'balanced between stability and liveliness';
  if (s < 0.8)  return 'light and lively, quick edge-to-edge';
  return 'ultra-light and playful, minimum swing weight';
}

function buildPrompt(skier, builds) {
  var profile = [
    'Skier: ' + (skier.name || 'unnamed'),
    skier.regions && skier.regions.length  ? 'Ski regions: '  + skier.regions.join(', ')  : '',
    skier.dayTypes && skier.dayTypes.length ? 'Day types: '   + skier.dayTypes.join(', ') : '',
    skier.terrain && skier.terrain.length  ? 'Terrain: '     + skier.terrain.join(', ')  : '',
    'Feel preference: ' + stabilityLabel(skier.stability || 0.5),
    skier.ability ? 'Ability: ' + skier.ability : '',
    skier.height  ? 'Height: '  + skier.height  : '',
    skier.weight  ? 'Weight: '  + skier.weight  : '',
  ].filter(Boolean).join('\n');

  var words = [
    skier.currentSki           ? 'Current ski: '           + skier.currentSki           : '',
    skier.currentSkiLikes      ? 'What they love: '        + skier.currentSkiLikes      : '',
    skier.currentSkiImprovements ? 'Where it falls short: ' + skier.currentSkiImprovements : '',
    skier.personalNotes        ? 'Anything else: '         + skier.personalNotes        : '',
  ].filter(Boolean).join('\n');

  var buildsText = builds.map(function (b, i) {
    var mats = (b.materials || []).map(function (m) {
      var tags = m.tags && m.tags.length ? ' (' + m.tags.join(', ') + ')' : '';
      return '  - ' + m.category + ': ' + m.name + tags;
    }).join('\n');
    return 'Build ' + (i + 1) + ':\n' + (mats || '  (no materials specified)');
  }).join('\n\n');

  var sections = [
    'SKIER PROFILE:',
    profile,
  ];

  if (words) {
    sections.push('', 'SKIER\'S OWN WORDS:', words);
  }

  sections.push(
    '',
    'THREE CUSTOM BUILDS (algorithmically selected):',
    buildsText,
    '',
    'Using the skier profile' + (words ? ' AND their own words' : '') + ':',
    '1. Review the material selections for each build against what the skier has described about their experience and preferences. If any material stands out as particularly right or wrong for this specific person, capture that insight in materialNote (one sentence max, or null if nothing notable).',
    '2. For each build, write:',
    '   - name: A short, evocative personality name (2–4 words, no article "The"). Examples: "Glacier Hunter", "Deep Powder Scout", "Spring Predator", "Iron Grip Carver"',
    '   - tagline: One punchy sentence under 8 words that captures the essential feel',
    '   - desc: Exactly two sentences in second person (you/your). First sentence: how this ski feels underfoot and what it does instinctively. Second sentence: the specific terrain or conditions where it truly comes alive. Be sensory and precise — no vague superlatives.',
    '   - materialNote: One sentence connecting a specific material choice to what the skier described, or null',
    '',
    'Return ONLY a valid JSON object — no markdown fences, no preamble, no trailing text:',
    '{"personalities":[{"name":"...","tagline":"...","desc":"...","materialNote":null},{"name":"...","tagline":"...","desc":"...","materialNote":"..."},{"name":"...","tagline":"...","desc":"...","materialNote":null}]}'
  );

  return sections.join('\n');
}

var DEV_ORIGINS = ['http://localhost:9292', 'http://127.0.0.1:9292'];

function corsHeaders(origin) {
  var allow = (origin === ALLOWED_ORIGIN || DEV_ORIGINS.indexOf(origin) >= 0) ? origin : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    var origin = request.headers.get('Origin') || '';
    var cors   = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: cors });
    }

    var body;
    try {
      body = await request.json();
    } catch (_) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    var apiRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1280,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPrompt(body.skier || {}, body.builds || []) }],
      }),
    });

    if (!apiRes.ok) {
      var errText = await apiRes.text();
      console.error('Anthropic error:', errText);
      return new Response(JSON.stringify({ error: 'Upstream error' }), {
        status: 502, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    var apiData = await apiRes.json();
    var text = apiData.content && apiData.content[0] && apiData.content[0].text;

    var result;
    try {
      var jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      result = JSON.parse(jsonText);
    } catch (_) {
      console.error('JSON parse failed, raw text:', text);
      return new Response(JSON.stringify({ error: 'Malformed AI response' }), {
        status: 502, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  },
};
