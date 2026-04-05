
// ============================================================
// SKILL: Gathering — rocks, insects, sticks, clay
// ============================================================

ResourceRegistry.add({ id: 'stone', name: 'Stone', color: '#888888', category: 'mineral', stackMax: 99 });
ResourceRegistry.add({ id: 'flint', name: 'Flint', color: '#555566', category: 'mineral', stackMax: 99 });
ResourceRegistry.add({ id: 'clay', name: 'Clay', color: '#aa7755', category: 'mineral', stackMax: 99 });
ResourceRegistry.add({ id: 'beetle', name: 'Beetle', color: '#335522', category: 'insect', stackMax: 50 });
ResourceRegistry.add({ id: 'butterfly', name: 'Butterfly', color: '#dd88cc', category: 'insect', stackMax: 50 });
ResourceRegistry.add({ id: 'cricket', name: 'Cricket', color: '#556633', category: 'insect', stackMax: 50 });
ResourceRegistry.add({ id: 'worm', name: 'Worm', color: '#aa6655', category: 'bait', stackMax: 50 });

var T_ROCK = TileRegistry.add({
  id: 140, name: 'rock', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx || 0, wy || 0);
    var hash = (((wx||0) * 8117 + (wy||0) * 4523) >>> 0);
    var variant = hash % 3;
    // Rock varieties
    if (variant === 0) {
      // Single rounded boulder
      ctx.fillStyle = '#6a6a6a';
      ctx.beginPath(); ctx.ellipse(sx + 8*m, sy + 10*m, 3.5*m, 2.5*m, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#7a7a7a';
      ctx.beginPath(); ctx.ellipse(sx + 7.5*m, sy + 9.5*m, 2.5*m, 1.8*m, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#8a8a88';
      ctx.fillRect(sx + 6*m, sy + 8.5*m, 2*m, 1*m);
    } else if (variant === 1) {
      // Cluster of small stones
      ctx.fillStyle = '#707068';
      ctx.beginPath(); ctx.ellipse(sx + 5*m, sy + 10*m, 2*m, 1.5*m, 0.3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#686860';
      ctx.beginPath(); ctx.ellipse(sx + 9*m, sy + 11*m, 2.2*m, 1.3*m, -0.2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#787870';
      ctx.beginPath(); ctx.ellipse(sx + 7*m, sy + 9*m, 1.5*m, 1*m, 0.5, 0, Math.PI*2); ctx.fill();
    } else {
      // Flat slate-like stone
      ctx.fillStyle = '#5a5a60';
      ctx.beginPath();
      ctx.moveTo(sx + 4*m, sy + 11*m); ctx.lineTo(sx + 7*m, sy + 8*m);
      ctx.lineTo(sx + 12*m, sy + 9*m); ctx.lineTo(sx + 11*m, sy + 12*m);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6a6a70';
      ctx.fillRect(sx + 6*m, sy + 9*m, 4*m, 1.5*m);
    }
  },
});

var T_FALLEN_BRANCH = TileRegistry.add({
  id: 142, name: 'fallen_branch', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx || 0, wy || 0);
    var h = (((wx||0) * 2917 + (wy||0) * 5471) >>> 0);
    // Stick lying on ground
    ctx.strokeStyle = '#6a5030'; ctx.lineWidth = Math.max(1.5, m * 0.6);
    ctx.beginPath();
    ctx.moveTo(sx + 3*m, sy + 8*m);
    ctx.lineTo(sx + 13*m, sy + 10*m);
    ctx.stroke();
    // Fork
    ctx.beginPath();
    ctx.moveTo(sx + 10*m, sy + 9.5*m);
    ctx.lineTo(sx + 13*m, sy + 7*m);
    ctx.stroke();
    // Second small stick
    ctx.strokeStyle = '#5a4020';
    ctx.beginPath();
    ctx.moveTo(sx + 5*m, sy + 11*m);
    ctx.lineTo(sx + 10*m, sy + 13*m);
    ctx.stroke();
  },
});

var T_INSECT_SPOT = TileRegistry.add({
  id: 141, name: 'insect_spot', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx || 0, wy || 0);
    var hash = (((wx||0) * 6151 + (wy||0) * 3307) >>> 0);
    var type = hash % 3; // beetle, butterfly, cricket
    var bob = Math.sin(animTimer * 3 + hash) * m * 0.5;
    if (type === 0) {
      // Beetle — small dark oval
      ctx.fillStyle = '#334422';
      ctx.beginPath(); ctx.ellipse(sx + 8*m, sy + 9*m + bob, 1.2*m, 0.8*m, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#224411';
      ctx.beginPath(); ctx.ellipse(sx + 8*m, sy + 9*m + bob, 0.8*m, 0.5*m, 0, 0, Math.PI*2); ctx.fill();
      // Legs
      ctx.strokeStyle = '#334422'; ctx.lineWidth = Math.max(0.3, m*0.2);
      ctx.beginPath(); ctx.moveTo(sx + 7*m, sy + 9*m + bob); ctx.lineTo(sx + 6*m, sy + 10*m + bob); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + 9*m, sy + 9*m + bob); ctx.lineTo(sx + 10*m, sy + 10*m + bob); ctx.stroke();
    } else if (type === 1) {
      // Butterfly — wings flapping
      var flap = Math.sin(animTimer * 6 + hash) * m * 1.5;
      ctx.fillStyle = '#dd88cc';
      ctx.beginPath(); ctx.ellipse(sx + 6.5*m, sy + 8*m + bob, 1.5*m + flap*0.3, 1.2*m, -0.3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + 9.5*m, sy + 8*m + bob, 1.5*m + flap*0.3, 1.2*m, 0.3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillRect(sx + 7.5*m, sy + 7.5*m + bob, 1*m, 2*m); // body
    } else {
      // Cricket — small with long legs
      ctx.fillStyle = '#556633';
      ctx.beginPath(); ctx.ellipse(sx + 8*m, sy + 10*m + bob, 1.3*m, 0.6*m, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#445522'; ctx.lineWidth = Math.max(0.3, m*0.2);
      ctx.beginPath(); ctx.moveTo(sx + 7*m, sy + 10*m + bob); ctx.lineTo(sx + 5*m, sy + 8*m + bob); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + 9*m, sy + 10*m + bob); ctx.lineTo(sx + 11*m, sy + 8*m + bob); ctx.stroke();
    }
  },
});

SkillRegistry.add({
  id: 'gathering',
  name: 'Gathering',
  color: '#888888',
  tileIds: [T_ROCK, T_INSECT_SPOT, T_FALLEN_BRANCH],

  populate: function(tile, biome, wx, wy, rng) {
    if (tile.type === T.WALL || tile.type === T.WATER) return null;
    // Rocks scattered everywhere, sparse
    if (rng() < 0.015) {
      var rocky = overworldNoise(wx, wy, 99999, 0.1);
      if (rocky > 0.55) return T_ROCK;
    }
    // Fallen branches — near trees, common
    if (rng() < 0.02) {
      var treeNoise = overworldNoise(wx, wy, 77777, 0.15);
      if (treeNoise > 0.4) return T_FALLEN_BRANCH;
    }
    // Insects in grassy areas
    if (rng() < 0.008) {
      var buggy = overworldNoise(wx * 1.5, wy * 1.5, 44444, 0.18);
      if (buggy > 0.6) return T_INSECT_SPOT;
    }
    return null;
  },

  onInteract: function(game, tileType, wx, wy) {
    var p = game.player;
    var level = PlayerSkills.getLevel(p.skills, 'gathering');
    var msg = '', color = '#888', xp = 2;

    if (tileType === T_FALLEN_BRANCH) {
      var branchCount = 1 + Math.floor(level / 4);
      Bag.add(p.bag, 'branch', branchCount);
      msg = '+' + branchCount + ' Branch' + (branchCount > 1 ? 'es' : '');
      color = '#6B5010'; xp = 2;
    } else if (tileType === T_ROCK) {
      var stoneCount = 1 + Math.floor(level / 3);
      Bag.add(p.bag, 'stone', stoneCount);
      msg = '+' + stoneCount + ' Stone';
      // Chance of flint or clay
      if (Math.random() < 0.2 + level * 0.03) {
        Bag.add(p.bag, 'flint', 1); msg += ', +1 Flint'; color = '#555566';
      }
      if (Math.random() < 0.15) {
        Bag.add(p.bag, 'worm', 1); msg += ', +1 Worm'; color = '#aa6655';
      }
      xp = 4;
    } else if (tileType === T_INSECT_SPOT) {
      var hash = (((wx||0) * 6151 + (wy||0) * 3307) >>> 0);
      var type = hash % 3;
      if (type === 0) { Bag.add(p.bag, 'beetle', 1); msg = '+1 Beetle'; color = '#335522'; }
      else if (type === 1) { Bag.add(p.bag, 'butterfly', 1); msg = '+1 Butterfly'; color = '#dd88cc'; }
      else { Bag.add(p.bag, 'cricket', 1); msg = '+1 Cricket'; color = '#556633'; }
      xp = 3;
    } else return false;

    var result = PlayerSkills.addXp(p.skills, 'gathering', xp);
    Overworld.setTile(wx, wy, T_BARE_PATCH);
    SFX.hit();
    game.addLog(msg, color);
    game.addFloating(wx, wy, msg, color);
    if (result.leveled) { game.addLog('Gathering level ' + result.level + '!', '#ffcc44'); SFX.stairs(); }
    return true;
  },

  recipes: [
    { skill: 'gathering', level: 2, name: 'Sharpened Flint', input: { flint: 2, stone: 1 }, output: { sharpened_flint: 1 } },
    { skill: 'gathering', level: 4, name: 'Clay Brick', input: { clay: 3 }, output: { clay_brick: 2 } },
  ],
});

ResourceRegistry.add({ id: 'sharpened_flint', name: 'Sharpened Flint', color: '#667788', category: 'tool', stackMax: 20 });
ResourceRegistry.add({ id: 'clay_brick', name: 'Clay Brick', color: '#bb8866', category: 'mineral', stackMax: 99 });
RecipeRegistry.addAll(SkillRegistry.get('gathering').recipes);

// Insects move around — relocate to adjacent tile occasionally
GameEvents.on('turnEnd', function(game) {
  if (game.player.mode !== 'overworld') return;
  if (GameTime.turn % 5 !== 0) return; // every 5 turns
  // Check loaded chunks for insect tiles
  for (var key in Overworld.chunks) {
    var chunk = Overworld.chunks[key];
    if (!chunk || !chunk.tiles) continue;
    var parts = key.split(',');
    var cx = parseInt(parts[0]), cy = parseInt(parts[1]);
    var baseX = cx * Overworld.CHUNK_SIZE, baseY = cy * Overworld.CHUNK_SIZE;
    for (var ly = 0; ly < Overworld.CHUNK_SIZE; ly++) {
      for (var lx = 0; lx < Overworld.CHUNK_SIZE; lx++) {
        var tile = chunk.tiles[ly][lx];
        if (tile.type === T_INSECT_SPOT && Math.random() < 0.3) {
          var wx = baseX + lx, wy = baseY + ly;
          // Don't move if player is nearby (let them catch it)
          var pdx = wx - game.player.x, pdy = wy - game.player.y;
          if (Math.abs(pdx) + Math.abs(pdy) < 3) continue;
          // Pick random adjacent tile
          var dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
          var d = dirs[Math.floor(Math.random() * 4)];
          var nx = wx + d.x, ny = wy + d.y;
          var destTile = Overworld.getTile(nx, ny);
          // Only move to walkable grass-like tiles
          if (destTile.type === 100 || destTile.type === T_BARE_PATCH) { // T_GRASS=100
            Overworld.setTile(wx, wy, 100); // leave grass behind
            Overworld.setTile(nx, ny, T_INSECT_SPOT); // move insect
          }
        }
      }
    }
  }
});
