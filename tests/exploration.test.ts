import {test} from 'node:test';
import assert from 'node:assert/strict';
import {terminals} from '../src/data/airport';
import {explorationScheduleAfter} from '../src/data/schedule';
import {explorationScenario} from '../src/sim/exploration';
import {Simulation} from '../src/sim/Simulation';
import {exploreSpot,exploreSpots,isIndoorExploreSpot,moveExplorer,moveExplorerCamera} from '../src/render/exploration';
import {terminalBuildingBounds} from '../src/render/terminalBuildingLayout';
import type {Scenario} from '../src/types';

const base:Scenario={date:'2026-11-11',startTime:'17:00',duration:15,difficulty:'hardcore',weather:'clear',seed:182731,incidents:'training',positions:['Ground','Tower'],tutorial:true,density:1,routineAutomation:false};

test('exploration starts an unlimited fully assisted watch without changing the chosen game settings',()=>{
 const watch=explorationScenario(base);
 assert.equal(watch.duration,0);assert.equal(watch.difficulty,'assisted');
 assert.deepEqual(watch.positions,[]);assert.equal(watch.tutorial,false);assert.equal(watch.incidents,'off');
 assert.equal(watch.routineAutomation,true);assert.equal(watch.exploration,true);
 assert.deepEqual(base.positions,['Ground','Tower']);assert.equal(base.difficulty,'hardcore');
 assert.equal(watch.date,base.date);assert.equal(watch.weather,base.weather);
});

test('a sightseeing watch autonomously completes both departures and arrivals',()=>{
 const sim=new Simulation(explorationScenario(base));
 for(let i=0;i<60;i++)sim.update(60);
 assert.equal(sim.ended,false);assert.ok(sim.scores.commands>0);assert.equal(sim.scores.playerCommands,0);
 assert.ok(sim.scores.departures>0,`departures: ${sim.scores.departures}`);
 assert.ok(sim.scores.arrivals>0,`arrivals: ${sim.scores.arrivals}`);
 assert.ok(sim.aircraft.every(a=>a.state!=='COLLISION'));
});

test('simultaneous scheduled arrivals enter the same approach with usable spacing',()=>{
 const sim=new Simulation(explorationScenario(base));sim.update(2);
 const arrivals=sim.aircraft.filter(a=>a.kind==='arrival');
 assert.ok(arrivals.length>=2);
 for(const runway of new Set(arrivals.map(a=>a.runway))){
  const positions=arrivals.filter(a=>a.runway===runway).map(a=>a.position.x).sort((a,b)=>a-b);
  for(let i=1;i<positions.length;i++)assert.ok(positions[i]-positions[i-1]>10000,runway);
 }
});

test('the unattended approach controller clears a missed approach to rejoin',()=>{
 const sim=new Simulation(explorationScenario({...base,date:'2026-09-06'}));
 sim.clearTraffic();const aircraft=sim.spawn('arrival','A320')!;
 assert.equal(sim.command(aircraft.id,'goAround').ok,true);
 sim.update(45);
 assert.ok(sim.radio.some(m=>m.aircraftId===aircraft.id&&m.text.includes('rejoin approach')));
});

test('continued sightseeing traffic uses deterministic future synthetic days',()=>{
 const scenario=explorationScenario(base),after=2*86400-5;
 const first=explorationScheduleAfter(scenario,after),second=explorationScheduleAfter(scenario,after);
 assert.ok(first.length>0);assert.deepEqual(first,second);
 assert.ok(first.every(f=>f.time>after&&!f.exact&&f.id.startsWith('roam-2-')));
});

test('the arrivals gallery stays above its open void and the exterior facade blocks entry',()=>{
 const spot=exploreSpot('t2-arrival-gallery'),terminal=terminalBuildingBounds(terminals.find(t=>t.id==='T2')!,'T2');
 const acrossAtrium=moveExplorerCamera(spot,spot.position,{x:terminal.x-40,z:spot.position.z});
 assert.ok(acrossAtrium.x<terminal.x-65);
 assert.equal(acrossAtrium.y,spot.position.y);
 const outside={x:terminal.x-terminal.width/2-3,z:terminal.z};
 const towardWall={x:terminal.x-terminal.width/2+1,z:terminal.z};
 assert.equal(moveExplorer(exploreSpot('runway'),outside,towardWall).x,outside.x);
});

test('the T2 queue can be entered from the cross-aisle and stops at the counter',()=>{
 const spot=exploreSpot('t2-departures'),terminal=terminalBuildingBounds(terminals.find(t=>t.id==='T2')!,'T2');
 const x=terminal.x-30;
 let p={x,z:terminal.z-24};
 for(let z=-23.75;z<=-17.25;z+=.25){
  p=moveExplorer(spot,p,{x,z:terminal.z+z});
  assert.equal(p.z,terminal.z+z);
 }
 assert.deepEqual(moveExplorer(spot,p,{x,z:terminal.z-17}),p);
 const corridorSide={x:terminal.x-34,z:terminal.z-20.35};
 assert.deepEqual(moveExplorer(spot,corridorSide,{...corridorSide,z:terminal.z-20.15}),corridorSide);
});

test('terminal shadow focus excludes the runway, curb and open-air decks',()=>{
 for(const id of ['t1-checkin','t2-arrivals','t2-departures','t2-d-gates','t2-d10'] as const){
  assert.ok(isIndoorExploreSpot(exploreSpot(id)),id);
 }
 for(const id of ['runway','apron','t2-arrival-curb','t2-forecourt','t2-north-deck','t2-south-deck'] as const){
  assert.ok(!isIndoorExploreSpot(exploreSpot(id)),id);
 }
});

test('interior viewpoints start on the selected floor outside major solid fixtures',()=>{
 for(const spot of exploreSpots.filter(s=>s.bounds)){
  const p=spot.position,b=spot.bounds!;
  assert.ok(p.x>b.left&&p.x<b.right&&p.z>b.near&&p.z<b.far,spot.id);
  assert.ok(Math.abs(p.y-(spot.floor+1.7))<1e-9,spot.id);
  assert.ok((spot.obstacles??[]).every(r=>!(p.x>r.left&&p.x<r.right&&p.z>r.near&&p.z<r.far)),spot.id);
 }
});
