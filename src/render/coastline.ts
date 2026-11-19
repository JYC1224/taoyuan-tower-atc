import * as THREE from 'three';
import coast from '../data/coastline.json';
import {canvasTexture} from './primitives';

const limit=160000;
const points=coast.points as [number,number][];
// The measured chain is continued at each end for the distant visual backdrop only.
const seaPolygon:[number,number][]=[[-limit,points[0][1]],...points,[limit,points[points.length-1][1]],[limit,-limit],[-limit,-limit]];
// Index polygon edges by latitude-like z bands; this retains the exact polygon test
// while avoiding a full coastline scan for every terrain and building sample.
const bandSize=2000,bands:[number,number,number,number][][]=Array.from({length:Math.ceil(limit*2/bandSize)+1},()=>[]);
for(let i=0,j=seaPolygon.length-1;i<seaPolygon.length;j=i++){
 const [xi,zi]=seaPolygon[i],[xj,zj]=seaPolygon[j];
 const first=Math.max(0,Math.floor((Math.min(zi,zj)+limit)/bandSize)),last=Math.min(bands.length-1,Math.floor((Math.max(zi,zj)+limit)/bandSize));
 for(let band=first;band<=last;band++)bands[band].push([xi,zi,xj,zj]);
}

/** Point-in-polygon classification for visual scenery, never used for navigation. */
export function isSea(x:number,z:number){
 let inside=false;const band=Math.floor((z+limit)/bandSize);if(band<0||band>=bands.length)return false;
 for(const [xi,zi,xj,zj] of bands[band]){
  if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)inside=!inside;
 }
 return inside;
}

export function createCoastalWater(parent:THREE.Group){
 const shape=new THREE.Shape();seaPolygon.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 const geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);
 const waveTime={value:0},waveStrength={value:.6},windDirection={value:new THREE.Vector2(0,1)},sunDirection={value:new THREE.Vector3(0,1,0)},sunColor={value:new THREE.Color('#fff0db')},sunIntensity={value:0},cloudiness={value:.2};
 // A softly blurred coastline mask gives the shelf water a natural green cast without
 // changing the mapped shoreline geometry or adding another full-size water mesh.
 const shoreCanvas=document.createElement('canvas');shoreCanvas.width=shoreCanvas.height=1024;
 const shoreContext=shoreCanvas.getContext('2d');if(!shoreContext)throw new Error('Canvas2D is unavailable for the coastal water mask');
 const shoreExtent=80000,shorePoint=(x:number,z:number)=>[(x+shoreExtent)/(shoreExtent*2)*shoreCanvas.width,(shoreExtent-z)/(shoreExtent*2)*shoreCanvas.height] as const;
 shoreContext.fillStyle='#000';shoreContext.fillRect(0,0,shoreCanvas.width,shoreCanvas.height);shoreContext.strokeStyle='#fff';shoreContext.lineWidth=1.5;shoreContext.lineJoin='round';shoreContext.lineCap='round';shoreContext.beginPath();
 points.forEach(([x,z],i)=>{const [px,py]=shorePoint(x,z);i?shoreContext.lineTo(px,py):shoreContext.moveTo(px,py);});shoreContext.filter='blur(11px)';shoreContext.stroke();shoreContext.filter='none';
 const shoreMap=new THREE.CanvasTexture(shoreCanvas);shoreMap.colorSpace=THREE.NoColorSpace;shoreMap.wrapS=shoreMap.wrapT=THREE.ClampToEdgeWrapping;shoreMap.minFilter=THREE.LinearMipmapLinearFilter;shoreMap.magFilter=THREE.LinearFilter;shoreMap.generateMipmaps=true;
 const water=new THREE.MeshPhysicalMaterial({color:'#0d4354',roughness:.2,metalness:0,ior:1.333,envMapIntensity:.65});water.userData.coastalWater=true;
 water.onBeforeCompile=shader=>{
  shader.uniforms.seaTime=waveTime;shader.uniforms.seaStrength=waveStrength;shader.uniforms.seaWindDirection=windDirection;shader.uniforms.seaSunDirection=sunDirection;shader.uniforms.seaSunColor=sunColor;shader.uniforms.seaSunIntensity=sunIntensity;shader.uniforms.seaCloudiness=cloudiness;shader.uniforms.seaShore={value:shoreMap};
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 seaWorld;varying vec2 seaUv;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nseaWorld=(modelMatrix*vec4(transformed,1.0)).xyz;seaUv=(seaWorld.xz+vec2(80000.0))/160000.0;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 seaWorld;varying vec2 seaUv;uniform float seaTime,seaStrength,seaSunIntensity,seaCloudiness;uniform vec2 seaWindDirection;uniform vec3 seaSunDirection,seaSunColor;uniform sampler2D seaShore;
   float seaHash(vec2 p){vec2 q=fract(p*vec2(.10312749,.10306273));q+=dot(q,q.yx+33.33);return fract((q.x+q.y)*q.x);}
   vec3 seaNoiseGrad(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f),du=6.0*f*(1.0-f);float a=seaHash(i),b=seaHash(i+vec2(1,0)),c=seaHash(i+vec2(0,1)),d=seaHash(i+vec2(1,1));float lower=mix(a,b,u.x),upper=mix(c,d,u.x);return vec3(mix(lower,upper,u.y),mix((b-a)*du.x,(d-c)*du.x,u.y),(upper-lower)*du.y);}
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float shore=texture2D(seaShore,clamp(seaUv,vec2(0.0),vec2(1.0))).r;
   float shelf=smoothstep(0.0,.72,shore);
   vec2 seaP=seaWorld.xz;float shelfPattern=sin(dot(seaP,vec2(.013,.009))+seaTime*.22)*.5+.5;
   vec3 shelfColor=vec3(.018,.145,.15)*(1.0+shelfPattern*.10);
   diffuseColor.rgb=mix(diffuseColor.rgb,shelfColor,shelf*.38);
   float broadTone=.97+.025*sin(dot(seaP,vec2(.0011,-.0017))+seaTime*.07);
   diffuseColor.rgb*=broadTone;
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec2 p=seaWorld.xz;float t=seaTime;vec2 wind=normalize(seaWindDirection),crossWind=vec2(-wind.y,wind.x);
   float k1=.031,phase1=dot(p,wind*k1)-t*.52;
   float k2=.078,phase2=dot(p,(wind*.78+crossWind*.63)*k2)-t*.83+1.7;
   vec2 secondSwell=wind*.56+crossWind*.83;float phase5=dot(p,secondSwell*.019)-t*.34+2.4;
   vec2 longSwell=wind*cos(phase1)*(.023*seaStrength)+secondSwell*cos(phase5)*(.018*seaStrength);
   vec2 midSwell=(wind*.78+crossWind*.63)*cos(phase2)*(.027*seaStrength);
   float seaDistance=distance(cameraPosition,seaWorld);
   float longFade=1.0-smoothstep(3200.0,14000.0,seaDistance),midFade=1.0-smoothstep(1500.0,7200.0,seaDistance);
   float shortFade=1.0-smoothstep(500.0,2400.0,seaDistance),microFade=1.0-smoothstep(120.0,950.0,seaDistance);
   vec2 shortWaves=vec2(0.0),microWaves=vec2(0.0);
   if(shortFade>0.0){float phase3=dot(p,(wind*.42-crossWind*.91)*.34)-t*1.55+3.1;shortWaves=(wind*.42-crossWind*.91)*cos(phase3)*(.012*seaStrength);}
   if(microFade>0.0){float phase4=dot(p,(wind*.94+crossWind*.34)*.71)-t*2.15+.8;microWaves=(wind*.94+crossWind*.34)*cos(phase4)*(.006*seaStrength);vec3 irregular=seaNoiseGrad(vec2(dot(p,wind)*.115,dot(p,crossWind)*.30)+vec2(t*.055,t*.019));microWaves+=(wind*irregular.y*.115+crossWind*irregular.z*.30)*(.20*seaStrength);}
   vec2 slope=longSwell*longFade+midSwell*midFade+shortWaves*shortFade+microWaves*microFade;
   vec3 waveNormal=normalize(vec3(-slope.x*2.1,1.0,-slope.y*2.1));
   normal=normalize(mix(normal,normalize(mat3(viewMatrix)*waveNormal),.92));
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   float waterRoughVariation=0.0;if(distance(cameraPosition,seaWorld)<7000.0)waterRoughVariation=(abs(sin(dot(seaWorld.xz,vec2(.11,.07))-seaTime*1.6))+abs(sin(dot(seaWorld.xz,vec2(-.16,.13))-seaTime*1.2)))*.012*seaStrength;
   roughnessFactor=clamp(roughnessFactor+waterRoughVariation+seaCloudiness*.018,.075,.78);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
   if(seaSunIntensity>0.0){
    vec3 seaSunView=normalize(mat3(viewMatrix)*seaSunDirection);vec3 seaViewDirection=normalize(vViewPosition);
    float sunFacing=max(dot(normal,seaSunView),0.0);
    float sunGlint=pow(max(dot(reflect(-seaSunView,normal),seaViewDirection),0.0),mix(80.0,20.0,seaStrength));
    outgoingLight+=seaSunColor*sunGlint*sunFacing*seaSunIntensity*.32*(1.0-seaCloudiness*.68);
   }
   #include <opaque_fragment>
  `);
 };
 water.customProgramCacheKey=()=> 'coastal-water-v2';
 // A small visual offset prevents long-distance z-fighting with the landscape plane.
 const ocean=new THREE.Mesh(geometry,water);ocean.position.y=2.5;ocean.receiveShadow=false;parent.add(ocean);

 // A faint, non-navigational surf strip follows the mapped shoreline.
 const position:number[]=[],uv:number[]=[],index:number[]=[];let distance=0;
 for(let i=0;i<points.length-1;i++){
  const [x,z]=points[i],[x2,z2]=points[i+1],dx=x2-x,dz=z2-z,len=Math.hypot(dx,dz);if(len<1)continue;
  let nx=-dz/len,nz=dx/len;
  if(!isSea((x+x2)/2+nx*25,(z+z2)/2+nz*25)){nx=-nx;nz=-nz;}
  const base=position.length/3,width=26;
  position.push(x,2.52,z,x2,2.52,z2,x+nx*width,2.52,z+nz*width,x2+nx*width,2.52,z2+nz*width);
  uv.push(distance/160,0,(distance+len)/160,0,distance/160,1,(distance+len)/160,1);
  index.push(base,base+2,base+1,base+1,base+2,base+3);distance+=len;
 }
 const surfTexture=canvasTexture(128,32,ctx=>{const g=ctx.createLinearGradient(0,0,0,32);g.addColorStop(0,'rgba(232,226,204,.10)');g.addColorStop(.36,'rgba(224,231,223,.34)');g.addColorStop(1,'rgba(224,231,223,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,32);});
 surfTexture.wrapS=THREE.RepeatWrapping;
 const surfGeo=new THREE.BufferGeometry();surfGeo.setAttribute('position',new THREE.Float32BufferAttribute(position,3));surfGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));surfGeo.setIndex(index);surfGeo.computeVertexNormals();
 const surfTime={value:0},foamMaterial=new THREE.MeshBasicMaterial({map:surfTexture,transparent:true,opacity:.48,depthWrite:false,side:THREE.DoubleSide});
 foamMaterial.onBeforeCompile=shader=>{shader.uniforms.surfTime=surfTime;shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float surfTime;').replace('#include <map_fragment>',`vec2 foamUv=vMapUv;float runup=sin(foamUv.x*.19-surfTime*.42+sin(foamUv.x*.047+surfTime*.13)*1.7)*.055+sin(foamUv.x*.61+surfTime*.24)*.018;foamUv.y=clamp(foamUv.y+runup,0.0,1.0);vec4 sampledDiffuseColor=texture2D(map,foamUv);float foamBreak=sin(foamUv.x*.27+sin(foamUv.x*.039+surfTime*.1)*2.1-surfTime*.48)*.72+sin(foamUv.x*.91+surfTime*.31)*.19;sampledDiffuseColor.a*=mix(.24,1.0,smoothstep(-.42,.58,foamBreak));diffuseColor*=sampledDiffuseColor;`);};foamMaterial.customProgramCacheKey=()=> 'coastal-surf-v1';
 const surf=new THREE.Mesh(surfGeo,foamMaterial);surf.renderOrder=1;parent.add(surf);
 return {material:water,waveTime,waveStrength,windDirection,sunDirection,sunColor,sunIntensity,cloudiness,shoreMap,surfTime,surfTexture};
}
