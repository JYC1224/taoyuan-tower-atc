import * as THREE from 'three';
import {box,canvasTexture,instances,material,seeded} from './primitives';
import type {TerminalMaterials} from './terminalArchitecture';
import {buildingRectEdges,type BuildingRect} from './terminalBuildingLayout';
import {CONCOURSE_LEVEL,type GateConcourse} from './terminalConcourseLayout';
import {
 SOUTH_DEPARTURE_DECKS,SOUTH_DEPARTURE_LEVEL,SOUTH_DEPARTURE_LINK,SOUTH_DEPARTURE_WALK_Z,
 T1_B_COMMON_ROOM,T2_C1_WOOD_ROOM,southStairMeasures,southWalkwayRails,t1BCommonCeiling,type SouthWing,
} from './terminalSouthPassageLayout';
import {addCeilingLightReflections,addFloorContactShadows,terminalFloorMaterial} from './terminalFloorLighting';
import {buildMovingWalkways} from './terminalMovingWalkways';
import {hallAreaLight} from './terminalPublicHalls';
import {T1_B_DEPARTURE_LINK,passengerWallSpans} from './terminalPassengerLayout';
import {T2_GATE_LINKS} from './terminalGateLinks';

type Part=Parameters<typeof instances>[3][number];
const unit=new THREE.BoxGeometry(1,1,1),round=new THREE.CylinderGeometry(.5,.5,1,18);
const plaster=new THREE.MeshStandardMaterial({color:'#efe9dc',roughness:.69,emissive:'#9f9885',emissiveIntensity:.20});
const wall=material('#d4d2c8',.69,.045),seam=material('#8f9893',.66,.075);
const steel=material('#aeb9ba',.39,.49),dark=material('#33434a',.54,.24);
const lowerCap=material('#5c7778',.58,.21),beam=material('#9f9c84',.54,.18),soil=material('#464136',.95);
const diffuser=new THREE.MeshBasicMaterial({color:'#fff5e4',toneMapped:false});
const glass=new THREE.MeshPhysicalMaterial({color:'#b2cbd0',roughness:.24,metalness:.045,
 transparent:true,opacity:.26,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true});

function batch(parent:THREE.Object3D,finish:THREE.Material,items:Part[],geometry:THREE.BufferGeometry=unit){
 if(items.length)instances(parent,geometry,finish,items).userData.staticFurnitureBatch=true;
}

function cover(parent:THREE.Object3D,region:BuildingRect,hole:BuildingRect,y:number,thickness:number,finish:THREE.Material){
 const bounds=buildingRectEdges(region),open=buildingRectEdges(hole);
 for(const [left,right,near,far] of [
  [bounds.left,open.left,bounds.near,bounds.far],[open.right,bounds.right,bounds.near,bounds.far],
  [open.left,open.right,bounds.near,open.near],[open.left,open.right,open.far,bounds.far],
 ]){
  if(right>left&&far>near)box(parent,right-left,thickness,far-near,(left+right)/2,y,(near+far)/2,finish);
 }
}

function faceFloor(parent:THREE.Object3D,region:BuildingRect,y:number,finish:THREE.Material){
 const item=new THREE.Mesh(new THREE.PlaneGeometry(region.width,region.depth),finish);
 item.rotation.x=-Math.PI/2;item.position.set(region.x,y,region.z);item.receiveShadow=true;parent.add(item);
}

let floorFinishes:ReturnType<typeof createFloorFinishes>|undefined;
function createFloorFinishes(){
 const mineral=canvasTexture(512,512,ctx=>{
  ctx.fillStyle='#b2afa4';ctx.fillRect(0,0,512,512);
  const random=seeded(952771);
  for(let i=0;i<27500;i++){
   const v=Math.floor(i%3?38+random()*118:182+random()*69),size=.57+random()*3.0;
   ctx.fillStyle=`rgba(${v},${v+2},${v},${.12+random()*.38})`;
   ctx.fillRect(random()*512,random()*512,size,size*.82);
  }
  ctx.strokeStyle='rgba(57,57,54,.25)';ctx.lineWidth=1.3;ctx.strokeRect(.65,.65,510.7,510.7);
 });
 const timber=canvasTexture(512,256,ctx=>{
  const random=seeded(68802);
  for(let row=0;row<8;row++){
   const y=row*32,g=Math.floor(random()*18),base=`rgb(${159+g},${117+g},${70+g})`;
   ctx.fillStyle=base;ctx.fillRect(0,y,512,32);
   for(let j=0;j<105;j++){
    const x=random()*512,py=y+random()*31;
    ctx.strokeStyle=j%3?'rgba(69,46,32,.15)':'rgba(255,231,185,.19)';
    ctx.lineWidth=.23+random()*.62;ctx.beginPath();ctx.moveTo(x,py);ctx.lineTo(x+30+random()*125,py+random()*.55);ctx.stroke();
   }
   ctx.fillStyle='rgba(63,47,34,.38)';ctx.fillRect(0,y,512,.75);ctx.fillRect(row%2===0?203:389,y,1.15,32);
  }
 });
 for(const tex of [mineral,timber])tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
 const sediment=terminalFloorMaterial('polished',{color:'#b8b9b1',map:mineral,bumpMap:mineral,bumpScale:.0018,
  emissive:'#73736a',emissiveIntensity:.12});
 const charcoal=terminalFloorMaterial('inlay',{color:'#343a38'});
 const lagoon=terminalFloorMaterial('polished',{color:'#86a3ad',map:mineral,bumpMap:mineral,bumpScale:.0013,
  emissive:'#465e64',emissiveIntensity:.15,roughness:.26});
 const woodFloor=terminalFloorMaterial('satin',{color:'#f4d4a3',map:timber,bumpMap:timber,bumpScale:.002,
  emissive:'#6b5238',emissiveIntensity:.095});
 sediment.userData.worldUV=.88;lagoon.userData.worldUV=.71;woodFloor.userData.worldUV=.71;
 return {sediment,charcoal,lagoon,woodFloor};
}

let woodTrim:THREE.MeshStandardMaterial|undefined;
function timberTrim(){
 if(woodTrim)return woodTrim;
 const tex=canvasTexture(256,256,ctx=>{
  const random=seeded(45023);
  ctx.fillStyle='#a57950';ctx.fillRect(0,0,256,256);
  for(let i=0;i<680;i++){
   const x=random()*256,y=random()*256;ctx.fillStyle=i%4?'#62493128':'#ead1a444';
   ctx.fillRect(x,y,random()*78+11,.35+random()*.88);
  }
 });
 tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
 woodTrim=material('#e4caae',.47,.035);
 woodTrim.map=tex;woodTrim.bumpMap=tex;woodTrim.bumpScale=.003;
 return woodTrim;
}

let ceilingTiles:THREE.MeshStandardMaterial|undefined,grilleLights:THREE.MeshBasicMaterial|undefined;
function commonRoomCeilingFinishes(){
 if(!ceilingTiles){
  const map=canvasTexture(128,128,ctx=>{
   const random=seeded(862745);
   ctx.fillStyle='#efede6';ctx.fillRect(0,0,128,128);
   for(let i=0;i<1900;i++){
    ctx.fillStyle=i%2?'rgba(103,94,81,.14)':'rgba(255,255,255,.48)';
    ctx.fillRect(random()*128,random()*128,.75,1.02);
   }
   ctx.strokeStyle='#7f7e77';ctx.lineWidth=1.1;ctx.strokeRect(.4,.4,127.2,127.2);
  });
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  ceilingTiles=plaster.clone();ceilingTiles.map=map;
 }
 if(!grilleLights){
  const map=canvasTexture(160,32,ctx=>{
   ctx.fillStyle='#b3aea2';ctx.fillRect(0,0,160,32);
   for(let x=0;x<5;x++){
    ctx.fillStyle='#7d796d';ctx.fillRect(x*32+2,2,27,27);
    ctx.fillStyle='#fff7e8';ctx.fillRect(x*32+4,4,24,24);
    ctx.fillStyle='#ebe2d3';ctx.fillRect(x*32+5,4,22,2);
   }
  });
  map.wrapT=THREE.RepeatWrapping;
  grilleLights=new THREE.MeshBasicMaterial({map,toneMapped:false});
 }
 return {ceilingTiles,grilleLights};
}

function t1CommonRoom(parent:THREE.Object3D,row:GateConcourse){
 const {floor,wall:core}=T1_B_COMMON_ROOM,y=CONCOURSE_LEVEL,f=buildingRectEdges(floor),left=f.left,right=f.right;
 const finishes=floorFinishes??=createFloorFinishes();
 faceFloor(parent,floor,y+.020,finishes.lagoon);
 const {ceilingTiles,grilleLights}=commonRoomCeilingFinishes();
 const clearY=(z:number)=>t1BCommonCeiling(row,z),nearY=clearY(f.near),farY=clearY(f.far);
 const soffit=new THREE.BufferGeometry();
 soffit.setAttribute('position',new THREE.Float32BufferAttribute([
  left,nearY,f.near,right,nearY,f.near,left,farY,f.far,right,farY,f.far,
 ],3));
 soffit.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,floor.width/.94,0,0,floor.depth/.86,floor.width/.94,floor.depth/.86],2));
 soffit.setIndex([0,1,2,1,3,2]);soffit.computeVertexNormals();
 const lining=new THREE.Mesh(soffit,ceilingTiles);lining.receiveShadow=true;parent.add(lining);
 const rise=nearY-farY,angle=Math.atan2(rise,floor.depth),lightDepth=Math.hypot(floor.depth,rise)-.48;
 const grille=new THREE.PlaneGeometry(.82,lightDepth).rotateX(Math.PI/2),uv=grille.getAttribute('uv');
 for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)*Math.round(lightDepth/.164));
 for(let x=left+2.6;x<right-.8;x+=4.46){
  const panel=new THREE.Mesh(grille,grilleLights);
  panel.rotation.x=angle;panel.position.set(x,clearY(floor.z)-.044,floor.z);parent.add(panel);
 }
 const width=core.width/2,depth=core.depth,h=5.10;
 const curve=new THREE.Shape();
 curve.moveTo(-width,0);curve.lineTo(width,0);
 curve.bezierCurveTo(width*.91,-depth*.82,width*.48,-depth,0,-depth);
 curve.bezierCurveTo(-width*.48,-depth,-width*.91,-depth*.82,-width,0);curve.closePath();
 const shellGeometry=new THREE.ExtrudeGeometry(curve,{depth:h,bevelEnabled:false,curveSegments:18}).rotateX(-Math.PI/2);
 const shell=new THREE.Mesh(shellGeometry,plaster);
 shell.position.set(core.x,y,f.near+.018);shell.castShadow=shell.receiveShadow=true;parent.add(shell);
 const plinth=new THREE.Mesh(shellGeometry,lowerCap);plinth.position.copy(shell.position);plinth.scale.set(1.005,.027,1.015);parent.add(plinth);
 const crown=new THREE.Mesh(shellGeometry,ceilingTiles);crown.position.set(core.x,y+h-.13,f.near+.018);crown.scale.set(1.005,.024,1.03);parent.add(crown);
 const serviceX=core.x-width-2.34,serviceZ=f.near+.33;
 box(parent,3.7,2.47,.07,serviceX,y+1.24,serviceZ,dark);
 for(let i=-1;i<=1;i++){
  box(parent,1.10,2.27,.035,serviceX+i*1.18,y+1.23,serviceZ+.041,glass);
  box(parent,1.10,.042,.044,serviceX+i*1.18,y+1.17,serviceZ+.053,steel);
 }
 const light=hallAreaLight(parent,floor.x,farY-.30,f.far-2.5,floor.width-7,4.9,.62,'#f1f5f8');
 light.userData.hallLightBounds.bottom=y-.10;
 addFloorContactShadows(parent,y+.025,[core],.31);
}

export function buildSouthLowerCeiling(parent:THREE.Object3D,row:GateConcourse,mats:TerminalMaterials,finish:THREE.Material){
 const wing=row.wing as SouthWing,b=row.bounds,y=b.height-.95,layout=SOUTH_DEPARTURE_DECKS[wing],upper=buildingRectEdges(layout.floor);
 const roofEdge=row.facadeZ+.48;
 box(parent,b.width+1.2,.78,roofEdge-upper.far,b.x,b.height-.3,(roofEdge+upper.far)/2,mats.roof??steel);
 const left=b.x-b.width/2,right=wing==='B'?buildingRectEdges(T1_B_COMMON_ROOM.floor).left:b.x+b.width/2;
 cover(parent,{x:(left+right)/2,z:row.facadeZ-row.loungeDepth/2,width:right-left,depth:row.loungeDepth},layout.stair,y+.08,.16,finish);
 if(wing==='B')t1CommonRoom(parent,row);
 // A low fascia conceals the floor edge where the two roof heights meet.
 const height=SOUTH_DEPARTURE_LEVEL-(b.height-.68);
 box(parent,b.width+.36,height,.17,b.x,b.height-.68+height/2,upper.far,mats.cladding);
}

function shaftRail(parent:THREE.Object3D,flight:BuildingRect,y:number){
 const e=buildingRectEdges(flight),top=y+1.08;
 for(const z of [e.near,e.far]){
  box(parent,flight.width,.057,.059,flight.x,top,z,steel);
  box(parent,flight.width-.055,.88,.028,flight.x,y+.51,z,glass);
  for(let x=e.left+.08;x<e.right;x+=2.30)box(parent,.053,1.08,.055,x,y+.54,z,steel);
 }
 box(parent,.057,.057,flight.depth,e.left,top,flight.z,steel);
 box(parent,.028,.89,flight.depth,e.left,y+.51,flight.z,glass);
}

function stairs(parent:THREE.Object3D,wing:SouthWing){
 const flight=southStairMeasures(wing),rise=(flight.upper-flight.lower)/flight.steps,e=buildingRectEdges(flight);
 const treads:Part[]=[],strips:Part[]=[];
 for(let step=1;step<=flight.steps;step++){
  const x=flight.bottomX+(step-.5)*flight.tread,level=flight.lower+step*rise;
  treads.push({x,y:level-rise*.61,z:flight.z,sx:flight.tread+.009,sy:rise*1.31,sz:flight.depth-.25});
  strips.push({x:x-flight.tread/2+.032,y:level+.020,z:flight.z,sx:.060,sy:.012,sz:flight.depth-.27});
 }
 batch(parent,wall,treads);batch(parent,dark,strips);
 const start=new THREE.Vector3(flight.bottomX,flight.lower+.94,0),end=new THREE.Vector3(flight.topX,flight.upper+.94,0);
 const railLength=start.distanceTo(end),angle=Math.atan2(end.y-start.y,end.x-start.x);
 for(const z of [e.near+.10,e.far-.10]){
  const rail=box(parent,railLength,.068,.06,flight.x,(start.y+end.y)/2,z,steel);
  rail.rotation.z=angle;
  const stringer=box(parent,railLength,.29,.13,flight.x,(flight.lower+flight.upper)/2-.16,z,steel);
  stringer.rotation.z=angle;
  for(let step=0;step<=flight.steps;step+=4){
   const t=step/flight.steps,x=THREE.MathUtils.lerp(flight.bottomX,flight.topX,t),y=THREE.MathUtils.lerp(flight.lower,flight.upper,t);
   box(parent,.060,.93,.055,x,y+.46,z,steel);
  }
 }
 // The east landing stays open. The other three edges guard the stairwell.
 shaftRail(parent,flight,flight.upper);
}

function deckEnd(parent:THREE.Object3D,x:number,edges:ReturnType<typeof buildingRectEdges>,y:number,ceiling:number,opening:boolean){
 const link=buildingRectEdges(SOUTH_DEPARTURE_LINK),height=ceiling-y;
 const ranges=opening?[[edges.near,link.near],[link.far,edges.far]]:[[edges.near,edges.far]];
 for(const [near,far] of ranges){
  if(far>near)box(parent,.25,height,far-near,x,y+height/2,(near+far)/2,wall);
 }
 if(opening)box(parent,.26,height-2.93,link.far-link.near,x,y+(height+2.93)/2,SOUTH_DEPARTURE_LINK.z,dark);
}

function wayfinding(parent:THREE.Object3D,x:number,z:number,ceiling:number,width:number,towardWest:string,towardEast:string){
 const y=ceiling-.61;
 box(parent,.16,.79,width,x,y,z,dark);
 for(const offset of [-.41,.41])box(parent,.045,.28,.044,x,ceiling-.083,z+offset*width,steel);
 for(const side of [-1,1]){
  const labels=(side===1?towardWest:towardEast).split('|');
  const tex=canvasTexture(640,120,ctx=>{
   ctx.fillStyle='#203d84';ctx.fillRect(0,0,640,120);ctx.fillStyle='#fff7e6';
   if(labels.length===1){
    ctx.font='600 86px Arial';ctx.textAlign='center';ctx.fillText(labels[0],320,91);
    return;
   }
   ctx.font='700 67px Arial';ctx.fillText('↑',18,85);
   ctx.font='700 43px "Microsoft JhengHei",sans-serif';ctx.fillText(labels[0],101,50,521);
   ctx.font='500 27px Arial,sans-serif';ctx.fillText(labels[1],102,94,521);
  });
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(width-.085,.73),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));
  panel.rotation.y=side*Math.PI/2;panel.position.set(x+side*.086,y,z);
  panel.userData.staticTerminalSign=true;parent.add(panel);
 }
}

let foliageFinish:THREE.MeshStandardMaterial|undefined;
function c1Foliage(){
 if(foliageFinish)return foliageFinish;
 const map=canvasTexture(256,256,ctx=>{
  const random=seeded(18238);
  for(let branch=0;branch<9;branch++){
   const endX=23+branch*26,endY=17+random()*32;
   const baseX=122+random()*18,baseY=242-random()*38;
   ctx.beginPath();ctx.moveTo(baseX,baseY);ctx.quadraticCurveTo((baseX+endX)*.56,111,endX,endY);
   ctx.strokeStyle='#504638';ctx.lineWidth=2.8;ctx.stroke();
   for(let leaf=0;leaf<16;leaf++){
    const t=.25+random()*.77,x=baseX+(endX-baseX)*t+(random()-.5)*42,
     y=baseY+(endY-baseY)*t+(random()-.5)*27;
    const length=5+random()*10,width=3+random()*4;
    ctx.save();ctx.translate(x,y);ctx.rotate((random()-.5)*5.2);
    const green=Math.floor(53+random()*66);
    ctx.fillStyle=`rgb(${green*.71},${green},${green*.54})`;
    ctx.beginPath();ctx.moveTo(-length,0);ctx.quadraticCurveTo(-2,-width,length,0);ctx.quadraticCurveTo(0,width,-length,0);ctx.fill();
    ctx.strokeStyle='rgba(182,183,131,.29)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-length*.7,0);ctx.lineTo(length*.65,0);ctx.stroke();ctx.restore();
   }
  }
 });
 foliageFinish=new THREE.MeshStandardMaterial({map,side:THREE.DoubleSide,alphaTest:.46,roughness:.87,metalness:0});
 return foliageFinish;
}

function c1WoodRoom(parent:THREE.Object3D,ceiling:number,floors:ReturnType<typeof createFloorFinishes>){
 const {floor,benches,planters,posts}=T2_C1_WOOD_ROOM,f=buildingRectEdges(floor),y=SOUTH_DEPARTURE_LEVEL,wood=timberTrim();
 faceFloor(parent,floor,y+.013,floors.woodFloor);
 const ceilingY=ceiling-.12,fins:Part[]=[],ribs:Part[]=[],pillars:Part[]=[],woodParts:Part[]=[],plants:Part[]=[],pots:Part[]=[],beds:Part[]=[],spots:Part[]=[];
 const graphite=material('#292d2d',.61,.08),ribbedWall=material('#2d3435',.64,.21),base=material('#3e2f26',.62,.04);
 box(parent,floor.width,.14,floor.depth,floor.x,ceilingY+.079,floor.z,dark);
 const headerY=ceilingY-.32;
 box(parent,floor.width,.54,.44,floor.x,headerY,posts[0].z,graphite);
 box(parent,floor.width,.06,.47,floor.x,headerY+.27,posts[0].z,plaster);
 for(const p of posts)box(parent,p.width,headerY-y,p.depth,p.x,(headerY+y)/2,p.z,graphite);
 box(parent,floor.width,2.66,.20,floor.x,y+1.33,f.far-.18,ribbedWall);
 box(parent,floor.width,.30,.25,floor.x,y+.15,f.far-.16,base);
 for(let z=f.near+.10;z<f.far;z+=.188)fins.push({x:floor.x,y:ceilingY,z,sx:floor.width,sy:.085,sz:.158});
 for(let x=f.left+2.5;x<f.right;x+=6.2){
  ribs.push({x,y:ceilingY-.053,z:floor.z,sx:.47,sy:.040,sz:floor.depth-.08});
  for(const z of [f.near+.72,floor.z,f.far-.68])spots.push({x,y:ceilingY-.075,z,sx:.16,sy:.013,sz:.16});
 }
 for(let x=f.left+.20;x<f.right;x+=.258)woodParts.push({x,y:y+1.32,z:f.far-.285,sx:.082,sy:2.54,sz:.107});
 const backrest=material('#9c7550',.58,.025);
 for(const p of benches){
  box(parent,p.width-.23,.34,p.depth-.14,p.x,y+.17,p.z,base);
  woodParts.push({x:p.x,y:y+.387,z:p.z,sx:p.width,sy:.12,sz:p.depth});
  box(parent,p.width-.08,.49,.15,p.x,y+.68,p.z+p.depth/2-.095,backrest);
 }
 const rand=seeded(44883),bark=material('#564735',.80,.015);
 for(const p of planters){
  pots.push({x:p.x,y:y+.16,z:p.z,sx:p.width-.06,sy:.32,sz:p.depth-.06});
  for(let rib=0;rib<32;rib++){
   const a=rib*Math.PI/16;
   pots.push({x:p.x+Math.cos(a)*(p.width/2-.06),y:y+.162,z:p.z+Math.sin(a)*(p.depth/2-.06),sx:.063,sy:.325,sz:.063});
  }
  beds.push({x:p.x,y:y+.322,z:p.z,sx:p.width-.19,sy:.013,sz:p.depth-.17});
  for(let tree=0;tree<4;tree++){
   const x=p.x+(tree-1.5)*p.width*.15,z=p.z+(rand()-.5)*.59,height=1.62+rand()*.97;
   const diameter=.067+rand()*.05;
   pillars.push({x,y:y+.32+height/2,z,sx:diameter,sy:height,sz:diameter});
   for(let i=0;i<14;i++){
    const a=rand()*Math.PI*2,r=.13+rand()*.59;
    plants.push({x:x+Math.cos(a)*r,y:Math.min(ceilingY-.34,y+.41+height+rand()*.37),z:z+Math.sin(a)*r,
     sx:.50+rand()*.70,sy:.49+rand()*.44,ry:a,color:i%3?'#e8e9d6':'#c9d0b2'});
   }
  }
  for(let i=0;i<23;i++){
   const a=i*2.4,r=.24+rand()*.67;
   plants.push({x:p.x+Math.cos(a)*r*p.width*.40,y:y+.49+rand()*.14,z:p.z+Math.sin(a)*r*p.depth*.40,
    sx:.24+rand()*.32,sy:.26+rand()*.38,ry:a,color:i%4?'#d6ddaf':'#efe1ac'});
  }
 }
 batch(parent,wood,fins);batch(parent,plaster,ribs);batch(parent,wood,woodParts);
 batch(parent,base,pots,round);batch(parent,soil,beds,round);batch(parent,bark,pillars,round);batch(parent,diffuser,spots,round);
 batch(parent,c1Foliage(),plants,new THREE.PlaneGeometry(1,1));
 addFloorContactShadows(parent,y+.020,[...benches,...planters],.28);
 wayfinding(parent,f.left+1.2,SOUTH_DEPARTURE_WALK_Z+.18,ceiling,1.66,'C1','C1');
 const light=hallAreaLight(parent,floor.x,ceilingY-.29,floor.z,floor.width-1.5,floor.depth-1.7,.72,'#ffddaf');
 light.userData.hallLightBounds.bottom=y-.1;
}

export function buildSouthDepartureHall(parent:THREE.Object3D,wing:SouthWing,mats:TerminalMaterials){
 const layout=SOUTH_DEPARTURE_DECKS[wing],floor=layout.floor,ceiling=layout.ceiling,y=SOUTH_DEPARTURE_LEVEL,
  e=buildingRectEdges(floor),h=ceiling-y,finishes=floorFinishes??=createFloorFinishes();
 const portal=wing==='B'?T1_B_DEPARTURE_LINK:T2_GATE_LINKS.C,wallSpans=passengerWallSpans(e.left,e.right,[portal]);
 const lamps={axis:'x' as const,first:e.left+2.1,last:e.left+2.1+Math.floor((floor.width-4.2)/4.6)*4.6,
  pitch:4.6,height:ceiling-.047,rows:[e.near+4.7,SOUTH_DEPARTURE_WALK_Z+.28] as const};
 // Each floor has its own fixture coordinates and reflection uniform values.
 const stone=finishes.sediment.clone();addCeilingLightReflections(stone,lamps,.16,1.07,floor);
 cover(parent,floor,layout.stair,y-.17,.34,stone);
 box(parent,floor.width+.78,.36,floor.depth+.66,floor.x,ceiling+.18,floor.z,mats.roof??steel);
 box(parent,floor.width,.13,floor.depth,floor.x,ceiling+.025,floor.z,plaster);
 for(const span of wallSpans)box(parent,span.right-span.left,h,.22,(span.left+span.right)/2,y+h/2,e.near,wall);
 if(wing==='B'){
  const link=T1_B_DEPARTURE_LINK,width=link.right-link.left,x=(link.left+link.right)/2;
  box(parent,width,h-link.headroom,.22,x,y+(h+link.headroom)/2,e.near,dark);
  const vestibuleDepth=e.near-link.near;
  box(parent,width,.34,vestibuleDepth,x,y-.17,(link.near+e.near)/2,stone);
  box(parent,width,.20,vestibuleDepth,x,y+link.headroom+.1,(link.near+e.near)/2,plaster);
  for(const edge of [link.left,link.right]){
   box(parent,.115,link.headroom,vestibuleDepth,edge,y+link.headroom/2,(link.near+e.near)/2,glass);
   box(parent,.19,.17,vestibuleDepth,edge,y+.085,(link.near+e.near)/2,steel);
   box(parent,.24,link.headroom,.31,edge,y+link.headroom/2,e.near,dark);
  }
 }
 box(parent,floor.width,.51,.25,floor.x,y+.255,e.far,wall);
 box(parent,floor.width,.55,.23,floor.x,ceiling-.275,e.far,wall);
 for(const span of wallSpans){
  box(parent,span.right-span.left,.105,.12,(span.left+span.right)/2,y+.052,e.near+.16,steel);
 }
 const glazing:Part[]=[],frames:Part[]=[],joints:Part[]=[],lights:Part[]=[],liners:Part[]=[];
 for(let i=0,count=Math.ceil(floor.width/4.07);i<count;i++){
  const segment=floor.width/count,x=e.left+(i+.5)*segment;
  glazing.push({x,y:y+(h-.04)/2,z:e.far,sx:segment-.09,sy:h-1.06,sz:.036});
  frames.push({x:x+segment/2,y:y+h/2,z:e.far,sx:.101,sy:h,sz:.19});
  const besidePortal=x<portal.left-2.1||x>portal.right+2.1;
  if(besidePortal)joints.push({x:x-segment/2,y:y+h/2,z:e.near+.124,sx:.019,sy:h-.31,sz:.024});
  if(besidePortal&&i%3===1)liners.push({x,y:y+3.02,z:e.near+.142,sx:segment*.62,sy:.103,sz:.057});
 }
 for(const z of lamps.rows){
  for(let x=lamps.first;x<=lamps.last+.01;x+=lamps.pitch)lights.push({x,y:lamps.height,z,sx:.235,sy:.026,sz:.235});
 }
 batch(parent,glass,glazing);batch(parent,dark,frames);batch(parent,seam,joints);
 batch(parent,steel,liners);batch(parent,diffuser,lights,round);
 deckEnd(parent,e.left+.125,e,y,ceiling,wing==='B');
 deckEnd(parent,e.right-.125,e,y,ceiling,wing==='C');
 // A thin stone border marks the main circulation band beside the belt.
 faceFloor(parent,{x:floor.x,z:SOUTH_DEPARTURE_WALK_Z-1.44,width:floor.width-.22,depth:.24},y+.007,finishes.charcoal);
 buildMovingWalkways(parent,y,layout.belts);
 stairs(parent,wing);
 const light=hallAreaLight(parent,floor.x,ceiling-.26,floor.z,floor.width-4,floor.depth-1.9,.64,
  wing==='B'?'#f8f0df':'#fff0db');
 light.userData.hallLightBounds.bottom=y-.12;
 addFloorContactShadows(parent,y+.016,southWalkwayRails(wing),.11);
 if(wing==='C')c1WoodRoom(parent,ceiling,finishes);
 if(wing==='B')wayfinding(parent,e.left+27.0,SOUTH_DEPARTURE_WALK_Z-.25,ceiling,5.25,'第二航廈・C 區|Terminal 2 · Gates C','B9–B1 登機門|Gates B9–B1');
 else wayfinding(parent,e.right-13.8,SOUTH_DEPARTURE_WALK_Z-.25,ceiling,5.45,'C1–C10 登機門|Gates C1–C10','第一航廈・B 區|Terminal 1 · Gates B');
}

export function buildSouthTerminalLink(parent:THREE.Object3D,mats:TerminalMaterials){
 const r=SOUTH_DEPARTURE_LINK,e=buildingRectEdges(r),y=SOUTH_DEPARTURE_LEVEL,clearance=2.92,finishes=floorFinishes??=createFloorFinishes();
 // Keep the floor faces butt-jointed. The walking bounds overlap slightly.
 box(parent,r.width-1.12,.34,r.depth,r.x,y-.17,r.z,finishes.sediment);
 box(parent,r.width,.25,r.depth,r.x,y+clearance+.12,r.z,mats.roof??steel);
 for(const z of [e.near,e.far]){
  box(parent,r.width,.57,.17,r.x,y+.285,z,wall);
  box(parent,r.width,clearance-.57,.057,r.x,y+(.57+clearance)/2,z,glass);
  for(const x of [e.left+.10,r.x,e.right-.10])box(parent,.078,clearance,.095,x,y+clearance/2,z,steel);
 }
 for(const x of [e.left+.68,r.x,e.right-.68])box(parent,.08,.026,r.depth-1.45,x,y+clearance-.024,r.z,diffuser);
 const light=hallAreaLight(parent,r.x,y+clearance-.12,r.z,r.width-1.5,r.depth-1.1,.83,'#fff4e5');
 light.userData.hallLightBounds.bottom=y-.1;
}
