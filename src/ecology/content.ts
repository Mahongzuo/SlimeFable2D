import type {DewSpot, LevelLayout} from '../content/types';
import type {Rect} from '../physics';
import type {EcoEvent, EcoObject, EcologyLayout, FaunaSpot} from './types';

const interactionKinds={
 forest:['forest-dew-leaf','forest-bounce-mushroom','forest-hollow-fruit','forest-spore-flower','forest-root-door','forest-firefly-lantern'],
 honey:['honey-pollen','honey-nectar-flower','honey-drip-valve','honey-sealed-jar','honey-wax-see-saw','honey-lift'],
 tide:['tide-shell','tide-salt-cluster','tide-bubble-anemone','tide-float','tide-valve','tide-surf-leaf','tide-bottle','tide-hidden-cove'],
 wind:['wind-bell-live','wind-mill-live','wind-gust','wind-seed-flower','wind-dandelion','wind-kite-anchor','wind-tone-stone','wind-letter-desk'],
 mirror:['mirror-crystal-live','mirror-moon-lily','mirror-twin-lamp','mirror-memory-stone','mirror-star-flower','mirror-firefly','mirror-buoy','mirror-portal-live'],
} as const;

const faunaKinds={
 forest:['snail','moth','beetle'],honey:['bee','ant','moth'],tide:['hermit-crab','jellyfish','minnow','plankton'],wind:['bellbird','wind-butterfly','tumbleweed','lizard'],mirror:['mirrorfish','star-moth','moon-snail','echo-beast'],
} as const;

export const FLY_KINDS=new Set(['moth','butterfly','wind-butterfly','bee','jellyfish','bellbird','star-moth']);
export const SWIM_KINDS=new Set(['minnow','mirrorfish','plankton']);

const themeText:Record<string,{biomes:string[];events:string[];eventText:string[];challenge:string[]}>={
 forest:{biomes:['露水草甸','蘑菇台阶','根窟夜花'],events:['蜗牛搬家','借一点光'],eventText:['如何呢，又能怎？蜗牛找到新壳了','飞蛾追着灯笼，夜花醒过来'],challenge:['蘑菇三连跳']},
 honey:{biomes:['花粉坡','蜂巢流水线','蜜露暗廊'],events:['下班前最后一单','蚂蚁过河'],eventText:['今日任务：准时下班','跷板压下去，礼物就浮上来'],challenge:['三息碎桥']},
 tide:{biomes:['潮汐浅滩','会呼吸的潮池','瀑后石廊'],events:['寻找合适的壳','给珊瑚送点水','漂流瓶接力'],eventText:['寄居蟹换壳，藏龛露出来了','导流闸转动，珊瑚开花了','三段潮诗拼好了'],challenge:['泡泡上升线','穿瀑采晶']},
 wind:{biomes:['风铃草坡','浮岛风道','荒原信台'],events:['把铃声传过去','走失的风筝','修好一阵风'],eventText:['铃羽鸟听见了，种子荚打开','风筝锚点连成滑行线','风车把捷径吹出来'],challenge:['穿风环','限时送信']},
 mirror:{biomes:['月莲浅湾','星屑倒影','镜湖星门'],events:['让湖面开花','迟到半拍的朋友','给自己一个拥抱'],eventText:['镜晶照亮月莲，小路显形','影兽学会了你的节奏','爱你老己，星门醒来'],challenge:['倒影辨路','星门环线采集']},
};

const SOUVENIR:Record<string,{id:string;name:string}>={
 forest:{id:'mossheart',name:'苔心'},honey:{id:'honeydrop',name:'蜜心'},tide:{id:'tidepoem',name:'潮诗'},wind:{id:'windbell',name:'风铃信'},mirror:{id:'mirrorstar',name:'镜星'},
};

const FOLLOW:Record<string,string>={
 snail:'forest-hollow-fruit',moth:'forest-firefly-lantern',bee:'honey-lift',ant:'honey-sealed-jar',
 'hermit-crab':'tide-hidden-cove',minnow:'tide-valve',jellyfish:'tide-valve',bellbird:'wind-bell-live',
 'wind-butterfly':'wind-dandelion',mirrorfish:'mirror-moon-lily','star-moth':'mirror-twin-lamp','echo-beast':'mirror-twin-lamp',
};

export type PlaceOpts={waters?:Rect[];spawn?:{x:number;y:number};avoid?:{x:number;y:number}[];minGap?:number;lift?:number};

export function buried(solids:Rect[],x:number,y:number){
 return solids.some(o=>x>o.x+4&&x<o.x+o.w-4&&y>o.y+2&&y<o.y+o.h-2);
}

export function walkableSpots(solids:Rect[],opts:PlaceOpts={}):{x:number;y:number}[]{
 const lift=opts.lift??24,minGap=opts.minGap??120,waters=opts.waters??[],avoid=opts.avoid??[];
 const left=solids.reduce((m,o)=>o.kind==='boundary'&&o.x<80?Math.max(m,o.x+o.w+40):m,48);
 const raw:{x:number;y:number}[]=[];
 for(const s of solids){
  if(s.w<56)continue;
  if(s.h>220&&s.w<90)continue;
  if(s.kind==='boundary'||s.kind==='gate'||s.kind==='pool')continue;
  const step=Math.min(170,Math.max(90,s.w/Math.max(1,Math.floor(s.w/150))));
  for(let x=s.x+32;x<s.x+s.w-32;x+=step){
   const y=s.y-lift;
   if(x<left)continue;
   if(buried(solids,x,y))continue;
   if(waters.some(w=>x>w.x+12&&x<w.x+w.w-12&&y>w.y-16&&y<w.y+w.h))continue;
   if(opts.spawn&&Math.hypot(x-opts.spawn.x,y-opts.spawn.y)<200)continue;
   raw.push({x,y});
  }
 }
 raw.sort((a,b)=>a.x-b.x||a.y-b.y);
 const picked:{x:number;y:number}[]=[];
 for(const c of raw){
  if(avoid.some(a=>Math.hypot(c.x-a.x,c.y-a.y)<minGap))continue;
  if(picked.some(p=>Math.hypot(c.x-p.x,c.y-p.y)<minGap))continue;
  picked.push(c);
 }
 return picked;
}

function fallbackSpots(id:string,count:number):{x:number;y:number}[]{
 const ground=id==='tide'||id==='wind'||id==='mirror'?1180:560;
 return Array.from({length:count},(_,i)=>({x:280+i*160,y:ground-(i%3)*8}));
}

function takeSpots(id:string,solids:Rect[]|undefined,count:number,opts?:PlaceOpts){
 const found=solids?.length?walkableSpots(solids,{minGap:140,...opts}):[];
 if(found.length>=count)return found.slice(0,count);
 const extra=fallbackSpots(id,count).filter(s=>!solids?.length||!buried(solids,s.x,s.y));
 return [...found,...extra].slice(0,count);
}

function platformFor(kind:string,x:number,y:number):Rect|undefined{
 if(/gust|lift|float|lily|kite|cove|mill|buoy/.test(kind))return {x:x-48,y:y-8,w:96,h:16,kind:'branch',oneWay:true};
 return undefined;
}

function spotAt(spots:{x:number;y:number}[],index:number,fb:{x:number;y:number}){
 return spots[index]??spots[spots.length-1]??fb;
}

function obj(id:string,kind:string,at:{x:number;y:number},text:string,extra:Partial<EcoObject>={}):EcoObject{
 return {id,kind,x:at.x,y:at.y,text,platform:extra.platform??platformFor(kind,at.x,at.y),needs:extra.needs,target:extra.target};
}

function event(id:string,title:string,objects:string[],text:string,kind:EcoEvent['kind']='all'):EcoEvent{
 return {id,title,objects,kind,text};
}

function faunaOf(id:string,solids?:Rect[],waters?:Rect[]):FaunaSpot[]{
 const kinds=faunaKinds[id as keyof typeof faunaKinds]??faunaKinds.forest;
 const spots=takeSpots(id,solids,kinds.length,{minGap:260,lift:18,waters});
 return kinds.map((kind,index)=>{
  const at=spots[index]??{x:300+index*350,y:540};
  let x=at.x,y=at.y;
  if(FLY_KINDS.has(kind))y=at.y-(90+(index%3)*24);
  else if(SWIM_KINDS.has(kind)){
   const pool=waters?.find(w=>w.w>40)??waters?.[0];
   if(pool){x=pool.x+Math.min(pool.w-24,40+index*36);y=pool.y+16;}
  }
  return {id:`${id}-fauna-${kind}`,kind,x,y,span:FLY_KINDS.has(kind)?72:42,habitat:id,follow:FOLLOW[kind]};
 });
}

function chapterGraph(id:string,spots:{x:number;y:number}[]):{os:EcoObject[];events:EcoEvent[]}{
 const p=(i:number)=>spotAt(spots,i,{x:280+i*220,y:540});
 const theme=themeText[id]??themeText.forest;
 if(id==='forest'){
  const fruit=obj('forest-hollow-fruit','forest-hollow-fruit',p(0),'按 F 摇下空心果');
  const leaf=obj('forest-dew-leaf','forest-dew-leaf',p(1),'按 F 抖落露水叶');
  const lantern=obj('forest-firefly-lantern','forest-firefly-lantern',p(2),'按 F 点亮萤火灯笼');
  const flower=obj('forest-spore-flower','forest-spore-flower',p(3),'灯亮了再按 F，夜花才会醒',{needs:['forest-firefly-lantern']});
  return {os:[leaf,fruit,flower,lantern],events:[
   event('forest-eco-1',theme.events[0],[fruit.id],theme.eventText[0]),
   event('forest-eco-2',theme.events[1],[lantern.id,flower.id],theme.eventText[1],'ordered'),
  ]};
 }
 if(id==='honey'){
  const pollen=obj('honey-pollen','honey-pollen',p(0),'按 F 收一捧花粉');
  const nectar=obj('honey-nectar-flower','honey-nectar-flower',p(1),'按 F 把花粉送进花里',{needs:['honey-pollen']});
  const lift=obj('honey-lift','honey-lift',p(2),'花开了再按 F，升降台才会动',{needs:['honey-nectar-flower']});
  const valve=obj('honey-drip-valve','honey-drip-valve',p(3),'按 F 拧一下蜜滴阀');
  const saw=obj('honey-wax-see-saw','honey-wax-see-saw',p(4),'按 F 压下蜂蜡跷板');
  const jar=obj('honey-sealed-jar','honey-sealed-jar',p(5),'蚂蚁过河后，按 F 揭开蜡封',{needs:['honey-wax-see-saw']});
  return {os:[pollen,nectar,valve,jar,saw,lift],events:[
   event('honey-eco-1',theme.events[0],[pollen.id,nectar.id,lift.id],theme.eventText[0]),
   event('honey-eco-2',theme.events[1],[saw.id,jar.id],theme.eventText[1]),
  ]};
 }
 if(id==='tide'){
  const shell=obj('tide-shell','tide-shell',p(0),'按 F 拾起空贝壳');
  const cove=obj('tide-hidden-cove','tide-hidden-cove',p(1),'把壳交给寄居蟹，按 F 打开藏龛',{needs:['tide-shell']});
  const salt=obj('tide-salt-cluster','tide-salt-cluster',p(2),'按 F 碰一碰盐晶');
  const anemone=obj('tide-bubble-anemone','tide-bubble-anemone',p(3),'按 F 让海葵吐泡');
  const float=obj('tide-float','tide-float',p(4),'按 F 叫醒潮汐浮台');
  const valve=obj('tide-valve','tide-valve',p(5),'按 F 扳动导流闸');
  const leaf=obj('tide-surf-leaf','tide-surf-leaf',p(6),'按 F 踏上冲浪叶');
  const bottleA=obj('tide-bottle','tide-bottle',p(7),'按 F 截住第一只漂流瓶');
  const bottleB=obj('tide-bottle-b','tide-bottle',p(8),'先截住上面那只，再按 F 拼潮诗',{needs:['tide-bottle']});
  return {os:[shell,salt,anemone,float,valve,leaf,bottleA,cove,bottleB],events:[
   event('tide-eco-1',theme.events[0],[shell.id,cove.id],theme.eventText[0]),
   event('tide-eco-2',theme.events[1],[valve.id],theme.eventText[1]),
   event('tide-eco-3',theme.events[2],[bottleA.id,bottleB.id],theme.eventText[2],'ordered'),
  ]};
 }
 if(id==='wind'){
  const bellA=obj('wind-bell-a','wind-bell-live',p(0),'按 F 敲响第一只风铃');
  const bellB=obj('wind-bell-b','wind-bell-live',p(1),'顺着铃声，按 F 敲第二只');
  const bellC=obj('wind-bell-c','wind-bell-live',p(2),'按 F 敲响最后一只');
  const mill=obj('wind-mill-live','wind-mill-live',p(3),'按 F 把风车转到气流口');
  const gust=obj('wind-gust','wind-gust',p(4),'风车转起来再按 F，捷径才会吹开',{needs:['wind-mill-live']});
  const seed=obj('wind-seed-flower','wind-seed-flower',p(5),'按 F 给蓄风花一口气');
  const dandelion=obj('wind-dandelion','wind-dandelion',p(6),'按 F 松开蒲公英荚');
  const kiteA=obj('wind-kite-a','wind-kite-anchor',p(7),'按 F 解开风筝锚点');
  const kiteB=obj('wind-kite-b','wind-kite-anchor',p(8),'对岸锚点也按 F，滑行线才会连上',{needs:['wind-kite-a']});
  const tone=obj('wind-tone-stone','wind-tone-stone',p(9),'按 F 听一听鸣音石');
  const desk=obj('wind-letter-desk','wind-letter-desk',p(10),'按 F 把信放到送信台');
  return {os:[bellA,bellB,bellC,mill,gust,seed,dandelion,kiteA,kiteB,tone,desk],events:[
   event('wind-eco-1',theme.events[0],[bellA.id,bellB.id,bellC.id],theme.eventText[0],'ordered'),
   event('wind-eco-2',theme.events[1],[kiteA.id,kiteB.id],theme.eventText[1]),
   event('wind-eco-3',theme.events[2],[mill.id,gust.id],theme.eventText[2]),
  ]};
 }
 const crystal=obj('mirror-crystal-live','mirror-crystal-live',p(0),'按 F 转动镜晶');
 const lily=obj('mirror-moon-lily','mirror-moon-lily',p(1),'镜光照过来再按 F，月莲会浮成小路',{needs:['mirror-crystal-live']});
 const lampA=obj('mirror-lamp-a','mirror-twin-lamp',p(2),'分出一团，按 F 点亮这座灯');
 const lampB=obj('mirror-lamp-b','mirror-twin-lamp',p(3),'另一团身体按 F 点亮对岸灯');
 const memory=obj('mirror-memory-stone','mirror-memory-stone',p(4),'按 F 让记忆石看一看你');
 const star=obj('mirror-star-flower','mirror-star-flower',p(5),'按 F 叫醒星屑花');
 const firefly=obj('mirror-firefly','mirror-firefly',p(6),'按 F 提一盏萤灯');
 const buoy=obj('mirror-buoy','mirror-buoy',p(7),'按 F 拨正镜面浮标');
 const portal=obj('mirror-portal-live','mirror-portal-live',p(8),'两座灯都亮了再合并，按 F 唤醒星门',{needs:['mirror-lamp-a','mirror-lamp-b']});
 return {os:[crystal,lily,lampA,lampB,memory,star,firefly,buoy,portal],events:[
  event('mirror-eco-1',theme.events[0],[crystal.id,lily.id],theme.eventText[0]),
  event('mirror-eco-2',theme.events[1],[memory.id,star.id],theme.eventText[1]),
  event('mirror-eco-3',theme.events[2],[lampA.id,lampB.id],theme.eventText[2],'split-merge'),
 ]};
}

export function createEcology(id:string,solids?:Rect[],waters?:Rect[]):EcologyLayout{
 const count=id==='forest'||id==='honey'?8:14;
 const spots=takeSpots(id,solids,count,{minGap:220,waters});
 const {os,events}=chapterGraph(id,spots);
 const theme=themeText[id]??themeText.forest;
 const challengeCount=id==='forest'||id==='honey'?1:2;
 const challenges=Array.from({length:challengeCount},(_,index)=>{
  const a=os[Math.min(index,os.length-1)],b=os[Math.min(index+1,os.length-1)];
  return {id:`${id}-challenge-${index+1}`,title:theme.challenge[index]??`${id}技巧挑战 ${index+1}`,limit:18,points:[{x:a?.x??240,y:a?.y??500},{x:b?.x??360,y:b?.y??500}],text:'连续触发'};
 });
 const biomes=[0,1,2].map(index=>({id:`${id}-biome-${index+1}`,name:theme.biomes[index]??`${id}生态区 ${index+1}`,x:index*1000,y:0,w:1000,h:1800,color:['#83b86d','#67b9c7','#b29bdf'][index]}));
 return {interactables:os,fauna:faunaOf(id,solids,waters),events,challenges,biomes,contentVersion:'living-v1'};
}

export type EcologyCollectible={id:string;x:number;y:number;rarity:'common'|'rare'};
export function ecologyCollectibles(id:string,solids?:Rect[]):{dew:EcologyCollectible[];souvenirs:{id:string;x:number;y:number}[]} {
 const count=id==='forest'||id==='honey'?24:36;
 const spots=takeSpots(id,solids,count+4,{minGap:128});
 const dew=Array.from({length:count+3},(_,index)=>({id:`${id}-collect-${index+1}`,x:spots[index]?.x??(160+index*140),y:spots[index]?.y??540,rarity:(index>=count?'rare':'common') as 'common'|'rare'}));
 const souvenirAt=spots[count+3]??spots[spots.length-1]??{x:900,y:360};
 return {dew,souvenirs:[{id:SOUVENIR[id]?.id??`${id}-souvenir`,x:souvenirAt.x,y:souvenirAt.y}]};
}

export function withEcology(layout:LevelLayout,id:string):LevelLayout{
 const c=ecologyCollectibles(id,layout.base);
 const old=layout.dew;
 const dew:DewSpot[]=c.dew.map(item=>({id:item.id,x:item.x,y:item.y,got:false,role:'bonus',skin:id,rarity:item.rarity}));
 return {...layout,dew:[...old,...dew],ecology:createEcology(id,layout.base,[...(layout.waters??[]),layout.water]),contentVersion:'living-v1'};
}

export function fillCollectibles<T extends {dew:DewSpot[];souvenirs:{id:string;name:string;x:number;y:number;got:boolean}[];width:number;height:number;base?:Rect[];solids?:Rect[];waters?:Rect[];water?:Rect;checkpoint?:{x:number;y:number}}>(level:T,id:string):T{
 const target=id==='forest'||id==='honey'?27:39;
 const solids=level.solids?.length?level.solids:level.base??[];
 const waters=[...(level.waters??[]),...(level.water&&level.water.w>8?[level.water]:[])];
 const avoid=level.dew.map(d=>({x:d.x,y:d.y}));
 const spots=walkableSpots(solids,{waters,spawn:level.checkpoint,avoid,minGap:128});
 const needed=Math.max(0,target-level.dew.length);
 const high=[...spots].sort((a,b)=>a.y-b.y);
 const rareNeed=Math.min(3,needed);
 const rarePool=high.slice(0,rareNeed);
 const commonPool=spots.filter(s=>!rarePool.some(r=>r.x===s.x&&r.y===s.y));
 for(let i=0;i<needed;i++){
  const rare=i>=needed-rareNeed;
  const at=(rare?rarePool[i-(needed-rareNeed)]:commonPool[i])??spots[i]??{x:280+(level.dew.length+i)*140,y:(level.checkpoint?.y??540)-24};
  level.dew.push({id:`${id}-route-${level.dew.length+1}`,x:at.x,y:at.y,got:false,role:'bonus',skin:id,rarity:rare?'rare':'common'});
 }
 if(!level.souvenirs.length){
  const gift=SOUVENIR[id]??{id:`${id}-souvenir`,name:'纪念物'};
  const at=spots[needed]??spots[spots.length-1]??{x:level.checkpoint?.x??400,y:(level.checkpoint?.y??540)-20};
  level.souvenirs.push({id:gift.id,name:gift.name,x:at.x,y:at.y,got:false});
 }
 return level;
}
