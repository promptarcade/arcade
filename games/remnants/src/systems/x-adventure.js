
// ============================================================
// SYSTEM: Adventure Delegation — send NPCs to explore ruins
// ============================================================

// Track active expeditions
var Expeditions = {
  active: [], // { npc: name, startTurn: N, duration: N, dungeonSeed: N, risk: 0-1 }

  send: function(npc, game) {
    // Calculate duration based on NPC combat skill
    var combatLevel = npc.skills.combat || 0;
    var duration = 600 - combatLevel * 30; // 10 minutes minus skill bonus (in turns)
    duration = Math.max(200, duration);
    var risk = Math.max(0.05, 0.4 - combatLevel * 0.05); // death chance

    this.active.push({
      npcName: npc.name,
      startTurn: GameTime.turn,
      duration: duration,
      risk: risk,
      combatLevel: combatLevel,
    });

    // Remove NPC from overworld
    npc.state = 'adventuring';
    npc.alive = false; // temporarily remove from rendering/AI
    npc._adventuring = true;

    GameUtils.addLog(npc.name + ' sets off on an expedition (' + Math.round(duration/60) + ' min)', '#aaccff');
  },

  check: function(game) {
    for (var i = this.active.length - 1; i >= 0; i--) {
      var exp = this.active[i];
      if (GameTime.turn - exp.startTurn >= exp.duration) {
        this.active.splice(i, 1);
        this._resolve(exp, game);
      }
    }
  },

  _resolve: function(exp, game) {
    // Find the NPC by name
    var npc = null;
    for (var j = 0; j < NPCManager.npcs.length; j++) {
      if (NPCManager.npcs[j].name === exp.npcName && NPCManager.npcs[j]._adventuring) {
        npc = NPCManager.npcs[j]; break;
      }
    }

    // Did they survive?
    if (Math.random() < exp.risk) {
      // NPC lost
      GameUtils.addLog(exp.npcName + ' was lost in the ruins...', '#ff6644');
      if (npc) {
        NPCManager.remove(npc);
        // Free up their home
        if (typeof BuildingManager !== 'undefined') {
          var homes = BuildingManager.getHomes();
          for (var h = 0; h < homes.length; h++) {
            if (homes[h].occupant === exp.npcName) homes[h].occupant = null;
          }
        }
      }
      return;
    }

    // Success — NPC returns with loot
    if (npc) {
      npc.alive = true;
      npc._adventuring = false;
      npc.state = 'idle';
      // Place NPC back near their home or near player
      if (npc.home) { npc.x = npc.home.x; npc.y = npc.home.y; }
      else { npc.x = game.player.x + 2; npc.y = game.player.y; }
    }

    // Generate loot based on combat level
    var lootRolls = 2 + exp.combatLevel;
    var lootMsg = [];
    for (var r = 0; r < lootRolls; r++) {
      var roll = Math.random();
      var item, count;
      if (roll < 0.3) { item = 'stone'; count = 2 + Math.floor(Math.random()*3); }
      else if (roll < 0.5) { item = 'oak_log'; count = 2 + Math.floor(Math.random()*2); }
      else if (roll < 0.65) { item = 'flint'; count = 1 + Math.floor(Math.random()*2); }
      else if (roll < 0.75) { item = 'red_mushroom'; count = 1 + Math.floor(Math.random()*3); }
      else if (roll < 0.85) { item = 'healing_salve'; count = 1; }
      else if (roll < 0.92) { item = 'plank'; count = 2 + Math.floor(Math.random()*3); }
      else { item = 'health_potion'; count = 1; }
      Bag.add(game.player.bag, item, count);
      var def = ResourceRegistry.get(item);
      lootMsg.push(count + 'x ' + (def ? def.name : item));
    }

    // Combat XP for the NPC
    if (npc) npc.skills.combat = (npc.skills.combat || 0) + 1;

    GameUtils.addLog(exp.npcName + ' returns with: ' + lootMsg.join(', '), '#44ddaa');
    SFX.shrine();
    GameEvents.fire('expeditionReturn', game, exp, lootMsg);
  },
};

// Check expeditions every turn
GameEvents.on('turnEnd', function(game) {
  Expeditions.check(game);
});

// Save/load expeditions
SaveSystem.register('expeditions', {
  save: function() { return Expeditions.active; },
  load: function(data) { if (data) Expeditions.active = data; },
});

// Add "Send on expedition" to dialogue for residents with combat skill
// This is handled by extending the dialogue builder — hook into the existing system
var _origBuildDialogue = typeof buildNpcDialogue === 'function' ? buildNpcDialogue : null;
if (_origBuildDialogue) {
  buildNpcDialogue = function(npc, game) {
    var result = _origBuildDialogue(npc, game);
    // Add expedition option for residents with combat skill
    if (npc.resident && (npc.skills.combat || 0) > 0 && !npc._adventuring) {
      var risk = Math.max(5, Math.round((0.4 - (npc.skills.combat||0) * 0.05) * 100));
      var duration = Math.round((600 - (npc.skills.combat||0) * 30) / 60);
      // Insert before the last choice (which is usually "Carry on")
      result.choices.splice(result.choices.length - 1, 0, {
        text: 'Explore the ruins? (Combat ' + (npc.skills.combat||0) + ', ~' + duration + 'min, ' + risk + '% risk)',
        key: 'x',
        action: 'expedition',
      });
    }
    return result;
  };
}

// Expedition action handled via GameEvents — no monkey-patching states
GameEvents.on('dialogueAction', function(game, action, npc) {
  if (action === 'expedition' && npc) {
    Expeditions.send(npc, game);
    return true;
  }
  return false;
});
