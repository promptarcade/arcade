
// ============================================================
// BIOME: Grassland — the default starting biome
// ============================================================

// Overworld ground tile for grassland
var T_GRASS = TileRegistry.add({
  id: 100,
  name: 'grass',
  solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    // Good hash: no visible diagonal patterns
    var h1 = ((wx * 374761393 + wy * 668265263) >>> 0);
    var h2 = (((h1 >> 13) ^ h1) * 1274126177) >>> 0;
    var hf = (h2 & 0xffff) / 65535; // 0-1 float
    // Base colour varies smoothly using noise, not hash banding
    var colorNoise = overworldNoise(wx, wy, 54321, 0.12);
    var tint = Math.round((colorNoise - 0.5) * 20);
    ctx.fillStyle = shadeHex('#3a6a2a', tint);
    ctx.fillRect(sx, sy, ts, ts);
    // Second tone patch for organic feel
    var patchNoise = overworldNoise(wx * 1.7, wy * 1.3, 11111, 0.18);
    if (patchNoise > 0.55) {
      ctx.fillStyle = shadeHex('#3a6a2a', tint + 6);
      ctx.fillRect(sx + 2*m, sy + 2*m, ts - 4*m, ts - 4*m);
    }
    // Grass blades — positioned by hash, density by noise
    var bladeNoise = overworldNoise(wx, wy, 88888, 0.15);
    if (bladeNoise > 0.4) {
      ctx.fillStyle = shadeHex('#4a7a3a', tint);
      var bx1 = (h2 % 11 + 1) * m, bx2 = ((h2 >> 5) % 10 + 3) * m, bx3 = ((h2 >> 10) % 9 + 5) * m;
      var by1 = ((h2 >> 3) % 5 + 7) * m, by2 = ((h2 >> 7) % 5 + 6) * m, by3 = ((h2 >> 12) % 5 + 8) * m;
      ctx.fillRect(sx + bx1, sy + by1, m, (2 + (h2 % 3)) * m);
      if (bladeNoise > 0.5) ctx.fillRect(sx + bx2, sy + by2, m, (2 + ((h2 >> 4) % 3)) * m);
      if (bladeNoise > 0.6) ctx.fillRect(sx + bx3, sy + by3, m, (2 + ((h2 >> 8) % 2)) * m);
    }
    // Flowers — use noise for clusters, not hash modulo
    var flowerNoise = overworldNoise(wx * 2.3, wy * 1.9, 77777, 0.25);
    if (flowerNoise > 0.72) {
      var fc = ['#dd6688', '#dddd44', '#8888dd', '#ddaa44', '#ff8866'][(h2 >> 4) % 5];
      ctx.fillStyle = fc;
      var fx = ((h2 >> 6) % 10 + 3) * m, fy = ((h2 >> 9) % 8 + 3) * m;
      ctx.fillRect(sx + fx, sy + fy, 1.5 * m, 1.5 * m);
      // Second petal
      if (flowerNoise > 0.8) {
        ctx.fillRect(sx + fx + 1*m, sy + fy - 0.5*m, 1*m, 1*m);
        ctx.fillRect(sx + fx - 0.5*m, sy + fy + 0.5*m, 1*m, 1*m);
      }
    }
  },
});

// Dirt path tile
var T_DIRT_PATH = TileRegistry.add({
  id: 101,
  name: 'dirt_path',
  solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var hash = ((wx * 137 + wy * 269) & 0xffff);
    var tint = ((hash % 9) - 4) * 2;
    ctx.fillStyle = shadeHex('#8a7a5a', tint);
    ctx.fillRect(sx, sy, ts, ts);
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    ctx.fillRect(sx, sy, ts, Math.max(1, ts * 0.06));
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(sx + 0.5, sy + 0.5, ts - 1, ts - 1);
  },
});

BiomeRegistry.add({
  id: 'grassland',
  name: 'Grassland',
  isDefault: true,
  groundTile: T_GRASS,
  heightRange: [0.3, 0.65],
  moistureRange: [0.3, 0.7],
  palette: { base: '#3a6a2a', dark: '#2a5a1a', light: '#4a7a3a', detail: '#356025' },
  wallColor: '#5a4a3a',
  ambientColor: '#0a1008',
  ambientIntensity: 0.08,
  lightColor: '#ffeecc',
  enemies: ['rabbit', 'bandit'],
  density: { trees: 0.08, herbs: 0.03 },
});
