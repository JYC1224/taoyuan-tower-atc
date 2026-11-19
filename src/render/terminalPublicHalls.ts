import * as THREE from 'three';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {terminals} from '../data/airport';
import type {TerminalBounds} from './terminalArchitecture';
import {box,canvasTexture,instances,material,seeded} from './primitives';
import {T1_PUBLIC_HALL,t1ArrivalHallBounds,t1CheckInBanks} from './terminalPublicHallLayout';
import {T2_PASSENGER_SECTION,T2_ROOF_GRID,placeBuildingRect,t2ArrivalHallFixtures,t2StructuralColumnCenters} from './terminalBuildingLayout';
import {terminalFloorMaterial} from './terminalFloorLighting';

const panelGeometry=new THREE.BoxGeometry(1,1,1);
let graphiteStone:THREE.Material|undefined;

/** Stone inlays give each main walkway an edge and help read the building's scale. */
export function addPublicHallFloorBands(parent:THREE.Object3D,b:TerminalBounds,floor:number,terminal:'T1'|'T2',zone:'arrivals'|'departures'){
 const hall=terminal==='T1'?t1ArrivalHallBounds(b.x,b.z,b.width,b.depth):placeBuildingRect(b,T2_PASSENGER_SECTION.publicHall);
 const y=floor+(terminal==='T2'&&zone==='arrivals'?.043:.035);
 const strip=(width:number,depth:number,x:number,z:number)=>{
  graphiteStone??=terminalFloorMaterial('inlay',{color:'#383c3a'});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),graphiteStone);
  mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.receiveShadow=true;parent.add(mesh);
 };
 if(zone==='arrivals'){
  if(terminal==='T1')for(const side of [-1,1])strip(.21,hall.depth-1.2,hall.x+side*hall.width*.445,hall.z);
  else{
   const fixtures=t2ArrivalHallFixtures(b);
   for(const wall of fixtures.partitionPanels)strip(.62,wall.depth-.1,wall.x-2.1,wall.z);
   for(const rail of fixtures.lowBarriers)strip(1.32,rail.depth+.24,rail.x,rail.z);
  }
 }else{
  const center=terminal==='T1'?b.x+b.width*T1_PUBLIC_HALL.checkInXRatio:b.x+T2_PASSENGER_SECTION.checkInX;
  const spacing=terminal==='T1'?27.3:20.8,depth=b.depth*(terminal==='T1'?.79:.709);
  for(const side of [-1,1]){
   strip(.29,depth,center+side*spacing,b.z);
   strip(2*spacing+.29,.34,center,b.z+side*depth/2);
  }
 }
}

/** T1 check-in photographs show horizontal honey-coloured timber laminations. */
let timber:THREE.MeshStandardMaterial|undefined;
export function t1CheckInTimber(){
 if(timber)return timber;
 const rand=seeded(1132013),map=canvasTexture(1024,512,ctx=>{
  ctx.fillStyle='#ad7f45';ctx.fillRect(0,0,1024,512);
  for(let row=0;row<16;row++){
   const y=row*32,v=Math.round((rand()-.5)*14);
   ctx.fillStyle=`rgb(${175+v},${128+v},${70+v})`;ctx.fillRect(0,y+1,1024,31);
   ctx.fillStyle='rgba(61,40,20,.4)';ctx.fillRect(0,y,1024,1.8);
   ctx.fillStyle='rgba(247,217,158,.24)';ctx.fillRect(0,y+2,1024,.8);
   for(let grain=0;grain<28;grain++){
    const gy=y+3+rand()*27,start=rand()*1024,length=35+rand()*370;
    ctx.strokeStyle=grain%4?'rgba(71,44,21,.10)':'rgba(245,208,139,.17)';ctx.lineWidth=.4+rand()*.7;
    ctx.beginPath();ctx.moveTo(start,gy);ctx.bezierCurveTo(start+length*.3,gy-1,start+length*.65,gy+1,start+length,gy);ctx.stroke();
   }
  }
 });map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;
 timber=new THREE.MeshStandardMaterial({color:'#fff8e8',map,bumpMap:map,bumpScale:.008,roughness:.52,metalness:.015,emissive:'#8b6233',emissiveMap:map,emissiveIntensity:.16});
 return timber;
}

/** Broad ceiling luminaires provide local artificial light, also at night. */
export function hallAreaLight(parent:THREE.Object3D,x:number,y:number,z:number,width:number,depth:number,intensity:number,color='#fff0d9'){
 RectAreaLightUniformsLib.init();
 const light=new THREE.RectAreaLight(color,intensity,width,depth);light.position.set(x,y,z);light.lookAt(x,y-1,z);
 // Forward rendering evaluates every visible area light for the whole scene.
 // Activate this local fill only while a walker is inside its public volume.
 light.userData.hallLightBounds={left:x-width/2-3,right:x+width/2+3,near:z-depth/2-6,far:z+depth/2+6,bottom:y>20?10:0,top:y+.5};light.visible=false;
 light.userData.hallLightIntensity=intensity;
 parent.add(light);return light;
}

/**
 * The check-in reference has shallow cream vaults and continuous light coves
 * below the occupied 3F deck; the outer wing sees the higher catenary roof.
 * Do not substitute an open-to-roof void for the deck visible in the section.
 */
export function t1PublicHallCeilings(parent:THREE.Object3D,b:TerminalBounds,floorY:number){
 const banks=t1CheckInBanks(b.x,b.z,b.width,b.depth),left=b.x+18,right=b.x+b.width*.355,
  ceiling=new THREE.MeshStandardMaterial({color:'#f1efdf',roughness:.84,metalness:.005,emissive:'#d9d5bd',emissiveIntensity:.35,side:THREE.DoubleSide}),
  cove=new THREE.MeshBasicMaterial({color:'#fff3d7',toneMapped:false}),trim=new THREE.MeshStandardMaterial({color:'#d3d4ca',roughness:.58,metalness:.1}),
  positions:number[]=[],uvs:number[]=[],indices:number[]=[],lights:Parameters<typeof instances>[3]=[],seams:Parameters<typeof instances>[3]=[];
 const spacing=banks[1].z-banks[0].z;
 for(let bay=-1;bay<banks.length;bay++){
  const center=banks[0].z+(bay+.5)*spacing,near=center-spacing/2+.15,far=center+spacing/2-.15,base=positions.length/3;
  for(let step=0;step<=24;step++){
   const t=step/24,z=near+(far-near)*t,y=floorY+4.8+1.05*Math.sin(t*Math.PI);
   for(const x of [left,right]){positions.push(x,y,z);uvs.push((x-left)/3,z/3);}
   if(step<24){const i=base+step*2;indices.push(i,i+2,i+1,i+1,i+2,i+3);}
  }
  for(const side of [-1,1]){
   const z=center+side*(spacing/2-.26);
   lights.push({x:(left+right)/2,y:floorY+4.74,z,sx:right-left,sy:.055,sz:.48});
   seams.push({x:(left+right)/2,y:floorY+4.68,z:z+side*.36,sx:right-left,sy:.13,sz:.24});
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
 const vaults=new THREE.Mesh(geometry,ceiling);vaults.castShadow=false;vaults.receiveShadow=false;parent.add(vaults);
 instances(parent,new THREE.BoxGeometry(1,1,1),cove,lights);instances(parent,new THREE.BoxGeometry(1,1,1),trim,seams);
 hallAreaLight(parent,(left+right)/2,floorY+4.6,b.z,right-left,b.depth*.82,.38);
 box(parent,.14,.18,b.depth*.9,b.x+b.width*.36,floorY+4.65,b.z,trim);
}

/** A dark linear core, curved timber ribs and a slatted overhang, as photographed. */
export function t1CheckInCanopy(parent:THREE.Object3D,x:number,y:number,z:number,length:number){
 const wood=t1CheckInTimber(),slats:Parameters<typeof instances>[3]=[],ribs:Parameters<typeof instances>[3]=[],lamp=new THREE.MeshBasicMaterial({color:'#fff3d7',toneMapped:false}),lamps:Parameters<typeof instances>[3]=[];
 for(const side of [-1,1]){
  const shape=new THREE.Shape();shape.moveTo(0,.8);shape.lineTo(side*.36,.8);shape.bezierCurveTo(side*.4,2.1,side*1.12,3.18,side*3.15,3.48);shape.lineTo(side*3.15,3.72);shape.bezierCurveTo(side*1.08,3.56,side*.12,2.75,0,2.0);shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:1.9,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:2,curveSegments:14});geo.rotateY(-Math.PI/2);geo.translate(.95,0,0);
  const mesh=instances(parent,geo,wood,Array.from({length:9},(_,i)=>({x:x+(i-4)*(length-2)/8,y,z})));mesh.castShadow=false;
  // Narrow gaps make the timber canopy read as joinery rather than a solid box.
  for(let offset=.6;offset<=3.16;offset+=.21)slats.push({x,y:y+3.52+(3.16-offset)*.055,z:z+side*offset,sx:length,sy:.085,sz:.155});
  ribs.push({x,y:y+3.55,z:z+side*3.15,sx:length,sy:.2,sz:.12});
  for(let station=0;station<8;station++)lamps.push({x:x+(station-3.5)*(length-3)/8,y:y+3.46,z:z+side*2.15,sx:.2,sy:.025,sz:.2});
 }
 instances(parent,new THREE.BoxGeometry(1,1,1),wood,slats);instances(parent,new THREE.BoxGeometry(1,1,1),wood,ribs);instances(parent,new THREE.BoxGeometry(1,1,1),lamp,lamps);
}

/** Warm stone gallery fascia and a restrained dark clerestory establish T2's enclosure. */
export function t2HallEnvelope(parent:THREE.Object3D,b:TerminalBounds,opening:{x:number;z:number;width:number;depth:number},galleryY:number){
 const stone=new THREE.MeshStandardMaterial({color:'#beb5a0',roughness:.73,metalness:.025,emissive:'#817763',emissiveIntensity:.075}),joints=new THREE.MeshStandardMaterial({color:'#555b52',roughness:.64,metalness:.18}),panels:Parameters<typeof instances>[3]=[],seams:Parameters<typeof instances>[3]=[],windows:Parameters<typeof instances>[3]=[],glazing=new THREE.MeshStandardMaterial({color:'#263c40',roughness:.28,metalness:.18});
 for(const side of [-1,1]){
  const edgeX=opening.x+side*opening.width/2;
  panels.push({x:edgeX,y:galleryY-.62,z:opening.z,sx:.16,sy:1.18,sz:opening.depth});
  seams.push({x:edgeX-side*.10,y:galleryY-1.12,z:opening.z,sx:.04,sy:.15,sz:opening.depth});
  for(let z=opening.z-opening.depth/2+4.9;z<opening.z+opening.depth/2-1;z+=4.9){
   seams.push({x:edgeX-side*.086,y:galleryY-.55,z,sx:.03,sy:1.0,sz:.018});
  }
  // The occupied side galleries have a built wall above the public opening,
  // with a narrow high window strip, rather than glass across the whole facade.
  const wallX=b.x+side*(b.width/2-1.1),bottom=galleryY+4.5,top=b.height-2.2;
  panels.push({x:wallX,y:(bottom+top)/2,z:b.z,sx:.2,sy:top-bottom,sz:b.depth-4});
  windows.push({x:wallX-side*.12,y:bottom+2.1,z:b.z,sx:.08,sy:1.15,sz:b.depth-8});
  for(let z=b.z-b.depth/2+4;z<b.z+b.depth/2-2;z+=5.5){
   seams.push({x:wallX-side*.125,y:(bottom+top)/2,z,sx:.035,sy:top-bottom,sz:.025});
  }
  for(const y of [bottom+1.48,bottom+2.72])seams.push({x:wallX-side*.16,y,z:b.z,sx:.04,sy:.075,sz:b.depth-4});
 }
 instances(parent,panelGeometry,stone,panels);instances(parent,panelGeometry,joints,seams);instances(parent,panelGeometry,glazing,windows);
 hallAreaLight(parent,opening.x,Math.min(b.height-4,galleryY+10),opening.z,opening.width*.82,opening.depth*.9,.53,'#fff3da');

 // Branches spread the west column heads into the lowest roof-grid chord.
 // They stay above the occupied galleries and share a single beam batch.
 const roof=terminals.find(t=>t.id==='T2')!,firstX=roof.x-roof.width/2,firstZ=roof.z-roof.depth/2,pitch=T2_ROOF_GRID.pitch,
  columns=t2StructuralColumnCenters(b.x,b.z,b.width,b.depth).filter(p=>p.x<b.x),
  crownY=b.height-8.8,chordY=roof.height-T2_ROOF_GRID.bottomOffset,beam=new THREE.InstancedMesh(new THREE.CylinderGeometry(.5,.5,1,10),material('#5a6461',.43,.49),columns.length*4),
  jointsAtCrown:Parameters<typeof instances>[3]=[],origin=new THREE.Vector3(),end=new THREE.Vector3(),direction=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),dummy=new THREE.Object3D();
 let index=0;
 for(const p of columns){
  origin.set(p.x,crownY-.11,p.z);
  jointsAtCrown.push({x:p.x,y:crownY-.16,z:p.z,sx:1.90,sy:.48,sz:1.90});
  const ix=Math.round((p.x-firstX)/pitch),iz=Math.round((p.z-firstZ)/pitch);
  for(const dx of [-1,1])for(const dz of [-1,1]){
   end.set(firstX+(ix+dx)*pitch,chordY,firstZ+(iz+dz)*pitch);direction.subVectors(end,origin);
   dummy.position.copy(origin).lerp(end,.5);dummy.quaternion.setFromUnitVectors(up,direction.clone().normalize());dummy.scale.set(.38,direction.length(),.38);dummy.updateMatrix();beam.setMatrixAt(index++,dummy.matrix);
  }
 }
 beam.instanceMatrix.needsUpdate=true;parent.add(beam);
 instances(parent,new THREE.CylinderGeometry(.5,.5,1,24),stone,jointsAtCrown);
}
