
// ============================================================
// GAME UTILITIES — Standalone functions any system can use
// ============================================================
// These reference the global game instance set at startup.

var GameUtils = {
  _game: null,
  init: function(game) { this._game = game; },

  addLog: function(text, color) {
    var g = this._game; if (!g) return;
    g.log.push({ text: text, color: color || '#ccc' });
    if (g.log.length > 7) g.log.shift();
  },

  addFloating: function(tx, ty, text, color) {
    var g = this._game; if (!g) return;
    g.floatingTexts.push({
      x: tx * CONFIG.TILE + CONFIG.TILE / 2,
      y: ty * CONFIG.TILE,
      text: text, color: color, life: 1.0
    });
  },

  vfx: function() { return this._game ? this._game.vfx : null; },
  pipeline: function() { return this._game ? this._game.pipeline : null; },
  player: function() { return this._game ? this._game.player : null; },
};
