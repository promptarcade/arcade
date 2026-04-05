
// ============================================================
// STATE: Wardrobe — change appearance mid-game
// ============================================================
var WardrobeState = {
  name: 'wardrobe',
  drawBelow: false,
  _cursor: 0,
  _options: ['bodyColor','hairColor','hairStyle','skinColor','eyeColor','body','height','frame'],
  _labels: ['Outfit','Hair Color','Hair Style','Skin','Eyes','Build Type','Height','Frame'],

  onEnter: function(game) {
    this._cursor = 0;
  },

  _getArray: function(game, opt) {
    switch(opt) {
      case 'bodyColor': return game.BODY_COLORS;
      case 'hairColor': return game.HAIR_COLORS;
      case 'hairStyle': return game.HAIR_STYLES;
      case 'skinColor': return game.SKIN_COLORS;
      case 'eyeColor': return game.EYE_COLORS;
      case 'body': return game.BODIES;
      case 'height': return game.HEIGHTS;
      case 'frame': return game.FRAMES;
    }
    return [];
  },

  _getIdx: function(game, opt) {
    var arr = this._getArray(game, opt);
    var val = game.player[opt];
    var idx = arr.indexOf(val);
    return idx >= 0 ? idx : 0;
  },

  onKey: function(game, key) {
    var lk = key.toLowerCase();
    if (lk === 'escape' || lk === 'i') {
      StateStack.pop();
      return true;
    }
    if (key === 'ArrowUp' || lk === 'w') {
      this._cursor = (this._cursor - 1 + this._options.length) % this._options.length;
      return true;
    }
    if (key === 'ArrowDown' || lk === 's') {
      this._cursor = (this._cursor + 1) % this._options.length;
      return true;
    }
    if (key === 'ArrowLeft' || lk === 'a') {
      var opt = this._options[this._cursor];
      var arr = this._getArray(game, opt);
      var idx = (this._getIdx(game, opt) - 1 + arr.length) % arr.length;
      game.player[opt] = arr[idx];
      return true;
    }
    if (key === 'ArrowRight' || lk === 'd') {
      var opt = this._options[this._cursor];
      var arr = this._getArray(game, opt);
      var idx = (this._getIdx(game, opt) + 1) % arr.length;
      game.player[opt] = arr[idx];
      return true;
    }
    return true;
  },

  onDraw: function(game, ctx) {
    var w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
    var fs = Math.max(12, Math.round(w * 0.013));
    var p = game.player;

    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = '#aa88cc';
    ctx.font = 'bold ' + Math.round(fs * 1.6) + 'px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('WARDROBE', w / 2, fs * 2.5);
    ctx.fillStyle = '#888';
    ctx.font = Math.round(fs * 0.8) + 'px Segoe UI';
    ctx.fillText('\u2190\u2192 change    \u2191\u2193 select    [ESC] back', w / 2, fs * 4);

    // Character preview — right side, extra headroom for tall/hair
    var previewTs = Math.min(w * 0.18, 140);
    var boxPW = previewTs * 1.6, boxPH = previewTs * 2.0;
    var boxPX = w * 0.63, boxPY = h * 0.2;
    ctx.fillStyle = 'rgba(30,25,35,0.8)';
    ctx.fillRect(boxPX, boxPY, boxPW, boxPH);
    ctx.strokeStyle = '#554466';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxPX, boxPY, boxPW, boxPH);

    // Draw character — offset downward so hair/tall heads don't clip top
    var charX = boxPX + (boxPW - previewTs) / 2;
    var charY = boxPY + boxPH - previewTs - previewTs * 0.15;
    var walkPhase = (game.animTimer * 0.5) % 1;
    drawCharPixel(ctx, charX, charY, previewTs,
      p.bodyColor, p.eyeColor, p.skinColor, p.weapon ? p.weapon.color || '#aaa' : null,
      walkPhase, {
        hairStyle: p.hairStyle, hairColor: p.hairColor,
        body: p.body, height: p.height, frame: p.frame,
        weaponType: p.weaponType
      });

    // Options list — left side
    var listX = w * 0.08;
    var ty = fs * 6;
    var rowH = fs * 2.5;

    ctx.textAlign = 'left';
    for (var i = 0; i < this._options.length; i++) {
      var opt = this._options[i];
      var arr = this._getArray(game, opt);
      var idx = this._getIdx(game, opt);
      var selected = i === this._cursor;
      var val = p[opt] || (opt === 'body' ? 'broad' : opt === 'height' ? 'average' : opt === 'frame' ? 'average' : opt === 'hairStyle' ? 'short' : '');

      // Highlight
      if (selected) {
        ctx.fillStyle = 'rgba(60, 40, 60, 0.6)';
        ctx.fillRect(listX - 4, ty - fs * 0.8, w * 0.45, rowH - 4);
        ctx.strokeStyle = '#aa88cc';
        ctx.lineWidth = 1;
        ctx.strokeRect(listX - 4, ty - fs * 0.8, w * 0.45, rowH - 4);
      }

      // Label
      ctx.fillStyle = selected ? '#fff' : '#888';
      ctx.font = (selected ? 'bold ' : '') + fs + 'px Segoe UI';
      ctx.fillText(this._labels[i], listX, ty + fs * 0.2);

      // Value with arrows
      var valX = listX + fs * 10;
      if (selected) {
        ctx.fillStyle = '#aa88cc';
        ctx.font = fs + 'px Segoe UI';
        ctx.fillText('\u25C0', valX - fs * 1.5, ty + fs * 0.2);
        ctx.fillText('\u25B6', valX + fs * 10, ty + fs * 0.2);
      }

      // Display value
      if (opt === 'bodyColor' || opt === 'hairColor' || opt === 'skinColor' || opt === 'eyeColor') {
        // Color swatch
        ctx.fillStyle = val;
        ctx.fillRect(valX, ty - fs * 0.5, fs * 2, fs * 1.2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(valX, ty - fs * 0.5, fs * 2, fs * 1.2);
        ctx.fillStyle = '#aaa';
        ctx.font = Math.round(fs * 0.7) + 'px Segoe UI';
        ctx.fillText((idx + 1) + '/' + arr.length, valX + fs * 2.5, ty + fs * 0.2);
      } else {
        ctx.fillStyle = selected ? '#cc99ee' : '#aaa';
        ctx.font = fs + 'px Segoe UI';
        ctx.fillText(val.charAt(0).toUpperCase() + val.slice(1), valX, ty + fs * 0.2);
      }

      ty += rowH;
    }
  },
};
