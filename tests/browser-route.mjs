import {chromium} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('output',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:720}});
const snapshot=()=>page.evaluate(()=>window.__slime());
const logs=[];
async function log(name){const s=await snapshot();const row={name,center:s.center,groups:s.groups,fps:s.fps,timings:s.timings};logs.push(row);console.log(JSON.stringify(row));}
async function go(x,key='d',timeout=20000){
 await page.keyboard.down(key);const start=Date.now();
 while(Date.now()-start<timeout){const s=await snapshot();if(s.complete||(key==='d'?s.center.x>=x:s.center.x<=x)){await page.keyboard.up(key);return;}await page.waitForTimeout(80);}
 await page.keyboard.up(key);await log('stuck');throw new Error('Could not reach '+x);
}
async function jumpTo(x){await page.keyboard.down('d');await page.keyboard.press('Space');await go(x);await page.waitForTimeout(500);}
try{
 await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});await page.getByRole('button',{name:'开始小小冒险'}).click();
 await page.waitForTimeout(1000);await log('start');
 await go(770);await jumpTo(905);await log('step1');
 await go(955);await jumpTo(1130);await log('step2');
 await go(1170);await jumpTo(1360);await log('step3');
 await go(1670);await page.keyboard.down('s');await go(1850);await page.screenshot({path:'output/05-root-squeeze.png'});await go(2090);await page.keyboard.up('s');await page.waitForTimeout(600);await log('roots');
 await go(2750);await page.screenshot({path:'output/06-water.png'});await go(2830);await jumpTo(2960);await log('pool-exit');
 await go(3260);await page.waitForTimeout(500);await page.keyboard.press('q');await page.waitForTimeout(500);await log('split-at-gate');
 await go(3450);await page.waitForTimeout(600);await page.keyboard.press('Tab');
 let state=await snapshot();if(state.center.x<3234)await go(3238);else if(state.center.x>3246)await go(3242,'a');
 await page.waitForTimeout(1200);await log('plates');await page.screenshot({path:'output/07-twin-gate.png'});
 assert.equal((await snapshot()).gateOpen,true,'Both plates should open gate');
 await go(3420);await page.keyboard.press('e');await page.waitForTimeout(500);assert.equal((await snapshot()).groups.length,1);
 await go(4100);await page.waitForTimeout(300);assert.equal((await snapshot()).complete,true);await page.screenshot({path:'output/08-finish.png'});await log('complete');
 await writeFile('output/route-results.json',JSON.stringify(logs,null,2));
}catch(e){await page.screenshot({path:'output/route-failure.png'});await writeFile('output/route-results.json',JSON.stringify(logs,null,2));throw e;}finally{await browser.close();}
