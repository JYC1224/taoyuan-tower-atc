import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {runways,taxiNodes,taxiEdges,gates,terminals,tower} from '../data/airport';
import {box,canvasTexture,cylinder,groundText,instances,line,material,pavement,seeded} from './primitives';
import type {SimulationAPI} from '../types';
import {surfaceMaterial,applyWorldUV,applyFacadeUV,facadeTexture,facadeRoughness,batchStatic} from './surfaceDetail';
import {towerSkin,terminalRoof,landsideDetail,apronLightTexture} from './architectureDetail';
import {airfieldLights,type Lamp} from './airfieldLights';
import {createJetbridge,type BridgeVisual} from './jetbridge';
import {apronDetail,cabFinish} from './sceneDetail';
import {apronSupport,apronFloodlights,apronGuidanceSystems,taxiwayDirectionSigns,createWindsocks} from './airportSupport';
import {mappedLandside} from './landside';
import {terminalCore} from './terminalCore';
import {completedTerminal3} from './terminal3';
import {createServiceVehicles} from './serviceVehicles';
import {addAirportFacilities} from './airportFacilities';
import {obstructionLights} from './obstructionLights';
import {distantScenery} from './distantScenery';
import {regionalSettlements} from './regionalScenery';
import {createCoastalWater,isSea} from './coastline';
import {terrainSurfaceHeight} from './terrain';
import {addRegionalVegetation} from './vegetation';
import {terminalCurtainGlass,terminalCladdingMaterial,buildTerminalAtrium,buildGateConcourse,type TerminalBounds} from './terminalArchitecture';

export interface Environment {group:THREE.Group;graph:THREE.Group;screenTexture:THREE.CanvasTexture;screens:THREE.Mesh[];bridges:BridgeVisual[];vehicles:{group:THREE.Group;phase:number;speed:number;lane:number}[];windsocks:THREE.Group[];lights:THREE.MeshBasicMaterial[];distantLights:THREE.PointsMaterial;water:ReturnType<typeof createCoastalWater>;airfieldLightMaterial:THREE.ShaderMaterial;apronLensMaterial:THREE.MeshStandardMaterial;dockLightMaterial:THREE.MeshStandardMaterial;beacons:{bulb:THREE.MeshBasicMaterial;glow:THREE.PointsMaterial};windowMaterial:THREE.MeshStandardMaterial;ceilingMaterial:THREE.MeshStandardMaterial;pavementMaterials:THREE.MeshStandardMaterial[];updateScreens:(sim:SimulationAPI)=>void;updateVegetation:(time:number,windDirection:number,windSpeed:number,wetness:number)=>void}
const concrete=surfaceMaterial('concrete','#c3c6c6'),asphalt=surfaceMaterial('asphalt','#525b63'),runwayAsphalt=surfaceMaterial('runway','#a9b5bb'),taxiPave=surfaceMaterial('concrete','#b3b8b9'),taxiAsphalt=surfaceMaterial('asphalt','#687176'),taxiMixed=surfaceMaterial('concrete','#aeb4b6'),white=material('#e1e5e5',.72),metal=material('#a4b1b8',.42,.45),glass=material('#718b9e',.48,.12),curtainGlass=terminalCurtainGlass(),cladding=terminalCladdingMaterial(),roof=material('#c5cccf',.65,.25),yellow=material('#e0b544',.78);
glass.envMapIntensity=1.25;glass.map=facadeTexture();glass.roughnessMap=facadeRoughness();glass.emissiveMap=facadeTexture(true);glass.emissive.set('#f5f3e9');glass.emissiveIntensity=0;glass.userData.facade=true;

function consolidate(group:THREE.Group) {
 group.updateMatrixWorld(true);const batches=new Map<THREE.Material,THREE.BufferGeometry[]>(),remove:THREE.Object3D[]=[];
 group.traverse(o=>{if(o instanceof THREE.Mesh&&!(o instanceof THREE.InstancedMesh)&&!Array.isArray(o.material)&&!(o.material instanceof THREE.MeshBasicMaterial)&&o.geometry.index&&!o.material.transparent){const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);if(o.material.userData.worldUV)applyWorldUV(geo,o.material.userData.worldUV);if(o.material.userData.facade)applyFacadeUV(geo);let list=batches.get(o.material);if(!list){list=[];batches.set(o.material,list);}list.push(geo);remove.push(o);}});
 for(const o of remove){(o as THREE.Mesh).geometry.dispose();o.removeFromParent();}for(const[mat,geometries]of batches){const merged=mergeGeometries(geometries);if(merged){const mesh=new THREE.Mesh(merged,mat);mesh.receiveShadow=true;mesh.castShadow=!mat.userData.noShadow&&mat!==concrete&&mat!==asphalt&&mat!==taxiPave;group.add(mesh);}for(const geo of geometries)geo.dispose();}
}

export function createEnvironment():Environment {
 const group=new THREE.Group(),staticGroup=new THREE.Group(),graph=new THREE.Group();group.add(staticGroup,graph);graph.visible=false;const rand=seeded(240906),screens:THREE.Mesh[]=[],bridges:Environment['bridges']=[],vehicles:Environment['vehicles']=[];
 const distantLights=distantScenery(group),water=createCoastalWater(group);
 // Regional terrain is the base outside the surveyed airfield; do not cover a
 // 12.5 km square of Taoyuan with synthetic airport grass.
 // The airport sits in a mixed coastal plain: towns, infrastructure, ponds and farm plots.
 // Keep agriculture out of settlement clusters instead of laying a uniform field grid.
 const fieldMap=canvasTexture(512,512,ctx=>{const rand=seeded(1952),image=ctx.createImageData(512,512);for(let y=0;y<512;y++)for(let x=0;x<512;x++){const n=rand(),row=Math.sin(y*.48+Math.sin(x*.035)*1.8)*.5+.5,v=142+n*34+row*10,i=(y*512+x)*4;image.data[i]=v;image.data[i+1]=v;image.data[i+2]=v-4;image.data[i+3]=255;}ctx.putImageData(image,0,0);ctx.strokeStyle='rgba(42,59,39,.12)';ctx.lineWidth=2;for(let y=15;y<512;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(150,y-2,340,y+2,512,y);ctx.stroke();}});fieldMap.anisotropy=8;
 const fieldMats=['#a1ae90','#92a286','#748d78','#899b79','#aeb397','#698977'].map(c=>{const m=new THREE.MeshStandardMaterial({color:c,map:fieldMap,roughness:1});m.userData.noShadow=true;return m;});
 const fieldSets=fieldMats.map(()=>[] as Parameters<typeof instances>[3]);
 const nearbyPlaces=regionalSettlements.filter(p=>{const [x,z]=p.point;return Math.hypot(x,z)>2600&&Math.hypot(x,z)<9500&&['city','town','suburb'].includes(p.kind||'');});
 const placeCenters:{x:number;z:number;radius:number;kind:string}[]=[];
 for(const p of nearbyPlaces){const [x,z]=p.point,kind=p.kind||'suburb',radius=kind==='city'?1550:kind==='town'?1150:700;if(placeCenters.some(c=>Math.hypot(c.x-x,c.z-z)<Math.min(c.radius,radius)*.72))continue;placeCenters.push({x,z,radius,kind});}
 for(let z=-5200;z<=5200;z+=320+rand()*180)for(let x=-6200+rand()*120;x<=6200;x+=330+rand()*190){const px=x+(rand()-.5)*110,pz=z+(rand()-.5)*90,dist=Math.hypot(px,pz);if(dist<3550||dist>8500||Math.abs(px)<2750&&Math.abs(pz)<1550||z< -3400||isSea(px,pz)||placeCenters.some(c=>Math.hypot(c.x-px,c.z-pz)<c.radius))continue;if(rand()>.62)continue;const which=Math.floor(rand()*fieldMats.length);fieldSets[which].push({x:px,y:-.08,z:pz,sx:145+rand()*180,sy:.05,sz:95+rand()*140,ry:(rand()-.5)*.44});}
 fieldSets.forEach((v,i)=>instances(group,new THREE.BoxGeometry(1,1,1),fieldMats[i],v));
 // Taoyuan's irrigation ponds (埤塘) are common in its agricultural plain.
 const pondMaterial=new THREE.MeshStandardMaterial({color:'#526f70',roughness:.32,metalness:.04});
 const pondItems:Parameters<typeof instances>[3]=[],pondGeometry=new THREE.CircleGeometry(1,24);pondGeometry.rotateX(-Math.PI/2);
 for(let i=0;i<46;i++){const x=(rand()-.5)*11800,z=(rand()-.5)*9400;if(Math.hypot(x,z)<3600||Math.hypot(x,z)>8500||Math.abs(x)<2750&&Math.abs(z)<1550||isSea(x,z)||placeCenters.some(c=>Math.hypot(c.x-x,c.z-z)<c.radius))continue;pondItems.push({x,y:-.09,z,sx:55+rand()*115,sy:1,sz:42+rand()*95,ry:rand()*Math.PI});}
 instances(group,pondGeometry,pondMaterial,pondItems);
 // The mapped Hsucuogang (許厝港) point sits directly on the coast and is a real wetland.
 // Render shallow pools and reed clumps there rather than disguising it as farm plots.
 const wetland=nearbyPlaces.find(p=>p.name==='許厝港');
 if(wetland){const [wx,wz]=wetland.point,shallows:Parameters<typeof instances>[3]=[],reeds:Parameters<typeof instances>[3]=[];
  for(let i=0;i<22;i++){const angle=rand()*Math.PI*2,r=100+Math.sqrt(rand())*1000,x=wx+Math.cos(angle)*r,z=wz+Math.sin(angle)*r;if(isSea(x,z))continue;shallows.push({x,y:-.065,z,sx:35+rand()*120,sy:1,sz:24+rand()*86,ry:rand()*Math.PI});}
  const wetMaterial=new THREE.MeshStandardMaterial({color:'#617d73',roughness:.64,metalness:.02});instances(group,pondGeometry,wetMaterial,shallows);
  for(let i=0;i<420;i++){const angle=rand()*Math.PI*2,r=180+Math.sqrt(rand())*1050,x=wx+Math.cos(angle)*r,z=wz+Math.sin(angle)*r;if(isSea(x,z)||rand()<.26)continue;const h=1.5+rand()*2.4;reeds.push({x,y:h*.5,z,sx:.55+rand()*.55,sy:h,sz:.55+rand()*.55,color:['#77875e','#89916a','#657d5b'][Math.floor(rand()*3)]});}
  const reedBatch=instances(group,new THREE.ConeGeometry(1,1,4),new THREE.MeshLambertMaterial({color:'#fff'}),reeds);reedBatch.castShadow=false;reedBatch.receiveShadow=false;
 }
 // Keep the grass top clearly below mapped apron polygons to prevent depth-buffer flicker at oblique camera angles.
 box(staticGroup,5250,.12,2500,-100,-.06,0,surfaceMaterial('grass','#748067'));
 // Roads, parking and apron outlines use mapped surface features; taxi routing stays separate.
 mappedLandside(staticGroup,concrete,asphalt,white,taxiPave);
 // Place low-rise neighborhoods at the actual mapped Dayuan, Luzhu, Shanbi and
 // Zhuwei settlement centres. Individual footprints stay small and locally varied.
 const localHomes:Parameters<typeof instances>[3]=[],localRoofs:Parameters<typeof instances>[3]=[];
 const homeColors=['#a8aaa1','#c1b9a7','#969f9d','#b4b2a7','#8d9996'],roofColors=['#747d7d','#8c8171','#666f73','#9b9383'];
 for(const p of placeCenters){const {x:cx,z:cz,kind}=p,radius=kind==='city'?1050:kind==='town'?760:430,count=kind==='city'?240:kind==='town'?135:62;
  for(let i=0;i<count;i++){const angle=rand()*Math.PI*2,distance=Math.sqrt(rand())*radius,x=cx+Math.cos(angle)*distance,z=cz+Math.sin(angle)*distance;if(Math.abs(x)<2850&&Math.abs(z)<1550||isSea(x,z))continue;const h=kind==='city'?8+rand()*24:5+rand()*13,w=8+rand()*18,d=9+rand()*22,ry=Math.round(rand()*3)*Math.PI/2,ground=terrainSurfaceHeight(x,z);localHomes.push({x,y:ground+h/2,z,sx:w,sy:h,sz:d,ry,color:homeColors[Math.floor(rand()*homeColors.length)]});localRoofs.push({x,y:ground+h+.08,z,sx:w+.8,sy:.18,sz:d+.8,ry,color:roofColors[Math.floor(rand()*roofColors.length)]});}
 }
 const localHomeBatch=instances(group,new THREE.BoxGeometry(1,1,1),material('#fff',.92),localHomes);localHomeBatch.castShadow=false;localHomeBatch.receiveShadow=true;
 const localRoofBatch=instances(group,new THREE.BoxGeometry(1,1,1),material('#fff',.9),localRoofs);localRoofBatch.castShadow=false;localRoofBatch.receiveShadow=true;
 const vegetation=addRegionalVegetation(group,placeCenters,seeded(240907));
 // Shared operational graph supplies every paved taxi segment and its yellow centreline.
 const nodes=new Map(taxiNodes.map(n=>[n.id,n]));
 for(const e of taxiEdges){const a=nodes.get(e.from),b=nodes.get(e.to);if(!a||!b)continue;const surface=e.surface==='asphalt'?taxiAsphalt:e.surface==='mixed'?taxiMixed:taxiPave;pavement(staticGroup,a,b,e.width||24,surface);pavement(staticGroup,a,b,.34,yellow,.12);line(graph,[new THREE.Vector3(a.x,.9,a.z),new THREE.Vector3(b.x,.9,b.z)],e.active?'#4cffe1':'#ff5342');}
 for(const n of taxiNodes.filter(n=>n.kind==='intersection'))cylinder(staticGroup,12.5,12.5,.08,n.x,.05,n.z,taxiPave,32);
 const graphDot=material('#80ffe1');instances(graph,new THREE.SphereGeometry(2.7,6,4),graphDot,taxiNodes.map(n=>({x:n.x,y:2.2,z:n.z})));
 const whiteItems=[] as {x:number;y:number;z:number;sx:number;sy:number;sz:number}[],edgeLights:Lamp[]=[],taxiLights:Lamp[]=[],redLights:Lamp[]=[],greenLights:Lamp[]=[];
 const rubberMap=canvasTexture(512,256,ctx=>{const random=seeded(487);for(let i=0;i<140;i++){ctx.strokeStyle=`rgba(16,24,30,${.025+random()*.065})`;ctx.lineWidth=.5+random()*2;const y=45+random()*166,x=random()*200;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+70+random()*230,y+(random()-.5)*2);ctx.stroke();}}),rubberMat=new THREE.MeshStandardMaterial({map:rubberMap,transparent:true,opacity:.8,depthWrite:false,roughness:.96});
 for(const r of runways){
  box(staticGroup,r.length+100,.1,150,r.x,.04,r.z,material('#8a957e',1));box(staticGroup,r.length,.12,r.width,r.x,.09,r.z,runwayAsphalt);
  box(staticGroup,r.length,.02,.65,r.x,.175,r.z-r.width/2+1.5,white);box(staticGroup,r.length,.02,.65,r.x,.175,r.z+r.width/2-1.5,white);
  for(let i=-r.length/2+r.thresholdOffsets['05']+100;i<r.length/2-r.thresholdOffsets['23']-90;i+=50)whiteItems.push({x:r.x+i,y:.185,z:r.z,sx:30,sy:.03,sz:.9});
  for(const side of [-1,1]){const displaced=r.thresholdOffsets[side===-1?'05':'23'],threshold=r.x+side*(r.length/2-12-displaced);for(let d=30;d<displaced-35;d+=60){const tip=r.x+side*(r.length/2-d-20);pavement(staticGroup,{x:tip+side*17,z:r.z},{x:tip,z:r.z},.65,white,.19);for(const wing of [-1,1])pavement(staticGroup,{x:tip+side*8,z:r.z+wing*4},{x:tip,z:r.z},.65,white,.19);}for(let s=-6;s<=6;s++){if(s===0)continue;whiteItems.push({x:threshold-side*24,y:.19,z:r.z+s*3.8,sx:36,sy:.03,sz:1.8});}const number=side===-1?r.ends[0]:r.ends[1];groundText(group,number,threshold-side*95,r.z,25,39,side===-1?-Math.PI/2:Math.PI/2);
   // CAT II approach lighting extends 900 m beyond the threshold, not over the runway.
   for(let d=30;d<=870;d+=30)edgeLights.push({x:threshold+side*d,y:.48,z:r.z});
   for(const d of [300,600,900])for(let z=-15;z<=15;z+=5)edgeLights.push({x:threshold+side*d,y:.48,z:r.z+z});
   const wear=new THREE.Mesh(new THREE.PlaneGeometry(450,23),rubberMat);wear.rotation.x=-Math.PI/2;wear.position.set(threshold-side*445,.161,r.z);group.add(wear);
   const papiSide=side===-1?1:-1,papiX=threshold-side*320,papiZ=r.z+papiSide*55;
   for(let k=0;k<4;k++){const z=papiZ+papiSide*(k-1.5)*3;(k<2?redLights:edgeLights).push({x:papiX,y:.9,z});box(staticGroup,.82,.45,.56,papiX,.35,z,metal);}
   for(let k=-4;k<=4;k++)redLights.push({x:r.x+side*r.length/2,y:.45,z:r.z+k*5.5});
   for(let k=-4;k<=4;k++){redLights.push({x:threshold,y:.55,z:r.z+k*6,aim:-side});greenLights.push({x:threshold,y:.55,z:r.z+k*6,aim:side});}
  }
  for(let x=r.x-r.length/2;x<=r.x+r.length/2;x+=30){edgeLights.push({x,y:.45,z:r.z-r.width/2-1.5},{x,y:.45,z:r.z+r.width/2+1.5});}
  for(let x=r.x-r.length/2+15;x<r.x+r.length/2-15;x+=15){const toEnd=Math.min(x-(r.x-r.length/2),(r.x+r.length/2)-x),index=Math.round((x-(r.x-r.length/2))/15);if(toEnd<300||toEnd<900&&index%2===0)redLights.push({x,y:.22,z:r.z});else edgeLights.push({x,y:.22,z:r.z});}
 }
 instances(group,new THREE.BoxGeometry(1,1,1),white,whiteItems);
 for(const e of taxiEdges){const a=nodes.get(e.from),b=nodes.get(e.to);if(!a||!b)continue;const length=Math.hypot(a.x-b.x,a.z-b.z),dx=(b.z-a.z)/length*(e.width/2+1),dz=-(b.x-a.x)/length*(e.width/2+1);for(let d=0;d<length;d+=65){const t=d/length;for(const s of [-1,1])taxiLights.push({x:a.x+(b.x-a.x)*t+dx*s,y:.35,z:a.z+(b.z-a.z)*t+dz*s});}for(let d=12;d<length-6;d+=30){const t=d/length;greenLights.push({x:a.x+(b.x-a.x)*t,y:.24,z:a.z+(b.z-a.z)*t});}}
 const airfieldLightMaterial=airfieldLights(group,edgeLights,taxiLights,redLights,greenLights);
 const stopBarHousing=material('#354046',.66,.28),stopBarLens=material('#8c2827',.5,.08),guardLens=material('#d7a63d',.42,.1);
 for(const n of taxiNodes.filter(n=>n.kind==='hold')){
  const rw=runways.find(r=>r.id===n.runway),end=rw?.ends[n.id.endsWith('05')?0:1]??'RWY';
  const entry=rw?nodes.get(rw.entryNodes[n.id.endsWith('05')?'05':'23']):undefined,dx=entry?entry.x-n.x:0,dz=entry?entry.z-n.z:1,length=Math.hypot(dx,dz)||1,tx=dx/length,tz=dz/length,sx=-tz,sz=tx,holdWidth=taxiEdges.find(e=>e.to===n.id||e.from===n.id)?.width??25,signX=n.x-sx*(holdWidth/2+6)-tx*5,signZ=n.z-sz*(holdWidth/2+6)-tz*5,signHeading=Math.atan2(-tx,-tz);
  box(staticGroup,6,1.1,.28,signX,1.25,signZ,metal,signHeading);const sign=groundText(group,end,signX,signZ,5.8,1,signHeading,'#fff5e7','#a72c29');sign.rotation.set(0,signHeading,0);sign.position.y=1.25;
  const transverse=(offset:number,dashed=false)=>{const cx=n.x+tx*offset,cz=n.z+tz*offset;if(!dashed){pavement(staticGroup,{x:cx-sx*13,z:cz-sz*13},{x:cx+sx*13,z:cz+sz*13},.75,yellow,.22);return;}for(let s=-11;s<=11;s+=4.2)pavement(staticGroup,{x:cx+sx*s,z:cz+sz*s},{x:cx+sx*(s+2.2),z:cz+sz*(s+2.2)},.75,yellow,.22);};
  transverse(.45);transverse(1.35);transverse(-.45,true);transverse(-1.35,true);
  // Installed stop-bar housings stay dark because the clearance controller is not wired to lighting states.
  for(let s=-10;s<=10;s+=5){const x=n.x-tx*2.1+sx*s,z=n.z-tz*2.1+sz*s;box(staticGroup,.58,.085,.34,x,.24,z,stopBarHousing);box(staticGroup,.34,.025,.17,x,.294,z,stopBarLens);}
  for(const s of [-1,1])for(const t of [-1,1]){const x=n.x+sx*(s*(13.5+t*1.4))-tx*4,z=n.z+sz*(s*(13.5+t*1.4))-tz*4;box(staticGroup,.48,.12,.36,x,.27,z,stopBarHousing);box(staticGroup,.28,.025,.18,x,.34,z,guardLens);}
 }
 // The airport's paired terminal concourses retain the recognizable RCTP arrangement.
 landsideDetail(staticGroup);
 for(const t of terminals){box(staticGroup,t.width+145,.09,t.depth+100,t.x,.12,t.z,concrete);if(t.id==='T3'||t.id==='T3-S'){completedTerminal3(staticGroup,t,curtainGlass,cladding,concrete);continue;}
  const bounds:TerminalBounds={x:t.x,z:t.z,width:t.width,depth:t.depth,height:t.height},terminalGates=t.id==='T3-N'?gates.filter(g=>g.terminal==='T3 North'):[],profile=t.id==='T1'||t.id==='T2'||t.id==='T3-N'?t.id:undefined;
  buildTerminalAtrium(staticGroup,bounds,{glass:curtainGlass,cladding,concrete,metal},terminalGates,terminalGates.some(g=>g.z<t.z)?-1:1,profile);terminalRoof(staticGroup,t);

 }
 const gateRows:{bounds:TerminalBounds;ids:RegExp;gateSide:-1|1;terminal:'T1'|'T2'}[]=[
  {bounds:{x:451,z:-240,width:660,depth:120,height:12},ids:/^A/,gateSide:-1,terminal:'T1'},
  {bounds:{x:-245,z:-250,width:840,depth:110,height:12},ids:/^D(?:[1-9]|10)$/,gateSide:-1,terminal:'T2'},
  {bounds:{x:408,z:112.5,width:650,depth:45,height:12},ids:/^B/,gateSide:1,terminal:'T1'},
  {bounds:{x:-243.5,z:135,width:750,depth:80,height:12},ids:/^C/,gateSide:1,terminal:'T2'}
 ];
 for(const row of gateRows){box(staticGroup,row.bounds.width+30,.05,155,row.bounds.x,.15,row.bounds.z,concrete);buildGateConcourse(staticGroup,row.bounds,{glass:curtainGlass,cladding,concrete,metal,roof},gates.filter(g=>row.ids.test(g.id)),row.gateSide,row.terminal);}
 terminalCore(group,staticGroup,glass,cladding);
 for(const g of gates){const concourseZ=g.id.startsWith('A')?-198:g.id.startsWith('B')?90:g.id.startsWith('C')?105:g.terminal==='T3 North'?-240:-225,push=nodes.get(g.pushbackNodeId);if(push)pavement(staticGroup,push,g,.42,yellow,.22);groundText(group,g.id,g.x+17,g.z,17,9,0,'#d6b862');if(!g.remote){const bridge=createJetbridge(g,concourseZ);group.add(bridge.group);bridges.push(bridge);}}
 apronGuidanceSystems(staticGroup,gates);
 taxiwayDirectionSigns(staticGroup,taxiNodes,taxiEdges);
 apronDetail(staticGroup,group,gates,terminals);
 apronSupport(staticGroup,group,gates,taxiNodes,taxiEdges);
 const windsocks=createWindsocks(staticGroup,group);
 // Cargo handling and aircraft maintenance facilities complete the service-side skyline.
 const dockLightMaterial=addAirportFacilities(staticGroup,concrete,cladding);
 for(let i=0;i<4;i++){const x=1060+i*90;box(staticGroup,62,5,92,x,2.5,45,material('#a5aaa1'));box(staticGroup,68,.7,96,x,5.5,45,roof);}box(staticGroup,600,.12,18,1200,.06,115,asphalt);
 const mastItems=[] as {x:number;y:number;z:number}[];for(let x=-1300;x<1500;x+=160)for(const z of [-350,265]){mastItems.push({x,y:12,z});box(staticGroup,8,.5,2,x,24,z,white);}instances(group,new THREE.CylinderGeometry(.28,.45,24,8),metal,mastItems);const apronLensMaterial=apronFloodlights(group,mastItems);
 // Current flared tower: tapered structural shell, panoramic octagonal cab and antenna.
 const tx=tower.x,tz=tower.z,floor=tower.cabHeight,outer=tower.radius;
 const towerShell=new THREE.Group();towerShell.position.set(tx,0,tz);towerSkin(towerShell,floor);
 const ceilingMaterial=cabFinish(towerShell,floor,outer);
 cylinder(towerShell,outer+1.4,outer-2,3,0,floor-1.7,0,roof,8);cylinder(towerShell,outer+.5,outer+.5,.3,0,floor+.01,0,material('#415050'),8);cylinder(towerShell,outer+1.7,outer+1.3,.8,0,floor+5.6,0,white,8);cylinder(towerShell,outer-2,outer+.9,1,0,floor+6.5,0,metal,8);cylinder(towerShell,.12,.25,3,0,floor+8.5,0,white,12);
 const windowMat=new THREE.MeshStandardMaterial({color:'#a9c0c8',transparent:true,opacity:.16,roughness:.12,metalness:.12,side:THREE.FrontSide,depthWrite:false});for(let i=0;i<8;i++){const angle=i*Math.PI/4,rad=outer*Math.cos(Math.PI/8),width=2*outer*Math.sin(Math.PI/8);const pane=new THREE.Mesh(new THREE.PlaneGeometry(width,4.85),windowMat);pane.position.set(Math.sin(angle)*rad,floor+3,Math.cos(angle)*rad);pane.rotation.y=angle;towerShell.add(pane);box(towerShell,width,.12,.18,Math.sin(angle)*rad,floor+1.2,Math.cos(angle)*rad,metal,angle);const pa=angle+Math.PI/8;box(towerShell,.22,5.7,.22,Math.sin(pa)*outer,floor+3,Math.cos(pa)*outer,metal);}
 box(towerShell,6,3.7,4,0,floor+1.85,6.5,material('#566463'));box(towerShell,1.9,2.7,.1,-1.3,floor+1.4,4.4,material('#24373c'));box(towerShell,.12,.9,.15,-.65,floor+1.5,4.25,white);
 const screenCanvas=document.createElement('canvas');screenCanvas.width=1536;screenCanvas.height=768;const screenTexture=new THREE.CanvasTexture(screenCanvas);screenTexture.colorSpace=THREE.SRGBColorSpace;screenTexture.anisotropy=4;const screenMat=new THREE.MeshBasicMaterial({map:screenTexture,toneMapped:false});
 const deskMat=material('#303e43',.75),deskEdge=material('#657675',.6),chairMat=material('#253239',.9);
 for(let j=-1;j<=1;j++){const deskX=j*4.1;box(towerShell,3.9,.19,1.7,deskX,floor+1.13,-5.6,deskEdge);box(towerShell,3.8,.45,1.1,deskX,floor+.83,-5.9,deskMat);for(const s of [-1,1])box(towerShell,.14,1.1,1.2,deskX+s*1.55,floor+.5,-5.6,metal);
  box(towerShell,1.84,1.10,.16,deskX,floor+1.76,-5.92,deskMat);const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.70,.96),screenMat);screen.position.set(deskX,floor+1.76,-5.825);screen.userData.workstation=true;towerShell.add(screen);screens.push(screen);box(towerShell,.18,.5,.18,deskX,floor+1.38,-5.99,metal);box(towerShell,.9,.045,.31,deskX-.15,floor+1.25,-5.15,material('#9caba7'));for(let r=0;r<3;r++)for(let c=0;c<11;c++)box(towerShell,.055,.02,.05,deskX-.53+c*.075,floor+1.278,-5.23+r*.065,deskMat);const phone=box(towerShell,.17,.12,.42,deskX+1.28,floor+1.3,-5.48,chairMat);phone.rotation.y=-.3;
  const seat=new THREE.Group();seat.position.set(deskX,floor,-3.2);cylinder(seat,.14,.15,.75,0,.45,0,metal,8);box(seat,.8,.17,.8,0,.82,0,chairMat);const back=box(seat,.78,.95,.15,0,1.35,.38,chairMat);back.rotation.x=-.1;for(const s of [-1,1]){box(seat,.1,.45,.1,s*.48,1.03,.1,metal);box(seat,.12,.1,.6,s*.48,1.25,-.03,chairMat);}for(let k=0;k<5;k++){const a=k*Math.PI*2/5;box(seat,.65,.07,.07,Math.cos(a)*.21,.1,Math.sin(a)*.21,metal,-a);}towerShell.add(seat);
 }
 batchStatic(towerShell,screens);group.add(towerShell);
 const beaconPositions=[{x:tx,y:floor+10.2,z:tz}];
 const beacons=obstructionLights(group,beaconPositions);
 vehicles.push(...createServiceVehicles(group));
 const pools=new THREE.MeshBasicMaterial({map:apronLightTexture(),transparent:true,opacity:0,depthWrite:false,toneMapped:false});const poolItems=mastItems.map(p=>({x:p.x,y:.227,z:p.z,sx:260,sy:220,sz:1}));const poolGeo=new THREE.PlaneGeometry(1,1);poolGeo.rotateX(-Math.PI/2);const poolMesh=instances(group,poolGeo,pools,poolItems.map(p=>({...p,sy:1,sz:220})));poolMesh.renderOrder=2;
 consolidate(staticGroup);
 const updateScreens=(sim:SimulationAPI)=>{const ctx=screenCanvas.getContext('2d')!;ctx.fillStyle='#081b23';ctx.fillRect(0,0,1536,768);ctx.fillStyle='#80d7bd';ctx.font='600 27px monospace';ctx.fillText('TAOYUAN  /  SURFACE MOVEMENT',35,48);ctx.font='19px monospace';ctx.fillStyle='#adc1c6';ctx.fillText(`${Math.floor(sim.time/3600)%24}`.padStart(2,'0')+':'+`${Math.floor(sim.time/60)%60}`.padStart(2,'0')+' L  ·  RWY '+sim.activeDirection+'  ·  '+sim.weather.windDirection+'° / '+sim.weather.windSpeed+' KT',36,82);
  const px=(x:number)=>520+x*.18,pz=(z:number)=>405+z*.28;ctx.strokeStyle='#35585c';ctx.lineWidth=3;for(const e of taxiEdges){const a=nodes.get(e.from),b=nodes.get(e.to);if(a&&b){ctx.beginPath();ctx.moveTo(px(a.x),pz(a.z));ctx.lineTo(px(b.x),pz(b.z));ctx.stroke();}}ctx.strokeStyle='#93bab4';ctx.lineWidth=9;for(const r of runways){ctx.beginPath();ctx.moveTo(px(r.x-r.length/2),pz(r.z));ctx.lineTo(px(r.x+r.length/2),pz(r.z));ctx.stroke();ctx.fillStyle='#9cbdbe';ctx.fillText(r.ends.join(' / '),px(r.x-200),pz(r.z)-14);}for(const a of sim.aircraft){ctx.fillStyle=a.state==='HOLDING_SHORT'?'#f3b462':'#6fe0c1';ctx.beginPath();ctx.arc(px(a.position.x),pz(a.position.z),5,0,Math.PI*2);ctx.fill();ctx.font='15px monospace';ctx.fillText(a.flightNumber,px(a.position.x)+8,pz(a.position.z)-6);}
  ctx.fillStyle='#142d35';ctx.fillRect(1050,110,456,618);ctx.fillStyle='#779fa5';ctx.font='22px monospace';ctx.fillText('FLIGHT STRIPS  /  LIVE',1070,145);sim.aircraft.slice(0,10).forEach((a,i)=>{const y=185+i*49;ctx.fillStyle='#76d7be';ctx.font='bold 21px monospace';ctx.fillText(a.flightNumber,1070,y);ctx.fillStyle='#b4c5c6';ctx.font='16px monospace';ctx.fillText(a.type+'  '+a.state.replaceAll('_',' '),1070,y+21);});ctx.fillStyle='#7fa2a8';ctx.font='18px monospace';ctx.fillText('SELECT A SCREEN TO OPEN CONTROLLER WORKSPACE',35,741);screenTexture.needsUpdate=true;};
 return {group,graph,screenTexture,screens,bridges,vehicles,windsocks,lights:[pools],distantLights,water,airfieldLightMaterial,apronLensMaterial,dockLightMaterial,beacons,windowMaterial:glass,ceilingMaterial,pavementMaterials:[asphalt,runwayAsphalt,taxiPave,taxiAsphalt,taxiMixed,concrete],updateScreens,updateVegetation:vegetation.update};
}
