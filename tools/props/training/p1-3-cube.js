// Phase 1, Exercise 1.3: Greyscale cube, upper-left light
// Training target: hard plane edges, each face a distinct flat value, consistent shadow direction

module.exports = {
  width: 128,
  height: 128,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { grey: '#888888' },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.grey.startIdx); },

  drawPost(pc, pal) {
    const g = pal.groups.grey;
    function tone(frac) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1,
        Math.round(frac * (g.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const lx = -0.55, ly = -0.65, lz = 0.52;

    // 3/4 view cube — show top face, front face, right face
    // Vertices in screen space (simple oblique projection)
    const cx = 60, cy = 60;
    const size = 44;
    // Front face corners
    const fl = cx - size / 2, fr = cx + size / 2;
    const ft = cy - size / 2 + 8, fb = cy + size / 2 + 8;
    // Top face offset (pseudo-isometric)
    const topOX = -14, topOY = -22;
    // Right face offset
    const rightOX = 14, rightOY = -10;

    // Ground
    const groundY = fb + 8;
    for (let y = groundY; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const d = (y - groundY) / (128 - groundY);
        pc.setPixel(x, y, tone(Math.max(0.05, 0.26 - d * 0.08)));
      }
    }

    // Cast shadow
    const shCX = cx + 24, shCY = groundY + 2;
    for (let y = shCY - 6; y <= shCY + 6; y++) {
      for (let x = shCX - 30; x <= shCX + 30; x++) {
        if (x < 0 || x >= 128 || y < groundY || y >= 128) continue;
        const dx = (x - shCX) / 30, dy = (y - shCY) / 6;
        const d = dx * dx + dy * dy;
        if (d > 1) continue;
        pc.setPixel(x, y, tone(Math.max(0.03, 0.2 * (1 - (1 - d) * 0.5))));
      }
    }

    // FRONT FACE — normal: (0, 0, 1) facing viewer
    const frontDot = lz; // just the z component
    const frontValue = 0.04 + Math.max(0, frontDot) * 0.55;
    for (let y = Math.round(ft); y <= Math.round(fb); y++) {
      for (let x = Math.round(fl); x <= Math.round(fr); x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 128) continue;
        // Slight gradient for subtle depth — darker at bottom
        const yFrac = (y - ft) / (fb - ft);
        pc.setPixel(x, y, tone(Math.max(0.03, frontValue - yFrac * 0.04)));
      }
    }

    // TOP FACE — normal: (0, -1, 0) facing up
    // Rendered as a parallelogram above the front face
    const topDot = -ly;
    const topValue = 0.04 + Math.max(0, topDot) * 0.6;
    for (let row = 0; row < Math.abs(topOY); row++) {
      const t = row / Math.abs(topOY);
      const rowY = Math.round(ft + topOY + row);
      const rowLeft = Math.round(fl + topOX * (1 - t));
      const rowRight = Math.round(fr + topOX * (1 - t));
      for (let x = rowLeft; x <= rowRight; x++) {
        if (x < 0 || x >= 128 || rowY < 0 || rowY >= 128) continue;
        pc.setPixel(x, rowY, tone(Math.max(0.03, topValue - t * 0.03)));
      }
    }

    // RIGHT FACE — normal: (1, 0, 0) facing right
    const rightDot = lx; // negative = facing away from light
    const rightValue = 0.04 + Math.max(0, rightDot) * 0.5; // will be dark since lx is negative
    // Actually the right face faces AWAY from upper-left light, so it's in shadow
    const rightShadowValue = 0.08;
    for (let row = 0; row < Math.round(fb - ft); row++) {
      const rowY = Math.round(ft + row);
      const shear = Math.round(rightOX * (1 - row / (fb - ft)));
      for (let col = 0; col < Math.abs(rightOX); col++) {
        const t = col / Math.abs(rightOX);
        const x = Math.round(fr + col);
        const y = Math.round(rowY + rightOY * t);
        if (x < 0 || x >= 128 || y < 0 || y >= 128) continue;
        // Right face is in shadow — dark, with slight gradient
        pc.setPixel(x, y, tone(Math.max(0.03, rightShadowValue + t * 0.02)));
      }
    }

    // Top-right edge of right face (connects to top face)
    for (let col = 0; col < Math.abs(rightOX); col++) {
      const t = col / Math.abs(rightOX);
      const x = Math.round(fr + col);
      const y = Math.round(ft + rightOY * t);
      if (x < 0 || x >= 128 || y < 0 || y >= 128) continue;
      pc.setPixel(x, y, tone(0.06));
    }

    // Edge highlights — bright lines where lit faces meet
    // Top-front edge (brightest — two lit faces meet)
    for (let x = Math.round(fl + topOX); x <= Math.round(fr); x++) {
      if (x >= 0 && x < 128 && Math.round(ft) >= 0 && Math.round(ft) < 128) {
        pc.setPixel(x, Math.round(ft), tone(Math.min(0.95, topValue + 0.15)));
      }
    }

    // Left edge of front face — subtle highlight (catches rim light)
    for (let y = Math.round(ft); y <= Math.round(fb); y++) {
      if (Math.round(fl) >= 0 && Math.round(fl) < 128 && y >= 0 && y < 128) {
        pc.setPixel(Math.round(fl), y, tone(Math.min(0.75, frontValue + 0.05)));
      }
    }

    // Front-right edge — dark crease where lit face meets shadow face
    for (let y = Math.round(ft); y <= Math.round(fb); y++) {
      if (Math.round(fr) >= 0 && Math.round(fr) < 128 && y >= 0 && y < 128) {
        pc.setPixel(Math.round(fr), y, tone(0.05));
      }
    }

    // Contact shadow line
    for (let x = Math.round(fl); x <= Math.round(fr) + 4; x++) {
      if (x >= 0 && x < 128 && groundY >= 0 && groundY < 128) {
        pc.setPixel(x, groundY, tone(0.03));
      }
    }
  },
};
