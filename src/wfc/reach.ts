import type {LevelLayout} from '../content/types';

type Node={x:number;y:number}

function samples(layout:LevelLayout):Node[]{
 const pts:Node[]=[{x:layout.checkpoint.x,y:layout.checkpoint.y}];
 for(const s of layout.base){
  if(s.kind==='boundary')continue;
  if(s.kind==='pool'){
   for(let x=s.x+20;x<s.x+s.w;x+=56)pts.push({x,y:s.y-8});
   continue;
  }
  if(s.w<=36&&s.h>80){
   for(let y=s.y+16;y<=s.y+s.h;y+=40)pts.push({x:s.x+s.w/2,y});
  }else{
   for(let x=s.x+18;x<s.x+s.w;x+=48)pts.push({x,y:s.y});
  }
 }
 pts.push({x:layout.water.x+layout.water.w/2,y:layout.water.y});
 pts.push({x:layout.completeX,y:600});
 for(const d of layout.dew)pts.push({x:d.x,y:d.y+20});
 return pts;
}

function linked(a:Node,b:Node){
 const dx=Math.abs(a.x-b.x),dy=b.y-a.y;
 if(dx<120&&Math.abs(dy)<40)return true;
 if(dx<280&&dy>-220&&dy<460)return true;
 if(dx<70&&Math.abs(dy)<280)return true;
 return false;
}

export function reachable(layout:LevelLayout){
 const nodes=samples(layout);
 const seen=new Set<number>([0]);
 const queue=[0];
 while(queue.length){
  const i=queue.pop()!;
  for(let j=0;j<nodes.length;j++){
   if(seen.has(j)||!linked(nodes[i],nodes[j]))continue;
   seen.add(j);queue.push(j);
  }
 }
 const can=(x:number,y:number)=>[...seen].some(i=>Math.hypot(nodes[i].x-x,nodes[i].y-y)<180);
 const dew=layout.dew.filter(d=>d.role!=='bonus').every(d=>can(d.x,d.y));
 const exit=can(layout.completeX,600);
 return {dew,exit,ok:dew&&exit,visited:seen.size};
}
