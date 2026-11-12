import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

// Isolated visual fixtures; never used by the shipped simulator. Same seed, camera,
// viewport and paused state before/after. Software WebGL makes GPU cost reproducible.
const stage=process.argv[2]||'after',out=`visual-qa/${stage}`;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:process.env.ATC_NATIVE_GPU?['--enable-webgl']:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errors.push(m.text());});
await page.goto(process.env.ATC_QA_URL||'http://127.0.0.1:4173');await page.waitForFunction(()=>window.__ATC);
await page.evaluate(async()=>{await window.__ATC.scene.assetsReady;});
const quality=process.env.ATC_QUALITY||'medium';
await page.evaluate(quality=>{const a=window.__ATC;a.begin({seed:182731,duration:0,tutorial:false});a.sim.timeScale=0;a.scene.setQuality(quality);},quality);
const fixtures=[
 {name:'01-tower-day',mode:'seat',hour:12},
 {name:'02-tower-night',mode:'window',hour:21},
 {name:'03-aircraft-gate',aircraft:true,offset:[-49,18,-55],hour:12},
 {name:'04-aircraft-taxi',aircraft:true,state:'TAXIING',position:[-750,0,-530],offset:[-60,18,-72],hour:12},
 {name:'05-aircraft-takeoff',aircraft:true,state:'TAKEOFF_ROLL',position:[-400,0,-760],heading:Math.PI/2,offset:[-75,11,66],hour:12},
 {name:'06-aircraft-landing',aircraft:true,state:'FINAL',position:[-2040,32,-760],heading:Math.PI/2,offset:[-80,25,70],hour:12},
 {name:'07-terminal-1',position:[800,135,420],target:[440,14,-45],hour:12},
 {name:'08-terminal-2',position:[-700,150,510],target:[-285,17,-50],hour:12},
 {name:'09-tower-exterior',position:[-100,69,-200],target:[11,32,-95],hour:12},
 {name:'10-airport-aerial',position:[-2450,2100,2500],target:[-100,0,-70],hour:12},
 {name:'11-rain',aircraft:true,offset:[-49,18,-55],hour:14,weather:'rain'},
 {name:'12-evening',position:[-1650,270,700],target:[100,35,-250],hour:17.5}
];
const results=[];
if(process.env.ATC_REALISM_QA)fixtures.push(
 {name:'13-a350-front',aircraft:true,type:'A350',state:'TAXIING',position:[-800,0,-540],offset:[-55,16,-75],hour:12},
 {name:'14-b787-front',aircraft:true,type:'B78X',state:'TAXIING',position:[-800,0,-540],offset:[58,15,-74],hour:12},
 {name:'15-a350-engine',aircraft:true,type:'A350',state:'TAXIING',position:[-800,0,-540],offset:[-24,9,-39],hour:12}
);
for(const fixture of fixtures.filter(f=>!process.argv[3]||f.name.includes(process.argv[3]))){
 await page.evaluate(f=>{const api=window.__ATC;api.begin({seed:182731,duration:0,tutorial:false});const s=api.sim,v=api.scene;s.timeScale=0;s.time=f.hour*3600;s.weather.kind=f.weather||'clear';s.weather.visibility=f.weather?6500:16000;s.weather.wetness=f.weather?.85:0;
  v.elapsed=0;v.setImmersive(true);api.select(null);
  let p=f.position,t=f.target;
  if(f.aircraft){const a=s.aircraft.find(a=>a.kind==='departure');if(f.type)a.type=f.type;if(f.state){a.state=f.state;a.position={x:f.position[0],y:f.position[1],z:f.position[2]};a.heading=f.heading||0;a.pitch=f.state==='FINAL'?-.04:0;}api.select(a.id);p=[a.position.x+f.offset[0],a.position.y+f.offset[1],a.position.z+f.offset[2]];t=[a.position.x,a.position.y+5,a.position.z];}
  if(f.mode){v.setCamera(f.mode);v.camera.position.copy(v.goalPosition);v.lookTarget.copy(v.goalTarget);v.camera.lookAt(v.lookTarget);v.transition=0;}
  else {v.setCamera('orbit');v.transition=0;v.camera.position.fromArray(p);v.controls.target.fromArray(t);v.lookTarget.fromArray(t);v.camera.lookAt(v.lookTarget);v.controls.update();}
  for(const b of v.environment.bridges){const a=s.aircraft.find(a=>a.gate===b.gate),docked=!!a&&['PARKED','DOCKED','REQUESTING_PUSHBACK'].includes(a.state);if(b.update)b.update(a,docked,30);else b.group.scale.z=docked?1:.66;}
  v.screenTimer=1;api.refresh();v.update(s,api.selected,0);
 },fixture);
 // UI stays in the product; hide HUD only for art review screenshots.
 await page.addStyleTag({content:'.hud,.tutorial-card{visibility:hidden!important}'});
 await page.waitForTimeout(350);
 await page.screenshot({path:`${out}/${fixture.name}.png`});
 const info=await page.evaluate(async()=>{const v=window.__ATC.scene,r=v.renderer,gl=r.getContext();const intervals=[];let last=performance.now();for(let i=0;i<12;i++){await new Promise(requestAnimationFrame);const now=performance.now();intervals.push(now-last);last=now;}intervals.sort((a,b)=>a-b);const ext=gl.getExtension('WEBGL_debug_renderer_info');return{medianFrameMs:intervals[6],fps:1000/intervals[6],calls:r.info.render.calls,triangles:r.info.render.triangles,geometries:r.info.memory.geometries,textures:r.info.memory.textures,width:r.domElement.width,height:r.domElement.height,samples:gl.getParameter(gl.SAMPLES),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};});
 results.push({fixture,...info});console.log(fixture.name,Math.round(info.medianFrameMs)+'ms',info.calls+' calls');
}
await writeFile(`${out}/metrics.json`,JSON.stringify({stage,viewport:[1440,900],quality,results,errors},null,2));
await browser.close();if(errors.some(e=>!e.includes('ReadPixels')))process.exitCode=1;
