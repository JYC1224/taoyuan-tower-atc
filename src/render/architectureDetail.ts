import * as THREE from 'three';
import type {Terminal} from '../data/airport';
import {box,cylinder,material,pavement,instances,canvasTexture,seeded} from './primitives';
import {isSea} from './coastline';
import {roofMaterial} from './roofMaterial';

const pearl=material('#d3d8d8',.62,.18),silver=material('#aab7bf',.4,.58),dark=material('#566b78',.38,.25);
const roofPearl=roofMaterial('#d3d8d8',.62,.18),roofSilver=roofMaterial('#aab7bf',.48,.38);

/** Architectural interpretation of ANWS' folded west / curved white east shell. */
export function towerSkin(parent:THREE.Group,floor:number){
 const curve=new THREE.CatmullRomCurve3([[8,0,0],[6,8,0],[5.8,22,0],[8.5,36,0],[12,44,0],[12.3,floor-2,0]].map(p=>new THREE.Vector3(...p as [number,number,number])));
 for(const west of [false,true]){
  const positions:number[]=[],uv:number[]=[],index:number[]=[],rings=32,steps=west?6:40;
  for(let j=0;j<=rings;j++){const p=curve.getPoint(j/rings);for(let k=0;k<=steps;k++){const angle=(west?Math.PI/2:-Math.PI/2)+k/steps*Math.PI;const twist=west?Math.sin(j/rings*Math.PI)*.09:0;positions.push(Math.cos(angle+twist)*p.x,p.y,Math.sin(angle+twist)*p.x*.8);uv.push(k/steps,j/rings);}}
  for(let j=0;j<rings;j++)for(let k=0;k<steps;k++){const a=j*(steps+1)+k,b=a+steps+1;index.push(a,b,a+1,a+1,b,b+1);}
  let geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(index);if(west)geo=geo.toNonIndexed();geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,west?silver:pearl);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
 }
 // Panel joints follow the shell, at millimetre visual offset rather than crossed slabs.
 for(let h=5;h<floor-3;h+=3.6){let closest=curve.getPoint(0);for(let j=0;j<=120;j++){const p=curve.getPoint(j/120);if(Math.abs(p.y-h)<Math.abs(closest.y-h))closest=p;}const rim=new THREE.Mesh(new THREE.TorusGeometry(closest.x+.015,.025,4,64),silver);rim.rotation.x=Math.PI/2;rim.scale.y=.8;rim.position.y=h;parent.add(rim);}
 box(parent,2.1,3.3,.12,0,1.65,6.3,dark);
}

export function terminalRoof(parent:THREE.Group,t:Terminal){
 if(t.id==='T1'){
  // Two broad suspended roof wings; sampled curves instead of unused cylinder ribs.
  const w=t.width+24,d=t.depth+14,segments=48,p:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let j=0;j<=segments;j++){const u=j/segments,x=(u-.5)*w,y=t.height+1+11*Math.pow(Math.abs(u-.5)*2,2.4);for(const z of [-d/2,d/2]){p.push(t.x+x,y,t.z+z);uv.push(u,z>0?1:0);}}
  for(let j=0;j<segments;j++){const a=j*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();roofPearl.side=THREE.DoubleSide;const mesh=new THREE.Mesh(g,roofPearl);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
  for(let z=-d/2;z<=d/2;z+=7.5){for(let j=0;j<segments;j++){const u=j/segments,v=(j+1)/segments,x=(u-.5)*w,x2=(v-.5)*w,y=t.height+1+11*Math.pow(Math.abs(u-.5)*2,2.4),y2=t.height+1+11*Math.pow(Math.abs(v-.5)*2,2.4);const rib=box(parent,Math.hypot(x2-x,y2-y),.16,.17,t.x+(x+x2)/2,(y+y2)/2+.12,t.z+z,silver);rib.rotation.z=Math.atan2(y2-y,x2-x);}}
  for(const side of [-1,1]){box(parent,18,.65,d+9,t.x+side*(w/2-7),t.height+12,t.z,pearl);for(let z=-d/2+10;z<d/2;z+=20){const c=box(parent,.9,t.height+10,1.1,t.x+side*(w/2-13),(t.height+10)/2,t.z+z,pearl);c.rotation.z=-side*.10;}}
 }else{
  box(parent,t.width+9,1.5,t.depth+9,t.x,t.height+.7,t.z,roofPearl);
  if(t.id==='T2'){
   box(parent,t.width*.78,2.8,t.depth*.78,t.x,t.height+2.5,t.z,roofSilver);
   for(let x=-t.width*.35;x<t.width*.4;x+=15)box(parent,4,.4,t.depth*.69,t.x+x,t.height+4.1,t.z,dark);
   for(const side of [-1,1]){box(parent,t.width+35,.8,25,t.x,t.height*.6,t.z+side*(t.depth/2+8),pearl);for(let x=-t.width/2;x<=t.width/2;x+=15){const truss=box(parent,.7,t.height,1,t.x+x,t.height/2,t.z+side*(t.depth/2+4),silver);truss.rotation.x=side*.14;}}
  }else{for(let x=-t.width/2+12;x<t.width/2;x+=18)box(parent,1,.6,t.depth+8,t.x+x,t.height+1.8,t.z,silver);}
 }
 // Facade floors and mullions give human scale without extra transparent sorting.
 for(const side of [-1,1]){for(let y=5;y<t.height;y+=5)box(parent,t.width,.28,.22,t.x,y,t.z+side*(t.depth/2+.12),pearl);for(let x=-t.width/2;x<=t.width/2;x+=4)box(parent,.14,t.height,.22,t.x+x,t.height/2,t.z+side*(t.depth/2+.12),silver);}
}

export function landsideDetail(parent:THREE.Group){
 const rand=seeded(678);
 const roofs:Parameters<typeof instances>[3]=[],blocks:Parameters<typeof instances>[3]=[],wallPalette=['#aaaead','#c0bdb1','#969f9f','#b7b6aa','#8b9694'],roofPalette=['#778589','#9a9b91','#596c73','#a6a295','#7e8a83'];
 for(let i=0;i<230;i++){const x=(rand()-.5)*9000,z=(rand()-.5)*6800;if(Math.abs(x)<2750&&Math.abs(z)<1450||z< -2800||isSea(x,z))continue;const h=5+rand()*15,w=22+rand()*80,d=24+rand()*80,ry=rand()<.5?0:Math.PI/2;blocks.push({x,y:h/2,z,sx:w,sy:h,sz:d,ry,color:wallPalette[Math.floor(rand()*wallPalette.length)]});roofs.push({x,y:h+.25,z,sx:w+2,sy:.7,sz:d+2,ry,color:roofPalette[Math.floor(rand()*roofPalette.length)]});}
 const white=material('#ffffff',.92),roofMat=material('#ffffff',.8,.05);instances(parent,new THREE.BoxGeometry(1,1,1),white,blocks);instances(parent,new THREE.BoxGeometry(1,1,1),roofMat,roofs);
 // The airport's north observation deck identifies coastal wind turbines. These
 // are generalized scenery, not surveyed turbine locations or operational data.
 for(let i=0;i<7;i++){const x=-1750+i*540,z=-3180+(i%3)*50;cylinder(parent,1.1,2.4,64,x,32,z,pearl,12);const rotor=new THREE.Group();rotor.position.set(x,64,z);for(let k=0;k<3;k++){const blade=box(rotor,1.7,25,.35,0,13,0,pearl);const angle=k*Math.PI*2/3+i*.67;blade.position.set(Math.sin(angle)*13,Math.cos(angle)*13,0);blade.rotation.z=-angle;}parent.add(rotor);}
}

export function apronLightTexture(){return canvasTexture(128,128,ctx=>{const g=ctx.createRadialGradient(64,64,0,64,64,63);g.addColorStop(0,'#e9f1ff69');g.addColorStop(.35,'#e9f1ff30');g.addColorStop(1,'#e9f1ff00');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);});}
