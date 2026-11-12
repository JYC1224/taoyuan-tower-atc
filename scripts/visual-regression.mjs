import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const livery=process.argv.includes('--livery'),realism=process.argv.includes('--realism')||livery,gameplay=process.argv.includes('--gameplay')||realism,out=process.env.ATC_VISUAL_OUT||(livery?'livery-qa/regression':realism?'visual-qa/realism-after':gameplay?'visual-qa/gameplay-final':'visual-qa');
if(realism)await import('./verify-realism-lock.mjs');
else if(gameplay)await import('./verify-render-lock.mjs');
const protectedSources=gameplay?[]:JSON.parse(await readFile('visual-qa/baseline-source-hashes.json','utf8')).filter(f=>!/[\\/]render[\\/]/.test(f.Path));
for(const f of protectedSources){const localPath='src/'+f.Path.split(/[\\/]src[\\/]/)[1].replaceAll('\\','/');assert.equal(createHash('sha256').update(await readFile(localPath)).digest('hex').toUpperCase(),f.Hash,localPath+' changed');}
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl']});const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
await page.goto(process.env.ATC_QA_URL||'http://127.0.0.1:4173');await page.waitForFunction(()=>window.__ATC);await mkdir(`${out}/fleet`,{recursive:true});
await page.evaluate(async()=>{await window.__ATC.scene.assetsReady;});
const checks=[];
for(const quality of ['low','high','medium']){await page.evaluate(quality=>{const a=window.__ATC;a.begin({duration:0});a.sim.timeScale=0;a.scene.setQuality(quality);a.camera('gate');},quality);await page.waitForTimeout(1200);const result=await page.evaluate(()=>{const a=window.__ATC,v=a.scene;return{width:v.renderer.domElement.width,post:!!v.post,shadows:v.renderer.shadowMap.enabled,aircraft:a.sim.aircraft.length};});checks.push({quality,...result});assert.equal(result.post,quality==='high');assert.equal(result.shadows,quality!=='low');assert(result.aircraft>0);}
for(const [i,type]of ['A320','A321','A330','A350','B789','B78X','B77W','B77F'].entries()){
 await page.evaluate(({type,i})=>{const api=window.__ATC;api.begin({duration:0});const s=api.sim,v=api.scene;s.timeScale=0;s.time=12*3600;s.weather.kind='clear';s.weather.wetness=0;const a=s.aircraft[0];a.type=type;a.airline=i%4===0?'TTW':i%4===1?'SJX':i%4===2?'EVA':'CAL';a.position={x:-800,y:0,z:-540};a.heading=0;api.select(a.id);v.setCamera('orbit');v.transition=0;v.camera.position.set(-860,23,-610);v.controls.target.set(-800,6,-540);v.update(s,a.id,0);}, {type,i});
 await page.waitForTimeout(450);await page.screenshot({path:`${out}/fleet/${type}.png`});
 const invalid=await page.evaluate(()=>{const failures=[];window.__ATC.scene.scene.traverse(o=>{if(o.geometry){for(const [name,attr]of Object.entries(o.geometry.attributes)){if(!Array.from(attr.array).every(Number.isFinite))failures.push(name);}}});return failures;});assert.deepEqual(invalid,[],'non-finite '+type);
}
await page.evaluate(()=>{const v=window.__ATC.scene;v.camera.position.set(-740,23,-470);v.controls.target.set(-800,6,-540);});await page.waitForTimeout(350);await page.screenshot({path:`${out}/fleet/reverse-side.png`});
const memory=[];for(let i=0;i<5;i++){await page.evaluate(()=>{const a=window.__ATC;a.begin({duration:0,seed:182731});a.sim.timeScale=0;a.scene.update(a.sim,null,0);});await page.waitForTimeout(120);memory.push(await page.evaluate(()=>({...window.__ATC.scene.renderer.info.memory})));}assert(memory.at(-1).textures<=memory[1].textures+2,'texture growth across reset');assert(memory.at(-1).geometries<=memory[1].geometries+2,'geometry growth across reset');
await browser.close();assert.deepEqual(errors,[],'browser/GPU errors');await writeFile(`${out}/visual-regression.json`,JSON.stringify({protectedSources:realism?18:gameplay?13:protectedSources.length,checks,fleet:8,finiteGeometry:true,memory,errors},null,2));console.log('Protected sources, quality changes, 8 aircraft, finite geometry and reset resources passed.');
