export type AtlasClip={pack:string;x:number;y:number;t:number;life:number;scale?:number}

type C=CanvasRenderingContext2D;

function ink(pack:string){
 if(pack==='slash')return {core:'#e8f6ff',edge:'#88bbff',glow:'#aaddff'};
 if(pack==='bow')return {core:'#fff6d4',edge:'#88bbff',glow:'#aaddff'};
 if(pack==='dragon')return {core:'#ffe08a',edge:'#f0a020',glow:'#ffd27a'};
 if(pack==='shock')return {core:'#fff4b0',edge:'#f0c45a',glow:'#ffe08a'};
 return {core:'#fff6c8',edge:'#88bbff',glow:'#c8e8ff'};
}

function drawClip(c:C,clip:AtlasClip,camera:number){
 const u=Math.max(0,Math.min(1,clip.t/Math.max(.05,clip.life)));
 const fade=Math.max(0,1-u*u);
 const s=(clip.scale??1)*(1+u*.25);
 const x=clip.x-camera,y=clip.y;
 const col=ink(clip.pack);
 c.save();c.translate(x,y);c.globalAlpha=fade;
 if(clip.pack==='slash'){
  c.strokeStyle=col.glow;c.lineWidth=5*s;c.beginPath();c.arc(8,-4,22*s,-1.1,.4);c.stroke();
  c.strokeStyle=col.core;c.lineWidth=2.2*s;c.beginPath();c.arc(10,-6,20*s,-1,.35);c.stroke();
 }else if(clip.pack==='bow'){
  c.fillStyle=col.glow;c.beginPath();c.ellipse(0,6,3*s,10*s,0,0,Math.PI*2);c.fill();
  c.fillStyle=col.edge;c.fillRect(-1,-10*s,2,22*s);
  c.fillStyle=col.core;c.beginPath();c.moveTo(0,-16*s);c.lineTo(4,-6*s);c.lineTo(-4,-6*s);c.closePath();c.fill();
 }else{
  const n=clip.pack==='dragon'?10:7,r=(clip.pack==='dragon'?34:22)*s;
  c.strokeStyle=col.glow;c.lineWidth=clip.pack==='dragon'?3.2:2.2;
  c.beginPath();c.arc(0,0,r*(.45+u*.55),0,Math.PI*2);c.stroke();
  c.strokeStyle=col.core;c.lineWidth=1.4;
  for(let i=0;i<n;i++){
   const a=i*(Math.PI*2/n)+u*1.2;
   c.beginPath();c.moveTo(Math.cos(a)*r*.2,Math.sin(a)*r*.2);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);c.stroke();
  }
 }
 c.restore();
}

export class AtlasFx {
 ready=true;
 draw(c:CanvasRenderingContext2D,clips:AtlasClip[],camera:number){
  for(const clip of clips)drawClip(c,clip,camera);
 }
}

export const atlasFx=new AtlasFx();
