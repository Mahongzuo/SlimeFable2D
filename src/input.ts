import {type KeyAction,type KeyBindings,type SchemePref,DEFAULT_BINDINGS} from './progress';

export type Scheme='keyboard'|'gamepad'|'touch';
export type Actions={
 move:number;
 climb:number;
 squeeze:boolean;
 jump:boolean;
 jumpHeld:boolean;
 split:boolean;
 merge:boolean;
 switch:boolean;
 select1:boolean;
 select2:boolean;
 reset:boolean;
 pause:boolean;
 melee:boolean;
 meleeHeld:boolean;
 ranged:boolean;
 inventory:boolean;
 dodge:boolean;
 interact:boolean;
 confirm:boolean;
 back:boolean;
 menuY:number;
};

export function emptyActions():Actions{
 return {move:0,climb:0,squeeze:false,jump:false,jumpHeld:false,split:false,merge:false,switch:false,select1:false,select2:false,reset:false,pause:false,melee:false,meleeHeld:false,ranged:false,inventory:false,dodge:false,interact:false,confirm:false,back:false,menuY:0};
}

type PadSource=()=>(Gamepad|null)[];
const DEAD=0.28;
const FACE=['jump','squeeze','merge','split'] as const;

function guessScheme():Scheme{
 try{
  if(typeof navigator!=='undefined'&&navigator.maxTouchPoints>0&&typeof window!=='undefined'&&Math.min(window.innerWidth,window.innerHeight)<820)return 'touch';
 }catch{/* node tests */}
 return 'keyboard';
}

function axis(value:number){return Math.abs(value)>DEAD?Math.sign(value)*Math.min(1,(Math.abs(value)-DEAD)/(1-DEAD)):0;}
function pressed(button?:GamepadButton|null){return !!button&&(button.pressed||button.value>0.45);}

export class PlayerInput {
 bindings:KeyBindings;
 pref:SchemePref;
 scheme:Scheme;
 listening=false;
 onScheme?:(scheme:Scheme)=>void;
 private keys=new Set<string>();
 private pulses=new Set<string>();
 private prevPad=new Set<string>();
 private prevMenu=0;
 private touchMove=0;
 private touchClimb=0;
 private touchHeld=new Set<string>();
 private mouseHeld=new Set<string>();
 private pads:PadSource;

 constructor(bindings:KeyBindings=DEFAULT_BINDINGS,pref:SchemePref='auto',pads?:PadSource){
  this.bindings={...DEFAULT_BINDINGS,...bindings};
  this.pref=pref;
  this.scheme=pref==='auto'?guessScheme():pref;
  this.pads=pads??(()=>typeof navigator!=='undefined'&&navigator.getGamepads?[...navigator.getGamepads()]:[]);
 }

 setPref(pref:SchemePref){
  this.pref=pref;
  if(pref!=='auto')this.applyScheme(pref);
 }

 private applyScheme(scheme:Scheme){
  if(this.scheme===scheme)return;
  this.scheme=scheme;
  this.onScheme?.(scheme);
 }

 note(scheme:Scheme){
  if(this.pref!=='auto')return;
  this.applyScheme(scheme);
 }

 keyDown(code:string,repeat=false){
  this.note('keyboard');
  this.keys.add(code);
  if(!repeat)this.pulses.add(code);
 }

 keyUp(code:string){this.keys.delete(code);}

 clear(){
  this.keys.clear();
  this.pulses.clear();
  this.touchHeld.clear();
  this.mouseHeld.clear();
  this.touchMove=0;
  this.touchClimb=0;
 }

 setMouse(action:'melee'|'dodge',down:boolean){
  this.note('keyboard');
  if(down){this.mouseHeld.add(action);this.pulses.add(`mouse:${action}`);}
  else this.mouseHeld.delete(action);
 }

 setTouchAxis(x:number,y:number){
  this.note('touch');
  this.touchMove=Math.max(-1,Math.min(1,x));
  this.touchClimb=Math.max(-1,Math.min(1,y));
 }

 setTouch(action:string,down:boolean){
  this.note('touch');
  if(down){this.touchHeld.add(action);this.pulses.add(`touch:${action}`);}
  else this.touchHeld.delete(action);
 }

 private bound(action:KeyAction){return this.bindings[action];}
 private keyHeld(action:KeyAction){return this.keys.has(this.bound(action));}
 private keyPulse(action:KeyAction){return this.pulses.has(this.bound(action));}

 private readPad(){
  const pad=this.pads().find((item):item is Gamepad=>!!item);
  if(!pad)return;
  const now=new Set<string>();
  const lx=axis(pad.axes[0]??0),ly=axis(pad.axes[1]??0);
  const dx=(pressed(pad.buttons[15])?1:0)-(pressed(pad.buttons[14])?1:0);
  const dy=(pressed(pad.buttons[13])?1:0)-(pressed(pad.buttons[12])?1:0);
  if(lx||ly||dx||dy||pad.buttons.some(button=>pressed(button)))this.note('gamepad');
  const move=lx||dx,climb=ly||dy;
  if(move)now.add(move>0?'right':'left');
  if(climb)now.add(climb>0?'down':'up');
  FACE.forEach((name,i)=>{if(pressed(pad.buttons[i]))now.add(name);});
  if(pressed(pad.buttons[6]))now.add('melee');
  if(pressed(pad.buttons[7]))now.add('ranged');
  if(pressed(pad.buttons[5])||pressed(pad.buttons[4]))now.add('switch');
  if(pressed(pad.buttons[9]))now.add('pause');
  if(pressed(pad.buttons[8]))now.add('reset');
  if(pressed(pad.buttons[10]))now.add('interact');
  if(pressed(pad.buttons[0]))now.add('confirm');
  if(pressed(pad.buttons[1]))now.add('back');
  for(const name of now)if(!this.prevPad.has(name))this.pulses.add(`pad:${name}`);
  this.prevPad=now;
  return {move,climb,held:now};
 }

 consume():Actions{
  if(this.listening){
   this.pulses.clear();
   return emptyActions();
  }
  const pad=this.readPad();
  const arrowsL=this.keys.has('ArrowLeft'),arrowsR=this.keys.has('ArrowRight');
  const arrowsU=this.keys.has('ArrowUp'),arrowsD=this.keys.has('ArrowDown');
  const keyMove=Number(this.keyHeld('right')||arrowsR)-Number(this.keyHeld('left')||arrowsL);
  const keyClimb=Number(this.keyHeld('down')||arrowsD)-Number(this.keyHeld('up')||arrowsU);
  const move=this.touchMove||pad?.move||keyMove;
  const climb=this.touchClimb||pad?.climb||keyClimb;
  const squeeze=this.keyHeld('squeeze')||arrowsD||!!pad?.held.has('squeeze')||this.touchHeld.has('squeeze');
  const jumpHeld=this.keyHeld('jump')||!!pad?.held.has('jump')||this.touchHeld.has('jump');
  const edge=(action:KeyAction,touch=action,also?:string)=>{
   return this.keyPulse(action)||this.pulses.has(`pad:${touch}`)||this.pulses.has(`touch:${touch}`)||(also?this.pulses.has(also):false);
  };
  const menuRaw=Math.sign(this.touchClimb||pad?.climb||keyClimb);
  const menuY=menuRaw&&menuRaw!==this.prevMenu?menuRaw:0;
  this.prevMenu=menuRaw;
  const confirm=this.pulses.has('Enter')||this.pulses.has('pad:confirm')||this.pulses.has('touch:confirm');
  const back=this.keyPulse('pause')||this.pulses.has('pad:back')||this.pulses.has('touch:back');
  const actions:Actions={
   move,climb,squeeze,jumpHeld,
   jump:edge('jump'),
   split:edge('split'),
   merge:edge('merge'),
   switch:edge('switch','switch','Tab'),
   select1:edge('select1'),
   select2:edge('select2'),
   reset:edge('reset'),
   pause:edge('pause')||this.pulses.has('pad:pause')||this.pulses.has('touch:pause'),
   melee:edge('melee')||this.pulses.has('mouse:melee'),
   meleeHeld:this.keyHeld('melee')||!!pad?.held.has('melee')||this.touchHeld.has('melee')||this.mouseHeld.has('melee'),
   ranged:edge('ranged'),
   inventory:edge('inventory'),
   dodge:edge('dodge')||this.pulses.has('mouse:dodge')||this.pulses.has('touch:dodge'),
   interact:edge('interact'),
   confirm,back,menuY,
  };
  this.pulses.clear();
  return actions;
 }
}
