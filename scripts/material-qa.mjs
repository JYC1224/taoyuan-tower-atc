import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out=`visual-qa/material-${process.argv[2]||'after'}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl']});
const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],views=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto(process.env.ATC_QA_URL||'http://127.0.0.1:4173');await page.waitForFunction(()=>window.__ATC);await page.evaluate(async()=>window.__ATC.scene.assetsReady);
 await page.addStyleTag({content:'.hud,.tutorial-card{visibility:hidden!important}'});
 for(const setting of [{name:'aircraft-day',aircraft:true,hour:12,wetness:0},{name:'aircraft-rain',aircraft:true,hour:15,wetness:.85},{name:'terminal',position:[-430,90,120],target:[-285,15,-50],hour:12,wetness:0},{name:'terminal-night',position:[-430,90,120],target:[-285,15,-50],hour:22,wetness:0}]){
  const info=await page.evaluate(o=>{const api=window.__ATC;api.begin({duration:0,seed:182731,tutorial:false});const s=api.sim,v=api.scene;s.timeScale=0;s.clearTraffic();s.time=o.hour*3600;s.weather={kind:o.wetness?'rain':'clear',windDirection:60,windSpeed:9,wetness:o.wetness,visibility:16000};const a=o.aircraft?s.spawn('departure','A350'):null;v.setImmersive(true);v.setQuality('high');v.setCamera('orbit');v.transition=0;const pos=a?[a.position.x+90,55,a.position.z+125]:o.position,target=a?[a.position.x,5,a.position.z]:o.target;v.camera.position.set(...pos);v.lookTarget.set(...target);v.controls.target.copy(v.lookTarget);v.camera.lookAt(v.lookTarget);v.update(s,null,0);return {calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};},setting);
  await page.waitForTimeout(400);await page.screenshot({path:`${out}/${setting.name}.png`});views.push({name:setting.name,...info});console.log(setting.name,JSON.stringify(info));
 }
 await writeFile(`${out}/results.json`,JSON.stringify({views,errors},null,2));if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
