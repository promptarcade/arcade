
// ============================================================
// STATE: Dead
// ============================================================
var DeadState = {
  name: 'dead',
  drawBelow: true, // show game world behind

  onKey: function(game, key) {
    // Permadeath — wipe everything
    SaveSystem.deleteSave();
    NPCManager.clear();
    if (typeof BuildingManager !== 'undefined') BuildingManager.clear();
    Overworld.tileChanges = {};
    Overworld.chunks = {};
    GameTime.turn = 0;
    StateStack.clear();
    StateStack.push(TitleState);
    return true;
  },

  onDraw: function(game, ctx) {
    game.drawDeathOverlay(ctx);
  },
};
