import {CAMY_HONEY,FEATURES_HONEY} from './catalog';
import type {LevelLayout} from './content/types';
import {Level} from './level';
import {SlimeSimulation,type Rect} from './physics';
import {WaxPlatform} from './wax';
import {HoneyPool} from './honey';

export class HoneyLevel extends Level {
 override readonly id='honey';
 override readonly width=5000;
 override readonly features=FEATURES_HONEY;
 override readonly camY=CAMY_HONEY;
 override readonly fallY=980;
 override readonly water={x:-9999,y:9999,w:1,h:1};
 override readonly gate:Rect={x:3588,y:180,w:30,h:280,kind:'gate'};
 readonly lowWall:Rect={x:3588,y:460,w:30,h:400,kind:'gate'};
 override readonly plates=[{x:3460,y:600},{x:4140,y:248}];
 override readonly base:Rect[]=[
  {x:-80,y:600,w:800,h:360,kind:'wax-rock'},
  {x:720,y:800,w:500,h:200,kind:'pool'},
  {x:1220,y:600,w:370,h:360,kind:'wax-rock'},
  {x:1590,y:800,w:890,h:180,kind:'pool'},
  {x:2090,y:575,w:128,h:26,kind:'wax-rock',oneWay:true},
  {x:2320,y:690,w:140,h:52,kind:'wax-rock',oneWay:true},
  {x:2380,y:650,w:80,h:50,kind:'wax-rock',oneWay:true},
  {x:2480,y:600,w:150,h:360,kind:'wax-rock'},
  {x:2630,y:330,w:78,h:270,kind:'wax-rock'},
  {x:2710,y:518,w:96,h:24,kind:'wax-rock',oneWay:true},
  {x:2975,y:338,w:118,h:26,kind:'wax-rock',oneWay:true},
  {x:3125,y:248,w:88,h:24,kind:'wax-rock',oneWay:true},
  {x:3210,y:200,w:80,h:300,kind:'wax-rock'},
  {x:2710,y:750,w:500,h:210,kind:'pool'},
  {x:3290,y:248,w:308,h:22,kind:'wax-rock',oneWay:true},
  {x:3360,y:600,w:228,h:360,kind:'wax-rock'},
  {x:4055,y:248,w:170,h:24,kind:'wax-rock',oneWay:true},
  {x:3618,y:600,w:740,h:360,kind:'wax-rock'},
  {x:4410,y:588,w:86,h:20,kind:'hex-pad',oneWay:true},
  {x:4725,y:588,w:86,h:20,kind:'hex-pad',oneWay:true},
  {x:4848,y:600,w:220,h:360,kind:'wax-rock'},
  {x:4358,y:800,w:490,h:180,kind:'pool'},
  {x:-30,y:-400,w:30,h:1400,kind:'boundary'},
  {x:5000,y:-400,w:30,h:1400,kind:'boundary'},
 ];
 readonly curtains:Rect[]=[{x:2630,y:330,w:78,h:270},{x:3210,y:200,w:80,h:220}];
 wax=[
  new WaxPlatform(1660,588,120),
  new WaxPlatform(1865,572,122),
  new WaxPlatform(2277,555,118),
  new WaxPlatform(2840,432,110),
  new WaxPlatform(3680,248,115),
  new WaxPlatform(3880,248,115),
  new WaxPlatform(4575,575,110),
 ];
 pools=[
  new HoneyPool({x:728,y:598,w:484,h:206},true,6),
  new HoneyPool({x:1600,y:688,w:860,h:118},true,7),
  new HoneyPool({x:4368,y:688,w:470,h:118},false,7),
 ];
 latchOn=false;
 override checkpoint={x:280,y:540};
 override solids:Rect[]=[];
 override souvenirs=[];
 override stakes=[];
 override enemies=[
  {kind:'bear',x:1340,y:600,id:'bear-a',patrol:50},
  {kind:'eboar',x:2560,y:600,id:'eboar-a',patrol:60},
  {kind:'hive',x:4180,y:600,id:'hive-2061',patrol:70},
 ];
 override quests=[];
 override dew=[
  {x:520,y:548,got:false},
  {x:1288,y:548,got:false},
  {x:1928,y:520,got:false},
  {x:3034,y:290,got:false},
  {x:4140,y:200,got:false},
  {x:4770,y:530,got:false},
 ];
 inRefill(x:number,y:number){
  return this.pools.some(p=>x>p.bounds.x-10&&x<p.bounds.x+p.bounds.w+10&&y>p.bounds.y-36&&y<p.bounds.y+p.bounds.h+30);
 }
 constructor(layout?:LevelLayout){
  super();
  this.bossDown=true;
  if(layout){
   this.base=layout.base.map(r=>({...r}));
   this.dew=layout.dew.map(d=>({...d}));
   if(layout.enemies.length)this.enemies=layout.enemies.map(e=>({...e,patrol:e.patrol??50}));
   this.checkpoint={...layout.checkpoint};
  }
  this.sync();
 }
 private occupied(sim:SlimeSimulation,plate:{x:number;y:number},pad=38){
  return sim.groups().some(g=>sim.particles.filter(p=>p.group===g&&p.ground&&Math.abs(p.x-plate.x)<pad&&Math.abs(p.y-plate.y)<8).length>6);
 }
 private sync(){
  const openUpper=this.latchOn||this.plateActive[0];
  this.solids=[
   ...this.base,
   ...this.wax.filter(p=>p.solid).map(p=>p.rect),
   ...(openUpper?[]:[this.gate]),
   ...(this.latchOn?[]:[this.lowWall]),
  ];
 }
 film(group:number){return Math.max(0,...this.pools.map(p=>p.film.get(group)??0));}
 override update(sim:SlimeSimulation,dt:number){
  for(const p of this.wax)p.advance(dt,p.solid&&p.supported(sim));
  for(const wall of this.curtains){
   if(!sim.climbing)continue;
   for(const p of sim.particles){
    if(p.group!==sim.activeGroup)continue;
    if(p.x>wall.x-10&&p.x<wall.x+wall.w+10&&p.y>wall.y&&p.y<wall.y+wall.h){p.vy*=Math.exp(-1.1*dt);p.vx*=Math.exp(-.8*dt);}
   }
  }
  const holding=this.occupied(sim,this.plates[0],42);
  const onLatch=this.occupied(sim,this.plates[1],40);
  if(onLatch){this.latchOn=true;this.gateOpen=true;this.gateCharge=1;}
  this.plateActive=[holding,onLatch||this.latchOn];
  this.sync();sim.solids=this.solids;
  const body=sim.center();
  const wet=this.pools.find(p=>body.x>p.bounds.x-10&&body.x<p.bounds.x+p.bounds.w+10&&body.y>p.bounds.y-36&&body.y<p.bounds.y+p.bounds.h+30);
  sim.water=wet?.bounds??null;
  const c=sim.center();
  if(c.x>1280&&c.x<1550&&c.y<620&&this.checkpoint.x<1280)this.checkpoint={x:1380,y:540};
  if(c.x>2970&&c.x<3140&&c.y<370&&this.checkpoint.x<2970)this.checkpoint={x:3034,y:290};
  if(c.x>4200&&this.latchOn)this.checkpoint={x:4280,y:540};
  for(const d of this.dew)if(!d.got&&sim.particles.some(p=>Math.hypot(p.x-d.x,p.y-d.y)<25))d.got=true;
  this.stepPortals(sim,dt);
  if(c.x>4920&&sim.groups().length===1&&this.latchOn)this.complete=true;
  if(sim.particles.some(p=>!Number.isFinite(p.x)||p.y>980))this.respawn(sim);
 }
 override respawn(sim:SlimeSimulation){
  for(const w of this.wax)w.reset();
  this.pools=this.pools.map(p=>new HoneyPool(p.bounds,p.drip,p.spacing));
  this.plateActive=[false,this.latchOn];
  this.sync();
  sim.reset(this.checkpoint.x,this.checkpoint.y);
  sim.solids=this.solids;
  sim.water=null;
  const body=sim.center();
  const wet=this.pools.find(p=>body.x>p.bounds.x-10&&body.x<p.bounds.x+p.bounds.w+10&&body.y>p.bounds.y-36&&body.y<p.bounds.y+p.bounds.h+30);
  sim.water=wet?.bounds??null;
 }
 override get area(){return [
  {at:0,name:'蜜光前庭',sub:'AMBER VESTIBULE'},
  {at:650,name:'沉蜜浅湾',sub:'HONEY LAGOON'},
  {at:1550,name:'三息碎桥',sub:'THREE-BREATH BRIDGE'},
  {at:2500,name:'滴蜜攀井',sub:'GOLDEN ASCENT'},
  {at:3300,name:'双路蜜锁',sub:'TWIN HONEY SEAL'},
  {at:4350,name:'蜜心穹顶',sub:'HEART OF THE HIVE'},
 ];}
 override hint(x:number,groups:number):string{
  if(x<650)return '第二章 · 琥珀蜜穴 — 前方是可以游泳的深蜜湾，顶上会滴下蜂蜜';
  if(x<1550)return '沉蜜浅湾 · 蜜中有浮力，按住 S 下潜，空格跳出，离开时会拉出蜜丝';
  if(x<2500)return '薄蜡盖很快就会碎，踩上去立刻会裂 · 落下可游浅蜜和斜台回来';
  if(x<3300)return '滴蜜攀井 · 贴墙按 W 上爬，空格蹬墙后再跳一次';
  if(x<4350)return this.latchOn?'蜜锁已永久开启 · 带回另一团，靠近按 E 合并':groups===1?'Q 分裂 · 一团停在下路永久踏板，另一团走上路碎桥去碰开关':'C 切换 · 下路踏板开门，上路开关会永久锁存';
  return groups>1?'回到一起按 E 合并，再走进蜜心':'最后的蜂蜡桥 · 保持轻盈，前方就是蜜心穹顶';
 }
}
