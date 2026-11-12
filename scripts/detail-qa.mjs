import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

// Identical paused fixtures can be captured against a previous and current build.
const stage=process.argv[2]||'after',out=`visual-qa/detail-${stage}`;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl']});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
try{
 await page.goto(process.env.ATC_QA_URL||'http://127.0.0.1:4200');await page.waitForFunction(()=>window.__ATC);await page.evaluate(async()=>{await window.__ATC.scene.assetsReady;});
 const views=[
  {name:'01-a350-cockpit',type:'A350',airline:'SJX',position:[-800,0,-540],camera:[-824,9,-584],target:[-800,5,-562]},
  {name:'02-a350-engine',type:'A350',airline:'SJX',position:[-800,0,-540],camera:[-819,5.6,-558],target:[-813.3,2.5,-542.5]},
  {name:'03-a350-gear',type:'A350',airline:'SJX',position:[-800,0,-540],camera:[-817,5,-521],target:[-802.8,2,-535]},
  {name:'04-b787-wing',type:'B789',airline:'EVA',position:[-800,0,-540],camera:[-831,26,-522],target:[-813,4,-535]},
  {name:'05-apron-equipment',camera:[704,11,-245],target:[704,1,-219.5]},
  {name:'06-windsock',camera:[-1019,11,-932],target:[-1000,6,-910]},
  {name:'07-b777f-cargo',type:'B77F',airline:'CAL',position:[-800,0,-540],camera:[-855,18,-546],target:[-800,5,-540]}
 ];
 await page.addStyleTag({content:'.hud,.tutorial-card{visibility:hidden!important}'});
 for(const f of views){
  await page.evaluate(f=>{
   const api=window.__ATC;api.begin({duration:0,seed:182731,tutorial:false});const s=api.sim,v=api.scene;s.timeScale=0;s.clearTraffic();s.time=12*3600;s.weather={kind:'clear',windDirection:60,windSpeed:9,wetness:0,visibility:16000};
   let id=null;if(f.type){const a=s.spawn('departure',f.type,f.airline);a.type=f.type;a.airline=f.airline;a.state='TAXIING';a.position={x:f.position[0],y:f.position[1],z:f.position[2]};a.heading=0;a.pitch=0;id=a.id;}
   api.select(id);v.elapsed=0;v.setImmersive(true);v.setQuality('medium');v.setCamera('orbit');v.transition=0;v.camera.position.fromArray(f.camera);v.controls.target.fromArray(f.target);v.lookTarget.fromArray(f.target);v.camera.lookAt(v.lookTarget);v.controls.update();api.refresh();v.update(s,id,0);
  },f);
  await page.waitForTimeout(450);await page.screenshot({path:`${out}/${f.name}.png`});console.log(f.name);
 }
 await writeFile(`${out}/results.json`,JSON.stringify({stage,views:views.map(v=>v.name),errors},null,2)+'\n');
 if(errors.some(e=>!e.includes('ReadPixels')))throw new Error('Browser or renderer errors: '+errors.join('\n'));
}finally{await browser.close();}
