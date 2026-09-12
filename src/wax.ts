import type {Rect,SlimeSimulation} from './physics';
export interface Shard {x:number;y:number;vx:number;vy:number;size:number;angle:number;spin:number;life:number;kind:'chunk'|'dust'}
export interface Crumb {x:number;y:number;vx:number;vy:number;life:number;r:number}
export const WAX_HOLD=1.2,WAX_REFORM=3.6;
export class WaxPlatform {
 rect:Rect;solid=true;load=0;missing=0;crack=0;private away=0;shards:Shard[]=[];crumbs:Crumb[]=[];
 constructor(x:number,y:number,w=120){this.rect={x,y,w,h:18,kind:'wax',oneWay:true};}
 supported(sim:SlimeSimulation){
  return sim.groups().some(g=>{
   const body=sim.particles.filter(p=>p.group===g),c=sim.center(g);
   if(c.y>this.rect.y+24)return false;
   return body.filter(p=>p.x>this.rect.x-6&&p.x<this.rect.x+this.rect.w+6&&p.y>this.rect.y-16&&p.y<this.rect.y+12).length>=Math.max(4,body.length*.018);
  });
 }
 get sink(){return this.solid?Math.min(5,this.load*2.2):0;}
 get shake(){return this.load>.25?Math.sin(this.load*36)*2.2:0;}
 get reforming(){return !this.solid&&this.missing>=WAX_REFORM-.5;}
 advance(dt:number,supported:boolean){
  for(const s of this.shards){s.vy+=620*dt;s.vx*=Math.exp(-.45*dt);s.x+=s.vx*dt;s.y+=s.vy*dt;s.angle+=s.spin*dt;s.life-=dt;}
  this.shards=this.shards.filter(s=>s.life>0);
  for(const c of this.crumbs){c.vy+=520*dt;c.x+=c.vx*dt;c.y+=c.vy*dt;c.life-=dt;}
  this.crumbs=this.crumbs.filter(c=>c.life>0);
  if(!this.solid){this.missing+=dt;if(this.missing>=WAX_REFORM-1e-9){this.solid=true;this.load=0;this.crack=0;this.away=0;this.missing=0;}return;}
  if(supported){
   this.away=0;this.load+=dt;
   if(Math.random()<dt*22)this.crumbs.push({x:this.rect.x+6+Math.random()*(this.rect.w-12),y:this.rect.y+this.sink+16,vx:(Math.random()-.5)*40,vy:20+Math.random()*30,life:.45+Math.random()*.35,r:.8+Math.random()*1.4});
  }else{this.away+=dt;if(this.away>=.16-1e-9)this.load=0;}
  this.crack=this.load?this.load/WAX_HOLD:Math.max(0,this.crack-dt/.4);
  if(this.load>WAX_HOLD+1e-9){
   this.solid=false;this.missing=0;
   for(let i=0;i<18;i++)this.shards.push({x:this.rect.x+this.rect.w*(i+.4)/18,y:this.rect.y+6,vx:Math.sin(i*7.13)*90+(Math.random()-.5)*40,vy:-40-Math.random()*90,size:5+Math.random()*7,angle:Math.random()*6,spin:(Math.random()-.5)*10,life:1.2,kind:'chunk'});
   for(let i=0;i<32;i++)this.shards.push({x:this.rect.x+Math.random()*this.rect.w,y:this.rect.y+4+Math.random()*8,vx:(Math.random()-.5)*140,vy:-20-Math.random()*80,size:1+Math.random()*1.8,angle:Math.random()*6,spin:(Math.random()-.5)*14,life:.7+Math.random()*.5,kind:'dust'});
  }
 }
 reset(){this.solid=true;this.load=this.missing=this.crack=this.away=0;this.shards=[];this.crumbs=[];}
}
