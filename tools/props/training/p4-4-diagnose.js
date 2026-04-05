// Phase 4, Exercise 4.4: Draw a 32px character, then self-diagnose errors
// Training target: identify banding, pillow shading, and other mistakes
// Deliberately draw with CORRECT technique to prove we know the anti-patterns

module.exports = {
  width: 32,
  height: 48,
  style: 'chibi',
  entityType: 'character',
  outlineMode: 'none',
  colors: {
    skin: '#ffcc99',
    skincool: '#cc9977',   // cool shadow skin
    hair: '#553322',
    shirt: '#3366aa',
    shirtcool: '#223355',  // cool shadow shirt
    pants: '#445566',
    shoes: '#332211',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.skin.startIdx); },

  drawPost(pc, pal) {
    const sk = pal.groups.skin;
    const skc = pal.groups.skincool;
    const hr = pal.groups.hair;
    const sh = pal.groups.shirt;
    const shc = pal.groups.shirtcool;
    const pn = pal.groups.pants;
    const sho = pal.groups.shoes;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 16, headCY = 13;
    const lx = -0.55, ly = -0.65, lz = 0.52;

    // Helper: shade a filled region with sphere-like normals
    function shadeRegion(pixels, litGroup, shdGroup) {
      for (const [x, y, nx, ny] of pixels) {
        if (x < 0 || x >= 32 || y < 0 || y >= 48) continue;
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
        const dot = Math.max(0, nx * lx + ny * ly + nz * lz);
        let v = 0.1 + dot * 0.7;
        v = v * v * (3 - 2 * v);
        if (v > 0.35) {
          pc.setPixel(x, y, tone(litGroup, v));
        } else {
          pc.setPixel(x, y, tone(shdGroup, Math.max(0.05, v * 1.3 + 0.05)));
        }
      }
    }

    // HEAD — ellipse, rx=8, ry=9
    const headRX = 8, headRY = 9;
    const headPixels = [];
    for (let y = headCY - headRY; y <= headCY + headRY; y++) {
      for (let x = cx - headRX; x <= cx + headRX; x++) {
        const dx = (x - cx) / headRX, dy = (y - headCY) / headRY;
        if (dx * dx + dy * dy <= 1) {
          headPixels.push([x, y, dx * 0.8, dy * 0.6]);
        }
      }
    }
    shadeRegion(headPixels, sk, skc);

    // HAIR — dome on top of head + side bangs
    for (let y = headCY - headRY - 2; y <= headCY - 2; y++) {
      for (let x = cx - headRX + 1; x <= cx + headRX - 1; x++) {
        const dx = (x - cx) / headRX;
        const dy = (y - (headCY - headRY + 2)) / 6;
        if (dx * dx + dy * dy > 1.1) continue;
        if (x < 0 || x >= 32 || y < 0 || y >= 48) continue;
        const nz = Math.sqrt(Math.max(0.1, 1 - dx * dx * 0.5));
        const dot = Math.max(0, dx * lx + (-0.7) * ly + nz * lz);
        pc.setPixel(x, y, tone(hr, 0.1 + dot * 0.7));
      }
    }

    // EYES — 3x3, white + iris + pupil + specular
    const eyeY = headCY;
    for (const ex of [cx - 3, cx + 2]) {
      // White
      pc.setPixel(ex, eyeY, tone(sk, 0.95));
      pc.setPixel(ex + 1, eyeY, tone(sk, 0.95));
      pc.setPixel(ex, eyeY + 1, tone(sk, 0.9));
      pc.setPixel(ex + 1, eyeY + 1, tone(sk, 0.9));
      // Iris (use hair colour as proxy)
      pc.setPixel(ex, eyeY + 1, tone(hr, 0.5));
      pc.setPixel(ex + 1, eyeY + 1, tone(hr, 0.5));
      // Pupil
      pc.setPixel(ex + 1, eyeY + 1, tone(hr, 0.05));
      // Specular — tiny white dot, upper-left of each eye
      pc.setPixel(ex, eyeY, tone(sk, 1.0));
    }

    // TORSO — shirt, rectangular with slight taper
    const torsoTop = 23, torsoBot = 32;
    for (let y = torsoTop; y <= torsoBot; y++) {
      const t = (y - torsoTop) / (torsoBot - torsoTop);
      const halfW = Math.round(7 - t * 0.5);
      for (let x = cx - halfW; x <= cx + halfW; x++) {
        if (x < 0 || x >= 32) continue;
        const nx = (x - cx) / (halfW + 1) * 0.7;
        const ny = (t - 0.3) * 0.5;
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx - ny * ny));
        const dot = Math.max(0, nx * lx + ny * ly + nz * lz);
        let v = 0.1 + dot * 0.65;
        v = v * v * (3 - 2 * v);
        if (v > 0.35) {
          pc.setPixel(x, y, tone(sh, v));
        } else {
          pc.setPixel(x, y, tone(shc, Math.max(0.05, v * 1.3 + 0.05)));
        }
      }
    }

    // ARMS — narrow rectangles on sides
    for (let y = torsoTop + 1; y <= torsoTop + 10; y++) {
      for (const side of [-1, 1]) {
        const ax = cx + side * 8;
        for (let dx = 0; dx < 3; dx++) {
          const x = ax + dx * side;
          if (x < 0 || x >= 32 || y < 0 || y >= 48) continue;
          const nx = side * 0.6;
          const nz = 0.8;
          const dot = Math.max(0, nx * lx + nz * lz);
          pc.setPixel(x, y, tone(sk, 0.15 + dot * 0.6));
        }
      }
    }

    // LEGS — two columns
    for (let y = 33; y <= 42; y++) {
      for (const loff of [-3, 2]) {
        for (let dx = 0; dx < 4; dx++) {
          const x = cx + loff + dx;
          if (x < 0 || x >= 32) continue;
          const nx = ((dx - 1.5) / 2) * 0.5;
          const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
          const dot = Math.max(0, nx * lx + nz * lz);
          pc.setPixel(x, y, tone(pn, 0.1 + dot * 0.6));
        }
      }
    }

    // SHOES
    for (let y = 43; y <= 44; y++) {
      for (const loff of [-4, 1]) {
        for (let dx = 0; dx < 6; dx++) {
          const x = cx + loff + dx;
          if (x < 0 || x >= 32) continue;
          pc.setPixel(x, y, tone(sho, y === 43 ? 0.4 : 0.2));
        }
      }
    }

    // SELOUT outline — tinted, not black
    // Check every empty pixel adjacent to a filled one
    for (let y = 0; y < 48; y++) {
      for (let x = 0; x < 32; x++) {
        if (pc.getPixel(x, y) !== 0) continue;
        let nearGroup = null;
        let nearBright = 0;
        for (const [ndx, ndy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          const nx = x + ndx, ny = y + ndy;
          if (nx < 0 || nx >= 32 || ny < 0 || ny >= 48) continue;
          if (pc.getPixel(nx, ny) !== 0) {
            nearGroup = hr; // default to hair (dark brown) for outline
            nearBright = 0.12;
            break;
          }
        }
        if (nearGroup) {
          pc.setPixel(x, y, tone(nearGroup, nearBright));
        }
      }
    }

    // Drop shadow
    for (let x = cx - 6; x <= cx + 6; x++) {
      if (x >= 0 && x < 32) {
        pc.setPixel(x, 45, tone(hr, 0.08));
        pc.setPixel(x, 46, tone(hr, 0.05));
      }
    }
  },
};
