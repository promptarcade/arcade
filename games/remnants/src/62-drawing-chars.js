// shadeHex is in 03b-util.js

// Draw hair from top-down (bird's eye) view based on hairstyle
function _drawTopDownHair(ctx, cx, cy, m, hairStyle, hairColor, skinColor) {
  var hc = hairColor || '#443322';
  var sc = skinColor || '#ffcc88';
  hairStyle = hairStyle || 'short';

  if (hairStyle === 'bald') {
    // Just skin
    ctx.fillStyle = sc;
    ctx.beginPath(); ctx.arc(cx, cy, 2.8 * m, 0, Math.PI * 2); ctx.fill();
  } else if (hairStyle === 'short') {
    // Full hair circle
    ctx.fillStyle = hc;
    ctx.beginPath(); ctx.arc(cx, cy, 3 * m, 0, Math.PI * 2); ctx.fill();
  } else if (hairStyle === 'long') {
    // Larger oval flowing down
    ctx.fillStyle = hc;
    ctx.beginPath(); ctx.ellipse(cx, cy, 3.5 * m, 4 * m, 0, 0, Math.PI * 2); ctx.fill();
  } else if (hairStyle === 'spiky') {
    // Base circle with spike points
    ctx.fillStyle = hc;
    ctx.beginPath(); ctx.arc(cx, cy, 2.8 * m, 0, Math.PI * 2); ctx.fill();
    // Spikes radiating out
    for (var si = 0; si < 6; si++) {
      var angle = si * Math.PI / 3;
      var sx = cx + Math.cos(angle) * 3.5 * m;
      var sy = cy + Math.sin(angle) * 3.5 * m;
      ctx.fillRect(sx - 0.7 * m, sy - 0.7 * m, 1.4 * m, 1.4 * m);
    }
  } else if (hairStyle === 'ponytail') {
    // Circle with tail extending one direction
    ctx.fillStyle = hc;
    ctx.beginPath(); ctx.arc(cx, cy, 2.8 * m, 0, Math.PI * 2); ctx.fill();
    // Ponytail trailing behind (downward from top-down view)
    ctx.fillRect(cx - 1 * m, cy + 2.5 * m, 2 * m, 3 * m);
    ctx.beginPath(); ctx.arc(cx, cy + 5.5 * m, 1 * m, 0, Math.PI * 2); ctx.fill();
  } else if (hairStyle === 'mohawk') {
    // Skin sides, hair strip down middle
    ctx.fillStyle = sc;
    ctx.beginPath(); ctx.arc(cx, cy, 2.8 * m, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hc;
    ctx.fillRect(cx - 1 * m, cy - 3.5 * m, 2 * m, 7 * m);
  } else {
    // Fallback: plain circle
    ctx.fillStyle = hc;
    ctx.beginPath(); ctx.arc(cx, cy, 3 * m, 0, Math.PI * 2); ctx.fill();
  }
}

// Draw humanoid character with walk cycle
// walkPhase: 0 = idle, >0 = walk cycle progress (0-1 repeating)
// opts: { hairStyle, hairColor } — optional extended options
function drawCharPixel(ctx, sx, sy, ts, bodyColor, eyeColor, headColor, weaponColor, walkPhase, opts) {
  var m = ts / 16;
  var walking = walkPhase > 0;
  var cycle = walking ? Math.sin(walkPhase * Math.PI * 6) : 0;
  var headBob = walking ? Math.abs(Math.sin(walkPhase * Math.PI * 6)) * m * 0.8 : 0;
  var bodyDark = shadeHex(bodyColor, -40);
  var headDark = shadeHex(headColor || bodyColor, -30);
  var hairStyle = (opts && opts.hairStyle) || 'short';
  var hairColor = (opts && opts.hairColor) || shadeHex(bodyColor, 30);
  var hairDark = shadeHex(hairColor, -30);
  var bodyType = (opts && opts.body) || 'broad';
  var height = (opts && opts.height) || 'average';
  var frame = (opts && opts.frame) || 'average';
  var facing = (opts && opts.facing) || 'front';

  // Base proportions
  var legW=2.5, legX1=5, legX2=8.5, bodyW=8, bodyX=4, armW=2.5, armX1=2, armX2=11.5;
  var hipY=5, hipH=2.5, chestY=2, chestH=5.5, legY=7, legH=3.5;
  var vertOff=0, isNarrow=bodyType==='narrow';

  // Frame: stocky vs slim
  if(frame==='stocky'){
    bodyW=9; bodyX=3.5; legW=3; legX1=4; legX2=9; legH=Math.max(legH-0.5,3);
    armW=3; armX1=1; armX2=12;
  } else if(frame==='slim'){
    bodyW=7; bodyX=4.5; legW=2; legX1=5.5; legX2=9; legH=legH+0.5;
    armW=2; armX1=2.5; armX2=11.5;
  }
  // Height: tall vs short
  if(height==='tall'){ vertOff=-2; legH+=1; chestH+=0.5; chestY-=1; }
  else if(height==='short'){ vertOff=2; legH=Math.max(legH-1,2); chestH=Math.max(chestH-1,4); hipH=Math.max(hipH-0.5,1.5); }
  // Feminine: narrower waist, wider hips
  if(isNarrow){
    armW=Math.min(armW,2.2); armX1=Math.max(armX1,2.5); armX2=Math.min(armX2,11.5);
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(sx+8*m, sy+11*m, 4*m, 1.2*m, 0, 0, Math.PI*2); ctx.fill();

  var vo=vertOff*m; // vertical offset for tall/short

  // Left leg
  var lLeg = walking ? cycle * 2 * m : 0;
  ctx.fillStyle = bodyDark;
  ctx.fillRect(sx+legX1*m, sy+(legY+vertOff)*m+lLeg, legW*m, legH*m-Math.abs(lLeg)*0.3);
  ctx.fillStyle = '#443322';
  ctx.fillRect(sx+(legX1-0.5)*m, sy+(legY+vertOff+legH-1)*m+lLeg, (legW+1)*m, 1.5*m);

  // Right leg
  var rLeg = walking ? -cycle * 2 * m : 0;
  ctx.fillStyle = bodyDark;
  ctx.fillRect(sx+legX2*m, sy+(legY+vertOff)*m+rLeg, legW*m, legH*m-Math.abs(rLeg)*0.3);
  ctx.fillStyle = '#443322';
  ctx.fillRect(sx+(legX2-0.5)*m, sy+(legY+vertOff+legH-1)*m+rLeg, (legW+1)*m, 1.5*m);

  // Body — torso
  ctx.fillStyle = bodyColor;
  ctx.fillRect(sx+bodyX*m, sy+(chestY+vertOff)*m-headBob, bodyW*m, chestH*m);
  // Lower body / hips
  ctx.fillStyle = bodyDark;
  if(isNarrow){
    // Wider hips flaring out from waist
    var hipW=bodyW+2;
    ctx.fillRect(sx+(bodyX-1)*m, sy+(hipY+vertOff)*m-headBob, hipW*m, hipH*m);
    // Waist taper — dark insets on sides to create hourglass
    ctx.fillStyle = shadeHex(bodyColor, -25);
    ctx.fillRect(sx+bodyX*m, sy+(chestY+vertOff+1.5)*m-headBob, 1.2*m, 2*m);
    ctx.fillRect(sx+(bodyX+bodyW-1.2)*m, sy+(chestY+vertOff+1.5)*m-headBob, 1.2*m, 2*m);
    // Chest — slight forward curve using lighter band
    ctx.fillStyle = shadeHex(bodyColor, 12);
    ctx.fillRect(sx+(bodyX+0.5)*m, sy+(chestY+vertOff+0.3)*m-headBob, (bodyW-1)*m, 1.8*m);
    // Subtle shadow line under chest for depth
    ctx.fillStyle = shadeHex(bodyColor, -10);
    ctx.fillRect(sx+(bodyX+1)*m, sy+(chestY+vertOff+2.1)*m-headBob, (bodyW-2)*m, 0.6*m);
  } else {
    ctx.fillRect(sx+bodyX*m, sy+(hipY+vertOff)*m-headBob, bodyW*m, hipH*m);
  }

  // Arms
  var armSwing = walking ? cycle * 1.5 * m : 0;
  ctx.fillStyle = headColor || bodyColor;
  ctx.fillRect(sx+armX1*m, sy+(chestY+0.5+vertOff)*m-headBob-armSwing, armW*m, 4*m);
  ctx.fillRect(sx+armX2*m, sy+(chestY+0.5+vertOff)*m-headBob+armSwing, armW*m, 4*m);

  // Weapon in right hand — style based on weapon type
  var wpnType = (opts && opts.weaponType) || (weaponColor ? 'sword' : null);
  if (weaponColor && wpnType) {
    var wy = sy+(chestY-3+vertOff)*m-headBob+armSwing;
    if (wpnType === 'sword') {
      ctx.fillStyle = weaponColor;
      ctx.fillRect(sx+12.5*m, wy, 1.5*m, 5*m);
      ctx.fillStyle = '#886633';
      ctx.fillRect(sx+12*m, wy+4.5*m, 2.5*m, 1.5*m);
    } else if (wpnType === 'wand') {
      ctx.fillStyle = '#886644';
      ctx.fillRect(sx+13*m, wy+1*m, 1*m, 6*m);
      ctx.fillStyle = weaponColor;
      ctx.fillRect(sx+12.5*m, wy, 2*m, 2*m);
    } else if (wpnType === 'staff') {
      ctx.fillStyle = '#886644';
      ctx.fillRect(sx+13*m, wy-1*m, 1.2*m, 8*m);
      ctx.fillStyle = weaponColor;
      ctx.beginPath(); ctx.arc(sx+13.5*m, wy-1*m, 1.5*m, 0, Math.PI*2); ctx.fill();
    }
  }

  // Head — offset by vo for tall/short
  var hy=sy+vo-4*m; // head base y shifted up with body
  ctx.fillStyle = headColor || bodyColor;
  ctx.fillRect(sx+5*m, hy+1.5*m-headBob, 6*m, 5*m);
  // Jaw shadow — broad body only
  if(!isNarrow){
    ctx.fillStyle = headDark;
    ctx.fillRect(sx+5*m, hy+5.5*m-headBob, 6*m, 1*m);
  }

  // Hair and face — depends on facing direction
  if (facing === 'back') {
    // Back of head — hair covers everything, no eyes visible
    ctx.fillStyle = hairColor;
    if (hairStyle === 'short') {
      ctx.fillRect(sx+4.5*m, hy+0.5*m-headBob, 7*m, 5*m);
      ctx.fillStyle = hairDark;
      ctx.fillRect(sx+4.5*m, hy+0.5*m-headBob, 7*m, 1*m);
      // Nape of neck visible below hair
      ctx.fillStyle = headColor || bodyColor;
      ctx.fillRect(sx+6*m, hy+5*m-headBob, 4*m, 1.5*m);
    } else if (hairStyle === 'long') {
      ctx.fillRect(sx+4*m, hy+0.5*m-headBob, 8*m, 5.5*m);
      ctx.fillRect(sx+4*m, hy+3*m-headBob, 2*m, 6*m);
      ctx.fillRect(sx+10*m, hy+3*m-headBob, 2*m, 6*m);
      // Hair cascades down the back
      ctx.fillRect(sx+5*m, hy+5*m-headBob, 6*m, 4*m);
      ctx.fillStyle = hairDark;
      ctx.fillRect(sx+4*m, hy+0.5*m-headBob, 8*m, 1*m);
      ctx.fillRect(sx+5.5*m, hy+6*m-headBob, 5*m, 1*m);
    } else if (hairStyle === 'spiky') {
      ctx.fillRect(sx+4.5*m, hy+0.5*m-headBob, 7*m, 5*m);
      ctx.beginPath();
      ctx.moveTo(sx+5*m, hy+1*m-headBob); ctx.lineTo(sx+4*m, hy-1.5*m-headBob); ctx.lineTo(sx+6.5*m, hy+0.5*m-headBob);
      ctx.moveTo(sx+7*m, hy+0.5*m-headBob); ctx.lineTo(sx+7.5*m, hy-2*m-headBob); ctx.lineTo(sx+9*m, hy+0.5*m-headBob);
      ctx.moveTo(sx+9.5*m, hy+1*m-headBob); ctx.lineTo(sx+11.5*m, hy-1*m-headBob); ctx.lineTo(sx+11*m, hy+1*m-headBob);
      ctx.fill();
      ctx.fillStyle = headColor || bodyColor;
      ctx.fillRect(sx+6*m, hy+5*m-headBob, 4*m, 1.5*m);
    } else if (hairStyle === 'bald') {
      // Back of bald head — just skin with slight shading
      ctx.fillStyle = headDark;
      ctx.fillRect(sx+5.5*m, hy+2*m-headBob, 5*m, 3*m);
      ctx.fillStyle = headColor || bodyColor;
      ctx.fillRect(sx+6*m, hy+5*m-headBob, 4*m, 1.5*m);
    } else if (hairStyle === 'ponytail') {
      ctx.fillRect(sx+4.5*m, hy+0.5*m-headBob, 7*m, 5*m);
      // Ponytail hangs down the back center
      ctx.fillRect(sx+6.5*m, hy+4*m-headBob, 3*m, 2*m);
      ctx.fillRect(sx+7*m, hy+5.5*m-headBob, 2*m, 4*m);
      ctx.fillStyle = hairDark;
      ctx.fillRect(sx+4.5*m, hy+0.5*m-headBob, 7*m, 1*m);
      ctx.fillRect(sx+7.2*m, hy+7*m-headBob, 1.6*m, 2.5*m);
    } else if (hairStyle === 'mohawk') {
      // Back of head with mohawk strip
      ctx.fillStyle = headDark;
      ctx.fillRect(sx+5*m, hy+1*m-headBob, 6*m, 5*m);
      ctx.fillStyle = hairColor;
      ctx.fillRect(sx+6.5*m, hy-1*m-headBob, 3*m, 7*m);
      ctx.fillStyle = hairDark;
      ctx.fillRect(sx+7*m, hy-1.5*m-headBob, 2*m, 1.5*m);
    } else {
      // Fallback
      ctx.fillRect(sx+4.5*m, hy+0.5*m-headBob, 7*m, 5*m);
    }
  } else {
    // Front-facing — original hair and eyes
    ctx.fillStyle = hairColor;
    if (hairStyle === 'short') {
      ctx.fillRect(sx+4.5*m, hy+0.5*m-headBob, 7*m, 2.5*m);
      ctx.fillStyle = hairDark;
      ctx.fillRect(sx+4.5*m, hy+0.5*m-headBob, 7*m, 1*m);
    } else if (hairStyle === 'long') {
      ctx.fillRect(sx+4*m, hy+0.5*m-headBob, 8*m, 2.5*m);
      ctx.fillRect(sx+4*m, hy+3*m-headBob, 2*m, 5*m);
      ctx.fillRect(sx+10*m, hy+3*m-headBob, 2*m, 5*m);
      ctx.fillStyle = hairDark;
      ctx.fillRect(sx+4*m, hy+0.5*m-headBob, 8*m, 1*m);
    } else if (hairStyle === 'spiky') {
      ctx.fillRect(sx+4.5*m, hy+1*m-headBob, 7*m, 2*m);
      ctx.beginPath();
      ctx.moveTo(sx+5*m, hy+1*m-headBob); ctx.lineTo(sx+4*m, hy-1.5*m-headBob); ctx.lineTo(sx+6.5*m, hy+0.5*m-headBob);
      ctx.moveTo(sx+7*m, hy+0.5*m-headBob); ctx.lineTo(sx+7.5*m, hy-2*m-headBob); ctx.lineTo(sx+9*m, hy+0.5*m-headBob);
      ctx.moveTo(sx+9.5*m, hy+1*m-headBob); ctx.lineTo(sx+11.5*m, hy-1*m-headBob); ctx.lineTo(sx+11*m, hy+1*m-headBob);
      ctx.fill();
    } else if (hairStyle === 'bald') {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(sx+6*m, hy+1.5*m-headBob, 3*m, 1.5*m);
    } else if (hairStyle === 'ponytail') {
      ctx.fillRect(sx+4.5*m, hy+0.5*m-headBob, 7*m, 2.5*m);
      ctx.fillRect(sx+9*m, hy+2*m-headBob, 2*m, 2*m);
      ctx.fillRect(sx+10*m, hy+3.5*m-headBob, 2*m, 4*m);
      ctx.fillStyle = hairDark;
      ctx.fillRect(sx+10.5*m, hy+5*m-headBob, 1.5*m, 3*m);
    } else if (hairStyle === 'mohawk') {
      ctx.fillRect(sx+6.5*m, hy-1*m-headBob, 3*m, 3.5*m);
      ctx.fillStyle = hairDark;
      ctx.fillRect(sx+7*m, hy-1.5*m-headBob, 2*m, 1.5*m);
    }

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx+6*m, hy+3.5*m-headBob, 2*m, 1.5*m);
    ctx.fillRect(sx+9*m, hy+3.5*m-headBob, 2*m, 1.5*m);
    ctx.fillStyle = eyeColor || '#222222';
    ctx.fillRect(sx+6.5*m, hy+3.8*m-headBob, 1.2*m, 1.2*m);
    ctx.fillRect(sx+9.5*m, hy+3.8*m-headBob, 1.2*m, 1.2*m);
  }
}

// Draw creature with walk cycle
function drawCreaturePixel(ctx, sx, sy, ts, color, archetype, walkPhase) {
  var m = ts / 16;
  var walking = walkPhase > 0;
  var cycle = walking ? Math.sin(walkPhase * Math.PI * 6) : 0;
  var bob = walking ? Math.abs(Math.sin(walkPhase * Math.PI * 6)) * m * 0.5 : 0;
  var dark = shadeHex(color, -50);
  var light = shadeHex(color, 50);

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(sx+8*m, sy+15*m, 5*m, 1.2*m, 0, 0, Math.PI*2); ctx.fill();

  if (archetype === 'swarm') {
    var wingFlap = Math.sin((walkPhase||0.5)*Math.PI*10) * 2 * m;
    ctx.fillStyle = dark;
    ctx.fillRect(sx+6*m, sy+7*m-bob, 4*m, 4*m);
    ctx.fillStyle = color;
    ctx.fillRect(sx+6.5*m, sy+6.5*m-bob, 3*m, 3.5*m);
    // Wings
    ctx.fillStyle = light;
    ctx.fillRect(sx+2*m, sy+(5+wingFlap)*m-bob, 4*m, 2*m);
    ctx.fillRect(sx+10*m, sy+(5-wingFlap)*m-bob, 4*m, 2*m);
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(sx+7*m, sy+7.5*m-bob, 1*m, 1*m);
    ctx.fillRect(sx+9*m, sy+7.5*m-bob, 1*m, 1*m);
  } else if (archetype === 'shambler') {
    var legSwing = cycle * 1.2 * m;
    // Thin bony legs
    ctx.fillStyle = dark;
    ctx.fillRect(sx+5*m, sy+12*m+legSwing, 2*m, 3.5*m);
    ctx.fillRect(sx+9*m, sy+12*m-legSwing, 2*m, 3.5*m);
    // Narrow torso — ribcage
    ctx.fillStyle = color;
    ctx.fillRect(sx+5*m, sy+5*m-bob, 6*m, 7*m);
    // Spine line
    ctx.fillStyle = dark;
    ctx.fillRect(sx+7.5*m, sy+5*m-bob, 1*m, 7*m);
    // Individual ribs (thin horizontal bars)
    ctx.fillStyle = light;
    ctx.fillRect(sx+5*m, sy+6*m-bob, 6*m, 0.7*m);
    ctx.fillRect(sx+5.5*m, sy+7.5*m-bob, 5*m, 0.7*m);
    ctx.fillRect(sx+6*m, sy+9*m-bob, 4*m, 0.7*m);
    // Thin arms hanging
    ctx.fillStyle = color;
    ctx.fillRect(sx+3*m, sy+5.5*m-bob, 2*m, 1.5*m);
    ctx.fillRect(sx+3*m, sy+7*m-bob, 1.5*m, 4*m);
    ctx.fillRect(sx+11*m, sy+5.5*m-bob, 2*m, 1.5*m);
    ctx.fillRect(sx+12*m, sy+7*m-bob, 1.5*m, 4*m);
    // Skull — round with hollow eyes
    ctx.fillStyle = light;
    ctx.fillRect(sx+5*m, sy+1.5*m-bob, 6*m, 4*m);
    ctx.fillStyle = color;
    ctx.fillRect(sx+5.5*m, sy+2*m-bob, 5*m, 3*m);
    // Eye sockets (dark holes)
    ctx.fillStyle = '#111';
    ctx.fillRect(sx+6*m, sy+2.5*m-bob, 1.5*m, 1.5*m);
    ctx.fillRect(sx+9*m, sy+2.5*m-bob, 1.5*m, 1.5*m);
    // Red glow in eyes
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(sx+6.3*m, sy+3*m-bob, 0.8*m, 0.8*m);
    ctx.fillRect(sx+9.3*m, sy+3*m-bob, 0.8*m, 0.8*m);
    // Jaw line
    ctx.fillStyle = light;
    ctx.fillRect(sx+6*m, sy+4.5*m-bob, 4*m, 1*m);
  } else if (archetype === 'stalker') {
    // Spider/crawler — 4 legs each side, low body, multiple eyes
    var legSwing = cycle * 2 * m;
    // Legs — 4 pairs, alternating swing
    ctx.fillStyle = dark;
    ctx.fillRect(sx+1*m, sy+10*m+legSwing, 1.5*m, 4*m);
    ctx.fillRect(sx+4*m, sy+10*m-legSwing, 1.5*m, 4*m);
    ctx.fillRect(sx+10*m, sy+10*m+legSwing, 1.5*m, 4*m);
    ctx.fillRect(sx+13*m, sy+10*m-legSwing, 1.5*m, 4*m);
    // Leg joints (angular)
    ctx.fillRect(sx+0*m, sy+9*m+legSwing, 2*m, 1.5*m);
    ctx.fillRect(sx+5*m, sy+9*m-legSwing, 2*m, 1.5*m);
    ctx.fillRect(sx+9*m, sy+9*m+legSwing, 2*m, 1.5*m);
    ctx.fillRect(sx+14*m, sy+9*m-legSwing, 2*m, 1.5*m);
    // Body — low oval
    ctx.fillStyle = color;
    ctx.fillRect(sx+3*m, sy+6*m-bob, 10*m, 5*m);
    ctx.fillStyle = dark;
    ctx.fillRect(sx+4*m, sy+9*m-bob, 8*m, 2*m); // abdomen stripe
    // Head — front
    ctx.fillStyle = light;
    ctx.fillRect(sx+5*m, sy+4*m-bob, 6*m, 3*m);
    // Multiple eyes (4 glowing dots)
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(sx+6*m, sy+4.5*m-bob, 1*m, 1*m);
    ctx.fillRect(sx+8*m, sy+4.5*m-bob, 1*m, 1*m);
    ctx.fillRect(sx+9.5*m, sy+5*m-bob, 0.8*m, 0.8*m);
    ctx.fillRect(sx+5*m, sy+5*m-bob, 0.8*m, 0.8*m);
    // Fangs
    ctx.fillStyle = '#eeeecc';
    ctx.fillRect(sx+6.5*m, sy+7*m-bob, 0.8*m, 1.5*m);
    ctx.fillRect(sx+8.5*m, sy+7*m-bob, 0.8*m, 1.5*m);
  } else if (archetype === 'brute') {
    // Demon/golem — massive, horned, menacing
    var legSwing = cycle * 1 * m;
    ctx.fillStyle = dark;
    ctx.fillRect(sx+2*m, sy+12*m+legSwing, 5*m, 3.5*m);
    ctx.fillRect(sx+9*m, sy+12*m-legSwing, 5*m, 3.5*m);
    // Massive body
    ctx.fillStyle = color;
    ctx.fillRect(sx+1*m, sy+3*m-bob, 14*m, 9*m);
    // Chest scar/marking
    ctx.fillStyle = shadeHex(color, -30);
    ctx.fillRect(sx+5*m, sy+5*m-bob, 1*m, 5*m);
    ctx.fillRect(sx+3*m, sy+7*m-bob, 5*m, 1*m);
    // Head
    ctx.fillStyle = light;
    ctx.fillRect(sx+4*m, sy+1*m-bob, 8*m, 3*m);
    // Horns — curved upward
    ctx.fillStyle = '#443322';
    ctx.fillRect(sx+3*m, sy-2*m-bob, 2*m, 3.5*m);
    ctx.fillRect(sx+2*m, sy-2.5*m-bob, 2*m, 1.5*m);
    ctx.fillRect(sx+11*m, sy-2*m-bob, 2*m, 3.5*m);
    ctx.fillRect(sx+12*m, sy-2.5*m-bob, 2*m, 1.5*m);
    // Glowing eyes
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(sx+5*m, sy+2*m-bob, 2*m, 1.5*m);
    ctx.fillRect(sx+9*m, sy+2*m-bob, 2*m, 1.5*m);
    // Clawed hands
    ctx.fillStyle = dark;
    ctx.fillRect(sx+0*m, sy+5*m-bob, 2*m, 3*m);
    ctx.fillRect(sx+14*m, sy+5*m-bob, 2*m, 3*m);
    ctx.fillStyle = '#443322';
    ctx.fillRect(sx+(-1)*m, sy+7*m-bob, 1*m, 2*m);
    ctx.fillRect(sx+0*m, sy+7.5*m-bob, 1*m, 2*m);
    ctx.fillRect(sx+15*m, sy+7*m-bob, 1*m, 2*m);
    ctx.fillRect(sx+16*m, sy+7.5*m-bob, 1*m, 2*m);
  } else if (archetype === 'dragon') {
    // Dragon — serpentine body, wings, fiery maw
    var legSwing = cycle * 1.5 * m;
    var wingFlap = Math.sin((walkPhase||0.3)*Math.PI*4) * 2 * m;
    // Tail — curves behind
    ctx.fillStyle = dark;
    ctx.fillRect(sx+0*m, sy+8*m-bob, 3*m, 2*m);
    ctx.fillRect(sx+(-1)*m, sy+7*m-bob, 2*m, 2*m);
    // Hind legs
    ctx.fillStyle = dark;
    ctx.fillRect(sx+3*m, sy+12*m+legSwing, 3*m, 3.5*m);
    ctx.fillRect(sx+9*m, sy+12*m-legSwing, 3*m, 3.5*m);
    // Claws
    ctx.fillStyle = '#332211';
    ctx.fillRect(sx+3*m, sy+15*m+legSwing, 1*m, 1*m);
    ctx.fillRect(sx+5*m, sy+15*m+legSwing, 1*m, 1*m);
    ctx.fillRect(sx+9*m, sy+15*m-legSwing, 1*m, 1*m);
    ctx.fillRect(sx+11*m, sy+15*m-legSwing, 1*m, 1*m);
    // Body — long, muscular
    ctx.fillStyle = color;
    ctx.fillRect(sx+2*m, sy+5*m-bob, 12*m, 8*m);
    // Belly — lighter
    ctx.fillStyle = shadeHex(color, 30);
    ctx.fillRect(sx+4*m, sy+10*m-bob, 8*m, 3*m);
    // Scales texture
    ctx.fillStyle = shadeHex(color, -20);
    ctx.fillRect(sx+3*m, sy+6*m-bob, 2*m, 1*m);
    ctx.fillRect(sx+6*m, sy+5.5*m-bob, 2*m, 1*m);
    ctx.fillRect(sx+10*m, sy+6*m-bob, 2*m, 1*m);
    ctx.fillRect(sx+4*m, sy+8*m-bob, 2*m, 1*m);
    ctx.fillRect(sx+8*m, sy+7.5*m-bob, 2*m, 1*m);
    // Wings
    ctx.fillStyle = shadeHex(color, -15);
    ctx.fillRect(sx+1*m, sy+(2+wingFlap)*m-bob, 4*m, 4*m);
    ctx.fillRect(sx+(-1)*m, sy+(1+wingFlap)*m-bob, 3*m, 3*m);
    ctx.fillRect(sx+11*m, sy+(2-wingFlap)*m-bob, 4*m, 4*m);
    ctx.fillRect(sx+15*m, sy+(1-wingFlap)*m-bob, 3*m, 3*m);
    // Wing membrane
    ctx.fillStyle = shadeHex(color, 15);
    ctx.globalAlpha = 0.5;
    ctx.fillRect(sx+0*m, sy+(2+wingFlap)*m-bob, 3*m, 3*m);
    ctx.fillRect(sx+13*m, sy+(2-wingFlap)*m-bob, 3*m, 3*m);
    ctx.globalAlpha = 1;
    // Neck
    ctx.fillStyle = color;
    ctx.fillRect(sx+11*m, sy+2*m-bob, 3*m, 5*m);
    // Head — angular, predatory
    ctx.fillStyle = light;
    ctx.fillRect(sx+12*m, sy+0*m-bob, 4*m, 3*m);
    ctx.fillStyle = color;
    ctx.fillRect(sx+13*m, sy+(-1)*m-bob, 3*m, 2*m); // snout ridge
    // Horns
    ctx.fillStyle = '#332211';
    ctx.fillRect(sx+12*m, sy+(-2)*m-bob, 1.5*m, 2.5*m);
    ctx.fillRect(sx+15*m, sy+(-1.5)*m-bob, 1.5*m, 2*m);
    // Eyes — fierce
    ctx.fillStyle = '#ff4400';
    ctx.fillRect(sx+14*m, sy+0.5*m-bob, 1.5*m, 1*m);
    // Fire breath glow
    var fireAlpha = 0.3 + Math.sin((walkPhase||0)*Math.PI*8) * 0.2;
    ctx.fillStyle = 'rgba(255,100,0,' + fireAlpha.toFixed(2) + ')';
    ctx.fillRect(sx+15*m, sy+2*m-bob, 2*m, 1.5*m);
    // Spinal ridge
    ctx.fillStyle = shadeHex(color, -40);
    ctx.fillRect(sx+5*m, sy+4*m-bob, 1.5*m, 1.5*m);
    ctx.fillRect(sx+7.5*m, sy+3.5*m-bob, 1.5*m, 1.5*m);
    ctx.fillRect(sx+10*m, sy+3*m-bob, 1.5*m, 1.5*m);
  } else {
    // caster or default: robed humanoid
    var armSwing = cycle * 1 * m;
    ctx.fillStyle = dark;
    ctx.fillRect(sx+5*m, sy+12*m, 2*m, 2.5*m);
    ctx.fillRect(sx+9*m, sy+12*m, 2*m, 2.5*m);
    ctx.fillStyle = color;
    ctx.fillRect(sx+4*m, sy+5*m-bob, 8*m, 7*m); // robe
    ctx.fillStyle = light;
    ctx.fillRect(sx+5*m, sy+2*m-bob, 6*m, 4*m); // head
    ctx.fillStyle = '#ff66ff';
    ctx.fillRect(sx+6*m, sy+3.5*m-bob, 1.5*m, 1.5*m);
    ctx.fillRect(sx+9*m, sy+3.5*m-bob, 1.5*m, 1.5*m);
    // Staff
    ctx.fillStyle = '#aa8844';
    ctx.fillRect(sx+13*m, sy+2*m-bob+armSwing, 1.5*m, 10*m);
    ctx.fillStyle = '#aa44ff';
    ctx.fillRect(sx+12.5*m, sy+1*m-bob+armSwing, 2.5*m, 2.5*m);
  }
}

Game.prototype.drawEntities=function(ctx){
  var ts=CONFIG.TILE;
  var bobTime = this.animTimer;

  // Enemies
  for(var i=0;i<this.enemies.length;i++){
    var e=this.enemies[i];if(!e.alive||!this.isVisible(e.x,e.y))continue;
    var sx=e.x*ts,sy=e.y*ts;
    // Enemies walk continuously when within detection range
    var eDist = Math.abs(e.x-this.player.x)+Math.abs(e.y-this.player.y);
    var eWalk = eDist <= this.player.visionRadius + 2 ? (bobTime * 0.8 + i * 0.3) % 1 : 0;
    if(e.hitFlash>0) ctx.globalAlpha=0.4+Math.sin(e.hitFlash*30)*0.6;

    drawCreaturePixel(ctx, sx, sy, ts, e.color, e.archetype, eWalk);

    ctx.globalAlpha=1;

    if(e.isBoss){
      ctx.strokeStyle='#ff2222';ctx.lineWidth=2;ctx.strokeRect(sx,sy,ts,ts);
      ctx.strokeRect(sx-1,sy-1,ts+2,ts+2);
      this.pipeline.addLight(sx+ts/2,sy+ts/2,{color:'#ff2200',radius:ts*3,intensity:0.4,flicker:0.1});
    }
    if(e.hp<e.maxHp){var barW=ts-4,hpR=e.hp/e.maxHp;ctx.fillStyle='#222';ctx.fillRect(sx+2,sy-5,barW,4);ctx.fillStyle=hpR>0.5?'#44ff44':hpR>0.25?'#ffcc00':'#ff4444';ctx.fillRect(sx+2,sy-5,barW*hpR,4);}
    var statusY=sy-10;ctx.font=Math.max(8,Math.round(ts*0.22))+'px monospace';ctx.textAlign='center';
    if(e.frozen>0){ctx.fillStyle='#66ccff';ctx.fillText('ICE',sx+ts/2,statusY);statusY-=10;}
    if(e.burning>0){ctx.fillStyle='#ff6622';ctx.fillText('FIRE',sx+ts/2,statusY);statusY-=10;}
    if(e.poisoned>0){ctx.fillStyle='#44ff44';ctx.fillText('PSN',sx+ts/2,statusY);statusY-=10;}
    if(e.telegraphing){ctx.fillStyle='#ff4444';ctx.font='bold '+Math.max(10,Math.round(ts*0.3))+'px monospace';ctx.fillText('!!',sx+ts/2,statusY);}
  }

  // Player character with customization
  var psx=this.player.x*ts,psy=this.player.y*ts;
  var pWalk = this.player.walkTimer > 0 ? (bobTime * 1.2) % 1 : 0;
  if(this.player.hitFlash>0) ctx.globalAlpha=0.4+Math.sin(this.player.hitFlash*30)*0.6;
  var wpnColor=null;
  if(this.player.weapon && this.player.weapon.color) wpnColor=this.player.weapon.color;
  else if(this.player.weaponType==='sword') wpnColor='#aaccff';
  else if(this.player.weaponType==='wand') wpnColor='#6688ff';
  else if(this.player.weaponType==='staff') wpnColor='#44ff88';
  var bodyCol=this.player.bodyColor||'#2266cc';
  if(this.player.armor) bodyCol=this.player.armor.color;
  // Rotate character when in water — check tile directly (overworld AND dungeon)
  var isSwim = false;
  var swimTile = null;
  if (this.player.mode === 'overworld' && typeof Overworld !== 'undefined') {
    swimTile = Overworld.getTile(Math.round(this.player.x), Math.round(this.player.y));
    isSwim = (swimTile.type === T.WATER || swimTile.type === T.SHALLOWS || swimTile.type === 162 || swimTile.type === 160 || swimTile.type === 161 || swimTile.type === 163);
  } else if (this.player.mode === 'dungeon' && this.dungeon) {
    var dpx = Math.round(this.player.x), dpy = Math.round(this.player.y);
    if (dpx >= 0 && dpx < CONFIG.MAP_W && dpy >= 0 && dpy < CONFIG.MAP_H) {
      var dungTile = this.dungeon.map[dpy][dpx];
      if (dungTile === T.WATER || dungTile === T.ICE) {
        swimTile = { type: dungTile };
        isSwim = (dungTile === T.WATER); // wade in water, not ice
      }
    }
  }
  var isDeepSwim = false; // dungeon water is always shallow (wading)
  if (this.player.mode === 'overworld') isDeepSwim = isSwim && swimTile && swimTile.type === T.WATER;
  var isShallowSwim = isSwim && !isDeepSwim;
  var _swimDrawn = false;
  if (isDeepSwim) {
    ctx.save();
    var ld = this.player.lastDir;
    ctx.beginPath();
    if (ld.x === 0) {
      // Up/down: clip at 80% so head at bottom is visible
      ctx.rect(psx - ts, psy - ts, ts * 3, ts * 1.8);
    } else {
      // Left/right: clip at 50% — bottom half submerged
      ctx.rect(psx - ts, psy - ts, ts * 3, ts * 1.5);
    }
    ctx.clip();
    if (ld.x === 0) {
      // Up/down: top-down bird's eye swimming sprite
      // Up = head at top of tile, feet at bottom
      // Down = head at bottom, feet at top
      // Clip shows upper portion, so body is always visible
      var m = ts / 16;
      var headUp = ld.y < 0;
      var kick = Math.sin(bobTime * Math.PI * 6) * 1.5 * m;
      var stroke = Math.sin(bobTime * Math.PI * 4) * 2 * m;
      var cx = psx + 8 * m; // center x

      // Draw order: feet(far) → legs → torso → arms → head(near)
      // "Near" end is always at top of tile (visible above water)

      if (headUp) {
        // Swimming UP: head at top, feet at bottom (feet get clipped)
        // Feet
        ctx.fillStyle = this.player.skinColor || '#ffcc88';
        ctx.fillRect(cx - 3 * m, psy + 13 * m + kick, 1.5 * m, 1 * m);
        ctx.fillRect(cx + 1.5 * m, psy + 13 * m - kick, 1.5 * m, 1 * m);
        // Legs
        ctx.fillStyle = shadeHex(bodyCol, -20);
        ctx.fillRect(cx - 3 * m, psy + 10 * m + kick, 2 * m, 3 * m);
        ctx.fillRect(cx + 1 * m, psy + 10 * m - kick, 2 * m, 3 * m);
        // Torso
        ctx.fillStyle = bodyCol;
        ctx.fillRect(cx - 3.5 * m, psy + 4 * m, 7 * m, 6 * m);
        // Arms
        ctx.fillStyle = this.player.skinColor || '#ffcc88';
        ctx.fillRect(cx - 7 * m + stroke, psy + 5 * m, 3 * m, 1.5 * m);
        ctx.fillRect(cx + 4 * m - stroke, psy + 5 * m, 3 * m, 1.5 * m);
        // Head — back of head (swimming away), hairstyle from above
        _drawTopDownHair(ctx, cx, psy + 2.5 * m, m, this.player.hairStyle, this.player.hairColor, this.player.skinColor);
      } else {
        // Swimming DOWN: head at bottom, feet at top (feet visible, head clipped)
        // Feet
        ctx.fillStyle = this.player.skinColor || '#ffcc88';
        ctx.fillRect(cx - 3 * m, psy + 1 * m + kick, 1.5 * m, 1 * m);
        ctx.fillRect(cx + 1.5 * m, psy + 1 * m - kick, 1.5 * m, 1 * m);
        // Legs
        ctx.fillStyle = shadeHex(bodyCol, -20);
        ctx.fillRect(cx - 3 * m, psy + 2 * m + kick, 2 * m, 3 * m);
        ctx.fillRect(cx + 1 * m, psy + 2 * m - kick, 2 * m, 3 * m);
        // Torso
        ctx.fillStyle = bodyCol;
        ctx.fillRect(cx - 3.5 * m, psy + 5 * m, 7 * m, 6 * m);
        // Arms
        ctx.fillStyle = this.player.skinColor || '#ffcc88';
        ctx.fillRect(cx - 7 * m + stroke, psy + 7 * m, 3 * m, 1.5 * m);
        ctx.fillRect(cx + 4 * m - stroke, psy + 7 * m, 3 * m, 1.5 * m);
        // Head — back of head (swimming away downward), hairstyle from above
        _drawTopDownHair(ctx, cx, psy + 11.5 * m, m, this.player.hairStyle, this.player.hairColor, this.player.skinColor);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      _swimDrawn = true;
    } else {
      // Left/right: rotate 90 degrees
      var scx = psx + ts / 2, scy = psy + ts / 2;
      ctx.translate(scx, scy);
      ctx.rotate(ld.x > 0 ? Math.PI / 2 : -Math.PI / 2);
      ctx.translate(-scx, -scy);
    }
  } else if (isShallowSwim) {
    ctx.save();
    // Clip bottom 40% — character wades with legs hidden
    ctx.beginPath();
    ctx.rect(psx - ts, psy - ts, ts * 3, ts * 1.6);
    ctx.clip();
  }
  if (!_swimDrawn) {
    var drawWalk = isSwim ? (bobTime * 0.8) % 1 : pWalk;
    // Direction-aware character drawing
    var ld = this.player.lastDir || {x:0,y:1};
    var facingLeft = !isSwim && ld.x < 0;
    var facingBack = !isSwim && ld.y < 0 && ld.x === 0;
    var charOpts = {hairStyle:this.player.hairStyle||'short', hairColor:this.player.hairColor||'#443322',
       weaponType:isSwim ? 'fist' : this.player.weaponType, body:this.player.body, height:this.player.height, frame:this.player.frame,
       facing: facingBack ? 'back' : 'front'};
    if (facingLeft) {
      ctx.save();
      ctx.translate(psx + ts, 0);
      ctx.scale(-1, 1);
      drawCharPixel(ctx, 0, psy, ts,
        bodyCol, this.player.eyeColor||'#443322',
        this.player.skinColor||'#ffcc88', isSwim ? null : wpnColor, drawWalk, charOpts);
      ctx.restore();
    } else {
      drawCharPixel(ctx, psx, psy, ts,
        bodyCol, this.player.eyeColor||'#443322',
        this.player.skinColor||'#ffcc88', isSwim ? null : wpnColor, drawWalk, charOpts);
    }
    if (isDeepSwim || isShallowSwim) ctx.restore();
  }
  ctx.globalAlpha=1;

  // Gear glow — scales with weapon/armor power
  var _glowPower = 0;
  if (this.player.weapon && this.player.weapon.atk) _glowPower += this.player.weapon.atk;
  if (this.player.armor && this.player.armor.defense) _glowPower += this.player.armor.defense;
  if (_glowPower >= 3) {
    var _gcx = psx + ts / 2, _gcy = psy + ts / 2;
    var _gIntensity = Math.min(0.5, _glowPower * 0.03);
    var _gRadius = ts * (0.8 + _glowPower * 0.1);
    var _gPulse = 0.7 + Math.sin(bobTime * 3) * 0.3;
    // Glow colour blends weapon and armor
    var _gColor = (this.player.weapon && this.player.weapon.color) ? this.player.weapon.color : '#ffcc44';
    if (this.player.armor && this.player.armor.color && _glowPower >= 8) {
      // High power: use armor colour for outer glow
      this.pipeline.addLight(_gcx, _gcy, { color: this.player.armor.color, radius: _gRadius * 0.6, intensity: _gIntensity * 0.4 * _gPulse, flicker: 0 });
    }
    this.pipeline.addLight(_gcx, _gcy, { color: _gColor, radius: _gRadius * _gPulse, intensity: _gIntensity * _gPulse, flicker: 0.02 });
  }

  if(this.player.shieldTurns>0){ctx.strokeStyle='rgba(100,200,255,0.7)';ctx.lineWidth=2;ctx.strokeRect(psx-1,psy-1,ts+2,ts+2);}

  // Ability targeting overlay — works in both dungeon and overworld
  if(this.abilityTargetMode&&this.selectedAbility>=0){
    var ab=this.player.abilities[this.selectedAbility];
    ctx.globalAlpha=0.3+Math.sin(this.animTimer*5)*0.15;ctx.fillStyle=ab.color;
    var dirs=[{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
    for(var di=0;di<dirs.length;di++){var dir=dirs[di];var targets=getAbilityTargets(ab,this.player.x,this.player.y,dir.x,dir.y);
      for(var ti=0;ti<targets.length;ti++){var t=targets[ti];
        if(this.dungeon){if(t.x<0||t.x>=CONFIG.MAP_W||t.y<0||t.y>=CONFIG.MAP_H)continue;if(ab.shape==='line'&&this.dungeon.map[t.y][t.x]===T.WALL)break;if(this.dungeon.map[t.y][t.x]!==T.WALL)ctx.fillRect(t.x*ts,t.y*ts,ts,ts);}
        else{ctx.fillRect(t.x*ts,t.y*ts,ts,ts);}}}
    ctx.globalAlpha=1;
  }
};

