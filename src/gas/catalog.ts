import type {Actor} from '../actor/actor';
import type {CombatSystem} from '../combat/combat';
import type {AbilitySystemComponent} from './asc';

export type AbilityContext={
 self:AbilitySystemComponent;
 combat:CombatSystem;
 x:number;
 y:number;
 facing:number;
 targetX?:number;
 targetY?:number;
 home?:{id?:string;x:number;y:number};
 range?:number;
 name?:string;
 actors?:Actor[];
 spawn?:(kind:string,x:number,y:number)=>void;
 hitPlayer?:(damage:number,why:string)=>void;
}

export type AbilityDef={
 id:string;
 cooldown?:number;
 costAmmo?:number;
 blockedBy?:string[];
 activate:(ctx:AbilityContext)=>boolean;
}

export const ABILITIES:Record<string,AbilityDef>={
 'player.slash':{id:'player.slash',activate:ctx=>ctx.combat.slash(ctx.x,ctx.y,ctx.facing)},
 'player.shot':{id:'player.shot',costAmmo:1,blockedBy:['state.dead'],activate:ctx=>{
  ctx.combat.shoot(ctx.x,ctx.y-6,ctx.facing,ctx.home);
  return true;
 }},
 'player.dodge':{id:'player.dodge',cooldown:.7,blockedBy:['state.dead'],activate:ctx=>{
  ctx.self.hold('state.invuln',.28);
  return true;
 }},
 'enemy.melee':{id:'enemy.melee',activate:ctx=>{
  ctx.combat.bump(ctx.x,ctx.y,ctx.facing);
  if(ctx.hitPlayer&&ctx.targetX!=null&&ctx.targetY!=null&&Math.hypot(ctx.targetX-ctx.x,ctx.targetY-ctx.y)<(ctx.range??48)){
   ctx.hitPlayer(1,`${ctx.name??'敌人'}碰到了你`);
  }
  return true;
 }},
 'enemy.spore':{id:'enemy.spore',activate:ctx=>{ctx.combat.puff(ctx.x,ctx.y,ctx.facing);return true;}},
 'enemy.whip':{id:'enemy.whip',activate:ctx=>{ctx.combat.whip(ctx.x,ctx.y,ctx.facing);return true;}},
 'enemy.summon':{id:'enemy.summon',cooldown:5,activate:ctx=>{
  if(!ctx.spawn)return false;
  const pigs=ctx.actors?.filter(a=>a.kind==='pig'&&!a.dead)??[];
  if(pigs.length>=6)return true;
  const gap=72;
  const taken=(x:number)=>pigs.some(p=>Math.abs(p.x-x)<gap)||Math.abs(x-ctx.x)<40;
  const side=ctx.facing>0?1:-1;
  for(let i=1;i<=8;i++){
   for(const dir of [side,-side]){
    const x=ctx.x+dir*i*gap;
    if(!taken(x)){ctx.spawn('pig',x,ctx.y);return true;}
   }
  }
  return true;
 }},
 'enemy.melon':{id:'enemy.melon',activate:ctx=>{
  if(ctx.targetX==null||ctx.targetY==null)return false;
  ctx.combat.shootAimed(ctx.x,ctx.y,ctx.targetX,ctx.targetY);return true;
 }},
 'enemy.ult':{id:'enemy.ult',activate:ctx=>{
  if(ctx.targetX==null||ctx.targetY==null)return false;
  ctx.combat.fanArrows(ctx.x,ctx.y,ctx.targetX,ctx.targetY);return true;
 }},
 'enemy.bow':{id:'enemy.bow',activate:ctx=>{
  if(ctx.targetX==null||ctx.targetY==null)return false;
  ctx.combat.shootAimed(ctx.x,ctx.y,ctx.targetX,ctx.targetY);return true;
 }},
 'enemy.magic':{id:'enemy.magic',activate:ctx=>{
  if(ctx.targetX==null||ctx.targetY==null)return false;
  ctx.combat.castBolt(ctx.x,ctx.y,ctx.targetX,ctx.targetY);return true;
 }},
};

export function tryActivate(asc:AbilitySystemComponent,id:string,ctx:AbilityContext){
 const def=ABILITIES[id];
 if(!def)return false;
 if(def.blockedBy?.some(tag=>asc.has(tag)))return false;
 if(asc.cooling(id))return false;
 if(def.costAmmo&&asc.attrs.ammo<def.costAmmo)return false;
 if(def.costAmmo)asc.attrs.ammo-=def.costAmmo;
 const ok=def.activate(ctx);
 if(ok&&def.cooldown)asc.setCd(id,def.cooldown);
 if(!ok&&def.costAmmo)asc.attrs.ammo+=def.costAmmo;
 return ok;
}
