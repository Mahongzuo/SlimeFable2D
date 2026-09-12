import type {Particle,Rect} from './physics';
export interface Drop {x:number;y:number;vx:number;vy:number;r:number;life:number}
/** Damped wave equation with impact-driven spray, displacement and returning drops. */
export class WaterSimulation {
 heights=Array<number>(97).fill(0);velocities=Array<number>(97).fill(0);drops:Drop[]=[];
 private contact=new WeakMap<Particle,boolean>();private cooldown=0;private seed=193;
 constructor(public bounds:Rect){}
 private random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
 impact(x:number,speed:number,scale=.6){
  const i=Math.round((x-this.bounds.x)/this.bounds.w*96),energy=Math.min(500,Math.abs(speed))*scale;
  for(let k=-5;k<=5;k++)if(i+k>0&&i+k<96)this.velocities[i+k]+=energy*.65*Math.exp(-k*k/9);
  if(energy<45)return;
  for(let k=0;k<Math.min(42,12+Math.floor(energy/15));k++)this.drops.push({x:x+(this.random()-.5)*28,y:this.bounds.y-2,vx:(this.random()-.5)*energy*.95,vy:-70-this.random()*energy*.9,r:1.2+this.random()*2.6,life:2.5});
  if(this.drops.length>180)this.drops.splice(0,this.drops.length-180);
 }
 step(dt:number,ps:Particle[]){
  this.cooldown-=dt;let crossings=0,energy=0,x=0;
  for(let i=0;i<ps.length;i++){
   const p=ps[i],inside=p.x>this.bounds.x&&p.x<this.bounds.x+this.bounds.w&&p.y>this.bounds.y;
   if(inside!==!!this.contact.get(p)&&p.x>this.bounds.x&&p.x<this.bounds.x+this.bounds.w&&Math.abs(p.vy)>45){crossings++;energy+=Math.abs(p.vy);x+=p.x;}
   this.contact.set(p,inside);
  }
  if(crossings>2&&this.cooldown<=0){this.impact(x/crossings,energy/crossings,.8);this.cooldown=.085;}
  const dx=this.bounds.w/96;
  for(let i=1;i<96;i++)this.velocities[i]+=((this.heights[i-1]+this.heights[i+1]-2*this.heights[i])*700-this.heights[i]*18-this.velocities[i]*2.8)*dt;
  for(let i=1;i<96;i++)this.heights[i]=Math.max(-22,Math.min(22,this.heights[i]+this.velocities[i]*dt));
  for(const p of ps){if(p.x<this.bounds.x||p.x>this.bounds.x+this.bounds.w||Math.abs(p.y-this.bounds.y)>14)continue;const i=Math.round((p.x-this.bounds.x)/dx);if(i>0&&i<96)this.velocities[i]+=Math.max(-90,Math.min(90,p.vy))*.006;}
  this.drops=this.drops.filter(d=>{
   const before=d.y;d.vy+=780*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.life-=dt;
   if(before<this.bounds.y&&d.y>=this.bounds.y&&d.vy>0){const i=Math.round((d.x-this.bounds.x)/dx);if(i>0&&i<96)this.velocities[i]+=d.vy*.08;return false;}return d.life>0;
  });
 }
}
