// ============================================================
// DEPTHS — Roguelike — How deep can you go?
// ============================================================

(function() {
  var c = document.getElementById('gameCanvas');
  var hasTouch = matchMedia('(pointer: coarse)').matches;
  var reserveH = hasTouch ? 130 : 0;
  c.width = window.innerWidth;
  c.height = window.innerHeight - reserveH;
})();

var _touchDevice = matchMedia('(pointer: coarse)').matches;
var _reserveH = _touchDevice ? 130 : 0;
var _tileSize = Math.max(16, Math.floor(Math.min(window.innerWidth / 22, (window.innerHeight - _reserveH) / 18)));

var CONFIG = {
  WIDTH: window.innerWidth,
  HEIGHT: window.innerHeight - _reserveH,
  TILE: _tileSize,
  MAP_W: 60, MAP_H: 60,
  VIEW_W: Math.ceil(window.innerWidth / _tileSize / 2) + 2,
  VIEW_H: Math.ceil((window.innerHeight - _reserveH) / _tileSize / 2) + 2,
  VISION_RADIUS: 6,
  ROOM_MIN: 4, ROOM_MAX: 10, ROOM_ATTEMPTS: 50,
  START_HP: 40, START_ATK: 6,
};

var _SUPA_URL = 'https://ivhpqkqnfqcgrfrsvszf.supabase.co';
var _SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aHBxa3FuZnFjZ3JmcnN2c3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTg1NjYsImV4cCI6MjA4OTM5NDU2Nn0.x3X_0dbhw3Qz7sgQAgpSoSu382ckB2uYxCJGe7_vDCM';
async function submitScore(game, score) {
  var initials = prompt('New depth record: Floor ' + score + '! Enter your name (max 5 chars):');
  if (!initials) return;
  initials = initials.trim().slice(0, 5).toUpperCase();
  if (!initials) return;
  try {
    var hash = '';
    var data = navigator.userAgent + screen.width + screen.height + new Date().getTimezoneOffset();
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
    hash = Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('').slice(0, 32);
    await fetch(_SUPA_URL + '/rest/v1/high_scores', {
      method: 'POST', headers: { 'apikey': _SUPA_KEY, 'Authorization': 'Bearer ' + _SUPA_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: game, initials: initials, score: score, player_hash: hash }),
    });
  } catch(e) {}
}

