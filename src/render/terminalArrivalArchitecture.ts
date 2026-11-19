import * as THREE from 'three';
import {box,canvasTexture,instances,material} from './primitives';
import {T2_FLOOR_LEVELS,T2_PASSENGER_SECTION as S,placeBuildingRect,t1ArrivalCeilingHeight,t1ArrivalStructure,t2ArrivalFacade,t2ArrivalHallFixtures,t2BaggageBelts,t2CustomsBays,t2StructuralColumnCenters,type BuildingBounds,type BuildingRect} from './terminalBuildingLayout';
import {addArrivalPickupReflections,addTerminal2ArrivalClock,addTerminal2ArrivalNavigation,arrivalPickupSigns} from './terminalArrivalSigns';
import {hallAreaLight} from './terminalPublicHalls';
import {t1ArrivalPartitionPanels} from './terminalPublicHallLayout';
import {addFloorContactShadows} from './terminalFloorLighting';

type Instance=Parameters<typeof instances>[3][number];
type Label=(parent:THREE.Object3D,text:string,x:number,y:number,z:number,width:number,accent?:string,rotation?:number,height?:number)=>unknown;
const unit=new THREE.BoxGeometry(1,1,1);
const pale=material('#deddd5',.73,.035),stone=material('#b9b2a4',.5,.07),dark=material('#343c3e',.48,.25),silver=material('#9ba5a7',.31,.62),seat=material('#303d45',.69,.08);
const glow=new THREE.MeshStandardMaterial({color:'#f9f7e9',roughness:.4,emissive:'#fff3d8',emissiveIntensity:.66});
const joint=material('#a4aaa5',.6,.12),display=material('#17313b',.28,.12),redChannel=material('#8c4b42',.63,.04),greenChannel=material('#4b796e',.63,.04);
function staticInstances(parent:THREE.Object3D,geometry:THREE.BufferGeometry,finish:THREE.Material,items:Instance[]){
 if(!items.length)return;
 const mesh=instances(parent,geometry,finish,items);mesh.userData.staticFurnitureBatch=true;return mesh;
}

/** Each square is four folded metal trays with a recessed seam at each joint. */
function cofferGeometry(pitch:number){
 const h=pitch/2,positions:number[]=[],colors:number[]=[],palette=['#e2e1d7','#cdcec4','#d8dbd1','#eae8df'];
 const corners=[[-h,0,-h],[h,0,-h],[h,0,h],[-h,0,h]];
 const triangle=(vertices:number[][],color:THREE.Color)=>{
  for(const vertex of vertices){positions.push(...vertex);colors.push(color.r,color.g,color.b);}
 };
 const edgeColor=new THREE.Color('#bbbdb4');
 for(let i=0;i<4;i++){
  const rim=[corners[i],corners[(i+1)%4],[0,.28,0]];
  const center=rim.reduce((c,p)=>[c[0]+p[0]/3,c[1]+p[1]/3,c[2]+p[2]/3],[0,0,0]);
  const tray=rim.map(p=>[THREE.MathUtils.lerp(p[0],center[0],.075),p[1]+.075,THREE.MathUtils.lerp(p[2],center[2],.075)]);
  triangle(tray,new THREE.Color(palette[i]));
  for(let side=0;side<3;side++){
   const next=(side+1)%3;
   triangle([rim[side],rim[next],tray[side]],edgeColor);
   triangle([tray[side],rim[next],tray[next]],edgeColor);
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}

function publicCeiling(parent:THREE.Object3D,b:BuildingBounds){
 const hall=placeBuildingRect(b,S.publicHall),pitch=4.4,columns=8,rows=60,span=columns*pitch,y=S.arrivalCeiling;
 const panels:Instance[]=[],ribs:Instance[]=[],lamps:Instance[]=[],edgeTiles:Instance[]=[],grilles:Instance[]=[];
 const left=hall.x-span/2,near=hall.z-rows*pitch/2,edgeWidth=(hall.width-span)/2;
 for(let row=0;row<rows;row++){
  const z=near+(row+.5)*pitch;
  for(let col=0;col<columns;col++){
   const x=left+(col+.5)*pitch;
   panels.push({x,y,z});
   ribs.push({x,y:y-.022,z:z-pitch/2,sx:pitch,sy:.06,sz:.075},{x:x-pitch/2,y:y-.022,z,sx:.075,sy:.06,sz:pitch});
   if((row+col)%3===0)lamps.push({x,y:y-.035,z:z-pitch/2,sx:.23,sy:.048,sz:.23});
  }
  for(const side of [-1,1]){
   const x=hall.x+side*(span/2+edgeWidth/2);
   for(const end of [-1,1])edgeTiles.push({x,y:y-.24,z:z+end*pitch/4,sx:edgeWidth-.065,sy:.09,sz:pitch/2-.035,color:row%3===0?'#e4e3db':'#d9dbd2'});
   if(row%2===0)lamps.push({x,y:y-.3,z,sx:.23,sy:.05,sz:.23});
   if(row%5===0)grilles.push({x,y:y-.3,z:z+1.15,sx:edgeWidth*.62,sy:.025,sz:.36});
  }
 }
 const ceiling=new THREE.MeshStandardMaterial({color:'#fff',vertexColors:true,roughness:.76,metalness:.025,side:THREE.DoubleSide,emissive:'#a6a596',emissiveIntensity:.09});
 staticInstances(parent,cofferGeometry(pitch),ceiling,panels);
 staticInstances(parent,unit,material('#dadbd0',.58,.08),ribs);
 staticInstances(parent,unit,pale,edgeTiles);
 staticInstances(parent,unit,dark,grilles);
 staticInstances(parent,new THREE.CylinderGeometry(.5,.5,1,12),glow,lamps);
 // A local fill, only active for a walker inside the arrival hall. The
 // standard scene-light policy still controls daylight, weather and exposure.
 const light=hallAreaLight(parent,hall.x,y-.32,hall.z,38,hall.depth-10,.48,'#fff3dd');
 light.userData.hallLightBounds.top=y;
}

let clockMaterial:THREE.MeshStandardMaterial|undefined;
function meetingClock(parent:THREE.Object3D,x:number,y:number,z:number,rotation=0,radius=.69){
 clockMaterial??=new THREE.MeshStandardMaterial({map:canvasTexture(256,256,c=>{
  c.fillStyle='#e9e9df';c.fillRect(0,0,256,256);c.translate(128,128);
  c.strokeStyle='#303c3e';c.lineWidth=3;
  for(let i=0;i<60;i++){c.save();c.rotate(i*Math.PI/30);c.beginPath();c.moveTo(0,-112);c.lineTo(0,i%5===0?-94:-104);c.stroke();c.restore();}
  c.lineCap='round';c.lineWidth=8;c.beginPath();c.moveTo(0,0);c.lineTo(-44,-47);c.stroke();c.lineWidth=5;c.beginPath();c.moveTo(0,0);c.lineTo(66,-51);c.stroke();
  c.fillStyle='#303c3e';c.beginPath();c.arc(0,0,8,0,Math.PI*2);c.fill();
 }),roughness:.5,side:THREE.DoubleSide});
 const clock=new THREE.Mesh(new THREE.CircleGeometry(radius,32),clockMaterial);clock.position.set(x,y,z);clock.rotation.y=rotation;parent.add(clock);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(radius+.022,.032,8,32),silver);rim.position.copy(clock.position);rim.rotation.y=rotation;parent.add(rim);
}

function linkedSeats(parent:THREE.Object3D,r:BuildingRect,y:number){
 const shells:Instance[]=[],legs:Instance[]=[],arms:Instance[]=[];
 for(const facing of [-1,1])for(let i=0;i<10;i++){
  const x=r.x+(i-4.5)*.64,z=r.z+facing*.48;
  shells.push({x,y:y+.47,z,sx:.57,sy:.12,sz:.52},{x,y:y+.84,z:z-facing*.23,sx:.57,sy:.67,sz:.085});
  if(i%3===0)legs.push({x,y:y+.24,z,sx:.08,sy:.46,sz:.66});
  arms.push({x:x+.3,y:y+.68,z,sx:.045,sy:.05,sz:.44});
 }
 for(const facing of [-1,1])legs.push({x:r.x,y:y+.28,z:r.z+facing*.48,sx:6.6,sy:.1,sz:.1});
 staticInstances(parent,unit,seat,shells);staticInstances(parent,unit,silver,legs);staticInstances(parent,unit,dark,arms);
}

const pickupGlass=new THREE.MeshPhysicalMaterial({color:'#b9ced1',roughness:.19,metalness:.08,transparent:true,opacity:.29,depthWrite:false,side:THREE.DoubleSide});
pickupGlass.forceSinglePass=true;

function buildPickupBarriers(parent:THREE.Object3D,barriers:readonly BuildingRect[],floor:number,illuminated:boolean){
 const panels:Instance[]=[],frames:Instance[]=[],steel:Instance[]=[],glass:Instance[]=[];
 const signs=illuminated?arrivalPickupSigns():[],reflections=signs.map(()=>[] as Parameters<typeof addArrivalPickupReflections>[1][number]);
 for(const barrier of barriers){
  const count=Math.round(barrier.depth/(illuminated?3.6:3)),pitch=barrier.depth/count,top=illuminated?1.19:1.08;
  frames.push({x:barrier.x,y:floor+.085,z:barrier.z,sx:barrier.width+.04,sy:.17,sz:barrier.depth});
  steel.push({x:barrier.x,y:floor+top,z:barrier.z,sx:illuminated?.5:.09,sy:.055,sz:barrier.depth});
  if(illuminated)steel.push({x:barrier.x,y:floor+.895,z:barrier.z,sx:.56,sy:.055,sz:barrier.depth});
  for(let i=0;i<count;i++){
   const z=barrier.z+(i-(count-1)/2)*pitch;
   if(illuminated){
    panels.push({x:barrier.x,y:floor+.53,z,sx:barrier.width,sy:.82,sz:pitch-.038});
    glass.push({x:barrier.x,y:floor+1.045,z,sx:.026,sy:.275,sz:pitch-.04});
    const geometry=new THREE.PlaneGeometry(pitch-.045,.66),index=i%signs.length;
    for(const side of [-1,1]){
     const sign=new THREE.Mesh(geometry,signs[index]);
     sign.position.set(barrier.x+side*(barrier.width/2+.009),floor+.55,z);
     sign.rotation.y=side*Math.PI/2;sign.userData.staticTerminalSign=true;parent.add(sign);
    }
    reflections[index].push({x:barrier.x,y:floor+.038,z,sx:14.6,sz:pitch-.045});
   }else glass.push({x:barrier.x,y:floor+.59,z,sx:.045,sy:.92,sz:pitch-.07});
  }
  for(let i=0;i<=count;i++){
   const z=barrier.z-barrier.depth/2+i*pitch;
   frames.push({x:barrier.x,y:floor+top/2,z,sx:illuminated?.53:.105,sy:top,sz:.055});
   if(!illuminated)steel.push({x:barrier.x,y:floor+.025,z,sx:.17,sy:.05,sz:.15});
  }
 }
 staticInstances(parent,unit,stone,panels);
 staticInstances(parent,unit,dark,frames);
 staticInstances(parent,unit,silver,steel);
 staticInstances(parent,unit,pickupGlass,glass);
 if(illuminated)addArrivalPickupReflections(parent,reflections);
}

/** T1's arrivals wing has a luminous louver ceiling at a much finer scale
 * than the broad triangular pressings in T2. Its glazing meets the raked eave. */
export function buildT1ArrivalEnvelope(parent:THREE.Object3D,b:BuildingBounds,hall:BuildingRect,y:number,label:Label){
 const left=hall.x-hall.width/2,right=hall.x+hall.width/2,near=hall.z-hall.depth/2,far=hall.z+hall.depth/2;
 const heightAt=(x:number)=>y+t1ArrivalCeilingHeight(x,hall);
 const lowerWall=material('#626964',.69,.09),wallPanel=material('#b3ada0',.69,.03),soffit=new THREE.MeshStandardMaterial({color:'#dedfd5',roughness:.82,emissive:'#908f80',emissiveIntensity:.15,side:THREE.DoubleSide});
 const wallFrames:Instance[]=[],glazingFrames:Instance[]=[],lightSlots:Instance[]=[],purlins:Instance[]=[];
 for(const panel of t1ArrivalPartitionPanels(b.x,b.z,b.width,b.depth)){
  box(parent,panel.width,4.52,panel.depth,panel.x,y+2.26,panel.z,lowerWall);
  box(parent,.35,.15,panel.depth,panel.x,y+.075,panel.z,dark);
  box(parent,.49,.43,panel.depth,panel.x-.13,y+4.38,panel.z,wallPanel);
  for(let z=panel.z-panel.depth/2+2.1;z<panel.z+panel.depth/2;z+=3.6){
   wallFrames.push({x:panel.x-.151,y:y+2.22,z,sx:.027,sy:4.12,sz:.024});
  }
 }
 const roof=new THREE.BufferGeometry();
 roof.setAttribute('position',new THREE.Float32BufferAttribute([left,heightAt(left),near,right,heightAt(right),near,left,heightAt(left),far,right,heightAt(right),far],3));
 roof.setIndex([0,2,1,1,2,3]);roof.computeVertexNormals();
 const ceiling=new THREE.Mesh(roof,soffit);parent.add(ceiling);

 const bayCount=8,cellWidth=hall.width/bayCount,bladeDepth=.59,pitch=.86,
  rowCount=Math.floor(hall.depth/pitch),slope=Math.atan2(heightAt(right)-heightAt(left),hall.width);
 const bladeFinish=new THREE.MeshStandardMaterial({color:'#e0e2db',roughness:.68,metalness:.13,emissive:'#9c9a88',emissiveIntensity:.16});
 const blades=new THREE.InstancedMesh(unit,bladeFinish,rowCount*bayCount),dummy=new THREE.Object3D();
 const slotLight=new THREE.MeshBasicMaterial({color:'#fff6d9',toneMapped:false});
 for(let bay=0;bay<bayCount;bay++){
  const x=left+(bay+.5)*cellWidth;
  for(let row=0;row<rowCount;row++){
   const z=near+(row+.5)*pitch;
   dummy.position.set(x,heightAt(x)-.32,z);dummy.rotation.set(-.36,0,slope,'ZYX');
   dummy.scale.set(cellWidth-.065,.13,bladeDepth);dummy.updateMatrix();blades.setMatrixAt(bay*rowCount+row,dummy.matrix);
   if(row%5!==4)lightSlots.push({x,y:heightAt(x)-.42,z:z+.35,sx:cellWidth-.28,sy:.043,sz:.095});
  }
 }
 for(let i=0;i<=bayCount;i++){
  const x=left+i*cellWidth;purlins.push({x,y:heightAt(x)-.46,z:hall.z,sx:.135,sy:.20,sz:hall.depth});
 }
 blades.instanceMatrix.needsUpdate=true;blades.userData.staticFurnitureBatch=true;parent.add(blades);
 const slopeLights=new THREE.InstancedMesh(unit,slotLight,lightSlots.length);
 lightSlots.forEach((light,i)=>{dummy.position.set(light.x,light.y,light.z);dummy.rotation.set(0,0,slope);dummy.scale.set(light.sx!,light.sy!,light.sz!);dummy.updateMatrix();slopeLights.setMatrixAt(i,dummy.matrix);});
 slopeLights.instanceMatrix.needsUpdate=true;parent.add(slopeLights);
 staticInstances(parent,unit,pale,purlins);

 const structure=t1ArrivalStructure(b),piers=new THREE.InstancedMesh(unit,bladeFinish,structure.piers.length);
 structure.piers.forEach((pier,i)=>{
  const dx=pier.headX-pier.x;dummy.position.set((pier.x+pier.headX)/2,y+pier.top/2,pier.z);
  dummy.rotation.set(0,0,-Math.atan2(dx,pier.top));dummy.scale.set(pier.width,Math.hypot(dx,pier.top),pier.depth);
  dummy.updateMatrix();piers.setMatrixAt(i,dummy.matrix);
  wallFrames.push({x:pier.x,y:y+.16,z:pier.z,sx:pier.width+.19,sy:.32,sz:pier.depth+.15});
 });
 piers.castShadow=true;piers.receiveShadow=true;piers.instanceMatrix.needsUpdate=true;parent.add(piers);
 staticInstances(parent,unit,dark,wallFrames);

 // Interior sightlines through the curb-facing glass stay open above its sill.
 const west=b.x-b.width/2+.22;
 for(let z=near+1;z<far;z+=3.4)glazingFrames.push({x:west,y:y+3.9,z,sx:.22,sy:5.3,sz:.10});
 for(const cy of [1.28,2.72,4.24,5.8,6.46])glazingFrames.push({x:west,y:y+cy,z:hall.z,sx:.18,sy:.09,sz:hall.depth});
 staticInstances(parent,unit,silver,glazingFrames);

 const upperStart=4.54,upperTop=heightAt(right)-y-.16;
 box(parent,.24,upperTop-upperStart,hall.depth,right,y+(upperTop+upperStart)/2,hall.z,pale);
 box(parent,.06,.78,hall.depth-.8,right-.16,y+upperStart+1.3,hall.z,material('#455856',.31,.23));
 const upperPosts:Instance[]=[];
 for(let z=near+1.8;z<far;z+=3.8)upperPosts.push({x:right-.21,y:y+(upperTop+upperStart)/2,z,sx:.05,sy:upperTop-upperStart,sz:.05});
 staticInstances(parent,unit,silver,upperPosts);

 const portalX=right;
 for(const dz of [-b.depth*.33,0,b.depth*.33]){
  const z=b.z+dz;
  box(parent,1.82,.51,8.02,portalX+.29,y+4.27,z,dark);
  for(const side of [-1,1])box(parent,1.75,4.02,.20,portalX+.29,y+2.01,z+side*4.04,dark);
  if(dz!==0)label(parent,'ARRIVALS  入境',portalX-.70,y+3.78,z,6.1,'#4a72b2',-Math.PI/2,.78);
 }
 const {exitPier}=structure;
 box(parent,exitPier.width,4.05,exitPier.depth,exitPier.x,y+2.025,exitPier.z,wallPanel);
 box(parent,exitPier.width+.04,.18,exitPier.depth+.04,exitPier.x,y+.09,exitPier.z,dark);
 meetingClock(parent,exitPier.x-exitPier.width/2-.025,y+2.72,exitPier.z,-Math.PI/2,.35);
 label(parent,'入境接機  ARRIVALS',portalX-.74,y+4.37,b.z,7.1,'#355fb5',-Math.PI/2,.82);
 label(parent,'捷運・巴士  MRT / BUSES',portalX-.73,y+3.57,b.z-2.12,3.42,'#355fb5',-Math.PI/2,.59);
 label(parent,'計程車・接機  TAXI / PICKUP',portalX-.73,y+3.57,b.z+2.12,3.42,'#355fb5',-Math.PI/2,.59);
 buildPickupBarriers(parent,structure.pickupRails,y,false);
 hallAreaLight(parent,hall.x,y+6.8,hall.z,hall.width-3,hall.depth-8,.49,'#fff6e3');
}

/** Photographic cues cross-checked in wide, oblique and meeting-point views:
 * silver round columns, tall pale triangular ceiling, upper gallery/clock,
 * polished stone and low illuminated pickup barriers. Brands are secondary. */
export function buildT2PublicArrivals(parent:THREE.Object3D,b:BuildingBounds,label:Label){
 const y=T2_FLOOR_LEVELS[2]+.025,mezzanine=T2_FLOOR_LEVELS[3],fixtures=t2ArrivalHallFixtures(b),hall=placeBuildingRect(b,S.publicHall);
 const {exit}=fixtures,panelJoints:Instance[]=[],fascia:Instance[]=[],undersideLights:Instance[]=[],windowReveals:Instance[]=[],housings:Instance[]=[],displays:Instance[]=[],shelves:Instance[]=[];
 const columns=t2StructuralColumnCenters(b.x,b.z,b.width,b.depth)
  .filter(p=>Math.abs(p.x-hall.x)<hall.width/2&&Math.abs(p.z-hall.z)<hall.depth/2)
  .map(p=>({...p,width:1.75,depth:1.75}));
 addFloorContactShadows(parent,y+.024,[...fixtures.lowBarriers,...fixtures.seats,fixtures.information,...columns],.28);
 const wallFinish=new THREE.MeshStandardMaterial({color:'#d0cdc0',roughness:.63,metalness:.05,emissive:'#938a75',emissiveIntensity:.14});
 const frontageGlass=new THREE.MeshPhysicalMaterial({color:'#acc5c3',roughness:.24,metalness:.085,clearcoat:.35,clearcoatRoughness:.16,transparent:true,opacity:.24,depthWrite:false});
 const displayBacking=new THREE.MeshStandardMaterial({color:'#9e9988',roughness:.73,emissive:'#b4a47f',emissiveIntensity:.16});
 publicCeiling(parent,b);
 for(const panel of fixtures.partitionPanels){
  const wallHeight=S.arrivalCeiling-y,frontX=panel.x-panel.width/2,near=panel.z-panel.depth/2,far=panel.z+panel.depth/2;
  const fasciaHeight=wallHeight-3.27;
  box(parent,panel.width,fasciaHeight,panel.depth,panel.x,y+3.27+fasciaHeight/2,panel.z,wallFinish);
  box(parent,.20,.49,panel.depth,frontX-.045,y+3.14,panel.z,dark);
  box(parent,.16,.18,panel.depth,frontX-.038,y+.132,panel.z,silver);
  for(let z=near+3.4;z<far;z+=3.4)panelJoints.push({x:frontX-.008,y:y+(wallHeight+3.42)/2,z,sx:.016,sy:wallHeight-3.42,sz:.024});
  for(let h=4.45;h<wallHeight;h+=1.2)panelJoints.push({x:frontX-.009,y:y+h,z:panel.z,sx:.016,sy:.022,sz:panel.depth});
  const solidBay=(start:number,end:number)=>box(parent,panel.width,3.28,end-start,panel.x,y+1.64,(start+end)/2,wallFinish);
  let start=near;
  for(let z=near+9.2;z<far-4.7;z+=15.3){
   const width=7.4,half=width/2;
   solidBay(start,z-half);start=z+half;
   box(parent,.19,3.13,width,frontX+.99,y+1.565,z,displayBacking);
   box(parent,1.20,.26,width,frontX+.46,y+.13,z,stone);
   for(const side of [-1,1])box(parent,1.20,3.09,.09,frontX+.46,y+1.545,z+side*half,wallFinish);
   windowReveals.push({x:frontX-.064,y:y+1.59,z,sx:.045,sy:2.66,sz:width-.04});
   housings.push({x:frontX-.10,y:y+2.90,z,sx:.1,sy:.075,sz:width});
   for(const end of [-half,-half/3,half/3,half])housings.push({x:frontX-.11,y:y+1.58,z:z+end,sx:.068,sy:2.65,sz:.06});
   undersideLights.push({x:frontX+.31,y:y+2.74,z,sx:.20,sy:.033,sz:width-.45});
   shelves.push({x:frontX+.59,y:y+.94,z,sx:.54,sy:.05,sz:width-.66},{x:frontX+.75,y:y+1.73,z,sx:.33,sy:.045,sz:width-.66});
   for(let i=0;i<7;i++)displays.push({x:frontX+.68,y:y+1.24,z:z+(i-3)*.86,sx:.125,sy:.47+(i%3)*.055,sz:.44,color:['#ccd8cd','#a8b3a7','#bba478','#668a9a'][i%4]});
  }
  solidBay(start,far);
 }
 staticInstances(parent,unit,joint,panelJoints);staticInstances(parent,unit,frontageGlass,windowReveals);staticInstances(parent,unit,silver,housings);
 staticInstances(parent,unit,stone,shelves);staticInstances(parent,unit,material('#dfddd1',.66,.035),displays);
 const upperSpan=S.arrivalCeiling-(y+exit.height);
 box(parent,.7,upperSpan,exit.span,exit.x,y+exit.height+upperSpan/2,exit.z,wallFinish);
 box(parent,1.08,.38,exit.span+.17,exit.x-.13,y+exit.height-.12,exit.z,dark);
 for(const end of [-1,1])box(parent,1.05,exit.height,.28,exit.x-.12,y+exit.height/2,exit.z+end*(exit.span/2+.015),silver);
 label(parent,'入境大廳  ARRIVALS',exit.x-.693,y+exit.height+.28,exit.z,8.5,'#2956a3',-Math.PI/2,.84);
 buildPickupBarriers(parent,fixtures.lowBarriers,y,true);
 for(const r of fixtures.seats)linkedSeats(parent,r,y);
 const desk=fixtures.information;box(parent,desk.width,1.03,desk.depth,desk.x,y+.515,desk.z,stone);box(parent,desk.width+.15,.12,desk.depth+.13,desk.x,y+1.09,desk.z,silver);
 box(parent,desk.width-.32,.15,desk.depth+.03,desk.x,y+.92,desk.z,material('#257a82',.47,.08));
 box(parent,desk.width-.60,.14,desk.depth-.38,desk.x,y+.07,desk.z,dark);
 for(const dx of [-2.8,0,2.8])box(parent,.64,.45,.09,desk.x+dx,y+1.4,desk.z-.5,display);
 label(parent,'INFORMATION  旅客服務',desk.x,y+2.2,desk.z-1.25,8,'#286477',0,.7);
 // A paneled gallery fascia overlooks the pickup lane. Its front faces the
 // customs exit across the hall, as in the frontal pickup reference.
 const galleryEdge=S.publicVoids[0],galleryX=b.x+galleryEdge.x-galleryEdge.width/2-.08,front=galleryX+.148,upperFascia=mezzanine-1.03;
 const galleryTrim=new THREE.MeshStandardMaterial({color:'#d7cebc',roughness:.58,metalness:.09,emissive:'#b3a68a',emissiveIntensity:.12});
 for(let z=b.z-122.5;z<=b.z+122.5;z+=7){
  fascia.push({x:galleryX,y:upperFascia,z,sx:.27,sy:1.56,sz:6.97});
  undersideLights.push({x:front-.08,y:mezzanine-1.84,z,sx:.12,sy:.039,sz:4.8});
 }
 staticInstances(parent,unit,galleryTrim,fascia);staticInstances(parent,unit,glow,undersideLights);
 box(parent,.46,.20,hall.depth-12,galleryX,y+4.05,hall.z,dark);
 box(parent,.86,1.65,15.2,galleryX-.22,mezzanine+.98,b.z,galleryTrim);
 const welcome=material('#9a7251',.58,.08);
 box(parent,.09,.66,15.2,front,mezzanine-.53,b.z,welcome);
 box(parent,.18,.65,8.53,front+.04,mezzanine-2.11,b.z,dark);
 box(parent,.18,.76,16.28,front+.04,mezzanine-2.79,b.z,dark);
 addTerminal2ArrivalNavigation(parent,front,galleryX+.232,mezzanine,b.z);
 addTerminal2ArrivalClock(parent,front+.15,mezzanine-1.25,b.z);
 // Stainless cladding wraps the existing structural shafts; no duplicate
 // oversized column is introduced in the circulation aisle.
 const shafts:Instance[]=[],feet:Instance[]=[],capitals:Instance[]=[],joints:Instance[]=[],columnLights:Instance[]=[];
 const posts=t2StructuralColumnCenters(b.x,b.z,b.width,b.depth).filter(p=>p.x<b.x);
 for(const {x,z} of posts){
  const height=S.arrivalCeiling-y;
  shafts.push({x,y:y+height/2,z,sx:1.79,sy:height,sz:1.79});feet.push({x,y:y+.12,z,sx:1.89,sy:.24,sz:1.89});
  capitals.push({x,y:S.arrivalCeiling-.08,z,sx:2.52,sy:.17,sz:2.52});
  for(const h of [2.65,5.28,7.92,10.05])joints.push({x,y:y+h,z,sx:1.795,sy:.026,sz:1.795});
  for(const dx of [-1,1])columnLights.push({x:x+dx*1.07,y:S.arrivalCeiling-.18,z,sx:.24,sy:.026,sz:1.46});
 }
 const column=new THREE.CylinderGeometry(.5,.5,1,32);staticInstances(parent,column,silver,shafts);staticInstances(parent,column,dark,feet);staticInstances(parent,column,joint,joints);
 staticInstances(parent,unit,silver,capitals);staticInstances(parent,unit,glow,columnLights);
 for(const [side,post] of [[-1,posts[1]],[1,posts[posts.length-2]]] as const){
  const name=side<0?'北會面點  NORTH MEETING POINT':'南會面點  SOUTH MEETING POINT';
  label(parent,side<0?'N':'S',post.x+.91,y+5.45,post.z,1.36,'#285c9a',Math.PI/2,1.32);
  label(parent,name,post.x+1.01,y+4.41,post.z,2.25,'#285c9a',Math.PI/2,.58);
 }
}

/** Street-facing glazing and the sheltered 1F pedestrian apron. */
export function buildT2ArrivalCurbside(parent:THREE.Object3D,b:BuildingBounds,glass:THREE.Material,label:Label){
 const {doors,wall,doorHeight,walk}=t2ArrivalFacade(b),level=T2_FLOOR_LEVELS[2],endX=walk.x-walk.width/2,x=doors[0].x;
 const base=material('#495455',.66,.13),paving=material('#6a6e6b',.79),soffit=material('#b1a696',.63,.03),road=material('#454a49',.95),curbstone=material('#b0b2a7',.82),paint=material('#c7cac1',.88);
 road.userData.noShadow=true;paving.userData.noShadow=true;
 const ceiling=level+4.43,top=level+doorHeight;
 box(parent,.14,b.height-top,b.depth,x,top+(b.height-top)/2,b.z,glass);
 for(const span of wall){
  box(parent,.12,doorHeight-.28,span.depth,span.x,level+(doorHeight+.28)/2,span.z,glass);
  box(parent,.32,level+.28,span.depth,span.x,(level+.28)/2,span.z,base);
 }
 box(parent,walk.width+1.68,.26,walk.depth,walk.x+.8,level-.125,walk.z,paving);
 box(parent,6.8,.11,walk.depth,endX-3.38,.142,walk.z,road);
 box(parent,.23,.22,walk.depth,endX-.097,level-.107,walk.z,curbstone);
 box(parent,walk.width+.34,.22,walk.depth,walk.x,ceiling+.085,walk.z,soffit);
 const frames:Instance[]=[],bolts:Instance[]=[],seams:Instance[]=[],lights:Instance[]=[],floorJoints:Instance[]=[],laneDashes:Instance[]=[];
 for(const span of wall)for(let z=span.z-span.depth/2+.1;z<span.z+span.depth/2;z+=3.25)frames.push({x,y:level+doorHeight/2,z,sx:.14,sy:doorHeight,sz:.052});
 for(let z=walk.z-walk.depth/2+2.2;z<walk.z+walk.depth/2;z+=2.2){
  bolts.push({x:endX+.35,y:level+.47,z,sx:.15,sy:.94,sz:.15});
  seams.push({x:walk.x,y:ceiling-.034,z,sx:walk.width,sy:.035,sz:.14});
  floorJoints.push({x:walk.x,y:level+.009,z,sx:walk.width,sy:.003,sz:.014});
  if(Math.round((z-walk.z)/2.2)%3===0)lights.push({x:walk.x+.65,y:ceiling-.069,z,sx:1.1,sy:.052,sz:.22});
 }
 for(const dx of [-1.6,0,1.6])floorJoints.push({x:walk.x+dx,y:level+.009,z:walk.z,sx:.014,sy:.003,sz:walk.depth});
 for(let z=walk.z-walk.depth/2+5;z<walk.z+walk.depth/2-5;z+=9.5)laneDashes.push({x:endX-2.8,y:.219,z,sx:.115,sy:.003,sz:4.3});
 for(const door of doors){
  const jamb=door.depth/2;
  box(parent,.49,.18,door.depth+.32,x,top-.078,door.z,silver);
  for(const side of [-1,1]){
   box(parent,.35,doorHeight,.12,x,level+doorHeight/2,door.z+side*(jamb-.075),silver);
   box(parent,.09,doorHeight-.22,1.10,x-.102,level+(doorHeight-.22)/2,door.z+side*(jamb+.57),glass);
  }
  box(parent,1.21,.029,door.depth-.14,x,level+.024,door.z,base);
  label(parent,'1F  入境大廳  ARRIVALS',x-.323,top+.39,door.z,5.9,'#285a9c',-Math.PI/2,.62);
 }
 staticInstances(parent,unit,silver,frames);staticInstances(parent,unit,base,seams);staticInstances(parent,unit,glow,lights);
 staticInstances(parent,unit,base,floorJoints);staticInstances(parent,unit,paint,laneDashes);
 staticInstances(parent,new THREE.CylinderGeometry(.5,.5,1,12),silver,bolts);
}

/** Correctly oriented belts, with a central well and a human-scale steel rim. */
export function buildT2BaggageClaim(parent:THREE.Object3D,b:BuildingBounds,label:Label,loopGeometry:(width:number,depth:number,radius:number,beltWidth:number,extrusion:number)=>THREE.BufferGeometry){
 const y=T2_FLOOR_LEVELS[2]+.025,rubber=material('#252b2c',.71,.025),beltSeam=material('#414747',.74,.045),trim=material('#647071',.38,.59);
 const cases:Instance[]=[],handles:Instance[]=[],slats:Instance[]=[],caseColors=['#566c7b','#934e42','#a99b83','#394851'];
 const belts=t2BaggageBelts(b);
 addFloorContactShadows(parent,y+.007,belts.flatMap(({x,z,width,depth,radius})=>[-1,1].flatMap(side=>[
  {x,z:z+side*(depth/2-.48),width:width-radius,depth:1.05},
  {x:x+side*(width/2-.48),z,width:1.05,depth:depth-radius},
 ])),.24);
 for(const belt of belts){
  const base=new THREE.Mesh(loopGeometry(belt.width-.25,belt.depth-.25,belt.radius-.1,1.20,.105),trim);base.position.set(belt.x,y+.03,belt.z);parent.add(base);
  const rim=new THREE.Mesh(loopGeometry(belt.width,belt.depth,belt.radius,1.25,.49),silver);rim.position.set(belt.x,y+.125,belt.z);rim.receiveShadow=true;parent.add(rim);
  const surface=new THREE.Mesh(loopGeometry(belt.width-.14,belt.depth-.14,belt.radius-.07,1.18,.055),rubber);surface.position.set(belt.x,y+.62,belt.z);surface.receiveShadow=true;parent.add(surface);
  const alongZ=belt.number>6,rotation=alongZ?Math.PI/2:0,displayX=belt.x+(alongZ?-6:0),displayZ=belt.z+(alongZ?0:-6.7);
  const beltName=alongZ?`${belt.number}A/B`:String(belt.number);
  const hangerBottom=y+3.36,hangerHeight=S.reclaimCeiling-hangerBottom;
  box(parent,7.65,.93,.15,displayX,y+2.90,displayZ,dark,rotation);
  for(const side of [-1,1]){
   box(parent,.045,hangerHeight,.05,displayX+(alongZ?0:side*2.65),hangerBottom+hangerHeight/2,displayZ+(alongZ?side*2.65:0),trim);
   label(parent,`${beltName}    行李提領  BAGGAGE CLAIM`,displayX+(alongZ?side*.084:0),y+2.9,displayZ+(alongZ?0:side*.084),7.45,'#315eaa',rotation+(side<0?Math.PI:0),.79);
   for(let d=-belt.width/2+belt.radius;d<belt.width/2-belt.radius;d+=.42)slats.push({x:belt.x+d,y:y+.713,z:belt.z+side*(belt.depth/2-.68),sx:.024,sy:.007,sz:1.15});
   for(let d=-belt.depth/2+belt.radius;d<belt.depth/2-belt.radius;d+=.42)slats.push({x:belt.x+side*(belt.width/2-.68),y:y+.713,z:belt.z+d,sx:1.15,sy:.007,sz:.024});
  }
  for(let i=0;i<8;i++){
   // Bags sit on the straight running surface of each belt.
   const side=i%2?1:-1,offset=(i/7-.5)*((alongZ?belt.depth:belt.width)-9.4),height=.34+(i%4)*.075;
   const x=alongZ?belt.x+side*(belt.width/2-.71):belt.x+offset,z=alongZ?belt.z+offset:belt.z+side*(belt.depth/2-.71);
   cases.push({x,y:y+.717+height/2,z,sx:.47+(i%3)*.09,sy:height,sz:.38+(i%2)*.075,color:caseColors[(i+belt.number)%4]});
   handles.push({x,y:y+.742+height,z,sx:.23,sy:.047,sz:.082});
  }
 }
 staticInstances(parent,unit,beltSeam,slats);staticInstances(parent,unit,material('#b2b5b3',.69,.02),cases);staticInstances(parent,unit,dark,handles);
}

/** Only the generic restricted fit-out is inferred. Its floor and connection
 * to reclaim and the public meeting hall follow the verified passenger flow. */
export function buildT2Customs(parent:THREE.Object3D,b:BuildingBounds,label:Label){
 const y=T2_FLOOR_LEVELS[2]+.025;
 for(const bay of t2CustomsBays(b)){
  box(parent,3.4,1.08,1.2,bay.x,y+.54,bay.z,bay.declare?redChannel:greenChannel);
  box(parent,bay.width,.12,bay.depth,bay.x,y+1.14,bay.z,silver);
  box(parent,bay.width-.18,.13,bay.depth-.18,bay.x,y+.065,bay.z,dark);
 }
 label(parent,'申報  TO DECLARE',b.x-16.5,y+2.72,b.z-3.91,5.85,'#994f46',Math.PI/2,.55);
 label(parent,'免申報  NOTHING TO DECLARE',b.x-16.5,y+2.72,b.z+3.91,5.85,'#4c8874',Math.PI/2,.55);
 label(parent,'海關  CUSTOMS  ·  出口 EXIT',b.x-17,y+3.81,b.z,8.15,'#315e9d',Math.PI/2,.63);
}
