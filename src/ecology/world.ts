import type {Rect,SlimeSimulation} from '../physics';
import {FLY_KINDS} from './content';
import type {EcoChallenge, EcoEvent, EcoObject, EcologyLayout, EcoBiome, FaunaSpot} from './types';

export type EcoSignal={type:'interact'|'event'|'challenge'|'timeout'|'blocked';id:string;x:number;y:number;text?:string};
type ChallengeState={index:number;elapsed:number;started:boolean;done:boolean};

function near(sim:SlimeSimulation,object:EcoObject){
 return sim.particles.some(p=>p.group===sim.activeGroup&&Math.hypot(p.x-object.x,p.y-object.y)<72);
}

export class EcoWorld{
 readonly objects:EcoObject[];
 readonly events:EcoEvent[];
 readonly challenges:EcoChallenge[];
 readonly fauna:FaunaSpot[];
 readonly biomes:EcoBiome[];
 readonly completed=new Set<string>();
 readonly touchedBy=new Map<string,number>();
 readonly challengeStates=new Map<string,ChallengeState>();
 readonly signals:EcoSignal[]=[];
 prompt='';
 private finished=false;

 constructor(layout:EcologyLayout={}){
  this.objects=layout.interactables?.map(o=>({...o,needs:o.needs?[...o.needs]:undefined,target:o.target?{...o.target}:undefined,platform:o.platform?{...o.platform}:undefined}))??[];
  this.events=layout.events?.map(e=>({...e,objects:[...e.objects]}))??[];
  this.challenges=layout.challenges?.map(c=>({...c,points:c.points.map(p=>({...p}))}))??[];
  this.fauna=layout.fauna?.map(f=>({...f,target:f.target?{...f.target}:undefined}))??[];
  this.biomes=layout.biomes?.map(b=>({...b}))??[];
  for(const c of this.challenges)this.challengeStates.set(c.id,{index:0,elapsed:0,started:false,done:false});
 }

 private missing(object:EcoObject){
  return object.needs?.filter(id=>!this.completed.has(id))??[];
 }

 private orderedWait(object:EcoObject){
  const ordered=this.events.find(event=>event.kind==='ordered'&&event.objects.includes(object.id));
  if(!ordered)return '';
  const next=ordered.objects.find(id=>!this.completed.has(id));
  return next&&next!==object.id?'还没轮到这个':''
 }

 legal(object:EcoObject){
  if(this.completed.has(object.id))return false;
  if(this.missing(object).length)return false;
  return !this.orderedWait(object);
 }

 private blockedText(object:EcoObject){
  const miss=this.missing(object);
  if(miss.length){
   const name=this.objects.find(o=>o.id===miss[0]);
   return name?.text?`还不行 · 先去做：${name.text.replace(/^按 F /,'')}`:'还缺前面的一步';
  }
  return this.orderedWait(object)||'现在还不能互动';
 }

 questLines(){
  return this.events.map(event=>{
   const have=event.objects.filter(id=>this.completed.has(id)).length;
   return {id:event.id,title:event.title,have,need:event.objects.length,done:this.completed.has(event.id)};
  });
 }

 update(dt:number,sim:SlimeSimulation,allowInteraction=true){
  if(!Number.isFinite(dt)||dt<0)return;
  if(this.finished)return;
  this.prompt='';
  const nearby=this.objects.filter(o=>near(sim,o)&&!this.completed.has(o.id));
  const ready=nearby.find(o=>this.legal(o));
  const blocked=nearby.find(o=>!this.legal(o));
  if(ready)this.prompt=ready.text||'按 F 互动';
  else if(blocked)this.prompt=this.blockedText(blocked);
  if(allowInteraction){
   if(ready)this.markObject(ready,sim);
   else if(blocked)this.signals.push({type:'blocked',id:blocked.id,x:blocked.x,y:blocked.y,text:this.blockedText(blocked)});
   for(const object of this.objects){
    if(!this.completed.has(object.id)||!near(sim,object))continue;
    this.touchedBy.set(object.id,sim.activeGroup);
   }
  }
  this.updateEvents();
  this.updateChallenges(dt,sim);
 }

 private markObject(object:EcoObject,sim:SlimeSimulation){
  if(this.completed.has(object.id))return;
  this.completed.add(object.id);
  this.touchedBy.set(object.id,sim.activeGroup);
  this.signals.push({type:'interact',id:object.id,x:object.x,y:object.y,text:object.text});
 }

 private updateEvents(){
  for(const event of this.events){
   if(this.completed.has(event.id))continue;
   const available=event.objects.every(id=>this.completed.has(id));
   if(!available)continue;
   if(event.kind==='ordered' && event.objects.some(id=>!this.completed.has(id)))continue;
   if(event.kind==='split-merge'){
    const groups=new Set(event.objects.map(id=>this.touchedBy.get(id)));
    if(groups.size<2)continue;
   }
   this.completed.add(event.id);
   const point=this.objects.find(o=>event.objects.includes(o.id));
   this.signals.push({type:'event',id:event.id,x:point?.x??0,y:point?.y??0,text:event.text});
   this.settleFauna(event);
  }
 }

 private settleFauna(event:EcoEvent){
  for(const f of this.fauna){
   if(!f.follow)continue;
   const hit=this.completed.has(f.follow)||f.follow===event.id||event.objects.includes(f.follow)
    ||this.objects.some(o=>o.kind===f.follow&&this.completed.has(o.id));
   if(!hit)continue;
   const o=this.objects.find(o=>o.id===f.follow)||this.objects.find(o=>o.kind===f.follow&&event.objects.includes(o.id))||this.objects.find(o=>event.objects.includes(o.id));
   if(!o)continue;
   f.target={x:o.x+32,y:o.y-(FLY_KINDS.has(f.kind)?80:0)};
  }
 }

 private updateChallenges(dt:number,sim:SlimeSimulation){
  for(const challenge of this.challenges){
   const state=this.challengeStates.get(challenge.id)!;
   if(state.done)continue;
   state.elapsed+=dt;
   if(state.elapsed>challenge.limit){state.index=0;state.elapsed=0;state.started=false;this.signals.push({type:'timeout',id:challenge.id,x:0,y:0});continue;}
   const point=challenge.points[state.index];
   if(!point)continue;
   if(Math.hypot(sim.center().x-point.x,sim.center().y-point.y)>Math.max(56,point.r??56))continue;
   state.started=true;state.index++;
   if(state.index>=challenge.points.length){state.done=true;this.completed.add(challenge.id);this.signals.push({type:'challenge',id:challenge.id,x:point.x,y:point.y});}
  }
 }

 rewind(){
  for(const challenge of this.challenges){const state=this.challengeStates.get(challenge.id);if(state&&!state.done){state.index=0;state.elapsed=0;state.started=false;}}
 }

 revealedPlatforms(){
  const extra:Rect[]=[];
  for(const o of this.objects)if(this.completed.has(o.id)&&o.platform)extra.push(o.platform);
  for(const event of this.events){
   if(!this.completed.has(event.id))continue;
   const pts=event.objects.map(id=>this.objects.find(o=>o.id===id)).filter((o):o is EcoObject=>!!o);
   if(pts.length<2)continue;
   const a=pts[0],b=pts[1];
   const left=Math.min(a.x,b.x)+28,right=Math.max(a.x,b.x)-28,w=right-left;
   if(w>=90&&w<=380)extra.push({x:left,y:Math.min(a.y,b.y)-6,w,h:14,kind:'branch',oneWay:true});
  }
  return extra;
 }

 drainSignals():EcoSignal[]{return this.signals.splice(0,this.signals.length);}

 finish(){this.finished=true;}
}
