import type {Rect} from '../physics';
type C=CanvasRenderingContext2D;

export type DeckPalette={
 stone0:string;stone1:string;stone2:string;
 speck:string[];
 moss0:string;moss1:string;moss2:string;mossLine:string;
 plank0:string;plank1:string;plankLine:string;
 crystals?:string[];
};

export type DeckGrass={x:number;y:number;h:number;phase:number;color:string;press:number;vPress:number};

export const WIND_DECK:DeckPalette={
 stone0:'#d2b07a',stone1:'#a47c4c',stone2:'#5e432c',
 speck:['#ead29a33','#3a261828','#c9a86a22'],
 moss0:'#d8e66a',moss1:'#9cb84a',moss2:'#5f7a30',mossLine:'#eef4a888',
 plank0:'#c08a48',plank1:'#7a5328',plankLine:'#ead29a66',
};

export const MIRROR_DECK:DeckPalette={
 stone0:'#b9c4cf',stone1:'#7f8ea0',stone2:'#4a586c',
 speck:['#e6eef533','#2a364828','#9ec8e822'],
 moss0:'#a8d89a',moss1:'#6aa86e',moss2:'#3f6e4c',mossLine:'#dcf4d888',
 plank0:'#9aa7b8',plank1:'#5c6a7e',plankLine:'#e2ecf466',
 crystals:['#9fd4ea','#c8ecff','#7ec8ff'],
};

export function deckStyle(s:Rect){
 if(s.kind==='boundary'||s.kind==='pool')return 'skip' as const;
 if(s.h<=24)return 'plank' as const;
 return 'stone' as const;
}

function ellipse(c:C,x:number,y:number,rx:number,ry:number,color:string,angle=0){
 c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.fill();
}

function plank(c:C,s:Rect,r:()=>number,pal:DeckPalette){
 const g=c.createLinearGradient(0,s.y,0,s.y+s.h);
 g.addColorStop(0,pal.plank0);g.addColorStop(1,pal.plank1);
 c.fillStyle=g;c.fillRect(s.x,s.y,s.w,s.h);
 c.strokeStyle=pal.plankLine;c.lineWidth=1;
 for(let x=s.x+6;x<s.x+s.w;x+=16+r()*10){
  c.beginPath();c.moveTo(x,s.y+1);c.lineTo(x+(r()-.5)*3,s.y+s.h-1);c.stroke();
 }
 c.strokeStyle=pal.mossLine;c.lineWidth=1.6;
 c.beginPath();c.moveTo(s.x,s.y);c.lineTo(s.x+s.w,s.y);c.stroke();
}

function stone(c:C,s:Rect,r:()=>number,pal:DeckPalette){
 const g=c.createLinearGradient(0,s.y,0,s.y+Math.max(s.h,80));
 g.addColorStop(0,pal.stone0);g.addColorStop(.42,pal.stone1);g.addColorStop(1,pal.stone2);
 c.fillStyle=g;c.fillRect(s.x,s.y,s.w,s.h);
 c.save();c.beginPath();c.rect(s.x,s.y,s.w,s.h);c.clip();
 for(let i=0;i<s.w*.4;i++){
  const x=s.x+r()*s.w,y=s.y+10+r()*s.h,sz=2+r()*8;
  ellipse(c,x,y,sz,sz*.6,pal.speck[i%pal.speck.length],r());
 }
 c.restore();
 const moss=c.createLinearGradient(0,s.y-5,0,s.y+20);
 moss.addColorStop(0,pal.moss0);moss.addColorStop(.35,pal.moss1);moss.addColorStop(1,pal.moss2);
 c.fillStyle=moss;c.beginPath();c.moveTo(s.x,s.y);c.lineTo(s.x+s.w,s.y);c.lineTo(s.x+s.w,s.y+12);
 for(let x=s.x+s.w;x>=s.x;x-=12)c.lineTo(x,s.y+12+r()*9);
 c.closePath();c.fill();
 c.strokeStyle=pal.mossLine;c.lineWidth=2;c.beginPath();c.moveTo(s.x,s.y);c.lineTo(s.x+s.w,s.y);c.stroke();
 if(!pal.crystals)return;
 for(let x=s.x+16;x<s.x+s.w-12;x+=28+r()*36){
  if(r()>.42)continue;
  const h=4+r()*7,col=pal.crystals[Math.floor(r()*pal.crystals.length)];
  c.fillStyle=col;c.beginPath();c.moveTo(x,s.y);c.lineTo(x+3,s.y-h);c.lineTo(x+6,s.y);c.closePath();c.fill();
 }
}

/** Side-view fill of one collision rect. Top edge stays on `solid.y`. */
export function paintDeck(c:C,s:Rect,r:()=>number,pal:DeckPalette){
 const style=deckStyle(s);
 if(style==='skip')return;
 if(style==='plank'){plank(c,s,r,pal);return;}
 stone(c,s,r,pal);
}

export function paintBasin(c:C,w:Rect,deep:[string,string,string],rim:string){
 const rimY=w.y-14,floor=w.y+w.h;
 c.save();
 c.beginPath();
 c.moveTo(w.x-8,rimY);
 c.quadraticCurveTo(w.x-2,floor,w.x+w.w*.2,floor+2);
 c.lineTo(w.x+w.w*.8,floor+2);
 c.quadraticCurveTo(w.x+w.w+2,floor,w.x+w.w+8,rimY);
 c.closePath();
 const g=c.createLinearGradient(0,rimY,0,floor);
 g.addColorStop(0,deep[0]);g.addColorStop(.4,deep[1]);g.addColorStop(1,deep[2]);
 c.fillStyle=g;c.fill();
 c.strokeStyle=rim;c.lineWidth=3;
 c.beginPath();c.moveTo(w.x-10,rimY);c.lineTo(w.x+w.w+10,rimY);c.stroke();
 c.restore();
}

export function scatterDeckGrass(solids:Rect[],r:()=>number,colors:string[]){
 const grasses:DeckGrass[]=[];
 for(const s of solids){
  if(s.kind==='boundary'||s.kind==='pool'||s.h>80&&s.w<40)continue;
  const step=s.oneWay||s.h<=22?28:14;
  for(let x=s.x+8;x<s.x+s.w-8;x+=step){
   grasses.push({x,y:s.y,h:8+r()*16,phase:r()*6.28,color:colors[Math.floor(r()*colors.length)],press:0,vPress:0});
  }
 }
 return grasses;
}

export function stirDeckGrass(grasses:DeckGrass[],bodies:{x:number;y:number;vy:number}[],dt:number){
 for(const grass of grasses){
  let force=0;
  for(const s of bodies){if(Math.abs(grass.x-s.x)<30&&s.y<grass.y+10&&s.y>grass.y-72)force+=.6+Math.max(0,s.vy)/380;}
  grass.vPress+=(force-grass.press*22-grass.vPress*7)*dt;
  grass.press=Math.max(0,grass.press+grass.vPress*dt);
 }
}

export function gustDeckGrass(grasses:DeckGrass[],x:number,y:number,power:number){
 for(const grass of grasses){
  if(Math.abs(grass.x-x)<90&&Math.abs(grass.y-y)<80)grass.vPress+=2.4*power;
 }
}

export function drawDeckGrass(c:C,grasses:DeckGrass[],camera:number,time:number,centers:{x:number;y:number;vx:number}[]){
 for(const grass of grasses){
  const x=grass.x-camera;if(x<-30||x>1280+30)continue;
  let bend=Math.sin(time*1.8+grass.phase)*3;
  for(const s of centers){
   const d=grass.x-s.x;
   if(Math.abs(d)<65&&Math.abs(grass.y-s.y)<70)bend+=Math.sign(d)*Math.max(0,1-Math.abs(d)/65)*17+s.vx*.025;
  }
  const h=grass.h*Math.max(.32,1-grass.press);
  for(let i=-1;i<2;i++){
   c.beginPath();
   c.moveTo(x+i*3,grass.y+3);
   c.lineTo(x+i*4+bend,grass.y-h*(i===0?1:.65));
   c.lineTo(x+i*3+3,grass.y+3);
   c.closePath();c.fillStyle=grass.color;c.fill();
  }
 }
}
