// ============================================================
// Universal Validator v4 — extended with Guide signals
// ============================================================
// Same five mechanical checks as v3, plus Guide signal handling.
// The validator is the ocean between AI islands — carries signals,
// strips meaning at every shore.

function validate(code, contract) {
  let fn;
  try {
    fn = new Function(...contract.argNames, code);
  } catch (e) {
    return { valid: false, result: 'NOT_ACTIONED', reason: `parse: ${e.message}` };
  }

  const forbidden = /\b(import|export|require|fetch|XMLHttpRequest|eval)\b/;
  if (forbidden.test(code)) {
    return { valid: false, result: 'NOT_ACTIONED', reason: 'forbidden keyword' };
  }

  if (!contract.testVectors || contract.testVectors.length === 0) {
    return { valid: false, result: 'NOT_ACTIONED', reason: 'no test vectors' };
  }

  for (let i = 0; i < contract.testVectors.length; i++) {
    const tv = contract.testVectors[i];
    let returned;
    try {
      const inputs = JSON.parse(JSON.stringify(tv.inputs));
      returned = fn(...inputs);

      if (tv.expectMutations) {
        for (const [path, expected] of Object.entries(tv.expectMutations)) {
          const actual = getPath(inputs[0], path);
          if (!approxEqual(actual, expected)) {
            return { valid: false, result: 'FAILURE', reason: `vector ${i+1}: ${path} = ${fmt(actual)}, expected ${fmt(expected)}` };
          }
        }
      }

      if (tv.expected !== undefined) {
        if (!approxEqual(returned, tv.expected)) {
          return { valid: false, result: 'FAILURE', reason: `vector ${i+1}: returned ${fmt(returned)}, expected ${fmt(tv.expected)}` };
        }
      }
    } catch (e) {
      return { valid: false, result: 'NOT_ACTIONED', reason: `vector ${i+1} crash: ${e.message}` };
    }

    if (contract.returnType && contract.returnType !== 'any' && tv.expected !== undefined) {
      const actualType = typeOf(returned);
      if (actualType !== contract.returnType) {
        return { valid: false, result: 'FAILURE', reason: `vector ${i+1}: return type ${actualType}, expected ${contract.returnType}` };
      }
    }
  }

  return { valid: true, result: 'SUCCESS', reason: null };
}

// ── Guide signal handler ────────────────────────────────────
// Receives Guide assessment, returns mechanical decision.
// No reasoning, no interpretation — just signal → action.

function handleGuide(assessment) {
  switch (assessment.assessment) {
    case 'SAFE':
      return { action: 'PROCEED', fn_id: assessment.fn_id };
    case 'RISK':
      // Flag for granularity review — decomposer sees WHICH contract, not WHY
      return { action: 'FLAG', fn_id: assessment.fn_id };
    case 'BREACH':
      // Discard output, retry with original spec
      return { action: 'DISCARD', fn_id: assessment.fn_id };
    default:
      // Unknown signal — treat as RISK (conservative)
      return { action: 'FLAG', fn_id: assessment.fn_id };
  }
}

// ── Map validation ──────────────────────────────────────────

function validateMap(map, fnIds) {
  const errors = [];
  if (!map.objects || !Array.isArray(map.objects)) errors.push('map.objects missing');
  const fnSet = new Set(fnIds);
  if (map.loop && Array.isArray(map.loop)) {
    for (const step of map.loop) {
      if (step.call && !fnSet.has(step.call)) errors.push(`loop: unknown ${step.call}`);
    }
  }
  if (map.events && Array.isArray(map.events)) {
    for (const evt of map.events) {
      if (evt.call && !fnSet.has(evt.call)) errors.push(`event: unknown ${evt.call}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

// ── Helpers ─────────────────────────────────────────────────

function getPath(obj, p) { return p.split('.').reduce((o, k) => o?.[k], obj); }
function approxEqual(a, b) {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 0.1;
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null)
    return JSON.stringify(a) === JSON.stringify(b);
  return false;
}
function typeOf(val) { if (val === null) return 'null'; if (Array.isArray(val)) return 'array'; return typeof val; }
function fmt(val) { return typeof val === 'object' ? JSON.stringify(val) : String(val); }

module.exports = { validate, validateMap, handleGuide };
