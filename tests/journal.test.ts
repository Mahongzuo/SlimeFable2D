import {describe,expect,it} from 'vitest';
import {RunSession} from '../src/run';
import {emptyJournal,encodeCloud,loadJournal,mergeCloud,mergeJournal,recordDiscovery,recordRun,recordSouvenir,saveJournal} from '../src/journal';

function memory(){
 const data=new Map<string,string>();
 return {data,getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);}};
}

function result(level:string,scoreTime:number,collectIds=['dew']){
 const run=new RunSession(level,{collect:Object.fromEntries(collectIds.map(id=>[id,1])),events:['event'],feats:{feat:1}},true);
 for(const id of collectIds)run.award('collect',id);
 run.award('event','event');
 run.award('feat','feat');
 run.advance(scoreTime,true);
 return run.finish();
}

describe('journal persistence',()=>{
 it('returns immutable updates and unions permanent discoveries',()=>{
  const base=emptyJournal();
  const discovered=recordDiscovery(base,'moss');
  const duplicate=recordDiscovery(discovered,'moss');
  const souvenir=recordSouvenir(discovered,'bell');
  expect(base.discovered).toEqual([]);
  expect(discovered.discovered).toEqual(['moss']);
  expect(duplicate).toBe(discovered);
  expect(souvenir.souvenirs).toEqual(['bell']);
 });

 it('records best score, then uses shorter effective time as the tie breaker',()=>{
  const slow=result('forest',20);
  const fast={...slow,runId:'fast',activeSeconds:10,effectiveSeconds:10,completedAt:slow.completedAt+1};
  const journal=recordRun(recordRun(emptyJournal(),slow),fast);
  expect(journal.best.forest.runId).toBe('fast');
  expect(journal.cleared).toEqual(['forest']);
  expect(journal.badges.forest).toEqual(['clear','collector','ecologist','challenger']);
 });

 it('merges permanent fields and best runs without mutating either input',()=>{
  const local={...recordRun(recordDiscovery(emptyJournal(),'local'),result('forest',30)),toyConsent:true};
  const remote=recordRun(recordSouvenir(recordDiscovery(emptyJournal(),'remote'),'shell'),result('forest',10));
  const merged=mergeJournal(local,remote);
  expect(merged.discovered).toEqual(['local','remote']);
  expect(merged.souvenirs).toEqual(['shell']);
  expect(merged.best.forest.effectiveSeconds).toBe(10);
  expect(merged.toyConsent).toBe(true);
  expect(local.discovered).toEqual(['local']);
 });

 it('loads old partial saves and migrates cleared/souvenirs from legacy progress',()=>{
  const store=memory();
  store.setItem('slime-fable-progress',JSON.stringify({cleared:['forest'],souvenirs:['mossheart']}));
  expect(loadJournal(store)).toMatchObject({cleared:['forest'],souvenirs:['mossheart'],discovered:[],toyConsent:false});
  store.setItem('slime-fable-journal',JSON.stringify({discovered:['dew'],toyConsent:true}));
  expect(loadJournal(store)).toMatchObject({discovered:['dew'],cleared:[],souvenirs:[],toyConsent:true});
 });

 it('saves a sanitized journal and tolerates broken storage',()=>{
  const store=memory();
  saveJournal({...emptyJournal(),discovered:['dew'],toyConsent:true},store);
  expect(loadJournal(store)).toMatchObject({discovered:['dew'],toyConsent:true});
  store.setItem('slime-fable-journal','{broken');
  expect(loadJournal(store)).toEqual(emptyJournal());
 });
});

describe('journal cloud codec',()=>{
 it('round trips hundreds of unicode discoveries within Toy limits without consent',()=>{
  let journal=emptyJournal();
  for(let i=0;i<300;i++)journal=recordDiscovery(journal,`发现-${i}`);
  journal={...recordRun(journal,result('forest',12,['露珠','苔藓'])),toyConsent:true};
  const cloud=encodeCloud(journal);
  expect(Object.keys(cloud).length).toBeLessThanOrEqual(128);
  for(const [key,value] of Object.entries(cloud)){
   expect(key.startsWith('__')).toBe(false);
   expect(new TextEncoder().encode(value).byteLength).toBeLessThanOrEqual(1024);
   expect(value).not.toContain('toyConsent');
  }
  const merged=mergeCloud(emptyJournal(),cloud);
  expect(merged.discovered).toHaveLength(300);
  expect(merged.best.forest.breakdown).toEqual(journal.best.forest.breakdown);
  expect(merged.best.forest.effectiveSeconds).toBe(12);
  expect(merged.best.forest.collectedIds).toEqual(['露珠','苔藓']);
  expect(merged.toyConsent).toBe(false);
 });

 it('ignores corrupt, oversized, reserved, and prototype-polluting cloud data',()=>{
  const values=Object.create(null) as Record<string,string>;
  values['journal-count']='2';
  values['journal-000']='not-json';
  values['journal-001']='x'.repeat(1025);
  values['__private']='anything';
  values['__proto__']='anything';
  const initial=recordDiscovery(emptyJournal(),'safe');
  expect(mergeCloud(initial,values)).toEqual(initial);
 });

 it('caps untrusted discovery counts while retaining normal libraries',()=>{
  const hostile={...emptyJournal(),discovered:Array.from({length:5000},(_,i)=>`id-${i}`)};
  const merged=mergeJournal(emptyJournal(),hostile);
  expect(merged.discovered.length).toBeLessThanOrEqual(1000);
 });
});
