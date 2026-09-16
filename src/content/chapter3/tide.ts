import type {LevelLayout} from '../types';

/**
 * 潮汐石廊 · 可走层是抠好的 `assets/tide/scene.png`，贴满 2560×1440，与碰撞 1:1。
 * 海水空洞透明，让 sky / far / middle 视差透出来。注释 (ix,iy) 仍是最初 1280×720 画布坐标。
 */
export const TIDE_SCALE=2;
export const TIDE_WIDTH=1280*TIDE_SCALE;
export const TIDE_HEIGHT=720*TIDE_SCALE;

export type TideWater={x:number;y:number;w:number;h:number};
export type TideFall={x:number;y:number;w:number;h:number};

/** 两处休息水池：出生浅滩、三层圆窗旁的潮池。补弹 + 回血。 */
export const TIDE_WATERS:TideWater[]=[
 {x:450,y:1304,w:200,h:66},
 {x:1600,y:772,w:160,h:58},
];

/** 瀑布帘幕：史莱姆穿过会切断水流、溅起水花。 */
export const TIDE_FALLS:TideFall[]=[
 {x:410,y:120,w:80,h:532},    // 西侧细瀑 (205-245, 60→326) 落到三层西廊
 {x:300,y:652,w:120,h:638},   // 西侧大瀑 (150-210, 326→645) 落到出生浅滩
 {x:740,y:300,w:50,h:352},    // 五层前沿小瀑 (370-395, 150→326)
 {x:1660,y:428,w:80,h:344},   // 四层细瀑 (830-870, 214→386) 落进圆窗潮池
 {x:2020,y:428,w:110,h:692},  // 东侧大瀑 (1010-1065, 214→560) 落到一层石台
];

export const TIDE_LAYOUT:LevelLayout={
 id:'tide',
 width:TIDE_WIDTH,
 height:TIDE_HEIGHT,
 fallY:1600,
 completeX:9000,
 water:{x:-9999,y:9999,w:1,h:1},
 plates:[{x:9000,y:0},{x:9010,y:0}],
 gate:{x:9000,y:0,w:1,h:1,kind:'gate'},
 checkpoint:{x:800,y:1214},
 exit:{x:1700,y:150,w:310,h:150},
 base:[
  {x:0,y:1290,w:450,h:156,kind:'stone'},
  {x:450,y:1370,w:200,h:76,kind:'pool'},
  {x:650,y:1290,w:210,h:156,kind:'stone'},
  {x:860,y:1330,w:1700,h:116,kind:'stone'},
  {x:1664,y:1104,w:480,h:66,kind:'stone'},
  {x:2260,y:1084,w:300,h:232,kind:'stone'},
  {x:800,y:992,w:880,h:56,kind:'stone'},
  {x:1120,y:652,w:280,h:150,kind:'stone'},
  {x:260,y:652,w:860,h:150,kind:'stone'},
  {x:1540,y:760,w:60,h:120,kind:'stone'},
  {x:1600,y:830,w:160,h:50,kind:'pool'},
  {x:1760,y:760,w:410,h:120,kind:'stone'},
  {x:688,y:528,w:200,h:112,kind:'stone'},
  {x:1120,y:416,w:520,h:66,kind:'stone'},
  {x:1700,y:428,w:320,h:102,kind:'stone'},
  {x:464,y:288,w:600,h:60,kind:'stone'},
  {x:1696,y:288,w:310,h:66,kind:'stone'},
  {x:2128,y:400,w:340,h:120,kind:'stone'},
  {x:-30,y:-200,w:30,h:1900,kind:'boundary'},
  {x:TIDE_WIDTH,y:-200,w:30,h:1900,kind:'boundary'},
 ],
 dew:[
  {x:710,y:1210,got:false,role:'main'},
  {x:1900,y:1088,got:false,role:'main'},
  {x:1540,y:970,got:false,role:'main'},
  {x:360,y:610,got:false,role:'main'},
  {x:1980,y:718,got:false,role:'main'},
  {x:1400,y:386,got:false,role:'main'},
  {x:700,y:250,got:false,role:'main'},
  {x:2300,y:358,got:false,role:'main'},
 ],
 enemies:[
  {id:'cap-tide',kind:'cap',x:1940,y:1128,patrol:120},
  {id:'spore-tide',kind:'spore',x:1500,y:428,patrol:60},
  {id:'cent-gallery',kind:'cent',x:1400,y:428,patrol:90},
  {id:'wolfb-bridge',kind:'wolfb',x:1880,y:1130,patrol:70},
  {id:'pale-gate',kind:'pale',x:580,y:292,patrol:70},
 ],
 souvenirs:[{id:'tidepoem',name:'潮诗',x:600,y:498,got:false}],
 stakes:[],
 areas:[
  {at:0,name:'残拱石岛',sub:'RUIN CROWN',y0:-200,y1:440},
  {at:0,name:'四层石廊',sub:'UPPER GALLERY',y0:440,y1:640},
  {at:0,name:'圆窗石廊',sub:'RING GALLERY',y0:640,y1:900},
  {at:0,name:'石桥',sub:'STONE BRIDGE',y0:900,y1:1100},
  {at:0,name:'东台灯廊',sub:'LANTERN TERRACE',y0:1100,y1:1250},
  {at:0,name:'潮汐浅滩',sub:'TIDE SHOAL',y0:1264,y1:1800},
 ],
 quests:[
  {id:'tide-main-salt',chapter:'tide',kind:'main',title:'收集盐晶',steps:[{type:'dew',target:'main',count:8}]},
  {id:'tide-side-poem',chapter:'tide',kind:'side',title:'寻回潮诗',steps:[{type:'souvenir',target:'tidepoem',count:1}]},
 ],
};
