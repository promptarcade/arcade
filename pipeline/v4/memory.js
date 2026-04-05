// ============================================================
// v4 Memory — persistent learning across runs
// ============================================================
// Stores successful patterns for few-shot injection:
//   - Atom code that passed validation + Guide (SAFE)
//   - Decomposition patterns that produced working products
//   - Failed contract patterns to avoid repeating
//
// Binary selection: only successes survive. No reason stored.

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, 'memory');
const MAX_ENTRIES = 30;

function ensureDir() {
  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

function load(type) {
  const fp = path.join(MEMORY_DIR, type + '.json');
  if (!fs.existsSync(fp)) return [];
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return []; }
}

function save(type, entries) {
  ensureDir();
  while (entries.length > MAX_ENTRIES) entries.shift();
  fs.writeFileSync(path.join(MEMORY_DIR, type + '.json'), JSON.stringify(entries, null, 2));
}

// Store a successful atom (code that passed validation + Guide)
function storeAtom(contract, code) {
  const entries = load('atoms');
  entries.push({
    prompt: contract.prompt,
    argNames: contract.argNames,
    code,
    timestamp: Date.now(),
  });
  save('atoms', entries);
}

// Store a successful decomposition (all atoms passed, product built)
function storeDecomposition(request, contracts, map) {
  const entries = load('decompositions');
  // Store a compact version — just the contract structure, not full test vectors
  entries.push({
    request,
    contractCount: contracts.length,
    contractSummaries: contracts.map(c => ({
      fn_id: c.fn_id,
      prompt: c.prompt.slice(0, 100),
      argNames: c.argNames,
      returnType: c.returnType,
      vectorCount: c.testVectors.length,
    })),
    objectCount: (map.objects || []).length,
    loopSteps: (map.loop || []).length,
    timestamp: Date.now(),
  });
  save('decompositions', entries);
}

// Store a failed contract pattern (so decomposer doesn't repeat it)
function storeFailure(fn_id, reason) {
  const entries = load('failures');
  entries.push({ fn_id, reason, timestamp: Date.now() });
  save('failures', entries);
}

// Direct cache lookup — exact match on normalized prompt+argNames
function findCachedAtom(prompt, argNames) {
  const entries = load('atoms');
  const normPrompt = prompt.trim().toLowerCase().replace(/\s+/g, ' ');
  const normArgs = argNames.join(',');
  for (const entry of entries) {
    const ep = entry.prompt.trim().toLowerCase().replace(/\s+/g, ' ');
    const ea = entry.argNames.join(',');
    if (ep === normPrompt && ea === normArgs) return entry.code;
  }
  return null;
}

// Get few-shot examples for atomics
function getAtomExamples(n = 2) {
  const entries = load('atoms');
  if (entries.length === 0) return '';
  const shuffled = entries.slice().sort(() => Math.random() - 0.5).slice(0, n);
  let text = '\n\nHere are examples of function bodies that were previously accepted:\n';
  shuffled.forEach((ex, i) => {
    text += `\nExample ${i + 1} prompt: "${ex.prompt.slice(0, 80)}"`;
    text += `\nExample ${i + 1} argNames: [${ex.argNames.join(', ')}]`;
    text += `\nExample ${i + 1} code: ${ex.code}\n`;
  });
  return text;
}

// Get few-shot examples for decomposer
function getDecomposeExamples() {
  const entries = load('decompositions');
  if (entries.length === 0) return '';
  const recent = entries.slice(-2);
  let text = '\n\nHere are decomposition patterns that previously succeeded:\n';
  recent.forEach((ex, i) => {
    text += `\nSuccess ${i + 1}: "${ex.request}" → ${ex.contractCount} contracts, ${ex.objectCount} objects, ${ex.loopSteps} loop steps`;
    text += `\nContracts: ${ex.contractSummaries.map(c => `${c.fn_id}(${c.argNames.join(',')}) [${c.vectorCount} tests]`).join(', ')}\n`;
  });
  return text;
}

// Get failure patterns to avoid
function getFailurePatterns() {
  const entries = load('failures');
  if (entries.length === 0) return '';
  // Deduplicate by reason pattern
  const unique = [...new Map(entries.map(e => [e.reason.slice(0, 50), e])).values()].slice(-5);
  let text = '\n\nAvoid these patterns that failed previously:\n';
  unique.forEach(f => { text += `- ${f.reason}\n`; });
  return text;
}

function getStats() {
  return {
    atoms: load('atoms').length,
    decompositions: load('decompositions').length,
    failures: load('failures').length,
  };
}

function clear() {
  ensureDir();
  for (const t of ['atoms', 'decompositions', 'failures']) {
    const fp = path.join(MEMORY_DIR, t + '.json');
    if (fs.existsSync(fp)) fs.writeFileSync(fp, '[]');
  }
}

module.exports = { storeAtom, storeDecomposition, storeFailure, findCachedAtom, getAtomExamples, getDecomposeExamples, getFailurePatterns, getStats, clear };
