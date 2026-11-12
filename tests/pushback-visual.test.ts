import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createPushbackTug,updatePushbackTug} from '../src/render/pushbackTug';
import {FLEET} from '../src/data/fleet';
import type {Aircraft,AircraftState} from '../src/types';

const aircraft=(state:AircraftState)=>({state} as Aircraft);
test('towbar connects to the nose gear for narrow and wide aircraft',()=>{
 for(const type of ['A320','A350','B77W']){
  const tug=createPushbackTug(new THREE.Group(),FLEET[type].length);
  assert.ok(Math.abs(tug.baseZ+5.4+FLEET[type].length*.34)<1e-9);
  updatePushbackTug(tug,aircraft('PUSHING'),0);assert.equal(tug.group.visible,true);
 }
});
test('tug remains attached during a hold and leaves independently after pushback',()=>{
 const scene=new THREE.Scene(),plane=new THREE.Group();scene.add(plane);plane.position.set(100,0,200);plane.rotation.y=.8;
 const tug=createPushbackTug(plane,FLEET.A350.length);
 updatePushbackTug(tug,aircraft('PUSHING'),1);assert.equal(tug.group.parent,plane);
 updatePushbackTug(tug,aircraft('ENGINE_START'),0);assert.equal(tug.group.parent,scene);const p=tug.group.position.clone();
 plane.position.x+=20;updatePushbackTug(tug,aircraft('ENGINE_START'),0);assert.ok(tug.group.position.distanceTo(p)<1e-8);
 updatePushbackTug(tug,aircraft('ENGINE_START'),4);assert.ok(tug.group.position.distanceTo(p)>5);
 updatePushbackTug(tug,aircraft('READY_TO_TAXI'),4);assert.equal(tug.group.visible,false);assert.equal(tug.group.parent,plane);
});
