import * as THREE from 'three';
import type {Gate} from '../data/airport';
import {box,canvasTexture,cylinder,instances,material,seeded} from './primitives';
import type {TerminalBounds,TerminalMaterials} from './terminalArchitecture';
import {decorateT1ArrivalArt,decorateT3North,decorateTerminal2} from './terminalInteriorFidelity';
import {T1_SECOND_FLOOR_LAYOUT,T1_THIRD_FLOOR_STORES,T1_FOURTH_FLOOR_LAYOUT,T1_FOURTH_FLOOR_LOUNGES,T2_FOURTH_FLOOR_LAYOUT,T2_FOURTH_FLOOR_LOUNGES,T2_FOURTH_FLOOR_SHOPS,T2_THIRD_FLOOR_LAYOUT,t1FourthFloorSuiteCenterX,t1FourthFloorSuiteCenters,t2FourthFloorLoungeCenter,t2FourthFloorShopCenter,t2ThirdFloorRetailUnits} from './terminalInteriorLayout';

export type TerminalInteriorProfile='T1'|'T2'|'T3'|'T3-S'|'T3-N';
type Item={x:number;y:number;z:number;sx:number;sy:number;sz:number;ry?:number;rx?:number;color?:THREE.ColorRepresentation};
type RotItem=Item&{rx:number};
const unitBox=new THREE.BoxGeometry(1,1,1),steel=material('#aeb8b8',.42,.42),pillar=material('#b8c1c0',.48,.32),counter=material('#c7cdca',.52,.12),counterTop=material('#eef0e9',.3,.08),screen=material('#142a33',.28,.22),belt=material('#303d40',.72,.1),queuePost=material('#879397',.38,.58),warmWood=material('#765e46',.58,.1),shopGlass=material('#91a9aa',.24,.18),seatDark=material('#3e555d',.62,.12),seatWarm=material('#b77e37',.58,.08),seatOrange=material('#df6d3d',.54,.1),light= new THREE.MeshStandardMaterial({color:'#fff3d4',emissive:'#f0ca7c',emissiveIntensity:.58,roughness:.38}),ceilingStrip=new THREE.MeshStandardMaterial({color:'#fff7e8',emissive:'#ffedcf',emissiveIntensity:.95,roughness:.5}),accentBlue=material('#087d91',.4,.15),accentRed=material('#b34336',.46,.08),t1Island=material('#ffffff',.48,.22),t2Island=material('#ffffff',.42,.34),islandTrim=material('#c3c8c3',.36,.42),foodCourtGold=material('#e6b83e',.42,.24),foodCourtIvory=material('#efeee7',.48,.08),foodCourtSeat=material('#f2f1e9',.6,.06),beltRoller=material('#b6bfba',.34,.62),signCache=new Map<string,THREE.Material>();
const t1CheckinDisplayText=new THREE.MeshStandardMaterial({color:'#dcebe5',emissive:'#83b9aa',emissiveIntensity:.22,roughness:.4});
type DeckFinishes={floor:THREE.Material;ceiling:THREE.Material;edge:THREE.Material;structure:THREE.Material};
const finishCache=new Map<string,THREE.Material>();
const interiorReflectionCache=new Map<'T1'|'T2'|'T2-LOW',THREE.CubeTexture>();

/** A low-cost indoor reflection card keeps polished stone from reflecting the outdoor sky. */
function interiorReflection(profile:'T1'|'T2'|'T2-LOW'){
 const cached=interiorReflectionCache.get(profile);if(cached)return cached;
 const t1=profile==='T1',low=profile==='T2-LOW',size=t1?256:512;
 const face=()=>{const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;return canvas;},faces=Array.from({length:6},face),contexts=faces.map(c=>c.getContext('2d')!);
 // Keep the card's authored 256-unit layout while giving T2's dense lattice a
 // finer reflection sample. T1 remains at its existing texture resolution.
 if(!t1)for(const ctx of contexts)ctx.scale(2,2);
 const ceiling=contexts[2],background=t1?'#e5e7e2':low?'#b7bcb8':'#303938',frame=t1?'rgba(111,119,115,.24)':low?'rgba(53,67,65,.42)':'rgba(13,21,21,.72)';
 ceiling.fillStyle=background;ceiling.fillRect(0,0,256,256);
 if(t1){
  for(let y=0;y<256;y+=56){ceiling.fillStyle=y%112?'#eef0eb':'#f4f4ef';ceiling.fillRect(0,y,256,52);}
  ceiling.strokeStyle=frame;ceiling.lineWidth=3;for(let p=0;p<=256;p+=56){ceiling.beginPath();ceiling.moveTo(p,0);ceiling.lineTo(p,256);ceiling.stroke();}
  ceiling.strokeStyle='rgba(255,231,188,.9)';ceiling.lineWidth=5;for(let x=20;x<256;x+=72){ceiling.beginPath();ceiling.moveTo(x,0);ceiling.lineTo(x,256);ceiling.stroke();}
 }else if(low){
  // T2 1F/2F use a shallow, pale geometric ceiling rather than the 3F roof
  // space frame. This matches the diamond-coffer ceiling in the 2023 arrivals
  // photograph and keeps its reflected highlights on the correct floors.
  ceiling.strokeStyle=frame;ceiling.lineWidth=2.6;
  for(let p=0;p<=256;p+=48){ceiling.beginPath();ceiling.moveTo(p,0);ceiling.lineTo(p,256);ceiling.moveTo(0,p);ceiling.lineTo(256,p);ceiling.stroke();}
  ceiling.strokeStyle='rgba(70,84,81,.3)';ceiling.lineWidth=1.8;
  for(let row=0;row<6;row++)for(let col=0;col<6;col++){
   const x=col*48,y=row*48;ceiling.beginPath();
   if((row+col)%2===0){ceiling.moveTo(x,y);ceiling.lineTo(x+48,y+48);}else{ceiling.moveTo(x+48,y);ceiling.lineTo(x,y+48);}
   ceiling.stroke();
  }
  ceiling.fillStyle='rgba(255,251,232,.72)';for(let y=24;y<256;y+=48)for(let x=24;x<256;x+=48){ceiling.beginPath();ceiling.arc(x,y,2.2,0,Math.PI*2);ceiling.fill();}
 }else{
  ceiling.strokeStyle=frame;ceiling.lineWidth=5;for(let p=0;p<=256;p+=48){ceiling.beginPath();ceiling.moveTo(p,0);ceiling.lineTo(p,256);ceiling.moveTo(0,p);ceiling.lineTo(256,p);ceiling.stroke();}
  // Alternating diagonals reproduce the triangulated roof web seen from below
  // and keep the floor reflection from reading as a simple square grid.
  ceiling.strokeStyle='rgba(132,146,137,.46)';ceiling.lineWidth=2.1;
  for(let row=0;row<6;row++)for(let col=0;col<6;col++){
   const x=col*48,y=row*48;ceiling.beginPath();
   if((row+col)%2===0){ceiling.moveTo(x,y);ceiling.lineTo(x+48,y+48);}else{ceiling.moveTo(x+48,y);ceiling.lineTo(x,y+48);}
   ceiling.stroke();
  }
  ceiling.fillStyle='rgba(255,247,219,.78)';for(let y=38;y<256;y+=94)for(let x=38;x<256;x+=94){ceiling.beginPath();ceiling.ellipse(x,y,9.5,6.2,0,0,Math.PI*2);ceiling.fill();}
 }
 for(const index of [0,1,4,5]){
  const ctx=contexts[index],gradient=ctx.createLinearGradient(0,0,0,256);
  gradient.addColorStop(0,t1?'#cfd5d2':low?'#d2d5d1':'#434b49');gradient.addColorStop(.48,t1?'#aeb6b3':low?'#b7bcb8':'#313b39');gradient.addColorStop(1,t1?'#929a98':low?'#9fa6a2':'#222b2b');ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
  ctx.strokeStyle=t1?'rgba(83,96,94,.3)':low?'rgba(52,66,64,.34)':'rgba(13,22,22,.55)';ctx.lineWidth=t1?3:low?2:2.5;for(let x=24;x<256;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,256);ctx.stroke();}
  if(t1){
   // The pale T1 hall returns long roof lights as soft bands across its stone.
   ctx.fillStyle='rgba(255,241,211,.58)';ctx.fillRect(0,112,256,4);ctx.fillRect(0,177,256,3);
   ctx.fillStyle='rgba(230,235,229,.52)';ctx.fillRect(0,70,256,2);ctx.fillRect(0,211,256,2);
  }else if(low){
   ctx.strokeStyle='rgba(49,64,61,.25)';ctx.lineWidth=1.8;
   for(let y=40;y<256;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();}
   ctx.fillStyle='rgba(244,243,232,.3)';for(let y=28;y<180;y+=72)for(let x=32;x<256;x+=80)ctx.fillRect(x,y,12,6);
   ctx.fillStyle='rgba(45,56,53,.2)';for(let x=18;x<256;x+=64)ctx.fillRect(x,172,5,84);
  }else{
   // Near-horizon directions dominate a walker's floor reflection, so return
   // the same triangulated frame on the cubemap's side faces as overhead.
   ctx.strokeStyle='rgba(13,22,22,.48)';ctx.lineWidth=2.2;
   for(let y=24;y<256;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();}
   ctx.strokeStyle='rgba(132,146,137,.42)';ctx.lineWidth=1.7;
   for(let row=0;row<6;row++)for(let col=0;col<6;col++){
    const x=col*48,y=row*48;ctx.beginPath();
    if((row+col)%2===0){ctx.moveTo(x,y);ctx.lineTo(x+48,y+48);}else{ctx.moveTo(x+48,y);ctx.lineTo(x,y+48);}
    ctx.stroke();
   }
   // Broad, weak highlights keep the polished return from looking like white
   // striping; pendants are small reflected forms rather than oversized blobs.
   ctx.fillStyle='rgba(255,246,215,.24)';ctx.fillRect(0,88,256,2);ctx.fillRect(0,190,256,2);
   for(const y of [112,165])for(let x=28;x<256;x+=72){
    ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(255,250,232,.38)';
    for(let petal=0;petal<6;petal++){ctx.save();ctx.rotate(petal*Math.PI/3);ctx.beginPath();ctx.ellipse(0,-4.4,2.1,3.8,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    ctx.beginPath();ctx.arc(0,0,1.6,0,Math.PI*2);ctx.fillStyle='rgba(255,232,179,.45)';ctx.fill();ctx.restore();
   }
  }
 }
 contexts[3].fillStyle=t1?'#d8dad5':low?'#c4c8c3':'#858575';contexts[3].fillRect(0,0,256,256);
 const texture=new THREE.CubeTexture(faces);texture.mapping=THREE.CubeReflectionMapping;texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;interiorReflectionCache.set(profile,texture);return texture;
}

function terminalFloor(profile:'T1'|'T2',zone:'main'|'lower'='main'){
 const lower=profile==='T2'&&zone==='lower',reflectionProfile=lower?'T2-LOW':profile,key=`${profile}-${zone}-floor`,cached=finishCache.get(key);if(cached)return cached;
 const rand=seeded(profile==='T1'?11807:lower?21806:21807),texture=canvasTexture(512,512,ctx=>{
  const t1=profile==='T1',base=t1?'#c5c9c7':lower?'#a7aaa8':'#999b8d';ctx.fillStyle=base;ctx.fillRect(0,0,512,512);
  // Large, quiet stone modules with real-scale joints. T1 is pale cool terrazzo;
  // T2 is the darker, slightly green-grey polished stone visible in hall photos.
  const delta=Math.floor((rand()-.5)*8),shade=t1?199+delta:lower?150+delta:146+delta,tileSize=t1?128:256;
  for(let y=2;y<512;y+=tileSize)for(let x=2;x<512;x+=tileSize){
   const variation=Math.floor((rand()-.5)*(t1?5:lower?17:9)),r=THREE.MathUtils.clamp(shade+variation,0,255),g=THREE.MathUtils.clamp(shade+(t1?1:lower?2:7)+variation,0,255),b=THREE.MathUtils.clamp(shade+(t1?2:lower?0:-16)+variation,0,255);
   ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(x,y,tileSize-2,tileSize-2);
   const tileWash=ctx.createLinearGradient(x,y,x+tileSize,y+tileSize);tileWash.addColorStop(0,'rgba(255,255,255,.1)');tileWash.addColorStop(.55,'rgba(255,255,255,.015)');tileWash.addColorStop(1,'rgba(25,32,31,.035)');ctx.fillStyle=tileWash;ctx.fillRect(x+1,y+1,tileSize-4,tileSize-4);
  }
  const wash=ctx.createLinearGradient(0,0,512,512);wash.addColorStop(0,'rgba(255,255,255,.18)');wash.addColorStop(.46,'rgba(255,255,255,.035)');wash.addColorStop(1,'rgba(31,39,37,.055)');ctx.fillStyle=wash;ctx.fillRect(2,2,508,508);
  // Low-contrast cloudy mineral variation breaks the repeated colour-block look.
  for(let i=0;i<(lower?88:64);i++){const x=rand()*512,y=rand()*512,r=9+rand()*28,light=rand()>.48,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,t1?(light?'rgba(248,249,245,.10)':'rgba(74,82,82,.055)'):lower?(light?'rgba(241,242,238,.16)':'rgba(48,55,53,.12)'):(light?'rgba(205,214,197,.10)':'rgba(35,51,45,.12)'));g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  const grainCount=lower?22000:10500;for(let i=0;i<grainCount;i++){const dark=lower&&rand()<.42,v=Math.floor(lower?(dark?52+rand()*62:178+rand()*68):105+rand()*125),alpha=lower?.08+rand()*.15:.022+rand()*.048;ctx.fillStyle=`rgba(${v},${v+((i%3)-1)*2},${Math.max(0,v+(t1?1:lower?0:-5))},${alpha})`;const size=lower?1.1+rand()*2.9:.6+rand()*1.8;ctx.fillRect(rand()*512,rand()*512,size,size);}
  ctx.strokeStyle=t1?'rgba(55,65,66,.14)':lower?'rgba(48,58,56,.19)':'rgba(45,55,49,.27)';ctx.lineWidth=t1?.9:lower?.9:1.1;ctx.beginPath();for(let p=0;p<=512;p+=tileSize){ctx.moveTo(p,0);ctx.lineTo(p,512);ctx.moveTo(0,p);ctx.lineTo(512,p);}ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(4,6);ctx.lineTo(508,6);ctx.moveTo(6,4);ctx.lineTo(6,508);ctx.stroke();
  ctx.globalAlpha=.13;ctx.fillStyle=t1?'#626c6c':'#414d47';for(let y=18;y<512;y+=23)for(let x=20+(Math.floor(y/23)%2)*13;x<512;x+=37)ctx.fillRect(x,y,1.2,1.2);ctx.globalAlpha=1;
 });texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=8;
 // Keep the stone readable under daylight. Strong self-emission had washed out
 // the grain, grout and T2's characteristic muted green-grey floor tone.
 const mat=new THREE.MeshPhysicalMaterial({color:profile==='T1'?'#fafaf6':lower?'#e2e4e1':'#e7ecdf',map:texture,bumpMap:texture,bumpScale:profile==='T1'?.006:lower?.012:.006,roughness:profile==='T1'?.13:lower?.12:.075,metalness:.025,clearcoat:profile==='T1'?.82:lower?.84:.92,clearcoatRoughness:profile==='T1'?.11:lower?.095:.055,emissive:profile==='T1'?'#77766f':lower?'#7c807a':'#8d8967',emissiveIntensity:profile==='T1'?.12:lower?.08:.24});
 // Outdoor sky reflections look like windows on an indoor floor. Keep a low,
 // soft return so the polished stone reads without reflecting airport clouds.
 mat.userData.worldUV=1/3.2;mat.userData.reflectionIntensity=profile==='T1'?1.02:lower?1.32:1.7;mat.userData.reflectionMap=interiorReflection(reflectionProfile);mat.userData.indoorReflection=1;mat.userData.terminalFloorProfile=profile;mat.userData.terminalFloorZone=lower?'lower':'main';finishCache.set(key,mat);return mat;
}
function terminalCeiling(profile:'T1'|'T2'){
 const key=`${profile}-ceiling`,cached=finishCache.get(key);if(cached)return cached;
 const texture=canvasTexture(512,512,ctx=>{
  const t1=profile==='T1',panel=t1?128:256;ctx.fillStyle=t1?'#edeee9':'#e6e8e1';ctx.fillRect(0,0,512,512);
  for(let y=0;y<512;y+=panel)for(let x=0;x<512;x+=panel){ctx.fillStyle=((x/panel+y/panel)%2===0)?(t1?'rgba(255,255,250,.12)':'rgba(250,250,244,.075)'):(t1?'rgba(76,86,86,.018)':'rgba(37,48,48,.014)');ctx.fillRect(x+2,y+2,panel-4,panel-4);}
  ctx.strokeStyle=t1?'rgba(72,83,82,.085)':'rgba(36,46,45,.05)';ctx.lineWidth=t1?1.6:1.2;for(let p=0;p<=512;p+=panel){ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,512);ctx.moveTo(0,p);ctx.lineTo(512,p);ctx.stroke();}
  if(!t1){ctx.strokeStyle='rgba(47,61,58,.07)';ctx.lineWidth=1.2;for(let y=0;y<512;y+=panel)for(let x=0;x<512;x+=panel){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+panel,y+panel);ctx.stroke();}}
  ctx.fillStyle=t1?'rgba(83,94,92,.045)':'rgba(25,34,34,.04)';for(let y=12;y<512;y+=t1?48:32)for(let x=12;x<512;x+=t1?48:32)ctx.fillRect(x,y,1.4,1.4);
 });texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=8;
 const lamps=canvasTexture(512,512,ctx=>{
  ctx.fillStyle='#000000';ctx.fillRect(0,0,512,512);
  if(profile==='T1')for(const y of [128,384]){ctx.fillStyle='#d3cbbb';ctx.fillRect(160,y-6,192,12);ctx.fillStyle='#fff4dc';ctx.fillRect(166,y-3,180,6);}
  else for(const y of [128,384])for(const x of [128,384]){ctx.fillStyle='#c9c5b6';ctx.fillRect(x-12,y-7,24,14);ctx.fillStyle='#fff0ca';ctx.fillRect(x-7,y-4,14,8);}
 });lamps.wrapS=lamps.wrapT=THREE.RepeatWrapping;lamps.anisotropy=8;
 const mat=new THREE.MeshStandardMaterial({color:profile==='T1'?'#f1f2ec':'#f5f6ef',map:texture,roughness:.84,metalness:.012,emissive:'#fff1d5',emissiveMap:lamps,emissiveIntensity:profile==='T1'?.42:.62});mat.userData.worldUV=1/9.6;finishCache.set(key,mat);return mat;
}
function deckFinishes(profile:'T1'|'T2',mats:TerminalMaterials):DeckFinishes{
 const key=`${profile}-deck`,cached=finishCache.get(key);
 const floor=mats.floor??terminalFloor(profile),ceiling=mats.ceiling??terminalCeiling(profile);
 const edge=mats.deck??cached??material(profile==='T1'?'#c2c4c1':'#c8cbca',.78,.035);
 const structure=mats.structure??(profile==='T1'?new THREE.MeshStandardMaterial({color:'#eeeeea',roughness:.66,metalness:.025,emissive:'#777974',emissiveIntensity:.24}):material('#bcc2c1',.62,.12));
 if(!mats.deck&&!cached)finishCache.set(key,edge);
 return {floor,ceiling,edge,structure};
}

function batch(parent:THREE.Object3D,mat:THREE.Material,items:Item[]){if(items.length)instances(parent,unitBox,mat,items);}
function batchX(parent:THREE.Object3D,mat:THREE.Material,items:RotItem[]){if(!items.length)return;const mesh=new THREE.InstancedMesh(unitBox,mat,items.length),dummy=new THREE.Object3D();for(let i=0;i<items.length;i++){const p=items[i];dummy.position.set(p.x,p.y,p.z);dummy.scale.set(p.sx,p.sy,p.sz);dummy.rotation.set(p.rx,p.ry??0,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=false;mesh.receiveShadow=false;parent.add(mesh);}
const roundedUnitFurniture=(()=>{
 const shape=new THREE.Shape(),r=.14,lo=-.36,hi=.36;
 shape.moveTo(lo+r,lo);shape.lineTo(hi-r,lo);shape.quadraticCurveTo(hi,lo,hi,lo+r);shape.lineTo(hi,hi-r);shape.quadraticCurveTo(hi,hi,hi-r,hi);shape.lineTo(lo+r,hi);shape.quadraticCurveTo(lo,hi,lo,hi-r);shape.lineTo(lo,lo+r);shape.quadraticCurveTo(lo,lo,lo+r,lo);
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:.74,bevelEnabled:true,bevelThickness:.13,bevelSize:.13,bevelSegments:4,curveSegments:8});geometry.computeBoundingBox();const center=geometry.boundingBox!.getCenter(new THREE.Vector3());geometry.translate(-center.x,-center.y,-center.z);return geometry;
})();
function batchRounded(parent:THREE.Object3D,mat:THREE.Material,items:Item[],horizontal=false){
 if(!items.length)return;const mesh=new THREE.InstancedMesh(roundedUnitFurniture,mat,items.length),dummy=new THREE.Object3D(),tint=new THREE.Color();
 for(let i=0;i<items.length;i++){const p=items[i];dummy.position.set(p.x,p.y,p.z);dummy.scale.set(p.sx,horizontal?p.sz/1.16:p.sy/1.16,horizontal?p.sy:p.sz);dummy.rotation.set(horizontal?Math.PI/2:(p.rx??0),p.ry??0,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(p.color){tint.set(p.color);mesh.setColorAt(i,tint);}}
 mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
}
function signMaterial(label:string,accent:string){const key=label+'|'+accent;const cached=signCache.get(key);if(cached)return cached;const texture=canvasTexture(768,192,ctx=>{ctx.fillStyle='#10242c';ctx.fillRect(0,0,768,192);ctx.fillStyle=accent;ctx.fillRect(0,0,15,192);ctx.fillStyle='#f6f4ec';ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='bold 62px Arial,sans-serif';ctx.fillText(label,42,96,690);ctx.fillStyle=accent;ctx.fillRect(38,165,690,6);});const mat=new THREE.MeshBasicMaterial({map:texture,side:THREE.FrontSide,toneMapped:false});signCache.set(key,mat);return mat;}
function sign(parent:THREE.Object3D,label:string,x:number,y:number,z:number,width:number,accent='#d5a63d',rotation=0,height=1.55){
 const geometry=new THREE.PlaneGeometry(width,height),mat=signMaterial(label,accent),normal=new THREE.Vector3(0,0,.016).applyAxisAngle(new THREE.Vector3(0,1,0),rotation);
 const front=new THREE.Mesh(geometry,mat);front.position.set(x+normal.x,y,z+normal.z);front.rotation.y=rotation;front.castShadow=false;parent.add(front);
 const back=new THREE.Mesh(geometry,mat);back.position.set(x-normal.x,y,z-normal.z);back.rotation.y=rotation+Math.PI;back.castShadow=false;parent.add(back);return front;
}
const shopMenuCache=new Map<string,THREE.Material>();
function shopMenuMaterial(profile:'tea'|'burger'|'bakery',accent:string){
 const key=`${profile}|${accent}`,cached=shopMenuCache.get(key);if(cached)return cached;
 const headings={tea:['TEA & LIGHT MEALS','茶飲・餐點'],burger:['BURGERS & SETS','漢堡・套餐'],bakery:['BAKERY & GIFTS','麵包・伴手禮']}[profile];
 const texture=canvasTexture(512,256,ctx=>{
  ctx.fillStyle='#f4f1e9';ctx.fillRect(0,0,512,256);ctx.fillStyle=accent;ctx.fillRect(0,0,512,54);
  ctx.fillStyle='#fff';ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='bold 24px Arial,sans-serif';ctx.fillText(headings[0],20,21,470);ctx.font='bold 17px Arial,sans-serif';ctx.fillText(headings[1],20,43,470);
  const rows=profile==='tea'?['珍珠奶茶','原茶・茶飲','茶麵與餐點','外帶飲品']:profile==='burger'?['漢堡','米漢堡','套餐飲品','外帶點餐']:['現烤麵包','糕餅禮盒','伴手禮','外帶包裝'];
  rows.forEach((label,index)=>{const y=82+index*42;ctx.fillStyle=index%2?'#e9e6dc':'#efede5';ctx.fillRect(14,y-13,484,33);ctx.fillStyle=accent;ctx.beginPath();ctx.arc(31,y+2,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#37423f';ctx.font='18px Arial,sans-serif';ctx.fillText(label,52,y+2,320);ctx.fillStyle='#9c9e98';ctx.fillRect(418,y-2,58,5);});
  ctx.strokeStyle='rgba(48,61,58,.22)';ctx.lineWidth=2;ctx.strokeRect(2,2,508,252);
 });
 const mat=new THREE.MeshBasicMaterial({map:texture,toneMapped:false,side:THREE.DoubleSide});shopMenuCache.set(key,mat);return mat;
}
const counterNumberMaterials=new Map<string,THREE.Material>();
function counterNumberSign(parent:THREE.Object3D,label:string,x:number,y:number,z:number,width=1.6,height=1.2){
 let mat=counterNumberMaterials.get(label);
 if(!mat){const texture=canvasTexture(256,192,ctx=>{const bg=ctx.createLinearGradient(0,0,0,192);bg.addColorStop(0,'#2849c4');bg.addColorStop(.55,'#162b8d');bg.addColorStop(1,'#0b1d68');ctx.fillStyle=bg;ctx.fillRect(0,0,256,192);ctx.fillStyle='rgba(255,255,255,.15)';ctx.fillRect(8,8,240,4);ctx.strokeStyle='rgba(183,211,255,.7)';ctx.lineWidth=5;ctx.strokeRect(4,4,248,184);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 94px Arial,sans-serif';ctx.fillText(label,128,98);ctx.fillStyle='#8de8ff';ctx.fillRect(24,169,208,5);});mat=new THREE.MeshBasicMaterial({map:texture,toneMapped:false,side:THREE.DoubleSide});counterNumberMaterials.set(label,mat);}
 const geometry=new THREE.PlaneGeometry(width,height),front=new THREE.Mesh(geometry,mat),back=new THREE.Mesh(geometry,mat);front.position.set(x,y,z+.018);back.position.set(x,y,z-.018);back.rotation.y=Math.PI;front.castShadow=back.castShadow=false;parent.add(front,back);return front;
}
// `toLevel` is exclusive, so a public-hall void can stop before an occupied upper deck.
function addDecks(parent:THREE.Object3D,b:TerminalBounds,levels:number[],finish:THREE.Material,gapRatio=.16,atrium?:{fromLevel:number;toLevel?:number;x:number;z:number;width:number;depth:number},surfaces?:DeckFinishes,firstUpperGapRatio?:number,floorByLevel?:ReadonlyMap<number,THREE.Material>){
 const thickness=.34,fullWidth=b.width-3,fullDepth=b.depth-4;
 const slab=(width:number,depth:number,x:number,z:number,y:number,levelIndex=0)=>{
  if(width<=2||depth<=2)return;box(parent,width,thickness,depth,x,y,z,surfaces?.edge??finish);
  if(!surfaces)return;
  const top=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),floorByLevel?.get(levelIndex)??surfaces.floor);top.rotation.x=-Math.PI/2;top.position.set(x,y+thickness/2+.012,z);top.castShadow=false;top.receiveShadow=true;parent.add(top);
  const underside=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),surfaces.ceiling);underside.rotation.x=Math.PI/2;underside.position.set(x,y-thickness/2-.012,z);underside.castShadow=false;parent.add(underside);
 };
 slab(fullWidth,fullDepth,b.x,b.z,levels[0]-.17,0);
 for(let i=1;i<levels.length;i++){
  const y=levels[i]-.17;
  if(atrium&&i>=atrium.fromLevel&&(atrium.toLevel===undefined||i<atrium.toLevel)){
   const left=b.x-fullWidth/2,right=b.x+fullWidth/2,near=b.z-fullDepth/2,far=b.z+fullDepth/2;
   const holeLeft=THREE.MathUtils.clamp(atrium.x-atrium.width/2,left+2,right-2),holeRight=THREE.MathUtils.clamp(atrium.x+atrium.width/2,left+2,right-2);
   const holeNear=THREE.MathUtils.clamp(atrium.z-atrium.depth/2,near+2,far-2),holeFar=THREE.MathUtils.clamp(atrium.z+atrium.depth/2,near+2,far-2);
   slab(fullWidth,holeNear-near,b.x,(near+holeNear)/2,y,i);
   slab(fullWidth,far-holeFar,b.x,(holeFar+far)/2,y,i);
   slab(holeLeft-left,holeFar-holeNear,(left+holeLeft)/2,(holeNear+holeFar)/2,y,i);
   slab(right-holeRight,holeFar-holeNear,(holeRight+right)/2,(holeNear+holeFar)/2,y,i);
   const rail=new THREE.MeshPhysicalMaterial({color:'#c0d5d7',roughness:.18,metalness:.08,transparent:true,opacity:.36,depthWrite:false});
   for(const side of [-1,1])box(parent,atrium.width,1.08,.13,atrium.x,y+.71,atrium.z+side*(atrium.depth/2),rail);
   for(const side of [-1,1])box(parent,.13,1.08,atrium.depth,atrium.x+side*(atrium.width/2),y+.71,atrium.z,rail);
  }else if(atrium){
   slab(fullWidth,fullDepth,b.x,b.z,y,i);
  }else{
   const first=i===1&&firstUpperGapRatio!==undefined,ratio=first?(firstUpperGapRatio??gapRatio):gapRatio,maxRatio=first ? .52 : .33,gap=Math.min(b.width*maxRatio,Math.max(20,b.width*ratio)),wing=(b.width-gap)/2;
   for(const side of [-1,1])slab(wing,b.depth-7,b.x+side*(gap/2+wing/2),b.z,y,i);
  }
 }
 if(surfaces){
  const strips:Item[]=[];
  for(let i=1;i<levels.length;i++){
   const first=i===1&&firstUpperGapRatio!==undefined,ratio=first?(firstUpperGapRatio??gapRatio):gapRatio,maxRatio=first ? .52 : .33,y=levels[i]-.41,gap=Math.min(b.width*maxRatio,Math.max(20,b.width*ratio));
   for(let x=b.x-b.width/2+10;x<=b.x+b.width/2-10;x+=18){
    for(const row of [-1,0,1]){
     const z=b.z+row*b.depth*.23;
     if(!atrium&&Math.abs(x-b.x)<gap/2+2)continue;
     if(atrium&&i>=atrium.fromLevel&&(atrium.toLevel===undefined||i<atrium.toLevel)&&Math.abs(x-atrium.x)<atrium.width/2+2&&Math.abs(z-atrium.z)<atrium.depth/2+2)continue;
     strips.push({x,y,z,sx:6.2,sy:.055,sz:.19});
    }
   }
  }
  batch(parent,ceilingStrip,strips);
 }
}
const t2ArrivalCeilingMember=new THREE.MeshStandardMaterial({color:'#e5e6df',roughness:.68,metalness:.06,emissive:'#92948e',emissiveIntensity:.14});
const t2ArrivalCeilingPanel=(()=>{
 const map=canvasTexture(512,512,ctx=>{
  ctx.fillStyle='#eff0eb';ctx.fillRect(0,0,512,512);
  for(let y=0;y<512;y+=128)for(let x=0;x<512;x+=128){ctx.fillStyle=((x+y)/128)%2===0?'#f2f3ee':'#e8eae5';ctx.fillRect(x+2,y+2,124,124);}
  ctx.strokeStyle='rgba(83,91,88,.18)';ctx.lineWidth=2;for(let p=0;p<=512;p+=128){ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,512);ctx.moveTo(0,p);ctx.lineTo(512,p);ctx.stroke();}
 });map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;
 const lamps=canvasTexture(512,512,ctx=>{ctx.fillStyle='#000';ctx.fillRect(0,0,512,512);for(const y of [64,320])for(const x of [64,320]){ctx.fillStyle='#bdb9aa';ctx.fillRect(x-19,y-8,38,16);ctx.fillStyle='#fff3d8';ctx.fillRect(x-15,y-5,30,10);}});lamps.wrapS=lamps.wrapT=THREE.RepeatWrapping;lamps.anisotropy=8;
 const mat=new THREE.MeshStandardMaterial({color:'#fff',map,roughness:.9,metalness:.015,emissive:'#fff1d1',emissiveMap:lamps,emissiveIntensity:.28});mat.userData.worldUV=1/4.8;return mat;
})();
/** The 1F arrivals photograph shows a pale diagonal ceiling grid below the 2F deck. */
function terminal2ArrivalCeilingGrid(parent:THREE.Object3D,b:TerminalBounds,ceilingY:number){
 const pitch=4.8,left=b.x-(b.width-3)/2+pitch/2,right=Math.min(b.x+b.width*.32,b.x+(b.width-3)/2-pitch/2),near=b.z-(b.depth-4)/2+pitch/2,far=b.z+(b.depth-4)/2-pitch/2,y=ceilingY-.055,members:Item[]=[];
 for(let x=left;x<=right;x+=pitch)for(let z=near;z<=far;z+=pitch){
  const span=pitch*Math.SQRT2;
  members.push({x,y,z,sx:span,sy:.075,sz:.075,ry:-Math.PI/4},{x,y,z,sx:span,sy:.075,sz:.075,ry:Math.PI/4});
 }
 batch(parent,t2ArrivalCeilingMember,members);
}
/** The arrivals photo shows a lower, square-panel ceiling along one long edge. */
function terminal2ArrivalDropCeiling(parent:THREE.Object3D,b:TerminalBounds,ceilingY:number){
 const width=b.width*.18,depth=b.depth*.84,x=b.x+b.width*.41,z=b.z,y=ceilingY-.49;
 const panel=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),t2ArrivalCeilingPanel);panel.rotation.x=-Math.PI/2;panel.position.set(x,y,z);panel.castShadow=false;panel.receiveShadow=false;parent.add(panel);
 // A slim transition trim makes the step between the exposed lattice and the
 // suspended side ceiling legible from the public arrival-hall sightline.
 box(parent,.14,.16,depth,x-width/2,y+.07,z,material('#c4c8c3',.68,.12));
}
/** Refined atrium edge hardware over the simple continuous glass guard already
 * used by the floor cutout: shoes, regular mullions and a continuous cap rail. */
function terminalAtriumEdgeDetail(parent:THREE.Object3D,atrium:{fromLevel:number;toLevel?:number;x:number;z:number;width:number;depth:number},levels:number[],profile:'T1'|'T2'){
 const capMat=material(profile==='T1'?'#c5c8c2':'#747e7b',.34,.62),shoeMat=material(profile==='T1'?'#939b98':'#515b59',.4,.58),caps:Item[]=[],shoes:Item[]=[],posts:Item[]=[];
 for(let index=atrium.fromLevel;index<levels.length&&(atrium.toLevel===undefined||index<atrium.toLevel);index++){
  const level=levels[index],railTop=level+1.21;
  for(const side of [-1,1]){
   const z=atrium.z+side*(atrium.depth/2);
   caps.push({x:atrium.x,y:railTop,z,sx:atrium.width+.18,sy:.14,sz:.2});
   shoes.push({x:atrium.x,y:level+.055,z,sx:atrium.width+.12,sy:.11,sz:.16});
   for(let x=atrium.x-atrium.width/2+2.3;x<atrium.x+atrium.width/2-1;x+=4.6)posts.push({x,y:level+.61,z,sx:.085,sy:1.12,sz:.1});
   const edgeX=atrium.x+side*(atrium.width/2);
   caps.push({x:edgeX,y:railTop,z:atrium.z,sx:.2,sy:.14,sz:atrium.depth+.18});
   shoes.push({x:edgeX,y:level+.055,z:atrium.z,sx:.16,sy:.11,sz:atrium.depth+.12});
   for(let z=atrium.z-atrium.depth/2+2.3;z<atrium.z+atrium.depth/2-1;z+=4.6)posts.push({x:edgeX,y:level+.61,z,sx:.1,sy:1.12,sz:.085});
  }
  for(const sx of [-1,1])for(const sz of [-1,1])posts.push({x:atrium.x+sx*atrium.width/2,y:level+.61,z:atrium.z+sz*atrium.depth/2,sx:.14,sy:1.18,sz:.14});
 }
 batch(parent,shoeMat,shoes);batch(parent,capMat,caps);batch(parent,capMat,posts);
}
function structuralBays(b:TerminalBounds,profile:'T1'|'T2'){
 const xOffsets=profile==='T2'?[-.44,.44]:[-.38,-.13,.13,.38];
 const zOffsets=profile==='T2'?[-.42,-.28,.12,.42]:[-.42,-.25,.08,.32];
 return xOffsets.flatMap(x=>zOffsets.map(z=>({x:b.x+x*b.width,z:b.z+z*b.depth})));
}
function addT1RakedSupports(parent:THREE.Object3D,b:TerminalBounds,mat:THREE.Material){
 // Terminal 1's renewed hall is identified by a repeated line of large white,
 // inward-raked piers. Keep them at the perimeter rather than scattering thin
 // columns through the open check-in floor.
 const zFirst=b.z-b.depth*.43,zLast=b.z+b.depth*.43,zStep=24,stations=Math.floor((zLast-zFirst)/zStep)+1,headPlates:Item[]=[];
 const mesh=new THREE.InstancedMesh(unitBox,mat,stations*2),dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),start=new THREE.Vector3(),end=new THREE.Vector3(),direction=new THREE.Vector3();let index=0;
 for(let station=0;station<stations;station++)for(const side of [-1,1]){
  const z=zFirst+station*zStep,x0=b.x+side*b.width*.405,x1=x0-side*6.4,normalized=Math.abs((x1-b.x)/((b.width+24)/2));
  const supportRoofY=b.height+1+10.8*Math.exp(-Math.pow((normalized-.66)/.16,2))+4.8*Math.exp(-Math.pow(normalized/.28,2));
  start.set(x0,.42,z);end.set(x1,supportRoofY-.82,z);direction.subVectors(end,start);dummy.position.copy(start).add(end).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,direction.clone().normalize());dummy.scale.set(2.55,direction.length(),2.15);dummy.updateMatrix();mesh.setMatrixAt(index++,dummy.matrix);
  headPlates.push({x:x1,y:supportRoofY-1.02,z,sx:4.2,sy:.42,sz:3.25});
 }
 mesh.count=index;mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);batch(parent,mat,headPlates);
 const feet:Item[]=[];for(let station=0;station<stations;station++)for(const side of [-1,1])feet.push({x:b.x+side*b.width*.405,y:.58,z:zFirst+station*zStep,sx:3.5,sy:.32,sz:3.35,color:'#d5d7d2'});
 batch(parent,mat,feet);
}
function addStructure(parent:THREE.Object3D,b:TerminalBounds,mat:THREE.Material,profile?:'T1'|'T2'){
 if(profile==='T1'){addT1RakedSupports(parent,b,mat);return;}
 if(profile==='T2'){
  const height=Math.max(5,b.height-1.4),geometry=new THREE.CylinderGeometry(.5,.5,1,28,1,false),cols:Item[]=[];
  for(const side of [-1,1])for(let z=b.z-b.depth*.4;z<=b.z+b.depth*.4;z+=27.5)cols.push({x:b.x+side*b.width*.29,y:height/2+.38,z,sx:1.7,sy:height,sz:1.7});
  instances(parent,geometry,mat,cols);return;
 }
 const cols:Item[]=[],height=Math.max(5,b.height-1.4);
 if(profile){
  const size=profile==='T2'?1.15:1;
  for(const p of structuralBays(b,profile))cols.push({x:p.x,y:height/2+.38,z:p.z,sx:size,sy:height,sz:size});
 }else{
  const spacingX=b.width>300?30:26,spacingZ=b.depth>180?34:22;
  for(let x=b.x-b.width/2+spacingX/2;x<=b.x+b.width/2-spacingX/2;x+=spacingX)for(let z=b.z-b.depth/2+spacingZ/2;z<=b.z+b.depth/2-spacingZ/2;z+=spacingZ){const central=Math.abs(x-b.x)<b.width*.16;cols.push({x,y:height/2+.38,z,sx:central?1.15:.68,sy:height,sz:central?1.15:.68});}
 }
 batch(parent,mat,cols);
}
function verticalCirculation(parent:THREE.Object3D,b:TerminalBounds,levels:number[],profile?:TerminalInteriorProfile){
 const treads:Item[]=[],risers:Item[]=[],grooves:Item[]=[],landings:Item[]=[],combPlates:Item[]=[],skirts:RotItem[]=[],glassRails:RotItem[]=[],handrails:RotItem[]=[],liftFrames:Item[]=[],liftDoors:Item[]=[],liftDetails:Item[]=[],liftRails:Item[]=[];
 const treadMat=material('#7c8582',.38,.58),riserMat=material('#4b5554',.52,.42),grooveMat=material('#adb4af',.34,.65),skirtMat=material('#65706e',.38,.52),handrailMat=material('#252d2d',.34,.16),landingMat=material('#b8bfbb',.34,.48),combMat=material('#d0ad57',.48,.34),liftFrameMat=material('#899391',.34,.58),liftDoorMat=material('#c0c7c3',.36,.44),liftButtonMat=material('#243b40',.36,.12);
 const glassMat=new THREE.MeshPhysicalMaterial({color:'#c2d5d4',roughness:.18,metalness:.08,transparent:true,opacity:.27,depthWrite:false,side:THREE.DoubleSide});
 const escalatorWidth=1.14,bodyWidth=1.36,laneSpacing=1.64,stepRiseTarget=.17,railHeight=.98;
 for(let i=0;i<levels.length-1;i++){
  const from=levels[i],to=levels[i+1],rise=to-from,run=rise/Math.tan(Math.PI/6),mid=(from+to)/2;
  // The official floor maps show two escalator cores in each public hall. T1's
  // central landing stays between its check-in rows; T2 keeps both cores by the
  // west-side circulation band, clear of its transverse counter banks.
  const banks=profile==='T1'
   ?i===levels.length-2
    ?[{x:b.x,z:b.z+b.depth*.17}]
    :[{x:b.x,z:b.z+(i%2===0?-.035:.072)*b.depth},{x:b.x-b.width*.32,z:b.z-42}]
   :profile==='T2'
    ?[{x:b.x-b.width*.26,z:b.z+5},{x:b.x-b.width*.26,z:b.z+40}]
    :[{x:b.x,z:b.z+(i%2===0?-1:1)*Math.min(24,b.depth*.12)}];
  const count=Math.max(1,Math.ceil(rise/stepRiseTarget)),riserHeight=rise/count,stepRun=run/count;
  for(const bank of banks)for(const lane of [-1,1]){
   // The adjacent flights run in opposite directions, as a real up/down pair.
   const direction=lane<0?1:-1,x=bank.x+lane*laneSpacing/2,coreZ=bank.z,slope=-direction*Math.atan2(rise,run),flightLength=Math.hypot(rise,run);
   for(let step=0;step<count;step++){
    const z=coreZ+direction*(-run/2+(step+.5)*stepRun),y=from+(step+1)*riserHeight;
    treads.push({x,y:y-.035,z,sx:escalatorWidth,sy:.07,sz:stepRun*.86});
    const riserZ=coreZ+direction*(-run/2+step*stepRun);
    risers.push({x,y:y-riserHeight/2,z:riserZ,sx:escalatorWidth,sy:riserHeight,sz:.045});
    for(const grooveOffset of [-.065,.065])grooves.push({x,y:y+.004,z:z+grooveOffset,sx:escalatorWidth*.94,sy:.012,sz:.014});
   }
   const lowerZ=coreZ-direction*(run/2+.62),upperZ=coreZ+direction*(run/2+.62);
   landings.push({x,y:from+.09,z:lowerZ,sx:bodyWidth+.08,sy:.16,sz:1.22},{x,y:to+.09,z:upperZ,sx:bodyWidth+.08,sy:.16,sz:1.22});
   combPlates.push({x,y:from+.18,z:coreZ-direction*run/2,sx:escalatorWidth+.04,sy:.025,sz:.12},{x,y:to+.18,z:coreZ+direction*run/2,sx:escalatorWidth+.04,sy:.025,sz:.12});
   for(const side of [-1,1]){
    const railX=x+side*(bodyWidth/2-.015);
    skirts.push({x:railX,y:mid+.17,z:coreZ,sx:.12,sy:.34,sz:flightLength,rx:slope});
    glassRails.push({x:railX,y:mid+.49,z:coreZ,sx:.055,sy:railHeight,sz:flightLength-1.1,rx:slope});
    handrails.push({x:railX,y:mid+1.04,z:coreZ,sx:.14,sy:.12,sz:flightLength-1.15,rx:slope});
   }
  }
 }
 batch(parent,treadMat,treads);batch(parent,riserMat,risers);batch(parent,grooveMat,grooves);batch(parent,landingMat,landings);batch(parent,combMat,combPlates);batchX(parent,skirtMat,skirts);batchX(parent,glassMat,glassRails);batchX(parent,handrailMat,handrails);

 // Two glazed lift shafts remain at the published public-service sides of each
 // plan. Show the repeated landing doors and call stations at every served floor.
 const liftHeight=levels[levels.length-1]-levels[0],shaftWidth=4.5,shaftDepth=4.2,doorWidth=1.52,doorHeight=2.3;
 const shaftGlass=new THREE.MeshPhysicalMaterial({color:'#b9d0d3',roughness:.2,metalness:.12,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide});
 const liftCores=profile==='T1'
  ?[-.28,.28].map(offset=>({x:b.x,z:b.z+b.depth*offset}))
  :[-1,1].map(side=>({x:b.x+side*b.width*(profile==='T2'?.39:.12),z:b.z}));
 for(const core of liftCores){
  const {x,z}=core;
  box(parent,shaftWidth,liftHeight,shaftDepth,x,levels[0]+liftHeight/2,z,shaftGlass);
  for(const sx of [-1,1])for(const sz of [-1,1])liftRails.push({x:x+sx*(shaftWidth/2-.12),y:levels[0]+liftHeight/2,z:z+sz*(shaftDepth/2-.12),sx:.12,sy:liftHeight,sz:.12});
  for(const y of levels){
   const doorZ=z+shaftDepth/2+.04,doorY=y+doorHeight/2+.02;
   liftFrames.push({x,y:y+doorHeight+.11,z:doorZ,sx:doorWidth+.38,sy:.12,sz:.2});
   liftFrames.push({x:x-doorWidth/2-.12,y:doorY,z:doorZ,sx:.12,sy:doorHeight,sz:.18},{x:x+doorWidth/2+.12,y:doorY,z:doorZ,sx:.12,sy:doorHeight,sz:.18});
   liftDoors.push({x:x-doorWidth*.25,y:doorY,z:doorZ+.03,sx:doorWidth*.49,sy:doorHeight-.05,sz:.055},{x:x+doorWidth*.25,y:doorY,z:doorZ+.03,sx:doorWidth*.49,sy:doorHeight-.05,sz:.055});
   liftDetails.push({x:x+doorWidth/2+.42,y:y+1.25,z:doorZ+.025,sx:.2,sy:.42,sz:.07},{x:x+doorWidth/2+.42,y:y+1.39,z:doorZ+.07,sx:.07,sy:.07,sz:.025});
  }
 }
 batch(parent,liftFrameMat,liftRails);batch(parent,steel,liftFrames);batch(parent,liftDoorMat,liftDoors);batch(parent,liftButtonMat,liftDetails);
}
function aislePosts(target:Item[],x:number,y:number,z:number,count:number,spacing=2.5){for(let i=0;i<count;i++)target.push({x:x+(i-(count-1)/2)*spacing,y:y+.62,z,sx:.11,sy:1.24,sz:.11});}

/** T1's departure hall uses six long, parallel check-in islands rather than a row of isolated desks. */
function terminal1CheckIn(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number){
 const bases:Item[]=[],tops:Item[]=[],stands:Item[]=[],monitors:Item[]=[],rollers:Item[]=[],queuePosts:Item[]=[],queueRails:Item[]=[],islandSides:Item[]=[],signHangers:Item[]=[],signLights:Item[]=[],signDisplays:Item[]=[],kiosks:Item[]=[],kioskScreens:Item[]=[],count=6,span=b.depth*.60,firstZ=z-span/2,long=39,stationsPerZone=6,stationSpacing=4.8,
  islandGeometry=roundedTerminalPrism(long,3.9,1.35,.62),beltGeometry=roundedTerminalPrism(long-2,1.3,.58,.12);
 const fascia=material('#30383a',.46,.26),displayGlass=new THREE.MeshPhysicalMaterial({color:'#14252a',roughness:.2,metalness:.18,transparent:true,opacity:.88,side:THREE.DoubleSide});
 for(let i=0;i<count;i++){
  const x=b.x,islandZ=firstZ+i*span/(count-1),first=i*2+1,last=first+1;
  // Steel island plinth and continuous rubber baggage conveyor, with brushed
  // edge rails. The six islands cross the short hall axis and repeat along the
  // terminal's long axis, matching the architect's published first-floor plan.
  const island=new THREE.Mesh(islandGeometry,t1Island),conveyor=new THREE.Mesh(beltGeometry,belt);island.position.set(x,y+.01,islandZ);conveyor.position.set(x,y+.64,islandZ);island.castShadow=conveyor.castShadow=false;island.receiveShadow=true;parent.add(island,conveyor);
  for(const side of [-1,1])islandSides.push({x,y:y+.67,z:islandZ+side*1.92,sx:long-.8,sy:.1,sz:.1,color:'#e2e5e0'});
  for(let dx=-long/2+1;dx<=long/2-1;dx+=.72)rollers.push({x:x+dx,y:y+.78,z:islandZ,sx:.065,sy:.045,sz:1.1});
  // Each island carries two numbered check-in zones (1–12); six desk positions
  // per zone fill the paired counter runs without changing the published count.
  for(let sideIndex=0;sideIndex<2;sideIndex++)for(let station=0;station<stationsPerZone;station++){
   const side=sideIndex===0?-1:1,deskX=x+(station-(stationsPerZone-1)/2)*stationSpacing,deskZ=islandZ+side*2.75;
   bases.push({x:deskX,y:y+.43,z:deskZ,sx:2.5,sy:.6,sz:2.25,color:'#aeb5b1'});
   tops.push({x:deskX,y:y+.77,z:deskZ,sx:2.7,sy:.12,sz:2.48,color:'#f0f0ea'});
   stands.push({x:deskX,y:y+1.1,z:deskZ-side*.72-.22,sx:.11,sy:.55,sz:.11});
   monitors.push({x:deskX,y:y+1.56,z:deskZ-side*.72-.22,sx:.7,sy:.48,sz:.11});
  }
  for(const side of [-1,1]){
   const queueZ=islandZ+side*5.5,queueLength=(stationsPerZone-1)*stationSpacing+stationSpacing;
   for(const offset of [-queueLength/2,0,queueLength/2])queuePosts.push({x:x+offset,y:y+.43,z:queueZ,sx:.1,sy:1,sz:.1});
   queueRails.push({x,y:y+.57,z:queueZ,sx:queueLength,sy:.05,sz:.07});
  }
  // The architect's published check-in-hall photo shows the roof structure
  // visible above the counters, with a slim dark information fascia rather
  // than individual timber canopies over each island. Keep its hanger rods
  // below the 2F soffit and leave the long roof view unobstructed.
  const fasciaY=y+4.18,fasciaWidth=long-1.1;
  box(parent,fasciaWidth,1.08,.5,x,fasciaY,islandZ,fascia);
  for(const hangerX of [-12,12])signHangers.push({x:x+hangerX,y:y+4.76,z:islandZ,sx:.1,sy:.12,sz:.1});
  sign(parent,`CHECK-IN  ${String(first).padStart(2,'0')}–${String(last).padStart(2,'0')}  報到`,x,fasciaY,islandZ+.26,15,'#718b88',0,.76);
  for(const side of [-1,1]){
   signLights.push({x,y:y+3.58,z:islandZ+side*.27,sx:fasciaWidth-1.4,sy:.035,sz:.055});
   for(const displaySide of [-1,1]){
    const displayX=x+displaySide*12.2,displayZ=islandZ+side*.257;
    signDisplays.push({x:displayX,y:y+4.18,z:displayZ,sx:3.2,sy:.48,sz:.055});
    for(let line=0;line<3;line++)signLights.push({x:displayX,y:y+4.29-line*.12,z:displayZ+side*.035,sx:line===0?2.15:1.45,sy:.025,sz:.025,color:line===0?'#c3ded6':'#86b3a8'});
   }
  }
 }
 batch(parent,t1CheckinDisplayText,signLights);batch(parent,displayGlass,signDisplays);
 batch(parent,t1Island,bases);batch(parent,islandTrim,tops);batch(parent,steel,stands);batch(parent,screen,monitors);batch(parent,beltRoller,rollers);batch(parent,islandTrim,islandSides);batch(parent,queuePost,queuePosts);batch(parent,steel,queueRails);batch(parent,steel,signHangers);
 // Self-service check-in stays to the hall edges, leaving clear paths between islands.
 for(const side of [-1,1])for(let i=0;i<5;i++){
  const x=b.x+side*b.width*.39+(i-2)*2.6,zKiosk=z+(i-2)*2.6;
  kiosks.push({x,y:y+1.05,z:zKiosk,sx:1.15,sy:2.1,sz:.82});kioskScreens.push({x,y:y+1.32,z:zKiosk-.43,sx:.62,sy:.58,sz:.055});
 }
 batch(parent,counter,kiosks);batch(parent,screen,kioskScreens);sign(parent,'DEPARTURES  出境',b.x-long/2-6,y+5.5,z,Math.min(b.depth*.04,10),'#aa9160',Math.PI/2,1.05);
}

/** T1's photographed 3F public hall has restrained potted planting at its edges. */
function terminal1HallPlanters(parent:THREE.Object3D,b:TerminalBounds,y:number){
 const pots:Item[]=[],soil:Item[]=[],foliageMat=material('#526f52',.9),flowerMat=material('#bb6b56',.72),potMat=material('#e5e6e0',.36,.06),soilMat=material('#393d34',.94);
 const offsets=[-100,-16,44,100],leaves=new THREE.InstancedMesh(new THREE.SphereGeometry(.5,10,8),foliageMat,offsets.length*10),flowers=new THREE.InstancedMesh(new THREE.SphereGeometry(.5,8,6),flowerMat,offsets.length*6),dummy=new THREE.Object3D();let li=0,fi=0;
 for(const side of [-1,1])for(const offset of offsets){
  const x=b.x+side*b.width*.36,z=b.z+offset;pots.push({x,y:y+.39,z,sx:2.65,sy:.78,sz:1.55});soil.push({x,y:y+.8,z,sx:2.3,sy:.08,sz:1.2});
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;dummy.position.set(x+Math.cos(a)*.55,y+1.16+(i%2)*.16,z+Math.sin(a)*.34);dummy.scale.set(.68,.66,.46);dummy.rotation.y=-a;dummy.updateMatrix();leaves.setMatrixAt(li++,dummy.matrix);}
  for(let i=0;i<3;i++){dummy.position.set(x+(i-1)*.42,y+1.4+(i%2)*.08,z+(i%2?.22:-.2));dummy.scale.set(.24,.24,.24);dummy.updateMatrix();flowers.setMatrixAt(fi++,dummy.matrix);}
 }
 leaves.count=li;flowers.count=fi;leaves.instanceMatrix.needsUpdate=flowers.instanceMatrix.needsUpdate=true;leaves.castShadow=true;leaves.receiveShadow=true;flowers.castShadow=false;batch(parent,potMat,pots);batch(parent,soilMat,soil);parent.add(leaves,flowers);
}

/** T1's 4F map shows two separate operator lounges beside a narrow public circulation spine. */
function terminal1FourthFloor(parent:THREE.Object3D,b:TerminalBounds,level:number,finishes:DeckFinishes){
 const width=b.width*T1_FOURTH_FLOOR_LAYOUT.widthRatio,depth=b.depth*T1_FOURTH_FLOOR_LAYOUT.depthRatio,suiteDepth=b.depth*T1_FOURTH_FLOOR_LAYOUT.suiteDepthRatio,centers=t1FourthFloorSuiteCenters(b.z,b.depth),connectorWidth=b.width*T1_FOURTH_FLOOR_LAYOUT.spineWidthRatio,suiteX=t1FourthFloorSuiteCenterX(b.x,b.width),y=level-.17;
 const slab=(slabWidth:number,slabDepth:number,x:number,z:number)=>{
  box(parent,slabWidth,.34,slabDepth,x,y,z,finishes.edge);
  const top=new THREE.Mesh(new THREE.PlaneGeometry(slabWidth,slabDepth),finishes.floor);top.rotation.x=-Math.PI/2;top.position.set(x,level+.012,z);top.receiveShadow=true;top.castShadow=false;parent.add(top);
  const underside=new THREE.Mesh(new THREE.PlaneGeometry(slabWidth,slabDepth),finishes.ceiling);underside.rotation.x=Math.PI/2;underside.position.set(x,level-.352,z);underside.castShadow=false;parent.add(underside);
 };
 // The official 4F map shows a continuous narrow elevator/circulation spine,
 // with the two wider Plaza Premium rooms attached along one side.
 slab(connectorWidth,depth,b.x,b.z);
 for(const center of centers)slab(width,suiteDepth,suiteX,center);
 const wallMat=new THREE.MeshPhysicalMaterial({color:'#b7c7c4',roughness:.2,metalness:.08,transparent:true,opacity:.25,depthWrite:false,side:THREE.DoubleSide});
 const leftX=suiteX-width/2,rightX=suiteX+width/2,wallY=level+1.62,doorGap=Math.min(9,width*.32);
 for(const center of centers){
  const near=center-suiteDepth/2,far=center+suiteDepth/2,clearLength=(suiteDepth-doorGap)/2;
  box(parent,.16,3.24,suiteDepth,rightX,wallY,center,wallMat);
  for(let z=near+5;z<=far-5;z+=8)box(parent,.13,3.34,.18,rightX,wallY,z,steel);
  // Keep the west wall open at the middle so each suite opens directly to the spine.
  for(const side of [-1,1]){
   const segmentCenter=side<0?near+clearLength/2:far-clearLength/2;
   box(parent,.16,3.24,clearLength,leftX,wallY,segmentCenter,wallMat);
   for(let z=segmentCenter-clearLength/2+4;z<=segmentCenter+clearLength/2-4;z+=8)box(parent,.13,3.34,.18,leftX,wallY,z,steel);
  }
  for(const side of [-1,1])box(parent,.22,3.24,.16,leftX,wallY,center+side*doorGap/2,wallMat);
  box(parent,.22,.22,doorGap,leftX,level+3.12,center,steel);
 }
 for(const center of centers)for(let z=center-suiteDepth/2+10;z<=center+suiteDepth/2-10;z+=18)box(parent,width-2,.06,.16,suiteX,level-.39,z,ceilingStrip);
}

/** A compact upper-level lounge sequence with glass screening, a staffed welcome desk and soft seating groups. */
let terminalLoungeWoodMaterial:THREE.Material|undefined,terminalLoungeRugMaterial:THREE.Material|undefined;
let terminalBlossomCarpetMaterial:THREE.Material|undefined,terminalLoungeMarbleMaterial:THREE.Material|undefined,terminalLoungeLightMarbleMaterial:THREE.Material|undefined,terminalLoungeCeilingMaterial:THREE.Material|undefined;
function terminalLoungeWood(){
 if(terminalLoungeWoodMaterial)return terminalLoungeWoodMaterial;
 const rand=seeded(1140417),texture=canvasTexture(512,256,ctx=>{
  ctx.fillStyle='#574236';ctx.fillRect(0,0,512,256);
  for(let y=0;y<256;y+=64){
   const base=118+Math.floor(rand()*22);ctx.fillStyle=`rgb(${base},${base-16},${base-26})`;ctx.fillRect(0,y,512,62);
   ctx.strokeStyle='rgba(243,207,157,.13)';ctx.lineWidth=1;
   for(let grain=0;grain<70;grain++){const gy=y+rand()*61,x=rand()*512,len=8+rand()*170;ctx.beginPath();ctx.moveTo(x,gy);ctx.bezierCurveTo(x+len*.35,gy-1+rand()*2,x+len*.68,gy-1+rand()*2,x+len,gy);ctx.stroke();}
   ctx.strokeStyle='rgba(22,18,15,.2)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y+63);ctx.lineTo(512,y+63);ctx.stroke();
  }
  for(let i=0;i<5000;i++){const value=72+Math.floor(rand()*78);ctx.fillStyle=`rgba(${value},${value-11},${value-18},${.035+rand()*.055})`;ctx.fillRect(rand()*512,rand()*256,.7+rand()*2,.6+rand()*1.2);}
 });texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(1.7,1);texture.anisotropy=8;
 terminalLoungeWoodMaterial=new THREE.MeshStandardMaterial({color:'#eee4d4',map:texture,roughness:.56,metalness:.025});return terminalLoungeWoodMaterial;
}
function terminalLoungeRug(){
 if(terminalLoungeRugMaterial)return terminalLoungeRugMaterial;
 const size=512,rand=seeded(1140418),texture=canvasTexture(size,size,ctx=>{
  ctx.fillStyle='#aaa79f';ctx.fillRect(0,0,size,size);
  // Use broad, low-contrast fibre variation so the carpet remains visible at
  // normal first-person resolution instead of filtering into a flat grey.
  for(let i=0;i<74;i++){
   const x=rand()*size,y=rand()*size,r=18+rand()*52,light=rand()>.48;
   const cloud=ctx.createRadialGradient(x,y,0,x,y,r);
   cloud.addColorStop(0,light?'rgba(238,235,225,.19)':'rgba(49,52,49,.15)');cloud.addColorStop(.6,light?'rgba(238,235,225,.07)':'rgba(49,52,49,.055)');cloud.addColorStop(1,'rgba(0,0,0,0)');
   ctx.fillStyle=cloud;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  // Fine crossed fibres stay subordinate to the larger carpet variation.
  for(let y=0;y<size;y+=2){ctx.strokeStyle=y%4===0?'rgba(241,237,225,.09)':'rgba(49,49,45,.045)';ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(size,y);ctx.stroke();}
  for(let x=0;x<size;x+=3){ctx.strokeStyle=x%6===0?'rgba(238,232,220,.07)':'rgba(45,48,45,.035)';ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,size);ctx.stroke();}
  for(let i=0;i<18000;i++){const value=120+Math.floor(rand()*72);ctx.fillStyle=`rgba(${value},${value-2},${value-6},${.018+rand()*.055})`;ctx.fillRect(rand()*size,rand()*size,.5+rand()*1.2,.5+rand()*.9);}
 });texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(10,44);texture.anisotropy=8;
 terminalLoungeRugMaterial=new THREE.MeshStandardMaterial({color:'#f2efe6',map:texture,roughness:.98,metalness:0,emissive:'#57554e',emissiveIntensity:.22});return terminalLoungeRugMaterial;
}
function terminalBlossomCarpet(){
 if(terminalBlossomCarpetMaterial)return terminalBlossomCarpetMaterial;
 const rand=seeded(1140419),texture=canvasTexture(512,512,ctx=>{
  ctx.fillStyle='#77736b';ctx.fillRect(0,0,512,512);
  // Zone D's gallery shows a small repeating blue/ochre woven motif. The
  // pattern is kept tileable and scaled to a carpet-sized repeat, not broad
  // stripes that vanish into a flat grey plane at walking distance.
  for(let y=-32;y<544;y+=64)for(let x=-32;x<544;x+=64){
   ctx.save();ctx.translate(x,y);
   ctx.fillStyle='rgba(49,70,77,.34)';ctx.beginPath();ctx.moveTo(32,5);ctx.lineTo(58,32);ctx.lineTo(32,59);ctx.lineTo(6,32);ctx.closePath();ctx.fill();
   ctx.strokeStyle='rgba(184,145,87,.78)';ctx.lineWidth=2.3;ctx.beginPath();ctx.moveTo(32,12);ctx.lineTo(51,32);ctx.lineTo(32,52);ctx.lineTo(13,32);ctx.closePath();ctx.stroke();
   ctx.strokeStyle='rgba(205,190,157,.54)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(32,18);ctx.lineTo(46,32);ctx.lineTo(32,46);ctx.lineTo(18,32);ctx.closePath();ctx.stroke();
   for(const [px,py] of [[32,2],[62,32],[32,62],[2,32]]){ctx.fillStyle='rgba(175,143,94,.63)';ctx.beginPath();ctx.arc(px,py,3.1,0,Math.PI*2);ctx.fill();}
   ctx.fillStyle='rgba(205,194,170,.38)';ctx.beginPath();ctx.arc(32,32,3,0,Math.PI*2);ctx.fill();
   ctx.restore();
  }
  // Soft irregular yarn flecks break up the geometric repeat like woven pile.
  for(let i=0;i<16000;i++){const v=116+Math.floor(rand()*88),alpha=.025+rand()*.055;ctx.fillStyle=`rgba(${v},${v-3},${v-8},${alpha})`;ctx.fillRect(rand()*512,rand()*512,.45+rand()*1.1,.45+rand()*.9);}
 });texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(12,12);texture.anisotropy=8;
 terminalBlossomCarpetMaterial=new THREE.MeshStandardMaterial({color:'#fffaf0',map:texture,roughness:.98,metalness:0,emissive:'#514939',emissiveIntensity:.34});return terminalBlossomCarpetMaterial;
}
function terminalLoungeMarble(){
 if(terminalLoungeMarbleMaterial)return terminalLoungeMarbleMaterial;
 const rand=seeded(1140420),texture=canvasTexture(512,512,ctx=>{
  ctx.fillStyle='#504d4b';ctx.fillRect(0,0,512,512);
  const wash=ctx.createLinearGradient(0,0,512,512);wash.addColorStop(0,'rgba(236,231,220,.16)');wash.addColorStop(.42,'rgba(117,112,106,.05)');wash.addColorStop(1,'rgba(16,19,20,.18)');ctx.fillStyle=wash;ctx.fillRect(0,0,512,512);
  for(let vein=0;vein<27;vein++){
   const x=rand()*512,y=rand()*512,dx=(rand()-.5)*130,dy=50+rand()*430;
   ctx.strokeStyle=vein%4===0?'rgba(231,224,210,.62)':'rgba(207,199,184,.34)';ctx.lineWidth=vein%4===0?1.7:.65;
   ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+dx*.45,y+dy*.28,x-dx*.32,y+dy*.68,x+dx,y+dy);ctx.stroke();
   if(vein%3===0){ctx.strokeStyle='rgba(35,38,39,.34)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x+2,y);ctx.bezierCurveTo(x+dx*.5,y+dy*.3,x-dx*.2,y+dy*.62,x+dx+3,y+dy);ctx.stroke();}
  }
  for(let i=0;i<11000;i++){const v=75+Math.floor(rand()*125),alpha=.018+rand()*.05;ctx.fillStyle=`rgba(${v},${v-2},${Math.max(0,v-4)},${alpha})`;ctx.fillRect(rand()*512,rand()*512,.5+rand()*1.6,.5+rand()*1.2);}
 });texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=8;
 terminalLoungeMarbleMaterial=new THREE.MeshStandardMaterial({color:'#f1eee5',map:texture,roughness:.25,metalness:.015});return terminalLoungeMarbleMaterial;
}
function terminalLoungeLightMarble(){
 if(terminalLoungeLightMarbleMaterial)return terminalLoungeLightMarbleMaterial;
 const rand=seeded(1140421),texture=canvasTexture(512,512,ctx=>{
  ctx.fillStyle='#d8d5cd';ctx.fillRect(0,0,512,512);
  for(let vein=0;vein<21;vein++){
   const x=rand()*512,y=rand()*512,dx=(rand()-.5)*120,dy=60+rand()*430;
   ctx.strokeStyle=vein%4===0?'rgba(109,110,106,.48)':'rgba(126,126,120,.25)';ctx.lineWidth=vein%4===0?1.6:.7;
   ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+dx*.45,y+dy*.3,x-dx*.34,y+dy*.68,x+dx,y+dy);ctx.stroke();
  }
  for(let i=0;i<10000;i++){const v=190+Math.floor(rand()*54),alpha=.022+rand()*.04;ctx.fillStyle=`rgba(${v},${v},${Math.max(0,v-5)},${alpha})`;ctx.fillRect(rand()*512,rand()*512,.6+rand()*1.3,.5+rand()*1.1);}
 });texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=8;
 terminalLoungeLightMarbleMaterial=new THREE.MeshStandardMaterial({color:'#fffdf4',map:texture,roughness:.32,metalness:.01});return terminalLoungeLightMarbleMaterial;
}
function terminalLoungeCeiling(){
 if(terminalLoungeCeilingMaterial)return terminalLoungeCeilingMaterial;
 const texture=canvasTexture(512,512,ctx=>{
  ctx.fillStyle='#eeede8';ctx.fillRect(0,0,512,512);
  ctx.strokeStyle='rgba(85,91,90,.09)';ctx.lineWidth=1.2;for(let p=0;p<=512;p+=128){ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,512);ctx.moveTo(0,p);ctx.lineTo(512,p);ctx.stroke();}
  for(let y=32;y<512;y+=64)for(let x=32;x<512;x+=64){ctx.fillStyle='rgba(93,99,96,.18)';ctx.beginPath();ctx.arc(x,y,5.8,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,249,231,.95)';ctx.beginPath();ctx.arc(x,y,4.2,0,Math.PI*2);ctx.fill();}
 });texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,3);texture.anisotropy=8;
 terminalLoungeCeilingMaterial=new THREE.MeshStandardMaterial({color:'#fffdf7',map:texture,roughness:.88,metalness:0,emissive:'#746b5b',emissiveIntensity:.26,side:THREE.DoubleSide});return terminalLoungeCeilingMaterial;
}
function terminal1Lounge(parent:THREE.Object3D,b:TerminalBounds,level:number){
 const w=b.width*T1_FOURTH_FLOOR_LAYOUT.widthRatio,suiteDepth=b.depth*T1_FOURTH_FLOOR_LAYOUT.suiteDepthRatio,suiteCenters=t1FourthFloorSuiteCenters(b.z,b.depth),suiteX=t1FourthFloorSuiteCenterX(b.x,b.width),left=suiteX-w/2+2.5,right=suiteX+w/2-2.5,roomLeft=suiteX-w/2,base=level+.012;
 const divider=terminalLoungeWood(),woodTop=terminalLoungeWood(),softSeat=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.9,metalness:.005,emissive:'#332d25',emissiveIntensity:.18}),softSeatLight=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.82,metalness:.015,emissive:'#332d25',emissiveIntensity:.14}),softPillow=material('#ffffff',.88,.005),marble=terminalLoungeMarble(),lightMarble=terminalLoungeLightMarble();
 // The public map identifies two separate suites; the operator photos show
 // distinct fit-outs. Zone D is a booth-and-carpet lounge; Zone C is an open
 // dining/banquette room. Exact furniture counts remain approximate.
 const blossomRows=[-.3,-.1,.1],jadeRows=[-.27,-.09,.09,.27],groups=suiteCenters.flatMap((center,suite)=>(suite===0?blossomRows:jadeRows).map((offset,cluster)=>({z:center+suiteDepth*offset,suite,cluster})));
 for(let suite=0;suite<suiteCenters.length;suite++){
  const center=suiteCenters[suite],lounge=T1_FOURTH_FLOOR_LOUNGES[suite],rug=suite===0?terminalBlossomCarpet():terminalLoungeRug(),carpetField=new THREE.Mesh(new THREE.PlaneGeometry(right-left,suiteDepth-2.6),rug);
  carpetField.rotation.x=-Math.PI/2;carpetField.position.set(suiteX,base+.038,center);carpetField.receiveShadow=true;carpetField.castShadow=false;parent.add(carpetField);
  // Operator photos show a low, flat ceiling with recessed points of light.
  // This tenant ceiling hides the exposed terminal trusses from inside the room.
  const ceilingY=base+3.16,ceiling=new THREE.Mesh(new THREE.PlaneGeometry(w-1,suiteDepth-1.2),terminalLoungeCeiling());ceiling.rotation.x=Math.PI/2;ceiling.position.set(suiteX,ceilingY,center);ceiling.castShadow=false;parent.add(ceiling);
  const downlight=new THREE.MeshStandardMaterial({color:'#fff6df',emissive:'#ffe5ad',emissiveIntensity:.9,roughness:.46}),downlightGeo=new THREE.CylinderGeometry(.105,.105,.035,20);
  for(const xOffset of [-.32,-.11,.11,.32])for(const zOffset of [-.32,-.16,0,.16,.32]){const lamp=new THREE.Mesh(downlightGeo,downlight);lamp.position.set(suiteX+w*xOffset,ceilingY-.02,center+suiteDepth*zOffset);lamp.castShadow=false;parent.add(lamp);}
  // The roof above the 4F suites occludes daylight in free roam. Add a small
  // set of warm, non-shadow-casting ceiling fills so the photographed wood,
  // fabric and carpet palette remains legible inside the enclosed rooms.
  for(const xSide of [-1,1])for(const zSide of [-1,1]){
   const fill=new THREE.PointLight('#fff0d8',8,13,2);fill.position.set(suiteX+xSide*4.3,ceilingY-.32,center+zSide*4.2);fill.castShadow=false;parent.add(fill);
  }
  // A short warm timber fascia marks the entry threshold; Zone C's operator
  // frontage uses a distinctive stone sign wall in the published photographs.
  const entryWood=material(suite===0?'#735b42':'#4c514d',.52,.15),portalStone=material(suite===0?'#d2cec4':'#57524d',.32,.08);
  box(parent,.3,3.15,1.55,roomLeft+.12,base+1.58,center+4.05,portalStone);
  box(parent,.28,3.15,.5,roomLeft+.12,base+1.58,center-4.05,entryWood);
  sign(parent,`PLAZA PREMIUM  ${lounge.nameEn.toUpperCase()}`,roomLeft-.05,base+2.5,center+4.05,2.65,lounge.accent,-Math.PI/2,.9);
 }
 // Both rooms open from their west side to the continuous public spine. The
 // reference frontage is an open portal; a full-width translucent door sheet
 // previously made the lounge look like a sealed glass box.
 const portalW=Math.min(10.5,w*.24),portalMat=material('#272b29',.38,.36);
 for(let suite=0;suite<suiteCenters.length;suite++){
  const entryZ=suiteCenters[suite];
  for(const side of [-1,1])box(parent,.18,3.35,.2,roomLeft,base+1.68,entryZ+side*(portalW/2+.68),portalMat);
  box(parent,.24,.42,portalW+1.36,roomLeft,base+3.26,entryZ,portalMat);
  for(const side of [-1,1])box(parent,.12,2.82,.12,roomLeft+.1,base+1.58,entryZ+side*portalW/2,steel);
  // Local red runner at the lounge threshold matches the carpeted departure
  // corridor visible in the Zone C frontage photo; the main spine stays stone.
  if(suite===1){const runner=new THREE.Mesh(new THREE.PlaneGeometry(5.3,4.9),new THREE.MeshStandardMaterial({color:'#79434a',roughness:.96}));runner.rotation.x=-Math.PI/2;runner.position.set(roomLeft-2.7,base+.025,entryZ);runner.receiveShadow=true;parent.add(runner);}
 }
 // Zone D's published interior view is bounded by timber panels and a long
 // slatted screen, with a small flight display at the far end. Close the old
 // open-ended shell so terminal trusses do not read as part of the lounge.
 const blossomCenter=suiteCenters[0],blossomNear=blossomCenter-suiteDepth/2,blossomFar=blossomCenter+suiteDepth/2,blossomSlats:Item[]=[];
 box(parent,w-.25,3.08,.18,suiteX,base+1.54,blossomNear+.08,terminalLoungeWood());
 box(parent,w-.25,3.08,.18,suiteX,base+1.54,blossomFar-.08,terminalLoungeWood());
 const display=material('#132a36',.3,.18),displayGlow=new THREE.MeshStandardMaterial({color:'#72aab4',emissive:'#2a8291',emissiveIntensity:.38,roughness:.36});
 box(parent,5.5,1.38,.09,suiteX,base+2.27,blossomNear+.22,material('#382f28',.72,.025));
 box(parent,5.24,1.12,.035,suiteX,base+2.28,blossomNear+.285,display);
 for(let line=0;line<5;line++){
  const rowY=base+2.67-line*.18;box(parent,2.7-(line%2)*.46,.035,.018,suiteX-.64,rowY,blossomNear+.31,displayGlow);
  for(let cell=0;cell<4;cell++)box(parent,.18,.035,.018,suiteX+.82+cell*.25,rowY,blossomNear+.31,displayGlow);
 }
 const slatCount=34,slatStart=blossomNear+.42,slatSpan=suiteDepth-.84;
 for(let slat=0;slat<slatCount;slat++)blossomSlats.push({x:suiteX+w/2-.26,y:base+1.55,z:slatStart+slat*slatSpan/(slatCount-1),sx:.14,sy:2.98,sz:.075,color:slat%6===0?'#a48661':'#755d48'});
 for(const side of [-1,1]){
  const segmentLength=(suiteDepth-portalW-1.8)/2,segmentCenter=side<0?blossomNear+segmentLength/2+.45:blossomFar-segmentLength/2-.45;
  box(parent,.14,2.92,segmentLength,roomLeft+.26,base+1.46,segmentCenter,terminalLoungeWood());
 }
 batch(parent,terminalLoungeWood(),blossomSlats);
 // Reception sits just inside each portal, parallel to the circulation spine,
 // instead of placing a full-width wall across the public sightline.
 const featureSlatBatches:Item[][]=[];
 for(let suite=0;suite<suiteCenters.length;suite++){
  const center=suiteCenters[suite],lounge=T1_FOURTH_FLOOR_LOUNGES[suite],deskX=roomLeft+3.65,deskZ=center+(suite===0?3.55:-3.55),deskLength=suite===0?6.8:4.8,featureSlats:Item[]=[];
  const deskFront=box(parent,.08,.92,deskLength-.18,deskX-.73,base+.57,deskZ,marble);deskFront.castShadow=true;
  box(parent,1.46,1.08,deskLength,deskX,base+.54,deskZ,material(suite===0?'#6a6259':'#344440',.34,.12));
  box(parent,1.54,.14,deskLength+.18,deskX,base+1.12,deskZ,woodTop);
  // The Blossom has a pale stone reception backdrop; The Jade uses its warm
  // timber slat screen. Both backdrops stay beside the main entry route.
  const backdropX=deskX+1.42,backdropZ=deskZ,backdropLength=deskLength+1.1;
  box(parent,.2,3.05,backdropLength,backdropX,base+1.54,backdropZ,suite===0?lightMarble:divider);
  if(suite===1){
   for(let slat=0;slat<19;slat++)featureSlats.push({x:backdropX-.12,y:base+1.6,z:backdropZ-backdropLength*.46+slat*backdropLength*.92/18,sx:.12,sy:2.8,sz:.055,color:slat%4===0?lounge.accent:'#8b7657'});
  }else{
   // Brass-edged mirror feature in the published Zone D reception image.
   const mirrorMat=new THREE.MeshPhysicalMaterial({color:'#9bafa9',roughness:.12,metalness:.12,transparent:true,opacity:.78});
   const mirror=new THREE.Mesh(new THREE.CircleGeometry(.76,40),mirrorMat);mirror.rotation.y=-Math.PI/2;mirror.scale.set(.76,1.08,1);mirror.position.set(backdropX-.13,base+2.17,backdropZ);parent.add(mirror);
   const frame=new THREE.Mesh(new THREE.TorusGeometry(.84,.045,8,40),material('#b39668',.35,.52));frame.rotation.y=-Math.PI/2;frame.scale.set(.88,1.24,1);frame.position.copy(mirror.position);parent.add(frame);
  }
  featureSlatBatches.push(featureSlats);
  sign(parent,`${lounge.nameEn.toUpperCase()}  RECEPTION`,deskX-.82,base+2.73,deskZ,Math.min(4.4,deskLength*.68),lounge.accent,Math.PI/2,.64);
 }
 for(const slats of featureSlatBatches)batch(parent,terminalLoungeWood(),slats);
 const seats:Item[]=[],backs:Item[]=[],seatPads:Item[]=[],backPads:Item[]=[],arms:Item[]=[],cushions:Item[]=[],chairs:Item[]=[],chairBacks:Item[]=[],chairArms:Item[]=[],tables:Item[]=[],jadeTables:Item[]=[],legs:Item[]=[],chairLegs:Item[]=[],plinths:Item[]=[],planters:Item[]=[],ceilingSlats:Item[]=[],ceilingLights:Item[]=[],powerPlates:Item[]=[],boothBacks:Item[]=[],boothSideWings:Item[]=[],boothBrass:Item[]=[],socketDetails:Item[]=[];
 // The Zone C reference photos show one long upholstered wall bench with
 // individual cafe tables. It replaces the repeated sofa pods used in Zone D.
 const jadeCenter=suiteCenters[1],jadeBenchX=suiteX+w*.31,jadeBench=material('#176e69',.8,.015),jadeBenchBack=material('#236c67',.82,.01);
 // Zone C combines a side-wall dining banquette with separate lounge chairs;
 // the former cross-room bench made the entire suite read like one divider.
 for(let section=0;section<5;section++){
  const z=jadeCenter+(section-2)*2.48;
  box(parent,1.18,.74,2.26,jadeBenchX,base+.39,z,jadeBench);
  box(parent,.22,1.02,2.26,jadeBenchX+.48,base+1.21,z,jadeBenchBack);
  box(parent,1.22,.13,2.3,jadeBenchX,base+.81,z,jadeBenchBack);
 }
 const jadeSlats:Item[]=[];
 for(let slat=0;slat<23;slat++)jadeSlats.push({x:jadeBenchX+.77,y:base+1.72,z:jadeCenter-6.15+slat*(12.3/22),sx:.055,sy:2.8,sz:.055,color:slat%5===0?'#ad8b5e':'#8b7657'});
 batch(parent,terminalLoungeWood(),jadeSlats);
 for(const {z,suite:suiteIndex,cluster} of groups){
  const lounge=T1_FOURTH_FLOOR_LOUNGES[suiteIndex],seatColor=cluster%2?lounge.pillow:lounge.seat;
  for(const side of [-1,1]){
   if(suiteIndex===1){
    if(side<0)continue;
    const x=suiteX+w*.105,chairX=x-1.1;
    jadeTables.push({x,y:base+.76,z,sx:1.22,sy:.11,sz:1.12,color:'#bcb2a1'});
    plinths.push({x,y:base+.38,z,sx:.14,sy:.72,sz:.14,color:'#7f7569'});
    for(const chairSide of [-1,1]){
     const chairZ=z+chairSide*.58;
     chairs.push({x:chairX,y:base+.43,z:chairZ,sx:.8,sy:.26,sz:.72,color:'#a5aaa2'});
     chairBacks.push({x:chairX-.31,y:base+.96,z:chairZ,sx:.18,sy:.9,sz:.68,color:'#a5aaa2'});
     for(const armSide of [-1,1])chairArms.push({x:chairX-.04,y:base+.72,z:chairZ+armSide*.34,sx:.65,sy:.38,sz:.11,color:'#858d87'});
     for(const foot of [-1,1])chairLegs.push({x:chairX+foot*.27,y:base+.2,z:chairZ+foot*.23,sx:.065,sy:.38,sz:.065});
    }
    continue;
   }
   const x=suiteX+side*w*.235,rz=z,outerX=x+side*.92,wingX=x-side*.06,tableX=x-side*.36;
   // The official Zone D gallery shows repeated U-shaped privacy bays: a
   // cushioned bench against the outer partition, a small table, and two
   // upholstered returns opening toward the lounge aisle.
   seats.push({x:x+side*.18,y:base+.48,z:rz,sx:1.02,sy:.35,sz:2.42,color:seatColor});
   backs.push({x:x+side*.58,y:base+1.08,z:rz,sx:.28,sy:1.02,sz:2.38,color:seatColor});
   for(const pad of [-1,0,1]){
    seatPads.push({x:x+side*.16,y:base+.63,z:rz+pad*.69,sx:.82,sy:.14,sz:.66,color:seatColor});
    backPads.push({x:x+side*.48,y:base+1.08,z:rz+pad*.69,sx:.18,sy:.86,sz:.58,color:seatColor});
   }
   for(const end of [-1,1])arms.push({x:x+side*.12,y:base+.77,z:rz+end*1.16,sx:.92,sy:.52,sz:.22,color:lounge.accent});
   powerPlates.push({x:tableX,y:base+1.08,z:rz+1.14,sx:.34,sy:.055,sz:.16,color:'#334149'});
   socketDetails.push({x:tableX,y:base+1.12,z:rz+1.15,sx:.045,sy:.018,sz:.07,color:'#d4b06d'});
   boothBacks.push({x:outerX,y:base+1.16,z:rz,sx:.16,sy:1.36,sz:2.98,color:'#94887d'});
   for(const end of [-1,1]){
    boothSideWings.push({x:wingX,y:base+1.09,z:rz+end*1.43,sx:2.1,sy:1.22,sz:.16,color:'#aa9e91'});
    // Timber caps and fine brass reveal lines follow the angular booth edges.
    boothBrass.push({x:outerX,y:base+1.86,z:rz+end*1.47,sx:.21,sy:.095,sz:.22,color:'#9a7956'});
    boothBrass.push({x:wingX,y:base+1.75,z:rz+end*1.43,sx:2.12,sy:.08,sz:.2,color:'#a48661'});
   }
   for(const foot of [-1,1])legs.push({x:x+side*.18,y:base+.23,z:rz+foot*.86,sx:.1,sy:.42,sz:.1});
   tables.push({x:tableX,y:base+.78,z:rz,sx:.88,sy:.12,sz:1.12,color:'#c9bda8'});
   plinths.push({x:tableX,y:base+.39,z:rz,sx:.14,sy:.72,sz:.14,color:'#858a80'});
  }
 }
 // Zone D's official gallery also shows an open dining area with cafe tables,
 // separate from its repeated privacy booths. Keep this small pair at the
 // portal end so the booth field and central view remain legible.
 const blossomDiningZ=suiteCenters[0]+suiteDepth*.29;
 for(const xOffset of [-2.55,2.55]){
  const x=suiteX+xOffset;
  jadeTables.push({x,y:base+.76,z:blossomDiningZ,sx:1.28,sy:.1,sz:1.12,color:'#c9c2b5'});
  plinths.push({x,y:base+.38,z:blossomDiningZ,sx:.14,sy:.72,sz:.14,color:'#81796d'});
  for(const side of [-1,1]){
   const chairX=x-1.12,chairZ=blossomDiningZ+side*.57;
   chairs.push({x:chairX,y:base+.43,z:chairZ,sx:.78,sy:.25,sz:.68,color:'#c0bbb1'});
   chairBacks.push({x:chairX-.31,y:base+.96,z:chairZ,sx:.18,sy:.9,sz:.64,color:'#c0bbb1'});
   for(const armSide of [-1,1])chairArms.push({x:chairX-.04,y:base+.72,z:chairZ+armSide*.32,sx:.62,sy:.36,sz:.1,color:'#aaa397'});
   for(const foot of [-1,1])chairLegs.push({x:chairX+foot*.26,y:base+.2,z:chairZ+foot*.22,sx:.06,sy:.37,sz:.06});
  }
 }
 // The Jade gallery also shows a quieter pair of lounge chairs against a
 // timber feature wall, separate from the dining banquette and cafe tables.
 const jadeLoungeWallZ=jadeCenter+suiteDepth/2-.12,jadeChairZ=jadeCenter+suiteDepth*.24,jadeChairMat='#c7c1b7';
 box(parent,w-.3,3.04,.18,suiteX,base+1.52,jadeLoungeWallZ,terminalLoungeWood());
 for(const i of [0,1]){
  const x=suiteX-4.1+i*3.25;
  chairs.push({x,y:base+.47,z:jadeChairZ,sx:1.12,sy:.34,sz:.94,color:jadeChairMat});
  chairBacks.push({x,y:base+1.18,z:jadeChairZ+.36,sx:1.06,sy:1.16,sz:.2,color:jadeChairMat});
  for(const armSide of [-1,1])chairArms.push({x:x+armSide*.5,y:base+.76,z:jadeChairZ,sx:.13,sy:.42,sz:.88,color:'#b6afa4'});
  for(const foot of [-1,1])chairLegs.push({x:x+foot*.34,y:base+.22,z:jadeChairZ+foot*.28,sx:.075,sy:.4,sz:.075});
 }
 const jadeSideTableX=suiteX-2.45,jadeSideTableZ=jadeChairZ-.05;
 tables.push({x:jadeSideTableX,y:base+.68,z:jadeSideTableZ,sx:.74,sy:.12,sz:.72,color:'#b4a995'});
 plinths.push({x:jadeSideTableX,y:base+.34,z:jadeSideTableZ,sx:.12,sy:.58,sz:.12,color:'#857a68'});
 const vaseGlass=new THREE.MeshPhysicalMaterial({color:'#d8e7df',roughness:.12,metalness:.02,transparent:true,opacity:.68,depthWrite:false}),orchid=material('#ead1d9',.76,.005),orchidStem=material('#677e59',.78,.005);
 const vase=new THREE.Mesh(new THREE.CylinderGeometry(.13,.18,.42,14),vaseGlass);vase.position.set(jadeSideTableX,base+1.03,jadeSideTableZ);vase.castShadow=false;parent.add(vase);
 for(let bloom=0; bloom<3; bloom++){
  const bloomX=jadeSideTableX+(bloom-1)*.13,bloomZ=jadeSideTableZ+(bloom%2?.06:-.04);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.018,.025,.44,7),orchidStem);stem.position.set(bloomX,base+1.39,bloomZ);stem.rotation.z=(bloom-1)*.17;parent.add(stem);
  const flower=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),orchid);flower.scale.set(1,.42,.78);flower.position.set(bloomX,base+1.61,bloomZ);parent.add(flower);
 }
 // Both operator galleries show a compact wall-side service counter; its side
 // switches so dining seating remains open between counter and lounge entry.
 for(let suite=0;suite<suiteCenters.length;suite++){
  const center=suiteCenters[suite],lounge=T1_FOURTH_FLOOR_LOUNGES[suite],side=suite===0?1:-1,buffetX=suiteX+side*(w*.42),buffetZ=center+suiteDepth*.27;
  // The Blossom references place the food counter along the side service wall;
  // a long freestanding island previously cut across the room's main sightline.
  box(parent,1.35,1.08,8.5,buffetX,base+.54,buffetZ,woodTop);
  box(parent,1.48,.12,8.7,buffetX,base+1.12,buffetZ,divider);
  box(parent,.14,1.32,8.5,buffetX+side*.76,base+1.76,buffetZ,divider);
  const applianceMetal=material('#626b68',.34,.52),applianceDark=material('#303638',.36,.22),buffetGlass=new THREE.MeshPhysicalMaterial({color:'#ddd9ce',roughness:.2,metalness:.04,transparent:true,opacity:.52,depthWrite:false});
  // Compact drinks, chilled display and hot-food equipment sit on the counter.
  for(let station=0;station<3;station++){
   const z=buffetZ+(station-1)*2.45,x=buffetX-side*.18;
   if(station===0){
    box(parent,.84,.78,.96,x,base+1.57,z,applianceDark);box(parent,.62,.24,.08,x,base+1.73,z-side*.51,screen);box(parent,.55,.08,.4,x,base+1.17,z-side*.35,applianceMetal);
    for(const cupSide of [-1,1]){
     const cup=new THREE.Mesh(new THREE.CylinderGeometry(.11,.095,.2,10),foodCourtIvory);cup.position.set(x+cupSide*.18,base+1.18,z+side*.37);cup.castShadow=false;parent.add(cup);
    }
   }else{
    box(parent,1.08,.62,1.34,x,base+1.49,z,applianceMetal);
    box(parent,.98,.16,1.24,x,base+1.88,z,applianceDark);
    box(parent,.92,.36,1.12,x,base+1.79,z-side*.025,buffetGlass);
    for(let tray=0;tray<3;tray++)box(parent,.27,.07,.82,x+(tray-1)*.31,base+1.59,z-side*.04,material(['#c08b48','#806a4e','#a96c4a'][tray],.66,.03));
    for(let dish=0;dish<3;dish++)box(parent,.21,.09,.22,x+(dish-1)*.28,base+1.22,z+side*.2,foodCourtIvory);
   }
  }
  sign(parent,'FOOD & BEVERAGE  餐飲',buffetX-side*.92,base+3.22,buffetZ,Math.min(8,suiteDepth*.38),lounge.accent,side*Math.PI/2,.72);
  if(suite===0)planters.push({x:suiteX-side*(w*.39),y:base+.46,z:center+suiteDepth*.2,sx:1.7,sy:.72,sz:2.8,color:'#9e8c84'});
 }
 batchRounded(parent,softSeat,seats,true);batchRounded(parent,softSeat,backs);batchRounded(parent,softSeat,seatPads,true);batchRounded(parent,softSeat,backPads);batchRounded(parent,softSeatLight,arms);batchRounded(parent,softPillow,cushions);batchRounded(parent,softSeatLight,chairs,true);batchRounded(parent,softSeatLight,chairBacks);batchRounded(parent,softSeatLight,chairArms);batch(parent,steel,legs);batch(parent,steel,chairLegs);batch(parent,screen,powerPlates);batch(parent,material('#d7b56f',.38,.35),socketDetails);batchRounded(parent,softSeat,boothBacks);batchRounded(parent,softSeat,boothSideWings);batch(parent,material('#a99067',.42,.46),boothBrass);batchRounded(parent,counterTop,tables,true);batchRounded(parent,material('#bbb3a6',.28,.08),jadeTables,true);batchRounded(parent,steel,plinths);batch(parent,material('#858b7d',.86),planters);
 // The 2026 lounge pages list lounge seating/bays and charging; small lamps add
 // local reading light without changing the terminal roof lighting.
 const lampStemGeo=new THREE.CylinderGeometry(.035,.055,.38,10),lampShadeGeo=new THREE.CylinderGeometry(.16,.12,.26,16),lampStemMat=material('#8a7357',.42,.34),lampShadeMat=new THREE.MeshStandardMaterial({color:'#f0e3c8',emissive:'#c68d42',emissiveIntensity:.28,roughness:.58});
 for(const table of tables){
  const stem=new THREE.Mesh(lampStemGeo,lampStemMat);stem.position.set(table.x,table.y+.25,table.z);stem.castShadow=false;parent.add(stem);
  const shade=new THREE.Mesh(lampShadeGeo,lampShadeMat);shade.position.set(table.x,table.y+.56,table.z);shade.castShadow=false;parent.add(shade);
  const baseDisc=new THREE.Mesh(new THREE.CylinderGeometry(.11,.12,.04,16),warmWood);baseDisc.position.set(table.x,table.y+.08,table.z);parent.add(baseDisc);
 }
 // Short acoustic rafts sit above each seating group while the terminal roof remains visible around them.
 const ceilingGroupCenters=suiteCenters.flatMap(center=>[center-suiteDepth*.2,center+suiteDepth*.2]);
 for(const z of ceilingGroupCenters){
  for(let x=suiteX-w*.32;x<=suiteX+w*.32;x+=2.7)ceilingSlats.push({x,y:base+4.55,z,sx:2.45,sy:.08,sz:.12,color:'#c7c2b5'});
  for(const side of [-1,1])ceilingLights.push({x:suiteX+side*w*.25,y:base+4.45,z,sx:.16,sy:.06,sz:3.6,color:'#f0dfb4'});
 }
 batch(parent,divider,ceilingSlats);batch(parent,light,ceilingLights);
 for(let suite=0;suite<suiteCenters.length;suite++)sign(parent,'QUIET SEATING  靜憩區',suiteX+w*.29,base+3.3,suiteCenters[suite]+suiteDepth*.23,Math.min(10,w*.25),T1_FOURTH_FLOOR_LOUNGES[suite].accent,Math.PI,.82);
}

function checkInHall(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number,islands:number,countersPerIsland:number|number[],startNumber:number=1,profile?:'T1'|'T2'){
 const bases:Item[]=[],tops:Item[]=[],monitors:Item[]=[],stands:Item[]=[],bagBelts:Item[]=[],posts:Item[]=[],queueRails:Item[]=[],islandQueuePosts:Item[]=[],islandQueueRails:Item[]=[],islandBases:Item[]=[],beltSurfaces:Item[]=[],beltRollers:Item[]=[],kiosks:Item[]=[],kioskScreens:Item[]=[],headerSupports:Item[]=[];let nextNumber=startNumber;
 for(let g=0;g<islands;g++){
  const counterCount=Array.isArray(countersPerIsland)?(countersPerIsland[g]??countersPerIsland.at(-1)??1):countersPerIsland;
  // T2's public 3F map stacks the check-in islands along the building's long
  // hall axis; the counter runs span the short axis across X.
  const isT2=profile==='T2',cx=isT2?b.x:b.x+(g-(islands-1)/2)*(b.width/(islands+1.05)),rowZ=isT2?z+(g-(islands-1)/2)*Math.min(26,b.depth*.085):profile==='T1'?z+(g-(islands-1)/2)*7.2:z,first=nextNumber,last=first+counterCount-1,rowWidth=counterCount*3.45;nextNumber=last+1;
  if(profile){
   const islandZ=rowZ,bodyY=y+(isT2?.31:.47),baseMat=isT2?'#414947':'#6b7472',approach=isT2?1:-1;
   islandBases.push({x:cx,y:bodyY,z:islandZ,sx:rowWidth+1.4,sy:isT2?.58:.86,sz:3.05,color:baseMat});
   // A full-width baggage belt is the defining shape missing from the old
   // individual counter boxes. Metal rollers stay visible at its public edge.
   beltSurfaces.push({x:cx,y:y+(isT2?.69:.94),z:islandZ-approach*1.9,sx:rowWidth+.5,sy:isT2?.14:.18,sz:1.05,color:'#252b2a'});
   for(let rx=-rowWidth/2+.42;rx<=rowWidth/2-.42;rx+=.62)beltRollers.push({x:cx+rx,y:y+(isT2?.79:1.045),z:islandZ-approach*1.9,sx:.075,sy:.055,sz:.9,color:'#a4aaa5'});
   for(let post=0;post<counterCount+1;post++){
    const px=cx+(post-counterCount/2)*Math.min(2.3,rowWidth/(counterCount+1)),frontZ=islandZ+approach*4.9;
    posts.push({x:px,y:y+(isT2?.43:.62),z:frontZ,sx:.09,sy:isT2?1:1.24,sz:.09});
    if(post<counterCount)queueRails.push({x:px+Math.min(2.3,rowWidth/(counterCount+1))/2,y:y+(isT2?.57:.69),z:frontZ,sx:Math.min(2.3,rowWidth/(counterCount+1)),sy:.05,sz:.055});
   }
   if(isT2){
    const laneWidth=rowWidth/counterCount,queueNear=islandZ+approach*5.8,queueFar=islandZ+approach*11.6;
    for(let boundary=0;boundary<=counterCount;boundary++){
     const x=cx-rowWidth/2+boundary*laneWidth;
     islandQueuePosts.push({x,y:y+.57,z:queueNear,sx:.09,sy:1.14,sz:.09},{x,y:y+.57,z:queueFar,sx:.09,sy:1.14,sz:.09});
     islandQueueRails.push({x,y:y+.94,z:(queueNear+queueFar)/2,sx:.055,sy:.06,sz:queueFar-queueNear-.2});
    }
    for(let lane=0;lane<counterCount;lane+=2)islandQueueRails.push({x:cx-rowWidth/2+(lane+.5)*laneWidth,y:y+.94,z:queueFar,sx:laneWidth-.18,sy:.06,sz:.055});
   }
  }
  const headerWidth=profile==='T2'?6.6:Math.max(7.5,Math.min(9.5,rowWidth*.5));
  sign(parent,`CHECK-IN  ${String(first).padStart(2,'0')}–${String(last).padStart(2,'0')}  報到`,cx,y+4.1,rowZ-6,headerWidth,g%2?'#aa9160':'#718b88',0,profile==='T2'?1.1:1.55);
  if(profile==='T2')for(const side of [-1,1])headerSupports.push({x:cx+side*(headerWidth/2-.18),y:y+3.38,z:rowZ-6,sx:.09,sy:1.45,sz:.09});
  for(let j=0;j<counterCount;j++){
   const x=cx+(j-(counterCount-1)/2)*3.45,number=first+j;
   const compact=profile==='T2';bases.push({x,y:y+(compact?.4:.72),z:rowZ,sx:3.05,sy:compact?.64:1.05,sz:1.24,color:profile==='T2'?'#777f7c':'#aab1ae'});tops.push({x,y:y+(compact?.75:1.31),z:rowZ,sx:3.22,sy:compact?.12:.14,sz:1.42,color:profile==='T2'?'#d2d4cc':'#e8e9e3'});
   const approach=profile==='T2'?1:-1;stands.push({x:x+.9,y:y+(compact?1.08:1.8),z:rowZ+approach*.2,sx:.13,sy:compact?.5:.82,sz:.12});monitors.push({x:x+.9,y:y+(compact?1.56:2.23),z:rowZ+approach*.2,sx:compact?.72:.82,sy:compact?.48:.63,sz:.12});
   if(profile==='T2')counterNumberSign(parent,String(number).padStart(2,'0'),x,y+3.27,rowZ-3.2,1.56,1.12);
   if(!profile&&j%2===0)bagBelts.push({x:x-1.18,y:y+.57,z:rowZ+.13,sx:.52,sy:.34,sz:.9});
  }
  if(!profile)aislePosts(posts,cx,y,rowZ-5.3,counterCount+1,Math.min(2.3,rowWidth/(counterCount+1)));
 }
 batch(parent,profile==='T2'?t2Island:profile==='T1'?t1Island:counter,islandBases);batch(parent,islandTrim,beltSurfaces);batch(parent,beltRoller,beltRollers);batch(parent,counter,bases);batch(parent,counterTop,tops);batch(parent,steel,stands);batch(parent,screen,monitors);batch(parent,belt,bagBelts);batch(parent,queuePost,posts);batch(parent,steel,queueRails);batch(parent,queuePost,islandQueuePosts);batch(parent,steel,islandQueueRails);batch(parent,steel,headerSupports);
 const kioskCount=Math.max(8,islands*3),bankCount=Math.ceil(kioskCount/2);for(let i=0;i<kioskCount;i++){const bank=i<bankCount?0:1,index=bank===0?i:i-bankCount,localCount=bank===0?bankCount:kioskCount-bankCount,side=bank===0?-1:1,x=b.x+side*b.width*.29+(index-(localCount-1)/2)*3.2,kioskZ=z-17;kiosks.push({x,y:y+1.05,z:kioskZ,sx:1.2,sy:2.1,sz:.85});kioskScreens.push({x,y:y+1.3,z:kioskZ-.45,sx:.62,sy:.58,sz:.055});}
 batch(parent,counter,kiosks);batch(parent,screen,kioskScreens);
 sign(parent,'DEPARTURES  出境',b.x,y+5.4,z-23,Math.min(b.width*.055,10),'#aa9160');
}
function securityHall(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number,laneCount=6,accent='#e1b449',label='SECURITY  安檢'){
 const belts:Item[]=[],scanBodies:Item[]=[],legs:Item[]=[],tops:Item[]=[],queue:Item[]=[],screens:Item[]=[];const spacing=Math.min(5.5,b.width*.62/laneCount),x0=b.x-(laneCount-1)*spacing/2;
 for(let i=0;i<laneCount;i++){const x=x0+i*spacing;belts.push({x,y:y+.58,z:z+2,sx:2.1,sy:.72,sz:6.8});scanBodies.push({x:x+1.18,y:y+1.1,z:z+1.8,sx:.45,sy:1.3,sz:1.8});
  for(const side of [-1,1])legs.push({x:x+side*1.3,y:y+1.15,z:z-3.2,sx:.15,sy:2.3,sz:.18});tops.push({x,y:y+2.3,z:z-3.2,sx:2.75,sy:.18,sz:.18});screens.push({x,y:y+3.1,z:z-5.2,sx:2.6,sy:1.35,sz:.22});
  aislePosts(queue,x,y,z-9,4,1.5);
 }
 batch(parent,belt,belts);batch(parent,screen,scanBodies);batch(parent,steel,legs);batch(parent,steel,tops);batch(parent,screen,screens);batch(parent,queuePost,queue);
  const signWidth=label.startsWith('TRANSFER')?Math.min(21,b.width*.17):Math.min(13,b.width*.12);
  sign(parent,label,b.x,y+5.2,z-13,signWidth,accent);
}
function immigrationHall(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number,booths=9,centerX=b.x,arrivalQueue=false,label='IMMIGRATION  證照查驗'){
 const bases:Item[]=[],screens:Item[]=[],glassPanels:Item[]=[],posts:Item[]=[],egates:Item[]=[],queueRails:Item[]=[],queuePosts:Item[]=[],immigrationGlass=new THREE.MeshPhysicalMaterial({color:'#b8cbc7',roughness:.2,metalness:.035,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide});immigrationGlass.forceSinglePass=true;const gap=Math.min(5.2,b.width*.62/booths),start=centerX-(booths-1)*gap/2;
 for(let i=0;i<booths;i++){const x=start+i*gap;bases.push({x,y:y+.63,z,sx:3.5,sy:1.2,sz:1.35});screens.push({x,y:y+1.65,z:z-.35,sx:.75,sy:.52,sz:.12});glassPanels.push({x,y:y+2.25,z:z+1.05,sx:3.3,sy:2.7,sz:.1});aislePosts(posts,x,y,z+4,3,1.4);}
 for(let i=0;i<4;i++)egates.push({x:centerX+b.width*.26+i*2.6,y:y+1.05,z:z+12,sx:1.6,sy:2.1,sz:2.5});
 if(arrivalQueue){
  // Low belt barriers guide arrivals through the 3F passport-control queue,
  // leaving a wider clear cross-aisle before the post-control art gallery.
  const laneCount=8,laneSpacing=Math.min(5.55,b.width*.29/(laneCount/2)),laneStart=centerX-(laneCount-1)*laneSpacing/2;
  for(let lane=0;lane<laneCount;lane++){
   const laneX=laneStart+lane*laneSpacing,half=Math.min(2.25,(laneSpacing-.42)/2),near=z+5.1,far=z+12.6;
   for(const side of [-1,1]){
    const x=laneX+side*half;queuePosts.push({x,y:y+.57,z:near,sx:.095,sy:1.14,sz:.095},{x,y:y+.57,z:far,sx:.095,sy:1.14,sz:.095});
    queueRails.push({x,y:y+.94,z:(near+far)/2,sx:.045,sy:.065,sz:far-near-.25});
   }
   if(lane%2===1){
    for(const endZ of [near,far])queueRails.push({x:laneX,y:y+.94,z:endZ,sx:laneSpacing-.35,sy:.065,sz:.045});
   }
  }
  sign(parent,'PASSPORT CONTROL  入境證照查驗',centerX,y+5.75,z+8.5,Math.min(20,b.width*.16),'#708f8b',0,1.15);
  sign(parent,'E-GATES  自動查驗',b.x+b.width*.27,y+4.5,z+16,11,'#63a5a3',0,.9);
 }
 batch(parent,counter,bases);batch(parent,screen,screens);batch(parent,immigrationGlass,glassPanels);batch(parent,queuePost,posts);batch(parent,queuePost,queuePosts);batch(parent,steel,queueRails);batch(parent,accentBlue,egates);
 sign(parent,arrivalQueue?'IMMIGRATION  證照查驗':label,centerX,y+4.7,z-4,Math.min(16,b.width*.12),'#719da0');
}
/** T2 departure passport control is a full processing bank between check-in and security. */
function terminal2DepartureImmigration(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number){
 immigrationHall(parent,b,y,z,12,b.x,false,'DEPARTURE IMMIGRATION  出境證照查驗');
 const posts:Item[]=[],rails:Item[]=[],laneCount=10,laneSpacing=4.8,firstX=b.x-(laneCount-1)*laneSpacing/2,near=z-13,far=z-5;
 // Paired low belt rails form distinct walk-up lanes without closing the
 // cross-aisles at the entrance or the booth frontage.
 for(let lane=0;lane<laneCount;lane++){
  const center=firstX+lane*laneSpacing,half=laneSpacing/2-.18;
  for(const side of [-1,1]){
   const x=center+side*half;
   posts.push({x,y:y+.57,z:near,sx:.09,sy:1.14,sz:.09},{x,y:y+.57,z:far,sx:.09,sy:1.14,sz:.09});
   rails.push({x,y:y+.92,z:(near+far)/2,sx:.055,sy:.06,sz:far-near-.2});
  }
  if(lane%2===1)rails.push({x:center,y:y+.92,z:far,sx:laneSpacing-.34,sy:.06,sz:.055});
 }
 batch(parent,queuePost,posts);batch(parent,steel,rails);
}
function roundedRect(path:THREE.Shape|THREE.Path,w:number,h:number,r:number){const x=w/2,y=h/2;path.moveTo(-x+r,-y);path.lineTo(x-r,-y);path.quadraticCurveTo(x,-y,x,-y+r);path.lineTo(x,y-r);path.quadraticCurveTo(x,y,x-r,y);path.lineTo(-x+r,y);path.quadraticCurveTo(-x,y,-x,y-r);path.lineTo(-x,-y+r);path.quadraticCurveTo(-x,-y,-x+r,-y);}
function roundedTerminalPrism(width:number,length:number,radius:number,height:number){const outline=new THREE.Shape();roundedRect(outline,width,length,radius);const geometry=new THREE.ExtrudeGeometry(outline,{depth:height,bevelEnabled:true,bevelSegments:2,bevelSize:.055,bevelThickness:.055,curveSegments:8});geometry.rotateX(-Math.PI/2);return geometry;}
function carouselLoopGeometry(width:number,depth:number,radius:number,beltWidth:number,extrusion:number){
 const shape=new THREE.Shape();roundedRect(shape,width,depth,radius);
 const inner=new THREE.Path();roundedRect(inner,width-beltWidth*2,depth-beltWidth*2,Math.max(.85,radius-beltWidth*.72));shape.holes.push(inner);
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:extrusion,bevelEnabled:true,bevelThickness:.035,bevelSize:.025,bevelSegments:1,curveSegments:14});geometry.rotateX(-Math.PI/2);return geometry;
}
function baggageClaim(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number,count=4,axis:'x'|'z'='x',centerX=b.x,startNumber=1){
 const cases:Item[]=[],caseColors:THREE.ColorRepresentation[]=['#546f79','#a34b3c','#b5aa93','#4c5660'];
 const t1Loops=[
  {width:16.6,depth:7.2,radius:2.2,z:-1.1},{width:13.1,depth:7.7,radius:2.4,z:.65},
  {width:18.2,depth:7.5,radius:2.2,z:-.25},{width:16.2,depth:7.7,radius:2.4,z:.3},
  {width:12.8,depth:7.0,radius:2.1,z:-.65},{width:17.4,depth:7.4,radius:2.25,z:.8}
 ];
 const railMaterial=material('#89918b',.42,.26),rubber=material('#242a28',.79,.015),bagMaterial=material('#33444a',.72,.015),alongDepth=axis==='z',spacing=alongDepth?Math.min(32.5,b.depth/(count+2.8)):Math.min(23.2,b.width/(count+.9)),x0=alongDepth?centerX:centerX-(count-1)*spacing/2,z0=alongDepth?z-(count-1)*spacing/2:z;
 for(let i=0;i<count;i++){
  const loop=t1Loops[i%t1Loops.length],x=alongDepth?centerX:x0+i*spacing,loopZ=z0+(alongDepth?i*spacing:0)+loop.z,railGeometry=carouselLoopGeometry(loop.width,loop.depth,loop.radius,1.08,.38),beltGeometry=carouselLoopGeometry(loop.width-.12,loop.depth-.12,loop.radius-.06,1.04,.055);
  const rail=new THREE.Mesh(railGeometry,railMaterial);rail.position.set(x,y+.28,loopZ);rail.castShadow=false;rail.receiveShadow=true;parent.add(rail);
  const beltSurface=new THREE.Mesh(beltGeometry,rubber);beltSurface.position.set(x,y+.66,loopZ);beltSurface.castShadow=false;beltSurface.receiveShadow=false;parent.add(beltSurface);
  const display=box(parent,7,.72,.14,x,y+1.05,loopZ-loop.depth/2-1.15,screen);display.castShadow=false;
  sign(parent,`BAGGAGE  ${String(startNumber+i).padStart(2,'0')}  行李`,x,y+2.35,loopZ-loop.depth/2-3.3,9.2,'#6eaeb5');
  for(let j=0;j<5;j++){
   const angle=(j/5)*Math.PI*2+.24,rx=(loop.width/2-1.5)*Math.cos(angle),rz=(loop.depth/2-1.45)*Math.sin(angle);
   cases.push({x:x+rx,y:y+.99,z:loopZ+rz,sx:.76+(j%2)*.1,sy:.72+(j%3)*.06,sz:.62,color:caseColors[(i+j)%caseColors.length]});
  }
 }
 batch(parent,bagMaterial,cases);
}
function customsHall(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number){
 const barriers:Item[]=[],counters:Item[]=[],posts:Item[]=[];for(let i=0;i<6;i++){const x=b.x+(i-2.5)*5.2;counters.push({x,y:y+.72,z,sx:4.2,sy:1.35,sz:1.1});barriers.push({x:x+2.25,y:y+1.35,z:z+2.3,sx:.14,sy:2.7,sz:.14});aislePosts(posts,x,y,z+5.6,3,1.6);}
 batch(parent,accentRed,counters);batch(parent,steel,barriers);batch(parent,queuePost,posts);sign(parent,'CUSTOMS  海關',b.x,y+4.4,z-3,12,'#b6985c');
}
function shops(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number,count=7,theme:'retail'|'food'|'taiwan'='retail'){
 const back:Item[]=[],windows:Item[]=[],ledges:Item[]=[],tops:Item[]=[],lights:Item[]=[],labels=['DUTY FREE','CAFE','LOCAL GIFTS','BOOKS','TEA','DINING','TRAVEL'];const palette=theme==='taiwan'?['#9f352c','#be5d2f','#d39d48']:theme==='food'?['#b4773d','#d59b4a','#87604b']:['#326b77','#6f8379','#b18a51'];
 const span=b.width*.76,start=b.x-span/2,spacing=span/count,w=Math.min(15,spacing*.78),depth=5.2;
 for(let i=0;i<count;i++){const x=start+(i+.5)*spacing,color=palette[i%palette.length],label=theme==='taiwan'?['TEA HOUSE','LOCAL MARKET','TAIWAN GOODS'][i%3]:theme==='food'?['CAFE','NOODLES','DINING','BAKERY'][i%4]:labels[i%labels.length];
  back.push({x,y:y+1.8,z,sx:w,sy:3.6,sz:.42,color});windows.push({x,y:y+1.55,z:z+depth*.28,sx:w*.86,sy:2.4,sz:.12});ledges.push({x,y:y+.82,z:z+depth*.58,sx:w*.92,sy:.26,sz:.72});tops.push({x,y:y+1.72,z:z+depth*.48,sx:w*.9,sy:1.25,sz:.3,color:'#d7d4ca'});lights.push({x,y:y+3.72,z:z+depth*.4,sx:w*.8,sy:.12,sz:.24});
  sign(parent,label,x,y+3.18,z+depth*.52,w*.94,theme==='taiwan'?'#e9c26b':color as string);
 }
 batch(parent,warmWood,back);batch(parent,shopGlass,windows);batch(parent,counter,ledges);batch(parent,shopGlass,tops);batch(parent,light,lights);
}
function seating(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number,rows=4,perRow=10,warm=false){
 const seats:Item[]=[],backs:Item[]=[],legs:Item[]=[],tables:Item[]=[],mat=warm?seatWarm:seatDark;const spacing=Math.min(3.1,b.width*.48/perRow),start=b.x-(perRow-1)*spacing/2;
 for(let row=0;row<rows;row++){const rz=z+(row-(rows-1)/2)*3.5;for(let i=0;i<perRow;i++){const x=start+i*spacing;seats.push({x,y:y+.52,z:rz,sx:1.55,sy:.2,sz:.74});backs.push({x,y:y+1.15,z:rz-.27,sx:1.55,sy:1.05,sz:.16,color:warm?'#d29649':'#617b80'});legs.push({x,y:y+.28,z:rz,sx:.14,sy:.52,sz:.14});if(i%4===0)tables.push({x:x+1.1,y:y+1.05,z:rz+1.3,sx:.62,sy:.7,sz:.62});}}
 batch(parent,mat,seats);batch(parent,mat,backs);batch(parent,steel,legs);batch(parent,steel,tables);
}
function flightBoards(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number,scale=1){
 for(const side of [-1,1]){
  const x=b.x+side*b.width*.36,centerY=y+5*scale,width=16*scale,height=5*scale,depth=.45*scale;
  box(parent,width+.32*scale,height+.26*scale,.12*scale,x,centerY,z,steel);
  box(parent,width,height,depth,x,centerY,z,screen);
  sign(parent,'FLIGHT INFORMATION  航班資訊',x,centerY+.62*scale,z+depth*.5+.025,15*scale,'#e1b74e',0,.9*scale);
  for(let row=0;row<4;row++)box(parent,11.2*scale,.095*scale,.12*scale,x,centerY+.04*scale-row*.48*scale,z+depth*.5+.035,light);
 }
}
function addTableZone(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number){
 const tables:Item[]=[],chairs:Item[]=[],tops:Item[]=[];for(let row=0;row<4;row++)for(let col=0;col<7;col++){const x=b.x+(col-3)*9,rz=z+(row-1.5)*8;tables.push({x,y:y+1.25,z:rz,sx:2.4,sy:.18,sz:1.2});for(const side of [-1,1])chairs.push({x,y:y+.62,z:rz+side*1.7,sx:1.35,sy:.18,sz:.68,color:row%2?'#7b8790':'#b17c43'});tops.push({x,y:y+.7,z:rz,sx:.14,sy:1.05,sz:.14});}
 batch(parent,warmWood,tables);batch(parent,seatDark,chairs);batch(parent,steel,tops);
}
/** T2's 4F café seating follows the side galleries around, never across, the atrium void. */
function terminal2AtriumDining(parent:THREE.Object3D,b:TerminalBounds,y:number,atrium:{x:number;z:number;width:number;depth:number}){
 const tables:Item[]=[],seats:Item[]=[],backs:Item[]=[],supports:Item[]=[],legs:Item[]=[],wingWidth=(b.width-atrium.width)/2-8;
 for(const side of [-1,1]){
  const wingX=atrium.x+side*(atrium.width/2+wingWidth/2);
  for(let row=0;row<5;row++){
   const x=wingX+side*wingWidth*.08,z=atrium.z+(row-2)*27;
   tables.push({x,y:y+.43,z,sx:2.5,sy:.1,sz:1.35});supports.push({x,y:y+.22,z,sx:.16,sy:.42,sz:.16});
   for(const end of [-1,1]){
    const chairZ=z+end*1.55;
    seats.push({x,y:y+.2,z:chairZ,sx:1.38,sy:.12,sz:.68});backs.push({x,y:y+.66,z:chairZ-end*.27,sx:1.38,sy:.82,sz:.14});
    for(const foot of [-1,1])legs.push({x:x+foot*.48,y:y+.17,z:chairZ,sx:.07,sy:.34,sz:.07});
   }
  }
 }
 batch(parent,counterTop,tables);batch(parent,steel,supports);batch(parent,seatDark,seats);batch(parent,seatDark,backs);batch(parent,steel,legs);
}
/** A floor-map-listed 4F café/restaurant bay with an open service front and fitted counter. */
function terminal2FourthFloorShop(parent:THREE.Object3D,b:TerminalBounds,y:number,shop:typeof T2_FOURTH_FLOOR_SHOPS[number]){
 const {x,z,frontX}=t2FourthFloorShopCenter(b.x,b.z,b.width,b.depth,shop.side,shop.zRatio),{depth,length,height}=T2_FOURTH_FLOOR_LAYOUT.shop,rotation=-shop.side*Math.PI/2,floorY=y-.24;
 const trim=material(shop.accent,.44,.14),stone=material('#d6d2c8',.78,.025),glass=new THREE.MeshPhysicalMaterial({color:'#d8e3df',roughness:.2,metalness:.045,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide}),floorMat=material('#b9b8ac',.46,.025),equipment=material('#737b75',.45,.2);
 const counterX=frontX+shop.side*1.55;
 box(parent,length,height,.34,x+shop.side*(depth*.39),floorY+height/2,z,stone,rotation);
 for(const end of [-1,1])box(parent,depth,height,.28,x,floorY+height/2,z+end*(length/2-.14),stone);
 box(parent,depth-.4,.08,length-.7,x,floorY+.05,z,floorMat);
 // A low open counter makes the concourse-facing edge legible as an operating shop.
 box(parent,length*.72,1.08,.92,counterX,floorY+.62,z,counterTop,rotation);
 box(parent,length*.72,.12,1.02,counterX-shop.side*.12,floorY+1.23,z,counterTop,rotation);
 for(const offset of [-length*.24,0,length*.24]){
  box(parent,3.1,1.5,.12,x+shop.side*2.35,floorY+2.45,z+offset,glass,rotation);
  box(parent,2.6,2.15,.44,x+shop.side*5.7,floorY+1.25,z+offset,shop.kind==='burger'?warmWood:equipment,rotation);
 }
 box(parent,length*.88,.28,.52,frontX+shop.side*.42,floorY+height-.2,z,trim,rotation);
 sign(parent,shop.name,x+shop.side*.58,floorY+height+.52,z,Math.min(length-1,shop.name.length*.63),shop.accent,rotation,1.18);
 for(let i=-1;i<=1;i++){
  box(parent,4.2,.1,.18,frontX+shop.side*1.05,floorY+2.1,z+i*4.3,light,rotation);
  box(parent,3.1,.08,.35,x+shop.side*5.2,floorY+2.95,z+i*3.8,shop.kind==='dining'?counterTop:trim,rotation);
 }
 // Menu boards sit above each service opening; they read as individual outlets at hall scale.
 for(let i=-1;i<=1;i++)sign(parent,shop.kind==='burger'?'BURGER  套餐':shop.kind==='dining'?'MENU  餐點':'COFFEE  咖啡',x+shop.side*2.5,floorY+2.8,z+i*3.8,2.7,shop.accent,rotation,.56);
}
const terminal2LoungeCarpetCache=new Map<boolean,THREE.Material>();
function terminal2LoungeCarpet(plaza:boolean){
 const cached=terminal2LoungeCarpetCache.get(plaza);if(cached)return cached;
 const texture=canvasTexture(512,512,ctx=>{
  const rand=seeded(plaza?40203:40201);
  const base=plaza?'#91908a':'#9ca18f';ctx.fillStyle=base;ctx.fillRect(0,0,512,512);
  for(let y=0;y<512;y+=8){ctx.fillStyle=y%16===0?'rgba(238,231,210,.14)':'rgba(32,42,39,.12)';ctx.fillRect(0,y,512,2);}
  for(let x=0;x<512;x+=8){ctx.fillStyle=x%16===0?'rgba(245,238,218,.10)':'rgba(28,38,36,.1)';ctx.fillRect(x,0,2,512);}
  ctx.globalAlpha=.28;for(let row=0;row<16;row++)for(let col=0;col<16;col++){
   const xx=col*32+(row%2)*16,yy=row*32;ctx.fillStyle=(row+col)%5===0?(plaza?'#957f77':'#b4975c'):(plaza?'#65716e':'#596a62');ctx.fillRect(xx+5,yy+5,6,6);
  }ctx.globalAlpha=1;
  for(let i=0;i<6200;i++){const shade=plaza?92+Math.floor(rand()*54):87+Math.floor(rand()*55),alpha=.025+rand()*.045;ctx.fillStyle=`rgba(${shade},${shade+1},${shade-2},${alpha})`;ctx.fillRect(rand()*512,rand()*512,.7+rand()*1.1,.7+rand()*1.1);}
 });texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(5,4);texture.anisotropy=8;
 const carpet=new THREE.MeshStandardMaterial({color:'#fff',map:texture,roughness:.96,metalness:0});carpet.userData.worldUV=1/2.6;terminal2LoungeCarpetCache.set(plaza,carpet);return carpet;
}
/** Separate glazed lounge footprints on the T2 4F plan, each with a reception and seating clusters. */
function terminal2FourthFloorLounge(parent:THREE.Object3D,b:TerminalBounds,y:number,index:number){
 const lounge=T2_FOURTH_FLOOR_LOUNGES[index],{x,z}=t2FourthFloorLoungeCenter(b.x,b.z,b.width,b.depth,lounge.side,lounge.zRatio),{width,depth,height}=T2_FOURTH_FLOOR_LAYOUT.lounge,side=lounge.side,frontX=x-side*(width/2-.2),deckY=y-.24,wood=material('#806547',.62,.08),woodDisplay=material('#ffffff',.72,.035),stone=material('#d6d4ca',.74,.025),glass=new THREE.MeshPhysicalMaterial({color:'#c7d9d5',roughness:.2,metalness:.075,transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide}),accent=material(lounge.accent,.45,.18),fabric=material('#ffffff',.78,.025),armMaterial=material('#ffffff',.68,.02),carpet=terminal2LoungeCarpet(index===3);
 // Three opaque sides and segmented clear frontage leave the public-map entrance legible.
 box(parent,.36,height,depth,x+side*(width/2-.18),deckY+height/2,z,stone);
 for(const end of [-1,1])box(parent,width,height,.32,x,deckY+height/2,z+end*(depth/2-.16),stone);
 for(const end of [-1,1])box(parent,.12,height*.76,depth*.31,frontX,deckY+height*.38,z+end*depth*.34,glass);
 for(const end of [-1,1])box(parent,.16,height*.88,.16,frontX,deckY+height*.49,z+end*(depth*.47),steel);
 const rug=new THREE.Mesh(new THREE.PlaneGeometry(width-.6,depth-.6),carpet);rug.rotation.x=-Math.PI/2;rug.position.set(x,deckY+.045,z);rug.receiveShadow=true;rug.castShadow=false;parent.add(rug);
 box(parent,8,1.15,1.15,frontX+side*3.8,deckY+.62,z,stone);
 box(parent,8.2,.16,1.3,frontX+side*3.8,deckY+1.27,z,wood);
 sign(parent,lounge.name,x-side*(width/2+.28),deckY+height-.2,z,Math.min(15,lounge.name.length*.56),lounge.accent,-side*Math.PI/2,1.05);
 sign(parent,lounge.operator.toUpperCase(),x+side*(width/2-.55),deckY+3.08,z,Math.min(15,lounge.operator.length*.58),lounge.accent,-side*Math.PI/2,.86);
 const tables:Item[]=[],tableStems:Item[]=[],tableFeet:Item[]=[],seats:Item[]=[],backs:Item[]=[],arms:Item[]=[],chairLegs:Item[]=[],screens:Item[]=[],lamps:Item[]=[],woodSlats:Item[]=[],ceilingLights:Item[]=[];
 for(let cluster=0;cluster<4;cluster++){
  const cx=x+side*(-4.5+cluster*3),cz=z+(cluster-1.5)*4.8;
  tables.push({x:cx,y:deckY+.78,z:cz,sx:1.45,sy:.1,sz:.86,color:'#d7d1c3'});tableStems.push({x:cx,y:deckY+.43,z:cz,sx:.1,sy:.66,sz:.1});tableFeet.push({x:cx,y:deckY+.1,z:cz,sx:.62,sy:.1,sz:.48});
  for(const end of [-1,1]){
   const sx=cx+side*end*1.24;seats.push({x:sx,y:deckY+.46,z:cz,sx:1.35,sy:.18,sz:.72,color:index===3?'#667c83':'#788774'});backs.push({x:sx,y:deckY+.98,z:cz-.27,sx:1.35,sy:.78,sz:.14,color:index===3?'#71858a':'#899383'});
   for(const armSide of [-1,1])arms.push({x:sx+armSide*.62,y:deckY+.68,z:cz,sx:.14,sy:.42,sz:.72,color:'#806c50'});
   for(const legX of [-.48,.48])for(const legZ of [-.24,.24])chairLegs.push({x:sx+legX,y:deckY+.19,z:cz+legZ,sx:.065,sy:.38,sz:.065,color:'#4e5b59'});
  }
  screens.push({x:cx+side*3.3,y:deckY+1.12,z:cz,sx:.12,sy:1.72,sz:1.72,color:'#ad9975'});
  lamps.push({x:cx,y:deckY+height+.46,z:cz,sx:1.05,sy:.08,sz:.72,color:'#f0dfb7'});
 }
 // A quiet seating row follows the outside wall, while the central pods retain an open route.
 for(let row=0;row<5;row++){
  const seatZ=z+(row-2)*3.35,seatX=x+side*9.6;
  seats.push({x:seatX,y:deckY+.46,z:seatZ,sx:1.38,sy:.18,sz:.72,color:index===3?'#718087':'#8c9787'});
  backs.push({x:seatX+side*.5,y:deckY+.99,z:seatZ,sx:.14,sy:.84,sz:1.3,color:index===3?'#7e8d91':'#929a88'});
  for(const armSide of [-1,1])arms.push({x:seatX+side*.5,y:deckY+.68,z:seatZ+armSide*.58,sx:.82,sy:.42,sz:.12,color:'#a58c67'});
  for(const legZ of [-.24,.24])chairLegs.push({x:seatX,y:deckY+.19,z:seatZ+legZ,sx:.065,sy:.38,sz:.065,color:'#4e5b59'});
 }
 const receptionX=x+side*(width/2-5.4),receptionZ=z-depth*.32;
 box(parent,7.8,1.1,1.1,receptionX,deckY+.6,receptionZ,stone,Math.PI/2);
 box(parent,8,.16,1.28,receptionX,deckY+1.22,receptionZ,wood);
 sign(parent,'WELCOME  接待',receptionX,deckY+2.05,receptionZ,5.6,lounge.accent,0,.72);
 for(let slat=0;slat<13;slat++)woodSlats.push({x:x+side*(width/2-.42),y:deckY+1.45,z:z+(slat-6)*1.42,sx:.08,sy:2.75,sz:.12,color:slat%4===0?'#947b55':'#b49b70'});
 for(let strip=0;strip<3;strip++)ceilingLights.push({x:x+side*(strip-1)*4.5,y:deckY+height+.75,z,sx:.16,sy:.08,sz:depth*.68,color:'#fff1d1'});
 batch(parent,counterTop,tables);batch(parent,steel,tableStems);batch(parent,steel,tableFeet);batchRounded(parent,fabric,seats,true);batchRounded(parent,fabric,backs);batch(parent,armMaterial,arms);batch(parent,steel,chairLegs);batch(parent,woodDisplay,screens);batch(parent,woodDisplay,woodSlats);batch(parent,light,lamps);
 batch(parent,ceilingStrip,ceilingLights);
 box(parent,width*.62,.12,.48,x+side*3.2,deckY+2.52,z-depth*.36,accent);
 box(parent,width*.62,.72,.32,x+side*3.2,deckY+2.12,z-depth*.36,stone);
}
/** T2's south 4F public food court: pale hex tile, clustered tables and the
 * distinctive suspended honeycomb light canopy shown in recent visitor photos. */
function terminal2FoodCourt(parent:THREE.Object3D,b:TerminalBounds,y:number){
 const zoneWidth=b.width*T2_FOURTH_FLOOR_LAYOUT.foodCourt.widthRatio,zoneDepth=b.depth*T2_FOURTH_FLOOR_LAYOUT.foodCourt.depthRatio,zoneX=b.x,zoneZ=b.z+b.depth*T2_FOURTH_FLOOR_LAYOUT.foodCourt.zRatio,deckY=y-.24;
 const hexFloor=canvasTexture(512,512,ctx=>{
  ctx.fillStyle='#e2e2da';ctx.fillRect(0,0,512,512);
  // Choose the lattice dimensions so the hex pattern meets cleanly at the
  // canvas edges instead of exposing a repeating square seam across the hall.
  const radius=11.38,stepX=radius*1.5,stepY=radius*Math.sqrt(3);
  for(let row=-2;row<512/stepY+2;row++)for(let col=-2;col<512/stepX+2;col++){
   const cx=col*stepX+(row%2)*stepX/2,cy=row*stepY,shade=(row+col)%4===0?'#f5f3ea':(row+col)%3===0?'#d6d8d1':'#e9e8e0';
   ctx.beginPath();for(let corner=0;corner<6;corner++){const a=corner*Math.PI/3;const px=cx+radius*Math.cos(a),py=cy+radius*Math.sin(a);if(corner===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fillStyle=shade;ctx.fill();ctx.strokeStyle='#b9beb8';ctx.lineWidth=2.2;ctx.stroke();
  }
 });hexFloor.wrapS=hexFloor.wrapT=THREE.RepeatWrapping;hexFloor.anisotropy=8;
 const floorMat=new THREE.MeshPhysicalMaterial({color:'#faf9f2',map:hexFloor,roughness:.3,metalness:.015,clearcoat:.26,clearcoatRoughness:.24,emissive:'#66665c',emissiveIntensity:.2});floorMat.userData.worldUV=1/11.3;floorMat.userData.indoorReflection=1;floorMat.userData.reflectionIntensity=.34;floorMat.userData.reflectionMap=interiorReflection('T2');
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(zoneWidth,zoneDepth),floorMat);floor.rotation.x=-Math.PI/2;floor.position.set(zoneX,deckY+.022,zoneZ);floor.receiveShadow=true;floor.castShadow=false;parent.add(floor);

 const tables:Item[]=[],tableStems:Item[]=[],tableFeet:Item[]=[],seats:Item[]=[],backs:Item[]=[],legs:Item[]=[],seatPalette=['#e8b83e','#728e8e','#485c61','#d7d9d3'],cols=7,rows=4,tableSpacing=12.4,rowSpacing=14,startX=zoneX-(cols-1)*tableSpacing/2;
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const x=startX+col*tableSpacing,z=zoneZ+(row-(rows-1)/2)*rowSpacing;
  tables.push({x,y:deckY+.79,z,sx:1.9,sy:.12,sz:1.35,color:row%3===0?'#e3d5b7':'#f1eee3'});
  tableStems.push({x,y:deckY+.42,z,sx:.12,sy:.66,sz:.12,color:'#7b8581'});tableFeet.push({x,y:deckY+.08,z,sx:.76,sy:.1,sz:.62,color:'#7b8581'});
  for(const side of [-1,1])for(const lane of [-1,1]){
   const sx=x+side*1.38,sz=z+lane*.39,seatY=deckY+.47;
   seats.push({x:sx,y:seatY,z:sz,sx:.76,sy:.12,sz:.72,color:seatPalette[(row+col+lane+2)%seatPalette.length]});
   backs.push({x:sx,y:seatY+.43,z:sz-lane*.29,sx:.76,sy:.78,sz:.13,color:seatPalette[(row+col+lane+2)%seatPalette.length]});
   legs.push({x:sx,y:deckY+.2,z:sz,sx:.07,sy:.4,sz:.07,color:'#525b5b'});
  }
 }
 batch(parent,foodCourtIvory,tables);batch(parent,steel,tableStems);batch(parent,steel,tableFeet);batch(parent,foodCourtSeat,seats);batch(parent,foodCourtSeat,backs);batch(parent,steel,legs);

 const whiteBeams:THREE.Matrix4[]=[],goldBeams:THREE.Matrix4[]=[],tealBeams:THREE.Matrix4[]=[],whitePanels:THREE.Matrix4[]=[],goldPanels:THREE.Matrix4[]=[],tealPanels:THREE.Matrix4[]=[],hangers:Item[]=[],beamGeom=new THREE.CylinderGeometry(.5,.5,1,7,1,false),dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),from=new THREE.Vector3(),to=new THREE.Vector3(),direction=new THREE.Vector3();
 const addBeam=(a:THREE.Vector3,c:THREE.Vector3,radius:number,target:THREE.Matrix4[])=>{from.copy(a);to.copy(c);direction.subVectors(to,from);dummy.position.copy(from).add(to).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,direction.clone().normalize());dummy.scale.set(radius*2,direction.length(),radius*2);dummy.updateMatrix();target.push(dummy.matrix.clone());};
 const colors=[whiteBeams,whiteBeams,goldBeams,whiteBeams,tealBeams,goldBeams],ceilingY=23.08,colsHex=6,rowsHex=3;
 for(let row=0;row<rowsHex;row++)for(let col=0;col<colsHex;col++){
  const x=zoneX+(col-(colsHex-1)/2)*13.8+(row%2)*1.6,z=zoneZ+(row-(rowsHex-1)/2)*12.8,yRing=22.05+((row+col)%3)*.17,radius=2.55+((row*3+col)%3)*.3,beamSet=colors[(row*5+col*3)%colors.length],vertices:THREE.Vector3[]=[];
  for(let corner=0;corner<6;corner++){const a=corner*Math.PI/3+Math.PI/6;vertices.push(new THREE.Vector3(x+Math.cos(a)*radius,yRing,z+Math.sin(a)*radius));}
  for(let corner=0;corner<6;corner++)addBeam(vertices[corner],vertices[(corner+1)%6],.13,beamSet);
  const ringColorIndex=beamSet===goldBeams?1:beamSet===tealBeams?2:0,cellOffsets:[number,number][]=[[0,0],[1.4,0],[-1.4,0],[.7,1.212],[-.7,1.212],[.7,-1.212],[-.7,-1.212]];
  for(let cell=0;cell<cellOffsets.length;cell++){
   const [dx,dz]=cellOffsets[cell],panelColor=cell===0?ringColorIndex:cell%2?1:0,panelSet=panelColor===1?goldPanels:panelColor===2?tealPanels:whitePanels;
   dummy.position.set(x+dx,yRing-.18,z+dz);dummy.rotation.set(0,Math.PI/6,0);dummy.scale.set(.86,1,.86);dummy.updateMatrix();panelSet.push(dummy.matrix.clone());
  }
  for(const point of [0,3])hangers.push({x:vertices[point].x,y:(ceilingY+yRing)/2,z:vertices[point].z,sx:.035,sy:ceilingY-yRing,sz:.035});
 }
 const canopyMaterials=[
  new THREE.MeshStandardMaterial({color:'#f2f0e7',emissive:'#8f8669',emissiveIntensity:.26,roughness:.4,metalness:.18}),
  new THREE.MeshStandardMaterial({color:'#e8b541',emissive:'#8f6f1a',emissiveIntensity:.22,roughness:.4,metalness:.16}),
  new THREE.MeshStandardMaterial({color:'#5e8f91',emissive:'#214c4e',emissiveIntensity:.2,roughness:.42,metalness:.16})
 ];
 for(const [index,mat] of canopyMaterials.entries()){const matrices=[whiteBeams,goldBeams,tealBeams][index],mesh=new THREE.InstancedMesh(beamGeom,mat,matrices.length);matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=false;mesh.receiveShadow=false;parent.add(mesh);}
 const panelMaterials=[
  new THREE.MeshStandardMaterial({color:'#f4f1e8',emissive:'#d6c99e',emissiveIntensity:.42,roughness:.56,metalness:.04}),
  new THREE.MeshStandardMaterial({color:'#edc34a',emissive:'#c2952c',emissiveIntensity:.38,roughness:.5,metalness:.035}),
  new THREE.MeshStandardMaterial({color:'#78a09e',emissive:'#4f8580',emissiveIntensity:.28,roughness:.58,metalness:.035})
 ];
 const panelGeometry=new THREE.CylinderGeometry(1,1,.08,6,1,false);
 for(const [index,mat] of panelMaterials.entries()){const matrices=[whitePanels,goldPanels,tealPanels][index],mesh=new THREE.InstancedMesh(panelGeometry,mat,matrices.length);matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=false;mesh.receiveShadow=false;parent.add(mesh);}
 batch(parent,steel,hangers);
 const glow=new THREE.MeshBasicMaterial({color:'#fff4d5',toneMapped:false,side:THREE.DoubleSide}),warmHex=new THREE.MeshBasicMaterial({color:'#f6d36d',toneMapped:false,side:THREE.DoubleSide});
 for(let row=0;row<rowsHex;row++)for(let col=0;col<colsHex;col++)if((row+col)%2===0){const x=zoneX+(col-(colsHex-1)/2)*13.8+(row%2)*1.6,z=zoneZ+(row-(rowsHex-1)/2)*12.8+0.1,shape=new THREE.CircleGeometry(.62,6),lamp=new THREE.Mesh(shape,(row+col)%4===0?warmHex:glow);lamp.rotation.x=-Math.PI/2;lamp.position.set(x,21.96,z);lamp.castShadow=false;parent.add(lamp);}
 // Yellow service-front bands visually tie the food court kiosks to the canopy.
 const fasciaGold:Item[]=[],fasciaIvory:Item[]=[],fasciaZ=zoneZ+zoneDepth/2+2.7;
 for(let i=0;i<5;i++){const x=zoneX+(i-2)*zoneWidth/5.5,item={x,y:y+3.58,z:fasciaZ,sx:Math.min(15,zoneWidth/6),sy:.22,sz:.35};(i%2?fasciaGold:fasciaIvory).push(item);}
 batch(parent,foodCourtGold,fasciaGold);batch(parent,foodCourtIvory,fasciaIvory);
}
function arrivalLobby(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number,boardScale=1,includePlanters=true){
 sign(parent,'ARRIVALS  入境大廳',b.x,y+5,z,13,'#6f9898');seating(parent,b,y,z+22,3,9);flightBoards(parent,b,y,z+45,boardScale);
 // T2's visitor guide places its signature greeting artwork in the arrival
 // hall. Keep that photographed public-art sightline open instead of repeating
 // an unverified row of opaque planter boxes across the main approach.
 if(includePlanters){const planters:Item[]=[];for(let i=0;i<8;i++)planters.push({x:b.x+(i-3.5)*Math.min(16,b.width/9),y:y+.65,z:z+62,sx:2.4,sy:1.3,sz:2.4,color:'#657b63'});batch(parent,material('#77735d',.86),planters);}
}
function addRetailLevel(parent:THREE.Object3D,b:TerminalBounds,y:number,food=false){shops(parent,b,y,b.z-b.depth*.25,food?5:7,food?'food':'retail');shops(parent,b,y,b.z+b.depth*.24,food?5:7,food?'food':'retail');if(food)addTableZone(parent,b,y,b.z);else seating(parent,b,y,b.z,3,10,true);}
function addT2TempleAvenue(parent:THREE.Object3D,b:TerminalBounds,y:number){
 const south={...b,width:b.width*.82,depth:b.depth*.32,z:b.z+b.depth*.31};
 shops(parent,south,y,south.z-south.depth*.32,5,'taiwan');
 shops(parent,south,y,south.z+south.depth*.32,5,'taiwan');
 sign(parent,'TAIWAN TEMPLE AVENUE  臺灣玩藝大街',b.x,y+5.6,south.z,Math.min(58,b.width*.45),'#d6a84d');
 const posts:Item[]=[],lanterns:Item[]=[];for(let i=0;i<8;i++){const x=b.x+(i-3.5)*14;posts.push({x,y:y+2.1,z:south.z,sx:.45,sy:4.2,sz:.45,color:'#943b30'});lanterns.push({x,y:y+4.5,z:south.z,sx:1.8,sy:.55,sz:.85,color:i%2?'#cc6843':'#d6a23f'});}
 batch(parent,accentRed,posts);batch(parent,seatWarm,lanterns);addTableZone(parent,south,y,south.z);
}
function observationDeck(parent:THREE.Object3D,b:TerminalBounds,y:number,side:-1|1){
 const edge=b.z+side*(b.depth/2-1.2),interior=b.z+side*(b.depth*.34),glass=new THREE.MeshPhysicalMaterial({color:'#b6d3d6',roughness:.12,metalness:.08,transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide});
 box(parent,b.width*.68,3.6,.25,b.x,y+2.05,edge,glass);
 for(let x=b.x-b.width*.34;x<=b.x+b.width*.34;x+=5.5)box(parent,.14,3.6,.2,x,y+2.05,edge-.12,steel);
 box(parent,b.width*.68,.16,.34,b.x,y+.85,edge+side*.45,steel);
 const seats:Item[]=[];for(let i=0;i<12;i++){const x=b.x+(i-5.5)*4.15;seats.push({x,y:y+.66,z:interior,sx:2.5,sy:.22,sz:.78,color:i%3?'#465f65':'#718786'});seats.push({x,y:y+1.2,z:interior-side*.24,sx:2.5,sy:1.05,sz:.17,color:'#607b7d'});}
 batch(parent,seatDark,seats);const signWidth=16.5,signZ=interior-side*3;for(const dx of [-1,1])box(parent,.08,1.25,.08,b.x+dx*(signWidth/2-.25),y+3.65,signZ,steel);sign(parent,side<0?'NORTH OBSERVATION DECK  北側觀景台':'SOUTH OBSERVATION DECK  南側觀景台',b.x,y+4.45,signZ,signWidth,'#d9b25c',side>0?Math.PI:0,.95);
}
let t2ConvenienceStone:THREE.Material|undefined;
function convenienceStoreStone(){
 if(t2ConvenienceStone)return t2ConvenienceStone;
 const rand=seeded(250711),texture=canvasTexture(512,192,ctx=>{
  ctx.fillStyle='#5c584f';ctx.fillRect(0,0,512,192);
  for(let row=0;row<4;row++){
   let x=row%2?-22:0,y=row*48;
   while(x<530){const width=34+rand()*42,shade=Math.floor(72+rand()*26);
    ctx.fillStyle=`rgb(${shade},${shade-4},${shade-11})`;ctx.fillRect(x+1,y+1,width-2,46);
    ctx.fillStyle='rgba(235,228,210,.10)';ctx.fillRect(x+3,y+3,width-6,1.2);
    x+=width;
   }
  }
  for(let i=0;i<2100;i++){const v=65+Math.floor(rand()*52);ctx.fillStyle=`rgba(${v},${v},${v-4},${.035+rand()*.08})`;ctx.fillRect(rand()*512,rand()*192,.8+rand()*2,.7+rand()*1.5);}
 });texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(5,1);texture.anisotropy=8;
 t2ConvenienceStone=new THREE.MeshStandardMaterial({color:'#bbb5a9',map:texture,roughness:.9,metalness:.015});return t2ConvenienceStone;
}
/** Small 5F services at T2's separate north and south deck approaches. */
function terminal2DeckAmenities(parent:THREE.Object3D,b:TerminalBounds,y:number,side:-1|1){
 const north=side<0,zoneZ=north?b.z-b.depth*.43:b.z+b.depth*.13,frontZ=zoneZ-side*4.2,backZ=zoneZ+side*4.2;
 const accent=material(north?'#d7372e':'#337d54',.46,.12),cream=material('#e7e3d8',.72,.02),metal=material('#687370',.45,.44),storeFloor=material(north?'#b9b4a5':'#c8c0b0',.36,.025),stone=convenienceStoreStone(),familyTrim=material('#b49a69',.36,.44),glass=new THREE.MeshPhysicalMaterial({color:'#b6ceca',roughness:.2,metalness:.08,transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide}),coldCaseGlass=new THREE.MeshPhysicalMaterial({color:'#d8e1d9',roughness:.17,metalness:.025,transparent:true,opacity:.34,depthWrite:false,side:THREE.DoubleSide});
 const storeX=b.x+(north?-1:1)*b.width*.275,storeW=22.5;
 // Both T2 5F convenience stores open directly to the public concourse. The
 // 7-Eleven has an exposed, dark stone sign band; FamilyMart has a pale shopfront
 // fascia with champagne trim. Keeping the threshold open matches the photo refs.
 box(parent,storeW,3.9,.32,storeX,y+1.95,backZ,cream);
 for(const x of [storeX-storeW/2,storeX+storeW/2])box(parent,.22,3.9,8.4,x,y+1.95,zoneZ,cream);
 box(parent,storeW-1,.05,7.8,storeX,y+.045,zoneZ,storeFloor);
 for(const x of [storeX-storeW/2+.12,storeX+storeW/2-.12])box(parent,.28,3.4,.32,x,y+1.72,frontZ,metal);
 box(parent,storeW,.16,.42,storeX,y+3.04,frontZ,metal);
 if(north){
  box(parent,storeW,1.12,.76,storeX,y+3.55,frontZ,stone);
  box(parent,storeW,.16,.78,storeX,y+2.9,frontZ,accentRed);box(parent,storeW,.16,.78,storeX,y+2.7,frontZ,material('#277947',.5,.08));
 }else{
  box(parent,storeW,1.12,.76,storeX,y+3.55,frontZ,cream);
  box(parent,storeW,.13,.8,storeX,y+2.92,frontZ,familyTrim);box(parent,storeW,.11,.8,storeX,y+2.74,frontZ,accent);
  for(const x of [storeX-storeW/2+.75,storeX+storeW/2-.75])box(parent,.22,2.85,.3,x,y+1.56,frontZ,familyTrim);
 }
 const logoTexture=canvasTexture(1024,192,ctx=>{
  if(north){
   ctx.clearRect(0,0,1024,192);
   // Place the small colored wordmark directly on the photographed dark stone header.
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='italic 900 140px Arial,sans-serif';
   ctx.fillStyle='#e94737';ctx.fillText('7',354,100);ctx.fillStyle='#58a45a';ctx.font='800 94px Arial,sans-serif';ctx.fillText('ELEVEN',625,105);
  }else{
   ctx.fillStyle='#f4f1e8';ctx.fillRect(0,0,1024,192);ctx.fillStyle='#218c55';ctx.fillRect(0,0,1024,18);ctx.fillStyle='#1680ac';ctx.fillRect(0,174,1024,18);
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#1383aa';ctx.font='bold 96px Arial,sans-serif';ctx.fillText('FamilyMart',512,103);
  }
 });logoTexture.anisotropy=8;
 const logoMat=new THREE.MeshBasicMaterial({map:logoTexture,side:THREE.DoubleSide,toneMapped:false,transparent:north}),logo=new THREE.Mesh(new THREE.PlaneGeometry(north?10.5:16,1.62),logoMat);
 logo.position.set(storeX,y+3.62,frontZ-side*.405);logo.rotation.y=side>0?Math.PI:0;logo.castShadow=false;parent.add(logo);
 const shelves:Item[]=[],shelfBacks:Item[]=[],shelfPosts:Item[]=[],shelfPriceRails:Item[]=[],goods:Item[]=[],bottles:Item[]=[],bottleLabels:Item[]=[],bottleCaps:Item[]=[],fridges:Item[]=[],fridgeDoors:Item[]=[],coldProducts:Item[]=[];
 // Build two conventional gondola runs with three level, horizontal shelves.
 // The previous layout stepped each shelf both backward and upward, so it read
 // as floating display ledges rather than stocked convenience-store racks.
 for(let row=0;row<2;row++){
  const x=storeX+(row===0?-1:1)*5.7,z=zoneZ+side*(.72+row*1.62),backZ=z+side*.39;
  shelfBacks.push({x,y:y+1.86,z:backZ,sx:8.42,sy:2.45,sz:.075,color:'#d3d0c7'});
  for(const end of [-1,1])shelfPosts.push({x:x+end*4.22,y:y+1.83,z:z-side*.03,sx:.1,sy:2.55,sz:.12,color:'#8b9692'});
  for(let shelf=0;shelf<3;shelf++){
   const shelfY=y+.68+shelf*.82;shelves.push({x,y:shelfY,z,sx:8.6,sy:.1,sz:.82});
   shelfPriceRails.push({x,y:shelfY-.08,z:z-side*.43,sx:8.42,sy:.075,sz:.08,color:'#46504d'});
   for(let item=0;item<16;item++){
    const itemX=x-4.02+item*.535,frontZ=z-side*.27;
    if(item%3===0){
     const drinkColor=['#b9d0c5','#9aabb7','#e4ce88','#c68b69','#80a2a2','#d4cfc2'][(item+shelf+row)%6];
     bottles.push({x:itemX,y:shelfY+.27,z:frontZ,sx:1,sy:1,sz:1,color:drinkColor});
     bottleLabels.push({x:itemX,y:shelfY+.28,z:frontZ,sx:1,sy:1,sz:1,color:['#278b62','#1d658c','#bd4739','#d09525'][(item+shelf)%4]});
     bottleCaps.push({x:itemX,y:shelfY+.51,z:frontZ,sx:1,sy:1,sz:1,color:'#d7d3c7'});
    }else{
     const packageHeight=.32+((item+shelf)%3)*.055;
     goods.push({x:itemX,y:shelfY+.055+packageHeight/2,z:frontZ,sx:.38+((item+row)%2)*.06,sy:packageHeight,sz:.26,color:['#d7b155','#a84e38','#6a9490','#dddcd2','#9f7147','#758995'][(item+shelf+row)%6]});
    }
   }
  }
 }
 for(let i=0;i<4;i++){
  const x=storeX+(i-1.5)*2.35,z=zoneZ+side*2.2;fridges.push({x,y:y+1.35,z,sx:2.05,sy:2.7,sz:.82,color:'#d5dad4'});fridgeDoors.push({x,y:y+1.37,z:z-side*.43,sx:1.78,sy:2.42,sz:.08,color:'#a9c0bf'});box(parent,.035,2.2,.09,x,y+1.38,z-side*.48,ceilingStrip);
  for(let row=0;row<3;row++)for(let item=0;item<5;item++)coldProducts.push({x:x-.72+item*.36,y:y+.72+row*.62,z:z+side*.32,sx:.22,sy:.34,sz:.16,color:['#d6b45e','#b8533e','#709a91','#e2ded2','#577d9a'][(item+row+i)%5]});
 }
 const drinkBottleGeometry=new THREE.CylinderGeometry(.125,.14,.42,10),drinkLabelGeometry=new THREE.CylinderGeometry(.13,.13,.14,10),drinkCapGeometry=new THREE.CylinderGeometry(.078,.078,.07,8),packagedGoods=material('#fff8ea',.7,.015),bottleBody=new THREE.MeshStandardMaterial({color:'#dce8df',roughness:.24,metalness:.015,transparent:true,opacity:.84}),bottleLabel=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.68,metalness:.01}),bottleCap=new THREE.MeshStandardMaterial({color:'#ece5d3',roughness:.48,metalness:.02});
 batch(parent,cream,shelfBacks);batch(parent,metal,shelfPosts);batch(parent,screen,shelfPriceRails);batch(parent,metal,shelves);batch(parent,packagedGoods,goods);instances(parent,drinkBottleGeometry,bottleBody,bottles);instances(parent,drinkLabelGeometry,bottleLabel,bottleLabels);instances(parent,drinkCapGeometry,bottleCap,bottleCaps);batch(parent,cream,fridges);batch(parent,coldCaseGlass,fridgeDoors);batch(parent,packagedGoods,coldProducts);
 const tillX=storeX-side*5.7,tillZ=frontZ+side*1.15;
 box(parent,4.2,1.18,1.25,tillX,y+.64,tillZ,counter);box(parent,4.25,.12,1.32,tillX,y+1.27,tillZ,counterTop);
 box(parent,.78,.48,.12,tillX-.82,y+1.56,tillZ-side*.36,screen);box(parent,.34,.13,.3,tillX+.22,y+1.39,tillZ-side*.31,screen);
 box(parent,1.3,.18,.75,tillX+3.05,y+.1,tillZ-side*1.8,storeFloor);
 const checkoutProducts=[material('#c85d41',.5,.04),material('#d1ac55',.56,.025),material('#598c78',.56,.025)];
 for(let i=0;i<3;i++)box(parent,.36,.58,.3,tillX+2.58+i*.48,y+.48,tillZ-side*1.8,checkoutProducts[i]);
 if(north){
  // The north waiting area is documented with an airport miniature and a children's LEGO table.
  const modelX=b.x+b.width*.235,modelZ=zoneZ+side*1.4;
  box(parent,20,.92,9.2,modelX,y+.46,modelZ,warmWood);box(parent,21,.14,10.2,modelX,y+1.02,modelZ,material('#d9d8cd',.35,.08));
  box(parent,14,.07,2.15,modelX,y+1.15,modelZ,material('#303b3b',.68,.08));
  for(let row=0;row<3;row++)box(parent,10-row*1.8,.28,1.1,modelX,y+1.3+row*.16,modelZ+(row-1)*1.38,material(row===1?'#d9d5c7':'#aeb6ad',.64,.04));
  box(parent,4.8,.045,.14,modelX,y+1.24,modelZ-.26,cream);box(parent,4.8,.045,.14,modelX,y+1.24,modelZ+.26,cream);
  box(parent,15,.42,5.4,modelX,y+2.3,modelZ+side*11,material('#d6c49b',.58,.06));
  for(let seat=0;seat<4;seat++)box(parent,1.3,.62,.78,modelX+(seat-1.5)*2.3,y+1.82,modelZ+side*15,seatWarm);
  sign(parent,'TAOYUAN AIRPORT MODEL  桃園機場模型',modelX,y+4.05,modelZ-side*5.7,20,'#879a92',0,.98);
 }else{
  // South side amenities face the observation deck's quiet lounge and capsule hotel.
  const hotelX=b.x-b.width*.245,hotelZ=zoneZ-side*2.1,hotelW=23;
  box(parent,hotelW,3.5,.34,hotelX,y+1.75,hotelZ,cream);
  for(const x of [hotelX-hotelW/2,hotelX+hotelW/2])box(parent,.2,3.5,4.6,x,y+1.75,hotelZ-side*2,metal);
  box(parent,hotelW-.5,.42,.32,hotelX,y+3.23,hotelZ-side*2.15,accent);sign(parent,'CAPSULE HOTEL  膠囊旅館',hotelX,y+3.42,hotelZ-side*2.32,18,'#68a88a',0,.92);
  const cabinDoors:Item[]=[];for(let i=0;i<5;i++)cabinDoors.push({x:hotelX+(i-2)*3.7,y:y+1.42,z:hotelZ+side*.36,sx:2.6,sy:2.18,sz:.12,color:'#c2d0ca'});batch(parent,glass,cabinDoors);
  for(let i=0;i<3;i++){const x=hotelX+(i-1)*4.2;box(parent,3.35,.18,1.7,x,y+.1,zoneZ+side*8,cream);box(parent,3.2,.56,1.55,x,y+.49,zoneZ+side*8,seatDark);box(parent,3.2,.68,.18,x,y+.91,zoneZ+side*8-side*.72,seatDark);}
  sign(parent,'SHOWERS  淋浴室',b.x+b.width*.1,y+3.5,zoneZ-side*8,13,'#79a1a0',side>0?Math.PI:0,.9);
 }
 const cafeX=b.x+(north?1:-1)*b.width*.08,cafeZ=zoneZ+side*7;
 box(parent,11,.86,2.1,cafeX,y+.55,cafeZ,warmWood);box(parent,11.4,.15,2.3,cafeX,y+1.04,cafeZ,foodCourtIvory);
 for(let i=0;i<4;i++){const x=cafeX+(i-1.5)*3.1;box(parent,.72,.14,.72,x,y+.52,cafeZ+side*3,seatWarm);box(parent,.72,.7,.12,x,y+.9,cafeZ+side*3-side*.3,seatWarm);}
 sign(parent,north?'CAFE  咖啡':'QUIET LOUNGE  休息區',cafeX,y+3.5,cafeZ-side*1.25,12,'#b9955e',0,.88);
}
/** T2's 3F retail edge and public amenities follow the airport's mapped zones. */
function terminal2DepartureRetailAndServices(parent:THREE.Object3D,b:TerminalBounds,y:number){
 const bays=t2ThirdFloorRetailUnits(b.x,b.z,b.width),darkWall=material('#4b5552',.76,.06),lightWall=material('#d4d3ca',.68,.035),trim=material('#a7aaa2',.44,.22),floor=material('#aaa995',.37,.035),
  glass=new THREE.MeshPhysicalMaterial({color:'#b8cfcc',roughness:.18,metalness:.06,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide}),
  caseGlass=new THREE.MeshPhysicalMaterial({color:'#d7e4dd',roughness:.16,metalness:.08,transparent:true,opacity:.34,depthWrite:false,side:THREE.DoubleSide}),
  displays:Item[]=[],shelves:Item[]=[],counterBases:Item[]=[],counterTops:Item[]=[],ceilingLights:Item[]=[],cases:Item[]=[],caseTops:Item[]=[],serviceScreens:Item[]=[],queuePosts:Item[]=[],queueRails:Item[]=[];
 for(let i=0;i<bays.length;i++){
  const bay=bays[i],z=bay.z,depth=bay.depth,length=bay.length,frontX=bay.frontX,backX=frontX+depth,color=material(bay.accent,.46,.14),wall=i%2?lightWall:darkWall;
  // The official map identifies separate watch, international-goods, beauty
  // and service frontages. Keep their individual footprints and store depths
  // visible along one continuous passenger aisle instead of repeating six
  // identical anonymous units.
  box(parent,depth,.1,length-.25,frontX+depth/2,y+.09,z,floor);
  box(parent,.22,4.55,length-.25,backX,y+2.28,z,wall);
  for(const edge of [-1,1])box(parent,depth,4.55,.2,frontX+depth/2,y+2.28,z+edge*(length/2-.1),wall);
  box(parent,.2,.62,length-.25,frontX,y+.31,z,trim);
  box(parent,.34,.94,length-.25,frontX,y+4.16,z,color);
  // Glazed side panels frame a broad entry; the aisle-facing frontage stays open.
  for(const side of [-1,1]){
   box(parent,.09,2.72,length*.29,frontX,y+2.12,z+side*length*.34,glass);
   box(parent,.13,3.15,.16,frontX,y+2.03,z+side*(length/2-.35),trim);
  }
  for(let lamp=0;lamp<3;lamp++)ceilingLights.push({x:frontX+2.6+lamp*Math.max(2.8,(depth-5.2)/2),y:y+4.62,z,sx:Math.min(2.2,depth*.19),sy:.07,sz:.16,color:'#f5dfaa'});
  sign(parent,bay.label,frontX-.22,y+4.16,z,Math.min(14,length*.78),bay.accent,-Math.PI/2,.82);
  if(bay.style==='service'){
   const counterX=frontX+depth*.42,counterLength=length*.72,stationCount=4;
   counterBases.push({x:counterX,y:y+.58,z,sx:3.25,sy:1.08,sz:counterLength,color:'#858780'});
   counterTops.push({x:counterX,y:y+1.17,z,sx:3.4,sy:.12,sz:counterLength+.12,color:'#e3e0d5'});
   for(let station=0;station<stationCount;station++){
    const stationZ=z+(station-(stationCount-1)/2)*(counterLength/(stationCount-1));
    serviceScreens.push({x:counterX+1.42,y:y+1.72,z:stationZ,sx:.09,sy:.52,sz:.68,color:'#102d35'});
   }
   for(const side of [-1,1]){
    const queueX=frontX+depth*.2+side*2.3;
    queuePosts.push({x:queueX,y:y+.57,z:z-length*.34,sx:.11,sy:1.14,sz:.11},{x:queueX,y:y+.57,z:z+length*.34,sx:.11,sy:1.14,sz:.11});
    queueRails.push({x:queueX,y:y+.92,z,sx:.055,sy:.06,sz:length*.64});
   }
  }else{
   const shelfCount=bay.style==='beauty'?3:2;
   for(let shelf=0;shelf<shelfCount;shelf++){
    const sx=backX-depth*.2,sy=y+.75+shelf*.92,shelfLength=length*.48;
    shelves.push({x:sx,y:sy,z,sx:Math.min(3.7,depth*.28),sy:.12,sz:shelfLength,color:i%2?'#e4e0d4':'#6e7069'});
    const itemCount=Math.max(4,Math.floor(shelfLength/1.55));
    for(let item=0;item<itemCount;item++)displays.push({x:sx-depth*.12,y:sy+.32,z:z+(item-(itemCount-1)/2)*(shelfLength/itemCount),sx:.48,sy:.52+((item+shelf)%2)*.1,sz:.58,color:['#d5b768','#9d5d45','#62827f','#ddd8c9','#947350','#80908a'][(i+shelf+item)%6]});
   }
   const displayCount=bay.style==='beauty'?4:3,displayLength=Math.min(2.15,length*.12),displayX=frontX+depth*.36;
   for(let display=0;display<displayCount;display++){
    const displayZ=z+(display-(displayCount-1)/2)*(length/(displayCount+1));
    cases.push({x:displayX,y:y+.55,z:displayZ,sx:1.08,sy:.92,sz:displayLength,color:bay.style==='beauty'?'#e8e3d8':'#b9b8ac'});
    caseTops.push({x:displayX,y:y+1.03,z:displayZ,sx:1.14,sy:.06,sz:displayLength+.08,color:'#f0e9d6'});
    if(bay.style==='beauty')for(let product=0;product<3;product++)displays.push({x:displayX+.08,y:y+1.32,z:displayZ+(product-1)*.48,sx:.16,sy:.48+(product%2)*.13,sz:.16,color:['#b65d50','#caad7b','#70867e'][product]});
   }
   const counterX=frontX+depth*.22;
   counterBases.push({x:counterX,y:y+.58,z,sx:2.8,sy:1.08,sz:length*.22,color:'#858780'});
   counterTops.push({x:counterX,y:y+1.17,z,sx:2.95,sy:.12,sz:length*.23,color:'#e3e0d5'});
  }
 }
 batch(parent,lightWall,shelves);batch(parent,lightWall,displays);batch(parent,counter,counterBases);batch(parent,counterTop,counterTops);batch(parent,caseGlass,cases);batch(parent,trim,caseTops);batch(parent,screen,serviceScreens);batch(parent,queuePost,queuePosts);batch(parent,steel,queueRails);batch(parent,ceilingStrip,ceilingLights);

 // The 3F airport map also labels a nursing room, restrooms and AED points.
 for(const service of T2_THIRD_FLOOR_LAYOUT.services)terminal2MappedRoom(parent,b.x+service.dx,y,b.z+service.dz,service.width,service.depth,service.label,service.kind,service.facing);
 const westWallX=b.x+T2_THIRD_FLOOR_LAYOUT.atm.wallDx,atmZ=b.z+T2_THIRD_FLOOR_LAYOUT.atm.dz,serviceWall=material('#d2d4ce',.58,.06),atmBody=material('#53645f',.38,.24),atmScreen=new THREE.MeshStandardMaterial({color:'#17343b',emissive:'#23545a',emissiveIntensity:.24,roughness:.34}),keypad=material('#bbc2bb',.4,.18);
 box(parent,8,3.35,.22,westWallX,y+1.675,atmZ-3.3,serviceWall);
 for(let unit=0;unit<3;unit++){
  const x=westWallX+1.2,z=atmZ+(unit-1)*2.35;
  box(parent,1.06,2.22,1.7,x,y+1.11,z,atmBody);box(parent,.08,.74,1.08,x+.57,y+1.7,z,atmScreen);
  box(parent,.08,.26,.46,x+.58,y+1.18,z+.35,keypad);box(parent,.08,.1,.38,x+.58,y+.79,z,trim);
 }
 sign(parent,'ATM  自動提款機',westWallX+1.15,y+3.85,atmZ-3.5,10,'#627d75',Math.PI/2,.8);
 const exchangeX=b.x+T2_THIRD_FLOOR_LAYOUT.exchange.dx,exchangeZ=b.z+T2_THIRD_FLOOR_LAYOUT.exchange.dz,exchangeBody=material('#52645f',.36,.27),exchangeDisplay=new THREE.MeshStandardMaterial({color:'#17343b',emissive:'#25555a',emissiveIntensity:.25,roughness:.34});
 for(let unit=0;unit<2;unit++){
  const x=exchangeX+(unit-.5)*2.4;
  box(parent,1.05,2.28,1.02,x,y+1.14,exchangeZ,exchangeBody);box(parent,.78,.62,.08,x,y+1.71,exchangeZ+.55,exchangeDisplay);
  box(parent,.44,.16,.08,x,y+1.12,exchangeZ+.56,keypad);
 }
 sign(parent,'FOREIGN EXCHANGE  外幣兌換機',exchangeX,y+3.15,exchangeZ-1.25,9,'#9a8050',0,.72);
 for(const bank of T2_THIRD_FLOOR_LAYOUT.bankServices)terminal2MappedServiceDesk(parent,b.x+bank.wallDx,y,b.z+bank.dz,bank.label,bank.accent,bank.length,bank.stations);
 const aedCabinet=material('#d6dad3',.58,.08),aedGreen=material('#188e79',.42,.06),aedCross=material('#f5f1e7',.4,.03);
 for(const point of T2_THIRD_FLOOR_LAYOUT.aeds){
  const x=b.x+point.dx,z=b.z+point.dz;
  box(parent,.24,.98,.9,x,y+1.45,z,aedCabinet);box(parent,.08,.64,.58,x+.16,y+1.45,z,aedGreen);
  box(parent,.035,.42,.11,x+.22,y+1.45,z,aedCross);sign(parent,'AED',x+.2,y+2.28,z,1.2,'#188e79',Math.PI/2,.44);
 }
}
/** T2 2F services are mapped public amenities; fixture positions are schematic. */
function terminal2TransferServices(parent:THREE.Object3D,b:TerminalBounds,y:number){
 const serviceZ=b.z-40,infoX=b.x-b.width*.31,shopX=b.x-b.width*.19,
  pale=material('#d7d9d1',.62,.025),stone=material('#bbbcb5',.54,.04),dark=material('#495653',.52,.12),shopWall=material('#bec2ba',.72,.025),
  infoAccent=material('#148d8a',.38,.12),products=['#c1a269','#73877d','#8f6250','#d2d0c5','#697c82','#b17a3e'].map(color=>material(color,.62,.04)),window=new THREE.MeshPhysicalMaterial({color:'#a9c4c0',roughness:.2,metalness:.04,transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide});
 // The airport's 2F map labels an iTravel service point and a small shop on
 // the west side of the public circulation strip. Keep both low and compact.
 box(parent,8.2,.22,2.6,infoX,y+.11,serviceZ,pale);
 box(parent,7.4,1.02,1.25,infoX,y+.72,serviceZ-.35,infoAccent);
 box(parent,7.5,.12,1.35,infoX,y+1.29,serviceZ-.35,counterTop);
 box(parent,7.1,1.5,.16,infoX,y+2.05,serviceZ-1.22,window);
 for(let i=0;i<3;i++){
  box(parent,.92,.55,.08,infoX-2.45+i*2.45,y+1.76,serviceZ-1.34,screen);
  box(parent,.09,.82,.1,infoX-3.05+i*3.05,y+1.68,serviceZ-.48,steel);
 }
 sign(parent,'iTravel  旅客服務',infoX,y+3.16,serviceZ-1.38,8,'#138b87',0,.95);
 for(const side of [-1,1])for(let i=0;i<2;i++){
  const x=infoX+side*(4.9+i*1.1);
  box(parent,.1,.92,.1,x,y+.46,serviceZ+2.05,queuePost);
  box(parent,.1,.92,.1,x,y+.46,serviceZ+4.3,queuePost);
  box(parent,.055,.06,2.1,x,y+.78,serviceZ+3.18,steel);
 }
 // A shallow, open-front shop preserves the generic map label without
 // inventing a tenant name, branded fit-out or exact shop boundary.
 const shopZ=serviceZ-1.1,shopW=11.5;
 box(parent,shopW,.15,8,shopX,y+.08,shopZ,stone);
 box(parent,shopW,2.55,.22,shopX,y+1.34,shopZ-4,shopWall);
 box(parent,shopW,.62,.26,shopX,y+2.9,shopZ-4,dark);
 box(parent,shopW-1.4,.48,1.35,shopX,y+.42,shopZ+.28,stone);
 box(parent,shopW-1.2,.12,1.5,shopX,y+.72,shopZ+.28,counterTop);
 for(const side of [-1,1]){
  box(parent,.18,3.2,8,shopX+side*(shopW/2),y+1.62,shopZ,stone);
  box(parent,.12,2.5,2.5,shopX+side*(shopW/2-.1),y+1.46,shopZ+2.45,window);
 }
 for(let shelf=0;shelf<2;shelf++){
  const z=shopZ+1.15+shelf*1.9;
  box(parent,7.2,.15,.62,shopX,y+.64+shelf*.88,z,stone);
   for(let item=0;item<6;item++)box(parent,.52,.48,.46,shopX-2.85+item*1.14,y+.98+shelf*.88,z,products[item]);
 }
 sign(parent,'SHOP  商店',shopX,y+3.43,shopZ-4.14,7.4,'#8d8061',0,.82);

 // Restroom entries and emergency cabinets are repeated public services on
 // the official map. Their rendered room locations/counts are approximate.
 const restroomX=b.x+b.width*.30,restroomZ=b.z-58,wall=material('#c7c9c1',.64,.025),door=material('#727d78',.46,.1);
 box(parent,13,.14,8.2,restroomX,y+.07,restroomZ,stone);
 box(parent,13,3.35,.22,restroomX,y+1.68,restroomZ-4.1,wall);
 for(const side of [-1,1])box(parent,.22,3.35,8.2,restroomX+side*6.5,y+1.68,restroomZ,wall);
 for(const side of [-1,1]){
  box(parent,2.2,2.65,.12,restroomX+side*3.25,y+1.34,restroomZ-4.24,door);
  box(parent,.08,2.72,.14,restroomX+side*2.1,y+1.38,restroomZ-4.25,steel);
 }
 sign(parent,'RESTROOMS  廁所',restroomX,y+4.12,restroomZ-4.24,10,'#6d8c85',0,.9);
 const cabinet=material('#168d76',.38,.08),cross=material('#f2f1e8',.42,.02),aeds=[
  {x:restroomX+5.8,z:restroomZ-4.65},{x:b.x+b.width*.38,z:b.z-28},{x:b.x+b.width*.38,z:b.z+40}
 ];
 for(const aed of aeds){
  box(parent,.82,.9,.18,aed.x,y+1.5,aed.z,wall);
  box(parent,.58,.62,.08,aed.x,y+1.5,aed.z-.12,cabinet);
  box(parent,.12,.44,.045,aed.x,y+1.5,aed.z-.18,cross);
  box(parent,.34,.12,.045,aed.x,y+1.5,aed.z-.19,cross);
  sign(parent,'AED',aed.x,y+2.22,aed.z-.2,1.1,'#168d76',0,.43);
 }
}
type T1MappedStore={dx?:number;dz?:number;side?:-1|1;zRatio?:number;rotationY?:number;label:string;accent:string;kind:'retail'|'food';profile:'design'|'tea'|'burger'|'bakery'|'craft'|'taiwan-goods'|'specialty';width?:number;depth?:number};
const mappedShopFasciaCache=new Map<string,THREE.Material>();
function mappedShopFascia(store:T1MappedStore){
 const key=`${store.profile}|${store.label}|${store.accent}`,cached=mappedShopFasciaCache.get(key);if(cached)return cached;
 const background=store.profile==='design'?'#171a19':store.profile==='specialty'?'#171a17':store.profile==='taiwan-goods'?'#51402f':'#10242c';
 const texture=canvasTexture(1024,256,ctx=>{
  ctx.fillStyle=background;ctx.fillRect(0,0,1024,256);ctx.fillStyle=store.accent;ctx.fillRect(0,0,13,256);ctx.fillRect(13,238,1011,18);
  ctx.textAlign='center';ctx.textBaseline='middle';
  if(store.profile==='design'){
   ctx.fillStyle='#f5f4ef';ctx.font='500 178px Arial,sans-serif';ctx.fillText('OLI',510,116,770);
   ctx.fillStyle='#d7d5cc';ctx.font='54px Arial,sans-serif';ctx.fillText('奧立 設計師商店',795,205,400);
  }else{
   const [english,chinese]=store.label.split('  ');
   if(store.profile==='specialty'){
    ctx.fillStyle='#d2b477';ctx.font='600 132px Arial,sans-serif';ctx.fillText(chinese??english,512,105,944);
    ctx.fillStyle='#f3eee2';ctx.font='64px Arial,sans-serif';ctx.fillText(english,512,203,930);
   }else if(store.profile==='taiwan-goods'){
    ctx.fillStyle='#f4ead6';ctx.font='600 140px Arial,sans-serif';ctx.fillText(chinese??english,512,105,944);
    ctx.fillStyle='#d9bd88';ctx.font='64px Arial,sans-serif';ctx.fillText(english,512,203,930);
   }else{
    ctx.fillStyle='#f6f4ec';ctx.font='bold 112px Arial,sans-serif';ctx.fillText(english,512,105,950);
    ctx.fillStyle='#e3e4dd';ctx.font='88px Arial,sans-serif';ctx.fillText(chinese??'',512,203,950);
   }
  }
  ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=2;ctx.strokeRect(8,8,1008,240);
 });
 const fascia=new THREE.MeshBasicMaterial({map:texture,toneMapped:false,side:THREE.DoubleSide});mappedShopFasciaCache.set(key,fascia);return fascia;
}
function mappedShopFasciaFace(parent:THREE.Object3D,store:T1MappedStore,x:number,y:number,z:number,width:number){
 const face=new THREE.Mesh(new THREE.PlaneGeometry(width,.58),mappedShopFascia(store));face.position.set(x,y,z+.145);face.castShadow=false;parent.add(face);
}
/** Floor-map named T1 2F shops get individual, open-front shells and fitted counters. */
function terminal1MappedShop(sceneRoot:THREE.Object3D,b:TerminalBounds,y:number,store:T1MappedStore){
 const d=store.depth??T1_SECOND_FLOOR_LAYOUT.shop.depth,x=store.side?b.x+store.side*(b.width/2-d/2):b.x+(store.dx??0),z=b.z+(store.zRatio!==undefined?store.zRatio*b.depth:(store.dz??0)),w=store.width??T1_SECOND_FLOOR_LAYOUT.shop.width,parent=new THREE.Group(),
  floor=material('#c3c2b9',.52,.035),wall=new THREE.MeshStandardMaterial({color:'#eeeae1',roughness:.76,metalness:.02,emissive:'#4b4234',emissiveIntensity:.12}),sideWall=material(store.profile==='design'?'#302e2c':store.profile==='taiwan-goods'?'#80664c':store.profile==='specialty'?'#35342f':'#d4d3cb',.74,.035),fascia=material(store.accent,.48,.12),trim=material('#737d78',.4,.36),
  shelfMat=material('#8c908a',.56,.16),shopCeiling=new THREE.MeshStandardMaterial({color:'#f0eee7',roughness:.82,emissive:'#504b40',emissiveIntensity:.1}),displayGlass=new THREE.MeshPhysicalMaterial({color:'#d8e3df',roughness:.16,metalness:.03,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide}),
  glass=new THREE.MeshPhysicalMaterial({color:'#b8cfcb',roughness:.18,metalness:.04,transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide}),
  merchandise=['#c29b5c','#83938a','#a45d47','#d6d1c5','#74858b','#b77b43'].map(color=>material(color,.58,.04)),frontZ=z+d/2,
  darkFrame=material('#343b39',.5,.22),timber=material('#806249',.66,.06),displayLight=new THREE.MeshStandardMaterial({color:'#fff1cf',emissive:'#f3c879',emissiveIntensity:.34,roughness:.38});
 box(parent,w+.5,.12,d+.5,x,y+.06,z,floor);
 box(parent,w,3.1,.2,x,y+1.55,z-d/2,wall);
 for(const side of [-1,1])box(parent,.18,3.1,d,x+side*w/2,y+1.55,z,sideWall);
 // Each lease has its own lower soffit and recessed linear lights instead of
 // leaving the terminal's high structural roof exposed through the shop.
 box(parent,w-.28,.14,d-.5,x,y+3.04,z,shopCeiling);
 const downlights:Item[]=[];for(let row=0;row<2;row++)for(let col=0;col<3;col++)downlights.push({x:x+(col-1)*w*.29,y:y+2.94,z:z+(row-.5)*d*.35,sx:1.25,sy:.045,sz:.18});batch(parent,ceilingStrip,downlights);
 // The entrance stays open at the centre; glass shopfront panels frame it.
 for(const side of [-1,1]){
  box(parent,w*.31,2.28,.1,x+side*w*.335,y+1.48,frontZ,glass);
  box(parent,.12,2.45,.14,x+side*w*.18,y+1.46,frontZ,trim);
  box(parent,.12,2.45,.14,x+side*w*.49,y+1.46,frontZ,trim);
  box(parent,w*.62,.075,.15,x+side*w*.19,y+2.61,frontZ,trim);
 }
 box(parent,w,.68,.24,x,y+2.83,frontZ,fascia);
 // A framed, open entrance with a durable lower rail reads as a built shopfront.
 for(const side of [-1,1]){
  box(parent,.22,2.55,.22,x+side*(w/2-.13),y+1.43,frontZ,darkFrame);
  box(parent,w*.31,.12,.2,x+side*w*.335,y+.12,frontZ,darkFrame);
 }
 box(parent,w,.12,.22,x,y+.12,frontZ,darkFrame);
 mappedShopFasciaFace(parent,store,x,y+2.83,frontZ,w-.4);
 const counterWidth=store.kind==='food'?w*.48:w*.62,counterZ=store.kind==='food'?z+d*.05:z+d*.21;
 box(parent,counterWidth,.72,1.2,x,y+.72,counterZ,store.kind==='food'?warmWood:counter);
 box(parent,counterWidth+.18,.13,1.28,x,y+1.08,counterZ,counterTop);
 if(store.kind==='food'){
  const menuCount=store.profile==='tea'?3:2,menuWidth=store.profile==='tea'?2.7:3.1,menuMat=shopMenuMaterial(store.profile==='tea'?'tea':store.profile==='burger'?'burger':'bakery',store.accent);
  for(let menu=0;menu<menuCount;menu++){
   const menuX=x+(menu-(menuCount-1)/2)*(menuWidth+.14),menuZ=z-d/2+.2;
   box(parent,menuWidth+.12,1.34,.12,menuX,y+2.14,menuZ,trim);
   const face=new THREE.Mesh(new THREE.PlaneGeometry(menuWidth,1.22),menuMat);face.position.set(menuX,y+2.14,menuZ+.071);face.castShadow=false;parent.add(face);
  }
  // Keep café seating inside the mapped shop footprint; the previous draft
  // placed the tables beyond the storefront and into the public aisle.
  if(store.profile==='tea'||store.profile==='burger')for(let table=0;table<2;table++){
   const tx=x+(table===0?-1:1)*w*.34,tz=z-d*.18;
   box(parent,1.25,.12,1.05,tx,y+.78,tz,counterTop);box(parent,.1,.7,.1,tx,y+.39,tz,steel);
   for(const side of [-1,1]){box(parent,.58,.12,.58,tx,y+.48,tz+side*.88,seatWarm);box(parent,.58,.58,.12,tx,y+.79,tz+side*1.15,seatWarm);}
  }
  box(parent,w*.34,.68,.7,x,y+1.55,z-d*.31,warmWood);
  box(parent,w*.31,.1,.72,x,y+1.94,z-d*.31,steel);
  if(store.profile==='tea'){
   for(let urn=0;urn<3;urn++){const ux=x+(urn-1)*1.15;box(parent,.65,.78,.55,ux,y+1.55,counterZ-.12,material('#9b9b88',.38,.2));box(parent,.48,.12,.42,ux,y+1.98,counterZ-.12,steel);}
   box(parent,2.7,.82,.78,x,y+1.59,counterZ+1.05,displayGlass);box(parent,2.5,.13,.7,x,y+1.18,counterZ+1.05,counterTop);
  }else if(store.profile==='burger'){
   box(parent,3.2,.8,.85,x,y+1.57,counterZ+1.0,displayGlass);box(parent,3,.13,.78,x,y+1.16,counterZ+1.0,material('#d49d4c',.42,.08));
   for(let terminal=0;terminal<2;terminal++){const tx=x+(terminal-.5)*2.45;box(parent,.24,.34,.2,tx,y+1.33,counterZ-.35,steel);box(parent,.4,.26,.12,tx,y+1.65,counterZ-.35,screen);}
  }else{
   // Bakery display is low, glazed and lit; baked goods stay behind the glass.
   box(parent,5.2,1.18,1.35,x,y+1.68,counterZ+.82,displayGlass);box(parent,5,.12,1.2,x,y+1.05,counterZ+.82,material('#d3a256',.45,.08));
   for(let tray=0;tray<3;tray++)for(let item=0;item<4;item++){
    const px=x+(item-1.5)*1.05,pz=counterZ+.48+(tray-1)*.31;box(parent,.55,.2,.28,px,y+1.42+(tray%2)*.28,pz,merchandise[(tray+item)%merchandise.length]);
   }
  }
 }else{
  for(let shelf=0;shelf<2;shelf++){
   const shelfZ=z-d*.28+shelf*1.55;
   box(parent,w*.66,.12,.58,x,y+.78+shelf*.93,shelfZ,shelfMat);
   for(let item=0;item<7;item++)box(parent,.56,.5,.42,x+(item-3)*1.18,y+1.05+shelf*.93,shelfZ+.12,merchandise[(item+shelf)%merchandise.length]);
  }
  if(store.profile==='craft'){
   // Neutral craft shelving is intentionally generic; the public plan names
   // this retailer but does not publish its current artisan product display.
   const woven=material('#9c714c',.72,.015),craft=material('#375f54',.6,.03);
   for(let bay=0;bay<3;bay++){
    const bx=x+(bay-1)*4.7,bz=z-d*.18;
    box(parent,3.6,.14,1.05,bx,y+.9,bz,shelfMat);box(parent,3.6,.14,1.05,bx,y+1.85,bz,shelfMat);
    for(let item=0;item<4;item++){
     const ix=bx+(item-1.5)*.75;
     box(parent,.58,.62,.52,ix,y+1.3,bz,merchandise[(item+bay)%merchandise.length]);
     box(parent,.54,.7,.5,ix,y+2.3,bz,material(item%2?'#b38a56':'#806248',.66,.025));
    }
    box(parent,2.2,.08,.06,bx,y+2.83,bz-.54,craft);box(parent,2.2,.08,.06,bx,y+2.83,bz+.54,craft);
   }
   box(parent,w*.56,1.8,.12,x,y+2,z-d*.49,woven);
  }else if(store.profile==='design'){
   // OLI's official storefront photo shows long white front display cases,
   // warm shelves and a full-height charcoal frame.
   for(let display=0;display<2;display++){
    const dx=x+(display===0?-1:1)*w*.235,dz=z+d*.22,length=w*.44;
    box(parent,length,.78,1.28,dx,y+.48,dz,counterTop);box(parent,length,.1,1.36,dx,y+.92,dz,counterTop);
    box(parent,length-.18,.48,.055,dx,y+1.19,dz-.61,displayGlass);box(parent,length-.18,.48,.055,dx,y+1.19,dz+.61,displayGlass);
    box(parent,length-.28,.06,.08,dx,y+1.43,dz,displayLight);
    for(let item=0;item<6;item++){
     const ix=dx+(item-2.5)*(length/6);box(parent,.62,.35,.46,ix,y+1.2,dz,merchandise[(item+display)%merchandise.length]);
     box(parent,.58,.07,.42,ix,y+1.41,dz,material(item%2?'#ece9df':'#aab2ad',.7,.025));
    }
   }
   for(let row=0;row<3;row++){
    const sy=y+.72+row*.7;box(parent,w*.72,.1,.5,x,sy,z-d*.43,shelfMat);
    box(parent,w*.72,.045,.08,x,sy+.12,z-d*.43+.28,displayLight);
    for(let item=0;item<9;item++)box(parent,.56,.4,.38,x+(item-4)*1.25,sy+.34,z-d*.4,merchandise[(item+row)%merchandise.length]);
   }
   for(let slat=0;slat<14;slat++)box(parent,.045,2.55,.06,x+(slat-6.5)*.62,y+1.45,z-d/2+.17,timber);
  }else if(store.profile==='taiwan-goods'){
   // Warm timber and illuminated island cases follow the official photo of
   // Taiwan Specialty Goods; product silhouettes stay intentionally generic.
   for(let display=0;display<3;display++){
    const dx=x+(display-1)*4.2,dz=z+d*.12;
    box(parent,3.05,.88,1.55,dx,y+.51,dz,timber);box(parent,2.95,.12,1.48,dx,y+1.01,dz,counterTop);
    box(parent,2.9,.62,.07,dx,y+1.4,dz-.68,displayGlass);box(parent,2.9,.62,.07,dx,y+1.4,dz+.68,displayGlass);
    box(parent,2.75,.05,.08,dx,y+1.75,dz,displayLight);
    for(let item=0;item<4;item++)box(parent,.48,.4,.48,dx+(item-1.5)*.62,y+1.33,dz,merchandise[(item+display)%merchandise.length]);
   }
   for(let slat=0;slat<14;slat++)box(parent,.045,2.52,.06,x+(slat-6.5)*.62,y+1.45,z-d/2+.17,timber);
  }else if(store.profile==='specialty'){
   // A segmented island recreates the rounded, illuminated display shown in
   // the airport's local-specialty shop photo without importing that image.
   const radius=2.75,segments=12;
   for(let segment=0;segment<segments;segment++){
    const angle=(segment/segments)*Math.PI*1.35-Math.PI*.175,cx=x+Math.cos(angle)*radius,cz=z+Math.sin(angle)*radius*.68,rotation=Math.PI/2-angle;
    box(parent,1.62,.84,.78,cx,y+.51,cz,timber,rotation);box(parent,1.56,.12,.82,cx,y+.99,cz,counterTop,rotation);
    box(parent,1.34,.06,.08,cx,y+1.08,cz,displayLight,rotation);box(parent,.42,.42,.38,cx,y+1.28,cz,merchandise[segment%merchandise.length]);
   }
   for(let shelf=0;shelf<3;shelf++){
    const shelfZ=z-d*.4+shelf*.86;box(parent,w*.7,.11,.6,x,y+.68+shelf*.86,shelfZ,timber);
    for(let item=0;item<8;item++)box(parent,.56,.52,.42,x+(item-3.5)*1.22,y+1.05+shelf*.86,shelfZ+.12,merchandise[(item+shelf)%merchandise.length]);
   }
   const darkCanopy=material('#222522',.55,.08);box(parent,w-.3,.16,d-.35,x,y+2.98,z,darkCanopy);
   for(let lightIndex=0;lightIndex<6;lightIndex++)box(parent,.14,.08,.14,x+(lightIndex-2.5)*2.6,y+2.88,z,displayLight);
  }
 }
 // Build shops in their local world-space layout, then attach them to the
 // selected side of the 2F gallery so the open storefront faces the atrium.
 const recenter=new THREE.Matrix4().makeTranslation(-x,0,-z),offset=new THREE.Vector3(x,0,z),instanceMatrix=new THREE.Matrix4();
 for(const child of parent.children){
  if(child instanceof THREE.InstancedMesh){for(let i=0;i<child.count;i++){child.getMatrixAt(i,instanceMatrix);instanceMatrix.premultiply(recenter);child.setMatrixAt(i,instanceMatrix);}child.instanceMatrix.needsUpdate=true;}
  else child.position.sub(offset);
 }
 parent.position.set(x,0,z);parent.rotation.y=store.side===-1?Math.PI/2:store.side===1?-Math.PI/2:(store.rotationY??0);sceneRoot.add(parent);
}
function terminal1MappedRoom(parent:THREE.Object3D,x:number,y:number,z:number,w:number,d:number,label:string,kind:'restroom'|'nursing'|'medical'){
 const floor=material('#d2d2cb',.62,.025),wall=kind==='medical'?new THREE.MeshStandardMaterial({color:'#f1f2ed',roughness:.78,emissive:'#64665d',emissiveIntensity:.12}):material('#dedfd8',.76,.025),door=material('#66726f',.48,.08),trim=material('#9da49e',.42,.2),porcelain=material('#f1f1e9',.26,.035),backZ=z-d/2,frontZ=z+d/2;
 box(parent,w,.14,d,x,y+.07,z,floor);
 box(parent,w,3.35,.22,x,y+1.675,backZ,wall);
 for(const side of [-1,1])box(parent,.22,3.35,d,x+side*w/2,y+1.675,z,wall);
 for(const side of [-1,1]){
  box(parent,w*.24,3.35,.22,x+side*w*.38,y+1.675,frontZ,wall);
  box(parent,.12,2.55,.12,x+side*1.58,y+1.275,frontZ+.14,door);
 }
 box(parent,w*.42,.28,.24,x,y+3.19,frontZ,trim);
 if(kind==='medical')sign(parent,label,x+w*.08,y+3.86,frontZ+.13,Math.min(w*.7,11),'#6f8983',0,.78);
 else sign(parent,label,x,y+3.86,frontZ+.13,Math.min(w*.92,14),'#6f8983',0,.78);
 if(kind==='restroom'){
  for(let stall=0;stall<3;stall++){
   const sx=x+(stall-1)*2.55;box(parent,.12,2.15,2.3,sx,y+1.1,z-.5,wall);box(parent,2.35,.12,.12,sx,y+2.16,z+.65,steel);
   box(parent,.46,.7,.2,sx,y+.63,z-d*.22,porcelain);box(parent,.48,.18,.63,sx,y+.28,z-d*.08,porcelain);
  }
  box(parent,5.8,.82,.58,x,y+.41,z+d*.19,counter);box(parent,5.95,.13,.7,x,y+.87,z+d*.19,counterTop);
  for(let basin=0;basin<3;basin++){
   const bx=x+(basin-1)*1.82,bz=z+d*.16;
   box(parent,.76,.14,.54,bx,y+.98,bz,porcelain);box(parent,.1,.38,.1,bx,y+.7,bz,steel);
   box(parent,.07,.26,.07,bx,y+1.17,bz-.2,steel);
  }
  const mirror=new THREE.MeshPhysicalMaterial({color:'#b7c2c1',metalness:.58,roughness:.16,envMapIntensity:.65});
  box(parent,5.55,1.08,.045,x,y+1.75,z+d*.16-.3,mirror);
  for(let stall=0;stall<3;stall++){
   const sx=x+(stall-1)*2.55;box(parent,2.1,1.95,.08,sx,y+1.2,z+.75,material('#aeb6b2',.66,.03));
   box(parent,.07,1.96,.1,sx+1.05,y+1.2,z+.8,steel);
  }
 }else if(kind==='nursing'){
  const upholstery=material('#a99578',.82,.015);
  box(parent,2.15,.42,.9,x-2.45,y+.54,z-.65,upholstery);box(parent,2.15,.78,.18,x-2.45,y+.96,z-1.08,upholstery);
  box(parent,1.25,.82,.72,x+2.5,y+.49,z-.65,counter);box(parent,1.35,.12,.8,x+2.5,y+.96,z-.65,counterTop);
  box(parent,.82,.9,.62,x+2.5,y+1.48,z-.65,porcelain);box(parent,.1,.45,.1,x+2.5,y+1.13,z-.65,steel);
  box(parent,1.25,.1,.85,x-2.4,y+.55,z+1.25,counterTop);box(parent,.1,.44,.1,x-2.4,y+.32,z+1.25,steel);
  box(parent,.42,.36,.32,x-2.4,y+.8,z+1.25,material('#d7b66d',.52,.02));
  const babyPad=material('#e7e6dc',.72,.02),partition=material('#d8e1dc',.6,.02),changingFrame=material('#a8b2ad',.4,.48);
  box(parent,1.75,.2,.78,x+2.55,y+.92,z+1.35,changingFrame);
  box(parent,1.68,.1,.72,x+2.55,y+1.07,z+1.35,babyPad);
  box(parent,.08,2.2,1.9,x-.05,y+1.1,z-.3,partition);
  box(parent,.08,2.2,1.9,x-.05,y+1.1,z-2.25,partition);
  box(parent,1.55,.82,.12,x+2.35,y+2.2,z-2.9,wall);box(parent,1.38,.08,.08,x+2.35,y+2.64,z-2.82,trim);
 }else{
  const bedFrame=material('#a8b2ad',.4,.48),screenFace=new THREE.MeshPhysicalMaterial({color:'#b8cbc5',roughness:.52,transparent:true,opacity:.32,depthWrite:false,side:THREE.DoubleSide}),linen=material('#f7f7f2',.88,.01),clinicGreen=material('#238f7c',.44,.04),rubber=material('#46524f',.72,.03);
  const clinicGlass=new THREE.MeshPhysicalMaterial({color:'#b6d2cd',roughness:.18,metalness:.04,transparent:true,opacity:.36,depthWrite:false,side:THREE.DoubleSide});
  for(const side of [-1,1]){
   box(parent,1.12,2.28,.09,x+side*.58,y+1.16,frontZ+.18,clinicGlass);
   box(parent,.045,2.32,.1,x+side*1.15,y+1.16,frontZ+.24,trim);
  }
  box(parent,2.36,.1,.1,x,y+2.34,frontZ+.24,trim);
  for(let bed=0;bed<2;bed++){
   const bx=x+(bed-.5)*w*.37,bz=z-.1;
   box(parent,2.2,.2,.88,bx,y+.62,bz,bedFrame);box(parent,2.08,.16,.84,bx,y+.79,bz,linen);box(parent,.54,.12,.42,bx-.7,y+.93,bz,porcelain);
   box(parent,.8,.12,.68,bx+.46,y+.9,bz,material('#d6e2df',.8,.01));
   for(const side of [-1,1])box(parent,.1,.8,.1,bx+side*.94,y+.42,bz,bedFrame);
   for(const end of [-1,1])for(const side of [-1,1])cylinder(parent,.08,.08,.18,bx+end*.84,y+.13,bz+side*.31,rubber,8);
   box(parent,.07,2.15,1.25,bx+bed*.15,y+1.68,bz+1.18,screenFace);
   box(parent,.12,.7,.12,bx+bed*.15,y+2.25,bz+1.18,steel);
   // Small clinical details make each screened bay read as an equipped exam
   // space rather than a generic cot placed in a box room.
   const equipmentX=bx+1.42,equipmentZ=bz-.12;
   box(parent,.48,.58,.42,equipmentX,y+1.17,equipmentZ,wall);box(parent,.34,.22,.08,equipmentX,y+1.33,equipmentZ+.23,screen);
   cylinder(parent,.045,.045,1.65,bx-1.05,y+.92,bz+.62,steel,8);box(parent,.32,.44,.24,bx-1.05,y+1.86,bz+.62,material('#d7dfda',.55,.02));
   box(parent,.68,.5,.62,bx+1.3,y+.35,bz-.92,porcelain);for(const side of [-1,1])cylinder(parent,.045,.045,.22,bx+1.3+side*.22,y+.12,bz-.92,rubber,8);
  }
  // A compact reception and hand-wash point makes the clinic read as a room
  // with an arrival function, rather than two unexplained cots in a shell.
  box(parent,3.1,1.02,.82,x,y+.55,z+2.7,wall);box(parent,3.18,.1,.88,x,y+1.02,z+2.7,clinicGreen);box(parent,3.2,.14,.9,x,y+1.12,z+2.7,counterTop);
  box(parent,.52,.38,.12,x-.72,y+1.38,z+2.16,screen);box(parent,.62,.08,.08,x+.68,y+1.3,z+2.16,steel);
  box(parent,.78,.48,.08,x-.72,y+1.54,z+2.08,material('#c8ddd8',.46,.04));
  for(let chair=0;chair<3;chair++){
   const cx=x-2.8+chair*1.6;box(parent,.62,.14,.58,cx,y+.52,z+4.2,clinicGreen);box(parent,.62,.72,.12,cx,y+.9,z+4.45,clinicGreen);
   for(const side of [-1,1])box(parent,.08,.42,.08,cx+side*.35,y+.3,z+4.2,steel);
  }
  // A clear clinic marker sits beside the entrance directory sign.
  const clinicMarkX=x-w*.36;box(parent,.58,.58,.1,clinicMarkX,y+3.86,frontZ+.16,clinicGreen);
  box(parent,.13,.4,.06,clinicMarkX,y+3.86,frontZ+.23,porcelain);box(parent,.4,.13,.06,clinicMarkX,y+3.86,frontZ+.23,porcelain);
  box(parent,.48,.88,.12,x-w*.42,y+.62,frontZ+.2,wall);box(parent,.38,.42,.08,x-w*.42,y+.91,frontZ+.28,clinicGreen);
  box(parent,1.25,1.65,.56,x+5.25,y+1.06,z-.95,wall);box(parent,1.1,.12,.08,x+5.25,y+1.84,z-1.25,trim);
  box(parent,.62,1.05,.64,x-5.2,y+.76,z-.85,porcelain);box(parent,.1,.62,.1,x-5.2,y+.43,z-.85,steel);
 }
}
function terminal1MappedPublicServices(parent:THREE.Object3D,b:TerminalBounds,y:number,floor:'2F'|'3F'){
 const stores:T1MappedStore[]=[
  {side:-1,zRatio:-.26,label:'TAIWAN BEER  台灣菸酒',accent:'#9a7545',kind:'retail',profile:'craft',width:17,depth:T1_SECOND_FLOOR_LAYOUT.shop.depth},
  {side:-1,zRatio:-.02,label:'OLI DESIGN  設計師商店',accent:'#637c75',kind:'retail',profile:'design',width:17,depth:T1_SECOND_FLOOR_LAYOUT.shop.depth},
  {side:-1,zRatio:.20,label:'HANLIN TEA  翰林茶館',accent:'#8b4836',kind:'food',profile:'tea',width:17,depth:T1_SECOND_FLOOR_LAYOUT.shop.depth},
  {side:1,zRatio:-.26,label:'KUO YUAN YE  郭元益',accent:'#a17a45',kind:'food',profile:'bakery',width:18,depth:T1_SECOND_FLOOR_LAYOUT.shop.depth},
  {side:1,zRatio:-.02,label:'MOS BURGER  摩斯漢堡',accent:'#ad4538',kind:'food',profile:'burger',width:17,depth:T1_SECOND_FLOOR_LAYOUT.shop.depth},
  {side:1,zRatio:.20,label:'BISTRO:D  畢卓樂地餐廳',accent:'#8d754c',kind:'food',profile:'tea',width:20,depth:T1_SECOND_FLOOR_LAYOUT.shop.depth}
 ];
 if(floor==='2F')for(const store of stores)terminal1MappedShop(parent,b,y,store);
 else for(const store of T1_THIRD_FLOOR_STORES)terminal1MappedShop(parent,b,y,store);

 // The 2F map groups ATM, exchange and bank counters along the north gallery.
 // The 3F map places its service points in a separate arrangement.
 const isSecondFloor=floor==='2F',serviceZ=isSecondFloor?b.z-b.depth*.44:b.z-96,
  atmX=isSecondFloor?b.x-42:b.x-5,exchangeX=isSecondFloor?b.x-2:b.x+53,bankX=isSecondFloor?b.x+43:b.x+b.width*.31,
  housing=material('#d2d4ce',.5,.12),machine=material('#52635f',.36,.28),display=material('#17343b',.28,.16),wall=material('#d5d4cd',.68,.035),green=material('#168d76',.38,.08),cross=material('#f2f1e8',.42,.02);
 box(parent,11,.14,6.4,atmX,y+.07,serviceZ,housing);box(parent,11,3.4,.22,atmX,y+1.7,serviceZ-3.1,wall);
 for(let unit=0;unit<3;unit++){
  const x=atmX+(unit-1)*3.35,z=serviceZ+1.55;
  box(parent,2.25,2.25,.82,x,y+1.18,z,machine);box(parent,1.18,.74,.1,x,y+1.78,z+.44,display);
  box(parent,.62,.12,.08,x,y+1.18,z+.47,steel);box(parent,.45,.32,.1,x,y+.81,z+.48,screen);
 }
 sign(parent,'ATM  自動提款機',atmX,y+3.85,serviceZ-3.23,10,'#627d75',0,.8);
 const exchangeZ=serviceZ,bankZ=isSecondFloor?serviceZ:b.z-66;
 box(parent,8.5,.14,4.8,exchangeX,y+.07,exchangeZ,housing);box(parent,8.5,3.4,.22,exchangeX,y+1.7,exchangeZ-2.35,wall);
 for(let unit=0;unit<2;unit++){
  const x=exchangeX+(unit-.5)*3.5,z=exchangeZ+1.1;
  box(parent,1.8,2.5,.72,x,y+1.3,z,machine);box(parent,1.15,.7,.1,x,y+1.83,z+.39,display);box(parent,.44,.18,.08,x,y+.96,z+.41,steel);
 }
 sign(parent,'FOREIGN EXCHANGE  外幣兌換',exchangeX,y+3.85,exchangeZ-2.5,10,'#9a8050',0,.8);
 box(parent,16,.14,7,bankX,y+.07,bankZ,housing);box(parent,16,3.45,.2,bankX,y+1.725,bankZ-3.5,wall);
 box(parent,13.2,1.06,1.25,bankX,y+.73,bankZ+.95,material('#b9b6ad',.48,.18));
 box(parent,13.4,.14,1.4,bankX,y+1.28,bankZ+.95,counterTop);
 for(let teller=0;teller<3;teller++){
  const x=bankX+(teller-1)*4.15;box(parent,.12,.66,.12,x,y+1.65,bankZ+.55,steel);box(parent,1.3,.75,.12,x,y+2.06,bankZ+.53,display);
 }
 sign(parent,'BANK OF TAIWAN  臺灣銀行',bankX,y+3.92,bankZ-3.62,14,'#786e50',0,.8);

 if(isSecondFloor){
  const serviceRoomZ=b.z+b.depth*.42;
  terminal1MappedRoom(parent,b.x-28,y,serviceRoomZ,13,8,'RESTROOMS  廁所','restroom');
  terminal1MappedRoom(parent,b.x,y,serviceRoomZ,13,8,'NURSING ROOM  哺集乳室','nursing');
  terminal1MappedRoom(parent,b.x+29,y,serviceRoomZ,15,9,'MEDICAL CENTER  醫療中心','medical');
 }else{
  terminal1MappedRoom(parent,b.x+b.width*.15,y,b.z-62,13,8,'RESTROOMS  廁所','restroom');
  terminal1MappedRoom(parent,b.x-b.width*.37,y,b.z-62,13,8,'NURSING ROOM  哺集乳室','nursing');
  terminal1MappedRoom(parent,b.x-b.width*.19,y,b.z+116,15,9,'MEDICAL CENTER  醫療中心','medical');
 }
 const aeds=isSecondFloor?
  [{x:b.x-b.width*.43,z:b.z-18},{x:b.x+b.width*.43,z:b.z-18},{x:b.x,z:b.z+b.depth*.39}]:
  [{x:b.x-67,z:b.z-49},{x:b.x-65,z:b.z+11},{x:b.x+46,z:b.z+27}];
 for(const aed of aeds){
  box(parent,.82,.9,.18,aed.x,y+1.5,aed.z,wall);box(parent,.58,.62,.08,aed.x,y+1.5,aed.z-.12,green);
  box(parent,.12,.44,.045,aed.x,y+1.5,aed.z-.18,cross);box(parent,.34,.12,.045,aed.x,y+1.5,aed.z-.19,cross);
  sign(parent,'AED',aed.x,y+2.22,aed.z-.2,1.1,'#168d76',0,.43);
 }
}
function terminal1(parent:THREE.Object3D,b:TerminalBounds,mats:TerminalMaterials){
 // The current T1 2F map shows a large central opening, a narrow perimeter
 // gallery and mapped public shops/services along its sides.
 const levels=[.36,5.8,11.3,16.7],atrium={fromLevel:1,toLevel:2,x:b.x+T1_SECOND_FLOOR_LAYOUT.atrium.xOffset,z:b.z+T1_SECOND_FLOOR_LAYOUT.atrium.zOffset,width:b.width*T1_SECOND_FLOOR_LAYOUT.atrium.widthRatio,depth:b.depth*T1_SECOND_FLOOR_LAYOUT.atrium.depthRatio},finishes=deckFinishes('T1',mats);addDecks(parent,b,levels.slice(0,3),mats.concrete,.16,atrium,finishes);terminalAtriumEdgeDetail(parent,atrium,levels.slice(0,3),'T1');terminal1FourthFloor(parent,b,levels[3],finishes);addStructure(parent,b,finishes.structure,'T1');verticalCirculation(parent,b,levels,'T1');
 // The airport's visitor guide places T1's Departure Hall and counter 10 on
 // 1F; this public level shares the arrival, customs and meeting facilities.
 terminal1CheckIn(parent,b,.62,b.z-42);sign(parent,'DEPARTURES / CHECK-IN  出境報到',b.x,.62+7.2,b.z+2,11,'#aa9160',0,1.05);
 baggageClaim(parent,b,.58,b.z+57,6);customsHall(parent,b,.58,b.z+88);arrivalLobby(parent,b,.58,b.z+111);
 // 2F is the mapped public retail/service gallery; the larger controlled
 // immigration and departure functions remain on the separate 3F level.
 terminal1MappedPublicServices(parent,b,6.05,'2F');
 immigrationHall(parent,b,11.55,b.z-84,10,b.x-38,true);seating(parent,b,11.55,b.z-58,2,9,true);decorateT1ArrivalArt(parent,b,11.3);
  // The 3F public map names specific retailers and service cores; preserve the
  // broad central route and fit those landmarks into the mapped side zones.
  terminal1MappedPublicServices(parent,b,11.55,'3F');terminal1HallPlanters(parent,b,11.55);
 securityHall(parent,b,11.55,b.z+43,6);seating(parent,b,11.55,b.z+64,4,11,true);flightBoards(parent,b,11.55,b.z+82);
 terminal1Lounge(parent,b,16.95);
}
/** Side-facing rooms for the narrow service band shown on T2's 1F airport map. */
function terminal2MappedRoom(parent:THREE.Object3D,x:number,y:number,z:number,w:number,d:number,label:string,kind:'restroom'|'nursing',facing:1|-1){
 const room=new THREE.Group();room.position.set(x,y,z);room.rotation.y=facing*Math.PI/2;
 const floor=material('#c9cbc5',.66,.025),wall=material('#dedfd8',.76,.025),door=material('#697571',.46,.1),trim=material('#9da49e',.42,.2),porcelain=material('#f1f1e9',.26,.035),front=d/2,back=-d/2;
 box(room,w,.14,d,0,.07,0,floor);box(room,w,3.35,.22,0,1.675,back,wall);
 for(const side of [-1,1])box(room,.22,3.35,d,side*w/2,1.675,0,wall);
 for(const side of [-1,1])box(room,w*.24,3.35,.22,side*w*.38,1.675,front,wall);
 box(room,.12,2.55,.12,0,1.275,front,door);box(room,w*.42,.28,.24,0,3.19,front,trim);
 sign(room,label,0,3.88,front+.13,Math.min(w*.9,14),'#6f8983',0,.8);
 if(kind==='restroom'){
  for(let stall=0;stall<3;stall++){
   const sx=(stall-1)*2.55;box(room,.12,2.15,2.3,sx,1.1,-.55,wall);box(room,2.35,.12,.12,sx,2.16,.6,steel);
   box(room,.46,.7,.2,sx,.63,-1.2,porcelain);box(room,.48,.18,.63,sx,.28,-.82,porcelain);
  }
  box(room,5.8,.82,.58,0,.41,front-1.65,counter);box(room,5.95,.13,.7,0,.87,front-1.65,counterTop);
  for(let basin=0;basin<3;basin++){
   const bx=(basin-1)*1.82;box(room,.76,.14,.54,bx,.98,front-1.65,porcelain);box(room,.1,.38,.1,bx,.7,front-1.65,steel);
  }
  box(room,5.55,1.08,.045,0,1.75,front-1.95,new THREE.MeshPhysicalMaterial({color:'#b7c2c1',metalness:.58,roughness:.16,envMapIntensity:.65}));
 }else{
  const upholstery=material('#a99578',.82,.015),babyPad=material('#e7e6dc',.72,.02),partition=material('#d8e1dc',.6,.02);
  box(room,2.2,.42,.95,-3.1,.54,-.6,upholstery);box(room,2.2,.78,.18,-3.1,.96,-1.05,upholstery);
  box(room,1.25,.82,.72,3,.49,-.5,counter);box(room,1.35,.12,.8,3,.96,-.5,counterTop);
  box(room,.82,.9,.62,3,1.48,-.5,porcelain);box(room,1.75,.2,.78,3,.92,1.45,steel);box(room,1.68,.1,.72,3,1.07,1.45,babyPad);
  box(room,.08,2.2,1.9,0,1.1,-.3,partition);box(room,.08,2.2,1.9,0,1.1,-2.25,partition);
 }
 parent.add(room);
}
function terminal2MappedServiceDesk(parent:THREE.Object3D,wallX:number,y:number,z:number,label:string,accent:string,length:number,stations=3){
 const counterX=wallX+3.05,wall=material('#d2d4ce',.58,.06),body=material('#aeb7b2',.48,.24),top=material('#e8e9e2',.32,.08),accentMat=material(accent,.4,.12),dark=material('#23383c',.28,.18),glass=new THREE.MeshPhysicalMaterial({color:'#b6d2ce',roughness:.16,metalness:.04,transparent:true,opacity:.3,depthWrite:false,side:THREE.DoubleSide});
 // Compact counters line the side wall and leave the main carousel aisle open.
 box(parent,.22,3.35,length,wallX,y+1.675,z,wall);box(parent,1.5,1.04,length*.82,counterX,y+.59,z,body);box(parent,1.64,.14,length*.84,counterX,y+1.18,z,top);
 box(parent,1.48,.18,length*.82,counterX,y+1.83,z,accentMat);
 for(let i=0;i<stations;i++){
  const stationZ=z+(i-(stations-1)/2)*(length*.62/Math.max(1,stations-1));
  box(parent,.12,.76,.72,counterX+.78,y+1.71,stationZ,dark);
  box(parent,.055,.44,.59,counterX+1.04,y+1.72,stationZ,new THREE.MeshStandardMaterial({color:'#102d35',emissive:'#1d5258',emissiveIntensity:.34,roughness:.34}));
  box(parent,.1,1.12,.84,counterX+.92,y+2.52,stationZ,glass);box(parent,.1,.06,.88,counterX+.92,y+3.09,stationZ,steel);
 }
 for(const end of [-1,1])box(parent,3.05,3.25,.18,wallX+1.45,y+1.625,z+end*(length/2),wall);
 box(parent,.2,.16,length*.92,wallX+.18,y+3.22,z,accentMat);sign(parent,label,wallX+.22,y+3.78,z,length*.9,accent,Math.PI/2,1.05);
 const queuePosts:Item[]=[];for(const end of [-1,1])queuePosts.push({x:counterX+2.35,y:y+.55,z:z+end*(length*.34),sx:.12,sy:1.1,sz:.12});batch(parent,queuePost,queuePosts);
}
function terminal2ArrivalServiceDesk(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number,label:string,accent:string,length:number,stations=3){
 terminal2MappedServiceDesk(parent,b.x-b.width*.43,y,z,label,accent,length,stations);
}
function terminal2ArrivalServices(parent:THREE.Object3D,b:TerminalBounds,y:number){
 const wallX=b.x-b.width*.43,westX=wallX+3.05+6,eastX=b.x+b.width*.39;
 terminal2ArrivalServiceDesk(parent,b,y,b.z-132,'POST OFFICE  郵局','#56828a',11,1);
 terminal2ArrivalServiceDesk(parent,b,y,b.z-104,'TOURIST SERVICE  旅客服務','#248d86',15,2);
 terminal2ArrivalServiceDesk(parent,b,y,b.z-76,'LION TRAVEL  雄獅旅遊','#77926f',13,2);
 terminal2ArrivalServiceDesk(parent,b,y,b.z+45,'BANK OF TAIWAN  臺灣銀行','#95804e',17,3);
 terminal2ArrivalServiceDesk(parent,b,y,b.z+63,'FOREIGN EXCHANGE  外幣兌換','#a78a50',13,2);
 const caseMat=material('#56635f',.38,.26),display=material('#18343a',.24,.2),keypad=material('#aeb7ae',.42,.32);
 for(let i=0;i<3;i++){
  const z=b.z+82+(i-1)*2.55,x=wallX+1.2;
  box(parent,1.18,2.22,1.05,x,y+1.11,z,caseMat);box(parent,.055,.48,.62,x+.61,y+1.73,z,display);
  box(parent,.055,.28,.34,x+.62,y+1.24,z+.2,keypad);box(parent,.08,.1,.38,x+.62,y+.82,z,steel);
 }
 sign(parent,'ATM  自動提款機',wallX+.24,y+3.48,b.z+82,9,'#627d75',Math.PI/2,.8);
 terminal2MappedRoom(parent,westX,.58,b.z+105,14,11,'NURSING ROOM  哺集乳室','nursing',1);
 terminal2MappedRoom(parent,eastX,.58,b.z-94,15,10,'RESTROOMS  廁所','restroom',-1);
 terminal2MappedRoom(parent,eastX,.58,b.z+43,15,10,'RESTROOMS  廁所','restroom',-1);
 const aedMat=material('#188e79',.42,.06),cabinet=material('#d6dad3',.58,.08),aedPoints=[
  {x:wallX+.24,z:b.z-57,facing:1 as const},{x:wallX+.24,z:b.z+27,facing:1 as const},{x:eastX-.24,z:b.z+15,facing:-1 as const}
 ];
 for(const point of aedPoints){
  box(parent,.24,.98,.9,point.x,y+1.45,point.z,cabinet);box(parent,.08,.64,.58,point.x+point.facing*.16,y+1.45,point.z,aedMat);
  box(parent,.035,.42,.11,point.x+point.facing*.22,y+1.45,point.z,material('#f5f1e7',.4,.03));
  sign(parent,'AED',point.x+point.facing*.2,y+2.28,point.z,1.2,'#188e79',point.facing*Math.PI/2,.44);
 }
}
/** Five glossy animal figures reinterpret Hung Yi's documented T2 arrivals artwork. */
function terminal2ArrivalArt(parent:THREE.Object3D,b:TerminalBounds,y:number){
 const centerX=b.x+24,z=b.z+78,white=material('#f4efe1',.25,.02),black=material('#202b2d',.27,.025),red=material('#e65a45',.26,.025),blue=material('#3593a5',.25,.02),gold=material('#efb936',.25,.025),cream=material('#f6de9a',.25,.02),base=material('#c5c4bb',.42,.08),darkTrim=material('#7d8985',.32,.28);
 const painted=(baseColor:string,accents:string[])=>{
  const map=canvasTexture(512,256,ctx=>{
   ctx.fillStyle=baseColor;ctx.fillRect(0,0,512,256);
   for(let row=0;row<4;row++)for(let col=0;col<8;col++){
    const cx=col*64+(row%2)*32,cy=32+row*64,r=12+(row+col)%3*2;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(((row*7+col*3)%8)*Math.PI/16);
    for(let petal=0;petal<8;petal++){
     ctx.rotate(Math.PI/4);ctx.beginPath();ctx.ellipse(0,-r*.72,r*.28,r*.58,0,0,Math.PI*2);ctx.fillStyle=accents[(row+col+petal)%accents.length];ctx.fill();
    }
    ctx.beginPath();ctx.arc(0,0,r*.28,0,Math.PI*2);ctx.fillStyle=accents[(row+col+2)%accents.length];ctx.fill();
    ctx.restore();
    ctx.fillStyle=accents[(row+col)%accents.length];ctx.beginPath();ctx.arc(cx+27,cy+25,2.5+(col%2),0,Math.PI*2);ctx.fill();
   }
   ctx.strokeStyle='rgba(35,45,42,.65)';ctx.lineWidth=5;for(const yy of [8,248]){ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(512,yy);ctx.stroke();}
  });
  const paint=new THREE.MeshPhysicalMaterial({color:'#fff',map,roughness:.27,metalness:.08,clearcoat:.42,clearcoatRoughness:.2});return paint;
 };
 const paints=[
  painted('#f1bd31',['#c73e32','#197d8d','#f7e8bd']),painted('#e3543c',['#f3c237','#267c86','#f6e2b7']),
  painted('#eee8d7',['#202b2d','#cc4138','#65a69b']),painted('#4a9f94',['#e9b732','#d64a39','#f0dfb5']),
  painted('#f0ca3c',['#df5742','#188a97','#f4e6bf'])
 ],positions=Array.from({length:5},(_,i)=>({x:centerX+(i-2)*9,z}));
 const orb=(x:number,yy:number,zz:number,sx:number,sy:number,sz:number,mat:THREE.Material)=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),mat);mesh.position.set(x,yy,zz);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 const tube=(points:THREE.Vector3[],radius:number,mat:THREE.Material)=>{const curve=new THREE.CatmullRomCurve3(points),mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,24,radius,8,false),mat);mesh.castShadow=true;parent.add(mesh);return mesh;};
 const leg=(x:number,yy:number,zz:number,height:number,radius:number,mat:THREE.Material)=>{const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius*.82,radius,height,12),mat);mesh.position.set(x,yy+height/2,zz);mesh.castShadow=true;parent.add(mesh);};
 const addPalm=(x:number,zz:number)=>{
  const pot=material('#c7c7bd',.48,.08),soil=material('#4b4033',.94,.01),bark=material('#846548',.88,.01),leafMats=['#47785b','#527f5c','#648c62'].map(color=>material(color,.84,.005));
  cylinder(parent,.82,.92,.74,x,y+.37,zz,pot,16);cylinder(parent,.74,.74,.1,x,y+.77,zz,soil,16);
  cylinder(parent,.2,.31,2.45,x,y+1.98,zz,bark,12);
  for(let ring=0;ring<5;ring++)cylinder(parent,.315,.315,.045,x,y+.88+ring*.43,zz,material('#a48a68',.9,.005),12);
  const crown=new THREE.Vector3(x,y+3.16,zz);
  for(let frond=0;frond<9;frond++){
   const angle=frond*Math.PI*2/9,reach=2.0+(frond%3)*.18,drop=.72+(frond%2)*.18;
   const tip=crown.clone().add(new THREE.Vector3(Math.cos(angle)*reach,-drop,Math.sin(angle)*reach)),delta=tip.clone().sub(crown),length=delta.length();
   const leaf=new THREE.Mesh(new THREE.ConeGeometry(.19,length,7),leafMats[frond%leafMats.length]);leaf.position.copy(crown).add(tip).multiplyScalar(.5);leaf.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());leaf.castShadow=true;parent.add(leaf);
   tube([crown.clone(),tip.clone()],.035,leafMats[frond%leafMats.length]);
  }
 };
 addPalm(centerX-34,z+1);addPalm(centerX+34,z+1);
 for(let i=0;i<positions.length;i++){
  const {x,z:animalZ}=positions[i],paint=paints[i],pedestal=box(parent,3.4,.34,3.2,x,y+.17,animalZ,base),foot=box(parent,3.56,.1,3.36,x,y+.08,animalZ,darkTrim);pedestal.castShadow=foot.castShadow=false;
  const feetY=y+.34;
  if(i===0){ // Ox: barrel body, broad muzzle, paired horns and four sturdy legs.
   orb(x,feetY+1.03,animalZ,1.18,.78,1.22,paint);orb(x,feetY+1.77,animalZ+.66,.7,.77,.68,paint);orb(x,feetY+1.43,animalZ+1.18,.46,.35,.34,paint);
   for(const dx of [-.7,.7])for(const dz of [-.77,.77])leg(x+dx,feetY,animalZ+dz,.92,.19,red);
   for(const side of [-1,1]){orb(x+side*.61,feetY+2.03,animalZ+.58,.22,.13,.3,white);tube([new THREE.Vector3(x+side*.32,feetY+2.28,animalZ+.62),new THREE.Vector3(x+side*.55,feetY+2.62,animalZ+.54),new THREE.Vector3(x+side*.88,feetY+2.76,animalZ+.5)],.095,white);}
   const noseRing=new THREE.Mesh(new THREE.TorusGeometry(.27,.055,10,28),steel);noseRing.position.set(x,feetY+1.4,animalZ+1.53);noseRing.castShadow=true;parent.add(noseRing);
   const cartX=x+1.86,cartZ=animalZ+.1,wheelMat=material('#343b3a',.52,.2),cartPaint=material('#d64236',.3,.1);
   box(parent,1.48,.18,1.06,cartX,feetY+.42,cartZ,cartPaint);box(parent,1.34,.12,.92,cartX,feetY+.57,cartZ,paint);
   for(const side of [-1,1]){const wheel=new THREE.Mesh(new THREE.TorusGeometry(.29,.075,8,20),wheelMat);wheel.position.set(cartX+side*.48,feetY+.24,cartZ+.38);wheel.castShadow=true;parent.add(wheel);}
   tube([new THREE.Vector3(cartX-.4,feetY+.52,cartZ-.4),new THREE.Vector3(cartX-.85,feetY+.78,cartZ-.64),new THREE.Vector3(x+.94,feetY+1.2,animalZ+.05)],.06,steel);
   for(let cup=0;cup<3;cup++){
    const cupY=feetY+.72+cup*.37,cupMat=[red,gold,blue][cup],cupX=cartX+(cup%2-.5)*.4;
    cylinder(parent,.23,.29,.32,cupX,cupY,cartZ,cupMat,10);box(parent,.06,.055,.03,cupX-.08,cupY+.02,cartZ+.26,black);box(parent,.06,.055,.03,cupX+.08,cupY+.02,cartZ+.26,black);
   }
  }else if(i===1){ // Dog: forward ears, long torso, lifted curved tail.
   orb(x,feetY+1.0,animalZ,1.0,.58,1.28,paint);orb(x,feetY+1.65,animalZ+.82,.62,.66,.64,paint);orb(x,feetY+1.38,animalZ+1.3,.43,.28,.38,black);
   for(const dx of [-.63,.63])for(const dz of [-.76,.76])leg(x+dx,feetY,animalZ+dz,.8,.14,paint);
   for(const side of [-1,1])orb(x+side*.42,feetY+1.74,animalZ+.78,.18,.43,.22,i===1?blue:paint);
   tube([new THREE.Vector3(x-.1,feetY+1.42,animalZ-1.02),new THREE.Vector3(x-.48,feetY+1.67,animalZ-1.35),new THREE.Vector3(x-.42,feetY+2.0,animalZ-1.48)],.12,red);
  }else if(i===2){ // Black-faced spoonbill: white body, black head, long flattened bill and red legs.
   orb(x,feetY+1.08,animalZ,.77,.9,1.0,paint);const wing=orb(x-.32,feetY+1.22,animalZ-.02,.38,.72,.82,paint);wing.rotation.z=-.2;
   orb(x,feetY+2.13,animalZ+.58,.42,.48,.4,black);orb(x,feetY+2.04,animalZ+1.12,.13,.12,.72,black);orb(x,feetY+2.04,animalZ+1.72,.24,.105,.24,black);
   leg(x-.28,feetY,animalZ,.98,.065,red);leg(x+.28,feetY,animalZ,.98,.065,red);for(const dx of [-.28,.28])tube([new THREE.Vector3(x+dx,feetY+.08,animalZ+.1),new THREE.Vector3(x+dx,feetY+.06,animalZ+.42),new THREE.Vector3(x+dx,feetY+.05,animalZ+.54)],.055,red);
  }else if(i===3){ // Cat: upright seated body, tapered ears, bright eyes and curling tail.
   orb(x,feetY+1.05,animalZ,.74,.94,.68,paint);orb(x,feetY+1.92,animalZ+.3,.62,.62,.56,paint);
   for(const side of [-1,1]){const ear=new THREE.Mesh(new THREE.ConeGeometry(.24,.65,5),paint);ear.position.set(x+side*.38,feetY+2.45,animalZ+.29);ear.rotation.z=side*.1;parent.add(ear);orb(x+side*.2,feetY+2.0,animalZ+.79,.07,.07,.05,cream);}
   orb(x,feetY+.62,animalZ+.63,.55,.3,.5,paint);tube([new THREE.Vector3(x-.5,feetY+.7,animalZ-.12),new THREE.Vector3(x-1.04,feetY+.8,animalZ-.4),new THREE.Vector3(x-1.08,feetY+1.22,animalZ-.72),new THREE.Vector3(x-.82,feetY+1.62,animalZ-.77)],.13,blue);
  }else{ // Duck: rounded breast, broad bill, folded wings and webbed feet.
   orb(x,feetY+1.0,animalZ,.92,.82,1.05,paint);orb(x,feetY+1.73,animalZ+.68,.58,.59,.58,paint);orb(x,feetY+1.57,animalZ+1.2,.42,.18,.35,red);
   const wing=orb(x-.52,feetY+1.08,animalZ+.08,.37,.48,.72,white);wing.rotation.z=-.16;
   leg(x-.32,feetY,animalZ+.2,.36,.12,red);leg(x+.32,feetY,animalZ+.2,.36,.12,red);
   for(const side of [-1,1]){box(parent,.62,.1,.36,x+side*.32,feetY+.05,animalZ+.54,red);orb(x+side*.32,feetY+1.89,animalZ+1.22,.055,.055,.04,black);}
  }
 }
}
/** Fused-glass public artwork mounted beside T2's 7/8 baggage-belt pair. */
function terminal2WanLaiArt(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number){
 const width=13.49,height=3.45,wallX=b.x-b.width/2+3.2,frame=material('#515a57',.34,.62),texture=canvasTexture(1024,256,ctx=>{
  const sky=ctx.createLinearGradient(0,0,0,256);sky.addColorStop(0,'#123d69');sky.addColorStop(.48,'#df7836');sky.addColorStop(1,'#e7c66a');ctx.fillStyle=sky;ctx.fillRect(0,0,1024,256);
  const glass=['#143c70','#1f7190','#e57a38','#d54e34','#efb934','#6b934d','#557ca0','#c9a64d'];
  // Irregular leaded-glass panels echo the piece's church-window construction.
  for(let row=0;row<4;row++)for(let col=0;col<12;col++){
   const left=col*86+(row%2)*20,top=row*64,shift=((row*13+col*7)%23)-11;
   ctx.beginPath();ctx.moveTo(left,top);ctx.lineTo(left+84,top+shift);ctx.lineTo(left+84,top+64);ctx.lineTo(left,top+64-shift);ctx.closePath();ctx.fillStyle=glass[(row*3+col)%glass.length];ctx.globalAlpha=.56;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle='#21343d';ctx.lineWidth=4;ctx.stroke();
  }
  // Sun and moon form the opposing sky symbols in the documented composition.
  ctx.save();ctx.translate(210,119);ctx.fillStyle='#f0c443';for(let ray=0;ray<16;ray++){ctx.save();ctx.rotate(ray*Math.PI/8);ctx.beginPath();ctx.moveTo(-9,-72);ctx.lineTo(0,-121);ctx.lineTo(9,-72);ctx.closePath();ctx.fill();ctx.restore();}ctx.beginPath();ctx.arc(0,0,63,0,Math.PI*2);ctx.fillStyle='#e9ae32';ctx.fill();ctx.strokeStyle='#5d3c2c';ctx.lineWidth=5;ctx.stroke();ctx.restore();
  ctx.save();ctx.translate(817,110);ctx.beginPath();ctx.arc(0,0,58,0,Math.PI*2);ctx.fillStyle='#f2dfa3';ctx.fill();ctx.beginPath();ctx.arc(24,-16,54,0,Math.PI*2);ctx.fillStyle='#27658a';ctx.fill();ctx.restore();
  // Central pineapple: faceted fruit, cross-hatched scales and a fan of leaves.
  ctx.beginPath();ctx.moveTo(511,38);ctx.lineTo(579,78);ctx.lineTo(563,190);ctx.lineTo(511,222);ctx.lineTo(459,190);ctx.lineTo(443,78);ctx.closePath();
  const fruit=ctx.createLinearGradient(443,0,579,0);fruit.addColorStop(0,'#bc6e2d');fruit.addColorStop(.45,'#f5c638');fruit.addColorStop(1,'#d98b28');ctx.fillStyle=fruit;ctx.fill();ctx.strokeStyle='#49392e';ctx.lineWidth=8;ctx.stroke();
  ctx.save();ctx.beginPath();ctx.moveTo(443,78);ctx.lineTo(579,78);ctx.lineTo(563,190);ctx.lineTo(511,222);ctx.lineTo(459,190);ctx.closePath();ctx.clip();
  ctx.strokeStyle='rgba(92,55,31,.82)';ctx.lineWidth=5;for(let offset=-130;offset<170;offset+=24){ctx.beginPath();ctx.moveTo(430+offset,75);ctx.lineTo(565+offset,220);ctx.moveTo(565+offset,75);ctx.lineTo(430+offset,220);ctx.stroke();}
  ctx.restore();
  ctx.fillStyle='#477247';for(let leaf=0;leaf<9;leaf++){const tipX=511+(leaf-4)*29,tipY=5+Math.abs(leaf-4)*8;ctx.beginPath();ctx.moveTo(511,72);ctx.quadraticCurveTo(tipX+(leaf-4)*8,30,tipX,tipY);ctx.quadraticCurveTo(500+(leaf-4)*7,43,511,72);ctx.fill();ctx.strokeStyle='#293e31';ctx.lineWidth=3;ctx.stroke();}
  // Lead strips divide the colored glass into robust, readable facets.
  ctx.strokeStyle='rgba(34,45,47,.88)';ctx.lineWidth=5;for(let x=0;x<=1024;x+=128){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,256);ctx.stroke();}
  for(let yy=64;yy<256;yy+=64){ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(1024,yy);ctx.stroke();}
  ctx.strokeStyle='#c8b474';ctx.lineWidth=10;ctx.strokeRect(8,8,1008,240);
 });
 texture.anisotropy=8;
 box(parent,width+.42,height+.34,.22,wallX,y+height/2,z,frame,Math.PI/2);
 const backing=box(parent,width,height,.07,wallX+.13,y+height/2,z,material('#28333a',.45,.22),Math.PI/2);backing.castShadow=false;
 const glass=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshPhysicalMaterial({map:texture,color:'#fff',roughness:.23,metalness:.05,clearcoat:.4,clearcoatRoughness:.18,emissive:'#2b2114',emissiveIntensity:.12,side:THREE.DoubleSide}));
 glass.position.set(wallX+.18,y+height/2,z);glass.rotation.y=Math.PI/2;glass.castShadow=false;glass.receiveShadow=true;parent.add(glass);
 const rail=material('#d4d7cf',.3,.66);for(const side of [-1,1])box(parent,.12,height+.1,.12,wallX+.24,y+height/2,z+side*(width/2-.08),rail);
 for(const edge of [-1,1])box(parent,width,.12,.12,wallX+.24,y+height/2+edge*(height/2-.08),z,rail,Math.PI/2);
}
function terminal2(parent:THREE.Object3D,b:TerminalBounds,mats:TerminalMaterials){
 const levels=[.36,6.25,12.35,18.55,23.45],atrium={fromLevel:3,x:b.x,z:b.z-42,width:110,depth:140},finishes=deckFinishes('T2',mats),lowerFloor=terminalFloor('T2','lower');addDecks(parent,b,levels,mats.concrete,.16,atrium,finishes,undefined,new Map([[0,lowerFloor],[1,lowerFloor]]));const arrivalCeilingY=levels[1]-.17-.17-.012;terminal2ArrivalCeilingGrid(parent,b,arrivalCeilingY);terminal2ArrivalDropCeiling(parent,b,arrivalCeilingY);terminalAtriumEdgeDetail(parent,atrium,levels,'T2');addStructure(parent,b,finishes.structure,'T2');verticalCirculation(parent,b,levels,'T2');
 baggageClaim(parent,b,.58,b.z-30,6,'x',b.x,1);
 baggageClaim(parent,b,.58,b.z-55,2,'x',b.x-58,7);terminal2WanLaiArt(parent,b,.58,b.z-55);
 customsHall(parent,b,.58,b.z-23);arrivalLobby(parent,b,.58,b.z+24,.72,false);terminal2ArrivalServices(parent,b,.58);terminal2ArrivalArt(parent,b,.58);sign(parent,'MRT  機場捷運',b.x+b.width*.28,.58+4,b.z+70,11,'#6f9898');
  terminal2TransferServices(parent,b,6.48);securityHall(parent,b,6.48,b.z+48,4,'#86b9b8','TRANSFER SECURITY  轉機安檢');
 checkInHall(parent,b,12.62,b.z-67,5,[5,5,6,5,5],1,'T2');
 terminal2DepartureImmigration(parent,b,12.62,b.z+5);
 securityHall(parent,b,12.62,b.z+37,7);flightBoards(parent,b,12.62,b.z+60);seating(parent,b,12.62,b.z+78,3,12,true);
 terminal2DepartureRetailAndServices(parent,b,12.62);
 // The public 4F plan separates named eateries, lounge suites and the south dining area.
 const fourthFloorAtrium={x:b.x+T2_FOURTH_FLOOR_LAYOUT.atrium.xOffset,z:b.z+T2_FOURTH_FLOOR_LAYOUT.atrium.zOffset,width:T2_FOURTH_FLOOR_LAYOUT.atrium.width,depth:T2_FOURTH_FLOOR_LAYOUT.atrium.depth};
 for(const shop of T2_FOURTH_FLOOR_SHOPS)terminal2FourthFloorShop(parent,b,18.82,shop);
 for(let i=0;i<T2_FOURTH_FLOOR_LOUNGES.length;i++)terminal2FourthFloorLounge(parent,b,18.82,i);
 terminal2AtriumDining(parent,b,18.82,fourthFloorAtrium);terminal2FoodCourt(parent,b,18.82);
 addT2TempleAvenue(parent,b,23.72);observationDeck(parent,b,23.72,-1);observationDeck(parent,b,23.72,1);terminal2DeckAmenities(parent,b,23.72,-1);terminal2DeckAmenities(parent,b,23.72,1);
 decorateTerminal2(parent,b);
}
function terminal3Main(parent:THREE.Object3D,b:TerminalBounds,mats:TerminalMaterials){
 const levels=[2.42,8.65,14.9,21.15,27.35];addDecks(parent,b,levels,mats.concrete,.2);addStructure(parent,b,pillar);verticalCirculation(parent,b,levels);
 baggageClaim(parent,b,2.68,b.z+57,5);customsHall(parent,b,2.68,b.z+85);arrivalLobby(parent,b,2.68,b.z+104);
 checkInHall(parent,b,8.92,b.z-26,6,6,1);securityHall(parent,b,15.17,b.z+10,9);flightBoards(parent,b,15.17,b.z+38);seating(parent,b,15.17,b.z+62,5,18,true);
 immigrationHall(parent,b,21.42,b.z-14,12);sign(parent,'TRANSFER SECURITY  轉機安檢',b.x,21.42+5.4,b.z+35,45,'#70aeb6');addRetailLevel(parent,b,27.62,false);
 // Clear-span structural trusses are visible above the public hall through the glass.
 const trusses:Item[]=[];for(let x=b.x-b.width*.42;x<=b.x+b.width*.42;x+=18)trusses.push({x,y:b.height-1.25,z:b.z,sx:.22,sy:1.05,sz:b.depth*.82,color:'#9ba8aa'});batch(parent,steel,trusses);
}
function terminal3South(parent:THREE.Object3D,b:TerminalBounds,mats:TerminalMaterials){
 const levels=[.38,7.15];addDecks(parent,b,levels,mats.concrete,.12);addStructure(parent,b,pillar);verticalCirculation(parent,b,levels);securityHall(parent,b,.58,b.z-12,8);seating(parent,b,.58,b.z+15,5,18,true);shops(parent,b,7.45,b.z,6,'food');
}
function massageChairArea(parent:THREE.Object3D,b:TerminalBounds,gateSide:-1|1){
 const bases:RotItem[]=[],cushions:RotItem[]=[],backs:RotItem[]=[],headrests:RotItem[]=[],footrests:RotItem[]=[],arms:RotItem[]=[],controls:RotItem[]=[];
 for(let bank=0;bank<5;bank++){
  const cx=b.x+(bank-2)*b.width*.16;
  for(let chair=0;chair<6;chair++){
   const col=chair%3-1,row=Math.floor(chair/3),x=cx+col*1.9,z=b.z+gateSide*(4.4+row*2.55),rx=-gateSide*.2;
   bases.push({x,y:.48,z,sx:1.34,sy:.3,sz:1.62,rx:0});
   cushions.push({x,y:1.02,z:z-gateSide*.15,sx:1.1,sy:.34,sz:1.04,rx:0});
   backs.push({x,y:1.72,z:z-gateSide*.72,sx:1.1,sy:1.35,sz:.3,rx});
   headrests.push({x,y:2.42,z:z-gateSide*1.22,sx:.78,sy:.38,sz:.32,rx});
   footrests.push({x,y:.62,z:z+gateSide*1.08,sx:1.08,sy:.2,sz:.72,rx:gateSide*.08});
   for(const side of [-1,1])arms.push({x:x+side*.68,y:1.14,z,sx:.18,sy:.36,sz:1.25,rx:0});
   controls.push({x:x+.82,y:1.48,z:z+gateSide*.2,sx:.18,sy:.36,sz:.3,rx:0});
  }
 }
 batchX(parent,steel,bases);batchX(parent,seatDark,cushions);batchX(parent,seatDark,backs);batchX(parent,seatOrange,headrests);batchX(parent,seatDark,footrests);batchX(parent,steel,arms);batchX(parent,screen,controls);
 sign(parent,'MASSAGE CHAIRS  按摩椅',b.x,4.45,b.z+gateSide*7.8,34,'#e2aa58',gateSide>0?Math.PI:0);
}
function chargingStations(parent:THREE.Object3D,b:TerminalBounds,gateSide:-1|1){
 const bases:Item[]=[],tops:Item[]=[],outlets:Item[]=[],stools:Item[]=[];
 for(let i=0;i<8;i++){
  const x=b.x+(i-3.5)*b.width*.105,z=b.z-gateSide*12;
  bases.push({x,y:.62,z,sx:11.5,sy:1.15,sz:.82});tops.push({x,y:1.25,z,sx:11.8,sy:.16,sz:1.04});
  for(const side of [-1,1]){stools.push({x:x+side*3.55,y:.58,z:z+gateSide*1.35,sx:1.15,sy:.2,sz:.75});outlets.push({x:x+side*2.15,y:1.4,z:z-gateSide*.42,sx:.3,sy:.26,sz:.1});}
 }
 batch(parent,steel,bases);batch(parent,counterTop,tops);batch(parent,seatDark,stools);batch(parent,accentBlue,outlets);
 sign(parent,'CHARGING SEATS  充電座位',b.x,3.2,b.z-gateSide*15,34,'#72b9be',gateSide<0?Math.PI:0);
}
function vendingMachines(parent:THREE.Object3D,b:TerminalBounds,gateSide:-1|1){
 const cases:Item[]=[],glazing:Item[]=[],products:Item[]=[],controls:Item[]=[];const x0=b.x-b.width*.42,z=b.z-gateSide*9;
 for(let i=0;i<4;i++){
  const x=x0+i*3.1;cases.push({x,y:1.48,z,sx:2.35,sy:2.96,sz:1.35});glazing.push({x:x-.22,y:1.68,z:z+gateSide*.69,sx:1.55,sy:1.94,sz:.08});controls.push({x:x+.78,y:1.38,z:z+gateSide*.75,sx:.26,sy:.46,sz:.08});
  for(let row=0;row<3;row++)for(let col=0;col<3;col++)products.push({x:x-.65+col*.45,y:.97+row*.53,z:z+gateSide*.76,sx:.26,sy:.3,sz:.18,color:['#d29c54','#729b9e','#b75342'][(i+row+col)%3]});
 }
 batch(parent,steel,cases);batch(parent,shopGlass,glazing);batch(parent,accentBlue,controls);batch(parent,seatWarm,products);
 sign(parent,'VENDING  自動販賣',x0+4.65,3.7,z+gateSide*.9,17,'#d4aa50',gateSide>0?0:Math.PI);
}
function terminal3North(parent:THREE.Object3D,b:TerminalBounds,mats:TerminalMaterials,gates:Gate[],gateSide:-1|1){
 const levels=[.36,6.7];addDecks(parent,b,levels,mats.concrete,.08);addStructure(parent,b,pillar);verticalCirculation(parent,b,levels);
 const orange=material('#e26c36',.43,.08),yellow=material('#e4b84d',.46,.08),seats:Item[]=[],tables:Item[]=[],posts:Item[]=[],panels:Item[]=[];const sorted=[...gates].sort((a,b)=>a.x-b.x);
 sign(parent,'NORTH CONCOURSE  北登機廊廳',b.x,10.2,b.z+gateSide*(b.depth/2-2.5),Math.min(b.width*.48,70),'#e18a45',gateSide<0?Math.PI:0);
 sorted.forEach((g,i)=>{const x=g.x,sideZ=b.z+gateSide*(b.depth/2-8);box(parent,11,4.5,.55,x,3.1,sideZ,orange);box(parent,12,.26,.8,x,5.5,sideZ,yellow);sign(parent,`GATE  ${g.id}  登機門`,x,5.5,sideZ+gateSide*.42,9.5,'#e69c4d',gateSide<0?Math.PI:0);
  for(let row=0;row<3;row++)for(let seat=0;seat<5;seat++){const sx=x+(seat-2)*1.65,sz=b.z+gateSide*(b.depth*.17+row*2.3);seats.push({x:sx,y:1.05,z:sz,sx:1.3,sy:.2,sz:.68,color:i%2?'#d9703e':'#d6aa48'},{x:sx,y:1.75,z:sz-gateSide*.25,sx:1.3,sy:1.08,sz:.16,color:i%2?'#b94c3e':'#db8b3d'});}
  tables.push({x:x+6.4,y:1.15,z:b.z+gateSide*6.4,sx:2.8,sy:.18,sz:1.1});posts.push({x:x+6.4,y:1.75,z:b.z+gateSide*6.4,sx:.14,sy:1.3,sz:.14});panels.push({x,y:8.6,z:b.z+gateSide*4,sx:7.4,sy:.26,sz:.32,color:'#f3eee2'});
 });
 batch(parent,seatOrange,seats);batch(parent,steel,tables);batch(parent,steel,posts);batch(parent,light,panels);
 shops(parent,b,.58,b.z-gateSide*4,3,'food');massageChairArea(parent,b,gateSide);chargingStations(parent,b,gateSide);vendingMachines(parent,b,gateSide);
 for(let x=b.x-b.width/2+35;x<=b.x+b.width/2-35;x+=54){const halo=new THREE.Mesh(new THREE.TorusGeometry(3.1,.15,8,36),light);halo.rotation.x=Math.PI/2;halo.position.set(x,b.height-1.4,b.z);halo.scale.set(1.65,1,1);halo.castShadow=false;parent.add(halo);const center=new THREE.Mesh(new THREE.SphereGeometry(.75,12,8),yellow);center.position.set(x,b.height-3.6,b.z);center.castShadow=false;parent.add(center);}
 const ledges:Item[]=[];for(const side of [-1,1])ledges.push({x:b.x,y:8.2,z:b.z+side*(b.depth*.31),sx:b.width*.94,sy:.28,sz:.3});batch(parent,steel,ledges);
 decorateT3North(parent,b,gates,gateSide);
}

export function buildTerminalInterior(parent:THREE.Object3D,b:TerminalBounds,profile:TerminalInteriorProfile,mats:TerminalMaterials,gates:Gate[]=[],gateSide:-1|1=1){
 if(profile==='T1')terminal1(parent,b,mats);else if(profile==='T2')terminal2(parent,b,mats);else if(profile==='T3')terminal3Main(parent,b,mats);else if(profile==='T3-S')terminal3South(parent,b,mats);else terminal3North(parent,b,mats,gates,gateSide);
}
