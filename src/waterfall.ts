import type {Particle,Rect} from './physics';
import type {Drop} from './water';

export type FallCol={x0:number;x1:number;top:number;bot:number};
export type FallCut={y:number;x0:number;x1:number;t:number;ridge:{x:number;y:number}[];cols:FallCol[]};

/** Bright core of the painted ribbon — edges fade, so they should not count as a hit. */
export function fallCore(b:Rect){
 const pad=Math.max(4,Math.min(16,b.w*.16));
 return {x:b.x+pad,y:b.y,w:b.w-pad*2,h:b.h};
}

/** A falling curtain that a soft body can interrupt: only the strips that actually hit the body open. */
export class WaterfallSim {
 drops:Drop[]=[];
 cut:FallCut|null=null;
 /** True only on the frame the body first enters the curtain. */
 hit=false;
 private seed=911;
 private cooldown=0;
 constructor(public bounds:Rect){}
 private random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
 step(dt:number,ps:Particle[]){
  const core=fallCore(this.bounds);
  const bins=Math.max(4,Math.round(core.w/6));
  const top=Array(bins).fill(Infinity),bot=Array(bins).fill(-Infinity),n=Array(bins).fill(0);
  let hits=0;
  for(const p of ps){
   if(p.x<core.x||p.x>core.x+core.w||p.y<core.y||p.y>core.y+core.h)continue;
   const i=Math.min(bins-1,Math.max(0,Math.floor((p.x-core.x)/core.w*bins)));
   n[i]++;hits++;
   if(p.y<top[i])top[i]=p.y;
   if(p.y>bot[i])bot[i]=p.y;
   p.vy+=110*dt;p.vx*=1-.6*dt;
  }
  this.hit=false;
  if(hits>=3){
   const cols:FallCol[]=[];
   for(let i=0;i<bins;i++){
    if(n[i]<2)continue;
    cols.push({x0:core.x+i/bins*core.w,x1:core.x+(i+1)/bins*core.w,top:top[i],bot:bot[i]});
   }
   if(!cols.length){this.cut=null;return this.settleDrops(dt);}
   const fresh=!this.cut;
   const ridge=cols.map(col=>({x:(col.x0+col.x1)/2,y:col.top}));
   this.cut={y:cols[0].top,x0:cols[0].x0,x1:cols[cols.length-1].x1,t:(this.cut?.t??0)+dt,ridge,cols};
   for(const col of cols)if(col.top<this.cut.y)this.cut.y=col.top;
   if(fresh)this.hit=true;
   this.cooldown-=dt;
   if(this.cooldown<=0){
    this.cooldown=fresh?0:.045;
    const burst=fresh?18:5;
    for(let k=0;k<burst;k++){
     const pt=ridge[k%ridge.length],side=this.random()<.5?-1:1;
     this.drops.push({
      x:pt.x+(this.random()-.5)*4,
      y:pt.y-2,
      vx:side*(40+this.random()*(fresh?220:150)),
      vy:-(fresh?160:90)-this.random()*(fresh?220:140),
      r:1.1+this.random()*2.1,
      life:.9+this.random()*.5,
     });
    }
    if(this.drops.length>160)this.drops.splice(0,this.drops.length-160);
   }
  }else this.cut=null;
  this.settleDrops(dt);
 }
 private settleDrops(dt:number){
  const floor=this.bounds.y+this.bounds.h+30;
  this.drops=this.drops.filter(d=>{
   d.vy+=820*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.life-=dt;
   return d.life>0&&d.y<floor;
  });
 }
}
