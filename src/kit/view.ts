import {isolateSprite,keyedSprite} from '../art-key';
import {asset} from '../asset';
import type {DressingSpot,PortalSpot} from '../content/types';
import type {SlimeSimulation} from '../physics';
import type {EcoWorld} from '../ecology/world';
import type {EcoObject,FaunaSpot} from '../ecology/types';
import {drawEcoCritter,drawEcoKind,fern,flower,mushroom,starGateMark,windBellMark} from '../ecology/draw';
import type {KitEntry} from './defs';
import {kitById} from './register';

type C=CanvasRenderingContext2D;
type Pose={x:number;y:number;w?:number;h?:number;s?:number;flip?:number;sway?:number;bounce?:number};
type Sheet=HTMLImageElement|HTMLCanvasElement;

const imgs=new Map<string,Sheet>();
const WIND_SRC=['assets/wind/bell.png','assets/wind/mill.png','assets/wind/lantern.png','assets/wind/weed.png','assets/wind/pillar.png','assets/wind/bridge.png'];
const MIRROR_SRC=['assets/mirror/crystal.png','assets/mirror/lantern.png','assets/mirror/vine.png','assets/mirror/portal.png'];
const KEYED_SRC=[...WIND_SRC,...MIRROR_SRC];

export function hydrateKitImages(){
 const srcs=new Set<string>();
 for(const key of ['assets/tide/weed.png','assets/tide/coral.png','assets/tide/fan.png','assets/tide/anemone.png','assets/tide/bloom.png','assets/honey/lantern.png','assets/honey/hang-comb.png','assets/honey/drape.png','assets/honey/crystal.png','assets/honey/bee.png','assets/honey/ant.png',...KEYED_SRC])srcs.add(key);
 for(const src of srcs){
  if(imgs.has(src))continue;
  const img=new Image();
  img.onload=()=>{
   if(KEYED_SRC.includes(src)){
    try{imgs.set(src,src.includes('portal')?isolateSprite(img):src.includes('bridge')||src.includes('mirror')?keyedSprite(img):isolateSprite(img));}catch{imgs.set(src,img);}
   }
  };
  img.src=asset(src);
  imgs.set(src,img);
 }
}

function grassBand(c:C,w:number,press=0,phase=0,time=0){
 const h=14*Math.max(.32,1-press);
 const bend=Math.sin(time*1.8+phase)*3;
 c.fillStyle='#8ba84d';
 for(let x=4;x<w-4;x+=10){
  c.beginPath();c.moveTo(x,2);c.lineTo(x+2+bend,2-h);c.lineTo(x+4,2);c.closePath();c.fill();
 }
}

function dew(c:C,skin='forest'){
 const fill=skin==='honey'?'#f6d17b':skin==='tide'?'#c8e7f4':skin==='wind'?'#fff0a8':skin==='mirror'?'#d6eeff':'#ffebad';
 const glow=c.createRadialGradient(0,0,1,0,0,18);glow.addColorStop(0,fill+'66');glow.addColorStop(1,fill+'00');
 c.fillStyle=glow;c.fillRect(-18,-18,36,36);
 c.fillStyle=fill;c.beginPath();c.moveTo(0,-8);c.bezierCurveTo(11,2,6,8,0,8);c.bezierCurveTo(-7,8,-8,2,0,-8);c.fill();
}

function souvenir(c:C,id='mossheart'){
 const fill=id==='tidepoem'?'#9fd4ea':id==='windbell'?'#f7d66d':id==='mirrorstar'?'#9fd4ea':'#c6e87a';
 c.fillStyle=fill;c.beginPath();c.moveTo(0,-8);c.lineTo(7,6);c.lineTo(-7,6);c.closePath();c.fill();
}

function windBell(c:C,s=1){windBellMark(c,s);}
function starGate(c:C,s=1){starGateMark(c,s);}

function honeyMound(c:C,s=1){
 const g=c.createLinearGradient(-18,0,18,0);g.addColorStop(0,'#c48a38');g.addColorStop(.5,'#f6d17b');g.addColorStop(1,'#8a4316');
 c.fillStyle=g;c.beginPath();c.moveTo(-22*s,4);c.quadraticCurveTo(-8*s,-18*s,0,-22*s);c.quadraticCurveTo(10*s,-16*s,20*s,4);c.closePath();c.fill();
}

function honeyPuff(c:C,s=1){
 c.fillStyle='#ffe08a88';c.beginPath();c.arc(0,-10*s,7*s,0,Math.PI*2);c.fill();
}

function jelly(c:C,s=1){
 c.fillStyle='#8ad4ff99';c.beginPath();c.ellipse(0,-8*s,10*s,8*s,0,0,Math.PI*2);c.fill();
}

function ecoObject(c:C,o:EcoObject,done:boolean,time:number){
 const pulse=done?1+.08*Math.sin(time*4+o.x*.01):1;
 c.save();c.translate(o.x,o.y);c.scale(pulse,pulse);
 const glow=done?'#fff2a866':'#d9f3d933';
 c.fillStyle=glow;c.beginPath();c.arc(0,-16,done?28:20,0,Math.PI*2);c.fill();
 drawEcoKind(c,o.kind,done,time);
 c.restore();
}

function ecoFauna(c:C,f:FaunaSpot,time:number,done:boolean){
 const destx=f.target?.x??f.x,desty=f.target?.y??f.y;
 const x=destx+Math.sin(time*.55+destx*.01)*f.span,y=desty+Math.cos(time*.7+desty*.01)*(f.span>60?10:4);
 c.save();c.translate(x,y);c.globalAlpha=done?.9:.72;
 drawEcoCritter(c,f.kind);
 c.restore();
}

/** Draws the data-driven ecology layer shared by all five chapters. */
export function drawEcology(c:C,world:EcoWorld,camera:number,time:number){
 const eventOn=world.events.some(e=>world.completed.has(e.id));
 for(const plat of world.revealedPlatforms()){
  const x=plat.x-camera;if(x<-80||x>c.canvas.width+80)continue;
  c.fillStyle='#d9f3d966';c.fillRect(x,plat.y,plat.w,plat.h);
  c.strokeStyle='#fff2a888';c.strokeRect(x,plat.y,plat.w,plat.h);
 }
 for(const o of world.objects){
  const x=o.x-camera;if(x<-80||x>c.canvas.width+80)continue;
  const done=world.completed.has(o.id);
  const copy={...o,x};ecoObject(c,copy,done,time);
  if(!done)continue;
  c.save();c.translate(x,o.y);
  if(o.kind.includes('lantern')||o.kind.includes('lamp')||o.kind.includes('firefly')){
   const glow=c.createRadialGradient(0,-28,2,0,-28,36);glow.addColorStop(0,'#fff2a8aa');glow.addColorStop(1,'#fff2a800');
   c.fillStyle=glow;c.beginPath();c.arc(0,-28,36,0,Math.PI*2);c.fill();
  }else if(o.kind.includes('flower')||o.kind.includes('lily')||o.kind.includes('dandelion')||o.kind.includes('seed')){
   flower(c,1.15,'#fff3b0');
  }
  c.restore();
 }
 for(const f of world.fauna){const x=f.x-camera;if(x<-100||x>c.canvas.width+100)continue;const copy={...f,x};ecoFauna(c,copy,time,eventOn);}
}

function ready(img:Sheet|undefined){
 if(!img)return false;
 if(img instanceof HTMLCanvasElement)return img.width>0;
 return img.complete&&img.naturalWidth>0;
}

/** True once a kit can render its final look, so thumbnails aren't cached mid-load. */
export function kitThumbReady(entry:KitEntry){
 return entry.draw!=='image'||!entry.src||ready(imgs.get(entry.src));
}

function blit(c:C,src:string,s:number,flip=1,_bw=48,bh=56){
 const img=imgs.get(src);
 if(!img||!ready(img)){
  c.fillStyle='#d8e5b988';c.fillRect(-16,-28,32,28);return;
 }
 const iw=img instanceof HTMLCanvasElement?img.width:img.naturalWidth;
 const ih=img instanceof HTMLCanvasElement?img.height:img.naturalHeight;
 const h=bh*s,w=Math.max(8,h*(iw/Math.max(1,ih)));
 c.save();c.scale(flip,1);c.drawImage(img,-w/2,-h,w,h);c.restore();
}

export function drawKit(c:C,entry:KitEntry,pose:Pose,time=0){
 const s=pose.s??entry.defaults.s??1;
 const flip=pose.flip??1;
 c.save();c.translate(pose.x,pose.y);c.rotate(pose.sway??0);c.scale(1+(pose.bounce??0)*.12,1-(pose.bounce??0)*.18);
 if(entry.id==='wind-mill')blit(c,entry.src!,s,flip,90,140);
 else if(entry.id==='wind-bell'){
  if(ready(imgs.get(entry.src!)))blit(c,entry.src!,s,flip,36,72);
  else windBell(c,s);
 }
 else if(entry.id==='wind-lantern')blit(c,entry.src!,s,flip,32,56);
 else if(entry.id==='wind-weed')blit(c,entry.src!,s,flip,40,36);
 else if(entry.id==='wind-pillar')blit(c,entry.src!,s,flip,28,90);
 else if(entry.id==='wind-bridge')blit(c,entry.src!,s,flip,96,28);
 else if(entry.id==='mirror-crystal')blit(c,entry.src!,s,flip,28,48);
 else if(entry.id==='mirror-lantern')blit(c,entry.src!,s,flip,28,52);
 else if(entry.id==='mirror-vine')blit(c,entry.src!,s,flip,36,56);
 else if(entry.id==='mirror-portal'){
  if(ready(imgs.get(entry.src!)))blit(c,entry.src!,s,flip,140,210);
  else starGate(c,s);
 }
 else if(entry.src)blit(c,entry.src,s,flip);
 else if(entry.id==='forest-mushroom')mushroom(c,s);
 else if(entry.id==='forest-fern')fern(c,s,flip);
 else if(entry.id==='forest-flower')flower(c,s);
 else if(entry.id==='forest-grass')grassBand(c,pose.w??120,pose.bounce,pose.x*.03,time);
 else if(entry.pickup==='dew')dew(c,entry.dewSkin);
 else if(entry.pickup==='souvenir')souvenir(c,entry.souvenirId);
 else if(entry.id==='honey-mound')honeyMound(c,s);
 else if(entry.id==='honey-puff')honeyPuff(c,s);
 else if(entry.id==='critter-jelly')jelly(c,s);
 else if(entry.id==='critter-moth'){c.fillStyle='#f4e7b8cc';c.beginPath();c.ellipse(-5,-8,6,3, -.4,0,Math.PI*2);c.ellipse(5,-8,6,3,.4,0,Math.PI*2);c.fill();}
 else if(entry.id==='critter-snail'){c.fillStyle='#8a7a52';c.beginPath();c.ellipse(0,-6,8,5,0,0,Math.PI*2);c.fill();}
 else if(entry.id==='tide-fall'){c.fillStyle='#8ad4ff44';c.fillRect(-(pose.w??40)/2,-(pose.h??200),pose.w??80,pose.h??200);}
 else {c.fillStyle='#d8e5b966';c.fillRect(-12,-12,24,24);}
 c.restore();
}

export function drawKitThumb(c:C,entry:KitEntry,w=56,h=44){
 c.clearRect(0,0,w,h);
 const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#1d3f35');g.addColorStop(1,'#14302a');
 c.fillStyle=g;c.fillRect(0,0,w,h);
 // Fill the tile: ~60% of the width for a default 80-wide rect, anchored near the floor.
 const k=w/56*.6;
 c.save();c.translate(w/2,h-h*.18);c.scale(k,k);
 drawKit(c,entry,{x:0,y:0,w:80,h:40,s:entry.defaults.s??1},0);
 c.restore();
}

const motion=new Map<string,{sway:number;vSway:number;bounce:number;vBounce:number}>();

export function stirDressing(items:DressingSpot[],sim:SlimeSimulation,dt:number){
 const bodies=sim.groups().map(g=>sim.center(g));
 for(const item of items){
  const entry=kitById(item.kit);if(!entry||entry.interact!=='sway')continue;
  const state=motion.get(item.id)??{sway:0,vSway:0,bounce:0,vBounce:0};
  let hit=0,bounce=0;
  for(const b of bodies){
   const dx=b.x-item.x;if(Math.abs(dx)>70)continue;
   if(b.y>item.y+20||b.y<item.y-90)continue;
   hit+=(dx>=0?1:-1)*.8;
   bounce+=.4;
  }
  state.vSway+=(-state.sway*26-state.vSway*5.5+hit*2)*dt;
  state.sway=Math.max(-.7,Math.min(.7,state.sway+state.vSway*dt));
  state.vBounce+=(-state.bounce*30-state.vBounce*6+bounce*3)*dt;
  state.bounce=Math.max(-.2,Math.min(.8,state.bounce+state.vBounce*dt));
  motion.set(item.id,state);
 }
}

export function drawDressing(c:C,items:DressingSpot[],camera:number,time:number,sim?:SlimeSimulation){
 if(sim)stirDressing(items,sim,1/60);
 for(const item of items){
  const entry=kitById(item.kit);if(!entry)continue;
  const x=item.x-camera;if(x<-120||x>1400)continue;
  const state=motion.get(item.id);
  drawKit(c,entry,{x,y:item.y,w:item.w,h:item.h,s:item.s,flip:item.flip,sway:state?.sway,bounce:state?.bounce},time);
 }
}

export function drawPortals(c:C,portals:PortalSpot[]|undefined,camera:number,time:number){
 const kit=kitById('mirror-portal');if(!kit||!portals?.length)return;
 for(const gate of portals){
  const x=gate.x-camera;if(x<-140||x>1420)continue;
  const pulse=1+.04*Math.sin(time*3+gate.x*.01);
  drawKit(c,kit,{x,y:gate.y,s:(gate.s??1)*pulse},time);
 }
}
