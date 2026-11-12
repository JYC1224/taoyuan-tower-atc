import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out=`visual-qa/terminal3-${process.argv[2]||'after'}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl']});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],views=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto(process.env.ATC_QA_URL||'http://127.0.0.1:4173');await page.waitForFunction(()=>window.__ATC);await page.evaluate(async()=>window.__ATC.scene.assetsReady);
 await page.addStyleTag({content:'.hud,.tutorial-card{visibility:hidden!important}'});
 for(const setting of [{name:'overview',position:[-500,370,600],target:[-1110,10,0],hour:12},{name:'airside',position:[-1000,105,-500],target:[-1110,15,0],hour:12},{name:'landside',position:[-1150,95,470],target:[-1110,15,0],hour:17},{name:'night',position:[-500,370,600],target:[-1110,10,0],hour:22}]){
  const info=await page.evaluate(o=>{const api=window.__ATC;api.begin({duration:0,seed:182731,tutorial:false});const s=api.sim,v=api.scene;s.timeScale=0;s.clearTraffic();s.time=o.hour*3600;s.weather={kind:'clear',windDirection:60,windSpeed:9,wetness:0,visibility:16000};v.setImmersive(true);v.setQuality('medium');v.setCamera('orbit');v.transition=0;v.camera.position.set(...o.position);v.lookTarget.set(...o.target);v.controls.target.copy(v.lookTarget);v.camera.lookAt(v.lookTarget);v.update(s,null,0);return {calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};},setting);
  await page.waitForTimeout(350);await page.screenshot({path:`${out}/${setting.name}.png`});views.push({name:setting.name,...info});console.log(setting.name,JSON.stringify(info));
 }
 await writeFile(`${out}/results.json`,JSON.stringify({views,errors},null,2));if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
