import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {Simulation} from '../src/sim/Simulation';
import {groundOverlap} from '../src/sim/groundFootprint';
import {FLEET} from '../src/data/fleet';
import {gates} from '../src/data/airport';
import type {Aircraft,Command,Scenario} from '../src/types';
const modes=(process.argv[2]?[process.argv[2]]:['assisted','standard','advanced','hardcore']) as Scenario['difficulty'][];
const seconds=Number(process.argv[3]??7200),results=[];
for(const difficulty of modes){
 const sim=new Simulation({date:'2026-09-18',startTime:'17:00',duration:0,difficulty,weather:'cloudy',seed:182731,incidents:'off',positions:['Delivery','Ground','Tower','Approach','Departure'],tutorial:false,density:1});
 const start=performance.now(),overlaps:unknown[]=[],seen=new Set<string>(),lastMovement=new Map<string,{x:number;z:number;time:number}>();let peak=0,maxStationary=0,cycles=0,priorities=0,gatePressure=0,completedInjection=false,consecutiveCycles=0;
 const drive=()=>{
  for(const c of sim.ground.conflicts.filter(c=>c.needsDecision&&!c.committed)){if(sim.chooseGroundPriority(c.id).ok)priorities++;}
  for(const a of [...sim.aircraft]){const commands=sim.availableCommands(a.id);const cmd=(['delivery','approvePushback','startEngines','taxi','crossRunway','lineUp','takeoff','contactDeparture','clearApproach','contactTower','land','vacate','contactGround','taxiToGate'] as Command[]).find(c=>commands.includes(c));if(!cmd)continue;const result=sim.command(a.id,cmd);if(!result.ok&&cmd==='taxiToGate'){const gate=gates.find(g=>g.maxSpan>=FLEET[a.type].span&&!sim.gateOccupancy.has(g.id));if(gate)sim.command(a.id,cmd,false,gate.id);}}
 };
 const body=(a:Aircraft)=>({position:a.position,heading:a.heading,length:FLEET[a.type].length-18,span:FLEET[a.type].span-8});
 let elapsed=0;
 for(;elapsed<seconds+7200;elapsed++){
  if(elapsed&&elapsed%1800===0)console.log(`${difficulty}: ${elapsed}s, ${sim.scores.departures+sim.scores.arrivals} completed, ${sim.aircraft.filter(a=>!a.completed).length} active`);
  if(elapsed===seconds){(sim as any).schedule=[];completedInjection=true;}
  if(elapsed%5===0)drive();sim.update(1);peak=Math.max(peak,sim.aircraft.filter(a=>!a.completed).length);cycles+=sim.ground.cycles.length?1:0;gatePressure+=sim.getOperations().requests.some(r=>r.kind==='gate')?1:0;
  const ground=sim.aircraft.filter(a=>a.position.y<12);
  for(let i=0;i<ground.length;i++)for(let j=i+1;j<ground.length;j++){const a=ground[i],b=ground[j],key=[a.id,b.id].sort().join('|');if(groundOverlap(body(a),body(b))&&!seen.has(key)){seen.add(key);overlaps.push({time:elapsed,aircraft:[a,b].map(a=>({id:a.id,type:a.type,state:a.state,position:{...a.position},heading:a.heading,wait:sim.ground.waits.get(a.id)}))});}}
  for(const a of sim.aircraft){const last=lastMovement.get(a.id),moving=['PUSHING','TAXIING','TAXIING_TO_GATE','VACATING_RUNWAY','LINING_UP'].includes(a.state);if(!moving||!last||Math.hypot(a.position.x-last.x,a.position.z-last.z)>2)lastMovement.set(a.id,{...a.position,time:sim.elapsed});else maxStationary=Math.max(maxStationary,sim.elapsed-last.time);}
  consecutiveCycles=sim.ground.cycles.some(c=>c.every(id=>(sim.aircraft.find(a=>a.id===id)?.speed??0)<.3))?consecutiveCycles+1:0;
  if(process.env.ATC_TRACE_STOP&&consecutiveCycles>30){const ids=sim.ground.cycles.flat();await writeFile(`gameplay-qa/trace-${difficulty}.json`,JSON.stringify({time:elapsed,allAircraft:sim.aircraft,allMotion:[...(sim as any).motion],choices:[...(sim.ground as any).choices],allReservations:[...sim.ground.reservations.values()],cycles:sim.ground.cycles,aircraft:sim.aircraft.filter(a=>ids.includes(a.id)),motion:[...(sim as any).motion].filter(([id]:[string])=>ids.includes(id)),waits:[...sim.ground.waits.values()],claims:[...(sim.ground as any).claims].filter(([id]:[string])=>ids.includes(id)),reservations:[...sim.ground.reservations.values()].filter(r=>ids.includes(r.owner)),recoveries:sim.ground.recoveries},null,2));break;}
  if(completedInjection&&!sim.aircraft.some(a=>!a.completed))break;
 }
 const remaining=sim.aircraft.filter(a=>!a.completed).map(a=>({id:a.id,state:a.state,wait:sim.ground.waits.get(a.id),route:a.route,position:a.position}));
 const result={difficulty,injectionSeconds:seconds,drainSeconds:elapsed-seconds,wallMs:performance.now()-start,peak,cycles,priorities,gatePressureSeconds:gatePressure,maxStationary,departures:sim.scores.departures,arrivals:sim.scores.arrivals,remaining,overlaps};results.push(result);
 await writeFile(`gameplay-qa/stress-${difficulty}${process.env.ATC_TRACE_STOP?'-trace':''}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({...result,overlaps:overlaps.length,remaining:remaining.length}));
}
if(!process.env.ATC_TRACE_STOP){await writeFile('gameplay-qa/stress-summary.json',JSON.stringify(results,null,2));assert(results.every(r=>r.remaining.length===0),'Internally controlled traffic must drain completely');assert(results.every(r=>r.overlaps.length===0),'Physical aircraft envelopes must not overlap');}
