import test from 'node:test';
import assert from 'node:assert/strict';
import campus from '../src/data/terminalCore.json';
import data from '../src/data/landside.json';
import {runways,taxiEdges,taxiNodes,tower} from '../src/data/airport';
import {insidePolygon,parkingLayout} from '../src/render/terminalCore';
import {distanceToSegment,roadIsVisible,roadPointClear,roadWidth,taxiCorridors,type MapFeature} from '../src/render/landsideGeometry';

test('tower campus uses dated mapped closed footprints and the tower fits its footprint',()=>{
 assert.equal(campus.features.length,6);
 for(const f of campus.features){assert.ok(f.timestamp<='2026-09-06T04:00:00Z');assert.deepEqual(f.points[0],f.points.at(-1));}
 const footprint=campus.features.find(f=>f.id===758856659)!;
 assert.ok(insidePolygon(tower,footprint.points));
});

test('illustrative parking stays inside both mapped lots and clear of surface roads and aircraft corridors',()=>{
 const features=data.features as unknown as MapFeature[],layout=parkingLayout(features),corridors=taxiCorridors(taxiNodes,taxiEdges);
 const roads=features.filter(roadIsVisible).flatMap(f=>f.points.slice(1).map((b,i)=>({a:{x:f.points[i][0],z:f.points[i][1]},b:{x:b[0],z:b[1]},width:roadWidth(f.tags)})));
 for(const id of [24000909,395947062])assert.ok(layout.some(p=>p.lot===id),`parking lot ${id} has details`);
 for(const p of layout){
  const lot=features.find(f=>f.id===p.lot)!;
  assert.ok([-3,3].every(dx=>[-1.4,1.4].every(dz=>insidePolygon({x:p.x+dx,z:p.z+dz},lot.points))));
  assert.ok(roadPointClear(p,4,corridors,runways,5));
  assert.ok(roads.every(r=>distanceToSegment(p,r.a,r.b)>=r.width/2+4));
 }
 assert.deepEqual(layout,parkingLayout(features));
});
