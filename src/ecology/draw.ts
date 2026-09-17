type C=CanvasRenderingContext2D;

export function ellipse(c:C,x:number,y:number,rx:number,ry:number,color:string,angle=0){
 c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.fill();
}

export function mushroom(c:C,s=1,color='#dc8d66'){
 c.save();c.scale(s,s);
 const stem=c.createLinearGradient(-10,0,14,0);stem.addColorStop(0,'#d2c5a0');stem.addColorStop(.5,'#f5e8b7');stem.addColorStop(1,'#9c9b70');
 c.fillStyle=stem;c.beginPath();c.moveTo(-9,0);c.bezierCurveTo(-1,-20,-13,-44,-10,-56);c.lineTo(9,-58);c.bezierCurveTo(5,-35,8,-12,15,0);c.closePath();c.fill();
 ellipse(c,0,-51,45,10,'#b78969');
 c.beginPath();c.moveTo(-47,-53);c.bezierCurveTo(-33,-89,-5,-99,15,-83);c.bezierCurveTo(32,-72,41,-65,48,-52);c.bezierCurveTo(16,-41,-20,-43,-47,-53);c.fillStyle=color;c.fill();
 c.strokeStyle='#f9dca0';c.lineWidth=3;c.beginPath();c.moveTo(-43,-54);c.quadraticCurveTo(0,-42,44,-53);c.stroke();
 ellipse(c,-17,-69,8,4,'#f5ddb0',-.45);ellipse(c,9,-77,6,4,'#f5ddb0',.3);ellipse(c,28,-59,5,3,'#f5ddb0');
 c.globalAlpha=.25;ellipse(c,-5,-86,11,2,'#fff9d7');c.restore();
}

export function fern(c:C,s=1,flip=1){
 c.save();c.scale(s*flip,s);c.strokeStyle='#357e54';c.lineWidth=2;
 for(let b=0;b<5;b++){
  const endX=(b-2)*14,endY=-42-Math.sin(b/4*Math.PI)*26;
  c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(endX*.3,endY*.8,endX,endY);c.stroke();
  for(let t=.2;t<.96;t+=.13){
   const px=endX*t*t,py=endY*(2*t-t*t);
   leaf(c,px,py,13*(1-t)+3,-.7-b*.15,'#499264');leaf(c,px,py,14*(1-t)+3,1.1-b*.1,'#79ac68');
  }
 }
 c.restore();
}

export function flower(c:C,s=1,petal='#fff3ca'){
 c.save();c.scale(s,s);
 c.strokeStyle='#709355';c.lineWidth=1.3;c.beginPath();c.moveTo(0,0);c.lineTo(2,-18);c.stroke();
 for(let k=0;k<5;k++)ellipse(c,2+Math.cos(k*1.256)*3,-18+Math.sin(k*1.256)*3,2.8,2.2,petal);
 ellipse(c,2,-18,1.8,1.8,'#ddb968');c.restore();
}

function leaf(c:C,x:number,y:number,size:number,angle:number,color:string){
 c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-size*.55,-size*.65,0,-size);c.quadraticCurveTo(size*.65,-size*.65,0,0);c.fillStyle=color;c.fill();c.restore();
}

export function moth(c:C,s=1,wing='#f4e7b8cc',body='#6d8a4a'){
 c.save();c.scale(s,s);
 c.fillStyle=wing;c.beginPath();c.ellipse(-5,-2,6,3.2,-.4,0,Math.PI*2);c.ellipse(5,-2,6,3.2,.4,0,Math.PI*2);c.fill();
 c.fillStyle=body;c.fillRect(-1.2,-3,2.4,6);c.restore();
}

export function snail(c:C,s=1){
 c.save();c.scale(s,s);
 c.fillStyle='#8a7a52';c.beginPath();c.ellipse(0,-3,8,5,0,0,Math.PI*2);c.fill();
 c.strokeStyle='#e6c486';c.lineWidth=1.6;c.beginPath();c.arc(-1,-6,4.2,0,Math.PI*1.7);c.stroke();
 c.strokeStyle='#5a4a32';c.beginPath();c.moveTo(6,-2);c.lineTo(10,-6);c.stroke();c.restore();
}

function dewLeaf(c:C,done:boolean){
 leaf(c,0,0,16,-.4,done?'#d7ef9a':'#8fbf68');leaf(c,2,-2,14,.5,done?'#e8f7b4':'#a9d07a');
 ellipse(c,3,-8,3.2,2.2,'#ffebadcc');
}

function hollowFruit(c:C,done:boolean){
 ellipse(c,0,-12,11,9,done?'#f3c56a':'#d59a4a');
 c.strokeStyle='#8a5a28';c.lineWidth=1.4;c.beginPath();c.ellipse(0,-12,11,9,0,0,Math.PI*2);c.stroke();
 c.fillStyle='#6a3e18';c.beginPath();c.ellipse(2,-13,4,3,0,0,Math.PI*2);c.fill();
 c.strokeStyle='#5a8a48';c.beginPath();c.moveTo(0,-20);c.quadraticCurveTo(6,-26,3,-22);c.stroke();
}

function sporeFlower(c:C,done:boolean){
 flower(c,1.15,done?'#fff3b0':'#e8c4f0');
 ellipse(c,2,-20,3,3,done?'#f6e08a':'#c9a0e0');
}

function rootDoor(c:C,done:boolean){
 c.fillStyle=done?'#3d5a40':'#2a3c32';c.beginPath();c.ellipse(0,-22,16,26,0,Math.PI,0);c.lineTo(16,0);c.lineTo(-16,0);c.closePath();c.fill();
 c.strokeStyle=done?'#c9d98a':'#7a8a62';c.lineWidth=3;c.beginPath();c.ellipse(0,-22,17,27,0,Math.PI,0);c.stroke();
 if(done){c.fillStyle='#d8f4c866';c.beginPath();c.ellipse(0,-20,8,12,0,0,Math.PI*2);c.fill();}
}

function lantern(c:C,done:boolean,glow='#fff0a2',stem='#987a45'){
 c.strokeStyle=stem;c.lineWidth=2;c.beginPath();c.moveTo(0,-18);c.lineTo(0,2);c.stroke();
 c.fillStyle=done?glow:'#dcefa8';c.beginPath();c.arc(0,-28,8,0,Math.PI*2);c.fill();
 if(done){const g=c.createRadialGradient(0,-28,2,0,-28,22);g.addColorStop(0,glow+'99');g.addColorStop(1,glow+'00');c.fillStyle=g;c.beginPath();c.arc(0,-28,22,0,Math.PI*2);c.fill();}
}

function beetle(c:C){
 ellipse(c,0,-6,8,5,'#5d6b3a');
 c.strokeStyle='#3d4a28';c.lineWidth=1.2;c.beginPath();c.moveTo(0,-10);c.lineTo(0,-2);c.stroke();
 ellipse(c,6,-10,3,2,'#8aa05a',.4);
}

function pollen(c:C,done:boolean){
 ellipse(c,0,-8,10,7,done?'#ffe08a':'#f6d17b');
 c.fillStyle='#fff6d488';for(let i=0;i<5;i++)ellipse(c,Math.cos(i*1.2)*8,-14+Math.sin(i)*4,2.2,1.6,'#fff6d4aa');
}

function nectarFlower(c:C,done:boolean){
 flower(c,1.1,done?'#ffe9a8':'#f2b25a');
 ellipse(c,2,-20,3.4,3.4,done?'#fff4c8':'#c48a38');
}

function dripValve(c:C,done:boolean){
 c.fillStyle=done?'#e8b45a':'#8a4316';c.beginPath();c.roundRect(-10,-28,20,18,4);c.fill();
 c.strokeStyle='#f6d17b';c.lineWidth=2;c.beginPath();c.arc(0,-19,5,0,Math.PI*2);c.stroke();
 if(done){c.fillStyle='#ffe08aaa';c.beginPath();c.ellipse(0,-4,4,6,0,0,Math.PI*2);c.fill();}
}

function sealedJar(c:C,done:boolean){
 c.fillStyle=done?'#f6d17b':'#c48a38';c.beginPath();c.roundRect(-9,-26,18,24,5);c.fill();
 c.strokeStyle='#8a4316';c.stroke();
 c.fillStyle='#5a321c';c.fillRect(-7,-28,14,5);
}

function seeSaw(c:C,done:boolean){
 c.fillStyle=done?'#f2c56a':'#c48a38';c.beginPath();c.moveTo(-22,-4);c.lineTo(22,-10);c.lineTo(22,-4);c.lineTo(-22,2);c.closePath();c.fill();
 c.fillStyle='#8a4316';c.beginPath();c.moveTo(0,2);c.lineTo(-6,12);c.lineTo(6,12);c.closePath();c.fill();
}

function honeyLift(c:C,done:boolean){
 c.fillStyle=done?'#f6d17b':'#c48a38';c.beginPath();c.roundRect(-16,-8,32,8,3);c.fill();
 c.strokeStyle='#8a4316';c.lineWidth=2;c.beginPath();c.moveTo(-12,-8);c.lineTo(-12,-28);c.moveTo(12,-8);c.lineTo(12,-28);c.stroke();
}

function bee(c:C){
 c.fillStyle='#f6d17b';c.beginPath();c.ellipse(0,-6,8,5.5,0,0,Math.PI*2);c.fill();
 c.strokeStyle='#3b2118';c.lineWidth=1.4;c.beginPath();c.moveTo(-3,-8);c.lineTo(-3,-4);c.moveTo(2,-8);c.lineTo(2,-4);c.stroke();
 c.fillStyle='#fff6d488';c.beginPath();c.ellipse(-2,-12,5,3,-.4,0,Math.PI*2);c.fill();
}

function ant(c:C){
 c.fillStyle='#5a321c';c.beginPath();c.ellipse(-5,-4,5,3.2,0,0,Math.PI*2);c.ellipse(4,-4,6,3.4,0,0,Math.PI*2);c.fill();
 c.strokeStyle='#3b2118';c.lineWidth=1;c.beginPath();c.moveTo(-2,-2);c.lineTo(-6,2);c.moveTo(2,-2);c.lineTo(6,2);c.stroke();
}

function shell(c:C,done:boolean){
 c.fillStyle=done?'#f3d6c8':'#d4a888';c.beginPath();c.ellipse(0,-8,14,9,0,0,Math.PI*2);c.fill();
 c.strokeStyle='#8f6844';c.lineWidth=1.4;
 for(let i=0;i<3;i++){c.beginPath();c.arc(-2,-8,4+i*3,0.2,2.4);c.stroke();}
}

function salt(c:C,done:boolean){
 c.fillStyle=done?'#e8fbff':'#c8e7f4';
 c.beginPath();c.moveTo(0,-22);c.lineTo(8,-8);c.lineTo(3,2);c.lineTo(-7,-4);c.closePath();c.fill();
 c.strokeStyle='#f7ffff';c.stroke();
}

function anemone(c:C,done:boolean){
 c.fillStyle=done?'#f3d6c8':'#d5848a';c.beginPath();c.ellipse(0,-4,10,5,0,0,Math.PI*2);c.fill();
 c.strokeStyle=done?'#ffe8e0':'#e8a0a8';c.lineWidth=1.6;
 for(let i=0;i<5;i++){c.beginPath();c.moveTo((i-2)*3, -4);c.quadraticCurveTo((i-2)*4,-18, (i-2)*2,-22);c.stroke();}
}

function surfLeaf(c:C,done:boolean){
 c.fillStyle=done?'#b7e9d7':'#7dbfa8';c.beginPath();c.ellipse(0,-6,22,7,-.12,0,Math.PI*2);c.fill();
}

function tideValve(c:C,done:boolean){
 c.fillStyle=done?'#9fd4ea':'#5a7a88';c.beginPath();c.roundRect(-12,-24,24,22,5);c.fill();
 c.strokeStyle='#dbfff0';c.beginPath();c.arc(0,-13,6,0,Math.PI*2);c.stroke();
}

function bottle(c:C,done:boolean){
 c.fillStyle=done?'#c8e7f4aa':'#8ab0c0aa';c.beginPath();c.roundRect(-6,-22,12,18,3);c.fill();
 c.fillStyle='#d4eef8';c.fillRect(-3,-26,6,5);
}

function cove(c:C,done:boolean){
 c.fillStyle=done?'#4a6a78':'#2a4048';c.beginPath();c.ellipse(0,-16,18,20,0,Math.PI,0);c.lineTo(18,0);c.lineTo(-18,0);c.closePath();c.fill();
 if(done){c.fillStyle='#8ad4ff55';c.beginPath();c.ellipse(0,-14,8,10,0,0,Math.PI*2);c.fill();}
}

function crab(c:C){
 c.fillStyle='#d58472';c.beginPath();c.ellipse(0,-8,14,8,0,0,Math.PI*2);c.fill();
 c.strokeStyle='#f4bd90';c.lineWidth=2;c.beginPath();c.moveTo(-10,-8);c.lineTo(-20,-15);c.moveTo(10,-8);c.lineTo(20,-15);c.stroke();
}

function jelly(c:C,s=1){
 c.fillStyle='#8ad4ff99';c.beginPath();c.ellipse(0,-8*s,10*s,8*s,0,0,Math.PI*2);c.fill();
 c.strokeStyle='#8ad4ff88';c.lineWidth=1.2;
 for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*3,-4);c.quadraticCurveTo(i*3+2,6,i*3,10);c.stroke();}
}

function minnow(c:C,color='#9bd5e8'){
 c.fillStyle=color;c.beginPath();c.ellipse(0,-8,15,7,0,0,Math.PI*2);c.fill();
 c.beginPath();c.moveTo(-13,-8);c.lineTo(-25,-17);c.lineTo(-25,1);c.closePath();c.fill();
}

function windBell(c:C,s=1,done=false){
 c.save();c.scale(s,s);c.strokeStyle=done?'#fff0a8':'#d8b34f';c.lineWidth=3;c.beginPath();c.moveTo(0,-48);c.lineTo(0,0);c.stroke();
 c.fillStyle=done?'#ffe58a':'#e0b94d';c.beginPath();c.ellipse(0,4,12,9,0,0,Math.PI*2);c.fill();c.restore();
}

function mill(c:C,done:boolean,time:number){
 c.fillStyle='#c4a46a';c.fillRect(-3,-36,6,36);
 c.save();c.translate(0,-28);c.rotate(time*.6);
 c.fillStyle=done?'#fff0a8':'#e8c878';
 for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.beginPath();c.moveTo(0,0);c.lineTo(4,-4);c.lineTo(18,0);c.lineTo(4,4);c.closePath();c.fill();}
 c.restore();
}

function gustSeed(c:C,done:boolean){
 c.strokeStyle=done?'#fff0a8':'#cce4cf';c.lineWidth=2.4;c.beginPath();c.moveTo(0,0);c.lineTo(0,-28);c.stroke();
 for(let i=0;i<4;i++){const a=i*Math.PI/2;c.beginPath();c.arc(Math.cos(a)*10,-28+Math.sin(a)*6,6,a+.3,a+2.5);c.stroke();}
}

function dandelion(c:C,done:boolean){
 c.strokeStyle='#8fbf68';c.lineWidth=2;c.beginPath();c.moveTo(0,0);c.lineTo(0,-24);c.stroke();
 c.fillStyle=done?'#fff6d4':'#f4e7b8';
 for(let i=0;i<8;i++){const a=i*.785;c.beginPath();c.ellipse(Math.cos(a)*7,-24+Math.sin(a)*5,4,1.6,a,0,Math.PI*2);c.fill();}
}

function kiteAnchor(c:C,done:boolean){
 c.fillStyle=done?'#f7d66d':'#c4a46a';c.beginPath();c.moveTo(0,-26);c.lineTo(10,-12);c.lineTo(0,2);c.lineTo(-10,-12);c.closePath();c.fill();
 c.strokeStyle='#8a6a30';c.beginPath();c.moveTo(0,2);c.lineTo(0,8);c.stroke();
}

function toneStone(c:C,done:boolean){
 c.fillStyle=done?'#fff0a8':'#b8a878';c.beginPath();c.roundRect(-12,-20,24,18,6);c.fill();
 c.strokeStyle='#8a7a48';c.beginPath();c.moveTo(-6,-14);c.lineTo(-6,-6);c.moveTo(0,-16);c.lineTo(0,-6);c.moveTo(6,-14);c.lineTo(6,-6);c.stroke();
}

function letterDesk(c:C,done:boolean){
 c.fillStyle='#c4a46a';c.fillRect(-16,-6,32,6);c.fillRect(-12,0,6,8);c.fillRect(6,0,6,8);
 c.fillStyle=done?'#fff6d4':'#f0e6c8';c.beginPath();c.moveTo(-8,-8);c.lineTo(8,-12);c.lineTo(8,-6);c.lineTo(-8,-2);c.closePath();c.fill();
}

function bird(c:C,color='#f5d47d'){
 c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.arc(0,-10,12,Math.PI*1.1,Math.PI*1.9);c.stroke();
 c.beginPath();c.moveTo(10,-12);c.lineTo(18,-15);c.stroke();
}

function tumble(c:C){
 c.strokeStyle='#c4a46a';c.lineWidth=1.6;c.beginPath();c.arc(0,-10,10,0,Math.PI*2);c.stroke();
 for(let i=0;i<5;i++){c.beginPath();c.moveTo(0,-10);c.lineTo(Math.cos(i*1.256)*10,-10+Math.sin(i*1.256)*10);c.stroke();}
}

function lizard(c:C){
 c.fillStyle='#8fbf68';c.beginPath();c.ellipse(0,-5,12,4,0,0,Math.PI*2);c.fill();
 c.beginPath();c.moveTo(10,-5);c.quadraticCurveTo(18,-10,16,-2);c.lineTo(10,-3);c.fill();
}

function crystal(c:C,done:boolean,fill='#a8dbe9'){
 c.fillStyle=done?'#e8fbff':fill;
 c.beginPath();c.moveTo(0,-38);c.lineTo(13,-12);c.lineTo(4,2);c.lineTo(-12,-8);c.closePath();c.fill();
 c.strokeStyle='#f7ffff';c.stroke();
}

function lily(c:C,done:boolean){
 flower(c,1.05,done?'#e8fbff':'#d6c8f4');
 ellipse(c,0,-4,16,5,done?'#c8e7f4aa':'#8aa0c0aa');
}

function twinLamp(c:C,done:boolean){
 lantern(c,done,'#d6eeff','#6a7a90');
 c.fillStyle=done?'#e8fbff':'#8aa0c0';c.beginPath();c.arc(-10,-22,4,0,Math.PI*2);c.arc(10,-22,4,0,Math.PI*2);c.fill();
}

function memoryStone(c:C,done:boolean){
 c.fillStyle=done?'#a9e6d2':'#7e9b9b';c.beginPath();c.roundRect(-15,-30,30,30,6);c.fill();
 c.strokeStyle='#dbfff0';c.stroke();c.beginPath();c.arc(0,-15,7,0,Math.PI*2);c.stroke();
}

function starFlower(c:C,done:boolean){
 flower(c,1.1,done?'#e8fbff':'#c8d8ff');
 c.fillStyle=done?'#fff6d4':'#d6eeff';
 for(let i=0;i<5;i++){const a=i*1.256-1.57;c.beginPath();c.moveTo(0,-20);c.lineTo(Math.cos(a)*3,-20+Math.sin(a)*3);c.lineTo(Math.cos(a)*8,-20+Math.sin(a)*8);c.fill();}
}

function buoy(c:C,done:boolean){
 c.fillStyle=done?'#9fd4ea':'#6a88a0';c.beginPath();c.ellipse(0,-10,8,12,0,0,Math.PI*2);c.fill();
 c.fillStyle='#e8fbff';c.fillRect(-8,-12,16,4);
}

function starGate(c:C,s=1){
 c.save();c.scale(s,s);
 c.fillStyle='#4d5870';
 c.beginPath();c.moveTo(-40,0);c.lineTo(-40,-128);c.quadraticCurveTo(0,-210,40,-128);c.lineTo(40,0);
 c.lineTo(24,0);c.lineTo(24,-118);c.quadraticCurveTo(0,-186,-24,-118);c.lineTo(-24,0);c.closePath();c.fill();
 const glow=c.createRadialGradient(0,-96,6,0,-96,46);
 glow.addColorStop(0,'#e8f6ffdd');glow.addColorStop(.45,'#8ad4ff99');glow.addColorStop(1,'#8ad4ff00');
 c.fillStyle=glow;c.beginPath();c.ellipse(0,-100,22,52,0,0,Math.PI*2);c.fill();
 c.restore();
}

function echoBeast(c:C){
 c.fillStyle='#9cb0d0aa';c.beginPath();c.ellipse(0,-10,16,9,0,0,Math.PI*2);c.fill();
 ellipse(c,10,-16,4,3,'#e8fbff');
}

const OBJECTS:Record<string,(c:C,done:boolean,time:number)=>void>={
 'forest-dew-leaf':(c,done)=>dewLeaf(c,done),
 'forest-bounce-mushroom':(c,done)=>mushroom(c,.42,done?'#f5b26f':'#dc8d66'),
 'forest-hollow-fruit':(c,done)=>hollowFruit(c,done),
 'forest-spore-flower':(c,done)=>sporeFlower(c,done),
 'forest-root-door':(c,done)=>rootDoor(c,done),
 'forest-firefly-lantern':(c,done)=>lantern(c,done),
 'honey-pollen':(c,done)=>pollen(c,done),
 'honey-nectar-flower':(c,done)=>nectarFlower(c,done),
 'honey-drip-valve':(c,done)=>dripValve(c,done),
 'honey-sealed-jar':(c,done)=>sealedJar(c,done),
 'honey-wax-see-saw':(c,done)=>seeSaw(c,done),
 'honey-lift':(c,done)=>honeyLift(c,done),
 'tide-shell':(c,done)=>shell(c,done),
 'tide-salt-cluster':(c,done)=>salt(c,done),
 'tide-bubble-anemone':(c,done)=>anemone(c,done),
 'tide-float':(c,done)=>surfLeaf(c,done),
 'tide-valve':(c,done)=>tideValve(c,done),
 'tide-surf-leaf':(c,done)=>surfLeaf(c,done),
 'tide-bottle':(c,done)=>bottle(c,done),
 'tide-hidden-cove':(c,done)=>cove(c,done),
 'wind-bell-live':(c,done)=>windBell(c,.55,done),
 'wind-mill-live':(c,done,time)=>mill(c,done,time),
 'wind-gust':(c,done)=>gustSeed(c,done),
 'wind-seed-flower':(c,done)=>gustSeed(c,done),
 'wind-dandelion':(c,done)=>dandelion(c,done),
 'wind-kite-anchor':(c,done)=>kiteAnchor(c,done),
 'wind-tone-stone':(c,done)=>toneStone(c,done),
 'wind-letter-desk':(c,done)=>letterDesk(c,done),
 'mirror-crystal-live':(c,done)=>crystal(c,done),
 'mirror-moon-lily':(c,done)=>lily(c,done),
 'mirror-twin-lamp':(c,done)=>twinLamp(c,done),
 'mirror-memory-stone':(c,done)=>memoryStone(c,done),
 'mirror-star-flower':(c,done)=>starFlower(c,done),
 'mirror-firefly':(c,done)=>lantern(c,done,'#d6eeff','#6a7a90'),
 'mirror-buoy':(c,done)=>buoy(c,done),
 'mirror-portal-live':(c,done)=>starGate(c,done?.4:.36),
};

const FAUNA:Record<string,(c:C)=>void>={
 snail,moth,beetle,bee,ant,
 'hermit-crab':crab,jellyfish:c=>jelly(c,1.15),minnow,plankton:c=>ellipse(c,0,-6,4,3,'#c8e7f4aa'),
 bellbird:c=>bird(c),'wind-butterfly':c=>moth(c,1,'#f4e7b8cc','#8a7048'),tumbleweed:tumble,lizard,
 mirrorfish:c=>minnow(c,'#9fd4ea'),'star-moth':c=>moth(c,1,'#d6eeffcc','#6a7a90'),'moon-snail':snail,'echo-beast':echoBeast,
};

function alias(kind:string){return kind.startsWith('critter-')?kind.slice(8):kind;}

export function hasEcoDraw(kind:string){
 const key=alias(kind);
 return !!OBJECTS[key]||!!FAUNA[key];
}

export function drawEcoKind(c:C,kind:string,done=false,time=0){
 const draw=OBJECTS[alias(kind)];
 if(draw){draw(c,done,time);return;}
 if(kind.includes('mushroom'))mushroom(c,.42,done?'#f5b26f':'#dc8d66');
 else if(kind.includes('flower')||kind.includes('lily'))flower(c,.9,done?'#fff3b0':'#f4c9d7');
 else if(kind.includes('lantern')||kind.includes('firefly')||kind.includes('lamp'))lantern(c,done);
 else if(kind.includes('bell'))windBell(c,.55,done);
 else if(kind.includes('portal'))starGate(c,.36);
 else if(kind.includes('shell')||kind.includes('fruit')||kind.includes('jar')||kind.includes('bottle'))hollowFruit(c,done);
 else if(kind.includes('crystal')||kind.includes('salt')||kind.includes('star'))crystal(c,done);
 else if(kind.includes('valve')||kind.includes('stone')||kind.includes('memory'))memoryStone(c,done);
 else if(kind.includes('wind')||kind.includes('gust')||kind.includes('dandelion')||kind.includes('seed'))gustSeed(c,done);
 else if(kind.includes('float')||kind.includes('leaf')||kind.includes('surf'))surfLeaf(c,done);
 else {c.fillStyle=done?'#f1e7a0':'#a6c58b';c.beginPath();c.arc(0,-14,13,0,Math.PI*2);c.fill();}
}

export function drawEcoCritter(c:C,kind:string){
 const draw=FAUNA[alias(kind)];
 if(draw){draw(c);return;}
 if(kind.includes('jelly'))jelly(c,1.15);
 else if(kind.includes('snail'))snail(c);
 else if(kind.includes('crab'))crab(c);
 else if(kind.includes('fish')||kind.includes('minnow'))minnow(c);
 else if(kind.includes('butterfly')||kind.includes('moth'))moth(c);
 else if(kind.includes('bird'))bird(c);
 else {c.fillStyle='#9cb57c';c.beginPath();c.ellipse(0,-8,14,9,0,0,Math.PI*2);c.fill();}
}

export function starGateMark(c:C,s=1){starGate(c,s);}
export function windBellMark(c:C,s=1){windBell(c,s);}
