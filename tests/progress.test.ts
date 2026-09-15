import {describe,expect,it} from 'vitest';
import {CATALOG,levelById} from '../src/catalog';
import {DEFAULT_BINDINGS,defaultProgress,isPlayable,isUnlocked,keyLabel,loadProgress,markCleared,nextPlayable,saveProgress,TEST_ALL_LEVELS} from '../src/progress';
import {PlayerInput} from '../src/input';

function memory(){
 const data=new Map<string,string>();
 return {
  getItem:(key:string)=>data.get(key)??null,
  setItem:(key:string,value:string)=>{data.set(key,value);},
 };
}

describe('catalog',()=>{
 it('lists ten chapters and the first five are ready',()=>{
  expect(CATALOG).toHaveLength(10);
  expect(CATALOG.filter(l=>l.status==='ready').map(l=>l.id)).toEqual(['forest','honey','tide','wind','mirror']);
  expect(levelById('moon')?.name).toBe('月下归途');
 });
});

describe('progress',()=>{
 it('unlocks forest and honey by default, and opens tide after honey',()=>{
  const progress=defaultProgress();
  expect(isUnlocked('forest',progress)).toBe(true);
  expect(isUnlocked('honey',progress)).toBe(true);
  if(TEST_ALL_LEVELS){
   expect(isPlayable(CATALOG[2],progress)).toBe(true);
   expect(isPlayable(CATALOG[4],progress)).toBe(true);
   return;
  }
  expect(isPlayable(CATALOG[2],progress)).toBe(false);
  expect(isUnlocked('tide',markCleared('honey',progress))).toBe(true);
  expect(isPlayable(CATALOG[3],markCleared('honey',progress))).toBe(false);
 });

 it('persists name, bindings and cleared levels',()=>{
  const store=memory();
  const next=markCleared('forest',{...defaultProgress(),name:'露团',bindings:{...DEFAULT_BINDINGS,jump:'KeyK'},lastLevel:'honey',souvenirs:['mossheart']});
  saveProgress(next,store);
  const loaded=loadProgress(store);
  expect(loaded.name).toBe('露团');
  expect(loaded.cleared).toEqual(['forest']);
  expect(loaded.bindings.jump).toBe('KeyK');
  expect(loaded.lastLevel).toBe('honey');
  expect(loaded.souvenirs).toEqual(['mossheart']);
  expect(loaded.bindings.melee).toBe('KeyJ');
  expect(keyLabel('KeyK')).toBe('K');
  expect(keyLabel('Space')).toBe('Space');
 });

 it('fills missing souvenirs and new bindings on old saves',()=>{
  const store=memory();
  store.setItem('slime-fable-progress',JSON.stringify({name:'露团',cleared:[],lastLevel:'forest',bindings:{left:'KeyA'}}));
  const loaded=loadProgress(store);
  expect(loaded.souvenirs).toEqual([]);
  expect(loaded.bindings.inventory).toBe('KeyI');
  expect(loaded.bindings.dodge).toBe('ShiftLeft');
  expect(loaded.soundOn).toBe(true);
  expect(loaded.sfxVol).toBeGreaterThan(.5);
  expect(loaded.musicVol).toBeGreaterThan(.5);
 });

 it('migrates the legacy slime name',()=>{
  const store=memory();
  store.setItem('slime-fable-name','果冻');
  expect(loadProgress(store).name).toBe('果冻');
 });

 it('points to the next playable ready level',()=>{
  const progress=defaultProgress();
  expect(nextPlayable('forest',progress)?.id).toBe('honey');
  if(TEST_ALL_LEVELS){
   expect(nextPlayable('honey',progress)?.id).toBe('tide');
   expect(nextPlayable('wind',progress)?.id).toBe('mirror');
   return;
  }
  expect(nextPlayable('honey',progress)).toBeUndefined();
  expect(nextPlayable('honey',markCleared('honey',progress))?.id).toBe('tide');
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
