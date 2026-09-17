import type {DressingSpot,LevelLayout} from '../content/types';
import type {KitEntry} from '../kit/defs';
import {kitById} from '../kit/register';
import {folderOf,type OutlinerFolder} from './outliner';

export type Sel={kind:string;index:number};

function inside(x:number,y:number,r:{x:number;y:number;w:number;h:number},pad=6){
 return x>=r.x-pad&&x<=r.x+r.w+pad&&y>=r.y-pad&&y<=r.y+r.h+pad;
}

function near(x:number,y:number,px:number,py:number,r=22){return (x-px)**2+(y-py)**2<r*r;}

export function hitStack(layout:LevelLayout,x:number,y:number,lock:OutlinerFolder[]=[]):Sel[]{
 const locked=new Set(lock);
 const hits:Sel[]=[];
 const take=(kind:string,index:number)=>{
  const folder=folderOf(kind);
  if(folder&&locked.has(folder))return;
  hits.push({kind,index});
 };
 const dress=layout.dressing??[];
 for(let i=dress.length-1;i>=0;i--){
  if(inside(x,y,dressBox(dress[i])))take('dress',i);
 }
 for(let i=layout.dew.length-1;i>=0;i--)if(near(x,y,layout.dew[i].x,layout.dew[i].y))take('dew',i);
 const ecos=layout.ecology?.interactables??[];
 for(let i=ecos.length-1;i>=0;i--)if(near(x,y,ecos[i].x,ecos[i].y,28))take('eco',i);
 const fauna=layout.ecology?.fauna??[];
 for(let i=fauna.length-1;i>=0;i--)if(near(x,y,fauna[i].x,fauna[i].y,24))take('fauna',i);
 for(let i=layout.souvenirs.length-1;i>=0;i--)if(near(x,y,layout.souvenirs[i].x,layout.souvenirs[i].y))take('souvenir',i);
 for(let i=layout.enemies.length-1;i>=0;i--)if(near(x,y,layout.enemies[i].x,layout.enemies[i].y,36))take('enemy',i);
 for(let i=layout.stakes.length-1;i>=0;i--)if(inside(x,y,layout.stakes[i]))take('stake',i);
 for(let i=layout.plates.length-1;i>=0;i--)if(near(x,y,layout.plates[i].x,layout.plates[i].y,28))take('plate',i);
 const portals=layout.portals??[];
 for(let i=portals.length-1;i>=0;i--){
  const p=portals[i],box=kitBox(p.x,p.y,'mirror-portal',p.s);
  if(inside(x,y,box))take('portal',i);
 }
 if(near(x,y,layout.checkpoint.x,layout.checkpoint.y,20))take('checkpoint',0);
 const signs=layout.signs??[];
 for(let i=signs.length-1;i>=0;i--)if(near(x,y,signs[i].x,signs[i].y-40,30))take('sign',i);
 const hints=layout.hints??[];
 for(let i=hints.length-1;i>=0;i--){
  const h=hints[i];
  if(x>=h.x0&&x<=h.x1&&y>=(h.y0??-200)&&y<=(h.y1??9e3))take('hint',i);
 }
 for(let i=layout.areas.length-1;i>=0;i--){
  const a=layout.areas[i];
  if(x>=a.at&&y>=(a.y0??-200)&&y<(a.y1??9e3))take('area',i);
 }
 if(layout.exit&&inside(x,y,layout.exit))take('exit',0);
 if(inside(x,y,layout.gate,4)&&layout.gate.w>2)take('gate',0);
 if(inside(x,y,layout.water)&&layout.water.w>2)take('water',0);
 const extras=layout.waters??[];
 for(let i=extras.length-1;i>=0;i--){
  const w=extras[i];
  if(w.x===layout.water.x&&w.y===layout.water.y&&w.w===layout.water.w)continue;
  if(inside(x,y,w))take('water',i+1);
 }
 for(let i=layout.base.length-1;i>=0;i--){
  const r=layout.base[i];if(r.kind==='boundary')continue;
  if(inside(x,y,r,2))take('base',i);
 }
 if(layout.win?.kind==='zone'&&inside(x,y,layout.win))take('win',0);
 else if(Math.abs(x-(layout.win?.kind==='line'?layout.win.x:layout.completeX))<12)take('win',0);
 return hits;
}

export function hitTest(layout:LevelLayout,x:number,y:number,lock:OutlinerFolder[]=[]):Sel|undefined{
 return hitStack(layout,x,y,lock)[0];
}

function nid(layout:LevelLayout,prefix:string){
 const n=(layout.dressing?.length??0)+(layout.portals?.length??0)+layout.dew.length+layout.enemies.length+1;
 return `${prefix}-${n}`;
}

/** Footprint used by hit-test, gizmos and the place-ghost, so the box matches the drawn kit. */
export function kitSize(kit?:KitEntry,s=1){
 if(!kit)return {w:40*s,h:56*s};
 if(kit.place==='rect')return {w:kit.defaults.w??80,h:kit.defaults.h??40};
 const w=(kit.defaults.w??(kit.draw==='image'?56:36))*s;
 const h=(kit.defaults.h??(kit.draw==='image'?72:48))*s;
 return {w,h};
}

export function kitBox(x:number,y:number,kitId:string,s?:number){
 const kit=kitById(kitId);
 const size=kitSize(kit,s??kit?.defaults.s??1);
 return {x:x-size.w/2,y:y-size.h,w:size.w,h:size.h};
}

export function dressBox(d:Pick<DressingSpot,'kit'|'x'|'y'|'s'>){return kitBox(d.x,d.y,d.kit,d.s);}

export function nextPortalPair(layout:LevelLayout){
 const counts=new Map<string,number>();
 for(const p of layout.portals??[])counts.set(p.pair,(counts.get(p.pair)??0)+1);
 for(const [pair,n] of counts)if(n===1)return pair;
 return `gate-${(layout.portals?.length??0)+1}`;
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
 if(kit.category==='critter'){
  const eco=layout.ecology??(layout.ecology={interactables:[],fauna:[],events:[],challenges:[],biomes:[]});
  (eco.fauna??(eco.fauna=[])).push({id:nid(layout,kit.id),kind:kit.id.replace(/^critter-/,''),x:at.x,y:at.y,span:40,habitat:kit.chapter});
  return;
 }
 if(kit.play==='interact'&&!kit.interactKind){
  const eco=layout.ecology??(layout.ecology={interactables:[],fauna:[],events:[],challenges:[],biomes:[]});
  (eco.interactables??(eco.interactables=[])).push({id:nid(layout,kit.id),kind:kit.id,x:at.x,y:at.y});
  return;
 }
 if(kit.play==='dress'){
  (layout.dressing??(layout.dressing=[])).push({id:nid(layout,'d'),kit:kit.id,x:at.x,y:at.y,w,h,s:kit.defaults.s,flip:1});
  return;
 }
 if(kit.interactKind==='portal'){
  const list=layout.portals??(layout.portals=[]);
  list.push({id:nid(layout,'gate'),x:at.x,y:at.y,pair:nextPortalPair(layout),s:kit.defaults.s});
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
 if(sel.kind==='eco'){const o=layout.ecology?.interactables?.[sel.index];return o?{x:o.x-16,y:o.y-28,w:32,h:32}:undefined;}
 if(sel.kind==='fauna'){const o=layout.ecology?.fauna?.[sel.index];return o?{x:o.x-14,y:o.y-24,w:28,h:28}:undefined;}
 if(sel.kind==='souvenir'){const s=layout.souvenirs[sel.index];return s?{x:s.x-12,y:s.y-12,w:24,h:24}:undefined;}
 if(sel.kind==='enemy'){const e=layout.enemies[sel.index];return e?{x:e.x-20,y:e.y-40,w:40,h:48}:undefined;}
 if(sel.kind==='plate'){const p=layout.plates[sel.index];return p?{x:p.x-20,y:p.y-8,w:40,h:12}:undefined;}
 if(sel.kind==='dress'){const d=layout.dressing?.[sel.index];return d?dressBox(d):undefined;}
 if(sel.kind==='portal'){const p=layout.portals?.[sel.index];return p?kitBox(p.x,p.y,'mirror-portal',p.s):undefined;}
 if(sel.kind==='sign'){const s=layout.signs?.[sel.index];return s?{x:s.x-40,y:s.y-80,w:80,h:80}:undefined;}
 if(sel.kind==='hint'){const h=layout.hints?.[sel.index];return h?{x:h.x0,y:h.y0??0,w:h.x1-h.x0,h:(h.y1??400)-(h.y0??0)}:undefined;}
 if(sel.kind==='area'){const a=layout.areas[sel.index];return a?{x:a.at,y:a.y0??0,w:Math.max(80,layout.width-a.at),h:(a.y1??400)-(a.y0??0)}:undefined;}
 if(sel.kind==='checkpoint')return {x:layout.checkpoint.x-8,y:layout.checkpoint.y-16,w:16,h:24};
 if(sel.kind==='win'){
  if(layout.win?.kind==='zone')return layout.win;
  const x=layout.completeX;
  return {x:x-2,y:0,w:4,h:layout.height};
 }
}

export function frameCamera(layout:LevelLayout,sel:Sel,viewW=1280,viewH=720){
 const r=selRect(layout,sel);if(!r)return;
 return {cameraX:Math.max(0,r.x+r.w/2-viewW/2),cameraY:Math.max(-layout.height+viewH,viewH/2-(r.y+r.h/2))};
}

export function applySelNum(layout:LevelLayout,sel:Sel,field:'x'|'y'|'w'|'h',value:number){
 if(sel.kind==='base'){layout.base[sel.index][field]=value;return;}
 if(sel.kind==='gate'){layout.gate[field]=value;return;}
 if(sel.kind==='water'){
  const rect=sel.index===0?layout.water:layout.waters?.[sel.index-1];
  if(rect)rect[field]=value;
  return;
 }
 if(sel.kind==='stake'){layout.stakes[sel.index][field]=value;return;}
 if(sel.kind==='exit'&&layout.exit){layout.exit[field]=value;return;}
 if((sel.kind==='dew'||sel.kind==='souvenir'||sel.kind==='enemy'||sel.kind==='plate'||sel.kind==='sign'||sel.kind==='portal'||sel.kind==='eco'||sel.kind==='fauna')&&(field==='x'||field==='y')){
  const obj=sel.kind==='dew'?layout.dew[sel.index]:sel.kind==='souvenir'?layout.souvenirs[sel.index]:sel.kind==='enemy'?layout.enemies[sel.index]:sel.kind==='plate'?layout.plates[sel.index]:sel.kind==='portal'?layout.portals?.[sel.index]:sel.kind==='eco'?layout.ecology?.interactables?.[sel.index]:sel.kind==='fauna'?layout.ecology?.fauna?.[sel.index]:layout.signs?.[sel.index];
  if(obj)obj[field]=value;
  return;
 }
 if(sel.kind==='dress'){
  const d=layout.dressing?.[sel.index];if(!d)return;
  if(field==='x'||field==='y')d[field]=value;
  else d[field]=value;
  return;
 }
 if(sel.kind==='win'&&field==='x'){
  layout.completeX=value;
  if(layout.win?.kind==='line')layout.win.x=value;
  if(layout.win?.kind==='zone')layout.win.x=value;
 }
 if(sel.kind==='checkpoint'&&(field==='x'||field==='y')){layout.checkpoint[field]=value;return;}
 if(sel.kind==='hint'){
  const h=layout.hints?.[sel.index];if(!h)return;
  if(field==='x'){const w=h.x1-h.x0;h.x0=value;h.x1=value+w;}
  if(field==='y'){const hh=(h.y1??0)-(h.y0??0);h.y0=value;h.y1=value+hh;}
  if(field==='w')h.x1=h.x0+value;
  if(field==='h')h.y1=(h.y0??0)+value;
 }
 if(sel.kind==='area'){
  const a=layout.areas[sel.index];if(!a)return;
  if(field==='x')a.at=value;
  if(field==='y')a.y0=value;
  if(field==='h')a.y1=(a.y0??0)+value;
 }
}

export function snapSel(layout:LevelLayout,sel:Sel,snap:number){
 if(!snap)return;
 const r=selRect(layout,sel);if(!r)return;
 moveSel(layout,sel,Math.round(r.x/snap)*snap-r.x,Math.round(r.y/snap)*snap-r.y);
}

export function moveSel(layout:LevelLayout,sel:Sel,dx:number,dy:number){
 const apply=(o:{x:number;y:number})=>{o.x+=dx;o.y+=dy;};
 if(sel.kind==='base')apply(layout.base[sel.index]);
 if(sel.kind==='gate')apply(layout.gate);
 if(sel.kind==='water')apply(sel.index===0?layout.water:layout.waters![sel.index-1]);
 if(sel.kind==='stake')apply(layout.stakes[sel.index]);
 if(sel.kind==='exit'&&layout.exit)apply(layout.exit);
 if(sel.kind==='dew')apply(layout.dew[sel.index]);
 if(sel.kind==='eco')apply(layout.ecology!.interactables![sel.index]);
 if(sel.kind==='fauna')apply(layout.ecology!.fauna![sel.index]);
 if(sel.kind==='souvenir')apply(layout.souvenirs[sel.index]);
 if(sel.kind==='enemy')apply(layout.enemies[sel.index]);
 if(sel.kind==='plate')apply(layout.plates[sel.index]);
 if(sel.kind==='dress')apply(layout.dressing![sel.index]);
 if(sel.kind==='portal')apply(layout.portals![sel.index]);
 if(sel.kind==='sign')apply(layout.signs![sel.index]);
 if(sel.kind==='checkpoint')apply(layout.checkpoint);
 if(sel.kind==='win'){layout.completeX+=dx;if(layout.win?.kind==='line')layout.win.x+=dx;if(layout.win?.kind==='zone'){layout.win.x+=dx;layout.win.y+=dy;}}
 if(sel.kind==='hint'){const h=layout.hints![sel.index];h.x0+=dx;h.x1+=dx;if(h.y0!==undefined)h.y0+=dy;if(h.y1!==undefined)h.y1+=dy;}
 if(sel.kind==='area'){const a=layout.areas[sel.index];a.at+=dx;if(a.y0!==undefined)a.y0+=dy;if(a.y1!==undefined)a.y1+=dy;}
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
