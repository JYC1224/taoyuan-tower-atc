import * as THREE from 'three';
import {canvasTexture,instances} from './primitives';
import type {BuildingRect} from './terminalBuildingLayout';

const floorFinishes={
 polished:{roughness:.26,clearcoat:.33,clearcoatRoughness:.23,bounce:.43},
 inlay:{roughness:.22,clearcoat:.40,clearcoatRoughness:.20,bounce:.37},
 satin:{roughness:.45,clearcoat:.09,clearcoatRoughness:.40,bounce:.37},
 carpet:{roughness:.93,clearcoat:0,clearcoatRoughness:1,bounce:.32},
} as const;
type FloorFinish=keyof typeof floorFinishes;

let ceilingBounce:THREE.CubeTexture|undefined;
function roomBounce(){
 if(ceilingBounce)return ceilingBounce;
 // A shared, featureless indoor bounce supplies low-frequency irradiance.
 // Luminaires and windows make the visible highlights at their actual positions.
 const faces=Array.from({length:6},(_,index)=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
  const ctx=canvas.getContext('2d')!,gradient=ctx.createLinearGradient(0,0,0,32);
  const top=index===3?'#3d3d37':'#aaa99e',bottom=index===2?'#aaa99e':'#3d3d37';
  gradient.addColorStop(0,top);gradient.addColorStop(1,bottom);
  ctx.fillStyle=gradient;ctx.fillRect(0,0,32,32);return canvas;
 });
 ceilingBounce=new THREE.CubeTexture(faces);
 ceilingBounce.colorSpace=THREE.SRGBColorSpace;
 ceilingBounce.needsUpdate=true;
 return ceilingBounce;
}

export function terminalFloorMaterial(finish:FloorFinish,options:THREE.MeshPhysicalMaterialParameters){
 const {roughness,clearcoat,clearcoatRoughness,bounce}=floorFinishes[finish];
 const floor=new THREE.MeshPhysicalMaterial({
  roughness,clearcoat,clearcoatRoughness,metalness:0,specularIntensity:.63,...options,
  envMap:roomBounce(),envMapIntensity:bounce,
 });
 floor.userData.terminalFloorLighting={bounce,emission:floor.emissiveIntensity};
 floor.userData.noShadow=true;
 return floor;
}

const contactPlane=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
let contactMaterial:THREE.MeshBasicMaterial|undefined;

/** Soft, static ambient shadows for the feet of indoor fixtures under area light. */
export function addFloorContactShadows(parent:THREE.Object3D,y:number,items:readonly BuildingRect[],spread=.24){
 if(!items.length)return;
 contactMaterial??=new THREE.MeshBasicMaterial({
  map:canvasTexture(96,96,ctx=>{
   const pixels=ctx.createImageData(96,96);
   for(let row=0;row<96;row++)for(let col=0;col<96;col++){
    const x=Math.abs((col+.5)/48-1),z=Math.abs((row+.5)/48-1);
    const d=Math.min(1,Math.pow(x**4+z**4,.25));
    const fade=THREE.MathUtils.smoothstep(d,.30,.99);
    pixels.data[(row*96+col)*4+3]=Math.round((1-fade)*76);
   }
   ctx.putImageData(pixels,0,0);
  }),
  transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,forceSinglePass:true,
 });
 const batch=instances(parent,contactPlane,contactMaterial,items.map(({x,z,width,depth})=>({
  x,y,z,sx:width+spread*2,sz:depth+spread*2,
 })));
 batch.receiveShadow=false;
 batch.renderOrder=1;
}

export interface CeilingLightRows {
 axis:'x'|'z';
 first:number;
 last:number;
 pitch:number;
 height:number;
 rows:readonly [number,number]|readonly [number,number,number];
}

/** Reflected view rays meet the same fixture centres used to build the ceiling. */
export function addCeilingLightReflections(floor:THREE.MeshPhysicalMaterial,lamps:CeilingLightRows,radius:number,strength:number,bounds?:BuildingRect){
 const mask=bounds?new THREE.Vector4(bounds.x-bounds.width/2,bounds.x+bounds.width/2,bounds.z-bounds.depth/2,bounds.z+bounds.depth/2)
  :new THREE.Vector4(-10000,10000,-10000,10000);
 floor.onBeforeCompile=shader=>{
  shader.uniforms.lampSpacing={value:new THREE.Vector3(lamps.first,lamps.last,lamps.pitch)};
  shader.uniforms.lampRows={value:new THREE.Vector3(lamps.rows[0],lamps.rows[1],lamps.rows[2]??lamps.rows[1])};
  shader.uniforms.lampOptics={value:new THREE.Vector4(lamps.height,radius,strength,lamps.axis==='x'?0:1)};
  shader.uniforms.lampFloorBounds={value:mask};
  shader.vertexShader=shader.vertexShader
   .replace('#include <common>','#include <common>\nvarying vec3 vTerminalFloorPosition;')
   .replace('#include <project_vertex>',`#include <project_vertex>
     vTerminalFloorPosition=(modelMatrix*vec4(transformed,1.0)).xyz;`);
  shader.fragmentShader=shader.fragmentShader
   .replace('#include <common>',`#include <common>
     varying vec3 vTerminalFloorPosition;
     uniform vec3 lampSpacing;
     uniform vec3 lampRows;
     uniform vec4 lampOptics;
     uniform vec4 lampFloorBounds;`)
   .replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
     vec2 roomPoint=vTerminalFloorPosition.xz;
     float roomEdge=min(min(roomPoint.x-lampFloorBounds.x,lampFloorBounds.y-roomPoint.x),
                        min(roomPoint.y-lampFloorBounds.z,lampFloorBounds.w-roomPoint.y));
     vec3 mirrorRay=reflect(normalize(vTerminalFloorPosition-cameraPosition),vec3(0.0,1.0,0.0));
     if (mirrorRay.y>0.025 && roomEdge>0.0) {
      float height=max(0.0,lampOptics.x-vTerminalFloorPosition.y);
      float travelled=height/mirrorRay.y;
      vec2 lampHit=roomPoint + travelled*mirrorRay.xz;
      vec2 grid=mix(lampHit,lampHit.yx,lampOptics.w);
      float border=lampOptics.y*2.5;
      if (grid.x>lampSpacing.x-border && grid.x<lampSpacing.y+border) {
       float along=mod(grid.x-lampSpacing.x+lampSpacing.z*0.5,lampSpacing.z)-lampSpacing.z*0.5;
       vec3 rows=abs(vec3(grid.y)-lampRows);
       float across=min(rows.x,min(rows.y,rows.z));
       float softness=lampOptics.y+travelled*0.005;
       float lobe=exp(-dot(vec2(along,across),vec2(along,across))/(softness*softness));
       float fresnel=0.10+0.36*pow(1.0-mirrorRay.y,4.0);
       float falloff=1.0-smoothstep(height+3.0,height+40.0,travelled);
       reflectedLight.directSpecular+=vec3(1.0,0.90,0.76)*lobe*fresnel*falloff*lampOptics.z*smoothstep(0.0,3.0,roomEdge);
      }
     }`);
 };
 floor.customProgramCacheKey=()=>'terminal-ceiling-light-reflections';
}
