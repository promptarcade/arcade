// ============================================================
// Shape Worker — renders a geometric shape to pixel art
// ============================================================
// BLIND: sees only a geometric description and colors.
// "tall narrow rectangle with cool blue theme" — could be anything.

const { callClaudeAsync } = require('../../claude-worker');
const jsSyntax = require('../../validators/js-syntax');
const canvasCheck = require('../../validators/canvas-check');

const SYSTEM = 'You are a pixel art renderer. Draw the described geometric shape using the provided canvas API and colors. Output only valid JSON.';

const SCHEMA = {
  type: 'object',
  properties: {
    drawBody: { type: 'string', minLength: 20 },
  },
  required: ['drawBody'],
};

async function shape(shapeSpec, colors, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`  [SHAPE:${shapeSpec.id}] Rendering (${shapeSpec.w}x${shapeSpec.h})${attempt > 1 ? ` (attempt ${attempt})` : ''}...`);

    let result;
    try {
      result = await callClaudeAsync({
        prompt: `Draw a ${shapeSpec.w}x${shapeSpec.h} pixel art shape: "${shapeSpec.description}"

Colors: base="${colors.base}", light="${colors.light}", dark="${colors.dark}", accent="${colors.accent}"

API — receives (pc, pal):
pc methods: fillRect(x,y,w,h,idx), fillEllipse(cx,cy,rx,ry,idx), fillCircle(cx,cy,r,idx), hline(x,y,len,idx), vline(x,y,len,idx), setPixel(x,y,idx), scatterNoise(x,y,w,h,idx,density)

Color indexing: pal.groups.{base|light|dark|accent}.startIdx + (0=darkest, 1=dark, 2=light, 3=lightest)

Canvas: ${shapeSpec.w}w x ${shapeSpec.h}h. (0,0) is top-left.
${shapeSpec.tile ? 'This tiles seamlessly — fill EVERY pixel.' : 'Fill at least 30% of the canvas.'}

Output drawBody: the complete drawing code as a string.`,
        systemPrompt: SYSTEM,
        schema: SCHEMA,
        model: 'haiku',
        budgetUsd: 0.05,
      });
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      continue;
    }

    const { drawBody } = result.data;
    const errors = [];

    const syntax = jsSyntax.validate(drawBody, { wrapInFunction: true, apiPrefix: 'pc', minApiCalls: 2 });
    if (!syntax.valid) errors.push(...syntax.errors);

    if (errors.length === 0) {
      const render = canvasCheck.validateSprite(drawBody, '', shapeSpec.w, shapeSpec.h, colors);
      if (!render.valid) errors.push(...render.errors);
    }

    if (errors.length > 0) {
      console.error(`  [SHAPE:${shapeSpec.id}] Failed: ${errors[0]}`);
      if (attempt === maxAttempts) throw new Error(`Shape "${shapeSpec.id}" failed: ${errors.join('; ')}`);
      continue;
    }

    console.log(`  [SHAPE:${shapeSpec.id}] OK`);
    return { id: shapeSpec.id, w: shapeSpec.w, h: shapeSpec.h, colors, drawBody, tile: !!shapeSpec.tile, cost: result.cost };
  }
}

module.exports = shape;
