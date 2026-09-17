import type {KitEntry} from './defs';

const WIND_ECO:KitEntry[]=[
 {id:'wind-bell-live',chapter:'wind',category:'interact',name:'活风铃',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'风'},
 {id:'wind-mill-live',chapter:'wind',category:'interact',name:'转向风车',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'风'},
 {id:'wind-gust',chapter:'wind',category:'interact',name:'上升气流口',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'风'},
 {id:'wind-seed-flower',chapter:'wind',category:'interact',name:'蓄风花',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'风'},
 {id:'wind-dandelion',chapter:'wind',category:'interact',name:'蒲公英荚',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'风'},
 {id:'wind-kite-anchor',chapter:'wind',category:'interact',name:'风筝锚点',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'风'},
 {id:'wind-tone-stone',chapter:'wind',category:'interact',name:'鸣音石',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'风'},
 {id:'wind-letter-desk',chapter:'wind',category:'interact',name:'送信台',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'风'},
];

export const WIND_KIT:KitEntry[]=[
 {id:'wind-isle',chapter:'wind',category:'terrain',name:'浮空石岛',place:'rect',play:'solid',defaults:{w:400,h:180},draw:'canvas',solidKind:'stone',mark:'风'},
 {id:'wind-pillar',chapter:'wind',category:'terrain',name:'攀爬石柱',place:'rect',play:'solid',interact:'climb',defaults:{w:40,h:400},draw:'image',src:'assets/wind/pillar.png',solidKind:'stone',mark:'风'},
 {id:'wind-bridge',chapter:'wind',category:'terrain',name:'风铃木桥',place:'rect',play:'solid',interact:'oneWay',defaults:{w:380,h:16},draw:'image',src:'assets/wind/bridge.png',solidKind:'branch',oneWay:true,mark:'风'},
 {id:'wind-bell',chapter:'wind',category:'prop',name:'风铃',place:'point',play:'dress',interact:'sway',defaults:{s:1},draw:'image',src:'assets/wind/bell.png',mark:'风'},
 {id:'wind-mill',chapter:'wind',category:'prop',name:'风车',place:'point',play:'dress',interact:'sway',defaults:{s:1.4},draw:'image',src:'assets/wind/mill.png',mark:'风'},
 {id:'wind-lantern',chapter:'wind',category:'prop',name:'风灯',place:'point',play:'dress',interact:'sway',defaults:{s:1},draw:'image',src:'assets/wind/lantern.png',mark:'风'},
 {id:'wind-weed',chapter:'wind',category:'flora',name:'荒原草',place:'point',play:'dress',interact:'sway',defaults:{s:1},draw:'image',src:'assets/wind/weed.png',mark:'风'},
 {id:'dew-wind',chapter:'wind',category:'collect',name:'风籽',place:'point',play:'pickup',pickup:'dew',dewSkin:'wind',defaults:{},draw:'canvas',mark:'风'},
 {id:'souvenir-windbell',chapter:'wind',category:'collect',name:'风铃碎片',place:'point',play:'pickup',pickup:'souvenir',souvenirId:'windbell',defaults:{},draw:'canvas',mark:'风'},
 {id:'critter-bellbird',chapter:'wind',category:'critter',name:'铃羽鸟',place:'point',play:'dress',defaults:{s:1},draw:'canvas',mark:'风'},
 {id:'critter-wind-butterfly',chapter:'wind',category:'critter',name:'风蝶',place:'point',play:'dress',defaults:{s:1},draw:'canvas',mark:'风'},
 {id:'critter-tumbleweed',chapter:'wind',category:'critter',name:'风滚草',place:'point',play:'dress',defaults:{s:1},draw:'canvas',mark:'风'},
 {id:'critter-lizard',chapter:'wind',category:'critter',name:'荒原蜥',place:'point',play:'dress',defaults:{s:1},draw:'canvas',mark:'风'},
 {id:'enemy-escort',chapter:'wind',category:'enemy',name:'斗笠镖师',place:'point',play:'actor',actorKind:'escort',defaults:{},draw:'canvas',mark:'风'},
 {id:'enemy-herder',chapter:'wind',category:'enemy',name:'牧鹰人',place:'point',play:'actor',actorKind:'herder',defaults:{},draw:'canvas',mark:'风'},
 {id:'enemy-grey',chapter:'wind',category:'enemy',name:'灰冠风修',place:'point',play:'actor',actorKind:'grey',defaults:{},draw:'canvas',mark:'风'},
 ...WIND_ECO,
];
