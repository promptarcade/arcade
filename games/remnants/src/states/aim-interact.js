
// ============================================================
// STATE: Aim Interact — choose direction for tree/ore/NPC interaction
// ============================================================
var AimInteractState = {
  name: 'aim_interact',
  drawBelow: true,

  onEnter: function(game) {
    GameUtils.addLog('Choose direction...', '#ddaa44');
  },

  onKey: function(game, key) {
    var lk = key.toLowerCase();
    if (lk === 'escape' || lk === 'e') {
      GameUtils.addLog('Cancelled.', '#888');
      StateStack.pop();
      return true;
    }

    var dx = 0, dy = 0;
    if (key === 'ArrowUp' || lk === 'w') dy = -1;
    else if (key === 'ArrowDown' || lk === 's') dy = 1;
    else if (key === 'ArrowLeft' || lk === 'a') dx = -1;
    else if (key === 'ArrowRight' || lk === 'd') dx = 1;
    else return true; // consume other keys

    var px = Math.round(game.player.x), py = Math.round(game.player.y);
    var tx = px + dx, ty = py + dy;
    game.player.lastDir = { x: dx, y: dy };

    StateStack.pop();
    game.resolveInteraction(tx, ty);
    return true;
  },

  onDraw: function(game, ctx) {
    var ts = CONFIG.TILE;
    var px = Math.round(game.player.x), py = Math.round(game.player.y);
    var pulse = 0.3 + Math.sin(game.animTimer * 5) * 0.15;

    // Highlight interactable adjacent tiles
    var dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];

    // Need camera transform for world-space drawing
    var p = game.pipeline;
    p.camera.applyTransform(ctx);

    for (var di = 0; di < dirs.length; di++) {
      var d = dirs[di];
      var tx = px + d.x, ty = py + d.y;
      var hasTarget = false;
      if (NPCManager.getAt(tx, ty)) hasTarget = true;
      else if (game.player.mode === 'overworld' || game.player.mode === 'underground') {
        var tile = Overworld.getTile(tx, ty);
        if (SkillRegistry.getHandlersForTile(tile.type).length > 0) hasTarget = true;
        if (TileRegistry.getInteraction(tile.type)) hasTarget = true;
      }
      if (hasTarget) {
        ctx.fillStyle = 'rgba(255,200,50,' + pulse.toFixed(2) + ')';
        ctx.fillRect(tx * ts, ty * ts, ts, ts);
      }
    }

    // Reset transform for UI text
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Prompt
    var w = CONFIG.WIDTH, fs = Math.max(12, Math.round(w * 0.014));
    ctx.fillStyle = '#ddaa44';
    ctx.font = 'bold ' + fs + 'px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('Press direction to interact, ESC to cancel', w / 2, fs * 2);
  },
};
