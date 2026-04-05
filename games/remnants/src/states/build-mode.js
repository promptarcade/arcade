
// ============================================================
// STATE: Build Mode — categorised blueprint selection
// ============================================================
var BUILD_CATEGORIES = [
  { id: 'paths', name: 'Paths', ids: ['path','cobblestone'] },
  { id: 'homes', name: 'Homes', ids: ['small_home','large_home'] },
  { id: 'commerce', name: 'Commerce', ids: ['market_stall','food_store','craft_store'] },
  { id: 'production', name: 'Production', ids: ['workshop','campfire','farm_plot','stable','mine_entrance'] },
  { id: 'decoration', name: 'Decoration', ids: ['fence','well','lantern'] },
  { id: 'special', name: 'Special', ids: ['tavern','town_hall','obelisk'] },
];

var BuildModeState = {
  name: 'build_mode',
  drawBelow: true,
  _catIdx: 0,
  _itemIdx: 0,

  onEnter: function(game) {
    this._catIdx = 0;
    this._itemIdx = 0;
  },

  _getItems: function() {
    var cat = BUILD_CATEGORIES[this._catIdx];
    var items = [];
    for (var i = 0; i < cat.ids.length; i++) {
      var bp = BlueprintRegistry.get(cat.ids[i]);
      if (bp) items.push(bp);
    }
    return items;
  },

  onKey: function(game, key) {
    var lk = key.toLowerCase();
    if (lk === 'escape' || lk === 'b') { StateStack.pop(); return true; }

    // Tab / Shift+Tab or Q/E for category switching
    if (key === 'Tab' || lk === 'q') {
      this._catIdx = (this._catIdx + 1) % BUILD_CATEGORIES.length;
      this._itemIdx = 0;
      return true;
    }

    var items = this._getItems();
    if (items.length === 0) return true;

    // Up/Down to change category
    if (key === 'ArrowUp' || lk === 'w') {
      this._catIdx = (this._catIdx - 1 + BUILD_CATEGORIES.length) % BUILD_CATEGORIES.length;
      this._itemIdx = 0;
      return true;
    }
    if (key === 'ArrowDown' || lk === 's') {
      this._catIdx = (this._catIdx + 1) % BUILD_CATEGORIES.length;
      this._itemIdx = 0;
      return true;
    }

    // Left/Right to change item within category
    if (key === 'ArrowLeft' || lk === 'a') {
      this._itemIdx = (this._itemIdx - 1 + items.length) % items.length;
      return true;
    }
    if (key === 'ArrowRight' || lk === 'd') {
      this._itemIdx = (this._itemIdx + 1) % items.length;
      return true;
    }

    if (key === 'Enter' || key === ' ' || lk === 'e') {
      var bp = items[this._itemIdx];
      if (bp) this._tryPlace(game, bp);
      return true;
    }
    return true;
  },

  _tryPlace: function(game, bp) {
    var p = game.player;
    var px = p.x + p.lastDir.x;
    var py = p.y + p.lastDir.y;

    if (!Bag.hasAll(p.bag, bp.cost)) {
      GameUtils.addLog('Not enough resources for ' + bp.name + '.', '#cc4444');
      return;
    }

    for (var i = 0; i < bp.tiles.length; i++) {
      var tx = px + bp.tiles[i].dx, ty = py + bp.tiles[i].dy;
      if (!Overworld.isPassable(tx, ty)) {
        GameUtils.addLog('Can\'t build here — space is blocked.', '#cc4444');
        return;
      }
      if (BuildingManager.getAt(tx, ty)) {
        GameUtils.addLog('There\'s already a building here.', '#cc4444');
        return;
      }
    }

    Bag.removeAll(p.bag, bp.cost);
    var building = BuildingManager.add(px, py, bp);
    for (var i = 0; i < bp.tiles.length; i++) {
      Overworld.setTile(px + bp.tiles[i].dx, py + bp.tiles[i].dy, bp.tiles[i].type);
    }

    SFX.shrine();
    GameUtils.addLog('Built ' + bp.name + '!', '#ddaa44');
    GameEvents.fire('buildingPlaced', game, building);
    StateStack.pop();
  },

  onDraw: function(game, ctx) {
    var w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
    var fs = Math.max(12, Math.round(w * 0.013));
    var items = this._getItems();
    var bp = items[this._itemIdx] || null;

    // World-space placement preview
    if (bp) {
      var p = game.player;
      var px = Math.round(p.x) + p.lastDir.x;
      var py = Math.round(p.y) + p.lastDir.y;
      var ts = CONFIG.TILE;
      var canAfford = Bag.hasAll(p.bag, bp.cost);
      var pulse = 0.3 + Math.sin(game.animTimer * 4) * 0.15;
      var blocked = false;

      game.pipeline.camera.applyTransform(ctx);

      for (var i = 0; i < bp.tiles.length; i++) {
        var tx = px + bp.tiles[i].dx, ty = py + bp.tiles[i].dy;
        var tileBlocked = !Overworld.isPassable(tx, ty) || BuildingManager.getAt(tx, ty);
        if (tileBlocked) blocked = true;
        var valid = canAfford && !tileBlocked;

        ctx.strokeStyle = valid ? 'rgba(100,255,100,0.7)' : 'rgba(255,80,80,0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx * ts + 1, ty * ts + 1, ts - 2, ts - 2);
        ctx.fillStyle = valid
          ? 'rgba(100,255,100,' + pulse.toFixed(2) + ')'
          : 'rgba(255,80,80,' + (pulse * 0.6).toFixed(2) + ')';
        ctx.fillRect(tx * ts + 2, ty * ts + 2, ts - 4, ts - 4);
      }

      var labelX = px * ts + (bp.size.w * ts) / 2;
      var labelY = py * ts - 8;
      ctx.fillStyle = (canAfford && !blocked) ? '#aaffaa' : '#ff8888';
      ctx.font = 'bold ' + Math.max(10, Math.round(ts * 0.35)) + 'px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(bp.name, labelX, labelY);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // --- UI PANEL ---
    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, w, fs * 3.5);

    ctx.fillStyle = '#ddaa44';
    ctx.font = 'bold ' + Math.round(fs * 1.3) + 'px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('BUILD MODE', w / 2, fs * 1.3);
    ctx.fillStyle = '#888';
    ctx.font = Math.round(fs * 0.75) + 'px Segoe UI';
    ctx.fillText('\u2191\u2193 Category    \u2190\u2192 Item    ENTER place    B/ESC cancel', w / 2, fs * 2.5);

    // Category tabs
    var tabW = w / BUILD_CATEGORIES.length;
    var tabY = fs * 3.5;
    var tabH = fs * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, tabY, w, tabH);

    for (var ci = 0; ci < BUILD_CATEGORIES.length; ci++) {
      var cat = BUILD_CATEGORIES[ci];
      var selected = ci === this._catIdx;
      var tx = ci * tabW;

      if (selected) {
        ctx.fillStyle = 'rgba(60,50,20,0.9)';
        ctx.fillRect(tx, tabY, tabW, tabH);
        ctx.strokeStyle = '#ddaa44';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx, tabY, tabW, tabH);
      }

      ctx.fillStyle = selected ? '#fff' : '#777';
      ctx.font = (selected ? 'bold ' : '') + Math.round(fs * 0.85) + 'px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(cat.name, tx + tabW / 2, tabY + tabH * 0.65);
    }

    // Item cards for selected category
    if (items.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = fs + 'px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText('No items in this category', w / 2, tabY + tabH + fs * 3);
      return;
    }

    var cardW = Math.min(w * 0.28, 220);
    var totalCardW = cardW * items.length + (items.length - 1) * 10;
    var startX = (w - totalCardW) / 2;
    var cardY = tabY + tabH + fs * 0.5;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var cx = startX + i * (cardW + 10);
      var isSel = i === this._itemIdx;
      var canAfford = Bag.hasAll(game.player.bag, item.cost);

      ctx.fillStyle = isSel ? 'rgba(40,35,20,0.95)' : 'rgba(15,12,8,0.85)';
      ctx.fillRect(cx, cardY, cardW, fs * 8);
      ctx.strokeStyle = isSel ? '#ddaa44' : '#444';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.strokeRect(cx, cardY, cardW, fs * 8);

      // Name
      var ty = cardY + fs * 1.3;
      ctx.fillStyle = isSel ? '#fff' : '#aaa';
      ctx.font = 'bold ' + fs + 'px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(item.name, cx + cardW / 2, ty); ty += fs * 1.4;

      // Description
      ctx.fillStyle = '#888';
      ctx.font = Math.round(fs * 0.75) + 'px Segoe UI';
      ctx.fillText(item.desc, cx + cardW / 2, ty); ty += fs * 1.5;

      // Cost
      ctx.font = Math.round(fs * 0.8) + 'px Segoe UI';
      ctx.textAlign = 'left';
      for (var resId in item.cost) {
        var have = game.player.bag[resId] || 0;
        var need = item.cost[resId];
        var resDef = ResourceRegistry.get(resId);
        var resName = resDef ? resDef.name : resId;
        ctx.fillStyle = have >= need ? '#88aa88' : '#cc6666';
        ctx.fillText(resName + ': ' + have + '/' + need, cx + 8, ty);
        ty += fs * 1.1;
      }
      ctx.textAlign = 'center';
    }
  },
};
