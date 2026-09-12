import type {Particle,Rect,SlimeSimulation} from './physics';
export interface Strand {group:number;ax:number;ay:number;bx:number;by:number;life:number;max:number}
export interface HoneyDrop {x:number;y:number;vx:number;vy:number;r:number;neck:number;life:number;kind:'ceiling'|'splash'}
export interface Crown {x:number;amp:number;life:number;max:number}
export interface Merge {x:number;y:number;r:number;life:number;max:number}
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const N=192;
/** Viscous height-field honey with a dense, smoothly sampled surface. */
export class HoneyPool {
 n=N;heights=Array<number>(N+1).fill(0);velocities=Array<number>(N+1).fill(0);
 strands:Strand[]=[];crowns:Crown[]=[];merges:Merge[]=[];
 film=new Map<number,number>();time=0;drops:HoneyDrop[]=[];
 particles:{x:number;y:number}[]=[];
 private contact=new WeakMap<Particle,boolean>();private cooldown=0;private wet=new Map<number,boolean>();private seed=411;
 constructor(public bounds:Rect,public drip=false,public spacing=8){
  this.bounds={...bounds,kind:'honey'};
  for(let x=bounds.x+8;x<bounds.x+bounds.w-6;x+=Math.max(10,spacing+4))this.particles.push({x,y:bounds.y+bounds.h*.45});
 }
 private random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
 private index(x:number){return clamp(Math.round((x-this.bounds.x)/this.bounds.w*this.n),1,this.n-1);}
 immerse(sim:SlimeSimulation,group:number){
  const b=this.bounds,body=sim.particles.filter(p=>p.group===group);if(!body.length)return 0;
  return body.filter(p=>p.x>b.x&&p.x<b.x+b.w&&p.y>b.y-4&&p.y<b.y+b.h).length/body.length;
 }
 impact(x:number,speed:number,scale=.55){
  const i=this.index(x),energy=Math.min(380,Math.abs(speed))*scale;
  for(let k=-16;k<=16;k++){
   if(i+k<=0||i+k>=this.n)continue;
   this.velocities[i+k]+=energy*.38*Math.exp(-k*k/36);
  }
  this.crowns.push({x,amp:Math.min(10,2.8+energy*.03),life:.7,max:.7});
  if(this.crowns.length>8)this.crowns.shift();
 }
 land(x:number,speed:number,r:number){
  this.impact(x,speed,.7);
  this.merges.push({x,y:this.bounds.y,r:Math.max(3.2,r*1.15),life:.4,max:.4});
  this.drops.push({x:x+(this.random()-.5)*10,y:this.bounds.y-2,vx:(this.random()-.5)*22,vy:-12-this.random()*14,r:1.6+this.random()*1.2,neck:.15,life:.8,kind:'splash'});
  if(this.drops.length>28)this.drops.splice(0,this.drops.length-28);
 }
 step(dt:number,sim:SlimeSimulation){
  this.time+=dt;const b=this.bounds,n=this.n;
  for(const g of sim.groups()){
   const c=sim.center(g),ps=sim.particles.filter(p=>p.group===g);
   const ratio=this.immerse(sim,g),wet=ratio>0.04;
   this.film.set(g,wet?1:Math.max(0,(this.film.get(g)??0)-dt*.7));
   if(this.wet.get(g)&&!wet&&c.vy<0){
    const bottom=Math.max(...ps.map(p=>p.y));
    for(let i=-1;i<=1;i++)this.strands.push({group:g,ax:clamp(c.x+i*14,b.x+6,b.x+b.w-6),ay:b.y+this.surfaceAt(c.x)+2,bx:c.x+i*10,by:bottom,life:.38+.18*(i===0?1:.6),max:.7});
   }
   this.wet.set(g,wet);
   const dragX=5.2*(.3+ratio),dragY=3.2*(.3+ratio);
   for(const p of ps){
    const immersed=p.x>b.x&&p.x<b.x+b.w&&p.y>b.y&&p.y<b.y+b.h;
    if(immersed){
     p.vx*=Math.exp(-dragX*dt);p.vy*=Math.exp(-dragY*dt);
     if(Math.abs(p.vx)>120)p.vx*=.92;
    }else if((this.film.get(g)??0)>0)p.vx*=Math.exp(-.9*(this.film.get(g)??0)*dt);
   }
  }
  this.strands=this.strands.filter(s=>{
   s.life-=dt;const c=sim.center(s.group);if(!Number.isFinite(c.x)||s.life<=0)return false;
   const body=sim.particles.filter(p=>p.group===s.group);
   s.bx=c.x;s.by=body.length?Math.max(...body.map(p=>p.y)):c.y+20;
   const len=Math.hypot(s.bx-s.ax,s.by-s.ay);
   if(len>100){this.drops.push({x:s.ax,y:s.ay-6,vx:0,vy:14,r:2.4,neck:0,life:1,kind:'splash'});return false;}
   const thin=clamp(1-len/100,0.15,1)*(s.life/s.max);
   for(const p of body)p.vy+=28*thin*dt;
   return true;
  });
  this.cooldown-=dt;let crossings=0,energy=0,hitX=0;
  for(const p of sim.particles){
   const inside=p.x>b.x&&p.x<b.x+b.w&&p.y>b.y;
   if(inside!==!!this.contact.get(p)&&p.x>b.x&&p.x<b.x+b.w&&Math.abs(p.vy)>22){crossings++;energy+=Math.abs(p.vy);hitX+=p.x;}
   this.contact.set(p,inside);
  }
  if(crossings>1&&this.cooldown<=0){this.impact(hitX/crossings,energy/Math.max(1,crossings),.55);this.cooldown=.1;}
  for(let i=1;i<n;i++)this.velocities[i]+=((this.heights[i-1]+this.heights[i+1]-2*this.heights[i])*220-this.heights[i]*7-this.velocities[i]*4.8)*dt;
  for(let i=1;i<n;i++)this.heights[i]=clamp(this.heights[i]+this.velocities[i]*dt,-14,14);
  for(const p of sim.particles){
   if(p.x<b.x||p.x>b.x+b.w||p.y<b.y-28||p.y>b.y+40)continue;
   const i=this.index(p.x);
   const push=clamp(p.vy,-50,50)*.007+clamp(p.y-b.y,-8,12)*.028;
   for(let k=-3;k<=3;k++)if(i+k>0&&i+k<n)this.velocities[i+k]+=push*Math.exp(-k*k/4);
  }
  if(this.drip){
   const beat=Math.floor(this.time/.85),prev=Math.floor((this.time-dt)/.85);
   if(beat!==prev){
    const sites=[.22,.48,.71];
    const t=sites[beat%sites.length];
    this.drops.push({x:b.x+b.w*t+Math.sin(this.time+beat)*10,y:22+((beat*13)%12),vx:(this.random()-.5)*3,vy:10,r:3.4+this.random()*1.4,neck:0,life:4.6,kind:'ceiling'});
   }
  }
  this.drops=this.drops.filter(d=>{
   const before=d.y;d.vy+=(d.kind==='ceiling'?180:280)*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.neck=clamp(d.neck+dt*(d.kind==='ceiling'?1.2:2),0,1);d.life-=dt;
   if(before<b.y&&d.y>=b.y&&d.vy>0){
    if(d.kind==='ceiling')this.land(d.x,d.vy,d.r);
    else {const i=this.index(d.x);this.velocities[i]+=d.vy*.05;}
    return false;
   }
   return d.life>0&&d.y<b.y+b.h+40;
  });
  this.crowns=this.crowns.filter(k=>{k.life-=dt;return k.life>0;});
  this.merges=this.merges.filter(m=>{m.life-=dt;m.r+=10*dt;m.y+=4*dt;return m.life>0;});
 }
 surfaceAt(x:number){
  const t=clamp((x-this.bounds.x)/this.bounds.w*this.n,0,this.n);
  const i=Math.min(this.n-1,Math.floor(t)),f=t-i;
  let y=this.heights[i]*(1-f)+this.heights[i+1]*f;
  for(const k of this.crowns){
   const u=(x-k.x)/38;
   y+=k.amp*(k.life/k.max)*Math.exp(-u*u);
  }
  return y;
 }
}
