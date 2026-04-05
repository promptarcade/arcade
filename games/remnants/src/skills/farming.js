
// ============================================================
// SKILL: Farming — plant seeds, tend crops, harvest
// ============================================================

// Resources
ResourceRegistry.add({ id: 'wheat_seed', name: 'Wheat Seed', color: '#ccaa44', category: 'seed', stackMax: 99 });
ResourceRegistry.add({ id: 'carrot_seed', name: 'Carrot Seed', color: '#dd8833', category: 'seed', stackMax: 99 });
ResourceRegistry.add({ id: 'berry_seed', name: 'Berry Seed', color: '#8833aa', category: 'seed', stackMax: 99 });
ResourceRegistry.add({ id: 'wheat', name: 'Wheat', color: '#ddcc55', category: 'crop', stackMax: 99 });
ResourceRegistry.add({ id: 'carrot', name: 'Carrot', color: '#ee8833', category: 'crop', stackMax: 99 });
// bread registered in cooking.js
ResourceRegistry.add({ id: 'carrot_stew', name: 'Carrot Stew', color: '#dd7722', category: 'food', stackMax: 20 });

// Crop definitions
var CROPS = {
  wheat:  { seed: 'wheat_seed', harvest: 'wheat', growTime: 400, stages: 4, color: ['#665522','#887733','#aaaa44','#ddcc55'] },
  carrot: { seed: 'carrot_seed', harvest: 'carrot', growTime: 300, stages: 4, color: ['#665522','#557733','#448833','#ee8833'] },
  berry:  { seed: 'berry_seed', harvest: 'wild_berry', growTime: 500, stages: 4, color: ['#665522','#446633','#448844','#8833aa'] },
};

// Farm plot tile — stores crop data in the overworld tile object
var T_FARM_PLOT = TileRegistry.add({
  id: 210,
  name: 'farm_plot',
  solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    // Tilled soil
    ctx.fillStyle = '#4a3a22';
    ctx.fillRect(sx, sy, ts, ts);
    // Furrow lines
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = Math.max(0.5, m * 0.4);
    for (var i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(sx, sy + i * 4 * m); ctx.lineTo(sx + ts, sy + i * 4 * m); ctx.stroke();
    }
    // Lighter ridge tops
    ctx.fillStyle = '#5a4a30';
    for (var i = 0; i < 4; i++) {
      ctx.fillRect(sx, sy + i * 4 * m, ts, m);
    }

    // Draw crop if planted
    var tile = Overworld.getTile(wx, wy);
    if (tile.crop) {
      var crop = CROPS[tile.crop];
      if (crop) {
        var stage = Math.min(crop.stages - 1, Math.floor((tile.cropGrowth || 0) / crop.growTime * crop.stages));
        var col = crop.color[stage];

        if (stage === 0) {
          // Seedling — tiny dots
          ctx.fillStyle = col;
          ctx.fillRect(sx + 4*m, sy + 6*m, 1*m, 2*m);
          ctx.fillRect(sx + 8*m, sy + 5*m, 1*m, 2*m);
          ctx.fillRect(sx + 12*m, sy + 7*m, 1*m, 2*m);
        } else if (stage === 1) {
          // Sprout — small stalks
          ctx.fillStyle = col;
          ctx.fillRect(sx + 3*m, sy + 4*m, 1*m, 5*m);
          ctx.fillRect(sx + 7*m, sy + 3*m, 1*m, 6*m);
          ctx.fillRect(sx + 11*m, sy + 5*m, 1*m, 4*m);
          ctx.fillStyle = '#44aa44';
          ctx.fillRect(sx + 2*m, sy + 4*m, 2*m, 1*m);
          ctx.fillRect(sx + 7*m, sy + 3*m, 2*m, 1*m);
        } else if (stage === 2) {
          // Growing — leafy
          ctx.fillStyle = '#44aa44';
          ctx.fillRect(sx + 2*m, sy + 2*m, 3*m, 7*m);
          ctx.fillRect(sx + 6*m, sy + 1*m, 3*m, 8*m);
          ctx.fillRect(sx + 10*m, sy + 3*m, 3*m, 6*m);
          ctx.fillStyle = col;
          ctx.fillRect(sx + 3*m, sy + 1*m, 1.5*m, 2*m);
          ctx.fillRect(sx + 7*m, sy + 0*m, 1.5*m, 2*m);
          ctx.fillRect(sx + 11*m, sy + 2*m, 1.5*m, 2*m);
        } else {
          // Ready to harvest — full, colorful
          var sway = Math.sin(animTimer * 1.5 + wx) * m * 0.3;
          ctx.fillStyle = '#338833';
          ctx.fillRect(sx + 1*m + sway, sy + 1*m, 4*m, 10*m);
          ctx.fillRect(sx + 6*m - sway, sy + 0*m, 4*m, 11*m);
          ctx.fillRect(sx + 11*m + sway, sy + 2*m, 3*m, 9*m);
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(sx + 3*m + sway, sy + 1*m, 2*m, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(sx + 8*m - sway, sy + 0*m, 2.5*m, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(sx + 12*m + sway, sy + 2*m, 2*m, 0, Math.PI * 2); ctx.fill();
        }

        // Growth indicator if not ready
        if (tile.cropGrowth < crop.growTime) {
          var pct = tile.cropGrowth / crop.growTime;
          ctx.fillStyle = '#222'; ctx.fillRect(sx + 2, sy + ts - 4, ts - 4, 2);
          ctx.fillStyle = '#44aa44'; ctx.fillRect(sx + 2, sy + ts - 4, (ts - 4) * pct, 2);
        }
      }
    }
  },
  onInteract: function(game, wx, wy) {
    var tile = Overworld.getTile(wx, wy);
    if (tile.crop) {
      var crop = CROPS[tile.crop];
      if (crop && tile.cropGrowth >= crop.growTime) {
        // Harvest
        var level = PlayerSkills.getLevel(game.player.skills, 'farming');
        var yield_ = 2 + Math.floor(level / 2) + (Math.random() < 0.3 ? 1 : 0);
        // Weather bonus
        yield_ = Math.max(1, Math.round(yield_ * Weather.farmingMult()));
        Bag.add(game.player.bag, crop.harvest, yield_);
        // Chance to get seeds back
        if (Math.random() < 0.4 + level * 0.05) {
          Bag.add(game.player.bag, crop.seed, 1);
        }
        var result = PlayerSkills.addXp(game.player.skills, 'farming', 10);
        var def = ResourceRegistry.get(crop.harvest);
        GameUtils.addLog('+' + yield_ + ' ' + (def ? def.name : crop.harvest), def ? def.color : '#aaa');
        GameUtils.addFloating(wx, wy, '+' + yield_, def ? def.color : '#aaa');
        tile.crop = null;
        tile.cropGrowth = 0;
        SFX.heal();
        if (result.leveled) {
          GameUtils.addLog('Farming level ' + result.level + '!', '#ffcc44');
          SFX.stairs();
        }
      } else if (crop) {
        var pct = Math.round((tile.cropGrowth / crop.growTime) * 100);
        GameUtils.addLog(crop.harvest + ' growing... ' + pct + '%', '#888');
      }
    } else {
      // Open planting menu
      game._farmTile = { wx: wx, wy: wy };
      StateStack.push(PlantingState);
    }
  },
});

// Register farming skill
SkillRegistry.add({
  id: 'farming',
  name: 'Farming',
  color: '#ddcc55',
  tileIds: [T_FARM_PLOT],

  onInteract: function(game, tileType, wx, wy) {
    if (tileType !== T_FARM_PLOT) return false;
    var interact = TileRegistry.getInteraction(T_FARM_PLOT);
    if (interact) interact(game, wx, wy);
    return true;
  },

  recipes: [
    { skill: 'farming', level: 1, name: 'Wheat Seeds', input: { wheat: 3 }, output: { wheat_seed: 5 } },
    { skill: 'farming', level: 1, name: 'Carrot Seeds', input: { carrot: 2 }, output: { carrot_seed: 4 } },
    { skill: 'farming', level: 2, name: 'Berry Seeds', input: { wild_berry: 4 }, output: { berry_seed: 3 } },
    { skill: 'farming', level: 3, name: 'Carrot Stew', input: { carrot: 2, wheat: 1 }, output: { carrot_stew: 1 } },
  ],
});
RecipeRegistry.addAll(SkillRegistry.get('farming').recipes);

// Planting state — choose what to plant
var PlantingState = {
  name: 'planting',
  drawBelow: true,
  _cursor: 0,

  onEnter: function(game) { this._cursor = 0; },

  onKey: function(game, key) {
    var lk = key.toLowerCase();
    var plantable = [];
    for (var id in CROPS) {
      if (Bag.has(game.player.bag, CROPS[id].seed)) plantable.push(id);
    }
    if (lk === 'escape') { StateStack.pop(); return true; }
    if (key === 'ArrowUp' || lk === 'w') { this._cursor = (this._cursor - 1 + Math.max(1, plantable.length)) % Math.max(1, plantable.length); return true; }
    if (key === 'ArrowDown' || lk === 's') { this._cursor = (this._cursor + 1) % Math.max(1, plantable.length); return true; }
    if (lk === 'enter' || lk === ' ' || lk === 'e') {
      if (plantable.length > 0) {
        var cropId = plantable[this._cursor];
        var crop = CROPS[cropId];
        Bag.remove(game.player.bag, crop.seed, 1);
        var ft = game._farmTile;
        var tile = Overworld.getTile(ft.wx, ft.wy);
        tile.crop = cropId;
        tile.cropGrowth = 0;
        SFX.place();
        GameUtils.addLog('Planted ' + cropId, '#ddcc55');
      }
      StateStack.pop();
      return true;
    }
    return true;
  },

  onDraw: function(game, ctx) {
    var w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
    var fs = Math.max(13, Math.round(w * 0.014));
    var plantable = [];
    for (var id in CROPS) {
      if (Bag.has(game.player.bag, CROPS[id].seed)) plantable.push(id);
    }

    var boxW = Math.min(300, w * 0.35), boxH = fs * (plantable.length * 2.5 + 4);
    var bx = (w - boxW) / 2, by = (h - boxH) / 2;
    ctx.fillStyle = 'rgba(10, 8, 5, 0.92)'; ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = '#665522'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, boxW, boxH);

    var ty = by + fs * 1.5;
    ctx.fillStyle = '#ddcc55'; ctx.font = 'bold ' + Math.round(fs * 1.2) + 'px Segoe UI'; ctx.textAlign = 'center';
    ctx.fillText('PLANT SEEDS', w / 2, ty); ty += fs * 2;

    if (plantable.length === 0) {
      ctx.fillStyle = '#888'; ctx.font = fs + 'px Segoe UI';
      ctx.fillText('No seeds in bag', w / 2, ty);
    } else {
      ctx.textAlign = 'left';
      for (var i = 0; i < plantable.length; i++) {
        var id = plantable[i];
        var crop = CROPS[id];
        var seedDef = ResourceRegistry.get(crop.seed);
        var sel = i === this._cursor;
        if (sel) {
          ctx.fillStyle = 'rgba(60,50,20,0.5)';
          ctx.fillRect(bx + 8, ty - fs * 0.4, boxW - 16, fs * 2.2);
        }
        ctx.fillStyle = sel ? '#fff' : '#aaa';
        ctx.font = (sel ? 'bold ' : '') + fs + 'px Segoe UI';
        ctx.fillText(id.charAt(0).toUpperCase() + id.slice(1), bx + 16, ty + fs * 0.5);
        ctx.fillStyle = '#888'; ctx.font = Math.round(fs * 0.75) + 'px Segoe UI';
        ctx.fillText('Seeds: ' + (game.player.bag[crop.seed] || 0) + '  Growth: ' + Math.round(crop.growTime / 60) + ' min', bx + 16, ty + fs * 1.4);
        ty += fs * 2.5;
      }
    }

    ctx.fillStyle = '#666'; ctx.font = Math.round(fs * 0.8) + 'px Segoe UI'; ctx.textAlign = 'center';
    ctx.fillText('[ENTER] Plant    [ESC] Cancel', w / 2, by + boxH - fs * 0.8);
  },
};

// Crops grow over time
GameEvents.on('turnEnd', function(game) {
  if (game.player.mode !== 'overworld') return;
  // Grow all planted crops in loaded chunks
  for (var key in Overworld.chunks) {
    var chunk = Overworld.chunks[key];
    if (!chunk || !chunk.tiles) continue;
    for (var y = 0; y < Overworld.CHUNK_SIZE; y++) {
      for (var x = 0; x < Overworld.CHUNK_SIZE; x++) {
        var tile = chunk.tiles[y][x];
        if (tile.type === T_FARM_PLOT && tile.crop && tile.cropGrowth !== undefined) {
          var crop = CROPS[tile.crop];
          if (crop && tile.cropGrowth < crop.growTime) {
            // Weather affects growth rate
            var rate = Weather.farmingMult();
            tile.cropGrowth += rate;
          }
        }
      }
    }
  }
});

// Add farm plot as a building blueprint
BlueprintRegistry.add({
  id: 'farm_plot',
  name: 'Farm Plot',
  desc: 'Tilled soil for planting crops.',
  cost: { branch: 3, stone: 2 },
  size: { w: 1, h: 1 },
  tiles: [{ dx: 0, dy: 0, type: T_FARM_PLOT }],
});

// Starting seeds — give player some wheat seeds to start
GameEvents.on('modeChange', function(game, mode) {
  if (mode === 'overworld') {
    if (!game.player.bag.wheat_seed) {
      Bag.add(game.player.bag, 'wheat_seed', 5);
      Bag.add(game.player.bag, 'carrot_seed', 3);
    }
  }
});
