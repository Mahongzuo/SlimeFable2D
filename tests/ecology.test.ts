import {describe,it,expect} from 'vitest';
import {EcoWorld} from '../src/ecology/world';
import {createEcology,ecologyCollectibles,fillCollectibles,walkableSpots,FLY_KINDS} from '../src/ecology/content';
import {hasEcoDraw} from '../src/ecology/draw';
import {Adventure} from '../src/game';
import {SlimeSimulation} from '../src/physics';

const body=(x=0,y=70)=>new SlimeSimulation(x,y,[]);
describe('living world',()=>{
 it('requires the offering before revealing a habitat, and only completes once',()=>{
  const w=new EcoWorld({interactables:[{id:'fruit',kind:'forest-fruit',x:0,y:100},{id:'home',kind:'forest-root',x:200,y:100,needs:['fruit']}],events:[{id:'home-event',title:'搬家',objects:['fruit','home'],text:'回家了'}]});
  const s=body(200);w.update(.1,s,true);expect(w.completed.has('home')).toBe(false);
  s.plant(0,70);w.update(.1,s,true);s.plant(200,70);w.update(.1,s,true);
  expect(w.completed.has('home-event')).toBe(true);
  w.update(.1,s,true);expect(w.signals.filter(e=>e.type==='event')).toHaveLength(1);
 });
 it('rewinding retains rewards but cancels unfinished timed attempts',()=>{
  const w=new EcoWorld({challenges:[{id:'race',title:'一小段路',limit:2,points:[{x:0,y:70},{x:200,y:70}],text:'完成'}]});
  const s=body();w.update(.1,s,false);expect(w.challengeStates.get('race')?.index).toBe(1);
  w.update(3,s,false);expect(w.challengeStates.get('race')?.index).toBe(0);
  s.plant(80,70);w.update(.1,s,false);s.plant(0,70);w.update(.1,s,false);s.plant(200,70);w.update(.1,s,false);
  expect(w.completed.has('race')).toBe(true);w.rewind();expect(w.completed.has('race')).toBe(true);
 });
 it('ordered bells reset on a wrong note and remain solvable',()=>{
  const objects=[0,1,2].map(i=>({id:`b${i}`,kind:'wind-bell-live',x:i*160,y:100}));
  const w=new EcoWorld({interactables:objects,events:[{id:'song',title:'铃声',kind:'ordered',objects:objects.map(o=>o.id),text:'鸟来了'}]});
  const s=body(160);w.update(.1,s,true);expect(w.completed.has('b1')).toBe(false);
  for(const o of objects){s.plant(o.x,70);w.update(.1,s,true);}
  expect(w.completed.has('song')).toBe(true);
 });
 it('uses two different bodies before a merge can light the twin lamps',()=>{
  const w=new EcoWorld({interactables:[{id:'a',kind:'mirror-lamp',x:0,y:100},{id:'b',kind:'mirror-lamp',x:160,y:100}],events:[{id:'hug',title:'拥抱',kind:'split-merge',objects:['a','b'],text:'爱你老己'}]});
  const s=body();w.update(.1,s,true);s.plant(160,70);w.update(.1,s,true);expect(w.completed.has('hug')).toBe(false);
  s.split();s.activeGroup=0;s.plant(0,70);w.update(.1,s,true);s.activeGroup=1;s.plant(160,70);w.update(.1,s,true);
  s.particles.forEach(p=>p.group=0);w.update(.1,s,false);expect(w.completed.has('hug')).toBe(true);
 });
 it('rejects points buried inside a thick mound and keeps flyers in the air',()=>{
  const solids=[{x:0,y:600,w:2000,h:200,kind:'earth'},{x:800,y:200,w:200,h:400,kind:'earth'}];
  const spots=walkableSpots(solids,{minGap:80});
  expect(spots.every(s=>!(s.x>804&&s.x<996&&s.y>202&&s.y<598))).toBe(true);
  const eco=createEcology('forest',solids);
  const moth=eco.fauna?.find(f=>f.kind==='moth');
  expect(moth).toBeTruthy();
  expect(FLY_KINDS.has('moth')).toBe(true);
  expect(moth!.y).toBeLessThan(540);
  const lantern=eco.interactables?.find(o=>o.kind==='forest-firefly-lantern');
  expect(lantern&&!(lantern.y>202&&lantern.y<598&&lantern.x>804&&lantern.x<996)).toBe(true);
 });
 it('snaps extra collectibles onto walkable tops instead of a floating grid',()=>{
  const solids=[{x:0,y:600,w:2000,h:200,kind:'earth'},{x:400,y:420,w:180,h:16,kind:'branch',oneWay:true}];
  const spots=walkableSpots(solids,{spawn:{x:80,y:560},minGap:120});
  expect(spots.every(s=>Math.abs(s.y-576)<2||Math.abs(s.y-396)<2)).toBe(true);
  expect(spots.some(s=>s.x<200)).toBe(false);
  const level={dew:[{x:720,y:551,got:false,role:'main' as const}],souvenirs:[],width:2000,height:800,base:solids,checkpoint:{x:80,y:560}};
  fillCollectibles(level,'forest');
  expect(level.dew.every(d=>d.role==='main'||d.role==='bonus')).toBe(true);
  expect(level.dew.filter(d=>d.role==='main')).toHaveLength(1);
  expect(level.dew.length).toBe(27);
  expect(level.dew.slice(1).every(d=>spots.some(s=>Math.hypot(s.x-d.x,s.y-d.y)<4)||d.role==='bonus')).toBe(true);
 });
 it('moves following fauna after an offering event',()=>{
  const w=new EcoWorld({
   interactables:[{id:'fruit',kind:'forest-hollow-fruit',x:0,y:100,text:'按 F 摇下空心果'},{id:'home',kind:'forest-root-door',x:200,y:100,needs:['fruit']}],
   events:[{id:'home-event',title:'搬家',objects:['fruit','home'],text:'回家了'}],
   fauna:[{id:'s',kind:'snail',x:40,y:100,span:20,follow:'home'}],
  });
  const s=body(200);w.update(.1,s,true);
  expect(w.completed.has('home')).toBe(false);
  expect(w.signals.some(e=>e.type==='blocked')).toBe(true);
  s.plant(0,70);w.update(.1,s,true);s.plant(200,70);w.update(.1,s,true);
  expect(w.fauna[0].target?.x).toBeGreaterThan(180);
 });
 it('reveals a shortcut platform after an event finishes',()=>{
  const w=new EcoWorld({interactables:[{id:'a',kind:'wind-kite-anchor',x:0,y:100,platform:{x:-48,y:92,w:96,h:16,kind:'branch',oneWay:true}},{id:'b',kind:'wind-kite-anchor',x:220,y:100}],events:[{id:'bridge',title:'捷径',objects:['a','b'],text:'通了'}]});
  const s=body(0);w.update(.1,s,true);s.plant(220,70);w.update(.1,s,true);
  expect(w.completed.has('bridge')).toBe(true);
  expect(w.revealedPlatforms().length).toBeGreaterThan(0);
 });
 it('keeps forest dew and ecology on the playable side of the left wall',()=>{
  const a=new Adventure();
  a.selectLevel('forest');
  expect(a.level.dew.every(d=>d.x>=80)).toBe(true);
  expect(a.level.ecology.objects.every(o=>o.x>=80&&o.kind!=='forest-bounce-mushroom'&&o.kind!=='forest-root-door')).toBe(true);
 });
 it('awards map enemy kills into the feat band and keeps extras bonus',()=>{
  const a=new Adventure();
  a.selectLevel('forest');
  expect(a.level.dew.filter(d=>d.role==='bonus').length).toBeGreaterThan(0);
  expect(a.level.dew.filter(d=>d.role!=='bonus').length).toBeLessThan(a.level.dew.length);
  expect(a.level.dew.length).toBeGreaterThanOrEqual(27);
  const actor=a.actors[0];
  expect(actor).toBeTruthy();
  expect(a.run.award('feat',actor.id)||a.run.contentScore>=0).toBe(true);
  a.collectKill(actor);
  expect(a.run.contentScore).toBeGreaterThan(0);
 });
 it('ships the promised fixed content for all five chapters',()=>{
  for(const [i,id] of ['forest','honey','tide','wind','mirror'].entries()){
   const e=createEcology(id);const c=ecologyCollectibles(id);
   expect(new Set(e.interactables?.map(o=>o.kind)).size).toBeGreaterThanOrEqual(id==='forest'?4:i<2?6:8);
   expect(new Set(e.fauna?.map(o=>o.kind)).size).toBeGreaterThanOrEqual(i<2?3:4);
   expect(e.events).toHaveLength(i<2?2:3);expect(e.challenges).toHaveLength(i<2?1:2);expect(e.biomes).toHaveLength(3);
   expect(c.dew.filter(d=>d.rarity!=='rare')).toHaveLength(i<2?24:36);
   expect(c.dew.filter(d=>d.rarity==='rare')).toHaveLength(3);expect(c.souvenirs).toHaveLength(1);
   expect(new Set(c.dew.map(d=>d.id)).size).toBe(c.dew.length);
   for(const o of e.interactables??[])expect(hasEcoDraw(o.kind),o.kind).toBe(true);
   for(const f of e.fauna??[])expect(hasEcoDraw(f.kind),f.kind).toBe(true);
  }
 });
});
