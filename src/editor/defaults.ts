import {FEATURES_FOREST} from '../catalog';
import {FOREST_LAYOUT} from '../content/chapter1/forest';
import {TIDE_LAYOUT} from '../content/chapter3/tide';
import {WIND_LAYOUT} from '../content/chapter4/wind';
import {MIRROR_LAYOUT} from '../content/chapter5/mirror';
import {cloneLayout,type HintBand,type LevelLayout,type SignSpot,type CheckTrigger} from '../content/types';
import {HoneyLevel} from '../honey-level';
import {cloneDoc,newCustomId,type MapDoc} from './schema';

export const FOREST_SIGNS:SignSpot[]=[
 {x:520,y:600,text:'苔光森林',arrow:'→'},
 {x:1570,y:600,text:'树根小径',arrow:'↓'},
 {x:2290,y:600,text:'镜水浅湾',arrow:'→'},
];

export const FOREST_HINTS:HintBand[]=[
 {x0:0,x1:9999,y0:800,y1:2400,text:'根窟 · 贴墙攀回林层，或向两侧找战斗房和纪念物'},
 {x0:0,x1:9999,y0:-200,y1:400,text:'林冠 · 二段跳加攀爬，高处也有晨露'},
 {x0:0,x1:750,text:'空格二段跳 · 走走停停，感受身体的果冻晃动'},
 {x0:750,x1:1500,text:'靠墙后按 W / ↑ 黏住攀爬 · 空格蹬墙跳'},
 {x0:1500,x1:2110,text:'S / ↓ 钻缝，出洞自动回弹 · 树根旁有一条向下的竖井'},
 {x0:2110,x1:2350,text:'树根的另一端，也有一片新天地 · 检查点已点亮'},
 {x0:2350,x1:2980,text:'入水会溅起水花 · S 下潜，空格跃出水面 · 清水可补炮弹'},
];

export const FOREST_CHECKS:CheckTrigger[]=[
 {x:2288,y:550,at:{x:2090,y:-200,w:4000,h:920}},
 {x:3040,y:550,at:{x:2980,y:-200,w:4000,h:920}},
 {x:1260,y:220,at:{x:1180,y:-200,w:420,h:480}},
 {x:1860,y:1530,at:{x:1700,y:1400,w:500,h:800}},
];

export const SIZE_PRESETS={
 small:{w:2560,h:1440},
 mid:{w:5200,h:2200},
 large:{w:7800,h:2200},
} as const;

function bounds(width:number,height:number){
 return [
  {x:-30,y:-400,w:30,h:height+800,kind:'boundary'},
  {x:width,y:-400,w:30,h:height+800,kind:'boundary'},
 ];
}

export function blankLayout(id:string,width=5200,height=2200,grass=true):LevelLayout{
 const groundW=Math.min(900,width-200);
 return {
  id,width,height,fallY:height-120,completeX:width-180,
  water:{x:-9999,y:9999,w:1,h:1},
  plates:[],
  gate:{x:width+80,y:0,w:1,h:1,kind:'gate'},
  checkpoint:{x:300,y:540},
  exit:{x:width-220,y:400,w:200,h:200},
  base:[
   {x:-80,y:600,w:groundW,h:350,kind:'earth'},
   {x:width-420,y:600,w:500,h:350,kind:'earth'},
   ...bounds(width,height),
  ],
  dew:[],enemies:[],souvenirs:[],stakes:[],
  areas:[{at:0,name:'我的林间',sub:'CUSTOM',y0:-200,y1:height}],
  quests:[],
  signs:[{x:360,y:600,text:'出发',arrow:'→'}],
  hints:[{x0:0,x1:900,text:'空格跳跃 · 自己铺一条路往东走'}],
  checks:[],
  win:{kind:'line',x:width-180},
  dressing:grass?[{id:'dress-0',kit:'forest-grass',x:120,y:600,w:220,h:16,s:1}]:[],
 };
}

export function blankDoc(name='我的林间',width=5200,height=2200,grass=true):MapDoc{
 const id=newCustomId();
 return {
  version:1,id,name,updatedAt:Date.now(),features:{...FEATURES_FOREST},
  layout:blankLayout(id,width,height,grass),
 };
}

function fromLayout(layout:LevelLayout,name:string,source:string):MapDoc{
 const id=newCustomId();
 const copy=cloneLayout(layout);
 copy.id=id;
 return {version:1,id,name:`${name}·抄`,source,updatedAt:Date.now(),features:{...FEATURES_FOREST},layout:copy};
}

export function fromOfficial(id:string):MapDoc|undefined{
 if(id==='forest'){
  const doc=fromLayout({...FOREST_LAYOUT,signs:FOREST_SIGNS,hints:FOREST_HINTS,checks:FOREST_CHECKS,win:{kind:'line',x:FOREST_LAYOUT.completeX}},'苔光森林','forest');
  return doc;
 }
 if(id==='wind')return fromLayout(cloneLayout(WIND_LAYOUT),'风铃荒原','wind');
 if(id==='mirror')return fromLayout(cloneLayout(MIRROR_LAYOUT),'镜湖夜航','mirror');
 if(id==='honey'){
  const hive=new HoneyLevel();
  return fromLayout({
   id:'honey',width:hive.width,height:1100,fallY:hive.fallY,completeX:4920,
   water:{...hive.water},plates:hive.plates.map(p=>({...p})),gate:{...hive.gate},base:hive.base.map(r=>({...r})),
   dew:hive.dew.map(d=>({...d,skin:'honey'})),enemies:[],souvenirs:[],stakes:[],
   checkpoint:{...hive.checkpoint},areas:[{at:0,name:'琥珀蜜穴',sub:'AMBER HIVE'}],quests:[],
   hints:[{x0:0,x1:900,text:'以森林画风打开 · 蜜蜡地形可继续摆官方素材'}],
  },'琥珀蜜穴','honey');
 }
 if(id==='tide'){
  return fromLayout({...cloneLayout(TIDE_LAYOUT),waters:[{x:450,y:1304,w:200,h:66},{x:1600,y:772,w:160,h:58}],hints:[{x0:0,x1:900,text:'以森林画风打开 · 潮汐素材可从左侧板选用'}]},'潮汐石廊','tide');
 }
}

export {cloneDoc};
