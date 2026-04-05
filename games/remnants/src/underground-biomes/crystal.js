
// ============================================================
// UNDERGROUND BIOME: Crystal Caverns — depth 7-8, glowing crystals, obsidian, bioluminescence
// ============================================================

// Register obsidian resource
ResourceRegistry.add({ id: 'obsidian', name: 'Obsidian', color: '#222233', category: 'mineral', stackMax: 50 });

// --- Crystal Rock (340): solid dark stone with glowing crystal veins ---
var T_CRYSTAL_ROCK = TileRegistry.add({
  id: 340, name: 'crystal_rock', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 7331 + (wy||0) * 9127) >>> 0);
    // Dark stone base
    ctx.fillStyle = shadeHex('#2a2a35', ((h % 5) - 2) * 3);
    ctx.fillRect(sx, sy, ts, ts);
    // Darker cracks
    ctx.fillStyle = shadeHex('#1e1e28', -5);
    ctx.fillRect(sx + ((h>>2)%8+1)*m, sy + ((h>>4)%10+2)*m, 3*m, 1*m);
    ctx.fillRect(sx + ((h>>6)%6+5)*m, sy + ((h>>8)%8+4)*m, 1*m, 3*m);
    // Glowing crystal veins — pulsing with animTimer
    var pulse = 0.5 + 0.5 * Math.sin(animTimer * 1.8 + (wx||0) * 0.7 + (wy||0) * 0.3);
    var veinColors = ['#aa66ff', '#6688ff', '#66ccaa'];
    var vc = veinColors[h % 3];
    ctx.globalAlpha = 0.4 + 0.3 * pulse;
    ctx.fillStyle = vc;
    // Vein 1 — diagonal
    ctx.fillRect(sx + ((h>>3)%6+2)*m, sy + ((h>>5)%4+1)*m, 4*m, 1*m);
    ctx.fillRect(sx + ((h>>3)%6+4)*m, sy + ((h>>5)%4+2)*m, 3*m, 1*m);
    // Vein 2 — another angle
    ctx.fillRect(sx + ((h>>7)%5+1)*m, sy + ((h>>9)%5+8)*m, 5*m, 1*m);
    ctx.fillRect(sx + ((h>>7)%5+2)*m, sy + ((h>>9)%5+9)*m, 3*m, 1*m);
    // Vein 3 — small accent
    if ((h % 3) === 0) {
      ctx.fillRect(sx + ((h>>11)%8+3)*m, sy + ((h>>13)%4+5)*m, 2*m, 2*m);
    }
    ctx.globalAlpha = 1;
  },
  light: { color: '#aa66ff', radius: 1, intensity: 0.1 },
});

// --- Crystal Cave (341): non-solid open cavern with crystal floor shards ---
var T_CRYSTAL_CAVE = TileRegistry.add({
  id: 341, name: 'crystal_cave', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 4271 + (wy||0) * 6883) >>> 0);
    // Dark cave floor
    ctx.fillStyle = shadeHex('#1a1a24', ((h % 5) - 2) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Subtle floor texture
    ctx.fillStyle = shadeHex('#222230', 4);
    ctx.fillRect(sx + ((h>>2)%8+1)*m, sy + ((h>>4)%8+2)*m, 3*m, 2*m);
    ctx.fillRect(sx + ((h>>6)%6+7)*m, sy + ((h>>8)%6+8)*m, 2*m, 2*m);
    // Crystal shards on floor — colour shifts with animTimer
    var shardPulse = 0.3 + 0.3 * Math.sin(animTimer * 1.2 + (wx||0) * 0.9);
    var shardColors = ['#9955ee', '#5577dd', '#55bbaa'];
    ctx.globalAlpha = 0.3 + 0.25 * shardPulse;
    // Shard 1
    var sc1 = shardColors[h % 3];
    ctx.fillStyle = sc1;
    ctx.fillRect(sx + ((h>>3)%8+2)*m, sy + ((h>>5)%6+6)*m, 2*m, 1*m);
    ctx.fillRect(sx + ((h>>3)%8+2)*m, sy + ((h>>5)%6+5)*m, 1*m, 1*m);
    // Shard 2
    var sc2 = shardColors[(h>>4) % 3];
    ctx.fillStyle = sc2;
    ctx.fillRect(sx + ((h>>7)%6+8)*m, sy + ((h>>9)%5+9)*m, 1*m, 2*m);
    // Shard 3 — tiny glint
    if ((h % 3) < 2) {
      ctx.fillStyle = '#ccaaff';
      ctx.fillRect(sx + ((h>>10)%10+3)*m, sy + ((h>>12)%8+4)*m, 1*m, 1*m);
    }
    ctx.globalAlpha = 1;
  },
  light: { color: '#8844cc', radius: 2, intensity: 0.2 },
});

// --- Crystal Formation (342): solid, large crystal cluster ---
var T_CRYSTAL_FORMATION = TileRegistry.add({
  id: 342, name: 'crystal_formation', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 8219 + (wy||0) * 3571) >>> 0);
    // Base dark rock beneath
    ctx.fillStyle = '#222230';
    ctx.fillRect(sx, sy, ts, ts);
    // Pick crystal colour family from hash
    var palettes = [
      ['#7733cc', '#9955ee', '#bb88ff', '#ddbbff'], // purple
      ['#3355aa', '#5577cc', '#7799ee', '#aaccff'], // blue
      ['#228866', '#33aa88', '#55ccaa', '#88eedd'], // green
    ];
    var pal = palettes[h % 3];
    var pulse = 0.6 + 0.4 * Math.sin(animTimer * 2.0 + (wx||0) * 0.5);
    ctx.globalAlpha = 0.7 + 0.3 * pulse;
    // Large central crystal — tall angular shape
    ctx.fillStyle = pal[1];
    ctx.beginPath();
    ctx.moveTo(sx + 6*m, sy + 15*m);
    ctx.lineTo(sx + 8*m, sy + 2*m);
    ctx.lineTo(sx + 10*m, sy + 15*m);
    ctx.fill();
    // Highlight edge
    ctx.fillStyle = pal[2];
    ctx.beginPath();
    ctx.moveTo(sx + 7*m, sy + 14*m);
    ctx.lineTo(sx + 8*m, sy + 3*m);
    ctx.lineTo(sx + 9*m, sy + 14*m);
    ctx.fill();
    // Left smaller crystal
    ctx.fillStyle = pal[0];
    ctx.beginPath();
    ctx.moveTo(sx + 2*m, sy + 15*m);
    ctx.lineTo(sx + 4*m, sy + 6*m);
    ctx.lineTo(sx + 5*m, sy + 15*m);
    ctx.fill();
    // Right smaller crystal
    ctx.fillStyle = pal[1];
    ctx.beginPath();
    ctx.moveTo(sx + 11*m, sy + 15*m);
    ctx.lineTo(sx + 13*m, sy + 5*m);
    ctx.lineTo(sx + 14*m, sy + 15*m);
    ctx.fill();
    // Tiny accent crystal
    ctx.fillStyle = pal[3];
    ctx.beginPath();
    ctx.moveTo(sx + ((h>>2)%3+4)*m, sy + 15*m);
    ctx.lineTo(sx + ((h>>2)%3+5)*m, sy + 10*m);
    ctx.lineTo(sx + ((h>>2)%3+6)*m, sy + 15*m);
    ctx.fill();
    // Bright tip sparkle
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.4 + 0.4 * pulse;
    ctx.fillRect(sx + 8*m - 0.5*m, sy + 2*m, 1*m, 1*m);
    ctx.globalAlpha = 1;
  },
  onInteract: function(game, wx, wy) {
    var check = checkTool(game.player, 'mining');
    if (!check.allowed) {
      GameUtils.addLog(check.message, '#cc8844');
      return;
    }
    useTool(game.player, check.toolId);
    Underground.setTile(wx, wy, T_CRYSTAL_CAVE);
    var crystalTypes = ['crystal_void', 'crystal_lightning'];
    var drop = crystalTypes[Math.floor(Math.random() * crystalTypes.length)];
    var dropName = drop === 'crystal_void' ? 'Shadow Crystal' : 'Storm Crystal';
    Bag.add(game.player.bag, drop, 1);
    GameUtils.addLog('+' + dropName, '#aa66ff');
    GameUtils.addFloating(wx, wy, '+' + dropName, '#aa66ff');
    PlayerSkills.addXp(game.player.skills, 'mining', 10);
    SFX.mine();
  },
  light: { color: '#aa44ff', radius: 3, intensity: 0.35 },
});

// --- Glowing Fungus (343): non-solid, bioluminescent mushrooms ---
var T_GLOWING_FUNGUS = TileRegistry.add({
  id: 343, name: 'glowing_fungus', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 6143 + (wy||0) * 2917) >>> 0);
    // Cave floor base
    ctx.fillStyle = shadeHex('#1a1a24', ((h % 5) - 2) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Glow pulse
    var pulse = 0.5 + 0.5 * Math.sin(animTimer * 1.5 + (wx||0) * 1.1 + (wy||0) * 0.8);
    // Ground glow halo
    ctx.globalAlpha = 0.1 + 0.1 * pulse;
    ctx.fillStyle = '#44ffaa';
    ctx.beginPath();
    ctx.arc(sx + 8*m, sy + 12*m, 5*m, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Mushroom stems
    ctx.fillStyle = shadeHex('#227755', -8);
    ctx.fillRect(sx + 4*m, sy + 10*m, 1*m, 4*m);
    ctx.fillRect(sx + 9*m, sy + 9*m, 1*m, 5*m);
    ctx.fillRect(sx + 12*m, sy + 11*m, 1*m, 3*m);
    // Mushroom caps — glowing
    ctx.globalAlpha = 0.6 + 0.3 * pulse;
    ctx.fillStyle = '#33eebb';
    ctx.beginPath();
    ctx.arc(sx + 4.5*m, sy + 9.5*m, 2*m, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#44ffaa';
    ctx.beginPath();
    ctx.arc(sx + 9.5*m, sy + 8.5*m, 2.5*m, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#55ddcc';
    ctx.beginPath();
    ctx.arc(sx + 12.5*m, sy + 10.5*m, 1.5*m, Math.PI, 0);
    ctx.fill();
    // Bright spots on caps
    ctx.fillStyle = '#aaffee';
    ctx.globalAlpha = 0.4 + 0.4 * pulse;
    ctx.fillRect(sx + 4*m, sy + 9*m, 1*m, 1*m);
    ctx.fillRect(sx + 9*m, sy + 8*m, 1*m, 1*m);
    ctx.globalAlpha = 1;
    // Spores floating upward
    if ((h % 2) === 0) {
      var sporeY = ((animTimer * 3 + (h>>3)) % 8);
      ctx.globalAlpha = 0.3 + 0.2 * pulse;
      ctx.fillStyle = '#88ffcc';
      ctx.fillRect(sx + ((h>>4)%6+4)*m, sy + (6 - sporeY)*m, 1*m, 1*m);
      ctx.fillRect(sx + ((h>>6)%5+7)*m, sy + (8 - sporeY)*m, 1*m, 1*m);
      ctx.globalAlpha = 1;
    }
  },
  onInteract: function(game, wx, wy) {
    Underground.setTile(wx, wy, T_CRYSTAL_CAVE);
    var count = 1 + Math.floor(Math.random() * 2);
    Bag.add(game.player.bag, 'meadow_herb', count);
    GameUtils.addLog('+' + count + ' Cave Herb', '#44ffaa');
    GameUtils.addFloating(wx, wy, '+' + count + ' Herb', '#44ffaa');
    PlayerSkills.addXp(game.player.skills, 'herbalism', 5);
    SFX.step();
  },
  light: { color: '#44ffaa', radius: 2, intensity: 0.25 },
});

// --- Obsidian (344): solid, pitch black glossy surface ---
var T_OBSIDIAN = TileRegistry.add({
  id: 344, name: 'obsidian', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 5347 + (wy||0) * 7901) >>> 0);
    // Pitch black base
    ctx.fillStyle = shadeHex('#111118', ((h % 3) - 1) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Very dark body
    ctx.fillStyle = '#0d0d14';
    ctx.fillRect(sx + 1*m, sy + 1*m, 14*m, 14*m);
    // Sharp reflection highlights — glossy sheen
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#6666aa';
    // Diagonal reflection band
    ctx.beginPath();
    ctx.moveTo(sx + ((h>>2)%4+1)*m, sy);
    ctx.lineTo(sx + ((h>>2)%4+5)*m, sy);
    ctx.lineTo(sx, sy + ((h>>4)%4+5)*m);
    ctx.lineTo(sx, sy + ((h>>4)%4+1)*m);
    ctx.fill();
    // Secondary smaller reflection
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#8888cc';
    ctx.fillRect(sx + ((h>>6)%6+6)*m, sy + ((h>>8)%4+8)*m, 4*m, 1*m);
    ctx.fillRect(sx + ((h>>6)%6+7)*m, sy + ((h>>8)%4+9)*m, 2*m, 1*m);
    // Sharp white specular point
    ctx.globalAlpha = 0.25 + 0.1 * Math.sin(animTimer * 0.8 + (wx||0));
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx + ((h>>10)%8+4)*m, sy + ((h>>12)%6+3)*m, 1*m, 1*m);
    ctx.globalAlpha = 1;
    // Edge highlight
    ctx.fillStyle = 'rgba(80,80,120,0.08)';
    ctx.fillRect(sx, sy, ts, 1*m);
    ctx.fillRect(sx, sy, 1*m, ts);
  },
  onInteract: function(game, wx, wy) {
    var check = checkTool(game.player, 'mining');
    if (!check.allowed) {
      GameUtils.addLog(check.message, '#cc8844');
      return;
    }
    useTool(game.player, check.toolId);
    Underground.setTile(wx, wy, T_CRYSTAL_CAVE);
    Bag.add(game.player.bag, 'obsidian', 1);
    GameUtils.addLog('+Obsidian', '#8888cc');
    GameUtils.addFloating(wx, wy, '+Obsidian', '#8888cc');
    PlayerSkills.addXp(game.player.skills, 'mining', 12);
    SFX.mine();
  },
});

// --- Crystal Pool (345): non-solid, luminescent water ---
var T_CRYSTAL_POOL = TileRegistry.add({
  id: 345, name: 'crystal_pool', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 9413 + (wy||0) * 2731) >>> 0);
    // Deep purple-blue water base
    ctx.fillStyle = shadeHex('#1a1540', ((h % 5) - 2) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Water body — slightly brighter
    ctx.fillStyle = '#221a55';
    ctx.fillRect(sx + 1*m, sy + 1*m, 14*m, 14*m);
    // Animated surface ripples
    var wave1 = Math.sin(animTimer * 2.2 + (wx||0) * 0.6) * 0.15;
    var wave2 = Math.sin(animTimer * 1.6 + (wy||0) * 0.8 + 1.5) * 0.12;
    // Bright shimmer bands
    ctx.globalAlpha = 0.25 + wave1;
    ctx.fillStyle = '#6644cc';
    ctx.fillRect(sx + 2*m, sy + ((h>>3)%4+3)*m, 10*m, 1.5*m);
    ctx.globalAlpha = 0.2 + wave2;
    ctx.fillStyle = '#7755dd';
    ctx.fillRect(sx + 3*m, sy + ((h>>5)%4+8)*m, 8*m, 1.5*m);
    // Crystal reflections in the water
    ctx.globalAlpha = 0.15 + 0.15 * Math.sin(animTimer * 3 + (h>>7));
    ctx.fillStyle = '#aa88ff';
    ctx.fillRect(sx + ((h>>2)%6+4)*m, sy + ((h>>4)%6+4)*m, 2*m, 2*m);
    ctx.fillRect(sx + ((h>>6)%5+2)*m, sy + ((h>>8)%4+9)*m, 1*m, 1*m);
    // Bright surface sparkle
    var sparklePhase = (animTimer * 4 + (h>>10)) % 6.28;
    if (sparklePhase < 1.5) {
      ctx.globalAlpha = 0.5 * (1 - sparklePhase / 1.5);
      ctx.fillStyle = '#ddccff';
      ctx.fillRect(sx + ((h>>9)%8+4)*m, sy + ((h>>11)%8+4)*m, 1*m, 1*m);
    }
    ctx.globalAlpha = 1;
  },
  light: { color: '#6644cc', radius: 2.5, intensity: 0.3 },
});

// Register the biome
UndergroundBiomeRegistry.add({
  id: 'crystal',
  name: 'Crystal Caverns',
  minDepth: 7,
  accent: '#aa66ff',

  // Ore table — what drops when mining generic rock in this biome
  oreTable: [
    { id: 'stone', name: 'Stone', chance: 0.15, min: 1, max: 2, color: '#888' },
    { id: 'gold_ore', name: 'Gold Ore', chance: 0.08, min: 1, max: 1, color: '#ffcc33' },
    { id: 'gem', name: 'Gem', chance: 0.10, min: 1, max: 1, color: '#44ddff' },
    { id: 'crystal_fire', name: 'Fire Crystal', chance: 0.08, min: 1, max: 1, color: '#ff6622' },
    { id: 'crystal_ice', name: 'Ice Crystal', chance: 0.08, min: 1, max: 1, color: '#66ccff' },
    { id: 'crystal_lightning', name: 'Storm Crystal', chance: 0.08, min: 1, max: 1, color: '#ffff44' },
    { id: 'crystal_void', name: 'Shadow Crystal', chance: 0.08, min: 1, max: 1, color: '#aa44ff' },
    { id: 'obsidian', name: 'Obsidian', chance: 0.05, min: 1, max: 1, color: '#222233' },
    // 0.30 chance = nothing extra
  ],

  // Generate tile type for a world position
  generate: function(wx, wy, depth, seed, rng) {
    // Cavern noise — crystal caverns are more open (lower threshold)
    var caveNoise = overworldFbm(wx, wy, seed + 70000, 3, 0.055);

    // Open cavern — threshold 0.32 for more open space
    if (caveNoise < 0.32) {
      // Crystal pools in the most open areas (center of caverns)
      if (caveNoise < 0.15) {
        var poolNoise = overworldNoise(wx, wy, seed + 71000, 0.08);
        if (poolNoise < 0.35) return T_CRYSTAL_POOL;
      }

      // Glowing fungus scattered in open areas — 5% chance
      var fungusRoll = overworldNoise(wx, wy, seed + 72000, 0.15);
      if (fungusRoll > 0.95) return T_GLOWING_FUNGUS;

      return T_CRYSTAL_CAVE;
    }

    // Obsidian in tight spaces — narrow band between solid and cave
    if (caveNoise > 0.75 && caveNoise < 0.78) return T_OBSIDIAN;

    // Crystal formations — special noise for clusters
    var specialNoise = overworldNoise(wx, wy, seed + 73000, 0.07);
    if (specialNoise > 0.88) return T_CRYSTAL_FORMATION;

    // Default solid tile is crystal rock
    return T_CRYSTAL_ROCK;
  },
});
