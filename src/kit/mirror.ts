import type {KitEntry} from './defs';

const MIRROR_ECO:KitEntry[]=[
 {id:'mirror-crystal-live',chapter:'mirror',category:'interact',name:'旋转镜晶',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'镜'},
 {id:'mirror-moon-lily',chapter:'mirror',category:'interact',name:'月莲踏台',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'镜'},
 {id:'mirror-twin-lamp',chapter:'mirror',category:'interact',name:'双影灯',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'镜'},
 {id:'mirror-memory-stone',chapter:'mirror',category:'interact',name:'记忆石',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'镜'},
 {id:'mirror-star-flower',chapter:'mirror',category:'interact',name:'星屑花',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'镜'},
 {id:'mirror-firefly',chapter:'mirror',category:'interact',name:'萤灯',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'镜'},
 {id:'mirror-buoy',chapter:'mirror',category:'interact',name:'镜面浮标',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'镜'},
 {id:'mirror-portal-live',chapter:'mirror',category:'interact',name:'可激活星门',place:'point',play:'interact',interact:'press',defaults:{s:1},draw:'canvas',mark:'镜'},
];

export const MIRROR_KIT:KitEntry[]=[
 {id:'mirror-isle',chapter:'mirror',category:'terrain',name:'星辉石岛',place:'rect',play:'solid',defaults:{w:400,h:180},draw:'canvas',solidKind:'stone',mark:'镜'},
 {id:'mirror-crystal',chapter:'mirror',category:'prop',name:'星晶',place:'point',play:'dress',interact:'sway',defaults:{s:1},draw:'image',src:'assets/mirror/crystal.png',mark:'镜'},
 {id:'mirror-lantern',chapter:'mirror',category:'prop',name:'夜灯',place:'point',play:'dress',interact:'sway',defaults:{s:1},draw:'image',src:'assets/mirror/lantern.png',mark:'镜'},
 {id:'mirror-vine',chapter:'mirror',category:'flora',name:'星藤',place:'point',play:'dress',interact:'sway',defaults:{s:1},draw:'image',src:'assets/mirror/vine.png',mark:'镜'},
 {id:'mirror-portal',chapter:'mirror',category:'interact',name:'星门',place:'point',play:'interact',interactKind:'portal',defaults:{w:140,h:210,s:1},draw:'image',src:'assets/mirror/portal.png',mark:'镜'},
 {id:'dew-mirror',chapter:'mirror',category:'collect',name:'星屑',place:'point',play:'pickup',pickup:'dew',dewSkin:'mirror',defaults:{},draw:'canvas',mark:'镜'},
 {id:'souvenir-mirrorstar',chapter:'mirror',category:'collect',name:'镜湖星片',place:'point',play:'pickup',pickup:'souvenir',souvenirId:'mirrorstar',defaults:{},draw:'canvas',mark:'镜'},
 {id:'critter-mirrorfish',chapter:'mirror',category:'critter',name:'镜鱼',place:'point',play:'dress',defaults:{s:1},draw:'canvas',mark:'镜'},
 {id:'critter-star-moth',chapter:'mirror',category:'critter',name:'星蛾',place:'point',play:'dress',defaults:{s:1},draw:'canvas',mark:'镜'},
 {id:'critter-moon-snail',chapter:'mirror',category:'critter',name:'月蜗牛',place:'point',play:'dress',defaults:{s:1},draw:'canvas',mark:'镜'},
 {id:'critter-echo-beast',chapter:'mirror',category:'critter',name:'影兽',place:'point',play:'dress',defaults:{s:1},draw:'canvas',mark:'镜'},
 {id:'enemy-wk1',chapter:'mirror',category:'enemy',name:'狼王',place:'point',play:'actor',actorKind:'wk1',defaults:{},draw:'canvas',mark:'镜'},
 {id:'enemy-wk2',chapter:'mirror',category:'enemy',name:'棘脊狼王',place:'point',play:'actor',actorKind:'wk2',defaults:{},draw:'canvas',mark:'镜'},
 {id:'enemy-han',chapter:'mirror',category:'enemy',name:'韩小立',place:'point',play:'actor',actorKind:'han',defaults:{},draw:'canvas',mark:'镜'},
 {id:'enemy-horn',chapter:'mirror',category:'enemy',name:'白角镜使',place:'point',play:'actor',actorKind:'horn',defaults:{},draw:'canvas',mark:'镜'},
 ...MIRROR_ECO,
];
