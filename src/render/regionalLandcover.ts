import * as THREE from 'three';
import data from '../data/regionalOSM.json';
import {canvasTexture,seeded} from './primitives';

export const LOCAL_LANDCOVER_EXTENT=48000;

/** A local 10–12 m/pixel land-use atlas driven by the airport region's OSM roads and settlements. */
export function createRegionalLandcover(){
 const size=4096,extent=LOCAL_LANDCOVER_EXTENT,scale=size/extent,random=seeded(8172026);
 const places=data.settlements.filter(place=>Math.abs(place.point[0])<extent*.49&&Math.abs(place.point[1])<extent*.49&&['city','town','suburb'].includes(place.kind||''));
 const texture=canvasTexture(size,size,ctx=>{
  ctx.fillStyle='#737d69';ctx.fillRect(0,0,size,size);
  // Fine, low-contrast soil and canopy variation prevents large agricultural surfaces reading as flat paint.
  const noise=document.createElement('canvas');noise.width=noise.height=1024;const noiseContext=noise.getContext('2d')!,pixels=noiseContext.createImageData(1024,1024);
  for(let i=0;i<pixels.data.length;i+=4){const n=88+random()*52;pixels.data[i]=n*1.02;pixels.data[i+1]=n*1.04;pixels.data[i+2]=n*.94;pixels.data[i+3]=255;}
  noiseContext.putImageData(pixels,0,0);ctx.globalAlpha=.30;ctx.drawImage(noise,0,0,size,size);ctx.globalAlpha=1;

  const fieldColors=['#778266','#85866c','#6b7a61','#8d8e75','#6f8168','#92917a','#788574','#9a977c','#66775e'];
  // Irregular, mixed crop parcels follow the local coastal-plain scale rather than the far-view checker texture.
  for(let i=0;i<11200;i++){
   const x=(random()-.5)*extent,z=(random()-.5)*extent;
   if(Math.abs(x)<6900&&Math.abs(z)<5200)continue;
   let settlementDistance=Infinity;for(const place of places){const dx=x-place.point[0],dz=z-place.point[1],distance=dx*dx+dz*dz;if(distance<settlementDistance)settlementDistance=distance;}
   if(settlementDistance<1_050_000&&random()<.91)continue;
   const px=(x/extent+.5)*size,py=(.5-z/extent)*size,w=(90+random()*360)*scale,h=(80+random()*280)*scale,angle=(random()-.5)*.28;
   ctx.save();ctx.translate(px,py);ctx.rotate(angle);ctx.fillStyle=fieldColors[Math.floor(random()*fieldColors.length)];ctx.beginPath();ctx.moveTo(-w*.48,-h*.42);ctx.quadraticCurveTo(-w*.12,-h*.55,w*.48,-h*.45);ctx.lineTo(w*.53,h*.26);ctx.quadraticCurveTo(w*.1,h*.55,-w*.46,h*.38);ctx.closePath();ctx.fill();
   if(random()<.26){ctx.strokeStyle='rgba(48,67,48,.19)';ctx.lineWidth=.55;const rows=3+Math.floor(random()*5);for(let row=0;row<rows;row++){const y=-h*.34+h*.68*row/Math.max(1,rows-1);ctx.beginPath();ctx.moveTo(-w*.42,y);ctx.quadraticCurveTo(0,y+(random()-.5)*1.5,w*.43,y);ctx.stroke();}}
   ctx.restore();
  }

  // Settlements retain their mapped centres; tiny roof marks give them continuous urban grain between 3D landmarks.
  const roofs=['#777e7b','#888579','#9a9687','#697b7e','#aaa18d','#79877e'];
  for(const place of places){
   const [x,z]=place.point,kind=place.kind||'suburb',radius=kind==='city'?2600:kind==='town'?1450:700,px=(x/extent+.5)*size,py=(.5-z/extent)*size,r=radius*scale;
   const gradient=ctx.createRadialGradient(px,py,r*.12,px,py,r);gradient.addColorStop(0,kind==='city'?'rgba(137,139,130,.88)':'rgba(139,140,130,.72)');gradient.addColorStop(.68,'rgba(135,139,129,.54)');gradient.addColorStop(1,'rgba(135,139,129,0)');ctx.fillStyle=gradient;ctx.fillRect(px-r,py-r,2*r,2*r);
   const buildings=kind==='city'?1550:kind==='town'?520:150;
   for(let i=0;i<buildings;i++){
    const a=random()*Math.PI*2,d=Math.sqrt(random())*r*.88,bx=px+Math.cos(a)*d,by=py+Math.sin(a)*d,w=.7+random()*(kind==='city'?2.5:1.65),h=.65+random()*(kind==='city'?2.2:1.5);
    ctx.fillStyle=roofs[Math.floor(random()*roofs.length)];ctx.fillRect(bx,by,w,h);
    if(random()<.09){ctx.fillStyle='rgba(183,181,163,.55)';ctx.fillRect(bx+w*.25,by+h*.28,w*.45,h*.2);}
   }
  }

  // Irrigation ponds and wet plots are characteristic of Taoyuan's plain; keep them out of settlement cores.
  for(let i=0;i<270;i++){
   const x=(random()-.5)*extent*.88,z=(random()-.5)*extent*.88;
   if(Math.abs(x)<6900&&Math.abs(z)<5200)continue;
   let nearTown=false;for(const place of places){const dx=x-place.point[0],dz=z-place.point[1],r=place.kind==='city'?3100:place.kind==='town'?1800:850;if(dx*dx+dz*dz<r*r){nearTown=true;break;}}
   if(nearTown)continue;
   const px=(x/extent+.5)*size,py=(.5-z/extent)*size,rx=(35+random()*180)*scale,ry=(26+random()*135)*scale;ctx.save();ctx.translate(px,py);ctx.rotate((random()-.5)*.7);ctx.fillStyle='#59736d';ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(170,173,145,.38)';ctx.lineWidth=.65;ctx.stroke();ctx.restore();
  }

  // Put mapped rivers and road classes into the landcover as well as their existing world-space geometry.
  const drawWays=(kind:'river'|'motorway'|'trunk'|'primary')=>{
   const matching=data.ways.filter(way=>way.kind===kind);
   for(const way of matching){const points=way.points;if(points.length<2)continue;let intersects=false;for(const [x,z]of points)if(Math.abs(x)<extent*.52&&Math.abs(z)<extent*.52){intersects=true;break;}if(!intersects)continue;
    const width=kind==='river'?22:kind==='motorway'?32:kind==='trunk'?24:15,pxPerMetre=scale;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach(([x,z],index)=>{const px=(x/extent+.5)*size,py=(.5-z/extent)*size;if(index===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});
    if(kind==='river'){ctx.strokeStyle='#657c72';ctx.lineWidth=(width+8)*pxPerMetre;ctx.stroke();ctx.strokeStyle='#78918a';ctx.lineWidth=width*pxPerMetre;ctx.stroke();}
    else {ctx.strokeStyle=kind==='motorway'?'#5d6662':'#7c8178';ctx.lineWidth=(width+8)*pxPerMetre;ctx.stroke();ctx.strokeStyle=kind==='motorway'?'#96988f':'#a3a195';ctx.lineWidth=width*pxPerMetre;ctx.stroke();}
   }
  };
  drawWays('river');drawWays('motorway');drawWays('trunk');drawWays('primary');

  // Gentle local color falloff avoids a hard atlas edge where the regional map takes over.
  const vignette=ctx.createRadialGradient(size/2,size/2,size*.34,size/2,size/2,size*.51);vignette.addColorStop(0,'rgba(255,255,255,0)');vignette.addColorStop(1,'rgba(154,164,143,.28)');ctx.fillStyle=vignette;ctx.fillRect(0,0,size,size);
 });
 texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;texture.anisotropy=16;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;
 return texture;
}
