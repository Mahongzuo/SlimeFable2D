import Phaser from 'phaser';
import {Adventure} from './game';
import {ForestArt,W,H} from './art';
import {HoneyArt} from './honey-art';
import {HoneyLevel} from './honey-level';
import {drawSlime} from './slime-view';
import {drawWater} from './water-view';
import {drawHoney} from './honey-view';
import {CATALOG,levelById} from './catalog';
import {BINDING_LABELS,isPlayable,keyLabel,loadProgress,markCleared,nextPlayable,saveProgress,type KeyAction,type Progress,type SchemePref} from './progress';
import {emptyActions,PlayerInput,type Actions} from './input';
import './style.css';

const drop='<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M6 23C5 12 12 7 18 8c7 1 10 9 8 15-2 7-18 7-20 0Z" fill="currentColor"/><circle cx="13" cy="20" r="1.2" fill="#28524e"/><circle cx="21" cy="20" r="1.2" fill="#28524e"/></svg>';
const soundIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/></svg>';
const gp=(face:string,label:string)=>`<i class="gp ${face}" aria-hidden="true">${label}</i>`;

document.querySelector('#app')!.innerHTML=`
 <main class="game-shell" aria-label="史莱姆寓言，横版软体冒险游戏">
  <div id="game" aria-label="游戏场景"></div>
  <div class="grain" aria-hidden="true"></div>
  <section id="title" class="title-screen">
   <div class="title-veil"></div>
   <div class="title-content">
    <div class="eyebrow"><span></span> SLIME FABLE</div>
    <h1>史莱姆寓言</h1>
    <p>一团史莱姆忽然落到这片发光的林子里。<br>从露水草甸出发，去森林尽头看看。</p>
    <nav class="title-menu">
     <button id="start" class="primary">开始冒险 <span>→</span></button>
     <button id="open-levels" class="ghost">选择关卡</button>
     <button id="open-settings" class="ghost">操作设置</button>
    </nav>
    <label class="title-name">给你的史莱姆取名<input id="slime-name" type="text" maxlength="6" spellcheck="false" autocomplete="off" aria-label="给你的史莱姆取个名字"/></label>
   </div>
   <button id="title-sound" class="icon-button muted title-sound" aria-label="开启环境音" title="环境音">${soundIcon}</button>
  </section>
  <section id="levels" class="overlay hidden" aria-label="选择关卡">
   <div class="overlay-card">
    <div class="eyebrow"><span></span> CHAPTERS</div>
    <h2>选择关卡</h2>
    <p>前两章已经开放。后面的路，还在长出来。</p>
    <div id="level-grid" class="level-grid"></div>
    <button id="levels-back" class="text-button">返回</button>
   </div>
  </section>
  <section id="settings" class="overlay hidden" aria-label="操作设置">
   <div class="overlay-card settings-card">
    <div class="eyebrow"><span></span> CONTROLS</div>
    <h2>操作设置</h2>
    <p>可以锁定一种输入，也可以让它跟着你最近的操作走。</p>
    <div id="scheme-row" class="scheme-row"></div>
    <div id="bind-list" class="bind-list"></div>
    <p class="settings-note">点一行再按新键即可改绑。Esc 取消。</p>
    <button id="settings-back" class="text-button">返回</button>
   </div>
  </section>
  <header class="hud play-only"><div class="identity"><span class="brand-icon">${drop}</span><div><div class="brand">史莱姆寓言 <span>SLIME FABLE</span></div><div class="chapter">第一章 <b>·</b> 苔光森林</div></div></div>
   <div class="hud-right"><span class="dew-count"><span>◈</span> <b id="dew-count">0</b><em id="dew-total">/ 6</em></span><i></i><button id="sound" class="icon-button muted" aria-label="开启环境音" title="环境音">${soundIcon}</button><button id="pause" class="icon-button" aria-label="暂停游戏" title="暂停 / Esc">Ⅱ</button></div>
  </header>
  <div class="location play-only"><span class="location-number">01</span><div><b id="location-name">露水草甸</b><small id="location-en">DEWMEADOW</small></div></div>
  <div id="hint" class="hint play-only" role="status">轻轻起跳，感受落地时的柔软回弹</div>
  <footer id="controls-keyboard" class="controls play-only"></footer>
  <footer id="controls-gamepad" class="controls play-only hidden">
   <span>${gp('stick','L')} 移动 / 攀爬</span>
   <span>${gp('a','A')} 跳跃</span>
   <span>${gp('b','B')} 挤压</span>
   <span>${gp('y','Y')} 分裂</span>
   <span>${gp('x','X')} 合并</span>
   <span>${gp('rb','RB')} 切换</span>
   <span>${gp('back','◀')} 检查点</span>
   <span>${gp('start','≡')} 菜单</span>
  </footer>
  <div id="touch-pad" class="touch-pad play-only hidden">
   <div id="stick-well" class="stick-well"><div class="stick-ring"></div><div id="stick-knob" class="stick-knob"></div></div>
   <div class="touch-skills">
    <button type="button" data-act="split">分</button>
    <button type="button" data-act="switch">换</button>
    <button type="button" data-act="merge">合</button>
   </div>
   <div class="touch-faces">
    <button type="button" class="touch-sub" data-act="squeeze">挤</button>
    <button type="button" class="touch-jump" data-act="jump">跳</button>
   </div>
   <div class="touch-util">
    <button type="button" data-act="reset">点</button>
    <button type="button" data-act="pause">Ⅱ</button>
   </div>
  </div>
  <div class="progress-track play-only"><div id="progress"></div></div>
  <div id="notice" class="notice" role="status"></div>
  <nav id="body-picker" class="body-picker hidden play-only" aria-label="选择控制的史莱姆"><button data-body="0">1 号</button><button data-body="1">2 号</button></nav>
  <div id="modal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-card"><span class="modal-mark">${drop}</span><div id="modal-eyebrow" class="eyebrow">TAKE A LITTLE BREATH</div><h2 id="modal-title">在苔藓上，歇一会儿。</h2><p id="modal-copy">森林会等你。准备好后，再出发。</p>
   <div id="modal-pause" class="modal-actions">
    <button id="resume" class="primary">继续冒险 <span>→</span></button>
    <button id="reset" class="text-button">回到最近的检查点</button>
    <button id="pause-levels" class="text-button">选择关卡</button>
    <button id="pause-settings" class="text-button">操作设置</button>
    <button id="quit-title" class="text-button">返回主菜单</button>
   </div>
   <div id="modal-win" class="modal-actions hidden">
    <button id="next-level" class="primary">下一关 <span>→</span></button>
    <button id="replay" class="text-button">再玩一次</button>
    <button id="win-title" class="text-button">返回主菜单</button>
   </div>
  </div></div>
  <div id="debug" class="debug hidden"></div>
 </main>`;

const adventure=new Adventure();
let progress:Progress=loadProgress();
const input=new PlayerInput(progress.bindings,progress.schemePref);
adventure.name=progress.name;
let forest:ForestArt;
let hive:HoneyArt|undefined;
let overlay:'none'|'levels'|'settings'='none';
let overlayFrom:'title'|'pause'='title';
let rebind:KeyAction|undefined;
let menuFocus=0;
const el=(id:string)=>document.getElementById(id)!;
const shell=document.querySelector<HTMLElement>('.game-shell')!;
function resize(){shell.style.setProperty('--ui-scale',String(Math.min(window.innerWidth/1280,window.innerHeight/720)));}
resize();window.addEventListener('resize',resize);

let sound=false,audio:AudioContext|undefined,ambientGain:GainNode|undefined;
function toggleSound(){
 sound=!sound;
 for(const id of ['sound','title-sound']){el(id).classList.toggle('muted',!sound);el(id).setAttribute('aria-label',sound?'关闭环境音':'开启环境音');}
 if(sound&&!audio){
  audio=new AudioContext();ambientGain=audio.createGain();ambientGain.gain.value=.018;ambientGain.connect(audio.destination);
  const buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate),data=buffer.getChannelData(0);let last=0;
  for(let i=0;i<data.length;i++){last=(last+(Math.random()*2-1)*.025)/1.025;data[i]=last;}
  const source=audio.createBufferSource();source.buffer=buffer;source.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;source.connect(filter);filter.connect(ambientGain);source.start();
 }
 if(audio){if(sound)void audio.resume();else void audio.suspend();}
}
el('sound').onclick=toggleSound;
el('title-sound').onclick=toggleSound;

const nameInput=()=>document.querySelector<HTMLInputElement>('#slime-name')!;
function readName(){return nameInput().value.replace(/\s+/g,'').slice(0,6)||'史莱姆';}
function commitName(){
 const name=readName();
 nameInput().value=name;
 adventure.name=name;
 progress={...progress,name};
 saveProgress(progress);
 return name;
}
nameInput().value=progress.name;
nameInput().addEventListener('blur',()=>{nameInput().value=readName();commitName();});

function persist(){saveProgress(progress);}
function entryOf(){return levelById(adventure.level.id)??CATALOG[0];}

function showOverlay(next:'none'|'levels'|'settings',from:'title'|'pause'=overlayFrom){
 overlay=next;overlayFrom=from;
 el('levels').classList.toggle('hidden',next!=='levels');
 el('settings').classList.toggle('hidden',next!=='settings');
 if(next==='levels')renderLevels();
 if(next==='settings')renderSettings();
 menuFocus=0;syncFocus();
}

function goTitle(){
 adventure.quitToTitle();
 shell.classList.remove('playing');
 showOverlay('none','title');
}

function enterLevel(id:string){
 commitName();
 if(!isPlayable(levelById(id)??CATALOG[0],progress))return;
 progress={...progress,lastLevel:id};
 persist();
 adventure.selectLevel(id);
 adventure.name=progress.name;
 adventure.start();
 shell.classList.add('playing');
 showOverlay('none','title');
 (document.activeElement as HTMLElement)?.blur();
}

function begin(){enterLevel(isPlayable(levelById(progress.lastLevel)??CATALOG[0],progress)?progress.lastLevel:'forest');}

function renderKeyboardBar(){
 const b=progress.bindings,k=(action:KeyAction,wide=false)=>`<kbd${wide?' class="wide"':''}>${keyLabel(b[action])}</kbd>`;
 el('controls-keyboard').innerHTML=`<span>${k('left')}${k('right')} 移动</span><span>${k('jump',true)} 跳跃</span><span>${k('up')} 攀爬 ${k('down')} 挤压</span><span>${k('split')} 分裂</span><span>${k('switch')} 切换</span><span>${k('merge')} 合并</span><span>${k('reset')} 回溯</span><button id="help" title="操作说明">?</button>`;
 el('help').onclick=()=>showOverlay('settings',adventure.started?'pause':'title');
}

function renderLevels(){
 el('level-grid').innerHTML=CATALOG.map(entry=>{
  const open=isPlayable(entry,progress);
  const mark=entry.status==='coming'?'开发中':open?'可进入':'未解锁';
  return `<button type="button" class="level-card ${entry.status}${open?'':' locked'}" data-id="${entry.id}" ${open?'':'disabled'}><small>${String(entry.index).padStart(2,'0')}</small><b>${entry.name}</b><em>${entry.en}</em><span>${mark}</span></button>`;
 }).join('');
 el('level-grid').querySelectorAll<HTMLButtonElement>('[data-id]').forEach(button=>{
  button.onclick=()=>enterLevel(button.dataset.id||'forest');
 });
}

function renderSettings(){
 const prefs:SchemePref[]=['auto','keyboard','gamepad','touch'];
 const names:Record<SchemePref,string>={auto:'自动',keyboard:'键鼠',gamepad:'手柄',touch:'触屏'};
 el('scheme-row').innerHTML=prefs.map(pref=>`<button type="button" class="scheme-chip${progress.schemePref===pref?' on':''}" data-pref="${pref}">${names[pref]}</button>`).join('');
 el('scheme-row').querySelectorAll<HTMLButtonElement>('[data-pref]').forEach(button=>{
  button.onclick=()=>{
   const pref=button.dataset.pref as SchemePref;
   progress={...progress,schemePref:pref};
   input.setPref(pref);
   persist();
   renderSettings();
   syncScheme();
  };
 });
 el('bind-list').innerHTML=(Object.keys(BINDING_LABELS) as KeyAction[]).map(action=>`<button type="button" class="bind-row${rebind===action?' listening':''}" data-bind="${action}"><span>${BINDING_LABELS[action]}</span><kbd>${rebind===action?'按下新键':keyLabel(progress.bindings[action])}</kbd></button>`).join('');
 el('bind-list').querySelectorAll<HTMLButtonElement>('[data-bind]').forEach(button=>{
  button.onclick=()=>{
   rebind=button.dataset.bind as KeyAction;
   input.listening=true;
   renderSettings();
  };
 });
}

function syncScheme(){
 const playing=adventure.started,scheme=input.scheme;
 el('controls-keyboard').classList.toggle('hidden',!playing||scheme!=='keyboard');
 el('controls-gamepad').classList.toggle('hidden',!playing||scheme!=='gamepad');
 el('touch-pad').classList.toggle('hidden',!playing||scheme!=='touch');
 shell.dataset.scheme=scheme;
}

function menuButtons(){
 const root=overlay==='levels'?el('levels'):overlay==='settings'?el('settings'):!el('modal').classList.contains('hidden')?el('modal'):el('title');
 return Array.from(root.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')).filter(button=>!button.classList.contains('title-sound'));
}
function syncFocus(){
 const buttons=menuButtons();
 if(!buttons.length)return;
 menuFocus=(menuFocus+buttons.length)%buttons.length;
 buttons.forEach((button,i)=>button.classList.toggle('menu-focus',i===menuFocus&&input.scheme==='gamepad'));
}
function activateFocus(){menuButtons()[menuFocus]?.click();}
function handleMenu(actions:Actions){
 if(actions.menuY){menuFocus+=actions.menuY;syncFocus();}
 if(actions.confirm)activateFocus();
 if(actions.back){
  if(overlay!=='none')showOverlay('none');
  else if(adventure.started&&adventure.paused)adventure.togglePause();
 }
}

function bindTouch(){
 const well=el('stick-well'),knob=el('stick-knob');
 let pid:number|undefined;
 const radius=54;
 const apply=(event:PointerEvent)=>{
  const box=well.getBoundingClientRect(),cx=box.left+box.width/2,cy=box.top+box.height/2;
  let x=(event.clientX-cx)/radius,y=(event.clientY-cy)/radius;
  const mag=Math.hypot(x,y)||1;
  if(mag>1){x/=mag;y/=mag;}
  knob.style.transform=`translate(${x*radius}px,${y*radius}px)`;
  input.setTouchAxis(x,y);
 };
 well.addEventListener('pointerdown',event=>{
  pid=event.pointerId;well.setPointerCapture(event.pointerId);well.classList.add('active');apply(event);
 });
 well.addEventListener('pointermove',event=>{if(event.pointerId===pid)apply(event);});
 const end=(event:PointerEvent)=>{
  if(event.pointerId!==pid)return;
  pid=undefined;well.classList.remove('active');knob.style.transform='';input.setTouchAxis(0,0);
 };
 well.addEventListener('pointerup',end);well.addEventListener('pointercancel',end);
 el('touch-pad').querySelectorAll<HTMLButtonElement>('[data-act]').forEach(button=>{
  const act=button.dataset.act!;
  const down=(event:PointerEvent)=>{event.preventDefault();button.setPointerCapture(event.pointerId);button.classList.add('down');input.setTouch(act,true);button.blur();};
  const up=(event:PointerEvent)=>{button.classList.remove('down');input.setTouch(act,false);void event;};
  button.addEventListener('pointerdown',down);
  button.addEventListener('pointerup',up);
  button.addEventListener('pointercancel',up);
 });
}

el('start').onclick=begin;
el('open-levels').onclick=()=>showOverlay('levels','title');
el('open-settings').onclick=()=>showOverlay('settings','title');
el('levels-back').onclick=()=>showOverlay('none');
el('settings-back').onclick=()=>{rebind=undefined;input.listening=false;showOverlay('none');};
el('pause').onclick=()=>adventure.togglePause();
el('resume').onclick=()=>adventure.togglePause();
el('reset').onclick=()=>{adventure.reset();adventure.paused=false;};
el('pause-levels').onclick=()=>showOverlay('levels','pause');
el('pause-settings').onclick=()=>showOverlay('settings','pause');
el('quit-title').onclick=goTitle;
el('next-level').onclick=()=>{
 const next=nextPlayable(adventure.level.id,progress);
 if(next)enterLevel(next.id);
};
el('replay').onclick=()=>enterLevel(adventure.level.id);
el('win-title').onclick=goTitle;
nameInput().addEventListener('keydown',e=>{if(e.code==='Enter'){e.preventDefault();commitName();begin();}});
document.addEventListener('contextmenu',e=>e.preventDefault());
document.querySelectorAll<HTMLButtonElement>('[data-body]').forEach(button=>button.onclick=()=>{adventure.clearInput();adventure.sim.selectGroup(Number(button.dataset.body));button.blur();});
el('game').addEventListener('pointerdown',event=>{
 if(!adventure.started||adventure.paused||input.scheme==='touch')return;
 const bounds=el('game').getBoundingClientRect(),x=(event.clientX-bounds.left)/bounds.width*W+adventure.camera,y=(event.clientY-bounds.top)/bounds.height*H-adventure.cameraY;
 const target=adventure.sim.groups().map(g=>({g,c:adventure.sim.center(g)})).find(({c})=>Math.hypot(c.x-x,c.y-y)<65);
 if(target){adventure.clearInput();adventure.sim.selectGroup(target.g);}
});
window.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLElement&&e.target.closest('#slime-name'))return;
 if(rebind){
  e.preventDefault();
  if(e.code!=='Escape'){
   progress={...progress,bindings:{...progress.bindings,[rebind]:e.code}};
   input.bindings={...progress.bindings};
   persist();
   renderKeyboardBar();
  }
  rebind=undefined;input.listening=false;renderSettings();
  return;
 }
 if(e.code==='Backquote')adventure.debug=!adventure.debug;
 input.keyDown(e.code,e.repeat);
 if(e.target instanceof HTMLElement&&e.target.closest('button,input'))return;
 if(['Space','ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Tab'].includes(e.code))e.preventDefault();
});
window.addEventListener('keyup',e=>input.keyUp(e.code));
window.addEventListener('blur',()=>{input.clear();if(adventure.started&&!adventure.level.complete)adventure.paused=true;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){input.clear();if(adventure.started)adventure.paused=true;if(audio)void audio.suspend();}else if(sound&&audio)void audio.resume();});
input.onScheme=syncScheme;
renderKeyboardBar();
renderLevels();
renderSettings();
syncScheme();
bindTouch();

let lastHud=0;
const timings={physics:0,art:0,surface:0,upload:0};
function hud(time:number,fps:number){
 if(time-lastHud<80)return;lastHud=time;
 const a=adventure,c=a.sim.center(),region=a.level.region(c.x),honey=a.level.id==='honey',entry=entryOf();
 if(a.level.complete&&!progress.cleared.includes(a.level.id)){progress=markCleared(a.level.id,progress);persist();}
 el('body-picker').classList.toggle('hidden',a.sim.groups().length<2||!a.started);
 document.querySelectorAll<HTMLButtonElement>('[data-body]').forEach(button=>{const on=Number(button.dataset.body)===a.sim.activeGroup;button.classList.toggle('selected',on);button.setAttribute('aria-pressed',String(on));});
 shell.classList.toggle('playing',a.started);
 shell.classList.toggle('honey-theme',a.started&&honey);
 el('location-name').textContent=region.name;el('location-en').textContent=region.sub;
 document.querySelector('.location-number')!.textContent=String(a.level.area.findIndex(r=>r.at===region.at)+1).padStart(2,'0');
 document.querySelector('.chapter')!.innerHTML=`${entry.chapter} <b>·</b> ${entry.name}`;
 el('hint').textContent=a.level.hint(c.x,a.sim.groups().length);
 el('dew-count').textContent=String(a.level.dew.filter(d=>d.got).length);
 el('dew-total').textContent=`/ ${a.level.dew.length}`;
 el('progress').style.width=`${Math.min(100,c.x/Math.max(200,a.level.width-180)*100)}%`;
 el('notice').textContent=a.time<a.noticeUntil?a.notice:'';
 const showModal=a.started&&overlay==='none'&&(a.paused||a.level.complete);
 el('modal').classList.toggle('hidden',!showModal);
 el('modal-pause').classList.toggle('hidden',a.level.complete);
 el('modal-win').classList.toggle('hidden',!a.level.complete);
 el('debug').classList.toggle('hidden',!a.debug);
 syncScheme();
 if(a.debug)el('debug').textContent=`PBF · ${a.sim.particles.length} particles · ${Math.round(fps)} FPS\nx ${c.x.toFixed(0)} / y ${c.y.toFixed(0)} · ${a.sim.groups().length} groups\n${input.scheme} · ${a.sim.climbing?'climbing':'free'}`;
 if(a.level.complete){
  const dew=a.level.dew.filter(d=>d.got).length,clock=`${Math.floor(a.elapsed/60)} 分 ${Math.floor(a.elapsed%60)} 秒`;
  const next=nextPlayable(a.level.id,progress);
  el('modal-eyebrow').textContent=entry.winEyebrow;
  el('modal-title').textContent=entry.winTitle;
  el('modal-copy').textContent=`你穿过了${entry.name}，带回 ${dew} / ${a.level.dew.length} 颗${entry.dewName}。用时 ${clock}。`;
  el('next-level').classList.toggle('hidden',!next);
  if(next)el('next-level').innerHTML=`进入${next.name} <span>→</span>`;
 }
}

class ForestScene extends Phaser.Scene {
 private texture!:Phaser.Textures.CanvasTexture;
 private layers:Phaser.GameObjects.Image[]=[];
 create(){
  forest=new ForestArt(adventure.level);this.texture=this.textures.createCanvas('forest-frame',W*2,H*2)!;this.texture.context.scale(2,2);
  [forest.sky,forest.far,forest.middle,forest.terrain].forEach((canvas,i)=>{this.textures.addCanvas(`forest-layer-${i}`,canvas);this.layers.push(this.add.image(0,0,`forest-layer-${i}`).setOrigin(0));});
  this.add.image(0,0,'forest-frame').setOrigin(0).setScale(.5);this.game.canvas.setAttribute('aria-label','史莱姆寓言游戏画面');
 }
 update(time:number,delta:number){
  const actions=input.consume();
  if(!adventure.started||overlay!=='none'||adventure.paused||adventure.level.complete)handleMenu(actions);
  const t0=performance.now();adventure.tick(delta/1000,overlay==='none'?actions:emptyActions());const t1=performance.now();const c=this.texture.context;
  const level=adventure.level;
  this.layers.forEach(layer=>layer.setVisible(!(level instanceof HoneyLevel)&&adventure.started));
  if(!(level instanceof HoneyLevel)&&adventure.started){this.layers[1].x=-adventure.camera*.15;this.layers[2].x=-adventure.camera*.38;this.layers[3].x=-adventure.camera;}
  c.clearRect(0,0,W,H);
  if(!adventure.started){this.texture.refresh();hud(time,this.game.loop.actualFps);return;}
  if(level instanceof HoneyLevel){
   if(!hive||hive.level!==level)hive=new HoneyArt(level);
   hive.drawLayers(c,adventure.camera,adventure.cameraY);
   hive.drawAtmosphere(c,adventure.camera,adventure.cameraY,adventure.time);
   c.save();c.translate(0,adventure.cameraY);
   for(const pool of level.pools)drawHoney(c,pool,adventure.camera,adventure.time,false);
   hive.drawDetails(c,adventure.camera,adventure.time,adventure.sim);
   const t2=performance.now();
   const films=new Map(adventure.sim.groups().map(g=>[g,level.film(g)]));
   drawSlime(c,adventure.sim,adventure.camera,adventure.time,adventure.debug,films);
   const t3=performance.now();
   for(const pool of level.pools)drawHoney(c,pool,adventure.camera,adventure.time,true);
   c.restore();
   this.texture.refresh();hud(time,this.game.loop.actualFps);
   timings.physics=t1-t0;timings.art=t2-t1;timings.surface=t3-t2;timings.upload=performance.now()-t3;
   return;
  }
  if(forest.level!==level)forest.level=level;
  forest.drawAtmosphere(c,adventure.camera,adventure.time);
  drawWater(c,adventure.water,adventure.camera,adventure.time,false);
  forest.drawDetails(c,adventure.camera,adventure.time,adventure.sim);
  const t2=performance.now();
  drawSlime(c,adventure.sim,adventure.camera,adventure.time,adventure.debug);
  const t3=performance.now();
  drawWater(c,adventure.water,adventure.camera,adventure.time,true);
  this.texture.refresh();hud(time,this.game.loop.actualFps);
  timings.physics=t1-t0;timings.art=t2-t1;timings.surface=t3-t2;timings.upload=performance.now()-t3;
 }
}
function renderBackend(){
 const probe=document.createElement('canvas'),gl=probe.getContext('webgl');
 if(!gl)return Phaser.CANVAS;
 const info=gl.getExtension('WEBGL_debug_renderer_info');
 const name=info?String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)):'';
 gl.getExtension('WEBGL_lose_context')?.loseContext();
 return /swiftshader|llvmpipe|software|microsoft basic/i.test(name)?Phaser.CANVAS:Phaser.WEBGL;
}
const phaser=new Phaser.Game({type:renderBackend(),parent:'game',width:W,height:H,backgroundColor:'#9db49a',scene:ForestScene,render:{antialias:true,roundPixels:false},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},audio:{noAudio:true},banner:false});
Object.defineProperty(window,'__slime',{value:()=>({started:adventure.started,paused:adventure.paused,complete:adventure.level.complete,name:adventure.name,id:adventure.level.id,scheme:input.scheme,overlay,camera:adventure.camera,cameraY:adventure.cameraY,activeGroup:adventure.sim.activeGroup,climbing:adventure.sim.climbing,splashCount:adventure.water.drops.length,center:adventure.sim.center(),groups:adventure.sim.groups().map(g=>({id:g,...adventure.sim.center(g)})),particles:adventure.sim.particles.map(p=>({x:p.x,y:p.y,group:p.group})),gateOpen:adventure.level.gateOpen,plates:adventure.level.plateActive,checkpoint:adventure.level.checkpoint,latchOn:adventure.level instanceof HoneyLevel?adventure.level.latchOn:false,wax:adventure.level instanceof HoneyLevel?adventure.level.wax.map(w=>({x:w.rect.x,solid:w.solid,load:w.load,missing:w.missing})):[] ,fps:phaser.loop.actualFps,timings:{...timings}})});
