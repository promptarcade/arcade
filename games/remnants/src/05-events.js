
// ============================================================
// EVENT BUS — Pub/sub for decoupled system communication
// ============================================================
// New features subscribe to events instead of editing core files.
//
// Usage:
//   GameEvents.on('turnEnd', function(game) { ... });
//   GameEvents.on('playerMove', function(game, wx, wy) { ... });
//   GameEvents.on('draw:entities', function(game, ctx) { ... });
//
// Events fired by core:
//   turnEnd(game)              — after any turn ends (overworld or dungeon)
//   playerMove(game, x, y)    — after player moves to new tile
//   update(game, dt)           — every frame
//   draw:world(game, ctx)      — after world tiles drawn, before entities
//   draw:entities(game, ctx)   — after entities drawn
//   draw:ui(game, ctx)         — after HUD drawn, for custom UI panels
//   enterDungeon(game)         — when transitioning to dungeon
//   exitDungeon(game)          — when returning to overworld
//   kill(game, enemy)          — when an enemy is killed
//   damage(game, target, amount, source) — when damage is dealt
//   modeChange(game, newMode)  — when mode switches
//   keyDown(game, key)         — raw keypress, return true to consume
//   interact(game, tileType, wx, wy) — before skill handlers run

var GameEvents = (function() {
  var listeners = {};

  return {
    // Subscribe to an event. Returns unsubscribe function.
    on: function(event, handler, priority) {
      if (!listeners[event]) listeners[event] = [];
      var entry = { handler: handler, priority: priority || 0 };
      listeners[event].push(entry);
      listeners[event].sort(function(a, b) { return b.priority - a.priority; });
      return function() {
        var idx = listeners[event].indexOf(entry);
        if (idx >= 0) listeners[event].splice(idx, 1);
      };
    },

    // Fire an event. Args are passed to all handlers.
    // If any handler returns true, stops propagation and returns true.
    fire: function(event) {
      var handlers = listeners[event];
      if (!handlers) return false;
      var args = Array.prototype.slice.call(arguments, 1);
      for (var i = 0; i < handlers.length; i++) {
        if (handlers[i].handler.apply(null, args) === true) return true;
      }
      return false;
    },

    // Remove all listeners (useful for game restart)
    clear: function(event) {
      if (event) delete listeners[event];
      else listeners = {};
    },

    // List registered events (debug)
    list: function() {
      var result = {};
      for (var e in listeners) result[e] = listeners[e].length;
      return result;
    },
  };
})();
