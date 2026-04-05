// Shattered Realm — Tree (resource)
// 24x32 Pixel tier — trunk + canopy
// PROCESS: profile-first silhouette → verify → shade → detail

module.exports = {
  width: 24, height: 32, style: 'pixel', entityType: 'prop',
  colors: {
    leaf: '#3a7a2a',      // canopy mid
    leafShd: '#1a4a12',   // canopy shadow (cool-shifted)
    trunk: '#5a3a1a',     // trunk mid
    trunkShd: '#3a2218',  // trunk shadow (cool-shifted)
  },
  draw(pc, pal) {
    const lg = pal.groups.leaf.startIdx;
    const ls = pal.groups.leafShd.startIdx;
    const tg = pal.groups.trunk.startIdx;
    const ts = pal.groups.trunkShd.startIdx;
    const cx = 12;

    // === STEP 1: PROFILES ===

    // Trunk profile: slight taper up, root flare at base
    function trunkProfile(t) { // t: 0=top of trunk, 1=bottom
      if (t > 0.85) return 2.5 + (t - 0.85) * 6; // root flare
      return 1.5 + t * 0.5; // slight taper (wider at bottom)
    }

    // Canopy profile: organic cloud shape, NOT a perfect circle
    // Asymmetric — left side slightly wider than right
    function canopyProfile(t) { // t: 0=top, 1=bottom
      if (t < 0.05) return 1;  // tippy top
      if (t < 0.15) return 3 + t * 20; // rapid expand
      // Main body — sine-based with bumps for leaf clusters
      const base = 9 * Math.sin(t * Math.PI * 0.85);
      // Leaf cluster bumps on outline
      const bump1 = Math.max(0, Math.sin((t - 0.3) * 12)) * 1.5;
      const bump2 = Math.max(0, Math.sin((t - 0.55) * 14)) * 1.2;
      return base + bump1 + bump2;
    }

    // Light direction (upper-left, toward viewer)
    const lx = -0.5, ly = -0.6, lz = 0.63;

    // === STEP 2: GROUND SHADOW ===
    pc.fillEllipse(cx, 30, 8, 2, ts + 0);

    // === STEP 3: TRUNK with cylinder lighting ===
    const trunkTop = 18, trunkBot = 30;
    for (let y = trunkTop; y <= trunkBot; y++) {
      const t = (y - trunkTop) / (trunkBot - trunkTop);
      const halfW = Math.round(trunkProfile(t));
      for (let x = cx - halfW; x <= cx + halfW; x++) {
        // Cylinder normal: only x component matters
        const nx = (x - cx) / (halfW + 0.5);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const NdotL = nx * lx + 0 * ly + nz * lz;
        const diffuse = Math.max(0, NdotL);
        const specular = Math.pow(Math.max(0, 2 * NdotL * nz - lz), 25) * 0.1;
        let v = 0.06 + diffuse * 0.62 + specular;
        v = v * v * (3 - 2 * v); // S-curve

        // Dual palette: warm tones for lit, cool for shadow
        if (v > 0.4) {
          pc.setPixel(x, y, tg + Math.min(3, Math.round(v * 3)));
        } else {
          pc.setPixel(x, y, ts + Math.min(3, Math.round(v * 2.5)));
        }
      }
    }
    // Bark texture: a few darker horizontal lines
    pc.setPixel(cx - 1, 22, ts + 0);
    pc.setPixel(cx, 24, ts + 0);
    pc.setPixel(cx + 1, 26, ts + 0);
    pc.setPixel(cx - 1, 28, ts + 0);

    // === STEP 4: CANOPY with hemisphere lighting ===
    const canopyTop = 1, canopyBot = 21;
    const canopyCY = 11; // center Y of canopy mass
    const canopyR = 10;  // approximate radius for normal calc

    for (let y = canopyTop; y <= canopyBot; y++) {
      const t = (y - canopyTop) / (canopyBot - canopyTop);
      const halfW = Math.round(canopyProfile(t));
      if (halfW < 1) continue;

      // Slight asymmetry: left side 1px wider
      const leftEdge = cx - halfW - (t > 0.3 && t < 0.7 ? 1 : 0);
      const rightEdge = cx + halfW;

      for (let x = leftEdge; x <= rightEdge; x++) {
        // Hemisphere normal
        const nx = (x - cx) / canopyR;
        const ny = (y - canopyCY) / canopyR;
        const r2 = nx * nx + ny * ny;
        const nz = r2 < 1 ? Math.sqrt(1 - r2) : 0.1;
        const NdotL = nx * lx + ny * ly + nz * lz;
        const diffuse = Math.max(0, NdotL);
        const bounce = Math.max(0, ny * 0.3) * 0.1;
        let v = 0.05 + diffuse * 0.65 + bounce;
        v = v * v * (3 - 2 * v); // S-curve

        // Dual palette: warm greens for lit, cool dark greens for shadow
        if (v > 0.38) {
          pc.setPixel(x, y, lg + Math.min(3, Math.round(v * 3)));
        } else {
          pc.setPixel(x, y, ls + Math.min(3, Math.round(Math.max(0.04, v * 2))));
        }
      }
    }

    // === STEP 5: LEAF CLUSTER DETAIL ===
    // Bright leaf highlights on upper-left lit side (tiny, extreme)
    const highlights = [
      [7,4],[8,3],[6,6],[9,5],[5,8],[7,9],[10,4],[8,7],
      [6,11],[9,10],
    ];
    highlights.forEach(([hx,hy]) => {
      if (pc.isFilled(hx, hy)) {
        pc.setPixel(hx, hy, lg + 3); // brightest green
      }
    });

    // Shadow leaf clusters on lower-right
    const shadows = [
      [15,14],[16,13],[17,12],[14,16],[16,15],[15,17],
      [13,18],[17,11],[18,14],
    ];
    shadows.forEach(([sx,sy]) => {
      if (pc.isFilled(sx, sy)) {
        pc.setPixel(sx, sy, ls + 0); // darkest shadow
      }
    });

    // Leaf edge detail: dark crevice lines between cluster bumps
    const crevices = [
      [4,10],[5,10],[18,10],[19,10],
      [3,14],[4,14],[19,14],[20,14],
      [6,18],[7,18],[17,18],[18,18],
    ];
    crevices.forEach(([cx2,cy2]) => {
      if (pc.isFilled(cx2, cy2)) {
        pc.setPixel(cx2, cy2, ls + 0);
      }
    });

    // Upper canopy: scattered bright individual leaf tips
    for (let i = 0; i < 5; i++) {
      const lx2 = 6 + ((i * 7) % 12);
      const ly2 = 3 + ((i * 5) % 8);
      if (pc.isFilled(lx2, ly2)) {
        pc.setPixel(lx2, ly2, lg + 3);
      }
    }
  },
};
