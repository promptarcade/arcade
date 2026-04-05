// ============================================================
// Wiring Worker — connects inputs to shape state changes
// ============================================================
// BLIND: sees shape IDs, input events, and action descriptions.
// "ArrowUp moves shape-a up" — generic interactive canvas wiring.

const { callClaude } = require('../../claude-worker');
const jsSyntax = require('../../validators/js-syntax');

const SYSTEM = 'You are an interactive canvas input wiring generator. Generate JavaScript event listener code that modifies shape state based on input bindings. Output only valid JSON.';

const SCHEMA = {
  type: 'object',
  properties: {
    inputCode: { type: 'string', minLength: 20 },
    eventHandlers: { type: 'string' },
  },
  required: ['inputCode'],
};

function wiring(inputs, shapeIds) {
  console.log('[WIRING] Generating input handlers...');

  const inputSummary = inputs.map(i => `  - ${i.event}: ${i.action}`).join('\n');

  const result = callClaude({
    prompt: `Generate JavaScript code that wires user inputs to shape state changes.

Available shapes (accessed as shapes['id']): ${shapeIds.join(', ')}
Each shape has: {x, y, w, h, vx, vy}

Input bindings:
${inputSummary}

Global variables available:
- inputState: { keys: {}, touch: null } — you should update this
- shapes: the shapes object
- W, H: canvas dimensions
- S: scale factor (multiply speeds by S)

Generate:
- inputCode: addEventListener calls for keyboard and touch. Update inputState.keys on keydown/keyup. Update inputState.touch on touchstart/touchmove (set to {x, y}), null on touchend. Prevent default on touch events.
- eventHandlers: code to handle behavior events (placed inside the event processing loop where variable 'e' is the event string). Handle 'reset' by centering shapes, etc.

Use var, not const/let.`,
    systemPrompt: SYSTEM,
    schema: SCHEMA,
    model: 'haiku',
    budgetUsd: 0.10,
  });

  const { inputCode, eventHandlers } = result.data;

  const syntax = jsSyntax.checkBalance(inputCode);
  if (syntax.length > 0) throw new Error(`Wiring syntax error: ${syntax.join('; ')}`);

  console.log('[WIRING] OK');
  return { inputCode, eventHandlers: eventHandlers || '', cost: result.cost };
}

module.exports = wiring;
