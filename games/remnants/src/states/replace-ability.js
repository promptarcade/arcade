
// ============================================================
// STATE: Replace Ability — pick which slot to replace
// ============================================================
var ReplaceAbilityState = {
  name: 'replace',
  drawBelow: true,

  onKey: function(game, key) {
    var idx = parseInt(key) - 1;
    if (idx >= 0 && idx < game.player.abilities.length && game._pendingAbility) {
      GameUtils.addLog('Replaced ' + game.player.abilities[idx].name + ' with ' + game._pendingAbility.name, game._pendingAbility.color);
      game.player.abilities[idx] = game._pendingAbility;
      game._pendingAbility = null;
      if (game.dungeon && game.dungeon.map[game.player.y]) game.dungeon.map[game.player.y][game.player.x] = T.FLOOR;
      StateStack.pop();
      return true;
    }
    if (key === 'Escape') {
      game._pendingAbility = null;
      StateStack.pop();
      return true;
    }
    return true;
  },

  onDraw: function(game, ctx) {
    game.drawReplaceOverlay(ctx);
  },
};
