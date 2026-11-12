import type {Point,Runway,TaxiEdge,TaxiNode} from '../data/airport';

export interface MapFeature {id:number;kind:string;tags:Record<string,string>;points:number[][]}
export interface Corridor {a:Point;b:Point;halfWidth:number}

/** Rendered surface roads never become taxi routes. Underground map ways are omitted. */
export function roadIsVisible(feature:MapFeature){
 const t=feature.tags;
 return feature.kind==='road'&&!['yes','building_passage','culvert'].includes(t.tunnel||'')&&t.location!=='underground'&&t.covered!=='yes';
}
export function roadWidth(tags:Record<string,string>){
 const explicit=Number.parseFloat(tags.width||'');if(Number.isFinite(explicit)&&explicit>=2&&explicit<=30)return explicit;
 const lanes=Number.parseInt(tags.lanes||'',10);if(Number.isFinite(lanes)&&lanes>0&&lanes<=8)return Math.max(3,Math.min(24,lanes*3.3));
 const kind=tags.highway||'';return kind.startsWith('motorway')?12:kind.startsWith('primary')?9:kind.startsWith('secondary')?8:kind.startsWith('tertiary')?7:kind==='service'?4.5:5.5;
}
export function taxiCorridors(nodes:TaxiNode[],edges:TaxiEdge[]):Corridor[]{
 const byId=new Map(nodes.map(n=>[n.id,n]));return edges.flatMap(e=>{const a=byId.get(e.from),b=byId.get(e.to);return a&&b?[{a,b,halfWidth:(e.width||25)/2}]:[];});
}
export function distanceToSegment(p:Point,a:Point,b:Point){
 const dx=b.x-a.x,dz=b.z-a.z,denom=dx*dx+dz*dz,t=denom?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/denom)):0;
 return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);
}
/** Extra clearance includes half a sampled chunk, so roads cannot touch an aircraft corridor. */
export function roadPointClear(p:Point,halfWidth:number,corridors:Corridor[],runways:Runway[],margin=5){
 if(Math.abs(p.x)>2800||Math.abs(p.z)>1450)return false;
 for(const r of runways)if(Math.abs(p.x-r.x)<r.length/2+halfWidth+margin&&Math.abs(p.z-r.z)<r.width/2+halfWidth+margin)return false;
 for(const c of corridors)if(distanceToSegment(p,c.a,c.b)<c.halfWidth+halfWidth+margin)return false;
 return true;
}
