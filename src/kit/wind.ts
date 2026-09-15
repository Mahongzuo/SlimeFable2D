import type {KitEntry} from './defs';

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
];
