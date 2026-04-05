// ============================================================
// Cell Memory Bank — self-learning through binary selection
// ============================================================
// Stores successful cell outputs as few-shot examples.
// Only "used" outputs survive. No reason given. No goal leaked.
// This is natural selection applied to AI cell outputs.

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, 'memory');
const MAX_ENTRIES = 50;

function ensureDir() {
  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

function filePath(cellType) {
  return path.join(MEMORY_DIR, cellType + '.json');
}

// Load all entries for a cell type
function load(cellType) {
  const fp = filePath(cellType);
  if (!fs.existsSync(fp)) return [];
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch {
    return [];
  }
}

// Store a successful output — the only feedback is survival
function store(cellType, entry) {
  ensureDir();
  const entries = load(cellType);

  entries.push({
    promptKey: entry.promptKey,
    prompt: entry.prompt,
    output: entry.output,
    timestamp: Date.now(),
    runId: entry.runId || 'unknown',
  });

  // Evict oldest if over cap
  while (entries.length > MAX_ENTRIES) entries.shift();

  fs.writeFileSync(filePath(cellType), JSON.stringify(entries, null, 2));
}

// Pick n random examples for few-shot injection
// Returns array of { prompt, output } — no reason, no context
function getFewShot(cellType, n = 2) {
  const entries = load(cellType);
  if (entries.length === 0) return [];

  // Shuffle and take n
  const shuffled = entries.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, entries.length)).map(e => ({
    prompt: e.promptKey,
    output: e.output,
  }));
}

// Format few-shot examples as a system prompt suffix
function formatFewShot(cellType, n = 2) {
  const examples = getFewShot(cellType, n);
  if (examples.length === 0) return '';

  let text = '\n\nHere are examples of outputs that were previously accepted:\n';
  examples.forEach((ex, i) => {
    text += `\nExample ${i + 1} input: "${ex.prompt}"`;
    text += `\nExample ${i + 1} output: ${JSON.stringify(ex.output)}`;
  });
  return text;
}

// Bank statistics
function getStats() {
  ensureDir();
  const types = ['palette', 'shape', 'behavior'];
  const stats = {};
  for (const t of types) {
    const entries = load(t);
    stats[t] = {
      count: entries.length,
      oldest: entries.length > 0 ? entries[0].timestamp : null,
      newest: entries.length > 0 ? entries[entries.length - 1].timestamp : null,
    };
  }
  return stats;
}

// Clear all memory (for clean baseline runs)
function clear() {
  ensureDir();
  for (const t of ['palette', 'shape', 'behavior']) {
    const fp = filePath(t);
    if (fs.existsSync(fp)) fs.writeFileSync(fp, '[]');
  }
}

module.exports = { load, store, getFewShot, formatFewShot, getStats, clear };
