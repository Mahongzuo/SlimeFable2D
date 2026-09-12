export type LevelStatus='ready'|'coming';
export type LevelEntry={
 id:string;
 index:number;
 name:string;
 en:string;
 chapter:string;
 blurb:string;
 winEyebrow:string;
 winTitle:string;
 dewName:string;
 status:LevelStatus;
};

export const CATALOG:LevelEntry[]=[
 {id:'forest',index:1,name:'苔光森林',en:'MOSSLIGHT WOOD',chapter:'第一章',blurb:'从露水草甸出发，去森林尽头看看。',winEyebrow:'A LITTLE JOURNEY, WELL TRAVELLED',winTitle:'小小一滴，也走了很远。',dewName:'晨露',status:'ready'},
 {id:'honey',index:2,name:'琥珀蜜穴',en:'AMBER HIVE',chapter:'第二章',blurb:'沿蜜蜡岩壁往里走，蜜心还在发光。',winEyebrow:'THE HIVE STILL GLOWS',winTitle:'蜜心还在发光。',dewName:'蜜露',status:'ready'},
 {id:'tide',index:3,name:'潮汐石廊',en:'TIDAL GALLERY',chapter:'第三章',blurb:'潮水退去时，石廊才会让出一条路。',winEyebrow:'THE TIDE REMEMBERS',winTitle:'潮水把路又藏了起来。',dewName:'盐晶',status:'coming'},
 {id:'wind',index:4,name:'风铃荒原',en:'BELL HEATH',chapter:'第四章',blurb:'风把铃铛吹响，身体也会跟着晃。',winEyebrow:'A WIND THAT SINGS',winTitle:'荒原上的铃还在响。',dewName:'风籽',status:'coming'},
 {id:'mirror',index:5,name:'镜湖夜航',en:'MIRROR NIGHT',chapter:'第五章',blurb:'湖面像另一片天空，要小心地滑过去。',winEyebrow:'NIGHT ON GLASS',winTitle:'倒影把你送回了岸。',dewName:'星屑',status:'coming'},
 {id:'candy',index:6,name:'糖晶火山',en:'CANDY CALDERA',chapter:'第六章',blurb:'甜的岩浆会粘住脚步，也托得住身体。',winEyebrow:'SUGAR AND FIRE',winTitle:'火山把甜味留给了你。',dewName:'糖晶',status:'coming'},
 {id:'star',index:7,name:'星露矿脉',en:'STARVEIN',chapter:'第七章',blurb:'矿洞里的露水会自己发光。',winEyebrow:'VEINS OF NIGHT',winTitle:'矿脉把星光借给了你。',dewName:'星露',status:'coming'},
 {id:'fog',index:8,name:'雾中古堡',en:'FOGKEEP',chapter:'第八章',blurb:'雾太厚时，只能听见自己的落地。',winEyebrow:'THE KEEP IN MIST',winTitle:'雾散了一点点。',dewName:'雾珠',status:'coming'},
 {id:'deep',index:9,name:'深海灯塔',en:'LANTERN DEEP',chapter:'第九章',blurb:'灯塔还亮着，海就会给人一条路。',winEyebrow:'A LIGHT BELOW',winTitle:'灯塔把你送上了岸。',dewName:'潮光',status:'coming'},
 {id:'moon',index:10,name:'月下归途',en:'MOON ROAD',chapter:'第十章',blurb:'走完这一路，就可以回家了。',winEyebrow:'THE WAY HOME',winTitle:'月还在，路也还在。',dewName:'月露',status:'coming'},
];

export function levelById(id:string){return CATALOG.find(l=>l.id===id);}
export function previousLevel(id:string){const i=CATALOG.findIndex(l=>l.id===id);return i>0?CATALOG[i-1]:undefined;}
export function nextLevel(id:string){const i=CATALOG.findIndex(l=>l.id===id);return i>=0?CATALOG[i+1]:undefined;}
