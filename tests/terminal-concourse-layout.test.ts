import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FLEET} from '../src/data/fleet';
import {exploreSpot,moveExplorer,moveExplorerCamera,type ExploreSpotId} from '../src/render/exploration';
import {CONCOURSE_AISLE_DEPTH,CONCOURSE_LEVEL,GATE_CONCOURSES,GATE_CONCOURSE_INTERFACES,T2_D_PUBLIC_CONCOURSE,distanceInside} from '../src/render/terminalConcourseLayout';
import {buildingRectEdges} from '../src/render/terminalBuildingLayout';
import {SOUTH_DEPARTURE_LEVEL,SOUTH_DEPARTURE_LINK,SOUTH_DEPARTURE_WALK_Z,southStairMeasures} from '../src/render/terminalSouthPassageLayout';

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

test('the D concourse walkways have open ends, enclosed sides and separate boarding aisles',()=>{
 const row=GATE_CONCOURSES.find(row=>row.wing==='D')!,spot=exploreSpot('t2-d-gates');
 for(const belt of T2_D_PUBLIC_CONCOURSE.belts){
  const bounds=buildingRectEdges(belt);
  for(const x of [bounds.left-.5,bounds.right+.5]){
   const end={x,z:belt.z},inside={x:x<bounds.left?bounds.left+.58:bounds.right-.58,z:belt.z};
   assert.deepEqual(moveExplorer(spot,end,inside),inside);
  }
  const outside={x:belt.x,z:bounds.near-.72};
  assert.deepEqual(moveExplorer(spot,outside,{x:belt.x,z:bounds.near}),outside);
  assert.ok(row.gates.every(({bridge})=>bridge.x<bounds.left-4||bridge.x>bounds.right+4));
 }
 assert.ok(exploreSpot('t2-d10').bounds!.far>distanceInside(row,40));
});

test('the B9–C1 passenger connection can be walked in both directions on the same floor',()=>{
 const z=SOUTH_DEPARTURE_WALK_Z,y=SOUTH_DEPARTURE_LEVEL+1.7;
 for(const [id,start,step] of [['t1-b-passage',156,-.5],['t2-c-passage',84,.5]] as const){
  const spot=exploreSpot(id);
  assert.equal(spot.floor,SOUTH_DEPARTURE_LEVEL);
  assert.equal(spot.position.z,z);
  let p:{x:number;y:number;z:number}={x:start,y,z};
  for(let i=1;i<=144;i++){
   const x=start+step*i;
   p=moveExplorerCamera(spot,p,{x,z});
   assert.deepEqual(p,{x,y,z},`${id} stops before ${x}`);
  }
 }
 const spot=exploreSpot('t1-b-passage'),offLink={x:124.45,y,z:94.6};
 assert.deepEqual(moveExplorerCamera(spot,offLink,{x:123.85,z:offLink.z}),offLink);
 assert.ok(SOUTH_DEPARTURE_LINK.depth>6);
});

test('B9 and C1 stairs join the departure deck to the boarding floor with guarded sides',()=>{
 for(const [wing,upperId,lowerId] of [['B','t1-b-passage','t1-b-gates'],['C','t2-c-passage','t2-c-gates']] as const){
  const stair=southStairMeasures(wing),upper=exploreSpot(upperId),lower=exploreSpot(lowerId);
  for(const [spot,start,goal,direction] of [[lower,stair.bottomX-1.4,stair.topX+1.4,1],[upper,stair.topX+1.4,stair.bottomX-1.4,-1]] as const){
   let p={x:start,y:spot.floor+1.7,z:stair.z},midflight=false;
   for(let i=0;i<110&&Math.abs(goal-p.x)>1e-6;i++){
    const next=moveExplorerCamera(spot,p,{x:p.x+direction*Math.min(.23,Math.abs(goal-p.x)),z:stair.z});
    assert.ok((next.x-p.x)*direction>0,`${wing} blocked at ${p.x}`);
    assert.ok((next.y-p.y)*direction>=0&&Math.abs(next.y-p.y)<.2,`${wing} has uneven height at ${p.x}`);
    if(next.y>stair.lower+1.7&&next.y<stair.upper+1.7){
     midflight=true;
     const towardRail=moveExplorerCamera(spot,next,{x:next.x,z:stair.z+stair.depth/2});
     assert.ok(towardRail.z<stair.z+stair.depth/2-.25);
    }
    p=next;
   }
   assert.ok(midflight);
   assert.deepEqual(p,{x:goal,y:(direction>0?stair.upper:stair.lower)+1.7,z:stair.z});
  }
  const side={x:stair.x,y:upper.floor+1.7,z:stair.z-stair.depth/2-.46};
  assert.deepEqual(moveExplorerCamera(upper,side,{x:side.x,z:side.z+.34}),side);
 }
});
