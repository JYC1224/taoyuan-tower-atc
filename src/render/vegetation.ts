import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {isSea} from './coastline';
import {terrainSurfaceHeight} from './terrain';
import {instances,seeded} from './primitives';

export interface VegetationAnchor {x:number;z:number;radius:number;kind:string}
interface Plant {x:number;y:number;z:number;sx:number;sy:number;sz:number;ry:number;color:string}

const canopyColors=['#314b32','#3b5837','#49623a','#596d40','#687649','#405b43','#536448'];
const treeShapes=['round','column','spreading'] as const;

function createCanopy(shape:typeof treeShapes[number]){
 const parts:THREE.BufferGeometry[]=[],sphere=new THREE.SphereGeometry(1,12,8);
 const add=(x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{const part=sphere.clone();part.scale(sx,sy,sz);part.translate(x,y,z);parts.push(part);};
 if(shape==='round'){
  add(0,.06,0,.66,.62,.66);
  for(let i=0;i<6;i++){const angle=i*Math.PI/3,r=.48;add(Math.cos(angle)*r,.08+(i%2)*.08,Math.sin(angle)*r,.47,.43,.48);}
  add(0,.48,0,.44,.39,.44);
 }else if(shape==='column'){
  add(0,.12,0,.52,.66,.52);
  for(let i=0;i<5;i++){const angle=i*Math.PI*2/5,r=.35;add(Math.cos(angle)*r,.03+(i%3)*.26,Math.sin(angle)*r,.38,.48,.39);}
  add(0,.62,0,.34,.45,.34);
 }else{
  add(0,.02,0,.9,.38,.83);
  for(let i=0;i<7;i++){const angle=i*Math.PI*2/7,r=.62;add(Math.cos(angle)*r,.04+(i%3)*.08,Math.sin(angle)*r,.43,.35,.46);}
  add(0,.3,0,.48,.35,.48);
 }
 const merged=mergeGeometries(parts,false);parts.forEach(part=>part.dispose());sphere.dispose();
 if(!merged)throw new Error('Unable to build procedural tree canopy');
 merged.computeVertexNormals();merged.computeBoundingSphere();return merged;
}

/** Instanced Taiwan-coastal-plain trees with distinct crowns and subtle wind response. */
export function addRegionalVegetation(parent:THREE.Group,anchors:VegetationAnchor[],random:()=>number){
 const treeItems:Plant[][]=treeShapes.map(()=>[]),nearTreeItems:Plant[][]=treeShapes.map(()=>[]),shrubItems:Plant[]=[],trunks:Plant[]=[],nearTrunks:Plant[]=[];
 const treeCount=Math.min(820,Math.max(520,anchors.length*70));
 for(let i=0;i<treeCount&&anchors.length;i++){
  const anchor=anchors[Math.floor(random()*anchors.length)],angle=random()*Math.PI*2,radial=anchor.radius*(.42+random()*1.15),x=anchor.x+Math.cos(angle)*radial,z=anchor.z+Math.sin(angle)*radial;
  // Retain the airport's obstacle-free operational area and mapped coastline.
  if(Math.abs(x)<4300&&Math.abs(z)<2850||isSea(x,z))continue;
  const selection=random(),shapeIndex=selection<.51?0:selection<.78?1:2,shape=treeShapes[shapeIndex],height=(anchor.kind==='city'?7:5.5)+random()*(anchor.kind==='city'?8:7),ground=terrainSurfaceHeight(x,z),crownRadius=shape==='column'?.75+random()*.4:1+random()*.55;
  const sx=(2.5+random()*2.6)*crownRadius,sz=(2.4+random()*2.5)*crownRadius,sy=height*(shape==='spreading'?.32:.39);
  const tree={x,y:ground+height*.66,z,sx,sy,sz,ry:random()*Math.PI*2,color:canopyColors[Math.floor(random()*canopyColors.length)]};
  (Math.hypot(x,z)<6800?nearTreeItems:treeItems)[shapeIndex].push(tree);
  const trunkWidth=.14+random()*.16,trunkHeight=height*(.58+random()*.1);
  const trunk={x,y:ground+trunkHeight*.5,z,sx:trunkWidth,sy:trunkHeight,sz:trunkWidth,ry:random()*Math.PI*2,color:['#625342','#71604b','#594d3e'][Math.floor(random()*3)]};
  (Math.hypot(x,z)<6800?nearTrunks:trunks).push(trunk);
 }

 const windTime={value:0},windStrength={value:.35},windDirection={value:new THREE.Vector2(1,0)},foliageWetness={value:0};
 const foliage=new THREE.MeshStandardMaterial({color:'#fff',roughness:.94});
 foliage.onBeforeCompile=shader=>{
  shader.uniforms.regionalWindTime=windTime;shader.uniforms.regionalWindStrength=windStrength;shader.uniforms.regionalWindDirection=windDirection;shader.uniforms.foliageWetness=foliageWetness;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float regionalWindTime;uniform float regionalWindStrength;uniform vec2 regionalWindDirection;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   #ifdef USE_INSTANCING
    float crownHeight=smoothstep(.08,.94,transformed.y);
    float crownPhase=instanceMatrix[3].x*.013+instanceMatrix[3].z*.017;
    float breeze=sin(regionalWindTime+crownPhase+transformed.y*1.9)*regionalWindStrength*crownHeight*.15;
    transformed.xz+=regionalWindDirection*breeze;
   #endif`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float foliageWetness;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb*=1.0-foliageWetness*.085;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.56,foliageWetness*.48);');
 };
 foliage.customProgramCacheKey=()=> 'taoyuan-regional-foliage-wind-v1';
 const geometries=treeShapes.map(createCanopy);
 treeItems.forEach((items,index)=>{if(!items.length)return;const mesh=instances(parent,geometries[index],foliage,items);mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=true;});
 nearTreeItems.forEach((items,index)=>{if(!items.length)return;const mesh=instances(parent,geometries[index],foliage,items);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=true;});
 // Low, varied shrubs break up hard settlement and field boundaries without a dense grass-card layer.
 for(let i=0;i<Math.min(520,Math.max(300,anchors.length*44))&&anchors.length;i++){
  const anchor=anchors[Math.floor(random()*anchors.length)],angle=random()*Math.PI*2,radial=anchor.radius*(.12+random()*.92),x=anchor.x+Math.cos(angle)*radial,z=anchor.z+Math.sin(angle)*radial;
  if(Math.abs(x)<4300&&Math.abs(z)<2850||isSea(x,z))continue;
  const height=.75+random()*.75,ground=terrainSurfaceHeight(x,z),scale=1.15+random()*1.45;
  shrubItems.push({x,y:ground+height*.52,z,sx:scale,sy:height,sz:scale*(.72+random()*.55),ry:random()*Math.PI*2,color:canopyColors[Math.floor(random()*canopyColors.length)]});
 }
 if(shrubItems.length){const shrubs=instances(parent,geometries[0],foliage,shrubItems);shrubs.castShadow=false;shrubs.receiveShadow=true;}
 const trunkMaterial=new THREE.MeshStandardMaterial({color:'#fff',roughness:1});
 if(trunks.length){const wood=instances(parent,new THREE.CylinderGeometry(1,1,1,7),trunkMaterial,trunks);wood.castShadow=false;wood.receiveShadow=true;}
 if(nearTrunks.length){const wood=instances(parent,new THREE.CylinderGeometry(1,1,1,7),trunkMaterial,nearTrunks);wood.castShadow=true;wood.receiveShadow=true;}

 return {update(time:number,windFromDegrees:number,windSpeed:number,wetness:number){
  const direction=(windFromDegrees+180)*Math.PI/180;
  windTime.value=time*1.05;windStrength.value=Math.min(1.1,Math.max(.035,windSpeed/19));windDirection.value.set(Math.sin(direction),Math.cos(direction));foliageWetness.value=THREE.MathUtils.clamp(wetness,0,1);
 }};
}
