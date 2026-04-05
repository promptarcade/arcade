// NPC Skills System
// Skilled NPCs work more efficiently, produce bonus resources, and can repair buildings.

var NPCSkills = {};

// Resource mapping: job skill -> resource produced
NPCSkills.RESOURCE_MAP = {
  woodcutting: 'oak_log',
  herbalism: 'meadow_herb',
  gathering: 'stone',
  mining: 'iron_ore',
  fishing: 'trout'
};

// Rare item pool for highly skilled NPCs
NPCSkills.RARE_ITEMS = {
  woodcutting: 'oak_log',
  herbalism: 'meadow_herb',
  gathering: 'stone',
  mining: 'iron_ore',
  fishing: 'trout'
};

// Check building skill when NPC is hired
GameEvents.on('npcHired', function(game, npc, home) {
  if (!npc.skills || npc.skills.building < 1) {
    GameUtils.addLog(npc.name + ' lacks building skill but moved in anyway', '#b0b0b0');
  }
});

// Job efficiency and building repair on turn end
GameEvents.on('turnEnd', function(game) {
  var hour = GameTime.hour();
  var turn = GameTime.turn;

  // Only during work hours, every 60 turns
  if (hour < 8 || hour > 17) return;
  if (turn % 60 !== 0) return;

  var npcs = NPCManager.npcs;
  if (!npcs) return;

  for (var i = 0; i < npcs.length; i++) {
    var npc = npcs[i];
    if (!npc.alive || !npc.resident) continue;

    // Job efficiency — produce bonus resources
    if (npc.job && npc.skills && npc.skills[npc.job] !== undefined) {
      var skill = npc.skills[npc.job];
      var resource = NPCSkills.RESOURCE_MAP[npc.job];

      if (resource && skill >= 4) {
        if (skill >= 6) {
          // 3x production
          Bag.add(game.player.bag, resource, 3);

          // 5% chance for rare find
          if (Math.random() < 0.05) {
            Bag.add(game.player.bag, resource, 1);
            GameUtils.addLog(npc.name + ' produced a rare find!', '#f0c040');
          }
        } else {
          // 2x production
          Bag.add(game.player.bag, resource, 2);
        }
      }
    }

    // Building repair — NPCs with building >= 3
    if (npc.skills && npc.skills.building >= 3) {
      // Periodic repair log (roughly every 10 cycles during work hours)
      if (turn % 600 === 0) {
        var buildings = ['workshop', 'storehouse', 'lodge', 'cabin'];
        var building = buildings[Math.floor(Math.random() * buildings.length)];
        GameUtils.addLog(npc.name + ' repaired the ' + building, '#a0d0a0');
      }
    }
  }
});
