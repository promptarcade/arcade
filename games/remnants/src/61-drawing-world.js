// ============================================================
// OVERWORLD DRAWING
// ============================================================
Game.prototype.drawOverworld=function(ctx){
  var ts=CONFIG.TILE,px=this.player.x,py=this.player.y;
  var halfW=CONFIG.VIEW_W+1,halfH=CONFIG.VIEW_H+1;

  for(var dy=-halfH;dy<=halfH;dy++){for(var dx=-halfW;dx<=halfW;dx++){
    var wx=px+dx,wy=py+dy;
    var sx=wx*ts,sy=wy*ts;
    var tile=Overworld.getTile(wx,wy);
    var tileType=tile.type;

    // Check registered tile drawer first
    var drawer=TileRegistry.getDrawer(tileType);
    if(drawer){
      drawer(ctx,sx,sy,ts,true,this.animTimer,wx,wy);
    } else if(tileType===T.WATER){
      // Water with per-tile variety
      var wh=((wx*374761393+wy*668265263)>>>0);
      var depthN=Math.sin(wx*0.3+wy*0.4)*0.5+0.5;
      ctx.fillStyle=shadeHex('#1a3050',Math.round((depthN-0.5)*15));
      ctx.fillRect(sx,sy,ts,ts);
      var ripPhase=this.animTimer*1.2+wx*0.4+wy*0.6;
      ctx.fillStyle='rgba(80,150,230,0.12)';
      ctx.fillRect(sx+2,sy+ts*(0.2+Math.sin(ripPhase)*0.1),ts-4,Math.max(1,ts*0.05));
      ctx.fillRect(sx+4,sy+ts*(0.55+Math.sin(ripPhase+2)*0.08),ts-8,Math.max(1,ts*0.04));
      if((wh%7)<2){ctx.fillStyle='rgba(150,180,220,0.1)';ctx.fillRect(sx,sy,ts,3);}
      if(depthN>0.6){ctx.fillStyle='rgba(0,10,30,0.15)';ctx.beginPath();ctx.ellipse(sx+ts/2,sy+ts/2,ts*0.3,ts*0.2,0,0,Math.PI*2);ctx.fill();}
      if((wh%19)===0&&depthN<0.4){ctx.fillStyle='#2a6a2a';ctx.beginPath();ctx.arc(sx+((wh>>3)%8+4)*ts/16,sy+((wh>>6)%6+5)*ts/16,ts*0.08,0,Math.PI*2);ctx.fill();}
    } else if(tileType===T.SHALLOWS){
      // Shallow water near shore — lighter, visible bottom
      var sh=((wx*374761393+wy*668265263)>>>0);
      ctx.fillStyle=shadeHex('#2a5570',((sh%7)-3)*3);
      ctx.fillRect(sx,sy,ts,ts);
      // Sandy bottom visible
      ctx.fillStyle='rgba(180,160,120,0.12)';
      ctx.fillRect(sx,sy,ts,ts);
      // Gentle ripple
      ctx.fillStyle='rgba(100,170,240,0.1)';
      ctx.fillRect(sx+2,sy+ts*(0.35+Math.sin(this.animTimer+wx*0.3)*0.1),ts-4,Math.max(1,ts*0.04));
    } else if(tileType===T.BEACH){
      // Sandy shore — transition between water and land
      var bh=((wx*374761393+wy*668265263)>>>0);
      var sandTint=Math.sin(wx*0.5+wy*0.7)*5;
      ctx.fillStyle=shadeHex('#c4aa6a',Math.round(sandTint));
      ctx.fillRect(sx,sy,ts,ts);
      // Shell / pebble details
      if((bh%8)<2){
        ctx.fillStyle='#ddccaa';
        ctx.beginPath();ctx.arc(sx+((bh>>3)%10+3)*ts/16,sy+((bh>>6)%8+4)*ts/16,ts*0.04,0,Math.PI*2);ctx.fill();
      }
      // Driftwood
      if((bh%13)===0){
        ctx.strokeStyle='#8a7a5a';ctx.lineWidth=Math.max(1,ts/20);
        ctx.beginPath();ctx.moveTo(sx+3*ts/16,sy+10*ts/16);ctx.lineTo(sx+12*ts/16,sy+11*ts/16);ctx.stroke();
      }
      // Wet sand near water edge
      ctx.fillStyle='rgba(100,130,160,0.08)';
      ctx.fillRect(sx,sy,ts,ts*0.2);
    } else if(tileType===T.WALL){
      // Mountain — 3D rocky face
      var mh=((wx*374761393+wy*668265263)>>>0);
      ctx.fillStyle=shadeHex('#5a5550',((mh%9)-4)*2);
      ctx.fillRect(sx,sy,ts,ts);
      // Lit top
      ctx.fillStyle=shadeHex('#6a6560',10);
      ctx.fillRect(sx,sy,ts,ts*0.25);
      ctx.fillStyle='rgba(255,255,255,0.06)';
      ctx.fillRect(sx,sy,ts,Math.max(1,ts*0.05));
      // Dark bottom
      ctx.fillStyle='rgba(0,0,0,0.2)';
      ctx.fillRect(sx,sy+ts-ts*0.1,ts,ts*0.1);
      // Snow on highest peaks
      var peakHeight = overworldFbm(wx,wy,Overworld.seed+5000,4,0.03);
      if(peakHeight>0.82){
        ctx.fillStyle='rgba(220,230,240,0.3)';
        ctx.fillRect(sx,sy,ts,ts*0.35);
      }
    } else {
      // Unknown tile — dark fallback
      ctx.fillStyle='#222';ctx.fillRect(sx,sy,ts,ts);
    }

    // Registered tile light
    var tLight=TileRegistry.getLight(tileType);
    if(tLight){
      this.pipeline.addLight(sx+ts/2,sy+ts/2,{color:tLight.color,radius:ts*tLight.radius,intensity:tLight.intensity,flicker:tLight.flicker||0});
    }

    // Grid overlay for visibility
    ctx.strokeStyle='rgba(0,0,0,0.03)';ctx.lineWidth=0.5;
    ctx.strokeRect(sx+0.5,sy+0.5,ts-1,ts-1);
  }}
};

// ============================================================
// DUNGEON DRAWING
// ============================================================
Game.prototype.drawDungeon=function(ctx){
  var ts=CONFIG.TILE,px=this.player.x,py=this.player.y;
  var halfW=CONFIG.VIEW_W+1,halfH=CONFIG.VIEW_H+1;
  var terrain=this.terrainSprites;

  // Fill entire visible area with solid black so light can't bleed into void
  ctx.fillStyle='#000000';
  ctx.fillRect((px-halfW)*ts,(py-halfH)*ts,(halfW*2+1)*ts,(halfH*2+1)*ts);

  for(var dy=-halfH;dy<=halfH;dy++){for(var dx=-halfW;dx<=halfW;dx++){
    var tx=px+dx,ty=py+dy;
    if(tx<0||tx>=CONFIG.MAP_W||ty<0||ty>=CONFIG.MAP_H)continue;
    if(!this.dungeon.revealed[ty][tx])continue;
    var tile=this.dungeon.map[ty][tx], sx=tx*ts, sy=ty*ts;
    if(tile===T.VOID)continue; // already black from fill
    var visible=this.isVisible(tx,ty);
    ctx.globalAlpha=visible?1:0.35;

    if(tile===T.WALL){
      var wc=this.dungeon.biome.wallColor;
      var ac=this.dungeon.biome.accent;
      var wh=((tx*137+ty*269)&0xffff);
      var bIdx=getBiomeIndex(this.player.floor);
      // 2x3 stone block grid — each block gets its own color
      var bw=ts/2, bh=ts/3;
      for(var by=0;by<3;by++){
        for(var bx=0;bx<2;bx++){
          // Offset alternate rows
          var ox=(by%2===0)?0:bw*0.5;
          var rx=sx+bx*bw+ox, ry=sy+by*bh;
          // Per-block color from hash
          var blockHash=((tx*41+ty*67+bx*137+by*269)&0xffff);
          var shade=(blockHash%25)-12;
          ctx.fillStyle=shadeHex(wc,shade);
          ctx.fillRect(rx,ry,bw,bh);
          // Mortar gap
          ctx.strokeStyle='rgba(0,0,0,0.2)';ctx.lineWidth=Math.max(0.5,ts/40);
          ctx.strokeRect(rx+0.5,ry+0.5,bw-1,bh-1);
        }
      }
      // Exposed face depth shading
      var aboveOpen=ty>0&&this.dungeon.map[ty-1][tx]!==T.WALL;
      var belowOpen=ty<CONFIG.MAP_H-1&&this.dungeon.map[ty+1][tx]!==T.WALL;
      if(aboveOpen){
        ctx.fillStyle=shadeHex(wc,40);ctx.fillRect(sx,sy,ts,Math.round(ts*0.25));
        ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(sx,sy,ts,Math.max(1,ts*0.06));
      }
      if(belowOpen){ctx.fillStyle='rgba(0,0,0,0.35)';ctx.fillRect(sx,sy+ts-Math.round(ts*0.12),ts,Math.round(ts*0.12));}
      // Biome colour accents on ~30% of wall tiles
      var decor=(wh*31)%100;
      if(bIdx===0&&decor<30){ // Catacombs: green-brown moss
        ctx.fillStyle='rgba(50,80,30,'+(0.15+(wh%3)*0.08).toFixed(2)+')';
        var my=aboveOpen?0:ts*(0.3+(wh%4)*0.15);
        ctx.fillRect(sx+(wh*7%(ts>>1)),sy+my,ts*(0.25+(wh%3)*0.15),ts*(0.15+(wh%3)*0.1));
      } else if(bIdx===1&&decor<35){ // Flooded: damp blue stains
        ctx.fillStyle='rgba(30,60,140,0.18)';
        ctx.fillRect(sx+(wh%Math.round(ts*0.5)),sy+ts*0.3,ts*0.35,ts*0.5);
      } else if(bIdx===2&&decor<40){ // Fungal: green-purple growth
        ctx.fillStyle='rgba(40,120,50,0.25)';
        ctx.beginPath();ctx.arc(sx+ts*(0.3+(wh%4)*0.12),sy+ts*(0.4+(wh%3)*0.15),ts*0.18,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='rgba(80,40,120,0.15)';
        ctx.beginPath();ctx.arc(sx+ts*(0.6+(wh%3)*0.08),sy+ts*(0.3+(wh%3)*0.1),ts*0.12,0,Math.PI*2);ctx.fill();
      } else if(bIdx===3&&decor<30){ // Volcanic: orange-red glow veins
        ctx.strokeStyle='rgba(200,80,20,0.35)';ctx.lineWidth=Math.max(1.5,ts/10);
        ctx.beginPath();ctx.moveTo(sx,sy+ts*(0.3+(wh%3)*0.15));ctx.lineTo(sx+ts,sy+ts*(0.5+(wh%3)*0.1));ctx.stroke();
        ctx.strokeStyle='rgba(255,160,40,0.2)';ctx.lineWidth=Math.max(1,ts/14);
        ctx.beginPath();ctx.moveTo(sx,sy+ts*(0.3+(wh%3)*0.15));ctx.lineTo(sx+ts,sy+ts*(0.5+(wh%3)*0.1));ctx.stroke();
        if(visible) this.pipeline.addLight(sx+ts/2,sy+ts/2,{color:'#ff4400',radius:ts,intensity:0.12});
      } else if(bIdx===4&&decor<25){ // Void: purple crystal shards
        ctx.fillStyle='rgba(100,40,200,0.35)';
        var cx2=sx+ts*(0.3+(wh%4)*0.1),cy2=sy+ts*(0.15+(wh%3)*0.15);
        ctx.beginPath();ctx.moveTo(cx2,cy2);ctx.lineTo(cx2+ts*0.1,cy2+ts*0.3);ctx.lineTo(cx2-ts*0.1,cy2+ts*0.3);ctx.closePath();ctx.fill();
        ctx.fillStyle='rgba(170,100,255,0.2)';
        ctx.beginPath();ctx.moveTo(cx2,cy2+ts*0.05);ctx.lineTo(cx2+ts*0.05,cy2+ts*0.25);ctx.lineTo(cx2-ts*0.05,cy2+ts*0.25);ctx.closePath();ctx.fill();
        if(visible) this.pipeline.addLight(cx2,cy2+ts*0.15,{color:'#8844ff',radius:ts*0.7,intensity:0.08});
      }
    } else if(tile===T.FLOOR||tile===T.CORRIDOR||tile===T.DOOR||tile===T.STAIRS||tile===T.SHRINE||tile===T.REST){
      // Clean stone floor with subtle variation
      var fp=this.dungeon.biome.floorPal;
      var fh=((tx*137+ty*269)&0xffff);
      var tintAmt=((fh%11)-5)*2;
      ctx.fillStyle=shadeHex(fp.base,tintAmt);ctx.fillRect(sx,sy,ts,ts);
      // Grout lines
      ctx.strokeStyle='rgba(0,0,0,0.1)';ctx.lineWidth=Math.max(0.5,ts/40);
      ctx.strokeRect(sx+0.5,sy+0.5,ts-1,ts-1);
      // Top-left bevel highlight
      ctx.fillStyle='rgba(255,255,255,0.05)';
      ctx.fillRect(sx+1,sy+1,ts-2,Math.max(1,ts*0.06));
      ctx.fillRect(sx+1,sy+1,Math.max(1,ts*0.06),ts-2);
      // Bottom-right shadow
      ctx.fillStyle='rgba(0,0,0,0.05)';
      ctx.fillRect(sx+1,sy+ts-Math.max(1,ts*0.06),ts-2,Math.max(1,ts*0.06));
      ctx.fillRect(sx+ts-Math.max(1,ts*0.06),sy+1,Math.max(1,ts*0.06),ts-2);
      // Sparse subtle details — only on some tiles
      if((fh%11)===0){
        // Tiny pebble
        ctx.fillStyle=fp.light;
        ctx.beginPath();ctx.arc(sx+ts*(0.3+(fh%4)*0.12),sy+ts*(0.5+(fh%3)*0.12),ts*0.04,0,Math.PI*2);ctx.fill();
      }
      if((fh%13)===0){
        // Worn patch
        ctx.fillStyle=fp.dark;
        ctx.fillRect(sx+ts*0.3,sy+ts*0.35,ts*0.35,ts*0.25);
        ctx.fillStyle=shadeHex(fp.base,tintAmt-3);
        ctx.fillRect(sx+ts*0.33,sy+ts*0.38,ts*0.29,ts*0.19);
      }
      // Corridor worn edges
      if(tile===T.CORRIDOR){
        ctx.fillStyle='rgba(0,0,0,0.06)';
        ctx.fillRect(sx,sy,ts,Math.max(1,ts*0.1));ctx.fillRect(sx,sy+ts-Math.max(1,ts*0.1),ts,Math.max(1,ts*0.1));
        ctx.fillRect(sx,sy,Math.max(1,ts*0.1),ts);ctx.fillRect(sx+ts-Math.max(1,ts*0.1),sy,Math.max(1,ts*0.1),ts);
      }
      if((fh%9)===0){
        ctx.fillStyle=fp.dark;
        ctx.beginPath(); ctx.ellipse(sx+ts*0.5,sy+ts*0.5,ts*0.2,ts*0.12,(fh%3)*0.5,0,Math.PI*2); ctx.fill();
      }
      // Corridor darker edges
      if(tile===T.CORRIDOR){
        ctx.fillStyle='rgba(0,0,0,0.06)';
        ctx.fillRect(sx,sy,ts,Math.max(1,ts*0.12)); ctx.fillRect(sx,sy+ts-Math.max(1,ts*0.12),ts,Math.max(1,ts*0.12));
        ctx.fillRect(sx,sy,Math.max(1,ts*0.12),ts); ctx.fillRect(sx+ts-Math.max(1,ts*0.12),sy,Math.max(1,ts*0.12),ts);
      }
    } else if(tile===T.WATER){
      // Hand-drawn water with ripples
      ctx.fillStyle='#152840';ctx.fillRect(sx,sy,ts,ts);
      var wph=this.animTimer*1.2+tx*0.4+ty*0.6;
      ctx.fillStyle='#1a3555';
      ctx.fillRect(sx+1,sy+1,ts-2,ts-2);
      // Animated ripple highlights
      ctx.fillStyle='rgba(80,160,255,0.2)';
      var ry1=sy+ts*0.25+Math.sin(wph)*ts*0.1;
      ctx.fillRect(sx+2,ry1,ts-4,Math.max(1,ts*0.06));
      var ry2=sy+ts*0.6+Math.sin(wph+1.5)*ts*0.1;
      ctx.fillRect(sx+3,ry2,ts-6,Math.max(1,ts*0.06));
      ctx.fillStyle='rgba(120,200,255,0.12)';
      var ry3=sy+ts*0.45+Math.sin(wph+3)*ts*0.08;
      ctx.fillRect(sx+4,ry3,ts*0.4,Math.max(1,ts*0.04));
    } else if(tile===T.LAVA){
      // Hand-drawn lava with glow
      ctx.fillStyle='#331100';ctx.fillRect(sx,sy,ts,ts);
      var lph=this.animTimer*2.5+tx*0.7+ty*0.9;
      var glow=0.5+Math.sin(lph)*0.3;
      ctx.fillStyle='rgba(180,40,0,'+(0.6+glow*0.3).toFixed(2)+')';ctx.fillRect(sx+1,sy+1,ts-2,ts-2);
      ctx.fillStyle='rgba(255,120,0,'+(0.3+glow*0.3).toFixed(2)+')';
      ctx.beginPath();ctx.ellipse(sx+ts*0.4,sy+ts*0.35+Math.sin(lph)*ts*0.05,ts*0.25,ts*0.15,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,200,50,'+(0.2+glow*0.2).toFixed(2)+')';
      ctx.beginPath();ctx.ellipse(sx+ts*0.6,sy+ts*0.6+Math.sin(lph+2)*ts*0.04,ts*0.15,ts*0.1,0,0,Math.PI*2);ctx.fill();
      if(visible) this.pipeline.addLight(sx+ts/2,sy+ts/2,{color:'#ff4400',radius:ts*1.8,intensity:0.35,flicker:0.15});
    } else if(tile===T.ICE){
      // Frozen surface with crystal shards
      ctx.fillStyle='#88bbdd';ctx.fillRect(sx,sy,ts,ts);
      ctx.fillStyle='#99ccee';ctx.fillRect(sx+1,sy+1,ts-2,ts-2);
      // Frost cracks
      ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=Math.max(0.5,ts/24);
      ctx.beginPath();ctx.moveTo(sx+ts*0.2,sy+ts*0.3);ctx.lineTo(sx+ts*0.5,sy+ts*0.5);ctx.lineTo(sx+ts*0.8,sy+ts*0.35);ctx.stroke();
      ctx.beginPath();ctx.moveTo(sx+ts*0.5,sy+ts*0.5);ctx.lineTo(sx+ts*0.4,sy+ts*0.8);ctx.stroke();
      // Glints
      ctx.fillStyle='rgba(255,255,255,0.5)';
      ctx.fillRect(sx+ts*0.25,sy+ts*0.2,2,2);ctx.fillRect(sx+ts*0.65,sy+ts*0.55,2,2);
    } else if(tile===T.OIL){
      // Dark slick with iridescent sheen
      ctx.fillStyle='#111108';ctx.fillRect(sx,sy,ts,ts);
      ctx.fillStyle='#1a1a0e';ctx.fillRect(sx+1,sy+1,ts-2,ts-2);
      var oilPhase=((tx*3+ty*7)&0xff)*0.02+this.animTimer*0.5;
      ctx.fillStyle='rgba(80,70,30,'+(0.15+Math.sin(oilPhase)*0.1).toFixed(2)+')';
      ctx.beginPath();ctx.ellipse(sx+ts*0.5,sy+ts*0.5,ts*0.35,ts*0.25,oilPhase,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(60,80,60,0.08)';
      ctx.beginPath();ctx.ellipse(sx+ts*0.4,sy+ts*0.4,ts*0.2,ts*0.12,oilPhase+1,0,Math.PI*2);ctx.fill();
    } else if(tile===T.FUNGAL){
      // Overgrown floor with mushroom caps
      var fp=this.dungeon.biome.floorPal;
      ctx.fillStyle=fp.base;ctx.fillRect(sx,sy,ts,ts);
      ctx.fillStyle='rgba(30,80,30,0.3)';ctx.fillRect(sx,sy,ts,ts);
      // Mushroom caps
      var pulse=0.6+Math.sin(this.animTimer+tx*2+ty*3)*0.2;
      ctx.fillStyle='rgba(40,140,60,'+pulse.toFixed(2)+')';
      ctx.beginPath();ctx.arc(sx+ts*0.3,sy+ts*0.6,ts*0.14,Math.PI,0);ctx.fill();
      ctx.fillStyle='rgba(50,160,70,'+(pulse*0.8).toFixed(2)+')';
      ctx.beginPath();ctx.arc(sx+ts*0.7,sy+ts*0.4,ts*0.11,Math.PI,0);ctx.fill();
      // Stems
      ctx.fillStyle='rgba(80,100,60,0.5)';
      ctx.fillRect(sx+ts*0.27,sy+ts*0.6,ts*0.06,ts*0.2);
      ctx.fillRect(sx+ts*0.67,sy+ts*0.4,ts*0.05,ts*0.18);
      // Spore particles
      ctx.fillStyle='rgba(120,255,80,'+(0.15+Math.sin(this.animTimer*2+tx)*0.1).toFixed(2)+')';
      ctx.beginPath();ctx.arc(sx+ts*0.2,sy+ts*0.3+Math.sin(this.animTimer+tx)*ts*0.05,ts*0.03,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(sx+ts*0.8,sy+ts*0.2+Math.sin(this.animTimer*1.3+ty)*ts*0.04,ts*0.02,0,Math.PI*2);ctx.fill();
    } else if(tile===T.LOOT){
      // Floor underneath
      var fp2=this.dungeon.biome.floorPal;var fh2=((tx*137+ty*269)&0xffff);
      ctx.fillStyle=shadeHex(fp2.base,((fh2%11)-5)*2);ctx.fillRect(sx,sy,ts,ts);
      ctx.strokeStyle='rgba(0,0,0,0.1)';ctx.lineWidth=Math.max(0.5,ts/40);ctx.strokeRect(sx+0.5,sy+0.5,ts-1,ts-1);
      if(visible){
        var lootData=this.dungeon.loot[tx+','+ty];
        var lc=lootData?lootData.color:'#ffcc44';
        var isWpn=lootData&&lootData.type==='weapon';
        var bob2=Math.sin(this.animTimer*3+tx+ty)*ts*0.04;
        var m2=ts/16;
        // Glow circle on ground
        ctx.fillStyle='rgba('+parseInt(lc.slice(1,3),16)+','+parseInt(lc.slice(3,5),16)+','+parseInt(lc.slice(5,7),16)+',0.15)';
        ctx.beginPath();ctx.arc(sx+ts/2,sy+ts/2,ts*0.45,0,Math.PI*2);ctx.fill();
        if(isWpn){
          // Sword or wand icon
          if(lootData.range>1){
            // Wand: orb + stick with outline
            ctx.fillStyle='#111';ctx.fillRect(sx+6.5*m2,sy+(4.5+bob2)*m2,3*m2,9*m2);
            ctx.fillStyle='#886644';ctx.fillRect(sx+7*m2,sy+(5+bob2)*m2,2*m2,8*m2);
            ctx.fillStyle='#111';ctx.beginPath();ctx.arc(sx+8*m2,sy+(4+bob2)*m2,3*m2,0,Math.PI*2);ctx.fill();
            ctx.fillStyle=lc;ctx.beginPath();ctx.arc(sx+8*m2,sy+(4+bob2)*m2,2.5*m2,0,Math.PI*2);ctx.fill();
          } else {
            // Sword: blade + hilt with dark outline for visibility
            ctx.fillStyle='#111';ctx.fillRect(sx+6.5*m2,sy+(1.5+bob2)*m2,3*m2,9*m2); // blade outline
            ctx.fillStyle=lc;ctx.fillRect(sx+7*m2,sy+(2+bob2)*m2,2*m2,8*m2);
            ctx.fillStyle='#111';ctx.fillRect(sx+5*m2,sy+(8.5+bob2)*m2,6*m2,3*m2); // guard outline
            ctx.fillStyle='#886633';ctx.fillRect(sx+5.5*m2,sy+(9+bob2)*m2,5*m2,2*m2);
            ctx.fillStyle='#111';ctx.fillRect(sx+7*m2,sy+(10+bob2)*m2,2*m2,4*m2); // grip outline
            ctx.fillStyle='#554422';ctx.fillRect(sx+7.5*m2,sy+(10.5+bob2)*m2,1*m2,3*m2);
          }
        } else {
          // Armor: shield shape
          ctx.fillStyle=lc;
          ctx.beginPath();ctx.moveTo(sx+ts*0.3,sy+(ts*0.2+bob2));ctx.lineTo(sx+ts*0.7,sy+(ts*0.2+bob2));
          ctx.lineTo(sx+ts*0.7,sy+(ts*0.55+bob2));ctx.lineTo(sx+ts*0.5,sy+(ts*0.8+bob2));
          ctx.lineTo(sx+ts*0.3,sy+(ts*0.55+bob2));ctx.closePath();ctx.fill();
          ctx.fillStyle=shadeHex(lc,30);
          ctx.beginPath();ctx.moveTo(sx+ts*0.38,sy+(ts*0.28+bob2));ctx.lineTo(sx+ts*0.62,sy+(ts*0.28+bob2));
          ctx.lineTo(sx+ts*0.62,sy+(ts*0.48+bob2));ctx.lineTo(sx+ts*0.5,sy+(ts*0.65+bob2));
          ctx.lineTo(sx+ts*0.38,sy+(ts*0.48+bob2));ctx.closePath();ctx.fill();
        }
        // Floating name label above
        if(lootData){
          ctx.fillStyle=lc;ctx.font='bold '+Math.max(9,Math.round(ts*0.28))+'px Segoe UI';ctx.textAlign='center';
          ctx.fillText(lootData.name,sx+ts/2,sy-4+bob2);
        }
        this.pipeline.addLight(sx+ts/2,sy+ts/2,{color:lc,radius:ts*1.8,intensity:0.25,flicker:0.06});
      }
    }

    if(visible){
      ctx.globalAlpha=1;
      var m=ts/16;
      if(tile===T.STAIRS){
        // Dark trapdoor opening with golden glow from below
        // Outer stone frame
        ctx.fillStyle='#44382a';ctx.fillRect(sx+1*m,sy+1*m,14*m,14*m);
        ctx.fillStyle='#332820';ctx.fillRect(sx+2*m,sy+2*m,12*m,12*m);
        // Dark pit
        ctx.fillStyle='#080404';ctx.fillRect(sx+3*m,sy+3*m,10*m,10*m);
        // Warm glow from the depths
        var stPulse=0.5+Math.sin(this.animTimer*2)*0.2;
        ctx.fillStyle='rgba(255,180,50,'+(0.15*stPulse).toFixed(3)+')';
        ctx.fillRect(sx+4*m,sy+4*m,8*m,8*m);
        ctx.fillStyle='rgba(255,200,80,'+(0.1*stPulse).toFixed(3)+')';
        ctx.fillRect(sx+5*m,sy+5*m,6*m,6*m);
        // Steps visible inside (two small ledges)
        ctx.fillStyle='#3a2e20';
        ctx.fillRect(sx+3*m,sy+5*m,3*m,1.5*m);
        ctx.fillRect(sx+4*m,sy+8*m,2.5*m,1.5*m);
        // Corner rivets
        ctx.fillStyle='#665530';
        ctx.fillRect(sx+1.5*m,sy+1.5*m,1.5*m,1.5*m);
        ctx.fillRect(sx+13*m,sy+1.5*m,1.5*m,1.5*m);
        ctx.fillRect(sx+1.5*m,sy+13*m,1.5*m,1.5*m);
        ctx.fillRect(sx+13*m,sy+13*m,1.5*m,1.5*m);
        this.pipeline.addLight(sx+ts/2,sy+ts/2,{color:'#ffaa44',radius:ts*2.5,intensity:0.4,flicker:0.08});
      }
      if(tile===T.STAIRS_UP){
        // Upward stairs — blue-white glow from above
        ctx.fillStyle='#44382a';ctx.fillRect(sx+1*m,sy+1*m,14*m,14*m);
        ctx.fillStyle='#332820';ctx.fillRect(sx+2*m,sy+2*m,12*m,12*m);
        ctx.fillStyle='#181820';ctx.fillRect(sx+3*m,sy+3*m,10*m,10*m);
        var upPulse=0.5+Math.sin(this.animTimer*1.5)*0.2;
        ctx.fillStyle='rgba(150,180,255,'+(0.15*upPulse).toFixed(3)+')';
        ctx.fillRect(sx+4*m,sy+4*m,8*m,8*m);
        ctx.fillStyle='rgba(200,220,255,'+(0.1*upPulse).toFixed(3)+')';
        ctx.fillRect(sx+5*m,sy+5*m,6*m,6*m);
        // Steps going up
        ctx.fillStyle='#3a2e20';
        ctx.fillRect(sx+10*m,sy+5*m,3*m,1.5*m);
        ctx.fillRect(sx+11*m,sy+8*m,2.5*m,1.5*m);
        this.pipeline.addLight(sx+ts/2,sy+ts/2,{color:'#8899cc',radius:ts*2.5,intensity:0.4,flicker:0.05});
      }
      if(tile===T.SHRINE){
        // Draw shrine: purple crystal
        var pulse=0.7+Math.sin(this.animTimer*3)*0.3;
        ctx.fillStyle='#6622cc';ctx.fillRect(sx+5*m,sy+3*m,6*m,10*m);
        ctx.fillStyle='rgba(170,68,255,'+pulse.toFixed(2)+')';
        ctx.fillRect(sx+6*m,sy+2*m,4*m,8*m);
        ctx.fillStyle='#ddaaff';ctx.fillRect(sx+7*m,sy+4*m,2*m,3*m);
        this.pipeline.addLight(sx+ts/2,sy+ts/2,{color:'#aa44ff',radius:ts*3,intensity:0.5,flicker:0.1});
      }
      if(tile===T.REST){
        // Draw campfire: flickering orange/red
        var flick=Math.sin(this.animTimer*8)*ts*0.03;
        ctx.fillStyle='#664422';ctx.fillRect(sx+4*m,sy+11*m,8*m,3*m); // logs
        ctx.fillStyle='#553311';ctx.fillRect(sx+3*m,sy+12*m,10*m,2*m);
        ctx.fillStyle='#ff6622';ctx.fillRect(sx+5*m,sy+(5+flick)*m,6*m,6*m); // fire
        ctx.fillStyle='#ffaa44';ctx.fillRect(sx+6*m,sy+(4+flick)*m,4*m,5*m);
        ctx.fillStyle='#ffdd88';ctx.fillRect(sx+7*m,sy+(3+flick)*m,2*m,4*m);
        this.pipeline.addLight(sx+ts/2,sy+ts/2,{color:'#ff8844',radius:ts*2.5,intensity:0.4,flicker:0.15});
      }
      var eff=this.dungeon.effects[ty][tx];
      if(eff&&eff.turnsLeft>0){ctx.globalAlpha=0.4+Math.sin(this.animTimer*4)*0.2;ctx.fillStyle=eff.color;ctx.fillRect(sx+2,sy+2,ts-4,ts-4);ctx.globalAlpha=1;}
    }
  }}
  ctx.globalAlpha=1;
};

// Darken/lighten a hex color
