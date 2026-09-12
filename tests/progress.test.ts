import {describe,expect,it} from 'vitest';
import {CATALOG,levelById} from '../src/catalog';
import {DEFAULT_BINDINGS,defaultProgress,isPlayable,isUnlocked,keyLabel,loadProgress,markCleared,nextPlayable,saveProgress} from '../src/progress';
import {PlayerInput} from '../src/input';

function memory(){
 const data=new Map<string,string>();
 return {
  getItem:(key:string)=>data.get(key)??null,
  setItem:(key:string,value:string)=>{data.set(key,value);},
 };
}

describe('catalog',()=>{
 it('lists ten chapters and only the first two are ready',()=>{
  expect(CATALOG).toHaveLength(10);
  expect(CATALOG.filter(l=>l.status==='ready').map(l=>l.id)).toEqual(['forest','honey']);
  expect(levelById('moon')?.name).toBe('月下归途');
 });
});

describe('progress',()=>{
 it('unlocks forest and honey by default, and keeps coming levels locked',()=>{
  const progress=defaultProgress();
  expect(isUnlocked('forest',progress)).toBe(true);
  expect(isUnlocked('honey',progress)).toBe(true);
  expect(isPlayable(CATALOG[2],progress)).toBe(false);
  expect(isUnlocked('tide',markCleared('honey',progress))).toBe(false);
 });

 it('persists name, bindings and cleared levels',()=>{
  const store=memory();
  const next=markCleared('forest',{...defaultProgress(),name:'露团',bindings:{...DEFAULT_BINDINGS,jump:'KeyK'},lastLevel:'honey'});
  saveProgress(next,store);
  const loaded=loadProgress(store);
  expect(loaded.name).toBe('露团');
  expect(loaded.cleared).toEqual(['forest']);
  expect(loaded.bindings.jump).toBe('KeyK');
  expect(loaded.lastLevel).toBe('honey');
  expect(keyLabel('KeyK')).toBe('K');
  expect(keyLabel('Space')).toBe('Space');
 });

 it('migrates the legacy slime name',()=>{
  const store=memory();
  store.setItem('slime-fable-name','果冻');
  expect(loadProgress(store).name).toBe('果冻');
 });

 it('points to the next playable ready level',()=>{
  const progress=defaultProgress();
  expect(nextPlayable('forest',progress)?.id).toBe('honey');
  expect(nextPlayable('honey',progress)).toBeUndefined();
 });
});

describe('input',()=>{
 it('maps rebound keys and keeps arrow aliases',()=>{
  const input=new PlayerInput({...DEFAULT_BINDINGS,left:'KeyJ',right:'KeyL'},'keyboard',()=>[]);
  input.keyDown('KeyL');
  input.keyDown('ArrowLeft');
  const frame=input.consume();
  expect(frame.move).toBe(0);
  input.keyUp('ArrowLeft');
  expect(input.consume().move).toBe(1);
 });

 it('emits jump only on the press edge',()=>{
  const input=new PlayerInput(DEFAULT_BINDINGS,'keyboard',()=>[]);
  input.keyDown('Space');
  const first=input.consume();
  expect(first.jump).toBe(true);
  expect(first.jumpHeld).toBe(true);
  expect(input.consume().jump).toBe(false);
  expect(input.consume().jumpHeld).toBe(true);
 });

 it('locks scheme when preference is not auto',()=>{
  const input=new PlayerInput(DEFAULT_BINDINGS,'keyboard',()=>[]);
  input.note('touch');
  expect(input.scheme).toBe('keyboard');
  input.setPref('touch');
  expect(input.scheme).toBe('touch');
 });
});
