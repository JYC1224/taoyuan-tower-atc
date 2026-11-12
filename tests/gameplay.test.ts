import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/Simulation';
import {DIFFICULTIES} from '../src/sim/difficulty';
import {thresholdETA,takeoffEstimate} from '../src/sim/RunwayPlanner';
import {RequestQueue} from '../src/sim/RequestQueue';
import {runways} from '../src/data/airport';
import type {Scenario,Aircraft} from '../src/types';
const config=(overrides:Partial<Scenario>={}):Scenario=>({date:'2026-09-18',startTime:'12:00',duration:0,difficulty:'standard',weather:'clear',seed:17,incidents:'off',positions:['Delivery','Ground','Tower','Approach','Departure'],tutorial:false,density:.3,...overrides});
function isolated(){const sim=new Simulation(config());sim.clearTraffic();(sim as any).schedule=[];return sim;}
function advance(sim:Simulation,until:()=>boolean,seconds=1800){for(let i=0;i<seconds*5&&!until();i++)sim.update(.2);assert(until());}
function finalAt(sim:Simulation,seconds:number){let a=sim.spawn('arrival','A320')!;if(a.runway!==runways[0].ends[0])a=sim.spawn('arrival','A320')!;a.state='FINAL';a.role='Tower';const rw=runways[0];a.position.x=rw.x-rw.length/2+rw.thresholdOffsets['05']-seconds*a.speed;return a;}

test('one pushback clearance covers engines; taxi reaches hold without continue clicks',()=>{
 const sim=isolated(),a=sim.spawn('departure','A320')!;advance(sim,()=>sim.availableCommands(a.id).includes('approvePushback'),10);
 assert.equal(sim.command(a.id,'approvePushback').ok,true);advance(sim,()=>a.state==='READY_TO_TAXI');assert(sim.scores.routineCommands>=2);
 sim.update(30);assert.equal(a.state,'READY_TO_TAXI');assert.equal(sim.command(a.id,'taxi').ok,true);advance(sim,()=>a.state==='HOLDING_SHORT');
 sim.update(30);assert.equal(a.state,'HOLDING_SHORT');assert.equal(sim.scores.playerCommands,2);assert.equal(sim.scores.decisions,2);
});
test('routine landing exit and handoff require no repeated vacate requests',()=>{
 const sim=isolated(),a=sim.spawn('arrival','A320')!;assert(sim.command(a.id,'clearApproach').ok);advance(sim,()=>a.role==='Tower',10);assert(sim.command(a.id,'land').ok);
 advance(sim,()=>a.state==='GROUND_CONTACT'&&a.role==='Ground');assert(sim.command(a.id,'taxiToGate').ok);advance(sim,()=>a.completed);assert.equal(sim.scores.playerCommands,3);
});
test('request queue preserves timestamp, ages calmly, resolves requests and resets',()=>{
 const sim=isolated(),a=sim.spawn('departure','A320')!,queue=new RequestQueue();a.role='Ground';
 const input={aircraft:[a],time:100,elapsed:0,scenario:sim.scenario,conflicts:[],waits:new Map(),runways:[],gates:new Map(),directionMismatch:false};
 const first=queue.update(input)[0];assert.equal(first.urgency,'low');const aged=queue.update({...input,time:800,elapsed:700})[0];assert.equal(aged.time,100);assert.equal(aged.age,700);assert.equal(aged.urgency,'high');assert.notEqual(aged.urgency,'critical');
 a.state='PUSHING';assert.equal(queue.update({...input,elapsed:701}).length,0);queue.reset();a.state='REQUESTING_PUSHBACK';assert.equal(queue.update({...input,time:900,elapsed:800})[0].time,900);
});
test('runway estimates allow a departure gap and reject insufficient arrival time',()=>{
 const sim=isolated(),d=sim.spawn('departure','A320')!;d.runway='05L';(sim as any).motion.get(d.id).runwayId='north';d.state='HOLDING_SHORT';d.role='Tower';
 const a=finalAt(sim,240);assert(thresholdETA(a)>230);assert(sim.command(d.id,'lineUp').ok);
 const plan=sim.getOperations(true).runways.find(r=>r.id==='north')!;assert(plan.windows.some(w=>w.before===a.id&&w.end>w.start));assert(takeoffEstimate(d,sim.weather)>20);
 d.state='HOLDING_SHORT';a.position.x+=a.speed*210;const denied=sim.command(d.id,'lineUp');assert.equal(denied.ok,false);assert.match(denied.warning??'',/threshold ETA/);
});
test('four difficulty presets change workload, manual priority, routine automation and guidance',()=>{
 const modes=['assisted','standard','advanced','hardcore'] as const;const counts=modes.map(difficulty=>new Simulation(config({difficulty})).aircraft.length);
 assert.deepEqual(counts,[6,9,12,14]);assert.deepEqual(modes.map(d=>DIFFICULTIES[d].guidance),['full','predictions','limited','minimal']);
 assert.deepEqual(modes.map(d=>DIFFICULTIES[d].priority),['auto','important','all','all']);assert(!DIFFICULTIES.hardcore.routine);assert(DIFFICULTIES.advanced.safetyFactor>DIFFICULTIES.standard.safetyFactor);
});
test('legitimate hold/resume safety interventions do not lower command efficiency',()=>{
 const sim=isolated(),a=sim.spawn('departure','A320')!;a.state='READY_TO_TAXI';sim.debugOccupyRunway();a.runway='05L';(sim as any).motion.get(a.id).runwayId='north';
 for(let i=0;i<3;i++){assert(sim.command(a.id,'hold').ok);assert(sim.command(a.id,'resume').ok);}assert.equal(sim.scores.commandEfficiency,100);
 sim.debugOccupyRunway();for(let i=0;i<3;i++){sim.command(a.id,'hold');sim.command(a.id,'resume');}assert(sim.scores.commandEfficiency<100);
});
test('route alternatives expose costs and cancel taxi releases future leases without relocation',()=>{
 const sim=isolated(),a=sim.spawn('departure','A320')!;advance(sim,()=>sim.availableCommands(a.id).includes('approvePushback'),10);sim.command(a.id,'approvePushback');advance(sim,()=>a.state==='READY_TO_TAXI');
 const routes=sim.proposeRoutes(a.id);assert(routes.length>1);assert(routes.every(r=>r.estimatedSeconds!>0));assert.equal(routes.filter(r=>r.recommended).length,1);assert.equal(new Set(routes.map(r=>r.id)).size,routes.length);
 assert(sim.command(a.id,'taxi',false,'route:'+routes.at(-1)!.id).ok);assert.deepEqual(a.route,routes.at(-1)!.nodes);sim.update(30);const before={...a.position};assert(sim.command(a.id,'cancelTaxi').ok);advance(sim,()=>a.state==='READY_TO_TAXI',30);
 assert(Math.hypot(a.position.x-before.x,a.position.z-before.z)<50);assert.equal(a.route.length,0);assert([...sim.ground.reservations.values()].filter(r=>r.owner===a.id).every(r=>r.committed));assert(sim.command(a.id,'taxi').ok);
});
test('inbound stand plans expose gate pressure and accept a compatible alternative',()=>{
 const sim=isolated(),d=sim.spawn('departure','A320')!,a=finalAt(sim,300);assert(sim.assignGate(a.id,d.gate).ok);assert(sim.getOperations(true).requests.some(r=>r.kind==='gate'&&r.aircraftId===a.id));
 const other=sim.aircraft.find(o=>o.id!==a.id&&o.kind==='arrival');const free=sim.proposeRoutes(a.id).length;
 assert.equal(free,1);assert.equal(sim.proposeRoute(a.id)?.nodes.length,0);
 assert(sim.assignGate(a.id,other?.gate==='A7'?'A8':'A7').ok);assert(!sim.getOperations(true).requests.some(r=>r.kind==='gate'&&r.aircraftId===a.id));
});
test('runway reconfiguration drains committed traffic before releasing new taxi clearances',()=>{
 const sim=isolated(),a=sim.spawn('departure','A320')!,arrival=sim.spawn('arrival','A320')!;a.state='READY_TO_TAXI';
 assert(sim.planDirection('23').ok);assert.equal(sim.activeDirection,'05');assert.equal(sim.command(a.id,'taxi').ok,false);sim.update(10);assert.equal(sim.pendingDirection,'23');
 // The arrival remains on its original runway until the controller finishes it.
 assert(arrival.runway.startsWith('05'));arrival.completed=true;sim.update(5);assert.equal(sim.activeDirection,'23');assert.equal(sim.pendingDirection,undefined);assert(a.runway.startsWith('23'));assert(sim.command(a.id,'taxi').ok);
});
test('runway occupancy includes the tail of a perpendicular vacating aircraft',()=>{
 const sim=isolated(),a=sim.spawn('arrival','A321')!,r=runways[1];a.state='VACATING_RUNWAY';a.runway=r.ends[0];a.position={x:547,y:0,z:r.z-54};a.heading=0;(sim as any).refreshOccupancy();assert(sim.runwayOccupancy.get(r.id)?.includes(a.id));
 a.position.z=r.z-120;(sim as any).refreshOccupancy();assert(!sim.runwayOccupancy.get(r.id)?.includes(a.id));
});
