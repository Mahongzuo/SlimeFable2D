export interface Rect { x:number; y:number; w:number; h:number; kind?:string; oneWay?:boolean }
export interface Particle { x:number;y:number;ox:number;oy:number;vx:number;vy:number;group:number;lambda:number;ground:boolean }
export interface Input {move:number;squeeze:boolean;jump:boolean;jumpHeld?:boolean;climb?:number}
const H=10.5, H2=H*H, SPACING=3.2, R=2.35;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const kernel=(r2:number)=>{if(r2>=H2)return 0;const u=1-r2/H2;return u*u*u;};
// Discrete rest density measured from an infinite, uniformly spaced 2D lattice.
const REST=(()=>{let d=0;for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++)d+=kernel((x*x+y*y)*SPACING*SPACING);return d;})();
const STRAY_GAP=88,STRAY_FAR=220,RECALL_WAIT=4;
type BodyCluster={coreC:{x:number;y:number;vx:number;vy:number;n:number};strayC:{x:number;y:number;vx:number;vy:number;n:number};stray:Set<Particle>};

export class SlimeSimulation {
 particles:Particle[]=[];
 activeGroup=0;
 solids:Rect[];
 water:Rect|null=null;
 time=0;
 private jumpCooldowns=new Map<number,number>();
 private groundedUntil=new Map<number,number>();
 private jumpStarted=new Map<number,number>();
 private jumps=new Map<number,number>();
 private wallUntil=new Map<number,number>();
 private walls=new Map<number,{side:number;edge:number}>();
 private squashed=new Map<number,boolean>();
 private jelly=new Map<number,{q:number;v:number;phase:number}>();
 climbing=false;
 recalled=false;
 private dropThrough=false;
 private neighbors:number[][]=[];
 private strayAcc=new Map<number,number>();
 private ghost=new Set<Particle>();
 private ghostUntil=0;
 private cachedAt=-1;
 private cached=new Map<number,BodyCluster>();
 constructor(x:number,y:number,solids:Rect[]){this.solids=solids;this.reset(x,y);}
 shift(dx:number,dy:number){
  for(const p of this.particles){p.x+=dx;p.y+=dy;p.ox+=dx;p.oy+=dy;p.vx*=.2;p.vy=Math.min(p.vy,40);}
  this.cached.clear();this.cachedAt=-1;
 }
 plant(x:number,y:number){
  const c=this.center();
  this.shift(x-c.x,y-c.y);
  for(const p of this.particles){p.vx*=.1;p.vy=0;p.oy=p.y-6;p.ground=true;}
 }
 reset(x:number,y:number){
  this.particles=[];this.activeGroup=0;this.jumpCooldowns.clear();this.groundedUntil.clear();this.jumpStarted.clear();this.jumps.clear();this.walls.clear();this.wallUntil.clear();this.squashed.clear();this.jelly.clear();
  this.strayAcc.clear();this.ghost.clear();this.ghostUntil=0;this.cached.clear();this.cachedAt=-1;this.recalled=false;
  for(let iy=-12;iy<=12;iy++)for(let ix=-12;ix<=12;ix++){
   if(ix*ix+iy*iy>144)continue;
   const px=x+ix*SPACING,py=y+iy*SPACING*.85;
   this.particles.push({x:px,y:py,ox:px,oy:py,vx:0,vy:0,group:0,lambda:0,ground:false});
  }
 }
 groups(){return [...new Set(this.particles.map(p=>p.group))];}
 center(group=this.activeGroup){return this.mean(this.particles.filter(p=>p.group===group));}
 flat(group=this.activeGroup){return !!this.squashed.get(group);}
 private mean(ps:Particle[]){
  let x=0,y=0,vx=0,vy=0;
  for(const p of ps){x+=p.x;y+=p.y;vx+=p.vx;vy+=p.vy;}
  const n=Math.max(1,ps.length);
  return {x:x/n,y:y/n,vx:vx/n,vy:vy/n,n:ps.length};
 }
 private blocked(ax:number,ay:number,bx:number,by:number){
  const minX=Math.min(ax,bx),maxX=Math.max(ax,bx),minY=Math.min(ay,by),maxY=Math.max(ay,by);
  const walls=this.solids.filter(r=>!r.oneWay&&r.kind!=='boundary'&&r.x<maxX&&r.x+r.w>minX&&r.y<maxY&&r.y+r.h>minY);
  if(!walls.length)return false;
  for(let t=0;t<=1;t+=.05){
   const x=ax+(bx-ax)*t,y=ay+(by-ay)*t;
   for(const r of walls)if(x>r.x&&x<r.x+r.w&&y>r.y&&y<r.y+r.h)return true;
  }
  return false;
 }
 private cluster(group:number):BodyCluster{
  const ps=this.particles.filter(p=>p.group===group);
  if(!ps.length)return {coreC:this.mean([]),strayC:this.mean([]),stray:new Set()};
  const xs=ps.map(p=>p.x).sort((a,b)=>a-b),ys=ps.map(p=>p.y).sort((a,b)=>a-b);
  const mx=xs[xs.length>>1],my=ys[ys.length>>1];
  const stray=new Set<Particle>();
  for(const p of ps){
   const d=Math.hypot(p.x-mx,p.y-my);
   if(d>STRAY_FAR||(d>STRAY_GAP&&this.blocked(p.x,p.y,mx,my)))stray.add(p);
  }
  const core=ps.filter(p=>!stray.has(p));
  return {coreC:this.mean(core.length?core:ps),strayC:this.mean(stray.size?[...stray]:core),stray};
 }
 private body(group:number){
  if(this.cachedAt!==this.time){this.cached.clear();this.cachedAt=this.time;}
  let found=this.cached.get(group);
  if(!found){found=this.cluster(group);this.cached.set(group,found);}
  return found;
 }
 private suck(group:number,chunk:BodyCluster){
  const c=chunk.coreC;let i=0;
  for(const p of chunk.stray){
   const a=i++*2.399;
   p.x=c.x+Math.cos(a)*10;p.y=c.y+Math.sin(a)*8;p.ox=p.x;p.oy=p.y;p.vx=0;p.vy=0;
   this.ghost.add(p);
  }
  this.ghostUntil=this.time+.25;this.recalled=true;this.cachedAt=-1;
 }
 private recallStrays(dt:number){
  if(this.time>=this.ghostUntil&&this.ghost.size)this.ghost.clear();
  for(const g of this.groups()){
   if(this.squashed.get(g)){this.strayAcc.set(g,0);continue;}
   const chunk=this.body(g);
   if(chunk.stray.size)this.strayAcc.set(g,(this.strayAcc.get(g)??0)+dt);
   else this.strayAcc.set(g,0);
   if((this.strayAcc.get(g)??0)>=RECALL_WAIT){this.suck(g,chunk);this.strayAcc.set(g,0);}
  }
 }
 lunge(facing:number,group=this.activeGroup){
  const c=this.center(group);
  for(const p of this.particles){
   if(p.group!==group)continue;
   const along=Math.max(0,(p.x-c.x)*facing);
    p.vx+=facing*(170+along*5.5);
    p.vy-=32+along*.9;
  }
  const j=this.jelly.get(group);if(j)j.v-=1.6;
 }
 chase(tx:number,ty:number,group=this.activeGroup){
  const c=this.center(group),dx=tx-c.x,dy=ty-c.y,d=Math.hypot(dx,dy)||1;
  const pull=Math.min(d,78);
  for(const p of this.particles){
   if(p.group!==group)continue;
   p.vx+=(dx/d)*pull*4.6;p.vy+=(dy/d)*pull*2.2-18;
  }
 }
 spit(facing:number,group=this.activeGroup){
  for(const p of this.particles){
   if(p.group!==group)continue;
   p.vx+=facing*-46;p.vy-=10;
  }
 }
 impactJelly(impulse=2.4,group=this.activeGroup){
  const j=this.jelly.get(group)??{q:0,v:0,phase:0};
  j.v-=impulse;this.jelly.set(group,j);
  const c=this.center(group);
  for(const p of this.particles){
   if(p.group!==group)continue;
   const dx=p.x-c.x,dy=p.y-c.y,d=Math.hypot(dx,dy)||1;
   p.vx+=(dx/d)*impulse*28;p.vy+=(dy/d)*impulse*16-impulse*10;
  }
 }
 dash(facing:number,group=this.activeGroup){
  const c=this.center(group);
  for(const p of this.particles){
   if(p.group!==group)continue;
   const along=Math.max(0,(p.x-c.x)*facing);
   p.vx+=facing*(340+along*4.2);p.vy-=28;
  }
  const j=this.jelly.get(group);if(j)j.v-=1.2;
 }
 switchGroup(){const g=this.groups();this.activeGroup=g.find(g=>g!==this.activeGroup)??g[0];}
 selectGroup(group:number){if(this.groups().includes(group))this.activeGroup=group;}
 split(){
  if(this.groups().length>1)return false;
  const ps=[...this.particles].sort((a,b)=>a.x-b.x);const mid=Math.floor(ps.length/2);
  for(let i=0;i<ps.length;i++){ps[i].group=i<mid?0:1;ps[i].vx+=(i<mid?-100:100);ps[i].vy-=85;}
  this.jumps.set(1,this.jumps.get(0)??0);this.activeGroup=1;return true;
 }
 merge(){
  if(this.groups().length!==2)return false;
  const a=this.center(0),b=this.center(1);
  if(Math.hypot(a.x-b.x,a.y-b.y)>118)return false;
  for(let t=0;t<=1;t+=.04){const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
   if(this.solids.some(r=>x>r.x&&x<r.x+r.w&&y>r.y&&y<r.y+r.h))return false;
  }
  for(const p of this.particles)p.group=0;
  this.activeGroup=0;return true;
 }
 private findNeighbors(){
  const grid=new Map<number,number[]>();
  for(let i=0;i<this.particles.length;i++){
   const p=this.particles[i],key=Math.floor(p.x/H)+Math.floor(p.y/H)*10000;
   const bucket=grid.get(key);if(bucket)bucket.push(i);else grid.set(key,[i]);
  }
  this.neighbors=this.particles.map(p=>{
   const out:number[]=[],cx=Math.floor(p.x/H),cy=Math.floor(p.y/H);
   for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){
    const bucket=grid.get(cx+x+(cy+y)*10000);if(!bucket)continue;
    for(const j of bucket){const q=this.particles[j];if((p.x-q.x)**2+(p.y-q.y)**2<H2)out.push(j);}
   }return out;
  });
 }
 private collide(p:Particle){
  if(this.ghost.has(p)&&this.time<this.ghostUntil)return;
  for(const s of this.solids){
   if(s.oneWay){
    if(this.dropThrough&&p.group===this.activeGroup)continue;
    const top=s.y-R;
    if(p.vy>=0&&p.x>s.x&&p.x<s.x+s.w&&p.oy<=top+.01&&p.y>=top){p.y=top;p.ground=true;}
    continue;
   }
   const l=s.x-R,r=s.x+s.w+R,t=s.y-R,b=s.y+s.h+R;
   if(p.x<=l||p.x>=r||p.y<=t||p.y>=b)continue;
   const dl=p.x-l,dr=r-p.x,dt=p.y-t,db=b-p.y,m=Math.min(dl,dr,dt,db);
   if(m===dt){p.y=t;p.ground=true;}
   else if(m===dl)p.x=l;else if(m===dr)p.x=r;else p.y=b;
  }
 }
 step(dt:number,input:Input){
  this.time+=dt;
  this.recallStrays(dt);
  const onOneWay=this.particles.some(p=>p.group===this.activeGroup&&p.ground&&this.solids.some(s=>s.oneWay&&p.x>s.x&&p.x<s.x+s.w&&p.y>=s.y-R-4&&p.y<=s.y+s.h));
  this.dropThrough=(!!input.squeeze||(input.climb??0)<0)&&onOneWay;
  const groups=this.groups(),centers=new Map(groups.map(g=>[g,this.center(g)]));
  const groundedGroups=new Set(this.particles.filter(p=>p.ground).map(p=>p.group));
  const constrained=new Map<number,boolean>();
  for(const g of groups){
   const ps=this.particles.filter(p=>p.group===g),c=centers.get(g)!;
   // Detect a ceiling across any part of the body, not just its center.
   const roof=ps.some(p=>this.solids.some(r=>!r.oneWay&&r.kind!=='boundary'&&p.x>r.x-12&&p.x<r.x+r.w+12&&r.y+r.h<=p.y+4&&p.y-(r.y+r.h)<36));
   if(roof&&input.squeeze&&g===this.activeGroup)this.squashed.set(g,true);
   constrained.set(g,roof&&!!this.squashed.get(g));
   if(!roof&&this.squashed.get(g)){
    // A fully flattened particle layer has no vertical density gradient to lift it.
    // Seed an upward recovery impulse; PBF then redistributes volume continuously.
    const minX=Math.min(...ps.map(p=>p.x)),maxX=Math.max(...ps.map(p=>p.x)),half=(maxX-minX)*.5;
    for(const p of ps)p.vy-=200*Math.max(0,1-Math.abs(p.x-c.x)/Math.max(half,1));
   }
   if(!roof)this.squashed.set(g,false);
   let wall:{side:number;edge:number}|undefined;
   for(const r of this.solids){if(r.oneWay||r.kind==='boundary'||r.kind==='gate'||c.y<r.y-12||c.y>r.y+r.h+8)continue;
    if(ps.some(p=>p.y>r.y-4&&p.y<r.y+r.h&&Math.abs(p.x-(r.x-R))<9)&&c.x<r.x)wall={side:1,edge:r.x-R};
    if(ps.some(p=>p.y>r.y-4&&p.y<r.y+r.h&&Math.abs(p.x-(r.x+r.w+R))<9)&&c.x>r.x+r.w)wall={side:-1,edge:r.x+r.w+R};
   }
   if(wall&&g===this.activeGroup&&(input.move===wall.side||!!input.climb||this.time<(this.wallUntil.get(g)??0))&&!constrained.get(g)&&this.time-(this.jumpStarted.get(g)??-99)>.22){this.walls.set(g,wall);this.wallUntil.set(g,this.time+(input.climb?1:.15));}
   if(g===this.activeGroup&&this.walls.has(g)&&input.move===-this.walls.get(g)!.side)this.wallUntil.set(g,0);
   const j=this.jelly.get(g)??{q:0,v:0,phase:0};
   const moving=g===this.activeGroup&&Math.abs(input.move)>0&&groundedGroups.has(g)&&!roof;
   j.phase+=dt*(7+Math.abs(c.vx)*.028);
   j.v+=(-85*j.q-5*j.v+(moving?Math.sin(j.phase)*17:0))*dt;j.q=clamp(j.q+j.v*dt,-.2,.2);this.jelly.set(g,j);
  }
  let touching=0;
  for(const p of this.particles)if(p.group===this.activeGroup&&p.ground)touching++;
  // Contact grace belongs to a body, never to whichever body is selected next.
  for(const group of groups){const body=this.particles.filter(p=>p.group===group),contact=body.filter(p=>p.ground).length/body.length;if(contact>.035&&(centers.get(group)?.vy??0)>=-40&&this.time-(this.jumpStarted.get(group)??-99)>.18){this.groundedUntil.set(group,this.time+.10);this.jumps.set(group,0);}}
  const center=centers.get(this.activeGroup)!;
  const wet=!!this.water&&center.x>this.water.x&&center.x<this.water.x+this.water.w&&center.y>this.water.y-15;
  const wall=this.walls.get(this.activeGroup),attached=this.time<(this.wallUntil.get(this.activeGroup)??0)&&!!wall;
  this.climbing=attached;
  const jump=input.jump&&this.time>=(this.jumpCooldowns.get(this.activeGroup)??0)&&((this.jumps.get(this.activeGroup)??0)<2||wet||attached);
  if(jump){this.jumps.set(this.activeGroup,(this.jumps.get(this.activeGroup)??0)+1);this.jumpCooldowns.set(this.activeGroup,this.time+.14);this.groundedUntil.set(this.activeGroup,0);this.jumpStarted.set(this.activeGroup,this.time);this.wallUntil.set(this.activeGroup,0);const j=this.jelly.get(this.activeGroup)!;j.v-=2;}
  for(const p of this.particles){
   const c=centers.get(p.group)!,active=p.group===this.activeGroup,squeeze=!!constrained.get(p.group);
   p.ox=p.x;p.oy=p.y;
   const cohesion=squeeze?6.5:105;
   p.vx+=(c.x-p.x)*cohesion*dt;
   p.vy+=((c.y-p.y)*cohesion+1280)*dt;
   const dx=p.x-c.x,dy=p.y-c.y,spread=Math.sqrt(c.n/441),extent=47*spread;
   // Non-rigid elastoplastic recovery: outer tails retract while density protects volume.
   if(!squeeze){
    const excess=Math.max(0,Math.abs(dx)-extent);p.vx-=Math.sign(dx)*excess*180*dt;
    const j=this.jelly.get(p.group)!;p.vx+=dx*j.q*100*dt;p.vy-=dy*j.q*100*dt;
   }
   if(active){
    p.vx+=(input.move*(squeeze?155:230)-c.vx)*(input.move?8:touching?12:1.8)*dt;
    if(squeeze)p.vy+=220*dt;
    if(attached&&!jump){p.vx+=(wall!.side*95-c.vx)*12*dt;p.vy+=((input.climb??0)*125-c.vy)*22*dt-1280*dt;}
    if(jump){p.vy=(this.water?.kind==='honey'?-420:-490)+(p.y-c.y)*3.8;if(attached)p.vx=-wall!.side*240;}
    else if(input.jumpHeld&&p.vy<0&&this.time-(this.jumpStarted.get(p.group)??-100)<.18)p.vy-=(this.water?.kind==='honey'?360:500)*dt;
   }else p.vx-=c.vx*(groundedGroups.has(p.group)?10:1.8)*dt;
   if(this.water&&p.x>this.water.x&&p.x<this.water.x+this.water.w&&p.y>this.water.y&&p.y<this.water.y+this.water.h+48){
    if(this.water.kind==='honey'){
     p.vy-=1580*dt;p.vx*=.968;p.vy*=.96;
     if(Math.abs(p.vx)>140)p.vx*=.93;
     if(active&&input.squeeze)p.vy+=980*dt;
    }else{
     p.vy-=1700*dt;p.vx*=.993;p.vy*=.984;
     if(active&&input.squeeze)p.vy+=1100*dt;
    }
   }
   p.vx=clamp(p.vx,-600,600);p.vy=clamp(p.vy,-700,750);
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.ground=false;this.collide(p);
  }
  this.findNeighbors();
  // PBF density constraints: lambda_i = -C_i / (sum |grad C_i|² + epsilon).
  // Only positive pressure is projected; cohesion supplies the free-surface tension.
  for(let iteration=0;iteration<4;iteration++){
   for(let i=0;i<this.particles.length;i++){
    const p=this.particles[i];let density=0,gx=0,gy=0,denom=0;
    for(const j of this.neighbors[i]){
     const q=this.particles[j],dx=p.x-q.x,dy=p.y-q.y,r2=dx*dx+dy*dy;
     density+=kernel(r2);if(i===j||r2>=H2)continue;
     const u=1-r2/H2,f=-6/H2*u*u/REST,x=f*dx,y=f*dy;
     gx+=x;gy+=y;denom+=x*x+y*y;
    }
    p.lambda=-Math.max(density/REST-1,0)/(denom+gx*gx+gy*gy+.003);
   }
   const corrections=this.particles.map((p,i)=>{
    let x=0,y=0;
    for(const j of this.neighbors[i]){
     if(j===i)continue;const q=this.particles[j],dx=p.x-q.x,dy=p.y-q.y,r2=dx*dx+dy*dy;
     if(r2>=H2)continue;
     const u=1-r2/H2,f=(p.lambda+q.lambda)*(-6/H2*u*u/REST);
     x+=f*dx;y+=f*dy;
    }return {x:clamp(x,-2,2),y:clamp(y,-2,2)};
   });
   this.particles.forEach((p,i)=>{p.x+=corrections[i].x;p.y+=corrections[i].y;this.collide(p);});
  }
  for(const p of this.particles){p.vx=(p.x-p.ox)/dt;p.vy=(p.y-p.oy)/dt;}
  // XSPH velocity smoothing damps internal noise without pinning a rest shape.
  const velocities=this.particles.map((p,i)=>{
   let x=0,y=0,total=0;
   for(const j of this.neighbors[i]){const q=this.particles[j];if(q.group!==p.group)continue;
    const w=kernel((p.x-q.x)**2+(p.y-q.y)**2);x+=(q.vx-p.vx)*w;y+=(q.vy-p.vy)*w;total+=w;
   }
   return {x:p.vx+x/Math.max(total,1)*.045,y:p.vy+y/Math.max(total,1)*.045};
  });
  this.particles.forEach((p,i)=>{p.vx=velocities[i].x*.999;p.vy=velocities[i].y*.999;});
 }
}
