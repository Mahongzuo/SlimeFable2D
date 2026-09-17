import {describe,it,expect} from 'vitest';
import {WAX_HOLD,WAX_REFORM,WaxPlatform} from '../src/wax';
import {HoneyPool} from '../src/honey';
import {HoneyLevel} from '../src/honey-level';
import {SlimeSimulation} from '../src/physics';
import {antWalk} from '../src/honey-art';
describe('wax timing',()=>{
 it('breaks after a short hold and reforms on schedule',()=>{
  const p=new WaxPlatform(0,100,120);p.advance(WAX_HOLD-.01,true);expect(p.solid).toBe(true);
  p.advance(.01,true);expect(p.solid).toBe(true);p.advance(.001,true);expect(p.solid).toBe(false);
  p.advance(WAX_REFORM-.01,false);expect(p.solid).toBe(false);p.advance(.02,false);expect(p.solid).toBe(true);expect(p.load).toBe(0);
 });
 it('tolerates contact jitter but resets after leaving',()=>{
  const p=new WaxPlatform(0,100,120);p.advance(.8,true);p.advance(.05,false);p.advance(.05,true);expect(p.load).toBeGreaterThan(.7);
  p.advance(.18,false);expect(p.load).toBe(0);p.advance(WAX_HOLD-.1,true);expect(p.solid).toBe(true);
 });
 it('counts a resting body even when particles are not pixel-perfect',()=>{
  const p=new WaxPlatform(100,200,120),sim=new SlimeSimulation(160,188,[]);
  sim.particles.forEach(q=>{q.x=160+(q.x-160)*.15;q.y=193;q.ground=true;q.vy=0;});
  expect(p.supported(sim)).toBe(true);
 });
 it('reset removes shards and restores geometry',()=>{
  const p=new WaxPlatform(20,100,120);p.advance(WAX_HOLD+.01,true);expect(p.shards.length).toBeGreaterThan(30);p.reset();expect(p.solid).toBe(true);expect(p.shards).toHaveLength(0);expect(p.rect).toMatchObject({x:20,y:100,w:120});
 });
});
describe('honey cavern',()=>{
 it('keeps honey as a pool instead of collapsing to a ball',()=>{
  const pool=new HoneyPool({x:0,y:100,w:220,h:40},false,8),sim=new SlimeSimulation(-80,40,[]);
  for(let i=0;i<180;i++)pool.step(1/120,sim);
  const xs=pool.particles.map(p=>p.x);
  expect(Math.max(...xs)-Math.min(...xs)).toBeGreaterThan(90);
 });
 it('honey surface ripples then settles like forest water',()=>{
  const pool=new HoneyPool({x:0,y:100,w:220,h:40}),sim=new SlimeSimulation(-80,40,[]);
  pool.impact(110,180,.8);
  for(let i=0;i<16;i++)pool.step(1/120,sim);
  expect(Math.max(...pool.heights.map(h=>Math.abs(h)))).toBeGreaterThan(.3);
  for(let i=0;i<720;i++)pool.step(1/120,sim);
  expect(Math.max(...pool.heights.map(h=>Math.abs(h)))).toBeLessThan(4);
 });
 it('ceiling drip leaves a lasting honey crown',()=>{
  const pool=new HoneyPool({x:0,y:100,w:220,h:80}),sim=new SlimeSimulation(-80,40,[]);
  pool.land(110,90,10);
  expect(pool.crowns.length).toBeGreaterThan(0);
  expect(pool.merges.length).toBeGreaterThan(0);
  expect(Math.max(...pool.heights.map(h=>Math.abs(h)),...pool.crowns.map(k=>k.amp))).toBeGreaterThan(2.4);
  for(let i=0;i<24;i++)pool.step(1/120,sim);
  expect(Math.abs(pool.surfaceAt(110))).toBeGreaterThan(2);
 });
 it('honey drag kills skating speed instead of water glide',()=>{
  const pool=new HoneyPool({x:0,y:100,w:300,h:80}),sim=new SlimeSimulation(150,130,[]);
  sim.particles.forEach(p=>{p.x=150+(p.x-150)*.2;p.y=140;p.vx=220;p.vy=0;});
  for(let i=0;i<36;i++)pool.step(1/120,sim);
  expect(Math.abs(sim.center().vx)).toBeLessThan(70);
 });
 it('covers every honey pool with crushable wax plates and keeps crystals off the honey',()=>{
  const level=new HoneyLevel();
  for(const pool of level.pools){
   const plates=level.wax.filter(w=>w.rect.x+w.rect.w>pool.bounds.x+16&&w.rect.x<pool.bounds.x+pool.bounds.w-16);
   expect(plates.length).toBeGreaterThanOrEqual(2);
  }
  expect(level.base.some(s=>s.kind==='hex-pad')).toBe(false);
 });
 it('has no shallow puddle at the amber vestibule sign',()=>{
  const level=new HoneyLevel();
  expect(level.pools.some(p=>p.bounds.x<600)).toBe(false);
  expect(level.pools[0].bounds.h).toBeGreaterThan(150);
 });
 it('thin pads are one-way and the hanging rest stem is visual-only',()=>{
  const level=new HoneyLevel();
  const pads=level.base.filter(s=>s.kind==='hex-pad'||(s.h<=28&&s.w>50&&s.kind==='wax-rock'));
  expect(pads.length).toBeGreaterThan(5);
  expect(pads.every(s=>s.oneWay)).toBe(true);
  expect(level.base.some(s=>s.kind==='wax-rock'&&s.w<=36&&s.h>120)).toBe(false);
 });
 it('opens the upper door while the lower plate is held, then latches permanently',()=>{
  const level=new HoneyLevel(),sim=new SlimeSimulation(3460,540,level.solids);
  sim.particles.forEach(p=>{p.x=3460;p.y=598;p.ground=true;});
  level.update(sim,1/60);
  expect(level.latchOn).toBe(false);
  expect(level.solids.some(r=>r.x===level.gate.x&&r.y===level.gate.y)).toBe(false);
  expect(level.solids.some(r=>r.x===level.lowWall.x&&r.y===level.lowWall.y)).toBe(true);
  sim.particles.forEach(p=>{p.x=4140;p.y=246;p.ground=true;});
  level.update(sim,1/60);
  expect(level.latchOn).toBe(true);expect(level.gateOpen).toBe(true);
  expect(level.solids.some(r=>r===level.gate||r===level.lowWall)).toBe(false);
 });
 it('clears honey film and wax after a checkpoint reset',()=>{
  const level=new HoneyLevel(),sim=new SlimeSimulation(980,540,level.solids);
  level.wax[0].advance(WAX_HOLD+.01,true);
  level.pools[0].film.set(0,1);
  level.respawn(sim);
  expect(level.wax[0].solid).toBe(true);expect(level.wax[0].shards).toHaveLength(0);
  expect(level.film(0)).toBe(0);
 });
});
describe('ants',()=>{
 it('never walks past the rim of its wax floor',()=>{
  const minX=1220+22,maxX=1220+370-22,home=1540,span=90;
  for(let t=-1;t<=1;t+=.1){
   const x=antWalk(home,span,minX,maxX,t);
   expect(x).toBeGreaterThanOrEqual(minX);
   expect(x).toBeLessThanOrEqual(maxX);
  }
 });
});
