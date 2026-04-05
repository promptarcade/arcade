
// ============================================================
// OVERWORLD — Seeded procedural world generator
// ============================================================

// Simple seeded PRNG for deterministic world gen
function overworldRng(seed) {
  var s = seed || 12345;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s >>> 0) / 0x7fffffff;
  };
}

// Simple 2D value noise for terrain shape
function overworldNoise(x, y, seed, scale) {
  scale = scale || 0.05;
  var ix = Math.floor(x * scale), iy = Math.floor(y * scale);
  var fx = x * scale - ix, fy = y * scale - iy;
  // Smoothstep
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  function hash(px, py) {
    var h = (px * 374761393 + py * 668265263 + seed * 1013904223) & 0x7fffffff;
    h = ((h >> 13) ^ h) * 1274126177;
    return ((h >> 16) ^ h) / 0x7fffffff;
  }
  var a = hash(ix, iy), b = hash(ix + 1, iy);
  var c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  var top = a + (b - a) * fx;
  var bot = c + (d - c) * fx;
  return top + (bot - top) * fy;
}

// Multi-octave noise for richer terrain
function overworldFbm(x, y, seed, octaves, scale) {
  octaves = octaves || 4;
  scale = scale || 0.04;
  var val = 0, amp = 1, freq = scale, totalAmp = 0;
  for (var i = 0; i < octaves; i++) {
    val += overworldNoise(x, y, seed + i * 9999, freq) * amp;
    totalAmp += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return val / totalAmp;
}

// Overworld map: generates tile data for a region around the player
// The world is infinite — we generate chunks on demand and cache them
var Overworld = {
  CHUNK_SIZE: 16,
  chunks: {},       // 'cx,cy' -> { tiles: 2d array, generated: true }
  tileChanges: {},  // 'wx,wy' -> newTileType — tracks player modifications
  seed: 1,

  init: function(seed) {
    this.seed = seed || Math.floor(Math.random() * 999999);
    this.chunks = {};
    // Don't clear tileChanges here — they persist across init calls
  },

  // Record a tile change for persistence — chunked by region
  setTile: function(wx, wy, newType) {
    var tile = this.getTile(wx, wy);
    tile.type = newType;
    var cs = this.CHUNK_SIZE;
    var ck = Math.floor(wx/cs) + ',' + Math.floor(wy/cs);
    if (!this.tileChanges[ck]) this.tileChanges[ck] = {};
    this.tileChanges[ck][wx + ',' + wy] = newType;
  },

  // Get tile change for a position
  getTileChange: function(wx, wy) {
    var cs = this.CHUNK_SIZE;
    var ck = Math.floor(wx/cs) + ',' + Math.floor(wy/cs);
    return this.tileChanges[ck] ? this.tileChanges[ck][wx + ',' + wy] : undefined;
  },

  // Get or generate a chunk
  getChunk: function(cx, cy) {
    var key = cx + ',' + cy;
    if (this.chunks[key]) return this.chunks[key];
    var chunk = this.generateChunk(cx, cy);
    this.chunks[key] = chunk;
    return chunk;
  },

  generateChunk: function(cx, cy) {
    var cs = this.CHUNK_SIZE;
    var tiles = [];
    var baseX = cx * cs, baseY = cy * cs;
    var rng = overworldRng(this.seed + cx * 7919 + cy * 6271);

    for (var ly = 0; ly < cs; ly++) {
      tiles[ly] = [];
      for (var lx = 0; lx < cs; lx++) {
        var wx = baseX + lx, wy = baseY + ly;
        // Determine biome from large-scale noise
        var biomeNoise = overworldFbm(wx, wy, this.seed, 3, 0.02);
        var heightNoise = overworldFbm(wx, wy, this.seed + 5000, 4, 0.03);
        var moistureNoise = overworldFbm(wx, wy, this.seed + 10000, 3, 0.015);

        var biome = this.selectBiome(biomeNoise, heightNoise, moistureNoise);
        var tileType = biome.groundTile || T.FLOOR;

        // Natural geography layers — water, shore, land, foothills, mountains
        var waterNoise = overworldFbm(wx, wy, this.seed + 5000, 2, 0.015);

        if (waterNoise < 0.12) {
          // Deep water
          tileType = T.WATER;
        } else if (waterNoise < 0.16) {
          // Shallows — visible water near shore
          tileType = T.SHALLOWS;
        } else if (waterNoise < 0.20) {
          // Beach/shore — sand strip between water and land
          tileType = T.BEACH;
        } else if (heightNoise > 0.78) {
          // Mountain peak — impassable
          tileType = T.WALL;
        } else if (heightNoise > 0.70) {
          // Foothills — rocky ground, passable but sparse vegetation
          // Use biome ground tile but mark as elevated
          tileType = biome.groundTile || T.FLOOR;
        }
        // else: normal biome ground tile (already set)

        tiles[ly][lx] = {
          type: tileType,
          biome: biome.id,
          height: heightNoise,
          moisture: moistureNoise,
        };

        // Let registered skills populate tiles (trees, ores, herbs, etc.)
        var skillList = SkillRegistry.list();
        for (var si = 0; si < skillList.length; si++) {
          var skill = skillList[si];
          if (skill.populate) {
            var result = skill.populate(tiles[ly][lx], biome, wx, wy, rng);
            if (result) tiles[ly][lx].type = result;
          }
        }
        // Apply persistent tile changes (chopped trees, etc.)
        var changed = this.getTileChange(wx, wy);
        if (changed !== undefined) {
          tiles[ly][lx].type = changed;
        }
      }
    }
    return { tiles: tiles, generated: true };
  },

  selectBiome: function(biomeN, heightN, moistureN) {
    var biomes = BiomeRegistry.list();
    if (biomes.length === 0) return { id: 'void', groundTile: T.FLOOR };
    // Score each biome by how well conditions match
    var best = biomes[0], bestScore = -999;
    for (var i = 0; i < biomes.length; i++) {
      var b = biomes[i];
      var score = 0;
      if (b.heightRange) {
        if (heightN >= b.heightRange[0] && heightN <= b.heightRange[1]) score += 2;
        else score -= 3;
      }
      if (b.moistureRange) {
        if (moistureN >= b.moistureRange[0] && moistureN <= b.moistureRange[1]) score += 2;
        else score -= 3;
      }
      if (b.biomeNoiseRange) {
        if (biomeN >= b.biomeNoiseRange[0] && biomeN <= b.biomeNoiseRange[1]) score += 1;
      }
      if (b.isDefault) score += 0.5; // slight preference for default
      if (score > bestScore) { bestScore = score; best = b; }
    }
    return best;
  },

  // Get tile at world coordinates
  getTile: function(wx, wy) {
    var cs = this.CHUNK_SIZE;
    var cx = Math.floor(wx / cs), cy = Math.floor(wy / cs);
    var lx = ((wx % cs) + cs) % cs, ly = ((wy % cs) + cs) % cs;
    var chunk = this.getChunk(cx, cy);
    return chunk.tiles[ly][lx];
  },

  // Check if world tile is passable
  isPassable: function(wx, wy) {
    var tile = this.getTile(wx, wy);
    if (tile.type === T.WALL || tile.type === T.WATER || tile.type === T.SHALLOWS) return false;
    if (TileRegistry.isSolid(tile.type)) return false;
    return true;
  },
};

// Register save/load for overworld tile changes
SaveSystem.register('overworld', {
  save: function() {
    return { seed: Overworld.seed, tileChanges: Overworld.tileChanges };
  },
  load: function(data) {
    if (data.seed) Overworld.seed = data.seed;
    if (data.tileChanges) Overworld.tileChanges = data.tileChanges;
    Overworld.chunks = {}; // force regeneration with changes applied
  },
});
