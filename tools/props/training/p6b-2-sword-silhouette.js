// Phase 6B.2: Sword — SILHOUETTE ONLY
// Blade (long tapered) + guard (cross-piece) + grip (narrow) + pommel (round end)
// Vertical orientation. Length proportions are the challenge.

module.exports = {
  width: 48,
  height: 128,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { fill: '#444444' },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },
  drawPost(pc, pal) {
    const fg = pal.groups.fill;
    const FLAT = fg.startIdx + Math.round((fg.toneCount - 1) * 0.5);
    pc.pixels[0] = 0;
    const cx = 24;

    // Sword proportions: blade = 60% of length, guard = 3%, grip = 25%, pommel = 5%
    // Blade: widest near guard, tapers to point at top
    // Guard: wider than blade, short horizontal cross-piece
    // Grip: narrower than blade, wrapped texture
    // Pommel: round end cap

    const tipY = 6, guardY = 80, gripBotY = 112, pommelBotY = 122;

    // BLADE — tapered from guard to point
    for (let y = tipY; y <= guardY; y++) {
      const t = (y - tipY) / (guardY - tipY); // 0=tip, 1=guard
      // Blade widens linearly from tip to guard, with slight leaf shape
      const halfW = Math.round(1 + t * 7 + Math.sin(t * Math.PI) * 1.5);
      for (let x = cx - halfW; x <= cx + halfW; x++) {
        if (x >= 0 && x < 48 && y >= 0 && y < 128) pc.setPixel(x, y, FLAT);
      }
    }

    // Fuller (blood groove) — thin line down the centre of blade
    // (visible in silhouette as a slight indent — skip for flat fill)

    // GUARD — horizontal cross-piece
    const guardHalfW = 18;
    for (let y = guardY; y <= guardY + 4; y++) {
      for (let x = cx - guardHalfW; x <= cx + guardHalfW; x++) {
        if (x >= 0 && x < 48 && y >= 0 && y < 128) pc.setPixel(x, y, FLAT);
      }
    }
    // Guard ends curve down slightly
    for (let dy = 0; dy < 3; dy++) {
      pc.setPixel(cx - guardHalfW + dy, guardY + 4 + dy, FLAT);
      pc.setPixel(cx + guardHalfW - dy, guardY + 4 + dy, FLAT);
    }

    // GRIP — narrow cylinder below guard
    const gripHalfW = 4;
    for (let y = guardY + 4; y <= gripBotY; y++) {
      for (let x = cx - gripHalfW; x <= cx + gripHalfW; x++) {
        if (x >= 0 && x < 48 && y >= 0 && y < 128) pc.setPixel(x, y, FLAT);
      }
    }

    // POMMEL — round end cap
    const pommelCY = gripBotY + 5;
    const pommelR = 6;
    for (let dy = -pommelR; dy <= pommelR; dy++) {
      for (let dx = -pommelR; dx <= pommelR; dx++) {
        if (dx * dx + dy * dy <= pommelR * pommelR) {
          const px = cx + dx, py = pommelCY + dy;
          if (px >= 0 && px < 48 && py >= 0 && py < 128) pc.setPixel(px, py, FLAT);
        }
      }
    }
  },
};
