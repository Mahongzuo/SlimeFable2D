import {ENEMIES} from './ai/machine';
import {CAMY_FOREST,FEATURES_FOREST,type CamClamp,type LevelFeatures} from './catalog';
import {FOREST_LAYOUT,WORLD_HEIGHT,WORLD_WIDTH} from './content/chapter1/forest';
import {cloneLayout,type AreaBand,type CheckTrigger,type DewSpot,type DressingSpot,type EnemySpot,type HintBand,type LevelLayout,type PortalSpot,type QuestDef,type SignSpot,type SouvenirSpot,type StakeSpot,type WinCond} from './content/types';
import {SlimeSimulation,type Rect} from './physics';
import {EcoWorld} from './ecology/world';
import {createEcology} from './ecology/content';

export {WORLD_HEIGHT,WORLD_WIDTH};
export type {DewSpot,SouvenirSpot,StakeSpot};

export class Level {
 id:string;
 width:number;
 height:number;
 fallY:number;
 completeX:number;
 features:LevelFeatures=FEATURES_FOREST;
 camY:CamClamp=CAMY_FOREST;
 water:{x:number;y:number;w:number;h:number};
 plates:{x:number;y:number}[];
 gate:Rect;
 base:Rect[];
 solids:Rect[];
 checkpoint:{x:number;y:number};
 exit?:{x:number;y:number;w:number;h:number};
 gateOpen=false;
 gateCharge=0;
 plateActive=[false,false];
 complete=false;
 fell=false;
 bossDown=true;
 dew:DewSpot[];
 souvenirs:SouvenirSpot[];
 stakes:StakeSpot[];
 enemies:EnemySpot[];
 quests:QuestDef[];
 areas:AreaBand[];
 signs?:SignSpot[];
 hints?:HintBand[];
 checks?:CheckTrigger[];
 win?:WinCond;
 dressing:DressingSpot[];
 portals:PortalSpot[];
 portalCool=0;
 ported=false;
 ecology:EcoWorld;
 contentVersion='living-v1';
 waters:{x:number;y:number;w:number;h:number}[];
 constructor(layout:LevelLayout=FOREST_LAYOUT){
  const data=cloneLayout(layout);
  this.id=data.id;
  this.width=data.width;
  this.height=data.height;
  this.fallY=data.fallY;
  this.completeX=data.completeX;
  this.water=data.water;
  this.waters=data.waters??[];
  this.plates=data.plates;
  this.gate=data.gate;
  this.base=data.base;
  this.solids=data.gate.w>2?[...data.base,data.gate]:[...data.base];
  this.checkpoint=data.checkpoint;
  this.exit=data.exit;
  this.dew=data.dew;
  this.souvenirs=data.souvenirs;
  this.stakes=data.stakes;
  this.enemies=data.enemies;
  this.quests=data.quests;
  this.areas=data.areas;
  this.signs=data.signs;
  this.hints=data.hints;
  this.checks=data.checks;
  this.win=data.win;
  this.dressing=data.dressing??[];
  this.portals=data.portals??[];
  this.contentVersion=data.contentVersion??'living-v1';
  this.ecology=new EcoWorld(data.ecology??createEcology(this.id,data.base,[...(data.waters??[]),data.water]));
  this.gateOpen=this.plates.length<2||data.gate.w<=2;
  this.bossDown=!data.enemies.some(e=>ENEMIES[e.kind]?.gate);
  if(this.gateOpen)this.solids=[...data.base];
 }
 applyLayout(layout:LevelLayout){
  const data=cloneLayout(layout);
  this.id=data.id;
  this.width=data.width;
  this.height=data.height;
  this.fallY=data.fallY;
  this.completeX=data.completeX;
  this.water=data.water;
  this.waters=data.waters??[];
  this.plates=data.plates;
  this.gate=data.gate;
  this.base=data.base;
  this.solids=this.gateOpen||data.gate.w<=2?[...data.base]:[...data.base,data.gate];
  this.checkpoint=data.checkpoint;
  this.exit=data.exit;
  this.dew=data.dew;
  this.souvenirs=data.souvenirs;
  this.stakes=data.stakes;
  this.enemies=data.enemies;
  this.quests=data.quests;
  this.areas=data.areas;
  this.signs=data.signs;
  this.hints=data.hints;
  this.checks=data.checks;
  this.win=data.win;
  this.dressing=data.dressing??[];
  this.portals=data.portals??[];
  this.contentVersion=data.contentVersion??'living-v1';
  this.ecology=new EcoWorld(data.ecology??createEcology(this.id,data.base,[...(data.waters??[]),data.water]));
 }
 get mainDew(){return this.dew.filter(d=>d.role!=='bonus');}
 get mainDewDone(){return this.mainDew.length>0&&this.mainDew.every(d=>d.got);}
 get area(){return this.areas;}
 region(x:number,y?:number){
  const bands=this.area;
  const byX=bands.filter(a=>x>=a.at);
  if(y===undefined){
   const floor=byX.filter(a=>(a.y0??400)>=300&&(a.y1??800)<=900);
   return (floor.length?floor:byX).at(-1)??bands[0];
  }
  const byY=byX.filter(a=>a.y0===undefined||(y>=a.y0&&y<(a.y1??9e9)));
  return byY.at(-1)??byX.at(-1)??bands[0];
 }
 ecoSolids():Rect[]{
  return this.ecology.revealedPlatforms();
 }
 syncSolids(sim?:SlimeSimulation){
  this.solids=this.gateOpen||this.gate.w<=2?[...this.base,...this.ecoSolids()]:[...this.base,this.gate,...this.ecoSolids()];
  if(sim)sim.solids=this.solids;
 }
 applyEcoPlatforms(sim:SlimeSimulation){
  const extra=this.ecoSolids();
  if(!extra.length)return;
  const key=(r:Rect)=>`${r.x}|${r.y}|${r.w}`;
  const have=new Set(this.solids.map(key));
  for(const r of extra)if(!have.has(key(r)))this.solids.push(r);
  sim.solids=this.solids;
 }
 private waterAt(x:number,y:number){
  if(this.water.w>2&&x>=this.water.x&&x<=this.water.x+this.water.w&&y>=this.water.y&&y<=this.water.y+this.water.h)return this.water;
  return this.waters.find(w=>x>=w.x&&x<=w.x+w.w&&y>=w.y&&y<=w.y+w.h)??(this.water.w>2?this.water:undefined);
 }
 private bumpChecks(c:{x:number;y:number}){
  if(this.checks?.length){
   for(const ch of this.checks){
    const a=ch.at;
    if(c.x>=a.x&&c.x<=a.x+a.w&&c.y>=a.y&&c.y<=a.y+a.h)this.checkpoint={x:ch.x,y:ch.y};
   }
   return;
  }
  if(this.id!=='forest')return;
  if(c.x>2090&&c.y<720&&this.checkpoint.x<2090)this.checkpoint={x:2288,y:550};
  if(c.x>2980&&c.y<720&&this.checkpoint.x<2980)this.checkpoint={x:3040,y:550};
  if(c.x>1180&&c.x<1600&&c.y<280&&this.checkpoint.y>400)this.checkpoint={x:1260,y:220};
  if(c.x>1700&&c.x<2200&&c.y>1400)this.checkpoint={x:1860,y:1530};
 }
 update(sim:SlimeSimulation,dt:number,interact=false){
  const c=sim.center();
  this.ecology.update(dt,sim,interact);
  this.applyEcoPlatforms(sim);
  this.bumpChecks(c);
  const wet=this.waterAt(c.x,c.y);
  if(wet)sim.water=wet;
  const groups=sim.groups();
  const occupied=this.plates.map(plate=>groups.find(g=>sim.particles.filter(p=>p.group===g&&Math.abs(p.x-plate.x)<43&&p.y>plate.y-23&&p.y<plate.y+8).length>4));
  this.plateActive=occupied.map(g=>g!==undefined);
  if(this.plates.length>=2){
   if(occupied[0]!==undefined&&occupied[1]!==undefined&&occupied[0]!==occupied[1])this.gateCharge=Math.min(1,this.gateCharge+dt*1.8);
   else this.gateCharge=Math.max(0,this.gateCharge-dt*2);
  }
  const dewReady=!this.features.quests||this.mainDewDone||!this.mainDew.length;
  if((this.plates.length<2||this.gateCharge>=1)&&dewReady&&!this.gateOpen){this.gateOpen=true;this.syncSolids(sim);}
  for(const d of this.dew)if(!d.got&&sim.particles.some(p=>(p.x-d.x)**2+(p.y-d.y)**2<25**2))d.got=true;
  for(const s of this.souvenirs)if(!s.got&&sim.particles.some(p=>(p.x-s.x)**2+(p.y-s.y)**2<28**2))s.got=true;
  this.stepPortals(sim,dt);
  const win=this.win;
  const atLine=c.x>(win?.kind==='line'?win.x:this.completeX);
  const atZone=win?.kind==='zone'&&c.x>win.x&&c.x<win.x+win.w&&c.y>win.y&&c.y<win.y+win.h;
  if((win?.kind==='zone'?atZone:atLine)&&groups.length===1&&this.gateOpen&&this.bossDown)this.complete=true;
  if(sim.particles.some(p=>!Number.isFinite(p.x)||p.y>this.fallY)){this.fell=true;this.respawn(sim);}
 }
 protected stepPortals(sim:SlimeSimulation,dt:number){
  this.portalCool=Math.max(0,this.portalCool-dt);
  this.ported=false;
  if(!this.portals.length||this.portalCool>0)return;
  const grounded=sim.particles.some(p=>p.group===sim.activeGroup&&p.ground);
  if(!grounded)return;
  for(const gate of this.portals){
   if(!sim.particles.some(p=>p.group===sim.activeGroup&&Math.abs(p.x-gate.x)<70&&p.y>gate.y-200&&p.y<gate.y+16))continue;
   const dest=this.portals.find(o=>o.pair===gate.pair&&o.id!==gate.id);
   if(!dest)continue;
   sim.plant(dest.x,dest.y-48);
   this.portalCool=10;
   this.ported=true;
   return;
  }
 }
 respawn(sim:SlimeSimulation){this.ecology.rewind();sim.reset(this.checkpoint.x,this.checkpoint.y);sim.solids=this.solids;sim.water=this.waterAt(this.checkpoint.x,this.checkpoint.y)??this.water;}
 hint(x:number,groups:number,y=600):string{
  if(this.hints?.length){
   const hit=this.hints.filter(h=>x>=h.x0&&x<h.x1&&(h.y0===undefined||(y>=h.y0&&y<(h.y1??9e9))));
   if(hit.length)return hit.at(-1)!.text;
  }
  if(this.id!=='forest')return groups>1?'把两团带到一起，按 E 合并':'继续往前走';
  if(y>800)return '根窟 · 贴墙攀回林层，或向两侧找战斗房和纪念物';
  if(y<400)return '林冠 · 二段跳加攀爬，高处也有晨露';
  if(x<750)return '空格二段跳 · 走走停停，感受身体的果冻晃动';
  if(x<1500)return '靠墙后按 W / ↑ 黏住攀爬 · 空格蹬墙跳';
  if(x<2110)return 'S / ↓ 钻缝，出洞自动回弹 · 树根旁有一条向下的竖井';
  if(x<2350)return '树根的另一端，也有一片新天地 · 检查点已点亮';
  if(x<2980)return '入水会溅起水花 · S 下潜，空格跃出水面 · 清水可补炮弹和生命';
  if(this.features.quests&&!this.mainDewDone)return `主线晨露 ${this.mainDew.filter(d=>d.got).length} / ${this.mainDew.length} · 收齐后终点门才会开`;
  if(x<3590)return groups===1?'按 Q 分裂 · 让两团身体分别停在发光踏板上':'C 切换 / 1、2 直选 · 分别压住两块踏板';
  if(x<4600)return groups>1?'把两团带到一起，按 E 合并，再往东走':'东边关口有南宫师姐，先合并再过去';
  if(!this.bossDown)return '关口南宫师姐 · 躲开箭和猪，击败她才能离开';
  return groups>1?'把两团带到一起，按 E 合并，再回家':'关口已开，再往东走，就是这趟冒险的终点';
 }
}
