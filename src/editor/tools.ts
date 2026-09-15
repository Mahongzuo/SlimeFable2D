import type {LevelLayout} from '../content/types';
import type {KitEntry} from '../kit/defs';

export type Sel={kind:string;index:number};

function inside(x:number,y:number,r:{x:number;y:number;w:number;h:number},pad=6){
 return x>=r.x-pad&&x<=r.x+r.w+pad&&y>=r.y-pad&&y<=r.y+r.h+pad;
}

function near(x:number,y:number,px:number,py:number,r=22){return (x-px)**2+(y-py)**2<r*r;}

export function hitTest(layout:LevelLayout,x:number,y:number):Sel|undefined{
 const dress=layout.dressing??[];
 for(let i=dress.length-1;i>=0;i--){
  const d=dress[i],w=d.w??36,h=d.h??48;
  if(inside(x,y,{x:d.x-w/2,y:d.y-h,w,h}))return {kind:'dress',index:i};
 }
 for(let i=layout.dew.length-1;i>=0;i--)if(near(x,y,layout.dew[i].x,layout.dew[i].y))return {kind:'dew',index:i};
 for(let i=layout.souvenirs.length-1;i>=0;i--)if(near(x,y,layout.souvenirs[i].x,layout.souvenirs[i].y))return {kind:'souvenir',index:i};
 for(let i=layout.enemies.length-1;i>=0;i--)if(near(x,y,layout.enemies[i].x,layout.enemies[i].y,36))return {kind:'enemy',index:i};
 for(let i=layout.stakes.length-1;i>=0;i--)if(inside(x,y,layout.stakes[i]))return {kind:'stake',index:i};
 for(let i=layout.plates.length-1;i>=0;i--)if(near(x,y,layout.plates[i].x,layout.plates[i].y,28))return {kind:'plate',index:i};
 const signs=layout.signs??[];
 for(let i=signs.length-1;i>=0;i--)if(near(x,y,signs[i].x,signs[i].y-40,30))return {kind:'sign',index:i};
 const hints=layout.hints??[];
 for(let i=hints.length-1;i>=0;i--){
  const h=hints[i];
  if(x>=h.x0&&x<=h.x1&&y>=(h.y0??-200)&&y<=(h.y1??9e3))return {kind:'hint',index:i};
 }
 if(layout.exit&&inside(x,y,layout.exit))return {kind:'exit',index:0};
 if(inside(x,y,layout.gate,4)&&layout.gate.w>2)return {kind:'gate',index:0};
 if(inside(x,y,layout.water)&&layout.water.w>2)return {kind:'water',index:0};
 const extras=layout.waters??[];
 for(let i=extras.length-1;i>=0;i--)if(inside(x,y,extras[i]))return {kind:'water',index:i+1};
 for(let i=layout.base.length-1;i>=0;i--){
  const r=layout.base[i];if(r.kind==='boundary')continue;
  if(inside(x,y,r,2))return {kind:'base',index:i};
 }
 if(Math.abs(x-(layout.win?.kind==='line'?layout.win.x:layout.completeX))<12)return {kind:'win',index:0};
}

function nid(layout:LevelLayout,prefix:string){
 const n=(layout.dressing?.length??0)+layout.dew.length+layout.enemies.length+1;
 return `${prefix}-${n}`;
}

export function applyKit(layout:LevelLayout,kit:KitEntry,at:{x:number;y:number;w?:number;h?:number}){
 const w=at.w??kit.defaults.w??40,h=at.h??kit.defaults.h??40;
 if(kit.play==='solid'&&kit.solidKind){
  layout.base.push({x:at.x,y:at.y,w,h,kind:kit.solidKind,oneWay:kit.oneWay});
  return;
 }
 if(kit.play==='water'){
  const rect={x:at.x,y:at.y,w,h};
  if(layout.water.w<=2)layout.water={...rect};
  else (layout.waters??(layout.waters=[])).push(rect);
  layout.base.push({x:at.x,y:at.y,w,h:Math.max(h,80),kind:'pool'});
  return;
 }
 if(kit.play==='pickup'&&kit.pickup==='dew'){
  layout.dew.push({x:at.x,y:at.y,got:false,role:'main',skin:kit.dewSkin});
  return;
 }
 if(kit.play==='pickup'&&kit.pickup==='souvenir'){
  const id=kit.souvenirId??nid(layout,'souvenir');
  layout.souvenirs.push({id,name:kit.name,x:at.x,y:at.y,got:false});
  return;
 }
 if(kit.play==='actor'&&kit.actorKind){
  layout.enemies.push({id:nid(layout,kit.actorKind),kind:kit.actorKind,x:at.x,y:at.y,patrol:50});
  return;
 }
 if(kit.play==='dress'){
  (layout.dressing??(layout.dressing=[])).push({id:nid(layout,'d'),kit:kit.id,x:at.x,y:at.y,w,h,s:kit.defaults.s,flip:1});
  return;
 }
 if(kit.id==='interact-plate'){layout.plates.push({x:at.x,y:at.y});return;}
 if(kit.id==='interact-gate'){layout.gate={x:at.x,y:at.y,w,h,kind:'gate'};return;}
 if(kit.id==='interact-stake'){layout.stakes.push({id:nid(layout,'stake'),x:at.x,y:at.y,w,h,hp:3,maxHp:3});return;}
 if(kit.id==='interact-checkpoint'){layout.checkpoint={x:at.x,y:at.y};return;}
 if(kit.id==='interact-exit'){layout.exit={x:at.x,y:at.y,w,h};return;}
 if(kit.id==='interact-win-line'){layout.completeX=at.x;layout.win={kind:'line',x:at.x};return;}
 if(kit.id==='sign-post'){(layout.signs??(layout.signs=[])).push({x:at.x,y:at.y,text:'路牌',arrow:'→'});return;}
 if(kit.id==='sign-hint'){(layout.hints??(layout.hints=[])).push({x0:at.x,x1:at.x+w,y0:at.y,y1:at.y+h,text:'在这里写一句提示'});return;}
 if(kit.id==='sign-area'){layout.areas.push({at:at.x,name:'新区域',sub:'AREA',y0:at.y,y1:at.y+h});return;}
}

export function selRect(layout:LevelLayout,sel:Sel):{x:number;y:number;w:number;h:number}|undefined{
 if(sel.kind==='base')return layout.base[sel.index];
 if(sel.kind==='gate')return layout.gate;
 if(sel.kind==='water')return sel.index===0?layout.water:layout.waters?.[sel.index-1];
 if(sel.kind==='stake')return layout.stakes[sel.index];
 if(sel.kind==='exit')return layout.exit;
 if(sel.kind==='dew'){const d=layout.dew[sel.index];return d?{x:d.x-12,y:d.y-12,w:24,h:24}:undefined;}
 if(sel.kind==='souvenir'){const s=layout.souvenirs[sel.index];return s?{x:s.x-12,y:s.y-12,w:24,h:24}:undefined;}
 if(sel.kind==='enemy'){const e=layout.enemies[sel.index];return e?{x:e.x-20,y:e.y-40,w:40,h:48}:undefined;}
 if(sel.kind==='plate'){const p=layout.plates[sel.index];return p?{x:p.x-20,y:p.y-8,w:40,h:12}:undefined;}
 if(sel.kind==='dress'){const d=layout.dressing?.[sel.index];return d?{x:d.x-(d.w??36)/2,y:d.y-(d.h??48),w:d.w??36,h:d.h??48}:undefined;}
 if(sel.kind==='sign'){const s=layout.signs?.[sel.index];return s?{x:s.x-40,y:s.y-80,w:80,h:80}:undefined;}
 if(sel.kind==='hint'){const h=layout.hints?.[sel.index];return h?{x:h.x0,y:h.y0??0,w:h.x1-h.x0,h:(h.y1??400)-(h.y0??0)}:undefined;}
 if(sel.kind==='win'){const x=layout.win?.kind==='line'?layout.win.x:layout.completeX;return {x:x-2,y:0,w:4,h:layout.height};}
}

export function moveSel(layout:LevelLayout,sel:Sel,dx:number,dy:number){
 const apply=(o:{x:number;y:number})=>{o.x+=dx;o.y+=dy;};
 if(sel.kind==='base')apply(layout.base[sel.index]);
 if(sel.kind==='gate')apply(layout.gate);
 if(sel.kind==='water')apply(sel.index===0?layout.water:layout.waters![sel.index-1]);
 if(sel.kind==='stake')apply(layout.stakes[sel.index]);
 if(sel.kind==='exit'&&layout.exit)apply(layout.exit);
 if(sel.kind==='dew')apply(layout.dew[sel.index]);
 if(sel.kind==='souvenir')apply(layout.souvenirs[sel.index]);
 if(sel.kind==='enemy')apply(layout.enemies[sel.index]);
 if(sel.kind==='plate')apply(layout.plates[sel.index]);
 if(sel.kind==='dress')apply(layout.dressing![sel.index]);
 if(sel.kind==='sign')apply(layout.signs![sel.index]);
 if(sel.kind==='checkpoint')apply(layout.checkpoint);
 if(sel.kind==='win'){layout.completeX+=dx;if(layout.win?.kind==='line')layout.win.x+=dx;}
 if(sel.kind==='hint'){const h=layout.hints![sel.index];h.x0+=dx;h.x1+=dx;if(h.y0!==undefined)h.y0+=dy;if(h.y1!==undefined)h.y1+=dy;}
}

export const STAMPS:{id:string;name:string;build:(layout:LevelLayout,x:number,y:number)=>void}[]=[
 {id:'ground-grass',name:'地面条+草',build:(layout,x,y)=>{
  layout.base.push({x,y,w:400,h:350,kind:'earth'});
  (layout.dressing??(layout.dressing=[])).push({id:nid(layout,'d'),kit:'forest-grass',x:x+40,y,w:220,h:16,s:1});
 }},
 {id:'shaft',name:'攀爬竖井',build:(layout,x,y)=>{
  layout.base.push({x,y:y-400,w:24,h:420,kind:'root'},{x:x+140,y:y-400,w:24,h:420,kind:'root'});
  for(let i=0;i<3;i++)layout.base.push({x:x+20,y:y-80-i*120,w:118,h:16,kind:'branch',oneWay:true});
 }},
 {id:'gate',name:'双踏板石门',build:(layout,x,y)=>{
  layout.plates.push({x:x-80,y},{x:x+80,y});
  layout.gate={x:x+180,y:y-185,w:35,h:185,kind:'gate'};
 }},
 {id:'pool',name:'镜水浅湾',build:(layout,x,y)=>{
  layout.water={x,y,w:480,h:80};
  layout.base.push({x,y:y+76,w:480,h:200,kind:'pool'});
 }},
 {id:'tide-bed',name:'潮汐花坛',build:(layout,x,y)=>{
  const d=layout.dressing??(layout.dressing=[]);
  d.push({id:nid(layout,'d'),kit:'tide-weed',x,y,s:1});
  d.push({id:nid(layout,'d'),kit:'tide-coral',x:x+40,y,s:1});
  d.push({id:nid(layout,'d'),kit:'tide-bloom',x:x+80,y,s:1});
 }},
 {id:'spawn',name:'出生三件套',build:(layout,x,y)=>{
  layout.checkpoint={x,y:y-60};
  (layout.signs??(layout.signs=[])).push({x:x+80,y,text:'出发',arrow:'→'});
  (layout.hints??(layout.hints=[])).push({x0:x-80,x1:x+320,text:'从这里开始'});
 }},
];
