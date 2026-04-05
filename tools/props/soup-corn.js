// Soup Shop — Corn (96x96, HD tier)
// Yellow cob with rows of kernels, green husk partially peeled back

module.exports = {
  width: 96,
  height: 96,
  style: 'hd',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    kernel: '#ddaa33',
    kernelshd: '#996622',
    husk: '#66aa44',
    huskshd: '#447733',
  },

  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.kernel.startIdx); },

  drawPost(pc, pal) {
    const kg = pal.groups.kernel;
    const ks = pal.groups.kernelshd;
    const hg = pal.groups.husk;
    const hs = pal.groups.huskshd;

    function tone(group, frac) {
      return group.startIdx + Math.max(0, Math.min(group.toneCount - 1,
        Math.round(frac * (group.toneCount - 1))));
    }
    pc.pixels[0] = 0;

    const cx = 48, lx = -0.5, ly = -0.6, lz = 0.63;
    const rng = sf2_seededRNG(77);

    // Cob is slightly diagonal — tilted
    const cobTop = 8, cobBot = 78;
    const cobRX = 18;
    const tilt = 0.1; // slight rightward lean

    // COB BODY — cylinder of kernels
    for (let y = cobTop; y <= cobBot; y++) {
      const t = (y - cobTop) / (cobBot - cobTop);
      // Taper at ends
      let widthMod = 1;
      if (t < 0.1) widthMod = 0.6 + t * 4;
      else if (t > 0.85) widthMod = 1 - (t - 0.85) / 0.15 * 0.5;
      const halfW = Math.round(cobRX * widthMod);
      const offsetX = Math.round(tilt * (y - cobTop));

      for (let dx = -halfW; dx <= halfW; dx++) {
        const x = cx + offsetX + dx;
        if (x < 0 || x >= 96 || y < 0 || y >= 96) continue;

        // Cylinder normal
        const nx = dx / (halfW + 1);
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx));
        const dot = Math.max(0, lx * nx + lz * nz);

        // Kernel grid pattern — individual kernels as bumps
        const kernelRow = Math.floor(y / 4);
        const kernelCol = Math.floor((dx + halfW) / 3);
        const isKernelGap = (y % 4 === 0) || ((dx + halfW) % 3 === 0);

        let v;
        if (isKernelGap) {
          // Gap between kernels — darker
          v = 0.04 + dot * 0.25;
        } else {
          // Kernel surface — each has its own micro-highlight
          const kernelDX = (dx + halfW) % 3 - 1;
          const kernelDY = y % 4 - 1.5;
          const kernelBump = Math.max(0, 1 - (kernelDX * kernelDX + kernelDY * kernelDY) * 0.3);
          v = 0.1 + dot * 0.55 + kernelBump * 0.15;
        }

        // Specular on individual kernels — corn is waxy/shiny
        const NdotL = nx * lx + nz * lz;
        const rrz = 2 * NdotL * nz - lz;
        const specular = Math.pow(Math.max(0, rrz), 25) * 0.2;
        v += specular;

        v = v * v * (3 - 2 * v);
        v = Math.max(0.02, Math.min(1, v));

        pc.setPixel(x, y, tone(v > 0.35 ? kg : ks, v));
      }
    }

    // Silk threads at top of cob — thin brown/tan wisps
    for (let s = 0; s < 8; s++) {
      let sx = cx + Math.round(tilt * (cobTop - cobTop)) + Math.round((rng() - 0.5) * 8);
      let sy = cobTop;
      for (let step = 0; step < 15 + Math.round(rng() * 10); step++) {
        sx += Math.round((rng() - 0.5) * 2);
        sy -= 1;
        if (sx >= 0 && sx < 96 && sy >= 0 && sy < 96) {
          pc.setPixel(sx, sy, tone(ks, 0.3 + rng() * 0.15));
        }
      }
    }
  },
};
