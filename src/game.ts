import {HoneyLevel} from './honey-level';
import {Level} from './level';
import {SlimeSimulation} from './physics';
import {WaterSimulation} from './water';
import {emptyActions,type Actions} from './input';

export class Adventure {
 level=new Level();
 sim=new SlimeSimulation(300,540,this.level.solids);
 water=new WaterSimulation(this.level.water);
 started=false;paused=false;debug=false;camera=0;cameraY=0;levelVersion=0;time=0;elapsed=0;
 name='史莱姆';notice='';noticeUntil=0;
 private accumulator=0;private jumpQueued=false;private last=emptyActions();
 constructor(){this.sim.water=this.level.water;}
 selectLevel(id:string){
  this.level=id==='honey'?new HoneyLevel():new Level();
  this.sim=new SlimeSimulation(this.level.checkpoint.x,this.level.checkpoint.y,this.level.solids);
  this.sim.water=id==='honey'?null:this.level.water;
  this.water=new WaterSimulation(this.level.water);
  this.camera=this.cameraY=this.elapsed=0;this.paused=false;this.accumulator=0;this.clearInput();this.levelVersion++;
 }
 reset(){this.level.respawn(this.sim);this.water=new WaterSimulation(this.level.water);this.clearInput();}
 start(){this.started=true;this.paused=false;}
 quitToTitle(){this.started=false;this.paused=false;this.selectLevel(this.level.id);}
 togglePause(){if(!this.started||this.level.complete)return;this.paused=!this.paused;this.clearInput();}
 clearInput(){this.jumpQueued=false;this.last=emptyActions();}
 message(text:string){this.notice=text;this.noticeUntil=this.time+2.8;}
 apply(actions:Actions){
  this.last=actions;
  if(actions.pause)this.togglePause();
  if(!this.started||this.paused||this.level.complete)return;
  if(actions.jump)this.jumpQueued=true;
  if(actions.split)this.message(this.sim.split()?'一团变两团 · 切换 / 1、2 直选':'已经分成两团啦 · 靠近后合并');
  if(actions.switch){this.clearInput();this.sim.switchGroup();this.message(`正在控制 ${this.sim.activeGroup+1} 号${this.name}`);}
  if(actions.select1||actions.select2){this.clearInput();this.sim.selectGroup(actions.select1?0:1);this.message(`正在控制 ${this.sim.activeGroup+1} 号${this.name}`);}
  if(actions.merge)this.message(this.sim.merge()?'又是完整的一滴了':'再靠近一点，身体相遇才能合并');
  if(actions.reset){this.reset();this.message('回到最近的检查点');}
 }
 tick(delta:number,actions?:Actions){
  if(actions)this.apply(actions);
  this.time+=Math.min(delta,.05);
  if(this.paused||this.level.complete){this.accumulator=0;return;}
  this.accumulator+=Math.min(delta,.05);
  while(this.accumulator>=1/120){
   const move=this.started?this.last.move:0;
   const climb=this.started?this.last.climb:0;
   this.sim.step(1/120,{move,squeeze:this.started&&this.last.squeeze,jump:this.jumpQueued,jumpHeld:this.last.jumpHeld,climb});
   if(this.level instanceof HoneyLevel){for(const pool of this.level.pools)if(Math.abs(pool.bounds.x+pool.bounds.w/2-this.sim.center().x)<950)pool.step(1/120,this.sim);}else this.water.step(1/120,this.sim.particles);
   const dewBefore=this.level.dew.filter(d=>d.got).length;
   this.jumpQueued=false;this.level.update(this.sim,1/120);
   const dewAfter=this.level.dew.filter(d=>d.got).length;
   if(dewAfter>dewBefore)this.message(`拾到一颗${this.level.id==='honey'?'蜜露':'晨露'} · ${dewAfter} / ${this.level.dew.length}`);
   this.accumulator-=1/120;
   if(this.started)this.elapsed+=1/120;
  }
  const center=this.sim.center(),target=Math.max(0,Math.min(this.level.width-1280,center.x-460));
  this.camera+=(target-this.camera)*(1-Math.exp(-delta*4));
  let ty=0;
  if(this.level.id==='honey'){
   ty=this.cameraY;const screen=center.y+ty;
   if(screen<270)ty+=270-screen;if(screen>500)ty+=500-screen;
   ty=Math.max(-220,Math.min(280,ty));
  }
  this.cameraY+=(ty-this.cameraY)*(1-Math.exp(-delta*3.2));
 }
}
