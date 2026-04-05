
// ============================================================
// INTERACTIONS — Cross-system glue for tile events
// ============================================================

// Handle player interaction (E key)
// Standing-on items: pick up immediately
// Solid objects (trees, ore, NPCs): enter aim mode, press direction to interact
Game.prototype.interactAdjacent = function() {
  var p = this.player;

  if (p.mode === 'overworld') {
    var px = Math.round(p.x), py = Math.round(p.y);

    // 1. Check tile player is standing on (non-solid pickups) — immediate
    var standTile = Overworld.getTile(px, py);
    var standType = standTile.type;
    if (!TileRegistry.isSolid(standType)) {
      var handlers = SkillRegistry.getHandlersForTile(standType);
      for (var i = 0; i < handlers.length; i++) {
        if (handlers[i].handler(this, standType, px, py)) {
          this.endOverworldTurn();
          return true;
        }
      }
      var tileInteract = TileRegistry.getInteraction(standType);
      if (tileInteract) {
        tileInteract(this, px, py);
        this.endOverworldTurn();
        return true;
      }
    }

    // 2. Check if anything interactable is adjacent — if so, enter aim mode
    var hasTarget = false;
    var dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
    for (var di = 0; di < dirs.length; di++) {
      var d = dirs[di];
      var tx = px + d.x, ty = py + d.y;
      // NPC?
      if (NPCManager.getAt(tx, ty)) { hasTarget = true; break; }
      // Interactable tile?
      var tile = Overworld.getTile(tx, ty);
      var tt = tile.type;
      if (SkillRegistry.getHandlersForTile(tt).length > 0) { hasTarget = true; break; }
      if (TileRegistry.getInteraction(tt)) { hasTarget = true; break; }
    }

    if (hasTarget) {
      // Enter directional aim mode
      StateStack.push(AimInteractState);
      return true;
    }

    this.addLog('Nothing to interact with.', '#666');
    return false;
  }

  return false;
};

// Resolve a directional interaction at a specific tile
Game.prototype.resolveInteraction = function(tx, ty) {
  // NPC
  var npc = NPCManager.getAt(tx, ty);
  if (npc && npc.talkable) {
    this._talkingNpc = npc;
    StateStack.push(DialogueState);
    return true;
  }
  // Skill handlers
  var tile = Overworld.getTile(tx, ty);
  var handlers = SkillRegistry.getHandlersForTile(tile.type);
  for (var i = 0; i < handlers.length; i++) {
    if (handlers[i].handler(this, tile.type, tx, ty)) {
      this.endOverworldTurn();
      return true;
    }
  }
  // Tile interaction
  var tileInteract = TileRegistry.getInteraction(tile.type);
  if (tileInteract) {
    tileInteract(this, tx, ty);
    this.endOverworldTurn();
    return true;
  }
  // Dungeon loot pickup via [E] — for seen/skipped loot
  if (this.player.mode === 'dungeon' && this.dungeon) {
    if (tx >= 0 && tx < CONFIG.MAP_W && ty >= 0 && ty < CONFIG.MAP_H && this.dungeon.map[ty][tx] === T.LOOT) {
      var lootKey = tx + ',' + ty;
      var loot = this.dungeon.loot[lootKey];
      if (loot) {
        SFX.shrine();
        if (loot.type === 'resource' || loot.type === 'scroll') {
          delete this.dungeon.loot[lootKey];
          this.dungeon.map[ty][tx] = T.FLOOR;
          this.equipLoot(loot, tx, ty);
          if (this._seenLoot) delete this._seenLoot[lootKey];
        } else {
          this._pendingLoot = loot;
          this._pendingLootKey = lootKey;
          this._pendingLootPos = { x: tx, y: ty };
          if (this._seenLoot) delete this._seenLoot[lootKey];
          StateStack.push(LootPromptState);
        }
        return true;
      }
    }
  }
  this.addLog('Nothing there.', '#666');
  return false;
};

// Handle stepping onto a tile in overworld mode
Game.prototype.handleOverworldTile = function(wx, wy) {
  var tile = Overworld.getTile(wx, wy);

  // Cave entrance -> dungeon
  if (tile.type === T_CAVE_ENTRANCE) {
    this.enterDungeon();
    return true;
  }

  // Tile damage (lava etc)
  var dmg = TileRegistry.getDamage(tile.type);
  if (dmg) {
    var d = typeof dmg === 'function' ? dmg(this) : dmg;
    if (d > 0) {
      this.player.hp -= d;
      this.player.hitFlash = 0.2;
      this.addFloating(wx, wy, '-' + d, '#ff4422');
      if (this.player.hp <= 0) { this.player.hp = 0; this.die(); return true; }
    }
  }

  return false;
};

// Overworld movement
Game.prototype.doOverworldMove = function(dx, dy) {
  var nx = this.player.x + dx, ny = this.player.y + dy;

  // Check for animals — walk-into to melee attack (hostile or passive, not tamed)
  if (typeof AnimalManager !== 'undefined') {
    var target = AnimalManager.getAt(nx, ny);
    if (target && target.alive && !target.tamed) {
      var p = this.player;
      p.lastDir = { x: dx, y: dy };
      var dmg = p.atk + (p.weapon ? p.weapon.atk || 0 : 0);
      target.hp -= dmg;
      p.walkTimer = 0.15;
      SFX.hit();
      GameUtils.addFloating(nx, ny, '-' + dmg, '#ffcc44');
      if (target.hp <= 0) {
        target.alive = false;
        SFX.kill();
        GameUtils.addLog('Defeated ' + target.name + '!', '#ddaa44');
        p.kills++;
        // Drops based on animal type
        if (target.type === 'wolf' || target.type === 'boar' || target.type === 'bear') {
          Bag.add(p.bag, 'leather', 1 + Math.floor(Math.random() * 2));
          GameUtils.addLog('+Leather', '#aa8866');
        }
        if (target.type === 'rabbit' || target.type === 'deer' || target.type === 'boar' || target.type === 'bear') {
          var meatCount = target.type === 'rabbit' ? 1 : target.type === 'deer' ? 2 : 3;
          Bag.add(p.bag, 'raw_meat', meatCount);
          GameUtils.addLog('+Raw Meat x' + meatCount, '#cc5544');
        }
        if (target.type === 'deer' || target.type === 'fox') {
          Bag.add(p.bag, 'hide', 1);
          GameUtils.addLog('+Hide', '#997755');
        }
        // Birds and small animals drop feathers
        if (target.type === 'rabbit' || target.type === 'fox') {
          if (Math.random() < 0.3) {
            Bag.add(p.bag, 'feather', 1);
            GameUtils.addLog('+Feather', '#ddddcc');
          }
        }
        GameEvents.fire('kill', this, target);
      } else if (!target.hostile) {
        // Passive animal was hit but survived — it flees
        target.fleeTimer = 8;
      }
      this.endOverworldTurn();
      return;
    }
  }

  // Attack NPCs — walk into them to attack. Freedom has consequences.
  if (typeof NPCManager !== 'undefined') {
    var npcTarget = NPCManager.getAt(nx, ny);
    if (npcTarget && npcTarget.alive) {
      var p = this.player;
      p.lastDir = { x: dx, y: dy };
      var dmg = p.atk + (p.weapon ? p.weapon.atk || 0 : 0);
      if (!npcTarget.hp) { npcTarget.hp = 15; npcTarget.maxHp = 15; }
      npcTarget.hp -= dmg;
      p.walkTimer = 0.15;
      SFX.hit();
      GameUtils.addFloating(nx, ny, '-' + dmg, '#ff4444');
      GameUtils.addLog('You attack ' + npcTarget.name + '!', '#ff4444');
      if (npcTarget.hp <= 0) {
        npcTarget.alive = false;
        SFX.kill();
        GameUtils.addLog(npcTarget.name + ' is dead.', '#ff2222');
        this._npcKillConsequences(npcTarget);
        GameEvents.fire('kill', this, npcTarget);
      }
      this.endOverworldTurn();
      return;
    }
  }

  // Check passability via overworld
  if (!Overworld.isPassable(nx, ny)) return;

  this.player.x = nx;
  this.player.y = ny;
  this.player.walkTimer = 0.35;
  SFX.step();
  GameEvents.fire('playerMove', this, nx, ny);

  if (this.handleOverworldTile(nx, ny)) return;
  this.endOverworldTurn();
};

// _npcKillConsequences moved to systems/npc-combat.js

Game.prototype.endOverworldTurn = function() {
  this.turnReady = false;
  this.turnCooldown = 0.07;
  for (var i = 0; i < this.player.abilities.length; i++)
    if (this.player.abilities[i].currentCooldown > 0) this.player.abilities[i].currentCooldown--;
  if (this.player.shieldTurns > 0) this.player.shieldTurns--;
  GameEvents.fire('turnEnd', this);
};

// enterDungeon, exitDungeon, goUpFloor moved to systems/dungeon-transition.js

// Ruin tiles — scattered around entrances
var T_RUIN_FLOOR = TileRegistry.add({
  id: 121,
  name: 'ruin_floor',
  solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 7919 + (wy||0) * 6271) >>> 0);
    // Cracked stone paving
    ctx.fillStyle = shadeHex('#4a4540', ((h % 11) - 5) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Mortar lines
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = Math.max(0.5, m * 0.4);
    ctx.strokeRect(sx + 0.5, sy + 0.5, ts - 1, ts - 1);
    // Cracks
    ctx.strokeStyle = '#333028'; ctx.lineWidth = Math.max(0.5, m * 0.3);
    if ((h % 3) === 0) {
      ctx.beginPath(); ctx.moveTo(sx + 2*m, sy + ((h>>3)%8+2)*m); ctx.lineTo(sx + ts - 3*m, sy + ((h>>6)%8+4)*m); ctx.stroke();
    }
    // Moss in cracks
    if ((h % 5) === 0) {
      ctx.fillStyle = 'rgba(40,80,30,0.3)';
      ctx.fillRect(sx + ((h>>4)%8+2)*m, sy + ((h>>7)%8+2)*m, 3*m, 2*m);
    }
    // Rubble
    if ((h % 7) === 0) {
      ctx.fillStyle = '#5a5550';
      ctx.fillRect(sx + ((h>>2)%9+2)*m, sy + ((h>>5)%7+5)*m, 2*m, 1.5*m);
    }
  },
});

var T_RUIN_WALL = TileRegistry.add({
  id: 122,
  name: 'ruin_wall',
  solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 3571 + (wy||0) * 9283) >>> 0);
    // Ground first
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx || 0, wy || 0);
    // Broken wall segment — clearly solid with 3D depth
    var variant = h % 4;
    var baseCol = shadeHex('#5a5048', ((h >> 4) % 9) - 4);
    if (variant === 0) {
      // Tall wall piece with depth
      ctx.fillStyle = shadeHex(baseCol, -15); ctx.fillRect(sx + 2*m, sy - 2*m, 12*m, 14*m);
      ctx.fillStyle = shadeHex(baseCol, 20); ctx.fillRect(sx + 2*m, sy - 2*m, 12*m, 3*m); // lit top
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(sx + 2*m, sy + 10*m, 12*m, 2*m); // shadow bottom
      ctx.strokeStyle = '#333028'; ctx.lineWidth = 1.5; ctx.strokeRect(sx + 2*m, sy - 2*m, 12*m, 14*m);
    } else if (variant === 1) {
      // Low crumbled wall with shadow
      ctx.fillStyle = baseCol; ctx.fillRect(sx + 1*m, sy + 4*m, 14*m, 10*m);
      ctx.fillStyle = shadeHex(baseCol, 15); ctx.fillRect(sx + 1*m, sy + 4*m, 14*m, 2.5*m);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(sx + 1*m, sy + 12*m, 14*m, 2*m);
      ctx.strokeStyle = '#333028'; ctx.lineWidth = 1; ctx.strokeRect(sx + 1*m, sy + 4*m, 14*m, 10*m);
    } else if (variant === 2) {
      // Pillar stump with depth
      ctx.fillStyle = baseCol; ctx.fillRect(sx + 4*m, sy + 1*m, 8*m, 13*m);
      ctx.fillStyle = shadeHex(baseCol, 20); ctx.fillRect(sx + 4*m, sy + 1*m, 8*m, 2.5*m);
      ctx.fillStyle = shadeHex(baseCol, -20); ctx.fillRect(sx + 4*m, sy + 12*m, 8*m, 2*m);
      ctx.strokeStyle = '#333028'; ctx.lineWidth = 1.5; ctx.strokeRect(sx + 4*m, sy + 1*m, 8*m, 13*m);
      // Rubble beside it
      ctx.fillStyle = '#5a5550';
      ctx.fillRect(sx + 1*m, sy + 10*m, 3*m, 3*m);
    } else {
      // Corner piece
      ctx.fillRect(sx + 0*m, sy + 3*m, 7*m, 11*m);
      ctx.fillRect(sx + 0*m, sy + 3*m, 14*m, 5*m);
    }
    // Moss
    ctx.fillStyle = 'rgba(40,80,30,0.3)';
    ctx.fillRect(sx + ((h>>3)%8+1)*m, sy + ((h>>6)%6+7)*m, 3*m, 2*m);
  },
});

var T_RUIN_RUBBLE = TileRegistry.add({
  id: 123,
  name: 'ruin_rubble',
  solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    // Ground first
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx || 0, wy || 0);
    var h = (((wx||0) * 4217 + (wy||0) * 8363) >>> 0);
    // Scattered stone blocks
    ctx.fillStyle = '#5a5550';
    ctx.fillRect(sx + 2*m, sy + 9*m, 3*m, 2.5*m);
    ctx.fillRect(sx + 8*m, sy + 7*m, 2.5*m, 2*m);
    ctx.fillStyle = '#4a4540';
    ctx.fillRect(sx + 5*m, sy + 11*m, 4*m, 2*m);
    ctx.fillRect(sx + 11*m, sy + 10*m, 2*m, 3*m);
    // Small debris
    ctx.fillStyle = '#6a6560';
    ctx.fillRect(sx + ((h>>2)%6+3)*m, sy + ((h>>5)%5+5)*m, 1.5*m, 1*m);
    ctx.fillRect(sx + ((h>>4)%7+1)*m, sy + ((h>>7)%4+8)*m, 1*m, 1.5*m);
  },
});

// Ruins entrance tile
var T_CAVE_ENTRANCE = TileRegistry.add({
  id: 120,
  name: 'ruins_entrance',
  solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    // Ground underneath
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx || 0, wy || 0);

    var m = ts / 16;
    var hash = ((( wx||0) * 7919 + (wy||0) * 6271) >>> 0);

    // Crumbled stone walls — left pillar
    ctx.fillStyle = '#5a5048';
    ctx.fillRect(sx + 1*m, sy - 4*m, 4*m, 18*m);
    ctx.fillStyle = '#4a4038';
    ctx.fillRect(sx + 1*m, sy - 4*m, 4*m, 2*m); // cap
    // Right pillar
    ctx.fillStyle = '#5a5048';
    ctx.fillRect(sx + 11*m, sy - 2*m, 4*m, 16*m);
    ctx.fillStyle = '#4a4038';
    ctx.fillRect(sx + 11*m, sy - 2*m, 4*m, 2*m);
    // Broken lintel across top
    ctx.fillStyle = '#4a4038';
    ctx.fillRect(sx + 1*m, sy - 4*m, 14*m, 2.5*m);
    // Cracks in lintel
    ctx.strokeStyle = '#333028'; ctx.lineWidth = Math.max(0.5, m * 0.4);
    ctx.beginPath(); ctx.moveTo(sx + 6*m, sy - 4*m); ctx.lineTo(sx + 7*m, sy - 1.5*m); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 10*m, sy - 3.5*m); ctx.lineTo(sx + 9*m, sy - 1.5*m); ctx.stroke();

    // Dark stairway descending between pillars
    ctx.fillStyle = '#0a0808';
    ctx.fillRect(sx + 5*m, sy + 2*m, 6*m, 12*m);
    // Steps visible inside
    ctx.fillStyle = '#3a3028';
    ctx.fillRect(sx + 5*m, sy + 3*m, 6*m, 1.5*m);
    ctx.fillStyle = '#2a2018';
    ctx.fillRect(sx + 5.5*m, sy + 6*m, 5*m, 1.5*m);
    ctx.fillStyle = '#1a1010';
    ctx.fillRect(sx + 6*m, sy + 9*m, 4*m, 1.5*m);

    // Warm glow from below
    var pulse = 0.4 + Math.sin(animTimer * 1.5) * 0.15;
    ctx.fillStyle = 'rgba(255,150,50,' + (0.08 * pulse).toFixed(3) + ')';
    ctx.fillRect(sx + 5.5*m, sy + 4*m, 5*m, 8*m);

    // Moss on pillars
    ctx.fillStyle = 'rgba(40,80,30,0.35)';
    ctx.fillRect(sx + 1*m, sy + 8*m, 3*m, 4*m);
    ctx.fillRect(sx + 12*m, sy + 6*m, 2*m, 5*m);

    // Scattered rubble around base
    ctx.fillStyle = '#5a5048';
    ctx.fillRect(sx + 0*m, sy + 13*m, 2*m, 1.5*m);
    ctx.fillRect(sx + 14*m, sy + 12*m, 1.5*m, 2*m);
    ctx.fillRect(sx + 3*m, sy + 14*m, 1.5*m, 1*m);
  },
  light: { color: '#ff8833', radius: 2.5, intensity: 0.3 },
  onInteract: function(game, wx, wy) {
    game.enterDungeon();
  },
});

// Highlight collectible tiles near the player
GameEvents.on('draw:world', function(game, ctx) {
  if (game.player.mode !== 'overworld') return;
  var ts = CONFIG.TILE;
  var px = Math.round(game.player.x), py = Math.round(game.player.y);
  var range = 2; // highlight within 2 tiles
  var pulse = 0.12 + Math.sin(game.animTimer * 3) * 0.06;

  for (var dy = -range; dy <= range; dy++) {
    for (var dx = -range; dx <= range; dx++) {
      if (dx === 0 && dy === 0) continue;
      var wx = px + dx, wy = py + dy;
      var tile = Overworld.getTile(wx, wy);
      var tt = tile.type;
      // Only highlight non-solid collectibles (things you stand on)
      if (TileRegistry.isSolid(tt)) continue;
      var isCollectible = false;
      if (SkillRegistry.getHandlersForTile(tt).length > 0) isCollectible = true;
      if (!isCollectible && TileRegistry.getInteraction(tt)) isCollectible = true;
      if (isCollectible) {
        ctx.fillStyle = 'rgba(255,255,200,' + pulse.toFixed(3) + ')';
        ctx.fillRect(wx * ts + 1, wy * ts + 1, ts - 2, ts - 2);
      }
    }
  }
});
