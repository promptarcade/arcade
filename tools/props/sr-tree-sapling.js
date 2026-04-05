// Shattered Realm — Tree Sapling (tiny, thin, small round puff)
module.exports = {
  width: 12, height: 16, style: 'pixel', entityType: 'prop',
  colors: { leaf: '#3a7a2a', leafShd: '#1a4a12', trunk: '#5a3a1a', trunkShd: '#3a2218' },
  draw(pc, pal) {
    const lg=pal.groups.leaf.startIdx, ls=pal.groups.leafShd.startIdx;
    const tg=pal.groups.trunk.startIdx, ts=pal.groups.trunkShd.startIdx;
    const cx=6, lx=-0.5, ly=-0.6, lz=0.63;

    pc.fillEllipse(cx,14,4,1,ts+0);

    // Trunk
    for(let y=10;y<=14;y++){
      const t=(y-10)/4, hw=Math.round(0.5+t*0.3);
      for(let x=cx-hw;x<=cx+hw;x++){
        const nx=(x-cx)/(hw+0.5),nz=Math.sqrt(Math.max(0.05,1-nx*nx));
        const dot=nx*lx+nz*lz; let v=0.06+Math.max(0,dot)*0.62; v=v*v*(3-2*v);
        pc.setPixel(x,y, v>0.4?tg+Math.min(3,Math.round(v*3)):ts+Math.min(3,Math.round(v*2.5)));
      }
    }
    // Canopy
    for(let y=2;y<=11;y++){
      const t=(y-2)/9;
      const hw=Math.round(t<0.1?0.5:4*Math.sin(t*Math.PI*0.9));
      if(hw<1) continue;
      for(let x=cx-hw;x<=cx+hw;x++){
        const nx=(x-cx)/4,ny=(y-6)/4,r2=nx*nx+ny*ny;
        const nz=r2<1?Math.sqrt(1-r2):0.1;
        const dot=nx*lx+ny*ly+nz*lz; let v=0.05+Math.max(0,dot)*0.65; v=v*v*(3-2*v);
        pc.setPixel(x,y, v>0.38?lg+Math.min(3,Math.round(v*3)):ls+Math.min(3,Math.round(Math.max(0.04,v*2))));
      }
    }
    // Highlights
    [[3,3],[4,4],[5,3]].forEach(([hx,hy])=>{ if(pc.isFilled(hx,hy)) pc.setPixel(hx,hy,lg+3); });
    [[7,7],[7,8]].forEach(([sx,sy])=>{ if(pc.isFilled(sx,sy)) pc.setPixel(sx,sy,ls+0); });
  },
};
