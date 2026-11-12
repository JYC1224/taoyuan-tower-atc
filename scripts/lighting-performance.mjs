import {chromium} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';

// Paired native-GPU samples use identical aircraft, paths, camera and settings.
// The baseline is the preserved graphics release, extracted into a QA folder.
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.md':'text/plain','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.hdr':'application/octet-stream'};
async function serve(directory){
 const root=resolve(directory),server=createServer(async(req,res)=>{
  try{const file=resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
   if(!file.startsWith(root+sep)||!(await stat(file)).isFile())throw new Error('missing');
   res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream'});res.end(await readFile(file));
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));return{server,url:`http://127.0.0.1:${server.address().port}`};
}
const baselineDirectory=process.env.ATC_BASELINE_DIR||'gameplay-qa/baseline-build/dist',output=process.env.ATC_PERFORMANCE_OUTPUT||'gameplay-qa/performance.json';
const baseline=await serve(baselineDirectory),current=await serve('dist');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--disable-background-timer-throttling']});
const errors=[],results=[];let fixture;
try{
 for(let round=0;round<2;round++)for(const version of round?['current','baseline']:['baseline','current']){
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(`${version}: ${e.message}`));
  await page.goto((version==='baseline'?baseline:current).url);await page.waitForFunction(()=>window.__ATC);
  await page.evaluate(async()=>{await window.__ATC.scene.assetsReady;});
  if(!fixture)fixture=await page.evaluate(()=>{
   const api=window.__ATC;api.begin({seed:182731,duration:0,tutorial:false,incidents:'off',positions:['Delivery','Ground','Tower','Approach','Departure']});const s=api.sim;s.timeScale=0;s.clearTraffic();
   for(const type of ['A320','B78X','A350','A321','B77W','B789','A330','A320','A321']){
    const a=s.spawn('departure',type);if(!a)continue;const route=s.proposeRoute(a.id);s.assignRoute(a,route);const m=s.motion.get(a.id),start=m.path[0];a.position={x:start.x,y:0,z:start.z};m.point=1;a.state='TAXIING';a.role='Ground';a.speed=0;
   }
   for(const type of ['A350','B77F','A320','B789','A321']){const a=s.spawn('arrival',type);if(a){a.state='FINAL';a.role='Tower';}}
   return JSON.parse(JSON.stringify({aircraft:s.aircraft,motion:[...s.motion],gateOccupancy:[...s.gateOccupancy],time:22*3600,direction:s.activeDirection}));
  });
  for(const speed of [0,1,8]){
   await page.evaluate(({fixture,speed})=>{
    const api=window.__ATC;api.begin({seed:182731,duration:0,tutorial:false,incidents:'off',difficulty:'standard',positions:['Delivery','Ground','Tower','Approach','Departure']});
    const s=api.sim,v=api.scene;s.clearTraffic();s.aircraft=fixture.aircraft;s.motion=new Map(fixture.motion);s.gateOccupancy=new Map(fixture.gateOccupancy);s.schedule=[];s.elapsed=0;s.time=fixture.time;s.activeDirection=fixture.direction;s.timeScale=speed;
    s.weather={kind:'clear',windDirection:60,windSpeed:9,visibility:16000,wetness:0};
    v.setQuality('medium');v.setImmersive(true);api.select(null);v.setCamera('seat');v.camera.position.copy(v.goalPosition);v.lookTarget.copy(v.goalTarget);v.camera.lookAt(v.lookTarget);v.transition=0;api.refresh();
   },{fixture,speed});
   await page.addStyleTag({content:'.hud,.tutorial-card{visibility:hidden!important}'});
   const sample=await page.evaluate(async()=>{
    const s=window.__ATC.sim,v=window.__ATC.scene,original=s.update.bind(s),cpu=[];s.update=dt=>{const start=performance.now();original(dt);cpu.push(performance.now()-start);};
    for(let i=0;i<45;i++)await new Promise(requestAnimationFrame);
    const frames=[];let last=performance.now();cpu.length=0;
    for(let i=0;i<180;i++){await new Promise(requestAnimationFrame);const now=performance.now();frames.push(now-last);last=now;}
    s.update=original;frames.sort((a,b)=>a-b);cpu.sort((a,b)=>a-b);const gl=v.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
    return{medianFrameMs:frames[Math.floor(frames.length*.5)],p95FrameMs:frames[Math.floor(frames.length*.95)],cpuMeanMs:cpu.reduce((a,b)=>a+b,0)/cpu.length,cpuP95Ms:cpu[Math.floor(cpu.length*.95)],aircraft:s.aircraft.length,samples:gl.getParameter(gl.SAMPLES),width:v.renderer.domElement.width,height:v.renderer.domElement.height,shadows:v.renderer.shadowMap.enabled,post:!!v.post,calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};
   });
   results.push({round,version,speed,...sample});console.log(version,round,speed+'x',sample.medianFrameMs.toFixed(2)+' ms',sample.cpuMeanMs.toFixed(3)+' ms simulation CPU');
  }
  await page.close();
 }
 const summary=[0,1,8].map(speed=>{const mean=version=>{const rows=results.filter(r=>r.version===version&&r.speed===speed);return rows.reduce((a,b)=>a+b.medianFrameMs,0)/rows.length;};const before=mean('baseline'),after=mean('current');return{speed,baselineFrameMs:before,currentFrameMs:after,changePercent:(after/before-1)*100};});
 await mkdir(resolve(output,'..'),{recursive:true});await writeFile(output,JSON.stringify({viewport:[1440,900],quality:'medium',fixtureAircraft:fixture.aircraft.length,baseline:baselineDirectory,framesPerSample:180,warmupFrames:45,results,summary,errors},null,2));
 assert.deepEqual(errors,[]);assert(results.every(r=>r.samples===4&&r.shadows&&!r.post),'Graphics settings must be identical');
 console.log(JSON.stringify(summary));
}finally{await browser.close();await Promise.all([new Promise(r=>baseline.server.close(r)),new Promise(r=>current.server.close(r))]);}
