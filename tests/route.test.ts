import {it,expect} from 'vitest';
import {SlimeSimulation} from '../src/physics';
import {Level} from '../src/level';
it('squeezes the whole particle body through the actual root corridor',()=>{
 const l=new Level(),s=new SlimeSimulation(1650,550,l.solids);
 for(let i=0;i<1400;i++)s.step(1/120,{move:1,squeeze:true,jump:false});
 expect(Math.min(...s.particles.map(p=>p.x))).toBeGreaterThan(2025);
});
it('can leave the water basin with a jump',()=>{
 const l=new Level(),s=new SlimeSimulation(2820,640,l.solids);s.water=l.water;
 for(let i=0;i<300;i++)s.step(1/120,{move:1,squeeze:false,jump:i%85===0});
 expect(s.center().x).toBeGreaterThan(2930);
 expect(s.center().y).toBeLessThan(600);
});
