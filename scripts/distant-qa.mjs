import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out=`visual-qa/distant-${process.argv[2]||'after'}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl']});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],views=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto(process.env.ATC_QA_URL||'http://127.0.0.1:4173');await page.waitForFunction(()=>window.__ATC);await page.evaluate(async()=>window.__ATC.scene.assetsReady);
 await page.addStyleTag({content:'.hud,.tutorial-card{visibility:hidden!important}'});
 for(const setting of [
  {name:'approach-05',x:-24000,y:1250,z:-760,heading:Math.PI/2,hour:12},
  {name:'approach-23',x:24000,y:1250,z:748,heading:-Math.PI/2,hour:12},
  {name:'departure',x:12500,y:850,z:748,heading:Math.PI/2,hour:17},
  {name:'inland',x:-12000,y:2200,z:20000,heading:Math.PI,hour:12},
  {name:'night-approach',x:-24000,y:1250,z:-760,heading:Math.PI/2,hour:22}
 ]){
  const info=await page.evaluate(o=>{const api=window.__ATC;api.begin({duration:0,seed:182731,tutorial:false});const s=api.sim,v=api.scene;s.timeScale=0;s.clearTraffic();s.time=o.hour*3600;s.weather={kind:'clear',windDirection:60,windSpeed:9,wetness:0,visibility:16000};const a=s.spawn('arrival','A350');a.state='FINAL';a.position={x:o.x,y:o.y,z:o.z};a.heading=o.heading;api.select(a.id);v.setImmersive(true);v.setQuality(o.quality);v.setCamera('follow');v.transition=0;v.camera.position.set(o.x-Math.sin(o.heading)*135,o.y+52,o.z+Math.cos(o.heading)*135);v.lookTarget.set(o.x,o.y+6,o.z);v.camera.lookAt(v.lookTarget);v.update(s,a.id,0);return {calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};},{...setting,quality:process.env.ATC_QA_QUALITY||'medium'});
  await page.waitForTimeout(350);await page.screenshot({path:`${out}/${setting.name}.png`});views.push({name:setting.name,...info});console.log(setting.name,JSON.stringify(info));
 }
 await writeFile(`${out}/results.json`,JSON.stringify({views,errors},null,2));if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
