
// ============================================================
// SYSTEM: Village Reputation — quality attracts skilled visitors
// ============================================================
// Village reputation is calculated from:
//   - Food quality: better food items in player's bag
//   - Craft quality: number of unique recipes ever crafted
//   - Buildings: number and type of structures
// Higher reputation attracts more skilled travellers.
// Visitors rarely have skills exceeding the player's best skill.

var VillageReputation = {
  // Food quality scores
  FOOD_SCORES: {
    wheat: 1, carrot: 1, wild_berry: 1,
    dried_fish: 3, healing_salve: 3,
    fish_stew: 5, antidote: 4,
    sushi: 8, health_potion: 7,
    petal_essence: 6,
  },

  // Calculate current village reputation (0-100)
  calculate: function(game) {
    var p = game.player;
    var rep = 0;

    // Food quality — from bag AND from food stores
    var foodScore = 0;
    for (var id in this.FOOD_SCORES) {
      var count = p.bag[id] || 0;
      // Also count food in stores
      if (typeof BuildingManager !== 'undefined') {
        for (var bi = 0; bi < BuildingManager.buildings.length; bi++) {
          var bld = BuildingManager.buildings[bi];
          if (bld.stored && bld.stored[id]) count += bld.stored[id];
        }
      }
      if (count > 0) {
        foodScore += this.FOOD_SCORES[id] * Math.min(count, 10);
      }
    }
    rep += Math.min(35, foodScore); // food caps at 35 rep

    // Craft mastery — unique recipes ever crafted
    var craftCount = 0;
    if (p.craftedRecipes) {
      for (var name in p.craftedRecipes) craftCount++;
    }
    rep += Math.min(30, craftCount * 3); // recipes cap at 30 rep

    // Buildings — each building type contributes differently
    if (typeof BuildingManager !== 'undefined') {
      var buildings = BuildingManager.buildings;
      var buildScore = 0;
      for (var i = 0; i < buildings.length; i++) {
        var bp = buildings[i].blueprint;
        if (bp.isHome) buildScore += 3;
        else if (bp.isStore) buildScore += 5;
        else if (bp.isTavern) buildScore += 6;
        else if (bp.isTownHall) buildScore += 10;
        else if (bp.isStable) buildScore += 4;
        else buildScore += 2;
      }
      // Craft stores with stock give bonus
      for (var i = 0; i < buildings.length; i++) {
        var bld = buildings[i];
        if (bld.stored) {
          var itemCount = 0;
          for (var sid in bld.stored) itemCount += bld.stored[sid];
          buildScore += Math.min(5, Math.floor(itemCount / 3));
        }
      }
      rep += Math.min(25, buildScore); // buildings cap at 25 rep
    }

    // Player skill levels — skilled player attracts skilled visitors
    var playerBest = 0;
    var skillList = PlayerSkills.list(p.skills);
    for (var i = 0; i < skillList.length; i++) {
      if (skillList[i].level > playerBest) playerBest = skillList[i].level;
    }
    rep += Math.min(20, playerBest * 3); // player skill caps at 20 rep

    return Math.min(100, rep);
  },

  // Generate skill levels for a new visitor based on village reputation
  // Returns a skills object like NPC uses
  generateVisitorSkills: function(game) {
    var rep = this.calculate(game);
    var p = game.player;

    // Find player's best skill level
    var playerBest = 0;
    var skillList = PlayerSkills.list(p.skills);
    for (var i = 0; i < skillList.length; i++) {
      if (skillList[i].level > playerBest) playerBest = skillList[i].level;
    }

    // Base skill range depends on reputation
    // rep 0-20: skills 0-2
    // rep 20-50: skills 0-3
    // rep 50-80: skills 1-4
    // rep 80-100: skills 2-6
    var minSkill = 0, maxSkill = 2;
    if (rep >= 80) { minSkill = 2; maxSkill = 6; }
    else if (rep >= 50) { minSkill = 1; maxSkill = 4; }
    else if (rep >= 20) { minSkill = 0; maxSkill = 3; }

    // Cap: visitors rarely exceed player's best skill
    // 10% chance to exceed by 1, otherwise capped at player level
    var skillCap = playerBest;
    if (Math.random() < 0.1) skillCap = playerBest + 1;

    maxSkill = Math.min(maxSkill, Math.max(skillCap, 1));

    var skills = {};
    var skillNames = ['woodcutting', 'herbalism', 'gathering', 'combat', 'building'];
    for (var i = 0; i < skillNames.length; i++) {
      skills[skillNames[i]] = minSkill + Math.floor(Math.random() * (maxSkill - minSkill + 1));
    }

    // One or two skills should be notably higher (their speciality)
    var specCount = 1 + (Math.random() < 0.3 ? 1 : 0);
    for (var s = 0; s < specCount; s++) {
      var specIdx = Math.floor(Math.random() * skillNames.length);
      var bonus = 1 + Math.floor(rep / 30);
      skills[skillNames[specIdx]] = Math.min(skills[skillNames[specIdx]] + bonus, Math.max(skillCap, 1));
    }

    return skills;
  },
};

// Override NPC spawning to use village reputation for skill generation
var _origNpcConstructor = NPC;
NPC = function(wx, wy, opts) {
  _origNpcConstructor.call(this, wx, wy, opts);
  // If no explicit skills provided and game is available, use reputation
  if (!opts || !opts.skills) {
    var game = GameUtils._game;
    if (game && game.player) {
      this.skills = VillageReputation.generateVisitorSkills(game);
    }
  }
};
NPC.prototype = _origNpcConstructor.prototype;

// More skilled NPCs gather more resources
// Override the gathering rate based on NPC skill level
GameEvents.on('turnEnd', function(game) {
  if (game.player.mode !== 'overworld') return;
  if (typeof BuildingManager === 'undefined') return;

  // Check every ~30 turns for NPC gathering (original is every 30 turns in npc.js)
  // Here we boost the yield for skilled NPCs
  if (GameTime.turn % 30 !== 0) return;

  for (var i = 0; i < NPCManager.npcs.length; i++) {
    var npc = NPCManager.npcs[i];
    if (!npc.alive || !npc.resident || !npc.job) continue;
    var hour = GameTime.hour();
    if (hour < 8 || hour >= 17) continue; // only during work hours

    var skill = npc.skills[npc.job] || 0;
    // Bonus gather chance for skilled NPCs (on top of base gathering in npc.js)
    if (skill >= 3 && Math.random() < 0.15 * (skill - 2)) {
      var gathered = null;
      if (npc.job === 'woodcutting') gathered = { id: 'oak_log', name: 'Oak Log' };
      else if (npc.job === 'herbalism') gathered = { id: 'meadow_herb', name: 'Herb' };
      else if (npc.job === 'gathering') gathered = { id: 'stone', name: 'Stone' };
      if (gathered) {
        Bag.add(game.player.bag, gathered.id, 1);
        // Only log occasionally to avoid spam
        if (Math.random() < 0.3) {
          GameUtils.addLog(npc.name + ' (skilled) gathered extra ' + gathered.name, '#88aa88');
        }
      }
    }
  }
}, 5); // lower priority so it runs after main NPC gathering

// Show village reputation in inventory
GameEvents.on('draw:ui', function(game, ctx) {
  if (game.player.mode !== 'overworld') return;
  if (StateStack.name() === 'title' || StateStack.name() === 'inventory') return;
  if (typeof BuildingManager === 'undefined') return;
  if (BuildingManager.buildings.length === 0) return;

  var rep = VillageReputation.calculate(game);
  var fs = Math.max(10, Math.round(CONFIG.WIDTH * 0.01));
  var w = CONFIG.WIDTH;

  // Small rep indicator in bottom-left, above ability bar
  var repX = 10, repY = CONFIG.HEIGHT - 95;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(repX, repY, fs * 8, fs * 1.4);
  ctx.fillStyle = rep >= 50 ? '#ddaa44' : '#888';
  ctx.font = Math.round(fs * 0.8) + 'px Segoe UI';
  ctx.textAlign = 'left';
  var label = rep >= 80 ? 'Renowned' : rep >= 50 ? 'Thriving' : rep >= 20 ? 'Growing' : 'Humble';
  ctx.fillText('Village: ' + label, repX + 4, repY + fs * 1.0);
});
