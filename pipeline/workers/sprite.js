// ============================================================
// Sprite Worker — generates canvas draw code for ONE entity
// ============================================================
// BLIND: sees only a single entity's description, dimensions,
// and color palette. Does NOT know about other entities, the
// product being built, or any other pipeline step.

const { callClaudeAsync } = require('../claude-worker');
const jsSyntax = require('../validators/js-syntax');
const canvasCheck = require('../validators/canvas-check');

const SYSTEM = 'You are a pixel art code generator. Write JavaScript drawing code using the provided canvas API. Output only valid JSON matching the provided schema.';

const SCHEMA = {
  type: 'object',
  properties: {
    drawBody: { type: 'string', minLength: 20 },
  },
  required: ['drawBody'],
};

function buildPrompt(entity) {
  const colorList = Object.entries(entity.colors)
    .map(([name, hex]) => `  ${name}: "${hex}"`)
    .join('\n');

  const isTerrain = entity.role === 'terrain';
  const coverageReq = isTerrain ? '100% (fill every pixel — this tiles seamlessly)' : '40%';
  const terrainNote = isTerrain ? '\nThis is a TERRAIN TILE — it must fill the ENTIRE canvas with no transparent pixels. Add texture variation (noise, color patches) so it looks natural when tiled.' : '';

  return `Write JavaScript drawing code for a ${entity.width}x${entity.height} pixel art image.

Subject: "${entity.description}"${terrainNote}

Colors available:
${colorList}

API — the code receives (pc, pal):
pc methods: fillRect(x,y,w,h,idx), fillEllipse(cx,cy,rx,ry,idx), fillCircle(cx,cy,r,idx), fillTriangle(x1,y1,x2,y2,x3,y3,idx), hline(x,y,len,idx), vline(x,y,len,idx), setPixel(x,y,idx), scatterNoise(x,y,w,h,idx,density)

Color indexing: pal.groups.{colorName}.startIdx gives base index. +0=darkest, +1=dark, +2=light, +3=lightest.

Canvas: ${entity.width}w x ${entity.height}h. Origin (0,0) top-left.

Rules:
- Use startIdx+0 through +3 for 4-tone shading per color
- Lighter tones top-left, darker bottom-right
- Fill at least ${coverageReq} of pixels
- Use at least 3 color groups
- ONLY use the pc methods listed above. Do NOT reference any undefined variables.
- Store palette indices in local variables: const myColor = pal.groups.colorName.startIdx;

Output:
- drawBody: ALL drawing code in a single block. Include everything: base shapes, details, eyes, texture noise. Everything goes here.

Return function body string only, not a declaration.`;
}

async function sprite(entity, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`  [SPRITE:${entity.name}] Generating draw code (${entity.width}x${entity.height})${attempt > 1 ? ` (attempt ${attempt})` : ''}...`);

    let result;
    try {
      result = await callClaudeAsync({
        prompt: buildPrompt(entity),
        systemPrompt: SYSTEM,
        schema: SCHEMA,
        model: 'haiku',
        budgetUsd: 0.10,
      });
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      console.error(`  [SPRITE:${entity.name}] API error: ${err.message.slice(0, 100)}`);
      continue;
    }

    const { drawBody } = result.data;
    const errors = [];

    // JS syntax check
    const syntaxResult = jsSyntax.validate(drawBody, {
      wrapInFunction: true,
      apiPrefix: 'pc',
      minApiCalls: 3,
    });
    if (!syntaxResult.valid) errors.push(...syntaxResult.errors);

    // Canvas render check
    let renderCoverage = 0, renderColors = 0;
    if (errors.length === 0) {
      const renderResult = canvasCheck.validateSprite(
        drawBody,
        '',
        entity.width,
        entity.height,
        entity.colors
      );
      if (!renderResult.valid) errors.push(...renderResult.errors);
      renderCoverage = renderResult.coverage;
      renderColors = renderResult.colorCount;
    }

    if (errors.length > 0) {
      console.error(`  [SPRITE:${entity.name}] Validation failed: ${errors[0]}`);
      if (attempt === maxAttempts) {
        throw new Error(`Sprite "${entity.name}" failed after ${maxAttempts} attempts: ${errors.join('; ')}`);
      }
      continue;
    }

    console.log(`  [SPRITE:${entity.name}] OK — coverage: ${renderCoverage}%, colors: ${renderColors}`);

    return {
      name: entity.name,
      width: entity.width,
      height: entity.height,
      colors: entity.colors,
      drawBody,
      drawPostBody: '',
      cost: result.cost,
    };
  }
}

module.exports = sprite;
