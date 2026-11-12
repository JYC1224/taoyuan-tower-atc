import * as THREE from 'three';
import {canvasTexture,instances} from './primitives';

/** Visible obstruction beacons for the control tower and construction cranes. */
export function obstructionLights(parent:THREE.Group,positions:{x:number;y:number;z:number}[]){
 const bulb=new THREE.MeshBasicMaterial({color:'#ff4c36',transparent:true,opacity:.5,depthWrite:false,toneMapped:false});
 instances(parent,new THREE.SphereGeometry(.55,10,8),bulb,positions);
 const texture=canvasTexture(64,64,ctx=>{
  const gradient=ctx.createRadialGradient(32,32,0,32,32,31);
  gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.2,'rgba(255,255,255,.65)');gradient.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
 });
 const glow=new THREE.PointsMaterial({color:'#ff3928',map:texture,size:16,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions.flatMap(p=>[p.x,p.y,p.z]),3));
 parent.add(new THREE.Points(geometry,glow));
 return {bulb,glow};
}
