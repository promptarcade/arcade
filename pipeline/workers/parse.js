// ============================================================
// Parse Worker — extracts structured fields from raw request
// ============================================================
// BLIND: sees only raw text. Does not know about games,
// pipelines, sprites, or any other step.

const { callClaude } = require('../claude-worker');
const { validate } = require('../validators/schema');

const SYSTEM = 'You are a requirements extraction tool. Extract structured fields from product descriptions. Output only valid JSON matching the provided schema.';

const SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 1 },
    genre: { type: 'string', minLength: 1 },
    coreLoop: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
      maxItems: 3,
    },
    controls: {
      type: 'object',
      properties: {
        keyboard: { type: 'array', items: { type: 'string' } },
        touch: { type: 'array', items: { type: 'string' } },
      },
      required: ['keyboard', 'touch'],
    },
    theme: { type: 'string', minLength: 1 },
    visualStyle: { type: 'string', minLength: 1 },
  },
  required: ['title', 'genre', 'coreLoop', 'controls', 'theme', 'visualStyle'],
};

async function parse(rawRequest) {
  console.log('[PARSE] Extracting structured spec from request...');

  const prompt = `Analyze this product request and extract the following fields:
- title: a short, original product name
- genre: the product category/genre
- coreLoop: array of exactly 2-3 DISTINCT core interaction mechanics. Each must be a unique system (e.g. "placement", "wave-spawning", "resource-management"). Do NOT list overlapping mechanics — "place turrets" and "strategize positions" are the same thing.
- controls: object with "keyboard" (array of key bindings like "arrow keys", "spacebar") and "touch" (array of gestures like "tap", "swipe", "drag")
- theme: the visual/narrative theme
- visualStyle: art style description (e.g. "pixel art", "minimalist", "hand-drawn")

Request: "${rawRequest}"`;

  const result = callClaude({
    prompt,
    systemPrompt: SYSTEM,
    schema: SCHEMA,
    model: 'haiku',
    budgetUsd: 0.10,
  });

  const spec = result.data;

  // Validate
  const v = validate(spec, SCHEMA);
  if (!v.valid) {
    throw new Error(`Parse validation failed: ${v.errors.join('; ')}`);
  }

  console.log(`[PARSE] OK — title: "${spec.title}", genre: "${spec.genre}", ${spec.coreLoop.length} mechanics`);
  return { spec, cost: result.cost };
}

module.exports = parse;
