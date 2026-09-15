import {canvas} from '../art';
import type {Actor} from '../actor/actor';
import {ENEMIES} from '../ai/machine';
import type {StakeSpot} from '../content/types';
import {asset} from '../asset';
import {HiveArt} from './hive';
import {NangongArt} from './nangong';

type Img=HTMLImageElement|HTMLCanvasElement;
type Sheet={img:HTMLCanvasElement;frames:number;pad:number};

function load(src:string){return new Promise<HTMLImageElement>((ok,err)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=err;i.src=src;});}
async function optional(src:string){try{return await load(src);}catch{return undefined;}}

function paintCap(){
 const c=canvas(80,80),g=c.getContext('2d')!;
 g.translate(40,72);
 g.fillStyle='#1d2a16';g.beginPath();g.ellipse(0,-12,13,16,0,0,Math.PI*2);g.fill();
 g.fillStyle='#f3e6b8';g.beginPath();g.ellipse(0,-12,11,14,0,0,Math.PI*2);g.fill();
 g.fillStyle='#1d2a16';g.beginPath();g.ellipse(0,-28,26,16,0,0,Math.PI*2);g.fill();
 g.fillStyle='#e86a3a';g.beginPath();g.ellipse(0,-28,24,14,0,0,Math.PI*2);g.fill();
 g.fillStyle='#ffd9a0';g.beginPath();g.ellipse(-8,-30,5,3.5,0,0,Math.PI*2);g.ellipse(7,-33,4,3,0,0,Math.PI*2);g.fill();
 g.fillStyle='#1a2430';g.beginPath();g.arc(-5,-14,2.2,0,Math.PI*2);g.arc(5,-14,2.2,0,Math.PI*2);g.fill();
 g.fillStyle='#fff8e8';g.beginPath();g.arc(-5.6,-14.8,0.8,0,Math.PI*2);g.arc(4.4,-14.8,0.8,0,Math.PI*2);g.fill();
 return c;
}
function paintSpore(){
 const c=canvas(80,84),g=c.getContext('2d')!;
 g.translate(40,76);
 g.fillStyle='#1d2a16';g.beginPath();g.ellipse(0,-14,15,18,0,0,Math.PI*2);g.fill();
 g.fillStyle='#d8c07a';g.beginPath();g.ellipse(0,-14,13,16,0,0,Math.PI*2);g.fill();
 g.fillStyle='#1d2a16';g.beginPath();g.ellipse(0,-34,24,18,0,0,Math.PI*2);g.fill();
 g.fillStyle='#7dae3a';g.beginPath();g.ellipse(0,-34,22,16,0,0,Math.PI*2);g.fill();
 g.fillStyle='#f6ffc4';
 for(const [x,y] of [[-8,-36],[5,-40],[10,-30]] as const){g.beginPath();g.ellipse(x,y,4,3,0,0,Math.PI*2);g.fill();}
 g.fillStyle='#1a2430';g.beginPath();g.arc(-5,-16,2.2,0,Math.PI*2);g.arc(6,-16,2.2,0,Math.PI*2);g.fill();
 g.fillStyle='#fff8e8';g.beginPath();g.arc(-5.7,-16.8,0.8,0,Math.PI*2);g.arc(5.3,-16.8,0.8,0,Math.PI*2);g.fill();
 return c;
}
function paintVine(){
 const c=canvas(80,96),g=c.getContext('2d')!;
 g.translate(40,90);
 g.fillStyle='#1d2a16';g.fillRect(-7,-58,14,58);
 g.fillStyle='#3f8a38';g.fillRect(-5,-56,10,56);
 g.strokeStyle='#1d2a16';g.lineWidth=8;g.lineCap='round';
 g.beginPath();g.moveTo(0,-24);g.quadraticCurveTo(28,-34,34,-6);g.stroke();
 g.beginPath();g.moveTo(0,-38);g.quadraticCurveTo(-26,-48,-32,-14);g.stroke();
 g.strokeStyle='#d7f08a';g.lineWidth=4;
 g.beginPath();g.moveTo(0,-24);g.quadraticCurveTo(28,-34,34,-6);g.stroke();
 g.beginPath();g.moveTo(0,-38);g.quadraticCurveTo(-26,-48,-32,-14);g.stroke();
 g.fillStyle='#1d2a16';g.beginPath();g.ellipse(0,-62,14,11,0,0,Math.PI*2);g.fill();
 g.fillStyle='#c8ef6a';g.beginPath();g.ellipse(0,-62,12,9,0,0,Math.PI*2);g.fill();
 g.fillStyle='#1a2430';g.beginPath();g.arc(-4,-60,1.8,0,Math.PI*2);g.arc(4,-60,1.8,0,Math.PI*2);g.fill();
 return c;
}
function paintPig(){
 const c=canvas(288,56),g=c.getContext('2d')!;
 for(let i=0;i<4;i++){
  g.save();g.translate(36+i*72,48);
  g.fillStyle='#1a2430';g.beginPath();g.ellipse(0,-10,18,12,0,0,Math.PI*2);g.fill();
  g.fillStyle='#f4a0b4';g.beginPath();g.ellipse(0,-10,16,10,0,0,Math.PI*2);g.fill();
  g.fillStyle='#e87894';g.beginPath();g.ellipse(14,-8,6,5,0,0,Math.PI*2);g.fill();
  g.fillStyle='#1a2430';g.beginPath();g.arc(16,-9,1.2,0,Math.PI*2);g.arc(18,-8,1.2,0,Math.PI*2);g.fill();
  g.fillStyle='#d06080';g.beginPath();g.ellipse(-6,-18,3,4,0,0,Math.PI*2);g.ellipse(2,-18,3,4,0,0,Math.PI*2);g.fill();
  g.fillStyle='#1a2430';g.beginPath();g.arc(8,-12,1.6,0,Math.PI*2);g.fill();
  g.restore();
 }
 return packCells([c],4);
}
function paintGirl(){
 const c=canvas(288,140),g=c.getContext('2d')!;
 for(let i=0;i<4;i++){
  g.save();g.translate(36+i*72,132);
  g.fillStyle='#6d8a72';g.fillRect(-10,-42,20,18);
  g.fillStyle='#d8d4c8';g.fillRect(-12,-62,24,22);
  g.fillStyle='#7a8a7a';g.fillRect(-9,-44,4,20);g.fillRect(5,-44,4,20);
  g.fillStyle='#c8a070';g.beginPath();g.arc(0,-74,11,0,Math.PI*2);g.fill();
  g.fillStyle='#8a5a32';g.beginPath();g.arc(-10,-86,5,0,Math.PI*2);g.arc(10,-86,5,0,Math.PI*2);g.arc(0,-78,12,Math.PI,0);g.fill();
  g.fillStyle='#1a2430';g.beginPath();g.arc(-4,-74,1.4,0,Math.PI*2);g.arc(4,-74,1.4,0,Math.PI*2);g.fill();
  g.restore();
 }
 return packCells([c],4);
}

function keyBg(img:HTMLImageElement){
 const src=canvas(img.width,img.height);
 const g=src.getContext('2d',{willReadFrequently:true})!;
 g.drawImage(img,0,0);
 const data=g.getImageData(0,0,src.width,src.height),px=data.data;
 const w=src.width,h=src.height;
 const at=(x:number,y:number)=>{const i=(y*w+x)*4;return [px[i],px[i+1],px[i+2]];};
 const samples=[at(2,2),at(w-3,2),at(2,h-3),at(w-3,h-3),at(w>>1,2),at(2,h>>1)];
 const bg=samples.reduce((a,c)=>[a[0]+c[0]/samples.length,a[1]+c[1]/samples.length,a[2]+c[2]/samples.length],[0,0,0]);
 const bgLuma=(bg[0]+bg[1]+bg[2])/3;
 const screen=Math.max(bg[0],bg[1],bg[2])-Math.min(bg[0],bg[1],bg[2])>40;
 const isBg=(i:number)=>{
  const r=px[i],gv=px[i+1],b=px[i+2];
  const d=Math.abs(r-bg[0])+Math.abs(gv-bg[1])+Math.abs(b-bg[2]);
  if(screen)return d<110;
  if(d>=52)return false;
  const luma=(r+gv+b)/3;
  if(luma>bgLuma+10)return false;
  if(Math.max(r,gv,b)-Math.min(r,gv,b)>26)return false;
  return true;
 };
 const seen=new Uint8Array(w*h);
 const q=new Int32Array(w*h);
 let qs=0,qe=0;
 const push=(x:number,y:number)=>{
  if(x<0||y<0||x>=w||y>=h)return;
  const idx=y*w+x;if(seen[idx])return;
  const i=idx*4;
  if(px[i+3]>0&&!isBg(i))return;
  seen[idx]=1;px[i+3]=0;q[qe++]=idx;
 };
 for(let x=0;x<w;x++){push(x,0);push(x,h-1);}
 for(let y=0;y<h;y++){push(0,y);push(w-1,y);}
 while(qs<qe){
  const idx=q[qs++],x=idx%w,y=(idx/w)|0;
  push(x+1,y);push(x-1,y);push(x,y+1);push(x,y-1);
 }
 g.putImageData(data,0,0);
 return src;
}

function bottomPad(img:HTMLCanvasElement){
 const g=img.getContext('2d',{willReadFrequently:true});
 if(!g)return 0;
 const data=g.getImageData(0,0,img.width,img.height).data;
 for(let y=img.height-1;y>=0;y--){
  for(let x=0;x<img.width;x++)if(data[(y*img.width+x)*4+3]>=18)return img.height-1-y;
 }
 return 0;
}

function guessFrames(img:Img){
 const ratio=img.width/Math.max(1,img.height);
 if(ratio>3.2)return 8;
 if(ratio>2.15)return 6;
 if(ratio>1.25)return 4;
 return 1;
}

function gridOf(img:Img,forced?:number){
 if(forced===16)return {cols:4,rows:4};
 if(forced)return {cols:forced,rows:1};
 const ratio=img.width/Math.max(1,img.height);
 if(ratio>0.82&&ratio<1.22)return {cols:4,rows:4};
 return {cols:guessFrames(img),rows:1};
}

function flipH(img:HTMLCanvasElement){
 const out=canvas(img.width,img.height),g=out.getContext('2d')!;
 g.translate(img.width,0);g.scale(-1,1);g.drawImage(img,0,0);
 return out;
}

function packCells(sources:Img[],forced?:number,mirror=false):Sheet{
 const cells:HTMLCanvasElement[]=[];
 for(const src of sources){
  const keyed=src instanceof HTMLImageElement?keyBg(src):src;
  const grid=gridOf(keyed,forced);
  const fw=keyed.width/grid.cols,fh=keyed.height/grid.rows;
  for(let r=0;r<grid.rows;r++){
   for(let c=0;c<grid.cols;c++){
    const sx=Math.floor(c*fw),sy=Math.floor(r*fh);
    const cw=Math.ceil(fw),ch=Math.ceil(fh);
    const cell=canvas(cw,ch);
    cell.getContext('2d')!.drawImage(keyed,sx,sy,cw,ch,0,0,cw,ch);
    cells.push(mirror?flipH(cell):cell);
   }
  }
 }
 if(!cells.length)return {img:canvas(8,8),frames:1,pad:0};
 const maxW=Math.max(...cells.map(c=>c.width));
 const maxH=Math.max(...cells.map(c=>c.height));
 const strip=canvas(maxW*cells.length,maxH);
 const g=strip.getContext('2d')!;
 cells.forEach((cell,i)=>{
  g.drawImage(cell,i*maxW+(maxW-cell.width)/2,maxH-cell.height);
 });
 const pad=Math.min(...cells.map(bottomPad));
 return {img:strip,frames:cells.length,pad};
}

function interleave(a:Sheet,b:Sheet):Sheet{
 const n=Math.min(a.frames,b.frames);
 const cells:HTMLCanvasElement[]=[];
 const take=(sheet:Sheet,i:number)=>{
  const fw=sheet.img.width/sheet.frames;
  const cell=canvas(fw,sheet.img.height);
  cell.getContext('2d')!.drawImage(sheet.img,i*fw,0,fw,sheet.img.height,0,0,fw,sheet.img.height);
  return cell;
 };
 for(let i=0;i<n;i++){cells.push(take(a,i));cells.push(take(b,i));}
 const maxW=Math.max(...cells.map(c=>c.width));
 const maxH=Math.max(...cells.map(c=>c.height));
 const strip=canvas(maxW*cells.length,maxH);
 const g=strip.getContext('2d')!;
 cells.forEach((cell,i)=>g.drawImage(cell,i*maxW+(maxW-cell.width)/2,maxH-cell.height));
 return {img:strip,frames:cells.length,pad:Math.min(a.pad,b.pad)};
}

function blit(c:CanvasRenderingContext2D,sheet:Sheet,clock:number,fps:number,dw:number,dh:number){
 const n=Math.max(1,sheet.frames);
 const i=Math.floor(clock*fps)%n;
 const fw=sheet.img.width/n,fh=sheet.img.height;
 const srcH=Math.max(1,fh-(sheet.pad??0));
 c.drawImage(sheet.img,i*fw,0,fw,srcH,-dw/2,-dh,dw,dh);
}

function bar(c:CanvasRenderingContext2D,x:number,y:number,ratio:number,wide=52){
 const w=wide,h=8;
 c.fillStyle='#0c1010ee';c.fillRect(x-w/2-2,y-2,w+4,h+4);
 c.fillStyle='#2a1814';c.fillRect(x-w/2,y,w,h);
 c.fillStyle='#ef3a2c';c.fillRect(x-w/2,y,w*Math.max(0,Math.min(1,ratio)),h);
 c.strokeStyle='#fff6d8';c.lineWidth=1.6;c.strokeRect(x-w/2-2,y-2,w+4,h+4);
}

export class EnemyArt {
 ready=false;
 nangong=new NangongArt();
 hive=new HiveArt();
 imgs:{cap:Img;spore:Img;vine:Img}={cap:paintCap(),spore:paintSpore(),vine:paintVine()};
 sheets:{idle:Sheet;walk:Sheet;castPig:Sheet;castMelon:Sheet;ult:Sheet;hurt:Sheet;pig:Sheet;melon:Sheet;chase:Sheet;melee:Sheet;pigRun:Sheet;pigAttack:Sheet}={
  idle:paintGirl(),walk:paintGirl(),castPig:paintGirl(),
  castMelon:paintGirl(),ult:paintGirl(),hurt:paintGirl(),
  pig:paintPig(),melon:paintPig(),chase:paintGirl(),melee:paintGirl(),
  pigRun:paintPig(),pigAttack:paintPig(),
 };
 constructor(){void this.hydrate();}
 async hydrate(){
  const [cap,spore,vine]=await Promise.all([
   optional(asset('assets/enemies/cap.png')),optional(asset('assets/enemies/spore.png')),optional(asset('assets/enemies/vine.png')),
  ]);
  if(cap)this.imgs.cap=cap;
  if(spore)this.imgs.spore=spore;
  if(vine)this.imgs.vine=vine;
  const take=async(name:string,extra?:string)=>{
   const a=await optional(asset(`assets/boss/picnic-${name}.png`));
   if(!a)return;
   const mirror=name!=='pig'&&name!=='melon';
   const main=packCells([a],undefined,mirror);
   if(!extra)return main;
   const b=await optional(asset(`assets/boss/picnic-${extra}.png`));
   return b?interleave(main,packCells([b],undefined,mirror)):main;
  };
  const [pig,pigRun,pigAttack]=await Promise.all([
   take('pig','pig-b'),take('pig-run'),take('pig-attack'),
  ]);
  if(pig)this.sheets.pig=pig;
  if(pigRun)this.sheets.pigRun=pigRun;
  if(pigAttack)this.sheets.pigAttack=pigAttack;
  if(!pigRun&&pig)this.sheets.pigRun=pig;
  if(!pigAttack&&pig)this.sheets.pigAttack=pig;
  this.ready=!!(pig||pigRun||this.nangong.ready);
 }
 private picnicSheet(actor:Actor){
  if(actor.state==='hurt'||actor.invuln>0)return this.sheets.hurt;
  const striking=actor.skill<0&&(actor.state==='telegraph'||actor.state==='attack'||actor.state==='recover');
  if(striking)return this.sheets.melee;
  if(actor.state==='telegraph'||actor.state==='attack'){
   const skill=ENEMIES.picnic.skills[Math.max(0,actor.skill)%ENEMIES.picnic.skills.length];
   if(skill.kind==='ult')return this.sheets.ult;
   return this.sheets.castMelon;
  }
  if(actor.state==='chase'||actor.state==='alert'||actor.state==='recover')return this.sheets.chase;
  if(actor.state==='patrol')return this.sheets.walk;
  return this.sheets.idle;
 }
 private picnicClock(actor:Actor,time:number){
  if(actor.skill<0&&(actor.state==='telegraph'||actor.state==='attack'||actor.state==='recover')){
   const melee=ENEMIES.picnic.melee!,hit=.45;
   let t=0;
   if(actor.state==='telegraph')t=melee.telegraph-actor.timer;
   else if(actor.state==='attack')t=melee.telegraph+(hit-actor.timer);
   else t=melee.telegraph+hit+(melee.recover-actor.timer);
   return Math.max(0,t);
  }
  return time;
 }
 private picnicRate(actor:Actor){
  if(actor.skill<0&&(actor.state==='telegraph'||actor.state==='attack'||actor.state==='recover')){
   const melee=ENEMIES.picnic.melee!;
   return 16/(melee.telegraph+.45+melee.recover);
  }
  if(actor.state==='chase'||actor.state==='alert')return 12;
  if(actor.state==='patrol')return 11;
  if(actor.state==='telegraph'||actor.state==='attack')return 8;
  return 5;
 }
 draw(c:CanvasRenderingContext2D,actors:Actor[],camera:number,time:number,playerX?:number){
  for(const actor of actors){
   if(actor.dead&&actor.state!=='dying')continue;
   if(actor.kind==='picnic'){
    this.nangong.approach(actor.x,camera);
    if(!this.nangong.onScreen(actor.x,camera))continue;
   }
   if(actor.kind==='hive'){
    this.hive.approach(actor.x,camera);
    if(!this.hive.onScreen(actor.x,camera))continue;
   }
   const telegraph=actor.state==='telegraph',attack=actor.state==='attack',hurt=actor.invuln>0;
   const x=actor.x-camera,y=actor.y;
   const boss=actor.kind==='picnic'||actor.kind==='hive';
   c.save();c.translate(x,y+2);
   c.fillStyle='#1a1410aa';c.beginPath();c.ellipse(0,4,boss?22:16,5,0,0,Math.PI*2);c.fill();
   if(telegraph){
    const pulse=.65+.35*Math.abs(Math.sin(time*16));
    c.strokeStyle=`rgba(255,50,40,${pulse})`;c.lineWidth=3;
    c.beginPath();c.arc(0,-actor.h*.45,boss?46:30,0,Math.PI*2);c.stroke();
    c.fillStyle=`rgba(255,40,32,${pulse})`;c.font='bold 22px sans-serif';c.textAlign='center';
    c.fillText('!',0,-actor.h-28);
   }
   const striking=telegraph||attack||(actor.state==='recover'&&actor.skill<0);
   const look=striking||Math.abs(actor.vx)<=8?(actor.facing||1):(actor.vx>0?1:-1);
   if(actor.kind==='picnic'){
    if(hurt)c.filter='sepia(1) saturate(8) hue-rotate(-30deg) brightness(1.1)';
    if(!this.nangong.draw(c,actor,time,look)){
     const sheet=this.picnicSheet(actor);
     const cellW=sheet.img.width/sheet.frames,srcH=Math.max(1,sheet.img.height-(sheet.pad??0));
     const aspect=cellW/srcH;
     const dh=132,dw=Math.max(52,Math.min(88,dh*aspect));
     c.scale(look,1);
     blit(c,sheet,this.picnicClock(actor,time),this.picnicRate(actor),dw,dh);
    }
   }else if(actor.kind==='hive'){
    if(hurt)c.filter='sepia(1) saturate(8) hue-rotate(-30deg) brightness(1.1)';
    if(!this.hive.draw(c,actor,time,look)){
     const sheet=this.picnicSheet(actor);
     const cellW=sheet.img.width/sheet.frames,srcH=Math.max(1,sheet.img.height-(sheet.pad??0));
     const aspect=cellW/srcH;
     const dh=132,dw=Math.max(52,Math.min(88,dh*aspect));
     c.scale(look,1);
     blit(c,sheet,this.picnicClock(actor,time),this.picnicRate(actor),dw,dh);
    }
   }else if(actor.kind==='pig'){
    const sheet=telegraph||attack?this.sheets.pigAttack:this.sheets.pigRun;
    const cellW=sheet.img.width/sheet.frames,srcH=Math.max(1,sheet.img.height-(sheet.pad??0));
    const aspect=cellW/srcH;
    const dh=36,dw=Math.max(50,Math.min(76,dh*aspect));
    c.scale(look,1);
    if(hurt)c.filter='sepia(1) saturate(8) hue-rotate(-30deg) brightness(1.1)';
    blit(c,sheet,time,16,dw,dh);
   }else{
    const img=this.imgs[actor.kind as keyof typeof this.imgs]??this.imgs.cap;
    c.scale(actor.facing*1.4,1.4);
    if(hurt)c.filter='sepia(1) saturate(12) hue-rotate(-40deg) brightness(1.15)';
    else if(telegraph)c.filter='brightness(1.4) saturate(1.5)';
    c.drawImage(img,-img.width/2,-img.height+6,img.width,img.height);
   }
   c.restore();c.filter='none';
   bar(c,x,y-(boss?148:actor.h+18),actor.hp/Math.max(1,actor.maxHp),boss?92:52);
  }
 }
 drawStakes(c:CanvasRenderingContext2D,stakes:StakeSpot[],camera:number){
  for(const stake of stakes){
   if(stake.hp<=0)continue;
   const x=stake.x-camera,y=stake.y,cx=x+stake.w/2;
   c.fillStyle='#1a1410aa';c.beginPath();c.ellipse(cx,y+stake.h+2,22,6,0,0,Math.PI*2);c.fill();
   c.fillStyle='#2a1c10';c.fillRect(cx-7,y+4,14,stake.h);
   c.fillStyle='#6a4220';c.fillRect(cx-5,y+6,10,stake.h-4);
   c.fillStyle='#1d2a16';c.beginPath();c.ellipse(cx,y+2,22,16,0,0,Math.PI*2);c.fill();
   c.fillStyle='#e07a3a';c.beginPath();c.ellipse(cx,y,20,14,0,0,Math.PI*2);c.fill();
   c.fillStyle='#1a2430';c.beginPath();c.arc(cx-6,y-2,2.4,0,Math.PI*2);c.arc(cx+6,y-2,2.4,0,Math.PI*2);c.fill();
   c.fillStyle='#fff8e8';c.beginPath();c.arc(cx-6.6,y-2.8,.8,0,Math.PI*2);c.arc(cx+5.4,y-2.8,.8,0,Math.PI*2);c.fill();
   c.strokeStyle='#c84a28';c.lineWidth=2;c.beginPath();c.moveTo(cx-5,y+6);c.lineTo(cx+5,y+10);c.stroke();
   bar(c,cx,y-28,stake.hp/stake.maxHp);
  }
 }
}
