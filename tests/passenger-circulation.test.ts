import assert from 'node:assert/strict';
import {test} from 'node:test';
import {terminals} from '../src/data/airport';
import {exploreSpot,isIndoorExploreSpot,moveExplorerCamera,type ExploreSpot} from '../src/render/exploration';
import {T2_FLOOR_LEVELS,terminalBuildingBounds,t2ArrivalFacade,t2PublicArrivalVoids,buildingRectEdges} from '../src/render/terminalBuildingLayout';
import {terminalEscalators} from '../src/render/terminalCirculationLayout';
import {T2_GATE_LINKS} from '../src/render/terminalGateLinks';
import {T1_A_WAITING_ROOMS,t1LoungeStairs} from '../src/render/terminalPassengerLayout';
import {SOUTH_DEPARTURE_WALK_Z} from '../src/render/terminalSouthPassageLayout';
import {T2_OBSERVATION_DECK_LAYOUT} from '../src/render/terminalInteriorLayout';
import {WALK_EYE_HEIGHT as EYE,type WalkPosition,type WalkSlope} from '../src/render/terminalWalk';

const t1=terminals.find(t=>t.id==='T1')!,t2=terminalBuildingBounds(terminals.find(t=>t.id==='T2')!,'T2');

function walk(spot:ExploreSpot,from:WalkPosition,waypoints:readonly (readonly [number,number])[]){
 let p=from;
 for(const [x,z] of waypoints){
  const start=p,count=Math.ceil(Math.hypot(x-start.x,z-start.z)/.22);
  for(let i=1;i<=count;i++){
   const target={x:start.x+(x-start.x)*i/count,z:start.z+(z-start.z)*i/count};
   const next=moveExplorerCamera(spot,p,target);
   assert.ok(Math.hypot(next.x-target.x,next.z-target.z)<1e-5,`blocked walking to ${target.x.toFixed(2)}, ${target.z.toFixed(2)} at eye level ${p.y.toFixed(2)}`);
   assert.ok(Math.abs(next.y-p.y)<.16,'floor changes must be continuous');
   p=next;
  }
 }
 return p;
}

function walkFlight(spot:ExploreSpot,flight:WalkSlope,ascending:boolean){
 const {center,width,axis,lowerEnd,upperEnd,lowerFloor,upperFloor}=flight;
 const sign=Math.sign(upperEnd-lowerEnd),start=ascending?lowerEnd-sign*1.5:upperEnd+sign*1.5,
  goal=ascending?upperEnd+sign*1.5:lowerEnd-sign*1.5;
 const point=(along:number,y:number):WalkPosition=>axis==='z'?{x:center,y,z:along}:{x:along,y,z:center};
 const mid=point((lowerEnd+upperEnd)/2,0),end=point(goal,0),origin=point(start,(ascending?lowerFloor:upperFloor)+EYE);
 const midway=walk(spot,origin,[[mid.x,mid.z]]);
 assert.ok(Math.abs(midway.y-((lowerFloor+upperFloor)/2+EYE))<1e-6);
 const towardRail=axis==='z'?{x:midway.x+width,z:midway.z}:{x:midway.x,z:midway.z+width};
 const beside=moveExplorerCamera(spot,midway,towardRail);
 assert.ok(Math.hypot(beside.x-midway.x,beside.z-midway.z)<width/2,'handrail blocks the side of a flight');
 const finish=walk(spot,midway,[[end.x,end.z]]);
 assert.ok(Math.abs(finish.y-((ascending?upperFloor:lowerFloor)+EYE))<1e-6);
 return finish;
}

test('all main-terminal escalator lanes reach solid landings in both directions',()=>{
 for(const [terminal,b,id] of [['T1',t1,'t1-checkin'],['T2',t2,'t2-arrivals']] as const){
  const spot=exploreSpot(id);
  for(const slope of terminalEscalators(b,terminal))for(const up of [true,false])walkFlight(spot,slope,up);
 }
});

test('Terminal 1 departures connect to both gate wings and every A waiting room joins the upper passage',()=>{
 const hall=exploreSpot('t1-departures'),a7=exploreSpot('t1-a-stairs');
 const route=[[473.45,-112.2],[471.5,-129.75],[463.05,-159.65],[440,-171.4],[440,-192.4],[a7.position.x,a7.position.z]] as const;
 const landing=walk(hall,hall.position,route);
 assert.equal(landing.y,a7.position.y);
 for(const room of T1_A_WAITING_ROOMS)for(const stair of t1LoungeStairs(room)){
  const slope={axis:'z' as const,center:stair.x,width:stair.width,lowerEnd:stair.bottomZ,upperEnd:stair.topZ,lowerFloor:stair.bottomY,upperFloor:stair.topY};
  for(const up of [true,false])walkFlight(hall,slope,up);
 }
 const b=exploreSpot('t1-b-link');
 const toC=walk(b,b.position,[[440,SOUTH_DEPARTURE_WALK_Z],[112,SOUTH_DEPARTURE_WALK_Z]]);
 assert.equal(toC.y,b.position.y);
 assert.equal(walk(b,toC,[[440,SOUTH_DEPARTURE_WALK_Z],[b.position.x,b.position.z]]).y,b.position.y);
});

test('Terminal 2 arrivals walk from passport control to the belts, through customs and out to the pickup curb',()=>{
 const start=exploreSpot('t2-arrival-immigration'),[northDoor]=t2ArrivalFacade(t2).doors;
 const bank=terminalEscalators(t2,'T2').find(s=>s.lowerFloor===T2_FLOOR_LEVELS[2]&&s.center>t2.x&&s.center<t2.x+9&&s.upperEnd<t2.z)!;
 const approach=walk(start,start.position,[[-249.45,-83.25],[-255.95,-84.55],[-257.9,-86.5],[-257.9,-87.8],[-260.5,-90.4],[-262.45,-90.4],[bank.center,bank.upperEnd+1.5]]);
 const reclaim=walk(start,approach,[[bank.center,bank.lowerEnd-1.5]]);
 assert.equal(reclaim.y,T2_FLOOR_LEVELS[2]+EYE);
 const curb=walk(start,reclaim,[[-283.87,-103.5],[-285.17,-102.2],[-293,-54],[-321,-54],[-321,-91],[-357,-91],[-357,northDoor.z],[northDoor.x-3.2,northDoor.z]]);
 assert.ok(!isIndoorExploreSpot(start,curb));
});

test('the check-in path reaches the airside spine through the modeled checkpoints and then reaches C and D',()=>{
 const start=exploreSpot('t2-departures');
 const airside=walk(start,start.position,[[-293,-83],[-290.7,-74.35],[-284.85,-74.35],[-283.55,-73.05],[-271,-70],[-267.75,-68.05],
  [-258,-68.7],[-255.4,-70.65],[-249,-72],[-237,-66]]);
 for(const [wing,id] of [['C','t2-c-link'],['D','t2-d-link']] as const){
  const spot=exploreSpot(id),{slope}=T2_GATE_LINKS[wing];
  const gate=walk(start,airside,[[spot.position.x,spot.position.z],[slope.center,slope.lowerEnd+3*T2_GATE_LINKS[wing].side]]);
  assert.equal(gate.y,slope.lowerFloor+EYE);
  assert.equal(walk(start,gate,[[spot.position.x,spot.position.z]]).y,airside.y);
 }
 const outsideCheckpoint={x:t2.x-4,z:t2.z-65,y:airside.y};
 const blocked=moveExplorerCamera(start,outsideCheckpoint,{x:t2.x+15,z:outsideCheckpoint.z});
 assert.ok(blocked.x<t2.x,'the glass divider closes the side of the security checkpoint');
});

test('balustrades and landside partitions still block off-route movement, including long frames',()=>{
 const gallery=exploreSpot('t2-arrival-gallery'),voidEdge=buildingRectEdges(t2PublicArrivalVoids(t2)[0]).left;
 const acrossVoid=moveExplorerCamera(gallery,gallery.position,{x:voidEdge+40,z:gallery.position.z});
 assert.ok(acrossVoid.x<voidEdge);
 assert.equal(acrossVoid.y,gallery.position.y);
 const p={x:t2.x-23,z:t2.z-137,y:gallery.position.y};
 const acrossPartition=moveExplorerCamera(gallery,p,{x:t2.x+3,z:p.z});
 assert.ok(acrossPartition.x<t2.x-18);
 const a=exploreSpot('t1-a-link'),off={x:450,z:-189,y:a.position.y};
 const besideBridge=moveExplorerCamera(a,off,{x:off.x,z:-181});
 assert.ok(besideBridge.z<=-187,'the offset beside the raised bridge has no floor');
});

test('the 5F doors connect both observation decks and keep the flanking facade closed',()=>{
 const spot=exploreSpot('t2-north-deck'),x=t2.x+T2_OBSERVATION_DECK_LAYOUT.accessXOffset,y=spot.position.y;
 for(const side of [-1,1]){
  const facade=t2.z+side*t2.depth/2,inside={x,y,z:facade-side*4},outside={x,y,z:facade+side*4};
  assert.deepEqual(walk(spot,inside,[[x,outside.z]]),outside);
  assert.deepEqual(walk(spot,outside,[[x,inside.z]]),inside);
  assert.ok(!isIndoorExploreSpot(spot,outside)&&isIndoorExploreSpot(spot,inside));
  const offAxis={...inside,x:x+4},blocked=moveExplorerCamera(spot,offAxis,{x:offAxis.x,z:outside.z});
  assert.ok((blocked.z-facade)*side<0);
 }
});
