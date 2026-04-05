
// ============================================================
// SYSTEM: NPC Combat — attack NPCs, consequences, loot
// ============================================================

// Shared consequences when an NPC is killed
Game.prototype._npcKillConsequences = function(npc) {
  var p = this.player;
  // All other NPCs lose relationship
  for (var ni = 0; ni < NPCManager.npcs.length; ni++) {
    var other = NPCManager.npcs[ni];
    if (other !== npc && other.alive) {
      other.relationship = Math.max(-100, (other.relationship || 0) - 30);
      if (other.relationship <= -50 && other.resident) {
        other.resident = false;
        other.home = null;
        other.job = null;
        other.state = 'walking';
        GameUtils.addLog(other.name + ' flees in terror!', '#cc6644');
      }
    }
  }
  // Loot based on job/type
  var loot = [];
  if (npc.job === 'woodcutting') loot.push({ id: 'oak_log', count: 2 + Math.floor(Math.random() * 3), name: 'Oak Log' });
  else if (npc.job === 'herbalism') loot.push({ id: 'meadow_herb', count: 2 + Math.floor(Math.random() * 2), name: 'Herb' });
  else if (npc.job === 'gathering') loot.push({ id: 'stone', count: 3 + Math.floor(Math.random() * 3), name: 'Stone' });
  else if (npc.job === 'mining') loot.push({ id: 'iron_ore', count: 1 + Math.floor(Math.random() * 2), name: 'Iron Ore' });
  else if (npc.job === 'fishing') loot.push({ id: 'trout', count: 2 + Math.floor(Math.random() * 2), name: 'Trout' });
  if (npc._travellerType) {
    var tt = npc._travellerType.title;
    if (tt === 'Hunter') loot.push({ id: 'leather', count: 2 + Math.floor(Math.random() * 3), name: 'Leather' });
    else if (tt === 'Trader') loot.push({ id: 'gold_coin', count: 5 + Math.floor(Math.random() * 10), name: 'Gold' });
    else if (tt === 'Adventurer') loot.push({ id: 'healing_salve', count: 1 + Math.floor(Math.random() * 2), name: 'Healing Salve' });
    else if (tt === 'Prospector') loot.push({ id: 'copper_ore', count: 2 + Math.floor(Math.random() * 3), name: 'Copper Ore' });
  }
  if (npc.isMerchant) {
    loot.push({ id: 'gold_coin', count: 15 + Math.floor(Math.random() * 20), name: 'Gold' });
  }
  if (loot.length === 0) {
    var scraps = [
      { id: 'branch', count: 1 + Math.floor(Math.random() * 3), name: 'Branch' },
      { id: 'flint', count: 1, name: 'Flint' },
      { id: 'wheat', count: 1 + Math.floor(Math.random() * 2), name: 'Wheat' },
    ];
    loot.push(scraps[Math.floor(Math.random() * scraps.length)]);
  }
  for (var li = 0; li < loot.length; li++) {
    Bag.add(p.bag, loot[li].id, loot[li].count);
    GameUtils.addLog('+' + loot[li].count + ' ' + loot[li].name, '#aa8866');
  }
  p.kills++;
};
