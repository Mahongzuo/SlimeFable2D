import {W,H,canvas,rng} from './art';
import {gapBelowDeck} from './art-key';
import {asset} from './asset';
import {MIRROR_HEIGHT,MIRROR_SHOAL,MIRROR_WIDTH} from './content/chapter5/mirror';
import {drawDressing} from './kit/view';
import {MIRROR_DECK,drawDeckGrass,gustDeckGrass,paintBasin,paintDeck,scatterDeckGrass,stirDeckGrass,type DeckGrass} from './kit/ground';
import {keyWhite,makeSlab,paintColumn,paintProp,paintSlab,type Slab} from './kit/slab';
import type {Level} from './level';
import type {Rect,SlimeSimulation} from './physics';
import type {WaterSimulation} from './water';
type C=CanvasRenderingContext2D;

/** Ivy columns holding the ruins up. Visual only. */
const COLUMNS:{x:number;y0:number;y1:number}[]=[
 {x:640,y0:752,y1:1680},
 {x:1600,y0:1212,y1:1680},
 {x:2250,y0:1212,y1:1680},
 {x:2800,y0:312,y1:1180},
];
/** Gate on the exit deck, altar on 光影祭坛, armillary in 星空花园. Dressing, not collision. */
const LANDMARKS:{id:'gate'|'altar'|'armillary';x:number;y:number;h:number}[]=[
 {id:'gate',x:2620,y:280,h:250},
 {id:'altar',x:2420,y:1180,h:210},
 {id:'armillary',x:860,y:720,h:200},
];

function load(src:string){
 return new Promise<HTMLImageElement>((ok,err)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=err;i.src=src;});
}

function blit(dest:HTMLCanvasElement,img:CanvasImageSource,w:number,h:number){
 const c=dest.getContext('2d')!;
 c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 c.clearRect(0,0,w,h);c.drawImage(img,0,0,w,h);
}

export class MirrorArt{
 sky=canvas(W,H);
 far=canvas(MIRROR_WIDTH,MIRROR_HEIGHT);
 middle=canvas(MIRROR_WIDTH,MIRROR_HEIGHT);
 terrain=canvas(MIRROR_WIDTH,MIRROR_HEIGHT);
 ready=false;
 grasses:DeckGrass[]=[];
 private lastFlora=0;
 private wide?:Slab;
 private thin?:Slab;
 private column?:HTMLCanvasElement;
 private props:Partial<Record<'gate'|'altar'|'armillary',HTMLCanvasElement>>={};
 constructor(public level:Level){
  this.paintFallback();
  void this.hydrate();
 }
 private async hydrate(){
  try{
   const [sky,far,middle]=await Promise.all([
    load(asset('assets/mirror/sky.jpg')),
    load(asset('assets/mirror/far.jpg')),
    load(asset('assets/mirror/middle.jpg')),
   ]);
   blit(this.sky,sky,W,H);
   blit(this.far,far,MIRROR_WIDTH,MIRROR_HEIGHT);
   blit(this.middle,middle,MIRROR_WIDTH,MIRROR_HEIGHT);
  }catch{/* keep fallback sky */}
  await Promise.all([
   load(asset('assets/mirror/slab-wide.png')).then(i=>{this.wide=makeSlab(i,.2);}).catch(()=>{}),
   load(asset('assets/mirror/slab-thin.png')).then(i=>{this.thin=makeSlab(i,.12);}).catch(()=>{}),
   load(asset('assets/mirror/column.png')).then(i=>{this.column=keyWhite(i);}).catch(()=>{}),
   load(asset('assets/mirror/gate.png')).then(i=>{this.props.gate=keyWhite(i);}).catch(()=>{}),
   load(asset('assets/mirror/altar.png')).then(i=>{this.props.altar=keyWhite(i);}).catch(()=>{}),
   load(asset('assets/mirror/armillary.png')).then(i=>{this.props.armillary=keyWhite(i);}).catch(()=>{}),
  ]);
  this.paintTerrain();
  this.ready=true;
 }
 private paintFallback(){
  const s=this.sky.getContext('2d')!,g=s.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#4f9be0');g.addColorStop(.5,'#a9d6f4');g.addColorStop(1,'#eef6fb');
  s.fillStyle=g;s.fillRect(0,0,W,H);
  const moon=s.createRadialGradient(980,90,8,980,90,160);
  moon.addColorStop(0,'#ffffffcc');moon.addColorStop(.2,'#ffffff55');moon.addColorStop(1,'#ffffff00');
  s.fillStyle=moon;s.fillRect(820,0,320,280);
  const f=this.far.getContext('2d')!;
  f.fillStyle='#c9e2f2';f.fillRect(0,0,MIRROR_WIDTH,MIRROR_HEIGHT);
  this.middle.getContext('2d')!.clearRect(0,0,MIRROR_WIDTH,MIRROR_HEIGHT);
  this.paintTerrain();
 }
 private deck(c:C,s:Rect,solids:Rect[],r:()=>number){
  if(s.kind==='boundary'||s.kind==='pool')return;
  const gap=gapBelowDeck(s,solids);
  const slab=s.oneWay?this.thin:this.wide;
  if(!slab){paintDeck(c,s,r,MIRROR_DECK);return;}
  paintSlab(c,slab,s.x,s.y,s.w,s.oneWay?64:Math.min(250,Math.max(120,gap-10)),gap);
 }
 private paintTerrain(){
  const c=this.terrain.getContext('2d')!,r=rng(773);
  c.clearRect(0,0,MIRROR_WIDTH,MIRROR_HEIGHT);
  const solids=this.level.base.filter(s=>s.kind!=='boundary');
  if(this.column)for(const col of COLUMNS)paintColumn(c,this.column,col.x,col.y0,col.y1,90,.92);
  for(const rect of this.level.base)this.deck(c,rect,solids,r);
  for(const w of this.level.waters)paintBasin(c,w,['#3d6f8a','#2a5a7a','#1b3d58'],'#dff2ffaa');
  for(const m of LANDMARKS){const img=this.props[m.id];if(img)paintProp(c,img,m.x,m.y,m.h);}
  if(!this.grasses.length)this.grasses=scatterDeckGrass(this.level.base,r,['#6fae7c','#8ec9a4','#4a8a6a','#b8e8ff']);
 }
 drawLayers(c:C,camera:number,cameraY:number,shx=0,shy=0){
  c.drawImage(this.sky,0,0);
  c.drawImage(this.far,-camera*.15+shx*.25,cameraY*.12+shy*.25);
  c.save();c.globalAlpha=.7;
  c.drawImage(this.middle,-camera*.38+shx*.5,cameraY*.28+shy*.5);
  c.restore();
  c.drawImage(this.terrain,-camera+shx,cameraY+shy);
 }
 drawAtmosphere(c:C,camera:number,cameraY:number,time:number){
  c.save();
  for(let i=0;i<28;i++){
   const x=((i*137+time*12)%1400)-40-camera*.08;
   const y=30+(i*47)%320+cameraY*.06;
   c.fillStyle=`rgba(255,246,210,${.35+.35*Math.sin(time*1.4+i)})`;
   c.beginPath();c.arc(x,y,i%5===0?1.8:1.1,0,7);c.fill();
  }
  c.restore();
 }
 drawPool(c:C,water:WaterSimulation,camera:number,time:number,front:boolean){
  const b=MIRROR_SHOAL,x=b.x-camera,y=b.y;
  if(x>1280||x+b.w<0)return;
  const lake=new Path2D();
  lake.roundRect(x,y,b.w,b.h,Math.min(36,b.h/2));
  if(!front){
   const g=c.createLinearGradient(0,y-8,0,y+b.h);
   g.addColorStop(0,'#7ec8ff55');g.addColorStop(.45,'#2a6a9e99');g.addColorStop(1,'#12324f88');
   c.fillStyle=g;c.fill(lake);
   return;
  }
  c.save();c.clip(lake);
  c.strokeStyle='#c8ecff88';c.lineWidth=1.4;
  c.beginPath();
  for(let i=0;i<96;i++){
   const px=x+i*b.w/96,py=y+water.heights[i]*.35;
   if(i===0)c.moveTo(px,py);else c.lineTo(px,py);
  }
  c.stroke();
  for(let i=0;i<10;i++){
   c.fillStyle=`rgba(210,236,255,${.12+.1*Math.sin(time*2+i)})`;
   c.beginPath();c.ellipse(x+28+i*44,y+22+Math.sin(time+i)*3,16,3,0,0,7);c.fill();
  }
  c.restore();
  for(const d of water.drops){
   const px=d.x-camera;c.save();c.translate(px,d.y);
   c.fillStyle='#d6f0ffcc';c.beginPath();c.ellipse(0,0,d.r,d.r*1.2,0,0,7);c.fill();c.restore();
  }
 }
 gust(x:number,y:number,_facing:number,power:number){
  gustDeckGrass(this.grasses,x,y,power);
 }
 private sign(c:C,x:number,y:number,text:string,arrow:string){
  c.fillStyle='#3d4a6a';c.fillRect(x-4,y-74,8,74);c.save();c.translate(x,y-61);c.rotate(-.04);
  c.fillStyle='#7d89a8';c.beginPath();c.roundRect(-46,-16,92,34,4);c.fill();c.strokeStyle='#d4e4ff44';c.stroke();
  c.fillStyle='#e8f0ff';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText(text,-4,-2);c.font='16px sans-serif';c.fillText(arrow,0,14);c.restore();
 }
 private exitGate(c:C,camera:number,time:number){
  const e=this.level.exit;if(!e)return;
  const cx=e.x+e.w/2-camera,floor=e.y+e.h,pulse=.62+.38*Math.sin(time*2.1);
  const glow=c.createRadialGradient(cx,floor-40,8,cx,floor-40,90);
  glow.addColorStop(0,`rgba(180,220,255,${.34*pulse})`);glow.addColorStop(1,'rgba(180,220,255,0)');
  c.fillStyle=glow;c.fillRect(cx-110,e.y-20,220,e.h+50);
  c.save();c.strokeStyle=`rgba(210,236,255,${.45+pulse*.35})`;c.lineWidth=4;
  c.beginPath();c.moveTo(cx-68,floor);c.quadraticCurveTo(cx,e.y+8,cx+68,floor);c.stroke();
  c.restore();
  this.sign(c,e.x+36,floor-8,'终点','→');
 }
 private stirFlora(sim:SlimeSimulation,time:number){
  const dt=Math.min(.05,this.lastFlora?time-this.lastFlora:1/60);this.lastFlora=time;
  stirDeckGrass(this.grasses,sim.groups().map(g=>sim.center(g)),dt);
 }
 drawDetails(c:C,camera:number,time:number,sim:SlimeSimulation){
  this.stirFlora(sim,time);
  drawDeckGrass(c,this.grasses,camera,time,sim.groups().map(g=>sim.center(g)));
  if(this.level.dressing.length)drawDressing(c,this.level.dressing,camera,time,sim);
  for(const s of this.level.signs??[])this.sign(c,s.x-camera,s.y,s.text,s.arrow);
  this.exitGate(c,camera,time);
  for(const d of this.level.dew){
   if(d.got)continue;
   const x=d.x-camera,y=d.y+Math.sin(time*4+d.x)*2;
   c.fillStyle='#d6eeff';c.shadowColor='#d6eeff';c.shadowBlur=14;
   c.beginPath();c.arc(x,y,9,0,7);c.fill();
  }
  for(const s of this.level.souvenirs){
   if(s.got)continue;
   const x=s.x-camera,y=s.y+Math.sin(time*2.4)*3;
   c.fillStyle='#9fd4ea';c.shadowColor='#9fd4ea';c.shadowBlur=18;
   c.beginPath();c.arc(x,y,14,0,7);c.fill();
  }
  c.shadowBlur=0;
 }
}
