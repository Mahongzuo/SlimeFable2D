import {
 AnimationState,
 AnimationStateData,
 AssetManager,
 AtlasAttachmentLoader,
 Physics,
 SceneRenderer,
 Skeleton,
 SkeletonData,
 SkeletonJson,
} from '@esotericsoftware/spine-webgl';
import type {Actor} from '../actor/actor';
import {ENEMIES} from '../ai/machine';
import {W} from '../art';
import {asset} from '../asset';

const SCALE=.62;
const MARGIN=80;
const PAGE=480;
const VIEW=240;
const FOOT_X=240;
const FOOT_Y=440;
const LOOPS=new Set(['idle','walk','run']);

function hiveAnim(actor:Actor){
 if(actor.state==='dying'||actor.state==='dead')return 'die';
 if(actor.state==='dodge')return 'roll';
 if(actor.state==='hop')return 'jumping2nd';
 if(actor.state==='hurt')return 'hurt';
 if(actor.state==='telegraph'||actor.state==='attack'||actor.state==='recover'){
  if(actor.skill<0)return 'weaponskill07_1';
  const skill=ENEMIES.hive.skills[Math.max(0,actor.skill)%ENEMIES.hive.skills.length];
  if(skill.kind==='bow')return 'weaponskill02_1';
  if(skill.kind==='magic')return 'weaponskill05_1';
  return 'weaponskill07_1';
 }
 if(actor.state==='chase'||actor.state==='alert')return 'run';
 if(actor.state==='patrol')return 'walk';
 return 'idle';
}

function gpuOk(){
 if(typeof document==='undefined')return false;
 const probe=document.createElement('canvas');
 const gl=probe.getContext('webgl',{failIfMajorPerformanceCaveat:true})??probe.getContext('webgl');
 if(!gl)return false;
 const info=gl.getExtension('WEBGL_debug_renderer_info');
 const name=info?String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)):'';
 gl.getExtension('WEBGL_lose_context')?.loseContext();
 return !/swiftshader|llvmpipe|software|microsoft basic/i.test(name);
}

export class HiveArt {
 ready=false;
 private loading=false;
 private failed=false;
 private skeleton?:Skeleton;
 private anim?:AnimationState;
 private data?:SkeletonData;
 private renderer?:SceneRenderer;
 private gl?:WebGLRenderingContext;
 private page?:HTMLCanvasElement;
 private lastAnim='';
 private lastTime=0;
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
   const page=document.createElement('canvas');
   page.width=PAGE;page.height=PAGE;
   const gl=page.getContext('webgl',{preserveDrawingBuffer:true,alpha:true,premultipliedAlpha:false,antialias:true});
   if(!gl){this.failed=true;return;}
   gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
   const assets=new AssetManager(gl,asset('assets/spine/'));
   assets.loadTextureAtlas('soon-2061.atlas');
   assets.loadJson('soon-2061.json');
   await assets.loadAll();
   if(assets.hasErrors()){this.failed=true;return;}
   const atlas=assets.require('soon-2061.atlas');
   const raw=assets.require('soon-2061.json');
   const parsed=new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(raw);
   const state=new AnimationState(new AnimationStateData(parsed));
   state.data.defaultMix=.12;
   const skeleton=new Skeleton(parsed);
   Skeleton.yDown=false;
   if(parsed.findSkin('default'))skeleton.setSkinByName('default');
   skeleton.setSlotsToSetupPose();
   skeleton.scaleX=SCALE;
   skeleton.scaleY=SCALE;
   if(parsed.findAnimation('idle')){
    state.setAnimation(0,'idle',true);
    this.lastAnim='idle';
   }
   state.apply(skeleton);
   skeleton.updateWorldTransform(Physics.none);
   const renderer=new SceneRenderer(page,gl);
   renderer.camera.position.x=FOOT_X;
   renderer.camera.position.y=PAGE/2;
   renderer.camera.setViewport(PAGE,PAGE);
   this.data=parsed;
   this.skeleton=skeleton;
   this.anim=state;
   this.renderer=renderer;
   this.gl=gl;
   this.page=page;
   this.ready=true;
  }catch{this.failed=true;}
  finally{this.loading=false;}
 }
 private play(name:string){
  if(!this.anim||!this.data)return;
  const pick=this.data.findAnimation(name)?name:this.data.findAnimation('idle')?'idle':undefined;
  if(!pick||pick===this.lastAnim)return;
  this.anim.setAnimation(0,pick,LOOPS.has(pick));
  this.lastAnim=pick;
 }
 draw(c:CanvasRenderingContext2D,actor:Actor,time:number,look:number){
  if(this.failed||!this.ready||!this.skeleton||!this.anim||!this.renderer||!this.gl||!this.page)return false;
  const dt=this.lastTime?Math.min(.05,Math.max(0,time-this.lastTime)):0;
  this.lastTime=time;
  this.play(hiveAnim(actor));
  this.anim.update(dt);
  this.anim.apply(this.skeleton);
  this.skeleton.x=FOOT_X;
  this.skeleton.y=PAGE-FOOT_Y;
  this.skeleton.scaleX=look*SCALE;
  this.skeleton.scaleY=SCALE;
  this.skeleton.updateWorldTransform(Physics.none);
  try{
   const gl=this.gl;
   gl.viewport(0,0,PAGE,PAGE);
   gl.clearColor(0,0,0,0);
   gl.clear(gl.COLOR_BUFFER_BIT);
   this.renderer.begin();
   this.renderer.drawSkeleton(this.skeleton,false);
   this.renderer.end();
   c.drawImage(this.page,-VIEW/2,-220,VIEW,VIEW);
   return true;
  }catch{return false;}
 }
}
