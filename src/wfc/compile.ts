import {cloneLayout,type LevelLayout} from '../content/types';
import {FOREST_LAYOUT} from '../content/chapter1/forest';
import {cellOrigin,type Collapse} from './solver';

export function compileForest(base:LevelLayout,fill:Collapse[]):LevelLayout{
 const layout=cloneLayout(base);
 let n=0;
 for(const cell of fill){
  const o=cellOrigin(cell.col,cell.row);
  const tag=`${cell.module.id}-${cell.col}-${cell.row}`;
  for(const solid of cell.module.solids)layout.base.push({...solid,x:solid.x+o.x,y:solid.y+o.y});
  for(const dew of cell.module.dew)layout.dew.push({...dew,x:dew.x+o.x,y:dew.y+o.y,got:false,role:dew.role??'bonus'});
  for(const enemy of cell.module.enemies)layout.enemies.push({...enemy,id:`${enemy.kind}-${tag}-${n++}`,x:enemy.x+o.x,y:enemy.y+o.y});
  for(const souvenir of cell.module.souvenirs){
   if(layout.souvenirs.some(s=>s.id===souvenir.id))continue;
   layout.souvenirs.push({...souvenir,x:souvenir.x+o.x,y:souvenir.y+o.y,got:false});
  }
 }
 return layout;
}
