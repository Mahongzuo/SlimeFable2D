export type FloaterKind='hit'|'hurt'|'heal';
export type Floater={x:number;y:number;text:string;life:number;max:number;kind:FloaterKind;drift:number}

export class CueBus {
 floaters:Floater[]=[];
 spawn(x:number,y:number,text:string,kind:FloaterKind){
  this.floaters.push({x,y,text,life:.75,max:.75,kind,drift:(Math.random()-.5)*16});
 }
 step(dt:number){
  for(const f of this.floaters)f.life-=dt;
  this.floaters=this.floaters.filter(f=>f.life>0);
 }
}
