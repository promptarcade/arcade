#!/usr/bin/env node
// ============================================================
// Sprite Lab — generic CLI for rendering and verifying sprites
// ============================================================
//
// USAGE:
//
//   # Render a character with any style/hair/colors
//   node tools/sprite-lab.js character chibi
//   node tools/sprite-lab.js character tall --hair flowing --shirt '#dd55aa' --skin '#ffd5a0'
//   node tools/sprite-lab.js character heroic --hair mohawk --shirt '#ee6644' --name warrior
//
//   # Render a creature
//   node tools/sprite-lab.js creature --body '#66aa44' --eyes '#ffffff' --size 32
//   node tools/sprite-lab.js creature --body '#884422' --legs 8 --name spider
//
//   # Render a static prop from a JS file with a draw function
//   node tools/sprite-lab.js static tools/props/fridge.js
//
//   # Scan a game file — extract and render ALL SpriteForge calls
//   node tools/sprite-lab.js game games/home-hustle/index.html
//
//   # Render all 5 character styles side-by-side for comparison
//   node tools/sprite-lab.js compare-styles
//
//   # Render all hair styles on a given body style
//   node tools/sprite-lab.js compare-hair chibi
//   node tools/sprite-lab.js compare-hair tall --shirt '#cc4444'
//
//   # List available options
//   node tools/sprite-lab.js help
//
// OUTPUT: engine/sprites/verify/*.png

const lab = require('./sprite-lab-core');
const { SpriteForge, PixelCanvas, PostProcess, ColorRamp, makePal } = lab;
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// ============================================================
// STYLE PROFILES + QA KNOWLEDGE
// ============================================================

const StyleProfiles = require('../engine/sprites/style-profiles');
const QA_PATH = path.join(__dirname, '..', 'engine', 'sprites', 'qa-knowledge.json');

function loadQAKnowledge() {
  if (!fs.existsSync(QA_PATH)) return { principles: [], categories: {} };
  return JSON.parse(fs.readFileSync(QA_PATH, 'utf8'));
}

function getKnowledgeForEntity(entityType, entityName) {
  const kb = loadQAKnowledge();
  const catMap = { character: 'characters', creature: 'creatures', prop: 'props', terrain: 'terrain', effect: 'effects' };
  const catKey = catMap[entityType] || 'props';
  const relevant = {
    principles: kb.principles || [],
    specific: (kb.categories[catKey] || []).filter(e => e.entity === entityName || e.entity === entityType),
  };
  return relevant;
}

function printPriorKnowledge(entityType, entityName) {
  const knowledge = getKnowledgeForEntity(entityType, entityName);
  if (knowledge.principles.length > 0 || knowledge.specific.length > 0) {
    console.log('\n--- Prior QA Knowledge ---');
    knowledge.principles.forEach(p => console.log('  [principle] ' + p.issue));
    knowledge.specific.forEach(e => console.log('  [known] ' + e.issue));
    console.log('');
  }
  return knowledge;
}

function runVerification(pngPath, entityType, entityName, styleTier) {
  const verifyScript = path.join(__dirname, 'sprite-verify.js');
  const cmd = 'node "' + verifyScript + '" "' + pngPath + '" --expect ' + entityType + ' --name ' + entityName + ' --style ' + styleTier;
  try {
    const output = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
    console.log(output);
    return true;
  } catch (err) {
    console.log(err.stdout || '');
    console.error(err.stderr || '');
    return false;
  }
}

// ============================================================
// CLI PARSING
// ============================================================

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
  printHelp();
  process.exit(0);
}

const command = args[0];

function getFlag(name, fallback) {
  var idx = args.indexOf('--' + name);
  if (idx === -1) return fallback;
  return args[idx + 1] || fallback;
}

function hasFlag(name) {
  return args.indexOf('--' + name) !== -1;
}

// ============================================================
// COMMANDS
// ============================================================

switch (command) {
  case 'character': cmdCharacter(); break;
  case 'creature': cmdCreature(); break;
  case 'static': cmdStatic(); break;
  case 'game': cmdGame(); break;
  case 'compare-styles': cmdCompareStyles(); break;
  case 'compare-hair': cmdCompareHair(); break;
  case 'verify': cmdVerify(); break;
  case 'profiles': cmdProfiles(); break;
  default:
    console.error('Unknown command: ' + command);
    console.error('Run with "help" for usage.');
    process.exit(1);
}

// ============================================================
// character — render a character with CLI-specified options
// ============================================================
function cmdCharacter() {
  var style = args[1] || 'chibi';
  var hair = getFlag('hair', 'short');
  var skin = getFlag('skin', '#ffcc99');
  var hairCol = getFlag('hair-color', '#664422');
  var shirt = getFlag('shirt', '#4488cc');
  var pants = getFlag('pants', '#445566');
  var shoes = getFlag('shoes', '#443322');
  var eyes = getFlag('eyes', '#4488ff');
  var name = getFlag('name', style + '-' + hair);
  var outFile = getFlag('out', 'char-' + name + '.png');

  console.log('Character: style=' + style + ', hair=' + hair);
  var result = SpriteForge.character({
    style: style,
    body: { hair: hair },
    colors: { skin, hair: hairCol, shirt, pants, shoes, eyes },
    animations: { idle: { frames: 4, speed: 0.25 }, walk: { frames: 6, speed: 0.1 } },
  });
  lab.renderSheet(result, outFile);
  console.log('Done.');
}

// ============================================================
// creature — render a creature
// ============================================================
function cmdCreature() {
  var bodyCol = getFlag('body', '#66aa44');
  var eyesCol = getFlag('eyes', '#ffffff');
  var size = parseInt(getFlag('size', '32'));
  var legs = parseInt(getFlag('legs', '4'));
  var name = getFlag('name', 'creature');
  var outFile = getFlag('out', 'creature-' + name + '.png');
  var bodyType = getFlag('type', 'blob');

  console.log('Creature: type=' + bodyType + ', legs=' + legs + ', size=' + size);
  var result = SpriteForge.creature({
    size: size,
    bodyType: bodyType,
    legs: legs,
    colors: { body: bodyCol, eyes: eyesCol },
    animations: { idle: { frames: 4, speed: 0.2 }, walk: { frames: 4, speed: 0.12 } },
  });
  lab.renderSheet(result, outFile);
  console.log('Done.');
}

// ============================================================
// static — render a static prop from a JS file
// ============================================================
function cmdStatic() {
  var filePath = args[1];
  if (!filePath) {
    console.error('Usage: sprite-lab.js static <path-to-draw-script.js>');
    console.error('The script should module.exports = { width, height, colors, draw(pc, pal), drawPost(pc, pal) }');
    process.exit(1);
  }

  var absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.error('File not found: ' + absPath);
    process.exit(1);
  }

  var def = require(absPath);
  var name = getFlag('name', path.basename(filePath, '.js'));
  var outFile = getFlag('out', 'static-' + name + '.png');
  var style = getFlag('style', def.style || 'chibi');
  var entityType = def.entityType || 'prop';
  var skipVerify = hasFlag('no-verify');

  // Validate against style profile
  var w = def.width || 32;
  var h = def.height || 32;
  var validation = StyleProfiles.validate(style, entityType, w, h);
  if (!validation.valid) {
    console.warn('Style profile warnings:');
    validation.issues.forEach(function(issue) { console.warn('  ! ' + issue); });
    var rec = StyleProfiles.getRecommendedSize(style, entityType);
    console.warn('  Recommended: ' + rec.w + 'x' + rec.h);
  }

  // Consult prior QA knowledge
  printPriorKnowledge(entityType, name);

  // Get tone count from style profile
  var profile = StyleProfiles.get(style);
  var toneCount = (def.toneCount || profile.palette.tonesPerColor);

  console.log('Static: ' + name + ' (' + w + 'x' + h + ') [' + style + ', ' + toneCount + ' tones]');
  var result = SpriteForge.static({
    width: w,
    height: h,
    palette: makePal(def.colors || { body: '#888888' }, { toneCount: toneCount }),
    outlineMode: def.outlineMode || 'tinted',
    draw: def.draw,
    drawPost: def.drawPost,
  });
  lab.renderStatic(result, outFile);

  // Auto-verify unless skipped
  if (!skipVerify) {
    var pngPath = path.join(lab.outDir, outFile);
    console.log('\nRunning verification...');
    runVerification(pngPath, entityType, name, style);
  }

  console.log('Done.');
}

// ============================================================
// game — scan a game HTML and render all SpriteForge calls
// ============================================================
function cmdGame() {
  var gamePath = args[1];
  if (!gamePath) {
    console.error('Usage: sprite-lab.js game <path-to-game/index.html>');
    process.exit(1);
  }

  var absPath = path.resolve(gamePath);
  if (!fs.existsSync(absPath)) {
    console.error('File not found: ' + absPath);
    process.exit(1);
  }

  var html = fs.readFileSync(absPath, 'utf8');
  var gameName = path.basename(path.dirname(absPath));
  console.log('Scanning ' + gameName + ' for SpriteForge calls...\n');

  var count = 0;

  // Find SpriteForge.character() calls
  var charPattern = /SpriteForge\.character\(\{([\s\S]*?)\}\)/g;
  var match;
  while ((match = charPattern.exec(html)) !== null) {
    try {
      var config = evalConfig(match[0].replace('SpriteForge.character(', '').replace(/\)$/, ''));
      var label = describeCharacter(config);
      var outFile = gameName + '-char-' + count + '.png';
      console.log('Character #' + count + ': ' + label);
      var result = SpriteForge.character(config);
      lab.renderSheet(result, outFile);
      count++;
    } catch (e) {
      console.log('  (skipped — could not parse: ' + e.message + ')');
    }
  }

  // Find SpriteForge.creature() calls
  var creatPattern = /SpriteForge\.creature\(\{([\s\S]*?)\}\)/g;
  while ((match = creatPattern.exec(html)) !== null) {
    try {
      var config = evalConfig(match[0].replace('SpriteForge.creature(', '').replace(/\)$/, ''));
      var outFile = gameName + '-creature-' + count + '.png';
      console.log('Creature #' + count);
      var result = SpriteForge.creature(config);
      lab.renderSheet(result, outFile);
      count++;
    } catch (e) {
      console.log('  (skipped — could not parse: ' + e.message + ')');
    }
  }

  if (count === 0) {
    console.log('No SpriteForge.character() or .creature() calls found.');
    console.log('This game may use buildSheet() with custom draw functions (not auto-extractable).');
  } else {
    console.log('\nRendered ' + count + ' sprite(s) from ' + gameName + '.');
  }
}

function evalConfig(configStr) {
  // Safely evaluate the config object literal
  // Add quotes around bare keys if needed, handle trailing commas
  try {
    return (new Function('return (' + configStr + ')'))();
  } catch (e) {
    throw new Error('Config eval failed: ' + e.message);
  }
}

function describeCharacter(config) {
  var parts = [];
  if (config.style) parts.push(config.style);
  if (config.body && config.body.hair) parts.push(config.body.hair + ' hair');
  if (config.colors && config.colors.shirt) parts.push('shirt=' + config.colors.shirt);
  return parts.join(', ') || 'default';
}

// ============================================================
// compare-styles — all 5 body styles side by side
// ============================================================
function cmdCompareStyles() {
  var hair = getFlag('hair', 'short');
  var shirt = getFlag('shirt', '#4488cc');
  var styles = ['mini', 'retro', 'chibi', 'tall', 'heroic'];
  var items = [];

  console.log('Comparing all styles (hair=' + hair + '):');
  styles.forEach(function(style) {
    var result = SpriteForge.character({
      style: style,
      body: { hair: hair },
      colors: { skin: '#ffcc99', hair: '#664422', shirt: shirt, pants: '#445566', shoes: '#443322', eyes: '#4488ff' },
      animations: { idle: { frames: 1, speed: 1 } },
    });
    items.push({ label: style, result: result });
  });

  lab.renderComposite(items, 'compare-styles.png');
  console.log('Done.');
}

// ============================================================
// compare-hair — all hair styles on one body style
// ============================================================
function cmdCompareHair() {
  var style = args[1] || 'chibi';
  var shirt = getFlag('shirt', '#44aa66');
  var hairs = ['short', 'spiky', 'long', 'flowing', 'ponytail', 'mohawk', 'bun', 'bob', 'none'];
  var items = [];

  console.log('Comparing hair styles on ' + style + ':');
  hairs.forEach(function(h) {
    var result = SpriteForge.character({
      style: style,
      body: { hair: h },
      colors: { skin: '#ffcc99', hair: '#884422', shirt: shirt, pants: '#445566', shoes: '#443322', eyes: '#4488ff' },
      animations: { idle: { frames: 1, speed: 1 } },
    });
    items.push({ label: h, result: result });
  });

  lab.renderComposite(items, 'compare-hair-' + style + '.png');
  console.log('Done.');
}

// ============================================================
// verify — run QA verification on an existing sprite PNG
// ============================================================
function cmdVerify() {
  var pngFile = args[1];
  if (!pngFile) {
    console.error('Usage: sprite-lab.js verify <png-path> [--expect <type>] [--name <name>] [--style <style>]');
    process.exit(1);
  }

  var absPath = path.resolve(pngFile);
  if (!fs.existsSync(absPath)) {
    // Try in verify directory
    absPath = path.join(lab.outDir, pngFile);
    if (!fs.existsSync(absPath)) {
      console.error('File not found: ' + pngFile);
      process.exit(1);
    }
  }

  var entityType = getFlag('expect', 'prop');
  var name = getFlag('name', path.basename(pngFile, '.png'));
  var style = getFlag('style', 'chibi');

  var passed = runVerification(absPath, entityType, name, style);
  process.exit(passed ? 0 : 1);
}

// ============================================================
// profiles — list available style profiles
// ============================================================
function cmdProfiles() {
  var profiles = StyleProfiles.list();
  console.log('\nAvailable Style Profiles:\n');
  profiles.forEach(function(p) {
    console.log('  ' + p.key.toUpperCase() + ' — ' + p.name);
    console.log('    ' + p.description);
    console.log('    Character size: ' + p.characterSize.w + 'x' + p.characterSize.h);
    console.log('    Reference: ' + p.referenceGames.join(', '));
    console.log('');
  });
}

// ============================================================
// HELP
// ============================================================
function printHelp() {
  console.log(`
SPRITE LAB — generic CLI for rendering and verifying sprites

COMMANDS:

  character [style]     Render a character sprite sheet
    Styles: mini, retro, chibi, tall, heroic (default: chibi)
    --hair <style>      short, spiky, long, flowing, ponytail, mohawk, bun, bob, none
    --shirt <hex>       Shirt color (default: #4488cc)
    --pants <hex>       Pants color
    --skin <hex>        Skin color
    --hair-color <hex>  Hair color
    --eyes <hex>        Eye color
    --shoes <hex>       Shoe color
    --name <name>       Output filename label
    --out <file.png>    Custom output filename

  creature              Render a creature sprite sheet
    --body <hex>        Body color (default: #66aa44)
    --eyes <hex>        Eye color
    --size <px>         Canvas size (default: 32)
    --legs <n>          Number of legs (default: 4)
    --type <type>       Body type: blob, insect, quadruped
    --name <name>       Output filename label

  static <script.js>    Render a static prop from a draw script
    Script exports: { width, height, colors, draw(pc, pal), drawPost(pc, pal) }
    --style <tier>      Style profile: pixel, chibi, illustrated, hd (validates size)
    --no-verify         Skip auto-verification after rendering

  verify <png-path>     Run QA verification on an existing sprite PNG
    --expect <type>     Entity type: character, creature, prop, terrain, effect
    --name <name>       Entity name for knowledge base lookup
    --style <tier>      Style tier for quality thresholds

  profiles              List available style profiles and their constraints

  game <game.html>      Scan a game file, extract & render all SpriteForge calls

  compare-styles        Render all 5 body styles side-by-side
    --hair <style>      Hair style to use (default: short)
    --shirt <hex>       Shirt color

  compare-hair [style]  Render all 9 hair styles on one body style
    --shirt <hex>       Shirt color

OUTPUT: engine/sprites/verify/*.png
  `);
}
