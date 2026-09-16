import {hitbox,overlaps,resolveActor,type Actor,type Solid} from '../actor/actor';
import {ENEMIES,hurtActor} from '../ai/machine';
import {CueBus} from '../gas/cues';
import type {StakeSpot} from '../content/types';
import {asset} from '../asset';
import {atlasFx,type AtlasClip} from '../vfx/atlas-fx';

export type Slash={x:number;y:number;facing:number;t:number;life:number;r:number;step:number;damage:number;hits:Set<string>}
export type Shot={x:number;y:number;vx:number;vy:number;r:number;alive:boolean;life:number;facing:number;age:number;trail:{x:number;y:number}[];home?:{id?:string;x:number;y:number};rippled?:boolean}
export type Spore={x:number;y:number;vx:number;vy:number;life:number;alive:boolean}
export type AttackFx={kind:'bump'|'whip'|'puff'|'smash'|'wave'|'suck';x:number;y:number;facing:number;t:number;life:number;r?:number}
export type Melon={x:number;y:number;vx:number;vy:number;r:number;alive:boolean;phase:'fall'|'burst';t:number;life:number;slice?:boolean}
export type Juice={x:number;y:number;r:number;life:number;max:number}
export type Shard={x:number;y:number;vx:number;vy:number;life:number;a:number}
export type Arrow={x:number;y:number;vx:number;vy:number;r:number;alive:boolean;life:number;angle:number}
export type Bolt={x:number;y:number;vx:number;vy:number;r:number;alive:boolean;life:number}
export type Charge={x:number;y:number;vx:number;r:number;alive:boolean;life:number}
export type Slam={x:number;y:number;t:number;life:number;r:number}
export type Puddle={x:number;y:number;r:number;life:number;max:number;tick:number}
export type Hawk={x:number;y:number;vx:number;vy:number;r:number;alive:boolean;life:number}
export type Beam={x:number;y:number;tx:number;ty:number;t:number;life:number}
export type Ring={x:number;y:number;t:number;life:number;r:number}
export type Orbit={x:number;y:number;t:number;life:number;r:number}

export const SLASH_LIFE=.18,SLASH_R=68,SHOT_R=13;
const COMBO_WINDOW=.58;
const STYLES=[
 {r:78,life:.16,start:-1.12,end:.28,thick:11},
 {r:84,life:.16,start:-.18,end:1.2,thick:11},
 {r:94,life:.2,start:-.95,end:.82,thick:13},
 {r:108,life:.28,start:-1.3,end:.9,thick:16},
] as const;

export class CombatSystem {
 slashes:Slash[]=[];
 shots:Shot[]=[];
 spores:Spore[]=[];
 fx:AttackFx[]=[];
 melons:Melon[]=[];
 juices:Juice[]=[];
 shards:Shard[]=[];
 arrows:Arrow[]=[];
 bolts:Bolt[]=[];
 charges:Charge[]=[];
 slams:Slam[]=[];
 puddles:Puddle[]=[];
 hawks:Hawk[]=[];
 beams:Beam[]=[];
 rings:Ring[]=[];
 orbits:Orbit[]=[];
 clips:AtlasClip[]=[];
 floods:{y:number;t:number;life:number}[]=[];
 pushX=0;
 smashed=false;
 cues=new CueBus();
 meleeCd=0;
 facing=1;
 combo=0;
 comboUntil=0;
 time=0;
  step(dt:number,solids:{x:number;y:number;w:number;h:number;oneWay?:boolean}[],follow?:{x:number;y:number},homes?:{id:string;x:number;y:number}[]){
  this.time+=dt;
  this.meleeCd=Math.max(0,this.meleeCd-dt);
  this.smashed=false;
  this.cues.step(dt);
  if(this.time>this.comboUntil)this.combo=0;
  for(const slash of this.slashes){
   if(follow){slash.x=follow.x;slash.y=follow.y;}
   slash.t+=dt;
  }
  this.slashes=this.slashes.filter(s=>s.t<s.life);
  for(const item of this.fx)item.t+=dt;
  this.fx=this.fx.filter(s=>s.t<s.life);
  for(const shot of this.shots){
   if(!shot.alive)continue;
   if(shot.home){
    const live=shot.home.id?homes?.find(h=>h.id===shot.home!.id):undefined;
    if(live){shot.home.x=live.x;shot.home.y=live.y;}
    const dx=shot.home.x-shot.x,dy=shot.home.y-shot.y,d=Math.hypot(dx,dy)||1;
    shot.vx+=(dx/d*400-shot.vx)*Math.min(1,dt*7);
    shot.vy+=(dy/d*400-shot.vy)*Math.min(1,dt*7);
   }
   shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;if(!shot.home)shot.vy+=90*dt;shot.life-=dt;shot.age+=dt;
   shot.trail.push({x:shot.x,y:shot.y});
   if(shot.trail.length>12)shot.trail.shift();
   if(shot.life<=0||solids.some(s=>!s.oneWay&&overlaps(shot.x-shot.r,shot.y-shot.r,shot.r*2,shot.r*2,s.x,s.y,s.w,s.h)))shot.alive=false;
  }
  this.shots=this.shots.filter(s=>s.alive);
  for(const spore of this.spores){
   if(!spore.alive)continue;
   spore.x+=spore.vx*dt;spore.y+=spore.vy*dt;spore.life-=dt;
   if(spore.life<=0)spore.alive=false;
  }
  this.spores=this.spores.filter(s=>s.alive);
  for(const arrow of this.arrows){
   if(!arrow.alive)continue;
   arrow.x+=arrow.vx*dt;arrow.y+=arrow.vy*dt;arrow.life-=dt;arrow.angle=Math.atan2(arrow.vy,arrow.vx);
   if(arrow.life<=0||solids.some(s=>!s.oneWay&&overlaps(arrow.x-arrow.r,arrow.y-arrow.r,arrow.r*2,arrow.r*2,s.x,s.y,s.w,s.h)))arrow.alive=false;
  }
  this.arrows=this.arrows.filter(a=>a.alive);
  for(const bolt of this.bolts){
   if(!bolt.alive)continue;
   bolt.x+=bolt.vx*dt;bolt.y+=bolt.vy*dt;bolt.life-=dt;
   if(bolt.life<=0||solids.some(s=>!s.oneWay&&overlaps(bolt.x-bolt.r,bolt.y-bolt.r,bolt.r*2,bolt.r*2,s.x,s.y,s.w,s.h)))bolt.alive=false;
  }
  this.bolts=this.bolts.filter(b=>b.alive);
  this.stepMore(dt,solids);
  this.stepHazards(dt,solids);
 }
 private stepMore(dt:number,solids:{x:number;y:number;w:number;h:number;oneWay?:boolean}[]){
  this.pushX=0;
  for(const item of this.charges){
   if(!item.alive)continue;
   item.x+=item.vx*dt;item.life-=dt;
   if(item.life<=0||solids.some(s=>!s.oneWay&&overlaps(item.x-item.r,item.y-item.r,item.r*2,item.r*2,s.x,s.y,s.w,s.h)))item.alive=false;
  }
  this.charges=this.charges.filter(s=>s.alive);
  for(const slam of this.slams)slam.t+=dt;
  this.slams=this.slams.filter(s=>s.t<s.life);
  for(const puddle of this.puddles){puddle.life-=dt;puddle.tick+=dt;}
  this.puddles=this.puddles.filter(p=>p.life>0);
  for(const hawk of this.hawks){
   if(!hawk.alive)continue;
   hawk.x+=hawk.vx*dt;hawk.y+=hawk.vy*dt;hawk.life-=dt;hawk.vy+=120*dt;
   if(hawk.life<=0||solids.some(s=>!s.oneWay&&overlaps(hawk.x-hawk.r,hawk.y-hawk.r,hawk.r*2,hawk.r*2,s.x,s.y,s.w,s.h)))hawk.alive=false;
  }
  this.hawks=this.hawks.filter(h=>h.alive);
  for(const beam of this.beams)beam.t+=dt;
  this.beams=this.beams.filter(b=>b.t<b.life);
  for(const ring of this.rings)ring.t+=dt;
  this.rings=this.rings.filter(r=>r.t<r.life);
  for(const orbit of this.orbits)orbit.t+=dt;
  this.orbits=this.orbits.filter(o=>o.t<o.life);
  for(const clip of this.clips)clip.t+=dt;
  this.clips=this.clips.filter(c=>c.t<c.life);
  for(const flood of this.floods)flood.t+=dt;
  this.floods=this.floods.filter(f=>f.t<f.life);
 }
 private stepHazards(dt:number,solids:{x:number;y:number;w:number;h:number;oneWay?:boolean}[]){
  for(const melon of this.melons){
   if(!melon.alive)continue;
   if(melon.phase==='fall'){
    melon.vy+=780*dt;melon.x+=melon.vx*dt;melon.y+=melon.vy*dt;melon.life-=dt;
    const hit=solids.some(s=>!s.oneWay&&overlaps(melon.x-melon.r,melon.y-melon.r,melon.r*2,melon.r*2,s.x,s.y,s.w,s.h));
    if(hit||melon.life<=0||melon.y>620)this.burstMelon(melon);
   }else{
    melon.t+=dt;
    if(melon.t>melon.life)melon.alive=false;
   }
  }
  this.melons=this.melons.filter(m=>m.alive);
  for(const shard of this.shards){shard.x+=shard.vx*dt;shard.y+=shard.vy*dt;shard.vy+=520*dt;shard.a+=dt*8;shard.life-=dt;}
  this.shards=this.shards.filter(s=>s.life>0);
  for(const juice of this.juices)juice.life-=dt;
  this.juices=this.juices.filter(j=>j.life>0);
 }
 burstMelon(melon:Melon){
  if(melon.phase==='burst')return;
  melon.phase='burst';melon.t=0;melon.life=.28;melon.vy=0;melon.vx=0;
  this.smashed=true;
  this.fx.push({kind:'smash',x:melon.x,y:melon.y,facing:1,t:0,life:.38,r:melon.slice?28:42});
  const n=melon.slice?5:8;
  for(let i=0;i<n;i++){
   const a=-Math.PI*.2-i*(Math.PI/(n-1))*.9;
   this.shards.push({x:melon.x,y:melon.y,vx:Math.cos(a)*(90+i*18),vy:Math.sin(a)*140-40,life:.45+i*.04,a:a});
  }
  this.juices.push({x:melon.x,y:melon.y+6,r:melon.slice?36:48,life:2.4,max:2.4});
 }
 rainMelons(originX:number,count=5){this.shootAimed(originX,80,originX,598);}
 ultFeast(x:number,y:number){this.fanArrows(x,y,x-120,y-20);}
 private fireArrow(x:number,y:number,vx:number,vy:number,r=10){
  this.arrows.push({x,y,vx,vy,r,alive:true,life:2.4,angle:Math.atan2(vy,vx)});
 }
 shootAimed(fromX:number,fromY:number,toX:number,toY:number){
  const x=fromX,y=fromY-48,tx=toX,ty=toY-18;
  const dx=tx-x,dy=ty-y,d=Math.hypot(dx,dy)||1;
  this.fireArrow(x+dx/d*36,y+dy/d*36,dx/d*420,dy/d*420);
 }
 fanArrows(fromX:number,fromY:number,toX:number,toY:number){
  const x=fromX,y=fromY-48;
  const base=Math.atan2(toY-18-y,toX-x);
  for(let i=-1;i<=1;i++){
   const a=base+i*.25;
   this.fireArrow(x+Math.cos(a)*36,y+Math.sin(a)*36,Math.cos(a)*460,Math.sin(a)*460,12);
  }
  this.fx.push({kind:'wave',x:fromX,y:fromY-20,facing:1,t:0,life:.55,r:28});
 }
 castBolt(fromX:number,fromY:number,toX:number,toY:number){
  const x=fromX,y=fromY-40,tx=toX,ty=toY-18;
  const dx=tx-x,dy=ty-y,d=Math.hypot(dx,dy)||1;
  this.bolts.push({x:x+dx/d*28,y:y+dy/d*28,vx:dx/d*340,vy:dy/d*340,r:12,alive:true,life:2.2});
  this.burst('magic',fromX,fromY-36,.45);
 }
 burst(pack:string,x:number,y:number,life=.5,scale=1){
  this.clips.push({pack,x,y,t:0,life,scale});
 }
 flood(y:number,life=7){
  this.floods.push({y,t:0,life});
  this.burst('shock',800,y,1,.9);
 }
 charge(x:number,y:number,facing:number){
  this.charges.push({x:x+facing*28,y:y-16,vx:facing*340,r:18,alive:true,life:.45});
  this.fx.push({kind:'bump',x,y:y-10,facing,t:0,life:.28});
 }
 slam(x:number,y:number,r=90){
  this.slams.push({x,y,t:0,life:.42,r});
  this.fx.push({kind:'smash',x,y,facing:1,t:0,life:.4,r});
  this.burst('shock',x,y-20,.5,.7);
 }
 puddle(x:number,y:number,r=46,life=3.2){
  this.puddles.push({x,y,r,life,max:life,tick:0});
 }
 hawk(fromX:number,fromY:number,toX:number,toY:number){
  const x=fromX,y=fromY-56,dx=toX-x,dy=toY-18-y,d=Math.hypot(dx,dy)||1;
  this.hawks.push({x,y,vx:dx/d*320,vy:dy/d*320-40,r:12,alive:true,life:2.1});
  this.burst('bow',x,y,.4,.55);
 }
 drain(fromX:number,fromY:number,toX:number,toY:number){
  this.beams.push({x:fromX,y:fromY-48,tx:toX,ty:toY-16,t:0,life:.55});
  this.burst('magic',fromX,fromY-40,.45,.6);
 }
 mistDash(x:number,y:number,facing:number){
  this.charges.push({x:x+facing*20,y:y-20,vx:facing*420,r:20,alive:true,life:.28});
  this.fx.push({kind:'wave',x,y:y-12,facing,t:0,life:.4,r:24});
 }
 gale(x:number,y:number,facing:number){
  this.fx.push({kind:'wave',x,y:y-8,facing,t:0,life:.5,r:36});
  this.burst('slash',x+facing*40,y-24,.4,.7);
  this.pushX=facing*220;
 }
 ring(x:number,y:number){
  this.rings.push({x,y,t:0,life:.85,r:36});
  this.burst('shock',x,y-10,.6,.8);
 }
 dragon(x:number,y:number){
  this.orbits.push({x,y:y-20,t:0,life:2.4,r:78});
  this.burst('dragon',x,y-30,1.2,1.05);
 }
 frost(fromX:number,fromY:number,toX:number,toY:number){
  const x=fromX,y=fromY-36,dx=toX-x,dy=toY-18-y,d=Math.hypot(dx,dy)||1;
  this.bolts.push({x:x+dx/d*24,y:y+dy/d*24,vx:dx/d*300,vy:dy/d*300,r:11,alive:true,life:2});
 }
 suck(x:number,y:number){
  this.fx.push({kind:'suck',x,y,facing:1,t:0,life:.45,r:90});
 }
 slowAt(x:number,y:number){
  return this.juices.some(j=>Math.hypot(j.x-x,j.y-y)<j.r+12);
 }
 lockTarget(actors:Actor[],x:number,y:number,range=150){
  let best:Actor|undefined,bestD=range;
  for(const actor of actors){
   if(actor.dead)continue;
   const d=Math.hypot(actor.x-x,actor.y-y);
   if(d<bestD){best=actor;bestD=d;}
  }
  return best;
 }
 slash(x:number,y:number,facing:number){
  if(this.meleeCd>0)return false;
  this.facing=facing||this.facing;
  if(this.time>this.comboUntil)this.combo=0;
  const step=this.combo;
  const style=STYLES[step];
  this.combo=step===3?0:step+1;
  this.comboUntil=this.time+(step===3?.12:COMBO_WINDOW);
  this.meleeCd=step===3?.4:.15;
  this.slashes.push({
   x,y,facing:this.facing,t:0,life:style.life,r:style.r,step,
   damage:step===3?2:1,hits:new Set(),
  });
  return true;
 }
 shoot(x:number,y:number,facing:number,home?:{id?:string;x:number;y:number}){
  this.facing=facing||this.facing;
  let vx=this.facing*380,vy=-22;
  if(home&&Math.hypot(home.x-x,home.y-y)<170){
   const dx=home.x-x,dy=home.y-y,d=Math.hypot(dx,dy)||1;
   vx=dx/d*400;vy=dy/d*400;
  }
  this.shots.push({
   x:x+this.facing*18,y,vx,vy,r:SHOT_R,alive:true,life:2.2,
   facing:this.facing,age:0,trail:[{x:x+this.facing*8,y}],home,
  });
 }
 puff(x:number,y:number,facing:number){
  this.spores.push({x,y:y-10,vx:facing*90,vy:-40,life:1.8,alive:true});
  this.fx.push({kind:'puff',x,y:y-18,facing,t:0,life:.35});
 }
 bump(x:number,y:number,facing:number){
  this.fx.push({kind:'bump',x,y:y-12,facing,t:0,life:.28});
 }
 whip(x:number,y:number,facing:number){
  this.fx.push({kind:'whip',x,y:y-8,facing,t:0,life:.32});
 }
 hitStakes(stakes:StakeSpot[]){
  let hits=0;
  for(const stake of stakes){
   if(stake.hp<=0)continue;
   const dmg=this.takeHit(`stake:${stake.id}`,stake.x,stake.y,stake.w,stake.h);
   if(dmg){stake.hp-=dmg;hits++;}
  }
  return hits;
 }
 hitActors(actors:Actor[],knock=18,solids?:Solid[]){
  const killed:Actor[]=[];
  for(const actor of actors){
   if(actor.dead)continue;
   const box=hitbox(actor);
   const dmg=this.takeHit(`actor:${actor.id}`,box.x,box.y,box.w,box.h);
   if(!dmg)continue;
   if(actor.kind==='bear'&&!this.slashes.some(s=>s.hits.has(`actor:${actor.id}`))){
    if(!actor.asc?.has('bear.pad')){actor.asc?.hold('bear.pad',10);continue;}
    actor.asc.tags.remove('bear.pad');
   }
   if(hurtActor(actor,dmg,this.cues)){
    const def=ENEMIES[actor.kind];
    if(def){
     const k=actor.kind==='picnic'?6:knock;
     actor.x+=this.facing*k;
     if(actor.kind!=='picnic'&&actor.kind!=='pig')actor.y-=k*.15;
     if(solids)resolveActor(actor,solids);
    }
    if(actor.dead)killed.push(actor);
   }
  }
  return killed;
 }
 hitsPlayer(x:number,y:number,r=28){
  if(this.spores.some(s=>s.alive&&Math.hypot(s.x-x,s.y-y)<r+14)){
   this.spores.forEach(s=>{if(Math.hypot(s.x-x,s.y-y)<r+14)s.alive=false;});
   return true;
  }
  for(const melon of this.melons){
   if(melon.alive&&melon.phase==='fall'&&Math.hypot(melon.x-x,melon.y-y)<r+melon.r){
    this.burstMelon(melon);return true;
   }
  }
  for(const arrow of this.arrows){
   if(arrow.alive&&Math.hypot(arrow.x-x,arrow.y-y)<r+arrow.r){arrow.alive=false;return true;}
  }
  for(const bolt of this.bolts){
   if(bolt.alive&&Math.hypot(bolt.x-x,bolt.y-y)<r+bolt.r){bolt.alive=false;return true;}
  }
  for(const shard of this.shards){
   if(Math.hypot(shard.x-x,shard.y-y)<r+8){shard.life=0;return true;}
  }
  for(const fx of this.fx){
   if(fx.kind==='wave'&&fx.t<0.22&&Math.hypot(fx.x-x,fx.y-y)<(fx.r??40)+r+fx.t*180)return true;
  }
  for(const item of this.charges){
   if(item.alive&&Math.hypot(item.x-x,item.y-y)<r+item.r){item.alive=false;return true;}
  }
  for(const slam of this.slams){
   if(slam.t<0.2&&Math.hypot(slam.x-x,slam.y-y)<slam.r+r)return true;
  }
  for(const puddle of this.puddles){
   if(puddle.tick>=.45&&Math.hypot(puddle.x-x,puddle.y-y)<puddle.r+r){puddle.tick=0;return true;}
  }
  for(const hawk of this.hawks){
   if(hawk.alive&&Math.hypot(hawk.x-x,hawk.y-y)<r+hawk.r){hawk.alive=false;return true;}
  }
  for(const beam of this.beams){
   if(beam.t<beam.life){
    const px=beam.x+(beam.tx-beam.x)*(beam.t/beam.life),py=beam.y+(beam.ty-beam.y)*(beam.t/beam.life);
    if(Math.hypot(px-x,py-y)<r+16)return true;
   }
  }
  for(const ring of this.rings){
   const rad=ring.r+ring.t*210;
   const d=Math.hypot(ring.x-x,ring.y-y);
   if(Math.abs(d-rad)<18+r*.3)return true;
  }
  for(const orbit of this.orbits){
   const a=orbit.t*4.2,ox=orbit.x+Math.cos(a)*orbit.r,oy=orbit.y+Math.sin(a)*orbit.r*.45;
   if(Math.hypot(ox-x,oy-y)<r+22)return true;
  }
  if(this.floods.some(f=>y>f.y+8))return true;
  return false;
 }
 lastStep(){return this.slashes[0]?.step??0;}
 private takeHit(id:string,x:number,y:number,w:number,h:number){
  for(const slash of this.slashes){
   if(slash.hits.has(id))continue;
   const sx=slash.x+(slash.facing>0?6:-slash.r-6),sy=slash.y-slash.r*.55;
   if(overlaps(sx,sy,slash.r,slash.r,x,y,w,h)){slash.hits.add(id);return slash.damage;}
  }
  for(const shot of this.shots){
   if(!shot.alive)continue;
   if(overlaps(shot.x-shot.r,shot.y-shot.r,shot.r*2,shot.r*2,x,y,w,h)){shot.alive=false;return 1;}
  }
  return 0;
 }
}

function slashArc(c:CanvasRenderingContext2D,slash:Slash,camera:number){
 const style=STYLES[slash.step]??STYLES[0];
 const u=slash.t/slash.life,fade=Math.max(0,1-u*u);
 const x=slash.x-camera,y=slash.y-4;
 c.save();c.translate(x,y);c.scale(slash.facing,1);
 const sweep=u*.55,start=style.start+sweep*.15,end=style.end+sweep*.35;
 const r=style.r*(.86+u*.1),thick=style.thick;
 c.lineCap='round';
 c.strokeStyle=`rgba(20,48,64,${.4*fade})`;c.lineWidth=thick+5;
 c.beginPath();c.arc(10,-4,r,start,end);c.stroke();
 c.shadowColor=slash.step===3?'#fff4c8':'#b8f0ff';c.shadowBlur=slash.step===3?16:10;
 c.strokeStyle=`rgba(255,255,255,${.95*fade})`;c.lineWidth=thick;
 c.beginPath();c.arc(12,-6,r,start,end);c.stroke();
 c.shadowBlur=0;
 c.strokeStyle=`rgba(170,230,255,${.75*fade})`;c.lineWidth=Math.max(1.4,thick*.35);
 c.beginPath();c.arc(14,-8,r*.92,start+.06,end-.04);c.stroke();
 const sparks=slash.step===3?8:5;
 for(let i=0;i<sparks;i++){
  const a=start+(end-start)*((i+.4)/sparks),px=12+Math.cos(a)*r,py=-6+Math.sin(a)*r;
  const len=5+((i*13+u*30)%7);
  c.strokeStyle=`rgba(255,255,255,${(.6-u*.3)*fade})`;c.lineWidth=1.2;
  c.beginPath();c.moveTo(px,py);c.lineTo(px+Math.cos(a)*len,py+Math.sin(a)*len-2);c.stroke();
 }
 if(slash.step===3){
  c.strokeStyle=`rgba(255,236,170,${.45*fade})`;c.lineWidth=2;
  c.beginPath();c.arc(8,-2,r*.42+u*10,0,Math.PI*2);c.stroke();
 }
 c.restore();
}

function drawFx(c:CanvasRenderingContext2D,fx:AttackFx,camera:number){
 const u=fx.t/fx.life,fade=1-u,x=fx.x-camera,y=fx.y;
 c.save();c.translate(x,y);c.scale(fx.facing,1);
 if(fx.kind==='bump'){
  const r=22+u*42;
  c.fillStyle=`rgba(255,60,40,${.22*fade})`;c.beginPath();c.arc(12,0,r,0,Math.PI*2);c.fill();
  c.strokeStyle=`rgba(255,50,40,${.95*fade})`;c.lineWidth=7;c.beginPath();c.arc(12,0,r,0,Math.PI*2);c.stroke();
  c.strokeStyle=`rgba(255,230,180,${.85*fade})`;c.lineWidth=3;c.beginPath();c.arc(12,0,r*.58,0,Math.PI*2);c.stroke();
 }
 if(fx.kind==='whip'){
  const start=-1.15,end=.75+u*.35,r=64+u*16;
  c.lineCap='round';c.shadowColor='#ffee88';c.shadowBlur=16;
  c.strokeStyle=`rgba(255,90,40,${.95*fade})`;c.lineWidth=10;c.beginPath();c.arc(8,-4,r,start,end);c.stroke();
  c.strokeStyle=`rgba(255,244,180,${fade})`;c.lineWidth=4;c.beginPath();c.arc(10,-6,r*.92,start,end);c.stroke();
 }
 if(fx.kind==='puff'){
  const r=24+u*34;
  const g=c.createRadialGradient(0,-8,2,0,-8,r);
  g.addColorStop(0,`rgba(255,244,160,${.9*fade})`);g.addColorStop(.45,`rgba(255,180,50,${.55*fade})`);g.addColorStop(1,`rgba(210,140,40,0)`);
  c.fillStyle=g;c.beginPath();c.arc(0,-8,r,0,Math.PI*2);c.fill();
 }
 if(fx.kind==='smash'){
  const r=(fx.r??36)+u*28;
  c.fillStyle=`rgba(210,40,70,${.35*fade})`;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();
  c.strokeStyle=`rgba(80,140,70,${.9*fade})`;c.lineWidth=5;
  for(let i=0;i<6;i++){
   const a=i*1.1+u;c.beginPath();c.moveTo(Math.cos(a)*8,Math.sin(a)*4);c.lineTo(Math.cos(a)*r,Math.sin(a)*r*.45);c.stroke();
  }
 }
 if(fx.kind==='wave'){
  const r=(fx.r??40)+u*160;
  c.strokeStyle=`rgba(80,160,255,${.85*fade})`;c.lineWidth=8;c.beginPath();c.arc(0,8,r,Math.PI,0);c.stroke();
  c.strokeStyle=`rgba(200,230,255,${.7*fade})`;c.lineWidth=3;c.beginPath();c.arc(0,8,r*.82,Math.PI,0);c.stroke();
 }
 if(fx.kind==='suck'){
  const r=(fx.r??80)*(1-u*.35);
  c.strokeStyle=`rgba(90,220,210,${.7*fade})`;c.lineWidth=3;
  for(let i=0;i<5;i++){
   const a=timeSpin(u)+i*1.2;
   c.beginPath();c.arc(0,0,r-i*10,a,a+1.6);c.stroke();
  }
 }
 c.restore();
}
function timeSpin(u:number){return u*8;}

let arrowImg:HTMLImageElement|undefined;
if(typeof Image!=='undefined'){
 const arrowLoad=new Image();
 arrowLoad.onload=()=>{arrowImg=arrowLoad;};
 arrowLoad.src=asset('assets/vfx/nangong-arrow.svg');
}

function drawArrow(c:CanvasRenderingContext2D,arrow:Arrow,camera:number){
 const x=arrow.x-camera,y=arrow.y;
 c.save();c.translate(x,y);c.rotate(arrow.angle+Math.PI/2);
 c.fillStyle='rgba(136,187,255,.28)';
 c.beginPath();c.ellipse(0,10,4,12,0,0,Math.PI*2);c.fill();
 if(arrowImg)c.drawImage(arrowImg,-7,-16,14,32);
 else{
  c.fillStyle='#88bbff';c.beginPath();c.moveTo(0,-14);c.lineTo(5,2);c.lineTo(-5,2);c.closePath();c.fill();
  c.fillStyle='#5588cc';c.fillRect(-1.5,2,3,14);
 }
 c.restore();
}

function drawMelon(c:CanvasRenderingContext2D,melon:Melon,camera:number){
 const x=melon.x-camera,y=melon.y;
 if(melon.phase==='burst'){
  const fade=1-melon.t/melon.life;
  c.fillStyle=`rgba(200,40,70,${.45*fade})`;c.beginPath();c.ellipse(x,y,22+melon.t*30,10,0,0,Math.PI*2);c.fill();
  return;
 }
 c.save();c.translate(x,y);
 if(melon.slice){
  c.rotate(melon.vx*.01);
  c.fillStyle='#1d3a16';c.beginPath();c.moveTo(0,-12);c.lineTo(14,8);c.lineTo(-14,8);c.closePath();c.fill();
  c.fillStyle='#e23a4a';c.beginPath();c.moveTo(0,-8);c.lineTo(10,6);c.lineTo(-10,6);c.closePath();c.fill();
 }else{
  c.fillStyle='#1f4a1c';c.beginPath();c.ellipse(0,0,15,13,0,0,Math.PI*2);c.fill();
  c.fillStyle='#5aaa3a';c.beginPath();c.ellipse(0,0,13,11,0,0,Math.PI*2);c.fill();
  c.strokeStyle='#2d6a28';c.lineWidth=2;
  c.beginPath();c.moveTo(-6,-8);c.quadraticCurveTo(-2,0,-6,8);c.stroke();
  c.beginPath();c.moveTo(5,-8);c.quadraticCurveTo(2,0,5,8);c.stroke();
 }
 c.restore();
}

function drawSpit(c:CanvasRenderingContext2D,shot:Shot,camera:number){
 const detach=Math.min(1,shot.age/.16),stretch=1.6-detach*.55;
 for(let i=0;i<shot.trail.length;i++){
  const t=shot.trail[i],u=i/shot.trail.length;
  c.fillStyle=`rgba(90,210,200,${.18+u*.4})`;
  c.beginPath();c.ellipse(t.x-camera,t.y,6+u*5,4+u*2.4,0,0,Math.PI*2);c.fill();
 }
 c.save();c.translate(shot.x-camera,shot.y);c.scale(shot.facing*stretch,1/Math.sqrt(stretch));
 const g=c.createLinearGradient(-12,-9,9,11);
 g.addColorStop(0,'#d8fff6');g.addColorStop(.55,'#5ad4d0');g.addColorStop(1,'#2a8eaa');
 c.fillStyle=g;c.beginPath();c.ellipse(0,0,13,10.5,0,0,Math.PI*2);c.fill();
 c.fillStyle='#174a59';c.beginPath();c.ellipse(-3.2,-1.2,1.6,2.1,0,0,Math.PI*2);c.ellipse(3.2,-1.2,1.6,2.1,0,0,Math.PI*2);c.fill();
 c.fillStyle='#f0fff4';c.beginPath();c.arc(-3.6,-1.8,.5,0,Math.PI*2);c.arc(2.8,-1.8,.5,0,Math.PI*2);c.fill();
 c.strokeStyle='#237385';c.lineWidth=1.1;c.lineCap='round';
 c.beginPath();c.moveTo(-2,3.2);c.quadraticCurveTo(0,4.6,2,3.2);c.stroke();
 c.restore();
}

export function drawCombat(c:CanvasRenderingContext2D,combat:CombatSystem,camera:number){
 for(const juice of combat.juices){
  const fade=juice.life/juice.max;
  c.fillStyle=`rgba(180,30,70,${.22*fade})`;
  c.beginPath();c.ellipse(juice.x-camera,juice.y+4,juice.r,10,0,0,Math.PI*2);c.fill();
  c.fillStyle=`rgba(255,90,120,${.18*fade})`;
  c.beginPath();c.ellipse(juice.x-camera,juice.y,juice.r*.7,6,0,0,Math.PI*2);c.fill();
 }
 for(const slash of combat.slashes)slashArc(c,slash,camera);
 for(const fx of combat.fx)drawFx(c,fx,camera);
 for(const shot of combat.shots)drawSpit(c,shot,camera);
 for(const melon of combat.melons)drawMelon(c,melon,camera);
 for(const arrow of combat.arrows)drawArrow(c,arrow,camera);
 for(const bolt of combat.bolts){
  const gx=bolt.x-camera,gy=bolt.y;
  const g=c.createRadialGradient(gx,gy,2,gx,gy,16);
  g.addColorStop(0,'#fff6c8');g.addColorStop(.4,'#f0a020');g.addColorStop(1,'#c0601000');
  c.fillStyle=g;c.beginPath();c.arc(gx,gy,16,0,Math.PI*2);c.fill();
  c.fillStyle='#ffe08a';c.beginPath();c.arc(gx,gy,7,0,Math.PI*2);c.fill();
 }
 for(const shard of combat.shards){
  c.save();c.translate(shard.x-camera,shard.y);c.rotate(shard.a);
  c.fillStyle=`rgba(70,130,60,${Math.min(1,shard.life*3)})`;
  c.fillRect(-5,-2,10,4);
  c.fillStyle=`rgba(220,50,70,${Math.min(1,shard.life*3)})`;
  c.fillRect(-4,-1,7,3);
  c.restore();
 }
 for(const spore of combat.spores){
  const g=c.createRadialGradient(spore.x-camera,spore.y,1,spore.x-camera,spore.y,16);
  g.addColorStop(0,'#fff4b0');g.addColorStop(.45,'#f0c45a');g.addColorStop(1,'#c47a2000');
  c.fillStyle=g;c.beginPath();c.arc(spore.x-camera,spore.y,16,0,Math.PI*2);c.fill();
  c.fillStyle='#ffe08a';c.beginPath();c.arc(spore.x-camera,spore.y,8,0,Math.PI*2);c.fill();
 }
 atlasFx.draw(c,combat.clips,camera);
 for(const puddle of combat.puddles){
  const fade=puddle.life/puddle.max;
  c.fillStyle=`rgba(60,180,70,${.22*fade})`;
  c.beginPath();c.ellipse(puddle.x-camera,puddle.y+4,puddle.r,10,0,0,Math.PI*2);c.fill();
 }
 for(const hawk of combat.hawks){
  c.fillStyle='#c8a060';c.beginPath();c.ellipse(hawk.x-camera,hawk.y,10,5,0,0,Math.PI*2);c.fill();
  c.fillStyle='#3a2a18';c.beginPath();c.arc(hawk.x-camera+6,hawk.y-2,3,0,Math.PI*2);c.fill();
 }
 for(const beam of combat.beams){
  const u=beam.t/beam.life;
  c.strokeStyle=`rgba(180,40,70,${.75*(1-u)})`;c.lineWidth=6;
  c.beginPath();c.moveTo(beam.x-camera,beam.y);c.lineTo(beam.tx-camera,beam.ty);c.stroke();
 }
 for(const ring of combat.rings){
  const rad=ring.r+ring.t*210,fade=1-ring.t/ring.life;
  c.strokeStyle=`rgba(230,200,90,${.8*fade})`;c.lineWidth=5;
  c.beginPath();c.arc(ring.x-camera,ring.y,rad,0,Math.PI*2);c.stroke();
 }
 for(const orbit of combat.orbits){
  const a=orbit.t*4.2,ox=orbit.x+Math.cos(a)*orbit.r,oy=orbit.y+Math.sin(a)*orbit.r*.45;
  c.fillStyle='#f6d56a';c.beginPath();c.arc(ox-camera,oy,14,0,Math.PI*2);c.fill();
 }
 for(const flood of combat.floods){
  const fade=.28*(1-flood.t/flood.life);
  c.fillStyle=`rgba(40,90,140,${fade})`;
  c.fillRect(-camera,flood.y,4000,900);
 }
 for(const item of combat.charges){
  c.fillStyle='rgba(255,80,50,.35)';c.beginPath();c.ellipse(item.x-camera,item.y,item.r,item.r*.6,0,0,Math.PI*2);c.fill();
 }
 for(const floater of combat.cues.floaters){
  const u=floater.life/floater.max;
  const x=floater.x-camera+floater.drift*(1-u);
  const y=floater.y-32*(1-u);
  c.save();
  c.globalAlpha=Math.max(0,u);
  c.font='700 17px "Noto Sans SC","Microsoft YaHei",sans-serif';
  c.textAlign='center';
  c.textBaseline='middle';
  c.lineWidth=3.2;
  c.strokeStyle='#22180caa';
  c.fillStyle=floater.kind==='hurt'?'#ff6a5c':floater.kind==='heal'?'#8ee0a8':'#ffc46b';
  c.strokeText(floater.text,x,y);
  c.fillText(floater.text,x,y);
  c.restore();
 }
}
