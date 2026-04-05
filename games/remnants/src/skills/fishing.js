
// ============================================================
// SKILL: Fishing — cast a line at water's edge, catch fish
// ============================================================

// --- Resources ---
ResourceRegistry.add({ id: 'trout',       name: 'Trout',       color: '#6688aa', category: 'fish', stackMax: 50 });
ResourceRegistry.add({ id: 'salmon',      name: 'Salmon',      color: '#dd7744', category: 'fish', stackMax: 50 });
ResourceRegistry.add({ id: 'golden_carp', name: 'Golden Carp', color: '#ffcc22', category: 'fish', stackMax: 20 });
ResourceRegistry.add({ id: 'dried_fish',  name: 'Dried Fish',  color: '#aa8855', category: 'food', stackMax: 50 });
ResourceRegistry.add({ id: 'fish_stew',   name: 'Fish Stew',   color: '#cc6633', category: 'food', stackMax: 20 });
ResourceRegistry.add({ id: 'sushi',       name: 'Sushi',       color: '#f0e8c8', category: 'food', stackMax: 30 });

// --- Tile: active fishing spot (shallow water edge with reeds and fish shadow) ---
var T_FISHING_SPOT = TileRegistry.add({
  id: 160,
  name: 'fishing_spot',
  solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = ((wx * 374761393 + wy * 668265263) >>> 0);

    // Shallow water base — lighter than deep water
    ctx.fillStyle = '#1e4060';
    ctx.fillRect(sx, sy, ts, ts);

    // Inner lighter water
    ctx.fillStyle = '#245070';
    ctx.fillRect(sx + m, sy + m, ts - 2*m, ts - 2*m);

    // Sandy/muddy shallows tint along bottom edge
    ctx.fillStyle = 'rgba(160, 130, 80, 0.18)';
    ctx.fillRect(sx, sy + ts - 4*m, ts, 4*m);

    // Animated ripples
    var rph = animTimer * 1.4 + (h & 0xff) * 0.025;
    ctx.fillStyle = 'rgba(90, 180, 255, 0.22)';
    var ry1 = sy + ts * 0.28 + Math.sin(rph) * ts * 0.07;
    ctx.fillRect(sx + 2*m, ry1, ts - 4*m, Math.max(1, m * 0.7));
    var ry2 = sy + ts * 0.58 + Math.sin(rph + 1.8) * ts * 0.07;
    ctx.fillRect(sx + 3*m, ry2, ts - 6*m, Math.max(1, m * 0.6));
    ctx.fillStyle = 'rgba(140, 210, 255, 0.14)';
    var ry3 = sy + ts * 0.43 + Math.sin(rph + 3.4) * ts * 0.05;
    ctx.fillRect(sx + 5*m, ry3, ts * 0.35, Math.max(1, m * 0.5));

    // Reeds — 2–3 tall stems growing from bottom, positions from hash
    var reedSway = Math.sin(animTimer * 1.1 + (h >> 4) * 0.08) * m * 0.6;
    ctx.fillStyle = '#3a6a30';
    // Reed 1
    var rx1 = sx + ((h % 5) + 2) * m;
    ctx.fillRect(rx1 + reedSway, sy + 5*m, m * 0.8, ts - 5*m);
    // Reed head 1
    ctx.fillStyle = '#5a4a20';
    ctx.fillRect(rx1 + reedSway - m * 0.2, sy + 4*m, m * 1.2, m * 2);
    // Reed 2
    ctx.fillStyle = '#3a6a30';
    var rx2 = sx + (((h >> 6) % 4) + 9) * m;
    ctx.fillRect(rx2 - reedSway * 0.7, sy + 7*m, m * 0.8, ts - 7*m);
    ctx.fillStyle = '#5a4a20';
    ctx.fillRect(rx2 - reedSway * 0.7 - m * 0.2, sy + 6*m, m * 1.2, m * 1.8);
    // Optional 3rd thin reed
    if ((h >> 12) % 3 === 0) {
      ctx.fillStyle = '#4a7a38';
      var rx3 = sx + (((h >> 9) % 3) + 5) * m;
      ctx.fillRect(rx3 + reedSway * 0.5, sy + 8*m, m * 0.6, ts - 8*m);
    }

    // Fish shadow drifting beneath surface
    var fishPhase = animTimer * 0.55 + (h >> 3) * 0.04;
    var fishX = sx + ts * 0.5 + Math.sin(fishPhase) * ts * 0.22;
    var fishY = sy + ts * 0.55 + Math.cos(fishPhase * 0.7) * ts * 0.08;
    ctx.fillStyle = 'rgba(10, 30, 55, 0.45)';
    // Body
    ctx.beginPath();
    ctx.ellipse(fishX, fishY, m * 2.6, m * 0.9, Math.sin(fishPhase) * 0.25, 0, Math.PI * 2);
    ctx.fill();
    // Tail fin
    var tailDir = Math.sin(fishPhase) >= 0 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(fishX - tailDir * m * 2.2, fishY);
    ctx.lineTo(fishX - tailDir * m * 3.8, fishY - m * 0.9);
    ctx.lineTo(fishX - tailDir * m * 3.8, fishY + m * 0.9);
    ctx.closePath();
    ctx.fill();

    // Sparkle on water to draw player attention
    var sparkle = 0.5 + Math.sin(animTimer * 3.2 + (h & 0xf) * 0.4) * 0.5;
    ctx.fillStyle = 'rgba(200, 240, 255, ' + (sparkle * 0.55).toFixed(2) + ')';
    ctx.beginPath();
    ctx.arc(sx + (((h >> 2) % 8) + 4) * m, sy + (((h >> 5) % 5) + 3) * m, m * 0.5, 0, Math.PI * 2);
    ctx.fill();
  },
});

// --- Tile: fished-out spot (water edge without fish, reeds bent) ---
var T_FISHED_OUT = TileRegistry.add({
  id: 161,
  name: 'fished_out',
  solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h = ((wx * 374761393 + wy * 668265263) >>> 0);

    // Same shallow water base
    ctx.fillStyle = '#1e4060';
    ctx.fillRect(sx, sy, ts, ts);
    ctx.fillStyle = '#245070';
    ctx.fillRect(sx + m, sy + m, ts - 2*m, ts - 2*m);

    // Muddy shallows
    ctx.fillStyle = 'rgba(160, 130, 80, 0.18)';
    ctx.fillRect(sx, sy + ts - 4*m, ts, 4*m);

    // Slow, faint ripple — fish are gone
    var rph = animTimer * 0.7 + (h & 0xff) * 0.025;
    ctx.fillStyle = 'rgba(90, 180, 255, 0.10)';
    var ry1 = sy + ts * 0.35 + Math.sin(rph) * ts * 0.05;
    ctx.fillRect(sx + 3*m, ry1, ts - 6*m, Math.max(1, m * 0.5));
    var ry2 = sy + ts * 0.62 + Math.sin(rph + 2.1) * ts * 0.05;
    ctx.fillRect(sx + 4*m, ry2, ts - 8*m, Math.max(1, m * 0.4));

    // Bent/drooping reeds — same positions as active spot
    var rx1 = sx + ((h % 5) + 2) * m;
    ctx.fillStyle = '#2a5228';
    ctx.fillRect(rx1, sy + 7*m, m * 0.7, ts - 7*m);
    ctx.fillStyle = '#4a3a18';
    ctx.fillRect(rx1 - m * 0.3, sy + 6*m, m * 1.0, m * 1.5);

    var rx2 = sx + (((h >> 6) % 4) + 9) * m;
    ctx.fillStyle = '#2a5228';
    ctx.fillRect(rx2, sy + 9*m, m * 0.7, ts - 9*m);
    ctx.fillStyle = '#4a3a18';
    ctx.fillRect(rx2 - m * 0.2, sy + 8*m, m * 1.0, m * 1.5);

    // Ripple ring left by bait — fades
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.15)';
    ctx.lineWidth = Math.max(0.4, m * 0.3);
    ctx.beginPath();
    ctx.ellipse(sx + 8*m, sy + 9*m, 3*m, 1.5*m, 0, 0, Math.PI * 2);
    ctx.stroke();
  },
});

// --- Skill registration ---
SkillRegistry.add({
  id: 'fishing',
  name: 'Fishing',
  color: '#4488cc',
  tileIds: [T_FISHING_SPOT],

  populate: function(tile, biome, wx, wy, rng) {
    if (tile.type === T.WALL || tile.type === T.WATER) return null;
    // Only on beach tiles adjacent to water/shallows
    if (tile.type !== T.BEACH) return null;
    // Sparse — not every shore tile gets fish
    var chance = biome.id === 'swamp' ? 0.06 : 0.02;
    if (rng() < chance) return T_FISHING_SPOT;
    return null;
  },

  onInteract: function(game, tileType, wx, wy) {
    if (tileType !== T_FISHING_SPOT) return false;

    var p = game.player;
    var level = PlayerSkills.getLevel(p.skills, 'fishing');

    // Check for bait in bag — worm improves catch quality
    var hasBait = Bag.has(p.bag, 'worm', 1);
    if (hasBait) Bag.remove(p.bag, 'worm', 1);

    // Base catch roll — bait shifts thresholds toward rarer fish
    var roll = Math.random();
    var baitBonus = hasBait ? 0.12 : 0;
    var levelBonus = level * 0.015;

    // Thresholds (before bonuses): trout <0.70, salmon <0.90, golden carp beyond
    // Level and bait push the rare boundary down (easier to get rarer fish)
    var salmonThresh    = 0.70 - baitBonus - levelBonus;
    var carpThresh      = 0.90 - baitBonus * 1.5 - levelBonus * 1.5;
    // Golden Carp requires level 5+
    var carpAllowed     = level >= 5;

    var fishId, fishName, fishColor, xp;

    if (carpAllowed && roll >= carpThresh) {
      fishId    = 'golden_carp';
      fishName  = 'Golden Carp';
      fishColor = '#ffcc22';
      xp        = 8;
    } else if (roll >= salmonThresh) {
      fishId    = 'salmon';
      fishName  = 'Salmon';
      fishColor = '#dd7744';
      xp        = 5;
    } else {
      fishId    = 'trout';
      fishName  = 'Trout';
      fishColor = '#6688aa';
      xp        = 3;
    }

    Bag.add(p.bag, fishId, 1);

    var result = PlayerSkills.addXp(p.skills, 'fishing', xp);

    // Mark spot as fished out
    Overworld.setTile(wx, wy, T_FISHED_OUT);

    var baitMsg = hasBait ? ' (bait)' : '';
    var logMsg  = '+1 ' + fishName + baitMsg;
    SFX.heal(); // soft pleasant chime on a catch
    game.addLog(logMsg, fishColor);
    game.addFloating(wx, wy, '+1 ' + fishName, fishColor);

    if (result.leveled) {
      game.addLog('Fishing level ' + result.level + '!', '#ffcc44');
      SFX.stairs();
    }
    return true;
  },

  recipes: [
    { skill: 'fishing', level: 1, name: 'Dried Fish',  input: { trout: 3 },                       output: { dried_fish: 2 } },
    { skill: 'fishing', level: 3, name: 'Fish Stew',   input: { salmon: 1, carrot: 1 },            output: { fish_stew: 1 }, requires: ['Dried Fish'] },
    { skill: 'fishing', level: 5, name: 'Sushi',       input: { golden_carp: 1 },                  output: { sushi: 3 }, requires: ['Fish Stew'] },
  ],
});

RecipeRegistry.addAll(SkillRegistry.get('fishing').recipes);

// Pond tile — player-built water feature, also a fishing spot
var T_POND = TileRegistry.add({
  id: 162, name: 'pond', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    // Stone border
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(sx, sy, ts, ts);
    // Water inside
    ctx.fillStyle = '#1a3055';
    ctx.fillRect(sx + 2*m, sy + 2*m, 12*m, 12*m);
    // Ripple
    var rip = Math.sin(animTimer * 1.5 + (wx||0) * 0.5) * m;
    ctx.fillStyle = 'rgba(80,150,230,0.15)';
    ctx.fillRect(sx + 3*m, sy + 6*m + rip, 10*m, Math.max(1, m * 0.5));
    // Fish shadow occasionally
    if (Math.sin(animTimer * 0.7 + (wx||0) + (wy||0)) > 0.5) {
      ctx.fillStyle = 'rgba(40,60,80,0.3)';
      ctx.beginPath();
      ctx.ellipse(sx + 8*m + Math.sin(animTimer + (wx||0)) * 2*m, sy + 9*m, 2*m, 1*m, 0, 0, Math.PI*2);
      ctx.fill();
    }
  },
  onInteract: function(game, wx, wy) {
    // Fishing from player-built pond — same as fishing spot
    var fishInteract = TileRegistry.getInteraction(T_FISHING_SPOT);
    if (fishInteract) fishInteract(game, wx, wy);
  },
});

// Register pond as a fishing tile too
var fishSkill = SkillRegistry.get('fishing');
if (fishSkill) fishSkill.tileIds.push(T_POND);

// Dock tile — built on water's edge, enables deep water fishing
var T_DOCK = TileRegistry.add({
  id: 163, name: 'dock', solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    // Water underneath
    ctx.fillStyle = '#1a3050';
    ctx.fillRect(sx, sy, ts, ts);
    ctx.fillStyle = 'rgba(80,150,230,0.1)';
    ctx.fillRect(sx, sy + ts * 0.4 + Math.sin(animTimer + (wx||0)) * 2, ts, 2);
    // Wooden planks
    ctx.fillStyle = '#7a6a45';
    ctx.fillRect(sx + 2*m, sy + 3*m, 12*m, 10*m);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.5;
    for (var i = 0; i < 5; i++) ctx.strokeRect(sx + 2*m, sy + 3*m + i * 2*m, 12*m, 2*m);
    // Posts
    ctx.fillStyle = '#5a4a30';
    ctx.fillRect(sx + 2*m, sy + 2*m, 2*m, 12*m);
    ctx.fillRect(sx + 12*m, sy + 2*m, 2*m, 12*m);
  },
  onInteract: function(game, wx, wy) {
    // Deep water fishing — better catch rates
    var p = game.player;
    var check = checkTool(p, 'fishing');
    if (!check.allowed) { GameUtils.addLog(check.message, '#cc8844'); return; }
    var level = PlayerSkills.getLevel(p.skills, 'fishing');
    // Better odds from dock
    var roll = Math.random();
    var fishId, fishName, fishColor, xp;
    if (roll < 0.1 + level * 0.02) { fishId = 'golden_carp'; fishName = 'Golden Carp'; fishColor = '#ffcc44'; xp = 10; }
    else if (roll < 0.4 + level * 0.03) { fishId = 'salmon'; fishName = 'Salmon'; fishColor = '#dd7744'; xp = 6; }
    else { fishId = 'trout'; fishName = 'Trout'; fishColor = '#6688aa'; xp = 4; }
    Bag.add(p.bag, fishId, 1);
    if (check.toolId) useTool(p, check.toolId);
    var result = PlayerSkills.addXp(p.skills, 'fishing', xp);
    GameUtils.addLog('+1 ' + fishName + ' (from dock)', fishColor);
    GameUtils.addFloating(wx, wy, '+' + fishName, fishColor);
    SFX.heal();
    if (result.leveled) { GameUtils.addLog('Fishing level ' + result.level + '!', '#ffcc44'); }
  },
});

// Building blueprints
BlueprintRegistry.add({
  id: 'pond',
  name: 'Pond',
  desc: 'Dig a small pond. Fish will come.',
  cost: { stone: 8, oak_log: 2 },
  size: { w: 1, h: 1 },
  tiles: [{ dx: 0, dy: 0, type: T_POND }],
});

BlueprintRegistry.add({
  id: 'fishing_dock',
  name: 'Fishing Dock',
  desc: 'Build on shore. Better fish from deeper water.',
  cost: { oak_log: 8, plank: 5, branch: 3 },
  size: { w: 1, h: 1 },
  tiles: [{ dx: 0, dy: 0, type: T_DOCK }],
});
