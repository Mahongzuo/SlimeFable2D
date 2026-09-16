import {asset} from '../asset';

export type Cue=
 |'slash'|'spit'|'hurt'|'die'|'swallow'|'splash'|'swim'|'grass'|'dew'|'jump'|'land'|'dodge'
 |'summon'|'melon'|'smash'|'ult'|'step'|'howl'|'charge'|'parry'|'hawk'|'drain'|'dragon'

const FILES:Record<string,string>={
 slash:'/assets/audio/sfx/attack.ogg',
 spit:'/assets/audio/sfx/shot.ogg',
 hurt:'/assets/audio/sfx/soon/hit.mp3',
 die:'/assets/audio/sfx/death.ogg',
 swallow:'/assets/audio/sfx/ue-swallow.ogg',
 splash:'/assets/audio/sfx/water-in.ogg',
 swim:'/assets/audio/sfx/water-loop.ogg',
 grass:'/assets/audio/sfx/grass.ogg',
 dew:'/assets/audio/sfx/pickup.ogg',
 jump:'/assets/audio/sfx/jump-jelly.ogg',
 land:'/assets/audio/sfx/landing.ogg',
 dodge:'/assets/audio/sfx/dodge.ogg',
 summon:'/assets/audio/sfx/call.ogg',
 melon:'/assets/audio/sfx/soon/ranged.mp3',
 smash:'/assets/audio/sfx/smash.ogg',
 ult:'/assets/audio/sfx/soon/magic.mp3',
 step:'/assets/audio/sfx/ue-crawl.ogg',
 howl:'/assets/audio/sfx/call.ogg',
 charge:'/assets/audio/sfx/smash.ogg',
 parry:'/assets/audio/sfx/attack.ogg',
 hawk:'/assets/audio/sfx/soon/ranged.mp3',
 drain:'/assets/audio/sfx/soon/magic.mp3',
 dragon:'/assets/audio/sfx/soon/magic.mp3',
};

const GAP:Partial<Record<Cue,number>>={step:.04,swim:.04,grass:.28,land:.18,slash:.12,jump:.18,swallow:.35,die:.4,dew:.22};

export class AudioBus {
 enabled=false;
 sfxVol=.85;
 musicVol=.7;
 private ctx?:AudioContext;
 private master?:GainNode;
 private music?:GainNode;
 private sfx?:GainNode;
 private buffers=new Map<string,AudioBuffer>();
 private last:Record<string,number>={};
 private bgmName='';
 private bgmSrc?:AudioBufferSourceNode;
 private bgmGain?:GainNode;
 private ambient?:AudioBufferSourceNode;
 private loading=false;
 private wantBgm:'explore'|'boss'|'none'|''='';
 private wantSoft=false;
 private crawl?:{src:AudioBufferSourceNode;gain:GainNode};
 private crawlTimer?:number;
 private swim?:{src:AudioBufferSourceNode;gain:GainNode};
 private swimTimer?:number;
 private bgmEl?:HTMLAudioElement;
 private readonly bgmUrl=asset('assets/audio/bgm/slime.ogg');

 async setEnabled(on:boolean){
  if(on){
   if(!this.ctx){
    this.ctx=new AudioContext();
    this.master=this.ctx.createGain();this.master.gain.value=1;this.master.connect(this.ctx.destination);
    this.music=this.ctx.createGain();this.music.connect(this.master);
    this.sfx=this.ctx.createGain();this.sfx.connect(this.master);
    this.applyGain();
    this.enabled=true;
    this.loading=true;
    await this.hydrate();
    this.loading=false;
    this.startAmbient();
   }
   this.enabled=true;
   await this.ctx.resume();
   if(this.wantBgm)this.setBgm(this.wantBgm,this.wantSoft);
  }else{
   this.enabled=false;
   if(this.crawlTimer)window.clearTimeout(this.crawlTimer);
   this.crawl?.src.stop();this.crawl=undefined;this.crawlTimer=undefined;
   if(this.swimTimer)window.clearTimeout(this.swimTimer);
   this.swim?.src.stop();this.swim=undefined;this.swimTimer=undefined;
   this.bgmEl?.pause();
   await this.ctx?.suspend();
  }
 }

 private async hydrate(){
  await Promise.all(Object.entries(FILES).map(async([key,url])=>{
   try{
    const res=await fetch(asset(url));
    if(!res.ok)return;
    const buf=await this.ctx!.decodeAudioData(await res.arrayBuffer());
    this.buffers.set(key,buf);
   }catch{/* synth fallback */}
  }));
 }

 play(name:Cue){
  if(!this.enabled||!this.ctx||!this.sfx)return;
  const now=this.ctx.currentTime;
  if((this.last[name]??-9)+ (GAP[name]??.04)>now)return;
  this.last[name]=now;
  const clip=this.buffers.get(name);
  if(name==='step'&&clip){this.holdCrawl(clip);return;}
  if(name==='swim'&&clip){this.holdLoop('swim',clip,.42,280);return;}
  if(clip){
   const src=this.ctx.createBufferSource();src.buffer=clip;
   const g=this.ctx.createGain();g.gain.value=name==='jump'||name==='swallow'||name==='slash'?1.15:.9;
   src.connect(g);g.connect(this.sfx);src.start();
   return;
  }
  if(this.loading)return;
  this.synth(name);
 }

 private holdCrawl(clip:AudioBuffer){this.holdLoop('crawl',clip,.55,220);}

 private holdLoop(kind:'crawl'|'swim',clip:AudioBuffer,vol:number,hold:number){
  if(!this.ctx||!this.sfx)return;
  const cur=kind==='crawl'?this.crawl:this.swim;
  if(!cur){
   const src=this.ctx.createBufferSource();src.buffer=clip;src.loop=true;
   const g=this.ctx.createGain();g.gain.value=vol;
   src.connect(g);g.connect(this.sfx);src.start();
   if(kind==='crawl')this.crawl={src,gain:g};
   else this.swim={src,gain:g};
  }
  const timer=kind==='crawl'?this.crawlTimer:this.swimTimer;
  if(timer)window.clearTimeout(timer);
  const clear=()=>{
   if(kind==='crawl'){this.crawl?.src.stop();this.crawl=undefined;this.crawlTimer=undefined;}
   else {this.swim?.src.stop();this.swim=undefined;this.swimTimer=undefined;}
  };
  if(kind==='crawl')this.crawlTimer=window.setTimeout(clear,hold);
  else this.swimTimer=window.setTimeout(clear,hold);
 }

 setBgm(name:'explore'|'boss'|'none',soft=false){
  this.wantBgm=name;this.wantSoft=soft;
  if(!this.enabled||!this.ctx||!this.music)return;
  const track=name==='none'?'none':name;
  const vol=soft?.4:.85;
  if(this.bgmGain)this.bgmGain.gain.value=vol;
  if(track===this.bgmName){
   if(track!=='none')void this.bgmEl?.play().catch(()=>{/* wait for a gesture */});
   return;
  }
  this.bgmName=track;
  this.bgmSrc?.stop();this.bgmSrc=undefined;
  if(track==='none'){this.bgmEl?.pause();return;}
  this.playFileBgm(vol,track);
 }

 private playFileBgm(vol:number,track:'explore'|'boss'='explore'){
  if(!this.ctx||!this.music)return;
  const url=track==='boss'?asset('assets/audio/bgm/soon-boss.mp3'):asset('assets/audio/bgm/explore.ogg');
  if(!this.bgmEl){
   const el=new Audio(url);
   el.loop=true;el.preload='auto';el.crossOrigin='anonymous';
   this.bgmEl=el;
   try{
    const node=this.ctx.createMediaElementSource(el);
    const g=this.ctx.createGain();g.gain.value=vol;
    node.connect(g);g.connect(this.music);
    this.bgmGain=g;
   }catch{
    el.volume=Math.max(0,Math.min(1,this.musicVol*vol));
   }
  }else{
   if(this.bgmGain)this.bgmGain.gain.value=vol;
   else this.bgmEl.volume=Math.max(0,Math.min(1,this.musicVol*vol));
   if(!this.bgmEl.src.includes(track==='boss'?'soon-boss.mp3':'explore.ogg'))this.bgmEl.src=url;
  }
  this.bgmEl.currentTime=this.bgmEl.currentTime||0;
  void this.bgmEl.play().catch(()=>{/* wait for a gesture */});
 }

 setLevels(sfx:number,music:number){
  this.sfxVol=Math.max(0,Math.min(1,sfx));
  this.musicVol=Math.max(0,Math.min(1,music));
  this.applyGain();
 }

 private applyGain(){
  if(this.sfx)this.sfx.gain.value=this.sfxVol;
  if(this.music)this.music.gain.value=this.musicVol;
 }

 private startAmbient(){
  if(!this.ctx||!this.master)return;
  const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*3,this.ctx.sampleRate);
  const data=buffer.getChannelData(0);let last=0;
  for(let i=0;i<data.length;i++){last=last*.97+(Math.random()*2-1)*.03;data[i]=last;}
  const src=this.ctx.createBufferSource();src.buffer=buffer;src.loop=true;
  const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;
  const g=this.ctx.createGain();g.gain.value=.03;
  src.connect(filter);filter.connect(g);g.connect(this.master);src.start();
  this.ambient=src;
 }

 private beep(freq:number,dur:number,type:OscillatorType='sine',vol=.12,slide=0){
  if(!this.ctx||!this.sfx)return;
  const osc=this.ctx.createOscillator();osc.type=type;osc.frequency.value=freq;
  const g=this.ctx.createGain();g.gain.setValueAtTime(vol,this.ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+dur);
  if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),this.ctx.currentTime+dur);
  osc.connect(g);g.connect(this.sfx);osc.start();osc.stop(this.ctx.currentTime+dur);
 }

 private noise(dur:number,vol=.08,freq=900){
  if(!this.ctx||!this.sfx)return;
  const n=Math.floor(this.ctx.sampleRate*dur),buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate);
  const data=buf.getChannelData(0);for(let i=0;i<n;i++)data[i]=Math.random()*2-1;
  const src=this.ctx.createBufferSource();src.buffer=buf;
  const filter=this.ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=freq;
  const g=this.ctx.createGain();g.gain.setValueAtTime(vol,this.ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+dur);
  src.connect(filter);filter.connect(g);g.connect(this.sfx);src.start();
 }

 private synth(name:Cue){
  if(name==='slash'){this.noise(.12,.1,1800);this.beep(420,.1,'square',.05,-200);}
  else if(name==='spit')this.beep(320,.16,'sine',.1,220);
  else if(name==='hurt')this.beep(180,.22,'sawtooth',.1,-80);
  else if(name==='die'){this.beep(140,.5,'triangle',.12,-90);this.noise(.4,.08,300);}
  else if(name==='swallow'){this.beep(220,.28,'sine',.1,160);this.noise(.2,.06,400);}
  else if(name==='splash')this.noise(.22,.1,600);
  else if(name==='swim')this.noise(.16,.05,480);
  else if(name==='grass')this.noise(.1,.04,2400);
  else if(name==='dew')this.beep(660,.16,'sine',.08,120);
  else if(name==='jump')this.beep(380,.12,'triangle',.07,180);
  else if(name==='land')this.noise(.08,.06,240);
  else if(name==='dodge'){this.noise(.12,.08,1200);this.beep(500,.1,'sine',.06,-160);}
  else if(name==='summon')this.beep(240,.3,'triangle',.08,80);
  else if(name==='melon')this.beep(160,.18,'square',.05,40);
  else if(name==='smash')this.noise(.18,.12,500);
  else if(name==='ult'){this.beep(98,.6,'sawtooth',.08,40);this.noise(.4,.1,200);}
  else if(name==='step')this.noise(.06,.03,180);
 }
}
