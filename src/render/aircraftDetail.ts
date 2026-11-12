import * as THREE from 'three';
import type {FleetProfile} from '../types';
import {box,canvasTexture} from './primitives';
import {batchStatic} from './surfaceDetail';
import {airframeDesign,wingTemplate} from './aircraftDesign';

const spinnerMark=new THREE.MeshStandardMaterial({color:'#deded3',roughness:.52,metalness:.12,side:THREE.DoubleSide});spinnerMark.userData.shared=true;
const linerMap=canvasTexture(512,256,ctx=>{
 ctx.fillStyle='#899698';ctx.fillRect(0,0,512,256);ctx.fillStyle='#586a6e77';
 for(let y=2;y<256;y+=4)for(let x=2+(Math.floor(y/4)%2)*2;x<512;x+=4)ctx.fillRect(x,y,.8,.8);
 ctx.strokeStyle='#b9c0be55';ctx.lineWidth=1;for(let x=64;x<512;x+=128){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,256);ctx.stroke();}
 });linerMap.userData.shared=true;
const inletMaterial=new THREE.MeshStandardMaterial({map:linerMap,color:'#b7c1c0',roughness:.57,metalness:.48,side:THREE.DoubleSide});inletMaterial.userData.shared=true;

interface Station {x:number;y:number;z:number;chord:number;thickness:number}
function wingStations(profile:FleetProfile,r:number,bodyY:number):Station[]{
 const S=profile.span,y=bodyY-r*.65,template=wingTemplate(profile),x=[r*.72,S*.18,S*.275,S*.43,S*.485,S*.5];
 return x.map((span,index)=>({x:span,y:y+S*[0,.003,.009,.027,.037,.042][index],z:template.leading[index],chord:template.chord[index],thickness:template.thickness[index]}));
}
function section(profile:FleetProfile,r:number,bodyY:number,fraction:number):Station{
 const stations=wingStations(profile,r,bodyY),x=profile.span*fraction;let a=stations[0],b=stations[1];for(let i=1;i<stations.length;i++)if(x<=stations[i].x){a=stations[i-1];b=stations[i];break;}
 const t=THREE.MathUtils.clamp((x-a.x)/(b.x-a.x),0,1),mix=(key:'y'|'z'|'chord'|'thickness')=>THREE.MathUtils.lerp(a[key],b[key],t);return{x,y:mix('y'),z:mix('z'),chord:mix('chord'),thickness:mix('thickness')};
}
function loft(parent:THREE.Group,side:number,stations:Station[],skin:THREE.Material){
 const p:number[]=[],uv:number[]=[],indices:number[]=[],samples=48;
 for(let j=0;j<stations.length;j++){const s=stations[j];for(let k=0;k<=samples;k++){
  const angle=k/samples*Math.PI*2,u=(1-Math.cos(angle))/2,sign=Math.sin(angle)>=0?1:-1;
  const thickness=5*s.thickness*s.chord*(.2969*Math.sqrt(u)-.126*u-.3516*u*u+.2843*u**3-.1036*u**4);
  p.push(side*s.x,s.y+sign*thickness+Math.sin(u*Math.PI)*s.chord*.013,s.z+u*s.chord);uv.push(j/(stations.length-1),u);
 }}
 for(let j=0;j<stations.length-1;j++)for(let k=0;k<samples;k++){const a=j*(samples+1)+k,b=a+samples+1;indices.push(...(side>0?[a,a+1,b,a+1,b+1,b]:[a,b,a+1,a+1,b,b+1]));}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
 // Leading and trailing edges share analytic seam normals, not a visible crease.
 const n=geometry.getAttribute('normal');for(let j=0;j<stations.length;j++){const a=j*(samples+1),b=a+samples,v=new THREE.Vector3().fromBufferAttribute(n,a).add(new THREE.Vector3().fromBufferAttribute(n,b)).normalize();n.setXYZ(a,v.x,v.y,v.z);n.setXYZ(b,v.x,v.y,v.z);}
 const mesh=new THREE.Mesh(geometry,skin);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

export function fanRotor(parent:THREE.Group,radius:number,metal:THREE.Material,hubMaterial:THREE.Material){
 const group=new THREE.Group(),p:number[]=[],indices:number[]=[];parent.add(group);
 for(let blade=0;blade<22;blade++)for(let j=0;j<=5;j++)for(const edge of [-1,1]){
  const t=j/5,r=radius*(.16+t*.60),a=blade/22*Math.PI*2+t*.43+edge*(.035+t*.057);p.push(Math.sin(a)*r,Math.cos(a)*r,Math.sin(t*Math.PI)*radius*.07+edge*radius*.025);
 }
 for(let blade=0;blade<22;blade++)for(let j=0;j<5;j++){const a=blade*12+j*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(p.length/3*2),2));geometry.setIndex(indices);geometry.computeVertexNormals();group.add(new THREE.Mesh(geometry,metal));
 const spinner=new THREE.Mesh(new THREE.ConeGeometry(radius*.20,radius*.46,32),hubMaterial);spinner.rotation.x=-Math.PI/2;spinner.position.z=-radius*.13;group.add(spinner);
 // A narrow spiral follows the cone surface rather than floating in front of it.
 const stripe:number[]=[],stripeIndices:number[]=[],segments=40;
 for(let j=0;j<=segments;j++){const t=.13+j/segments*.75,a=t*Math.PI*2.7,rr=radius*(.20*t+.004),z=radius*(-.36+.46*t);for(const edge of [-1,1])stripe.push(Math.sin(a+edge*.12)*rr,Math.cos(a+edge*.12)*rr,z);}
 for(let j=0;j<segments;j++){const k=j*2;stripeIndices.push(k,k+1,k+2,k+1,k+3,k+2);}
 const stripeGeometry=new THREE.BufferGeometry();stripeGeometry.setAttribute('position',new THREE.Float32BufferAttribute(stripe,3));stripeGeometry.setIndex(stripeIndices);stripeGeometry.computeVertexNormals();group.add(new THREE.Mesh(stripeGeometry,spinnerMark));
 batchStatic(group);return group;
}

/** Curved, perforated acoustic liner just inside the polished intake lip. */
export function engineInlet(parent:THREE.Group,radius:number){
 const points=[[.734,-.91],[.78,-1.16],[.829,-1.40]].map(([r,z])=>new THREE.Vector2(r*radius,z*radius));
 const liner=new THREE.Mesh(new THREE.LatheGeometry(points,48),inletMaterial);liner.rotation.x=Math.PI/2;parent.add(liner);return liner;
}

/** A tapered two-dimensional engine pylon, extruded across the wing thickness. */
export function enginePylon(parent:THREE.Group,profile:FleetProfile,r:number,bodyY:number,ex:number,ey:number,ez:number,er:number,skin:THREE.Material){
 const span=profile.span,fraction=THREE.MathUtils.clamp(Math.abs(ex)/span,.04,.48),s=section(profile,r,bodyY,fraction),u=.58;
 const thickness=5*s.thickness*s.chord*(.2969*Math.sqrt(u)-.126*u-.3516*u*u+.2843*u**3-.1036*u**4)+Math.sin(u*Math.PI)*s.chord*.013;
 const wingBottom=s.y-thickness,wingAttach=wingBottom+.10,engineAttach=ey+er*.70,chord=er*.95,depth=er*.34;
 const shape=new THREE.Shape();shape.moveTo(chord*.38,wingAttach);shape.bezierCurveTo(chord*.18,wingAttach+.08,-chord*.38,wingAttach+.08,-chord*.62,wingAttach-.04);shape.lineTo(-chord*.45,engineAttach-.08);shape.quadraticCurveTo(-chord*.31,engineAttach,-chord*.12,engineAttach);shape.lineTo(chord*.19,engineAttach);shape.quadraticCurveTo(chord*.37,engineAttach-.03,chord*.38,wingAttach);
 const geometry=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelThickness:.035,bevelSize:.045,bevelSegments:2});
 const mesh=new THREE.Mesh(geometry,skin);mesh.rotation.y=Math.PI/2;mesh.position.set(ex-depth/2,0,ez);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

/** Fine structural struts used by the landing-gear trusses. */
export function strutBetween(parent:THREE.Object3D,start:THREE.Vector3,end:THREE.Vector3,radius:number,skin:THREE.Material){
 const axis=new THREE.Vector3().subVectors(end,start),length=axis.length();if(length<.01)return;
 const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius*.78,radius,length,8),skin);mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize());mesh.castShadow=true;parent.add(mesh);return mesh;
}

/** Exhaust liner and turbine cone; the toothed rim distinguishes the 787 nacelle. */
export function engineExhaust(parent:THREE.Group,ex:number,ey:number,ez:number,er:number,body:THREE.Material,metal:THREE.Material,dark:THREE.Material,chevrons:boolean){
 const group=new THREE.Group();group.position.set(ex,ey,ez);parent.add(group);
 const liner=new THREE.Mesh(new THREE.CylinderGeometry(er*.56,er*.63,er*.78,40,1,true),dark);liner.rotation.x=Math.PI/2;liner.position.z=er*1.22;group.add(liner);
 const core=new THREE.Mesh(new THREE.ConeGeometry(er*.34,er*.82,32),metal);core.rotation.x=Math.PI/2;core.position.z=er*1.18;group.add(core);
 const outlet=new THREE.Mesh(new THREE.CircleGeometry(er*.64,40),dark);outlet.position.z=er*.90;group.add(outlet);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(er*.585,er*.026,8,40),metal);rim.position.z=er*1.565;group.add(rim);
 const seam=new THREE.Mesh(new THREE.TorusGeometry(er*.94,er*.009,5,40),dark);seam.position.z=er*.52;group.add(seam);
 if(chevrons){
  const p:number[]=[],idx:number[]=[],count=20,z=er*1.57;
  for(let i=0;i<count;i++){const a=i/count*Math.PI*2,b=(i+1)/count*Math.PI*2,m=(a+b)/2,base=er*.565,tip=er*.63,k=p.length/3;p.push(Math.cos(a)*base,Math.sin(a)*base,z,Math.cos(b)*base,Math.sin(b)*base,z,Math.cos(m)*tip,Math.sin(m)*tip,z);idx.push(k,k+2,k+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();group.add(new THREE.Mesh(g,body));
 }
 batchStatic(group);return group;
}

export function wingPaint(){
 const map=canvasTexture(1024,1024,ctx=>{
  ctx.fillStyle='#c6cbcd';ctx.fillRect(0,0,1024,1024);
  const g=ctx.createLinearGradient(0,0,0,1024);g.addColorStop(0,'#d7dcdd');g.addColorStop(.08,'#b4bdc1');g.addColorStop(.4,'#ccd0d2');g.addColorStop(1,'#bec6c9');ctx.fillStyle=g;ctx.fillRect(0,0,1024,1024);
  ctx.strokeStyle='#7f8b915c';ctx.lineWidth=1;
  for(const y of [175,390,680,760]){ctx.beginPath();ctx.moveTo(16,y);ctx.lineTo(1010,y);ctx.stroke();}
  for(const x of [120,250,430,630,820]){ctx.beginPath();ctx.moveTo(x,80);ctx.lineTo(x+18,765);ctx.stroke();}
  // Subtle slat and spoiler boundaries retain the shape of separate panels.
  ctx.strokeStyle='#596c7180';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(105,133);ctx.lineTo(950,133);ctx.stroke();
  ctx.fillStyle='#8e9a9d16';for(const x of [205,320,435,550,665]){ctx.fillRect(x,522,103,128);ctx.strokeRect(x,522,103,128);}
  ctx.strokeStyle='#49565c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(40,757);ctx.lineTo(775,757);ctx.stroke();
  for(let x=170;x<800;x+=150){ctx.strokeStyle='#65757b';ctx.lineWidth=1;ctx.strokeRect(x,449,35,48);}
  ctx.fillStyle='#697277';ctx.fillRect(7,250,38,450);ctx.strokeStyle='#d9d9d4';ctx.lineWidth=2;ctx.strokeRect(12,260,26,430);
 });map.userData.shared=true;map.anisotropy=8;return map;
}

/** Lofted cambered airfoils, swept taper and family tip shapes; dimensions remain
 * inside the existing fleet span. This geometry never supplies collision data. */
export function flyingSurfaces(parent:THREE.Group,profile:FleetProfile,r:number,bodyY:number,wing:THREE.Material,trim:THREE.Material,accent:THREE.Material){
 const L=profile.length,S=profile.span,wide=S>45,rootY=bodyY-r*.65;
 for(const side of [-1,1]){
  const stations=wingStations(profile,r,bodyY);loft(parent,side,stations,wing);
  // A shallow polished leading-edge strip follows the swept planform.
  const strip:number[]=[],index:number[]=[];for(const s of stations){const u=.026,top=5*s.thickness*s.chord*(.2969*Math.sqrt(u)-.126*u-.3516*u*u+.2843*u**3-.1036*u**4)+Math.sin(u*Math.PI)*s.chord*.013;strip.push(side*s.x,s.y+.018,s.z+.005,side*s.x,s.y+top+.018,s.z+s.chord*u);}
  for(let i=0;i<stations.length-1;i++){const a=i*2;index.push(...(side>0?[a,a+1,a+2,a+1,a+3,a+2]:[a,a+2,a+1,a+1,a+2,a+3]));}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(strip,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(strip.length/3*2),2));g.setIndex(index);g.computeVertexNormals();parent.add(new THREE.Mesh(g,trim));
  if(profile.id.startsWith('A')&&profile.id!=='A380'){
   const tip=stations.at(-1)!,classic=['A320C','A321C','A332','A330'].includes(profile.id),rootChord=wide?2.8:1.85;
   if(classic){
    // Classic A320/A330 wings use a small upper-and-lower fence instead of
    // the taller blended sharklet fitted to the newer families.
    const fenceHeight=wide?2.5:2.1;
    loft(parent,side,[{...tip,x:S*.476,chord:rootChord,thickness:.075},{x:S*.489,y:tip.y+fenceHeight*.35,z:tip.z+.55,chord:rootChord*.78,thickness:.065},{x:S*.493,y:tip.y+fenceHeight,z:tip.z+1.25,chord:.52,thickness:.035}],accent);
    loft(parent,side,[{...tip,x:S*.476,chord:rootChord*.92,thickness:.07},{x:S*.488,y:tip.y-fenceHeight*.30,z:tip.z+.45,chord:rootChord*.73,thickness:.06},{x:S*.491,y:tip.y-fenceHeight*.64,z:tip.z+1.0,chord:.48,thickness:.03}],accent);
   }else if(profile.id.startsWith('A35')){
    // A350 composite tip rises in a smooth swept arc, rather than a straight fin.
    const height=3.15;
    loft(parent,side,[{...tip,x:S*.477,chord:wide?3.05:2.05,thickness:.075},{x:S*.489,y:tip.y+height*.32,z:tip.z+.55,chord:wide?2.45:1.68,thickness:.067},{x:S*.497,y:tip.y+height*.78,z:tip.z+1.45,chord:wide?1.45:.95,thickness:.05},{x:S*.495,y:tip.y+height,z:tip.z+2.4,chord:.5,thickness:.032}],accent);
   }else{
    // Neo sharklets have a broader root and a more swept, curled tip.
    const height=profile.id==='A339'?3.35:2.35;
    loft(parent,side,[{...tip,x:S*.476,chord:wide?3.05:1.95,thickness:.075},{x:S*.489,y:tip.y+height*.32,z:tip.z+.48,chord:wide?2.45:1.62,thickness:.067},{x:S*.497,y:tip.y+height*.82,z:tip.z+1.35,chord:wide?1.45:.92,thickness:.05},{x:S*.495,y:tip.y+height,z:tip.z+2.2,chord:.48,thickness:.032}],accent);
   }
  }else if(profile.id.startsWith('B73')||profile.id==='B38M'){
   const tip=stations.at(-1)!,rootChord=1.75;loft(parent,side,[{...tip,x:S*.482,chord:rootChord,thickness:.075},{x:S*.493,y:tip.y+.75,z:tip.z+.62,chord:rootChord*.82,thickness:.065},{x:S*.497,y:tip.y+2.05,z:tip.z+1.82,chord:.48,thickness:.035}],accent);
   if(profile.id==='B38M')loft(parent,side,[{...tip,x:S*.482,chord:rootChord*.92,thickness:.07},{x:S*.493,y:tip.y-.55,z:tip.z+.62,chord:rootChord*.72,thickness:.055},{x:S*.496,y:tip.y-1.0,z:tip.z+1.45,chord:.42,thickness:.03}],accent);
  }
  const tail=airframeDesign(profile),tailScale=tail.tailplaneScale,tailChord=tail.tailplaneChords;
  loft(parent,side,[{x:r*.35,y:bodyY+.7,z:L*.315,chord:tailChord[0],thickness:.10},{x:S*.12*tailScale,y:bodyY+S*.012,z:L*.365,chord:tailChord[1],thickness:.09},{x:S*.205*tailScale,y:bodyY+S*.019,z:L*.435,chord:tailChord[2],thickness:.07}],wing);
 }
}

export function trailingFlap(parent:THREE.Group,side:number,profile:FleetProfile,r:number,bodyY:number,skin:THREE.Material,start=.13,end=.29,chordRatio=.24){
 const centerFraction=(start+end)/2,center=section(profile,r,bodyY,centerFraction),pivotU=.77,pivotZ=center.z+center.chord*pivotU,group=new THREE.Group();group.position.set(side*center.x,center.y+.035,pivotZ);parent.add(group);
 const stations=[start,centerFraction,end].map(f=>{const s=section(profile,r,bodyY,f);return{x:s.x-center.x,y:s.y-center.y,z:s.z+s.chord*pivotU-pivotZ,chord:s.chord*chordRatio,thickness:.055};});loft(group,side,stations,skin);return group;
}

/** Hinged spoiler panels, raised only during landing rollout. */
export function spoilerPanels(parent:THREE.Group,profile:FleetProfile,r:number,bodyY:number,skin:THREE.Material){
 const panels:THREE.Group[]=[],span=profile.span;
 for(const side of [-1,1])for(const fraction of [.16,.215,.27,.325,.38]){
  const s=section(profile,r,bodyY,fraction),u=.58;
  const thickness=5*s.thickness*s.chord*(.2969*Math.sqrt(u)-.126*u-.3516*u*u+.2843*u**3-.1036*u**4)+Math.sin(u*Math.PI)*s.chord*.013;
  const chord=Math.max(.72,s.chord*.23),width=Math.min(2.65,span*.047),hingeZ=s.z+s.chord*.70;
  const panel=new THREE.Group();panel.position.set(side*s.x,s.y+thickness+.035,hingeZ);panel.userData.spoiler=true;parent.add(panel);
  const plate=new THREE.Mesh(new THREE.BoxGeometry(width,.045,chord),skin);plate.position.z=-chord*.5;plate.castShadow=true;plate.receiveShadow=true;panel.add(plate);panels.push(panel);
 }
 return panels;
}

/** A flush outboard aileron is baked into the static wing batch. */
export function fixedTrailingSurface(parent:THREE.Group,side:number,profile:FleetProfile,r:number,bodyY:number,skin:THREE.Material,start:number,end:number,chordRatio:number){
 const frame=trailingFlap(new THREE.Group(),side,profile,r,bodyY,skin,start,end,chordRatio),surface=frame.children[0];frame.updateMatrix();
 if(surface instanceof THREE.Mesh){surface.geometry.applyMatrix4(frame.matrix);frame.remove(surface);parent.add(surface);return surface;}return undefined;
}

export function fineAirframe(parent:THREE.Group,profile:FleetProfile,r:number,bodyY:number,paint:THREE.Material,metal:THREE.Material){
 const group=new THREE.Group(),L=profile.length,S=profile.span,wide=S>45;parent.add(group);
 // Flap-track canoes and wing-root fairings establish the underwing scale.
 for(const side of [-1,1])for(const fraction of [.16,.27,.37]){
  const s=section(profile,r,bodyY,fraction),canoe=new THREE.Mesh(new THREE.SphereGeometry(1,16,8),paint);canoe.scale.set(wide?.30:.21,wide?.26:.18,L*(wide?.031:.022));canoe.position.set(side*s.x,s.y-(wide?.18:.12),s.z+s.chord-L*.014);canoe.castShadow=true;group.add(canoe);
 }
 for(const t of [-.22,.02,.18]){const antenna=new THREE.Mesh(new THREE.ConeGeometry(wide?.19:.13,wide?.8:.53,3),paint);antenna.scale.z=.30;antenna.position.set(0,bodyY+r+.24,L*t);group.add(antenna);}
 // Fine static-discharge wicks sit just aft of the wing trailing edge.
 for(const side of [-1,1])for(const fraction of (wide?[.28,.36,.43,.475]:[.30,.39,.46])){
  const s=section(profile,r,bodyY,fraction),start=new THREE.Vector3(side*s.x,s.y-.02,s.z+s.chord*.985),end=new THREE.Vector3(side*(s.x+.14),s.y-.18,s.z+s.chord+.22);
  strutBetween(group,start,end,.014,metal);
 }
 const fairing=new THREE.Mesh(new THREE.SphereGeometry(1,24,12),paint);fairing.scale.set(r*1.08,r*.45,L*.19);fairing.position.set(0,bodyY-r*.73,L*.015);fairing.castShadow=true;parent.add(fairing);
 // Nose radome seam and pitot probes are modest geometry, not bright fake lights.
 for(const side of [-1,1]){const probe=box(group,.07,.06,L*.018,side*r*.65,bodyY-r*.10,-L*.38,metal);probe.rotation.y=side*.10;}
 batchStatic(group);group.userData.nearDetail=true;return group;
}
