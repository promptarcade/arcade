// Phase 6B.3: Lantern — SILHOUETTE ONLY
// Metal frame + glass body + handle loop on top + flame visible inside
// Compound: frame holds glass, handle arches over, flame is interior detail

module.exports = {
  width: 64,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { fill: '#444444' },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },
  drawPost(pc, pal) {
    const fg = pal.groups.fill;
    const FLAT = fg.startIdx + Math.round((fg.toneCount - 1) * 0.5);
    pc.pixels[0] = 0;
    const cx = 32;

    // Lantern proportions:
    // Handle: arch at top, ~20% of height
    // Cap: flat metal disc on top of glass
    // Glass body: hexagonal or cylindrical, ~50% of height, widest part
    // Base: metal platform, slightly wider than glass

    const handleTopY = 4, capY = 22, glassTopY = 26, glassBotY = 68, baseY = 72, baseBotY = 78;

    // HANDLE — arch loop on top
    for (let t = 0; t <= 1; t += 0.01) {
      const angle = Math.PI * t; // 0 to PI (semicircle)
      const hx = Math.round(cx + Math.cos(angle) * 12);
      const hy = Math.round(capY - 4 - Math.sin(angle) * 16);
      for (let w = -2; w <= 2; w++) {
        if (hx + w >= 0 && hx + w < 64 && hy >= 0 && hy < 96) {
          pc.setPixel(hx + w, hy, FLAT);
        }
      }
    }

    // CAP — flat disc on top of glass
    for (let y = capY - 3; y <= capY; y++) {
      const halfW = 16;
      for (let x = cx - halfW; x <= cx + halfW; x++) {
        if (x >= 0 && x < 64 && y >= 0 && y < 96) pc.setPixel(x, y, FLAT);
      }
    }

    // GLASS BODY — slightly tapered cylinder (wider in middle)
    for (let y = glassTopY; y <= glassBotY; y++) {
      const t = (y - glassTopY) / (glassBotY - glassTopY);
      // Slight belly
      const halfW = Math.round(14 + Math.sin(t * Math.PI) * 2);
      for (let x = cx - halfW; x <= cx + halfW; x++) {
        if (x >= 0 && x < 64 && y >= 0 && y < 96) pc.setPixel(x, y, FLAT);
      }
    }

    // Metal frame ribs — vertical bars on glass (4 of them)
    for (let y = glassTopY; y <= glassBotY; y++) {
      const t = (y - glassTopY) / (glassBotY - glassTopY);
      const halfW = Math.round(14 + Math.sin(t * Math.PI) * 2);
      // 4 ribs evenly spaced
      for (let rib = 0; rib < 4; rib++) {
        const ribX = cx + Math.round((rib / 3 - 0.5) * halfW * 1.6);
        if (ribX >= 0 && ribX < 64 && y >= 0 && y < 96) {
          pc.setPixel(ribX, y, FLAT);
          if (ribX + 1 < 64) pc.setPixel(ribX + 1, y, FLAT);
        }
      }
    }

    // BASE — wider platform
    for (let y = baseY; y <= baseBotY; y++) {
      const t = (y - baseY) / (baseBotY - baseY);
      const halfW = Math.round(16 + (1 - t) * 2);
      for (let x = cx - halfW; x <= cx + halfW; x++) {
        if (x >= 0 && x < 64 && y >= 0 && y < 96) pc.setPixel(x, y, FLAT);
      }
    }

    // Small feet at corners of base
    for (const side of [-1, 1]) {
      const footX = cx + side * 14;
      for (let dy = 0; dy < 4; dy++) {
        if (footX >= 0 && footX < 64 && baseBotY + dy < 96) {
          pc.setPixel(footX, baseBotY + dy, FLAT);
          pc.setPixel(footX + side, baseBotY + dy, FLAT);
        }
      }
    }
  },
};
