import type {AbilitySystemComponent} from './asc';
import type {CueBus,FloaterKind} from './cues';

export type EffectSpec={
 damage?:number;
 heal?:number;
 ammo?:number;
 addTags?:string[];
 duration?:number;
 cue?:FloaterKind;
}

export function applyEffect(target:AbilitySystemComponent,spec:EffectSpec,at?:{x:number;y:number},cues?:CueBus){
 if(spec.damage){
  if(target.has('state.dead')||target.has('state.invuln')||target.has('state.dodge'))return false;
  target.attrs.hp=Math.max(0,target.attrs.hp-spec.damage);
  if(cues&&at)cues.spawn(at.x,at.y,`-${spec.damage}`,spec.cue??'hit');
  if(target.attrs.hp<=0)target.tags.add('state.dead');
 }
 if(spec.heal){
  const before=target.attrs.hp;
  target.attrs.hp=Math.min(target.attrs.maxHp,target.attrs.hp+spec.heal);
  if(target.attrs.hp>before&&cues&&at)cues.spawn(at.x,at.y,`+${spec.heal}`,'heal');
 }
 if(spec.ammo)target.attrs.ammo=Math.max(0,target.attrs.ammo+spec.ammo);
 if(spec.addTags){
  for(const tag of spec.addTags){
   if(spec.duration)target.hold(tag,spec.duration);
   else target.tags.add(tag);
  }
 }
 return true;
}
