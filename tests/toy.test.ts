import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {RunSession,type RunResult} from '../src/run';
import {ToyService,type ToySdk} from '../src/platform/toy';

function completed(level='forest',seconds=1):RunResult{
 const run=new RunSession(level,{collect:{dew:1},events:[],feats:{}},true);
 run.award('collect','dew');
 run.advance(seconds,true);
 return run.finish();
}

function sdk(overrides:Partial<ToySdk>={}):ToySdk{
 return {
  isSupport:vi.fn(async()=>true),
  submitScore:vi.fn(async req=>({score:req.score})),
  getRankList:vi.fn(async()=>[{rank:1,score:999,nickname:'露团',avatar:'avatar'}]),
  getMyRank:vi.fn(async()=>({ranked:true,rank:3,score:500})),
  getCloudStorage:vi.fn(async()=>({save:'ok'})),
  setCloudStorage:vi.fn(async()=>{}),
  onContainerChange:vi.fn(()=>()=>{}),
  setContainerMode:vi.fn(async()=>{}),
  ...overrides,
 };
}

describe('ToyService score submission',()=>{
 it('maps all five level boards and submits the current absolute score even when lower',async()=>{
  const fake=sdk({submitScore:vi.fn(async()=>({score:9999}))});
  const service=new ToyService(fake);
  const levels=['forest','honey','tide','wind','mirror'];
  for(const level of levels)await service.submit(completed(level,300));
  expect(fake.submitScore).toHaveBeenCalledTimes(5);
  expect(vi.mocked(fake.submitScore).mock.calls.map(([req])=>req.board)).toEqual([1,2,3,4,5]);
  const submitted=vi.mocked(fake.submitScore).mock.calls[0][0].score;
  expect(submitted).toBeLessThan(9999);
 });

 it('returns the submitted run score rather than the platform historical-best receipt',async()=>{
  const fake=sdk({submitScore:vi.fn(async()=>({score:10000}))});
  const run=completed('forest',300);
  const answer=await new ToyService(fake).submit(run);
  expect(answer.score).toBe(run.breakdown.total);
 });

 it('rejects ineligible/tampered results and allows a failed run to be retried',async()=>{
  const submit=vi.fn().mockRejectedValueOnce(Object.assign(new Error('denied'),{type:'auth_denied'})).mockResolvedValueOnce({score:4});
  const service=new ToyService(sdk({submitScore:submit}));
  const invalid=completed('custom:level');
  await expect(service.submit(invalid)).rejects.toMatchObject({code:'ineligible'});
  const run=completed();
  await expect(service.submit(run)).rejects.toThrow('denied');
  await expect(service.submit(run)).resolves.toEqual({score:run.breakdown.total});
  expect(submit).toHaveBeenCalledTimes(2);
 });

 it('shares concurrent requests and prevents another submission after success',async()=>{
  let release:(value:{score:number})=>void=()=>{};
  const pending=new Promise<{score:number}>(resolve=>{release=resolve;});
  const submit=vi.fn(()=>pending);
  const service=new ToyService(sdk({submitScore:submit}));
  const run=completed();
  const one=service.submit(run);
  const two=service.submit(run);
  expect(submit).toHaveBeenCalledTimes(1);
  release({score:run.breakdown.total});
  await expect(Promise.all([one,two])).resolves.toEqual([{score:run.breakdown.total},{score:run.breakdown.total}]);
  await expect(service.submit(run)).resolves.toEqual({score:run.breakdown.total});
  expect(submit).toHaveBeenCalledTimes(1);
 });

 it('retries rate limits with bounded exponential backoff but not invalid params',async()=>{
  vi.useFakeTimers();
  const limited=Object.assign(new Error('slow down'),{type:'http_error',code:307044});
  const submit=vi.fn().mockRejectedValueOnce(limited).mockRejectedValueOnce(limited).mockResolvedValue({score:5});
  const service=new ToyService(sdk({submitScore:submit}));
  const promise=service.submit(completed());
  await vi.runAllTimersAsync();
  await expect(promise).resolves.toBeDefined();
  expect(submit).toHaveBeenCalledTimes(3);

  const invalid=vi.fn().mockRejectedValue(Object.assign(new Error('bad'),{type:'invalid_param'}));
  await expect(new ToyService(sdk({submitScore:invalid})).submit(completed())).rejects.toThrow('bad');
  expect(invalid).toHaveBeenCalledTimes(1);
 });
});

describe('ToyService platform helpers',()=>{
 beforeEach(()=>vi.useRealTimers());
 afterEach(()=>vi.restoreAllMocks());

 it('reads rankings for guests, caches them, refreshes on request, and preserves ranked=false',async()=>{
  const getRankList=vi.fn(async()=>[{rank:1,score:10,nickname:'n',avatar:'a'}]);
  const service=new ToyService(sdk({getRankList,getMyRank:vi.fn(async()=>{throw Object.assign(new Error('guest'),{type:'not_logged_in'});})}));
  const first=await service.ranks('honey','week');
  expect(first.list).toHaveLength(1);
  expect(first.mine).toBeUndefined();
  await service.ranks('honey','week');
  expect(getRankList).toHaveBeenCalledTimes(1);
  await service.ranks('honey','week',true);
  expect(getRankList).toHaveBeenCalledTimes(2);

  const unranked=await new ToyService(sdk({getMyRank:vi.fn(async()=>({ranked:false,rank:0,score:0}))})).ranks('forest');
  expect(unranked.mine?.ranked).toBe(false);
 });

 it('loads/saves cloud in one batch and exposes a displayable missing-SDK error',async()=>{
  const fake=sdk();
  const service=new ToyService(fake);
  await expect(service.loadCloud()).resolves.toEqual({save:'ok'});
  await service.saveCloud({a:'1',b:'2'});
  expect(fake.setCloudStorage).toHaveBeenCalledWith({a:'1',b:'2'});

  const missing=new ToyService(undefined);
  expect(await missing.supported('submitScore')).toBe(false);
  await expect(missing.loadCloud()).resolves.toEqual({});
  await expect(missing.saveCloud({a:'1'})).resolves.toBeUndefined();
  await expect(missing.submit(completed())).rejects.toMatchObject({code:'sdk_unavailable',userMessage:expect.any(String)});
  expect(missing.lastError?.userMessage).toBeTruthy();
 });

 it('subscribes before requesting landscape immersive mode and returns cleanup',async()=>{
  const order:string[]=[];
  const off=vi.fn();
  const fake=sdk({
   isSupport:vi.fn(async ability=>ability==='onContainerChange'||ability==='setContainerMode'),
   onContainerChange:vi.fn(()=>{order.push('listen');return off;}),
   setContainerMode:vi.fn(async()=>{order.push('request');}),
  });
  const service=new ToyService(fake);
  const cleanup=await service.configureContainer(()=>{});
  expect(order).toEqual(['listen','request']);
  expect(fake.setContainerMode).toHaveBeenCalledWith({orientation:'landscape',immersive:true});
  cleanup();
  expect(off).toHaveBeenCalledOnce();
 });
});
