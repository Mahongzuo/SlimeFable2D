import {canvas,rng,W,H} from './art';
import {asset} from './asset';
import {TIDE_HEIGHT,TIDE_WIDTH} from './content/chapter3/tide';
import type {Rect,SlimeSimulation} from './physics';
import type {TideLevel} from './tide-level';
import type {WaterfallSim} from './waterfall';
import {drawWater} from './water-view';
type C=CanvasRenderingContext2D;
type Critter={x:number;y:number;phase:number;span:number;s:number};
type PropKind='weed'|'coral'|'fan'|'anemone'|'bloom';
type Prop={kind:PropKind;x:number;y:number;s:number;phase:number;flip:number;sway:number;vSway:number;bounce:number;vBounce:number};
type Img=HTMLImageElement|HTMLCanvasElement;
type FloraImgs={weed?:Img;coral?:Img;fan?:Img;anemone?:Img;bloom?:Img};

const SIGNS=[680,860,1580,1740];
const SIZE:Record<PropKind,{w:number;h:number;reach:number;height:number}>={
 weed:{w:58,h:74,reach:26,height:58},
 coral:{w:62,h:68,reach:30,height:50},
 fan:{w:70,h:78,reach:34,height:58},
 anemone:{w:52,h:56,reach:24,height:40},
 bloom:{w:30,h:36,reach:14,height:24},
};

function load(src:string){
 return new Promise<HTMLImageElement>((ok,err)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=err;i.src=src;});
}

function paper(r:number,g:number,b:number,a:number){
 if(a<10)return true;
 const sat=Math.max(r,g,b)-Math.min(r,g,b),luma=.3*r+.59*g+.11*b;
 return sat<26&&luma>168;
}
function isolateSprite(img:HTMLImageElement){
 const cv=canvas(img.width,img.height),ctx=cv.getContext('2d')!;
 ctx.drawImage(img,0,0);
 const data=ctx.getImageData(0,0,img.width,img.height),d=data.data;
 const w=img.width,h=img.height,n=w*h;
 const seen=new Uint8Array(n),q=new Uint32Array(n);let head=0,tail=0;
 const push=(x:number,y:number)=>{
  if(x<0||y<0||x>=w||y>=h)return;
  const p=y*w+x;if(seen[p])return;
  const i=p*4;if(!paper(d[i],d[i+1],d[i+2],d[i+3]))return;
  seen[p]=1;q[tail++]=p;
 };
 for(let x=0;x<w;x++){push(x,0);push(x,h-1);}
 for(let y=0;y<h;y++){push(0,y);push(w-1,y);}
 while(head<tail){
  const p=q[head++],x=p%w,y=(p/w)|0;d[p*4+3]=0;
  push(x-1,y);push(x+1,y);push(x,y-1);push(x,y+1);
  push(x-1,y-1);push(x+1,y-1);push(x-1,y+1);push(x+1,y+1);
 }
 for(let pass=0;pass<3;pass++){
  const kill:number[]=[];
  for(let p=0;p<n;p++){
   const i=p*4;if(d[i+3]<10)continue;
   if(!paper(d[i],d[i+1],d[i+2],d[i+3]))continue;
   const x=p%w,y=(p/w)|0;let hole=false;
   for(let oy=-1;oy<=1&&!hole;oy++)for(let ox=-1;ox<=1;ox++){
    const nx=x+ox,ny=y+oy;if(nx<0||ny<0||nx>=w||ny>=h)continue;
    if(d[(ny*w+nx)*4+3]<12)hole=true;
   }
   if(hole)kill.push(i);
  }
  for(const i of kill)d[i+3]=0;
 }
 const alpha=new Uint8Array(n);
 for(let p=0;p<n;p++){
  const i=p*4;
  if(d[i+3]<12){d[i]=d[i+1]=d[i+2]=0;d[i+3]=0;}
  else{
   const sat=Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2]);
   const luma=.3*d[i]+.59*d[i+1]+.11*d[i+2];
   if(sat<26&&luma>198)d[i+3]=Math.min(d[i+3],Math.max(0,Math.floor((228-luma)*5)));
  }
  alpha[p]=d[p*4+3];
 }
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
  let s=0;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)s+=alpha[(y+oy)*w+x+ox];
  d[(y*w+x)*4+3]=Math.round(s/9);
 }
 ctx.putImageData(data,0,0);
 let x0=w,y0=h,x1=0,y1=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  if(d[(y*w+x)*4+3]<16)continue;
  if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;
 }
 if(x1<=x0||y1<=y0)return cv;
 const pad=2;x0=Math.max(0,x0-pad);y0=Math.max(0,y0-pad);x1=Math.min(w-1,x1+pad);y1=Math.min(h-1,y1+pad);
 const out=canvas(x1-x0+1,y1-y0+1);
 out.getContext('2d')!.drawImage(cv,x0,y0,out.width,out.height,0,0,out.width,out.height);
 return out;
}
function blit(dest:HTMLCanvasElement,img:CanvasImageSource,w:number,h:number){
 const c=dest.getContext('2d')!;
 c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 c.clearRect(0,0,w,h);c.drawImage(img,0,0,w,h);
}
/** `F:\AI\scene.png` is RGB on a pale matte. Key that matte so far / middle show through. */
function punchScene(img:HTMLImageElement){
 const cv=canvas(img.width,img.height),ctx=cv.getContext('2d')!;
 ctx.drawImage(img,0,0);
 const data=ctx.getImageData(0,0,img.width,img.height),d=data.data;
 for(let i=0;i<d.length;i+=4){
  const r=d[i],g=d[i+1],b=d[i+2];
  const sat=Math.max(r,g,b)-Math.min(r,g,b),luma=.3*r+.59*g+.11*b;
  if(sat<28&&luma>198){d[i]=d[i+1]=d[i+2]=d[i+3]=0;}
 }
 ctx.putImageData(data,0,0);return cv;
}
/**
 * Four layers like the forest: sky / far / middle / terrain.
 * Terrain is the keyed `scene.png`; holes stay transparent so far/middle can move.
 */
export class TideArt {
 sky=canvas(W,H);
 far=canvas(TIDE_WIDTH,TIDE_HEIGHT);
 middle=canvas(TIDE_WIDTH,TIDE_HEIGHT);
 terrain=canvas(TIDE_WIDTH,TIDE_HEIGHT);
 ready=false;
 jellies:Critter[]=[];
 props:Prop[]=[];
 private lastFlora=0;
 private imgs:FloraImgs={};
 private bubbles:{x:number;y:number;r:number;v:number;phase:number}[]=[];
 constructor(public level:TideLevel){
  this.scatterLife();
  this.paintFallback();
  void this.hydrate();
 }
 private add(kind:PropKind,x:number,y:number,s:number,flip=1){
  if(SIGNS.some(sx=>Math.abs(x-sx)<36))return;
  if(!this.onWalkable(x,y))return;
  this.props.push({kind,x,y,s,phase:x*.03+y*.01,flip,sway:0,vSway:0,bounce:0,vBounce:0});
 }
 /** Exposed stone top, inset from collision ends. Skip floors buried under the next ledge. */
 private onWalkable(x:number,y:number){
  if(x<190||x>2210)return false;
  let on=false;
  for(const s of this.level.base){
   if(s.kind!=='stone'||s.y!==y)continue;
   if(x<s.x+48||x>s.x+s.w-48)continue;
   on=true;
  }
  if(!on)return false;
  for(const s of this.level.base){
   if(s.kind!=='stone'||s.y>=y||y-s.y>=240)continue;
   if(x>=s.x&&x<=s.x+s.w)return false;
  }
  return true;
 }
 private scatterLife(){
  const r=rng(77);
  for(let i=0;i<8;i++)this.jellies.push({x:300+r()*1900,y:120+r()*900,phase:r()*6.28,span:30+r()*60,s:.45+r()*.4});
  for(let i=0;i<26;i++)this.bubbles.push({x:r()*TIDE_WIDTH,y:r()*TIDE_HEIGHT,r:1+r()*2.2,v:14+r()*26,phase:r()*6.28});
  this.add('weed',240,1290,1.2);this.add('coral',360,1290,1.05);this.add('bloom',740,1290,1.15);this.add('anemone',780,1290,1);
  this.add('fan',1820,1130,1.15);this.add('coral',2000,1130,1.05);this.add('weed',2100,1130,.95);
  this.add('bloom',900,1012,1);this.add('weed',1500,1012,.85);
  this.add('coral',420,652,1.1);this.add('fan',980,652,1);
  this.add('weed',1280,428,.95);this.add('anemone',1600,428,.9);
  this.add('fan',1860,292,1.1);this.add('bloom',1760,292,1);
  for(const s of this.level.base){
   if(s.kind!=='stone'||s.w<180)continue;
   for(let x=s.x+56;x<s.x+s.w-56;x+=58){
    if(!this.onWalkable(x,s.y))continue;
    if(r()<.22)this.add('weed',x,s.y,.7+r()*.45,r()>.5?1:-1);
    else if(r()<.18)this.add(r()>.5?'coral':'fan',x,s.y,.8+r()*.4,r()>.5?1:-1);
    else if(r()<.12)this.add('anemone',x,s.y,.75+r()*.35);
    else if(r()<.16)this.add('bloom',x,s.y,.85+r()*.35);
   }
  }
 }
 private async hydrate(){
  try{
   const [scene,sky,far,middle]=await Promise.all([
    load(asset('assets/tide/scene.png')),
    load(asset('assets/tide/sky.jpg')),
    load(asset('assets/tide/far.jpg')),
    load(asset('assets/tide/middle.jpg')),
   ]);
   blit(this.sky,sky,W,H);
   blit(this.far,far,TIDE_WIDTH,TIDE_HEIGHT);
   blit(this.middle,middle,TIDE_WIDTH,TIDE_HEIGHT);
   blit(this.terrain,punchScene(scene),TIDE_WIDTH,TIDE_HEIGHT);
   this.paintBasins(this.terrain.getContext('2d')!);
   this.clipFloraToPaint();
   this.ready=true;
  }catch{/* fallback gradient stays */}
  const names=['weed','coral','fan','anemone','bloom'] as const;
  await Promise.all(names.map(async name=>{
   try{this.imgs[name]=isolateSprite(await load(asset(`assets/tide/${name}.png`)));}catch{/* keep canvas fallback */}
  }));
 }
 private paintFallback(){
  const sky=this.sky.getContext('2d')!;
  const sg=sky.createLinearGradient(0,0,0,H);
  sg.addColorStop(0,'#7ec4dc');sg.addColorStop(.55,'#2a7ea3');sg.addColorStop(1,'#12384a');
  sky.fillStyle=sg;sky.fillRect(0,0,W,H);
  const far=this.far.getContext('2d')!;
  far.fillStyle='#1a4e66';far.fillRect(0,0,TIDE_WIDTH,TIDE_HEIGHT);
  const mid=this.middle.getContext('2d')!;
  mid.fillStyle='#0c3040';mid.fillRect(0,0,TIDE_WIDTH,TIDE_HEIGHT);
  const c=this.terrain.getContext('2d')!;
  c.clearRect(0,0,TIDE_WIDTH,TIDE_HEIGHT);
  const r=rng(5);
  for(const s of this.level.base){
   if(s.kind==='boundary')continue;
   c.fillStyle=s.kind==='pool'?'#123c4c':'#2f4a55';
   c.fillRect(s.x,s.y,s.w,s.h);
   if(s.kind!=='pool'){c.fillStyle='#8fb45c';c.fillRect(s.x,s.y,s.w,6+r()*3);}
  }
  this.paintBasins(c);
 }
 /** Carve a visible hollow where each pool sits so the water reads as something you step down into. */
 private paintBasins(c:C){
  for(const w of this.level.waters){
   const rim=w.y-14,floor=w.y+w.h;
   c.save();
   c.beginPath();
   c.moveTo(w.x-8,rim);
   c.quadraticCurveTo(w.x-2,floor,w.x+w.w*.2,floor+2);
   c.lineTo(w.x+w.w*.8,floor+2);
   c.quadraticCurveTo(w.x+w.w+2,floor,w.x+w.w+8,rim);
   c.closePath();
   const g=c.createLinearGradient(0,rim,0,floor);
   g.addColorStop(0,'#0d2a36');g.addColorStop(.4,'#0f3d4c');g.addColorStop(1,'#061a24');
   c.fillStyle=g;c.fill();
   c.strokeStyle='#dbe9c8aa';c.lineWidth=3;
   c.beginPath();c.moveTo(w.x-10,rim);c.lineTo(w.x+w.w+10,rim);c.stroke();
   c.strokeStyle='#4f7a5a99';c.lineWidth=5;
   c.beginPath();c.moveTo(w.x-8,rim+3);c.lineTo(w.x+w.w+8,rim+3);c.stroke();
   c.restore();
  }
 }
 drawLayers(c:C,camera:number,cameraY:number,shx=0,shy=0){
  c.drawImage(this.sky,0,0);
  c.drawImage(this.far,-camera*.15+shx*.25,cameraY*.12+shy*.25);
  c.drawImage(this.middle,-camera*.38+shx*.5,cameraY*.28+shy*.5);
  c.save();c.globalCompositeOperation='screen';
  for(let i=0;i<4;i++){
   c.save();c.translate(360+i*300-camera*.06+shx*.5,-60+cameraY*.05+shy*.5);c.rotate(.24);
   const g=c.createLinearGradient(-50,0,50,0);
   g.addColorStop(0,'#c8f4ff00');g.addColorStop(.5,'#c8f4ff14');g.addColorStop(1,'#c8f4ff00');
   c.fillStyle=g;c.fillRect(-50,0,100,900);c.restore();
  }
  c.restore();
  c.drawImage(this.terrain,-camera+shx,cameraY+shy);
 }
 gust(x:number,y:number,facing=1,power=1){
  for(const p of this.props){
   const d=Math.hypot(p.x-x,p.y-y);if(d>160)continue;
   const n=1-d/160;
   p.vSway+=facing*n*10*power;p.vBounce+=n*5*power;
  }
 }
 drawAtmosphere(c:C,camera:number,cameraY:number,time:number){
  for(const b of this.bubbles){
   const y=((b.y-time*b.v)%TIDE_HEIGHT+TIDE_HEIGHT)%TIDE_HEIGHT;
   const x=b.x+Math.sin(time*.7+b.phase)*8-camera,sy=y+cameraY;
   if(x<-10||x>W+10||sy<-10||sy>H+10)continue;
   c.strokeStyle='rgba(220,248,255,.45)';c.lineWidth=.8;
   c.beginPath();c.arc(x,sy,b.r,0,Math.PI*2);c.stroke();
  }
 }
 private curtain(c:C,f:Rect,sim:WaterfallSim,camera:number,time:number){
  const x=f.x-camera;
  if(x+f.w<-20||x>W+20)return;
  const cut=sim.cut;
  const stream=(y0:number,y1:number,alpha:number,width:number,wx0=f.x,wx1=f.x+f.w)=>{
   const x0=wx0-camera,band=wx1-wx0;
   if(y1<=y0||band<3)return;
   c.save();c.globalAlpha=alpha;
   const g=c.createLinearGradient(x0,0,x0+band,0);
   g.addColorStop(0,'#d6f6ff00');g.addColorStop(.3,'#e8fbff');g.addColorStop(.5,'#ffffff');g.addColorStop(.7,'#e8fbff');g.addColorStop(1,'#d6f6ff00');
   c.fillStyle=g;c.beginPath();
   const step=6,inset=(band-band*width)/2;
   for(let i=y0;i<=y1;i+=step){
    const sway=Math.sin(i*.03+time*4)*3+Math.sin(i*.11-time*2.2)*1.6;
    if(i===y0)c.moveTo(x0+inset+sway,i);else c.lineTo(x0+inset+sway,i);
   }
   for(let i=y1;i>=y0;i-=step){
    const sway=Math.sin(i*.03+time*4)*3+Math.sin(i*.11-time*2.2)*1.6;
    c.lineTo(x0+band-inset+sway*.5,i);
   }
   c.closePath();c.fill();
   c.globalAlpha=alpha*.9;c.strokeStyle='#ffffff';c.lineWidth=1.2;
   for(let k=0;k<3;k++){
    const lx=x0+inset+band*width*(.2+k*.3);
    c.beginPath();
    for(let i=y0;i<=y1;i+=10){
     const drift=Math.sin(i*.05+time*6+k)*2,phase=((i-time*420+k*60)%40+40)%40;
     if(phase<22){c.moveTo(lx+drift,i);c.lineTo(lx+drift,Math.min(y1,i+8));}
    }
    c.stroke();
   }
   c.restore();
  };
  const floor=f.y+f.h;
  stream(f.y,floor,.42,1);
  const cols=cut?.cols??[];
  if(!cols.length){
   const fx=x+f.w/2,fy=floor;
   c.save();c.globalAlpha=.5;
   c.fillStyle='#eafcff';
   c.beginPath();c.ellipse(fx,fy-2,f.w*.6+Math.sin(time*9)*3,5,0,0,Math.PI*2);c.fill();
   c.restore();
  }else{
   c.save();
   for(const col of cols){
    const px=(col.x0+col.x1)/2-camera,py=col.top+1,pulse=1+Math.sin(time*18+col.x0)*.1;
    c.fillStyle='rgba(236,255,255,.5)';
    c.beginPath();c.ellipse(px,py,Math.max(4,(col.x1-col.x0)*.45)*pulse,3.2,0,0,Math.PI*2);c.fill();
    c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1.2;
    c.beginPath();c.ellipse(px,py-1,Math.max(3,(col.x1-col.x0)*.35),2.2,0,Math.PI,Math.PI*2);c.stroke();
   }
   c.restore();
  }
  for(const d of sim.drops){
   const px=d.x-camera;c.save();c.translate(px,d.y);c.rotate(Math.atan2(d.vy,d.vx)+Math.PI/2);
   const g=c.createLinearGradient(-d.r,0,d.r,0);g.addColorStop(0,'#eafffb');g.addColorStop(1,'#7fd0e0c0');
   c.fillStyle=g;c.globalAlpha=Math.min(1,d.life*1.8);
   c.beginPath();c.ellipse(0,0,d.r,d.r*(1+Math.min(1,Math.abs(d.vy)/400)),0,0,Math.PI*2);c.fill();c.restore();
  }
 }
 drawFalls(c:C,camera:number,time:number){
  this.level.falls.forEach((f,i)=>this.curtain(c,f,this.level.curtains[i],camera,time));
 }
 drawPools(c:C,camera:number,time:number,front:boolean){
  for(const pool of this.level.pools)drawWater(c,pool,camera,time,front);
 }
 private sign(c:C,x:number,y:number,text:string,arrow:string){
  c.fillStyle='#726546';c.fillRect(x-4,y-74,8,74);c.save();c.translate(x,y-61);c.rotate(-.045);
  c.fillStyle='#a6996a';c.beginPath();c.roundRect(-46,-16,92,34,4);c.fill();c.strokeStyle='#dfd0a344';c.stroke();
  c.fillStyle='#414e36';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText(text,-4,-2);c.font='16px sans-serif';c.fillText(arrow,0,14);c.restore();
 }
 private exitGate(c:C,camera:number,time:number){
  const e=this.level.exit;if(!e)return;
  const cx=e.x+e.w/2-camera,floor=e.y+e.h,pulse=.62+.38*Math.sin(time*2.1);
  const glow=c.createRadialGradient(cx,floor-40,8,cx,floor-40,90);
  glow.addColorStop(0,`rgba(186,244,255,${.34*pulse})`);glow.addColorStop(1,'rgba(186,244,255,0)');
  c.fillStyle=glow;c.fillRect(cx-110,e.y-20,220,e.h+50);
  c.save();c.strokeStyle=`rgba(232,251,255,${.45+pulse*.35})`;c.lineWidth=4;
  c.beginPath();c.moveTo(cx-68,floor);c.quadraticCurveTo(cx,e.y+8,cx+68,floor);c.stroke();
  c.strokeStyle=`rgba(154,220,255,${.3+pulse*.25})`;c.lineWidth=2;
  c.beginPath();c.moveTo(cx-54,floor-6);c.quadraticCurveTo(cx,e.y+22,cx+54,floor-6);c.stroke();
  c.restore();
  this.sign(c,e.x+36,floor-8,'终点','→');
 }
 /** Drop props whose feet sit in keyed-out water past the painted island. */
 private clipFloraToPaint(){
  const data=this.terrain.getContext('2d')!.getImageData(0,0,TIDE_WIDTH,TIDE_HEIGHT).data;
  const alpha=(x:number,y:number)=>{
   const ix=Math.round(x),iy=Math.round(y);
   if(ix<0||iy<0||ix>=TIDE_WIDTH||iy>=TIDE_HEIGHT)return 0;
   return data[(iy*TIDE_WIDTH+ix)*4+3];
  };
  this.props=this.props.filter(p=>
   alpha(p.x,p.y+6)>40&&alpha(p.x-14,p.y+8)>40&&alpha(p.x+14,p.y+8)>40
  );
 }
 private stirFlora(sim:SlimeSimulation,time:number){
  const dt=Math.min(.05,this.lastFlora?time-this.lastFlora:1/60);this.lastFlora=time;
  const bodies=sim.groups().map(g=>sim.center(g));
  for(const p of this.props){
   const box=SIZE[p.kind],reach=box.reach*p.s,height=box.height*p.s;
   let hitSway=0,hitBounce=0;
   for(const s of bodies){
    const dx=s.x-p.x;if(Math.abs(dx)>reach+42)continue;
    if(s.y>p.y+18||s.y<p.y-height-40)continue;
    const near=1-Math.min(1,Math.abs(dx)/(reach+36));
    hitSway+=(dx>=0?1:-1)*near*(.95+Math.abs(s.vx)*.014);
    if(s.y<p.y-height*.22&&Math.abs(dx)<reach+10)hitBounce+=.75*near+Math.max(0,s.vy)*.009;
    else if(Math.abs(dx)<reach)hitBounce+=.28*near;
   }
   p.vSway+=(-p.sway*26-p.vSway*5.5+hitSway*2.6)*dt;p.sway=Math.max(-.72,Math.min(.72,p.sway+p.vSway*dt));
   p.vBounce+=(-p.bounce*30-p.vBounce*6.2+hitBounce*3.4)*dt;p.bounce=Math.max(-.22,Math.min(.9,p.bounce+p.vBounce*dt));
  }
 }
 private stamp(c:C,p:Prop){
  const box=SIZE[p.kind],img=this.imgs[p.kind],squash=Math.max(-.32,Math.min(.48,p.bounce));
  const w=box.w*p.s*(1+squash*.12),h=box.h*p.s*(1-squash*.22);
  if(img){c.drawImage(img,-w/2,-h,w,h);return;}
  if(p.kind==='weed'){
   c.strokeStyle='#4f8a62';c.lineWidth=2.2;
   for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*3,2);c.quadraticCurveTo(i*4,-h*.5,i*2,-h*.85);c.stroke();}
   return;
  }
  if(p.kind==='bloom'){
   c.strokeStyle='#6aa37a';c.beginPath();c.moveTo(0,0);c.lineTo(1,-18);c.stroke();
   for(let k=0;k<5;k++){c.fillStyle='#f3d6c8';c.beginPath();c.ellipse(Math.cos(k*1.256)*4,-20+Math.sin(k*1.256)*3,3,2.2,0,0,Math.PI*2);c.fill();}
   return;
  }
  c.fillStyle=p.kind==='fan'?'#b48ad4':p.kind==='anemone'?'#f3c3a8':'#e08a7a';
  c.beginPath();c.moveTo(0,4);c.quadraticCurveTo(-18,-20,0,-h*.8);c.quadraticCurveTo(18,-20,0,4);c.fill();
 }
 drawDetails(c:C,camera:number,time:number,sim:SlimeSimulation){
  this.stirFlora(sim,time);
  for(const p of this.props){
   const x=p.x-camera;if(x<-70||x>W+70)continue;
   const idle=Math.sin(time*2.1+p.phase)*(p.kind==='coral'?.018:.045);
   c.save();c.translate(x,p.y);c.rotate(p.sway+idle);c.scale(p.flip,1);this.stamp(c,p);c.restore();
  }
  this.sign(c,680-camera,1290,'潮汐浅滩','→');
  this.sign(c,1740-camera,1130,'石桥','↑');
  this.sign(c,860-camera,1012,'西廊','↑');
  this.sign(c,1580-camera,428,'终点','→');
  this.exitGate(c,camera,time);
  for(const j of this.jellies){
   const x=j.x+Math.sin(time*.5+j.phase)*j.span-camera;
   const y=j.y+Math.cos(time*.38+j.phase)*20;
   if(x<-40||x>W+40)continue;
   c.save();c.translate(x,y);c.scale(j.s,j.s);c.globalAlpha=.42;
   c.fillStyle='#f0d8ff77';c.beginPath();c.ellipse(0,-2,9,8,0,Math.PI,0);c.lineTo(6,3);c.lineTo(-6,3);c.closePath();c.fill();
   c.strokeStyle='#f3e0ff88';c.lineWidth=1;c.beginPath();c.moveTo(-3,2);c.quadraticCurveTo(-5,16,-1,22);c.moveTo(3,2);c.quadraticCurveTo(5,16,1,22);c.stroke();
   c.restore();
  }
  const cp=this.level.checkpoint;
  if(cp.x!==800){
   const x=cp.x-camera,y=cp.y+52;
   const glow=c.createRadialGradient(x,y-10,2,x,y-10,30);glow.addColorStop(0,'#cdf6ff66');glow.addColorStop(1,'#cdf6ff00');
   c.fillStyle=glow;c.fillRect(x-30,y-40,60,60);
   c.fillStyle='#e6fbff';c.fillRect(x-2,y-26,4,24);c.beginPath();c.arc(x,y-27,5,0,Math.PI*2);c.fill();
  }
  for(const d of this.level.dew){
   if(d.got)continue;const x=d.x-camera,y=d.y+Math.sin(time*2+d.x)*4;if(x<-30||x>W+30)continue;
   const glow=c.createRadialGradient(x,y,1,x,y,24);glow.addColorStop(0,'#dbf7ff88');glow.addColorStop(1,'#dbf7ff00');
   c.fillStyle=glow;c.fillRect(x-24,y-24,48,48);
   c.fillStyle='#f2fcff';c.beginPath();c.moveTo(x,y-9);c.lineTo(x+6,y+2);c.lineTo(x,y+9);c.lineTo(x-6,y+2);c.closePath();c.fill();
   c.fillStyle='#9fdff0';c.beginPath();c.moveTo(x,y-4);c.lineTo(x+2.5,y+2);c.lineTo(x,y+5);c.lineTo(x-2.5,y+2);c.closePath();c.fill();
  }
  for(const s of this.level.souvenirs){
   if(s.got)continue;const x=s.x-camera,y=s.y+Math.sin(time*2.2)*3;
   const halo=c.createRadialGradient(x,y,2,x,y,22);halo.addColorStop(0,'#ffe9b066');halo.addColorStop(1,'#ffe9b000');
   c.fillStyle=halo;c.fillRect(x-22,y-22,44,44);
   c.fillStyle='#f6e6b8';c.beginPath();c.roundRect(x-7,y-9,14,18,2);c.fill();
   c.strokeStyle='#8a6a3a';c.lineWidth=1;for(let k=0;k<3;k++){c.beginPath();c.moveTo(x-4,y-4+k*4);c.lineTo(x+4,y-4+k*4);c.stroke();}
  }
 }
 drawNear(_c:C,_camera:number,_cameraY:number){}
}
