export class TagSet {
 private tags=new Set<string>();
 has(tag:string){return this.tags.has(tag);}
 add(tag:string){this.tags.add(tag);}
 remove(tag:string){this.tags.delete(tag);}
 list(){return [...this.tags];}
}
