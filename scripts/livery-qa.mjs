import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const stage=process.argv[2]||'after',out=`livery-qa/${stage}`;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl']});
const errors=[],rows=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
 await page.goto(process.env.ATC_QA_URL||'http://127.0.0.1:4190');await page.waitForFunction(()=>window.__ATC);await page.evaluate(async()=>{await window.__ATC.scene.assetsReady;});
 for(const [airline,type,L]of [['EVA','B789',62.81],['CAL','A350',66.8],['SJX','A350',66.8],['TTW','A320',37.57]])for(const side of ['left','right','tail']){
  await page.evaluate(({airline,type,L,side})=>{
   const api=window.__ATC;api.begin({duration:0,seed:182731,tutorial:false});const s=api.sim,v=api.scene;s.timeScale=0;s.clearTraffic();s.time=12*3600;s.weather={kind:'clear',windDirection:60,windSpeed:9,wetness:0,visibility:16000};
   const a=s.spawn('departure',type,airline)||s.spawn('departure',type);a.airline=airline;a.type=type;a.state='TAXIING';a.position={x:-800,y:0,z:-540};a.heading=0;a.flightNumber=({EVA:'BR857',CAL:'CI101',SJX:'JX802',TTW:'IT202'})[airline];
   api.select(a.id);v.elapsed=0;v.setImmersive(true);v.setQuality('medium');v.setCamera('orbit');v.transition=0;
   const p=a.position,target=side==='tail'?[p.x,13,p.z+L*.38]:[p.x,5,p.z];
   const offset=side==='tail'?[-L*.31,16,L*.42]:[(side==='left'?-1:1)*L*.98,15,-L*.05];
   v.camera.position.set(p.x+offset[0],offset[1],p.z+offset[2]);v.controls.target.fromArray(target);v.lookTarget.fromArray(target);v.camera.lookAt(v.lookTarget);v.controls.update();api.refresh();v.update(s,a.id,0);
  },{airline,type,L,side});
  await page.addStyleTag({content:'.hud,.tutorial-card{visibility:hidden!important}'});await page.waitForTimeout(350);await page.screenshot({path:`${out}/${airline}-${side}.png`});rows.push({airline,type,side});
 }
 assert.deepEqual(errors,[]);await writeFile(`${out}/results.json`,JSON.stringify({stage,views:rows,errors},null,2)+'\n');console.log('12 real-airline left/right/tail views captured; no browser/GPU errors.');
}finally{await browser.close();}
