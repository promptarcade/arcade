// Build Baby Wrangler v2 by assembling engine + verified sprites + game logic
const fs = require('fs');

const engine = fs.readFileSync('C:/AI/Claude/engine/sprites/sprite-forge-v2.js', 'utf8');

// Read prop files raw
const readProp = f => fs.readFileSync('C:/AI/Claude/tools/props/' + f, 'utf8');

const gameCode = `
'use strict';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);

// ============================================================
// SUPABASE
// ============================================================
const _SU='https://ivhpqkqnfqcgrfrsvszf.supabase.co';
const _SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aHBxa3FuZnFjZ3JmcnN2c3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTg1NjYsImV4cCI6MjA4OTM5NDU2Nn0.x3X_0dbhw3Qz7sgQAgpSoSu382ckB2uYxCJGe7_vDCM';
async function submitScore(g,s){var n=prompt('Score: '+s+'! Enter initials (max 5):');if(!n)return;n=n.trim().slice(0,5).toUpperCase();if(!n)return;try{await fetch(_SU+'/rest/v1/high_scores',{method:'POST',headers:{'apikey':_SK,'Authorization':'Bearer '+_SK,'Content-Type':'application/json'},body:JSON.stringify({game:g,initials:n,score:s})})}catch(e){}}

// ============================================================
// SFX
// ============================================================
var SFX = (function() {
  var actx = null, muted = false;
  function getCtx() { if (!actx) try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; } if (actx.state === 'suspended') actx.resume(); return actx; }
  function play(fn) { if (muted) return; var c = getCtx(); if (c) fn(c); }
  function osc(c, type, freq, freq2, dur, vol) {
    var o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
    if (freq2) o.frequency.linearRampToValueAtTime(freq2, c.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.08, c.currentTime);
    g.gain.linearRampToValueAtTime(0, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }
  return {
    get muted() { return muted; }, set muted(v) { muted = v; },
    pickup()  { play(c => osc(c, 'sine', 500, 800, 0.1, 0.08)); },
    place()   { play(c => osc(c, 'sine', 800, 500, 0.08, 0.06)); },
    grab()    { play(c => osc(c, 'square', 200, 300, 0.12, 0.06)); },
    danger()  { play(c => { osc(c, 'sawtooth', 400, 200, 0.3, 0.08); }); },
    safe()    { play(c => { osc(c, 'sine', 600, 1200, 0.15, 0.1); osc(c, 'sine', 800, 1400, 0.12, 0.08); }); },
    escape()  { play(c => osc(c, 'triangle', 300, 500, 0.15, 0.06)); },
    loseLife(){ play(c => { for(var i=0;i<3;i++) setTimeout(()=>osc(c,'sawtooth',400-i*80,200-i*40,0.2,0.08),i*120); }); },
    gameOver(){ play(c => { for(var i=0;i<4;i++) setTimeout(()=>osc(c,'sawtooth',300-i*60,150-i*30,0.25,0.08),i*180); }); },
    wave()    { play(c => { for(var i=0;i<3;i++) setTimeout(()=>osc(c,'sine',500+i*200,600+i*200,0.1,0.08),i*100); }); },
    select()  { play(c => osc(c, 'sine', 800, 600, 0.06, 0.05)); },
    chore()   { play(c => { osc(c, 'sine', 700, 1000, 0.12, 0.08); osc(c, 'sine', 900, 1200, 0.1, 0.06); }); },
  };
})();

// ============================================================
// SPRITE HELPERS
// ============================================================
function makePal(colors) {
  const pal = ColorRamp.buildPalette(colors);
  pal.palette[255] = sf2_packRGBA(20, 15, 10, 255);
  return pal;
}

// ============================================================
// SPRITE GENERATION — verified in sprite-lab
// ============================================================

// --- MUM (32x48) ---
function buildMumSprite() {
  const pal = makePal(${readPropColors('bw-mum.js')});
  return SpriteForge.buildSheet({
    frameWidth: 32, frameHeight: 48, palette: pal, outlineMode: 'tinted',
    animations: {
      idle: { frames: 2, speed: 0.5, loop: true, pingpong: true,
        draw(pc, pal, t) { ${readPropDraw('bw-mum.js')} },
        drawPost(pc, pal, t) { ${readPropDrawPost('bw-mum.js')} },
      },
      walk: { frames: 4, speed: 0.12, loop: true,
        draw(pc, pal, t) {
          ${readPropDraw('bw-mum.js')}
          // Walk leg offset
          const legOff = Math.round(Math.sin(t * Math.PI * 2) * 2);
          const s = pal.groups.skin.startIdx + 2;
          const sh = pal.groups.shoes.startIdx + 2;
          // Redraw legs with offset (overwrite static legs)
          pc.fillRect(12, 40 + legOff, 3, 5, s); pc.fillRect(18, 40 - legOff, 3, 5, s);
          pc.fillRect(11, 44 + legOff, 4, 3, sh); pc.fillRect(18, 44 - legOff, 4, 3, sh);
        },
        drawPost(pc, pal, t) { ${readPropDrawPost('bw-mum.js')} },
      },
    },
  });
}

// --- DAD (32x48) ---
function buildDadSprite() {
  const pal = makePal(${readPropColors('bw-dad.js')});
  return SpriteForge.buildSheet({
    frameWidth: 32, frameHeight: 48, palette: pal, outlineMode: 'tinted',
    animations: {
      idle: { frames: 2, speed: 0.5, loop: true, pingpong: true,
        draw(pc, pal, t) { ${readPropDraw('bw-dad.js')} },
        drawPost(pc, pal, t) { ${readPropDrawPost('bw-dad.js')} },
      },
      walk: { frames: 4, speed: 0.12, loop: true,
        draw(pc, pal, t) {
          ${readPropDraw('bw-dad.js')}
          const legOff = Math.round(Math.sin(t * Math.PI * 2) * 2);
          const s = pal.groups.skin.startIdx + 2;
          const sho = pal.groups.shoes.startIdx + 2;
          pc.fillRect(11, 36 + legOff, 3, 5, s); pc.fillRect(19, 36 - legOff, 3, 5, s);
          pc.fillRect(10, 41 + legOff, 5, 3, sho); pc.fillRect(18, 41 - legOff, 5, 3, sho);
          pc.hline(10, 43 + legOff, 5, sho + 1); pc.hline(18, 43 - legOff, 5, sho + 1);
        },
        drawPost(pc, pal, t) { ${readPropDrawPost('bw-dad.js')} },
      },
    },
  });
}

// --- BABY SITTING (16x20) ---
function buildBabySitSprite() {
  const pal = makePal(${readPropColors('bw-baby-sit.js')});
  return SpriteForge.buildSheet({
    frameWidth: 16, frameHeight: 20, palette: pal, outlineMode: 'black',
    animations: {
      idle: { frames: 4, speed: 0.25, loop: true, pingpong: true,
        draw(pc, pal, t) { ${readPropDraw('bw-baby-sit.js')} },
        drawPost(pc, pal, t) { ${readPropDrawPost('bw-baby-sit.js')} },
      },
    },
  });
}

// --- BABY CRAWLING (32x20) ---
function buildBabyCrawlSprite() {
  const pal = makePal(${readPropColors('bw-baby-crawl.js')});
  return SpriteForge.buildSheet({
    frameWidth: 32, frameHeight: 20, palette: pal, outlineMode: 'tinted',
    animations: {
      walk: { frames: 6, speed: 0.08, loop: true,
        draw(pc, pal, t) {
          const s = pal.groups.skin.startIdx + 2;
          const o = pal.groups.onesie.startIdx + 2;
          const hr = pal.groups.hair.startIdx + 2;
          const crawl = Math.round(Math.sin(t * Math.PI * 2) * 2);
          pc.fillEllipse(14, 10, 9, 4, o);
          pc.fillEllipse(7, 7, 4, 3, o);
          pc.fillEllipse(7, 6, 3, 2, o + 1);
          pc.fillCircle(24, 7, 5, s);
          pc.setPixel(22, 2, hr); pc.setPixel(23, 1, hr); pc.setPixel(24, 1, hr);
          pc.setPixel(25, 2, hr); pc.setPixel(24, 2, hr); pc.setPixel(23, 2, hr); pc.setPixel(22, 3, hr);
          pc.fillRect(20 + crawl, 13, 3, 4, s);
          pc.fillRect(16 - crawl, 14, 3, 3, s);
          pc.fillCircle(21 + crawl, 17, 1, s);
          pc.fillCircle(17 - crawl, 17, 1, s);
          pc.fillEllipse(8 - crawl, 14, 2, 2, o);
          pc.fillEllipse(4 + crawl, 14, 2, 2, o);
          pc.setPixel(9 - crawl, 16, s);
          pc.setPixel(5 + crawl, 16, s);
          pc.setPixel(26, 8, s + 1); pc.setPixel(27, 8, s + 1);
          pc.setPixel(26, 9, s - 2); pc.setPixel(27, 9, s - 2);
        },
        drawPost(pc, pal, t) {
          const e = pal.groups.eyes.startIdx;
          pc.fillCircle(26, 6, 2, e + 2); pc.setPixel(27, 6, e); pc.setPixel(26, 5, e + 3);
          pc.fillCircle(23, 6, 2, e + 2); pc.setPixel(24, 6, e); pc.setPixel(23, 5, e + 3);
        },
      },
    },
  });
}

// --- FURNITURE (static props) ---
function buildSofaSprite() {
  const pal = makePal(${readPropColors('bw-sofa.js')});
  return SpriteForge.static({ width: 60, height: 24, palette: pal, outlineMode: 'tinted',
    draw(pc, pal) { ${readPropDraw('bw-sofa.js')} },
  });
}
function buildCoffeeTableSprite() {
  const pal = makePal(${readPropColors('bw-coffee-table.js')});
  return SpriteForge.static({ width: 40, height: 20, palette: pal, outlineMode: 'tinted',
    draw(pc, pal) { ${readPropDraw('bw-coffee-table.js')} },
  });
}
function buildBookshelfSprite() {
  const pal = makePal(${readPropColors('bw-bookshelf.js')});
  return SpriteForge.static({ width: 16, height: 40, palette: pal, outlineMode: 'tinted',
    draw(pc, pal) { ${readPropDraw('bw-bookshelf.js')} },
  });
}
function buildTvStandSprite() {
  const pal = makePal(${readPropColors('bw-tv-stand.js')});
  return SpriteForge.static({ width: 48, height: 20, palette: pal, outlineMode: 'tinted',
    draw(pc, pal) { ${readPropDraw('bw-tv-stand.js')} },
  });
}
function buildToyboxSprite() {
  const pal = makePal(${readPropColors('bw-toybox.js')});
  return SpriteForge.static({ width: 24, height: 18, palette: pal, outlineMode: 'tinted',
    draw(pc, pal) { ${readPropDraw('bw-toybox.js')} },
  });
}

// Generate all sprites
const mumSprite = buildMumSprite();
const dadSprite = buildDadSprite();
const babySitSprite = buildBabySitSprite();
const babyCrawlSprite = buildBabyCrawlSprite();
const sofaSprite = buildSofaSprite();
const coffeeTableSprite = buildCoffeeTableSprite();
const bookshelfSprite = buildBookshelfSprite();
const tvStandSprite = buildTvStandSprite();
const toyboxSprite = buildToyboxSprite();

// ============================================================
// ROOM CONFIG — fixed size, centered
// ============================================================
const ROOM_W = 600, ROOM_H = 450;
const SCALE = 2;

function getRoomOrigin() {
  return {
    rx: Math.floor((canvas.width - ROOM_W) / 2),
    ry: Math.floor((canvas.height - ROOM_H) / 2),
  };
}

// Furniture positions (relative to room origin) + collision rects
const FURNITURE = [
  { name: 'sofa', sprite: sofaSprite, x: 20, y: 15, w: 120, h: 48, solid: true },
  { name: 'coffeeTable', sprite: coffeeTableSprite, x: 50, y: 140, w: 80, h: 40, solid: true },
  { name: 'bookshelf', sprite: bookshelfSprite, x: ROOM_W - 52, y: 80, w: 32, h: 80, solid: true },
  { name: 'tvStand', sprite: tvStandSprite, x: ROOM_W / 2 - 48, y: ROOM_H - 55, w: 96, h: 40, solid: true },
  { name: 'toybox', sprite: toyboxSprite, x: ROOM_W / 2 + 60, y: ROOM_H / 2 + 40, w: 48, h: 36, solid: false },
];

// Playpen position
const PLAYPEN = { x: ROOM_W / 2, y: ROOM_H / 2 - 20, r: 40 };

// ============================================================
// HAZARDS
// ============================================================
const HAZARDS = [
  { name: 'Scissors', icon: '✂️', danger: 3 },
  { name: 'Hot Coffee', icon: '☕', danger: 3 },
  { name: 'Glass Vase', icon: '🏺', danger: 2 },
  { name: 'Marker', icon: '🖊️', danger: 1 },
  { name: 'Phone', icon: '📱', danger: 1 },
  { name: 'Remote', icon: '📺', danger: 1 },
  { name: 'Keys', icon: '🔑', danger: 1 },
  { name: 'Plant', icon: '🌱', danger: 2 },
  { name: 'Candle', icon: '🕯️', danger: 3 },
];

// Chore types
const CHORE_TYPES = [
  { name: 'Doorbell', icon: '🔔', x: 5, y: ROOM_H / 2, points: 50, slowDur: 10 },
  { name: 'Phone', icon: '📞', x: 90, y: 160, points: 30, slowDur: 8 },
  { name: 'Oven Timer', icon: '🔥', x: ROOM_W - 30, y: ROOM_H - 30, points: 40, slowDur: 10 },
  { name: 'Spill', icon: '💧', x: 0, y: 0, points: 25, slowDur: 8, random: true },
];

// ============================================================
// GAME STATE
// ============================================================
const STATE = { TITLE: 0, PLAYING: 1, GAMEOVER: 2 };
let state = STATE.TITLE;
let selectedParent = 'mum'; // 'mum' or 'dad'
let score = 0, lives = 3, wave = 1, streak = 0;
let highScore = parseInt(localStorage.getItem('bw_high') || '0');
let gameTime = 0;

// Player-controlled parent
let player = { x: 0, y: 0, carrying: false, facing: 1 };
// AI partner
let partner = { x: 0, y: 0, target: null, targetType: null, choreProgress: 0 };

let baby = { x: 0, y: 0, state: 'penned', holdingHazard: null, dangerTimer: 0, escapeTimer: 0, targetHazard: null };
let hazards = [];
let particles = [];
let floatingTexts = [];
let dangerFlash = 0;
let chore = null; // current active chore
let choreTimer = 0; // time until next chore spawns
let choreIgnoreTimer = 0; // time chore has been active
let hazardSlowTimer = 0; // slowed hazard spawn

// Timing
let spawnTimer = 0, spawnInterval = 4, maxHazards = 3;
let babyBaseSpeed = 60, babyEscapeTime = 3;
const DANGER_TIME = 5, PARENT_SPEED = 160, AI_SPEED_MULT = 0.6, LOCK_DELAY = 0.5;

// ============================================================
// COLLISION
// ============================================================
function collideRect(x, y, w, h, fx, fy, fw, fh) {
  return x < fx + fw && x + w > fx && y < fy + fh && y + h > fy;
}

function moveWithCollision(entity, dx, dy, w, h) {
  const { rx, ry } = getRoomOrigin();
  let nx = entity.x + dx;
  let ny = entity.y + dy;
  // Room bounds
  nx = Math.max(10, Math.min(ROOM_W - 10, nx));
  ny = Math.max(10, Math.min(ROOM_H - 10, ny));
  // Furniture collision (only solid pieces)
  for (const f of FURNITURE) {
    if (!f.solid) continue;
    const halfW = w / 2, halfH = h / 2;
    if (collideRect(nx - halfW, ny - halfH, w, h, f.x, f.y, f.w, f.h)) {
      // Try X only
      if (!collideRect(nx - halfW, entity.y - halfH, w, h, f.x, f.y, f.w, f.h)) {
        ny = entity.y;
      }
      // Try Y only
      else if (!collideRect(entity.x - halfW, ny - halfH, w, h, f.x, f.y, f.w, f.h)) {
        nx = entity.x;
      }
      // Both blocked
      else { nx = entity.x; ny = entity.y; }
    }
  }
  entity.x = nx;
  entity.y = ny;
}

// ============================================================
// PARTICLES & FLOATING TEXT
// ============================================================
function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const spd = 30 + Math.random() * 60;
    particles.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 1, decay: 0.02 + Math.random() * 0.02, r: 2 + Math.random() * 3, color });
  }
}
function addFloat(x, y, text, color) { floatingTexts.push({ x, y, text, color, life: 1.5 }); }

// ============================================================
// INIT / START
// ============================================================
function startGame() {
  state = STATE.PLAYING;
  score = 0; lives = 3; wave = 1; streak = 0; gameTime = 0;
  hazards = []; particles = []; floatingTexts = [];
  dangerFlash = 0; chore = null; choreTimer = 5; hazardSlowTimer = 0;

  player.x = PLAYPEN.x + 80; player.y = PLAYPEN.y; player.carrying = false;
  partner.x = PLAYPEN.x - 80; partner.y = PLAYPEN.y; partner.target = null; partner.choreProgress = 0;

  baby.x = PLAYPEN.x; baby.y = PLAYPEN.y; baby.state = 'penned';
  baby.holdingHazard = null; baby.dangerTimer = 0; baby.escapeTimer = 0; baby.targetHazard = null;

  babyBaseSpeed = 60; spawnInterval = 4; maxHazards = 3; babyEscapeTime = 3;
  spawnTimer = 1.5;
  SFX.wave();
}

function nextWave() {
  wave++;
  babyBaseSpeed += 8;
  spawnInterval = Math.max(1.5, spawnInterval - 0.3);
  maxHazards = Math.min(8, maxHazards + 1);
  babyEscapeTime = Math.max(1.5, babyEscapeTime - 0.15);
  SFX.wave();
  addFloat(ROOM_W / 2, ROOM_H / 2 - 40, 'Wave ' + wave + '!', '#ffdd44');
}

function gameOver() {
  state = STATE.GAMEOVER;
  SFX.gameOver();
  if (score > highScore) { highScore = score; localStorage.setItem('bw_high', String(highScore)); }
  if (score > 0) submitScore('baby-wrangler', score);
}

// ============================================================
// INPUT
// ============================================================
const keys = {};
let touchTarget = null;

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (state === STATE.TITLE && (e.code === 'Enter' || e.code === 'Space')) startGame();
  if (state === STATE.GAMEOVER && (e.code === 'Enter' || e.code === 'Space')) state = STATE.TITLE;
  if (e.code === 'KeyM') SFX.muted = !SFX.muted;
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

canvas.addEventListener('mousedown', e => {
  if (state === STATE.TITLE) {
    // Check which parent was clicked
    const { rx, ry } = getRoomOrigin();
    const mx = e.clientX - rx, my = e.clientY - ry;
    if (my > ROOM_H * 0.3 && my < ROOM_H * 0.7) {
      if (mx < ROOM_W / 2) selectedParent = 'mum';
      else selectedParent = 'dad';
      SFX.select();
      startGame();
    }
    return;
  }
  if (state === STATE.GAMEOVER) { state = STATE.TITLE; return; }
  touchTarget = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('mousemove', e => { if (state === STATE.PLAYING && e.buttons) touchTarget = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('mouseup', () => { touchTarget = null; });

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (state === STATE.TITLE) {
    const { rx, ry } = getRoomOrigin();
    const t = e.touches[0];
    const mx = t.clientX - rx, my = t.clientY - ry;
    if (my > ROOM_H * 0.3 && my < ROOM_H * 0.7) {
      selectedParent = mx < ROOM_W / 2 ? 'mum' : 'dad';
      SFX.select();
      startGame();
    }
    return;
  }
  if (state === STATE.GAMEOVER) { state = STATE.TITLE; return; }
  touchTarget = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: false });
canvas.addEventListener('touchmove', e => { e.preventDefault(); if (state === STATE.PLAYING) touchTarget = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: false });
canvas.addEventListener('touchend', e => { e.preventDefault(); touchTarget = null; }, { passive: false });

// ============================================================
// HAZARD SPAWNING
// ============================================================
function spawnHazard() {
  const type = HAZARDS[Math.floor(Math.random() * HAZARDS.length)];
  const side = Math.floor(Math.random() * 4);
  let x, y;
  switch (side) {
    case 0: x = 20 + Math.random() * (ROOM_W - 40); y = 15; break;
    case 1: x = 20 + Math.random() * (ROOM_W - 40); y = ROOM_H - 20; break;
    case 2: x = 15; y = 20 + Math.random() * (ROOM_H - 40); break;
    case 3: x = ROOM_W - 15; y = 20 + Math.random() * (ROOM_H - 40); break;
  }
  // Don't spawn on playpen
  const dx = x - PLAYPEN.x, dy = y - PLAYPEN.y;
  if (Math.sqrt(dx*dx+dy*dy) < PLAYPEN.r * 2) { x = 30; y = 30; }
  hazards.push({ ...type, x, y, grabbed: false, bobPhase: Math.random() * Math.PI * 2 });
}

// ============================================================
// BABY AI
// ============================================================
function pickTarget() {
  let best = null, bestDanger = -1;
  for (const h of hazards) { if (!h.grabbed && h.danger > bestDanger) { bestDanger = h.danger; best = h; } }
  baby.targetHazard = best;
}

function updateBaby(dt) {
  const babySpeed = babyBaseSpeed + wave * 5;
  if (baby.state === 'penned') {
    if (hazards.length > 0) {
      baby.escapeTimer += dt;
      if (baby.escapeTimer >= babyEscapeTime) { baby.state = 'crawling'; baby.escapeTimer = 0; SFX.escape(); pickTarget(); }
    } else { baby.escapeTimer = 0; }
    return;
  }
  if (baby.state === 'carried') return;
  if (baby.holdingHazard) {
    baby.dangerTimer += dt;
    baby.x += Math.sin(gameTime * 3) * babySpeed * 0.3 * dt;
    baby.y += Math.cos(gameTime * 2.3) * babySpeed * 0.3 * dt;
    baby.x = Math.max(10, Math.min(ROOM_W - 10, baby.x));
    baby.y = Math.max(10, Math.min(ROOM_H - 10, baby.y));
    if (baby.dangerTimer >= DANGER_TIME) {
      lives--; baby.holdingHazard = null; baby.dangerTimer = 0;
      baby.state = 'penned'; baby.x = PLAYPEN.x; baby.y = PLAYPEN.y;
      baby.targetHazard = null; hazards = hazards.filter(h => !h.grabbed); streak = 0;
      SFX.loseLife(); addFloat(baby.x, baby.y - 20, 'Too slow!', '#ff4444');
      spawnParticles(baby.x, baby.y, '#ff4444', 15);
      if (lives <= 0) gameOver();
    }
    return;
  }
  if (!baby.targetHazard || baby.targetHazard.grabbed) { pickTarget(); }
  if (!baby.targetHazard) {
    baby.x += Math.sin(gameTime * 2) * babySpeed * 0.4 * dt;
    baby.y += Math.cos(gameTime * 1.7) * babySpeed * 0.4 * dt;
    baby.x = Math.max(10, Math.min(ROOM_W - 10, baby.x));
    baby.y = Math.max(10, Math.min(ROOM_H - 10, baby.y));
    return;
  }
  const tdx = baby.targetHazard.x - baby.x, tdy = baby.targetHazard.y - baby.y;
  const dist = Math.sqrt(tdx*tdx+tdy*tdy);
  if (dist < 15) {
    baby.holdingHazard = baby.targetHazard; baby.targetHazard.grabbed = true;
    baby.dangerTimer = 0; SFX.grab(); SFX.danger();
    addFloat(baby.x, baby.y - 20, baby.holdingHazard.name + '!', '#ff6644');
  } else {
    baby.x += (tdx/dist) * babySpeed * dt;
    baby.y += (tdy/dist) * babySpeed * dt;
  }
}

// ============================================================
// AI PARTNER
// ============================================================
function updatePartner(dt) {
  const speed = PARENT_SPEED * AI_SPEED_MULT;

  // Decide what to target
  if (!partner.target) {
    // Priority: chore > nearest hazard
    if (chore) { partner.target = chore; partner.targetType = 'chore'; }
    else if (hazards.length > 0) {
      let nearest = null, nd = Infinity;
      for (const h of hazards) {
        if (h.grabbed) continue;
        const d = Math.sqrt((h.x - partner.x)**2 + (h.y - partner.y)**2);
        if (d < nd) { nd = d; nearest = h; }
      }
      if (nearest) { partner.target = nearest; partner.targetType = 'hazard'; }
    }
  }

  if (!partner.target) return;

  // Check if target still valid
  if (partner.targetType === 'hazard' && (partner.target.grabbed || !hazards.includes(partner.target))) {
    partner.target = null; return;
  }
  if (partner.targetType === 'chore' && !chore) {
    partner.target = null; return;
  }

  const tx = partner.target.x, ty = partner.target.y;
  const dx = tx - partner.x, dy = ty - partner.y;
  const dist = Math.sqrt(dx*dx+dy*dy);

  if (dist < 15) {
    if (partner.targetType === 'hazard') {
      // Collect hazard
      if (baby.targetHazard === partner.target) baby.targetHazard = null;
      const idx = hazards.indexOf(partner.target);
      if (idx >= 0) { hazards.splice(idx, 1); score += 10; addFloat(partner.x, partner.y - 15, '+10', '#aaccff'); }
      partner.target = null;
    } else if (partner.targetType === 'chore') {
      partner.choreProgress += dt;
      if (partner.choreProgress >= 1) {
        score += chore.points;
        addFloat(chore.x, chore.y - 20, '+' + chore.points, '#ffdd44');
        hazardSlowTimer = chore.slowDur;
        SFX.chore();
        chore = null; partner.target = null; partner.choreProgress = 0;
        choreTimer = 15 + Math.random() * 5;
      }
      return; // stand still while doing chore
    }
  } else {
    partner.choreProgress = 0;
    const mx = (dx / dist) * speed * dt;
    const my = (dy / dist) * speed * dt;
    moveWithCollision(partner, mx, my, 20, 20);
  }
}

// ============================================================
// UPDATE
// ============================================================
function update(dt) {
  if (state !== STATE.PLAYING) return;
  gameTime += dt;

  // Update sprite animations
  mumSprite.animator.update(dt);
  dadSprite.animator.update(dt);
  babySitSprite.animator.update(dt);
  babyCrawlSprite.animator.update(dt);

  const playerSprite = selectedParent === 'mum' ? mumSprite : dadSprite;
  const partnerSprite = selectedParent === 'mum' ? dadSprite : mumSprite;

  // Player movement
  let dx = 0, dy = 0;
  if (keys['ArrowLeft'] || keys['KeyA']) dx--;
  if (keys['ArrowRight'] || keys['KeyD']) dx++;
  if (keys['ArrowUp'] || keys['KeyW']) dy--;
  if (keys['ArrowDown'] || keys['KeyS']) dy++;

  if (touchTarget) {
    const { rx, ry } = getRoomOrigin();
    const tdx = touchTarget.x - rx - player.x;
    const tdy = touchTarget.y - ry - player.y;
    const d = Math.sqrt(tdx*tdx+tdy*tdy);
    if (d > 5) { dx = tdx / d; dy = tdy / d; }
  } else if (dx || dy) {
    const len = Math.sqrt(dx*dx+dy*dy); dx /= len; dy /= len;
  }

  const isMoving = dx !== 0 || dy !== 0;
  if (isMoving) {
    moveWithCollision(player, dx * PARENT_SPEED * dt, dy * PARENT_SPEED * dt, 20, 30);
    if (dx > 0) player.facing = 1; else if (dx < 0) player.facing = -1;
    playerSprite.animator.play('walk');
  } else {
    playerSprite.animator.play('idle');
  }

  // Spawn hazards
  const effectiveInterval = hazardSlowTimer > 0 ? spawnInterval * 1.5 : spawnInterval;
  spawnTimer -= dt;
  if (spawnTimer <= 0 && hazards.length < maxHazards) { spawnHazard(); spawnTimer = effectiveInterval + Math.random() * 1.5; }
  if (hazardSlowTimer > 0) hazardSlowTimer -= dt;

  // Chore system
  choreTimer -= dt;
  if (choreTimer <= 0 && !chore) {
    const ct = CHORE_TYPES[Math.floor(Math.random() * CHORE_TYPES.length)];
    chore = { ...ct };
    if (chore.random) { chore.x = 50 + Math.random() * (ROOM_W - 100); chore.y = 50 + Math.random() * (ROOM_H - 100); }
    choreIgnoreTimer = 0;
  }
  if (chore) {
    choreIgnoreTimer += dt;
    if (choreIgnoreTimer >= 10) {
      chore = null; choreTimer = 15 + Math.random() * 5;
      spawnTimer = Math.max(0, spawnTimer - 2); // speed up spawning as penalty
    }
    // Player can also complete chores
    if (chore) {
      const cdx = chore.x - player.x, cdy = chore.y - player.y;
      if (Math.sqrt(cdx*cdx+cdy*cdy) < 20 && !isMoving) {
        score += chore.points;
        addFloat(chore.x, chore.y - 20, '+' + chore.points, '#ffdd44');
        hazardSlowTimer = chore.slowDur; SFX.chore();
        chore = null; choreTimer = 15 + Math.random() * 5;
      }
    }
  }

  updateBaby(dt);
  updatePartner(dt);

  // Player picks up baby
  if (!player.carrying && baby.state !== 'penned') {
    const bdx = player.x - baby.x, bdy = player.y - baby.y;
    if (Math.sqrt(bdx*bdx+bdy*bdy) < 30) {
      player.carrying = true; SFX.pickup();
      if (baby.holdingHazard) { baby.holdingHazard = null; baby.dangerTimer = 0; }
      if (baby.state === 'crawling' && !baby.holdingHazard) {
        streak++; const bonus = 50 * streak; score += bonus;
        addFloat(baby.x, baby.y - 20, 'Quick catch! +' + bonus, '#44ff88');
      }
    }
  }
  if (player.carrying) {
    baby.x = player.x; baby.y = player.y - 20; baby.state = 'carried';
    const pdx = player.x - PLAYPEN.x, pdy = player.y - PLAYPEN.y;
    if (Math.sqrt(pdx*pdx+pdy*pdy) < PLAYPEN.r + 15) {
      player.carrying = false;
      baby.x = PLAYPEN.x; baby.y = PLAYPEN.y; baby.state = 'penned';
      baby.escapeTimer = 0; baby.targetHazard = null;
      hazards = hazards.filter(h => !h.grabbed);
      SFX.safe(); score += 100;
      addFloat(PLAYPEN.x, PLAYPEN.y - 30, '+100', '#ffdd44');
      spawnParticles(PLAYPEN.x, PLAYPEN.y, '#88ff88', 10);
      if (score > 0 && Math.floor(score / 500) >= wave) nextWave();
    }
  }

  // Player/partner collect hazards
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    if (h.grabbed) continue;
    const hdx = player.x - h.x, hdy = player.y - h.y;
    if (Math.sqrt(hdx*hdx+hdy*hdy) < 25) {
      if (baby.targetHazard === h) baby.targetHazard = null;
      spawnParticles(h.x, h.y, '#aaaaaa', 5);
      score += 10; addFloat(h.x, h.y - 15, '+10', '#aaccff');
      hazards.splice(i, 1);
    }
  }

  // Danger flash
  if (baby.holdingHazard) dangerFlash += dt * 4; else dangerFlash = 0;

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 80 * dt; p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    floatingTexts[i].y -= 40 * dt; floatingTexts[i].life -= dt;
    if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
  }
}

// ============================================================
// DRAWING
// ============================================================
function drawRoom() {
  const { rx, ry } = getRoomOrigin();
  ctx.save();
  ctx.translate(rx, ry);

  // Floor
  ctx.fillStyle = '#d4b896';
  ctx.fillRect(0, 0, ROOM_W, ROOM_H);
  // Floor boards
  ctx.strokeStyle = 'rgba(160,130,100,0.3)'; ctx.lineWidth = 1;
  const boardH = 30;
  for (let y = 0; y < ROOM_H; y += boardH) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ROOM_W, y); ctx.stroke();
    const offset = (Math.floor(y / boardH) % 2) * ROOM_W * 0.3;
    for (let x = offset; x < ROOM_W; x += ROOM_W * 0.6) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + boardH); ctx.stroke();
    }
  }

  // Walls
  ctx.fillStyle = '#b8c4d0';
  ctx.fillRect(0, 0, ROOM_W, 6); // top
  ctx.fillRect(0, ROOM_H - 6, ROOM_W, 6); // bottom
  ctx.fillRect(0, 0, 6, ROOM_H); // left
  ctx.fillRect(ROOM_W - 6, 0, 6, ROOM_H); // right
  // Baseboard
  ctx.fillStyle = '#8899aa';
  ctx.fillRect(0, 0, ROOM_W, 3);
  ctx.fillRect(0, ROOM_H - 3, ROOM_W, 3);
  ctx.fillRect(0, 0, 3, ROOM_H);
  ctx.fillRect(ROOM_W - 3, 0, 3, ROOM_H);

  // Window
  const winW = 80, winH = 45, winX = ROOM_W * 0.65, winY = 7;
  ctx.fillStyle = '#aaccee';
  ctx.fillRect(winX, winY, winW, winH);
  ctx.strokeStyle = '#667788'; ctx.lineWidth = 2; ctx.strokeRect(winX, winY, winW, winH);
  ctx.beginPath(); ctx.moveTo(winX + winW/2, winY); ctx.lineTo(winX + winW/2, winY + winH);
  ctx.moveTo(winX, winY + winH/2); ctx.lineTo(winX + winW, winY + winH/2); ctx.stroke();
  // Curtains
  ctx.fillStyle = '#cc8866';
  ctx.fillRect(winX - 6, winY - 3, 8, winH + 6);
  ctx.fillRect(winX + winW - 2, winY - 3, 8, winH + 6);
  ctx.fillRect(winX - 6, winY - 3, winW + 12, 4);

  // Rug under playpen
  ctx.fillStyle = 'rgba(180,120,80,0.25)';
  ctx.beginPath(); ctx.ellipse(PLAYPEN.x, PLAYPEN.y, PLAYPEN.r + 30, PLAYPEN.r + 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(150,100,60,0.2)'; ctx.lineWidth = 2; ctx.stroke();

  ctx.restore();
}

function drawFurniture() {
  const { rx, ry } = getRoomOrigin();
  ctx.imageSmoothingEnabled = false;
  for (const f of FURNITURE) {
    f.sprite.sheet.drawFrame(ctx, 0, rx + f.x, ry + f.y, { scale: SCALE });
  }
}

function drawPlaypen() {
  const { rx, ry } = getRoomOrigin();
  const x = rx + PLAYPEN.x, y = ry + PLAYPEN.y, r = PLAYPEN.r;

  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath(); ctx.ellipse(x, y + 5, r + 5, r * 0.6 + 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#aaddaa';
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#77aa77'; ctx.lineWidth = 3; ctx.stroke();

  const barCount = 16;
  ctx.strokeStyle = '#bb8844'; ctx.lineWidth = 3;
  for (let i = 0; i < barCount; i++) {
    const a = (i / barCount) * Math.PI * 2;
    const bx = x + Math.cos(a) * r, by = y + Math.sin(a) * r * 0.6;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by - 18); ctx.stroke();
  }

  // Escape indicator
  if (baby.state === 'penned' && hazards.length > 0) {
    const progress = baby.escapeTimer / babyEscapeTime;
    if (progress > 0.3) {
      ctx.strokeStyle = 'rgba(255,' + Math.floor(200*(1-progress)) + ',0,' + progress + ')';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, r + 8, -Math.PI/2, -Math.PI/2 + progress * Math.PI * 2); ctx.stroke();
    }
  }
}

function drawCharacter(sprite, entity, isCarrying) {
  const { rx, ry } = getRoomOrigin();
  ctx.imageSmoothingEnabled = false;
  const fw = sprite.sheet.frameWidth * SCALE;
  const fh = sprite.sheet.frameHeight * SCALE;
  sprite.animator.draw(ctx, rx + entity.x - fw/2, ry + entity.y - fh + 20, { scale: SCALE, flipX: entity.facing < 0 });
}

function drawBaby() {
  const { rx, ry } = getRoomOrigin();
  ctx.imageSmoothingEnabled = false;
  if (baby.state === 'penned' || baby.state === 'carried') {
    const fw = babySitSprite.sheet.frameWidth * SCALE;
    const fh = babySitSprite.sheet.frameHeight * SCALE;
    babySitSprite.animator.draw(ctx, rx + baby.x - fw/2, ry + baby.y - fh/2, { scale: SCALE });
  } else {
    const fw = babyCrawlSprite.sheet.frameWidth * SCALE;
    const fh = babyCrawlSprite.sheet.frameHeight * SCALE;
    babyCrawlSprite.animator.draw(ctx, rx + baby.x - fw/2, ry + baby.y - fh/2, { scale: SCALE });
  }
  // Held hazard
  if (baby.holdingHazard) {
    ctx.font = '18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(baby.holdingHazard.icon, rx + baby.x + 15, ry + baby.y - 5);
    const progress = baby.dangerTimer / DANGER_TIME;
    const barW = 30, barH = 4;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(rx + baby.x - barW/2, ry + baby.y - 25, barW, barH);
    ctx.fillStyle = 'rgb(' + Math.floor(255*progress) + ',' + Math.floor(255*(1-progress)) + ',0)';
    ctx.fillRect(rx + baby.x - barW/2, ry + baby.y - 25, barW * progress, barH);
  }
}

function drawHazards() {
  const { rx, ry } = getRoomOrigin();
  for (const h of hazards) {
    if (h.grabbed) continue;
    const bob = Math.sin(gameTime * 2 + h.bobPhase) * 3;
    if (h.danger >= 3) {
      ctx.fillStyle = 'rgba(255,50,50,0.15)';
      ctx.beginPath(); ctx.arc(rx + h.x, ry + h.y, 20, 0, Math.PI * 2); ctx.fill();
    }
    ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(h.icon, rx + h.x, ry + h.y + bob);
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = h.danger >= 3 ? '#ff4444' : h.danger >= 2 ? '#ffaa44' : '#aaaaaa';
    ctx.fillText('!'.repeat(h.danger), rx + h.x, ry + h.y + bob + 14);
  }
}

function drawChore() {
  if (!chore) return;
  const { rx, ry } = getRoomOrigin();
  const pulse = 0.6 + Math.sin(gameTime * 4) * 0.4;
  ctx.globalAlpha = pulse;
  ctx.font = '24px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(chore.icon, rx + chore.x, ry + chore.y);
  ctx.font = '10px Segoe UI'; ctx.fillStyle = '#ffdd44';
  ctx.fillText(chore.name, rx + chore.x, ry + chore.y + 18);
  ctx.globalAlpha = 1;
}

function drawPartnerBubble() {
  if (!partner.target) return;
  const { rx, ry } = getRoomOrigin();
  const bx = rx + partner.x, by = ry + partner.y - 50;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI * 2); ctx.fill();
  ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(partner.targetType === 'chore' ? chore.icon : '🧹', bx, by);
}

function drawHUD() {
  const { rx, ry } = getRoomOrigin();
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  let hx = rx + 10;
  for (let i = 0; i < 3; i++) { ctx.globalAlpha = i < lives ? 1 : 0.2; ctx.fillText('❤️', hx, ry + ROOM_H + 8); hx += 24; }
  ctx.globalAlpha = 1;
  ctx.font = 'bold 16px Segoe UI'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.fillText('Score: ' + score, rx + ROOM_W / 2, ry + ROOM_H + 10);
  ctx.fillStyle = '#aaa'; ctx.font = '12px Segoe UI';
  ctx.fillText('Wave ' + wave, rx + ROOM_W / 2, ry + ROOM_H + 30);
  ctx.textAlign = 'right'; ctx.fillStyle = '#888'; ctx.font = '12px Segoe UI';
  ctx.fillText('Best: ' + highScore, rx + ROOM_W - 10, ry + ROOM_H + 10);
  if (SFX.muted) ctx.fillText('MUTED [M]', rx + ROOM_W - 10, ry + ROOM_H + 26);
}

function drawTitle() {
  const { rx, ry } = getRoomOrigin();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = 'bold 40px Segoe UI'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffdd88';
  ctx.fillText('BABY WRANGLER', rx + ROOM_W / 2, ry + 60);
  ctx.font = '16px Segoe UI'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('Choose your parent — the other one helps around the house!', rx + ROOM_W / 2, ry + 95);

  // Draw mum on left, dad on right
  ctx.imageSmoothingEnabled = false;
  const mfw = mumSprite.sheet.frameWidth * 3, mfh = mumSprite.sheet.frameHeight * 3;
  const dfw = dadSprite.sheet.frameWidth * 3, dfh = dadSprite.sheet.frameHeight * 3;
  mumSprite.sheet.drawFrame(ctx, 0, rx + ROOM_W * 0.25 - mfw/2, ry + ROOM_H * 0.45 - mfh/2, { scale: 3 });
  dadSprite.sheet.drawFrame(ctx, 0, rx + ROOM_W * 0.75 - dfw/2, ry + ROOM_H * 0.45 - dfh/2, { scale: 3 });

  ctx.font = 'bold 18px Segoe UI';
  ctx.fillStyle = '#ee88aa';
  ctx.fillText('MUM', rx + ROOM_W * 0.25, ry + ROOM_H * 0.75);
  ctx.fillStyle = '#88bb88';
  ctx.fillText('DAD', rx + ROOM_W * 0.75, ry + ROOM_H * 0.75);

  ctx.font = '14px Segoe UI';
  const alpha = 0.4 + Math.sin(gameTime * 3) * 0.3;
  ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
  ctx.fillText('Click or tap to choose', rx + ROOM_W / 2, ry + ROOM_H * 0.85);
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const { rx, ry } = getRoomOrigin();
  ctx.font = 'bold 36px Segoe UI'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff6644';
  ctx.fillText('GAME OVER', rx + ROOM_W / 2, ry + ROOM_H * 0.35);
  ctx.font = '18px Segoe UI'; ctx.fillStyle = '#fff';
  ctx.fillText('Score: ' + score + '  |  Wave: ' + wave, rx + ROOM_W / 2, ry + ROOM_H * 0.48);
  if (score >= highScore && score > 0) {
    ctx.fillStyle = '#ffdd44'; ctx.font = 'bold 16px Segoe UI';
    ctx.fillText('NEW HIGH SCORE!', rx + ROOM_W / 2, ry + ROOM_H * 0.58);
  }
  const alpha = 0.4 + Math.sin(gameTime * 3) * 0.3;
  ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
  ctx.font = '14px Segoe UI';
  ctx.fillText('Tap or press ENTER to continue', rx + ROOM_W / 2, ry + ROOM_H * 0.72);
}

// ============================================================
// GAME LOOP
// ============================================================
let lastTime = 0;
function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;
  if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) resize();

  ctx.fillStyle = '#2a1a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state === STATE.TITLE) {
    gameTime += dt;
    drawTitle();
  } else if (state === STATE.PLAYING) {
    update(dt);
    drawRoom();
    drawPlaypen();
    drawFurniture();
    drawChore();
    drawHazards();
    // Y-sort: baby, player, partner
    const entities = [];
    if (baby.state !== 'carried') entities.push({ y: baby.y, draw: drawBaby });
    const playerSprite = selectedParent === 'mum' ? mumSprite : dadSprite;
    const partnerSprite = selectedParent === 'mum' ? dadSprite : mumSprite;
    entities.push({ y: player.y, draw: () => drawCharacter(playerSprite, player, player.carrying) });
    entities.push({ y: partner.y, draw: () => { drawCharacter(partnerSprite, partner, false); drawPartnerBubble(); } });
    if (baby.state === 'carried') entities.push({ y: player.y - 1, draw: drawBaby });
    entities.sort((a, b) => a.y - b.y);
    for (const e of entities) e.draw();
    // Particles
    const { rx, ry } = getRoomOrigin();
    for (const p of particles) {
      ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(rx + p.x, ry + p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const ft of floatingTexts) {
      ctx.globalAlpha = Math.min(1, ft.life); ctx.fillStyle = ft.color;
      ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(ft.text, rx + ft.x, ry + ft.y);
    }
    ctx.globalAlpha = 1;
    if (baby.holdingHazard) {
      const pulse = Math.sin(dangerFlash) * 0.5 + 0.5;
      ctx.fillStyle = 'rgba(255,0,0,' + (pulse * 0.08) + ')';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    drawHUD();
  } else if (state === STATE.GAMEOVER) {
    drawRoom(); drawPlaypen(); drawFurniture(); drawHazards();
    drawBaby();
    const playerSprite = selectedParent === 'mum' ? mumSprite : dadSprite;
    drawCharacter(playerSprite, player, false);
    drawHUD(); drawGameOver();
    gameTime += dt;
  }

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
`;

// Build final HTML
const html = \`<!DOCTYPE html>
<html lang="en">
<head>
<link rel="icon" href="data:,">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Baby Wrangler</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #2a1a0a; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; font-family: 'Segoe UI', Arial, sans-serif; }
canvas { display: block; touch-action: none; width: 100vw; height: 100vh; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
\${engine}

\${gameCode}
</script>
</body>
</html>\`;

fs.writeFileSync('C:/AI/Claude/games/baby-wrangler/index.html', html);
console.log('Built! Size:', Math.round(html.length / 1024) + 'KB, Lines:', html.split('\\n').length);

// Helper functions used during template literal construction
function readPropColors(file) {
  const code = readProp(file);
  const m = code.match(/colors:\\s*(\\{[^}]+\\})/);
  return m ? m[1] : "{ body: '#888888' }";
}

function readPropDraw(file) {
  const code = readProp(file);
  const m = code.match(/draw\\(pc, pal\\) \\{([\\s\\S]*?)\\n  \\},?\\n/);
  return m ? m[1].trim() : '// draw not found';
}

function readPropDrawPost(file) {
  const code = readProp(file);
  const m = code.match(/drawPost\\(pc, pal\\) \\{([\\s\\S]*?)\\n  \\},?\\n/);
  return m ? m[1].trim() : '// drawPost not found';
}
`;

// Wait, the template literal approach with embedded function calls won't work
// because JS evaluates template literals at parse time, not at the function call points.
// I need a different approach — string concatenation.

console.log('Build script needs different approach — using string replacement instead.');

// Simpler approach: write the game code as a string with placeholders and replace them
const propFiles = {
  'bw-mum.js': readProp('bw-mum.js'),
  'bw-dad.js': readProp('bw-dad.js'),
  'bw-baby-sit.js': readProp('bw-baby-sit.js'),
  'bw-baby-crawl.js': readProp('bw-baby-crawl.js'),
  'bw-sofa.js': readProp('bw-sofa.js'),
  'bw-coffee-table.js': readProp('bw-coffee-table.js'),
  'bw-bookshelf.js': readProp('bw-bookshelf.js'),
  'bw-tv-stand.js': readProp('bw-tv-stand.js'),
  'bw-toybox.js': readProp('bw-toybox.js'),
};

// Actually, let me just write the file directly rather than trying to template it
console.log('Writing game file directly...');
`;

fs.writeFileSync('/tmp/build-bw.js', 'console.log("see direct write below")');
console.log('Build script written. Will write game directly instead.');
