import {resolveActor,type Actor,type Solid} from '../actor/actor';
import {AbilitySystemComponent} from '../gas/asc';
import {applyEffect} from '../gas/effects';
import type {CueBus} from '../gas/cues';

export type SkillKind='melee'|'spore'|'whip'|'summon'|'melon'|'ult'|'bow'|'magic'
export type Skill={name:string;telegraph:number;recover:number;cooldown:number;damage:number;range:number;kind:SkillKind}
export type EnemyDef={kind:string;name:string;w:number;h:number;hp:number;speed:number;skills:Skill[];drop?:{id:string;chance:number};boss?:boolean;melee?:Skill;chase?:number}

export const ENEMIES:Record<string,EnemyDef>={
 cap:{kind:'cap',name:'帽菇仔',w:44,h:48,hp:3,speed:36,skills:[{name:'bump',telegraph:.28,recover:.28,cooldown:.9,damage:1,range:48,kind:'melee'}],drop:{id:'leaf',chance:.7}},
 spore:{kind:'spore',name:'孢子菇',w:46,h:54,hp:4,speed:8,skills:[{name:'puff',telegraph:.45,recover:.5,cooldown:1.6,damage:1,range:220,kind:'spore'}],drop:{id:'spore',chance:1}},
 vine:{kind:'vine',name:'藤鞭蕨',w:42,h:68,hp:5,speed:0,skills:[{name:'whip',telegraph:.36,recover:.4,cooldown:1.3,damage:1,range:86,kind:'whip'}],drop:{id:'leaf',chance:.5}},
 pig:{kind:'pig',name:'野餐猪',w:52,h:34,hp:3,speed:96,chase:460,skills:[{name:'charge',telegraph:.22,recover:.36,cooldown:.7,damage:1,range:64,kind:'melee'}],drop:{id:'leaf',chance:.4}},
 picnic:{kind:'picnic',name:'南宫师姐',w:58,h:118,hp:20,speed:26,boss:true,melee:{name:'swipe',telegraph:.42,recover:.4,cooldown:.85,damage:1,range:78,kind:'melee'},skills:[
  {name:'melon',telegraph:.55,recover:.5,cooldown:2.8,damage:1,range:280,kind:'melon'},
  {name:'ult',telegraph:1.05,recover:1.15,cooldown:7.2,damage:2,range:280,kind:'ult'},
 ]},
 hive:{kind:'hive',name:'西瓜大王',w:58,h:118,hp:18,speed:28,boss:true,melee:{name:'swipe',telegraph:.4,recover:.38,cooldown:.8,damage:1,range:76,kind:'melee'},skills:[
  {name:'bow',telegraph:.5,recover:.45,cooldown:2.2,damage:1,range:300,kind:'bow'},
  {name:'magic',telegraph:.55,recover:.5,cooldown:2.6,damage:1,range:300,kind:'magic'},
 ]},
};

export type WorldView={playerX:number;playerY:number;dt:number;solids?:Solid[];incomingMelee?:boolean;incomingShot?:boolean;playerGrounded?:boolean}

const DODGE_TIME=.45;
const HOP_TIME=.55;
const DODGE_CD=5;
const HOP_CD=10;
const DODGE_SPEED=380;
const HOP_SPEED=90;
const HOP_VY=-380;
const HOP_GRAVITY=1100;
const CHASE_BAND=140;

const CHASE_RANGE=520;
const CHASE_SPEED=70;

export function activeSkill(actor:Actor,def:EnemyDef){
 if(actor.skill<0&&def.melee)return def.melee;
 return def.skills[Math.max(0,actor.skill)%def.skills.length];
}

function settle(actor:Actor,view:WorldView){
 if(view.solids)resolveActor(actor,view.solids);
 else if(actor.state!=='hop'&&(actor.kind==='picnic'||actor.kind==='pig'||actor.kind==='hive'))actor.y=actor.homeY;
}

function onFloor(x:number,y:number,solids?:Solid[]){
 if(!solids)return true;
 return solids.some(s=>{
  if(s.kind==='boundary'||s.kind==='gate')return false;
  return x>s.x+6&&x<s.x+s.w-6&&s.y>=y-16&&s.y<=y+56;
 });
}

function stepX(actor:Actor,view:WorldView,dx:number){
 const next=actor.x+dx;
 const feet=actor.state==='hop'?actor.homeY:actor.y;
 if(view.solids&&!onFloor(next,feet,view.solids)){actor.vx=0;return false;}
 actor.x=next;return true;
}

function facePlayer(actor:Actor,dx:number){
 if(Math.abs(dx)>2)actor.facing=dx>0?1:-1;
}

function sameBand(actor:Actor,view:WorldView){
 if(Math.abs(view.playerY-actor.y)>CHASE_BAND)return false;
 if(view.playerGrounded===false&&Math.abs(view.playerY-actor.y)>48)return false;
 return true;
}

function chaseMove(actor:Actor,view:WorldView,dx:number,speed=CHASE_SPEED){
 const want=Math.abs(dx)<22?0:(dx>0?1:-1)*speed;
 actor.vx+=(want-actor.vx)*Math.min(1,view.dt*10);
 if(Math.abs(actor.vx)>6)actor.facing=actor.vx>0?1:-1;
 else facePlayer(actor,dx);
 stepX(actor,view,actor.vx*view.dt);
 settle(actor,view);
}

function huntRange(def:EnemyDef,skill:Skill){
 return def.chase??(def.boss?CHASE_RANGE:skill.range+70);
}

function beginMelee(actor:Actor,def:EnemyDef){
 actor.skill=-1;
 actor.state='telegraph';
 actor.timer=def.melee!.telegraph;
}

function beginNextSkill(actor:Actor,def:EnemyDef){
 actor.cycle=(actor.cycle+1)%def.skills.length;
 actor.skill=actor.cycle;
 actor.state='telegraph';
 actor.timer=def.skills[actor.skill].telegraph;
}

function beginDodge(actor:Actor,kind:'dodge'|'hop',view:WorldView){
 const away=Math.sign(actor.x-view.playerX)||-(actor.facing||1);
 actor.state=kind;
 actor.timer=kind==='dodge'?DODGE_TIME:HOP_TIME;
 actor.invuln=actor.timer;
 actor.vx=away*(kind==='dodge'?DODGE_SPEED:HOP_SPEED);
 actor.vy=kind==='hop'?HOP_VY:0;
 if(kind==='dodge')actor.dodgeCd=DODGE_CD;
 else actor.hopCd=HOP_CD;
 actor.asc?.hold('state.dodge',actor.timer);
 actor.asc?.hold('state.invuln',actor.timer);
}

const DIE_TIME=1.05;

export function stepMachine(actor:Actor,def:EnemyDef,view:WorldView){
 if(actor.state==='dying'){
  actor.timer=Math.max(0,actor.timer-view.dt);
  if(actor.timer<=0)actor.state='dead';
  return;
 }
 if(actor.dead){actor.state='dead';return;}
 actor.timer=Math.max(0,actor.timer-view.dt);
 actor.cooldown=Math.max(0,actor.cooldown-view.dt);
 actor.meleeCd=Math.max(0,actor.meleeCd-view.dt);
 actor.dodgeCd=Math.max(0,actor.dodgeCd-view.dt);
 actor.hopCd=Math.max(0,actor.hopCd-view.dt);
 actor.invuln=Math.max(0,actor.invuln-view.dt);
 const dx=view.playerX-actor.x,dist=Math.hypot(dx,view.playerY-actor.y);
 const skill=activeSkill(actor,def);
 const hunt=huntRange(def,skill);
 if((actor.kind==='hive'||actor.kind==='picnic')&&actor.state!=='dodge'&&actor.state!=='hop'&&actor.state!=='dead'&&actor.state!=='reel'&&actor.state!=='dying'){
  if(view.incomingMelee&&actor.dodgeCd<=0){beginDodge(actor,'dodge',view);return;}
  if(view.incomingShot&&actor.hopCd<=0){beginDodge(actor,'hop',view);return;}
 }
 if(actor.state==='dodge'||actor.state==='hop'){
  if(actor.state==='hop'){
   actor.vy+=HOP_GRAVITY*view.dt;
   actor.y+=actor.vy*view.dt;
   if(actor.y>=actor.homeY){actor.y=actor.homeY;actor.vy=0;}
  }
  stepX(actor,view,actor.vx*view.dt);
  actor.vx*=Math.max(0,1-view.dt*3.2);
  settle(actor,view);
  facePlayer(actor,dx);
  if(actor.timer<=0){
   if(actor.state==='hop'){actor.y=actor.homeY;actor.vy=0;}
   actor.vx=0;
   actor.state=(def.boss||def.chase)&&dist<hunt&&sameBand(actor,view)?'chase':dist<skill.range+40&&sameBand(actor,view)?'alert':'patrol';
  }
  return;
 }
 if(actor.state==='hurt'){
  if(actor.timer<=0)actor.state=(def.boss||def.chase)&&dist<hunt&&sameBand(actor,view)?'chase':dist<skill.range+40&&sameBand(actor,view)?'alert':'patrol';
  return;
 }
 if(actor.state==='dead'||actor.state==='reel')return;
 if(actor.state==='idle'){actor.state='patrol';actor.timer=1.2;return;}
 if(actor.state==='patrol'){
  if(def.speed>0){
   if(Math.abs(actor.x-actor.homeX)>actor.patrol)actor.facing=actor.x>actor.homeX?-1:1;
   actor.vx=actor.facing*def.speed;
   if(!stepX(actor,view,actor.vx*view.dt))actor.facing=-actor.facing;
   settle(actor,view);
  }
  if(def.boss||def.chase){
   if(dist<hunt&&sameBand(actor,view)){actor.state='chase';actor.timer=0;}
   return;
  }
  if(dist<skill.range+70&&sameBand(actor,view)){actor.state='alert';actor.timer=.2;}
  return;
 }
 if(actor.state==='chase'||(def.boss&&actor.state==='alert')||(def.chase&&actor.state==='alert')){
  if(!sameBand(actor,view)||(!def.boss&&dist>hunt+80)){actor.state='patrol';actor.vx=0;return;}
  actor.state='chase';
  chaseMove(actor,view,dx,def.boss?CHASE_SPEED:Math.max(def.speed,CHASE_SPEED));
  if(def.melee&&dist<=def.melee.range&&actor.meleeCd<=0){beginMelee(actor,def);return;}
  const next=def.skills[(actor.cycle+1)%def.skills.length];
  if(actor.cooldown<=0&&dist<=next.range){
   if(def.boss)beginNextSkill(actor,def);
   else {actor.state='telegraph';actor.timer=next.telegraph;}
  }
  return;
 }
 if(actor.state==='alert'){
  facePlayer(actor,dx);
  if(def.kind==='pig'&&dist>48){
   actor.vx=actor.facing*def.speed*1.35;
   stepX(actor,view,actor.vx*view.dt);settle(actor,view);
  }
  if(actor.timer<=0){
   if(dist<=skill.range&&actor.cooldown<=0&&sameBand(actor,view)){
    if(def.skills.length>1)actor.skill=(actor.skill+1)%def.skills.length;
    actor.state='telegraph';actor.timer=activeSkill(actor,def).telegraph;
   }else actor.state=dist<hunt&&sameBand(actor,view)?'chase':'patrol';
  }
  return;
 }
 if(actor.state==='telegraph'){
  facePlayer(actor,dx);
  if(actor.timer<=0){actor.state='attack';actor.timer=actor.skill<0?.45:.12;}
  return;
 }
 if(actor.state==='attack'){
  facePlayer(actor,dx);
  if(actor.timer<=0){
   actor.state='recover';
   actor.timer=skill.recover;
   if(actor.skill<0&&def.melee)actor.meleeCd=def.melee.cooldown;
   else actor.cooldown=skill.cooldown;
  }
  return;
 }
 if(actor.state==='recover'){
  facePlayer(actor,dx);
  if(actor.timer<=0)actor.state=(def.boss||def.chase)&&dist<hunt&&sameBand(actor,view)?'chase':dist<skill.range+50&&sameBand(actor,view)?'alert':'patrol';
 }
}

export function ensureAsc(actor:Actor){
 if(!actor.asc)actor.asc=new AbilitySystemComponent({hp:actor.hp,maxHp:actor.maxHp||actor.hp,attack:1});
 actor.asc.attrs.hp=actor.hp;
 actor.asc.attrs.maxHp=actor.maxHp||actor.asc.attrs.maxHp||actor.hp;
 return actor.asc;
}

export function hurtActor(actor:Actor,amount:number,cues?:CueBus){
 if(actor.dead||actor.invuln>0||actor.state==='reel'||actor.state==='dodge'||actor.state==='hop')return false;
 const asc=ensureAsc(actor);
 if(asc.has('state.invuln')||asc.has('state.dodge')||asc.has('state.dead'))return false;
 if(!applyEffect(asc,{damage:amount,addTags:['state.invuln'],duration:.35,cue:'hit'},{x:actor.x,y:actor.y-actor.h*.55},cues))return false;
 actor.hp=asc.attrs.hp;actor.invuln=.35;actor.state='hurt';actor.timer=.22;
 if(actor.hp<=0){
  actor.hp=0;actor.dead=true;asc.tags.add('state.dead');
  if(actor.kind==='hive'||actor.kind==='picnic'){actor.state='dying';actor.timer=DIE_TIME;}
  else actor.state='dead';
 }
 return true;
}

export function makeActor(kind:string,x:number,y:number,id:string,patrol=50):Actor{
 const def=ENEMIES[kind]??ENEMIES.cap;
 const asc=new AbilitySystemComponent({hp:def.hp,maxHp:def.hp,attack:1});
 if(def.boss)asc.tags.add('boss');
 return {
  id,kind,x,y,w:def.w,h:def.h,vx:0,vy:0,
  hp:def.hp,maxHp:def.hp,asc,faction:'enemy',facing:x>400?-1:1,
  invuln:0,dead:false,state:'idle',timer:0,cooldown:0,patrol,homeX:x,homeY:y,
  skill:def.skills.length>1?-1:0,meleeCd:0,cycle:-1,dodgeCd:0,hopCd:0,
 };
}
