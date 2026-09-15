import {CATALOG} from '../catalog';
import type {KitCategory,KitEntry} from './defs';
import {FOREST_KIT} from './forest';
import {HONEY_KIT} from './honey';
import {TIDE_KIT} from './tide';
import {MIRROR_KIT} from './mirror';
import {WIND_KIT} from './wind';

export const KIT:KitEntry[]=[...FOREST_KIT,...HONEY_KIT,...TIDE_KIT,...WIND_KIT,...MIRROR_KIT];

export function register(entries:KitEntry[]){
 for(const entry of entries){
  if(KIT.some(k=>k.id===entry.id))continue;
  KIT.push(entry);
 }
}

export function kitById(id:string){return KIT.find(k=>k.id===id);}

export function kitChapters(){
 const seen=new Set<string>();
 const list:string[]=[];
 for(const entry of KIT){
  if(seen.has(entry.chapter))continue;
  seen.add(entry.chapter);
  list.push(entry.chapter);
 }
 return list;
}

export function comingKitChapters(){
 const have=new Set(kitChapters());
 return CATALOG.filter(entry=>!have.has(entry.id));
}

export function filterKit(category?:KitCategory,chapter?:string){
 return KIT.filter(entry=>(!category||entry.category===category)&&(!chapter||entry.chapter===chapter));
}

export function knownKit(id:string){return KIT.some(k=>k.id===id);}
