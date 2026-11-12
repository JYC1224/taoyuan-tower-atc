import * as THREE from 'three';
import campus from '../data/terminalCore.json';
import mapData from '../data/landside.json';
import {runways,taxiEdges,taxiNodes} from '../data/airport';
import {box,instances,material} from './primitives';
import {applyFacadeUV} from './surfaceDetail';
import {distanceToSegment,roadIsVisible,roadPointClear,roadWidth,taxiCorridors,type MapFeature} from './landsideGeometry';

type Location={x:number;z:number};
export function insidePolygon(p:Location,points:number[][]){
 let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [xi,zi]=points[i],[xj,zj]=points[j];
  if((zi>p.z)!==(zj>p.z)&&p.x<(xj-xi)*(p.z-zi)/(zj-zi)+xi)inside=!inside;
 }return inside;
}

/** Procedural parking details are intentionally illustrative, not surveyed stalls. */
export function parkingLayout(features:MapFeature[]){
 const corridors=taxiCorridors(taxiNodes,taxiEdges);
 const roads=features.filter(roadIsVisible).flatMap(f=>f.points.slice(1).map((b,i)=>({a:{x:f.points[i][0],z:f.points[i][1]},b:{x:b[0],z:b[1]},width:roadWidth(f.tags)})));
 const result:{lot:number;x:number;z:number;car:boolean;color:number}[]=[];
 for(const f of features.filter(f=>[24000909,395947062].includes(f.id))){
  const xs=f.points.map(p=>p[0]),zs=f.points.map(p=>p[1]);
  for(let x=Math.ceil((Math.min(...xs)+7)/16)*16;x<Math.max(...xs)-7;x+=16){
   for(let z=Math.ceil((Math.min(...zs)+5)/3.1)*3.1;z<Math.max(...zs)-5;z+=3.1){
    if(![-3,3].every(dx=>[-1.4,1.4].every(dz=>insidePolygon({x:x+dx,z:z+dz},f.points))))continue;
    if(!roadPointClear({x,z},4,corridors,runways,5)||roads.some(r=>distanceToSegment({x,z},r.a,r.b)<r.width/2+4))continue;
    const hash=((Math.imul(Math.round(x),73856093)^Math.imul(Math.round(z*10),19349663))>>>0);
    result.push({lot:f.id,x,z,car:hash%10<6,color:hash%4});
   }
  }
 }return result;
}

/** Footprints are mapped; building heights, glazing and individual parking stalls are approximations. */
export function terminalCore(parent:THREE.Group,staticGroup:THREE.Group,facadeGlass:THREE.Material,cladding:THREE.MeshStandardMaterial){
 const wall=cladding,roof=material('#bac3c5',.73,.12),windows=material('#647e8c',.28,.28),trim=material('#c9d0cf',.65,.1);
 const heights:Record<number,number>={758856658:7.5,758856660:8.5,758856661:11,758856662:8,758856663:7.5};
 for(const f of campus.features){
  const height=heights[f.id];if(!height)continue;
  const shape=new THREE.Shape();f.points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false});geo.rotateX(-Math.PI/2);applyFacadeUV(geo,2.1,2.1);
  const building=new THREE.Mesh(geo,[roof,wall]);building.castShadow=true;building.receiveShadow=true;staticGroup.add(building);
  // Simple continuous glazing follows long outer walls; exact façade divisions are not surveyed.
  for(let i=1;i<f.points.length;i++){
   const [ax,az]=f.points[i-1],[bx,bz]=f.points[i],dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz);
   if(len<12)continue;
   for(const y of height>9?[3.4,7.2]:[3.4])box(staticGroup,.16,1.15,len-1,(ax+bx)/2,y,(az+bz)/2,facadeGlass,Math.atan2(dx,dz));
   box(staticGroup,.3,.38,len,(ax+bx)/2,height+.15,(az+bz)/2,trim,Math.atan2(dx,dz));
  }
 }
 const features=mapData.features as unknown as MapFeature[];
 const lotMat=material('#686f70',.95),paint=material('#c4c9c1',.95);
 for(const f of features.filter(f=>[24000909,395947062].includes(f.id))){
  const shape=new THREE.Shape();f.points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
  const geo=new THREE.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);const surface=new THREE.Mesh(geo,lotMat);surface.position.y=.195;surface.receiveShadow=true;staticGroup.add(surface);
 }
 const layout=parkingLayout(features);
 instances(parent,new THREE.BoxGeometry(1,1,1),paint,layout.map(p=>({x:p.x,y:.221,z:p.z+1.45,sx:5.5,sy:.015,sz:.1})));
 const carColors=['#aeb6b5','#e1e3de','#46565f','#727a7d'].map(c=>material(c,.52,.18));
 for(let color=0;color<carColors.length;color++){
  const cars=layout.filter(p=>p.car&&p.color===color);
  instances(parent,new THREE.BoxGeometry(1,1,1),carColors[color],cars.map(p=>({x:p.x,y:.68,z:p.z,sx:4.2,sy:.9,sz:1.75})));
  instances(parent,new THREE.BoxGeometry(1,1,1),windows,cars.map(p=>({x:p.x-.1,y:1.22,z:p.z,sx:2.1,sy:.42,sz:1.5})));
 }
}
