import type {Gate,TaxiEdge,TaxiNode} from '../data/airport';

export interface SupportBay {gate:string;x:number;z:number;side:number;front:number;halfDepth:number;distanceToGraph:number}

// Clearance covers an approximately 39 m aircraft radius, the equipment bay's
// bounding circle and a small margin around every graph centreline.
export const SUPPORT_BAY_RADIUS=Math.hypot(7,3);
export const SUPPORT_PATH_CLEARANCE=39+SUPPORT_BAY_RADIUS+2;

export function concourseForGate(gate:Gate){
 const z=gate.id.startsWith('A')?-198:gate.id.startsWith('B')?90:gate.id.startsWith('C')?105:gate.terminal==='T3 North'?-240:-225;
 return {z,halfDepth:gate.terminal==='T3 North'?27.5:15.5};
}
function distanceToSegment(p:{x:number;z:number},a:TaxiNode,b:TaxiNode){
 const dx=b.x-a.x,dz=b.z-a.z,lengthSq=dx*dx+dz*dz;
 const t=lengthSq?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/lengthSq)):0;
 return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);
}
export function planSupportBays(gates:Gate[],nodes:TaxiNode[],edges:TaxiEdge[]):SupportBay[]{
 const byId=new Map(nodes.map(n=>[n.id,n])),bays:SupportBay[]=[];
 for(const [index,gate] of gates.filter(g=>!g.remote).entries()){
  if(index%5===4)continue;
  const c=concourseForGate(gate),side=Math.sign(gate.z-c.z)||1,front=c.z+side*c.halfDepth,p={x:gate.x-32,z:front+side*6};
  let distanceToGraph=Infinity;
  for(const edge of edges){const a=byId.get(edge.from),b=byId.get(edge.to);if(a&&b)distanceToGraph=Math.min(distanceToGraph,distanceToSegment(p,a,b));}
  if(distanceToGraph>=SUPPORT_PATH_CLEARANCE)bays.push({gate:gate.id,...p,side,front,halfDepth:c.halfDepth,distanceToGraph});
 }
 return bays;
}

/** Runway bearing maps meteorological wind-from degrees into scene coordinates. */
export function windsockAngles(windDirection:number,windSpeed:number,runwayBearing:number){
 const strength=Math.max(0,Math.min(1,windSpeed/18));
 return {yaw:-(Math.PI/2+(windDirection-runwayBearing)*Math.PI/180),droop:.36+(.06-.36)*strength};
}
