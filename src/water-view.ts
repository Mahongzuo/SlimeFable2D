import type {WaterSimulation} from './water';
export function drawWater(c:CanvasRenderingContext2D,water:WaterSimulation,camera:number,time:number,front:boolean){
 const w=water.bounds,x=w.x-camera;if(x>1280||x+w.w<0)return;
 const surface=new Path2D();
 for(let i=0;i<water.heights.length;i++){const px=x+i*w.w/96,py=w.y+water.heights[i];if(i===0)surface.moveTo(px,py);else surface.lineTo(px,py);}
 const body=new Path2D(surface);body.lineTo(x+w.w,w.y+w.h);body.lineTo(x,w.y+w.h);body.closePath();
 if(!front){const gradient=c.createLinearGradient(0,w.y-20,0,w.y+w.h);gradient.addColorStop(0,'#b4e2d77d');gradient.addColorStop(.25,'#6ab9bb90');gradient.addColorStop(1,'#225e718f');c.fillStyle=gradient;c.fill(body);return;}
 c.fillStyle='#a1e9e724';c.fill(body);c.strokeStyle='#d9fff1d9';c.lineWidth=1.7;c.stroke(surface);
 c.save();c.clip(body);c.lineWidth=.75;
 for(let row=0;row<4;row++)for(let i=0;i<15;i++){const px=x+i*35+Math.sin(time*.6+row)*12,py=w.y+18+row*16;c.strokeStyle='#c9ffe748';c.beginPath();c.ellipse(px,py,20,3,.12*Math.sin(i+time),0,Math.PI*2);c.stroke();}
 for(let i=1;i<96;i++){const speed=Math.abs(water.velocities[i]);if(speed<15)continue;c.globalAlpha=Math.min(.7,speed/100);c.fillStyle='#ecfff7';c.beginPath();c.ellipse(x+i*w.w/96,w.y+water.heights[i]+2,2.8,1,0,0,Math.PI*2);c.fill();}c.restore();
 for(const d of water.drops){const px=d.x-camera;c.save();c.translate(px,d.y);c.rotate(Math.atan2(d.vy,d.vx)+Math.PI/2);const g=c.createLinearGradient(-d.r,0,d.r,0);g.addColorStop(0,'#d9fff8');g.addColorStop(1,'#6cbdcfbf');c.fillStyle=g;c.beginPath();c.ellipse(0,0,d.r,d.r*(1+Math.min(1,Math.abs(d.vy)/400)),0,0,Math.PI*2);c.fill();c.restore();}
}
