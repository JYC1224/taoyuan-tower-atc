import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const origin=new URL(process.env.ATC_QA_URL||'http://127.0.0.1:4200').origin,out='visual-qa/airframe-airport-regression';
assert(['127.0.0.1','localhost'].includes(new URL(origin).hostname));await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl']});
const errors=[],external=[],layouts=[];
try{
 for(const [name,viewport] of [['desktop',{width:1440,height:1100}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport});await context.route('**/*',route=>{const target=new URL(route.request().url());if(target.origin===origin||target.protocol==='data:')return route.continue();external.push(target.href);return route.abort();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
  await page.goto(origin+'/detail-review/index.html');assert.equal(await page.locator('#view option').count(),7);
  await page.locator('#view').selectOption('05-apron-equipment');await page.locator('[data-split="0"]').click();
  await page.waitForFunction(()=>['before','after'].every(id=>{const img=document.getElementById(id);return img.src.includes('05-apron-equipment')&&img.complete&&img.naturalWidth===1440;}));
  assert.equal(await page.locator('#stage').evaluate(e=>e.style.getPropertyValue('--split')),'0%');
  await page.locator('[data-split="50"]').click();const size=await page.evaluate(()=>({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}));assert(size.scrollWidth<=size.width,`${name} overflow`);
  await page.screenshot({path:`${out}/review-${name}.png`,fullPage:true});layouts.push({name,...size,views:7,imagesLoaded:true,slider:true});
  if(name==='desktop'){
   await page.goto(origin);await page.waitForFunction(()=>window.__ATC);await page.evaluate(async()=>{await window.__ATC.scene.assetsReady;});
   const wind=await page.evaluate(()=>{const api=window.__ATC;api.begin({duration:0,seed:182731});const s=api.sim,v=api.scene;s.timeScale=0;s.weather.windDirection=60;s.weather.windSpeed=0;v.update(s,null,0);const calm=v.environment.windsocks.map(o=>({x:o.rotation.x,y:o.rotation.y}));s.weather.windDirection=150;s.weather.windSpeed=18;v.update(s,null,0);return {calm,strong:v.environment.windsocks.map(o=>({x:o.rotation.x,y:o.rotation.y}))};});
   assert.equal(wind.calm.length,2);assert.equal(wind.strong.length,2);for(let i=0;i<2;i++){assert(wind.calm[i].x>wind.strong[i].x);assert(Math.abs(wind.strong[i].y-wind.calm[i].y+Math.PI/2)<1e-8);}
   layouts[0].windsocksRespond=true;
  }
  await context.close();
 }
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);await writeFile(`${out}/detail-review.json`,JSON.stringify({layouts,externalRequests:external,errors},null,2)+'\n');console.log('Seven-view comparison works on desktop and mobile; windsocks follow scenario wind; no external requests or browser errors.');
}finally{await browser.close();}
