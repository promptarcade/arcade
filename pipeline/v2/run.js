#!/usr/bin/env node
// ============================================================
// Blind Pipeline v2 — Entry Point
// ============================================================
// Usage: node pipeline/v2/run.js "your request here"

const fs = require('fs');
const path = require('path');
const { run } = require('./orchestrator');

const request = process.argv[2];
if (!request) {
  console.log('Usage: node pipeline/v2/run.js "your request here"');
  process.exit(1);
}

(async () => {
  try {
    const result = await run(request);

    const safeName = result.spec.title
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const outDir = path.join(__dirname, 'output', safeName);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), result.html);
    fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify({
      request,
      spec: result.spec,
      cost: result.cost,
      elapsed: result.elapsed,
      timestamp: new Date().toISOString(),
    }, null, 2));

    console.log(`\nOutput: ${outDir}/index.html`);
  } catch (err) {
    console.error('\nPIPELINE FAILED:', err.message);
    process.exit(1);
  }
})();
