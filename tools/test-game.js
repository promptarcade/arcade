#!/usr/bin/env node
// ============================================================
// Game Static Analysis — generic for all Prompt Arcade games
// Run: node tools/test-game.js games/<name>/index.html
// Games can extend with a test-extend.js file in their directory.
// ============================================================

const fs = require('fs');
const path = require('path');
const file = process.argv[2];
if (!file) { console.log('Usage: node test-game.js <html-file>'); process.exit(1); }

const html = fs.readFileSync(file, 'utf8');
const allScripts = html.match(/<script>([\s\S]*?)<\/script>/g);
if (!allScripts || allScripts.length === 0) { console.log('FAIL: No <script> block found'); process.exit(1); }
let code = '';
for (const s of allScripts) {
  const inner = s.replace(/<\/?script>/g, '');
  if (inner.length > code.length) code = inner;
}

const codeLines = code.split('\n');
let errors = 0, warnings = 0;
function fail(msg) { console.log('  FAIL: ' + msg); errors++; }
function warn(msg) { console.log('  WARN: ' + msg); warnings++; }
function ok(msg) { console.log('  OK: ' + msg); }

console.log('=== TESTING: ' + file + ' ===\n');

// ============================================================
// 1. SYNTAX — universal
// ============================================================
console.log('[SYNTAX]');
let braceDepth = 0, parenDepth = 0;
let inString = false, stringChar = '', escaped = false, inComment = false, inBlockComment = false;
for (let i = 0; i < code.length; i++) {
  const c = code[i], next = code[i+1];
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
}
if (braceDepth !== 0) fail('Brace mismatch: ' + braceDepth + ' unclosed');
else ok('Braces balanced');
if (Math.abs(parenDepth) > 1) fail('Paren mismatch: ' + parenDepth);
else ok('Parens OK (diff: ' + parenDepth + ')');

const lastLines = html.trim().split('\n').slice(-3).join('').replace(/\s/g, '');
if (!lastLines.includes('</script></body></html>')) fail('File doesn\'t end with </script></body></html>');
else ok('File ending correct');

// ============================================================
// 2. REFERENCES — use-before-define for registry/manager patterns
// ============================================================
console.log('\n[REFERENCES]');

// Generic: detect any FooRegistry, BarManager, BazSystem pattern
var globalDefs = {};
var globalUses = [];
for (var li = 0; li < codeLines.length; li++) {
  var cl = codeLines[li];
  var defMatch = cl.match(/(?:var|const|let)\s+(\w+)\s*=\s*[^=]|function\s+(\w+)\s*\(/);
  if (defMatch) {
    var defName = defMatch[1] || defMatch[2];
    if (defName && !globalDefs[defName] && /=\s*[\{\[\(\"\'`\d\w]|function\s+\w/.test(cl)) {
      globalDefs[defName] = li;
    }
  }
  // Match any pattern: SomethingRegistry.method( or SomethingManager.method(
  var useMatch = cl.match(/^[\s]*(\w+(?:Registry|Manager|System|Events|Time|Weather|Stack|State))\s*\.\s*\w+\s*[\(=]/);
  if (useMatch) {
    globalUses.push({ name: useMatch[1], line: li, text: cl.trim().slice(0, 60) });
  }
}
var orderErrors = 0;
for (var ui = 0; ui < globalUses.length; ui++) {
  var use = globalUses[ui];
  if (globalDefs[use.name] !== undefined && globalDefs[use.name] > use.line) {
    fail('Use-before-define: "' + use.name + '" used at line ' + (use.line+1) + ' but defined at line ' + (globalDefs[use.name]+1));
    orderErrors++;
    if (orderErrors >= 3) { warn('... and possibly more use-before-define errors'); break; }
  }
}
if (orderErrors === 0) ok('No use-before-define detected for registries/managers');

// ============================================================
// 3. STATE MACHINE — detect any state pattern
// ============================================================
console.log('\n[STATES]');
const stateRegex = /var\s+(\w+State)\s*=\s*\{/g;
let stateMatch;
const states = [];
while ((stateMatch = stateRegex.exec(code)) !== null) states.push(stateMatch[1]);

if (states.length > 0) {
  ok(states.length + ' states found: ' + states.join(', '));
} else {
  const stateChecks = code.match(/state\s*===\s*'(\w+)'/g);
  if (stateChecks) {
    const stateNames = [...new Set(stateChecks.map(s => s.match(/'(\w+)'/)[1]))];
    ok('String states: ' + stateNames.join(', '));
  }
}

// ============================================================
// 4. ACTIONS — score, touch, input
// ============================================================
console.log('\n[ACTIONS]');

if (code.includes('submitScore')) ok('Score submission present');
else warn('No submitScore function');

if (html.includes('touchstart')) ok('Touch event handlers present');
else warn('No touch handlers found');

const touchKeys = [];
const touchBtnRegex = /data-key="([^"]+)"/g;
let tbm;
while ((tbm = touchBtnRegex.exec(html)) !== null) touchKeys.push(tbm[1]);
if (touchKeys.length > 0) {
  ok('Touch buttons: ' + touchKeys.join(', '));
}

// ============================================================
// 5. MOBILE READINESS — universal
// ============================================================
console.log('\n[MOBILE]');

if (html.includes('viewport') && html.includes('width=device-width')) ok('Viewport meta tag present');
else fail('Missing viewport meta tag — will not scale on mobile');

if (html.includes('touch-action')) ok('touch-action set on canvas');
else warn('No touch-action CSS — may get unwanted scrolling on mobile');

if (html.includes('touch-controls') || html.includes('dpad-btn') || html.includes('touchstart')) {
  ok('Touch controls infrastructure found');
} else {
  fail('No touch controls — game unplayable on mobile');
}

if (html.includes('100vw') || html.includes('innerWidth')) ok('Canvas uses viewport sizing');
else warn('Canvas may have fixed dimensions — check mobile layout');

if (code.includes("'click'") || code.includes('"click"')) ok('Click handler present (tap to start/restart)');
else warn('No click handler — mobile users may not be able to start');

// Key/touch coverage check
const keyBindings = new Set();
const keyRegex = /e\.key\s*===\s*'([^']+)'|key\s*===\s*'([^']+)'/g;
let km;
while ((km = keyRegex.exec(code)) !== null) {
  var k = km[1] || km[2];
  if (k && !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(k)) {
    keyBindings.add(k);
  }
}
const touchKeySet = new Set(touchKeys);
const missingTouch = [];
for (const k of keyBindings) {
  if (k.length === 1 && touchKeySet.has(k.toLowerCase())) continue;
  if (k.length === 1 && touchKeySet.has(k.toUpperCase())) continue;
  if (!touchKeySet.has(k)) missingTouch.push(k);
}
if (missingTouch.length > 0) {
  var essential = missingTouch.filter(function(k) { return !['F','f','M','m','u','U'].includes(k); });
  if (essential.length > 0) warn('Keys without touch buttons: ' + essential.join(', '));
  else ok('All essential keys have touch equivalents');
} else {
  ok('All keys have touch equivalents');
}

// ============================================================
// 6. VISUAL PATTERNS — universal canvas rendering checks
// ============================================================
console.log('\n[VISUAL PATTERNS]');

// Text overlap: multiple fillText with independent Y offsets
let consecutiveTextLines = 0, independentOffsets = 0, lastTextLine = -10;
for (let i = 0; i < codeLines.length; i++) {
  const line = codeLines[i].trim();
  if (line.includes('fillText(')) {
    if (i - lastTextLine <= 2) {
      consecutiveTextLines++;
      if (/[+]\s*(?:fs\s*\*\s*)?\d+\.?\d*\s*[,)]/.test(line) && !/ty\s*[+,)]|ty\s*;/.test(line)) {
        independentOffsets++;
      }
    } else {
      if (consecutiveTextLines >= 3 && independentOffsets >= 3) {
        warn('Possible text overlap at line ~' + (lastTextLine + 1) + ': ' + consecutiveTextLines + ' consecutive fillText calls with ' + independentOffsets + ' independent Y offsets');
      }
      consecutiveTextLines = 1;
      independentOffsets = 0;
    }
    lastTextLine = i;
  }
}
if (consecutiveTextLines >= 3 && independentOffsets >= 3) {
  warn('Possible text overlap at line ~' + (lastTextLine + 1));
}
if (warnings === 0 || independentOffsets < 3) ok('No obvious text overlap patterns');

// Content drawn before container
let boxAfterContent = 0;
for (let i = 0; i < codeLines.length; i++) {
  const line = codeLines[i].trim();
  if (line.includes('fillRect(') && (line.includes('boxW') || line.includes('boxH') || line.includes('cardW') || line.includes('cardH'))) {
    let hasContentBefore = false;
    for (let j = Math.max(0, i - 20); j < i; j++) {
      if (codeLines[j].includes('fillText(') && !codeLines[j].includes('boxW') && !codeLines[j].includes('cardW')) {
        hasContentBefore = true; break;
      }
    }
    if (hasContentBefore) boxAfterContent++;
  }
}
if (boxAfterContent > 3) warn(boxAfterContent + ' places where content may be drawn before its container is sized');
else ok('No box-after-content patterns detected');

// Tile draw functions missing ground fill (only if tile system detected)
if (code.includes('TileRegistry')) {
  const tileDrawRegex = /TileRegistry\.add\(\{[\s\S]*?draw\s*:\s*function\s*\([^)]*\)\s*\{([\s\S]*?)\}\s*,?\s*\n/g;
  let tdm, missingGround = 0;
  while ((tdm = tileDrawRegex.exec(code)) !== null) {
    const drawBody = tdm[1];
    const hasGroundFill = drawBody.includes('fillRect(sx') || drawBody.includes('fillRect(sx,sy,ts,ts') ||
      drawBody.includes('getDrawer(') || drawBody.includes('grassDraw') || drawBody.includes('floorDraw');
    const isSolid = tdm[0].includes('solid: true') || tdm[0].includes('solid:true');
    if (!hasGroundFill && !isSolid) missingGround++;
  }
  if (missingGround === 0) ok('All tile draw functions appear to fill their ground');
  else warn(missingGround + ' tile draw functions may not fill their ground');
}

// Animation bounds
const animBoundsRegex = /sy\s*[+]\s*(\d+\.?\d*)\s*\*\s*m/g;
let animMatch, maxAnimY = 0;
while ((animMatch = animBoundsRegex.exec(code)) !== null) {
  const val = parseFloat(animMatch[1]);
  if (val > maxAnimY) maxAnimY = val;
}
if (maxAnimY > 18) warn('Animation Y offset goes to ' + maxAnimY + '*m — may exceed tile bounds');
else ok('Animation offsets within tile bounds (max: ' + maxAnimY.toFixed(1) + '*m)');

// Dynamic text width overflow
var concatTextDraws = 0;
for (var i = 0; i < codeLines.length; i++) {
  var line = codeLines[i].trim();
  if (line.includes('fillText(') && (line.includes('.join(') || (line.match(/\+.*\+.*\+/) && line.includes("'")))) {
    var hasBoundsCheck = false;
    for (var j = Math.max(0, i - 8); j <= i; j++) {
      if (codeLines[j].includes('measureText') || codeLines[j].includes('maxTextW') || codeLines[j].includes('slice(0,') || codeLines[j].includes('substring')) {
        hasBoundsCheck = true; break;
      }
    }
    if (!hasBoundsCheck) concatTextDraws++;
  }
}
if (concatTextDraws > 2) warn(concatTextDraws + ' fillText calls with dynamic concatenation but no width bounds — potential text overflow');
else ok('Dynamic text width looks bounded');

// HUD region conflicts
var topCenterDraws = [];
for (var i = 0; i < codeLines.length; i++) {
  var line = codeLines[i];
  if (/fillText\(.*w\s*\/\s*2/.test(line) && /[,]\s*(badgeY|fs\s*\*|4|5|6|8|10|12)\s*[+*,)]/.test(line)) {
    var depth = 0;
    for (var j = i - 1; j >= Math.max(0, i - 10); j--) {
      if (codeLines[j].includes('}')) depth--;
      if (codeLines[j].includes('{')) depth++;
      if (depth > 0 && /if\s*\(/.test(codeLines[j])) { depth = -99; break; }
    }
    if (depth !== -99) topCenterDraws.push(i + 1);
  }
}
if (topCenterDraws.length > 1) warn(topCenterDraws.length + ' unguarded draws to top-center — potential overlap');
else ok('No HUD region conflicts detected');

// 6b2. HARDCODED VERTICAL POSITIONS — catch layout overflow risk
// Pattern: multiple fillText/fillRect using h * FRACTION for Y position
// If the fractions don't leave room for all content, things overlap
var verticalAnchors = [];
for (var i = 0; i < codeLines.length; i++) {
  var vm = codeLines[i].match(/h\s*\*\s*(0\.\d+)/g);
  if (vm) {
    for (var vi = 0; vi < vm.length; vi++) {
      var frac = parseFloat(vm[vi].match(/0\.\d+/)[0]);
      if (frac > 0.1 && frac < 0.99) verticalAnchors.push({ frac: frac, line: i + 1 });
    }
  }
}
// Check for very close Y fractions in the same function scope (potential overlap)
verticalAnchors.sort(function(a,b) { return a.frac - b.frac; });
var tightPairs = 0;
for (var i = 1; i < verticalAnchors.length; i++) {
  var gap = verticalAnchors[i].frac - verticalAnchors[i-1].frac;
  // Two anchors within 3% of screen height are suspiciously close
  if (gap > 0 && gap < 0.03 && Math.abs(verticalAnchors[i].line - verticalAnchors[i-1].line) < 30) {
    tightPairs++;
  }
}
if (tightPairs > 3) warn(tightPairs + ' pairs of Y positions within 3% of screen height — potential vertical overlap');

// ============================================================
// 6c. DUPLICATE WRAPPER VARIABLES — catch shadowed var declarations
// Multiple systems wrapping the same function with the same var name
// causes infinite recursion when concatenated into one file
var wrapperVars = {};
for (var i = 0; i < codeLines.length; i++) {
  var wm = codeLines[i].match(/^var\s+(_orig\w+)\s*=\s*(\w+)/);
  if (wm) {
    var varName = wm[1], target = wm[2];
    var key = varName;
    if (wrapperVars[key] && wrapperVars[key].target === target) {
      fail('Duplicate wrapper var "' + varName + '" for "' + target + '" at lines ' + wrapperVars[key].line + ' and ' + (i+1) + ' — will shadow and cause infinite recursion');
    } else {
      wrapperVars[key] = { target: target, line: i+1 };
    }
  }
}

// ============================================================
// 6d. CANVAS CONTEXT — check for willReadFrequently on getContext calls
// using getImageData without willReadFrequently causes console warnings
var getCtxCalls = 0, willReadCalls = 0;
for (var i = 0; i < codeLines.length; i++) {
  if (codeLines[i].includes('getImageData(')) getCtxCalls++;
  if (codeLines[i].includes('willReadFrequently')) willReadCalls++;
}
if (getCtxCalls > 0 && willReadCalls === 0) {
  warn(getCtxCalls + ' getImageData calls but no willReadFrequently option — may cause performance warnings');
}

// ============================================================
// 7. COMPLETENESS — universal
// ============================================================
console.log('\n[COMPLETENESS]');

const titleMatch = html.match(/<title>(.*?)<\/title>/);
if (titleMatch) ok('Title: ' + titleMatch[1]);
else warn('No <title> tag');

if (html.includes('gameCanvas') || html.includes('<canvas')) ok('Canvas element present');
else fail('No canvas element');

if (code.includes('requestAnimationFrame')) ok('Game loop present');
else fail('No requestAnimationFrame — no game loop');

if (code.includes("key==='m'") || code.includes("key==='M'") || code.includes('mute')) ok('Mute toggle present');
else warn('No mute toggle');

const lines = html.split('\n').length;
console.log('\n  INFO: ' + lines + ' lines total');

// ============================================================
// 8. LANDING PAGE INTEGRATION
// Check the game is registered in the suggestion dropdown and GAME_NAMES
// ============================================================
console.log('\n[LANDING PAGE]');
var gameDirName = path.basename(path.dirname(path.resolve(file)));
var indexPath = path.join(path.dirname(path.resolve(file)), '..', '..', 'index.html');
if (fs.existsSync(indexPath)) {
  var indexHtml = fs.readFileSync(indexPath, 'utf8');
  // Check suggestion dropdown
  if (indexHtml.includes('value="' + gameDirName + '"')) {
    ok('Game "' + gameDirName + '" is in the suggestion dropdown');
  } else {
    warn('Game "' + gameDirName + '" is NOT in the suggestion/feedback dropdown — players can\'t report bugs or suggest improvements for it');
  }
  // Check GAME_NAMES
  if (indexHtml.includes("'" + gameDirName + "'")) {
    ok('Game "' + gameDirName + '" is in GAME_NAMES');
  } else {
    warn('Game "' + gameDirName + '" is NOT in the GAME_NAMES map — leaderboard won\'t show its name');
  }
  // Check game card exists
  if (indexHtml.includes('games/' + gameDirName + '/')) {
    ok('Game card exists on landing page');

    // Check icon uniqueness — no two games should share the same icon
    var iconMatches = indexHtml.match(/card-icon">([^<]+)</g);
    if (iconMatches) {
      var iconMap = {}; // icon -> [game names]
      var cardRegex = /games\/([^/]+)\/.*?card-icon">([^<]+)/g;
      var cm;
      while ((cm = cardRegex.exec(indexHtml)) !== null) {
        var cGame = cm[1], cIcon = cm[2].trim();
        if (!iconMap[cIcon]) iconMap[cIcon] = [];
        iconMap[cIcon].push(cGame);
      }
      // Check if this game's icon is shared
      for (var icon in iconMap) {
        if (iconMap[icon].length > 1 && iconMap[icon].includes(gameDirName)) {
          fail('Icon "' + icon + '" is shared with: ' + iconMap[icon].filter(function(g) { return g !== gameDirName; }).join(', ') + ' — every game must have a unique icon');
        }
      }
      // If no duplicate found for this game
      var thisGameIcons = [];
      for (var ic in iconMap) { if (iconMap[ic].includes(gameDirName)) thisGameIcons.push(ic); }
      if (thisGameIcons.length > 0) {
        var isDuplicate = false;
        for (var ti = 0; ti < thisGameIcons.length; ti++) {
          if (iconMap[thisGameIcons[ti]].length > 1) isDuplicate = true;
        }
        if (!isDuplicate) ok('Game icon is unique');
      }
    }
  } else {
    warn('No game card for "' + gameDirName + '" on the landing page — game is not discoverable');
  }
} else {
  warn('Could not find index.html to check landing page integration');
}

// ============================================================
// 9. SPRITE SHOWCASE
// Check if game has unique drawing functions and is in the showcase
// ============================================================
console.log('\n[SPRITE SHOWCASE]');
var showcasePath = path.join(path.dirname(path.resolve(file)), '..', '..', 'sprites', 'showcase', 'index.html');
// Count unique draw functions (not common ones like drawHUD, drawTitle, etc.)
var commonDrawFns = ['drawHUD','drawTitle','drawGameOver','drawMenu','drawGrid','drawBackground','drawParticles','drawComplete','drawSettings','drawFormation','drawPenalties','drawEndScreen',
  // Visual engine shared functions — present in many games but not game-specific sprites
  'drawAutoTile','drawBar','drawButton','drawCreatureFrame','drawEffect','drawHumanoidFrame','drawIcon','drawPanel','drawProp','drawRobotFrame','drawTerrainTile','drawWeaponSmall','drawSpriteFrame',
  // Common game UI
  'drawHole','drawNumPad','drawWord','drawKeyboard','drawViewfinder','drawJournal','drawJournalDetail','drawPhotoNotification','drawSection','drawLightRays','drawTerrain','drawSeafloorDecor',
  'drawHooks','drawRope','drawTrail','drawHomes','drawDpad','drawDpadBtn','drawBall','drawPitch','drawTeam','drawCity','drawObjects','drawObject','drawRoads',
  'drawScore','drawMissMarks','drawWaveClear','drawStars','drawGround','drawDebris','drawSidebar','drawBoard','drawHex','drawTilePaths','drawPlayerPath','drawCurrentTile','drawNextPreview',
  'drawWin','drawGame','drawRoundRect','drawIsoBuilding','drawOcean','drawBuilding'];
var drawFns = [];
for (var i = 0; i < codeLines.length; i++) {
  var dfm = codeLines[i].match(/function (draw[A-Z]\w+)/);
  if (dfm && commonDrawFns.indexOf(dfm[1]) < 0) drawFns.push(dfm[1]);
}
var uniqueDrawFns = [...new Set(drawFns)];
if (uniqueDrawFns.length >= 3 && fs.existsSync(showcasePath)) {
  var showcaseHtml = fs.readFileSync(showcasePath, 'utf8');
  if (showcaseHtml.includes(gameDirName)) {
    ok('Game sprites referenced in showcase (' + uniqueDrawFns.length + ' draw functions)');
  } else {
    warn('Game "' + gameDirName + '" has ' + uniqueDrawFns.length + ' unique draw functions but is NOT in sprites/showcase/index.html — add sprites to the showcase');
  }
} else if (uniqueDrawFns.length === 0) {
  ok('No unique sprite functions to showcase');
}

// ============================================================
// 10. GAME-SPECIFIC EXTENSIONS
// Load test-extend.js from the game's directory if it exists.
// Extension exports a function(code, html, codeLines, {ok, warn, fail})
// ============================================================
const gameDir = path.dirname(path.resolve(file));
const extPath = path.join(gameDir, 'test-extend.js');
if (fs.existsSync(extPath)) {
  console.log('\n[GAME-SPECIFIC]');
  try {
    const ext = require(extPath);
    if (typeof ext === 'function') ext(code, html, codeLines, { ok, warn, fail });
  } catch(e) {
    warn('Extension error: ' + e.message);
  }
}

// ============================================================
// RESULT
// ============================================================
console.log('\n' + '='.repeat(50));
if (errors > 0) {
  console.log(errors + ' ERROR(S), ' + warnings + ' warning(s) — DO NOT PUSH');
  process.exit(1);
} else if (warnings > 0) {
  console.log('0 errors, ' + warnings + ' warning(s) — review warnings before pushing');
  process.exit(0);
} else {
  console.log('ALL CHECKS PASSED');
  process.exit(0);
}
