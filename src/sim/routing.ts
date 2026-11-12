import type { Aircraft, Point, RouteProposal } from '../types';
import { taxiNodes, taxiEdges } from '../data/airport';
import { FLEET } from '../data/fleet';
export const nodeById = new Map(taxiNodes.map(n=>[n.id,n]));
export function distance(a:Point,b:Point):number { return Math.hypot(a.x-b.x,a.z-b.z); }
export function edgeBetween(a:string,b:string) { return taxiEdges.find(e=>(e.from===a&&e.to===b)||(!e.oneWay&&e.from===b&&e.to===a)); }
export interface RouteOptions { span:number; allowRunway?:boolean; occupiedNodes?:Set<string>; busyEdges?:Set<string>; blockedEdges?:Set<string> }
/** Dijkstra over the dated airport topology; incompatible/closed/runway edges are
 * excluded, while occupied corridors receive a routing cost before physical yielding. */
export function shortestRoute(start:string,end:string,options:RouteOptions):RouteProposal|null {
  if(!nodeById.has(start)||!nodeById.has(end)) return null;
  const costs=new Map<string,number>([[start,0]]),previous=new Map<string,string>(),pending=new Set([start]);
  while(pending.size) {
    let current='';let best=Infinity;
    for(const id of pending) if((costs.get(id)??Infinity)<best){best=costs.get(id)!;current=id;}
    pending.delete(current); if(current===end) break;
    for(const e of taxiEdges) {
      if(!e.active||e.maxSpan<options.span||options.blockedEdges?.has(e.id)||(e.runway&&!options.allowRunway)) continue;
      const next=e.from===current?e.to:!e.oneWay&&e.to===current?e.from:null;
      if(!next || (next!==end&&options.occupiedNodes?.has(next))) continue;
      const candidate=best+e.length*(options.busyEdges?.has(e.id)?6:1);
      if(candidate<(costs.get(next)??Infinity)){costs.set(next,candidate);previous.set(next,current);pending.add(next);}
    }
  }
  if(!costs.has(end))return null;
  const nodes=[end];while(nodes[0]!==start){const prev=previous.get(nodes[0]);if(!prev)return null;nodes.unshift(prev);}
  const names:string[]=[];let length=0,busy=false;
  for(let i=1;i<nodes.length;i++){const e=edgeBetween(nodes[i-1],nodes[i])!;length+=e.length;if(names.at(-1)!==e.name)names.push(e.name);busy ||=options.busyEdges?.has(e.id)??false;}
  return {nodes,names,distance:length,warning:busy?'Traffic on proposed route; aircraft will yield at safe spacing.':undefined};
}
export function nearestTaxiNode(p:Point,excludeRunway=true):string {
  const eligible=taxiNodes.filter(n=>!excludeRunway||n.kind!=='entry');
  return eligible.reduce((a,b)=>distance(p,a)<distance(p,b)?a:b).id;
}
export interface PathPoint extends Point { routeIndex:number }
/** Rounded centerline bends preserve translation while changing heading. The
 * topology is still authoritative; the fillets are a replaceable movement model. */
export function smoothPath(aircraft:Aircraft,nodes:string[]):PathPoint[] {
  const points:PathPoint[]=[{x:aircraft.position.x,z:aircraft.position.z,routeIndex:0}];
  nodes.forEach((id,i)=>{const n=nodeById.get(id);if(n&&distance(points.at(-1)!,n)>.1)points.push({x:n.x,z:n.z,routeIndex:i});});
  if(points.length<3)return points.slice(1);
  const result:PathPoint[]=[];
  for(let i=1;i<points.length-1;i++){
    const a=points[i-1],b=points[i],c=points[i+1],ab=distance(a,b),bc=distance(b,c);
    const dot=((b.x-a.x)*(c.x-b.x)+(b.z-a.z)*(c.z-b.z))/(ab*bc);
    if(dot>.995){result.push(b);continue;}
    const r=Math.min(FLEET[aircraft.type].turnRadius,ab*.26,bc*.26);
    const pre={x:b.x+(a.x-b.x)*r/ab,z:b.z+(a.z-b.z)*r/ab,routeIndex:b.routeIndex};
    const post={x:b.x+(c.x-b.x)*r/bc,z:b.z+(c.z-b.z)*r/bc,routeIndex:b.routeIndex};
    result.push(pre);
    for(let s=1;s<=8;s++){const t=s/8;result.push({x:(1-t)**2*pre.x+2*(1-t)*t*b.x+t*t*post.x,z:(1-t)**2*pre.z+2*(1-t)*t*b.z+t*t*post.z,routeIndex:b.routeIndex});}
  }
  result.push(points.at(-1)!);return result;
}
