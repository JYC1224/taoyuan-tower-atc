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
const D_PUBLIC_DEPTH=42;
export const distanceInside=(row:Pick<GateConcourse,'facadeZ'|'side'>,depth:number)=>row.facadeZ-row.side*depth;
export const MOVING_WALKWAY_END_CLEARANCE=1.90;
export const movingWalkwayRailOffset=(belt:BuildingRect)=>belt.depth/2-.02;
export function movingWalkwayRails(belt:BuildingRect):BuildingRect[]{
 return [-1,1].map(side=>({
  x:belt.x,z:belt.z+side*movingWalkwayRailOffset(belt),width:belt.width-MOVING_WALKWAY_END_CLEARANCE,depth:.13,
 }));
}

// Envelope fits around the real stand centrelines in the game. Passenger
// spaces use regular gate modules sized for walking, queuing, and seating.
const shells=[
 {wing:'B',left:124,right:747,facadeZ:113.5,backZ:89.88,side:1,height:10.6},
 {wing:'C',left:-622,right:120,facadeZ:126.5,backZ:94.85,side:1,height:11.2},
 {wing:'D',left:-625,right:126,facadeZ:-249.5,backZ:-194.85,side:-1,height:11.2}
] as const;

function d10RestArea(row:Pick<GateConcourse,'facadeZ'|'side'>,gateX:number):BuildingRect{
 return {x:gateX-25.5,z:distanceInside(row,9.35),width:29,depth:15.6};
}

function gateConcourse(shell:typeof shells[number]):GateConcourse{
 const {wing,side,facadeZ,left,right,backZ,height}=shell;
 const bounds={x:(left+right)/2,z:(facadeZ+backZ)/2,width:right-left,depth:Math.abs(backZ-facadeZ),height};
 const loungeDepth=Math.min(wing==='D'?D_PUBLIC_DEPTH:26,bounds.depth);
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
  const bridge={x,z:facadeZ+side*4.05,floorY:CONCOURSE_LEVEL};
  if(gate.id==='D10'){
   const rest=d10RestArea(shell,x);
   const clearOfRest=(r:BuildingRect)=>Math.abs(r.x-rest.x)>(r.width+rest.width)/2||
    Math.abs(r.z-rest.z)>(r.depth+rest.depth)/2;
   return {gate,left:bayLeft,right:bayRight,bridge,desk,banks:banks.filter(clearOfRest),carpets:carpets.filter(clearOfRest)};
  }
  return {gate,left:bayLeft,right:bayRight,bridge,desk,banks,carpets};
 });
 const columns=lounges.slice(1).flatMap(({left:x})=>[4.7,17.25].map(depth=>({x,z:point(depth),width:.76,depth:.76})));
 return {wing,side,bounds,facadeZ,loungeDepth,gates:lounges,columns};
}

export const GATE_CONCOURSES=shells.map(gateConcourse);
export const GATE_CONCOURSE_INTERFACES=new Map(GATE_CONCOURSES.flatMap(row=>(
 row.gates.map(({gate,bridge})=>[gate.id,{bridge,concourseZ:row.bounds.z}] as const)
)));

/** T2 north-side departure spine. Depths are fitted from the public map and
 * D6/D7 and D10 photographs; stand and bridge coordinates come from the shell. */
function dPublicConcourse(row:GateConcourse){
 const b=row.bounds,left=b.x-b.width/2,right=b.x+b.width/2;
 const d=(depth:number)=>distanceInside(row,depth);
 const gate=(n:number)=>row.gates.find(bay=>bay.gate.id===`D${n}`)!;
 const diningX=(gate(6).bridge.x+gate(7).bridge.x)/2,rest=d10RestArea(row,gate(10).bridge.x),restX=rest.x;
 const aisle:BuildingRect={x:b.x,z:d(25),width:b.width-.4,depth:11.4};
 const skylight:BuildingRect={x:diningX,z:d(36.25),width:31.5,depth:9.3};
 const dining:BuildingRect={x:diningX,z:d(36.1),width:40,depth:10.15};
 const belts=[8,7,6].map(west=>{
  const start=gate(west).bridge.x+6.2,end=gate(west-1).bridge.x-6.2;
  return {x:(start+end)/2,z:d(24.5),width:end-start,depth:3.0};
 });
 const rails=belts.flatMap(movingWalkwayRails);
 const pillars=row.gates.slice(1).map(bay=>({x:bay.left,z:d(31.1),width:.86,depth:.88}));
 const restPillars=[-1,1].map(side=>({x:restX+side*(rest.width/2-.48),z:d(17.0),width:.84,depth:1.12}));
 const diningPillars=[-1,1].map(side=>({x:diningX+side*(dining.width/2-.48),z:d(31.34),width:.62,depth:.90}));
 const couches=[
  {x:restX-6,z:d(7.45),width:4.8,depth:1.18,color:'#a7a4a1'},
  {x:restX+3.6,z:d(7.5),width:6.25,depth:1.18,color:'#a7a4a1'},
  {x:restX-8.9,z:d(13.1),width:2.12,depth:1.36,color:'#e69521'},
  {x:restX-2.0,z:d(12.2),width:2.12,depth:1.36,color:'#3182b0'},
  {x:restX+5.5,z:d(13.15),width:2.12,depth:1.36,color:'#91a92e'},
  {x:restX+10.2,z:d(11.0),width:2.12,depth:1.36,color:'#d66c2d'},
 ];
 const diningDesk:BuildingRect={x:diningX-7.4,z:d(35.8),width:11.1,depth:3.55};
 const tables=[2.2,7.1,12.0,17.1].flatMap(x=>[33.35,38.35].map(depth=>({x:diningX+x,z:d(depth),width:1.12,depth:.76})));
 const ceiling=CONCOURSE_LEVEL+3.71,firstX=left+2.8,pitch=4.4;
 const downlights={
  axis:'x' as const,first:firstX,last:firstX+Math.floor((right-2.8-firstX)/pitch)*pitch,
  pitch,height:ceiling-.026,rows:[d(20.95),d(28.75)] as const,
 };
 return {aisle,skylight,dining,rest,belts,rails,pillars,restPillars,diningPillars,couches,diningDesk,tables,ceiling,downlights};
}

export const T2_D_PUBLIC_CONCOURSE=dPublicConcourse(GATE_CONCOURSES.find(row=>row.wing==='D')!);
