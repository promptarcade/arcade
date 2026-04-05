
// ============================================================
// SYSTEM: Building — place structures on the overworld
// ============================================================

// Blueprint registry
var BlueprintRegistry = {
  _blueprints: [],
  add: function(bp) { this._blueprints.push(bp); },
  all: function() { return this._blueprints; },
  get: function(id) {
    for (var i = 0; i < this._blueprints.length; i++)
      if (this._blueprints[i].id === id) return this._blueprints[i];
    return null;
  },
};

// Building tile types
var T_BUILDING_FLOOR = TileRegistry.add({
  id: 200, name: 'building_floor', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var hash = (((wx||0) * 4517 + (wy||0) * 7321) >>> 0);
    ctx.fillStyle = shadeHex('#6a5a40', ((hash % 7) - 3) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Plank lines
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = Math.max(0.5, m * 0.3);
    for (var i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(sx, sy + i * 4 * m); ctx.lineTo(sx + ts, sy + i * 4 * m); ctx.stroke();
    }
  },
});

var T_BUILDING_WALL = TileRegistry.add({
  id: 201, name: 'building_wall', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var hash = (((wx||0) * 3119 + (wy||0) * 5813) >>> 0);
    // Wooden wall
    ctx.fillStyle = shadeHex('#5a4a30', ((hash % 7) - 3) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    ctx.fillStyle = shadeHex('#5a4a30', 15);
    ctx.fillRect(sx, sy, ts, Math.round(ts * 0.25));
    // Horizontal beam
    ctx.fillStyle = '#4a3a20';
    ctx.fillRect(sx, sy + 7 * m, ts, 2 * m);
    // Vertical planks
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = Math.max(0.5, m * 0.3);
    ctx.beginPath(); ctx.moveTo(sx + 5 * m, sy); ctx.lineTo(sx + 5 * m, sy + ts); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 11 * m, sy); ctx.lineTo(sx + 11 * m, sy + ts); ctx.stroke();
  },
});

var T_DOOR = TileRegistry.add({
  id: 202, name: 'door', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer) {
    var m = ts / 16;
    ctx.fillStyle = '#5a4a30'; ctx.fillRect(sx, sy, ts, ts);
    ctx.fillStyle = '#7a6a50'; ctx.fillRect(sx + 3 * m, sy + 2 * m, 10 * m, 12 * m);
    ctx.fillStyle = '#6a5a40'; ctx.fillRect(sx + 4 * m, sy + 3 * m, 8 * m, 10 * m);
    // Handle
    ctx.fillStyle = '#aa8844'; ctx.fillRect(sx + 10 * m, sy + 7 * m, 1.5 * m, 2 * m);
  },
});

var T_WORKBENCH = TileRegistry.add({
  id: 203, name: 'workbench', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    // Floor underneath
    var floorDraw = TileRegistry.getDrawer(T_BUILDING_FLOOR);
    if (floorDraw) floorDraw(ctx, sx, sy, ts, visible, animTimer, wx, wy);
    // Table top
    ctx.fillStyle = '#7a6a45';
    ctx.fillRect(sx + 2 * m, sy + 5 * m, 12 * m, 3 * m);
    ctx.fillStyle = '#6a5a35';
    ctx.fillRect(sx + 2 * m, sy + 7 * m, 12 * m, 1 * m);
    // Legs
    ctx.fillStyle = '#5a4a30';
    ctx.fillRect(sx + 3 * m, sy + 8 * m, 2 * m, 5 * m);
    ctx.fillRect(sx + 11 * m, sy + 8 * m, 2 * m, 5 * m);
    // Tools on top
    ctx.fillStyle = '#888888'; ctx.fillRect(sx + 5 * m, sy + 4 * m, 1 * m, 3 * m);
    ctx.fillStyle = '#aa8844'; ctx.fillRect(sx + 8 * m, sy + 4.5 * m, 3 * m, 1 * m);
  },
  onInteract: function(game, wx, wy) {
    GameUtils.addLog('Crafting not yet available.', '#888');
  },
});

// Stone building tiles — upgraded materials
var T_STONE_WALL = TileRegistry.add({
  id: 204, name: 'stone_wall', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 2917 + (wy||0) * 4721) >>> 0);
    ctx.fillStyle = shadeHex('#7a7570', ((h % 7) - 3) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Mortar lines — brick pattern
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = Math.max(0.5, m * 0.4);
    ctx.beginPath(); ctx.moveTo(sx, sy + 4 * m); ctx.lineTo(sx + ts, sy + 4 * m); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx, sy + 8 * m); ctx.lineTo(sx + ts, sy + 8 * m); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx, sy + 12 * m); ctx.lineTo(sx + ts, sy + 12 * m); ctx.stroke();
    // Offset vertical mortar
    var off = ((h >> 3) % 2) === 0 ? 0 : 4;
    ctx.beginPath(); ctx.moveTo(sx + (4 + off) * m, sy); ctx.lineTo(sx + (4 + off) * m, sy + 4 * m); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + (8 - off) * m, sy + 4 * m); ctx.lineTo(sx + (8 - off) * m, sy + 8 * m); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + (4 + off) * m, sy + 8 * m); ctx.lineTo(sx + (4 + off) * m, sy + 12 * m); ctx.stroke();
    // Top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(sx, sy, ts, 2 * m);
  },
});

var T_STONE_FLOOR = TileRegistry.add({
  id: 205, name: 'stone_floor', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 3371 + (wy||0) * 6143) >>> 0);
    ctx.fillStyle = shadeHex('#8a8580', ((h % 7) - 3) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Flagstone pattern
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = Math.max(0.5, m * 0.3);
    ctx.strokeRect(sx + 1, sy + 1, ts - 2, ts - 2);
    ctx.beginPath(); ctx.moveTo(sx + 8 * m, sy); ctx.lineTo(sx + 8 * m, sy + ts); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx, sy + 8 * m); ctx.lineTo(sx + ts, sy + 8 * m); ctx.stroke();
  },
});

// Cobblestone path — player-placed roads
var T_COBBLESTONE = TileRegistry.add({
  id: 206, name: 'cobblestone', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 5119 + (wy||0) * 3847) >>> 0);
    ctx.fillStyle = shadeHex('#706860', ((h % 7) - 3) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Individual cobbles
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = Math.max(0.3, m * 0.3);
    var cobbles = [
      [1,1,4,3],[5,0,5,4],[11,1,4,3],
      [0,5,4,3],[5,4,5,4],[11,5,4,3],
      [2,9,4,3],[6,8,5,4],[12,9,3,3],
      [0,12,5,3],[6,12,4,3],[11,13,4,2],
    ];
    for (var i = 0; i < cobbles.length; i++) {
      var c = cobbles[i];
      ctx.fillStyle = shadeHex('#706860', ((h >> (i + 2)) % 13) - 6);
      ctx.fillRect(sx + c[0] * m, sy + c[1] * m, c[2] * m, c[3] * m);
      ctx.strokeRect(sx + c[0] * m, sy + c[1] * m, c[2] * m, c[3] * m);
    }
  },
});

// Fence — low barrier
var T_FENCE = TileRegistry.add({
  id: 207, name: 'fence', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    // Ground first
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx || 0, wy || 0);
    // Fence posts
    ctx.fillStyle = '#6a5530';
    ctx.fillRect(sx + 2 * m, sy + 4 * m, 2 * m, 10 * m);
    ctx.fillRect(sx + 12 * m, sy + 4 * m, 2 * m, 10 * m);
    // Horizontal rails
    ctx.fillStyle = '#7a6540';
    ctx.fillRect(sx + 2 * m, sy + 5 * m, 12 * m, 1.5 * m);
    ctx.fillRect(sx + 2 * m, sy + 9 * m, 12 * m, 1.5 * m);
    // Highlights
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(sx + 2 * m, sy + 4 * m, 12 * m, 1 * m);
  },
});

// Well — decoration/water source
var T_WELL = TileRegistry.add({
  id: 208, name: 'well', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    // Ground
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx || 0, wy || 0);
    // Stone base (circular approximation)
    ctx.fillStyle = '#7a7570';
    ctx.fillRect(sx + 3 * m, sy + 5 * m, 10 * m, 8 * m);
    ctx.fillStyle = '#6a6560';
    ctx.fillRect(sx + 4 * m, sy + 4 * m, 8 * m, 10 * m);
    // Water inside
    ctx.fillStyle = '#2244aa';
    ctx.fillRect(sx + 5 * m, sy + 6 * m, 6 * m, 5 * m);
    var pulse = 0.5 + Math.sin(animTimer * 2) * 0.15;
    ctx.fillStyle = 'rgba(100,180,255,' + pulse.toFixed(2) + ')';
    ctx.fillRect(sx + 6 * m, sy + 7 * m, 4 * m, 3 * m);
    // Roof posts
    ctx.fillStyle = '#5a4a30';
    ctx.fillRect(sx + 4 * m, sy + 1 * m, 1.5 * m, 8 * m);
    ctx.fillRect(sx + 10.5 * m, sy + 1 * m, 1.5 * m, 8 * m);
    // Roof
    ctx.fillStyle = '#6a5a40';
    ctx.fillRect(sx + 3 * m, sy + 0 * m, 10 * m, 2 * m);
    ctx.fillStyle = '#5a4a30';
    ctx.fillRect(sx + 3 * m, sy + 2 * m, 10 * m, 0.5 * m);
  },
  light: { color: '#4488cc', radius: 1.5, intensity: 0.15 },
});

// Market stall — open-air trading post
var T_MARKET_STALL = TileRegistry.add({
  id: 209, name: 'market_stall', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    // Ground
    var floorDraw = TileRegistry.getDrawer(T_BUILDING_FLOOR);
    if (floorDraw) floorDraw(ctx, sx, sy, ts, visible, animTimer, wx, wy);
    // Counter
    ctx.fillStyle = '#7a6a45';
    ctx.fillRect(sx + 1 * m, sy + 7 * m, 14 * m, 3 * m);
    ctx.fillStyle = '#6a5a35';
    ctx.fillRect(sx + 1 * m, sy + 9 * m, 14 * m, 1 * m);
    // Awning poles
    ctx.fillStyle = '#5a4a30';
    ctx.fillRect(sx + 1 * m, sy + 1 * m, 1.5 * m, 9 * m);
    ctx.fillRect(sx + 13.5 * m, sy + 1 * m, 1.5 * m, 9 * m);
    // Striped awning
    ctx.fillStyle = '#cc4433';
    ctx.fillRect(sx + 0 * m, sy + 0 * m, 16 * m, 2.5 * m);
    ctx.fillStyle = '#eecc88';
    ctx.fillRect(sx + 0 * m, sy + 0 * m, 4 * m, 2.5 * m);
    ctx.fillRect(sx + 8 * m, sy + 0 * m, 4 * m, 2.5 * m);
    // Goods on counter
    ctx.fillStyle = '#ddaa44';
    ctx.fillRect(sx + 4 * m, sy + 6 * m, 2 * m, 2 * m);
    ctx.fillStyle = '#88cc44';
    ctx.fillRect(sx + 7 * m, sy + 6 * m, 2 * m, 2 * m);
    ctx.fillStyle = '#cc6633';
    ctx.fillRect(sx + 10 * m, sy + 6 * m, 2 * m, 2 * m);
  },
});

// Food store interior tile
var T_FOOD_STORE = TileRegistry.add({
  id: 211, name: 'food_store', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    // Floor
    var floorDraw = TileRegistry.getDrawer(T_BUILDING_FLOOR);
    if (floorDraw) floorDraw(ctx, sx, sy, ts, visible, animTimer, wx, wy);
    // Shelves
    ctx.fillStyle = '#6a5a40';
    ctx.fillRect(sx + 1 * m, sy + 2 * m, 14 * m, 1.5 * m);
    ctx.fillRect(sx + 1 * m, sy + 7 * m, 14 * m, 1.5 * m);
    // Food items on shelves
    ctx.fillStyle = '#ddaa44'; ctx.fillRect(sx + 2 * m, sy + 1 * m, 2 * m, 1.5 * m);  // bread
    ctx.fillStyle = '#cc6633'; ctx.fillRect(sx + 5 * m, sy + 0.5 * m, 2 * m, 2 * m);  // jar
    ctx.fillStyle = '#88cc44'; ctx.fillRect(sx + 8 * m, sy + 1 * m, 2 * m, 1.5 * m);  // veg
    ctx.fillStyle = '#ff6644'; ctx.fillRect(sx + 11 * m, sy + 0.5 * m, 2 * m, 2 * m); // fruit
    // Bottom shelf items
    ctx.fillStyle = '#8866aa'; ctx.fillRect(sx + 3 * m, sy + 5.5 * m, 2 * m, 2 * m);
    ctx.fillStyle = '#aa8855'; ctx.fillRect(sx + 7 * m, sy + 5.5 * m, 3 * m, 2 * m);
    ctx.fillStyle = '#44aa66'; ctx.fillRect(sx + 11 * m, sy + 5.5 * m, 2 * m, 2 * m);
    // Barrel
    ctx.fillStyle = '#5a4a30';
    ctx.fillRect(sx + 3 * m, sy + 10 * m, 4 * m, 5 * m);
    ctx.fillStyle = '#4a3a20';
    ctx.fillRect(sx + 3 * m, sy + 11.5 * m, 4 * m, 1 * m);
    ctx.fillRect(sx + 3 * m, sy + 13.5 * m, 4 * m, 1 * m);
    // Sack
    ctx.fillStyle = '#aa9970';
    ctx.fillRect(sx + 9 * m, sy + 11 * m, 4 * m, 4 * m);
    ctx.fillStyle = '#998860';
    ctx.fillRect(sx + 10 * m, sy + 10 * m, 2 * m, 1.5 * m);
  },
  onInteract: function(game, wx, wy) {
    // Deposit food into the store
    var building = BuildingManager.getAt(wx, wy);
    if (!building) return;
    if (!building.stored) building.stored = {};
    var deposited = 0;
    var foodIds = ['dried_fish','fish_stew','sushi','wild_berry','carrot','wheat','healing_salve','health_potion'];
    for (var i = 0; i < foodIds.length; i++) {
      var id = foodIds[i];
      var count = game.player.bag[id] || 0;
      if (count > 0) {
        var give = Math.ceil(count / 2); // deposit half
        Bag.remove(game.player.bag, id, give);
        building.stored[id] = (building.stored[id] || 0) + give;
        deposited += give;
      }
    }
    if (deposited > 0) {
      SFX.shrine();
      GameUtils.addLog('Stocked ' + deposited + ' food items.', '#ddaa44');
    } else {
      GameUtils.addLog('No food to stock. Gather and craft food!', '#888');
    }
  },
});

// Craft store interior tile
var T_CRAFT_STORE = TileRegistry.add({
  id: 212, name: 'craft_store', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    // Floor
    var floorDraw = TileRegistry.getDrawer(T_BUILDING_FLOOR);
    if (floorDraw) floorDraw(ctx, sx, sy, ts, visible, animTimer, wx, wy);
    // Display racks
    ctx.fillStyle = '#6a5a40';
    ctx.fillRect(sx + 1 * m, sy + 2 * m, 6 * m, 1.5 * m);
    ctx.fillRect(sx + 9 * m, sy + 2 * m, 6 * m, 1.5 * m);
    // Tools on display
    ctx.fillStyle = '#888888'; ctx.fillRect(sx + 2 * m, sy + 0.5 * m, 1 * m, 2 * m);   // pickaxe
    ctx.fillStyle = '#666666'; ctx.fillRect(sx + 1 * m, sy + 0.5 * m, 2 * m, 1 * m);
    ctx.fillStyle = '#aa8844'; ctx.fillRect(sx + 4 * m, sy + 0.5 * m, 1 * m, 2.5 * m); // hammer
    ctx.fillStyle = '#888888'; ctx.fillRect(sx + 10 * m, sy + 0.5 * m, 1 * m, 2 * m);  // axe
    ctx.fillStyle = '#886644'; ctx.fillRect(sx + 12 * m, sy + 0.5 * m, 1 * m, 2.5 * m);
    // Workbench in center
    ctx.fillStyle = '#7a6a45';
    ctx.fillRect(sx + 3 * m, sy + 7 * m, 10 * m, 3 * m);
    ctx.fillStyle = '#6a5a35';
    ctx.fillRect(sx + 3 * m, sy + 9 * m, 10 * m, 1 * m);
    // Anvil
    ctx.fillStyle = '#555555';
    ctx.fillRect(sx + 5 * m, sy + 12 * m, 4 * m, 3 * m);
    ctx.fillStyle = '#666666';
    ctx.fillRect(sx + 4 * m, sy + 12 * m, 6 * m, 1.5 * m);
  },
  onInteract: function(game, wx, wy) {
    // Deposit crafted items into the store
    var building = BuildingManager.getAt(wx, wy);
    if (!building) return;
    if (!building.stored) building.stored = {};
    var deposited = 0;
    var craftIds = ['stone_axe','iron_axe','stone_pickaxe','iron_pickaxe','fishing_rod','plank','copper_bar','iron_bar','gold_bar','leather_armor','saddle','sharpened_flint','clay_brick','arrow_shaft'];
    for (var i = 0; i < craftIds.length; i++) {
      var id = craftIds[i];
      var count = game.player.bag[id] || 0;
      if (count > 0) {
        var give = Math.ceil(count / 2);
        Bag.remove(game.player.bag, id, give);
        building.stored[id] = (building.stored[id] || 0) + give;
        deposited += give;
      }
    }
    if (deposited > 0) {
      SFX.shrine();
      GameUtils.addLog('Stocked ' + deposited + ' craft items.', '#ddaa44');
    } else {
      GameUtils.addLog('No crafts to stock. Craft tools and materials!', '#888');
    }
  },
});

// Stable tile
var T_STABLE_FLOOR = TileRegistry.add({
  id: 213, name: 'stable_floor', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = (((wx||0) * 2371 + (wy||0) * 5917) >>> 0);
    // Dirt/straw floor
    ctx.fillStyle = shadeHex('#8a7a55', ((h % 7) - 3) * 2);
    ctx.fillRect(sx, sy, ts, ts);
    // Straw bits
    ctx.fillStyle = '#bbaa66';
    ctx.fillRect(sx + ((h>>2)%8+2)*m, sy + ((h>>5)%8+3)*m, 3*m, 1*m);
    ctx.fillRect(sx + ((h>>3)%7+1)*m, sy + ((h>>6)%7+5)*m, 2*m, 1*m);
    ctx.fillRect(sx + ((h>>4)%6+4)*m, sy + ((h>>7)%6+7)*m, 3*m, 1*m);
  },
});

// Lantern post — light source
var T_LANTERN = TileRegistry.add({
  id: 214, name: 'lantern_post', solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    // Ground
    var grassDraw = TileRegistry.getDrawer(T_GRASS);
    if (grassDraw) grassDraw(ctx, sx, sy, ts, visible, animTimer, wx || 0, wy || 0);
    // Post
    ctx.fillStyle = '#4a4040';
    ctx.fillRect(sx + 7 * m, sy + 3 * m, 2 * m, 12 * m);
    // Base
    ctx.fillStyle = '#5a5050';
    ctx.fillRect(sx + 5 * m, sy + 13 * m, 6 * m, 2 * m);
    // Lantern
    var pulse = 0.7 + Math.sin(animTimer * 3) * 0.2;
    ctx.fillStyle = '#3a3030';
    ctx.fillRect(sx + 5.5 * m, sy + 1 * m, 5 * m, 3 * m);
    ctx.fillStyle = 'rgba(255,200,80,' + pulse.toFixed(2) + ')';
    ctx.fillRect(sx + 6.5 * m, sy + 1.5 * m, 3 * m, 2 * m);
    // Top
    ctx.fillStyle = '#3a3030';
    ctx.fillRect(sx + 6 * m, sy + 0 * m, 4 * m, 1.5 * m);
  },
  light: { color: '#ffcc66', radius: 4, intensity: 0.5 },
});

// Blueprints — what can be built
// Each blueprint is a pattern of tiles relative to placement point
BlueprintRegistry.add({
  id: 'campfire',
  name: 'Campfire',
  desc: 'A warm fire. Marks your territory.',
  cost: { branch: 5, stone: 3 },
  size: { w: 1, h: 1 },
  tiles: [{ dx: 0, dy: 0, type: T.REST }], // reuse rest tile
});

BlueprintRegistry.add({
  id: 'small_home',
  name: 'Small Home',
  desc: 'A humble dwelling. One resident.',
  cost: { oak_log: 10, stone: 5 },
  size: { w: 3, h: 3 },
  tiles: [
    // Walls around edge
    { dx: 0, dy: 0, type: T_BUILDING_WALL }, { dx: 1, dy: 0, type: T_BUILDING_WALL }, { dx: 2, dy: 0, type: T_BUILDING_WALL },
    { dx: 0, dy: 1, type: T_BUILDING_WALL }, { dx: 1, dy: 1, type: T_BUILDING_FLOOR }, { dx: 2, dy: 1, type: T_BUILDING_WALL },
    { dx: 0, dy: 2, type: T_BUILDING_WALL }, { dx: 1, dy: 2, type: T_DOOR },           { dx: 2, dy: 2, type: T_BUILDING_WALL },
  ],
  isHome: true, capacity: 1,
});

BlueprintRegistry.add({
  id: 'workshop',
  name: 'Workshop',
  desc: 'Craft items from gathered resources.',
  cost: { oak_log: 15, stone: 10, branch: 5 },
  size: { w: 3, h: 3 },
  tiles: [
    { dx: 0, dy: 0, type: T_BUILDING_WALL }, { dx: 1, dy: 0, type: T_BUILDING_WALL }, { dx: 2, dy: 0, type: T_BUILDING_WALL },
    { dx: 0, dy: 1, type: T_BUILDING_WALL }, { dx: 1, dy: 1, type: T_WORKBENCH },     { dx: 2, dy: 1, type: T_BUILDING_WALL },
    { dx: 0, dy: 2, type: T_BUILDING_WALL }, { dx: 1, dy: 2, type: T_DOOR },           { dx: 2, dy: 2, type: T_BUILDING_WALL },
  ],
});

// --- PATH / ROAD crafting (single tile, cheap) ---
BlueprintRegistry.add({
  id: 'path',
  name: 'Path',
  desc: 'Dirt path. Cheap and quick.',
  cost: { stone: 1 },
  size: { w: 1, h: 1 },
  tiles: [{ dx: 0, dy: 0, type: T_DIRT_PATH }],
});

BlueprintRegistry.add({
  id: 'cobblestone',
  name: 'Cobblestone Road',
  desc: 'Sturdy stone road.',
  cost: { stone: 3 },
  size: { w: 1, h: 1 },
  tiles: [{ dx: 0, dy: 0, type: T_COBBLESTONE }],
});

// --- DECORATION ---
BlueprintRegistry.add({
  id: 'fence',
  name: 'Fence',
  desc: 'Low wooden barrier.',
  cost: { branch: 4 },
  size: { w: 1, h: 1 },
  tiles: [{ dx: 0, dy: 0, type: T_FENCE }],
});

BlueprintRegistry.add({
  id: 'well',
  name: 'Well',
  desc: 'Water source. Village landmark.',
  cost: { stone: 8, branch: 3 },
  size: { w: 1, h: 1 },
  tiles: [{ dx: 0, dy: 0, type: T_WELL }],
});

BlueprintRegistry.add({
  id: 'lantern',
  name: 'Lantern Post',
  desc: 'Lights up the area at night.',
  cost: { iron_bar: 1, branch: 2 },
  size: { w: 1, h: 1 },
  tiles: [{ dx: 0, dy: 0, type: T_LANTERN }],
});

// --- COMMERCE ---
BlueprintRegistry.add({
  id: 'market_stall',
  name: 'Market Stall',
  desc: 'Open-air trading spot.',
  cost: { oak_log: 6, branch: 8 },
  size: { w: 1, h: 1 },
  tiles: [{ dx: 0, dy: 0, type: T_MARKET_STALL }],
});

BlueprintRegistry.add({
  id: 'food_store',
  name: 'Food Store',
  desc: 'Stock food here. Attracts skilled visitors.',
  cost: { oak_log: 12, stone: 8, plank: 4 },
  size: { w: 3, h: 3 },
  tiles: [
    { dx: 0, dy: 0, type: T_STONE_WALL },  { dx: 1, dy: 0, type: T_STONE_WALL },  { dx: 2, dy: 0, type: T_STONE_WALL },
    { dx: 0, dy: 1, type: T_STONE_WALL },  { dx: 1, dy: 1, type: T_FOOD_STORE },  { dx: 2, dy: 1, type: T_STONE_WALL },
    { dx: 0, dy: 2, type: T_STONE_WALL },  { dx: 1, dy: 2, type: T_DOOR },         { dx: 2, dy: 2, type: T_STONE_WALL },
  ],
  isStore: true, storeType: 'food',
});

BlueprintRegistry.add({
  id: 'craft_store',
  name: 'Craft Store',
  desc: 'Stock crafts here. Attracts skilled crafters.',
  cost: { oak_log: 12, stone: 10, iron_bar: 2 },
  size: { w: 3, h: 3 },
  tiles: [
    { dx: 0, dy: 0, type: T_STONE_WALL },  { dx: 1, dy: 0, type: T_STONE_WALL },  { dx: 2, dy: 0, type: T_STONE_WALL },
    { dx: 0, dy: 1, type: T_STONE_WALL },  { dx: 1, dy: 1, type: T_CRAFT_STORE }, { dx: 2, dy: 1, type: T_STONE_WALL },
    { dx: 0, dy: 2, type: T_STONE_WALL },  { dx: 1, dy: 2, type: T_DOOR },         { dx: 2, dy: 2, type: T_STONE_WALL },
  ],
  isStore: true, storeType: 'craft',
});

// --- HOMES ---
BlueprintRegistry.add({
  id: 'large_home',
  name: 'Large Home',
  desc: 'Spacious dwelling. Two residents.',
  cost: { oak_log: 20, stone: 12, plank: 6 },
  size: { w: 4, h: 4 },
  tiles: [
    { dx: 0, dy: 0, type: T_STONE_WALL },  { dx: 1, dy: 0, type: T_STONE_WALL },  { dx: 2, dy: 0, type: T_STONE_WALL },  { dx: 3, dy: 0, type: T_STONE_WALL },
    { dx: 0, dy: 1, type: T_STONE_WALL },  { dx: 1, dy: 1, type: T_STONE_FLOOR }, { dx: 2, dy: 1, type: T_STONE_FLOOR }, { dx: 3, dy: 1, type: T_STONE_WALL },
    { dx: 0, dy: 2, type: T_STONE_WALL },  { dx: 1, dy: 2, type: T_STONE_FLOOR }, { dx: 2, dy: 2, type: T_STONE_FLOOR }, { dx: 3, dy: 2, type: T_STONE_WALL },
    { dx: 0, dy: 3, type: T_STONE_WALL },  { dx: 1, dy: 3, type: T_DOOR },         { dx: 2, dy: 3, type: T_STONE_WALL },  { dx: 3, dy: 3, type: T_STONE_WALL },
  ],
  isHome: true, capacity: 2,
});

// --- SPECIAL ---
BlueprintRegistry.add({
  id: 'tavern',
  name: 'Tavern',
  desc: 'Gathering place. Boosts NPC morale.',
  cost: { oak_log: 18, stone: 10, plank: 8 },
  size: { w: 4, h: 4 },
  tiles: [
    { dx: 0, dy: 0, type: T_STONE_WALL },  { dx: 1, dy: 0, type: T_STONE_WALL },  { dx: 2, dy: 0, type: T_STONE_WALL },  { dx: 3, dy: 0, type: T_STONE_WALL },
    { dx: 0, dy: 1, type: T_STONE_WALL },  { dx: 1, dy: 1, type: T_BUILDING_FLOOR }, { dx: 2, dy: 1, type: T_BUILDING_FLOOR }, { dx: 3, dy: 1, type: T_STONE_WALL },
    { dx: 0, dy: 2, type: T_STONE_WALL },  { dx: 1, dy: 2, type: T_BUILDING_FLOOR }, { dx: 2, dy: 2, type: T_WORKBENCH },    { dx: 3, dy: 2, type: T_STONE_WALL },
    { dx: 0, dy: 3, type: T_STONE_WALL },  { dx: 1, dy: 3, type: T_DOOR },           { dx: 2, dy: 3, type: T_STONE_WALL },  { dx: 3, dy: 3, type: T_STONE_WALL },
  ],
  isTavern: true,
});

BlueprintRegistry.add({
  id: 'stable',
  name: 'Stable',
  desc: 'Shelter for horses and mounts.',
  cost: { oak_log: 15, branch: 10 },
  size: { w: 3, h: 3 },
  tiles: [
    { dx: 0, dy: 0, type: T_FENCE },          { dx: 1, dy: 0, type: T_FENCE },          { dx: 2, dy: 0, type: T_FENCE },
    { dx: 0, dy: 1, type: T_BUILDING_WALL },  { dx: 1, dy: 1, type: T_STABLE_FLOOR },   { dx: 2, dy: 1, type: T_BUILDING_WALL },
    { dx: 0, dy: 2, type: T_BUILDING_WALL },  { dx: 1, dy: 2, type: T_STABLE_FLOOR },   { dx: 2, dy: 2, type: T_BUILDING_WALL },
  ],
  isStable: true,
});

BlueprintRegistry.add({
  id: 'town_hall',
  name: 'Town Hall',
  desc: 'Centre of the village. Unlocks governance.',
  cost: { oak_log: 30, stone: 25, iron_bar: 5, plank: 10 },
  size: { w: 5, h: 5 },
  tiles: [
    { dx: 0, dy: 0, type: T_STONE_WALL }, { dx: 1, dy: 0, type: T_STONE_WALL },  { dx: 2, dy: 0, type: T_STONE_WALL },  { dx: 3, dy: 0, type: T_STONE_WALL },  { dx: 4, dy: 0, type: T_STONE_WALL },
    { dx: 0, dy: 1, type: T_STONE_WALL }, { dx: 1, dy: 1, type: T_STONE_FLOOR }, { dx: 2, dy: 1, type: T_STONE_FLOOR }, { dx: 3, dy: 1, type: T_STONE_FLOOR }, { dx: 4, dy: 1, type: T_STONE_WALL },
    { dx: 0, dy: 2, type: T_STONE_WALL }, { dx: 1, dy: 2, type: T_STONE_FLOOR }, { dx: 2, dy: 2, type: T_STONE_FLOOR }, { dx: 3, dy: 2, type: T_STONE_FLOOR }, { dx: 4, dy: 2, type: T_STONE_WALL },
    { dx: 0, dy: 3, type: T_STONE_WALL }, { dx: 1, dy: 3, type: T_STONE_FLOOR }, { dx: 2, dy: 3, type: T_STONE_FLOOR }, { dx: 3, dy: 3, type: T_STONE_FLOOR }, { dx: 4, dy: 3, type: T_STONE_WALL },
    { dx: 0, dy: 4, type: T_STONE_WALL }, { dx: 1, dy: 4, type: T_STONE_WALL },  { dx: 2, dy: 4, type: T_DOOR },        { dx: 3, dy: 4, type: T_STONE_WALL },  { dx: 4, dy: 4, type: T_STONE_WALL },
  ],
  isTownHall: true,
});

// Track placed buildings for village management
var BuildingManager = {
  buildings: [], // { id, x, y, blueprint, occupant }

  add: function(x, y, blueprint) {
    var b = { id: blueprint.id + '_' + x + '_' + y, x: x, y: y, blueprint: blueprint, occupant: null };
    this.buildings.push(b);
    return b;
  },

  getAt: function(wx, wy) {
    for (var i = 0; i < this.buildings.length; i++) {
      var b = this.buildings[i];
      if (wx >= b.x && wx < b.x + b.blueprint.size.w && wy >= b.y && wy < b.y + b.blueprint.size.h) return b;
    }
    return null;
  },

  getHomes: function() {
    return this.buildings.filter(function(b) { return b.blueprint.isHome; });
  },

  getVacantHomes: function() {
    return this.buildings.filter(function(b) { return b.blueprint.isHome && !b.occupant; });
  },

  clear: function() { this.buildings = []; },
};

// Save/load buildings
SaveSystem.register('buildings', {
  save: function() {
    return BuildingManager.buildings.map(function(b) {
      return { x: b.x, y: b.y, bpId: b.blueprint.id, occupant: b.occupant, stored: b.stored || null };
    });
  },
  load: function(data) {
    if (!data) return;
    BuildingManager.clear();
    for (var i = 0; i < data.length; i++) {
      var d = data[i];
      var bp = BlueprintRegistry.get(d.bpId);
      if (bp) {
        var b = BuildingManager.add(d.x, d.y, bp);
        b.occupant = d.occupant || null;
        b.stored = d.stored || null;
        // Re-place tiles
        for (var t = 0; t < bp.tiles.length; t++) {
          Overworld.setTile(d.x + bp.tiles[t].dx, d.y + bp.tiles[t].dy, bp.tiles[t].type);
        }
      }
    }
  },
});

// Build mode key — B to enter
GameEvents.on('keyDown', function(game, key) {
  if ((key === 'b' || key === 'B') && game.player.mode === 'overworld') {
    StateStack.push(BuildModeState);
    return true;
  }
  return false;
});
