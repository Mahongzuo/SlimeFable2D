import type {Rect} from '../physics';
import type {EcologyLayout} from '../ecology/types';

export type DewSpot={id?:string;x:number;y:number;got:boolean;role?:'main'|'bonus';skin?:string;rarity?:'common'|'rare'}
export type EnemySpot={id:string;kind:string;x:number;y:number;patrol?:number}
export type SouvenirSpot={id:string;name:string;x:number;y:number;got:boolean}
export type StakeSpot={id:string;x:number;y:number;w:number;h:number;hp:number;maxHp:number}
export type AreaBand={at:number;name:string;sub:string;y0?:number;y1?:number}
export type QuestStep={type:'dew'|'defeat'|'souvenir';target:string;count:number}
export type QuestDef={id:string;chapter:string;kind:'main'|'side';title:string;steps:QuestStep[]}
export type SignSpot={x:number;y:number;text:string;arrow:string}
export type HintBand={x0:number;x1:number;y0?:number;y1?:number;text:string}
export type CheckTrigger={x:number;y:number;at:{x:number;y:number;w:number;h:number}}
export type WinCond={kind:'line';x:number}|{kind:'zone';x:number;y:number;w:number;h:number}
export type DressingSpot={id:string;kit:string;x:number;y:number;w?:number;h?:number;s?:number;flip?:number}
/** Two gates that share `pair` send the body both ways. */
export type PortalSpot={id:string;x:number;y:number;pair:string;s?:number}

export type LevelLayout={
 id:string;
 width:number;
 height:number;
 fallY:number;
 completeX:number;
 water:{x:number;y:number;w:number;h:number};
 waters?:Rect[];
 plates:{x:number;y:number}[];
 gate:Rect;
 base:Rect[];
 dew:DewSpot[];
 enemies:EnemySpot[];
 souvenirs:SouvenirSpot[];
 stakes:StakeSpot[];
 checkpoint:{x:number;y:number};
 exit?:{x:number;y:number;w:number;h:number};
 areas:AreaBand[];
 quests:QuestDef[];
 signs?:SignSpot[];
 hints?:HintBand[];
 checks?:CheckTrigger[];
 win?:WinCond;
 dressing?:DressingSpot[];
 portals?:PortalSpot[];
 contentVersion?:string;
 ecology?:EcologyLayout;
}

export function cloneLayout(layout:LevelLayout):LevelLayout{
 return {
  ...layout,
  water:{...layout.water},
  waters:layout.waters?.map(r=>({...r})),
  plates:layout.plates.map(p=>({...p})),
  gate:{...layout.gate},
  base:layout.base.map(r=>({...r})),
  dew:layout.dew.map(d=>({...d,got:false})),
  enemies:layout.enemies.map(e=>({...e})),
  souvenirs:layout.souvenirs.map(s=>({...s,got:false})),
  stakes:layout.stakes.map(s=>({...s,hp:s.maxHp})),
  checkpoint:{...layout.checkpoint},
  exit:layout.exit?{...layout.exit}:undefined,
  areas:layout.areas.map(a=>({...a})),
  quests:layout.quests.map(q=>({...q,steps:q.steps.map(s=>({...s}))})),
  signs:layout.signs?.map(s=>({...s})),
  hints:layout.hints?.map(h=>({...h})),
  checks:layout.checks?.map(ch=>({...ch,at:{...ch.at}})),
  win:layout.win?{...layout.win}:undefined,
  dressing:layout.dressing?.map(d=>({...d})),
  portals:layout.portals?.map(p=>({...p})),
  contentVersion:layout.contentVersion,
  ecology:layout.ecology?{
   ...layout.ecology,
   interactables:layout.ecology.interactables?.map(o=>({...o,needs:o.needs?[...o.needs]:undefined,target:o.target?{...o.target}:undefined,platform:o.platform?{...o.platform}:undefined})),
   fauna:layout.ecology.fauna?.map(f=>({...f})),events:layout.ecology.events?.map(e=>({...e,objects:[...e.objects]})),
   challenges:layout.ecology.challenges?.map(c=>({...c,points:c.points.map(p=>({...p}))})),biomes:layout.ecology.biomes?.map(b=>({...b})),
  }:undefined,
 };
}
