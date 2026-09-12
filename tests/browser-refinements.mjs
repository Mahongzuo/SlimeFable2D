import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const state=()=>page.evaluate(()=>window.__slime());
const logs=[];
async function go(x,key='d'){await page.keyboard.down(key);let ok=false;for(let i=0;i<250;i++){const s=await state();if(key==='d'?s.center.x>=x:s.center.x<=x){ok=true;break;}await page.waitForTimeout(60);}await page.keyboard.up(key);assert(ok,`Reach ${x}`);}
try{
 await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});await page.getByRole('button',{name:'开始小小冒险'}).click();await page.waitForTimeout(500);
 const original=await state();assert.equal(original.particles.length,441);
 await page.keyboard.press('Space');await page.waitForTimeout(270);await page.keyboard.press('Space');await page.waitForTimeout(80);assert((await state()).center.vy<-300);await page.screenshot({path:'output/v2-double-jump.png'});
 await page.waitForTimeout(1100);await page.keyboard.press('q');await page.waitForTimeout(450);
 await page.keyboard.press('1');assert.equal((await state()).activeGroup,0);await page.keyboard.press('c');assert.equal((await state()).activeGroup,1);
 await page.getByRole('button',{name:'1 号',exact:true}).click();assert.equal((await state()).activeGroup,0);
 const p=(await state()).groups.find(g=>g.id===1),camera=(await state()).camera;
 const bounds=await page.locator('#game').boundingBox();await page.mouse.click(bounds.x+(p.x-camera)/1280*bounds.width,bounds.y+p.y/720*bounds.height);assert.equal((await state()).activeGroup,1);
 await page.screenshot({path:'output/v2-body-selection.png'});await page.keyboard.press('r');await page.waitForTimeout(400);
 await go(787);await page.keyboard.down('d');await page.keyboard.down('w');await page.waitForTimeout(600);await page.keyboard.up('d');await page.keyboard.up('w');
 let s=await state();assert(s.center.y<550,'climbed first wall');await page.screenshot({path:'output/v2-wall-climb.png'});
 await page.keyboard.down('w');await page.keyboard.down('d');await page.waitForTimeout(950);await page.keyboard.up('w');await page.keyboard.up('d');
 await go(940);await page.keyboard.press('Space');await go(1140);await page.waitForTimeout(500);await page.keyboard.press('Space');await go(1380);await page.waitForTimeout(500);
 await go(1670);await page.keyboard.down('s');await go(2240);await page.waitForTimeout(1700);await page.keyboard.up('s');s=await state();
 const width=Math.max(...s.particles.map(p=>p.x))-Math.min(...s.particles.map(p=>p.x));assert(width<140,`recovered width ${width}`);await page.screenshot({path:'output/v2-recovered.png'});
 await go(2375);await page.keyboard.press('Space');await page.keyboard.down('d');let splashed=false;
 for(let i=0;i<70;i++){s=await state();if(s.splashCount>5){splashed=true;await page.screenshot({path:'output/v2-water-splash.png'});break;}await page.waitForTimeout(40);}await page.keyboard.up('d');assert(splashed,'Water impact must produce visible spray');
 logs.push({checks:['441 particles','double jump','C and 1/2 selection','button selection','world click selection','wall climbing','automatic recovery with squeeze held','water splash'],recoveredWidth:width,fps:s.fps,splashCount:s.splashCount});
 await writeFile('output/refinements-results.json',JSON.stringify(logs,null,2));console.log(JSON.stringify(logs));
}catch(e){await page.screenshot({path:'output/v2-failure.png'});console.log(await state());throw e;}finally{await browser.close();}
