// ============================================================
// Triple-Blind Consensus Validator
// ============================================================
// Compares research results from 3 independent workers.
// Checks: product name overlap, numeric metric agreement,
// categorical majority vote. Returns merged benchmarks.

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mode(arr) {
  const counts = {};
  for (const v of arr) counts[v] = (counts[v] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function validate(results) {
  // results = [researchA, researchB, researchC]
  // Each has: { products: [{ name, entityCount, sessionLengthSeconds, mechanicCount, difficultyRamp }], benchmarks: {...} }
  const errors = [];
  const disagreements = [];

  if (results.length < 3) {
    return { valid: false, errors: ['Need exactly 3 research results'], merged: null, disagreements };
  }

  // 1. Check product name overlap
  const nameSets = results.map(r =>
    new Set((r.products || []).map(p => normalize(p.name)))
  );
  const allNames = [...new Set(nameSets.flatMap(s => [...s]))];
  const corroborated = allNames.filter(name =>
    nameSets.filter(s => s.has(name)).length >= 2
  );

  if (corroborated.length < 2) {
    errors.push(`Only ${corroborated.length} products corroborated across workers (need ≥2)`);
  }

  // 2. Check numeric agreement on benchmarks
  const entityCounts = results.map(r => r.benchmarks?.avgEntityCount).filter(v => typeof v === 'number');
  if (entityCounts.length >= 2) {
    const med = median(entityCounts);
    const maxDev = Math.max(...entityCounts.map(v => Math.abs(v - med) / med));
    if (maxDev > 0.5) {
      disagreements.push(`avgEntityCount deviation: ${maxDev.toFixed(2)} (values: ${entityCounts.join(', ')})`);
    }
  }

  const sessionLengths = results.map(r => r.benchmarks?.avgSessionLength).filter(v => typeof v === 'number');
  if (sessionLengths.length >= 2) {
    const med = median(sessionLengths);
    const maxDev = Math.max(...sessionLengths.map(v => Math.abs(v - med) / med));
    if (maxDev > 1.0) {
      disagreements.push(`avgSessionLength deviation: ${maxDev.toFixed(2)} (values: ${sessionLengths.join(', ')})`);
    }
  }

  // 3. Merge benchmarks using median/mode
  const allMechanics = results.flatMap(r => r.benchmarks?.commonMechanics || []);
  const mechanicCounts = {};
  for (const m of allMechanics) {
    const key = m.toLowerCase().trim();
    mechanicCounts[key] = (mechanicCounts[key] || 0) + 1;
  }
  // Keep mechanics mentioned by at least 2 workers
  const agreedMechanics = Object.entries(mechanicCounts)
    .filter(([_, count]) => count >= 2)
    .map(([name]) => name);

  const difficulties = results.map(r => r.benchmarks?.recommendedDifficulty).filter(Boolean);

  const merged = {
    avgEntityCount: Math.round(median(entityCounts.length ? entityCounts : [10])),
    commonMechanics: agreedMechanics.length ? agreedMechanics : ['scoring', 'progression'],
    avgSessionLength: Math.round(median(sessionLengths.length ? sessionLengths : [120])),
    recommendedDifficulty: difficulties.length ? mode(difficulties) : 'stepped',
    corroboratedProducts: corroborated.length,
  };

  // Score: product overlap + entity agreement + mechanics agreement
  let score = 0;
  if (corroborated.length >= 2) score++;
  if (corroborated.length >= 3) score++;
  if (disagreements.length === 0) score++;
  if (agreedMechanics.length >= 2) score++;

  const valid = score >= 2 && errors.length === 0;

  return { valid, score, merged, errors, disagreements };
}

module.exports = { validate };
