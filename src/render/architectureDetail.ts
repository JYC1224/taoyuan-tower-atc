import * as THREE from 'three';
import type {Terminal} from '../data/airport';
import {box,cylinder,material,pavement,instances,canvasTexture,seeded} from './primitives';
import {isSea} from './coastline';
import {roofMaterial} from './roofMaterial';

const pearl=material('#d3d8d8',.62,.18),silver=material('#aab7bf',.4,.58),dark=material('#566b78',.38,.25);
const roofPearl=roofMaterial('#d6d8d3',.62,.14),roofSilver=roofMaterial('#615c52',.68,.14);

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
  // The public hall sees a bright acoustic liner beneath the weather roof.
  // Keeping this as a separate inner skin gives T1 its photographed white,
  // folded ceiling while leaving the exterior roof finish intact.
  const innerPositions=Float32Array.from(p,(value,index)=>index%3===1?value-.28:value),innerGeometry=new THREE.BufferGeometry();
  innerGeometry.setAttribute('position',new THREE.Float32BufferAttribute(innerPositions,3));innerGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));innerGeometry.setIndex(indices);innerGeometry.computeVertexNormals();
  const innerFinish=new THREE.MeshStandardMaterial({color:'#f2f2ed',roughness:.82,metalness:.012,emissive:'#d8d9d1',emissiveIntensity:.4,side:THREE.DoubleSide});
  const innerSkin=new THREE.Mesh(innerGeometry,innerFinish);innerSkin.castShadow=false;innerSkin.receiveShadow=false;parent.add(innerSkin);
  const interiorRib=new THREE.MeshStandardMaterial({color:'#e1e3de',roughness:.64,metalness:.035,emissive:'#858b85',emissiveIntensity:.08});
  const outerY=(x:number)=>t.height+1+11*Math.pow(Math.abs(x/(w/2)),2.4),innerY=(x:number)=>outerY(x)-.28;
  // The real hall's repeated white cross-ribs project below the folded liner.
  // A shallow extrusion makes the transverse roof rhythm visible from the floor
  // instead of hiding a fine tube inside the ceiling panel.
  const ribSection=new THREE.Shape();
  for(let j=0;j<=segments;j++){const x=(j/segments-.5)*w;if(j===0)ribSection.moveTo(x,innerY(x)-.16);else ribSection.lineTo(x,innerY(x)-.16);}
  for(let j=segments;j>=0;j--){const x=(j/segments-.5)*w;ribSection.lineTo(x,innerY(x)-1.28);}
  ribSection.closePath();
  const ribGeometry=new THREE.ExtrudeGeometry(ribSection,{depth:.52,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.035,bevelThickness:.035,curveSegments:2}),ribStations=Math.floor(d/7.5)+1,ribs=new THREE.InstancedMesh(ribGeometry,interiorRib,ribStations),ribTransform=new THREE.Object3D();
  let ribIndex=0;for(let z=-d/2;z<=d/2;z+=7.5){ribTransform.position.set(t.x,0,t.z+z-.26);ribTransform.updateMatrix();ribs.setMatrixAt(ribIndex++,ribTransform.matrix);}ribs.count=ribIndex;ribs.instanceMatrix.needsUpdate=true;ribs.castShadow=false;ribs.receiveShadow=false;parent.add(ribs);
  for(let x=-w/2+12;x<w/2;x+=12){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(t.x+x,innerY(x)-.48,t.z-d/2),new THREE.Vector3(t.x+x,innerY(x)-.48,t.z+d/2)]),purlin=new THREE.Mesh(new THREE.TubeGeometry(curve,2,.055,6,false),interiorRib);purlin.castShadow=false;parent.add(purlin);}
  const ceilingLight=new THREE.MeshBasicMaterial({color:'#fff0d3',toneMapped:false});
  for(let x=-w/2+20;x<w/2-12;x+=18){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(t.x+x,innerY(x)-.64,t.z-d/2),new THREE.Vector3(t.x+x,innerY(x)-.64,t.z+d/2)]),strip=new THREE.Mesh(new THREE.TubeGeometry(curve,2,.065,6,false),ceilingLight);strip.castShadow=false;parent.add(strip);}
  for(const side of [-1,1]){box(parent,18,.65,d+9,t.x+side*(w/2-7),t.height+12,t.z,pearl);for(let z=-d/2+10;z<d/2;z+=20){const c=box(parent,.9,t.height+10,1.1,t.x+side*(w/2-13),(t.height+10)/2,t.z+z,pearl);c.rotation.z=-side*.10;}}
 }else if(t.id==='T2'){
  // T2's high public hall reads as a glazed space frame. The previous solid
  // two-metre inner slab hid this structure and made the atrium look sealed.
  // T2's check-in hall is capped by dark, tinted glazing over a prominent
  // space-frame. Too-clear glazing washed out the trusses from inside.
  const glassRoof=new THREE.MeshPhysicalMaterial({color:'#26312e',roughness:.42,metalness:.02,transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide,envMapIntensity:.12,clearcoat:.2,clearcoatRoughness:.36});
  glassRoof.forceSinglePass=true;
  const panels:Parameters<typeof instances>[3]=[],trusses:Parameters<typeof instances>[3]=[],diagonalMatrices:THREE.Matrix4[]=[];
  const panelStep=15.2,panelSize=14.2,roofY=t.height+.28;
  for(let x=-t.width/2+panelStep/2;x<t.width/2;x+=panelStep){
   for(let z=-t.depth/2+panelStep/2;z<t.depth/2;z+=panelStep)panels.push({x:t.x+x,y:roofY,z:t.z+z,sx:panelSize,sy:.1,sz:panelSize});
   trusses.push({x:t.x+x,y:t.height-.12,z:t.z,sx:.28,sy:.48,sz:t.depth+5});
  }
  for(let z=-t.depth/2+panelStep/2;z<t.depth/2;z+=panelStep)trusses.push({x:t.x,y:t.height-.12,z:t.z+z,sx:t.width+5,sy:.48,sz:.28});
  // T2's roof reads as a triangulated steel space frame in interior photos,
  // rather than a plain square grid. Use one batched set of slim round
  // diagonals per glass bay to add that depth without hundreds of draw calls.
  const diagonalGeometry=new THREE.CylinderGeometry(.5,.5,1,6,1,false),beamDummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),beamStart=new THREE.Vector3(),beamEnd=new THREE.Vector3(),beamDirection=new THREE.Vector3(),braceY=t.height-.3;
  for(let x0=-t.width/2;x0<t.width/2;x0+=panelStep)for(let z0=-t.depth/2;z0<t.depth/2;z0+=panelStep){
   const x1=Math.min(x0+panelStep,t.width/2),z1=Math.min(z0+panelStep,t.depth/2);
   for(const [ax,az,bx,bz] of [[x0,z0,x1,z1],[x0,z1,x1,z0]]){
    beamStart.set(t.x+ax,braceY,t.z+az);beamEnd.set(t.x+bx,braceY,t.z+bz);beamDirection.subVectors(beamEnd,beamStart);
    beamDummy.position.copy(beamStart).add(beamEnd).multiplyScalar(.5);beamDummy.quaternion.setFromUnitVectors(up,beamDirection.clone().normalize());beamDummy.scale.set(.14,beamDirection.length(),.14);beamDummy.updateMatrix();diagonalMatrices.push(beamDummy.matrix.clone());
   }
  }
  const trussFinish=new THREE.MeshStandardMaterial({color:'#4f524d',roughness:.48,metalness:.44}),braceFinish=new THREE.MeshStandardMaterial({color:'#62645d',roughness:.5,metalness:.38});
  const glazing=instances(parent,new THREE.BoxGeometry(1,1,1),glassRoof,panels);glazing.castShadow=false;glazing.receiveShadow=false;
  const frame=instances(parent,new THREE.BoxGeometry(1,1,1),trussFinish,trusses);frame.castShadow=false;frame.receiveShadow=true;
  const bracing=new THREE.InstancedMesh(diagonalGeometry,braceFinish,diagonalMatrices.length);diagonalMatrices.forEach((matrix,index)=>bracing.setMatrixAt(index,matrix));bracing.instanceMatrix.needsUpdate=true;bracing.castShadow=false;bracing.receiveShadow=true;parent.add(bracing);
  for(const side of [-1,1]){
   box(parent,t.width+18,.8,2.6,t.x,t.height+.15,t.z+side*(t.depth/2+1),roofPearl);
   box(parent,2.6,.8,t.depth+18,t.x+side*(t.width/2+1),t.height+.15,t.z,roofPearl);
   box(parent,t.width+35,.8,25,t.x,t.height*.6,t.z+side*(t.depth/2+8),pearl);
   for(let x=-t.width/2;x<=t.width/2;x+=15){const truss=box(parent,.7,t.height,1,t.x+x,t.height/2,t.z+side*(t.depth/2+4),silver);truss.rotation.x=side*.14;}
  }
 }else{
  box(parent,t.width+9,1.5,t.depth+9,t.x,t.height+.7,t.z,roofPearl);
  for(let x=-t.width/2+12;x<t.width/2;x+=18)box(parent,1,.6,t.depth+8,t.x+x,t.height+1.8,t.z,silver);
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
