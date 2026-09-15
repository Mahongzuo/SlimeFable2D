import {canvas} from './art';

/** Pale paper, baked checkerboard, leftover white matte, and edge-black studio void. */
export function paper(r:number,g:number,b:number,a:number){
 if(a<10)return true;
 const sat=Math.max(r,g,b)-Math.min(r,g,b),luma=.3*r+.59*g+.11*b;
 if(sat<32&&luma>186)return true;
 if(sat<14&&luma>168)return true;
 return false;
}

function voidInk(r:number,g:number,b:number,a:number){
 if(paper(r,g,b,a))return true;
 const sat=Math.max(r,g,b)-Math.min(r,g,b),luma=.3*r+.59*g+.11*b;
 return sat<20&&luma<16;
}

export function isolateSprite(img:HTMLImageElement|HTMLCanvasElement){
 const cv=canvas(img.width,img.height),ctx=cv.getContext('2d')!;
 ctx.drawImage(img,0,0);
 const data=ctx.getImageData(0,0,img.width,img.height),d=data.data;
 const w=img.width,h=img.height,n=w*h;
 const seen=new Uint8Array(n),q=new Uint32Array(n);let head=0,tail=0;
 const push=(x:number,y:number)=>{
  if(x<0||y<0||x>=w||y>=h)return;
  const p=y*w+x;if(seen[p])return;
  const i=p*4;if(!voidInk(d[i],d[i+1],d[i+2],d[i+3]))return;
  seen[p]=1;q[tail++]=p;
 };
 for(let x=0;x<w;x++){push(x,0);push(x,h-1);}
 for(let y=0;y<h;y++){push(0,y);push(w-1,y);}
 while(head<tail){
  const p=q[head++],x=p%w,y=(p/w)|0;d[p*4+3]=0;
  push(x-1,y);push(x+1,y);push(x,y-1);push(x,y+1);
  push(x-1,y-1);push(x+1,y-1);push(x-1,y+1);push(x+1,y+1);
 }
 for(let pass=0;pass<4;pass++){
  const kill:number[]=[];
  for(let p=0;p<n;p++){
   const i=p*4;if(d[i+3]<10)continue;
   if(!voidInk(d[i],d[i+1],d[i+2],d[i+3]))continue;
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

/** Interior arch / sag holes never touch the edge flood. Key every pale paper and checker cell. */
export function punchHoles(img:HTMLCanvasElement|HTMLImageElement){
 const w=img instanceof HTMLCanvasElement?img.width:img.naturalWidth;
 const h=img instanceof HTMLCanvasElement?img.height:img.naturalHeight;
 const cv=canvas(w,h),ctx=cv.getContext('2d')!;
 ctx.drawImage(img,0,0);
 const data=ctx.getImageData(0,0,w,h),d=data.data;
 for(let i=0;i<d.length;i+=4){
  const r=d[i],g=d[i+1],b=d[i+2],a=d[i+3];
  if(a<10){d[i]=d[i+1]=d[i+2]=d[i+3]=0;continue;}
  const sat=Math.max(r,g,b)-Math.min(r,g,b),luma=.3*r+.59*g+.11*b;
  const pale=sat<28&&luma>198||sat<18&&luma>186;
  const checker=sat<14&&luma>155&&luma<220;
  if(pale||checker){d[i]=d[i+1]=d[i+2]=d[i+3]=0;}
 }
 ctx.putImageData(data,0,0);
 return cv;
}

export function keyedSprite(img:HTMLImageElement|HTMLCanvasElement){
 return isolateSprite(punchHoles(isolateSprite(img)));
}

/** Opaque left–right span on the walkable deck row, as source crop. */
export function deckCrop(img:HTMLCanvasElement|HTMLImageElement){
 const w=img instanceof HTMLCanvasElement?img.width:img.naturalWidth;
 const h=img instanceof HTMLCanvasElement?img.height:img.naturalHeight;
 const frac=deckFrac(img);
 if(w<4||h<4)return {sx:0,sy:0,sw:w,sh:h,frac};
 const cv=img instanceof HTMLCanvasElement?img:canvas(w,h);
 if(cv!==img)cv.getContext('2d')!.drawImage(img,0,0);
 const d=cv.getContext('2d')!.getImageData(0,0,w,h).data;
 const y0=Math.max(0,Math.min(h-1,Math.floor(h*frac)));
 let sx=0,ex=w-1,best=0;
 for(let y=y0;y<Math.min(h,y0+14);y++){
  let a=w,b=0;
  for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>48){if(x<a)a=x;if(x>b)b=x;}
  if(b>a&&b-a>best){best=b-a;sx=a;ex=b;}
 }
 return {sx,sy:0,sw:Math.max(8,ex-sx+1),sh:h,frac};
}

/** Top of the widest opaque band = walkable deck, as a 0–1 fraction of image height. */
export function deckFrac(img:HTMLCanvasElement|HTMLImageElement){
 const w=img instanceof HTMLCanvasElement?img.width:img.naturalWidth;
 const h=img instanceof HTMLCanvasElement?img.height:img.naturalHeight;
 if(w<4||h<4)return .12;
 const cv=img instanceof HTMLCanvasElement?img:canvas(w,h);
 if(cv!==img)cv.getContext('2d')!.drawImage(img,0,0);
 const d=cv.getContext('2d')!.getImageData(0,0,w,h).data;
 const runs=new Uint16Array(h);
 let peak=0;
 for(let y=0;y<h;y++){
  let run=0,max=0;
  for(let x=0;x<w;x++){
   if(d[(y*w+x)*4+3]>48){run++;if(run>max)max=run;}
   else run=0;
  }
  runs[y]=max;if(max>peak)peak=max;
 }
 const need=Math.max(8,Math.floor(peak*.72));
 for(let y=0;y<h;y++)if(runs[y]>=need)return y/h;
 return .18;
}

export type DeckRect={x:number;y:number;w:number;h?:number}
export type DeckStamp={sx:number;sy:number;sw:number;sh:number;dx:number;dy:number;dw:number;dh:number;scale:number}

/** Uniform scale from source deck width. Crop the underside if it would cover the next deck. */
export function stampDeckLayout(srcW:number,srcH:number,frac:number,x:number,y:number,w:number,gapBelow?:number):DeckStamp{
 const scale=w/Math.max(1,srcW);
 let destH=srcH*scale;
 let sh=srcH;
 const hang=destH*(1-frac);
 if(gapBelow!=null&&Number.isFinite(gapBelow)&&hang>gapBelow){
  destH=Math.max(8,gapBelow/Math.max(.05,1-frac));
  sh=Math.max(8,Math.min(srcH,destH/scale));
  destH=sh*scale;
 }
 return {sx:0,sy:0,sw:srcW,sh,dx:x,dy:y-destH*frac,dw:w,dh:destH,scale};
}

export function gapBelowDeck(deck:DeckRect,solids:DeckRect[]){
 let gap=1e9;
 for(const s of solids){
  if(s.y<=deck.y)continue;
  if(s.x+s.w<=deck.x||s.x>=deck.x+deck.w)continue;
  gap=Math.min(gap,s.y-deck.y);
 }
 return gap;
}

export function pickDeckKind(w:number){return w>=700?'plateau':'step';}
export function pickDeckVariant(x:number,y:number,n:number){
 return Math.abs((Math.imul(x|0,374761393)^Math.imul(y|0,668265263))>>>0)%n;
}

export function stampDeck(c:CanvasRenderingContext2D,img:HTMLCanvasElement|HTMLImageElement,x:number,y:number,w:number,gapBelow?:number,flip=false){
 const crop=deckCrop(img);
 const layout=stampDeckLayout(crop.sw,crop.sh,crop.frac,x,y,w,gapBelow);
 const src={sx:crop.sx,sy:crop.sy,sw:crop.sw,sh:layout.sh};
 c.save();
 if(flip){c.translate(layout.dx+layout.dw/2,0);c.scale(-1,1);c.translate(-(layout.dx+layout.dw/2),0);}
 if(layout.sh<crop.sh-1){
  const fade=canvas(Math.max(2,Math.round(layout.dw)),Math.max(2,Math.round(layout.dh)));
  const f=fade.getContext('2d')!;
  f.drawImage(img,src.sx,src.sy,src.sw,src.sh,0,0,fade.width,fade.height);
  const g=f.createLinearGradient(0,fade.height-24,0,fade.height);
  g.addColorStop(0,'#00000000');g.addColorStop(1,'#000000ff');
  f.globalCompositeOperation='destination-out';
  f.fillStyle=g;f.fillRect(0,fade.height-24,fade.width,24);
  c.drawImage(fade,layout.dx,layout.dy);
 }else c.drawImage(img,src.sx,src.sy,src.sw,src.sh,layout.dx,layout.dy,layout.dw,layout.dh);
 c.restore();
 return layout;
}
