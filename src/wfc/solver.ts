import {modulesFor} from './modules';
import type {RoomModule} from './types';
import type {Socket} from './types';
import {CELL_W,CELL_H,GRID_COLS,GRID_ROWS,type GridCell} from './types';

function compatible(a:Socket,b:Socket){
 if(a==='closed'||b==='closed')return a==='closed'&&b==='closed';
 if(a==='climb'||b==='climb')return a==='climb'&&(b==='climb'||b==='walk');
 return true;
}

function seedRng(seed:number){
 return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
}

export type Collapse={col:number;row:number;module:RoomModule}

export function solveRooms(slots:GridCell[],seed:number):Collapse[]{
 const rand=seedRng(seed);
 const cells=slots.filter(s=>!s.locked).map(s=>({
  col:s.col,row:s.row,
  options:modulesFor(s.role),
 }));
 const picked:Collapse[]=[];
 for(let step=0;step<cells.length+8;step++){
  const open=cells.filter(c=>!picked.some(p=>p.col===c.col&&p.row===c.row)&&c.options.length);
  if(!open.length)break;
  open.sort((a,b)=>a.options.length-b.options.length);
  const cell=open[0];
  const choice=cell.options[Math.floor(rand()*cell.options.length)]??cell.options[0];
  if(!choice)break;
  picked.push({col:cell.col,row:cell.row,module:choice});
  cell.options=[choice];
  for(const other of cells){
   if(other===cell||picked.some(p=>p.col===other.col&&p.row===other.row))continue;
   const next=other.options.filter(mod=>{
    if(other.col===cell.col+1&&other.row===cell.row)return compatible(choice.sockets.e,mod.sockets.w);
    if(other.col===cell.col-1&&other.row===cell.row)return compatible(choice.sockets.w,mod.sockets.e);
    if(other.row===cell.row+1&&other.col===cell.col)return compatible(choice.sockets.s,mod.sockets.n);
    if(other.row===cell.row-1&&other.col===cell.col)return compatible(choice.sockets.n,mod.sockets.s);
    return true;
   });
   other.options=next.length?next:modulesFor(slots.find(s=>s.col===other.col&&s.row===other.row)?.role);
  }
 }
 for(const cell of cells){
  if(picked.some(p=>p.col===cell.col&&p.row===cell.row))continue;
  const choice=cell.options[0]??modulesFor()[0];
  if(choice)picked.push({col:cell.col,row:cell.row,module:choice});
 }
 return picked;
}

export function cellOrigin(col:number,row:number){return {x:col*CELL_W,y:row*CELL_H};}

export function inGrid(col:number,row:number){return col>=0&&row>=0&&col<GRID_COLS&&row<GRID_ROWS;}
