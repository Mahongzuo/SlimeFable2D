import {CATALOG} from '../catalog';
import {CATEGORY_LABEL,KIT_CATEGORIES} from '../kit/defs';
import {KIT,comingKitChapters,filterKit,kitById,kitChapters} from '../kit/register';
import {drawKitThumb,kitThumbReady} from '../kit/view';
import {folderOfKit,MODE_LABEL} from './outliner';
import type {EditorSession} from './session';
import {STAMPS} from './tools';

const thumbs=new Map<string,string>();

function thumb(id:string){
 let url=thumbs.get(id);
 if(url)return url;
 const entry=kitById(id);if(!entry)return '';
 const cv=document.createElement('canvas');cv.width=144;cv.height=104;
 const c=cv.getContext('2d');if(!c)return '';
 drawKitThumb(c,entry,cv.width,cv.height);
 url=cv.toDataURL();
 if(kitThumbReady(entry))thumbs.set(id,url);
 return url;
}

/** Categories that still have something to place under the current mode. */
export function paletteCategories(session:EditorSession){
 if(session.mode==='all')return KIT_CATEGORIES;
 const seen=new Set(KIT.filter(k=>folderOfKit(k)===session.mode).map(k=>k.category));
 return KIT_CATEGORIES.filter(cat=>seen.has(cat));
}

export function renderPalette(root:HTMLElement,session:EditorSession,onPick:(id:string)=>void){
 const chapters=kitChapters();
 const coming=comingKitChapters();
 const cats=paletteCategories(session);
 if(!cats.includes(session.category as never))session.category=cats[0]??'terrain';
 const items=filterKit(session.category as never,session.chapter||undefined).filter(k=>session.mode==='all'||folderOfKit(k)===session.mode);
 root.innerHTML=`
  <div class="palette-head">素材<small>${session.mode==='all'?'全部图层':`${MODE_LABEL[session.mode]}模式`}</small></div>
  <div class="editor-cats">${cats.map(cat=>`<button type="button" class="chip${session.category===cat?' on':''}" data-cat="${cat}">${CATEGORY_LABEL[cat]}</button>`).join('')}</div>
  <div class="editor-chaps">
   <button type="button" class="chip soft${session.chapter===''?' on':''}" data-chap="">全部章</button>
   ${chapters.map(id=>{
    const name=CATALOG.find(e=>e.id===id)?.name??id;
    return `<button type="button" class="chip soft${session.chapter===id?' on':''}" data-chap="${id}">${name}</button>`;
   }).join('')}
  </div>
  <div class="editor-kits">${items.length?items.map(k=>`<button type="button" class="editor-kit${session.tool===k.id?' on':''}" data-kit="${k.id}" title="${k.name}"><img alt="" src="${thumb(k.id)}"/><b>${k.name}</b><small>${k.mark}</small></button>`).join(''):'<p class="palette-empty">这个模式下这一类没有素材</p>'}</div>
  ${session.mode==='all'?`<div class="editor-stamps"><span>积木</span>${STAMPS.map(s=>`<button type="button" data-stamp="${s.id}">${s.name}</button>`).join('')}</div>`:''}
  ${coming.length?`<p class="palette-note">${coming.map(e=>e.name).join('、')} · 制作中</p>`:''}
 `;
 root.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach(btn=>btn.onclick=()=>{session.category=btn.dataset.cat!;onPick(session.tool);});
 root.querySelectorAll<HTMLButtonElement>('[data-chap]').forEach(btn=>btn.onclick=()=>{session.chapter=btn.dataset.chap??'';onPick(session.tool);});
 root.querySelectorAll<HTMLButtonElement>('[data-kit]').forEach(btn=>btn.onclick=()=>onPick(btn.dataset.kit!));
}

export function bindStamps(root:HTMLElement,onStamp:(id:string)=>void){
 root.querySelectorAll<HTMLButtonElement>('[data-stamp]').forEach(btn=>btn.onclick=()=>onStamp(btn.dataset.stamp!));
}
