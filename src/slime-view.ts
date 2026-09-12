import { type Particle, type SlimeSimulation } from './physics';
type Point={x:number;y:number};
const CASES:number[][]=[[],[3,0],[0,1],[3,1],[1,2],[3,0,1,2],[0,2],[3,2],[2,3],[2,0],[0,1,2,3],[2,1],[1,3],[1,0],[0,3],[]];

/** Marching squares on the simulated particle density, not an animated sprite. */
function surface(particles:Particle[],camera:number){
 const minX=Math.min(...particles.map(p=>p.x))-17,minY=Math.min(...particles.map(p=>p.y))-17;
 const maxX=Math.max(...particles.map(p=>p.x))+17,maxY=Math.max(...particles.map(p=>p.y))+17;
 let cell=1.25;if((maxX-minX)*(maxY-minY)>90000)cell=2.4;
 const nx=Math.ceil((maxX-minX)/cell)+1,ny=Math.ceil((maxY-minY)/cell)+1;
 const field=new Float32Array(nx*ny),radius=16,rr=radius*radius;
 for(const p of particles){
  const x0=Math.max(0,Math.floor((p.x-radius-minX)/cell)),x1=Math.min(nx-1,Math.ceil((p.x+radius-minX)/cell));
  const y0=Math.max(0,Math.floor((p.y-radius-minY)/cell)),y1=Math.min(ny-1,Math.ceil((p.y+radius-minY)/cell));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const d2=(minX+x*cell-p.x)**2+(minY+y*cell-p.y)**2;
   if(d2<rr){const u=1-d2/rr;field[y*nx+x]+=u*u*u;}
  }
 }
 const points=new Map<number,Point>(),links=new Map<number,number[]>(),iso=6.5,base=nx*ny;
 for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){
  const values=[field[y*nx+x],field[y*nx+x+1],field[(y+1)*nx+x+1],field[(y+1)*nx+x]];
  const code=values.reduce((a,v,i)=>a+(v>iso?1<<i:0),0),edges=CASES[code];if(!edges.length)continue;
  const ids=[y*nx+x,base+y*nx+x+1,(y+1)*nx+x,base+y*nx+x];
  const corners=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]];
  for(const edge of edges){const id=ids[edge];if(points.has(id))continue;
   const next=(edge+1)%4,t=(iso-values[edge])/(values[next]-values[edge]);
   points.set(id,{x:minX+(corners[edge][0]+(corners[next][0]-corners[edge][0])*t)*cell-camera,y:minY+(corners[edge][1]+(corners[next][1]-corners[edge][1])*t)*cell});
  }
  for(let i=0;i<edges.length;i+=2){const a=ids[edges[i]],b=ids[edges[i+1]];links.set(a,[...(links.get(a)??[]),b]);links.set(b,[...(links.get(b)??[]),a]);}
 }
 const visited=new Set<number>(),path=new Path2D();
 for(const start of points.keys()){
  if(visited.has(start))continue;const loop:Point[]=[];let id=start,prev=-1;
  for(let limit=0;limit<points.size;limit++){
   if(visited.has(id))break;visited.add(id);loop.push(points.get(id)!);
   const next=links.get(id)?.find(n=>n!==prev);if(next===undefined)break;prev=id;id=next;
  }
  if(loop.length<3)continue;
  const last=loop.at(-1)!,first=loop[0];path.moveTo((last.x+first.x)/2,(last.y+first.y)/2);
  for(let i=0;i<loop.length;i++){const p=loop[i],n=loop[(i+1)%loop.length];path.quadraticCurveTo(p.x,p.y,(p.x+n.x)/2,(p.y+n.y)/2);}path.closePath();
 }
 return {path,x:minX-camera,y:minY,w:maxX-minX,h:maxY-minY};
}

export function drawSlime(c:CanvasRenderingContext2D,sim:SlimeSimulation,camera:number,time:number,debug=false,films?:Map<number,number>){
 const groups=sim.groups(),a=sim.center(groups[0]),b=groups.length>1?sim.center(groups[1]):null;
 const clusters=b&&Math.hypot(a.x-b.x,a.y-b.y)>115?groups.map(g=>sim.particles.filter(p=>p.group===g)):[sim.particles];
 for(const raw of clusters){
  const cx=raw.reduce((a,p)=>a+p.x,0)/raw.length,cy=raw.reduce((a,p)=>a+p.y,0)/raw.length;
  const ps=raw.filter(p=>Math.hypot(p.x-cx,p.y-cy)<82);
  const body=ps.length>raw.length*.5?ps:raw;
  if(body.every(p=>p.x-camera< -100||p.x-camera>1380))continue;
  const s=surface(body,camera),ground=body.filter(p=>p.ground);
  if(ground.length){const gx=ground.reduce((a,p)=>a+p.x,0)/ground.length-camera,gy=ground.reduce((a,p)=>a+p.y,0)/ground.length+4;
   c.fillStyle='#193c4433';c.beginPath();c.ellipse(gx,gy,s.w*.42,5,0,0,Math.PI*2);c.fill();}
  c.save();
  const fill=c.createLinearGradient(s.x,s.y,s.x+s.w*.5,s.y+s.h);fill.addColorStop(0,'#c4fff2');fill.addColorStop(.2,'#92f0e7');fill.addColorStop(.56,'#52c9d2e8');fill.addColorStop(1,'#2590abe8');
  c.fillStyle=fill;c.fill(s.path);c.strokeStyle='#277f9277';c.lineWidth=1.7;c.stroke(s.path);
  const film=films?.get(body[0]?.group??0)??0;
  if(film>0){c.save();c.clip(s.path);c.fillStyle=`rgba(216,134,32,${.2*film})`;c.fillRect(s.x,s.y,s.w,s.h);c.restore();}
  c.save();c.clip(s.path);
  // Depth gradient, moving internal bubbles and surface-attached rim highlights.
  const light=c.createRadialGradient(s.x+s.w*.35,s.y+s.h*.3,2,s.x+s.w*.35,s.y+s.h*.3,s.w*.7);light.addColorStop(0,'#e3fff33d');light.addColorStop(.6,'#a7f8f100');light.addColorStop(1,'#08638744');c.fillStyle=light;c.fillRect(s.x,s.y,s.w,s.h);
  c.translate(2,3);c.strokeStyle='#d8fff0b8';c.lineWidth=3;c.stroke(s.path);c.translate(-2,-3);
  for(let i=0;i<5;i++){
   const p=body[(i*31+17)%body.length],x=p.x-camera+Math.sin(time+i)*2,y=p.y+Math.cos(time*.6+i)*3,rr=1.7+i%3;
   c.strokeStyle='#c7fff36b';c.lineWidth=.9;c.beginPath();c.arc(x,y,rr,0,Math.PI*2);c.stroke();c.fillStyle='#e0fff555';c.beginPath();c.arc(x-.7,y-1,rr*.32,0,Math.PI*2);c.fill();
  }
  c.fillStyle='#effff4a6';c.beginPath();c.ellipse(s.x+s.w*.29,s.y+s.h*.24,s.w*.105,s.h*.055,-.55,0,Math.PI*2);c.fill();
  c.fillStyle='#effff478';c.beginPath();c.ellipse(s.x+s.w*.46,s.y+s.h*.16,s.w*.03,s.h*.025,0,0,Math.PI*2);c.fill();
  c.restore();c.restore();
 }
 for(const group of groups){
  const ps=sim.particles.filter(p=>p.group===group),center=sim.center(group),x=center.x-camera,y=center.y;
  const height=Math.max(...ps.map(p=>p.y))-Math.min(...ps.map(p=>p.y));if(height<22)continue;
  const active=group===sim.activeGroup,small=groups.length>1,scale=small?.78:1,look=Math.max(-2,Math.min(2,center.vx*.012));
  const blink=Math.sin(time*.8+group*3)>.997;
  c.save();c.translate(x,y+3);c.scale(scale,scale);
  for(const side of [-1,1]){c.fillStyle=active?'#174a59':'#296174';c.beginPath();c.ellipse(side*11+look,-2,2.7,blink?.65:4.1,0,0,Math.PI*2);c.fill();if(!blink){c.fillStyle='#f0fff4';c.beginPath();c.arc(side*11+look-.7,-3.4,.85,0,Math.PI*2);c.fill();}}
  c.strokeStyle='#237385';c.lineWidth=1.6;c.lineCap='round';c.beginPath();c.moveTo(-3.5,5);c.quadraticCurveTo(0,8,3.5,5);c.stroke();
  c.fillStyle='#b2f4e88a';for(const side of [-1,1]){c.beginPath();c.ellipse(side*17,5,4,1.8,0,0,Math.PI*2);c.fill();}c.restore();
  if(groups.length>1){c.fillStyle=active?'#f1ffe2':'#6c9483';c.beginPath();c.arc(x,y-height/2-19,9,0,Math.PI*2);c.fill();c.fillStyle=active?'#26584b':'#f1ffe2';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText(String(group+1),x,y-height/2-15);}
 }
 if(debug){c.fillStyle='#10384c99';for(const p of sim.particles){c.beginPath();c.arc(p.x-camera,p.y,1.25,0,Math.PI*2);c.fill();}}
}
