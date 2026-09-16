import type {LevelLayout} from '../types';

export const MIRROR_WIDTH=3600;
export const MIRROR_HEIGHT=2200;

/** 嵌在西岸–东岸之间的浅滩盆：判定、绘制、能沉共用这一份。 */
export const MIRROR_SHOAL={x:1040,y:1696,w:480,h:120};

export const MIRROR_LAYOUT:LevelLayout={
 id:'mirror',
 width:MIRROR_WIDTH,
 height:MIRROR_HEIGHT,
 fallY:2140,
 completeX:9000,
 water:MIRROR_SHOAL,
 waters:[MIRROR_SHOAL],
 plates:[{x:9000,y:0},{x:9010,y:0}],
 gate:{x:9000,y:0,w:1,h:1,kind:'gate'},
 checkpoint:{x:280,y:1640},
 exit:{x:2480,y:140,w:280,h:160},
 win:{kind:'zone',x:2480,y:140,w:280,h:160},
 base:[
  {x:80,y:1680,w:720,h:32,kind:'stone'},
  {x:800,y:1680,w:240,h:32,kind:'stone'},
  {x:1040,y:1816,w:480,h:36,kind:'stone'},
  {x:1520,y:1680,w:280,h:32,kind:'stone'},
  {x:1800,y:1680,w:600,h:32,kind:'stone'},
  {x:1700,y:1520,w:320,h:32,kind:'stone',oneWay:true},
  {x:1780,y:1360,w:320,h:32,kind:'stone',oneWay:true},
  {x:1680,y:1180,w:1100,h:32,kind:'stone',oneWay:true},
  {x:1360,y:1180,w:320,h:32,kind:'stone',oneWay:true},
  {x:1120,y:1000,w:320,h:32,kind:'stone',oneWay:true},
  {x:860,y:860,w:320,h:32,kind:'stone',oneWay:true},
  {x:420,y:720,w:860,h:32,kind:'stone',oneWay:true},
  {x:2600,y:1180,w:320,h:32,kind:'stone',oneWay:true},
  {x:2720,y:1000,w:320,h:32,kind:'stone',oneWay:true},
  {x:2580,y:840,w:320,h:32,kind:'stone',oneWay:true},
  {x:2460,y:660,w:340,h:32,kind:'stone',oneWay:true},
  {x:2360,y:480,w:340,h:32,kind:'stone',oneWay:true},
  {x:2280,y:280,w:780,h:32,kind:'stone',oneWay:true},
  {x:-30,y:-400,w:30,h:2800,kind:'boundary'},
  {x:MIRROR_WIDTH,y:-400,w:30,h:2800,kind:'boundary'},
 ],
 dew:[
  {x:400,y:1640,got:false,role:'main',skin:'mirror'},
  {x:920,y:1640,got:false,role:'main',skin:'mirror'},
  {x:1640,y:1640,got:false,role:'main',skin:'mirror'},
  {x:1860,y:1140,got:false,role:'main',skin:'mirror'},
  {x:2300,y:1140,got:false,role:'main',skin:'mirror'},
  {x:700,y:680,got:false,role:'main',skin:'mirror'},
  {x:1000,y:680,got:false,role:'main',skin:'mirror'},
  {x:2920,y:240,got:false,role:'main',skin:'mirror'},
 ],
 enemies:[
  {id:'wk1-altar',kind:'wk1',x:1860,y:1180,patrol:70},
  {id:'wk2-altar',kind:'wk2',x:2280,y:1180,patrol:80},
  {id:'han-gate',kind:'han',x:2500,y:280,patrol:60},
  {id:'horn-gate',kind:'horn',x:2780,y:280,patrol:60},
 ],
 souvenirs:[{id:'mirrorstar',name:'镜湖星片',x:720,y:680,got:false}],
 stakes:[],
 areas:[
  {at:0,name:'天穹之门',sub:'SKY GATE',y0:-200,y1:520},
  {at:0,name:'星空花园',sub:'STAR GARDEN',y0:520,y1:1000},
  {at:1600,name:'光影祭坛',sub:'LIGHT ALTAR',y0:1000,y1:1480},
  {at:0,name:'镜湖浅滩',sub:'MIRROR SHOAL',y0:1480,y1:2200},
  {at:0,name:'星辉起点',sub:'STAR HEARTH',y0:1480,y1:2200},
 ],
 quests:[
  {id:'mirror-main-dust',chapter:'mirror',kind:'main',title:'收集星屑',steps:[{type:'dew',target:'main',count:8}]},
  {id:'mirror-side-star',chapter:'mirror',kind:'side',title:'寻回镜湖星片',steps:[{type:'souvenir',target:'mirrorstar',count:1}]},
 ],
 signs:[
  {x:360,y:1680,text:'星辉起点',arrow:'→'},
  {x:1900,y:1180,text:'岔路',arrow:'↑'},
  {x:2100,y:1680,text:'东岸无路 · 回祭坛',arrow:'←'},
  {x:2400,y:280,text:'天穹之门',arrow:'→'},
 ],
 hints:[
  {x0:0,x1:1800,y0:1480,y1:2200,text:'浅滩嵌在两岸之间 · 走进会沉，空格跃出后走东阶'},
  {x0:1680,x1:3100,y0:1000,y1:1480,text:'西去花园，东侧宽阶通向神门'},
  {x0:400,x1:1700,y0:600,y1:1000,text:'星空花园 · 走进星门可去天穹之门，再走一次会回来'},
  {x0:2200,x1:3600,y0:0,y1:520,text:'韩小立与白角镜使 · 分身拆火力，两人都倒下后才能离开'},
 ],
 checks:[
  {x:1640,y:1640,at:{x:1520,y:1600,w:280,h:200}},
  {x:2000,y:1140,at:{x:1680,y:1100,w:1100,h:200}},
  {x:2360,y:240,at:{x:2280,y:200,w:400,h:200}},
 ],
 dressing:[
  {id:'cry-a',kit:'mirror-crystal',x:200,y:1680,s:.8},
  {id:'cry-b',kit:'mirror-crystal',x:560,y:720,s:.9},
  {id:'cry-c',kit:'mirror-crystal',x:2100,y:1180,s:.7},
  {id:'lan-a',kit:'mirror-lantern',x:1860,y:1180,s:.85},
  {id:'lan-b',kit:'mirror-lantern',x:3000,y:280,s:.8},
  {id:'vine-a',kit:'mirror-vine',x:500,y:720,s:.7},
  {id:'vine-b',kit:'mirror-vine',x:1100,y:720,s:.65},
 ],
 portals:[
  {id:'gate-west',x:880,y:720,pair:'sky'},
  {id:'gate-east',x:2820,y:280,pair:'sky'},
 ],
};
