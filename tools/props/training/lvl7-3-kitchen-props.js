// Level 7.3: Kitchen Props — chibi scale (32px) for game use
// Ladle, Stove (with pot), Counter (with cutting board)
// Same dual-palette warm/cool, consistent light direction
// Layout: 3 props side by side (96 × 40)
module.exports = {
  width: 96,
  height: 40,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    // Ladle — steel
    steelLit: '#AAAABC', steelShd: '#4A4A5A',
    woodLit: '#A07040', woodShd: '#503020',
    // Stove — dark iron
    ironLit: '#5A5A6A', ironShd: '#2A2A35',
    flameLit: '#FF8830', flameShd: '#AA3310',
    // Pot (on stove) — copper
    copperLit: '#CC7744', copperShd: '#6A3322',
    // Counter — pale wood
    counterLit: '#C8B090', counterShd: '#7A6848',
    // Cutting board — darker wood
    boardLit: '#9A7A50', boardShd: '#5A4028',
    // Food accent on counter
    vegLit: '#55AA55', vegShd: '#2A5530',
  },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.steelLit.startIdx); },
  drawPost(pc, pal) {
    const TW = 96, TH = 40;
    const pg = pal.groups;

    function tone(grp, frac) {
      return grp.startIdx + Math.max(0, Math.min(grp.toneCount - 1,
        Math.round(frac * (grp.toneCount - 1))));
    }
    function dt(wg, cg, v) {
      return v > 0.38 ? tone(wg, v) : tone(cg, Math.max(0.04, v * 1.2));
    }

    pc.pixels[0] = 0;
    const lx = -0.5, ly = -0.6, lz = 0.63;

    function cylinderV(x, ccx, halfW) {
      const nx = (x - ccx) / (halfW + 0.5);
      const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
      const NdotL = nx * lx + nz * lz;
      const diffuse = Math.max(0, NdotL);
      const specular = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 50) * 0.25;
      let v = 0.06 + diffuse * 0.62 + specular + 0.04;
      v = v * v * (3 - 2 * v);
      return Math.max(0.02, Math.min(1, v));
    }

    // Metal cylinder (higher specular)
    function metalCylV(x, ccx, halfW) {
      const nx = (x - ccx) / (halfW + 0.5);
      const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
      const NdotL = nx * lx + nz * lz;
      const diffuse = Math.max(0, NdotL);
      const specular = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 80) * 0.5;
      const envReflect = 0.15;
      let v = envReflect + diffuse * 0.35 + specular;
      v = v * v * v * (v * (v * 6 - 15) + 10); // quintic S-curve for metal
      return Math.max(0.02, Math.min(1, v));
    }

    function px(x, y, wg, cg, v) {
      if (x >= 0 && x < TW && y >= 0 && y < TH)
        pc.setPixel(x, y, dt(wg, cg, v));
    }

    // ========================================
    // 1. LADLE (0-31) — bowl + long handle
    // ========================================
    {
      const cx = 16;
      const st = { w: pg.steelLit, c: pg.steelShd };
      const wd = { w: pg.woodLit, c: pg.woodShd };

      // Handle — long diagonal wood shaft
      for (let i = 0; i < 20; i++) {
        const hx = cx - 6 + Math.round(i * 0.3);
        const hy = 4 + i;
        for (let dx = 0; dx < 2; dx++)
          if (hx + dx >= 0 && hx + dx < 32 && hy < TH) {
            let v = cylinderV(hx + dx, hx + 0.5, 1);
            v *= (0.6 + (i / 20) * 0.3); // darker toward bowl end
            px(hx + dx, hy, wd.w, wd.c, v);
          }
      }

      // Bowl — half-sphere at bottom of handle
      const bowlCx = cx - 1, bowlCy = 28, bowlR = 6;
      for (let y = bowlCy - bowlR; y <= bowlCy + 2; y++) {
        for (let x = bowlCx - bowlR; x <= bowlCx + bowlR; x++) {
          if (x < 0 || x >= 32 || y < 0 || y >= TH) continue;
          const nx = (x - bowlCx) / bowlR, ny = (y - bowlCy) / bowlR;
          if (nx * nx + ny * ny > 1) continue;
          // Only lower half + a bit above center
          if (y < bowlCy - 2) continue;
          let v = metalCylV(x, bowlCx, bowlR);
          // Darken the interior (upper part of visible bowl)
          if (y < bowlCy) v *= 0.5;
          px(x, y, st.w, st.c, v);
        }
      }
      // Bowl rim
      for (let x = bowlCx - bowlR; x <= bowlCx + bowlR; x++) {
        if (x < 0 || x >= 32) continue;
        const d = Math.abs(x - bowlCx) / bowlR;
        if (d <= 1) px(x, bowlCy - 2, st.w, st.c, 0.7 + metalCylV(x, bowlCx, bowlR) * 0.3);
      }
    }

    // ========================================
    // 2. STOVE WITH POT (32-63) — boxy stove, pot on top, flame underneath
    // ========================================
    {
      const ox = 32;
      const ir = { w: pg.ironLit, c: pg.ironShd };
      const cp = { w: pg.copperLit, c: pg.copperShd };
      const fl = { w: pg.flameLit, c: pg.flameShd };

      // Stove body — dark iron box
      const stoveL = ox + 2, stoveR = ox + 29, stoveTop = 18, stoveBot = 38;
      for (let y = stoveTop; y <= stoveBot; y++) {
        for (let x = stoveL; x <= stoveR; x++) {
          if (x >= TW || y >= TH) continue;
          let v = cylinderV(x, ox + 16, 14);
          // Darken toward bottom
          v *= (1 - (y - stoveTop) / (stoveBot - stoveTop) * 0.2);
          px(x, y, ir.w, ir.c, v);
        }
      }

      // Stove top surface — slightly brighter
      for (let x = stoveL; x <= stoveR; x++)
        px(x, stoveTop, ir.w, ir.c, cylinderV(x, ox + 16, 14) * 0.7 + 0.2);

      // Burner ring (circular grate on top)
      const burnerCx = ox + 16, burnerCy = stoveTop + 1;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -6; dx <= 6; dx++) {
          const d = Math.sqrt(dx * dx + dy * dy * 4);
          if (d >= 5 && d <= 7)
            px(burnerCx + dx, burnerCy + dy, ir.w, ir.c, 0.55);
        }

      // Flame glow (orange under pot, visible in gap)
      for (let dx = -3; dx <= 3; dx++) {
        const fx = burnerCx + dx;
        if (fx >= 0 && fx < TW) {
          px(fx, stoveTop + 2, fl.w, fl.c, 0.7 - Math.abs(dx) * 0.1);
          px(fx, stoveTop + 3, fl.w, fl.c, 0.5 - Math.abs(dx) * 0.1);
        }
      }

      // Pot on stove — small copper pot
      const potCx = burnerCx, potTop = 8, potBot = stoveTop;
      // Pot body
      for (let y = potTop + 2; y <= potBot; y++) {
        const t = (y - potTop) / (potBot - potTop);
        const hw = Math.round(8 + Math.sin(t * Math.PI * 0.6) * 2);
        for (let x = potCx - hw; x <= potCx + hw; x++) {
          if (x < ox || x >= ox + 32 || y >= TH) continue;
          let v = metalCylV(x, potCx, hw);
          v *= (0.8 + t * 0.2); // brighter at bottom (near heat)
          px(x, y, cp.w, cp.c, v);
        }
      }
      // Pot rim
      for (let x = potCx - 9; x <= potCx + 9; x++) {
        if (x < ox || x >= ox + 32) continue;
        px(x, potTop + 1, cp.w, cp.c, 0.75);
        px(x, potTop + 2, cp.w, cp.c, 0.6);
      }
      // Interior (dark)
      for (let x = potCx - 7; x <= potCx + 7; x++)
        if (x >= ox && x < ox + 32) px(x, potTop + 2, ir.w, ir.c, 0.08);

      // Pot handles
      for (let dy = 0; dy < 3; dy++) {
        px(potCx - 10, potTop + 4 + dy, ir.w, ir.c, 0.4);
        px(potCx + 10, potTop + 4 + dy, ir.w, ir.c, 0.5);
      }

      // Stove door/knob
      px(ox + 16, stoveBot - 4, ir.w, ir.c, 0.6);
      px(ox + 17, stoveBot - 4, ir.w, ir.c, 0.65);
    }

    // ========================================
    // 3. COUNTER WITH CUTTING BOARD (64-95)
    // ========================================
    {
      const ox = 64;
      const ct = { w: pg.counterLit, c: pg.counterShd };
      const bd = { w: pg.boardLit, c: pg.boardShd };
      const vg = { w: pg.vegLit, c: pg.vegShd };

      // Counter body — tall wooden rectangle
      const cL = ox + 1, cR = ox + 30, cTop = 12, cBot = 38;
      for (let y = cTop; y <= cBot; y++) {
        for (let x = cL; x <= cR; x++) {
          if (x >= TW || y >= TH) continue;
          let v = cylinderV(x, ox + 16, 15);
          // Wood grain: subtle horizontal variation
          const grain = Math.sin(y * 1.3 + x * 0.2) * 0.04;
          v = Math.max(0.02, v + grain);
          px(x, y, ct.w, ct.c, v);
        }
      }

      // Counter top surface
      for (let y = cTop; y <= cTop + 2; y++)
        for (let x = cL; x <= cR; x++) {
          if (x >= TW) continue;
          let v = cylinderV(x, ox + 16, 15);
          px(x, y, ct.w, ct.c, v * 0.8 + 0.2);
        }

      // Cutting board on counter
      const bL = ox + 5, bR = ox + 25, bTop = 5, bBot = 11;
      for (let y = bTop; y <= bBot; y++) {
        for (let x = bL; x <= bR; x++) {
          if (x >= TW || y >= TH) continue;
          let v = cylinderV(x, ox + 15, 10);
          // Wood grain for board
          const grain = Math.sin(x * 0.8) * 0.06;
          v = Math.max(0.02, v + grain);
          px(x, y, bd.w, bd.c, v);
        }
      }
      // Board edge shadow
      for (let x = bL; x <= bR; x++)
        if (x < TW) px(x, bBot + 1, ct.w, ct.c, 0.15);

      // Small veggie pieces on board (chopped green)
      const pieces = [[ox+8, 7], [ox+11, 8], [ox+14, 7], [ox+17, 8], [ox+20, 7]];
      for (const [px2, py2] of pieces) {
        for (let dy = 0; dy < 2; dy++)
          for (let dx = 0; dx < 2; dx++)
            if (px2 + dx < TW && py2 + dy < TH)
              px(px2 + dx, py2 + dy, vg.w, vg.c, 0.5 + dx * 0.15);
      }
    }
  },
};
