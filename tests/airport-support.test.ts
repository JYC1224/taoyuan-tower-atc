import test from 'node:test';
import assert from 'node:assert/strict';
import {gates,runways,taxiEdges,taxiNodes} from '../src/data/airport';
import {FLEET} from '../src/data/fleet';
import {concourseForGate,planSupportBays,SUPPORT_BAY_RADIUS,SUPPORT_PATH_CLEARANCE,windsockAngles} from '../src/render/supportLayout';

function pointSegmentDistance(x:number,z:number,ax:number,az:number,bx:number,bz:number){
 const dx=bx-ax,dz=bz-az,denominator=dx*dx+dz*dz;
 const t=denominator?Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/denominator)):0;
 return Math.hypot(x-(ax+t*dx),z-(az+t*dz));
}

test('equipment bays keep the supported fleet clear of taxi, stand and runway centrelines',()=>{
 const bays=planSupportBays(gates,taxiNodes,taxiEdges),nodes=new Map(taxiNodes.map(node=>[node.id,node]));
 assert(bays.length>=25);assert.equal(new Set(bays.map(b=>b.gate)).size,bays.length);
 for(const profile of Object.values(FLEET))assert(Math.max(profile.length/2,Math.hypot(profile.span/2,profile.length*.25))<39,profile.id);
 for(const bay of bays){
  assert(Math.abs(bay.z-bay.front)>=6-1e-9); // The 6 m deep bay sits outside the facade.
  for(const edge of taxiEdges){const a=nodes.get(edge.from)!,b=nodes.get(edge.to)!;assert(pointSegmentDistance(bay.x,bay.z,a.x,a.z,b.x,b.z)>=SUPPORT_PATH_CLEARANCE-1e-7,`${bay.gate}: ${edge.id}`);}
  for(const runway of runways)if(Math.abs(bay.x-runway.x)<runway.length/2+39)assert(Math.abs(bay.z-runway.z)>runway.width/2+39+SUPPORT_BAY_RADIUS);
 }
});

test('a route crossing a candidate equipment bay suppresses that bay',()=>{
 const gate=gates.find(g=>g.id==='A1')!,c=concourseForGate(gate),side=Math.sign(gate.z-c.z),x=gate.x-32,z=c.z+side*(c.halfDepth+6);
 const nodes=[{id:'a',x:x-20,z,kind:'intersection' as const},{id:'b',x:x+20,z,kind:'intersection' as const}];
 const edges=[{...taxiEdges[0],from:'a',to:'b'}];
 assert.deepEqual(planSupportBays([gate],nodes,edges),[]);
});

test('windsocks point downwind and extend as wind strengthens',()=>{
 const alongRunway=windsockAngles(49.08,18,49.08),crosswind=windsockAngles(139.08,18,49.08),calm=windsockAngles(49.08,0,49.08);
 assert(Math.abs(Math.sin(alongRunway.yaw)+1)<1e-10);assert(Math.abs(Math.cos(alongRunway.yaw))<1e-10);
 assert(Math.abs(Math.sin(crosswind.yaw))<1e-10);assert(Math.abs(Math.cos(crosswind.yaw)+1)<1e-10);
 assert(calm.droop>alongRunway.droop);assert.equal(windsockAngles(49.08,100,49.08).droop,alongRunway.droop);
});
