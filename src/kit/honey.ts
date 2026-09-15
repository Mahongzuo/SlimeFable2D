import type {KitEntry} from './defs';

export const HONEY_KIT:KitEntry[]=[
 {id:'honey-wax-rock',chapter:'honey',category:'terrain',name:'蜜蜡岩',place:'rect',play:'solid',defaults:{w:400,h:360},draw:'canvas',solidKind:'wax-rock',mark:'蜜'},
 {id:'honey-hex-pad',chapter:'honey',category:'terrain',name:'蜂巢台',place:'rect',play:'solid',interact:'oneWay',defaults:{w:86,h:20},draw:'canvas',solidKind:'hex-pad',oneWay:true,mark:'蜜'},
 {id:'honey-pool',chapter:'honey',category:'water',name:'蜜湖',place:'rect',play:'water',defaults:{w:480,h:120},draw:'canvas',mark:'蜜'},
 {id:'honey-lantern',chapter:'honey',category:'prop',name:'蜜灯',place:'point',play:'dress',interact:'sway',defaults:{s:.9},draw:'image',src:'assets/honey/lantern.png',mark:'蜜'},
 {id:'honey-comb',chapter:'honey',category:'prop',name:'巢脾',place:'point',play:'dress',defaults:{s:1},draw:'image',src:'assets/honey/hang-comb.png',mark:'蜜'},
 {id:'honey-drape',chapter:'honey',category:'prop',name:'蜜帘',place:'point',play:'dress',interact:'sway',defaults:{s:1},draw:'image',src:'assets/honey/drape.png',mark:'蜜'},
 {id:'honey-crystal',chapter:'honey',category:'prop',name:'蜜晶',place:'point',play:'dress',defaults:{s:.95},draw:'image',src:'assets/honey/crystal.png',mark:'蜜'},
 {id:'honey-mound',chapter:'honey',category:'prop',name:'蜡堆',place:'point',play:'dress',defaults:{s:1.1},draw:'canvas',mark:'蜜'},
 {id:'honey-puff',chapter:'honey',category:'prop',name:'花粉',place:'point',play:'dress',defaults:{s:1},draw:'canvas',mark:'蜜'},
 {id:'dew-honey',chapter:'honey',category:'collect',name:'蜜露',place:'point',play:'pickup',pickup:'dew',dewSkin:'honey',defaults:{},draw:'canvas',mark:'蜜'},
 {id:'critter-bee',chapter:'honey',category:'critter',name:'蜂',place:'point',play:'dress',defaults:{s:1},draw:'image',src:'assets/honey/bee.png',mark:'蜜'},
 {id:'critter-ant',chapter:'honey',category:'critter',name:'蚁',place:'point',play:'dress',defaults:{s:1},draw:'image',src:'assets/honey/ant.png',mark:'蜜'},
];
