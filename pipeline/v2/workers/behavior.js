// ============================================================
// Behavior Worker — generates a pure physics/movement function
// ============================================================
// BLIND: sees only a physics rule description with shape IDs.
// "shape-c bounces off edges" — could be a simulation, visualization, anything.

const { callClaudeAsync } = require('../../claude-worker');
const jsSyntax = require('../../validators/js-syntax');

const SYSTEM = 'You are a physics/behavior code generator. Write pure JavaScript functions that modify object positions based on described rules. Output only valid JSON.';

const SCHEMA = {
  type: 'object',
  properties: {
    code: { type: 'string', minLength: 20 },
  },
  required: ['code'],
};

async function behavior(behaviorSpec, shapeIds, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`  [BEHAVIOR:${behaviorSpec.id}] Generating${attempt > 1 ? ` (attempt ${attempt})` : ''}...`);

    let result;
    try {
      result = await callClaudeAsync({
        prompt: `Write a JavaScript function body that implements this rule:
"${behaviorSpec.description}"

The function signature is: function(shapes, dt, W, H, S, inputState)
- shapes: object where shapes['${shapeIds[0]}'] = {x, y, w, h, vx, vy, ...}
  Available shape IDs: ${shapeIds.join(', ')}
- dt: delta time in seconds
- W, H: canvas width/height in pixels
- S: scale factor (multiply speeds and sizes by S)
- inputState: { keys: { ArrowUp: true/false, ... }, touch: {x, y} or null }

The function MUST:
- Modify shape properties directly (shapes['shape-a'].x += ...)
- Return an array of event strings (e.g., ['left-score', 'right-score', 'reset']). Return [] if no events.
- Use S to scale all speeds and distances
- Clamp positions to stay within 0..W and 0..H where appropriate

Output a single "code" field containing the function BODY only (no function declaration).`,
        systemPrompt: SYSTEM,
        schema: SCHEMA,
        model: 'haiku',
        budgetUsd: 0.05,
      });
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      continue;
    }

    const { code } = result.data;

    const syntax = jsSyntax.validate(code, { wrapInFunction: true });
    if (!syntax.valid) {
      console.error(`  [BEHAVIOR:${behaviorSpec.id}] Syntax error: ${syntax.errors[0]}`);
      if (attempt === maxAttempts) throw new Error(`Behavior "${behaviorSpec.id}" failed: ${syntax.errors.join('; ')}`);
      continue;
    }

    // Verify it references at least one shape
    const refsShape = shapeIds.some(id => code.includes(id));
    if (!refsShape) {
      console.error(`  [BEHAVIOR:${behaviorSpec.id}] No shape references found`);
      if (attempt === maxAttempts) throw new Error(`Behavior "${behaviorSpec.id}" doesn't reference any shapes`);
      continue;
    }

    console.log(`  [BEHAVIOR:${behaviorSpec.id}] OK`);
    return { id: behaviorSpec.id, code, cost: result.cost };
  }
}

module.exports = behavior;
