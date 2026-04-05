
// ============================================================
// SKILL: Mining — ore veins, smelting, gems
// ============================================================

// Shared 3D rock face renderer — used by all ore tiles
function drawRockFace3D(ctx, sx, sy, ts, baseColor) {
  var m = ts / 16;
  ctx.fillStyle = baseColor; ctx.fillRect(sx, sy, ts, ts);
  ctx.fillStyle = shadeHex(baseColor, 20); ctx.fillRect(sx, sy, ts, Math.round(ts*0.28));
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(sx, sy, ts, Math.max(1, ts*0.05));
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(sx, sy+ts-Math.round(ts*0.12), ts, Math.round(ts*0.12));
  ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(sx+ts-2, sy, 2, ts);
  ctx.strokeStyle = shadeHex(baseColor, -30); ctx.lineWidth = 1; ctx.strokeRect(sx+0.5, sy+0.5, ts-1, ts-1);
}

ResourceRegistry.add({ id: 'copper_ore', name: 'Copper Ore', color: '#c07a4a', category: 'ore', stackMax: 99 });
ResourceRegistry.add({ id: 'iron_ore',   name: 'Iron Ore',   color: '#7a8899', category: 'ore', stackMax: 99 });
ResourceRegistry.add({ id: 'gold_ore',   name: 'Gold Ore',   color: '#ccaa22', category: 'ore', stackMax: 99 });
ResourceRegistry.add({ id: 'copper_bar', name: 'Copper Bar', color: '#cc8844', category: 'bar', stackMax: 99 });
ResourceRegistry.add({ id: 'iron_bar',   name: 'Iron Bar',   color: '#8899aa', category: 'bar', stackMax: 99 });
ResourceRegistry.add({ id: 'gold_bar',   name: 'Gold Bar',   color: '#ddbb33', category: 'bar', stackMax: 99 });
ResourceRegistry.add({ id: 'gem',        name: 'Gem',        color: '#66ddff', category: 'gem', stackMax: 20 });
ResourceRegistry.add({ id: 'gem_ring',   name: 'Gem Ring',   color: '#88eeff', category: 'jewelry', stackMax: 10 });

// ============================================================
// TILE: Rubble — left behind after mining a vein
// ============================================================
var T_RUBBLE = TileRegistry.add({
  id: 173,
  name: 'rubble',
  solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx, wy);
    var m = ts / 16;
    var hash = (((wx || 0) * 6271 + (wy || 0) * 3541) >>> 0);
    // Several irregular broken rock chunks scattered low in the tile
    ctx.fillStyle = '#5a5a58';
    ctx.beginPath(); ctx.ellipse(sx + 6*m, sy + 11*m, 2.5*m, 1.3*m, -0.2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#4a4a48';
    ctx.beginPath(); ctx.ellipse(sx + 10*m, sy + 12*m, 1.8*m, 1*m, 0.3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#686866';
    ctx.beginPath(); ctx.ellipse(sx + 8*m, sy + 10*m, 1.2*m, 0.8*m, 0.1, 0, Math.PI*2); ctx.fill();
    // Highlight edges
    ctx.fillStyle = '#7a7a78';
    ctx.fillRect(sx + 5*m, sy + 10.2*m, 1.5*m, 0.6*m);
    ctx.fillRect(sx + 9.5*m, sy + 11.2*m, 1*m, 0.5*m);
    // Tiny pebbles
    ctx.fillStyle = '#545452';
    ctx.fillRect(sx + (3 + hash % 5)*m, sy + 12*m, 0.8*m, 0.8*m);
    ctx.fillRect(sx + (9 + (hash >> 3) % 4)*m, sy + 13*m, 0.6*m, 0.6*m);
  },
});

// ============================================================
// TILE: Copper Vein (id 170) — brownish-orange specks in grey rock
// ============================================================
var T_COPPER_VEIN = TileRegistry.add({
  id: 170,
  name: 'copper_vein',
  solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var hash = (((wx || 0) * 5171 + (wy || 0) * 3761) >>> 0);

    drawRockFace3D(ctx, sx, sy, ts, '#6a6460');
    // Copper seams — raised with highlight
    ctx.fillStyle = '#b86a30';
    ctx.fillRect(sx+4*m,sy+5*m,3*m,1.5*m); ctx.fillRect(sx+8*m,sy+8*m,4*m,1.2*m); ctx.fillRect(sx+2*m,sy+11*m,2.5*m,1*m);
    ctx.fillStyle = '#d08040';
    ctx.fillRect(sx+4*m,sy+5*m,3*m,0.5*m); ctx.fillRect(sx+8*m,sy+8*m,4*m,0.4*m);

    // Copper specks — brighter highlights on the seams
    ctx.fillStyle = '#d4823c';
    ctx.fillRect(sx + 5*m, sy + 5*m, 1.2*m, 0.8*m);
    ctx.fillRect(sx + 9.5*m, sy + 8*m, 1.5*m, 0.7*m);
    ctx.fillRect(sx + 2.5*m, sy + 11*m, 1*m, 0.6*m);
    ctx.fillRect(sx + 11*m, sy + 12*m, 1.2*m, 0.6*m);

    // Bright copper glint dots — scattered
    ctx.fillStyle = '#e8a060';
    ctx.fillRect(sx + 5.5*m, sy + 4.8*m, 0.7*m, 0.7*m);
    ctx.fillRect(sx + 10*m, sy + 7.8*m, 0.6*m, 0.6*m);
    ctx.fillRect(sx + (3 + hash % 6)*m, sy + (6 + (hash >> 3) % 5)*m, 0.6*m, 0.6*m);

    // Top edge highlight (light from above)
    ctx.fillStyle = '#807870';
    ctx.fillRect(sx, sy, ts, 1.5*m);
    // Left shadow edge
    ctx.fillStyle = '#3e3834';
    ctx.fillRect(sx, sy, 1.5*m, ts);
  },
});

// ============================================================
// TILE: Iron Vein (id 171) — dark grey-blue specks in rock
// ============================================================
var T_IRON_VEIN = TileRegistry.add({
  id: 171,
  name: 'iron_vein',
  solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var hash = (((wx || 0) * 4637 + (wy || 0) * 6143) >>> 0);

    drawRockFace3D(ctx, sx, sy, ts, '#525860');
    // Iron ore bands
    ctx.fillStyle = '#404650';
    ctx.fillRect(sx, sy+6*m, ts, 1.2*m); ctx.fillRect(sx, sy+12*m, ts, 0.8*m);
    ctx.stroke();

    // Iron ore seams — blue-grey metallic streaks
    ctx.fillStyle = '#5a6878';
    ctx.fillRect(sx + 3*m, sy + 4*m, 4*m, 1.2*m);
    ctx.fillRect(sx + 9*m, sy + 7*m, 3.5*m, 1.4*m);
    ctx.fillRect(sx + 1*m, sy + 10*m, 3*m, 1*m);
    ctx.fillRect(sx + 8*m, sy + 13*m, 5*m, 0.8*m);

    // Metallic sheen on ore — lighter blue-grey
    ctx.fillStyle = '#7a8898';
    ctx.fillRect(sx + 3.5*m, sy + 4*m, 1.8*m, 0.8*m);
    ctx.fillRect(sx + 10*m, sy + 7*m, 1.5*m, 0.9*m);
    ctx.fillRect(sx + 1.5*m, sy + 10*m, 1.2*m, 0.6*m);
    ctx.fillRect(sx + 9*m, sy + 13*m, 1.8*m, 0.5*m);

    // Iron glint specks
    ctx.fillStyle = '#aab8c8';
    ctx.fillRect(sx + 4*m, sy + 3.8*m, 0.6*m, 0.6*m);
    ctx.fillRect(sx + 10.5*m, sy + 6.8*m, 0.6*m, 0.6*m);
    ctx.fillRect(sx + (2 + hash % 7)*m, sy + (8 + (hash >> 4) % 4)*m, 0.5*m, 0.5*m);

    // Edges
    ctx.fillStyle = '#686e76';
    ctx.fillRect(sx, sy, ts, 1.5*m);
    ctx.fillStyle = '#282e36';
    ctx.fillRect(sx, sy, 1.5*m, ts);
  },
});

// ============================================================
// TILE: Gold Vein (id 172) — yellow-gold specks in dark rock
// ============================================================
var T_GOLD_VEIN = TileRegistry.add({
  id: 172,
  name: 'gold_vein',
  solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var hash = (((wx || 0) * 7919 + (wy || 0) * 5237) >>> 0);
    // Gentle shimmer on gold using animTimer
    var glimmer = Math.sin(animTimer * 2.5 + (wx * 1.3 + wy * 0.9)) * 0.5 + 0.5;

    drawRockFace3D(ctx, sx, sy, ts, '#3a3630');

    // Crack lines
    ctx.strokeStyle = '#201e1c';
    ctx.lineWidth = Math.max(0.5, m * 0.4);
    ctx.beginPath();
    ctx.moveTo(sx + 4*m, sy + 1*m);
    ctx.lineTo(sx + 2*m, sy + 9*m);
    ctx.lineTo(sx + 4*m, sy + 15*m);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + 10*m, sy + 3*m);
    ctx.lineTo(sx + 12*m, sy + 8*m);
    ctx.lineTo(sx + 10*m, sy + 12*m);
    ctx.stroke();

    // Gold seams — primary veins
    ctx.fillStyle = '#9a7a18';
    ctx.fillRect(sx + 5*m, sy + 3*m, 3.5*m, 0.9*m);
    ctx.fillRect(sx + 2*m, sy + 8*m, 2.5*m, 1.1*m);
    ctx.fillRect(sx + 9*m, sy + 6*m, 3*m, 0.8*m);
    ctx.fillRect(sx + 7*m, sy + 12*m, 4.5*m, 1*m);
    ctx.fillRect(sx + 1*m, sy + 13*m, 2*m, 0.7*m);

    // Brighter gold on seams
    ctx.fillStyle = '#ccaa22';
    ctx.fillRect(sx + 5.5*m, sy + 3*m, 2*m, 0.7*m);
    ctx.fillRect(sx + 2.5*m, sy + 8*m, 1.3*m, 0.8*m);
    ctx.fillRect(sx + 9.5*m, sy + 6*m, 1.5*m, 0.6*m);
    ctx.fillRect(sx + 8*m, sy + 12*m, 2.5*m, 0.7*m);

    // Glimmering gold specks — animate slightly
    var g1 = Math.round(glimmer * 20);
    ctx.fillStyle = 'rgb(' + (220 + g1) + ',' + (185 + g1) + ',60)';
    ctx.fillRect(sx + 6*m, sy + 2.8*m, 0.8*m, 0.8*m);
    ctx.fillRect(sx + 10*m, sy + 5.8*m, 0.7*m, 0.7*m);
    ctx.fillRect(sx + 8.5*m, sy + 11.8*m, 0.8*m, 0.8*m);
    ctx.fillRect(sx + (3 + hash % 6)*m, sy + (5 + (hash >> 4) % 5)*m, 0.7*m, 0.7*m);

    // Extra small glint dots
    ctx.fillStyle = '#ffee88';
    ctx.fillRect(sx + 6.3*m, sy + 2.9*m, 0.4*m, 0.4*m);
    ctx.fillRect(sx + 9.2*m, sy + 11.9*m, 0.4*m, 0.4*m);

    // Edges
    ctx.fillStyle = '#504c48';
    ctx.fillRect(sx, sy, ts, 1.5*m);
    ctx.fillStyle = '#18160e';
    ctx.fillRect(sx, sy, 1.5*m, ts);
  },
  light: { color: '#443300', radius: 0.4, intensity: 0.04 },
});

// ============================================================
// SKILL: Mining
// ============================================================
SkillRegistry.add({
  id: 'mining',
  name: 'Mining',
  color: '#8888aa',
  tileIds: [T_COPPER_VEIN, T_IRON_VEIN, T_GOLD_VEIN],

  populate: function(tile, biome, wx, wy, rng) {
    if (tile.type === T.WALL || tile.type === T.WATER) return null;

    // Ore only near mountains — high elevation, not in lush biomes
    var elevation = tile.height || overworldNoise(wx, wy, 11223, 0.06);
    if (elevation < 0.65) return null;
    if (biome.id === 'grassland' || biome.id === 'swamp') return null;

    // Tight vein clustering — rare seams
    var veinBody = Math.sin(wx * 0.31 + wy * 0.19 + overworldNoise(wx, wy, 88112, 0.04) * 6.28) * 0.5 + 0.5;
    var veinCross = overworldNoise(wx * 0.7, wy * 1.3, 55443, 0.08);

    // Gold — extremely rare, highest peaks
    if (elevation > 0.73 && veinBody > 0.82 && veinCross > 0.65) {
      if (rng() < 0.15) return T_GOLD_VEIN;
    }
    // Iron — rare, high elevation
    if (elevation > 0.68 && veinBody > 0.72 && veinCross > 0.58) {
      if (rng() < 0.2) return T_IRON_VEIN;
    }
    // Copper — uncommon, mountain edges
    if (veinBody > 0.65 && veinCross > 0.5) {
      if (rng() < 0.15) return T_COPPER_VEIN;
    }

    return null;
  },

  onInteract: function(game, tileType, wx, wy) {
    if (tileType !== T_COPPER_VEIN && tileType !== T_IRON_VEIN && tileType !== T_GOLD_VEIN) return false;

    var p = game.player;
    var level = PlayerSkills.getLevel(p.skills, 'mining');
    var msg = '';
    var color = '#8888aa';
    var xp = 5;

    if (tileType === T_COPPER_VEIN) {
      // Copper: base 1-2 ore, +1 per 3 levels
      var count = 1 + Math.floor(Math.random() * 2) + Math.floor(level / 3);
      Bag.add(p.bag, 'copper_ore', count);
      msg = '+' + count + ' Copper Ore';
      color = '#c07a4a';
      xp = 4;
    } else if (tileType === T_IRON_VEIN) {
      // Iron: base 1 ore, +1 per 4 levels
      var count = 1 + Math.floor(level / 4);
      if (level >= 2 && Math.random() < 0.4) count++;
      Bag.add(p.bag, 'iron_ore', count);
      msg = '+' + count + ' Iron Ore';
      color = '#7a8899';
      xp = 7;
    } else if (tileType === T_GOLD_VEIN) {
      // Gold: 1 ore, +1 at level 5+
      var count = 1 + (level >= 5 ? 1 : 0);
      if (level >= 3 && Math.random() < 0.3) count++;
      Bag.add(p.bag, 'gold_ore', count);
      msg = '+' + count + ' Gold Ore';
      color = '#ccaa22';
      xp = 12;
    }

    // Bonus gem drop — all vein types, scales with level
    var gemChance = 0.03 + level * 0.012;
    if (Math.random() < gemChance) {
      Bag.add(p.bag, 'gem', 1);
      msg += ', +1 Gem';
    }

    // Also chance of extra stone from smashing rock
    if (Math.random() < 0.35) {
      Bag.add(p.bag, 'stone', 1 + Math.floor(level / 5));
    }

    var result = PlayerSkills.addXp(p.skills, 'mining', xp);
    Overworld.setTile(wx, wy, T_RUBBLE);
    SFX.hit();
    game.addLog(msg, color);
    game.addFloating(wx, wy, msg, color);

    if (result.leveled) {
      game.addLog('Mining level ' + result.level + '!', '#ffcc44');
      SFX.stairs();
    }
    return true;
  },

  recipes: [
    { skill: 'mining', level: 1, name: 'Copper Bar', input: { copper_ore: 3 }, output: { copper_bar: 1 } },
    { skill: 'mining', level: 2, name: 'Iron Bar',   input: { iron_ore: 3 },   output: { iron_bar: 1 }, requires: ['Copper Bar'] },
    { skill: 'mining', level: 3, name: 'Gold Bar',   input: { gold_ore: 2 },   output: { gold_bar: 1 }, requires: ['Iron Bar'] },
    { skill: 'mining', level: 4, name: 'Gem Ring',   input: { gem: 1, gold_bar: 1 }, output: { gem_ring: 1 }, requires: ['Gold Bar'] },
  ],
});

RecipeRegistry.addAll(SkillRegistry.get('mining').recipes);
