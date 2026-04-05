// ============================================================
// Palette Worker — generates colors from a theme description
// ============================================================
// BLIND: sees only a color mood string. No domain context.

const { callClaudeAsync } = require('../../claude-worker');

const SYSTEM = 'You are a color palette generator. Output 4 named hex colors for the given visual theme. Output only valid JSON.';

const SCHEMA = {
  type: 'object',
  properties: {
    base: { type: 'string' },
    light: { type: 'string' },
    dark: { type: 'string' },
    accent: { type: 'string' },
  },
  required: ['base', 'light', 'dark', 'accent'],
};

async function palette(theme) {
  const result = await callClaudeAsync({
    prompt: `Generate a 4-color palette for this visual theme: "${theme}". Output: base (main color), light (highlight), dark (shadow), accent (contrast detail).`,
    systemPrompt: SYSTEM,
    schema: SCHEMA,
    model: 'haiku',
    budgetUsd: 0.05,
  });

  const colors = result.data;

  // Validate hex format
  for (const [name, hex] of Object.entries(colors)) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      throw new Error(`Palette color "${name}" invalid hex: ${hex}`);
    }
  }

  return { colors, cost: result.cost };
}

module.exports = palette;
