import {isRunResult,type RunResult} from './run';

export type Journal={
 discovered:string[];
 souvenirs:string[];
 cleared:string[];
 badges:Record<string,string[]>;
 best:Record<string,RunResult>;
 toyConsent:boolean;
};

export type JournalStorage={getItem(key:string):string|null;setItem(key:string,value:string):void};

const JOURNAL_KEY='slime-fable-journal';
const LEGACY_KEY='slime-fable-progress';
const MAX_LOCAL_IDS=1000;
const MAX_CLOUD_IDS=400;
const MAX_LEVELS=32;
const encoder=new TextEncoder();

function validId(id:unknown):id is string{
 return typeof id==='string'&&id.length>0&&id.length<=128&&!/[\u0000-\u001f\u007f]/u.test(id)&&id!=='__proto__'&&id!=='prototype'&&id!=='constructor';
}

function cleanList(value:unknown,limit=MAX_LOCAL_IDS):string[]{
 if(!Array.isArray(value))return [];
 const result:string[]=[];
 const seen=new Set<string>();
 for(const id of value){
  if(validId(id)&&!seen.has(id)){seen.add(id);result.push(id);}
  if(result.length>=limit)break;
 }
 return result;
}

function union(left:string[],right:string[],limit=MAX_LOCAL_IDS){
 return cleanList([...left,...right],limit);
}

function cloneRun(run:RunResult):RunResult{
 return {
  ...run,
  collectedIds:[...run.collectedIds],eventIds:[...run.eventIds],featIds:[...run.featIds],
  badges:[...run.badges],breakdown:{...run.breakdown},
 };
}

function cleanRun(value:unknown,levelId?:string):RunResult|undefined{
 if(!isRunResult(value)||(levelId!==undefined&&value.levelId!==levelId))return undefined;
 return cloneRun(value);
}

function better(left:RunResult|undefined,right:RunResult|undefined){
 if(!left)return right;
 if(!right)return left;
 if(right.breakdown.total!==left.breakdown.total)return right.breakdown.total>left.breakdown.total?right:left;
 if(right.effectiveSeconds!==left.effectiveSeconds)return right.effectiveSeconds<left.effectiveSeconds?right:left;
 return left;
}

function cleanJournal(value:unknown):Journal{
 const raw=value&&typeof value==='object'?value as Partial<Journal>:{};
 const badges:Record<string,string[]>={};
 if(raw.badges&&typeof raw.badges==='object'){
  for(const [level,items] of Object.entries(raw.badges)){
   if(Object.keys(badges).length>=MAX_LEVELS)break;
   if(validId(level)){const list=cleanList(items,16);if(list.length)badges[level]=list;}
  }
 }
 const best:Record<string,RunResult>={};
 if(raw.best&&typeof raw.best==='object'){
  for(const [level,candidate] of Object.entries(raw.best)){
   if(Object.keys(best).length>=MAX_LEVELS)break;
   const run=validId(level)?cleanRun(candidate,level):undefined;
   if(run)best[level]=run;
  }
 }
 return {
  discovered:cleanList(raw.discovered),souvenirs:cleanList(raw.souvenirs),cleared:cleanList(raw.cleared),
  badges,best,toyConsent:raw.toyConsent===true,
 };
}

export function emptyJournal():Journal{
 return {discovered:[],souvenirs:[],cleared:[],badges:{},best:{},toyConsent:false};
}

export function loadJournal(storage?:JournalStorage):Journal{
 const box=storage??(typeof localStorage==='undefined'?undefined:localStorage);
 if(!box)return emptyJournal();
 try{
  const saved=box.getItem(JOURNAL_KEY);
  if(saved!==null)return cleanJournal(JSON.parse(saved));
  const legacy=box.getItem(LEGACY_KEY);
  if(legacy===null)return emptyJournal();
  const parsed=JSON.parse(legacy) as {cleared?:unknown;souvenirs?:unknown};
  return {...emptyJournal(),cleared:cleanList(parsed?.cleared),souvenirs:cleanList(parsed?.souvenirs)};
 }catch{return emptyJournal();}
}

export function saveJournal(journal:Journal,storage?:JournalStorage):void{
 const box=storage??(typeof localStorage==='undefined'?undefined:localStorage);
 if(!box)return;
 try{box.setItem(JOURNAL_KEY,JSON.stringify(cleanJournal(journal)));}catch{/* storage is best effort */}
}

export function recordDiscovery(journal:Journal,id:string):Journal{
 if(!validId(id)||journal.discovered.includes(id)||journal.discovered.length>=MAX_LOCAL_IDS)return journal;
 return {...journal,discovered:[...journal.discovered,id]};
}

export function recordSouvenir(journal:Journal,id:string):Journal{
 if(!validId(id)||journal.souvenirs.includes(id)||journal.souvenirs.length>=MAX_LOCAL_IDS)return journal;
 return {...journal,souvenirs:[...journal.souvenirs,id]};
}

export function recordRun(journal:Journal,result:RunResult):Journal{
 const run=cleanRun(result);
 if(!run)return journal;
 const current=cleanJournal(journal);
 const selected=better(current.best[run.levelId],run);
 const nextBadges=union(current.badges[run.levelId]??[],run.badges,16);
 return {
  ...current,
  cleared:union(current.cleared,[run.levelId]),
  badges:{...current.badges,[run.levelId]:nextBadges},
  best:{...current.best,[run.levelId]:cloneRun(selected!)},
 };
}

export function mergeJournal(local:Journal,remote:Journal):Journal{
 const a=cleanJournal(local);
 const b=cleanJournal(remote);
 const badges:Record<string,string[]>={};
 for(const level of union(Object.keys(a.badges),Object.keys(b.badges),MAX_LEVELS))badges[level]=union(a.badges[level]??[],b.badges[level]??[],16);
 const best:Record<string,RunResult>={};
 for(const level of union(Object.keys(a.best),Object.keys(b.best),MAX_LEVELS)){
  const run=better(a.best[level],b.best[level]);
  if(run)best[level]=cloneRun(run);
 }
 return {
  discovered:union(a.discovered,b.discovered),souvenirs:union(a.souvenirs,b.souvenirs),cleared:union(a.cleared,b.cleared),
  badges,best,toyConsent:a.toyConsent,
 };
}

type CompactRun={r:string;l:string;v:string;q:boolean;a:number;e:number;x:number;c:string[]|number;o:string[]|number;f:string[]|number;p:number[];g:string[];t:number};
type CloudPayload={v:1;d:string[];s:string[];c:string[];g:Record<string,string[]>;b:Record<string,CompactRun>};

function compactRun(run:RunResult,countsOnly:boolean):CompactRun{
 const b=run.breakdown;
 return {
  r:run.runId,l:run.levelId,v:run.contentVersion,q:run.eligible,a:run.activeSeconds,e:run.effectiveSeconds,x:run.resets,
  c:countsOnly?run.collectedIds.length:[...run.collectedIds],o:countsOnly?run.eventIds.length:[...run.eventIds],f:countsOnly?run.featIds.length:[...run.featIds],
  p:[b.collect,b.events,b.feats,b.clear,b.speed,b.total],g:[...run.badges],t:run.completedAt,
 };
}

function expandIds(value:string[]|number,prefix:string){
 if(Array.isArray(value))return value;
 if(!Number.isInteger(value)||value<0||value>512)return [];
 return Array.from({length:value},(_,index)=>`cloud-${prefix}-${index}`);
}

function expandRun(value:unknown):RunResult|undefined{
 if(!value||typeof value!=='object')return undefined;
 const c=value as Partial<CompactRun>;
 if(!Array.isArray(c.p)||c.p.length!==6)return undefined;
 return cleanRun({
  runId:c.r,levelId:c.l,contentVersion:c.v,eligible:c.q,activeSeconds:c.a,effectiveSeconds:c.e,resets:c.x,
  collectedIds:expandIds(c.c as string[]|number,'collect'),eventIds:expandIds(c.o as string[]|number,'event'),featIds:expandIds(c.f as string[]|number,'feat'),
  breakdown:{collect:c.p[0],events:c.p[1],feats:c.p[2],clear:c.p[3],speed:c.p[4],total:c.p[5]},badges:c.g,completedAt:c.t,
 });
}

function payloadFor(journal:Journal,countsOnly:boolean):CloudPayload{
 const clean=cleanJournal(journal);
 const best:Record<string,CompactRun>={};
 for(const [level,run] of Object.entries(clean.best))best[level]=compactRun(run,countsOnly);
 return {
  v:1,d:clean.discovered.slice(0,MAX_CLOUD_IDS),s:clean.souvenirs.slice(0,MAX_CLOUD_IDS),c:clean.cleared.slice(0,MAX_CLOUD_IDS),
  g:clean.badges,b:best,
 };
}

function splitUtf8(text:string,maxBytes:number):string[]{
 const chunks:string[]=[];
 let chunk='';
 let bytes=0;
 for(const point of text){
  const size=encoder.encode(point).byteLength;
  if(bytes+size>maxBytes&&chunk){chunks.push(chunk);chunk='';bytes=0;}
  chunk+=point;bytes+=size;
 }
 if(chunk)chunks.push(chunk);
 return chunks;
}

export function encodeCloud(journal:Journal):Record<string,string>{
 let json=JSON.stringify(payloadFor(journal,false));
 let chunks=splitUtf8(json,1000);
 if(chunks.length>127){json=JSON.stringify(payloadFor(journal,true));chunks=splitUtf8(json,1000);}
 if(chunks.length>127){
  const minimal=payloadFor(journal,true);
  minimal.d=minimal.d.slice(0,100);minimal.s=minimal.s.slice(0,100);minimal.c=minimal.c.slice(0,100);
  chunks=splitUtf8(JSON.stringify(minimal),1000).slice(0,127);
 }
 const values:Record<string,string>={'journal-count':String(chunks.length)};
 chunks.forEach((chunk,index)=>{values[`journal-${index.toString().padStart(3,'0')}`]=chunk;});
 return values;
}

export function mergeCloud(journal:Journal,values:Record<string,string>):Journal{
 try{
  if(!values||typeof values!=='object')return journal;
  const count=Object.prototype.hasOwnProperty.call(values,'journal-count')?values['journal-count']:undefined;
  if(typeof count!=='string'||encoder.encode(count).byteLength>1024||!/^[1-9]\d{0,2}$/.test(count))return journal;
  const total=Number(count);
  if(total>127)return journal;
  let json='';
  for(let i=0;i<total;i++){
   const key=`journal-${i.toString().padStart(3,'0')}`;
   if(key.startsWith('__')||!Object.prototype.hasOwnProperty.call(values,key))return journal;
   const chunk=values[key];
   if(typeof chunk!=='string'||encoder.encode(chunk).byteLength>1024)return journal;
   json+=chunk;
  }
  const raw=JSON.parse(json) as Partial<CloudPayload>;
  if(raw.v!==1)return journal;
  const best:Record<string,RunResult>={};
  if(raw.b&&typeof raw.b==='object')for(const [level,compact] of Object.entries(raw.b)){
   if(!validId(level)||Object.keys(best).length>=MAX_LEVELS)continue;
   const run=expandRun(compact);
   if(run&&run.levelId===level)best[level]=run;
  }
  const remote=cleanJournal({discovered:raw.d,souvenirs:raw.s,cleared:raw.c,badges:raw.g,best,toyConsent:false});
  return mergeJournal(journal,remote);
 }catch{return journal;}
}
