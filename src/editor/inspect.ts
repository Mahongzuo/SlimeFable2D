import {itemOf} from '../items/defs';
import {FOLDER_LABEL,listOutliner,OUTLINER_FOLDERS,rowLabel,sameSel} from './outliner';
import type {EditorSession} from './session';
import {selRect} from './tools';

export function renderInspect(root:HTMLElement,session:EditorSession){
 const doc=session.doc,layout=doc.layout,sel=session.sel;
 const rect=sel?selRect(layout,sel):undefined;
 const groups=listOutliner(layout);
 const q=session.query.trim();
 const shown=session.mode==='all'?OUTLINER_FOLDERS:OUTLINER_FOLDERS.filter(f=>f===session.mode);
 const total=shown.reduce((n,f)=>n+groups[f].length,0);
 const folds=shown.map(folder=>{
  const rows=groups[folder].filter(row=>!q||row.label.includes(q));
  const closed=session.mode==='all'&&session.foldClosed.includes(folder);
  const locked=session.pickLock.includes(folder);
  return `<section class="outliner-fold${closed?' closed':''}${locked?' locked':''}" data-folder="${folder}">
   <header>
    <button type="button" data-fold="${folder}"><i>${closed?'▸':'▾'}</i>${FOLDER_LABEL[folder]}<small>${rows.length}</small></button>
    ${session.mode==='all'?`<button type="button" class="outliner-lock${locked?' on':''}" data-lock="${folder}" title="${locked?'已锁定：视口点不到，点击解锁':'可选中：点击锁定'}">${locked?'🔒':'👁'}</button>`:''}
   </header>
   ${closed?'':`<div class="outliner-rows">${rows.length?rows.map(row=>`<button type="button" class="outliner-row${sameSel(sel,{kind:row.kind,index:row.index})?' on':''}" data-row="${row.kind}:${row.index}" data-label="${row.label}"><i class="dot k-${row.kind}"></i>${row.label}</button>`).join(''):'<p class="outliner-empty">空</p>'}</div>`}
  </section>`;
 }).join('');
 const details=sel&&rect?`
  <h3>${rowLabel(layout,sel)}</h3>
  <label>x <input data-f="x" type="number" value="${Math.round(rect.x)}"/></label>
  <label>y <input data-f="y" type="number" value="${Math.round(rect.y)}"/></label>
  <label>w <input data-f="w" type="number" value="${Math.round(rect.w)}"/></label>
  <label>h <input data-f="h" type="number" value="${Math.round(rect.h)}"/></label>
  ${sel.kind==='base'?`<label>种类 <input data-kind value="${layout.base[sel.index]?.kind??''}"/></label><label class="editor-check"><input data-oneway type="checkbox" ${layout.base[sel.index]?.oneWay?'checked':''}/> 单向台</label>`:''}
  ${sel.kind==='dress'?`<label>缩放 <input data-s type="number" step="0.05" value="${layout.dressing?.[sel.index]?.s??1}"/></label><label class="editor-check"><input data-flip type="checkbox" ${(layout.dressing?.[sel.index]?.flip??1)<0?'checked':''}/> 翻转</label>`:''}
  ${sel.kind==='dew'?`<label>主线 <input data-dew-role type="checkbox" ${layout.dew[sel.index]?.role!=='bonus'?'checked':''}/></label>`:''}
  ${sel.kind==='enemy'?`<label>巡逻 <input data-patrol type="number" value="${layout.enemies[sel.index]?.patrol??50}"/></label>`:''}
  ${sel.kind==='sign'?`<label>字 <input data-sign-text value="${layout.signs?.[sel.index]?.text??''}"/></label><label>箭头 <input data-sign-arrow value="${layout.signs?.[sel.index]?.arrow??'→'}"/></label>`:''}
  ${sel.kind==='hint'?`<label>提示 <input data-hint-text value="${layout.hints?.[sel.index]?.text??''}"/></label>`:''}
  ${sel.kind==='area'?`<label>名 <input data-area-name value="${layout.areas[sel.index]?.name??''}"/></label><label>英文 <input data-area-sub value="${layout.areas[sel.index]?.sub??''}"/></label>`:''}
  ${sel.kind==='portal'?`<label>配对 <input data-portal-pair value="${layout.portals?.[sel.index]?.pair??''}"/></label><p>同名星门互相传送</p>`:''}
  ${sel.kind==='souvenir'?`<p>${itemOf(layout.souvenirs[sel.index]?.id)?.name??layout.souvenirs[sel.index]?.name??''}</p>`:''}
 `:`
  <h3>${doc.name}</h3>
  <label>名称 <input data-name value="${doc.name}"/></label>
  <label>宽 <input data-world="width" type="number" value="${layout.width}"/></label>
  <label>高 <input data-world="height" type="number" value="${layout.height}"/></label>
  <label>坠落 <input data-world="fallY" type="number" value="${layout.fallY}"/></label>
  <label class="editor-check"><input data-feat="combat" type="checkbox" ${doc.features.combat?'checked':''}/> 战斗</label>
  <label class="editor-check"><input data-feat="quests" type="checkbox" ${doc.features.quests?'checked':''}/> 任务</label>
  <label class="editor-check"><input data-feat="ammoRefill" type="checkbox" ${doc.features.ammoRefill?'checked':''}/> 补弹</label>
 `;
 root.innerHTML=`
  <div class="panel-head">大纲<small>${total} 项${session.mode==='all'?'':` · ${FOLDER_LABEL[session.mode]}`}</small></div>
  <div class="editor-outliner">
   <input data-query type="search" placeholder="按名字搜索…" value="${session.query}" spellcheck="false"/>
   ${folds}
  </div>
  <div class="panel-head">${sel?'细节':'关卡'}<small>${sel?'Delete 删除 · 双击行对焦':'未选中任何对象'}</small></div>
  <div class="editor-details">${details}</div>
 `;
}
