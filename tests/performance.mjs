import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:720}});
await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});
await page.getByRole('button',{name:'开始小小冒险'}).click();
await page.waitForTimeout(3000);
console.log(await page.evaluate(()=>{
 const cv=document.querySelector('canvas'),gl=cv.getContext('webgl')||cv.getContext('webgl2');
 const ext=gl?.getExtension('WEBGL_debug_renderer_info');
 const s=window.__slime();return {renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'Canvas2D',fps:s.fps,timings:s.timings};
}));await browser.close();
