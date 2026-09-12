import {it,expect} from 'vitest';
import {SlimeSimulation} from '../src/physics';
import {Adventure} from '../src/game';
import {Level} from '../src/level';
import {WaterSimulation} from '../src/water';
import {emptyActions} from '../src/input';
const press=(a:Adventure,action:Partial<ReturnType<typeof emptyActions>>)=>a.apply({...emptyActions(),...action});
const idle={move:0,squeeze:false,jump:false};
const floor=[{x:-1000,y:600,w:6000,h:500}];
it('allows one midair jump, denies a third, and restores jumps on landing',()=>{
 const s=new SlimeSimulation(200,550,floor);
 for(let i=0;i<100;i++)s.step(1/120,idle);
 s.step(1/120,{...idle,jump:true});for(let i=0;i<35;i++)s.step(1/120,idle);
 s.step(1/120,{...idle,jump:true});expect(s.center().vy).toBeLessThan(-350);
 for(let i=0;i<30;i++)s.step(1/120,idle);const vy=s.center().vy;
 s.step(1/120,{...idle,jump:true});expect(s.center().vy).toBeGreaterThan(vy-50);
 for(let i=0;i<150;i++)s.step(1/120,idle);
 const before=s.center().y;s.step(1/120,{...idle,jump:true});for(let i=0;i<8;i++)s.step(1/120,idle);expect(s.center().y).toBeLessThan(before-12);
});
it('switches both ways with C and direct numbers without moving the parked half',()=>{
 const a=new Adventure();a.start();press(a,{split:true});
 press(a,{select1:true});expect(a.sim.activeGroup).toBe(0);
 press(a,{switch:true});expect(a.sim.activeGroup).toBe(1);
 press(a,{switch:true});expect(a.sim.activeGroup).toBe(0);
 press(a,{select2:true});expect(a.sim.activeGroup).toBe(1);
});
it('climbs the actual root wall without penetrating the root',()=>{
 const l=new Level(),s=new SlimeSimulation(1715,530,l.solids);
 for(let i=0;i<240;i++)s.step(1/120,{...idle,move:1,climb:-1});
 expect(s.center().y).toBeLessThan(450);
 expect(s.particles.some(p=>p.x>1762&&p.x<2018&&p.y>389&&p.y<572)).toBe(false);
});
it('recovers a compact jelly body after the entire body exits a narrow gap, even with squeeze held',()=>{
 const l=new Level(),s=new SlimeSimulation(1670,550,l.solids);
 for(let i=0;i<800&&Math.min(...s.particles.map(p=>p.x))<2070;i++)s.step(1/120,{...idle,move:1,squeeze:true});
 for(let i=0;i<220;i++)s.step(1/120,{...idle,squeeze:true});
 const xs=s.particles.map(p=>p.x),ys=s.particles.map(p=>p.y);
 expect(Math.min(...xs)).toBeGreaterThan(2022);
 expect(Math.max(...xs)-Math.min(...xs)).toBeLessThan(135);
 expect(Math.max(...ys)-Math.min(...ys)).toBeGreaterThan(42);
});
it('impact produces travelling waves and ballistic splash drops that return to water',()=>{
 const w=new WaterSimulation({x:0,y:100,w:480,h:80});
 w.impact(240,420,1);
 expect(w.drops.length).toBeGreaterThan(10);
 for(let i=0;i<25;i++)w.step(1/120,[]);
 expect(w.drops.some(d=>d.y<90)).toBe(true);
 expect(Math.max(...w.heights.map(Math.abs))).toBeGreaterThan(.5);
 for(let i=0;i<1500;i++)w.step(1/120,[]);
 expect(w.drops.length).toBe(0);
 expect(Math.max(...w.heights.map(Math.abs))).toBeLessThan(.5);
});
