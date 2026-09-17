import {GROUNDED,resolveActor,type Actor,type Solid} from '../actor/actor';
import {AbilitySystemComponent} from '../gas/asc';
import {applyEffect} from '../gas/effects';
import type {CueBus} from '../gas/cues';

export type SkillKind='melee'|'spore'|'whip'|'summon'|'melon'|'ult'|'bow'|'magic'|'charge'|'slam'|'howl'|'pounce'|'parry'|'spit'|'hawk'|'drain'|'clone'|'dragon'|'mist'|'gale'|'ring'|'frost'
export type Skill={name:string;telegraph:number;recover:number;cooldown:number;damage:number;range:number;kind:SkillKind}
export type EnemyDef={kind:string;name:string;w:number;h:number;hp:number;speed:number;skills:Skill[];drop?:{id:string;chance:number};boss?:boolean;gate?:boolean;melee?:Skill;chase?:number;kite?:number}

export const ENEMIES:Record<string,EnemyDef>={
 cap:{kind:'cap',name:'帽菇仔',w:44,h:48,hp:3,speed:36,skills:[{name:'bump',telegraph:.28,recover:.28,cooldown:.9,damage:1,range:48,kind:'melee'}],drop:{id:'leaf',chance:.7}},
 spore:{kind:'spore',name:'孢子菇',w:46,h:54,hp:4,speed:8,skills:[{name:'puff',telegraph:.45,recover:.5,cooldown:1.6,damage:1,range:220,kind:'spore'}],drop:{id:'spore',chance:1}},
 vine:{kind:'vine',name:'藤鞭蕨',w:42,h:68,hp:5,speed:0,skills:[{name:'whip',telegraph:.36,recover:.4,cooldown:1.3,damage:1,range:86,kind:'whip'}],drop:{id:'leaf',chance:.5}},
 pig:{kind:'pig',name:'野餐猪',w:52,h:34,hp:3,speed:96,chase:460,skills:[{name:'charge',telegraph:.22,recover:.36,cooldown:.7,damage:1,range:64,kind:'charge'}],drop:{id:'leaf',chance:.4}},
 picnic:{kind:'picnic',name:'南宫师姐',w:58,h:118,hp:20,speed:26,boss:true,gate:true,melee:{name:'swipe',telegraph:.42,recover:.4,cooldown:.85,damage:1,range:78,kind:'melee'},skills:[
  {name:'melon',telegraph:.55,recover:.5,cooldown:2.8,damage:1,range:280,kind:'melon'},
  {name:'ult',telegraph:1.05,recover:1.15,cooldown:7.2,damage:2,range:280,kind:'ult'},
 ]},
 hive:{kind:'hive',name:'西瓜大王',w:58,h:118,hp:18,speed:28,boss:true,melee:{name:'swipe',telegraph:.4,recover:.38,cooldown:.8,damage:1,range:76,kind:'melee'},skills:[
  {name:'bow',telegraph:.5,recover:.45,cooldown:2.2,damage:1,range:300,kind:'bow'},
  {name:'magic',telegraph:.55,recover:.5,cooldown:2.6,damage:1,range:300,kind:'magic'},
 ]},
 wolf:{kind:'wolf',name:'霜脊狼',w:70,h:42,hp:4,speed:78,chase:420,skills:[
  {name:'pounce',telegraph:.32,recover:.28,cooldown:1.1,damage:1,range:90,kind:'pounce'},
  {name:'howl',telegraph:.5,recover:.4,cooldown:3.2,damage:0,range:240,kind:'howl'},
 ],drop:{id:'leaf',chance:.5}},
 wolfb:{kind:'wolfb',name:'霜爪士',w:52,h:110,hp:6,speed:54,chase:400,skills:[
  {name:'swipe',telegraph:.3,recover:.28,cooldown:.9,damage:1,range:70,kind:'melee'},
  {name:'frost',telegraph:.48,recover:.42,cooldown:2.4,damage:1,range:200,kind:'frost'},
 ],drop:{id:'leaf',chance:.5}},
 boar:{kind:'boar',name:'杂兵猪',w:64,h:38,hp:4,speed:88,chase:440,skills:[{name:'charge',telegraph:.34,recover:.5,cooldown:1.2,damage:1,range:160,kind:'charge'}],drop:{id:'leaf',chance:.45}},
 bear:{kind:'bear',name:'裂纹熊',w:78,h:86,hp:10,speed:28,chase:320,skills:[
  {name:'swipe',telegraph:.4,recover:.36,cooldown:1.1,damage:1,range:72,kind:'melee'},
  {name:'slam',telegraph:.62,recover:.7,cooldown:2.8,damage:1,range:120,kind:'slam'},
 ],drop:{id:'leaf',chance:.6}},
 eboar:{kind:'eboar',name:'毒纹猪',w:68,h:40,hp:6,speed:92,chase:460,skills:[
  {name:'charge',telegraph:.3,recover:.42,cooldown:1.1,damage:1,range:170,kind:'charge'},
  {name:'slam',telegraph:.5,recover:.45,cooldown:2.4,damage:1,range:90,kind:'slam'},
 ],drop:{id:'leaf',chance:.5}},
 cent:{kind:'cent',name:'金鳞蜈',w:96,h:28,hp:5,speed:62,chase:380,skills:[
  {name:'spit',telegraph:.4,recover:.36,cooldown:1.5,damage:1,range:210,kind:'spit'},
  {name:'coil',telegraph:.36,recover:.4,cooldown:1.2,damage:1,range:70,kind:'whip'},
 ],drop:{id:'leaf',chance:.4}},
 escort:{kind:'escort',name:'斗笠镖师',w:48,h:116,hp:7,speed:50,chase:380,skills:[
  {name:'parry',telegraph:.55,recover:.35,cooldown:1.8,damage:1,range:80,kind:'parry'},
  {name:'slash',telegraph:.32,recover:.3,cooldown:1.1,damage:1,range:86,kind:'melee'},
 ],drop:{id:'leaf',chance:.45}},
 herder:{kind:'herder',name:'牧鹰人',w:48,h:116,hp:5,speed:42,chase:440,kite:180,skills:[
  {name:'hawk',telegraph:.42,recover:.4,cooldown:1.6,damage:1,range:260,kind:'hawk'},
  {name:'call',telegraph:.5,recover:.45,cooldown:4.5,damage:0,range:240,kind:'summon'},
 ],drop:{id:'leaf',chance:.4}},
 wk1:{kind:'wk1',name:'狼王',w:56,h:118,hp:12,speed:48,chase:460,skills:[
  {name:'howl',telegraph:.55,recover:.45,cooldown:3.6,damage:0,range:280,kind:'howl'},
  {name:'slam',telegraph:.5,recover:.5,cooldown:2.2,damage:1,range:100,kind:'slam'},
 ],drop:{id:'leaf',chance:.7}},
 wk2:{kind:'wk2',name:'棘脊狼王',w:78,h:46,hp:11,speed:86,chase:480,skills:[
  {name:'charge',telegraph:.36,recover:.48,cooldown:1.4,damage:1,range:200,kind:'charge'},
  {name:'slam',telegraph:.48,recover:.42,cooldown:2.4,damage:1,range:110,kind:'slam'},
 ],drop:{id:'leaf',chance:.7}},
 pale:{kind:'pale',name:'苍白潮客',w:56,h:118,hp:22,speed:32,boss:true,gate:true,melee:{name:'swipe',telegraph:.4,recover:.36,cooldown:.8,damage:1,range:74,kind:'melee'},skills:[
  {name:'drain',telegraph:.7,recover:.55,cooldown:2.6,damage:1,range:240,kind:'drain'},
  {name:'mist',telegraph:.45,recover:.4,cooldown:2.2,damage:1,range:220,kind:'mist'},
  {name:'clone',telegraph:.9,recover:.8,cooldown:6.5,damage:1,range:280,kind:'clone'},
 ]},
 grey:{kind:'grey',name:'灰冠风修',w:56,h:118,hp:22,speed:34,boss:true,gate:true,melee:{name:'slash',telegraph:.36,recover:.32,cooldown:.75,damage:1,range:80,kind:'melee'},skills:[
  {name:'gale',telegraph:.55,recover:.45,cooldown:2.4,damage:1,range:260,kind:'gale'},
  {name:'ult',telegraph:.7,recover:.55,cooldown:3.2,damage:1,range:240,kind:'ult'},
  {name:'ring',telegraph:.95,recover:.85,cooldown:6.8,damage:1,range:280,kind:'ring'},
 ]},
 han:{kind:'han',name:'韩小立',w:56,h:118,hp:24,speed:36,boss:true,gate:true,melee:{name:'sword',telegraph:.34,recover:.3,cooldown:.7,damage:1,range:76,kind:'melee'},skills:[
  {name:'magic',telegraph:.5,recover:.42,cooldown:2.2,damage:1,range:280,kind:'magic'},
  {name:'gale',telegraph:.48,recover:.4,cooldown:2.6,damage:1,range:240,kind:'gale'},
  {name:'dragon',telegraph:1.1,recover:1.05,cooldown:7.4,damage:2,range:300,kind:'dragon'},
 ]},
 horn:{kind:'horn',name:'白角镜使',w:56,h:118,hp:22,speed:34,boss:true,gate:true,melee:{name:'swipe',telegraph:.4,recover:.36,cooldown:.8,damage:1,range:74,kind:'melee'},skills:[
  {name:'magic',telegraph:.52,recover:.45,cooldown:2.3,damage:1,range:280,kind:'magic'},
  {name:'mist',telegraph:.42,recover:.38,cooldown:2.1,damage:1,range:220,kind:'mist'},
  {name:'clone',telegraph:.95,recover:.85,cooldown:6.6,damage:1,range:280,kind:'clone'},
 ]},
};

export const SPINE_DIE=new Set(['picnic','hive','wolf','wolfb','boar','bear','eboar','cent','escort','herder','wk1','wk2','pale','grey','han','horn']);
const LATE=new Set<SkillKind>(['clone','dragon','ring','mist']);

export type WorldView={playerX:number;playerY:number;dt:number;solids?:Solid[];incomingMelee?:boolean;incomingShot?:boolean;playerGrounded?:boolean;allies?:Actor[]}

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

export function isGate(kind:string){return !!ENEMIES[kind]?.gate;}
export function isBoss(kind:string){return !!ENEMIES[kind]?.boss;}

export function activeSkill(actor:Actor,def:EnemyDef){
 if(actor.skill<0&&def.melee)return def.melee;
 return def.skills[Math.max(0,actor.skill)%def.skills.length];
}

function phaseOk(actor:Actor,skill:Skill){
 if(!LATE.has(skill.kind))return true;
 return actor.hp<=actor.maxHp*.55;
}

function nextOpenSkill(actor:Actor,def:EnemyDef){
 for(let i=1;i<=def.skills.length;i++){
  const idx=(actor.cycle+i)%def.skills.length;
  if(phaseOk(actor,def.skills[idx]))return idx;
 }
 return (actor.cycle+1)%def.skills.length;
}

export function chooseSkill(actor:Actor,def:EnemyDef,dist:number){
 const dash=def.skills.findIndex(s=>s.kind==='pounce'||s.kind==='charge');
 if(dash>=0&&dist<=def.skills[dash].range)return dash;
 const howl=def.skills.findIndex(s=>s.kind==='howl');
 if(howl>=0&&dash>=0&&dist>def.skills[dash].range)return howl;
 return nextOpenSkill(actor,def);
}

function attackTime(actor:Actor,skill:Skill){
 if(actor.skill<0)return .45;
 if(skill.kind==='pounce')return Math.min(.4,Math.max(.32,skill.range/260));
 if(skill.kind==='charge')return Math.min(.4,Math.max(.32,skill.range/300));
 return .12;
}

function settle(actor:Actor,view:WorldView,skipGrav=false){
 if(view.solids)resolveActor(actor,view.solids,view.dt,skipGrav);
 else if(actor.state!=='hop'&&GROUNDED.has(actor.kind))actor.y=actor.homeY;
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
 const falling=actor.vy>40||!onFloor(actor.x,actor.y,view.solids);
 if(view.solids&&!falling&&!onFloor(next,actor.y,view.solids)){actor.vx=0;return false;}
 actor.x=next;return true;
}

function facePlayer(actor:Actor,dx:number){
 if(Math.abs(dx)>2)actor.facing=dx>0?1:-1;
}

function sameBand(actor:Actor,view:WorldView){
 const band=actor.kind==='cent'?220:CHASE_BAND;
 if(Math.abs(view.playerY-actor.y)>band)return false;
 if(view.playerGrounded===false&&Math.abs(view.playerY-actor.y)>48&&actor.kind!=='cent')return false;
 return true;
}

function hasteOf(actor:Actor){return actor.asc?.has('state.haste')?1.45:1;}

function neglected(actor:Actor,view:WorldView){
 if(!defBoss(actor)||!view.allies)return 1;
 const partner=view.allies.find(a=>a.id!==actor.id&&isBoss(a.kind)&&!a.dead);
 if(!partner)return 1;
 const dSelf=Math.abs(view.playerX-actor.x),dPar=Math.abs(view.playerX-partner.x);
 return dSelf>dPar+48?1.35:1;
}

function defBoss(actor:Actor){return !!ENEMIES[actor.kind]?.boss;}

function chaseMove(actor:Actor,view:WorldView,dx:number,speed=CHASE_SPEED){
 const def=ENEMIES[actor.kind];
 if(def?.kite&&Math.abs(dx)<def.kite-20){
  const away=dx>0?-1:1;
  actor.vx+=(away*speed*.8-actor.vx)*Math.min(1,view.dt*10);
 }else{
  const want=Math.abs(dx)<22?0:(dx>0?1:-1)*speed;
  actor.vx+=(want-actor.vx)*Math.min(1,view.dt*10);
 }
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
 actor.skill=nextOpenSkill(actor,def);
 actor.cycle=actor.skill;
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
const BOSS_DODGE=new Set(['hive','picnic','pale','grey','han','horn']);

export function stepMachine(actor:Actor,def:EnemyDef,view:WorldView){
 if(actor.state==='dying'){
  actor.timer=Math.max(0,actor.timer-view.dt);
  settle(actor,view);
  if(actor.timer<=0)actor.state='dead';
  return;
 }
 if(actor.dead){actor.state='dead';return;}
 if(actor.kind==='eboar'&&actor.hp<=actor.maxHp*.5)actor.asc?.hold('state.haste',1.2);
 actor.timer=Math.max(0,actor.timer-view.dt);
 actor.cooldown=Math.max(0,actor.cooldown-view.dt);
 actor.meleeCd=Math.max(0,actor.meleeCd-view.dt);
 actor.dodgeCd=Math.max(0,actor.dodgeCd-view.dt);
 actor.hopCd=Math.max(0,actor.hopCd-view.dt);
 actor.invuln=Math.max(0,actor.invuln-view.dt);
 const dx=view.playerX-actor.x,dist=Math.hypot(dx,view.playerY-actor.y);
 const skill=activeSkill(actor,def);
 const hunt=huntRange(def,skill);
 if(BOSS_DODGE.has(actor.kind)&&actor.state!=='dodge'&&actor.state!=='hop'&&actor.state!=='dead'&&actor.state!=='reel'&&actor.state!=='dying'){
  if(view.incomingMelee&&actor.dodgeCd<=0){beginDodge(actor,'dodge',view);return;}
  if(view.incomingShot&&actor.hopCd<=0){beginDodge(actor,'hop',view);return;}
 }
 if(actor.kind==='escort'&&actor.state==='telegraph'&&skill.kind==='parry'&&view.incomingMelee){
  actor.state='attack';actor.timer=.16;actor.invuln=.28;actor.asc?.hold('state.invuln',.28);
  return;
 }
 if(actor.state==='dodge'||actor.state==='hop'){
  if(actor.state==='hop'){
   actor.vy+=HOP_GRAVITY*view.dt;
   actor.y+=actor.vy*view.dt;
  }
  stepX(actor,view,actor.vx*view.dt);
  actor.vx*=Math.max(0,1-view.dt*3.2);
  settle(actor,view,actor.state==='hop');
  facePlayer(actor,dx);
  if(actor.timer<=0){
   actor.vx=0;
   actor.state=(def.boss||def.chase)&&dist<hunt&&sameBand(actor,view)?'chase':dist<skill.range+40&&sameBand(actor,view)?'alert':'patrol';
  }
  return;
 }
 if(actor.state==='hurt'){
  settle(actor,view);
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
  const speed=(def.boss?CHASE_SPEED:Math.max(def.speed,CHASE_SPEED))*hasteOf(actor)*neglected(actor,view);
  chaseMove(actor,view,dx,speed);
  if(def.melee&&dist<=def.melee.range&&actor.meleeCd<=0){beginMelee(actor,def);return;}
  const idx=chooseSkill(actor,def,dist);
  const next=def.skills[idx];
  if(actor.cooldown<=0&&dist<=next.range){
   if(def.boss)beginNextSkill(actor,def);
   else {actor.skill=idx;actor.cycle=actor.skill;actor.state='telegraph';actor.timer=def.skills[actor.skill].telegraph;}
  }
  return;
 }
 if(actor.state==='alert'){
  facePlayer(actor,dx);
  if((actor.kind==='pig'||actor.kind==='boar'||actor.kind==='eboar')&&dist>48){
   actor.vx=actor.facing*def.speed*1.35;
   stepX(actor,view,actor.vx*view.dt);settle(actor,view);
  }
  if(actor.timer<=0){
   if(dist<=skill.range&&actor.cooldown<=0&&sameBand(actor,view)){
    if(def.skills.length>1)actor.skill=chooseSkill(actor,def,dist);
    actor.state='telegraph';actor.timer=activeSkill(actor,def).telegraph;
   }else actor.state=dist<hunt&&sameBand(actor,view)?'chase':'patrol';
  }
  return;
 }
 if(actor.state==='telegraph'){
  facePlayer(actor,dx);
  if(actor.timer<=0){actor.state='attack';actor.timer=attackTime(actor,skill);}
  return;
 }
 if(actor.state==='attack'){
  facePlayer(actor,dx);
  if(skill.kind==='charge'||skill.kind==='pounce'){
   actor.vx=actor.facing*(skill.kind==='pounce'?260:300)*hasteOf(actor);
   if(!stepX(actor,view,actor.vx*view.dt)){actor.vx=0;actor.state='hurt';actor.timer=.45;actor.invuln=0;return;}
   settle(actor,view);
  }
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
  if(SPINE_DIE.has(actor.kind)){actor.state='dying';actor.timer=DIE_TIME;}
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
  skill:def.skills.length>1?-1:0,meleeCd:0,cycle:-1,dodgeCd:0,hopCd:0,bumpLock:false,
 };
}

export function livingGates(actors:Actor[]){
 return actors.some(a=>isGate(a.kind)&&!a.dead);
}
