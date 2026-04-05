#!/usr/bin/env node
// ============================================================
// Sprite Verify — QA verification for rendered sprites
// ============================================================
//
// USAGE:
//   node tools/sprite-verify.js <png-path> --expect <entity-type> [--name <name>] [--style <style>] [--features <f1,f2,...>]
//
// Examples:
//   node tools/sprite-verify.js engine/sprites/verify/static-fridge.png --expect prop --name fridge --features "door,handle,shelves"
//   node tools/sprite-verify.js engine/sprites/verify/char-warrior.png --expect character --name warrior --style illustrated
//   node tools/sprite-verify.js engine/sprites/verify/static-boots.png --expect prop --name boots --features "sole,heel,shaft"
//
// WHAT IT DOES:
//   1. Loads qa-knowledge.json and retrieves known issues for this entity type
//   2. Analyzes the rendered PNG for quality signals (programmatic checks)
//   3. Returns structured pass/fail with specific feedback
//   4. Logs results back to qa-knowledge.json
//   5. Runs maintenance pass on the knowledge base
//
// EXIT CODES:
//   0 = pass
//   1 = fail (with feedback)
//   2 = error

'use strict';

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const QA_PATH = path.join(__dirname, '..', 'engine', 'sprites', 'qa-knowledge.json');

// ============================================================
// CLI PARSING
// ============================================================

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help') {
  console.log('Usage: sprite-verify.js <png-path> --expect <type> [--name <name>] [--style <style>] [--features <f1,f2,...>]');
  console.log('Types: character, creature, prop, terrain, effect');
  process.exit(0);
}

const pngPath = path.resolve(args[0]);
function getFlag(name, fallback) {
  const idx = args.indexOf('--' + name);
  if (idx === -1) return fallback;
  return args[idx + 1] || fallback;
}

const entityType = getFlag('expect', 'prop');
const entityName = getFlag('name', path.basename(pngPath, '.png'));
const styleTier = getFlag('style', 'chibi');
const expectedFeatures = (getFlag('features', '') || '').split(',').filter(Boolean);

// ============================================================
// QA KNOWLEDGE BASE
// ============================================================

function loadKnowledge() {
  if (!fs.existsSync(QA_PATH)) {
    return {
      principles: [],
      categories: {
        characters: [],
        props: [],
        creatures: [],
        terrain: [],
        effects: [],
      },
      _meta: { entryCount: 0, lastMaintenance: null },
    };
  }
  return JSON.parse(fs.readFileSync(QA_PATH, 'utf8'));
}

function saveKnowledge(kb) {
  kb._meta.entryCount = countEntries(kb);
  fs.writeFileSync(QA_PATH, JSON.stringify(kb, null, 2));
}

function countEntries(kb) {
  let count = kb.principles.length;
  for (const cat of Object.values(kb.categories)) {
    count += cat.length;
  }
  return count;
}

function getCategoryKey(entityType) {
  const map = {
    character: 'characters',
    creature: 'creatures',
    prop: 'props',
    terrain: 'terrain',
    effect: 'effects',
  };
  return map[entityType] || 'props';
}

function getRelevantKnowledge(kb, entityType) {
  const catKey = getCategoryKey(entityType);
  return {
    principles: kb.principles || [],
    specific: (kb.categories[catKey] || []),
  };
}

// ============================================================
// IMAGE ANALYSIS
// ============================================================

async function analyzeImage(imgPath) {
  const img = await loadImage(imgPath);

  // The verification PNGs include an 8x zoomed view on the left and
  // game-scale previews on the right. We analyze the full image.
  const cvs = createCanvas(img.width, img.height);
  const ctx = cvs.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imgData.data;
  const w = img.width;
  const h = img.height;

  const results = {
    totalPixels: w * h,
    filledPixels: 0,
    uniqueColors: new Set(),
    colorCounts: {},
    hasTransparency: false,
    boundingBox: { minX: w, minY: h, maxX: 0, maxY: 0 },
    edgePixels: 0,
    interiorPixels: 0,
    symmetryScore: 0,
    colorVariety: 0,
    fillRatio: 0,
    aspectRatio: w / h,
    width: w,
    height: h,
  };

  // Background color detection (top-left corner)
  const bgR = data[0], bgG = data[1], bgB = data[2], bgA = data[3];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];

      // Skip background pixels
      if (r === bgR && g === bgG && b === bgB) continue;
      if (a < 128) { results.hasTransparency = true; continue; }

      results.filledPixels++;
      const colorKey = `${r},${g},${b}`;
      results.uniqueColors.add(colorKey);
      results.colorCounts[colorKey] = (results.colorCounts[colorKey] || 0) + 1;

      if (x < results.boundingBox.minX) results.boundingBox.minX = x;
      if (x > results.boundingBox.maxX) results.boundingBox.maxX = x;
      if (y < results.boundingBox.minY) results.boundingBox.minY = y;
      if (y > results.boundingBox.maxY) results.boundingBox.maxY = y;

      // Edge detection — check if adjacent to background/transparent
      let isEdge = false;
      for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) { isEdge = true; break; }
        const ni = (ny * w + nx) * 4;
        if (data[ni + 3] < 128 || (data[ni] === bgR && data[ni+1] === bgG && data[ni+2] === bgB)) {
          isEdge = true; break;
        }
      }
      if (isEdge) results.edgePixels++;
      else results.interiorPixels++;
    }
  }

  results.colorVariety = results.uniqueColors.size;
  results.fillRatio = results.filledPixels / results.totalPixels;

  // Shading analysis — check if colors vary (not flat)
  const colorArray = Array.from(results.uniqueColors).map(c => {
    const [r, g, b] = c.split(',').map(Number);
    return { r, g, b, count: results.colorCounts[c] };
  });
  colorArray.sort((a, b) => b.count - a.count);
  results.topColors = colorArray.slice(0, 20);

  // Check for shading gradient — do we have light and dark variants of the same hue?
  results.hasShadingVariation = checkShadingVariation(colorArray);

  // Outline detection — look for very dark edge pixels
  results.hasOutlines = checkOutlines(data, w, h, bgR, bgG, bgB);

  return results;
}

function checkShadingVariation(colorArray) {
  if (colorArray.length < 4) return false;

  // Group colors by approximate hue, check if each group has light/dark variants
  const hueGroups = {};
  for (const c of colorArray) {
    const hue = approximateHue(c.r, c.g, c.b);
    const lum = (c.r * 0.299 + c.g * 0.587 + c.b * 0.114) / 255;
    if (!hueGroups[hue]) hueGroups[hue] = [];
    hueGroups[hue].push(lum);
  }

  let groupsWithVariation = 0;
  for (const lums of Object.values(hueGroups)) {
    if (lums.length >= 2) {
      const range = Math.max(...lums) - Math.min(...lums);
      if (range > 0.15) groupsWithVariation++;
    }
  }

  return groupsWithVariation >= 1;
}

function approximateHue(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 20) return 'gray';
  if (r >= g && r >= b) return g > b ? 'yellow-red' : 'red-magenta';
  if (g >= r && g >= b) return r > b ? 'yellow-green' : 'green-cyan';
  return r > g ? 'magenta-blue' : 'cyan-blue';
}

function checkOutlines(data, w, h, bgR, bgG, bgB) {
  let darkEdgeCount = 0;
  let totalEdges = 0;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 128) continue;
      if (r === bgR && g === bgG && b === bgB) continue;

      // Check if this pixel borders background/transparent
      let bordersEmpty = false;
      for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const ni = ((y + dy) * w + (x + dx)) * 4;
        if (data[ni + 3] < 128 || (data[ni] === bgR && data[ni+1] === bgG && data[ni+2] === bgB)) {
          bordersEmpty = true; break;
        }
      }

      if (bordersEmpty) {
        totalEdges++;
        const lum = r * 0.299 + g * 0.587 + b * 0.114;
        if (lum < 80) darkEdgeCount++;
      }
    }
  }

  return totalEdges > 0 ? (darkEdgeCount / totalEdges) > 0.3 : false;
}

// ============================================================
// QUALITY CHECKS
// ============================================================

function runChecks(analysis, entityType, entityName, styleTier, expectedFeatures, knowledge) {
  const issues = [];
  const passes = [];

  // --- Principle checks (from knowledge base) ---
  for (const principle of knowledge.principles) {
    // Principles are advisory — logged but not auto-checked
    // They guide the drawing agent, not the verifier
  }

  // --- Color variety check ---
  const minColors = { pixel: 4, chibi: 8, illustrated: 15, hd: 25 };
  const minExpected = minColors[styleTier] || 8;
  if (analysis.colorVariety < minExpected) {
    issues.push({
      check: 'color-variety',
      message: `Only ${analysis.colorVariety} unique colors — expected at least ${minExpected} for ${styleTier} style. Sprite may look flat.`,
      severity: 'warning',
    });
  } else {
    passes.push({ check: 'color-variety', message: `${analysis.colorVariety} colors — good variety for ${styleTier}` });
  }

  // --- Shading variation check ---
  if (!analysis.hasShadingVariation) {
    issues.push({
      check: 'shading',
      message: 'No shading variation detected — sprite appears flat. Ensure PostProcess.applyShading() is running and shapes have exposed edges for normal computation.',
      severity: 'error',
    });
  } else {
    passes.push({ check: 'shading', message: 'Shading variation detected — 3D form reads' });
  }

  // --- Outline check ---
  if (!analysis.hasOutlines) {
    issues.push({
      check: 'outlines',
      message: 'No dark outlines detected at sprite edges. Outlines help define silhouette.',
      severity: 'warning',
    });
  } else {
    passes.push({ check: 'outlines', message: 'Outlines present at sprite boundary' });
  }

  // --- Fill ratio check ---
  // The verification PNGs include zoomed + preview panels, so filled ratio will be lower
  // A completely empty sprite or one that fills almost nothing is suspect
  if (analysis.filledPixels < 100) {
    issues.push({
      check: 'fill-ratio',
      message: `Very few filled pixels (${analysis.filledPixels}) — sprite may be too small or empty.`,
      severity: 'error',
    });
  } else {
    passes.push({ check: 'fill-ratio', message: `${analysis.filledPixels} filled pixels — reasonable density` });
  }

  // --- Bounding box aspect ratio check for known entity types ---
  const bb = analysis.boundingBox;
  const bbW = bb.maxX - bb.minX + 1;
  const bbH = bb.maxY - bb.minY + 1;
  if (bbW > 0 && bbH > 0) {
    const bbAspect = bbW / bbH;
    if (entityType === 'character' && bbAspect > 2) {
      issues.push({
        check: 'aspect-ratio',
        message: `Character sprite is wider than tall (${bbW}x${bbH}) — characters should generally be portrait-oriented.`,
        severity: 'warning',
      });
    }
  }

  // --- Known issues check from knowledge base ---
  for (const entry of knowledge.specific) {
    if (entry.entity === entityName || entry.entity === entityType) {
      issues.push({
        check: 'known-issue',
        message: `Previously identified: ${entry.issue} — Fix: ${entry.fix}`,
        severity: 'advisory',
      });
    }
  }

  const passed = issues.filter(i => i.severity === 'error').length === 0;

  return {
    passed,
    entity: entityName,
    type: entityType,
    style: styleTier,
    issues,
    passes,
    stats: {
      colors: analysis.colorVariety,
      filledPixels: analysis.filledPixels,
      hasShadingVariation: analysis.hasShadingVariation,
      hasOutlines: analysis.hasOutlines,
    },
  };
}

// ============================================================
// KNOWLEDGE BASE MAINTENANCE
// ============================================================

function addFinding(kb, entityType, entityName, issue, fix, styleTier) {
  const catKey = getCategoryKey(entityType);
  if (!kb.categories[catKey]) kb.categories[catKey] = [];

  const category = kb.categories[catKey];

  // Check for near-duplicate before adding
  const isDuplicate = category.some(entry =>
    entry.entity === entityName &&
    similarText(entry.issue, issue) > 0.7
  );

  if (!isDuplicate) {
    category.push({
      entity: entityName,
      issue,
      fix: fix || null,
      style: styleTier,
      added: new Date().toISOString().split('T')[0],
      hitCount: 1,
    });
  } else {
    // Increment hit count on existing entry
    const existing = category.find(entry =>
      entry.entity === entityName &&
      similarText(entry.issue, issue) > 0.7
    );
    if (existing) existing.hitCount = (existing.hitCount || 1) + 1;
  }
}

function runMaintenance(kb) {
  const MAX_ENTRIES = 200;

  // 1. Merge near-duplicate issues within each category
  for (const [catName, entries] of Object.entries(kb.categories)) {
    const merged = [];
    const used = new Set();

    for (let i = 0; i < entries.length; i++) {
      if (used.has(i)) continue;
      const entry = { ...entries[i] };

      for (let j = i + 1; j < entries.length; j++) {
        if (used.has(j)) continue;
        if (similarText(entry.issue, entries[j].issue) > 0.7) {
          // Merge: keep the more specific entity name, combine hit counts
          entry.hitCount = (entry.hitCount || 1) + (entries[j].hitCount || 1);
          if (entry.entity === catName && entries[j].entity !== catName) {
            entry.entity = entries[j].entity;
          }
          if (!entry.fix && entries[j].fix) entry.fix = entries[j].fix;
          used.add(j);
        }
      }

      merged.push(entry);
    }

    kb.categories[catName] = merged;
  }

  // 2. Promote frequently-hit category issues to principles
  for (const [catName, entries] of Object.entries(kb.categories)) {
    const toPromote = [];
    for (let i = entries.length - 1; i >= 0; i--) {
      if ((entries[i].hitCount || 1) >= 5) {
        const existing = kb.principles.find(p => similarText(p.issue, entries[i].issue) > 0.7);
        if (!existing) {
          toPromote.push({
            issue: entries[i].issue,
            fix: entries[i].fix,
            promotedFrom: catName,
            hitCount: entries[i].hitCount,
            promoted: new Date().toISOString().split('T')[0],
          });
        }
        entries.splice(i, 1);
      }
    }
    kb.principles.push(...toPromote);
  }

  // 3. Cap total entries — remove oldest low-hitcount entries first
  let total = countEntries(kb);
  if (total > MAX_ENTRIES) {
    const allEntries = [];
    for (const [catName, entries] of Object.entries(kb.categories)) {
      entries.forEach((e, i) => allEntries.push({ catName, index: i, entry: e }));
    }
    allEntries.sort((a, b) => (a.entry.hitCount || 1) - (b.entry.hitCount || 1));

    let toRemove = total - MAX_ENTRIES;
    for (const item of allEntries) {
      if (toRemove <= 0) break;
      kb.categories[item.catName] = kb.categories[item.catName].filter((_, i) => i !== item.index);
      toRemove--;
    }
  }

  kb._meta.lastMaintenance = new Date().toISOString();
}

function similarText(a, b) {
  if (!a || !b) return 0;
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  if (a === b) return 1;

  // Simple word overlap similarity
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  const total = Math.max(wordsA.size, wordsB.size);
  return total > 0 ? overlap / total : 0;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  if (!fs.existsSync(pngPath)) {
    console.error('File not found: ' + pngPath);
    process.exit(2);
  }

  // Load knowledge base
  const kb = loadKnowledge();
  const knowledge = getRelevantKnowledge(kb, entityType);

  // Print prior knowledge for this entity type
  if (knowledge.principles.length > 0 || knowledge.specific.length > 0) {
    console.log('\n--- Prior Knowledge ---');
    if (knowledge.principles.length > 0) {
      console.log('Principles:');
      knowledge.principles.forEach(p => console.log('  * ' + p.issue));
    }
    if (knowledge.specific.length > 0) {
      console.log('Known issues for ' + entityType + ':');
      knowledge.specific.forEach(e => console.log('  * [' + e.entity + '] ' + e.issue));
    }
    console.log('');
  }

  // Analyze image
  console.log('Analyzing: ' + path.basename(pngPath));
  const analysis = await analyzeImage(pngPath);

  // Run checks
  const result = runChecks(analysis, entityType, entityName, styleTier, expectedFeatures, knowledge);

  // Output results
  console.log('\n--- Verification Result ---');
  console.log('Entity: ' + result.entity + ' (' + result.type + ')');
  console.log('Style:  ' + result.style);
  console.log('Status: ' + (result.passed ? 'PASS' : 'FAIL'));
  console.log('');

  if (result.passes.length > 0) {
    console.log('Passed:');
    result.passes.forEach(p => console.log('  [OK] ' + p.message));
  }

  if (result.issues.length > 0) {
    console.log('Issues:');
    result.issues.forEach(i => {
      const icon = i.severity === 'error' ? 'FAIL' : i.severity === 'warning' ? 'WARN' : 'NOTE';
      console.log('  [' + icon + '] ' + i.message);
    });
  }

  // Log findings to knowledge base
  const errors = result.issues.filter(i => i.severity === 'error');
  const warnings = result.issues.filter(i => i.severity === 'warning');
  for (const issue of [...errors, ...warnings]) {
    if (issue.check !== 'known-issue') {
      addFinding(kb, entityType, entityName, issue.message, null, styleTier);
    }
  }

  // Run maintenance and save
  runMaintenance(kb);
  saveKnowledge(kb);

  // Output machine-readable summary
  console.log('\n--- JSON ---');
  console.log(JSON.stringify({
    passed: result.passed,
    entity: result.entity,
    type: result.type,
    errorCount: errors.length,
    warningCount: warnings.length,
    stats: result.stats,
  }));

  process.exit(result.passed ? 0 : 1);
}

main().catch(err => {
  console.error('Verification error:', err.message);
  process.exit(2);
});
