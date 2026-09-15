import {describe,expect,it} from 'vitest';
import {CATEGORY_LABEL,KIT_CATEGORIES} from '../src/kit/defs';
import {comingKitChapters,filterKit,kitById,kitChapters,KIT,knownKit} from '../src/kit/register';

describe('kit catalog',()=>{
 it('registers all five ready chapters and every category',()=>{
  const chapters=kitChapters();
  expect(chapters).toEqual(expect.arrayContaining(['forest','honey','tide','wind','mirror']));
  for(const cat of KIT_CATEGORIES)expect(filterKit(cat).length).toBeGreaterThan(0);
  expect(KIT.every(k=>k.mark&&k.name&&k.id)).toBe(true);
  expect(knownKit('forest-grass')).toBe(true);
  expect(knownKit('tide-coral')).toBe(true);
  expect(knownKit('honey-lantern')).toBe(true);
  expect(knownKit('souvenir-windbell')).toBe(true);
  expect(knownKit('wind-isle')).toBe(true);
  expect(knownKit('wind-mill')).toBe(true);
  expect(knownKit('mirror-crystal')).toBe(true);
  expect(knownKit('souvenir-mirrorstar')).toBe(true);
  expect(kitById('missing')).toBeUndefined();
  expect(comingKitChapters().map(e=>e.id)).toEqual(expect.arrayContaining(['candy','moon']));
  expect(comingKitChapters().map(e=>e.id)).not.toContain('mirror');
  expect(CATEGORY_LABEL.flora).toBe('草木');
 });
});
