import {FOREST_LAYOUT} from '../content/chapter1/forest';
import {BRANCH_SLOTS,SPINE_CELLS} from './modules';
import {compileForest} from './compile';
import {reachable} from './reach';
import {solveRooms} from './solver';
import type {LevelLayout} from '../content/types';
import type {GridCell} from './types';

function slots():GridCell[]{
 return [
  ...SPINE_CELLS.map(s=>({col:s.col,row:s.row,locked:s.locked})),
  ...BRANCH_SLOTS.map(s=>({col:s.col,row:s.row,role:s.role})),
 ];
}

export function bakeForest(seed:number):LevelLayout{
 const cells=slots();
 for(let extra=0;extra<16;extra++){
  const layout=compileForest(FOREST_LAYOUT,solveRooms(cells,seed+extra*97));
  if(reachable(layout).ok)return layout;
 }
 return compileForest(FOREST_LAYOUT,solveRooms(cells,seed));
}

export function bakeVariants(){
 const a=FOREST_LAYOUT;
 const b=bakeForest(11);
 const c=bakeForest(29);
 return {a,b,c};
}
