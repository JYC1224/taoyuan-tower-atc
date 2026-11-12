import test from 'node:test';
import assert from 'node:assert/strict';
import {GroundTraffic,findWaitCycles,type GroundIntent} from '../src/sim/GroundTraffic';
import {Simulation} from '../src/sim/Simulation';
import {distance,nodeById} from '../src/sim/routing';
import type {TaxiNode,TaxiEdge} from '../src/data/airport';
import type {Scenario} from '../src/types';
import {groundOverlap} from '../src/sim/groundFootprint';
import {FLEET} from '../src/data/fleet';

// Standard mode now asks the controller to resolve important future conflicts.
// Exercise that public decision, while the allocator alone controls all motion.
function advanceSurface(sim:Simulation){for(const c of [...sim.ground.conflicts])if(c.needsDecision&&!c.committed)sim.chooseGroundPriority(c.id);sim.update(.1);}

function graph(points:Record<string,[number,number]>,links:[string,string][]) {
 const nodes:TaxiNode[]=Object.entries(points).map(([id,[x,z]])=>({id,x,z,kind:'intersection'}));
 const edges:TaxiEdge[]=links.map(([from,to])=>({id:from+'-'+to,from,to,name:from+' / '+to,width:25,length:distance(nodes.find(n=>n.id===from)!,nodes.find(n=>n.id===to)!),speedLimit:8,maxSpan:65,active:true,geometryConfidence:'approximation'}));
 return {nodes,edges,manager:new GroundTraffic(nodes,edges)};
}
function exercise(g:ReturnType<typeof graph>,routes:{id:string;nodes:string[];urgency?:number}[],seconds=500){
 const bodies=routes.map(r=>({id:r.id,route:r.nodes,position:{...g.nodes.find(n=>n.id===r.nodes[0])!},point:1,speed:0,finished:false,urgency:r.urgency??0,waited:0}));
 const order:string[]=[],owners:string[]=[],heldPoints:{id:string;x:number;z:number}[]=[];let minSeparation=Infinity;
 for(let tick=0;tick<seconds*10&&!bodies.every(a=>a.finished);tick++){
  const intents:GroundIntent[]=bodies.map(a=>({id:a.id,position:a.position,length:40,speed:a.speed,braking:1.4,route:a.route,nextIndex:a.point,path:[a.position,...a.route.slice(a.point).map(id=>g.nodes.find(n=>n.id===id)!)],revision:1,moving:!a.finished,held:false,urgency:a.urgency,state:'TAXIING'}));
  g.manager.update(intents,tick*.1);
  const center=g.manager.reservations.get('node:O');if(center?.committed&&owners.at(-1)!==center.owner)owners.push(center.owner);
  for(const a of bodies){if(a.finished)continue;const limit=g.manager.limit(a.id),desired=Math.min(8,Math.sqrt(Math.max(0,2*1.4*(limit-.5))));a.speed+=Math.max(-.14,Math.min(.08,desired-a.speed));let travel=Math.min(a.speed*.1,limit);
   if(limit<1){a.waited+=.1;if(!heldPoints.some(p=>p.id===a.id))heldPoints.push({id:a.id,x:a.position.x,z:a.position.z});}
   while(travel>1e-7&&!a.finished){const target=g.nodes.find(n=>n.id===a.route[a.point])!,d=distance(a.position,target),step=Math.min(d,travel);if(d>0){a.position.x+=(target.x-a.position.x)*step/d;a.position.z+=(target.z-a.position.z)*step/d;}travel-=step;if(d-step<.01&&++a.point===a.route.length){a.finished=true;a.speed=0;order.push(a.id);}else if(d-step>=.01)break;}
  }
  for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){const d=distance(bodies[i].position,bodies[j].position);minSeparation=Math.min(minSeparation,d);assert(d>=58-1e-4,'aircraft footprints must not overlap: '+d);}
 }
 return {bodies,order,owners,heldPoints,minSeparation};
}
test('A: perpendicular intersection grants one passage, holds before the zone, and resumes',()=>{
 const g=graph({W:[-400,0],O:[0,0],E:[400,0],N:[0,-400],S:[0,400]},[['W','O'],['O','E'],['N','O'],['O','S']]);
 const r=exercise(g,[{id:'A',nodes:['W','O','E']},{id:'B',nodes:['N','O','S']}]);
 assert.deepEqual(r.order,['A','B']);assert(r.bodies[1].waited>0);assert(r.heldPoints.every(p=>Math.hypot(p.x,p.z)>55));
});
test('B: opposing entries reserve the narrow link before entry; no nose-to-nose stop',()=>{
 const g=graph({A:[-300,-300],L:[-300,0],R:[300,0],AE:[300,300],B:[300,-300],BE:[-300,300]},[['A','L'],['L','R'],['R','AE'],['B','R'],['L','BE']]);
 const r=exercise(g,[{id:'A',nodes:['A','L','R','AE']},{id:'B',nodes:['B','R','L','BE']}]);
 assert.equal(r.order.length,2);assert(r.bodies.some(a=>a.waited>0));assert(r.minSeparation>=58);
});
test('C: three simultaneous intersection requests have stable ordering and all recover',()=>{
 const pts:Record<string,[number,number]>={O:[0,0]};for(let i=0;i<6;i++)pts['P'+i]=[600*Math.cos(i*Math.PI/3),600*Math.sin(i*Math.PI/3)];
 const g=graph(pts,Array.from({length:6},(_,i)=>['P'+i,'O'] as [string,string]));
 const routes=[{id:'A',nodes:['P0','O','P3']},{id:'B',nodes:['P2','O','P5']},{id:'C',nodes:['P4','O','P1']}];
 const r=exercise(g,routes),again=exercise(graph(pts,Array.from({length:6},(_,i)=>['P'+i,'O'] as [string,string])),[...routes].reverse());
 assert.equal(r.order.length,3);assert.deepEqual(r.owners,again.owners);assert.deepEqual(r.order,again.order);
});
test('D: an uncommitted runway-vacating arrival takes priority over a departure',()=>{
 const g=graph({W:[-400,0],O:[0,0],E:[400,0],N:[0,-400],S:[0,400]},[['W','O'],['O','E'],['N','O'],['O','S']]);
 const r=exercise(g,[{id:'A-departure',nodes:['W','O','E']},{id:'Z-arrival',nodes:['N','O','S'],urgency:300}]);assert.equal(r.order[0],'Z-arrival');assert.equal(r.order.length,2);
});
test('E: a three-aircraft wait-for cycle is detected; future leases release but occupied zones cannot be stolen',()=>{
 const g=graph({A:[0,0],B:[300,0],C:[150,300]},[['A','B'],['B','C'],['C','A']]);
 const dependencies=new Map([['A',new Set(['B'])],['B',new Set(['C'])],['C',new Set(['A'])]]);assert.deepEqual(findWaitCycles(dependencies),[['A','B','C']]);
 g.manager.reservations.set('node:A',{zone:'node:A',owner:'A',acquired:0,committed:true});g.manager.reservations.set('node:B',{zone:'node:B',owner:'A',acquired:0,committed:false});g.manager.reservations.set('node:C',{zone:'node:C',owner:'B',acquired:0,committed:false});
 assert.equal(g.manager.releaseFuture(['A','B','C']),2);assert.equal(g.manager.reservations.get('node:A')?.owner,'A');
 dependencies.get('C')!.clear();assert.deepEqual(findWaitCycles(dependencies),[]);
});
test('F: route change, hold, completion and removal release unused reservations',()=>{
 const g=graph({W:[-400,0],O:[0,0],E:[400,0],N:[0,-400]},[['W','O'],['O','E'],['O','N']]);
 const a:GroundIntent={id:'A',position:{x:-300,z:0},length:40,speed:5,braking:1.4,route:['W','O','E'],nextIndex:1,path:[{x:-300,z:0},{x:0,z:0},{x:400,z:0}],revision:1,moving:true,held:false,urgency:0,state:'TAXIING'};
 g.manager.update([a],0);assert(g.manager.reservations.has('edge:O-E'));
 a.route=['W','O','N'];a.path=[a.position,{x:0,z:0},{x:0,z:-400}];a.revision++;g.manager.update([a],1);assert(!g.manager.reservations.has('edge:O-E'));
 a.held=true;g.manager.update([a],2);assert([...g.manager.reservations.values()].every(r=>r.committed));
 a.moving=false;a.held=false;g.manager.update([a],3);assert([...g.manager.reservations.values()].every(r=>r.committed));
 g.manager.update([],4);assert.equal(g.manager.reservations.size,0);
});
test('actual RCTP opposing N routes complete by continuous safe alternate routing',()=>{
 const scenario:Scenario={date:'2026-09-06',startTime:'12:00',duration:0,difficulty:'standard',weather:'clear',seed:17,incidents:'off',positions:['Delivery','Ground','Tower','Approach','Departure'],tutorial:true,density:.3};
 const sim=new Simulation(scenario);sim.clearTraffic();const a=sim.spawn('departure','A320')!,b=sim.spawn('departure','A320')!;
 for(const [aircraft,route]of [[a,['N4','N5','N6','N7']],[b,['N7','N6','N5','N4']]] as const){const n=nodeById.get(route[0])!;aircraft.position={x:n.x,y:0,z:n.z};aircraft.state='TAXIING';(sim as any).assignRoute(aircraft,{nodes:[...route],names:['N'],distance:0});}
 let min=Infinity;for(let i=0;i<10000&&[a,b].some(a=>a.state==='TAXIING');i++){const positions=[{...a.position},{...b.position}];advanceSurface(sim);for(const [j,aircraft]of [a,b].entries())assert(distance(positions[j],aircraft.position)<1,'no teleport or movement beyond taxi speed');min=Math.min(min,distance(a.position,b.position));}
 assert.equal(a.state,'HOLDING_SHORT');assert.equal(b.state,'HOLDING_SHORT');assert(min>55.5);assert(sim.ground.recoveries.some(r=>r.action.includes('Alternate')));
});

test('actual three-aircraft cyclic occupancy recovers through graph routes without backtracking or removal',()=>{
 const scenario:Scenario={date:'2026-09-06',startTime:'12:00',duration:0,difficulty:'standard',weather:'clear',seed:17,incidents:'off',positions:['Delivery','Ground','Tower','Approach','Departure'],tutorial:true,density:.3};
 const sim=new Simulation(scenario);sim.clearTraffic();
 for(const route of [['N5','P5','P6'],['P5','P6','N6'],['P6','N6','N5']]){const a=sim.spawn('departure','A320')!,n=nodeById.get(route[0])!;a.position={x:n.x,y:0,z:n.z};a.state='TAXIING';(sim as any).assignRoute(a,{nodes:route,names:['Fixture'],distance:0});}
 let cycles=0;for(let i=0;i<18000&&sim.aircraft.some(a=>a.state==='TAXIING');i++){const positions=sim.aircraft.map(a=>({...a.position}));advanceSurface(sim);cycles+=sim.ground.cycles.length;sim.aircraft.forEach((a,j)=>assert(distance(a.position,positions[j])<1));}
 assert(cycles>0);assert.equal(sim.aircraft.length,3);assert(sim.aircraft.every(a=>a.state==='HOLDING_SHORT'));assert.equal(sim.ground.cycles.length,0);
});

test('oriented aircraft envelopes protect wings and noses without falsely blocking adjacent compatible stands',()=>{
 const a={position:{x:0,z:0},length:66.8,span:64.8,heading:0},b={position:{x:63,z:28},length:37.57,span:35.8,heading:0};
 assert.equal(groundOverlap(a,b),false);assert.equal(groundOverlap(a,{...b,position:{x:40,z:20}}),true);assert.equal(groundOverlap(a,{...b,position:{x:0,z:65}}),true);
});

test('manual priority persists at the safe hold until chosen, including while paused',()=>{
 const g=graph({W:[-400,0],O:[0,0],E:[400,0],N:[0,-400],S:[0,400]},[['W','O'],['O','E'],['N','O'],['O','S']]);
 const intents:GroundIntent[]=[['A',['W','O','E']],['B',['N','O','S']]].map(([id,route])=>{const nodes=route as string[],position=g.nodes.find(n=>n.id===nodes[0])!;return {id:id as string,position:{...position},length:40,speed:0,braking:1.4,route:nodes,nextIndex:1,path:[position,...nodes.slice(1).map(id=>g.nodes.find(n=>n.id===id)!)],revision:1,moving:true,held:false,urgency:0,state:'TAXIING'};});
 g.manager.update(intents,0,'all');const conflict=g.manager.conflicts.find(c=>c.zone==='node:O')!;assert(conflict.needsDecision);assert(g.manager.limit('A')<400);assert(g.manager.limit('B')<400);
 for(const a of intents){const target=g.nodes.find(n=>n.id==='O')!,d=distance(a.position,target),travel=g.manager.limit(a.id)-.5;a.position={x:a.position.x+(target.x-a.position.x)*travel/d,z:a.position.z+(target.z-a.position.z)*travel/d};a.path[0]=a.position;}
 g.manager.update(intents,60,'all');assert(g.manager.conflicts.some(c=>c.needsDecision));assert(g.manager.limit('A')<=.6);assert.equal(g.manager.cycles.length,0);
 assert(g.manager.choose(conflict.id,'B'));g.manager.update(intents,60,'all');assert(g.manager.limit('B')>100);assert(g.manager.limit('A')<1);assert.equal(g.manager.reservations.get('node:O')?.owner,'B');
});

test('runway crossings require a clearance and share runway occupancy before entry',()=>{
 const points={W:[-400,0],L:[-200,0],R:[200,0],E:[400,0]} as Record<string,[number,number]>;
 const base=graph(points,[['W','L'],['L','R'],['R','E']]);base.edges[1].runway='north';const manager=new GroundTraffic(base.nodes,base.edges);
 const a:GroundIntent={id:'A',position:{x:-400,z:0},length:40,speed:0,braking:1.4,route:['W','L','R','E'],nextIndex:1,path:base.nodes,revision:1,moving:true,held:false,urgency:0,state:'TAXIING'};
 manager.update([a],0);assert.equal(manager.waits.get('A')?.reason,'Runway crossing clearance required');assert(manager.limit('A')<200);
 a.runwayClearances=['north'];manager.update([a],1,'auto',new Map([['north',['LANDING']]]));assert(manager.limit('A')<200);assert(manager.waits.get('A')?.owners.includes('LANDING'));
 manager.update([a],2);assert(manager.limit('A')>400);assert.equal(manager.reservations.get('runway:north')?.owner,'A');
});
test('stopping after entering a granted approach envelope cannot forfeit priority to a new urgent arrival',()=>{
 const g=graph({W:[-400,0],O:[0,0],E:[400,0],N:[0,-400],S:[0,400]},[['W','O'],['O','E'],['N','O'],['O','S']]);
 const a:GroundIntent={id:'A',position:{x:-180,z:0},length:40,speed:6,braking:1.4,route:['W','O','E'],nextIndex:1,path:[{x:-180,z:0},{x:0,z:0},{x:400,z:0}],revision:1,moving:true,held:false,urgency:0,state:'TAXIING'};
 g.manager.update([a],0);assert.equal(g.manager.reservations.get('node:O')?.owner,'A');a.position={x:-70,z:0};a.path[0]=a.position;a.speed=0;
 const b:GroundIntent={...a,id:'B',position:{x:0,z:-350},path:[{x:0,z:-350},{x:0,z:0},{x:0,z:400}],route:['N','O','S'],urgency:300};
 g.manager.update([a,b],20);assert.equal(g.manager.reservations.get('node:O')?.owner,'A');assert(g.manager.reservations.get('node:O')?.committed);assert(g.manager.limit('A')>100);assert(g.manager.limit('B')<350);
});
test('same-direction following traffic does not create repetitive manual-priority requests',()=>{
 const g=graph({W:[-700,0],M:[-450,0],O:[0,0],E:[700,0],X:[-700,500],Y:[700,500]},[['W','M'],['M','O'],['O','E'],['E','Y'],['Y','X'],['X','W']]);
 const a:GroundIntent={id:'A',position:{x:-300,z:0},length:40,speed:0,braking:1.4,route:['M','O','E'],nextIndex:1,path:[{x:-300,z:0},{x:0,z:0},{x:700,z:0}],revision:1,moving:true,held:false,urgency:0,state:'TAXIING'},b={...a,id:'B',route:['W','M','O','E'],position:{x:-600,z:0},path:[{x:-600,z:0},{x:-450,z:0},{x:0,z:0},{x:700,z:0}]};
 g.manager.update([a,b],0,'all');g.manager.update([a,b],60,'all');assert(g.manager.conflicts.every(c=>!c.needsDecision));assert(g.manager.limit('A')>100);assert(g.manager.limit('B')<1);
});
test('a blocked apron feeder cannot lock downstream resources needed by through traffic',()=>{
 const config:Scenario={date:'2026-09-18',startTime:'12:00',duration:0,difficulty:'standard',weather:'clear',seed:17,incidents:'off',positions:['Ground','Tower','Approach','Departure'],tutorial:true,density:.3};
 const sim=new Simulation(config);sim.clearTraffic();const a=sim.spawn('departure','B77W')!,b=sim.spawn('departure','A320')!;
 a.position={x:-460.87,y:0,z:-435.45};a.heading=-Math.PI/2;b.position={x:-593,y:0,z:-345.97};b.heading=Math.PI;
 for(const [aircraft,route]of [[a,['apron-D9','apron-D10','P6','N6','N5']],[b,['apron-D10','P6','N6','N7']]] as const){aircraft.state='TAXIING';(sim as any).assignRoute(aircraft,{nodes:[...route],names:['P'],distance:0});}
 sim.ground.reservations.set('node:apron-D9',{zone:'node:apron-D9',owner:a.id,committed:true,acquired:0});sim.ground.reservations.set('edge:P6__apron-D10',{zone:'edge:P6__apron-D10',owner:b.id,committed:true,acquired:0});
 for(let i=0;i<18000&&[a,b].some(a=>a.state==='TAXIING');i++)advanceSurface(sim);
 assert.equal(a.state,'HOLDING_SHORT');assert.equal(b.state,'HOLDING_SHORT');assert.equal(sim.ground.cycles.length,0);
});
test('opposing traffic reserves an entire non-passing multi-edge corridor before entry',()=>{
 const g=graph({A:[-500,-350],L:[-500,0],M:[0,0],R:[500,0],AE:[500,350],B:[500,-350],BE:[-500,350]},[['A','L'],['L','M'],['M','R'],['R','AE'],['B','R'],['L','BE']]);
 assert([...g.manager.zones.values()].some(z=>z.kind==='corridor'&&z.edgeIds?.length===2));
 const result=exercise(g,[{id:'A',nodes:['A','L','M','R','AE']},{id:'B',nodes:['B','R','M','L','BE']}],900);assert.equal(result.order.length,2);assert(result.bodies.some(a=>a.waited>0));assert(result.minSeparation>=58);
});

test('a distant alternate road does not split a non-passing corridor into independent leases',()=>{
 const g=graph({A:[-500,-350],L:[-500,0],M:[0,0],R:[500,0],AE:[500,350],B:[500,-350],BE:[-500,350]},[['A','L'],['L','M'],['M','R'],['R','AE'],['B','R'],['L','BE'],['A','B']]);
 assert([...g.manager.zones.values()].some(z=>z.kind==='corridor'&&z.edgeIds?.includes('L-M')&&z.edgeIds.includes('M-R')));
 const result=exercise(g,[{id:'A',nodes:['A','L','M','R','AE']},{id:'B',nodes:['B','R','M','L','BE']}],900);assert.equal(result.order.length,2);
});

for(const gate of ['A3','D14'])test(`an arrival turning into ${gate} and an adjacent staged departure both clear without overlap`,()=>{
 const sim=new Simulation({date:'2026-09-18',startTime:'12:00',duration:0,difficulty:'standard',weather:'clear',seed:17,incidents:'off',positions:['Ground','Tower','Approach','Departure'],tutorial:true,density:.3});sim.clearTraffic();
 const a=sim.spawn('arrival',gate==='A3'?'A350':'B77W')!,b=sim.spawn('departure',gate==='A3'?'B78X':'A350')!;
 a.gate=gate;a.speed=0;b.speed=0;a.heading=-Math.PI/2;b.heading=Math.PI;
 const routes=gate==='A3'?[['apron-A1','apron-A3','push-A3','gate-A3'],['push-A4','apron-A4','apron-A5','P9','N9']]:[['apron-D12','apron-D13','apron-D14','push-D14','gate-D14'],['push-D15','apron-D15','apron-D16','apron-D17','apron-D18','P4','N4']];
 for(const [i,aircraft]of [a,b].entries()){const node=nodeById.get(routes[i][0])!;aircraft.position={x:node.x,y:0,z:node.z};aircraft.state=i?'TAXIING':'TAXIING_TO_GATE';(sim as any).assignRoute(aircraft,{nodes:routes[i],names:['P'],distance:0});}
 const body=(aircraft:typeof a)=>({position:aircraft.position,heading:aircraft.heading,length:FLEET[aircraft.type].length-18,span:FLEET[aircraft.type].span-8});
 for(let i=0;i<18000&&[a,b].some(a=>['TAXIING','TAXIING_TO_GATE'].includes(a.state));i++){const before=[{...a.position},{...b.position}];advanceSurface(sim);[a,b].forEach((aircraft,j)=>assert(distance(aircraft.position,before[j])<1));if(sim.aircraft.includes(a)&&sim.aircraft.includes(b))assert(!groundOverlap(body(a),body(b)),JSON.stringify([a,b].map(aircraft=>({state:aircraft.state,...body(aircraft)}))));}
 assert(['ENTERING_STAND','DOCKED'].includes(a.state));assert.equal(b.state,'HOLDING_SHORT');assert.equal(sim.ground.cycles.length,0);
});

test('recovery rejects a newly blocked turn beside a staged aircraft and preserves the passable straight route',()=>{
 const sim=new Simulation({date:'2026-09-18',startTime:'12:00',duration:0,difficulty:'standard',weather:'clear',seed:17,incidents:'off',positions:['Ground','Tower','Approach','Departure'],tutorial:true,density:.3});sim.clearTraffic();
 const a=sim.spawn('departure','B77W')!,b=sim.spawn('departure','A350')!;a.position={x:21.12,y:0,z:-435.06};a.heading=-Math.PI/2;b.position={x:-47,y:0,z:-346.97};b.heading=Math.PI;
 const routes=[['apron-D2','P8','apron-D3','apron-D4','apron-D5','P7','N7','N8'],['push-D3','apron-D3','apron-D4','apron-D5','P7','apron-D6','apron-D7','apron-D8','apron-D9','apron-D10','P6','N6','N5']];
 for(const [i,aircraft]of [a,b].entries()){aircraft.state='TAXIING';(sim as any).assignRoute(aircraft,{nodes:routes[i],names:['P'],distance:0});}
 assert.equal((sim as any).replanGround(a,[b]),false);assert.deepEqual(a.route,routes[0]);
 for(let i=0;i<18000&&[a,b].some(a=>a.state==='TAXIING');i++)advanceSurface(sim);
 assert.equal(a.state,'HOLDING_SHORT');assert.equal(b.state,'HOLDING_SHORT');assert.equal(sim.ground.cycles.length,0);
});
