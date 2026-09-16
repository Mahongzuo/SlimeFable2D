import {canvas} from '../art';
import {deckFrac} from '../art-key';
type C=CanvasRenderingContext2D;

/** Studio white, plus the gray/white checker cells AI bakes into “transparent” RGB PNGs. */
function studioMatte(r:number,g:number,b:number,a:number,checker:boolean){
 if(a<10)return true;
 const sat=Math.max(r,g,b)-Math.min(r,g,b),luma=.3*r+.59*g+.11*b;
 if(Math.min(r,g,b)>226&&sat<16)return true;
 return checker&&sat<20&&luma>148;
}

/** Flood the studio matte from the borders only, so pale stone inside the sprite survives. */
function keyStudio(img:HTMLImageElement|HTMLCanvasElement,checker:boolean){
 const w=img instanceof HTMLCanvasElement?img.width:img.naturalWidth;
 const h=img instanceof HTMLCanvasElement?img.height:img.naturalHeight;
 const cv=canvas(w,h),ctx=cv.getContext('2d')!;
 ctx.drawImage(img,0,0);
 const data=ctx.getImageData(0,0,w,h),d=data.data,n=w*h;
 const white=(p:number)=>{const i=p*4;return studioMatte(d[i],d[i+1],d[i+2],d[i+3],checker);};
 const seen=new Uint8Array(n),q=new Uint32Array(n);let head=0,tail=0;
 const push=(x:number,y:number)=>{if(x<0||y<0||x>=w||y>=h)return;const p=y*w+x;if(seen[p]||!white(p))return;seen[p]=1;q[tail++]=p;};
 for(let x=0;x<w;x++){push(x,0);push(x,h-1);}
 for(let y=0;y<h;y++){push(0,y);push(w-1,y);}
 while(head<tail){const p=q[head++],x=p%w,y=(p/w)|0;push(x-1,y);push(x+1,y);push(x,y-1);push(x,y+1);}
 for(let p=0;p<n;p++)if(seen[p]){const i=p*4;d[i]=d[i+1]=d[i+2]=d[i+3]=0;}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const p=y*w+x;if(seen[p])continue;
  let edge=false;
  for(let oy=-1;oy<=1&&!edge;oy++)for(let ox=-1;ox<=1;ox++){const nx=x+ox,ny=y+oy;if(nx<0||ny<0||nx>=w||ny>=h)continue;if(seen[ny*w+nx]){edge=true;break;}}
  if(!edge)continue;
  const i=p*4,minc=Math.min(d[i],d[i+1],d[i+2]);
  if(minc>196)d[i+3]=Math.min(d[i+3],Math.round(255*Math.max(0,1-(minc-196)/40)));
 }
 ctx.putImageData(data,0,0);
 let x0=w,y0=h,x1=0,y1=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(d[(y*w+x)*4+3]<12)continue;if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;}
 if(x1<=x0||y1<=y0)return cv;
 const out=canvas(x1-x0+1,y1-y0+1);
 out.getContext('2d')!.drawImage(cv,x0,y0,out.width,out.height,0,0,out.width,out.height);
 return out;
}

export function keyWhite(img:HTMLImageElement|HTMLCanvasElement){return keyStudio(img,false);}

/** Same border flood as `keyWhite`, but also lifts baked checkerboard cells. */
export function keyMatte(img:HTMLImageElement|HTMLCanvasElement){return keyStudio(img,true);}

/** Side-view platform strip: `top` is the walkable row, caps are the rounded ends, the middle tiles. */
export type Slab={img:HTMLCanvasElement;top:number;capW:number};

export function makeSlab(img:HTMLImageElement|HTMLCanvasElement,capFrac=.2):Slab{
 const k=keyWhite(img);
 const top=Math.round(deckFrac(k)*k.height);
 return {img:k,top,capW:Math.max(8,Math.round(k.width*capFrac))};
}

export type SlabLayout={scale:number;dTop:number;dH:number;cropped:boolean};

/** Uniform scale so the body hangs `hang` px; shrink only if both caps would overlap. */
export function slabLayout(slab:{width:number;height:number;top:number;capW:number},w:number,hang:number,gapBelow=1e9):SlabLayout{
 const srcHang=Math.max(1,slab.height-slab.top);
 let scale=hang/srcHang;
 const maxScale=w/(2*slab.capW);
 if(scale>maxScale)scale=maxScale;
 const dTop=slab.top*scale;
 let dH=slab.height*scale,cropped=false;
 const room=gapBelow-6;
 if(Number.isFinite(gapBelow)&&dH-dTop>room){dH=dTop+Math.max(12,room);cropped=true;}
 return {scale,dTop,dH,cropped};
}

/** Fill [x, x+w] with the slab. The walkable row lands on `y`; nothing is stretched horizontally. */
export function paintSlab(c:C,slab:Slab,x:number,y:number,w:number,hang:number,gapBelow=1e9){
 const {img,top,capW}=slab;
 const lay=slabLayout({width:img.width,height:img.height,top,capW},w,hang,gapBelow);
 const {scale,dTop,dH}=lay;
 const cv=canvas(Math.max(2,Math.ceil(w)),Math.max(2,Math.ceil(dH)));
 const f=cv.getContext('2d')!;
 const srcRows=Math.min(img.height,dH/scale);
 const dCap=capW*scale,midSrcW=img.width-capW*2,dMid=midSrcW*scale;
 f.drawImage(img,0,0,capW,srcRows,0,0,dCap,dH);
 f.drawImage(img,img.width-capW,0,capW,srcRows,w-dCap,0,dCap,dH);
 if(w-dCap*2>1&&dMid>1){
  f.save();f.beginPath();f.rect(dCap,0,w-dCap*2,dH);f.clip();
  for(let tx=dCap,i=0;tx<w-dCap;tx+=dMid,i++){
   if(i%2){f.save();f.translate(tx*2+dMid,0);f.scale(-1,1);f.drawImage(img,capW,0,midSrcW,srcRows,tx,0,dMid,dH);f.restore();}
   else f.drawImage(img,capW,0,midSrcW,srcRows,tx,0,dMid,dH);
  }
  f.restore();
 }
 if(lay.cropped){
  const g=f.createLinearGradient(0,dH-26,0,dH);
  g.addColorStop(0,'#00000000');g.addColorStop(1,'#000000ff');
  f.globalCompositeOperation='destination-out';f.fillStyle=g;f.fillRect(0,dH-26,w,26);
 }
 c.drawImage(cv,x,y-dTop);
 return lay;
}

/** Vertical support column between two decks, purely visual. Caps stay, the shaft tiles. */
export function paintColumn(c:C,img:HTMLCanvasElement,cx:number,y0:number,y1:number,width:number,alpha=1){
 const total=y1-y0;if(total<12)return;
 const scale=width/img.width,capSrc=Math.round(img.height*.26),dCap=capSrc*scale;
 const x=cx-width/2;
 c.save();c.globalAlpha=alpha;
 if(total<=img.height*scale*1.15){c.drawImage(img,x,y0,width,total);c.restore();return;}
 c.drawImage(img,0,0,img.width,capSrc,x,y0,width,dCap);
 c.drawImage(img,0,img.height-capSrc,img.width,capSrc,x,y1-dCap,width,dCap);
 const midSrc=img.height-capSrc*2,dMid=midSrc*scale;
 c.beginPath();c.rect(x,y0+dCap,width,total-dCap*2);c.clip();
 for(let ty=y0+dCap,i=0;ty<y1-dCap;ty+=dMid,i++){
  if(i%2){c.save();c.translate(0,ty*2+dMid);c.scale(1,-1);c.drawImage(img,0,capSrc,img.width,midSrc,x,ty,width,dMid);c.restore();}
  else c.drawImage(img,0,capSrc,img.width,midSrc,x,ty,width,dMid);
 }
 c.restore();
}

/** Landmark sprite standing on a deck: bottom on `y`, centred on `cx`, aspect kept. */
export function paintProp(c:C,img:HTMLCanvasElement,cx:number,y:number,h:number,alpha=1){
 const w=h*img.width/Math.max(1,img.height);
 c.save();c.globalAlpha=alpha;c.drawImage(img,cx-w/2,y-h,w,h);c.restore();
}
