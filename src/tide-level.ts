import {CAMY_TIDE,FEATURES_FOREST} from './catalog';
import type {LevelLayout} from './content/types';
import {Level} from './level';
import {TIDE_FALLS,TIDE_LAYOUT,TIDE_WATERS,type TideFall,type TideWater} from './content/chapter3/tide';
import {SlimeSimulation,type Rect} from './physics';
import {WaterSimulation} from './water';
import {fallCore,WaterfallSim} from './waterfall';

function inside(r:Rect,x:number,y:number,padX=10,padTop=36,padBot=24){
 return x>r.x-padX&&x<r.x+r.w+padX&&y>r.y-padTop&&y<r.y+r.h+padBot;
}

export class TideLevel extends Level {
 override readonly id='tide';
 override readonly features=FEATURES_FOREST;
 override readonly camY=CAMY_TIDE;
 waters:TideWater[]=TIDE_WATERS.map(w=>({...w}));
 readonly falls:TideFall[]=TIDE_FALLS.map(f=>({...f}));
 pools:WaterSimulation[]=[];
 curtains:WaterfallSim[]=[];
 /** Set for one update when a body first pushes into any waterfall. */
 fallHit=false;
 constructor(layout?:LevelLayout){
  super(layout??TIDE_LAYOUT);
  this.gateOpen=true;
  this.solids=[...this.base];
  if(layout?.waters?.length)this.waters=layout.waters.map(w=>({...w}));
  this.pools=this.waters.map(w=>new WaterSimulation(w));
  this.curtains=this.falls.map(f=>new WaterfallSim(f));
 }
 override applyLayout(layout:LevelLayout){
  super.applyLayout(layout);
  this.gateOpen=true;
  if(layout.waters?.length)this.waters=layout.waters.map(w=>({...w}));
  this.solids=[...this.base];
 }
 bodyAt(x:number,y:number):Rect|null{
  return this.waters.find(w=>inside(w,x,y))??null;
 }
 inRefill(x:number,y:number){
  return this.waters.some(w=>inside(w,x,y));
 }
 inFall(x:number,y:number){
  return this.falls.some(f=>{const c=fallCore(f);return x>c.x&&x<c.x+c.w&&y>c.y&&y<c.y+c.h;});
 }
 override update(sim:SlimeSimulation,dt:number,interact=false){
  const c=sim.center();
  this.ecology.update(dt,sim,interact);
  this.applyEcoPlatforms(sim);
  sim.water=this.bodyAt(c.x,c.y);
  for(const pool of this.pools)pool.step(dt,sim.particles);
  this.fallHit=false;
  for(const curtain of this.curtains){curtain.step(dt,sim.particles);if(curtain.hit)this.fallHit=true;}
  if(c.x>1700&&c.y>1040&&c.y<1140)this.checkpoint={x:1900,y:1080};
  if(c.x>1120&&c.x<1400&&c.y>560&&c.y<660)this.checkpoint={x:1260,y:600};
  if(c.x>1180&&c.x<2020&&c.y>330&&c.y<440)this.checkpoint={x:1400,y:380};
  if(c.x>1720&&c.x<2040&&c.y<300)this.checkpoint={x:1900,y:250};
  for(const d of this.dew)if(!d.got&&sim.particles.some(p=>(p.x-d.x)**2+(p.y-d.y)**2<25**2))d.got=true;
  for(const s of this.souvenirs)if(!s.got&&sim.particles.some(p=>(p.x-s.x)**2+(p.y-s.y)**2<28**2))s.got=true;
  this.stepPortals(sim,dt);
  if(c.x>1720&&c.x<2040&&c.y<300&&c.y>150&&sim.groups().length===1&&this.bossDown)this.complete=true;
  if(sim.particles.some(p=>!Number.isFinite(p.x)||p.y>this.fallY)){this.fell=true;this.respawn(sim);}
 }
 override respawn(sim:SlimeSimulation){
  this.ecology.rewind();
  this.pools=this.waters.map(w=>new WaterSimulation(w));
  this.curtains=this.falls.map(f=>new WaterfallSim(f));
  this.solids=[...this.base];
  sim.reset(this.checkpoint.x,this.checkpoint.y);
  sim.solids=this.solids;
  const body=sim.center();
  sim.water=this.bodyAt(body.x,body.y);
 }
 override hint(x:number,_groups:number,y=1200):string{
  if(y>1250)return x<700?'池里能补炮弹和生命，瀑布会被你的身体切开':'往右贴着东台石壁按 W 爬上去';
  if(y>1100)return '跳上左侧石桥，桥尽头的拱肩石壁可以爬';
  if(y>900)return '贴着西侧石壁按 W 爬到三层';
  if(y>640)return x>1500?'潮池能补给，往上借四层石壁攀爬':'跳上前方石壁抓住，爬到四层长台';
  if(y>440)return '两段跳上西侧巨石，或往东穿过瀑布';
  if(x<1100)return '苍白潮客守在西侧巨石 · 躲开吸血束';
  return _groups>1?'把两团带到一起，按 E 合并，再走进残拱':'合并后走到东侧残拱下';
 }
}
