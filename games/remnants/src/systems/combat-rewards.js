// ============================================================
// Combat Rewards System — XP from kills + Crystal Crafting
// ============================================================

// --- PART 1: Combat Skill Registration ---

SkillRegistry.add({ id: 'combat', name: 'Combat', color: '#cc4444', tileIds: [] });

// --- Combat XP from kills ---

GameEvents.on('kill', function(game, enemy) {
  if (game.player.mode !== 'overworld') return;

  var xp = 5;
  if (enemy.maxHp > 30) {
    xp = 20;
  } else if (enemy.maxHp > 15) {
    xp = 10;
  }

  var result = PlayerSkills.addXp(game.player.skills, 'combat', xp);

  if (result.leveled) {
    game.player.atk += 1;
    GameUtils.addLog('Combat level ' + result.level + '!', '#cc4444');
  }
});

// --- PART 2: Crystal Crafting Resources ---

ResourceRegistry.add({ id: 'crystal_sword', name: 'Crystal Sword', color: '#ff6644', category: 'equipment', stackMax: 1 });
ResourceRegistry.add({ id: 'crystal_staff', name: 'Crystal Staff', color: '#66ccff', category: 'equipment', stackMax: 1 });
ResourceRegistry.add({ id: 'storm_amulet', name: 'Storm Amulet', color: '#ffff44', category: 'equipment', stackMax: 1 });
ResourceRegistry.add({ id: 'void_shield', name: 'Void Shield', color: '#aa44ff', category: 'equipment', stackMax: 1 });
ResourceRegistry.add({ id: 'enchanted_armor', name: 'Enchanted Armor', color: '#ff88cc', category: 'equipment', stackMax: 1 });

// --- Crystal Crafting Recipes ---

RecipeRegistry.addAll([
  {
    name: 'Crystal Sword',
    skill: 'combat',
    level: 3,
    input: { crystal_fire: 2, iron_bar: 3 },
    output: { crystal_sword: 1 },
    requires: ['Iron Axe']
  },
  {
    name: 'Crystal Staff',
    skill: 'combat',
    level: 3,
    input: { crystal_ice: 2, iron_bar: 2, branch: 3 },
    output: { crystal_staff: 1 },
    requires: ['Iron Axe']
  },
  {
    name: 'Storm Amulet',
    skill: 'combat',
    level: 5,
    input: { crystal_lightning: 3, gold_bar: 1 },
    output: { storm_amulet: 1 }
  },
  {
    name: 'Void Shield',
    skill: 'combat',
    level: 5,
    input: { crystal_void: 3, iron_bar: 2, leather: 3 },
    output: { void_shield: 1 }
  },
  {
    name: 'Enchanted Armor',
    skill: 'combat',
    level: 4,
    input: { crystal_fire: 1, crystal_ice: 1, leather_armor: 1 },
    output: { enchanted_armor: 1 },
    requires: ['Leather Armor']
  }
]);
