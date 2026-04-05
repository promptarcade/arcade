
// ============================================================
// UNDERGROUND BIOME: Limestone — depth 3-4, sedimentary caverns, iron & copper
// ============================================================

// Limestone-specific tiles
var T_LIMESTONE = TileRegistry.add({
  id: 320, name: 'limestone', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 4391 + (wy||0) * 6733) >>> 0);
    // Grey-white stone base
    ctx.fillStyle = shadeHex('#b0aba0', ((h % 7) - 3) * 3);
    ctx.fillRect(sx, sy, ts, ts);
    // Sediment bands — horizontal layered lines
    ctx.fillStyle = shadeHex('#9a9488', ((h >> 2) % 5) - 2);
    ctx.fillRect(sx, sy + 3*m, ts, 1.5*m);
    ctx.fillStyle = shadeHex('#a09a8e', ((h >> 4) % 5) - 2);
    ctx.fillRect(sx, sy + 9*m, ts, 1*m);
    ctx.fillStyle = shadeHex('#96908a', ((h >> 6) % 5) - 2);
    ctx.fillRect(sx, sy + 13*m, ts, 1.5*m);
    // Darker crevice detail between layers
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(sx, sy + 4.5*m, ts, 0.5*m);
    ctx.fillRect(sx, sy + 10*m, ts, 0.5*m);
    // Fossil imprints in some tiles
    if ((h % 5) === 0) {
      ctx.strokeStyle = 'rgba(80,75,65,0.4)';
      ctx.lineWidth = Math.max(0.5, m * 0.5);
      var fx = sx + ((h >> 8) % 6 + 4) * m;
      var fy = sy + ((h >> 10) % 5 + 5) * m;
      // Spiral fossil shape
      ctx.beginPath();
      ctx.arc(fx, fy, 2*m, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(fx, fy, 1*m, 0, Math.PI);
      ctx.stroke();
    }
    // Occasional lighter speckles (calcite crystals)
    if ((h % 3) === 0) {
      ctx.fillStyle = 'rgba(220,218,210,0.3)';
      ctx.fillRect(sx + ((h >> 3) % 10 + 2) * m, sy + ((h >> 5) % 8 + 2) * m, 1*m, 1*m);
      ctx.fillRect(sx + ((h >> 7) % 8 + 5) * m, sy + ((h >> 9) % 7 + 7) * m, 1*m, 0.5*m);
    }
  },
  onInteract: function(game, wx, wy) {
    if (!game.player.checkTool('pickaxe')) {
      GameUtils.addLog('Need a pickaxe.', '#aa6666');
      return;
    }
    game.player.useTool('pickaxe');
    Underground.setTile(wx, wy, T_MINE_FLOOR);
    Bag.add(game.player.bag, 'stone', 2);
    GameUtils.addLog('+2 Stone', '#aaaaaa');
    GameUtils.addFloating(wx, wy, '+2 Stone', '#aaaaaa');
    PlayerSkills.addXp(game.player.skills, 'mining', 3);
    SFX.hit();
  },
});

var T_LIMESTONE_CAVE = TileRegistry.add({
  id: 321, name: 'limestone_cave', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 5347 + (wy||0) * 7129) >>> 0);
    // Dark cavern floor
    ctx.fillStyle = shadeHex('#4a4640', ((h % 5) - 2) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Scattered gravel / rubble texture
    ctx.fillStyle = shadeHex('#5a5650', 4);
    ctx.fillRect(sx + ((h >> 2) % 8 + 2) * m, sy + ((h >> 4) % 8 + 3) * m, 2*m, 1.5*m);
    ctx.fillRect(sx + ((h >> 6) % 7 + 6) * m, sy + ((h >> 8) % 6 + 8) * m, 1.5*m, 1*m);
    // Stalactite shadows falling from above
    if ((h % 3) === 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      var stx = sx + ((h >> 3) % 8 + 3) * m;
      // Pointed shadow triangle
      ctx.beginPath();
      ctx.moveTo(stx, sy);
      ctx.lineTo(stx + 2*m, sy);
      ctx.lineTo(stx + 1*m, sy + 4*m);
      ctx.closePath();
      ctx.fill();
    }
    if ((h % 4) === 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      var stx2 = sx + ((h >> 5) % 6 + 7) * m;
      ctx.beginPath();
      ctx.moveTo(stx2, sy);
      ctx.lineTo(stx2 + 1.5*m, sy);
      ctx.lineTo(stx2 + 0.75*m, sy + 3*m);
      ctx.closePath();
      ctx.fill();
    }
    // Dripping water effect — animated droplet spot
    if ((h % 4) === 1) {
      var drip = (animTimer * 1.5 + (wx||0) * 0.7) % 3;
      if (drip < 1) {
        var dx = sx + ((h >> 7) % 8 + 4) * m;
        var dy = sy + drip * 8 * m;
        ctx.fillStyle = 'rgba(100,140,180,' + (0.5 - drip * 0.3).toFixed(2) + ')';
        ctx.fillRect(dx, dy, 1*m, 1*m);
      }
      // Wet spot on floor
      ctx.fillStyle = 'rgba(80,120,160,0.08)';
      ctx.fillRect(sx + ((h >> 7) % 8 + 3) * m, sy + 12*m, 3*m, 2*m);
    }
  },
  light: { color: '#556666', radius: 1, intensity: 0.05 },
});

var T_IRON_VEIN_UG = TileRegistry.add({
  id: 322, name: 'iron_vein_ug', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 6211 + (wy||0) * 3583) >>> 0);
    // Dark rock base
    ctx.fillStyle = shadeHex('#5a5550', ((h % 5) - 2) * 3);
    ctx.fillRect(sx, sy, ts, ts);
    // Iron ore streaks — orange-brown veins
    ctx.fillStyle = shadeHex('#8a5530', ((h >> 2) % 5) * 2);
    ctx.fillRect(sx + ((h >> 3) % 4 + 1) * m, sy + 2*m, 5*m, 2*m);
    ctx.fillRect(sx + ((h >> 5) % 5 + 3) * m, sy + 7*m, 6*m, 2.5*m);
    ctx.fillRect(sx + ((h >> 7) % 3 + 6) * m, sy + 12*m, 4*m, 2*m);
    // Brighter iron highlights
    ctx.fillStyle = shadeHex('#aa6535', 10);
    ctx.fillRect(sx + ((h >> 4) % 4 + 3) * m, sy + 3*m, 2*m, 1*m);
    ctx.fillRect(sx + ((h >> 6) % 3 + 5) * m, sy + 8*m, 3*m, 1*m);
    // Rust-orange speckles
    ctx.fillStyle = '#9a5e2e';
    ctx.fillRect(sx + ((h >> 8) % 10 + 2) * m, sy + ((h >> 10) % 8 + 4) * m, 1*m, 1*m);
    ctx.fillRect(sx + ((h >> 9) % 8 + 5) * m, sy + ((h >> 11) % 6 + 2) * m, 1*m, 1*m);
    // Dark cracks
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(sx + 1*m, sy + 5*m, 10*m, 0.5*m);
  },
  onInteract: function(game, wx, wy) {
    if (!game.player.checkTool('pickaxe')) {
      GameUtils.addLog('Need a pickaxe.', '#aa6666');
      return;
    }
    game.player.useTool('pickaxe');
    Underground.setTile(wx, wy, T_MINE_FLOOR);
    var count = 1 + Math.floor(Math.random() * 2);
    Bag.add(game.player.bag, 'iron_ore', count);
    GameUtils.addLog('+' + count + ' Iron Ore', '#cc8844');
    GameUtils.addFloating(wx, wy, '+' + count + ' Iron Ore', '#cc8844');
    PlayerSkills.addXp(game.player.skills, 'mining', 5);
    SFX.hit();
  },
});

var T_COPPER_VEIN_UG = TileRegistry.add({
  id: 323, name: 'copper_vein_ug', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 7297 + (wy||0) * 4813) >>> 0);
    // Dark rock base
    ctx.fillStyle = shadeHex('#585550', ((h % 5) - 2) * 3);
    ctx.fillRect(sx, sy, ts, ts);
    // Copper patches — green-tinted with turquoise oxidation
    ctx.fillStyle = shadeHex('#5a8a60', ((h >> 2) % 5) * 2);
    ctx.fillRect(sx + ((h >> 3) % 5 + 2) * m, sy + 1*m, 5*m, 3*m);
    ctx.fillRect(sx + ((h >> 5) % 4 + 1) * m, sy + 8*m, 6*m, 3*m);
    // Raw copper — orange-brown core
    ctx.fillStyle = shadeHex('#b07040', ((h >> 4) % 5) - 2);
    ctx.fillRect(sx + ((h >> 6) % 3 + 4) * m, sy + 2*m, 3*m, 1.5*m);
    ctx.fillRect(sx + ((h >> 8) % 3 + 3) * m, sy + 9*m, 3*m, 1.5*m);
    // Verdigris highlights — bright green oxidation
    ctx.fillStyle = 'rgba(80,180,120,0.25)';
    ctx.fillRect(sx + ((h >> 7) % 6 + 3) * m, sy + ((h >> 9) % 5 + 4) * m, 2*m, 1*m);
    ctx.fillRect(sx + ((h >> 10) % 5 + 5) * m, sy + ((h >> 11) % 4 + 6) * m, 1.5*m, 1*m);
    // Dark cracks
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.fillRect(sx + 2*m, sy + 6*m, 8*m, 0.5*m);
  },
  onInteract: function(game, wx, wy) {
    if (!game.player.checkTool('pickaxe')) {
      GameUtils.addLog('Need a pickaxe.', '#aa6666');
      return;
    }
    game.player.useTool('pickaxe');
    Underground.setTile(wx, wy, T_MINE_FLOOR);
    var count = 1 + Math.floor(Math.random() * 2);
    Bag.add(game.player.bag, 'copper_ore', count);
    GameUtils.addLog('+' + count + ' Copper Ore', '#cc7744');
    GameUtils.addFloating(wx, wy, '+' + count + ' Copper Ore', '#cc7744');
    PlayerSkills.addXp(game.player.skills, 'mining', 5);
    SFX.hit();
  },
});

var T_UNDERGROUND_STREAM = TileRegistry.add({
  id: 324, name: 'underground_stream', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 4027 + (wy||0) * 6389) >>> 0);
    // Deep dark water base
    ctx.fillStyle = '#152535';
    ctx.fillRect(sx, sy, ts, ts);
    // Animated flow lines — shift with time
    var flow = animTimer * 3 + (wx||0) * 0.4;
    var flowOffset = (flow % 16) * m;
    // Current lines moving across tile
    ctx.fillStyle = 'rgba(40,80,110,0.3)';
    ctx.fillRect(sx, sy + ((flowOffset + 2*m) % ts), ts, 1*m);
    ctx.fillRect(sx, sy + ((flowOffset + 7*m) % ts), ts, 1.5*m);
    ctx.fillRect(sx, sy + ((flowOffset + 12*m) % ts), ts, 1*m);
    // Surface ripple — animated shimmer
    var pulse = Math.sin(animTimer * 2.5 + (wx||0) * 0.8 + (wy||0) * 0.6);
    ctx.fillStyle = 'rgba(60,100,140,' + (0.15 + pulse * 0.1).toFixed(2) + ')';
    ctx.fillRect(sx + 1*m, sy + ((h >> 3) % 5 + 3) * m, 10*m, 1*m);
    ctx.fillRect(sx + 3*m, sy + ((h >> 5) % 4 + 9) * m, 7*m, 1*m);
    // Foam / white caps on fast current
    var foam = Math.sin(animTimer * 4 + (wy||0) * 1.2);
    if (foam > 0.5) {
      ctx.fillStyle = 'rgba(140,170,200,' + ((foam - 0.5) * 0.3).toFixed(2) + ')';
      ctx.fillRect(sx + ((h >> 7) % 6 + 4) * m, sy + ((flowOffset + 5*m) % ts), 3*m, 0.5*m);
    }
    // Darker depth at edges
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(sx, sy, 2*m, ts);
    ctx.fillRect(sx + 14*m, sy, 2*m, ts);
  },
  light: { color: '#334466', radius: 1, intensity: 0.08 },
});

// Register the biome
UndergroundBiomeRegistry.add({
  id: 'limestone',
  name: 'Limestone Caverns',
  minDepth: 3,
  accent: '#aaaaaa',
  ambientColor: '#040405',

  // Ore table — what drops when mining rock in this biome
  oreTable: [
    { id: 'stone', name: 'Stone', chance: 0.30, min: 1, max: 2, color: '#aaa' },
    { id: 'iron_ore', name: 'Iron Ore', chance: 0.20, min: 1, max: 1, color: '#cc8844' },
    { id: 'copper_ore', name: 'Copper Ore', chance: 0.15, min: 1, max: 1, color: '#cc7744' },
    { id: 'flint', name: 'Flint', chance: 0.10, min: 1, max: 1, color: '#666655' },
    { id: 'gold_ore', name: 'Gold Ore', chance: 0.05, min: 1, max: 1, color: '#ddaa33' },
    { id: 'gem', name: 'Gem', chance: 0.02, min: 1, max: 1, color: '#66aadd' },
    // 0.18 chance = nothing extra
  ],

  // Generate tile type for a world position
  generate: function(wx, wy, depth, seed, rng) {
    // Cave noise — larger cavern pockets than soil (scale 0.07, threshold 0.25)
    var caveNoise = overworldFbm(wx, wy, seed + 60000, 3, 0.07);

    // Open caverns
    if (caveNoise < 0.25) return T_LIMESTONE_CAVE;

    // Underground streams — near cavern edges where water collects
    var waterNoise = overworldNoise(wx, wy, seed + 70000, 0.06);
    if (waterNoise < 0.12 && caveNoise < 0.35) return T_UNDERGROUND_STREAM;

    // Ore veins in solid rock
    var oreNoise = overworldNoise(wx, wy, seed + 80000, 0.1);

    // Iron veins — most common ore
    if (oreNoise > 0.88) return T_IRON_VEIN_UG;

    // Copper veins
    if (oreNoise > 0.85) return T_COPPER_VEIN_UG;

    // Default solid tile is limestone (not generic rock)
    return T_LIMESTONE;
  },
});
