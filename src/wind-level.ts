import {CAMY_WIND,FEATURES_HEATH} from './catalog';
import {WIND_LAYOUT} from './content/chapter4/wind';
import {Level} from './level';
import {SlimeSimulation} from './physics';

export class WindLevel extends Level{
 override readonly id='wind';
 override readonly features=FEATURES_HEATH;
 override readonly camY=CAMY_WIND;
 constructor(){
  super(WIND_LAYOUT);
  this.gateOpen=true;
  this.bossDown=true;
  this.solids=[...this.base];
 }
 override hint(x:number,g:number,y=1640){
  if(y>1480)return x<1320?'风铃会提示落点 · 沿西阶跳上钟铃峡谷':'东荒原补给池 · 木桥连东草甸，西回峡谷';
  if(y>1100&&x<800)return '继续向上到哨塔，或跳回荒原走木桥';
  if(y>1000)return '风车平原可以歇脚 · 东侧台阶通向神殿';
  if(y>600)return '哨塔能看见终点 · 沿东阶向上';
  return g>1?'把两团带到一起，按 E 合并，再走进神殿残拱':'走进神殿残拱，通关后还可继续逛';
 }
 override respawn(sim:SlimeSimulation){
  this.solids=[...this.base];
  sim.reset(this.checkpoint.x,this.checkpoint.y);
  sim.solids=this.solids;
 }
}
