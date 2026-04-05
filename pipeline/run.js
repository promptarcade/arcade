#!/usr/bin/env node
// ============================================================
// Blind Pipeline — Entry Point
// ============================================================
// Usage: node pipeline/run.js "your game request here"
//
// Runs the full blind pipeline: parse -> research -> entities
// -> sprites -> mechanics -> layout -> assemble -> output
//
// The result is written to pipeline/output/<title>/index.html

const fs = require('fs');
const path = require('path');
const { run } = require('./orchestrator');

const request = process.argv[2];
if (!request) {
  console.log('Usage: node pipeline/run.js "your request here"');
  console.log('Example: node pipeline/run.js "a tower defense where you place turrets to stop waves of bugs"');
  process.exit(1);
}

(async () => {
  try {
    const result = await run(request);

    // Write output
    const safeName = result.spec.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const outDir = path.join(__dirname, 'output', safeName);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), result.html);

    // Write metadata
    const meta = {
      request,
      spec: result.spec,
      benchmarks: result.benchmarks,
      entityCount: result.entities.length,
      spriteCount: result.sprites.length,
      mechanicCount: result.mechanics.length,
      cost: result.cost,
      elapsed: result.elapsed,
      timestamp: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2));

    console.log(`\nOutput written to: ${outDir}/index.html`);
    console.log(`Metadata written to: ${outDir}/meta.json`);

  } catch (err) {
    console.error('\nPIPELINE FAILED:', err.message);
    process.exit(1);
  }
})();
