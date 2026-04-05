// ============================================================
// Recomposer — intelligent assembler that doesn't know the goal
// ============================================================
// Receives:
//   - A wiring map (opaque IDs, execution order, events)
//   - Validated function code (fn_1, fn_2, ... with argNames)
//   - Shape sprites (rendered canvas elements)
//
// Tries to build a working HTML product by interpreting the map.
// If pieces don't fit, returns structured rejection (through validator,
// never directly to atomics or decomposer).
//
// The recomposer can:
//   - Generate glue code to connect pieces
//   - Infer coherence from the pieces
//   - Reject if pieces don't form a working system
//
// The recomposer cannot:
//   - See the original user request
//   - Communicate with the decomposer
//   - Communicate with atomics (rejections go through validator)

const { callClaudeAsync } = require('../claude-worker');

async function recompose({ map, functions, sprites, engineCode }) {
  // Build a description of what we have — all opaque IDs
  const fnList = functions.map(f =>
    `${f.fn_id}(${f.argNames.join(', ')}): ${f.code}`
  ).join('\n\n');

  const objList = map.objects.map(o =>
    `${o.id}: shape=${o.shape}, position=(${o.x}, ${o.y}), size=${o.w}x${o.h}, props=${JSON.stringify(o.props)}`
  ).join('\n');

  const loopSteps = JSON.stringify(map.loop, null, 2);
  const events = JSON.stringify(map.events, null, 2);
  const resetDefs = JSON.stringify(map.reset, null, 2);
  const display = JSON.stringify(map.display, null, 2);
  const inputMap = JSON.stringify(map.input, null, 2);
  const counters = (map.counters || []).join(', ');

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await callClaudeAsync({
        prompt: `You have a set of validated functions and a wiring map. Build a single working HTML page that uses them.

## Available Functions
${fnList}

## Objects
${objList}

## Input Bindings
${inputMap}

## Counters
${counters}

## Loop Steps (execute each frame in this order)
${loopSteps}

## Events (check after loop)
${events}

## Reset Definitions
${resetDefs}

## Display Config
${display}

## Sprites
${sprites.length} pre-rendered sprite canvases are available as variables: ${sprites.map(s => s.varName).join(', ')}
Each object's shape field maps to a sprite: ${map.objects.map(o => `${o.id}.shape = ${o.shape}`).join(', ')}
Sprite mapping: ${sprites.map(s => `${s.shapeId} → ${s.varName}`).join(', ')}

## Requirements
1. Build a complete HTML page with a full-screen canvas
2. Declare all functions using the EXACT code provided (do not modify function code)
3. Create objects with the specified initial positions and properties
4. Each frame: clear canvas, execute loop steps in order, check events, draw objects using their sprites
5. Handle keyboard input according to input bindings
6. "S" is a scale factor: Math.min(W,H)/600
7. Percentage positions (e.g., "5%") mean percentage of canvas width/height
8. Object dimensions are base sizes — multiply by S for display
9. Include touch support for mobile
10. Add display elements (counters, hint text, center line) per display config

Output a single "html" field containing the complete HTML page.
If any function or wiring reference is broken, output a "rejection" field instead with an object: { fn_id: "the broken function", reason: "structural description" }.`,

        systemPrompt: 'You are a system assembler. You receive pre-built components and a wiring specification. Build a working product from them. Do not speculate about the purpose or domain of the product. Output only JSON with either an "html" field or a "rejection" field.',
        schema: {
          type: 'object',
          properties: {
            html: { type: 'string' },
            rejection: {
              type: 'object',
              properties: {
                fn_id: { type: 'string' },
                reason: { type: 'string' },
              },
            },
          },
        },
        model: 'sonnet', budgetUsd: 0.50,
      });

      if (r.data.rejection) {
        return {
          success: false,
          rejection: r.data.rejection,
          cost: r.cost,
        };
      }

      if (r.data.html && r.data.html.length > 100) {
        return {
          success: true,
          html: r.data.html,
          cost: r.cost,
        };
      }

      console.log(`    Recomposer: attempt ${attempt} — output too short`);
    } catch (e) {
      console.log(`    Recomposer: attempt ${attempt} error — ${e.message.slice(0, 100)}`);
    }
  }

  return {
    success: false,
    rejection: { fn_id: 'recomposer', reason: 'failed to produce output after 3 attempts' },
    cost: 0,
  };
}

module.exports = { recompose };
