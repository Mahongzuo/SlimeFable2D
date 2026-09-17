export type ItemKind='material'|'key'|'quest'|'souvenir';
export type ItemDef={id:string;name:string;icon:string;stack:number;kind:ItemKind};

export const ITEMS:Record<string,ItemDef>={
 spore:{id:'spore',name:'孢子粉',icon:'◈',stack:99,kind:'material'},
 leaf:{id:'leaf',name:'嫩叶',icon:'❀',stack:99,kind:'material'},
 mossheart:{id:'mossheart',name:'苔心',icon:'✦',stack:1,kind:'souvenir'},
 honeydrop:{id:'honeydrop',name:'蜜心',icon:'✦',stack:1,kind:'souvenir'},
 tidepoem:{id:'tidepoem',name:'潮诗',icon:'✧',stack:1,kind:'souvenir'},
 windbell:{id:'windbell',name:'风铃碎片',icon:'❀',stack:1,kind:'souvenir'},
 mirrorstar:{id:'mirrorstar',name:'镜湖星片',icon:'✧',stack:1,kind:'souvenir'},
};

export function itemOf(id:string){return ITEMS[id];}
