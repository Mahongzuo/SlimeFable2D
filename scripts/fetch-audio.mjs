import {writeFileSync} from 'node:fs';

const root=new URL('../public/assets/audio/',import.meta.url);
const base='https://cdn.jsdelivr.net/gh/Calinou/kenney-ui-audio@master/addons/kenney_ui_audio/';
const map={
 slash:'switch2.wav',
 spit:'switch8.wav',
 hurt:'switch20.wav',
 die:'switch27.wav',
 swallow:'switch12.wav',
 splash:'switch5.wav',
 grass:'rollover1.wav',
 dew:'click1.wav',
 jump:'switch3.wav',
 land:'switch7.wav',
 dodge:'switch15.wav',
 summon:'switch18.wav',
 melon:'switch11.wav',
 smash:'switch24.wav',
 ult:'switch32.wav',
 step:'rollover4.wav',
};

function wavPad(seconds,freq,beat){
 const rate=22050,n=Math.floor(rate*seconds);
 const data=Buffer.alloc(n*2);
 for(let i=0;i<n;i++){
  const t=i/rate;
  const pulse=.55+.45*Math.sin(2*Math.PI*t/beat);
  const sample=(
   Math.sin(2*Math.PI*freq*t)*.22+
   Math.sin(2*Math.PI*freq*1.5*t)*.08+
   Math.sin(2*Math.PI*(freq/2)*t)*.12
  )*pulse*(.35+.15*Math.sin(2*Math.PI*t*.2));
  data.writeInt16LE(Math.max(-32767,Math.min(32767,sample*32767)),i*2);
 }
 const header=Buffer.alloc(44);
 header.write('RIFF',0);header.writeUInt32LE(36+data.length,4);header.write('WAVE',8);
 header.write('fmt ',12);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);
 header.writeUInt16LE(1,22);header.writeUInt32LE(rate,24);header.writeUInt32LE(rate*2,28);
 header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(data.length,40);
 return Buffer.concat([header,data]);
}

async function grab(rel,url){
 const dest=new URL(rel,root);
 const res=await fetch(url);
 if(!res.ok)throw new Error(`${rel} ${res.status}`);
 writeFileSync(dest,Buffer.from(await res.arrayBuffer()));
 console.log('ok',rel);
}

for(const [name,file] of Object.entries(map))await grab(`sfx/${name}.ogg`,base+file);
const bgm=[
 ['bgm/explore.ogg','https://opengameart.org/sites/default/files/iremos_forest_in_game.ogg'],
 ['bgm/boss.ogg','https://opengameart.org/sites/default/files/forest_stage_bpm95.ogg'],
];
for(const [rel,url] of bgm){
 try{await grab(rel,url);}
 catch(err){
  console.log('bgm fallback',rel,err.message);
  writeFileSync(new URL(rel,root),wavPad(rel.includes('boss')?10:12,rel.includes('boss')?196:262,rel.includes('boss')?1.6:3.2));
 }
}
