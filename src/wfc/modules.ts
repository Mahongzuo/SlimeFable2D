import type {RoomModule} from './types';

function room(partial:RoomModule):RoomModule{return partial;}

export const MODULES:RoomModule[]=[
 room({
  id:'explore-ledge',tags:['explore'],
  sockets:{n:'closed',e:'walk',s:'climb',w:'walk'},
  solids:[
   {x:40,y:168,w:220,h:16,kind:'branch',oneWay:true},
   {x:280,y:120,w:200,h:16,kind:'branch',oneWay:true},
   {x:500,y:168,w:120,h:16,kind:'branch',oneWay:true},
  ],
  dew:[{x:360,y:86,got:false,role:'bonus'}],enemies:[],souvenirs:[],
 }),
 room({
  id:'explore-climb',tags:['explore','shaft'],
  sockets:{n:'climb',e:'closed',s:'climb',w:'walk'},
  solids:[
   {x:560,y:8,w:22,h:184,kind:'root'},
   {x:80,y:150,w:180,h:16,kind:'branch',oneWay:true},
   {x:300,y:90,w:160,h:16,kind:'branch',oneWay:true},
  ],
  dew:[],enemies:[],souvenirs:[],
 }),
 room({
  id:'combat-cap',tags:['combat'],
  sockets:{n:'closed',e:'walk',s:'closed',w:'walk'},
  solids:[
   {x:20,y:168,w:600,h:22,kind:'stone'},
   {x:8,y:40,w:20,h:150,kind:'root'},
   {x:612,y:40,w:20,h:150,kind:'root'},
  ],
  dew:[{x:320,y:128,got:false,role:'bonus'}],
  enemies:[{id:'wfc-cap',kind:'cap',x:300,y:136,patrol:80}],
  souvenirs:[],
 }),
 room({
  id:'combat-spore',tags:['combat'],
  sockets:{n:'closed',e:'walk',s:'closed',w:'walk'},
  solids:[
   {x:30,y:160,w:580,h:20,kind:'moss'},
   {x:220,y:90,w:140,h:16,kind:'branch',oneWay:true},
  ],
  dew:[],
  enemies:[{id:'wfc-spore',kind:'spore',x:300,y:68,patrol:30}],
  souvenirs:[],
 }),
 room({
  id:'souvenir-alcove',tags:['souvenir'],
  sockets:{n:'closed',e:'closed',s:'closed',w:'walk'},
  solids:[
   {x:40,y:168,w:520,h:22,kind:'moss'},
   {x:560,y:40,w:22,h:150,kind:'root'},
  ],
  dew:[],enemies:[],
  souvenirs:[{id:'mossheart',name:'苔心',x:420,y:140,got:false}],
 }),
 room({
  id:'dew-pocket',tags:['dew','explore'],
  sockets:{n:'climb',e:'walk',s:'closed',w:'walk'},
  solids:[
   {x:80,y:140,w:200,h:16,kind:'branch',oneWay:true},
   {x:320,y:88,w:180,h:16,kind:'branch',oneWay:true},
  ],
  dew:[{x:400,y:50,got:false,role:'bonus'}],enemies:[],souvenirs:[],
 }),
 room({
  id:'shaft-rungs',tags:['shaft'],
  sockets:{n:'climb',e:'closed',s:'climb',w:'closed'},
  solids:[
   {x:40,y:8,w:22,h:184,kind:'root'},
   {x:578,y:8,w:22,h:184,kind:'root'},
   {x:80,y:70,w:120,h:14,kind:'branch',oneWay:true},
   {x:400,y:140,w:120,h:14,kind:'branch',oneWay:true},
  ],
  dew:[],enemies:[],souvenirs:[],
 }),
];

export function modulesFor(tag?:string){
 if(!tag||tag==='spine')return MODULES;
 return MODULES.filter(m=>m.tags.includes(tag as RoomModule['tags'][number]));
}

export const SPINE_CELLS:{col:number;row:number;locked:string}[]=[
 {col:0,row:3,locked:'spine'},{col:1,row:3,locked:'spine'},{col:2,row:3,locked:'spine'},
 {col:3,row:3,locked:'spine'},{col:4,row:3,locked:'spine'},{col:5,row:3,locked:'spine'},
 {col:6,row:3,locked:'spine'},{col:1,row:2,locked:'spine'},{col:2,row:2,locked:'spine'},
 {col:1,row:0,locked:'spine'},{col:1,row:1,locked:'spine'},{col:2,row:0,locked:'spine'},
 {col:3,row:4,locked:'spine'},{col:3,row:5,locked:'spine'},{col:3,row:6,locked:'spine'},
 {col:3,row:7,locked:'spine'},{col:3,row:8,locked:'spine'},{col:3,row:9,locked:'spine'},
 {col:7,row:0,locked:'spine'},{col:7,row:1,locked:'spine'},{col:7,row:2,locked:'spine'},
];

export const BRANCH_SLOTS:{col:number;row:number;role:RoomModule['tags'][number]}[]=[
 {col:0,row:1,role:'explore'},
 {col:4,row:1,role:'dew'},
 {col:5,row:1,role:'explore'},
 {col:2,row:7,role:'combat'},
 {col:4,row:6,role:'combat'},
 {col:6,row:8,role:'souvenir'},
 {col:5,row:5,role:'shaft'},
];
