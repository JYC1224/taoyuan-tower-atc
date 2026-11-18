import {T1_FLOOR_LEVELS} from './terminalInteriorLayout';

export type PassengerRect={left:number;right:number;near:number;far:number};
export type PassengerBounds={x:number;z:number;width:number;depth:number;height:number};

/**
 * T1 A-side fit to the official 3F plan and several independent lounge views.
 * The diagram establishes the branch/shared-room arrangement, not dimensions.
 * The lower lounge/upper passage section is photograph-informed: elevations
 * use the existing terminal levels and bridge interface, not surveyed heights.
 * Keep these authored dimensions shared by architecture and walking collision.
 */
export const T1_A_PASSENGER={
 bounds:{x:451,z:-206,width:660,depth:40,height:15.45},
 passageFloor:T1_FLOOR_LEVELS[3],
 loungeFloor:T1_FLOOR_LEVELS[2],
 passage:{left:123,right:779,near:-198,far:-187},
 passageCeiling:14.35,
 loungeCeiling:14.72,
 roomNear:-224.8,
 roomFar:-199,
 bridgeSetback:4.5,
 link:{left:432,right:448,near:-198,far:-177.5},
} as const;

export interface T1WaitingRoom {
 id:string;gateIds:readonly string[];x:number;width:number;
 kind:'shared'|'mountain'|'typical';
 bounds:PassengerRect;
}

// A1/2/3 are one shared room, not three repeated gate rooms. Other gate
// centres retain their existing AIP-projected X positions. Side gaps provide
// the vertical circulation and service pockets visible between lounges.
export const T1_A_WAITING_ROOMS:readonly T1WaitingRoom[]=[
 {id:'A9',gateIds:['A9'],x:178,width:64,kind:'typical'},
 {id:'A8',gateIds:['A8'],x:260,width:68,kind:'typical'},
 {id:'A7',gateIds:['A7'],x:344,width:44,kind:'mountain'},
 {id:'A6',gateIds:['A6'],x:428,width:68,kind:'typical'},
 {id:'A5',gateIds:['A5'],x:512,width:68,kind:'typical'},
 {id:'A4',gateIds:['A4'],x:596,width:68,kind:'typical'},
 {id:'A123',gateIds:['A1','A2','A3'],x:707,width:110,kind:'shared'},
].map(r=>({...r,kind:r.kind as T1WaitingRoom['kind'],bounds:{left:r.x-r.width/2,right:r.x+r.width/2,near:T1_A_PASSENGER.roomNear,far:T1_A_PASSENGER.roomFar}}));

export function passengerRect(x:number,z:number,width:number,depth:number,margin=0):PassengerRect{
 return {left:x-width/2-margin,right:x+width/2+margin,near:z-depth/2-margin,far:z+depth/2+margin};
}

export function waitingRoom(id:string){
 const room=T1_A_WAITING_ROOMS.find(r=>r.id===id||r.gateIds.includes(id));
 if(!room)throw new Error(`Unknown T1 A lounge: ${id}`);
 return room;
}

export function t1LoungeStairs(room:T1WaitingRoom){
 const run=10.5,width=2.8,topZ=-198.6,bottomZ=topZ-run;
 return [-1,1].map(side=>({x:room.x+side*(room.width/2-3.2),z:(topZ+bottomZ)/2,width,run,topZ,bottomZ,
  topY:T1_A_PASSENGER.passageFloor,bottomY:T1_A_PASSENGER.loungeFloor}));
}

/** Seat banks leave a central aisle, window aisle and stair landing clear. */
export function t1LoungeSeatBanks(room:T1WaitingRoom){
 const blocks=room.kind==='shared'?6:4,spacing=room.kind==='shared'?16:room.kind==='mountain'?9.5:12,
  seats=room.kind==='shared'?12:room.kind==='mountain'?8:10,pitch=.69,width=(seats-1)*pitch+.59;
 return Array.from({length:6},(_,row)=>Array.from({length:blocks},(_,block)=>({
  x:room.x+(block-(blocks-1)/2)*spacing,z:-207.8-row*2.6,width,depth:1.25,seats,pitch,row,
 }))).flat();
}

export function t1LoungeColumns(room:T1WaitingRoom){
 // The A7 photographs show round white columns at the lower boarding band.
 const span=room.width-13,count=Math.round(span/9);
 return Array.from({length:count+1},(_,i)=>({x:room.x-span/2+span*i/count,z:-200.25,radius:.39}));
}

export function t1LoungeCore(room:T1WaitingRoom){
 return {x:room.x,z:-197.2,radius:10.4,frontZ:-207.6};
}

export function t1LoungeObstacles(room:T1WaitingRoom):PassengerRect[]{
 const stairs=t1LoungeStairs(room),columns=t1LoungeColumns(room);
 const obstacles=[
  ...t1LoungeSeatBanks(room).map(b=>passengerRect(b.x,b.z,b.width,b.depth,.3)),
  ...columns.map(c=>passengerRect(c.x,c.z,c.radius*2,c.radius*2,.25)),
  // Stairs remain a visual connection; floor changes use the location menu.
  ...stairs.map(s=>passengerRect(s.x,s.z,s.width+.4,s.run,.2)),
  passengerRect(room.x,-200.25,room.width-10,1.05,.25),
 ];
 if(room.kind==='shared'){
  const core=t1LoungeCore(room);
  // Rectangular pieces follow the circular core instead of closing the room
  // with one huge box; the side circulation remains accessible.
  for(let i=0;i<12;i++){
   const a=Math.PI+(i+.5)*Math.PI/12;
   obstacles.push(passengerRect(core.x+Math.cos(a)*core.radius,core.z+Math.sin(a)*core.radius,3.05,2.25,.25));
  }
 }
 return obstacles;
}

export function t1PassageObstacles():PassengerRect[]{
 return T1_A_WAITING_ROOMS.flatMap(room=>{
  const stairs=t1LoungeStairs(room);
  // Guard the openings into the lower rooms. A walker cannot step out of the
  // upper deck into open air; the stair connection is inspected separately.
  return stairs.map(s=>passengerRect(s.x,-198.35,s.width+.6,1.1,.2));
 });
}

/** The link's side walls stop at the junction, leaving the A passage open. */
export function t1DepartureLinkWalls(){
 const link=T1_A_PASSENGER.link,near=T1_A_PASSENGER.passage.far;
 return [link.left,link.right].map(x=>passengerRect(x,(near+link.far)/2,.12,link.far-near));
}

export function containsPassengerPoint(rect:PassengerRect,x:number,z:number){
 return x>=rect.left&&x<=rect.right&&z>=rect.near&&z<=rect.far;
}
