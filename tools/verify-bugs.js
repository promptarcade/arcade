// Verify all 25 Adelaide insect sprites
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = {};
global.document = { createElement: (tag) => tag === 'canvas' ? createCanvas(1, 1) : {} };

// Make node-canvas available globally for sf2_makeCanvas
global._nodeCreateCanvas = createCanvas;

const enginePath = path.join(__dirname, '..', 'engine', 'sprites', 'sprite-forge-v2.js');
let engineCode = fs.readFileSync(enginePath, 'utf8');
engineCode = engineCode.replace(
  /function sf2_makeCanvas\(w, h\) \{[^}]+\}/,
  'function sf2_makeCanvas(w, h) { return _nodeCreateCanvas(w, h); }'
);
vm.runInThisContext(engineCode);

// Load game sprite builders
const gamePath = path.join(__dirname, '..', 'games', 'bug-catcher', 'index.html');
const gameHtml = fs.readFileSync(gamePath, 'utf8');
const gameCode = gameHtml.substring(gameHtml.indexOf('<script>') + 8, gameHtml.indexOf('</script>'));
const makePalStart = gameCode.indexOf('function makePal');
const speciesStart = gameCode.indexOf('const SPECIES = [');
vm.runInThisContext(gameCode.substring(makePalStart, speciesStart));

const outDir = path.join(__dirname, '..', 'engine', 'sprites', 'verify');

function renderSheet(sheet, filename) {
  const scale = 8;
  const fw = sheet.frameWidth, fh = sheet.frameHeight;
  const cvs = createCanvas(fw * scale, fh * scale);
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#2a3a2a';
  ctx.fillRect(0, 0, cvs.width, cvs.height);
  ctx.imageSmoothingEnabled = false;
  sheet.drawFrame(ctx, 0, 0, 0, { scale });
  fs.writeFileSync(path.join(outDir, filename), cvs.toBuffer('image/png'));
}

console.log('=== VERIFYING 25 ADELAIDE INSECTS ===\n');

const builders = [
  ['Bull Ant', buildBullAntSprite],
  ['Earwig', buildEarwigSprite],
  ['Slater', buildSlaterSprite],
  ['Centipede', buildCentipedeSprite],
  ['Christmas Beetle', buildChristmasBeetleSprite],
  ['Blue-banded Bee', buildBlueBandedBeeSprite],
  ['Painted Lady', buildPaintedLadySprite],
  ['Common Brown', buildCommonBrownSprite],
  ['Emperor Gum Moth', buildEmperorGumMothSprite],
  ['Hoverfly', buildHoverflySprite],
  ['European Wasp', buildEuropeanWaspSprite],
  ['Green Tree Ant', buildGreenTreeAntSprite],
  ['Praying Mantis', buildPrayingMantisSprite],
  ['Stick Insect', buildStickInsectSprite],
  ['Cicada', buildCicadaSprite],
  ['Lerp Insect', buildLerpInsectSprite],
  ['Witchetty Grub', buildWitchettyGrubSprite],
  ['Mole Cricket', buildMoleCricketSprite],
  ['Ant Lion Larva', buildAntLionSprite],
  ['Water Strider', buildWaterStriderSprite],
  ['Diving Beetle', buildDivingBeetleSprite],
  ['Dragonfly', buildDragonflySprite],
  ['Bogong Moth', buildBogongMothSprite],
  ['Glow-worm', buildGlowWormSprite],
  ['Huntsman', buildHuntsmanSprite],
];

let ok = 0;
for (const [name, builder] of builders) {
  try {
    const result = builder();
    const fname = 'ad-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.png';
    renderSheet(result.sheet, fname);
    console.log('  OK  ' + name.padEnd(20) + result.sheet.frameWidth + 'x' + result.sheet.frameHeight);
    ok++;
  } catch(e) {
    console.log('  FAIL ' + name + ': ' + e.message);
  }
}
console.log('\n' + ok + '/25 rendered');
