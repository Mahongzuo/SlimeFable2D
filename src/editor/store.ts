import {sanitizeDoc,MAP_STORE_KEY,cloneDoc,type MapDoc} from './schema';

type Box={getItem(key:string):string|null;setItem(key:string,value:string):void};

function box(storage?:Box){return storage??(typeof localStorage==='undefined'?undefined:localStorage);}

function readAll(storage?:Box):MapDoc[]{
 const store=box(storage);if(!store)return [];
 try{
  const parsed=JSON.parse(store.getItem(MAP_STORE_KEY)||'[]');
  if(!Array.isArray(parsed))return [];
  return parsed.map(item=>sanitizeDoc(item).doc).filter((d):d is MapDoc=>!!d);
 }catch{return [];}
}

function writeAll(docs:MapDoc[],storage?:Box){
 const store=box(storage);if(!store)return;
 try{store.setItem(MAP_STORE_KEY,JSON.stringify(docs.map(cloneDoc)));}catch{/* ignore */}
}

export function listMaps(storage?:Box){return readAll(storage).sort((a,b)=>b.updatedAt-a.updatedAt);}

export function loadMap(id:string,storage?:Box){return readAll(storage).find(doc=>doc.id===id);}

export function saveMap(doc:MapDoc,storage?:Box){
 const next=cloneDoc({...doc,updatedAt:Date.now()});
 const docs=readAll(storage).filter(item=>item.id!==doc.id);
 docs.push(next);
 writeAll(docs,storage);
 return next;
}

export function removeMap(id:string,storage?:Box){
 writeAll(readAll(storage).filter(item=>item.id!==id),storage);
}

export function exportMap(doc:MapDoc){return JSON.stringify(cloneDoc(doc),null,2);}

export function importMap(text:string,storage?:Box){
 try{
  const {doc,dropped}=sanitizeDoc(JSON.parse(text));
  if(!doc)return {error:'不是有效的自定义关'};
  const saved=saveMap(doc,storage);
  return {doc:saved,dropped};
 }catch{return {error:'JSON 读不出来'};}
}
