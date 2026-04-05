// ============================================================
// BABY WRANGLER v2 — Game Logic
// ============================================================
// Assembled by tools/assemble-bw.js with sprite-forge-v2 engine
// and verified sprite props from tools/props/bw-*.js

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);

// Supabase
const _SU='https://ivhpqkqnfqcgrfrsvszf.supabase.co';
const _SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aHBxa3FuZnFjZ3JmcnN2c3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTg1NjYsImV4cCI6MjA4OTM5NDU2Nn0.x3X_0dbhw3Qz7sgQAgpSoSu382ckB2uYxCJGe7_vDCM';
async function submitScore(g,s){var n=prompt('Score: '+s+'! Enter initials (max 5):');if(!n)return;n=n.trim().slice(0,5).toUpperCase();if(!n)return;try{await fetch(_SU+'/rest/v1/high_scores',{method:'POST',headers:{'apikey':_SK,'Authorization':'Bearer '+_SK,'Content-Type':'application/json'},body:JSON.stringify({game:g,initials:n,score:s})})}catch(e){}}

// SFX
var SFX = (function() {
  var actx = null, muted = false;
  function getCtx() { if (!actx) try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; } if (actx.state === 'suspended') actx.resume(); return actx; }
  function play(fn) { if (muted) return; var c = getCtx(); if (c) fn(c); }
  function osc(c, type, freq, freq2, dur, vol) {
    var o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
    if (freq2) o.frequency.linearRampToValueAtTime(freq2, c.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.08, c.currentTime);
    g.gain.linearRampToValueAtTime(0, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }
  return {
    get muted() { return muted; }, set muted(v) { muted = v; },
    pickup(){ play(c => osc(c,'sine',500,800,0.1,0.08)); },
    place(){ play(c => osc(c,'sine',800,500,0.08,0.06)); },
    grab(){ play(c => osc(c,'square',200,300,0.12,0.06)); },
    danger(){ play(c => osc(c,'sawtooth',400,200,0.3,0.08)); },
    safe(){ play(c => { osc(c,'sine',600,1200,0.15,0.1); osc(c,'sine',800,1400,0.12,0.08); }); },
    escape(){ play(c => osc(c,'triangle',300,500,0.15,0.06)); },
    loseLife(){ play(c => { for(var i=0;i<3;i++) setTimeout(()=>osc(c,'sawtooth',400-i*80,200-i*40,0.2,0.08),i*120); }); },
    gameOver(){ play(c => { for(var i=0;i<4;i++) setTimeout(()=>osc(c,'sawtooth',300-i*60,150-i*30,0.25,0.08),i*180); }); },
    wave(){ play(c => { for(var i=0;i<3;i++) setTimeout(()=>osc(c,'sine',500+i*200,600+i*200,0.1,0.08),i*100); }); },
    select(){ play(c => osc(c,'sine',800,600,0.06,0.05)); },
    chore(){ play(c => { osc(c,'sine',700,1000,0.12,0.08); osc(c,'sine',900,1200,0.1,0.06); }); },
  };
})();

// Generate sprites
const mumSprite = buildMumSprite();
const dadSprite = buildDadSprite();
const babySitSprite = buildBabySitSprite();
const babyCrawlSprite = buildBabyCrawlSprite();
const sofaSprite = buildSofaSprite();
const coffeeTableSprite = buildCoffeeTableSprite();
const bookshelfSprite = buildBookshelfSprite();
const tvStandSprite = buildTvStandSprite();
const toyboxSprite = buildToyboxSprite();

// Room config — fixed size
const ROOM_W = 600, ROOM_H = 450, SCALE = 2;
function getRoomOrigin() {
  return { rx: Math.floor((canvas.width - ROOM_W) / 2), ry: Math.floor((canvas.height - ROOM_H) / 2) };
}

// Furniture layout + collision
const FURNITURE = [
  { name: 'sofa', sprite: sofaSprite, x: 30, y: 15, w: 120, h: 48, solid: true },
  { name: 'coffeeTable', sprite: coffeeTableSprite, x: 60, y: 150, w: 80, h: 40, solid: true },
  { name: 'bookshelf', sprite: bookshelfSprite, x: ROOM_W - 50, y: 90, w: 32, h: 80, solid: true },
  { name: 'tvStand', sprite: tvStandSprite, x: ROOM_W / 2 - 48, y: ROOM_H - 55, w: 96, h: 40, solid: true },
  { name: 'toybox', sprite: toyboxSprite, x: ROOM_W / 2 + 70, y: ROOM_H / 2 + 50, w: 48, h: 36, solid: false },
];
const PLAYPEN = { x: ROOM_W / 2, y: ROOM_H / 2 - 10, r: 40 };

const HAZARDS_DEF = [
  { name:'Scissors',icon:'✂️',danger:3 }, { name:'Hot Coffee',icon:'☕',danger:3 },
  { name:'Glass Vase',icon:'🏺',danger:2 }, { name:'Marker',icon:'🖊️',danger:1 },
  { name:'Phone',icon:'📱',danger:1 }, { name:'Remote',icon:'📺',danger:1 },
  { name:'Keys',icon:'🔑',danger:1 }, { name:'Plant',icon:'🌱',danger:2 },
  { name:'Candle',icon:'🕯️',danger:3 },
];
const CHORE_TYPES = [
  { name:'Doorbell',icon:'🔔',x:8,y:ROOM_H/2,pts:50,dur:10 },
  { name:'Phone',icon:'📞',x:100,y:170,pts:30,dur:8 },
  { name:'Oven',icon:'🔥',x:ROOM_W-25,y:ROOM_H-25,pts:40,dur:10 },
  { name:'Spill',icon:'💧',x:0,y:0,pts:25,dur:8,rnd:true },
];

// State
const ST = { TITLE:0, PLAYING:1, GAMEOVER:2 };
let state = ST.TITLE, selectedParent = 'mum';
let score = 0, lives = 3, wave = 1, streak = 0, gameTime = 0;
let highScore = parseInt(localStorage.getItem('bw_high') || '0');
let player = { x:0, y:0, carrying:false, facing:1 };
let partner = { x:0, y:0, target:null, ttype:null, choreP:0, facing:1 };
let baby = { x:0, y:0, state:'penned', holdingHazard:null, dangerTimer:0, escapeTimer:0, targetHazard:null };
let hazards = [], particles = [], floatingTexts = [];
let dangerFlash = 0, chore = null, choreTimer = 0, choreIgnore = 0, hazardSlow = 0;
let spawnTimer = 0, spawnInterval = 4, maxHazards = 3;
let babyBaseSpeed = 60, babyEscapeTime = 3;
const DANGER_TIME = 5, PSPEED = 160, AI_MULT = 0.6;

// Collision
function moveCol(e, dx, dy, hw, hh) {
  let nx = e.x + dx, ny = e.y + dy;
  nx = Math.max(hw, Math.min(ROOM_W - hw, nx));
  ny = Math.max(hh, Math.min(ROOM_H - hh, ny));
  for (const f of FURNITURE) {
    if (!f.solid) continue;
    if (nx-hw < f.x+f.w && nx+hw > f.x && ny-hh < f.y+f.h && ny+hh > f.y) {
      if (!(e.x-hw < f.x+f.w && e.x+hw > f.x && ny-hh < f.y+f.h && ny+hh > f.y)) { nx = e.x; }
      else if (!(nx-hw < f.x+f.w && nx+hw > f.x && e.y-hh < f.y+f.h && e.y+hh > f.y)) { ny = e.y; }
      else { nx = e.x; ny = e.y; }
    }
  }
  e.x = nx; e.y = ny;
}

function spawnParticles(x,y,col,n) {
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,sp=30+Math.random()*60;particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,decay:0.02+Math.random()*0.02,r:2+Math.random()*3,color:col});}
}
function addFloat(x,y,t,c){ floatingTexts.push({x,y,text:t,color:c,life:1.5}); }

// Start / reset
function startGame() {
  state = ST.PLAYING; score = 0; lives = 3; wave = 1; streak = 0; gameTime = 0;
  hazards=[]; particles=[]; floatingTexts=[];
  dangerFlash=0; chore=null; choreTimer=5; hazardSlow=0;
  player.x=PLAYPEN.x+90; player.y=PLAYPEN.y; player.carrying=false;
  partner.x=PLAYPEN.x-90; partner.y=PLAYPEN.y; partner.target=null; partner.choreP=0;
  baby.x=PLAYPEN.x; baby.y=PLAYPEN.y; baby.state='penned';
  baby.holdingHazard=null; baby.dangerTimer=0; baby.escapeTimer=0; baby.targetHazard=null;
  babyBaseSpeed=60; spawnInterval=4; maxHazards=3; babyEscapeTime=3; spawnTimer=1.5;
  SFX.wave();
}
function nextWave() {
  wave++; babyBaseSpeed+=8; spawnInterval=Math.max(1.5,spawnInterval-0.3);
  maxHazards=Math.min(8,maxHazards+1); babyEscapeTime=Math.max(1.5,babyEscapeTime-0.15);
  SFX.wave(); addFloat(ROOM_W/2,ROOM_H/2-40,'Wave '+wave+'!','#ffdd44');
}
function gameOver() {
  state=ST.GAMEOVER; SFX.gameOver();
  if(score>highScore){highScore=score;localStorage.setItem('bw_high',String(highScore));}
  if(score>0)submitScore('baby-wrangler',score);
}

// Input
const keys={};
let touchTarget=null;
window.addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(state===ST.TITLE&&(e.code==='Enter'||e.code==='Space'))startGame();
  if(state===ST.GAMEOVER&&(e.code==='Enter'||e.code==='Space')){state=ST.TITLE;}
  if(e.code==='KeyM')SFX.muted=!SFX.muted;
});
window.addEventListener('keyup',e=>{keys[e.code]=false;});
canvas.addEventListener('mousedown',e=>{
  if(state===ST.TITLE){const{rx,ry}=getRoomOrigin();const mx=e.clientX-rx;
    if(mx<ROOM_W/2)selectedParent='mum';else selectedParent='dad';SFX.select();startGame();return;}
  if(state===ST.GAMEOVER){state=ST.TITLE;return;}
  touchTarget={x:e.clientX,y:e.clientY};
});
canvas.addEventListener('mousemove',e=>{if(state===ST.PLAYING&&e.buttons)touchTarget={x:e.clientX,y:e.clientY};});
canvas.addEventListener('mouseup',()=>{touchTarget=null;});
canvas.addEventListener('touchstart',e=>{e.preventDefault();
  if(state===ST.TITLE){const{rx}=getRoomOrigin();const mx=e.touches[0].clientX-rx;
    selectedParent=mx<ROOM_W/2?'mum':'dad';SFX.select();startGame();return;}
  if(state===ST.GAMEOVER){state=ST.TITLE;return;}
  touchTarget={x:e.touches[0].clientX,y:e.touches[0].clientY};
},{passive:false});
canvas.addEventListener('touchmove',e=>{e.preventDefault();if(state===ST.PLAYING)touchTarget={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:false});
canvas.addEventListener('touchend',e=>{e.preventDefault();touchTarget=null;},{passive:false});

// Hazard spawn
function spawnHazard(){
  const t=HAZARDS_DEF[Math.floor(Math.random()*HAZARDS_DEF.length)];
  const side=Math.floor(Math.random()*4);
  let x,y;
  switch(side){case 0:x=20+Math.random()*(ROOM_W-40);y=15;break;case 1:x=20+Math.random()*(ROOM_W-40);y=ROOM_H-20;break;
    case 2:x=15;y=20+Math.random()*(ROOM_H-40);break;case 3:x=ROOM_W-15;y=20+Math.random()*(ROOM_H-40);break;}
  const dx=x-PLAYPEN.x,dy=y-PLAYPEN.y;
  if(Math.sqrt(dx*dx+dy*dy)<PLAYPEN.r*2){x=30;y=30;}
  hazards.push({...t,x,y,grabbed:false,bob:Math.random()*Math.PI*2});
}

// Baby AI
function pickTarget(){
  let best=null,bd=-1;
  for(const h of hazards){if(!h.grabbed&&h.danger>bd){bd=h.danger;best=h;}}
  baby.targetHazard=best;
}
function updateBaby(dt){
  const spd=babyBaseSpeed+wave*5;
  if(baby.state==='penned'){
    if(hazards.length>0){baby.escapeTimer+=dt;if(baby.escapeTimer>=babyEscapeTime){baby.state='crawling';baby.escapeTimer=0;SFX.escape();pickTarget();}}
    else baby.escapeTimer=0;return;
  }
  if(baby.state==='carried')return;
  if(baby.holdingHazard){
    baby.dangerTimer+=dt;
    baby.x+=Math.sin(gameTime*3)*spd*0.3*dt;baby.y+=Math.cos(gameTime*2.3)*spd*0.3*dt;
    baby.x=Math.max(10,Math.min(ROOM_W-10,baby.x));baby.y=Math.max(10,Math.min(ROOM_H-10,baby.y));
    if(baby.dangerTimer>=DANGER_TIME){
      lives--;baby.holdingHazard=null;baby.dangerTimer=0;baby.state='penned';
      baby.x=PLAYPEN.x;baby.y=PLAYPEN.y;baby.targetHazard=null;hazards=hazards.filter(h=>!h.grabbed);streak=0;
      SFX.loseLife();addFloat(baby.x,baby.y-20,'Too slow!','#ff4444');spawnParticles(baby.x,baby.y,'#ff4444',15);
      if(lives<=0)gameOver();
    }return;
  }
  if(!baby.targetHazard||baby.targetHazard.grabbed)pickTarget();
  if(!baby.targetHazard){baby.x+=Math.sin(gameTime*2)*spd*0.4*dt;baby.y+=Math.cos(gameTime*1.7)*spd*0.4*dt;
    baby.x=Math.max(10,Math.min(ROOM_W-10,baby.x));baby.y=Math.max(10,Math.min(ROOM_H-10,baby.y));return;}
  const tdx=baby.targetHazard.x-baby.x,tdy=baby.targetHazard.y-baby.y,dist=Math.sqrt(tdx*tdx+tdy*tdy);
  if(dist<15){baby.holdingHazard=baby.targetHazard;baby.targetHazard.grabbed=true;baby.dangerTimer=0;SFX.grab();SFX.danger();
    addFloat(baby.x,baby.y-20,baby.holdingHazard.name+'!','#ff6644');
  }else{baby.x+=(tdx/dist)*spd*dt;baby.y+=(tdy/dist)*spd*dt;}
}

// Partner AI
function updatePartner(dt){
  const spd=PSPEED*AI_MULT;
  if(!partner.target){
    if(chore){partner.target=chore;partner.ttype='chore';}
    else{let near=null,nd=Infinity;for(const h of hazards){if(h.grabbed)continue;const d=Math.sqrt((h.x-partner.x)**2+(h.y-partner.y)**2);if(d<nd){nd=d;near=h;}}
      if(near){partner.target=near;partner.ttype='hazard';}}
  }
  if(!partner.target)return;
  if(partner.ttype==='hazard'&&(partner.target.grabbed||!hazards.includes(partner.target))){partner.target=null;return;}
  if(partner.ttype==='chore'&&!chore){partner.target=null;return;}
  const tx=partner.target.x,ty=partner.target.y,dx=tx-partner.x,dy=ty-partner.y,dist=Math.sqrt(dx*dx+dy*dy);
  if(dist<15){
    if(partner.ttype==='hazard'){if(baby.targetHazard===partner.target)baby.targetHazard=null;
      const idx=hazards.indexOf(partner.target);if(idx>=0){hazards.splice(idx,1);score+=10;addFloat(partner.x,partner.y-15,'+10','#aaccff');}partner.target=null;}
    else if(partner.ttype==='chore'){partner.choreP+=dt;if(partner.choreP>=1){score+=chore.pts;addFloat(chore.x,chore.y-20,'+'+chore.pts,'#ffdd44');
      hazardSlow=chore.dur;SFX.chore();chore=null;partner.target=null;partner.choreP=0;choreTimer=15+Math.random()*5;}return;}
  }else{partner.choreP=0;const mx=(dx/dist)*spd*dt,my=(dy/dist)*spd*dt;moveCol(partner,mx,my,10,10);
    if(dx>0)partner.facing=1;else if(dx<0)partner.facing=-1;}
}

// Update
function update(dt){
  if(state!==ST.PLAYING)return;gameTime+=dt;
  mumSprite.animator.update(dt);dadSprite.animator.update(dt);babySitSprite.animator.update(dt);babyCrawlSprite.animator.update(dt);
  const pSprite=selectedParent==='mum'?mumSprite:dadSprite;
  let dx=0,dy=0;
  if(keys.ArrowLeft||keys.KeyA)dx--;if(keys.ArrowRight||keys.KeyD)dx++;
  if(keys.ArrowUp||keys.KeyW)dy--;if(keys.ArrowDown||keys.KeyS)dy++;
  if(touchTarget){const{rx,ry}=getRoomOrigin();const tdx=touchTarget.x-rx-player.x,tdy=touchTarget.y-ry-player.y,d=Math.sqrt(tdx*tdx+tdy*tdy);
    if(d>5){dx=tdx/d;dy=tdy/d;}}else if(dx||dy){const l=Math.sqrt(dx*dx+dy*dy);dx/=l;dy/=l;}
  const moving=dx!==0||dy!==0;
  if(moving){moveCol(player,dx*PSPEED*dt,dy*PSPEED*dt,10,15);if(dx>0)player.facing=1;else if(dx<0)player.facing=-1;pSprite.animator.play('walk');}
  else pSprite.animator.play('idle');
  // Partner animation
  const ptSprite=selectedParent==='mum'?dadSprite:mumSprite;
  if(partner.target)ptSprite.animator.play('walk');else ptSprite.animator.play('idle');
  // Hazard spawn
  const eff=hazardSlow>0?spawnInterval*1.5:spawnInterval;
  spawnTimer-=dt;if(spawnTimer<=0&&hazards.length<maxHazards){spawnHazard();spawnTimer=eff+Math.random()*1.5;}
  if(hazardSlow>0)hazardSlow-=dt;
  // Chores
  choreTimer-=dt;
  if(choreTimer<=0&&!chore){const ct=CHORE_TYPES[Math.floor(Math.random()*CHORE_TYPES.length)];
    chore={...ct};if(chore.rnd){chore.x=50+Math.random()*(ROOM_W-100);chore.y=50+Math.random()*(ROOM_H-100);}choreIgnore=0;}
  if(chore){choreIgnore+=dt;if(choreIgnore>=10){chore=null;choreTimer=15+Math.random()*5;spawnTimer=Math.max(0,spawnTimer-2);}
    else{const cdx=chore.x-player.x,cdy=chore.y-player.y;
      if(Math.sqrt(cdx*cdx+cdy*cdy)<20&&!moving){score+=chore.pts;addFloat(chore.x,chore.y-20,'+'+chore.pts,'#ffdd44');
        hazardSlow=chore.dur;SFX.chore();chore=null;choreTimer=15+Math.random()*5;}}}
  updateBaby(dt);updatePartner(dt);
  // Player picks up baby
  if(!player.carrying&&baby.state!=='penned'){const bdx=player.x-baby.x,bdy=player.y-baby.y;
    if(Math.sqrt(bdx*bdx+bdy*bdy)<30){player.carrying=true;SFX.pickup();
      if(baby.holdingHazard){baby.holdingHazard=null;baby.dangerTimer=0;}
      if(baby.state==='crawling'&&!baby.holdingHazard){streak++;const b=50*streak;score+=b;addFloat(baby.x,baby.y-20,'Quick catch! +'+b,'#44ff88');}}}
  if(player.carrying){baby.x=player.x;baby.y=player.y-20;baby.state='carried';
    const pdx=player.x-PLAYPEN.x,pdy=player.y-PLAYPEN.y;
    if(Math.sqrt(pdx*pdx+pdy*pdy)<PLAYPEN.r+15){player.carrying=false;baby.x=PLAYPEN.x;baby.y=PLAYPEN.y;baby.state='penned';
      baby.escapeTimer=0;baby.targetHazard=null;hazards=hazards.filter(h=>!h.grabbed);SFX.safe();score+=100;
      addFloat(PLAYPEN.x,PLAYPEN.y-30,'+100','#ffdd44');spawnParticles(PLAYPEN.x,PLAYPEN.y,'#88ff88',10);
      if(score>0&&Math.floor(score/500)>=wave)nextWave();}}
  // Collect hazards
  for(let i=hazards.length-1;i>=0;i--){const h=hazards[i];if(h.grabbed)continue;
    const hdx=player.x-h.x,hdy=player.y-h.y;
    if(Math.sqrt(hdx*hdx+hdy*hdy)<25){if(baby.targetHazard===h)baby.targetHazard=null;
      spawnParticles(h.x,h.y,'#aaaaaa',5);score+=10;addFloat(h.x,h.y-15,'+10','#aaccff');hazards.splice(i,1);}}
  if(baby.holdingHazard)dangerFlash+=dt*4;else dangerFlash=0;
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=80*dt;p.life-=p.decay;if(p.life<=0)particles.splice(i,1);}
  for(let i=floatingTexts.length-1;i>=0;i--){floatingTexts[i].y-=40*dt;floatingTexts[i].life-=dt;if(floatingTexts[i].life<=0)floatingTexts.splice(i,1);}
}

// Drawing
function drawRoom(){
  const{rx,ry}=getRoomOrigin();ctx.save();ctx.translate(rx,ry);
  ctx.fillStyle='#d4b896';ctx.fillRect(0,0,ROOM_W,ROOM_H);
  ctx.strokeStyle='rgba(160,130,100,0.3)';ctx.lineWidth=1;
  for(let y=0;y<ROOM_H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(ROOM_W,y);ctx.stroke();
    const off=(Math.floor(y/30)%2)*ROOM_W*0.3;for(let x=off;x<ROOM_W;x+=ROOM_W*0.6){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+30);ctx.stroke();}}
  // Walls
  ctx.fillStyle='#b8c4d0';ctx.fillRect(0,0,ROOM_W,6);ctx.fillRect(0,ROOM_H-6,ROOM_W,6);ctx.fillRect(0,0,6,ROOM_H);ctx.fillRect(ROOM_W-6,0,6,ROOM_H);
  ctx.fillStyle='#8899aa';ctx.fillRect(0,0,ROOM_W,3);ctx.fillRect(0,ROOM_H-3,ROOM_W,3);ctx.fillRect(0,0,3,ROOM_H);ctx.fillRect(ROOM_W-3,0,3,ROOM_H);
  // Window
  const wX=ROOM_W*0.65,wY=7,wW=80,wH=45;
  ctx.fillStyle='#aaccee';ctx.fillRect(wX,wY,wW,wH);ctx.strokeStyle='#667788';ctx.lineWidth=2;ctx.strokeRect(wX,wY,wW,wH);
  ctx.beginPath();ctx.moveTo(wX+wW/2,wY);ctx.lineTo(wX+wW/2,wY+wH);ctx.moveTo(wX,wY+wH/2);ctx.lineTo(wX+wW,wY+wH/2);ctx.stroke();
  ctx.fillStyle='#cc8866';ctx.fillRect(wX-6,wY-3,8,wH+6);ctx.fillRect(wX+wW-2,wY-3,8,wH+6);ctx.fillRect(wX-6,wY-3,wW+12,4);
  // Rug
  ctx.fillStyle='rgba(180,120,80,0.25)';ctx.beginPath();ctx.ellipse(PLAYPEN.x,PLAYPEN.y,PLAYPEN.r+30,PLAYPEN.r+20,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(150,100,60,0.2)';ctx.lineWidth=2;ctx.stroke();
  ctx.restore();
}
function drawFurniture(){const{rx,ry}=getRoomOrigin();ctx.imageSmoothingEnabled=false;
  for(const f of FURNITURE)f.sprite.sheet.drawFrame(ctx,0,rx+f.x,ry+f.y,{scale:SCALE});}
function drawPlaypen(){
  const{rx,ry}=getRoomOrigin();const x=rx+PLAYPEN.x,y=ry+PLAYPEN.y,r=PLAYPEN.r;
  ctx.fillStyle='rgba(0,0,0,0.1)';ctx.beginPath();ctx.ellipse(x,y+5,r+5,r*0.6+5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#aaddaa';ctx.beginPath();ctx.ellipse(x,y,r,r*0.6,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#77aa77';ctx.lineWidth=3;ctx.stroke();
  ctx.strokeStyle='#bb8844';ctx.lineWidth=3;for(let i=0;i<16;i++){const a=(i/16)*Math.PI*2;const bx=x+Math.cos(a)*r,by=y+Math.sin(a)*r*0.6;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx,by-18);ctx.stroke();}
  if(baby.state==='penned'&&hazards.length>0){const p=baby.escapeTimer/babyEscapeTime;if(p>0.3){ctx.strokeStyle='rgba(255,'+Math.floor(200*(1-p))+',0,'+p+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r+8,-Math.PI/2,-Math.PI/2+p*Math.PI*2);ctx.stroke();}}}
function drawChar(sprite,entity){const{rx,ry}=getRoomOrigin();ctx.imageSmoothingEnabled=false;
  const fw=sprite.sheet.frameWidth*SCALE,fh=sprite.sheet.frameHeight*SCALE;
  sprite.animator.draw(ctx,rx+entity.x-fw/2,ry+entity.y-fh+20,{scale:SCALE,flipX:entity.facing<0});}
function drawBaby(){const{rx,ry}=getRoomOrigin();ctx.imageSmoothingEnabled=false;
  if(baby.state==='penned'||baby.state==='carried'){const fw=babySitSprite.sheet.frameWidth*SCALE,fh=babySitSprite.sheet.frameHeight*SCALE;babySitSprite.animator.draw(ctx,rx+baby.x-fw/2,ry+baby.y-fh/2,{scale:SCALE});}
  else{const fw=babyCrawlSprite.sheet.frameWidth*SCALE,fh=babyCrawlSprite.sheet.frameHeight*SCALE;babyCrawlSprite.animator.draw(ctx,rx+baby.x-fw/2,ry+baby.y-fh/2,{scale:SCALE});}
  if(baby.holdingHazard){ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillText(baby.holdingHazard.icon,rx+baby.x+15,ry+baby.y-5);
    const p=baby.dangerTimer/DANGER_TIME;ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(rx+baby.x-15,ry+baby.y-25,30,4);
    ctx.fillStyle='rgb('+Math.floor(255*p)+','+Math.floor(255*(1-p))+',0)';ctx.fillRect(rx+baby.x-15,ry+baby.y-25,30*p,4);}}
function drawHazards(){const{rx,ry}=getRoomOrigin();for(const h of hazards){if(h.grabbed)continue;const bob=Math.sin(gameTime*2+h.bob)*3;
  if(h.danger>=3){ctx.fillStyle='rgba(255,50,50,0.15)';ctx.beginPath();ctx.arc(rx+h.x,ry+h.y,20,0,Math.PI*2);ctx.fill();}
  ctx.font='20px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(h.icon,rx+h.x,ry+h.y+bob);
  ctx.font='bold 9px sans-serif';ctx.fillStyle=h.danger>=3?'#ff4444':h.danger>=2?'#ffaa44':'#aaaaaa';ctx.fillText('!'.repeat(h.danger),rx+h.x,ry+h.y+bob+14);}}
function drawChore(){if(!chore)return;const{rx,ry}=getRoomOrigin();const p=0.6+Math.sin(gameTime*4)*0.4;
  ctx.globalAlpha=p;ctx.font='24px sans-serif';ctx.textAlign='center';ctx.fillText(chore.icon,rx+chore.x,ry+chore.y);
  ctx.font='10px Segoe UI';ctx.fillStyle='#ffdd44';ctx.fillText(chore.name,rx+chore.x,ry+chore.y+18);ctx.globalAlpha=1;}
function drawBubble(){if(!partner.target)return;const{rx,ry}=getRoomOrigin();
  ctx.fillStyle='rgba(255,255,255,0.8)';ctx.beginPath();ctx.arc(rx+partner.x,ry+partner.y-50,10,0,Math.PI*2);ctx.fill();
  ctx.font='12px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(partner.ttype==='chore'&&chore?chore.icon:'🧹',rx+partner.x,ry+partner.y-50);}
function drawHUD(){const{rx,ry}=getRoomOrigin();ctx.font='18px sans-serif';ctx.textAlign='left';ctx.textBaseline='top';
  let hx=rx+10;for(let i=0;i<3;i++){ctx.globalAlpha=i<lives?1:0.2;ctx.fillText('❤️',hx,ry+ROOM_H+8);hx+=24;}ctx.globalAlpha=1;
  ctx.font='bold 16px Segoe UI';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText('Score: '+score,rx+ROOM_W/2,ry+ROOM_H+10);
  ctx.fillStyle='#aaa';ctx.font='12px Segoe UI';ctx.fillText('Wave '+wave,rx+ROOM_W/2,ry+ROOM_H+30);
  ctx.textAlign='right';ctx.fillStyle='#888';ctx.fillText('Best: '+highScore,rx+ROOM_W-10,ry+ROOM_H+10);
  if(SFX.muted)ctx.fillText('MUTED [M]',rx+ROOM_W-10,ry+ROOM_H+26);}
function drawTitle(){const{rx,ry}=getRoomOrigin();ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.font='bold 40px Segoe UI';ctx.textAlign='center';ctx.fillStyle='#ffdd88';ctx.fillText('BABY WRANGLER',rx+ROOM_W/2,ry+60);
  ctx.font='16px Segoe UI';ctx.fillStyle='rgba(255,255,255,0.5)';ctx.fillText('Choose your parent!',rx+ROOM_W/2,ry+95);
  ctx.imageSmoothingEnabled=false;
  mumSprite.sheet.drawFrame(ctx,0,rx+ROOM_W*0.25-48,ry+ROOM_H*0.35,{scale:3});
  dadSprite.sheet.drawFrame(ctx,0,rx+ROOM_W*0.75-48,ry+ROOM_H*0.35,{scale:3});
  ctx.font='bold 18px Segoe UI';ctx.fillStyle='#ee88aa';ctx.fillText('MUM',rx+ROOM_W*0.25,ry+ROOM_H*0.75);
  ctx.fillStyle='#88bb88';ctx.fillText('DAD',rx+ROOM_W*0.75,ry+ROOM_H*0.75);
  const a=0.4+Math.sin(gameTime*3)*0.3;ctx.fillStyle='rgba(255,255,255,'+a+')';ctx.font='14px Segoe UI';
  ctx.fillText('Click or tap to choose',rx+ROOM_W/2,ry+ROOM_H*0.85);}
function drawGameOver(){ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,canvas.width,canvas.height);
  const{rx,ry}=getRoomOrigin();ctx.font='bold 36px Segoe UI';ctx.textAlign='center';ctx.fillStyle='#ff6644';
  ctx.fillText('GAME OVER',rx+ROOM_W/2,ry+ROOM_H*0.35);ctx.font='18px Segoe UI';ctx.fillStyle='#fff';
  ctx.fillText('Score: '+score+'  |  Wave: '+wave,rx+ROOM_W/2,ry+ROOM_H*0.48);
  if(score>=highScore&&score>0){ctx.fillStyle='#ffdd44';ctx.font='bold 16px Segoe UI';ctx.fillText('NEW HIGH SCORE!',rx+ROOM_W/2,ry+ROOM_H*0.58);}
  const a=0.4+Math.sin(gameTime*3)*0.3;ctx.fillStyle='rgba(255,255,255,'+a+')';ctx.font='14px Segoe UI';
  ctx.fillText('Tap or press ENTER',rx+ROOM_W/2,ry+ROOM_H*0.72);}

// Loop
let lastTime=0;
function loop(ts){
  if(!lastTime)lastTime=ts;const dt=Math.min((ts-lastTime)/1000,0.1);lastTime=ts;
  if(canvas.width!==window.innerWidth||canvas.height!==window.innerHeight)resize();
  ctx.fillStyle='#2a1a0a';ctx.fillRect(0,0,canvas.width,canvas.height);
  if(state===ST.TITLE){gameTime+=dt;drawTitle();}
  else if(state===ST.PLAYING){
    update(dt);drawRoom();drawPlaypen();drawFurniture();drawChore();drawHazards();
    const ents=[];const pSp=selectedParent==='mum'?mumSprite:dadSprite;const ptSp=selectedParent==='mum'?dadSprite:mumSprite;
    if(baby.state!=='carried')ents.push({y:baby.y,d:drawBaby});
    ents.push({y:player.y,d:()=>drawChar(pSp,player)});
    ents.push({y:partner.y,d:()=>{drawChar(ptSp,partner);drawBubble();}});
    if(baby.state==='carried')ents.push({y:player.y-1,d:drawBaby});
    ents.sort((a,b)=>a.y-b.y);for(const e of ents)e.d();
    const{rx,ry}=getRoomOrigin();
    for(const p of particles){ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(rx+p.x,ry+p.y,p.r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    for(const ft of floatingTexts){ctx.globalAlpha=Math.min(1,ft.life);ctx.fillStyle=ft.color;ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillText(ft.text,rx+ft.x,ry+ft.y);}ctx.globalAlpha=1;
    if(baby.holdingHazard){const p=Math.sin(dangerFlash)*0.5+0.5;ctx.fillStyle='rgba(255,0,0,'+(p*0.08)+')';ctx.fillRect(0,0,canvas.width,canvas.height);}
    drawHUD();
  }else if(state===ST.GAMEOVER){drawRoom();drawPlaypen();drawFurniture();drawHazards();drawBaby();
    drawChar(selectedParent==='mum'?mumSprite:dadSprite,player);drawHUD();drawGameOver();gameTime+=dt;}
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
