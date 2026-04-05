// ============================================================
// Orchestrator — dumb sequential step runner, ZERO AI
// ============================================================
// Chains pipeline steps in order. Each step either produces a
// valid artifact or throws. No intelligence, no decisions.
// Sprites and mechanics run in PARALLEL for speed.

const parse = require('./workers/parse');
const research = require('./workers/research');
const entities = require('./workers/entities');
const sprite = require('./workers/sprite');
const mechanic = require('./workers/mechanics');
const layout = require('./workers/layout');
const { assemble } = require('./assembler');

async function run(rawRequest) {
  const startTime = Date.now();
  let totalCost = 0;

  console.log('='.repeat(60));
  console.log('BLIND PIPELINE — starting');
  console.log('Request: "' + rawRequest.slice(0, 80) + '"');
  console.log('='.repeat(60));

  // Step 1: Parse
  console.log('\n--- STEP 1/7: PARSE ---');
  const parseResult = await parse(rawRequest);
  const spec = parseResult.spec;
  totalCost += parseResult.cost;

  // Step 2: Research (triple-blind)
  console.log('\n--- STEP 2/7: RESEARCH (triple-blind) ---');
  const researchResult = await research(spec.genre, spec.coreLoop);
  const benchmarks = researchResult.benchmarks;
  totalCost += researchResult.cost;

  // Step 3: Entities
  console.log('\n--- STEP 3/7: ENTITIES ---');
  const entityResult = await entities(spec, benchmarks);
  const entityManifest = entityResult.entities;
  totalCost += entityResult.cost;

  // Step 4 + 5: Sprites AND Mechanics IN PARALLEL
  console.log('\n--- STEP 4+5/7: SPRITES + MECHANICS (parallel) ---');
  const entityNames = entityManifest.map(e => e.name);

  const spritePromises = entityManifest.map(e => sprite(e));
  const mechanicPromises = spec.coreLoop.map(m => mechanic(m, entityNames, benchmarks));

  const [spriteResults, mechanicResults] = await Promise.all([
    Promise.all(spritePromises),
    Promise.all(mechanicPromises),
  ]);

  for (const s of spriteResults) totalCost += s.cost;
  for (const m of mechanicResults) totalCost += m.cost;

  console.log(`  Sprites: ${spriteResults.length} OK, Mechanics: ${mechanicResults.length} OK`);

  // Step 6: Layout
  console.log('\n--- STEP 6/7: LAYOUT ---');
  const layoutResult = await layout(entityManifest, mechanicResults, spec.controls);
  totalCost += layoutResult.cost;

  // Step 7: Assembly (dumb code, zero AI)
  console.log('\n--- STEP 7/7: ASSEMBLY ---');
  const html = assemble({
    title: spec.title,
    sprites: spriteResults,
    mechanics: mechanicResults,
    layout: layoutResult,
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('BLIND PIPELINE — complete');
  console.log(`  Time: ${elapsed}s`);
  console.log(`  Cost: $${totalCost.toFixed(4)}`);
  console.log(`  Entities: ${entityManifest.length}`);
  console.log(`  Sprites: ${spriteResults.length}`);
  console.log(`  Mechanics: ${mechanicResults.length}`);
  console.log(`  HTML size: ${(html.length / 1024).toFixed(1)}KB`);
  console.log('='.repeat(60));

  return {
    html,
    spec,
    benchmarks,
    entities: entityManifest,
    sprites: spriteResults,
    mechanics: mechanicResults,
    cost: totalCost,
    elapsed,
  };
}

module.exports = { run };
