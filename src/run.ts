export type ScoreTargets={collect:Record<string,number>;events:string[];feats:Record<string,number>};

export type ScoreBreakdown={collect:number;events:number;feats:number;clear:number;speed:number;total:number};

export type RunResult={
 runId:string;
 levelId:string;
 contentVersion:string;
 eligible:boolean;
 activeSeconds:number;
 effectiveSeconds:number;
 resets:number;
 collectedIds:string[];
 eventIds:string[];
 featIds:string[];
 breakdown:ScoreBreakdown;
 badges:string[];
 completedAt:number;
};

const FORMAL_LEVELS=new Set(['forest','honey','tide','wind','mirror']);
const MAX_SCORE=10_000;
const ID_PATTERN=/^[^\u0000-\u001f\u007f]{1,128}$/u;

function validId(id:unknown):id is string{
 return typeof id==='string'&&ID_PATTERN.test(id)&&id!=='__proto__'&&id!=='prototype'&&id!=='constructor';
}

function randomRunId(){
 if(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function')return crypto.randomUUID();
 return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function cloneTargets(targets:ScoreTargets):ScoreTargets{
 if(!targets||typeof targets!=='object'||!targets.collect||!targets.feats||!Array.isArray(targets.events))throw new TypeError('Invalid score targets');
 const collect:Record<string,number>=Object.create(null) as Record<string,number>;
 const feats:Record<string,number>=Object.create(null) as Record<string,number>;
 for(const [id,weight] of Object.entries(targets.collect)){
  if(!validId(id)||!Number.isFinite(weight)||weight<=0||weight>1_000_000)throw new TypeError('Invalid collect target');
  collect[id]=weight;
 }
 for(const [id,weight] of Object.entries(targets.feats)){
  if(!validId(id)||!Number.isFinite(weight)||weight<=0||weight>1_000_000)throw new TypeError('Invalid feat target');
  feats[id]=weight;
 }
 const events:string[]=[];
 const seen=new Set<string>();
 for(const id of targets.events){
  if(!validId(id))throw new TypeError('Invalid event target');
  if(!seen.has(id)){seen.add(id);events.push(id);}
 }
 return {collect,events,feats};
}

function weightedScore(ids:Set<string>,targets:Record<string,number>,ceiling:number){
 const entries=Object.entries(targets);
 const total=entries.reduce((sum,[,weight])=>sum+weight,0);
 if(total<=0)return 0;
 const earned=entries.reduce((sum,[id,weight])=>sum+(ids.has(id)?weight:0),0);
 return Math.floor(ceiling*earned/total);
}

function freezeResult(result:RunResult):RunResult{
 Object.freeze(result.collectedIds);
 Object.freeze(result.eventIds);
 Object.freeze(result.featIds);
 Object.freeze(result.badges);
 Object.freeze(result.breakdown);
 return Object.freeze(result);
}

function finiteInRange(value:unknown,min:number,max:number):value is number{
 return typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;
}

function validStringArray(value:unknown,max=512):value is string[]{
 return Array.isArray(value)&&value.length<=max&&value.every(validId)&&new Set(value).size===value.length;
}

export function isRunResult(value:unknown):value is RunResult{
 if(!value||typeof value!=='object')return false;
 const run=value as Partial<RunResult>;
 if(!validId(run.runId)||!validId(run.levelId)||!validId(run.contentVersion)||typeof run.eligible!=='boolean')return false;
 if(!finiteInRange(run.activeSeconds,0,31_536_000)||!finiteInRange(run.effectiveSeconds,0,31_536_000))return false;
 if(!Number.isInteger(run.resets)||!finiteInRange(run.resets,0,1_000_000))return false;
 if(run.effectiveSeconds+1e-9<run.activeSeconds+run.resets*5)return false;
 if(!validStringArray(run.collectedIds)||!validStringArray(run.eventIds)||!validStringArray(run.featIds)||!validStringArray(run.badges,16))return false;
 if(!finiteInRange(run.completedAt,0,10_000_000_000_000))return false;
 const b=run.breakdown;
 if(!b||typeof b!=='object')return false;
 const fields:[unknown,number][]=[[b.collect,4000],[b.events,2000],[b.feats,1500],[b.clear,500],[b.speed,2000],[b.total,MAX_SCORE]];
 if(fields.some(([score,max])=>!Number.isInteger(score)||!finiteInRange(score,0,max)))return false;
 return b.total===b.collect+b.events+b.feats+b.clear+b.speed;
}

export class RunSession{
 private readonly targets:ScoreTargets;
 private readonly collected=new Set<string>();
 private readonly events=new Set<string>();
 private readonly feats=new Set<string>();
 private readonly runId=randomRunId();
 private seconds=0;
 private resetCount=0;
 private allowed:boolean;
 private finished?:RunResult;

 constructor(
  readonly levelId:string,
  targets:ScoreTargets,
  eligible:boolean,
  readonly contentVersion='living-v1',
 ){
  if(!validId(levelId)||!validId(contentVersion))throw new TypeError('Invalid run identity');
  this.targets=cloneTargets(targets);
  this.allowed=eligible&&FORMAL_LEVELS.has(levelId);
 }

 get result(){return this.finished;}
 get activeSeconds(){return this.seconds;}
 get effectiveSeconds(){return this.seconds+this.resetCount*5;}
 get contentScore(){const {collect,events,feats}=this.scoreContent();return collect+events+feats;}

 advance(seconds:number,active:boolean):void{
  if(!Number.isFinite(seconds)||seconds<0)throw new RangeError('Seconds must be finite and non-negative');
  if(this.finished||!active)return;
  const next=this.seconds+seconds;
  if(!Number.isFinite(next)||next>31_536_000)throw new RangeError('Run time exceeds safe range');
  this.seconds=next;
 }

 award(kind:'collect'|'event'|'feat',id:string):boolean{
  if(this.finished||!validId(id))return false;
  const [targets,earned]=kind==='collect'
   ?[this.targets.collect,this.collected] as const
   :kind==='event'
    ?[this.targets.events,this.events] as const
    :[this.targets.feats,this.feats] as const;
  const known=Array.isArray(targets)?targets.includes(id):Object.hasOwn(targets,id);
  if(!known||earned.has(id))return false;
  earned.add(id);
  return true;
 }

 rewind():void{
  if(this.finished)return;
  this.resetCount++;
 }

 invalidate():void{
  if(!this.finished)this.allowed=false;
 }

 preview():ScoreBreakdown{
  const content=this.scoreContent();
  return {...content,clear:0,speed:0,total:content.collect+content.events+content.feats};
 }

 finish():RunResult{
  if(this.finished)return this.finished;
  const content=this.scoreContent();
  const base=this.levelId==='forest'||this.levelId==='honey'?360:480;
  const speed=Math.floor(2000*Math.max(0,1-this.effectiveSeconds/base));
  const badges=['clear'];
  if(Object.keys(this.targets.collect).length>0&&this.collected.size===Object.keys(this.targets.collect).length)badges.push('collector');
  if(this.targets.events.length>0&&this.events.size===this.targets.events.length)badges.push('ecologist');
  if(Object.keys(this.targets.feats).length>0&&this.feats.size===Object.keys(this.targets.feats).length)badges.push('challenger');
  const breakdown:ScoreBreakdown={...content,clear:500,speed,total:content.collect+content.events+content.feats+500+speed};
  this.finished=freezeResult({
   runId:this.runId,levelId:this.levelId,contentVersion:this.contentVersion,eligible:this.allowed,
   activeSeconds:this.seconds,effectiveSeconds:this.effectiveSeconds,resets:this.resetCount,
   collectedIds:[...this.collected],eventIds:[...this.events],featIds:[...this.feats],
   breakdown,badges,completedAt:Date.now(),
  });
  return this.finished;
 }

 private scoreContent(){
  const collect=weightedScore(this.collected,this.targets.collect,4000);
  const events=this.targets.events.length?Math.floor(2000*this.events.size/this.targets.events.length):0;
  const feats=weightedScore(this.feats,this.targets.feats,1500);
  return {collect,events,feats};
 }
}
