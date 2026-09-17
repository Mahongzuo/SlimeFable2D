import {describe,expect,it} from 'vitest';
import {cloneLayout} from '../src/content/types';
import {FOREST_LAYOUT} from '../src/content/chapter1/forest';
import {MIRROR_LAYOUT} from '../src/content/chapter5/mirror';
import {blankDoc,fromOfficial,officialDoc} from '../src/editor/defaults';
import {DEFAULT_PICK_LOCK,folderOfKit,listOutliner} from '../src/editor/outliner';
import {makeSession,sessionFromDraft,setMode,snapshotDraft} from '../src/editor/session';
import {applyKit,applySelNum,hitTest} from '../src/editor/tools';
import {clearOfficialOverride,importMap,listMaps,loadOfficialOverride,saveMap,saveOfficialOverride} from '../src/editor/store';
import {isCustomId,isOfficialId,sanitizeDoc,sanitizeOfficialDoc} from '../src/editor/schema';
import {FEATURES_HEATH} from '../src/catalog';
import {Adventure} from '../src/game';
import {WindLevel} from '../src/wind-level';
import {defaultProgress,loadProgress,saveProgress} from '../src/progress';
import {kitById} from '../src/kit/register';

function memory(){
 const data=new Map<string,string>();
 return {
  getItem:(key:string)=>data.get(key)??null,
  setItem:(key:string,value:string)=>{data.set(key,value);},
 };
}

describe('editor maps',()=>{
 it('builds a blank custom layout with spawn ground and grass',()=>{
  const doc=blankDoc('试作',2560,1440,true);
  expect(isCustomId(doc.id)).toBe(true);
  expect(doc.layout.width).toBe(2560);
  expect(doc.layout.base.some(r=>r.kind==='earth')).toBe(true);
  expect(doc.layout.base.filter(r=>r.kind==='boundary')).toHaveLength(2);
  expect(doc.layout.dressing?.some(d=>d.kit==='forest-grass')).toBe(true);
 });

 it('copies the mirror night layout from official',()=>{
  const doc=fromOfficial('mirror')!;
  expect(isCustomId(doc.id)).toBe(true);
  expect(doc.source).toBe('mirror');
  expect(doc.layout.width).toBe(MIRROR_LAYOUT.width);
  expect(doc.layout.win).toEqual(MIRROR_LAYOUT.win);
  expect(doc.layout.waters?.[0]).toEqual(MIRROR_LAYOUT.water);
 });

 it('copies forest without keeping the official id',()=>{
  const doc=fromOfficial('forest')!;
  expect(isCustomId(doc.id)).toBe(true);
  expect(doc.source).toBe('forest');
  expect(doc.layout.width).toBe(FOREST_LAYOUT.width);
  expect(doc.layout.dew.length).toBe(FOREST_LAYOUT.dew.length);
  expect(doc.layout.signs?.length).toBeGreaterThan(0);
 });

 it('round-trips through local storage',()=>{
  const store=memory();
  const doc=blankDoc('往返',2560,1440,false);
  saveMap(doc,store);
  expect(listMaps(store).map(m=>m.id)).toEqual([doc.id]);
  const again=listMaps(store)[0];
  expect(again.name).toBe('往返');
  expect(again.layout.checkpoint.x).toBe(doc.layout.checkpoint.x);
 });

 it('drops unknown kit ids on import',()=>{
  const store=memory();
  const doc=blankDoc('坏件',2560,1440,false);
  doc.layout.dressing=[{id:'d-1',kit:'not-a-kit',x:10,y:10}];
  const {dropped}=sanitizeDoc(doc);
  expect(dropped).toContain('not-a-kit');
  const text=JSON.stringify({...doc,layout:{...doc.layout,dressing:[{id:'d-1',kit:'not-a-kit',x:10,y:10}]}});
  const res=importMap(text,store);
  expect(res.doc?.layout.dressing??[]).toEqual([]);
 });

 it('rejects garbage json',()=>{
  expect(importMap('{oops',memory()).error).toBeTruthy();
  expect(sanitizeDoc({version:2}).doc).toBeUndefined();
 });

 it('persists a custom lastLevel',()=>{
  const store=memory();
  const progress={...defaultProgress(),lastLevel:'custom-abc1'};
  saveProgress(progress,store);
  expect(loadProgress(store).lastLevel).toBe('custom-abc1');
 });

 it('places official kit pieces onto a layout',()=>{
  const doc=blankDoc('摆件',2560,1440,false);
  applyKit(doc.layout,kitById('forest-mushroom')!,{x:400,y:600});
  applyKit(doc.layout,kitById('dew-tide')!,{x:500,y:560});
  expect(doc.layout.dressing?.some(d=>d.kit==='forest-mushroom')).toBe(true);
  expect(doc.layout.dew[0].skin).toBe('tide');
 });

 it('copies wind with heath features, not forest',()=>{
  const doc=fromOfficial('wind')!;
  expect(isCustomId(doc.id)).toBe(true);
  expect(doc.source).toBe('wind');
  expect(doc.features).toEqual(FEATURES_HEATH);
 });

 it('opens official wind for edit and stores an override',()=>{
  const store=memory();
  const doc=officialDoc('wind')!;
  expect(isOfficialId(doc.id)).toBe(true);
  expect(doc.id).toBe('wind');
  doc.layout.base[0].w=640;
  saveOfficialOverride(doc,store);
  expect(loadOfficialOverride('wind',store)?.layout.base[0].w).toBe(640);
  const a=new Adventure();
  const prev=globalThis.localStorage;
  const fake=store as unknown as Storage;
  Object.defineProperty(globalThis,'localStorage',{value:fake,configurable:true});
  a.selectLevel('wind');
  expect(a.level).toBeInstanceOf(WindLevel);
  expect(a.level.base[0].w).toBe(640);
  Object.defineProperty(globalThis,'localStorage',{value:prev,configurable:true});
  clearOfficialOverride('wind',store);
  expect(loadOfficialOverride('wind',store)).toBeUndefined();
 });

 it('writes inspect width and one-way onto a solid',()=>{
  const doc=fromOfficial('wind')!;
  const i=doc.layout.base.findIndex(r=>r.kind==='stone'&&!r.oneWay);
  expect(i).toBeGreaterThanOrEqual(0);
  applySelNum(doc.layout,{kind:'base',index:i},'w',222);
  doc.layout.base[i].oneWay=true;
  expect(doc.layout.base[i].w).toBe(222);
  expect(doc.layout.base[i].oneWay).toBe(true);
 });

 it('keeps official ids out of custom sanitizer',()=>{
  const doc=officialDoc('mirror')!;
  expect(sanitizeDoc(doc).doc).toBeUndefined();
  expect(sanitizeOfficialDoc(doc).doc?.id).toBe('mirror');
 });

 it('lists mirror actors in five outliner folders',()=>{
  const groups=listOutliner(MIRROR_LAYOUT);
  expect(Object.keys(groups)).toEqual(['collision','scenery','placed','enemy','zone']);
  expect(groups.collision.some(r=>r.kind==='base'&&r.label.startsWith('石台'))).toBe(true);
  expect(groups.collision.some(r=>r.kind==='base'&&r.label.startsWith('单向台'))).toBe(true);
  expect(groups.scenery.some(r=>r.label.includes('星晶'))).toBe(true);
  expect(groups.placed.some(r=>r.kind==='dew')).toBe(true);
  expect(groups.placed.some(r=>r.kind==='portal'&&r.label.includes('星门'))).toBe(true);
  expect(groups.zone.some(r=>r.kind==='hint')).toBe(true);
  expect(groups.zone.some(r=>r.label.includes('星空花园'))).toBe(true);
  expect(DEFAULT_PICK_LOCK).toEqual(['zone']);
 });

 it('picks the deck instead of the hint band when zone is locked',()=>{
  const at={x:500,y:1690};
  expect(hitTest(MIRROR_LAYOUT,at.x,at.y,['zone'])).toEqual({kind:'base',index:0});
  expect(hitTest(MIRROR_LAYOUT,at.x,at.y,[])).toEqual({kind:'hint',index:0});
 });
 it('a mode locks every other folder and drops a selection that no longer fits',()=>{
  const session=makeSession(officialDoc('mirror')!);
  session.sel={kind:'base',index:0};
  setMode(session,'zone');
  expect(session.pickLock.sort()).toEqual(['collision','enemy','placed','scenery']);
  expect(session.sel).toBeUndefined();
  expect(hitTest(session.doc.layout,500,1690,session.pickLock)).toEqual({kind:'hint',index:0});
  setMode(session,'all');
  expect(session.pickLock).toEqual(DEFAULT_PICK_LOCK);
 });
 it('palette entries land in the same folder the outliner files them under',()=>{
  expect(folderOfKit(kitById('forest-earth')!)).toBe('collision');
  expect(folderOfKit(kitById('sign-hint')!)).toBe('zone');
  expect(folderOfKit(kitById('sign-area')!)).toBe('zone');
  expect(folderOfKit(kitById('interact-stake')!)).toBe('placed');
  expect(folderOfKit(kitById('interact-checkpoint')!)).toBe('placed');
  expect(kitById('sign-post')&&folderOfKit(kitById('sign-post')!)).toBe('scenery');
  expect(folderOfKit(kitById('mirror-portal')!)).toBe('placed');
 });
 it('places ecology props and critters onto the official-style layout',()=>{
  const layout=cloneLayout(blankDoc('生态',2560,1440,false).layout);
  applyKit(layout,kitById('forest-dew-leaf')!,{x:420,y:560});
  applyKit(layout,kitById('critter-snail')!,{x:520,y:560});
  expect(layout.ecology?.interactables?.[0].kind).toBe('forest-dew-leaf');
  expect(layout.ecology?.fauna?.[0].kind).toBe('snail');
  expect(hitTest(layout,420,548,[])?.kind).toBe('eco');
  expect(hitTest(layout,520,548,[])?.kind).toBe('fauna');
  expect(listOutliner(layout).placed.some(r=>r.kind==='eco')).toBe(true);
  expect(folderOfKit(kitById('critter-snail')!)).toBe('placed');
 });
 it('pairs the second portal with the first and lists both in 摆放',()=>{
  const layout=cloneLayout(blankDoc('门',2560,1440,false).layout);
  const kit=kitById('mirror-portal')!;
  applyKit(layout,kit,{x:100,y:600});
  applyKit(layout,kit,{x:400,y:600});
  expect(layout.portals).toHaveLength(2);
  expect(layout.portals![0].pair).toBe(layout.portals![1].pair);
  applyKit(layout,kit,{x:700,y:600});
  expect(layout.portals![2].pair).not.toBe(layout.portals![0].pair);
  expect(listOutliner(layout).placed.filter(r=>r.kind==='portal')).toHaveLength(3);
  expect(hitTest(layout,100,560,[])).toEqual({kind:'portal',index:0});
 });
 it('round-trips an editor draft with camera, mode and dirty flag',()=>{
  const session=makeSession(officialDoc('wind')!);
  session.cameraX=1234;session.cameraY=-321;session.dirty=true;session.snap=8;
  setMode(session,'enemy');
  const back=sessionFromDraft(JSON.parse(JSON.stringify(snapshotDraft(session))));
  expect(back?.doc.id).toBe('wind');
  expect(back?.cameraX).toBe(1234);
  expect(back?.cameraY).toBe(-321);
  expect(back?.mode).toBe('enemy');
  expect(back?.dirty).toBe(true);
  expect(back?.snap).toBe(8);
  expect(sessionFromDraft({doc:{id:'nope'}})).toBeUndefined();
 });
});
