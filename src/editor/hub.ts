import {CATALOG} from '../catalog';
import {blankDoc,fromOfficial,SIZE_PRESETS} from './defaults';
import {exportMap,importMap,listMaps,loadMap,removeMap,saveMap} from './store';
import type {MapDoc} from './schema';

export function renderHub(root:HTMLElement,onOpen:(doc:MapDoc)=>void,onPlay:(doc:MapDoc)=>void,onBack:()=>void){
 const maps=listMaps();
 const ready=CATALOG.filter(e=>e.status==='ready');
 const coming=CATALOG.filter(e=>e.status==='coming');
 root.innerHTML=`
  <div class="overlay-card editor-hub-card">
   <div class="eyebrow"><span></span> MAP STUDIO</div>
   <h2>地图编辑器</h2>
   <p>官方关只可复制。自己定尺寸，从素材库混搭草木、水池和纪念品。</p>
   <div class="editor-hub-cols">
    <section>
     <h3>官方模板</h3>
     ${ready.map(e=>`<button type="button" class="level-card" data-copy="${e.id}"><small>${String(e.index).padStart(2,'0')}</small><b>${e.name}</b><span>复制为自定义</span></button>`).join('')}
     <p class="settings-note">后六关官方制作中，可先新建并选用已有素材：${coming.map(e=>e.name).join('、')}</p>
    </section>
    <section>
     <h3>我的地图</h3>
     ${maps.length?maps.map(m=>`<div class="editor-map-row" data-id="${m.id}"><div><b>${m.name}</b><small>${m.layout.width}×${m.layout.height} · 露 ${m.layout.dew.length}</small></div><span><button type="button" data-open="${m.id}">打开</button><button type="button" data-play="${m.id}">试玩</button><button type="button" data-dup="${m.id}">复制</button><button type="button" data-dl="${m.id}">导出</button><button type="button" data-rm="${m.id}">删除</button></span></div>`).join(''):'<p class="settings-note">还没有自定义关。</p>'}
    </section>
   </div>
   <div class="editor-hub-actions">
    <button type="button" class="primary" id="editor-new">新建空白</button>
    <button type="button" class="ghost" id="editor-import">导入 JSON</button>
    <input id="editor-file" type="file" accept="application/json" hidden/>
    <button type="button" class="text-button" id="editor-back">返回</button>
   </div>
  </div>
  <div id="editor-new-card" class="overlay-card editor-new-card hidden">
   <h3>新建空白</h3>
   <label>名称 <input id="new-name" value="我的林间" maxlength="16"/></label>
   <div class="scheme-row" id="new-size">
    <button type="button" class="scheme-chip on" data-size="mid">中 5200×2200</button>
    <button type="button" class="scheme-chip" data-size="small">小 2560×1440</button>
    <button type="button" class="scheme-chip" data-size="large">大 7800×2200</button>
   </div>
   <label class="editor-check"><input id="new-grass" type="checkbox" checked/> 带一条交互草</label>
   <button type="button" class="primary" id="new-go">开始编辑</button>
   <button type="button" class="text-button" id="new-cancel">取消</button>
  </div>
 `;
 const newCard=()=>root.querySelector('#editor-new-card')!;
 root.querySelector('#editor-new')!.addEventListener('click',()=>newCard().classList.remove('hidden'));
 root.querySelector('#new-cancel')!.addEventListener('click',()=>newCard().classList.add('hidden'));
 root.querySelector('#new-size')!.querySelectorAll<HTMLButtonElement>('[data-size]').forEach(btn=>btn.onclick=()=>{
  root.querySelectorAll('#new-size .scheme-chip').forEach(n=>n.classList.toggle('on',n===btn));
 });
 root.querySelector('#new-go')!.addEventListener('click',()=>{
  const name=(root.querySelector('#new-name') as HTMLInputElement).value.trim()||'我的林间';
  const size=(root.querySelector('#new-size .on') as HTMLElement)?.dataset.size as keyof typeof SIZE_PRESETS||'mid';
  const dim=SIZE_PRESETS[size];
  const grass=(root.querySelector('#new-grass') as HTMLInputElement).checked;
  onOpen(blankDoc(name,dim.w,dim.h,grass));
 });
 root.querySelector('#editor-back')!.addEventListener('click',onBack);
 root.querySelector('#editor-import')!.addEventListener('click',()=>(root.querySelector('#editor-file') as HTMLInputElement).click());
 root.querySelector('#editor-file')!.addEventListener('change',ev=>{
  const file=(ev.target as HTMLInputElement).files?.[0];if(!file)return;
  void file.text().then(text=>{
   const res=importMap(text);
   if(res.doc)onOpen(res.doc);
   else alert(res.error);
  });
 });
 root.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach(btn=>btn.onclick=()=>{
  const doc=fromOfficial(btn.dataset.copy!);if(doc)onOpen(doc);
 });
 root.querySelectorAll<HTMLButtonElement>('[data-open]').forEach(btn=>btn.onclick=()=>{const doc=loadMap(btn.dataset.open!);if(doc)onOpen(doc);});
 root.querySelectorAll<HTMLButtonElement>('[data-play]').forEach(btn=>btn.onclick=()=>{const doc=loadMap(btn.dataset.play!);if(doc)onPlay(doc);});
 root.querySelectorAll<HTMLButtonElement>('[data-dup]').forEach(btn=>btn.onclick=()=>{
  const doc=loadMap(btn.dataset.dup!);if(!doc)return;
  onOpen(saveMap({...doc,id:`custom-${Date.now().toString(36)}`,name:`${doc.name}·抄`}));
 });
 root.querySelectorAll<HTMLButtonElement>('[data-rm]').forEach(btn=>btn.onclick=()=>{removeMap(btn.dataset.rm!);renderHub(root,onOpen,onPlay,onBack);});
 root.querySelectorAll<HTMLButtonElement>('[data-dl]').forEach(btn=>btn.onclick=()=>{
  const doc=loadMap(btn.dataset.dl!);if(!doc)return;
  const blob=new Blob([exportMap(doc)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${doc.name}.json`;a.click();
 });
}
