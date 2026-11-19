import * as THREE from 'three';
import {box,canvasTexture,instances,material,seeded} from './primitives';
import type {TerminalMaterials} from './terminalArchitecture';
import {CONCOURSE_DOOR_WIDTH,CONCOURSE_LEVEL,GATE_CONCOURSES,T2_D_PUBLIC_CONCOURSE,distanceInside,type GateConcourse} from './terminalConcourseLayout';
import {hallAreaLight} from './terminalPublicHalls';
import {terminalSeatGeometry} from './terminalSeating';
import {addFloorContactShadows,terminalFloorMaterial} from './terminalFloorLighting';
import {buildTerminalDConcourse} from './terminalDConcourse';
import {buildSouthDepartureHall,buildSouthLowerCeiling,buildSouthTerminalLink} from './terminalSouthPassage';
import {T1_B_COMMON_ROOM,southLowerGateFurniture,t1BCommonCeiling} from './terminalSouthPassageLayout';
import {buildingRectEdges} from './terminalBuildingLayout';
import {buildT2GateConnections} from './terminalGateConnection';
import {T2_GATE_LINKS} from './terminalGateLinks';
import {passengerWallSpans} from './terminalPassengerLayout';

type Item=Parameters<typeof instances>[3][number];
const cube=new THREE.BoxGeometry(1,1,1),plane=new THREE.PlaneGeometry(1,1),seat=terminalSeatGeometry(3,false),roundColumn=new THREE.CylinderGeometry(.5,.5,1,18);
const plaster=new THREE.MeshStandardMaterial({color:'#e4e3d9',roughness:.79,emissive:'#b1aa9a',emissiveIntensity:.24});
const ceiling=new THREE.MeshStandardMaterial({color:'#deded4',roughness:.77,emissive:'#a6a899',emissiveIntensity:.34});
const ceilingJoint=material('#a0a6a1',.77,.035),satin=material('#aab1af',.4,.48),steel=material('#535d62',.49,.36),rubber=material('#2b3033',.62,.02);
const diffuser=new THREE.MeshBasicMaterial({color:'#fff6e4',toneMapped:false});
const leatherB=material('#344247',.56,.02),leatherCommon=material('#252a2b',.57,.02),leatherCD=material('#283b4a',.52,.025);
const shade=new THREE.MeshStandardMaterial({color:'#c6ccc7',roughness:.82,transparent:true,opacity:.83,depthWrite:false});
const commonRoomStart=buildingRectEdges(T1_B_COMMON_ROOM.floor).left;
const isBCommonGate=(id:string)=>id==='B1'||id==='B2'||id==='B3';

function batch(parent:THREE.Object3D,mat:THREE.Material,items:Item[],geometry:THREE.BufferGeometry=cube){
 if(items.length)instances(parent,geometry,mat,items).userData.staticFurnitureBatch=true;
}

let terrazzo:THREE.MeshStandardMaterial|undefined,carpet:THREE.MeshStandardMaterial|undefined;
function loungeSurfaces(){
 if(!terrazzo || !carpet){
  const random=seeded(39012),stoneMap=canvasTexture(256,256,ctx=>{
   ctx.fillStyle='#9d9f99';ctx.fillRect(0,0,256,256);
   for(let i=0;i<5000;i++){
    ctx.fillStyle=i%3?'rgba(62,67,64,.13)':'rgba(239,234,217,.3)';
    ctx.fillRect(random()*256,random()*256,.55+random()*2.8,.55+random()*1.85);
   }
   ctx.strokeStyle='rgba(45,51,50,.26)';ctx.strokeRect(.5,.5,255,255);
  }),fabricMap=canvasTexture(128,128,ctx=>{
   ctx.fillStyle='#586570';ctx.fillRect(0,0,128,128);
   for(let y=0;y<128;y+=2)for(let x=0;x<128;x+=3){
    ctx.fillStyle=random()>.5?'rgba(216,222,221,.16)':'rgba(27,35,39,.28)';ctx.fillRect(x+y%3,y,2,1);
   }
  });
  for(const map of [stoneMap,fabricMap])map.wrapS=map.wrapT=THREE.RepeatWrapping;
  terrazzo=terminalFloorMaterial('satin',{color:'#cbcfc7',map:stoneMap,bumpMap:stoneMap,bumpScale:.003,emissive:'#565752',emissiveIntensity:.12});
  carpet=terminalFloorMaterial('carpet',{color:'#aeb9bf',map:fabricMap,bumpMap:fabricMap,bumpScale:.004});
  terrazzo.userData.worldUV=1.4;carpet.userData.worldUV=.48;
 }
 return {terrazzo,carpet};
}

const signIds=GATE_CONCOURSES.flatMap(row=>row.gates.map(g=>g.gate.id));
let gateSignMaterial:THREE.MeshBasicMaterial|undefined;
function gateSign(parent:THREE.Object3D,id:string,x:number,y:number,z:number,ry:number){
 const columns=4,rows=Math.ceil(signIds.length/columns),w=256,h=96;
 if(!gateSignMaterial){
  const map=canvasTexture(w*columns,h*rows,ctx=>{
   for(const [i,label] of signIds.entries()){
    const left=i%columns*w,top=Math.floor(i/columns)*h;
    ctx.fillStyle=label.startsWith('B')?'#244c68':'#233d62';ctx.fillRect(left,top,w,h);
    ctx.fillStyle='#f5f4ed';ctx.font='600 63px Arial';ctx.fillText(label,left+16,top+69);
    ctx.font='bold 19px Arial,"Microsoft JhengHei",sans-serif';ctx.fillText('登機門',left+144,top+35);
    ctx.font='600 11px Arial';ctx.fillText('BOARDING GATE',left+144,top+60);
   }
  });
  gateSignMaterial=new THREE.MeshBasicMaterial({map,toneMapped:false});
 }
 const index=signIds.indexOf(id),geometry=new THREE.PlaneGeometry(3.35,.85),uv=geometry.getAttribute('uv');
 for(let i=0;i<uv.count;i++)uv.setXY(i,(index%columns+.006+uv.getX(i)*.988)/columns,1-(Math.floor(index/columns)+.016+(1-uv.getY(i))*.968)/rows);
 const mesh=new THREE.Mesh(geometry,gateSignMaterial);mesh.position.set(x,y,z);mesh.rotation.y=ry;mesh.userData.staticTerminalSign=true;parent.add(mesh);
}

function loungeSeating(parent:THREE.Group,row:GateConcourse,bay:GateConcourse['gates'][number]){
 if(!bay.banks.length)return;
 const originX=bay.bridge.x,originZ=distanceInside(row,12.75),side=row.side;
 const finish=isBCommonGate(bay.gate.id)?leatherCommon:row.wing==='B'?leatherB:leatherCD;
 const chairs:Item[]=[],supports:Item[]=[],arms:Item[]=[],distantSeats:Item[]=[],distantSupports:Item[]=[];
 for(const bank of bay.banks){
  const x=bank.x-originX,z=bank.z-originZ;
  for(let i=0;i<bank.seats;i++){
   const seatX=x+(i-(bank.seats-1)/2)*bank.pitch;
   chairs.push({x:seatX,y:0,z,ry:side>0?0:Math.PI});
  }
  for(let i=0;i<=bank.seats;i++){
   const armX=x-bank.width/2+i*bank.pitch;
   arms.push({x:armX,y:.73,z,sx:.045,sy:.044,sz:.46});
   supports.push({x:armX,y:.58,z:z-side*.16,sx:.04,sy:.29,sz:.04});
  }
  supports.push({x,y:.396,z,sx:bank.width,sy:.072,sz:.09});
  distantSeats.push({x,y:.51,z,sx:bank.width,sy:.085,sz:.54},{x,y:.795,z:z-side*.26,sx:bank.width,sy:.55,sz:.095});
  for(const dx of [-bank.width*.35,bank.width*.35]){
   supports.push({x:x+dx,y:.228,z,sx:.07,sy:.35,sz:.08},{x:x+dx,y:.056,z,sx:.44,sy:.062,sz:.60});
   distantSupports.push({x:x+dx,y:.235,z,sx:.08,sy:.47,sz:.14});
  }
 }
 // Keep each bay independently cullable. Apron and tower cameras see a
 // lightweight seat silhouette through the glass beyond walking distance.
 const lod=new THREE.LOD(),detail=new THREE.Group(),silhouette=new THREE.Group();
 lod.position.set(originX,CONCOURSE_LEVEL,originZ);
 instances(detail,seat,finish,chairs);instances(detail,cube,steel,supports);instances(detail,cube,rubber,arms);
 instances(silhouette,cube,finish,distantSeats);instances(silhouette,cube,steel,distantSupports);
 lod.addLevel(detail,0);lod.addLevel(silhouette,145,.12);lod.addLevel(new THREE.Group(),450,.1);
 parent.add(lod);
}

export function buildGateConcourses(parent:THREE.Group,mats:TerminalMaterials){
 const floors=loungeSurfaces();
 for(const row of GATE_CONCOURSES){
  const {bounds:b,side,facadeZ,loungeDepth}=row,isD=row.wing==='D',y=CONCOURSE_LEVEL,ceilingY=isD?T2_D_PUBLIC_CONCOURSE.ceiling:b.height-.95;
  const clearHeight=ceilingY-y,glazingHeight=isD?3.0:clearHeight,depthAt=(d:number)=>distanceInside(row,d),ry=side>0?Math.PI:0;
  const left=b.x-b.width/2,right=b.x+b.width/2,walls:Item[]=[],glass:Item[]=[],frames:Item[]=[],luminaires:Item[]=[],joints:Item[]=[],blinds:Item[]=[];
  const bays=row.gates.map(bay=>southLowerGateFurniture(row,bay));
  const endGate=bays.find(bay=>bay.gate.id==='D10'),commonColumns:Item[]=[],commonFrames:Item[]=[];

  box(parent,b.width,.42,b.depth,b.x,y-.21,b.z,floors.terrazzo);
  box(parent,b.width,4.45,b.depth,b.x,2.225,b.z,mats.cladding);
  if(isD)buildTerminalDConcourse(parent,row,mats);
  else buildSouthLowerCeiling(parent,row,mats,ceiling);
  const envelopeHeight=isD?b.height-.69-y:clearHeight;
  const backWalls=passengerWallSpans(left,right,isD?[T2_GATE_LINKS.D]:[]);
  for(const span of backWalls)box(parent,span.right-span.left,clearHeight,.27,(span.left+span.right)/2,y+clearHeight/2,depthAt(loungeDepth-.19),plaster);
  for(const x of [left+.15,right-.15])box(parent,.3,envelopeHeight,b.depth,x,y+envelopeHeight/2,b.z,plaster);
  if(b.depth>loungeDepth+.35)for(const span of backWalls)
   box(parent,span.right-span.left,envelopeHeight,b.depth-loungeDepth,(span.left+span.right)/2,y+envelopeHeight/2,depthAt((b.depth+loungeDepth)/2),mats.cladding);
  if(isD)box(parent,b.width,envelopeHeight-clearHeight,.25,b.x,ceilingY+(envelopeHeight-clearHeight)/2,facadeZ,mats.cladding);

  // Clear side glazing with sill, transoms, and real gaps behind the bridge doors.
  const apronPanes=(from:number,to:number)=>{
   const isCommon=row.wing==='B'&&(from+to)/2>=commonRoomStart;
   const mullions=isCommon?commonFrames:frames;
   const panes=Math.ceil((to-from)/3.95),span=(to-from)/panes;
   for(let i=0;i<panes;i++){
    const x=from+(i+.5)*span;
    glass.push({x,y:y+(glazingHeight+.58)/2,z:facadeZ,sx:span,sy:glazingHeight-.58,ry});
    mullions.push({x:from+i*span,y:y+glazingHeight/2,z:facadeZ,sx:.095,sy:glazingHeight,sz:.21});
    if(isD){
     joints.push({x:from+i*span,y:ceilingY-.006,z:depthAt(9.4),sx:.027,sy:.011,sz:18.8});
     if(endGate&&x>endGate.left&&x<endGate.right)blinds.push({x,y:y+glazingHeight-.43,z:depthAt(.125),sx:span-.13,sy:.82,sz:.025});
    }else if(!isCommon)joints.push({x:from+i*span,y:ceilingY-.006,z:depthAt(loungeDepth/2),sx:.027,sy:.011,sz:loungeDepth});
   }
   walls.push({x:(from+to)/2,y:y+.29,z:facadeZ,sx:to-from,sy:.58,sz:.23});
   if(isD)walls.push({x:(from+to)/2,y:y+(glazingHeight+clearHeight)/2,z:facadeZ,sx:to-from,sy:clearHeight-glazingHeight,sz:.25});
   mullions.push({x:(from+to)/2,y:y+(isD?2.40:2.64),z:facadeZ,sx:to-from,sy:.072,sz:.18});
   if(isCommon)mullions.push({x:(from+to)/2,y:y+4.06,z:facadeZ,sx:to-from,sy:.067,sz:.18});
  };
  let start=left;
  for(const bay of bays){
   const {gate,bridge,desk,carpets,left:bayLeft,right:bayRight}=bay;
   const {x}=bridge,door=CONCOURSE_DOOR_WIDTH,vestibuleDepth=Math.abs(bridge.z-facadeZ)+.08;
   apronPanes(start,x-door/2);start=x+door/2;
   const centerZ=facadeZ+side*vestibuleDepth/2;
   box(parent,door+.3,.45,vestibuleDepth,x,y-.225,centerZ,mats.cladding);
   box(parent,door+.35,.26,vestibuleDepth,x,y+2.96,centerZ,satin);
   for(const sign of [-1,1]){
    box(parent,.075,2.8,vestibuleDepth,x+sign*door/2,y+1.4,centerZ,mats.glass);
    frames.push({x:x+sign*door/2,y:y+clearHeight/2,z:facadeZ,sx:.17,sy:clearHeight,sz:.31});
   }
   glass.push({x,y:y+1.4,z:facadeZ,sx:door-.1,sy:2.8,ry});
   walls.push({x,y:y+(clearHeight+2.8)/2,z:facadeZ,sx:door,sy:clearHeight-2.8,sz:.25});
   frames.push({x,y:y+1.4,z:depthAt(.08),sx:.08,sy:2.8,sz:.15});
   const signY=y+(isD?3.15:3.34);
   box(parent,3.56,.94,.24,x,signY,depthAt(.37),steel);
   gateSign(parent,gate.id,x,signY,depthAt(.51),ry);

   box(parent,desk.width,1.04,desk.depth,desk.x,y+.52,desk.z,plaster);
   box(parent,desk.width+.09,.085,desk.depth+.1,desk.x,y+1.075,desk.z,steel);
   box(parent,desk.width-.26,.12,.05,desk.x,y+.17,desk.z-side*.58,satin);
   box(parent,.49,.35,.10,desk.x+.62,y+1.26,desk.z+side*.2,rubber);
   loungeSeating(parent,row,bay);
   if(isBCommonGate(gate.id))continue;
   for(const tile of carpets)box(parent,tile.width,.018,tile.depth,tile.x,y+.009,tile.z,floors.carpet);
   for(const depth of isD?[3.1,8.3,13.6]:[3.1,8.3,13.6,19.7]){
    const bayWidth=bayRight-bayLeft,count=Math.ceil(bayWidth/11);
    for(let i=0;i<count;i++){
     const x=bayLeft+(i+.5)*bayWidth/count,rest=T2_D_PUBLIC_CONCOURSE.rest;
     if(gate.id==='D10'&&Math.abs(x-rest.x)<rest.width/2+2)continue;
     luminaires.push({x,y:ceilingY-.116,z:depthAt(depth),sx:bayWidth/count-.65,sy:.055,sz:.32});
    }
   }
  }
  apronPanes(start,right);
  const panes=instances(parent,plane,mats.glass,glass);panes.receiveShadow=false;
  for(const p of row.columns){
   const common=row.wing==='B'&&p.x>=commonRoomStart;
   const top=common?t1BCommonCeiling(row,p.z):ceilingY;
   (common?commonColumns:frames).push({x:p.x,y:(y+top)/2,z:p.z,sx:p.width,sy:top-y,sz:p.depth});
  }
  const jointEnd=row.wing==='B'?commonRoomStart:right;
  for(const depth of isD?[5.4,10.8,16.2]:[5.4,10.8,16.2,21.6])joints.push({x:(left+jointEnd)/2,y:ceilingY-.013,z:depthAt(depth),sx:jointEnd-left,sy:.01,sz:.027});
  batch(parent,plaster,walls);batch(parent,satin,frames);batch(parent,diffuser,luminaires);batch(parent,ceilingJoint,joints);
  batch(parent,satin,commonColumns,roundColumn);batch(parent,steel,commonFrames);
  batch(parent,shade,blinds);
  addFloorContactShadows(parent,y+.025,[...row.columns,...bays.flatMap(bay=>[bay.desk,...bay.banks])],.24);
  const light=hallAreaLight(parent,b.x,ceilingY-.20,depthAt(isD?9:loungeDepth/2),b.width,isD?15:loungeDepth*.87,isD?.58:.55,'#f9f1e4');
  light.userData.hallLightBounds.bottom=y-.1;
  if(row.wing!=='D')buildSouthDepartureHall(parent,row.wing,mats);
 }
 buildSouthTerminalLink(parent,mats);
 buildT2GateConnections(parent,mats);
}
