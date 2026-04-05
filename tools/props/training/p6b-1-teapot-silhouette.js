// Phase 6B.1: Teapot — SILHOUETTE ONLY
// Compound object: body (round) + spout (tapered tube, left) + handle (D-curve, right) + lid (dome on top)
// The challenge: four parts in correct spatial relationship, all connected.

module.exports = {
  width: 128,
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

    // Teapot proportions:
    // Body: round/squat, wider than tall. Centre of composition.
    // Spout: extends left and upward from mid-body. Tapers to narrow tip.
    // Handle: D-curve on right, attaches upper and lower body.
    // Lid: small dome sitting on top of body, with a knob.

    const bodyCX = 62, bodyCY = 52;
    const bodyRX = 30, bodyRY = 24;

    // BODY — squat rounded form
    for (let y = bodyCY - bodyRY; y <= bodyCY + bodyRY; y++) {
      for (let x = bodyCX - bodyRX; x <= bodyCX + bodyRX; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 96) continue;
        const dx = (x - bodyCX) / bodyRX, dy = (y - bodyCY) / bodyRY;
        // Slightly flattened at bottom (sits on surface)
        let rMod = 1;
        if (dy > 0.6) rMod += (dy - 0.6) * 0.15;
        if (dx * dx + dy * dy <= rMod * rMod) pc.setPixel(x, y, FLAT);
      }
    }

    // LID — small dome on top of body
    const lidCX = bodyCX, lidCY = bodyCY - bodyRY + 2;
    const lidRX = 18, lidRY = 6;
    for (let y = lidCY - lidRY; y <= lidCY + lidRY; y++) {
      for (let x = lidCX - lidRX; x <= lidCX + lidRX; x++) {
        if (x < 0 || x >= 128 || y < 0 || y >= 96) continue;
        const dx = (x - lidCX) / lidRX, dy = (y - lidCY) / lidRY;
        if (dx * dx + dy * dy <= 1 && dy <= 0.3) pc.setPixel(x, y, FLAT);
      }
    }

    // Lid knob — tiny sphere on top of lid
    const knobCX = lidCX, knobCY = lidCY - lidRY + 1;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (dx * dx + dy * dy <= 9) {
          const px = knobCX + dx, py = knobCY + dy;
          if (px >= 0 && px < 128 && py >= 0 && py < 96) pc.setPixel(px, py, FLAT);
        }
      }
    }

    // SPOUT — curved tube extending left and upward
    // Starts at left side of body at mid-height, curves upward to a narrow tip
    const spoutStartX = bodyCX - bodyRX + 5;
    const spoutStartY = bodyCY - 5;
    const spoutTipX = bodyCX - bodyRX - 22;
    const spoutTipY = bodyCY - bodyRY + 2;

    for (let t = 0; t <= 1; t += 0.005) {
      // Bezier-like curve from start to tip
      const midX = spoutStartX - 18;
      const midY = spoutStartY - 15;
      const px = (1-t)*(1-t)*spoutStartX + 2*(1-t)*t*midX + t*t*spoutTipX;
      const py = (1-t)*(1-t)*spoutStartY + 2*(1-t)*t*midY + t*t*spoutTipY;

      // Width tapers from body-width to narrow tip
      const w = Math.round(6 * (1 - t * 0.6));
      for (let dy = -w; dy <= w; dy++) {
        const ix = Math.round(px), iy = Math.round(py + dy);
        if (ix >= 0 && ix < 128 && iy >= 0 && iy < 96) pc.setPixel(ix, iy, FLAT);
      }
    }

    // Spout opening — small ellipse at tip
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const px = Math.round(spoutTipX) + dx, py = Math.round(spoutTipY) + dy;
        if (px >= 0 && px < 128 && py >= 0 && py < 96) pc.setPixel(px, py, FLAT);
      }
    }

    // HANDLE — D-curve on right side
    const handleTopY = bodyCY - bodyRY + 8;
    const handleBotY = bodyCY + bodyRY - 8;
    const handleAttachX = bodyCX + bodyRX - 3;
    const handleExtend = 20;
    const handleThick = 5;

    for (let y = handleTopY; y <= handleBotY; y++) {
      const t = (y - handleTopY) / (handleBotY - handleTopY);
      const curve = Math.sin(t * Math.PI);
      const outerX = handleAttachX + Math.round(handleExtend * curve);
      const innerX = handleAttachX + Math.round((handleExtend - handleThick) * curve);

      for (let x = innerX; x <= outerX; x++) {
        if (x >= 0 && x < 128 && y >= 0 && y < 96) pc.setPixel(x, y, FLAT);
      }

      // Connection bars at top and bottom
      if (t < 0.06 || t > 0.94) {
        for (let x = handleAttachX; x <= handleAttachX + 5; x++) {
          if (x >= 0 && x < 128 && y >= 0 && y < 96) pc.setPixel(x, y, FLAT);
        }
      }
    }

    // Base — flat bottom
    for (let x = bodyCX - 20; x <= bodyCX + 20; x++) {
      if (x >= 0 && x < 128 && bodyCY + bodyRY + 1 < 96) {
        pc.setPixel(x, bodyCY + bodyRY + 1, FLAT);
        pc.setPixel(x, bodyCY + bodyRY + 2, FLAT);
      }
    }
  },
};
