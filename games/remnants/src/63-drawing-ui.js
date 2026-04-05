Game.prototype.drawHUD=function(ctx){
  var w=CONFIG.WIDTH,h=CONFIG.HEIGHT,p=this.player;
  var fs=Math.max(12,Math.min(16,Math.round(w*0.012))),pad=10;

  // Floor level badge — dungeon only
  if (p.mode === 'dungeon' && this.dungeon) {
    var floorText='FLOOR '+p.floor;
    var biomeName=this.dungeon.biome.name;
    var biomeAccent=this.dungeon.biome.accent;
    var badgeW=Math.max(120,80);
    ctx.font='bold '+Math.round(fs*1.3)+'px Segoe UI';ctx.textAlign='center';
    badgeW=Math.max(badgeW,(ctx.measureText(floorText).width||100)+40);
    var badgeX=(w-badgeW)/2, badgeY=4;
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(badgeX,badgeY,badgeW,Math.round(fs*2.8));
    ctx.strokeStyle=biomeAccent;ctx.lineWidth=1;ctx.strokeRect(badgeX,badgeY,badgeW,Math.round(fs*2.8));
    ctx.fillStyle='#fff';ctx.fillText(floorText,w/2,badgeY+fs*1.2);
    ctx.fillStyle=biomeAccent;ctx.font=Math.round(fs*0.7)+'px Segoe UI';
    ctx.fillText(biomeName,w/2,badgeY+fs*2.2);
  }

  // Stats panel — top left
  ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,Math.min(220,w*0.25),55);
  ctx.fillStyle='#aaa';ctx.font=fs+'px Segoe UI';ctx.textAlign='left';
  ctx.fillText('ATK:'+p.atk+(p.shieldTurns>0?' DEF:'+p.shieldAmount:''),pad,pad+fs);
  var barX=pad,barY=pad+fs+4,barW=Math.min(190,w*0.22),barH=14,hpR=p.hp/p.maxHp;
  ctx.fillStyle='#222';ctx.fillRect(barX,barY,barW,barH);
  ctx.fillStyle=hpR>0.5?'#44dd44':hpR>0.25?'#ddcc00':'#dd3333';
  ctx.fillRect(barX,barY,barW*hpR,barH);
  ctx.fillStyle='#fff';ctx.font='bold '+Math.round(fs*0.8)+'px Segoe UI';ctx.fillText(p.hp+'/'+p.maxHp,barX+4,barY+barH-3);
  ctx.fillStyle='#666';ctx.font=Math.round(fs*0.7)+'px Segoe UI';
  ctx.fillText('Kills:'+p.kills,pad,barY+barH+Math.round(fs*0.9));
  // Controls hint
  ctx.fillStyle='#555';ctx.fillText('[E] Act  [I] Inv  [C] Craft  [B] Build  [P] Pot  [H] Help',pad,barY+barH+Math.round(fs*1.9));

  // Equipment + potions display — top right
  var eqW=Math.min(180,w*0.2);
  var eqX=w-eqW-pad,eqY=4;
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(eqX,eqY,eqW,fs*4.2);
  var ety=eqY+fs*0.9;
  ctx.fillStyle='#aaa';ctx.font=Math.round(fs*0.7)+'px Segoe UI';ctx.textAlign='left';
  ctx.fillText(p.weapon?p.weapon.name:'Unarmed',eqX+5,ety);ety+=fs*1.1;
  ctx.fillStyle='#88aacc';
  ctx.fillText(p.armor?p.armor.name:'No Armor',eqX+5,ety);ety+=fs*1.1;
  // Show what [P] will consume next
  var _nextHeal = null;
  var _healList = [
    {id:'health_potion',name:'Health Pot',color:'#ff4488'},
    {id:'feast',name:'Feast',color:'#ffcc44'},
    {id:'healing_salve',name:'Salve',color:'#44dd88'},
    {id:'sushi',name:'Sushi',color:'#f0e8c8'},
    {id:'berry_pie',name:'Berry Pie',color:'#aa44aa'},
    {id:'fish_stew',name:'Fish Stew',color:'#cc6633'},
    {id:'veggie_stew',name:'Veggie Stew',color:'#88aa44'},
    {id:'mushroom_soup',name:'Mush Soup',color:'#887744'},
    {id:'roast_meat',name:'Roast Meat',color:'#cc6633'},
    {id:'bread',name:'Bread',color:'#ddaa55'},
    {id:'dried_fish',name:'Dried Fish',color:'#aa8855'},
    {id:'carrot',name:'Carrot',color:'#ee8833'},
    {id:'wild_berry',name:'Berry',color:'#8833aa'},
  ];
  if (p.potions > 0) { _nextHeal = {name:'Potion ('+p.potions+')',color:'#ff44aa'}; }
  else { for (var hi=0;hi<_healList.length;hi++) { if (p.bag[_healList[hi].id]>0) { _nextHeal=_healList[hi]; break; } } }
  ctx.fillStyle=_nextHeal?_nextHeal.color:'#553344';
  ctx.fillText(_nextHeal?'[P] '+_nextHeal.name:'[P] No food',eqX+5,ety);
  ctx.textAlign='left';

  var abY=h-75;ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,abY-5,Math.min(400,w*0.45),80);
  for(var i=0;i<4;i++){
    var ab=p.abilities[i],abx=pad+i*(Math.min(90,w*0.1)+4),abw=Math.min(90,w*0.1),abh=52;
    if(ab){var onCD=ab.currentCooldown>0,sel=this.abilityTargetMode&&this.selectedAbility===i;
      ctx.fillStyle=sel?'rgba(255,255,255,0.2)':onCD?'rgba(50,50,50,0.8)':'rgba(30,30,50,0.8)';ctx.fillRect(abx,abY,abw,abh);
      ctx.strokeStyle=sel?'#fff':onCD?'#444':ab.color;ctx.lineWidth=sel?2:1;ctx.strokeRect(abx,abY,abw,abh);
      ctx.fillStyle=onCD?'#666':ab.color;ctx.font='bold '+Math.round(fs*0.7)+'px Segoe UI';ctx.textAlign='center';
      ctx.fillText('['+( i+1)+']',abx+abw/2,abY+12);ctx.font=Math.round(fs*0.6)+'px Segoe UI';
      var words=ab.name.split(' ');if(words.length>1&&ab.name.length>10){ctx.fillText(words[0],abx+abw/2,abY+25);ctx.fillText(words.slice(1).join(' '),abx+abw/2,abY+36);}else{ctx.fillText(ab.name,abx+abw/2,abY+30);}
      if(onCD){ctx.fillStyle='#ff6644';ctx.font='bold '+Math.round(fs*0.8)+'px Segoe UI';ctx.fillText(ab.currentCooldown+'t',abx+abw/2,abY+abh-4);}
    } else {ctx.fillStyle='rgba(20,20,30,0.5)';ctx.fillRect(abx,abY,abw,abh);ctx.strokeStyle='#333';ctx.lineWidth=1;ctx.strokeRect(abx,abY,abw,abh);ctx.fillStyle='#444';ctx.font=fs*0.8+'px Segoe UI';ctx.textAlign='center';ctx.fillText('['+(i+1)+']',abx+abw/2,abY+28);}
  }

  var logX=w-Math.min(350,w*0.4)-pad,logY=h-10;ctx.textAlign='left';
  for(var i=this.log.length-1;i>=0;i--){var entry=this.log[i];ctx.globalAlpha=0.5+(i/this.log.length)*0.5;ctx.fillStyle=entry.color;ctx.font=Math.round(fs*0.8)+'px Segoe UI';ctx.fillText(entry.text,logX,logY-(this.log.length-1-i)*(fs+2));}
  ctx.globalAlpha=1;
  if(this.abilityTargetMode){ctx.fillStyle='#ffcc44';ctx.font='bold '+fs+'px Segoe UI';ctx.textAlign='center';ctx.fillText('Arrow/WASD to aim, ESC cancel',w/2,pad+fs);}
};

Game.prototype.drawMinimap=function(ctx){
  if(!this.dungeon) return; // no minimap in overworld mode
  var w=CONFIG.WIDTH,h=CONFIG.HEIGHT,sz=Math.min(200,w*0.25,h*0.3);
  var mx=w-sz-10,my=10,cw=sz/CONFIG.MAP_W,ch=sz/CONFIG.MAP_H;
  ctx.fillStyle='rgba(0,0,0,0.85)';ctx.fillRect(mx-2,my-2,sz+4,sz+4);
  for(var y=0;y<CONFIG.MAP_H;y++)for(var x=0;x<CONFIG.MAP_W;x++){
    if(!this.dungeon.revealed[y][x])continue;var tile=this.dungeon.map[y][x];if(tile===T.VOID)continue;
    if(tile===T.WALL)ctx.fillStyle='#333';
    else if(tile===T.WATER)ctx.fillStyle='#224488';
    else if(tile===T.LAVA)ctx.fillStyle='#882200';
    else if(tile===T.FUNGAL)ctx.fillStyle='#226622';
    else if(tile===T.STAIRS)ctx.fillStyle='#ffcc44';
    else if(tile===T.STAIRS_UP)ctx.fillStyle='#44aaff';
    else if(tile===T.LOOT)ctx.fillStyle='#ddaa44';
    else if(tile===T.SHRINE)ctx.fillStyle='#aa44ff';
    else if(tile===T.REST)ctx.fillStyle='#44ff88';
    else ctx.fillStyle='#555';
    ctx.fillRect(mx+x*cw,my+y*ch,Math.ceil(cw),Math.ceil(ch));
  }
  for(var i=0;i<this.enemies.length;i++){var e=this.enemies[i];if(!e.alive||!this.dungeon.revealed[e.y][e.x])continue;ctx.fillStyle=e.isBoss?'#ff0000':'#ff4444';ctx.fillRect(mx+e.x*cw-1,my+e.y*ch-1,3,3);}
  ctx.fillStyle='#44aaff';ctx.fillRect(mx+this.player.x*cw-2,my+this.player.y*ch-2,4,4);

  // Inventory below minimap
  var fs2=Math.max(10,Math.round(w*0.01));
  var iy=my+sz+8;
  var iw=sz+4;
  ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(mx-2,iy,iw,fs2*8.5);
  ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;ctx.strokeRect(mx-2,iy,iw,fs2*8.5);
  var ity=iy+fs2*1.2;
  ctx.fillStyle='#aaa';ctx.font='bold '+fs2+'px Segoe UI';ctx.textAlign='left';
  ctx.fillText('EQUIPMENT',mx+2,ity);ity+=fs2*1.5;
  // Weapon
  ctx.fillStyle='#776';ctx.font=fs2+'px Segoe UI';ctx.fillText('Weapon:',mx+2,ity);ity+=fs2*1.2;
  var p=this.player;
  ctx.fillStyle=p.weapon?'#ddaa44':'#555';ctx.font='bold '+fs2+'px Segoe UI';
  ctx.fillText(p.weapon?p.weapon.name:'Unarmed',mx+6,ity);ity+=fs2*1.5;
  // Armor
  ctx.fillStyle='#776';ctx.font=fs2+'px Segoe UI';ctx.fillText('Armor:',mx+2,ity);ity+=fs2*1.2;
  ctx.fillStyle=p.armor?'#88aacc':'#555';ctx.font='bold '+fs2+'px Segoe UI';
  ctx.fillText(p.armor?p.armor.name:'None',mx+6,ity);ity+=fs2*1.5;
  // Potions
  ctx.fillStyle=p.potions>0?'#ff44aa':'#553344';ctx.font='bold '+fs2+'px Segoe UI';
  ctx.fillText('Potions: '+p.potions,mx+2,ity);
};

Game.prototype.drawShrineOverlay=function(ctx){
  var w=CONFIG.WIDTH,h=CONFIG.HEIGHT,fs=Math.max(13,Math.round(w*0.013));
  // Dark overlay with purple tint
  ctx.fillStyle='rgba(10,5,20,0.85)';ctx.fillRect(0,0,w,h);
  // Glow behind title
  var grd=ctx.createRadialGradient(w/2,h*0.12,0,w/2,h*0.12,w*0.25);
  grd.addColorStop(0,'rgba(120,50,200,0.15)');grd.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=grd;ctx.fillRect(0,0,w,h*0.25);
  // Title
  ctx.fillStyle='#cc66ff';ctx.font='bold '+Math.round(fs*2)+'px Segoe UI';ctx.textAlign='center';
  ctx.fillText('SHRINE OF POWER',w/2,h*0.12);
  ctx.fillStyle='#998';ctx.font=Math.round(fs*0.9)+'px Segoe UI';
  ctx.fillText('Choose an ability (1-3) or ESC to leave',w/2,h*0.18);
  if(!this.shrineChoices)return;
  // Cards — calculate height from content using accumulated Y
  var cardW=Math.min(w*0.26,240);
  var gap=Math.min(w*0.03,30);
  var totalW=cardW*3+gap*2;
  var startX=(w-totalW)/2;
  var cardY=h*0.24;
  // Pre-calculate card height: badge + name + divider + element + shape + dmg/cd blocks + desc + accent + padding
  // Card height: badge row + icon + element label + dmg/cd + desc + padding
  var iconS=Math.min(Math.min(w*0.26,240)*0.4,fs*4);
  var cardH=Math.round(fs*1.3+fs*0.6+iconS+fs*0.6+fs*1.3+fs*1.8+fs*0.8+fs*1.0+fs*1.5);

  for(var i=0;i<3;i++){
    var ab=this.shrineChoices[i];
    var cx=startX+i*(cardW+gap), cy=cardY;
    // Card background with glow
    var pulse=0.6+Math.sin(this.animTimer*2+i*2)*0.2;
    ctx.shadowColor=ab.color;ctx.shadowBlur=15*pulse;
    ctx.fillStyle='rgba(15,10,30,0.95)';
    ctx.fillRect(cx,cy,cardW,cardH);
    ctx.shadowBlur=0;
    ctx.strokeStyle=ab.color;ctx.lineWidth=2;
    ctx.strokeRect(cx+1,cy+1,cardW-2,cardH-2);
    // Card content — accumulated ty, every item advances it
    var pad=fs*0.6;
    var ty=cy+pad;
    var ccx=cx+cardW/2; // card center x
    // Number badge — small, top-left corner
    var badgeS=Math.round(fs*1.3);
    ctx.fillStyle=ab.color;ctx.fillRect(cx+pad,ty,badgeS,badgeS);
    ctx.fillStyle='#000';ctx.font='bold '+fs+'px Segoe UI';ctx.textAlign='center';
    ctx.fillText(i+1,cx+pad+badgeS/2,ty+fs*0.9);
    // Name — right of badge, same row
    ctx.fillStyle='#fff';ctx.font='bold '+Math.round(fs*1.05)+'px Segoe UI';ctx.textAlign='left';
    ctx.fillText(ab.name,cx+pad+badgeS+pad,ty+fs*0.9);
    ty+=badgeS+pad;

    // Ability icon — drawn in a square area
    var iconS=Math.min(cardW*0.4,fs*4);
    var iconX=ccx-iconS/2, iconY=ty;
    ctx.fillStyle='rgba(255,255,255,0.04)';ctx.fillRect(iconX,iconY,iconS,iconS);
    // Draw icon based on element + shape
    var ic=iconX+iconS/2, iy=iconY+iconS/2, ir=iconS*0.35;
    ctx.globalAlpha=0.8;
    if(ab.shape==='single'){
      // Single target: crosshair
      ctx.strokeStyle=ab.color;ctx.lineWidth=Math.max(1.5,fs/8);
      ctx.beginPath();ctx.arc(ic,iy,ir,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(ic-ir*1.3,iy);ctx.lineTo(ic+ir*1.3,iy);ctx.stroke();
      ctx.beginPath();ctx.moveTo(ic,iy-ir*1.3);ctx.lineTo(ic,iy+ir*1.3);ctx.stroke();
    } else if(ab.shape==='line'){
      // Line: arrow pointing right
      ctx.fillStyle=ab.color;
      ctx.fillRect(ic-ir,iy-ir*0.2,ir*2,ir*0.4);
      ctx.beginPath();ctx.moveTo(ic+ir,iy-ir*0.5);ctx.lineTo(ic+ir*1.4,iy);ctx.lineTo(ic+ir,iy+ir*0.5);ctx.fill();
      // Trail dots
      ctx.globalAlpha=0.3;
      ctx.beginPath();ctx.arc(ic-ir*1.2,iy,ir*0.15,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(ic-ir*1.5,iy,ir*0.1,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=0.8;
    } else if(ab.shape==='cone'){
      // Cone: fan shape
      ctx.fillStyle=ab.color;
      ctx.beginPath();ctx.moveTo(ic-ir,iy);ctx.lineTo(ic+ir,iy-ir*0.8);ctx.lineTo(ic+ir,iy+ir*0.8);ctx.closePath();ctx.fill();
    } else if(ab.shape==='ring'){
      // Ring: expanding circle
      ctx.strokeStyle=ab.color;ctx.lineWidth=Math.max(2,fs/6);
      ctx.beginPath();ctx.arc(ic,iy,ir*0.5,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=0.4;ctx.beginPath();ctx.arc(ic,iy,ir,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=0.8;
    } else if(ab.shape==='area'){
      // Area: filled square zone
      ctx.fillStyle=ab.color;ctx.globalAlpha=0.3;
      ctx.fillRect(ic-ir,iy-ir,ir*2,ir*2);
      ctx.globalAlpha=0.8;ctx.strokeStyle=ab.color;ctx.lineWidth=Math.max(1,fs/10);
      ctx.strokeRect(ic-ir,iy-ir,ir*2,ir*2);
    } else if(ab.shape==='self'){
      // Self: shield/aura around center dot
      ctx.fillStyle=ab.color;
      ctx.beginPath();ctx.arc(ic,iy,ir*0.3,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=ab.color;ctx.lineWidth=Math.max(1.5,fs/7);
      ctx.beginPath();ctx.arc(ic,iy,ir*0.7,Math.PI*0.8,Math.PI*2.2);ctx.stroke();
      ctx.beginPath();ctx.arc(ic,iy,ir*0.7,Math.PI*0.3,Math.PI*0.7);ctx.stroke();
    }
    // Element particles around icon
    ctx.fillStyle=ab.color;ctx.globalAlpha=0.5;
    for(var pi=0;pi<4;pi++){
      var pa=pi*Math.PI/2+this.animTimer*1.5;
      var ppx=ic+Math.cos(pa)*ir*1.1, ppy=iy+Math.sin(pa)*ir*1.1;
      ctx.beginPath();ctx.arc(ppx,ppy,Math.max(1,fs*0.12),0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
    ty+=iconS+pad;

    // Element / shape label
    ctx.fillStyle='#aaa';ctx.font=Math.round(fs*0.8)+'px Segoe UI';ctx.textAlign='center';
    ctx.fillText(ab.element.toUpperCase()+' / '+ab.shape,ccx,ty);
    ty+=fs*1.3;

    // DMG and CD inline
    var bw2=cardW*0.38, blockH=fs*2.2;
    ctx.fillStyle='rgba(255,100,50,0.15)';ctx.fillRect(cx+cardW*0.06,ty,bw2,blockH);
    ctx.fillStyle='#ff8855';ctx.font='bold '+Math.round(fs*0.7)+'px Segoe UI';
    ctx.fillText('DMG',cx+cardW*0.06+bw2/2,ty+fs*0.7);
    ctx.fillStyle='#fff';ctx.font='bold '+Math.round(fs*0.95)+'px Segoe UI';
    ctx.fillText(ab.damage,cx+cardW*0.06+bw2/2,ty+fs*1.7);
    ctx.fillStyle='rgba(80,150,255,0.15)';ctx.fillRect(cx+cardW*0.56,ty,bw2,blockH);
    ctx.fillStyle='#6699ff';ctx.font='bold '+Math.round(fs*0.7)+'px Segoe UI';
    ctx.fillText('CD',cx+cardW*0.56+bw2/2,ty+fs*0.7);
    ctx.fillStyle='#fff';ctx.font='bold '+Math.round(fs*0.95)+'px Segoe UI';
    ctx.fillText(ab.cooldown,cx+cardW*0.56+bw2/2,ty+fs*1.7);
    ty+=blockH+fs*0.8;

    // Description
    var desc=ab.verb==='strike'?'Direct attack':ab.verb==='launch'?'Ranged projectile':ab.verb==='place'?'Lingering zone':ab.verb==='dash'?'Dash + damage':ab.verb==='shield'?'Defense buff':'Drain life';
    ctx.fillStyle='#778';ctx.font=Math.round(fs*0.75)+'px Segoe UI';ctx.textAlign='center';
    ctx.fillText(desc,ccx,ty);

    // Bottom accent bar
    ctx.fillStyle=ab.color;
    ctx.fillRect(cx+8,cy+cardH-6,cardW-16,3);
  }
};

Game.prototype.drawReplaceOverlay=function(ctx){
  var w=CONFIG.WIDTH,h=CONFIG.HEIGHT,fs=Math.max(13,Math.round(w*0.013));
  ctx.fillStyle='rgba(10,8,5,0.88)';ctx.fillRect(0,0,w,h);
  // Glow
  var grd=ctx.createRadialGradient(w/2,h*0.12,0,w/2,h*0.12,w*0.2);
  grd.addColorStop(0,'rgba(200,150,40,0.1)');grd.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=grd;ctx.fillRect(0,0,w,h*0.25);
  ctx.fillStyle='#ffcc44';ctx.font='bold '+Math.round(fs*1.8)+'px Segoe UI';ctx.textAlign='center';
  ctx.fillText('REPLACE ABILITY',w/2,h*0.1);
  // New ability card at top
  if(this._pendingAbility){
    var ab=this._pendingAbility;
    var nw=Math.min(w*0.5,350),nh=Math.round(fs*4.5);
    var nx=(w-nw)/2,ny=h*0.14;
    ctx.fillStyle='rgba(20,15,10,0.9)';ctx.fillRect(nx,ny,nw,nh);
    ctx.shadowColor=ab.color;ctx.shadowBlur=10;
    ctx.strokeStyle=ab.color;ctx.lineWidth=2;ctx.strokeRect(nx,ny,nw,nh);
    ctx.shadowBlur=0;
    ctx.fillStyle='#ccc';ctx.font=Math.round(fs*0.85)+'px Segoe UI';ctx.fillText('NEW ABILITY',w/2,ny+fs*1.0);
    ctx.fillStyle=ab.color;ctx.font='bold '+Math.round(fs*1.1)+'px Segoe UI';ctx.fillText(ab.name,w/2,ny+fs*2.2);
    ctx.fillStyle='#aaa';ctx.font=Math.round(fs*0.8)+'px Segoe UI';
    ctx.fillText(ab.element+' \u2022 '+ab.shape+'  DMG:'+ab.damage+'  CD:'+ab.cooldown,w/2,ny+fs*3.4);
  }
  ctx.fillStyle='#887';ctx.font=Math.round(fs*0.9)+'px Segoe UI';
  ctx.fillText('Press 1-4 to replace, ESC to keep current',w/2,h*0.37);
  // Current ability cards — vertical list for reliable layout
  var cardW=Math.min(w*0.55,420),cardH=Math.round(fs*3.5);
  var startY=h*0.41;
  for(var i=0;i<this.player.abilities.length;i++){
    var ab=this.player.abilities[i];
    var cx=(w-cardW)/2,cy=startY+i*(cardH+8);
    ctx.fillStyle='rgba(20,15,30,0.9)';ctx.fillRect(cx,cy,cardW,cardH);
    ctx.strokeStyle=ab.color;ctx.lineWidth=1;ctx.strokeRect(cx,cy,cardW,cardH);
    // Number badge
    ctx.fillStyle=ab.color;ctx.fillRect(cx+6,cy+6,Math.round(fs*1.6),cardH-12);
    ctx.fillStyle='#000';ctx.font='bold '+Math.round(fs*1.0)+'px Segoe UI';ctx.textAlign='center';
    ctx.fillText(i+1,cx+6+Math.round(fs*0.8),cy+cardH/2+fs*0.35);
    // Name
    ctx.fillStyle='#fff';ctx.font='bold '+fs+'px Segoe UI';ctx.textAlign='left';
    ctx.fillText(ab.name,cx+Math.round(fs*2.2),cy+fs*1.3);
    // Stats on right side
    ctx.fillStyle='#999';ctx.font=Math.round(fs*0.8)+'px Segoe UI';ctx.textAlign='right';
    ctx.fillText(ab.element+' \u2022 '+ab.shape,cx+cardW-10,cy+fs*1.0);
    ctx.fillText('DMG:'+ab.damage+'  CD:'+ab.cooldown,cx+cardW-10,cy+fs*2.2);
    ctx.textAlign='center';
  }
};

Game.prototype.drawLootPrompt=function(ctx){
  var w=CONFIG.WIDTH,h=CONFIG.HEIGHT,fs=Math.max(14,Math.round(w*0.015));
  var loot=this._pendingLoot;if(!loot)return;
  ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,w,h);
  var boxW=Math.min(380,w*0.45),boxH=0;
  var bx=(w-boxW)/2;
  // Calculate height first using accumulated approach
  var lines=[];
  lines.push({text:'ITEM FOUND',font:'bold '+Math.round(fs*1.5)+'px Segoe UI',color:'#ffcc44',h:fs*2.0});
  lines.push({text:loot.name,font:'bold '+Math.round(fs*1.3)+'px Segoe UI',color:loot.color,h:fs*1.8});
  lines.push({text:loot.desc,font:Math.round(fs*0.9)+'px Segoe UI',color:'#aaa',h:fs*1.4});
  if(loot.type==='weapon') lines.push({text:'DMG: '+loot.damage+(loot.range>1?'  Range: '+loot.range:'  Melee')+'  CD: '+(loot.cd||0),font:Math.round(fs*0.85)+'px Segoe UI',color:'#ccc',h:fs*1.4});
  if(loot.type==='armor') lines.push({text:'Defense: +'+loot.defense,font:Math.round(fs*0.85)+'px Segoe UI',color:'#ccc',h:fs*1.4});
  // Current equipment comparison with stats
  lines.push({h:fs*0.4}); // spacer
  var current=loot.type==='weapon'?this.player.weapon:this.player.armor;
  if(current){
    lines.push({text:'Currently equipped:',font:Math.round(fs*0.8)+'px Segoe UI',color:'#777',h:fs*1.2});
    lines.push({text:current.name,font:'bold '+Math.round(fs*0.95)+'px Segoe UI',color:'#aaa',h:fs*1.3});
    if(loot.type==='weapon'&&current.damage!=null){
      var diff=loot.damage-current.damage;
      var diffCol=diff>0?'#44ff44':diff<0?'#ff4444':'#888';
      lines.push({text:'DMG: '+current.damage+' \u2192 '+loot.damage+' ('+(diff>0?'+':'')+diff+')',font:Math.round(fs*0.85)+'px Segoe UI',color:diffCol,h:fs*1.3});
    }
    if(loot.type==='armor'&&current.defense!=null){
      var diff=loot.defense-current.defense;
      var diffCol=diff>0?'#44ff44':diff<0?'#ff4444':'#888';
      lines.push({text:'DEF: '+current.defense+' \u2192 '+loot.defense+' ('+(diff>0?'+':'')+diff+')',font:Math.round(fs*0.85)+'px Segoe UI',color:diffCol,h:fs*1.3});
    }
  } else {
    lines.push({text:'Nothing equipped',font:Math.round(fs*0.8)+'px Segoe UI',color:'#666',h:fs*1.3});
  }
  lines.push({h:fs*0.5}); // spacer
  lines.push({text:'[Y] Equip    [S] Stash    [N] Leave',font:'bold '+fs+'px Segoe UI',color:'#aab',h:fs*1.6});
  for(var i=0;i<lines.length;i++) boxH+=lines[i].h;
  boxH+=fs*2; // padding
  var by=(h-boxH)/2;
  // Draw box
  ctx.fillStyle='rgba(15,10,25,0.95)';ctx.fillRect(bx,by,boxW,boxH);
  ctx.strokeStyle=loot.color;ctx.lineWidth=2;ctx.strokeRect(bx,by,boxW,boxH);
  // Draw lines with accumulated Y
  var ty=by+fs*1.2;
  ctx.textAlign='center';
  for(var i=0;i<lines.length;i++){
    var line=lines[i];
    if(line.text){ctx.fillStyle=line.color;ctx.font=line.font;ctx.fillText(line.text,w/2,ty);}
    ty+=line.h;
  }
};

Game.prototype.drawDeathOverlay=function(ctx){
  var w=CONFIG.WIDTH,h=CONFIG.HEIGHT,fs=Math.max(14,Math.round(w*0.016));
  ctx.fillStyle='rgba(30,0,0,0.85)';ctx.fillRect(0,0,w,h);
  var grd=ctx.createRadialGradient(w/2,h*0.3,h*0.05,w/2,h*0.3,h*0.5);
  grd.addColorStop(0,'rgba(80,0,0,0.3)');grd.addColorStop(1,'rgba(0,0,0,0.4)');
  ctx.fillStyle=grd;ctx.fillRect(0,0,w,h);
  // Title
  ctx.fillStyle='#220000';ctx.font='bold '+Math.round(fs*2.8)+'px Segoe UI';ctx.textAlign='center';
  ctx.fillText('YOU DIED',w/2+3,h*0.15+3);
  ctx.fillStyle='#ff3333';
  ctx.fillText('YOU DIED',w/2,h*0.15);
  ctx.fillStyle='#884444';ctx.font=Math.round(fs*1.0)+'px Segoe UI';
  ctx.fillText('Everything is lost.',w/2,h*0.21);

  // What was lost — accumulated Y
  var boxW=Math.min(420,w*0.5),pad=fs*1.0;
  var lines=[];
  var p=this.player;
  var days=GameTime?GameTime.day():0;
  var residents=0,npcCount=0;
  if(NPCManager){npcCount=NPCManager.npcs.length;for(var i=0;i<NPCManager.npcs.length;i++)if(NPCManager.npcs[i].resident)residents++;}
  var resourceCount=Bag.count(p.bag);
  var resourceTypes=Bag.types(p.bag);
  var skillList=PlayerSkills.list(p.skills);
  var tileChanges=Overworld.tileChanges?Object.keys(Overworld.tileChanges).length:0;

  lines.push({text:'LOST FOREVER',color:'#cc6666',bold:true});
  lines.push({text:''});
  lines.push({text:(days+1)+' day'+(days!==0?'s':'')+' survived',color:'#ccaa88'});
  if(residents>0) lines.push({text:residents+' villager'+(residents>1?'s':'')+' left homeless',color:'#ddaa66'});
  if(npcCount>residents&&npcCount>0) lines.push({text:(npcCount-residents)+' traveller'+(npcCount-residents>1?'s':'')+' forgotten',color:'#aa9977'});
  lines.push({text:p.kills+' creature'+(p.kills!==1?'s':'')+' slain',color:'#cc8888'});
  if(p.floor>0) lines.push({text:'Reached dungeon floor '+p.floor,color:'#aaaacc'});
  if(resourceCount>0) lines.push({text:resourceCount+' resource'+(resourceCount!==1?'s':'')+' ('+resourceTypes+' type'+(resourceTypes!==1?'s':'')+') abandoned',color:'#88aa88'});
  if(skillList.length>0){
    lines.push({text:'Skills lost:',color:'#8888aa'});
    // Show skills in rows of 3 to fit the box
    for(var i=0;i<skillList.length;i+=3){
      var row='  ';
      for(var j=i;j<Math.min(i+3,skillList.length);j++){
        if(j>i) row+='   ';
        row+=skillList[j].id+' Lv.'+skillList[j].level;
      }
      lines.push({text:row,color:'#777799'});
    }
  }
  if(tileChanges>0) lines.push({text:tileChanges+' mark'+(tileChanges!==1?'s':'')+' on the world erased',color:'#888888'});
  if(p.weapon) lines.push({text:p.weapon.name+' rusts away',color:'#aa8866'});
  if(p.armor) lines.push({text:p.armor.name+' crumbles to dust',color:'#8888aa'});

  // Calculate box height from content
  var lineH=fs*1.5;
  var boxH=pad+lines.length*lineH+pad;
  var bx=(w-boxW)/2,by=h*0.25;
  ctx.fillStyle='rgba(20,5,5,0.7)';ctx.fillRect(bx,by,boxW,boxH);
  ctx.strokeStyle='rgba(255,50,50,0.2)';ctx.lineWidth=1;ctx.strokeRect(bx,by,boxW,boxH);

  // Draw lines with accumulated Y
  var ty=by+pad+fs*0.3;
  for(var i=0;i<lines.length;i++){
    var line=lines[i];
    if(!line.text){ty+=lineH*0.3;continue;}
    ctx.fillStyle=line.color||'#ccc';
    ctx.font=(line.bold?'bold ':'')+fs+'px Segoe UI';
    ctx.fillText(line.text,w/2,ty);
    ty+=lineH;
  }

  // Legacy stats — cumulative across all lives
  var legY = by + boxH + fs * 1.0;
  var meta = this.meta;
  var oTier = (typeof ObeliskManager !== 'undefined') ? ObeliskManager.tier : 0;
  var buildings = (typeof BuildingManager !== 'undefined') ? BuildingManager.buildings.length : 0;
  var cleared = 0;
  if (typeof DungeonSpawnManager !== 'undefined') { for (var ck in DungeonSpawnManager.cleared) cleared++; }

  ctx.fillStyle = '#8899cc';
  ctx.font = 'bold ' + Math.round(fs * 0.9) + 'px Segoe UI';
  ctx.fillText('YOUR LEGACY', w / 2, legY);
  legY += fs * 1.3;

  var legLines = [
    { label: 'Lives Lived', value: meta.totalRuns, color: '#aabbcc' },
    { label: 'Best Depth', value: 'Floor ' + meta.depthRecord, color: '#aaaacc' },
    { label: 'Total Kills', value: meta.totalKills, color: '#cc8888' },
    { label: 'Obelisk Tier', value: oTier + '/5', color: oTier >= 5 ? '#ffffff' : '#ddaa44' },
    { label: 'Dungeons Cleared', value: cleared + '/8', color: '#88cc88' },
  ];
  // Calculate available space
  var legAvail = h * 0.9 - legY;
  var legLH = Math.min(fs * 1.3, legAvail / (legLines.length + 1));
  ctx.font = Math.round(Math.min(fs * 0.85, legLH * 0.8)) + 'px Segoe UI';
  for (var li = 0; li < legLines.length; li++) {
    var ll = legLines[li];
    ctx.fillStyle = '#777';
    ctx.textAlign = 'right';
    ctx.fillText(ll.label + ':', w / 2 - fs * 0.5, legY);
    ctx.fillStyle = ll.color;
    ctx.textAlign = 'left';
    ctx.fillText('' + ll.value, w / 2 + fs * 0.5, legY);
    legY += legLH;
  }
  ctx.textAlign = 'center';

  // Continue prompt
  var promptY = h * 0.92;
  ctx.fillStyle='#776';ctx.font=Math.round(fs*0.9)+'px Segoe UI';
  var pulse=0.4+Math.sin(this.animTimer*2)*0.3;
  ctx.globalAlpha=pulse+0.3;
  ctx.fillText('Press any key to start over',w/2,promptY);
  ctx.globalAlpha=1;
};

Game.prototype.drawTitle=function(ctx){
  var w=CONFIG.WIDTH,h=CONFIG.HEIGHT,fs=Math.max(14,Math.round(w*0.015));
  var c=this.customization;
  ctx.fillStyle='#040410';ctx.fillRect(0,0,w,h);

  // Title
  ctx.fillStyle='#4466aa';ctx.font='bold '+Math.round(fs*2.8)+'px Segoe UI';ctx.textAlign='center';
  ctx.fillText('REMNANTS',w/2,h*0.1);
  ctx.fillStyle='#556';ctx.font=Math.round(fs*1)+'px Segoe UI';
  ctx.fillText('The world remembers',w/2,h*0.15);

  if(this.meta.depthRecord>0){
    ctx.fillStyle='#666';ctx.font=Math.round(fs*0.85)+'px Segoe UI';
    ctx.fillText('Best: Floor '+this.meta.depthRecord+'  Runs: '+this.meta.totalRuns+'  Kills: '+this.meta.totalKills,w/2,h*0.19);
  }

  // Character preview — draw large in center-left
  var previewSize=Math.min(160,w*0.18,h*0.25);
  var px=w*0.28-previewSize/2, py=h*0.32;
  // Background circle
  ctx.fillStyle='rgba(30,30,60,0.6)';
  ctx.beginPath();ctx.arc(px+previewSize/2,py+previewSize/2,previewSize*0.6,0,Math.PI*2);ctx.fill();
  // Draw character at preview size with selected weapon
  var pWalk=(this.animTimer*0.8)%1;
  var selWpn=this.START_WEAPONS[c.startWpnIdx];
  drawCharPixel(ctx, px, py, previewSize,
    this.BODY_COLORS[c.bodyColorIdx], this.EYE_COLORS[c.eyeIdx],
    this.SKIN_COLORS[c.skinIdx], selWpn.color, pWalk,
    {hairStyle:this.HAIR_STYLES[c.hairStyleIdx], hairColor:this.HAIR_COLORS[c.hairIdx],
     weaponType:selWpn.key, body:this.BODIES[c.bodyIdx], height:this.HEIGHTS[c.heightIdx], frame:this.FRAMES[c.frameIdx]});

  // Options panel — right side, accumulated Y
  var optX=w*0.5, valX=optX+w*0.1;
  var labels=['Outfit','Hair Color','Hair Style','Skin','Eyes','Body','Height','Frame','Weapon'];
  var numRows=labels.length;
  // Calculate row height to fit between top content and bottom prompts
  var topY=h*0.22;
  var botY=h*0.76; // where options must end, leaving room for prompts
  var weaponExtra=fs*1.0; // extra space for weapon desc
  var availH=botY-topY-weaponExtra;
  var rowH=Math.min(Math.round(fs*2.4),Math.floor(availH/numRows));
  var ty=topY;

  for(var i=0;i<numRows;i++){
    var selected=c.cursor===i;
    var thisRowH=(i===numRows-1)?rowH+weaponExtra:rowH; // weapon row taller for desc
    // Highlight
    if(selected){
      ctx.fillStyle='rgba(60,60,120,0.4)';
      ctx.fillRect(optX-w*0.15,ty,w*0.4,thisRowH);
      ctx.fillStyle='#aaccff';
    } else { ctx.fillStyle='#667'; }
    // Label
    ctx.font=(selected?'bold ':'')+fs+'px Segoe UI';ctx.textAlign='left';
    ctx.fillText(labels[i]+':',optX-w*0.14,ty+fs*1.1);
    // Value
    ctx.textAlign='center';
    if(i===2||i===5||i===6||i===7){
      // Text toggle options
      var txt;
      if(i===2) txt=this.HAIR_STYLES[c.hairStyleIdx];
      else if(i===5) txt=this.BODIES[c.bodyIdx];
      else if(i===6) txt=this.HEIGHTS[c.heightIdx];
      else txt=this.FRAMES[c.frameIdx];
      ctx.fillStyle=selected?'#fff':'#aaa';ctx.font=fs+'px Segoe UI';
      ctx.fillText(txt,valX,ty+fs*1.1);
    } else if(i===numRows-1){
      // Weapon: name on first line, desc on second
      var wpn=this.START_WEAPONS[c.startWpnIdx];
      ctx.fillStyle=wpn.color;ctx.font=(selected?'bold ':'')+fs+'px Segoe UI';
      ctx.fillText(wpn.name,valX,ty+fs*1.0);
      ctx.fillStyle='#888';ctx.font=Math.round(fs*0.75)+'px Segoe UI';
      ctx.fillText(wpn.desc,valX,ty+fs*2.2);
    } else {
      // Color swatch (rows 0=outfit, 1=hair color, 3=skin, 4=eyes)
      var sc=i===0?this.BODY_COLORS[c.bodyColorIdx]:i===1?this.HAIR_COLORS[c.hairIdx]:i===4?this.EYE_COLORS[c.eyeIdx]:this.SKIN_COLORS[c.skinIdx];
      ctx.fillStyle=sc;
      ctx.fillRect(valX-fs*1.5,ty+fs*0.3,fs*3,fs*1.2);
      ctx.strokeStyle=selected?'#fff':'#555';ctx.lineWidth=selected?2:1;
      ctx.strokeRect(valX-fs*1.5,ty+fs*0.3,fs*3,fs*1.2);
    }
    // Arrows
    if(selected){
      ctx.fillStyle='#ffcc44';ctx.font='bold '+Math.round(fs*1.2)+'px Segoe UI';ctx.textAlign='center';
      var arrowW=(i===numRows-1)?fs*5:(i===2||i>=5)?fs*3:fs*2.5;
      ctx.fillText('\u25C0',valX-arrowW,ty+fs*1.1);
      ctx.fillText('\u25B6',valX+arrowW,ty+fs*1.1);
    }
    ty+=thisRowH; // accumulate Y
  }

  // Controls hint
  ctx.fillStyle='#556';ctx.font=Math.round(fs*0.8)+'px Segoe UI';ctx.textAlign='center';
  var cy=h*0.82;
  ctx.fillText('\u2191\u2193 Select option    \u2190\u2192 Change    ENTER to begin',w/2,cy);
  ctx.fillStyle='#445';ctx.font=Math.round(fs*0.7)+'px Segoe UI';
  ctx.fillText('WASD move \u2022 1-4 abilities \u2022 P potion \u2022 Space wait \u2022 Tab map \u2022 M mute',w/2,cy+fs*1.3);

  // Pulsing start prompt
  ctx.fillStyle='#aab';ctx.font='bold '+Math.round(fs*1.1)+'px Segoe UI';
  ctx.globalAlpha=0.5+Math.sin(this.animTimer*3)*0.3+0.2;
  ctx.fillText('ENTER to begin',w/2,h*0.94);ctx.globalAlpha=1;
};

// ============================================================
// INVENTORY OVERLAY — tabbed layout
// ============================================================
var INV_TABS = ['Equip','Skills','Bag'];
var _invTab = 0;
var _invScroll = 0;

Game.prototype.drawInventory=function(ctx, cursor, message, messageTimer, stashIdx, getStashFn){
  var w=CONFIG.WIDTH, h=CONFIG.HEIGHT, fs=Math.max(11,Math.round(w*0.012));
  var p=this.player;
  cursor = cursor || 0;

  // Background
  ctx.fillStyle='rgba(0,0,0,0.88)';ctx.fillRect(0,0,w,h);

  // Title
  ctx.fillStyle='#ddcc88';ctx.font='bold '+Math.round(fs*1.4)+'px Segoe UI';ctx.textAlign='center';
  ctx.fillText('INVENTORY',w/2,fs*2);
  ctx.fillStyle='#666';ctx.font=Math.round(fs*0.7)+'px Segoe UI';
  ctx.fillText('[I] close    [Q]/[Tab] switch tab    \u2191\u2193 select    [E] action',w/2,fs*3.2);

  // Tabs
  var tabW = w / INV_TABS.length;
  var tabY = fs * 4;
  var tabH = fs * 1.8;
  for (var ti = 0; ti < INV_TABS.length; ti++) {
    var tx = ti * tabW;
    var sel = ti === _invTab;
    ctx.fillStyle = sel ? 'rgba(50,40,20,0.9)' : 'rgba(20,18,15,0.6)';
    ctx.fillRect(tx, tabY, tabW, tabH);
    if (sel) { ctx.strokeStyle = '#ddaa44'; ctx.lineWidth = 2; ctx.strokeRect(tx, tabY, tabW, tabH); }
    ctx.fillStyle = sel ? '#fff' : '#777';
    ctx.font = (sel ? 'bold ' : '') + fs + 'px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(INV_TABS[ti], tx + tabW / 2, tabY + tabH * 0.7);
  }

  var contentY = tabY + tabH + fs * 1.0;
  var contentH = h - contentY - fs * 4;
  var margin = w * 0.06;
  ctx.textAlign = 'left';

  if (_invTab === 0) {
    // ===== EQUIP TAB =====
    var ty = contentY;
    var rowH = fs * 1.6;
    var boxL = margin - 4;
    var boxW = w - margin * 2;
    var boxR = boxL + boxW - 8; // right edge for text alignment

    // Weapon
    if(cursor===0){ctx.fillStyle='rgba(60,50,20,0.5)';ctx.fillRect(boxL,ty-fs*0.5,boxW,rowH);ctx.strokeStyle='#ddaa44';ctx.lineWidth=1;ctx.strokeRect(boxL,ty-fs*0.5,boxW,rowH);}
    ctx.fillStyle='#888';ctx.font=fs+'px Segoe UI';
    ctx.fillText('Weapon:',margin,ty+fs*0.5);
    var wpnStash=getStashFn?getStashFn(p,'weapon'):[];
    if(p.weapon){
      ctx.fillStyle='#ddaa44';ctx.fillText(p.weapon.name,margin+fs*6,ty+fs*0.5);
      if(cursor===0){ctx.fillStyle='#aa8844';ctx.font=Math.round(fs*0.7)+'px Segoe UI';ctx.textAlign='right';ctx.fillText('[E] Stash',boxR,ty+fs*0.5);ctx.textAlign='left';}
    } else if(wpnStash.length>0&&cursor===0){
      var si=stashIdx%wpnStash.length;
      ctx.fillStyle='#997744';ctx.fillText(wpnStash[si].name,margin+fs*6,ty+fs*0.5);
      ctx.fillStyle='#aa8844';ctx.font=Math.round(fs*0.7)+'px Segoe UI';ctx.textAlign='right';
      ctx.fillText((wpnStash.length>1?'\u25C0\u25B6 ':'')+'[E] Equip  [X] Salvage  [D] Drop',boxR,ty+fs*0.5);
      ctx.textAlign='left';
    } else { ctx.fillStyle='#555';ctx.fillText('Unarmed',margin+fs*6,ty+fs*0.5); }
    ty+=rowH;

    // Armor
    if(cursor===1){ctx.fillStyle='rgba(60,50,20,0.5)';ctx.fillRect(boxL,ty-fs*0.5,boxW,rowH);ctx.strokeStyle='#ddaa44';ctx.lineWidth=1;ctx.strokeRect(boxL,ty-fs*0.5,boxW,rowH);}
    ctx.fillStyle='#888';ctx.font=fs+'px Segoe UI';
    ctx.fillText('Armor:',margin,ty+fs*0.5);
    var armStash=getStashFn?getStashFn(p,'armor'):[];
    if(p.armor){
      ctx.fillStyle='#88aacc';ctx.fillText(p.armor.name,margin+fs*6,ty+fs*0.5);
      if(cursor===1){ctx.fillStyle='#aa8844';ctx.font=Math.round(fs*0.7)+'px Segoe UI';ctx.textAlign='right';ctx.fillText('[E] Stash',boxR,ty+fs*0.5);ctx.textAlign='left';}
    } else if(armStash.length>0&&cursor===1){
      var ai=stashIdx%armStash.length;
      ctx.fillStyle='#667788';ctx.fillText(armStash[ai].name,margin+fs*6,ty+fs*0.5);
      ctx.fillStyle='#aa8844';ctx.font=Math.round(fs*0.7)+'px Segoe UI';ctx.textAlign='right';
      ctx.fillText((armStash.length>1?'\u25C0\u25B6 ':'')+'[E] Equip  [X] Salvage  [D] Drop',boxR,ty+fs*0.5);
      ctx.textAlign='left';
    } else { ctx.fillStyle='#555';ctx.fillText('None',margin+fs*6,ty+fs*0.5); }
    ty+=rowH;

    // Potions
    ctx.fillStyle='#888';ctx.font=fs+'px Segoe UI';
    ctx.fillText('Potions:',margin,ty+fs*0.5);
    ctx.fillStyle=p.potions>0?'#ff44aa':'#555';ctx.fillText(''+p.potions,margin+fs*6,ty+fs*0.5);
    ty+=rowH;

    // Wardrobe
    ty+=fs*0.5;
    if(cursor===2){ctx.fillStyle='rgba(60,40,60,0.5)';ctx.fillRect(boxL,ty-fs*0.5,boxW,rowH);ctx.strokeStyle='#aa88cc';ctx.lineWidth=1;ctx.strokeRect(boxL,ty-fs*0.5,boxW,rowH);}
    ctx.fillStyle='#aa88cc';ctx.font=fs+'px Segoe UI';
    ctx.fillText('Wardrobe — change appearance',margin,ty+fs*0.5);
    if(cursor===2){ctx.fillStyle='#aa8844';ctx.font=Math.round(fs*0.7)+'px Segoe UI';ctx.textAlign='right';ctx.fillText('[E] Open',boxR,ty+fs*0.5);ctx.textAlign='left';}

    // Stats summary at bottom
    ty = contentY + contentH - fs * 2;
    ctx.fillStyle='#555';ctx.font=Math.round(fs*0.8)+'px Segoe UI';
    ctx.fillText('ATK: '+p.atk+'   HP: '+p.hp+'/'+p.maxHp+'   Kills: '+p.kills,margin,ty);

  } else if (_invTab === 1) {
    // ===== SKILLS TAB =====
    var skillList = PlayerSkills.list(p.skills);
    var ty = contentY;

    if (skillList.length === 0) {
      ctx.fillStyle='#555';ctx.font=fs+'px Segoe UI';ctx.fillText('No skills yet. Gather, chop, mine, fish, or fight!',margin,ty+fs);
    } else {
      // Two-column layout for skills
      var colW = (w - margin * 3) / 2;
      var rowH = fs * 2.8;

      for (var i = 0; i < skillList.length; i++) {
        var sk = skillList[i];
        var def = sk.def;
        var col = i % 2;
        var row = Math.floor(i / 2);
        var sx = margin + col * (colW + margin);
        var sy = ty + row * rowH;
        var sxR = sx + colW; // right edge of this column

        if (sy + rowH > contentY + contentH) break;

        // Skill name — left aligned, truncated to fit
        ctx.fillStyle = def ? def.color : '#aaa';
        ctx.font = 'bold ' + fs + 'px Segoe UI';
        var skName = def ? def.name : sk.id;
        var maxNameW = colW * 0.7;
        while (skName.length > 3 && ctx.measureText(skName).width > maxNameW) skName = skName.slice(0, -2) + '.';
        ctx.fillText(skName, sx, sy + fs * 0.8);

        // Level — right aligned to column edge
        ctx.fillStyle = '#aaa';
        ctx.font = Math.round(fs * 0.8) + 'px Segoe UI';
        ctx.textAlign = 'right';
        ctx.fillText('Lv.' + sk.level, sxR, sy + fs * 0.8);
        ctx.textAlign = 'left';

        // XP bar — fits within column
        var barX = sx, barW = colW, barH = fs * 0.5;
        var barY = sy + fs * 1.3;
        var prog = PlayerSkills.progress(p.skills, sk.id);
        ctx.fillStyle = '#222';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = def ? def.color : '#888';
        ctx.fillRect(barX, barY, barW * prog, barH);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(barX, barY, barW, barH);
      }
    }

  } else if (_invTab === 2) {
    // ===== BAG TAB =====
    var contents = Bag.contents(p.bag);
    var ty = contentY;

    ctx.fillStyle='#aaa';ctx.font='bold '+fs+'px Segoe UI';
    ctx.fillText(Bag.types(p.bag)+' item types, '+Bag.count(p.bag)+' total',margin,ty+fs*0.5);
    ty += fs * 2;

    if (contents.length === 0) {
      ctx.fillStyle='#555';ctx.font=fs+'px Segoe UI';ctx.fillText('Empty',margin,ty);
    } else {
      // Fixed readable line height — scroll if content exceeds screen
      var lineH = fs * 1.5;
      var colW = (w - margin * 3) / 2;

      // Build flat list of renderable lines: {type:'cat'|'item', ...}
      var lines = [];
      var lastCat = '';
      for (var i = 0; i < contents.length; i++) {
        var item = contents[i];
        var cat = item.def ? item.def.category : 'misc';
        if (cat !== lastCat) { lastCat = cat; lines.push({ type: 'cat', text: cat.toUpperCase() }); }
        lines.push({ type: 'item', text: item.count + 'x ' + (item.def ? item.def.name : item.id), color: item.def ? item.def.color : '#aaa' });
      }

      // Scroll bounds
      var visibleLines = Math.floor(contentH / lineH);
      var maxScroll = Math.max(0, lines.length - visibleLines);
      if (_invScroll > maxScroll) _invScroll = maxScroll;
      var startLine = _invScroll;

      // Scroll indicator
      if (lines.length > visibleLines) {
        ctx.fillStyle = '#555';
        ctx.font = Math.round(fs * 0.7) + 'px Segoe UI';
        ctx.textAlign = 'right';
        ctx.fillText('\u2191\u2193 scroll (' + (startLine + 1) + '-' + Math.min(startLine + visibleLines, lines.length) + ' of ' + lines.length + ')', w - margin, contentY + fs * 0.5);
        ctx.textAlign = 'left';
      }

      for (var li = startLine; li < Math.min(lines.length, startLine + visibleLines); li++) {
        var line = lines[li];
        if (line.type === 'cat') {
          ctx.fillStyle = '#777';
          ctx.font = 'bold ' + Math.round(fs * 0.8) + 'px Segoe UI';
          ctx.fillText(line.text, margin, ty);
        } else {
          ctx.fillStyle = line.color;
          ctx.font = fs + 'px Segoe UI';
          var itemText = line.text;
          while (itemText.length > 3 && ctx.measureText(itemText).width > w - margin * 2) itemText = itemText.slice(0, -4) + '..';
          ctx.fillText(itemText, margin + fs * 1, ty);
        }
        ty += lineH;
      }
    }
  }

  // Status message
  if (message && messageTimer > 0) {
    ctx.fillStyle = '#ffcc44';
    ctx.font = 'bold ' + Math.round(fs * 1.1) + 'px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(message, w / 2, h - fs * 2);
  }
};

