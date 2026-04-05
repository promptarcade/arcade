
// ============================================================
// SKILL: Woodcutting — chop trees, gather logs
// ============================================================

ResourceRegistry.add({ id: 'oak_log', name: 'Oak Log', color: '#8B6914', category: 'wood', stackMax: 99 });
ResourceRegistry.add({ id: 'branch', name: 'Branch', color: '#6B5010', category: 'wood', stackMax: 99 });
ResourceRegistry.add({ id: 'plank', name: 'Plank', color: '#AA8833', category: 'wood', stackMax: 99 });
ResourceRegistry.add({ id: 'arrow_shaft', name: 'Arrow Shaft', color: '#887744', category: 'wood', stackMax: 99 });

// Helper: get tree size (0=small, 1=medium, 2=large) from world position
function treeSize(wx, wy) {
  var h = ((wx * 374761393 + wy * 668265263) >>> 0);
  return h % 3;
}

var T_TREE_OAK = TileRegistry.add({
  id: 110,
  name: 'oak_tree',
  solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    // Ground first
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx, wy);

    var m = ts / 16;
    var hash = ((wx * 41 + wy * 67) & 0xffff);
    var sway = Math.sin(animTimer * 0.8 + hash * 0.1) * m * 0.5;
    var sz = treeSize(wx, wy); // 0=small, 1=medium, 2=large
    var scale = 0.6 + sz * 0.25; // 0.6, 0.85, 1.1

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(sx + 8*m, sy + 14*m, (4 + sz)*m, (1.5 + sz*0.3)*m, 0, 0, Math.PI*2); ctx.fill();

    // Trunk
    var trunkW = (2 + sz * 0.8) * m;
    var trunkH = (12 + sz * 5) * m;
    var trunkX = sx + 8*m - trunkW/2;
    var trunkY = sy + 14*m - trunkH;
    ctx.fillStyle = '#5a4020';
    ctx.fillRect(trunkX, trunkY, trunkW, trunkH);
    ctx.fillStyle = '#4a3018';
    ctx.fillRect(trunkX, trunkY, trunkW * 0.35, trunkH);
    // Bark marks
    ctx.fillStyle = '#6a5030';
    ctx.fillRect(trunkX + trunkW*0.4, trunkY + trunkH*0.3, m*0.8, m*1.5);
    ctx.fillRect(trunkX + trunkW*0.3, trunkY + trunkH*0.6, m*0.8, m);

    // Canopy
    var canopyY = trunkY - (3 + sz * 2) * m;
    var canopyR = (5 + sz * 3) * m;
    // Dark base
    ctx.fillStyle = '#1a5518';
    ctx.beginPath(); ctx.arc(sx + 8*m + sway, canopyY + canopyR*0.3, canopyR, 0, Math.PI*2); ctx.fill();
    // Main
    ctx.fillStyle = '#2a6a22';
    ctx.beginPath(); ctx.arc(sx + 8*m + sway, canopyY, canopyR * 0.85, 0, Math.PI*2); ctx.fill();
    // Sub-clusters
    ctx.fillStyle = '#3a7a30';
    ctx.beginPath(); ctx.arc(sx + (5-sz*0.5)*m + sway, canopyY - m, canopyR*0.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + (11+sz*0.5)*m + sway, canopyY + m, canopyR*0.45, 0, Math.PI*2); ctx.fill();
    // Highlight
    ctx.fillStyle = '#4a8a3a';
    ctx.beginPath(); ctx.arc(sx + 7*m + sway, canopyY - canopyR*0.3, canopyR*0.3, 0, Math.PI*2); ctx.fill();

    if (sz === 0) {
      // Small tree: sapling details — thin, wispy
      ctx.fillStyle = '#5a9a4a';
      ctx.fillRect(sx + 5*m + sway, canopyY - 2*m, m*0.8, m*2);
    }
  },
  light: { color: '#224400', radius: 0.5, intensity: 0.03 },
});

var T_STUMP = TileRegistry.add({
  id: 111,
  name: 'stump',
  solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx, wy);
    // Small stump — barely visible in the grass
    ctx.fillStyle = '#5a4020';
    ctx.beginPath(); ctx.ellipse(sx + 8*m, sy + 11.5*m, 2*m, 1.2*m, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#8a7050';
    ctx.beginPath(); ctx.ellipse(sx + 8*m, sy + 11*m, 1.8*m, 1*m, 0, 0, Math.PI*2); ctx.fill();
    // Single ring
    ctx.strokeStyle = '#6a5030'; ctx.lineWidth = Math.max(0.5, m*0.3);
    ctx.beginPath(); ctx.ellipse(sx + 8*m, sy + 11*m, 1*m, 0.5*m, 0, 0, Math.PI*2); ctx.stroke();
  },
});

SkillRegistry.add({
  id: 'woodcutting',
  name: 'Woodcutting',
  color: '#8B6914',
  tileIds: [T_TREE_OAK],

  populate: function(tile, biome, wx, wy, rng) {
    if (tile.type === T.WALL || tile.type === T.WATER) return null;
    var density = (biome.density && biome.density.trees) || 0;
    if (density > 0 && rng() < density) {
      var cluster = overworldNoise(wx, wy, 77777, 0.15);
      if (cluster > 0.45) return T_TREE_OAK;
    }
    return null;
  },

  onInteract: function(game, tileType, wx, wy) {
    if (tileType !== T_TREE_OAK) return false;
    var p = game.player;
    var level = PlayerSkills.getLevel(p.skills, 'woodcutting');
    var sz = treeSize(wx, wy); // 0=small, 1=medium, 2=large

    // Bigger trees = more logs, smaller = more branches
    var logCount, branchCount;
    if (sz === 0) { logCount = 1; branchCount = 2 + Math.floor(level / 5); }
    else if (sz === 1) { logCount = 2 + Math.floor(level / 4); branchCount = 1; }
    else { logCount = 3 + Math.floor(level / 3); branchCount = 0; }

    Bag.add(p.bag, 'oak_log', logCount);
    if (branchCount) Bag.add(p.bag, 'branch', branchCount);

    var result = PlayerSkills.addXp(p.skills, 'woodcutting', 3 + sz * 3);

    Overworld.setTile(wx, wy, T_STUMP);

    SFX.hit();
    var msg = '+' + logCount + ' Log' + (logCount > 1 ? 's' : '');
    if (branchCount) msg += ', +' + branchCount + ' Branch' + (branchCount > 1 ? 'es' : '');
    game.addLog(msg, '#8B6914');
    game.addFloating(wx, wy, '+' + logCount + ' Log', '#8B6914');

    if (result.leveled) {
      game.addLog('Woodcutting level ' + result.level + '!', '#ffcc44');
      SFX.stairs();
    }
    return true;
  },

  recipes: [
    { skill: 'woodcutting', level: 1, name: 'Plank', input: { oak_log: 2 }, output: { plank: 3 } },
    { skill: 'woodcutting', level: 3, name: 'Arrow Shaft', input: { branch: 2 }, output: { arrow_shaft: 5 } },
  ],
});

RecipeRegistry.addAll(SkillRegistry.get('woodcutting').recipes);
