
// ============================================================
// SYSTEM: Dungeon Transitions — enter, exit, floor changes, caching
// ============================================================

// Floor state cache — persists tile maps and loot between floor visits
var _revealedCache = {}; // 'seed_floor' -> revealed 2d array
var _floorMapCache = {}; // 'seed_floor' -> { map, loot }

// Persist floor cache across save/load
SaveSystem.register('floorCache', {
  save: function() {
    return { revealed: _revealedCache, maps: _floorMapCache };
  },
  load: function(data) {
    if (data && data.revealed) _revealedCache = data.revealed;
    if (data && data.maps) _floorMapCache = data.maps;
  },
});

// Save current floor state to cache
function _saveDungeonFloor(game) {
  if (game.dungeon && game.dungeonSeed) {
    var key = game.dungeonSeed + '_' + game.player.floor;
    _revealedCache[key] = game.dungeon.revealed;
    _floorMapCache[key] = { map: game.dungeon.map, loot: game.dungeon.loot };
  }
}

// Restore cached floor state (returns true if cache existed)
function _restoreDungeonFloor(game) {
  var key = (game.dungeonSeed || 0) + '_' + game.player.floor;
  if (_revealedCache[key]) game.dungeon.revealed = _revealedCache[key];
  if (_floorMapCache[key]) {
    game.dungeon.map = _floorMapCache[key].map;
    game.dungeon.loot = _floorMapCache[key].loot;
    return true;
  }
  return false;
}

// Transition: overworld -> dungeon
Game.prototype.enterDungeon = function() {
  this.player.mode = 'dungeon';
  this.player.worldX = this.player.x;
  this.player.worldY = this.player.y;
  this.dungeonSeed = ((this.player.x * 374761393 + this.player.y * 668265263 + Overworld.seed) >>> 0);
  this.player.floor = 0;
  this.addLog('You enter the ruins...', '#aaa');
  this.generateFloor();
  this.pipeline._ambientColor = '#020204';
  this.pipeline._ambientIntensity = 0.05;
  GameEvents.fire('enterDungeon', this);
  GameEvents.fire('modeChange', this, 'dungeon');
};

// Transition: dungeon -> overworld
Game.prototype.exitDungeon = function() {
  _saveDungeonFloor(this);
  this.player.mode = 'overworld';
  this.player.x = this.player.worldX;
  this.player.y = this.player.worldY;
  this.player.floor = 0;
  this.dungeon = null;
  this.enemies = [];
  this.addLog('You return to the surface.', '#aaccff');
  this.pipeline._ambientColor = '#0a1008';
  this.pipeline._ambientIntensity = 0.08;
  GameEvents.fire('exitDungeon', this);
  GameEvents.fire('modeChange', this, 'overworld');
};

// Go up one floor within the dungeon
Game.prototype.goUpFloor = function() {
  _saveDungeonFloor(this);
  this.player.floor--;
  this.dungeon = generateDungeon(this.player.floor, this.dungeonSeed || 0);
  var revisited = _restoreDungeonFloor(this);
  this.player.x = this.dungeon.stairsX;
  this.player.y = this.dungeon.stairsY;
  this.dungeon.map[this.dungeon.spawnY][this.dungeon.spawnX] = T.STAIRS_UP;
  // Enemies respawn but fewer on revisited floors
  this.enemies = [];
  var bIdx = getBiomeIndex(this.player.floor);
  var archList = Object.keys(ARCHETYPES);
  for (var i = 0; i < this.dungeon.rooms.length; i++) {
    var room = this.dungeon.rooms[i];
    if (room.type === 'spawn' || room.type === 'shrine' || room.type === 'rest') continue;
    if (room.type === 'boss') {
      if (!revisited) this.enemies.push(createBoss(Math.floor(room.x + room.w / 2), Math.floor(room.y + room.h / 2), this.player.floor, bIdx));
      continue;
    }
    var count = 2 + Math.floor(Math.random() * (1 + this.player.floor * 0.3));
    if (revisited) count = Math.max(1, Math.floor(count * 0.3));
    for (var j = 0; j < count; j++) {
      var ex = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.w - 2));
      var ey = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.h - 2));
      if (ex >= room.x && ex < room.x + room.w && ey >= room.y && ey < room.y + room.h) {
        var tile = this.dungeon.map[ey][ex];
        if (tile === T.FLOOR || tile === T.WATER || tile === T.FUNGAL || tile === T.OIL) {
          var arch, roll = Math.random();
          if (this.player.floor < 3) { arch = roll < 0.4 ? 'swarm' : roll < 0.7 ? 'stalker' : 'shambler'; }
          else if (this.player.floor < 7) { arch = roll < 0.2 ? 'swarm' : roll < 0.4 ? 'stalker' : roll < 0.6 ? 'shambler' : roll < 0.85 ? 'caster' : 'brute'; }
          else if (this.player.floor < 13) { arch = roll < 0.15 ? 'swarm' : roll < 0.3 ? 'stalker' : roll < 0.5 ? 'shambler' : roll < 0.7 ? 'caster' : roll < 0.95 ? 'brute' : 'dragon'; }
          else { arch = roll < 0.1 ? 'swarm' : roll < 0.25 ? 'stalker' : roll < 0.4 ? 'shambler' : roll < 0.6 ? 'caster' : roll < 0.85 ? 'brute' : 'dragon'; }
          this.enemies.push(new Enemy(ex, ey, arch, this.player.floor, bIdx));
        }
      }
    }
  }
  this.revealAround(this.player.x, this.player.y, this.player.visionRadius);
  this.addLog('Ascended to floor ' + this.player.floor, '#aaccff');
  this.pipeline._ambientColor = this.dungeon.biome.ambientColor;
  this.pipeline._ambientIntensity = this.dungeon.biome.ambientIntensity;
};
