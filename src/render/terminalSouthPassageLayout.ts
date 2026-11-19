import {T1_FLOOR_LEVELS,buildingRectEdges,type BuildingRect} from './terminalBuildingLayout';
import {CONCOURSE_LEVEL,GATE_CONCOURSES,movingWalkwayRails,type GateConcourse} from './terminalConcourseLayout';

export const SOUTH_DEPARTURE_LEVEL=T1_FLOOR_LEVELS[3];
export type SouthWing='B'|'C';

const bWing=GATE_CONCOURSES.find(row=>row.wing==='B')!;
const cWing=GATE_CONCOURSES.find(row=>row.wing==='C')!;

function upperFloor(row:GateConcourse):BuildingRect{
 const depth=row.bounds.depth-9.8;
 return {x:row.bounds.x,z:row.facadeZ-9.8-depth/2,width:row.bounds.width,depth};
}

function flight(row:GateConcourse,floor:BuildingRect,gateId:string){
 const gate=row.gates.find(bay=>bay.gate.id===gateId)!;
 return {x:gate.bridge.x-16.9,z:floor.z+floor.depth/2-1.64,width:14.1,depth:2.78};
}

const bDeck=upperFloor(bWing),cDeck=upperFloor(cWing);
const b9=bWing.gates.find(bay=>bay.gate.id==='B9')!;
const c1=cWing.gates.find(bay=>bay.gate.id==='C1')!;
const b3=bWing.gates.find(bay=>bay.gate.id==='B3')!;
const bEnd=buildingRectEdges(bDeck),cEnd=buildingRectEdges(cDeck);

export const SOUTH_DEPARTURE_LINK:BuildingRect={
 x:(bEnd.left+cEnd.right)/2,z:98.97,width:bEnd.left-cEnd.right+1.12,depth:7.0,
};
export const SOUTH_DEPARTURE_WALK_Z=100.04;
export const T1_B_COMMON_ROOM={
 floor:{x:(b3.left+bEnd.right)/2,z:bWing.facadeZ-11.81,width:bEnd.right-b3.left,depth:bWing.bounds.depth},
 wall:{x:684.5,z:bEnd.near+1.13,width:25.6,depth:2.25},
};

export function t1BCommonCeiling(row:GateConcourse,z:number){
 return row.bounds.height-.57-.91*(z-buildingRectEdges(T1_B_COMMON_ROOM.floor).near)/T1_B_COMMON_ROOM.floor.depth;
}

export const T2_C1_WOOD_ROOM={
 floor:{x:c1.bridge.x+15.6,z:109.72,width:33.3,depth:13.3},
 benches:[
  {x:c1.bridge.x+9.0,z:113.2,width:4.9,depth:1.55},
  {x:c1.bridge.x+20.1,z:113.2,width:5.3,depth:1.55},
  {x:c1.bridge.x+23.8,z:104.42,width:6.0,depth:1.49},
 ],
 planters:[
  {x:c1.bridge.x+1.2,z:104.50,width:2.48,depth:2.26},
  {x:c1.bridge.x+7.8,z:106.0,width:1.92,depth:1.84},
  {x:c1.bridge.x+15.5,z:114.4,width:2.00,depth:1.75},
  {x:c1.bridge.x+24.8,z:114.2,width:2.25,depth:1.85},
  {x:c1.bridge.x+3.2,z:114.4,width:2.02,depth:1.94},
  {x:c1.bridge.x+29.8,z:104.43,width:2.73,depth:2.20},
 ],
 posts:[{x:c1.bridge.x+.24,z:103.54,width:.54,depth:.56},{x:c1.bridge.x+31.45,z:103.54,width:.54,depth:.56}],
};

export const SOUTH_DEPARTURE_DECKS={
 B:{floor:bDeck,stair:flight(bWing,bDeck,'B9'),ceiling:SOUTH_DEPARTURE_LEVEL+3.39,
  belts:[{x:b9.bridge.x+49.4,z:92.93,width:50.1,depth:2.72}]},
 C:{floor:cDeck,stair:flight(cWing,cDeck,'C1'),ceiling:SOUTH_DEPARTURE_LEVEL+3.67,
  belts:[{x:c1.bridge.x-37.4,z:97.26,width:47.7,depth:2.72},{x:-47.3,z:97.26,width:55.3,depth:2.72}]},
} as const;

export function southWalkwayRails(wing:SouthWing){
 return SOUTH_DEPARTURE_DECKS[wing].belts.flatMap(movingWalkwayRails);
}

export function southStairMeasures(wing:SouthWing){
 const rect=SOUTH_DEPARTURE_DECKS[wing].stair,steps=36;
 return {...rect,lower:CONCOURSE_LEVEL,upper:SOUTH_DEPARTURE_LEVEL,steps,tread:rect.width/steps,
  bottomX:rect.x-rect.width/2,topX:rect.x+rect.width/2};
}

export const SOUTH_STAIR_WALK_MARGIN=.32;

export function southLowerGateFurniture(row:GateConcourse,bay:GateConcourse['gates'][number]){
 if(row.wing==='D')return bay;
 const stair=SOUTH_DEPARTURE_DECKS[row.wing].stair,edges=buildingRectEdges(stair,.43);
 const clear=(rect:BuildingRect)=>{
  const footprint=buildingRectEdges(rect);
  return footprint.right<=edges.left-1.65||footprint.left>=edges.right||footprint.far<=edges.near||footprint.near>=edges.far;
 };
 return {...bay,banks:bay.banks.filter(clear),carpets:bay.carpets.filter(clear)};
}
