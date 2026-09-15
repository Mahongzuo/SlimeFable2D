import type {KitEntry} from '../kit/defs';
import {kitById} from '../kit/register';
import {cloneDoc,type MapDoc} from './schema';
import {applyKit,hitTest,type Sel} from './tools';

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
}

export function makeSession(doc:MapDoc):EditorSession{
 return {
  doc:cloneDoc(doc),tool:'select',category:'terrain',chapter:'',snap:16,
  cameraX:Math.max(0,doc.layout.checkpoint.x-400),cameraY:0,
  dirty:false,artTick:0,undo:[],redo:[],warn:'',
 };
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

export function pick(session:EditorSession,wx:number,wy:number){
 session.sel=hitTest(session.doc.layout,wx,wy);
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
 if(sel.kind==='enemy')layout.enemies.splice(sel.index,1);
 if(sel.kind==='souvenir')layout.souvenirs.splice(sel.index,1);
 if(sel.kind==='stake')layout.stakes.splice(sel.index,1);
 if(sel.kind==='plate')layout.plates.splice(sel.index,1);
 if(sel.kind==='dress')layout.dressing?.splice(sel.index,1);
 if(sel.kind==='sign')layout.signs?.splice(sel.index,1);
 if(sel.kind==='hint')layout.hints?.splice(sel.index,1);
 if(sel.kind==='water'&&sel.index>0)layout.waters?.splice(sel.index-1,1);
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
