
// ============================================================
// STATE: Loot Prompt — Y/N to equip found item
// ============================================================
var LootPromptState = {
  name: 'loot_prompt',
  drawBelow: true,

  onKey: function(game, key) {
    var lk = key.toLowerCase();
    // [Y/Enter] Equip immediately
    if (lk === 'y' || lk === 'enter' || lk === ' ') {
      var lp = game._pendingLootPos;
      if (game.dungeon && game._pendingLootKey) {
        delete game.dungeon.loot[game._pendingLootKey];
        game.dungeon.map[lp.y][lp.x] = T.FLOOR;
      }
      game.equipLoot(game._pendingLoot, lp ? lp.x : null, lp ? lp.y : null);
      game._pendingLoot = null;
      StateStack.pop();
      game.endTurn();
      return true;
    }
    // [S] Stash for later
    if (lk === 's') {
      var loot = game._pendingLoot;
      if (!game.player.stash) game.player.stash = [];
      game.player.stash.push(loot);
      var lp = game._pendingLootPos;
      if (game.dungeon && game._pendingLootKey) {
        delete game.dungeon.loot[game._pendingLootKey];
        game.dungeon.map[lp.y][lp.x] = T.FLOOR;
      }
      GameUtils.addLog(loot.name + ' \u2192 stash', '#ddaa44');
      SFX.step();
      game._pendingLoot = null;
      StateStack.pop();
      game.endTurn();
      return true;
    }
    // [N/Escape] Leave on ground — mark as seen so it doesn't nag again
    if (lk === 'n' || lk === 'escape') {
      GameUtils.addLog('Left ' + game._pendingLoot.name + '. Press [E] to pick up later.', '#888');
      if (game._pendingLootKey) {
        if (!game._seenLoot) game._seenLoot = {};
        game._seenLoot[game._pendingLootKey] = true;
      }
      game._pendingLoot = null;
      StateStack.pop();
      game.endTurn();
      return true;
    }
    return true;
  },

  onDraw: function(game, ctx) {
    game.drawLootPrompt(ctx);
  },
};
