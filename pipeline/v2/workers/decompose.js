// ============================================================
// Decomposer — the ONLY worker that sees the user request
// ============================================================
// Translates a product request into abstract component specs.
// Uses geometric descriptions, not domain-specific vocabulary.

const { callClaude } = require('../../claude-worker');
const { validate } = require('../../validators/schema');

const SYSTEM = 'You are a product decomposer. Break down interactive product requests into abstract visual components (shapes), physics/movement behaviors, and input bindings. Use ONLY geometric descriptions (rectangle, circle, oval, line) — NEVER use domain-specific names like "paddle", "player", "enemy", "ball", "turret", etc. Use shape IDs (shape-a, shape-b, etc.) and describe movement as velocity, position, and collision rules.';

const SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    shapes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          description: { type: 'string' },
          w: { type: 'integer', minimum: 8 },
          h: { type: 'integer', minimum: 8 },
          theme: { type: 'string' },
          tile: { type: 'boolean' },
        },
        required: ['id', 'description', 'w', 'h', 'theme'],
      },
      minItems: 2,
    },
    behaviors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['id', 'description'],
      },
      minItems: 1,
    },
    inputs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          event: { type: 'string' },
          action: { type: 'string' },
        },
        required: ['event', 'action'],
      },
    },
    layout: { type: 'object' },
  },
  required: ['title', 'shapes', 'behaviors', 'inputs', 'layout'],
};

function decompose(rawRequest) {
  console.log('[DECOMPOSE] Breaking request into abstract components...');

  const result = callClaude({
    prompt: `Decompose this interactive product request into abstract components.

Request: "${rawRequest}"

Output a JSON object with:
- title: a short creative name
- shapes: array of visual components. Each has:
  - id: "shape-a", "shape-b", etc.
  - description: geometric description ONLY ("tall narrow vertical rectangle", "small circle", "flat textured surface"). NO domain words.
  - w, h: pixel dimensions (8-64 range)
  - theme: color mood ("cool blue metallic", "bright white glow", "dark green matte")
  - tile: true if this should tile across the background
- behaviors: array of movement/physics rules. Each has:
  - id: "beh-1", "beh-2", etc.
  - description: physics rule using shape IDs ("shape-c moves at constant velocity, bounces off top/bottom edges, reverses x-velocity when overlapping shape-a or shape-b"). NO domain words.
- inputs: array of user input bindings. Each has:
  - event: key name or touch event ("ArrowUp", "ArrowDown", "touchmove")
  - action: what it does using shape IDs ("move shape-a up", "move shape-a to touch y-position")
- layout: object mapping shape IDs to initial positions as {x: "50%", y: "50%"} or "tile" for backgrounds

CRITICAL: Use ONLY geometric/physics language. Never use words like: game, player, enemy, paddle, ball, score, level, turret, tower, bug, wave.`,
    systemPrompt: SYSTEM,
    schema: SCHEMA,
    model: 'sonnet',
    budgetUsd: 0.30,
  });

  const spec = result.data;

  const v = validate(spec, SCHEMA);
  if (!v.valid) throw new Error(`Decompose validation failed: ${v.errors.join('; ')}`);

  console.log(`[DECOMPOSE] OK — "${spec.title}", ${spec.shapes.length} shapes, ${spec.behaviors.length} behaviors, ${spec.inputs.length} inputs`);
  return { spec, cost: result.cost };
}

module.exports = decompose;
