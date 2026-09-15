import {itemOf} from '../items/defs';
import type {EditorSession} from './session';
import {selRect} from './tools';

export function renderInspect(root:HTMLElement,session:EditorSession){
 const doc=session.doc,layout=doc.layout,sel=session.sel;
 const rect=sel?selRect(layout,sel):undefined;
 root.innerHTML=sel&&rect?`
  <h3>${sel.kind} #${sel.index}</h3>
  <label>x <input data-f="x" type="number" value="${Math.round(rect.x)}"/></label>
  <label>y <input data-f="y" type="number" value="${Math.round(rect.y)}"/></label>
  <label>w <input data-f="w" type="number" value="${Math.round(rect.w)}"/></label>
  <label>h <input data-f="h" type="number" value="${Math.round(rect.h)}"/></label>
  ${sel.kind==='dew'?`<label>主线 <input data-dew-role type="checkbox" ${layout.dew[sel.index]?.role!=='bonus'?'checked':''}/></label>`:''}
  ${sel.kind==='enemy'?`<label>巡逻 <input data-patrol type="number" value="${layout.enemies[sel.index]?.patrol??50}"/></label>`:''}
  ${sel.kind==='sign'?`<label>字 <input data-sign-text value="${layout.signs?.[sel.index]?.text??''}"/></label><label>箭头 <input data-sign-arrow value="${layout.signs?.[sel.index]?.arrow??'→'}"/></label>`:''}
  ${sel.kind==='hint'?`<label>提示 <input data-hint-text value="${layout.hints?.[sel.index]?.text??''}"/></label>`:''}
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
}
