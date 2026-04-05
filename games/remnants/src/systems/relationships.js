
// ============================================================
// SYSTEM: Relationships — affinity, romance, families
// ============================================================

// Relationship data stored on NPCs: npc.relationships = { 'OtherName': score }
// Score: -100 (hostile) to 100 (soulmate)
// 0-20: acquaintance, 20-50: friend, 50-75: close friend, 75+: romantic (if compatible)

var Relationships = {
  // Get relationship score between two NPCs
  get: function(npc, otherName) {
    if (!npc.relationships) npc.relationships = {};
    return npc.relationships[otherName] || 0;
  },

  // Adjust relationship
  adjust: function(npc, otherName, amount) {
    if (!npc.relationships) npc.relationships = {};
    var old = npc.relationships[otherName] || 0;
    npc.relationships[otherName] = Math.max(-100, Math.min(100, old + amount));
    return npc.relationships[otherName];
  },

  // Get relationship label
  label: function(score) {
    if (score >= 75) return 'romantic';
    if (score >= 50) return 'close friend';
    if (score >= 20) return 'friend';
    if (score > -20) return 'acquaintance';
    if (score > -50) return 'disliked';
    return 'hostile';
  },

  // Check if two NPCs can become romantic
  canRomance: function(a, b) {
    var scoreA = this.get(a, b.name);
    var scoreB = this.get(b, a.name);
    return scoreA >= 75 && scoreB >= 75 && a.resident && b.resident;
  },
};

// NPCs who are near each other build affinity over time
GameEvents.on('turnEnd', function(game) {
  if (game.player.mode !== 'overworld') return;
  // Only check every 20 turns to avoid performance cost
  if (GameTime.turn % 20 !== 0) return;

  var npcs = NPCManager.npcs;
  for (var i = 0; i < npcs.length; i++) {
    var a = npcs[i];
    if (!a.alive || !a.resident) continue;

    for (var j = i + 1; j < npcs.length; j++) {
      var b = npcs[j];
      if (!b.alive || !b.resident) continue;

      var dx = a.x - b.x, dy = a.y - b.y;
      var dist = Math.abs(dx) + Math.abs(dy);

      // Proximity builds affinity
      if (dist <= 3) {
        Relationships.adjust(a, b.name, 0.3);
        Relationships.adjust(b, a.name, 0.3);
      }

      // Same job builds affinity faster
      if (a.job && a.job === b.job && dist <= 6) {
        Relationships.adjust(a, b.name, 0.2);
        Relationships.adjust(b, a.name, 0.2);
      }

      // Neighbours (homes within 5 tiles) build affinity
      if (a.home && b.home) {
        var homeDist = Math.abs(a.home.x - b.home.x) + Math.abs(a.home.y - b.home.y);
        if (homeDist <= 5) {
          Relationships.adjust(a, b.name, 0.1);
          Relationships.adjust(b, a.name, 0.1);
        }
      }

      // Romance check — if both at 75+, chance of child
      if (Relationships.canRomance(a, b)) {
        // Only one child per pair, check every ~500 turns
        if (GameTime.turn % 500 === 0 && Math.random() < 0.15) {
          var pairKey = a.name < b.name ? a.name + '+' + b.name : b.name + '+' + a.name;
          if (!Relationships._children) Relationships._children = {};
          if (!Relationships._children[pairKey]) {
            Relationships._children[pairKey] = true;
            spawnChild(a, b, game);
          }
        }
      }
    }
  }
});

function spawnChild(parentA, parentB, game) {
  // Child spawns near parents' home
  var home = parentA.home || parentB.home;
  if (!home) return;

  var child = new NPC(home.x, home.y, {
    name: randomNpcName(),
    body: Math.random() < 0.5 ? 'broad' : 'narrow',
    // Mix parent appearance
    bodyColor: Math.random() < 0.5 ? parentA.bodyColor : parentB.bodyColor,
    hairColor: Math.random() < 0.5 ? parentA.hairColor : parentB.hairColor,
    skinColor: Math.random() < 0.5 ? parentA.skinColor : parentB.skinColor,
    hairStyle: ['short', 'long', 'spiky'][Math.floor(Math.random() * 3)],
  });

  // Child starts with lower skills but inherits talent
  child.skills = {};
  for (var s in parentA.skills) {
    child.skills[s] = Math.floor(Math.max(parentA.skills[s] || 0, parentB.skills[s] || 0) * 0.3);
  }

  child.resident = true;
  child.home = home;
  child.speed = 0.15; // children move slowly
  child.isChild = true;
  child.birthTurn = GameTime.turn;

  NPCManager.add(child);
  GameUtils.addLog(parentA.name + ' and ' + parentB.name + ' had a child: ' + child.name + '!', '#ff88aa');
  GameEvents.fire('childBorn', game, child, parentA, parentB);
}

// Children grow up over time — after 2000 turns they become full adults
GameEvents.on('turnEnd', function(game) {
  if (game.player.mode !== 'overworld') return;
  if (GameTime.turn % 100 !== 0) return;

  for (var i = 0; i < NPCManager.npcs.length; i++) {
    var npc = NPCManager.npcs[i];
    if (!npc.isChild || !npc.alive) continue;
    var age = GameTime.turn - (npc.birthTurn || 0);
    if (age >= 2000) {
      npc.isChild = false;
      npc.speed = 0.2;
      // Boost skills on growing up
      for (var s in npc.skills) npc.skills[s] = Math.min(5, (npc.skills[s] || 0) + 1);
      GameUtils.addLog(npc.name + ' has grown up!', '#ffcc88');
    }
  }
});

// Show relationships in NPC dialogue
var _origBuildDialogue2 = typeof buildNpcDialogue === 'function' ? buildNpcDialogue : null;
if (_origBuildDialogue2) {
  var _prevBuilder = buildNpcDialogue;
  buildNpcDialogue = function(npc, game) {
    var result = _prevBuilder(npc, game);
    // Add relationship info for residents
    if (npc.resident && npc.relationships) {
      var rels = [];
      for (var name in npc.relationships) {
        var score = npc.relationships[name];
        if (score >= 20) {
          rels.push(name + ' (' + Relationships.label(score) + ')');
        }
      }
      if (rels.length > 0) {
        result.lines.push({ text: 'Close to: ' + rels.join(', '), color: '#aa88aa' });
      }
    }
    if (npc.isChild) {
      result.lines.push({ text: '(Child — still growing)', color: '#ffaacc' });
    }
    return result;
  };
}

// Save/load
SaveSystem.register('relationships', {
  save: function() {
    var data = {};
    for (var i = 0; i < NPCManager.npcs.length; i++) {
      var npc = NPCManager.npcs[i];
      if (npc.relationships) data[npc.name] = npc.relationships;
    }
    return { rels: data, children: Relationships._children || {} };
  },
  load: function(data) {
    if (!data) return;
    // Applied after NPCs load — relationships are restored by name
    Relationships._pendingLoad = data.rels || {};
    Relationships._children = data.children || {};
  },
});

// Apply pending relationship data after NPCs are loaded
GameEvents.on('loaded', function() {
  if (!Relationships._pendingLoad) return;
  for (var i = 0; i < NPCManager.npcs.length; i++) {
    var npc = NPCManager.npcs[i];
    if (Relationships._pendingLoad[npc.name]) {
      npc.relationships = Relationships._pendingLoad[npc.name];
    }
  }
  delete Relationships._pendingLoad;
});
