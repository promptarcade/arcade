
// ============================================================
// SYSTEM: Weather — rain, sun, storms, snow by season
// ============================================================

var Weather = {
  current: 'clear', // clear, cloudy, rain, storm, snow, fog
  intensity: 0,     // 0-1
  duration: 0,      // turns remaining
  particles: [],    // visual rain/snow particles

  // Weather weights by season: [clear, cloudy, rain, storm, snow, fog]
  seasonWeights: {
    Spring: [30, 25, 30, 10, 0, 5],
    Summer: [50, 20, 15, 10, 0, 5],
    Autumn: [20, 30, 25, 10, 5, 10],
    Winter: [15, 20, 10, 5, 40, 10],
  },

  roll: function() {
    var season = GameTime.seasonName();
    var weights = this.seasonWeights[season] || this.seasonWeights.Spring;
    var types = ['clear', 'cloudy', 'rain', 'storm', 'snow', 'fog'];
    var total = 0;
    for (var i = 0; i < weights.length; i++) total += weights[i];
    var r = Math.random() * total;
    var acc = 0;
    for (var i = 0; i < weights.length; i++) {
      acc += weights[i];
      if (r < acc) {
        this.current = types[i];
        this.intensity = 0.3 + Math.random() * 0.7;
        this.duration = 300 + Math.floor(Math.random() * 600); // 5-15 game-minutes
        return;
      }
    }
    this.current = 'clear';
    this.intensity = 0;
    this.duration = 500;
  },

  isBadWeather: function() {
    return this.current === 'rain' || this.current === 'storm' || this.current === 'snow';
  },

  // Farming yield multiplier based on weather
  farmingMult: function() {
    if (this.current === 'rain') return 1.3;
    if (this.current === 'storm') return 0.7;
    if (this.current === 'snow') return 0.3;
    if (this.current === 'clear') return 1.0;
    return 0.9;
  },
};

// Roll new weather periodically
GameEvents.on('turnEnd', function(game) {
  if (game.player.mode !== 'overworld') return;
  if (Weather.duration > 0) {
    Weather.duration--;
  } else {
    Weather.roll();
  }
});

// Draw weather particles
GameEvents.on('update', function(game, dt) {
  if (game.player.mode !== 'overworld') return;
  var w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
  var type = Weather.current;
  var intensity = Weather.intensity;

  // Manage particle count
  var targetCount = 0;
  if (type === 'rain') targetCount = Math.floor(intensity * 80);
  else if (type === 'storm') targetCount = Math.floor(intensity * 150);
  else if (type === 'snow') targetCount = Math.floor(intensity * 50);

  // Spawn particles
  while (Weather.particles.length < targetCount) {
    Weather.particles.push({
      x: Math.random() * w,
      y: -Math.random() * h * 0.2,
      vx: type === 'storm' ? (2 + Math.random() * 3) : (type === 'snow' ? (Math.random() - 0.5) * 0.5 : 0),
      vy: type === 'snow' ? (0.5 + Math.random() * 0.8) : (2 + Math.random() * 3),
      life: 1,
    });
  }
  // Remove excess
  while (Weather.particles.length > targetCount) Weather.particles.pop();

  // Update particles
  for (var i = Weather.particles.length - 1; i >= 0; i--) {
    var p = Weather.particles[i];
    p.x += p.vx * dt * 60;
    p.y += p.vy * dt * 60;
    if (p.y > h || p.x > w || p.x < -10) {
      p.x = Math.random() * w;
      p.y = -5;
      if (type === 'storm') p.x -= 50;
    }
  }
});

// Draw weather overlay on UI layer (screen space, not world space)
GameEvents.on('draw:ui', function(game, ctx) {
  if (game.player.mode !== 'overworld') return;
  if (StateStack.name() === 'title') return;
  var type = Weather.current;
  var intensity = Weather.intensity;
  var w = CONFIG.WIDTH, h = CONFIG.HEIGHT;

  // Atmosphere tint
  if (type === 'cloudy' || type === 'rain') {
    ctx.fillStyle = 'rgba(20,25,40,' + (0.08 * intensity).toFixed(3) + ')';
    ctx.fillRect(0, 0, w, h);
  } else if (type === 'storm') {
    ctx.fillStyle = 'rgba(10,10,30,' + (0.15 * intensity).toFixed(3) + ')';
    ctx.fillRect(0, 0, w, h);
    // Occasional lightning flash
    if (Math.random() < 0.002 * intensity) {
      ctx.fillStyle = 'rgba(200,200,255,0.15)';
      ctx.fillRect(0, 0, w, h);
    }
  } else if (type === 'fog') {
    ctx.fillStyle = 'rgba(180,180,180,' + (0.1 * intensity).toFixed(3) + ')';
    ctx.fillRect(0, 0, w, h);
  } else if (type === 'snow') {
    ctx.fillStyle = 'rgba(200,210,230,' + (0.06 * intensity).toFixed(3) + ')';
    ctx.fillRect(0, 0, w, h);
  }

  // Draw particles
  if (Weather.particles.length > 0) {
    if (type === 'rain' || type === 'storm') {
      ctx.strokeStyle = 'rgba(150,170,220,' + (0.3 * intensity).toFixed(2) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var i = 0; i < Weather.particles.length; i++) {
        var p = Weather.particles[i];
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2);
      }
      ctx.stroke();
    } else if (type === 'snow') {
      ctx.fillStyle = 'rgba(240,245,255,' + (0.6 * intensity).toFixed(2) + ')';
      for (var i = 0; i < Weather.particles.length; i++) {
        var p = Weather.particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5 + Math.sin(p.x * 0.1) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Weather indicator — small icon in top right area
  var fs = Math.max(10, Math.round(w * 0.01));
  var weatherText = Weather.current.charAt(0).toUpperCase() + Weather.current.slice(1);
  var weatherColor = '#aaa';
  if (type === 'rain') weatherColor = '#6688cc';
  else if (type === 'storm') weatherColor = '#8866cc';
  else if (type === 'snow') weatherColor = '#aabbdd';
  else if (type === 'clear') weatherColor = '#ccaa44';
  else if (type === 'fog') weatherColor = '#999999';

  ctx.fillStyle = weatherColor;
  ctx.font = Math.round(fs * 0.9) + 'px Segoe UI';
  ctx.textAlign = 'right';
  ctx.fillText(weatherText, w - 10, CONFIG.HEIGHT * 0.07);
});

// Weather affects overworld lighting
GameEvents.on('draw:world', function(game, ctx) {
  if (game.player.mode !== 'overworld') return;
  var type = Weather.current;
  // Darken during bad weather
  if (type === 'storm') {
    game.pipeline._ambientIntensity = Math.min(0.2, game.pipeline._ambientIntensity + 0.08);
  } else if (type === 'rain' || type === 'fog') {
    game.pipeline._ambientIntensity = Math.min(0.15, game.pipeline._ambientIntensity + 0.04);
  }
});

// Save/load weather
SaveSystem.register('weather', {
  save: function() {
    return { current: Weather.current, intensity: Weather.intensity, duration: Weather.duration };
  },
  load: function(data) {
    if (!data) return;
    Weather.current = data.current || 'clear';
    Weather.intensity = data.intensity || 0;
    Weather.duration = data.duration || 0;
  },
});
