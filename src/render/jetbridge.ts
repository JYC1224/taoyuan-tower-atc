import * as THREE from 'three';
import type {Aircraft} from '../types';
import {FLEET} from '../data/fleet';
import type {Gate} from '../data/airport';
import {box,cylinder,material} from './primitives';
import {batchStatic} from './surfaceDetail';

export interface BridgeVisual {group:THREE.Group;gate:string;update:(aircraft:Aircraft|undefined,docked:boolean,dt:number)=>void;setDistance:(distance:number)=>void}
const panel=material('#b2bcc1',.62,.2),bellows=material('#49545c',.9),frame=material('#7e929f',.4,.4);
const glazing=new THREE.MeshStandardMaterial({color:'#597382',roughness:.22,metalness:.28,envMapIntensity:.8});

export function createJetbridge(gate:Gate,concourseZ:number):BridgeVisual{
 const toward=Math.sign(concourseZ-gate.z),group=new THREE.Group(),base=new THREE.Vector3(gate.x+toward*18,5.9,concourseZ-toward*16),arm=new THREE.Group(),elbow=new THREE.Group(),cab=new THREE.Group();
 group.position.copy(base);group.position.y=0;
 box(arm,3.2,2.8,1,0,0,0,panel);box(arm,3.23,1.3,1,0,.15,0,glazing);box(arm,3.4,.22,1,0,1.45,0,panel);for(let z=-.4;z<.5;z+=.2)for(const side of [-1,1])box(arm,.045,1.4,.009,side*1.63,.15,z,frame);batchStatic(arm);
 box(elbow,1,2.8,3.2,0,0,0,panel);box(elbow,1,1.3,3.23,0,.15,0,glazing);batchStatic(elbow);
 box(cab,4,3.1,3.4,0,0,0,bellows);box(cab,3.6,.18,3.5,0,1.58,0,panel);batchStatic(cab);
 const wheelPost=cylinder(group,.18,.21,1,0,1,0,frame,12);const feet=new THREE.Group();for(const side of [-1,1]){const wheel=cylinder(feet,.38,.38,.27,side*.7,.38,0,bellows,16);wheel.rotation.z=Math.PI/2;}batchStatic(feet);group.add(arm,elbow,cab,feet);
 cylinder(group,2.2,2.2,3.2,0,5.9,0,panel,24);cylinder(group,.34,.5,4.4,0,2.2,0,frame,16);
 let extension=.65;
 const update=(a:Aircraft|undefined,docked:boolean,dt:number)=>{
  extension=THREE.MathUtils.lerp(extension,docked?1:.65,1-Math.exp(-dt*.8));const p=FLEET[a?.type??'A330'],r=p.id==='A380'?3.55:p.id.startsWith('B77')?3.1:p.id.startsWith('B78')?2.88:p.id.startsWith('A35')?2.98:p.id.startsWith('A33')?2.82:p.id.startsWith('B73')||p.id==='B38M'?1.88:1.98;
  // Connect the terminal-facing forward door. The simulation derives the actual
  // parked heading from its pushback node; never rotate/reposition the aircraft.
  const doorZ=gate.z+toward*p.length*.36,endZ=(doorZ-base.z)*extension,endY=r+(p.span>45?2.6:1.65)+.45,dy=endY-base.y;
  arm.position.set(0,(base.y+endY)/2,endZ/2);arm.scale.z=Math.hypot(endZ,dy);arm.rotation.x=-Math.atan2(dy,endZ);
  const reach=18-r-2.0,tipX=-toward*reach*extension;elbow.position.set(tipX/2,endY,endZ);elbow.scale.x=Math.max(1,Math.abs(tipX));cab.position.set(tipX,endY,endZ);wheelPost.position.set(tipX+toward*3,Math.max(.5,endY-1.4)/2,endZ);wheelPost.scale.y=Math.max(.5,endY-1.4);feet.position.set(wheelPost.position.x,0,endZ);
 };update(undefined,false,0);
 const detail=new THREE.Group();for(const child of [...group.children])detail.add(child);group.add(detail);const proxy=box(group,3.2,2.8,Math.abs(gate.z-base.z)*.72,0,5.5,(gate.z-base.z)*.36,panel);proxy.visible=false;
 const setDistance=(distance:number)=>{detail.visible=distance<650;proxy.visible=distance>=650&&distance<7000;};return{group,gate:gate.id,update,setDistance};
}
