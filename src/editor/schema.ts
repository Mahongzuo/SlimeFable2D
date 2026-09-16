import {CATALOG,FEATURES_FOREST,type LevelFeatures} from '../catalog';
import {cloneLayout,type LevelLayout} from '../content/types';
import {knownKit} from '../kit/register';

export const MAP_STORE_KEY='slime-fable-custom-maps';
export const OFFICIAL_STORE_KEY='slime-fable-official-overrides';
export const MAP_VERSION=1;

export type MapDoc={
 version:typeof MAP_VERSION;
 id:string;
 name:string;
 source?:string;
 updatedAt:number;
 features:LevelFeatures;
 layout:LevelLayout;
}

export function isCustomId(id:string){return id.startsWith('custom-');}
export function isOfficialId(id:string){return CATALOG.some(e=>e.id===id&&e.status==='ready');}

export function newCustomId(){return `custom-${Date.now().toString(36)}${Math.floor(Math.random()*36).toString(36)}`;}

export function cloneDoc(doc:MapDoc):MapDoc{
 return {...doc,features:{...doc.features},layout:cloneLayout(doc.layout)};
}

export function sanitizeDoc(raw:unknown):{doc?:MapDoc;dropped:string[]}{
 const dropped:string[]=[];
 if(!raw||typeof raw!=='object')return {dropped};
 const o=raw as Record<string,unknown>;
 if(o.version!==1||typeof o.id!=='string'||!isCustomId(o.id)||typeof o.name!=='string')return {dropped};
 const layout=o.layout as LevelLayout|undefined;
 if(!layout||typeof layout.width!=='number'||typeof layout.height!=='number'||!Array.isArray(layout.base))return {dropped};
 const features=(o.features&&typeof o.features==='object'?o.features:FEATURES_FOREST) as LevelFeatures;
 const dressing=(layout.dressing??[]).filter(item=>{
  if(knownKit(item.kit))return true;
  dropped.push(item.kit);
  return false;
 });
 const doc:MapDoc={
  version:1,
  id:o.id,
  name:o.name.slice(0,16)||'我的林间',
  source:typeof o.source==='string'?o.source:undefined,
  updatedAt:typeof o.updatedAt==='number'?o.updatedAt:Date.now(),
  features:{combat:!!features.combat,ammoRefill:!!features.ammoRefill,inventory:!!features.inventory,quests:!!features.quests},
  layout:cloneLayout({...layout,id:o.id,dressing}),
 };
 return {doc,dropped};
}

export function sanitizeOfficialDoc(raw:unknown):{doc?:MapDoc;dropped:string[]}{
 const dropped:string[]=[];
 if(!raw||typeof raw!=='object')return {dropped};
 const o=raw as Record<string,unknown>;
 if(o.version!==1||typeof o.id!=='string'||!isOfficialId(o.id)||typeof o.name!=='string')return {dropped};
 const layout=o.layout as LevelLayout|undefined;
 if(!layout||typeof layout.width!=='number'||typeof layout.height!=='number'||!Array.isArray(layout.base))return {dropped};
 const features=(o.features&&typeof o.features==='object'?o.features:FEATURES_FOREST) as LevelFeatures;
 const dressing=(layout.dressing??[]).filter(item=>{
  if(knownKit(item.kit))return true;
  dropped.push(item.kit);
  return false;
 });
 const doc:MapDoc={
  version:1,
  id:o.id,
  name:o.name.slice(0,16)||o.id,
  source:typeof o.source==='string'?o.source:o.id,
  updatedAt:typeof o.updatedAt==='number'?o.updatedAt:Date.now(),
  features:{combat:!!features.combat,ammoRefill:!!features.ammoRefill,inventory:!!features.inventory,quests:!!features.quests},
  layout:cloneLayout({...layout,id:o.id,dressing}),
 };
 return {doc,dropped};
}
