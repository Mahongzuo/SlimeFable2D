import {describe,expect,it} from 'vitest';
import {Adventure,bossBar} from '../src/game';
import {Level} from '../src/level';
import {HoneyLevel} from '../src/honey-level';
import {TideLevel} from '../src/tide-level';
import {TIDE_FALLS,TIDE_WATERS} from '../src/content/chapter3/tide';
import {WindLevel} from '../src/wind-level';
import {WIND_LAYOUT,WIND_POOL} from '../src/content/chapter4/wind';
import {MirrorLevel} from '../src/mirror-level';
import {MIRROR_LAYOUT,MIRROR_SHOAL} from '../src/content/chapter5/mirror';
import {gapBelowDeck,pickDeckKind,stampDeckLayout} from '../src/art-key';
import {deckStyle} from '../src/kit/ground';
import {slabLayout} from '../src/kit/slab';
import {readFileSync} from 'node:fs';
import {CATALOG,CAMY_WIND} from '../src/catalog';
import {emptyActions} from '../src/input';
import {CombatSystem} from '../src/combat/combat';
import {ENEMIES,chooseSkill,hurtActor,livingGates,makeActor,stepMachine} from '../src/ai/machine';
import {ABILITIES} from '../src/gas/catalog';
import {applyEffect} from '../src/gas/effects';
import {CueBus} from '../src/gas/cues';
import {dashHitsPlayer,resolveActor,separateFromPlayer} from '../src/actor/actor';
import {Inventory} from '../src/items/inventory';
import {bakeForest,bakeVariants} from '../src/wfc/bake';
import {reachable} from '../src/wfc/reach';
import {FOREST_LAYOUT} from '../src/content/chapter1/forest';
import {FOREST_VARIANTS} from '../src/content/chapter1/variants';
import {SlimeSimulation} from '../src/physics';
import {MoodDirector} from '../src/face/mood';

describe('catalog features',()=>{
 it('enables forest systems and honey combat without refill or quests',()=>{
  expect(CATALOG[0].features.combat).toBe(true);
  expect(CATALOG[1].features.combat).toBe(true);
  expect(CATALOG[1].features.ammoRefill).toBe(false);
  expect(CATALOG[1].features.quests).toBe(false);
  expect(new Level().features.quests).toBe(true);
  expect(new Level().camY.min).toBeLessThan(0);
  expect(new HoneyLevel().features.combat).toBe(true);
  expect(new HoneyLevel().features.ammoRefill).toBe(false);
  expect(new HoneyLevel().features.quests).toBe(false);
  expect(new HoneyLevel().camY.max).toBe(280);
  expect(CATALOG[2].features.combat).toBe(true);
  expect(new TideLevel().features.ammoRefill).toBe(true);
  expect(CATALOG[3].camY.min).toBe(CAMY_WIND.min);
  expect(new WindLevel().camY.min).toBeLessThan(-1000);
  expect(new WindLevel().features.combat).toBe(true);
  expect(new WindLevel().features.ammoRefill).toBe(true);
  expect(CATALOG[3].features.ammoRefill).toBe(true);
  expect(CATALOG[4].camY.min).toBe(CAMY_WIND.min);
  expect(new MirrorLevel().camY.min).toBeLessThan(-1000);
  expect(new MirrorLevel().features.combat).toBe(true);
  expect(new MirrorLevel().features.ammoRefill).toBe(true);
  expect(CATALOG[4].features.ammoRefill).toBe(true);
 });
});

describe('vitals and refill',()=>{
 it('resets hearts and ammo on enter, refills only in forest water',()=>{
  const a=new Adventure();
  a.hearts=1;a.ammo=0;
  a.selectLevel('forest');
  expect(a.hearts).toBe(5);expect(a.ammo).toBe(10);
  a.ammo=0;a.hearts=2;a.start();
  a.sim.particles.forEach(p=>{p.x=2600;p.y=640;});
  expect(a.inForestWater()).toBe(true);
  for(let i=0;i<40;i++)a.tick(1/20,emptyActions());
  expect(a.ammo).toBeGreaterThan(0);
  expect(a.hearts).toBeGreaterThan(2);
  a.selectLevel('honey');
  a.ammo=0;
  expect(a.inForestWater()).toBe(false);
  expect(a.ammo).toBe(0);
 },10000);
});

describe('tide gallery',()=>{
 it('keeps forest refill off and refills ammo plus hearts in tide pools',()=>{
  const a=new Adventure();
  a.selectLevel('tide');
  expect(a.level).toBeInstanceOf(TideLevel);
  expect(a.inForestWater()).toBe(false);
  const pool=TIDE_WATERS[1];
  a.ammo=0;a.hearts=2;a.start();
  a.sim.particles.forEach(p=>{p.x=pool.x+pool.w/2;p.y=pool.y+12;});
  expect(a.inTideRefill()).toBe(true);
  for(let i=0;i<40;i++)a.tick(1/20,emptyActions());
  expect(a.ammo).toBeGreaterThan(0);
  expect(a.hearts).toBeGreaterThan(2);
 },15000);
 it('cuts a waterfall with the body, sprays drops and completes under the east crown',()=>{
  const level=new TideLevel();
  const fall=TIDE_FALLS[4];
  const s=new SlimeSimulation(fall.x+fall.w/2,fall.y+fall.h-120,level.solids);
  level.update(s,1/60);
  expect(level.fallHit).toBe(true);
  const curtain=level.curtains[4];
  expect(curtain.cut).not.toBeNull();
  expect(curtain.cut!.y).toBeLessThan(fall.y+fall.h-120);
  expect(curtain.cut!.y).toBeGreaterThan(s.center().y-50);
  const body=s.particles.reduce((a,p)=>({x0:Math.min(a.x0,p.x),x1:Math.max(a.x1,p.x)}),{x0:1e9,x1:-1e9});
  expect(curtain.cut!.x0).toBeGreaterThanOrEqual(body.x0-10);
  expect(curtain.cut!.x1).toBeLessThanOrEqual(body.x1+10);
  expect(curtain.cut!.cols.every(col=>col.top>fall.y+20)).toBe(true);
  expect(curtain.drops.length).toBeGreaterThan(10);
  level.update(s,1/60);
  expect(level.fallHit).toBe(false);
  s.particles.forEach(p=>{p.x=1900;p.y=250;});
  expect(level.bossDown).toBe(false);
  for(let i=0;i<4;i++)level.update(s,1/60);
  expect(level.complete).toBe(false);
  level.bossDown=true;
  for(let i=0;i<4;i++)level.update(s,1/60);
  expect(level.complete).toBe(true);
 });
 it('keeps every pool and waterfall clear of painted solids',()=>{
  const level=new TideLevel();
  const rock=level.base.filter(s=>s.kind==='stone');
  for(const w of TIDE_WATERS){
   const lip=rock.find(s=>s.x+s.w===w.x||s.x===w.x+w.w);
   expect(lip,'pool needs a stone lip').toBeDefined();
   expect(rock.some(s=>w.x+4<s.x+s.w&&w.x+w.w-4>s.x&&w.y+4<s.y+s.h&&w.y+w.h-4>s.y)).toBe(false);
  }
  for(const f of TIDE_FALLS){
   const beds=[...level.base.filter(s=>s.kind!=='boundary'),...TIDE_WATERS];
   const landing=beds.find(s=>f.x+f.w/2>s.x&&f.x+f.w/2<s.x+s.w&&Math.abs(s.y-(f.y+f.h))<=20);
   expect(landing,`fall at ${f.x} should end on a ledge or pool`).toBeDefined();
  }
 });
 const settle=(x:number,y:number)=>{
  const level=new TideLevel();
  const s=new SlimeSimulation(x,y,level.solids);
  for(let i=0;i<90;i++)s.step(1/60,{move:0,squeeze:false,jump:false});
  const grounded=s.particles.filter(p=>p.ground);
  expect(grounded.length).toBeGreaterThan(8);
  return grounded.reduce((n,p)=>n+p.y,0)/grounded.length;
 };
 it('settles feet on the painted ledges',()=>{
  expect(settle(800,1214)).toBeCloseTo(1290,-1);
  expect(settle(1900,1080)).toBeCloseTo(1104,-1);
  expect(settle(1540,960)).toBeCloseTo(992,-1);
  expect(settle(1400,380)).toBeCloseTo(416,-1);
  expect(settle(700,250)).toBeCloseTo(288,-1);
 });
 it('leaves the west crown gap open so the body can hop onto the boulder',()=>{
  const level=new TideLevel();
  const gap={x:1072,y:310,w:40,h:80};
  const blocked=level.base.filter(s=>s.kind==='stone'&&s.x<gap.x+gap.w&&s.x+s.w>gap.x&&s.y<gap.y+gap.h&&s.y+s.h>gap.y);
  expect(blocked).toEqual([]);
  const crown=level.base.find(s=>s.x===464&&s.y===288);
  expect(crown).toBeDefined();
  expect(crown!.x+crown!.w).toBeLessThan(1180);
 });
 it('keeps every hop of the climb within a double jump or a grabbable face',()=>{
  const level=new TideLevel();
  const at=(x:number,y:number)=>level.base.find(s=>s.kind==='stone'&&s.x<=x&&x<=s.x+s.w&&s.y===y)!;
  const route:[number,number,number,number][]=[
   [1000,1330,1900,1104],
   [1900,1104,1600,992],
   [1500,992,1300,652],
   [1300,652,1400,416],
   [1300,416,1000,288],
   [1900,428,1900,288],
   [1800,428,2300,400],
  ];
  for(const [fx,fy,tx,ty] of route){
   const from=at(fx,fy),to=at(tx,ty);
   expect(from,`no ledge under ${fx},${fy}`).toBeDefined();
   expect(to,`no ledge under ${tx},${ty}`).toBeDefined();
   const rise=from.y-to.y,faceGap=from.y-(to.y+to.h);
   expect(Math.min(rise,faceGap),`hop ${fx},${fy} → ${tx},${ty}`).toBeLessThanOrEqual(250);
  }
 });
 it('does not open the window fall at the lip when the body is in the pool',()=>{
  const level=new TideLevel();
  const fall=TIDE_FALLS[3];
  const pool=TIDE_WATERS[1];
  const s=new SlimeSimulation(pool.x+pool.w/2,pool.y+12,level.solids);
  level.update(s,1/60);
  const curtain=level.curtains[3];
  if(curtain.cut){
   expect(curtain.cut.y).toBeGreaterThan(fall.y+fall.h*.45);
   expect(curtain.cut.cols.every(col=>col.top>fall.y+80)).toBe(true);
  }
 });
 it('does not splash the window pool when jumping on the floor below',()=>{
  const level=new TideLevel();
  const pool=TIDE_WATERS[1];
  const s=new SlimeSimulation(pool.x+pool.w/2,1214,level.solids);
  for(let i=0;i<50;i++)s.step(1/60,{move:0,squeeze:false,jump:false});
  level.update(s,1/60);
  expect(s.center().y).toBeGreaterThan(pool.y+pool.h+80);
  const before=level.pools[1].drops.length;
  s.step(1/60,{move:0,squeeze:false,jump:true});
  for(let i=0;i<24;i++){s.step(1/60,{move:0,squeeze:false,jump:false});level.update(s,1/60);}
  expect(level.pools[1].drops.length).toBe(before);
 });
 it('lets the body sink into the start pool instead of standing on it',()=>{
  const level=new TideLevel();
  const pool=TIDE_WATERS[0];
  const s=new SlimeSimulation(pool.x+pool.w/2,pool.y-60,level.solids);
  for(let i=0;i<150;i++){level.update(s,1/60);s.step(1/60,{move:0,squeeze:false,jump:false});}
  const c=s.center();
  expect(c.y).toBeGreaterThan(pool.y-20);
  expect(level.inRefill(c.x,c.y)).toBe(true);
 });
});

describe('win linger',()=>{
 it('freezes on first clear then lets you keep exploring',()=>{
  const a=new Adventure();
  a.start();
  const startX=a.sim.center().x;
  a.level.complete=true;
  a.tick(1/20,{...emptyActions(),move:1});
  expect(a.sim.center().x).toBeCloseTo(startX,1);
  expect(a.frozen()).toBe(true);
  a.stay();
  expect(a.linger).toBe(true);
  expect(a.frozen()).toBe(false);
  a.tick(1/20,{...emptyActions(),move:1});
  expect(a.sim.center().x).toBeGreaterThan(startX+2);
  a.togglePause();
  expect(a.paused).toBe(true);
  a.level.complete=true;
  a.tick(1/20,{...emptyActions(),move:1});
  expect(a.paused).toBe(true);
  a.selectLevel('forest');
  expect(a.linger).toBe(false);
 });
});

describe('combat',()=>{
 it('breaks a stake with melee and spends ammo on a shot',()=>{
  const a=new Adventure();a.start();
  const stake=a.level.stakes[0];
  a.sim.particles.forEach(p=>{p.x=stake.x;p.y=stake.y-20;});
  a.apply({...emptyActions(),melee:true});
  a.tick(1/30);
  expect(stake.hp).toBeLessThan(stake.maxHp);
  const before=a.ammo;
  a.apply({...emptyActions(),ranged:true});
  expect(a.ammo).toBe(before-1);
  expect(a.combat.shots.length).toBeGreaterThan(0);
 });
 it('does not steal merge when attacking',()=>{
  const combat=new CombatSystem();
  expect(combat.slash(0,0,1)).toBe(true);
  expect(combat.slash(0,0,1)).toBe(false);
 });
 it('chains four slashes and boosts the finisher',()=>{
  const combat=new CombatSystem();
  for(let i=0;i<4;i++){
   expect(combat.slash(0,0,1)).toBe(true);
   if(i<3)combat.step(.16,[]);
  }
  expect(combat.slashes.at(-1)?.step).toBe(3);
  expect(combat.slashes.at(-1)?.damage).toBe(2);
 });
 it('keeps the slash on the slime body',()=>{
  const combat=new CombatSystem();
  combat.slash(10,20,1);
  combat.step(.02,[],{x:80,y:140});
  expect(combat.slashes[0].x).toBe(80);
  expect(combat.slashes[0].y).toBe(140);
 });
});

describe('notices and mood',()=>{
 it('stacks notices instead of overwriting',()=>{
  const a=new Adventure();
  a.message('检查点已点亮');
  a.message('拾到一颗晨露');
  expect(a.notices.map(n=>n.text)).toEqual(['检查点已点亮','拾到一颗晨露']);
 });
 it('lets later expressions replace idle and expire back',()=>{
  const mood=new MoodDirector();
  expect(mood.pose().id).toBe('idle');
  mood.pulse('happy',.8,40);
  expect(mood.pose().mouth).toBe('grin');
  mood.tick(1,{move:0,ground:true,hurt:0});
  expect(mood.pose().id).toBe('idle');
 });
});

describe('enemies',()=>{
 it('walks the telegraph-attack machine and can die',()=>{
  const def=ENEMIES.cap;
  const actor={id:'t',kind:'cap',x:0,y:0,w:def.w,h:def.h,vx:0,vy:0,hp:1,maxHp:1,faction:'enemy' as const,facing:1,invuln:0,dead:false,state:'alert',timer:0,cooldown:0,patrol:40,homeX:0,homeY:0,skill:0,meleeCd:0,cycle:0,dodgeCd:0,hopCd:0,bumpLock:false};
  stepMachine(actor,def,{playerX:10,playerY:0,dt:.05});
  expect(['telegraph','alert','patrol']).toContain(actor.state);
  hurtActor(actor,1);
  expect(actor.dead).toBe(true);
 });
});

describe('quests',()=>{
 it('keeps the forest gate shut until main dew is collected',()=>{
  const level=new Level(),s=new SlimeSimulation(3250,530,level.solids);
  s.split();
  s.particles.forEach(p=>{p.x=p.group===0?level.plates[0].x:level.plates[1].x;p.y=590;});
  for(let i=0;i<100;i++)level.update(s,1/60);
  expect(level.gateCharge).toBeGreaterThan(.9);
  expect(level.gateOpen).toBe(false);
  for(const d of level.dew)d.got=true;
  level.update(s,1/60);
  expect(level.mainDewDone).toBe(true);
  expect(level.gateOpen).toBe(true);
 });
});

describe('inventory',()=>{
 it('stays session-local and stacks materials',()=>{
  const pack=new Inventory();
  expect(pack.add('spore',4)).toBe(4);
  expect(pack.count('spore')).toBe(4);
  pack.clear();
  expect(pack.count('spore')).toBe(0);
 });
});

describe('swallow dodge death boss',()=>{
 it('reels in a far low-hp enemy and refuses a healthy one',()=>{
  const a=new Adventure();a.start();
  const far=a.actors[0];
  far.hp=1;far.maxHp=3;far.x=a.sim.center().x+220;far.y=a.sim.center().y;
  for(let i=0;i<20;i++)a.tick(1/30,{...emptyActions(),meleeHeld:true});
  expect(a.swallow).toBeTruthy();
  expect(['reel','gulp','digest']).toContain(a.swallow!.phase);
  const b=new Adventure();b.start();
  const tank=b.actors[0];
  tank.hp=3;tank.maxHp=3;tank.x=b.sim.center().x+220;tank.y=b.sim.center().y;
  for(let i=0;i<20;i++)b.tick(1/30,{...emptyActions(),meleeHeld:true});
  expect(b.swallow).toBeNull();
 });
 it('dies at zero hearts and restartRun resets the chapter',()=>{
  const a=new Adventure();a.start();
  a.hearts=1;a.level.dew[0].got=true;a.pack.add('leaf');
  a.hurt(1,'倒下');
  expect(a.dead).toBe(true);expect(a.hearts).toBe(0);
  a.restartRun();
  expect(a.dead).toBe(false);expect(a.hearts).toBe(5);
  expect(a.level.dew.every(d=>!d.got)).toBe(true);
  expect(a.pack.count('leaf')).toBe(0);
  expect(a.actors.some(foe=>foe.kind==='picnic'&&!foe.dead)).toBe(true);
 });
 it('dodges with invuln and afterimages',()=>{
  const a=new Adventure();a.start();
  expect(a.tryDodge(1)).toBe(true);
  expect(a.ghosts.length).toBe(3);
  expect(a.invuln).toBeGreaterThan(0);
  expect(a.tryDodge(-1)).toBe(false);
 });
 it('chases rightward and swings melee up close',()=>{
  const picnic=makeActor('picnic',4880,598,'picnic-gate',70);
  picnic.state='patrol';
  stepMachine(picnic,ENEMIES.picnic,{playerX:5280,playerY:598,dt:.05});
  expect(picnic.state).toBe('chase');
  const x0=picnic.x;
  for(let i=0;i<16;i++)stepMachine(picnic,ENEMIES.picnic,{playerX:5280,playerY:598,dt:.05});
  expect(picnic.state).toBe('chase');
  expect(picnic.x).toBeGreaterThan(x0);
  expect(picnic.facing).toBe(1);
  const close=makeActor('picnic',4880,598,'picnic-melee',70);
  close.state='chase';close.timer=0;close.cooldown=0;close.meleeCd=0;
  stepMachine(close,ENEMIES.picnic,{playerX:4680,playerY:598,dt:.05});
  expect(close.facing).toBe(-1);
  close.state='chase';close.timer=0;close.cooldown=0;close.meleeCd=0;
  stepMachine(close,ENEMIES.picnic,{playerX:4905,playerY:598,dt:.05});
  expect(close.state).toBe('telegraph');
  expect(close.skill).toBe(-1);
  expect(close.facing).toBe(1);
  const pig=makeActor('pig',4920,598,'pig-a',40);
  pig.state='alert';pig.timer=.2;
  stepMachine(pig,ENEMIES.pig,{playerX:4700,playerY:598,dt:.05});
  expect(pig.facing).toBe(-1);
  const hunter=makeActor('pig',4920,598,'pig-b',40);
  hunter.state='patrol';
  stepMachine(hunter,ENEMIES.pig,{playerX:4560,playerY:598,dt:.05});
  expect(hunter.state).toBe('chase');
  const hx=hunter.x;
  for(let i=0;i<14;i++)stepMachine(hunter,ENEMIES.pig,{playerX:4560,playerY:598,dt:.05});
  expect(hunter.x).toBeLessThan(hx);
  hunter.state='chase';hunter.timer=0;
  stepMachine(hunter,ENEMIES.pig,{playerX:4000,playerY:598,dt:.05});
  expect(hunter.state).toBe('patrol');
 });
 it('rotates picnic skills and blocks the exit until the boss falls',()=>{
  const picnic=makeActor('picnic',4880,598,'picnic-gate',70);
  picnic.state='chase';picnic.timer=0;picnic.cooldown=0;picnic.meleeCd=9;picnic.cycle=-1;
  stepMachine(picnic,ENEMIES.picnic,{playerX:4680,playerY:598,dt:.05});
  expect(picnic.state).toBe('telegraph');
  expect(ENEMIES.picnic.skills[picnic.skill].kind).toBe('melon');
  picnic.state='chase';picnic.timer=0;picnic.cooldown=0;picnic.meleeCd=9;
  stepMachine(picnic,ENEMIES.picnic,{playerX:4680,playerY:598,dt:.05});
  expect(ENEMIES.picnic.skills[picnic.skill].kind).toBe('ult');
  expect(ENEMIES.picnic.skills.some(s=>s.kind==='summon')).toBe(false);
  const level=new Level();
  expect(level.bossDown).toBe(false);
  const s=new SlimeSimulation(5100,540,level.solids);
  level.gateOpen=true;level.syncSolids(s);
  for(const d of level.dew)d.got=true;
  level.update(s,1/60);
  expect(level.complete).toBe(false);
  level.bossDown=true;
  level.update(s,1/60);
  expect(level.complete).toBe(true);
 });
 it('keeps honey clear independent of the optional hive boss',()=>{
  const level=new HoneyLevel();
  expect(level.bossDown).toBe(true);
  expect(level.enemies.some(e=>e.kind==='hive')).toBe(true);
  expect(ENEMIES.hive.boss).toBe(true);
  const hive=makeActor('hive',4180,600,'hive-2061',70);
  hive.state='chase';hive.timer=0;hive.cooldown=0;hive.meleeCd=0;
  stepMachine(hive,ENEMIES.hive,{playerX:4180,playerY:600,dt:.05});
  expect(hive.state).toBe('telegraph');
  expect(hive.skill).toBe(-1);
  const sim=new SlimeSimulation(5000,540,level.solids);
  sim.particles.forEach(p=>{p.x=5000;p.y=540;});
  level.latchOn=false;
  level.update(sim,1/60);
  expect(level.complete).toBe(false);
  hive.dead=true;hive.hp=0;
  level.update(sim,1/60);
  expect(level.complete).toBe(false);
  expect(level.bossDown).toBe(true);
  level.latchOn=true;
  level.update(sim,1/60);
  expect(level.complete).toBe(true);
 });
 it('uses sword up close and bows then magic at range',()=>{
  const near=makeActor('hive',4180,600,'hive-near',70);
  near.state='chase';near.timer=0;near.cooldown=0;near.meleeCd=0;
  stepMachine(near,ENEMIES.hive,{playerX:4180,playerY:600,dt:.05});
  expect(near.skill).toBe(-1);
  expect(ENEMIES.hive.melee!.kind).toBe('melee');
  const far=makeActor('hive',4180,600,'hive-far',70);
  far.state='chase';far.timer=0;far.cooldown=0;far.meleeCd=9;far.cycle=-1;
  stepMachine(far,ENEMIES.hive,{playerX:3900,playerY:600,dt:.05});
  expect(far.state).toBe('telegraph');
  expect(ENEMIES.hive.skills[far.skill].kind).toBe('bow');
  far.state='chase';far.timer=0;far.cooldown=0;far.meleeCd=9;
  stepMachine(far,ENEMIES.hive,{playerX:3900,playerY:600,dt:.05});
  expect(ENEMIES.hive.skills[far.skill].kind).toBe('magic');
 });
 it('spaces summoned pigs so they do not stack',()=>{
  const combat=new CombatSystem();
  const hive=makeActor('hive',4180,600,'hive-summon',70);
  const actors=[hive];
  const ctx=()=>({self:hive.asc!,combat,x:hive.x,y:hive.y,facing:1,name:'西瓜大王',actors,spawn:(kind:string,x:number,y:number)=>actors.push(makeActor(kind,x,y,`pig-${actors.length}`))});
  expect(ABILITIES['enemy.summon'].activate(ctx())).toBe(true);
  expect(ABILITIES['enemy.summon'].activate(ctx())).toBe(true);
  expect(ABILITIES['enemy.summon'].activate(ctx())).toBe(true);
  const pigs=actors.filter(a=>a.kind==='eboar');
  expect(pigs).toHaveLength(3);
  const xs=pigs.map(p=>p.x).sort((a,b)=>a-b);
  for(let i=1;i<xs.length;i++)expect(xs[i]-xs[i-1]).toBeGreaterThanOrEqual(72);
 });
 it('rolls away from slashes and hops away from missiles',()=>{
  const hive=makeActor('hive',4180,600,'hive-dodge',70);
  hive.state='chase';hive.timer=0;
  stepMachine(hive,ENEMIES.hive,{playerX:4000,playerY:600,dt:.05,incomingMelee:true});
  expect(hive.state).toBe('dodge');
  expect(hurtActor(hive,2)).toBe(false);
  expect(hive.hp).toBe(ENEMIES.hive.hp);
  const x0=hive.x;
  stepMachine(hive,ENEMIES.hive,{playerX:4000,playerY:600,dt:.05});
  expect(hive.x).toBeGreaterThan(x0+8);
  const hopper=makeActor('hive',4180,600,'hive-hop',70);
  hopper.state='telegraph';hopper.timer=.4;
  stepMachine(hopper,ENEMIES.hive,{playerX:3900,playerY:600,dt:.05,incomingShot:true});
  expect(hopper.state).toBe('hop');
  expect(hurtActor(hopper,2)).toBe(false);
  const y0=hopper.y;
  stepMachine(hopper,ENEMIES.hive,{playerX:3900,playerY:600,dt:.05});
  expect(hopper.y).toBeLessThan(y0-8);
 });
 it('places new beasts and gates the later chapters',()=>{
  expect(ENEMIES.wolf.name).toBe('霜脊狼');
  expect(ENEMIES.pale.gate).toBe(true);
  expect(ENEMIES.grey.gate).toBe(true);
  expect(ENEMIES.han.gate).toBe(true);
  expect(ENEMIES.horn.gate).toBe(true);
  expect(ENEMIES.hive.gate).toBeUndefined();
  const boar=makeActor('boar',400,600,'boar-a',60);
  boar.state='chase';boar.timer=0;boar.cooldown=0;
  stepMachine(boar,ENEMIES.boar,{playerX:520,playerY:600,dt:.05});
  expect(boar.state).toBe('telegraph');
  expect(ENEMIES.boar.skills[0].kind).toBe('charge');
  const han=makeActor('han',2500,280,'han-a',60);
  const horn=makeActor('horn',2780,280,'horn-a',60);
  expect(livingGates([han,horn])).toBe(true);
  han.dead=true;
  expect(livingGates([han,horn])).toBe(true);
  horn.dead=true;
  expect(livingGates([han,horn])).toBe(false);
  expect(ABILITIES['enemy.dragon'].activate({self:han.asc!,combat:new CombatSystem(),x:0,y:0,facing:1})).toBe(true);
  const pack=[makeActor('wk1',1860,1180,'wk1-a',70)];
  expect(ABILITIES['enemy.howl'].activate({self:pack[0].asc!,combat:new CombatSystem(),x:1860,y:1180,facing:1,name:'狼王',actors:pack,spawn:(kind,x,y)=>pack.push(makeActor(kind,x,y,'wolf-s'))})).toBe(true);
  expect(pack.some(a=>a.kind==='wolf')).toBe(true);
  const flood=new CombatSystem();
  expect(ABILITIES['enemy.clone'].activate({self:makeActor('pale',2360,1084,'pale-a',60).asc!,combat:flood,x:2360,y:1084,facing:-1,name:'苍白潮客'})).toBe(true);
  expect(flood.floods[0]?.y).toBe(1220);
  const shoal=new CombatSystem();shoal.flood(1220,8);
  expect(shoal.hitsPlayer(2360,1300)).toBe(true);
  expect(shoal.hitsPlayer(2360,1084)).toBe(false);
 });
 it('stops at the ledge instead of chasing a hanging body off the floor',()=>{
  const floor={x:100,y:600,w:220,h:40};
  const cap=makeActor('cap',200,600,'cap-ledge',80);
  cap.state='chase';
  for(let i=0;i<50;i++)stepMachine(cap,ENEMIES.cap,{playerX:20,playerY:600,dt:.05,solids:[floor],playerGrounded:false});
  expect(cap.x).toBeGreaterThan(floor.x+6);
  expect(cap.x).toBeLessThan(floor.x+floor.w-6);
  const idle=makeActor('cap',200,600,'cap-air',80);
  idle.state='patrol';
  stepMachine(idle,ENEMIES.cap,{playerX:200,playerY:430,dt:.05,solids:[floor],playerGrounded:false});
  expect(idle.state).toBe('patrol');
 });
 it('plays nangong dying then announces the defeat',()=>{
  expect(ENEMIES.picnic.name).toBe('南宫师姐');
  expect(ENEMIES.hive.name).toBe('西瓜大王');
  const a=new Adventure();
  a.start();
  const picnic=a.actors.find(foe=>foe.kind==='picnic');
  expect(picnic).toBeTruthy();
  picnic!.hp=1;picnic!.invuln=0;
  expect(a.combat.slash(picnic!.x,picnic!.y,1)).toBe(true);
  a.strike();
  expect(picnic!.dead).toBe(true);
  expect(picnic!.state).toBe('dying');
  expect(a.notices.some(n=>n.text.includes('击败了南宫师姐'))).toBe(true);
  for(let i=0;i<25;i++)stepMachine(picnic!,ENEMIES.picnic,{playerX:picnic!.x,playerY:picnic!.y,dt:.05});
  expect(picnic!.state).toBe('dead');
 });
 it('lets nangong roll away from slashes',()=>{
  const picnic=makeActor('picnic',4880,598,'picnic-dodge',70);
  picnic.state='chase';picnic.timer=0;
  stepMachine(picnic,ENEMIES.picnic,{playerX:4700,playerY:598,dt:.05,incomingMelee:true});
  expect(picnic.state).toBe('dodge');
  const x0=picnic.x;
  stepMachine(picnic,ENEMIES.picnic,{playerX:4700,playerY:598,dt:.05});
  expect(picnic.x).toBeGreaterThan(x0+8);
 });
 it('plays hive dying then announces the defeat',()=>{
  const a=new Adventure();
  a.selectLevel('honey');
  a.start();
  const hive=a.actors.find(foe=>foe.kind==='hive');
  expect(hive).toBeTruthy();
  hive!.hp=1;hive!.invuln=0;
  expect(a.combat.slash(hive!.x,hive!.y,1)).toBe(true);
  a.strike();
  expect(hive!.dead).toBe(true);
  expect(hive!.state).toBe('dying');
  expect(a.notices.some(n=>n.text.includes('击败'))).toBe(true);
  for(let i=0;i<25;i++)stepMachine(hive!,ENEMIES.hive,{playerX:hive!.x,playerY:hive!.y,dt:.05});
  expect(hive!.state).toBe('dead');
 });
 it('refills ammo and hearts in honey pools without forest water',()=>{
  const a=new Adventure();
  a.selectLevel('honey');
  expect(a.level).toBeInstanceOf(HoneyLevel);
  expect(a.level.features.ammoRefill).toBe(false);
  expect(a.inForestWater()).toBe(false);
  const pool=(a.level as HoneyLevel).pools[0].bounds;
  a.ammo=0;a.hearts=2;a.start();
  a.sim.particles.forEach(p=>{p.x=pool.x+pool.w/2;p.y=pool.y+12;});
  expect(a.inHoneyRefill()).toBe(true);
  for(let i=0;i<40;i++)a.tick(1/20,emptyActions());
  expect(a.ammo).toBeGreaterThan(0);
  expect(a.hearts).toBeGreaterThan(2);
 },10000);
 it('casts a magic bolt that can hit the player',()=>{
  const combat=new CombatSystem();
  combat.castBolt(100,200,400,200);
  expect(combat.bolts.length).toBe(1);
  const bolt=combat.bolts[0];
  expect(bolt.vx).toBeGreaterThan(0);
  expect(combat.hitsPlayer(bolt.x,bolt.y,8)).toBe(true);
 });
 it('fires nangong arrows instead of falling melons',()=>{
  const combat=new CombatSystem();
  combat.shootAimed(100,200,400,200);
  combat.fanArrows(100,200,400,200);
  expect(combat.arrows.length).toBe(4);
  expect(combat.melons.length).toBe(0);
  const first=combat.arrows[0];
  expect(first.vx).toBeGreaterThan(0);
  const x0=first.x;
  combat.step(0.05,[]);
  expect(combat.arrows[0].x).toBeGreaterThan(x0);
  expect(combat.hitsPlayer(combat.arrows[0].x,combat.arrows[0].y,8)).toBe(true);
 });
 it('keeps picnic knockback on the grass and out of the east root',()=>{
  const root={x:4520,y:40,w:22,h:560};
  const picnic=makeActor('picnic',4562,598,'picnic-gate',70);
  picnic.y=560;
  const combat=new CombatSystem();
  combat.facing=-1;
  combat.slashes.push({x:picnic.x,y:picnic.y-20,facing:-1,t:0,life:.2,r:90,step:0,damage:1,hits:new Set()});
  combat.hitActors([picnic],18,[root]);
  expect(picnic.y).toBe(598);
  expect(picnic.x).toBeGreaterThanOrEqual(4560);
  expect(picnic.x).toBeGreaterThan(4542);
  const stuck=makeActor('picnic',4530,598,'picnic-stuck',70);
  stuck.y=560;
  resolveActor(stuck,[root]);
  expect(stuck.y).toBe(598);
  expect(stuck.x).toBeGreaterThanOrEqual(4560);
 });
 it('drops a grounded enemy onto the deck below after it leaves the ledge',()=>{
  const solids=[{x:0,y:200,w:80,h:24,kind:'stone'},{x:0,y:400,w:220,h:24,kind:'stone'}];
  const wolf=makeActor('wolf',40,200,'wolf-fall',40);
  wolf.x=130;wolf.vy=0;
  for(let i=0;i<90;i++)resolveActor(wolf,solids,1/60);
  expect(wolf.y).toBeCloseTo(400,0);
  expect(wolf.vy).toBe(0);
 });
});

const idle={move:0,squeeze:false,jump:false};
const settleOn=(solids:SlimeSimulation['solids'],x:number,y:number)=>{
 const s=new SlimeSimulation(x,y,solids);
 for(let i=0;i<90;i++)s.step(1/60,idle);
 const grounded=s.particles.filter(p=>p.ground);
 expect(grounded.length).toBeGreaterThan(8);
 return {s,y:grounded.reduce((n,p)=>n+p.y,0)/grounded.length};
};
const hopOnto=(solids:SlimeSimulation['solids'],x:number,fromY:number,toY:number)=>{
 const {s,y}=settleOn(solids,x,fromY-40);
 expect(y).toBeCloseTo(fromY,-1);
 s.step(1/60,{...idle,jump:true,jumpHeld:true});
 for(let i=0;i<12;i++)s.step(1/60,{...idle,jumpHeld:true});
 s.step(1/60,{...idle,jump:true,jumpHeld:true});
 for(let i=0;i<80;i++)s.step(1/60,idle);
 const grounded=s.particles.filter(p=>p.ground);
 expect(grounded.length).toBeGreaterThan(8);
 return grounded.reduce((n,p)=>n+p.y,0)/grounded.length;
};
const thinOrOneWay=(base:typeof WIND_LAYOUT.base)=>base.filter(s=>s.kind==='stone'&&s.w>=80&&s.h>40&&!s.oneWay);
const thickSolidIsle=(base:typeof WIND_LAYOUT.base)=>base.filter(s=>s.kind==='stone'&&s.h>80&&!s.oneWay);

describe('wind heath',()=>{
 const isle=(x:number,y:number)=>WIND_LAYOUT.base.find(s=>s.kind==='stone'&&s.x===x&&s.y===y&&s.w>=80);
 it('keeps island tops on the authored solids',()=>{
  expect(isle(120,1680)?.w).toBe(820);
  expect(isle(80,1240)?.w).toBe(700);
  expect(isle(1280,1180)?.w).toBe(1180);
  expect(isle(560,760)?.w).toBe(960);
  expect(isle(1080,260)?.w).toBe(560);
  expect(isle(120,1680)?.h).toBeLessThanOrEqual(36);
  expect(isle(1080,260)?.h).toBeLessThanOrEqual(36);
  expect(WIND_LAYOUT.signs?.map(s=>s.text)).toEqual(['荒原起点','钟铃峡谷','东荒原','回西侧上峡谷','风铃神殿']);
  expect(WIND_LAYOUT.win).toEqual({kind:'zone',x:1100,y:120,w:280,h:160});
  expect(thinOrOneWay(WIND_LAYOUT.base)).toEqual([]);
  expect(thickSolidIsle(WIND_LAYOUT.base)).toEqual([]);
 });
 it('settles the spawn on the heath and stands on each isle',()=>{
  const level=new WindLevel();
  expect(settleOn(level.solids,320,1640).y).toBeCloseTo(1680,-1);
  expect(settleOn(level.solids,1100,1660).y).toBeCloseTo(1680,-1);
  expect(settleOn(level.solids,400,1200).y).toBeCloseTo(1240,-1);
  expect(settleOn(level.solids,1600,1140).y).toBeCloseTo(1180,-1);
  expect(settleOn(level.solids,900,720).y).toBeCloseTo(760,-1);
  expect(settleOn(level.solids,1360,220).y).toBeCloseTo(260,-1);
 });
 it('keeps the east rope walk flush with the start isle',()=>{
  const bridge=WIND_LAYOUT.base.find(s=>s.x===940&&s.w>=360);
  expect(bridge?.y).toBe(1680);
  expect(bridge?.h).toBeGreaterThanOrEqual(20);
  expect(bridge?.h).toBeLessThanOrEqual(24);
  expect(bridge?.oneWay).toBeFalsy();
 });
 it('completes inside the temple arch',()=>{
  const level=new WindLevel();
  expect(level.bossDown).toBe(false);
  const s=new SlimeSimulation(1240,220,level.solids);
  for(let i=0;i<40;i++)s.step(1/60,idle);
  for(let i=0;i<4;i++)level.update(s,1/60);
  expect(level.complete).toBe(false);
  level.bossDown=true;
  for(let i=0;i<4;i++)level.update(s,1/60);
  expect(level.complete).toBe(true);
  expect(level.hint(1240,1,220)).toContain('风修');
 });
 it('keeps the east rise clear of dressings and has no sky-piercing pillar',()=>{
  const blocked=(WIND_LAYOUT.dressing??[]).filter(d=>d.x>1860&&d.x<2200&&d.y<1180);
  expect(blocked).toEqual([]);
  const towers=WIND_LAYOUT.base.filter(s=>s.kind==='stone'&&s.w<80&&s.h>80);
  expect(towers).toEqual([]);
 });
 it('hops the thin decks without a through-layer wall',()=>{
  const hops:[number,number,number,number][]=[
   [290,1680,290,1500],
   [310,1500,310,1360],
   [400,1360,400,1240],
   [720,1240,800,1040],
   [800,1040,840,880],
   [840,880,800,760],
   [2200,1180,2260,980],
   [2000,980,2040,800],
   [1820,800,1820,620],
   [1640,620,1640,440],
   [1560,440,1360,260],
   [1100,1680,1420,1480],
   [1420,1480,1420,1320],
   [1420,1320,1600,1180],
  ];
  for(const [fx,fy,tx,ty] of hops){
   expect(fy-ty,`gap ${fx},${fy} → ${tx},${ty}`).toBeLessThanOrEqual(200);
  }
 });
 it('lands on the temple from the east step below',()=>{
  expect(hopOnto(new WindLevel().solids,1560,440,260)).toBeCloseTo(260,-1);
 });
 it('keeps the heath floor connected from start to east meadow',()=>{
  const floor=WIND_LAYOUT.base
   .filter(s=>(s.kind==='stone'||s.kind==='pool')&&s.y>=1680&&s.y<=1732&&s.w>=80)
   .sort((a,b)=>a.x-b.x);
  expect(floor[0].x).toBeLessThanOrEqual(120);
  expect(floor.at(-1)!.x+floor.at(-1)!.w).toBeGreaterThanOrEqual(3200);
  for(let i=1;i<floor.length;i++){
   const gap=floor[i].x-(floor[i-1].x+floor[i-1].w);
   expect(gap,`${floor[i-1].x}→${floor[i].x}`).toBeLessThanOrEqual(200);
  }
 });
 it('refills ammo plus hearts in the east heath pool',()=>{
  const a=new Adventure();
  a.selectLevel('wind');
  a.ammo=0;a.hearts=2;a.start();
  a.sim.particles.forEach(p=>{p.x=WIND_POOL.x+WIND_POOL.w/2;p.y=WIND_POOL.y+12;});
  expect(a.inForestWater()).toBe(true);
  for(let i=0;i<40;i++)a.tick(1/20,emptyActions());
  expect(a.ammo).toBeGreaterThan(0);
  expect(a.hearts).toBeGreaterThan(2);
 },15000);
});

describe('mirror night',()=>{
 const isle=(x:number,y:number)=>MIRROR_LAYOUT.base.find(s=>s.kind==='stone'&&s.x===x&&s.y===y&&s.w>=80);
 it('keeps the five isles on the authored solids',()=>{
  expect(isle(80,1680)?.w).toBe(720);
  expect(isle(800,1680)?.w).toBe(240);
  expect(isle(1520,1680)?.w).toBe(280);
  expect(isle(1680,1180)?.w).toBe(1100);
  expect(isle(420,720)?.w).toBe(860);
  expect(isle(2280,280)?.w).toBe(780);
  expect(isle(80,1680)?.h).toBeLessThanOrEqual(36);
  expect(isle(1680,1180)?.h).toBeLessThanOrEqual(36);
  expect(isle(1680,1180)?.oneWay).toBe(true);
  expect(MIRROR_LAYOUT.signs?.map(s=>s.text)).toEqual(['星辉起点','岔路','东岸无路 · 回祭坛','天穹之门']);
  expect(MIRROR_LAYOUT.win).toEqual({kind:'zone',x:2480,y:140,w:280,h:160});
  expect(MIRROR_LAYOUT.base.filter(s=>s.kind==='stone'&&s.w<80&&s.h>80)).toEqual([]);
  expect(thinOrOneWay(MIRROR_LAYOUT.base)).toEqual([]);
  expect(thickSolidIsle(MIRROR_LAYOUT.base)).toEqual([]);
  const rise=MIRROR_LAYOUT.base.filter(s=>s.kind==='stone'&&s.w>=300&&s.h<=40&&s.y<1180&&s.y>280);
  expect(rise.length).toBeGreaterThanOrEqual(4);
 });
 it('settles the spawn on the star hearth',()=>{
  const level=new MirrorLevel();
  expect(settleOn(level.solids,280,1640).y).toBeCloseTo(1680,-1);
  expect(settleOn(level.solids,2000,1140).y).toBeCloseTo(1180,-1);
  expect(settleOn(level.solids,700,680).y).toBeCloseTo(720,-1);
  expect(settleOn(level.solids,2500,240).y).toBeCloseTo(280,-1);
 });
 it('lets the shoal sink and stand on the basin',()=>{
  const level=new MirrorLevel();
  expect(level.water).toEqual(MIRROR_SHOAL);
  expect(MIRROR_LAYOUT.waters).toEqual([MIRROR_SHOAL]);
  const s=new SlimeSimulation(1280,1688,level.solids);
  s.water=MIRROR_SHOAL;
  for(let i=0;i<90;i++){
   s.step(1/60,idle);
   level.update(s,1/60);
  }
  const mid=s.particles.reduce((n,p)=>n+p.y,0)/s.particles.length;
  expect(s.water).toEqual(MIRROR_SHOAL);
  expect(mid).toBeGreaterThan(1688);
  expect(mid).toBeLessThan(1830);
  expect(MIRROR_LAYOUT.base.some(r=>r.x===1040&&r.y===1816&&r.w===480)).toBe(true);
 });
 it('lands on the altar from the step below',()=>{
  expect(hopOnto(new MirrorLevel().solids,1940,1360,1180)).toBeCloseTo(1180,-1);
 });
 it('completes inside the sky gate',()=>{
  const level=new MirrorLevel();
  expect(level.bossDown).toBe(false);
  const s=new SlimeSimulation(2600,220,level.solids);
  for(let i=0;i<40;i++)s.step(1/60,idle);
  for(let i=0;i<4;i++)level.update(s,1/60);
  expect(level.complete).toBe(false);
  level.bossDown=true;
  for(let i=0;i<4;i++)level.update(s,1/60);
  expect(level.complete).toBe(true);
  expect(level.hint(2600,1,220)).toContain('韩小立');
 });
 it('sends the body both ways between the garden and sky-gate portals',()=>{
  const level=new MirrorLevel();
  expect(level.portals).toHaveLength(2);
  expect(level.portals[0].pair).toBe(level.portals[1].pair);
  expect(level.portals[0].y).toBe(720);
  expect(level.portals[1].y).toBe(280);
  const west=level.portals[0],east=level.portals[1];
  const s=new SlimeSimulation(west.x,west.y-20,level.solids);
  for(let i=0;i<50;i++)s.step(1/60,idle);
  let sent=false;
  for(let i=0;i<8;i++){level.update(s,1/60);if(level.ported)sent=true;}
  expect(sent).toBe(true);
  expect(s.center().x).toBeGreaterThan(east.x-80);
  expect(s.center().y).toBeLessThan(east.y+40);
  expect(level.portalCool).toBeGreaterThanOrEqual(9);
  let early=false;
  for(let i=0;i<8;i++){level.update(s,1/60);if(level.ported)early=true;}
  expect(early).toBe(false);
  level.portalCool=0;
  let back=false;
  for(let i=0;i<8;i++){level.update(s,1/60);if(level.ported)back=true;}
  expect(back).toBe(true);
  expect(s.center().x).toBeLessThan(west.x+80);
  expect(s.center().y).toBeGreaterThan(west.y-80);
 });
 it('keeps dressings off the climb and shoal lane',()=>{
  const blocked=(MIRROR_LAYOUT.dressing??[]).filter(d=>
   d.x>1040&&d.x<1520&&d.y>1600||d.x>2480&&d.x<2760&&d.y<300
  );
  expect(blocked).toEqual([]);
 });
 it('refills ammo plus hearts in the mirror shoal',()=>{
  const a=new Adventure();
  a.selectLevel('mirror');
  a.ammo=0;a.hearts=2;a.start();
  a.sim.particles.forEach(p=>{p.x=MIRROR_SHOAL.x+MIRROR_SHOAL.w/2;p.y=MIRROR_SHOAL.y+12;});
  expect(a.inForestWater()).toBe(true);
  for(let i=0;i<40;i++)a.tick(1/20,emptyActions());
  expect(a.ammo).toBeGreaterThan(0);
  expect(a.hearts).toBeGreaterThan(2);
 },15000);
});

describe('side-view decks',()=>{
 it('fills collision as stone or plank and does not stamp isometric isles',()=>{
  expect(deckStyle({x:120,y:1680,w:820,h:32,kind:'stone'})).toBe('stone');
  expect(deckStyle({x:940,y:1680,w:380,h:22,kind:'stone'})).toBe('plank');
  expect(deckStyle({x:1560,y:1732,w:160,h:24,kind:'pool'})).toBe('skip');
  expect(deckStyle({x:-30,y:-400,w:30,h:2800,kind:'boundary'})).toBe('skip');
  const wind=readFileSync(new URL('../src/wind-art.ts',import.meta.url),'utf8');
  const mirror=readFileSync(new URL('../src/mirror-art.ts',import.meta.url),'utf8');
  for(const src of [wind,mirror]){
   expect(src).not.toMatch(/plateau-|step-[abc]|isle-/);
   expect(src).toMatch(/paintSlab\(/);
  }
 });
 it('lands the slab top on solid.y, never stretches caps, and crops the hang above the deck below',()=>{
  const slab={width:1000,height:400,top:100,capW:200};
  const full=slabLayout(slab,900,300);
  expect(full.scale).toBeCloseTo(1,5);
  expect(full.dTop).toBeCloseTo(100,5);
  expect(full.cropped).toBe(false);
  const narrow=slabLayout(slab,240,300);
  expect(narrow.scale).toBeCloseTo(240/400,5);
  const tight=slabLayout(slab,900,300,120);
  expect(tight.cropped).toBe(true);
  expect(tight.dH-tight.dTop).toBeLessThanOrEqual(120);
 });
});

describe('stampDeck',()=>{
 it('scales uniformly and crops hang so it does not cover the deck below',()=>{
  const srcW=1280,srcH=720,frac=.1,w=800;
  const full=stampDeckLayout(srcW,srcH,frac,100,500,w);
  expect(full.dw/full.dh).toBeCloseTo(srcW/srcH,5);
  expect(full.dy+full.dh*frac).toBeCloseTo(500,5);
  const below=[{x:100,y:680,w:800}];
  const gap=gapBelowDeck({x:100,y:500,w:800},below);
  expect(gap).toBe(180);
  const cropped=stampDeckLayout(srcW,srcH,frac,100,500,w,gap);
  expect(cropped.dy+cropped.dh).toBeLessThanOrEqual(500+gap+1e-6);
  expect(pickDeckKind(700)).toBe('plateau');
  expect(pickDeckKind(400)).toBe('step');
 });
});

describe('gas',()=>{
 it('applies damage and heal through effects',()=>{
  const actor=makeActor('cap',0,0,'gas-cap');
  const cues=new CueBus();
  expect(hurtActor(actor,1,cues)).toBe(true);
  expect(actor.hp).toBe(ENEMIES.cap.hp-1);
  expect(cues.floaters.some(f=>f.text==='-1'&&f.kind==='hit')).toBe(true);
  applyEffect(actor.asc!,{heal:1},{x:0,y:0},cues);
  expect(actor.asc!.attrs.hp).toBe(ENEMIES.cap.hp);
 });
 it('blocks damage while invulnerable',()=>{
  const actor=makeActor('cap',0,0,'gas-inv');
  actor.asc!.hold('state.invuln',1);
  expect(hurtActor(actor,2)).toBe(false);
  expect(actor.hp).toBe(ENEMIES.cap.hp);
 });
 it('queues a floater when the player is hit',()=>{
  const a=new Adventure();
  a.start();
  a.hurt(1,'测试');
  expect(a.combat.cues.floaters.some(f=>f.kind==='hurt'&&f.text==='-1')).toBe(true);
  expect(a.hearts).toBe(4);
 });
 it('shows the boss bar when near a living picnic',()=>{
  const a=new Adventure();
  a.start();
  const picnic=a.actors.find(foe=>foe.kind==='picnic');
  expect(picnic).toBeTruthy();
  a.sim.particles.forEach(p=>{p.x=picnic!.x;p.y=picnic!.y;});
  const bar=bossBar(a);
  expect(bar.visible).toBe(true);
  expect(bar.name).toBe('南宫师姐');
  expect(bar.hp).toBe(picnic!.hp);
  picnic!.dead=true;picnic!.state='dead';
  expect(bossBar(a).visible).toBe(false);
 });
});

describe('dash contact',()=>{
 it('lets a wolf pounce land at 85px instead of howling',()=>{
  const wolf=makeActor('wolf',0,600,'wolf-pounce',40);
  expect(chooseSkill(wolf,ENEMIES.wolf,85)).toBe(0);
  expect(ENEMIES.wolf.skills[chooseSkill(wolf,ENEMIES.wolf,20)].kind).toBe('pounce');
  expect(ENEMIES.wolf.skills[chooseSkill(wolf,ENEMIES.wolf,180)].kind).toBe('howl');
  const combat=new CombatSystem();
  let hit=false;
  ABILITIES['enemy.pounce'].activate({
   self:wolf.asc!,combat,x:0,y:600,facing:1,h:wolf.h,targetX:85,targetY:580,range:90,name:'霜脊狼',
   hitPlayer:()=>{hit=true;},
  });
  expect(hit).toBe(true);
  expect(dashHitsPlayer(wolf,85,580,90)).toBe(true);
 });
 it('keeps a charge projectile alive over the forest floor',()=>{
  const combat=new CombatSystem();
  combat.charge(100,600,1,42);
  expect(combat.charges[0].y).toBeLessThan(590);
  combat.step(1/60,[{x:0,y:600,w:400,h:200}]);
  expect(combat.charges.some(c=>c.alive)).toBe(true);
 });
 it('nudges an overlapping wolf once then lets the slime pass',()=>{
  const wolf=makeActor('wolf',100,600,'wolf-overlap',40);
  expect(separateFromPlayer(wolf,100,580,28)).toBe(true);
  expect(Math.abs(wolf.x-100)).toBeCloseTo(3,5);
  const x=wolf.x;
  expect(separateFromPlayer(wolf,100,580,28)).toBe(false);
  expect(wolf.x).toBe(x);
 });
 it('sweeps a boar charge the same way as a wolf',()=>{
  const boar=makeActor('boar',0,600,'boar-hit',40);
  expect(ENEMIES.boar.skills[chooseSkill(boar,ENEMIES.boar,120)].kind).toBe('charge');
  expect(dashHitsPlayer(boar,120,580,160)).toBe(true);
  const combat=new CombatSystem();
  let hit=false;
  ABILITIES['enemy.charge'].activate({
   self:boar.asc!,combat,x:0,y:600,facing:1,h:boar.h,targetX:120,targetY:580,range:160,name:'杂兵猪',
   hitPlayer:()=>{hit=true;},
  });
  expect(hit).toBe(true);
  combat.step(1/60,[{x:0,y:600,w:800,h:200}]);
  expect(combat.charges.some(c=>c.alive)).toBe(true);
 });
 it('holds a pounce attack long enough to close an 85px gap',()=>{
  const wolf=makeActor('wolf',0,600,'wolf-dash',40);
  wolf.state='telegraph';wolf.skill=0;wolf.timer=0;wolf.facing=1;
  stepMachine(wolf,ENEMIES.wolf,{playerX:85,playerY:580,dt:.02});
  expect(wolf.state).toBe('attack');
  expect(wolf.timer).toBeGreaterThanOrEqual(.32);
 });
});

describe('wfc bake',()=>{
 it('bakes reachable variants without rewriting the spine',()=>{
  const baked=bakeForest(11);
  expect(baked).toBeTruthy();
  expect(reachable(baked!).ok).toBe(true);
  expect(baked!.base.length).toBeGreaterThan(FOREST_LAYOUT.base.length);
  const variants=bakeVariants();
  expect(variants.a.dew.filter(d=>d.role!=='bonus')).toHaveLength(10);
  expect(variants.b&&reachable(variants.b).ok).toBe(true);
  expect(variants.c&&reachable(variants.c).ok).toBe(true);
  expect(FOREST_VARIANTS.b.base.length).toBeGreaterThan(FOREST_LAYOUT.base.length);
  expect(FOREST_VARIANTS.c.souvenirs.length).toBeGreaterThan(0);
 });
});
