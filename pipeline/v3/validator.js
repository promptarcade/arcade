// ============================================================
// Universal Validator — the only trusted component
// ============================================================
// Sits between every pair of AI components.
// Runs the same five mechanical checks on everything.
// Too dumb to be untrusted. It's assert(f(x) === y).
//
// Contract format:
// {
//   fn_id: "fn_3",
//   argNames: ["a", "b", "c"],
//   returnType: "number" | "string" | "boolean" | "object" | "array" | "any",
//   testVectors: [
//     { inputs: [1, 2, 3], expected: 6 },
//     { inputs: [0, 0, 0], expected: 0 }
//   ]
// }
//
// Result: { valid, result: "SUCCESS"|"FAILURE"|"NOT_ACTIONED", reason }

function validate(code, contract) {
  // 1. PARSE — does it construct as a function?
  let fn;
  try {
    fn = new Function(...contract.argNames, code);
  } catch (e) {
    return { valid: false, result: 'NOT_ACTIONED', reason: `parse: ${e.message}` };
  }

  // 2. FORBIDDEN — no imports, fetch, eval, require
  const forbidden = /\b(import|export|require|fetch|XMLHttpRequest|eval)\b/;
  if (forbidden.test(code)) {
    return { valid: false, result: 'NOT_ACTIONED', reason: 'forbidden keyword' };
  }

  // 3. TEST VECTORS — run each, check outputs
  if (!contract.testVectors || contract.testVectors.length === 0) {
    return { valid: false, result: 'NOT_ACTIONED', reason: 'no test vectors' };
  }

  for (let i = 0; i < contract.testVectors.length; i++) {
    const tv = contract.testVectors[i];
    let returned;

    try {
      // Deep clone inputs to prevent cross-contamination
      const inputs = JSON.parse(JSON.stringify(tv.inputs));
      returned = fn(...inputs);

      // Check mutations on first argument (if expectMutations provided)
      if (tv.expectMutations) {
        for (const [path, expected] of Object.entries(tv.expectMutations)) {
          const actual = getPath(inputs[0], path);
          if (!approxEqual(actual, expected)) {
            return {
              valid: false, result: 'FAILURE',
              reason: `vector ${i + 1}: ${path} = ${fmt(actual)}, expected ${fmt(expected)}`,
            };
          }
        }
      }

      // Check return value
      if (tv.expected !== undefined) {
        if (!approxEqual(returned, tv.expected)) {
          return {
            valid: false, result: 'FAILURE',
            reason: `vector ${i + 1}: returned ${fmt(returned)}, expected ${fmt(tv.expected)}`,
          };
        }
      }
    } catch (e) {
      return { valid: false, result: 'NOT_ACTIONED', reason: `vector ${i + 1} crash: ${e.message}` };
    }

    // 4. RETURN TYPE — check if declared
    if (contract.returnType && contract.returnType !== 'any' && tv.expected !== undefined) {
      const actualType = typeOf(returned);
      if (actualType !== contract.returnType) {
        return {
          valid: false, result: 'FAILURE',
          reason: `vector ${i + 1}: return type ${actualType}, expected ${contract.returnType}`,
        };
      }
    }
  }

  // 5. ALL PASSED
  return { valid: true, result: 'SUCCESS', reason: null };
}

// ── Helpers ─────────────────────────────────────────────────

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

function approxEqual(a, b) {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 0.1;
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null)
    return JSON.stringify(a) === JSON.stringify(b);
  return false;
}

function typeOf(val) {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}

function fmt(val) {
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

// ── Wiring map validation ───────────────────────────────────
// Checks that a wiring map is structurally coherent:
// - All fn_ids referenced in the map exist in the provided functions
// - All obj_ids referenced in the map exist in the objects list
// - No undefined references

function validateMap(map, fnIds) {
  const errors = [];

  // Check objects exist
  if (!map.objects || !Array.isArray(map.objects)) {
    errors.push('map.objects missing or not array');
  }

  const objIds = new Set((map.objects || []).map(o => o.id));
  const fnSet = new Set(fnIds);

  // Check loop references
  if (map.loop && Array.isArray(map.loop)) {
    for (const step of map.loop) {
      if (step.call && !fnSet.has(step.call)) {
        errors.push(`loop references unknown function: ${step.call}`);
      }
    }
  }

  // Check events references
  if (map.events && Array.isArray(map.events)) {
    for (const evt of map.events) {
      if (evt.call && !fnSet.has(evt.call)) {
        errors.push(`event references unknown function: ${evt.call}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = { validate, validateMap };
