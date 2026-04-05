
// ============================================================
// STATE: Title / Character Creator with Continue
// ============================================================
var TitleState = {
  name: 'title',
  drawBelow: false,
  _hasSave: false,
  _mode: 'menu', // 'menu' or 'create'

  onEnter: function(game) {
    this._hasSave = SaveSystem.hasSave();
    this._mode = this._hasSave ? 'menu' : 'create';
    this._menuCursor = 0; // 0=continue, 1=new game
  },

  onKey: function(game, key) {
    if (this._mode === 'menu') {
      // Menu: Continue / New Game / Reset World
      var menuCount = 3;
      if (key === 'ArrowUp' || key === 'w') { this._menuCursor = (this._menuCursor - 1 + menuCount) % menuCount; return true; }
      if (key === 'ArrowDown' || key === 's') { this._menuCursor = (this._menuCursor + 1) % menuCount; return true; }
      if (key === 'Enter' || key === ' ') {
        if (this._menuCursor === 0) {
          game.continueGame();
        } else if (this._menuCursor === 1) {
          SaveSystem.deleteSave();
          this._mode = 'create';
        } else if (this._menuCursor === 2) {
          // Full reset — wipe save, legacy, meta, world seed
          SaveSystem.deleteSave();
          try { localStorage.removeItem('wanderlust_legacy'); } catch(e) {}
          try { localStorage.removeItem('wanderlust_meta'); } catch(e) {}
          game.meta = loadMeta(); // reload fresh meta (no world seed)
          this._mode = 'create';
        }
        return true;
      }
      return true;
    }

    // Character creator mode
    var c = game.customization;
    var optionCounts = [game.BODY_COLORS.length, game.HAIR_COLORS.length, game.HAIR_STYLES.length,
      game.SKIN_COLORS.length, game.EYE_COLORS.length, game.BODIES.length, game.HEIGHTS.length,
      game.FRAMES.length, game.START_WEAPONS.length];
    var numOpts = optionCounts.length;
    var keys = ['bodyColorIdx','hairIdx','hairStyleIdx','skinIdx','eyeIdx','bodyIdx','heightIdx','frameIdx','startWpnIdx'];

    if (key === 'ArrowUp' || key === 'w') { c.cursor = (c.cursor - 1 + numOpts) % numOpts; return true; }
    if (key === 'ArrowDown' || key === 's') { c.cursor = (c.cursor + 1) % numOpts; return true; }
    if (key === 'ArrowLeft' || key === 'a') {
      c[keys[c.cursor]] = (c[keys[c.cursor]] - 1 + optionCounts[c.cursor]) % optionCounts[c.cursor];
      return true;
    }
    if (key === 'ArrowRight' || key === 'd') {
      c[keys[c.cursor]] = (c[keys[c.cursor]] + 1) % optionCounts[c.cursor];
      return true;
    }
    if (key === 'Enter' || key === ' ') { game.startGame(); return true; }
    return true; // consume all keys on title screen
  },

  onDraw: function(game, ctx) {
    if (this._mode === 'menu') {
      this._drawMenu(game, ctx);
    } else {
      game.drawTitle(ctx);
    }
  },

  _drawMenu: function(game, ctx) {
    var w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
    var fs = Math.max(14, Math.round(w * 0.015));

    ctx.fillStyle = '#040410';
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = '#4466aa';
    ctx.font = 'bold ' + Math.round(fs * 2.8) + 'px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('REMNANTS', w / 2, h * 0.2);
    ctx.fillStyle = '#556';
    ctx.font = Math.round(fs * 1) + 'px Segoe UI';
    ctx.fillText('The world remembers', w / 2, h * 0.26);

    // Stats
    if (game.meta.depthRecord > 0) {
      ctx.fillStyle = '#666';
      ctx.font = Math.round(fs * 0.85) + 'px Segoe UI';
      ctx.fillText('Best: Floor ' + game.meta.depthRecord + '  Runs: ' + game.meta.totalRuns + '  Kills: ' + game.meta.totalKills, w / 2, h * 0.32);
    }

    // Menu options — rowH calculated to fit between menu start and controls
    var menuTop = h * 0.38;
    var controlsY = h * 0.82;
    var menuCount = 3;
    var rowH = Math.min(fs * 3.5, (controlsY - menuTop) / menuCount);
    var menuY = menuTop;

    // Continue
    var sel0 = this._menuCursor === 0;
    if (sel0) {
      ctx.fillStyle = 'rgba(40,60,100,0.5)';
      ctx.fillRect(w * 0.3, menuY - fs * 0.5, w * 0.4, rowH - fs * 0.5);
      ctx.strokeStyle = '#4488cc';
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.3, menuY - fs * 0.5, w * 0.4, rowH - fs * 0.5);
    }
    ctx.fillStyle = sel0 ? '#ffffff' : '#8899aa';
    ctx.font = (sel0 ? 'bold ' : '') + Math.round(fs * 1.5) + 'px Segoe UI';
    ctx.fillText('CONTINUE', w / 2, menuY + fs * 1.0);
    ctx.fillStyle = '#556';
    ctx.font = Math.round(fs * 0.7) + 'px Segoe UI';
    ctx.fillText('Resume your adventure', w / 2, menuY + fs * 2.0);

    // New Game
    menuY += rowH;
    var sel1 = this._menuCursor === 1;
    if (sel1) {
      ctx.fillStyle = 'rgba(60,40,40,0.5)';
      ctx.fillRect(w * 0.3, menuY - fs * 0.5, w * 0.4, rowH - fs * 0.5);
      ctx.strokeStyle = '#cc6644';
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.3, menuY - fs * 0.5, w * 0.4, rowH - fs * 0.5);
    }
    ctx.fillStyle = sel1 ? '#ffffff' : '#8899aa';
    ctx.font = (sel1 ? 'bold ' : '') + Math.round(fs * 1.5) + 'px Segoe UI';
    ctx.fillText('NEW GAME', w / 2, menuY + fs * 1.0);
    ctx.fillStyle = '#664';
    ctx.font = Math.round(fs * 0.7) + 'px Segoe UI';
    ctx.fillText('Start fresh (keeps legacy)', w / 2, menuY + fs * 2.0);

    // Reset World
    menuY += rowH;
    var sel2 = this._menuCursor === 2;
    if (sel2) {
      ctx.fillStyle = 'rgba(60,20,20,0.5)';
      ctx.fillRect(w * 0.3, menuY - fs * 0.5, w * 0.4, rowH - fs * 0.5);
      ctx.strokeStyle = '#aa2222';
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.3, menuY - fs * 0.5, w * 0.4, rowH - fs * 0.5);
    }
    ctx.fillStyle = sel2 ? '#ffffff' : '#776666';
    ctx.font = (sel2 ? 'bold ' : '') + Math.round(fs * 1.2) + 'px Segoe UI';
    ctx.fillText('RESET WORLD', w / 2, menuY + fs * 1.0);
    ctx.fillStyle = '#644';
    ctx.font = Math.round(fs * 0.7) + 'px Segoe UI';
    ctx.fillText('Erase everything — new world seed, no legacy', w / 2, menuY + fs * 2.0);

    // Controls — positioned after menu content
    ctx.fillStyle = '#445';
    ctx.font = Math.round(fs * 0.8) + 'px Segoe UI';
    ctx.fillText('\u2191\u2193 Select    ENTER to choose', w / 2, controlsY + fs);

    // Pulsing prompt
    var prompts = ['ENTER to continue', 'ENTER to start new', 'ENTER to reset world'];
    ctx.fillStyle = '#aab';
    ctx.font = 'bold ' + Math.round(fs * 1.1) + 'px Segoe UI';
    ctx.globalAlpha = 0.5 + Math.sin(game.animTimer * 3) * 0.3 + 0.2;
    ctx.fillText(prompts[this._menuCursor], w / 2, h * 0.93);
    ctx.globalAlpha = 1;
  },
};
