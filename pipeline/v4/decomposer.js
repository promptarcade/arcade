// ============================================================
// Decomposer — AI component that sees the goal
// ============================================================
// Receives any user request. Produces:
//   1. Atomic contracts (opaque fn_ids, test vectors, prompts)
//   2. A wiring map (opaque obj/fn IDs, execution order, events)
//   3. Shape specs (opaque shape IDs, geometric descriptions)
//
// The decomposer knows the goal but can't build the product.
// It can learn from structural failures (atomics rejecting,
// recomposer rejecting) — that's safe because it's learning
// "my decomposition was wrong," not gaming a reward.
//
// All outputs use opaque IDs. The decomposer's private
// understanding of what each ID means stays internal.
//
// Uses free-form JSON (no schema constraint) for speed.
// Structured output with deeply nested schemas causes
// constrained decoding timeouts on complex products.

const { callClaudeAsync } = require('../claude-worker');
const memory = require('./memory');

const MAX_DECOMPOSE_RETRIES = 2;

async function decompose(request, failures) {
  for (let retry = 1; retry <= MAX_DECOMPOSE_RETRIES; retry++) {
    try {
      return await _decompose(request, failures);
    } catch (e) {
      console.log(`  Decompose attempt ${retry}/${MAX_DECOMPOSE_RETRIES} failed: ${e.message.slice(0, 80)}`);
      if (retry === MAX_DECOMPOSE_RETRIES) throw e;
    }
  }
}

async function _decompose(request, failures) {
  const t0 = Date.now();
  const failureContext = failures && failures.length > 0
    ? `\n\nPREVIOUS ATTEMPT FAILED. These contracts produced errors:\n${failures.map(f => `- ${f.fn_id}: ${f.reason}`).join('\n')}\nFix these issues in your new decomposition.\n`
    : '';
  const decomposeExamples = memory.getDecomposeExamples();
  const failurePatterns = memory.getFailurePatterns();

  const r = await callClaudeAsync({
    prompt: `Decompose this product request into atomic components.

REQUEST: "${request}"
${failureContext}
Produce a JSON object with THREE keys: "contracts", "shapes", "map".

## 1. CONTRACTS
An array of atomic function contracts. Each function must be TINY — one operation only.
Good: "clamp a value to a range", "add A*B to C", "return true if X < Y"
Bad: "implement bounce physics", "handle player input", "manage collision"

Each contract needs:
- fn_id: opaque identifier (fn_1, fn_2, fn_3, ...)
- prompt: instruction for a blind code generator. The prompt MUST name the arguments EXACTLY as listed in argNames. Example: if argNames is ["val", "min", "max"], the prompt must say "Arguments: val, min, max" — not "Arguments: value, minimum, maximum" or any other names. The cell's code will be wrapped as function(val, min, max){...} so it MUST use these exact names.
- argNames: array of short, lowercase generic argument names (e.g., ["val", "min", "max"], ["obj", "dt"], ["a", "b"])
- returnType: "number", "string", "boolean", "object", "array", or "any"
- testVectors: array of {inputs: [...], expected: value} or {inputs: [...], expectMutations: {"prop": value}} — at least 3 per contract. The inputs array must have one value per argument, in the same order as argNames.

## 2. SHAPES
Array of visual elements needed:
- shape_id: opaque (shape_1, shape_2, ...)
- desc: geometric description ("filled vertical rectangle", "filled circle" — no domain words)
- w, h: pixel dimensions (8-64)
- colors: {base, light, dark, accent} as hex strings

## 3. MAP
A wiring specification that tells the recomposer how to connect everything:
- objects: array of {id: "obj_a", shape: "shape_1", x: "50%", y: "50%", w: number, h: number, props: {vx:0, vy:0, ...}}
- input: key bindings {up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight"}
- counters: array of counter names ["counter_a", "counter_b"]
- loop: array of steps executed each frame, in order. Each step is:
  - {call: "fn_id", args: ["obj_a.x", "dt", ...]} — call function with args
  - {call: "fn_id", target: "obj_a.y", args: [...]} — call function, assign return to target
  - {call: "fn_id", test: true, args: [...], onTrue: {call: "fn_id2", args: [...]}} — conditional
  - {call: "fn_id", args: [...], store: "varName"} — store return value
  - {call: "fn_id", test: true, args: [...], onTrue: [{call: ...}, {call: ...}]} — conditional with multiple actions
- events: array of {when: "js condition expression", do: [{set: "prop", value: expr}, {reset: "obj_id"}, {increment: "counter_name"}, {call: "fn_id", args: [...]}]}
- reset: object mapping obj_ids to their reset property values
- display: visual config {background: "#hex", counters: {color, font, y}, hint: {text, color, y}, centerLine: {color, width, dash}}

CRITICAL RULES:
- Every fn_id in the map MUST have a matching contract
- Functions must be ATOMIC — one simple operation each. If you can split it, split it.
- Use ONLY opaque identifiers (fn_1, obj_a, shape_1) — no domain words anywhere
- Test vectors must have concrete values that fully verify the function
- Prefer more small functions over fewer large ones
- Each function should be so small that a blind code generator can't infer what system it's part of
- Keep total loop steps under 30 — combine related operations into fewer steps
${decomposeExamples}${failurePatterns}

Output ONLY the JSON object. No markdown fences. No explanation.`,

    systemPrompt: `You are a product decomposer. You break requests into atomic components with opaque identifiers. Output ONLY a single valid JSON object with keys "contracts", "shapes", "map". No markdown, no explanation, no code fences. Never use domain-specific names — use generic terms and opaque IDs.`,

    model: 'haiku', budgetUsd: 0.50,
  });

  console.log(`  Decompose call: ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // Parse the response — may be raw JSON or wrapped in fences
  let data = r.data;
  if (typeof data === 'string') {
    const cleaned = data.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    data = JSON.parse(cleaned);
  }

  if (!data.contracts || !data.shapes || !data.map) {
    throw new Error('Decomposer output missing required keys (contracts, shapes, map)');
  }

  return { contracts: data.contracts, shapes: data.shapes, map: data.map, cost: r.cost };
}

// ============================================================
// splitAtom — decomposer splits a flagged atom into smaller ones
// ============================================================

async function splitAtom(fn_id, contracts, map) {
  const contract = contracts.find(c => c.fn_id === fn_id);
  if (!contract) return null;

  const mapRefs = (map.loop || []).filter(step =>
    step.call === fn_id || (step.onTrue && step.onTrue.call === fn_id)
  );

  const r = await callClaudeAsync({
    prompt: `Split this atomic function into smaller pieces.

CURRENT CONTRACT:
${JSON.stringify(contract, null, 2)}

MAP REFERENCES (how this function is called):
${JSON.stringify(mapRefs, null, 2)}

Split into 2-3 smaller functions where each does only ONE thing.

Rules:
- Each new function must be simpler than the original
- New fn_ids should be "${fn_id}a", "${fn_id}b", etc.
- Each needs its own test vectors (at least 2)
- Provide map updates: for each old map reference, show the replacement sequence
- Use only generic argument names and opaque IDs

Output ONLY a JSON object with:
- newContracts: array of new contract objects
- mapUpdates: array of {replaceIndex: number, with: [new steps]}

No markdown fences. No explanation.`,

    systemPrompt: 'You are a function splitter. Output ONLY valid JSON. No markdown, no explanation.',
    model: 'haiku', budgetUsd: 0.20,
  });

  let data = r.data;
  if (typeof data === 'string') {
    const cleaned = data.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    data = JSON.parse(cleaned);
  }

  if (!data.newContracts || data.newContracts.length === 0) return null;

  const newContracts = contracts.filter(c => c.fn_id !== fn_id);
  newContracts.push(...data.newContracts);

  const newMap = JSON.parse(JSON.stringify(map));
  if (data.mapUpdates) {
    const sorted = data.mapUpdates.sort((a, b) => b.replaceIndex - a.replaceIndex);
    for (const update of sorted) {
      if (typeof update.replaceIndex === 'number' && Array.isArray(update.with)) {
        newMap.loop.splice(update.replaceIndex, 1, ...update.with);
      }
    }
  }

  return { contracts: newContracts, map: newMap, cost: r.cost };
}

module.exports = { decompose, splitAtom };
