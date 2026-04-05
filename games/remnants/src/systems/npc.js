
// ============================================================
// SYSTEM: NPC Core — spawn, move, render, basic AI
// ============================================================

// NPC name generation
var NPC_FIRST_NAMES = ['Aela','Bjorn','Cora','Dain','Elara','Finn','Greta','Haldor','Iris','Jaska',
  'Kael','Lyra','Milo','Nessa','Orin','Petra','Quinn','Runa','Soren','Talia',
  'Ulric','Vera','Wynn','Xara','Yoren','Zara','Aldric','Brenna','Colm','Dessa'];
var NPC_TITLES = ['the Wanderer','the Bold','the Quiet','the Keen','the Weary','the Brave',
  'the Lost','the Curious','the Steady','the Swift','the Old','the Young'];

function randomNpcName(rng) {
  var r = rng || Math.random;
  var name = NPC_FIRST_NAMES[Math.floor(r() * NPC_FIRST_NAMES.length)];
  if (r() < 0.3) name += ' ' + NPC_TITLES[Math.floor(r() * NPC_TITLES.length)];
  return name;
}

// NPC constructor
function NPC(wx, wy, opts) {
  opts = opts || {};
  this.x = wx;
  this.y = wy;
  this.name = opts.name || randomNpcName();
  this.body = opts.body || (Math.random() < 0.5 ? 'broad' : 'narrow');
  this.bodyColor = opts.bodyColor || ['#aa4422','#2244aa','#228844','#886622','#664488','#448888'][Math.floor(Math.random() * 6)];
  this.hairColor = opts.hairColor || ['#443322','#221100','#ccaa44','#aa3311','#eeeeee'][Math.floor(Math.random() * 5)];
  this.hairStyle = opts.hairStyle || ['short','long','spiky','bald','ponytail'][Math.floor(Math.random() * 5)];
  this.skinColor = opts.skinColor || ['#ffcc88','#eebb77','#cc9966','#aa7744','#886633'][Math.floor(Math.random() * 5)];
  this.height = opts.height || 'average';
  this.frame = opts.frame || ['average','stocky','slim'][Math.floor(Math.random() * 3)];

  // Skills — NPCs have skill levels too
  this.skills = {};
  var skillList = ['woodcutting','herbalism','gathering','combat','building'];
  for (var i = 0; i < skillList.length; i++) {
    this.skills[skillList[i]] = Math.floor(Math.random() * 5); // 0-4 starting level
  }

  // State
  this.alive = true;
  this.animTimer = Math.random() * 10;
  this.walkTimer = 0;
  this.lastDir = { x: 0, y: 1 };
  this.moveAccum = 0;
  this.speed = 0.3; // moves every ~3 turns
  this.home = null;  // {x,y} of assigned home
  this.job = null;   // 'woodcutter', 'herbalist', etc.
  this.path = null;  // [{x,y},...] current movement path
  this.pathIdx = 0;
  this.state = 'idle'; // idle, walking, working
  this.talkable = true;
  this.relationship = 0; // -100 to 100 with player
  this.resident = false; // true if lives in village

  // What they say when talked to
  this.dialogue = opts.dialogue || null;
}

// Simple pathfinding toward a target — greedy, avoids walls
NPC.prototype.moveToward = function(tx, ty) {
  var dx = tx - this.x, dy = ty - this.y;
  if (dx === 0 && dy === 0) return false;
  var mdx = dx !== 0 ? Math.sign(dx) : 0;
  var mdy = dy !== 0 ? Math.sign(dy) : 0;
  // Try primary direction, then secondary
  var tries = Math.abs(dx) >= Math.abs(dy)
    ? [{x:mdx,y:0},{x:0,y:mdy},{x:mdx,y:mdy}]
    : [{x:0,y:mdy},{x:mdx,y:0},{x:mdx,y:mdy}];
  for (var i = 0; i < tries.length; i++) {
    var nx = this.x + tries[i].x, ny = this.y + tries[i].y;
    if (!Overworld.isPassable(nx, ny)) continue;
    // Don't walk onto player
    var p = GameUtils.player();
    if (p && nx === p.x && ny === p.y) continue;
    // Don't walk onto other NPCs
    var blocked = false;
    for (var j = 0; j < NPCManager.npcs.length; j++) {
      var other = NPCManager.npcs[j];
      if (other !== this && other.alive && other.x === nx && other.y === ny) { blocked = true; break; }
    }
    if (blocked) continue;
    this.lastDir = tries[i];
    this.x = nx; this.y = ny;
    this.walkTimer = 0.35;
    return true;
  }
  return false;
};

// NPC Manager — global list, tick, render
var NPCManager = {
  npcs: [],

  add: function(npc) { this.npcs.push(npc); return npc; },

  remove: function(npc) {
    var idx = this.npcs.indexOf(npc);
    if (idx >= 0) this.npcs.splice(idx, 1);
  },

  // Get NPC at world position
  getAt: function(wx, wy) {
    for (var i = 0; i < this.npcs.length; i++) {
      if (this.npcs[i].alive && this.npcs[i].x === wx && this.npcs[i].y === wy) return this.npcs[i];
    }
    return null;
  },

  clear: function() { this.npcs = []; },
};

// Tick NPC AI every turn — daily routines for residents
GameEvents.on('turnEnd', function(game) {
  if (game.player.mode !== 'overworld') return;
  var hour = GameTime.hour();

  for (var i = 0; i < NPCManager.npcs.length; i++) {
    var npc = NPCManager.npcs[i];
    if (!npc.alive) continue;

    npc.moveAccum += npc.speed;
    if (npc.moveAccum < 1) continue;
    npc.moveAccum -= 1;

    if (npc.resident && npc.home) {
      // Daily schedule for residents
      if (hour >= 21 || hour < 6) {
        // Night: go home and stay
        npc.state = 'sleeping';
        if (npc.x !== npc.home.x || npc.y !== npc.home.y) {
          npc.moveToward(npc.home.x, npc.home.y);
        }
      } else if (hour >= 6 && hour < 8) {
        // Morning: wander near home
        npc.state = 'idle';
        if (Math.random() < 0.3) {
          var d = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}][Math.floor(Math.random()*4)];
          var nx = npc.home.x + d.x, ny = npc.home.y + d.y;
          npc.moveToward(nx, ny);
        }
      } else if (hour >= 8 && hour < 17) {
        // Work hours: gather resources near home based on job skill
        npc.state = 'working';
        // Wander within work radius looking for resources
        if (Math.random() < 0.5) {
          var d = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}][Math.floor(Math.random()*4)];
          var nx = npc.x + d.x, ny = npc.y + d.y;
          // Stay within 8 tiles of home
          if (Math.abs(nx - npc.home.x) <= 8 && Math.abs(ny - npc.home.y) <= 8) {
            npc.moveToward(nx, ny);
          } else {
            npc.moveToward(npc.home.x, npc.home.y);
          }
        }
        // NPC gathers resources passively (every ~30 turns)
        if (GameTime.turn % 30 === 0 && npc.job) {
          var skill = npc.skills[npc.job] || 0;
          if (skill > 0 && Math.random() < 0.3 + skill * 0.05) {
            // Add a small amount of relevant resource to player bag
            var gathered = null;
            if (npc.job === 'woodcutting') gathered = { id: 'oak_log', name: 'Oak Log' };
            else if (npc.job === 'herbalism') gathered = { id: 'meadow_herb', name: 'Herb' };
            else if (npc.job === 'gathering') gathered = { id: 'stone', name: 'Stone' };
            if (gathered) {
              Bag.add(game.player.bag, gathered.id, 1);
              GameUtils.addLog(npc.name + ' gathered ' + gathered.name, '#888');
            }
          }
        }
      } else {
        // Evening: wander freely
        npc.state = 'idle';
        if (Math.random() < 0.3) {
          var d = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}][Math.floor(Math.random()*4)];
          npc.moveToward(npc.x + d.x, npc.y + d.y);
        }
        // Head home as it gets late
        if (hour >= 19) {
          if (Math.random() < 0.4) npc.moveToward(npc.home.x, npc.home.y);
        }
      }
    } else {
      // Non-residents: wander randomly
      if (npc.state === 'idle') {
        if (Math.random() < 0.3) {
          var d = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}][Math.floor(Math.random()*4)];
          npc.moveToward(npc.x + d.x, npc.y + d.y);
        }
      }
    }
  }
});

// Update NPC animation timers every frame
GameEvents.on('update', function(game, dt) {
  for (var i = 0; i < NPCManager.npcs.length; i++) {
    var npc = NPCManager.npcs[i];
    npc.animTimer += dt;
    if (npc.walkTimer > 0) npc.walkTimer -= dt;
  }
});

// Render NPCs on entity layer
GameEvents.on('draw:entities', function(game, ctx) {
  if (game.player.mode !== 'overworld') return;
  var ts = CONFIG.TILE;
  for (var i = 0; i < NPCManager.npcs.length; i++) {
    var npc = NPCManager.npcs[i];
    if (!npc.alive) continue;
    // Only draw if on screen
    var dx = npc.x - game.player.x, dy = npc.y - game.player.y;
    if (Math.abs(dx) > CONFIG.VIEW_W + 2 || Math.abs(dy) > CONFIG.VIEW_H + 2) continue;

    var sx = npc.x * ts, sy = npc.y * ts;
    var walkPhase = npc.walkTimer > 0 ? (npc.animTimer * 0.6) % 1 : 0;
    drawCharPixel(ctx, sx, sy, ts, npc.bodyColor, '#443322', npc.skinColor, null, walkPhase,
      { hairStyle: npc.hairStyle, hairColor: npc.hairColor, body: npc.body,
        height: npc.height, frame: npc.frame });

    // Name label above head
    ctx.fillStyle = '#ccccaa';
    ctx.font = Math.max(8, Math.round(ts * 0.25)) + 'px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, sx + ts / 2, sy - ts * 0.15);

    // HP bar when damaged
    if (npc.hp && npc.maxHp && npc.hp < npc.maxHp) {
      var barW = ts - 4, hpR = npc.hp / npc.maxHp;
      ctx.fillStyle = '#222';
      ctx.fillRect(sx + 2, sy - 5, barW, 3);
      ctx.fillStyle = hpR > 0.5 ? '#44dd44' : hpR > 0.25 ? '#ddcc00' : '#dd3333';
      ctx.fillRect(sx + 2, sy - 5, barW * hpR, 3);
    }

    // Interaction indicator if adjacent to player
    if (Math.abs(dx) + Math.abs(dy) === 1) {
      ctx.fillStyle = '#ffcc44';
      ctx.font = 'bold ' + Math.max(9, Math.round(ts * 0.28)) + 'px Segoe UI';
      ctx.fillText('[E]', sx + ts / 2, sy - ts * 0.4);
    }
  }
});

// Handle E key interaction with NPCs
GameEvents.on('keyDown', function(game, key) {
  if ((key === 'e' || key === 'E') && game.player.mode === 'overworld') {
    var tx = game.player.x + game.player.lastDir.x;
    var ty = game.player.y + game.player.lastDir.y;
    var npc = NPCManager.getAt(tx, ty);
    if (npc && npc.talkable) {
      game._talkingNpc = npc;
      StateStack.push(DialogueState);
      return true;
    }
  }
  return false;
}, 10); // priority 10 — runs before default E handler

// Block walking onto NPCs
var _origIsPassable = Overworld.isPassable;
Overworld.isPassable = function(wx, wy) {
  if (!_origIsPassable.call(Overworld, wx, wy)) return false;
  if (NPCManager.getAt(wx, wy)) return false;
  return true;
};

// No NPCs at game start — the wilderness is empty.
// Travellers are rare and only appear when there's a reason.

// Traveller types — each has a purpose for being in the wild
var TRAVELLER_TYPES = [
  { title: 'Hunter', bestSkill: 'combat', greeting: 'I\'m tracking game through these parts.' },
  { title: 'Woodcutter', bestSkill: 'woodcutting', greeting: 'Good timber around here.' },
  { title: 'Herbalist', bestSkill: 'herbalism', greeting: 'These lands have rare herbs.' },
  { title: 'Prospector', bestSkill: 'mining', greeting: 'I can smell ore in the hills.' },
  { title: 'Fisher', bestSkill: 'fishing', greeting: 'Any good fishing spots nearby?' },
  { title: 'Trader', bestSkill: 'gathering', greeting: 'I\'ve come a long way. Got anything to trade?' },
  { title: 'Adventurer', bestSkill: 'combat', greeting: 'I seek the ruins. Dangerous, but profitable.' },
];

// Rare traveller spawning — frequency scales with village reputation
GameEvents.on('turnEnd', function(game) {
  if (game.player.mode !== 'overworld') return;
  if (typeof BuildingManager === 'undefined') return;

  // Base check frequency: every 500 turns (~8 hours game time)
  // With buildings: every 300 turns
  // With high reputation: every 150 turns
  var rep = (typeof VillageReputation !== 'undefined') ? VillageReputation.calculate(game) : 0;
  var buildingCount = BuildingManager.buildings.length;
  var checkInterval = 500;
  if (buildingCount > 0) checkInterval = 300;
  if (rep >= 50) checkInterval = 150;
  if (rep >= 80) checkInterval = 100;

  if (GameTime.turn % checkInterval !== 0) return;

  // Spawn chance also scales: 20% base, up to 60% with high rep
  var spawnChance = 0.2 + Math.min(0.4, rep / 200);
  if (Math.random() > spawnChance) return;

  // Cap wanderers: 1 without buildings, vacant homes count with buildings
  var nonResidents = 0;
  for (var i = 0; i < NPCManager.npcs.length; i++) {
    if (!NPCManager.npcs[i].resident && NPCManager.npcs[i].alive && !NPCManager.npcs[i]._isGhost && !NPCManager.npcs[i].isMerchant) nonResidents++;
  }
  var maxWanderers = buildingCount > 0 ? Math.max(1, BuildingManager.getVacantHomes().length) : 1;
  if (nonResidents >= maxWanderers) return;

  // Spawn at edge of view
  var p = game.player;
  var edge = CONFIG.VIEW_W + 3;
  var dirs = [{x:edge,y:0},{x:-edge,y:0},{x:0,y:edge},{x:0,y:-edge}];
  var d = dirs[Math.floor(Math.random() * 4)];
  var sx = p.x + d.x + Math.floor(Math.random() * 5) - 2;
  var sy = p.y + d.y + Math.floor(Math.random() * 5) - 2;
  if (_origIsPassable.call(Overworld, sx, sy)) {
    var type = TRAVELLER_TYPES[Math.floor(Math.random() * TRAVELLER_TYPES.length)];
    var npc = new NPC(sx, sy);
    npc.state = 'walking';
    npc._travellerType = type;
    npc.dialogue = type.greeting;
    // Boost their specialty skill
    if (type.bestSkill && npc.skills[type.bestSkill] !== undefined) {
      npc.skills[type.bestSkill] = Math.max(npc.skills[type.bestSkill], 2 + Math.floor(Math.random() * 3));
    }
    NPCManager.add(npc);
    var direction = d.x > 0 ? 'east' : d.x < 0 ? 'west' : d.y > 0 ? 'south' : 'north';
    GameUtils.addLog('A ' + type.title.toLowerCase() + ' approaches from the ' + direction + '.', '#aaccaa');
  }
});

// Walking travellers move toward player area
GameEvents.on('turnEnd', function(game) {
  if (game.player.mode !== 'overworld') return;
  for (var i = 0; i < NPCManager.npcs.length; i++) {
    var npc = NPCManager.npcs[i];
    if (!npc.alive || npc.resident || npc.state !== 'walking') continue;
    var dx = game.player.x - npc.x, dy = game.player.y - npc.y;
    var dist = Math.abs(dx) + Math.abs(dy);
    // Stop walking when close to player
    if (dist < 8) { npc.state = 'idle'; continue; }
    // Move toward player slowly
    npc.moveAccum += 0.15;
    if (npc.moveAccum >= 1) { npc.moveAccum -= 1; npc.moveToward(game.player.x, game.player.y); }
    // Despawn if too far away (wandered off or player moved)
    if (dist > 60) { npc.alive = false; }
  }
  // Clean dead NPCs
  NPCManager.npcs = NPCManager.npcs.filter(function(n) { return n.alive; });
});

// Save/load NPCs
SaveSystem.register('npcs', {
  save: function() {
    return NPCManager.npcs.map(function(n) {
      return { x:n.x, y:n.y, name:n.name, body:n.body, bodyColor:n.bodyColor,
        hairColor:n.hairColor, hairStyle:n.hairStyle, skinColor:n.skinColor,
        height:n.height, frame:n.frame, skills:n.skills, relationship:n.relationship,
        resident:n.resident, home:n.home, job:n.job, speed:n.speed, state:n.state };
    });
  },
  load: function(data) {
    if (!data || !data.length) return;
    NPCManager.clear();
    for (var i = 0; i < data.length; i++) {
      var d = data[i];
      var npc = new NPC(d.x, d.y, d);
      npc.relationship = d.relationship || 0;
      npc.resident = d.resident || false;
      npc.home = d.home || null;
      npc.job = d.job || null;
      npc.speed = d.speed || 0.3;
      npc.state = d.state || 'idle';
      NPCManager.add(npc);
    }
  },
});
