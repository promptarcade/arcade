// Glyph Forge — Rune Fragment: Dot
// 48x48 glowing concentrated energy point on dark stone cell
module.exports = {
  width: 48, height: 48, style: 'chibi', entityType: 'effect',
  outlineMode: 'none',
  colors: {
    stone: '#3a3a42', glow: '#55aaee', core: '#ccddff', crack: '#222228'
  },
  draw(pc, pal) {
    pc.setPixel(0, 0, pal.groups.stone.startIdx);
  },
  drawPost(pc, pal) {
    const sg = pal.groups.stone, gg = pal.groups.glow, cg = pal.groups.core;
    const crk = pal.groups.crack;
    function tone(g, f) {
      return g.startIdx + Math.max(0, Math.min(g.toneCount - 1, Math.round(f * (g.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const W = 48, H = 48, cx = 24, cy = 24;

    // Stone background
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
        const vignette = Math.min(1, edge / 8) * 0.3 + 0.3;
        const grain = (Math.sin(x * 7.3 + y * 11.7) * 0.5 + 0.5) * 0.15;
        pc.setPixel(x, y, tone(sg, vignette + grain));
      }
    }

    // Grid edges
    for (let x = 0; x < W; x++) { pc.setPixel(x, 0, tone(crk, 0.3)); pc.setPixel(x, H - 1, tone(crk, 0.3)); }
    for (let y = 0; y < H; y++) { pc.setPixel(0, y, tone(crk, 0.3)); pc.setPixel(W - 1, y, tone(crk, 0.3)); }

    // Central dot with large glow radius
    const coreR = 4;
    const glowR = 14;

    for (let y = 2; y < H - 2; y++) {
      for (let x = 2; x < W - 2; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < glowR) {
          const glowF = 1 - dist / glowR;
          const intensity = glowF * glowF;
          pc.setPixel(x, y, tone(gg, 0.1 + intensity * 0.6));
        }
        if (dist < coreR + 3) {
          const outerF = 1 - Math.max(0, dist - coreR) / 3;
          pc.setPixel(x, y, tone(gg, 0.4 + outerF * 0.5));
        }
        if (dist < coreR) {
          const f = 1 - dist / coreR;
          pc.setPixel(x, y, tone(cg, 0.5 + f * f * 0.5));
        }
      }
    }

    // Small radiating lines from centre (runic energy)
    const rays = [
      { angle: -0.4, len: 10 }, { angle: 0.8, len: 9 },
      { angle: 2.0, len: 11 }, { angle: 3.5, len: 8 },
      { angle: 4.7, len: 10 }, { angle: 5.6, len: 9 },
    ];
    for (const ray of rays) {
      for (let d = coreR + 2; d < coreR + ray.len; d++) {
        const rx = Math.round(cx + Math.cos(ray.angle) * d);
        const ry = Math.round(cy + Math.sin(ray.angle) * d);
        if (rx >= 2 && rx < W - 2 && ry >= 2 && ry < H - 2) {
          const fade = 1 - (d - coreR - 2) / ray.len;
          pc.setPixel(rx, ry, tone(gg, 0.3 + fade * 0.5));
        }
      }
    }
  },
};
