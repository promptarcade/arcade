
// ============================================================
// SKILL: Herbalism — gather herbs, flowers, mushrooms, craft potions
// ============================================================

ResourceRegistry.add({ id: 'meadow_herb', name: 'Meadow Herb', color: '#44aa44', category: 'herb', stackMax: 99 });
ResourceRegistry.add({ id: 'red_mushroom', name: 'Red Mushroom', color: '#cc3333', category: 'herb', stackMax: 99 });
ResourceRegistry.add({ id: 'brown_mushroom', name: 'Brown Mushroom', color: '#886644', category: 'herb', stackMax: 99 });
ResourceRegistry.add({ id: 'flower_petal', name: 'Flower Petal', color: '#dd6688', category: 'herb', stackMax: 99 });
ResourceRegistry.add({ id: 'wild_berry', name: 'Wild Berry', color: '#8833aa', category: 'herb', stackMax: 99 });
ResourceRegistry.add({ id: 'healing_salve', name: 'Healing Salve', color: '#44dd88', category: 'potion', stackMax: 20 });
ResourceRegistry.add({ id: 'antidote', name: 'Antidote', color: '#88ddaa', category: 'potion', stackMax: 20 });
ResourceRegistry.add({ id: 'health_potion', name: 'Health Potion', color: '#ff4488', category: 'potion', stackMax: 10 });

var T_HERB_PATCH = TileRegistry.add({
  id: 130, name: 'herb_patch', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx, wy);
    var hash = (((wx||0) * 41 + (wy||0) * 97) >>> 0);
    var sway = Math.sin(animTimer * 1.2 + hash * 0.05) * m * 0.4;
    ctx.fillStyle = '#338833';
    ctx.fillRect(sx + 4*m + sway, sy + 7*m, m, 4*m);
    ctx.fillRect(sx + 8*m - sway, sy + 6*m, m, 5*m);
    ctx.fillRect(sx + 11*m + sway*0.7, sy + 8*m, m, 3*m);
    ctx.fillStyle = '#44aa44';
    ctx.fillRect(sx + 3*m + sway, sy + 6*m, 3*m, 1.5*m);
    ctx.fillRect(sx + 7*m - sway, sy + 5*m, 3*m, 1.5*m);
    ctx.fillRect(sx + 10*m + sway*0.7, sy + 7*m, 3*m, 1.5*m);
    var fc = ['#eedd44', '#dd88dd', '#88bbff'][(hash >> 4) % 3];
    ctx.fillStyle = fc;
    ctx.fillRect(sx + 4*m + sway, sy + 5.5*m, 1.5*m, 1.5*m);
    ctx.fillRect(sx + 8*m - sway, sy + 4.5*m, 1.5*m, 1.5*m);
  },
});

var T_MUSHROOM_RED = TileRegistry.add({
  id: 131, name: 'red_mushroom', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx || 0, wy || 0);
    ctx.fillStyle = '#ccbbaa'; ctx.fillRect(sx + 7*m, sy + 10*m, 2*m, 3*m);
    ctx.fillStyle = '#cc2222';
    ctx.beginPath(); ctx.arc(sx + 8*m, sy + 9.5*m, 2.8*m, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffeecc';
    ctx.beginPath(); ctx.arc(sx + 7*m, sy + 8.5*m, 0.6*m, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 9*m, sy + 8*m, 0.5*m, 0, Math.PI*2); ctx.fill();
  },
});

var T_MUSHROOM_BROWN = TileRegistry.add({
  id: 133, name: 'brown_mushroom', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx || 0, wy || 0);
    // Cluster of small brown mushrooms
    ctx.fillStyle = '#aa9977'; ctx.fillRect(sx + 5*m, sy + 11*m, 1.5*m, 2*m);
    ctx.fillStyle = '#886644';
    ctx.beginPath(); ctx.arc(sx + 5.8*m, sy + 10.5*m, 2*m, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#aa9977'; ctx.fillRect(sx + 10*m, sy + 10*m, 1*m, 2.5*m);
    ctx.fillStyle = '#776644';
    ctx.beginPath(); ctx.arc(sx + 10.5*m, sy + 9.5*m, 1.5*m, Math.PI, 0); ctx.fill();
  },
});

var T_FLOWER = TileRegistry.add({
  id: 134, name: 'wildflower', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx || 0, wy || 0);
    var hash = (((wx||0) * 5179 + (wy||0) * 3571) >>> 0);
    var sway = Math.sin(animTimer * 1.5 + hash * 0.03) * m * 0.3;
    // 4 flower color varieties
    var colors = ['#dd4466', '#dddd44', '#6666dd', '#ff8844'];
    var ci = hash % 4;
    // Stem
    ctx.fillStyle = '#338833';
    ctx.fillRect(sx + 7.5*m + sway, sy + 6*m, m*0.8, 6*m);
    // Leaves on stem
    ctx.fillStyle = '#44aa44';
    ctx.fillRect(sx + 6*m + sway, sy + 8*m, 2*m, 1*m);
    ctx.fillRect(sx + 8*m + sway, sy + 10*m, 2*m, 1*m);
    // Flower head — 5 petals
    var fx = sx + 8*m + sway, fy = sy + 5.5*m;
    ctx.fillStyle = colors[ci];
    for (var p = 0; p < 5; p++) {
      var a = p * Math.PI * 2 / 5 - Math.PI/2;
      ctx.beginPath(); ctx.arc(fx + Math.cos(a)*1.5*m, fy + Math.sin(a)*1.5*m, 1.2*m, 0, Math.PI*2); ctx.fill();
    }
    // Center
    ctx.fillStyle = '#ffee66';
    ctx.beginPath(); ctx.arc(fx, fy, 0.8*m, 0, Math.PI*2); ctx.fill();
  },
});

var T_BERRY_BUSH = TileRegistry.add({
  id: 135, name: 'berry_bush', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx || 0, wy || 0);
    // Low bush
    ctx.fillStyle = '#2a5a22';
    ctx.beginPath(); ctx.arc(sx + 8*m, sy + 10*m, 4*m, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#3a6a30';
    ctx.beginPath(); ctx.arc(sx + 7*m, sy + 9*m, 2.5*m, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 10*m, sy + 9.5*m, 2*m, 0, Math.PI*2); ctx.fill();
    // Berries
    ctx.fillStyle = '#8833aa';
    ctx.beginPath(); ctx.arc(sx + 6*m, sy + 9*m, 0.8*m, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 9*m, sy + 8.5*m, 0.7*m, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 8*m, sy + 10.5*m, 0.8*m, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 10.5*m, sy + 10*m, 0.6*m, 0, Math.PI*2); ctx.fill();
  },
});

var T_BARE_PATCH = TileRegistry.add({
  id: 132, name: 'bare_patch', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx || 0, wy || 0);
    var m = ts / 16;
    ctx.fillStyle = '#6a6a3a';
    ctx.beginPath(); ctx.ellipse(sx + 8*m, sy + 10*m, 2*m, 1.2*m, 0, 0, Math.PI*2); ctx.fill();
  },
});

SkillRegistry.add({
  id: 'herbalism',
  name: 'Herbalism',
  color: '#44aa44',
  tileIds: [T_HERB_PATCH, T_MUSHROOM_RED, T_MUSHROOM_BROWN, T_FLOWER, T_BERRY_BUSH],

  populate: function(tile, biome, wx, wy, rng) {
    if (tile.type === T.WALL || tile.type === T.WATER) return null;
    var density = (biome.density && biome.density.herbs) || 0;
    if (density <= 0) return null;
    if (rng() < density) {
      var moisture = overworldNoise(wx, wy, 33333, 0.2);
      if (moisture > 0.45) {
        var roll = rng();
        if (roll < 0.2) return T_MUSHROOM_RED;
        if (roll < 0.35) return T_MUSHROOM_BROWN;
        if (roll < 0.55) return T_HERB_PATCH;
        return null;
      }
    }
    // Flowers and berries in drier areas
    if (rng() < density * 0.7) {
      var flowerNoise = overworldNoise(wx * 2.1, wy * 1.7, 55555, 0.2);
      if (flowerNoise > 0.6) return T_FLOWER;
      if (flowerNoise > 0.55 && rng() < 0.3) return T_BERRY_BUSH;
    }
    return null;
  },

  onInteract: function(game, tileType, wx, wy) {
    var p = game.player;
    var level = PlayerSkills.getLevel(p.skills, 'herbalism');
    var msg = '', color = '#44aa44', xp = 3;

    if (tileType === T_HERB_PATCH) {
      var count = 1 + Math.floor(level / 4);
      Bag.add(p.bag, 'meadow_herb', count);
      msg = '+' + count + ' Meadow Herb'; color = '#44aa44';
    } else if (tileType === T_MUSHROOM_RED) {
      Bag.add(p.bag, 'red_mushroom', 1);
      if (level >= 3 && Math.random() < 0.3) { Bag.add(p.bag, 'red_mushroom', 1); msg = '+2 Red Mushroom'; }
      else msg = '+1 Red Mushroom';
      color = '#cc3333'; xp = 5;
    } else if (tileType === T_MUSHROOM_BROWN) {
      var count = 1 + Math.floor(level / 5);
      Bag.add(p.bag, 'brown_mushroom', count);
      msg = '+' + count + ' Brown Mushroom'; color = '#886644'; xp = 3;
    } else if (tileType === T_FLOWER) {
      var count = 1 + Math.floor(level / 6);
      Bag.add(p.bag, 'flower_petal', count);
      msg = '+' + count + ' Petal'; color = '#dd6688'; xp = 2;
    } else if (tileType === T_BERRY_BUSH) {
      var count = 2 + Math.floor(level / 3);
      Bag.add(p.bag, 'wild_berry', count);
      msg = '+' + count + ' Berries'; color = '#8833aa'; xp = 4;
    } else return false;

    var result = PlayerSkills.addXp(p.skills, 'herbalism', xp);
    Overworld.setTile(wx, wy, T_BARE_PATCH);
    SFX.heal();
    game.addLog(msg, color);
    game.addFloating(wx, wy, msg, color);
    if (result.leveled) { game.addLog('Herbalism level ' + result.level + '!', '#ffcc44'); SFX.stairs(); }
    return true;
  },

  recipes: [
    { skill: 'herbalism', level: 1, name: 'Healing Salve', input: { meadow_herb: 3 }, output: { healing_salve: 1 } },
    { skill: 'herbalism', level: 2, name: 'Berry Juice', input: { wild_berry: 5 }, output: { healing_salve: 2 }, requires: ['Healing Salve'] },
    { skill: 'herbalism', level: 3, name: 'Antidote', input: { meadow_herb: 2, red_mushroom: 1 }, output: { antidote: 2 }, requires: ['Healing Salve'] },
    { skill: 'herbalism', level: 4, name: 'Petal Essence', input: { flower_petal: 5, meadow_herb: 2 }, output: { healing_salve: 3 }, requires: ['Berry Juice'] },
    { skill: 'herbalism', level: 5, name: 'Health Potion', input: { healing_salve: 2, red_mushroom: 2 }, output: { health_potion: 1 }, requires: ['Antidote', 'Petal Essence'] },
  ],
});

RecipeRegistry.addAll(SkillRegistry.get('herbalism').recipes);
