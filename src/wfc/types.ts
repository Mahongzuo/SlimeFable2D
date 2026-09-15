import type {Rect} from '../physics';
import type {DewSpot,EnemySpot,SouvenirSpot} from '../content/types';

export type Socket='closed'|'walk'|'climb';
export type ModuleTag='spine'|'explore'|'combat'|'souvenir'|'dew'|'shaft';

export type RoomModule={
 id:string;
 tags:ModuleTag[];
 sockets:{n:Socket;e:Socket;s:Socket;w:Socket};
 solids:Rect[];
 dew:DewSpot[];
 enemies:EnemySpot[];
 souvenirs:SouvenirSpot[];
}

export type GridCell={col:number;row:number;locked?:string;role?:ModuleTag}

export const CELL_W=640,CELL_H=200,GRID_COLS=8,GRID_ROWS=10;
