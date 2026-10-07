import { randomUUID } from 'crypto'

// ==========================================
// 🍄 SUPER MARIO - RETRO RUNNER (FIXED)
// ==========================================
const MARIO_HTML = `<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
html,body{width:100%}
body{background:linear-gradient(165deg,#0a1538,#03081c 60%,#010414);padding:8px;color:#eaf2ff;overflow-y:auto}
#app{max-width:420px;margin:0 auto}
.hdr{display:flex;justify-content:space-between;align-items:center;padding:2px 2px 7px;gap:8px}
.tt{font:900 18px 'Arial Black';color:#ff4b4b;text-shadow:0 0 12px #ff4b4b66;letter-spacing:1px}
.tt small{display:block;font:700 6.5px Arial;letter-spacing:2px;color:#7a9cc8;text-shadow:none}
.hrs{display:flex;gap:6px;align-items:center}
.hr{background:rgba(0,0,0,.42);border:1px solid rgba(255,75,75,.3);border-radius:9px;padding:3px 9px;text-align:center;min-width:52px}
.hr i{display:block;font:700 7px Arial;font-style:normal;letter-spacing:1px;color:#7a9cc8}
.hr b{font:900 13px 'Arial Black';color:#ffd75e;font-variant-numeric:tabular-nums}
.mbtn{width:34px;height:34px;border:2px solid rgba(255,75,75,.3);border-radius:9px;background:rgba(0,0,0,.42);color:#fff;font-size:15px;cursor:pointer;touch-action:none}
.mbtn:active{filter:brightness(1.6)}
.gw{position:relative;border:2px solid rgba(255,75,75,.3);border-radius:14px;overflow:hidden;background:#000;box-shadow:0 0 18px rgba(255,75,75,.15)}
canvas{width:100%;display:block;touch-action:none}
.pads{display:grid;grid-template-columns:1fr 1.3fr;gap:10px;margin-top:8px}
.pd{height:52px;border:2px solid rgba(255,255,255,.18);border-radius:14px;font:900 14px 'Arial Black';color:#fff;cursor:pointer;touch-action:none;box-shadow:0 4px 0 rgba(0,0,0,.5)}
.pd:active{transform:translateY(3px);box-shadow:none;filter:brightness(1.5)}
#jumpB{background:linear-gradient(#ff5563,#c81220 60%,#6e0a12);color:#fff}
#runB{background:linear-gradient(#58c7ff,#1f7fd6 60%,#0a3a6e)}
.hint{text-align:center;font:600 9px Arial;color:#7a9cc8;margin-top:6px}
.credit{text-align:center;font:600 8px Arial;color:#647a9f;margin-top:7px;padding-bottom:2px}
.credit a{color:#ff7a8a;text-decoration:none}
.credit a:active{filter:brightness(1.5)}
</style>
<div id="app">
<div class="hdr"><div class="tt">🍄 SUPER MARIO<small>RETRO RUNNER</small></div><div class="hrs"><div class="hr"><i>COINS</i><b id="cg">0</b></div><div class="hr"><i>SCORE</i><b id="sg">0</b></div><div class="hr"><i>BEST</i><b id="bg">0</b></div><button class="mbtn" id="muteB">🔊</button></div></div>
<div class="gw"><canvas id="cv" width="404" height="300"></canvas></div>
<div class="pads"><button class="pd" id="runB">◀▶ AUTO</button><button class="pd" id="jumpB">⤒ JUMP</button></div>
<div class="hint">Tap kanan = LOMPAT · Tap kiri = DASH ⚡ · Injak Goomba = +100 · 🍄 = Super!</div>
<div class="credit">Fitur by: Lynx · Saluran: <a href="https://whatsapp.com/channel/0029VbCt25oHVvTfEwfLOu1G" target="_blank" rel="noopener noreferrer">WhatsApp Channel</a></div>
</div>
<script>
window.onerror=function(m,s,l){var e=document.querySelector('.hint');if(e){e.textContent='⚠ '+m+' @'+l;e.style.color='#ff7a8a'}};
(function(){
var cv=document.getElementById('cv'),x=cv.getContext('2d'),W=404,H=300;
var DPR=2;cv.width=W*DPR;cv.height=H*DPR;
var cgEl=document.getElementById('cg'),sgEl=document.getElementById('sg'),bgEl=document.getElementById('bg');
var BEST=0;try{BEST=parseInt(localStorage.getItem('mario_best')||'0',10)||0}catch(e){}
bgEl.textContent=BEST;
function saveBest(){try{localStorage.setItem('mario_best',String(BEST))}catch(e){}}

/* ============ AUDIO ============ */
var AC=null,MUTED=false;
try{MUTED=localStorage.getItem('mario_mute')==='1'}catch(e){}
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(AC&&AC.state==='suspended'){try{AC.resume()}catch(e){}}return AC}
function tone(f,d,t,v,at,sl){var a=AC;if(!a||MUTED)return;try{var n=a.currentTime+(at||0),o=a.createOscillator(),g=a.createGain();o.type=t||'square';o.frequency.setValueAtTime(f,n);if(sl)o.frequency.exponentialRampToValueAtTime(sl,n+d);g.gain.setValueAtTime(v||.1,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(g);g.connect(a.destination);o.start(n);o.stop(n+d+.03)}catch(e){}}
function noiz(d,v,at,fc){var a=AC;if(!a||MUTED)return;try{var n=a.currentTime+(at||0),len=Math.floor(a.sampleRate*d),b=a.createBuffer(1,len,a.sampleRate),c=b.getChannelData(0),i;for(i=0;i<len;i++)c[i]=Math.random()*2-1;var s=a.createBufferSource(),g=a.createGain(),f=a.createBiquadFilter();s.buffer=b;f.type='lowpass';f.frequency.value=fc||1200;g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);s.connect(f);f.connect(g);g.connect(a.destination);s.start(n);s.stop(n+d+.03)}catch(e){}}

/* ============ SFX ============ */
function sJump(){tone(400,.09,'square',.11,0,900);tone(200,.05,'square',.06)}
function sCoin(){tone(988,.05,'square',.11);tone(1319,.18,'square',.11,.05)}
function sStomp(){tone(180,.1,'square',.13,0,90);noiz(.08,.12,0,800)}
function sPower(){[523,659,784,1047,1319,1568,2093].forEach(function(f,i){tone(f,.1,'square',.1,i*.06)})}
function sBrick(){noiz(.14,.2,0,2200);tone(220,.06,'square',.1,0,80)}
function sHurt(){tone(600,.1,'sawtooth',.14,0,150);tone(430,.16,'sawtooth',.12,.09,80)}
function sDie(){[523,392,330,262,196,131].forEach(function(f,i){tone(f,.22,'square',.13,i*.14)});noiz(.5,.2,.84,300)}
function sFlag(){[659,784,988,1175,1319,1568,1976].forEach(function(f,i){tone(f,.12,'square',.1,i*.08)})}
function sReady(){tone(1319,.07,'sine',.12);tone(1760,.12,'sine',.1,.06)}

/* ============ MUSIC ============ */
var mStep=0,mNext=0,MUSH=false;
var LEAD=[659,659,0,659,0,523,659,0,784,0,0,0,392,0,0,0];
var BASS=[131,0,131,0,175,0,196,0,131,0,131,0,175,0,196,0];
function mTick(){
var a=AC;if(!a)return;
var SPB=60/155/2;
while(mNext<a.currentTime+.15){
var s=mStep%16,at=Math.max(0,mNext-a.currentTime);
if(s%4===0){noiz(.04,.09,at,3000);tone(120,.05,'triangle',.08,at)}
var b=BASS[s];if(b)tone(b,.16,'triangle',.09,at);
var l=LEAD[s];if(l){tone(l,.14,'square',MUSH?.06:.045,at);tone(l*2,.1,'square',.02,at+SPB*.4)}
mStep++;mNext+=SPB;
}}
setInterval(function(){var a=AC;if(!a)return;if(state!=='play'){mNext=a.currentTime+.06;return}mTick()},40);

/* ============ STATE ============ */
var state='ready',score=0,coins=0,best=BEST;
var camX=0,shake=0,flash=0,wflash=0,iframe=0,frame=0,overT=0,bestNew=false,banner=null;
var stageClearT=0,stageNum=1,hitstop=0;
var GRAV=0.65,JUMP_V=-11.8,RUN_SPD=3.4,DASH_SPD=6.2,MAX_FALL=14;
var PX=70,PY=250,PVX=0,PVY=0,onGround=true,big=false,starT=0,dashT=0,
facing=1,walkAnim=0,jumpHeld=false,jumpT=0,diedAnim=0;
var WORLD_Y=250;

/* ============ WORLD ============ */
var blocks=[],enemies=[],coinList=[],flag=null,particles=[],pops=[],bumps=[],items=[],clouds=[];
var LEVEL_LEN=4100;

function addBrick(bx,by,type,item){blocks.push({type:type,x:bx,y:by,w:24,h:24,hit:false,item:item||null,bump:0})}
function addPipe(bx,height){var py=WORLD_Y-height*16;blocks.push({type:'pipe',x:bx,y:py,w:32,h:height*16,hit:false})}
function addCoins(bx,count,wy){for(var i=0;i<count;i++)coinList.push({x:bx+i*22,y:wy||WORLD_Y-70,got:false,ph:Math.random()*6})}
function addGoomba(bx){enemies.push({x:bx,y:WORLD_Y-20,vx:-0.8,vy:0,alive:true,ph:Math.random()*6,dying:0})}

function buildLevel(){
blocks=[];enemies=[];coinList=[];bumps=[];items=[];flag=null;
addCoins(180,3,WORLD_Y-60);
addBrick(320,WORLD_Y-90,'brick');
addBrick(344,WORLD_Y-90,'question','coin');
addBrick(368,WORLD_Y-90,'brick');
addBrick(392,WORLD_Y-90,'brick');
addBrick(392,WORLD_Y-114,'brick');
addBrick(416,WORLD_Y-90,'question','mushroom');
addBrick(440,WORLD_Y-90,'brick');
addGoomba(500);addGoomba(560);
addPipe(640,2);
addCoins(720,4,WORLD_Y-100);
addBrick(720,WORLD_Y-130,'brick');
addBrick(744,WORLD_Y-130,'question','coin');
addBrick(768,WORLD_Y-130,'brick');
addGoomba(850);
addPipe(900,3);
for(var i=0;i<4;i++){for(var j=0;j<=i;j++){addBrick(1000+i*24,WORLD_Y-24-j*24,'brick')}}
addGoomba(1150);addGoomba(1200);
addCoins(1150,4,WORLD_Y-100);
addBrick(1300,WORLD_Y-110,'question','mushroom');
addBrick(1324,WORLD_Y-110,'brick');
addBrick(1348,WORLD_Y-110,'brick');
addPipe(1420,2);
addCoins(1480,3,WORLD_Y-90);
addGoomba(1540);addGoomba(1560);
addBrick(1640,WORLD_Y-90,'brick');
addBrick(1664,WORLD_Y-90,'question','coin');
addBrick(1688,WORLD_Y-90,'brick');
addGoomba(1760);
addPipe(1840,2);
addCoins(1900,5,WORLD_Y-80);
addBrick(2000,WORLD_Y-90,'brick');
addBrick(2024,WORLD_Y-90,'brick');
addBrick(2048,WORLD_Y-90,'question','coin');
addBrick(2072,WORLD_Y-90,'brick');
addGoomba(2150);addGoomba(2170);
addPipe(2250,3);
addCoins(2320,4,WORLD_Y-100);
for(i=0;i<6;i++)addBrick(2440+i*24,WORLD_Y-90,'brick');
addBrick(2464,WORLD_Y-90,'question','mushroom');
addGoomba(2600);addGoomba(2650);
addCoins(2700,4,WORLD_Y-80);
addPipe(2800,2);
addBrick(2900,WORLD_Y-90,'brick');
addBrick(2924,WORLD_Y-90,'question','coin');
addBrick(2948,WORLD_Y-90,'brick');
addGoomba(3050);addGoomba(3070);
addCoins(3150,5,WORLD_Y-90);
addPipe(3250,3);
addGoomba(3400);
addBrick(3480,WORLD_Y-90,'brick');
addBrick(3504,WORLD_Y-90,'question','mushroom');
addBrick(3528,WORLD_Y-90,'brick');
addGoomba(3650);addGoomba(3670);
for(i=0;i<6;i++){for(j=0;j<=i;j++){addBrick(3800+i*24,WORLD_Y-24-j*24,'brick')}}
flag={x:3980,y:WORLD_Y-140,h:140,reached:false,anim:0};
LEVEL_LEN=4100;
}

function reset(){
score=0;coins=0;camX=0;shake=0;flash=0;iframe=0;overT=0;bestNew=false;banner=null;
PX=70;PY=WORLD_Y;PVX=0;PVY=0;onGround=true;big=false;starT=0;dashT=0;
facing=1;walkAnim=0;jumpHeld=false;jumpT=0;diedAnim=0;
particles=[];pops=[];bumps=[];items=[];
stageClearT=0;
cgEl.textContent='0';sgEl.textContent='0';
buildLevel();
}

/* ============ INPUT ============ */
function jumpPress(){
ac();
if(state==='ready'){state='play';reset();return}
if(state==='dead'){if(performance.now()-overT>800){state='play';reset()}return}
if(state==='clear'){if(stageClearT>90){stageNum++;state='play';reset()}return}
if(onGround){PVY=JUMP_V;onGround=false;jumpHeld=true;jumpT=0;sJump()}
}
function jumpRelease(){jumpHeld=false}
function doDash(){
ac();
if(state!=='play')return;
if(onGround&&dashT<=0){dashT=18;PVX+=facing*3;sPower()}
}
document.getElementById('jumpB').addEventListener('pointerdown',function(e){e.preventDefault();jumpPress()});
document.getElementById('jumpB').addEventListener('pointerup',function(e){e.preventDefault();jumpRelease()});
document.getElementById('jumpB').addEventListener('pointerleave',jumpRelease);
document.getElementById('runB').addEventListener('pointerdown',function(e){e.preventDefault();doDash()});
document.addEventListener('pointerdown',function(e){if(e.target.closest('.pads,.mbtn'))return;if(e.clientX<innerWidth/2)doDash();else jumpPress()});
document.addEventListener('pointerup',function(e){jumpRelease()});
document.addEventListener('keydown',function(e){
if((e.code==='Space'||e.code==='ArrowUp')&&!e.repeat){e.preventDefault();jumpPress()}
if((e.code==='ShiftLeft'||e.code==='KeyX')&&!e.repeat){e.preventDefault();doDash()}
});
document.addEventListener('keyup',function(e){if(e.code==='Space'||e.code==='ArrowUp')jumpRelease()});

var mb=document.getElementById('muteB');
mb.addEventListener('pointerdown',function(e){
e.preventDefault();e.stopPropagation();
MUTED=!MUTED;mb.textContent=MUTED?'🔇':'🔊';
try{localStorage.setItem('mario_mute',MUTED?'1':'0')}catch(e2){}
if(!MUTED)ac();
});
if(MUTED)mb.textContent='🔇';

/* ============ FX ============ */
function burst(px,py,n,c){for(var i=0;i<n;i++)particles.push({x:px,y:py,vx:(Math.random()-.5)*8,vy:-Math.random()*6-1,life:1,c:c,s:2+Math.random()*3})}
function popup(sx,sy,txt,c){pops.push({sx:sx,sy:sy,t:1,txt:txt,c:c})}
function spawnMushroom(sx,sy){items.push({x:sx,y:sy,vx:1,vy:0})}

/* ============ UPDATE ============ */
function update(){
frame++;
shake=Math.max(0,shake-.5);
flash=Math.max(0,flash-.035);
wflash=Math.max(0,wflash-.06);
if(iframe>0)iframe--;
if(starT>0)starT--;
if(dashT>0)dashT--;
if(banner){banner.t+=.016;if(banner.t>1.2)banner=null}
for(var i=particles.length-1;i>=0;i--){var q=particles[i];q.x+=q.vx;q.y+=q.vy;q.vy+=.35;q.vx*=.98;if((q.life-=.025)<=0)particles.splice(i,1)}
for(i=pops.length-1;i>=0;i--){if((pops[i].t-=.03)<=0)pops.splice(i,1)}
clouds.forEach(function(c){c.x-=c.s*(state==='play'?.6:.2);if(c.x<-80)c.x=W+80});
for(i=bumps.length-1;i>=0;i--){var b=bumps[i];b.t+=.14;if(b.t>=1)bumps.splice(i,1)}

if(state==='clear'){stageClearT++;if(stageClearT===1)sFlag();PX+=1.5;return}
if(state==='dead'){diedAnim++;PVY+=GRAV;PY+=PVY;return}
if(state!=='play')return;

var targetSpeed=RUN_SPD;
if(dashT>0){targetSpeed=DASH_SPD;if(frame%2===0)particles.push({x:PX-12,y:PY-10,vx:-2,vy:-.5,life:.4,c:'#ffd75e',s:2})}
if(starT>0)targetSpeed+=2;
PVX+=(targetSpeed-PVX)*.15;
if(jumpHeld&&jumpT<14&&PVY<0){PVY-=.4;jumpT++}
PVY+=GRAV;
if(PVY>MAX_FALL)PVY=MAX_FALL;
PX+=PVX;
PY+=PVY;
walkAnim+=Math.abs(PVX)*.12;

/* ground + block collision */
var pW=big?14:12,pH=big?38:30;
var pLeft=PX-pW/2,pRight=PX+pW/2,pTop=PY-pH,pBot=PY;
onGround=false;
if(PY>=WORLD_Y){PY=WORLD_Y;PVY=0;onGround=true}
for(i=0;i<blocks.length;i++){
var bl=blocks[i];
var bl_=bl.x,br=bl.x+bl.w,bt=bl.y,bb=bl.y+bl.h;
if(pRight<=bl_||pLeft>=br||pBot<=bt||pTop>=bb)continue;
var overlapX=Math.min(pRight-bl_,br-pLeft);
var overlapY=Math.min(pBot-bt,bb-pTop);
if(overlapY<overlapX){
if(PY<(bt+bb)/2){
PY=bt;PVY=0;onGround=true;
}else{
PY=bb+pH;PVY=1;
if(bl.type==='brick'||bl.type==='question'){
if(!bl.hit){
bl.hit=true;bl.bump=1;
bumps.push({x:bl.x+12,y:bl.y,t:0});
if(bl.type==='question'){
if(bl.item==='mushroom'){spawnMushroom(bl.x+12,bl.y-24);sPower()}
else{coins++;score+=200;cgEl.textContent=coins;sCoin();popup(bl.x+12-camX,bl.y-40,'+200','#ffd75e')}
bl.type='used';
}else{
sBrick();burst(bl.x+12-camX,bl.y,8,'#c88a4a');
score+=50;blocks.splice(i,1);i--;
}}
}}
}else{
if(PX<bl_+bl.w/2){PX=bl_-pW/2}
else{PX=br+pW/2}
PVX=0;
}
}

/* enemies */
for(i=enemies.length-1;i>=0;i--){
var en=enemies[i];
if(!en.alive){en.dying++;if(en.dying>30)enemies.splice(i,1);continue}
en.x+=en.vx;
var eStand=WORLD_Y;
for(var k=0;k<blocks.length;k++){
var bk=blocks[k];
if(en.x+10>bk.x&&en.x-10<bk.x+bk.w){
if(bk.y+24<=eStand&&bk.y+24>0)eStand=Math.min(eStand,bk.y+bk.h);
}}
en.y=eStand-20;
for(k=0;k<blocks.length;k++){
var bp=blocks[k];
if(bp.type==='pipe'&&en.x+10>bp.x&&en.x-10<bp.x+bp.w&&en.y+20>bp.y&&en.y<bp.y+bp.h){
if(en.vx>0)en.x=bp.x-10;else en.x=bp.x+bp.w+10;
en.vx*=-1;
}}
var dx=Math.abs(en.x-PX),dy=Math.abs((en.y+10)-PY);
if(dx<20&&dy<22){
if(PVY>0.5&&PY<en.y+12){
en.alive=false;en.dying=0;score+=100;PVY=-8;hitstop=4;
sStomp();burst(en.x-camX,en.y,10,'#8a4a2a');
popup(en.x-camX,en.y-30,'+100','#ffd75e');
}else if(starT>0){
en.alive=false;en.dying=0;score+=200;
sStomp();burst(en.x-camX,en.y,12,'#ffd75e');
}else if(iframe<=0){hurtPlayer()}
}
}

/* items */
for(i=items.length-1;i>=0;i--){
var it=items[i];
it.x+=it.vx;it.vy+=GRAV;it.y+=it.vy;
if(it.y>=WORLD_Y-4){it.y=WORLD_Y-4;it.vy=0}
for(k=0;k<blocks.length;k++){
var bl2=blocks[k];
if(it.x+8>bl2.x&&it.x-8<bl2.x+bl2.w&&it.y+16>bl2.y&&it.y<bl2.y+bl2.h){
if(it.vy>0){it.y=bl2.y-16;it.vy=0}
if(it.vx>0&&it.x+8>bl2.x&&it.x<bl2.x)it.vx*=-1;
else if(it.vx<0&&it.x-8<bl2.x+bl2.w&&it.x>bl2.x+bl2.w)it.vx*=-1;
}}
var ddx=Math.abs(it.x-PX),ddy=Math.abs(it.y-PY);
if(ddx<20&&ddy<26){
if(!big){big=true;banner={t:0,txt:'SUPER MARIO!'}}
else{score+=1000;popup(PX-camX,PY-40,'+1000','#ffd75e')}
sPower();burst(it.x-camX,it.y,16,'#4bd54b');
items.splice(i,1);
}
if(it.x<camX-100||it.x>camX+W+100)items.splice(i,1);
}

/* coins */
for(i=coinList.length-1;i>=0;i--){
var c=coinList[i];
if(c.got)continue;
c.ph+=.15;
var cdx=Math.abs(c.x-PX),cdy=Math.abs(c.y-PY);
if(cdx<20&&cdy<28){
c.got=true;coins++;score+=100;cgEl.textContent=coins;
sCoin();burst(c.x-camX,c.y,6,'#ffd75e');
popup(c.x-camX,c.y-20,'+100','#ffd75e');
coinList.splice(i,1);
}
}

/* flag */
if(flag&&!flag.reached){
flag.anim+=.05;
if(PX>flag.x-10){
flag.reached=true;state='clear';stageClearT=0;
score+=2000;banner={t:0,txt:'STAGE CLEAR!'};
sFlag();
}
}

/* camera */
var targetCam=PX-120;
if(flag)targetCam=Math.min(targetCam,flag.x-160);
camX=Math.max(0,targetCam);

if(frame%6===0)sgEl.textContent=score;
if(PY>H+40)dieGame();
}

function hurtPlayer(){
if(iframe>0||starT>0)return;
if(big){
big=false;iframe=90;
sHurt();shake=8;flash=.5;PVY=-4;
popup(PX-camX,PY-40,'OUCH!','#ff5c7a');
}else dieGame();
}
function dieGame(){
if(state==='dead')return;
state='dead';overT=performance.now();
PVY=-9;diedAnim=0;
sDie();shake=14;flash=1;
burst(PX-camX,PY-10,30,'#ff5563');
if(score>best){best=score;bgEl.textContent=best;saveBest();bestNew=true}
}

/* ============ HELPERS ============ */
function ell(px,py,rx,ry){x.beginPath();x.ellipse(px,py,rx,ry,0,0,7);x.fill()}
function rr(px,py,w2,h2,r2){x.beginPath();x.moveTo(px+r2,py);x.lineTo(px+w2-r2,py);x.quadraticCurveTo(px+w2,py,px+w2,py+r2);x.lineTo(px+w2,py+h2-r2);x.quadraticCurveTo(px+w2,py+h2,px+w2-r2,py+h2);x.lineTo(px+r2,py+h2);x.quadraticCurveTo(px,py+h2,px,py+h2-r2);x.lineTo(px,py+r2);x.quadraticCurveTo(px,py,px+r2,py);x.closePath()}

/* ============ DRAW ============ */
function draw(){
x.setTransform(DPR,0,0,DPR,0,0);
if(shake>0)x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake*.7);
var sky=x.createLinearGradient(0,0,0,250);
sky.addColorStop(0,'#4a7ac8');sky.addColorStop(.5,'#7db8ea');sky.addColorStop(1,'#bfe0f0');
x.fillStyle=sky;x.fillRect(0,0,W,H);
clouds.forEach(function(c){
x.fillStyle='rgba(255,255,255,.85)';
ell(c.x,c.y,c.w/2,10);
ell(c.x+c.w*.25,c.y-6,c.w*.3,8);
ell(c.x-c.w*.25,c.y-3,c.w*.28,7);
});
x.fillStyle='#6ba050';
x.beginPath();x.moveTo(0,H);
for(var hx=0;hx<=W;hx+=20){var wx2=hx+camX*.15;x.lineTo(hx,WORLD_Y+20-Math.sin(wx2*.008)*18-Math.sin(wx2*.02)*6)}
x.lineTo(W,H);x.fill();
x.fillStyle='#7ab85c';
x.beginPath();x.moveTo(0,H);
for(hx=0;hx<=W;hx+=20){wx2=hx+camX*.28;x.lineTo(hx,WORLD_Y+30-Math.sin(wx2*.006+1)*22-Math.sin(wx2*.017+2)*8)}
x.lineTo(W,H);x.fill();
for(hx=Math.floor((camX*.4)/180)*180;hx<camX*.4+W+180;hx+=180){
var bx2=hx-camX*.4;
x.fillStyle='#3a8a3a';
ell(bx2,WORLD_Y+10,26,14);ell(bx2+20,WORLD_Y+10,22,12);ell(bx2-20,WORLD_Y+10,22,12);
x.fillStyle='#4aa84a';
ell(bx2-4,WORLD_Y+6,18,10);ell(bx2+16,WORLD_Y+7,15,9);
}
var gg=x.createLinearGradient(0,WORLD_Y,0,H);
gg.addColorStop(0,'#c87838');gg.addColorStop(.15,'#a85828');gg.addColorStop(1,'#7a3a14');
x.fillStyle=gg;x.fillRect(0,WORLD_Y,W,H-WORLD_Y);
x.strokeStyle='rgba(0,0,0,.15)';x.lineWidth=1;
for(var gx=Math.floor(camX/24)*24;gx<camX+W+24;gx+=24){
var sx=gx-camX;
x.beginPath();x.moveTo(sx,WORLD_Y);x.lineTo(sx,WORLD_Y+18);x.stroke();
x.beginPath();x.moveTo(sx,WORLD_Y+18);x.lineTo(sx+12,WORLD_Y+18);x.stroke();
x.beginPath();x.moveTo(sx+12,WORLD_Y+18);x.lineTo(sx+12,WORLD_Y+36);x.stroke();
x.beginPath();x.moveTo(sx+12,WORLD_Y+36);x.lineTo(sx+24,WORLD_Y+36);x.stroke();
x.beginPath();x.moveTo(sx+24,WORLD_Y+36);x.lineTo(sx+24,WORLD_Y+54);x.stroke();
}
x.fillStyle='#4aa838';x.fillRect(0,WORLD_Y,W,6);

if(flag){
var fx=flag.x-camX;
x.fillStyle='#a0a0a8';x.fillRect(fx,flag.y,6,flag.h);
x.fillStyle='#c8c8d0';x.fillRect(fx,flag.y,3,flag.h);
x.fillStyle='#e8e8f0';ell(fx+3,flag.y-4,6,6);
x.fillStyle='#ffd75e';ell(fx+3,flag.y-4,3,3);
var wave=Math.sin(frame*.1)*3;
x.fillStyle='#ff3030';
x.beginPath();x.moveTo(fx+6,flag.y+8);x.lineTo(fx+50+wave,flag.y+20);x.lineTo(fx+50+wave,flag.y+40);x.lineTo(fx+6,flag.y+50);x.closePath();x.fill();
x.fillStyle='#ff6060';
x.beginPath();x.moveTo(fx+6,flag.y+8);x.lineTo(fx+50+wave,flag.y+20);x.lineTo(fx+6,flag.y+30);x.closePath();x.fill();
x.fillStyle='#ffd75e';x.font='900 16px Arial';x.textAlign='center';
x.fillText('★',fx+30,flag.y+32);x.textAlign='left';
}

blocks.forEach(function(bl){
var bx2=bl.x-camX;if(bx2<-40||bx2>W+40)return;
var bumpOff=0;
for(var bi=0;bi<bumps.length;bi++){if(Math.abs(bumps[bi].x-bl.x-12)<2&&Math.abs(bumps[bi].y-bl.y)<2){bumpOff=-Math.sin(bumps[bi].t*Math.PI)*6}}
if(bl.type==='brick'){
x.fillStyle='#c87838';x.fillRect(bx2,bl.y+bumpOff,bl.w,bl.h);
x.fillStyle='#a85828';
x.fillRect(bx2+1,bl.y+bumpOff+1,bl.w/2-2,bl.h/2-2);
x.fillRect(bx2+bl.w/2+1,bl.y+bumpOff+1,bl.w/2-2,bl.h/2-2);
x.fillRect(bx2+1,bl.y+bumpOff+bl.h/2+1,bl.w/2-2,bl.h/2-2);
x.fillRect(bx2+bl.w/2+1,bl.y+bumpOff+bl.h/2+1,bl.w/2-2,bl.h/2-2);
x.strokeStyle='#7a3a14';x.lineWidth=1.5;x.strokeRect(bx2,bl.y+bumpOff,bl.w,bl.h);
}else if(bl.type==='question'){
var qBump=bl.hit?0:Math.sin(frame*.1)*1;
x.fillStyle='#e8a020';x.fillRect(bx2,bl.y+qBump,bl.w,bl.h);
x.fillStyle='#ffd060';x.fillRect(bx2+1,bl.y+qBump+1,bl.w-2,bl.h/2-2);
x.strokeStyle='#7a4a0a';x.lineWidth=2;x.strokeRect(bx2,bl.y+qBump,bl.w,bl.h);
x.fillStyle='#7a4a0a';
x.fillRect(bx2+2,bl.y+qBump+2,2,2);x.fillRect(bx2+bl.w-4,bl.y+qBump+2,2,2);
x.fillRect(bx2+2,bl.y+qBump+bl.h-4,2,2);x.fillRect(bx2+bl.w-4,bl.y+qBump+bl.h-4,2,2);
x.fillStyle='#fff';x.font='900 15px Arial';x.textAlign='center';
x.fillText('?',bx2+bl.w/2,bl.y+qBump+17);x.textAlign='left';
}else if(bl.type==='used'){
x.fillStyle='#8a6a3a';x.fillRect(bx2,bl.y,bl.w,bl.h);
x.fillStyle='#6a4a1a';x.fillRect(bx2+1,bl.y+1,bl.w-2,bl.h-2);
x.strokeStyle='#4a2a0a';x.lineWidth=1.5;x.strokeRect(bx2,bl.y,bl.w,bl.h);
}else if(bl.type==='pipe'){
var pg=x.createLinearGradient(bx2,0,bx2+bl.w,0);
pg.addColorStop(0,'#1a7a1a');pg.addColorStop(.3,'#4ad44a');pg.addColorStop(.7,'#2aa82a');pg.addColorStop(1,'#0a5a0a');
x.fillStyle=pg;x.fillRect(bx2+2,bl.y+10,bl.w-4,bl.h-10);
x.fillStyle=pg;x.fillRect(bx2,bl.y,bl.w,14);
x.fillStyle='#0a4a0a';x.fillRect(bx2,bl.y+12,bl.w,2);
x.fillStyle='#0a4a0a';x.fillRect(bx2+2,bl.y+10,2,bl.h-10);
x.fillStyle='#0a4a0a';x.fillRect(bx2+bl.w-4,bl.y+10,2,bl.h-10);
x.fillStyle='rgba(200,255,200,.4)';x.fillRect(bx2+8,bl.y+14,3,bl.h-14);
x.fillRect(bx2+8,bl.y+2,3,8);
}
});

coinList.forEach(function(c){
if(c.got)return;
var cx2=c.x-camX;if(cx2<-20||cx2>W+20)return;
var w2=Math.abs(Math.sin(c.ph))*5+1;
var cy2=c.y+Math.sin(frame*.08+c.ph)*1.5;
x.fillStyle='rgba(0,0,0,.15)';ell(cx2,cy2+14,w2,2);
x.fillStyle='#e8a020';x.beginPath();x.ellipse(cx2,cy2,w2,11,0,0,7);x.fill();
x.fillStyle='#ffd75e';x.beginPath();x.ellipse(cx2,cy2,w2*.7,10,0,0,7);x.fill();
x.fillStyle='rgba(255,255,255,.7)';x.beginPath();x.ellipse(cx2-1,cy2-3,w2*.25,4,0,0,7);x.fill();
if((frame+Math.floor(c.ph*10))%70<10){
x.fillStyle='#fff';x.save();x.translate(cx2+8,cy2-6);x.rotate(frame*.1);
x.beginPath();x.moveTo(0,-3);x.lineTo(1,-1);x.lineTo(3,0);x.lineTo(1,1);x.lineTo(0,3);x.lineTo(-1,1);x.lineTo(-3,0);x.lineTo(-1,-1);x.closePath();x.fill();x.restore();
}
});

items.forEach(function(it){
var ix=it.x-camX;
x.fillStyle='#ff2020';x.beginPath();x.arc(ix,it.y-4,9,Math.PI,0);x.fill();
x.fillStyle='#ff5050';x.beginPath();x.arc(ix-2,it.y-6,4,Math.PI,0);x.fill();
x.fillStyle='#fff';ell(ix-4,it.y-6,2.5,2.5);ell(ix+4,it.y-6,2.5,2.5);ell(ix,it.y-9,2,2);
x.fillStyle='#f2c99a';x.fillRect(ix-5,it.y-4,10,8);
x.fillStyle='#000';x.fillRect(ix-3,it.y-1,1.5,2);x.fillRect(ix+2,it.y-1,1.5,2);
});

enemies.forEach(function(en){
var ex2=en.x-camX;if(ex2<-40||ex2>W+40)return;
if(!en.alive){
var sq=Math.min(1,en.dying/8);
x.globalAlpha=1-en.dying/30;
x.fillStyle='#8a4a2a';x.fillRect(ex2-10,en.y+14,20,6*(1-sq));
x.globalAlpha=1;return;
}
x.fillStyle='rgba(0,0,0,.15)';ell(ex2,en.y+20,12,3);
x.fillStyle='#3a2a1a';ell(ex2-6,en.y+18,4,3);ell(ex2+6,en.y+18,4,3);
var eg=x.createRadialGradient(ex2-3,en.y+2,2,ex2,en.y+8,13);
eg.addColorStop(0,'#b86a3a');eg.addColorStop(.6,'#8a4a2a');eg.addColorStop(1,'#5a2a14');
x.fillStyle=eg;x.beginPath();x.arc(ex2,en.y+8,12,0,7);x.fill();
x.fillStyle='#a05a2a';x.beginPath();x.arc(ex2,en.y+4,10,Math.PI,0);x.fill();
x.fillStyle='#fff';ell(ex2-4,en.y+6,3,4);ell(ex2+4,en.y+6,3,4);
x.fillStyle='#111';ell(ex2-4+en.vx*.5,en.y+6,1.6,2.5);ell(ex2+4+en.vx*.5,en.y+6,1.6,2.5);
x.strokeStyle='#3a1a0a';x.lineWidth=2;
x.beginPath();x.moveTo(ex2-8,en.y+2);x.lineTo(ex2-2,en.y+4);x.stroke();
x.beginPath();x.moveTo(ex2+8,en.y+2);x.lineTo(ex2+2,en.y+4);x.stroke();
x.fillStyle='#2a1a0a';x.fillRect(ex2-3,en.y+13,6,1.5);
});

if(state!=='dead'||diedAnim<60)drawMario();

particles.forEach(function(p2){x.globalAlpha=Math.max(p2.life,0);x.fillStyle=p2.c;x.fillRect(p2.x-camX,p2.y,p2.s,p2.s)});
x.globalAlpha=1;

pops.forEach(function(p3){
x.globalAlpha=Math.max(0,p3.t);
x.font='900 12px Arial';x.textAlign='center';
var py3=p3.sy-(1-p3.t)*18;
x.lineWidth=3;x.strokeStyle='rgba(10,20,50,.7)';x.strokeText(p3.txt,p3.sx,py3);
x.fillStyle=p3.c;x.fillText(p3.txt,p3.sx,py3);
});
x.globalAlpha=1;x.textAlign='left';

if(banner){
var bt=banner.t,k=Math.min(bt*4,1),al=bt>1?(1.2-bt)/.2:1,sc=1+(1-k)*.6;
x.save();x.translate(W/2,90);x.scale(sc,sc);x.globalAlpha=Math.max(0,al*k);
x.font='900 22px Arial';x.textAlign='center';
x.lineWidth=5;x.strokeStyle='rgba(10,20,50,.85)';x.strokeText(banner.txt,0,0);
var tg3=x.createLinearGradient(0,-20,0,8);tg3.addColorStop(0,'#fff3b0');tg3.addColorStop(.5,'#ffd75e');tg3.addColorStop(1,'#ff9a3c');
x.fillStyle=tg3;x.fillText(banner.txt,0,0);
x.restore();x.globalAlpha=1;x.textAlign='left';
}

if(state==='ready'){
x.fillStyle='rgba(2,8,26,.55)';x.fillRect(0,0,W,H);
x.textAlign='center';
x.font='900 30px Arial';x.lineWidth=6;x.strokeStyle='rgba(8,16,40,.9)';
x.strokeText('SUPER MARIO',W/2,110);
var tg4=x.createLinearGradient(0,86,0,116);
tg4.addColorStop(0,'#ffe080');tg4.addColorStop(.55,'#ff5050');tg4.addColorStop(1,'#a01020');
x.fillStyle=tg4;x.fillText('SUPER MARIO',W/2,110);
x.font='700 10px Arial';x.fillStyle='#9fd8ff';x.fillText('RUN · JUMP · STOMP · COLLECT',W/2,130);
if(BEST>0){x.font='bold 11px monospace';x.fillStyle='#ffd75e';x.fillText('BEST: '+BEST,W/2,154)}
x.font='900 15px Arial';x.fillStyle='rgba(255,255,255,'+(.55+.45*Math.sin(frame*.09))+')';x.fillText('TAP UNTUK MULAI',W/2,182);
x.font='600 9px Arial';x.fillStyle='#7a9cc8';x.fillText('🍄 = Super · 👟 Stomp Goomba · 🚩 Finish = Clear',W/2,204);
x.textAlign='left';
}

if(state==='clear'){
x.fillStyle='rgba(2,8,26,.4)';x.fillRect(0,0,W,H);
x.textAlign='center';
x.font='900 26px Arial';x.lineWidth=6;x.strokeStyle='rgba(8,16,40,.9)';
x.strokeText('STAGE CLEAR!',W/2,100);
var tg5=x.createLinearGradient(0,80,0,106);
tg5.addColorStop(0,'#fff3b0');tg5.addColorStop(.5,'#ffd75e');tg5.addColorStop(1,'#ff9a3c');
x.fillStyle=tg5;x.fillText('STAGE CLEAR!',W/2,100);
x.font='bold 12px monospace';x.fillStyle='#eaf2ff';
x.fillText('SCORE '+score+'  ·  COINS '+coins,W/2,128);
if(stageClearT>90){
x.font='900 13px Arial';x.fillStyle='rgba(255,255,255,'+(.55+.45*Math.sin(frame*.1))+')';
x.fillText('tap untuk LEVEL '+(stageNum+1),W/2,158);
}else{
x.font='700 11px Arial';x.fillStyle='rgba(255,255,255,'+(.4+.4*Math.sin(frame*.2))+')';
x.fillText('...',W/2,158);
}
x.textAlign='left';
}

if(state==='dead'&&diedAnim>30){
x.fillStyle='rgba(2,8,26,.5)';x.fillRect(0,0,W,H);
rr(52,80,300,120,14);x.fillStyle='rgba(8,18,46,.9)';x.fill();
x.strokeStyle='rgba(255,75,75,.45)';x.lineWidth=2;x.stroke();
x.textAlign='center';
x.font='900 25px Arial';
var dg3=x.createLinearGradient(0,96,0,120);dg3.addColorStop(0,'#ff8aa0');dg3.addColorStop(1,'#d61f3e');
x.fillStyle=dg3;x.fillText('GAME OVER',W/2,116);
x.font='bold 12px monospace';x.fillStyle='#eaf2ff';x.fillText('SCORE '+score+'  ·  COINS '+coins,W/2,144);
if(bestNew){x.fillStyle='rgba(255,215,94,'+(.6+.4*Math.sin(frame*.2))+')';x.font='900 13px Arial';x.fillText('★ NEW BEST: '+best+' ★',W/2,164)}
else{x.fillStyle='#9fd8ff';x.font='bold 12px monospace';x.fillText('BEST: '+best,W/2,164)}
if(performance.now()-overT>800){
x.font='700 11px Arial';x.fillStyle='rgba(255,255,255,'+(.5+.5*Math.sin(frame*.1))+')';x.fillText('tap untuk main lagi',W/2,188);
}
x.textAlign='left';
}

if(flash>0){x.fillStyle='rgba(255,80,80,'+(flash*.3)+')';x.fillRect(0,0,W,H)}
if(wflash>0){x.fillStyle='rgba(255,255,255,'+(wflash*.25)+')';x.fillRect(0,0,W,H)}

x.font='bold 9px monospace';
x.fillStyle='rgba(255,255,255,.75)';
x.textAlign='right';x.fillText('STAGE '+stageNum,W-10,26);x.textAlign='left';
}

function drawMario(){
if(iframe>0&&Math.floor(frame/4)%2===0)return;
var px=PX-camX,py=big?PY-8:PY-7;
var blink=starT>0&&Math.floor(frame/4)%2===0;
var hh=Math.max(0,WORLD_Y-PY);
x.fillStyle='rgba(0,0,0,'+Math.max(0,.25-hh/220)+')';
ell(px,WORLD_Y+2,Math.max(4,12-hh*.03),3);
if(blink){x.globalAlpha=.5}
if(dashT>0){x.globalAlpha=.35;x.fillStyle='#ffd75e';ell(px-8,py-8,20,18);x.globalAlpha=1}
if(starT>0){x.globalAlpha=.3+.2*Math.sin(frame*.5);x.fillStyle='#ffd75e';ell(px,py-10,22,22);x.globalAlpha=1}
var bob=Math.abs(Math.sin(walkAnim))*(onGround?2:0);
if(big){
x.fillStyle='#2a4a9a';
var legOff1=Math.sin(walkAnim)*3,legOff2=Math.sin(walkAnim+Math.PI)*3;
if(!onGround){legOff1=legOff2=0}
x.fillRect(px-7+legOff1,py-4,6,10);
x.fillRect(px+1+legOff2,py-4,6,10);
x.fillStyle='#3a2010';
x.fillRect(px-9+legOff1,py+3,9,5);
x.fillRect(px-1+legOff2,py+3,9,5);
x.fillStyle='#2a4a9a';x.fillRect(px-8,py-16,16,12);
x.fillStyle='#e03030';x.fillRect(px-8,py-18,16,4);
x.fillRect(px+6,py-16,4,7);
x.fillStyle='#f2c99a';ell(px+9,py-9,3,3);
x.fillStyle='#ffd75e';ell(px-3,py-12,1.5,1.5);ell(px+3,py-12,1.5,1.5);
x.fillStyle='#f2c99a';x.fillRect(px-7,py-28+bob,14,10);
x.fillStyle='#e03030';
x.beginPath();x.moveTo(px-8,py-28+bob);x.quadraticCurveTo(px-9,py-34+bob,px-2,py-34+bob);x.quadraticCurveTo(px+6,py-34+bob,px+7,py-28+bob);x.closePath();x.fill();
x.fillRect(px-9,py-28+bob,18,3);
x.fillRect(px+1,py-26+bob,10,2);
x.fillStyle='#111';ell(px-2,py-24+bob,1.3,2);ell(px+4,py-24+bob,1.3,2);
x.fillStyle='#fff';ell(px-2,py-24.5+bob,.6,1);ell(px+4,py-24.5+bob,.6,1);
x.fillStyle='#4a2a14';x.fillRect(px-2,py-21+bob,8,2);
x.fillStyle='#e8b080';ell(px+7,py-22+bob,1.8,1.6);
}else{
x.fillStyle='#2a4a9a';
var l1=Math.sin(walkAnim)*2,l2=Math.sin(walkAnim+Math.PI)*2;
if(!onGround){l1=l2=0}
x.fillRect(px-6+l1,py-2,5,7);
x.fillRect(px+1+l2,py-2,5,7);
x.fillStyle='#3a2010';
x.fillRect(px-7+l1,py+3,7,4);
x.fillRect(px-1+l2,py+3,7,4);
x.fillStyle='#2a4a9a';x.fillRect(px-7,py-13,14,11);
x.fillStyle='#e03030';x.fillRect(px-7,py-15,14,3);
x.fillRect(px+5,py-13,3,6);
x.fillStyle='#f2c99a';ell(px+7,py-7,2.5,2.5);
x.fillStyle='#ffd75e';ell(px-2,py-9,1.2,1.2);ell(px+2,py-9,1.2,1.2);
x.fillStyle='#f2c99a';x.fillRect(px-6,py-22+bob,12,9);
x.fillStyle='#e03030';
x.beginPath();x.moveTo(px-7,py-22+bob);x.quadraticCurveTo(px-8,py-27+bob,px-1,py-27+bob);x.quadraticCurveTo(px+5,py-27+bob,px+6,py-22+bob);x.closePath();x.fill();
x.fillRect(px-8,py-22+bob,16,2.5);
x.fillRect(px+1,py-20+bob,9,2);
x.fillStyle='#111';ell(px-2,py-18+bob,1.2,1.8);ell(px+3,py-18+bob,1.2,1.8);
x.fillStyle='#4a2a14';x.fillRect(px-1,py-15+bob,6,1.8);
}
x.globalAlpha=1;
}

/* ============ INIT ============ */
for(var ci=0;ci<5;ci++)clouds.push({x:Math.random()*404,y:20+Math.random()*50,s:.15+Math.random()*.25,w:44+Math.random()*30});
buildLevel();

var perfA=0,perfN=0,perfDone=false,lastT=0;
function loop(t){
if(!perfDone&&perfN>60&&perfN<160)perfA+=(t-lastT);
if(!perfDone&&perfN===160){perfA/=100;if(perfA>22){DPR=1;cv.width=W;cv.height=H}perfDone=true}
perfN++;lastT=t;
if(hitstop>0){hitstop--;requestAnimationFrame(loop);return}
update();draw();
requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
})();
</script>`

// ==========================================
// Signature & Certificate (sama kayak sonik)
// ==========================================
const SIG = "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LVZlcmlmaWNhdGlvblNpZ25hdHVyZS5NZXRhZGF0YcN55YRyad2+ZA=="
const CERT1 = "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LUNlcnRpZmljYXRlQ2hhaW4uTWV0YWRhdGEOvtJr968bbpKdZreOTwkk9aPN++XPE60RfuzNLkXXc7LE8BOkJOWRpo2oNXaRJ3uCNJ43HY3A+oetnvHSfcxWqmvvTSrBOI5V1NOD6RMsZ/st1XVPUx83AGps1l5jYBOYzqMNy6un2tToJ2Bt9bXRo29tWLZTu8m7TNY/hISwVpVc5tjSet5U7btPN+dMIx2UvykB1jcbWGsdklheeuz8RXSStNXzeaGvsf1lpZ/ugLE4b2BdmlRNKrY6zLE4qFtRYQoS7axOyQX+4QUyN2m9bfm7urQmn+QRSXJwMO7X5kAJJLbkVGJFt9Pm9VXPwQVrK2aaqiXlpusj+7DfDw00OULmYMmZDTqXM0nUVLxj13z0LhMQoQhhNG8utdUn4uKOFceliTZ/xiP+A54GnX9620641bqw3ctfh9NNXPsTEK8hAUD7FDqUhVntHmoEYYEHq8X1tHHZYP49/f2iezTiE8AUaoZo42/jIWQIKohOGNUib2hEqMkW8NsR8vPihvNuqPc0zKZcl6359YFQdjiiW8kCRD/rsDOr9v1eYLFZKYloFyzFqEgj+jcG/V47elOjShJ5CCPwatXwP6HIloVwtgygFsnOFmCg6Ojoivfoz8Nw1qxFwg5OU2cq/1WbWNELKnaFg4eUWCAIJ/3ZIJsEPkgemZxGhE+hdiNn9dkQYBJs1kx2BxdIkJmQ9vJSKkrMz6lTxZM3IJ9mhmKS6zYdU1ppeAao0/ayte997DQParb/AHLN79g0iW1ad0z8ir5jAl0q3a+UZPTSa4YiSqC2PZ/gfxG5wvL2mKmeKowG0RXjmEp5iNxrni+T/HRLZOoH7y0DQ24nMCPg"
const CERT2 = "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LUNlcnRpZmljYXRlQ2hhaW4uTWV0YWRhdGHsL0Ccm0ELINFZ2IaBhKaeWnVuh0o6nZLCioCn9xpSADzwIS5VCWO+1eVXT2atJOyf7FYlpB0/JA3Us+aQtekuIkHu/zBXijORZ4ClF4+sF3cSTNg6gY/+6iwLK/zs3bMg+GeJrcI65vXfs95Shxlb2Rd5GRT2/2yBmR6Zkf5QwMJuptUHWtM26WY7/xlkEKGFYDZVqOSylusiOzSALa815zC6dCiHoJNLBEKMlaZZQOk57/+OYoU5zzTaEgLhyvNFHSyAlyLQ3SGFtVHAaJZHSmmSPyJowCOB+92Gkk6SWVMsk6FbU8QJWFtlhzV/W/gZ7WzUlS/AKgN0th9/cq20ToFkW7X9c+rtYavufmuieqFhXgaMD8AGsoN9QC/HzNC9D1nydPfFYEUr9BHVy2nF5gM58Y59r2rT8p5LPARIkUp8g+5DLhyW0tdZFZ1305o4AHCayZnp5rjcU2Xi/c1Qf/djBGakmijlMs4aMzKJYD0c4Q8jdI7sNyd876K2wRD+L6KeD2QB3PtCS4P7BWAl5gh5CJ6ZBrwcaKXZqcSjEwm52MqVCgYZdapAaNYUy/QndttjLOG0wxxwuX1hIhMjPnIKZR1kwnqD5EqlHpilrnojRZvjVGN4zEKmilS8rNstt4HHs/D849W+Q6LRVWiWMs0cT2IugrX+Skxd8En7Gq52UEmuVBrSTpN+UpIu20NsVb9lsvuYh3XO441606tOEY2eKcZJdTtqrOTNqbbTk0zVn1yhbOCvmfctBNDhTwaC5QMi0P9wjU5XI9SBtkdQLizc5oqpoiHeqgb8+aJHVLcbgIJ/KLZKtRWFDfzRNM02Csx4etUUapVd2NA/L0oMs/O5T9sVj9FBJ7q99GWr3PVmxJb36mHZlXC4k1gGN9swE0LtzYsUdT5tUo9ri/hS3W/SM+F1p4Kh4QIgRcG3ciIHGN44bnDh3HDCz0fDnzKYw0bclMxZPctEyJ5gEOPF6OAkjD9dEaRGq/tEPf1k9Aub+v2dEjnfrYWAm4E5Zfhs2Xh0CT0k+SzhgKd0K/46ChJ20G5+blwpIvahvTVS68+aVIX6CwXs4tcVx6FnmVsMOOkIasfaqQLZYvNBkuLoZnQAq4j8yRekrQ=="

// ==========================================
// Forward Signed Sender
// ==========================================
async function kirimForwardSigned(conn, chatId, html, judul) {
    const data = Buffer.from(JSON.stringify({
        __typename: 'GenAIUnifiedResponse',
        response_id: randomUUID(),
        sections: [{
            __typename: 'GenAIUnifiedResponseSection',
            view_model: {
                __typename: 'GenAISingleLayoutViewModel',
                primitive: {
                    __typename: 'GenAIaeacdsnwHtmlPrimitive',
                    payload: html,
                    trusted_sources: []
                }
            }
        }]
    })).toString('base64')

    return conn.relayMessage(chatId, {
        messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
            botMetadata: {
                messageDisclaimerText: "",
                botResponseId: randomUUID(),
                verificationMetadata: {
                    proofs: [{
                        version: 1,
                        useCase: 1,
                        signature: SIG,
                        certificateChain: [CERT1, CERT2]
                    }]
                }
            }
        },
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    submessages: [{
                        messageType: 2,
                        messageText: judul
                    }],
                    unifiedResponse: {
                        data
                    },
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedAiBotMessageInfo: {
                            botJid: "867051314767696@bot"
                        },
                        forwardOrigin: 4
                    }
                }
            }
        }
    }, {})
}

// ==========================================
// Handler (format legacyBridge: handler(m, { conn }))
// ==========================================
let handler = async (m, { conn }) => {
    try {
        await kirimForwardSigned(conn, m.chat, MARIO_HTML, '🍄 SUPER MARIO RETRO v1')
    } catch (e) {
        console.error('[MARIO]', e?.message || e)
        await m.reply('❌ Gagal mengirim game: ' + (e?.message || e))
    }
}

handler.help = ['mario']
handler.tags = ['game']
handler.command = /^(mario|supermario|smb|mariobros|retro)$/i

export default handler
