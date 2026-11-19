import * as THREE from 'three';
import {canvasTexture,instances,material} from './primitives';
import type {BuildingRect} from './terminalBuildingLayout';
import {terminalFloorMaterial} from './terminalFloorLighting';
import {MOVING_WALKWAY_END_CLEARANCE,movingWalkwayRailOffset} from './terminalConcourseLayout';

const cube=new THREE.BoxGeometry(1,1,1);
const steel=material('#a7b1b2',.39,.47),rubber=material('#333734',.40,.2);
const glass=new THREE.MeshPhysicalMaterial({
 color:'#aabfbe',roughness:.24,metalness:.05,transparent:true,opacity:.31,depthWrite:false,forceSinglePass:true,
});
type Part=Parameters<typeof instances>[3][number];
let treadMaterial:THREE.MeshPhysicalMaterial|undefined;

function treadFinish(){
 if(treadMaterial)return treadMaterial;
 const tread=canvasTexture(64,64,ctx=>{
  ctx.fillStyle='#6c6c68';ctx.fillRect(0,0,64,64);
  for(let x=0;x<64;x+=8){
   ctx.fillStyle='#363a38';ctx.fillRect(x,0,3,64);
   ctx.fillStyle='#9b9c94';ctx.fillRect(x+3,0,1,64);
  }
 });
 tread.wrapS=tread.wrapT=THREE.RepeatWrapping;
 treadMaterial=terminalFloorMaterial('satin',{color:'#a09e92',map:tread,bumpMap:tread,bumpScale:.002,roughness:.68});
 treadMaterial.userData.worldUV=3.4;
 return treadMaterial;
}

export function buildMovingWalkways(parent:THREE.Object3D,y:number,belts:readonly BuildingRect[]){
 if(!belts.length)return;
 const trim:Part[]=[],handrails:Part[]=[],posts:Part[]=[],panels:Part[]=[],ends:Part[]=[];
 for(const belt of belts){
  const tread=new THREE.Mesh(new THREE.PlaneGeometry(belt.width-1.2,belt.depth-.38),treadFinish());
  tread.rotation.x=-Math.PI/2;tread.position.set(belt.x,y+.028,belt.z);tread.receiveShadow=true;parent.add(tread);
  for(const side of [-1,1]){
   const z=belt.z+side*movingWalkwayRailOffset(belt);
   trim.push({x:belt.x,y:y+.059,z,sx:belt.width,sy:.10,sz:.22});
   panels.push({x:belt.x,y:y+.515,z,sx:belt.width-MOVING_WALKWAY_END_CLEARANCE,sy:.77,sz:.046});
   handrails.push({x:belt.x,y:y+.922,z,sx:belt.width-1.70,sy:.083,sz:.135});
   for(let dx=-belt.width/2+1.22;dx<belt.width/2-1.12;dx+=4.1){
    posts.push({x:belt.x+dx,y:y+.505,z,sx:.069,sy:.80,sz:.069});
   }
   ends.push({x:belt.x+side*(belt.width/2-.36),y:y+.024,z:belt.z,sx:.71,sy:.035,sz:belt.depth-.40});
  }
 }
 for(const [finish,parts] of [[steel,trim],[rubber,handrails],[steel,posts],[glass,panels],[steel,ends]] as const){
  instances(parent,cube,finish,parts).userData.staticFurnitureBatch=true;
 }
}
