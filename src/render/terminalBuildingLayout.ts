import {t1ArrivalHallBounds,t1SupportStations} from './terminalPublicHallLayout';

/**
 * Shared terminal sections and passenger-space allocation.
 * Floor USE is established by the airport indoor map and airline passenger
 * guides. Elevations and rectangular boundaries are scene/section fits, NOT
 * surveyed airport dimensions. The roof envelope is deliberately independent
 * of the enclosed body: a road canopy must not become an occupied storey.
 */
export interface BuildingBounds {x:number;z:number;width:number;depth:number;height:number}
export interface BuildingRect {x:number;z:number;width:number;depth:number}
export interface DeckOpening extends BuildingRect {
 landing?:{edge:'near'|'far';x:number;width:number};
}
export const T1_FLOOR_LEVELS=[-5.51,0,5.44,10.94,14.64] as const;
export const T2_FLOOR_LEVELS=[-10.7,-5.2,.36,6.25,12.35,18.55,23.45] as const;
export const T2_ROOF_GRID={pitch:7.6,bottomOffset:1.8} as const;

export const TERMINAL_FLOOR_PROGRAM={
 T1:[
  {level:'B1',elevation:T1_FLOOR_LEVELS[0],use:'Ground transport / public services'},
  {level:'1F',elevation:T1_FLOOR_LEVELS[1],use:'Check-in / baggage reclaim / customs / public arrivals'},
  {level:'2F',elevation:T1_FLOOR_LEVELS[2],use:'Public galleries / services around hall voids'},
  {level:'3F',elevation:T1_FLOOR_LEVELS[3],use:'Departure processing / arrival immigration / A-B passenger links'},
  {level:'4F',elevation:T1_FLOOR_LEVELS[4],use:'Compact lounge / service spine'},
 ],
 T2:[
  {level:'B2',elevation:T2_FLOOR_LEVELS[0],use:'Airport MRT / public dining passage'},
  {level:'B1',elevation:T2_FLOOR_LEVELS[1],use:'Structural / service basement'},
  {level:'1F',elevation:T2_FLOOR_LEVELS[2],use:'Baggage reclaim / customs / public arrivals'},
  {level:'2F',elevation:T2_FLOOR_LEVELS[3],use:'Arrival immigration / transfer processing / public gallery'},
  {level:'3F',elevation:T2_FLOOR_LEVELS[4],use:'Check-in / security / departure immigration / airside passage'},
  {level:'4F',elevation:T2_FLOOR_LEVELS[5],use:'Atrium galleries / dining / east-side lounges'},
  {level:'5F',elevation:T2_FLOOR_LEVELS[6],use:'North / south visitor facilities and outdoor viewing decks'},
 ],
} as const;

/** Cross-axis fit from the official aligned map and the existing landside
 * road geometry. Retain the north/south expansion envelope and the old roof;
 * do not non-uniformly scale furniture, doors, people or aircraft stands. */
export function terminalBuildingBounds<T extends BuildingBounds>(b:T,profile:string):T{
 return profile==='T2'?{...b,width:Math.min(b.width,150)}:b;
}

export const T2_PASSENGER_SECTION={
 publicHall:{x:-51,z:0,width:44,depth:264},
 reclaim:{x:22,z:0,width:100,depth:162},
 customsExit:{x:-29,z:0,span:18.4,height:3.42},
 pickupCurb:{doorOffsets:[-8.2,8.2],doorWidth:6.6,doorHeight:3.28,walkDepth:6.4,walkLength:234},
 arrivalImmigration:{x:24,z:0,width:80,depth:184},
 checkInX:-34,
 departureSecurityX:3,
 departureImmigrationX:30,
 departureProcessingSpan:78,
 airsidePassageX:48,
 arrivalCeiling:T2_FLOOR_LEVELS[4]-.87,
 reclaimCeiling:T2_FLOOR_LEVELS[3]-.48,
 // The central pickup vista stays open. Upper circulation follows the
 // outer gallery and the solid end bays.
 publicVoids:[{x:-47.4,z:0,width:36.8,depth:226}],
 arrivalArt:{x:-49,z:-93,rotation:-Math.PI/2},
} as const;

export const placeBuildingRect=(b:Pick<BuildingBounds,'x'|'z'>,r:BuildingRect):BuildingRect=>({...r,x:b.x+r.x,z:b.z+r.z});
export const buildingRectEdges=(r:BuildingRect,margin=0)=>({left:r.x-r.width/2-margin,right:r.x+r.width/2+margin,near:r.z-r.depth/2-margin,far:r.z+r.depth/2+margin});

/** The roughly 19 m row pitch follows the 1F map scale. The north apron-side
 * belt is 8 A/B and the south apron-side belt is 7 A/B. */
export function t2BaggageBelts(b:Pick<BuildingBounds,'x'|'z'>){
 return [
  ...[33,35,36.5,36.5,36.5,38.5].map((width,i)=>({number:i+1,x:b.x+17.5,z:b.z+(i-2.5)*19,width,depth:8.8,radius:3.8})),
  ...[33,-33].map((z,i)=>({number:i+7,x:b.x+61,z:b.z+z,width:9,depth:53,radius:3.8})),
 ];
}

export interface TerminalCore {x:number;z:number;direction:1|-1;restricted?:boolean}
/** Both flights of a normal up/down pair share a geometric slope. Their
 * travel directions differ; their upper landings do not swap ends. */
export function t2VerticalCores(b:Pick<BuildingBounds,'x'|'z'>,fromIndex:number):TerminalCore[]{
 const pair=(x:number,z:number,restricted=false):TerminalCore[]=>[-1,1].map(side=>({x:b.x+x,z:b.z+side*z,direction:(-side) as 1|-1,restricted}));
 if(fromIndex===2)return [...pair(-69.35,22),...pair(7.8,69,true),...pair(51,21,true)];
 if(fromIndex===1)return pair(-47,122);
 if(fromIndex===0)return pair(-62,110);
 return pair(-64,116);
}

export function t2PublicArrivalVoids(b:Pick<BuildingBounds,'x'|'z'>):DeckOpening[]{
 return T2_PASSENGER_SECTION.publicVoids.map(r=>placeBuildingRect(b,r));
}

export function deckRailSpans(left:number,right:number,edge:'near'|'far',landing?:DeckOpening['landing']){
 const ranges=landing?.edge===edge?[[left,Math.min(right,landing.x-landing.width/2)],[Math.max(left,landing.x+landing.width/2),right]]:[[left,right]];
 return ranges.filter(([start,end])=>end-start>.06).map(([start,end])=>({left:start,right:end,x:(start+end)/2,width:end-start}));
}

export function t2LiftCores(b:Pick<BuildingBounds,'x'|'z'>){
 return [-1,1].map(side=>({x:b.x-66,z:b.z+side*135}));
}

/** Keep the west structural row in the public circulation band, outside the
 * check-in islands. A symmetric percentage grid cut through the counters. */
export function t2StructuralColumnCenters(centerX:number,centerZ:number,width:number,depth:number){
 const columns:{x:number;z:number}[]=[];
 for(const xRatio of [-58/150,.29])for(let z=centerZ-depth*.4;z<=centerZ+depth*.4;z+=27.5)columns.push({x:centerX+width*xRatio,z});
 return columns;
}

export const T2_ARRIVAL_SERVICE_BAND={wallXRatio:-7/15,nursingZ:118} as const;
export const T2_TRANSFER_AMENITIES={dx:60,dz:-100,width:14,depth:9} as const;

export function t2ArrivalArtFixtures(b:Pick<BuildingBounds,'x'|'z'>){
 const {x,z}=T2_PASSENGER_SECTION.arrivalArt;
 return [
  ...Array.from({length:5},(_,i)=>placeBuildingRect(b,{x,z:z+(i-2)*9,width:3.7,depth:3.8})),
  placeBuildingRect(b,{x,z:z-16.7,width:4.2,depth:5.8}),
  ...[-1,1].map(side=>placeBuildingRect(b,{x:x-1,z:z+side*34,width:3.2,depth:3.2})),
 ];
}

/** Openings in a FINISHED floor for the escalator flight arriving at it. */
export function t2EscalatorOpenings(b:Pick<BuildingBounds,'x'|'z'>,levelIndex:number):DeckOpening[]{
 if(levelIndex<1)return [];
 const rise=T2_FLOOR_LEVELS[levelIndex]-T2_FLOOR_LEVELS[levelIndex-1],run=rise/Math.tan(Math.PI/6);
 return t2VerticalCores(b,levelIndex-1).map(core=>({x:core.x,z:core.z,width:3.5,depth:run-.3,landing:{edge:core.direction>0?'far':'near',x:core.x,width:3.28}}));
}

/** Major fixed objects shared by the public hall renderer and walker. */
export function t2ArrivalHallFixtures(b:Pick<BuildingBounds,'x'|'z'>){
 const plaza=T2_PASSENGER_SECTION,exit={...plaza.customsExit,x:b.x+plaza.customsExit.x,z:b.z+plaza.customsExit.z};
 const lowBarriers=[{z:-69,depth:32},{z:0,depth:58},{z:69,depth:32}].map(r=>placeBuildingRect(b,{x:-41,width:.52,...r}));
 const edge=plaza.publicHall.depth/2,halfExit=exit.span/2;
 const partitionPanels=[[-edge,-halfExit],[halfExit,edge]].map(([near,far])=>placeBuildingRect(b,{x:plaza.customsExit.x,z:(near+far)/2,width:.7,depth:far-near}));
 const seats=[-63,66,98].map(z=>placeBuildingRect(b,{x:-53.2,z,width:7.2,depth:2.2}));
 const information=placeBuildingRect(b,{x:-55,z:38.4,width:6.3,depth:3.25});
 return {exit,lowBarriers,partitionPanels,seats,information};
}

export function t2CustomsBays(b:Pick<BuildingBounds,'x'|'z'>){
 return [-6.4,-1.45,1.45,6.4].map(z=>({...placeBuildingRect(b,{x:-18.5,z,width:3.6,depth:1.3}),declare:z<0}));
}

/** Two glazed door sets share the public road-side lobby. Render and walk
 * collision use the same gaps, including the centre pier. */
export function t2ArrivalFacade(b:Pick<BuildingBounds,'x'|'z'|'width'|'depth'>){
 const {doorOffsets,doorWidth,doorHeight,walkDepth,walkLength}=T2_PASSENGER_SECTION.pickupCurb;
 const x=b.x-b.width/2,doors=doorOffsets.map(offset=>({x,z:b.z+offset,width:.45,depth:doorWidth}));
 const edges=[b.z-b.depth/2,...doors.flatMap(d=>[d.z-d.depth/2,d.z+d.depth/2]),b.z+b.depth/2];
 const wall=Array.from({length:doors.length+1},(_,i)=>{
  const near=edges[i*2],far=edges[i*2+1];
  return {x,z:(near+far)/2,width:.52,depth:far-near};
 });
 return {doors,wall,doorHeight,walk:{x:x-walkDepth/2,z:b.z,width:walkDepth,depth:walkLength}};
}

export function t2ProcessingFootprints(b:Pick<BuildingBounds,'x'|'z'>){
 return {
  arrival:[-40,40].map(z=>placeBuildingRect(b,{x:25,z,width:24,depth:57})),
  departureSecurity:placeBuildingRect(b,{x:1,z:0,width:23,depth:T2_PASSENGER_SECTION.departureProcessingSpan}),
  departureImmigration:placeBuildingRect(b,{x:30,z:0,width:25,depth:T2_PASSENGER_SECTION.departureProcessingSpan}),
 };
}

/** Public height varies across T1's raked white arrivals ceiling. */
export function t1ArrivalCeilingHeight(x:number,hall:BuildingRect){
 const t=Math.max(0,Math.min(1,(x-(hall.x-hall.width/2))/hall.width));
 return 7.4+2.85*t;
}

export function t1ArrivalStructure(b:BuildingBounds){
 const hall=t1ArrivalHallBounds(b.x,b.z,b.width,b.depth),footX=hall.x-hall.width/2+2.8;
 const piers=t1SupportStations(b.z,b.depth).map(z=>({x:footX,z,width:.94,depth:1.18,headX:footX+2.7,top:t1ArrivalCeilingHeight(footX+2.7,hall)-.24}));
 const customs=[-b.depth*.33,0,b.depth*.33].flatMap(dz=>[-1,1].map(side=>({x:hall.x+hall.width/2+4.7,z:b.z+dz+side*2.55,width:3.25,depth:1.2,declare:side<0})));
 const railX=hall.x+1.65;
 const pickupRails=[-105,-42,42,105].map(dz=>({x:railX,z:b.z+dz,width:.17,depth:21}));
 const exitPier={x:hall.x+hall.width/2+.18,z:b.z,width:.84,depth:1.24};
 return {piers,customs,pickupRails,exitPier};
}
