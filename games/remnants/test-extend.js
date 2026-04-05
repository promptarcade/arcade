// ============================================================
// Wanderlust — game-specific static analysis extensions
// Loaded by tools/test-game.js when testing this game
// ============================================================
module.exports = function(code, html, codeLines, t) {
  // Check enemy type/sprite references
  var enemiesMatch = code.match(/ENEMIES\s*:\s*\{([\s\S]*?)\n\s*\}/);
  var spriteGenMatch = code.match(/(?:gameSprites|sprites)\.enemies\s*=\s*\{([\s\S]*?)\n\s*\};/);
  if (enemiesMatch && spriteGenMatch) {
    var typeRegex = /^\s+(\w+)\s*:/gm;
    var spriteRegex = /\b(\w+)\s*:\s*SpriteForge/g;
    var enemyNames = [], spriteNames = [], m;
    while ((m = typeRegex.exec(enemiesMatch[1])) !== null) {
      if (!['name','hp','speed','radius','color','reward','lives','armor','disableRange','disableDur'].includes(m[1])) enemyNames.push(m[1]);
    }
    while ((m = spriteRegex.exec(spriteGenMatch[1])) !== null) spriteNames.push(m[1]);
    for (var en of enemyNames) {
      if (!spriteNames.includes(en)) t.fail('Enemy "' + en + '" has no sprite');
    }
    if (enemyNames.every(function(n) { return spriteNames.includes(n); })) t.ok('All enemy sprites present');
  }

  // Check tower type/button alignment
  var towersMatch = code.match(/TOWERS\s*:\s*\[([\s\S]*?)\]/);
  if (towersMatch) {
    var towerCount = (towersMatch[1].match(/name\s*:/g) || []).length;
    var towerBtns = (html.match(/selectTower\(\d+\)/g) || []);
    var maxIdx = towerBtns.reduce(function(max, b) { var n = parseInt(b.match(/\d+/)[0]); return n > max ? n : max; }, -1);
    if (maxIdx >= towerCount) t.fail('Tower button references index ' + maxIdx + ' but only ' + towerCount + ' towers defined');
    else if (towerCount > 0) t.ok(towerCount + ' towers defined, ' + towerBtns.length + ' buttons');
  }

  // Wanderlust: verify all buildNpcDialogue wrappers have unique variable names
  var dialogueWrappers = [];
  for (var i = 0; i < codeLines.length; i++) {
    var dm = codeLines[i].match(/var\s+(\w+)\s*=\s*(?:typeof\s+)?buildNpcDialogue/);
    if (dm) dialogueWrappers.push({ name: dm[1], line: i + 1 });
  }
  if (dialogueWrappers.length > 1) {
    var names = dialogueWrappers.map(function(w) { return w.name; });
    var unique = names.filter(function(n, i) { return names.indexOf(n) === i; });
    if (unique.length < names.length) {
      t.fail('Duplicate buildNpcDialogue wrapper vars: ' + names.join(', ') + ' — will cause infinite recursion');
    } else {
      t.ok(dialogueWrappers.length + ' buildNpcDialogue wrappers, all unique names');
    }
  }

  // Wanderlust: verify all blueprint IDs in BUILD_CATEGORIES exist in BlueprintRegistry
  var bpIds = [];
  var bpIdRegex = /BlueprintRegistry\.add\(\{[\s\S]*?id:\s*'([^']+)'/g;
  var bm;
  while ((bm = bpIdRegex.exec(code)) !== null) bpIds.push(bm[1]);
  var catIdRegex = /ids:\s*\[([^\]]+)\]/g;
  var catIds = [];
  while ((bm = catIdRegex.exec(code)) !== null) {
    var idList = bm[1].match(/'([^']+)'/g);
    if (idList) idList.forEach(function(id) { catIds.push(id.replace(/'/g, '')); });
  }
  var missingBp = catIds.filter(function(id) { return bpIds.indexOf(id) < 0; });
  if (missingBp.length > 0) {
    t.fail('Build categories reference missing blueprints: ' + missingBp.join(', '));
  } else if (catIds.length > 0) {
    t.ok('All ' + catIds.length + ' categorised blueprints exist');
  }

  // Wanderlust: verify obelisk tier costs reference valid resource IDs
  var resIds = [];
  var resRegex = /ResourceRegistry\.add\(\{[^}]*id:\s*'([^']+)'/g;
  while ((bm = resRegex.exec(code)) !== null) resIds.push(bm[1]);
  var tierCostRegex = /TIER_COSTS[\s\S]*?\[[\s\S]*?\]/;
  var tierMatch = code.match(tierCostRegex);
  if (tierMatch) {
    var costIds = [];
    var cidRegex = /(\w+)\s*:/g;
    while ((bm = cidRegex.exec(tierMatch[0])) !== null) {
      var cid = bm[1];
      if (cid !== 'dungeon_heart' && cid !== 'TIER_COSTS' && resIds.indexOf(cid) < 0 && bpIds.indexOf(cid) < 0) {
        // Might be a resource we haven't registered — only flag if it's not a common one
        if (['stone','oak_log','iron_bar','copper_bar','plank','gold_bar','gem','feast',
            'crystal_fire','crystal_ice','crystal_lightning','crystal_void',
            'crystal_sword','enchanted_armor'].indexOf(cid) < 0) {
          t.warn('Obelisk tier cost references unknown resource: ' + cid);
        }
      }
    }
  }

  // Verify F-keys have preventDefault if used as hotkeys
  var usesFKeys = code.match(/key\s*===\s*'F\d+'/g);
  var hasPreventF = code.includes("key[0] === 'F'") || code.includes("key.indexOf('F')") ||
    (code.includes('preventDefault') && (code.includes("'F'") || code.includes('F1')));
  if (usesFKeys && usesFKeys.length > 0 && !hasPreventF) {
    t.fail(usesFKeys.length + ' F-key hotkeys but no preventDefault for F-keys — browser will intercept');
  } else if (usesFKeys && usesFKeys.length > 0) {
    t.ok('F-key hotkeys have preventDefault coverage');
  }

  // Verify startGame doesn't reference variables from drawTitle scope
  var startGameMatch = code.match(/startGame\s*=\s*function[\s\S]*?\n\};/);
  if (startGameMatch) {
    var sgBody = startGameMatch[0];
    if (sgBody.includes('selWpn')) {
      t.fail('startGame references selWpn — variable only exists in drawTitle scope');
    }
  }
};
