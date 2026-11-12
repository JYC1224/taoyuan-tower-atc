import test from 'node:test';
import assert from 'node:assert/strict';
import coast from '../src/data/coastline.json';
import {isSea} from '../src/render/coastline';
import {terrainHeight} from '../src/render/terrain';

test('mapped northwestern shoreline separates the airport and inland approaches from the sea',()=>{
 assert.ok(coast.points.length>200);
 assert.equal(isSea(0,0),false);
 assert.equal(isSea(0,-6000),true);
 assert.equal(isSea(-24000,0),false);
 assert.equal(isSea(-24000,-10000),true);
 assert.equal(isSea(24000,5000),false);
 assert.equal(isSea(24000,-9000),true);
 assert.equal(coast.metadata.snapshot,'2026-07-15T15:22:01Z');
});

test('indexed shoreline agrees with the original polygon test throughout the region',()=>{
 const limit=160000,points=coast.points as [number,number][],polygon:[number,number][]=[[-limit,points[0][1]],...points,[limit,points.at(-1)![1]],[limit,-limit],[-limit,-limit]];
 const original=(x:number,z:number)=>{let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [xi,zi]=polygon[i],[xj,zj]=polygon[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)inside=!inside;}return inside;};
 for(let x=-60000;x<=60000;x+=2300)for(let z=-30000;z<=30000;z+=1700)assert.equal(isSea(x,z),original(x,z),`${x},${z}`);
});

test('terrain follows the regional elevations while preserving the airport and sea plane',()=>{
 assert.equal(terrainHeight(0,0),0);assert.equal(terrainHeight(0,-6000),0);
 assert.ok(terrainHeight(0,15000)>40);assert.ok(terrainHeight(-30000,30000)>300);
 assert.equal(terrainHeight(70000,0),0);
});
