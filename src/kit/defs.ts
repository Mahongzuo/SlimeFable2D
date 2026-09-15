export type KitCategory='terrain'|'water'|'flora'|'prop'|'collect'|'interact'|'enemy'|'critter'|'sign';
export type KitPlace='rect'|'point';
export type KitPlay='solid'|'water'|'pickup'|'dress'|'actor'|'sign'|'interact';
export type KitInteract='sway'|'press'|'climb'|'oneWay';

export type KitEntry={
 id:string;
 chapter:string;
 category:KitCategory;
 name:string;
 place:KitPlace;
 play:KitPlay;
 interact?:KitInteract;
 defaults:{w?:number;h?:number;s?:number};
 draw:'canvas'|'image';
 src?:string;
 solidKind?:string;
 oneWay?:boolean;
 pickup?:'dew'|'souvenir';
 dewSkin?:string;
 souvenirId?:string;
 actorKind?:string;
 interactKind?:'plate'|'gate'|'stake'|'checkpoint'|'exit'|'win-line'|'hint'|'area';
 mark:string;
};

export const KIT_CATEGORIES:KitCategory[]=['terrain','water','flora','prop','collect','interact','enemy','critter','sign'];

export const CATEGORY_LABEL:Record<KitCategory,string>={
 terrain:'地形',water:'水体',flora:'草木',prop:'摆件',collect:'收集',interact:'交互',enemy:'敌人',critter:'小动物',sign:'路牌',
};

export const CHAPTER_MARK:Record<string,string>={forest:'苔',honey:'蜜',tide:'潮',wind:'风'};
