import type {KitEntry} from './defs';

const TIDE_ECO:KitEntry[]=[
 {id:'tide-shell',chapter:'tide',category:'interact',name:'开合贝',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'潮'},
 {id:'tide-salt-cluster',chapter:'tide',category:'interact',name:'盐晶簇',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'潮'},
 {id:'tide-bubble-anemone',chapter:'tide',category:'interact',name:'泡泡海葵',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'潮'},
 {id:'tide-float',chapter:'tide',category:'interact',name:'潮汐浮台',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'潮'},
 {id:'tide-valve',chapter:'tide',category:'interact',name:'导流闸',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'潮'},
 {id:'tide-surf-leaf',chapter:'tide',category:'interact',name:'冲浪叶',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'潮'},
 {id:'tide-bottle',chapter:'tide',category:'interact',name:'漂流瓶',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'潮'},
 {id:'tide-hidden-cove',chapter:'tide',category:'interact',name:'瀑后藏龛',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'潮'},
];

export const TIDE_KIT:KitEntry[]=[
 {id:'tide-pool',chapter:'tide',category:'water',name:'潮池',place:'rect',play:'water',defaults:{w:200,h:66},draw:'canvas',mark:'潮'},
 {id:'tide-fall',chapter:'tide',category:'water',name:'瀑布帘',place:'rect',play:'dress',defaults:{w:80,h:340},draw:'canvas',mark:'潮'},
 {id:'tide-weed',chapter:'tide',category:'flora',name:'海草',place:'point',play:'dress',interact:'sway',defaults:{s:1},draw:'image',src:'assets/tide/weed.png',mark:'潮'},
 {id:'tide-coral',chapter:'tide',category:'flora',name:'珊瑚',place:'point',play:'dress',interact:'sway',defaults:{s:1},draw:'image',src:'assets/tide/coral.png',mark:'潮'},
 {id:'tide-fan',chapter:'tide',category:'flora',name:'扇珊瑚',place:'point',play:'dress',interact:'sway',defaults:{s:1},draw:'image',src:'assets/tide/fan.png',mark:'潮'},
 {id:'tide-anemone',chapter:'tide',category:'flora',name:'海葵',place:'point',play:'dress',interact:'sway',defaults:{s:1},draw:'image',src:'assets/tide/anemone.png',mark:'潮'},
 {id:'tide-bloom',chapter:'tide',category:'flora',name:'潮花',place:'point',play:'dress',interact:'sway',defaults:{s:1},draw:'image',src:'assets/tide/bloom.png',mark:'潮'},
 {id:'dew-tide',chapter:'tide',category:'collect',name:'盐晶',place:'point',play:'pickup',pickup:'dew',dewSkin:'tide',defaults:{},draw:'canvas',mark:'潮'},
 {id:'souvenir-tidepoem',chapter:'tide',category:'collect',name:'潮诗',place:'point',play:'pickup',pickup:'souvenir',souvenirId:'tidepoem',defaults:{},draw:'canvas',mark:'潮'},
 {id:'critter-jelly',chapter:'tide',category:'critter',name:'水母',place:'point',play:'dress',defaults:{s:1},draw:'canvas',mark:'潮'},
 {id:'critter-hermit-crab',chapter:'tide',category:'critter',name:'寄居蟹',place:'point',play:'dress',defaults:{s:1},draw:'canvas',mark:'潮'},
 {id:'critter-minnow',chapter:'tide',category:'critter',name:'小鱼',place:'point',play:'dress',defaults:{s:1},draw:'canvas',mark:'潮'},
 {id:'critter-plankton',chapter:'tide',category:'critter',name:'浮游',place:'point',play:'dress',defaults:{s:1},draw:'canvas',mark:'潮'},
 {id:'enemy-cent',chapter:'tide',category:'enemy',name:'金鳞蜈',place:'point',play:'actor',actorKind:'cent',defaults:{},draw:'canvas',mark:'潮'},
 {id:'enemy-wolfb',chapter:'tide',category:'enemy',name:'霜爪士',place:'point',play:'actor',actorKind:'wolfb',defaults:{},draw:'canvas',mark:'潮'},
 {id:'enemy-pale',chapter:'tide',category:'enemy',name:'苍白潮客',place:'point',play:'actor',actorKind:'pale',defaults:{},draw:'canvas',mark:'潮'},
 ...TIDE_ECO,
];
