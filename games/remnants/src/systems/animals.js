
// ============================================================
// SYSTEM: Animals — wildlife that moves faster than the player
// ============================================================

// Animal types — each has behaviour, speed, biome preference
// Only quadrupeds move faster than humans (speed 2 = 2 tiles per player turn)
var ANIMAL_TYPES = {
  rabbit:  { name: 'Rabbit',  color: '#bbaa88', speed: 2, hp: 3,  hostile: false, tameable: true,  food: 'carrot',      rideable: false, biomes: ['grassland','forest'] },
  deer:    { name: 'Deer',    color: '#aa8855', speed: 2, hp: 8,  hostile: false, tameable: false, food: null,          rideable: false, biomes: ['grassland','forest'] },
  wolf:    { name: 'Wolf',    color: '#666666', speed: 2, hp: 12, hostile: true,  tameable: true,  food: 'dried_fish',  rideable: false, biomes: ['forest','tundra'] },
  horse:   { name: 'Horse',   color: '#886644', speed: 2, hp: 20, hostile: false, tameable: true,  food: 'wheat',       rideable: true,  biomes: ['grassland'] },
  boar:    { name: 'Boar',    color: '#665544', speed: 1, hp: 15, hostile: true,  tameable: false, food: null,          rideable: false, biomes: ['forest','swamp'] },
  fox:     { name: 'Fox',     color: '#cc6633', speed: 2, hp: 6,  hostile: false, tameable: true,  food: 'berry',       rideable: false, biomes: ['grassland','forest'] },
  bear:    { name: 'Bear',    color: '#554433', speed: 1, hp: 30, hostile: true,  tameable: false, food: null,          rideable: false, biomes: ['forest','tundra'] },
};

// Animal constructor
function Animal(wx, wy, type) {
  var def = ANIMAL_TYPES[type];
  this.x = wx;
  this.y = wy;
  this.type = type;
  this.name = def.name;
  this.color = def.color;
  this.speed = def.speed;     // tiles per player turn
  this.hp = def.hp;
  this.maxHp = def.hp;
  this.hostile = def.hostile;
  this.tameable = def.tameable;
  this.rideable = def.rideable;
  this.alive = true;
  this.tamed = false;
  this.petName = null;        // custom name when tamed
  this.following = false;     // follows player as pet
  this.mounted = false;       // player is riding this animal
  this.animTimer = Math.random() * 10;
  this.walkTimer = 0;
  this.lastDir = { x: 0, y: 1 };
  this.moveAccum = 0;
  this.fleeTimer = 0;        // turns to flee after being spooked
  this.aggroRange = def.hostile ? 6 : 0;
}

// Move animal — same wall-avoidance as NPCs but respects animals+NPCs+player
Animal.prototype.moveToward = function(tx, ty) {
  var dx = tx - this.x, dy = ty - this.y;
  if (dx === 0 && dy === 0) return false;
  var mdx = dx !== 0 ? Math.sign(dx) : 0;
  var mdy = dy !== 0 ? Math.sign(dy) : 0;
  var tries = Math.abs(dx) >= Math.abs(dy)
    ? [{x:mdx,y:0},{x:0,y:mdy},{x:mdx,y:mdy}]
    : [{x:0,y:mdy},{x:mdx,y:0},{x:mdx,y:mdy}];
  for (var i = 0; i < tries.length; i++) {
    var nx = this.x + tries[i].x, ny = this.y + tries[i].y;
    if (!Overworld.isPassable(nx, ny)) continue;
    if (AnimalManager.getAt(nx, ny)) continue;
    // Don't walk onto the player
    var pl = GameUtils.player();
    if (pl && nx === Math.round(pl.x) && ny === Math.round(pl.y)) continue;
    this.lastDir = tries[i];
    this.x = nx; this.y = ny;
    this.walkTimer = 0.25;
    return true;
  }
  return false;
};

Animal.prototype.moveAway = function(fx, fy) {
  var dx = this.x - fx, dy = this.y - fy;
  if (dx === 0 && dy === 0) dx = Math.random() < 0.5 ? 1 : -1;
  return this.moveToward(this.x + Math.sign(dx), this.y + Math.sign(dy));
};

// Animal Manager
var AnimalManager = {
  animals: [],

  add: function(animal) { this.animals.push(animal); return animal; },

  remove: function(animal) {
    var idx = this.animals.indexOf(animal);
    if (idx >= 0) this.animals.splice(idx, 1);
  },

  getAt: function(wx, wy) {
    for (var i = 0; i < this.animals.length; i++) {
      if (this.animals[i].alive && this.animals[i].x === wx && this.animals[i].y === wy) return this.animals[i];
    }
    return null;
  },

  clear: function() { this.animals = []; },

  // Get tamed pets that are following
  getPets: function() {
    return this.animals.filter(function(a) { return a.alive && a.tamed && a.following; });
  },

  // Get the animal player is currently riding
  getMount: function() {
    for (var i = 0; i < this.animals.length; i++) {
      if (this.animals[i].alive && this.animals[i].mounted) return this.animals[i];
    }
    return null;
  },
};

// Draw animals — quadruped pixel art
function drawAnimalPixel(ctx, sx, sy, ts, animal) {
  var m = ts / 16;
  var walking = animal.walkTimer > 0;
  var cycle = walking ? Math.sin(animal.animTimer * Math.PI * 6) : 0;
  var bob = walking ? Math.abs(Math.sin(animal.animTimer * Math.PI * 6)) * m * 0.5 : 0;
  var col = animal.color;
  var dark = shadeHex(col, -40);
  var light = shadeHex(col, 40);
  var type = animal.type;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(sx + 8 * m, sy + 15 * m, 5 * m, 1.2 * m, 0, 0, Math.PI * 2); ctx.fill();

  if (type === 'rabbit') {
    var legOff = cycle * m;
    // Body
    ctx.fillStyle = col;
    ctx.fillRect(sx + 5 * m, sy + 8 * m - bob, 6 * m, 5 * m);
    // Head
    ctx.fillStyle = light;
    ctx.fillRect(sx + 9 * m, sy + 6 * m - bob, 4 * m, 4 * m);
    // Ears
    ctx.fillStyle = col;
    ctx.fillRect(sx + 10 * m, sy + 2 * m - bob, 1.5 * m, 4 * m);
    ctx.fillRect(sx + 12 * m, sy + 3 * m - bob, 1.5 * m, 3.5 * m);
    // Eye
    ctx.fillStyle = '#111';
    ctx.fillRect(sx + 12 * m, sy + 7 * m - bob, 1 * m, 1 * m);
    // Legs
    ctx.fillStyle = dark;
    ctx.fillRect(sx + 5 * m, sy + 12 * m + legOff, 2 * m, 3 * m);
    ctx.fillRect(sx + 9 * m, sy + 12 * m - legOff, 2 * m, 3 * m);
    // Tail
    ctx.fillStyle = '#eee';
    ctx.fillRect(sx + 4 * m, sy + 9 * m - bob, 2 * m, 2 * m);

  } else if (type === 'deer') {
    var legOff = cycle * 1.5 * m;
    // Legs (back pair)
    ctx.fillStyle = dark;
    ctx.fillRect(sx + 4 * m, sy + 10 * m + legOff, 2 * m, 5 * m);
    ctx.fillRect(sx + 10 * m, sy + 10 * m - legOff, 2 * m, 5 * m);
    // Body
    ctx.fillStyle = col;
    ctx.fillRect(sx + 3 * m, sy + 5 * m - bob, 10 * m, 6 * m);
    // Belly
    ctx.fillStyle = shadeHex(col, 30);
    ctx.fillRect(sx + 4 * m, sy + 9 * m - bob, 8 * m, 2 * m);
    // Neck
    ctx.fillStyle = col;
    ctx.fillRect(sx + 11 * m, sy + 3 * m - bob, 3 * m, 4 * m);
    // Head
    ctx.fillStyle = light;
    ctx.fillRect(sx + 12 * m, sy + 1 * m - bob, 3 * m, 3 * m);
    // Antlers
    ctx.fillStyle = '#776655';
    ctx.fillRect(sx + 12 * m, sy - 2 * m - bob, 1 * m, 3 * m);
    ctx.fillRect(sx + 14 * m, sy - 1 * m - bob, 1 * m, 2.5 * m);
    ctx.fillRect(sx + 11 * m, sy - 2 * m - bob, 2 * m, 1 * m);
    // Eye
    ctx.fillStyle = '#111';
    ctx.fillRect(sx + 14 * m, sy + 2 * m - bob, 1 * m, 1 * m);
    // Tail
    ctx.fillStyle = '#ddd';
    ctx.fillRect(sx + 2 * m, sy + 5 * m - bob, 2 * m, 2 * m);

  } else if (type === 'wolf') {
    var legOff = cycle * 1.5 * m;
    // Legs
    ctx.fillStyle = dark;
    ctx.fillRect(sx + 3 * m, sy + 11 * m + legOff, 2 * m, 4 * m);
    ctx.fillRect(sx + 7 * m, sy + 11 * m - legOff, 2 * m, 4 * m);
    ctx.fillRect(sx + 10 * m, sy + 11 * m + legOff * 0.5, 2 * m, 4 * m);
    // Body
    ctx.fillStyle = col;
    ctx.fillRect(sx + 2 * m, sy + 5 * m - bob, 11 * m, 7 * m);
    // Head
    ctx.fillStyle = light;
    ctx.fillRect(sx + 11 * m, sy + 4 * m - bob, 4 * m, 4 * m);
    // Snout
    ctx.fillStyle = dark;
    ctx.fillRect(sx + 14 * m, sy + 6 * m - bob, 2 * m, 2 * m);
    // Ears
    ctx.fillStyle = col;
    ctx.fillRect(sx + 11 * m, sy + 2 * m - bob, 2 * m, 2.5 * m);
    ctx.fillRect(sx + 13.5 * m, sy + 2.5 * m - bob, 1.5 * m, 2 * m);
    // Eye
    ctx.fillStyle = animal.hostile ? '#ff4444' : '#ffcc44';
    ctx.fillRect(sx + 13 * m, sy + 5 * m - bob, 1 * m, 1 * m);
    // Tail
    ctx.fillStyle = dark;
    ctx.fillRect(sx + 0 * m, sy + 4 * m - bob, 3 * m, 2 * m);

  } else if (type === 'horse') {
    var legOff = cycle * 2 * m;
    // Legs
    ctx.fillStyle = dark;
    ctx.fillRect(sx + 3 * m, sy + 10 * m + legOff, 2 * m, 5 * m);
    ctx.fillRect(sx + 6 * m, sy + 10 * m - legOff, 2 * m, 5 * m);
    ctx.fillRect(sx + 9 * m, sy + 10 * m + legOff * 0.7, 2 * m, 5 * m);
    ctx.fillRect(sx + 12 * m, sy + 10 * m - legOff * 0.7, 2 * m, 5 * m);
    // Body — larger than others
    ctx.fillStyle = col;
    ctx.fillRect(sx + 2 * m, sy + 4 * m - bob, 13 * m, 7 * m);
    // Neck
    ctx.fillStyle = col;
    ctx.fillRect(sx + 12 * m, sy + 1 * m - bob, 3 * m, 5 * m);
    // Head
    ctx.fillStyle = light;
    ctx.fillRect(sx + 13 * m, sy - 1 * m - bob, 3 * m, 3.5 * m);
    // Mane
    ctx.fillStyle = shadeHex(col, -60);
    ctx.fillRect(sx + 12 * m, sy + 0 * m - bob, 1.5 * m, 5 * m);
    // Eye
    ctx.fillStyle = '#221100';
    ctx.fillRect(sx + 14.5 * m, sy + 0 * m - bob, 1 * m, 1 * m);
    // Tail
    ctx.fillStyle = shadeHex(col, -60);
    ctx.fillRect(sx + 0 * m, sy + 3 * m - bob, 3 * m, 1 * m);
    ctx.fillRect(sx + 0 * m, sy + 4 * m - bob, 2 * m, 3 * m);

  } else if (type === 'boar') {
    var legOff = cycle * 1.2 * m;
    // Legs
    ctx.fillStyle = dark;
    ctx.fillRect(sx + 4 * m, sy + 11 * m + legOff, 2 * m, 4 * m);
    ctx.fillRect(sx + 10 * m, sy + 11 * m - legOff, 2 * m, 4 * m);
    // Body — stocky
    ctx.fillStyle = col;
    ctx.fillRect(sx + 3 * m, sy + 6 * m - bob, 10 * m, 6 * m);
    // Head
    ctx.fillStyle = light;
    ctx.fillRect(sx + 11 * m, sy + 6 * m - bob, 4 * m, 4 * m);
    // Snout
    ctx.fillStyle = '#cc9988';
    ctx.fillRect(sx + 14 * m, sy + 8 * m - bob, 2 * m, 2 * m);
    // Tusks
    ctx.fillStyle = '#eeeecc';
    ctx.fillRect(sx + 14.5 * m, sy + 10 * m - bob, 0.8 * m, 1.5 * m);
    // Eye
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(sx + 13 * m, sy + 7 * m - bob, 1 * m, 1 * m);

  } else if (type === 'fox') {
    var legOff = cycle * 1.2 * m;
    // Legs
    ctx.fillStyle = dark;
    ctx.fillRect(sx + 4 * m, sy + 11 * m + legOff, 1.5 * m, 4 * m);
    ctx.fillRect(sx + 9 * m, sy + 11 * m - legOff, 1.5 * m, 4 * m);
    // Body
    ctx.fillStyle = col;
    ctx.fillRect(sx + 3 * m, sy + 6 * m - bob, 9 * m, 6 * m);
    // White belly
    ctx.fillStyle = '#eeddcc';
    ctx.fillRect(sx + 4 * m, sy + 10 * m - bob, 7 * m, 2 * m);
    // Head
    ctx.fillStyle = col;
    ctx.fillRect(sx + 10 * m, sy + 5 * m - bob, 4 * m, 4 * m);
    // White cheeks
    ctx.fillStyle = '#eeddcc';
    ctx.fillRect(sx + 13 * m, sy + 7 * m - bob, 2 * m, 2 * m);
    // Ears
    ctx.fillStyle = dark;
    ctx.fillRect(sx + 10 * m, sy + 3 * m - bob, 1.5 * m, 2.5 * m);
    ctx.fillRect(sx + 12.5 * m, sy + 3.5 * m - bob, 1.5 * m, 2 * m);
    // Eye
    ctx.fillStyle = '#443300';
    ctx.fillRect(sx + 12.5 * m, sy + 6 * m - bob, 1 * m, 1 * m);
    // Bushy tail
    ctx.fillStyle = col;
    ctx.fillRect(sx + 1 * m, sy + 5 * m - bob, 3 * m, 2 * m);
    ctx.fillStyle = '#eeddcc';
    ctx.fillRect(sx + 0 * m, sy + 6 * m - bob, 2 * m, 1.5 * m);

  } else if (type === 'bear') {
    var legOff = cycle * 1.2 * m;
    // Legs
    ctx.fillStyle = dark;
    ctx.fillRect(sx + 2 * m, sy + 10 * m + legOff, 3 * m, 5 * m);
    ctx.fillRect(sx + 6 * m, sy + 10 * m - legOff, 3 * m, 5 * m);
    ctx.fillRect(sx + 10 * m, sy + 10 * m + legOff * 0.5, 3 * m, 5 * m);
    // Body — massive
    ctx.fillStyle = col;
    ctx.fillRect(sx + 1 * m, sy + 3 * m - bob, 13 * m, 8 * m);
    // Hump
    ctx.fillStyle = dark;
    ctx.fillRect(sx + 4 * m, sy + 1 * m - bob, 5 * m, 3 * m);
    // Head
    ctx.fillStyle = light;
    ctx.fillRect(sx + 11 * m, sy + 3 * m - bob, 4 * m, 4 * m);
    // Snout
    ctx.fillStyle = '#aa9977';
    ctx.fillRect(sx + 14 * m, sy + 5 * m - bob, 2 * m, 2 * m);
    // Ears
    ctx.fillStyle = col;
    ctx.fillRect(sx + 11 * m, sy + 1.5 * m - bob, 2 * m, 2 * m);
    ctx.fillRect(sx + 14 * m, sy + 2 * m - bob, 1.5 * m, 1.5 * m);
    // Eye
    ctx.fillStyle = '#111';
    ctx.fillRect(sx + 13 * m, sy + 4 * m - bob, 1 * m, 1 * m);
  }

  // Tamed heart indicator
  if (animal.tamed) {
    ctx.fillStyle = '#ff4488';
    ctx.font = Math.max(6, Math.round(ts * 0.2)) + 'px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('\u2665', sx + 8 * m, sy - 1 * m);
  }
}

// AI tick — animals move 'speed' tiles per player turn
GameEvents.on('turnEnd', function(game) {
  if (game.player.mode !== 'overworld') return;
  var p = game.player;

  for (var i = AnimalManager.animals.length - 1; i >= 0; i--) {
    var a = AnimalManager.animals[i];
    if (!a.alive) continue;

    // Despawn if too far from player
    var dist = Math.abs(a.x - p.x) + Math.abs(a.y - p.y);
    if (dist > 50 && !a.tamed) {
      a.alive = false;
      continue;
    }

    // Mounted animals don't act independently
    if (a.mounted) continue;

    // Move 'speed' times per turn
    for (var step = 0; step < a.speed; step++) {
      if (a.tamed && a.following) {
        // Pets follow the player, stay 1-2 tiles away
        if (dist > 2) {
          a.moveToward(p.x, p.y);
        } else if (dist <= 1 && Math.random() < 0.3) {
          // Wander adjacent to player
          var d = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}][Math.floor(Math.random() * 4)];
          var nx = a.x + d.x, ny = a.y + d.y;
          if (Math.abs(nx - p.x) + Math.abs(ny - p.y) <= 3) {
            a.moveToward(nx, ny);
          }
        }
      } else if (a.hostile && dist <= a.aggroRange) {
        // Hostile: chase player
        a.moveToward(p.x, p.y);
      } else if (a.fleeTimer > 0) {
        // Fleeing from player
        a.moveAway(p.x, p.y);
        a.fleeTimer--;
      } else if (!a.hostile && dist < 4) {
        // Skittish: flee from player
        a.fleeTimer = 3;
        a.moveAway(p.x, p.y);
      } else {
        // Wander randomly
        if (Math.random() < 0.3) {
          var d = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}][Math.floor(Math.random() * 4)];
          a.moveToward(a.x + d.x, a.y + d.y);
        }
      }
    }

    // Hostile animals adjacent to player deal damage
    if (a.hostile && !a.tamed && Math.abs(a.x - p.x) + Math.abs(a.y - p.y) <= 1) {
      var dmg = Math.ceil(a.hp * 0.3);
      p.hp -= dmg;
      p.hitFlash = 0.2;
      GameUtils.addFloating(p.x, p.y, '-' + dmg, '#ff4422');
      GameUtils.addLog(a.name + ' attacks! -' + dmg + ' HP', '#ff6644');
      if (p.hp <= 0) { p.hp = 0; game.die(); return; }
    }
  }

  // Clean dead animals
  AnimalManager.animals = AnimalManager.animals.filter(function(a) { return a.alive; });
});

// Spawn animals periodically based on biome
GameEvents.on('turnEnd', function(game) {
  if (game.player.mode !== 'overworld') return;
  if (GameTime.turn % 20 !== 0) return; // every ~20 turns

  // Cap animals near player
  var nearby = 0;
  var p = game.player;
  for (var i = 0; i < AnimalManager.animals.length; i++) {
    var a = AnimalManager.animals[i];
    if (a.alive && !a.tamed && Math.abs(a.x - p.x) + Math.abs(a.y - p.y) < 30) nearby++;
  }
  if (nearby >= 6) return;

  // Pick a random spot at edge of view
  var edge = CONFIG.VIEW_W + 2;
  var angle = Math.random() * Math.PI * 2;
  var sx = Math.round(p.x + Math.cos(angle) * edge);
  var sy = Math.round(p.y + Math.sin(angle) * edge);
  if (!Overworld.isPassable(sx, sy)) return;

  // Get biome at spawn point
  var tile = Overworld.getTile(sx, sy);
  var biome = tile.biome || 'grassland';

  // Pick a valid animal type for this biome
  var candidates = [];
  for (var type in ANIMAL_TYPES) {
    if (ANIMAL_TYPES[type].biomes.indexOf(biome) >= 0) candidates.push(type);
  }
  if (candidates.length === 0) return;

  // Night spawns more hostile animals
  var isNight = GameTime.isNight();
  if (isNight) {
    var hostileCandidates = candidates.filter(function(t) { return ANIMAL_TYPES[t].hostile; });
    if (hostileCandidates.length > 0 && Math.random() < 0.6) candidates = hostileCandidates;
  }

  var type = candidates[Math.floor(Math.random() * candidates.length)];
  AnimalManager.add(new Animal(sx, sy, type));
});

// Update animation timers
GameEvents.on('update', function(game, dt) {
  for (var i = 0; i < AnimalManager.animals.length; i++) {
    var a = AnimalManager.animals[i];
    a.animTimer += dt;
    if (a.walkTimer > 0) a.walkTimer -= dt;
  }
});

// Draw animals on entity layer
GameEvents.on('draw:entities', function(game, ctx) {
  if (game.player.mode !== 'overworld') return;
  var ts = CONFIG.TILE;
  for (var i = 0; i < AnimalManager.animals.length; i++) {
    var a = AnimalManager.animals[i];
    if (!a.alive || a.mounted) continue;
    // Only draw if on screen
    var dx = a.x - game.player.x, dy = a.y - game.player.y;
    if (Math.abs(dx) > CONFIG.VIEW_W + 2 || Math.abs(dy) > CONFIG.VIEW_H + 2) continue;

    var sx = a.x * ts, sy = a.y * ts;
    drawAnimalPixel(ctx, sx, sy, ts, a);

    // Name label — always show type when nearby, pet name if tamed
    var adist = Math.abs(dx) + Math.abs(dy);
    if (adist <= 5) {
      var label = (a.tamed && a.petName) ? a.petName : a.name;
      ctx.fillStyle = a.hostile ? '#ff8866' : a.tamed ? '#ffccaa' : '#aaaaaa';
      ctx.font = Math.max(7, Math.round(ts * 0.22)) + 'px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(label, sx + ts / 2, sy - ts * 0.15);
    }

    // HP bar for hostile animals
    if (a.hostile && a.hp < a.maxHp) {
      var barW = ts - 4, hpR = a.hp / a.maxHp;
      ctx.fillStyle = '#222';
      ctx.fillRect(sx + 2, sy - 5, barW, 3);
      ctx.fillStyle = hpR > 0.5 ? '#44dd44' : hpR > 0.25 ? '#ddcc00' : '#dd3333';
      ctx.fillRect(sx + 2, sy - 5, barW * hpR, 3);
    }
  }
});

// Block walking onto animals (except mounted ones)
var _origIsPassableAnimals = Overworld.isPassable;
Overworld.isPassable = function(wx, wy) {
  if (!_origIsPassableAnimals.call(Overworld, wx, wy)) return false;
  var a = AnimalManager.getAt(wx, wy);
  if (a && !a.mounted) return false;
  return true;
};

// Player can interact with animals via E key — tame, mount, attack
// Uses the resolveInteraction path via the aim state
var _origResolveInteraction = Game.prototype.resolveInteraction;
Game.prototype.resolveInteraction = function(tx, ty) {
  var animal = AnimalManager.getAt(tx, ty);
  if (animal && animal.alive) {
    var p = this.player;
    if (animal.tamed) {
      if (animal.rideable && !animal.mounted) {
        // Mount it
        animal.mounted = true;
        animal.following = false;
        animal.x = p.x;
        animal.y = p.y;
        GameUtils.addLog('Mounted ' + (animal.petName || animal.name) + '!', '#ddaa44');
        SFX.shrine();
        this.endOverworldTurn();
        return true;
      } else if (animal.mounted) {
        // Dismount
        animal.mounted = false;
        animal.following = true;
        // Place animal adjacent
        var dirs = [{x:0,y:1},{x:1,y:0},{x:0,y:-1},{x:-1,y:0}];
        for (var i = 0; i < dirs.length; i++) {
          var nx = p.x + dirs[i].x, ny = p.y + dirs[i].y;
          if (_origIsPassableAnimals.call(Overworld, nx, ny) && !AnimalManager.getAt(nx, ny)) {
            animal.x = nx; animal.y = ny; break;
          }
        }
        GameUtils.addLog('Dismounted ' + (animal.petName || animal.name) + '.', '#aaa');
        this.endOverworldTurn();
        return true;
      } else {
        // Toggle follow
        animal.following = !animal.following;
        GameUtils.addLog((animal.petName || animal.name) + (animal.following ? ' is following you.' : ' stays put.'), '#aaccaa');
        this.endOverworldTurn();
        return true;
      }
    } else if (animal.tameable) {
      // Try to tame with food
      var foodId = ANIMAL_TYPES[animal.type].food;
      if (foodId && Bag.has(p.bag, foodId)) {
        Bag.remove(p.bag, foodId, 1);
        if (Math.random() < 0.5) {
          animal.tamed = true;
          animal.following = true;
          animal.hostile = false;
          animal.petName = animal.name;
          SFX.shrine();
          GameUtils.addLog(animal.name + ' has been tamed!', '#ffcc44');
        } else {
          GameUtils.addLog(animal.name + ' ate the food but wasn\'t impressed.', '#cc8844');
        }
        this.endOverworldTurn();
        return true;
      } else {
        var resDef = foodId ? ResourceRegistry.get(foodId) : null;
        var foodName = resDef ? resDef.name : (foodId || 'food');
        GameUtils.addLog('Need ' + foodName + ' to tame ' + animal.name + '.', '#cc8844');
        return true;
      }
    } else if (animal.hostile) {
      // Attack hostile animal
      var dmg = p.atk + (p.weapon ? p.weapon.atk || 0 : 0);
      animal.hp -= dmg;
      GameUtils.addFloating(tx, ty, '-' + dmg, '#ffcc44');
      SFX.hit();
      if (animal.hp <= 0) {
        animal.alive = false;
        GameUtils.addLog('Defeated ' + animal.name + '!', '#ddaa44');
        // Drop loot
        if (animal.type === 'wolf' || animal.type === 'boar' || animal.type === 'bear') {
          Bag.add(p.bag, 'leather', 1 + Math.floor(Math.random() * 2));
          GameUtils.addLog('+Leather', '#aa8866');
        }
      }
      this.endOverworldTurn();
      return true;
    }
  }
  return _origResolveInteraction.call(this, tx, ty);
};

// Add leather resource
ResourceRegistry.add({ id: 'leather', name: 'Leather', color: '#aa7744', category: 'material', stackMax: 99 });

// Riding modifies player movement — 2 tiles per turn
var _origDoOverworldMove = Game.prototype.doOverworldMove;
Game.prototype.doOverworldMove = function(dx, dy) {
  var mount = AnimalManager.getMount();
  if (mount) {
    // Move 2 tiles in the same direction
    for (var step = 0; step < 2; step++) {
      var nx = this.player.x + dx, ny = this.player.y + dy;
      if (!Overworld.isPassable(nx, ny)) break;
      this.player.x = nx;
      this.player.y = ny;
      mount.x = nx;
      mount.y = ny;
    }
    this.player.walkTimer = 0.35;
    this.player.lastDir = { x: dx, y: dy };
    mount.lastDir = { x: dx, y: dy };
    mount.walkTimer = 0.35;
    SFX.step();
    GameEvents.fire('playerMove', this, this.player.x, this.player.y);
    if (this.handleOverworldTile(this.player.x, this.player.y)) return;
    this.endOverworldTurn();
  } else {
    _origDoOverworldMove.call(this, dx, dy);
  }
};

// Dismount when entering dungeon
var _origEnterDungeon = Game.prototype.enterDungeon;
Game.prototype.enterDungeon = function() {
  var mount = AnimalManager.getMount();
  if (mount) {
    mount.mounted = false;
    mount.following = false;
    GameUtils.addLog('Your ' + (mount.petName || mount.name) + ' waits outside.', '#aaa');
  }
  _origEnterDungeon.call(this);
};

// Animals show as interactable in aim mode
var _origInteractAdjacent = Game.prototype.interactAdjacent;
Game.prototype.interactAdjacent = function() {
  // Check if any adjacent animal before falling through
  if (this.player.mode === 'overworld') {
    var px = Math.round(this.player.x), py = Math.round(this.player.y);
    var dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
    for (var di = 0; di < dirs.length; di++) {
      var d = dirs[di];
      if (AnimalManager.getAt(px + d.x, py + d.y)) {
        StateStack.push(AimInteractState);
        return true;
      }
    }
  }
  return _origInteractAdjacent.call(this);
};

// Draw mount indicator on HUD
GameEvents.on('draw:ui', function(game, ctx) {
  var mount = AnimalManager.getMount();
  if (!mount) return;
  var fs = Math.max(10, Math.round(CONFIG.WIDTH * 0.01));
  var w = CONFIG.WIDTH;
  ctx.fillStyle = 'rgba(60,40,20,0.7)';
  var mountText = 'Riding: ' + (mount.petName || mount.name) + '  [E] dismount';
  ctx.font = Math.round(fs * 0.9) + 'px Segoe UI';
  var tw = ctx.measureText(mountText).width + 20;
  ctx.fillRect((w - tw) / 2, CONFIG.HEIGHT - fs * 5, tw, fs * 1.6);
  ctx.fillStyle = '#ddaa44';
  ctx.textAlign = 'center';
  ctx.fillText(mountText, w / 2, CONFIG.HEIGHT - fs * 3.7);
});

// Save/load animals
SaveSystem.register('animals', {
  save: function() {
    return AnimalManager.animals.filter(function(a) { return a.tamed; }).map(function(a) {
      return { x: a.x, y: a.y, type: a.type, hp: a.hp, tamed: a.tamed,
        petName: a.petName, following: a.following, mounted: a.mounted };
    });
  },
  load: function(data) {
    if (!data || !data.length) return;
    for (var i = 0; i < data.length; i++) {
      var d = data[i];
      var a = new Animal(d.x, d.y, d.type);
      a.hp = d.hp;
      a.tamed = d.tamed;
      a.petName = d.petName;
      a.following = d.following || false;
      a.mounted = d.mounted || false;
      a.hostile = false;
      AnimalManager.add(a);
    }
  },
});
