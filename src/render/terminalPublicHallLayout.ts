/**
 * Architectural fits to the T1 renovation plans/section published by Norihiko
 * Dan and Associates (2013). These are normalized scene dimensions, not a
 * survey: the long axis is Z, departures are on +X, arrivals on -X in the local terminal plan.
 * Keep main hall geometry, walking bounds and cameras on these same values.
 */
export const T1_PUBLIC_HALL = {
 checkInXRatio:.215,
 checkInSpanRatio:.69,
 checkInLength:43,
 checkInDepth:5.8,
 checkInBanks:6,
 stationsPerFace:16,
 stationSpacing:2.35,
 baggageXRatio:-.205,
 arrivalsXRatio:-.385,
 arrivalsWidthRatio:.13,
 thirdFloorWidthRatio:.72,
 supportBaseXRatio:.24,
 supportHeadXRatio:.31,
} as const;

export function t2CheckInPendantRows(x:number,z:number,roofHeight:number){
 return {axis:'z',first:z-75,last:z+75,pitch:50,height:roofHeight-7,rows:[x-51,x-34,x-17]} as const;
}

export function t1CheckInBanks(x:number,z:number,width:number,depth:number){
 const span=depth*T1_PUBLIC_HALL.checkInSpanRatio;
 return Array.from({length:T1_PUBLIC_HALL.checkInBanks},(_,index)=>({
  x:x+width*T1_PUBLIC_HALL.checkInXRatio,
  z:z+(index/(T1_PUBLIC_HALL.checkInBanks-1)-.5)*span,
  first:index*2+1,last:index*2+2,
 }));
}

export function t1SupportStations(z:number,depth:number){
 const spacing=depth*T1_PUBLIC_HALL.checkInSpanRatio/(T1_PUBLIC_HALL.checkInBanks-1);
 return Array.from({length:T1_PUBLIC_HALL.checkInBanks+1},(_,i)=>z+(i-T1_PUBLIC_HALL.checkInBanks/2)*spacing);
}

/** Continuous catenary-like section: high at the raked piers, low at the eaves. */
export function t1RoofHeight(localX:number,width:number,height:number){
 const x=Math.abs(localX),ridgeX=width*T1_PUBLIC_HALL.supportHeadXRatio,
  halfSpan=(width+24)/2,center=height*.9,ridge=height+3.7,eave=height*.31;
 if(x<=ridgeX)return center+(ridge-center)*Math.pow(x/ridgeX,2);
 const t=Math.min(1,(x-ridgeX)/(halfSpan-ridgeX));
 return eave+(ridge-eave)*Math.pow(1-t,2.15);
}

export function t1ArrivalHallBounds(x:number,z:number,width:number,depth:number){
 return {x:x+width*T1_PUBLIC_HALL.arrivalsXRatio,z,width:width*T1_PUBLIC_HALL.arrivalsWidthRatio,depth:depth*.92};
}

export function t1ArrivalPartitionPanels(x:number,z:number,width:number,depth:number){
 const hall=t1ArrivalHallBounds(x,z,width,depth),wallX=hall.x+hall.width/2,
  ends=[-depth*.455,-depth*.33-4,-depth*.33+4,-4,4,depth*.33-4,depth*.33+4,depth*.455];
 return Array.from({length:4},(_,i)=>({x:wallX,z:z+(ends[i*2]+ends[i*2+1])/2,width:.28,depth:ends[i*2+1]-ends[i*2]}));
}

export function t1ArrivalSeats(x:number,z:number,width:number,depth:number){
 const hall=t1ArrivalHallBounds(x,z,width,depth);
 return [-.4,-.23,0,.23,.4].map(offset=>({x:hall.x-hall.width*.27,z:z+offset*depth}));
}

/** Corner supports beneath the two compact upper suites; section-fit spacing. */
export function t1UpperServiceSupports(x:number,z:number,width:number,depth:number){
 const suiteX=x+width*.074,suiteWidth=width*.112,suiteDepth=depth*.071;
 return [-1,1].flatMap(end=>[-1,1].flatMap(side=>[-1,1].map(corner=>({
  x:suiteX+side*(suiteWidth/2-.55),z:z+end*depth*.17+corner*(suiteDepth/2-.55)
 }))));
}
