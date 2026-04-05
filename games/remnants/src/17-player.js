
// ============================================================
// PLAYER STATE & SAVE/LOAD
// ============================================================

function createPlayer() {
  return {
    x: 0, y: 0,
    hp: CONFIG.START_HP, maxHp: CONFIG.START_HP, atk: CONFIG.START_ATK,
    visionRadius: CONFIG.VISION_RADIUS, floor: 0,
    abilities: [], shieldTurns: 0, shieldAmount: 0,
    hitFlash: 0, wet: false, kills: 0,
    lastDir: { x: 0, y: 1 }, animFrame: 0, animTimer: 0, walkTimer: 0,
    weapon: null, armor: null, weaponType: 'sword', potions: 2,
    body: 'broad', height: 'average', frame: 'average',
    bodyColor: '#2266cc', hairColor: '#443322', hairStyle: 'short',
    skinColor: '#ffcc88', eyeColor: '#443322',
    // New systems
    bag: Bag.create(),
    skills: PlayerSkills.create(),
    craftedRecipes: {}, // track which recipes have been crafted at least once
    mode: 'overworld', // 'overworld' or 'dungeon'
    worldX: 0, worldY: 0, // overworld position
  };
}

function loadMeta() {
  try {
    var d = JSON.parse(localStorage.getItem('wanderlust_meta') || '{}');
    return {
      depthRecord: d.depthRecord || 0,
      totalRuns: d.totalRuns || 0,
      totalKills: d.totalKills || 0,
      bestiary: d.bestiary || {},
      unlocks: d.unlocks || [],
      worldSeed: d.worldSeed || 0,
      heartsCollected: d.heartsCollected || 0,
      obeliskTierReached: d.obeliskTierReached || 0,
    };
  } catch (e) {
    return { depthRecord: 0, totalRuns: 0, totalKills: 0, bestiary: {}, unlocks: [], worldSeed: 0, heartsCollected: 0, obeliskTierReached: 0 };
  }
}

function saveMeta(m) {
  try { localStorage.setItem('wanderlust_meta', JSON.stringify(m)); } catch (e) {}
}

// Register player save/load
SaveSystem.register('player', {
  save: function() {
    var p = GameUtils.player();
    if (!p) return null;
    var g = GameUtils._game;
    return {
      x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp, atk: p.atk,
      visionRadius: p.visionRadius, floor: p.floor, kills: p.kills,
      weapon: p.weapon, armor: p.armor, weaponType: p.weaponType, potions: p.potions,
      body: p.body, height: p.height, frame: p.frame,
      bodyColor: p.bodyColor, hairColor: p.hairColor, hairStyle: p.hairStyle,
      skinColor: p.skinColor, eyeColor: p.eyeColor,
      bag: p.bag, skills: p.skills, craftedRecipes: p.craftedRecipes, stash: p.stash || [],
      mode: p.mode, worldX: p.worldX, worldY: p.worldY,
      abilities: p.abilities,
      dungeonSeed: g ? g.dungeonSeed : undefined,
      _seenLoot: g ? g._seenLoot : undefined,
    };
  },
  load: function(data) {
    var p = GameUtils.player();
    if (!p || !data) return;
    // Restore game-level state before player properties
    var g = GameUtils._game;
    if (g && data.dungeonSeed !== undefined) g.dungeonSeed = data.dungeonSeed;
    if (g && data._seenLoot !== undefined) g._seenLoot = data._seenLoot;
    delete data.dungeonSeed;
    delete data._seenLoot;
    for (var k in data) if (data.hasOwnProperty(k)) p[k] = data[k];
    // Migrate old saves: gender -> body
    if (p.gender && !p.body) { p.body = p.gender === 'feminine' ? 'narrow' : 'broad'; delete p.gender; }
    if (!p.body) p.body = 'broad';
  },
});
