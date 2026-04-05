
// ============================================================
// UNDERGROUND BIOME: Magma Layer — depth 9+, molten danger, rare gems
// ============================================================
// The deepest, most dangerous biome. Lava pools, heat damage on
// cave floors, but rich rewards: pre-smelted iron and diamonds.

// Register diamond resource
ResourceRegistry.add({ id: 'diamond', name: 'Diamond', color: '#eeeeff', category: 'gem', stackMax: 10 });

// --- Tile 350: Basalt (solid, dark rock with heat cracks) ---
var T_BASALT = TileRegistry.add({
  id: 350, name: 'basalt', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 6271 + (wy||0) * 8831) >>> 0);
    // Very dark base — near-black
    ctx.fillStyle = shadeHex('#1a1518', ((h % 7) - 3) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Darker patches for texture
    ctx.fillStyle = shadeHex('#1a1518', -6);
    ctx.fillRect(sx + ((h>>2)%7+2)*m, sy + ((h>>4)%7+3)*m, 3*m, 2.5*m);
    ctx.fillRect(sx + ((h>>6)%6+6)*m, sy + ((h>>8)%6+7)*m, 2.5*m, 3*m);
    // Red-orange heat cracks — glowing from within
    ctx.strokeStyle = 'rgba(255,68,0,' + (0.3 + Math.sin(animTimer * 1.5 + (h % 17) * 0.4) * 0.1).toFixed(2) + ')';
    ctx.lineWidth = Math.max(0.5, m * 0.5);
    if ((h % 3) === 0) {
      ctx.beginPath();
      ctx.moveTo(sx + ((h>>3)%10+2)*m, sy + 1*m);
      ctx.lineTo(sx + ((h>>5)%8+4)*m, sy + 7*m);
      ctx.lineTo(sx + ((h>>7)%9+3)*m, sy + 14*m);
      ctx.stroke();
    }
    if ((h % 5) < 2) {
      ctx.beginPath();
      ctx.moveTo(sx + ((h>>4)%6+8)*m, sy + 3*m);
      ctx.lineTo(sx + ((h>>6)%7+5)*m, sy + 12*m);
      ctx.stroke();
    }
    // Faint glow along cracks
    ctx.fillStyle = 'rgba(255,68,0,0.04)';
    ctx.fillRect(sx + 3*m, sy + 3*m, 10*m, 10*m);
  },
  onInteract: function(game, wx, wy) {
    var check = checkTool(game.player, 'mining');
    if (!check.allowed) {
      GameUtils.addLog(check.message, '#cc8844');
      return;
    }
    useTool(game.player, check.toolId);
    Underground.setTile(wx, wy, T_MAGMA_CAVE);
    Bag.add(game.player.bag, 'stone', 1 + Math.floor(Math.random() * 2));
    GameUtils.addFloating(wx, wy, '+Stone', '#888');
    PlayerSkills.addXp(game.player.skills, 'mining', 4);
    SFX.hit();
  },
  light: { color: '#ff4400', radius: 0.5, intensity: 0.05 },
});

// --- Tile 351: Magma Cave Floor (non-solid, hot, deals 1 damage) ---
var T_MAGMA_CAVE = TileRegistry.add({
  id: 351, name: 'magma_cave', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 5347 + (wy||0) * 7219) >>> 0);
    // Hot rock floor — dark red-brown base
    ctx.fillStyle = shadeHex('#3a1a12', ((h % 7) - 3) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Orange-red heat tint patches
    ctx.fillStyle = shadeHex('#4a2218', 8);
    ctx.fillRect(sx + ((h>>2)%6+2)*m, sy + ((h>>4)%6+3)*m, 4*m, 3*m);
    ctx.fillRect(sx + ((h>>5)%5+7)*m, sy + ((h>>7)%5+8)*m, 3*m, 4*m);
    // Heat shimmer — wobble drawn elements using animTimer
    var shimX = Math.sin(animTimer * 3 + (wx||0) * 0.7) * 0.4 * m;
    var shimY = Math.cos(animTimer * 2.5 + (wy||0) * 0.9) * 0.3 * m;
    ctx.fillStyle = 'rgba(255,100,30,0.08)';
    ctx.fillRect(sx + 2*m + shimX, sy + 4*m + shimY, 5*m, 2*m);
    ctx.fillRect(sx + 8*m - shimX, sy + 9*m - shimY, 4*m, 2*m);
    // Subtle embers
    if ((h % 4) === 0) {
      var emberPulse = 0.12 + Math.sin(animTimer * 4 + h) * 0.06;
      ctx.fillStyle = 'rgba(255,80,20,' + emberPulse.toFixed(2) + ')';
      ctx.fillRect(sx + ((h>>3)%8+4)*m, sy + ((h>>6)%8+4)*m, 1*m, 1*m);
    }
  },
  damage: 1,
});

// --- Tile 352: Lava Pool (non-solid, bright molten lava, 3 damage) ---
var T_LAVA_POOL = TileRegistry.add({
  id: 352, name: 'lava_pool', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 4729 + (wy||0) * 9311) >>> 0);
    // Dark red beneath
    ctx.fillStyle = '#4a0800';
    ctx.fillRect(sx, sy, ts, ts);
    // Molten flow layer — animated
    var flowOffset = animTimer * 0.8 + (wx||0) * 0.3;
    var flowWave = Math.sin(flowOffset) * 2 * m;
    // Mid lava — deep orange
    ctx.fillStyle = shadeHex('#cc4400', ((h % 5) - 2) * 4);
    ctx.fillRect(sx + 1*m, sy + 2*m + flowWave * 0.3, 14*m, 5*m);
    ctx.fillRect(sx + 2*m, sy + 9*m - flowWave * 0.2, 12*m, 4*m);
    // Bright orange-yellow surface — pulsing
    var pulse = 0.7 + Math.sin(animTimer * 2 + (h % 13) * 0.5) * 0.3;
    ctx.fillStyle = 'rgba(255,180,30,' + pulse.toFixed(2) + ')';
    ctx.fillRect(sx + 3*m + flowWave * 0.5, sy + 3*m, 6*m, 3*m);
    ctx.fillRect(sx + 5*m - flowWave * 0.3, sy + 10*m, 5*m, 2*m);
    // Bright hotspots
    ctx.fillStyle = 'rgba(255,240,120,' + (pulse * 0.5).toFixed(2) + ')';
    ctx.fillRect(sx + 4*m + flowWave * 0.2, sy + 4*m, 3*m, 1.5*m);
    ctx.fillRect(sx + 7*m, sy + 10.5*m, 2*m, 1*m);
    // Dark crust floating on surface
    ctx.fillStyle = 'rgba(30,5,0,0.4)';
    ctx.fillRect(sx + ((h>>2)%4+1)*m, sy + ((h>>4)%3+6)*m, 3*m, 1.5*m);
    ctx.fillRect(sx + ((h>>5)%5+8)*m, sy + ((h>>7)%3+1)*m, 2*m, 1*m);
  },
  damage: 3,
  light: { color: '#ff6600', radius: 4, intensity: 0.5 },
});

// --- Tile 353: Obsidian Floor (non-solid, safe, glassy black) ---
var T_OBSIDIAN_FLOOR = TileRegistry.add({
  id: 353, name: 'obsidian_floor', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 3571 + (wy||0) * 6947) >>> 0);
    // Deep black glassy base
    ctx.fillStyle = shadeHex('#0c0a10', ((h % 5) - 2) * 1);
    ctx.fillRect(sx, sy, ts, ts);
    // Subtle purple-blue tint — volcanic glass
    ctx.fillStyle = 'rgba(40,20,60,0.15)';
    ctx.fillRect(sx + ((h>>2)%4+2)*m, sy + ((h>>4)%4+1)*m, 6*m, 6*m);
    ctx.fillRect(sx + ((h>>5)%5+5)*m, sy + ((h>>7)%5+7)*m, 5*m, 5*m);
    // Sharp reflections — bright white glints
    var glintPulse = 0.15 + Math.sin(animTimer * 3 + h * 0.1) * 0.1;
    ctx.fillStyle = 'rgba(255,255,255,' + glintPulse.toFixed(2) + ')';
    ctx.fillRect(sx + ((h>>3)%8+3)*m, sy + ((h>>6)%8+3)*m, 1*m, 0.5*m);
    if ((h % 3) === 0) {
      ctx.fillRect(sx + ((h>>4)%7+5)*m, sy + ((h>>8)%7+6)*m, 0.5*m, 1*m);
    }
    // Glass edge highlight
    ctx.fillStyle = 'rgba(180,180,220,0.06)';
    ctx.fillRect(sx, sy, ts, 0.5*m);
    ctx.fillRect(sx, sy, 0.5*m, ts);
  },
});

// --- Tile 354: Magma Ore (solid, glowing molten veins, drops iron_bar) ---
var T_MAGMA_ORE = TileRegistry.add({
  id: 354, name: 'magma_ore', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 5813 + (wy||0) * 8423) >>> 0);
    // Basalt base
    ctx.fillStyle = shadeHex('#1a1518', ((h % 5) - 2) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Bright glowing molten veins — pulsing orange-yellow
    var veinPulse = 0.6 + Math.sin(animTimer * 2.5 + (h % 11) * 0.6) * 0.3;
    ctx.strokeStyle = 'rgba(255,136,0,' + veinPulse.toFixed(2) + ')';
    ctx.lineWidth = Math.max(1, m * 1.2);
    // Main vein path
    ctx.beginPath();
    ctx.moveTo(sx + ((h>>2)%4+1)*m, sy + 2*m);
    ctx.lineTo(sx + ((h>>4)%4+6)*m, sy + 6*m);
    ctx.lineTo(sx + ((h>>6)%4+4)*m, sy + 10*m);
    ctx.lineTo(sx + ((h>>8)%4+8)*m, sy + 14*m);
    ctx.stroke();
    // Branch vein
    ctx.beginPath();
    ctx.moveTo(sx + ((h>>4)%4+6)*m, sy + 6*m);
    ctx.lineTo(sx + ((h>>5)%4+10)*m, sy + 8*m);
    ctx.stroke();
    // Bright core of veins
    ctx.fillStyle = 'rgba(255,200,60,' + (veinPulse * 0.7).toFixed(2) + ')';
    ctx.fillRect(sx + ((h>>4)%4+5)*m, sy + 5*m, 2*m, 2*m);
    ctx.fillRect(sx + ((h>>6)%4+3)*m, sy + 9*m, 2*m, 2*m);
    // Glow aura
    ctx.fillStyle = 'rgba(255,136,0,0.06)';
    ctx.fillRect(sx + 1*m, sy + 1*m, 14*m, 14*m);
  },
  onInteract: function(game, wx, wy) {
    var check = checkTool(game.player, 'mining');
    if (!check.allowed) {
      GameUtils.addLog(check.message, '#cc8844');
      return;
    }
    useTool(game.player, check.toolId);
    Underground.setTile(wx, wy, T_MAGMA_CAVE);
    // Drops iron_bar — already smelted by magma heat
    var count = 1 + Math.floor(Math.random() * 2);
    Bag.add(game.player.bag, 'iron_bar', count);
    GameUtils.addLog('+' + count + ' Iron Bar (heat-smelted!)', '#8899aa');
    GameUtils.addFloating(wx, wy, '+' + count + ' Iron Bar', '#8899aa');
    PlayerSkills.addXp(game.player.skills, 'mining', 10);
    SFX.hit();
  },
  light: { color: '#ff8800', radius: 1.5, intensity: 0.2 },
});

// --- Tile 355: Diamond Vein (solid, extremely hard, brilliant sparkles) ---
var T_DIAMOND_VEIN = TileRegistry.add({
  id: 355, name: 'diamond_vein', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 7193 + (wy||0) * 4637) >>> 0);
    // Extremely hard dark rock base
    ctx.fillStyle = shadeHex('#141218', ((h % 5) - 2) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Dark texture
    ctx.fillStyle = shadeHex('#141218', -5);
    ctx.fillRect(sx + ((h>>2)%6+3)*m, sy + ((h>>4)%6+2)*m, 4*m, 3*m);
    ctx.fillRect(sx + ((h>>5)%5+6)*m, sy + ((h>>7)%5+8)*m, 3*m, 4*m);
    // Brilliant white sparkles — animated twinkle
    var sparkle1 = 0.5 + Math.sin(animTimer * 5 + h * 0.3) * 0.5;
    var sparkle2 = 0.5 + Math.sin(animTimer * 4.3 + (h>>3) * 0.4) * 0.5;
    var sparkle3 = 0.5 + Math.sin(animTimer * 6.1 + (h>>5) * 0.2) * 0.5;
    // Diamond crystal facets
    ctx.fillStyle = 'rgba(238,238,255,' + sparkle1.toFixed(2) + ')';
    ctx.fillRect(sx + ((h>>2)%6+4)*m, sy + ((h>>4)%6+3)*m, 1.5*m, 1.5*m);
    ctx.fillStyle = 'rgba(200,220,255,' + sparkle2.toFixed(2) + ')';
    ctx.fillRect(sx + ((h>>5)%5+8)*m, sy + ((h>>7)%5+7)*m, 1.5*m, 1.5*m);
    ctx.fillStyle = 'rgba(255,255,255,' + sparkle3.toFixed(2) + ')';
    ctx.fillRect(sx + ((h>>3)%4+2)*m, sy + ((h>>6)%4+10)*m, 1*m, 1*m);
    // Cross-shaped glint on brightest sparkle
    if (sparkle1 > 0.7) {
      ctx.fillStyle = 'rgba(255,255,255,' + (sparkle1 * 0.4).toFixed(2) + ')';
      ctx.fillRect(sx + ((h>>2)%6+4)*m - 1*m, sy + ((h>>4)%6+3.5)*m, 3.5*m, 0.5*m);
      ctx.fillRect(sx + ((h>>2)%6+4.5)*m, sy + ((h>>4)%6+3)*m - 1*m, 0.5*m, 3.5*m);
    }
    // Faint prismatic rainbow hint
    ctx.fillStyle = 'rgba(100,180,255,0.05)';
    ctx.fillRect(sx + 3*m, sy + 5*m, 4*m, 2*m);
    ctx.fillStyle = 'rgba(255,150,200,0.04)';
    ctx.fillRect(sx + 8*m, sy + 9*m, 3*m, 2*m);
  },
  onInteract: function(game, wx, wy) {
    var check = checkTool(game.player, 'mining');
    if (!check.allowed) {
      GameUtils.addLog(check.message, '#cc8844');
      return;
    }
    useTool(game.player, check.toolId);
    Underground.setTile(wx, wy, T_MAGMA_CAVE);
    Bag.add(game.player.bag, 'diamond', 1);
    GameUtils.addLog('+1 Diamond!', '#eeeeff');
    GameUtils.addFloating(wx, wy, '+Diamond!', '#eeeeff');
    PlayerSkills.addXp(game.player.skills, 'mining', 20);
    SFX.hit();
  },
  light: { color: '#ccccff', radius: 1, intensity: 0.15 },
});

// Register the biome
UndergroundBiomeRegistry.add({
  id: 'magma',
  name: 'Magma Layer',
  minDepth: 9,
  accent: '#ff4400',
  ambientColor: '#0a0200',

  // Ore table — rich rewards for the brave
  oreTable: [
    { id: 'stone',        name: 'Stone',        chance: 0.10, min: 1, max: 2, color: '#888888' },
    { id: 'iron_bar',     name: 'Iron Bar',     chance: 0.10, min: 1, max: 1, color: '#8899aa' },
    { id: 'gold_ore',     name: 'Gold Ore',     chance: 0.08, min: 1, max: 2, color: '#ccaa22' },
    { id: 'obsidian',     name: 'Obsidian',     chance: 0.12, min: 1, max: 2, color: '#1a1030' },
    { id: 'gem',          name: 'Gem',          chance: 0.08, min: 1, max: 1, color: '#44ddaa' },
    { id: 'diamond',      name: 'Diamond',      chance: 0.03, min: 1, max: 1, color: '#eeeeff' },
    { id: 'crystal_fire', name: 'Fire Crystal', chance: 0.10, min: 1, max: 1, color: '#ff6622' },
    // 0.39 chance = nothing extra (stone from default rock interaction)
  ],

  // Generate tile type for a world position
  generate: function(wx, wy, depth, seed, rng) {
    // Cavern noise — smaller caverns than upper biomes (scale 0.07, threshold 0.20)
    var caveNoise = overworldFbm(wx, wy, seed + 90000, 3, 0.07);

    // Magma ore veins — special noise channel
    var oreNoise = overworldNoise(wx, wy, seed + 91000, 0.12);

    // Diamond veins — extremely rare
    if (oreNoise > 0.96) return T_DIAMOND_VEIN;

    // Magma ore veins
    if (oreNoise > 0.90) return T_MAGMA_ORE;

    // Lava pools — dangerous, in deepest pockets
    if (caveNoise < 0.15) return T_LAVA_POOL;

    // Obsidian floor — boundary between lava and cave (where lava meets cooler rock)
    if (caveNoise >= 0.15 && caveNoise < 0.18) return T_OBSIDIAN_FLOOR;

    // Open cavern — hot magma cave floor (still dangerous)
    if (caveNoise < 0.20) return T_MAGMA_CAVE;

    // Default: solid basalt
    return T_BASALT;
  },
});
