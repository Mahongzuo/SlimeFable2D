export type MoodId='idle'|'move'|'jump'|'attack'|'hurt'|'happy'|'spit'|'focus';
export type Mouth='smile'|'flat'|'o'|'frown'|'grin'|'squint';

export type FacePose={
 id:MoodId;
 eyeH:number;
 eyeW:number;
 brow:number;
 mouth:Mouth;
 curve:number;
 blush:number;
 look:number;
};

const POSES:Record<MoodId,Omit<FacePose,'id'|'look'>>={
 idle:{eyeH:4.1,eyeW:2.7,brow:0,mouth:'smile',curve:8,blush:0},
 move:{eyeH:3.6,eyeW:2.9,brow:.2,mouth:'smile',curve:7,blush:0},
 jump:{eyeH:4.6,eyeW:2.5,brow:.4,mouth:'o',curve:2,blush:0},
 attack:{eyeH:2.4,eyeW:3.2,brow:-.8,mouth:'grin',curve:3,blush:.15},
 hurt:{eyeH:1.4,eyeW:3.4,brow:-.4,mouth:'frown',curve:2,blush:.4},
 happy:{eyeH:1.1,eyeW:3.2,brow:.7,mouth:'grin',curve:10,blush:.35},
 spit:{eyeH:4.8,eyeW:2.4,brow:.3,mouth:'o',curve:1,blush:0},
 focus:{eyeH:3.2,eyeW:2.8,brow:-.3,mouth:'flat',curve:5,blush:0},
};

export class MoodDirector {
 id:MoodId='idle';
 until=0;
 pri=0;
 time=0;
 pulse(id:MoodId,dur:number,pri:number){
  if(pri<this.pri&&this.time<this.until)return;
  this.id=id;this.until=this.time+dur;this.pri=pri;
 }
 tick(dt:number,sense:{move:number;ground:boolean;hurt:number}){
  this.time+=dt;
  if(sense.hurt>0)this.pulse('hurt',.12,90);
  if(this.time>=this.until){
   this.pri=0;
   this.id=sense.hurt>0?'hurt':!sense.ground?'jump':Math.abs(sense.move)>.2?'move':'idle';
  }
 }
 pose(look=0):FacePose{
  return {id:this.id,look,...POSES[this.id]};
 }
}
