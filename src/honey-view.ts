import type {HoneyPool} from './honey';
type C=CanvasRenderingContext2D;
function teardrop(c:C,x:number,y:number,r:number,neck:number){
 c.save();c.translate(x,y);
 const h=r*(1.15+neck*1.5);
 c.beginPath();c.moveTo(0,-h);c.bezierCurveTo(r*.55,-h*.3,r,.2*r,0,r);c.bezierCurveTo(-r,.2*r,-r*.55,-h*.3,0,-h);c.closePath();
 const g=c.createLinearGradient(-r,0,r,h);g.addColorStop(0,'#f4c56a');g.addColorStop(.45,'#d88620');g.addColorStop(1,'#8a4316');
 c.fillStyle=g;c.fill();c.fillStyle='#fff6d455';c.beginPath();c.ellipse(-r*.28,-h*.15,r*.22,r*.18,-.4,0,Math.PI*2);c.fill();
 c.restore();
}
function drawSurface(pool:HoneyPool,x:number){
 const w=pool.bounds,steps=Math.max(180,Math.ceil(w.w/2));
 const pts:number[]=[];
 for(let i=0;i<=steps;i++){
  const u=i/steps;
  pts.push(x+u*w.w,w.y+pool.surfaceAt(w.x+u*w.w));
 }
 const surface=new Path2D();
 surface.moveTo(pts[0],pts[1]);
 for(let i=2;i<pts.length-2;i+=2){
  const mx=(pts[i]+pts[i+2])/2,my=(pts[i+1]+pts[i+3])/2;
  surface.quadraticCurveTo(pts[i],pts[i+1],mx,my);
 }
 surface.lineTo(pts[pts.length-2],pts[pts.length-1]);
 const body=new Path2D(surface);body.lineTo(x+w.w,w.y+w.h);body.lineTo(x,w.y+w.h);body.closePath();
 return {surface,body};
}
/** Dense, curved honey surface; small drips; no jagged height polyline. */
export function drawHoney(c:C,pool:HoneyPool,camera:number,_time:number,front:boolean){
 const w=pool.bounds,x=w.x-camera;if(x>1280||x+w.w<0)return;
 const {surface,body}=drawSurface(pool,x);
 if(!front){
  const g=c.createLinearGradient(0,w.y-22,0,w.y+w.h);
  g.addColorStop(0,'#f0c56caa');g.addColorStop(.16,'#d88620dd');g.addColorStop(.55,'#a34e16ee');g.addColorStop(1,'#4a220fee');
  c.fillStyle=g;c.fill(body);return;
 }
 c.fillStyle='#f6d17b22';c.fill(body);
 c.strokeStyle='#e29a36cc';c.lineWidth=2;c.lineJoin='round';c.lineCap='round';c.stroke(surface);
 for(const k of pool.crowns){
  const t=k.life/k.max,px=k.x-camera,py=w.y+pool.surfaceAt(k.x);
  c.save();c.globalAlpha=.2+t*.35;
  const mound=c.createRadialGradient(px,py,2,px,py,16+k.amp*t);
  mound.addColorStop(0,'#ffe08a66');mound.addColorStop(.5,'#d8862055');mound.addColorStop(1,'#d8862000');
  c.fillStyle=mound;c.beginPath();c.ellipse(px,py+1,16+k.amp*.5,5+k.amp*.15,0,0,Math.PI*2);c.fill();
  c.restore();
 }
 for(const m of pool.merges){
  const t=m.life/m.max;
  c.save();c.globalAlpha=.3+t*.45;c.translate(m.x-camera,m.y);
  c.scale(1+(1-t)*.5,t+.4);
  teardrop(c,0,0,m.r,1-t);c.restore();
 }
 for(const s of pool.strands){
  const life=s.life/s.max,len=Math.hypot(s.bx-s.ax,s.by-s.ay),thin=Math.max(.3,1-len/100)*life;
  c.strokeStyle=`rgba(216,134,32,${.42+thin*.5})`;c.lineWidth=Math.max(1,4*thin);c.lineCap='round';
  c.beginPath();c.moveTo(s.ax-camera,s.ay);c.quadraticCurveTo((s.ax+s.bx)/2-camera,s.ay+len*.32,s.bx-camera,s.by);c.stroke();
  teardrop(c,s.ax-camera,s.ay+3,2.2+thin,.4);
 }
 for(const d of pool.drops){
  const stretch=d.kind==='ceiling'?Math.min(.55,d.vy/140):0;
  c.save();c.translate(d.x-camera,d.y);c.scale(1,1+stretch);
  teardrop(c,0,0,d.r,d.neck);c.restore();
 }
}
