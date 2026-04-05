// ============================================================
// JavaScript Syntax Validator
// ============================================================
// Checks: brace/paren balance, parseable via Function constructor,
// no import/export/require, and required method presence.

function checkBalance(code) {
  let braceDepth = 0, parenDepth = 0, bracketDepth = 0;
  let inString = false, stringChar = '', escaped = false;
  let inComment = false, inBlockComment = false;

  for (let i = 0; i < code.length; i++) {
    const c = code[i], next = code[i + 1];
    if (escaped) { escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if (inString) { if (c === stringChar) inString = false; continue; }
    if (inBlockComment) { if (c === '*' && next === '/') { inBlockComment = false; i++; } continue; }
    if (inComment) { if (c === '\n') inComment = false; continue; }
    if (c === '/' && next === '/') { inComment = true; continue; }
    if (c === '/' && next === '*') { inBlockComment = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inString = true; stringChar = c; continue; }
    if (c === '{') braceDepth++;
    if (c === '}') braceDepth--;
    if (c === '(') parenDepth++;
    if (c === ')') parenDepth--;
    if (c === '[') bracketDepth++;
    if (c === ']') bracketDepth--;
  }

  const errors = [];
  if (braceDepth !== 0) errors.push(`Brace mismatch: ${braceDepth} unclosed`);
  if (parenDepth !== 0) errors.push(`Paren mismatch: ${parenDepth} unclosed`);
  if (bracketDepth !== 0) errors.push(`Bracket mismatch: ${bracketDepth} unclosed`);
  return errors;
}

function checkForbiddenPatterns(code) {
  const errors = [];
  if (/\bimport\s+/.test(code)) errors.push('Contains import statement');
  if (/\bexport\s+/.test(code)) errors.push('Contains export statement');
  if (/\brequire\s*\(/.test(code)) errors.push('Contains require() call');
  if (/\bfetch\s*\(/.test(code)) errors.push('Contains fetch() call');
  if (/\bXMLHttpRequest\b/.test(code)) errors.push('Contains XMLHttpRequest');
  if (/\beval\s*\(/.test(code)) errors.push('Contains eval() call');
  return errors;
}

function checkParseable(code, wrapInFunction = true) {
  try {
    if (wrapInFunction) {
      new Function(code);
    } else {
      new Function(`(function(){${code}})()`);
    }
    return [];
  } catch (err) {
    return [`Parse error: ${err.message}`];
  }
}

function checkMethodsPresent(code, methods) {
  const errors = [];
  for (const method of methods) {
    // Match method(, method =, .prototype.method, or method:
    const pattern = new RegExp(`\\b${method}\\s*\\(|\\b${method}\\s*[=:]|prototype\\.${method}`);
    if (!pattern.test(code)) {
      errors.push(`Missing required method: ${method}`);
    }
  }
  return errors;
}

function checkApiCalls(code, apiPrefix, minCount) {
  const regex = new RegExp(`\\b${apiPrefix}\\.\\w+\\s*\\(`, 'g');
  const matches = code.match(regex) || [];
  if (matches.length < minCount) {
    return [`Expected at least ${minCount} ${apiPrefix}.method() calls, found ${matches.length}`];
  }
  return [];
}

function validate(code, opts = {}) {
  const errors = [];

  errors.push(...checkBalance(code));
  errors.push(...checkForbiddenPatterns(code));

  if (opts.parseable !== false) {
    errors.push(...checkParseable(code, opts.wrapInFunction !== false));
  }

  if (opts.requiredMethods) {
    errors.push(...checkMethodsPresent(code, opts.requiredMethods));
  }

  if (opts.apiPrefix && opts.minApiCalls) {
    errors.push(...checkApiCalls(code, opts.apiPrefix, opts.minApiCalls));
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validate, checkBalance, checkForbiddenPatterns, checkParseable, checkMethodsPresent };
