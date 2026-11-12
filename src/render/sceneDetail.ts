import * as THREE from 'three';
import type {Gate,Terminal} from '../data/airport';
import {box,canvasTexture,cylinder,instances,material,seeded} from './primitives';

/** Original cosmetic detail kept outside aircraft taxi/stand lead-in lanes. */
export function apronDetail(staticGroup:THREE.Group,groundGroup:THREE.Group,gates:Gate[],terminals:Terminal[]){
 const enclosure=material('#a5afad',.72,.12),rubber=material('#354341',.92),safety=material('#d7b34d',.8),vent=material('#586a70',.6,.22);
 for(const gate of gates.filter(g=>!g.remote)){
  const concourse=gate.id.startsWith('A')?-198:gate.id.startsWith('B')?90:gate.id.startsWith('C')?105:gate.terminal==='T3 North'?-240:-225;
  const side=Math.sign(gate.z-concourse),x=gate.x-27,z=concourse+side*18;
  box(staticGroup,1.2,1.35,.65,x,.675,z,enclosure);box(staticGroup,1.27,.08,.73,x,1.39,z,enclosure);
  for(let h=.38;h<1.12;h+=.11)box(staticGroup,.78,.035,.02,x,h,z+side*.34,vent);
  for(const dx of [-.9,.9])cylinder(staticGroup,.09,.09,.8,x+dx,.4,z+side*.55,safety,8);
 }
 const stains=canvasTexture(512,512,ctx=>{
  const rand=seeded(774);for(let i=0;i<48;i++){const x=110+rand()*290,y=100+rand()*290,r=8+rand()*37,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(33,31,26,${.015+rand()*.035})`);g.addColorStop(1,'rgba(33,31,26,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  for(const side of [-1,1])for(let i=0;i<12;i++){ctx.strokeStyle=`rgba(38,37,32,${.012+rand()*.02})`;ctx.lineWidth=2+rand()*5;ctx.beginPath();ctx.moveTo(256+side*(40+rand()*55),125);ctx.bezierCurveTo(256+side*75,200,256+side*115,270,256+side*150,350+rand()*50);ctx.stroke();}
 });
 const mat=new THREE.MeshStandardMaterial({map:stains,transparent:true,opacity:.7,depthWrite:false,roughness:.92,polygonOffset:true,polygonOffsetFactor:-1});
 const plane=new THREE.PlaneGeometry(1,1);plane.rotateX(-Math.PI/2);const items=gates.map(g=>({x:g.x,y:.225,z:g.z,sx:68,sy:1,sz:82}));instances(groundGroup,plane,mat,items);
 for(const t of terminals.filter(t=>t.id==='T2'))for(let x=-t.width*.32;x<t.width*.35;x+=25){
  const y=t.height+4.4,z=t.z+t.depth*.23;box(staticGroup,5,1.25,3,t.x+x,y+.63,z,enclosure);box(staticGroup,5.2,.12,3.2,t.x+x,y+1.31,z,vent);
  for(const dx of [-1.2,1.2]){const fan=cylinder(staticGroup,.75,.75,.13,t.x+x+dx,y+1.44,z,rubber,16);fan.castShadow=false;}
 }
}

export function cabFinish(parent:THREE.Group,floor:number,radius:number){
 const map=canvasTexture(512,512,ctx=>{ctx.fillStyle='#d0d1c9';ctx.fillRect(0,0,512,512);const rand=seeded(367);ctx.strokeStyle='#929d992c';ctx.lineWidth=1;for(let x=0;x<=512;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,512);ctx.moveTo(0,x);ctx.lineTo(512,x);ctx.stroke();}for(let i=0;i<9000;i++){ctx.fillStyle=`rgba(77,82,78,${rand()*.11})`;ctx.fillRect(rand()*512,rand()*512,1,1);}});
 // A restrained baked bounce term keeps an unlit downward-facing ceiling from
 // receiving only the green ground hemisphere; it follows day/night in the scene.
 const mat=new THREE.MeshStandardMaterial({color:'#f0f1ef',map,roughness:.95,emissive:'#c6cbd0',emissiveIntensity:.38}),ceiling=new THREE.Mesh(new THREE.CircleGeometry(radius*.95,64),mat);ceiling.rotation.x=Math.PI/2;ceiling.position.y=floor+5.13;parent.add(ceiling);
 const rail=material('#7f8c90',.45,.4),light=new THREE.MeshBasicMaterial({color:'#d3dfd7',toneMapped:false});
 for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.sin(a)*radius*.72,z=Math.cos(a)*radius*.72;box(parent,3.2,.055,.30,x,floor+5.05,z,rail,a);box(parent,2.95,.012,.18,x,floor+5.012,z,light,a);}
 return mat;
}
