import {T2_PASSENGER_SECTION,type BuildingBounds,type BuildingRect} from './terminalBuildingLayout';

const rowCenters=(count:number,spacing:number,center=0)=>Array.from({length:count},(_,i)=>center+(i-(count-1)/2)*spacing);
const footprint=(x:number,z:number,width:number,depth:number):BuildingRect=>({x,z,width,depth});

export function securityFixtures(width:number,count:number,x:number,z:number){
 const lanes=rowCenters(count,Math.min(5.5,width*.62/count),x);
 return {
  lanes,belts:lanes.map(x=>footprint(x,z+2,2.1,6.8)),scanners:lanes.map(x=>footprint(x+1.18,z+1.8,.45,1.8)),
  portals:lanes.flatMap(x=>[-1,1].map(side=>footprint(x+side*1.3,z-3.2,.15,.18))),
  queuePosts:lanes.flatMap(x=>rowCenters(4,1.5,z-9).map(z=>footprint(x,z,.11,.11))),
 };
}

export function passportFixtures(width:number,count:number,x:number,z:number,departing=false){
 const desks=rowCenters(count,Math.min(5.2,width*.62/count),x);
 return {
  desks:desks.map(x=>footprint(x,z,3.5,1.35)),windows:desks.map(x=>footprint(x,z+1.05,3.3,.1)),
  posts:desks.flatMap(x=>rowCenters(3,1.4,z+4).map(z=>footprint(x,z,.11,.11))),
  gates:Array.from({length:4},(_,i)=>footprint(x+width*.26+i*2.6,z+(departing?9.5:12),1.6,2.5)),
 };
}

export function passportQueue(width:number,x:number,z:number,departing=false){
 const spacing=departing?4.8:Math.min(5.55,width*.29/4),half=departing?spacing/2-.18:Math.min(2.25,(spacing-.42)/2);
 const near=z+(departing?-13:5.1),far=z+(departing?-5:12.6);
 const lanes=rowCenters(departing?10:8,spacing,x);
 const ends=lanes.flatMap(x=>[-1,1].flatMap(side=>[near,far].map(z=>footprint(x+side*half,z,.09,.09))));
 const rails=lanes.flatMap((x,i)=>[
  ...[-1,1].map(side=>footprint(x+side*half,(near+far)/2,.055,far-near-.23)),
  ...(i%2===1?(departing?[far]:[near,far]).map(z=>footprint(x,z,spacing-.35,.055)):[]),
 ]);
 return {ends,rails};
}

export const T2_CHECKPOINTS={
 security:{width:100,lanes:10},departure:{width:100,desks:12},arrival:{width:64,desks:8,rows:[-40,40]},
} as const;

export function t2DeparturePartitions(b:BuildingBounds){
 // Outside the checkpoint frontage the fixed glazing closes the landside
 // and airside shortcut. Its opening is centred on the inspection lanes.
 const {departureProcessingSpan,departureSecurityX,departureImmigrationX}=T2_PASSENGER_SECTION;
 const depth=(b.depth-2.4-departureProcessingSpan)/2;
 return [departureSecurityX-3.2,departureImmigrationX].flatMap(x=>[-1,1].map(side=>
  footprint(b.x+x,b.z+side*(departureProcessingSpan+depth)/2,.22,depth)));
}

export function t2CheckpointFixtures(b:BuildingBounds){
 const s=T2_CHECKPOINTS.security,p=T2_CHECKPOINTS.departure,a=T2_CHECKPOINTS.arrival;
 const world=(x:number,z:number,parts:BuildingRect[])=>parts.map(part=>
  footprint(b.x+x+part.z,b.z+z-part.x,part.depth,part.width));
 const security=securityFixtures(s.width,s.lanes,0,0),departure=passportFixtures(p.width,p.desks,0,0,true),
  departureQueue=passportQueue(p.width,0,0,true),arrival=passportFixtures(a.width,a.desks,0,0),arrivalQueue=passportQueue(a.width,0,0);
 return {
  departure:[...world(T2_PASSENGER_SECTION.departureSecurityX,0,[...security.belts,...security.scanners,...security.portals,...security.queuePosts]),
   ...world(T2_PASSENGER_SECTION.departureImmigrationX,0,[...Object.values(departure).flat(),...Object.values(departureQueue).flat()]),...t2DeparturePartitions(b)],
  arrival:a.rows.flatMap(z=>world(T2_PASSENGER_SECTION.arrivalImmigration.x,z,[...Object.values(arrival).flat(),...Object.values(arrivalQueue).flat()])),
 };
}
