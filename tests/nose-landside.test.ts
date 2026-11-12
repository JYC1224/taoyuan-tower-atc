import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../src/data/landside.json';
import {FLEET} from '../src/data/fleet';
import {runways,taxiEdges,taxiNodes} from '../src/data/airport';
import {noseSpec} from '../src/render/aircraftNose';
import {distanceToSegment,roadIsVisible,roadPointClear,roadWidth,taxiCorridors,type MapFeature} from '../src/render/landsideGeometry';

test('cockpit family panes reach the forward centre and retain correct family counts',()=>{
 for(const [id,count] of Object.entries({A320:3,A321:3,A330:3,A350:3,B789:2,B78X:2,B77W:3,B77F:3})){
  const spec=noseSpec(FLEET[id]);assert.equal(spec.panes.length,count,id);
  assert.ok(spec.panes[0].some(([,angle])=>angle===0),`${id} windshield meets front centreline`);
  assert.ok(spec.length>3&&spec.length<FLEET[id].length*.2,id);
 }
 assert.equal(noseSpec(FLEET.A320).length,noseSpec(FLEET.A321).length);
 assert.equal(noseSpec(FLEET.B789).length,noseSpec(FLEET.B78X).length);
 assert.ok(noseSpec(FLEET.A350).mask);assert.equal(noseSpec(FLEET.B789).mask,null);
});

test('mapped roads are dated, identifiable and keep underground ways underground',()=>{
 const features=data.features as unknown as MapFeature[];
 assert.ok(features.some(f=>f.kind==='apron'));
 assert.ok(features.some(f=>f.kind==='parking'));
 for(const name of ['航站南路','航站北路'])assert.ok(features.some(f=>f.tags.name===name&&roadIsVisible(f)),name);
 const underground=features.filter(f=>f.kind==='road'&&(f.tags.tunnel==='yes'||f.tags.tunnel==='building_passage'));
 assert.ok(underground.length>0);assert.ok(underground.every(f=>!roadIsVisible(f)));
 assert.match(data.metadata.method,/Incomplete subset/);
 assert.equal(data.metadata.unchangedBefore,'2026-09-06T04:00:00Z');
});

test('visible terminal road chunks retain clearance from runways and taxi routes',()=>{
 const corridors=taxiCorridors(taxiNodes,taxiEdges),features=data.features as unknown as MapFeature[];let checked=0;
 for(const f of features.filter(f=>['航站南路','航站北路'].includes(f.tags.name||'')&&roadIsVisible(f))){
  const width=roadWidth(f.tags);
  for(let i=1;i<f.points.length;i++){
   const [ax,az]=f.points[i-1],[bx,bz]=f.points[i],length=Math.hypot(bx-ax,bz-az),steps=Math.max(1,Math.ceil(length/8));
   for(let k=0;k<steps;k++){
    const center=(k+.5)/steps,p={x:ax+(bx-ax)*center,z:az+(bz-az)*center};
    if(!roadPointClear(p,width/2,corridors,runways,5))continue;
    for(const t of [k/steps,(k+1)/steps]){
     const end={x:ax+(bx-ax)*t,z:az+(bz-az)*t};
     for(const c of corridors)assert.ok(distanceToSegment(end,c.a,c.b)>=c.halfWidth+width/2);
     for(const r of runways)assert.ok(Math.abs(end.x-r.x)>=r.length/2+width/2||Math.abs(end.z-r.z)>=r.width/2+width/2);
    }
    checked++;
   }
  }
 }
 assert.ok(checked>20,`only ${checked} visible chunks`);
});
