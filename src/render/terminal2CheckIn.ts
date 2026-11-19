import * as THREE from 'three';
import {canvasTexture,instances,material} from './primitives';
import type {TerminalBounds} from './terminalArchitecture';
import {
 t2CheckInBankFootprint,t2CheckInKiosks,t2CheckInPoint,t2CheckInQueueRails,t2CheckInRect,t2ThirdFloorCheckInBanks,
 type T2CheckInBank,type T2CheckInFace,
} from './terminalInteriorLayout';
import {addFloorContactShadows,terminalFloorMaterial} from './terminalFloorLighting';

type Instance=Parameters<typeof instances>[3][number];
type Origin=Parameters<typeof t2CheckInPoint>[0];
type PutPart=(finish:THREE.Material,along:number,height:number,across:number,
 width:number,thickness:number,depth:number,rotation?:number,geometry?:THREE.BufferGeometry)=>void;

const cube=new THREE.BoxGeometry(1,1,1),plane=new THREE.PlaneGeometry(1,1);
const postGeometry=new THREE.CylinderGeometry(.5,.5,1,10);
const frame=material('#25282a',.47,.27);
const beamTrim=material('#464b4d',.43,.42);
const brushedSteel=material('#aeb5b3',.36,.5);
const satinSteel=material('#686d6b',.48,.45);
const deskFront=material('#40595a',.43,.20);
const deskTop=material('#c5cac6',.34,.18);
const extensionFront=material('#969f9e',.44,.28);
const offWhite=material('#ecece5',.34,.15);
const cabinetSeam=material('#5e6467',.58,.28);
const rubber=material('#272a2c',.82,.07);
const dropBeam=material('#243437',.42,.32);
const pylon=material('#263374',.36,.20);
const accentLine=material('#984842',.55,.11);
const floorGuide=material('#cb9f3a',.69,.03);
let stoneInlay:THREE.MeshPhysicalMaterial|undefined;
const taskLight=new THREE.MeshBasicMaterial({color:'#e0e8de',toneMapped:false});
const idleScreen=new THREE.MeshBasicMaterial({color:'#253033'});

const shoulder=new THREE.CubicBezierCurve(
 new THREE.Vector2(.36,1.42),new THREE.Vector2(.74,1.42),
 new THREE.Vector2(1.16,1.34),new THREE.Vector2(1.35,1.04),
);
const roundedFront=new THREE.CubicBezierCurve(
 shoulder.v3,new THREE.Vector2(1.61,.65),
 new THREE.Vector2(1.55,.25),new THREE.Vector2(1.41,0),
);
const screenPad=shoulder.getPoint(.52),screenSlope=shoulder.getTangent(.52);
const angledScreen=plane.clone().rotateX(-Math.atan2(screenSlope.x*1.08,-screenSlope.y));

function bagDropHousing(){
 const profile=new THREE.Shape();
 profile.moveTo(0,0);
 profile.lineTo(0,shoulder.v0.y);
 profile.lineTo(shoulder.v0.x,shoulder.v0.y);
 for(const curve of [shoulder,roundedFront]){
  profile.bezierCurveTo(curve.v1.x,curve.v1.y,curve.v2.x,curve.v2.y,curve.v3.x,curve.v3.y);
 }
 profile.closePath();
 return new THREE.ExtrudeGeometry(profile,{
  depth:1,curveSegments:8,bevelEnabled:true,bevelSegments:1,bevelSize:.015,bevelThickness:.014,
 }).rotateY(-Math.PI/2).translate(.5,0,0);
}
const bagHousing=bagDropHousing();

function bagShutter(open:boolean){
 // The ribs run down a continuous curved panel. An open lane retracts the
 // lower part above the load opening while leaving the upper cover visible.
 const curve=[...shoulder.getPoints(10),...roundedFront.getPoints(14).slice(1)];
 const points=open?curve.slice(0,13):curve,vertices:number[]=[],uvs:number[]=[],indices:number[]=[];
 for(const [i,p] of points.entries()){
  const v=i/(curve.length-1);
  vertices.push(-.5,p.y,p.x,.5,p.y,p.x);
  uvs.push(0,v,1,v);
  const a=i*2;
  if(i<points.length-1)indices.push(a,a+2,a+1,a+1,a+2,a+3);
 }
 const cover=new THREE.BufferGeometry();
 cover.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 cover.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 cover.setIndex(indices);
 cover.computeVertexNormals();
 return cover;
}
const shutters={open:bagShutter(true),closed:bagShutter(false)};
let shutterFinish:THREE.MeshStandardMaterial|undefined;
function bagShutterFinish(){
 if(shutterFinish)return shutterFinish;
 const map=canvasTexture(256,4,ctx=>{
  ctx.fillStyle='#46504b';ctx.fillRect(0,0,256,4);
  for(let i=0;i<32;i++){
   ctx.fillStyle='#252e2b';ctx.fillRect(i*8,0,2,4);
   ctx.fillStyle='#646e69';ctx.fillRect(i*8+2,0,1,4);
  }
 });
 shutterFinish=new THREE.MeshStandardMaterial({map,roughness:.50,metalness:.28});
 return shutterFinish;
}

type ScreenKind='staffed'|'bag-drop'|'bag-guide'|'kiosk';
const screenMaterials=new Map<ScreenKind,THREE.MeshBasicMaterial>();
function screenMaterial(kind:ScreenKind){
 const cached=screenMaterials.get(kind);
 if(cached)return cached;
 const headings={
  staffed:['報到櫃檯','CHECK-IN'],
  'bag-drop':['自助行李託運','SELF BAG DROP'],
  'bag-guide':['自助行李託運','SELF BAG DROP'],
  kiosk:['自助報到','SELF CHECK-IN'],
 };
 const map=canvasTexture(256,128,ctx=>{
  const [zh,en]=headings[kind];
  if(kind==='bag-guide'){
   ctx.fillStyle='#e8eadf';ctx.fillRect(0,0,256,128);
   ctx.fillStyle='#224940';ctx.fillRect(0,109,256,19);
   ctx.font='bold 25px "Microsoft JhengHei", sans-serif';ctx.fillText(zh,12,36,160);
   ctx.font='bold 12px Arial, sans-serif';ctx.fillText(en,13,56,157);
   ctx.font='12px "Microsoft JhengHei", sans-serif';
   ctx.fillText('掃描登機證・將行李放上輸送帶',13,83,151);
   ctx.fillStyle='#375c59';ctx.fillRect(180,48,46,37);ctx.fillRect(188,40,30,7);
   ctx.fillStyle='#c9d6d0';ctx.fillRect(192,43,22,4);ctx.fillRect(186,57,34,3);ctx.fillRect(186,72,34,3);
   ctx.fillStyle='#545f5c';ctx.fillRect(170,89,65,6);
   return;
  }
  const ground=ctx.createLinearGradient(0,0,256,128);
  ground.addColorStop(0,kind==='staffed'?'#142d43':'#193e5c');
  ground.addColorStop(1,kind==='staffed'?'#517b89':'#27667f');
  ctx.fillStyle=ground;ctx.fillRect(0,0,256,128);
  ctx.fillStyle='#d8e7e7';ctx.fillRect(12,15,27,4);
  ctx.font='bold 30px "Microsoft JhengHei", sans-serif';ctx.fillText(zh,12,56,215);
  ctx.font='bold 18px Arial, sans-serif';ctx.fillText(en,12,81,214);
  ctx.fillStyle='#a6d0d6';ctx.fillRect(12,101,105,3);ctx.fillRect(12,110,73,3);
 });
 const surface=new THREE.MeshBasicMaterial({map,toneMapped:false});
 screenMaterials.set(kind,surface);
 return surface;
}

let numberMaterial:THREE.MeshBasicMaterial|undefined;
function counterNumbers(){
 if(numberMaterial)return numberMaterial;
 const map=canvasTexture(1024,512,ctx=>{
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 74px Arial,sans-serif';
  for(let number=1;number<=26;number++){
   const x=((number-1)%8)*128,y=Math.floor((number-1)/8)*128;
   const panel=ctx.createLinearGradient(x,y,x,y+128);
   panel.addColorStop(0,'#414d8b');panel.addColorStop(1,'#252d62');
   ctx.fillStyle=panel;ctx.fillRect(x,y,128,128);
   ctx.fillStyle='#aaaec5';ctx.fillRect(x+9,y+9,110,3);
   ctx.fillStyle='#f1f4f4';ctx.fillText(String(number),x+64,y+69);
  }
 });
 numberMaterial=new THREE.MeshBasicMaterial({map,toneMapped:false});
 return numberMaterial;
}

function numberTile(number:number){
 const tile=plane.clone(),uv=tile.getAttribute('uv');
 const col=(number-1)%8,row=Math.floor((number-1)/8);
 for(let i=0;i<uv.count;i++)uv.setXY(i,(col+(1+126*uv.getX(i))/128)/8,1-(row+1-(1+126*uv.getY(i))/128)/4);
 return tile;
}

function staffedStation(put:PutPart,along:number,side:number,extension:boolean){
 const deskX=along+side*.51,beltX=along-side*.73;
 put(frame,deskX,.15,side*1.94,1.45,.26,1.05);
 put(extension?extensionFront:deskFront,deskX,.60,side*1.96,1.48,.79,1.10);
 put(brushedSteel,deskX,.185,side*2.52,1.47,.10,.035);
 put(deskTop,deskX,1.03,side*1.97,1.59,.12,1.26);
 put(rubber,deskX,.91,side*2.515,1.43,.035,.035);
 put(satinSteel,deskX,.91,side*1.40,1.42,.33,.075);
 put(satinSteel,deskX-.21,1.20,side*1.72,.095,.24,.12);
 put(frame,deskX-.21,1.42,side*1.72,.53,.32,.085);
 // Display faces the agent. The passenger side has the small document reader.
 put(screenMaterial('staffed'),deskX-.21,1.42,side*1.667,.47,.255,1,side===1?Math.PI:0,plane);
 put(rubber,deskX+side*.49,1.12,side*2.15,.155,.064,.16);
 put(brushedSteel,beltX,.23,side*1.63,.95,.42,1.98);
 put(rubber,beltX,.456,side*1.66,.73,.055,1.86);
 put(satinSteel,beltX,.38,side*2.64,.91,.11,.065);
 for(const edge of [-1,1])put(brushedSteel,beltX+edge*.406,.486,side*1.66,.072,.043,1.86);
}

function bagDropStation(put:PutPart,along:number,side:number,shutterOpen:boolean,energized:boolean){
 const consoleX=along+side*.79,doorX=along-side*.50,rotation=side===1?0:Math.PI;
 put(offWhite,consoleX,.04,side*1.0,1.22,1,1.08,rotation,bagHousing);
 put(brushedSteel,along-side*1.28,.04,side*1.0,.29,.93,1.075,rotation,bagHousing);
 put(satinSteel,doorX,.13,side*1.74,1.30,.22,1.63);
 put(rubber,doorX,.265,side*1.72,1.14,.06,1.57);
 put(rubber,doorX,.83,side*1.12,1.28,1.14,.22);
 put(bagShutterFinish(),doorX,.044,side*1.008,1.36,1,1.08,rotation,shutterOpen?shutters.open:shutters.closed);
 const displayHeight=.073+screenPad.y,displayDepth=1.019+screenPad.x*1.08;
 put(frame,consoleX,displayHeight,side*displayDepth,.51,.33,.33,rotation,angledScreen);
 put(energized?screenMaterial('bag-drop'):idleScreen,consoleX,displayHeight+.008,side*(displayDepth+.004),.43,.245,.245,rotation,angledScreen);
 put(cabinetSeam,consoleX,.92,side*2.575,.33,.044,.045);
 put(satinSteel,consoleX,.875,side*2.59,.35,.027,.043);
 put(floorGuide,along-side*1.35,-.009,side*3.38,.041,.008,1.42);
 put(floorGuide,doorX,-.009,side*4.10,1.32,.008,.042);
}

function bankFace(put:PutPart,bank:T2CheckInBank,face:T2CheckInFace,addNumber:(along:number,side:number,tile:THREE.BufferGeometry)=>void){
 const {number,side,service}=face,isDrop=service==='bag-drop',extension=bank.frame==='extension';
 const half=bank.rowWidth/2,spacing=bank.rowWidth/bank.stations,rotation=side===1?0:Math.PI;
 const beam=isDrop?dropBeam:extension?beamTrim:frame;
 put(beam,0,3.20,side*1.94,bank.rowWidth+.36,isDrop?.86:.50,.29);
 put(taskLight,0,isDrop?2.762:2.942,side*1.94,bank.rowWidth-.6,.026,.075);
 if(isDrop){
  put(frame,0,.067,side*2.41,bank.rowWidth+.20,.12,.39);
  stoneInlay??=terminalFloorMaterial('inlay',{color:'#343937'});
  put(stoneInlay,0,-.010,side*5.22,bank.rowWidth+.42,.007,.19);
 }
 if(extension)put(accentLine,0,3.01,side*2.098,bank.rowWidth-.65,.037,.024);
 const tile=numberTile(number);
 for(const end of [-1,1]){
  const along=end*(half-.57);
  put(pylon,along,3.66,side*1.92,1.01,1.11,.79);
  addNumber(along,side,tile);
 }
 const display=screenMaterial(isDrop?'bag-guide':'staffed');
 const displayWidth=isDrop?1.75:extension?1.14:1.04,displayHeight=isDrop?.67:.396;
 for(let station=0;station<bank.stations;station++){
  const along=(station-(bank.stations-1)/2)*spacing;
  if(isDrop)bagDropStation(put,along,side,number!==16&&station%4===1,number!==16);
  else staffedStation(put,along,side,extension);
  if(extension&&station%2===0){
   const pairCenter=along+(station+1<bank.stations?spacing/2:0);
   put(brushedSteel,pairCenter,3.24,side*2.11,spacing+(station+1<bank.stations?1.46:-1.39),.54,.10);
  }
  put(frame,along,3.24,side*2.185,displayWidth+.14,displayHeight+.09,.071);
  put(display,along,3.24,side*2.228,displayWidth,displayHeight,1,rotation,plane);
 }
}

function checkInKiosk(put:PutPart,side:number){
 const rotation=side===1?0:Math.PI;
 put(rubber,0,.065,0,.88,.13,.61);
 put(brushedSteel,0,.61,0,.47,1.07,.47);
 put(satinSteel,0,.81,side*.223,.32,.54,.045);
 put(offWhite,0,1.24,0,.72,.64,.50);
 put(pylon,0,1.28,side*.24,.62,.49,.083);
 put(frame,0,1.37,side*.293,.51,.35,.043);
 put(screenMaterial('kiosk'),0,1.37,side*.317,.456,.284,1,rotation,plane);
 put(rubber,0,1.086,side*.293,.25,.038,.029);
 put(brushedSteel,0,.996,side*.299,.36,.052,.17);
}

export function buildT2CheckIn(parent:THREE.Object3D,b:TerminalBounds,floor:number){
 const batches=new Map<string,{surface:THREE.Material;geometry:THREE.BufferGeometry;items:Instance[]}>();
 const at=(origin:Origin):PutPart=>(surface,u,y,v,sx,sy,sz,rotation=0,geometry=cube)=>{
  const key=surface.uuid+'/'+geometry.uuid;
  let batch=batches.get(key);
  if(!batch){batch={surface,geometry,items:[]};batches.set(key,batch);}
  batch.items.push({...t2CheckInPoint(origin,u,v),y:floor+y,sx,sy,sz,ry:rotation+(origin.axis==='z'?Math.PI/2:0)});
 };
 const numbers=counterNumbers(),banks=t2ThirdFloorCheckInBanks(b.x,b.z,b.depth),footprints=banks.map(t2CheckInBankFootprint);
 for(const bank of banks){
  const put=at(bank),half=bank.rowWidth/2,bankRotation=bank.axis==='z'?Math.PI/2:0;
  put(frame,0,.38,0,bank.rowWidth+.36,.76,1.67);
  put(rubber,0,.79,0,bank.rowWidth+.25,.105,1.38);
  for(const along of [-half+.12,0,half-.12]){
   put(beamTrim,along,1.57,0,.17,3.14,.18);
   put(beamTrim,along,3.15,0,.15,.23,4.09);
  }
  for(const face of bank.faces)bankFace(put,bank,face,(along,side,tile)=>{
   const front=new THREE.Mesh(tile,numbers);
   const {x,z}=t2CheckInPoint(bank,along,side*2.318);
   front.scale.set(.966,1.07,1);front.position.set(x,floor+3.66,z);
   front.rotation.y=bankRotation+(side===1?0:Math.PI);front.userData.staticTerminalSign=true;
   parent.add(front);
  });
  for(const rail of t2CheckInQueueRails(bank)){
   put(frame,rail.along,.882,rail.across,.043,.055,rail.length);
   for(const end of [-1,1]){
    const across=rail.across+end*rail.length/2;
    put(brushedSteel,rail.along,.48,across,.056,.94,.056,0,postGeometry);
    put(satinSteel,rail.along,.046,across,.29,.052,.29,0,postGeometry);
    footprints.push(t2CheckInRect(bank,rail.along,across,.29,.29));
   }
  }
 }
 for(const kiosk of t2CheckInKiosks(b.x,b.z,b.depth)){
  checkInKiosk(at(kiosk),kiosk.side);
  footprints.push(t2CheckInRect(kiosk,0,0,.88,.61));
 }
 addFloorContactShadows(parent,floor+.002,footprints,.26);
 for(const {surface,geometry,items} of batches.values()){
  const mesh=instances(parent,geometry,surface,items);
  mesh.userData.staticFurnitureBatch=true;
 }
}
