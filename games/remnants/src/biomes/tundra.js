
// ============================================================
// BIOME: Tundra — frozen earth, frost crystals, sparse life
// ============================================================

var T_TUNDRA_GROUND = TileRegistry.add({
  id: 105,
  name: 'tundra_ground',
  solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h1 = ((wx * 374761393 + wy * 668265263) >>> 0);
    var h2 = (((h1 >> 13) ^ h1) * 1274126177) >>> 0;

    // Base: frozen earth — blue-grey-white, noise-driven for no banding
    var baseNoise = Math.sin(wx * 0.31 + wy * 0.47) * 0.5 + Math.sin(wx * 0.83 + wy * 0.19) * 0.5;
    var tint = Math.round(baseNoise * 12);
    ctx.fillStyle = shadeHex('#9ab0c2', tint);
    ctx.fillRect(sx, sy, ts, ts);

    // Snow coverage patches — organic blobs via multi-freq sine
    var snowNoise = Math.sin(wx * 0.6 + wy * 0.4) * 0.5 + Math.sin(wx * 1.3 + wy * 0.9) * 0.3 + Math.sin(wx * 2.1 + wy * 1.7) * 0.2;
    if (snowNoise > 0.2) {
      ctx.fillStyle = shadeHex('#dce8f0', tint + 4);
      var pad = (1 - Math.min(snowNoise, 0.8)) * 4 * m;
      ctx.fillRect(sx + pad, sy + pad, ts - pad * 2, ts - pad * 2);
    }

    // Frozen earth cracks — thin dark lines, hash-placed
    var crackNoise = Math.sin(wx * 0.9 + wy * 1.1) * 0.5 + Math.sin(wx * 2.3 + wy * 0.7) * 0.5;
    if (crackNoise > 0.35) {
      ctx.strokeStyle = 'rgba(60,80,100,0.25)';
      ctx.lineWidth = Math.max(0.5, m * 0.4);
      var cx1 = ((h2 >> 2) % 10 + 2) * m;
      var cy1 = ((h2 >> 5) % 6 + 5) * m;
      var cx2 = cx1 + ((h2 >> 8) % 6 - 3) * m;
      var cy2 = cy1 + ((h2 >> 11) % 5 + 2) * m;
      ctx.beginPath();
      ctx.moveTo(sx + cx1, sy + cy1);
      ctx.lineTo(sx + cx2, sy + cy2);
      ctx.stroke();
      // Branch crack
      if (crackNoise > 0.55) {
        ctx.beginPath();
        ctx.moveTo(sx + cx1 + m, sy + cy1 + m);
        ctx.lineTo(sx + cx1 + ((h2 >> 14) % 5 + 2) * m, sy + cy1 - 2 * m);
        ctx.stroke();
      }
    }

    // Frost crystals — bright white star-shaped dots via noise clusters
    var frostNoise = Math.sin(wx * 1.7 + wy * 2.3) * 0.5 + Math.sin(wx * 3.1 + wy * 1.3) * 0.5;
    if (frostNoise > 0.55) {
      ctx.fillStyle = 'rgba(240,250,255,0.85)';
      var fx = ((h2 >> 6) % 11 + 2) * m;
      var fy = ((h2 >> 9) % 9 + 3) * m;
      // Crystal: cross shape
      ctx.fillRect(sx + fx, sy + fy - m * 0.5, m * 0.8, m * 2);
      ctx.fillRect(sx + fx - m * 0.5, sy + fy, m * 2, m * 0.8);
      // Second crystal
      if (frostNoise > 0.72) {
        var fx2 = ((h2 >> 12) % 9 + 4) * m;
        var fy2 = ((h2 >> 15) % 7 + 6) * m;
        ctx.fillRect(sx + fx2, sy + fy2 - m * 0.5, m * 0.7, m * 1.8);
        ctx.fillRect(sx + fx2 - m * 0.5, sy + fy2, m * 1.8, m * 0.7);
      }
    }

    // Frozen puddle sheen — subtle lighter oval, noise-gated
    var puddleNoise = Math.sin(wx * 2.7 + wy * 1.9) * 0.5 + Math.sin(wx * 0.5 + wy * 3.1) * 0.5;
    if (puddleNoise > 0.6) {
      ctx.fillStyle = 'rgba(180,210,240,0.35)';
      ctx.beginPath();
      ctx.ellipse(
        sx + ((h2 >> 4) % 8 + 4) * m,
        sy + ((h2 >> 7) % 5 + 6) * m,
        3.5 * m, 2 * m, 0.3, 0, Math.PI * 2
      );
      ctx.fill();
      // Crack line on ice
      ctx.strokeStyle = 'rgba(140,180,220,0.55)';
      ctx.lineWidth = Math.max(0.5, m * 0.3);
      ctx.beginPath();
      ctx.moveTo(sx + ((h2 >> 2) % 6 + 3) * m, sy + ((h2 >> 9) % 4 + 6) * m);
      ctx.lineTo(sx + ((h2 >> 6) % 7 + 5) * m, sy + ((h2 >> 11) % 3 + 8) * m);
      ctx.stroke();
    }

    // Sparse dead grass tufts — wind-bent, warm against cold ground
    var grassNoise = Math.sin(wx * 1.1 + wy * 0.8) * 0.5 + Math.sin(wx * 0.4 + wy * 2.2) * 0.5;
    if (grassNoise > 0.45) {
      ctx.fillStyle = '#8a8060';
      var gx = ((h2 >> 3) % 10 + 2) * m;
      var gy = ((h2 >> 6) % 6 + 7) * m;
      // Bent blades leaning right (wind-swept)
      ctx.fillRect(sx + gx,         sy + gy,         m, 3 * m);
      ctx.fillRect(sx + gx + m,     sy + gy - m,     m, 2 * m);
      ctx.fillRect(sx + gx + 2 * m, sy + gy - 2 * m, m, m);
      if (grassNoise > 0.65) {
        var gx2 = ((h2 >> 13) % 8 + 5) * m;
        var gy2 = ((h2 >> 1) % 5 + 5) * m;
        ctx.fillRect(sx + gx2,         sy + gy2,         m, 2 * m);
        ctx.fillRect(sx + gx2 + m,     sy + gy2 - m,     m, m);
      }
    }

    // Snow drift — bright edge highlight on one side, noise-directed
    var driftNoise = Math.sin(wx * 0.4 + wy * 0.6 + 5.5) * 0.5 + Math.sin(wx * 1.2 + wy * 0.3) * 0.5;
    if (driftNoise > 0.5) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(sx, sy, ts, 2 * m);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(sx, sy + 2 * m, ts, m);
    }
  },
});

// Snow-covered pine tree tile (solid)
var T_SNOW_PINE = TileRegistry.add({
  id: 106,
  name: 'snow_pine',
  solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    // Draw ground underneath first
    var groundDraw = TileRegistry.getDrawer(T_TUNDRA_GROUND);
    if (groundDraw) groundDraw(ctx, sx, sy, ts, visible, animTimer, wx, wy);

    var m = ts / 16;
    var h = ((wx * 4517 + wy * 7321) >>> 0);
    var lean = ((h % 3) - 1) * m * 0.5; // slight lean variation

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(sx + 8 * m + lean, sy + 14.5 * m, 4 * m, 1.2 * m, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk — dark grey-brown, narrow
    ctx.fillStyle = '#3a3028';
    ctx.fillRect(sx + 7 * m + lean, sy + 10 * m, 2 * m, 6 * m);
    // Trunk highlight
    ctx.fillStyle = '#4a3a30';
    ctx.fillRect(sx + 7 * m + lean, sy + 10 * m, m * 0.6, 6 * m);

    // Canopy — three tiers, dark conifer green with snow caps
    // Bottom tier (widest)
    ctx.fillStyle = '#1e3422';
    ctx.beginPath();
    ctx.moveTo(sx + 2 * m + lean, sy + 12 * m);
    ctx.lineTo(sx + 14 * m + lean, sy + 12 * m);
    ctx.lineTo(sx + 8 * m + lean,  sy + 6 * m);
    ctx.closePath();
    ctx.fill();
    // Bottom-tier shadow side
    ctx.fillStyle = '#152618';
    ctx.beginPath();
    ctx.moveTo(sx + 2 * m + lean, sy + 12 * m);
    ctx.lineTo(sx + 8 * m + lean,  sy + 6 * m);
    ctx.lineTo(sx + 8 * m + lean,  sy + 12 * m);
    ctx.closePath();
    ctx.fill();

    // Middle tier
    ctx.fillStyle = '#1e3422';
    ctx.beginPath();
    ctx.moveTo(sx + 3.5 * m + lean, sy + 8.5 * m);
    ctx.lineTo(sx + 12.5 * m + lean, sy + 8.5 * m);
    ctx.lineTo(sx + 8 * m + lean,    sy + 3 * m);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#152618';
    ctx.beginPath();
    ctx.moveTo(sx + 3.5 * m + lean, sy + 8.5 * m);
    ctx.lineTo(sx + 8 * m + lean,    sy + 3 * m);
    ctx.lineTo(sx + 8 * m + lean,    sy + 8.5 * m);
    ctx.closePath();
    ctx.fill();

    // Top tier (narrow)
    ctx.fillStyle = '#243d28';
    ctx.beginPath();
    ctx.moveTo(sx + 5 * m + lean, sy + 5.5 * m);
    ctx.lineTo(sx + 11 * m + lean, sy + 5.5 * m);
    ctx.lineTo(sx + 8 * m + lean,  sy + 0.5 * m);
    ctx.closePath();
    ctx.fill();

    // Snow on branches — white lumps on top edges of each tier
    ctx.fillStyle = '#e8f2f8';
    // Bottom tier snow
    ctx.beginPath();
    ctx.moveTo(sx + 2 * m + lean,  sy + 11 * m);
    ctx.lineTo(sx + 8 * m + lean,  sy + 6.5 * m);
    ctx.lineTo(sx + 14 * m + lean, sy + 11 * m);
    ctx.lineTo(sx + 12 * m + lean, sy + 12 * m);
    ctx.lineTo(sx + 8 * m + lean,  sy + 8 * m);
    ctx.lineTo(sx + 4 * m + lean,  sy + 12 * m);
    ctx.closePath();
    ctx.fill();

    // Middle tier snow
    ctx.beginPath();
    ctx.moveTo(sx + 3.5 * m + lean,  sy + 7.5 * m);
    ctx.lineTo(sx + 8 * m + lean,    sy + 3.5 * m);
    ctx.lineTo(sx + 12.5 * m + lean, sy + 7.5 * m);
    ctx.lineTo(sx + 11 * m + lean,   sy + 8.5 * m);
    ctx.lineTo(sx + 8 * m + lean,    sy + 5.5 * m);
    ctx.lineTo(sx + 5 * m + lean,    sy + 8.5 * m);
    ctx.closePath();
    ctx.fill();

    // Top tier snow cap
    ctx.beginPath();
    ctx.moveTo(sx + 5 * m + lean,  sy + 4.5 * m);
    ctx.lineTo(sx + 8 * m + lean,  sy + 0.5 * m);
    ctx.lineTo(sx + 11 * m + lean, sy + 4.5 * m);
    ctx.lineTo(sx + 9.5 * m + lean, sy + 5.5 * m);
    ctx.lineTo(sx + 8 * m + lean,  sy + 3 * m);
    ctx.lineTo(sx + 6.5 * m + lean, sy + 5.5 * m);
    ctx.closePath();
    ctx.fill();

    // Snow glint highlight on cap
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx + 7.5 * m + lean, sy + m, m * 0.8, m * 0.8);
  },
});

// Frozen pond tile (solid — impassable ice sheet)
var T_FROZEN_POND = TileRegistry.add({
  id: 107,
  name: 'frozen_pond',
  solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h1 = ((wx * 374761393 + wy * 668265263) >>> 0);
    var h2 = (((h1 >> 13) ^ h1) * 1274126177) >>> 0;

    // Ice base — pale blue-white
    var iceNoise = Math.sin(wx * 0.7 + wy * 0.5) * 6;
    ctx.fillStyle = shadeHex('#b8d8f0', Math.round(iceNoise));
    ctx.fillRect(sx, sy, ts, ts);

    // Deeper ice tone variation — organic depth patches
    var depthNoise = Math.sin(wx * 1.4 + wy * 1.1) * 0.5 + Math.sin(wx * 2.8 + wy * 0.7) * 0.5;
    if (depthNoise > 0.2) {
      ctx.fillStyle = 'rgba(100,160,210,0.25)';
      ctx.fillRect(sx + 2 * m, sy + 2 * m, ts - 4 * m, ts - 4 * m);
    }
    if (depthNoise < -0.2) {
      ctx.fillStyle = 'rgba(200,230,255,0.2)';
      ctx.fillRect(sx + m, sy + 3 * m, ts - 2 * m, ts - 5 * m);
    }

    // Primary crack network — branching lines
    ctx.strokeStyle = 'rgba(80,130,180,0.55)';
    ctx.lineWidth = Math.max(0.5, m * 0.45);

    // Main crack — diagonal, placed by hash
    var ax = ((h2 >> 2) % 6 + 1) * m;
    var ay = ((h2 >> 5) % 4 + 1) * m;
    var bx = ((h2 >> 8) % 6 + 8) * m;
    var by = ((h2 >> 11) % 5 + 9) * m;
    ctx.beginPath();
    ctx.moveTo(sx + ax, sy + ay);
    ctx.lineTo(sx + bx, sy + by);
    ctx.stroke();

    // Branch crack from midpoint
    var mx2 = (ax + bx) * 0.5, my2 = (ay + by) * 0.5;
    ctx.strokeStyle = 'rgba(80,130,180,0.35)';
    ctx.lineWidth = Math.max(0.5, m * 0.3);
    ctx.beginPath();
    ctx.moveTo(sx + mx2, sy + my2);
    ctx.lineTo(sx + mx2 + ((h2 >> 14) % 5 - 2) * m, sy + my2 - ((h2 >> 1) % 4 + 2) * m);
    ctx.stroke();

    // Second shorter crack
    var cx2 = ((h2 >> 4) % 8 + 4) * m;
    var cy2 = ((h2 >> 7) % 5 + 2) * m;
    ctx.beginPath();
    ctx.moveTo(sx + cx2, sy + cy2);
    ctx.lineTo(sx + cx2 + ((h2 >> 9) % 5 + 2) * m, sy + cy2 + ((h2 >> 12) % 4 + 1) * m);
    ctx.stroke();

    // Frost star pattern at crack intersection
    ctx.strokeStyle = 'rgba(220,240,255,0.7)';
    ctx.lineWidth = Math.max(0.5, m * 0.35);
    var fx = ((h2 >> 6) % 10 + 3) * m;
    var fy = ((h2 >> 3) % 8 + 4) * m;
    // Six-point burst
    for (var i = 0; i < 3; i++) {
      var angle = (i / 3) * Math.PI;
      var flen = ((h2 >> (i * 3)) % 2 + 2) * m;
      ctx.beginPath();
      ctx.moveTo(sx + fx - Math.cos(angle) * flen, sy + fy - Math.sin(angle) * flen);
      ctx.lineTo(sx + fx + Math.cos(angle) * flen, sy + fy + Math.sin(angle) * flen);
      ctx.stroke();
    }

    // Surface sheen — bright highlight strip from overhead light
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(sx + 3 * m, sy + 2 * m, ts - 8 * m, m * 1.5);

    // Edge darkening — ice thinner at border, darker
    ctx.strokeStyle = 'rgba(60,110,160,0.3)';
    ctx.lineWidth = Math.max(0.5, m * 0.5);
    ctx.strokeRect(sx + 0.5, sy + 0.5, ts - 1, ts - 1);

    // Tiny trapped bubble
    if ((h2 % 5) === 0) {
      ctx.fillStyle = 'rgba(180,220,255,0.6)';
      ctx.beginPath();
      ctx.arc(sx + ((h2 >> 8) % 10 + 3) * m, sy + ((h2 >> 11) % 8 + 4) * m, m * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(140,190,240,0.5)';
      ctx.lineWidth = Math.max(0.3, m * 0.25);
      ctx.stroke();
    }
  },
});

BiomeRegistry.add({
  id: 'tundra',
  name: 'Tundra',
  groundTile: T_TUNDRA_GROUND,
  heightRange: [0.4, 0.7],
  moistureRange: [0.1, 0.4],
  palette: { base: '#9ab0c2', dark: '#6a8898', light: '#c8dce8', detail: '#7a9aaa' },
  wallColor: '#6a7a88',
  ambientColor: '#06090d',
  ambientIntensity: 0.06,
  lightColor: '#cce0ff',
  enemies: ['frost_wolf', 'ice_elemental'],
  density: { trees: 0.03, herbs: 0.01 },
});
