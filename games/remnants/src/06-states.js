
// ============================================================
// GAME STATE STACK — Each state owns its input and draw
// ============================================================
// States push/pop. Top state receives input and draws.
// Lower states can still draw (for background) if they opt in.
//
// A state is an object:
// {
//   name: 'playing',
//   onEnter: function(game) {},       // called when state becomes active
//   onExit: function(game) {},        // called when state is popped or covered
//   onKey: function(game, key) {},    // return true to consume key
//   onDraw: function(game, ctx) {},   // draw UI for this state
//   drawBelow: false,                 // if true, state below also draws
// }

var StateStack = {
  _stack: [],
  _game: null,

  init: function(game) {
    this._game = game;
    this._stack = [];
  },

  // Push a new state on top
  push: function(state) {
    var current = this.current();
    if (current && current.onPause) current.onPause(this._game);
    this._stack.push(state);
    if (state.onEnter) state.onEnter(this._game);
  },

  // Pop the top state, return to previous
  pop: function() {
    var old = this._stack.pop();
    if (old && old.onExit) old.onExit(this._game);
    var current = this.current();
    if (current && current.onResume) current.onResume(this._game);
    return old;
  },

  // Replace top state
  swap: function(state) {
    var old = this._stack.pop();
    if (old && old.onExit) old.onExit(this._game);
    this._stack.push(state);
    if (state.onEnter) state.onEnter(this._game);
  },

  // Get current (top) state
  current: function() {
    return this._stack.length > 0 ? this._stack[this._stack.length - 1] : null;
  },

  // Get state name
  name: function() {
    var c = this.current();
    return c ? c.name : '';
  },

  // Check if a state is anywhere in the stack
  has: function(name) {
    for (var i = 0; i < this._stack.length; i++)
      if (this._stack[i].name === name) return true;
    return false;
  },

  // Route key input to top state
  handleKey: function(key) {
    // Debug toggle always passes through regardless of state
    if (key === '`' || key === '~') {
      GameEvents.fire('keyDown', this._game, key);
      return true;
    }
    var c = this.current();
    if (c && c.onKey) return c.onKey(this._game, key);
    return false;
  },

  // Draw states (bottom-up if drawBelow is set)
  draw: function(ctx) {
    // Find lowest state that needs drawing
    var start = this._stack.length - 1;
    while (start > 0 && this._stack[start].drawBelow) start--;
    for (var i = start; i < this._stack.length; i++) {
      if (this._stack[i].onDraw) this._stack[i].onDraw(this._game, ctx);
    }
  },

  // Clear entire stack
  clear: function() {
    while (this._stack.length > 0) this.pop();
  },

  depth: function() { return this._stack.length; },
};
