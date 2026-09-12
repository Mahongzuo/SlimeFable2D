import { type Rect, type SlimeSimulation } from './physics';
import { Level, WORLD_WIDTH } from './level';
type C=CanvasRenderingContext2D;
export const W=1280,H=720;
export function rng(seed:number){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export function canvas(w:number,h:number){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function ellipse(c:C,x:number,y:number,rx:number,ry:number,color:string,angle=0){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.fill();}
function path(c:C,points:number[],color:string){c.beginPath();c.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);c.closePath();c.fillStyle=color;c.fill();}
function leaf(c:C,x:number,y:number,size:number,angle:number,color:string){
 c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-size*.55,-size*.65,0,-size);c.quadraticCurveTo(size*.65,-size*.65,0,0);c.fillStyle=color;c.fill();c.restore();
}
function fern(c:C,x:number,y:number,s:number,flip=1){
 c.save();c.translate(x,y);c.scale(s*flip,s);c.strokeStyle='#357e54';c.lineWidth=2;
 for(let b=0;b<5;b++){
  const endX=(b-2)*14,endY=-42-Math.sin(b/4*Math.PI)*26;
  c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(endX*.3,endY*.8,endX,endY);c.stroke();
  for(let t=.2;t<.96;t+=.13){const px=endX*t*t,py=endY*(2*t-t*t);
   leaf(c,px,py,13*(1-t)+3,-.7-b*.15,'#499264');leaf(c,px,py,14*(1-t)+3,1.1-b*.1,'#79ac68');}
 }c.restore();
}
function flower(c:C,x:number,y:number,s:number,petal='#fff3ca'){
 c.save();c.translate(x,y);c.scale(s,s);
 c.strokeStyle='#709355';c.lineWidth=1.3;c.beginPath();c.moveTo(0,0);c.lineTo(2,-18);c.stroke();
 for(let k=0;k<5;k++)ellipse(c,2+Math.cos(k*1.256)*3,-18+Math.sin(k*1.256)*3,2.8,2.2,petal);
 ellipse(c,2,-18,1.8,1.8,'#ddb968');c.restore();
}
function mushroom(c:C,x:number,y:number,s:number,color='#dc8d66'){
 c.save();c.translate(x,y);c.scale(s,s);
 const stem=c.createLinearGradient(-10,0,14,0);stem.addColorStop(0,'#d2c5a0');stem.addColorStop(.5,'#f5e8b7');stem.addColorStop(1,'#9c9b70');
 c.fillStyle=stem;c.beginPath();c.moveTo(-9,0);c.bezierCurveTo(-1,-20,-13,-44,-10,-56);c.lineTo(9,-58);c.bezierCurveTo(5,-35,8,-12,15,0);c.closePath();c.fill();
 ellipse(c,0,-51,45,10,'#b78969');
 c.beginPath();c.moveTo(-47,-53);c.bezierCurveTo(-33,-89,-5,-99,15,-83);c.bezierCurveTo(32,-72,41,-65,48,-52);c.bezierCurveTo(16,-41,-20,-43,-47,-53);c.fillStyle=color;c.fill();
 c.strokeStyle='#f9dca0';c.lineWidth=3;c.beginPath();c.moveTo(-43,-54);c.quadraticCurveTo(0,-42,44,-53);c.stroke();
 ellipse(c,-17,-69,8,4,'#f5ddb0',-.45);ellipse(c,9,-77,6,4,'#f5ddb0',.3);ellipse(c,28,-59,5,3,'#f5ddb0');
 c.globalAlpha=.25;ellipse(c,-5,-86,11,2,'#fff9d7');c.restore();
}
function tree(c:C,x:number,y:number,s:number,seed:number,distant=false){
 const r=rng(seed);c.save();c.translate(x,y);c.scale(s,s);
 const g=c.createLinearGradient(-60,0,85,0);g.addColorStop(0,distant?'#769887':'#345d4f');g.addColorStop(.42,distant?'#8fa793':'#6c8260');g.addColorStop(1,distant?'#66887c':'#2e5147');
 c.fillStyle=g;c.beginPath();c.moveTo(-100,10);c.bezierCurveTo(-36,-30,-48,-130,-47,-230);c.bezierCurveTo(-50,-320,-95,-400,-67,-525);c.lineTo(46,-530);c.bezierCurveTo(5,-350,63,-257,41,-120);c.quadraticCurveTo(33,-40,114,8);c.closePath();c.fill();
 c.strokeStyle=distant?'#658b7e':'#2d514747';c.lineWidth=7;
 for(let i=0;i<6;i++){let bx=-40+i*15;c.beginPath();c.moveTo(bx,0);c.bezierCurveTo(bx+34,-120,bx-30,-280,bx+5,-460);c.stroke();}
 c.lineWidth=35;c.beginPath();c.moveTo(-30,-260);c.quadraticCurveTo(-80,-360,-170,-376);c.stroke();
 c.lineWidth=29;c.beginPath();c.moveTo(22,-343);c.quadraticCurveTo(89,-393,171,-435);c.stroke();
 for(let i=0;i<48;i++){
  const bx=(r()-.5)*450,by=-430-r()*125,sz=40+r()*49;
  ellipse(c,bx,by,sz,sz*.7,distant?['#8ba997','#7c9e8e','#9eb69b'][i%3]:['#306a50','#407d55','#5b9058','#7ba565'][i%4],r());
 }
 if(!distant){
  for(let i=0;i<28;i++)leaf(c,(r()-.5)*380,-400-r()*160,18+r()*20,r()*5,['#83ad69','#6f9e60','#a2bc72'][i%3]);
  c.strokeStyle='#5b8c5a';c.lineWidth=3;c.beginPath();c.moveTo(52,-405);c.bezierCurveTo(88,-260,-27,-227,15,-128);c.stroke();
  for(let i=0;i<11;i++)leaf(c,44+Math.sin(i*.6)*18,-380+i*21,16,i%2?-.9:1,'#8da968');
 }
 c.restore();
}

type Flora={kind:'mushroom'|'fern'|'flower';x:number;y:number;s:number;color:string;flip:number;phase:number;sway:number;bounce:number;vSway:number;vBounce:number};
export class ForestArt {
 sky=canvas(W,H);far=canvas(2400,H);middle=canvas(3200,H);terrain=canvas(WORLD_WIDTH,900);
 grasses:{x:number;y:number;h:number;phase:number;color:string;press:number;vPress:number}[]=[];
 props:Flora[]=[];
 private lastFlora=0;
 constructor(public level:Level){this.paintSky();this.paintForest();this.paintTerrain();}
 private addFlora(kind:Flora['kind'],x:number,y:number,s:number,extra:Partial<Pick<Flora,'color'|'flip'>>={}){
  this.props.push({kind,x,y,s,color:extra.color??(kind==='mushroom'?'#dc8d66':kind==='fern'?'#499264':'#fff3ca'),flip:extra.flip??1,phase:x*.03+y*.01,sway:0,bounce:0,vSway:0,vBounce:0});
 }
 private paintSky(){
  const c=this.sky.getContext('2d')!;const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#759e8e');g.addColorStop(.43,'#c8d7ad');g.addColorStop(1,'#ecddb3');c.fillStyle=g;c.fillRect(0,0,W,H);
  const sun=c.createRadialGradient(850,200,0,850,200,490);sun.addColorStop(0,'#ffedb8aa');sun.addColorStop(.5,'#fff6c02a');sun.addColorStop(1,'#fff6c000');c.fillStyle=sun;c.fillRect(0,0,W,H);
 }
 private paintForest(){
  const c=this.far.getContext('2d')!,r=rng(83);
  for(let i=0;i<24;i++){const x=i*110;c.fillStyle='#5b8a7b18';c.beginPath();c.moveTo(x-30,600);c.quadraticCurveTo(x+10,300,x-20,-80);c.lineTo(x+23,-80);c.quadraticCurveTo(x+12,380,x+70,600);c.fill();}
  for(let i=0;i<12;i++)tree(c,i*230+40,590,.7+r()*.3,200+i,true);
  const fog=c.createLinearGradient(0,330,0,650);fog.addColorStop(0,'#cddcba00');fog.addColorStop(1,'#cddcba');c.fillStyle=fog;c.fillRect(0,330,2400,390);
  const m=this.middle.getContext('2d')!;
  for(let i=0;i<9;i++)tree(m,i*420-80,620,.8+r()*.34,500+i);
  for(let i=0;i<65;i++)ellipse(m,r()*3200,600+r()*50,35+r()*80,35+r()*40,['#71975d','#5f8b59','#88a867','#aac07c'][i%4]);
  for(let i=0;i<25;i++)mushroom(m,r()*3200,590+r()*30,.35+r()*.75,i%2?'#aaa786':'#b79175');
 }
 private paintTerrain(){
  const c=this.terrain.getContext('2d')!,r=rng(882);
  // Distant dressing belongs behind collision silhouettes.
  tree(c,1620,600,.82,734);tree(c,4010,610,1.05,54);
  this.addFlora('mushroom',90,600,1.3);this.addFlora('mushroom',710,600,1.6,{color:'#c98c64'});this.addFlora('mushroom',1500,600,.75);this.addFlora('mushroom',2235,600,1.05,{color:'#d5946a'});this.addFlora('mushroom',3080,600,1.15);this.addFlora('mushroom',3810,600,.8);
  this.addFlora('mushroom',900,533,.72,{color:'#d5946a'});this.addFlora('mushroom',1130,466,.86);this.addFlora('mushroom',1405,510,.66,{color:'#c98c64'});
  for(const rect of this.level.base){if(rect.kind==='boundary')continue;this.ground(c,rect,r);}
  // Root passage: a clearly visible, long horizontal opening below the root block.
  const root=this.level.base.find(s=>s.kind==='root')!;
  c.strokeStyle='#886f4f';c.lineWidth=25;c.lineCap='round';c.beginPath();c.moveTo(root.x+10,root.y+30);c.bezierCurveTo(root.x+100,root.y+90,root.x+160,root.y+110,root.x+root.w-12,root.y+160);c.stroke();
  c.strokeStyle='#b19b68';c.lineWidth=4;c.beginPath();c.moveTo(root.x+10,root.y+25);c.bezierCurveTo(root.x+100,root.y+85,root.x+160,root.y+105,root.x+root.w-12,root.y+155);c.stroke();
  for(let x=20;x<WORLD_WIDTH;x+=14){
   let y=600;for(const s of this.level.base)if(s.kind!=='boundary'&&x>=s.x&&x<s.x+s.w)y=Math.min(y,s.y);
   if(x>2420&&x<2900)continue;
   this.grasses.push({x,y,h:9+r()*19,phase:r()*6.28,color:['#8ba84d','#a9bd61','#597e42','#c0cf7a'][Math.floor(r()*4)],press:0,vPress:0});
   if(r()<.17)this.addFlora('fern',x,y,.3+r()*.5,{flip:r()>.5?1:-1});
   if(r()<.15)this.addFlora('flower',x,y,.85+r()*.45,{color:r()>.5?'#fff3ca':'#d5daef'});
  }
  this.sign(c,520,600,'苔光森林', '→');this.sign(c,1570,600,'树根小径','↓');this.sign(c,2290,600,'镜水浅湾','→');
  this.addFlora('fern',40,602,1.1);this.addFlora('fern',585,602,.8);this.addFlora('fern',1535,602,.85);this.addFlora('fern',2990,602,1.1);this.addFlora('fern',3740,602,1);
  // Ruined arch frames the gate, but never hides the pressure plates.
  for(const x of [3549,3622]){this.stone(c,x,405,30,195);ellipse(c,x+15,407,22,8,'#84965f');}
  this.stone(c,3540,388,126,37);
  for(let i=0;i<8;i++)leaf(c,3550+i*14,389,20,i*.7,'#72995c');
  // A welcoming hollow with warm rings and lanterns.
  c.fillStyle='#254a3b';c.beginPath();c.ellipse(4090,555,44,65,0,Math.PI,0);c.lineTo(4134,600);c.lineTo(4046,600);c.closePath();c.fill();
  c.strokeStyle='#a49c62';c.lineWidth=7;c.beginPath();c.ellipse(4090,555,47,68,0,Math.PI,0);c.lineTo(4137,600);c.stroke();
 }
 private stone(c:C,x:number,y:number,w:number,h:number){
  const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#a3ac8b');g.addColorStop(.5,'#7e8f79');g.addColorStop(1,'#5c7164');c.fillStyle=g;c.beginPath();c.roundRect(x,y,w,h,7);c.fill();
  c.strokeStyle='#c9ceb04a';c.lineWidth=2;c.stroke();c.strokeStyle='#425d5144';c.lineWidth=2;c.beginPath();c.moveTo(x+w*.62,y+5);c.lineTo(x+w*.52,y+h*.5);c.lineTo(x+w*.72,y+h*.6);c.stroke();
 }
 private ground(c:C,s:Rect,r:()=>number){
  if(s.kind==='stone'){this.stone(c,s.x,s.y,s.w,s.h);}
  else{
   const g=c.createLinearGradient(0,s.y,0,s.y+260);g.addColorStop(0,s.kind==='root'?'#766746':'#817451');g.addColorStop(.3,'#5d5b40');g.addColorStop(1,'#303e32');c.fillStyle=g;c.fillRect(s.x,s.y,s.w,s.h);
   c.save();c.beginPath();c.rect(s.x,s.y,s.w,s.h);c.clip();
   for(let i=0;i<s.w*.45;i++){const x=s.x+r()*s.w,y=s.y+18+r()*s.h,sz=2+r()*9;ellipse(c,x,y,sz,sz*.6,['#b4a16a22','#223a322f','#c1b58919'][i%3],r());}
   c.strokeStyle='#b29a6733';c.lineWidth=2;
   for(let x=s.x+25;x<s.x+s.w;x+=55+r()*80){c.beginPath();c.moveTo(x,s.y+5);c.bezierCurveTo(x+18,s.y+40,x-24,s.y+73,x+10,s.y+126);c.stroke();}
   c.restore();
  }
  if(s.kind==='pool')return;
  const moss=c.createLinearGradient(0,s.y-5,0,s.y+20);moss.addColorStop(0,'#c5d281');moss.addColorStop(.35,'#8fa954');moss.addColorStop(1,'#526d3e');
  c.fillStyle=moss;c.beginPath();c.moveTo(s.x,s.y);c.lineTo(s.x+s.w,s.y);c.lineTo(s.x+s.w,s.y+12);
  for(let x=s.x+s.w;x>=s.x;x-=12)c.lineTo(x,s.y+12+r()*9);c.closePath();c.fill();
  c.strokeStyle='#d3dc9877';c.lineWidth=2;c.beginPath();c.moveTo(s.x,s.y);c.lineTo(s.x+s.w,s.y);c.stroke();
 }
 private sign(c:C,x:number,y:number,text:string,arrow:string){
  c.fillStyle='#726546';c.fillRect(x-4,y-74,8,74);c.save();c.translate(x,y-61);c.rotate(-.045);
  c.fillStyle='#a6996a';c.beginPath();c.roundRect(-42,-16,84,34,4);c.fill();c.strokeStyle='#dfd0a344';c.stroke();
  c.fillStyle='#414e36';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText(text,-4,-2);c.font='16px sans-serif';c.fillText(arrow,0,14);c.restore();
 }
 drawBackground(c:C,camera:number,time:number){
  c.drawImage(this.sky,0,0);c.drawImage(this.far,-camera*.15,0);c.drawImage(this.middle,-camera*.38,0);
  // Soft diagonal light shafts have no hard-edged polygons.
  c.save();c.globalCompositeOperation='screen';
  for(let i=0;i<4;i++){c.save();c.translate(590+i*215-camera*.12,-80);c.rotate(.36);const g=c.createLinearGradient(-70,0,70,0);g.addColorStop(0,'#f4efc000');g.addColorStop(.5,'#f7eeb414');g.addColorStop(1,'#f4efc000');c.fillStyle=g;c.fillRect(-70,0,140,950);c.restore();}c.restore();
  c.drawImage(this.terrain,-camera,0);
  this.drawAtmosphere(c,camera,time);
 }
 drawAtmosphere(c:C,camera:number,time:number){
  for(let i=0;i<36;i++){const x=((i*137+Math.sin(time*.22+i)*38-camera*.25)%1400+1400)%1400,y=160+((i*79+time*(4+i%3))%420);ellipse(c,x,y,1.5,1.5,`rgba(255,247,191,${.2+(Math.sin(time+i)+1)*.19})`);}
 }
 private stirFlora(sim:SlimeSimulation,time:number){
  const dt=Math.min(.05,this.lastFlora?time-this.lastFlora:1/60);this.lastFlora=time;
  const bodies=sim.groups().map(g=>sim.center(g));
  for(const grass of this.grasses){
   let force=0;
   for(const s of bodies){if(Math.abs(grass.x-s.x)<30&&s.y<grass.y+10&&s.y>grass.y-72)force+=.6+Math.max(0,s.vy)/380;}
   grass.vPress+=(force-grass.press*22-grass.vPress*7)*dt;grass.press=Math.max(0,grass.press+grass.vPress*dt);
  }
  for(const p of this.props){
   const reach=p.kind==='mushroom'?42*p.s:p.kind==='fern'?28*p.s:14;
   const height=p.kind==='mushroom'?78*p.s:p.kind==='fern'?52*p.s:22;
   let hitSway=0,hitBounce=0;
   for(const s of bodies){
    const dx=s.x-p.x;if(Math.abs(dx)>reach+42)continue;
    if(s.y>p.y+18||s.y<p.y-height-40)continue;
    const near=1-Math.min(1,Math.abs(dx)/(reach+36));
    hitSway+=(dx>=0?1:-1)*near*(.95+Math.abs(s.vx)*.014);
    const stepping=s.y<p.y-height*.22&&Math.abs(dx)<reach+10;
    if(stepping)hitBounce+=.75*near+Math.max(0,s.vy)*.009;
    else if(Math.abs(dx)<reach)hitBounce+=.28*near;
   }
   p.vSway+=(-p.sway*26-p.vSway*5.5+hitSway*2.6)*dt;p.sway=Math.max(-.72,Math.min(.72,p.sway+p.vSway*dt));
   p.vBounce+=(-p.bounce*30-p.vBounce*6.2+hitBounce*3.4)*dt;p.bounce=Math.max(-.22,Math.min(.9,p.bounce+p.vBounce*dt));
  }
 }
 drawDetails(c:C,camera:number,time:number,sim:SlimeSimulation){
  this.stirFlora(sim,time);
  const centers=sim.groups().map(g=>sim.center(g));
  for(const grass of this.grasses){
   const x=grass.x-camera;if(x< -30||x>W+30)continue;let bend=Math.sin(time*1.8+grass.phase)*3;
   for(const s of centers){const d=grass.x-s.x;if(Math.abs(d)<65&&Math.abs(grass.y-s.y)<70)bend+=Math.sign(d)*Math.max(0,1-Math.abs(d)/65)*17+s.vx*.025;}
   const h=grass.h*Math.max(.32,1-grass.press);
   for(let i=-1;i<2;i++)path(c,[x+i*3,grass.y+3,x+i*4+bend,grass.y-h*(i===0?1:.65),x+i*3+3,grass.y+3],grass.color);
  }
  for(const p of this.props){
   const x=p.x-camera;if(x<-90||x>W+90)continue;
   const idle=Math.sin(time*2.1+p.phase)*(p.kind==='mushroom'?.018:.045);
   const squash=Math.max(-.32,Math.min(.48,p.bounce));
   c.save();c.translate(x,p.y);c.rotate(p.sway+idle);c.scale(1+squash*.15,1-squash*.24);
   if(p.kind==='mushroom')mushroom(c,0,0,p.s,p.color);
   else if(p.kind==='fern')fern(c,0,0,p.s,p.flip);
   else flower(c,0,0,p.s,p.color);
   c.restore();
  }
  for(const d of this.level.dew){if(d.got)continue;const x=d.x-camera,y=d.y+Math.sin(time*2+d.x)*4;if(x< -30||x>W+30)continue;
   const glow=c.createRadialGradient(x,y,1,x,y,23);glow.addColorStop(0,'#fff1ad66');glow.addColorStop(1,'#fff1ad00');c.fillStyle=glow;c.fillRect(x-23,y-23,46,46);
   c.fillStyle='#ffebad';c.beginPath();c.moveTo(x,y-9);c.bezierCurveTo(x+12,y+2,x+6,y+9,x,y+9);c.bezierCurveTo(x-8,y+9,x-9,y+2,x,y-9);c.fill();ellipse(c,x-2,y+1,1.5,3,'#fffbed');
  }
  this.level.plates.forEach((p,i)=>{const x=p.x-camera,on=this.level.plateActive[i]||this.level.gateOpen;
   ellipse(c,x,p.y-2,38,6,on?'#d5e89c':'#839673');c.strokeStyle=on?'#efffc1':'#b4c7a0';c.lineWidth=2;c.beginPath();c.ellipse(x,p.y-2,32,4,0,0,Math.PI*2);c.stroke();
   if(on){const glow=c.createRadialGradient(x,p.y-10,0,x,p.y-10,50);glow.addColorStop(0,'#d5efa52f');glow.addColorStop(1,'#d5efa500');c.fillStyle=glow;c.fillRect(x-50,p.y-60,100,100);}
   leaf(c,x,p.y-5,16,-.6,on?'#e2f5a7':'#74876b');leaf(c,x,p.y-5,16,.6,on?'#e2f5a7':'#74876b');
  });
  if(!this.level.gateOpen){const x=this.level.gate.x-camera;c.strokeStyle='#618b6a';c.lineWidth=7;
   for(let i=0;i<4;i++){c.beginPath();c.moveTo(x+i*9,417);c.bezierCurveTo(x-16+i*9,470,x+23+i*6,530,x+i*9,599);c.stroke();}
   for(let i=0;i<10;i++)leaf(c,x+15+Math.sin(i)*10,428+i*16,18,i%2?1:-1,'#84a36a');
  }
  if(this.level.checkpoint.x>2000){const x=this.level.checkpoint.x-camera;ellipse(c,x,597,17,3,'#dfedac55');c.fillStyle='#dcf3b4';c.fillRect(x-2,574,4,20);ellipse(c,x,574,5,5,'#f4ffce');}
  const hx=4090-camera;const glow=c.createRadialGradient(hx,555,5,hx,555,85);glow.addColorStop(0,'#e7e99999');glow.addColorStop(.5,'#c7dd7844');glow.addColorStop(1,'#bfde7300');c.fillStyle=glow;c.fillRect(hx-85,470,170,170);
 }
 drawWater(c:C,camera:number,time:number,sim:SlimeSimulation,front=false){
  const w=this.level.water,x=w.x-camera;if(x>W||x+w.w<0)return;
  if(!front){const g=c.createLinearGradient(0,w.y,0,w.y+w.h);g.addColorStop(0,'#96cabb80');g.addColorStop(1,'#427c7177');c.fillStyle=g;c.fillRect(x,w.y,w.w,w.h);return;}
  c.fillStyle='#a4ddd523';c.fillRect(x,w.y,w.w,w.h);
  c.strokeStyle='#e5f5d6a0';c.lineWidth=1.5;c.beginPath();
  for(let i=0;i<=w.w;i+=3){let dy=Math.sin(i*.043+time*2.2)*1.2;
   for(const g of sim.groups()){const p=sim.center(g);if(p.x>w.x&&p.x<w.x+w.w&&p.y>w.y-55)dy+=Math.sin((w.x+i-p.x)*.1-time*7)*Math.exp(-Math.abs(w.x+i-p.x)*.016)*4;}
   if(i===0)c.moveTo(x+i,w.y+dy);else c.lineTo(x+i,w.y+dy);
  }c.stroke();c.strokeStyle='#d6eee055';
  for(let i=0;i<8;i++){const px=x+30+i*59+Math.sin(time+i)*5;c.beginPath();c.moveTo(px,w.y+12+(i%3)*15);c.lineTo(px+21,w.y+12+(i%3)*15);c.stroke();}
 }
}
