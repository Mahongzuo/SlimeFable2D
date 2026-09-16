import {canvas,rng,W,H} from './art';
import type {HoneyLevel} from './honey-level';
import type {Rect,SlimeSimulation} from './physics';
import {WAX_REFORM,type WaxPlatform} from './wax';
import {asset} from './asset';
import {drawPortals} from './kit/view';
type C=CanvasRenderingContext2D;
type Img=HTMLImageElement|HTMLCanvasElement;
const Y0=280;
type Prop={kind:'lantern'|'comb'|'drape'|'crystal'|'mound'|'puff';x:number;y:number;s:number;flip:number;phase:number;hang:number;sway:number;bounce:number;vSway:number;vBounce:number};
type Critter={kind:'bee'|'ant';x:number;y:number;homeX:number;homeY:number;phase:number;span:number;s:number;dir:number;minX:number;maxX:number};
export function antWalk(homeX:number,span:number,minX:number,maxX:number,wave:number){
 return Math.max(minX,Math.min(maxX,homeX+wave*span));
}
function load(src:string){return new Promise<HTMLImageElement>((ok,err)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=err;i.src=src;});}
function hex(c:C,x:number,y:number,r:number){
 c.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i,px=x+r*Math.cos(a),py=y+r*Math.sin(a);i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();
}
function drip(c:C,x:number,y:number,s:number,phase:number){
 const hang=6+Math.sin(phase)*2;c.save();c.translate(x,y);
 const g=c.createLinearGradient(0,0,0,18*s);g.addColorStop(0,'#f2c56a');g.addColorStop(1,'#8a4316');
 c.fillStyle=g;c.beginPath();c.moveTo(-3*s,0);c.quadraticCurveTo(0,hang*s,3*s,0);c.quadraticCurveTo(1.2*s,14*s,0,18*s);c.quadraticCurveTo(-1.2*s,14*s,-3*s,0);c.fill();c.restore();
}
function waxCap(c:C,x:number,y:number,w:number,h=16){
 const g=c.createLinearGradient(0,y,0,y+h);
 g.addColorStop(0,'#fff6d8');g.addColorStop(.28,'#f6d17b');g.addColorStop(.7,'#e0a44a');g.addColorStop(1,'#b87528');
 c.fillStyle=g;c.beginPath();c.roundRect(x-2,y-3,w+4,h,8);c.fill();
 c.strokeStyle='#fff3c488';c.lineWidth=1.4;c.beginPath();c.moveTo(x+6,y-1);c.lineTo(x+w-6,y-1);c.stroke();
}
function punchDark(img:HTMLImageElement){
 const cv=canvas(img.width,img.height),ctx=cv.getContext('2d')!;
 ctx.drawImage(img,0,0);
 const data=ctx.getImageData(0,0,img.width,img.height),d=data.data;
 for(let i=0;i<d.length;i+=4){
  const r=d[i],g=d[i+1],b=d[i+2],luma=.3*r+.5*g+.2*b;
  if(luma<58&&r<90&&g<70&&b<55)d[i+3]=0;
  else if(luma<78&&Math.abs(r-g)<28)d[i+3]=Math.floor(d[i+3]*((luma-50)/30));
 }
 ctx.putImageData(data,0,0);return cv;
}
function rock(c:C,x:number,y:number,s:number,seed:number,distant=false){
 const r=rng(seed);c.save();c.translate(x,y);c.scale(s,s);
 const g=c.createLinearGradient(-80,0,90,0);
 g.addColorStop(0,distant?'#5a3824':'#3d2418');g.addColorStop(.45,distant?'#7a4a28':'#5a321c');g.addColorStop(1,distant?'#4a2c1c':'#2a1810');
 c.fillStyle=g;c.beginPath();c.moveTo(-90,20);c.bezierCurveTo(-70,-80,-20,-160,10,-210);c.bezierCurveTo(40,-250,70,-180,95,-40);c.quadraticCurveTo(80,10,40,18);c.closePath();c.fill();
 for(let i=0;i<8;i++){
  c.fillStyle=distant?'#c47a2833':'#8a431622';
  c.beginPath();c.ellipse((r()-.5)*120,-40-r()*140,12+r()*22,8+r()*14,r(),0,Math.PI*2);c.fill();
 }
 c.restore();
}
function waxMound(c:C,s:number){
 const g=c.createLinearGradient(-18,0,18,0);g.addColorStop(0,'#c48a38');g.addColorStop(.5,'#f6d17b');g.addColorStop(1,'#8a4316');
 c.fillStyle=g;c.beginPath();c.moveTo(-22*s,4);c.quadraticCurveTo(-8*s,-18*s,0,-22*s);c.quadraticCurveTo(10*s,-16*s,20*s,4);c.closePath();c.fill();
}
function pollen(c:C,s:number){
 c.fillStyle='#ffe08a88';c.beginPath();c.arc(0,-10*s,7*s,0,Math.PI*2);c.fill();
 c.fillStyle='#f6d17bcc';for(let i=0;i<6;i++){c.beginPath();c.arc(Math.cos(i)*6*s,Math.sin(i)*6*s-10*s,2.2*s,0,Math.PI*2);c.fill();}
}
export class HoneyArt {
 sky=canvas(W,H);far=canvas(2400,H);middle=canvas(3600,1000);terrain=canvas(5000,1100);
 dirty=true;ready=false;props:Prop[]=[];critters:Critter[]=[];
 private lastFlora=0;
 private imgs:{wax?:Img;honey?:Img;lantern?:Img;drape?:Img;crystal?:Img;hang?:Img;bee?:Img;ant?:Img}={};
 constructor(public level:HoneyLevel){this.scatterProps();this.scatterCritters();this.paintSky();this.paintFar();this.paintMiddle();this.paintTerrain();void this.hydrate();}
 private add(kind:Prop['kind'],x:number,y:number,s:number,hang=0,flip=1){
  this.props.push({kind,x,y,s,flip,phase:x*.02+y*.01,hang,sway:0,bounce:0,vSway:0,vBounce:0});
 }
 private scatterProps(){
  const r=rng(441);
  this.add('lantern',210,118,.95,70);this.add('comb',390,86,1.05,0);this.add('drape',560,8,1.1,0);
  this.add('crystal',190,600,.95);this.add('mound',340,600,1.1);this.add('puff',470,600,1);
  this.add('lantern',820,110,.85,62);this.add('drape',980,6,1,0);this.add('comb',1180,78,.95,0);
  this.add('crystal',1288,600,.8);this.add('mound',1400,600,1.15);this.add('puff',1488,600,.9);
  this.add('lantern',1720,102,.88,68);this.add('drape',1980,4,1.15,0);this.add('comb',2210,70,1,0);
  this.add('crystal',2510,600,.85);this.add('puff',2555,600,.95);
  this.add('lantern',2688,64,.8,54);this.add('drape',2860,0,1.1,0);this.add('comb',3080,48,.9,0);
  this.add('crystal',3390,600,.95);this.add('mound',3490,600,1);this.add('lantern',3520,88,.85,64);
  this.add('drape',3760,6,1,0);this.add('comb',4010,62,1.05,0);this.add('lantern',4180,96,.82,70);
  this.add('crystal',4288,600,1.05);this.add('mound',4480,588,.9);this.add('puff',4688,588,1);
  this.add('drape',4560,10,1.05,0);this.add('comb',4780,58,.95,0);this.add('lantern',4900,108,.85,58);
  this.add('crystal',2144,575,.7);this.add('puff',2168,575,.75);
  this.add('crystal',870,600,.7);this.add('mound',1088,612,.8);this.add('puff',2340,690,.7);
  this.add('lantern',2420,90,.8,60);this.add('comb',3320,40,.88,0);this.add('drape',3180,0,1,0);
  for(let i=0;i<14;i++){
   const x=140+r()*4780,y=48+r()*80;
   const kind=(['lantern','comb','drape'] as const)[Math.floor(r()*3)];
   this.add(kind,x,y,.7+r()*.4,kind==='lantern'?46+r()*28:0,r()>.5?1:-1);
  }
 }
 private async hydrate(){
  try{
   const [wax,honey,lantern,drape,crystal,hang,bee,ant]=await Promise.all([
    load(asset('assets/honey/wax.png')),load(asset('assets/honey/honey.png')),
    load(asset('assets/honey/lantern.png')),load(asset('assets/honey/drape.png')),
    load(asset('assets/honey/crystal.png')),load(asset('assets/honey/hang-comb.png')),
    load(asset('assets/honey/bee.png')),load(asset('assets/honey/ant.png')),
   ]);
   this.imgs={wax,honey,lantern:punchDark(lantern),drape:punchDark(drape),crystal:punchDark(crystal),hang:punchDark(hang),bee:punchDark(bee),ant:punchDark(ant)};
   this.ready=true;this.paintFar();this.paintMiddle();this.paintTerrain();this.dirty=true;
  }catch{/* procedural fallback stays */}
 }
 private paintSky(){
  const c=this.sky.getContext('2d')!,g=c.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#1a100c');g.addColorStop(.38,'#3d2418');g.addColorStop(.72,'#7a4218');g.addColorStop(1,'#c47a28');
  c.fillStyle=g;c.fillRect(0,0,W,H);
  const glow=c.createRadialGradient(720,160,8,640,240,560);glow.addColorStop(0,'#ffd27a55');glow.addColorStop(.55,'#d8862018');glow.addColorStop(1,'#39231700');
  c.fillStyle=glow;c.fillRect(0,0,W,H);
 }
 private scatterCritters(){
  const r=rng(77);
  for(let i=0;i<14;i++){
   const x=180+r()*4700,y=90+r()*160;
   this.critters.push({kind:'bee',x,y,homeX:x,homeY:y,phase:r()*6.28,span:46+r()*70,s:.95+r()*.4,dir:r()>.5?1:-1,minX:x,maxX:x});
  }
  const grounds=this.level.base.filter(s=>s.kind==='wax-rock'&&!s.oneWay&&s.h>40&&s.w>140);
  for(let i=0;i<12;i++){
   const g=grounds[Math.floor(r()*grounds.length)];if(!g)continue;
   const minX=g.x+22,maxX=g.x+g.w-22;if(maxX<=minX)continue;
   const x=minX+r()*(maxX-minX);
   this.critters.push({kind:'ant',x,y:g.y,homeX:x,homeY:g.y,phase:r()*6.28,span:Math.min(36+r()*70,(maxX-minX)*.45),s:1+r()*.35,dir:r()>.5?1:-1,minX,maxX});
  }
 }
 private groundAt(x:number,preferY:number){
  let best:number|undefined,bestDist=24;
  for(const s of this.level.base){
   if(s.kind==='pool'||s.kind==='boundary'||s.oneWay||s.h<40)continue;
   if(x<s.x||x>s.x+s.w)continue;
   const dist=Math.abs(s.y-preferY);
   if(dist<=bestDist){bestDist=dist;best=s.y;}
  }
  return best;
 }
 private waxStone(c:C,x:number,y:number,w:number,h:number,seed=1){
  const r=rng(seed+((x*13+y)|0));
  const g=c.createLinearGradient(0,y,0,y+Math.min(280,h));
  g.addColorStop(0,'#edd08a');g.addColorStop(.2,'#d4a04a');g.addColorStop(.55,'#8a5524');g.addColorStop(1,'#3d2418');
  c.fillStyle=g;c.beginPath();c.roundRect(x,y,w,h,8);c.fill();
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
  for(let i=0;i<w*.42;i++){
   c.fillStyle=['#c49a4030','#3b211828','#fff6d416'][i%3];
   c.beginPath();c.ellipse(x+r()*w,y+14+r()*h,4+r()*16,3+r()*9,r(),0,Math.PI*2);c.fill();
  }
  c.strokeStyle='#8a431633';c.lineWidth=2;
  for(let px=x+18;px<x+w;px+=48+r()*72){c.beginPath();c.moveTo(px,y+6);c.bezierCurveTo(px+16,y+42,px-22,y+86,px+8,y+140);c.stroke();}
  c.restore();
 }
 private paintFar(){
  const c=this.far.getContext('2d')!;c.clearRect(0,0,2400,H);
  const cave=c.createLinearGradient(0,0,0,H);cave.addColorStop(0,'#24140e');cave.addColorStop(1,'#4a2a16');
  c.fillStyle=cave;c.fillRect(0,0,2400,H);
  const r=rng(7);
  for(let i=0;i<10;i++)rock(c,80+i*240,610,.55+r()*.35,30+i,true);
  for(let i=0;i<7;i++){
   const x=160+i*330,y=30+r()*40;
   c.fillStyle='#2a1810aa';c.beginPath();c.moveTo(x-28,0);c.quadraticCurveTo(x,y+90+r()*50,x+24,0);c.fill();
  }
  for(let i=0;i<6;i++){
   const x=220+i*380;
   c.fillStyle='#3b2118cc';c.beginPath();c.ellipse(x,70,36+r()*20,48+r()*22,0,0,Math.PI*2);c.fill();
   c.fillStyle='#d8862014';c.beginPath();c.ellipse(x,90,18,22,0,0,Math.PI*2);c.fill();
  }
  const fog=c.createLinearGradient(0,300,0,H);fog.addColorStop(0,'#c47a2800');fog.addColorStop(1,'#6a3018aa');c.fillStyle=fog;c.fillRect(0,300,2400,H);
 }
 private paintMiddle(){
  const c=this.middle.getContext('2d')!;c.clearRect(0,0,3600,1000);const r=rng(19);
  for(let i=0;i<8;i++)rock(c,i*460-40,680,.85+r()*.4,80+i);
  for(let i=0;i<14;i++){
   const x=90+i*250,h=90+r()*160;
   c.fillStyle='#5a321ccc';c.beginPath();c.moveTo(x-16,0);c.bezierCurveTo(x-6,h*.4,x+8,h*.7,x,h);c.bezierCurveTo(x-4,h*.7,x+18,h*.35,x+18,0);c.closePath();c.fill();
   drip(c,x,h-8,.45+r()*.3,i);
  }
  for(let i=0;i<9;i++){
   const x=180+i*390,y=8+r()*24;
   if(this.imgs.hang){c.save();c.globalAlpha=.92;c.drawImage(this.imgs.hang,x-56,y,112+r()*24,150+r()*30);c.restore();}
   else {c.fillStyle='#c48a38';c.beginPath();c.ellipse(x,y+58,38,46,0,0,Math.PI*2);c.fill();}
  }
  for(let i=0;i<8;i++){
   const x=260+i*420,y=70+r()*36;
   if(this.imgs.lantern)c.drawImage(this.imgs.lantern,x-22,y,44,66);
   else {c.strokeStyle='#e0b45a';c.lineWidth=2;c.beginPath();c.moveTo(x,y-40);c.lineTo(x,y+18);c.stroke();c.fillStyle='#ffe08acc';c.beginPath();c.arc(x,y+28,11,0,Math.PI*2);c.fill();}
  }
  for(let i=0;i<7;i++){
   const x=340+i*480;
   if(this.imgs.drape)c.drawImage(this.imgs.drape,x-28,0,56,150);
   if(this.imgs.crystal)c.drawImage(this.imgs.crystal,x+90,520+r()*40,48,62);
  }
  const haze=c.createLinearGradient(0,520,0,1000);haze.addColorStop(0,'#d8862000');haze.addColorStop(1,'#8a431655');c.fillStyle=haze;c.fillRect(0,520,3600,480);
 }
 private stampBlock(c:C,s:Rect){
  if(s.h<36){
   waxCap(c,s.x,s.y+Y0,s.w,18);
   if(this.imgs.wax){c.save();c.globalAlpha=.35;c.beginPath();c.roundRect(s.x-2,s.y+Y0-3,s.w+4,18,8);c.clip();c.drawImage(this.imgs.wax,s.x-6,s.y+Y0-8,s.w+12,28);c.restore();}
   drip(c,s.x+s.w*.2,s.y+Y0+12,.65,s.x);drip(c,s.x+s.w*.8,s.y+Y0+12,.5,s.x+3);
   return;
  }
  this.waxStone(c,s.x,s.y+Y0,s.w,s.h,s.x+s.y);
  waxCap(c,s.x,s.y+Y0,s.w,15);
  drip(c,s.x+s.w*.18,s.y+Y0+12,.7,s.x);drip(c,s.x+s.w*.72,s.y+Y0+12,.55,s.x+2);
 }
 private support(c:C,x:number,y:number,w:number){
  const mid=x+w/2,top=y+16;c.strokeStyle='#e0b45a';c.lineWidth=3;c.lineJoin='round';c.lineCap='round';
  hex(c,mid,top+28,Math.min(26,w*.28));c.stroke();
  c.beginPath();c.moveTo(x+12,top);c.lineTo(mid-14,top+16);c.moveTo(x+w-12,top);c.lineTo(mid+14,top+16);c.stroke();
 }
 syncLayout(){this.paintTerrain();}
 private paintTerrain(){
  const c=this.terrain.getContext('2d')!;c.clearRect(0,0,5000,1100);
  const mouth=c.createRadialGradient(80,560+Y0,8,80,560+Y0,150);
  mouth.addColorStop(0,'#1c120c');mouth.addColorStop(.65,'#3d241688');mouth.addColorStop(1,'#0000');
  c.fillStyle=mouth;c.beginPath();c.ellipse(70,555+Y0,78,108,0,0,Math.PI*2);c.fill();
  this.visualStem(c,2140,601+Y0,148);
  for(const s of this.level.base){
   if(s.kind==='boundary')continue;
   if(s.kind==='pool'){this.basin(c,s);continue;}
   if(s.kind==='hex-pad'){this.hexPad(c,s.x+s.w/2,s.y+Y0,s.w);continue;}
   this.stampBlock(c,s);
   if(s.h<=28&&s.w>50)this.support(c,s.x,s.y+Y0,s.w);
  }
  for(const pool of this.level.pools){
   const b=pool.bounds;
   c.fillStyle='#4a2410aa';c.fillRect(b.x,b.y+Y0+b.h-8,b.w,16);
  }
  this.sign(c,500,600,'琥珀蜜穴','→');
  this.sign(c,1500,600,'碎桥','→');
  this.sign(c,3260,600,'蜜锁','↑');
 }
 private basin(c:C,s:Rect){
  this.waxStone(c,s.x,s.y+Y0,s.w,s.h,s.x+9);
  const g=c.createLinearGradient(0,s.y+Y0,0,s.y+Y0+s.h);
  g.addColorStop(0,'#d8862044');g.addColorStop(1,'#2a1810aa');
  c.fillStyle=g;c.fillRect(s.x,s.y+Y0,s.w,s.h);
 }
 private visualStem(c:C,x:number,y:number,h:number){
  const g=c.createLinearGradient(x-8,y,x+8,y);
  g.addColorStop(0,'#8a5524');g.addColorStop(.5,'#e0b45a');g.addColorStop(1,'#5a321c');
  c.fillStyle=g;c.beginPath();c.roundRect(x-7,y,14,h,6);c.fill();
 }
 private hexPad(c:C,x:number,y:number,w:number){
  const r=w*.5;
  hex(c,x+2,y+10,r);c.fillStyle='#5a2a1244';c.fill();
  hex(c,x,y+8,r);
  const side=c.createLinearGradient(x,y,x,y+18);side.addColorStop(0,'#e8b45a');side.addColorStop(1,'#8a4316');
  c.fillStyle=side;c.fill();
  hex(c,x,y+2,r*.92);
  const top=c.createRadialGradient(x-r*.2,y-4,2,x,y+2,r);
  top.addColorStop(0,'#fff3c8');top.addColorStop(.45,'#f6d17b');top.addColorStop(1,'#d88620');
  c.fillStyle=top;c.fill();c.strokeStyle='#fff6d4aa';c.lineWidth=1.6;c.stroke();
 }
 private sign(c:C,x:number,y:number,text:string,arrow:string){
  c.fillStyle='#8a4316';c.fillRect(x-4,y+Y0-70,8,70);
  c.save();c.translate(x,y+Y0-58);c.rotate(-.04);
  c.fillStyle='#f6d17b';c.beginPath();c.roundRect(-46,-16,92,34,6);c.fill();c.strokeStyle='#8a4316';c.stroke();
  c.fillStyle='#5a2a12';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText(text,0,-1);c.font='16px sans-serif';c.fillText(arrow,0,14);c.restore();
 }
 private stamp(c:C,img:Img|undefined,x:number,y:number,w:number,h:number){
  if(!img)return false;c.drawImage(img,x,y,w,h);return true;
 }
 private drawProp(c:C,p:Prop){
  if(p.kind==='lantern'){
   if(!this.stamp(c,this.imgs.lantern,-26*p.s,-p.hang-8,52*p.s,78*p.s)){
    c.strokeStyle='#e0b45a';c.lineWidth=1.6;c.beginPath();c.moveTo(0,-p.hang-8);c.lineTo(0,0);c.stroke();
    const g=c.createRadialGradient(0,8,1,0,8,16*p.s);g.addColorStop(0,'#ffe08a');g.addColorStop(1,'#d8862066');
    c.fillStyle=g;c.beginPath();c.arc(0,10*p.s,10*p.s,0,Math.PI*2);c.fill();
   }
   const glow=c.createRadialGradient(0,12,2,0,12,46*p.s);glow.addColorStop(0,'#ffe08a33');glow.addColorStop(1,'#ffe08a00');
   c.fillStyle=glow;c.fillRect(-46*p.s,-20,92*p.s,92*p.s);return;
  }
  if(p.kind==='comb'){
   if(!this.stamp(c,this.imgs.hang,-52*p.s,-8,104*p.s,140*p.s)){c.fillStyle='#e0b45a';c.beginPath();c.ellipse(0,46*p.s,34*p.s,42*p.s,0,0,Math.PI*2);c.fill();}
   return;
  }
  if(p.kind==='drape'){
   if(!this.stamp(c,this.imgs.drape,-30*p.s,-4,60*p.s,150*p.s)){
    c.fillStyle='#d8a44a';c.beginPath();c.moveTo(-10*p.s,0);c.quadraticCurveTo(0,70*p.s,8*p.s,110*p.s);c.quadraticCurveTo(4*p.s,70*p.s,12*p.s,0);c.fill();
   }
   return;
  }
  if(p.kind==='crystal'){
   if(!this.stamp(c,this.imgs.crystal,-28*p.s,-58*p.s,56*p.s,70*p.s)){
    c.fillStyle='#f0c56acc';c.beginPath();c.moveTo(0,-36*p.s);c.lineTo(12*p.s,4);c.lineTo(-12*p.s,4);c.closePath();c.fill();
   }
   return;
  }
  if(p.kind==='mound'){waxMound(c,p.s);return;}
  pollen(c,p.s);
 }
 drawLayers(c:C,camera:number,cameraY:number){
  c.drawImage(this.sky,0,0);
  c.drawImage(this.far,-camera*.12,cameraY*.18);
  c.save();c.globalCompositeOperation='screen';
  for(let i=0;i<4;i++){
   c.save();c.translate(420+i*260-camera*.1,-60+cameraY*.1);c.rotate(.28);
   const g=c.createLinearGradient(-50,0,50,0);g.addColorStop(0,'#ffd27a00');g.addColorStop(.5,'#ffd27a16');g.addColorStop(1,'#ffd27a00');
   c.fillStyle=g;c.fillRect(-50,0,100,900);c.restore();
  }
  c.restore();
  c.drawImage(this.middle,-camera*.36,-40+cameraY*.45);
  c.drawImage(this.terrain,-camera,-Y0+cameraY);
 }
 drawAtmosphere(c:C,camera:number,cameraY:number,time:number){
  for(let i=0;i<36;i++){
   const x=((i*151+Math.sin(time*.18+i)*50-camera*.2)%1400+1400)%1400;
   const y=80+((i*67+time*(6+i%4))%620)+cameraY*.3;
   c.fillStyle=`rgba(255,230,160,${.12+(Math.sin(time+i)+1)*.16})`;c.beginPath();c.arc(x,y,1.2+i%3*.4,0,Math.PI*2);c.fill();
  }
 }
 private stir(sim:SlimeSimulation,time:number){
  const dt=Math.min(.05,this.lastFlora?time-this.lastFlora:1/60);this.lastFlora=time;
  const bodies=sim.groups().map(g=>sim.center(g));
  for(const p of this.props){
   const hanging=p.kind==='lantern'||p.kind==='comb'||p.kind==='drape';
   const reach=hanging?36*p.s:28*p.s,height=hanging?90*p.s:40*p.s;
   let hitSway=0,hitBounce=0;
   for(const s of bodies){
    const dx=s.x-p.x;if(Math.abs(dx)>reach+50)continue;
    if(s.y<p.y-20||s.y>p.y+height+80)continue;
    const near=1-Math.min(1,Math.abs(dx)/(reach+40));
    hitSway+=(dx>=0?1:-1)*near*(.7+Math.abs(s.vx)*.012);
    if(Math.abs(dx)<reach+8)hitBounce+=.45*near+Math.max(0,s.vy)*.006;
   }
   p.vSway+=(-p.sway*22-p.vSway*5.2+hitSway*2.1)*dt;p.sway=Math.max(-.55,Math.min(.55,p.sway+p.vSway*dt));
   p.vBounce+=(-p.bounce*26-p.vBounce*6+hitBounce*2.8)*dt;p.bounce=Math.max(-.18,Math.min(.7,p.bounce+p.vBounce*dt));
  }
 }
 private drawCritters(c:C,camera:number,time:number){
  for(const a of this.critters){
   if(a.kind==='bee'){
    a.x=a.homeX+Math.sin(time*.85+a.phase)*a.span;
    a.y=a.homeY+Math.cos(time*1.15+a.phase)*22;
   }else{
    a.x=antWalk(a.homeX,a.span,a.minX,a.maxX,Math.sin(time*.32+a.phase));
    a.y=(this.groundAt(a.x,a.homeY)??a.homeY)-1;
   }
   const x=a.x-camera;if(x<-40||x>W+40)continue;
   const flip=a.kind==='bee'?(Math.cos(time*.85+a.phase)>=0?1:-1):a.dir*(Math.cos(time*.32+a.phase)>=0?1:-1);
   c.save();c.translate(x,a.y);c.scale(flip*a.s,a.s);
   if(a.kind==='bee'){
    if(!this.stamp(c,this.imgs.bee,-22,-18,44,36)){
     c.fillStyle='#f6d17b';c.beginPath();c.ellipse(0,0,8,5.5,0,0,Math.PI*2);c.fill();
     c.strokeStyle='#3b2118';c.lineWidth=1.4;c.beginPath();c.moveTo(-3,-2);c.lineTo(-3,2);c.moveTo(2,-2);c.lineTo(2,2);c.stroke();
     c.fillStyle='#fff6d488';c.beginPath();c.ellipse(-2,-6,5,3,-.4,0,Math.PI*2);c.fill();
    }
   }else if(!this.stamp(c,this.imgs.ant,-20,-12,40,22)){
    c.fillStyle='#5a321c';c.beginPath();c.ellipse(-5,0,5,3.2,0,0,Math.PI*2);c.ellipse(4,0,6,3.4,0,0,Math.PI*2);c.fill();
    c.strokeStyle='#3b2118';c.lineWidth=1;c.beginPath();c.moveTo(-2,2);c.lineTo(-6,6);c.moveTo(2,2);c.lineTo(6,6);c.stroke();
   }
   c.restore();
  }
 }
 drawDetails(c:C,camera:number,time:number,sim:SlimeSimulation){
  this.stir(sim,time);
  for(const p of this.props){
   const x=p.x-camera;if(x<-120||x>W+120)continue;
   const idle=Math.sin(time*1.7+p.phase)*(p.kind==='lantern'?.04:.02);
   const squash=Math.max(-.28,Math.min(.4,p.bounce));
   c.save();c.translate(x,p.y);c.rotate(p.sway+idle);c.scale(p.flip*(1+squash*.1),1-squash*.16);
   this.drawProp(c,p);c.restore();
  }
  for(const p of this.level.wax)this.waxPlatform(c,p,camera,time);
  for(const wall of this.level.curtains){
   for(let i=0;i<5;i++)drip(c,wall.x-camera+10+i*14,wall.y+20+((time*18+i*40)%Math.max(20,wall.h-30)),.8+i%2*.3,time+i);
  }
  this.level.plates.forEach((plate,i)=>{
   const x=plate.x-camera,on=this.level.plateActive[i]||this.level.latchOn;
   hex(c,x,plate.y-4,26);
   const g=c.createRadialGradient(x,plate.y-8,2,x,plate.y-4,26);g.addColorStop(0,on?'#ffe08a':'#e8c56a');g.addColorStop(1,on?'#d88620':'#c48a38');
   c.fillStyle=g;c.fill();c.strokeStyle=on?'#fff6c4':'#8a4316';c.lineWidth=2;c.stroke();
   hex(c,x,plate.y-4,12);c.stroke();
  });
  if(!this.level.latchOn&&!this.level.plateActive[0]){
   const g=this.level.gate;
   c.save();c.translate(-camera,0);this.waxStone(c,g.x,g.y,g.w,g.h,g.x);c.restore();
   c.strokeStyle='#f6d17b88';c.strokeRect(g.x-camera,g.y,g.w,g.h);
  }
  if(!this.level.latchOn){
   const w=this.level.lowWall;
   c.save();c.translate(-camera,0);this.waxStone(c,w.x,w.y,w.w,w.h,w.x);c.restore();
  }
  this.drawCritters(c,camera,time);
  drawPortals(c,this.level.portals,camera,time);
  for(const d of this.level.dew){
   if(d.got)continue;const x=d.x-camera,y=d.y+Math.sin(time*2+d.x)*4;
   const glow=c.createRadialGradient(x,y,1,x,y,20);glow.addColorStop(0,'#ffe08a66');glow.addColorStop(1,'#ffe08a00');c.fillStyle=glow;c.fillRect(x-20,y-20,40,40);
   c.fillStyle='#ffd36a';c.beginPath();c.moveTo(x,y-8);c.bezierCurveTo(x+10,y+2,x+5,y+8,x,y+8);c.bezierCurveTo(x-7,y+8,x-8,y+2,x,y-8);c.fill();
  }
  if(this.level.checkpoint.x>400){
   const x=this.level.checkpoint.x-camera;hex(c,x,this.level.checkpoint.y+52,14);
   c.fillStyle='#ffe7a3cc';c.fill();c.strokeStyle='#d88620';c.lineWidth=1.2;c.stroke();
  }
 }
 private waxPlatform(c:C,p:WaxPlatform,camera:number,time:number){
  const r=p.rect,x=r.x-camera,y=r.y+p.sink+p.shake,w=r.w;
  c.setLineDash([]);
  c.strokeStyle=p.solid?'#e0b45acc':'#e0b45a33';c.lineWidth=3.5;c.lineJoin='round';
  hex(c,x+w/2,y+34,Math.min(30,w*.3));c.stroke();
  if(!p.solid){
   c.globalAlpha=.2+(p.reforming?(p.missing-(WAX_REFORM-.5))*1.4:0);
   c.strokeStyle='#f6d17b';c.setLineDash([4,4]);c.strokeRect(x,r.y,w,16);c.setLineDash([]);
   if(p.reforming){const t=(p.missing-(WAX_REFORM-.5))/.5;for(let i=0;i<10;i++){c.fillStyle='#f6d17b';c.beginPath();c.arc(x+w*(.1+i*.08),r.y+8+(1-t)*28,2.1,0,Math.PI*2);c.fill();}}
   c.globalAlpha=1;
  }else{
   waxCap(c,x,y,w,17);
   if(this.imgs.wax){c.save();c.globalAlpha=.3;c.beginPath();c.roundRect(x-2,y-3,w+4,18,8);c.clip();c.drawImage(this.imgs.wax,x-8,y-10,w+16,34);c.restore();}
   c.strokeStyle=p.load>.35?'#fff6c4':'#8a431655';c.lineWidth=p.load>.35?2.4+Math.sin(time*18):1.4;
   c.beginPath();c.roundRect(x-2,y-3,w+4,17,8);c.stroke();
   if(p.crack>0){
    c.strokeStyle=`rgba(90,40,16,${.35+p.crack*.5})`;c.lineWidth=1+p.crack;
    for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+12+i*w*.28,y+2);c.lineTo(x+22+i*w*.28+p.crack*8,y+14);c.stroke();}
   }
  }
  for(const s of p.shards){
   c.save();c.translate(s.x-camera,s.y);c.rotate(s.angle);c.globalAlpha=Math.max(0,s.life);
   c.fillStyle=s.kind==='chunk'?'#f0c56a':'#e8b45a';
   if(s.kind==='chunk'){c.beginPath();c.moveTo(-s.size,0);c.lineTo(s.size*.4,-s.size*.7);c.lineTo(s.size,s.size*.2);c.lineTo(-s.size*.2,s.size*.6);c.closePath();c.fill();}
   else {c.beginPath();c.arc(0,0,s.size,0,Math.PI*2);c.fill();}
   c.restore();
  }
  for(const crumb of p.crumbs){c.globalAlpha=Math.max(0,crumb.life*2);c.fillStyle='#e8c56a';c.beginPath();c.arc(crumb.x-camera,crumb.y,crumb.r,0,Math.PI*2);c.fill();c.globalAlpha=1;}
  c.setLineDash([]);
 }
}
