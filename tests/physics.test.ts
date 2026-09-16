import { describe, it, expect } from 'vitest';
import { SlimeSimulation } from '../src/physics';
const floor = [{x:-1000,y:600,w:6000,h:500}];
const idle={move:0,squeeze:false,jump:false};
describe('PBF slime',()=>{
 it('settles without leaking through ground or losing mass',()=>{
  const s=new SlimeSimulation(200,550,floor);const n=s.particles.length;
  for(let i=0;i<1800;i++)s.step(1/120,idle);
  expect(s.particles.length).toBe(n);
  expect(s.particles.every(p=>Number.isFinite(p.x)&&p.y<598)).toBe(true);
  expect(s.center().y).toBeGreaterThan(540);
  expect(Math.max(...s.particles.map(p=>p.x))-Math.min(...s.particles.map(p=>p.x))).toBeLessThan(140);
  expect(Math.max(...s.particles.map(p=>p.y))-Math.min(...s.particles.map(p=>p.y))).toBeGreaterThan(42);
 },15000);
 it('responds to movement and can jump off a contacted floor',()=>{
  const s=new SlimeSimulation(200,550,floor);
  for(let i=0;i<120;i++)s.step(1/120,idle);
  const y=s.center().y;
  for(let i=0;i<120;i++)s.step(1/120,{...idle,move:1});
  expect(s.center().x).toBeGreaterThan(320);
  s.step(1/120,{...idle,jump:true});
  for(let i=0;i<20;i++)s.step(1/120,idle);
  expect(s.center().y).toBeLessThan(y-25);
 });
 it('splits into two physical groups while preserving particle count',()=>{
  const s=new SlimeSimulation(200,550,floor);const n=s.particles.length;
  expect(s.split()).toBe(true);expect(s.groups()).toHaveLength(2);
  expect(s.particles.length).toBe(n);expect(s.split()).toBe(false);
  s.reset(200,550);expect(s.groups()).toHaveLength(1);expect(s.particles.length).toBe(n);
 });
 it('does not merge through an intervening wall',()=>{
  const s=new SlimeSimulation(200,550,floor);s.split();
  for(const p of s.particles)p.x=p.group===0?185:215;
  s.solids=[...floor,{x:197,y:400,w:6,h:200}];
  expect(s.merge()).toBe(false);
  s.solids=floor;expect(s.merge()).toBe(true);expect(s.groups()).toHaveLength(1);
 });
 it('lets the inactive half settle instead of drifting away from a plate',()=>{
  const s=new SlimeSimulation(200,550,floor);
  for(let i=0;i<120;i++)s.step(1/120,idle);
  s.split();const x=s.center(0).x;
  for(let i=0;i<240;i++)s.step(1/120,idle);
  expect(Math.abs(s.center(0).x-x)).toBeLessThan(60);
 });
 it('keeps a spent double-jump budget when switching away and back',()=>{
  const s=new SlimeSimulation(200,550,floor);s.split();s.activeGroup=1;
  for(let i=0;i<180;i++)s.step(1/120,idle);
  s.step(1/120,{...idle,jump:true});
  for(let i=0;i<25;i++)s.step(1/120,idle);
  s.step(1/120,{...idle,jump:true});s.switchGroup();
  for(let i=0;i<25;i++)s.step(1/120,idle);s.switchGroup();
  const vy=s.center(1).vy;s.step(1/120,{...idle,jump:true});
  expect(s.center(1).vy).toBeGreaterThan(vy-50);
 });
 it('does not treat the underground as the surface pool',()=>{
  const s=new SlimeSimulation(2600,1600,[{x:2400,y:1700,w:800,h:80}]);
  s.water={x:2420,y:602,w:480,h:80};
  const y=s.center().y;
  for(let i=0;i<40;i++)s.step(1/120,idle);
  expect(s.center().y).toBeGreaterThan(y+8);
 });
 it('lets squeeze or down drop through a one-way ledge',()=>{
  const ledge=[{x:100,y:600,w:220,h:16,oneWay:true as const}];
  const s=new SlimeSimulation(200,550,ledge);
  for(let i=0;i<150;i++)s.step(1/120,idle);
  const y=s.center().y;
  expect(y).toBeLessThan(598);
  for(let i=0;i<90;i++)s.step(1/120,{...idle,climb:-1});
  expect(s.center().y).toBeGreaterThan(y+20);
 });
 it('lands on a one-way deck after jumping up through it, even if squeeze was held in the air',()=>{
  const deck=[{x:80,y:500,w:280,h:32,oneWay:true as const},{x:-200,y:600,w:800,h:80}];
  const s=new SlimeSimulation(200,550,deck);
  for(let i=0;i<80;i++)s.step(1/120,idle);
  s.step(1/120,{...idle,jump:true});
  for(let i=0;i<16;i++)s.step(1/120,{...idle,jumpHeld:true,squeeze:true});
  for(let i=0;i<90;i++)s.step(1/120,idle);
  expect(s.center().y).toBeLessThan(498);
  expect(s.center().y).toBeGreaterThan(430);
  expect(s.particles.some(p=>p.ground)).toBe(true);
 });
 it('recalls scraped particles after four seconds, ignoring the wall',()=>{
  const wall={x:200,y:200,w:200,h:500};
  const s=new SlimeSimulation(200,550,[...floor,wall]);
  s.particles.forEach((p,i)=>{p.x=i<20?80:480;p.y=550;p.vx=0;p.vy=0;p.ox=p.x;p.oy=p.y;});
  for(let i=0;i<360;i++)s.step(1/120,idle);
  expect(s.recalled).toBe(false);
  expect(Math.max(...s.particles.map(p=>p.x))-Math.min(...s.particles.map(p=>p.x))).toBeGreaterThan(70);
  for(let i=0;i<160;i++)s.step(1/120,idle);
  expect(s.recalled).toBe(true);
  expect(Math.max(...s.particles.map(p=>p.x))-Math.min(...s.particles.map(p=>p.x))).toBeLessThan(140);
 },15000);
 it('holding jump produces a higher arc than a short tap',()=>{
  const peak=(held:boolean)=>{const s=new SlimeSimulation(200,550,floor);
   for(let i=0;i<120;i++)s.step(1/120,idle);
   let top=600;for(let i=0;i<90;i++){s.step(1/120,{...idle,jump:i===0,jumpHeld:held});top=Math.min(top,s.center().y);}return top;
  };
  expect(peak(false)-peak(true)).toBeGreaterThan(10);
 });
});
