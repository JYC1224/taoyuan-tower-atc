import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {FLEET} from '../src/data/fleet';
import type {Aircraft,AircraftState} from '../src/types';

Object.defineProperty(globalThis,'document',{value:{baseURI:'http://localhost/'},configurable:true});
const {createStandService,updateStandService,createMarshaller,animateMarshaller}=await import('../src/render/groundCrew');

const airplane=(state:AircraftState,kind:'arrival'|'departure'='departure',speed=0)=>({state,kind,speed,position:{x:0,y:0,z:0}} as Aircraft);
test('baggage equipment works only while stopped at a stand and reverses for unloading',()=>{
 const service=createStandService(new THREE.Group(),FLEET.A320,1.98,3.63),a=airplane('REQUESTING_PUSHBACK');
 updateStandService(service,a,10);assert.equal(service.group.visible,true);const start=service.moving[0].position.x;
 updateStandService(service,a,11);assert.ok(service.moving[0].position.x<start);
 a.kind='arrival';a.state='DOCKED';updateStandService(service,a,10);const unloading=service.moving[0].position.x;
 updateStandService(service,a,11);assert.ok(service.moving[0].position.x>unloading);
 a.state='PUSHING';updateStandService(service,a,12);assert.equal(service.group.visible,false);
 a.state='PARKED';a.speed=1;updateStandService(service,a,12);assert.equal(service.group.visible,false);
});
test('freighter has an animated cargo unit and marshaller wands can signal',()=>{
 const plane=new THREE.Group(),service=createStandService(plane,FLEET.B77F,3.1,5.7),a=airplane('DOCKED','arrival');
 updateStandService(service,a,1);const x=service.moving[0].position.x;
 updateStandService(service,a,2);assert.equal(service.group.visible,true);assert.ok(service.moving[0].position.x>x);
 const marshal=createMarshaller(plane,FLEET.B77F.length);animateMarshaller(marshal.arms,1);
 assert.ok(marshal.arms[0].rotation.z<0);assert.ok(marshal.arms[1].rotation.z>0);
});
