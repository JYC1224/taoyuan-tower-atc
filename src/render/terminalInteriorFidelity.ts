import * as THREE from 'three';
import type {Gate} from '../data/airport';
import {box,canvasTexture,instances,material} from './primitives';

type Bounds={x:number;z:number;width:number;depth:number;height:number};
type Instance={x:number;y:number;z:number;sx:number;sy:number;sz:number;ry?:number;color?:THREE.ColorRepresentation};
type GateTerminal='T1'|'T2';
type LoungeTheme={zh:string;en:string;kind:string;wall:string;accent:string;seat:string};

const unitBox=new THREE.BoxGeometry(1,1,1);
const aluminium=material('#adb9bc',.34,.55),steel=material('#8f9da2',.38,.58),screen=material('#14272e',.22,.15),
  seatMaterial=material('#435a61',.62,.14),trim=material('#d9dedb',.38,.24),
  floorPlant=material('#52594a',.88),potMaterial=material('#77786d',.72,.08);
const muralCache=new Map<string,THREE.Material>();

function batch(parent:THREE.Object3D,mat:THREE.Material,items:Instance[]){if(items.length)instances(parent,unitBox,mat,items);}

const t1Themes:Record<string,LoungeTheme>={
 A1:{zh:'臺灣彩陶',en:'TAIWAN CERAMIC ART',kind:'ceramic',wall:'#473b3a',accent:'#d58853',seat:'#bd8254'},
 A2:{zh:'臺灣彩陶',en:'TAIWAN CERAMIC ART',kind:'ceramic',wall:'#473b3a',accent:'#d58853',seat:'#bd8254'},
 A3:{zh:'臺灣彩陶',en:'TAIWAN CERAMIC ART',kind:'ceramic',wall:'#473b3a',accent:'#d58853',seat:'#bd8254'},
 A4:{zh:'青花蝴蝶',en:'BLUE AND WHITE BUTTERFLY',kind:'butterfly',wall:'#233d4b',accent:'#7fc0d0',seat:'#55859a'},
 A5:{zh:'臺灣小吃',en:'TAIWAN STREET FOOD',kind:'food',wall:'#512e29',accent:'#eda54e',seat:'#bf683d'},
 A6:{zh:'原鄉藝術',en:'INDIGENOUS ART',kind:'canoe',wall:'#37463d',accent:'#c08b54',seat:'#826b50'},
 A7:{zh:'臺灣百岳',en:'TAIWAN MOUNTAINS',kind:'mountain',wall:'#35453f',accent:'#92b28e',seat:'#667c70'},
 A8:{zh:'臺灣好茶',en:'TAIWAN TEA',kind:'tea',wall:'#35473c',accent:'#b7a36b',seat:'#76836b'},
 A9:{zh:'歌仔戲',en:'TAIWANESE OPERA',kind:'opera',wall:'#4b2831',accent:'#d18b49',seat:'#9b4a42'},
 B1:{zh:'自行車文化',en:'CYCLING CULTURE',kind:'bicycle',wall:'#29404b',accent:'#74bdc1',seat:'#537985'},
 B2:{zh:'自行車文化',en:'CYCLING CULTURE',kind:'bicycle',wall:'#29404b',accent:'#74bdc1',seat:'#537985'},
 B3:{zh:'自行車文化',en:'CYCLING CULTURE',kind:'bicycle',wall:'#29404b',accent:'#74bdc1',seat:'#537985'},
 B4:{zh:'薩克斯風',en:'SAXOPHONE',kind:'music',wall:'#363638',accent:'#c8a558',seat:'#756f60'},
 B5:{zh:'漆彩寶島',en:'TAIWAN LACQUER ART',kind:'lacquer',wall:'#422b2b',accent:'#d4a449',seat:'#8b493b'},
 B6:{zh:'臺灣水果',en:'TAIWAN FRUITS',kind:'fruit',wall:'#3b4939',accent:'#e0a346',seat:'#749153'},
 B7:{zh:'科技綻揚',en:'TECHNOLOGY TAIWAN',kind:'technology',wall:'#202e37',accent:'#55bbca',seat:'#527b87'},
 B8:{zh:'編織之森',en:'WOVEN FOREST',kind:'weave',wall:'#4a4037',accent:'#bd9a67',seat:'#947454'},
 B9:{zh:'體育之光',en:'SPORTING TAIWAN',kind:'sport',wall:'#263c4e',accent:'#d4a83e',seat:'#637b90'}
};

const t2Themes:Record<string,LoungeTheme>={
 C1:{zh:'木育森林',en:'WOODLAND PLAY',kind:'wood',wall:'#443a30',accent:'#b98a58',seat:'#927452'},
 C2:{zh:'歡樂好夥伴',en:'FRIENDS AND PLAY',kind:'play',wall:'#3a4150',accent:'#e77e9a',seat:'#d57f99'},
 C3:{zh:'街口食趣',en:'TAIWAN STREET FOOD',kind:'food',wall:'#58372b',accent:'#e6a64b',seat:'#bd683d'},
 C4:{zh:'潮玩宇宙',en:'DESIGN TOY UNIVERSE',kind:'play',wall:'#342d42',accent:'#a57dd0',seat:'#8174a6'},
 C5:{zh:'漢方秘境',en:'HERBAL MEDICINE',kind:'herbal',wall:'#34433b',accent:'#c8a66a',seat:'#6e8971'},
 C6:{zh:'島嶼字遊行',en:'ISLAND CALLIGRAPHY',kind:'calligraphy',wall:'#343d46',accent:'#b78d55',seat:'#7e8990'},
 C7:{zh:'島流聲',en:'TAIWAN POP MUSIC',kind:'music',wall:'#20262d',accent:'#67c3c2',seat:'#39484e'},
 C8:{zh:'造夢映象',en:'FILM-WEAVER LOUNGE',kind:'cinema',wall:'#26272c',accent:'#d4a254',seat:'#a83c37'},
 C9:{zh:'島嶼漫遊',en:'ISLAND HOPPING',kind:'island',wall:'#31454b',accent:'#75adbb',seat:'#61858c'},
 C10:{zh:'臺緣',en:'ISLAND CONNECTIONS',kind:'island',wall:'#33413e',accent:'#d2a351',seat:'#7a876d'},
 D1:{zh:'海岸風情',en:'NORTH COAST',kind:'coast',wall:'#24414e',accent:'#5ab6c2',seat:'#497d8e'},
 D2:{zh:'樂活離島',en:'ISLAND LIVING',kind:'island',wall:'#33464d',accent:'#70adb6',seat:'#60878a'},
 D3:{zh:'希望平溪',en:'PINGXI LANTERN TOWN',kind:'lantern',wall:'#4c3630',accent:'#e0a14b',seat:'#9b6751'},
 D4:{zh:'花東探遊',en:'HUALIEN AND TAROKO',kind:'mountain',wall:'#3b423e',accent:'#a9b49c',seat:'#768276'},
 D5:{zh:'臺灣之窗',en:'TAIWAN TRAVEL',kind:'island',wall:'#354349',accent:'#b99055',seat:'#737f7a'},
 D6:{zh:'智慧綠能',en:'SMART GREEN ENERGY',kind:'energy',wall:'#2d453b',accent:'#a5c45d',seat:'#6e8d73'},
 D7:{zh:'霹靂布袋戲',en:'PILI PUPPET THEATRE',kind:'opera',wall:'#4a282c',accent:'#db9951',seat:'#93474a'},
 D8:{zh:'珍愛野鳥',en:'TAIWAN BIRDS',kind:'bird',wall:'#39473d',accent:'#b6c477',seat:'#76875d'},
 D9:{zh:'原民薈萃',en:'INDIGENOUS TAIWAN',kind:'canoe',wall:'#3d3932',accent:'#c09760',seat:'#826c4f'},
 D10:{zh:'無人之境',en:'NO MAN’S LAND',kind:'art',wall:'#303137',accent:'#b8a5cb',seat:'#72707b'}
};

function themeFor(gateId:string,terminal:GateTerminal):LoungeTheme{
 return (terminal==='T1'?t1Themes:t2Themes)[gateId]??{zh:'登機候機區',en:'GATE LOUNGE',kind:'art',wall:'#343c40',accent:'#a4b5b5',seat:'#62747a'};
}

function muralMaterial(theme:LoungeTheme){
 const key=theme.en,existing=muralCache.get(key);if(existing)return existing;
 const texture=canvasTexture(1024,288,ctx=>{
  const bg=ctx.createLinearGradient(0,0,1024,288);bg.addColorStop(0,theme.wall);bg.addColorStop(.55,'#26343a');bg.addColorStop(1,theme.wall);ctx.fillStyle=bg;ctx.fillRect(0,0,1024,288);
  ctx.globalAlpha=.45;ctx.strokeStyle=theme.accent;ctx.fillStyle=theme.accent;ctx.lineWidth=5;
  if(theme.kind==='music'||theme.kind==='technology'){
   for(let band=0;band<4;band++){ctx.beginPath();for(let x=0;x<=1024;x+=16){const y=142+band*12+Math.sin(x*.022+band)*25*(.3+Math.abs(Math.sin(x*.008)));x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
   for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(770+i*42,112,35+i*8,0,Math.PI*2);ctx.stroke();}
  }else if(theme.kind==='cinema'){
   for(let y=26;y<260;y+=84){ctx.fillRect(22,y,48,48);ctx.fillRect(954,y,48,48);}ctx.beginPath();ctx.moveTo(300,55);ctx.lineTo(710,55);ctx.lineTo(760,95);ctx.lineTo(250,95);ctx.closePath();ctx.fill();ctx.strokeRect(288,103,440,118);
  }else if(theme.kind==='coast'||theme.kind==='island'){
   for(let row=0;row<5;row++){ctx.beginPath();for(let x=0;x<=1024;x+=18){const y=115+row*27+Math.sin(x*.013+row*.8)*17;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
   ctx.beginPath();ctx.moveTo(0,255);ctx.quadraticCurveTo(245,165,430,220);ctx.quadraticCurveTo(700,284,1024,170);ctx.stroke();
  }else if(theme.kind==='lantern'){
   for(let i=0;i<11;i++){const x=65+i*91,h=60+(i%3)*14;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,38);ctx.stroke();ctx.beginPath();ctx.ellipse(x,38+h/2,25,h/2,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillRect(x-3,38+h,6,20);}
  }else if(theme.kind==='bird'){
   for(let i=0;i<9;i++){const x=80+i*112,y=82+(i%2)*70;ctx.beginPath();ctx.arc(x,y,24,Math.PI,Math.PI*2);ctx.arc(x+48,y,24,Math.PI,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(x+24,y+25,19,26,-.18,0,Math.PI*2);ctx.fill();}
  }else if(theme.kind==='mountain'){
   for(let row=0;row<6;row++){ctx.beginPath();ctx.moveTo(0,214+row*8);for(let x=0;x<=1024;x+=32){const y=188+row*8-Math.abs(Math.sin(x*.009+row*.4))*100;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.lineTo(1024,288);ctx.lineTo(0,288);ctx.closePath();ctx.stroke();if(row===5)ctx.fill();}
  }else if(theme.kind==='bicycle'){
   for(let i=0;i<4;i++){const x=160+i*235;ctx.beginPath();ctx.arc(x,174,61,0,Math.PI*2);ctx.arc(x+154,174,61,0,Math.PI*2);ctx.moveTo(x,174);ctx.lineTo(x+75,105);ctx.lineTo(x+154,174);ctx.lineTo(x+70,174);ctx.lineTo(x+75,105);ctx.stroke();}
  }else if(theme.kind==='fruit'||theme.kind==='play'){
   const colors=['#e27a51','#8bb27b','#d8b75e','#75a9bc'];for(let i=0;i<12;i++){ctx.fillStyle=colors[i%colors.length];ctx.beginPath();ctx.arc(55+i*84,86+(i%3)*45,24+(i%2)*13,0,Math.PI*2);ctx.fill();}
  }else if(theme.kind==='tea'||theme.kind==='weave'||theme.kind==='wood'||theme.kind==='ceramic'){
   for(let x=-250;x<1150;x+=48){ctx.save();ctx.translate(x,144);ctx.rotate(-.38);ctx.beginPath();ctx.ellipse(0,0,26,122,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
   for(let y=30;y<288;y+=46){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1024,y);ctx.stroke();}
  }else{
   for(let i=0;i<9;i++){ctx.beginPath();ctx.arc(115+i*102,145,34+(i%3)*12,0,Math.PI*2);ctx.stroke();}
  }
  ctx.globalAlpha=1;ctx.fillStyle='#f4f2eb';ctx.textAlign='left';ctx.textBaseline='bottom';ctx.font='700 37px Arial,sans-serif';ctx.fillText(theme.zh,34,256,650);
  ctx.textAlign='right';ctx.fillStyle=theme.accent;ctx.font='600 18px Arial,sans-serif';ctx.fillText(theme.en,990,260,290);
  ctx.fillStyle=theme.accent;ctx.fillRect(30,268,964,5);
 });
 texture.anisotropy=8;
 const result=new THREE.MeshStandardMaterial({map:texture,roughness:.54,metalness:.08,emissive:'#18252a',emissiveMap:texture,emissiveIntensity:.16,side:THREE.DoubleSide});muralCache.set(key,result);return result;
}

function loungeSculpture(parent:THREE.Object3D,gate:Gate,theme:LoungeTheme,z:number,side:-1|1){
 const x=gate.x,faceRotation=side>0?0:Math.PI;
 if(theme.kind==='music'){
  for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(1.25+i*.48,.085,8,48),material(i===1?'#5fb9b8':'#8c9aa2',.28,.6));ring.position.set(x,4.05,z+side*.22);ring.rotation.y=faceRotation;ring.castShadow=false;parent.add(ring);}
  const speakers:Instance[]=[];for(const dx of [-6.7,6.7])speakers.push({x:x+dx,y:2.1,z:z+side*.55,sx:1.1,sy:2.8,sz:.72});batch(parent,screen,speakers);
 }else if(theme.kind==='cinema'){
  const reels:Instance[]=[];for(const dx of [-4.3,4.3])reels.push({x:x+dx,y:4.15,z:z+side*.3,sx:2.7,sy:2.7,sz:.24});batch(parent,aluminium,reels);
  for(const dx of [-4.3,4.3]){const disc=new THREE.Mesh(new THREE.TorusGeometry(1.03,.12,8,32),material('#1c252a',.32,.48));disc.position.set(x+dx,4.15,z+side*.48);disc.rotation.y=faceRotation;parent.add(disc);}
  const head=box(parent,5.5,.45,.5,x,5.8,z+side*.42,material('#d2ad69',.36,.32));head.rotation.z=-.2;
 }else if(theme.kind==='coast'){
  const boards:Instance[]=[];for(let i=0;i<3;i++)boards.push({x:x-5+i*5,y:2.35,z:z+side*.72,sx:.62,sy:4.15,sz:.28,ry:(i-1)*.12,color:i%2?'#e0c68b':'#4da4b4'});batch(parent,material('#5595a2',.48,.08),boards);
 }else if(theme.kind==='lantern'){
  for(let i=0;i<5;i++){const lx=x-8+i*4;const cord=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.15,6),steel);cord.position.set(lx,7.25,z+side*.36);parent.add(cord);const lantern=box(parent,1.25,1.05,.78,lx,6.45,z+side*.36,material(i%2?'#bd563e':'#d59b47',.44,.1));const cap=box(parent,1.42,.12,.9,lx,7.04,z+side*.36,trim);cap.castShadow=false;lantern.castShadow=false;}
 }else if(theme.kind==='bird'){
  const nest=new THREE.Mesh(new THREE.TorusGeometry(2.35,.34,7,36),material('#887a58',.86));nest.position.set(x,.75,z+side*4.7);nest.rotation.x=Math.PI/2;parent.add(nest);
  for(let i=0;i<3;i++){const egg=new THREE.Mesh(new THREE.SphereGeometry(.42,12,8),material(['#d8d0b5','#858b63','#a5a377'][i],.76));egg.scale.set(.85,1.4,.85);egg.position.set(x-1+i,1.05,z+side*4.7);parent.add(egg);}
 }else if(theme.kind==='canoe'){
  const rails:Instance[]=[];for(const dx of [-5.4,5.4])rails.push({x:x+dx,y:.75,z:z+side*4.8,sx:.22,sy:.35,sz:8.2,color:theme.accent});batch(parent,material(theme.accent,.56,.16),rails);
 }else if(theme.kind==='energy'){
  const turbines:Instance[]=[];for(let i=0;i<3;i++){const tx=x-5+i*5;turbines.push({x:tx,y:4.3,z:z+side*.55,sx:.18,sy:4.8,sz:.18});}batch(parent,trim,turbines);
  for(let i=0;i<3;i++){const rotor=new THREE.Mesh(new THREE.TorusGeometry(.55,.08,6,24),material('#b7cc79',.32,.36));rotor.position.set(x-5+i*5,5.95,z+side*.66);parent.add(rotor);}
 }else if(theme.kind==='bicycle'){
  for(const offset of [-4,4]){const wheel=new THREE.Mesh(new THREE.TorusGeometry(1.1,.07,6,32),material('#69b7c0',.32,.6));wheel.position.set(x+offset,1.1,z+side*5.2);wheel.rotation.x=Math.PI/2;parent.add(wheel);}
 }else if(theme.kind==='fruit'){
  const fruit:Instance[]=[];const colors=['#d77e42','#9b4b3a','#d8bc58','#78a35d'];for(let i=0;i<6;i++)fruit.push({x:x-5+i*2,y:1.1+(i%2)*.5,z:z+side*5,sx:1.1,sy:1.05,sz:1.0,color:colors[i%colors.length]});batch(parent,material('#d7a95d',.46,.05),fruit);
 }else if(theme.kind==='opera'){
  const masks:Instance[]=[];for(let i=0;i<3;i++)masks.push({x:x-4.4+i*4.4,y:3.4,z:z+side*.45,sx:2.1,sy:2.5,sz:.3,color:i%2?'#d1a44d':'#bc5550'});batch(parent,material('#e0d5bf',.62),masks);
 }
}

/** Small gate-specific waiting rooms and display pieces, placed on the live A/B and C/D gate rows. */
export function decorateGateConcourse(parent:THREE.Object3D,b:Bounds,gateList:Gate[],gateSide:-1|1,terminal:GateTerminal){
 const columns:Instance[]=[],lights:Instance[]=[],seats:Instance[]=[],seatBacks:Instance[]=[],bars:Instance[]=[];
 const first=b.x-b.width/2+8,last=b.x+b.width/2-8;
 for(let x=first;x<=last;x+=12){
  bars.push({x,y:b.height-1.15,z:b.z,sx:.26,sy:.38,sz:b.depth-.6});
  if(Math.round((x-first)/12)%2===0){lights.push({x,y:b.height-2.25,z:b.z-gateSide*4.1,sx:4.4,sy:.11,sz:.32});lights.push({x,y:b.height-2.25,z:b.z+gateSide*4.1,sx:4.4,sy:.11,sz:.32});}
 }
 for(const x of [first,last])for(const side of [-1,1])columns.push({x,y:(b.height-1.3)/2,z:b.z+side*(b.depth/2-1.2),sx:.55,sy:b.height-1.3,sz:.5});
 batch(parent,aluminium,bars);batch(parent,trim,lights);batch(parent,steel,columns);
 const sorted=[...gateList].sort((a,b)=>a.x-b.x);
 for(let i=0;i<sorted.length;i++){
  const gate=sorted[i],theme=themeFor(gate.id,terminal),previous=sorted[i-1],next=sorted[i+1];
  const left=i===0?gate.x-Math.abs(next?.x??gate.x+54-gate.x)/2:(previous.x+gate.x)/2;
  const right=i===sorted.length-1?gate.x+Math.abs(gate.x-(previous?.x??gate.x-54))/2:(gate.x+next.x)/2;
  const bay=Math.max(28,Math.min(70,Math.abs(right-left))),panelWidth=Math.max(20,bay*.68),panelZ=b.z-gateSide*(b.depth/2-1.3),frontZ=panelZ+gateSide*.24;
  const panelMat=material(theme.wall,.62,.16);
  box(parent,panelWidth,3.55,.36,gate.x,3.15,panelZ,panelMat);
  const mural=new THREE.Mesh(new THREE.PlaneGeometry(panelWidth-1,2.68),muralMaterial(theme));
  mural.position.set(gate.x,3.65,frontZ);mural.rotation.y=gateSide>0?0:Math.PI;mural.castShadow=false;parent.add(mural);
  box(parent,panelWidth,.18,.56,gate.x,5.0,panelZ,material(theme.accent,.42,.18));
  const seatZ=b.z-gateSide*6.7,spacing=Math.min(3.1,(bay-5)/7),seatStart=gate.x-spacing*3;
  for(let seat=0;seat<7;seat++)for(let row=0;row<2;row++){
   const x=seatStart+seat*spacing,z=seatZ+gateSide*(row*2.7);
   seats.push({x,y:.62,z,sx:1.42,sy:.2,sz:.72,color:theme.seat});
   seatBacks.push({x,y:1.15,z:z-gateSide*.22,sx:1.42,sy:1.02,sz:.18,color:theme.seat});
  }
  loungeSculpture(parent,gate,theme,panelZ,gateSide);
 }
 batch(parent,seatMaterial,seats);batch(parent,seatMaterial,seatBacks);
}

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
  const t=i-3,x=b.x+t*6.4,y=solarY+t*.34,z=solarZ+t*1.5,rotation=new THREE.Euler(.28+(i%2)*.05,(i%2===0?-.16:.16),t*.035),matrix=new THREE.Matrix4().makeRotationFromEuler(rotation),center=new THREE.Vector3(x,y,z);
  const disc=new THREE.Mesh(solarDisc,solarMaterial);disc.position.copy(center);disc.rotation.copy(rotation);disc.scale.set(1,.78,1);disc.castShadow=false;parent.add(disc);
  const rim=new THREE.Mesh(solarRim,solarFrame);rim.position.copy(center).add(new THREE.Vector3(0,0,.04));rim.rotation.copy(rotation);rim.scale.set(1,.78,1);rim.castShadow=false;parent.add(rim);
  const lens=new THREE.Mesh(lensDisc,lensMat);lens.position.copy(center).add(new THREE.Vector3(0,0,.085));lens.rotation.copy(rotation);parent.add(lens);
  const lensEdge=new THREE.Mesh(lensRim,goldRim);lensEdge.position.copy(center).add(new THREE.Vector3(0,0,.115));lensEdge.rotation.copy(rotation);parent.add(lensEdge);
  for(let spoke=0;spoke<8;spoke++){const angle=spoke*Math.PI*2/8,edge=new THREE.Vector3(lensRadius*.92*Math.cos(angle),lensRadius*.92*Math.sin(angle),.12).applyMatrix4(matrix).add(center);addBeam(parent,center.clone().add(new THREE.Vector3(0,0,.12).applyMatrix4(matrix)),edge,wire,.007);}
  for(const dx of [-.92,.92]){const anchor=center.clone().add(new THREE.Vector3(dx,lensRadius*.68,0).applyMatrix4(matrix));addBeam(parent,anchor,new THREE.Vector3(anchor.x,b.height-5.5,anchor.z),hangers,.012);}
 }
 // The curved aircraft-like backbone links the glass lenses without a heavy beam.
 const solarSpine=new THREE.CatmullRomCurve3(Array.from({length:15},(_,i)=>{const t=i/14;return new THREE.Vector3(b.x-22+t*44,solarY-1+Math.sin(t*Math.PI)*.8,solarZ-2+t*3);}));
 const spine=new THREE.Mesh(new THREE.TubeGeometry(solarSpine,56,.05,7,false),solarFrame);spine.castShadow=false;parent.add(spine);
 flushBeams(parent,steel,wire);flushBeams(parent,aluminium,hangers);

 // The raised hall also has broad circular pendant luminaires visible beneath
 // the dark space frame in the airport's check-in photographs.
 const luminaire=new THREE.MeshBasicMaterial({color:'#fff9e7',toneMapped:false,side:THREE.DoubleSide}),lampGlass=new THREE.MeshBasicMaterial({color:'#fff4cf',transparent:true,opacity:.82,toneMapped:false,side:THREE.DoubleSide});
 const pendantOutline=new THREE.Shape(),petalPoints=96;for(let point=0;point<=petalPoints;point++){const angle=point/petalPoints*Math.PI*2,radius=1.22+.28*Math.pow(Math.max(0,Math.cos(angle*6)),2),x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;if(point===0)pendantOutline.moveTo(x,z);else pendantOutline.lineTo(x,z);}pendantOutline.closePath();
 const pendantGeometry=new THREE.ShapeGeometry(pendantOutline,96),pendantBody=new THREE.MeshBasicMaterial({color:'#f1efe3',toneMapped:false,side:THREE.DoubleSide});
 for(let row=0;row<4;row++)for(let col=0;col<5;col++){
  const x=b.x+(col-2)*35,z=b.z-105+row*70,y=b.height-7,ceilingY=b.height-.32,cableLength=ceilingY-y-.18;
  const housing=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.2,24),luminaire);housing.position.set(x,y+.06,z);housing.castShadow=false;parent.add(housing);
  const pendantFace=new THREE.Mesh(pendantGeometry,pendantBody),pendantDiffuser=new THREE.Mesh(pendantGeometry,lampGlass);pendantFace.rotation.x=pendantDiffuser.rotation.x=-Math.PI/2;pendantFace.position.set(x,y+.18,z);pendantDiffuser.position.set(x,y-.015,z);pendantFace.castShadow=pendantDiffuser.castShadow=false;parent.add(pendantFace,pendantDiffuser);
  for(const dx of [-1,1])for(const dz of [-1,1]){const cable=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,cableLength,6),steel);cable.position.set(x+dx*.76,(ceilingY+y)/2,z+dz*.76);cable.castShadow=false;parent.add(cable);}
 }

 // Semi-circular passenger stair between the public upper levels.
 const stairTreads:Instance[]=[],stepCount=28,centerX=b.x+78,centerZ=b.z+8,radius=8.4,fromY=12.5,rise=5.75;
 for(let i=0;i<stepCount;i++){
  const t=(i+.5)/stepCount,angle=-Math.PI*.78+t*Math.PI*1.56;
  stairTreads.push({x:centerX+Math.cos(angle)*radius,y:fromY+t*rise,z:centerZ+Math.sin(angle)*radius,sx:3.7,sy:.18,sz:.95,ry:angle});
 }
 batch(parent,trim,stairTreads);
 for(const offset of [-1,1]){
  const curve=new THREE.CatmullRomCurve3(Array.from({length:25},(_,i)=>{const t=i/24,angle=-Math.PI*.78+t*Math.PI*1.56;return new THREE.Vector3(centerX+Math.cos(angle)*(radius+offset*1.85),fromY+t*rise+1.05,centerZ+Math.sin(angle)*(radius+offset*1.85));}));
  const rail=new THREE.Mesh(new THREE.TubeGeometry(curve,72,.065,6,false),steel);rail.castShadow=false;parent.add(rail);
 }

 // Tropical palms and the island-globe water feature anchor the 4F waiting space.
 for(let i=0;i<4;i++){
  const x=b.x-56+i*37,z=b.z+29+(i%2)*9,floor=18.55;
  const pot=new THREE.Mesh(new THREE.CylinderGeometry(1.18,1.42,.76,20),potMaterial);pot.position.set(x,floor+.38,z);parent.add(pot);
  const soil=new THREE.Mesh(new THREE.CylinderGeometry(1.08,1.08,.08,20),floorPlant);soil.position.set(x,floor+.79,z);parent.add(soil);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.35,4.3,12),material('#70543b',.88));trunk.position.set(x,floor+2.92,z);trunk.castShadow=true;parent.add(trunk);
  for(let leaf=0;leaf<9;leaf++){
   const angle=leaf*Math.PI*2/9,reach=2.55,tip=new THREE.Vector3(x+Math.cos(angle)*reach,floor+4.62,z+Math.sin(angle)*reach),mid=new THREE.Vector3(x+Math.cos(angle)*1.15,floor+5.65,z+Math.sin(angle)*1.15);
   const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x,floor+4.8,z),mid,tip]);const frond=new THREE.Mesh(new THREE.TubeGeometry(curve,12,.075,5,false),material(leaf%3?'#4b7357':'#64815b',.9));frond.castShadow=false;parent.add(frond);
  }
 }
 const fountainFloor=18.62,sphere=new THREE.Mesh(new THREE.SphereGeometry(1.75,28,20),new THREE.MeshStandardMaterial({color:'#8f9b8f',roughness:.24,metalness:.32,emissive:'#1c2724',emissiveIntensity:.08}));sphere.position.set(b.x+43,fountainFloor+2.25,b.z-23);sphere.castShadow=true;parent.add(sphere);
 const basin=new THREE.Mesh(new THREE.TorusGeometry(3.1,.22,8,48),material('#668d94',.2,.35));basin.position.set(b.x+43,fountainFloor+.56,b.z-23);basin.rotation.x=Math.PI/2;parent.add(basin);
 const water=new THREE.Mesh(new THREE.CircleGeometry(2.83,48),new THREE.MeshPhysicalMaterial({color:'#75aeb5',roughness:.13,metalness:.14,transparent:true,opacity:.58,depthWrite:false}));water.rotation.x=-Math.PI/2;water.position.set(b.x+43,fountainFloor+.57,b.z-23);parent.add(water);

 // Silver Memory: paired stainless-steel ribbons beside the 1F immigration lanes.
 for(const side of [-1,1]){
  const x=b.x+side*41,z=b.z-8;
  for(let band=0;band<3;band++){
   const curve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(x-8,1.2+band*.24,z),new THREE.Vector3(x-5,2.4+band*.22,z+1.2),
    new THREE.Vector3(x,3.15+band*.18,z+.6),new THREE.Vector3(x+5,2.1+band*.24,z-1.2),new THREE.Vector3(x+8,1.4+band*.2,z)
   ]);
   const ribbon=new THREE.Mesh(new THREE.TubeGeometry(curve,36,.18,8,false),material(band===1?'#b2c5c7':'#8e9b9e',.22,.72));ribbon.castShadow=true;parent.add(ribbon);
  }
 }

 // Arrival-hall welcome sculpture and its low polished stone plinth.
 const arrivalY=.58,artX=b.x+30,artZ=b.z+52;
 box(parent,15,.34,4,artX,arrivalY+.2,artZ,material('#656c69',.38,.2));
 const animals:Instance[]=[];const animalColors=['#d7a04a','#82a375','#b85c49','#d4d0bb','#687f89'];
 for(let i=0;i<5;i++){
  const x=artX-5.2+i*2.6,y=arrivalY+1.55+(i%2)*.35;
  animals.push({x,y,z:artZ,sx:1.2,sy:2.05,sz:1.0,color:animalColors[i]});
  animals.push({x:x+.28,y:y+1.08,z:artZ-.08,sx:.82,sy:.76,sz:.82,color:animalColors[i]});
 }
 batch(parent,material('#d2cfc5',.42,.1),animals);
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
