import type {KitEntry} from './defs';

export const MIRROR_KIT:KitEntry[]=[
 {id:'mirror-isle',chapter:'mirror',category:'terrain',name:'星辉石岛',place:'rect',play:'solid',defaults:{w:400,h:180},draw:'canvas',solidKind:'stone',mark:'镜'},
 {id:'mirror-crystal',chapter:'mirror',category:'prop',name:'星晶',place:'point',play:'dress',interact:'sway',defaults:{s:1},draw:'image',src:'assets/mirror/crystal.png',mark:'镜'},
 {id:'mirror-lantern',chapter:'mirror',category:'prop',name:'夜灯',place:'point',play:'dress',interact:'sway',defaults:{s:1},draw:'image',src:'assets/mirror/lantern.png',mark:'镜'},
 {id:'mirror-vine',chapter:'mirror',category:'flora',name:'星藤',place:'point',play:'dress',interact:'sway',defaults:{s:1},draw:'image',src:'assets/mirror/vine.png',mark:'镜'},
 {id:'mirror-portal',chapter:'mirror',category:'interact',name:'星门',place:'point',play:'interact',interactKind:'portal',defaults:{w:140,h:210,s:1},draw:'image',src:'assets/mirror/portal.png',mark:'镜'},
 {id:'dew-mirror',chapter:'mirror',category:'collect',name:'星屑',place:'point',play:'pickup',pickup:'dew',dewSkin:'mirror',defaults:{},draw:'canvas',mark:'镜'},
 {id:'souvenir-mirrorstar',chapter:'mirror',category:'collect',name:'镜湖星片',place:'point',play:'pickup',pickup:'souvenir',souvenirId:'mirrorstar',defaults:{},draw:'canvas',mark:'镜'},
 {id:'enemy-wk1',chapter:'mirror',category:'enemy',name:'狼王',place:'point',play:'actor',actorKind:'wk1',defaults:{},draw:'canvas',mark:'镜'},
 {id:'enemy-wk2',chapter:'mirror',category:'enemy',name:'棘脊狼王',place:'point',play:'actor',actorKind:'wk2',defaults:{},draw:'canvas',mark:'镜'},
 {id:'enemy-han',chapter:'mirror',category:'enemy',name:'韩小立',place:'point',play:'actor',actorKind:'han',defaults:{},draw:'canvas',mark:'镜'},
 {id:'enemy-horn',chapter:'mirror',category:'enemy',name:'白角镜使',place:'point',play:'actor',actorKind:'horn',defaults:{},draw:'canvas',mark:'镜'},
];
