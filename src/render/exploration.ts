import {gates,runways,terminals} from '../data/airport';
import {T1_PUBLIC_HALL,t1ArrivalHallBounds,t1ArrivalPartitionPanels,t1ArrivalSeats,t1CheckInBanks,t1SupportStations,t1UpperServiceSupports} from './terminalPublicHallLayout';
import {T1_BASEMENT_LAYOUT,T1_DEPARTURE_LANDMARK_LAYOUT,T1_FLOOR_LEVELS,T1_FIRST_FLOOR_SERVICES,T1_SECOND_FLOOR_LAYOUT,T1_THIRD_FLOOR_STORES,T1_THIRD_FLOOR_SERVICES,T1_FOURTH_FLOOR_LAYOUT,T1_FOURTH_FLOOR_LOUNGES,T2_ARRIVAL_WELCOME_LAYOUT,T2_BASEMENT_LAYOUT,T2_FLOOR_LEVELS,T2_FORMOSAN_CODE_LAYOUT,T2_FOURTH_FLOOR_LAYOUT,T2_FOURTH_FLOOR_LOUNGES,T2_FOURTH_FLOOR_SHOPS,T2_FOURTH_FLOOR_SERVICES,T2_OBSERVATION_DECK_LAYOUT,T2_TEMPLE_AVENUE_LAYOUT,T2_THIRD_FLOOR_LAYOUT,t1BasementShopCenter,t1FirstFloorServiceCenter,t1SecondFloorShopCenter,t1SecondFloorVoids,t1FourthFloorSuiteCenterX,t1FourthFloorSuiteCenters,t2BasementAisleX,t2BasementDiningCenters,t2BasementShopCenter,t2FourthFloorLoungeCenter,t2FourthFloorLoungeSeatCenters,t2FourthFloorShopCenter,t2StructuralColumnCenters,t2ThirdFloorCheckInBanks,t2ThirdFloorRetailUnits} from './terminalInteriorLayout';
import {T1_THIRD_FLOOR_CHECKIN_ZONES,T2_FOURTH_FLOOR_PUBLIC_FEATURES,t2FourthFloorDiningLayout} from './terminalInteriorLayout';
import {T1_A_PASSENGER,waitingRoom,t1LoungeObstacles,t1PassageObstacles,containsPassengerPoint} from './terminalPassengerLayout';
import {T2_PASSENGER_SECTION as T2_SECTION,T2_ARRIVAL_SERVICE_BAND,T2_TRANSFER_AMENITIES,terminalBuildingBounds,placeBuildingRect,buildingRectEdges,t2BaggageBelts,t2ArrivalFacade,t2ArrivalHallFixtures,t2ArrivalArtFixtures,t2ProcessingFootprints,t2EscalatorOpenings,t2LiftCores,t2CustomsBays,t2VerticalCores,t1ArrivalStructure} from './terminalBuildingLayout';
import {CONCOURSE_AISLE_DEPTH,CONCOURSE_LEVEL,GATE_CONCOURSES,distanceInside} from './terminalConcourseLayout';

export type ExploreSpotId=
 'runway'|'apron'|'t1-b1-west-bus'|'t1-b1-east-food'|'t1-b1-7eleven-north'|'t1-b1-7eleven-south'|'t1-b1-chatime'|'t1-b1-burger-king'|'t1-b1-han-zhan-ge'|'t1-b1-restroom'|'t1-b1-nursing'|'t1-arrivals'|'t1-arrival-services'|'t1-checkin'|'t1-upper-gallery'|'t1-transfer-security'|'t1-immigration'|'t1-departures'|'t1-2f-public-services'|'t1-2f-oli'|'t1-2f-taiwan-beer'|'t1-2f-hanlin'|'t1-2f-mos'|'t1-2f-kuo-yuan-ye'|'t1-2f-bistro-d'|'t1-3f-public-services'|'t1-3f-megabank'|'t1-3f-starbucks'|'t1-3f-oli'|'t1-3f-taiwan-goods'|'t1-3f-hanlin'|'t1-3f-kuo-yuan-ye'|'t1-3f-mos'|'t1-3f-vigor'|'t1-3f-indigenous-crafts'|'t1-lounge'|'t1-lounge-other'|'t1-a-gates'|'t1-b-gates'|
 't2-forecourt'|'t2-b2-corridor'|'t2-b2-mi-alone'|'t2-b2-le-pai-dui'|'t2-b2-fuhang'|'t2-b2-royal-heritage'|'t2-b2-songhe'|'t2-b2-xiaonanmen'|'t2-b2-restroom'|'t2-arrivals'|'t2-baggage'|'t2-arrival-services'|'t2-arrival-art'|'t2-baggage-art'|'t2-formosan-code'|'t2-transfer-services'|'t2-public-amenities'|'t2-4f-amenities'|'t2-transfer'|'t2-departures'|'t2-public-services'|'t2-passport'|'t2-security'|'t2-retail'|'t2-food'|'t2-shops'|'t2-shop-shishen-noodles'|'t2-shop-starbucks'|'t2-shop-baiba-fish'|'t2-shop-xiaonanmen'|'t2-shop-mos-burger'|'t2-shop-xingbo-coffee'|'t2-shop-shangshan-doujia'|typeof T2_FOURTH_FLOOR_SHOPS[number]['id']|'t2-lounge'|'t2-lounge-2'|'t2-lounge-3'|'t2-lounge-4'|'t2-lounge-5'|'t2-atrium'|'t2-north-amenities'|'t2-south-amenities'|'t2-north-deck'|'t2-south-deck'|'t2-temple-avenue'|'t2-c-gates'|'t2-d-gates'|
 't1-a-link'|'t1-a-shared'|'t1-a-mountains'|'t1-a-mountains-window'|'t1-3f-checkin-15'|'t1-3f-checkin-21'|'t2-arrival-gallery'|'t2-arrival-immigration'|'t2-arrival-customs'|'t2-arrival-curb'|'t3-gates'|'tower';
type Rect={left:number;right:number;near:number;far:number};
type Position={x:number;y:number;z:number};
export interface ExploreSpot {
 id:ExploreSpotId;en:string;zh:string;position:Position;target:Position;floor:number;bounds?:Rect;obstacles?:Rect[];walkAreas?:readonly Rect[];
}

const t1=terminals.find(t=>t.id==='T1')!,t2=terminalBuildingBounds(terminals.find(t=>t.id==='T2')!,'T2'),t3n=terminals.find(t=>t.id==='T3-N')!;
const t2ForecourtCenterX=t2.x-t2.width/2-16,t2ForecourtWalkX=t2.x-t2.width/2-4,t2ForecourtCenterZ=t2.z-70,t2ForecourtLength=t2.width*.58;
const north=runways.find(r=>r.id==='north')!,b5=gates.find(g=>g.id==='B5')!;
const inset=(x:number,z:number,width:number,depth:number,margin=1):Rect=>({left:x-width/2+margin,right:x+width/2-margin,near:z-depth/2+margin,far:z+depth/2-margin});
const expanded=(x:number,z:number,width:number,depth:number,margin=.65):Rect=>({left:x-width/2-margin,right:x+width/2+margin,near:z-depth/2-margin,far:z+depth/2+margin});
function inside(t:{x:number;z:number;width:number;depth:number},margin=2):Rect{return inset(t.x,t.z,t.width,t.depth,margin);}
function clearViewpoint(position:Position,target:Position,bounds:Rect,obstacles:Rect[]):Position{
 const clear=(x:number,z:number)=>x>bounds.left&&x<bounds.right&&z>bounds.near&&z<bounds.far&&!obstacles.some(r=>x>r.left&&x<r.right&&z>r.near&&z<r.far);
 if(clear(position.x,position.z))return position;
 // Prefer stepping back from a newly moved fixture. Retain the view target;
 // never discard a collision box merely to make a preset camera fit.
 const length=Math.hypot(position.x-target.x,position.z-target.z)||1,backX=(position.x-target.x)/length,backZ=(position.z-target.z)/length;
 const directions=[[backX,backZ],[-backZ,backX],[backZ,-backX],[-backX,-backZ],[1,0],[-1,0],[0,1],[0,-1],[.707,.707],[-.707,.707],[.707,-.707],[-.707,-.707]];
 for(let distance=.75;distance<=18;distance+=.75)for(const [dx,dz]of directions){
  const x=position.x+dx*distance,z=position.z+dz*distance;
  if(clear(x,z))return {...position,x,z};
 }
 return position;
}
function spot(id:ExploreSpotId,en:string,zh:string,floor:number,position:Position,target:Position,bounds:Rect,obstacles:Rect[]=[]):ExploreSpot{
 // The upper central deck ends before the low outer roof wings.
 const upperT1=id.startsWith('t1-')&&!id.startsWith('t1-a-')&&floor===T1_FLOOR_LEVELS[3],arrivalsT2=id.startsWith('t2-')&&floor===T2_FLOOR_LEVELS[2];
 const publicBounds=upperT1?inside({...t1,width:t1.width*T1_PUBLIC_HALL.thirdFloorWidthRatio}):arrivalsT2?t2ArrivalWalkBounds:bounds;
 const physicalObstacles=upperT1?[...obstacles,...t1UpperServiceSupports(t1.x,t1.z,t1.width,t1.depth).map(p=>expanded(p.x,p.z,.46,.46,.25))]:[...obstacles];
 if(id.startsWith('t2-')){
  const index=T2_FLOOR_LEVELS.findIndex(y=>y===floor);
  if(index>=0){
   if(index===2)physicalObstacles.push(...t2ArrivalFloorObstacles);
   physicalObstacles.push(...t2LiftCores(t2).map(p=>expanded(p.x,p.z,4.5,4.2,.3)));
   const holes=[...(index===3?T2_SECTION.publicVoids.map(r=>placeBuildingRect(t2,r)):[]),...t2EscalatorOpenings(t2,index)];
   physicalObstacles.push(...holes.map(r=>buildingRectEdges(r,.25)));
   if(index>=5)physicalObstacles.push(buildingRectEdges({x:t2.x+T2_FOURTH_FLOOR_LAYOUT.atrium.xOffset,z:t2.z+T2_FOURTH_FLOOR_LAYOUT.atrium.zOffset,width:T2_FOURTH_FLOOR_LAYOUT.atrium.width,depth:T2_FOURTH_FLOOR_LAYOUT.atrium.depth},.25));
   if(index===3)physicalObstacles.push(...t2ProcessingFootprints(t2).arrival.map(r=>buildingRectEdges(r,.4)),expanded(t2.x-18,t2.z,.18,184,.25));
  }
 }
 return {id,en,zh,floor,position:clearViewpoint({...position,y:floor+1.7},target,publicBounds,physicalObstacles),target,bounds:publicBounds,obstacles:physicalObstacles,walkAreas:arrivalsT2?t2ArrivalWalkAreas:undefined};
}
const t1Banks=t1CheckInBanks(t1.x,t1.z,t1.width,t1.depth),t1ArrivalBounds={...t1,...t1ArrivalHallBounds(t1.x,t1.z,t1.width,t1.depth)};
const t1LandmarkCenterX=t1.x+T1_DEPARTURE_LANDMARK_LAYOUT.xOffset,
 t1LandmarkCenterZ=t1.z+T1_DEPARTURE_LANDMARK_LAYOUT.checkInCenterOffset+t1.depth*T1_DEPARTURE_LANDMARK_LAYOUT.checkInSpanRatio*(T1_DEPARTURE_LANDMARK_LAYOUT.islandIndex/(T1_DEPARTURE_LANDMARK_LAYOUT.islandCount-1)-.5),
 t1DepartureLandmarkFeature=expanded(t1LandmarkCenterX,t1LandmarkCenterZ,T1_DEPARTURE_LANDMARK_LAYOUT.width,T1_DEPARTURE_LANDMARK_LAYOUT.depth,.7);
const t2CheckInLayout=T2_THIRD_FLOOR_LAYOUT.checkIn,t2CheckInStartZ=t2.z+t2CheckInLayout.centerZOffset,
 t2CheckInBanks=t2ThirdFloorCheckInBanks(t2.x,t2CheckInStartZ,t2.depth);
function columnsFor(t:{x:number;z:number;width:number;depth:number},profile?:'T1'|'T2'){
 const columns:Rect[]=[],spacingX=t.width>300?30:26,spacingZ=t.depth>180?34:22;
 if(profile){
  if(profile==='T1'){
   for(const side of [-1,1])for(const z of t1SupportStations(t.z,t.depth))columns.push(expanded(t.x+side*t.width*T1_PUBLIC_HALL.supportBaseXRatio,z,2.5,2.2));
   return columns;
  }
  return t2StructuralColumnCenters(t.x,t.z,t.width,t.depth).map(p=>expanded(p.x,p.z,1.7,1.7));
 }
 for(let x=t.x-t.width/2+spacingX/2;x<=t.x+t.width/2-spacingX/2;x+=spacingX)
  for(let z=t.z-t.depth/2+spacingZ/2;z<=t.z+t.depth/2-spacingZ/2;z+=spacingZ){
   const central=Math.abs(x-t.x)<t.width*.16;columns.push(expanded(x,z,central?1.15:.68,central?1.15:.68));
  }
 return columns;
}
const t1Columns=columnsFor(t1,'T1'),t2Columns=columnsFor(t2,'T2'),t1Checkin:Rect[]=[];
// The first-floor plan separates departures (+X) from arrivals (-X).
for(const bank of t1Banks)t1Checkin.push(expanded(bank.x,bank.z,T1_PUBLIC_HALL.checkInLength,6.7));
const t1ArrivalPartitions=t1ArrivalPartitionPanels(t1.x,t1.z,t1.width,t1.depth).map(p=>expanded(p.x,p.z,p.width,p.depth,.3));
const t1Baggage:Rect[]=[];for(let i=0;i<6;i++){const spacing=Math.min(32.5,t1.depth/(6+2.8)),zOffset=[-1.1,.65,-.25,.3,-.65,.8][i];t1Baggage.push(expanded(t1.x+t1.width*T1_PUBLIC_HALL.baggageXRatio,t1.z+(i-2.5)*spacing+zOffset,18.5,9.5));}
const t1FirstFloorServiceDesks=T1_FIRST_FLOOR_SERVICES.desks.map(service=>{const center=t1FirstFloorServiceCenter(t1ArrivalBounds.x,t1ArrivalBounds.z,t1ArrivalBounds.width,t1ArrivalBounds.depth,service.side,service.zRatio);return expanded(center.x,center.z,4.4,service.length,.65);}),
 t1FirstFloorAtms=T1_FIRST_FLOOR_SERVICES.atms.map(point=>expanded(t1ArrivalBounds.x+point.side*t1ArrivalBounds.width*.43,t1ArrivalBounds.z+t1ArrivalBounds.depth*point.zRatio,1.3,1.4)),
 t1FirstFloorAeds=T1_FIRST_FLOOR_SERVICES.aeds.map(point=>expanded(t1ArrivalBounds.x+point.side*t1ArrivalBounds.width*.4,t1ArrivalBounds.z+t1ArrivalBounds.depth*point.zRatio,1.2,1.2)),
 t1FirstFloorMeetingPoints=T1_FIRST_FLOOR_SERVICES.meetingPoints.map(point=>expanded(t1ArrivalBounds.x+point.side*t1ArrivalBounds.width*.2,t1ArrivalBounds.z+t1ArrivalBounds.depth*point.zRatio,2.8,1.6)),
 t1FirstFloorServiceFeatures=[...t1FirstFloorServiceDesks,...t1FirstFloorAtms,...t1FirstFloorAeds,...t1FirstFloorMeetingPoints];
const t1PublicFirstFloorObstacles=[...t1Columns,...t1Checkin,...t1Baggage,...t1FirstFloorServiceFeatures,...t1ArrivalPartitions,t1DepartureLandmarkFeature,
 ...t1ArrivalStructure(t1).piers.map(p=>expanded(p.x+.3,p.z,p.width+.6,p.depth,.22)),...t1ArrivalStructure(t1).customs.map(r=>buildingRectEdges(r,.35)),
 ...t1ArrivalStructure(t1).pickupRails.map(r=>buildingRectEdges(r,.3)),buildingRectEdges(t1ArrivalStructure(t1).exitPier,.3),
 ...t1ArrivalSeats(t1.x,t1.z,t1.width,t1.depth).map(p=>expanded(p.x,p.z,1.3,11.5,.35)),
 ...[-1,1].map(side=>expanded(t1ArrivalBounds.x+side*t1ArrivalBounds.width*.6*.36,t1.z-28,5.76,.7,.35))];
const t1B1ShopFeatures=T1_BASEMENT_LAYOUT.shops.map(shop=>{const center=t1BasementShopCenter(t1.x,t1.z,shop);return expanded(center.x,center.z,shop.depth,shop.length,.5);}),
 t1B1Bus=expanded(t1.x+T1_BASEMENT_LAYOUT.bus.dx,t1.z+T1_BASEMENT_LAYOUT.bus.dz,8,T1_BASEMENT_LAYOUT.bus.length,.6),
 t1B1Atms=T1_BASEMENT_LAYOUT.atms.map(point=>expanded(t1.x+point.dx,t1.z+point.dz,1.6,1.6)),
 t1B1Aeds=T1_BASEMENT_LAYOUT.aeds.map(point=>expanded(t1.x+point.dx,t1.z+point.dz,1.2,1.2)),
 t1B1Lifts=T1_BASEMENT_LAYOUT.lifts.map(point=>expanded(t1.x+point.dx,t1.z+point.dz,5.4,7.4)),
 t1B1RestroomCenter={x:t1.x+T1_BASEMENT_LAYOUT.restroom.dx,z:t1.z+T1_BASEMENT_LAYOUT.restroom.dz},
 t1B1NursingCenter={x:t1.x+T1_BASEMENT_LAYOUT.nursing.dx,z:t1.z+T1_BASEMENT_LAYOUT.nursing.dz},
 t1B1RestroomFeature=expanded(t1B1RestroomCenter.x,t1B1RestroomCenter.z,T1_BASEMENT_LAYOUT.restroom.depth,T1_BASEMENT_LAYOUT.restroom.width,.5),
 t1B1NursingFeature=expanded(t1B1NursingCenter.x,t1B1NursingCenter.z,T1_BASEMENT_LAYOUT.nursing.depth,T1_BASEMENT_LAYOUT.nursing.width,.5),
 t1B1Obstacles=[...t1Columns,...t1B1ShopFeatures,t1B1Bus,...t1B1Atms,...t1B1Aeds,...t1B1Lifts,t1B1RestroomFeature,t1B1NursingFeature];
const t1Planters:Rect[]=[];for(const side of [-1,1])for(const offset of [-100,-16,44,100])t1Planters.push(expanded(t1.x+side*t1.width*.36,t1.z+offset,2.8,1.7));
const t1ImmigrationCenter=t1.x-38,t1Immigration:Rect[]=[];for(let i=0;i<10;i++)t1Immigration.push(expanded(t1ImmigrationCenter+(i-4.5)*5.2,t1.z-84,3.5,2.8));
const t1ImmigrationQueue:Rect[]=[];for(let i=0;i<8;i++)t1ImmigrationQueue.push(expanded(t1ImmigrationCenter+(i-3.5)*5.55,t1.z-84+8.85,4.65,7.5));
const t1ArrivalArt=[expanded(t1.x,t1.z-t1.depth*.41,45,5.2)];
const t1TransferSecurity=[expanded(t1.x,t1.z+43,54,22)],t1UpperAtrium=t1SecondFloorVoids(t1.x,t1.z,t1.width,t1.depth).map(opening=>expanded(opening.x,opening.z,opening.width,opening.depth,.5));
const t1LoungeWidth=t1.width*T1_FOURTH_FLOOR_LAYOUT.widthRatio,t1LoungeDepth=t1.depth*T1_FOURTH_FLOOR_LAYOUT.depthRatio,t1LoungeSuiteDepth=t1.depth*T1_FOURTH_FLOOR_LAYOUT.suiteDepthRatio,t1LoungeCenters=t1FourthFloorSuiteCenters(t1.z,t1.depth),t1LoungeSuiteX=t1FourthFloorSuiteCenterX(t1.x,t1.width),t1LoungeSpineWidth=t1.width*T1_FOURTH_FLOOR_LAYOUT.spineWidthRatio,t1LoungeBoundsLeft=t1.x-t1LoungeSpineWidth/2,t1LoungeBoundsRight=t1LoungeSuiteX+t1LoungeWidth/2,t1LoungeBounds=inset((t1LoungeBoundsLeft+t1LoungeBoundsRight)/2,t1.z,t1LoungeBoundsRight-t1LoungeBoundsLeft,t1LoungeDepth,2);
const t1LoungeFurniture:Rect[]=[];
 for(const offset of [-.3,-.1,.1])for(const side of [-1,1]){
 const center=t1LoungeCenters[0],rowZ=center+t1LoungeSuiteDepth*offset,x=t1LoungeSuiteX+side*t1LoungeWidth*.235;
 // Blossom's high privacy bays occupy a wider U-shaped booth footprint.
 t1LoungeFurniture.push(expanded(x-side*.06,rowZ,4.25,2.98));
}
for(const xOffset of [-2.55,2.55])t1LoungeFurniture.push(expanded(t1LoungeSuiteX+xOffset-.55,t1LoungeCenters[0]+t1LoungeSuiteDepth*.29,3.35,3.25));
const jadeCenter=t1LoungeCenters[1],jadeBenchX=t1LoungeSuiteX+t1LoungeWidth*.31;
t1LoungeFurniture.push(expanded(jadeBenchX,jadeCenter,1.8,t1LoungeSuiteDepth*.68));
for(const offset of [-.27,-.09,.09,.27]){
 const rowZ=jadeCenter+t1LoungeSuiteDepth*offset,tableX=t1LoungeSuiteX+t1LoungeWidth*.105,chairX=tableX-1.1;
 t1LoungeFurniture.push(expanded(tableX,rowZ,1.8,1.7),expanded(chairX,rowZ,1.3,1.6));
}
t1LoungeFurniture.push(expanded(t1LoungeSuiteX-2.45,jadeCenter+t1LoungeSuiteDepth*.24,5.2,3.5));
const t1LoungeReception=t1LoungeCenters.map((center,suite)=>expanded(t1LoungeSuiteX-t1LoungeWidth/2+3.65,center+(suite===0?3.55:-3.55),2.1,suite===0?7.5:5.5));
const t1LoungeBuffets=t1LoungeCenters.map((center,suite)=>expanded(t1LoungeSuiteX+(suite===0?1:-1)*t1LoungeWidth*.42,center+t1LoungeSuiteDepth*.27,2.1,9));
const t1LoungePartitions:Rect[]=[];
const t1SecondFloorStores=T1_SECOND_FLOOR_LAYOUT.shops.map(store=>t1SecondFloorShopCenter(t1.x,t1.z,t1.width,t1.depth,store));
const t1SecondFloorShopFeatures=t1SecondFloorStores.map(store=>expanded(store.x,store.z,T1_SECOND_FLOOR_LAYOUT.shop.width,T1_SECOND_FLOOR_LAYOUT.shop.depth,.5));
const t1SecondFloorServiceZ=t1.z+t1.depth*T1_SECOND_FLOOR_LAYOUT.serviceRows.northZRatio,t1SecondFloorRoomZ=t1.z+t1.depth*T1_SECOND_FLOOR_LAYOUT.serviceRows.southZRatio,
 t1SecondFloorAeds=T1_SECOND_FLOOR_LAYOUT.aeds.map(point=>expanded(t1.x+point.xRatio*t1.width,t1.z+point.zRatio*t1.depth,1.2,1.2)),
 t1SecondFloorEscalators=T1_SECOND_FLOOR_LAYOUT.escalatorCores.zRatios.map(zRatio=>expanded(t1.x+T1_SECOND_FLOOR_LAYOUT.escalatorCores.xRatio*t1.width,t1.z+zRatio*t1.depth,T1_SECOND_FLOOR_LAYOUT.escalatorCores.width,T1_SECOND_FLOOR_LAYOUT.escalatorCores.depth,.5));
const t1SecondFloorServiceFeatures:Rect[]=[
 expanded(t1.x-42,t1SecondFloorServiceZ,11,6.4),expanded(t1.x-2,t1SecondFloorServiceZ,8.5,4.8),expanded(t1.x+43,t1SecondFloorServiceZ,16,7),
 expanded(t1.x-28,t1SecondFloorRoomZ,13,8),expanded(t1.x,t1SecondFloorRoomZ,13,8),expanded(t1.x+29,t1SecondFloorRoomZ,15,9),
 ...t1SecondFloorAeds,...t1SecondFloorEscalators
];


const t1SecondFloorFeatures=[...t1SecondFloorShopFeatures,...t1SecondFloorServiceFeatures];
const t1ThirdFloorShopFeatures=T1_THIRD_FLOOR_STORES.map(store=>expanded(t1.x+store.dx,t1.z+store.dz,store.width,store.depth,.5));
const t1ThirdFloorCheckInFeatures=T1_THIRD_FLOOR_CHECKIN_ZONES.map(zone=>expanded(t1.x+zone.dx,t1.z+zone.dz,zone.length,zone.depth,1));
const t1ThirdFloorServiceFeatures:Rect[]=[
 expanded(t1.x+T1_THIRD_FLOOR_SERVICES.atm.dx,t1.z+T1_THIRD_FLOOR_SERVICES.atm.dz,11,6.4),
 ...T1_THIRD_FLOOR_SERVICES.exchanges.map(point=>expanded(t1.x+point.dx,t1.z+point.dz,8.5,4.8)),
 ...T1_THIRD_FLOOR_SERVICES.banks.map(bank=>expanded(t1.x+bank.dx,t1.z+bank.dz,bank.length,7)),
 expanded(t1.x+t1.width*.15,t1.z-62,13,8),expanded(t1.x-t1.width*.37,t1.z-62,13,8),expanded(t1.x-t1.width*.19,t1.z+116,15,9),
 expanded(t1.x-67,t1.z-49,1.1,1.2),expanded(t1.x-65,t1.z+11,1.1,1.2),expanded(t1.x+46,t1.z+27,1.1,1.2)
];
const t1ThirdFloorFeatures=[...t1ThirdFloorShopFeatures,...t1ThirdFloorServiceFeatures,...t1ThirdFloorCheckInFeatures];
const t1SouthBank=T1_THIRD_FLOOR_SERVICES.banks[1];
const t2NorthFeatures=[expanded(t2.x-t2.width*.275,t2.z-t2.depth*.43,23,9),expanded(t2.x+t2.width*.235,t2.z-t2.depth*.43-1.4,22,11)];
const t2SouthFeatures=[expanded(t2.x+t2.width*.275,t2.z+t2.depth*.13,23,9),expanded(t2.x-t2.width*.245,t2.z+t2.depth*.13-2.1,24,7),expanded(t2.x-t2.width*.08,t2.z+t2.depth*.13+7,16,8)];
const t2Checkin:Rect[]=[];
// The paired counters and queue lanes follow the shared T2 3F bank layout.
for(const bank of t2CheckInBanks){
 t2Checkin.push(expanded(bank.x,bank.z,bank.rowWidth+1.4,t2CheckInLayout.islandDepth));
 for(const side of [-1,1])t2Checkin.push(expanded(bank.x,bank.z+side*(t2CheckInLayout.queueNearOffset+t2CheckInLayout.queueFarOffset)/2,bank.rowWidth+2,t2CheckInLayout.queueFarOffset-t2CheckInLayout.queueNearOffset));
}
const t2DepartureImmigration=[buildingRectEdges(t2ProcessingFootprints(t2).departureImmigration,.4)];
const t2DepartureSecurity=[buildingRectEdges(t2ProcessingFootprints(t2).departureSecurity,.4)];
const t2DepartureRetail=t2ThirdFloorRetailUnits(t2.x,t2.z,t2.width).map(unit=>expanded(unit.x,unit.z,unit.depth,unit.length));
const t2DepartureServices=T2_THIRD_FLOOR_LAYOUT.services.map(service=>expanded(t2.x+service.dx,t2.z+service.dz,service.depth,service.width));
const t2DepartureAeds=T2_THIRD_FLOOR_LAYOUT.aeds.map(point=>expanded(t2.x+point.dx,t2.z+point.dz,1.4,1.1));
const t2DepartureAtm=expanded(t2.x+T2_THIRD_FLOOR_LAYOUT.atm.wallDx+1.2,t2.z+T2_THIRD_FLOOR_LAYOUT.atm.dz,2.2,8),
 t2DepartureBanks=T2_THIRD_FLOOR_LAYOUT.bankServices.map(bank=>expanded(t2.x+bank.wallDx+2.8,t2.z+bank.dz,6,bank.length)),
 t2DepartureExchange=expanded(t2.x+T2_THIRD_FLOOR_LAYOUT.exchange.dx,t2.z+T2_THIRD_FLOOR_LAYOUT.exchange.dz,4.8,3.5),
 t2DepartureFeatures=[...t2DepartureRetail,...t2DepartureServices,...t2DepartureAeds,t2DepartureAtm,...t2DepartureBanks,t2DepartureExchange];
const t2Baggage=t2BaggageBelts(t2).map(b=>buildingRectEdges(b,.65));
const t2BaggageArtWallX=t2.x+t2.width/2-3.2,t2BaggageArtZ=t2.z-55,t2BaggageArtObstacle=expanded(t2BaggageArtWallX-.18,t2BaggageArtZ,1.5,13.8,1),
 t2FormosanArtZ=t2.z-T2_FORMOSAN_CODE_LAYOUT.centerZOffset,t2FormosanArtObstacle=expanded(t2BaggageArtWallX-.18,t2FormosanArtZ,T2_FORMOSAN_CODE_LAYOUT.depth+1,T2_FORMOSAN_CODE_LAYOUT.width+1,1);
const t2HallFixtures=t2ArrivalHallFixtures(t2),t2Curb=t2ArrivalFacade(t2),t2FacadeX=t2Curb.doors[0].x;
const t2CurbWalk={...buildingRectEdges(t2Curb.walk,-.47),right:t2FacadeX+.22};
const t2ArrivalWalkBounds={...inside(t2),left:t2CurbWalk.left};
const t2ArrivalWalkAreas=[{...inside(t2),left:t2FacadeX-.12},t2CurbWalk];
const t2ArrivalWallX=t2.x+t2.width*T2_ARRIVAL_SERVICE_BAND.wallXRatio,t2ArrivalCounterX=t2ArrivalWallX+3.05,t2ArrivalWestRoomX=t2ArrivalCounterX+6,t2ArrivalEastX=t2.x+t2.width*.39;
const t2ArrivalServices=[
 expanded(t2ArrivalCounterX,t2.z-132,8,11),expanded(t2ArrivalCounterX,t2.z-104,8,15),expanded(t2ArrivalCounterX,t2.z-76,8,13),
 expanded(t2ArrivalCounterX,t2.z+45,8,17),expanded(t2ArrivalCounterX,t2.z+63,8,13),
 expanded(t2ArrivalWallX+1.2,t2.z+82,3,9),expanded(t2ArrivalWestRoomX,t2.z+T2_ARRIVAL_SERVICE_BAND.nursingZ,11,14),
 expanded(t2ArrivalEastX,t2.z-125,10,15),expanded(t2ArrivalEastX,t2.z+125,10,15),
 expanded(t2ArrivalWallX+.2,t2.z-57,1.2,1.2),expanded(t2ArrivalWallX+.2,t2.z+27,1.2,1.2),expanded(t2ArrivalEastX-.2,t2.z+15,1.2,1.2)
];
const t2ArrivalArtCenterX=t2.x+T2_SECTION.arrivalArt.x,t2ArrivalArtZ=t2.z+T2_SECTION.arrivalArt.z,t2ArrivalArtObstacles=t2ArrivalArtFixtures(t2).map(r=>buildingRectEdges(r,.4));
const t2ArrivalWelcomeX=t2.x+T2_ARRIVAL_WELCOME_LAYOUT.centerXOffset,t2ArrivalWelcomeZ=t2.z+T2_ARRIVAL_WELCOME_LAYOUT.centerZOffset,
 t2ArrivalWelcomeObstacle=expanded(t2ArrivalWelcomeX,t2ArrivalWelcomeZ,T2_ARRIVAL_WELCOME_LAYOUT.width,T2_ARRIVAL_WELCOME_LAYOUT.depth+1,.5);
const t2ArrivalFloorObstacles=[...t2Columns,...t2Baggage,...t2ArrivalServices,...t2ArrivalArtObstacles,t2BaggageArtObstacle,t2FormosanArtObstacle,t2ArrivalWelcomeObstacle,
 ...[...t2HallFixtures.lowBarriers,...t2HallFixtures.partitionPanels,...t2HallFixtures.seats,t2HallFixtures.information,...t2Curb.wall,...t2CustomsBays(t2)].map(r=>buildingRectEdges(r,.36)),
 ...t2VerticalCores(t2,2).map(core=>expanded(core.x,core.z,3.5,10.6,.34)),
];
const t2TransferServices=[
 expanded(t2.x-t2.width*.31,t2.z-125,10,9),
 expanded(t2.x-t2.width*.19,t2.z-126.1,13,9)
];
const t2PublicAmenities=[expanded(t2.x+T2_TRANSFER_AMENITIES.dx,t2.z+T2_TRANSFER_AMENITIES.dz,T2_TRANSFER_AMENITIES.width,T2_TRANSFER_AMENITIES.depth)];
const t2TransferSecurity=[expanded(t2.x+24,t2.z+122,25,22)];
const t2FourthFloorShops=T2_FOURTH_FLOOR_SHOPS.map(shop=>{
 const center=t2FourthFloorShopCenter(t2.x,t2.z,t2.width,t2.depth,shop.side,shop.zRatio,shop.depth);
 return expanded(center.x,center.z,shop.depth,shop.length,.75);
});
const t2FourthFloorLounges=T2_FOURTH_FLOOR_LOUNGES.map(lounge=>{
 const center=t2FourthFloorLoungeCenter(t2.x,t2.z,t2.width,t2.depth,lounge.side,lounge.zRatio);
 return expanded(center.x,center.z,lounge.width??T2_FOURTH_FLOOR_LAYOUT.lounge.width,lounge.depth??T2_FOURTH_FLOOR_LAYOUT.lounge.depth,.65);
});
const t2FourthFloorFoodZ=t2.z+t2.depth*T2_FOURTH_FLOOR_LAYOUT.foodCourt.zRatio;
const t2FourthFloorDining=t2FourthFloorDiningLayout(t2.x,t2.z,t2.width,t2.depth).tables.map(p=>buildingRectEdges(p,.3));
const t2FourthFloorAtrium={x:t2.x+T2_FOURTH_FLOOR_LAYOUT.atrium.xOffset,z:t2.z+T2_FOURTH_FLOOR_LAYOUT.atrium.zOffset,width:T2_FOURTH_FLOOR_LAYOUT.atrium.width,depth:T2_FOURTH_FLOOR_LAYOUT.atrium.depth};
const t2FourthFloorGalleryFeatures=[...T2_FOURTH_FLOOR_PUBLIC_FEATURES.palms.map(p=>expanded(t2.x+p.dx,t2.z+p.dz,2.84,2.84)),expanded(t2.x+T2_FOURTH_FLOOR_PUBLIC_FEATURES.fountain.dx,t2.z+T2_FOURTH_FLOOR_PUBLIC_FEATURES.fountain.dz,6.8,6.8)];
const t2FourthFloorServiceFeatures=[
 expanded(t2.x+T2_FOURTH_FLOOR_SERVICES.restroom.dx,t2.z+T2_FOURTH_FLOOR_SERVICES.restroom.dz,T2_FOURTH_FLOOR_SERVICES.restroom.depth,T2_FOURTH_FLOOR_SERVICES.restroom.width,.5),
 ...T2_FOURTH_FLOOR_SERVICES.showers.map(room=>expanded(t2.x+room.dx,t2.z+room.dz,room.depth,room.width,.5)),
 ...T2_FOURTH_FLOOR_SERVICES.aeds.map(point=>expanded(t2.x+point.dx,t2.z+point.dz,1.4,1.1))
];
const t2FourthFloorObstacles=[...t2Columns,...t2FourthFloorShops,...t2FourthFloorLounges,...t2FourthFloorDining,...t2FourthFloorGalleryFeatures,...t2FourthFloorServiceFeatures];
const t2DeckSpan=t2.width*T2_OBSERVATION_DECK_LAYOUT.spanRatio,
 t2DeckBounds=(side:-1|1):Rect=>{
  const innerZ=t2.z+side*(t2.depth/2-10),outerZ=t2.z+side*(t2.depth/2+T2_OBSERVATION_DECK_LAYOUT.projection+2);
  return {left:t2.x-t2DeckSpan/2-1,right:t2.x+t2DeckSpan/2+1,near:Math.min(innerZ,outerZ),far:Math.max(innerZ,outerZ)};
 },
 t2NorthDeckBounds=t2DeckBounds(-1),t2SouthDeckBounds=t2DeckBounds(1),
 t2TempleCenterZ=t2.z+t2.depth*T2_TEMPLE_AVENUE_LAYOUT.centerZRatio,
 t2TempleDepth=t2.depth*T2_TEMPLE_AVENUE_LAYOUT.depthRatio,
 t2TempleSpan=t2.width*T2_TEMPLE_AVENUE_LAYOUT.facadeSpanRatio,
 t2TempleRowOffset=t2TempleDepth*T2_TEMPLE_AVENUE_LAYOUT.facadeOffsetRatio,
 t2TempleBounds:Rect={left:t2.x-t2.width*T2_TEMPLE_AVENUE_LAYOUT.widthRatio/2+2,right:t2.x+t2.width*T2_TEMPLE_AVENUE_LAYOUT.widthRatio/2-2,near:t2TempleCenterZ-t2TempleDepth/2+2,far:t2TempleCenterZ+t2TempleDepth/2-2},
 t2TempleFeatures=[-1,1].map(side=>expanded(t2.x,t2TempleCenterZ+side*t2TempleRowOffset,t2TempleSpan,1.4));
const t2B2AisleX=t2BasementAisleX(t2.x,t2.width),t2B2WestEdge=t2.x-(t2.width-3)/2,t2B2MrtLink=T2_BASEMENT_LAYOUT.mrtLink,
 t2B2WalkBounds:Rect={left:t2B2WestEdge-t2B2MrtLink.length-2,right:t2B2AisleX+44,near:t2.z-t2.depth/2+2,far:t2.z+t2.depth/2-2},
 t2B2ShopFeatures=T2_BASEMENT_LAYOUT.shops.map(shop=>{const center=t2BasementShopCenter(t2.x,t2.z,t2.width,shop);return expanded(center.x,center.z,shop.depth,shop.length,.45);}),
 t2B2Columns=t2StructuralColumnCenters(t2.x,t2.z,t2.width,t2.depth).map(point=>expanded(point.x,point.z,2.1,2.1)),
 t2B2Lifts=t2LiftCores(t2).map(p=>expanded(p.x,p.z,5.4,5.2)),
 t2B2Escalators=T2_BASEMENT_LAYOUT.escalators.map(bank=>expanded(t2.x+t2.width*bank.dx,t2.z+bank.zOffset,4.4,18)),
 t2B2Atm=expanded(t2.x+T2_BASEMENT_LAYOUT.atm.dx,t2.z+T2_BASEMENT_LAYOUT.atm.dz,1.8,1.4),
 t2B2Aeds=T2_BASEMENT_LAYOUT.aeds.map(point=>expanded(t2.x+point.dx,t2.z+point.dz,1.2,1.2)),
 t2B2RestroomCenter={x:t2.x+T2_BASEMENT_LAYOUT.restroom.dx,z:t2.z+T2_BASEMENT_LAYOUT.restroom.dz},
 t2B2RestroomFeature=expanded(t2B2RestroomCenter.x,t2B2RestroomCenter.z,T2_BASEMENT_LAYOUT.restroom.depth,T2_BASEMENT_LAYOUT.restroom.width,.5),
 t2B2RestroomBounds=inset(t2B2RestroomCenter.x-13,t2B2RestroomCenter.z,42,34,1),
 t2B2DiningFeatures=t2BasementDiningCenters(t2.x,t2.z,t2.width).map(center=>expanded(center.x,center.z,T2_BASEMENT_LAYOUT.dining.footprint.width,T2_BASEMENT_LAYOUT.dining.footprint.depth,.45)),
 t2B2Obstacles=[...t2B2Columns,...t2B2ShopFeatures,...t2B2DiningFeatures,...t2B2Lifts,...t2B2Escalators,t2B2Atm,...t2B2Aeds];
const t2Shop=T2_FOURTH_FLOOR_SHOPS.find(shop=>shop.id==='t2-shop-starbucks')!,t2ShopCenter=t2FourthFloorShopCenter(t2.x,t2.z,t2.width,t2.depth,t2Shop.side,t2Shop.zRatio,t2Shop.depth),t2ShopFrontAisleOffset=2.65;
const t2FourthFloorShopViewSpots=T2_FOURTH_FLOOR_SHOPS.map(shop=>{
 const center=t2FourthFloorShopCenter(t2.x,t2.z,t2.width,t2.depth,shop.side,shop.zRatio,shop.depth);
 return spot(shop.id,`Terminal 2 ${shop.name} · 4F`,`第二航廈${shop.name} · 4F`,18.55,
  // The map places each shop beside the lounge frontage; keep the camera in
  // the narrow public aisle instead of 12 m inward inside lounge seating.
  {x:center.frontX-shop.side*t2ShopFrontAisleOffset,y:20.25,z:center.z+Math.min(7,shop.length*.32)},
  {x:center.frontX+shop.side*.3,y:19.8,z:center.z},inside(t2),t2FourthFloorObstacles);
});
const t2B2ShopSpotIds:ExploreSpotId[]=['t2-b2-mi-alone','t2-b2-le-pai-dui','t2-b2-fuhang','t2-b2-royal-heritage','t2-b2-songhe','t2-b2-xiaonanmen'];
const t2B2ShopViewSpots:ExploreSpot[]=T2_BASEMENT_LAYOUT.shops.map((shop,index)=>{
 const center=t2BasementShopCenter(t2.x,t2.z,t2.width,shop),id=t2B2ShopSpotIds[index];
 return spot(id,`Terminal 2 ${shop.name} · B2`,`第二航廈 ${shop.name} · B2`,T2_FLOOR_LEVELS[0],
  {x:center.frontX-shop.side*7.25,y:T2_FLOOR_LEVELS[0]+1.68,z:center.z+shop.length*.26},
  {x:center.frontX+shop.side*.4,y:T2_FLOOR_LEVELS[0]+1.92,z:center.z},t2B2WalkBounds,t2B2Obstacles);
});
function t2LoungeFurnitureFor(index:number):Rect[]{
 const lounge=T2_FOURTH_FLOOR_LOUNGES[index],center=t2FourthFloorLoungeCenter(t2.x,t2.z,t2.width,t2.depth,lounge.side,lounge.zRatio),width=lounge.width??T2_FOURTH_FLOOR_LAYOUT.lounge.width,depth=lounge.depth??T2_FOURTH_FLOOR_LAYOUT.lounge.depth,frontX=center.x-lounge.side*(width/2-.2),receptionX=center.x+lounge.side*(width/2-5.4),receptionZ=center.z-depth*.32;
 return [
  expanded(receptionX,receptionZ,1.4,8.5),
  ...t2FourthFloorLoungeSeatCenters(center.x,center.z,lounge.side,depth).map(seat=>expanded(seat.x,seat.z,6.2,6.2)),
  ...Array.from({length:5},(_,row)=>expanded(center.x+lounge.side*9.6,center.z+(row-2)*3.35,2.2,1.5)),
  expanded(center.x+lounge.side*(width/2-.18),center.z,1,depth),
  ...[-1,1].map(end=>expanded(center.x,center.z+end*(depth/2-.16),width,1)),
  ...[-1,1].map(end=>expanded(frontX,center.z+end*depth*.34,.8,depth*.31))
 ];
}
const gateConcourseSpots=GATE_CONCOURSES.map(row=>{
 const {wing,bounds,loungeDepth}=row,t1=wing==='B',terminal=t1?1:2;
 const id=`t${terminal}-${wing.toLowerCase()}-gates` as 't1-b-gates'|'t2-c-gates'|'t2-d-gates';
 const gate=row.gates.find(g=>g.gate.id===`${wing}6`)!,x=gate.bridge.x;
 const obstacles=[...row.columns,...row.gates.flatMap(g=>[g.desk,...g.banks])].map(rect=>buildingRectEdges(rect,.38));
 return spot(id,`Terminal ${terminal} ${wing} gate concourse`,`${t1?'第一':'第二'}航廈 ${wing} 區登機廊廳`,CONCOURSE_LEVEL,
  {x:x-7,y:CONCOURSE_LEVEL+1.7,z:distanceInside(row,CONCOURSE_AISLE_DEPTH)},
  {x:x+2.5,y:CONCOURSE_LEVEL+2.2,z:distanceInside(row,1.6)},
  inset(bounds.x,distanceInside(row,loungeDepth/2),bounds.width,loungeDepth,.65),obstacles);
});
const northShops:Rect[]=[];
for(let i=0;i<3;i++){const span=t3n.width*.76,spacing=span/3;northShops.push(expanded(t3n.x-span/2+(i+.5)*spacing,t3n.z+6.6,15,5.2));}
const outdoorObstacles:Rect[]=[
 ...terminals.map(t=>{const b=terminalBuildingBounds(t,t.id);return expanded(b.x,b.z,b.width,b.depth);}),
 buildingRectEdges(T1_A_PASSENGER.bounds,.65),...GATE_CONCOURSES.map(row=>buildingRectEdges(row.bounds,.65)),
 expanded(5,-104,26,26)
];
const t2LoungeSpotIds:ExploreSpotId[]=['t2-lounge','t2-lounge-2','t2-lounge-3','t2-lounge-4','t2-lounge-5'];
const t2LoungeViewSpots=t2LoungeSpotIds.map((id,index)=>{
 const lounge=T2_FOURTH_FLOOR_LOUNGES[index],center=t2FourthFloorLoungeCenter(t2.x,t2.z,t2.width,t2.depth,lounge.side,lounge.zRatio),width=lounge.width??T2_FOURTH_FLOOR_LAYOUT.lounge.width,depth=lounge.depth??T2_FOURTH_FLOOR_LAYOUT.lounge.depth,frontX=center.x-lounge.side*(width/2-.2);
 return spot(id,`Terminal 2 ${lounge.operator} lounge · 4F`,`第二航廈${lounge.name} · 4F`,18.55,
  {x:frontX+lounge.side*2.8,y:20.25,z:center.z},
  {x:center.x+lounge.side*(width/2-1.7),y:19.55,z:center.z},
  inset(center.x,center.z,width,depth,1),
  [...t2Columns,...t2LoungeFurnitureFor(index)]);
});
const t1SecondFloorShopSpotInfo=[
 {id:'t1-2f-taiwan-beer',en:'Terminal 1 Taiwan Beer shop · 2F',zh:'第一航廈台灣菸酒 · 2F'},
 {id:'t1-2f-oli',en:'Terminal 1 OLI designer store · 2F',zh:'第一航廈 OLI 設計師商店 · 2F'},
 {id:'t1-2f-hanlin',en:'Terminal 1 Hanlin Tea · 2F',zh:'第一航廈翰林茶館 · 2F'},
 {id:'t1-2f-kuo-yuan-ye',en:'Terminal 1 Kuo Yuan Ye · 2F',zh:'第一航廈郭元益 · 2F'},
 {id:'t1-2f-mos',en:'Terminal 1 MOS Burger · 2F',zh:'第一航廈摩斯漢堡 · 2F'},
 {id:'t1-2f-bistro-d',en:'Terminal 1 Bistro:D · 2F',zh:'第一航廈畢卓樂地餐廳 · 2F'}
] as const;
const t1SecondFloorShopSpots:ExploreSpot[]=T1_SECOND_FLOOR_LAYOUT.shops.map((shop,index)=>{
 const info=t1SecondFloorShopSpotInfo[index],center=t1SecondFloorShopCenter(t1.x,t1.z,t1.width,t1.depth,shop),frontDirection=shop.rotationY===0?1:-1,frontZ=center.z+frontDirection*T1_SECOND_FLOOR_LAYOUT.shop.depth/2;
 return spot(info.id,info.en,info.zh,T1_FLOOR_LEVELS[2],
  {x:center.x,y:T1_FLOOR_LEVELS[2]+2.05,z:frontZ+frontDirection*4.4},
  {x:center.x,y:T1_FLOOR_LEVELS[2]+2.38,z:frontZ},inside(t1),[...t1Columns,...t1UpperAtrium,...t1SecondFloorFeatures]);
});
const t1ThirdFloorShopSpotInfo:Record<string,{id:ExploreSpotId;en:string;zh:string}>={
 starbucks:{id:'t1-3f-starbucks',en:'Terminal 1 Starbucks · 3F',zh:'第一航廈星巴克 · 3F'},
 oli:{id:'t1-3f-oli',en:'Terminal 1 OLI designer store · 3F',zh:'第一航廈 OLI 設計師商店 · 3F'},
 'taiwan-goods':{id:'t1-3f-taiwan-goods',en:'Terminal 1 Taiwan Specialty Goods · 3F',zh:'第一航廈台灣特色商品館 · 3F'},
 hanlin:{id:'t1-3f-hanlin',en:'Terminal 1 Hanlin Tea · 3F',zh:'第一航廈翰林茶館 · 3F'},
 'kuo-yuan-ye':{id:'t1-3f-kuo-yuan-ye',en:'Terminal 1 Kuo Yuan Ye · 3F',zh:'第一航廈郭元益 · 3F'},
 mos:{id:'t1-3f-mos',en:'Terminal 1 MOS Burger · 3F',zh:'第一航廈摩斯漢堡 · 3F'},
 vigor:{id:'t1-3f-vigor',en:'Terminal 1 Vigor Bakery · 3F',zh:'第一航廈維格餅家 · 3F'},
 'indigenous-crafts':{id:'t1-3f-indigenous-crafts',en:'Terminal 1 Taiwan Indigenous Crafts · 3F',zh:'第一航廈台灣原住民工藝品 · 3F'}
};
const t1ThirdFloorShopSpots:ExploreSpot[]=T1_THIRD_FLOOR_STORES.map(store=>{
 const info=t1ThirdFloorShopSpotInfo[store.id],centerX=t1.x+store.dx,centerZ=t1.z+store.dz,frontZ=centerZ+store.depth/2;
 return spot(info.id,info.en,info.zh,T1_FLOOR_LEVELS[3],
  {x:centerX,y:T1_FLOOR_LEVELS[3]+2.05,z:frontZ+5},
  {x:centerX,y:T1_FLOOR_LEVELS[3]+2.45,z:frontZ+1.4},inside(t1),[...t1Columns,...t1Planters,...t1ThirdFloorFeatures,...t1TransferSecurity]);
});
const t1ThirdFloorCheckInSpots:ExploreSpot[]=T1_THIRD_FLOOR_CHECKIN_ZONES.map((zone,index)=>{
 const x=t1.x+zone.dx,z=t1.z+zone.dz,side=index===0?1:-1,id=index===0?'t1-3f-checkin-15':'t1-3f-checkin-21';
 return spot(id,`Terminal 1 check-in counter ${zone.counter} · 3F`,`第一航廈 ${zone.counter} 號報到櫃台 · 3F`,T1_FLOOR_LEVELS[3],
  {x:x+side*zone.length*.72,y:T1_FLOOR_LEVELS[3]+2.05,z:z+zone.depth*.64},
  {x,y:T1_FLOOR_LEVELS[3]+2.45,z},inside(t1),[...t1Columns,...t1ThirdFloorFeatures,...t1TransferSecurity]);
});
const t1B1ShopSpotIds:ExploreSpotId[]=['t1-b1-7eleven-north','t1-b1-7eleven-south','t1-b1-chatime','t1-b1-burger-king','t1-b1-han-zhan-ge'];
const t1B1ShopViewSpots:ExploreSpot[]=T1_BASEMENT_LAYOUT.shops.map((shop,index)=>{
 const center=t1BasementShopCenter(t1.x,t1.z,shop),id=t1B1ShopSpotIds[index];
 return spot(id,`Terminal 1 ${shop.name} · B1`,`第一航廈 ${shop.name} · B1`,T1_FLOOR_LEVELS[0],
  {x:center.frontX+shop.side*13,y:T1_FLOOR_LEVELS[0]+1.62,z:center.z+shop.length*.18},
  {x:center.frontX+shop.side*.25,y:T1_FLOOR_LEVELS[0]+1.78,z:center.z},inside(t1),t1B1Obstacles);
});

/** Walkable interior waypoints follow the current public floor maps and gate rows. */
const aPassage=T1_A_PASSENGER.passage,aLink=T1_A_PASSENGER.link,
 aPassageBounds={left:aPassage.left,right:aPassage.right,near:aPassage.near,far:aLink.far},
 aPassageWalkAreas=[aPassage,aLink],aPassageFeatures=t1PassageObstacles(),
 a7=waitingRoom('A7'),a123=waitingRoom('A123');
function aPassageSpot(id:ExploreSpotId,en:string,zh:string,position:Position,target:Position):ExploreSpot{
 return {...spot(id,en,zh,T1_A_PASSENGER.passageFloor,position,target,aPassageBounds,aPassageFeatures),walkAreas:aPassageWalkAreas};
}

export const exploreSpots:ExploreSpot[]=[
 {id:'runway',en:'05L runway viewpoint',zh:'05L 跑道觀景點',floor:.2,position:{x:north.x-north.length/2+410,y:1.9,z:north.z+60},target:{x:north.x-north.length/2+50,y:8,z:north.z}},
 {id:'apron',en:'Terminal 1 apron',zh:'第一航廈機坪',floor:.2,position:{x:b5.x-60,y:1.9,z:b5.z+95},target:{x:b5.x,y:7,z:b5.z}},
 spot('t1-b1-west-bus','Terminal 1 B1 Da-You bus service','第一航廈 B1 大有巴士服務',T1_FLOOR_LEVELS[0],{x:t1.x-40,y:T1_FLOOR_LEVELS[0]+1.62,z:t1.z+15},{x:t1.x-65,y:T1_FLOOR_LEVELS[0]+1.76,z:t1.z+8},inside(t1),t1B1Obstacles),
 spot('t1-b1-east-food','Terminal 1 B1 dining passage','第一航廈 B1 餐飲服務通道',T1_FLOOR_LEVELS[0],{x:t1.x+42,y:T1_FLOOR_LEVELS[0]+1.62,z:t1.z-72},{x:t1.x+42,y:T1_FLOOR_LEVELS[0]+1.68,z:t1.z+52},inside(t1),t1B1Obstacles),
 ...t1B1ShopViewSpots,
 spot('t1-b1-restroom','Terminal 1 B1 public restroom','第一航廈 B1 公共廁所',T1_FLOOR_LEVELS[0],{x:t1B1RestroomCenter.x+T1_BASEMENT_LAYOUT.restroom.depth/2+6,y:T1_FLOOR_LEVELS[0]+1.7,z:t1B1RestroomCenter.z},{x:t1B1RestroomCenter.x+T1_BASEMENT_LAYOUT.restroom.depth/2-.4,y:T1_FLOOR_LEVELS[0]+1.88,z:t1B1RestroomCenter.z},inside(t1),[...t1Columns,t1B1RestroomFeature]),
 spot('t1-b1-nursing','Terminal 1 B1 nursing room','第一航廈 B1 哺乳室',T1_FLOOR_LEVELS[0],{x:t1B1NursingCenter.x-T1_BASEMENT_LAYOUT.nursing.depth/2-6,y:T1_FLOOR_LEVELS[0]+1.7,z:t1B1NursingCenter.z},{x:t1B1NursingCenter.x-T1_BASEMENT_LAYOUT.nursing.depth/2+.4,y:T1_FLOOR_LEVELS[0]+1.88,z:t1B1NursingCenter.z},inside(t1),[...t1Columns,t1B1NursingFeature]),
 spot('t1-arrivals','Terminal 1 arrivals · 1F','第一航廈入境大廳 · 1F',T1_FLOOR_LEVELS[1],{x:t1ArrivalBounds.x-6.8,y:1.7,z:t1.z+17},{x:t1ArrivalBounds.x+9.4,y:3.4,z:t1.z-1.6},inside(t1),t1PublicFirstFloorObstacles),
 spot('t1-arrival-services','Terminal 1 arrival services · 1F','第一航廈旅客服務、銀行與 ATM · 1F',T1_FLOOR_LEVELS[1],{x:t1ArrivalBounds.x,y:T1_FLOOR_LEVELS[1]+1.7,z:t1.z+46},{x:t1ArrivalBounds.x-12,y:T1_FLOOR_LEVELS[1]+2.19,z:t1.z+46},inside(t1),t1PublicFirstFloorObstacles),
 spot('t1-checkin','Terminal 1 check-in · 1F','第一航廈報到大廳 · 1F',T1_FLOOR_LEVELS[1],{x:t1.x+54,y:T1_FLOOR_LEVELS[1]+1.7,z:t1.z+76},{x:t1.x+29,y:T1_FLOOR_LEVELS[1]+3.1,z:t1.z+56},inside(t1),t1PublicFirstFloorObstacles),
 spot('t1-upper-gallery','Terminal 1 public retail gallery · 2F','第一航廈二樓中庭與商店通行廊 · 2F',T1_FLOOR_LEVELS[2],{x:t1.x+t1.width*T1_SECOND_FLOOR_LAYOUT.atrium.spineCenterXOffsetRatio,y:T1_FLOOR_LEVELS[2]+2.05,z:t1.z-42},{x:t1.x+t1.width*T1_SECOND_FLOOR_LAYOUT.atrium.spineCenterXOffsetRatio,y:T1_FLOOR_LEVELS[2]+2.3,z:t1.z+35},inside(t1),[...t1Columns,...t1UpperAtrium,...t1SecondFloorFeatures]),
 ...t1SecondFloorShopSpots,
 spot('t1-2f-public-services','Terminal 1 public services · ATM / FX / bank · 2F','第一航廈公共服務 · ATM／換匯／銀行 · 2F',T1_FLOOR_LEVELS[2],{x:t1.x,y:T1_FLOOR_LEVELS[2]+2.05,z:t1.z-t1.depth*.37},{x:t1.x,y:T1_FLOOR_LEVELS[2]+2.3,z:t1SecondFloorServiceZ+3.4},inside(t1),[...t1Columns,...t1UpperAtrium,...t1SecondFloorFeatures]),
 ...t1ThirdFloorShopSpots,...t1ThirdFloorCheckInSpots,
 spot('t1-3f-public-services','Terminal 1 public services · 3F','第一航廈公共服務與醫療中心 · 3F',T1_FLOOR_LEVELS[3],{x:t1.x-33,y:T1_FLOOR_LEVELS[3]+2.05,z:t1.z+130},{x:t1.x-33,y:T1_FLOOR_LEVELS[3]+2.45,z:t1.z+116},inside(t1),[...t1Columns,...t1Planters,...t1ThirdFloorFeatures]),
 spot('t1-3f-megabank','Terminal 1 Megabank and south exchange · 3F','第一航廈兆豐銀行與南端換匯服務 · 3F',T1_FLOOR_LEVELS[3],{x:t1.x+t1SouthBank.dx+13,y:T1_FLOOR_LEVELS[3]+2.05,z:t1.z+t1SouthBank.dz+6},{x:t1.x+t1SouthBank.dx,y:T1_FLOOR_LEVELS[3]+2.45,z:t1.z+t1SouthBank.dz},inside(t1),[...t1Columns,...t1Planters,...t1ThirdFloorFeatures]),
 spot('t1-transfer-security','Terminal 1 transfer-screening route concept · departure level','第一航廈轉機安檢路徑示意 · 出境層',T1_FLOOR_LEVELS[3],{x:t1.x-32,y:T1_FLOOR_LEVELS[3]+2.05,z:t1.z+25},{x:t1.x-3,y:T1_FLOOR_LEVELS[3]+2.25,z:t1.z+43},inside(t1),[...t1Columns,...t1Planters,...t1ThirdFloorFeatures,...t1TransferSecurity]),
 spot('t1-immigration','Terminal 1 arrival passport control · 3F','第一航廈入境證照查驗 · 3F',T1_FLOOR_LEVELS[3],{x:t1.x-24,y:T1_FLOOR_LEVELS[3]+2.05,z:t1.z-68},{x:t1.x-5,y:T1_FLOOR_LEVELS[3]+2.55,z:t1.z-84},inside(t1),[...t1Columns,...t1Immigration,...t1ImmigrationQueue,...t1ArrivalArt,...t1ThirdFloorFeatures]),
 spot('t1-departures','Terminal 1 departures & retail hall · 3F','第一航廈出境與商業大廳 · 3F',T1_FLOOR_LEVELS[3],{x:t1.x+38,y:T1_FLOOR_LEVELS[3]+2.05,z:t1.z+29},{x:t1.x+7,y:T1_FLOOR_LEVELS[3]+2.45,z:t1.z+43},inside(t1),[...t1Columns,...t1Planters,...t1ThirdFloorFeatures,...t1TransferSecurity]),
 // Look across the Zone C dining bay so the long banquette, timber fins and
 // independent quiet-seat nook can be read together from a clear aisle.
 spot('t1-lounge',`Terminal 1 Plaza Premium Lounge ${T1_FOURTH_FLOOR_LOUNGES[1].nameEn} · Zone ${T1_FOURTH_FLOOR_LOUNGES[1].zone}`,`第一航廈${T1_FOURTH_FLOOR_LOUNGES[1].nameZh}・4F`,T1_FLOOR_LEVELS[4],{x:t1LoungeSuiteX-t1LoungeWidth*.17,y:T1_FLOOR_LEVELS[4]+1.65,z:t1LoungeCenters[1]-1.8},{x:t1LoungeSuiteX+t1LoungeWidth*.34,y:T1_FLOOR_LEVELS[4]+1.45,z:t1LoungeCenters[1]+.4},t1LoungeBounds,[...t1LoungeFurniture,...t1LoungeReception,...t1LoungeBuffets,...t1LoungePartitions]),
 spot('t1-lounge-other',`Terminal 1 Plaza Premium Lounge ${T1_FOURTH_FLOOR_LOUNGES[0].nameEn} · Zone ${T1_FOURTH_FLOOR_LOUNGES[0].zone}`,`第一航廈${T1_FOURTH_FLOOR_LOUNGES[0].nameZh}・4F`,T1_FLOOR_LEVELS[4],{x:t1LoungeSuiteX,y:T1_FLOOR_LEVELS[4]+1.65,z:t1LoungeCenters[0]+7.9},{x:t1LoungeSuiteX,y:T1_FLOOR_LEVELS[4]+.85,z:t1LoungeCenters[0]-5.2},t1LoungeBounds,[...t1LoungeFurniture,...t1LoungeReception,...t1LoungeBuffets,...t1LoungePartitions]),
 aPassageSpot('t1-a-gates','Terminal 1 A departure passage · upper level','第一航廈 A 區出境通行廊 · 上層',{x:477,y:12.64,z:-192.5},{x:390,y:12.85,z:-192.5}),
 aPassageSpot('t1-a-link','Terminal 1 departure-to-A connection · 3F','第一航廈出境至 A 區連接廊 · 3F',{x:440,y:12.64,z:-183.5},{x:440,y:12.9,z:-195}),
 spot('t1-a-shared','Terminal 1 A1–A3 shared waiting room','第一航廈 A1–A3 共用候機室',T1_A_PASSENGER.loungeFloor,{x:a123.x-19,y:7.14,z:-223.5},{x:a123.x,y:10.3,z:-203},inset(a123.x,(a123.bounds.near+a123.bounds.far)/2,a123.width,a123.bounds.far-a123.bounds.near,.6),t1LoungeObstacles(a123)),
 spot('t1-a-mountains','Terminal 1 A7 waiting room · structure & ceiling','第一航廈 A7 候機室 · 挑高與天花',T1_A_PASSENGER.loungeFloor,{x:a7.x+16,y:7.14,z:-223.5},{x:a7.x,y:10.75,z:-199.8},inset(a7.x,(a7.bounds.near+a7.bounds.far)/2,a7.width,a7.bounds.far-a7.bounds.near,.6),t1LoungeObstacles(a7)),
 spot('t1-a-mountains-window','Terminal 1 A7 waiting room · apron-facing view','第一航廈 A7 候機室 · 面向機坪',T1_A_PASSENGER.loungeFloor,{x:a7.x+13,y:7.14,z:-203.5},{x:a7.x+3,y:7.7,z:-226},inset(a7.x,(a7.bounds.near+a7.bounds.far)/2,a7.width,a7.bounds.far-a7.bounds.near,.6),t1LoungeObstacles(a7)),
 ...gateConcourseSpots,
 spot('t2-arrivals','Terminal 2 public arrival hall · 1F','第二航廈挑高接機大廳 · 1F',.36,{x:t2.x-31.9,y:2.06,z:t2.z+3.8},{x:t2.x-65,y:3.15,z:t2.z+1.6},inside(t2)),
 spot('t2-arrival-curb','Terminal 2 arrivals curb and doors · 1F','第二航廈接機大廳外・乘車廊 · 1F',.36,{x:t2FacadeX-4.6,y:2.06,z:t2.z+18.4},{x:t2FacadeX+.9,y:2.55,z:t2.z-2},t2ArrivalWalkBounds),
 spot('t2-arrival-gallery','Terminal 2 arrival-hall gallery · 2F','第二航廈接機大廳上層廊道 · 2F',6.25,{x:t2.x-67,y:7.95,z:t2.z-35},{x:t2.x-42,y:2.6,z:t2.z-8},inside(t2),t2Columns),
 spot('t2-arrival-immigration','Terminal 2 arrival passport control · 2F','第二航廈入境證照查驗 · 2F',6.25,{x:t2.x+57,y:7.95,z:t2.z-4},{x:t2.x+24,y:8.5,z:t2.z-35},inside(t2),[...t2Columns,...t2TransferServices,...t2PublicAmenities,...t2TransferSecurity]),
 spot('t2-arrival-customs','Terminal 2 reclaim-to-customs exit · 1F','第二航廈領行李至海關出口 · 1F',.36,{x:t2.x-9.8,y:2.06,z:t2.z+4.05},{x:t2HallFixtures.exit.x,y:2.95,z:t2.z+2.8},inside(t2)),
 spot('t2-baggage','Terminal 2 baggage claim · belts 1–8 · 1F','第二航廈行李提領 · 1–8 號轉盤 · 1F',.36,{x:t2.x-7.8,y:2.06,z:t2.z-35.25},{x:t2.x+16,y:2.64,z:t2.z+1.5},inside(t2)),
 spot('t2-arrival-services','Terminal 2 arrival services · 1F','第二航廈入境服務帶 · 1F',.36,{x:t2.x-33.7,y:2.06,z:t2.z+24},{x:t2.x-40,y:3.05,z:t2.z-55},inside(t2)),
 spot('t2-arrival-art','Terminal 2 Welcome to Taiwan public art · 1F','第二航廈北會面點與入境公共藝術 · 1F',.36,{x:t2ArrivalArtCenterX+11,y:2.06,z:t2ArrivalArtZ+11},{x:t2ArrivalArtCenterX-6,y:2.75,z:t2ArrivalArtZ-3.5},inside(t2)),
 spot('t2-baggage-art','Terminal 2 Wealthy Island Wan Wan Lai · 1F','第二航廈寶島旺旺徠彩繪玻璃 · 1F',.36,{x:t2BaggageArtWallX-4.45,y:2.06,z:t2BaggageArtZ+17},{x:t2BaggageArtWallX-.4,y:2.35,z:t2BaggageArtZ},inside(t2)),
 spot('t2-formosan-code','Terminal 2 Formosan Code Uncovered · 1F','第二航廈發現臺灣密碼公共藝術 · 1F',.36,{x:t2BaggageArtWallX-4.45,y:2.06,z:t2FormosanArtZ+9},{x:t2BaggageArtWallX-.4,y:2.35,z:t2FormosanArtZ},inside(t2)),
 spot('t2-forecourt','Terminal 2 coach drop-off canopy','第二航廈接駁車下客雨棚',.2,
  {x:t2ForecourtWalkX,y:2.06,z:t2ForecourtCenterZ},
  {x:t2ForecourtWalkX,y:3.2,z:t2ForecourtCenterZ-34},
  {left:t2ForecourtCenterX-20,right:t2.x-t2.width/2-2,near:t2ForecourtCenterZ-t2ForecourtLength/2-5,far:t2ForecourtCenterZ+t2ForecourtLength/2+5}),
 spot('t2-b2-corridor','Terminal 2 B2 MRT and dining passage','第二航廈 B2 機場捷運連通與餐飲走廊',T2_FLOOR_LEVELS[0],
  {x:t2B2AisleX,y:T2_FLOOR_LEVELS[0]+1.7,z:t2.z+31},
  {x:t2B2AisleX+1.5,y:T2_FLOOR_LEVELS[0]+2.35,z:t2.z+101},t2B2WalkBounds,t2B2Obstacles),
 ...t2B2ShopViewSpots,
 spot('t2-b2-restroom','Terminal 2 B2 public restroom','第二航廈 B2 公共廁所',T2_FLOOR_LEVELS[0],
  {x:t2B2RestroomCenter.x-T2_BASEMENT_LAYOUT.restroom.depth/2-4.5,y:T2_FLOOR_LEVELS[0]+1.7,z:t2B2RestroomCenter.z},
  {x:t2B2RestroomCenter.x-T2_BASEMENT_LAYOUT.restroom.depth/2,y:T2_FLOOR_LEVELS[0]+1.2,z:t2B2RestroomCenter.z},t2B2RestroomBounds,[...t2B2Columns,t2B2RestroomFeature]),
  spot('t2-transfer-services','Terminal 2 iTravel & public services · 2F','第二航廈 iTravel 與公共服務 · 2F',6.25,{x:t2.x-42,y:7.95,z:t2.z-110},{x:t2.x-t2.width*.31,y:8.2,z:t2.z-125},inside(t2),[...t2Columns,...t2TransferServices]),
  spot('t2-public-amenities','Terminal 2 restrooms & AED · 2F','第二航廈廁所與 AED · 2F',6.25,{x:t2.x+58,y:7.95,z:t2.z-84},{x:t2.x+T2_TRANSFER_AMENITIES.dx,y:8.2,z:t2.z+T2_TRANSFER_AMENITIES.dz},inside(t2),[...t2Columns,...t2PublicAmenities]),
  spot('t2-transfer','Terminal 2 transfer security · 2F','第二航廈轉機安檢 · 2F',6.25,{x:t2.x+24,y:7.95,z:t2.z+102},{x:t2.x+24,y:8.2,z:t2.z+122},inside(t2),[...t2Columns,...t2TransferSecurity]),
 spot('t2-departures','Terminal 2 check-in & departures · 3F','第二航廈報到與出境大廳 · 3F',12.35,{x:t2.x-55,y:14.05,z:t2CheckInStartZ+27},{x:t2.x-34,y:15.2,z:t2CheckInStartZ+15},inside(t2),[...t2Columns,...t2Checkin,...t2DepartureImmigration,...t2DepartureSecurity,...t2DepartureFeatures]),
 spot('t2-public-services','Terminal 2 departure public services · 3F','第二航廈出境公共服務 · 3F',12.35,{x:t2.x-58,y:14.05,z:t2.z-50},{x:t2.x-67,y:13.55,z:t2.z-66},inside(t2),[...t2Columns,...t2Checkin,...t2DepartureImmigration,...t2DepartureSecurity,...t2DepartureFeatures]),
 spot('t2-passport','Terminal 2 departure immigration · 3F','第二航廈出境證照查驗 · 3F',12.35,{x:t2.x+45,y:14.05,z:t2.z-46},{x:t2.x+30,y:14.3,z:t2.z-20},inside(t2),[...t2Columns,...t2Checkin,...t2DepartureImmigration,...t2DepartureSecurity,...t2DepartureFeatures]),
 spot('t2-security','Terminal 2 departure security · 3F','第二航廈出境安檢 · 3F',12.35,{x:t2.x-13,y:14.05,z:t2.z-43},{x:t2.x+3,y:14.3,z:t2.z-15},inside(t2),[...t2Columns,...t2Checkin,...t2DepartureImmigration,...t2DepartureSecurity,...t2DepartureFeatures]),
 spot('t2-retail','Terminal 2 airside retail · 3F','第二航廈免稅商店與候機服務 · 3F',12.35,
  {x:t2.x+t2.width*T2_THIRD_FLOOR_LAYOUT.retail.frontOffsetRatio-6,y:14.05,z:t2.z+T2_THIRD_FLOOR_LAYOUT.retail.centerZOffset},
  {x:t2.x+t2.width*T2_THIRD_FLOOR_LAYOUT.retail.frontOffsetRatio,y:13.75,z:t2.z+T2_THIRD_FLOOR_LAYOUT.retail.centerZOffset},inside(t2),[...t2Columns,...t2DepartureFeatures]),
 spot('t2-food','Terminal 2 dining hall · 4F','第二航廈餐飲與候機區 · 4F',18.55,{x:t2.x-30,y:20.25,z:t2FourthFloorFoodZ-17},{x:t2.x-30,y:19.4,z:t2FourthFloorFoodZ+3},inside(t2),t2FourthFloorObstacles),
 spot('t2-shops','Terminal 2 4F mapped restaurants','第二航廈 4F 商店與餐飲 · 4F',18.55,{x:t2ShopCenter.frontX-t2Shop.side*t2ShopFrontAisleOffset,y:20.25,z:t2ShopCenter.z+6},{x:t2ShopCenter.frontX+t2Shop.side*.3,y:19.8,z:t2ShopCenter.z},inside(t2),t2FourthFloorObstacles),
 ...t2FourthFloorShopViewSpots,
 spot('t2-4f-amenities','Terminal 2 restrooms, showers & AED · 4F','第二航廈廁所、淋浴室與 AED · 4F',18.55,{x:t2.x+50,y:20.25,z:t2.z-123},{x:t2.x+50,y:19.8,z:t2.z-135},inside(t2),[...t2Columns,...t2FourthFloorServiceFeatures]),
 ...t2LoungeViewSpots,
 spot('t2-atrium','Terminal 2 atrium gallery · 4F','第二航廈中庭觀景廊 · 4F',18.55,{x:t2.x-60.25,y:20.25,z:t2.z-40},{x:t2.x-30,y:15.5,z:t2.z-31},inside(t2),t2Columns),
 spot('t2-north-amenities','Terminal 2 north deck services · 5F','第二航廈北側商店與候機服務 · 5F',23.45,{x:t2.x-t2.width*.275,y:25.15,z:t2.z-t2.depth*.36},{x:t2.x-t2.width*.275,y:25.45,z:t2.z-t2.depth*.43+4.2},inside(t2),[...t2Columns,...t2NorthFeatures]),
 spot('t2-south-amenities','Terminal 2 south deck services · 5F','第二航廈南側商店與休息服務 · 5F',23.45,{x:t2.x+t2.width*.275,y:25.15,z:t2.z+t2.depth*.13-24},{x:t2.x+t2.width*.275,y:25.45,z:t2.z+t2.depth*.13-4.2},inside(t2),[...t2Columns,...t2SouthFeatures]),
 spot('t2-north-deck','Terminal 2 north outdoor observation deck · 5F','第二航廈北側戶外觀景台 · 5F',23.45,{x:t2.x-28,y:25.15,z:t2.z-t2.depth/2-4},{x:t2.x-28,y:25.75,z:t2.z-t2.depth/2-T2_OBSERVATION_DECK_LAYOUT.projection-14},t2NorthDeckBounds,t2Columns),
 spot('t2-south-deck','Terminal 2 south outdoor observation deck · 5F','第二航廈南側戶外觀景台 · 5F',23.45,{x:t2.x-28,y:25.15,z:t2.z+t2.depth/2+3},{x:t2.x,y:26.2,z:t2.z+t2.depth/2+T2_OBSERVATION_DECK_LAYOUT.projection-T2_OBSERVATION_DECK_LAYOUT.statueInset},t2SouthDeckBounds,t2Columns),
 spot('t2-temple-avenue','Terminal 2 Taiwan Temple Avenue · 5F','第二航廈臺灣玩藝大街 · 5F',23.45,{x:t2.x-t2TempleSpan*.43,y:25.15,z:t2TempleCenterZ},{x:t2.x+t2TempleSpan*.3,y:26.3,z:t2TempleCenterZ+5},t2TempleBounds,[...t2TempleFeatures,...t2Columns]),
 spot('t3-gates','Terminal 3 north concourse · D11–D18','第三航廈北登機廊廳 · D11–D18',.36,{x:t3n.x-57,y:2.06,z:t3n.z+15},{x:t3n.x-57,y:2.6,z:t3n.z-24},inside(t3n),[...columnsFor(t3n),...northShops]),
 {id:'tower',en:'Control tower cab',zh:'塔臺管制室',floor:0,position:{x:0,y:0,z:0},target:{x:0,y:0,z:0}}
];

/** Put passenger spaces ahead of the optional individual shop inspection views. */
export const primaryExploreSpotIds:readonly ExploreSpotId[]=[
 't1-checkin','t1-arrivals','t1-upper-gallery','t1-departures','t1-immigration','t1-transfer-security','t1-a-link','t1-a-gates','t1-a-shared','t1-a-mountains','t1-a-mountains-window','t1-b-gates',
 't2-arrivals','t2-arrival-curb','t2-arrival-gallery','t2-arrival-art','t2-arrival-immigration','t2-baggage','t2-arrival-customs','t2-departures','t2-atrium','t2-passport','t2-security','t2-transfer','t2-c-gates','t2-d-gates',
 't2-b2-corridor','t1-b1-west-bus','t2-forecourt','t2-north-deck','t2-south-deck','t3-gates','tower','runway','apron'
];
export const primaryExploreSpots=primaryExploreSpotIds.map(id=>exploreSpots.find(s=>s.id===id)!);
export const detailExploreSpots=exploreSpots.filter(s=>!primaryExploreSpotIds.includes(s.id));

export function exploreSpot(id:ExploreSpotId):ExploreSpot{return exploreSpots.find(spot=>spot.id===id)??exploreSpots[0];}

/** Keep indoor walkers on their selected floor; slide along coarse columns and fixtures. */
export function moveExplorer(spot:ExploreSpot,from:{x:number;z:number},to:{x:number;z:number}){
 const b=spot.bounds??{left:-5000,right:5000,near:-3000,far:3000};
 const obstacles=spot.bounds?(spot.obstacles??[]):outdoorObstacles;
 const contains=(x:number,z:number,r:Rect)=>x>r.left&&x<r.right&&z>r.near&&z<r.far;
 // An existing overlap can be exited, but a clear position cannot move into a solid.
 const blocked=(x:number,z:number)=>(!!spot.walkAreas&&!spot.walkAreas.some(r=>containsPassengerPoint(r,x,z)))||obstacles.some(r=>contains(x,z,r)&&!contains(from.x,from.z,r));
 const wantedX=Math.max(b.left,Math.min(b.right,to.x)),wantedZ=Math.max(b.near,Math.min(b.far,to.z));
 const x=blocked(wantedX,from.z)?from.x:wantedX;
 const z=blocked(x,wantedZ)?from.z:wantedZ;
 return {x,z};
}
