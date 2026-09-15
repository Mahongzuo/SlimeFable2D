import {itemOf} from './defs';

export type Slot={id:string;count:number};
const COLS=6,ROWS=3,CAPACITY=COLS*ROWS;

export class Inventory {
 slots:Slot[]=[];
 open=false;
 get size(){return CAPACITY;}
 clear(){this.slots=[];this.open=false;}
 toggle(){this.open=!this.open;}
 count(id:string){return this.slots.filter(s=>s.id===id).reduce((n,s)=>n+s.count,0);}
 add(id:string,amount=1){
  const def=itemOf(id);if(!def||amount<=0)return 0;
  let left=amount;
  for(const slot of this.slots){
   if(slot.id!==id)continue;
   const room=def.stack-slot.count;
   const take=Math.min(room,left);
   slot.count+=take;left-=take;
  }
  while(left>0&&this.slots.length<CAPACITY){
   const take=Math.min(def.stack,left);
   this.slots.push({id,count:take});left-=take;
  }
  return amount-left;
 }
}