// Phase 5, Exercise 5.3: Glass bottle — transparency, refraction, caustic highlight
module.exports = {
  width: 64,
  height: 96,
  style: 'illustrated',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    glass: '#88bbcc',      // tinted glass
    dark: '#224444',       // deep shadow/interior
    highlight: '#eeffff',  // bright refraction/specular
    liquid: '#882233',     // red liquid inside
    ground: '#667766',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.glass.startIdx); },

  drawPost(pc, pal) {
    const gg = pal.groups.glass;
    const dg = pal.groups.dark;
    const hg = pal.groups.highlight;
    const lg = pal.groups.liquid;
    const grg = pal.groups.ground;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 32, neckTop = 10, neckBot = 28, bodyTop = 28, bodyBot = 80;
    const neckW = 6, bodyW = 22;
    const liquidLevel = 50; // Y where liquid starts
    const lx = -0.55, ly = -0.65, lz = 0.52;

    // Ground
    const groundY = bodyBot + 4;
    for (let y = groundY; y < 96; y++) {
      for (let x = 0; x < 64; x++) {
        pc.setPixel(x, y, tone(grg, Math.max(0.08, 0.4 - ((y - groundY) / (96 - groundY)) * 0.1)));
      }
    }

    // Caustic — bright patch on ground where light passes through glass
    for (let y = groundY; y < groundY + 6; y++) {
      for (let x = cx - 15; x < cx + 5; x++) {
        if (x < 0 || x >= 64 || y >= 96) continue;
        const dx = (x - (cx - 5)) / 10, dy = (y - (groundY + 2)) / 3;
        const d = dx * dx + dy * dy;
        if (d < 1) {
          const base = 0.4;
          pc.setPixel(x, y, tone(grg, Math.min(0.75, base + (1 - d) * 0.25)));
        }
      }
    }

    // Cast shadow (offset right, darker where no caustic)
    for (let y = groundY; y < groundY + 8; y++) {
      for (let x = cx + 5; x < cx + 28; x++) {
        if (x >= 64 || y >= 96) continue;
        const dx = (x - (cx + 14)) / 12, dy = (y - (groundY + 3)) / 5;
        if (dx * dx + dy * dy < 1) {
          pc.setPixel(x, y, tone(grg, Math.max(0.06, 0.35 * (0.6 + (dx * dx + dy * dy) * 0.4))));
        }
      }
    }

    // Bottle profile function
    function bottleHalfW(y) {
      if (y < neckTop) return 0;
      if (y <= neckBot) return neckW;
      const t = (y - bodyTop) / (bodyBot - bodyTop);
      if (t < 0.1) return Math.round(neckW + (bodyW - neckW) * (t / 0.1));
      if (t < 0.7) return bodyW;
      return Math.round(bodyW * (1 - (t - 0.7) / 0.3 * 0.12));
    }

    // GLASS BODY — the key: glass is mostly transparent, we see edges
    // The centre is nearly see-through, edges are where glass thickness shows
    for (let y = neckTop; y <= bodyBot; y++) {
      const halfW = bottleHalfW(y);
      if (halfW <= 0) continue;

      for (let x = cx - halfW; x <= cx + halfW; x++) {
        if (x < 0 || x >= 64 || y < 0 || y >= 96) continue;
        const xFrac = (x - cx) / halfW;

        // Glass thickness: thick at edges, thin at centre
        const thickness = Math.abs(xFrac);

        // Glass normal (cylinder-like)
        const nx = xFrac;
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const NdotL = nx * lx + nz * lz;
        const diffuse = Math.max(0, NdotL);

        // Fresnel: glass edges are more reflective (opaque), centre is transparent
        const fresnel = Math.pow(1 - nz, 2) * 0.6 + 0.15;

        // Is this in the liquid zone?
        const inLiquid = y >= liquidLevel;

        if (inLiquid) {
          // Liquid visible through glass — red tinted by glass
          const liquidBright = 0.2 + diffuse * 0.3;
          if (thickness < 0.6) {
            // Centre — mostly liquid colour showing through
            pc.setPixel(x, y, tone(lg, Math.max(0.05, liquidBright)));
          } else {
            // Edge — glass tint over liquid
            pc.setPixel(x, y, tone(lg, Math.max(0.03, liquidBright * 0.6)));
          }
        } else {
          // Empty glass — transparency + edge reflection
          if (thickness < 0.5) {
            // Centre — nearly transparent, very faint glass tint
            pc.setPixel(x, y, tone(gg, fresnel * 0.3));
          } else {
            // Edge — visible glass, reflects environment
            const edgeBright = fresnel + diffuse * 0.2;
            pc.setPixel(x, y, tone(gg, Math.max(0.05, edgeBright)));
          }
        }
      }
    }

    // Left edge highlight — strong vertical streak (glass catches light on edge)
    for (let y = neckTop + 2; y < bodyBot - 2; y++) {
      const halfW = bottleHalfW(y);
      if (halfW < 3) continue;
      const hx = cx - halfW + 2;
      if (hx >= 0 && hx < 64 && y < 96) {
        pc.setPixel(hx, y, tone(hg, 0.7));
        if (hx + 1 < 64) pc.setPixel(hx + 1, y, tone(gg, 0.55));
      }
    }

    // Right edge — darker (away from light)
    for (let y = neckTop + 2; y < bodyBot - 2; y++) {
      const halfW = bottleHalfW(y);
      if (halfW < 3) continue;
      const hx = cx + halfW - 1;
      if (hx >= 0 && hx < 64 && y < 96) {
        pc.setPixel(hx, y, tone(dg, 0.3));
      }
    }

    // Specular highlight — small, bright, on the upper body
    pc.setPixel(cx - 8, bodyTop + 8, tone(hg, 1.0));
    pc.setPixel(cx - 7, bodyTop + 8, tone(hg, 0.85));
    pc.setPixel(cx - 8, bodyTop + 9, tone(hg, 0.8));
    pc.setPixel(cx - 7, bodyTop + 7, tone(hg, 0.7));

    // Secondary specular on neck
    pc.setPixel(cx - 3, neckTop + 4, tone(hg, 0.75));
    pc.setPixel(cx - 3, neckTop + 5, tone(hg, 0.6));

    // Liquid meniscus — bright line at liquid level
    const lHalfW = bottleHalfW(liquidLevel);
    for (let x = cx - lHalfW + 3; x <= cx + lHalfW - 3; x++) {
      if (x >= 0 && x < 64 && liquidLevel < 96) {
        const xFrac = Math.abs(x - cx) / lHalfW;
        pc.setPixel(x, liquidLevel, tone(hg, 0.3 + (1 - xFrac) * 0.25));
        pc.setPixel(x, liquidLevel + 1, tone(lg, 0.45));
      }
    }

    // Cork at top
    for (let y = neckTop - 4; y < neckTop; y++) {
      for (let x = cx - neckW; x <= cx + neckW; x++) {
        if (x < 0 || x >= 64 || y < 0 || y >= 96) continue;
        const xFrac = (x - cx) / neckW;
        const lit = Math.max(0, -xFrac * 0.5 + 0.5);
        pc.setPixel(x, y, tone(grg, 0.35 + lit * 0.35));
      }
    }

    // Bottom edge
    const botHalfW = bottleHalfW(bodyBot);
    for (let x = cx - botHalfW; x <= cx + botHalfW; x++) {
      if (x >= 0 && x < 64 && bodyBot < 96) {
        pc.setPixel(x, bodyBot, tone(dg, 0.08));
      }
    }

    // Contact shadow
    for (let x = cx - botHalfW; x <= cx + botHalfW; x++) {
      if (x >= 0 && x < 64 && groundY < 96) {
        pc.setPixel(x, groundY, tone(dg, 0.04));
      }
    }
  },
};
