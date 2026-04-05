// ============================================================
// Research Worker — triple-blind benchmark extraction
// ============================================================
// BLIND: sees only genre + mechanics keywords. Does not know
// about the product being built, other workers, or the pipeline.
// Runs 3 independent calls with different models for consensus.

const { callClaude } = require('../claude-worker');
const { validate } = require('../validators/schema');
const consensus = require('../validators/consensus');

const SYSTEM = 'You are a product analyst. Provide factual analysis based on existing successful products. Output only valid JSON matching the provided schema.';

const SCHEMA = {
  type: 'object',
  properties: {
    products: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          entityCount: { type: 'integer', minimum: 1 },
          sessionLengthSeconds: { type: 'integer', minimum: 10 },
          mechanicCount: { type: 'integer', minimum: 1 },
          difficultyRamp: {
            type: 'string',
            enum: ['linear', 'exponential', 'stepped', 'adaptive'],
          },
        },
        required: ['name', 'entityCount', 'sessionLengthSeconds', 'mechanicCount', 'difficultyRamp'],
      },
      minItems: 3,
      maxItems: 5,
    },
    benchmarks: {
      type: 'object',
      properties: {
        avgEntityCount: { type: 'integer', minimum: 1 },
        commonMechanics: { type: 'array', items: { type: 'string' }, minItems: 2 },
        avgSessionLength: { type: 'integer', minimum: 10 },
        recommendedDifficulty: { type: 'string' },
      },
      required: ['avgEntityCount', 'commonMechanics', 'avgSessionLength', 'recommendedDifficulty'],
    },
  },
  required: ['products', 'benchmarks'],
};

const MODELS = ['haiku', 'haiku', 'haiku'];

function buildPrompt(genre, mechanics) {
  return `For the interactive entertainment genre "${genre}" with core mechanics [${mechanics.join(', ')}], identify 3-5 successful existing products.

For each product, provide:
- name: the product's actual name
- entityCount: number of distinct visual entity types in the product
- sessionLengthSeconds: typical single session duration in seconds
- mechanicCount: number of distinct interaction mechanics
- difficultyRamp: how difficulty increases (linear, exponential, stepped, or adaptive)

Then provide aggregated benchmarks:
- avgEntityCount: average entity count across the products
- commonMechanics: array of mechanics shared by most products
- avgSessionLength: average session length in seconds
- recommendedDifficulty: most common difficulty ramp pattern`;
}

async function research(genre, mechanics) {
  console.log(`[RESEARCH] Triple-blind benchmark extraction for genre: "${genre}"...`);

  // Run 3 independent calls in parallel (sequential for simplicity in POC)
  const results = [];
  let totalCost = 0;

  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    console.log(`  [RESEARCH:${model}] Querying...`);

    try {
      const result = callClaude({
        prompt: buildPrompt(genre, mechanics),
        systemPrompt: SYSTEM,
        schema: SCHEMA,
        model,
        budgetUsd: 0.30,
      });

      // Validate individual response schema
      const v = validate(result.data, SCHEMA);
      if (v.valid) {
        results.push(result.data);
        totalCost += result.cost;
        console.log(`  [RESEARCH:${model}] OK — ${result.data.products.length} products, avgEntities: ${result.data.benchmarks.avgEntityCount}`);
      } else {
        console.error(`  [RESEARCH:${model}] Schema invalid: ${v.errors.join('; ')}`);
      }
    } catch (err) {
      console.error(`  [RESEARCH:${model}] Failed: ${err.message.slice(0, 100)}`);
    }
  }

  if (results.length < 2) {
    throw new Error(`Research failed: only ${results.length}/3 workers returned valid results`);
  }

  // Check consensus
  // Pad to 3 if one failed (use duplicate of first as fallback)
  while (results.length < 3) results.push(results[0]);

  const c = consensus.validate(results);
  if (!c.valid) {
    console.error(`  [RESEARCH] Consensus failed: ${c.errors.join('; ')}`);
    console.error(`  [RESEARCH] Disagreements: ${c.disagreements.join('; ')}`);
    throw new Error(`Research consensus failed: ${c.errors.join('; ')}`);
  }

  console.log(`[RESEARCH] Consensus OK — score: ${c.score}/4, entities: ${c.merged.avgEntityCount}, mechanics: [${c.merged.commonMechanics.join(', ')}]`);
  return { benchmarks: c.merged, cost: totalCost };
}

module.exports = research;
