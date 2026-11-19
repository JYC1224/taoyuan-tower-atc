import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gates} from '../src/data/airport';
import {FLEET} from '../src/data/fleet';
import {exploreSpot,moveExplorer} from '../src/render/exploration';
import {T1_FLOOR_LEVELS} from '../src/render/terminalInteriorLayout';
import {T1_A_PASSENGER as L,T1_A_WAITING_ROOMS,waitingRoom,t1DepartureLinkWalls,t1LoungeCore,t1LoungeSeatBanks,t1LoungeStairs,containsPassengerPoint,passengerRect} from '../src/render/terminalPassengerLayout';

test('the A concourse leaves space for the nose of every stand-compatible aircraft',()=>{
 const outerWall=L.bounds.z-L.bounds.depth/2;
 for(const gate of gates.filter(g=>g.id.startsWith('A'))){
  const length=Math.max(...Object.values(FLEET).filter(p=>p.span<=gate.maxSpan).map(p=>p.length));
  assert.ok(gate.z+length/2+2<outerWall,`${gate.id}: the lounge must not enclose parked aircraft`);
 }
 assert.equal(L.passageFloor,T1_FLOOR_LEVELS[3]);
 assert.ok(L.loungeFloor>0&&L.passageFloor>L.loungeFloor);
 assert.ok(L.passageCeiling-L.passageFloor>3.3);
 assert.ok(L.loungeCeiling-L.loungeFloor>8);
});

test('A1 A2 A3 share one waiting room and every existing A gate has exactly one room',()=>{
 assert.equal(waitingRoom('A1'),waitingRoom('A2'));assert.equal(waitingRoom('A2'),waitingRoom('A3'));
 assert.equal(T1_A_WAITING_ROOMS.filter(r=>r.kind==='shared').length,1);
 const modeled=T1_A_WAITING_ROOMS.flatMap(r=>r.gateIds).sort();
 assert.deepEqual(modeled,gates.filter(g=>g.id.startsWith('A')).map(g=>g.id).sort());
});

test('seat banks preserve window, central and stair aisles in every A waiting room',()=>{
 for(const room of T1_A_WAITING_ROOMS){
  const banks=t1LoungeSeatBanks(room),stairs=t1LoungeStairs(room);
  for(const bank of banks){
   assert.ok(bank.x-bank.width/2>room.bounds.left+3);
   assert.ok(bank.x+bank.width/2<room.bounds.right-3);
   assert.ok(bank.z-bank.depth/2>room.bounds.near+2.8);
   assert.ok(bank.z+bank.depth/2<room.bounds.far-6);
   for(const stair of stairs){
    const overlapX=Math.abs(bank.x-stair.x)<(bank.width+stair.width)/2+.3;
    const overlapZ=Math.abs(bank.z-stair.z)<(bank.depth+stair.run)/2+.3;
    assert.ok(!(overlapX&&overlapZ),`${room.id} stairs must not end in a seat bank`);
   }
  }
  assert.ok(banks.every(b=>Math.abs(b.x-room.x)-b.width/2>2),'preserve a continuous central aisle');
 }
});

test('the upper departure link joins the passage without allowing a walker off the raised slab',()=>{
 const spot=exploreSpot('t1-a-link');
 let position={x:440,z:-178};
 for(let i=0;i<30;i++)position=moveExplorer(spot,position,{x:440,z:position.z-.5});
 assert.equal(position.z,-193);
 assert.ok(containsPassengerPoint(L.passage,position.x,position.z));
 assert.ok(t1DepartureLinkWalls().every(w=>w.near>=L.passage.far),'link walls must stop at the junction, not close the main passage');
 assert.deepEqual(moveExplorer(spot,{x:440,z:-192},{x:460,z:-192}),{x:460,z:-192},'both branches of the junction remain open');
 assert.deepEqual(moveExplorer(spot,{x:450,z:-190},{x:450,z:-184}),{x:450,z:-190},'outside the narrow link is open air');
 const stair=t1LoungeStairs(waitingRoom('A7'))[0],from={x:stair.x,z:-196.8};
 assert.deepEqual(moveExplorer(spot,from,{x:stair.x,z:stair.topZ+.1}),from,'flat movement must stop at the stair lip');
});

test('lounge walking blocks the linked seats and curved service core, while the window aisle stays open',()=>{
 const room=waitingRoom('A7'),spot=exploreSpot('t1-a-mountains'),bank=t1LoungeSeatBanks(room)[0],from={x:bank.x-bank.width/2-.6,z:bank.z};
 assert.deepEqual(moveExplorer(spot,from,{x:bank.x,z:bank.z}),from);
 const windowFrom={x:room.x,z:room.bounds.near+1.2},windowTo={x:room.x+12,z:windowFrom.z};
 assert.deepEqual(moveExplorer(spot,windowFrom,windowTo),windowTo);
 const shared=waitingRoom('A123'),core=t1LoungeCore(shared),outside={x:core.x,z:core.frontZ-2.5};
 assert.deepEqual(moveExplorer(exploreSpot('t1-a-shared'),outside,{x:core.x,z:core.frontZ}),outside);
});

test('all new passenger viewpoints use their actual deck and avoid the corridor guard and furniture',()=>{
 for(const id of ['t1-a-gates','t1-a-link','t1-a-shared','t1-a-mountains','t1-a-mountains-window'] as const){
  const spot=exploreSpot(id),p=spot.position;
  assert.ok(containsPassengerPoint(spot.bounds!,p.x,p.z),id);
  assert.equal(p.y,spot.floor+1.7);
  assert.ok(!spot.walkAreas||spot.walkAreas.some(a=>containsPassengerPoint(a,p.x,p.z)),id);
  assert.ok((spot.obstacles??[]).every(o=>!containsPassengerPoint(o,p.x,p.z)),id);
 }
 const a7=waitingRoom('A7');
 assert.ok(!containsPassengerPoint(passengerRect(a7.x,-200.25,a7.width-10,1.05,.25),exploreSpot('t1-a-mountains').position.x,exploreSpot('t1-a-mountains').position.z));
});
