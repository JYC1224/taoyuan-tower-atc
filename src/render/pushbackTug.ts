import * as THREE from 'three';
import type {Aircraft} from '../types';
import {box,cylinder,material} from './primitives';

export interface PushbackTug {
 group:THREE.Group; aircraft:THREE.Group; baseZ:number;
 mode:'hidden'|'attached'|'departing'; elapsed:number;
 origin:THREE.Vector3; forward:THREE.Vector3; side:THREE.Vector3; yaw:number;
}

/** The towbar reaches the same -0.34 × length nose-gear anchor used by the aircraft. */
export function createPushbackTug(aircraft:THREE.Group,length:number):PushbackTug{
 const group=new THREE.Group(),yellow=material('#d9b143',.72,.12),white=material('#d8dedb',.7,.12),dark=material('#34454b',.78,.12),glass=material('#354e59',.26,.3),rubber=material('#222a2c',.94),metal=material('#9eaaa9',.55,.35),amber=material('#f09c32',.45);
 const baseZ=-length*.34-5.4;group.position.z=baseZ;
 box(group,3,.68,4.75,0,.71,0,yellow);box(group,2.55,.75,2.2,0,1.39,-.68,yellow);
 box(group,2.0,.54,.06,0,1.47,-1.81,glass);
 for(const side of [-1,1]){
  box(group,.06,.52,1.55,side*1.29,1.48,-.7,glass);
  for(const z of [-1.55,1.35]){
   const wheel=cylinder(group,.48,.48,.28,side*1.52,.48,z,rubber,16);wheel.rotation.z=Math.PI/2;
   const hub=cylinder(group,.21,.21,.30,side*1.52,.48,z,metal,12);hub.rotation.z=Math.PI/2;
  }
  box(group,.20,.17,.09,side*1.05,.84,-2.39,white);
  box(group,.28,.14,.11,side*1.1,.8,2.39,dark);
 }
 box(group,3.15,.2,.3,0,.42,-2.43,metal);box(group,2.3,.10,1.9,0,1.82,-.68,dark);
 cylinder(group,.23,.23,.16,0,1.96,-.68,amber,12);
 // Conventional towbar ends at the nose wheel rather than stopping at the nose tip.
 box(group,.20,.19,3.05,0,.38,3.875,metal);box(group,.52,.16,.25,0,.38,5.32,yellow);
 aircraft.add(group);group.visible=false;
 return {group,aircraft,baseZ,mode:'hidden',elapsed:0,origin:new THREE.Vector3(),forward:new THREE.Vector3(),side:new THREE.Vector3(),yaw:0};
}

export function updatePushbackTug(tug:PushbackTug,a:Aircraft,dt:number){
 const {group,aircraft}=tug,pushing=a.state==='PUSHBACK_CLEARED'||a.state==='PUSHING';
 if(pushing){
  if(group.parent!==aircraft)aircraft.add(group);
  group.position.set(0,0,tug.baseZ);group.rotation.set(0,0,0);group.visible=true;tug.mode='attached';tug.elapsed=0;return;
 }
 if(tug.mode==='attached'){
  if(['ENGINE_START','READY_TO_TAXI','TAXI_CLEARED'].includes(a.state)&&aircraft.parent){
   aircraft.updateWorldMatrix(true,true);aircraft.parent.attach(group);
   tug.origin.copy(group.position);tug.yaw=group.rotation.y;
   tug.forward.set(0,0,-1).applyQuaternion(group.quaternion).setY(0).normalize();
   tug.side.set(1,0,0).applyQuaternion(group.quaternion).setY(0).normalize();
   tug.mode='departing';tug.elapsed=0;
  }else{group.visible=false;tug.mode='hidden';}
 }
 if(tug.mode==='departing'){
  tug.elapsed+=Math.max(0,dt);const forward=Math.min(7,tug.elapsed*1.5),side=Math.max(0,tug.elapsed-2)*2;
  group.position.copy(tug.origin).addScaledVector(tug.forward,forward).addScaledVector(tug.side,side);
  const turn=THREE.MathUtils.smoothstep(tug.elapsed,2,5);group.rotation.y=tug.yaw-turn*Math.PI/2;
  if(tug.elapsed>=8){aircraft.add(group);group.visible=false;group.position.set(0,0,tug.baseZ);group.rotation.set(0,0,0);tug.mode='hidden';}
 }
}
