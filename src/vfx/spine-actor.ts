import {
 AnimationState,AnimationStateData,AssetManager,AtlasAttachmentLoader,Physics,SceneRenderer,Skeleton,SkeletonData,SkeletonJson,Vector2,
} from '@esotericsoftware/spine-webgl';
import type {MeshAttachment,RegionAttachment,Skin} from '@esotericsoftware/spine-webgl';

type Sequence=Parameters<AtlasAttachmentLoader['newRegionAttachment']>[3];
import type {Actor} from '../actor/actor';
import {W} from '../art';
import {asset} from '../asset';

const MARGIN=80;
const PAGE=480;
const FOOT_Y=440;
const LOOPS=new Set(['idle','walk','run']);

export type SpineSpec={
 dir:string;
 atlas:string;
 json:string;
 scale:number;
 draw:number;
 pma?:boolean;
 human?:boolean;
 anim:(actor:Actor)=>string;
}

type GpuPage={
 page:HTMLCanvasElement;
 gl:WebGLRenderingContext;
 renderer:SceneRenderer;
 assets?:AssetManager;
}

const beastPool:{slot?:GpuPage;boot?:Promise<GpuPage|undefined>}={};
let beastGate:Promise<void>=Promise.resolve();
let gpu:boolean|undefined;

function gpuOk(){
 if(gpu!==undefined)return gpu;
 if(typeof document==='undefined'){gpu=false;return gpu;}
 const probe=document.createElement('canvas');
 const gl=probe.getContext('webgl',{failIfMajorPerformanceCaveat:true})??probe.getContext('webgl');
 if(!gl){gpu=false;return gpu;}
 const info=gl.getExtension('WEBGL_debug_renderer_info');
 const name=info?String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)):'';
 gl.getExtension('WEBGL_lose_context')?.loseContext();
 gpu=!/swiftshader|llvmpipe|software|microsoft basic/i.test(name);
 return gpu;
}

function beastPage(){
 if(beastPool.slot)return Promise.resolve(beastPool.slot);
 if(beastPool.boot)return beastPool.boot;
 beastPool.boot=(async()=>{
  const page=document.createElement('canvas');
  page.width=PAGE;page.height=PAGE;
  const gl=page.getContext('webgl',{preserveDrawingBuffer:true,alpha:true,premultipliedAlpha:true,antialias:true});
  if(!gl)return undefined;
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
  const renderer=new SceneRenderer(page,gl);
  renderer.camera.position.x=PAGE/2;
  renderer.camera.position.y=PAGE/2;
  renderer.camera.setViewport(PAGE,PAGE);
  const slot:GpuPage={page,gl,renderer,assets:new AssetManager(gl,asset('assets/spine/'))};
  beastPool.slot=slot;
  return slot;
 })();
 return beastPool.boot;
}

async function readSpine(gl:WebGLRenderingContext,atlasFile:string,jsonFile:string){
 const assets=new AssetManager(gl,asset('assets/spine/'));
 assets.loadTextureAtlas(atlasFile);
 assets.loadJson(jsonFile);
 await assets.loadAll();
 if(assets.hasErrors())throw new Error('spine');
 return {atlas:assets.require(atlasFile),raw:assets.require(jsonFile)};
}

/** Soonjy 角色共用一份模板骨架；图集缺的部件（发型、翅膀等）直接跳过，不让整只角色加载失败。 */
class LenientLoader extends AtlasAttachmentLoader {
 newRegionAttachment(skin:Skin,name:string,path:string,sequence:Sequence){
  try{return super.newRegionAttachment(skin,name,path,sequence);}catch{return null as unknown as RegionAttachment;}
 }
 newMeshAttachment(skin:Skin,name:string,path:string,sequence:Sequence){
  try{return super.newMeshAttachment(skin,name,path,sequence);}catch{return null as unknown as MeshAttachment;}
 }
}

type Json=Record<string,any>;

/** 把图集里没有的部件（及依赖它们的 linkedmesh、变形轨道）从模板骨架里剔掉，返回新对象。 */
function prune(raw:Json,atlas:{regions:{name:string}[]}):Json {
 const have=new Set(atlas.regions.map(r=>r.name));
 const out:Json=JSON.parse(JSON.stringify(raw));
 const dropped=new Set<string>();
 const key=(slot:string,name:string)=>`${slot}\u0000${name}`;
 for(const skin of out.skins??[]){
  const slots:Json=skin.attachments??{};
  let changed=true;
  while(changed){
   changed=false;
   for(const [slot,entries] of Object.entries<Json>(slots)){
    for(const [name,att] of Object.entries<Json>(entries)){
     const type=att.type??'region';
     let dead=false;
     if(type==='region'||type==='mesh')dead=!have.has(att.path??name);
     else if(type==='linkedmesh')dead=!have.has(att.path??name)||dropped.has(key(slot,att.parent));
     if(dead){delete entries[name];dropped.add(key(slot,name));changed=true;}
    }
   }
  }
 }
 if(!dropped.size)return raw;
 for(const anim of Object.values<Json>(out.animations??{})){
  for(const [skinName,slots] of Object.entries<Json>(anim.attachments??{})){
   for(const [slot,entries] of Object.entries<Json>(slots)){
    for(const name of Object.keys(entries))if(dropped.has(key(slot,name)))delete entries[name];
    if(!Object.keys(entries).length)delete slots[slot];
   }
   if(!Object.keys(slots).length)delete anim.attachments[skinName];
  }
 }
 return out;
}

function bind(spec:SpineSpec,loaded:{atlas:ReturnType<AssetManager['require']>;raw:ReturnType<AssetManager['require']>}){
 const parsed=new SkeletonJson(new LenientLoader(loaded.atlas)).readSkeletonData(prune(loaded.raw,loaded.atlas));
 const state=new AnimationState(new AnimationStateData(parsed));
 state.data.defaultMix=.12;
 const skeleton=new Skeleton(parsed);
 Skeleton.yDown=false;
 if(parsed.findSkin('default'))skeleton.setSkinByName('default');
 skeleton.setSlotsToSetupPose();
 skeleton.scaleX=spec.scale;
 skeleton.scaleY=spec.scale;
 if(parsed.findAnimation('idle'))state.setAnimation(0,'idle',true);
 state.apply(skeleton);
 skeleton.updateWorldTransform(Physics.none);
 const offset=new Vector2(),size=new Vector2();
 skeleton.getBounds(offset,size,[]);
 const crown=Math.max(24,(offset.y+size.y)*spec.draw/PAGE);
 return {parsed,state,skeleton,anim:'idle',crown};
}

const PROBE=96;
let probe:CanvasRenderingContext2D|undefined;
/** 从渲染页里量第一行不透明像素，得到真实头顶（页坐标，y 向下）。空部件不计入。 */
function topRow(page:HTMLCanvasElement){
 if(!probe){
  const cv=document.createElement('canvas');cv.width=PROBE;cv.height=PROBE;
  probe=cv.getContext('2d',{willReadFrequently:true})??undefined;
  if(!probe)return undefined;
 }
 probe.clearRect(0,0,PROBE,PROBE);
 probe.drawImage(page,0,0,PROBE,PROBE);
 const px=probe.getImageData(0,0,PROBE,PROBE).data;
 for(let y=0;y<PROBE;y++)for(let x=0;x<PROBE;x++)if(px[(y*PROBE+x)*4+3]>12)return y*PAGE/PROBE;
 return undefined;
}

export class SpineActor {
 ready=false;
 private loading=false;
 failed=false;
 private skeleton?:Skeleton;
 private anim?:AnimationState;
 private data?:SkeletonData;
 private lastAnim='';
 private lastTime=0;
 private own?:GpuPage;
 private top?:number;
 private measured=false;
 constructor(private spec:SpineSpec){}
 /** 头顶到脚底的屏幕像素高度（待机姿势），未加载完返回 undefined。 */
 crown(){return this.ready?this.top:undefined;}
 onScreen(x:number,camera:number){
  return x>=camera-MARGIN&&x<=camera+W+MARGIN;
 }
 approach(x:number,camera:number){
  if(this.ready||this.loading||this.failed)return;
  if(x>camera+W+MARGIN)return;
  if(!gpuOk()){this.failed=true;return;}
  void this.hydrate();
 }
 private async hydrate(){
  this.loading=true;
  try{
   if(this.spec.human)await this.hydrateHuman();
   else{
    const run=beastGate.then(()=>this.hydrateBeast());
    beastGate=run.then(()=>undefined,()=>undefined);
    await run;
   }
  }catch{this.failed=true;}
  finally{this.loading=false;}
 }
 private async hydrateHuman(){
  const spec=this.spec;
  const page=document.createElement('canvas');
  page.width=PAGE;page.height=PAGE;
  const gl=page.getContext('webgl',{preserveDrawingBuffer:true,alpha:true,premultipliedAlpha:false,antialias:true});
  if(!gl){this.failed=true;return;}
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
  const atlasPath=`${spec.dir}${spec.atlas}`;
  const jsonPath=`${spec.dir}${spec.json}`;
  let loaded:{atlas:ReturnType<AssetManager['require']>;raw:ReturnType<AssetManager['require']>};
  try{loaded=await readSpine(gl,atlasPath,jsonPath);}
  catch{
   try{loaded=await readSpine(gl,'soon-2061.atlas','soon-2061.json');}
   catch{this.failed=true;return;}
  }
  const bound=bind(spec,loaded);
  const renderer=new SceneRenderer(page,gl);
  renderer.camera.position.x=PAGE/2;
  renderer.camera.position.y=PAGE/2;
  renderer.camera.setViewport(PAGE,PAGE);
  this.data=bound.parsed;
  this.skeleton=bound.skeleton;
  this.anim=bound.state;
  this.lastAnim=bound.anim;
  this.top=bound.crown;
  this.own={page,gl,renderer};
  this.ready=true;
 }
 private async hydrateBeast(){
  const spec=this.spec;
  const gpuPage=await beastPage();
  if(!gpuPage?.assets){this.failed=true;return;}
  const atlasPath=`${spec.dir}${spec.atlas}`;
  const jsonPath=`${spec.dir}${spec.json}`;
  gpuPage.assets.loadTextureAtlas(atlasPath);
  gpuPage.assets.loadJson(jsonPath);
  await gpuPage.assets.loadAll();
  if(gpuPage.assets.hasErrors()){this.failed=true;return;}
  const bound=bind(spec,{atlas:gpuPage.assets.require(atlasPath),raw:gpuPage.assets.require(jsonPath)});
  this.data=bound.parsed;
  this.skeleton=bound.skeleton;
  this.anim=bound.state;
  this.lastAnim=bound.anim;
  this.top=bound.crown;
  this.ready=true;
 }
 private play(name:string){
  if(!this.anim||!this.data)return;
  const pick=this.data.findAnimation(name)?name:this.data.findAnimation('idle')?'idle':undefined;
  if(!pick||pick===this.lastAnim)return;
  this.anim.setAnimation(0,pick,LOOPS.has(pick));
  this.lastAnim=pick;
 }
 draw(c:CanvasRenderingContext2D,actor:Actor,time:number,look:number){
  const gpuPage=this.own??beastPool.slot;
  if(this.failed||!this.ready||!this.skeleton||!this.anim||!gpuPage)return false;
  const spec=this.spec;
  const dt=this.lastTime?Math.min(.05,Math.max(0,time-this.lastTime)):0;
  this.lastTime=time;
  this.play(spec.anim(actor));
  this.anim.update(dt);
  this.anim.apply(this.skeleton);
  this.skeleton.x=PAGE/2;
  this.skeleton.y=PAGE-FOOT_Y;
  this.skeleton.scaleX=look*spec.scale;
  this.skeleton.scaleY=spec.scale;
  this.skeleton.updateWorldTransform(Physics.none);
  try{
   const {gl,page,renderer}=gpuPage;
   renderer.camera.position.x=PAGE/2;
   renderer.camera.position.y=PAGE/2;
   gl.viewport(0,0,PAGE,PAGE);
   gl.clearColor(0,0,0,0);
   gl.clear(gl.COLOR_BUFFER_BIT);
   renderer.begin();
   renderer.drawSkeleton(this.skeleton,false);
   renderer.end();
   const d=spec.draw;
   if(!this.measured&&this.lastAnim==='idle'){
    const y=topRow(page);
    if(y!==undefined){this.top=Math.max(24,(FOOT_Y-y)*d/PAGE);this.measured=true;}
   }
   c.drawImage(page,-d/2,-d*FOOT_Y/PAGE,d,d);
   return true;
  }catch{return false;}
 }
}
