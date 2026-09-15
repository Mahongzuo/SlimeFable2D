import {describe,expect,it} from 'vitest';
import {FOREST_LAYOUT} from '../src/content/chapter1/forest';
import {MIRROR_LAYOUT} from '../src/content/chapter5/mirror';
import {blankDoc,fromOfficial} from '../src/editor/defaults';
import {applyKit} from '../src/editor/tools';
import {importMap,listMaps,saveMap} from '../src/editor/store';
import {isCustomId,sanitizeDoc} from '../src/editor/schema';
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
});
