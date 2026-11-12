import {Simulation} from '../src/sim/Simulation';
import {nodeById,distance} from '../src/sim/routing';
import {writeFile,mkdir} from 'node:fs/promises';
import type {Scenario} from '../src/types';
const scenario:Scenario={date:'2026-09-06',startTime:'12:00',duration:0,difficulty:'standard',weather:'clear',seed:17,incidents:'off',positions:['Delivery','Ground','Tower','Approach','Departure'],tutorial:true,density:.3};
const sim=new Simulation(scenario);sim.clearTraffic();
const stage=process.argv[2]??'fixed';if(stage==='baseline')throw new Error('The preserved baseline report is immutable. Reproduce the old build from gameplay-qa/baseline-source.');
let priorities=0;const step=()=>{for(const c of [...sim.ground.conflicts])if(c.needsDecision&&!c.committed&&sim.chooseGroundPriority(c.id).ok)priorities++;sim.update(.1);};
const a=sim.spawn('departure','A320')!,b=sim.spawn('departure','A320')!;
for(const [aircraft,nodes] of [[a,['N4','N5','N6','N7']],[b,['N7','N6','N5','N4']]] as const){
 const node=nodeById.get(nodes[0])!;aircraft.position={x:node.x,y:0,z:node.z};aircraft.state='TAXIING';aircraft.role='Ground';aircraft.heading=aircraft===a?Math.PI/2:-Math.PI/2;
 (sim as any).assignRoute(aircraft,{nodes:[...nodes],names:['N'],distance:0});
}
for(let i=0;i<6000;i++)step();
const before=sim.aircraft.map(a=>({...a.position}));
for(let i=0;i<1200;i++)step();
const report={simulatedSeconds:sim.elapsed,priorities,separation:distance(a.position,b.position),aircraft:sim.aircraft.map((a,i)=>({id:a.id,state:a.state,speed:a.speed,movementInLast120Seconds:distance(a.position,before[i]),position:a.position,route:a.route,blockedTime:(sim as any).motion.get(a.id).blockedTime,clearance:a.clearance})),deadlocked:sim.aircraft.every((a,i)=>a.state==='TAXIING'&&a.speed<.01&&distance(a.position,before[i])<.01)};
await mkdir('gameplay-qa',{recursive:true});await writeFile(`gameplay-qa/deadlock-${stage}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
