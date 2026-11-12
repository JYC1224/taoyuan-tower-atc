import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out='visual-qa/pushback-after';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl']});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto('http://127.0.0.1:4173');await page.waitForFunction(()=>window.__ATC);await page.evaluate(async()=>window.__ATC.scene.assetsReady);
 await page.addStyleTag({content:'.hud,.tutorial-card{visibility:hidden!important}'});
 const setup=await page.evaluate(()=>{
  const api=window.__ATC;api.begin({duration:0,seed:182731,tutorial:false,difficulty:'standard'});const s=api.sim,v=api.scene;s.clearTraffic();
  s.time=12*3600;s.weather={kind:'clear',windDirection:60,windSpeed:9,wetness:0,visibility:16000};
  const a=s.spawn('departure','A350');if(!a)throw Error('No departure stand available');
  const commands=s.availableCommands(a.id);if(commands.includes('delivery'))s.command(a.id,'delivery');
  const clearance=s.command(a.id,'approvePushback');if(!clearance.ok)throw Error(JSON.stringify(clearance));
  s.timeScale=1;for(let i=0;i<100&&a.state!=='PUSHING';i++)s.update(.5);if(a.state!=='PUSHING')throw Error('Pushback did not begin: '+a.state);
  s.update(6);s.timeScale=0;api.select(a.id);v.setImmersive(true);v.setQuality('medium');v.setCamera('orbit');v.transition=0;
  const f={x:Math.sin(a.heading),z:-Math.cos(a.heading)},right={x:Math.cos(a.heading),z:Math.sin(a.heading)},target={x:a.position.x+f.x*20,y:2,z:a.position.z+f.z*20};
  v.camera.position.set(target.x+f.x*31+right.x*30,14,target.z+f.z*31+right.z*30);v.controls.target.set(target.x,target.y,target.z);v.lookTarget.copy(v.controls.target);v.controls.update();v.update(s,a.id,0);
  const visual=v.visuals.get(a.id);return{id:a.id,state:a.state,attached:visual.tug.parent===visual.group,visible:visual.tug.visible,baseZ:visual.tug.position.z};
 });
 await page.waitForTimeout(300);await page.screenshot({path:`${out}/tug-attached.png`});
 const result=await page.evaluate(({id})=>{
  const api=window.__ATC,s=api.sim,v=api.scene,a=s.aircraft.find(a=>a.id===id),visual=v.visuals.get(id);
  s.timeScale=1;for(let i=0;i<500&&a.state==='PUSHING';i++){s.update(.5);v.update(s,id,.05);}
  if(a.state!=='ENGINE_START'&&a.state!=='READY_TO_TAXI')throw Error('Pushback did not finish: '+a.state);
  const detached=visual.tug.parent!==visual.group,origin=visual.tug.position.clone();for(let i=0;i<40;i++)v.update(s,id,.1);
  const distance=visual.tug.position.distanceTo(origin),visible=visual.tug.visible;
  s.timeScale=0;v.update(s,id,0);return{state:a.state,detached,distance,visible};
 },setup);
 await page.waitForTimeout(300);await page.screenshot({path:`${out}/tug-departing.png`});
 if(!setup.attached||!setup.visible||!result.detached||!result.visible||result.distance<3)throw Error('Tug sequence invalid: '+JSON.stringify({setup,result}));
 await writeFile(`${out}/results.json`,JSON.stringify({setup,result,errors},null,2));if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({setup,result}));
}finally{await browser.close();}
