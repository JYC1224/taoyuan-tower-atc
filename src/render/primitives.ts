import * as THREE from 'three';

export const material = (color:THREE.ColorRepresentation, roughness=.75, metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
export function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material,rotation=0) {
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.rotation.y=rotation;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
export function cylinder(parent:THREE.Object3D,top:number,bottom:number,height:number,x:number,y:number,z:number,mat:THREE.Material,segments=24) {
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,height,segments),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
export function pavement(parent:THREE.Object3D,a:{x:number;z:number},b:{x:number;z:number},width:number,mat:THREE.Material,y=.05) {
 const dx=b.x-a.x,dz=b.z-a.z,paint=width<2&&y<1;return box(parent,width,paint?.002:.08,Math.hypot(dx,dz),(a.x+b.x)/2,paint?.212:y,(a.z+b.z)/2,mat,Math.atan2(dx,dz));
}
export function line(parent:THREE.Object3D,points:THREE.Vector3[],color:THREE.ColorRepresentation,opacity=1) {
 const result=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));parent.add(result);return result;
}
export function canvasTexture(width:number,height:number,paint:(ctx:CanvasRenderingContext2D)=>void) {
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d')!;paint(ctx);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}
export function groundText(parent:THREE.Object3D,text:string,x:number,z:number,w:number,h:number,rotation=-Math.PI/2,color='#eee9d9',bg?:string) {
 const texture=canvasTexture(512,256,ctx=>{if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,512,256);}ctx.fillStyle=color;ctx.font='bold 170px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,135,495);});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,transparent:true,depthWrite:false,roughness:.9,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));mesh.rotation.x=-Math.PI/2;mesh.rotation.z=rotation;mesh.position.set(x,.218,z);mesh.userData.distantGroundText=true;parent.add(mesh);return mesh;
}
export function seeded(seed:number) {let value=seed;return()=>{value=(Math.imul(1664525,value)+1013904223)>>>0;return value/4294967296;};}
export function instances(parent:THREE.Object3D,geometry:THREE.BufferGeometry,mat:THREE.Material,items:{x:number;y:number;z:number;sx?:number;sy?:number;sz?:number;ry?:number;color?:THREE.ColorRepresentation}[]) {
 const instanced=new THREE.InstancedMesh(geometry,mat,items.length),dummy=new THREE.Object3D(),tint=new THREE.Color();items.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.scale.set(p.sx??1,p.sy??1,p.sz??1);dummy.rotation.y=p.ry??0;dummy.updateMatrix();instanced.setMatrixAt(i,dummy.matrix);if(p.color){tint.set(p.color);instanced.setColorAt(i,tint);}});if(instanced.instanceColor)instanced.instanceColor.needsUpdate=true;instanced.receiveShadow=true;parent.add(instanced);return instanced;
}
