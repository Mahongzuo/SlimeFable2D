import type {Rect} from '../physics';

export type EcoBehavior='harvest'|'bounce'|'offer'|'light'|'valve'|'bridge'|'lift'|'current'|'bell'|'wind'|'glide'|'mirror'|'memory'|'plate'|'portal';
export type EcoObject={
 id:string; kind:string; x:number; y:number; needs?:string[]; text?:string;
 target?:{x:number;y:number}; platform?:Rect; tuning?:number;
};
export type FaunaSpot={id:string;kind:string;x:number;y:number;span:number;habitat?:string;follow?:string;target?:{x:number;y:number}};
export type EcoEvent={id:string;title:string;objects:string[];kind?:'all'|'ordered'|'split-merge'|'echo';text:string};
export type EcoChallenge={id:string;title:string;limit:number;points:{x:number;y:number;r?:number}[];text:string};
export type EcoBiome={id:string;name:string;x:number;y:number;w:number;h:number;color:string};
export type EcologyLayout={interactables?:EcoObject[];fauna?:FaunaSpot[];events?:EcoEvent[];challenges?:EcoChallenge[];biomes?:EcoBiome[];contentVersion?:string};
export type EcoDefinition={id:string;chapter:string;name:string;behavior:EcoBehavior;color:string;icon:string;hint:string};
