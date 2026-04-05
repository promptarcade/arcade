// ============================================================
// Layout Worker — positions entities and produces glue code
// ============================================================
// BLIND: sees entity names/dimensions/roles, mechanic class names
// and their events, and control bindings. Does NOT know about
// sprite code, mechanic implementations, or the pipeline.

const { callClaude } = require('../claude-worker');
const jsSyntax = require('../validators/js-syntax');

const SYSTEM = 'You are a layout and integration code generator for canvas applications. Produce initialization, game loop, and input handling code. Output only valid JSON matching the provided schema.';

const SCHEMA = {
  type: 'object',
  properties: {
    stateCode: { type: 'string', minLength: 10 },
    updateCode: { type: 'string', minLength: 10 },
    drawCode: { type: 'string', minLength: 10 },
    inputCode: { type: 'string', minLength: 10 },
    bootCode: { type: 'string', minLength: 10 },
  },
  required: ['stateCode', 'updateCode', 'drawCode', 'inputCode', 'bootCode'],
};

function buildPrompt(entityManifest, mechanicsList, controls) {
  const entitySummary = entityManifest.map(e =>
    `  - ${e.name} (${e.width}x${e.height}, role: ${e.role})`
  ).join('\n');

  const mechanicSummary = mechanicsList.map(m =>
    `  - ${m.className}: events [${m.events.join(', ')}], needs entities [${m.requiredEntities.join(', ')}]`
  ).join('\n');

  const spriteVars = entityManifest.map(e =>
    `sprite_${e.name.replace(/[^a-zA-Z0-9]/g, '_')}`
  );

  return `Generate integration code for a 2D canvas interactive application.

ENTITIES (each has a pre-rendered sprite canvas available as a variable):
${entitySummary}

Sprite variables (canvas elements, use with ctx.drawImage):
${spriteVars.map(v => `  - ${v}`).join('\n')}

MECHANIC CLASSES (already defined as global classes, instantiate with new):
${mechanicSummary}

CONTROLS:
- Keyboard: ${controls.keyboard.join(', ')}
- Touch: ${controls.touch.join(', ')}

Canvas globals available: W (width), H (height), S (scale factor, multiply all sizes and speeds by S), ctx (2D context), canvas element, score (number).

CRITICAL RULES:
- Every sprite variable listed above MUST appear in drawCode
- Entities with role "player" or "enemy" must MOVE each frame
- Drawing uses: ctx.drawImage(spriteVar, x, y, width * S, height * S)
- All positions and sizes multiply by S for responsive scaling
- The game must be playable immediately — no menu, no waiting
- DO NOT hardcode game-specific logic that doesn't match the entities and mechanics provided

Generate 5 code blocks:

1. stateCode: Initialize game state.
   - Create entity objects for each entity listed above with {name, x, y, width, height, type, sprite: sprite_xxx}
   - Position entities appropriately for the genre (use the entity roles and mechanic names to infer placement)
   - Instantiate EACH mechanic class: const mechXxx = new ClassName([...entities])
   - Store mechanics in an array: const mechanics = [...]
   - Define state vars: score, gameOver, any genre-appropriate state

2. updateCode: Per-frame logic (receives dt variable).
   - Move entities according to the genre's core mechanics
   - Call update(dt) on each mechanic, process returned events
   - Handle collisions between entities where appropriate
   - Update score on scoring events
   - DO NOT return early if gameOver — let drawCode handle it

3. drawCode: Per-frame rendering (canvas already cleared to #111).
   - Draw terrain/background entities first (tile if role is "terrain")
   - Draw all other entities using ctx.drawImage(entity.sprite, entity.x, entity.y, entity.width*S, entity.height*S)
   - Call draw(ctx) on each mechanic
   - Draw score/HUD with ctx.fillText (white, top of screen)
   - If gameOver: semi-transparent overlay with "GAME OVER" and "Click to restart"

4. inputCode: Event listeners (runs once).
   - Keyboard: addEventListener('keydown'/'keyup') — control player entities based on the controls spec
   - Touch: addEventListener('touchstart'/'touchmove'/'touchend') on canvas — map to same controls
   - Forward input to mechanics via handleInput(type, {x, y, code, key})
   - If gameOver, click/tap: location.reload()

5. bootCode: One-time initialization.
   - Any final entity positioning
   - Console.log("Game initialized")`;
}

async function layout(entityManifest, mechanicsList, controls, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[LAYOUT] Generating integration code${attempt > 1 ? ` (attempt ${attempt})` : ''}...`);

    let result;
    try {
      result = callClaude({
        prompt: buildPrompt(entityManifest, mechanicsList, controls),
        systemPrompt: SYSTEM,
        schema: SCHEMA,
        model: 'sonnet',
        budgetUsd: 0.50,
      });
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      console.error(`  [LAYOUT] API error: ${err.message.slice(0, 100)}`);
      continue;
    }

    const { stateCode, updateCode, drawCode, inputCode, bootCode } = result.data;
    const errors = [];

    // Validate each code block
    for (const [name, code] of Object.entries({ stateCode, updateCode, drawCode, inputCode, bootCode })) {
      const balance = jsSyntax.checkBalance(code);
      if (balance.length > 0) errors.push(`${name}: ${balance.join('; ')}`);
      const forbidden = jsSyntax.checkForbiddenPatterns(code);
      if (forbidden.length > 0) errors.push(`${name}: ${forbidden.join('; ')}`);
    }

    // Check that entity sprites are referenced in drawCode or stateCode
    const allCode = stateCode + drawCode;
    const missingSprites = entityManifest
      .filter(e => !allCode.includes(`sprite_${e.name.replace(/[^a-zA-Z0-9]/g, '_')}`))
      .map(e => e.name);
    if (missingSprites.length > entityManifest.length * 0.3) {
      errors.push(`${missingSprites.length}/${entityManifest.length} sprites missing from code: ${missingSprites.join(', ')}`);
    }

    if (errors.length > 0) {
      console.error(`  [LAYOUT] Validation failed: ${errors[0]}`);
      if (attempt === maxAttempts) {
        throw new Error(`Layout failed after ${maxAttempts} attempts: ${errors.join('; ')}`);
      }
      continue;
    }

    // Check input handlers exist
    if (!inputCode.includes('keydown') && !inputCode.includes('keyup') && !inputCode.includes('click')) {
      errors.push('inputCode missing keyboard/click event listeners');
      if (attempt === maxAttempts) throw new Error('Layout inputCode missing event listeners');
      continue;
    }

    console.log(`[LAYOUT] OK — all 5 code blocks generated`);

    return {
      stateCode,
      updateCode,
      drawCode,
      inputCode,
      bootCode,
      cost: result.cost,
    };
  }
}

module.exports = layout;
