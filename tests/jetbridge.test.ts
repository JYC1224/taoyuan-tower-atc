import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import type {Aircraft} from '../src/types';
import {gates} from '../src/data/airport';
import {FLEET} from '../src/data/fleet';
import {createJetbridge} from '../src/render/jetbridge';
import {T1_A_PASSENGER as L} from '../src/render/terminalPassengerLayout';
import {GATE_CONCOURSES} from '../src/render/terminalConcourseLayout';

test('a raised terminal interface preserves the fully docked aircraft door for every compatible aircraft',()=>{
 const gate=gates.find(g=>g.id==='A7')!,original=createJetbridge(gate,-198),raised=createJetbridge(gate,-198,{floorY:L.loungeFloor,z:L.roomNear-L.bridgeSetback});
 for(const p of Object.values(FLEET).filter(p=>p.span<=gate.maxSpan)){
  const a={type:p.id,position:{x:gate.x,y:0,z:gate.z},heading:0} as Aircraft,before=JSON.stringify(a);
  original.update(a,true,60);raised.update(a,true,60);
  original.group.updateMatrixWorld(true);raised.group.updateMatrixWorld(true);
  const oldDoor=original.group.getObjectByName('boarding-cab')!.getWorldPosition(new Vector3()),newDoor=raised.group.getObjectByName('boarding-cab')!.getWorldPosition(new Vector3());
  assert.ok(oldDoor.distanceTo(newDoor)<1e-8,`${p.id}: moving the terminal connection must not move the aircraft-side door`);
  assert.equal(JSON.stringify(a),before,'bridge animation must never reposition a parked aircraft');
 }
 assert.ok(raised.group.position.z<L.bounds.z-L.bounds.depth/2,'the rotunda is on the apron side of the new facade');
 assert.ok(raised.group.position.z+2.2<L.bounds.z-L.bounds.depth/2-.4,'the rotunda must not project through the boarding doorway');
});

test('repositioning B, C and D bridge rotundas keeps the aircraft-side docking points',()=>{
 for(const row of GATE_CONCOURSES)for(const {gate,bridge} of row.gates){
  const original=createJetbridge(gate,row.bounds.z),updated=createJetbridge(gate,row.bounds.z,bridge);
  assert.equal(updated.group.position.x,bridge.x);
  assert.equal(updated.group.position.z,bridge.z);
  for(const p of Object.values(FLEET).filter(p=>p.span<=gate.maxSpan)){
   const aircraft={type:p.id,position:{x:gate.x,y:0,z:gate.z},heading:gate.heading} as Aircraft;
   original.update(aircraft,true,60);updated.update(aircraft,true,60);
   const before=original.group.getObjectByName('boarding-cab')!.getWorldPosition(new Vector3());
   const after=updated.group.getObjectByName('boarding-cab')!.getWorldPosition(new Vector3());
   assert.ok(before.distanceTo(after)<1e-8,`${gate.id} / ${p.id}`);
  }
 }
});
