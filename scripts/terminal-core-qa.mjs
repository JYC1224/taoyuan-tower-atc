import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out=`visual-qa/terminal-core-${process.argv[2]||'after'}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl']});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],views=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto(process.env.ATC_QA_URL||'http://127.0.0.1:4173');await page.waitForFunction(()=>window.__ATC);await page.evaluate(async()=>window.__ATC.scene.assetsReady);
 await page.addStyleTag({content:'.hud,.tutorial-card{visibility:hidden!important}'});
 for(const setting of [{name:'overview',position:[480,360,540],target:[30,0,-60],hour:12},{name:'tower-campus',position:[180,100,140],target:[5,8,-105],hour:12},{name:'parking',position:[420,180,160],target:[195,0,-60],hour:12},{name:'night',position:[180,100,140],target:[5,8,-105],hour:22}]){
  const info=await page.evaluate(o=>{const api=window.__ATC;api.begin({duration:0,seed:182731,tutorial:false});const s=api.sim,v=api.scene;s.timeScale=0;s.clearTraffic();s.time=o.hour*3600;s.weather={kind:'clear',windDirection:60,windSpeed:9,wetness:0,visibility:16000};v.setImmersive(true);v.setQuality('medium');v.setCamera('orbit');v.transition=0;v.camera.position.set(...o.position);v.lookTarget.set(...o.target);v.camera.lookAt(v.lookTarget);v.update(s,null,0);return {calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};},setting);
  await page.waitForTimeout(350);await page.screenshot({path:`${out}/${setting.name}.png`});views.push({name:setting.name,...info});console.log(setting.name,JSON.stringify(info));
 }
 await writeFile(`${out}/results.json`,JSON.stringify({views,errors},null,2));if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
