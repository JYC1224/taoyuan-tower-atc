import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const stage=process.argv[2]||'after',out=`visual-qa/sky-${stage}`;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl']});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto(process.env.ATC_QA_URL||'http://127.0.0.1:4376');
 await page.waitForFunction(()=>window.__ATC);await page.evaluate(async()=>window.__ATC.scene.assetsReady);
 await page.addStyleTag({content:'.hud,.tutorial-card{visibility:hidden!important}'});
 for(const setting of [
  {name:'clear-noon',hour:12,kind:'clear',wetness:0,visibility:16000},
  {name:'cloudy-noon',hour:12,kind:'cloudy',wetness:0,visibility:12000},
  {name:'storm-noon',hour:12,kind:'storm',wetness:.9,visibility:4500},
  {name:'clear-sunset',hour:17.7,kind:'clear',wetness:0,visibility:16000},
  {name:'clear-night',hour:22,kind:'clear',wetness:0,visibility:16000}
 ]){
  await page.evaluate(o=>{const api=window.__ATC;api.begin({duration:0,seed:182731,tutorial:false});const s=api.sim,v=api.scene;s.timeScale=0;s.clearTraffic();s.time=o.hour*3600;s.weather={kind:o.kind,windDirection:60,windSpeed:9,wetness:o.wetness,visibility:o.visibility};api.select(null);v.setImmersive(true);v.setQuality('medium');v.setCamera('orbit');v.transition=0;v.camera.position.set(120,90,380);v.controls.target.set(-80,290,-500);v.lookTarget.copy(v.controls.target);v.controls.update();v.update(s,null,0);},setting);
  await page.waitForTimeout(300);await page.screenshot({path:`${out}/${setting.name}.png`});console.log(setting.name);
 }
 await writeFile(`${out}/results.json`,JSON.stringify({errors},null,2));if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
