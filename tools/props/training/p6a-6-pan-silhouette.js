// Phase 6A.6: Frying Pan — SILHOUETTE ONLY
// Very wide flat disc + short angled sides + long handle extending right.
// Viewed from slightly above — see the interior. Handle is the key proportion.

module.exports = {
  width: 128,
  height: 64,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { fill: '#444444' },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },

  drawPost(pc, pal) {
    const fg = pal.groups.fill;
    const FLAT = fg.startIdx + Math.round((fg.toneCount - 1) * 0.5);
    pc.pixels[0] = 0;

    const cx = 44, cy = 32; // offset left to make room for handle

    // Pan body — wide ellipse (viewed from above at an angle)
    const panRX = 34, panRY = 20;
    // Rim ellipse
    for (let y = cy - panRY; y <= cy + panRY; y++) {
      for (let x = cx - panRX; x <= cx + panRX; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 64) continue;
        const dx = (x - cx) / panRX, dy = (y - cy) / panRY;
        if (dx * dx + dy * dy <= 1) pc.setPixel(x, y, FLAT);
      }
    }

    // Short sides visible below the rim (front-facing edge of pan depth)
    const panDepth = 6;
    for (let y = cy; y <= cy + panRY + panDepth; y++) {
      const t = Math.max(0, (y - cy) / panRY);
      if (t > 1) {
        // Below rim — the visible short side
        const sideT = (y - cy - panRY) / panDepth;
        const halfW = Math.round(panRX * Math.sqrt(Math.max(0, 1 - 0.1 * sideT)));
        for (let x = cx - halfW; x <= cx + halfW; x++) {
          if (x >= 0 && x < 128 && y >= 0 && y < 64) pc.setPixel(x, y, FLAT);
        }
      }
    }

    // HANDLE — long, extending to the right
    // Attaches at the right edge of the pan, extends ~40px
    const handleAttachX = cx + panRX - 2;
    const handleLen = 42;
    const handleW = 5;
    const handleY = cy; // handle at center height

    for (let along = 0; along < handleLen; along++) {
      const t = along / handleLen;
      // Handle tapers slightly toward the end and has a rounded grip
      let w;
      if (t < 0.1) w = handleW + 2; // wide where it attaches
      else if (t < 0.85) w = handleW;
      else w = handleW + Math.round((t - 0.85) / 0.15 * 2); // slight bulge at grip end

      for (let dy = -w; dy <= w; dy++) {
        const x = handleAttachX + along;
        const y = handleY + dy;
        if (x >= 0 && x < 128 && y >= 0 && y < 64) {
          pc.setPixel(x, y, FLAT);
        }
      }
    }

    // Handle rivet — small circle where handle meets pan
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (dx * dx + dy * dy <= 4) {
          const x = handleAttachX + 4 + dx, y = handleY + dy;
          if (x >= 0 && x < 128 && y >= 0 && y < 64) pc.setPixel(x, y, FLAT);
        }
      }
    }
  },
};
