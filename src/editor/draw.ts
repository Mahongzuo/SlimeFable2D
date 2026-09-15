import {W} from '../art';
import type {LevelLayout} from '../content/types';
import {selRect,type Sel} from './tools';

type C=CanvasRenderingContext2D;

function box(c:C,x:number,y:number,w:number,h:number,fill:string,stroke:string){
 c.fillStyle=fill;c.fillRect(x,y,w,h);c.strokeStyle=stroke;c.lineWidth=1.2;c.strokeRect(x,y,w,h);
}

export function drawGizmos(c:C,layout:LevelLayout,camera:number,cameraY:number,sel?:Sel){
 c.save();c.translate(-camera,cameraY);
 for(const r of layout.base){
  if(r.kind==='boundary')continue;
  const fill=r.kind==='pool'?'#4a88b855':r.oneWay?'#7aa36a55':r.kind==='root'?'#8a735055':'#5d8a6e44';
  box(c,r.x,r.y,r.w,r.h,fill,'#e8f6c866');
 }
 if(layout.water.w>2)box(c,layout.water.x,layout.water.y,layout.water.w,layout.water.h,'#6ec4c866','#b8fff0');
 for(const w of layout.waters??[])box(c,w.x,w.y,w.w,w.h,'#6ec4c855','#b8fff0');
 if(layout.gate.w>2)box(c,layout.gate.x,layout.gate.y,layout.gate.w,layout.gate.h,'#e0a44a66','#f6d17b');
 for(const p of layout.plates){c.fillStyle='#d5e89c';c.beginPath();c.ellipse(p.x,p.y,18,5,0,0,Math.PI*2);c.fill();}
 for(const d of layout.dew){c.fillStyle='#ffe08a';c.beginPath();c.arc(d.x,d.y,7,0,Math.PI*2);c.fill();}
 for(const s of layout.souvenirs){c.fillStyle='#c6e87a';c.fillRect(s.x-6,s.y-6,12,12);}
 for(const e of layout.enemies){c.fillStyle='#ff5a48';c.fillRect(e.x-10,e.y-28,20,28);}
 for(const s of layout.stakes)box(c,s.x,s.y,s.w,s.h,'#ffb06088','#ffd8a0');
 c.fillStyle='#dcf3b4';c.fillRect(layout.checkpoint.x-2,layout.checkpoint.y-8,4,16);
 if(layout.exit)box(c,layout.exit.x,layout.exit.y,layout.exit.w,layout.exit.h,'#8ad4ff44','#e8fbff');
 const winX=layout.win?.kind==='line'?layout.win.x:layout.completeX;
 c.strokeStyle='#f6ffd0';c.setLineDash([6,6]);c.beginPath();c.moveTo(winX,0);c.lineTo(winX,layout.height);c.stroke();c.setLineDash([]);
 for(const h of layout.hints??[])box(c,h.x0,h.y0??0,h.x1-h.x0,(h.y1??400)-(h.y0??0),'#b07cff22','#d8b0ff66');
 if(sel){
  const r=selRect(layout,sel);
  if(r){
   c.strokeStyle='#f4f2c4';c.lineWidth=2;c.strokeRect(r.x-2,r.y-2,r.w+4,r.h+4);
   for(const [hx,hy] of [[r.x,r.y],[r.x+r.w,r.y],[r.x,r.y+r.h],[r.x+r.w,r.y+r.h]]){
    c.fillStyle='#f4f2c4';c.fillRect(hx-4,hy-4,8,8);
   }
  }
 }
 c.restore();
}

export function screenToWorld(sx:number,sy:number,camera:number,cameraY:number,bounds:DOMRect){
 return {x:sx/bounds.width*W+camera,y:sy/bounds.height*720-cameraY};
}
