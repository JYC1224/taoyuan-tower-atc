import {gates,runways,terminals} from '../data/airport';

export type ExploreSpotId=
 'runway'|'apron'|'t1-arrivals'|'t1-checkin'|'t1-immigration'|'t1-departures'|'t1-a-gates'|'t1-b-gates'|
 't2-arrivals'|'t2-transfer'|'t2-departures'|'t2-food'|'t2-atrium'|'t2-north-deck'|'t2-south-deck'|'t2-c-gates'|'t2-d-gates'|
 't3-gates'|'tower';
type Rect={left:number;right:number;near:number;far:number};
type Position={x:number;y:number;z:number};
export interface ExploreSpot {
 id:ExploreSpotId;en:string;zh:string;position:Position;target:Position;floor:number;bounds?:Rect;obstacles?:Rect[];
}

const t1=terminals.find(t=>t.id==='T1')!,t2=terminals.find(t=>t.id==='T2')!,t3n=terminals.find(t=>t.id==='T3-N')!;
const north=runways.find(r=>r.id==='north')!,b5=gates.find(g=>g.id==='B5')!;
const inset=(x:number,z:number,width:number,depth:number,margin=1):Rect=>({left:x-width/2+margin,right:x+width/2-margin,near:z-depth/2+margin,far:z+depth/2-margin});
const expanded=(x:number,z:number,width:number,depth:number,margin=.65):Rect=>({left:x-width/2-margin,right:x+width/2+margin,near:z-depth/2-margin,far:z+depth/2+margin});
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
for(let i=0;i<6;i++)t1Checkin.push(expanded(t1.x-t1.width*.34+i*(t1.width*.68/5),t1.z-42,7.8,39));
const t1Planters:Rect[]=[];for(const side of [-1,1])for(const offset of [-100,-16,44,100])t1Planters.push(expanded(t1.x+side*t1.width*.36,t1.z+offset,2.8,1.7));
const t2Checkin:Rect[]=[];
for(let i=0;i<5;i++)t2Checkin.push(expanded(t2.x+(i-2)*t2.width/6.05,t2.z-35+(i-2)*6.6,24,4.2));
const t2Baggage:Rect[]=[];
for(let i=0;i<4;i++)t2Baggage.push(expanded(t2.x+(i-1.5)*25,t2.z-53,19,5));
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

/** Walkable interior waypoints follow the current public floor maps and gate rows. */
export const exploreSpots:ExploreSpot[]=[
 {id:'runway',en:'05L runway viewpoint',zh:'05L 跑道觀景點',floor:.2,position:{x:north.x-north.length/2+410,y:1.9,z:north.z+60},target:{x:north.x-north.length/2+50,y:8,z:north.z}},
 {id:'apron',en:'Terminal 1 apron',zh:'第一航廈機坪',floor:.2,position:{x:b5.x-60,y:1.9,z:b5.z+95},target:{x:b5.x,y:7,z:b5.z}},
 spot('t1-arrivals','Terminal 1 arrivals · 1F','第一航廈入境大廳 · 1F',.36,{x:t1.x-45,y:2.06,z:t1.z+126},{x:t1.x-45,y:2.3,z:t1.z+94},inside(t1),[...t1Columns,...t1Checkin]),
 spot('t1-checkin','Terminal 1 check-in · 1F','第一航廈報到大廳 · 1F',.36,{x:t1.x,y:2.06,z:t1.z-66},{x:t1.x,y:2.6,z:t1.z-42},inside(t1),[...t1Columns,...t1Checkin,...t1Planters]),
 spot('t1-immigration','Terminal 1 immigration · 2F','第一航廈證照查驗 · 2F',5.8,{x:t1.x-35,y:7.5,z:t1.z-71},{x:t1.x-35,y:7.8,z:t1.z-18},inside(t1),t1Columns),
 spot('t1-departures','Terminal 1 security & departure hall · 3F','第一航廈安檢與出境大廳 · 3F',11.3,{x:t1.x-35,y:13,z:t1.z+24},{x:t1.x-35,y:13.3,z:t1.z-20},inside(t1),[...t1Columns,...t1Planters]),
 spot('t1-a-gates','Terminal 1 A gates','第一航廈 A 區登機廊廳',.36,{x:451,y:2.06,z:-240},{x:386,y:2.7,z:-240},inset(451,-240,660,120,1),t1AColumns),
 spot('t1-b-gates','Terminal 1 B gates','第一航廈 B 區登機廊廳',.36,{x:408,y:2.06,z:112.5},{x:343,y:2.7,z:112.5},inset(408,112.5,650,45,1),t1BColumns),
 spot('t2-arrivals','Terminal 2 arrivals · 1F','第二航廈入境大廳 · 1F',.36,{x:t2.x,y:2.06,z:t2.z+78},{x:t2.x,y:2.3,z:t2.z+38},inside(t2),[...t2Columns,...t2Baggage]),
 spot('t2-transfer','Terminal 2 transfer & immigration · 2F','第二航廈轉機與證照查驗 · 2F',6.25,{x:t2.x,y:7.95,z:t2.z-44},{x:t2.x,y:8.2,z:t2.z-10},inside(t2),t2Columns),
 spot('t2-departures','Terminal 2 check-in & departures · 3F','第二航廈報到與出境大廳 · 3F',12.35,{x:t2.x,y:14.05,z:t2.z-18},{x:t2.x,y:13.55,z:t2.z-48},inside(t2),[...t2Columns,...t2Checkin]),
 spot('t2-food','Terminal 2 dining hall · 4F','第二航廈餐飲與候機區 · 4F',18.55,{x:t2.x-55,y:20.25,z:t2.z+70},{x:t2.x-15,y:19.4,z:t2.z+110},inside(t2),t2Columns),
 spot('t2-atrium','Terminal 2 atrium gallery · 4F','第二航廈中庭觀景廊 · 4F',18.55,{x:t2.x-75,y:20.25,z:t2.z-4},{x:t2.x+20,y:16.8,z:t2.z-42},inside(t2),t2Columns),
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
