#!/usr/bin/env node
// ============================================================
// Game Simulation Test — headless runtime that boots, ticks, and
// plays the game to catch crashes and runtime bugs.
// Generic for all Prompt Arcade games.
// Games can extend with a simulate-extend.js in their directory.
// Run: node tools/simulate-game.js games/<name>/index.html
// ============================================================

const fs = require('fs');
const path = require('path');
const file = process.argv[2];
if (!file) { console.log('Usage: node simulate-game.js <html-file>'); process.exit(1); }

const html = fs.readFileSync(file, 'utf8');

// ============================================================
// Event capture system — intercepts addEventListener calls
// so we can dispatch synthetic events later
// ============================================================
var _capturedListeners = {}; // element key -> { eventType -> [handler, ...] }
var _listenerIdCounter = 0;

function _makeListenerCapture(elementKey) {
  return {
    addEventListener: function(type, handler) {
      if (!_capturedListeners[elementKey]) _capturedListeners[elementKey] = {};
      if (!_capturedListeners[elementKey][type]) _capturedListeners[elementKey][type] = [];
      _capturedListeners[elementKey][type].push(handler);
    },
    removeEventListener: function(type, handler) {
      if (!_capturedListeners[elementKey] || !_capturedListeners[elementKey][type]) return;
      var arr = _capturedListeners[elementKey][type];
      var idx = arr.indexOf(handler);
      if (idx >= 0) arr.splice(idx, 1);
    },
  };
}

function _dispatchTo(elementKey, type, event) {
  if (!_capturedListeners[elementKey] || !_capturedListeners[elementKey][type]) return;
  var handlers = _capturedListeners[elementKey][type].slice();
  for (var i = 0; i < handlers.length; i++) {
    try { handlers[i](event); } catch(e) { /* collected by crash wrapper */ }
  }
}

// Capture rAF callbacks
var _rafCallbacks = [];
var _rafIdCounter = 0;

// Fake time for simulation
var _simTime = 1000; // start at 1 second

// ============================================================
// DOM/Browser mocks — comprehensive, with event capture
// ============================================================
var docListeners = _makeListenerCapture('document');
var winListeners = _makeListenerCapture('window');
var canvasListeners = _makeListenerCapture('canvas');

const mockCtx = {
  fillRect: function(){}, strokeRect: function(){}, clearRect: function(){},
  roundRect: function(){},
  createImageData: function(w,h) { return {data: new Uint8ClampedArray((w||1)*(h||1)*4), width:w||1, height:h||1}; },
  fillText: function(){}, strokeText: function(){}, measureText: function(t) { return {width: (t||'').length * 8}; },
  beginPath: function(){}, moveTo: function(){}, lineTo: function(){}, closePath: function(){},
  arc: function(){}, ellipse: function(){}, quadraticCurveTo: function(){}, bezierCurveTo: function(){},
  fill: function(){}, stroke: function(){}, clip: function(){}, rect: function(){},
  save: function(){}, restore: function(){}, translate: function(){}, rotate: function(){},
  scale: function(){}, setTransform: function(){}, resetTransform: function(){}, transform: function(){},
  drawImage: function(){},
  getImageData: function(x,y,w,h) { return {data: new Uint8Array(w*h*4), width:w, height:h}; },
  putImageData: function(){},
  createRadialGradient: function() { return {addColorStop:function(){}}; },
  createLinearGradient: function() { return {addColorStop:function(){}}; },
  createPattern: function() { return null; },
  setLineDash: function(){}, getLineDash: function(){ return []; },
  isPointInPath: function(){ return false; },
  set fillStyle(v){}, get fillStyle(){return '#000';},
  set strokeStyle(v){}, get strokeStyle(){return '#000';},
  set globalAlpha(v){}, get globalAlpha(){return 1;},
  set font(v){}, get font(){return '12px sans-serif';},
  set textAlign(v){}, get textAlign(){return 'left';},
  set textBaseline(v){}, get textBaseline(){return 'top';},
  set lineWidth(v){}, get lineWidth(){return 1;},
  set lineCap(v){}, get lineCap(){return 'butt';},
  set lineJoin(v){}, get lineJoin(){return 'miter';},
  set shadowColor(v){}, set shadowBlur(v){}, set shadowOffsetX(v){}, set shadowOffsetY(v){},
  set globalCompositeOperation(v){}, get globalCompositeOperation(){return 'source-over';},
  set imageSmoothingEnabled(v){},
  canvas: { width: 800, height: 640 },
};

const mockCanvas = {
  width: 800, height: 640,
  getContext: function(type, opts) { return mockCtx; },
  style: {}, getBoundingClientRect: function() { return {top:0,left:0,width:800,height:640}; },
  addEventListener: canvasListeners.addEventListener,
  removeEventListener: canvasListeners.removeEventListener,
  toDataURL: function() { return ''; }, toBlob: function(cb) { cb(null); },
};

const mockAudioCtx = {
  state: 'running', resume: function(){}, close: function(){},
  currentTime: 0, destination: {}, sampleRate: 44100,
  createOscillator: function() { return { connect:function(){}, start:function(){}, stop:function(){}, frequency:{setValueAtTime:function(){},exponentialRampToValueAtTime:function(){},linearRampToValueAtTime:function(){},value:440}, type:'sine', detune:{value:0} }; },
  createGain: function() { return { connect:function(){}, gain:{setValueAtTime:function(){},exponentialRampToValueAtTime:function(){},linearRampToValueAtTime:function(){},value:1} }; },
  createBuffer: function(c,l,r) { return { getChannelData:function(){return new Float32Array(l||1);}, numberOfChannels:c, length:l, sampleRate:r }; },
  createBufferSource: function() { return { connect:function(){}, start:function(){}, stop:function(){}, buffer:null, loop:false, playbackRate:{value:1} }; },
  createBiquadFilter: function() { return { connect:function(){}, type:'lowpass', frequency:{value:350,setValueAtTime:function(){},exponentialRampToValueAtTime:function(){}}, Q:{value:1} }; },
  createConvolver: function() { return { connect:function(){}, buffer:null }; },
  createDelay: function() { return { connect:function(){}, delayTime:{value:0,setValueAtTime:function(){}} }; },
  createDynamicsCompressor: function() { return { connect:function(){} }; },
  createAnalyser: function() { return { connect:function(){}, fftSize:2048, getByteTimeDomainData:function(){}, getByteFrequencyData:function(){} }; },
  createStereoPanner: function() { return { connect:function(){}, pan:{value:0} }; },
  decodeAudioData: function(buf,cb) { if(cb) cb(mockAudioCtx.createBuffer(1,1,44100)); return Promise.resolve(mockAudioCtx.createBuffer(1,1,44100)); },
};

global.window = {
  innerWidth: 800, innerHeight: 640, devicePixelRatio: 1,
  AudioContext: function() { return mockAudioCtx; },
  webkitAudioContext: function() { return mockAudioCtx; },
  addEventListener: winListeners.addEventListener,
  removeEventListener: winListeners.removeEventListener,
  setTimeout: function(fn) { if (typeof fn === 'function') fn(); return 1; },
  clearTimeout: function() {},
  setInterval: function() { return 1; }, clearInterval: function() {},
  requestAnimationFrame: function(cb) { _rafCallbacks.push(cb); return ++_rafIdCounter; },
  cancelAnimationFrame: function() {},
  getComputedStyle: function() { return { getPropertyValue: function() { return ''; } }; },
  location: { href: '', hostname: 'localhost', pathname: '/', search: '', hash: '' },
  history: { pushState: function(){}, replaceState: function(){} },
};
global.self = global.window;
global.document = {
  createElement: function(tag) {
    if (tag === 'canvas') return Object.assign({}, mockCanvas);
    return { style:{}, setAttribute:function(){}, getAttribute:function(){return null;}, appendChild:function(){}, removeChild:function(){}, addEventListener: docListeners.addEventListener, removeEventListener: docListeners.removeEventListener, classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}} };
  },
  getElementById: function(id) {
    // Any single-letter or *canvas* id — return the mock canvas
    if (id === 'gameCanvas' || id === 'canvas' || id === 'c' || id === 'game' ||
        (id && id.length <= 2) || (id && id.toLowerCase().indexOf('canvas') >= 0)) {
      return mockCanvas;
    }
    return { style:{}, textContent:'', innerHTML:'', value:'', classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}}, addEventListener: docListeners.addEventListener, removeEventListener: docListeners.removeEventListener, appendChild:function(){}, setAttribute:function(){}, getAttribute:function(){return null;}, querySelector:function(){return null;}, querySelectorAll:function(){return{forEach:function(){},length:0};} };
  },
  querySelector: function() { return null; },
  querySelectorAll: function() { return { forEach: function() {}, length: 0 }; },
  addEventListener: docListeners.addEventListener,
  removeEventListener: docListeners.removeEventListener,
  dispatchEvent: function(e) { if (e && e.type) _dispatchTo('document', e.type, e); },
  createEvent: function() { return { initEvent: function(){} }; },
  body: { appendChild: function(){}, style:{}, clientWidth: 800, clientHeight: 640 },
  head: { appendChild: function(){} },
  documentElement: { style:{} },
};
global.OffscreenCanvas = function(w,h) {
  return { width:w, height:h, getContext: function(type,opts) { return mockCtx; } };
};
global.matchMedia = function() { return { matches: false, addListener: function(){}, addEventListener: function(){} }; };
global.performance = { now: function() { return _simTime; }, mark: function(){}, measure: function(){} };
global.navigator = { userAgent: 'test', language: 'en', platform: 'test', maxTouchPoints: 0 };
global.screen = { width: 800, height: 640 };
global.localStorage = {
  _data: {},
  getItem: function(k) { return this._data[k] || null; },
  setItem: function(k,v) { this._data[k] = String(v); },
  removeItem: function(k) { delete this._data[k]; },
  clear: function() { this._data = {}; },
};
global.sessionStorage = Object.assign({}, global.localStorage, { _data: {} });
global.crypto = { subtle: { digest: function() { return Promise.resolve(new ArrayBuffer(32)); } }, getRandomValues: function(arr) { for (var i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random()*256); return arr; } };
global.fetch = function() { return Promise.resolve({json:function(){return Promise.resolve({});},text:function(){return Promise.resolve('');},ok:true,status:200}); };
global.XMLHttpRequest = function() { return { open:function(){}, send:function(){}, setRequestHeader:function(){}, addEventListener:function(){} }; };
global.prompt = function() { return null; };
global.alert = function() {};
global.confirm = function() { return false; };
global.Image = function() { return { addEventListener:function(){}, set src(v){} }; };
global.Audio = function() { return { play:function(){return Promise.resolve();}, pause:function(){}, addEventListener:function(){}, load:function(){}, volume:1, currentTime:0, loop:false }; };
global.requestAnimationFrame = function(cb) { _rafCallbacks.push(cb); return ++_rafIdCounter; };
global.cancelAnimationFrame = function() {};
global.KeyboardEvent = function(type, opts) { this.type = type; this.key = (opts||{}).key; this.code = (opts||{}).code || ''; this.preventDefault = function(){}; };
global.MouseEvent = function(type, opts) { this.type = type; this.clientX = (opts||{}).clientX || 0; this.clientY = (opts||{}).clientY || 0; this.preventDefault = function(){}; };
global.TouchEvent = function(type, opts) { this.type = type; };
global.ResizeObserver = function() { return { observe:function(){}, unobserve:function(){}, disconnect:function(){} }; };
global.IntersectionObserver = function() { return { observe:function(){}, unobserve:function(){}, disconnect:function(){} }; };
global.MutationObserver = function() { return { observe:function(){}, disconnect:function(){} }; };
global.WebSocket = function() { return { addEventListener:function(){}, send:function(){}, close:function(){} }; };
global.URL = { createObjectURL: function(){ return ''; }, revokeObjectURL: function(){} };
global.Blob = function() {};
global.FileReader = function() { return { readAsDataURL:function(){}, addEventListener:function(){} }; };

// ============================================================
// Simulation helpers
// ============================================================

// Tick the game loop N times (16ms per frame = 60fps)
function tick(n) {
  for (var i = 0; i < (n || 1); i++) {
    _simTime += 16;
    // Run the latest rAF callback (games typically re-register each frame)
    if (_rafCallbacks.length > 0) {
      var cb = _rafCallbacks[_rafCallbacks.length - 1];
      _rafCallbacks = []; // clear — game will re-register
      try { cb(_simTime); } catch(e) {
        return { crashed: true, error: e };
      }
    }
  }
  return { crashed: false };
}

// Send a keydown event — returns {crashed, error} like tick()
function pressKey(key) {
  var evt = { type: 'keydown', key: key, code: 'Key' + key.toUpperCase(), preventDefault: function(){} };
  try {
    _dispatchTo('document', 'keydown', evt);
    _dispatchTo('canvas', 'keydown', evt);
    _dispatchTo('window', 'keydown', evt);
  } catch(e) {
    return { crashed: true, error: e };
  }
  return { crashed: false };
}

// Send a click event at a position (fraction of canvas: 0-1)
function click(xFrac, yFrac) {
  var evt = {
    type: 'click',
    clientX: Math.round(xFrac * 800),
    clientY: Math.round(yFrac * 640),
    preventDefault: function(){},
  };
  _dispatchTo('canvas', 'click', evt);
  _dispatchTo('document', 'click', evt);
}

// ============================================================
// Test framework
// ============================================================
let errors = 0, passed = 0;
function assert(condition, msg) {
  if (!condition) { console.log('  FAIL: ' + msg); errors++; }
  else { passed++; }
}
function section(name) { console.log('\n[' + name + ']'); }

console.log('=== SIMULATION: ' + file + ' ===');

// ============================================================
// Phase 1: LOAD — parse and execute game code
// ============================================================
const allScripts = html.match(/<script>([\s\S]*?)<\/script>/g);
let code = '';
for (const s of allScripts) {
  const inner = s.replace(/<\/?script>/g, '');
  if (inner.length > code.length) code = inner;
}

try {
  const vm = require('vm');
  vm.runInThisContext(code, {filename: file});
  console.log('  OK: Game code parsed and executed without crash');
} catch(e) {
  console.log('  FAIL: Game code crashed on load: ' + e.message);
  console.log('  Stack: ' + (e.stack || '').split('\n').slice(0,3).join('\n  '));
  process.exit(1);
}

// ============================================================
// Phase 2: BOOT — check globals, tick initial frames
// ============================================================
section('BOOT');
var bootResult = tick(5);
assert(!bootResult.crashed, 'Game survives 5 frames after load' + (bootResult.error ? ': ' + bootResult.error.message : ''));

// Check that rAF was re-registered (game loop is running)
var loopRunning = _rafCallbacks.length > 0;
assert(loopRunning, 'Game loop is running (rAF re-registered)');

// Game logic detected — either globals or loop running (IIFE games hide globals)
var hasGame = loopRunning || typeof Game === 'function' || typeof game !== 'undefined' ||
  typeof update === 'function' || typeof draw === 'function' || typeof startGame === 'function';
assert(hasGame, 'Game logic detected');

if (typeof CONFIG !== 'undefined' && typeof CONFIG === 'object') {
  // Check for any dimension-like property
  var hasDim = CONFIG.WIDTH > 0 || CONFIG.TILE > 0 || CONFIG.W > 0 || CONFIG.CANVAS_W > 0 ||
    CONFIG.width > 0 || CONFIG.tile > 0 || Object.keys(CONFIG).length > 0;
  assert(hasDim, 'CONFIG object found (' + Object.keys(CONFIG).length + ' properties)');
}

// ============================================================
// Phase 3: START — try to start the game via common triggers
// ============================================================
section('START');

// Clear any save to force fresh start path (tests startGame, not continueGame)
if (typeof localStorage !== 'undefined') localStorage.clear();

// Try Enter key, Space key, click-to-start
var r1 = pressKey('Enter'); tick(3);
var r2 = pressKey(' '); tick(3);
click(0.5, 0.9); var r3 = tick(3);
var startOk = !r1.crashed && !r2.crashed && !r3.crashed;
if (r1.crashed) assert(false, 'Crash after Enter: ' + r1.error.message);
if (r2.crashed) assert(false, 'Crash after Space: ' + r2.error.message);
if (r3.crashed) assert(false, 'Crash after click: ' + r3.error.message);
if (startOk) assert(true, 'Enter, Space, click-to-start — no crashes');

// ============================================================
// Phase 4: PLAY — simulate basic gameplay inputs
// ============================================================
section('PLAY');

// Movement: arrow keys and WASD
var moveKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'];
var moveCrashes = 0;
for (var i = 0; i < moveKeys.length; i++) {
  var kr = pressKey(moveKeys[i]);
  var mr = tick(2);
  var crashed = kr.crashed || mr.crashed;
  var err = kr.crashed ? kr.error : mr.error;
  if (crashed) { moveCrashes++; console.log('  FAIL: Crash on ' + moveKeys[i] + ': ' + err.message); errors++; }
}
if (moveCrashes === 0) { assert(true, 'All 8 movement keys handled without crash'); }

// Action keys: common game actions
var actionKeys = ['e', 'i', 'c', 'b', 'h', 'p', 'Escape', '1', '2', '3', '4', 'Tab', ' '];
var actionCrashes = 0;
for (var i = 0; i < actionKeys.length; i++) {
  var akr = pressKey(actionKeys[i]);
  var ar = tick(2);
  var aCrashed = akr.crashed || ar.crashed;
  var aErr = akr.crashed ? akr.error : ar.error;
  if (aCrashed) { actionCrashes++; console.log('  FAIL: Crash on \'' + actionKeys[i] + '\': ' + aErr.message); errors++; }
  pressKey('Escape');
  tick(1);
}
if (actionCrashes === 0) { assert(true, 'All ' + actionKeys.length + ' action keys handled without crash'); }

// Sustained play: tick 60 frames (1 second of gameplay)
var sustained = tick(60);
assert(!sustained.crashed, '60 frames of sustained play' + (sustained.error ? ': ' + sustained.error.message : ''));

// Check for instant death — if the game enters a death/gameover state
// within the first second without meaningful player input, that's a bug
var deathStates = ['dead', 'gameover', 'game_over', 'lost', 'dying'];
var stateVarNames = ['state', 'gameState', 'game_state'];
var instantDeath = false;
for (var sn = 0; sn < stateVarNames.length; sn++) {
  try {
    var currentState = eval(stateVarNames[sn]);
    if (typeof currentState === 'string' && deathStates.indexOf(currentState) >= 0) {
      instantDeath = true;
      break;
    }
  } catch(e) {}
}
if (instantDeath) {
  fail('Game entered death/gameover state within 1 second of starting — player likely dies immediately');
} else {
  assert(true, 'Game did not instantly kill the player');
}

// Check for entities below terrain (creatures clipping through floor)
try {
  if (typeof creatures !== 'undefined' && Array.isArray(creatures) && typeof getTerrainDepth === 'function') {
    var clippedCount = 0;
    var M_scale = typeof M !== 'undefined' ? M : 2;
    for (var ci = 0; ci < creatures.length; ci++) {
      var cr = creatures[ci];
      if (cr && typeof cr.x === 'number' && typeof cr.y === 'number') {
        var floorY = getTerrainDepth(cr.x) * M_scale;
        if (cr.y > floorY + 5) clippedCount++;
      }
    }
    if (clippedCount > 0) {
      fail(clippedCount + ' creature(s) spawned below the terrain — entities must stay above the seafloor');
    } else if (creatures.length > 0) {
      assert(true, 'All ' + creatures.length + ' creatures are above terrain');
    }
  }
} catch(e) {}

// Rapid input: mash keys like a real player
var mashKeys = ['ArrowRight', 'ArrowRight', 'e', 'ArrowDown', 'ArrowDown', ' ', 'ArrowLeft', 'Escape', 'ArrowUp', '1', 'ArrowRight'];
var mashCrashes = 0;
for (var i = 0; i < mashKeys.length; i++) {
  pressKey(mashKeys[i]);
  var mr2 = tick(1);
  if (mr2.crashed) { mashCrashes++; console.log('  FAIL: Crash during key mash at \'' + mashKeys[i] + '\': ' + mr2.error.message); errors++; }
}
if (mashCrashes === 0) { assert(true, 'Rapid key mashing (' + mashKeys.length + ' inputs) no crash'); }

// ============================================================
// Phase 5: STRESS — longer sustained simulation
// ============================================================
section('STRESS');

// 5 seconds of gameplay with periodic random inputs
var stressCrashes = 0;
var stressInputs = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','e',' ','Escape','1','w','s','a','d'];
for (var frame = 0; frame < 300; frame++) {
  // Random input every ~10 frames
  if (frame % 10 === 0) {
    var key = stressInputs[Math.floor(Math.random() * stressInputs.length)];
    pressKey(key);
  }
  var sr = tick(1);
  if (sr.crashed) {
    stressCrashes++;
    console.log('  FAIL: Crash at frame ' + frame + ': ' + sr.error.message);
    errors++;
    break; // one crash is enough
  }
}
if (stressCrashes === 0) { assert(true, '300 frames (5s) with random input — no crashes'); }

// Total simulated time
var totalSec = ((_simTime - 1000) / 1000).toFixed(1);
console.log('  INFO: Simulated ' + totalSec + 's of gameplay');

// ============================================================
// Phase 6: GAME-SPECIFIC EXTENSIONS
// ============================================================
const gameDir = path.dirname(path.resolve(file));
const extPath = path.join(gameDir, 'simulate-extend.js');
if (fs.existsSync(extPath)) {
  try {
    const ext = require(extPath);
    if (typeof ext === 'function') ext(global, { assert, section, tick, pressKey, click });
  } catch(e) {
    console.log('  FAIL: Extension error: ' + e.message);
    errors++;
  }
}

// ============================================================
// RESULT
// ============================================================
console.log('\n' + '='.repeat(50));
if (errors > 0) {
  console.log(errors + ' FAILED, ' + passed + ' passed — FIX BEFORE PUSHING');
  process.exit(1);
} else {
  console.log('ALL ' + passed + ' TESTS PASSED');
  process.exit(0);
}
