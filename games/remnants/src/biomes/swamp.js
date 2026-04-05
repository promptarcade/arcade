
// ============================================================
// BIOME: Swamp — murky water, gnarled trees, rotting logs
// Tile IDs: 150-159
// ============================================================

// ------------------------------------------------------------
// TILE 150: Swamp Ground — dark mud with water puddles, algae
// ------------------------------------------------------------
var T_SWAMP_GROUND = TileRegistry.add({
  id: 150,
  name: 'swamp_ground',
  solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h1 = ((wx * 374761393 + wy * 668265263) >>> 0);
    var h2 = (((h1 >> 13) ^ h1) * 1274126177) >>> 0;

    // Base mud colour — sine noise to avoid diagonal hash banding
    var muddNoise = Math.sin(wx * 0.37 + wy * 0.53) * 0.5 + Math.sin(wx * 0.71 - wy * 0.29) * 0.5;
    var tint = Math.round(muddNoise * 8);
    ctx.fillStyle = shadeHex('#2e3018', tint);
    ctx.fillRect(sx, sy, ts, ts);

    // Darker mud patches
    var patchN = Math.sin(wx * 0.61 + wy * 0.83) * 0.5 + Math.sin(wx * 1.1 - wy * 0.47) * 0.5;
    if (patchN > 0.2) {
      ctx.fillStyle = shadeHex('#1e2010', tint - 4);
      ctx.fillRect(sx + 1*m, sy + 2*m, 6*m, 5*m);
    }

    // Moss / algae streaks — green-brown
    var mossN = Math.sin(wx * 0.44 - wy * 0.67) * 0.5 + Math.sin(wx * 0.9 + wy * 1.1) * 0.5;
    if (mossN > 0.3) {
      ctx.fillStyle = 'rgba(48,68,20,0.55)';
      ctx.fillRect(sx + ((h2 % 7) + 1)*m, sy + ((h2 >> 4) % 5 + 4)*m, (3 + (h2 >> 8) % 4)*m, m);
    }
    if (mossN > 0.5) {
      ctx.fillStyle = 'rgba(38,58,14,0.45)';
      ctx.fillRect(sx + ((h2 >> 3) % 8 + 2)*m, sy + ((h2 >> 7) % 6 + 7)*m, (2 + (h2 >> 11) % 3)*m, m * 0.8);
    }

    // Standing water puddle — animated bubble
    var waterN = Math.sin(wx * 0.29 + wy * 0.41) * 0.5 + Math.sin(wx * 0.73 + wy * 0.61) * 0.5;
    if (waterN > 0.35) {
      // Puddle body
      ctx.fillStyle = '#1a2518';
      ctx.beginPath();
      ctx.ellipse(sx + 10*m, sy + 11*m, 4*m, 2.5*m, 0, 0, Math.PI * 2);
      ctx.fill();
      // Murky tint
      ctx.fillStyle = 'rgba(30,50,25,0.4)';
      ctx.beginPath();
      ctx.ellipse(sx + 10*m, sy + 11*m, 4*m, 2.5*m, 0, 0, Math.PI * 2);
      ctx.fill();
      // Reflection shimmer
      ctx.fillStyle = 'rgba(60,80,50,0.3)';
      ctx.fillRect(sx + 8*m, sy + 10*m, 2*m, m * 0.6);

      // Animated bubble — rises on animTimer cycle
      var bubblePhase = (animTimer * 0.0008 + wx * 0.37 + wy * 0.53) % 1;
      var bubbleY = sy + 12.5*m - bubblePhase * 2.5*m;
      var bubbleAlpha = bubblePhase < 0.7 ? 0.7 : (1 - bubblePhase) / 0.3 * 0.7;
      ctx.strokeStyle = 'rgba(80,120,70,' + bubbleAlpha + ')';
      ctx.lineWidth = Math.max(0.5, m * 0.4);
      ctx.beginPath();
      ctx.arc(sx + 10.5*m, bubbleY, m * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      // Second bubble — offset phase
      var b2Phase = (animTimer * 0.0006 + wx * 0.61 + wy * 0.29 + 0.5) % 1;
      var b2Y = sy + 12.5*m - b2Phase * 2.5*m;
      var b2Alpha = b2Phase < 0.7 ? 0.5 : (1 - b2Phase) / 0.3 * 0.5;
      ctx.strokeStyle = 'rgba(80,120,70,' + b2Alpha + ')';
      ctx.beginPath();
      ctx.arc(sx + 8.5*m, b2Y, m * 0.4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Pebbles / mud clods
    if ((h2 % 13) === 0) {
      ctx.fillStyle = '#1a2010';
      ctx.beginPath();
      ctx.ellipse(sx + ((h2 >> 5) % 10 + 3)*m, sy + ((h2 >> 9) % 8 + 4)*m, m * 1.1, m * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle tile border
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(sx + 0.5, sy + 0.5, ts - 1, ts - 1);
  },
});

// ------------------------------------------------------------
// TILE 151: Swamp Tree — gnarled dead trunk, hanging moss
// ------------------------------------------------------------
var T_SWAMP_TREE = TileRegistry.add({
  id: 151,
  name: 'swamp_tree',
  solid: true,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;

    // Draw swamp ground beneath
    var groundDraw = TileRegistry.getDrawer(T_SWAMP_GROUND);
    if (groundDraw) groundDraw(ctx, sx, sy, ts, visible, animTimer, wx, wy);

    var h = ((wx * 4517 + wy * 7321) >>> 0);
    var lean = (h % 3) - 1; // -1, 0, 1 lean direction

    // Root spread — surface roots radiating from base
    ctx.fillStyle = '#2a1e10';
    // Left root
    ctx.beginPath();
    ctx.moveTo(sx + 7*m, sy + 14*m);
    ctx.quadraticCurveTo(sx + 3*m, sy + 14.5*m, sx + 1*m, sy + 15.5*m);
    ctx.lineWidth = Math.max(1, m * 1.2);
    ctx.strokeStyle = '#2a1e10';
    ctx.stroke();
    // Right root
    ctx.beginPath();
    ctx.moveTo(sx + 9*m, sy + 14*m);
    ctx.quadraticCurveTo(sx + 13*m, sy + 14.5*m, sx + 15*m, sy + 15.5*m);
    ctx.stroke();
    // Front root
    ctx.beginPath();
    ctx.moveTo(sx + 8*m, sy + 14.5*m);
    ctx.lineTo(sx + 8*m, sy + 16*m);
    ctx.lineWidth = Math.max(1, m * 1.5);
    ctx.stroke();

    // Trunk — gnarled, slightly crooked
    var trunkX = sx + 6*m + lean * m;
    ctx.fillStyle = '#2a1e10';
    // Lower trunk (wider)
    ctx.fillRect(trunkX, sy + 7*m, 4*m, 7*m);
    // Dark side shading
    ctx.fillStyle = '#1a1208';
    ctx.fillRect(trunkX, sy + 7*m, 1.5*m, 7*m);
    // Light edge
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(trunkX + 2.5*m, sy + 7*m, 1*m, 7*m);
    // Bark texture — horizontal fissures
    ctx.fillStyle = 'rgba(15,10,5,0.5)';
    ctx.fillRect(trunkX + 0.5*m, sy + 8.5*m, 3*m, m * 0.4);
    ctx.fillRect(trunkX + 0.5*m, sy + 10.5*m, 2.5*m, m * 0.4);
    ctx.fillRect(trunkX + 1*m, sy + 12.5*m, 2*m, m * 0.4);

    // Upper trunk — thinner, angled
    var upX = trunkX + lean * 0.5*m;
    ctx.fillStyle = '#2a1e10';
    ctx.fillRect(upX + 0.5*m, sy + 2*m, 3*m, 5*m);
    ctx.fillStyle = '#1a1208';
    ctx.fillRect(upX + 0.5*m, sy + 2*m, 1*m, 5*m);

    // Dead branch left
    ctx.strokeStyle = '#241a0e';
    ctx.lineWidth = Math.max(1, m * 1.0);
    ctx.beginPath();
    ctx.moveTo(sx + 7*m + lean*m, sy + 5*m);
    ctx.quadraticCurveTo(sx + 2*m, sy + 3*m, sx + 0.5*m, sy + 1*m);
    ctx.stroke();
    // Dead branch right
    ctx.lineWidth = Math.max(0.8, m * 0.8);
    ctx.beginPath();
    ctx.moveTo(sx + 8.5*m + lean*m, sy + 4*m);
    ctx.quadraticCurveTo(sx + 13*m, sy + 2*m, sx + 15*m, sy + 0.5*m);
    ctx.stroke();
    // Small twig off left branch
    ctx.lineWidth = Math.max(0.5, m * 0.5);
    ctx.beginPath();
    ctx.moveTo(sx + 3*m, sy + 2.5*m);
    ctx.lineTo(sx + 1*m, sy + 0*m);
    ctx.stroke();

    // Hanging moss strands
    var mossSwing = Math.sin(animTimer * 0.0005 + wx * 0.8) * m * 0.4;
    ctx.strokeStyle = 'rgba(44,72,24,0.75)';
    ctx.lineWidth = Math.max(0.5, m * 0.4);
    // Strand 1 — from left branch
    ctx.beginPath();
    ctx.moveTo(sx + 1.5*m, sy + 1.5*m);
    ctx.quadraticCurveTo(sx + 1*m + mossSwing, sy + 4*m, sx + 1.5*m + mossSwing, sy + 6*m);
    ctx.stroke();
    // Strand 2
    ctx.beginPath();
    ctx.moveTo(sx + 3*m, sy + 1*m);
    ctx.quadraticCurveTo(sx + 2.5*m + mossSwing, sy + 3.5*m, sx + 3*m + mossSwing, sy + 5.5*m);
    ctx.stroke();
    // Strand 3 — from right branch
    ctx.strokeStyle = 'rgba(44,72,24,0.65)';
    ctx.beginPath();
    ctx.moveTo(sx + 13*m, sy + 1*m);
    ctx.quadraticCurveTo(sx + 13.5*m - mossSwing * 0.6, sy + 3.5*m, sx + 13*m - mossSwing * 0.6, sy + 5.5*m);
    ctx.stroke();
    // Strand 4
    ctx.beginPath();
    ctx.moveTo(sx + 14.5*m, sy + 1.5*m);
    ctx.quadraticCurveTo(sx + 15*m - mossSwing * 0.6, sy + 4*m, sx + 14.5*m - mossSwing * 0.6, sy + 6.5*m);
    ctx.stroke();

    // Moss clumps at strand tips
    ctx.fillStyle = 'rgba(38,64,18,0.7)';
    ctx.fillRect(sx + 1*m + mossSwing, sy + 5.5*m, 1.5*m, m * 0.8);
    ctx.fillRect(sx + 2.5*m + mossSwing, sy + 5*m, 1.2*m, m * 0.8);
    ctx.fillRect(sx + 12.5*m - mossSwing * 0.6, sy + 5*m, 1.2*m, m * 0.8);

    // Knot / hollow in trunk
    ctx.fillStyle = '#111008';
    ctx.beginPath();
    ctx.ellipse(sx + 8.5*m + lean*m, sy + 9*m, m * 0.8, m * 1.0, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0a06';
    ctx.beginPath();
    ctx.ellipse(sx + 8.5*m + lean*m, sy + 9*m, m * 0.4, m * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  },
});

// ------------------------------------------------------------
// TILE 152: Lily Pad — shallow water with floating lily pads
// ------------------------------------------------------------
var T_LILY_PAD = TileRegistry.add({
  id: 152,
  name: 'lily_pad',
  solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h1 = ((wx * 374761393 + wy * 668265263) >>> 0);
    var h2 = (((h1 >> 13) ^ h1) * 1274126177) >>> 0;

    // Water base — dark murky green-blue
    var waterN = Math.sin(wx * 0.41 + wy * 0.57) * 0.5 + Math.sin(wx * 0.83 - wy * 0.31) * 0.5;
    var wTint = Math.round(waterN * 6);
    ctx.fillStyle = shadeHex('#1a2e28', wTint);
    ctx.fillRect(sx, sy, ts, ts);

    // Water surface ripples — animated
    var ripplePhase = animTimer * 0.0004 + wx * 0.3 + wy * 0.5;
    ctx.strokeStyle = 'rgba(50,90,75,0.35)';
    ctx.lineWidth = Math.max(0.5, m * 0.4);
    var r1y = sy + 5*m + Math.sin(ripplePhase) * m * 0.4;
    ctx.beginPath();
    ctx.ellipse(sx + 5*m, r1y, 3.5*m, m * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    var r2y = sy + 12*m + Math.sin(ripplePhase + 1.2) * m * 0.3;
    ctx.beginPath();
    ctx.ellipse(sx + 11*m, r2y, 2.5*m, m * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Dark algae wisps below surface
    var algaeN = Math.sin(wx * 0.53 + wy * 0.77) * 0.5 + Math.sin(wx * 1.2 - wy * 0.41) * 0.5;
    if (algaeN > 0.1) {
      ctx.fillStyle = 'rgba(25,45,20,0.45)';
      ctx.fillRect(sx + 3*m, sy + 8*m, 4*m, m * 0.7);
      ctx.fillRect(sx + 9*m, sy + 4*m, 3*m, m * 0.6);
    }

    // Lily pad 1 — main large pad, gentle bob
    var bob1 = Math.sin(animTimer * 0.0007 + wx * 0.6 + wy * 0.4) * m * 0.3;
    ctx.fillStyle = '#2a5c1e';
    ctx.beginPath();
    ctx.arc(sx + 6*m, sy + 6*m + bob1, 4*m, 0, Math.PI * 2);
    ctx.fill();
    // Notch in pad (lily pad V-cut)
    ctx.fillStyle = shadeHex('#1a2e28', wTint);
    ctx.beginPath();
    ctx.moveTo(sx + 6*m, sy + 6*m + bob1);
    ctx.lineTo(sx + 6*m - m*0.5, sy + 2.2*m + bob1);
    ctx.lineTo(sx + 6*m + m*0.5, sy + 2.2*m + bob1);
    ctx.closePath();
    ctx.fill();
    // Pad vein lines
    ctx.strokeStyle = 'rgba(20,48,12,0.6)';
    ctx.lineWidth = Math.max(0.5, m * 0.35);
    ctx.beginPath();
    ctx.moveTo(sx + 6*m, sy + 6*m + bob1);
    ctx.lineTo(sx + 6*m, sy + 2.5*m + bob1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + 6*m, sy + 6*m + bob1);
    ctx.lineTo(sx + 2.5*m, sy + 7*m + bob1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + 6*m, sy + 6*m + bob1);
    ctx.lineTo(sx + 9.5*m, sy + 7*m + bob1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + 6*m, sy + 6*m + bob1);
    ctx.lineTo(sx + 3.5*m, sy + 9*m + bob1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + 6*m, sy + 6*m + bob1);
    ctx.lineTo(sx + 8.5*m, sy + 9*m + bob1);
    ctx.stroke();
    // Lighter green highlight on pad
    ctx.fillStyle = '#3a7028';
    ctx.beginPath();
    ctx.arc(sx + 5.2*m, sy + 5.2*m + bob1, 1.5*m, 0, Math.PI * 2);
    ctx.fill();

    // Lily pad 2 — smaller, offset
    var bob2 = Math.sin(animTimer * 0.0005 + wx * 0.4 + wy * 0.7 + 1.5) * m * 0.25;
    if ((h2 % 3) !== 0) {
      ctx.fillStyle = '#245018';
      ctx.beginPath();
      ctx.arc(sx + 12*m, sy + 12*m + bob2, 2.5*m, 0, Math.PI * 2);
      ctx.fill();
      // Small notch
      ctx.fillStyle = shadeHex('#1a2e28', wTint);
      ctx.beginPath();
      ctx.moveTo(sx + 12*m, sy + 12*m + bob2);
      ctx.lineTo(sx + 11.7*m, sy + 9.6*m + bob2);
      ctx.lineTo(sx + 12.3*m, sy + 9.6*m + bob2);
      ctx.closePath();
      ctx.fill();
    }

    // Lily flower — small pink/white, only on some tiles
    var flowerN = Math.sin(wx * 1.9 + wy * 2.3) * 0.5 + Math.sin(wx * 3.1 - wy * 1.7) * 0.5;
    if (flowerN > 0.5) {
      // Petals
      ctx.fillStyle = '#e8aabb';
      ctx.beginPath(); ctx.ellipse(sx + 6*m, sy + 4.8*m + bob1, m * 0.9, m * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + 6*m, sy + 5.8*m + bob1, m * 0.9, m * 0.5, Math.PI, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + 5*m, sy + 5.3*m + bob1, m * 0.5, m * 0.9, Math.PI * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + 7*m, sy + 5.3*m + bob1, m * 0.5, m * 0.9, Math.PI * 0.5, 0, Math.PI * 2); ctx.fill();
      // Centre
      ctx.fillStyle = '#ffee88';
      ctx.beginPath(); ctx.arc(sx + 6*m, sy + 5.3*m + bob1, m * 0.6, 0, Math.PI * 2); ctx.fill();
    }

    // Animated bubble in water
    var bubPhase = (animTimer * 0.0007 + wx * 0.51 + wy * 0.43) % 1;
    var bubAlpha = bubPhase < 0.75 ? 0.5 : (1 - bubPhase) / 0.25 * 0.5;
    var bubY = sy + 14*m - bubPhase * 3*m;
    ctx.strokeStyle = 'rgba(60,110,80,' + bubAlpha + ')';
    ctx.lineWidth = Math.max(0.5, m * 0.4);
    ctx.beginPath();
    ctx.arc(sx + 13*m, bubY, m * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  },
});

// ------------------------------------------------------------
// TILE 153: Mushroom Log — rotting fallen log with mushrooms
// ------------------------------------------------------------
var T_MUSHROOM_LOG = TileRegistry.add({
  id: 153,
  name: 'mushroom_log',
  solid: false,
  draw: function(ctx, sx, sy, ts, visible, animTimer, wx, wy) {
    var m = ts / 16;
    var h1 = ((wx * 374761393 + wy * 668265263) >>> 0);
    var h2 = (((h1 >> 13) ^ h1) * 1274126177) >>> 0;

    // Draw swamp ground beneath
    var groundDraw = TileRegistry.getDrawer(T_SWAMP_GROUND);
    if (groundDraw) groundDraw(ctx, sx, sy, ts, visible, animTimer, wx, wy);

    // Log orientation — vary by hash
    var horizontal = (h2 % 2) === 0;

    if (horizontal) {
      // Horizontal log
      // Log shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(sx + 1*m, sy + 10*m, 14*m, 5*m);

      // Log body
      ctx.fillStyle = '#3a2a14';
      ctx.fillRect(sx + 0.5*m, sy + 7.5*m, 15*m, 5*m);

      // Bark top — lighter stripe
      ctx.fillStyle = '#4a3820';
      ctx.fillRect(sx + 0.5*m, sy + 7.5*m, 15*m, 1.5*m);

      // Bark fissures
      ctx.fillStyle = '#2a1c0c';
      ctx.fillRect(sx + 3*m, sy + 9*m, 0.6*m, 3*m);
      ctx.fillRect(sx + 7*m, sy + 8.5*m, 0.6*m, 3.5*m);
      ctx.fillRect(sx + 11*m, sy + 9*m, 0.6*m, 3*m);

      // Cross-section end caps
      ctx.fillStyle = '#2a1e10';
      ctx.beginPath(); ctx.ellipse(sx + 0.5*m, sy + 10*m, m * 0.5, 2.5*m, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + 15.5*m, sy + 10*m, m * 0.5, 2.5*m, 0, 0, Math.PI * 2); ctx.fill();
      // End ring
      ctx.strokeStyle = '#3a2a14';
      ctx.lineWidth = Math.max(0.5, m * 0.4);
      ctx.beginPath(); ctx.ellipse(sx + 15.5*m, sy + 10*m, m * 0.3, 1.8*m, 0, 0, Math.PI * 2); ctx.stroke();

      // Rot / moss patches along top
      ctx.fillStyle = 'rgba(35,55,18,0.55)';
      ctx.fillRect(sx + 2*m, sy + 7.5*m, 4*m, 1*m);
      ctx.fillRect(sx + 9*m, sy + 7.5*m, 3*m, 1*m);

      // Mushrooms growing on top — 3 clusters
      // Cluster 1 — near left
      var mColor1 = ['#c83030', '#bb4422', '#aa2244'][(h2 >> 2) % 3];
      // Stem
      ctx.fillStyle = '#ddd0aa';
      ctx.fillRect(sx + 2.5*m, sy + 5.5*m, m, 2*m);
      // Cap
      ctx.fillStyle = mColor1;
      ctx.beginPath(); ctx.ellipse(sx + 3*m, sy + 5.5*m, 2*m, 1.2*m, 0, 0, Math.PI, Math.PI * 2); ctx.fill();
      // Spots
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(sx + 2.5*m, sy + 5*m, m * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + 3.8*m, sy + 5.2*m, m * 0.2, 0, Math.PI * 2); ctx.fill();

      // Cluster 2 — taller middle
      var mColor2 = ['#884488', '#5a3488', '#446688'][(h2 >> 5) % 3];
      ctx.fillStyle = '#ccc8a0';
      ctx.fillRect(sx + 7*m, sy + 4*m, m * 0.8, 3.5*m);
      ctx.fillRect(sx + 8.5*m, sy + 5*m, m * 0.8, 2.5*m);
      ctx.fillStyle = mColor2;
      ctx.beginPath(); ctx.ellipse(sx + 7.4*m, sy + 4*m, 1.8*m, 1.1*m, 0, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + 8.9*m, sy + 5*m, 1.5*m, 0.9*m, 0, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath(); ctx.arc(sx + 7*m, sy + 3.5*m, m * 0.3, 0, Math.PI * 2); ctx.fill();

      // Cluster 3 — small near right
      var mColor3 = ['#cc7700', '#aa5500', '#cc4400'][(h2 >> 8) % 3];
      ctx.fillStyle = '#ccbb99';
      ctx.fillRect(sx + 12*m, sy + 5.5*m, m * 0.7, 2*m);
      ctx.fillStyle = mColor3;
      ctx.beginPath(); ctx.ellipse(sx + 12.35*m, sy + 5.5*m, 1.5*m, 1*m, 0, 0, Math.PI, Math.PI * 2); ctx.fill();

    } else {
      // Vertical log
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(sx + 5*m, sy + 1*m, 6*m, 15*m);

      // Log body
      ctx.fillStyle = '#3a2a14';
      ctx.fillRect(sx + 4*m, sy + 0.5*m, 6*m, 15*m);

      // Bark highlight
      ctx.fillStyle = '#4a3820';
      ctx.fillRect(sx + 4*m, sy + 0.5*m, 1.5*m, 15*m);

      // Fissures
      ctx.fillStyle = '#2a1c0c';
      ctx.fillRect(sx + 5.5*m, sy + 3*m, 3*m, 0.6*m);
      ctx.fillRect(sx + 5*m, sy + 7*m, 4*m, 0.6*m);
      ctx.fillRect(sx + 5.5*m, sy + 11*m, 3*m, 0.6*m);

      // End caps
      ctx.fillStyle = '#2a1e10';
      ctx.beginPath(); ctx.ellipse(sx + 7*m, sy + 0.5*m, 3*m, m * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + 7*m, sy + 15.5*m, 3*m, m * 0.5, 0, 0, Math.PI * 2); ctx.fill();

      // Moss
      ctx.fillStyle = 'rgba(35,55,18,0.5)';
      ctx.fillRect(sx + 4*m, sy + 4*m, 1*m, 4*m);
      ctx.fillRect(sx + 4*m, sy + 10*m, 1*m, 3*m);

      // Mushrooms — growing on side
      var mc1 = ['#c83030', '#aa2244', '#bb3322'][(h2 >> 3) % 3];
      ctx.fillStyle = '#d8c899';
      ctx.fillRect(sx + 2*m, sy + 5*m, 2*m, m * 0.7);
      ctx.fillStyle = mc1;
      ctx.beginPath(); ctx.ellipse(sx + 2.5*m, sy + 5*m, m, 1.8*m, Math.PI * 0.5, 0, Math.PI, true); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(sx + 2*m, sy + 4.2*m, m * 0.28, 0, Math.PI * 2); ctx.fill();

      var mc2 = ['#884488', '#446688', '#336644'][(h2 >> 6) % 3];
      ctx.fillStyle = '#ccbb99';
      ctx.fillRect(sx + 2*m, sy + 9*m, 2*m, m * 0.7);
      ctx.fillStyle = mc2;
      ctx.beginPath(); ctx.ellipse(sx + 2.5*m, sy + 9*m, m * 0.8, 1.5*m, Math.PI * 0.5, 0, Math.PI, true); ctx.fill();

      // Lichen dots
      ctx.fillStyle = 'rgba(60,90,35,0.6)';
      ctx.beginPath(); ctx.arc(sx + 7.5*m, sy + 8*m, m * 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + 6*m, sy + 12*m, m * 0.6, 0, Math.PI * 2); ctx.fill();
    }
  },
});

// ------------------------------------------------------------
// BIOME REGISTRATION
// ------------------------------------------------------------
BiomeRegistry.add({
  id: 'swamp',
  name: 'Swamp',
  groundTile: T_SWAMP_GROUND,
  heightRange: [0.3, 0.45],
  moistureRange: [0.6, 1.0],
  palette: { base: '#2e3018', dark: '#1c1f0e', light: '#3e4228', detail: '#272a14' },
  wallColor: '#2a3414',
  ambientColor: '#030501',
  ambientIntensity: 0.07,
  lightColor: '#88bb66',
  enemies: ['swamp_slug', 'bog_witch'],
  density: { trees: 0.06, herbs: 0.06 },
});
