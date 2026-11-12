import * as THREE from 'three';
import type {Aircraft,FleetProfile} from '../types';
import {box,cylinder,material} from './primitives';
import {batchStatic} from './surfaceDetail';

type Worker={group:THREE.Group;arms:THREE.Group[]};
type Colors={vest:THREE.MeshStandardMaterial;uniform:THREE.MeshStandardMaterial;reflective:THREE.MeshStandardMaterial;skin:THREE.MeshStandardMaterial;helmet:THREE.MeshStandardMaterial;wand:THREE.MeshBasicMaterial};
function worker(parent:THREE.Group,colors:Colors,wands=false):Worker{
 const group=new THREE.Group(),arms:THREE.Group[]=[];parent.add(group);
 for(const side of [-1,1]){
  cylinder(group,.10,.11,.72,side*.13,.39,0,colors.uniform,8);
  box(group,.20,.12,.34,side*.13,.08,-.06,colors.uniform);
  const arm=new THREE.Group();arm.position.set(side*.27,1.46,0);
  cylinder(arm,.08,.07,.57,0,-.27,0,colors.vest,8);
  cylinder(arm,.065,.06,.18,0,-.62,0,colors.skin,8);
  if(wands){cylinder(arm,.035,.035,.48,0,-.93,0,colors.wand,8);}
  batchStatic(arm);group.add(arm);arms.push(arm);
 }
 box(group,.52,.70,.30,0,1.12,0,colors.vest);box(group,.54,.11,.32,0,1.18,0,colors.reflective);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),colors.skin);head.position.y=1.67;head.castShadow=true;group.add(head);
 const hat=new THREE.Mesh(new THREE.SphereGeometry(.18,12,6,0,Math.PI*2,0,Math.PI/2),colors.helmet);hat.position.y=1.72;group.add(hat);
 box(group,.42,.04,.36,0,1.72,0,colors.helmet);batchStatic(group);
 return {group,arms};
}

function colors():Colors{return{vest:material('#dca12c',.8),uniform:material('#33424b',.92),reflective:material('#e8e5bb',.65),skin:material('#b78d70',.85),helmet:material('#e2cc73',.7),wand:new THREE.MeshBasicMaterial({color:'#ff9b31',toneMapped:false})};}

export function createMarshaller(parent:THREE.Group,length:number){
 const result=worker(parent,colors(),true);result.group.position.set(-4,0,-length/2-7);result.group.visible=false;return result;
}

export interface StandService {group:THREE.Group;worker:Worker;moving:THREE.Object3D[];cargo:boolean;radius:number;bodyY:number;length:number}

/** Visual stand service is kept within the parked aircraft envelope and has no simulation authority. */
export function createStandService(parent:THREE.Group,profile:FleetProfile,radius:number,bodyY:number):StandService{
 const group=new THREE.Group();parent.add(group);group.visible=false;
 const frame=material('#718387',.68,.25),white=material('#d4dbd7',.75,.1),dark=material('#34444a',.88),yellow=material('#dfb344',.75),blue=material('#577a8d',.76),bag=material('#766f62',.9),container=material('#adbabc',.6,.28);
 const cargo=!!profile.cargo,z=profile.length*(cargo?.23:-.25),moving:THREE.Object3D[]=[];
 if(cargo)group.scale.x=-1;
 // A low chassis, wheels and towable dolly stay beside the aircraft, away from the taxi path.
 const cartX=radius+8.3,cartZ=z+4.1;
 box(group,2.0,.22,3.0,cartX,.49,cartZ,frame);
 for(const side of [-1,1])for(const dz of [-.95,.95]){const wheel=cylinder(group,.28,.28,.18,cartX+side*.9,.29,cartZ+dz,dark,10);wheel.rotation.z=Math.PI/2;}
 if(cargo){box(group,1.75,1.45,2.35,cartX,1.32,cartZ,container);box(group,1.78,.07,2.38,cartX,2.08,cartZ,frame);}
 else for(let i=0;i<3;i++)box(group,.62,.55,.75,cartX-.55+i*.55,.87,cartZ+(i%2)*.5,i===1?bag:blue);

 if(cargo){
  const loaderX=radius+4.6,deck=bodyY-.35;
  box(group,4.6,.45,4.6,loaderX,.62,z,white);
  for(const side of [-1,1])for(const dz of [-1.55,1.55]){const wheel=cylinder(group,.42,.42,.22,loaderX+side*2.22,.42,z+dz,dark,12);wheel.rotation.z=Math.PI/2;}
  box(group,5.2,.25,4.6,loaderX,deck,z,frame);box(group,4.9,.12,4.3,loaderX,deck+.19,z,yellow);
  for(const side of [-1,1]){
   const support=box(group,.18,Math.hypot(deck-1,3.1),.2,loaderX+side*.8,(deck+1)/2,z+side*1.5,frame);
   support.rotation.z=side*.48;
  }
  const unit=new THREE.Group();box(unit,1.85,1.55,1.9,0,.8,0,container);box(unit,1.9,.08,1.95,0,1.62,0,frame);
  for(const dx of [-.7,.7])box(unit,.04,1.35,.04,dx,.8,-.98,frame);batchStatic(unit);group.add(unit);moving.push(unit);
 }else{
  const deck=bodyY-radius*.62,loaderX=radius+3.05,groundHeight=.95;
  box(group,2.4,.45,4.5,radius+5.7,.59,z,white);
  for(const side of [-1,1])for(const dz of [-1.4,1.4]){const wheel=cylinder(group,.34,.34,.2,radius+5.7+side*1.12,.34,z+dz,dark,10);wheel.rotation.z=Math.PI/2;}
  const belt=new THREE.Group();belt.position.set(loaderX,(deck+groundHeight)/2,z);belt.rotation.z=-Math.atan2(deck-groundHeight,5);
  box(belt,5.3,.18,1.45,0,0,0,dark);for(const side of [-1,1])box(belt,5.3,.17,.08,0,.12,side*.73,frame);
  for(let i=0;i<3;i++){const parcel=box(belt,.62,.42,.55,0,.32,0,i===1?bag:blue);moving.push(parcel);}
  batchStatic(belt,moving);group.add(belt);
 }
 const attendant=worker(group,colors());attendant.group.position.set(radius+8.4,0,z-2.0);attendant.group.rotation.y=-Math.PI/2;
 batchStatic(group);return{group,worker:attendant,moving,cargo,radius,bodyY,length:profile.length};
}

export function updateStandService(service:StandService,a:Aircraft,time:number){
 service.group.visible=a.position.y<2&&a.speed<.2&&['PARKED','REQUESTING_PUSHBACK','DOCKED'].includes(a.state);
 if(!service.group.visible)return;
 const direction=a.kind==='arrival'?1:-1;
 service.worker.arms.forEach((arm,i)=>arm.rotation.x=.35+Math.sin(time*1.25+i*.8)*.22);
 if(service.cargo){const unit=service.moving[0];const cycle=(time*.06)%1;unit.position.set(service.radius+3.3+cycle*2.2,service.bodyY-.10,service.length*.23);}
 else service.moving.forEach((parcel,i)=>{const t=((time*.09*direction+i/3)%1+1)%1;parcel.position.x=-1.85+t*3.7;});
}

export function animateMarshaller(arms:THREE.Group[],time:number){arms.forEach((arm,i)=>{const side=i===0?-1:1;arm.rotation.z=side*(.82+.32*Math.sin(time*1.8));});}
