
// ============================================================
// STATE: Playing (overworld + dungeon)
// ============================================================
var PlayingState = {
  name: 'playing',
  drawBelow: false,

  onKey: function(game, key) {
    if (!game.turnReady) return true;

    if (key === 'Tab') { game.showMinimap = !game.showMinimap; return true; }
    if (key === 'e' || key === 'E') { game.interactAdjacent(); return true; }
    if (key === 'i' || key === 'I') { StateStack.push(InventoryState); return true; }
    if (key === 'p' || key === 'P') {
      var p = game.player;
      if (p.hp >= p.maxHp) { GameUtils.addLog('Already at full HP.', '#888'); return true; }
      // Priority: health_potion > potions > food items
      var consumed = false;
      // Consumable items: id -> { heal (flat or % of maxHp), name, color }
      var consumables = [
        { id: 'health_potion', healPct: 0.5,  name: 'Health Potion', color: '#ff4488' },
        { id: 'feast',         healFlat: 50,   name: 'Grand Feast',   color: '#ffcc44' },
        { id: 'healing_salve', healFlat: 15,   name: 'Healing Salve', color: '#44dd88' },
        { id: 'antidote',      healFlat: 10,   name: 'Antidote',      color: '#88ddaa' },
        { id: 'sushi',         healFlat: 30,   name: 'Sushi',         color: '#f0e8c8' },
        { id: 'berry_pie',     healFlat: 18,   name: 'Berry Pie',     color: '#aa44aa' },
        { id: 'fish_stew',     healFlat: 20,   name: 'Fish Stew',     color: '#cc6633' },
        { id: 'veggie_stew',   healFlat: 15,   name: 'Veggie Stew',   color: '#88aa44' },
        { id: 'carrot_stew',  healFlat: 14,   name: 'Carrot Stew',   color: '#dd7722' },
        { id: 'mushroom_soup', healFlat: 12,   name: 'Mushroom Soup', color: '#887744' },
        { id: 'roast_meat',    healFlat: 10,   name: 'Roast Meat',    color: '#cc6633' },
        { id: 'bread',         healFlat: 8,    name: 'Bread',         color: '#ddaa55' },
        { id: 'dried_fish',    healFlat: 8,    name: 'Dried Fish',    color: '#aa8855' },
        { id: 'carrot',        healFlat: 5,    name: 'Carrot',        color: '#ee8833' },
        { id: 'wild_berry',    healFlat: 3,    name: 'Wild Berry',    color: '#8833aa' },
        { id: 'wheat',         healFlat: 2,    name: 'Wheat',         color: '#ddcc55' },
      ];
      // Try old potion system first (legacy dungeon potions)
      if (p.potions > 0) {
        p.potions--;
        var heal = Math.round(p.maxHp * 0.35);
        p.hp = Math.min(p.hp + heal, p.maxHp);
        SFX.heal();
        GameUtils.addLog('Potion! +' + heal + ' HP (' + p.potions + ' left)', '#ff44aa');
        GameUtils.addFloating(p.x, p.y, '+' + heal, '#ff44aa');
        game.vfx.heal(p.x * CONFIG.TILE + CONFIG.TILE / 2, p.y * CONFIG.TILE + CONFIG.TILE / 2, { color: '#ff44aa' });
        consumed = true;
      } else {
        // Try consumable items from bag (best first)
        for (var ci = 0; ci < consumables.length; ci++) {
          var c = consumables[ci];
          if (Bag.has(p.bag, c.id)) {
            Bag.remove(p.bag, c.id, 1);
            var heal = c.healPct ? Math.round(p.maxHp * c.healPct) : c.healFlat;
            p.hp = Math.min(p.hp + heal, p.maxHp);
            SFX.heal();
            GameUtils.addLog('Ate ' + c.name + '! +' + heal + ' HP', c.color);
            GameUtils.addFloating(p.x, p.y, '+' + heal, c.color);
            game.vfx.heal(p.x * CONFIG.TILE + CONFIG.TILE / 2, p.y * CONFIG.TILE + CONFIG.TILE / 2, { color: c.color });
            consumed = true;
            break;
          }
        }
      }
      if (consumed) { game.endTurn(); }
      else { GameUtils.addLog('Nothing to eat or drink!', '#888'); }
      return true;
    }
    if (key >= '1' && key <= '4') {
      var idx = parseInt(key) - 1;
      if (game.abilityTargetMode && game.selectedAbility === idx) {
        game.abilityTargetMode = false; game.selectedAbility = -1;
        GameUtils.addLog('Cancelled.', '#888'); return true;
      }
      if (idx < game.player.abilities.length) {
        var ab = game.player.abilities[idx];
        if (ab.currentCooldown > 0) { GameUtils.addLog(ab.name + ' on cooldown (' + ab.currentCooldown + ')', ab.color); return true; }
        if (ab.verb === 'dash') { game.abilityTargetMode = true; game.selectedAbility = idx; GameUtils.addLog('Direction for ' + ab.name + '?', ab.color); }
        else if (ab.shape === 'self' || ab.shape === 'ring') { game.useAbility(idx, game.player.lastDir.x, game.player.lastDir.y); }
        else { game.abilityTargetMode = true; game.selectedAbility = idx; GameUtils.addLog('Direction for ' + ab.name + '?', ab.color); }
      }
      return true;
    }
    if (key === 'Escape') {
      if (game.abilityTargetMode) { game.abilityTargetMode = false; game.selectedAbility = -1; }
      return true;
    }
    if (GameEvents.fire('keyDown', game, key)) return true;

    var dx = 0, dy = 0;
    if (key === 'ArrowUp' || key === 'w') dy = -1;
    else if (key === 'ArrowDown' || key === 's') dy = 1;
    else if (key === 'ArrowLeft' || key === 'a') dx = -1;
    else if (key === 'ArrowRight' || key === 'd') dx = 1;
    else if (key === '5' || key === '.' || key === ' ') { game.endTurn(); return true; }
    else return false;

    if (game.abilityTargetMode) {
      game.useAbility(game.selectedAbility, dx, dy);
      game.abilityTargetMode = false; game.selectedAbility = -1;
      return true;
    }
    if (dx !== 0 || dy !== 0) game.player.lastDir = { x: dx, y: dy };
    if (game.player.mode === 'overworld' || game.player.mode === 'underground') game.doOverworldMove(dx, dy);
    else game.doPlayerMove(dx, dy);
    return true;
  },
};
