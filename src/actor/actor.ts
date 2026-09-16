import type {AbilitySystemComponent} from '../gas/asc';

export const GROUNDED=new Set(['picnic','pig','hive','wolf','wolfb','boar','bear','eboar','cent','escort','herder','wk1','wk2','pale','grey','han','horn']);

export type Faction='player'|'enemy'|'neutral';

export type Actor={
 id:string;
 kind:string;
 x:number;y:number;w:number;h:number;
 vx:number;vy:number;
 hp:number;maxHp:number;
 asc?:AbilitySystemComponent;
 faction:Faction;
 facing:number;
 invuln:number;
 dead:boolean;
 state:string;
 timer:number;
 cooldown:number;
 patrol:number;
 homeX:number;
 homeY:number;
 skill:number;
 meleeCd:number;
 cycle:number;
 dodgeCd:number;
 hopCd:number;
}

export type Solid={x:number;y:number;w:number;h:number;oneWay?:boolean;kind?:string}

export function hitbox(a:Actor){return {x:a.x-a.w/2,y:a.y-a.h,w:a.w,h:a.h};}

export function overlaps(ax:number,ay:number,aw:number,ah:number,bx:number,by:number,bw:number,bh:number){
 return ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by;
}

const ARENA_MIN=4560,ARENA_MAX=5160;
const GRAVITY=1600;
const MAX_FALL=980;

function pushX(actor:Actor,solids:Solid[]){
 for(const solid of solids){
  if(solid.oneWay||solid.kind==='gate'||solid.kind==='pool')continue;
  const box=hitbox(actor);
  if(!overlaps(box.x,box.y,box.w,box.h,solid.x,solid.y,solid.w,solid.h))continue;
  const pushLeft=box.x+box.w-solid.x;
  const pushRight=solid.x+solid.w-box.x;
  if(pushLeft<pushRight)actor.x-=pushLeft;
  else actor.x+=pushRight;
  actor.vx=0;
 }
}

function land(actor:Actor,solids:Solid[],dt:number){
 const slop=Math.max(16,Math.abs(actor.vy)*dt+10);
 let floor:number|undefined;
 for(const solid of solids){
  if(solid.kind==='boundary'||solid.kind==='gate')continue;
  const left=actor.x-actor.w/2+6,right=actor.x+actor.w/2-6;
  if(right<=solid.x||left>=solid.x+solid.w)continue;
  const top=solid.y;
  if(actor.vy<0){
   if(solid.oneWay||solid.kind==='pool')continue;
   const head=actor.y-actor.h;
   if(head<solid.y+solid.h&&actor.y>solid.y+solid.h-slop){
    actor.y=solid.y+solid.h+actor.h;actor.vy=0;
   }
   continue;
  }
  if(actor.y>=top&&actor.y<=top+slop)floor=floor===undefined?top:Math.min(floor,top);
 }
 if(floor!==undefined){
  actor.y=floor;actor.vy=0;
  if(Math.abs(actor.homeY-floor)>20)actor.homeX=actor.x;
  actor.homeY=floor;
 }
}

export function resolveActor(actor:Actor,solids:Solid[],dt=0,skipGrav=false){
 if(actor.kind==='picnic'){
  if(actor.state!=='hop')actor.y=actor.homeY;
  pushX(actor,solids);
  if(actor.state!=='hop'&&actor.homeX>4400){
   actor.x=Math.max(ARENA_MIN,Math.min(ARENA_MAX,actor.x));
   actor.y=actor.homeY;
  }
  return;
 }
 pushX(actor,solids);
 if(!GROUNDED.has(actor.kind))return;
 if(dt>0&&!skipGrav){
  actor.vy=Math.min(MAX_FALL,actor.vy+GRAVITY*dt);
  actor.y+=actor.vy*dt;
 }
 land(actor,solids,dt);
}
