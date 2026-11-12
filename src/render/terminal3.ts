import * as THREE from 'three';
import type {Terminal} from '../data/airport';
import {box,material} from './primitives';
import {roofMaterial} from './roofMaterial';
import {terminalInterior,terminalSpandrels,type TerminalBounds} from './terminalArchitecture';

// A completed-design interpretation, not a surveyed model or operational expansion.
export function completedTerminal3(parent:THREE.Group,t:Terminal,glass:THREE.Material,cladding:THREE.MeshStandardMaterial,concrete:THREE.Material){
 const shell=material('#e2e6e4',.68,.14),roofFinish=roofMaterial('#e2e6e4',.68,.14),metal=material('#aab7bd',.44,.4),foundation=material('#a9b1b0',.88);
 if(t.id==='T3-S'){
  box(parent,t.width,15,t.depth,t.x,7.5,t.z,glass);
  const bounds:TerminalBounds={x:t.x,z:t.z,width:t.width,depth:t.depth,height:15};terminalSpandrels(parent,bounds,cladding);terminalInterior(parent,bounds,concrete);
  box(parent,t.width+8,1.2,t.depth+8,t.x,15.6,t.z,roofFinish);
  for(const side of [-1,1]){
   box(parent,t.width,.55,.5,t.x,6,t.z+side*(t.depth/2+.2),shell);
   for(let x=-t.width/2;x<=t.width/2;x+=12)box(parent,.35,15,.4,t.x+x,7.5,t.z+side*(t.depth/2+.2),metal);
  }
  return;
 }
 // Main body uses the published approximately 414 m by 242 m footprint.
 box(parent,t.width,2,t.depth,t.x,1,t.z,foundation);
 box(parent,t.width,30,t.depth,t.x,17,t.z,glass);
 const bounds:TerminalBounds={x:t.x,z:t.z,width:t.width,depth:t.depth,height:30};terminalSpandrels(parent,bounds,cladding);terminalInterior(parent,bounds,concrete);
 for(const side of [-1,1]){
  for(const y of [7,14,21,28])box(parent,t.width,.45,.45,t.x,y,t.z+side*(t.depth/2+.2),shell);
  for(let x=-t.width/2;x<=t.width/2;x+=8)box(parent,.22,30,.35,t.x+x,17,t.z+side*(t.depth/2+.2),metal);
  for(let z=-t.depth/2;z<=t.depth/2;z+=8)box(parent,.35,30,.22,t.x+side*(t.width/2+.2),17,t.z+z,metal);
 }
 // A continuous doubly curved hard-shell roof evokes the built wave profile.
 const w=t.width+32,d=t.depth+30,nx=72,nz=44,p:number[]=[],uv:number[]=[],indices:number[]=[];
 const roofY=(u:number,v:number)=>t.height+7+3.8*Math.cos(v*Math.PI*2)+1.9*Math.cos(u*Math.PI*2)+2.2*Math.cos(u*Math.PI*2)*Math.cos(v*Math.PI);
 for(let i=0;i<=nx;i++){const u=i/nx-.5;for(let j=0;j<=nz;j++){const v=j/nz-.5;p.push(t.x+u*w,roofY(u,v),t.z+v*d);uv.push(i/nx,j/nz);}}
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=i*(nz+1)+j,b=a+nz+1;indices.push(a,a+1,b,a+1,b+1,b);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 const roof=new THREE.Mesh(geo,roofFinish);roof.castShadow=true;roof.receiveShadow=true;parent.add(roof);
 // Fine standing seams and a perimeter lip emphasize the roof's broad curvature.
 const seams:number[]=[];
 const segment=(u1:number,v1:number,u2:number,v2:number)=>seams.push(t.x+u1*w,roofY(u1,v1)+.06,t.z+v1*d,t.x+u2*w,roofY(u2,v2)+.06,t.z+v2*d);
 for(let i=0;i<=42;i++){const u=i/42-.5;for(let j=0;j<nz;j++)segment(u,j/nz-.5,u,(j+1)/nz-.5);}
 for(let j=0;j<=nz;j++){if(j===0||j===nz)for(let i=0;i<nx;i++)segment(i/nx-.5,j/nz-.5,(i+1)/nx-.5,j/nz-.5);}
 const seamGeo=new THREE.BufferGeometry();seamGeo.setAttribute('position',new THREE.Float32BufferAttribute(seams,3));parent.add(new THREE.LineSegments(seamGeo,new THREE.LineBasicMaterial({color:'#91a1a8'})));
 // Covered links bridge the main hall and its two concourses; the current gates remain unchanged.
 for(const side of [-1,1]){
  const start=t.z+side*(t.depth/2),end=side<0?-212:185,mid=(start+end)/2,length=Math.abs(end-start);
  box(parent,125,10,length,t.x,5,mid,glass);
  box(parent,131,.9,length+3,t.x,10.5,mid,roofFinish);
  for(let x=-56;x<=56;x+=16)box(parent,.45,10,.45,t.x+x,5,end,metal);
 }
}
