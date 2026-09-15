import {CAMY_WIND,FEATURES_HEATH} from './catalog';
import {MIRROR_LAYOUT,MIRROR_SHOAL} from './content/chapter5/mirror';
import {Level} from './level';
import {SlimeSimulation,type Rect} from './physics';

function inside(r:Rect,x:number,y:number,padX=8,padTop=20,padBot=12){
 return x>r.x-padX&&x<r.x+r.w+padX&&y>r.y-padTop&&y<r.y+r.h+padBot;
}

export class MirrorLevel extends Level{
 override readonly id='mirror';
 override readonly features=FEATURES_HEATH;
 override readonly camY=CAMY_WIND;
 readonly shoal=MIRROR_SHOAL;
 constructor(){
  super(MIRROR_LAYOUT);
  this.gateOpen=true;
  this.bossDown=true;
  this.solids=[...this.base];
 }
 bodyAt(x:number,y:number):Rect|null{
  return inside(this.shoal,x,y)?this.shoal:null;
 }
 override update(sim:SlimeSimulation,dt:number){
  super.update(sim,dt);
  const c=sim.center();
  sim.water=this.bodyAt(c.x,c.y);
 }
 override hint(x:number,g:number,y=1640){
  if(y>1480)return '浅滩嵌在两岸之间 · 走进会沉，空格跃出后走东阶';
  if(y>1000)return '西去花园，东侧宽阶通向神门';
  if(y>600)return '星空花园 · 沿石廊回到祭坛';
  return g>1?'把两团带到一起，按 E 合并，再走进天穹之门':'合并后走进天穹之门，通关后还可继续逛';
 }
 override respawn(sim:SlimeSimulation){
  this.solids=[...this.base];
  sim.reset(this.checkpoint.x,this.checkpoint.y);
  sim.solids=this.solids;
  sim.water=this.bodyAt(this.checkpoint.x,this.checkpoint.y);
 }
}
