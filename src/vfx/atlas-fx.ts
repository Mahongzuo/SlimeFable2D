import {asset} from '../asset';

type Frame={x:number;y:number;w:number;h:number};
type Pack={img:HTMLImageElement;frames:Frame[];fps:number};

const PACKS:Record<string,string>={
 slash:'vfx/slash/atlas.json',
 bow:'vfx/bow/atlas.json',
 magic:'vfx/magic/atlas.json',
 dragon:'vfx/dragon/atlas.json',
 shock:'vfx/shock/atlas.json',
};

export type AtlasClip={pack:string;x:number;y:number;t:number;life:number;scale?:number}

function loadImg(src:string){
 return new Promise<HTMLImageElement>((ok,err)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=err;i.src=src;});
}

export class AtlasFx {
 private packs=new Map<string,Pack>();
 ready=false;
 constructor(){void this.hydrate();}
 private async hydrate(){
  await Promise.all(Object.entries(PACKS).map(async([id,file])=>{
   try{
    const res=await fetch(asset(`assets/${file}`));
    if(!res.ok)return;
    const json=await res.json();
    const image=json.meta?.image??'atlas.png';
    const dir=file.replace(/\/[^/]+$/,'');
    const img=await loadImg(asset(`assets/${dir}/${image}`));
    const frames=Object.keys(json.frames??{}).sort().map(k=>{
     const f=json.frames[k].frame;
     return {x:f.x,y:f.y,w:f.w,h:f.h};
    });
    if(frames.length)this.packs.set(id,{img,frames,fps:16});
   }catch{/* missing pack is fine */}
  }));
  this.ready=true;
 }
 draw(c:CanvasRenderingContext2D,clips:AtlasClip[],camera:number){
  for(const clip of clips){
   const pack=this.packs.get(clip.pack);
   if(!pack||!pack.frames.length)continue;
   const u=Math.max(0,Math.min(.999,clip.t/Math.max(.05,clip.life)));
   const frame=pack.frames[Math.min(pack.frames.length-1,Math.floor(u*pack.frames.length))];
   const scale=clip.scale??1;
   const w=frame.w*scale,h=frame.h*scale;
   c.save();
   c.globalAlpha=Math.max(.2,1-u*.15);
   c.drawImage(pack.img,frame.x,frame.y,frame.w,frame.h,clip.x-camera-w/2,clip.y-h*.7,w,h);
   c.restore();
  }
 }
}

export const atlasFx=new AtlasFx();
