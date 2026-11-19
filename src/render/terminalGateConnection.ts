import * as THREE from 'three';
import {box,canvasTexture,instances,material} from './primitives';
import type {TerminalMaterials} from './terminalArchitecture';
import {T2_GATE_LINKS} from './terminalGateLinks';
import {hallAreaLight} from './terminalPublicHalls';

const stone=material('#c9c6ba',.59,.035),edge=material('#52626a',.53,.17),steel=material('#adb8b7',.37,.44);
const lens=new THREE.MeshBasicMaterial({color:'#fff3da',toneMapped:false});
const soffit=new THREE.MeshStandardMaterial({color:'#e1ded4',roughness:.76,emissive:'#a49c8b',emissiveIntensity:.24});
const glazing=new THREE.MeshPhysicalMaterial({color:'#bdd2d5',roughness:.23,transparent:true,opacity:.31,depthWrite:false,forceSinglePass:true});

export function buildT2GateConnections(parent:THREE.Object3D,mats:TerminalMaterials){
 for(const wing of ['C','D'] as const){
  const link=T2_GATE_LINKS[wing],{center:x,width,upperEnd,lowerEnd,upperFloor,lowerFloor}=link.slope;
  const z=(lowerEnd+upperEnd)/2,y=(upperFloor+lowerFloor)/2;
  const dz=upperEnd-lowerEnd,rise=upperFloor-lowerFloor,length=Math.hypot(dz,rise),tilt=-Math.atan(rise/dz);
  const tilted=(w:number,h:number,d:number,x0:number,y0:number,z0:number,finish:THREE.Material)=>{
   const part=box(parent,w,h,d,x0,y0,z0,finish);
   part.rotation.x=tilt;return part;
  };
  tilted(width,.28,length,x,y-.17,z,wing==='C'?stone:edge);
  if(wing==='C'){
   const start=link.upperApproach.near;
   box(parent,width,.34,upperEnd-start,x,upperFloor-.17,(start+upperEnd)/2,stone);
  }else{
   const count=Math.ceil(rise/.173),tread=(upperEnd-lowerEnd)/count,riser=rise/count;
   const steps=Array.from({length:count},(_,i)=>({x,y:lowerFloor+(i+1)*riser-.5*riser,z:lowerEnd+(i+.5)*tread,sx:width,sy:riser,sz:tread}));
   instances(parent,new THREE.BoxGeometry(1,1,1),stone,steps);
   instances(parent,new THREE.BoxGeometry(1,1,1),edge,steps.map(step=>({...step,y:step.y+riser/2+.009,z:step.z-tread*.43,sy:.016,sz:.044})));
   // The shelter starts at the terminal envelope and joins the existing D
   // waiting hall soffit, leaving the bottom of the flight visible on arrival.
   const start=link.wingEntrance,end=link.facade+.19,shelterZ=(start+end)/2,shelterY=link.floorAt(shelterZ);
   const roofDepth=(end-start)/Math.cos(tilt);
   tilted(width+.23,.22,roofDepth,x,shelterY+link.headroom,shelterZ,mats.roof??soffit);
   tilted(width-.1,.075,roofDepth,x,shelterY+link.headroom-.16,shelterZ,soffit);
   for(const side of [-1,1]){
    tilted(.105,link.headroom+.12,roofDepth,x+side*width/2,shelterY+link.headroom/2-.04,shelterZ,mats.glass);
    tilted(.19,.27,roofDepth,x+side*width/2,shelterY-.04,shelterZ,edge);
   }
   for(const offset of [-4,0,4])box(parent,width*.53,.041,.19,x,link.floorAt(shelterZ+offset)+link.headroom-.23,shelterZ+offset,lens);
   const light=hallAreaLight(parent,x,shelterY+link.headroom-.33,shelterZ,width,roofDepth,.51,'#fff4de');
   light.userData.hallLightBounds.bottom=lowerFloor;
  }
  for(const side of [-1,1]){
   const railX=x+side*(width/2-.075);
   tilted(.058,.94,length,railX,y+.48,z,glazing);
   tilted(.105,.085,length,railX,y+1,z,steel);
   for(let i=0;i<=5;i++){
    const postZ=lowerEnd+dz*i/5;
    box(parent,.071,1.0,.075,railX,link.floorAt(postZ)+.50,postZ,steel);
   }
  }
  const plaque=new THREE.Mesh(new THREE.PlaneGeometry(width-.72,.62),new THREE.MeshBasicMaterial({map:canvasTexture(768,100,ctx=>{
   ctx.fillStyle='#234b8b';ctx.fillRect(0,0,768,100);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.font='600 55px Arial, "Microsoft JhengHei", sans-serif';ctx.fillText(`${wing} 區登機門  Gates ${wing}`,384,53,724);
  }),toneMapped:false}));
  const inset=wing==='C'?1.8:.29;
  plaque.position.set(x,upperFloor+2.42,link.facade-link.side*inset);plaque.rotation.y=link.side>0?Math.PI:0;
  parent.add(plaque);
 }
}
