import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FLEET} from '../src/data/fleet';
import {exploreSpot,moveExplorer,type ExploreSpotId} from '../src/render/exploration';
import {CONCOURSE_AISLE_DEPTH,CONCOURSE_LEVEL,GATE_CONCOURSES,GATE_CONCOURSE_INTERFACES,distanceInside} from '../src/render/terminalConcourseLayout';

test('B, C and D gate shells have room for parked aircraft and their bridge rotundas',()=>{
 assert.deepEqual(GATE_CONCOURSES.map(row=>row.gates.length),[9,10,10]);
 assert.equal(GATE_CONCOURSE_INTERFACES.has('D11'),false);
 for(const row of GATE_CONCOURSES)for(const {gate,bridge,left,right} of row.gates){
  assert.ok(bridge.x>left+3&&bridge.x<right-3,`${gate.id} has room for a boarding portal`);
  assert.ok(row.side*(bridge.z-row.facadeZ)>2.2,`${gate.id} rotunda clears the glazing`);
  const halfLength=Math.max(...Object.values(FLEET).filter(p=>p.span<=gate.maxSpan).map(p=>p.length/2));
  assert.ok(row.side*(gate.z-row.facadeZ)>halfLength+3,`${gate.id} clears the longest compatible aircraft`);
  assert.equal(bridge.floorY,CONCOURSE_LEVEL);
 }
});

test('walkers can use the B, C and D concourse aisle and reach each boarding lane',()=>{
 for(const row of GATE_CONCOURSES){
  const terminal=row.wing==='B'?1:2,spot=exploreSpot(`t${terminal}-${row.wing.toLowerCase()}-gates` as ExploreSpotId);
  assert.equal(spot.floor,CONCOURSE_LEVEL);
  const z=distanceInside(row,CONCOURSE_AISLE_DEPTH);
  let current={x:spot.bounds!.left+.25,z};
  const end=spot.bounds!.right-.25;
  while(current.x<end){
   const next={x:Math.min(end,current.x+.5),z};
   assert.deepEqual(moveExplorer(spot,current,next),next,`${row.wing}: aisle obstructed at ${current.x}`);
   current=next;
  }
  for(const {gate,bridge,desk,banks} of row.gates){
   const x=bridge.x;
   assert.ok(banks.length>=4,`${gate.id} has seating`);
   let from={x,z};
   for(let d=CONCOURSE_AISLE_DEPTH-.5;d>=1;d-=.5){
    const next={x,z:distanceInside(row,d)};
    assert.deepEqual(moveExplorer(spot,from,next),next,`${gate.id}: boarding lane obstructed`);
    from=next;
   }
   const approach={x:desk.x,z:desk.z-row.side*1.5};
   assert.deepEqual(moveExplorer(spot,approach,desk),approach,`${gate.id}: desk must stop a walker`);
  }
 }
});
