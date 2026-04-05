// A4: Three distinct characters — all at v3 quality (full Phase 1-7 lighting)
// Shared: lighting model, outline weight, head:body ratio, eye structure
// Different: silhouette, hair, clothing colour, skin tone, build
module.exports = {
  width: 104,
  height: 52,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    // CHARACTER 1: Stocky builder — short brown hair, orange vest, light skin
    s1W: '#f5c088', s1C: '#906858',          // skin
    h1W: '#886633', h1C: '#331a10', h1Hi: '#bbaa66', // hair
    sh1W: '#dd9944', sh1C: '#7a4420',        // shirt (orange)
    p1W: '#556644', p1C: '#223318',          // pants (olive)
    bo1W: '#664422', bo1C: '#221108',        // shoes
    // CHARACTER 2: Thin scholar — long dark hair, purple sweater, medium skin
    s2W: '#e0a878', s2C: '#805848',          // skin (slightly darker)
    h2W: '#332244', h2C: '#110818', h2Hi: '#554466', // hair (dark purple)
    sh2W: '#8855bb', sh2C: '#3a2060',        // shirt (purple)
    p2W: '#555566', p2C: '#222230',          // pants (dark grey)
    bo2W: '#443344', bo2C: '#18081a',        // shoes
    // CHARACTER 3: Adventurer — red ponytail, green tunic, hat, warm skin
    s3W: '#f5c898', s3C: '#906050',          // skin
    h3W: '#cc3322', h3C: '#551010', h3Hi: '#ee6644', // hair (red)
    sh3W: '#55aa55', sh3C: '#204820',        // shirt (green)
    p3W: '#887755', p3C: '#3a3018',          // pants (khaki)
    bo3W: '#775533', bo3C: '#2a1808',        // shoes
    hatW: '#aa8855', hatC: '#443018',        // hat
    // Shared
    iris1: '#446644', pup1: '#112211',
    iris2: '#665544', pup2: '#221108',
    iris3: '#4466aa', pup3: '#112244',
    specW: '#ffffff',
    mouthW: '#aa5555', mouthC: '#663344',
    outln: '#221122',
  },
  draw(pc, pal) { pc.setPixel(0, 0, 1); },
  drawPost(pc, pal) {
    pc.pixels[0] = 0;
    const g = pal.groups;
    const TW = 104, TH = 52;
    function tone(gr, f) {
      return gr.startIdx + Math.max(0, Math.min(gr.toneCount-1, Math.round(f*(gr.toneCount-1))));
    }
    const lx=-0.5, ly=-0.6, lz=0.63;
    function dualTone(wG, cG, v) {
      return v > 0.38 ? tone(wG, v) : tone(cG, Math.max(0.04, v*1.3));
    }
    function litV(nx, ny, nz, sE, sS) {
      const NdL = nx*lx+ny*ly+nz*lz;
      const diff = Math.max(0, NdL);
      const spec = Math.pow(Math.max(0, 2*NdL*nz-lz), sE||25)*(sS||0.15);
      const bounce = Math.max(0, ny*0.3)*0.12;
      let v = 0.04+diff*0.68+spec+bounce;
      return Math.max(0, Math.min(1, v*v*(3-2*v)));
    }
    function fillSphere(cx, cy, rx, ry, wG, cG, sE, sS, yMin, yMax) {
      for (let y = Math.max(0,cy-ry); y <= Math.min(TH-1,cy+ry); y++) {
        if (yMin!==undefined&&y<yMin) continue;
        if (yMax!==undefined&&y>yMax) continue;
        for (let x = cx-rx-1; x <= cx+rx+1; x++) {
          if (x<0||x>=TW) continue;
          const nx=(x-cx)/rx, ny=(y-cy)/ry, d=nx*nx+ny*ny;
          if (d<=1.0) {
            const nz=Math.sqrt(Math.max(0,1-d));
            pc.setPixel(x, y, dualTone(wG, cG, litV(nx, ny, nz, sE, sS)));
          }
        }
      }
    }
    function fillCyl(cx, top, bot, hwF, wG, cG, sE, sS) {
      for (let y = top; y <= bot; y++) {
        const hw = typeof hwF==='function'?hwF(y):hwF;
        for (let x = cx-hw; x <= cx+hw; x++) {
          if (x<0||x>=TW) continue;
          const nx=(x-cx)/(hw+1), nz=Math.sqrt(Math.max(0.05,1-nx*nx));
          pc.setPixel(x, y, dualTone(wG, cG, litV(nx, 0, nz, sE||20, sS||0.1)));
        }
      }
    }
    function armCyl(baseX, top, bot, w, wG, cG, skW, skC) {
      for (let y = top; y <= bot; y++) {
        const isHand = y > bot-3;
        const wg=isHand?skW:wG, cg=isHand?skC:cG;
        const aw = isHand?w+1:w;
        for (let dx = 0; dx < aw; dx++) {
          const x = baseX+dx;
          if (x<0||x>=TW) continue;
          const nx=(dx-(aw-1)/2)/((aw-1)/2+0.5), nz=Math.sqrt(Math.max(0.1,1-nx*nx));
          pc.setPixel(x, y, dualTone(wg, cg, litV(nx, 0, nz, 20, 0.1)));
        }
      }
    }
    function drawEyes(cx, ey, iG, pG) {
      const l=cx-5, r=cx+2;
      pc.setPixel(l,ey,tone(g.specW,1));pc.setPixel(l+1,ey,tone(iG,0.8));pc.setPixel(l+2,ey,tone(iG,0.55));
      pc.setPixel(l,ey+1,tone(iG,0.65));pc.setPixel(l+1,ey+1,tone(pG,0.05));pc.setPixel(l+2,ey+1,tone(iG,0.4));
      pc.setPixel(l,ey+2,tone(iG,0.35));pc.setPixel(l+1,ey+2,tone(iG,0.25));pc.setPixel(l+2,ey+2,tone(iG,0.3));
      pc.setPixel(r,ey,tone(iG,0.55));pc.setPixel(r+1,ey,tone(iG,0.8));pc.setPixel(r+2,ey,tone(g.specW,1));
      pc.setPixel(r,ey+1,tone(iG,0.4));pc.setPixel(r+1,ey+1,tone(pG,0.05));pc.setPixel(r+2,ey+1,tone(iG,0.65));
      pc.setPixel(r,ey+2,tone(iG,0.3));pc.setPixel(r+1,ey+2,tone(iG,0.25));pc.setPixel(r+2,ey+2,tone(iG,0.35));
    }
    function drawLegs(cx, top, bot, wG, cG) {
      for (let y=top;y<=bot;y++) {
        for (let x=cx-5;x<=cx-1;x++){const nx=(x-(cx-3))/3,nz=Math.sqrt(Math.max(0.05,1-nx*nx));pc.setPixel(x,y,dualTone(wG,cG,litV(nx,0,nz,15,0.05)));}
        for (let x=cx+1;x<=cx+5;x++){const nx=(x-(cx+3))/3,nz=Math.sqrt(Math.max(0.05,1-nx*nx));pc.setPixel(x,y,dualTone(wG,cG,litV(nx,0,nz,15,0.05)));}
      }
      pc.setPixel(cx,top,tone(cG,0.02));
    }
    function drawShoes(cx, top, bot, wG, cG) {
      for (let y=top;y<=bot;y++) {
        for (let x=cx-6;x<=cx-1;x++){const nx=(x-(cx-3.5))/4,nz=Math.sqrt(Math.max(0.05,1-nx*nx));pc.setPixel(x,y,dualTone(wG,cG,litV(nx,0,nz,20,0.08)));}
        for (let x=cx+1;x<=cx+6;x++){const nx=(x-(cx+3.5))/4,nz=Math.sqrt(Math.max(0.05,1-nx*nx));pc.setPixel(x,y,dualTone(wG,cG,litV(nx,0,nz,20,0.08)));}
      }
    }
    function addOutline(ox, w) {
      const pts=[];
      for (let y=0;y<TH;y++) for (let x=ox;x<ox+w;x++) {
        if (x>=0&&x<TW&&pc.pixels[y*TW+x]===0)
          for (const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nx=x+dx,ny=y+dy;
            if (nx>=ox&&nx<ox+w&&ny>=0&&ny<TH&&pc.pixels[ny*TW+nx]!==0){pts.push([x,y]);break;}
          }
      }
      for (const [x,y] of pts) pc.setPixel(x,y,tone(g.outln,0.08));
    }

    // ========== CHARACTER 1: Stocky builder ==========
    // Wider torso, short cropped hair, orange vest
    {
      const cx=16, by=3;
      // Short hair dome
      fillSphere(cx, by+3, 8, 4, g.h1W, g.h1C, 15, 0.08, by-1, by+5);
      pc.setPixel(cx-2, by, tone(g.h1Hi, 0.9));
      // Head
      fillSphere(cx, by+7, 7, 6, g.s1W, g.s1C, 30, 0.12, by+2, by+14);
      drawEyes(cx, by+7, g.iris1, g.pup1);
      pc.setPixel(cx, by+10, tone(g.s1C, 0.2));
      pc.setPixel(cx-1, by+11, tone(g.mouthW, 0.5));
      pc.setPixel(cx, by+11, tone(g.mouthC, 0.2));
      pc.setPixel(cx+1, by+11, tone(g.mouthW, 0.5));
      // Neck occlusion
      for (let y=by+14;y<=by+15;y++) for (let x=cx-2;x<=cx+2;x++) pc.setPixel(x,y,tone(g.s1C,0.08));
      // Wide torso
      const hw1 = (y) => { const r=y-(by+16); return r<=2?6+r:r<=8?9:9-Math.round((r-8)*0.5); };
      fillCyl(cx, by+16, by+29, hw1, g.sh1W, g.sh1C, 20, 0.1);
      pc.setPixel(cx, by+16, tone(g.s1C, 0.3));
      for (let y=by+18;y<=by+28;y++) pc.setPixel(cx, y, tone(g.sh1C, 0.18));
      // Arms (wider apart due to wide torso)
      armCyl(cx-12, by+17, by+28, 3, g.sh1W, g.sh1C, g.s1W, g.s1C);
      armCyl(cx+10, by+17, by+27, 3, g.sh1W, g.sh1C, g.s1W, g.s1C);
      drawLegs(cx, by+30, by+41, g.p1W, g.p1C);
      drawShoes(cx, by+42, by+45, g.bo1W, g.bo1C);
      addOutline(0, 34);
    }

    // ========== CHARACTER 2: Thin scholar ==========
    // Narrow build, long dark hair past shoulders, purple sweater
    {
      const cx=52, by=3;
      // Long hair dome + side strands
      fillSphere(cx, by+3, 8, 5, g.h2W, g.h2C, 15, 0.08, by-1, by+7);
      pc.setPixel(cx-1, by, tone(g.h2Hi, 0.7));
      // Side strands past shoulders
      for (let y=by+6;y<=by+20;y++) {
        pc.setPixel(cx-8,y,tone(g.h2C,0.1));pc.setPixel(cx-7,y,tone(g.h2W,0.3));
        pc.setPixel(cx+7,y,tone(g.h2W,0.25));pc.setPixel(cx+8,y,tone(g.h2C,0.08));
      }
      // Head
      fillSphere(cx, by+7, 7, 6, g.s2W, g.s2C, 30, 0.12, by+2, by+14);
      drawEyes(cx, by+7, g.iris2, g.pup2);
      pc.setPixel(cx, by+10, tone(g.s2C, 0.2));
      pc.setPixel(cx-1, by+11, tone(g.mouthW, 0.45));
      pc.setPixel(cx, by+11, tone(g.mouthW, 0.45));
      pc.setPixel(cx+1, by+11, tone(g.mouthW, 0.45));
      // Neck
      for (let y=by+14;y<=by+15;y++) for (let x=cx-2;x<=cx+1;x++) pc.setPixel(x,y,tone(g.s2C,0.08));
      // Narrow torso
      const hw2 = (y) => { const r=y-(by+16); return r<=2?4+r:r<=8?6:6-Math.round((r-8)*0.4); };
      fillCyl(cx, by+16, by+29, hw2, g.sh2W, g.sh2C, 20, 0.1);
      pc.setPixel(cx, by+16, tone(g.s2C, 0.3));
      armCyl(cx-9, by+17, by+28, 3, g.sh2W, g.sh2C, g.s2W, g.s2C);
      armCyl(cx+7, by+17, by+27, 3, g.sh2W, g.sh2C, g.s2W, g.s2C);
      drawLegs(cx, by+30, by+41, g.p2W, g.p2C);
      drawShoes(cx, by+42, by+45, g.bo2W, g.bo2C);
      addOutline(34, 36);
    }

    // ========== CHARACTER 3: Adventurer ==========
    // Hat (silhouette feature!), red ponytail, green tunic, medium build
    {
      const cx=88, by=3;
      // HAT — wide brim changes silhouette dramatically
      fillSphere(cx, by+2, 6, 3, g.hatW, g.hatC, 20, 0.1, by-1, by+4);
      // Brim
      for (let x=cx-10;x<=cx+10;x++) {
        if (x>=70&&x<104) {
          const nx=(x-cx)/11, nz=Math.sqrt(Math.max(0.1,1-nx*nx));
          pc.setPixel(x, by+4, dualTone(g.hatW, g.hatC, litV(nx, 0, nz, 15, 0.08)));
          pc.setPixel(x, by+5, tone(g.hatC, 0.12));
        }
      }
      // Head (lower due to hat)
      fillSphere(cx, by+9, 7, 6, g.s3W, g.s3C, 30, 0.12, by+5, by+16);
      // Red ponytail from right side
      for (let i=0;i<10;i++) {
        const tx=cx+8+Math.round(i*0.2), ty=by+8+i;
        if (tx<104) {
          pc.setPixel(tx,ty,tone(g.h3W,0.55));
          pc.setPixel(tx+1<104?tx+1:tx,ty,tone(g.h3C,0.2));
        }
      }
      pc.setPixel(cx+8, by+7, tone(g.h3Hi, 0.9));
      // Hair under hat
      for (let y=by+5;y<=by+8;y++){
        if(cx-8>=70) pc.setPixel(cx-8,y,tone(g.h3C,0.15));
        if(cx-7>=70) pc.setPixel(cx-7,y,tone(g.h3W,0.3));
        pc.setPixel(cx+7,y,tone(g.h3W,0.25));
      }
      drawEyes(cx, by+9, g.iris3, g.pup3);
      pc.setPixel(cx, by+12, tone(g.s3C, 0.2));
      pc.setPixel(cx-1, by+13, tone(g.mouthW, 0.5));
      pc.setPixel(cx, by+14, tone(g.mouthC, 0.2));
      pc.setPixel(cx+1, by+13, tone(g.mouthW, 0.5));
      // Neck
      for (let y=by+16;y<=by+17;y++) for (let x=cx-2;x<=cx+1;x++) pc.setPixel(x,y,tone(g.s3C,0.08));
      // Tunic (longer torso garment)
      const hw3 = (y) => { const r=y-(by+18); return r<=2?5+r:r<=10?7:7-Math.round((r-10)*0.3); };
      fillCyl(cx, by+18, by+32, hw3, g.sh3W, g.sh3C, 20, 0.1);
      pc.setPixel(cx, by+18, tone(g.s3C, 0.3));
      armCyl(cx-10, by+19, by+29, 3, g.sh3W, g.sh3C, g.s3W, g.s3C);
      armCyl(cx+8, by+19, by+28, 3, g.sh3W, g.sh3C, g.s3W, g.s3C);
      // Shorter legs (tunic covers upper)
      drawLegs(cx, by+33, by+41, g.p3W, g.p3C);
      drawShoes(cx, by+42, by+45, g.bo3W, g.bo3C);
      addOutline(70, 34);
    }
  },
};
