// Cooking Skill — food recipes from farmed crops, gathered ingredients, hunted resources

// --- Skill ---
SkillRegistry.add({ id: 'cooking', name: 'Cooking', color: '#dd8833', tileIds: [] });

// --- Food Resources ---
ResourceRegistry.add({ id: 'bread', name: 'Bread', color: '#ddaa55', category: 'food', stackMax: 50 });
ResourceRegistry.add({ id: 'veggie_stew', name: 'Veggie Stew', color: '#88aa44', category: 'food', stackMax: 20 });
ResourceRegistry.add({ id: 'berry_pie', name: 'Berry Pie', color: '#aa44aa', category: 'food', stackMax: 20 });
ResourceRegistry.add({ id: 'roast_meat', name: 'Roast Meat', color: '#cc6633', category: 'food', stackMax: 30 });
ResourceRegistry.add({ id: 'mushroom_soup', name: 'Mushroom Soup', color: '#887744', category: 'food', stackMax: 20 });
ResourceRegistry.add({ id: 'feast', name: 'Grand Feast', color: '#ffcc44', category: 'food', stackMax: 5 });

// --- Recipes ---
RecipeRegistry.addAll([
  // Level 1
  {
    skill: 'cooking',
    level: 1,
    name: 'Bread',
    input: { wheat: 3 },
    output: { bread: 2 },
    requires: []
  },
  {
    skill: 'cooking',
    level: 1,
    name: 'Roast Meat',
    input: { leather: 2 },
    output: { roast_meat: 1 },
    requires: []
  },
  // Level 2
  {
    skill: 'cooking',
    level: 2,
    name: 'Veggie Stew',
    input: { carrot: 2, wheat: 1 },
    output: { veggie_stew: 1 },
    requires: ['Bread']
  },
  {
    skill: 'cooking',
    level: 2,
    name: 'Mushroom Soup',
    input: { red_mushroom: 1, brown_mushroom: 1 },
    output: { mushroom_soup: 1 },
    requires: ['Bread']
  },
  // Level 3
  {
    skill: 'cooking',
    level: 3,
    name: 'Berry Pie',
    input: { wild_berry: 4, wheat: 2 },
    output: { berry_pie: 2 },
    requires: ['Veggie Stew']
  },
  // Level 4
  {
    skill: 'cooking',
    level: 4,
    name: 'Grand Feast',
    input: { bread: 2, fish_stew: 1, veggie_stew: 1, berry_pie: 1 },
    output: { feast: 1 },
    requires: ['Berry Pie']
  }
]);
