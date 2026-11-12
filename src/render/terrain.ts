import * as THREE from 'three';
import terrain from '../data/taoyuanTerrain.json';
import {isSea} from './coastline';

const {minX,minZ,step,width,height,heights}=terrain;
const maxX=minX+step*(width-1),maxZ=minZ+step*(height-1);
const smooth=(a:number,b:number,v:number)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
const vertices=new Float32Array(width*height);vertices.fill(Number.NaN);

/** Resampled elevation in metres; zero represents the airport's simplified reference plane. */
export function terrainHeight(x:number,z:number){
 const u=(x-minX)/step,v=(z-minZ)/step;
 if(u<0||v<0||u>=width-1||v>=height-1||isSea(x,z))return 0;
 const ix=Math.floor(u),iz=Math.floor(v),fx=u-ix,fz=v-iz,i=iz*width+ix;
 const a=heights[i]*(1-fx)+heights[i+1]*fx,b=heights[i+width]*(1-fx)+heights[i+width+1]*fx;
 const elevation=Math.max(0,a*(1-fz)+b*fz-33);
 // Blend away from existing runways, gates and approach visual geometry.
 const airportFade=smooth(6500,10500,Math.max(Math.abs(x),Math.abs(z)));
 const edgeFade=smooth(0,6000,Math.min(x-minX,maxX-x,z-minZ,maxZ-z));
 return elevation*airportFade*edgeFade;
}

function vertexHeight(ix:number,iz:number){
 const index=iz*width+ix;if(Number.isNaN(vertices[index])){const h=terrainHeight(minX+ix*step,minZ+iz*step);vertices[index]=h>.01?h+.04:-.21;}return vertices[index];
}

/** Match the actual rendered triangles so roads and scenery sit on the mesh. */
export function terrainSurfaceHeight(x:number,z:number){
 const u=(x-minX)/step,v=(z-minZ)/step;
 if(u<0||v<0||u>=width-1||v>=height-1)return -.19;
 const ix=Math.floor(u),iz=Math.floor(v),fx=u-ix,fz=v-iz;
 const a=vertexHeight(ix,iz),b=vertexHeight(ix+1,iz),c=vertexHeight(ix,iz+1),d=vertexHeight(ix+1,iz+1);
 const h=fx+fz<=1?a+fx*(b-a)+fz*(c-a):d+(1-fx)*(c-d)+(1-fz)*(b-d);
 return Math.max(-.19,h);
}

/** Shared regional ground material: the local land-use atlas fades into the existing wide-area map. */
export function regionalGroundMaterial(texture:THREE.Texture,localLandcover:THREE.Texture,localExtent:number){
 const mat=new THREE.MeshStandardMaterial({map:texture,color:'#d6dec8',roughness:1,metalness:0});
 const landcoverUniform={value:localLandcover},landcoverExtent={value:localExtent};
 mat.onBeforeCompile=shader=>{
  shader.uniforms.localLandcoverMap=landcoverUniform;shader.uniforms.localLandcoverExtent=landcoverExtent;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 terrainWorld;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nterrainWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 terrainWorld;\nuniform sampler2D localLandcoverMap;\nuniform float localLandcoverExtent;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec2 landcoverUv=vec2(terrainWorld.x/localLandcoverExtent+.5,.5-terrainWorld.z/localLandcoverExtent);
   // CanvasTexture uses an sRGB GPU format; sampling already converts to linear space.
   vec3 localLandcoverColor=texture2D(localLandcoverMap,landcoverUv).rgb;
   float localBlend=1.0-smoothstep(localLandcoverExtent*.36,localLandcoverExtent*.5,max(abs(terrainWorld.x),abs(terrainWorld.z)));
   diffuseColor.rgb=mix(diffuseColor.rgb,localLandcoverColor,localBlend);
   float wooded=smoothstep(80.0,350.0,terrainWorld.y);
   float canopy=sin(terrainWorld.x*.013)*sin(terrainWorld.z*.017)*.09+sin(terrainWorld.x*.034+terrainWorld.z*.026)*.035;
   vec3 woodland=vec3(.18,.27,.15)*(1.0+canopy);
   diffuseColor.rgb=mix(diffuseColor.rgb,woodland,wooded*.90);
  `);
 };
 mat.customProgramCacheKey=()=> 'taoyuan-regional-ground-landcover-v2';
 return mat;
}

/** Culling-sized meshes keep distant terrain cheap and leave the airport surfaces undisturbed. */
export function addTerrain(parent:THREE.Group,mat:THREE.Material,extent:number){
 const chunks=40;
 for(let z0=0;z0<height-1;z0+=chunks)for(let x0=0;x0<width-1;x0+=chunks){
  const nx=Math.min(chunks,width-1-x0),nz=Math.min(chunks,height-1-z0),p:number[]=[],uv:number[]=[],idx:number[]=[];
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
   const x=minX+(x0+i)*step,z=minZ+(z0+j)*step;
   // Hide the terrain beneath the airport and the ocean when it has no relief.
   const y=vertexHeight(x0+i,z0+j);
   p.push(x,y,z);uv.push((x+extent/2)/extent,(extent/2-z)/extent);
  }
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;idx.push(a,b,a+1,a+1,b,b+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,mat);mesh.receiveShadow=false;parent.add(mesh);
 }
}
