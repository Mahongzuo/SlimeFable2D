import {HoneyLevel} from './honey-level';
import {TideLevel} from './tide-level';
import {WindLevel} from './wind-level';
import {MirrorLevel} from './mirror-level';
import {Level} from './level';
import {SlimeSimulation} from './physics';
import {WaterSimulation} from './water';
import {emptyActions,type Actions} from './input';
import {FOREST_LAYOUT} from './content/chapter1/forest';
import type {LevelLayout} from './content/types';
import {isCustomId,isOfficialId} from './editor/schema';
import {loadMap,loadOfficialOverride} from './editor/store';
import {CAMY_LOCKED,type LevelFeatures} from './catalog';
import {CombatSystem} from './combat/combat';
import {ENEMIES,activeSkill,isBoss,livingGates,makeActor,stepMachine} from './ai/machine';
import {type Actor} from './actor/actor';
import {AbilitySystemComponent} from './gas/asc';
import {applyEffect} from './gas/effects';
import {tryActivate} from './gas/catalog';
import {Inventory} from './items/inventory';
import {itemOf} from './items/defs';
import {MoodDirector} from './face/mood';

const MAX_HEARTS=5,MAX_AMMO=10;
export const SWALLOW_RANGE=260;
export const SWALLOW_NEAR=78;

export type Swallow={prey:Actor;t:number;phase:'reel'|'gulp'|'digest';fromX:number;fromY:number}
export type Ghost={x:number;y:number;t:number;life:number;facing:number}

export class Adventure {
 level=new Level();
 sim=new SlimeSimulation(300,540,this.level.solids);
 water=new WaterSimulation(this.level.water);
 started=false;paused=false;dead=false;linger=false;debug=false;fromEditor=false;camera=0;cameraY=0;levelVersion=0;time=0;elapsed=0;
 private keepLayout?:LevelLayout;
 keepFeatures?:LevelFeatures;
 keepSource?:string;
 name='史莱姆';notice='';noticeUntil=0;
 notices:{text:string;until:number}[]=[];
 asc=new AbilitySystemComponent({hp:MAX_HEARTS,maxHp:MAX_HEARTS,ammo:MAX_AMMO,attack:1});
 invuln=0;shake=0;
 combat=new CombatSystem();
 get hearts(){return this.asc.attrs.hp;}
 set hearts(value:number){this.asc.attrs.hp=Math.max(0,value);}
 get ammo(){return this.asc.attrs.ammo;}
 set ammo(value:number){this.asc.attrs.ammo=Math.max(0,value);}
 mood=new MoodDirector();
 pack=new Inventory();
 actors:Actor[]=[];
 foundSouvenirs:string[]=[];
 defeated:Record<string,number>={};
 pulses:{x:number;y:number;facing:number;power:number}[]=[];
 swallow:Swallow|null=null;
 ghosts:Ghost[]=[];
 cues:string[]=[];
 aimX=0;
 private accumulator=0;private jumpQueued=false;private last=emptyActions();
 private refillAcc=0;private healAcc=0;private meleeHold=0;private dodgeCd=0;private spawnN=0;
 private wet=false;private grounded=false;private airTime=0;
 constructor(){this.sim.water=this.level.water;this.bootActors();}
 selectLevel(id:string,layout?:LevelLayout){
  const stored=isCustomId(id)?loadMap(id):isOfficialId(id)?loadOfficialOverride(id):undefined;
  const used=layout??stored?.layout;
  const chapter=stored?.source??(isOfficialId(id)?id:this.keepSource)??'forest';
  this.keepLayout=used;
  this.level=chapter==='honey'?new HoneyLevel(used):chapter==='tide'?new TideLevel(used):chapter==='wind'?new WindLevel(used):chapter==='mirror'?new MirrorLevel(used):new Level(used??FOREST_LAYOUT);
  if(used&&this.keepFeatures)this.level.features=this.keepFeatures;
  else if(stored?.features)this.level.features=stored.features;
  this.sim=new SlimeSimulation(this.level.checkpoint.x,this.level.checkpoint.y,this.level.solids);
  this.sim.water=this.level instanceof HoneyLevel?null:this.level instanceof TideLevel?this.level.bodyAt(this.level.checkpoint.x,this.level.checkpoint.y):this.level instanceof MirrorLevel?this.level.bodyAt(this.level.checkpoint.x,this.level.checkpoint.y):this.level.water;
  this.water=new WaterSimulation(this.level.water);
  this.camera=this.cameraY=this.elapsed=0;this.paused=false;this.dead=false;this.linger=false;this.accumulator=0;this.clearInput();
  this.resetVitals();this.bootActors();this.mood=new MoodDirector();this.levelVersion++;
 }
 resetVitals(){
  this.asc=new AbilitySystemComponent({hp:MAX_HEARTS,maxHp:MAX_HEARTS,ammo:MAX_AMMO,attack:1});
  this.invuln=0;this.refillAcc=0;this.healAcc=0;this.shake=0;
  this.combat=new CombatSystem();this.pack.clear();this.foundSouvenirs=[];this.defeated={};
  this.notices=[];this.notice='';this.noticeUntil=0;this.swallow=null;this.meleeHold=0;this.pulses=[];
  this.ghosts=[];this.dodgeCd=0;this.spawnN=0;this.dead=false;this.cues=[];
 }
 bootActors(){
  this.actors=this.level.enemies.map(spot=>makeActor(spot.kind,spot.x,spot.y,spot.id,spot.patrol??50));
 }
 reset(){this.level.respawn(this.sim);this.water=new WaterSimulation(this.level.water);this.clearInput();}
 restartRun(){
  const revoke=[...this.foundSouvenirs];
  this.selectLevel(this.level.id,this.keepLayout);
  this.start();
  return revoke;
 }
 start(){this.started=true;this.paused=false;this.dead=false;}
 quitToTitle(){this.started=false;this.paused=false;this.dead=false;this.selectLevel(this.level.id);}
 frozen(){return this.level.complete&&!this.linger;}
 stay(){this.linger=true;this.paused=false;this.clearInput();}
 togglePause(){if(!this.started||this.frozen()||this.dead)return;this.paused=!this.paused;this.clearInput();}
 clearInput(){this.jumpQueued=false;this.last=emptyActions();}
 cue(name:string){this.cues.push(name);}
 message(text:string){
  this.notice=text;this.noticeUntil=this.time+2.8;
  const last=this.notices.at(-1);
  if(last&&last.text===text){last.until=this.time+2.6;return;}
  this.notices.push({text,until:this.time+2.6});
  if(this.notices.length>3)this.notices.shift();
 }
 facing(){
  const v=this.sim.center(this.sim.activeGroup).vx;
  if(Math.abs(v)>12)this.combat.facing=v>0?1:-1;
  return this.combat.facing;
 }
 hurt(amount:number,why:string){
  if(this.invuln>0||this.asc.has('state.invuln')||this.asc.has('state.dodge')||this.asc.has('state.dead')||!this.level.features.combat||this.dead)return;
  const body=this.sim.center(this.sim.activeGroup);
  if(!applyEffect(this.asc,{damage:amount,addTags:['state.invuln'],duration:.8,cue:'hurt'},{x:body.x,y:body.y-18},this.combat.cues))return;
  this.invuln=.8;this.shake=Math.max(this.shake,7);
  this.mood.pulse('hurt',.7,90);
  this.cue('hurt');
  if(this.hearts<=0){
   this.dead=true;this.paused=false;this.asc.tags.add('state.dead');
   this.message('身体散掉了');
   this.cue('die');
  }else this.message(why);
 }
 nearestBoss(range=540){
  const body=this.sim.center();
  let best:Actor|undefined,bestD=range;
  for(const actor of this.actors){
   const def=ENEMIES[actor.kind];
   if(!def?.boss||actor.dead)continue;
   const d=Math.hypot(actor.x-body.x,actor.y-body.y);
   if(d<bestD){best=actor;bestD=d;}
  }
  return best;
 }
 inForestWater(){
  if(!this.level.features.ammoRefill)return false;
  const w=this.level.water,c=this.sim.center();
  return c.x>w.x&&c.x<w.x+w.w&&c.y>w.y-36&&c.y<w.y+w.h+20;
 }
 inTideRefill(){
  if(!(this.level instanceof TideLevel))return false;
  const c=this.sim.center();
  return this.level.inRefill(c.x,c.y);
 }
 inHoneyRefill(){
  if(!(this.level instanceof HoneyLevel))return false;
  const c=this.sim.center();
  return this.level.inRefill(c.x,c.y);
 }
 questProgress(id:string){
  const quest=this.level.quests.find(q=>q.id===id);if(!quest)return {have:0,need:0,done:false};
  const step=quest.steps[0];
  let have=0;
  if(step.type==='dew')have=this.level.dew.filter(d=>(d.role??'main')===step.target&&d.got).length;
  if(step.type==='defeat')have=this.defeated[step.target]??0;
  if(step.type==='souvenir')have=this.level.souvenirs.filter(s=>s.id===step.target&&s.got).length;
  return {have,need:step.count,done:have>=step.count};
 }
 apply(actions:Actions){
  this.last=actions;
  if(actions.pause)this.togglePause();
  if(!this.started||this.paused||this.frozen()||this.dead)return;
  if(actions.inventory&&this.level.features.inventory)this.pack.toggle();
  if(this.pack.open)return;
  if(actions.jump){this.jumpQueued=true;this.cue('jump');}
  if(actions.split)this.message(this.sim.split()?'一团变两团 · 切换 / 1、2 直选':'已经分成两团啦 · 靠近后合并');
  if(actions.switch){this.clearInput();this.sim.switchGroup();this.message(`正在控制 ${this.sim.activeGroup+1} 号${this.name}`);}
  if(actions.select1||actions.select2){this.clearInput();this.sim.selectGroup(actions.select1?0:1);this.message(`正在控制 ${this.sim.activeGroup+1} 号${this.name}`);}
  if(actions.merge)this.message(this.sim.merge()?'又是完整的一滴了':'再靠近一点，身体相遇才能合并');
  if(actions.reset){this.reset();this.message('回到最近的检查点');}
  if(this.level.features.combat){
   const body=this.sim.center(this.sim.activeGroup),face=this.facing();
   if(actions.melee){
    const prey=this.actors.find(a=>this.canSwallow(a)&&Math.hypot(a.x-body.x,a.y-body.y)<SWALLOW_NEAR);
    if(prey&&!this.swallow){/* 残血长按吞噬，短按不斩 */}
    else{
    const lock=this.combat.lockTarget(this.actors,body.x,body.y);
    const aim=lock?Math.sign(lock.x-body.x)||face:face;
    if(tryActivate(this.asc,'player.slash',{self:this.asc,combat:this.combat,x:body.x,y:body.y,facing:aim})){
     if(lock)this.sim.chase(lock.x,lock.y);
     else this.sim.lunge(aim);
     this.mood.pulse('attack',.22,70);
     this.shake=Math.max(this.shake,this.combat.lastStep()===3?8:3.2);
     this.strike();
     this.pulseWorld(body.x,body.y,aim,1);
     this.cue('slash');
    }
    }
   }
   if(actions.ranged){
    if(this.ammo<=0)this.message(this.level instanceof HoneyLevel?'去蜜池补充炮弹':this.level instanceof TideLevel?'去水池补充炮弹':'去浅湾补充炮弹');
    else {
     const lock=this.combat.lockTarget(this.actors,body.x,body.y,170);
     if(tryActivate(this.asc,'player.shot',{self:this.asc,combat:this.combat,x:body.x,y:body.y,facing:face,home:lock?{id:lock.id,x:lock.x,y:lock.y-lock.h*.4}:undefined})){
      this.sim.spit(face);this.mood.pulse('spit',.34,75);
      this.pulseWorld(body.x+face*24,body.y,face,.85);
      this.cue('spit');
     }
    }
   }
   if(actions.dodge)this.tryDodge();
  }
 }
 tryDodge(dir?:number){
  if(!this.level.features.combat||this.dead)return false;
  const body=this.sim.center(this.sim.activeGroup);
  const face=this.facing();
  const byMove=Math.abs(this.last.move)>.2?Math.sign(this.last.move):0;
  const byAim=this.aimX?Math.sign(this.aimX-body.x):0;
  const heading=dir||byMove||byAim||face;
  if(!tryActivate(this.asc,'player.dodge',{self:this.asc,combat:this.combat,x:body.x,y:body.y,facing:heading}))return false;
  this.ghosts.push(
   {x:body.x,y:body.y,t:0,life:.35,facing:heading},
   {x:body.x-heading*22,y:body.y+2,t:.04,life:.32,facing:heading},
   {x:body.x-heading*40,y:body.y+4,t:.08,life:.28,facing:heading},
  );
  this.sim.dash(heading);
  this.invuln=Math.max(this.invuln,.28);
  this.dodgeCd=.7;
  this.mood.pulse('focus',.2,55);
  this.cue('dodge');
  return true;
 }
 pulseWorld(x:number,y:number,facing=1,power=1){
  this.pulses.push({x,y,facing,power});
  if(this.level instanceof TideLevel){
   for(const pool of this.level.pools){
    const w=pool.bounds;
    if(x>w.x&&x<w.x+w.w&&y>w.y-18&&y<w.y+w.h)pool.impact(Math.max(w.x+8,Math.min(w.x+w.w-8,x)),160*power,.7);
   }
   return;
  }
  const w=this.level.water;
  if(x>w.x-50&&x<w.x+w.w+50&&y>w.y-90&&y<w.y+w.h+50)this.water.impact(Math.max(w.x+8,Math.min(w.x+w.w-8,x)),160*power,.7);
 }
 canSwallow(actor:Actor){
  if(actor.dead||actor.hp<=0||actor.state==='reel')return false;
  return actor.hp/actor.maxHp<=.2||actor.hp===1;
 }
 swallowRange(actor:Actor){
  return Math.hypot(actor.x-this.sim.center(this.sim.activeGroup).x,actor.y-this.sim.center(this.sim.activeGroup).y);
 }
 swallowBulk(){
  if(!this.swallow)return 1;
  const t=this.swallow.t;
  if(this.swallow.phase==='reel')return 1+.85*(Math.min(t,.4)/.4);
  if(t<.55){
   const u=(t-.4)/.15;
   return 1.85-u*.35+Math.sin(u*Math.PI)*0.18;
  }
  if(t<.9)return 1.5-(t-.55)*.9;
  return 1;
 }
 strike(){
  const knock=this.combat.lastStep()===3?34:18;
  if(this.combat.hitStakes(this.level.stakes))this.shake=Math.max(this.shake,4);
  const killed=this.combat.hitActors(this.actors,knock,this.level.solids);
  if(killed.length)this.shake=Math.max(this.shake,6);
  for(const actor of killed)this.collectKill(actor);
 }
 collectKill(actor:Actor){
  this.defeated[actor.kind]=(this.defeated[actor.kind]??0)+1;
  const def=ENEMIES[actor.kind];
  if(def?.drop&&Math.random()<def.drop.chance&&this.pack.add(def.drop.id))this.cue('dew');
  if(def?.boss)this.message(`击败了${def.name}`);
  if(def?.gate||this.level.enemies.some(e=>ENEMIES[e.kind]?.gate))this.level.bossDown=!livingGates(this.actors);
 }
 tick(delta:number,actions?:Actions){
  if(actions)this.apply(actions);
  this.time+=Math.min(delta,.05);
  if(this.paused||this.frozen()||this.dead){this.accumulator=0;return;}
  this.accumulator+=Math.min(delta,.05);
  while(this.accumulator>=1/120){
   const slow=this.combat.slowAt(this.sim.center(this.sim.activeGroup).x,this.sim.center(this.sim.activeGroup).y);
   const move=this.started?this.last.move*(slow?.38:1):0;
   const climb=this.started?this.last.climb:0;
   const wasGround=this.grounded;
   this.sim.step(1/120,{move,squeeze:this.started&&this.last.squeeze,jump:this.jumpQueued,jumpHeld:this.last.jumpHeld,climb});
   if(this.sim.recalled){this.sim.recalled=false;this.message('身体吸回来了');}
   this.grounded=this.sim.particles.some(p=>p.group===this.sim.activeGroup&&p.ground);
   if(this.grounded){
    if(this.started&&!wasGround&&this.airTime>.16)this.cue('land');
    this.airTime=0;
   }else this.airTime+=1/120;
   if(this.level instanceof HoneyLevel){for(const pool of this.level.pools)if(Math.abs(pool.bounds.x+pool.bounds.w/2-this.sim.center().x)<950)pool.step(1/120,this.sim);}
   else if(!(this.level instanceof TideLevel))this.water.step(1/120,this.sim.particles);
   const dewBefore=this.level.dew.filter(d=>d.got).length;
   const souvenirsBefore=this.level.souvenirs.filter(s=>s.got).map(s=>s.id);
   this.jumpQueued=false;this.level.update(this.sim,1/120);
   if(this.started&&this.level instanceof TideLevel&&this.level.fallHit){this.cue('splash');this.sim.impactJelly(.7);}
   const dewAfter=this.level.dew.filter(d=>d.got).length;
    if(this.level.ported){this.message('穿过星门');this.mood.pulse('happy',.7,36);}
    if(dewAfter>dewBefore){
    this.message(`拾到一颗${this.level.id==='honey'?'蜜露':this.level.id==='tide'?'盐晶':'晨露'} · ${dewAfter} / ${this.level.dew.length}`);
    this.mood.pulse('happy',.9,45);
    this.sim.impactJelly(1.3);
    this.asc.tags.add('item.dew');
    this.cue('dew');
   }
   for(const souvenir of this.level.souvenirs){
    if(!souvenir.got||souvenirsBefore.includes(souvenir.id))continue;
    this.pack.add(souvenir.id);
    if(!this.foundSouvenirs.includes(souvenir.id))this.foundSouvenirs.push(souvenir.id);
    this.asc.tags.add(`item.souvenir.${souvenir.id}`);
    this.message(`纪念物 · ${itemOf(souvenir.id)?.name??souvenir.name}`);
    this.mood.pulse('happy',1.1,50);
    this.sim.impactJelly(1.6);
    this.cue('dew');
   }
   if(this.level.fell){
    this.level.fell=false;
    if(this.started&&this.level.features.combat)this.hurt(1,'坠落，回到检查点');
   }
   this.stepWorld(1/120);
   this.accumulator-=1/120;
   if(this.started)this.elapsed+=1/120;
  }
  const center=this.sim.center(),target=Math.max(0,Math.min(this.level.width-1280,center.x-460));
  this.camera+=(target-this.camera)*(1-Math.exp(-delta*4));
  const cam=this.level.camY??CAMY_LOCKED;
  let ty=this.cameraY;
  if(cam.min!==0||cam.max!==0){
   const screen=center.y+ty;
   if(screen<cam.deadTop)ty+=cam.deadTop-screen;
   if(screen>cam.deadBot)ty+=cam.deadBot-screen;
   ty=Math.max(cam.min,Math.min(cam.max,ty));
  }else ty=0;
  this.cameraY+=(ty-this.cameraY)*(1-Math.exp(-delta*3.2));
  this.shake=Math.max(0,this.shake-delta*28);
  this.notices=this.notices.filter(n=>this.time<n.until);
  const grounded=this.sim.particles.some(p=>p.group===this.sim.activeGroup&&p.ground);
  this.mood.tick(Math.min(delta,.05),{move:this.last.move,ground:grounded,hurt:this.invuln});
  if(this.started&&grounded&&Math.abs(this.last.move)>.25)this.cue('step');
  this.stepSwallow(Math.min(delta,.05));
  this.dodgeCd=Math.max(0,this.dodgeCd-Math.min(delta,.05));
  for(const g of this.ghosts)g.t+=Math.min(delta,.05);
  this.ghosts=this.ghosts.filter(g=>g.t<g.life);
 }
 private beginSwallow(prey:Actor){
  prey.state='reel';prey.invuln=9;
  this.swallow={prey,t:0,phase:'reel',fromX:prey.x,fromY:prey.y};this.meleeHold=0;
  this.mood.pulse('focus',.45,80);
  this.combat.suck(this.sim.center(this.sim.activeGroup).x,this.sim.center(this.sim.activeGroup).y);
  this.cue('swallow');
 }
 private gulpPrey(){
  const prey=this.swallow!.prey;
  prey.dead=true;prey.state='dead';prey.hp=0;prey.asc?.tags.add('state.dead');
  this.swallow!.phase='gulp';
  this.collectKill(prey);
  this.sim.impactJelly(2.8);
  this.mood.pulse('happy',.8,60);
  this.shake=Math.max(this.shake,6);
  this.message(`吞下了${ENEMIES[prey.kind]?.name??'敌人'}`);
  this.pulseWorld(this.sim.center().x,this.sim.center().y,this.facing(),1.2);
 }
 private stepSwallow(dt:number){
  if(this.last.meleeHeld)this.meleeHold+=dt;else this.meleeHold=0;
  if(!this.swallow&&this.meleeHold>=.45&&this.level.features.combat){
   const body=this.sim.center(this.sim.activeGroup);
   const prey=this.actors.filter(a=>this.canSwallow(a)&&Math.hypot(a.x-body.x,a.y-body.y)<SWALLOW_RANGE)
    .sort((a,b)=>Math.hypot(a.x-body.x,a.y-body.y)-Math.hypot(b.x-body.x,b.y-body.y))[0];
   if(prey)this.beginSwallow(prey);
  }
  if(!this.swallow)return;
  this.swallow.t+=dt;
  const body=this.sim.center(this.sim.activeGroup);
  if(this.swallow.phase==='reel'){
   const u=Math.min(1,this.swallow.t/.4);
   const ease=u*u*(3-2*u);
   this.swallow.prey.x=this.swallow.fromX+(body.x-this.swallow.fromX)*ease;
   this.swallow.prey.y=this.swallow.fromY+(body.y-this.swallow.fromY)*ease;
   if(this.swallow.t>=.4)this.gulpPrey();
   return;
  }
  this.swallow.prey.x=body.x;this.swallow.prey.y=body.y;
  if(this.swallow.phase==='gulp'&&this.swallow.t>=.55)this.swallow.phase='digest';
  if(this.swallow.t>=5)this.swallow=null;
 }
 private spawn(kind:string,x:number,y:number){
  this.spawnN++;
  this.actors.push(makeActor(kind,x,y,`${kind}-${this.spawnN}`,40));
 }
 private stepWorld(dt:number){
  this.invuln=Math.max(0,this.invuln-dt);
  this.asc.step(dt);
  const body=this.sim.center(this.sim.activeGroup);
  this.combat.step(dt,this.level.solids,{x:body.x,y:body.y},this.actors.filter(a=>!a.dead).map(a=>({id:a.id,x:a.x,y:a.y-a.h*.4})));
  if(this.combat.smashed)this.cue('smash');
  for(const shot of this.combat.shots){
   if(this.level instanceof TideLevel){
    for(const pool of this.level.pools){
     const w=pool.bounds;
     if(!shot.rippled&&shot.x>w.x&&shot.x<w.x+w.w&&shot.y>w.y-20&&shot.y<w.y+w.h){
      shot.rippled=true;pool.impact(shot.x,140,.55);this.pulses.push({x:shot.x,y:shot.y,facing:shot.facing,power:.6});
     }
    }
   }else{
    const w=this.level.water;
    if(!shot.rippled&&shot.x>w.x&&shot.x<w.x+w.w&&shot.y>w.y-20&&shot.y<w.y+w.h){
     shot.rippled=true;this.water.impact(shot.x,140,.55);this.pulses.push({x:shot.x,y:shot.y,facing:shot.facing,power:.6});
    }
   }
  }
  if(this.combat.shots.length||this.combat.slashes.length){
   this.combat.hitStakes(this.level.stakes);
   const killed=this.combat.hitActors(this.actors,18,this.level.solids);
   for(const actor of killed)this.collectKill(actor);
  }
  const wet=this.level instanceof TideLevel?this.inTideRefill():this.level instanceof HoneyLevel?this.inHoneyRefill():this.inForestWater();
  if(wet&&!this.wet)this.cue('splash');
  if(wet)this.cue('swim');
  this.wet=wet;
  if(wet){
   this.refillAcc+=dt;
   if(this.ammo<MAX_AMMO&&this.refillAcc>=.25){
    applyEffect(this.asc,{ammo:1},{x:body.x,y:body.y},this.combat.cues);
    this.refillAcc=0;if(this.ammo===MAX_AMMO)this.message('炮弹补满了');
   }
   this.healAcc+=dt;
   if(this.hearts<MAX_HEARTS&&this.healAcc>=1.2){
    applyEffect(this.asc,{heal:1},{x:body.x,y:body.y-16},this.combat.cues);
    this.healAcc=0;if(this.hearts===MAX_HEARTS)this.message('身体补满了');
   }
  }else{this.refillAcc=0;this.healAcc=0;}
  if(!this.level.features.combat)return;
  for(const actor of this.actors){
   if(actor.state==='dying'){
    stepMachine(actor,ENEMIES[actor.kind]??ENEMIES.cap,{playerX:body.x,playerY:body.y,dt,solids:this.level.solids});
    continue;
   }
   if(actor.dead)continue;
   actor.asc?.step(dt);
   const def=ENEMIES[actor.kind]??ENEMIES.cap;
   const was=actor.state;
   const incomingMelee=(def.boss||actor.kind==='escort')&&this.combat.slashes.some(s=>Math.hypot(s.x-actor.x,s.y-(actor.y-actor.h*.45))<s.r+36);
   const incomingShot=def.boss&&this.combat.shots.some(s=>s.alive&&Math.hypot(s.x-actor.x,s.y-(actor.y-actor.h*.4))<90);
   stepMachine(actor,def,{playerX:body.x,playerY:body.y,dt,solids:this.level.solids,incomingMelee,incomingShot,playerGrounded:this.grounded,allies:this.actors});
   if(was==='telegraph'&&actor.state==='attack'){
    const skill=activeSkill(actor,def);
    if(actor.asc)tryActivate(actor.asc,`enemy.${skill.kind}`,{
     self:actor.asc,combat:this.combat,x:actor.x,y:actor.y,facing:actor.facing,
     targetX:body.x,targetY:body.y,range:skill.range,name:def.name,actors:this.actors,
     spawn:(kind,x,y)=>this.spawn(kind,x,y),
     hitPlayer:(damage,why)=>this.hurt(damage,why),
    });
    if(skill.kind==='summon'||skill.kind==='howl')this.cue('summon');
    else if(skill.kind==='melon'||skill.kind==='bow'||skill.kind==='hawk')this.cue('melon');
    else if(skill.kind==='charge'||skill.kind==='slam'||skill.kind==='pounce')this.cue('smash');
    else if(skill.kind==='ult'||skill.kind==='magic'||skill.kind==='dragon'||skill.kind==='drain'||skill.kind==='ring'||skill.kind==='clone'){
     if(skill.kind==='ult'||skill.kind==='dragon')this.shake=Math.max(this.shake,10);
     this.cue('ult');
    }else if(skill.kind==='gale'||skill.kind==='parry')this.cue('slash');
   }
   if(actor.kind==='hive'&&actor.asc&&actor.state!=='idle'&&actor.state!=='patrol'){
    if(!actor.asc.cds.has('enemy.summon'))actor.asc.setCd('enemy.summon',5);
    else if(tryActivate(actor.asc,'enemy.summon',{
     self:actor.asc,combat:this.combat,x:actor.x,y:actor.y,facing:actor.facing,name:def.name,
     actors:this.actors,spawn:(kind,x,y)=>this.spawn(kind,x,y),
    }))this.cue('summon');
   }
   if((actor.kind==='han'||actor.kind==='horn')&&actor.hp<=actor.maxHp*.4&&actor.asc&&!actor.asc.has('boss.sync')){
    const partner=this.actors.find(a=>a.id!==actor.id&&(a.kind==='han'||a.kind==='horn')&&!a.dead);
    if(partner){
     actor.asc.hold('boss.sync',20);partner.asc?.hold('boss.sync',20);
     tryActivate(actor.asc,actor.kind==='han'?'enemy.dragon':'enemy.clone',{
      self:actor.asc,combat:this.combat,x:actor.x,y:actor.y,facing:actor.facing,
      targetX:body.x,targetY:body.y,name:def.name,actors:this.actors,
     });
     this.shake=Math.max(this.shake,12);this.cue('ult');
    }
   }
  }
  if(this.level.enemies.some(e=>ENEMIES[e.kind]?.gate))this.level.bossDown=!livingGates(this.actors);
  if(this.combat.hitsPlayer(body.x,body.y))this.hurt(1,'被打到了身体');
  if(this.combat.pushX){
   const push=this.combat.pushX*dt;
   for(const p of this.sim.particles)if(p.group===this.sim.activeGroup)p.x+=push;
  }
 }
}

export function bossBar(adventure:Adventure){
 const bosses=adventure.actors.filter(a=>isBoss(a.kind)&&(!a.dead||a.state==='dying')).map(a=>{
  const d=Math.hypot(a.x-adventure.sim.center().x,a.y-adventure.sim.center().y);
  return {actor:a,d};
 }).filter(item=>item.d<540).sort((a,b)=>a.d-b.d);
 if(!bosses.length)return {visible:false,name:'',hp:0,maxHp:0};
 const first=bosses[0].actor;
 const second=bosses[1]?.actor;
 return {
  visible:true,name:ENEMIES[first.kind]?.name??first.kind,hp:first.hp,maxHp:first.maxHp,
  other:second?{name:ENEMIES[second.kind]?.name??second.kind,hp:second.hp,maxHp:second.maxHp}:undefined,
 };
}

