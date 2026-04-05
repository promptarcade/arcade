// ============================================================
// v2 Orchestrator — truly blind pipeline
// ============================================================

const decompose = require('./workers/decompose');
const palette = require('./workers/palette');
const shape = require('./workers/shape');
const behavior = require('./workers/behavior');
const wiring = require('./workers/wiring');
const { assemble } = require('./assembler');

async function run(rawRequest) {
  const startTime = Date.now();
  let totalCost = 0;

  console.log('='.repeat(60));
  console.log('BLIND PIPELINE v2');
  console.log('Request: "' + rawRequest.slice(0, 80) + '"');
  console.log('='.repeat(60));

  // Step 1: Decompose request into abstract components
  console.log('\n--- DECOMPOSE ---');
  const { spec, cost: decomposeCost } = decompose(rawRequest);
  totalCost += decomposeCost;

  const shapeIds = spec.shapes.map(s => s.id);

  // Step 2+3+4: Palettes, Shapes, Behaviors ALL IN PARALLEL
  console.log('\n--- PARALLEL: PALETTES + SHAPES + BEHAVIORS ---');

  // Palettes first (needed by shapes)
  const paletteResults = await Promise.all(
    spec.shapes.map(s => palette(s.theme).then(r => ({ id: s.id, ...r })))
  );
  for (const p of paletteResults) totalCost += p.cost;
  console.log(`  Palettes: ${paletteResults.length} OK`);

  // Map palette colors to shapes
  const colorMap = {};
  for (const p of paletteResults) colorMap[p.id] = p.colors;

  // Shapes and behaviors in parallel
  const [shapeResults, behaviorResults] = await Promise.all([
    Promise.all(spec.shapes.map(s => shape(s, colorMap[s.id]))),
    Promise.all(spec.behaviors.map(b => behavior(b, shapeIds))),
  ]);

  for (const s of shapeResults) totalCost += s.cost;
  for (const b of behaviorResults) totalCost += b.cost;
  console.log(`  Shapes: ${shapeResults.length} OK, Behaviors: ${behaviorResults.length} OK`);

  // Step 5: Wiring
  console.log('\n--- WIRING ---');
  const wiringResult = wiring(spec.inputs, shapeIds);
  totalCost += wiringResult.cost;

  // Step 6: Assembly
  console.log('\n--- ASSEMBLY ---');
  const html = assemble({
    title: spec.title,
    shapes: shapeResults,
    behaviors: behaviorResults,
    wiring: wiringResult,
    layout: spec.layout,
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('BLIND PIPELINE v2 — complete');
  console.log(`  Time: ${elapsed}s`);
  console.log(`  Cost: $${totalCost.toFixed(4)}`);
  console.log(`  Shapes: ${shapeResults.length}`);
  console.log(`  Behaviors: ${behaviorResults.length}`);
  console.log(`  HTML size: ${(html.length / 1024).toFixed(1)}KB`);
  console.log('='.repeat(60));

  return { html, spec, cost: totalCost, elapsed };
}

module.exports = { run };
