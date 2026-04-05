
// ============================================================
// UNDERGROUND BIOME: Soil — depth 1-2, soft ground, clay, common ores
// ============================================================

// Soil-specific tiles
var T_SOIL = TileRegistry.add({
  id: 310, name: 'soil', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 3917 + (wy||0) * 5821) >>> 0);
    ctx.fillStyle = shadeHex('#6a5535', ((h % 7) - 3) * 3);
    ctx.fillRect(sx, sy, ts, ts);
    // Dirt texture — organic bits
    ctx.fillStyle = shadeHex('#6a5535', -12);
    ctx.fillRect(sx + ((h>>2)%8+2)*m, sy + ((h>>4)%8+3)*m, 2*m, 1.5*m);
    ctx.fillRect(sx + ((h>>6)%7+5)*m, sy + ((h>>8)%6+6)*m, 1.5*m, 2*m);
    // Small roots
    if ((h % 4) === 0) {
      ctx.strokeStyle = '#5a4525';
      ctx.lineWidth = Math.max(0.5, m * 0.4);
      ctx.beginPath();
      ctx.moveTo(sx + ((h>>3)%10+2)*m, sy + 1*m);
      ctx.lineTo(sx + ((h>>5)%8+4)*m, sy + 6*m);
      ctx.stroke();
    }
  },
  onInteract: function(game, wx, wy) {
    // Soil is easier to mine — no pickaxe needed, bare hands work
    Underground.setTile(wx, wy, T_MINE_FLOOR);
    Bag.add(game.player.bag, 'clay', 1 + Math.floor(Math.random() * 2));
    GameUtils.addLog('+Clay', '#aa8866');
    GameUtils.addFloating(wx, wy, '+Clay', '#aa8866');
    PlayerSkills.addXp(game.player.skills, 'gathering', 2);
    SFX.step();
  },
});

var T_CLAY_DEPOSIT = TileRegistry.add({
  id: 311, name: 'clay_deposit', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 2713 + (wy||0) * 4519) >>> 0);
    // Clay base — reddish brown
    ctx.fillStyle = shadeHex('#8a6040', ((h % 7) - 3) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Clay bands
    ctx.fillStyle = shadeHex('#9a7050', 8);
    ctx.fillRect(sx, sy + 4*m, ts, 2*m);
    ctx.fillRect(sx, sy + 10*m, ts, 2*m);
    // Wet sheen
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(sx + 2*m, sy + 3*m, 8*m, 1*m);
  },
  onInteract: function(game, wx, wy) {
    Underground.setTile(wx, wy, T_MINE_FLOOR);
    var count = 3 + Math.floor(Math.random() * 3);
    Bag.add(game.player.bag, 'clay', count);
    GameUtils.addLog('+' + count + ' Clay', '#aa8866');
    GameUtils.addFloating(wx, wy, '+' + count + ' Clay', '#aa8866');
    PlayerSkills.addXp(game.player.skills, 'gathering', 4);
    SFX.step();
  },
});

var T_UNDERGROUND_WATER = TileRegistry.add({
  id: 312, name: 'underground_pool', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 5119 + (wy||0) * 3847) >>> 0);
    // Dark water
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(sx, sy, ts, ts);
    // Surface shimmer
    var pulse = Math.sin(animTimer * 2 + (wx||0) * 0.5) * 0.1;
    ctx.fillStyle = 'rgba(60,100,140,' + (0.2 + pulse).toFixed(2) + ')';
    ctx.fillRect(sx + 2*m, sy + ((h>>3)%6+3)*m, 8*m, 1.5*m);
    ctx.fillRect(sx + 4*m, sy + ((h>>5)%5+8)*m, 6*m, 1*m);
  },
  light: { color: '#335577', radius: 1, intensity: 0.1 },
});

// Register the biome
UndergroundBiomeRegistry.add({
  id: 'soil',
  name: 'Topsoil',
  minDepth: 1,
  accent: '#8a6a3a',
  ambientColor: '#050403',

  // Ore table — what drops when mining rock in this biome
  oreTable: [
    { id: 'stone', name: 'Stone', chance: 0.40, min: 1, max: 2, color: '#888' },
    { id: 'clay', name: 'Clay', chance: 0.25, min: 1, max: 3, color: '#aa8866' },
    { id: 'flint', name: 'Flint', chance: 0.15, min: 1, max: 1, color: '#666655' },
    { id: 'copper_ore', name: 'Copper Ore', chance: 0.10, min: 1, max: 1, color: '#cc7744' },
    { id: 'worm', name: 'Worm', chance: 0.05, min: 1, max: 2, color: '#aa6655' },
    // 0.05 chance = nothing extra (just stone from the rock interaction)
  ],

  // Generate tile type for a world position
  generate: function(wx, wy, depth, seed, rng) {
    // Natural cavern noise — creates pockets of open space
    var caveNoise = overworldFbm(wx, wy, seed + 20000, 3, 0.08);

    // Cavern threshold — soil has small scattered pockets
    if (caveNoise < 0.22) return T_MINE_FLOOR; // open cavern

    // Underground water pools
    var waterNoise = overworldNoise(wx, wy, seed + 30000, 0.06);
    if (waterNoise < 0.15 && caveNoise < 0.30) return T_UNDERGROUND_WATER;

    // Clay deposits
    var clayNoise = overworldNoise(wx, wy, seed + 40000, 0.1);
    if (clayNoise > 0.85) return T_CLAY_DEPOSIT;

    // Mostly soil (softer than rock)
    var soilChance = overworldNoise(wx, wy, seed + 50000, 0.05);
    if (soilChance > 0.3) return T_SOIL;

    // Hard rock patches
    return T_ROCK;
  },
});
