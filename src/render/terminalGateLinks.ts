import {terminals} from '../data/airport';
import {T2_FLOOR_LEVELS,T2_PASSENGER_SECTION,terminalBuildingBounds,buildingRectEdges} from './terminalBuildingLayout';
import {CONCOURSE_LEVEL,GATE_CONCOURSES,distanceInside} from './terminalConcourseLayout';
import {SOUTH_DEPARTURE_DECKS,SOUTH_DEPARTURE_LEVEL} from './terminalSouthPassageLayout';
import type {WalkSlope} from './terminalWalk';

const b=terminalBuildingBounds(terminals.find(t=>t.id==='T2')!,'T2');
const d=GATE_CONCOURSES.find(row=>row.wing==='D')!;
const cEntry=buildingRectEdges(SOUTH_DEPARTURE_DECKS.C.floor).near;
const dEntry=distanceInside(d,d.loungeDepth);

function link(wing:'C'|'D',width:number,lowerEnd:number,lowerFloor:number,upperEnd:number,wingEntrance:number){
 const side=wing==='C'?1:-1,facade=b.z+side*b.depth/2,center=b.x+T2_PASSENGER_SECTION.airsidePassageX;
 const upperFloor=T2_FLOOR_LEVELS[4],left=center-width/2,right=center+width/2,headroom=2.84;
 const slope:WalkSlope={axis:'z',center,width,lowerEnd,upperEnd,lowerFloor,upperFloor};
 const floorAt=(z:number)=>lowerFloor+(upperFloor-lowerFloor)*Math.max(0,Math.min(1,(z-lowerEnd)/(upperEnd-lowerEnd)));
 const insideEdge=facade-side*2.4,upperApproach={left,right,near:Math.min(upperEnd+side*.04,insideEdge),far:Math.max(upperEnd+side*.04,insideEdge)};
 return {side,slope,left,right,headroom,facade,wingEntrance,upperApproach,
  opening:{left,right,bottom:floorAt(facade)-.20,top:upperFloor+headroom},floorAt};
}

// The 3F passenger spine branches to C and D at opposite ends. The deck
// offsets are those of the existing scene, so the connections use an incline
// at C and a sheltered stair at D while retaining the boarding-bridge levels.
export const T2_GATE_LINKS={
 C:link('C',7.4,cEntry+11.4,SOUTH_DEPARTURE_LEVEL,b.z+b.depth/2+.24,cEntry),
 D:link('D',6.6,dEntry-3.8,CONCOURSE_LEVEL,b.z-b.depth/2+2.55,dEntry),
} as const;

export function t2GateLinkForSide(side:number){return side<0?T2_GATE_LINKS.D:T2_GATE_LINKS.C;}
