import * as THREE from 'three';
import type {Airline,FleetProfile} from '../types';
import {canvasTexture} from './primitives';
import {liveryTexture,paintFuselageBase,paintFuselageBrand,paintTail} from './liveries';
import {noseSpec,type NosePoint} from './aircraftNose';
import {airframeDesign} from './aircraftDesign';
import {RefCountedCache} from './refCountedCache';

const skinTextures=new RefCountedCache<THREE.Texture>(texture=>texture.dispose());
const materialReleases=new WeakMap<THREE.Material,()=>void>();
const sharedTexture=(key:string,create:()=>THREE.Texture)=>skinTextures.acquire(key,()=>{const texture=create();texture.userData.shared=true;return texture;});
/** Release each material's references exactly once, even if it appears on several meshes. */
export function releaseAircraftSkin(material:THREE.Material){const release=materialReleases.get(material);if(release){materialReleases.delete(material);release();}}

export function fuselageRadius(t:number,r:number,noseFraction=.115,roundness=2){
 if(t<noseFraction){const q=t/noseFraction;return r*Math.sqrt(Math.max(0,1-(1-q)**roundness));}
 if(t>.73){const q=(t-.73)/.27;return r*(1-q*q*(3-2*q)+.065*q);}
 return r;
}

function cockpitPanes(ctx:CanvasRenderingContext2D,W:number,profile:FleetProfile,rough=false){
 const spec=noseSpec(profile),fraction=spec.length/profile.length,toX=(q:number)=>W*fraction*q,toY=(angle:number)=>1024*angle/(Math.PI*2);
 const path=(points:readonly NosePoint[],smooth=false)=>{ctx.beginPath();if(smooth){const first=points[0],last=points[points.length-1];ctx.moveTo(toX((first[0]+last[0])/2),toY((first[1]+last[1])/2));for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];ctx.quadraticCurveTo(toX(a[0]),toY(a[1]),toX((a[0]+b[0])/2),toY((a[1]+b[1])/2));}}else points.forEach(([q,angle],i)=>i?ctx.lineTo(toX(q),toY(angle)):ctx.moveTo(toX(q),toY(angle)));ctx.closePath();};
 if(spec.mask){path(spec.mask,true);ctx.fillStyle=rough?'#181818':'#202a30';ctx.fill();}
 for(const pane of spec.panes){path(pane);if(rough)ctx.fillStyle='#181818';else{const gradient=ctx.createLinearGradient(0,0,0,225);gradient.addColorStop(0,'#3c5260');gradient.addColorStop(.46,'#263c49');gradient.addColorStop(1,'#162a34');ctx.fillStyle=gradient;}ctx.fill();if(!rough){ctx.strokeStyle=spec.mask?'#77888e':'#a9b5b8';ctx.lineWidth=spec.mask?2:3;ctx.lineJoin='round';ctx.stroke();}}
}

const passengerDoorLayout:Record<string,number[]>={
 A320:[.13,.35,.63,.84],A320C:[.13,.35,.63,.84],A321:[.105,.30,.68,.87],A321C:[.105,.30,.68,.87],
 A330:[.115,.34,.65,.85],A332:[.13,.36,.63,.84],A339:[.11,.32,.66,.86],
 A350:[.11,.34,.66,.86],A35K:[.095,.31,.68,.88],
 B789:[.11,.34,.64,.85],B78X:[.095,.31,.67,.88],B77W:[.085,.32,.66,.88],B773:[.085,.32,.66,.88],B772:[.11,.35,.65,.85],
 B738:[.13,.35,.63,.84],B739:[.11,.31,.68,.87],B38M:[.13,.35,.63,.84],
};
// Narrow-body two-exit-over-wing layouts. A321 uses four full-size doors and
// does not share the A320/737 hatch arrangement.
const overwingExitLayout:Record<string,number[]>={A320:[.478,.535],A320C:[.478,.535],B738:[.478,.535],B739:[.478,.535],B38M:[.478,.535]};
function passengerDoorPositions(profile:FleetProfile){return passengerDoorLayout[profile.id]??[.14,.37,.60,.79];}
function passengerWindows(ctx:CanvasRenderingContext2D,W:number,profile:FleetProfile,rough=false){
 if(profile.cargo)return;const width=profile.id.startsWith('B78')?15:profile.id.startsWith('A35')||profile.id==='A380'||profile.id.startsWith('A33')?13:11,height=profile.id.startsWith('B78')?22:20,doorWidth=W*(profile.span>45?.015:.026),rows=profile.id==='A380'?[166,232]:[226],doors=passengerDoorPositions(profile),hatches=overwingExitLayout[profile.id]??[];
 for(let x=W*.16;x<W*.79;x+=W/(profile.length*1.22)){
  for(let row=0;row<rows.length;row++){const y=rows[row],rowDoors=profile.id==='A380'?(row===0?[.16,.46,.75]:[.105,.34,.59,.82]):doors;
   if(rowDoors.some(t=>x>=W*t-4&&x<=W*t+doorWidth+4)||hatches.some(t=>Math.abs(x-W*t)<W*.009))continue;
   if(!rough){ctx.fillStyle='#aab8bd';ctx.beginPath();ctx.roundRect(x-1,y-1,width+2,height+2,profile.id.startsWith('B78')?7:6);ctx.fill();}
   ctx.fillStyle=rough?'#242424':'#354c57';ctx.beginPath();ctx.roundRect(x,y,width,height,profile.id.startsWith('B78')?7:5);ctx.fill();
   if(!rough){ctx.fillStyle='#829ba5';ctx.fillRect(x+2,y+2,Math.max(4,width-4),2);}}
 }
}

/** A single UV skin eliminates coplanar belly/livery rectangles. */
export function fuselage(profile:FleetProfile,airline:Airline,r:number){
 const L=profile.length,W=4096,H=1024,nose=noseSpec(profile),noseFraction=nose.length/L,design=airframeDesign(profile);
 const profileKey=JSON.stringify([profile.id,profile.name,profile.length,profile.span,!!profile.cargo,r]),airlineKey=JSON.stringify([airline.id,airline.name,airline.localName,airline.color,airline.secondary,airline.tailText]);
 const colorLease=sharedTexture(`body:${profileKey}:${airlineKey}`,()=>{const texture=liveryTexture(W,H,ctx=>{
  paintFuselageBase(ctx,airline,W,H);
  const side=(mirror:boolean)=>{
   const text=(value:string,x:number,y:number,width:number)=>{ctx.save();if(mirror){ctx.translate(x+width,y);ctx.scale(-1,1);ctx.fillText(value,0,0,width);}else ctx.fillText(value,x,y,width);ctx.restore();};
   ctx.textBaseline='middle';paintFuselageBrand(ctx,airline,W,mirror,!!profile.cargo);
   passengerWindows(ctx,W,profile);
   ctx.strokeStyle='#9ba6aa';ctx.lineWidth=2.1;
   const doorTop=Math.acos(.95/r)*H/(Math.PI*2),doorHeight=H/2-2*doorTop,doorWidth=W*(profile.span>45?.015:.026);
   const drawDoor=(t:number,top:number,height:number)=>{const x=W*t;ctx.beginPath();ctx.roundRect(x,top,doorWidth,height,7);ctx.stroke();ctx.fillStyle='#ad3432';ctx.fillRect(x+doorWidth*.38,top+10,7,3);ctx.fillStyle='#354c57';ctx.beginPath();ctx.roundRect(x+doorWidth*.42,top+height*.40,11,18,5);ctx.fill();ctx.fillStyle='#758388';ctx.fillRect(x+doorWidth*.76,top+height*.62,8,2);ctx.fillStyle='#6f7e83';ctx.font='600 15px Arial,sans-serif';ctx.textAlign='center';text('EXIT',x,top-8,doorWidth);ctx.fillStyle='#ad3432';ctx.fillRect(x+doorWidth*.46,top-17,8,3);};
   const drawOverwingExit=(t:number)=>{const width=W*.012,x=W*t-width*.5,top=doorTop+22,height=66;ctx.fillStyle='rgba(38,53,60,.08)';ctx.beginPath();ctx.roundRect(x,top,width,height,8);ctx.fill();ctx.strokeStyle='#89979b';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#354c57';ctx.beginPath();ctx.roundRect(x+width*.20,top+height*.30,width*.60,height*.36,6);ctx.fill();ctx.fillStyle='#a53a34';ctx.font='bold 12px Arial,sans-serif';ctx.textAlign='center';text('EXIT',x,top-6,width);ctx.fillStyle='#758388';ctx.fillRect(x+width*.78,top+height*.72,7,2);};
   if(profile.id==='A380'){
    // Seven boarding doors are split by deck; doors no longer span across both window rows.
    for(const t of [.16,.46,.75])drawDoor(t,124,86);
    for(const t of [.105,.34,.59,.82])drawDoor(t,190,86);
   }else for(const t of profile.cargo?[.14,.79]:passengerDoorPositions(profile))drawDoor(t,doorTop,doorHeight);
   for(const t of overwingExitLayout[profile.id]??[])drawOverwingExit(t);
   if(profile.cargo&&!mirror){ctx.beginPath();ctx.roundRect(W*.70,190,W*.062,160,6);ctx.stroke();for(let j=1;j<5;j++){ctx.fillStyle='#758388';ctx.fillRect(W*.70+j*W*.062/5,344,5,3);}}
   else {ctx.strokeStyle='#76888d88';ctx.lineWidth=1.6;for(const t of [.25,.66]){ctx.beginPath();ctx.roundRect(W*t,322,W*.052,38,5);ctx.stroke();ctx.fillStyle='#718087';ctx.fillRect(W*(t+.044),340,6,3);}}
   cockpitPanes(ctx,W,profile);
   ctx.strokeStyle='#9ba9ae';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(W*noseFraction*.24,18);ctx.lineTo(W*noseFraction*.24,365);ctx.stroke();
   ctx.strokeStyle='#71828d20';ctx.lineWidth=.8;for(const t of [.29,.46,.64,.76]){ctx.beginPath();ctx.moveTo(W*t,25);ctx.lineTo(W*t,390);ctx.stroke();}
   // Fine inspection hatches and panel fasteners, subdued to avoid obscuring the livery.
   ctx.strokeStyle='#6d7d8348';ctx.lineWidth=1;for(const t of [.20,.31,.43,.56,.72]){const x=W*t;ctx.beginPath();ctx.ellipse(x,365,12,5,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#7b898e55';ctx.fillRect(x-2,364,4,2);}
   ctx.fillStyle='#72818a55';for(const t of [.29,.46,.64,.76])for(let y=88;y<390;y+=19){ctx.beginPath();ctx.arc(W*t+3,y,.9,0,Math.PI*2);ctx.fill();}
   ctx.fillStyle='#6e7c85';ctx.font='20px Arial';text(profile.name.toUpperCase(),W*.76,284,W*.16);
  };side(true);ctx.save();ctx.translate(0,H);ctx.scale(1,-1);side(false);ctx.restore();
 });texture.anisotropy=8;return texture;});const map=colorLease.value;
 const roughLease=sharedTexture(`rough:${profileKey}`,()=>{const texture=canvasTexture(1024,256,ctx=>{ctx.fillStyle='#c0c0c0';ctx.fillRect(0,0,1024,256);ctx.fillStyle='#99999912';for(let x=6;x<1024;x+=27)ctx.fillRect(x,0,1,256);ctx.save();ctx.scale(.25,.25);const side=()=>{cockpitPanes(ctx,W,profile,true);passengerWindows(ctx,W,profile,true);};side();ctx.translate(0,H);ctx.scale(1,-1);side();ctx.restore();});texture.colorSpace=THREE.NoColorSpace;return texture;});
 const normalLease=sharedTexture(`normal:${profileKey}`,()=>{const texture=canvasTexture(1024,256,ctx=>{ctx.fillStyle='#8080ff';ctx.fillRect(0,0,1024,256);ctx.strokeStyle='#837dff';ctx.lineWidth=.6;for(const t of [noseFraction*.24,.29,.46,.64,.76]){ctx.beginPath();ctx.moveTo(t*1024,0);ctx.lineTo(t*1024,256);ctx.stroke();}});texture.colorSpace=THREE.NoColorSpace;return texture;});
 const roughnessMap=roughLease.value,normalMap=normalLease.value;
   const positions:number[]=[],uv:number[]=[],indices:number[]=[],rings=104,sides=48,noseRings=22;
 for(let j=0;j<=rings;j++){const t=j<=noseRings?noseFraction*(j/noseRings)**1.5:noseFraction+(1-noseFraction)*(j-noseRings)/(rings-noseRings),rr=fuselageRadius(t,r,noseFraction,nose.roundness),noseFactor=Math.max(0,1-t/noseFraction),tail=Math.max(0,(t-.73)/.27),center=-r*nose.drop*noseFactor*noseFactor+r*.36*tail*tail;for(let k=0;k<=sides;k++){const a=k/sides*Math.PI*2,sx=Math.sin(a),cy=Math.cos(a),shoulder=Math.exp(-Math.pow((Math.abs(cy)-.52)/.19,2))*.018,upperTaper=Math.max(0,cy)**2*.06,lowerTaper=Math.max(0,-cy)**2*.015,xProfile=design.doubleDeck?Math.sign(sx)*Math.pow(Math.abs(sx),.84)*(1-upperTaper-lowerTaper+shoulder):sx,yProfile=design.doubleDeck?Math.sign(cy)*Math.pow(Math.abs(cy),.86)*1.035:cy;positions.push(xProfile*rr,yProfile*rr*(1-noseFactor*.12)+center,(t-.5)*L);uv.push(t,1-k/sides);}}
 for(let j=0;j<rings;j++)for(let k=0;k<sides;k++){const a=j*(sides+1)+k,b=a+sides+1;indices.push(a,b,a+1,a+1,b,b+1);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
 // Weld seam normals analytically; central body is perfectly round, nose/tail smooth.
 const normal=geometry.getAttribute('normal');for(let j=0;j<=rings;j++){const a=j*(sides+1),b=a+sides;const n=new THREE.Vector3().fromBufferAttribute(normal,a).add(new THREE.Vector3().fromBufferAttribute(normal,b)).normalize();normal.setXYZ(a,n.x,n.y,n.z);normal.setXYZ(b,n.x,n.y,n.z);}
 const material=new THREE.MeshPhysicalMaterial({color:'#ffffff',map,roughnessMap,normalMap,normalScale:new THREE.Vector2(.10,.10),roughness:.48,metalness:.025,clearcoat:.45,clearcoatRoughness:.22,envMapIntensity:.7});material.userData.aircraftOwned=true;materialReleases.set(material,()=>{colorLease.release();roughLease.release();normalLease.release();});
 const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}

export function tailSkin(airline:Airline){
 const airlineKey=JSON.stringify([airline.id,airline.name,airline.localName,airline.color,airline.secondary,airline.tailText]);
 const lease=sharedTexture(`tail:${airlineKey}`,()=>liveryTexture(1024,1024,ctx=>paintTail(ctx,airline)));
 const material=new THREE.MeshStandardMaterial({map:lease.value,roughness:.36,metalness:.1});material.userData.aircraftOwned=true;materialReleases.set(material,lease.release);return material;
}
