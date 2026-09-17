import {CATALOG,levelById,previousLevel,type LevelEntry} from './catalog';
import {isCustomId} from './editor/schema';

export type SchemePref='auto'|'keyboard'|'gamepad'|'touch';
export type KeyAction='left'|'right'|'up'|'down'|'jump'|'squeeze'|'split'|'merge'|'switch'|'select1'|'select2'|'reset'|'pause'|'melee'|'ranged'|'inventory'|'dodge'|'interact';
export type KeyBindings=Record<KeyAction,string>;

export const DEFAULT_BINDINGS:KeyBindings={
 left:'KeyA',right:'KeyD',up:'KeyW',down:'KeyS',jump:'Space',squeeze:'KeyS',
 split:'KeyQ',merge:'KeyE',switch:'KeyC',select1:'Digit1',select2:'Digit2',reset:'KeyR',pause:'Escape',
 melee:'KeyJ',ranged:'KeyK',inventory:'KeyI',dodge:'ShiftLeft',interact:'KeyF',
};

export const BINDING_LABELS:Record<KeyAction,string>={
 left:'左移',right:'右移',up:'攀爬',down:'下滑',jump:'跳跃',squeeze:'挤压',
 split:'分裂',merge:'合并',switch:'切换',select1:'1 号',select2:'2 号',reset:'检查点',pause:'暂停',
 melee:'近战',ranged:'远程',inventory:'背包',dodge:'闪避',interact:'互动',
};

export type Progress={
 name:string;
 cleared:string[];
 lastLevel:string;
 bindings:KeyBindings;
 schemePref:SchemePref;
 souvenirs:string[];
 soundOn:boolean;
 sfxVol:number;
 musicVol:number;
};

export type StorageLike={getItem(key:string):string|null;setItem(key:string,value:string):void};

const KEY='slime-fable-progress';
// 测试阶段：已实现关卡全部开放；发布前改为 false。
export const TEST_ALL_LEVELS=true;
const NAME_KEY='slime-fable-name';

export function defaultProgress():Progress{
 return {name:'史莱姆',cleared:[],lastLevel:'forest',bindings:{...DEFAULT_BINDINGS},schemePref:'auto',souvenirs:[],soundOn:true,sfxVol:.85,musicVol:.7};
}

function cleanBindings(raw:unknown):KeyBindings{
 const next={...DEFAULT_BINDINGS};
 if(!raw||typeof raw!=='object')return next;
 for(const key of Object.keys(DEFAULT_BINDINGS) as KeyAction[]){
  const value=(raw as Record<string,unknown>)[key];
  if(typeof value==='string'&&value)next[key]=value;
 }
 return next;
}

function cleanScheme(raw:unknown):SchemePref{
 return raw==='keyboard'||raw==='gamepad'||raw==='touch'||raw==='auto'?raw:'auto';
}

function cleanVol(raw:unknown,fallback:number){
 return typeof raw==='number'&&Number.isFinite(raw)?Math.max(0,Math.min(1,raw)):fallback;
}

function cleanSouvenirs(raw:unknown):string[]{
 return Array.isArray(raw)?raw.filter((id):id is string=>typeof id==='string'&&!!id):[];
}

export function grantSouvenir(id:string,progress:Progress):Progress{
 if(!id||progress.souvenirs.includes(id))return progress;
 return {...progress,souvenirs:[...progress.souvenirs,id]};
}

export function revokeSouvenirs(ids:string[],progress:Progress):Progress{
 if(!ids.length)return progress;
 const drop=new Set(ids);
 return {...progress,souvenirs:progress.souvenirs.filter(id=>!drop.has(id))};
}

export function loadProgress(storage?:StorageLike):Progress{
 const box=storage??(typeof localStorage==='undefined'?undefined:localStorage);
 const fallback=defaultProgress();
 if(!box)return fallback;
 try{
  const parsed=JSON.parse(box.getItem(KEY)||'null') as Partial<Progress>|null;
  const legacy=box.getItem(NAME_KEY);
  const name=(parsed?.name||legacy||fallback.name).replace(/\s+/g,'').slice(0,6)||fallback.name;
  const cleared=Array.isArray(parsed?.cleared)?parsed.cleared.filter((id):id is string=>typeof id==='string'&&(!!levelById(id)||isCustomId(id))):[];
  const last=typeof parsed?.lastLevel==='string'&&(levelById(parsed.lastLevel)||isCustomId(parsed.lastLevel))?parsed.lastLevel:'forest';
  return {
   name,cleared,lastLevel:last,bindings:cleanBindings(parsed?.bindings),schemePref:cleanScheme(parsed?.schemePref),souvenirs:cleanSouvenirs(parsed?.souvenirs),
   soundOn:parsed?.soundOn!==false,
   sfxVol:cleanVol((parsed as {sfxVol?:unknown;masterVol?:unknown})?.sfxVol??(parsed as {masterVol?:unknown})?.masterVol,.85),
   musicVol:cleanVol(parsed?.musicVol,.7),
  };
 }catch{return fallback;}
}

export function saveProgress(progress:Progress,storage?:StorageLike){
 const box=storage??(typeof localStorage==='undefined'?undefined:localStorage);
 if(!box)return;
 try{
  box.setItem(KEY,JSON.stringify(progress));
  box.setItem(NAME_KEY,progress.name);
 }catch{/* ignore */}
}

export function isUnlocked(id:string,progress:Progress):boolean{
 const entry=levelById(id);
 if(!entry||entry.status!=='ready')return false;
 if(TEST_ALL_LEVELS)return true;
 if(entry.id==='forest'||entry.id==='honey')return true;
 const prev=previousLevel(entry.id);
 return !!prev&&progress.cleared.includes(prev.id);
}

export function isPlayable(entry:LevelEntry,progress:Progress){
 return entry.status==='ready'&&isUnlocked(entry.id,progress);
}

export function markCleared(id:string,progress:Progress):Progress{
 if((!levelById(id)&&!isCustomId(id))||progress.cleared.includes(id))return progress;
 return {...progress,cleared:[...progress.cleared,id]};
}

export function nextPlayable(id:string,progress:Progress){
 const start=CATALOG.findIndex(l=>l.id===id);
 for(let i=start+1;i<CATALOG.length;i++)if(isPlayable(CATALOG[i],progress))return CATALOG[i];
}

export function keyLabel(code:string){
 if(code==='Space')return 'Space';
 if(code==='Escape')return 'Esc';
 if(code==='Enter')return 'Enter';
 if(code==='Tab')return 'Tab';
 if(code.startsWith('Key'))return code.slice(3);
 if(code.startsWith('Digit'))return code.slice(5);
 if(code==='ShiftLeft'||code==='ShiftRight')return 'Shift';
 if(code.startsWith('Arrow')){
  const dir=code.slice(5);
  return dir==='Left'?'←':dir==='Right'?'→':dir==='Up'?'↑':dir==='Down'?'↓':code;
 }
 return code.replace(/^Numpad/,'Pad ');
}

