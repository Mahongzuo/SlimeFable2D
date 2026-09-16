import type {LevelLayout} from '../content/types';
import type {KitEntry} from '../kit/defs';
import {KIT,kitById} from '../kit/register';
import type {Sel} from './tools';

export type OutlinerFolder='collision'|'scenery'|'placed'|'enemy'|'zone';

export const OUTLINER_FOLDERS:OutlinerFolder[]=['collision','scenery','placed','enemy','zone'];

export const FOLDER_LABEL:Record<OutlinerFolder,string>={
 collision:'碰撞',scenery:'场景',placed:'摆放',enemy:'敌人',zone:'区域',
};

export const DEFAULT_PICK_LOCK:OutlinerFolder[]=['zone'];

/** `all` is the mixed view; a folder name means only that folder is editable, placeable and listed. */
export type EditorMode='all'|OutlinerFolder;

export const EDITOR_MODES:EditorMode[]=['all',...OUTLINER_FOLDERS];

export const MODE_LABEL:Record<EditorMode,string>={all:'全部',...FOLDER_LABEL};

/** Folders that viewport clicks should ignore under a given mode. */
export function lockForMode(mode:EditorMode):OutlinerFolder[]{
 return mode==='all'?[...DEFAULT_PICK_LOCK]:OUTLINER_FOLDERS.filter(f=>f!==mode);
}

export type OutlinerRow={folder:OutlinerFolder;kind:string;index:number;label:string};

export function folderOf(kind:string):OutlinerFolder|undefined{
 if(kind==='base'||kind==='water'||kind==='gate'||kind==='exit'||kind==='win')return 'collision';
 if(kind==='dress'||kind==='sign')return 'scenery';
 if(kind==='dew'||kind==='souvenir'||kind==='plate'||kind==='stake'||kind==='checkpoint'||kind==='portal')return 'placed';
 if(kind==='enemy')return 'enemy';
 if(kind==='hint'||kind==='area')return 'zone';
}

/** Which folder a palette entry lands in once placed, so mode filtering matches the outliner. */
export function folderOfKit(kit:KitEntry):OutlinerFolder{
 if(kit.play==='solid'||kit.play==='water')return 'collision';
 if(kit.play==='pickup')return 'placed';
 if(kit.play==='actor')return 'enemy';
 if(kit.interactKind==='hint'||kit.interactKind==='area')return 'zone';
 if(kit.play==='interact'){
  if(kit.interactKind==='gate'||kit.interactKind==='exit'||kit.interactKind==='win-line')return 'collision';
  return 'placed';
 }
 return 'scenery';
}

const BASE_KIND:Record<string,string>={earth:'土地',stone:'石台',root:'树根',branch:'单向枝',moss:'苔台',pool:'水池坑','wax-rock':'蜜蜡岩','hex-pad':'蜂巢台'};

export function rowLabel(layout:LevelLayout,sel:Sel):string{
 if(sel.kind==='base'){
  const r=layout.base[sel.index];
  if(!r)return `台 #${sel.index}`;
  if(r.oneWay)return `单向台 #${sel.index}`;
  const kind=r.kind??'';
  return `${BASE_KIND[kind]??(kind||'台')} #${sel.index}`;
 }
 if(sel.kind==='water')return `水池 #${sel.index}`;
 if(sel.kind==='gate')return '石门';
 if(sel.kind==='exit')return '终点';
 if(sel.kind==='win')return layout.win?.kind==='zone'?'通关区':'通关线';
 if(sel.kind==='dress'){
  const d=layout.dressing?.[sel.index];
  return `${kitById(d?.kit??'')?.name??d?.kit??'摆件'} #${sel.index}`;
 }
 if(sel.kind==='sign')return `${layout.signs?.[sel.index]?.text||'路牌'} #${sel.index}`;
 if(sel.kind==='dew')return `露水 #${sel.index}`;
 if(sel.kind==='souvenir')return `${layout.souvenirs[sel.index]?.name??'纪念品'} #${sel.index}`;
 if(sel.kind==='plate')return `踏板 #${sel.index}`;
 if(sel.kind==='stake')return `木桩 #${sel.index}`;
 if(sel.kind==='checkpoint')return '检查点';
 if(sel.kind==='portal'){
  const p=layout.portals?.[sel.index];
  return `星门 ${p?.pair??''} #${sel.index}`;
 }
 if(sel.kind==='enemy'){
  const kind=layout.enemies[sel.index]?.kind??'';
  return `${KIT.find(k=>k.actorKind===kind)?.name??(kind||'敌人')} #${sel.index}`;
 }
 if(sel.kind==='hint')return `提示 #${sel.index}`;
 if(sel.kind==='area')return `${layout.areas[sel.index]?.name??'区域'} #${sel.index}`;
 return `${sel.kind} #${sel.index}`;
}

export function listOutliner(layout:LevelLayout):Record<OutlinerFolder,OutlinerRow[]>{
 const groups:Record<OutlinerFolder,OutlinerRow[]>={collision:[],scenery:[],placed:[],enemy:[],zone:[]};
 const add=(kind:string,index:number)=>{
  const folder=folderOf(kind);if(!folder)return;
  groups[folder].push({folder,kind,index,label:rowLabel(layout,{kind,index})});
 };
 layout.base.forEach((r,i)=>{if(r.kind!=='boundary')add('base',i);});
 if(layout.water.w>2)add('water',0);
 (layout.waters??[]).forEach((w,i)=>{
  if(w.x===layout.water.x&&w.y===layout.water.y&&w.w===layout.water.w&&w.h===layout.water.h)return;
  add('water',i+1);
 });
 if(layout.gate.w>2)add('gate',0);
 if(layout.exit)add('exit',0);
 add('win',0);
 (layout.dressing??[]).forEach((_,i)=>add('dress',i));
 (layout.signs??[]).forEach((_,i)=>add('sign',i));
 layout.dew.forEach((_,i)=>add('dew',i));
 layout.souvenirs.forEach((_,i)=>add('souvenir',i));
 layout.plates.forEach((p,i)=>{if(p.x<layout.width)add('plate',i);});
 layout.stakes.forEach((_,i)=>add('stake',i));
 add('checkpoint',0);
 (layout.portals??[]).forEach((_,i)=>add('portal',i));
 layout.enemies.forEach((_,i)=>add('enemy',i));
 (layout.hints??[]).forEach((_,i)=>add('hint',i));
 layout.areas.forEach((_,i)=>add('area',i));
 return groups;
}

export function sameSel(a?:Sel,b?:Sel){return !!a&&!!b&&a.kind===b.kind&&a.index===b.index;}

export function nextInStack(stack:Sel[],cur?:Sel){
 if(!stack.length)return undefined;
 if(!cur)return stack[0];
 const i=stack.findIndex(s=>sameSel(s,cur));
 return stack[i<0?0:(i+1)%stack.length];
}
