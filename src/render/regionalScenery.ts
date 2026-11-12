import * as THREE from 'three';
import data from '../data/regionalOSM.json';
import {terrainSurfaceHeight} from './terrain';
import {isSea} from './coastline';
import {material} from './primitives';

export const regionalSettlements=data.settlements;

/** Visual road and river corridors, derived from OSM and separated from aircraft routing. */
export function addRegionalFeatures(parent:THREE.Group){
 const road:number[]=[],water:number[]=[];
 for(const way of data.ways){
  const output=way.kind==='river'?water:road,half=way.kind==='river'?10:way.kind==='motorway'?18:way.kind==='trunk'?12:8;
  for(let i=1;i<way.points.length;i++){
   const [ax,az]=way.points[i-1],[bx,bz]=way.points[i],dx=bx-ax,dz=bz-az,length=Math.hypot(dx,dz);if(length<1)continue;
   const steps=Math.ceil(length/160),nx=-dz/length*half,nz=dx/length*half;
   for(let k=0;k<steps;k++){
    const t=k/steps,u=(k+1)/steps,x1=ax+dx*t,z1=az+dz*t,x2=ax+dx*u,z2=az+dz*u;
    // Keep mapped arterial corridors visible around Dayuan and Luzhu; the airport's
    // immediate operational area (<1.8 km) remains reserved for the airport model.
    if(Math.min(Math.hypot(x1,z1),Math.hypot(x2,z2))<1800||Math.max(Math.hypot(x1,z1),Math.hypot(x2,z2))>45000||isSea(x1,z1)||isSea(x2,z2))continue;
    const h1=terrainSurfaceHeight(x1,z1)+1+(way.bridge?2:0),h2=terrainSurfaceHeight(x2,z2)+1+(way.bridge?2:0);
    output.push(x1+nx,h1,z1+nz,x2+nx,h2,z2+nz,x1-nx,h1,z1-nz,x2+nx,h2,z2+nz,x2-nx,h2,z2-nz,x1-nx,h1,z1-nz);
   }
  }
 }
 for(const [positions,color] of [[road,'#747b75'],[water,'#718b85']] as const){
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.computeVertexNormals();
  const mat=material(color,.94);mat.side=THREE.DoubleSide;parent.add(new THREE.Mesh(geo,mat));
 }
}
