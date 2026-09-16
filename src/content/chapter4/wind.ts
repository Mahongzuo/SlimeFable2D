import type {LevelLayout} from '../types';

export const WIND_WIDTH=3300;
export const WIND_HEIGHT=2200;

/** 装饰细瀑：从神殿甲板西沿、东阶底下落到下一层，只入画，不挖水池。 */
export const WIND_FALLS:{x:number;y:number;w:number;h:number}[]=[
 {x:1060,y:292,w:36,h:468},
 {x:1900,y:832,w:28,h:348},
];

/** 东荒原补给池：判定、绘制、补弹回血共用。 */
export const WIND_POOL={x:1560,y:1692,w:160,h:40};

export const WIND_LAYOUT:LevelLayout={
 id:'wind',
 width:WIND_WIDTH,
 height:WIND_HEIGHT,
 fallY:2140,
 completeX:9000,
 water:WIND_POOL,
 waters:[WIND_POOL],
 plates:[{x:9000,y:0},{x:9010,y:0}],
 gate:{x:9000,y:0,w:1,h:1,kind:'gate'},
 checkpoint:{x:320,y:1640},
 exit:{x:1100,y:120,w:280,h:160},
 win:{kind:'zone',x:1100,y:120,w:280,h:160},
  base:[
  {x:120,y:1680,w:820,h:32,kind:'stone'},
  {x:180,y:1500,w:220,h:32,kind:'stone',oneWay:true},
  {x:200,y:1360,w:220,h:32,kind:'stone',oneWay:true},
  {x:80,y:1240,w:700,h:32,kind:'stone',oneWay:true},
  {x:940,y:1680,w:380,h:22,kind:'stone'},
  {x:1320,y:1680,w:240,h:32,kind:'stone'},
  {x:1560,y:1732,w:160,h:24,kind:'pool'},
  {x:1720,y:1680,w:480,h:32,kind:'stone'},
  {x:2200,y:1680,w:300,h:22,kind:'stone'},
  {x:2500,y:1680,w:700,h:32,kind:'stone'},
  {x:1280,y:1480,w:280,h:32,kind:'stone',oneWay:true},
  {x:1280,y:1320,w:280,h:32,kind:'stone',oneWay:true},
  {x:1280,y:1180,w:1180,h:32,kind:'stone',oneWay:true},
  {x:2460,y:1180,w:240,h:22,kind:'stone'},
  {x:2680,y:1100,w:420,h:32,kind:'stone',oneWay:true},
  {x:560,y:760,w:960,h:32,kind:'stone',oneWay:true},
  {x:680,y:1040,w:240,h:32,kind:'stone',oneWay:true},
  {x:720,y:880,w:240,h:32,kind:'stone',oneWay:true},
  {x:2100,y:980,w:320,h:32,kind:'stone',oneWay:true},
  {x:1880,y:800,w:320,h:32,kind:'stone',oneWay:true},
  {x:1660,y:620,w:320,h:32,kind:'stone',oneWay:true},
  {x:1480,y:440,w:320,h:32,kind:'stone',oneWay:true},
  {x:1080,y:260,w:560,h:32,kind:'stone',oneWay:true},
  {x:-30,y:-400,w:30,h:2800,kind:'boundary'},
  {x:WIND_WIDTH,y:-400,w:30,h:2800,kind:'boundary'},
 ],
 dew:[
  {x:520,y:1640,got:false,role:'main',skin:'wind'},
  {x:880,y:1640,got:false,role:'main',skin:'wind'},
  {x:280,y:1200,got:false,role:'main',skin:'wind'},
  {x:1500,y:1140,got:false,role:'main',skin:'wind'},
  {x:2300,y:1140,got:false,role:'main',skin:'wind'},
  {x:2900,y:1060,got:false,role:'main',skin:'wind'},
  {x:800,y:720,got:false,role:'main',skin:'wind'},
  {x:1400,y:220,got:false,role:'main',skin:'wind'},
 ],
 enemies:[
  {id:'escort-heath',kind:'escort',x:700,y:1680,patrol:80},
  {id:'herder-east',kind:'herder',x:2200,y:1680,patrol:90},
  {id:'grey-temple',kind:'grey',x:1360,y:260,patrol:70},
 ],
 souvenirs:[{id:'windbell',name:'风铃碎片',x:400,y:1200,got:false}],
 stakes:[],
 areas:[
  {at:0,name:'风铃神殿',sub:'BELL TEMPLE',y0:-200,y1:520},
  {at:0,name:'风之哨塔',sub:'WIND WATCH',y0:520,y1:1000},
  {at:0,name:'钟铃峡谷',sub:'BELL CANYON',y0:1000,y1:1480},
  {at:1100,name:'风车平原',sub:'MILL PLAIN',y0:1000,y1:1600},
  {at:0,name:'荒原起点',sub:'BELL HEATH',y0:1480,y1:2200},
  {at:1320,name:'东荒原',sub:'EAST HEATH',y0:1480,y1:2200},
 ],
 quests:[
  {id:'wind-main-seed',chapter:'wind',kind:'main',title:'收集风籽',steps:[{type:'dew',target:'main',count:8}]},
  {id:'wind-side-bell',chapter:'wind',kind:'side',title:'寻回风铃碎片',steps:[{type:'souvenir',target:'windbell',count:1}]},
 ],
 signs:[
  {x:400,y:1680,text:'荒原起点',arrow:'→'},
  {x:900,y:1680,text:'钟铃峡谷',arrow:'↑'},
  {x:1600,y:1680,text:'东荒原',arrow:'→'},
  {x:2780,y:1680,text:'回西侧上峡谷',arrow:'←'},
  {x:1200,y:260,text:'风铃神殿',arrow:'→'},
 ],
 hints:[
  {x0:0,x1:1320,y0:1480,y1:2200,text:'风铃会提示落点 · 沿西阶跳上钟铃峡谷'},
  {x0:1320,x1:3300,y0:1480,y1:2200,text:'东荒原补给池 · 木桥连东草甸，西回峡谷'},
  {x0:80,x1:800,y0:1100,y1:1480,text:'继续向上到哨塔，或跳回荒原走木桥'},
  {x0:1100,x1:3300,y0:1000,y1:1600,text:'风车平原可以歇脚 · 东侧台阶通向神殿'},
  {x0:500,x1:2200,y0:600,y1:1000,text:'哨塔能看见终点 · 沿东阶向上'},
  {x0:800,x1:2000,y0:0,y1:600,text:'走进神殿残拱，通关后还可继续逛'},
 ],
 checks:[
  {x:1600,y:1140,at:{x:1280,y:1100,w:1180,h:200}},
  {x:900,y:720,at:{x:560,y:700,w:960,h:200}},
  {x:1360,y:240,at:{x:1080,y:180,w:560,h:200}},
 ],
 dressing:[
  {id:'bell-a',kit:'wind-bell',x:260,y:1240,s:.85},
  {id:'bell-b',kit:'wind-bell',x:520,y:1240,s:.75},
  {id:'mill-a',kit:'wind-mill',x:1960,y:1180,s:1.15},
  {id:'mill-c',kit:'wind-mill',x:2920,y:1100,s:.95},
  {id:'lantern-a',kit:'wind-lantern',x:640,y:760,s:.85},
  {id:'lantern-b',kit:'wind-lantern',x:1180,y:760,s:.8},
  {id:'lantern-c',kit:'wind-lantern',x:1140,y:260,s:.85},
  {id:'lantern-d',kit:'wind-lantern',x:1480,y:260,s:.9},
  {id:'weed-a',kit:'wind-weed',x:360,y:1680,s:.7},
  {id:'weed-b',kit:'wind-weed',x:1980,y:1180,s:.65},
  {id:'weed-c',kit:'wind-weed',x:1100,y:760,s:.6},
 ],
};
