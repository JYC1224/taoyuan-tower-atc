import * as THREE from 'three';
import type {Airline,Aircraft,FleetProfile} from '../types';
import {box,canvasTexture,cylinder,material} from './primitives';
import {fuselage,tailSkin} from './aircraftSkin';
import {batchStatic} from './surfaceDetail';
import {flyingSurfaces,fineAirframe,wingPaint,trailingFlap,spoilerPanels,fanRotor,engineInlet,enginePylon,engineExhaust,strutBetween} from './aircraftDetail';
import {liveryColors} from './liveries';
import {airframeDesign} from './aircraftDesign';
import {createPushbackTug,updatePushbackTug,type PushbackTug} from './pushbackTug';
import {createMarshaller,createStandService,updateStandService,animateMarshaller,type StandService} from './groundCrew';
import {gates,taxiNodes} from '../data/airport';

/** Replaceable procedural AircraftModel / AirlineLivery asset boundary. Dimensions are metres. */
export interface AircraftVisual {group:THREE.Group;gear:THREE.Group;flaps:THREE.Object3D[];ailerons:THREE.Group[];spoilers:THREE.Group[];lastHeading:number;bank:number;beacon:THREE.Mesh;bellyBeacon:THREE.Mesh;shadow:THREE.Mesh;label:HTMLButtonElement;span:number;tug:THREE.Group;tugControl:PushbackTug;marshaller:THREE.Group;arms:THREE.Group[];standService:StandService;strobes:THREE.Mesh[];landingLights:THREE.Group;nearDetail:THREE.Group;fans:THREE.Group[]}
const white=new THREE.MeshPhysicalMaterial({color:'#e7e9e8',roughness:.32,metalness:.06,clearcoat:.35,clearcoatRoughness:.23}), wingMaterial=material('#d0d5d6',.38,.18), rubber=material('#12191c',.85),metal=material('#65767b',.35,.7),cockpit=material('#263d4c',.16,.5);
const tireMap=canvasTexture(512,128,ctx=>{ctx.fillStyle='#888989';ctx.fillRect(0,0,512,128);ctx.fillStyle='#65686a';ctx.fillRect(0,0,512,26);ctx.fillRect(0,102,512,26);ctx.strokeStyle='#3d4143';ctx.lineWidth=3;for(const y of [29,99]){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();}ctx.strokeStyle='#a2a3a1';ctx.lineWidth=2;for(let x=-24;x<536;x+=20){ctx.beginPath();ctx.moveTo(x,34);ctx.lineTo(x+9,64);ctx.lineTo(x,94);ctx.stroke();ctx.beginPath();ctx.moveTo(x+10,34);ctx.lineTo(x+1,64);ctx.lineTo(x+10,94);ctx.stroke();}});tireMap.wrapS=THREE.RepeatWrapping;
const tireMaterial=new THREE.MeshStandardMaterial({color:'#26292b',map:tireMap,bumpMap:tireMap,bumpScale:.012,roughness:.96,metalness:0});tireMaterial.userData.shared=true;
wingMaterial.map=wingPaint();
const fanMetal=material('#58676c',.4,.68),exhaustDark=material('#303b40',.6,.42);fanMetal.side=exhaustDark.side=THREE.DoubleSide;fanMetal.userData.shared=exhaustDark.userData.shared=true;
const gateById=new Map(gates.map(g=>[g.id,g])),nodeById=new Map(taxiNodes.map(n=>[n.id,n]));
export function createAircraft(profile:FleetProfile,airline:Airline,aircraft:Aircraft,onSelect:(id:string)=>void):AircraftVisual {
 const group=new THREE.Group(),design=airframeDesign(profile);group.userData.aircraftId=aircraft.id;group.rotation.set(aircraft.pitch,-aircraft.heading,0,'YXZ');group.userData.visualType=aircraft.type;group.userData.visualAirline=aircraft.airline;group.userData.visualFlightNumber=aircraft.flightNumber;const L=profile.length,S=profile.span,wide=S>45,is737=profile.id.startsWith('B73')||profile.id==='B38M',r=profile.id==='A380'?3.55:profile.id.startsWith('B77')?3.1:profile.id.startsWith('B78')?2.88:profile.id.startsWith('A35')?2.98:profile.id.startsWith('A33')?2.82:is737?1.88:1.98,gearHeight=wide?2.6:is737?1.52:1.65,bodyY=r+gearHeight;
 // Keep the four established fleet paints exactly as before. Newly added carriers
 // use their own engine/nacelle shade from the livery palette.
 const colors=liveryColors(airline),primary=material(colors.tip,.34,.15),nacellePaint=['EVA','CAL'].includes(airline.id)?white:new THREE.MeshPhysicalMaterial({color:colors.engine,roughness:.32,metalness:.06,clearcoat:.35,clearcoatRoughness:.23});
 const body=fuselage(profile,airline,r);body.position.y=bodyY;group.add(body);
 const apu=new THREE.Mesh(new THREE.CircleGeometry(r*.061,24),rubber);apu.position.set(0,bodyY+r*.36,L*.5+.015);group.add(apu);
 const apuRim=new THREE.Mesh(new THREE.TorusGeometry(r*.063,r*.008,6,24),metal);apuRim.position.copy(apu.position);group.add(apuRim);
 const wy=bodyY-r*.65,flaps:THREE.Object3D[]=[];
 flyingSurfaces(group,profile,r,bodyY,wingMaterial,metal,primary);
 const nearDetail=fineAirframe(group,profile,r,bodyY,white,metal),fans:THREE.Group[]=[],ailerons:THREE.Group[]=[],spoilers=spoilerPanels(group,profile,r,bodyY,wingMaterial);
 for(const side of [-1,1]) {
  flaps.push(trailingFlap(group,side,profile,r,bodyY,wingMaterial,.12,profile.id==='A35K'?.405:.395,profile.id==='A35K'?.245:.22));
  const aileron=trailingFlap(group,side,profile,r,bodyY,wingMaterial,.405,.475,.16);aileron.userData.controlSide=side;ailerons.push(aileron);
  const engineCount=profile.engines===4?2:1;
  for(let i=0;i<engineCount;i++) {const ex=side*S*(i===0?.205:.355),er=design.engineRadius,ez=L*design.engineZFraction+(i===1?L*.095:0),ey=Math.max(er+(wide?.55:.4),wy-er*(design.nacelleVerticalScale<1?.82:.92));
   enginePylon(group,profile,r,bodyY,ex,ey,ez,er,wingMaterial);
   const nacellePoints=[[.74,-.9],[.84,-1.43],[.91,-1.49],[.97,-1.35],[1,-1.05],[1,.2],[.94,.85],[.69,1.6],[.6,1.6]].map(([x,y])=>new THREE.Vector2(er*x,er*y*design.nacelleLength));
   const nacelle=new THREE.Mesh(new THREE.LatheGeometry(nacellePoints,48),nacellePaint);nacelle.rotation.x=Math.PI/2;nacelle.scale.z=design.nacelleVerticalScale;nacelle.position.set(ex,ey,ez);nacelle.castShadow=true;group.add(nacelle);
   // The dark backing sits behind the fan, so it cannot hide the blade surfaces.
   const intake=new THREE.Mesh(new THREE.CircleGeometry(er*.77,48),rubber);intake.position.set(ex,ey,ez-er*.78*design.nacelleLength);intake.rotation.y=Math.PI;group.add(intake);
   const rim=new THREE.Mesh(new THREE.TorusGeometry(er*.88,er*.035,10,48),metal);rim.position.set(ex,ey,ez-er*1.465*design.nacelleLength);group.add(rim);
   const liner=engineInlet(nearDetail,er);liner.position.set(ex,ey,ez);
   const rotor=fanRotor(nearDetail,er,fanMetal,metal);rotor.position.set(ex,ey,ez-er*.94*design.nacelleLength);fans.push(rotor);
   engineExhaust(group,ex,ey,ez+er*(design.nacelleLength-1)*.5,er,nacellePaint,metal,exhaustDark,profile.id.startsWith('B78')||profile.id==='B38M');

  }
  const nav=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),new THREE.MeshBasicMaterial({color:side<0?'#ff4039':'#63ffb3',toneMapped:false}));nav.position.set(side*S*.497,wy+S*.040,L*(wide?.222:.135));group.add(nav);
 }
 const tail=design.verticalTail,h=profile.height-bodyY,rootLead=tail.rootLeading*L,rootTrail=tail.rootTrailing*L,tipLead=tail.tipLeading*L,tipTrail=tail.tipTrailing*L;
 const finShape=new THREE.Shape();finShape.moveTo(rootLead,0);finShape.bezierCurveTo(rootLead+(tipLead-rootLead)*.12,h*.22,tipLead-(tipTrail-tipLead)*.16,h*.78,tipLead,h*.98);finShape.quadraticCurveTo((tipLead+tipTrail)*.5,h,tipTrail,h*.98);finShape.bezierCurveTo(tipTrail+(rootTrail-tipTrail)*.14,h*.66,rootTrail-(rootTrail-rootLead)*.05,h*.20,rootTrail,.28);finShape.quadraticCurveTo(rootTrail*.5+rootLead*.5,.12,rootLead,0);
 const finDepth=r*(profile.id==='A380'?.135:.12),finGeo=new THREE.ExtrudeGeometry(finShape,{depth:finDepth,bevelEnabled:true,bevelThickness:.055,bevelSize:.055,bevelSegments:3,steps:1}),fp=finGeo.getAttribute('position'),fuv=finGeo.getAttribute('uv'),fn=finGeo.getAttribute('normal');
 for(let i=0;i<fp.count;i++){const u=THREE.MathUtils.clamp((fp.getX(i)-rootLead)/(rootTrail-rootLead),0,1);fuv.setXY(i,fn.getZ(i)<0?.5+.5*(1-u):.5*u,THREE.MathUtils.clamp(fp.getY(i)/h,0,1));}
 const finMaterial=tailSkin(airline),fin=new THREE.Mesh(finGeo,finMaterial);fin.rotation.y=-Math.PI/2;fin.position.set(r*.06,bodyY,0);fin.castShadow=true;group.add(fin);
 // A shallow rudder hinge line follows the fin's aft sweep on both faces.
 const rudderLineMaterial=new THREE.LineBasicMaterial({color:'#647177',transparent:true,opacity:.33,depthWrite:false});rudderLineMaterial.userData.shared=true;
 for(const face of [0,finDepth]){const points:THREE.Vector3[]=[];for(let i=0;i<=24;i++){const t=.12+i/24*.83,y=h*t,lead=THREE.MathUtils.lerp(rootLead,tipLead,t),trail=THREE.MathUtils.lerp(rootTrail,tipTrail,t);points.push(new THREE.Vector3(THREE.MathUtils.lerp(lead,trail,.82),y,face+(face===0?-.018:.018)));}const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),rudderLineMaterial);line.rotation.y=-Math.PI/2;line.position.set(r*.06,bodyY,0);group.add(line);}
 if(is737){const dorsalShape=new THREE.Shape();dorsalShape.moveTo(L*.27,0);dorsalShape.bezierCurveTo(L*.33,.18,L*.38,.78,L*.45,.88);dorsalShape.lineTo(L*.48,.36);dorsalShape.lineTo(L*.48,.10);dorsalShape.closePath();const dorsal=new THREE.Mesh(new THREE.ExtrudeGeometry(dorsalShape,{depth:r*.12,steps:1,bevelEnabled:true,bevelThickness:.035,bevelSize:.04,bevelSegments:2}),fin.material);dorsal.rotation.y=-Math.PI/2;dorsal.position.set(r*.06,bodyY,0);dorsal.castShadow=true;group.add(dorsal);}
 const gear=new THREE.Group(),gearSteel=material('#aeb8bb',.24,.78),gearDark=material('#3b474d',.44,.58),brakeSteel=material('#677174',.40,.67),lugPositions:{x:number;y:number;z:number}[]=[],brakePorts:{x:number;y:number;z:number;size:number}[]=[];group.add(gear);
 const gearStations:{x:number;z:number;mult:number;axles:number[];nose:boolean;belly:boolean}[]=[
  {x:0,z:-L*.34,mult:.7,axles:[0],nose:true,belly:false},
  {x:-design.mainGearTrack*.5,z:L*.07,mult:1,axles:[...design.mainAxles],nose:false,belly:false},
  {x:design.mainGearTrack*.5,z:L*.07,mult:1,axles:[...design.mainAxles],nose:false,belly:false},
 ];
 if(profile.id==='A380')for(const side of [-1,1])gearStations.push({x:side*design.bodyGearTrack*.5,z:L*.07,mult:.96,axles:[-.9,0,.9],nose:false,belly:true});
 for(const unit of gearStations) {
  const {x:gx,z:gz,mult,nose,belly,axles}=unit,wheelRadius=nose?design.noseWheelRadius:design.mainWheelRadius,wheelTrack=nose?design.noseWheelTrack:belly?design.bodyWheelTrack:design.mainWheelTrack,top=nose?gearHeight+.15:belly?bodyY-r+.30:wy-.12,bottom=wheelRadius;
  cylinder(gear,.14*mult,.17*mult,top-bottom-.34,gx,(top+bottom+.34)/2,gz,gearDark,16);
  cylinder(gear,.075*mult,.09*mult,.48*mult,gx,bottom+.24*mult,gz,gearSteel,14);
  cylinder(gear,.17*mult,.17*mult,.12*mult,gx,top-.06,gz,metal,16);
  for(const side of [-1,1]){const door=box(gear,(nose?.34:.46)*mult,.07,(nose?1.35:1.85)*mult,gx+side*.31*mult,top-.16,gz,wingMaterial);door.rotation.z=side*.28;}
  const sideSign=Math.sign(gx)||1,braceA=new THREE.Vector3(gx-sideSign*.32,top-.18,gz-(nose?.22:.62)),braceB=new THREE.Vector3(gx,bottom+.66*mult,gz+.03);
  strutBetween(gear,braceA,braceB,.055*mult,gearSteel);
  strutBetween(gear,new THREE.Vector3(gx+sideSign*.26,top-.22,gz+(nose?.24:.48)),new THREE.Vector3(gx,bottom+.66*mult,gz-.10),.047*mult,gearSteel);
  const minAxle=Math.min(...axles),maxAxle=Math.max(...axles),truckLength=Math.max(.62,maxAxle-minAxle+.62),truckZ=gz+(minAxle+maxAxle)/2;
  box(gear,.14*mult,.18*mult,truckLength,gx,bottom+.48*mult,truckZ,gearDark);
  for(const axle of axles)for(const side of [-1,1]){
   const tireWidth=wheelRadius*.72,wheelX=gx+side*wheelTrack*.5;
   const wheel=new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius,wheelRadius,tireWidth,40),tireMaterial);wheel.rotation.z=Math.PI/2;wheel.position.set(wheelX,bottom,gz+axle);gear.add(wheel);
   const hub=new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius*.43,wheelRadius*.43,tireWidth*1.04,20),metal);hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);gear.add(hub);
   const brakeDisc=new THREE.Mesh(new THREE.TorusGeometry(wheelRadius*.57,wheelRadius*.03,6,32),brakeSteel);brakeDisc.rotation.y=Math.PI/2;brakeDisc.position.set(wheel.position.x+side*tireWidth*.54,bottom,wheel.position.z);gear.add(brakeDisc);
   const sidewall=new THREE.Mesh(new THREE.TorusGeometry(wheelRadius*.875,wheelRadius*.041,6,28),gearDark);sidewall.rotation.y=Math.PI/2;sidewall.position.set(wheel.position.x+side*tireWidth*.52,wheel.position.y,wheel.position.z);gear.add(sidewall);
   const rimDetail=new THREE.Mesh(new THREE.TorusGeometry(wheelRadius*.36,wheelRadius*.036,6,20),gearSteel);rimDetail.rotation.y=Math.PI/2;rimDetail.position.set(wheel.position.x+side*tireWidth*.55,wheel.position.y,wheel.position.z);gear.add(rimDetail);
   for(let bolt=0;bolt<8;bolt++){const angle=bolt/8*Math.PI*2;lugPositions.push({x:wheel.position.x+side*tireWidth*.56,y:bottom+Math.cos(angle)*wheelRadius*.28,z:wheel.position.z+Math.sin(angle)*wheelRadius*.28});}
   for(let port=0;port<8;port++){const angle=port/8*Math.PI*2,radius=wheelRadius*.57;brakePorts.push({x:wheel.position.x+side*tireWidth*.55,y:bottom+Math.cos(angle)*radius,z:wheel.position.z+Math.sin(angle)*radius,size:wheelRadius*.041});}
   strutBetween(gear,new THREE.Vector3(gx,bottom+.33*mult,gz+axle),new THREE.Vector3(wheel.position.x,bottom,wheel.position.z),.045*mult,gearSteel);
  }
 }
 const lugGeometry=new THREE.CylinderGeometry(.026,.026,.022,8);lugGeometry.rotateZ(Math.PI/2);const lugBolts=new THREE.InstancedMesh(lugGeometry,gearSteel,lugPositions.length),lugTransform=new THREE.Object3D();lugPositions.forEach((position,index)=>{lugTransform.position.set(position.x,position.y,position.z);lugTransform.updateMatrix();lugBolts.setMatrixAt(index,lugTransform.matrix);});gear.add(lugBolts);
 const portMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,4),gearDark,brakePorts.length),portTransform=new THREE.Object3D();brakePorts.forEach((position,index)=>{portTransform.position.set(position.x,position.y,position.z);portTransform.scale.setScalar(position.size);portTransform.updateMatrix();portMesh.setMatrixAt(index,portTransform.matrix);});gear.add(portMesh);
 const beacon=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),new THREE.MeshBasicMaterial({color:'#ff3327',toneMapped:false}));beacon.position.set(0,bodyY+r+.08,0);group.add(beacon);
 const bellyBeacon=new THREE.Mesh(new THREE.SphereGeometry(.14,12,8),new THREE.MeshBasicMaterial({color:'#ff3327',toneMapped:false}));bellyBeacon.position.set(0,bodyY-r-.08,-L*.16);group.add(bellyBeacon);
 const strobes:THREE.Mesh[]=[],landingLights=new THREE.Group();for(const side of [-1,1]){const strobe=new THREE.Mesh(new THREE.SphereGeometry(.13,10,6),new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}));strobe.position.set(side*S*.497,wy+S*.041,L*(wide?.222:.135));group.add(strobe);strobes.push(strobe);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.16,10,6),new THREE.MeshBasicMaterial({color:'#fff5d6',toneMapped:false}));lamp.position.set(side*r*1.35,wy,-L*(wide?.052:.085));landingLights.add(lamp);}group.add(landingLights);
 const shadowTexture=canvasTexture(256,256,ctx=>{ctx.shadowColor='rgba(8,16,20,.34)';ctx.shadowBlur=14;ctx.fillStyle='rgba(8,16,20,.19)';ctx.beginPath();ctx.ellipse(128,128,12,99,0,0,Math.PI*2);ctx.fill();for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(128,105);ctx.lineTo(128+side*115,164);ctx.lineTo(128+side*108,172);ctx.lineTo(128,149);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(128,207);ctx.lineTo(128+side*45,232);ctx.lineTo(128,224);ctx.closePath();ctx.fill();}});
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(S*1.05,L*1.05),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;
 const label=document.createElement('button');label.className='aircraft-label';label.dataset.aircraftId=aircraft.id;label.innerHTML=`<span class="label-dot"></span><b>${aircraft.flightNumber}</b><small>${aircraft.flightSource?(aircraft.publishedType??'MODEL N/P'):profile.id}</small>`;label.addEventListener('click',e=>{e.stopPropagation();onSelect(aircraft.id);});
 const tugControl=createPushbackTug(group,L),tug=tugControl.group,guide=createMarshaller(group,L),marshaller=guide.group,arms=guide.arms;
 const standService=createStandService(group,profile,r,bodyY);
 group.traverse(o=>{if(o instanceof THREE.Mesh){for(const m of Array.isArray(o.material)?o.material:[o.material])if(!m.userData.shared&&![white,wingMaterial,rubber,metal,cockpit].includes(m as THREE.MeshStandardMaterial))m.userData.aircraftOwned=true;}});batchStatic(gear);batchStatic(tug);batchStatic(group,[...flaps,...ailerons,...spoilers,beacon,bellyBeacon,...strobes]);
 return {group,gear,flaps,ailerons,spoilers,lastHeading:aircraft.heading,bank:0,beacon,bellyBeacon,shadow,label,span:S,tug,tugControl,marshaller,arms,standService,strobes,landingLights,nearDetail,fans};
}
export function updateAircraft(visual:AircraftVisual,a:Aircraft,time:number,dt:number,shadowStrength=1,tugDt=dt,groundTime=time) {
 const headingDelta=Math.atan2(Math.sin(a.heading-visual.lastHeading),Math.cos(a.heading-visual.lastHeading)),turnRate=dt>.004?headingDelta/dt:0;visual.lastHeading=a.heading;
 const bankTarget=a.position.y>20?THREE.MathUtils.clamp(Math.atan(a.speed*turnRate/9.81),-.38,.38):0;visual.bank+=(bankTarget-visual.bank)*(1-Math.exp(-dt*2.6));visual.group.rotation.z=visual.bank;
 for(const aileron of visual.ailerons){const side=aileron.userData.controlSide as number;aileron.rotation.x+=(THREE.MathUtils.clamp(-visual.bank*side*.8,-.24,.24)-aileron.rotation.x)*(1-Math.exp(-dt*5));}
 const spoilerTarget=a.position.y<2&&a.speed>18&&['TOUCHDOWN','DECELERATING'].includes(a.state)?1:0;for(const panel of visual.spoilers)panel.rotation.x+=(spoilerTarget*.86-panel.rotation.x)*(1-Math.exp(-dt*5));
 for(const fan of visual.fans)fan.rotation.z+=dt*(['PARKED','DOCKED','REQUESTING_PUSHBACK','PUSHING'].includes(a.state)?0:a.position.y>10?24:9);
 const gate=gateById.get(a.gate),nearStand=!!gate&&Math.hypot(a.position.x-gate.x,a.position.z-gate.z)<Math.min(75,visual.standService.length*.8+20);
 visual.marshaller.visible=a.state==='ENTERING_STAND'||a.state==='TAXIING_TO_GATE'&&nearStand;
 if(visual.marshaller.visible)animateMarshaller(visual.arms,groundTime);
 visual.strobes.forEach(light=>light.visible=!['PARKED','DOCKED','REQUESTING_PUSHBACK'].includes(a.state)&&(time%1.1<.045||(time+.09)%1.1<.045));visual.landingLights.visible=['TAXIING','TAXIING_TO_GATE','TAKEOFF_ROLL','FINAL','LANDING_CLEARED','DECELERATING'].includes(a.state);
 visual.group.position.set(a.position.x,a.position.y+.195,a.position.z);const turn=Math.atan2(Math.sin(-a.heading-visual.group.rotation.y),Math.cos(-a.heading-visual.group.rotation.y)),blend=1-Math.exp(-dt*12);visual.group.rotation.y+=turn*blend;visual.group.rotation.x+=(a.pitch-visual.group.rotation.x)*blend;visual.gear.visible=a.position.y<90;visual.beacon.visible=visual.bellyBeacon.visible=time%1.2<.11;visual.shadow.position.set(a.position.x,.28,a.position.z);visual.shadow.rotation.z=a.heading;(visual.shadow.material as THREE.MeshBasicMaterial).opacity=Math.max(0,1-a.position.y/400)*shadowStrength;visual.shadow.visible=a.position.y<400&&shadowStrength>.01;const flapTarget=['APPROACH','FINAL','LANDING_CLEARED','TAKEOFF_ROLL','TOUCHDOWN','DECELERATING'].includes(a.state)?.18:0;for(const flap of visual.flaps)flap.rotation.x+=(flapTarget-flap.rotation.x)*(1-Math.exp(-dt*4.5));
 if(visual.marshaller.visible&&gate){
  const push=nodeById.get(gate.pushbackNodeId),heading=push?Math.atan2(gate.x-push.x,-(gate.z-push.z)):a.heading,forward=visual.standService.length/2+7;
  const p=new THREE.Vector3(gate.x+Math.sin(heading)*forward-Math.cos(heading)*4,.195,gate.z-Math.cos(heading)*forward-Math.sin(heading)*4);
  visual.group.updateWorldMatrix(true,false);visual.marshaller.position.copy(visual.group.worldToLocal(p));visual.marshaller.rotation.y=-heading-visual.group.rotation.y;
 }
 updatePushbackTug(visual.tugControl,a,tugDt);
 updateStandService(visual.standService,a,groundTime);
}
