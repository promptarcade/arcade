// ============================================================
// Mechanics Worker — generates game logic class for ONE mechanic
// ============================================================
// BLIND: sees only a mechanic name, entity name list, and
// canvas dimensions. Does NOT know about sprites, layout,
// other mechanics, or the pipeline.

const { callClaudeAsync } = require('../claude-worker');
const jsSyntax = require('../validators/js-syntax');

const SYSTEM = 'You are a JavaScript class generator for interactive canvas applications. Write self-contained classes with update and draw methods. Output only valid JSON matching the provided schema.';

const SCHEMA = {
  type: 'object',
  properties: {
    className: { type: 'string', minLength: 1 },
    classCode: { type: 'string', minLength: 50 },
    requiredEntities: { type: 'array', items: { type: 'string' } },
    events: { type: 'array', items: { type: 'string' } },
  },
  required: ['className', 'classCode', 'requiredEntities', 'events'],
};

function buildPrompt(mechanicName, entityNames, benchmarks) {
  return `Write a self-contained JavaScript class that implements the "${mechanicName}" system for a 2D canvas interactive application.

Available entity type names: ${entityNames.join(', ')}

Canvas dimensions are available as globals: W (width) and H (height).
Scale factor available as global: S (relative to 600px baseline). Multiply ALL sizes and speeds by S.

The class MUST have these exact methods:
1. constructor(entities) — receives array of {name, x, y, width, height, type, sprite} objects. Store a reference.
2. update(dt) — advances state by dt seconds. MUST return an array of event objects (can be empty []).
   Events: {type: "score", value: Number} | {type: "state", key: String, value: any}
3. draw(ctx) — renders visual effects to a 2D canvas context (range indicators, health bars, UI overlays). The main entity sprites are drawn elsewhere.
4. handleInput(type, data) — type is "click"/"touchstart"/"keydown"/"keyup". data has {x, y, code, key} properties.

CRITICAL — the update(dt) method must do REAL WORK:
- Maintain internal timers, counters, positions
- Modify entity positions (entities are mutable objects with x, y properties)
- Calculate distances: Math.hypot(a.x - b.x, a.y - b.y)
- Return score events when conditions are met
- The class must produce VISIBLE, MEASURABLE change each frame

FORBIDDEN:
- No empty method bodies
- No placeholder comments like "// TODO" or "// implement later"
- No imports, exports, require
- No fetch, XMLHttpRequest, eval

Provide:
- className: PascalCase class name
- classCode: the complete class as a string (class ClassName { constructor... update... draw... handleInput... })
- requiredEntities: array of entity type names this mechanic operates on
- events: array of event type strings this mechanic emits`;
}

async function mechanic(mechanicName, entityNames, benchmarks, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`  [MECHANIC:${mechanicName}] Generating logic class${attempt > 1 ? ` (attempt ${attempt})` : ''}...`);

    let result;
    try {
      result = await callClaudeAsync({
        prompt: buildPrompt(mechanicName, entityNames, benchmarks),
        systemPrompt: SYSTEM,
        schema: SCHEMA,
        model: 'sonnet',
        budgetUsd: 0.30,
      });
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      console.error(`  [MECHANIC:${mechanicName}] API error: ${err.message.slice(0, 100)}`);
      continue;
    }

    const { className, classCode, requiredEntities, events } = result.data;

    const syntax = jsSyntax.validate(classCode, {
      parseable: true,
      wrapInFunction: false,
      requiredMethods: ['update', 'draw', 'handleInput'],
    });
    if (!syntax.valid) {
      console.error(`  [MECHANIC:${mechanicName}] Validation failed: ${syntax.errors[0]}`);
      if (attempt === maxAttempts) {
        throw new Error(`Mechanic "${mechanicName}" failed after ${maxAttempts} attempts: ${syntax.errors.join('; ')}`);
      }
      continue;
    }

    console.log(`  [MECHANIC:${mechanicName}] OK — class: ${className}, events: [${events.join(', ')}]`);

    return {
      mechanicName,
      className,
      classCode,
      requiredEntities,
      events,
      cost: result.cost,
    };
  }
}

module.exports = mechanic;
