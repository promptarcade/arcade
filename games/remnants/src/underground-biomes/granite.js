
// ============================================================
// UNDERGROUND BIOME: Granite — depth 5-6, hard stone, gold, gems, underground lakes
// ============================================================

// Granite-specific tiles
var T_GRANITE = TileRegistry.add({
  id: 330, name: 'granite', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 4729 + (wy||0) * 6173) >>> 0);
    // Dark grey base
    ctx.fillStyle = shadeHex('#555560', ((h % 7) - 3) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Speckled texture — lighter grey flecks
    ctx.fillStyle = shadeHex('#6a6a72', 5);
    ctx.fillRect(sx + ((h>>2)%9+2)*m, sy + ((h>>4)%9+2)*m, 2*m, 1.5*m);
    ctx.fillRect(sx + ((h>>6)%8+4)*m, sy + ((h>>8)%7+7)*m, 1.5*m, 2*m);
    ctx.fillRect(sx + ((h>>10)%7+1)*m, sy + ((h>>12)%8+5)*m, 2*m, 1*m);
    // Darker grain
    ctx.fillStyle = shadeHex('#444450', -5);
    ctx.fillRect(sx + ((h>>3)%10+1)*m, sy + ((h>>7)%8+1)*m, 3*m, 1*m);
    ctx.fillRect(sx + ((h>>9)%7+6)*m, sy + ((h>>11)%7+8)*m, 2*m, 2*m);
    // Quartz flecks — bright white dots
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(sx + ((h>>1)%12+2)*m, sy + ((h>>5)%12+2)*m, 1*m, 1*m);
    if ((h % 3) === 0) {
      ctx.fillRect(sx + ((h>>13)%10+3)*m, sy + ((h>>14)%10+3)*m, 1*m, 1*m);
    }
  },
  onInteract: function(game, wx, wy) {
    var tool = checkTool(game.player, 'mining');
    if (!tool) {
      GameUtils.addLog('Need a pickaxe to mine granite.', '#999');
      return;
    }
    useTool(game.player, tool);
    useTool(game.player, tool); // Granite is very hard — 2 durability
    Underground.setTile(wx, wy, T_MINE_FLOOR);
    var count = 2 + Math.floor(Math.random() * 2);
    Bag.add(game.player.bag, 'stone', count);
    GameUtils.addLog('+' + count + ' Stone', '#888');
    GameUtils.addFloating(wx, wy, '+' + count + ' Stone', '#888');
    PlayerSkills.addXp(game.player.skills, 'mining', 4);
    SFX.hit();
  },
});

var T_GRANITE_CAVE = TileRegistry.add({
  id: 331, name: 'granite_cave', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 3613 + (wy||0) * 7219) >>> 0);
    // Smooth dark floor
    ctx.fillStyle = shadeHex('#3a3a42', ((h % 5) - 2) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Smooth worn patches
    ctx.fillStyle = shadeHex('#42424a', 4);
    ctx.fillRect(sx + ((h>>2)%8+2)*m, sy + ((h>>4)%8+3)*m, 4*m, 3*m);
    // Occasional crystal glint
    if ((h % 6) === 0) {
      var pulse = Math.sin(animTimer * 3 + (wx||0) * 0.7 + (wy||0) * 0.9) * 0.15;
      ctx.fillStyle = 'rgba(200,220,255,' + (0.15 + pulse).toFixed(2) + ')';
      ctx.fillRect(sx + ((h>>5)%10+3)*m, sy + ((h>>7)%10+3)*m, 1*m, 1*m);
    }
  },
});

var T_GOLD_VEIN_UG = TileRegistry.add({
  id: 332, name: 'gold_vein', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 5347 + (wy||0) * 2819) >>> 0);
    // Granite base
    ctx.fillStyle = shadeHex('#555560', ((h % 5) - 2) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Granite speckle
    ctx.fillStyle = shadeHex('#6a6a72', 3);
    ctx.fillRect(sx + ((h>>2)%8+3)*m, sy + ((h>>4)%7+4)*m, 2*m, 1.5*m);
    // Gold streaks — bright and visible
    ctx.fillStyle = '#daa520';
    ctx.fillRect(sx + ((h>>3)%6+2)*m, sy + ((h>>5)%5+3)*m, 5*m, 1.5*m);
    ctx.fillRect(sx + ((h>>6)%5+4)*m, sy + ((h>>8)%5+7)*m, 4*m, 2*m);
    ctx.fillRect(sx + ((h>>7)%7+1)*m, sy + ((h>>9)%4+10)*m, 3*m, 1*m);
    // Gold highlight
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(sx + ((h>>3)%6+3)*m, sy + ((h>>5)%5+3)*m, 3*m, 1*m);
    ctx.fillRect(sx + ((h>>6)%5+5)*m, sy + ((h>>8)%5+7)*m, 2*m, 1*m);
    // Shimmer
    var pulse = Math.sin(animTimer * 2.5 + (wx||0) * 1.1) * 0.12;
    ctx.fillStyle = 'rgba(255,215,0,' + (0.15 + pulse).toFixed(2) + ')';
    ctx.fillRect(sx + ((h>>10)%8+4)*m, sy + ((h>>11)%6+5)*m, 2*m, 1*m);
  },
  onInteract: function(game, wx, wy) {
    var tool = checkTool(game.player, 'mining');
    if (!tool) {
      GameUtils.addLog('Need a pickaxe to mine gold.', '#999');
      return;
    }
    useTool(game.player, tool);
    Underground.setTile(wx, wy, T_MINE_FLOOR);
    var count = 1 + Math.floor(Math.random() * 2);
    Bag.add(game.player.bag, 'gold_ore', count);
    GameUtils.addLog('+' + count + ' Gold Ore', '#ffd700');
    GameUtils.addFloating(wx, wy, '+' + count + ' Gold Ore', '#ffd700');
    PlayerSkills.addXp(game.player.skills, 'mining', 8);
    SFX.hit();
  },
});

var T_GEM_POCKET = TileRegistry.add({
  id: 333, name: 'gem_pocket', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 6917 + (wy||0) * 4231) >>> 0);
    // Dark rock base
    ctx.fillStyle = shadeHex('#3e3e48', ((h % 5) - 2) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Rock texture
    ctx.fillStyle = shadeHex('#4a4a52', 3);
    ctx.fillRect(sx + ((h>>2)%8+2)*m, sy + ((h>>4)%8+2)*m, 3*m, 2*m);
    // Coloured crystal facets — colour chosen per tile from hash
    var gemColors = ['#e03030', '#3080e0', '#30c050', '#c040d0', '#e0a020'];
    var gemIdx = h % gemColors.length;
    var gemCol = gemColors[gemIdx];
    // Main crystal cluster
    ctx.fillStyle = gemCol;
    ctx.fillRect(sx + 5*m, sy + 5*m, 3*m, 4*m);
    ctx.fillRect(sx + 7*m, sy + 3*m, 2*m, 3*m);
    ctx.fillRect(sx + 4*m, sy + 8*m, 2*m, 3*m);
    // Bright facet highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(sx + 6*m, sy + 5*m, 1*m, 2*m);
    ctx.fillRect(sx + 7*m, sy + 3*m, 1*m, 1*m);
    // Sparkle
    var pulse = Math.sin(animTimer * 4 + (wx||0) * 1.3 + (wy||0) * 0.8) * 0.2;
    ctx.fillStyle = 'rgba(255,255,255,' + (0.25 + pulse).toFixed(2) + ')';
    ctx.fillRect(sx + 6*m, sy + 6*m, 1*m, 1*m);
  },
  onInteract: function(game, wx, wy) {
    var tool = checkTool(game.player, 'mining');
    if (!tool) {
      GameUtils.addLog('Need a pickaxe to extract gems.', '#999');
      return;
    }
    useTool(game.player, tool);
    Underground.setTile(wx, wy, T_MINE_FLOOR);
    Bag.add(game.player.bag, 'gem', 1);
    GameUtils.addLog('Rare find! +1 Gem', '#c040d0');
    GameUtils.addFloating(wx, wy, 'Rare Gem!', '#c040d0');
    PlayerSkills.addXp(game.player.skills, 'mining', 12);
    SFX.hit();
  },
});

var T_UNDERGROUND_LAKE = TileRegistry.add({
  id: 334, name: 'underground_lake', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 4013 + (wy||0) * 5527) >>> 0);
    // Very dark blue-black water
    ctx.fillStyle = shadeHex('#0a1018', ((h % 5) - 2) * 1);
    ctx.fillRect(sx, sy, ts, ts);
    // Subtle depth variation
    ctx.fillStyle = '#0e1520';
    ctx.fillRect(sx + ((h>>2)%6+3)*m, sy + ((h>>4)%6+4)*m, 5*m, 3*m);
    // Subtle light reflection — slow gentle pulse
    var pulse = Math.sin(animTimer * 1.2 + (wx||0) * 0.4 + (wy||0) * 0.6) * 0.08;
    ctx.fillStyle = 'rgba(80,110,150,' + (0.1 + pulse).toFixed(2) + ')';
    ctx.fillRect(sx + ((h>>3)%8+3)*m, sy + ((h>>5)%5+4)*m, 6*m, 1*m);
    // Second reflection line
    var pulse2 = Math.sin(animTimer * 0.9 + (wx||0) * 0.6 + (wy||0) * 0.3) * 0.06;
    ctx.fillStyle = 'rgba(60,90,130,' + (0.08 + pulse2).toFixed(2) + ')';
    ctx.fillRect(sx + ((h>>7)%7+2)*m, sy + ((h>>9)%4+9)*m, 5*m, 1*m);
  },
});

var T_QUARTZ_WALL = TileRegistry.add({
  id: 335, name: 'quartz_wall', solid: true,
  light: { color: '#ddeeff', radius: 1.5, intensity: 0.15 },
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 7331 + (wy||0) * 3119) >>> 0);
    // White-grey translucent base
    ctx.fillStyle = shadeHex('#c8ccd4', ((h % 5) - 2) * 3);
    ctx.fillRect(sx, sy, ts, ts);
    // Crystalline structure lines
    ctx.fillStyle = shadeHex('#d8dce4', 5);
    ctx.fillRect(sx + ((h>>2)%6+2)*m, sy + 1*m, 2*m, 14*m);
    ctx.fillRect(sx + ((h>>4)%5+8)*m, sy + 2*m, 2*m, 12*m);
    // Translucent depth
    ctx.fillStyle = 'rgba(200,210,230,0.3)';
    ctx.fillRect(sx + 3*m, sy + 3*m, 10*m, 10*m);
    // Inner glow — gentle pulse
    var pulse = Math.sin(animTimer * 1.5 + (wx||0) * 0.5 + (wy||0) * 0.7) * 0.08;
    ctx.fillStyle = 'rgba(220,230,255,' + (0.12 + pulse).toFixed(2) + ')';
    ctx.fillRect(sx + 4*m, sy + 4*m, 8*m, 8*m);
    // Bright highlight facets
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(sx + ((h>>6)%6+4)*m, sy + ((h>>8)%6+3)*m, 2*m, 1*m);
    ctx.fillRect(sx + ((h>>10)%5+6)*m, sy + ((h>>12)%5+8)*m, 1*m, 2*m);
  },
  onInteract: function(game, wx, wy) {
    var tool = checkTool(game.player, 'mining');
    if (!tool) {
      GameUtils.addLog('Need a pickaxe to mine quartz.', '#999');
      return;
    }
    useTool(game.player, tool);
    Underground.setTile(wx, wy, T_MINE_FLOOR);
    var drop = Math.random() < 0.5 ? 'crystal_ice' : 'crystal_fire';
    var dropName = drop === 'crystal_ice' ? 'Ice Crystal' : 'Fire Crystal';
    var dropColor = drop === 'crystal_ice' ? '#88ccff' : '#ff8844';
    Bag.add(game.player.bag, drop, 1);
    GameUtils.addLog('+1 ' + dropName, dropColor);
    GameUtils.addFloating(wx, wy, '+1 ' + dropName, dropColor);
    PlayerSkills.addXp(game.player.skills, 'mining', 10);
    SFX.hit();
  },
});

// Register the biome
UndergroundBiomeRegistry.add({
  id: 'granite',
  name: 'Deep Granite',
  minDepth: 5,
  accent: '#778899',
  ambientColor: '#030305',

  // Ore table — what drops when mining generic rock in this biome
  oreTable: [
    { id: 'stone', name: 'Stone', chance: 0.25, min: 1, max: 2, color: '#888' },
    { id: 'iron_ore', name: 'Iron Ore', chance: 0.15, min: 1, max: 1, color: '#aa7755' },
    { id: 'gold_ore', name: 'Gold Ore', chance: 0.12, min: 1, max: 1, color: '#ffd700' },
    { id: 'copper_ore', name: 'Copper Ore', chance: 0.10, min: 1, max: 1, color: '#cc7744' },
    { id: 'gem', name: 'Gem', chance: 0.05, min: 1, max: 1, color: '#c040d0' },
    { id: 'crystal_fire', name: 'Fire Crystal', chance: 0.02, min: 1, max: 1, color: '#ff8844' },
    { id: 'crystal_ice', name: 'Ice Crystal', chance: 0.02, min: 1, max: 1, color: '#88ccff' },
    // 0.29 chance = nothing extra
  ],

  // Generate tile type for a world position
  generate: function(wx, wy, depth, seed, rng) {
    // Cavern noise — moderate sized caverns
    var caveNoise = overworldFbm(wx, wy, seed + 60000, 3, 0.06);

    // Open caverns at threshold 0.28
    var isCavern = caveNoise < 0.28;

    // Underground lakes — water noise inside caverns
    var waterNoise = overworldNoise(wx, wy, seed + 70000, 0.06);
    if (waterNoise < 0.10 && isCavern) return T_UNDERGROUND_LAKE;

    // Open cavern floor
    if (isCavern) return T_GRANITE_CAVE;

    // Quartz walls — scattered in solid areas, high noise
    var quartzNoise = overworldNoise(wx, wy, seed + 80000, 0.08);
    if (quartzNoise > 0.92) return T_QUARTZ_WALL;

    // Gem pockets — very rare
    var gemNoise = overworldNoise(wx, wy, seed + 90000, 0.1);
    if (gemNoise > 0.93) return T_GEM_POCKET;

    // Gold veins
    var goldNoise = overworldNoise(wx, wy, seed + 100000, 0.1);
    if (goldNoise > 0.90) return T_GOLD_VEIN_UG;

    // Default: solid granite
    return T_GRANITE;
  },
});
