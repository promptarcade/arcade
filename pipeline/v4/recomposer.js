// ============================================================
// Recomposer — fully deterministic assembly
// ============================================================
// Every stage is mechanical. No AI calls. No gaming possible.
//
//   Stage 1: Function declarations from atom code
//   Stage 2: Object initialization from map
//   Stage 3: Loop body — mechanical JSON→JS translation
//   Stage 4: Events + Reset — mechanical JSON→JS translation
//   Stage 5: Rendering from objects + sprites
//   Stage 6: HTML shell wraps all fragments
//   Stage 7: Syntax validation — catch recomposer bugs before output

function recompose({ map, functions, sprites, engineCode }) {

  // ── STAGE 1: Function declarations ──
  const fnDecls = functions.map(f =>
    `var ${f.fn_id} = function(${f.argNames.join(', ')}) { ${f.code} };`
  ).join('\n');

  // ── STAGE 2: Object initialization ──
  const objInits = (map.objects || []).map(o => {
    const x = sanitizeExpr(o.x, 'W');
    const y = sanitizeExpr(o.y, 'H');
    const props = Object.entries(o.props || {}).map(([k, v]) => `${k}: ${sanitizePropValue(v)}`).join(', ');
    return `var ${o.id} = { x: ${x}, y: ${y}, w: ${o.w}, h: ${o.h}${props ? ', ' + props : ''} };`;
  }).join('\n');

  // Sprite mapping
  const spriteMap = {};
  for (const o of (map.objects || [])) {
    const sp = sprites.find(s => s.shapeId === o.shape);
    if (sp) spriteMap[o.id] = sp.varName;
  }

  // Input setup
  const inputKeys = map.input || {};
  const inputSetup = `var inputState = { keys: {} };
addEventListener('keydown', function(e) { inputState.keys[e.key] = true; e.preventDefault(); });
addEventListener('keyup', function(e) { inputState.keys[e.key] = false; });
canvas.addEventListener('touchstart', function(e) {
  e.preventDefault(); var ty = e.touches[0].clientY;
  ${inputKeys.up ? `inputState.keys['${inputKeys.up}'] = ty < H/2;` : ''}
  ${inputKeys.down ? `inputState.keys['${inputKeys.down}'] = ty >= H/2;` : ''}
  ${inputKeys.left ? `inputState.keys['${inputKeys.left}'] = e.touches[0].clientX < W/2;` : ''}
  ${inputKeys.right ? `inputState.keys['${inputKeys.right}'] = e.touches[0].clientX >= W/2;` : ''}
});
canvas.addEventListener('touchend', function(e) {
  e.preventDefault();
  ${Object.values(inputKeys).map(k => `inputState.keys['${k}'] = false;`).join('\n  ')}
});`;

  // Counter init
  const counterInits = (map.counters || []).map(c => `var ${c} = 0;`).join('\n');

  // ── STAGE 3: Loop body — deterministic translation ──
  const warnings = [];
  const loopBody = translateSteps(map.loop || [], inputKeys, warnings);

  // ── STAGE 4: Events + Reset — deterministic translation ──
  const resetCode = translateReset(map.reset || {});
  const eventCode = translateEvents(map.events || [], inputKeys, warnings);

  if (warnings.length > 0) {
    console.log(`    Recomposer warnings: ${warnings.join('; ')}`);
  }

  // ── STAGE 5: Rendering ──
  const drawCalls = (map.objects || []).map(o => {
    const sv = spriteMap[o.id];
    if (!sv) return '';
    return `ctx.drawImage(${sv}, ${o.id}.x - ${o.id}.w*S/2, ${o.id}.y - ${o.id}.h*S/2, ${o.id}.w*S, ${o.id}.h*S);`;
  }).filter(Boolean).join('\n  ');

  // Display elements — all values sanitized to valid JS expressions
  const display = map.display || {};
  let displayCode = '';
  if (display.counters) {
    const c = display.counters;
    const counterText = (map.counters || []).join(` + '   ' + `);
    const fontSize = sanitizeNumericExpr(c.font, '48*S');
    const yPos = sanitizeExpr(c.y, 'H', '60*S');
    displayCode += `ctx.fillStyle = '${c.color || '#fff'}'; ctx.font = Math.round(${fontSize}) + 'px monospace'; ctx.textAlign = 'center';\n  ctx.fillText(${counterText}, W/2, ${yPos});\n`;
  }
  if (display.hint) {
    const h = display.hint;
    const fontSize = sanitizeNumericExpr(h.font, '14*S');
    const yPos = sanitizeExpr(h.y, 'H', 'H-20*S');
    const text = String(h.text || '').replace(/'/g, "\\'");
    displayCode += `  ctx.fillStyle = '${h.color || '#888'}'; ctx.font = Math.round(${fontSize}) + 'px monospace';\n  ctx.fillText('${text}', W/2, ${yPos});\n`;
  }
  if (display.centerLine) {
    const cl = display.centerLine;
    const dash = Array.isArray(cl.dash) ? cl.dash : [8, 8];
    displayCode += `  ctx.setLineDash([${dash.map(d => d + '*S').join(',')}]); ctx.strokeStyle='${cl.color || '#444'}'; ctx.lineWidth=${cl.width || 2}*S;\n  ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke(); ctx.setLineDash([]);\n`;
  }

  // ── STAGE 6: HTML shell ──
  const bg = display.background || '#111';
  const spriteCode = sprites.map(s => s.code).join('\n');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Product</title>
<style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:${bg}}canvas{display:block;touch-action:none;width:100vw;height:100vh}</style>
</head><body><canvas id="c"></canvas><script>
${engineCode}

var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var W, H, S;
function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; S = Math.min(W,H)/600; }
resize(); addEventListener('resize', resize);

${spriteCode}

${fnDecls}

${objInits}
${counterInits}

${inputSetup}

${resetCode}
${eventCode}

var last = 0;
function loop(t) {
  var dt = Math.min((t - last) / 1000, 0.05); last = t;
  ctx.fillStyle = '${bg}'; ctx.fillRect(0, 0, W, H);

  ${loopBody}

  checkEvents();

  ${drawCalls}

  ${displayCode}

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
</script></body></html>`;

  // ── STAGE 7: Syntax validation ──
  const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);
  if (scriptMatch) {
    try {
      new Function(scriptMatch[1]);
    } catch (e) {
      const line = e.message;
      return {
        success: false,
        rejection: { fn_id: 'recomposer', reason: `Generated JS has syntax error: ${line}` },
        cost: 0,
      };
    }
  }

  return { success: true, html, cost: 0 };
}

// ============================================================
// Value sanitizers — the decomposer outputs messy values,
// these ensure valid JS expressions in all cases
// ============================================================

// Sanitize a positional expression. Handles: "50%", "50", 50, "W*0.5", "center"
function sanitizeExpr(val, dimension, fallback) {
  if (val === undefined || val === null) return fallback || '0';
  const s = String(val).trim();

  // Percentage → multiply by dimension
  if (s.endsWith('%')) {
    const pct = parseFloat(s);
    if (!isNaN(pct)) return `${dimension} * ${pct / 100}`;
  }

  // Pure number
  const num = Number(s);
  if (!isNaN(num) && s !== '') return String(num);

  // Already looks like a JS expression (contains operators or known vars)
  if (/^[WHS0-9.*+\-/() ]+$/.test(s)) return s;

  // Fallback — unknown format
  return fallback || '0';
}

// Sanitize a numeric expression for font size etc. Must produce a number.
function sanitizeNumericExpr(val, fallback) {
  if (val === undefined || val === null) return fallback;
  const s = String(val).trim();

  // Pure number
  const num = Number(s);
  if (!isNaN(num) && s !== '') return String(num);

  // Looks like a math expression with S scaling
  if (/^[0-9.*+\-/()S ]+$/.test(s)) return s;

  // Extract leading number from garbage like "24px monospace"
  const leading = s.match(/^([0-9.]+)/);
  if (leading) return leading[1] + '*S';

  return fallback;
}

// Sanitize a property value in object init. Strings that aren't valid JS get quoted.
function sanitizePropValue(v) {
  if (v === null || v === undefined) return '0';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  const s = String(v).trim();
  // Pure number
  if (!isNaN(Number(s)) && s !== '') return s;
  // Looks like valid JS (simple expression, array, or already quoted string)
  if (/^[-0-9.*+/() WHS]+$/.test(s)) return s;
  if (s.startsWith('[') || s.startsWith('{') || s.startsWith("'") || s.startsWith('"')) return s;
  if (s === 'true' || s === 'false' || s === 'null') return s;
  // Unknown — quote it as a string
  return `'${s.replace(/'/g, "\\'")}'`;
}

// ============================================================
// Deterministic translators
// ============================================================

function resolveArg(arg, inputKeys) {
  if (typeof arg !== 'string') return String(arg);
  // Input references
  if (arg === 'input.up') return `inputState.keys['${inputKeys.up || 'ArrowUp'}']`;
  if (arg === 'input.down') return `inputState.keys['${inputKeys.down || 'ArrowDown'}']`;
  if (arg === 'input.left') return `inputState.keys['${inputKeys.left || 'ArrowLeft'}']`;
  if (arg === 'input.right') return `inputState.keys['${inputKeys.right || 'ArrowRight'}']`;
  if (arg.startsWith('input.')) return `inputState.keys['${inputKeys[arg.slice(6)] || arg.slice(6)}']`;
  return arg;
}

function translateCall(step, inputKeys) {
  const args = (step.args || []).map(a => resolveArg(a, inputKeys)).join(', ');
  const call = `${step.call}(${args})`;

  if (step.target) {
    return `${step.target} = ${call};`;
  }
  if (step.store) {
    return `var ${step.store} = ${call};`;
  }
  return `${call};`;
}

function translateStep(step, inputKeys, errors) {
  if (!step || typeof step !== 'object') {
    return `/* skipped invalid step */`;
  }

  if (!step.call) {
    // Handle non-call steps gracefully
    if (step.set) return `${step.set} = ${resolveArg(String(step.value), inputKeys)};`;
    if (step.reset) return `reset('${step.reset}');`;
    if (step.increment) return `${step.increment}++;`;
    return `/* unknown step: ${JSON.stringify(step).slice(0, 60)} */`;
  }

  // Conditional step
  if (step.test) {
    const args = (step.args || []).map(a => resolveArg(a, inputKeys)).join(', ');
    const condition = `${step.call}(${args})`;
    let body = '';
    if (step.onTrue) {
      if (Array.isArray(step.onTrue)) {
        body = step.onTrue.map(s => '  ' + translateStep(s, inputKeys, errors)).join('\n');
      } else {
        body = '  ' + translateCall(step.onTrue, inputKeys);
      }
    }
    let elseBody = '';
    if (step.onFalse) {
      if (Array.isArray(step.onFalse)) {
        elseBody = ' else {\n' + step.onFalse.map(s => '  ' + translateStep(s, inputKeys, errors)).join('\n') + '\n}';
      } else {
        elseBody = ' else {\n  ' + translateCall(step.onFalse, inputKeys) + '\n}';
      }
    }
    return `if (${condition}) {\n${body}\n}${elseBody}`;
  }

  // forEach over array of objects
  if (step.forEach) {
    const inner = (step.do || []).map(s => '  ' + translateStep(s, inputKeys, errors)).join('\n');
    return `for (var _i = 0; _i < ${step.forEach}.length; _i++) {\n  var ${step.as || 'item'} = ${step.forEach}[_i];\n${inner}\n}`;
  }

  return translateCall(step, inputKeys);
}

function translateSteps(steps, inputKeys, errors) {
  return steps.map(s => translateStep(s, inputKeys, errors)).join('\n  ');
}

function translateReset(resetSpec) {
  if (!resetSpec || Object.keys(resetSpec).length === 0) return '';
  const cases = Object.entries(resetSpec).map(([objId, props]) => {
    const assignments = Object.entries(props).map(([k, v]) => `    ${objId}.${k} = ${sanitizePropValue(v)};`).join('\n');
    return `  if (id === '${objId}') {\n${assignments}\n  }`;
  }).join(' else ');
  return `function reset(id) {\n${cases}\n}`;
}

function translateEvents(events, inputKeys, errors) {
  if (!events || events.length === 0) return 'function checkEvents() {}';
  const checks = events.map(evt => {
    const when = resolveCondition(evt.when, inputKeys);
    const actions = (evt.do || []).map(action => {
      if (typeof action === 'string') return `  ${action};`;
      if (action.call) return '  ' + translateCall(action, inputKeys);
      if (action.set) return `  ${action.set} = ${resolveArg(String(action.value), inputKeys)};`;
      if (action.reset) return `  reset('${action.reset}');`;
      if (action.increment) return `  ${action.increment}++;`;
      return `  /* unknown action: ${JSON.stringify(action)} */`;
    }).join('\n');
    return `  if (${when}) {\n${actions}\n  }`;
  }).join('\n');
  return `function checkEvents() {\n${checks}\n}`;
}

function resolveCondition(when, inputKeys) {
  if (typeof when !== 'string') return String(when);
  let resolved = when;
  // input.X → inputState.keys[...]
  resolved = resolved.replace(/input\.(\w+)/g, (_, key) => {
    return `inputState.keys['${inputKeys[key] || key}']`;
  });
  // Validate: try to parse as expression. If it fails, wrap in try-catch false.
  try {
    new Function('return (' + resolved + ')');
  } catch (e) {
    // Invalid expression — return false to prevent runtime crash
    return 'false /* invalid condition: ' + resolved.replace(/\*\//g, '').slice(0, 40) + ' */';
  }
  return resolved;
}

module.exports = { recompose };
