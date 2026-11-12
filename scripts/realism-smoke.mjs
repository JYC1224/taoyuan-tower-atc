import {chromium} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import assert from 'node:assert/strict';

const url=process.env.ATC_QA_URL||'http://127.0.0.1:4173',origin=new URL(url).origin;
const livery=process.argv.includes('--livery'),output=process.env.ATC_SMOKE_OUTPUT||(livery?'livery-qa/offline-smoke.json':'realism-qa/offline-smoke.json');
assert(['127.0.0.1','localhost'].includes(new URL(url).hostname),'Smoke test only targets loopback');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl']});
const errors=[],external=[],responses=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 await context.route('**/*',route=>{
  const target=new URL(route.request().url());
  if(target.origin===origin||target.protocol==='data:')return route.continue();
  external.push(target.href);return route.abort();
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
 page.on('response',r=>{if(r.url().includes('/assets/realism/')||livery&&r.url().includes('/assets/liveries/'))responses.push({file:new URL(r.url()).pathname,status:r.status(),type:r.headers()['content-type']});});
 await page.goto(url);await page.waitForFunction(()=>window.__ATC);
 await page.evaluate(async()=>{await window.__ATC.scene.assetsReady;});
 await page.locator('.start-button').click();await page.locator('#skip-intro').click();await page.locator('[data-speed="0"]').click();
 await page.locator('#operations-open').click();assert.equal(await page.locator('.ops-runways .ops-card').count(),2);await page.locator('[data-close]').click();
 const state=await page.evaluate(()=>{
  const a=window.__ATC,v=a.scene;
  return {aircraft:a.sim.aircraft.length,quality:v.quality,photoWidth:v.sky.material.uniforms.photoSky.value.image.width,
   pbrSurfaces:v.environment.pavementMaterials.map(m=>({color:!!m.map?.image,normal:!!m.normalMap?.image,roughness:!!m.roughnessMap?.image})),
   calls:v.renderer.info.render.calls,errors:[]};
 });
 assert(state.aircraft>0);assert.equal(state.photoWidth,2048);assert(state.pbrSurfaces.every(m=>m.color&&m.normal&&m.roughness));
 assert.equal(new Set(responses.map(r=>r.file)).size,livery?14:7);assert(responses.every(r=>r.status===200));
 await page.goto(origin+(livery?'/livery-review/index.html':'/realism-review/index.html'));
 let gallery;
 if(livery){
  assert.equal(await page.locator('#airline option').count(),4);assert.equal(await page.locator('#side option').count(),3);
  await page.locator('#airline').selectOption('CAL');await page.locator('#side').selectOption('tail');await page.locator('[data-split="0"]').click();
  await page.waitForFunction(()=>['before','after'].every(id=>{const image=document.getElementById(id);return image.complete&&image.naturalWidth===1440;}));gallery={views:12,imagesLoaded:true};
 }else{
  await page.locator('#new').waitFor();assert.equal(await page.locator('#view option').count(),15);
  await page.locator('#quality').selectOption('high');await page.locator('#next').click();await page.locator('[data-split="0"]').click();
  await page.waitForFunction(()=>[document.getElementById('old'),document.getElementById('new')].every(image=>image.complete&&image.naturalWidth===1440));gallery={views:15,quality:await page.locator('#quality').inputValue(),imagesLoaded:true};
 }
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 await mkdir(dirname(resolve(output)),{recursive:true});
 await writeFile(output,JSON.stringify({url,externalRequestsBlocked:true,externalRequests:external,assets:responses,state,gallery,errors},null,2)+'\n');
 console.log('Local-only assets, game start, Operations and comparison passed; external requests: 0.');
}finally{await browser.close();}
