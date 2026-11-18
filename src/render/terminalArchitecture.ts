import * as THREE from 'three';
import type {Gate} from '../data/airport';
import {gates as airportGates} from '../data/airport';
import {box,canvasTexture,instances,material} from './primitives';
import {surfaceImages} from './realismAssets';
import {buildTerminalInterior,type TerminalInteriorProfile} from './terminalInteriors';
import {T2_FLOOR_LEVELS,T2_OBSERVATION_DECK_LAYOUT} from './terminalInteriorLayout';
import {t1RoofHeight} from './terminalPublicHallLayout';
import {T1_A_PASSENGER} from './terminalPassengerLayout';
import {terminalBuildingBounds} from './terminalBuildingLayout';

export interface TerminalBounds {x:number;z:number;width:number;depth:number;height:number}
export interface TerminalMaterials {glass:THREE.Material;cladding:THREE.MeshStandardMaterial;concrete:THREE.Material;metal:THREE.Material;roof?:THREE.Material;floor?:THREE.Material;ceiling?:THREE.Material;deck?:THREE.Material;structure?:THREE.Material}

/** High-clarity curtain wall; interiors remain readable through glass instead of a printed window image. */
export function terminalCurtainGlass(){
 const glass=new THREE.MeshPhysicalMaterial({color:'#b7c8cc',roughness:.2,metalness:.12,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide,envMapIntensity:1.25,clearcoat:.5,clearcoatRoughness:.18});
 glass.forceSinglePass=true;
 return glass;
}

/** CC0 facade PBR; physical UV size is close to the source material's documented 2.1 m width. */
export function terminalCladdingMaterial(){
 const cladding=new THREE.MeshStandardMaterial({color:'#d8dedf',roughness:.82,metalness:.035});
 cladding.userData.facade=true;cladding.userData.facadeUVSize=[2.1,2.1];cladding.normalScale.setScalar(.22);
 surfaceImages('facade').then(images=>{cladding.map=images.color;cladding.normalMap=images.normal;cladding.roughnessMap=images.roughness;cladding.needsUpdate=true;});
 return cladding;
}

function claddingBands(parent:THREE.Object3D,b:TerminalBounds,cladding:THREE.MeshStandardMaterial,floorLevels?:readonly number[],openWestBase=false){
 const baseHeight=Math.min(3.4,Math.max(1.7,b.height*.18)),offset=.19;
 for(const side of [-1,1]){
  box(parent,b.width,baseHeight,.38,b.x,baseHeight/2,b.z+side*(b.depth/2+offset),cladding);
  if(!openWestBase||side>0)box(parent,.38,baseHeight,b.depth,b.x+side*(b.width/2+offset),baseHeight/2,b.z,cladding);
 }
 if(b.height>17){
  for(const y of floorLevels?[...floorLevels.filter(y=>y>1),b.height-1.2]:b.height>25?[b.height*.35,b.height*.68,b.height-1.2]:[b.height*.53,b.height-1.15]){
   const bandHeight=y>b.height-2?1.35:.48;
   for(const side of [-1,1]){
    box(parent,b.width,bandHeight,.3,b.x,y,b.z+side*(b.depth/2+.17),cladding);
    box(parent,.3,bandHeight,b.depth,b.x+side*(b.width/2+.17),y,b.z,cladding);
   }
  }
 }
}

const seatMat=material('#40575e',.68,.12),seatEdge=material('#8d9998',.44,.52),columnMat=material('#aab4b4',.52,.28);
const ceilingLight=new THREE.MeshStandardMaterial({color:'#fff0c9',emissive:'#d8b978',emissiveIntensity:.22,roughness:.34});
const signMaterial=(()=>{
 const labels=airportGates.filter(g=>!g.remote&&!/^5/.test(g.id));
 const columns=8,cell=128,rows=8,texture=canvasTexture(columns*cell,rows*cell,ctx=>{
  ctx.textAlign='center';ctx.textBaseline='middle';
  labels.forEach((gate,i)=>{const x=(i%columns)*cell,y=Math.floor(i/columns)*cell;ctx.fillStyle='#13252c';ctx.fillRect(x+4,y+5,cell-8,cell-10);ctx.strokeStyle='#8caaa7';ctx.lineWidth=5;ctx.strokeRect(x+6,y+7,cell-12,cell-14);ctx.fillStyle='#a7c7c1';ctx.font='bold 18px Arial';ctx.fillText('GATE',x+cell/2,y+32);ctx.fillStyle='#f1f1e9';ctx.font='bold 48px Arial';ctx.fillText(gate.id,x+cell/2,y+83);});
 });
 texture.anisotropy=8;
 const mat=new THREE.MeshStandardMaterial({map:texture,emissive:'#53665f',emissiveMap:texture,emissiveIntensity:.24,roughness:.48,metalness:.04,side:THREE.DoubleSide});
 return {mat,labels,index:new Map(labels.map((g,i)=>[g.id,i])),columns,rows,cell};
})();

function gateSigns(parent:THREE.Object3D,b:TerminalBounds,gateList:Gate[],gateSide:-1|1){
 const visible=gateList.filter(g=>signMaterial.index.has(g.id));if(!visible.length)return;
 const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
 visible.forEach((gate,i)=>{
  const id=signMaterial.index.get(gate.id)!;const col=id%signMaterial.columns,row=Math.floor(id/signMaterial.columns),u0=(col+.09)/signMaterial.columns,u1=(col+.91)/signMaterial.columns,v0=1-(row+.9)/signMaterial.rows,v1=1-(row+.1)/signMaterial.rows;
  const cx=gate.x,cy=b.height-2.2,z=b.z+gateSide*(b.depth/2-1.05),halfW=1.55,halfH=.72,base=positions.length/3;
  positions.push(cx-halfW,cy-halfH,z,cx+halfW,cy-halfH,z,cx+halfW,cy+halfH,z,cx-halfW,cy+halfH,z);
  uvs.push(u0,v0,u1,v0,u1,v1,u0,v1);indices.push(base,base+1,base+2,base,base+2,base+3);
 });
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
 const mesh=new THREE.Mesh(geo,signMaterial.mat);mesh.castShadow=false;mesh.userData.terminalSign=true;parent.add(mesh);
}

/** Interior floor, real scale supports, boarding signs, lounge seating and ceiling light strips. */
export function terminalInterior(parent:THREE.Object3D,b:TerminalBounds,concrete:THREE.Material,gateList:Gate[]=[],gateSide:-1|1=1,profile?:TerminalInteriorProfile,mats?:TerminalMaterials){
 if(profile&&mats){buildTerminalInterior(parent,b,profile,mats,gateList,gateSide);return;}
 box(parent,Math.max(2,b.width-1.2),.42,Math.max(2,b.depth-1.2),b.x,.34,b.z,concrete);
 const columnItems:{x:number;y:number;z:number;sx:number;sy:number;sz:number}[]=[],lightItems:typeof columnItems=[],seatItems:typeof columnItems=[],backItems:typeof columnItems=[],legItems:typeof columnItems=[];
 const columnHeight=Math.max(5,b.height-2.2),xStep=b.depth<70?32:34,zStep=b.depth<70?Infinity:38;
 for(let x=b.x-b.width/2+16;x<=b.x+b.width/2-16;x+=xStep){
  if(b.depth<70){for(const side of [-1,1])columnItems.push({x,y:columnHeight/2+.62,z:b.z+side*(b.depth/2-3.4),sx:.82,sy:columnHeight,sz:.82});}
  else for(let z=b.z-b.depth/2+15;z<=b.z+b.depth/2-15;z+=zStep)columnItems.push({x,y:columnHeight/2+.62,z,sx:.82,sy:columnHeight,sz:.82});
 }
 instances(parent,new THREE.BoxGeometry(1,1,1),columnMat,columnItems);
 const addBench=(x:number,z:number)=>{
  seatItems.push({x,y:.72,z,sx:2.75,sy:.17,sz:.72});backItems.push({x,y:1.05,z:z+.29,sx:2.75,sy:.62,sz:.14});
  for(const dx of [-1.03,1.03])for(const dz of [-.23,.23])legItems.push({x:x+dx,y:.42,z:z+dz,sx:.13,sy:.56,sz:.13});
 };
 if(b.depth<70){
  const seatZ=b.z-gateSide*Math.min(6.8,b.depth*.22);
  for(let x=b.x-b.width/2+14;x<=b.x+b.width/2-14;x+=23)addBench(x,seatZ);
 }else{
  const aisleZ=b.depth*.28;
  for(let x=b.x-b.width/2+17;x<=b.x+b.width/2-17;x+=29){
   for(const side of [-1,1]){addBench(x,b.z+side*aisleZ);if(b.depth>190)addBench(x,b.z+side*(b.depth*.08));}
  }
 }
 instances(parent,new THREE.BoxGeometry(1,1,1),seatMat,seatItems);instances(parent,new THREE.BoxGeometry(1,1,1),seatMat,backItems);instances(parent,new THREE.BoxGeometry(1,1,1),seatEdge,legItems);
 const stripZ=b.depth<70?[-b.depth*.22,b.depth*.22]:[-b.depth*.28,0,b.depth*.28];
 for(let x=b.x-b.width/2+10;x<=b.x+b.width/2-10;x+=22)for(const offset of stripZ)lightItems.push({x,y:b.height-.75,z:b.z+offset,sx:3.8,sy:.09,sz:.2});
 instances(parent,new THREE.BoxGeometry(1,1,1),ceilingLight,lightItems);
 if(gateList.length)gateSigns(parent,b,gateList,gateSide);
}

/** Glass-and-cladding shell. Airport scene footprints are authored fits, not surveys. */
export function buildTerminalAtrium(parent:THREE.Object3D,b:TerminalBounds,mats:TerminalMaterials,gateList:Gate[]=[],gateSide:-1|1=1,profile?:TerminalInteriorProfile){
 b=terminalBuildingBounds(b,profile??'');
 if(profile==='T1'){
  // A rectangular glass box protruded above the dropped T1 eaves. Trim the
  // end glazing to the same section used by the roof and upper hall piers.
  for(const side of [-1,1]){
   const positions:number[]=[],indices:number[]=[],segments=64,
    stations=[...new Set([...Array.from({length:segments+1},(_,i)=>(i/segments-.5)*b.width),-8,8])].sort((a,c)=>a-c),
    quad=(x0:number,x1:number,bottom:number,top0:number,top1:number)=>{const k=positions.length/3,z=b.z+side*b.depth/2;positions.push(b.x+x0,bottom,z,b.x+x0,top0,z,b.x+x1,bottom,z,b.x+x1,top1,z);indices.push(k,k+1,k+2,k+1,k+3,k+2);};
   for(let i=1;i<stations.length;i++){
    const x0=stations[i-1],x1=stations[i],top0=t1RoofHeight(x0,b.width,b.height)-.4,top1=t1RoofHeight(x1,b.width,b.height)-.4;
    if(side===-1&&x0>=-8&&x1<=8){
     // Open the raised passenger link instead of running a curtain pane
     // through its 3F doorway. The rest of the roof-conforming facade stays.
     quad(x0,x1,0,T1_A_PASSENGER.passageFloor,T1_A_PASSENGER.passageFloor);
     quad(x0,x1,T1_A_PASSENGER.passageCeiling,top0,top1);
    }else quad(x0,x1,0,top0,top1);
   }
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
   const glass=new THREE.Mesh(geometry,mats.glass);glass.castShadow=false;parent.add(glass);
   const edgeHeight=t1RoofHeight(b.width/2,b.width,b.height)-.4;
   box(parent,.12,edgeHeight,b.depth,b.x+side*b.width/2,edgeHeight/2,b.z,mats.glass);
   box(parent,b.width,1.25,.22,b.x,.625,b.z+side*b.depth/2,mats.cladding);
   box(parent,.22,1.25,b.depth,b.x+side*b.width/2,.625,b.z,mats.cladding);
  }
  terminalInterior(parent,b,mats.concrete,gateList,gateSide,profile,mats);return;
 }
 // A curtain wall is four vertical faces. A transparent box also creates a
 // tinted glass ceiling and floor, which darkens the public halls unnaturally.
 for(const side of [-1,1]){
  const wallZ=b.z+side*(b.depth/2);
  if(profile==='T2'){
   // The airport describes its north and south 5F viewing areas as outdoor
   // decks. Leave a normal-height glazed egress at both ends instead of
   // enclosing the deck behind an uninterrupted curtain wall.
   const floorY=T2_FLOOR_LEVELS[6],doorWidth=T2_OBSERVATION_DECK_LAYOUT.accessWidth,
    doorHeight=Math.min(T2_OBSERVATION_DECK_LAYOUT.accessHeight,b.height-floorY-.5),doorCenter=b.x+T2_OBSERVATION_DECK_LAYOUT.accessXOffset,
    doorLeft=doorCenter-doorWidth/2,doorRight=doorCenter+doorWidth/2,leftEdge=b.x-b.width/2,rightEdge=b.x+b.width/2,
    lowerHeight=floorY,upperStart=floorY+doorHeight,upperHeight=Math.max(.1,b.height-upperStart),frame=material('#697774',.42,.48);
   box(parent,b.width,lowerHeight,.12,b.x,lowerHeight/2,wallZ,mats.glass);
   box(parent,b.width,upperHeight,.12,b.x,upperStart+upperHeight/2,wallZ,mats.glass);
   const leftWidth=doorLeft-leftEdge,rightWidth=rightEdge-doorRight;
   if(leftWidth>0)box(parent,leftWidth,doorHeight,.12,(leftEdge+doorLeft)/2,floorY+doorHeight/2,wallZ,mats.glass);
   if(rightWidth>0)box(parent,rightWidth,doorHeight,.12,(doorRight+rightEdge)/2,floorY+doorHeight/2,wallZ,mats.glass);
   // Two open sliding leaves remain parked against the jambs. Their clear
   // central path aligns with the exterior deck slab and free-roam bounds.
   const leafWidth=doorWidth*.26,leafOffset=doorWidth*.37;
   for(const sign of [-1,1]){
    box(parent,leafWidth,doorHeight-.08,.075,doorCenter+sign*leafOffset,floorY+(doorHeight-.08)/2,wallZ-side*.055,mats.glass);
    box(parent,.075,doorHeight,.14,doorCenter+sign*doorWidth/2,floorY+doorHeight/2,wallZ-side*.12,frame);
   }
   box(parent,doorWidth,.12,.18,doorCenter,floorY+doorHeight,wallZ-side*.12,frame);
  }else box(parent,b.width,b.height,.12,b.x,b.height/2,wallZ,mats.glass);
  if(profile!=='T2'||side>0)box(parent,.12,b.height,b.depth,b.x+side*(b.width/2),b.height/2,b.z,mats.glass);
 }
 claddingBands(parent,b,mats.cladding,profile==='T2'?T2_FLOOR_LEVELS:undefined,profile==='T2');
 terminalInterior(parent,b,mats.concrete,gateList,gateSide,profile,mats);
}

/** PBR spandrels applied to the completed-design terminal volumes; geometry stays project-authored. */
export function terminalSpandrels(parent:THREE.Object3D,b:TerminalBounds,cladding:THREE.MeshStandardMaterial){claddingBands(parent,b,cladding);}
