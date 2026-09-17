import {isRunResult,type RunResult} from '../run';

export type ToyRankItem={rank:number;score:number;nickname:string;avatar:string};
export type ToyMyRank={ranked:boolean;rank:number;score:number};
export type ToySdk={
 isSupport?(ability:string):Promise<boolean>;
 submitScore?(req:{board:number;score:number}):Promise<{score:number}>;
 getRankList?(req:{board:number;period:'all'|'month'|'week'|'day';limit:number}):Promise<ToyRankItem[]>;
 getMyRank?(req:{board:number;period:'all'|'month'|'week'|'day'}):Promise<ToyMyRank>;
 getCloudStorage?(keys?:string[]):Promise<Record<string,string>>;
 setCloudStorage?(items:Record<string,string>):Promise<void>;
 onContainerChange?(listener:(state:unknown)=>void):()=>void;
 setContainerMode?(req:{orientation:'landscape';immersive:true}):Promise<void>;
};

const BOARDS:Record<string,number>={forest:1,honey:2,tide:3,wind:4,mirror:5};
const wait=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
function error(code:string,message:string){return Object.assign(new Error(message),{code,userMessage:message});}
function realSdk(sdk?:ToySdk):ToySdk|undefined{return sdk??(typeof window!=='undefined'?(window as Window&{toy?:ToySdk}).toy:undefined);}

export class ToyService{
 private sdk?:ToySdk;
 private submitted=new Map<string,Promise<{score:number}>>();
 private successful=new Map<string,{score:number}>();
 private rankCache=new Map<string,{list:ToyRankItem[];mine?:ToyMyRank}>();
 lastError?:Error & {code?:string;userMessage?:string};
 constructor(sdk?:ToySdk){this.sdk=realSdk(sdk);}
 async supported(ability:string){if(!this.sdk?.isSupport)return false;try{return await this.sdk.isSupport(ability);}catch{return false;}}
 async submit(result:RunResult){
  if(!isRunResult(result)||!result.eligible)throw this.remember(error('ineligible','本次挑战不符合正式榜单条件'));
  const previous=this.successful.get(result.runId);if(previous)return previous;
  const pending=this.submitted.get(result.runId);if(pending)return pending;
  if(!this.sdk?.submitScore)throw this.remember(error('sdk_unavailable','当前环境暂不支持排行榜'));
  const board=BOARDS[result.levelId];if(!board)throw this.remember(error('ineligible','该关卡没有正式榜位'));
  const task=this.submitWithRetry(board,result.breakdown.total).then(()=>{const answer={score:result.breakdown.total};this.successful.set(result.runId,answer);return answer;}).finally(()=>this.submitted.delete(result.runId));
  this.submitted.set(result.runId,task);return task;
 }
 async ranks(levelId:string,period:'all'|'month'|'week'|'day'='all',refresh=false){
  const key=`${levelId}:${period}`;const cached=this.rankCache.get(key);if(cached&&!refresh)return cached;
  const board=BOARDS[levelId];if(!board||!this.sdk?.getRankList)return {list:[]};
  try{
   const list=await this.sdk.getRankList({board,period,limit:50});
   let mine:ToyMyRank|undefined;
   if(this.sdk.getMyRank){try{mine=await this.sdk.getMyRank({board,period});}catch{/*游客榜单可读*/}}
   const answer={list:[...list],mine};this.rankCache.set(key,answer);return answer;
  }catch(caught){throw this.remember(caught);}
 }
 async loadCloud(){if(!this.sdk?.getCloudStorage)return {};try{return await this.sdk.getCloudStorage();}catch(caught){this.remember(caught);return {};}}
 async saveCloud(values:Record<string,string>){if(!this.sdk?.setCloudStorage)return;try{await this.sdk.setCloudStorage(values);}catch(caught){this.remember(caught);}}
 async configureContainer(listener:(state:unknown)=>void){
  if(!this.sdk||!(await this.supported('onContainerChange'))||!(await this.supported('setContainerMode')))return ()=>{};
  const off=this.sdk.onContainerChange?.(listener)??(()=>{});
  try{await this.sdk.setContainerMode?.({orientation:'landscape',immersive:true});}catch(caught){this.remember(caught);}
  return off;
 }
 private async submitWithRetry(board:number,score:number){
  let delay=100;
  for(let attempt=0;attempt<3;attempt++){
   try{return await this.sdk!.submitScore!({board,score});}
   catch(caught){
    const e=caught as {type?:string;code?:number|string};
    const retryable=e?.code===307044||e?.type==='network_error'||e?.type==='timeout';
    if(!retryable||attempt===2)throw this.remember(caught);
    await wait(delay);delay*=2;
   }
  }
  throw error('submit_failed','排行榜提交失败');
 }
 private remember(caught:unknown){const e=caught instanceof Error?caught:error('toy_error','Toy 服务调用失败');this.lastError=e as Error & {code?:string;userMessage?:string};return e;}
}
