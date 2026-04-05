
// ============================================================
// STATE: Dialogue — conversation with choices
// ============================================================

// Build dialogue for an NPC based on their state and context
function buildNpcDialogue(npc, game) {
  var lines = [];
  var choices = [];

  lines.push({ text: npc.name, color: '#ffcc88', bold: true });

  // Merchant NPC — trade dialogue
  if (npc.isMerchant) {
    lines.push({ text: npc.townName + ' ' + npc.townType, color: '#aa9966' });
    lines.push({ text: '"What have you got for me?"', color: '#ccc' });

    // Show what they buy
    var buyPrices = typeof TOWN_BUY_PRICES !== 'undefined' ? TOWN_BUY_PRICES[npc.townType] : null;
    if (buyPrices) {
      var hasSellable = false;
      for (var id in buyPrices) {
        if ((game.player.bag[id] || 0) > 0) { hasSellable = true; break; }
      }
      // Also check caravan
      if (!hasSellable && typeof CaravanManager !== 'undefined' && CaravanManager.caravan &&
          CaravanManager.caravan.deployed && CaravanManager.caravan.hitched) {
        for (var id in buyPrices) {
          if ((CaravanManager.caravan.cargo[id] || 0) > 0) { hasSellable = true; break; }
        }
      }
      if (hasSellable) {
        choices.push({ text: 'Sell my goods', key: 'y', action: 'merchant_sell' });
      } else {
        lines.push({ text: '"Nothing I want to buy today."', color: '#888' });
      }
    }

    // Show what they sell
    var sellItems = typeof TOWN_SELL_ITEMS !== 'undefined' ? TOWN_SELL_ITEMS[npc.townType] : null;
    if (sellItems && sellItems.length > 0) {
      var gold = game.player.bag.gold_coin || 0;
      for (var si = 0; si < sellItems.length; si++) {
        var sItem = sellItems[si];
        var affordable = gold >= sItem.price;
        choices.push({
          text: 'Buy ' + sItem.name + ' (' + sItem.price + 'g)' + (affordable ? '' : ' - need more gold'),
          key: '' + (si + 1),
          action: 'merchant_buy_' + si,
        });
      }
      lines.push({ text: 'Your gold: ' + gold + 'g', color: '#ffcc22' });
    }

    choices.push({ text: 'Goodbye.', key: 'n', action: 'close' });
    return { lines: lines, choices: choices };
  }

  if (!npc.resident) {
    // Traveller dialogue
    var greetings = [
      "I've been walking for days. Know any place to rest?",
      "The road is long and my feet are tired.",
      "Interesting place you've found here.",
      "I'm a traveller. Seen many lands, I have.",
      "Got any work? I'm handy with my hands.",
    ];
    lines.push({ text: greetings[Math.floor(Math.random() * greetings.length)], color: '#ccc' });

    // Show skills — one per line to avoid overflow
    var hasSkills = false;
    for (var s in npc.skills) {
      if (npc.skills[s] > 0) {
        if (!hasSkills) { lines.push({ text: 'Skills:', color: '#999' }); hasSkills = true; }
        var dots = '';
        for (var d = 0; d < npc.skills[s]; d++) dots += '\u2605';
        lines.push({ text: '  ' + s + ' ' + dots, color: '#aaa' });
      }
    }

    // Offer to hire if there's a vacant home
    var vacantHomes = BuildingManager.getVacantHomes();
    if (vacantHomes.length > 0) {
      choices.push({ text: 'Would you like to live here?', key: 'y', action: 'hire' });
    }
    choices.push({ text: 'Safe travels.', key: 'n', action: 'close' });
  } else {
    // Resident dialogue
    var homeLines = [
      "Good day! The village is coming along nicely.",
      "I feel at home here. Thank you.",
      "Need anything? I'm happy to help.",
      "Another fine day in our little settlement.",
    ];
    lines.push({ text: homeLines[Math.floor(Math.random() * homeLines.length)], color: '#ccc' });

    if (npc.job) {
      lines.push({ text: "I'm working as a " + npc.job + ".", color: '#aaa' });
    }

    choices.push({ text: 'Carry on.', key: 'n', action: 'close' });
  }

  return { lines: lines, choices: choices };
}

var DialogueState = {
  name: 'dialogue',
  drawBelow: true,
  _dialogue: null,

  onEnter: function(game) {
    var npc = game._talkingNpc;
    if (!npc) { StateStack.pop(); return; }
    this._dialogue = buildNpcDialogue(npc, game);
  },

  onKey: function(game, key) {
    var d = this._dialogue;
    if (!d) { StateStack.pop(); return true; }
    var lk = key.toLowerCase();

    // Check choices
    for (var i = 0; i < d.choices.length; i++) {
      var choice = d.choices[i];
      // Match by key letter or by number (1,2,3...)
      if (lk === choice.key || lk === '' + (i + 1)) {
        if (choice.action === 'hire') {
          this._hireNpc(game, game._talkingNpc);
        } else if (choice.action === 'merchant_sell') {
          this._merchantSell(game, game._talkingNpc);
          // Refresh dialogue to update gold/inventory
          this._dialogue = buildNpcDialogue(game._talkingNpc, game);
          return true; // don't close — let them buy too
        } else if (choice.action.indexOf('merchant_buy_') === 0) {
          var buyIdx = parseInt(choice.action.replace('merchant_buy_', ''), 10);
          this._merchantBuy(game, game._talkingNpc, buyIdx);
          this._dialogue = buildNpcDialogue(game._talkingNpc, game);
          return true; // don't close
        } else if (choice.action !== 'close') {
          // Dispatch to event system — any system can handle custom actions
          GameEvents.fire('dialogueAction', game, choice.action, game._talkingNpc);
        }
        this._close(game);
        return true;
      }
    }

    // Enter triggers the first choice (for mobile YES button)
    if (lk === 'enter' || lk === ' ') {
      if (d.choices.length > 0) {
        var first = d.choices[0];
        if (first.action === 'hire') {
          this._hireNpc(game, game._talkingNpc);
        } else if (first.action === 'merchant_sell') {
          this._merchantSell(game, game._talkingNpc);
          this._dialogue = buildNpcDialogue(game._talkingNpc, game);
          return true;
        } else if (first.action.indexOf('merchant_buy_') === 0) {
          var buyIdx = parseInt(first.action.replace('merchant_buy_', ''), 10);
          this._merchantBuy(game, game._talkingNpc, buyIdx);
          this._dialogue = buildNpcDialogue(game._talkingNpc, game);
          return true;
        } else if (first.action !== 'close') {
          GameEvents.fire('dialogueAction', game, first.action, game._talkingNpc);
        }
      }
      this._close(game);
      return true;
    }
    // Escape always closes
    if (lk === 'escape') {
      this._close(game);
      return true;
    }
    return true;
  },

  _hireNpc: function(game, npc) {
    var homes = BuildingManager.getVacantHomes();
    if (homes.length === 0) {
      GameUtils.addLog('No vacant homes available.', '#cc4444');
      return;
    }
    var home = homes[0];
    npc.resident = true;
    npc.home = { x: home.x + 1, y: home.y + 2 }; // stand at door
    home.occupant = npc.name;
    npc.speed = 0.2; // residents move slower

    // Assign job based on best skill
    var bestSkill = '', bestLevel = 0;
    for (var s in npc.skills) {
      if (npc.skills[s] > bestLevel) { bestLevel = npc.skills[s]; bestSkill = s; }
    }
    if (bestLevel > 0) npc.job = bestSkill;

    SFX.shrine();
    GameUtils.addLog(npc.name + ' has moved in!', '#44dd88');
    GameUtils.addLog('Assigned to home at ' + home.x + ',' + home.y, '#888');
    GameEvents.fire('npcHired', game, npc, home);
  },

  _merchantSell: function(game, npc) {
    if (!npc || !npc.isMerchant) return;
    var prices = typeof TOWN_BUY_PRICES !== 'undefined' ? TOWN_BUY_PRICES[npc.townType] : null;
    if (!prices) return;
    var p = game.player;
    var totalGold = 0;

    // Sell from player bag and hitched caravan
    var bags = [p.bag];
    if (typeof CaravanManager !== 'undefined' && CaravanManager.caravan &&
        CaravanManager.caravan.deployed && CaravanManager.caravan.hitched) {
      bags.push(CaravanManager.caravan.cargo);
    }

    for (var b = 0; b < bags.length; b++) {
      var bag = bags[b];
      for (var itemId in prices) {
        var count = bag[itemId] || 0;
        if (count > 0) {
          Bag.remove(bag, itemId, count);
          totalGold += count * prices[itemId];
        }
      }
    }

    if (totalGold > 0) {
      Bag.add(p.bag, 'gold_coin', totalGold);
      SFX.shrine();
      GameUtils.addLog('Sold ' + totalGold + 'g worth of goods!', '#ffcc22');
    }
  },

  _merchantBuy: function(game, npc, itemIdx) {
    if (!npc || !npc.isMerchant) return;
    var sells = typeof TOWN_SELL_ITEMS !== 'undefined' ? TOWN_SELL_ITEMS[npc.townType] : null;
    if (!sells || !sells[itemIdx]) return;
    var item = sells[itemIdx];
    var p = game.player;
    var gold = p.bag.gold_coin || 0;

    if (gold < item.price) {
      GameUtils.addLog('Not enough gold! Need ' + item.price + 'g.', '#cc4444');
      return;
    }

    Bag.remove(p.bag, 'gold_coin', item.price);
    Bag.add(p.bag, item.id, 1);
    SFX.shrine();
    GameUtils.addLog('Bought ' + item.name + ' for ' + item.price + 'g!', '#88ffaa');
  },

  _close: function(game) {
    game._talkingNpc = null;
    this._dialogue = null;
    StateStack.pop();
  },

  onDraw: function(game, ctx) {
    var npc = game._talkingNpc;
    var d = this._dialogue;
    if (!npc || !d) return;
    var w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
    var fs = Math.max(11, Math.round(w * 0.013));

    // Count total content lines to size box properly
    var totalLines = d.lines.length + d.choices.length + 1; // +1 for divider gap
    var maxH = h * 0.6; // box uses at most 60% of screen
    var lineH = Math.min(fs * 1.4, maxH / totalLines);
    var contentFs = Math.min(fs, lineH * 0.85);

    var portSize = Math.min(50, h * 0.08);
    var boxW = Math.min(w * 0.75, 560);
    var boxH = totalLines * lineH + fs * 2;
    if (boxH > maxH) boxH = maxH;
    var bx = (w - boxW) / 2, by = h - boxH - 15;

    // Box
    ctx.fillStyle = 'rgba(10,8,15,0.95)';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = '#665544';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, boxW, boxH);

    // Portrait
    var portX = bx + 8, portY = by + 8;
    ctx.fillStyle = 'rgba(20,18,25,0.8)';
    ctx.fillRect(portX, portY, portSize, portSize);
    drawCharPixel(ctx, portX, portY, portSize, npc.bodyColor, '#443322', npc.skinColor, null, 0,
      { hairStyle: npc.hairStyle, hairColor: npc.hairColor, body: npc.body,
        height: npc.height, frame: npc.frame });

    // Text — all within box bounds
    var textX = bx + portSize + 20;
    var maxTextW = boxW - portSize - 30;
    var ty = by + lineH;
    var boxBottom = by + boxH - fs * 0.5;
    ctx.textAlign = 'left';

    for (var i = 0; i < d.lines.length; i++) {
      if (ty > boxBottom) break;
      var line = d.lines[i];
      ctx.fillStyle = line.color || '#ccc';
      ctx.font = (line.bold ? 'bold ' : '') + contentFs + 'px Segoe UI';
      var lineText = line.text;
      while (lineText.length > 3 && ctx.measureText(lineText).width > maxTextW) {
        lineText = lineText.slice(0, -4) + '...';
      }
      ctx.fillText(lineText, textX, ty);
      ty += lineH;
    }

    // Divider
    ty += lineH * 0.2;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(textX, ty); ctx.lineTo(textX + maxTextW, ty); ctx.stroke();
    ty += lineH * 0.5;

    // Choices
    for (var i = 0; i < d.choices.length; i++) {
      if (ty > boxBottom) break;
      ctx.fillStyle = '#ddaa44';
      ctx.font = 'bold ' + contentFs + 'px Segoe UI';
      var keyLabel = '[' + d.choices[i].key.toUpperCase() + '] ';
      ctx.fillText(keyLabel, textX, ty);
      ctx.fillStyle = '#ccccaa';
      ctx.font = contentFs + 'px Segoe UI';
      var choiceText = d.choices[i].text;
      var choiceX = textX + contentFs * 2;
      while (choiceText.length > 3 && ctx.measureText(choiceText).width > maxTextW - contentFs * 2) {
        choiceText = choiceText.slice(0, -4) + '...';
      }
      ctx.fillText(choiceText, choiceX, ty);
      ty += lineH;
    }
  },
};
