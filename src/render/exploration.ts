import {gates,runways,terminals} from '../data/airport';
import {T1_SECOND_FLOOR_LAYOUT,T1_THIRD_FLOOR_STORES,T1_FOURTH_FLOOR_LAYOUT,T1_FOURTH_FLOOR_LOUNGES,T2_FOURTH_FLOOR_LAYOUT,T2_FOURTH_FLOOR_LOUNGES,T2_FOURTH_FLOOR_SHOPS,t1FourthFloorSuiteCenterX,t1FourthFloorSuiteCenters,t2FourthFloorLoungeCenter,t2FourthFloorShopCenter} from './terminalInteriorLayout';

export type ExploreSpotId=
 'runway'|'apron'|'t1-arrivals'|'t1-checkin'|'t1-upper-gallery'|'t1-transfer-security'|'t1-immigration'|'t1-departures'|'t1-2f-public-services'|'t1-2f-oli'|'t1-2f-taiwan-beer'|'t1-2f-hanlin'|'t1-2f-mos'|'t1-2f-kuo-yuan-ye'|'t1-2f-bistro-d'|'t1-3f-public-services'|'t1-3f-starbucks'|'t1-3f-oli'|'t1-3f-taiwan-goods'|'t1-3f-hanlin'|'t1-3f-kuo-yuan-ye'|'t1-3f-mos'|'t1-3f-vigor'|'t1-3f-indigenous-crafts'|'t1-lounge'|'t1-lounge-other'|'t1-a-gates'|'t1-b-gates'|
 't2-forecourt'|'t2-arrivals'|'t2-arrival-services'|'t2-arrival-art'|'t2-baggage-art'|'t2-transfer-services'|'t2-public-amenities'|'t2-transfer'|'t2-departures'|'t2-passport'|'t2-security'|'t2-retail'|'t2-food'|'t2-shops'|'t2-lounge'|'t2-lounge-2'|'t2-lounge-3'|'t2-lounge-4'|'t2-atrium'|'t2-north-amenities'|'t2-south-amenities'|'t2-north-deck'|'t2-south-deck'|'t2-c-gates'|'t2-d-gates'|
 't3-gates'|'tower';
type Rect={left:number;right:number;near:number;far:number};
type Position={x:number;y:number;z:number};
export interface ExploreSpot {
 id:ExploreSpotId;en:string;zh:string;position:Position;target:Position;floor:number;bounds?:Rect;obstacles?:Rect[];
}

const t1=terminals.find(t=>t.id==='T1')!,t2=terminals.find(t=>t.id==='T2')!,t3n=terminals.find(t=>t.id==='T3-N')!;
const t2ForecourtCenterX=t2.x-t2.width/2-16,t2ForecourtWalkX=t2.x-t2.width/2-4,t2ForecourtCenterZ=t2.z-70,t2ForecourtLength=t2.width*.58;
const north=runways.find(r=>r.id==='north')!,b5=gates.find(g=>g.id==='B5')!;
const inset=(x:number,z:number,width:number,depth:number,margin=1):Rect=>({left:x-width/2+margin,right:x+width/2-margin,near:z-depth/2+margin,far:z+depth/2-margin});
const expanded=(x:number,z:number,width:number,depth:number,margin=.65):Rect=>({left:x-width/2-margin,right:x+width/2+margin,near:z-depth/2-margin,far:z+depth/2+margin});
const t1CheckInStartZ=t1.z-42,t1CheckInSpacing=t1.depth*.60/5;
const t2CheckInStartZ=t2.z-67,t2CheckInSpacing=Math.min(26,t2.depth*.085);
function columnsFor(t:{x:number;z:number;width:number;depth:number},profile?:'T1'|'T2'){
 const columns:Rect[]=[],spacingX=t.width>300?30:26,spacingZ=t.depth>180?34:22;
 if(profile){
  if(profile==='T1'){
   const first=t.z-t.depth*.43,last=t.z+t.depth*.43,step=24;
   for(const side of [-1,1])for(let z=first;z<=last;z+=step)columns.push(expanded(t.x+side*t.width*.405,z,2.8,2.4));
   return columns;
  }
  const xOffsets=profile==='T2'?[-.44,.44]:[-.38,-.13,.13,.38],zOffsets=profile==='T2'?[-.42,-.28,.12,.42]:[-.42,-.25,.08,.32],size=profile==='T2'?1.15:1;
  for(const xOffset of xOffsets)for(const zOffset of zOffsets)columns.push(expanded(t.x+xOffset*t.width,t.z+zOffset*t.depth,size,size));
  return columns;
 }
 for(let x=t.x-t.width/2+spacingX/2;x<=t.x+t.width/2-spacingX/2;x+=spacingX)
  for(let z=t.z-t.depth/2+spacingZ/2;z<=t.z+t.depth/2-spacingZ/2;z+=spacingZ){
   const central=Math.abs(x-t.x)<t.width*.16;columns.push(expanded(x,z,central?1.15:.68,central?1.15:.68));
  }
 return columns;
}
function concourseColumns(x:number,z:number,width:number,depth:number){
 const columns:Rect[]=[],xStep=34,zStep=depth<70?Infinity:38;
 for(let cx=x-width/2+16;cx<=x+width/2-16;cx+=xStep){
  if(depth<70){for(const side of [-1,1])columns.push(expanded(cx,z+side*(depth/2-3.4),.82,.82));}
  else for(let cz=z-depth/2+15;cz<=z+depth/2-15;cz+=zStep)columns.push(expanded(cx,cz,.82,.82));
 }
 return columns;
}
const t1Columns=columnsFor(t1,'T1'),t2Columns=columnsFor(t2,'T2'),t1Checkin:Rect[]=[];
// Match the transverse islands shown in the current 1F model: long X axis,
// six centres along Z. Keep walker collision at the rendered furniture.
for(let i=0;i<6;i++)t1Checkin.push(expanded(t1.x,t1CheckInStartZ+(i-2.5)*t1CheckInSpacing,40,13));
const t1Baggage:Rect[]=[];for(let i=0;i<6;i++){const spacing=Math.min(23.2,t1.width/(6+.9)),x=t1.x-(5*spacing)/2+i*spacing,zOffset=[-1.1,.65,-.25,.3,-.65,.8][i];t1Baggage.push(expanded(x,t1.z+57+zOffset,18.5,9.5));}
const t1Planters:Rect[]=[];for(const side of [-1,1])for(const offset of [-100,-16,44,100])t1Planters.push(expanded(t1.x+side*t1.width*.36,t1.z+offset,2.8,1.7));
const t1ImmigrationCenter=t1.x-38,t1Immigration:Rect[]=[];for(let i=0;i<10;i++)t1Immigration.push(expanded(t1ImmigrationCenter+(i-4.5)*5.2,t1.z-84,3.5,2.8));
const t1ImmigrationQueue:Rect[]=[];for(let i=0;i<8;i++)t1ImmigrationQueue.push(expanded(t1ImmigrationCenter+(i-3.5)*5.55,t1.z-84+8.85,4.65,7.5));
const t1ArrivalArt=[expanded(t1.x,t1.z-t1.depth*.41,45,5.2)];
const t1TransferSecurity=[expanded(t1.x,t1.z+43,54,22)],t1UpperAtrium=[expanded(t1.x+T1_SECOND_FLOOR_LAYOUT.atrium.xOffset,t1.z+T1_SECOND_FLOOR_LAYOUT.atrium.zOffset,t1.width*T1_SECOND_FLOOR_LAYOUT.atrium.widthRatio,t1.depth*T1_SECOND_FLOOR_LAYOUT.atrium.depthRatio)];
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
const t1SecondFloorStores=T1_SECOND_FLOOR_LAYOUT.shops.map(store=>({
 x:t1.x+store.side*(t1.width/2-T1_SECOND_FLOOR_LAYOUT.shop.depth/2),
 z:t1.z+t1.depth*store.zRatio,
 side:store.side
}));
const t1SecondFloorShopFeatures=t1SecondFloorStores.map(store=>expanded(store.x,store.z,T1_SECOND_FLOOR_LAYOUT.shop.depth,T1_SECOND_FLOOR_LAYOUT.shop.width,.5));
const t1SecondFloorServiceZ=t1.z-t1.depth*.44,t1SecondFloorRoomZ=t1.z+t1.depth*.42;
const t1SecondFloorServiceFeatures:Rect[]=[
 expanded(t1.x-42,t1SecondFloorServiceZ,11,6.4),expanded(t1.x-2,t1SecondFloorServiceZ,8.5,4.8),expanded(t1.x+43,t1SecondFloorServiceZ,16,7),
 expanded(t1.x-28,t1SecondFloorRoomZ,13,8),expanded(t1.x,t1SecondFloorRoomZ,13,8),expanded(t1.x+29,t1SecondFloorRoomZ,15,9),
 expanded(t1.x-t1.width*.43,t1.z-18,1.1,1.2),expanded(t1.x+t1.width*.43,t1.z-18,1.1,1.2),expanded(t1.x,t1.z+t1.depth*.39,1.1,1.2)
];
const t1SecondFloorFeatures=[...t1SecondFloorShopFeatures,...t1SecondFloorServiceFeatures];
const t1ThirdFloorShopFeatures=T1_THIRD_FLOOR_STORES.map(store=>expanded(t1.x+store.dx,t1.z+store.dz,store.width,store.depth,.5));
const t1ThirdFloorServiceFeatures:Rect[]=[
 expanded(t1.x-5,t1.z-96,11,6.4),expanded(t1.x+53,t1.z-96,8.5,4.8),expanded(t1.x+t1.width*.31,t1.z-66,16,7),
 expanded(t1.x+t1.width*.15,t1.z-62,13,8),expanded(t1.x-t1.width*.37,t1.z-62,13,8),expanded(t1.x-t1.width*.19,t1.z+116,15,9),
 expanded(t1.x-67,t1.z-49,1.1,1.2),expanded(t1.x-65,t1.z+11,1.1,1.2),expanded(t1.x+46,t1.z+27,1.1,1.2)
];
const t1ThirdFloorFeatures=[...t1ThirdFloorShopFeatures,...t1ThirdFloorServiceFeatures];
const t2NorthFeatures=[expanded(t2.x-t2.width*.275,t2.z-t2.depth*.43,23,9),expanded(t2.x+t2.width*.235,t2.z-t2.depth*.43-1.4,22,11)];
const t2SouthFeatures=[expanded(t2.x+t2.width*.275,t2.z+t2.depth*.13,23,9),expanded(t2.x-t2.width*.245,t2.z+t2.depth*.13-2.1,24,7),expanded(t2.x-t2.width*.08,t2.z+t2.depth*.13+7,16,8)];
const t2Checkin:Rect[]=[];
// T2's five bank centres follow the long hall axis; include the counter,
// baggage belt and passenger-side queue lane in each footprint.
for(let i=0;i<5;i++)t2Checkin.push(expanded(t2.x,t2CheckInStartZ+(i-2)*t2CheckInSpacing+4.6,24,17));
const t2DepartureImmigration=[expanded(t2.x+12,t2.z+5,105,28)];
const t2DepartureSecurity=[expanded(t2.x,t2.z+37,54,22)];
const t2DepartureRetail:Rect[]=[];
for(let i=0;i<6;i++)t2DepartureRetail.push(expanded(t2.x+t2.width*.22+6.5,t2.z+100+(i-2.5)*20,13,19.5));
const t2Baggage:Rect[]=[],t2BaggageCenterZ=t2.z-30,t2BaggageSpacing=Math.min(23.2,t2.width/(6+.9)),t2BaggageOffsets=[-1.1,.65,-.25,.3,-.65,.8];
for(let i=0;i<6;i++)t2Baggage.push(expanded(t2.x+(i-2.5)*t2BaggageSpacing,t2BaggageCenterZ+t2BaggageOffsets[i],19,9.5));
const t2TopCarouselCenterX=t2.x-58,t2TopCarouselZ=t2BaggageCenterZ-25,t2TopCarouselSpacing=Math.min(23.2,t2.width/(2+.9));
for(let i=0;i<2;i++)t2Baggage.push(expanded(t2TopCarouselCenterX+(i-.5)*t2TopCarouselSpacing,t2TopCarouselZ+[-1.1,.65][i],19,9.5));
const t2BaggageArtWallX=t2.x-t2.width/2+3.2,t2BaggageArtZ=t2TopCarouselZ,t2BaggageArtObstacle=expanded(t2BaggageArtWallX+.18,t2BaggageArtZ,1.5,13.8,1);
const t2ArrivalWallX=t2.x-t2.width*.43,t2ArrivalCounterX=t2ArrivalWallX+3.05,t2ArrivalWestRoomX=t2ArrivalCounterX+6,t2ArrivalEastX=t2.x+t2.width*.39;
const t2ArrivalServices=[
 expanded(t2ArrivalCounterX,t2.z-132,8,11),expanded(t2ArrivalCounterX,t2.z-104,8,15),expanded(t2ArrivalCounterX,t2.z-76,8,13),
 expanded(t2ArrivalCounterX,t2.z+45,8,17),expanded(t2ArrivalCounterX,t2.z+63,8,13),
 expanded(t2ArrivalWallX+1.2,t2.z+82,3,9),expanded(t2ArrivalWestRoomX,t2.z+105,11,14),
 expanded(t2ArrivalEastX,t2.z-94,10,15),expanded(t2ArrivalEastX,t2.z+43,10,15),
 expanded(t2ArrivalWallX+.2,t2.z-57,1.2,1.2),expanded(t2ArrivalWallX+.2,t2.z+27,1.2,1.2),expanded(t2ArrivalEastX-.2,t2.z+15,1.2,1.2)
];
const t2ArrivalArtCenterX=t2.x+24,t2ArrivalArtZ=t2.z+78,t2ArrivalArtObstacles=[
 ...Array.from({length:5},(_,i)=>expanded(t2ArrivalArtCenterX+(i-2)*9,t2ArrivalArtZ,3.8,3.7)),
 expanded(t2ArrivalArtCenterX-18+1.3,t2ArrivalArtZ,5.8,4.2),
 expanded(t2ArrivalArtCenterX-34,t2ArrivalArtZ+1,3.2,3.2),expanded(t2ArrivalArtCenterX+34,t2ArrivalArtZ+1,3.2,3.2)
];
const t2TransferServices=[
 expanded(t2.x-t2.width*.31,t2.z-40,10,9),
 expanded(t2.x-t2.width*.19,t2.z-41.1,13,9)
];
const t2PublicAmenities=[expanded(t2.x+t2.width*.30,t2.z-58,14,9)];
const t2TransferSecurity=[expanded(t2.x,t2.z+48,38,22)];
const t2FourthFloorShops=T2_FOURTH_FLOOR_SHOPS.map(shop=>{
 const center=t2FourthFloorShopCenter(t2.x,t2.z,t2.width,t2.depth,shop.side,shop.zRatio);
 return expanded(center.x,center.z,T2_FOURTH_FLOOR_LAYOUT.shop.depth,T2_FOURTH_FLOOR_LAYOUT.shop.length,.75);
});
const t2FourthFloorLounges=T2_FOURTH_FLOOR_LOUNGES.map(lounge=>{
 const center=t2FourthFloorLoungeCenter(t2.x,t2.z,t2.width,t2.depth,lounge.side,lounge.zRatio);
 return expanded(center.x,center.z,T2_FOURTH_FLOOR_LAYOUT.lounge.width,T2_FOURTH_FLOOR_LAYOUT.lounge.depth,.65);
});
const t2FourthFloorFoodZ=t2.z+t2.depth*T2_FOURTH_FLOOR_LAYOUT.foodCourt.zRatio;
const t2FourthFloorDining:Rect[]=[];
for(let row=0;row<4;row++)for(let col=0;col<7;col++)t2FourthFloorDining.push(expanded(t2.x+(col-3)*12.4,t2FourthFloorFoodZ+(row-1.5)*14,3.5,3.4));
const t2FourthFloorAtrium={x:t2.x+T2_FOURTH_FLOOR_LAYOUT.atrium.xOffset,z:t2.z+T2_FOURTH_FLOOR_LAYOUT.atrium.zOffset,width:T2_FOURTH_FLOOR_LAYOUT.atrium.width,depth:T2_FOURTH_FLOOR_LAYOUT.atrium.depth},t2FourthFloorGalleryDining:Rect[]=[],t2FourthFloorWingWidth=(t2.width-T2_FOURTH_FLOOR_LAYOUT.atrium.width)/2-8;
for(const side of [-1,1])for(let row=0;row<5;row++)t2FourthFloorGalleryDining.push(expanded(t2FourthFloorAtrium.x+side*(T2_FOURTH_FLOOR_LAYOUT.atrium.width/2+t2FourthFloorWingWidth*.58), t2FourthFloorAtrium.z+(row-2)*27,3.6,3.5));
const t2FourthFloorObstacles=[...t2Columns,...t2FourthFloorShops,...t2FourthFloorLounges,...t2FourthFloorDining,...t2FourthFloorGalleryDining];
const t2Shop=T2_FOURTH_FLOOR_SHOPS[2],t2ShopCenter=t2FourthFloorShopCenter(t2.x,t2.z,t2.width,t2.depth,t2Shop.side,t2Shop.zRatio);
function t2LoungeFurnitureFor(index:number):Rect[]{
 const lounge=T2_FOURTH_FLOOR_LOUNGES[index],center=t2FourthFloorLoungeCenter(t2.x,t2.z,t2.width,t2.depth,lounge.side,lounge.zRatio),frontX=center.x-lounge.side*(T2_FOURTH_FLOOR_LAYOUT.lounge.width/2-.2),receptionX=center.x+lounge.side*(T2_FOURTH_FLOOR_LAYOUT.lounge.width/2-5.4),receptionZ=center.z-T2_FOURTH_FLOOR_LAYOUT.lounge.depth*.32;
 return [
  expanded(receptionX,receptionZ,1.4,8.5),
  ...Array.from({length:4},(_,cluster)=>expanded(center.x+lounge.side*(-4.5+cluster*3),center.z+(cluster-1.5)*4.8,4.6,4.6)),
  ...Array.from({length:5},(_,row)=>expanded(center.x+lounge.side*9.6,center.z+(row-2)*3.35,2.2,1.5)),
  expanded(center.x+lounge.side*(T2_FOURTH_FLOOR_LAYOUT.lounge.width/2-.18),center.z,1,T2_FOURTH_FLOOR_LAYOUT.lounge.depth),
  ...[-1,1].map(end=>expanded(center.x,center.z+end*(T2_FOURTH_FLOOR_LAYOUT.lounge.depth/2-.16),T2_FOURTH_FLOOR_LAYOUT.lounge.width,1)),
  ...[-1,1].map(end=>expanded(frontX,center.z+end*T2_FOURTH_FLOOR_LAYOUT.lounge.depth*.34,.8,T2_FOURTH_FLOOR_LAYOUT.lounge.depth*.31))
 ];
}
const t1AColumns=concourseColumns(451,-240,660,120),t1BColumns=concourseColumns(408,112.5,650,45),
 t2CColumns=concourseColumns(-243.5,135,750,80),t2DColumns=concourseColumns(-245,-250,840,110);
const northShops:Rect[]=[];
for(let i=0;i<3;i++){const span=t3n.width*.76,spacing=span/3;northShops.push(expanded(t3n.x-span/2+(i+.5)*spacing,t3n.z+6.6,15,5.2));}
const outdoorObstacles:Rect[]=[
 ...terminals.map(t=>expanded(t.x,t.z,t.width,t.depth)),
 expanded(451,-240,660,120),expanded(-245,-250,840,110),expanded(408,112.5,650,45),expanded(-243.5,135,750,80),
 expanded(5,-104,26,26)
];
const inside=(t:{x:number;z:number;width:number;depth:number},margin=2)=>inset(t.x,t.z,t.width,t.depth,margin);
const spot=(id:ExploreSpotId,en:string,zh:string,floor:number,position:Position,target:Position,bounds:Rect,obstacles:Rect[]=[]):ExploreSpot=>({id,en,zh,floor,position,target,bounds,obstacles});
const t2LoungeSpotIds:ExploreSpotId[]=['t2-lounge','t2-lounge-2','t2-lounge-3','t2-lounge-4'];
const t2LoungeViewSpots=t2LoungeSpotIds.map((id,index)=>{
 const lounge=T2_FOURTH_FLOOR_LOUNGES[index],center=t2FourthFloorLoungeCenter(t2.x,t2.z,t2.width,t2.depth,lounge.side,lounge.zRatio),frontX=center.x-lounge.side*(T2_FOURTH_FLOOR_LAYOUT.lounge.width/2-.2),operator=lounge.operator==='EVA Air'?'長榮航空':'環亞';
 return spot(id,`Terminal 2 ${lounge.operator} lounge ${index+1} · 4F`,`第二航廈${operator}貴賓室 ${index+1} · 4F`,18.55,
  {x:frontX+lounge.side*2.8,y:20.25,z:center.z},
  {x:center.x+lounge.side*(T2_FOURTH_FLOOR_LAYOUT.lounge.width/2-1.7),y:19.55,z:center.z},
  inset(center.x,center.z,T2_FOURTH_FLOOR_LAYOUT.lounge.width,T2_FOURTH_FLOOR_LAYOUT.lounge.depth,1),
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
 const info=t1SecondFloorShopSpotInfo[index],centerX=t1.x+shop.side*(t1.width/2-T1_SECOND_FLOOR_LAYOUT.shop.depth/2),centerZ=t1.z+t1.depth*shop.zRatio,frontX=centerX-shop.side*T1_SECOND_FLOOR_LAYOUT.shop.depth/2;
 return spot(info.id,info.en,info.zh,5.8,
  {x:frontX-shop.side*4.4,y:7.85,z:centerZ+10},
  {x:frontX,y:8.18,z:centerZ},inside(t1),[...t1Columns,...t1UpperAtrium,...t1SecondFloorFeatures]);
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
 return spot(info.id,info.en,info.zh,11.3,
  {x:centerX,y:13.35,z:frontZ+5},
  {x:centerX,y:13.75,z:frontZ+1.4},inside(t1),[...t1Columns,...t1Planters,...t1ThirdFloorFeatures,...t1TransferSecurity]);
});

/** Walkable interior waypoints follow the current public floor maps and gate rows. */
export const exploreSpots:ExploreSpot[]=[
 {id:'runway',en:'05L runway viewpoint',zh:'05L 跑道觀景點',floor:.2,position:{x:north.x-north.length/2+410,y:1.9,z:north.z+60},target:{x:north.x-north.length/2+50,y:8,z:north.z}},
 {id:'apron',en:'Terminal 1 apron',zh:'第一航廈機坪',floor:.2,position:{x:b5.x-60,y:1.9,z:b5.z+95},target:{x:b5.x,y:7,z:b5.z}},
 spot('t1-arrivals','Terminal 1 arrivals · 1F','第一航廈入境大廳 · 1F',.36,{x:t1.x-35,y:2.06,z:t1.z+70},{x:t1.x-25,y:2.5,z:t1.z+56},inside(t1),[...t1Columns,...t1Checkin,...t1Baggage]),
 spot('t1-checkin','Terminal 1 check-in · 1F','第一航廈報到大廳 · 1F',.36,{x:t1.x+28,y:2.06,z:t1CheckInStartZ+16.2},{x:t1.x,y:2.6,z:t1CheckInStartZ},inside(t1),[...t1Columns,...t1Checkin]),
 spot('t1-upper-gallery','Terminal 1 public retail gallery · 2F','第一航廈二樓中庭與商店通行廊 · 2F',5.8,{x:t1.x-t1.width/2+10.5,y:7.85,z:t1.z-44},{x:t1.x-t1.width/2+13,y:8.1,z:t1.z-38},inside(t1),[...t1Columns,...t1UpperAtrium,...t1SecondFloorFeatures]),
 ...t1SecondFloorShopSpots,
 spot('t1-2f-public-services','Terminal 1 public services · ATM / FX / bank · 2F','第一航廈公共服務 · ATM／換匯／銀行 · 2F',5.8,{x:t1.x,y:7.85,z:t1.z-t1.depth*.37},{x:t1.x,y:8.1,z:t1SecondFloorServiceZ+3.4},inside(t1),[...t1Columns,...t1UpperAtrium,...t1SecondFloorFeatures]),
 ...t1ThirdFloorShopSpots,
 spot('t1-3f-public-services','Terminal 1 public services · 3F','第一航廈公共服務與醫療中心 · 3F',11.3,{x:t1.x-33,y:13.35,z:t1.z+130},{x:t1.x-33,y:13.75,z:t1.z+116},inside(t1),[...t1Columns,...t1Planters,...t1ThirdFloorFeatures]),
 spot('t1-transfer-security','Terminal 1 transfer-screening route concept · departure level','第一航廈轉機安檢路徑示意 · 出境層',11.3,{x:t1.x-32,y:13.35,z:t1.z+25},{x:t1.x-3,y:13.55,z:t1.z+43},inside(t1),[...t1Columns,...t1Planters,...t1ThirdFloorFeatures,...t1TransferSecurity]),
 spot('t1-immigration','Terminal 1 arrival passport control · 3F','第一航廈入境證照查驗 · 3F',11.3,{x:t1.x-24,y:13.35,z:t1.z-68},{x:t1.x-5,y:13.85,z:t1.z-84},inside(t1),[...t1Columns,...t1Immigration,...t1ImmigrationQueue,...t1ArrivalArt,...t1ThirdFloorFeatures]),
 spot('t1-departures','Terminal 1 departures & retail hall · 3F','第一航廈出境與商業大廳 · 3F',11.3,{x:t1.x+38,y:13.35,z:t1.z+29},{x:t1.x+7,y:13.75,z:t1.z+43},inside(t1),[...t1Columns,...t1Planters,...t1ThirdFloorFeatures,...t1TransferSecurity]),
 // Keep the camera in the clear central aisle; the former west-side position
 // sat beside a mapped shop and a support pier, which filled the foreground.
 spot('t1-lounge',`Terminal 1 Plaza Premium Lounge ${T1_FOURTH_FLOOR_LOUNGES[1].nameEn} · Zone ${T1_FOURTH_FLOOR_LOUNGES[1].zone}`,`第一航廈${T1_FOURTH_FLOOR_LOUNGES[1].nameZh}・4F`,16.7,{x:t1LoungeSuiteX,y:18.35,z:t1LoungeCenters[1]-6.5},{x:t1LoungeSuiteX,y:17.55,z:t1LoungeCenters[1]+6.1},t1LoungeBounds,[...t1LoungeFurniture,...t1LoungeReception,...t1LoungeBuffets,...t1LoungePartitions]),
 spot('t1-lounge-other',`Terminal 1 Plaza Premium Lounge ${T1_FOURTH_FLOOR_LOUNGES[0].nameEn} · Zone ${T1_FOURTH_FLOOR_LOUNGES[0].zone}`,`第一航廈${T1_FOURTH_FLOOR_LOUNGES[0].nameZh}・4F`,16.7,{x:t1LoungeSuiteX,y:18.35,z:t1LoungeCenters[0]+7.9},{x:t1LoungeSuiteX,y:17.55,z:t1LoungeCenters[0]-5.2},t1LoungeBounds,[...t1LoungeFurniture,...t1LoungeReception,...t1LoungeBuffets,...t1LoungePartitions]),
 spot('t1-a-gates','Terminal 1 A gates','第一航廈 A 區登機廊廳',.36,{x:451,y:2.06,z:-240},{x:386,y:2.7,z:-240},inset(451,-240,660,120,1),t1AColumns),
 spot('t1-b-gates','Terminal 1 B gates','第一航廈 B 區登機廊廳',.36,{x:408,y:2.06,z:112.5},{x:343,y:2.7,z:112.5},inset(408,112.5,650,45,1),t1BColumns),
 spot('t2-arrivals','Terminal 2 arrivals · 1F','第二航廈入境大廳 · 1F',.36,{x:t2.x+70,y:2.06,z:t2.z-2},{x:t2.x,y:2.3,z:t2BaggageCenterZ},inside(t2),[...t2Columns,...t2Baggage,...t2ArrivalServices,...t2ArrivalArtObstacles,t2BaggageArtObstacle]),
 spot('t2-arrival-services','Terminal 2 arrival services · 1F','第二航廈入境服務帶 · 1F',.36,{x:t2.x-72,y:2.06,z:t2.z+18},{x:t2ArrivalCounterX,y:2.55,z:t2.z+45},inside(t2),[...t2Columns,...t2Baggage,...t2ArrivalServices]),
 spot('t2-arrival-art','Terminal 2 Welcome to Taiwan public art · 1F','第二航廈入境公共藝術 · 1F',.36,{x:t2ArrivalArtCenterX,y:2.06,z:t2ArrivalArtZ+29},{x:t2ArrivalArtCenterX,y:2.75,z:t2ArrivalArtZ},inside(t2),[...t2Columns,...t2Baggage,...t2ArrivalServices,...t2ArrivalArtObstacles]),
 spot('t2-baggage-art','Terminal 2 Wealthy Island Wan Wan Lai · 1F','第二航廈寶島旺旺徠彩繪玻璃 · 1F',.36,{x:t2BaggageArtWallX+31,y:2.06,z:t2BaggageArtZ+17},{x:t2BaggageArtWallX+.4,y:2.35,z:t2BaggageArtZ},inside(t2),[...t2Columns,...t2Baggage,t2BaggageArtObstacle]),
 spot('t2-forecourt','Terminal 2 coach drop-off canopy','第二航廈接駁車下客雨棚',.2,
  {x:t2ForecourtWalkX,y:2.06,z:t2ForecourtCenterZ},
  {x:t2ForecourtWalkX,y:3.2,z:t2ForecourtCenterZ-34},
  {left:t2ForecourtCenterX-20,right:t2.x-t2.width/2-2,near:t2ForecourtCenterZ-t2ForecourtLength/2-5,far:t2ForecourtCenterZ+t2ForecourtLength/2+5}),
  spot('t2-transfer-services','Terminal 2 iTravel & public services · 2F','第二航廈 iTravel 與公共服務 · 2F',6.25,{x:t2.x-35,y:7.95,z:t2.z-8},{x:t2.x-t2.width*.31,y:8.2,z:t2.z-40},inside(t2),[...t2Columns,...t2TransferServices]),
  spot('t2-public-amenities','Terminal 2 restrooms & AED · 2F','第二航廈廁所與 AED · 2F',6.25,{x:t2.x+58,y:7.95,z:t2.z-84},{x:t2.x+t2.width*.38,y:8.2,z:t2.z-58},inside(t2),[...t2Columns,...t2PublicAmenities]),
  spot('t2-transfer','Terminal 2 transfer security · 2F','第二航廈轉機安檢 · 2F',6.25,{x:t2.x-24,y:7.95,z:t2.z+23},{x:t2.x-5,y:8.2,z:t2.z+48},inside(t2),[...t2Columns,...t2TransferSecurity]),
 spot('t2-departures','Terminal 2 check-in & departures · 3F','第二航廈報到與出境大廳 · 3F',12.35,{x:t2.x-25,y:14.05,z:t2CheckInStartZ+39},{x:t2.x-5,y:13.4,z:t2CheckInStartZ+24.65},inside(t2),[...t2Columns,...t2Checkin,...t2DepartureImmigration,...t2DepartureSecurity]),
 spot('t2-passport','Terminal 2 departure immigration · 3F','第二航廈出境證照查驗 · 3F',12.35,{x:t2.x-18,y:14.05,z:t2.z+17},{x:t2.x,y:13.55,z:t2.z+5},inside(t2),[...t2Columns,...t2Checkin,...t2DepartureImmigration,...t2DepartureSecurity,...t2DepartureRetail]),
 spot('t2-security','Terminal 2 departure security · 3F','第二航廈出境安檢 · 3F',12.35,{x:t2.x-20,y:14.05,z:t2.z+47},{x:t2.x-5,y:13.55,z:t2.z+37},inside(t2),[...t2Columns,...t2Checkin,...t2DepartureImmigration,...t2DepartureSecurity,...t2DepartureRetail]),
 spot('t2-retail','Terminal 2 airside retail · 3F','第二航廈免稅商店與候機服務 · 3F',12.35,
  {x:t2.x+t2.width*.22-24,y:14.05,z:t2.z+100},
  {x:t2.x+t2.width*.22,y:13.75,z:t2.z+100},inside(t2),[...t2Columns,...t2DepartureRetail]),
 spot('t2-food','Terminal 2 dining hall · 4F','第二航廈餐飲與候機區 · 4F',18.55,{x:t2.x-29,y:20.25,z:t2FourthFloorFoodZ-14},{x:t2.x-5,y:19.4,z:t2FourthFloorFoodZ+7},inside(t2),t2FourthFloorObstacles),
 spot('t2-shops','Terminal 2 4F mapped restaurants','第二航廈 4F 商店與餐飲 · 4F',18.55,{x:t2ShopCenter.frontX-t2Shop.side*5.2,y:20.25,z:t2ShopCenter.z+5.3},{x:t2ShopCenter.frontX+t2Shop.side*.25,y:19.8,z:t2ShopCenter.z},inside(t2),t2FourthFloorObstacles),
 ...t2LoungeViewSpots,
 spot('t2-atrium','Terminal 2 atrium gallery · 4F','第二航廈中庭觀景廊 · 4F',18.55,{x:t2.x-58,y:20.25,z:t2.z-40},{x:t2.x-10,y:12.65,z:t2.z-31},inside(t2),t2Columns),
 spot('t2-north-amenities','Terminal 2 north deck services · 5F','第二航廈北側商店與候機服務 · 5F',23.45,{x:t2.x-t2.width*.275,y:25.15,z:t2.z-t2.depth*.36},{x:t2.x-t2.width*.275,y:25.45,z:t2.z-t2.depth*.43+4.2},inside(t2),[...t2Columns,...t2NorthFeatures]),
 spot('t2-south-amenities','Terminal 2 south deck services · 5F','第二航廈南側商店與休息服務 · 5F',23.45,{x:t2.x+t2.width*.275,y:25.15,z:t2.z+t2.depth*.13-24},{x:t2.x+t2.width*.275,y:25.45,z:t2.z+t2.depth*.13-4.2},inside(t2),[...t2Columns,...t2SouthFeatures]),
 spot('t2-north-deck','Terminal 2 north observation deck · 5F','第二航廈北側觀景台 · 5F',23.45,{x:t2.x-40,y:25.15,z:t2.z-124},{x:t2.x-40,y:25.4,z:t2.z-142},inside(t2),t2Columns),
 spot('t2-south-deck','Terminal 2 south observation deck & Taiwan Temple Avenue · 5F','第二航廈南側觀景台與臺灣玩藝大街 · 5F',23.45,{x:t2.x-40,y:25.15,z:t2.z+120},{x:t2.x-40,y:25.4,z:t2.z+143},inside(t2),t2Columns),
 spot('t2-c-gates','Terminal 2 C gates','第二航廈 C 區登機廊廳',.36,{x:-346.5,y:2.06,z:110},{x:-346.5,y:2.7,z:95},inset(-243.5,135,750,80,1),t2CColumns),
 spot('t2-d-gates','Terminal 2 D1–D10 gates','第二航廈 D1–D10 登機廊廳',.36,{x:-228,y:2.06,z:-250},{x:-293,y:2.7,z:-250},inset(-245,-250,840,110,1),t2DColumns),
 spot('t3-gates','Terminal 3 north concourse · D11–D18','第三航廈北登機廊廳 · D11–D18',.36,{x:t3n.x-57,y:2.06,z:t3n.z+15},{x:t3n.x-57,y:2.6,z:t3n.z-24},inside(t3n),[...columnsFor(t3n),...northShops]),
 {id:'tower',en:'Control tower cab',zh:'塔臺管制室',floor:0,position:{x:0,y:0,z:0},target:{x:0,y:0,z:0}}
];

export function exploreSpot(id:ExploreSpotId):ExploreSpot{return exploreSpots.find(spot=>spot.id===id)??exploreSpots[0];}

/** Keep indoor walkers on their selected floor; slide along coarse columns and fixtures. */
export function moveExplorer(spot:ExploreSpot,from:{x:number;z:number},to:{x:number;z:number}){
 const b=spot.bounds??{left:-5000,right:5000,near:-3000,far:3000};
 const obstacles=spot.bounds?(spot.obstacles??[]):outdoorObstacles;
 const contains=(x:number,z:number,r:Rect)=>x>r.left&&x<r.right&&z>r.near&&z<r.far;
 // An existing overlap can be exited, but a clear position cannot move into a solid.
 const blocked=(x:number,z:number)=>obstacles.some(r=>contains(x,z,r)&&!contains(from.x,from.z,r));
 const wantedX=Math.max(b.left,Math.min(b.right,to.x)),wantedZ=Math.max(b.near,Math.min(b.far,to.z));
 const x=blocked(wantedX,from.z)?from.x:wantedX;
 const z=blocked(x,wantedZ)?from.z:wantedZ;
 return {x,z};
}
