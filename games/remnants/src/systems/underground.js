
// ============================================================
// SYSTEM: Underground — infinite chunked mine layers below the overworld
// ============================================================
// Dig down from overworld to enter underground depth layers.
// Each depth is an infinite chunked map (like Overworld) starting
// as solid rock. Mine tile by tile to carve tunnels and find ore.
// Underground biomes register via UndergroundBiomeRegistry.

// Underground biome registry — same pattern as BiomeRegistry
var UndergroundBiomeRegistry = {
  _biomes: [],
  add: function(def) { this._biomes.push(def); },
  all: function() { return this._biomes; },
  getForDepth: function(depth) {
    for (var i = this._biomes.length - 1; i >= 0; i--) {
      if (depth >= this._biomes[i].minDepth) return this._biomes[i];
    }
    return this._biomes[0] || null;
  },
};

// Core underground tile types
var T_ROCK = TileRegistry.add({
  id: 300, name: 'rock', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 4919 + (wy||0) * 7823) >>> 0);
    ctx.fillStyle = shadeHex('#555550', ((h % 9) - 4) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Stone texture
    ctx.fillStyle = shadeHex('#555550', -10);
    ctx.fillRect(sx + ((h>>2)%8+2)*m, sy + ((h>>5)%8+2)*m, 3*m, 2*m);
    ctx.fillRect(sx + ((h>>4)%7+5)*m, sy + ((h>>7)%7+6)*m, 2*m, 3*m);
    // Cracks
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = Math.max(0.3, m * 0.3);
    if ((h % 3) === 0) {
      ctx.beginPath();
      ctx.moveTo(sx + ((h>>3)%10+2)*m, sy + 2*m);
      ctx.lineTo(sx + ((h>>6)%10+3)*m, sy + 14*m);
      ctx.stroke();
    }
  },
});

var T_MINE_FLOOR = TileRegistry.add({
  id: 301, name: 'mine_floor', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 3517 + (wy||0) * 6143) >>> 0);
    ctx.fillStyle = shadeHex('#4a4540', ((h % 7) - 3) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Rubble/debris from mining
    ctx.fillStyle = shadeHex('#4a4540', -8);
    ctx.fillRect(sx + ((h>>2)%6+3)*m, sy + ((h>>4)%6+5)*m, 2*m, 1.5*m);
    ctx.fillRect(sx + ((h>>5)%7+1)*m, sy + ((h>>7)%5+8)*m, 1.5*m, 1*m);
  },
});

var T_MINE_STAIRS_UP = TileRegistry.add({
  id: 302, name: 'mine_stairs_up', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    // Floor first
    var floorDraw = TileRegistry.getDrawer(T_MINE_FLOOR);
    if (floorDraw) floorDraw(ctx, sx, sy, ts, visible, animTimer, wx, wy);
    // Ladder going up
    ctx.fillStyle = '#6a5530';
    ctx.fillRect(sx + 4*m, sy + 1*m, 1.5*m, 14*m);
    ctx.fillRect(sx + 10.5*m, sy + 1*m, 1.5*m, 14*m);
    // Rungs
    ctx.fillStyle = '#7a6540';
    for (var r = 0; r < 5; r++) {
      ctx.fillRect(sx + 5.5*m, sy + (2 + r*3)*m, 5*m, 1*m);
    }
    // Light from above
    var pulse = 0.3 + Math.sin(animTimer * 2) * 0.1;
    ctx.fillStyle = 'rgba(255,220,150,' + pulse.toFixed(2) + ')';
    ctx.fillRect(sx + 5*m, sy + 0*m, 6*m, 3*m);
  },
  light: { color: '#ffcc88', radius: 2, intensity: 0.3 },
});

var T_MINE_STAIRS_DOWN = TileRegistry.add({
  id: 303, name: 'mine_stairs_down', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    // Floor first
    var floorDraw = TileRegistry.getDrawer(T_MINE_FLOOR);
    if (floorDraw) floorDraw(ctx, sx, sy, ts, visible, animTimer, wx, wy);
    // Dark hole going down
    ctx.fillStyle = '#0a0808';
    ctx.fillRect(sx + 4*m, sy + 4*m, 8*m, 8*m);
    // Ladder visible inside
    ctx.fillStyle = '#5a4520';
    ctx.fillRect(sx + 5*m, sy + 5*m, 1*m, 7*m);
    ctx.fillRect(sx + 10*m, sy + 5*m, 1*m, 7*m);
    ctx.fillStyle = '#6a5530';
    ctx.fillRect(sx + 6*m, sy + 6*m, 4*m, 0.8*m);
    ctx.fillRect(sx + 6*m, sy + 9*m, 4*m, 0.8*m);
  },
});

// Underground world manager — one per depth level
var Underground = {
  CHUNK_SIZE: 16,
  depth: 0,        // current depth (1+)
  active: false,   // whether player is underground
  layers: {},      // depth -> { chunks, tileChanges, entryX, entryY }

  getLayer: function(depth) {
    if (!this.layers[depth]) {
      this.layers[depth] = { chunks: {}, tileChanges: {} };
    }
    return this.layers[depth];
  },

  setTile: function(wx, wy, newType) {
    var layer = this.getLayer(this.depth);
    var tile = this.getTile(wx, wy);
    tile.type = newType;
    var cs = this.CHUNK_SIZE;
    var ck = Math.floor(wx/cs) + ',' + Math.floor(wy/cs);
    if (!layer.tileChanges[ck]) layer.tileChanges[ck] = {};
    layer.tileChanges[ck][wx + ',' + wy] = newType;
  },

  getTileChange: function(wx, wy) {
    var layer = this.getLayer(this.depth);
    var cs = this.CHUNK_SIZE;
    var ck = Math.floor(wx/cs) + ',' + Math.floor(wy/cs);
    return layer.tileChanges[ck] ? layer.tileChanges[ck][wx + ',' + wy] : undefined;
  },

  getChunk: function(cx, cy) {
    var layer = this.getLayer(this.depth);
    var key = cx + ',' + cy;
    if (layer.chunks[key]) return layer.chunks[key];
    var chunk = this.generateChunk(cx, cy);
    layer.chunks[key] = chunk;
    return chunk;
  },

  generateChunk: function(cx, cy) {
    var cs = this.CHUNK_SIZE;
    var tiles = [];
    var baseX = cx * cs, baseY = cy * cs;
    var seed = Overworld.seed + this.depth * 99991;
    var rng = overworldRng(seed + cx * 7919 + cy * 6271);
    var biome = UndergroundBiomeRegistry.getForDepth(this.depth);

    for (var ly = 0; ly < cs; ly++) {
      tiles[ly] = [];
      for (var lx = 0; lx < cs; lx++) {
        var wx = baseX + lx, wy = baseY + ly;
        // Default: solid rock
        var tileType = T_ROCK;

        // Biome generates caverns, ore, features
        if (biome && biome.generate) {
          tileType = biome.generate(wx, wy, this.depth, seed, rng);
        }

        tiles[ly][lx] = {
          type: tileType,
          biome: biome ? biome.id : 'rock',
          depth: this.depth,
        };

        // Apply persistent tile changes (mined tiles)
        var changed = this.getTileChange(wx, wy);
        if (changed !== undefined) {
          tiles[ly][lx].type = changed;
        }
      }
    }
    return { tiles: tiles, generated: true };
  },

  getTile: function(wx, wy) {
    var cs = this.CHUNK_SIZE;
    var cx = Math.floor(wx / cs), cy = Math.floor(wy / cs);
    var lx = ((wx % cs) + cs) % cs, ly = ((wy % cs) + cs) % cs;
    var chunk = this.getChunk(cx, cy);
    return chunk.tiles[ly][lx];
  },

  isPassable: function(wx, wy) {
    var tile = this.getTile(wx, wy);
    if (tile.type === T_ROCK) return false;
    if (TileRegistry.isSolid(tile.type)) return false;
    return true;
  },

  // Enter underground from overworld
  enter: function(game, wx, wy) {
    this.active = true;
    this.depth = 1;
    game.player._undergroundEntryX = wx;
    game.player._undergroundEntryY = wy;
    game.player._overworldX = game.player.x;
    game.player._overworldY = game.player.y;
    // Create entry point — clear a small area
    this.setTile(wx, wy, T_MINE_STAIRS_UP);
    for (var dx = -1; dx <= 1; dx++) {
      for (var dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        var t = this.getTile(wx + dx, wy + dy);
        if (t.type === T_ROCK) this.setTile(wx + dx, wy + dy, T_MINE_FLOOR);
      }
    }
    game.player.x = wx;
    game.player.y = wy;
    game.player.mode = 'underground';
    game.pipeline._ambientColor = '#020202';
    game.pipeline._ambientIntensity = 0.02;
    GameUtils.addLog('You descend into the earth...', '#aa8866');
    GameEvents.fire('modeChange', game, 'underground');
  },

  // Exit to overworld
  exit: function(game) {
    this.active = false;
    game.player.x = game.player._overworldX;
    game.player.y = game.player._overworldY;
    game.player.mode = 'overworld';
    game.pipeline._ambientColor = '#0a1008';
    game.pipeline._ambientIntensity = 0.08;
    GameUtils.addLog('You return to the surface.', '#aaccff');
    GameEvents.fire('modeChange', game, 'overworld');
  },

  // Go deeper
  goDeeper: function(game, wx, wy) {
    this.depth++;
    // Clear entry area at new depth
    this.setTile(wx, wy, T_MINE_STAIRS_UP);
    for (var dx = -1; dx <= 1; dx++) {
      for (var dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        if (this.getTile(wx + dx, wy + dy).type === T_ROCK) {
          this.setTile(wx + dx, wy + dy, T_MINE_FLOOR);
        }
      }
    }
    game.player.x = wx;
    game.player.y = wy;
    game.pipeline._ambientIntensity = Math.max(0.01, 0.02 - this.depth * 0.002);
    GameUtils.addLog('Depth ' + this.depth + '...', '#886644');
    var biome = UndergroundBiomeRegistry.getForDepth(this.depth);
    if (biome) GameUtils.addLog(biome.name, biome.accent || '#888');
    // Clear chunk cache for new depth (fresh generation)
    this.getLayer(this.depth).chunks = {};
  },

  // Go up a level
  goUp: function(game, wx, wy) {
    if (this.depth <= 1) {
      this.exit(game);
      return;
    }
    this.depth--;
    game.player.x = wx;
    game.player.y = wy;
    game.pipeline._ambientIntensity = Math.max(0.01, 0.02 - this.depth * 0.002);
    GameUtils.addLog('Ascended to depth ' + this.depth, '#aaccff');
    this.getLayer(this.depth).chunks = {};
  },
};

// Mining interaction — pickaxe on rock converts to mine floor + drops ore
TileRegistry.get(T_ROCK).onInteract = function(game, wx, wy) {
  var check = checkTool(game.player, 'mining');
  if (!check.allowed) {
    GameUtils.addLog(check.message, '#cc8844');
    return;
  }
  useTool(game.player, check.toolId);

  // Convert rock to floor
  Underground.setTile(wx, wy, T_MINE_FLOOR);

  // Ore drops based on depth and biome
  var biome = UndergroundBiomeRegistry.getForDepth(Underground.depth);
  var oreResult = null;
  if (biome && biome.oreTable) {
    var roll = Math.random();
    var cum = 0;
    for (var i = 0; i < biome.oreTable.length; i++) {
      cum += biome.oreTable[i].chance;
      if (roll < cum) { oreResult = biome.oreTable[i]; break; }
    }
  }

  if (oreResult) {
    var count = oreResult.min + Math.floor(Math.random() * (oreResult.max - oreResult.min + 1));
    Bag.add(game.player.bag, oreResult.id, count);
    GameUtils.addLog('+' + count + ' ' + oreResult.name, oreResult.color || '#888');
    GameUtils.addFloating(wx, wy, '+' + count, oreResult.color || '#888');
  } else {
    Bag.add(game.player.bag, 'stone', 1);
    GameUtils.addFloating(wx, wy, '+Stone', '#888');
  }

  PlayerSkills.addXp(game.player.skills, 'mining', 3);
  SFX.hit();
};

// Stairs interactions
TileRegistry.get(T_MINE_STAIRS_UP).onInteract = function(game, wx, wy) {
  Underground.goUp(game, wx, wy);
};

TileRegistry.get(T_MINE_STAIRS_DOWN).onInteract = function(game, wx, wy) {
  Underground.goDeeper(game, wx, wy);
};

// Craft mine entrance from overworld
BlueprintRegistry.add({
  id: 'mine_entrance',
  name: 'Mine Entrance',
  desc: 'Dig into the earth. Requires pickaxe.',
  cost: { oak_log: 5, stone: 5 },
  size: { w: 1, h: 1 },
  tiles: [{ dx: 0, dy: 0, type: T_MINE_STAIRS_DOWN }],
  isMine: true,
});

// Add to build categories
// (handled by build-mode.js if 'mine_entrance' is in a category)

// When player steps on mine stairs in overworld, enter underground
Game.prototype.handleOverworldTile = (function() {
  var _origHandleTile = Game.prototype.handleOverworldTile;
  return function(wx, wy) {
    var tile = Overworld.getTile(wx, wy);
    if (tile.type === T_MINE_STAIRS_DOWN) {
      Underground.enter(this, wx, wy);
      return true;
    }
    return _origHandleTile.call(this, wx, wy);
  };
})();

// Underground movement — override doOverworldMove when underground
var _origDoOverworldMoveUG = Game.prototype.doOverworldMove;
Game.prototype.doOverworldMove = function(dx, dy) {
  if (this.player.mode !== 'underground') {
    return _origDoOverworldMoveUG.call(this, dx, dy);
  }
  var nx = this.player.x + dx, ny = this.player.y + dy;
  if (!Underground.isPassable(nx, ny)) return;
  this.player.x = nx;
  this.player.y = ny;
  this.player.walkTimer = 0.35;
  this.player.lastDir = { x: dx, y: dy };
  SFX.step();
  GameEvents.fire('playerMove', this, nx, ny);

  // Check tile interactions
  var tile = Underground.getTile(nx, ny);
  if (tile.type === T_MINE_STAIRS_UP) {
    Underground.goUp(this, nx, ny);
    return;
  }
  if (tile.type === T_MINE_STAIRS_DOWN) {
    Underground.goDeeper(this, nx, ny);
    return;
  }

  this.endOverworldTurn();
};

// Underground drawing — use the overworld draw system but read from Underground
var _origDrawOverworld = Game.prototype.drawOverworld;
Game.prototype.drawOverworld = function(ctx) {
  if (this.player.mode !== 'underground') {
    return _origDrawOverworld.call(this, ctx);
  }
  var ts = CONFIG.TILE;
  var px = Math.round(this.player.x), py = Math.round(this.player.y);
  var vw = CONFIG.VIEW_W + 2, vh = CONFIG.VIEW_H + 2;

  for (var dy = -vh; dy <= vh; dy++) {
    for (var dx = -vw; dx <= vw; dx++) {
      var wx = px + dx, wy = py + dy;
      var tile = Underground.getTile(wx, wy);
      var sx = wx * ts, sy = wy * ts;
      var drawer = TileRegistry.getDrawer(tile.type);
      if (drawer) drawer(ctx, sx, sy, ts, true, this.animTimer, wx, wy);
      else {
        ctx.fillStyle = '#333';
        ctx.fillRect(sx, sy, ts, ts);
      }
      // Tile light sources
      var light = TileRegistry.getLight(tile.type);
      if (light) this.pipeline.addLight(sx + ts/2, sy + ts/2, light);
    }
  }
  // Player light source underground
  var cx = this.player.x * ts + ts/2, cy = this.player.y * ts + ts/2;
  this.pipeline.addLight(cx, cy, { color: '#ffcc88', radius: this.player.visionRadius * ts * 1.5, intensity: 1.0, flicker: 0.03 });
};

// Underground interaction — E key mines rock
var _origInteractAdjacentUG = Game.prototype.interactAdjacent;
Game.prototype.interactAdjacent = function() {
  if (this.player.mode === 'underground') {
    var px = Math.round(this.player.x), py = Math.round(this.player.y);
    // Check adjacent tiles for minable rock
    var dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
    for (var di = 0; di < dirs.length; di++) {
      var tx = px + dirs[di].x, ty = py + dirs[di].y;
      var tile = Underground.getTile(tx, ty);
      var interact = TileRegistry.getInteraction(tile.type);
      if (interact) {
        StateStack.push(AimInteractState);
        return true;
      }
    }
    // Stand-on tile interaction
    var standTile = Underground.getTile(px, py);
    var standInteract = TileRegistry.getInteraction(standTile.type);
    if (standInteract) {
      standInteract(this, px, py);
      this.endOverworldTurn();
      return true;
    }
    GameUtils.addLog('Nothing to interact with.', '#666');
    return false;
  }
  return _origInteractAdjacentUG.call(this);
};

// Resolve directional interaction underground
var _origResolveInteractUG = Game.prototype.resolveInteraction;
Game.prototype.resolveInteraction = function(tx, ty) {
  if (this.player.mode === 'underground') {
    var tile = Underground.getTile(tx, ty);
    var interact = TileRegistry.getInteraction(tile.type);
    if (interact) {
      interact(this, tx, ty);
      this.endOverworldTurn();
      return true;
    }
    GameUtils.addLog('Nothing there.', '#666');
    return false;
  }
  return _origResolveInteractUG.call(this, tx, ty);
};

// Dig down recipe — create stairs down at current position
RecipeRegistry.addAll([
  { skill: 'mining', level: 3, name: 'Dig Down', input: { stone: 3 }, output: {}, requires: ['Iron Pickaxe'] },
]);

// Handle "Dig Down" craft — place stairs at player position
GameEvents.on('turnEnd', function(game) {
  // Check if player just crafted Dig Down (hacky but works within the system)
  if (game.player.mode === 'underground' && game.player._digDown) {
    delete game.player._digDown;
    var px = Math.round(game.player.x), py = Math.round(game.player.y);
    Underground.setTile(px, py, T_MINE_STAIRS_DOWN);
    GameUtils.addLog('You dig deeper...', '#886644');
  }
});

// Save/load underground state
SaveSystem.register('underground', {
  save: function() {
    var layerData = {};
    for (var d in Underground.layers) {
      layerData[d] = { tileChanges: Underground.layers[d].tileChanges };
    }
    return { depth: Underground.depth, active: Underground.active, layers: layerData };
  },
  load: function(data) {
    if (!data) return;
    Underground.depth = data.depth || 0;
    Underground.active = data.active || false;
    Underground.layers = {};
    if (data.layers) {
      for (var d in data.layers) {
        Underground.layers[d] = { chunks: {}, tileChanges: data.layers[d].tileChanges || {} };
      }
    }
  },
});
