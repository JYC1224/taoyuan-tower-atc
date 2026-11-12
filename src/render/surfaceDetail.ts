import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {canvasTexture,seeded} from './primitives';
import {surfaceImages} from './realismAssets';

const surfaceAtmosphere={time:{value:0},cloudStrength:{value:0},windDirection:{value:new THREE.Vector2(0,1)},windSpeed:{value:0}};
const cloudShadowChunk=`
 float cloudTravel=surfaceTime*surfaceWindSpeed*.00018;
 vec2 cloudUv=surfaceWorld.xz*.00035+surfaceWindDirection*cloudTravel;
 float cloudA=sin(cloudUv.x*2.2+sin(cloudUv.y*1.25)*1.3);
 float cloudB=sin(cloudUv.y*1.8+cos(cloudUv.x*1.45)*.95);
 float cloudShape=smoothstep(.02,.88,cloudA*cloudB*.5+.5);
 diffuseColor.rgb*=1.0-cloudShape*surfaceCloudStrength*.18;
`;

/** Updates the slow, wind-driven cloud shade shared by airport ground materials. */
export function updateSurfaceAtmosphere(time:number,cloudiness:number,windFromDegrees:number,windKnots:number,sunHeight:number){
 const angle=(windFromDegrees+180)*Math.PI/180;
 surfaceAtmosphere.time.value=time;
 surfaceAtmosphere.cloudStrength.value=THREE.MathUtils.clamp(cloudiness*sunHeight*.72,0,.62);
 surfaceAtmosphere.windDirection.value.set(Math.sin(angle),Math.cos(angle));
 surfaceAtmosphere.windSpeed.value=THREE.MathUtils.clamp(windKnots,0,40);
}

/** Original procedural assets. World UVs keep intersecting pavement pieces in phase. */
function turf(ctx:CanvasRenderingContext2D,size:number){
 const rand=seeded(849),image=ctx.createImageData(size,size),layers=[5,17,53,151].map(n=>({n,values:Float32Array.from({length:n*n},()=>rand())}));
 const sample=(x:number,y:number,layer:typeof layers[number])=>{const {n,values}=layer,u=x/size*n,v=y/size*n,ix=Math.floor(u),iy=Math.floor(v),fx=u-ix,fy=v-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),at=(a:number,b:number)=>values[((b+n)%n)*n+(a+n)%n];return THREE.MathUtils.lerp(THREE.MathUtils.lerp(at(ix,iy),at(ix+1,iy),sx),THREE.MathUtils.lerp(at(ix,iy+1),at(ix+1,iy+1),sx),sy);};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const broad=sample(x,y,layers[0]),soil=Math.max(0,.46-broad),value=1+(broad-.5)*.25+(sample(x,y,layers[1])-.5)*.14+(sample(x,y,layers[2])-.5)*.065+(sample(x,y,layers[3])-.5)*.035+Math.sin(y/size*Math.PI*24)*.018,i=(y*size+x)*4;image.data[i]=176*value+soil*25;image.data[i+1]=184*value-soil*18;image.data[i+2]=150*value;image.data[i+3]=255;}
 ctx.putImageData(image,0,0);
}
export function surfaceMaterial(kind:'grass',color:string):THREE.MeshLambertMaterial;
export function surfaceMaterial(kind:'concrete'|'asphalt'|'runway',color:string):THREE.MeshStandardMaterial;
export function surfaceMaterial(kind:'concrete'|'asphalt'|'runway'|'grass',color:string){
 const rand=seeded(kind==='concrete'?491:kind==='asphalt'?92:503),size=512;
 const map=canvasTexture(size,size,ctx=>{
  if(kind==='grass'){turf(ctx,size);return;}
  ctx.fillStyle=kind==='concrete'?'#c7c8c5':'#929592';ctx.fillRect(0,0,size,size);
  for(let i=0;i<22000;i++){const n=rand(),v=Math.round(100+n*100);ctx.fillStyle=`rgba(${v},${v},${v},.1)`;ctx.fillRect(rand()*size,rand()*size,1+rand()*2,1+rand()*2);}
  if(kind==='concrete'){ctx.strokeStyle='#858b8850';ctx.lineWidth=1.1;for(let x=0;x<=size;x+=128){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,size);ctx.moveTo(0,x);ctx.lineTo(size,x);ctx.stroke();}ctx.strokeStyle='#e9e9e430';ctx.strokeRect(2,2,124,124);}
 });map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;
 const m=kind==='grass'?new THREE.MeshLambertMaterial({color,map}):new THREE.MeshStandardMaterial({color,map,roughness:1,metalness:0});
 m.userData.worldUV=kind==='grass'?1/110:kind==='runway'?1/15:1/3;m.userData.dryColor=m.color.clone();m.userData.noShadow=true;
 if(kind==='grass'){
  m.onBeforeCompile=shader=>{
   shader.uniforms.surfaceTime=surfaceAtmosphere.time;shader.uniforms.surfaceCloudStrength=surfaceAtmosphere.cloudStrength;shader.uniforms.surfaceWindDirection=surfaceAtmosphere.windDirection;shader.uniforms.surfaceWindSpeed=surfaceAtmosphere.windSpeed;
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 surfaceWorld;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nsurfaceWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 surfaceWorld;uniform float surfaceTime;uniform float surfaceCloudStrength;uniform vec2 surfaceWindDirection;uniform float surfaceWindSpeed;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>${cloudShadowChunk}`);
  };
  m.customProgramCacheKey=()=> 'taoyuan-grass-cloud-shadow-v1';
 }
 if(kind!=='grass'){
  m.userData.groundDetailRange={value:250*250};
  m.userData.surfaceWetness={value:0};
  m.onBeforeCompile=shader=>{
   shader.uniforms.groundDetailRange=m.userData.groundDetailRange;
   shader.uniforms.surfaceWetness=m.userData.surfaceWetness;
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 surfaceWorld;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nsurfaceWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 surfaceWorld;uniform float groundDetailRange;uniform float surfaceWetness;uniform float surfaceTime;uniform float surfaceCloudStrength;uniform vec2 surfaceWindDirection;uniform float surfaceWindSpeed;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','if(dot(surfaceWorld-cameraPosition,surfaceWorld-cameraPosition)<groundDetailRange){\n#include <normal_fragment_maps>\n}');
   const concrete=kind==='concrete',runway=kind==='runway';
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>${cloudShadowChunk}
    float grain=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
    diffuseColor.rgb=${concrete?'mix(vec3(.285,.292,.287),vec3(grain)*1.65,.56)':'mix(vec3(grain),diffuseColor.rgb,.14)*.78'};
    vec2 slab=abs(fract(surfaceWorld.xz/${concrete?'6.0':runway?'180.0':'45.0'})-.5);
    vec2 aa=max(fwidth(surfaceWorld.xz/${concrete?'6.0':runway?'180.0':'45.0'}),vec2(.0001));
    float seam=max(smoothstep(.499-aa.x,.5,slab.x),smoothstep(.499-aa.y,.5,slab.y));
    diffuseColor.rgb*=1.0-seam*${concrete?'.10':runway?'.006':'.018'};
    float surfaceVariation=sin(surfaceWorld.x*.018)*sin(surfaceWorld.z*.023)+sin(surfaceWorld.x*.055+surfaceWorld.z*.031)*.3;
    diffuseColor.rgb*=1.0+surfaceVariation*${concrete?'.022':runway?'.035':'.05'};
    float macroWear=sin(surfaceWorld.x*.0073+sin(surfaceWorld.z*.0041))*sin(surfaceWorld.z*.0087+surfaceWorld.x*.0032);
    float aggregate=sin(surfaceWorld.x*.73+sin(surfaceWorld.z*.51))*sin(surfaceWorld.z*.91+surfaceWorld.x*.27);
    diffuseColor.rgb*=1.0+macroWear*${runway?'.035':'.018'}+aggregate*${runway?'.018':'.012'};
    float dampPattern=sin(surfaceWorld.x*.045+sin(surfaceWorld.z*.021))*sin(surfaceWorld.z*.039+sin(surfaceWorld.x*.016));
    float dampPatch=smoothstep(.15,.75,dampPattern)*surfaceWetness;
    diffuseColor.rgb*=1.0-dampPatch*.12;
   `);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    roughnessFactor=clamp(roughnessFactor*(1.0-dampPatch*.55),.12,1.0);
   `);
  };
  m.customProgramCacheKey=()=>`real-surface-${kind}`;
  const pbr=m as THREE.MeshStandardMaterial;surfaceImages(kind).then(images=>{const fallback=pbr.map;pbr.map=images.color;pbr.normalMap=images.normal;pbr.normalScale.setScalar(kind==='concrete'?.16:kind==='runway'?.22:.25);pbr.roughnessMap=images.roughness;pbr.needsUpdate=true;fallback?.dispose();});
 }
 return m;
}

export function applyWorldUV(geometry:THREE.BufferGeometry,scale:number){
 const p=geometry.getAttribute('position'),uv=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i++){uv[i*2]=p.getX(i)*scale;uv[i*2+1]=p.getZ(i)*scale;}
 geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
}

export function applyFacadeUV(geometry:THREE.BufferGeometry,tileWidth=4,tileHeight=5){const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal'),uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));if(ny>.5){uv[i*2]=p.getX(i)/tileWidth;uv[i*2+1]=p.getZ(i)/tileWidth;}else{uv[i*2]=(nx>.5?p.getZ(i):p.getX(i))/tileWidth;uv[i*2+1]=p.getY(i)/tileHeight;}}geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));}

export function facadeTexture(emissive=false){
 const rand=seeded(758),tex=canvasTexture(512,512,ctx=>{
  ctx.fillStyle=emissive?'#050607':'#8a9a9f';ctx.fillRect(0,0,512,512);
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
   const x=col*128+4,y=row*128+7,w=120,h=105,lit=rand()>.32;
   if(emissive){ctx.fillStyle=lit?['#b8b5a0','#b9c0b5','#d1c9ac'][Math.floor(rand()*3)]:'#15202a';ctx.fillRect(x,y,w,h);ctx.fillStyle='#151d23';ctx.fillRect(x+17,y+53,w-31,8);ctx.fillRect(x+24,y+61,5,39);ctx.fillRect(x+w-27,y+61,5,39);}
   else {const g=ctx.createLinearGradient(x,y,x+20,y+h);g.addColorStop(0,'#9aafba');g.addColorStop(.46,'#6f8999');g.addColorStop(.5,'#526775');g.addColorStop(1,'#334854');ctx.fillStyle=g;ctx.fillRect(x,y,w,h);ctx.fillStyle=`rgba(9,25,35,${.09+rand()*.14})`;ctx.fillRect(x+7+rand()*20,y+20,24+rand()*35,75);ctx.strokeStyle='#adbac0';ctx.lineWidth=1.2;ctx.strokeRect(x+.5,y+.5,w-1,h-1);}
   ctx.fillStyle=emissive?'#000000':'#bcc5c6';ctx.fillRect(x+59,y,2,h);ctx.fillRect(x,y+h+4,w,12);
  }
 });tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=8;tex.repeat.set(.5,.5);return tex;
}

/** Matte frames and smoother glass react differently to changing sky reflections. */
export function facadeRoughness(){
 const tex=canvasTexture(512,512,ctx=>{
  ctx.fillStyle='#d4d4d4';ctx.fillRect(0,0,512,512);
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
   const x=col*128+4,y=row*128+7;
   const gradient=ctx.createLinearGradient(x,y,x+120,y+105);gradient.addColorStop(0,'#686868');gradient.addColorStop(.5,'#555555');gradient.addColorStop(1,'#777777');ctx.fillStyle=gradient;ctx.fillRect(x,y,120,105);
   ctx.fillStyle='#b0b0b0';ctx.fillRect(x+59,y,2,105);
  }
 });tex.colorSpace=THREE.NoColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(.5,.5);return tex;
}

/** Batches only direct, static mesh children. Animated subgroups remain intact. */
export function batchStatic(parent:THREE.Group,excluded:THREE.Object3D[]=[]){
 parent.updateMatrixWorld(true);const batches=new Map<string,{material:THREE.Material;geometries:THREE.BufferGeometry[];cast:boolean;receive:boolean}>();
 for(const o of [...parent.children]){if(!(o instanceof THREE.Mesh)||o instanceof THREE.InstancedMesh||excluded.includes(o)||Array.isArray(o.material)||o.material.transparent||o.userData.workstation)continue;
  const key=o.material.uuid+o.castShadow+o.receiveShadow;let b=batches.get(key);if(!b){b={material:o.material,geometries:[],cast:o.castShadow,receive:o.receiveShadow};batches.set(key,b);}
  const geometry=o.geometry.index?o.geometry.clone():o.geometry.clone().setIndex(Array.from({length:o.geometry.getAttribute('position').count},(_,i)=>i));
  geometry.applyMatrix4(o.matrix);if(o.material.userData.facade){const [tileWidth,tileHeight]=o.material.userData.facadeUVSize??[4,5];applyFacadeUV(geometry,tileWidth,tileHeight);}if(!geometry.getAttribute('uv'))geometry.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(geometry.getAttribute('position').count*2),2));
  b.geometries.push(geometry);o.geometry.dispose();o.removeFromParent();
 }
 for(const b of batches.values()){const geometry=mergeGeometries(b.geometries);b.geometries.forEach(g=>g.dispose());if(!geometry)continue;const mesh=new THREE.Mesh(geometry,b.material);mesh.castShadow=b.cast;mesh.receiveShadow=b.receive;parent.add(mesh);}
}

export function makeSkyEnvironment(renderer:THREE.WebGLRenderer){
 const tex=canvasTexture(1024,512,ctx=>{const sky=ctx.createLinearGradient(0,0,0,512);sky.addColorStop(0,'#6696bf');sky.addColorStop(.28,'#adc7dc');sky.addColorStop(.49,'#e6eaeb');sky.addColorStop(.52,'#92978a');sky.addColorStop(1,'#646f61');ctx.fillStyle=sky;ctx.fillRect(0,0,1024,512);const sun=ctx.createRadialGradient(710,140,2,710,140,120);sun.addColorStop(0,'#fff7e5');sun.addColorStop(.18,'#fff8e9a0');sun.addColorStop(1,'#fff8e900');ctx.fillStyle=sun;ctx.fillRect(590,20,240,240);});
 tex.mapping=THREE.EquirectangularReflectionMapping;const pmrem=new THREE.PMREMGenerator(renderer),target=pmrem.fromEquirectangular(tex);tex.dispose();pmrem.dispose();return target;
}
