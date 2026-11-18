import * as THREE from 'three';
import type {Gate} from '../data/airport';
import {box,canvasTexture,instances,material} from './primitives';
import {T2_FOURTH_FLOOR_PUBLIC_FEATURES as T2_PUBLIC} from './terminalInteriorLayout';

type Bounds={x:number;z:number;width:number;depth:number;height:number};
type Instance={x:number;y:number;z:number;sx:number;sy:number;sz:number;ry?:number;color?:THREE.ColorRepresentation};
const unitBox=new THREE.BoxGeometry(1,1,1);
const aluminium=material('#adb9bc',.34,.55),steel=material('#8f9da2',.38,.58),
 floorPlant=material('#52594a',.88),potMaterial=material('#77786d',.72,.08);

function batch(parent:THREE.Object3D,mat:THREE.Material,items:Instance[]){if(items.length)instances(parent,unitBox,mat,items).userData.staticFurnitureBatch=true;}

function addBeam(parent:THREE.Object3D,from:THREE.Vector3,to:THREE.Vector3,items:THREE.Matrix4[],radius=.075){
 const delta=new THREE.Vector3().subVectors(to,from),length=delta.length(),dummy=new THREE.Object3D();dummy.position.copy(from).add(to).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());dummy.scale.set(radius*2,length,radius*2);dummy.updateMatrix();items.push(dummy.matrix.clone());
}

function flushBeams(parent:THREE.Object3D,mat:THREE.Material,matrices:THREE.Matrix4[]){
 if(!matrices.length)return;const geometry=new THREE.CylinderGeometry(.5,.5,1,6,1,false),mesh=new THREE.InstancedMesh(geometry,mat,matrices.length);
 matrices.forEach((matrix,index)=>mesh.setMatrixAt(index,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=false;mesh.receiveShadow=false;parent.add(mesh);
}

function reliefShape(points:Array<[number,number]>,depth:number){
 const shape=new THREE.Shape();points.forEach(([x,y],index)=>index===0?shape.moveTo(x,y):shape.lineTo(x,y));shape.closePath();
 return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.08,bevelSize:.07,bevelSegments:2,curveSegments:7});
}

function addRelief(parent:THREE.Object3D,points:Array<[number,number]>,x:number,y:number,z:number,depth:number,color:THREE.ColorRepresentation,roughness=.72){
 const mesh=new THREE.Mesh(reliefShape(points,depth),material(color,roughness,.035));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

/** Airport-documented T1 arrival-hall relief art: island and mountain forms arranged by four seasons. */
export function decorateT1ArrivalArt(parent:THREE.Object3D,b:Bounds,floorY:number){
 const wallX=b.x,wallZ=b.z-b.depth*.41,width=Math.min(44,b.width*.27),height=4.5,wallY=floorY+2.38;
 const wallMat=material('#f0eee6',.86,.015),frameMat=material('#aaa99f',.48,.16),
  snowColor='#e4e4d8',deepColor='#177c8e';
 box(parent,width+1.2,height+.72,.36,wallX,wallY,wallZ,wallMat);
 box(parent,width+1.55,.15,.52,wallX,wallY+height/2+.43,wallZ,frameMat);
 box(parent,width+1.55,.15,.52,wallX,wallY-height/2-.43,wallZ,frameMat);
 const panelW=width/4-1.25,baseY=wallY-.54,baseZ=wallZ+.22;
 const seasons=[
  {color:'#6f8b68',peak:'#8a9c75',snow:false},
  {color:'#668675',peak:'#718d79',snow:false},
  {color:'#b27d4e',peak:'#c39259',snow:false},
  {color:'#899598',peak:'#949f9f',snow:true}
 ];
 for(let season=0;season<4;season++){
  const cx=wallX+(season-1.5)*(panelW+1.25),scale=panelW/8.3;
  box(parent,panelW+.32,height-.52,.12,cx,wallY,baseZ,material('#e8e6de',.82));
  const coast:[number,number][]=[[-4.05,-.75],[-3.52,-.46],[-2.56,-.58],[-1.65,-.35],[-.66,-.51],[.45,-.22],[1.5,-.38],[2.3,-.12],[3.22,-.35],[4.1,-.05],[3.54,-1.07],[1.82,-1.42],[-.12,-1.38],[-2.2,-1.29],[-3.7,-1.08]];
  addRelief(parent,coast.map(([x,y])=>[x*scale,y*scale]),cx,baseY,baseZ+.1,.42,deepColor,.44);
  const mountainX=[-2.9,-1.8,-.56,.72,1.94,2.92],mountainH=[1.35,2.2,1.64,2.3,1.72,1.28];
  for(let peak=0;peak<mountainX.length;peak++){
   const px=cx+mountainX[peak]*scale,py=baseY+(.15+(peak%2)*.12)*scale,half=(.55+(peak%3)*.14)*scale,h=mountainH[peak]*scale;
   addRelief(parent,[[-half,0],[-half*.38,h*.68],[0,h],[half*.42,h*.62],[half,0]],px,py,baseZ+.63,.33,seasons[season].color);
   if(seasons[season].snow&&peak%2===0)addRelief(parent,[[-half*.35,h*.62],[0,h],[half*.38,h*.57],[half*.1,h*.39],[-half*.08,h*.47]],px,py,baseZ+1.01,.12,snowColor,.84);
   if(!seasons[season].snow&&peak%2===1)addRelief(parent,[[-half*.24,h*.45],[0,h],[half*.28,h*.48],[half*.1,h*.4],[-half*.12,h*.39]],px,py,baseZ+1.0,.1,seasons[season].peak,.8);
  }
  for(let wave=0;wave<3;wave++){
   const z=baseZ+1.42+wave*.1,y=baseY-.83*scale-wave*.12;
   const line=new THREE.Mesh(new THREE.TorusGeometry(1.1*scale,.035*scale,5,28,Math.PI*1.46),material(wave===1?'#6ec5c6':'#7bc6c4',.4,.06));
   line.position.set(cx+(wave-1)*.4*scale,y,z);line.rotation.x=Math.PI/2;line.rotation.z=.04*(wave-1);line.castShadow=false;parent.add(line);
  }
  box(parent,panelW*.72,.035,.08,cx,wallY-height/2+.28,wallZ+.82,material(season===2?'#b98653':'#9a9d94',.64));
 }
 const titleTexture=canvasTexture(1024,128,ctx=>{ctx.clearRect(0,0,1024,128);ctx.fillStyle='#343b39';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 47px Arial,sans-serif';ctx.fillText('THE ISLAND  ·  FOUR SEASONS  ·  四季島嶼',512,65,960);ctx.fillStyle='#84988a';ctx.fillRect(32,112,960,4);});
 const title=new THREE.Mesh(new THREE.PlaneGeometry(width*.72,.75),new THREE.MeshBasicMaterial({map:titleTexture,transparent:true,toneMapped:false,side:THREE.DoubleSide}));title.position.set(wallX,wallY+height/2+.12,wallZ+.48);title.castShadow=false;parent.add(title);
 const spots:Instance[]=[];for(let i=0;i<6;i++)spots.push({x:wallX+(i-2.5)*6.1,y:floorY+4.42,z:wallZ+1.9,sx:.46,sy:.13,sz:.56,color:'#f5ebcf'});batch(parent,material('#f1e8cf',.34,.16),spots);
}

/** Distinctive public art and tropical atrium details documented inside Terminal 2. */
export function decorateTerminal2(parent:THREE.Object3D,b:Bounds){
 // The terminal roof already supplies the steel space-frame and glazing;
 // a second overlapping lattice made the public hall read as a dense cage.
 // Ray King's SolarSonic hangs in T2's 3F raised gallery. The airport describes
 // a sleek aircraft form, a curved glass frame, fine web cables and circular
 // jade-inspired lenses; keep the sculpture light enough to read as suspended.
 // The raised gallery is on the 3F departure level. Keep the suspended work
 // inside that atrium opening instead of floating up at the 5F deck height.
 const solarY=15.35,solarZ=b.z-62,lensRadius=2.18,solarFrame=material('#c4cabe',.28,.38),lensMat=new THREE.MeshPhysicalMaterial({color:'#e8f4ef',roughness:.18,metalness:.025,transparent:true,opacity:.31,depthWrite:false,side:THREE.DoubleSide,emissive:'#506e70',emissiveIntensity:.025});
 const solarTexture=canvasTexture(512,512,ctx=>{
  ctx.clearRect(0,0,512,512);const colors=['#b4e9dc','#b8e3f0','#cbd4f0','#e4c8e8','#f0d4aa','#d4ead2'];
  for(let i=0;i<12;i++){const a=i*Math.PI*2/12-.035,end=(i+1)*Math.PI*2/12+.035,g=ctx.createRadialGradient(256,256,30,256,256,254);g.addColorStop(0,'rgba(250,255,243,.42)');g.addColorStop(.32,colors[i%colors.length]+'78');g.addColorStop(.82,colors[(i+2)%colors.length]+'45');g.addColorStop(1,colors[(i+3)%colors.length]+'28');ctx.beginPath();ctx.moveTo(256,256);ctx.arc(256,256,254,a,end);ctx.closePath();ctx.fillStyle=g;ctx.fill();}
  ctx.strokeStyle='rgba(255,255,246,.26)';ctx.lineWidth=1.1;for(let i=0;i<12;i++){const a=i*Math.PI*2/12;ctx.beginPath();ctx.moveTo(256,256);ctx.lineTo(256+Math.cos(a)*246,256+Math.sin(a)*246);ctx.stroke();}
 });
 const solarMaterial=new THREE.MeshBasicMaterial({map:solarTexture,color:'#ffffff',transparent:true,opacity:.66,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),solarDisc=new THREE.CircleGeometry(lensRadius,64),solarRim=new THREE.TorusGeometry(lensRadius,.045,8,72),lensDisc=new THREE.CircleGeometry(.76,48),lensRim=new THREE.TorusGeometry(.8,.04,8,56),wire:THREE.Matrix4[]=[],hangers:THREE.Matrix4[]=[],goldRim=material('#c8bd9c',.3,.28);
 // A sloped, overlapping chain of translucent lenses follows the roof gallery;
 // fine radial stays and small jade centers replace the oversized fan-like rings.
 for(let i=0;i<7;i++){
  const t=i-3,x=b.x-30+t*6.4,y=solarY+t*.34,z=solarZ+t*1.5,rotation=new THREE.Euler(.28+(i%2)*.05,(i%2===0?-.16:.16),t*.035),matrix=new THREE.Matrix4().makeRotationFromEuler(rotation),center=new THREE.Vector3(x,y,z);
  const disc=new THREE.Mesh(solarDisc,solarMaterial);disc.position.copy(center);disc.rotation.copy(rotation);disc.scale.set(1,.78,1);disc.castShadow=false;parent.add(disc);
  const rim=new THREE.Mesh(solarRim,solarFrame);rim.position.copy(center).add(new THREE.Vector3(0,0,.04));rim.rotation.copy(rotation);rim.scale.set(1,.78,1);rim.castShadow=false;parent.add(rim);
  const lens=new THREE.Mesh(lensDisc,lensMat);lens.position.copy(center).add(new THREE.Vector3(0,0,.085));lens.rotation.copy(rotation);parent.add(lens);
  const lensEdge=new THREE.Mesh(lensRim,goldRim);lensEdge.position.copy(center).add(new THREE.Vector3(0,0,.115));lensEdge.rotation.copy(rotation);parent.add(lensEdge);
  for(let spoke=0;spoke<8;spoke++){const angle=spoke*Math.PI*2/8,edge=new THREE.Vector3(lensRadius*.92*Math.cos(angle),lensRadius*.92*Math.sin(angle),.12).applyMatrix4(matrix).add(center);addBeam(parent,center.clone().add(new THREE.Vector3(0,0,.12).applyMatrix4(matrix)),edge,wire,.007);}
  for(const dx of [-.92,.92]){const anchor=center.clone().add(new THREE.Vector3(dx,lensRadius*.68,0).applyMatrix4(matrix));addBeam(parent,anchor,new THREE.Vector3(anchor.x,b.height-5.5,anchor.z),hangers,.012);}
 }
 // The curved aircraft-like backbone links the glass lenses without a heavy beam.
 const solarSpine=new THREE.CatmullRomCurve3(Array.from({length:15},(_,i)=>{const t=i/14;return new THREE.Vector3(b.x-52+t*44,solarY-1+Math.sin(t*Math.PI)*.8,solarZ-2+t*3);}));
 const spine=new THREE.Mesh(new THREE.TubeGeometry(solarSpine,56,.05,7,false),solarFrame);spine.castShadow=false;parent.add(spine);
 flushBeams(parent,steel,wire);flushBeams(parent,aluminium,hangers);

 // The check-in reference shows broad round suspended fixtures under the
 // space frame. Build them as open concentric rings with discrete diffusers;
 // a filled six-lobed plate read as a flower and produced star-shaped floor
 // reflections that are absent from the photographed hall.
 const fixtureCount=12,luminaire=new THREE.MeshBasicMaterial({color:'#fff9e7',toneMapped:false,side:THREE.DoubleSide}),pendantOuter=new THREE.TorusGeometry(3.35,.065,8,72),pendantInner=new THREE.TorusGeometry(2.55,.045,8,64),pendantCenter=new THREE.CircleGeometry(1.18,48),pendantRingMat=material('#c4c7bd',.42,.5),pendantDiffuserMat=new THREE.MeshBasicMaterial({color:'#fff4cf',transparent:true,opacity:.72,toneMapped:false,side:THREE.DoubleSide}),
  housingMesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.28,.28,.2,24),luminaire,fixtureCount),outerMesh=new THREE.InstancedMesh(pendantOuter,pendantRingMat,fixtureCount),innerMesh=new THREE.InstancedMesh(pendantInner,pendantRingMat,fixtureCount),centerMesh=new THREE.InstancedMesh(pendantCenter,pendantDiffuserMat,fixtureCount),barMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),pendantDiffuserMat,fixtureCount*12),cableMesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.018,.018,1,6),steel,fixtureCount*4),fixtureDummy=new THREE.Object3D();
 let barIndex=0,cableIndex=0;
 const mark=(mesh:THREE.InstancedMesh,index:number,x:number,y:number,z:number,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0)=>{fixtureDummy.position.set(x,y,z);fixtureDummy.rotation.set(rx,ry,rz);fixtureDummy.scale.set(sx,sy,sz);fixtureDummy.updateMatrix();mesh.setMatrixAt(index,fixtureDummy.matrix);};
 for(let row=0;row<4;row++)for(let col=0;col<3;col++){
  const x=b.x-34+(col-1)*17,z=b.z-75+row*50,y=b.height-7,ceilingY=b.height-.32,cableLength=ceilingY-y-.18,index=row*3+col;
  mark(housingMesh,index,x,y+.06,z);mark(outerMesh,index,x,y-.02,z,1,1,1,-Math.PI/2);mark(innerMesh,index,x,y-.02,z,1,1,1,-Math.PI/2);mark(centerMesh,index,x,y-.005,z,1,1,1,-Math.PI/2);
  for(let lamp=0;lamp<12;lamp++){const angle=lamp*Math.PI/6;mark(barMesh,barIndex++,x+Math.cos(angle)*2.96,y-.012,z+Math.sin(angle)*2.96,1.02,.045,.13,0,angle+Math.PI/2);}
  for(const dx of [-1,1])for(const dz of [-1,1])mark(cableMesh,cableIndex++,x+dx*2.15,(ceilingY+y)/2,z+dz*2.15,1,cableLength,1);
 }
 for(const mesh of [housingMesh,outerMesh,innerMesh,centerMesh,barMesh,cableMesh]){mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=false;mesh.receiveShadow=false;parent.add(mesh);}

 // Circulation is supplied by the shared floor/core layout. The former
 // free-standing spiral stair had neither a verified location nor a slab
 // opening and protruded through the narrower enclosed building.
 // Tropical palms and the island-globe water feature anchor the 4F waiting space.
 for(const point of T2_PUBLIC.palms){
  const x=b.x+point.dx,z=b.z+point.dz,floor=18.55;
  const pot=new THREE.Mesh(new THREE.CylinderGeometry(1.18,1.42,.76,20),potMaterial);pot.position.set(x,floor+.38,z);parent.add(pot);
  const soil=new THREE.Mesh(new THREE.CylinderGeometry(1.08,1.08,.08,20),floorPlant);soil.position.set(x,floor+.79,z);parent.add(soil);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.35,3.2,12),material('#70543b',.88));trunk.position.set(x,floor+2.39,z);trunk.castShadow=true;parent.add(trunk);
  for(let leaf=0;leaf<9;leaf++){
   const angle=leaf*Math.PI*2/9,reach=2.55,tip=new THREE.Vector3(x+Math.cos(angle)*reach,floor+3.62,z+Math.sin(angle)*reach),mid=new THREE.Vector3(x+Math.cos(angle)*1.15,floor+4.35,z+Math.sin(angle)*1.15);
   const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x,floor+3.8,z),mid,tip]);const frond=new THREE.Mesh(new THREE.TubeGeometry(curve,12,.075,5,false),material(leaf%3?'#4b7357':'#64815b',.9));frond.castShadow=false;parent.add(frond);
  }
 }
 const fountainFloor=18.62,sphere=new THREE.Mesh(new THREE.SphereGeometry(1.75,28,20),new THREE.MeshStandardMaterial({color:'#8f9b8f',roughness:.24,metalness:.32,emissive:'#1c2724',emissiveIntensity:.08}));sphere.position.set(b.x+T2_PUBLIC.fountain.dx,fountainFloor+2.25,b.z+T2_PUBLIC.fountain.dz);sphere.castShadow=true;parent.add(sphere);
 const basin=new THREE.Mesh(new THREE.TorusGeometry(3.1,.22,8,48),material('#668d94',.2,.35));basin.position.set(b.x+T2_PUBLIC.fountain.dx,fountainFloor+.56,b.z+T2_PUBLIC.fountain.dz);basin.rotation.x=Math.PI/2;parent.add(basin);
 const water=new THREE.Mesh(new THREE.CircleGeometry(2.83,48),new THREE.MeshPhysicalMaterial({color:'#75aeb5',roughness:.13,metalness:.14,transparent:true,opacity:.58,depthWrite:false}));water.rotation.x=-Math.PI/2;water.position.set(b.x+T2_PUBLIC.fountain.dx,fountainFloor+.57,b.z+T2_PUBLIC.fountain.dz);parent.add(water);

 // The obsolete 1F proxy sculptures/ribbons overlapped the reclaim belts.
 // Dedicated arrival art is retained by terminalInteriors at the public hall.

}

/** RSHP north-concourse ribs and gate-zone color wayfinding, sized to the built 738 m hall. */
export function decorateT3North(parent:THREE.Object3D,b:Bounds,gates:Gate[],gateSide:-1|1){
 const ribs:THREE.Matrix4[]=[],accent=[material('#d6a640',.38,.18),material('#df7545',.4,.16),material('#7d4d59',.42,.14)];
 const span=b.width/Math.max(1,gates.length);
 for(let x=b.x-b.width/2+8;x<=b.x+b.width/2-8;x+=16){
  const y=b.height-1.15,z1=b.z-b.depth*.46,z2=b.z+b.depth*.46;
  addBeam(parent,new THREE.Vector3(x,y-.9,z1),new THREE.Vector3(x,y+.2,b.z),ribs,.075);
  addBeam(parent,new THREE.Vector3(x,y+.2,b.z),new THREE.Vector3(x,y-.9,z2),ribs,.075);
  addBeam(parent,new THREE.Vector3(x,y-.9,z1),new THREE.Vector3(x,y-.9,z2),ribs,.052);
 }
 flushBeams(parent,aluminium,ribs);
 gates.forEach((gate,index)=>{
  const zone=Math.min(2,Math.floor(index/Math.max(1,gates.length/3))),color=accent[zone];
  box(parent,Math.min(18,span*.28),.22,b.depth*.74,gate.x,b.height-1.3,b.z,color);
  const totem=box(parent,.24,4.2,.24,gate.x+span*.32,2.25,b.z-gateSide*8,color);totem.castShadow=false;
 });
}
