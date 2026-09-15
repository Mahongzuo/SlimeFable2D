import {FOREST_LAYOUT} from './forest';
import type {LevelLayout} from '../types';
import variantB from './variant-b.json';
import variantC from './variant-c.json';

export const FOREST_VARIANTS:{a:LevelLayout;b:LevelLayout;c:LevelLayout}={
 a:FOREST_LAYOUT,
 b:variantB as LevelLayout,
 c:variantC as LevelLayout,
};

export function forestVariant(id:'a'|'b'|'c'='a'){return FOREST_VARIANTS[id];}
