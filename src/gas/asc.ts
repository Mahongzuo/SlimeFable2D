import {AttributeSet} from './attributes';
import {TagSet} from './tags';

export class AbilitySystemComponent {
 attrs=new AttributeSet();
 tags=new TagSet();
 cds=new Map<string,number>();
 private holds:{tag:string;left:number}[]=[];
 constructor(init?:Partial<Pick<AttributeSet,'hp'|'maxHp'|'ammo'|'attack'>>){
  if(init)Object.assign(this.attrs,init);
 }
 has(tag:string){return this.tags.has(tag);}
 hold(tag:string,seconds:number){this.tags.add(tag);this.holds.push({tag,left:seconds});}
 cooling(id:string){return (this.cds.get(id)??0)>0;}
 setCd(id:string,seconds:number){this.cds.set(id,seconds);}
 step(dt:number){
  for(const [id,left] of this.cds)this.cds.set(id,Math.max(0,left-dt));
  for(const hold of this.holds){
   hold.left-=dt;
   if(hold.left<=0)this.tags.remove(hold.tag);
  }
  this.holds=this.holds.filter(hold=>hold.left>0);
 }
}
