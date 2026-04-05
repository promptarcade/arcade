#!/usr/bin/env node
// ============================================================
// Training Loop — diverse domains, diagnostic capture
// ============================================================
// Runs the v4 pipeline across varied request types.
// Memory accumulates across runs. Measures improvement.
//
// Usage: node pipeline/v4/train.js [--clean]

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const memory = require('./memory');

// Diverse domains — the pipeline must handle ANY input
const PRODUCTS = [
  'Pong',                                          // gaming baseline
  'Breakout',                                      // gaming complex
  'A bouncing ball simulation',                    // physics
  'A calculator',                                  // math/utility
  'A timer counting down from 60',                 // simple interactive
  'A particle fountain',                           // visual/simulation
  'A sorting algorithm visualizer',                // CS/algorithm
  'A mandelbrot set renderer',                     // mathematical
  'A quiz about world capitals',                   // knowledge/trivia
  'A meditation breathing guide',                  // wellness/philosophical
  'A music sequencer with 8 beats',                // audio/creative
  'Conway\'s Game of Life',                        // cellular automata
];

const RUNNER = path.join(__dirname, 'run.js');
const OUT_DIR = path.join(__dirname, 'output');

async function main() {
  const clean = process.argv.includes('--clean');

  console.log('='.repeat(60));
  console.log('TRAINING LOOP v4');
  console.log(`Products: ${PRODUCTS.length} diverse domains`);
  console.log('='.repeat(60));

  if (clean) {
    memory.clear();
    console.log('Memory cleared\n');
  } else {
    const stats = memory.getStats();
    console.log(`Resuming with memory: ${stats.atoms}a ${stats.decompositions}d ${stats.failures}f\n`);
  }

  const results = [];

  for (let i = 0; i < PRODUCTS.length; i++) {
    const product = PRODUCTS[i];
    const stats = memory.getStats();
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`RUN ${i + 1}/${PRODUCTS.length}: "${product}"`);
    console.log(`Memory: ${stats.atoms}a ${stats.decompositions}d ${stats.failures}f`);
    console.log('─'.repeat(60));

    const start = Date.now();
    let success = false;
    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    try {
      stdout = execSync(`node "${RUNNER}" "${product}"`, {
        encoding: 'utf8',
        timeout: 480_000, // 8 min — decompose can take 2 min + atoms + shapes
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env },
      });
      success = stdout.includes('v4 COMPLETE');
    } catch (e) {
      stdout = e.stdout || '';
      stderr = e.stderr || '';
      exitCode = e.status || -1;
      if (e.killed) stderr += ' [TIMEOUT]';
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    // Extract cost from output
    const costMatch = stdout.match(/Cost: \$([0-9.]+)/);
    const cost = costMatch ? parseFloat(costMatch[1]) : 0;

    // Extract last meaningful lines for diagnostics
    const lastLines = stdout.split('\n').filter(l => l.trim()).slice(-5).join('\n');

    // Copy output to named file
    const safeName = product.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    const src = path.join(OUT_DIR, 'index.html');
    if (success && fs.existsSync(src)) {
      const dest = path.join(OUT_DIR, `${safeName}-run${i + 1}.html`);
      fs.copyFileSync(src, dest);
    }

    const result = {
      run: i + 1,
      product,
      success,
      elapsed: parseFloat(elapsed),
      cost,
      memoryAtoms: stats.atoms,
      memoryDecomps: stats.decompositions,
      memoryFailures: stats.failures,
      lastOutput: lastLines.slice(0, 200),
      stderr: stderr.slice(0, 200),
    };
    results.push(result);

    const status = success ? 'OK' : 'FAIL';
    console.log(`\n  ${status} | ${elapsed}s | $${cost.toFixed(4)}`);
    if (!success) {
      console.log(`  Last output: ${lastLines.slice(0, 120)}`);
      if (stderr) console.log(`  Stderr: ${stderr.slice(0, 120)}`);
    }
  }

  // Final report
  const finalStats = memory.getStats();
  console.log('\n\n' + '='.repeat(60));
  console.log('TRAINING REPORT');
  console.log('='.repeat(60));
  console.log('Run | Product                        | Result  | Time   | Cost');
  console.log('----|--------------------------------|---------|--------|--------');
  for (const r of results) {
    const name = r.product.length > 30 ? r.product.slice(0, 27) + '...' : r.product.padEnd(30);
    console.log(`  ${r.run} | ${name} | ${r.success ? 'OK     ' : 'FAIL   '} | ${r.elapsed.toFixed(0).padStart(4)}s  | $${r.cost.toFixed(4)}`);
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`\nSuccess rate: ${successCount}/${results.length} (${(successCount / results.length * 100).toFixed(0)}%)`);
  console.log(`Final memory: ${finalStats.atoms} atoms, ${finalStats.decompositions} decompositions, ${finalStats.failures} failures`);

  const successes = results.filter(r => r.success);
  if (successes.length >= 2) {
    const avgTime = successes.reduce((s, r) => s + r.elapsed, 0) / successes.length;
    const avgCost = successes.reduce((s, r) => s + r.cost, 0) / successes.length;
    console.log(`Avg success: ${avgTime.toFixed(0)}s, $${avgCost.toFixed(4)}`);
  }

  // Failure analysis
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('\nFAILURE ANALYSIS:');
    for (const f of failures) {
      console.log(`  "${f.product}": ${f.lastOutput.split('\n').pop()}`);
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'training-results.json'), JSON.stringify(results, null, 2));
  console.log(`\nResults: ${OUT_DIR}/training-results.json`);
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
