
// ============================================================
// STATE: Crafting — turn resources into items
// ============================================================
var CraftingState = {
  name: 'crafting',
  drawBelow: true,
  _cursor: 0,
  _recipes: [],
  _message: '',
  _messageTimer: 0,

  onEnter: function(game) {
    // Get all recipes the player has skill access to and prerequisites met
    this._recipes = [];
    var all = RecipeRegistry.all();
    var crafted = game.player.craftedRecipes || {};
    for (var i = 0; i < all.length; i++) {
      var r = all[i];
      // Check skill level requirement
      if (r.skill && r.level) {
        var lvl = PlayerSkills.getLevel(game.player.skills, r.skill);
        if (lvl < r.level) continue;
      }
      // Check prerequisites
      if (!RecipeRegistry.checkPrereqs(r, crafted)) continue;
      this._recipes.push(r);
    }
    this._cursor = 0;
    this._message = '';
    this._messageTimer = 0;
  },

  onKey: function(game, key) {
    var lk = key.toLowerCase();
    if (lk === 'escape' || lk === 'c') { StateStack.pop(); return true; }
    if (key === 'ArrowUp' || lk === 'w') {
      this._cursor = (this._cursor - 1 + Math.max(1, this._recipes.length)) % Math.max(1, this._recipes.length);
      return true;
    }
    if (key === 'ArrowDown' || lk === 's') {
      this._cursor = (this._cursor + 1) % Math.max(1, this._recipes.length);
      return true;
    }
    if (lk === 'enter' || lk === ' ' || lk === 'e') {
      this._craft(game);
      return true;
    }
    return true;
  },

  _craft: function(game) {
    if (this._recipes.length === 0) return;
    var r = this._recipes[this._cursor];
    var p = game.player;
    if (!Bag.hasAll(p.bag, r.input)) {
      this._message = 'Not enough resources';
      this._messageTimer = 1.5;
      return;
    }
    Bag.removeAll(p.bag, r.input);
    Bag.addAll(p.bag, r.output);
    // Track crafted recipe for prerequisite tree
    if (r.name) {
      if (!p.craftedRecipes) p.craftedRecipes = {};
      p.craftedRecipes[r.name] = true;
    }
    // XP for the skill
    if (r.skill) {
      var result = PlayerSkills.addXp(p.skills, r.skill, 8);
      if (result.leveled) {
        GameUtils.addLog(r.skill + ' level ' + result.level + '!', '#ffcc44');
        // Refresh recipe list — new level may unlock new recipes
        this.onEnter(game);
      }
    }
    SFX.shrine();
    // Build output description
    var outputDesc = [];
    for (var id in r.output) {
      var def = ResourceRegistry.get(id);
      outputDesc.push(r.output[id] + 'x ' + (def ? def.name : id));
    }
    this._message = 'Crafted ' + outputDesc.join(', ');
    this._messageTimer = 2.0;
    GameUtils.addLog('Crafted: ' + outputDesc.join(', '), '#ddaa44');
  },

  onDraw: function(game, ctx) {
    var w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
    var fs = Math.max(12, Math.round(w * 0.013));
    var p = game.player;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = '#ddaa44';
    ctx.font = 'bold ' + Math.round(fs * 1.8) + 'px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('CRAFTING', w / 2, fs * 2.5);
    ctx.fillStyle = '#888';
    ctx.font = Math.round(fs * 0.8) + 'px Segoe UI';
    ctx.fillText('[C] or [ESC] to close    [ENTER] to craft', w / 2, fs * 4);

    if (this._recipes.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = fs + 'px Segoe UI';
      ctx.fillText('No recipes available. Level up your skills!', w / 2, h * 0.4);
      return;
    }

    // Recipe list — left side
    var listX = w * 0.05, listW = w * 0.4;
    var ty = fs * 6;
    var rowH = fs * 2.8;
    var visibleRows = Math.floor((h - ty - fs * 4) / rowH);
    var scrollOffset = Math.max(0, this._cursor - visibleRows + 2);

    ctx.textAlign = 'left';
    for (var i = scrollOffset; i < Math.min(this._recipes.length, scrollOffset + visibleRows); i++) {
      var r = this._recipes[i];
      var selected = i === this._cursor;
      var canAfford = Bag.hasAll(p.bag, r.input);
      var ry = ty + (i - scrollOffset) * rowH;

      // Highlight
      if (selected) {
        ctx.fillStyle = 'rgba(60, 50, 20, 0.6)';
        ctx.fillRect(listX - 4, ry - fs * 0.3, listW, rowH - 4);
        ctx.strokeStyle = '#ddaa44';
        ctx.lineWidth = 1;
        ctx.strokeRect(listX - 4, ry - fs * 0.3, listW, rowH - 4);
      }

      // Recipe name
      var skillDef = r.skill ? SkillRegistry.get(r.skill) : null;
      ctx.fillStyle = canAfford ? '#fff' : '#666';
      ctx.font = (selected ? 'bold ' : '') + fs + 'px Segoe UI';
      ctx.fillText(r.name || 'Recipe', listX, ry + fs * 0.7);

      // Skill tag
      if (skillDef) {
        ctx.fillStyle = canAfford ? skillDef.color : '#444';
        ctx.font = Math.round(fs * 0.7) + 'px Segoe UI';
        ctx.fillText(skillDef.name + ' Lv.' + r.level, listX, ry + fs * 1.7);
      }
    }

    // Selected recipe detail — right side
    var detailX = w * 0.52, detailW = w * 0.43;
    var r = this._recipes[this._cursor];
    if (r) {
      var dty = fs * 6;

      // Box — height calculated from content
      // Count: name(1) + prereqs(req.length+1) + requires header(1) + inputs(n) + gap + produces header(1) + outputs(n) + gap + button(2)
      var inputCount = 0; for (var _ci in r.input) inputCount++;
      var outputCount = 0; for (var _co in r.output) outputCount++;
      var prereqCount = (r.requires && r.requires.length) || 0;
      var detailLines = 2 + (prereqCount > 0 ? prereqCount + 2 : 0) + 1 + inputCount + 1 + 1 + outputCount + 2;
      var detailBoxH = Math.min(h - dty, detailLines * fs * 1.3 + fs * 2);
      ctx.fillStyle = 'rgba(30, 25, 15, 0.8)';
      ctx.fillRect(detailX - 8, dty - fs, detailW + 16, detailBoxH);
      ctx.strokeStyle = '#554422';
      ctx.lineWidth = 1;
      ctx.strokeRect(detailX - 8, dty - fs, detailW + 16, detailBoxH);

      // Name
      ctx.fillStyle = '#fff';
      ctx.font = 'bold ' + Math.round(fs * 1.2) + 'px Segoe UI';
      ctx.textAlign = 'left';
      ctx.fillText(r.name || 'Recipe', detailX, dty + fs * 0.5);
      dty += fs * 2.2;

      // Prerequisites (if any)
      if (r.requires && r.requires.length > 0) {
        ctx.fillStyle = '#aa7788';
        ctx.font = 'bold ' + Math.round(fs * 0.85) + 'px Segoe UI';
        ctx.fillText('PREREQUISITE:', detailX, dty);
        dty += fs * 1.3;
        ctx.font = Math.round(fs * 0.8) + 'px Segoe UI';
        for (var ri = 0; ri < r.requires.length; ri++) {
          var met = p.craftedRecipes && p.craftedRecipes[r.requires[ri]];
          ctx.fillStyle = met ? '#88aa88' : '#cc6666';
          ctx.fillText((met ? '\u2713 ' : '\u2717 ') + r.requires[ri], detailX + 8, dty);
          dty += fs * 1.1;
        }
        dty += fs * 0.3;
      }

      // Requires
      ctx.fillStyle = '#aa8866';
      ctx.font = 'bold ' + Math.round(fs * 0.85) + 'px Segoe UI';
      ctx.fillText('REQUIRES:', detailX, dty);
      dty += fs * 1.4;

      ctx.font = fs + 'px Segoe UI';
      for (var id in r.input) {
        var need = r.input[id];
        var have = p.bag[id] || 0;
        var def = ResourceRegistry.get(id);
        var enough = have >= need;
        ctx.fillStyle = enough ? '#88aa88' : '#cc6666';
        ctx.fillText((def ? def.name : id) + ': ' + have + ' / ' + need, detailX + 8, dty);
        dty += fs * 1.3;
      }

      dty += fs * 0.5;

      // Produces
      ctx.fillStyle = '#88aa66';
      ctx.font = 'bold ' + Math.round(fs * 0.85) + 'px Segoe UI';
      ctx.fillText('PRODUCES:', detailX, dty);
      dty += fs * 1.4;

      ctx.font = fs + 'px Segoe UI';
      for (var id in r.output) {
        var def = ResourceRegistry.get(id);
        ctx.fillStyle = def ? def.color : '#aaa';
        ctx.fillText(r.output[id] + 'x ' + (def ? def.name : id), detailX + 8, dty);
        dty += fs * 1.3;
      }

      // Craft button
      var canAfford = Bag.hasAll(p.bag, r.input);
      dty += fs * 1.0;
      ctx.fillStyle = canAfford ? 'rgba(80,120,40,0.6)' : 'rgba(60,40,40,0.4)';
      ctx.fillRect(detailX, dty - fs * 0.3, detailW * 0.5, fs * 1.8);
      ctx.strokeStyle = canAfford ? '#88aa44' : '#554444';
      ctx.lineWidth = 1;
      ctx.strokeRect(detailX, dty - fs * 0.3, detailW * 0.5, fs * 1.8);
      ctx.fillStyle = canAfford ? '#ccddaa' : '#666';
      ctx.font = 'bold ' + fs + 'px Segoe UI';
      ctx.fillText('[ENTER] Craft', detailX + 8, dty + fs * 0.8);
    }

    // Status message
    if (this._messageTimer > 0) {
      this._messageTimer -= 1/60;
      ctx.fillStyle = '#ffcc44';
      ctx.font = 'bold ' + Math.round(fs * 1.1) + 'px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(this._message, w / 2, h - fs * 3);
    }
  },
};

// Open crafting with C key
GameEvents.on('keyDown', function(game, key) {
  if ((key === 'c' || key === 'C') && game.player.mode === 'overworld') {
    StateStack.push(CraftingState);
    return true;
  }
  return false;
});
