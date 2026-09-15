import {CATALOG} from '../catalog';
import {CATEGORY_LABEL,KIT_CATEGORIES} from '../kit/defs';
import {comingKitChapters,filterKit,kitById,kitChapters} from '../kit/register';
import {drawKitThumb} from '../kit/view';
import type {EditorSession} from './session';
import {STAMPS} from './tools';

const thumbs=new Map<string,string>();

function thumb(id:string){
 let url=thumbs.get(id);
 if(url)return url;
 const entry=kitById(id);if(!entry)return '';
 const cv=document.createElement('canvas');cv.width=56;cv.height=44;
 const c=cv.getContext('2d');if(!c)return '';
 drawKitThumb(c,entry);
 url=cv.toDataURL();thumbs.set(id,url);return url;
}

export function renderPalette(root:HTMLElement,session:EditorSession,onPick:(id:string)=>void){
 const chapters=kitChapters();
 const coming=comingKitChapters();
 const items=filterKit(session.category as never,session.chapter||undefined);
 root.innerHTML=`
  <div class="editor-cats">${KIT_CATEGORIES.map(cat=>`<button type="button" class="scheme-chip${session.category===cat?' on':''}" data-cat="${cat}">${CATEGORY_LABEL[cat]}</button>`).join('')}</div>
  <div class="editor-chaps">
   <button type="button" class="scheme-chip${session.chapter===''?' on':''}" data-chap="">全部</button>
   ${chapters.map(id=>{
    const name=CATALOG.find(e=>e.id===id)?.name??id;
    return `<button type="button" class="scheme-chip${session.chapter===id?' on':''}" data-chap="${id}">${name}</button>`;
   }).join('')}
  </div>
  ${coming.length?`<p class="settings-note">${coming.map(e=>e.name).join('、')} · 制作中</p>`:''}
  <div class="editor-kits">${items.map(k=>`<button type="button" class="editor-kit${session.tool===k.id?' on':''}" data-kit="${k.id}"><img alt="" src="${thumb(k.id)}"/><b>${k.name}</b><small>${k.mark}</small></button>`).join('')}</div>
  <div class="editor-stamps"><span>积木</span>${STAMPS.map(s=>`<button type="button" data-stamp="${s.id}">${s.name}</button>`).join('')}</div>
 `;
 root.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach(btn=>btn.onclick=()=>{session.category=btn.dataset.cat!;onPick(session.tool);});
 root.querySelectorAll<HTMLButtonElement>('[data-chap]').forEach(btn=>btn.onclick=()=>{session.chapter=btn.dataset.chap??'';onPick(session.tool);});
 root.querySelectorAll<HTMLButtonElement>('[data-kit]').forEach(btn=>btn.onclick=()=>onPick(btn.dataset.kit!));
}

export function bindStamps(root:HTMLElement,onStamp:(id:string)=>void){
 root.querySelectorAll<HTMLButtonElement>('[data-stamp]').forEach(btn=>btn.onclick=()=>onStamp(btn.dataset.stamp!));
}
