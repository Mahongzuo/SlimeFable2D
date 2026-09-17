import type {KitEntry} from '../kit/defs';
import {kitById} from '../kit/register';
import {DEFAULT_PICK_LOCK,EDITOR_MODES,folderOf,lockForMode,nextInStack,type EditorMode,type OutlinerFolder} from './outliner';
import {cloneDoc,sanitizeDoc,sanitizeOfficialDoc,isOfficialId,type MapDoc} from './schema';
import {applyKit,frameCamera,hitStack,type Sel} from './tools';

export type EditorTool='select'|'erase'|'pan'|string;

export type EditorSession={
 doc:MapDoc;
 tool:EditorTool;
 kit?:KitEntry;
 category:string;
 chapter:string;
 snap:number;
 cameraX:number;
 cameraY:number;
 sel?:Sel;
 drag?:{kind:'move'|'resize'|'place'|'pan'|'patrol';x:number;y:number;ox:number;oy:number;handle?:string};
 dirty:boolean;
 artTick:number;
 undo:string[];
 redo:string[];
 warn:string;
 mode:EditorMode;
 pickLock:OutlinerFolder[];
 foldClosed:OutlinerFolder[];
 query:string;
 hoverX:number;
 hoverY:number;
}

export function makeSession(doc:MapDoc):EditorSession{
 return {
  doc:cloneDoc(doc),tool:'select',category:'terrain',chapter:'',snap:16,
  cameraX:Math.max(0,doc.layout.checkpoint.x-400),cameraY:doc.layout.checkpoint.y>800?Math.max(-doc.layout.height+720,400-doc.layout.checkpoint.y):0,
  dirty:false,artTick:0,undo:[],redo:[],warn:'',
  mode:'all',pickLock:[...DEFAULT_PICK_LOCK],foldClosed:[],query:'',
  hoverX:0,hoverY:0,
 };
}

/** Switching mode rewrites the pick lock; `all` falls back to the default (zones locked). */
export function setMode(session:EditorSession,mode:EditorMode){
 session.mode=mode;
 session.pickLock=lockForMode(mode);
 if(session.sel&&mode!=='all'&&folderOf(session.sel.kind)!==mode)session.sel=undefined;
}

export const EDITOR_DRAFT_KEY='slime-fable-editor-draft';

export type EditorDraft={doc:MapDoc;cameraX:number;cameraY:number;mode:EditorMode;dirty:boolean;snap:number};

export function snapshotDraft(session:EditorSession):EditorDraft{
 return {doc:cloneDoc(session.doc),cameraX:session.cameraX,cameraY:session.cameraY,mode:session.mode,dirty:session.dirty,snap:session.snap};
}

/** Rebuild a session from a persisted draft; the doc is re-sanitised so a stale schema can't crash boot. */
export function sessionFromDraft(raw:unknown):EditorSession|undefined{
 if(!raw||typeof raw!=='object')return undefined;
 const d=raw as Partial<EditorDraft>;
 const id=(d.doc as MapDoc|undefined)?.id;
 const doc=(id&&isOfficialId(id)?sanitizeOfficialDoc(d.doc):sanitizeDoc(d.doc)).doc;
 if(!doc)return undefined;
 const session=makeSession(doc);
 if(typeof d.cameraX==='number')session.cameraX=d.cameraX;
 if(typeof d.cameraY==='number')session.cameraY=d.cameraY;
 if(typeof d.snap==='number')session.snap=d.snap;
 session.dirty=!!d.dirty;
 setMode(session,d.mode&&EDITOR_MODES.includes(d.mode)?d.mode:'all');
 return session;
}

function snapTo(n:number,snap:number){return snap?Math.round(n/snap)*snap:n;}

export function pushUndo(session:EditorSession){
 session.undo.push(JSON.stringify(session.doc));
 if(session.undo.length>80)session.undo.shift();
 session.redo.length=0;
}

export function undo(session:EditorSession){
 const prev=session.undo.pop();if(!prev)return;
 session.redo.push(JSON.stringify(session.doc));
 session.doc=JSON.parse(prev) as MapDoc;
 session.dirty=true;session.artTick++;session.sel=undefined;
}

export function redo(session:EditorSession){
 const next=session.redo.pop();if(!next)return;
 session.undo.push(JSON.stringify(session.doc));
 session.doc=JSON.parse(next) as MapDoc;
 session.dirty=true;session.artTick++;session.sel=undefined;
}

export function setTool(session:EditorSession,tool:EditorTool){
 session.tool=tool;
 session.kit=tool==='select'||tool==='erase'||tool==='pan'?undefined:kitById(tool);
}

export function pick(session:EditorSession,wx:number,wy:number,cycle=false){
 const stack=hitStack(session.doc.layout,wx,wy,session.pickLock);
 session.sel=cycle?nextInStack(stack,session.sel):stack[0];
}

export function togglePickLock(session:EditorSession,folder:OutlinerFolder){
 const i=session.pickLock.indexOf(folder);
 if(i>=0)session.pickLock.splice(i,1);
 else session.pickLock.push(folder);
}

export function toggleFold(session:EditorSession,folder:OutlinerFolder){
 const i=session.foldClosed.indexOf(folder);
 if(i>=0)session.foldClosed.splice(i,1);
 else session.foldClosed.push(folder);
}

export function frameSel(session:EditorSession){
 if(!session.sel)return;
 const cam=frameCamera(session.doc.layout,session.sel);
 if(!cam)return;
 session.cameraX=cam.cameraX;session.cameraY=cam.cameraY;
}

export function placeAt(session:EditorSession,wx:number,wy:number,w?:number,h?:number){
 const kit=session.kit;if(!kit)return;
 pushUndo(session);
 const x=snapTo(wx,session.snap),y=snapTo(wy,session.snap);
 applyKit(session.doc.layout,kit,{x,y,w,h});
 session.dirty=true;session.artTick++;
}

export function deleteSel(session:EditorSession){
 if(!session.sel)return;
 pushUndo(session);
 const layout=session.doc.layout;
 const sel=session.sel;
 if(sel.kind==='base')layout.base.splice(sel.index,1);
 if(sel.kind==='dew')layout.dew.splice(sel.index,1);
 if(sel.kind==='eco')layout.ecology?.interactables?.splice(sel.index,1);
 if(sel.kind==='fauna')layout.ecology?.fauna?.splice(sel.index,1);
 if(sel.kind==='enemy')layout.enemies.splice(sel.index,1);
 if(sel.kind==='souvenir')layout.souvenirs.splice(sel.index,1);
 if(sel.kind==='stake')layout.stakes.splice(sel.index,1);
 if(sel.kind==='plate')layout.plates.splice(sel.index,1);
 if(sel.kind==='dress')layout.dressing?.splice(sel.index,1);
 if(sel.kind==='portal')layout.portals?.splice(sel.index,1);
 if(sel.kind==='sign')layout.signs?.splice(sel.index,1);
 if(sel.kind==='hint')layout.hints?.splice(sel.index,1);
 if(sel.kind==='area')layout.areas.splice(sel.index,1);
 if(sel.kind==='water'&&sel.index>0)layout.waters?.splice(sel.index-1,1);
 if(sel.kind==='water'&&sel.index===0)layout.water={x:-9999,y:9999,w:1,h:1};
 if(sel.kind==='gate')layout.gate={x:layout.width+80,y:0,w:1,h:1,kind:'gate'};
 if(sel.kind==='win'){layout.win={kind:'line',x:layout.completeX};}
 if(sel.kind==='exit')layout.exit=undefined;
 session.sel=undefined;session.dirty=true;session.artTick++;
}

export function resizeWorld(session:EditorSession,width:number,height:number){
 pushUndo(session);
 const layout=session.doc.layout;
 layout.width=Math.max(1600,Math.min(12000,width));
 layout.height=Math.max(720,Math.min(4000,height));
 layout.fallY=layout.height-120;
 for(const r of layout.base){
  if(r.kind==='boundary'){
   if(r.x<0){r.h=layout.height+800;}
   else {r.x=layout.width;r.h=layout.height+800;}
  }
 }
 session.dirty=true;session.artTick++;
}
