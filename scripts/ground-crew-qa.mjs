import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out='visual-qa/ground-crew';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl']});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],views=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto('http://127.0.0.1:4173');await page.waitForFunction(()=>window.__ATC);await page.evaluate(async()=>window.__ATC.scene.assetsReady);
 await page.addStyleTag({content:'.hud,.tutorial-card{visibility:hidden!important}'});
 for(const o of [{name:'passenger-baggage',type:'A350',state:'REQUESTING_PUSHBACK',kind:'departure',length:66.8},{name:'cargo-unloading',type:'B77F',state:'DOCKED',kind:'arrival',length:63.73},{name:'marshaller',type:'A350',state:'ENTERING_STAND',kind:'arrival',length:66.8},{name:'marshaller-approach',type:'A350',state:'TAXIING_TO_GATE',kind:'arrival',length:66.8}]){
  const info=await page.evaluate(o=>{
   const api=window.__ATC;api.begin({duration:0,seed:182731,tutorial:false});const s=api.sim,v=api.scene;s.timeScale=0;s.clearTraffic();s.time=12*3600;s.weather={kind:'clear',windDirection:60,windSpeed:9,wetness:0,visibility:16000};
   const a=s.spawn('departure',o.type);if(!a)throw Error('Unable to spawn aircraft');a.kind=o.kind;a.state=o.state;a.speed=0;
   if(o.name==='marshaller-approach'){a.position.x-=Math.sin(a.heading)*15;a.position.z+=Math.cos(a.heading)*15;}api.select(a.id);
   v.setImmersive(true);v.setQuality('medium');v.setCamera('orbit');v.transition=0;
   const world=(x,y,z)=>[a.position.x+Math.cos(a.heading)*x-Math.sin(a.heading)*z,y,a.position.z+Math.sin(a.heading)*x+Math.cos(a.heading)*z];
   const guide=o.name.startsWith('marshaller'),offset=o.name==='marshaller-approach'?15:0;
   const target=guide?world(-3,2,-o.length*.53-offset):o.type==='B77F'?world(-6,3,o.length*.23):world(6,2,-o.length*.25);
   const camera=guide?world(-23,12,-o.length*.72-offset):o.type==='B77F'?world(-30,13,o.length*.23+18):world(28,12,-o.length*.36-10);
   v.camera.position.fromArray(camera);v.controls.target.fromArray(target);v.lookTarget.fromArray(target);v.controls.update();v.update(s,a.id,0);
   const visual=v.visuals.get(a.id);let anchorError=0;
   if(o.name==='marshaller-approach'){const before=visual.marshaller.getWorldPosition(visual.marshaller.position.clone());a.position.x+=Math.sin(a.heading)*5;a.position.z-=Math.cos(a.heading)*5;v.update(s,a.id,0);const after=visual.marshaller.getWorldPosition(visual.marshaller.position.clone());anchorError=before.distanceTo(after);a.position.x-=Math.sin(a.heading)*5;a.position.z+=Math.cos(a.heading)*5;v.update(s,a.id,0);}
   return{serviceVisible:visual.standService.group.visible,marshallerVisible:visual.marshaller.visible,cargo:visual.standService.cargo,anchorError};
  },o);
  const guide=o.state==='ENTERING_STAND'||o.state==='TAXIING_TO_GATE';if(info.serviceVisible===guide||info.marshallerVisible!==guide||info.anchorError>.01)throw Error('Unexpected visibility or guide movement '+JSON.stringify(info));
  await page.waitForTimeout(300);await page.screenshot({path:`${out}/${o.name}.png`});views.push({name:o.name,...info});console.log(o.name,JSON.stringify(info));
 }
 await writeFile(`${out}/results.json`,JSON.stringify({views,errors},null,2));if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
