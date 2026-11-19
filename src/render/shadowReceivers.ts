import * as THREE from 'three';

/** Bounds the frustum swept from each visible receiver toward the sun. */
export class ShadowReceivers {
 private readonly planes=Array.from({length:15},()=>new THREE.Plane());
 private readonly projection=new Float64Array(6);
 private count=0;

 set(view:THREE.Frustum,towardSun:THREE.Vector3){
  const faces=view.planes;
  this.count=0;
  for(let i=0;i<faces.length;i++){
   const dot=faces[i].normal.dot(towardSun);
   this.projection[i]=dot;
   // Walking toward the light stays inside these half-spaces.
   if(dot>=0)this.planes[this.count++].copy(faces[i]);
  }
  // Pair each remaining face with an inward face. The positive linear
  // combination passes along the light ray, forming the swept silhouette.
  for(let i=0;i<faces.length;i++){
   const inward=this.projection[i];
   if(inward<=1e-6)continue;
   for(let j=0;j<faces.length;j++){
    const outward=-this.projection[j];
    if(outward<=1e-6)continue;
    const plane=this.planes[this.count];
    plane.normal.copy(faces[i].normal).multiplyScalar(outward).addScaledVector(faces[j].normal,inward);
    if(plane.normal.lengthSq()<1e-12)continue;
    plane.constant=faces[i].constant*outward+faces[j].constant*inward;
    plane.normalize();this.count++;
   }
  }
 }

 intersects(sphere:THREE.Sphere,padding:number){
  const limit=-sphere.radius-padding;
  for(let i=0;i<this.count;i++)if(this.planes[i].distanceToPoint(sphere.center)<limit)return false;
  return true;
 }
}

export function staticShadowCasters(root:THREE.Group){
 const casters:{mesh:THREE.Mesh;bounds:THREE.Sphere}[]=[];
 root.traverse(object=>{
  if(!(object instanceof THREE.Mesh)||!object.castShadow||!object.frustumCulled||object instanceof THREE.SkinnedMesh||object.morphTargetInfluences)return;
  const materials=(Array.isArray(object.material)?object.material:[object.material]) as THREE.MeshStandardMaterial[];
  if(object.customDepthMaterial||materials.some(material=>material.displacementMap))return;
  const source=object instanceof THREE.InstancedMesh?object:object.geometry;
  if(!source.boundingSphere)source.computeBoundingSphere();
  const sphere=source.boundingSphere;
  if(sphere&&!sphere.isEmpty())casters.push({mesh:object,bounds:sphere.clone().applyMatrix4(object.matrixWorld)});
 });
 return casters;
}
