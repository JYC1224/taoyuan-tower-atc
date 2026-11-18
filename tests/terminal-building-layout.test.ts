import {test} from 'node:test';
import assert from 'node:assert/strict';
import {terminals} from '../src/data/airport';
import {exploreSpot,moveExplorer} from '../src/render/exploration';
import {TERMINAL_FLOOR_PROGRAM,T1_FLOOR_LEVELS,T2_FLOOR_LEVELS,T2_PASSENGER_SECTION as S,terminalBuildingBounds,placeBuildingRect,buildingRectEdges,t2BaggageBelts,t2ArrivalFacade,t2ArrivalHallFixtures,t2CustomsBays,t2ProcessingFootprints,t2VerticalCores,t2EscalatorOpenings,t1ArrivalCeilingHeight,t2StructuralColumnCenters,T2_TRANSFER_AMENITIES,deckRailSpans,t2PublicArrivalVoids,type BuildingRect} from '../src/render/terminalBuildingLayout';
import {T2_FOURTH_FLOOR_LAYOUT,T2_FOURTH_FLOOR_LOUNGES,t2FourthFloorLoungeCenter,t2ThirdFloorCheckInBanks,t2FourthFloorDiningLayout,t2ThirdFloorRetailUnits} from '../src/render/terminalInteriorLayout';

const outer=terminals.find(t=>t.id==='T2')!,b=terminalBuildingBounds(outer,'T2');
const overlaps=(a:BuildingRect,c:BuildingRect,margin=0)=>Math.abs(a.x-c.x)<(a.width+c.width)/2+margin&&Math.abs(a.z-c.z)<(a.depth+c.depth)/2+margin;
const contains=(r:BuildingRect,p:{x:number;z:number},margin=0)=>{const e=buildingRectEdges(r,-margin);return p.x>e.left&&p.x<e.right&&p.z>e.near&&p.z<e.far;};

test('the enclosed T2 body and road canopy are separate; airport stands and roof envelope stay put',()=>{
 assert.equal(outer.width,210);assert.equal(b.width,150);assert.equal(b.depth,outer.depth);
 assert.equal(b.x,outer.x);assert.equal(b.z,outer.z);assert.equal(b.height,outer.height);
 // Existing mapped service-road points used to lie inside the glass box.
 for(const p of [{x:-368.78,z:-68.44},{x:-371.51,z:-150.12},{x:-372.46,z:-178.33}])assert.ok(!contains(b,p));
});

test('floor programs and vertical sections retain distinct arrival and departure processing',()=>{
 const program=TERMINAL_FLOOR_PROGRAM.T2;
 assert.match(program.find(p=>p.level==='2F')!.use,/Arrival immigration/);
 assert.match(program.find(p=>p.level==='1F')!.use,/Baggage reclaim.*customs.*public arrivals/);
 assert.match(program.find(p=>p.level==='3F')!.use,/Check-in.*security.*departure immigration/);
 for(const levels of [T1_FLOOR_LEVELS,T2_FLOOR_LEVELS])for(let i=1;i<levels.length;i++)assert.ok(levels[i]-levels[i-1]>3.4);
 assert.ok(S.arrivalCeiling-T2_FLOOR_LEVELS[2]>10,'public arrival hall is double height');
 assert.ok(S.reclaimCeiling<T2_FLOOR_LEVELS[3]-.34,'reclaim ceiling stays below the 2F deck');
 assert.ok(S.arrivalCeiling+.4<T2_FLOOR_LEVELS[4]-.34,'coffers fit below the next occupied storey');
});

test('the public arrival-hall void does not consume 2F passport control',()=>{
 const voids=S.publicVoids.map(r=>placeBuildingRect(b,r)),processing=t2ProcessingFootprints(b).arrival;
 for(const hole of voids){
  assert.ok(contains(b,{x:hole.x-hole.width/2,z:hole.z-hole.depth/2},1));
  for(const zone of processing)assert.ok(!overlaps(hole,zone,2));
 }
 assert.ok(voids.some(hole=>contains(hole,{x:b.x-47,z:b.z})),'the ceiling above the pickup rail is open');
 const camera=exploreSpot('t2-arrival-gallery');
 assert.ok(voids.every(hole=>!contains(hole,camera.position)));
 const from={x:b.x-70,z:b.z-35};
 assert.deepEqual(moveExplorer(camera,from,{x:b.x-47,z:from.z}),from,'walking cannot enter the open-to-below volume');
});

test('all eight baggage loops fit the reclaim area with usable aisles and the correct orientation',()=>{
 const belts=t2BaggageBelts(b),reclaim=placeBuildingRect(b,S.reclaim),publicHall=placeBuildingRect(b,S.publicHall);
 assert.deepEqual(belts.map(x=>x.number),[1,2,3,4,5,6,7,8]);
 for(const belt of belts){
  const e=buildingRectEdges(belt);
  for(const p of [{x:e.left,z:e.near},{x:e.right,z:e.far}])assert.ok(contains(reclaim,p),String(belt.number));
  assert.ok(!overlaps(belt,publicHall,3));
  assert.equal(belt.width>belt.depth,belt.number<=6);
 }
 for(let i=0;i<belts.length;i++)for(let j=i+1;j<belts.length;j++)assert.ok(!overlaps(belts[i],belts[j],3));
 assert.equal(new Set(belts.slice(0,6).map(r=>r.x)).size,1);
 assert.equal(new Set(belts.slice(0,6).map(r=>r.z)).size,6);
 assert.ok(belts[7].z<belts[6].z,'8 A/B is north of 7 A/B on the 1F map');
 assert.ok(belts.slice(1,6).every((belt,i)=>belt.z-belts[i].z>=18&&belt.z-belts[i].z<=20));
});

test('the central customs exit opens onto a continuous pickup rail with clear detours',()=>{
 const bays=t2CustomsBays(b),{exit,partitionPanels,lowBarriers}=t2ArrivalHallFixtures(b);
 for(const bay of bays){
  assert.ok(bay.x>exit.x&&bay.x<b.x,'customs sits behind the public exit wall');
  for(const belt of t2BaggageBelts(b))assert.ok(!overlaps(bay,belt,1));
 }
 assert.equal(partitionPanels.length,2);
 assert.ok(partitionPanels.every(r=>!contains(r,exit)));
 const rail=lowBarriers.find(r=>r.z===exit.z)!;
 assert.ok(rail.x<exit.x&&rail.depth>exit.span*2);
 const spot=exploreSpot('t2-arrival-customs');
 const start={x:rail.x+1.6,z:exit.z};
 assert.deepEqual(moveExplorer(spot,start,{x:rail.x,z:exit.z}),start);
 for(const side of [-1,1]){
  const z=exit.z+side*(rail.depth/2+4),from={x:rail.x+1,z},to={x:rail.x-1,z};
  assert.deepEqual(moveExplorer(spot,from,to),to);
 }
});

test('walkers can follow the same-floor arrival path to either curb exit through the real door gaps',()=>{
 const {doors,wall,walk}=t2ArrivalFacade(b),spot=exploreSpot('t2-arrival-customs');
 const stepTo=(from:{x:number;z:number},to:{x:number;z:number})=>{
  const count=Math.ceil(Math.hypot(to.x-from.x,to.z-from.z)/.32);
  let current=from;
  for(let i=1;i<=count;i++){
   const t=i/count,next={x:from.x+(to.x-from.x)*t,z:from.z+(to.z-from.z)*t};
   assert.deepEqual(moveExplorer(spot,current,next),next,`blocked at ${next.x}, ${next.z}`);
   current=next;
  }
  return current;
 };
 for(const door of doors){
  const side=Math.sign(door.z-b.z),crossAisleZ=b.z+(side<0?-41:32);
  const route=[{x:b.x-8,z:b.z+side*4},{x:b.x-36,z:b.z+side*4},{x:b.x-36,z:crossAisleZ},
   {x:b.x-72,z:crossAisleZ},{x:b.x-72,z:door.z},{x:walk.x,z:door.z}];
  for(let i=1;i<route.length;i++)stepTo(route[i-1],route[i]);
 }
 const pier=wall[1],from={x:pier.x+1.15,z:pier.z};
 assert.deepEqual(moveExplorer(spot,from,{x:pier.x,z:pier.z}),from);
});

test('check-in, security, passport control and airside retail form successive non-overlapping bands',()=>{
 const banks=t2ThirdFloorCheckInBanks(b.x,b.z,b.depth),processing=t2ProcessingFootprints(b),retail=t2ThirdFloorRetailUnits(b.x,b.z,b.width);
 assert.equal(banks.length,13);assert.equal(banks[12].lastCounterNumber,26);
 for(const bank of banks){
  const footprint={...bank,width:bank.rowWidth+1.8,depth:9.6};
  assert.ok(!overlaps(footprint,processing.departureSecurity,2));
  assert.ok(!overlaps(footprint,processing.departureImmigration,2));
  assert.ok(Math.abs(bank.z-b.z)<98);
 }
 assert.ok(processing.departureSecurity.x<processing.departureImmigration.x);
 assert.ok(!overlaps(processing.departureSecurity,processing.departureImmigration,2));
 for(const unit of retail){
  assert.ok(unit.frontX>processing.departureImmigration.x+processing.departureImmigration.width/2+8);
  assert.ok(unit.x+unit.depth/2<b.x+b.width/2-1);
 }
});

test('upper lounges occupy the east side; south dining furniture remains on its own floor',()=>{
 const hole={x:b.x+T2_FOURTH_FLOOR_LAYOUT.atrium.xOffset,z:b.z+T2_FOURTH_FLOOR_LAYOUT.atrium.zOffset,width:T2_FOURTH_FLOOR_LAYOUT.atrium.width,depth:T2_FOURTH_FLOOR_LAYOUT.atrium.depth};
 const lounges=T2_FOURTH_FLOOR_LOUNGES.map(l=>({...t2FourthFloorLoungeCenter(b.x,b.z,b.width,b.depth,l.side,l.zRatio),width:l.width,depth:l.depth}));
 for(const lounge of lounges){assert.ok(lounge.x>b.x);assert.ok(!overlaps(lounge,hole,2));}
 const dining=t2FourthFloorDiningLayout(b.x,b.z,b.width,b.depth);
 assert.ok(!overlaps(dining.zone,hole,2));
 for(const table of dining.tables){
  assert.ok(contains(dining.zone,table,2));
  for(const lounge of lounges)assert.ok(!overlaps({...table,width:3.5,depth:3.5},lounge,1));
 }
 const centralAisle={...dining.zone,width:4};
 for(const table of dining.tables)assert.ok(!overlaps(table,centralAisle,.4),'leave a continuous main dining aisle');
 for(let i=0;i<dining.tables.length;i++)for(let j=i+1;j<dining.tables.length;j++)assert.ok(!overlaps(dining.tables[i],dining.tables[j],1.2),'stools must leave usable secondary aisles');
});

test('the structural grid stays outside counters, belts and the relocated transfer amenity',()=>{
 const counters=t2ThirdFloorCheckInBanks(b.x,b.z,b.depth).map(bank=>({...bank,width:bank.rowWidth+1.8,depth:9.6})),belts=t2BaggageBelts(b),amenity=placeBuildingRect(b,{x:T2_TRANSFER_AMENITIES.dx,z:T2_TRANSFER_AMENITIES.dz,width:T2_TRANSFER_AMENITIES.width,depth:T2_TRANSFER_AMENITIES.depth});
 for(const p of t2StructuralColumnCenters(b.x,b.z,b.width,b.depth)){
  const column={...p,width:1.76,depth:1.76};
  for(const counter of counters)assert.ok(!overlaps(column,counter,1),'a column must not pass through a counter island');
  for(const belt of belts)assert.ok(!overlaps(column,belt,1));
  assert.ok(!overlaps(column,amenity,.5));
 }
});

test('public and restricted escalators have independent landings and actual upper-floor openings',()=>{
 const cores=t2VerticalCores(b,2),publicCores=cores.filter(c=>!c.restricted),restricted=cores.filter(c=>c.restricted);
 assert.equal(publicCores.length,2);assert.equal(restricted.length,4);
 const openings=t2EscalatorOpenings(b,3);
 for(const core of cores){
  assert.ok(openings.some(r=>contains(r,core)));
  const run=(T2_FLOOR_LEVELS[3]-T2_FLOOR_LEVELS[2])/Math.tan(Math.PI/6),landing={x:core.x,z:core.z+core.direction*(run/2+.62)};
  if(!core.restricted)assert.ok(S.publicVoids.every(r=>!contains(placeBuildingRect(b,r),landing)),'public escalator lands at the west gallery');
 }
 for(const core of restricted){
  const stairs={x:core.x,z:core.z,width:3.5,depth:12};
  for(const belt of t2BaggageBelts(b))assert.ok(!overlaps(stairs,belt,2));
  for(const bank of t2ProcessingFootprints(b).arrival)assert.ok(!overlaps(stairs,bank,1));
 }
});

test('gallery guards leave the escalator exit open and protect the rest of the void',()=>{
 for(const opening of t2EscalatorOpenings(b,3)){
  const {left,right}=buildingRectEdges(opening),landing=opening.landing!;
  const gap=deckRailSpans(left,right,landing.edge,landing);
  assert.ok(landing.width>=3.2);
  assert.ok(gap.every(span=>span.right<=landing.x-landing.width/2||span.left>=landing.x+landing.width/2));
  assert.deepEqual(deckRailSpans(left,right,landing.edge==='near'?'far':'near',landing).map(({left,right})=>[left,right]),[[left,right]]);
 }
 for(const opening of t2PublicArrivalVoids(b)){
  const {left,right}=buildingRectEdges(opening);
  assert.ok(Math.abs(deckRailSpans(left,right,'near',opening.landing)[0].width-opening.width)<.001);
 }
 const gallery=exploreSpot('t2-arrival-gallery'),x=b.x-66.7;
 let from={x,z:b.z-31};
 for(let z=b.z-30.7;z<=b.z+31;z+=.3){
  const next={x,z};assert.deepEqual(moveExplorer(gallery,from,next),next);from=next;
 }
});

test('T1 arrivals retain a tall raked ceiling rather than a low flat soffit',()=>{
 const hall={x:0,z:0,width:22.75,depth:248.4};
 assert.ok(t1ArrivalCeilingHeight(-hall.width/2,hall)>7);
 assert.ok(t1ArrivalCeilingHeight(hall.width/2,hall)>10);
 assert.ok(t1ArrivalCeilingHeight(hall.width/2,hall)<T1_FLOOR_LEVELS[3]-.34);
});
