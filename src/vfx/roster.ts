import type {Actor} from '../actor/actor';
import {ENEMIES,activeSkill} from '../ai/machine';
import type {SpineSpec} from './spine-actor';

function beastAnim(actor:Actor){
 if(actor.state==='dying'||actor.state==='dead')return 'die';
 if(actor.state==='hurt')return 'hurt';
 if(actor.state==='hop')return 'jump';
 if(actor.state==='telegraph'||actor.state==='attack'||actor.state==='recover'){
  const def=ENEMIES[actor.kind];
  const skill=def?activeSkill(actor,def):undefined;
  if(skill?.kind==='charge'||skill?.kind==='pounce')return 'run_skill1';
  if(skill?.kind==='howl'||skill?.kind==='slam')return 'skill2';
  if(skill?.kind==='spit'||skill?.kind==='hawk'||skill?.kind==='frost')return 'skill3';
  if(skill?.kind==='parry')return 'skill2';
  return 'skill1';
 }
 if(actor.state==='chase'||actor.state==='alert')return 'run';
 if(actor.state==='patrol')return 'walk';
 return 'idle';
}

function humanAnim(actor:Actor){
 if(actor.state==='dying'||actor.state==='dead')return 'die';
 if(actor.state==='dodge')return 'roll';
 if(actor.state==='hop')return 'jumping2nd';
 if(actor.state==='hurt')return 'hurt';
 if(actor.state==='telegraph'||actor.state==='attack'||actor.state==='recover'){
  if(actor.skill<0)return 'weaponskill07_1';
  const def=ENEMIES[actor.kind];
  const skill=def?activeSkill(actor,def):undefined;
  if(skill?.kind==='bow'||skill?.kind==='hawk')return 'weaponskill02_1';
  if(skill?.kind==='ult'||skill?.kind==='gale'||skill?.kind==='ring'||skill?.kind==='dragon')return 'weaponskill05_123';
  if(skill?.kind==='magic'||skill?.kind==='drain'||skill?.kind==='clone'||skill?.kind==='mist')return 'weaponskill05_1';
  return 'weaponskill07_1';
 }
 if(actor.state==='chase'||actor.state==='alert')return 'run';
 if(actor.state==='patrol')return 'walk';
 return 'idle';
}

function beast(dir:string,file:string,scale=.42,draw=280):SpineSpec{
 return {dir:`beasts/${dir}/`,atlas:`${file}.atlas`,json:`${file}.json`,scale,draw,pma:true,anim:beastAnim};
}

function human(dir:string,file:string):SpineSpec{
 return {dir:`${dir}/`,atlas:`${file}.atlas`,json:`${file}.json`,scale:.62,draw:240,pma:false,human:true,anim:humanAnim};
}

export const SPINE_SPECS:Record<string,SpineSpec>={
 wolf:beast('wolf','角色8',.48,280),
 wolfb:beast('wolfb','角色9',.4,320),
 boar:beast('boar','角色13',.5,260),
 bear:beast('bear','角色12',.46,300),
 eboar:beast('eboar','角色15',.5,260),
 cent:beast('cent','角色14',.42,300),
 escort:beast('escort','角色16',.38,320),
 herder:beast('herder','角色17',.38,320),
 wk1:beast('wk1','角色10',.42,320),
 wk2:beast('wk2','角色11',.5,280),
 pig:beast('boar','角色13',.5,260),
 pale:human('pale','pale'),
 grey:human('grey','grey'),
 han:human('han','han'),
 horn:human('horn','horn'),
};
