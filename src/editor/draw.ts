import {W} from '../art';
import type {LevelLayout} from '../content/types';
import type {KitEntry} from '../kit/defs';
import {drawKit} from '../kit/view';
import type {OutlinerFolder} from './outliner';
import {kitBox,kitSize,selRect,type Sel} from './tools';

type C=CanvasRenderingContext2D;

function box(c:C,x:number,y:number,w:number,h:number,fill:string,stroke:string){
 c.fillStyle=fill;c.fillRect(x,y,w,h);c.strokeStyle=stroke;c.lineWidth=1.2;c.strokeRect(x,y,w,h);
}

function ring(c:C,x:number,y:number,w:number,h:number,color='#f4f2c4'){
 c.save();
 c.strokeStyle=color;c.lineWidth=2.4;c.setLineDash([5,4]);
 c.strokeRect(x-3,y-3,w+6,h+6);
 c.setLineDash([]);
 c.fillStyle=color;
 for(const [hx,hy] of [[x,y],[x+w,y],[x,y+h],[x+w,y+h]])c.fillRect(hx-4,hy-4,8,8);
 c.restore();
}

export function drawGhost(c:C,kit:KitEntry,x:number,y:number){
 const size=kitSize(kit,kit.defaults.s??1);
 c.save();c.globalAlpha=.72;
 if(kit.place==='rect'||kit.play==='solid'||kit.play==='water'){
  const w=kit.defaults.w??80,h=kit.defaults.h??40;
  c.fillStyle='#d8e5b955';c.fillRect(x,y,w,h);
  c.strokeStyle='#f4f2c4';c.setLineDash([6,4]);c.strokeRect(x,y,w,h);
 }else{
  drawKit(c,kit,{x,y,s:kit.defaults.s??1,w:size.w,h:size.h},0);
  const r=kitBox(x,y,kit.id,kit.defaults.s);
  c.strokeStyle='#f4f2c4cc';c.setLineDash([5,4]);c.strokeRect(r.x,r.y,r.w,r.h);
 }
 c.restore();
}

/** Locked folders are still drawn, but ghosted, so the editable layer reads at a glance. */
export function drawGizmos(c:C,layout:LevelLayout,camera:number,cameraY:number,sel?:Sel,locked:OutlinerFolder[]=[],ghost?:{kit:KitEntry;x:number;y:number}){
 c.save();c.translate(-camera,cameraY);
 const layer=(folder:OutlinerFolder,draw:()=>void)=>{
  c.save();
  if(locked.includes(folder))c.globalAlpha=.22;
  draw();
  c.restore();
 };
 layer('collision',()=>{
  for(const r of layout.base){
   if(r.kind==='boundary')continue;
   const fill=r.kind==='pool'?'#4a88b855':r.oneWay?'#7aa36a55':r.kind==='root'?'#8a735055':'#5d8a6e44';
   box(c,r.x,r.y,r.w,r.h,fill,'#e8f6c866');
  }
  if(layout.water.w>2)box(c,layout.water.x,layout.water.y,layout.water.w,layout.water.h,'#6ec4c866','#b8fff0');
  for(const w of layout.waters??[])box(c,w.x,w.y,w.w,w.h,'#6ec4c855','#b8fff0');
  if(layout.gate.w>2)box(c,layout.gate.x,layout.gate.y,layout.gate.w,layout.gate.h,'#e0a44a66','#f6d17b');
  if(layout.exit)box(c,layout.exit.x,layout.exit.y,layout.exit.w,layout.exit.h,'#8ad4ff44','#e8fbff');
  const winX=layout.win?.kind==='line'?layout.win.x:layout.completeX;
  c.strokeStyle='#f6ffd0';c.setLineDash([6,6]);c.beginPath();c.moveTo(winX,0);c.lineTo(winX,layout.height);c.stroke();c.setLineDash([]);
 });
 layer('scenery',()=>{
  for(const d of layout.dressing??[]){
   const r=kitBox(d.x,d.y,d.kit,d.s);
   c.strokeStyle='#7fc6e866';c.strokeRect(r.x,r.y,r.w,r.h);
  }
 });
 layer('placed',()=>{
  for(const p of layout.plates){c.fillStyle='#d5e89c';c.beginPath();c.ellipse(p.x,p.y,18,5,0,0,Math.PI*2);c.fill();}
  for(const d of layout.dew){c.fillStyle='#ffe08a';c.beginPath();c.arc(d.x,d.y,7,0,Math.PI*2);c.fill();}
  for(const s of layout.souvenirs){c.fillStyle='#c6e87a';c.fillRect(s.x-6,s.y-6,12,12);}
  for(const s of layout.stakes)box(c,s.x,s.y,s.w,s.h,'#ffb06088','#ffd8a0');
  c.fillStyle='#dcf3b4';c.fillRect(layout.checkpoint.x-2,layout.checkpoint.y-8,4,16);
  for(const p of layout.portals??[]){
   const r=kitBox(p.x,p.y,'mirror-portal',p.s);
   box(c,r.x,r.y,r.w,r.h,'#8ad4ff22','#9fd4ea88');
   c.strokeStyle='#9fd4ea';c.setLineDash([4,4]);
   const mate=(layout.portals??[]).find(o=>o.pair===p.pair&&o.id!==p.id);
   if(mate){c.beginPath();c.moveTo(p.x,p.y-40);c.lineTo(mate.x,mate.y-40);c.stroke();}
   c.setLineDash([]);
  }
 });
 layer('enemy',()=>{
  for(const e of layout.enemies){c.fillStyle='#ff5a48';c.fillRect(e.x-10,e.y-28,20,28);}
 });
 layer('zone',()=>{
  for(const a of layout.areas)box(c,a.at,a.y0??0,Math.max(80,layout.width-a.at),(a.y1??400)-(a.y0??0),'#7cb0ff10','#9cc4ff44');
  for(const h of layout.hints??[])box(c,h.x0,h.y0??0,h.x1-h.x0,(h.y1??400)-(h.y0??0),'#b07cff22','#d8b0ff66');
 });
 if(ghost)drawGhost(c,ghost.kit,ghost.x,ghost.y);
 if(sel){
  const r=selRect(layout,sel);
  if(r){
   const glow=c.createRadialGradient(r.x+r.w/2,r.y+r.h/2,4,r.x+r.w/2,r.y+r.h/2,Math.max(r.w,r.h));
   glow.addColorStop(0,'#f4f2c433');glow.addColorStop(1,'#f4f2c400');
   c.fillStyle=glow;c.fillRect(r.x-18,r.y-18,r.w+36,r.h+36);
   ring(c,r.x,r.y,r.w,r.h);
  }
 }
 c.restore();
}

export function screenToWorld(sx:number,sy:number,camera:number,cameraY:number,bounds:DOMRect){
 return {x:sx/bounds.width*W+camera,y:sy/bounds.height*720-cameraY};
}
