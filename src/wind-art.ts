import {W,H,canvas,rng} from './art';
import {gapBelowDeck,keyedSprite,stampDeck} from './art-key';
import {asset} from './asset';
import {WIND_FALLS,WIND_HEIGHT,WIND_WIDTH} from './content/chapter4/wind';
import {drawDressing,drawPortals} from './kit/view';
import {WIND_DECK,drawDeckGrass,gustDeckGrass,paintBasin,paintDeck,scatterDeckGrass,stirDeckGrass,type DeckGrass} from './kit/ground';
import {keyMatte,keyWhite,makeSlab,paintColumn,paintProp,paintSlab,type Slab} from './kit/slab';
import type {Level} from './level';
import type {Rect,SlimeSimulation} from './physics';
type C=CanvasRenderingContext2D;

/** Visual supports under the big decks, like the concept's rock pillars. Never solid. */
const COLUMNS:{x:number;y0:number;y1:number}[]=[
 {x:700,y0:792,y1:1240},
 {x:1400,y0:292,y1:760},
 {x:1450,y0:1212,y1:1680},
 {x:2050,y0:1212,y1:1680},
 {x:2950,y0:1132,y1:1680},
];
/** Landmarks stand on a deck row; they are dressing, not collision. */
const LANDMARKS:{id:'temple'|'tower';x:number;y:number;h:number}[]=[
 {id:'temple',x:1240,y:260,h:230},
 {id:'tower',x:1380,y:760,h:270},
];
/** Midground silhouettes, baked onto the middle canvas. Never solid. */
const SILS:{id:'isle'|'tower'|'arch';x:number;y:number;h:number}[]=[
 {id:'isle',x:360,y:980,h:240},
 {id:'tower',x:1980,y:540,h:300},
 {id:'arch',x:2860,y:920,h:220},
 {id:'isle',x:780,y:380,h:190},
];

function load(src:string){
 return new Promise<HTMLImageElement>((ok,err)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=err;i.src=src;});
}

function blit(dest:HTMLCanvasElement,img:CanvasImageSource,w:number,h:number){
 const c=dest.getContext('2d')!;
 c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 c.clearRect(0,0,w,h);c.drawImage(img,0,0,w,h);
}

export class WindArt{
 sky=canvas(W,H);
 far=canvas(WIND_WIDTH,WIND_HEIGHT);
 middle=canvas(WIND_WIDTH,WIND_HEIGHT);
 terrain=canvas(WIND_WIDTH,WIND_HEIGHT);
 ready=false;
 grasses:DeckGrass[]=[];
 private lastFlora=0;
 private wide?:Slab;
 private thin?:Slab;
 private bridge?:HTMLCanvasElement;
 private column?:HTMLCanvasElement;
 private props:Partial<Record<'temple'|'tower',HTMLCanvasElement>>={};
 private sils:Partial<Record<'isle'|'tower'|'arch',HTMLCanvasElement>>={};
 constructor(public level:Level){
  this.paintFallback();
  void this.hydrate();
 }
 private async hydrate(){
  try{
   const [sky,far,middle]=await Promise.all([
    load(asset('assets/wind/sky.jpg')),
    load(asset('assets/wind/far.jpg')),
    load(asset('assets/wind/middle.jpg')),
   ]);
   blit(this.sky,sky,W,H);
   blit(this.far,far,WIND_WIDTH,WIND_HEIGHT);
   blit(this.middle,middle,WIND_WIDTH,WIND_HEIGHT);
  }catch{/* keep fallback sky */}
  await Promise.all([
   load(asset('assets/wind/slab-wide.png')).then(i=>{this.wide=makeSlab(i,.2);}).catch(()=>{}),
   load(asset('assets/wind/slab-thin.png')).then(i=>{this.thin=makeSlab(i,.12);}).catch(()=>{}),
   load(asset('assets/wind/bridge.png')).then(i=>{this.bridge=keyedSprite(i);}).catch(()=>{}),
   load(asset('assets/wind/column.png')).then(i=>{this.column=keyWhite(i);}).catch(()=>{}),
   load(asset('assets/wind/temple.png')).then(i=>{this.props.temple=keyWhite(i);}).catch(()=>{}),
   load(asset('assets/wind/tower.png')).then(i=>{this.props.tower=keyWhite(i);}).catch(()=>{}),
   load(asset('assets/wind/sil-isle.png')).then(i=>{this.sils.isle=keyMatte(i);}).catch(()=>{}),
   load(asset('assets/wind/sil-tower.png')).then(i=>{this.sils.tower=keyMatte(i);}).catch(()=>{}),
   load(asset('assets/wind/sil-arch.png')).then(i=>{this.sils.arch=keyMatte(i);}).catch(()=>{}),
  ]);
  this.paintSils();
  this.paintTerrain();
  this.ready=true;
 }
 private paintFallback(){
  const s=this.sky.getContext('2d')!,g=s.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#3d8fd1');g.addColorStop(.55,'#9ed9f0');g.addColorStop(1,'#f4e7c1');
  s.fillStyle=g;s.fillRect(0,0,W,H);
  const glow=s.createRadialGradient(1030,115,0,1030,115,230);
  glow.addColorStop(0,'#fff6ce');glow.addColorStop(1,'#fff6ce00');s.fillStyle=glow;s.fillRect(780,0,500,360);
  const f=this.far.getContext('2d')!;
  f.fillStyle='#8ec4de';f.fillRect(0,0,WIND_WIDTH,WIND_HEIGHT);
  for(let i=0;i<10;i++){
   const x=220+i*340,y=180+(i%4)*90;
   f.fillStyle='#c5dce8aa';f.beginPath();
   f.moveTo(x-80,y+40);f.lineTo(x,y);f.lineTo(x+110,y+36);f.lineTo(x+40,y+58);f.closePath();f.fill();
  }
  this.middle.getContext('2d')!.clearRect(0,0,WIND_WIDTH,WIND_HEIGHT);
  this.paintSils();
  this.paintTerrain();
 }
 private paintSils(){
  const c=this.middle.getContext('2d')!;
  for(const s of SILS){const img=this.sils[s.id];if(img)paintProp(c,img,s.x,s.y,s.h,.9);}
 }
 /** Bridges are the thin `h<=22` stone spans; everything else is a slab. */
 private isBridge(s:Rect){return s.kind==='stone'&&s.h<=22&&s.w>150;}
 private deck(c:C,s:Rect,solids:Rect[],r:()=>number){
  if(s.kind==='boundary'||s.kind==='pool')return;
  const gap=gapBelowDeck(s,solids);
  if(this.isBridge(s)){
   if(this.bridge)stampDeck(c,this.bridge,s.x,s.y,s.w,gap);
   else paintDeck(c,s,r,WIND_DECK);
   return;
  }
  const slab=s.oneWay?this.thin:this.wide;
  if(!slab){paintDeck(c,s,r,WIND_DECK);return;}
  paintSlab(c,slab,s.x,s.y,s.w,s.oneWay?110:Math.min(260,Math.max(160,gap-10)),gap);
 }
 syncLayout(){this.paintTerrain();}
 private paintTerrain(){
  const c=this.terrain.getContext('2d')!,r=rng(441);
  c.clearRect(0,0,WIND_WIDTH,WIND_HEIGHT);
  const solids=this.level.base.filter(s=>s.kind!=='boundary');
  if(this.column)for(const col of COLUMNS)paintColumn(c,this.column,col.x,col.y0,col.y1,96,.92);
  for(const rect of this.level.base)this.deck(c,rect,solids,r);
  for(const w of this.level.waters)paintBasin(c,w,['#2a4a3c','#1c3a32','#102820'],'#dbe9c8aa');
  for(const m of LANDMARKS){const img=this.props[m.id];if(img)paintProp(c,img,m.x,m.y,m.h);}
  if(!this.grasses.length)this.grasses=scatterDeckGrass(this.level.base.filter(s=>!this.isBridge(s)),r,['#c4d45a','#9bb84a','#e0e878','#6a8a38']);
 }
 drawLayers(c:C,camera:number,cameraY:number,shx=0,shy=0){
  c.drawImage(this.sky,0,0);
  c.drawImage(this.far,-camera*.15+shx*.25,cameraY*.12+shy*.25);
  c.save();c.globalAlpha=.82;
  c.drawImage(this.middle,-camera*.38+shx*.5,cameraY*.28+shy*.5);
  c.restore();
  c.save();c.globalCompositeOperation='screen';
  for(let i=0;i<4;i++){
   c.save();c.translate(480+i*240-camera*.1+shx*.5,-70+cameraY*.05+shy*.5);c.rotate(.28);
   const g=c.createLinearGradient(-60,0,60,0);
   g.addColorStop(0,'#fff4c800');g.addColorStop(.5,'#fff1b814');g.addColorStop(1,'#fff4c800');
   c.fillStyle=g;c.fillRect(-60,0,120,900);c.restore();
  }
  c.restore();
  c.drawImage(this.terrain,-camera+shx,cameraY+shy);
 }
 drawAtmosphere(c:C,camera:number,cameraY:number,time:number){
  c.save();c.globalAlpha=.32;
  for(let i=0;i<8;i++){
   const y=60+i*86+Math.sin(time*.7+i)*12+cameraY*.2;
   c.strokeStyle='#fff';c.lineWidth=3;
   c.beginPath();
   c.moveTo(i*280-camera*.15,y);
   c.bezierCurveTo(i*280+90-camera*.15,y-30,i*280+170-camera*.15,y+28,i*280+280-camera*.15,y);
   c.stroke();
  }
  c.restore();
 }
 gust(x:number,y:number,_facing:number,power:number){
  gustDeckGrass(this.grasses,x,y,power);
 }
 private sign(c:C,x:number,y:number,text:string,arrow:string){
  c.fillStyle='#726546';c.fillRect(x-4,y-74,8,74);c.save();c.translate(x,y-61);c.rotate(-.045);
  c.fillStyle='#a6996a';c.beginPath();c.roundRect(-46,-16,92,34,4);c.fill();c.strokeStyle='#dfd0a344';c.stroke();
  c.fillStyle='#414e36';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText(text,-4,-2);c.font='16px sans-serif';c.fillText(arrow,0,14);c.restore();
 }
 private exitGate(c:C,camera:number,time:number){
  const e=this.level.exit;if(!e)return;
  const cx=e.x+e.w/2-camera,floor=e.y+e.h,pulse=.62+.38*Math.sin(time*2.1);
  const glow=c.createRadialGradient(cx,floor-40,8,cx,floor-40,90);
  glow.addColorStop(0,`rgba(255,236,170,${.34*pulse})`);glow.addColorStop(1,'rgba(255,236,170,0)');
  c.fillStyle=glow;c.fillRect(cx-110,e.y-20,220,e.h+50);
  c.save();c.strokeStyle=`rgba(255,246,210,${.45+pulse*.35})`;c.lineWidth=4;
  c.beginPath();c.moveTo(cx-68,floor);c.quadraticCurveTo(cx,e.y+8,cx+68,floor);c.stroke();
  c.restore();
  this.sign(c,e.x+36-camera,floor-8,'终点','→');
 }
 private stirFlora(sim:SlimeSimulation,time:number){
  const dt=Math.min(.05,this.lastFlora?time-this.lastFlora:1/60);this.lastFlora=time;
  stirDeckGrass(this.grasses,sim.groups().map(g=>sim.center(g)),dt);
 }
 private falls(c:C,camera:number){
  for(const f of WIND_FALLS){
   const x=f.x-camera,y0=f.y;
   const g=c.createLinearGradient(x,y0,x,y0+f.h);
   g.addColorStop(0,'#d7f4ff00');g.addColorStop(.15,'#d7f4ff77');g.addColorStop(1,'#d7f4ff00');
   c.fillStyle=g;c.fillRect(x,y0,f.w,f.h);
  }
 }
 drawDetails(c:C,camera:number,time:number,sim:SlimeSimulation){
  this.stirFlora(sim,time);
  this.falls(c,camera);
  drawDeckGrass(c,this.grasses,camera,time,sim.groups().map(g=>sim.center(g)));
  if(this.level.dressing.length)drawDressing(c,this.level.dressing,camera,time,sim);
  drawPortals(c,this.level.portals,camera,time);
  for(const s of this.level.signs??[])this.sign(c,s.x-camera,s.y,s.text,s.arrow);
  this.exitGate(c,camera,time);
  for(const d of this.level.dew){
   if(d.got)continue;
   const x=d.x-camera,y=d.y+Math.sin(time*4+d.x)*2;
   c.fillStyle='#fff0a8';c.shadowColor='#fff0a8';c.shadowBlur=14;
   c.beginPath();c.arc(x,y,9,0,7);c.fill();
  }
  for(const s of this.level.souvenirs){
   if(s.got)continue;
   const x=s.x-camera,y=s.y+Math.sin(time*2.4)*3;
   c.fillStyle='#f7d66d';c.shadowColor='#f7d66d';c.shadowBlur=18;
   c.beginPath();c.arc(x,y,14,0,7);c.fill();
  }
  c.shadowBlur=0;
 }
 drawNear(_c:C,_camera:number,_cameraY:number){}
}
