import {it,expect} from 'vitest';
import {Level} from '../src/level';
import {SlimeSimulation} from '../src/physics';
it('requires both separate groups on plates and latches gate open',()=>{
 const level=new Level(),s=new SlimeSimulation(3250,530,level.solids);
 level.update(s,1/60);expect(level.gateOpen).toBe(false);
 s.split();
 s.particles.forEach(p=>{p.x=p.group===0?level.plates[0].x:level.plates[1].x;p.y=590;});
 for(let i=0;i<100;i++)level.update(s,1/60);
 expect(level.gateOpen).toBe(true);
 s.reset(200,550);level.update(s,1/60);expect(level.gateOpen).toBe(true);
});
it('activates checkpoint after narrow passage and restores a whole slime',()=>{
 const level=new Level(),s=new SlimeSimulation(2250,540,level.solids);
 level.update(s,1/60);expect(level.checkpoint.x).toBeGreaterThan(2000);
 s.split();level.respawn(s);expect(s.groups()).toHaveLength(1);
 expect(s.center().x).toBeCloseTo(level.checkpoint.x);
});
