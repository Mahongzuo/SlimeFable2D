import { SlimeSimulation, type Rect } from './physics';
export const WORLD_WIDTH=4260;
export class Level {
 readonly id:string='forest';readonly width:number=WORLD_WIDTH;
 readonly water={x:2420,y:602,w:480,h:80};
 readonly plates=[{x:3240,y:600},{x:3450,y:600}];
 readonly gate:Rect={x:3580,y:415,w:35,h:185,kind:'gate'};
 readonly base:Rect[]=[
  {x:-150,y:600,w:2570,h:350,kind:'earth'},
  {x:2420,y:676,w:480,h:274,kind:'pool'},
  {x:2900,y:600,w:1510,h:350,kind:'earth'},
  {x:830,y:533,w:155,h:67,kind:'stone'},
  {x:1060,y:466,w:150,h:134,kind:'stone'},
  {x:1320,y:510,w:170,h:90,kind:'stone'},
  {x:1760,y:387,w:260,h:187,kind:'root'},
  {x:-30,y:0,w:30,h:600,kind:'boundary'},
  {x:4260,y:0,w:30,h:600,kind:'boundary'},
 ];
 solids:Rect[]=[...this.base,this.gate];
 checkpoint={x:300,y:540};
 gateOpen=false;
 gateCharge=0;
 plateActive=[false,false];
 complete=false;
 dew=[{x:720,y:551,got:false},{x:1125,y:418,got:false},{x:1640,y:550,got:false},{x:2180,y:554,got:false},{x:2670,y:635,got:false},{x:3130,y:550,got:false}];
 update(sim:SlimeSimulation,dt:number){
  const c=sim.center();
  if(c.x>2090&&this.checkpoint.x<2090)this.checkpoint={x:2160,y:550};
  if(c.x>2980&&this.checkpoint.x<2980)this.checkpoint={x:3040,y:550};
  const groups=sim.groups();
  const occupied=this.plates.map(plate=>groups.find(g=>sim.particles.filter(p=>p.group===g&&Math.abs(p.x-plate.x)<43&&p.y>577&&p.y<608).length>4));
  this.plateActive=occupied.map(g=>g!==undefined);
  if(occupied[0]!==undefined&&occupied[1]!==undefined&&occupied[0]!==occupied[1])this.gateCharge=Math.min(1,this.gateCharge+dt*1.8);
  else this.gateCharge=Math.max(0,this.gateCharge-dt*2);
  if(this.gateCharge>=1&&!this.gateOpen){this.gateOpen=true;this.solids=[...this.base];sim.solids=this.solids;}
  for(const d of this.dew)if(!d.got&&sim.particles.some(p=>(p.x-d.x)**2+(p.y-d.y)**2<25**2))d.got=true;
  if(c.x>4060&&groups.length===1&&this.gateOpen)this.complete=true;
  if(sim.particles.some(p=>!Number.isFinite(p.x)||p.y>1000))this.respawn(sim);
 }
 respawn(sim:SlimeSimulation){sim.reset(this.checkpoint.x,this.checkpoint.y);sim.solids=this.solids;sim.water=this.water;}
 get area(){return [{at:0,name:'露水草甸',sub:'DEWMEADOW'},{at:770,name:'蘑菇台阶',sub:'MUSHROOM STEPS'},{at:1530,name:'树根窄廊',sub:'ROOT PASSAGE'},{at:2300,name:'镜水浅湾',sub:'MIRROR POOL'},{at:3100,name:'双芽石门',sub:'TWINSPROUT GATE'},{at:3870,name:'苔光树洞',sub:'MOSSLIGHT HOLLOW'}];}
 region(x:number){return this.area.filter(a=>x>=a.at).at(-1)!;}
 hint(x:number,groups:number):string{
  if(x<750)return '空格二段跳 · 走走停停，感受身体的果冻晃动';
  if(x<1500)return '靠墙后按 W / ↑ 黏住攀爬 · 空格蹬墙跳';
  if(x<2110)return 'S / ↓ 钻缝，出洞自动回弹 · 也可黏墙后 W / ↑ 攀爬';
  if(x<2350)return '树根的另一端，也有一片新天地 · 检查点已点亮';
  if(x<2980)return '入水会溅起水花 · S 下潜，空格跃出水面';
  if(x<3590)return groups===1?'按 Q 分裂 · 让两团身体分别停在发光踏板上':'C 切换 / 1、2 直选 · 分别压住两块踏板';
  return groups>1?'把两团带到一起，按 E 合并，再回家':'前方的树洞，就是这趟小小冒险的终点';
 }
}

