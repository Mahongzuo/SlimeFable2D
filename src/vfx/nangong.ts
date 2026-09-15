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

const SCALE=.31;
const MARGIN=80;
const PAGE=240;
const FOOT_X=120;
const FOOT_Y=220;
const LOOPS=new Set(['idle','walk','run']);

function picnicAnim(actor:Actor){
 if(actor.state==='dying'||actor.state==='dead')return 'die';
 if(actor.state==='dodge')return 'roll';
 if(actor.state==='hop')return 'jumping2nd';
 if(actor.state==='hurt'||actor.invuln>0)return 'hurt';
 const striking=actor.skill<0&&(actor.state==='telegraph'||actor.state==='attack'||actor.state==='recover');
 if(striking)return 'weaponskill07_1';
 if(actor.state==='telegraph'||actor.state==='attack'){
  const skill=ENEMIES.picnic.skills[Math.max(0,actor.skill)%ENEMIES.picnic.skills.length];
  if(skill.kind==='ult')return 'weaponskill05_123';
  return 'weaponskill05_1';
 }
 if(actor.state==='chase'||actor.state==='alert'||actor.state==='recover')return 'run';
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

export class NangongArt {
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
   const gl=page.getContext('webgl',{preserveDrawingBuffer:true,alpha:true,premultipliedAlpha:true});
   if(!gl){this.failed=true;return;}
   const assets=new AssetManager(gl,asset('assets/spine/'));
   assets.loadTextureAtlas('nangong.atlas');
   assets.loadJson('nangong.json');
   await assets.loadAll();
   if(assets.hasErrors()){this.failed=true;return;}
   const atlas=assets.require('nangong.atlas');
   const raw=assets.require('nangong.json');
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
  this.play(picnicAnim(actor));
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
   c.drawImage(this.page,-FOOT_X,-FOOT_Y);
   return true;
  }catch{return false;}
 }
}
