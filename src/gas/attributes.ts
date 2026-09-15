export type AttrName='hp'|'maxHp'|'ammo'|'attack';

export class AttributeSet {
 hp=0;
 maxHp=0;
 ammo=0;
 attack=1;
 get(name:AttrName){return this[name];}
 set(name:AttrName,value:number){this[name]=value;return this[name];}
}
