import type {Point} from '../types';
import type {TaxiEdge,TaxiNode} from '../data/airport';
import {sweptGroundDistance} from './groundFootprint';

export interface GroundIntent {
  id:string; position:Point; length:number; span?:number; heading?:number; speed:number; braking:number;
  route:string[]; nextIndex:number; path:Point[]; revision:number;
  moving:boolean; held:boolean; urgency:number; state:string;
  runwayClearances?:string[];
}
export interface GroundZone {
  id:string; kind:'node'|'edge'|'crossing'|'runway'|'corridor'; label:string; point:Point;
  nodeId?:string; edgeId?:string; edgeIds?:string[]; from?:Point; to?:Point; runway?:string;
}
export interface GroundReservation {zone:string; owner:string; acquired:number; committed:boolean}
export interface GroundWait {
  aircraftId:string; owners:string[]; zone:string; reason:string; since:number;
  stopDistance:number; stopPoint:Point; intervention?:boolean;
}
export interface GroundConflict {
  id:string; zone:string; label:string; aircraftIds:string[]; suggested:string;
  owner:string; kind:'opposing'|'intersection'|'merge'|'blocked'; since:number;
  committed:boolean; needsDecision:boolean;
}
export interface GroundRecovery {time:number; aircraftIds:string[]; action:string}
interface Claim {zone:GroundZone; enter:number; leave:number}
const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
export function projectSegment(p:Point,a:Point,b:Point){
  const dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz;
  const raw=l2?((p.x-a.x)*dx+(p.z-a.z)*dz)/l2:0,t=Math.max(0,Math.min(1,raw));
  const point={x:a.x+t*dx,z:a.z+t*dz};return {point,t,raw,distance:dist(p,point)};
}
function projectPath(point:Point,path:Point[]){
  let along=0,best=Infinity,result=0;
  for(let i=1;i<path.length;i++){const p=projectSegment(point,path[i-1],path[i]);if(p.distance<best){best=p.distance;result=along+dist(path[i-1],p.point);}along+=dist(path[i-1],path[i]);}
  return {along:result,distance:best,total:along};
}
function pathPoint(path:Point[],distance:number):Point {
  let remaining=Math.max(0,distance);
  for(let i=1;i<path.length;i++){const d=dist(path[i-1],path[i]);if(remaining<=d&&d>0)return {x:path[i-1].x+(path[i].x-path[i-1].x)*remaining/d,z:path[i-1].z+(path[i].z-path[i-1].z)*remaining/d};remaining-=d;}
  return path.at(-1)??{x:0,z:0};
}
function boundedPath(path:Point[],horizon:number):Point[]{
  const result=[path[0]];let remaining=horizon;
  for(let i=1;i<path.length;i++){const length=dist(path[i-1],path[i]);if(length>remaining){result.push(pathPoint([path[i-1],path[i]],remaining));break;}result.push(path[i]);remaining-=length;}return result;
}

/** Strongly connected wait dependencies, including cycles longer than two aircraft. */
export function findWaitCycles(graph:Map<string,Set<string>>):string[][] {
  let serial=0;const index=new Map<string,number>(),low=new Map<string,number>(),stack:string[]=[],onStack=new Set<string>(),cycles:string[][]=[];
  const visit=(id:string)=>{index.set(id,serial);low.set(id,serial++);stack.push(id);onStack.add(id);
    for(const next of [...(graph.get(id)??[])].sort()){if(!index.has(next)){visit(next);low.set(id,Math.min(low.get(id)!,low.get(next)!));}else if(onStack.has(next))low.set(id,Math.min(low.get(id)!,index.get(next)!));}
    if(low.get(id)===index.get(id)){const group:string[]=[];let item:string;do{item=stack.pop()!;onStack.delete(item);group.push(item);}while(item!==id);if(group.length>1||graph.get(id)?.has(id))cycles.push(group.sort());}
  };
  for(const id of [...graph.keys()].sort())if(!index.has(id))visit(id);return cycles;
}

/** Surface authority owns resources, not movement. Occupancy is rebuilt from real
 * positions every update. Future claims can be withdrawn; occupied zones cannot.
 * All aircraft request from the same snapshot before any physics step executes. */
export class GroundTraffic {
  readonly zones=new Map<string,GroundZone>();
  readonly reservations=new Map<string,GroundReservation>();
  readonly waits=new Map<string,GroundWait>();
  readonly waitFor=new Map<string,Set<string>>();
  conflicts:GroundConflict[]=[];cycles:string[][]=[];recoveries:GroundRecovery[]=[];
  private readonly nodes:Map<string,TaxiNode>;
  private readonly edgeMap=new Map<string,TaxiEdge>();
  private readonly adjacency=new Map<string,TaxiEdge[]>();
  private readonly corridors=new Map<string,GroundZone>();
  private readonly corridorNodes=new Set<string>();
  private revisions=new Map<string,number>();
  private tickets=new Map<string,number>();
  private choices=new Map<string,string>();
  private conflictSince=new Map<string,number>();
  private occupants=new Map<string,string[]>();
  private intents=new Map<string,GroundIntent>();
  private claims=new Map<string,Claim[]>();
  private limits=new Map<string,number>();
  private physicalHolds=new Map<string,{owner:string;since:number;last:number}>();
  private now=0;
  constructor(nodes:TaxiNode[],private readonly edges:TaxiEdge[]){
    this.nodes=new Map(nodes.map(n=>[n.id,n]));
    for(const n of nodes){this.zones.set('node:'+n.id,{id:'node:'+n.id,kind:'node',label:n.id,point:n,nodeId:n.id,runway:n.runway});this.adjacency.set(n.id,[]);}
    for(const edge of edges){const from=this.nodes.get(edge.from)!,to=this.nodes.get(edge.to)!;this.edgeMap.set(edge.id,edge);this.adjacency.get(edge.from)!.push(edge);this.adjacency.get(edge.to)!.push(edge);this.zones.set('edge:'+edge.id,{id:'edge:'+edge.id,kind:'edge',label:edge.name,point:{x:(from.x+to.x)/2,z:(from.z+to.z)/2},edgeId:edge.id,from,to,runway:edge.runway});}
    for(const edge of edges)if(edge.runway&&!this.zones.has('runway:'+edge.runway))this.zones.set('runway:'+edge.runway,{id:'runway:'+edge.runway,kind:'runway',label:'Runway '+edge.runway,point:this.nodes.get(edge.from)!,runway:edge.runway});
    // Every degree-two chain is one non-passing corridor, even when a distant
    // alternate route exists around it. Stand feeders cannot provide passing
    // space and therefore do not split a through corridor into smaller blocks.
    const roads=edges.filter(e=>!e.runway&&[e.from,e.to].every(id=>!['stand','pushback','entry'].includes(this.nodes.get(id)!.kind)));
    const graph=new Map(nodes.map(n=>[n.id,roads.filter(e=>e.from===n.id||e.to===n.id)]));
    const used=new Set<string>();for(const first of roads){if(used.has(first.id))continue;const component:TaxiEdge[]=[],pending=[first];while(pending.length){const edge=pending.pop()!;if(used.has(edge.id))continue;used.add(edge.id);component.push(edge);for(const node of [edge.from,edge.to])if(graph.get(node)?.length===2)for(const next of graph.get(node)??[])if(!used.has(next.id))pending.push(next);}
      if(component.length<2)continue;const id='corridor:'+component.map(e=>e.id).sort()[0],zone:GroundZone={id,kind:'corridor',label:[...new Set(component.map(e=>e.name))].join(' / ')+' single-lane corridor',point:this.zones.get('edge:'+first.id)!.point,edgeIds:component.map(e=>e.id)};this.zones.set(id,zone);for(const edge of component)this.corridors.set(edge.id,zone);
      for(const edge of component)for(const node of [edge.from,edge.to])if(graph.get(node)?.length===2)this.corridorNodes.add(node);
    }
    // A reduced chart graph can contain geometric crossings with different IDs.
    // Share a zone even if the data does not explicitly connect the crossing.
    for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){
      const a=edges[i],b=edges[j];if([a.from,a.to].some(id=>id===b.from||id===b.to))continue;
      const p=this.nodes.get(a.from)!,q=this.nodes.get(a.to)!,r=this.nodes.get(b.from)!,s=this.nodes.get(b.to)!;
      const dx=q.x-p.x,dz=q.z-p.z,ex=s.x-r.x,ez=s.z-r.z,den=dx*ez-dz*ex;if(Math.abs(den)<1e-6)continue;
      const t=((r.x-p.x)*ez-(r.z-p.z)*ex)/den,u=((r.x-p.x)*dz-(r.z-p.z)*dx)/den;
      if(t>0&&t<1&&u>0&&u<1){const id='cross:'+a.id+'|'+b.id;this.zones.set(id,{id,kind:'crossing',label:a.name+' / '+b.name,point:{x:p.x+t*dx,z:p.z+t*dz},runway:a.runway??b.runway});}
    }
  }
  reset(){this.reservations.clear();this.waits.clear();this.waitFor.clear();this.revisions.clear();this.tickets.clear();this.choices.clear();this.conflictSince.clear();this.limits.clear();this.physicalHolds.clear();this.conflicts=[];this.cycles=[];this.recoveries=[];}
  release(id:string){for(const [zone,r]of this.reservations)if(r.owner===id&&!r.committed)this.reservations.delete(zone);this.revisions.delete(id);this.tickets.delete(id);this.waits.delete(id);this.waitFor.delete(id);}
  private edge(from:string,to:string){return this.adjacency.get(from)?.find(e=>e.from===from&&e.to===to||!e.oneWay&&e.to===from&&e.from===to);}
  private requests(a:GroundIntent):Claim[]{
    if(!a.moving||a.held||a.path.length<2)return[];
    const result=new Map<string,Claim>(),margin=a.length/2+95,horizon=Math.max(360,Math.min(720,Math.max(6,a.speed)*60)),path=boundedPath(a.path,horizon+margin);
    const add=(zone:GroundZone,enter:number,leave:number)=>{if(enter>horizon||leave<0)return;const old=result.get(zone.id);if(old){old.enter=Math.min(old.enter,enter);old.leave=Math.max(old.leave,leave);}else result.set(zone.id,{zone,enter,leave});};
    for(let i=Math.max(0,a.nextIndex-1);i<a.route.length&&i<a.nextIndex+12;i++){
      const node=this.nodes.get(a.route[i]);if(!node)continue;const p=projectPath(node,a.path);
      if(i>=a.nextIndex&&p.distance<margin&&!this.corridorNodes.has(node.id))add(this.zones.get('node:'+node.id)!,p.along-margin,p.along+margin);
      if(i>0){const edge=this.edge(a.route[i-1],node.id);if(!edge)continue;const from=this.nodes.get(a.route[i-1])!,start=projectPath(from,a.path),end=projectPath(node,a.path);if(end.distance<margin){const corridor=this.corridors.get(edge.id);add(corridor??this.zones.get('edge:'+edge.id)!,Math.max(0,start.along)-margin,end.along+margin);if(edge.runway)add(this.zones.get('runway:'+edge.runway)!,Math.max(0,start.along)-margin,end.along+margin);}}
    }
    for(const zone of this.zones.values())if(zone.kind==='crossing'){const p=projectPath(zone.point,path);if(p.distance<margin*.7)add(zone,p.along-margin,p.along+margin);}
    // Neighbouring graph IDs can still describe overlapping aircraft envelopes:
    // runway exits beside a parallel taxiway and dense apron junctions are the
    // important cases. Reserve those spatial zones before either body enters.
    const bounds=path.reduce((b,p)=>({minX:Math.min(b.minX,p.x),maxX:Math.max(b.maxX,p.x),minZ:Math.min(b.minZ,p.z),maxZ:Math.max(b.maxZ,p.z)}),{minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity});
    const reach=a.length/2+61;
    for(const node of this.nodes.values()){
      if(node.kind==='stand')continue;
      // Interior edges and junctions belong to one atomic corridor lease. They
      // must not be independently granted to aircraft waiting outside it.
      if(this.corridorNodes.has(node.id))continue;
      if(node.kind==='pushback'){
        if(result.has('node:'+node.id)||node.x<bounds.minX-120||node.x>bounds.maxX+120||node.z<bounds.minZ-120||node.z>bounds.maxZ+120)continue;
        const standEdge=this.adjacency.get(node.id)?.find(e=>this.nodes.get(e.from===node.id?e.to:e.from)?.kind==='stand');
        if(!standEdge)continue;const stand=this.nodes.get(standEdge.from===node.id?standEdge.to:standEdge.from)!;
        // Reserve the swept apron maneuver space before either an adjacent
        // pushback or a turning arrival commits. A stand itself stays available.
        const staged=[...this.intents.values()].find(other=>other.id!==a.id&&dist(other.position,node)<other.length/2+8);
        const entry=sweptGroundDistance({position:a.position,length:a.length,span:a.span??a.length,heading:a.heading??0},path,{position:node,length:staged?.length??75,span:staged?.span??65,heading:staged?.heading??Math.atan2(node.x-stand.x,-(node.z-stand.z))});
        if(Number.isFinite(entry))add(this.zones.get('node:'+node.id)!,entry-12,entry+a.length+100);
        continue;
      }
      if(result.has('node:'+node.id)||node.x<bounds.minX-reach||node.x>bounds.maxX+reach||node.z<bounds.minZ-reach||node.z>bounds.maxZ+reach)continue;
      const p=projectPath(node,path);if(p.distance>=reach||p.along>horizon+margin)continue;const buffer=Math.sqrt(Math.max(0,margin*margin-p.distance*p.distance));
      add(this.zones.get('node:'+node.id)!,p.along-buffer,p.along+buffer);
    }
    // Runway exit and pushback can include short physical paths before a graph edge.
    for(const endpoint of [a.path.at(-1)!]){const nearest=[...this.nodes.values()].find(n=>dist(n,endpoint)<1);if(nearest){const p=projectPath(nearest,a.path);add(this.zones.get('node:'+nearest.id)!,p.along-margin,p.along+margin);}}
    return [...result.values()].sort((a,b)=>a.enter-b.enter||a.zone.id.localeCompare(b.zone.id));
  }
  private occupies(a:GroundIntent,z:GroundZone):boolean {
    if(z.kind==='corridor')return z.edgeIds!.some(id=>this.occupies(a,this.zones.get('edge:'+id)!));
    if(z.kind==='runway')return this.edges.some(e=>e.runway===z.runway&&this.occupies(a,this.zones.get('edge:'+e.id)!));
    if(z.kind!=='edge')return dist(a.position,z.point)<a.length/2+8;
    const p=projectSegment(a.position,z.from!,z.to!);
    // At a junction the node owns the footprint; do not claim every entire outgoing
    // edge simply because the nose is near its endpoint.
    return p.raw>.002&&p.raw<.998&&p.distance<12;
  }
  update(all:GroundIntent[],now:number,manual:'auto'|'important'|'all'='auto',runwayOccupants:Map<string,string[]>=new Map()){
    this.now=now;this.intents=new Map(all.map(a=>[a.id,a]));this.claims.clear();this.limits.clear();this.occupants.clear();
    const alive=new Set(all.map(a=>a.id));for(const id of this.revisions.keys())if(!alive.has(id))this.release(id);
    for(const a of all){if(this.revisions.get(a.id)!==a.revision){this.release(a.id);this.revisions.set(a.id,a.revision);}if(a.moving&&!this.tickets.has(a.id))this.tickets.set(a.id,now);this.claims.set(a.id,this.requests(a));}
    for(const z of this.zones.values()){const inside=all.filter(a=>this.occupies(a,z)).map(a=>a.id).sort();if(inside.length)this.occupants.set(z.id,inside);}
    for(const [runway,owners]of runwayOccupants)if(owners.length&&this.zones.has('runway:'+runway)){const zone='runway:'+runway;this.occupants.set(zone,[...new Set([...(this.occupants.get(zone)??[]),...owners])].sort());}
    for(const [id,r]of this.reservations){const inside=this.occupants.get(id)??[];const a=this.intents.get(r.owner),claim=this.claims.get(r.owner)?.find(c=>c.zone.id===id);r.committed=inside.includes(r.owner)||!!(a?.moving&&!a.held&&claim&&(claim.enter<0||a.speed>.3&&claim.enter<a.speed*a.speed/(2*a.braking)+3));
      if(!a||!r.committed&&(!claim||!a.moving||a.held))this.reservations.delete(id);
    }
    for(const [zone,inside]of this.occupants){const existing=this.reservations.get(zone);const owner=existing&&inside.includes(existing.owner)?existing.owner:inside[0];this.reservations.set(zone,{zone,owner,acquired:existing?.owner===owner?existing.acquired:now,committed:true});}
    const ordered=all.filter(a=>a.moving&&!a.held).sort((a,b)=>this.rank(b)-this.rank(a)||(this.tickets.get(a.id)??now)-(this.tickets.get(b.id)??now)||a.id.localeCompare(b.id));
    const previousWaits=new Map(this.waits);this.waits.clear();this.waitFor.clear();const conflicts=new Map<string,GroundConflict>();
    const decisions=new Map<string,GroundConflict>();
    const contenders=new Map<string,{intent:GroundIntent;claim:Claim}[]>();
    if(manual!=='auto')for(const intent of ordered)for(const claim of this.claims.get(intent.id)??[]){let list=contenders.get(claim.zone.id);if(!list){list=[];contenders.set(claim.zone.id,list);}list.push({intent,claim});}
    if(manual!=='auto')for(const [zoneId,entries]of contenders){
      if(entries.length<2)continue;const zone=this.zones.get(zoneId)!;
      if(zone.kind==='runway')continue;
      if(this.reservations.get(zone.id)?.committed||this.occupants.has(zone.id))continue;
      const pending=this.conflicts.find(c=>c.zone===zone.id&&c.needsDecision);
      const candidates=entries.filter(({intent:a,claim})=>claim.enter>=(pending?.aircraftIds.includes(a.id)?-.1:a.speed*a.speed/(2*a.braking)+3)).map(e=>e.intent);
      if(candidates.length<2||candidates.some(a=>a.urgency>=150)||candidates.some(a=>this.choices.has(a.id)))continue;
      if(candidates.every(a=>this.sameFlow(candidates[0],a,zone)))continue;
      const ids=candidates.map(a=>a.id).sort(),key=zone.id+'|'+ids.join('|'),since=this.conflictSince.get(key)??now;
      const opposing=['edge','corridor'].includes(zone.kind)&&candidates.some(a=>candidates.some(b=>a!==b&&(zone.edgeIds??[zone.edgeId!]).some(id=>this.opposes(a,b,id))));
      this.conflictSince.set(key,since);
      if(manual==='important'&&!opposing&&candidates.length<3&&now-since<15)continue;
      // A controller decision holds every participant outside the shared zone.
      // It is an external clearance dependency, never a fabricated aircraft cycle.
      const c:GroundConflict={id:key,zone:zone.id,label:zone.label,aircraftIds:ids,suggested:candidates[0].id,owner:candidates[0].id,kind:opposing?'opposing':zone.kind==='edge'?'merge':'intersection',since,committed:false,needsDecision:true};
      decisions.set(zone.id,c);conflicts.set(key,c);
      const reservation=this.reservations.get(zone.id);if(reservation&&!reservation.committed)this.reservations.delete(zone.id);
    }
    for(const a of ordered){let stop=Infinity;const blockers=new Set<string>();let first:Claim|undefined;
      let awaiting:GroundConflict|undefined;
      let runwayHold:string|undefined;
      for(const claim of this.claims.get(a.id)??[]){
        if(claim.zone.kind==='runway'&&!a.runwayClearances?.includes(claim.zone.runway!)&&!this.occupants.get(claim.zone.id)?.includes(a.id)){if(Math.max(0,claim.enter)<stop){stop=Math.max(0,claim.enter);first=claim;runwayHold=claim.zone.id;blockers.clear();}continue;}
        const decision=decisions.get(claim.zone.id);
        if(decision?.aircraftIds.includes(a.id)){if(claim.enter<stop){stop=Math.max(0,claim.enter);first=claim;awaiting=decision;blockers.clear();}continue;}
        let r=this.reservations.get(claim.zone.id);const occupied=this.occupants.get(claim.zone.id)??[];
        // Priority is decided when a lease is granted. A newly starting pushback
        // must not steal an arrival's exit space after it entered the corridor.
        const owners=[...new Set([...occupied.filter(id=>id!==a.id),...(r&&r.owner!==a.id?[r.owner]:[])])].filter(id=>{
          // A restored scenario may contain a spaced, same-direction convoy in
          // one corridor. Its leading aircraft must be allowed to clear it;
          // the rear aircraft still waits for the occupied corridor to empty.
          const other=this.intents.get(id),next=a.path[1];
          return !(claim.zone.kind==='corridor'&&occupied.includes(a.id)&&other&&next&&this.sameFlow(a,other,claim.zone)&&projectPath(other.position,a.path).along<.01&&(a.position.x-other.position.x)*(next.x-a.position.x)+(a.position.z-other.position.z)*(next.z-a.position.z)>0);
        });
        if(!owners.length)continue;
        if(claim.enter<stop){stop=Math.max(0,claim.enter);first=claim;awaiting=undefined;blockers.clear();owners.forEach(id=>blockers.add(id));}
        const pair=[a.id,...owners].sort(),key=claim.zone.id+'|'+pair.join('|');
        const incumbent=owners[0],other=this.intents.get(incumbent);const opposing=['edge','corridor'].includes(claim.zone.kind)&&!!other&&(claim.zone.edgeIds??[claim.zone.edgeId!]).some(id=>this.opposes(a,other,id));
        const since=this.conflictSince.get(key)??now;this.conflictSince.set(key,since);
        const kind=opposing?'opposing':claim.zone.kind==='node'||claim.zone.kind==='crossing'?'intersection':'merge';
        conflicts.set(key,{id:key,zone:claim.zone.id,label:claim.zone.label,aircraftIds:pair,suggested:incumbent,owner:incumbent,kind,since,committed:!!r?.committed,needsDecision:false});
      }
      // Do not drive into a physically occupied downstream space just because the
      // stopped aircraft no longer has a taxi clearance or an edge reservation.
      const body=(v:GroundIntent)=>({position:v.position,length:v.length,span:v.span??v.length,heading:v.heading??(v.path[1]?Math.atan2(v.path[1].x-v.position.x,-(v.path[1].z-v.position.z)):0)});
      for(const other of all){if(other.id===a.id)continue;
        const clearance=sweptGroundDistance(body(a),a.path,body(other))-4;
        if(clearance<stop){stop=Math.max(0,clearance);first=undefined;awaiting=undefined;blockers.clear();blockers.add(other.id);}
      }
      // Keep the whole aircraft outside an intersection whose downstream exit
      // cannot fit it. An aircraft already inside must continue to clear it.
      for(const claim of this.claims.get(a.id)??[])if(claim.enter>0&&claim.enter<stop&&claim.leave>stop){stop=claim.enter;first=claim;}
      // An apron feeder is shorter than the swept aircraft envelope. Do not
      // creep off its safe staging position with only a partial set of leases:
      // that would put the tail across opposing traffic before the merge clears.
      if(Number.isFinite(stop))for(const edge of this.edges){const from=this.nodes.get(edge.from)!,to=this.nodes.get(edge.to)!;const merge=from.kind==='pushback'&&to.kind!=='stand'?to:to.kind==='pushback'&&from.kind!=='stand'?from:undefined;if(!merge)continue;
        const p=projectSegment(a.position,from,to);if(p.raw<-.01||p.raw>1.01||p.distance>8||dist(a.position,merge)<12)continue;
        const ahead=projectPath(merge,a.path);if(ahead.distance<12&&stop<ahead.along+a.length+40){stop=0;break;}
      }
      this.limits.set(a.id,stop);
      // Claims beyond the holding position are relinquished; physically occupied
      // resources remain owned until the tail has cleared their node envelope.
      for(const [zone,r]of this.reservations)if(r.owner===a.id&&!r.committed){const claim=this.claims.get(a.id)?.find(c=>c.zone.id===zone);if(stop<=.51||!claim||claim.enter>=stop-.01)this.reservations.delete(zone);}
      for(const claim of this.claims.get(a.id)??[]){if(stop<=.51||claim.enter>=stop-.01)break;const r=this.reservations.get(claim.zone.id);if(!r)this.reservations.set(claim.zone.id,{zone:claim.zone.id,owner:a.id,acquired:now,committed:false});}
      if(blockers.size){const zone=first?.zone.id??'space:'+ [...blockers].sort().join('|');const old=previousWaits.get(a.id);this.waits.set(a.id,{aircraftId:a.id,owners:[...blockers].sort(),zone,reason:first?`${first.zone.label} reserved`:'Downstream space occupied',since:old?.zone===zone?old.since:now,stopDistance:stop,stopPoint:pathPoint(a.path,stop)});this.waitFor.set(a.id,blockers);}
      else if(awaiting||runwayHold){const zone=awaiting?.zone??runwayHold!,old=previousWaits.get(a.id);this.waits.set(a.id,{aircraftId:a.id,owners:[],zone,reason:awaiting?`Ground priority required: ${awaiting.label}`:'Runway crossing clearance required',since:old?.zone===zone?old.since:now,stopDistance:stop,stopPoint:pathPoint(a.path,stop),intervention:true});}
    }
    const grouped=new Map<string,GroundConflict>();
    for(const c of conflicts.values()){const existing=grouped.get(c.zone);if(!existing)grouped.set(c.zone,{...c,aircraftIds:[...c.aircraftIds]});else{existing.aircraftIds=[...new Set([...existing.aircraftIds,...c.aircraftIds])].sort();existing.needsDecision ||= c.needsDecision;existing.committed ||= c.committed;if(c.kind==='opposing')existing.kind='opposing';}}
    this.conflicts=[...grouped.values()].sort((a,b)=>Number(b.needsDecision)-Number(a.needsDecision)||a.since-b.since||a.id.localeCompare(b.id));
    for(const key of this.conflictSince.keys())if(!conflicts.has(key))this.conflictSince.delete(key);
    for(const [id,zone]of this.choices)if(!this.claims.get(id)?.some(c=>c.zone.id===zone))this.choices.delete(id);
    this.cycles=findWaitCycles(this.waitFor);
    // A stale future lease must never sustain a cycle. Physical ownership is
    // deliberately retained, so recovery must use a safe alternate route.
    for(const cycle of this.cycles){const released=this.releaseFuture(cycle,true);if(released)this.record(cycle,`Released ${released} future reservations`);}
  }
  private rank(a:GroundIntent){return a.urgency+(this.choices.get(a.id)?10000:0);}
  private sameFlow(a:GroundIntent,b:GroundIntent,zone:GroundZone){
    if(a.id===b.id)return true;
    const vector=(v:GroundIntent)=>{let best=Infinity,result={x:0,z:0};for(let i=1;i<v.path.length;i++){const from=v.path[i-1],to=v.path[i],projection=projectSegment(zone.point,from,to),length=dist(from,to);if(length>.01&&projection.distance<best){best=projection.distance;result={x:(to.x-from.x)/length,z:(to.z-from.z)/length};}}return result;};
    const x=vector(a),y=vector(b);return x.x*y.x+x.z*y.z>.87;
  }
  private opposes(a:GroundIntent,b:GroundIntent,edgeId:string){const e=this.edgeMap.get(edgeId)!;const direction=(v:GroundIntent)=>{const i=v.route.findIndex((id,i)=>i>0&&this.edge(v.route[i-1],id)?.id===edgeId);return i<0?0:v.route[i-1]===e.from?1:-1;};return direction(a)*direction(b)<0;}
  limit(id:string){return this.limits.get(id)??Infinity;}
  consume(id:string,metres:number){const remaining=this.limits.get(id);if(remaining!==undefined)this.limits.set(id,Math.max(0,remaining-metres));}
  releaseFuture(ids:string[],recover=false){let count=0;for(const [zone,r]of this.reservations){const a=this.intents.get(r.owner),stationaryFuture=recover&&a&&a.speed<.3&&!this.occupants.get(zone)?.includes(r.owner);if(ids.includes(r.owner)&&(!r.committed||stationaryFuture)){this.reservations.delete(zone);count++;}}return count;}
  choose(conflictId:string,id?:string):boolean {
    const c=this.conflicts.find(c=>c.id===conflictId);if(!c||c.committed)return false;const winner=id??c.suggested;if(!c.aircraftIds.includes(winner))return false;
    for(const participant of c.aircraftIds)this.choices.delete(participant);this.choices.set(winner,c.zone);this.releaseFuture(c.aircraftIds);return true;
  }
  record(ids:string[],action:string){const last=this.recoveries.at(-1);if(last?.action===action&&last.aircraftIds.join()===ids.join()&&this.now-last.time<10)return;this.recoveries.push({time:this.now,aircraftIds:[...ids],action});if(this.recoveries.length>50)this.recoveries.shift();}
  markIntervention(id:string){const wait=this.waits.get(id);if(wait)wait.intervention=true;}
  reportPhysicalWait(id:string,owner:string,now:number,position:Point){
    const old=this.physicalHolds.get(id),since=old?.owner===owner&&now-old.last<1?old.since:now;this.physicalHolds.set(id,{owner,since,last:now});
    this.waits.set(id,{aircraftId:id,owners:[owner],zone:'envelope:'+owner,reason:'Swept turning envelope occupied',since,stopDistance:0,stopPoint:{...position}});this.waitFor.set(id,new Set([owner]));this.cycles=findWaitCycles(this.waitFor);
  }
  clearPhysicalWait(id:string){this.physicalHolds.delete(id);}
}
