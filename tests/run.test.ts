import {describe,expect,it} from 'vitest';
import {RunSession} from '../src/run';

describe('RunSession',()=>{
 it('scores every category to the 10,000 point ceiling',()=>{
  const run=new RunSession('forest',{collect:{dew:1,relic:3},events:['rescue'],feats:{pacifist:2}},true);
  expect(run.award('collect','dew')).toBe(true);
  expect(run.award('collect','relic')).toBe(true);
  expect(run.award('event','rescue')).toBe(true);
  expect(run.award('feat','pacifist')).toBe(true);
  const result=run.finish();
  expect(result.breakdown).toEqual({collect:4000,events:2000,feats:1500,clear:500,speed:2000,total:10000});
  expect(result.badges).toEqual(['clear','collector','ecologist','challenger']);
 });

 it('weights collections, floors partial scores, and gives empty categories no badge',()=>{
  const run=new RunSession('tide',{collect:{small:1,large:2},events:[],feats:{}},true);
  run.award('collect','small');
  expect(run.preview()).toEqual({collect:1333,events:0,feats:0,clear:0,speed:0,total:1333});
  expect(run.finish().badges).toEqual(['clear']);
 });

 it('tracks only active time, applies rewind penalties, and clamps speed at zero',()=>{
  const paused=new RunSession('forest',{collect:{},events:[],feats:{}},true);
  paused.advance(20,true);
  paused.advance(100,false);
  paused.rewind();
  expect(paused.activeSeconds).toBe(20);
  expect(paused.effectiveSeconds).toBe(25);
  expect(paused.finish().breakdown.speed).toBe(Math.floor(2000*(1-25/360)));

  const slow=new RunSession('mirror',{collect:{},events:[],feats:{}},true);
  slow.advance(480.9,true);
  expect(slow.finish().breakdown.speed).toBe(0);
 });

 it('rejects invalid time and unknown ids without mutating state',()=>{
  const run=new RunSession('forest',{collect:{known:1},events:['event'],feats:{feat:1}},true);
  expect(()=>run.advance(-1,true)).toThrow(RangeError);
  expect(()=>run.advance(Number.NaN,true)).toThrow(RangeError);
  expect(()=>run.advance(Number.POSITIVE_INFINITY,true)).toThrow(RangeError);
  expect(run.award('collect','missing')).toBe(false);
  expect(run.award('event','missing')).toBe(false);
  expect(run.award('feat','missing')).toBe(false);
  expect(run.contentScore).toBe(0);
 });

 it('deduplicates awards and freezes all state after finish',()=>{
  const run=new RunSession('forest',{collect:{dew:1},events:[],feats:{}},true);
  expect(run.award('collect','dew')).toBe(true);
  expect(run.award('collect','dew')).toBe(false);
  const first=run.finish();
  run.advance(99,true);
  run.rewind();
  run.invalidate();
  expect(run.award('collect','dew')).toBe(false);
  expect(run.finish()).toBe(first);
  expect(run.activeSeconds).toBe(0);
  expect(first.eligible).toBe(true);
  expect(Object.isFrozen(first)).toBe(true);
  expect(Object.isFrozen(first.collectedIds)).toBe(true);
 });

 it('invalidates custom levels and can invalidate formal runs before completion',()=>{
  const custom=new RunSession('custom:one',{collect:{},events:[],feats:{}},true);
  expect(custom.finish().eligible).toBe(false);
  const formal=new RunSession('honey',{collect:{},events:[],feats:{}},true);
  formal.invalidate();
  expect(formal.finish().eligible).toBe(false);
 });

 it('does not expose mutable target or result state',()=>{
  const targets={collect:{dew:1},events:['rescue'],feats:{kind:1}};
  const run=new RunSession('honey',targets,true);
  targets.collect.dew=100;
  targets.events.push('later');
  expect(run.award('event','later')).toBe(false);
  run.award('collect','dew');
  const result=run.finish();
  expect(()=>{(result.collectedIds as string[]).push('fake');}).toThrow();
  expect(run.result?.collectedIds).toEqual(['dew']);
 });
});
