#!/usr/bin/env node
// Assemble Baby Wrangler v2 from engine + prop files + game logic
// This script reads each prop file, extracts draw/drawPost/colors,
// and generates the game HTML with proper function scoping.

const fs = require('fs');
const path = require('path');

const engine = fs.readFileSync(path.join(__dirname, '..', 'engine', 'sprites', 'sprite-forge-v2.js'), 'utf8');

// Extract info from a prop JS file
function parseProp(filename) {
  const code = fs.readFileSync(path.join(__dirname, 'props', filename), 'utf8');

  // Extract colors object
  const colorsMatch = code.match(/colors:\s*(\{[^}]+\})/);
  const colors = colorsMatch ? colorsMatch[1] : "{ body: '#888' }";

  // Extract width/height
  const wMatch = code.match(/width:\s*(\d+)/);
  const hMatch = code.match(/height:\s*(\d+)/);
  const width = wMatch ? wMatch[1] : '32';
  const height = hMatch ? hMatch[1] : '32';

  // Extract outline mode
  const olMatch = code.match(/outlineMode:\s*'([^']+)'/);
  const outlineMode = olMatch ? olMatch[1] : 'tinted';

  // Extract draw function body by brace matching
  function extractFuncBody(funcName) {
    const marker = funcName + '(pc, pal) {';
    const idx = code.indexOf(marker);
    if (idx === -1) return null;
    let start = idx + marker.length;
    let braces = 1;
    let end = start;
    for (let i = start; i < code.length; i++) {
      if (code[i] === '{') braces++;
      if (code[i] === '}') {
        braces--;
        if (braces === 0) { end = i; break; }
      }
    }
    return code.substring(start, end).trim();
  }

  return {
    width, height, colors, outlineMode,
    drawBody: extractFuncBody('draw'),
    drawPostBody: extractFuncBody('drawPost'),
  };
}

// Parse all props
const mum = parseProp('bw-mum.js');
const dad = parseProp('bw-dad.js');
const babySit = parseProp('bw-baby-sit.js');
const babyCrawl = parseProp('bw-baby-crawl.js');
const sofa = parseProp('bw-sofa.js');
const coffeeTable = parseProp('bw-coffee-table.js');
const bookshelf = parseProp('bw-bookshelf.js');
const tvStand = parseProp('bw-tv-stand.js');
const toybox = parseProp('bw-toybox.js');

// Generate a static sprite function
function staticSprite(name, prop) {
  let code = `function build${name}() {\n`;
  code += `  const pal = makePal(${prop.colors});\n`;
  code += `  return SpriteForge.static({\n`;
  code += `    width: ${prop.width}, height: ${prop.height},\n`;
  code += `    palette: pal, outlineMode: '${prop.outlineMode}',\n`;
  code += `    draw(pc, pal) {\n      ${prop.drawBody}\n    },\n`;
  if (prop.drawPostBody) {
    code += `    drawPost(pc, pal) {\n      ${prop.drawPostBody}\n    },\n`;
  }
  code += `  });\n}\n`;
  return code;
}

// Generate character sprite with idle + walk
function characterSprite(name, prop, walkExtra) {
  let code = `function build${name}() {\n`;
  code += `  const pal = makePal(${prop.colors});\n`;
  code += `  return SpriteForge.buildSheet({\n`;
  code += `    frameWidth: ${prop.width}, frameHeight: ${prop.height},\n`;
  code += `    palette: pal, outlineMode: '${prop.outlineMode}',\n`;
  code += `    animations: {\n`;
  // Idle
  code += `      idle: {\n        frames: 2, speed: 0.5, loop: true, pingpong: true,\n`;
  code += `        draw(pc, pal, t) {\n          ${prop.drawBody}\n        },\n`;
  if (prop.drawPostBody) {
    code += `        drawPost(pc, pal, t) {\n          ${prop.drawPostBody}\n        },\n`;
  }
  code += `      },\n`;
  // Walk
  code += `      walk: {\n        frames: 4, speed: 0.12, loop: true,\n`;
  code += `        draw(pc, pal, t) {\n          ${prop.drawBody}\n`;
  code += `          ${walkExtra}\n        },\n`;
  if (prop.drawPostBody) {
    code += `        drawPost(pc, pal, t) {\n          ${prop.drawPostBody}\n        },\n`;
  }
  code += `      },\n`;
  code += `    },\n  });\n}\n`;
  return code;
}

// Read the game logic template
const gameLogicPath = path.join(__dirname, '..', 'games', 'baby-wrangler', 'GAME_LOGIC.js');

// We'll generate the game logic inline since the template approach failed
const gameLogic = fs.readFileSync(path.join(__dirname, 'bw-game-logic.js'), 'utf8');

// Sprite definitions
const spriteDefs = [
  characterSprite('MumSprite', mum,
    `// Walk offset\n          const legOff = Math.round(Math.sin(t * Math.PI * 2) * 2);\n          pc.fillRect(12, 40 + legOff, 3, 5, s); pc.fillRect(18, 40 - legOff, 3, 5, s);\n          pc.fillRect(11, 44 + legOff, 4, 3, sh); pc.fillRect(18, 44 - legOff, 4, 3, sh);`
  ),
  characterSprite('DadSprite', dad,
    `// Walk offset\n          const legOff = Math.round(Math.sin(t * Math.PI * 2) * 2);\n          pc.fillRect(11, 36 + legOff, 3, 5, s); pc.fillRect(19, 36 - legOff, 3, 5, s);\n          pc.fillRect(10, 41 + legOff, 5, 3, sho); pc.fillRect(18, 41 - legOff, 5, 3, sho);\n          pc.hline(10, 43 + legOff, 5, sho + 1); pc.hline(18, 43 - legOff, 5, sho + 1);`
  ),
  staticSprite('SofaSprite', sofa),
  staticSprite('CoffeeTableSprite', coffeeTable),
  staticSprite('BookshelfSprite', bookshelf),
  staticSprite('TvStandSprite', tvStand),
  staticSprite('ToyboxSprite', toybox),
].join('\n');

// Baby sprites need special handling (different canvas sizes, crawl animation)
const babySitCode = `function buildBabySitSprite() {
  const pal = makePal(${babySit.colors});
  return SpriteForge.buildSheet({
    frameWidth: ${babySit.width}, frameHeight: ${babySit.height},
    palette: pal, outlineMode: '${babySit.outlineMode}',
    animations: {
      idle: {
        frames: 4, speed: 0.25, loop: true, pingpong: true,
        draw(pc, pal, t) {
          ${babySit.drawBody}
        },
        drawPost(pc, pal, t) {
          ${babySit.drawPostBody}
        },
      },
    },
  });
}`;

const babyCrawlCode = `function buildBabyCrawlSprite() {
  const pal = makePal(${babyCrawl.colors});
  return SpriteForge.buildSheet({
    frameWidth: ${babyCrawl.width}, frameHeight: ${babyCrawl.height},
    palette: pal, outlineMode: '${babyCrawl.outlineMode}',
    animations: {
      walk: {
        frames: 6, speed: 0.08, loop: true,
        draw(pc, pal, t) {
          const s = pal.groups.skin.startIdx + 2;
          const o = pal.groups.onesie.startIdx + 2;
          const hr = pal.groups.hair.startIdx + 2;
          const crawl = Math.round(Math.sin(t * Math.PI * 2) * 2);
          pc.fillEllipse(14, 10, 9, 4, o);
          pc.fillEllipse(7, 7, 4, 3, o);
          pc.fillEllipse(7, 6, 3, 2, o + 1);
          pc.fillCircle(24, 7, 5, s);
          pc.setPixel(22, 2, hr); pc.setPixel(23, 1, hr); pc.setPixel(24, 1, hr);
          pc.setPixel(25, 2, hr); pc.setPixel(24, 2, hr); pc.setPixel(23, 2, hr); pc.setPixel(22, 3, hr);
          pc.fillRect(20 + crawl, 13, 3, 4, s);
          pc.fillRect(16 - crawl, 14, 3, 3, s);
          pc.fillCircle(21 + crawl, 17, 1, s);
          pc.fillCircle(17 - crawl, 17, 1, s);
          pc.fillEllipse(8 - crawl, 14, 2, 2, o);
          pc.fillEllipse(4 + crawl, 14, 2, 2, o);
          pc.setPixel(9 - crawl, 16, s);
          pc.setPixel(5 + crawl, 16, s);
          pc.setPixel(26, 8, s + 1); pc.setPixel(27, 8, s + 1);
          pc.setPixel(26, 9, s - 2); pc.setPixel(27, 9, s - 2);
        },
        drawPost(pc, pal, t) {
          const e = pal.groups.eyes.startIdx;
          pc.fillCircle(26, 6, 2, e + 2); pc.setPixel(27, 6, e); pc.setPixel(26, 5, e + 3);
          pc.fillCircle(23, 6, 2, e + 2); pc.setPixel(24, 6, e); pc.setPixel(23, 5, e + 3);
        },
      },
    },
  });
}`;

// Check if game logic exists, if not just output what we have
let gameLogicCode = '';
try {
  gameLogicCode = fs.readFileSync(path.join(__dirname, 'bw-game-logic.js'), 'utf8');
} catch(e) {
  console.log('No bw-game-logic.js found — need to create it');
  console.log('Sprite assembly ready. Create tools/bw-game-logic.js with the game code.');
  console.log('Sprite functions generated:', spriteDefs.split('\n').length + babySitCode.split('\n').length + babyCrawlCode.split('\n').length, 'lines');
  process.exit(0);
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<link rel="icon" href="data:,">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Baby Wrangler</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #2a1a0a; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; font-family: 'Segoe UI', Arial, sans-serif; }
canvas { display: block; touch-action: none; width: 100vw; height: 100vh; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
'use strict';
${engine}

function makePal(colors) {
  const pal = ColorRamp.buildPalette(colors);
  pal.palette[255] = sf2_packRGBA(20, 15, 10, 255);
  return pal;
}

${spriteDefs}

${babySitCode}

${babyCrawlCode}

${gameLogicCode}
</script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '..', 'games', 'baby-wrangler', 'index.html'), html);
console.log('Built! Size:', Math.round(html.length / 1024) + 'KB, Lines:', html.split('\n').length);
