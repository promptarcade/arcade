
// ============================================================
// SYSTEM: Legacy — the world remembers your deaths
// ============================================================
// On death, a snapshot of your life is saved to meta.
// On new game (same world seed), legacy data is stamped onto
// the world: ghost villages as ruins, death markers with gear,
// ghost NPCs with memories, worn trails persist.

// Ruin tile for legacy buildings (reuses T_RUIN_FLOOR=121, T_RUIN_RUBBLE=123)
var LEGACY_STORAGE_KEY = 'wanderlust_legacy';

var LegacyManager = {
  ghosts: [],     // ghost NPCs spawned this run
  markers: [],    // death markers placed this run

  // Save a legacy snapshot on death
  captureOnDeath: function(game) {
    var p = game.player;
    var snapshot = {
      run: game.meta.totalRuns,
      name: p.hairStyle + ' ' + p.body, // crude identifier
      floor: p.floor,
      kills: p.kills,
      deathX: Math.round(p.x),
      deathY: Math.round(p.y),
      deathMode: p.mode,
      bestWeapon: p.weapon ? { name: p.weapon.name, color: p.weapon.color, damage: p.weapon.damage, range: p.weapon.range || 1, cd: p.weapon.cd || 0, atk: p.weapon.atk || 0 } : null,
      bestArmor: p.armor ? { name: p.armor.name, color: p.armor.color, defense: p.armor.defense, hp: p.armor.hp || 0 } : null,
      dungeonHearts: p.bag.dungeon_heart || 0,
      obeliskTier: (typeof ObeliskManager !== 'undefined' && ObeliskManager.placed) ? ObeliskManager.tier : 0,
      buildings: [],
      npcNames: [],
      trails: [],
      villageCenterX: 0,
      villageCenterY: 0,
      daysSurvived: typeof GameTime !== 'undefined' ? GameTime.day() : 0,
    };

    // Capture buildings
    if (typeof BuildingManager !== 'undefined') {
      for (var i = 0; i < BuildingManager.buildings.length; i++) {
        var b = BuildingManager.buildings[i];
        snapshot.buildings.push({ x: b.x, y: b.y, w: b.blueprint.size.w, h: b.blueprint.size.h, name: b.blueprint.name });
      }
      // Village center = average of building positions
      if (snapshot.buildings.length > 0) {
        var sx = 0, sy = 0;
        for (var i = 0; i < snapshot.buildings.length; i++) { sx += snapshot.buildings[i].x; sy += snapshot.buildings[i].y; }
        snapshot.villageCenterX = Math.round(sx / snapshot.buildings.length);
        snapshot.villageCenterY = Math.round(sy / snapshot.buildings.length);
      }
    }

    // Capture NPC names
    if (typeof NPCManager !== 'undefined') {
      for (var i = 0; i < NPCManager.npcs.length; i++) {
        var npc = NPCManager.npcs[i];
        if (npc.resident && npc.alive) {
          snapshot.npcNames.push({ name: npc.name, job: npc.job, x: npc.x, y: npc.y });
        }
      }
    }

    // Capture permanent trails (wear >= 6)
    if (typeof TrailManager !== 'undefined') {
      for (var key in TrailManager.trails) {
        if (TrailManager.trails[key] >= 6) { // only permanent paths
          snapshot.trails.push(key);
        }
      }
    }

    // Save to legacy array in localStorage
    var legacies = this._load();
    legacies.push(snapshot);
    // Keep last 10 legacies max
    if (legacies.length > 10) legacies = legacies.slice(-10);
    this._save(legacies);
  },

  // Stamp legacy data onto a new world
  applyLegacies: function(game) {
    var legacies = this._load();
    if (legacies.length === 0) return;

    this.ghosts = [];
    this.markers = [];

    for (var li = 0; li < legacies.length; li++) {
      var leg = legacies[li];

      // 1. Convert old buildings to ruins
      for (var bi = 0; bi < leg.buildings.length; bi++) {
        var b = leg.buildings[bi];
        for (var dy = 0; dy < b.h; dy++) {
          for (var dx = 0; dx < b.w; dx++) {
            var wx = b.x + dx, wy = b.y + dy;
            // Don't overwrite buildings from a later legacy
            var existing = Overworld.getTileChange(wx, wy);
            if (existing !== undefined) continue;
            // Random: some tiles become ruin floor, some rubble, some just gone
            var r = Math.random();
            if (r < 0.4) Overworld.setTile(wx, wy, 121); // T_RUIN_FLOOR
            else if (r < 0.7) Overworld.setTile(wx, wy, 123); // T_RUIN_RUBBLE
            // else: tile reverts to natural terrain (building collapsed completely)
          }
        }
      }

      // 2. Death marker — skeleton with equipment AND dungeon hearts
      if (leg.deathMode === 'overworld') {
        var mx = leg.deathX, my = leg.deathY;
        this.markers.push({
          x: mx, y: my,
          weapon: leg.bestWeapon,
          armor: leg.bestArmor,
          hearts: leg.dungeonHearts || 0,
          run: leg.run,
          kills: leg.kills,
          floor: leg.floor,
          days: leg.daysSurvived,
        });
      }

      // 3. Ghost NPCs at the old village center
      if (leg.npcNames.length > 0 && typeof NPCManager !== 'undefined') {
        // Spawn 1-2 ghosts from this legacy
        var ghostCount = Math.min(2, leg.npcNames.length);
        for (var gi = 0; gi < ghostCount; gi++) {
          var npcData = leg.npcNames[gi];
          var gx = leg.villageCenterX + (gi === 0 ? 0 : 1);
          var gy = leg.villageCenterY;
          this.ghosts.push({
            x: gx, y: gy,
            name: npcData.name,
            job: npcData.job,
            run: leg.run,
            kills: leg.kills,
            floor: leg.floor,
            days: leg.daysSurvived,
          });
        }
      }

      // 4. Restore permanent trails
      if (typeof TrailManager !== 'undefined') {
        for (var ti = 0; ti < leg.trails.length; ti++) {
          var key = leg.trails[ti];
          // Only set if not already a path
          if (!TrailManager.trails[key]) {
            TrailManager.trails[key] = 4; // partially worn — not fully permanent, but visible
            var parts = key.split(',');
            var wx = parseInt(parts[0], 10), wy = parseInt(parts[1], 10);
            Overworld.setTile(wx, wy, 215); // T_WORN_TRAIL
          }
        }
      }
    }
  },

  _load: function() {
    try {
      var raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  },

  _save: function(legacies) {
    try { localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacies)); } catch(e) {}
  },
};

// On death — capture legacy BEFORE save is deleted
var _origDie = Game.prototype.die;
Game.prototype.die = function() {
  LegacyManager.captureOnDeath(this);
  _origDie.call(this);
};

// On new game — apply legacies after world is initialized
var _origStartGame = Game.prototype.startGame;
Game.prototype.startGame = function() {
  _origStartGame.call(this);
  LegacyManager.applyLegacies(this);
};

// Spawn ghost NPCs after legacy is applied (deferred — NPC system loads later)
GameEvents.on('modeChange', function(game, mode) {
  if (mode !== 'overworld') return;
  if (LegacyManager.ghosts.length === 0) return;
  var npcMgr = (typeof NPCManager !== 'undefined') ? NPCManager : null;
  if (!npcMgr || typeof NPC === 'undefined') return;

  for (var i = 0; i < LegacyManager.ghosts.length; i++) {
    var g = LegacyManager.ghosts[i];
    var alreadySpawned = false;
    var npcList = npcMgr.npcs;
    for (var j = 0; j < npcList.length; j++) {
      if (npcList[j]._isGhost && npcList[j].name === g.name) { alreadySpawned = true; break; }
    }
    if (alreadySpawned) continue;

    var npc = new NPC(g.x, g.y, {
      name: g.name,
      bodyColor: '#4466aa',
      hairColor: '#aabbcc',
    });
    npc._isGhost = true;
    npc.talkable = true;
    npc.resident = false;
    npc.speed = 0.1;
    npc._ghostData = g;
    npcMgr.add(npc);
  }
  LegacyManager.ghosts = [];
});

// Ghost NPC dialogue — they remember the past
var _origBuildDialogueLegacy = buildNpcDialogue;
buildNpcDialogue = function(npc, game) {
  if (npc._isGhost && npc._ghostData) {
    var g = npc._ghostData;
    var lines = [];
    var choices = [];

    lines.push({ text: npc.name, color: '#8899cc', bold: true });
    lines.push({ text: '"I remember this place..."', color: '#8888aa' });

    // Memories from their past life
    var memories = [];
    if (g.days > 0) memories.push('I lived here for ' + g.days + ' days.');
    if (g.job) memories.push('I was a ' + g.job + '.');
    if (g.floor > 0) memories.push('My master reached floor ' + g.floor + ' before the end.');
    if (g.kills > 0) memories.push(g.kills + ' creatures fell by our hand.');

    if (memories.length > 0) {
      lines.push({ text: memories[Math.floor(Math.random() * memories.length)], color: '#aaaacc' });
    }

    // Hints
    var hints = [
      'Beware the deeper floors at night.',
      'Build a tavern — it lifts the spirits.',
      'The merchants in the north pay well for fish.',
      'Crystals hold great power. Seek them below floor 5.',
      'A horse makes the journey easier.',
      'Keep food stocked. Visitors judge you by it.',
    ];
    lines.push({ text: '"' + hints[Math.floor(Math.random() * hints.length)] + '"', color: '#7788aa' });

    choices.push({ text: 'Rest in peace.', key: 'n', action: 'close' });
    return { lines: lines, choices: choices };
  }
  return _origBuildDialogueLegacy(npc, game);
};

// Draw ghost NPCs with transparency
GameEvents.on('draw:entities', function(game, ctx) {
  if (game.player.mode !== 'overworld') return;
  var ts = CONFIG.TILE;
  for (var i = 0; i < NPCManager.npcs.length; i++) {
    var npc = NPCManager.npcs[i];
    if (!npc._isGhost || !npc.alive) continue;
    var dx = npc.x - game.player.x, dy = npc.y - game.player.y;
    if (Math.abs(dx) > CONFIG.VIEW_W + 2 || Math.abs(dy) > CONFIG.VIEW_H + 2) continue;

    var sx = npc.x * ts, sy = npc.y * ts;
    // Ghostly transparency + blue tint
    ctx.globalAlpha = 0.35 + Math.sin(game.animTimer * 2) * 0.1;
    drawCharPixel(ctx, sx, sy, ts, '#4466aa', '#aabbcc', '#8899bb', null, 0,
      { hairStyle: npc.hairStyle, hairColor: '#aabbcc', body: npc.body,
        height: npc.height, frame: npc.frame });
    ctx.globalAlpha = 1;

    // Ghost name label
    ctx.fillStyle = 'rgba(136,153,204,0.7)';
    ctx.font = Math.max(7, Math.round(ts * 0.22)) + 'px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, sx + ts / 2, sy - ts * 0.15);

    // Ghost indicator
    ctx.fillStyle = 'rgba(100,130,200,0.5)';
    ctx.font = Math.max(6, Math.round(ts * 0.2)) + 'px Segoe UI';
    ctx.fillText('ghost', sx + ts / 2, sy - ts * 0.35);
  }
});

// Draw death markers on overworld
GameEvents.on('draw:entities', function(game, ctx) {
  if (game.player.mode !== 'overworld') return;
  var ts = CONFIG.TILE;
  for (var i = 0; i < LegacyManager.markers.length; i++) {
    var mk = LegacyManager.markers[i];
    var dx = mk.x - game.player.x, dy = mk.y - game.player.y;
    if (Math.abs(dx) > CONFIG.VIEW_W + 2 || Math.abs(dy) > CONFIG.VIEW_H + 2) continue;

    var sx = mk.x * ts, sy = mk.y * ts;
    var m = ts / 16;

    // Skeleton remains
    ctx.fillStyle = '#aaa99a';
    // Skull
    ctx.fillRect(sx + 5 * m, sy + 5 * m, 5 * m, 4 * m);
    ctx.fillStyle = '#111';
    ctx.fillRect(sx + 6 * m, sy + 6 * m, 1.5 * m, 1.5 * m);
    ctx.fillRect(sx + 8.5 * m, sy + 6 * m, 1.5 * m, 1.5 * m);
    // Ribs
    ctx.fillStyle = '#999988';
    ctx.fillRect(sx + 5 * m, sy + 9 * m, 5 * m, 0.5 * m);
    ctx.fillRect(sx + 5.5 * m, sy + 10 * m, 4 * m, 0.5 * m);
    ctx.fillRect(sx + 6 * m, sy + 11 * m, 3 * m, 0.5 * m);
    // Arms spread
    ctx.fillRect(sx + 3 * m, sy + 9 * m, 2 * m, 0.5 * m);
    ctx.fillRect(sx + 10 * m, sy + 9 * m, 2 * m, 0.5 * m);
    // Legs
    ctx.fillRect(sx + 5 * m, sy + 12 * m, 1 * m, 3 * m);
    ctx.fillRect(sx + 9 * m, sy + 12 * m, 1 * m, 3 * m);

    // Weapon lying beside if they had one
    if (mk.weapon) {
      ctx.fillStyle = mk.weapon.color || '#aaccff';
      ctx.fillRect(sx + 12 * m, sy + 7 * m, 1 * m, 6 * m);
      ctx.fillRect(sx + 11 * m, sy + 7 * m, 3 * m, 1 * m);
    }

    // Hover label
    if (Math.abs(dx) + Math.abs(dy) <= 3) {
      ctx.fillStyle = '#aaa';
      ctx.font = Math.max(7, Math.round(ts * 0.22)) + 'px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText('Run ' + mk.run + ' \u2020', sx + ts / 2, sy - 2);
      ctx.fillStyle = '#888';
      ctx.font = Math.max(6, Math.round(ts * 0.18)) + 'px Segoe UI';
      ctx.fillText('Floor ' + mk.floor + ', ' + mk.kills + ' kills', sx + ts / 2, sy - ts * 0.3);
    }
  }
});

// Death markers are interactable — loot your past self
var _origResolveInteractionLegacy = Game.prototype.resolveInteraction;
Game.prototype.resolveInteraction = function(tx, ty) {
  // Check death markers
  for (var i = 0; i < LegacyManager.markers.length; i++) {
    var mk = LegacyManager.markers[i];
    if (mk.x === tx && mk.y === ty && !mk.looted) {
      mk.looted = true;
      SFX.shrine();
      GameUtils.addLog('You find the remains of a past life...', '#8899cc');
      // Recover dungeon hearts from past life
      if (mk.hearts > 0) {
        Bag.add(this.player.bag, 'dungeon_heart', mk.hearts);
        GameUtils.addLog('Found ' + mk.hearts + ' dungeon heart' + (mk.hearts > 1 ? 's' : '') + '!', '#ff2255');
      }
      // Give them the weapon or armor
      if (mk.weapon) {
        var loot = { type: 'weapon', slot: 'weapon', name: mk.weapon.name, range: mk.weapon.range,
          damage: mk.weapon.damage, cd: mk.weapon.cd, desc: 'From a previous life', atk: mk.weapon.atk || 0,
          color: mk.weapon.color };
        this._pendingLoot = loot;
        this._pendingLootKey = null;
        this._pendingLootPos = { x: tx, y: ty };
        StateStack.push(LootPromptState);
      } else if (mk.armor) {
        var loot = { type: 'armor', slot: 'armor', name: mk.armor.name, defense: mk.armor.defense,
          hp: mk.armor.hp || 0, color: mk.armor.color, desc: 'From a previous life' };
        this._pendingLoot = loot;
        this._pendingLootKey = null;
        this._pendingLootPos = { x: tx, y: ty };
        StateStack.push(LootPromptState);
      }
      this.endOverworldTurn();
      return true;
    }
  }
  return _origResolveInteractionLegacy.call(this, tx, ty);
};

// Update title screen to show legacy score
GameEvents.on('draw:ui', function(game, ctx) {
  if (StateStack.name() !== 'title') return;
  var legacies = LegacyManager._load();
  if (legacies.length === 0) return;

  var fs = Math.max(10, Math.round(CONFIG.WIDTH * 0.01));
  var w = CONFIG.WIDTH;
  // Legacy count below stats
  ctx.fillStyle = '#8899cc';
  ctx.font = Math.round(fs * 0.9) + 'px Segoe UI';
  ctx.textAlign = 'center';
  var totalDays = 0, totalKills = 0;
  for (var i = 0; i < legacies.length; i++) {
    totalDays += legacies[i].daysSurvived || 0;
    totalKills += legacies[i].kills || 0;
  }
  ctx.fillText(legacies.length + ' past lives \u2022 ' + totalDays + ' days lived \u2022 ' + totalKills + ' kills across all lives', w / 2, CONFIG.HEIGHT * 0.22);
});
