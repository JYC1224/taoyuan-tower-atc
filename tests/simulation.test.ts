import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/sim/Simulation';
import { performanceFor } from '../src/sim/performance';
import { shortestRoute, nodeById, distance } from '../src/sim/routing';
import { gates, runways, taxiEdges } from '../src/data/airport';
import { FLEET } from '../src/data/fleet';
import { TypicalDayFallbackProvider } from '../src/data/schedule';
import type { Aircraft, Command, Scenario } from '../src/types';

const scenario=(changes:Partial<Scenario>={}):Scenario=>({date:'2026-09-06',startTime:'17:00',duration:120,difficulty:'standard',weather:'clear',seed:182731,incidents:'off',positions:['Delivery','Ground','Tower','Approach','Departure'],tutorial:true,density:.3,...changes});
function tickUntil(sim:Simulation,predicate:()=>boolean,limit=2400):void{for(let i=0;i<limit*5&&!predicate();i++)sim.update(.2);assert.ok(predicate(),`timed out: ${sim.aircraft.map(a=>`${a.id} ${a.state} ${a.clearance}`).join('; ')}`);}
function command(sim:Simulation,a:Aircraft,cmd:Command,value?:number|string):void{const result=sim.command(a.id,cmd,false,value);assert.equal(result.ok,true,`${cmd}: ${result.reason??result.warning??''}`);}
function departToHold(sim:Simulation,a:Aircraft):void {if(sim.availableCommands(a.id).includes('delivery'))command(sim,a,'delivery');command(sim,a,'approvePushback');tickUntil(sim,()=>a.state==='ENGINE_START');command(sim,a,'startEngines');tickUntil(sim,()=>a.state==='READY_TO_TAXI');command(sim,a,'taxi');tickUntil(sim,()=>a.state==='HOLDING_SHORT');}

test('departure completes the gate, pushback, engines, graph taxi, line-up, rotation and handoff lifecycle',()=>{
  const sim=new Simulation(scenario());const a=sim.aircraft[0],initial={...a.position};
  departToHold(sim,a);assert.ok(distance(initial,a.position)>200);assert.equal(a.speed,0);assert.equal(sim.gateOccupancy.has(a.gate),false);assert.ok(a.route.length>3);
  command(sim,a,'lineUp');tickUntil(sim,()=>a.state==='READY_FOR_TAKEOFF');assert.ok(sim.runwayOccupancy.get(a.runway)?.includes(a.id));
  command(sim,a,'takeoff');tickUntil(sim,()=>a.state==='AIRBORNE');assert.ok(a.position.y>9);assert.ok(a.speed>55);
  command(sim,a,'contactDeparture');tickUntil(sim,()=>a.completed);assert.equal(a.state,'HANDED_OFF');assert.equal(sim.scores.departures,1);
});

test('arrival completes approach, landing, deceleration, exit, handoff, graph taxi and docking',()=>{
  const sim=new Simulation(scenario());sim.clearTraffic();const a=sim.spawn('arrival','A350')!;
  command(sim,a,'clearApproach');command(sim,a,'contactTower');command(sim,a,'land');
  tickUntil(sim,()=>a.state==='DECELERATING');assert.equal(a.position.y,0);command(sim,a,'vacate');
  tickUntil(sim,()=>a.state==='GROUND_CONTACT');assert.ok(!sim.runwayOccupancy.get(a.runway)?.includes(a.id));command(sim,a,'contactGround');
  const gate=gates.find(g=>g.id===a.gate)!;command(sim,a,'taxiToGate');assert.equal(sim.gateOccupancy.get(a.gate),a.id);tickUntil(sim,()=>a.completed);
  assert.equal(a.state,'DOCKED');assert.ok(distance(a.position,gate)<.1);assert.equal(sim.scores.arrivals,1);
});

test('both directions of both physical runways have compatible graph routes and isolated holds',()=>{
  for(const rw of runways)for(const dir of ['05','23'] as const){
    const route=shortestRoute(gates[3].pushbackNodeId,rw.holdNodes[dir],{span:64.8});assert.ok(route?.nodes.length);
    assert.ok(route!.nodes.every(id=>nodeById.has(id)));assert.ok(!route!.nodes.some(id=>id.startsWith('entry-')));
    const entry=shortestRoute(rw.holdNodes[dir],rw.entryNodes[dir],{span:64.8,allowRunway:true});assert.ok(entry);
    assert.equal(shortestRoute(rw.holdNodes[dir],rw.entryNodes[dir],{span:64.8}),null);
    const toGate=shortestRoute(rw.exitNodes[dir],gates[3].nodeId,{span:64.8});assert.ok(toGate);
  }
});

test('explicit unsafe runway override warns, records event and reduces safety; assisted mode blocks override',()=>{
  const sim=new Simulation(scenario());const a=sim.aircraft[0];departToHold(sim,a);sim.debugOccupyRunway();
  const warning=sim.command(a.id,'lineUp');assert.equal(warning.ok,false);assert.match(warning.warning!,/occupied/);assert.equal(sim.scores.safety,100);
  assert.equal(sim.command(a.id,'lineUp',true).ok,true);assert.ok(sim.scores.safety<100);assert.ok(sim.scores.events.length);const pos={...a.position};sim.update(20);assert.ok(distance(pos,a.position)<1);
  const assisted=new Simulation(scenario({difficulty:'assisted'}));const b=assisted.aircraft[0];departToHold(assisted,b);assisted.debugOccupyRunway();assert.equal(assisted.command(b.id,'lineUp',true).ok,false);
});

test('occupied stands reject arrival assignment and provide a compatible alternate route',()=>{
  const sim=new Simulation(scenario());const departure=sim.aircraft[0],arrival=sim.spawn('arrival','A320')!;
  const blocked=sim.proposeRoute(arrival.id,departure.gate);assert.equal(blocked?.nodes.length,0);assert.match(blocked?.warning??'',/occupied/);
  const gate=gates.find(g=>g.id!==departure.gate&&g.maxSpan>=FLEET[arrival.type].span)!;assert.ok(sim.proposeRoute(arrival.id,gate.id)?.nodes.length);
});

test('heavy weight and wet runway change acceleration, rotation speed and landing stopping distance',()=>{
  const sim=new Simulation(scenario()),dry=sim.weather;
  const light=performanceFor({type:'B77W',weight:220000},dry),heavy=performanceFor({type:'B77W',weight:340000},dry);
  assert.ok(heavy.acceleration<light.acceleration);assert.ok(heavy.vr>light.vr);assert.ok(heavy.climbRate<light.climbRate);
  sim.setWeather('rain');const wet=performanceFor({type:'B77W',weight:340000},sim.weather);assert.ok(wet.stoppingDistance>heavy.stoppingDistance);assert.ok(wet.taxiBraking<heavy.taxiBraking);
  assert.notEqual(performanceFor({type:'A320',weight:62000},dry).acceleration,heavy.acceleration);
});

test('fixed ticks are deterministic across render frame chunks, pause, and accelerated time',()=>{
  const a=new Simulation(scenario()),b=new Simulation(scenario());command(a,a.aircraft[0],'delivery');command(b,b.aircraft[0],'delivery');command(a,a.aircraft[0],'approvePushback');command(b,b.aircraft[0],'approvePushback');
  for(let i=0;i<100;i++)a.update(.1);for(let i=0;i<20;i++)b.update(.5);
  assert.deepEqual(a.aircraft,b.aircraft);const time=a.time;a.timeScale=0;a.update(30);assert.equal(a.time,time);a.timeScale=4;a.update(2);assert.ok(Math.abs(a.time-time-8)<1e-6);
});

test('wind recommendation changes without reversing traffic with committed routes',()=>{
  const sim=new Simulation(scenario());sim.setWeather('clear',230,12);assert.equal(sim.recommendedDirection,'23');assert.equal(sim.activeDirection,'05');assert.equal(sim.setDirection('23').ok,true);
  const a=sim.aircraft[0];departToHold(sim,a);assert.equal(a.runway,'23R');assert.equal(sim.setDirection('05').ok,false);assert.equal(a.runway,'23R');
});

test('schedule uses deterministic nonuniform typical-day banks and never claims exact published flights',()=>{
  const provider=new TypicalDayFallbackProvider(),a=provider.flights('2026-09-06',10,1),b=provider.flights('2026-09-06',10,1);assert.equal(provider.exact,false);assert.deepEqual(a,b);
  const gaps=a.slice(1).map((f,i)=>Math.round(f.time-a[i].time));assert.ok(new Set(gaps).size>50);
  const hour=(h:number)=>a.filter(f=>f.time>=h*3600&&f.time<(h+1)*3600).length;assert.ok(hour(18)>hour(3)*4);
});

test('hold and resume preserve cleared route and prevent ground aircraft passing through an obstruction',()=>{
  const sim=new Simulation(scenario());const a=sim.aircraft[0];command(sim,a,'delivery');command(sim,a,'approvePushback');tickUntil(sim,()=>a.state==='ENGINE_START');command(sim,a,'startEngines');tickUntil(sim,()=>a.state==='READY_TO_TAXI');command(sim,a,'taxi');sim.update(10);
  command(sim,a,'hold');sim.update(10);const stopped={...a.position};sim.update(5);assert.deepEqual(a.position,stopped);const route=[...a.route];command(sim,a,'resume');sim.update(10);assert.deepEqual(a.route,route);assert.ok(distance(a.position,stopped)>0);
  const obstruction=sim.spawn('departure','A320')!;const target=nodeById.get(a.route[Math.min(a.routeIndex+1,a.route.length-1)])!;obstruction.position={x:target.x,y:0,z:target.z};obstruction.held=true;
  const separation=(FLEET[a.type].length+FLEET[obstruction.type].length)*.5+17;
  for(let i=0;i<1200;i++){sim.update(.1);assert.ok(distance(a.position,obstruction.position)>=separation||distance(stopped,obstruction.position)<separation);}
});

test('routing respects closures and aircraft size restrictions',()=>{
  const gate=gates.find(g=>g.maxSpan===36)!;assert.equal(shortestRoute(gate.pushbackNodeId,gate.nodeId,{span:64.8}),null);
  const edge=taxiEdges.find(e=>e.to===gate.nodeId||e.from===gate.nodeId)!;const was=edge.active;edge.active=false;try{assert.equal(shortestRoute(gate.pushbackNodeId,gate.nodeId,{span:35.8}),null);}finally{edge.active=was;}
});

test('unattended role assistance completes traffic but does not issue commands for player-controlled positions',()=>{
  const sim=new Simulation(scenario({positions:['Ground','Tower']}));const a=sim.aircraft[0];sim.update(60);assert.equal(a.state,'REQUESTING_PUSHBACK');assert.equal(sim.scores.commands,0);
  const automatic=new Simulation(scenario({positions:[]}));tickUntil(automatic,()=>automatic.scores.departures>0,1800);assert.ok(automatic.scores.commands>=6);
});

test('zero-duration tutorial and sandbox stay active while a timed shift ends at its boundary',()=>{
  for(const tutorial of [true,false]){const sim=new Simulation(scenario({duration:0,tutorial}));sim.update(60);assert.equal(sim.ended,false);assert.ok(sim.elapsed>59);}
  const timed=new Simulation(scenario({duration:1}));timed.update(60);assert.equal(timed.ended,true);assert.equal(timed.availableCommands(timed.aircraft[0].id).length,0);
});

for(const direction of ['05','23'] as const)for(const runwayId of ['north','south'])test(`full ${runwayId} ${direction} arrival and departure lifecycles`,()=>{
  const sim=new Simulation(scenario({duration:0}));sim.clearTraffic();assert.equal(sim.setDirection(direction).ok,true);
  let departure=sim.spawn('departure','B77W')!;if(!runways.find(r=>r.id===runwayId)!.ends.includes(departure.runway)){sim.clearTraffic();departure=sim.spawn('departure','B77W')!;}
  departToHold(sim,departure);command(sim,departure,'lineUp');tickUntil(sim,()=>departure.state==='READY_FOR_TAKEOFF');command(sim,departure,'takeoff');tickUntil(sim,()=>departure.state==='AIRBORNE');command(sim,departure,'contactDeparture');tickUntil(sim,()=>departure.completed);assert.equal(sim.scores.departures,1);
  sim.clearTraffic();let arrival=sim.spawn('arrival','B77W')!;if(!runways.find(r=>r.id===runwayId)!.ends.includes(arrival.runway)){sim.clearTraffic();arrival=sim.spawn('arrival','B77W')!;}
  // Let the previous departure's modeled wake dissipate while still far out.
  sim.update(60);command(sim,arrival,'clearApproach');command(sim,arrival,'contactTower');command(sim,arrival,'land');tickUntil(sim,()=>arrival.state==='DECELERATING');command(sim,arrival,'vacate');tickUntil(sim,()=>arrival.state==='GROUND_CONTACT');command(sim,arrival,'contactGround');command(sim,arrival,'taxiToGate');tickUntil(sim,()=>arrival.completed);assert.equal(sim.scores.arrivals,1);
});

test('an uncleared final performs a continuous missed approach and can rejoin for a landing',()=>{
  const sim=new Simulation(scenario({duration:0}));sim.clearTraffic();const a=sim.spawn('arrival','A320')!;command(sim,a,'clearApproach');command(sim,a,'contactTower');
  tickUntil(sim,()=>a.state==='GO_AROUND');assert.ok(a.position.y>0);assert.equal(a.landingCleared,false);sim.update(35);command(sim,a,'clearApproach');assert.equal(a.state,'GO_AROUND');
  let previous={...a.position};for(let i=0;i<9000&&a.state==='GO_AROUND';i++){sim.update(.1);assert.ok(distance(previous,a.position)<20,'missed approach must never teleport');previous={...a.position};}
  assert.equal(a.state,'FINAL');command(sim,a,'contactTower');command(sim,a,'land');tickUntil(sim,()=>a.state==='DECELERATING');
});

test('subsequent runway clearances observe the heavy-aircraft wake interval',()=>{
  const sim=new Simulation(scenario({duration:0}));sim.clearTraffic();const leader=sim.spawn('departure','B77W')!;departToHold(sim,leader);command(sim,leader,'lineUp');tickUntil(sim,()=>leader.state==='READY_FOR_TAKEOFF');command(sim,leader,'takeoff');tickUntil(sim,()=>leader.state==='AIRBORNE');
  // An inbound on the same physical runway probes the public landing-clearance guard.
  let follower=sim.spawn('arrival','A320')!;if(follower.runway!==leader.runway)follower=sim.spawn('arrival','A320')!;
  command(sim,follower,'clearApproach');command(sim,follower,'contactTower');
  // A far arrival reaches the threshold after the wake expires. A short final
  // must still be rejected; compare predicted runway-use times, not issue times.
  assert.equal(sim.command(follower.id,'land').ok,true);follower.state='FINAL';follower.landingCleared=false;
  const rw=runways.find(r=>r.ends.includes(follower.runway))!,sign=follower.runway===rw.ends[0]?1:-1;
  follower.position.x=rw.x-sign*(rw.length/2-rw.thresholdOffsets[sign===1?'05':'23'])-sign*1500;
  const result=sim.command(follower.id,'land');assert.equal(result.ok,false);assert.match(result.warning??'',/Wake spacing/);
});

test('heading altitude and speed instructions affect airborne targets in aviation units',()=>{
  const sim=new Simulation(scenario());const a=sim.spawn('arrival','A320')!;command(sim,a,'heading',49.07);assert.ok(Math.abs(a.targetHeading!-Math.PI/2)<.001);command(sim,a,'altitude',6000);assert.equal(a.targetAltitude,1828.8000000000002);command(sim,a,'speed',180);assert.ok(Math.abs(a.targetSpeed!-92.6)<.01);assert.equal(sim.command(a.id,'altitude',false,500).ok,false);
});

test('schedule narrowbody fixtures remain regional and traffic is bounded to eighteen aircraft',()=>{
  const flights=new TypicalDayFallbackProvider().flights('2026-09-06',42,1);for(const f of flights)if(['A320','A321'].includes(f.type))assert.ok(!['LAX','SFO','SEA','FRA','CDG'].includes(f.airport));
  const sim=new Simulation(scenario({duration:0}));for(let i=0;i<30;i++)sim.spawn(i%2?'arrival':'departure','A320');assert.equal(sim.aircraft.length,18);assert.equal(sim.spawn('arrival'),null);
});

test('random weather evolves deterministically during a shift and changes operational conditions',()=>{
  const config=scenario({duration:0,tutorial:false,weather:'random',positions:[]});
  const a=new Simulation(config),b=new Simulation(config),initial={...a.weather};
  for(let i=0;i<9;i++){a.update(60);b.update(60);}
  assert.deepEqual(a.weather,b.weather);assert.notDeepEqual(a.weather,initial);
});

test('a sixty-minute multi-aircraft shift completes with bounded traffic and arrival/departure throughput',()=>{
  const sim=new Simulation(scenario({duration:60,tutorial:false,difficulty:'assisted',positions:[],weather:'cloudy',density:1}));
  for(let i=0;i<60;i++)sim.update(60);
  assert.equal(sim.ended,true);assert.equal(sim.elapsed,3600);assert.ok(sim.aircraft.length<=18);
  assert.ok(sim.scores.departures>=5);assert.ok(sim.scores.arrivals>=5);
  assert.ok(sim.aircraft.every(a=>Number.isFinite(a.position.x)&&Number.isFinite(a.position.y)&&Number.isFinite(a.position.z)&&a.state!=='COLLISION'));
});
