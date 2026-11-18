import * as THREE from 'three';
import type {Gate} from '../data/airport';
import {box,canvasTexture,instances,material,seeded} from './primitives';
import {hallAreaLight} from './terminalPublicHalls';
import {applyFacadeUV} from './surfaceDetail';
import {T1_A_PASSENGER as L,T1_A_WAITING_ROOMS,t1DepartureLinkWalls,t1LoungeColumns,t1LoungeCore,t1LoungeSeatBanks,t1LoungeStairs,type T1WaitingRoom} from './terminalPassengerLayout';
import {terminalSeatGeometry} from './terminalSeating';

type Item=Parameters<typeof instances>[3][number];
type ShellMaterials={glass:THREE.Material;cladding:THREE.Material;metal:THREE.Material;roof?:THREE.Material};
const cube=new THREE.BoxGeometry(1,1,1),roundColumn=new THREE.CylinderGeometry(1,1,1,20),
 warmWhite=new THREE.MeshStandardMaterial({color:'#eae8df',roughness:.77,emissive:'#b7b4a8',emissiveIntensity:.18}),
 ceilingWhite=new THREE.MeshStandardMaterial({color:'#e5e5da',roughness:.84,emissive:'#c6c4b4',emissiveIntensity:.27,side:THREE.DoubleSide}),
 satinMetal=material('#acb1b0',.46,.47),darkMetal=material('#343c3d',.44,.57),
 lightPanel=new THREE.MeshBasicMaterial({color:'#fff9dc',toneMapped:false}),
 blueCove=new THREE.MeshBasicMaterial({color:'#9bb9e0',toneMapped:false}),
 blackSeat=material('#22272a',.57,.025);

function batch(parent:THREE.Object3D,mat:THREE.Material,items:Item[],geometry:THREE.BufferGeometry=cube){
 if(!items.length)return;
 const mesh=instances(parent,geometry,mat,items);mesh.userData.staticFurnitureBatch=true;return mesh;
}

let stone:THREE.MeshStandardMaterial|undefined,blueFloor:THREE.MeshStandardMaterial|undefined,wood:THREE.MeshStandardMaterial|undefined;
function finishes(){
 if(!stone){
  const random=seeded(70118),map=canvasTexture(512,512,ctx=>{
   ctx.fillStyle='#737975';ctx.fillRect(0,0,512,512);
   for(let i=0;i<14000;i++){const v=70+random()*110;ctx.fillStyle=`rgba(${v},${v+2},${v+1},${.035+random()*.08})`;ctx.fillRect(random()*512,random()*512,1+random()*2,1+random()*2);}
   ctx.strokeStyle='rgba(42,49,48,.3)';ctx.lineWidth=1.2;ctx.strokeRect(.6,.6,510.8,510.8);
  });map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(1/1.2,1/1.2);
  stone=new THREE.MeshStandardMaterial({color:'#b1b7b0',map,roughness:.34,metalness:.025,bumpMap:map,bumpScale:.003});
  const blue=canvasTexture(512,512,ctx=>{
   ctx.fillStyle='#31778c';ctx.fillRect(0,0,512,512);
   for(let i=0;i<20000;i++){ctx.fillStyle=i%3?'rgba(26,63,71,.045)':'rgba(215,226,218,.13)';ctx.fillRect(random()*512,random()*512,.5+random()*1.6,.5+random()*1.6);}
  });blue.wrapS=blue.wrapT=THREE.RepeatWrapping;blue.repeat.set(1/2,1/2);
  blueFloor=new THREE.MeshStandardMaterial({color:'#e5edef',map:blue,roughness:.61,bumpMap:blue,bumpScale:.002,metalness:.005});
  const timber=canvasTexture(256,512,ctx=>{
   ctx.fillStyle='#956d42';ctx.fillRect(0,0,256,512);
   for(let i=0;i<500;i++){const x=random()*256;ctx.strokeStyle=i%4?'rgba(51,27,13,.13)':'rgba(227,195,144,.18)';ctx.lineWidth=.3+random();ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x-3,180,x+4,330,x+1,512);ctx.stroke();}
   for(let x=0;x<=256;x+=64){ctx.fillStyle='rgba(39,25,15,.36)';ctx.fillRect(x,0,1.2,512);}
  });timber.wrapS=timber.wrapT=THREE.RepeatWrapping;timber.repeat.set(1/4,1/3.5);
  wood=new THREE.MeshStandardMaterial({color:'#fff1da',map:timber,bumpMap:timber,bumpScale:.009,roughness:.56,metalness:.015});
 }
 return {stone:stone!,blueFloor:blueFloor!,wood:wood!};
}

/** UVs are measured in metres, so the floor/wood grain never stretches per room. */
function surface(parent:THREE.Object3D,width:number,depth:number,x:number,y:number,z:number,mat:THREE.Material){
 const geometry=new THREE.PlaneGeometry(width,depth),uv=geometry.getAttribute('uv');
 for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*width,uv.getY(i)*depth);
 const mesh=new THREE.Mesh(geometry,mat);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

function sign(parent:THREE.Object3D,text:string,x:number,y:number,z:number,width:number,rotation=0){
 const map=canvasTexture(1024,192,ctx=>{
  ctx.fillStyle='#163e64';ctx.fillRect(0,0,1024,192);ctx.fillStyle='#f2f4ed';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='500 76px Arial,"Microsoft JhengHei",sans-serif';ctx.fillText(text,512,98,980);
 });
 const face=new THREE.Mesh(new THREE.PlaneGeometry(width,.7),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}));
 face.position.set(x,y,z);face.rotation.y=rotation;face.userData.staticTerminalSign=true;parent.add(face);
}

const chair=terminalSeatGeometry();
let contactShadow:THREE.MeshBasicMaterial|undefined;
const contactPlane=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
function seatContactMaterial(){
 if(contactShadow)return contactShadow;
 const map=canvasTexture(128,64,ctx=>{
  ctx.translate(64,32);ctx.scale(1,.47);const gradient=ctx.createRadialGradient(0,0,8,0,0,61);gradient.addColorStop(0,'rgba(0,0,0,.25)');gradient.addColorStop(.55,'rgba(0,0,0,.14)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(-64,-69,128,138);
 });
 contactShadow=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});return contactShadow;
}

function linkedSeats(parent:THREE.Object3D,room:T1WaitingRoom){
 const shells:Item[]=[],metal:Item[]=[],armrests:Item[]=[],contacts:Item[]=[];
 for(const bank of t1LoungeSeatBanks(room)){
  for(let i=0;i<bank.seats;i++){
   const x=bank.x+(i-(bank.seats-1)/2)*bank.pitch;
   shells.push({x,y:L.loungeFloor,z:bank.z});
   armrests.push({x:x-bank.pitch/2,y:L.loungeFloor+.72,z:bank.z+.015,sx:.045,sy:.055,sz:.48});
   metal.push({x:x-bank.pitch/2,y:L.loungeFloor+.58,z:bank.z-.16,sx:.035,sy:.29,sz:.035});
  }
  armrests.push({x:bank.x+bank.width/2+.05,y:L.loungeFloor+.72,z:bank.z,sx:.045,sy:.055,sz:.48});
  metal.push({x:bank.x,y:L.loungeFloor+.4,z:bank.z-.07,sx:bank.width,sy:.075,sz:.08});
  for(const dx of [-bank.width*.37,bank.width*.37]){
   metal.push({x:bank.x+dx,y:L.loungeFloor+.23,z:bank.z-.07,sx:.06,sy:.35,sz:.065});
   metal.push({x:bank.x+dx,y:L.loungeFloor+.065,z:bank.z,sx:.43,sy:.06,sz:.56});
  }
  contacts.push({x:bank.x,y:L.loungeFloor+.03,z:bank.z-.07,sx:bank.width+1.0,sz:1.6});
 }
 batch(parent,blackSeat,shells,chair);batch(parent,satinMetal,metal);batch(parent,darkMetal,armrests);
 const shadow=instances(parent,contactPlane,seatContactMaterial(),contacts);shadow.receiveShadow=false;shadow.renderOrder=1;
}

function cofferGeometry(){
 // Sloping reveals surround a genuinely recessed square, rather than drawing
 // a dark square on a flat ceiling. Surface normals retain the white slopes.
 const positions:number[]=[],indices:number[]=[],outer=1.9,inner=1.47;
 const corners=[[-1,-1],[1,-1],[1,1],[-1,1]];
 for(let i=0;i<4;i++){
  const a=corners[i],b=corners[(i+1)%4],k=positions.length/3;
  positions.push(a[0]*outer,0,a[1]*outer,b[0]*outer,0,b[1]*outer,b[0]*inner,.34,b[1]*inner,a[0]*inner,.34,a[1]*inner);
  indices.push(k,k+1,k+2,k,k+2,k+3);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
const coffer=cofferGeometry();

function loungeCeiling(parent:THREE.Object3D,room:T1WaitingRoom){
 const beams:Item[]=[],recesses:Item[]=[],lights:Item[]=[],louvers:Item[]=[],panels:Item[]=[];
 const y=L.loungeCeiling;
 if(room.kind==='shared'){
  const columns=Math.floor((room.width-2)/2.4),rows=10;
  for(let i=0;i<columns;i++)for(let j=0;j<rows;j++){
   const x=room.x+(i-(columns-1)/2)*2.4,z=-200.8-j*2.4;
   panels.push({x,y,z,sx:2.36,sy:.09,sz:2.36});
   if(i%2===0&&j%2===0){lights.push({x,y:y-.075,z,sx:1.8,sy:.025,sz:.54});for(let k=-4;k<=4;k++)louvers.push({x:x+k*.19,y:y-.115,z,sx:.028,sy:.07,sz:.59});}
  }
  batch(parent,ceilingWhite,panels);
 }else{
  const module=2.4,columns=Math.floor((room.width-1)/module),rows=10;
  for(let i=0;i<columns;i++)for(let j=0;j<rows;j++){
   const x=room.x+(i-(columns-1)/2)*module,z=-200.7-j*module;
   recesses.push({x,y:y-.24,z,sx:.6,sy:.7,sz:.6});
   panels.push({x,y:y+.025,z,sx:1.78,sy:.06,sz:1.78});
   beams.push({x,y:y-.29,z:z-1.17,sx:module,sy:.15,sz:.1},{x:x-1.17,y:y-.29,z,sx:.1,sy:.15,sz:module});
   if((i+j)%2===0){lights.push({x,y:y-.015,z,sx:.66,sy:.025,sz:1.2});for(let k=-4;k<=4;k++)louvers.push({x,y:y-.065,z:z+k*.13,sx:.7,sy:.065,sz:.022});}
  }
  batch(parent,ceilingWhite,recesses,coffer);batch(parent,warmWhite,beams);batch(parent,ceilingWhite,panels);
 }
 batch(parent,lightPanel,lights);batch(parent,satinMetal,louvers);
}

let mountain:THREE.Material|undefined,blossom:THREE.Material|undefined;
function mountainFinish(){
 if(mountain)return mountain;
 const random=seeded(73214),map=canvasTexture(2048,512,ctx=>{
  const sky=ctx.createLinearGradient(0,0,0,512);sky.addColorStop(0,'#d9d4bf');sky.addColorStop(.58,'#bfc7bb');sky.addColorStop(1,'#dfe0cc');ctx.fillStyle=sky;ctx.fillRect(0,0,2048,512);
  // Original landscape study informed by the reference's large, muted
  // mountain colour field. This is not a scan of Li Zong-Ren's artwork.
  const shades=['#a5b3ae','#8c9c98','#6b807b','#586e67','#425b52'];
  for(let layer=0;layer<5;layer++){
   const points=Array.from({length:38},(_,i)=>({x:i/37*2048,y:132+layer*41+Math.sin(i*.8+layer)*34+random()*60-(i>12&&i<23?70:0)}));
   ctx.fillStyle=shades[layer];ctx.beginPath();ctx.moveTo(0,512);for(const p of points)ctx.lineTo(p.x,p.y);ctx.lineTo(2048,512);ctx.closePath();ctx.fill();
   for(let i=1;i<points.length;i++){
    const p=points[i];ctx.fillStyle=`rgba(210,209,173,${.08+random()*.13})`;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+44,Math.min(512,p.y+130));ctx.lineTo(p.x-21,p.y+70);ctx.closePath();ctx.fill();
   }
  }
  const mist=ctx.createLinearGradient(0,300,0,512);mist.addColorStop(0,'rgba(231,232,214,0)');mist.addColorStop(.65,'rgba(231,232,214,.58)');mist.addColorStop(1,'rgba(231,232,214,.78)');ctx.fillStyle=mist;ctx.fillRect(0,260,2048,252);
  for(let i=0;i<25000;i++){ctx.fillStyle=i%2?'rgba(245,237,211,.035)':'rgba(24,44,32,.035)';ctx.fillRect(random()*2048,random()*512,1+random()*2,1+random()*2);}
 });
 mountain=new THREE.MeshStandardMaterial({map,roughness:.52,emissive:'#8b8b75',emissiveMap:map,emissiveIntensity:.21});return mountain;
}

function blossomFinish(){
 if(blossom)return blossom;
 const random=seeded(1232014),map=canvasTexture(2048,768,ctx=>{
  ctx.fillStyle='#e6e4d9';ctx.fillRect(0,0,2048,768);
  // Authored relief-colour study: the source establishes the curved cream
  // service core and warm blossom canopy, not a reusable licensed art asset.
  const branches=[{x:360,lean:-.2},{x:930,lean:.25},{x:1530,lean:-.1}];
  for(const trunk of branches){
   ctx.strokeStyle='#59473b';ctx.lineCap='round';ctx.lineWidth=32;ctx.beginPath();ctx.moveTo(trunk.x,768);ctx.bezierCurveTo(trunk.x+35,550,trunk.x-25,420,trunk.x+trunk.lean*500,185);ctx.stroke();
   for(let i=0;i<10;i++){
    const y=300+i*32,x=trunk.x+trunk.lean*(768-y),side=i%2?-1:1,endX=x+side*(120+random()*180),endY=y-100-random()*150;
    ctx.lineWidth=7+i*.9;ctx.beginPath();ctx.moveTo(x,y+50);ctx.quadraticCurveTo(x+side*110,y-50,endX,endY);ctx.stroke();
    for(let f=0;f<32;f++){
     const fx=endX+(random()-.5)*160,fy=endY+(random()-.5)*120;
     ctx.fillStyle=['#b9674d','#d69365','#a75f51','#d5aa7a','#8c5652'][f%5];ctx.beginPath();ctx.arc(fx,fy,3+random()*6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ead1aa';ctx.fillRect(fx-1,fy-1,2,2);
    }
   }
  }
 });
 blossom=new THREE.MeshStandardMaterial({map,roughness:.79,bumpMap:map,bumpScale:.025,emissive:'#998d77',emissiveIntensity:.1,side:THREE.DoubleSide});return blossom;
}

function boardingWall(parent:THREE.Object3D,room:T1WaitingRoom){
 const f=finishes(),columns:Item[]=[],trims:Item[]=[],lights:Item[]=[],screens:Item[]=[];
 const bandWidth=room.width-10;
 const timberWall=box(parent,bandWidth,3.35,1.0,room.x,L.loungeFloor+1.675,-199.8,f.wood);applyFacadeUV(timberWall.geometry,1,1);
 for(let x=room.x-bandWidth/2+.7;x<room.x+bandWidth/2;x+=1.4)trims.push({x,y:L.loungeFloor+1.65,z:-200.31,sx:.023,sy:3.27,sz:.018});
 // Deep white fascia and round columns carry the upper passage, as in the
 // A7 oblique and official wide views. Keep a full room-height mural above.
 box(parent,bandWidth+1.2,.57,2.0,room.x,L.loungeFloor+3.6,-200.25,warmWhite);
 lights.push({x:room.x,y:L.loungeFloor+3.29,z:-201.13,sx:bandWidth-.5,sy:.035,sz:.12});
 for(const c of t1LoungeColumns(room))columns.push({x:c.x,y:L.loungeFloor+1.8,z:c.z,sx:c.radius,sy:3.6,sz:c.radius});
 batch(parent,warmWhite,columns,roundColumn);batch(parent,darkMetal,trims);batch(parent,lightPanel,lights);
 if(room.kind!=='shared'){
  const width=room.width-11,height=3.85,centerY=L.loungeFloor+6.35;
  box(parent,width+.5,height+.38,.3,room.x,centerY,-199.2,warmWhite);
  if(room.kind==='mountain'){
   const mural=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mountainFinish());mural.rotation.y=Math.PI;mural.position.set(room.x,centerY,-199.39);parent.add(mural);
  }else{
   // Unverified individual art/tenant fit-outs remain restrained. These bays
   // share the verified structural section, not a claimed exact theme replica.
   box(parent,width,height,.12,room.x,centerY,-199.39,material('#d9d8c8',.78));
  }
  const cove=box(parent,width,.08,.18,room.x,centerY+height/2+.08,-199.65,lightPanel);cove.castShadow=false;
 }
 const counterX=room.kind==='shared'?room.x+room.width*.31:room.x+10;
 const counter=box(parent,6.5,1.02,1.02,counterX,L.loungeFloor+.51,-202.0,f.wood);applyFacadeUV(counter.geometry,1,1);
 box(parent,6.65,.075,1.1,counterX,L.loungeFloor+1.05,-202.0,material('#555b57',.32,.045));
 for(const dx of [-1.8,1.8])screens.push({x:counterX+dx,y:L.loungeFloor+1.32,z:-201.94,sx:.53,sy:.36,sz:.07});
 batch(parent,darkMetal,screens);
 sign(parent,room.gateIds.join(' · '),counterX,L.loungeFloor+2.25,-200.38,4.3,Math.PI);
}

function sharedRoomCore(parent:THREE.Object3D,room:T1WaitingRoom){
 const core=t1LoungeCore(room),height=6.55;
 const shell=new THREE.Mesh(new THREE.CylinderGeometry(core.radius,core.radius,height,80,1,true,Math.PI/2,Math.PI),blossomFinish());
 shell.position.set(core.x,L.loungeFloor+height/2,core.z);shell.castShadow=true;shell.receiveShadow=true;parent.add(shell);
 const upperGlass=material('#5d6967',.33,.19),rails:Item[]=[],grilles:Item[]=[];
 const gallery=new THREE.Mesh(new THREE.CylinderGeometry(core.radius+.03,core.radius+.03,1.35,64,1,true,Math.PI/2,Math.PI),upperGlass);
 gallery.position.set(core.x,L.loungeFloor+height+.675,core.z);parent.add(gallery);
 for(let i=0;i<=24;i++){
  const angle=Math.PI/2+i*Math.PI/24;
  rails.push({x:core.x+Math.sin(angle)*(core.radius+.07),y:L.loungeFloor+height+.67,z:core.z+Math.cos(angle)*(core.radius+.07),sx:.06,sy:1.43,sz:.07});
 }
 // Entry and ventilation grilles occupy the lower service core, establishing
 // scale without filling the principal view with retail signs.
 for(const side of [-1,1]){
  const angle=Math.PI+side*.61,x=core.x+Math.sin(angle)*(core.radius+.05),z=core.z+Math.cos(angle)*(core.radius+.05),rotation=angle;
  box(parent,1.65,2.5,.12,x,L.loungeFloor+1.25,z,material('#676e69',.56,.16),rotation);
  for(let j=0;j<18;j++)grilles.push({x,y:L.loungeFloor+.3+j*.11,z:z-.08,sx:1.5,sy:.035,sz:.05,ry:rotation});
 }
 batch(parent,darkMetal,rails);batch(parent,darkMetal,grilles);
}

function stairs(parent:THREE.Object3D,room:T1WaitingRoom){
 const treads:Item[]=[],nosings:Item[]=[],posts:Item[]=[],steps=25;
 for(const stair of t1LoungeStairs(room)){
  const stepRun=stair.run/steps,rise=(stair.topY-stair.bottomY)/steps;
  for(let i=0;i<steps;i++){
   const z=stair.bottomZ+(i+.5)*stepRun,y=stair.bottomY+(i+1)*rise;
   treads.push({x:stair.x,y:y-.065,z,sx:stair.width,sy:.13,sz:stepRun+.01});
   nosings.push({x:stair.x,y:y+.006,z:z-stepRun/2+.035,sx:stair.width-.12,sy:.015,sz:.045});
  }
  for(const side of [-1,1]){
   for(let i=0;i<=steps;i+=3){const t=i/steps;posts.push({x:stair.x+side*(stair.width/2+.04),y:stair.bottomY+(stair.topY-stair.bottomY)*t+.53,z:stair.bottomZ+stair.run*t,sx:.045,sy:1.04,sz:.05});}
   const delta=stair.topY-stair.bottomY,rail=box(parent,.075,.075,Math.hypot(stair.run,delta),stair.x+side*(stair.width/2+.04),(stair.topY+stair.bottomY)/2+1.07,stair.z,satinMetal);
   rail.rotation.x=-Math.atan2(delta,stair.run);
  }
 }
 batch(parent,warmWhite,treads);batch(parent,darkMetal,nosings);batch(parent,satinMetal,posts);
}

function passageFeatureWall(parent:THREE.Object3D){
 // Several close/oblique references corroborate the cream calligraphy on
 // dark stone. These short, common words are newly typeset; the commissioned
 // handwritten artwork and complete poem are not copied or claimed exact.
 const phrases=['臺灣','旅途平安','出發'],positions=[465,457,449];
 for(let i=0;i<phrases.length;i++){
  const map=canvasTexture(1024,768,ctx=>{
   const random=seeded(8821+i);ctx.fillStyle='#202625';ctx.fillRect(0,0,1024,768);
   for(let j=0;j<10000;j++){const v=38+random()*42;ctx.fillStyle=`rgba(${v},${v+2},${v},.055)`;ctx.fillRect(random()*1024,random()*768,1+random()*2,1+random()*2);}
   ctx.strokeStyle='rgba(151,158,140,.09)';ctx.lineWidth=1.1;
   for(let j=0;j<11;j++){const y=random()*768;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(370,y-45,640,y+35,1024,y-20);ctx.stroke();}
   const words=phrases[i],columns=words.length===4?2:1;ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.font='300 268px "DFKai-SB","KaiTi","Noto Serif CJK TC",serif';ctx.fillStyle='#eee4bd';
   for(let j=0;j<words.length;j++){
    const column=Math.floor(j/2),row=j%2,cx=columns===1?520:735-column*420,cy=205+row*350;
    ctx.save();ctx.translate(cx,cy);ctx.rotate((j%2?1:-1)*.025);ctx.fillText(words[j],0,0,365);ctx.restore();
   }
  });
  const face=new THREE.Mesh(new THREE.PlaneGeometry(7.6,2.95),new THREE.MeshStandardMaterial({map,roughness:.38,metalness:.06,emissive:'#b8a76f',emissiveMap:map,emissiveIntensity:.22}));
  face.rotation.y=Math.PI;face.position.set(positions[i],L.passageFloor+1.74,L.passage.far-.155);parent.add(face);
 }
}

function passage(parent:THREE.Object3D){
 const p=L.passage,f=finishes(),width=p.right-p.left,depth=p.far-p.near,x=(p.left+p.right)/2,z=(p.near+p.far)/2,
  ribs:Item[]=[],panels:Item[]=[],coves:Item[]=[],lights:Item[]=[],rails:Item[]=[],stoneJoints:Item[]=[];
 box(parent,width,.28,depth,x,L.passageFloor-.14,z,warmWhite);
 surface(parent,width,depth,x,L.passageFloor+.009,z,f.stone);
 box(parent,width,3.4,.28,x,L.passageFloor+1.7,p.far,material('#272c2b',.34,.12));
 for(let cx=p.left+2.4;cx<p.right;cx+=4.8){
  panels.push({x:cx,y:L.passageCeiling+.05,z,sx:4.73,sy:.16,sz:depth-.35});
  ribs.push({x:cx-2.4,y:L.passageCeiling-.16,z,sx:.18,sy:.23,sz:depth-.2});
  for(const dz of [-3.4,3.4])coves.push({x:cx,y:L.passageCeiling-.11,z:z+dz,sx:4.65,sy:.035,sz:.22});
  if(Math.round((cx-p.left)/4.8)%2===0)lights.push({x:cx,y:L.passageCeiling-.18,z,sx:1.4,sy:.04,sz:.43});
 }
 for(let cx=p.left+3;cx<p.right;cx+=3)stoneJoints.push({x:cx,y:L.passageFloor+1.7,z:p.far-.16,sx:.018,sy:3.15,sz:.01});
 batch(parent,material('#bfc3bf',.5,.32),panels);batch(parent,satinMetal,ribs);batch(parent,blueCove,coves);batch(parent,lightPanel,lights);batch(parent,darkMetal,stoneJoints);
 passageFeatureWall(parent);
 for(const room of T1_A_WAITING_ROOMS){
  const stairsFor=t1LoungeStairs(room),centerWidth=room.width-11;
  // Inner face of the upper mural wall: the A-side passage is a distinct
  // room-height circulation band within the separate lounge/service wing.
  if(room.kind!=='shared')box(parent,centerWidth,L.passageCeiling-L.passageFloor,.22,room.x,(L.passageCeiling+L.passageFloor)/2,p.near-.45,warmWhite);
  for(const s of stairsFor)rails.push({x:s.x,y:L.passageFloor+.58,z:p.near-.18,sx:s.width+.3,sy:1.16,sz:.075});
  sign(parent,`↓ ${room.gateIds.join(' / ')}`,room.x,L.passageFloor+2.63,p.near-.29,room.kind==='shared'?6.8:4.3);
 }
 batch(parent,satinMetal,rails);
 for(const cx of [225,455,650]){
  sign(parent,cx<455?'← A7–A9     A1–A6 →':'← A6–A9     A1–A5 →',cx,L.passageFloor+2.67,z,6.2,Math.PI/2);
 }
 // A short raised connection joins the terminal's 3F north end. The outer
 // main-hall door and this floor share the same elevation.
 const link=L.link,linkDepth=link.far-link.near,linkZ=(link.near+link.far)/2;
 box(parent,link.right-link.left,.27,linkDepth,440,L.passageFloor-.135,linkZ,warmWhite);
 surface(parent,link.right-link.left,linkDepth,440,L.passageFloor+.012,linkZ,f.stone);
 box(parent,link.right-link.left,.22,linkDepth,440,L.passageCeiling+.15,linkZ,ceilingWhite);
 for(const wall of t1DepartureLinkWalls()){
  const cx=(wall.left+wall.right)/2,cz=(wall.near+wall.far)/2,depth=wall.far-wall.near;
  box(parent,.12,3.3,depth,cx,L.passageFloor+1.65,cz,material('#a9bdc1',.3,.16));
  box(parent,.16,.16,depth,cx,L.passageFloor+1.05,cz,satinMetal);
 }
 const light=hallAreaLight(parent,455,L.passageCeiling-.25,z,95,8,1.8,'#f8f0dd');
 light.userData.hallLightBounds={...p,left:400,right:510,bottom:L.passageFloor,top:L.passageCeiling};
}

/** Architecture-first replacement for the oversized ground-level A glass box. */
export function buildT1APassengerArchitecture(parent:THREE.Object3D,mats:ShellMaterials,gateList:Gate[]){
 const b=L.bounds,f=finishes(),left=b.x-b.width/2,right=b.x+b.width/2,outer=L.roomNear-1.2,
  frames:Item[]=[],spandrels:Item[]=[],windowMullions:Item[]=[];
 // An opaque lower service storey, a lower lounge deck and an upper passenger
 // passage replace a single unzoned ground-level space through parked aircraft.
 box(parent,b.width,L.loungeFloor-.2,b.depth,b.x,(L.loungeFloor-.2)/2,b.z,mats.cladding);
 box(parent,b.width,.3,b.depth,b.x,L.loungeFloor-.15,b.z,warmWhite);
 surface(parent,b.width-1,b.depth-1,b.x,L.loungeFloor+.008,b.z,f.blueFloor);
 box(parent,b.width+1.6,.55,b.depth+1.8,b.x,b.height+.275,b.z,mats.roof??mats.metal);
 box(parent,b.width,b.height-L.loungeFloor,.09,b.x,(b.height+L.loungeFloor)/2,outer,mats.glass);
 for(const cx of [left,right])box(parent,.12,b.height-L.loungeFloor,b.depth,cx,(b.height+L.loungeFloor)/2,b.z,mats.glass);
 for(let x=left+2;x<right;x+=3.2){
  frames.push({x,y:(b.height+L.loungeFloor)/2,z:outer,sx:.09,sy:b.height-L.loungeFloor,sz:.16});
 }
 for(const y of [L.loungeFloor+.6,L.loungeFloor+3.3,L.passageFloor+.1,b.height-.25])windowMullions.push({x:b.x,y,z:outer-.025,sx:b.width,sy:y===L.passageFloor+.1?.32:.09,sz:.2});
 spandrels.push({x:b.x,y:L.loungeFloor+.28,z:outer,sx:b.width,sy:.56,sz:.3});
 batch(parent,satinMetal,frames);batch(parent,satinMetal,windowMullions);batch(parent,warmWhite,spandrels);
 for(const room of T1_A_WAITING_ROOMS){
  const zone=new THREE.Group();zone.name=`T1 lounge ${room.id}`;parent.add(zone);
  surface(zone,room.width-1,L.roomFar-L.roomNear,room.x,L.loungeFloor+.018,(L.roomNear+L.roomFar)/2,f.blueFloor);
  for(const side of [-1,1])box(zone,.22,L.loungeCeiling-L.loungeFloor,L.roomFar-L.roomNear,room.x+side*room.width/2,(L.loungeCeiling+L.loungeFloor)/2,(L.roomNear+L.roomFar)/2,warmWhite);
  loungeCeiling(zone,room);boardingWall(zone,room);linkedSeats(zone,room);stairs(zone,room);
  if(room.kind==='shared')sharedRoomCore(zone,room);
  for(const gateId of room.gateIds){
   const gate=gateList.find(g=>g.id===gateId);if(!gate)continue;
   const doorX=gate.x+18,doorZ=outer-.02;
   box(zone,3.35,2.7,2.1,doorX,L.loungeFloor+1.35,doorZ-.9,warmWhite);
   box(zone,2.8,2.35,.1,doorX,L.loungeFloor+1.18,doorZ+.22,material('#40565e',.34,.21));
   sign(zone,gateId,doorX,L.loungeFloor+2.95,doorZ+.35,1.9);
  }
  // Only the photo-led inspection rooms receive a local fill. Outside views
  // and other floors retain the established zero-extra-light behaviour.
  if(room.kind==='mountain'||room.kind==='shared'){
   const light=hallAreaLight(zone,room.x,L.loungeCeiling-.48,-215,room.width-6,27,2.45,'#fff2d7');
   light.userData.hallLightBounds={...room.bounds,bottom:L.loungeFloor,top:L.loungeCeiling};
  }
 }
 passage(parent);
}
