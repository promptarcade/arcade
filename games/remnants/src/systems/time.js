
// ============================================================
// SYSTEM: Time — day/night cycle, seasons, turn-based clock
// ============================================================
// Each turn = ~1 minute game time
// 60 turns = 1 hour, 1440 turns = 1 day
// 30 days = 1 season, 4 seasons = 1 year

var GameTime = {
  turn: 0,           // total turns since game start
  minutesPerTurn: 1,
  hoursPerDay: 24,
  daysPerSeason: 30,
  seasonsPerYear: 4,
  seasonNames: ['Spring', 'Summer', 'Autumn', 'Winter'],

  // Derived values — recalculated for convenience
  turnsPerHour: 60,
  turnsPerDay: 1440,
  turnsPerSeason: 43200,
  turnsPerYear: 172800,

  init: function() {
    this.turn = 0;
  },

  tick: function() {
    this.turn++;
  },

  // Current time of day (0-23)
  hour: function() {
    return Math.floor((this.turn % this.turnsPerDay) / this.turnsPerHour);
  },

  // Current minute (0-59)
  minute: function() {
    return this.turn % this.turnsPerHour;
  },

  // Time as fraction of day (0.0 = midnight, 0.5 = noon)
  dayProgress: function() {
    return (this.turn % this.turnsPerDay) / this.turnsPerDay;
  },

  // Current day number (0-based)
  day: function() {
    return Math.floor(this.turn / this.turnsPerDay);
  },

  // Day within current season (0-29)
  dayOfSeason: function() {
    return this.day() % this.daysPerSeason;
  },

  // Current season index (0-3)
  season: function() {
    return Math.floor(this.day() / this.daysPerSeason) % this.seasonsPerYear;
  },

  seasonName: function() {
    return this.seasonNames[this.season()];
  },

  // Current year (0-based)
  year: function() {
    return Math.floor(this.turn / this.turnsPerYear);
  },

  // Is it daytime? (6am - 8pm)
  isDaytime: function() {
    var h = this.hour();
    return h >= 6 && h < 20;
  },

  // Is it night? (9pm - 5am)
  isNight: function() {
    var h = this.hour();
    return h >= 21 || h < 5;
  },

  // Dawn/dusk transition (5-6am, 8-9pm)
  isTransition: function() {
    return !this.isDaytime() && !this.isNight();
  },

  // Light level 0-1 based on time of day (smooth curve)
  lightLevel: function() {
    var p = this.dayProgress();
    // Midnight = 0, noon = 1, smooth sine curve
    // Offset so 0.25 (6am) starts rising, 0.75 (6pm) starts falling
    var raw = Math.sin((p - 0.25) * Math.PI);
    return Math.max(0.05, Math.min(1.0, raw * 0.6 + 0.4));
  },

  // Formatted time string "Day 3, Spring — 14:30"
  formatted: function() {
    var h = this.hour();
    var m = this.minute();
    return 'Day ' + (this.dayOfSeason() + 1) + ', ' + this.seasonName() +
      ' \u2014 ' + (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  },

  // Short format "14:30"
  timeString: function() {
    var h = this.hour();
    var m = this.minute();
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  },
};

// Tick time every turn
GameEvents.on('turnEnd', function(game) {
  GameTime.tick();
});

// Adjust overworld lighting based on time of day
GameEvents.on('draw:world', function(game, ctx) {
  if (game.player.mode !== 'overworld') return;
  var ll = GameTime.lightLevel();
  // Adjust ambient lighting
  game.pipeline._ambientIntensity = 0.03 + (1 - ll) * 0.15;
});

// Draw time in HUD
GameEvents.on('draw:ui', function(game, ctx) {
  if (StateStack.name() === 'title') return;
  var fs = Math.max(10, Math.round(CONFIG.WIDTH * 0.01));
  var w = CONFIG.WIDTH;
  // Time display — top center, below floor badge
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  var timeText = GameTime.formatted();
  ctx.font = Math.round(fs * 0.9) + 'px Segoe UI';
  ctx.textAlign = 'center';
  var tw = ctx.measureText(timeText).width + 20;
  var tx = (w - tw) / 2, ty = 2;
  // Only show in overworld (dungeon has floor badge there)
  if (game.player.mode === 'overworld') {
    ctx.fillRect(tx, ty, tw, fs * 1.6);
    // Time text colour based on day/night
    if (GameTime.isNight()) ctx.fillStyle = '#6688aa';
    else if (GameTime.isTransition()) ctx.fillStyle = '#cc9944';
    else ctx.fillStyle = '#ccccaa';
    ctx.fillText(timeText, w / 2, ty + fs * 1.1);
  }
});

// Save/load time
SaveSystem.register('time', {
  save: function() { return { turn: GameTime.turn }; },
  load: function(data) { if (data && data.turn) GameTime.turn = data.turn; },
});
