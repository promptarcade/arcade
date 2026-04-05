// A3: Full Body v9 — CORRECT CHIBI PROPORTIONS from the actual template
// Head rx=10 (20px wide on 32px canvas = 62.5%), eyes 4x4, gap 5
// The head IS the character in chibi style
module.exports = {
  width: 32,
  height: 48,
  style: 'chibi',
  entityType: 'prop',
  outlineMode: 'none',
  colors: {
    skinLit: '#f5c898', skinShd: '#a07058',
    hairW: '#bb4433', hairC: '#441018', hairHi: '#ee7755',
    shirtW: '#6699dd', shirtC: '#2a3d6a',
    pantsW: '#666670', pantsC: '#333344',
    shoesW: '#664433', shoesC: '#221118',
    beltW: '#998855', beltC: '#554422',
    // Eyes — 4 tones: deepShadow, shadow, midtone, white
    eyeDeep: '#112233', eyeShd: '#334466', eyeMid: '#5577aa', eyeWhite: '#eeeeff',
    mouth: '#aa8877',
    outln: '#221122',
  },
  draw(pc, pal) { pc.setPixel(0, 0, 1); },
  drawPost(pc, pal) {
    pc.pixels[0] = 0;
    const g = pal.groups, W = 32, H = 48, cx = 15;
    function t(gr, f) { return gr.startIdx + Math.max(0, Math.min(gr.toneCount-1, Math.round(f*(gr.toneCount-1)))); }
    const lx=-0.5, ly=-0.6, lz=0.63;
    function dual(wG, cG, v) { return v > 0.38 ? t(wG, v) : t(cG, Math.max(0.04, v*1.3)); }
    function lit(nx, ny, nz, sE, sS) {
      const d=Math.max(0,nx*lx+ny*ly+nz*lz);
      let v=0.04+d*0.68+Math.pow(Math.max(0,2*d*nz-lz),sE||25)*(sS||0.15)+Math.max(0,ny*0.3)*0.12;
      return Math.max(0,Math.min(1,v*v*(3-2*v)));
    }
    function cyl(cxC,top,bot,hwF,wG,cG,sE,sS) {
      for(let y=top;y<=bot;y++){
        const hw=typeof hwF==='function'?hwF(y):hwF;
        for(let x=cxC-hw;x<=cxC+hw;x++){
          if(x<0||x>=W)continue;
          const nx=(x-cxC)/(hw+1),nz=Math.sqrt(Math.max(0.05,1-nx*nx));
          pc.setPixel(x,y,dual(wG,cG,lit(nx,0,nz,sE||20,sS||0.1)));
        }
      }
    }

    // ================================================================
    // HEAD — rx=10, ry=10, cy=12 (matching chibi template)
    // This fills 20/32 = 62.5% of canvas width. CORRECT for chibi.
    // Face is flat-bright, edge-only shadow.
    // ================================================================
    // Head shape: wider at temples (rx=10), narrower at chin (rx=7)
    // NOT a circle — tapers below centre
    const headCy=12, headRxTop=10, headRyTop=10;
    for (let y=headCy-headRyTop;y<=headCy+headRyTop;y++) {
      // Variable width: full at temples, tapers at chin
      const yt=(y-headCy)/headRyTop; // -1=top, 0=centre, +1=bottom
      const chinTaper = yt > 0.2 ? 1 - (yt-0.2)*0.35 : 1; // chin narrows to ~72%
      const rx = headRxTop * chinTaper;
      const ry = headRyTop;
      for (let x=0;x<W;x++) {
        const nx=(x-cx)/rx, ny=(y-headCy)/ry, d=nx*nx+ny*ny;
        if (d<=1.0) {
          // Gentle directional shading — Phase 1-7 model with HIGH ambient
          const nz=Math.sqrt(Math.max(0,1-d));
          const NdL=nx*lx+ny*ly+nz*lz;
          const diff=Math.max(0,NdL);
          const spec=Math.pow(Math.max(0,2*NdL*nz-lz),30)*0.08;
          let v=0.18+diff*0.55+spec+Math.max(0,ny*0.3)*0.06;
          v=Math.max(0,Math.min(1,v*v*(3-2*v)));
          pc.setPixel(x,y,dual(g.skinLit,g.skinShd,v));
        }
      }
    }

    // ================================================================
    // HAIR — thin cap on top + sides, NOT dominating
    // Hair covers upper ~35% of head circle + extends slightly above
    // ================================================================
    for (let y=headCy-headRyTop-2;y<=headCy-3;y++) {
      for (let x=0;x<W;x++) {
        const nx=(x-cx)/(headRxTop+2), ny=(y-headCy)/(headRyTop+2), d=nx*nx+ny*ny;
        if (d<=1.0 && y<=headCy-3) {
          const nz=Math.sqrt(Math.max(0,1-d));
          pc.setPixel(x,y,dual(g.hairW,g.hairC,lit(nx,ny,nz,15,0.08)));
        }
      }
    }
    // Messy tufts above hair mass
    const tufts=[
      {x:cx-6,w:3,h:2},{x:cx-2,w:3,h:3},{x:cx+2,w:3,h:2},{x:cx+6,w:2,h:1}
    ];
    const tuftBase = headCy-headRyTop-2;
    for (const tf of tufts) {
      for (let dy=0;dy<tf.h;dy++) {
        const ty=tuftBase-dy-1;
        if(ty<0) continue;
        const tw=dy===tf.h-1?Math.max(1,tf.w-1):tf.w;
        for(let dx=0;dx<tw;dx++){
          const px=tf.x+dx;
          if(px>=0&&px<W) pc.setPixel(px,ty,t(g.hairW,0.45+(tf.h-dy)*0.12));
        }
      }
    }
    // Hair highlight
    pc.setPixel(cx-4,tuftBase,t(g.hairHi,0.95));
    pc.setPixel(cx-3,tuftBase,t(g.hairHi,0.85));
    // Side hair
    for(let y=headCy-4;y<=headCy+2;y++){
      pc.setPixel(cx-11,y,t(g.hairC,0.12));
      pc.setPixel(cx-10,y,t(g.hairW,0.3));
      pc.setPixel(cx+10,y,t(g.hairW,0.25));
      pc.setPixel(cx+11,y,t(g.hairC,0.1));
    }

    // ================================================================
    // EYES — 4x4 each, gap=5 (matching chibi template)
    // BIG eyes — this is what makes chibi work
    // ================================================================
    const eyeW=4, eyeH=4, eyeGap=5;
    const eyeY=headCy-1; // slightly above centre
    const lEyeX=cx-Math.floor(eyeGap/2)-eyeW;
    const rEyeX=cx+Math.floor(eyeGap/2)+1;

    // Fill both eyes with white background
    for(let dy=0;dy<eyeH;dy++) for(let dx=0;dx<eyeW;dx++){
      pc.setPixel(lEyeX+dx,eyeY+dy,t(g.eyeWhite,0.9));
      pc.setPixel(rEyeX+dx,eyeY+dy,t(g.eyeWhite,0.9));
    }
    // Iris (fills centre 2x2)
    const iOff=1;
    for(let dy=iOff;dy<iOff+2;dy++) for(let dx=iOff;dx<iOff+2;dx++){
      pc.setPixel(lEyeX+dx,eyeY+dy,t(g.eyeMid,0.5));
      pc.setPixel(rEyeX+dx,eyeY+dy,t(g.eyeMid,0.5));
    }
    // Pupil (1px centre)
    pc.setPixel(lEyeX+iOff+1,eyeY+iOff+1,t(g.eyeDeep,0.05));
    pc.setPixel(rEyeX+iOff,eyeY+iOff+1,t(g.eyeDeep,0.05));
    // Specular (1px upper-left of each eye)
    pc.setPixel(lEyeX+iOff,eyeY+iOff,t(g.eyeWhite,1.0));
    pc.setPixel(rEyeX+iOff,eyeY+iOff,t(g.eyeWhite,1.0));
    // Upper lid line (dark line above eye)
    for(let dx=0;dx<eyeW;dx++){
      pc.setPixel(lEyeX+dx,eyeY-1,t(g.eyeDeep,0.15));
      pc.setPixel(rEyeX+dx,eyeY-1,t(g.eyeDeep,0.15));
    }

    // Mouth — simple line below eyes
    const mouthY=headCy+Math.floor(headRyTop*0.4); // ~16
    pc.hline(cx-1,mouthY,3,t(g.mouth,0.4));

    // ================================================================
    // NECK
    // ================================================================
    const neckTop=headCy+headRyTop+1; // y=23
    for(let y=neckTop;y<=neckTop+1;y++)
      for(let x=cx-2;x<=cx+2;x++)
        pc.setPixel(x,y,t(g.skinShd,0.12));

    // ================================================================
    // TORSO — cylinder-lit, Phase 1-7 quality, w=14
    // ================================================================
    const torsoTop=25, torsoBot=33;
    function torsoHW(y){const r=y-torsoTop;if(r<=1)return 5+r;if(r<=6)return 7;return 7-Math.round((r-6)*0.5);}
    cyl(cx,torsoTop,torsoBot,torsoHW,g.shirtW,g.shirtC,20,0.1);
    // Collar
    pc.setPixel(cx-1,torsoTop,t(g.skinShd,0.2));
    pc.setPixel(cx,torsoTop,t(g.skinShd,0.25));
    pc.setPixel(cx+1,torsoTop,t(g.skinShd,0.2));
    // Fold
    for(let y=torsoTop+2;y<=torsoBot;y++) pc.setPixel(cx,y,t(g.shirtC,0.18));

    // Belt
    for(let x=cx-6;x<=cx+6;x++) if(pc.pixels[torsoBot*W+x]) pc.setPixel(x,torsoBot,t(g.beltC,0.2));
    pc.setPixel(cx,torsoBot,t(g.beltW,0.7));

    // Arms — cylinder-lit, 3px wide
    for(let side of [-1,1]){
      const armX=side<0?cx-9:cx+7;
      for(let y=torsoTop+1;y<=torsoBot+1;y++){
        const isHand=y>torsoBot-2;
        const wG=isHand?g.skinLit:g.shirtW, cG=isHand?g.skinShd:g.shirtC;
        for(let dx=0;dx<3;dx++){
          const px=armX+dx;if(px<0||px>=W)continue;
          const nx=(dx-1)/1.5,nz=Math.sqrt(Math.max(0.1,1-nx*nx));
          pc.setPixel(px,y,dual(wG,cG,lit(nx,0,nz,20,0.1)));
        }
      }
    }

    // Legs
    const legTop=torsoBot+1;
    for(let y=legTop;y<=legTop+9;y++){
      for(let x=cx-5;x<=cx-1;x++){const nx=(x-(cx-3))/3,nz=Math.sqrt(Math.max(0.05,1-nx*nx));pc.setPixel(x,y,dual(g.pantsW,g.pantsC,lit(nx,0,nz,15,0.05)));}
      for(let x=cx+1;x<=cx+5;x++){const nx=(x-(cx+3))/3,nz=Math.sqrt(Math.max(0.05,1-nx*nx));pc.setPixel(x,y,dual(g.pantsW,g.pantsC,lit(nx,0,nz,15,0.05)));}
    }
    pc.setPixel(cx,legTop,t(g.pantsC,0.02));

    // Shoes
    const shoeTop=legTop+10;
    for(let y=shoeTop;y<=shoeTop+2;y++){
      for(let x=cx-6;x<=cx-1;x++){const nx=(x-(cx-3.5))/4,nz=Math.sqrt(Math.max(0.05,1-nx*nx));pc.setPixel(x,y,dual(g.shoesW,g.shoesC,lit(nx,0,nz,20,0.08)));}
      for(let x=cx+1;x<=cx+6;x++){const nx=(x-(cx+3.5))/4,nz=Math.sqrt(Math.max(0.05,1-nx*nx));pc.setPixel(x,y,dual(g.shoesW,g.shoesC,lit(nx,0,nz,20,0.08)));}
    }

    // Outline
    const pts=[];
    for(let y=0;y<H;y++) for(let x=0;x<W;x++)
      if(pc.pixels[y*W+x]===0)
        for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
          const nx=x+dx,ny=y+dy;
          if(nx>=0&&nx<W&&ny>=0&&ny<H&&pc.pixels[ny*W+nx]!==0){pts.push([x,y]);break;}
        }
    for(const [x,y] of pts) pc.setPixel(x,y,t(g.outln,0.08));
  },
};
