import type {AbilitySystemComponent} from '../gas/asc';

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

export function resolveActor(actor:Actor,solids:Solid[]){
 const grounded=actor.state!=='hop'&&(actor.kind==='picnic'||actor.kind==='pig'||actor.kind==='hive');
 if(grounded)actor.y=actor.homeY;
 for(const solid of solids){
  if(solid.oneWay)continue;
  const box=hitbox(actor);
  if(!overlaps(box.x,box.y,box.w,box.h,solid.x,solid.y,solid.w,solid.h))continue;
  const pushLeft=box.x+box.w-solid.x;
  const pushRight=solid.x+solid.w-box.x;
  if(pushLeft<pushRight)actor.x-=pushLeft;
  else actor.x+=pushRight;
  actor.vx=0;
 }
 if(grounded&&actor.homeX>4400){
  actor.x=Math.max(ARENA_MIN,Math.min(ARENA_MAX,actor.x));
  actor.y=actor.homeY;
 }
}
