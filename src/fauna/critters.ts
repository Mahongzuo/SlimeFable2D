export type ForestCritter={kind:'moth'|'snail';x:number;y:number;homeX:number;homeY:number;phase:number;span:number;s:number;dir:number;minX:number;maxX:number}

export function wanderMoth(c:ForestCritter,time:number){
 c.x=c.homeX+Math.sin(time*.7+c.phase)*c.span;
 c.y=c.homeY+Math.cos(time*1.1+c.phase)*c.span*.35;
}

export function crawlSnail(c:ForestCritter,time:number){
 const wave=Math.sin(time*.35+c.phase);
 c.x=Math.max(c.minX,Math.min(c.maxX,c.homeX+wave*c.span));
 c.dir=Math.cos(time*.35+c.phase)>=0?1:-1;
}
