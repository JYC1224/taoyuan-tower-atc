import {Simulation} from '../src/sim/Simulation';
import {distance,nodeById} from '../src/sim/routing';
import {writeFile} from 'node:fs/promises';
import type {Scenario} from '../src/types';
const config:Scenario={date:'2026-09-06',startTime:'17:00',duration:0,difficulty:'assisted',weather:'cloudy',seed:182731,incidents:'off',positions:[],tutorial:false,density:1};
const mode=process.argv[2]??'soak',sim=new Simulation(config);
if(mode==='cycle'){
 sim.clearTraffic();sim.scenario.tutorial=true;sim.scenario.positions=['Delivery','Ground','Tower','Approach','Departure'];
 for(const route of [['N5','P5','P6'],['P5','P6','N6'],['P6','N6','N5']]){const a=sim.spawn('departure','A320')!,node=nodeById.get(route[0])!;a.state='TAXIING';a.position={x:node.x,y:0,z:node.z};(sim as any).assignRoute(a,{nodes:route,names:['Fixture'],distance:0});}
}
const lastMove=new Map<string,{time:number;x:number;z:number}>(),abnormal:unknown[]=[],stalled=new Set<string>();let cycleSamples=0,maxRecoveryWait=0;
const seconds=mode==='cycle'?1800:Number(process.argv[3]??7200),start=performance.now();
for(let second=0;second<seconds;second++){
 sim.update(1);if(sim.ground.cycles.length)cycleSamples++;
 for(const a of sim.aircraft){const prior=lastMove.get(a.id);if(!prior||distance(prior,a.position)>2)lastMove.set(a.id,{time:sim.elapsed,x:a.position.x,z:a.position.z});
  if(['TAXIING','TAXIING_TO_GATE','PUSHING','VACATING_RUNWAY','LINING_UP'].includes(a.state)&&!a.held){const wait=sim.elapsed-(lastMove.get(a.id)?.time??sim.elapsed);maxRecoveryWait=Math.max(maxRecoveryWait,wait);if(wait>600&&!stalled.has(a.id)){stalled.add(a.id);abnormal.push({time:sim.elapsed,id:a.id,state:a.state,position:{...a.position},wait:sim.ground.waits.get(a.id),cycles:sim.ground.cycles,route:a.route,others:sim.aircraft.filter(b=>b.id!==a.id&&distance(a.position,b.position)<250).map(b=>({id:b.id,state:b.state,position:{...b.position},route:b.route,held:b.held}))});}}
  else lastMove.set(a.id,{time:sim.elapsed,x:a.position.x,z:a.position.z});
 }
}
const snapshot=sim.aircraft.map(a=>({id:a.id,type:a.type,state:a.state,position:{...a.position},held:a.held,wait:sim.ground.waits.get(a.id),route:a.route}));
let drainSeconds=0;if(mode==='soak'){(sim as any).schedule=[];(sim as any).scheduleIndex=0;for(;drainSeconds<7200&&sim.aircraft.some(a=>!a.completed);drainSeconds++)sim.update(1);}
const result={mode,seconds,drainSeconds,drainRemaining:sim.aircraft.filter(a=>!a.completed).map(a=>({id:a.id,state:a.state,wait:sim.ground.waits.get(a.id),position:a.position})),wallMs:performance.now()-start,throughput:{departures:sim.scores.departures,arrivals:sim.scores.arrivals},cycleSamples,maxRecoveryWait,abnormal:abnormal.map((event:any)=>({...event,recovered:!sim.aircraft.some(a=>a.id===event.id)||(lastMove.get(event.id)?.time??0)>event.time})),recoveries:sim.ground.recoveries,remaining:snapshot,lastCycles:sim.ground.cycles};
await writeFile(`gameplay-qa/ground-${mode}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({...result,recoveries:result.recoveries.length,remaining:result.remaining.map(a=>({id:a.id,state:a.state,wait:a.wait?.reason})),abnormal:abnormal.length},null,2));
