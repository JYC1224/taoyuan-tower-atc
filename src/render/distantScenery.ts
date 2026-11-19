import * as THREE from 'three';
import {canvasTexture,instances,material,seeded} from './primitives';
import {isSea} from './coastline';
import {REGIONAL_DATUM,addTerrain,regionalGroundMaterial,terrainSurfaceHeight} from './terrain';
import {addRegionalFeatures,regionalSettlements} from './regionalScenery';
import {createRegionalLandcover,LOCAL_LANDCOVER_EXTENT} from './regionalLandcover';

/** Approximate coastal plain beyond the surveyed airport; purely visual and not navigation data. */
export function distantScenery(parent:THREE.Group){
 const rand=seeded(68412),size=2048,extent=320000;
 const texture=canvasTexture(size,size,ctx=>{
  ctx.fillStyle='#7c8978';ctx.fillRect(0,0,size,size);
  const fields=['#879477','#778b70','#92997e','#7b8c74','#9b9d82','#6f846d','#8c987e','#989e87','#788a70'];
  // One regional land-cover canvas replaces the old 12 km repeating agricultural tile.
  // At this scale plots read as mixed coastal-plain land use rather than a checkerboard.
  for(let by=0;by<size;by+=26+rand()*25)for(let bx=0;bx<size;bx+=24+rand()*28){
   const w=Math.min(size-bx,10+rand()*34),h=Math.min(size-by,8+rand()*25);
   ctx.save();ctx.translate(bx+w*.5,by+h*.5);ctx.rotate((rand()-.5)*.4);ctx.fillStyle=fields[Math.floor(rand()*fields.length)];ctx.fillRect(-w*.5,-h*.5,w*.94,h*.92);
   if(rand()<.2){ctx.fillStyle='rgba(57,75,63,.24)';ctx.fillRect(-w*.5+1,-h*.5+1,Math.max(1,w*.04),h*.82);}ctx.restore();
  }
  // Regional settlements use their mapped OSM centres, so the urban pattern follows
  // Dayuan, Luzhu, Taoyuan, Linkou and the other real towns instead of random patches.
  for(const place of regionalSettlements){
   const [wx,wz]=place.point;if(Math.abs(wx)>extent*.49||Math.abs(wz)>extent*.49)continue;
   const x=(wx/extent+.5)*size,y=(.5-wz/extent)*size,kind=place.kind||'suburb';
   const radius=(kind==='city'?4700:kind==='town'?2300:kind==='suburb'?950:0)/extent*size;if(!radius)continue;
   const haze=ctx.createRadialGradient(x,y,radius*.08,x,y,radius);haze.addColorStop(0,kind==='city'?'rgba(157,157,145,.92)':'rgba(151,153,141,.78)');haze.addColorStop(.72,'rgba(151,153,141,.4)');haze.addColorStop(1,'rgba(151,153,141,0)');ctx.fillStyle=haze;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
   const roofs=kind==='city'?260:kind==='town'?105:28;
   for(let i=0;i<roofs;i++){const angle=rand()*Math.PI*2,distance=Math.sqrt(rand())*radius*.82,px=x+Math.cos(angle)*distance,py=y+Math.sin(angle)*distance;ctx.fillStyle=rand()<.4?'#a5a69b':rand()<.5?'#b7b5a9':'#848e89';ctx.fillRect(px,py,.6+rand()*1.5,.45+rand()*1.2);}
   ctx.strokeStyle='rgba(104,112,105,.7)';ctx.lineWidth=kind==='city'?1.2:.7;ctx.beginPath();ctx.moveTo(x-radius,y+radius*.12);ctx.bezierCurveTo(x-radius*.3,y-radius*.28,x+radius*.3,y+radius*.34,x+radius,y-radius*.16);ctx.stroke();
  }
  // A restrained, non-periodic arterial texture; detailed mapped roads are overlaid as geometry.
  ctx.strokeStyle='rgba(103,112,106,.68)';ctx.lineWidth=2.2;for(let i=0;i<15;i++){const y=rand()*size;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(size*.32,y+(rand()-.5)*size*.18,size*.68,y+(rand()-.5)*size*.18,size,y+(rand()-.5)*size*.12);ctx.stroke();}
 });
 texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;texture.repeat.set(1,1);texture.anisotropy=8;
 const localLandcover=createRegionalLandcover(),groundMaterial=regionalGroundMaterial(texture,localLandcover,LOCAL_LANDCOVER_EXTENT);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(extent,extent),groundMaterial);
 ground.rotation.x=-Math.PI/2;ground.position.y=REGIONAL_DATUM;ground.receiveShadow=false;parent.add(ground);
 addTerrain(parent,groundMaterial,extent);
 addRegionalFeatures(parent);

 const buildingMaterial=material('#ffffff',.95),roofMaterial=material('#ffffff',.9),roofPalette=['#b5b6aa','#87918d','#74858b','#a5a18f','#989e99'],wallPalette=['#a6aba3','#b5b5a8','#939e9b','#b8b8ac','#87938e'],lights:number[]=[];
 // Small independent batches can be culled outside the camera, unlike one world-sized instance set.
 for(let cx=-112000;cx<112000;cx+=8000)for(let cz=-3200;cz<20800;cz+=8000){
  const items:Parameters<typeof instances>[3]=[],roofs:Parameters<typeof instances>[3]=[];
  const roofDetail=Math.hypot(cx+4000,cz+4000)<16000;
  // Do not sprinkle the same random buildings uniformly across countryside.
  // Mapped settlement nodes below are the only source of regional building clusters.
  for(const place of regionalSettlements){
   const [centerX,centerZ]=place.point;if(centerX<cx||centerX>=cx+8000||centerZ<cz||centerZ>=cz+8000)continue;
   const count=place.kind==='city'?120:place.kind==='town'?75:34,radius=place.kind==='city'?1300:place.kind==='town'?900:520;
   for(let i=0;i<count;i++){
    const x=centerX+(rand()-.5)*radius*2,z=centerZ+(rand()-.5)*radius*2;
    if(Math.abs(x)<6700&&Math.abs(z)<6700||isSea(x,z))continue;
    const h=7+rand()*(place.kind==='city'?40:24),w=16+rand()*38,d=16+rand()*36,rotation=rand()<.5?0:Math.PI/2;
    const elevation=Math.max(0,terrainSurfaceHeight(x,z));items.push({x,y:elevation+h/2-.16,z,sx:w,sy:h,sz:d,ry:rotation,color:wallPalette[Math.floor(rand()*wallPalette.length)]});
    if(roofDetail)roofs.push({x,y:elevation+h+.08,z,sx:w+1.8,sy:.24,sz:d+1.8,ry:rotation,color:roofPalette[Math.floor(rand()*roofPalette.length)]});
    if(rand()<.8)lights.push(x,elevation+h+.25,z);
   }
  }
  if(items.length){const batch=instances(parent,new THREE.BoxGeometry(1,1,1),buildingMaterial,items);batch.receiveShadow=false;batch.castShadow=false;if(roofs.length){const roofBatch=instances(parent,new THREE.BoxGeometry(1,1,1),roofMaterial,roofs);roofBatch.receiveShadow=false;roofBatch.castShadow=false;}}
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(lights,3));
 const nightLights=new THREE.PointsMaterial({color:'#ffdc9c',size:1.6,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false,toneMapped:false});
 const lightsMesh=new THREE.Points(geometry,nightLights);
 parent.add(lightsMesh);
 return lightsMesh;
}
