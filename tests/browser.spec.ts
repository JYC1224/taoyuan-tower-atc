import {test,expect,type Page} from '@playwright/test';
import {taxiNodes,tower} from '../src/data/airport';

async function start(page:Page,tutorial=false){
  await page.goto('/');
  await expect(page.locator('.briefing')).toBeVisible();
  if(tutorial)await page.locator('[data-mode="training"]').click();
  await page.locator('.start-button').click();
  await page.locator('#skip-intro').click();
  await expect(page.locator('.hud')).toBeVisible();
  await page.locator('[data-speed="0"]').click();
}
async function step(page:Page,seconds:number){
  await page.evaluate(seconds=>{
    const a=(window as any).__ATC,s=a.sim;s.timeScale=1;
    for(let left=seconds;left>0;left-=Math.min(left,1))s.update(Math.min(left,1));
    s.timeScale=0;a.refresh();
  },seconds);
}
async function untilState(page:Page,id:string,states:string[],limit=1800){
  const result=await page.evaluate(({id,states,limit})=>{
    const api=(window as any).__ATC,s=api.sim;s.timeScale=1;
    let waited=0;for(;waited<limit;waited++){
      const a=s.aircraft.find((a:any)=>a.id===id);
      if(a&&states.includes(a.state))break;s.update(1);api.refresh();
    }
    s.timeScale=0;api.refresh();const a=s.aircraft.find((a:any)=>a.id===id);
    return {state:a?.state,waited,ended:s.ended};
  },{id,states,limit});
  expect(result.ended).toBe(false);expect(states,JSON.stringify(result)).toContain(result.state);
}
async function select(page:Page,id:string){await page.locator(`[data-aircraft="${id}"]`).click();}
async function issue(page:Page,cmd:string){
  if(await page.locator('#switch-aircraft-role').isVisible())await page.locator('#switch-aircraft-role').click();
  await page.locator(`[data-command="${cmd}"]`).click();
  if(cmd==='taxi'||cmd==='taxiToGate')await page.locator('#accept-route').click();
}

test('airport audio follows aircraft and exposes volume controls',async({page})=>{
 await page.addInitScript(()=>{
  const original=AudioContext.prototype.createGain;
  (window as any).__audioGains=[];
  AudioContext.prototype.createGain=function(){const gain=original.call(this);(window as any).__audioGains.push(gain);return gain;};
 });
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('.start-button').click();await page.locator('#skip-intro').click();
 await expect.poll(()=>page.evaluate(()=>(window as any).__audioGains.length)).toBeGreaterThanOrEqual(5);
 await page.evaluate(()=>{
  const api=(window as any).__ATC,s=api.sim;s.update=()=>{};s.timeScale=1;
  const a=s.aircraft[0]??s.spawn('departure','A320');a.completed=false;a.state='TAKEOFF_ROLL';a.speed=50;
  const p=api.scene.audioPosition();a.position={x:p.x,y:p.y,z:p.z};
 });
 await expect.poll(()=>page.evaluate(()=>(window as any).__audioGains[3].gain.value),{timeout:5000}).toBeGreaterThan(.05);
 await page.locator('#settings').click();await page.locator('#audio-volume').fill('30');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('atc-volume')!))).toBe(.3);
 await page.locator('#radio-voice').uncheck();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('atc-radio-voice')!))).toBe(false);
 await page.locator('#audio').uncheck();await expect.poll(()=>page.evaluate(()=>(window as any).__audioGains[0].gain.value),{timeout:5000}).toBeLessThan(.002);
 expect(errors).toEqual([]);
});

test('production launch, bilingual UI, eight camera modes, cabin movement, immersive workstation and time controls',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.locator('.briefing')).toBeVisible();
  await page.locator('#language').click();await expect(page.locator('.start-button')).toContainText('進入管制席');
  await page.locator('#language').click();await start(page);await select(page,'AC-1');
  const positions:number[][]=[];
  for(const mode of ['seat','walk','window','free','follow','orbit','runway','gate']){
    await page.locator(`[data-camera="${mode}"]`).click();
    await expect.poll(()=>page.evaluate(()=>(window as any).__ATC.scene.cameraMode)).toBe(mode);
    // Complete only the camera interpolation; aircraft state remains paused.
    const p=await page.evaluate(()=>{const a=(window as any).__ATC;for(let i=0;i<15;i++)a.scene.update(a.sim,a.selected,.1);return a.scene.camera.position.toArray();});positions.push(p);
  }
  expect(new Set(positions.map(p=>p.map(v=>Math.round(v)).join(','))).size).toBe(8);
  await page.locator('[data-camera="walk"]').click();
  await page.evaluate(()=>{const a=(window as any).__ATC;for(let i=0;i<15;i++)a.scene.update(a.sim,a.selected,.1);});
  const before=await page.evaluate(()=>(window as any).__ATC.scene.camera.position.toArray());
  await page.keyboard.down('d');
  await page.evaluate(()=>{const a=(window as any).__ATC;for(let i=0;i<100;i++)a.scene.update(a.sim,a.selected,.1);});
  await page.keyboard.up('d');
  const after=await page.evaluate(()=>(window as any).__ATC.scene.camera.position.toArray());expect(after).not.toEqual(before);expect(Math.hypot(after[0]-tower.x,after[2]-tower.z)).toBeLessThanOrEqual(11.2);
  await page.locator('#hud-mode').click();await expect(page.locator('.hud')).toHaveClass(/immersion/);
  // Project a real screen center and click the render canvas to test raycast interaction.
  const screen=await page.evaluate(()=>{const a=(window as any).__ATC,s=a.scene;for(let i=0;i<15;i++)s.update(a.sim,a.selected,.1);const mesh=s.environment.screens[1];const p=mesh.position.clone();mesh.getWorldPosition(p);p.project(s.camera);return {x:(p.x*.5+.5)*innerWidth,y:(-.5*p.y+.5)*innerHeight};});
  await page.mouse.click(screen.x,screen.y);await expect(page.locator('.hud')).not.toHaveClass(/immersion/);
  const paused=await page.evaluate(()=>(window as any).__ATC.sim.time);await page.waitForTimeout(150);expect(await page.evaluate(()=>(window as any).__ATC.sim.time)).toBe(paused);
  await page.locator('[data-speed="8"]').click();await expect.poll(()=>page.evaluate(()=>(window as any).__ATC.sim.time)).toBeGreaterThan(paused+1);await page.locator('[data-speed="0"]').click();
  await page.screenshot({path:'test-results/tower-seat.png'});expect(errors).toEqual([]);
});

test('interactive tutorial completes departure and arrival through actual command buttons and routing dialogs',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page,true);
  await page.locator('#tutorial-next').click();await select(page,'AC-1');
  await issue(page,'delivery');await issue(page,'approvePushback');await untilState(page,'AC-1',['ENGINE_START']);
  await issue(page,'startEngines');await untilState(page,'AC-1',['READY_TO_TAXI']);
  await issue(page,'taxi');await untilState(page,'AC-1',['HOLDING_SHORT']);
  await issue(page,'lineUp');await untilState(page,'AC-1',['READY_FOR_TAKEOFF']);
  await issue(page,'takeoff');await untilState(page,'AC-1',['AIRBORNE']);
  await issue(page,'contactDeparture');await untilState(page,'AC-1',['HANDED_OFF']);
  expect(await page.evaluate(()=>(window as any).__ATC.sim.scores.departures)).toBe(1);
  const id=await page.evaluate(()=>(window as any).__ATC.sim.aircraft.find((a:any)=>a.kind==='arrival'&&!a.completed).id);
  await select(page,id);await issue(page,'clearApproach');await issue(page,'contactTower');
  // The handoff button changes the aircraft role; reselect confirms the player's Tower position.
  await select(page,id);await issue(page,'land');await untilState(page,id,['DECELERATING']);
  await issue(page,'vacate');await untilState(page,id,['GROUND_CONTACT']);await issue(page,'contactGround');
  await issue(page,'taxiToGate');await untilState(page,id,['DOCKED']);
  expect(await page.evaluate(()=>(window as any).__ATC.sim.scores.arrivals)).toBe(1);
  expect(await page.evaluate(id=>{const a=(window as any).__ATC;a.scene.update(a.sim,a.selected,.1);return a.scene.visuals.has(id);},id)).toBe(true);
  await expect(page.locator('#tutorial-next')).toBeVisible();await page.locator('#tutorial-next').click();await page.locator('#tutorial-next').click();
  expect(await page.evaluate(()=>(window as any).__ATC.sim.scenario.tutorial)).toBe(false);
  await page.locator('[data-camera="gate"]').click();await page.evaluate(()=>{const a=(window as any).__ATC;for(let i=0;i<15;i++)a.scene.update(a.sim,a.selected,.1);});
  await page.screenshot({path:'test-results/tutorial-completed.png'});expect(errors).toEqual([]);
});

test('unsafe-clearance warning, occupied stand preview, weather recommendation and completed quick-shift report',async({page})=>{
  await start(page);await page.keyboard.press('F3');await page.locator('#trigger-conflict').click();
  await expect(page.locator('[data-override]')).toBeVisible();await expect(page.locator('.modal')).toContainText(/occupied/);
  await page.locator('[data-override]').click();expect(await page.evaluate(()=>(window as any).__ATC.sim.scores.safety)).toBeLessThan(100);
  await page.locator('#inspect-route').click();const gate=await page.locator('#route-gate option').filter({hasText:'OCCUPIED'}).first().getAttribute('value');
  await page.locator('#route-gate').selectOption(gate!);await expect(page.locator('#route-details')).toContainText(/occupied/);await page.locator('[data-close]').click();
  await page.locator('#gate-board').click();await expect(page.locator('.gate-table tbody tr')).toHaveCount(51);await page.locator('[data-close]').click();
  await page.locator('#weather-settings').click();await page.locator('#weather-kind').selectOption('rain');await page.locator('#wind-direction').fill('230');await page.locator('#wind-speed').fill('16');await page.locator('#apply-weather').click();await expect(page.locator('#recommendation')).toHaveText('23');
  await step(page,900);await expect(page.locator('.score-hero')).toBeVisible();await expect(page.locator('.score-categories .score-category')).toHaveCount(5);await page.screenshot({path:'test-results/shift-report.png'});
  await page.locator('#summary-continue').click();await step(page,60);expect(await page.evaluate(()=>(window as any).__ATC.sim.ended)).toBe(false);
});

test('operations queue, route choices, planning, difficulty and ground priority controls work in the production UI',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
  await expect(page.locator('[name="difficulty"] option')).toHaveCount(4);await page.locator('[name="difficulty"]').selectOption('advanced');await expect(page.locator('#difficulty-note')).toContainText('manual');
  await page.locator('[name="difficulty"]').selectOption('standard');await page.locator('.start-button').click();await page.locator('#skip-intro').click();await page.locator('[data-speed="0"]').click();
  await page.locator('[data-traffic-tab="requests"]').click();await expect(page.locator('.request-strip').first()).toBeVisible();await expect(page.locator('#request-count')).not.toHaveText('0');
  await page.locator('#operations-open').click();await expect(page.locator('.ops-runways .ops-card')).toHaveCount(2);
  await expect(page.locator('#operations-body')).toContainText('TAKEOFF OPPORTUNITIES');await page.locator('#operations-plan').click();expect(await page.evaluate(()=>(window as any).__ATC.sim.timeScale)).toBe(0);await page.screenshot({path:'gameplay-qa/operations-standard.png'});
  await page.locator('#operations-debug').click();await expect(page.locator('#ground-debug-canvas')).toBeVisible();await expect(page.locator('[data-ground-layer]')).toHaveCount(7);await page.locator('[data-ground-layer="edges"]').uncheck();await page.locator('[data-ground-layer="edges"]').check();await page.locator('[data-close]').click();
  // Two genuine airport routes meet ahead of their current positions. Hardcore
  // holds for a controller choice; the UI can set it while time is paused.
  await page.evaluate(nodes=>{const api=(window as any).__ATC,s=api.sim;s.clearTraffic();s.scenario.difficulty='hardcore';s.scenario.tutorial=true;s.timeScale=1;
    for(const route of [['N4','N5','N6'],['P6','P5','N5','N6']]){const a=s.spawn('departure','A320'),n=nodes.find(n=>n.id===route[0])!;a.position={x:n.x,y:0,z:n.z};a.state='TAXIING';s.assignRoute(a,{nodes:route,names:['Fixture'],distance:0});}s.update(.1);s.timeScale=0;api.refresh();
  },taxiNodes.map(n=>({id:n.id,x:n.x,z:n.z})));
  await page.locator('#operations-open').click();await expect(page.locator('[data-priority]:not([disabled])').first()).toBeVisible();const before=await page.evaluate(()=>(window as any).__ATC.sim.scores.decisions);await page.locator('[data-priority]:not([disabled])').first().click();expect(await page.evaluate(()=>(window as any).__ATC.sim.scores.decisions)).toBe(before+1);
  await page.screenshot({path:'gameplay-qa/ground-priority.png'});await page.locator('#operations-debug').click();await page.screenshot({path:'gameplay-qa/ground-reservations.png'});await page.locator('[data-close]').click();
  await page.evaluate(()=>{const api=(window as any).__ATC,s=api.sim;s.clearTraffic();s.scenario.difficulty='standard';s.scenario.tutorial=true;const a=s.spawn('departure','A320');a.state='READY_TO_TAXI';api.select(a.id);api.refresh();});
  await page.locator('[data-command="taxi"]').click();await expect(page.locator('.route-option').nth(1)).toBeVisible();await page.locator('[name="taxi-route"]').nth(1).check();await page.locator('#accept-route').click();await expect(page.locator('#command-panel')).toContainText('taxi cleared');
  await page.locator('#settings').click();await page.locator('#setting-language').click();await page.locator('#operations-open').click();await expect(page.locator('#operations-body')).toContainText('地面優先權');await page.screenshot({path:'gameplay-qa/operations-zh.png'});expect(errors).toEqual([]);
});
