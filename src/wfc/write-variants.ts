import {writeFileSync} from 'node:fs';
import {FOREST_LAYOUT} from '../content/chapter1/forest';
import {bakeForest} from './bake';

const out=new URL('../content/chapter1/',import.meta.url);
writeFileSync(new URL('variant-a.json',out),JSON.stringify(FOREST_LAYOUT,null,2));
const b=bakeForest(11),c=bakeForest(29);
if(!b||!c)throw new Error('WFC bake failed');
writeFileSync(new URL('variant-b.json',out),JSON.stringify(b,null,2));
writeFileSync(new URL('variant-c.json',out),JSON.stringify(c,null,2));
console.log('baked',b.base.length,c.base.length);
