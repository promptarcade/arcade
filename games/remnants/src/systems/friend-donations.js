// Friend Donations System
// NPCs with high relationship occasionally leave resource gifts for the player.

(function registerFriendDonations() {

  var COMMON = ['oak_log', 'stone', 'branch', 'meadow_herb', 'flint'];
  var UNCOMMON = ['iron_ore', 'copper_ore', 'wild_berry', 'healing_salve'];
  var RARE = ['gem', 'health_potion', 'dried_fish'];

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function rollDonation(npc) {
    var rel = npc.relationship;
    if (rel < 50) return null;

    var chance, maxCount, pool;

    if (rel >= 100) {
      chance = 0.4;
      maxCount = 3;
      pool = COMMON.concat(UNCOMMON).concat(RARE);
    } else if (rel >= 75) {
      chance = 0.3;
      maxCount = 2;
      pool = COMMON.concat(UNCOMMON);
    } else {
      chance = 0.2;
      maxCount = 1;
      pool = COMMON;
    }

    if (Math.random() >= chance) return null;

    var count = 1 + Math.floor(Math.random() * maxCount);
    var resourceId = pickRandom(pool);

    return { id: resourceId, count: count };
  }

  function getResourceName(id) {
    var entry = ResourceRegistry.get(id);
    if (entry && entry.name) return entry.name;
    // Fallback: turn snake_case id into readable name
    return id.replace(/_/g, ' ');
  }

  GameEvents.on('turnEnd', function(game) {
    if (game.player.mode !== 'overworld') return;
    if (GameTime.turn % 100 !== 0) return;

    var logged = 0;
    var npcs = NPCManager.npcs;

    for (var i = 0; i < npcs.length; i++) {
      var npc = npcs[i];
      if (!npc.alive || !npc.resident) continue;
      if (npc.relationship < 50) continue;

      var donation = rollDonation(npc);
      if (!donation) continue;

      Bag.add(game.player.bag, donation.id, donation.count);

      if (logged < 2) {
        var name = getResourceName(donation.id);
        GameUtils.addLog(npc.name + ' left you a gift: ' + donation.count + 'x ' + name, '#88ccaa');
        logged++;
      }
    }
  });

})();
