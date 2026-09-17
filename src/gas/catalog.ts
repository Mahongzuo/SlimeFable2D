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
 h?:number;
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
  const kind=ctx.name==='牧鹰人'?'boar':ctx.name==='狼王'?'wolf':'eboar';
  const cap=kind==='wolf'?2:kind==='boar'?1:4;
  const pack=ctx.actors?.filter(a=>a.kind===kind&&!a.dead)??[];
  if(pack.length>=cap)return true;
  const gap=72;
  const taken=(x:number)=>pack.some(p=>Math.abs(p.x-x)<gap)||Math.abs(x-ctx.x)<40;
  const side=ctx.facing>0?1:-1;
  for(let i=1;i<=8;i++){
   for(const dir of [side,-side]){
    const x=ctx.x+dir*i*gap;
    if(!taken(x)){ctx.spawn(kind,x,ctx.y);return true;}
   }
  }
  return true;
 }},
 'enemy.charge':{id:'enemy.charge',activate:ctx=>{
  ctx.combat.charge(ctx.x,ctx.y,ctx.facing,ctx.h);
  if(ctx.name==='毒纹猪')ctx.combat.puddle(ctx.x,ctx.y);
  const mid=ctx.y-(ctx.h??42)*.5;
  if(ctx.hitPlayer&&ctx.targetX!=null&&Math.hypot(ctx.targetX-ctx.x,(ctx.targetY??mid)-mid)<(ctx.range??70))ctx.hitPlayer(1,`${ctx.name??'敌人'}撞到了你`);
  return true;
 }},
 'enemy.slam':{id:'enemy.slam',activate:ctx=>{
  ctx.combat.slam(ctx.x,ctx.y,ctx.name==='裂纹熊'?110:90);
  if(ctx.name==='毒纹猪')ctx.combat.puddle(ctx.x,ctx.y,52);
  if(ctx.hitPlayer&&ctx.targetX!=null&&Math.hypot(ctx.targetX-ctx.x,(ctx.targetY??ctx.y)-ctx.y)<100)ctx.hitPlayer(1,`${ctx.name??'敌人'}拍地砸到了你`);
  return true;
 }},
 'enemy.howl':{id:'enemy.howl',activate:ctx=>{
  ctx.combat.burst('shock',ctx.x,ctx.y-24,.4,.55);
  ctx.actors?.forEach(a=>{
   if((a.kind==='wolf'||a.kind==='wolfb'||a.kind==='wk1'||a.kind==='wk2')&&!a.dead)a.asc?.hold('state.haste',4);
  });
  if(ctx.name==='狼王'&&ctx.spawn){
   const pack=ctx.actors?.filter(a=>a.kind==='wolf'&&!a.dead)??[];
   if(pack.length<2)ctx.spawn('wolf',ctx.x+ctx.facing*80,ctx.y);
  }
  return true;
 }},
 'enemy.pounce':{id:'enemy.pounce',activate:ctx=>{
  ctx.combat.charge(ctx.x,ctx.y,ctx.facing,ctx.h);
  const mid=ctx.y-(ctx.h??42)*.5;
  if(ctx.hitPlayer&&ctx.targetX!=null&&Math.hypot(ctx.targetX-ctx.x,(ctx.targetY??mid)-mid)<(ctx.range??90))ctx.hitPlayer(1,`${ctx.name??'敌人'}扑到了你`);
  return true;
 }},
 'enemy.parry':{id:'enemy.parry',activate:ctx=>{
  ctx.combat.burst('slash',ctx.x+ctx.facing*20,ctx.y-40,.35,.55);
  ctx.combat.bump(ctx.x,ctx.y,ctx.facing);
  if(ctx.hitPlayer&&ctx.targetX!=null&&Math.hypot(ctx.targetX-ctx.x,(ctx.targetY??ctx.y)-ctx.y)<86)ctx.hitPlayer(1,'镖师反击打中了你');
  return true;
 }},
 'enemy.spit':{id:'enemy.spit',activate:ctx=>{
  ctx.combat.puff(ctx.x,ctx.y,ctx.facing);
  if(ctx.targetX!=null&&ctx.targetY!=null)ctx.combat.frost(ctx.x,ctx.y,ctx.targetX,ctx.targetY);
  return true;
 }},
 'enemy.hawk':{id:'enemy.hawk',activate:ctx=>{
  if(ctx.targetX==null||ctx.targetY==null)return false;
  ctx.combat.hawk(ctx.x,ctx.y,ctx.targetX,ctx.targetY);return true;
 }},
 'enemy.drain':{id:'enemy.drain',activate:ctx=>{
  if(ctx.targetX==null||ctx.targetY==null)return false;
  ctx.combat.drain(ctx.x,ctx.y,ctx.targetX,ctx.targetY);
  if(ctx.name==='苍白潮客')ctx.combat.castBolt(ctx.x,ctx.y-30,ctx.targetX,ctx.targetY);
  return true;
 }},
 'enemy.clone':{id:'enemy.clone',activate:ctx=>{
  ctx.combat.mistDash(ctx.x,ctx.y,1);
  ctx.combat.mistDash(ctx.x,ctx.y,-1);
  if(ctx.targetX!=null&&ctx.targetY!=null){
   ctx.combat.castBolt(ctx.x-36,ctx.y,ctx.targetX,ctx.targetY);
   ctx.combat.castBolt(ctx.x+36,ctx.y,ctx.targetX,ctx.targetY);
  }
  if(ctx.name==='苍白潮客')ctx.combat.flood(1220,8);
  return true;
 }},
 'enemy.dragon':{id:'enemy.dragon',activate:ctx=>{ctx.combat.dragon(ctx.x,ctx.y);return true;}},
 'enemy.mist':{id:'enemy.mist',activate:ctx=>{ctx.combat.mistDash(ctx.x,ctx.y,ctx.facing);return true;}},
 'enemy.gale':{id:'enemy.gale',activate:ctx=>{
  ctx.combat.gale(ctx.x,ctx.y,ctx.facing);
  if(ctx.targetX!=null&&ctx.targetY!=null)ctx.combat.shootAimed(ctx.x,ctx.y,ctx.targetX,ctx.targetY);
  return true;
 }},
 'enemy.ring':{id:'enemy.ring',activate:ctx=>{ctx.combat.ring(ctx.x,ctx.y);return true;}},
 'enemy.frost':{id:'enemy.frost',activate:ctx=>{
  if(ctx.targetX==null||ctx.targetY==null)return false;
  ctx.combat.frost(ctx.x,ctx.y,ctx.targetX,ctx.targetY);return true;
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
