import * as THREE from 'three';
import type {Gate} from '../data/airport';
import {box,canvasTexture,instances,material,seeded} from './primitives';
import type {TerminalBounds,TerminalMaterials} from './terminalArchitecture';
import {decorateT3North,decorateTerminal2} from './terminalInteriorFidelity';

export type TerminalInteriorProfile='T1'|'T2'|'T3'|'T3-S'|'T3-N';
type Item={x:number;y:number;z:number;sx:number;sy:number;sz:number;ry?:number;color?:THREE.ColorRepresentation};
type RotItem=Item&{rx:number};
const unitBox=new THREE.BoxGeometry(1,1,1),steel=material('#aeb8b8',.42,.42),pillar=material('#b8c1c0',.48,.32),counter=material('#c7cdca',.52,.12),counterTop=material('#eef0e9',.3,.08),screen=material('#142a33',.28,.22),belt=material('#303d40',.72,.1),queuePost=material('#879397',.38,.58),warmWood=material('#765e46',.58,.1),shopGlass=material('#91a9aa',.24,.18),seatDark=material('#3e555d',.62,.12),seatWarm=material('#b77e37',.58,.08),seatOrange=material('#df6d3d',.54,.1),light= new THREE.MeshStandardMaterial({color:'#fff3d4',emissive:'#f0ca7c',emissiveIntensity:.58,roughness:.38}),ceilingStrip=new THREE.MeshStandardMaterial({color:'#fff7e8',emissive:'#ffedcf',emissiveIntensity:.95,roughness:.5}),accentBlue=material('#087d91',.4,.15),accentRed=material('#b34336',.46,.08),t1Island=material('#ffffff',.48,.22),t2Island=material('#ffffff',.42,.34),islandTrim=material('#c3c8c3',.36,.42),foodCourtGold=material('#e6b83e',.42,.24),foodCourtIvory=material('#efeee7',.48,.08),foodCourtSeat=material('#f2f1e9',.6,.06),beltRoller=material('#b6bfba',.34,.62),signCache=new Map<string,THREE.Material>();
type DeckFinishes={floor:THREE.Material;ceiling:THREE.Material;edge:THREE.Material;structure:THREE.Material};
const finishCache=new Map<string,THREE.Material>();
const interiorReflectionCache=new Map<'T1'|'T2',THREE.CubeTexture>();

/** A low-cost indoor reflection card keeps polished stone from reflecting the outdoor sky. */
function interiorReflection(profile:'T1'|'T2'){
 const cached=interiorReflectionCache.get(profile);if(cached)return cached;
 const face=()=>{const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;return canvas;},faces=Array.from({length:6},face),contexts=faces.map(c=>c.getContext('2d')!);
 const t1=profile==='T1',ceiling=contexts[2],background=t1?'#e5e7e2':'#303938',frame=t1?'rgba(111,119,115,.24)':'rgba(13,21,21,.78)';
 ceiling.fillStyle=background;ceiling.fillRect(0,0,256,256);
 if(t1){
  for(let y=0;y<256;y+=56){ceiling.fillStyle=y%112?'#eef0eb':'#f4f4ef';ceiling.fillRect(0,y,256,52);}
  ceiling.strokeStyle=frame;ceiling.lineWidth=3;for(let p=0;p<=256;p+=56){ceiling.beginPath();ceiling.moveTo(p,0);ceiling.lineTo(p,256);ceiling.stroke();}
  ceiling.strokeStyle='rgba(255,231,188,.9)';ceiling.lineWidth=5;for(let x=20;x<256;x+=72){ceiling.beginPath();ceiling.moveTo(x,0);ceiling.lineTo(x,256);ceiling.stroke();}
 }else{
  ceiling.strokeStyle=frame;ceiling.lineWidth=7;for(let p=0;p<=256;p+=48){ceiling.beginPath();ceiling.moveTo(p,0);ceiling.lineTo(p,256);ceiling.moveTo(0,p);ceiling.lineTo(256,p);ceiling.stroke();}
  ceiling.strokeStyle='rgba(132,146,137,.4)';ceiling.lineWidth=2;for(let y=0;y<256;y+=96){ceiling.beginPath();ceiling.moveTo(0,y);ceiling.lineTo(256,y+72);ceiling.stroke();}
  ceiling.fillStyle='rgba(255,247,219,.86)';for(let y=32;y<256;y+=88)for(let x=32;x<256;x+=88){ceiling.beginPath();ceiling.ellipse(x,y,12,8,0,0,Math.PI*2);ceiling.fill();}
 }
 for(const index of [0,1,4,5]){
  const ctx=contexts[index],gradient=ctx.createLinearGradient(0,0,0,256);
  gradient.addColorStop(0,t1?'#cfd5d2':'#434b49');gradient.addColorStop(.48,t1?'#aeb6b3':'#313b39');gradient.addColorStop(1,t1?'#929a98':'#222b2b');ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
  ctx.strokeStyle=t1?'rgba(83,96,94,.3)':'rgba(13,22,22,.78)';ctx.lineWidth=3;for(let x=24;x<256;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,256);ctx.stroke();}
  if(t1){
   // The pale T1 hall returns long roof lights as soft bands across its stone.
   ctx.fillStyle='rgba(255,241,211,.58)';ctx.fillRect(0,112,256,4);ctx.fillRect(0,177,256,3);
   ctx.fillStyle='rgba(230,235,229,.52)';ctx.fillRect(0,70,256,2);ctx.fillRect(0,211,256,2);
  }else{
   // T2's dark truss and broad flower pendants create distinct glossy highlights.
   ctx.fillStyle='rgba(255,246,215,.38)';ctx.fillRect(0,88,256,3);ctx.fillRect(0,190,256,3);
   for(const y of [112,165])for(let x=28;x<256;x+=72){
    ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(255,250,232,.55)';
    for(let petal=0;petal<6;petal++){ctx.save();ctx.rotate(petal*Math.PI/3);ctx.beginPath();ctx.ellipse(0,-7,4.2,8,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    ctx.beginPath();ctx.arc(0,0,3.2,0,Math.PI*2);ctx.fillStyle='rgba(255,232,179,.65)';ctx.fill();ctx.restore();
   }
  }
 }
 contexts[3].fillStyle=t1?'#d8dad5':'#858575';contexts[3].fillRect(0,0,256,256);
 const texture=new THREE.CubeTexture(faces);texture.mapping=THREE.CubeReflectionMapping;texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;interiorReflectionCache.set(profile,texture);return texture;
}

function terminalFloor(profile:'T1'|'T2'){
 const key=`${profile}-floor`,cached=finishCache.get(key);if(cached)return cached;
 const rand=seeded(profile==='T1'?11807:21807),texture=canvasTexture(512,512,ctx=>{
  const t1=profile==='T1',base=t1?'#c5c9c7':'#999b8d';ctx.fillStyle=base;ctx.fillRect(0,0,512,512);
  // Large, quiet stone modules with real-scale joints. T1 is pale cool terrazzo;
  // T2 is the darker, slightly green-grey polished stone visible in hall photos.
  const delta=Math.floor((rand()-.5)*8),shade=t1?199+delta:146+delta,tileSize=128;
  for(let y=2;y<512;y+=tileSize)for(let x=2;x<512;x+=tileSize){
   const variation=Math.floor((rand()-.5)*(t1?5:9)),r=THREE.MathUtils.clamp(shade+variation,0,255),g=THREE.MathUtils.clamp(shade+(t1?1:7)+variation,0,255),b=THREE.MathUtils.clamp(shade+(t1?2:-16)+variation,0,255);
   ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(x,y,tileSize-2,tileSize-2);
   const tileWash=ctx.createLinearGradient(x,y,x+tileSize,y+tileSize);tileWash.addColorStop(0,'rgba(255,255,255,.1)');tileWash.addColorStop(.55,'rgba(255,255,255,.015)');tileWash.addColorStop(1,'rgba(25,32,31,.035)');ctx.fillStyle=tileWash;ctx.fillRect(x+1,y+1,tileSize-4,tileSize-4);
  }
  const wash=ctx.createLinearGradient(0,0,512,512);wash.addColorStop(0,'rgba(255,255,255,.18)');wash.addColorStop(.46,'rgba(255,255,255,.035)');wash.addColorStop(1,'rgba(31,39,37,.055)');ctx.fillStyle=wash;ctx.fillRect(2,2,508,508);
  // Low-contrast cloudy mineral variation breaks the repeated colour-block look.
  for(let i=0;i<64;i++){const x=rand()*512,y=rand()*512,r=9+rand()*28,light=rand()>.48,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,t1?(light?'rgba(248,249,245,.10)':'rgba(74,82,82,.055)'):(light?'rgba(205,214,197,.10)':'rgba(35,51,45,.12)'));g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  for(let i=0;i<10500;i++){const v=Math.floor(105+rand()*125),alpha=.022+rand()*.048;ctx.fillStyle=`rgba(${v},${v+((i%3)-1)*2},${Math.max(0,v+(t1?1:-5))},${alpha})`;const size=.6+rand()*1.8;ctx.fillRect(rand()*512,rand()*512,size,size);}
  ctx.strokeStyle=t1?'rgba(55,65,66,.14)':'rgba(45,55,49,.19)';ctx.lineWidth=.9;ctx.beginPath();for(let p=0;p<=512;p+=tileSize){ctx.moveTo(p,0);ctx.lineTo(p,512);ctx.moveTo(0,p);ctx.lineTo(512,p);}ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(4,6);ctx.lineTo(508,6);ctx.moveTo(6,4);ctx.lineTo(6,508);ctx.stroke();
  ctx.globalAlpha=.13;ctx.fillStyle=t1?'#626c6c':'#414d47';for(let y=18;y<512;y+=23)for(let x=20+(Math.floor(y/23)%2)*13;x<512;x+=37)ctx.fillRect(x,y,1.2,1.2);ctx.globalAlpha=1;
 });texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=8;
 // Keep the stone readable under daylight. Strong self-emission had washed out
 // the grain, grout and T2's characteristic muted green-grey floor tone.
 const mat=new THREE.MeshPhysicalMaterial({color:profile==='T1'?'#fafaf6':'#e7ecdf',map:texture,bumpMap:texture,bumpScale:profile==='T1'?.006:.009,roughness:profile==='T1'?.13:.17,metalness:.025,clearcoat:profile==='T1'?.82:.76,clearcoatRoughness:profile==='T1'?.11:.14,emissive:profile==='T1'?'#77766f':'#8d8967',emissiveIntensity:profile==='T1'?.12:.24});
 // Outdoor sky reflections look like windows on an indoor floor. Keep a low,
 // soft return so the polished stone reads without reflecting airport clouds.
 mat.userData.worldUV=1/3.2;mat.userData.reflectionIntensity=profile==='T1'?1.02:.92;mat.userData.reflectionMap=interiorReflection(profile);mat.userData.indoorReflection=1;mat.userData.terminalFloorProfile=profile;finishCache.set(key,mat);return mat;
}
function terminalCeiling(profile:'T1'|'T2'){
 const key=`${profile}-ceiling`,cached=finishCache.get(key);if(cached)return cached;
 const texture=canvasTexture(512,512,ctx=>{
  const t1=profile==='T1';ctx.fillStyle=t1?'#edeee9':'#d6d8d1';ctx.fillRect(0,0,512,512);
  for(let y=0;y<512;y+=64)for(let x=0;x<512;x+=64){ctx.fillStyle=((x/64+y/64)%2===0)?(t1?'rgba(255,255,250,.24)':'rgba(240,242,234,.12)'):(t1?'rgba(76,86,86,.035)':'rgba(37,48,48,.07)');ctx.fillRect(x+2,y+2,60,60);}
  ctx.strokeStyle=t1?'rgba(72,83,82,.18)':'rgba(36,46,45,.28)';ctx.lineWidth=1.6;for(let p=0;p<=512;p+=64){ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,512);ctx.moveTo(0,p);ctx.lineTo(512,p);ctx.stroke();}
  ctx.fillStyle=t1?'rgba(83,94,92,.08)':'rgba(25,34,34,.16)';for(let y=12;y<512;y+=24)for(let x=12;x<512;x+=24)ctx.fillRect(x,y,1.4,1.4);
 });texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=8;
 const lamps=canvasTexture(512,512,ctx=>{
  ctx.fillStyle='#000000';ctx.fillRect(0,0,512,512);
  if(profile==='T1')for(const y of [128,384]){ctx.fillStyle='#d3cbbb';ctx.fillRect(160,y-6,192,12);ctx.fillStyle='#fff4dc';ctx.fillRect(166,y-3,180,6);}
  else for(const y of [128,384])for(const x of [128,384]){ctx.fillStyle='#c9c5b6';ctx.fillRect(x-24,y-20,48,40);ctx.fillStyle='#fff0ca';ctx.fillRect(x-19,y-15,38,30);}
 });lamps.wrapS=lamps.wrapT=THREE.RepeatWrapping;lamps.anisotropy=8;
 const mat=new THREE.MeshStandardMaterial({color:profile==='T1'?'#f1f2ec':'#e5e5dd',map:texture,roughness:.84,metalness:.012,emissive:'#fff1d5',emissiveMap:lamps,emissiveIntensity:.42});mat.userData.worldUV=1/9.6;finishCache.set(key,mat);return mat;
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
function signMaterial(label:string,accent:string){const key=label+'|'+accent;const cached=signCache.get(key);if(cached)return cached;const texture=canvasTexture(768,192,ctx=>{ctx.fillStyle='#10242c';ctx.fillRect(0,0,768,192);ctx.fillStyle=accent;ctx.fillRect(0,0,15,192);ctx.fillStyle='#f6f4ec';ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='bold 62px Arial,sans-serif';ctx.fillText(label,42,96,690);ctx.fillStyle=accent;ctx.fillRect(38,165,690,6);});const mat=new THREE.MeshBasicMaterial({map:texture,side:THREE.FrontSide,toneMapped:false});signCache.set(key,mat);return mat;}
function sign(parent:THREE.Object3D,label:string,x:number,y:number,z:number,width:number,accent='#d5a63d',rotation=0,height=1.55){
 const geometry=new THREE.PlaneGeometry(width,height),mat=signMaterial(label,accent),normal=new THREE.Vector3(0,0,.016).applyAxisAngle(new THREE.Vector3(0,1,0),rotation);
 const front=new THREE.Mesh(geometry,mat);front.position.set(x+normal.x,y,z+normal.z);front.rotation.y=rotation;front.castShadow=false;parent.add(front);
 const back=new THREE.Mesh(geometry,mat);back.position.set(x-normal.x,y,z-normal.z);back.rotation.y=rotation+Math.PI;back.castShadow=false;parent.add(back);return front;
}
const counterNumberMaterials=new Map<string,THREE.Material>();
function counterNumberSign(parent:THREE.Object3D,label:string,x:number,y:number,z:number,width=1.6,height=1.2){
 let mat=counterNumberMaterials.get(label);
 if(!mat){const texture=canvasTexture(256,192,ctx=>{const bg=ctx.createLinearGradient(0,0,0,192);bg.addColorStop(0,'#2849c4');bg.addColorStop(.55,'#162b8d');bg.addColorStop(1,'#0b1d68');ctx.fillStyle=bg;ctx.fillRect(0,0,256,192);ctx.fillStyle='rgba(255,255,255,.15)';ctx.fillRect(8,8,240,4);ctx.strokeStyle='rgba(183,211,255,.7)';ctx.lineWidth=5;ctx.strokeRect(4,4,248,184);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 94px Arial,sans-serif';ctx.fillText(label,128,98);ctx.fillStyle='#8de8ff';ctx.fillRect(24,169,208,5);});mat=new THREE.MeshBasicMaterial({map:texture,toneMapped:false,side:THREE.DoubleSide});counterNumberMaterials.set(label,mat);}
 const geometry=new THREE.PlaneGeometry(width,height),front=new THREE.Mesh(geometry,mat),back=new THREE.Mesh(geometry,mat);front.position.set(x,y,z+.018);back.position.set(x,y,z-.018);back.rotation.y=Math.PI;front.castShadow=back.castShadow=false;parent.add(front,back);return front;
}
function addDecks(parent:THREE.Object3D,b:TerminalBounds,levels:number[],finish:THREE.Material,gapRatio=.16,atrium?:{fromLevel:number;x:number;z:number;width:number;depth:number},surfaces?:DeckFinishes,firstUpperGapRatio?:number){
 const thickness=.34,fullWidth=b.width-3,fullDepth=b.depth-4;
 const slab=(width:number,depth:number,x:number,z:number,y:number)=>{
  if(width<=2||depth<=2)return;box(parent,width,thickness,depth,x,y,z,surfaces?.edge??finish);
  if(!surfaces)return;
  const top=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),surfaces.floor);top.rotation.x=-Math.PI/2;top.position.set(x,y+thickness/2+.012,z);top.castShadow=false;top.receiveShadow=true;parent.add(top);
  const underside=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),surfaces.ceiling);underside.rotation.x=Math.PI/2;underside.position.set(x,y-thickness/2-.012,z);underside.castShadow=false;parent.add(underside);
 };
 slab(fullWidth,fullDepth,b.x,b.z,levels[0]-.17);
 for(let i=1;i<levels.length;i++){
  const y=levels[i]-.17;
  if(atrium&&i>=atrium.fromLevel){
   const left=b.x-fullWidth/2,right=b.x+fullWidth/2,near=b.z-fullDepth/2,far=b.z+fullDepth/2;
   const holeLeft=THREE.MathUtils.clamp(atrium.x-atrium.width/2,left+2,right-2),holeRight=THREE.MathUtils.clamp(atrium.x+atrium.width/2,left+2,right-2);
   const holeNear=THREE.MathUtils.clamp(atrium.z-atrium.depth/2,near+2,far-2),holeFar=THREE.MathUtils.clamp(atrium.z+atrium.depth/2,near+2,far-2);
   slab(fullWidth,holeNear-near,b.x,(near+holeNear)/2,y);
   slab(fullWidth,far-holeFar,b.x,(holeFar+far)/2,y);
   slab(holeLeft-left,holeFar-holeNear,(left+holeLeft)/2,(holeNear+holeFar)/2,y);
   slab(right-holeRight,holeFar-holeNear,(holeRight+right)/2,(holeNear+holeFar)/2,y);
   const rail=new THREE.MeshPhysicalMaterial({color:'#c0d5d7',roughness:.18,metalness:.08,transparent:true,opacity:.36,depthWrite:false});
   for(const side of [-1,1])box(parent,atrium.width,1.08,.13,atrium.x,y+.71,atrium.z+side*(atrium.depth/2),rail);
   for(const side of [-1,1])box(parent,.13,1.08,atrium.depth,atrium.x+side*(atrium.width/2),y+.71,atrium.z,rail);
  }else if(atrium){
   slab(fullWidth,fullDepth,b.x,b.z,y);
  }else{
   const first=i===1&&firstUpperGapRatio!==undefined,ratio=first?(firstUpperGapRatio??gapRatio):gapRatio,maxRatio=first ? .52 : .33,gap=Math.min(b.width*maxRatio,Math.max(20,b.width*ratio)),wing=(b.width-gap)/2;
   for(const side of [-1,1])slab(wing,b.depth-7,b.x+side*(gap/2+wing/2),b.z,y);
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
     if(atrium&&i>=atrium.fromLevel&&Math.abs(x-atrium.x)<atrium.width/2+2&&Math.abs(z-atrium.z)<atrium.depth/2+2)continue;
     strips.push({x,y,z,sx:6.2,sy:.055,sz:.19});
    }
   }
  }
  batch(parent,ceilingStrip,strips);
 }
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
 const zFirst=b.z-b.depth*.43,zLast=b.z+b.depth*.43,zStep=24,stations=Math.floor((zLast-zFirst)/zStep)+1;
 const mesh=new THREE.InstancedMesh(unitBox,mat,stations*2),dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),start=new THREE.Vector3(),end=new THREE.Vector3(),direction=new THREE.Vector3();let index=0;
 for(let station=0;station<stations;station++)for(const side of [-1,1]){
  const z=zFirst+station*zStep,x0=b.x+side*b.width*.405,x1=x0-side*6.4;
  start.set(x0,.42,z);end.set(x1,b.height-1.1,z);direction.subVectors(end,start);dummy.position.copy(start).add(end).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,direction.clone().normalize());dummy.scale.set(2.55,direction.length(),2.15);dummy.updateMatrix();mesh.setMatrixAt(index++,dummy.matrix);
 }
 mesh.count=index;mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
 const feet:Item[]=[];for(let station=0;station<stations;station++)for(const side of [-1,1])feet.push({x:b.x+side*b.width*.405,y:.58,z:zFirst+station*zStep,sx:3.5,sy:.32,sz:3.35,color:'#d5d7d2'});
 batch(parent,mat,feet);
}
function addStructure(parent:THREE.Object3D,b:TerminalBounds,mat:THREE.Material,profile?:'T1'|'T2'){
 if(profile==='T1'){addT1RakedSupports(parent,b,mat);return;}
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
 const ramps:RotItem[]=[],rails:RotItem[]=[],steps:RotItem[]=[],run=10.2,width=2.25;
 for(let i=0;i<levels.length-1;i++){const from=levels[i],to=levels[i+1],rise=to-from,angle=-Math.atan2(rise,run),mid=(from+to)/2,z=profile==='T2'?b.z+5:b.z+(i%2===0?-1:1)*Math.min(24,b.depth*.12),centerX=profile==='T2'?b.x-b.width*.26:profile==='T1'?b.x+b.width*.35:b.x;for(const lane of [-1,1]){const x=centerX+lane*1.25;ramps.push({x,y:mid,z,sx:width,sy:.42,sz:run,rx:angle});for(const railSide of [-1,1])rails.push({x:x+railSide*(width/2+.12),y:mid+.66,z,sx:.12,sy:.94,sz:run,rx:angle});for(let step=0;step<18;step++){const t=(step+.5)/18;steps.push({x,y:from+rise*t+.25,z:z-run/2+run*t,sx:width-.22,sy:.07,sz:.34,rx:angle});}}}
 batchX(parent,steel,ramps);batchX(parent,steel,rails);batchX(parent,belt,steps);
 const liftGlass=new THREE.MeshPhysicalMaterial({color:'#b9d0d3',roughness:.18,metalness:.12,transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide});
 for(const side of [-1,1]){const x=b.x+side*b.width*.39;box(parent,5.2,b.height-1.3,4.2,x,b.height/2,b.z,liftGlass);for(const y of levels.slice(0,-1)){box(parent,4.5,.12,.3,x,y+.12,b.z+2.18,steel);box(parent,1.1,2.3,.15,x,y+1.3,b.z+2.2,screen);}}
}
function aislePosts(target:Item[],x:number,y:number,z:number,count:number,spacing=2.5){for(let i=0;i<count;i++)target.push({x:x+(i-(count-1)/2)*spacing,y:y+.62,z,sx:.11,sy:1.24,sz:.11});}

/** T1's departure hall uses six long, parallel check-in islands rather than a row of isolated desks. */
function terminal1CheckIn(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number){
 const bases:Item[]=[],tops:Item[]=[],stands:Item[]=[],monitors:Item[]=[],belts:Item[]=[],rollers:Item[]=[],queuePosts:Item[]=[],queueRails:Item[]=[],islandSides:Item[]=[],signSupports:Item[]=[],kiosks:Item[]=[],kioskScreens:Item[]=[],count=6,span=b.width*.68,firstX=b.x-span/2,long=39;
 for(let i=0;i<count;i++){
  const x=firstX+i*span/(count-1),first=i*2+1,last=first+1;
  // Steel island plinth and continuous rubber baggage conveyor, with brushed
  // edge rails. The six dark bands make the documented T1 hall plan legible.
  bases.push({x,y:y+.32,z,sx:3.9,sy:.62,sz:long,color:'#cbd0cc'});
  belts.push({x,y:y+.70,z,sx:1.3,sy:.12,sz:long-2,color:'#292f2d'});
  for(const side of [-1,1])islandSides.push({x:x+side*1.92,y:y+.67,z,sx:.1,sy:.1,sz:long-.8,color:'#e2e5e0'});
  for(let dz=-long/2+1;dz<=long/2-1;dz+=.72)rollers.push({x,y:y+.78,z:z+dz,sx:1.1,sy:.045,sz:.065});
  // Each of the six long islands carries two numbered check-in zones (1–12
  // across T1); three staffed positions share each zone along the belt.
  for(let sideIndex=0;sideIndex<2;sideIndex++)for(let station=0;station<3;station++){
   const side=sideIndex===0?-1:1,groupZ=z+(sideIndex===0?-8:8),deskZ=groupZ+(station-1)*2.8,deskX=x+side*2.75;
   bases.push({x:deskX,y:y+.43,z:deskZ,sx:2.25,sy:.6,sz:2.5,color:'#aeb5b1'});
   tops.push({x:deskX,y:y+.77,z:deskZ,sx:2.48,sy:.12,sz:2.7,color:'#f0f0ea'});
   stands.push({x:deskX-side*.72,y:y+1.1,z:deskZ-.22,sx:.11,sy:.55,sz:.11});
   monitors.push({x:deskX-side*.72,y:y+1.56,z:deskZ-.22,sx:.7,sy:.48,sz:.11});
  }
  for(let q=-1;q<=1;q++){
   const side=q===0?1:q,px=x+side*5.5,pz=z+q*7.2;
   queuePosts.push({x:px,y:y+.43,z:pz,sx:.1,sy:1,sz:.1});
  }
  queueRails.push({x:x+5.5,y:y+.57,z,sx:.07,sy:.05,sz:14.4});
  for(const supportSide of [-1,1])signSupports.push({x:x+supportSide*2.25,y:y+3.65,z,sx:.12,sy:1.65,sz:.12});
  sign(parent,`CHECK-IN  ${String(first).padStart(2,'0')}–${String(last).padStart(2,'0')}  報到`,x,y+4.0,z,5.8,'#718b88',0,.82);
 }
 batch(parent,t1Island,bases);batch(parent,islandTrim,tops);batch(parent,steel,stands);batch(parent,screen,monitors);batch(parent,belt,belts);batch(parent,beltRoller,rollers);batch(parent,islandTrim,islandSides);batch(parent,queuePost,queuePosts);batch(parent,steel,queueRails);batch(parent,steel,signSupports);
 // Self-service check-in stays to the hall edges, leaving clear paths between islands.
 for(const side of [-1,1])for(let i=0;i<5;i++){
  const x=b.x+side*b.width*.39+(i-2)*2.6,zKiosk=z+long/2+5;
  kiosks.push({x,y:y+1.05,z:zKiosk,sx:1.15,sy:2.1,sz:.82});kioskScreens.push({x,y:y+1.32,z:zKiosk-.43,sx:.62,sy:.58,sz:.055});
 }
 batch(parent,counter,kiosks);batch(parent,screen,kioskScreens);sign(parent,'DEPARTURES  出境',b.x,y+5.5,z-long/2-5,Math.min(b.width*.045,8.4),'#aa9160',0,1.05);
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

function checkInHall(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number,islands:number,countersPerIsland:number|number[],startNumber:number=1,profile?:'T1'|'T2'){
 const bases:Item[]=[],tops:Item[]=[],monitors:Item[]=[],stands:Item[]=[],bagBelts:Item[]=[],posts:Item[]=[],queueRails:Item[]=[],islandBases:Item[]=[],beltSurfaces:Item[]=[],beltRollers:Item[]=[],kiosks:Item[]=[],kioskScreens:Item[]=[],headerSupports:Item[]=[];let nextNumber=startNumber;
 for(let g=0;g<islands;g++){
  const counterCount=Array.isArray(countersPerIsland)?(countersPerIsland[g]??countersPerIsland.at(-1)??1):countersPerIsland;
  const cx=b.x+(g-(islands-1)/2)*(b.width/(islands+1.05)),first=nextNumber,last=first+counterCount-1,rowWidth=counterCount*3.45;nextNumber=last+1;
  if(profile){
   const isT2=profile==='T2',islandZ=z+(g-(islands-1)/2)*(profile==='T1'?7.2:6.6),bodyY=y+(isT2?.31:.47),baseMat=isT2?'#414947':'#6b7472',approach=isT2?1:-1;
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
  }
  const rowZ=profile?z+(g-(islands-1)/2)*(profile==='T1'?7.2:6.6):z;
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
 batch(parent,profile==='T2'?t2Island:profile==='T1'?t1Island:counter,islandBases);batch(parent,islandTrim,beltSurfaces);batch(parent,beltRoller,beltRollers);batch(parent,counter,bases);batch(parent,counterTop,tops);batch(parent,steel,stands);batch(parent,screen,monitors);batch(parent,belt,bagBelts);batch(parent,queuePost,posts);batch(parent,steel,queueRails);batch(parent,steel,headerSupports);
 const kioskCount=Math.max(8,islands*3),bankCount=Math.ceil(kioskCount/2);for(let i=0;i<kioskCount;i++){const bank=i<bankCount?0:1,index=bank===0?i:i-bankCount,localCount=bank===0?bankCount:kioskCount-bankCount,side=bank===0?-1:1,x=b.x+side*b.width*.29+(index-(localCount-1)/2)*3.2,kioskZ=z-17;kiosks.push({x,y:y+1.05,z:kioskZ,sx:1.2,sy:2.1,sz:.85});kioskScreens.push({x,y:y+1.3,z:kioskZ-.45,sx:.62,sy:.58,sz:.055});}
 batch(parent,counter,kiosks);batch(parent,screen,kioskScreens);
 sign(parent,'DEPARTURES  出境',b.x,y+5.4,z-23,Math.min(b.width*.055,10),'#aa9160');
}
function securityHall(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number,laneCount=6,accent='#e1b449'){
 const belts:Item[]=[],scanBodies:Item[]=[],legs:Item[]=[],tops:Item[]=[],queue:Item[]=[],screens:Item[]=[];const spacing=Math.min(5.5,b.width*.62/laneCount),x0=b.x-(laneCount-1)*spacing/2;
 for(let i=0;i<laneCount;i++){const x=x0+i*spacing;belts.push({x,y:y+.58,z:z+2,sx:2.1,sy:.72,sz:6.8});scanBodies.push({x:x+1.18,y:y+1.1,z:z+1.8,sx:.45,sy:1.3,sz:1.8});
  for(const side of [-1,1])legs.push({x:x+side*1.3,y:y+1.15,z:z-3.2,sx:.15,sy:2.3,sz:.18});tops.push({x,y:y+2.3,z:z-3.2,sx:2.75,sy:.18,sz:.18});screens.push({x,y:y+3.1,z:z-5.2,sx:2.6,sy:1.35,sz:.22});
  aislePosts(queue,x,y,z-9,4,1.5);
 }
 batch(parent,belt,belts);batch(parent,screen,scanBodies);batch(parent,steel,legs);batch(parent,steel,tops);batch(parent,screen,screens);batch(parent,queuePost,queue);
 sign(parent,'SECURITY  安檢',b.x,y+5.2,z-13,Math.min(13,b.width*.12),accent);
}
function immigrationHall(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number,booths=9,centerX=b.x){
 const bases:Item[]=[],screens:Item[]=[],glassPanels:Item[]=[],posts:Item[]=[],egates:Item[]=[];const gap=Math.min(5.2,b.width*.62/booths),start=centerX-(booths-1)*gap/2;
 for(let i=0;i<booths;i++){const x=start+i*gap;bases.push({x,y:y+.63,z,sx:3.5,sy:1.2,sz:1.35});screens.push({x,y:y+1.65,z:z-.35,sx:.75,sy:.52,sz:.12});glassPanels.push({x,y:y+2.25,z:z+1.05,sx:3.3,sy:2.7,sz:.1});aislePosts(posts,x,y,z+4,3,1.4);}
 for(let i=0;i<4;i++)egates.push({x:b.x+b.width*.26+i*2.6,y:y+1.05,z:z+12,sx:1.6,sy:2.1,sz:2.5});
 batch(parent,counter,bases);batch(parent,screen,screens);batch(parent,shopGlass,glassPanels);batch(parent,queuePost,posts);batch(parent,accentBlue,egates);
 sign(parent,'IMMIGRATION  證照查驗',centerX,y+4.7,z-4,Math.min(15,b.width*.14),'#719da0');
}
function roundedRect(path:THREE.Shape|THREE.Path,w:number,h:number,r:number){const x=w/2,y=h/2;path.moveTo(-x+r,-y);path.lineTo(x-r,-y);path.quadraticCurveTo(x,-y,x,-y+r);path.lineTo(x,y-r);path.quadraticCurveTo(x,y,x-r,y);path.lineTo(-x+r,y);path.quadraticCurveTo(-x,y,-x,y-r);path.lineTo(-x,-y+r);path.quadraticCurveTo(-x,-y,-x+r,-y);}
const carouselGeometry=(()=>{const shape=new THREE.Shape();roundedRect(shape,19,5,2.3);const hole=new THREE.Path();roundedRect(hole,17.8,3.8,1.7);shape.holes.push(hole);const geo=new THREE.ExtrudeGeometry(shape,{depth:.45,bevelEnabled:false,curveSegments:12});geo.rotateX(-Math.PI/2);return geo;})();
function baggageClaim(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number,count=4){
 const cases:Item[]=[],caseColors:THREE.ColorRepresentation[]=['#546f79','#a34b3c','#b5aa93'];
 for(let i=0;i<count;i++){const x=b.x+(i-(count-1)/2)*Math.min(25,b.width/(count+.7));const mesh=new THREE.Mesh(carouselGeometry,steel);mesh.position.set(x,y+.32,z);mesh.castShadow=false;mesh.receiveShadow=true;parent.add(mesh);
  const label=box(parent,8,.72,.12,x,y+1,z-2.65,screen);label.castShadow=false;sign(parent,`BAGGAGE  ${String(i+1).padStart(2,'0')}  行李`,x,y+2.3,z-6,10,'#6eaeb5');
  for(let j=0;j<8;j++){const angle=j*Math.PI/4,rx=7.7*Math.cos(angle),rz=1.5*Math.sin(angle);cases.push({x:x+rx,y:y+.92,z:z+rz,sx:.88,sy:.78,sz:.72,color:caseColors[j%caseColors.length]});}
 }
 batch(parent,material('#33444a',.74),cases);
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
function flightBoards(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number){
 for(const side of [-1,1]){box(parent,16,5,.45,b.x+side*b.width*.36,y+5,z,screen);sign(parent,'FLIGHT INFORMATION  航班資訊',b.x+side*b.width*.36,y+5,z+.25,15,'#e1b74e');for(let i=0;i<4;i++)box(parent,12,.18,.12,b.x+side*b.width*.36,y+4.1-i*.78,z+.27,light);}
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
  for(let row=0;row<5;row++)for(const column of [-1,1]){
   const x=wingX+column*wingWidth*.27,z=atrium.z+(row-2)*27;
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
/** T2's south 4F public food court: pale hex tile, clustered tables and the
 * distinctive suspended honeycomb light canopy shown in recent visitor photos. */
function terminal2FoodCourt(parent:THREE.Object3D,b:TerminalBounds,y:number){
 const zoneWidth=b.width*.82,zoneDepth=b.depth*.27,zoneX=b.x,zoneZ=b.z+b.depth*.32,deckY=y-.24;
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
 const floorMat=new THREE.MeshPhysicalMaterial({color:'#faf9f2',map:hexFloor,roughness:.3,metalness:.015,clearcoat:.26,clearcoatRoughness:.24});floorMat.userData.worldUV=1/11.3;floorMat.userData.indoorReflection=1;floorMat.userData.reflectionIntensity=.34;floorMat.userData.reflectionMap=interiorReflection('T2');
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(zoneWidth,zoneDepth),floorMat);floor.rotation.x=-Math.PI/2;floor.position.set(zoneX,deckY+.022,zoneZ);floor.receiveShadow=true;floor.castShadow=false;parent.add(floor);

 const tables:Item[]=[],tableStems:Item[]=[],tableFeet:Item[]=[],seats:Item[]=[],backs:Item[]=[],legs:Item[]=[],seatPalette=['#e8b83e','#728e8e','#485c61','#d7d9d3'],cols=11,rows=5,tableSpacing=9.4,rowSpacing=10,startX=zoneX-(cols-1)*tableSpacing/2;
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
 const colors=[whiteBeams,whiteBeams,goldBeams,whiteBeams,tealBeams,goldBeams],ceilingY=23.08,colsHex=7,rowsHex=4;
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
 const fasciaGold:Item[]=[],fasciaIvory:Item[]=[],fasciaZ=b.z+b.depth*.45+2.7;
 for(let i=0;i<5;i++){const x=zoneX+(i-2)*zoneWidth/5.5,item={x,y:y+3.58,z:fasciaZ,sx:Math.min(20,zoneWidth/6),sy:.22,sz:.35};(i%2?fasciaGold:fasciaIvory).push(item);}
 batch(parent,foodCourtGold,fasciaGold);batch(parent,foodCourtIvory,fasciaIvory);
}
function arrivalLobby(parent:THREE.Object3D,b:TerminalBounds,y:number,z:number){
 sign(parent,'ARRIVALS  入境大廳',b.x,y+5,z,13,'#6f9898');seating(parent,b,y,z+22,3,9);flightBoards(parent,b,y,z+45);
 const planters:Item[]=[];for(let i=0;i<8;i++)planters.push({x:b.x+(i-3.5)*Math.min(16,b.width/9),y:y+.65,z:z+62,sx:2.4,sy:1.3,sz:2.4,color:'#657b63'});batch(parent,material('#77735d',.86),planters);
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
function terminal1(parent:THREE.Object3D,b:TerminalBounds,mats:TerminalMaterials){
 const levels=[.36,5.8,11.3,16.7],atrium={fromLevel:1,x:b.x,z:b.z-42,width:Math.min(104,b.width*.6),depth:124},finishes=deckFinishes('T1',mats);addDecks(parent,b,levels,mats.concrete,.16,atrium,finishes);addStructure(parent,b,finishes.structure,'T1');verticalCirculation(parent,b,levels,'T1');
 // The airport's visitor guide places T1's Departure Hall and counter 10 on
 // 1F; this public level shares the arrival, customs and meeting facilities.
 terminal1CheckIn(parent,b,.62,b.z-42);terminal1HallPlanters(parent,b,.62);sign(parent,'DEPARTURES / CHECK-IN  出境報到',b.x,.62+7.2,b.z+2,11,'#aa9160',0,1.05);
 baggageClaim(parent,b,.58,b.z+57,4);customsHall(parent,b,.58,b.z+88);arrivalLobby(parent,b,.58,b.z+111);
 immigrationHall(parent,b,6.02,b.z+24,9,b.x+b.width*.25);sign(parent,'TRANSFER  轉機',b.x+b.width*.25,6.02+5,b.z+39,12,'#6f9898');
 securityHall(parent,b,11.55,b.z+43,6);seating(parent,b,11.55,b.z+64,4,11,true);flightBoards(parent,b,11.55,b.z+82);
 shops(parent,b,16.95,b.z+54,5,'food');shops(parent,b,16.95,b.z+72,5,'food');addTableZone(parent,b,16.95,b.z+64);
}
function terminal2(parent:THREE.Object3D,b:TerminalBounds,mats:TerminalMaterials){
 const levels=[.36,6.25,12.35,18.55,23.45],atrium={fromLevel:3,x:b.x,z:b.z-42,width:110,depth:140},finishes=deckFinishes('T2',mats);addDecks(parent,b,levels,mats.concrete,.16,atrium,finishes);addStructure(parent,b,finishes.structure,'T2');verticalCirculation(parent,b,levels,'T2');
 baggageClaim(parent,b,.58,b.z-53,4);customsHall(parent,b,.58,b.z-23);arrivalLobby(parent,b,.58,b.z+24);sign(parent,'MRT  機場捷運',b.x+b.width*.28,.58+4,b.z+70,11,'#6f9898');
 immigrationHall(parent,b,6.48,b.z-8,10);sign(parent,'TRANSFER COUNTER  轉機櫃檯',b.x,6.48+5.3,b.z+36,16,'#6f9898');securityHall(parent,b,6.48,b.z+48,4,'#86b9b8');
 checkInHall(parent,b,12.62,b.z-35,5,[5,5,6,5,5],1,'T2');securityHall(parent,b,12.62,b.z+37,7);flightBoards(parent,b,12.62,b.z+60);seating(parent,b,12.62,b.z+78,3,12,true);
 // Keep the 4F food and retail frontage outside the upper-floor atrium opening.
 const fourthFloorAtrium={x:b.x,z:b.z-42,width:110,depth:140};
 shops(parent,b,18.82,b.z-b.depth*.43,5,'food');shops(parent,b,18.82,b.z+b.depth*.45,5,'food');terminal2AtriumDining(parent,b,18.82,fourthFloorAtrium);terminal2FoodCourt(parent,b,18.82);
 addT2TempleAvenue(parent,b,23.72);observationDeck(parent,b,23.72,-1);observationDeck(parent,b,23.72,1);
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
