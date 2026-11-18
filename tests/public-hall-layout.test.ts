import {test} from 'node:test';
import assert from 'node:assert/strict';
import {terminals} from '../src/data/airport';
import {T1_FLOOR_LEVELS,T2_FOURTH_FLOOR_LAYOUT,T2_THIRD_FLOOR_LAYOUT,t2ThirdFloorCheckInBanks} from '../src/render/terminalInteriorLayout';
import {T1_PUBLIC_HALL,t1ArrivalHallBounds,t1ArrivalPartitionPanels,t1CheckInBanks,t1RoofHeight,t1SupportStations} from '../src/render/terminalPublicHallLayout';
import {exploreSpot,moveExplorer,primaryExploreSpots,detailExploreSpots,exploreSpots} from '../src/render/exploration';
import {t1ArrivalStructure} from '../src/render/terminalBuildingLayout';

const t1=terminals.find(t=>t.id==='T1')!,t2=terminals.find(t=>t.id==='T2')!;

test('T1 check-in islands occupy the departure half, with clear aisles and supports between banks',()=>{
 const banks=t1CheckInBanks(t1.x,t1.z,t1.width,t1.depth),supports=t1SupportStations(t1.z,t1.depth);
 for(const bank of banks){
  assert.ok(bank.x-T1_PUBLIC_HALL.checkInLength/2>t1.x,'a bank must not cross into the arrival half');
  assert.ok(bank.x+T1_PUBLIC_HALL.checkInLength/2<t1.x+t1.width/2-5,'leave the frontage passage clear');
  assert.ok(Math.abs(bank.z-t1.z)+9.3<t1.depth/2-5);
  assert.ok(supports.every(z=>Math.abs(z-bank.z)>10),'piers must not stand inside counter/queue rows');
 }
 for(let i=1;i<banks.length;i++)assert.ok(banks[i].z-banks[i-1].z>9.3*2+4,'opposite queues leave a cross-aisle');
});

test('T1 public arrival passage is west of reclaim and customs portals remain traversable',()=>{
 const hall=t1ArrivalHallBounds(t1.x,t1.z,t1.width,t1.depth),panels=t1ArrivalPartitionPanels(t1.x,t1.z,t1.width,t1.depth),spot=exploreSpot('t1-arrivals');
 assert.ok(hall.x+hall.width/2<t1.x+t1.width*T1_PUBLIC_HALL.baggageXRatio-10);
 for(const offset of [-t1.depth*.33,-2.1,2.1,t1.depth*.33]){
  const z=t1.z+offset,from={x:hall.x,z},to={x:hall.x+hall.width/2+2,z};
  assert.ok(panels.every(p=>Math.abs(z-p.z)>p.depth/2));
  assert.deepEqual(moveExplorer(spot,from,to),to,'the mapped exit gap must remain open to the walker');
 }
 const panel=panels[0],from={x:panel.x-2,z:panel.z},to={x:panel.x,z:panel.z};
 assert.equal(moveExplorer(spot,from,to).x,from.x,'the partition itself must still block walking');
 const pier=t1ArrivalStructure(t1).exitPier;
 const atPortal={x:pier.x-1.2,z:pier.z};
 assert.deepEqual(moveExplorer(spot,atPortal,pier),atPortal,'both central exits are open around the clock pier');
});

test('T1 upper service spine fits below the roof while the eaves drop outside the central deck',()=>{
 const center=t1RoofHeight(0,t1.width,t1.height),ridge=t1RoofHeight(t1.width*T1_PUBLIC_HALL.supportHeadXRatio,t1.width,t1.height),eave=t1RoofHeight(t1.width/2,t1.width,t1.height);
 assert.ok(T1_FLOOR_LEVELS[4]+3.3<center-1.56,'lounge ceiling must clear the structural roof ribs');
 assert.ok(ridge>center&&eave<center);
 for(let x=0;x<t1.width/2;x+=.5)assert.ok(Number.isFinite(t1RoofHeight(x,t1.width,t1.height)));
});

test('T2 roof opening covers every check-in bank and its approach lanes',()=>{
 const opening=T2_FOURTH_FLOOR_LAYOUT.atrium,banks=t2ThirdFloorCheckInBanks(t2.x,t2.z+T2_THIRD_FLOOR_LAYOUT.checkIn.centerZOffset,t2.depth),near=t2.z+opening.zOffset-opening.depth/2,far=t2.z+opening.zOffset+opening.depth/2;
 for(const bank of banks){assert.ok(bank.z-4.8>near);assert.ok(bank.z+4.8<far);}
});

test('primary passenger views precede optional detail views without losing a destination',()=>{
 assert.equal(primaryExploreSpots[0].id,'t1-checkin');
 const all=[...primaryExploreSpots,...detailExploreSpots];
 assert.equal(all.length,exploreSpots.length);assert.equal(new Set(all.map(s=>s.id)).size,exploreSpots.length);
});
