
// ============================================================
// STATE: Shrine — choose an ability
// ============================================================
var ShrineState = {
  name: 'shrine',
  drawBelow: true,

  onKey: function(game, key) {
    var idx = parseInt(key) - 1;
    if (idx >= 0 && idx < 3 && game.shrineChoices) {
      var chosen = game.shrineChoices[idx];
      if (game.player.abilities.length < 4) {
        game.player.abilities.push(chosen);
        GameUtils.addLog('Gained: ' + chosen.name + '!', chosen.color);
        game.shrineChoices = null;
        game.dungeon.map[game.player.y][game.player.x] = T.FLOOR;
        StateStack.pop();
      } else {
        game._pendingAbility = chosen;
        game.shrineChoices = null;
        StateStack.swap(ReplaceAbilityState);
      }
      return true;
    }
    if (key === 'Escape') {
      game.shrineChoices = null;
      StateStack.pop();
      return true;
    }
    return true;
  },

  onDraw: function(game, ctx) {
    game.drawShrineOverlay(ctx);
  },
};
