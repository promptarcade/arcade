// Shattered Realm — Majestic Tree (massive, gnarled trunk, sprawling multi-lobe canopy)
module.exports = {
  width: 32, height: 40, style: 'pixel', entityType: 'prop',
  colors: { leaf: '#3a7a2a', leafShd: '#1a4a12', trunk: '#5a3a1a', trunkShd: '#3a2218' },
  draw(pc, pal) {
    const lg=pal.groups.leaf.startIdx, ls=pal.groups.leafShd.startIdx;
    const tg=pal.groups.trunk.startIdx, ts=pal.groups.trunkShd.startIdx;
    const cx=16, lx=-0.5, ly=-0.6, lz=0.63;

    pc.fillEllipse(cx,38,12,2,ts+0);

    // Trunk — gnarled, thick, big root flare
    for(let y=24;y<=38;y++){
      const t=(y-24)/14;
      let hw;
      if(t>0.8) hw=Math.round(3.5+(t-0.8)*12);
      else if(t>0.6) hw=Math.round(3+Math.sin((t-0.6)*8)*0.5);
      else hw=Math.round(2.5+t*0.8+Math.sin(t*12)*0.3);
      for(let x=cx-hw;x<=cx+hw;x++){
        const nx=(x-cx)/(hw+0.5),nz=Math.sqrt(Math.max(0.05,1-nx*nx));
        const dot=nx*lx+nz*lz;
        let v=0.06+Math.max(0,dot)*0.62+Math.pow(Math.max(0,2*dot*nz-lz),25)*0.1;
        v=v*v*(3-2*v);
        pc.setPixel(x,y, v>0.4?tg+Math.min(3,Math.round(v*3)):ts+Math.min(3,Math.round(v*2.5)));
      }
    }
    // Bark
    [[15,26],[16,28],[17,30],[14,32],[15,34]].forEach(([bx,by])=>{ pc.setPixel(bx,by,ts+0); });

    // Canopy — sprawling multi-lobe
    for(let y=1;y<=26;y++){
      const t=(y-1)/25;
      let hw;
      if(t<0.04) hw=1;
      else if(t<0.1) hw=Math.round(3+t*30);
      else {
        const base=13*Math.sin(t*Math.PI*0.82);
        hw=Math.round(base+Math.max(0,Math.sin((t-0.2)*8))*2+Math.max(0,Math.sin((t-0.45)*10))*1.8+Math.max(0,Math.sin((t-0.7)*12))*1.5);
      }
      if(hw<1) continue;
      const le=cx-hw-(t>0.3&&t<0.7?1:0), re=cx+hw;
      for(let x=le;x<=re;x++){
        const nx=(x-cx)/14,ny=(y-13)/14,r2=nx*nx+ny*ny;
        const nz=r2<1?Math.sqrt(1-r2):0.1;
        const dot=nx*lx+ny*ly+nz*lz;
        let v=0.05+Math.max(0,dot)*0.65+Math.max(0,ny*0.3)*0.1;
        v=v*v*(3-2*v);
        pc.setPixel(x,y, v>0.38?lg+Math.min(3,Math.round(v*3)):ls+Math.min(3,Math.round(Math.max(0.04,v*2))));
      }
    }
    // Highlights
    [[8,4],[10,3],[7,6],[11,5],[6,8],[12,4],[9,7],[5,10],[8,9],[7,12],[10,8],[6,14]].forEach(([hx,hy])=>{
      if(pc.isFilled(hx,hy)) pc.setPixel(hx,hy,lg+3);
    });
    // Shadows
    [[22,18],[23,17],[21,20],[24,16],[20,22],[23,19],[22,21],[19,24],[21,23]].forEach(([sx,sy])=>{
      if(pc.isFilled(sx,sy)) pc.setPixel(sx,sy,ls+0);
    });
    // Crevices
    [[4,10],[5,10],[27,10],[4,16],[5,16],[27,16],[3,20],[4,20],[28,20]].forEach(([cx2,cy2])=>{
      if(pc.isFilled(cx2,cy2)) pc.setPixel(cx2,cy2,ls+0);
    });
  },
};
