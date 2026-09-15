import type {Level} from './level';
import type {Adventure} from './game';
import {W,H} from './art';

export function drawMinimap(canvas:HTMLCanvasElement,adventure:Adventure){
 const c=canvas.getContext('2d');if(!c)return;
 const level=adventure.level,w=canvas.width,h=canvas.height;
 const worldW=Math.max(800,level.width),worldH=Math.max(720,level.height);
 const pad=6,mw=w-pad*2,mh=h-pad*2;
 const sx=mw/worldW,sy=mh/worldH,s=Math.min(sx,sy);
 const ox=pad+(mw-worldW*s)/2,oy=pad+(mh-worldH*s)/2;
 const mapX=(x:number)=>ox+x*s,mapY=(y:number)=>oy+y*s;
 c.clearRect(0,0,w,h);
 c.fillStyle='#1a332acc';c.fillRect(0,0,w,h);
 c.strokeStyle='#e8f6c866';c.strokeRect(.5,.5,w-1,h-1);
 c.save();c.beginPath();c.rect(pad,pad,mw,mh);c.clip();
 for(const r of level.base){
  if(r.kind==='boundary')continue;
  if(r.kind!=='pool'&&(r.w<80||r.h>220))continue;
  c.fillStyle=r.oneWay?'#7aa36aaa':r.kind==='pool'?'#4a88b8cc':'#5d8a6e';
  c.fillRect(mapX(r.x),mapY(r.y),Math.max(1.2,r.w*s),Math.max(1.2,r.h*s));
 }
 const camX=adventure.camera,camY=-adventure.cameraY;
 c.strokeStyle='#f6ffd0';c.lineWidth=1.2;
 c.strokeRect(mapX(camX),mapY(camY),W*s,H*s);
 for(const d of level.dew){
  if(d.got)continue;
  c.fillStyle='#e8ff8a';
  c.beginPath();c.arc(mapX(d.x),mapY(d.y),2,0,Math.PI*2);c.fill();
 }
 for(const actor of adventure.actors){
  if(actor.dead)continue;
  c.fillStyle='#ff5a48';c.fillRect(mapX(actor.x)-1.6,mapY(actor.y)-1.6,3.2,3.2);
 }
 for(const stake of level.stakes){
  if(stake.hp<=0)continue;
  c.fillStyle='#ffb060';c.fillRect(mapX(stake.x)-1.2,mapY(stake.y)-1.2,2.6,2.6);
 }
 if(level.exit){
  const e=level.exit;
  c.fillStyle='#8ad4ffcc';
  c.fillRect(mapX(e.x),mapY(e.y),Math.max(2.4,e.w*s),Math.max(2.4,e.h*s));
  c.strokeStyle='#e8fbff';c.lineWidth=1;
  c.strokeRect(mapX(e.x),mapY(e.y),Math.max(2.4,e.w*s),Math.max(2.4,e.h*s));
 }
 const p=adventure.sim.center(adventure.sim.activeGroup);
 c.fillStyle='#7cfff2';c.beginPath();c.arc(mapX(p.x),mapY(p.y),3.2,0,Math.PI*2);c.fill();
 c.strokeStyle='#ffffff';c.lineWidth=1.2;c.stroke();
 c.restore();
}
