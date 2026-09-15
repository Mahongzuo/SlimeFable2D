import type {KitEntry} from './defs';

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
];
