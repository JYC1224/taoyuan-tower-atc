import * as THREE from 'three';
import {box,cylinder,material} from './primitives';
import {batchStatic} from './surfaceDetail';

export interface ServiceVehicleVisual {group:THREE.Group;phase:number;speed:number;lane:number}

const paint={
 white:material('#d8dedc',.76,.12),
 yellow:material('#e6b93c',.68,.14),
 blue:material('#567b8c',.66,.2),
 red:material('#b94c3c',.72,.12),
 dark:material('#34464d',.84,.08),
 glass:material('#395662',.28,.28),
 rubber:material('#22292b',.96,.02),
 metal:material('#a8b3b3',.5,.42),
 orange:material('#ee8a32',.72,.08),
 bag:material('#736f61',.94,.01)
};

function wheel(parent:THREE.Group,x:number,z:number,r=.34){
 const tire=cylinder(parent,r,r,.24,x,r+.08,z,paint.rubber,12);tire.rotation.z=Math.PI/2;
 const hub=cylinder(parent,r*.42,r*.42,.255,x,r+.08,z,paint.metal,10);hub.rotation.z=Math.PI/2;
}

function cab(parent:THREE.Group,x=0,z=-2.5,width=2.05){
 box(parent,width,1.55,2.15,x,1.55,z,paint.white);
 box(parent,width*.78,.78,.06,x,1.92,z-1.09,paint.glass);
 box(parent,width*.78,.74,.06,x,1.92,z+1.09,paint.glass);
 for(const side of [-1,1]){
  box(parent,.055,.70,1.16,x+side*(width/2+.012),1.94,z,paint.dark);
  box(parent,.04,.56,.73,x+side*(width/2+.04),1.96,z-.12,paint.glass);
 }
 box(parent,width+.18,.16,.18,x,2.37,z,paint.yellow);
 cylinder(parent,.25,.25,.18,x,2.52,z,paint.orange,10);
 for(const side of [-1,1]){
  box(parent,.13,.20,.12,x+side*(width/2-.16),1.35,z-1.11,paint.white);
  box(parent,.13,.20,.12,x+side*(width/2-.16),1.35,z+1.11,paint.red);
 }
}

function baggageTrain(parent:THREE.Group){
 box(parent,1.8,.55,3.65,0,.58,-.45,paint.yellow);cab(parent,0,-.72,1.9);
 for(const s of [-1,1])for(const z of [-1.6,.7])wheel(parent,s*.96,z,.34);
 box(parent,.13,.15,1.35,0,.39,1.55,paint.metal);
 for(const [index,z] of [3.05,6.2].entries()){
  box(parent,2.1,.22,2.5,0,.43,z,paint.dark);
  for(const s of [-1,1])for(const dz of [-.78,.78])wheel(parent,s*1.03,z+dz,.29);
  for(let j=0;j<3;j++)box(parent,.57,.78,.78,-.62+j*.62,1.02,z-.05,(index+j)%3===0?paint.blue:(index+j)%3===1?paint.bag:paint.white);
  for(const s of [-1,1])box(parent,.09,.62,2.37,s*1.03,.84,z,paint.metal);
  if(index===0)box(parent,.12,.13,1.0,0,.46,z+1.78,paint.metal);
 }
}

function passengerBus(parent:THREE.Group){
 box(parent,2.55,.45,10.8,0,.62,0,paint.dark);
 box(parent,2.48,2.72,10.1,0,1.88,0,paint.white);
 box(parent,2.50,.34,10.15,0,.84,0,paint.blue);
 box(parent,2.52,.20,10.05,0,2.77,0,paint.white);
 for(const side of [-1,1]){
  for(let i=0;i<7;i++){
   const z=-4.0+i*1.28;
   box(parent,.045,1.02,1.06,side*1.254,2.12,z,paint.glass);
   box(parent,.06,.10,1.11,side*1.28,2.68,z,paint.metal);
  }
  box(parent,.06,.72,.72,side*1.28,1.77,4.48,paint.glass);
  for(const z of [-3.5,3.65])wheel(parent,side*1.25,z,.43);
 }
 box(parent,1.95,1.52,.06,0,2.12,-5.09,paint.glass);
 box(parent,1.95,1.43,.06,0,2.08,5.09,paint.glass);
 box(parent,2.75,.22,.24,0,.57,-5.18,paint.metal);
 box(parent,2.75,.20,.24,0,.56,5.18,paint.metal);
 cylinder(parent,.26,.26,.4,0,2.92,3.25,paint.dark,12);
}

function fuelTanker(parent:THREE.Group){
 box(parent,2.2,.48,8.1,0,.59,-.05,paint.dark);cab(parent,0,-2.7,2.08);
 for(const s of [-1,1])for(const z of [-3.45,-1.72,1.95,3.0])wheel(parent,s*1.12,z,.4);
 const tank=new THREE.Mesh(new THREE.CylinderGeometry(1.08,1.08,5.1,20,1,false),paint.white);
 tank.rotation.x=Math.PI/2;tank.position.set(0,2.02,.75);tank.castShadow=true;tank.receiveShadow=true;parent.add(tank);
 for(const z of [-1.0,2.4]){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.08,.075,8,24),paint.metal);
  ring.position.set(0,2.02,z);ring.castShadow=true;parent.add(ring);
 }
 const stripe=new THREE.Mesh(new THREE.CylinderGeometry(1.093,1.093,.27,20,1,true),paint.yellow);
 stripe.rotation.x=Math.PI/2;stripe.position.set(0,2.02,.45);parent.add(stripe);
 box(parent,.56,.14,1.5,0,3.14,.8,paint.metal);
 box(parent,.12,.08,1.42,-.43,3.13,.8,paint.metal);box(parent,.12,.08,1.42,.43,3.13,.8,paint.metal);
}

function cateringTruck(parent:THREE.Group){
 box(parent,2.22,.45,9.2,0,.58,-.05,paint.dark);cab(parent,0,-3.35,2.0);
 box(parent,2.38,3.28,5.08,0,2.27,1.35,paint.white);
 box(parent,2.40,.32,5.1,0,1.14,1.35,paint.red);
 box(parent,2.18,.15,.78,0,4.0,-1.24,paint.metal);
 box(parent,1.7,.38,.18,0,3.92,-1.66,paint.dark);
 for(const side of [-1,1]){
  for(let i=0;i<3;i++)box(parent,.05,1.25,1.17,side*1.205,2.55,.06+i*1.38,paint.blue);
  box(parent,.10,2.4,.08,side*1.23,2.5,1.38,paint.metal);
  box(parent,.10,.12,4.3,side*1.24,3.86,1.35,paint.white);
  for(const z of [-3.15,-1.62,2.28,3.35])wheel(parent,side*1.12,z,.38);
 }
 box(parent,1.16,1.06,.16,0,3.42,-1.23,paint.metal);
 for(let i=0;i<4;i++)box(parent,1.04,.045,.18,0,3.02+i*.23,-1.32,paint.dark);
}

function pushbackTug(parent:THREE.Group){
 box(parent,2.45,.74,4.75,0,.72,-.02,paint.yellow);
 box(parent,2.2,1.12,2.0,0,1.48,-.72,paint.yellow);
 box(parent,1.78,.72,.06,0,1.61,-1.75,paint.glass);
 for(const s of [-1,1]){
  box(parent,.06,.62,1.35,s*1.12,1.58,-.66,paint.glass);
  for(const z of [-1.6,1.55])wheel(parent,s*1.25,z,.58);
  box(parent,.12,.18,.16,s*1.16,1.02,-2.22,paint.white);
  box(parent,.13,.18,.16,s*1.16,1.01,2.22,paint.red);
 }
 box(parent,2.75,.20,.32,0,.48,-2.42,paint.metal);
 box(parent,.18,.16,2.0,0,.42,3.34,paint.metal);
 box(parent,.15,.20,.65,0,.48,4.5,paint.yellow);
 box(parent,.9,.13,1.7,0,1.98,-.28,paint.dark);
 cylinder(parent,.27,.27,.20,0,2.16,-.28,paint.orange,10);
}

export function createServiceVehicles(parent:THREE.Group,count=14):ServiceVehicleVisual[]{
 const vehicles:ServiceVehicleVisual[]=[];
 for(let i=0;i<count;i++){
  const group=new THREE.Group(),kind=i%5;
  if(kind===0)baggageTrain(group);
  else if(kind===1)passengerBus(group);
  else if(kind===2)fuelTanker(group);
  else if(kind===3)cateringTruck(group);
  else pushbackTug(group);
  batchStatic(group);parent.add(group);
  vehicles.push({group,phase:i/count,speed:6+i%3,lane:i%2});
 }
 return vehicles;
}
