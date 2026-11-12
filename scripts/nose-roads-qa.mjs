import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

// Identical staging, cameras and weather for the preserved build and the revision.
const stage=process.argv[2]||'after',out=`visual-qa/nose-roads-${stage}`;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl']});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1}),errors=[],views=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
try{
 await page.goto(process.env.ATC_QA_URL||'http://127.0.0.1:4200');await page.waitForFunction(()=>window.__ATC);await page.evaluate(async()=>{await window.__ATC.scene.assetsReady;});
 await page.addStyleTag({content:'.hud,.tutorial-card{visibility:hidden!important}'});
 const families=[['A320','TTW',37.57,3.63],['A330','EVA',63.66,5.42],['A350','SJX',66.8,5.58],['B789','EVA',62.81,5.48],['B77W','CAL',73.86,5.70]];
 for(const [type,airline,length,bodyY] of families)for(const view of ['front','quarter','side']){
  await page.evaluate(({type,airline,length,bodyY,view})=>{
   const api=window.__ATC;api.begin({duration:0,seed:182731,tutorial:false});const s=api.sim,v=api.scene;s.timeScale=0;s.clearTraffic();s.time=12*3600;s.weather={kind:'clear',windDirection:60,windSpeed:9,wetness:0,visibility:16000};
   const a=s.spawn('departure',type,airline);a.type=type;a.airline=airline;a.state='PARKED';a.position={x:-800,y:0,z:-540};a.heading=0;a.pitch=0;
   api.select(null);v.elapsed=0;v.setImmersive(true);v.setQuality('medium');v.setCamera('orbit');v.transition=0;
   const target=[-800,bodyY+.45,-540-length*.38],cam=view==='front'?[-800,bodyY+1.5,-540-length*.5-20]:view==='quarter'?[-818,bodyY+3,-540-length*.5-15]:[-830,bodyY+1.3,-540-length*.38];
   v.camera.position.fromArray(cam);v.controls.target.fromArray(target);v.lookTarget.fromArray(target);v.camera.lookAt(v.lookTarget);v.controls.update();api.refresh();v.update(s,null,0);
  },{type,airline,length,bodyY,view});
  await page.waitForTimeout(350);const name=`${type}-${view}`;await page.screenshot({path:`${out}/${name}.png`});views.push(name);console.log(name);
 }
 for(const f of [{name:'airport-aerial',camera:[-2450,2100,2500],target:[-100,0,-70]},{name:'airport-landside',camera:[800,700,800],target:[100,0,-50]}]){
  await page.evaluate(f=>{const api=window.__ATC;api.begin({duration:0,seed:182731,tutorial:false});const s=api.sim,v=api.scene;s.timeScale=0;s.clearTraffic();s.time=12*3600;s.weather={kind:'clear',windDirection:60,windSpeed:9,wetness:0,visibility:16000};api.select(null);v.setImmersive(true);v.setQuality('medium');v.setCamera('orbit');v.transition=0;v.camera.position.fromArray(f.camera);v.controls.target.fromArray(f.target);v.lookTarget.fromArray(f.target);v.camera.lookAt(v.lookTarget);v.controls.update();api.refresh();v.update(s,null,0);},f);
  await page.waitForTimeout(350);await page.screenshot({path:`${out}/${f.name}.png`});views.push(f.name);console.log(f.name);
 }
 await writeFile(`${out}/results.json`,JSON.stringify({stage,views,errors},null,2)+'\n');if(errors.some(e=>!e.includes('ReadPixels')))throw new Error(errors.join('\n'));
}finally{await browser.close();}
