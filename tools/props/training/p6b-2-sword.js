// Phase 6B.2: Sword — SHADED (silhouette verified)
// Metal blade (Phase 5 metal technique), leather grip, gold guard/pommel

module.exports = {
  width: 48,
  height: 128,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    blade: '#aabbcc',
    bladeshd: '#556677',
    guard: '#ccaa44',
    guardshd: '#886622',
    grip: '#664422',
    gripshd: '#442211',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.blade.startIdx); },

  drawPost(pc, pal) {
    const bl = pal.groups.blade;
    const bs = pal.groups.bladeshd;
    const gu = pal.groups.guard;
    const gs = pal.groups.guardshd;
    const gr = pal.groups.grip;
    const grs = pal.groups.gripshd;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 24, lx = -0.5, ly = -0.6, lz = 0.63;
    const tipY = 6, guardY = 80, gripBotY = 112, pommelCY = 117;

    // BLADE — metal with hard specular (Phase 5.1 technique)
    for (let y = tipY; y <= guardY; y++) {
      const t = (y - tipY) / (guardY - tipY);
      const halfW = Math.round(1 + t * 7 + Math.sin(t * Math.PI) * 1.5);
      if (halfW < 1) { pc.setPixel(cx, y, tone(bl, 0.5)); continue; }

      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 48) continue;

        // Blade is a flat plane — mostly uniform, with sharp edge highlights
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));

        // Metal: high reflectivity, sharp specular
        const NdotL = nx * lx + nz * lz;
        const dot = Math.max(0, NdotL);
        const rrz = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rrz), 80) * 0.6;

        // Environment reflection (upper reflects sky=light, lower reflects ground=dark)
        const envReflect = 0.25 + (1 - t) * 0.1;

        let v = envReflect + dot * 0.25 + specular;
        // Quintic S-curve for metal
        v = Math.max(0, Math.min(1, v));
        const s = v * v * v * (v * (v * 6 - 15) + 10);

        pc.setPixel(x, y, tone(s > 0.45 ? bl : bs, Math.max(0.05, s)));
      }

      // Centre ridge — bright line (fuller)
      if (halfW > 2 && y > tipY + 5) {
        pc.setPixel(cx, y, tone(bl, 0.7));
      }

      // Edge highlights — bright thin line at blade edges
      if (halfW > 1) {
        pc.setPixel(cx - halfW, y, tone(bl, 0.75));
        pc.setPixel(cx + halfW, y, tone(bs, 0.35));
      }
    }

    // GUARD — gold metal cross-piece
    const guardHalfW = 18;
    for (let y = guardY; y <= guardY + 4; y++) {
      for (let dx = -guardHalfW; dx <= guardHalfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 48) continue;
        const nx = dx / (guardHalfW + 1) * 0.5;
        const ny = (y - guardY - 2) / 3;
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx - ny * ny));
        const dot = Math.max(0, lx * nx + ly * ny + lz * nz);
        const spec = Math.pow(Math.max(0, nz), 30) * 0.3;
        let gv = 0.1 + dot * 0.6 + spec;
        gv = gv * gv * (3 - 2 * gv);
        pc.setPixel(x, y, tone(gv > 0.4 ? gu : gs, Math.max(0.06, gv)));
      }
    }
    // Guard end curves
    for (let dy = 0; dy < 3; dy++) {
      for (const side of [-1, 1]) {
        const x = cx + side * (guardHalfW - dy);
        if (x >= 0 && x < 48 && guardY + 4 + dy < 128) {
          pc.setPixel(x, guardY + 4 + dy, tone(gs, 0.2));
        }
      }
    }

    // GRIP — leather wrapped cylinder
    const gripHalfW = 4;
    for (let y = guardY + 4; y <= gripBotY; y++) {
      for (let dx = -gripHalfW; dx <= gripHalfW; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= 48) continue;
        const nx = dx / (gripHalfW + 1);
        const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);
        let lv = 0.08 + dot * 0.5;
        // Leather wrap lines — horizontal bands
        const wrapLine = (y - guardY) % 4 === 0;
        if (wrapLine) lv *= 0.7;
        lv = lv * lv * (3 - 2 * lv);
        pc.setPixel(x, y, tone(lv > 0.3 ? gr : grs, Math.max(0.04, lv)));
      }
    }

    // POMMEL — gold sphere
    const pommelR = 6;
    for (let dy = -pommelR; dy <= pommelR; dy++) {
      for (let dx = -pommelR; dx <= pommelR; dx++) {
        if (dx * dx + dy * dy > pommelR * pommelR) continue;
        const x = cx + dx, y = pommelCY + dy;
        if (x < 0 || x >= 48 || y < 0 || y >= 128) continue;
        const nx = dx / pommelR, ny = dy / pommelR;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const dot = Math.max(0, lx * nx + ly * ny + lz * nz);
        const spec = Math.pow(Math.max(0, 2 * (nx * lx + ny * ly + nz * lz) * nz - lz), 40) * 0.4;
        let pv = 0.08 + dot * 0.6 + spec;
        pv = pv * pv * (3 - 2 * pv);
        pc.setPixel(x, y, tone(pv > 0.4 ? gu : gs, Math.max(0.04, pv)));
      }
    }

    // Blade specular streak — long bright line down the left face
    for (let y = tipY + 4; y < guardY - 2; y++) {
      const t = (y - tipY) / (guardY - tipY);
      const halfW = Math.round(1 + t * 7 + Math.sin(t * Math.PI) * 1.5);
      const specX = cx - Math.round(halfW * 0.35);
      if (specX >= 0 && specX < 48 && y < 128) {
        pc.setPixel(specX, y, tone(bl, 0.85));
      }
    }
  },
};
