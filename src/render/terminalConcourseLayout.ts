import {gates, type Gate} from '../data/airport';
import type {BuildingBounds, BuildingRect} from './terminalBuildingLayout';

type Wing = 'B' | 'C' | 'D';
type SeatBank = BuildingRect & {seats:number;pitch:number};
interface GateLounge {
 gate:Gate;
 left:number;
 right:number;
 bridge:{x:number;z:number;floorY:number};
 desk:BuildingRect;
 banks:SeatBank[];
 carpets:BuildingRect[];
}

export interface GateConcourse {
 wing:Wing;
 side:-1|1;
 bounds:BuildingBounds;
 facadeZ:number;
 loungeDepth:number;
 gates:GateLounge[];
 columns:BuildingRect[];
}

export const CONCOURSE_LEVEL=4.5;
export const CONCOURSE_DOOR_WIDTH=3.25;
export const CONCOURSE_AISLE_DEPTH=20.25;
export const distanceInside=(row:Pick<GateConcourse,'facadeZ'|'side'>,depth:number)=>row.facadeZ-row.side*depth;

// Envelope fits around the real stand centrelines in the game. Passenger
// spaces use regular gate modules sized for walking, queuing, and seating.
const shells=[
 {wing:'B',left:124,right:747,facadeZ:113.5,backZ:89.88,side:1,height:10.6},
 {wing:'C',left:-622,right:120,facadeZ:126.5,backZ:94.85,side:1,height:11.2},
 {wing:'D',left:-625,right:126,facadeZ:-249.5,backZ:-194.85,side:-1,height:11.2}
] as const;

function gateConcourse(shell:typeof shells[number]):GateConcourse{
 const {wing,side,facadeZ,left,right,backZ,height}=shell;
 const bounds={x:(left+right)/2,z:(facadeZ+backZ)/2,width:right-left,depth:Math.abs(backZ-facadeZ),height};
 const loungeDepth=Math.min(26,bounds.depth);
 const point=(depth:number)=>distanceInside(shell,depth);
 const stands=gates.filter(gate=>gate.id.startsWith(wing)&&gate.terminal!=='T3 North').sort((a,b)=>a.x-b.x);
 const lounges=stands.map((gate,i):GateLounge=>{
  const x=gate.x-side*18;
  const bayLeft=i===0?left:(gate.x+stands[i-1].x)/2-side*18;
  const bayRight=i===stands.length-1?right:(gate.x+stands[i+1].x)/2-side*18;
  const faceSide=x-bayLeft>bayRight-x?-1:1;
  const desk={x:x+faceSide*4.7,z:point(3.25),width:2.8,depth:1.15};
  const banks:SeatBank[]=[],carpets:BuildingRect[]=[];
  for(const direction of [-1,1]){
   const aisleEdge=x+direction*2.85,bayEdge=direction<0?bayLeft+1.65:bayRight-1.65;
   const available=direction*(bayEdge-aisleEdge),gap=2.1,pitch=.7,margin=.53;
   const count=Math.min(3,Math.max(1,Math.floor((available+gap-margin*2)/(6*pitch+gap))));
   const seats=Math.min(6,Math.floor((available-margin*2-(count-1)*gap)/(count*pitch)));
   if(seats<2)continue;
   const seatWidth=seats*pitch,clusterWidth=count*seatWidth+(count-1)*gap+margin*2;
   carpets.push({x:aisleEdge+direction*clusterWidth/2,z:point(12.75),width:clusterWidth,depth:11.25});
   for(let bank=0;bank<count;bank++)for(const depth of [8.6,11.35,14.1,16.85]){
    const offset=margin+seatWidth/2+bank*(seatWidth+gap);
    banks.push({x:aisleEdge+direction*offset,z:point(depth),width:seatWidth,depth:.79,seats,pitch});
   }
  }
  return {
   gate,left:bayLeft,right:bayRight,bridge:{x,z:facadeZ+side*4.05,floorY:CONCOURSE_LEVEL},desk,banks,carpets
  };
 });
 const columns=lounges.slice(1).flatMap(({left:x})=>[4.7,17.25].map(depth=>({x,z:point(depth),width:.76,depth:.76})));
 return {wing,side,bounds,facadeZ,loungeDepth,gates:lounges,columns};
}

export const GATE_CONCOURSES=shells.map(gateConcourse);
export const GATE_CONCOURSE_INTERFACES=new Map(GATE_CONCOURSES.flatMap(row=>(
 row.gates.map(({gate,bridge})=>[gate.id,{bridge,concourseZ:row.bounds.z}] as const)
)));
