import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {RefCountedCache} from '../src/render/refCountedCache';

test('shared resources live until their final owner releases them',()=>{
 const disposed:object[]=[],cache=new RefCountedCache<object>(value=>disposed.push(value));let builds=0;
 const create=()=>{builds++;return {};},a=cache.acquire('same',create),b=cache.acquire('same',create);
 assert.equal(a.value,b.value);assert.equal(builds,1);
 a.release();a.release();assert.equal(disposed.length,0);
 b.release();assert.deepEqual(disposed,[a.value]);
 const c=cache.acquire('same',create);assert.notEqual(c.value,a.value);assert.equal(builds,2);c.release();assert.equal(disposed.length,2);
});

test('aircraft share matching skins without losing textures when one aircraft retires',async()=>{
 const gradient={addColorStop:()=>{}};
 const context=new Proxy<Record<string,unknown>>({}, {get:(target,key)=>key in target?target[key as string]:key==='measureText'?()=>({width:40}):key==='createLinearGradient'||key==='createRadialGradient'?()=>gradient:()=>{},set:(target,key,value)=>{target[key as string]=value;return true;}});
 const previousDocument=globalThis.document,previousImage=globalThis.Image;
 Object.defineProperty(globalThis,'document',{configurable:true,value:{baseURI:'http://localhost/',createElement:()=>({width:0,height:0,getContext:()=>context})}});
 Object.defineProperty(globalThis,'Image',{configurable:true,value:class {onload?:()=>void;onerror?:()=>void;naturalWidth=100;naturalHeight=100;set src(_url:string){queueMicrotask(()=>this.onload?.());}}});
 try{
  const {fuselage,tailSkin,releaseAircraftSkin}=await import('../src/render/aircraftSkin');
  const {FLEET,AIRLINES}=await import('../src/data/fleet');
  const a=fuselage(FLEET.A320,AIRLINES.EVA,1.98).material as THREE.MeshPhysicalMaterial,b=fuselage(FLEET.A320,AIRLINES.EVA,1.98).material as THREE.MeshPhysicalMaterial,c=fuselage(FLEET.A320,AIRLINES.CAL,1.98).material as THREE.MeshPhysicalMaterial;
  assert.equal(a.map,b.map);assert.notEqual(a.map,c.map);assert.equal(a.roughnessMap,c.roughnessMap);assert.equal(a.normalMap,c.normalMap);
  let bodyDisposals=0,roughDisposals=0;a.map!.addEventListener('dispose',()=>bodyDisposals++);a.roughnessMap!.addEventListener('dispose',()=>roughDisposals++);
  releaseAircraftSkin(a);releaseAircraftSkin(a);assert.equal(bodyDisposals,0);assert.equal(roughDisposals,0);
  releaseAircraftSkin(b);assert.equal(bodyDisposals,1);assert.equal(roughDisposals,0);
  releaseAircraftSkin(c);assert.equal(roughDisposals,1);
  const tailA=tailSkin(AIRLINES.EVA),tailB=tailSkin(AIRLINES.EVA);assert.equal(tailA.map,tailB.map);let tailDisposals=0;tailA.map!.addEventListener('dispose',()=>tailDisposals++);
  releaseAircraftSkin(tailA);assert.equal(tailDisposals,0);releaseAircraftSkin(tailB);assert.equal(tailDisposals,1);
 }finally{
  Object.defineProperty(globalThis,'document',{configurable:true,value:previousDocument});
  Object.defineProperty(globalThis,'Image',{configurable:true,value:previousImage});
 }
});
