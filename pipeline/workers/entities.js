// ============================================================
// Entity Worker — generates entity manifest from spec + benchmarks
// ============================================================
// BLIND: sees genre, theme, visual style, and numeric benchmarks.
// Does NOT know about sprites, rendering, assembly, or pipeline.

const { callClaude } = require('../claude-worker');
const { validate } = require('../validators/schema');

const SYSTEM = 'You are a visual asset planner. Design complete entity manifests for interactive visual products. Output only valid JSON matching the provided schema.';

const ENTITY_SCHEMA = {
  type: 'object',
  properties: {
    entities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          description: { type: 'string', minLength: 10 },
          width: { type: 'integer', minimum: 24 },
          height: { type: 'integer', minimum: 24 },
          colors: {
            type: 'object',
          },
          role: {
            type: 'string',
            enum: ['player', 'enemy', 'projectile', 'prop', 'terrain', 'ui', 'effect'],
          },
        },
        required: ['name', 'description', 'width', 'height', 'colors', 'role'],
      },
      minItems: 5,
    },
  },
  required: ['entities'],
};

function buildPrompt(spec, benchmarks) {
  return `Design a complete visual entity manifest for an interactive product.

Specification:
- Genre: ${spec.genre}
- Visual style: ${spec.visualStyle}
- Theme: ${spec.theme}
- Core interactions: ${spec.coreLoop.join(', ')}

Benchmarks from successful similar products suggest ${benchmarks.avgEntityCount} entity types is appropriate.
Common mechanics include: ${benchmarks.commonMechanics.join(', ')}.

For EACH entity provide:
- name: short identifier (lowercase, no spaces, use hyphens)
- description: what it looks like physically (shape, features, distinguishing details). Be specific enough that an artist could draw it from this description alone.
- width: canvas width in pixels (characters: 32-48, small props: 24-32, large props: 32-48, terrain: 32-32)
- height: canvas height in pixels (characters: 48-64, small props: 24-32, large props: 32-48, terrain: 32-32)
- colors: object mapping color-name to hex value. Each entity needs 4-6 named colors that form a cohesive palette. Include a base color, highlight, shadow, and accent at minimum.
- role: one of "player", "enemy", "projectile", "prop", "terrain", "ui", "effect"

Requirements:
- At least 1 entity with role "player"
- At least 2 entities with role "enemy" or "projectile"
- At least 3 entities with role "prop" or "terrain"
- Entity count should be between 6 and 10 (this is a lightweight browser product)
- All color hex values must be valid 6-digit hex (e.g. "#FF6B35")
- Each entity must have at least 4 colors`;
}

async function entities(spec, benchmarks) {
  console.log(`[ENTITIES] Generating entity manifest...`);

  const result = callClaude({
    prompt: buildPrompt(spec, benchmarks),
    systemPrompt: SYSTEM,
    schema: ENTITY_SCHEMA,
    model: 'sonnet',
    budgetUsd: 0.20,
  });

  const manifest = result.data.entities;

  // Validate schema
  const v = validate(result.data, ENTITY_SCHEMA);
  if (!v.valid) {
    throw new Error(`Entity validation failed: ${v.errors.join('; ')}`);
  }

  // Additional checks
  const roles = manifest.map(e => e.role);
  if (!roles.includes('player')) {
    throw new Error('Entity manifest missing player entity');
  }
  if (roles.filter(r => r === 'enemy' || r === 'projectile').length < 2) {
    throw new Error('Entity manifest needs at least 2 enemy/projectile entities');
  }

  // Verify each entity has at least 4 colors
  for (const entity of manifest) {
    const colorCount = Object.keys(entity.colors).length;
    if (colorCount < 4) {
      throw new Error(`Entity "${entity.name}" has only ${colorCount} colors (need ≥4)`);
    }
    // Verify hex format
    for (const [name, hex] of Object.entries(entity.colors)) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        throw new Error(`Entity "${entity.name}" color "${name}" invalid hex: ${hex}`);
      }
    }
  }

  console.log(`[ENTITIES] OK — ${manifest.length} entities: ${manifest.map(e => e.name).join(', ')}`);
  return { entities: manifest, cost: result.cost };
}

module.exports = entities;
