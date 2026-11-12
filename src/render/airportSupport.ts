import * as THREE from 'three';
import type {Gate,TaxiEdge,TaxiNode} from '../data/airport';
import {box,canvasTexture,cylinder,instances,material} from './primitives';
import {batchStatic} from './surfaceDetail';
import {concourseForGate,planSupportBays} from './supportLayout';

type Instance = {x:number;y:number;z:number;sx?:number;sy?:number;sz?:number;ry?:number};

/** Small local, reusable ground-service models, combined into instanced batches. */
export function apronSupport(staticGroup:THREE.Group,groundGroup:THREE.Group,gates:Gate[],nodes:TaxiNode[],edges:TaxiEdge[]){
 const bays=planSupportBays(gates,nodes,edges);
 const mats={
  frame:material('#66767b',.68,.25),body:material('#c8d0d0',.64,.14),container:material('#aebabc',.56,.28),
  dark:material('#344248',.84,.08),blue:material('#3e6174',.8,.08),bag:material('#756e61',.9),
  yellow:material('#d8ae37',.75),red:material('#bc3e35',.9),white:material('#e5e5d9',.9),orange:material('#df7134',.84)
 };
 type Part=keyof typeof mats|'wheel'|'uld'|'cone'|'stairsRail'|'stairsBeam';
 const parts:Record<Part,Instance[]>={frame:[],body:[],container:[],dark:[],blue:[],bag:[],yellow:[],red:[],white:[],orange:[],wheel:[],uld:[],cone:[],stairsRail:[],stairsBeam:[]};
 const add=(kind:Part,x:number,y:number,z:number,sx=1,sy=1,sz=1)=>parts[kind].push({x,y,z,sx,sy,sz});
 const wheels=(x:number,z:number,halfWidth:number,halfLength:number)=>{for(const dx of [-halfWidth,halfWidth])for(const dz of [-halfLength,halfLength])add('wheel',x+dx,.29,z+dz);};
 const baggageCart=(x:number,z:number,variant:number)=>{
  add('frame',x,.48,z,2.2,.16,3.7);wheels(x,z,.91,1.35);
  for(const dx of [-1,1])for(const dz of [-1.65,1.65])add('frame',x+dx,.97,z+dz,.08,.94,.08);
  for(const dx of [-1,1])add('frame',x+dx,1.42,z,.08,.08,3.38);
  for(const dz of [-1.65,1.65])add('frame',x,1.42,z+dz,2,.08,.08);
  add(variant%2?'blue':'dark',x-.36,.83,z-.85,.78,.63,1.05);
  add('bag',x+.35,.79,z+.15,.72,.53,.9);add('dark',x-.30,.76,z+1.08,.85,.48,.76);
 };
 const containerDolly=(x:number,z:number)=>{
  add('frame',x,.45,z,2.35,.15,3.65);wheels(x,z,.95,1.35);
  for(const dz of [-.84,.84]){add('uld',x,1.27,z+dz,1.85,1.55,1.55);add('frame',x,1.36,z+dz+.785,1.4,.035,.025);}
 };
 const powerUnit=(x:number,z:number)=>{
  add('frame',x,.50,z,1.8,.18,2.65);wheels(x,z,.76,.88);
  add('body',x,1.12,z,1.65,1.08,2.30);add('yellow',x,1.50,z,1.68,.12,2.32);
  add('dark',x,1.08,z+1.16,1.18,.52,.035);
  for(const y of [.92,1.08,1.24])add('frame',x,y,z+1.19,1.08,.025,.025);
  add('frame',x,.49,z+1.58,.12,.12,.55);
 };
 const mobileStairs=(x:number,z:number)=>{
  add('frame',x,.45,z,2.25,.20,4.1);wheels(x,z,.94,1.45);
  for(let i=0;i<7;i++)add('body',x,.72+i*.31,z-1.52+i*.48,1.92,.12,.49);
  for(const dx of [-1,1])for(const [i,dz] of [[0,-1.48],[3,-.04],[6,1.40]] as const)add('frame',x+dx,1.11+i*.31,z+dz,.07,.78,.07);
  for(const dx of [-1,1]){add('stairsRail',x+dx,2.43,z-.04);add('stairsBeam',x+dx,1.63,z-.04);}
  add('yellow',x,2.83,z+1.57,2.02,.10,.53);
 };
 for(const [i,bay] of bays.entries()){
  const {x,z}=bay;
  // Red and white equipment parking outline, inspired by local apron guidance.
  for(const dz of [-2.8,2.8])for(let k=0;k<8;k++)add(k%2?'white':'red',x-6.125+k*1.75,.237,z+dz,1.75,.014,.14);
  for(const dx of [-7,7])for(let k=0;k<4;k++)add(k%2?'red':'white',x+dx,.237,z-2.1+k*1.4,.14,.014,1.4);
  if(i%7===0)mobileStairs(x-4.6,z);else baggageCart(x-4.6,z,i);
  if(i%3===0)baggageCart(x,z,i+1);else containerDolly(x,z);
  powerUnit(x+4.6,z);
  for(const dx of [-6.35,6.35]){add('cone',x+dx,.29,z+2.25);add('white',x+dx,.36,z+2.25,.20,.07,.20);}
 }
 const cube=new THREE.BoxGeometry(1,1,1),wheel=new THREE.CylinderGeometry(.29,.29,.18,12);wheel.rotateZ(Math.PI/2);
 const uld=new THREE.BoxGeometry(1,1,1),positions=uld.getAttribute('position');for(let i=0;i<positions.count;i++)if(positions.getY(i)<0&&positions.getX(i)<0)positions.setX(i,positions.getX(i)*.55);uld.computeVertexNormals();
 const cone=new THREE.ConeGeometry(.24,.58,12);
 const rail=new THREE.BoxGeometry(.07,.07,Math.hypot(2.88,1.86)),beam=new THREE.BoxGeometry(.16,.18,Math.hypot(2.88,1.86));rail.rotateX(-Math.atan2(1.86,2.88));beam.rotateX(-Math.atan2(1.86,2.88));
 for(const [kind,items] of Object.entries(parts) as [Part,Instance[]][]){
  if(!items.length)continue;const geometry=kind==='wheel'?wheel:kind==='uld'?uld:kind==='cone'?cone:kind==='stairsRail'?rail:kind==='stairsBeam'?beam:cube;
  const mat=kind==='wheel'?mats.dark:kind==='uld'?mats.container:kind==='cone'?mats.orange:kind==='stairsRail'||kind==='stairsBeam'?mats.frame:mats[kind];
  const mesh=instances(groundGroup,geometry,mat,items);mesh.castShadow=['body','container','uld','dark','blue','bag'].includes(kind);
 }

 // A single atlas keeps the gate identification signs to one material batch.
 const signGates=gates.filter(g=>!g.remote),columns=8,rows=Math.ceil(signGates.length/columns);
 const atlas=canvasTexture(columns*128,rows*64,ctx=>{ctx.fillStyle='#18384a';ctx.fillRect(0,0,columns*128,rows*64);ctx.font='bold 42px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f2f2e9';signGates.forEach((g,i)=>ctx.fillText(g.id,(i%columns)*128+64,Math.floor(i/columns)*64+33));});atlas.anisotropy=4;
 const signMaterial=new THREE.MeshStandardMaterial({map:atlas,roughness:.8,metalness:.03,emissive:'#4c5d66',emissiveMap:atlas,emissiveIntensity:.18});signMaterial.userData.noShadow=true;
 signGates.forEach((gate,i)=>{
  const c=concourseForGate(gate),side=Math.sign(gate.z-c.z)||1,x=gate.x-10;
  if(gate.terminal==='T3 North'&&(x< -1435||x> -745))return;
  const geo=new THREE.PlaneGeometry(3.8,1.35),uv=geo.getAttribute('uv'),col=i%columns,row=Math.floor(i/columns);
  for(let k=0;k<uv.count;k++)uv.setXY(k,(col+uv.getX(k))/columns,1-(row+1-uv.getY(k))/rows);
  const sign=new THREE.Mesh(geo,signMaterial);sign.position.set(x,5.3,c.z+side*(c.halfDepth+.08));sign.rotation.y=side<0?Math.PI:0;staticGroup.add(sign);
 });
 groundGroup.userData.supportBayCount=bays.length;
 return bays;
}

/** Four downward-facing floodlights on each existing apron mast. */
export function apronFloodlights(parent:THREE.Group,masts:{x:number;y:number;z:number}[]){
 const housing:Instance[]=[],lenses:Instance[]=[];for(const mast of masts)for(const dx of [-3,-1,1,3]){housing.push({x:mast.x+dx,y:23.58,z:mast.z,sx:1.45,sy:.48,sz:.9});lenses.push({x:mast.x+dx,y:23.32,z:mast.z,sx:1.13,sy:.025,sz:.65});}
 instances(parent,new THREE.BoxGeometry(1,1,1),material('#667780',.58,.28),housing);
 const lensMaterial=new THREE.MeshStandardMaterial({color:'#d6d8d0',emissive:'#edf1ff',emissiveIntensity:0,roughness:.35});
 instances(parent,new THREE.BoxGeometry(1,1,1),lensMaterial,lenses);
 return lensMaterial;
}

/** Two representative windsocks; their positions are scenery approximations. */
export function createWindsocks(staticGroup:THREE.Group,groundGroup:THREE.Group){
 const pole=material('#a9b2ae',.62,.3),red=material('#d55b44',.85),white=material('#ece9da',.9),socks:THREE.Group[]=[];
 for(const [x,z] of [[-1000,-910],[-1100,900]]){
  cylinder(staticGroup,.09,.13,7.2,x,3.6,z,pole,12);cylinder(staticGroup,.42,.46,.18,x,.09,z,pole,16);
  const sock=new THREE.Group();sock.position.set(x,7.05,z);groundGroup.add(sock);
  const radii=[.47,.40,.33,.26,.19,.12];for(let i=0;i<5;i++){const segment=new THREE.Mesh(new THREE.CylinderGeometry(radii[i+1],radii[i],.66,20,1,true),i%2?white:red);segment.rotation.x=Math.PI/2;segment.position.z=.33+i*.66;segment.castShadow=true;sock.add(segment);}
  batchStatic(sock);socks.push(sock);
 }
 return socks;
}
