
// ============================================================
// SYSTEM: Caravan — mobile cargo transport, leaves trails
// ============================================================

// Resource and recipe
ResourceRegistry.add({ id: 'caravan_kit', name: 'Caravan Kit', color: '#886644', category: 'equipment', stackMax: 1 });
RecipeRegistry.addAll([
  { skill: 'gathering', level: 4, name: 'Caravan', input: { plank: 8, leather: 5, iron_bar: 2 }, output: { caravan_kit: 1 }, requires: ['Saddle'] },
]);

// Caravan Manager
var CaravanManager = {
  caravan: null, // { x, y, cargo, deployed, hitched, _loadMode, _prevX, _prevY }

  deploy: function(x, y) {
    this.caravan = {
      x: x, y: y,
      cargo: Bag.create(),
      deployed: true,
      hitched: false,
      _loadMode: true,
      _prevX: x, _prevY: y,
      animTimer: 0,
    };
  },

  isAt: function(wx, wy) {
    var c = this.caravan;
    return c && c.deployed && c.x === wx && c.y === wy;
  },
};

// Deploy caravan from inventory — interact with caravan_kit in bag
// Player presses E while holding caravan_kit and a tamed horse is adjacent
function _findAdjacentTamedHorse(px, py) {
  if (typeof AnimalManager === 'undefined') return null;
  var dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
  for (var i = 0; i < dirs.length; i++) {
    var a = AnimalManager.getAt(px + dirs[i].x, py + dirs[i].y);
    if (a && a.tamed && a.type === 'horse') return a;
  }
  // Also check if player is mounted on a horse
  var mount = AnimalManager.getMount();
  if (mount && mount.type === 'horse') return mount;
  return null;
}

// Caravan interaction via resolveInteraction
var _origResolveCaravan = Game.prototype.resolveInteraction;
Game.prototype.resolveInteraction = function(tx, ty) {
  // Check if caravan is at target
  if (CaravanManager.isAt(tx, ty)) {
    var c = CaravanManager.caravan;
    var p = this.player;

    if (!c.hitched) {
      // Try to hitch
      if (!_findAdjacentTamedHorse(p.x, p.y)) {
        GameUtils.addLog('Need a tamed horse nearby to hitch the caravan.', '#cc4444');
        return true;
      }
      c.hitched = true;
      c._prevX = p.x;
      c._prevY = p.y;
      SFX.shrine();
      GameUtils.addLog('Caravan hitched! It will follow you.', '#88cc44');
      return true;
    }

    // Hitched — cycle: load → unload → unhitch
    if (c._loadMode) {
      // Load food/craft/material items from player bag
      var loaded = 0;
      var contents = Bag.contents(p.bag);
      for (var i = 0; i < contents.length; i++) {
        var item = contents[i];
        var cat = item.def ? item.def.category : '';
        if (cat === 'food' || cat === 'material' || cat === 'mineral' || cat === 'fish' ||
            cat === 'herb' || cat === 'wood' || cat === 'ore' || cat === 'refined') {
          Bag.add(c.cargo, item.id, item.count);
          Bag.remove(p.bag, item.id, item.count);
          loaded += item.count;
        }
      }
      if (loaded > 0) {
        GameUtils.addLog('Loaded ' + loaded + ' items into caravan.', '#88aa44');
      } else {
        GameUtils.addLog('Nothing to load.', '#888');
      }
      c._loadMode = false;
    } else {
      // Unload cargo back to player
      var cargoItems = Bag.contents(c.cargo);
      var unloaded = 0;
      for (var i = 0; i < cargoItems.length; i++) {
        Bag.add(p.bag, cargoItems[i].id, cargoItems[i].count);
        unloaded += cargoItems[i].count;
      }
      if (unloaded > 0) {
        c.cargo = Bag.create();
        GameUtils.addLog('Unloaded ' + unloaded + ' items from caravan.', '#88aa44');
      } else {
        // Nothing to unload — unhitch
        c.hitched = false;
        GameUtils.addLog('Caravan unhitched.', '#ccaa44');
      }
      c._loadMode = true;
    }
    return true;
  }

  return _origResolveCaravan.call(this, tx, ty);
};

// Also let player deploy caravan_kit by interacting with empty ground while holding one
var _origInteractCaravan = Game.prototype.interactAdjacent;
Game.prototype.interactAdjacent = function() {
  if (this.player.mode === 'overworld' && !CaravanManager.caravan &&
      Bag.has(this.player.bag, 'caravan_kit')) {
    var horse = _findAdjacentTamedHorse(this.player.x, this.player.y);
    if (horse) {
      // Check if any adjacent tile has the caravan — if not, offer deploy
      var dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
      var hasTarget = false;
      var px = Math.round(this.player.x), py = Math.round(this.player.y);
      for (var i = 0; i < dirs.length; i++) {
        var tx = px + dirs[i].x, ty = py + dirs[i].y;
        if (NPCManager.getAt(tx, ty) || AnimalManager.getAt(tx, ty)) { hasTarget = true; break; }
        var tile = Overworld.getTile(tx, ty);
        if (SkillRegistry.getHandlersForTile(tile.type).length > 0 || TileRegistry.getInteraction(tile.type)) { hasTarget = true; break; }
      }
      if (!hasTarget) {
        Bag.remove(this.player.bag, 'caravan_kit', 1);
        CaravanManager.deploy(this.player.x, this.player.y);
        SFX.shrine();
        GameUtils.addLog('Caravan deployed! Press [E] toward it to hitch.', '#88cc44');
        return true;
      }
    }
  }
  return _origInteractCaravan.call(this);
};

// Caravan follows player (1 tile behind)
GameEvents.on('playerMove', function(game, nx, ny) {
  var c = CaravanManager.caravan;
  if (!c || !c.deployed || !c.hitched) return;
  if (game.player.mode !== 'overworld') return;

  // Move caravan to player's previous position
  var oldX = c._prevX, oldY = c._prevY;
  c.x = oldX;
  c.y = oldY;
  c._prevX = nx;
  c._prevY = ny;

  // Fire trail event
  GameEvents.fire('caravanMove', game, c.x, c.y);
});

// Track player position even when unhitched
GameEvents.on('playerMove', function(game, nx, ny) {
  var c = CaravanManager.caravan;
  if (!c || !c.deployed || c.hitched) return;
  c._prevX = nx;
  c._prevY = ny;
});

// Update animation timer
GameEvents.on('update', function(game, dt) {
  var c = CaravanManager.caravan;
  if (c) c.animTimer = (c.animTimer || 0) + dt;
});

// Draw caravan — draw:entities already has camera transform applied
GameEvents.on('draw:entities', function(game, ctx) {
  var c = CaravanManager.caravan;
  if (!c || !c.deployed) return;
  if (game.player.mode !== 'overworld') return;

  var ts = CONFIG.TILE;
  var m = ts / 16;
  var sx = c.x * ts, sy = c.y * ts;

  // Hitch line to player
  if (c.hitched) {
    var px = game.player.x * ts + ts / 2;
    var py = game.player.y * ts + ts / 2;
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = Math.max(1, m);
    ctx.setLineDash([m * 2, m * 2]);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(sx + ts / 2, sy + ts / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(sx + 8 * m, sy + 14 * m, 6 * m, 1.5 * m, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cart body
  var bx = sx + 3 * m, by = sy + 4 * m, bw = 10 * m, bh = 6 * m;
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#6B4F0E';
  ctx.lineWidth = Math.max(0.5, m * 0.4);
  ctx.strokeRect(bx, by, bw, bh);
  // Plank lines
  ctx.beginPath();
  ctx.moveTo(bx, by + bh * 0.33); ctx.lineTo(bx + bw, by + bh * 0.33);
  ctx.moveTo(bx, by + bh * 0.66); ctx.lineTo(bx + bw, by + bh * 0.66);
  ctx.stroke();

  // Wheels
  ctx.fillStyle = '#5C3A0A';
  ctx.beginPath(); ctx.arc(bx + 2 * m, by + bh, 2.5 * m, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(bx + bw - 2 * m, by + bh, 2.5 * m, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8B6914';
  ctx.beginPath(); ctx.arc(bx + 2 * m, by + bh, m, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(bx + bw - 2 * m, by + bh, m, 0, Math.PI * 2); ctx.fill();

  // Cargo pile
  var cargoCount = 0;
  for (var id in c.cargo) if (c.cargo[id] > 0) cargoCount += c.cargo[id];
  if (cargoCount > 0) {
    var pileH = Math.min(4 * m, m + (cargoCount / 10) * 3 * m);
    ctx.fillStyle = '#AA8833';
    ctx.fillRect(bx + m, by - pileH, bw - 2 * m, pileH);
    ctx.strokeStyle = '#886622';
    ctx.lineWidth = Math.max(0.5, m * 0.3);
    ctx.strokeRect(bx + m, by - pileH, bw - 2 * m, pileH);
  }

  // Hitch pole
  ctx.strokeStyle = '#6B4F0E';
  ctx.lineWidth = Math.max(1, m);
  ctx.beginPath();
  ctx.moveTo(bx, by + bh / 2);
  ctx.lineTo(bx - 3 * m, by + bh / 2);
  ctx.stroke();

  // Label
  ctx.fillStyle = '#ccaa66';
  ctx.font = Math.max(7, Math.round(ts * 0.22)) + 'px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText('Caravan', sx + ts / 2, sy - 2);
});

// Block caravan tile
var _origIsPassableCaravan = Overworld.isPassable;
Overworld.isPassable = function(wx, wy) {
  if (!_origIsPassableCaravan.call(Overworld, wx, wy)) return false;
  if (CaravanManager.isAt(wx, wy)) return false;
  return true;
};

// Make caravan interactable via aim mode
var _origInteractAdjacentCaravan = Game.prototype.interactAdjacent;
Game.prototype.interactAdjacent = function() {
  if (this.player.mode === 'overworld' && CaravanManager.caravan && CaravanManager.caravan.deployed) {
    var px = Math.round(this.player.x), py = Math.round(this.player.y);
    var dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
    for (var i = 0; i < dirs.length; i++) {
      if (CaravanManager.isAt(px + dirs[i].x, py + dirs[i].y)) {
        StateStack.push(AimInteractState);
        return true;
      }
    }
  }
  return _origInteractAdjacentCaravan.call(this);
};

// Save/load
SaveSystem.register('caravan', {
  save: function() {
    var c = CaravanManager.caravan;
    if (!c) return null;
    return { x: c.x, y: c.y, cargo: c.cargo, deployed: c.deployed,
      hitched: c.hitched, _loadMode: c._loadMode };
  },
  load: function(data) {
    if (!data) { CaravanManager.caravan = null; return; }
    CaravanManager.caravan = {
      x: data.x, y: data.y,
      cargo: data.cargo || Bag.create(),
      deployed: data.deployed,
      hitched: data.hitched,
      _loadMode: data._loadMode !== undefined ? data._loadMode : true,
      _prevX: data.x, _prevY: data.y,
      animTimer: 0,
    };
  },
});
