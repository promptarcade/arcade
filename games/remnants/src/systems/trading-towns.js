
// ============================================================
// SYSTEM: Trading Towns — seeded settlements with merchants
// ============================================================

// Gold currency
ResourceRegistry.add({ id: 'gold_coin', name: 'Gold', color: '#ffcc22', category: 'currency', stackMax: 9999 });

// Gem resource (sold by smithy merchants)
ResourceRegistry.add({ id: 'gem', name: 'Gem', color: '#44ddff', category: 'material', stackMax: 99 });

// Town name generation
var TOWN_PREFIXES = ['Oak','Stone','River','Wind','Iron','Salt','Amber','Frost'];
var TOWN_SUFFIXES = ['haven','ford','gate','hollow','reach','vale','watch','bridge'];

function _townRng(seed, offset) {
  var x = Math.sin(seed * 7 + offset * 31) * 43758.5453;
  return x - Math.floor(x);
}

// Buy prices by town type
var TOWN_BUY_PRICES = {
  market:  { dried_fish: 3, fish_stew: 8, sushi: 15, wild_berry: 1, carrot: 2, wheat: 1, healing_salve: 5, health_potion: 12 },
  smithy:  { stone_axe: 5, iron_axe: 15, copper_bar: 4, iron_bar: 8, gold_bar: 20, plank: 2, stone_pickaxe: 5, iron_pickaxe: 15 },
  outpost: { leather: 3, branch: 1, oak_log: 2, stone: 1, clay_brick: 3, flint: 2 },
  port:    { trout: 2, salmon: 5, golden_carp: 15, dried_fish: 4 },
};

// Items merchants sell
var TOWN_SELL_ITEMS = {
  market:  [{ id: 'health_potion', price: 20, name: 'Health Potion' }],
  smithy:  [{ id: 'gem', price: 15, name: 'Gem' }],
  outpost: [{ id: 'saddle', price: 25, name: 'Saddle' }],
  port:    [{ id: 'saddle', price: 25, name: 'Saddle' }],
};

var MERCHANT_NAMES = {
  market:  ['Martha','Greta','Hilda','Ingrid'],
  smithy:  ['Bjorn','Hagar','Thorin','Gunnar'],
  outpost: ['Rodrick','Wulf','Garth','Brynn'],
  port:    ['Coral','Nemo','Skipper','Marina'],
};

var TOWN_TYPES = ['market','smithy','outpost','port'];

var TradingTownManager = {
  generated: {},   // 'x,y' -> true
  approached: {},  // 'x,y' -> true
  _locations: null,

  getTownLocations: function() {
    if (this._locations) return this._locations;
    var seed = Overworld.seed || 42;
    var dirs = [{dx:0,dy:-1},{dx:1,dy:0},{dx:0,dy:1},{dx:-1,dy:0}];
    var locs = [];
    for (var i = 0; i < 4; i++) {
      var d = dirs[i];
      var dist = 40 + Math.floor(_townRng(seed, i * 17) * 21);
      var jitter = Math.floor(_townRng(seed, i * 23 + 5) * 17) - 8;
      var tx = d.dx === 0 ? jitter : d.dx * dist;
      var ty = d.dy === 0 ? jitter : d.dy * dist;
      var prefix = TOWN_PREFIXES[Math.floor(_townRng(seed, i * 31) * TOWN_PREFIXES.length)];
      var suffix = TOWN_SUFFIXES[Math.floor(_townRng(seed, i * 47) * TOWN_SUFFIXES.length)];
      locs.push({ x: tx, y: ty, name: prefix + suffix, type: TOWN_TYPES[i] });
    }
    this._locations = locs;
    return locs;
  },

  generateTown: function(town) {
    var key = town.x + ',' + town.y;
    if (this.generated[key]) return;
    this.generated[key] = true;

    var cx = town.x, cy = town.y;
    // 5x5 layout: stone walls around edge, cobblestone inside, doors at midpoints
    for (var dy = -2; dy <= 2; dy++) {
      for (var dx = -2; dx <= 2; dx++) {
        var wx = cx + dx, wy = cy + dy;
        var isEdge = (Math.abs(dx) === 2 || Math.abs(dy) === 2);
        if (isEdge) {
          var isDoor = (dx === 0 && Math.abs(dy) === 2) || (dy === 0 && Math.abs(dx) === 2);
          Overworld.setTile(wx, wy, isDoor ? 202 : 204); // door or stone wall
        } else {
          Overworld.setTile(wx, wy, 206); // cobblestone
        }
      }
    }
    // Market stall at center
    Overworld.setTile(cx, cy, 209);

    // Spawn merchant NPCs
    var seed = Overworld.seed || 42;
    var count = 1 + Math.floor(_townRng(seed, town.x * 7 + town.y * 13 + 11));
    if (count > 2) count = 2;
    var names = MERCHANT_NAMES[town.type] || MERCHANT_NAMES.market;

    for (var i = 0; i < count; i++) {
      var mx = cx + (i === 0 ? 1 : -1), my = cy;
      var nameIdx = Math.floor(_townRng(seed, town.x + i * 37 + 19) * names.length);
      var npc = new NPC(mx, my, { name: names[nameIdx], bodyColor: '#e8c840' });
      npc.isMerchant = true;
      npc.townType = town.type;
      npc.townName = town.name;
      npc.resident = true;
      npc.home = { x: mx, y: my };
      npc.talkable = true;
      NPCManager.add(npc);
    }

    GameUtils.addLog(town.name + ' discovered!', '#ddcc88');
  },
};

// Proximity check — generate towns as player approaches
GameEvents.on('playerMove', function(game, nx, ny) {
  if (game.player.mode !== 'overworld') return;
  var towns = TradingTownManager.getTownLocations();
  for (var i = 0; i < towns.length; i++) {
    var t = towns[i];
    var dist = Math.abs(nx - t.x) + Math.abs(ny - t.y);
    var key = t.x + ',' + t.y;

    if (dist <= 30 && !TradingTownManager.generated[key]) {
      TradingTownManager.generateTown(t);
    }
    if (dist <= 15 && !TradingTownManager.approached[key]) {
      TradingTownManager.approached[key] = true;
      GameUtils.addLog('You see ' + t.name + ' in the distance.', '#ddcc88');
    }
    if (dist > 20 && TradingTownManager.approached[key]) {
      TradingTownManager.approached[key] = false;
    }
  }
});

// Merchant trade is handled by DialogueState — it reads TOWN_BUY_PRICES
// and TOWN_SELL_ITEMS directly (they're globals defined above).;

// Buy/sell now handled via DialogueState choices directly.

// Draw town name labels — draw:world has camera transform applied
GameEvents.on('draw:world', function(game, ctx) {
  if (game.player.mode !== 'overworld') return;
  var ts = CONFIG.TILE;
  var px = game.player.x, py = game.player.y;
  var towns = TradingTownManager.getTownLocations();

  for (var i = 0; i < towns.length; i++) {
    var t = towns[i];
    if (Math.abs(t.x - px) > CONFIG.VIEW_W + 5 || Math.abs(t.y - py) > CONFIG.VIEW_H + 5) continue;
    if (!TradingTownManager.generated[t.x + ',' + t.y]) continue;

    var labelX = t.x * ts + ts / 2;
    var labelY = (t.y - 3) * ts;
    // Shadow
    ctx.fillStyle = '#000';
    ctx.font = 'bold ' + Math.max(8, Math.round(ts * 0.3)) + 'px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(t.name, labelX + 1, labelY + 1);
    // Text
    ctx.fillStyle = '#ddcc88';
    ctx.fillText(t.name, labelX, labelY);
    // Type subtitle
    ctx.fillStyle = '#aa9966';
    ctx.font = Math.max(7, Math.round(ts * 0.22)) + 'px Segoe UI';
    ctx.fillText(t.type.charAt(0).toUpperCase() + t.type.slice(1), labelX, labelY + Math.round(ts * 0.35));
  }
});

// Save/load
SaveSystem.register('tradingTowns', {
  save: function() {
    return { generated: TradingTownManager.generated, approached: TradingTownManager.approached };
  },
  load: function(data) {
    if (!data) return;
    TradingTownManager.generated = data.generated || {};
    TradingTownManager.approached = data.approached || {};
    TradingTownManager._locations = null; // recalculate from seed
  },
});
