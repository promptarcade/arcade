// Level 2.2: Five hair silhouettes on same base body — FLAT BLACK FILL ONLY
// Test: are all 5 distinguishable from shape alone?
// Hair styles: short crop, spiky, long flowing, ponytail, afro
// Layout: 5 characters side by side (170 × 48)
module.exports = {
  width: 170,
  height: 50,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: { fill: '#222222' },
  draw(pc, pal) { pc.setPixel(0, 0, pal.groups.fill.startIdx); },
  drawPost(pc, pal) {
    const fg = pal.groups.fill;
    const F = fg.startIdx + Math.floor(fg.toneCount / 2);
    pc.pixels[0] = 0;
    const TW = 170, TH = 50;

    function drawBody(cx) {
      const headCy = 12, headRx = 10, headRy = 10;
      // Head ellipse
      for (let y = headCy-headRy; y <= headCy+headRy; y++)
        for (let x = cx-headRx; x <= cx+headRx; x++)
          if (x>=0&&x<TW&&((x-cx)/headRx)**2+((y-headCy)/headRy)**2<=1)
            pc.setPixel(x, y, F);
      // Ears
      for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++)
        if (dx*dx+dy*dy<=1) {
          if(cx-headRx+dx>=0) pc.setPixel(cx-headRx+dx, headCy+1+dy, F);
          if(cx+headRx+dx<TW) pc.setPixel(cx+headRx+dx, headCy+1+dy, F);
        }
      // Neck
      for (let y=23;y<=24;y++) for (let x=cx-2;x<=cx+2;x++) if(x>=0&&x<TW) pc.setPixel(x,y,F);
      // Torso
      const tL=cx-7;
      for (let y=25;y<=32;y++) for (let x=tL;x<tL+14;x++) if(x>=0&&x<TW) pc.setPixel(x,y,F);
      pc.setPixel(tL,25,0); pc.setPixel(tL+13,25,0);
      // Arms
      for (let y=26;y<=33;y++) {
        for (let dx=0;dx<3;dx++) { if(tL-3+dx>=0) pc.setPixel(tL-3+dx,y,F); if(tL+14+dx<TW) pc.setPixel(tL+14+dx,y,F); }
      }
      // Hands
      for (let y=34;y<=35;y++) {
        for (let dx=0;dx<3;dx++) { if(tL-3+dx>=0) pc.setPixel(tL-3+dx,y,F); if(tL+14+dx<TW) pc.setPixel(tL+14+dx,y,F); }
      }
      // Legs
      const legY=33, legW=4, legH=7;
      for (let y=legY;y<legY+legH;y++) {
        for (let dx=0;dx<legW;dx++) { pc.setPixel(cx-1-legW+dx,y,F); pc.setPixel(cx+1+dx,y,F); }
      }
      // Shoes
      for (let y=legY+legH;y<legY+legH+2;y++) {
        for (let dx=-1;dx<legW;dx++) pc.setPixel(cx-1-legW+dx,y,F);
        for (let dx=0;dx<=legW;dx++) pc.setPixel(cx+1+dx,y,F);
      }
    }

    // ========================================
    // 1. SHORT CROP — thin hair cap hugging skull, barely extends beyond head
    // ========================================
    {
      const cx = 16;
      // Hair: thin 2-3px layer on top of head, same width as head
      for (let y = 1; y <= 8; y++) {
        const headT = (y - 2) / 20; // fraction down head
        const headHW = Math.round(Math.sqrt(Math.max(0, 1 - ((y-12)/10)**2)) * 10);
        const hairHW = headHW + 1; // barely wider
        for (let x = cx-hairHW; x <= cx+hairHW; x++)
          if (x>=0&&x<TW) pc.setPixel(x, y, F);
      }
      drawBody(cx);
    }

    // ========================================
    // 2. SPIKY — tall tufts extending well above head
    // ========================================
    {
      const cx = 50;
      // Hair base on top of head
      for (let y = 1; y <= 8; y++) {
        const headHW = Math.round(Math.sqrt(Math.max(0, 1 - ((y-12)/10)**2)) * 10);
        for (let x = cx-headHW-1; x <= cx+headHW+1; x++)
          if (x>=0&&x<TW) pc.setPixel(x, y, F);
      }
      // Tall spikes
      const spikes = [
        {x: cx-6, w: 3, top: -4},
        {x: cx-2, w: 4, top: -6},  // tallest
        {x: cx+2, w: 3, top: -3},
        {x: cx+6, w: 2, top: -2},
      ];
      for (const sp of spikes) {
        for (let y = Math.max(0, sp.top); y <= 2; y++) {
          const t = (y - sp.top) / (3 - sp.top);
          const w = Math.max(1, Math.round(sp.w * t));
          const startX = sp.x + Math.floor((sp.w - w) / 2);
          for (let dx = 0; dx < w; dx++)
            if (startX+dx>=0&&startX+dx<TW) pc.setPixel(startX+dx, y, F);
        }
      }
      drawBody(cx);
    }

    // ========================================
    // 3. LONG FLOWING — hair extends well past shoulders
    // ========================================
    {
      const cx = 84;
      // Hair dome on head
      for (let y = 1; y <= 10; y++) {
        const headHW = Math.round(Math.sqrt(Math.max(0, 1 - ((y-12)/10)**2)) * 10);
        for (let x = cx-headHW-1; x <= cx+headHW+1; x++)
          if (x>=0&&x<TW) pc.setPixel(x, y, F);
      }
      // Long strands flowing down past shoulders on both sides
      for (let y = 8; y <= 35; y++) {
        const taper = y > 28 ? (y - 28) / 7 : 0;
        const w = Math.round(3 - taper * 2);
        if (w > 0) {
          for (let dx = 0; dx < w; dx++) {
            const lx = cx - 12 + dx, rx = cx + 11 + dx;
            if (lx>=0) pc.setPixel(lx, y, F);
            if (rx<TW) pc.setPixel(rx, y, F);
          }
        }
      }
      drawBody(cx);
    }

    // ========================================
    // 4. PONYTAIL — volume on one side, asymmetric
    // ========================================
    {
      const cx = 118;
      // Hair dome
      for (let y = 1; y <= 8; y++) {
        const headHW = Math.round(Math.sqrt(Math.max(0, 1 - ((y-12)/10)**2)) * 10);
        for (let x = cx-headHW-1; x <= cx+headHW+1; x++)
          if (x>=0&&x<TW) pc.setPixel(x, y, F);
      }
      // Ponytail extending from right side of head, going down
      for (let y = 8; y <= 32; y++) {
        const t = (y - 8) / 24;
        const tailX = cx + 11 + Math.round(Math.sin(t * Math.PI * 0.3) * 3);
        const tailW = Math.max(1, Math.round(3 - t * 2));
        for (let dx = 0; dx < tailW; dx++)
          if (tailX+dx>=0&&tailX+dx<TW) pc.setPixel(tailX+dx, y, F);
      }
      // Scrunchie/tie at base of ponytail
      for (let dx = -1; dx <= 3; dx++)
        if (cx+11+dx>=0&&cx+11+dx<TW) pc.setPixel(cx+11+dx, 8, F);
      drawBody(cx);
    }

    // ========================================
    // 5. AFRO — large round volume extending well beyond head
    // ========================================
    {
      const cx = 152;
      // Big round afro extending 4-5px beyond head in all directions
      const afroRx = 14, afroRy = 13, afroCy = 9;
      for (let y = afroCy-afroRy; y <= afroCy+afroRy; y++) {
        for (let x = cx-afroRx; x <= cx+afroRx; x++) {
          if (x<0||x>=TW||y<0||y>=TH) continue;
          const nx = (x-cx)/afroRx, ny = (y-afroCy)/afroRy;
          if (nx*nx+ny*ny <= 1.0) {
            pc.setPixel(x, y, F);
          }
        }
      }
      drawBody(cx);
    }
  },
};
