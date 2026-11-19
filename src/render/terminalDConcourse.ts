import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {box,canvasTexture,instances,material,seeded} from './primitives';
import type {TerminalMaterials} from './terminalArchitecture';
import {buildingRectEdges,type BuildingRect} from './terminalBuildingLayout';
import {CONCOURSE_LEVEL,T2_D_PUBLIC_CONCOURSE as D,distanceInside,type GateConcourse} from './terminalConcourseLayout';
import {addCeilingLightReflections,addFloorContactShadows,terminalFloorMaterial} from './terminalFloorLighting';
import {hallAreaLight} from './terminalPublicHalls';
import {buildMovingWalkways} from './terminalMovingWalkways';
import {T2_GATE_LINKS} from './terminalGateLinks';
import {passengerWallSpans} from './terminalPassengerLayout';

type Item=Parameters<typeof instances>[3][number];
const unit=new THREE.BoxGeometry(1,1,1),softBox=new RoundedBoxGeometry(1,1,1,2,.10);
const recessedLamp=new THREE.CylinderGeometry(.5,.5,1,12);
const whitePanel=new THREE.MeshStandardMaterial({color:'#e2e0d7',roughness:.74,emissive:'#a6a292',emissiveIntensity:.27});
const sunwellPanel=material('#abc0c1',.62,.09);
const steel=material('#a7b1b2',.39,.47),tileJoints=material('#adb0a9',.77,.04),rail=material('#333734',.40,.2);
const warmJoinery=material('#9c7c5a',.61,.03),resin=material('#e3ded1',.40,.04),upholstery=material('#fff',.60);
const acousticPanels=material('#c5c6bb',.72,.03),mutedTeal=material('#769e9a',.66,.08);
const lamp=new THREE.MeshBasicMaterial({color:'#fff3dc',toneMapped:false});
const skylightGlass=new THREE.MeshPhysicalMaterial({
 color:'#c2d7dc',roughness:.29,metalness:.03,transparent:true,opacity:.26,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,
});

function groupParts(parent:THREE.Object3D,finish:THREE.Material,items:Item[],geometry:THREE.BufferGeometry=unit){
 if(items.length)instances(parent,geometry,finish,items).userData.staticFurnitureBatch=true;
}

let floorSurfaces:ReturnType<typeof createFloors>|undefined;
function createFloors(){
 const grain=canvasTexture(512,512,ctx=>{
  const random=seeded(61022);
  ctx.fillStyle='#a3a19b';ctx.fillRect(0,0,512,512);
  for(let i=0;i<34500;i++){
   const v=i%3?62+random()*75:171+random()*75,size=.45+random()*2.6;
   ctx.fillStyle=`rgba(${v},${v},${v-3},${.07+random()*.30})`;
   ctx.fillRect(random()*512,random()*512,size,size*.83);
  }
  ctx.strokeStyle='rgba(52,52,46,.24)';ctx.lineWidth=1.2;ctx.strokeRect(.6,.6,510.8,510.8);
 });
 const stone=terminalFloorMaterial('polished',{color:'#d1cdc4',map:grain,bumpMap:grain,bumpScale:.0025,emissive:'#646057',emissiveIntensity:.10});
 const inlay=terminalFloorMaterial('inlay',{color:'#333733',emissive:'#363633',emissiveIntensity:.06});
 const loungeTile=canvasTexture(256,256,ctx=>{
  const tiles=['#aaa7a1','#c4c0b7','#d0ccc3','#a19f9a','#d5d0c7','#bdb9b0','#a19e97','#d2cec6','#b2b0aa'];
  for(let i=0;i<tiles.length;i++){
   ctx.fillStyle=tiles[i];ctx.fillRect(i%3*86,Math.floor(i/3)*86,85,85);
  }
  ctx.globalAlpha=.13;ctx.drawImage(grain.image,0,0,256,256);
 });
 const lounge=terminalFloorMaterial('satin',{color:'#e1ddd4',map:loungeTile,emissive:'#706960',emissiveIntensity:.11});
 const wood=canvasTexture(256,256,ctx=>{
  const random=seeded(61023);
  ctx.fillStyle='#b49a7e';ctx.fillRect(0,0,256,256);
  for(let i=0;i<800;i++){
   const u=random()*256,v=random()*256;
   ctx.strokeStyle=i%3?'rgba(76,54,33,.18)':'rgba(241,220,190,.22)';
   ctx.lineWidth=.4+random()*.8;ctx.beginPath();ctx.moveTo(u,v);ctx.lineTo(u+30+random()*157,v+(random()-.5)*2);ctx.stroke();
  }
  for(let row=0;row<8;row++){
   ctx.fillStyle='rgba(66,53,42,.25)';ctx.fillRect(0,row*32,256,1);
   ctx.fillRect(row%2?128:0,row*32,1,32);
  }
 });
 const dining=terminalFloorMaterial('satin',{color:'#ddc5aa',map:wood,bumpMap:wood,bumpScale:.002,emissive:'#776148',emissiveIntensity:.11});
 for(const map of [grain,loungeTile,wood])map.wrapS=map.wrapT=THREE.RepeatWrapping;
 stone.userData.worldUV=.80;lounge.userData.worldUV=1/3.15;dining.userData.worldUV=.58;
 addCeilingLightReflections(stone,D.downlights,.19,1.45);
 addCeilingLightReflections(inlay,D.downlights,.17,1.15);
 return {stone,inlay,lounge,dining};
}

function surface(parent:THREE.Object3D,rect:BuildingRect,y:number,finish:THREE.Material){
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(rect.width,rect.depth),finish);
 mesh.rotation.x=-Math.PI/2;mesh.position.set(rect.x,y,rect.z);mesh.receiveShadow=true;parent.add(mesh);
}

function slabAround(parent:THREE.Object3D,region:BuildingRect,opening:BuildingRect,y:number,height:number,finish:THREE.Material){
 const b=buildingRectEdges(region),o=buildingRectEdges(opening);
 const strips=[[b.left,o.left,b.near,b.far],[o.right,b.right,b.near,b.far],
  [o.left,o.right,b.near,o.near],[o.left,o.right,o.far,b.far]];
 for(const [left,right,near,far] of strips)if(right>left&&far>near)box(parent,right-left,height,far-near,(left+right)/2,y,(near+far)/2,finish);
}

function ceilingAndRoof(parent:THREE.Object3D,row:GateConcourse,mats:TerminalMaterials){
 const {bounds:b}=row,y=D.ceiling,well=D.skylight,d=(depth:number)=>distanceInside(row,depth);
 const left=b.x-b.width/2,right=b.x+b.width/2;
 const band=(near:number,far:number,height:number,finish:THREE.Material)=>box(parent,b.width,.16,far-near,b.x,height+.08,d((near+far)/2),finish);
 band(0,22.15,y,whitePanel);
 band(22.15,26.85,y+.35,sunwellPanel);
 for(const depth of [22.15,26.85])box(parent,b.width,.39,.10,b.x,y+.175,d(depth),sunwellPanel);
 slabAround(parent,{x:b.x,z:d((26.85+row.loungeDepth)/2),width:b.width,depth:row.loungeDepth-26.85},well,y+.08,.16,whitePanel);
 // Trim and glazing seal the same opening in the roof above the lower soffit.
 const link=T2_GATE_LINKS.D,roofNear=b.z-b.depth/2-.48,roofFar=b.z+b.depth/2+.48,roof=mats.roof??steel;
 slabAround(parent,{x:b.x,width:b.width+1.2,z:(roofNear+link.wingEntrance)/2,depth:link.wingEntrance-roofNear},well,b.height-.3,.78,roof);
 for(const span of passengerWallSpans(left-.6,right+.6,[link]))
  box(parent,span.right-span.left,.78,roofFar-link.wingEntrance,(span.left+span.right)/2,b.height-.3,(roofFar+link.wingEntrance)/2,roof);
 const top=b.height-.35,wellHeight=top-y,edges=buildingRectEdges(well),sill=.12;
 for(const x of [edges.left,edges.right])box(parent,sill,wellHeight,well.depth,x,y+wellHeight/2,well.z,sunwellPanel);
 for(const z of [edges.near,edges.far])box(parent,well.width,wellHeight,sill,well.x,y+wellHeight/2,z,sunwellPanel);
 const half=well.depth/2,rise=.48,angle=Math.atan2(rise,half);
 for(const side of [-1,1]){
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(well.width,Math.hypot(half,rise)),skylightGlass);
  pane.rotation.x=-Math.PI/2+side*angle;
  pane.position.set(well.x,top+rise/2,well.z+side*half/2);
  parent.add(pane);
  box(parent,well.width,.12,.10,well.x,top,well.z+side*half,steel);
 }
 box(parent,well.width,.14,.12,well.x,top+rise,well.z,steel);
 const beams:Item[]=[],joints:Item[]=[],lights:Item[]=[],covers:Item[]=[];
 for(let x=edges.left+.16;x<edges.right;x+=3.45)beams.push({x,y:top-.07,z:well.z,sx:.12,sy:.16,sz:well.depth});
 for(const z of D.downlights.rows){
  for(let x=D.downlights.first;x<=D.downlights.last+.01;x+=D.downlights.pitch){
   lights.push({x,y:D.downlights.height,z,sx:.265,sy:.027,sz:.265});
   covers.push({x,y:D.downlights.height+.018,z,sx:.34,sy:.043,sz:.34});
  }
 }
 for(let x=left+1.4;x<right;x+=2.75){
  joints.push({x,y:y-.009,z:d(20.5),sx:.024,sy:.022,sz:3.3});
  joints.push({x,y:y-.009,z:d(28.75),sx:.024,sy:.022,sz:3.68});
 }
 for(const depth of [19.6,21.38,27.68,29.46])joints.push({x:b.x,y:y-.009,z:d(depth),sx:b.width,sy:.022,sz:.022});
 groupParts(parent,steel,beams);
 groupParts(parent,tileJoints,joints);
 groupParts(parent,steel,covers,recessedLamp);
 groupParts(parent,lamp,lights,recessedLamp);
 const coreLight=hallAreaLight(parent,b.x,y-.23,D.aisle.z,b.width,10.2,.49,'#fff3dd');
 coreLight.userData.hallLightBounds.bottom=CONCOURSE_LEVEL;
 const pocket=hallAreaLight(parent,well.x,top-.34,well.z,well.width-2,well.depth-1,.72,'#f8f1e4');
 pocket.userData.hallLightBounds.bottom=CONCOURSE_LEVEL;
}

function seatedPockets(parent:THREE.Object3D,floor:ReturnType<typeof createFloors>){
 const y=CONCOURSE_LEVEL,plinths:Item[]=[],pads:Item[]=[],rests:Item[]=[],backs:Item[]=[],tables:Item[]=[],stems:Item[]=[];
 surface(parent,D.dining,y+.028,floor.dining);
 surface(parent,D.rest,y+.028,floor.lounge);
 for(const {x,z,width,depth,color} of D.couches){
  plinths.push({x,y:y+.155,z,sx:width-.11,sy:.29,sz:depth-.08});
  const seats=Math.floor(width/.96),spacing=width/seats;
  for(let i=0;i<seats;i++){
   const px=x+(i-(seats-1)/2)*spacing;
   pads.push({x:px,y:y+.405,z,sx:spacing-.038,sy:.25,sz:depth,color});
   backs.push({x:px,y:y+.70,z:z+.40,sx:spacing-.048,sy:.54,sz:.30,color});
   if(i>0)rests.push({x:px-spacing/2,y:y+.56,z:z+.07,sx:.17,sy:.23,sz:.52,color});
  }
 }
 const counter=D.diningDesk;
 box(parent,counter.width,1.11,counter.depth,counter.x,y+.555,counter.z,rail);
 const panels:Item[]=[];
 for(let x=counter.x-counter.width/2+.12;x<counter.x+counter.width/2;x+=.17){
  panels.push({x,y:y+.59,z:counter.z-counter.depth/2-.027,sx:.07,sy:.92,sz:.052,color:'#557472'});
 }
 groupParts(parent,upholstery,panels);
 box(parent,counter.width+.08,.095,counter.depth+.07,counter.x,y+1.135,counter.z,resin);
 for(const p of D.tables){
  tables.push({x:p.x,y:y+.75,z:p.z,sx:p.width,sy:.075,sz:p.depth});
  stems.push({x:p.x,y:y+.36,z:p.z,sx:.12,sy:.68,sz:.12});
  for(const end of [-1,1]){
   const z=p.z+end*.64;
   rests.push({x:p.x,y:y+.47,z,sx:.47,sy:.095,sz:.47,color:'#87918c'});
   backs.push({x:p.x,y:y+.65,z:z+end*.21,sx:.47,sy:.40,sz:.10,color:'#87918c'});
   stems.push({x:p.x,y:y+.25,z,sx:.095,sy:.42,sz:.095});
  }
 }
 groupParts(parent,resin,plinths,softBox);groupParts(parent,upholstery,pads,softBox);
 groupParts(parent,upholstery,rests,softBox);groupParts(parent,upholstery,backs,softBox);
 groupParts(parent,warmJoinery,tables);groupParts(parent,steel,stems);
 addFloorContactShadows(parent,y+.034,[...D.couches,D.diningDesk,...D.tables],.40);
}

function restAreaCeiling(parent:THREE.Object3D,row:GateConcourse){
 const {rest}=D,y=D.ceiling-.15,left=row.bounds.x-row.bounds.width/2;
 const downlights:Item[]=[],seams:Item[]=[];
 box(parent,rest.width,.13,rest.depth,rest.x,y+.065,rest.z,whitePanel);
 for(let x=rest.x-rest.width/2+2.05;x<rest.x+rest.width/2;x+=4.12){
  for(const z of [rest.z-4.4,rest.z,rest.z+4.4]){
   downlights.push({x,y:y-.017,z,sx:.255,sy:.024,sz:.255});
  }
  seams.push({x:x+1.95,y:y-.008,z:rest.z,sx:.019,sy:.016,sz:rest.depth});
 }
 for(const z of [rest.z-3.48,rest.z+1.12,rest.z+5.72]){
  seams.push({x:rest.x,y:y-.009,z,sx:rest.width,sy:.017,sz:.018});
 }
 box(parent,.026,2.46,rest.depth,left+.32,CONCOURSE_LEVEL+2.43,rest.z,acousticPanels);
 box(parent,.036,1.18,rest.depth,left+.31,CONCOURSE_LEVEL+.59,rest.z,mutedTeal);
 groupParts(parent,tileJoints,seams);
 groupParts(parent,lamp,downlights,recessedLamp);
 const light=hallAreaLight(parent,rest.x,y-.22,rest.z,rest.width-3,rest.depth-1,.80,'#fff3df');
 light.userData.hallLightBounds.bottom=CONCOURSE_LEVEL;
}

function inboardWallPanels(parent:THREE.Object3D,row:GateConcourse){
 const {bounds:b}=row,z=distanceInside(row,row.loungeDepth-.36),y=CONCOURSE_LEVEL,joints:Item[]=[],vents:Item[]=[],link=T2_GATE_LINKS.D;
 for(const span of passengerWallSpans(b.x-b.width/2,b.x+b.width/2,[link])){
  const width=span.right-span.left,x=(span.left+span.right)/2;
  box(parent,width,.17,.065,x,y+.096,z,steel);
  box(parent,width,.036,.048,x,y+2.02,z,tileJoints);
 }
 for(let x=b.x-b.width/2+3.6;x<b.x+b.width/2;x+=3.6){
  if(x>=link.left-1&&x<=link.right+2.4)continue;
  joints.push({x,y:y+1.9,z,sx:.016,sy:3.48,sz:.028});
  if(joints.length%3===1)vents.push({x:x-1.4,y:y+3.24,z,sx:1.8,sy:.18,sz:.061});
 }
 groupParts(parent,tileJoints,joints);
 groupParts(parent,acousticPanels,vents);
}

function mainWayfinding(parent:THREE.Object3D){
 const x=D.dining.x-1.15,y=D.ceiling-.67,z=D.aisle.z;
 box(parent,.19,1.0,6.5,x,y,z,rail);
 for(const end of [-1,1])box(parent,.048,.22,.048,x,D.ceiling-.075,z+end*2.94,steel);
 for(const side of [-1,1]){
  const map=canvasTexture(640,112,ctx=>{
   ctx.fillStyle='#2447ac';ctx.fillRect(0,0,640,112);
   ctx.fillStyle='#f4f6f2';
   ctx.beginPath();ctx.moveTo(54,22);ctx.lineTo(81,52);ctx.lineTo(64,52);ctx.lineTo(64,83);
   ctx.lineTo(44,83);ctx.lineTo(44,52);ctx.lineTo(27,52);ctx.fill();
   ctx.font='bold 38px Arial,"Microsoft JhengHei",sans-serif';ctx.fillText('登機門',109,50);
   ctx.font='24px Arial,sans-serif';ctx.fillText('Gates',111,83);
   ctx.font='bold 57px Arial,sans-serif';ctx.fillText(side===1?'D7–D10':'D1–D6',306,76);
  });
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(6.4,.92),new THREE.MeshBasicMaterial({map,toneMapped:false}));
  panel.position.set(x+side*.103,y,z);panel.rotation.y=side*Math.PI/2;panel.userData.staticTerminalSign=true;parent.add(panel);
 }
}

export function buildTerminalDConcourse(parent:THREE.Object3D,row:GateConcourse,mats:TerminalMaterials){
 const y=CONCOURSE_LEVEL,floor=floorSurfaces??=createFloors(),d=(depth:number)=>distanceInside(row,depth);
 surface(parent,D.aisle,y+.014,floor.stone);
 for(const depth of [19.35,30.65])surface(parent,{...D.aisle,z:d(depth),depth:.57},y+.021,floor.inlay);
 surface(parent,{...D.rest,z:d(17.25),depth:.45},y+.032,floor.inlay);
 const posts=[...D.pillars,...D.restPillars,...D.diningPillars];
 for(const {x,z,width,depth} of posts){
  const height=D.ceiling-y;
  box(parent,width,height,depth,x,y+height/2,z,whitePanel);
  box(parent,width+.055,.18,depth+.055,x,y+.091,z,steel);
  box(parent,.038,height-.36,.036,x-width/2+.05,y+height/2+.02,z-depth/2-.020,lamp);
 }
 box(parent,D.dining.width,.30,.54,D.dining.x,D.ceiling-.15,d(31.34),resin);
 box(parent,D.rest.width,.25,.57,D.rest.x,D.ceiling-.18,d(17),whitePanel);
 ceilingAndRoof(parent,row,mats);
 restAreaCeiling(parent,row);
 inboardWallPanels(parent,row);
 buildMovingWalkways(parent,y,D.belts);
 seatedPockets(parent,floor);
 mainWayfinding(parent);
 addFloorContactShadows(parent,y+.035,[...posts,...D.rails],.17);
}
