import Phaser from 'phaser';
import {Adventure,bossBar} from './game';
import {isBoss} from './ai/machine';
import {ForestArt,W,H} from './art';
import {HoneyArt} from './honey-art';
import {HoneyLevel} from './honey-level';
import {TideArt} from './tide-art';
import {TideLevel} from './tide-level';
import {WindLevel} from './wind-level';
import {MirrorLevel} from './mirror-level';
import {WindArt} from './wind-art';
import {MirrorArt} from './mirror-art';
import {drawSlime} from './slime-view';
import {drawWater} from './water-view';
import {drawHoney} from './honey-view';
import {CATALOG,FEATURES_FOREST,levelById} from './catalog';
import {BINDING_LABELS,grantSouvenir,isPlayable,keyLabel,loadProgress,markCleared,nextPlayable,revokeSouvenirs,saveProgress,type KeyAction,type Progress,type SchemePref} from './progress';
import {applySelNum,bindStamps,deleteSel,drawGizmos,EDITOR_DRAFT_KEY,EDITOR_MODES,exportMap,frameSel,isCustomId,isOfficialId,listMaps,loadMap,makeSession,MODE_LABEL,moveSel,pick,placeAt,pushUndo,redo,renderHub,renderPalette,resizeWorld,saveMap,saveOfficialOverride,screenToWorld,sessionFromDraft,setMode,setTool,snapSel,snapshotDraft,STAMPS,toggleFold,togglePickLock,undo,type EditorMode,type EditorSession,type MapDoc} from './editor';
import {renderInspect} from './editor/inspect';
import {hydrateKitImages} from './kit/view';
import {reachable} from './wfc/reach';
import {Level} from './level';
import {emptyActions,PlayerInput,type Actions} from './input';
import {drawCombat} from './combat/combat';
import {EnemyArt} from './vfx/enemies';
import {itemOf} from './items/defs';
import {drawMinimap} from './minimap';
import {AudioBus} from './audio/bus';
import {asset} from './asset';
import './style.css';

document.documentElement.style.setProperty('--title-art',`url("${asset('assets/ui/title.png')}")`);
document.documentElement.style.setProperty('--tower-art',`url("${asset('assets/ui/gallery-tower.jpg')}")`);

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
     <button id="open-editor" class="ghost">地图编辑器</button>
    </nav>
    <label class="title-name">给你的史莱姆取名<input id="slime-name" type="text" maxlength="6" spellcheck="false" autocomplete="off" aria-label="给你的史莱姆取个名字"/></label>
   </div>
   <button id="title-sound" class="icon-button muted title-sound" aria-label="开启环境音" title="环境音">${soundIcon}</button>
  </section>
  <section id="levels" class="gallery hidden" aria-label="选择关卡">
   <img class="gallery-bg" src="${asset('assets/ui/gallery-tower.jpg')}" alt=""/>
   <div class="gallery-veil"></div>
   <header class="gallery-hero">
    <img class="gallery-icon" src="${asset('assets/ui/gallery-slime.png')}" alt=""/>
    <div>
     <div class="eyebrow"><span></span> SLIME FABLE</div>
     <h2 id="gallery-name">潮汐石廊</h2>
     <p id="gallery-en">TIDAL GALLERY</p>
     <p id="gallery-blurb">潮起潮落，石廊之间。</p>
    </div>
   </header>
   <div id="gallery-stack" class="gallery-stack"></div>
   <aside class="gallery-rail-wrap">
    <div class="rail-panel">
     <div class="gallery-rail-head">关卡选择</div>
     <div id="gallery-rail" class="gallery-rail"></div>
     <button id="levels-back" class="gallery-back"><span>←</span> 返回</button>
    </div>
   </aside>
   <img class="gallery-mascot" src="${asset('assets/ui/gallery-slime.png')}" alt=""/>
  </section>
  <section id="settings" class="overlay hidden" aria-label="操作设置">
   <div class="overlay-card settings-card">
    <div class="eyebrow"><span></span> CONTROLS</div>
    <h2>操作设置</h2>
    <p>可以锁定一种输入，也可以让它跟着你最近的操作走。</p>
    <div id="scheme-row" class="scheme-row"></div>
    <div class="audio-panel">
     <h3>声音</h3>
     <label class="vol-row"><span>音效</span><input id="vol-sfx" type="range" min="0" max="100" step="1"/></label>
     <label class="vol-row"><span>音乐</span><input id="vol-music" type="range" min="0" max="100" step="1"/></label>
     <button type="button" id="sound-toggle" class="scheme-chip">声音：开</button>
    </div>
    <div id="bind-list" class="bind-list"></div>
    <p class="settings-note">点一行再按新键即可改绑。Esc 取消。</p>
    <button id="settings-back" class="text-button">返回</button>
   </div>
  </section>
  <section id="editor-hub" class="overlay hidden" aria-label="地图编辑器"></section>
  <section id="editor-ui" class="editor-ui hidden" aria-label="编辑画布">
   <header class="editor-top">
    <div class="ed-group ed-brand">
     <button type="button" id="editor-leave" class="ed-btn" title="返回编辑大厅 (Esc)"><span class="ed-ic">←</span>大厅</button>
     <span class="ed-sep"></span>
     <input id="editor-name" maxlength="16" spellcheck="false" aria-label="关卡名"/>
     <em id="editor-dirty" class="ed-dirty" title="有未保存改动">●</em>
    </div>
    <div class="ed-group">
     <button type="button" id="editor-undo" class="ed-btn" title="撤销 (Ctrl+Z)"><span class="ed-ic">↶</span>撤销</button>
     <button type="button" id="editor-redo" class="ed-btn" title="重做 (Ctrl+Y)"><span class="ed-ic">↷</span>重做</button>
     <span class="ed-sep"></span>
     <label class="ed-field">吸附<select id="editor-snap"><option value="0">关</option><option value="8">8</option><option value="16" selected>16</option><option value="32">32</option></select></label>
    </div>
    <span id="editor-warn" class="editor-warn"></span>
    <div class="ed-group">
     <button type="button" id="editor-export" class="ed-btn" title="导出 JSON"><span class="ed-ic">⇩</span>导出</button>
     <button type="button" id="editor-save" class="ed-btn" title="保存 (Ctrl+S)"><span class="ed-ic">✓</span>保存</button>
     <button type="button" id="editor-play" class="ed-btn primary" title="试玩这张图"><span class="ed-ic">▶</span>试玩</button>
    </div>
   </header>
   <aside id="editor-palette" class="editor-palette"></aside>
   <aside id="editor-inspect" class="editor-inspect"></aside>
   <footer class="editor-bot">
    <div class="ed-group ed-tools">
     <button type="button" class="ed-btn" data-tool="select" title="选择 (V)"><span class="ed-ic">⬚</span>选择</button>
     <button type="button" class="ed-btn" data-tool="pan" title="平移 (H / 空格 / 中键)"><span class="ed-ic">✥</span>平移</button>
     <button type="button" class="ed-btn" data-tool="erase" title="橡皮：点一下删掉"><span class="ed-ic">⌫</span>橡皮</button>
    </div>
    <span class="ed-sep"></span>
    <div class="ed-group ed-modes" id="editor-modes" role="tablist" aria-label="过滤模式"></div>
    <span id="editor-status" class="ed-status"></span>
   </footer>
  </section>
  <header class="hud play-only"><div class="identity"><span class="brand-icon">${drop}</span><div><div class="brand">史莱姆寓言 <span>SLIME FABLE</span></div><div class="chapter">第一章 <b>·</b> 苔光森林</div></div></div>
   <div class="hud-right"><span id="vitals" class="vitals"><span id="hearts" class="hearts"></span><span id="ammo" class="ammo"></span></span><span class="dew-count"><span>◈</span> <b id="dew-count">0</b><em id="dew-total">/ 6</em></span><i></i><button type="button" id="pause" class="icon-button" aria-label="暂停游戏" title="暂停 / Esc">Ⅱ</button></div>
  </header>
  <div id="boss-frame" class="boss-frame hidden play-only"><b id="boss-name"></b><span class="boss-bar"><i id="boss-fill"></i></span><b id="boss-name-b" class="hidden"></b><span id="boss-bar-b" class="boss-bar hidden"><i id="boss-fill-b"></i></span></div>
  <div id="toast-col" class="toast-col play-only">
   <div id="quest-line" class="quest-line"></div>
   <div id="notice-list" class="notice-list"></div>
   <div id="hint" class="hint" role="status">轻轻起跳，感受落地时的柔软回弹</div>
  </div>
  <aside id="pack" class="pack hidden play-only" aria-label="背包"></aside>
  <div class="location play-only"><span class="location-number">01</span><div><b id="location-name">露水草甸</b><small id="location-en">DEWMEADOW</small></div></div>
  <footer id="controls-keyboard" class="controls play-only"></footer>
  <footer id="controls-gamepad" class="controls play-only hidden">
   <span>${gp('stick','L')} 移动 / 攀爬</span>
   <span>${gp('a','A')} 跳跃</span>
   <span>${gp('b','B')} 挤压</span>
   <span>${gp('y','Y')} 分裂</span>
   <span>${gp('x','X')} 合并</span>
   <span>${gp('rb','RB')} 切换</span>
   <span class="forest-only">${gp('lb','LT')} 斩</span>
   <span class="forest-only">${gp('rb','RT')} 弹</span>
   <span>${gp('back','◀')} 检查点</span>
   <span>${gp('start','≡')} 菜单</span>
  </footer>
  <div id="touch-pad" class="touch-pad play-only hidden">
   <div id="stick-well" class="stick-well"><div class="stick-ring"></div><div id="stick-knob" class="stick-knob"></div></div>
   <div class="touch-skills">
    <button type="button" data-act="split">分</button>
    <button type="button" data-act="switch">换</button>
    <button type="button" data-act="merge">合</button>
    <button type="button" class="forest-only" data-act="melee">斩</button>
    <button type="button" class="forest-only" data-act="ranged">弹</button>
    <button type="button" class="forest-only" data-act="dodge">闪</button>
    <button type="button" class="forest-only" data-act="inventory">包</button>
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
  <canvas id="minimap" class="minimap play-only" width="220" height="96" aria-label="小地图"></canvas>
  <nav id="body-picker" class="body-picker hidden play-only" aria-label="选择控制的史莱姆"><button data-body="0">1 号</button><button data-body="1">2 号</button></nav>
  <div id="modal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-card"><span class="modal-mark">${drop}</span><div id="modal-eyebrow" class="eyebrow">TAKE A LITTLE BREATH</div><h2 id="modal-title">在苔藓上，歇一会儿。</h2><p id="modal-copy">森林会等你。准备好后，再出发。</p>
   <div id="modal-pause" class="modal-actions">
    <button id="resume" class="primary">继续冒险 <span>→</span></button>
    <button id="reset" class="text-button">回到最近的检查点</button>
    <button id="pause-levels" class="text-button">选择关卡</button>
    <button id="pause-settings" class="text-button">操作设置</button>
    <button id="pause-editor" class="text-button hidden">返回编辑</button>
    <button id="quit-title" class="text-button">返回主菜单</button>
   </div>
   <div id="modal-win" class="modal-actions hidden">
    <button id="stay-explore" class="primary">继续探索</button>
    <button id="next-level" class="text-button">进入下一关 <span>→</span></button>
    <button id="win-title" class="text-button">返回主菜单</button>
   </div>
   <div id="modal-dead" class="modal-actions hidden">
    <button id="retry" class="primary">重新冒险 <span>→</span></button>
    <button id="dead-title" class="text-button">返回主菜单</button>
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
let gallery:TideArt|undefined;
let windArt:WindArt|undefined;
let mirrorArt:MirrorArt|undefined;
const foes=new EnemyArt();
let overlay:'none'|'levels'|'settings'|'editor-hub'|'editor'='none';
let overlayFrom:'title'|'pause'='title';
let editor:EditorSession|undefined;
let editorPreview:Level|undefined;
let editorArtTick=-1;
let editorChapter='';
let editorSize='';
let rebind:KeyAction|undefined;
let menuFocus=0;
const el=(id:string)=>document.getElementById(id)!;
const shell=document.querySelector<HTMLElement>('.game-shell')!;
function resize(){shell.style.setProperty('--ui-scale',String(Math.min(window.innerWidth/1280,window.innerHeight/720)));}
resize();window.addEventListener('resize',resize);

const bus=new AudioBus();
bus.setLevels(progress.sfxVol,progress.musicVol);
function syncSoundUi(){
 const on=progress.soundOn;
 el('title-sound').classList.toggle('muted',!on);
 el('title-sound').setAttribute('aria-label',on?'关闭声音':'开启声音');
 const toggle=el('sound-toggle');
 toggle.textContent=on?'声音：开':'声音：关';
 toggle.classList.toggle('on',on);
 (el('vol-sfx') as HTMLInputElement).value=String(Math.round(progress.sfxVol*100));
 (el('vol-music') as HTMLInputElement).value=String(Math.round(progress.musicVol*100));
}
function applySound(on=progress.soundOn){
 progress={...progress,soundOn:on};
 persist();
 bus.setLevels(progress.sfxVol,progress.musicVol);
 void bus.setEnabled(on).then(()=>{if(on)bus.setBgm('explore',!adventure.started);});
 syncSoundUi();
}
function toggleSound(){applySound(!progress.soundOn);}
el('title-sound').onclick=e=>{(e.currentTarget as HTMLElement).blur();toggleSound();};
el('sound-toggle').onclick=e=>{(e.currentTarget as HTMLElement).blur();toggleSound();};
for(const id of ['vol-sfx','vol-music'] as const){
 el(id).addEventListener('input',()=>{
  const sfx=Number((el('vol-sfx') as HTMLInputElement).value)/100;
  const music=Number((el('vol-music') as HTMLInputElement).value)/100;
  progress={...progress,sfxVol:sfx,musicVol:music,soundOn:true};
  persist();
  bus.setLevels(sfx,music);
  void bus.setEnabled(true).then(()=>{if(progress.soundOn)bus.setBgm('explore',!adventure.started);});
  syncSoundUi();
 });
}
syncSoundUi();

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
function customEntry(id:string){
 const doc=loadMap(id);
 return {id,index:0,name:doc?.name??'自定义',en:'CUSTOM',chapter:'自定义',blurb:doc?.name??'',winEyebrow:'A PATH YOU DREW',winTitle:'你走出了自己的林子。',dewName:'晨露',status:'ready' as const,features:doc?.features??FEATURES_FOREST,camY:CATALOG[0].camY};
}
function entryOf(){
 return isCustomId(adventure.level.id)?customEntry(adventure.level.id):levelById(adventure.level.id)??CATALOG[0];
}

function showOverlay(next:'none'|'levels'|'settings'|'editor-hub'|'editor',from:'title'|'pause'=overlayFrom){
 overlay=next;overlayFrom=from;
 el('levels').classList.toggle('hidden',next!=='levels');
 el('settings').classList.toggle('hidden',next!=='settings');
 el('editor-hub').classList.toggle('hidden',next!=='editor-hub');
 el('editor-ui').classList.toggle('hidden',next!=='editor');
 shell.classList.toggle('editing',next==='editor');
 if(next==='levels')renderLevels();
 if(next==='settings')renderSettings();
 if(next==='editor-hub')paintHub();
 if(next==='editor')refreshEditorUi();
 menuFocus=0;syncFocus();
}

function goTitle(){
 adventure.fromEditor=false;
 adventure.quitToTitle();
 shell.classList.remove('playing');
 el('pause-editor').classList.add('hidden');
 showOverlay('none','title');
}

function playCustom(doc:MapDoc,fromEditor=false){
 commitName();
 progress={...progress,lastLevel:doc.id};
 persist();
 adventure.fromEditor=fromEditor;
 adventure.keepFeatures=doc.features;
 adventure.keepSource=doc.source??(isOfficialId(doc.id)?doc.id:'forest');
 adventure.selectLevel(doc.id,doc.layout);
 adventure.level.features=doc.features;
 adventure.name=progress.name;
 adventure.start();
 renderKeyboardBar();
 shell.classList.add('playing');
 showOverlay('none','title');
 (document.activeElement as HTMLElement)?.blur();
 applySound(progress.soundOn);
 el('pause-editor').classList.toggle('hidden',!fromEditor);
}

function enterLevel(id:string){
 if(isCustomId(id)){
  const doc=loadMap(id);if(doc)playCustom(doc,false);
  return;
 }
 commitName();
 if(!isPlayable(levelById(id)??CATALOG[0],progress))return;
 progress={...progress,lastLevel:id};
 persist();
 adventure.fromEditor=false;
 adventure.keepSource=undefined;
 adventure.keepFeatures=undefined;
 adventure.selectLevel(id);
 adventure.name=progress.name;
 adventure.start();
 renderKeyboardBar();
 shell.classList.add('playing');
 showOverlay('none','title');
 (document.activeElement as HTMLElement)?.blur();
 applySound(progress.soundOn);
 el('pause-editor').classList.add('hidden');
}

function begin(){
 if(isCustomId(progress.lastLevel)&&loadMap(progress.lastLevel)){enterLevel(progress.lastLevel);return;}
 enterLevel(isPlayable(levelById(progress.lastLevel)??CATALOG[0],progress)?progress.lastLevel:'forest');
}

function renderKeyboardBar(){
 const b=progress.bindings,k=(action:KeyAction,wide=false)=>`<kbd${wide?' class="wide"':''}>${keyLabel(b[action])}</kbd>`;
 const extra=adventure.level.features.combat?`<span>${k('melee')} 斩</span><span>${k('ranged')} 弹</span><span>${k('dodge')} 闪</span><span>${k('inventory')} 包</span>`:'';
 el('controls-keyboard').innerHTML=`<span>${k('left')}${k('right')} 移动</span><span>${k('jump',true)} 跳跃</span><span>${k('up')} 攀爬 ${k('down')} 挤压</span><span>${k('split')} 分裂</span><span>${k('switch')} 切换</span><span>${k('merge')} 合并</span>${extra}<span>${k('reset')} 回溯</span><button id="help" title="操作说明">?</button>`;
 el('help').onclick=()=>showOverlay('settings',adventure.started?'pause':'title');
}

const TIERS:{id:string;x:number;y:number;thumb:string}[]=[
 {id:'forest',x:16,y:80,thumb:'32% 86%'},
 {id:'honey',x:15,y:62,thumb:'32% 66%'},
 {id:'tide',x:43,y:47,thumb:'32% 50%'},
 {id:'wind',x:14,y:31,thumb:'32% 32%'},
 {id:'mirror',x:42,y:13,thumb:'32% 14%'},
];
let galleryPick='tide';

function previewLevel(id:string){
 const entry=levelById(id);if(!entry)return;
 galleryPick=id;
 el('gallery-name').textContent=entry.name;
 el('gallery-en').textContent=entry.en;
 el('gallery-blurb').textContent=entry.blurb;
 el('levels').querySelectorAll<HTMLElement>('[data-id]').forEach(node=>node.classList.toggle('on',node.dataset.id===id));
 const tier=TIERS.find(t=>t.id===id);
 const spot=el('levels').querySelector<HTMLElement>('.tier-spot');
 if(spot&&tier){spot.style.left=`${tier.x}%`;spot.style.top=`${tier.y}%`;}
}

function renderLevels(){
 if(!CATALOG.some(entry=>entry.id===galleryPick))galleryPick=progress.lastLevel||'forest';
 const spot=TIERS.find(t=>t.id===galleryPick)??TIERS[2];
 el('gallery-stack').innerHTML=`<i class="tier-spot" style="left:${spot.x}%;top:${spot.y}%"></i>`+TIERS.map(tier=>{
  const entry=levelById(tier.id)!;
  const open=isPlayable(entry,progress);
  return `<button type="button" class="tier-tag ${entry.status}${open?'':' locked'}${tier.id===galleryPick?' on':''}" data-id="${tier.id}" style="left:${tier.x}%;top:${tier.y}%"><i>${String(entry.index).padStart(2,'0')}</i><b>${entry.name}</b></button>`;
 }).join('');
 const customs=listMaps();
 el('gallery-rail').innerHTML=CATALOG.map((entry,i)=>{
  const open=isPlayable(entry,progress);
  const tier=TIERS.find(t=>t.id===entry.id);
  // Chapters 1–5 are crops of the tower painting; 6–10 have their own thumbnail paintings.
  const thumb=tier?`background-position:${tier.thumb}`:`background-image:url('${asset(`assets/ui/thumb-${entry.id}.jpg`)}');background-size:cover;background-position:50% 45%`;
  return `<button type="button" class="tier-card ${entry.status}${open?'':' locked'}${entry.id===galleryPick?' on':''}" data-id="${entry.id}" style="--rail-i:${i}"><span class="tier-arrow">→</span><span class="tier-meta"><small>${String(entry.index).padStart(2,'0')}</small><b>${entry.name}</b>${entry.status==='coming'?'<em>制作中</em>':''}</span><span class="tier-thumb" style="${thumb}"></span></button>`;
 }).join('')+(customs.length?`<div class="gallery-rail-head">自定义</div>`+customs.map(m=>`<button type="button" class="tier-card ugc${m.id===galleryPick?' on':''}" data-custom="${m.id}"><span class="tier-arrow">→</span><span class="tier-meta"><small>UGC</small><b>${m.name}</b></span><span class="tier-thumb ugc"></span></button>`).join(''):'');
 el('levels').querySelectorAll<HTMLButtonElement>('[data-id]').forEach(button=>{
  const id=button.dataset.id||'forest';
  button.onmouseenter=()=>previewLevel(id);
  button.onfocus=()=>previewLevel(id);
  button.onclick=()=>{
   previewLevel(id);
   if(isPlayable(levelById(id)??CATALOG[0],progress))enterLevel(id);
  };
 });
 el('levels').querySelectorAll<HTMLButtonElement>('[data-custom]').forEach(button=>{
  const id=button.dataset.custom!;
  button.onclick=()=>enterLevel(id);
 });
 previewLevel(galleryPick);
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

function paintHub(){
 renderHub(el('editor-hub'),openEditor,doc=>playCustom(doc,false),()=>showOverlay('none'));
}

let editorDraftAt=0;
function persistDraft(){
 editorDraftAt=performance.now();
 try{
  if(editor)sessionStorage.setItem(EDITOR_DRAFT_KEY,JSON.stringify(snapshotDraft(editor)));
  else sessionStorage.removeItem(EDITOR_DRAFT_KEY);
 }catch{/* storage full or blocked: refresh just falls back to the hub */}
}
/** A page refresh inside the editor reopens the same map, camera and mode instead of dropping to the title. */
function restoreDraft(){
 try{
  const raw=sessionStorage.getItem(EDITOR_DRAFT_KEY);if(!raw)return false;
  const session=sessionFromDraft(JSON.parse(raw));if(!session)return false;
  editor=session;
  editorPreview=new Level(session.doc.layout);
  editorArtTick=-1;
  hydrateKitImages();
  showOverlay('editor','title');
  return true;
 }catch{return false;}
}

const TOOL_LABEL:Record<string,string>={select:'选择',erase:'橡皮',pan:'平移'};
let editorStatusText='';
/** Cheap enough to run every frame; only touches the DOM when the text actually changes. */
function syncEditorStatus(){
 if(!editor)return;
 const text=`${Math.round(editor.cameraX)}, ${Math.round(-editor.cameraY)}  ·  ${editor.kit?`放置 ${editor.kit.name}`:TOOL_LABEL[editor.tool]??editor.tool}  ·  吸附 ${editor.snap||'关'}`;
 if(text===editorStatusText)return;
 editorStatusText=text;
 el('editor-status').textContent=text;
}
function refreshEditorUi(){
 if(!editor)return;
 (el('editor-name') as HTMLInputElement).value=editor.doc.name;
 (el('editor-snap') as HTMLSelectElement).value=String(editor.snap);
 el('editor-warn').textContent=editor.warn;
 el('editor-dirty').classList.toggle('on',editor.dirty);
 syncEditorStatus();
 el('editor-ui').querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(btn=>btn.classList.toggle('on',editor!.tool===btn.dataset.tool));
 el('editor-modes').innerHTML=EDITOR_MODES.map((m,i)=>`<button type="button" class="ed-chip${editor!.mode===m?' on':''}" data-mode="${m}" role="tab" aria-selected="${editor!.mode===m}" title="${MODE_LABEL[m]}模式 (${i+1})"><i class="mode-dot ${m}"></i>${MODE_LABEL[m]}</button>`).join('');
 el('editor-modes').querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(btn=>btn.onclick=()=>{
  if(!editor)return;
  setMode(editor,btn.dataset.mode as EditorMode);
  refreshEditorUi();
 });
 persistDraft();
 renderPalette(el('editor-palette'),editor,id=>{
  setTool(editor!,id);
  refreshEditorUi();
 });
 bindStamps(el('editor-palette'),id=>{
  const stamp=STAMPS.find(s=>s.id===id);if(!stamp||!editor)return;
  pushUndo(editor);
  stamp.build(editor.doc.layout,editor.cameraX+420,600);
  editor.dirty=true;editor.artTick++;
  refreshEditorUi();
 });
 renderInspect(el('editor-inspect'),editor);
 bindInspect();
}

function bindInspect(){
 const box=el('editor-inspect');
 box.querySelector<HTMLInputElement>('[data-query]')?.addEventListener('input',e=>{
  if(!editor)return;
  editor.query=(e.target as HTMLInputElement).value;
  const q=editor.query.trim();
  box.querySelectorAll<HTMLElement>('[data-label]').forEach(row=>{row.hidden=!!q&&!row.dataset.label!.includes(q);});
 });
 box.querySelectorAll<HTMLButtonElement>('[data-fold]').forEach(btn=>btn.onclick=()=>{
  if(!editor)return;
  toggleFold(editor,btn.dataset.fold as Parameters<typeof toggleFold>[1]);
  refreshEditorUi();
 });
 box.querySelectorAll<HTMLButtonElement>('[data-lock]').forEach(btn=>btn.onclick=ev=>{
  ev.stopPropagation();
  if(!editor)return;
  togglePickLock(editor,btn.dataset.lock as Parameters<typeof togglePickLock>[1]);
  refreshEditorUi();
 });
 box.querySelectorAll<HTMLButtonElement>('[data-row]').forEach(btn=>{
  const [kind,index]=btn.dataset.row!.split(':');
  const choose=()=>{if(!editor)return;editor.sel={kind,index:Number(index)};};
  btn.onclick=()=>{choose();refreshEditorUi();};
  btn.ondblclick=()=>{choose();if(editor)frameSel(editor);refreshEditorUi();};
 });
 box.querySelector<HTMLInputElement>('[data-name]')?.addEventListener('change',e=>{if(editor)editor.doc.name=(e.target as HTMLInputElement).value.slice(0,16);});
 box.querySelectorAll<HTMLInputElement>('[data-world]').forEach(input=>input.onchange=()=>{
  if(!editor)return;
  const key=input.dataset.world as 'width'|'height'|'fallY';
  const n=Number(input.value);
  if(key==='fallY')editor.doc.layout.fallY=n;
  else resizeWorld(editor,key==='width'?n:editor.doc.layout.width,key==='height'?n:editor.doc.layout.height);
  refreshEditorUi();
 });
 box.querySelectorAll<HTMLInputElement>('[data-feat]').forEach(input=>input.onchange=()=>{
  if(!editor)return;
  const key=input.dataset.feat as keyof typeof editor.doc.features;
  editor.doc.features[key]=input.checked;
 });
 box.querySelectorAll<HTMLInputElement>('[data-f]').forEach(input=>input.onchange=()=>{
  if(!editor?.sel)return;
  pushUndo(editor);
  applySelNum(editor.doc.layout,editor.sel,input.dataset.f as 'x'|'y'|'w'|'h',Number(input.value));
  editor.dirty=true;editor.artTick++;
  refreshEditorUi();
 });
 box.querySelector<HTMLInputElement>('[data-kind]')?.addEventListener('change',e=>{
  if(!editor?.sel||editor.sel.kind!=='base')return;
  pushUndo(editor);
  editor.doc.layout.base[editor.sel.index].kind=(e.target as HTMLInputElement).value;
  editor.dirty=true;editor.artTick++;
 });
 box.querySelector<HTMLInputElement>('[data-oneway]')?.addEventListener('change',e=>{
  if(!editor?.sel||editor.sel.kind!=='base')return;
  pushUndo(editor);
  editor.doc.layout.base[editor.sel.index].oneWay=(e.target as HTMLInputElement).checked;
  editor.dirty=true;editor.artTick++;
 });
 box.querySelector<HTMLInputElement>('[data-s]')?.addEventListener('change',e=>{
  if(!editor?.sel||editor.sel.kind!=='dress')return;
  const item=editor.doc.layout.dressing?.[editor.sel.index];if(!item)return;
  pushUndo(editor);
  item.s=Number((e.target as HTMLInputElement).value)||1;
  editor.dirty=true;editor.artTick++;
 });
 box.querySelector<HTMLInputElement>('[data-flip]')?.addEventListener('change',e=>{
  if(!editor?.sel||editor.sel.kind!=='dress')return;
  const item=editor.doc.layout.dressing?.[editor.sel.index];if(!item)return;
  pushUndo(editor);
  item.flip=(e.target as HTMLInputElement).checked?-1:1;
  editor.dirty=true;editor.artTick++;
 });
 box.querySelector<HTMLInputElement>('[data-dew-role]')?.addEventListener('change',e=>{
  if(!editor?.sel||editor.sel.kind!=='dew')return;
  editor.doc.layout.dew[editor.sel.index].role=(e.target as HTMLInputElement).checked?'main':'bonus';
  editor.dirty=true;
 });
 box.querySelector<HTMLInputElement>('[data-patrol]')?.addEventListener('change',e=>{
  if(!editor?.sel||editor.sel.kind!=='enemy')return;
  editor.doc.layout.enemies[editor.sel.index].patrol=Number((e.target as HTMLInputElement).value)||50;
  editor.dirty=true;
 });
 box.querySelector<HTMLInputElement>('[data-sign-text]')?.addEventListener('change',e=>{
  if(!editor?.sel||editor.sel.kind!=='sign')return;
  const sign=editor.doc.layout.signs?.[editor.sel.index];if(sign)sign.text=(e.target as HTMLInputElement).value;
  editor.dirty=true;
 });
 box.querySelector<HTMLInputElement>('[data-sign-arrow]')?.addEventListener('change',e=>{
  if(!editor?.sel||editor.sel.kind!=='sign')return;
  const sign=editor.doc.layout.signs?.[editor.sel.index];if(sign)sign.arrow=(e.target as HTMLInputElement).value;
  editor.dirty=true;
 });
 box.querySelector<HTMLInputElement>('[data-portal-pair]')?.addEventListener('change',e=>{
  if(!editor?.sel||editor.sel.kind!=='portal')return;
  const gate=editor.doc.layout.portals?.[editor.sel.index];if(!gate)return;
  gate.pair=(e.target as HTMLInputElement).value.trim()||gate.pair;
  editor.dirty=true;
 });
 box.querySelector<HTMLInputElement>('[data-hint-text]')?.addEventListener('change',e=>{
  if(!editor?.sel||editor.sel.kind!=='hint')return;
  const hint=editor.doc.layout.hints?.[editor.sel.index];if(hint)hint.text=(e.target as HTMLInputElement).value;
  editor.dirty=true;
 });
 box.querySelector<HTMLInputElement>('[data-area-name]')?.addEventListener('change',e=>{
  if(!editor?.sel||editor.sel.kind!=='area')return;
  editor.doc.layout.areas[editor.sel.index].name=(e.target as HTMLInputElement).value;
  editor.dirty=true;refreshEditorUi();
 });
 box.querySelector<HTMLInputElement>('[data-area-sub]')?.addEventListener('change',e=>{
  if(!editor?.sel||editor.sel.kind!=='area')return;
  editor.doc.layout.areas[editor.sel.index].sub=(e.target as HTMLInputElement).value;
  editor.dirty=true;
 });
}

function openEditor(doc:MapDoc){
 editor=makeSession(doc);
 editorPreview=new Level(doc.layout);
 editorArtTick=-1;
 hydrateKitImages();
 showOverlay('editor','title');
}

function saveEditor(){
 if(!editor)return;
 const reach=reachable(editor.doc.layout);
 editor.warn=reach.ok?'':`提醒：${reach.dew?'':'晨露难到达'}${reach.exit?'':' · 通关线难到达'}`;
 if(isOfficialId(editor.doc.id))saveOfficialOverride(editor.doc);
 else saveMap(editor.doc);
 editor.dirty=false;
 refreshEditorUi();
}

function playEditor(){
 if(!editor)return;
 playCustom(editor.doc,true);
}

function leaveEditor(){
 if(editor?.dirty&&!confirm('有未保存改动，确定返回？'))return;
 editor=undefined;
 persistDraft();
 showOverlay('editor-hub','title');
}

function editorWorld(event:PointerEvent){
 const bounds=el('game').getBoundingClientRect();
 return screenToWorld(event.clientX-bounds.left,event.clientY-bounds.top,editor?.cameraX??0,editor?.cameraY??0,bounds);
}

function menuButtons(){
 const root=overlay==='levels'?el('levels'):overlay==='settings'?el('settings'):overlay==='editor-hub'?el('editor-hub'):overlay==='editor'?el('editor-ui'):!el('modal').classList.contains('hidden')?el('modal'):el('title');
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
  if(overlay==='editor')leaveEditor();
  else if(overlay!=='none')showOverlay(overlay==='editor-hub'?'none':'none');
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
el('open-editor').onclick=()=>showOverlay('editor-hub','title');
el('levels-back').onclick=()=>showOverlay('none');
el('editor-undo').onclick=()=>{if(editor){undo(editor);refreshEditorUi();}};
el('editor-redo').onclick=()=>{if(editor){redo(editor);refreshEditorUi();}};
el('editor-save').onclick=saveEditor;
el('editor-play').onclick=playEditor;
el('editor-leave').onclick=leaveEditor;
el('editor-export').onclick=()=>{
 if(!editor)return;
 const blob=new Blob([exportMap(editor.doc)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${editor.doc.name}.json`;a.click();
};
el('editor-snap').onchange=()=>{if(!editor)return;editor.snap=Number((el('editor-snap') as HTMLSelectElement).value);syncEditorStatus();persistDraft();};
el('editor-name').onchange=()=>{if(editor)editor.doc.name=(el('editor-name') as HTMLInputElement).value.slice(0,16);};
el('editor-ui').querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(btn=>btn.onclick=()=>{if(!editor)return;setTool(editor,btn.dataset.tool!);refreshEditorUi();});
el('pause-editor').onclick=()=>{
 adventure.quitToTitle();
 shell.classList.remove('playing');
 if(editor)showOverlay('editor','title');
 else showOverlay('editor-hub','title');
};
el('settings-back').onclick=()=>{rebind=undefined;input.listening=false;showOverlay('none');};
el('pause').onclick=e=>{(e.currentTarget as HTMLElement).blur();adventure.togglePause();};
el('resume').onclick=()=>adventure.togglePause();
el('reset').onclick=()=>{adventure.reset();adventure.paused=false;};
el('pause-levels').onclick=()=>showOverlay('levels','pause');
el('pause-settings').onclick=()=>showOverlay('settings','pause');
el('quit-title').onclick=goTitle;
el('stay-explore').onclick=()=>adventure.stay();
el('next-level').onclick=()=>{
 const next=nextPlayable(adventure.level.id,progress);
 if(next)enterLevel(next.id);
};
el('win-title').onclick=goTitle;
el('retry').onclick=()=>{
 const gone=adventure.restartRun();
 progress=revokeSouvenirs(gone,progress);
 persist();
};
el('dead-title').onclick=goTitle;
nameInput().addEventListener('keydown',e=>{if(e.code==='Enter'){e.preventDefault();commitName();begin();}});
document.addEventListener('contextmenu',e=>e.preventDefault());
document.querySelectorAll<HTMLButtonElement>('[data-body]').forEach(button=>button.onclick=()=>{adventure.clearInput();adventure.sim.selectGroup(Number(button.dataset.body));button.blur();});
el('game').addEventListener('pointerdown',event=>{
  if(overlay==='editor'&&editor){
  const p=editorWorld(event);
  if(editor.tool==='pan'||event.button===1){editor.drag={kind:'pan',x:p.x,y:p.y,ox:editor.cameraX,oy:editor.cameraY};return;}
  if(editor.tool==='erase'){pick(editor,p.x,p.y);deleteSel(editor);refreshEditorUi();return;}
  if(editor.kit){
   if(editor.kit.place==='point'){placeAt(editor,p.x,p.y);refreshEditorUi();return;}
   editor.drag={kind:'place',x:p.x,y:p.y,ox:p.x,oy:p.y};return;
  }
  pick(editor,p.x,p.y,event.altKey);
  if(editor.sel){pushUndo(editor);editor.drag={kind:'move',x:p.x,y:p.y,ox:p.x,oy:p.y};}
  refreshEditorUi();
  return;
 }
 if(!adventure.started||adventure.paused||adventure.dead||adventure.frozen()||input.scheme==='touch')return;
 const bounds=el('game').getBoundingClientRect(),x=(event.clientX-bounds.left)/bounds.width*W+adventure.camera,y=(event.clientY-bounds.top)/bounds.height*H-adventure.cameraY;
 adventure.aimX=x;
 if(event.button===2){input.setMouse('dodge',true);return;}
 if(event.button!==0)return;
 const target=adventure.sim.groups().map(g=>({g,c:adventure.sim.center(g)})).find(({c})=>Math.hypot(c.x-x,c.y-y)<65);
 if(target&&target.g!==adventure.sim.activeGroup){adventure.clearInput();adventure.sim.selectGroup(target.g);return;}
 input.setMouse('melee',true);
});
el('game').addEventListener('pointermove',event=>{
 if(overlay==='editor'&&editor){
  const p=editorWorld(event);
  editor.hoverX=p.x;editor.hoverY=p.y;
  if(!editor.drag)return;
  const d=editor.drag;
  if(d.kind==='pan'){
   editor.cameraX=Math.max(0,editor.cameraX-(event.movementX||0));
   editor.cameraY=editor.cameraY+(event.movementY||0);
   return;
  }
  if(d.kind==='move'&&editor.sel){moveSel(editor.doc.layout,editor.sel,p.x-d.x,p.y-d.y);d.x=p.x;d.y=p.y;editor.dirty=true;editor.artTick++;return;}
  return;
 }
 const bounds=el('game').getBoundingClientRect();
 adventure.aimX=(event.clientX-bounds.left)/bounds.width*W+adventure.camera;
});
const releaseMouse=(event?:PointerEvent)=>{
 if(overlay==='editor'&&editor?.drag){
  const d=editor.drag;
  if(d.kind==='place'&&event){
   const p=editorWorld(event);
   const x=Math.min(d.x,p.x),y=Math.min(d.y,p.y),w=Math.abs(p.x-d.x),h=Math.abs(p.y-d.y);
   placeAt(editor,x,y,Math.max(16,w),Math.max(16,h));
   refreshEditorUi();
  }
  if(d.kind==='move'&&editor.sel){snapSel(editor.doc.layout,editor.sel,editor.snap);editor.artTick++;refreshEditorUi();}
  editor.drag=undefined;
 }
 input.setMouse('melee',false);input.setMouse('dodge',false);
};
el('game').addEventListener('pointerup',releaseMouse);
el('game').addEventListener('pointercancel',releaseMouse);
el('game').addEventListener('pointerleave',releaseMouse);
window.addEventListener('keydown',e=>{
 if(overlay==='editor'&&editor&&!(e.target instanceof HTMLElement&&e.target.closest('input,textarea,select'))){
  if(e.code==='Escape'){e.preventDefault();leaveEditor();return;}
  if(e.code==='Delete'||e.code==='Backspace'){e.preventDefault();deleteSel(editor);refreshEditorUi();return;}
  if(e.ctrlKey&&e.code==='KeyZ'){e.preventDefault();undo(editor);refreshEditorUi();return;}
  if(e.ctrlKey&&e.code==='KeyY'){e.preventDefault();redo(editor);refreshEditorUi();return;}
  if(e.ctrlKey&&e.code==='KeyS'){e.preventDefault();saveEditor();return;}
  if(e.ctrlKey&&e.code==='KeyD'&&editor.sel){e.preventDefault();return;}
  if(e.code==='KeyV'){setTool(editor,'select');refreshEditorUi();return;}
  if(e.code==='KeyH'){setTool(editor,'pan');refreshEditorUi();return;}
  if(e.code==='Space'){editor.tool='pan';return;}
  if(!e.ctrlKey&&!e.altKey&&/^Digit[1-6]$/.test(e.code)){
   const mode=EDITOR_MODES[Number(e.code.slice(5))-1];
   if(mode){setMode(editor,mode);refreshEditorUi();return;}
  }
 }
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
 const playing=adventure.started&&overlay==='none'&&!adventure.paused&&!adventure.dead&&!adventure.frozen();
 if(playing&&e.target instanceof HTMLElement&&e.target.closest('button')){
  e.preventDefault();
  e.target.blur();
 }
 if(e.code==='Backquote')adventure.debug=!adventure.debug;
 input.keyDown(e.code,e.repeat);
 if(e.target instanceof HTMLElement&&e.target.closest('input,textarea'))return;
 if(['Space','ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Tab'].includes(e.code))e.preventDefault();
});
window.addEventListener('keyup',e=>input.keyUp(e.code));
window.addEventListener('blur',()=>{input.clear();if(adventure.started&&!adventure.frozen()&&!adventure.dead)adventure.paused=true;});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){
  input.clear();
  if(adventure.started&&!adventure.frozen()&&!adventure.dead)adventure.paused=true;
  if(progress.soundOn)void bus.setEnabled(false);
 }else if(progress.soundOn)void bus.setEnabled(true);
});
input.onScheme=syncScheme;
renderKeyboardBar();
renderLevels();
renderSettings();
syncScheme();
bindTouch();
hydrateKitImages();
restoreDraft();

let lastHud=0;
const timings={physics:0,art:0,surface:0,upload:0};
function hud(time:number,fps:number){
 if(time-lastHud<80)return;lastHud=time;
 const a=adventure,c=a.sim.center(),region=a.level.region(c.x,c.y),honey=a.level.id==='honey',tide=a.level.id==='tide',entry=entryOf();
 if(a.foundSouvenirs.length){
  for(const id of a.foundSouvenirs)progress=grantSouvenir(id,progress);
  persist();
 }
 if(a.level.complete&&!progress.cleared.includes(a.level.id)){progress=markCleared(a.level.id,progress);persist();}
 el('body-picker').classList.toggle('hidden',a.sim.groups().length<2||!a.started);
 document.querySelectorAll<HTMLButtonElement>('[data-body]').forEach(button=>{const on=Number(button.dataset.body)===a.sim.activeGroup;button.classList.toggle('selected',on);button.setAttribute('aria-pressed',String(on));});
 shell.classList.toggle('playing',a.started);
 shell.classList.toggle('honey-theme',a.started&&honey);
 shell.classList.toggle('tide-theme',a.started&&tide);
 shell.classList.toggle('forest-play',a.started&&a.level.features.combat);
 el('location-name').textContent=region.name;el('location-en').textContent=region.sub;
 document.querySelector('.location-number')!.textContent=String(Math.max(1,a.level.area.findIndex(r=>r.name===region.name)+1)).padStart(2,'0');
 document.querySelector('.chapter')!.innerHTML=`${entry.chapter} <b>·</b> ${entry.name}`;
 el('hint').textContent=a.level.hint(c.x,a.sim.groups().length,c.y);
 el('dew-count').textContent=String(a.level.dew.filter(d=>d.got).length);
 el('dew-total').textContent=`/ ${a.level.dew.length}`;
 el('vitals').classList.toggle('hidden',!a.level.features.combat);
 el('hearts').textContent=a.level.features.combat?'♥'.repeat(a.hearts)+'♡'.repeat(Math.max(0,5-a.hearts)):'';
 el('ammo').textContent=a.level.features.combat?`弹 ${a.ammo}/10`:'';
 const bar=bossBar(a);
 el('boss-frame').classList.toggle('hidden',!a.started||!bar.visible);
 if(bar.visible){
  el('boss-name').textContent=bar.name;
  el('boss-fill').style.width=`${Math.max(0,Math.min(100,bar.maxHp?bar.hp/bar.maxHp*100:0))}%`;
  const other=bar.other;
  el('boss-name-b').classList.toggle('hidden',!other);
  el('boss-bar-b').classList.toggle('hidden',!other);
  if(other){
   el('boss-name-b').textContent=other.name;
   el('boss-fill-b').style.width=`${Math.max(0,Math.min(100,other.maxHp?other.hp/other.maxHp*100:0))}%`;
  }
 }
 const quests=a.level.features.quests?a.level.quests.map(q=>{
  const p=a.questProgress(q.id);
  return `${q.kind==='main'?'主线':'支线'} ${q.title} ${p.have}/${p.need}`;
 }).join(' · '):'';
 el('quest-line').textContent=quests;
 el('quest-line').classList.toggle('hidden',!quests);
 el('pack').classList.toggle('hidden',!a.pack.open);
 if(a.pack.open){
  const cells=Array.from({length:a.pack.size},(_,i)=>{
   const slot=a.pack.slots[i];
   if(!slot)return '<i></i>';
   const def=itemOf(slot.id);
   return `<i><b>${def?.icon??'·'}</b><small>${slot.count}</small><em>${def?.name??slot.id}</em></i>`;
  }).join('');
  el('pack').innerHTML=`<h3>背包</h3><div class="pack-grid">${cells}</div><p>纪念图鉴 ${progress.souvenirs.length}</p>`;
 }
 el('progress').style.width=tide
  ?`${Math.min(100,Math.max(0,(1290-c.y)/998)*100)}%`
  :`${Math.min(100,c.x/Math.max(200,a.level.width-180)*100)}%`;
 el('notice-list').innerHTML=a.notices.map(n=>`<i>${n.text}</i>`).join('');
 const map=el('minimap') as HTMLCanvasElement;
 map.classList.toggle('hidden',!a.started);
 if(a.started)drawMinimap(map,a);
 const won=a.frozen();
 const showModal=a.started&&overlay==='none'&&(a.paused||won||a.dead);
 el('modal').classList.toggle('hidden',!showModal);
 el('modal-pause').classList.toggle('hidden',won||a.dead);
 el('modal-win').classList.toggle('hidden',!won);
 el('modal-dead').classList.toggle('hidden',!a.dead);
 el('debug').classList.toggle('hidden',!a.debug);
 syncScheme();
 if(a.debug)el('debug').textContent=`PBF · ${a.sim.particles.length} particles · ${Math.round(fps)} FPS\nx ${c.x.toFixed(0)} / y ${c.y.toFixed(0)} · ${a.sim.groups().length} groups\n${input.scheme} · ${a.sim.climbing?'climbing':'free'}`;
 if(a.dead){
  el('modal-eyebrow').textContent='BODY SCATTERED';
  el('modal-title').textContent='身体散掉了';
  el('modal-copy').textContent='晨露、敌人、背包都回到出发时。再从露水草甸走一遍。';
 }
 if(won){
  const dew=a.level.dew.filter(d=>d.got).length,clock=`${Math.floor(a.elapsed/60)} 分 ${Math.floor(a.elapsed%60)} 秒`;
  const next=nextPlayable(a.level.id,progress);
  el('modal-eyebrow').textContent=entry.winEyebrow;
  el('modal-title').textContent=entry.winTitle;
  el('modal-copy').textContent=`你穿过了${entry.name}，带回 ${dew} / ${a.level.dew.length} 颗${entry.dewName}。用时 ${clock}。`;
  el('next-level').classList.toggle('hidden',!next||isCustomId(a.level.id));
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
  const c=this.texture.context;
  if(overlay==='editor'&&editor){
   const maxX=Math.max(0,editor.doc.layout.width-W);
   editor.cameraX=Math.max(0,Math.min(maxX,editor.cameraX+actions.move*16));
   editor.cameraY=Math.max(-editor.doc.layout.height+H,Math.min(360,editor.cameraY-actions.climb*16));
   const ch=editor.doc.source??(isOfficialId(editor.doc.id)?editor.doc.id:'forest');
   const size=`${ch}:${editor.doc.layout.width}x${editor.doc.layout.height}`;
   if(editorChapter!==ch||editorSize!==size||!editorPreview){
    editorChapter=ch;editorSize=size;editorArtTick=editor.artTick;
    if(ch==='wind'){editorPreview=new WindLevel(editor.doc.layout);windArt=new WindArt(editorPreview);}
    else if(ch==='mirror'){editorPreview=new MirrorLevel(editor.doc.layout);mirrorArt=new MirrorArt(editorPreview);}
    else if(ch==='tide'){editorPreview=new TideLevel(editor.doc.layout);gallery=new TideArt(editorPreview as TideLevel);}
    else if(ch==='honey'){editorPreview=new HoneyLevel(editor.doc.layout);hive=new HoneyArt(editorPreview as HoneyLevel);}
    else {editorPreview=new Level(editor.doc.layout);forest=new ForestArt(editorPreview);}
   }else if(editorArtTick!==editor.artTick){
    editorArtTick=editor.artTick;
    editorPreview.applyLayout(editor.doc.layout);
    if(ch==='wind')windArt?.syncLayout();
    else if(ch==='mirror')mirrorArt?.syncLayout();
    else if(ch==='honey')hive?.syncLayout();
    else if(ch!=='tide')forest.syncLayout();
   }
   this.layers.forEach(layer=>layer.setVisible(false));
   c.clearRect(0,0,W,H);
   if(ch==='wind'&&windArt){windArt.drawLayers(c,editor.cameraX,editor.cameraY);c.save();c.translate(0,editor.cameraY);windArt.drawDetails(c,editor.cameraX,time/1000,adventure.sim);c.restore();}
   else if(ch==='mirror'&&mirrorArt){mirrorArt.drawLayers(c,editor.cameraX,editor.cameraY);c.save();c.translate(0,editor.cameraY);mirrorArt.drawDetails(c,editor.cameraX,time/1000,adventure.sim);c.restore();}
   else if(ch==='tide'&&gallery){gallery.drawLayers(c,editor.cameraX,editor.cameraY);c.save();c.translate(0,editor.cameraY);gallery.drawDetails(c,editor.cameraX,time/1000,adventure.sim);c.restore();}
   else if(ch==='honey'&&hive){hive.drawLayers(c,editor.cameraX,editor.cameraY);c.save();c.translate(0,editor.cameraY);hive.drawDetails(c,editor.cameraX,time/1000,adventure.sim);c.restore();}
   else {forest.drawBackground(c,editor.cameraX,editor.cameraY,time/1000);c.save();c.translate(0,editor.cameraY);forest.drawDetails(c,editor.cameraX,time/1000,adventure.sim);c.restore();}
   const snap=editor.snap;
   const ghost=editor.kit?{kit:editor.kit,x:snap?Math.round(editor.hoverX/snap)*snap:editor.hoverX,y:snap?Math.round(editor.hoverY/snap)*snap:editor.hoverY}:undefined;
   drawGizmos(c,editor.doc.layout,editor.cameraX,editor.cameraY,editor.sel,editor.pickLock,ghost);
   syncEditorStatus();
   if(performance.now()-editorDraftAt>800)persistDraft();
   this.texture.refresh();
   return;
  }
  if(!adventure.started||overlay!=='none'||adventure.paused||adventure.frozen()||adventure.dead)handleMenu(actions);
  const t0=performance.now();adventure.tick(delta/1000,overlay==='none'?actions:emptyActions());const t1=performance.now();
  for(const cue of adventure.cues)bus.play(cue as 'slash');
  adventure.cues=[];
  if(progress.soundOn){
   const center=adventure.sim.center();
   const boss=adventure.actors.some(foe=>isBoss(foe.kind)&&(!foe.dead||foe.state==='dying')&&Math.abs(foe.x-center.x)<540);
   bus.setBgm(adventure.started?(boss?'boss':'explore'):'explore',!adventure.started);
  }
  const level=adventure.level;
  this.layers.forEach(layer=>layer.setVisible(!(level instanceof HoneyLevel)&&!(level instanceof TideLevel||level instanceof WindLevel||level instanceof MirrorLevel)&&adventure.started));
  const shx=(Math.random()-.5)*adventure.shake,shy=(Math.random()-.5)*adventure.shake;
  if(!(level instanceof HoneyLevel)&&!(level instanceof TideLevel||level instanceof WindLevel||level instanceof MirrorLevel)&&adventure.started){
   this.layers[1].x=-adventure.camera*.15+shx*.25;this.layers[1].y=adventure.cameraY*.12+shy*.25;
   this.layers[2].x=-adventure.camera*.38+shx*.5;this.layers[2].y=adventure.cameraY*.28+shy*.5;
   this.layers[3].x=-adventure.camera+shx;this.layers[3].y=adventure.cameraY+shy;
  }
  c.clearRect(0,0,W,H);
  if(!adventure.started){this.texture.refresh();hud(time,this.game.loop.actualFps);return;}
  if(level instanceof HoneyLevel){
   if(!hive||hive.level!==level)hive=new HoneyArt(level);
   hive.drawLayers(c,adventure.camera,adventure.cameraY);
   hive.drawAtmosphere(c,adventure.camera,adventure.cameraY,adventure.time);
   c.save();c.translate(0,adventure.cameraY);
   for(const pool of level.pools)drawHoney(c,pool,adventure.camera,adventure.time,false);
   hive.drawDetails(c,adventure.camera,adventure.time,adventure.sim);
   foes.draw(c,adventure.actors,adventure.camera,adventure.time,adventure.sim.center().x);
   const t2=performance.now();
   const films=new Map(adventure.sim.groups().map(g=>[g,level.film(g)]));
   const slash=adventure.combat.slashes[0];
   const lookX=Math.max(-2,Math.min(2,adventure.sim.center().vx*.012));
   drawSlime(c,adventure.sim,adventure.camera,adventure.time,adventure.debug,films,{
    hurt:adventure.invuln,
    attack:slash?{facing:slash.facing,t:slash.t,life:slash.life,step:slash.step}:undefined,
    face:adventure.mood.pose(lookX),
    bulk:adventure.swallowBulk(),
    swallow:adventure.swallow?{kind:adventure.swallow.prey.kind,t:adventure.swallow.t,phase:adventure.swallow.phase}:undefined,
    ghosts:adventure.ghosts,
   });
   drawCombat(c,adventure.combat,adventure.camera);
   const t3=performance.now();
   for(const pool of level.pools)drawHoney(c,pool,adventure.camera,adventure.time,true);
   c.restore();
   this.texture.refresh();hud(time,this.game.loop.actualFps);
   timings.physics=t1-t0;timings.art=t2-t1;timings.surface=t3-t2;timings.upload=performance.now()-t3;
   return;
  }
  if(level instanceof WindLevel){
   if(!windArt||windArt.level!==level)windArt=new WindArt(level);
   windArt.drawLayers(c,adventure.camera,adventure.cameraY,shx,shy);
   windArt.drawAtmosphere(c,adventure.camera,adventure.cameraY,adventure.time);
   c.save();c.translate(shx,adventure.cameraY+shy);
   drawWater(c,adventure.water,adventure.camera,adventure.time,false);
   for(const pulse of adventure.pulses)windArt.gust(pulse.x,pulse.y,pulse.facing,pulse.power);
   adventure.pulses=[];
   windArt.drawDetails(c,adventure.camera,adventure.time,adventure.sim);
   foes.draw(c,adventure.actors,adventure.camera,adventure.time,adventure.sim.center().x);
   const slash=adventure.combat.slashes[0];
   const lookX=Math.max(-2,Math.min(2,adventure.sim.center().vx*.012));
   drawSlime(c,adventure.sim,adventure.camera,adventure.time,adventure.debug,undefined,{
    hurt:adventure.invuln,
    attack:slash?{facing:slash.facing,t:slash.t,life:slash.life,step:slash.step}:undefined,
    face:adventure.mood.pose(lookX),
    bulk:adventure.swallowBulk(),
    swallow:adventure.swallow?{kind:adventure.swallow.prey.kind,t:adventure.swallow.t,phase:adventure.swallow.phase}:undefined,
    ghosts:adventure.ghosts,
   });
   drawCombat(c,adventure.combat,adventure.camera);
   drawWater(c,adventure.water,adventure.camera,adventure.time,true);
   c.restore();
   drawDebugOverlay(c,level,adventure.camera,adventure.cameraY,windArt.terrain);
   this.texture.refresh();hud(time,this.game.loop.actualFps);return;
  }
  if(level instanceof MirrorLevel){
   if(!mirrorArt||mirrorArt.level!==level)mirrorArt=new MirrorArt(level);
   mirrorArt.drawLayers(c,adventure.camera,adventure.cameraY,shx,shy);
   mirrorArt.drawAtmosphere(c,adventure.camera,adventure.cameraY,adventure.time);
   c.save();c.translate(shx,adventure.cameraY+shy);
   mirrorArt.drawPool(c,adventure.water,adventure.camera,adventure.time,false);
   for(const pulse of adventure.pulses)mirrorArt.gust(pulse.x,pulse.y,pulse.facing,pulse.power);
   adventure.pulses=[];
   mirrorArt.drawDetails(c,adventure.camera,adventure.time,adventure.sim);
   foes.draw(c,adventure.actors,adventure.camera,adventure.time,adventure.sim.center().x);
   const slash=adventure.combat.slashes[0];
   const lookX=Math.max(-2,Math.min(2,adventure.sim.center().vx*.012));
   drawSlime(c,adventure.sim,adventure.camera,adventure.time,adventure.debug,undefined,{
    hurt:adventure.invuln,
    attack:slash?{facing:slash.facing,t:slash.t,life:slash.life,step:slash.step}:undefined,
    face:adventure.mood.pose(lookX),
    bulk:adventure.swallowBulk(),
    swallow:adventure.swallow?{kind:adventure.swallow.prey.kind,t:adventure.swallow.t,phase:adventure.swallow.phase}:undefined,
    ghosts:adventure.ghosts,
   });
   drawCombat(c,adventure.combat,adventure.camera);
   mirrorArt.drawPool(c,adventure.water,adventure.camera,adventure.time,true);
   c.restore();
   drawDebugOverlay(c,level,adventure.camera,adventure.cameraY,mirrorArt.terrain);
   this.texture.refresh();hud(time,this.game.loop.actualFps);return;
  }
  if(level instanceof TideLevel){
   if(!gallery||gallery.level!==level)gallery=new TideArt(level);
   gallery.drawLayers(c,adventure.camera,adventure.cameraY,shx,shy);
   gallery.drawAtmosphere(c,adventure.camera,adventure.cameraY,adventure.time);
   c.save();c.translate(shx,adventure.cameraY+shy);
   gallery.drawFalls(c,adventure.camera,adventure.time);
   gallery.drawPools(c,adventure.camera,adventure.time,false);
   for(const pulse of adventure.pulses)gallery.gust(pulse.x,pulse.y,pulse.facing,pulse.power);
   adventure.pulses=[];
   gallery.drawDetails(c,adventure.camera,adventure.time,adventure.sim);
   foes.draw(c,adventure.actors,adventure.camera,adventure.time,adventure.sim.center().x);
   const t2=performance.now();
   const slash=adventure.combat.slashes[0];
   const lookX=Math.max(-2,Math.min(2,adventure.sim.center().vx*.012));
   drawSlime(c,adventure.sim,adventure.camera,adventure.time,adventure.debug,undefined,{
    hurt:adventure.invuln,
    attack:slash?{facing:slash.facing,t:slash.t,life:slash.life,step:slash.step}:undefined,
    face:adventure.mood.pose(lookX),
    bulk:adventure.swallowBulk(),
    swallow:adventure.swallow?{kind:adventure.swallow.prey.kind,t:adventure.swallow.t,phase:adventure.swallow.phase}:undefined,
    ghosts:adventure.ghosts,
   });
   drawCombat(c,adventure.combat,adventure.camera);
   const t3=performance.now();
   gallery.drawPools(c,adventure.camera,adventure.time,true);
   c.restore();
   gallery.drawNear(c,adventure.camera,adventure.cameraY);
   drawDebugOverlay(c,level,adventure.camera,adventure.cameraY,gallery.terrain);
   this.texture.refresh();hud(time,this.game.loop.actualFps);
   timings.physics=t1-t0;timings.art=t2-t1;timings.surface=t3-t2;timings.upload=performance.now()-t3;
   return;
  }
  if(forest.level!==level){
   forest=new ForestArt(level);
   this.textures.remove('forest-layer-3');
   this.textures.addCanvas('forest-layer-3',forest.terrain);
   this.layers[3].setTexture('forest-layer-3');
  }
  forest.drawAtmosphere(c,adventure.camera,adventure.cameraY,adventure.time);
  c.save();c.translate(shx,adventure.cameraY+shy);
  drawWater(c,adventure.water,adventure.camera,adventure.time,false);
  for(const pulse of adventure.pulses)forest.gust(pulse.x,pulse.y,pulse.facing,pulse.power);
  adventure.pulses=[];
  forest.drawDetails(c,adventure.camera,adventure.time,adventure.sim);
  foes.drawStakes(c,level.stakes,adventure.camera);
  foes.draw(c,adventure.actors,adventure.camera,adventure.time,adventure.sim.center().x);
  const t2=performance.now();
  const slash=adventure.combat.slashes[0];
  const lookX=Math.max(-2,Math.min(2,adventure.sim.center().vx*.012));
  drawSlime(c,adventure.sim,adventure.camera,adventure.time,adventure.debug,undefined,{
   hurt:adventure.invuln,
   attack:slash?{facing:slash.facing,t:slash.t,life:slash.life,step:slash.step}:undefined,
   face:adventure.mood.pose(lookX),
   bulk:adventure.swallowBulk(),
   swallow:adventure.swallow?{kind:adventure.swallow.prey.kind,t:adventure.swallow.t,phase:adventure.swallow.phase}:undefined,
   ghosts:adventure.ghosts,
  });
  drawCombat(c,adventure.combat,adventure.camera);
  const t3=performance.now();
  drawWater(c,adventure.water,adventure.camera,adventure.time,true);
  c.restore();
  drawDebugOverlay(c,level,adventure.camera,adventure.cameraY,forest.terrain);
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
function drawDebugOverlay(c:CanvasRenderingContext2D,level:Level,camera:number,cameraY:number,terrain?:HTMLCanvasElement){
 if(!adventure.debug)return;
 c.save();c.translate(-camera,cameraY);c.lineWidth=1.2;
 for(const s of level.solids){
  c.strokeStyle=s.kind==='boundary'?'#ffcc00cc':'#33ffeecc';
  c.strokeRect(s.x+.5,s.y+.5,s.w,s.h);
 }
 for(const w of [level.water,...level.waters]){
  if(w.w<4)continue;
  c.strokeStyle='#4aa8ffcc';c.strokeRect(w.x+.5,w.y+.5,w.w,w.h);
 }
 c.restore();
 if(!terrain?.width)return;
 const tw=220,th=Math.max(48,Math.round(tw*terrain.height/Math.max(1,terrain.width)));
 const ox=W-tw-10,oy=10;
 c.save();c.globalAlpha=.9;c.drawImage(terrain,ox,oy,tw,th);
 c.strokeStyle='#ffffffaa';c.lineWidth=1;c.strokeRect(ox,oy,tw,th);
 const sx=tw/terrain.width,sy=th/terrain.height;
 c.translate(ox,oy);
 for(const s of level.solids){
  if(s.kind==='boundary')continue;
  c.strokeStyle='#ff8844';c.lineWidth=1;
  c.strokeRect(s.x*sx,s.y*sy,s.w*sx,s.h*sy);
 }
 c.restore();
}
const phaser=new Phaser.Game({type:renderBackend(),parent:'game',width:W,height:H,backgroundColor:'#9db49a',scene:ForestScene,render:{antialias:true,roundPixels:false},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},audio:{noAudio:true},banner:false});
Object.defineProperty(window,'__slime',{value:()=>({started:adventure.started,paused:adventure.paused,complete:adventure.level.complete,linger:adventure.linger,name:adventure.name,id:adventure.level.id,scheme:input.scheme,overlay,camera:adventure.camera,cameraY:adventure.cameraY,activeGroup:adventure.sim.activeGroup,climbing:adventure.sim.climbing,splashCount:adventure.water.drops.length,center:adventure.sim.center(),groups:adventure.sim.groups().map(g=>({id:g,...adventure.sim.center(g)})),particles:adventure.sim.particles.map(p=>({x:p.x,y:p.y,group:p.group})),gateOpen:adventure.level.gateOpen,plates:adventure.level.plateActive,checkpoint:adventure.level.checkpoint,invuln:adventure.invuln,latchOn:adventure.level instanceof HoneyLevel?adventure.level.latchOn:false,wax:adventure.level instanceof HoneyLevel?adventure.level.wax.map(w=>({x:w.rect.x,solid:w.solid,load:w.load,missing:w.missing})):[] ,fps:phaser.loop.actualFps,timings:{...timings},flash:()=>{adventure.invuln=1}})});



