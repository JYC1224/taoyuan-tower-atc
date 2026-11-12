import * as THREE from 'three';
import mapData from '../data/landside.json';
import {runways,taxiEdges,taxiNodes} from '../data/airport';
import {roadIsVisible,roadPointClear,roadWidth,taxiCorridors,type MapFeature} from './landsideGeometry';

type GeometryArrays={positions:number[];normals:number[];uvs:number[];indices:number[]};
const arrays=():GeometryArrays=>({positions:[],normals:[],uvs:[],indices:[]});
function strip(a:GeometryArrays,x1:number,z1:number,x2:number,z2:number,width:number,y:number){
 const dx=x2-x1,dz=z2-z1,l=Math.hypot(dx,dz);if(l<.01)return;
 const nx=-dz/l*width/2,nz=dx/l*width/2,i=a.positions.length/3;
 for(const [x,z] of [[x1+nx,z1+nz],[x1-nx,z1-nz],[x2+nx,z2+nz],[x2-nx,z2-nz]]){a.positions.push(x,y,z);a.normals.push(0,1,0);a.uvs.push(0,0);}
 a.indices.push(i,i+2,i+1,i+1,i+2,i+3);
}
function mesh(a:GeometryArrays,material:THREE.Material){
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(a.positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(a.normals,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(a.uvs,2));geo.setIndex(a.indices);return new THREE.Mesh(geo,material);
}
/** Reuse the existing PBR surfaces; merge all strips into two meshes for performance. */
export function mappedLandside(parent:THREE.Group,concrete:THREE.Material,asphalt:THREE.Material,paint:THREE.Material,parking:THREE.Material){
 const corridors=taxiCorridors(taxiNodes,taxiEdges),road=arrays(),markings=arrays();
 for(const feature of mapData.features as unknown as MapFeature[]){
  if(feature.kind==='apron'||(feature.kind==='parking'&&feature.tags.parking!=='multi-storey'&&feature.tags.location!=='underground')){
   // Below existing operational pavements and markings; replaces grass only where mapped.
   const points=feature.points;if(points.length<4)continue;const shape=new THREE.Shape();shape.moveTo(points[0][0],-points[0][1]);for(const [x,z] of points.slice(1))shape.lineTo(x,-z);
   const geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);const surface=new THREE.Mesh(geometry,feature.kind==='apron'?concrete:parking);surface.position.y=.052;parent.add(surface);continue;
  }
  if(!roadIsVisible(feature))continue;
  const width=roadWidth(feature.tags),points=feature.points;let along=0;
  for(let i=1;i<points.length;i++){
   const [ax,az]=points[i-1],[bx,bz]=points[i],length=Math.hypot(bx-ax,bz-az),steps=Math.max(1,Math.ceil(length/8));
   // Adjacent safe chunks along the same straight map segment form one quad.
   // This preserves the conservative clipping while avoiding thousands of tiny triangles.
   let start:{x:number;z:number}|null=null,end:{x:number;z:number}|null=null,markStart:{x:number;z:number}|null=null,markEnd:{x:number;z:number}|null=null;
   const flushRoad=()=>{if(start&&end)strip(road,start.x,start.z,end.x,end.z,width,.235);start=end=null;};
   const flushMark=()=>{if(markStart&&markEnd)strip(markings,markStart.x,markStart.z,markEnd.x,markEnd.z,.16,.246);markStart=markEnd=null;};
   for(let k=0;k<steps;k++){
    const t0=k/steps,t1=(k+1)/steps,tm=(t0+t1)/2,x1=ax+(bx-ax)*t0,z1=az+(bz-az)*t0,x2=ax+(bx-ax)*t1,z2=az+(bz-az)*t1;
    const center={x:ax+(bx-ax)*tm,z:az+(bz-az)*tm};
    if(!roadPointClear(center,width/2,corridors,runways,5)){flushRoad();flushMark();continue;}
    if(!start)start={x:x1,z:z1};end={x:x2,z:z2};
    if(width>=7&&Math.floor((along+tm*length)/12)%2===0){if(!markStart)markStart={x:x1,z:z1};markEnd={x:x2,z:z2};}else flushMark();
   }
   flushRoad();flushMark();
   along+=length;
  }
 }
 if(road.indices.length)parent.add(mesh(road,asphalt));if(markings.indices.length)parent.add(mesh(markings,paint));
}
