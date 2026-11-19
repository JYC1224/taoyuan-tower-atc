import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {applyFacadeUV,applyWorldUV} from './surfaceDetail';

/** Batch nearby opaque surfaces while keeping each region independently cullable. */
export function mergeStaticMeshes(root:THREE.Group){
 const buckets=new Map<string,THREE.Mesh<THREE.BufferGeometry,THREE.Material>[]>();
 const inverse=new THREE.Matrix4(),relative=new THREE.Matrix4(),bounds=new THREE.Box3(),center=new THREE.Vector3(),size=new THREE.Vector3();
 root.updateWorldMatrix(true,true);inverse.copy(root.matrixWorld).invert();
 root.traverse(object=>{
  if(!(object instanceof THREE.Mesh)||object instanceof THREE.InstancedMesh||Array.isArray(object.material)||
   object.material instanceof THREE.MeshBasicMaterial||!object.geometry.index||object.material.transparent||
   !object.visible||object.children.length||object.customDepthMaterial||object.customDistanceMaterial||
   object.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender)return;
  for(let parent=object.parent;parent&&parent!==root;parent=parent.parent){
   if(!parent.visible||parent instanceof THREE.LOD)return;
  }
  const mat=object.material,geometry=object.geometry as THREE.BufferGeometry;
  object.castShadow=object.castShadow&&!mat.userData.noShadow;
  if(!geometry.boundingBox)geometry.computeBoundingBox();
  relative.multiplyMatrices(inverse,object.matrixWorld);
  bounds.copy(geometry.boundingBox!).applyMatrix4(relative);
  bounds.getCenter(center);bounds.getSize(size);
  const cell=size.x>320||size.z>320?object.id:`${Math.floor(center.x/240)},${Math.floor(center.y/10)},${Math.floor(center.z/240)}`;
  const attributes=Object.entries(geometry.attributes).map(([name,attr])=>`${name}:${attr.itemSize}:${attr.normalized}:${attr.array.constructor.name}`).sort().join(',');
  const key=[mat.uuid,object.layers.mask,object.castShadow,object.receiveShadow,object.renderOrder,object.frustumCulled,cell,attributes].join('|');
  const batch=buckets.get(key);
  if(batch)batch.push(object);else buckets.set(key,[object]);
 });
 const originalGeometries=new Set<THREE.BufferGeometry>();
 for(const objects of buckets.values()){
  const first=objects[0],mat=first.material;
  if(objects.length===1&&!mat.userData.worldUV&&!mat.userData.facade)continue;
  const parts=objects.map(object=>{
   const geometry=object.geometry.clone().applyMatrix4(relative.multiplyMatrices(inverse,object.matrixWorld));
   if(mat.userData.worldUV)applyWorldUV(geometry,mat.userData.worldUV);
   if(mat.userData.facade)applyFacadeUV(geometry);
   return geometry;
  });
  const merged=parts.length===1?parts[0]:mergeGeometries(parts);
  if(parts.length>1)parts.forEach(geometry=>geometry.dispose());
  if(!merged)continue;
  const mesh=new THREE.Mesh(merged,mat);
  mesh.layers.mask=first.layers.mask;mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow;
  mesh.renderOrder=first.renderOrder;mesh.frustumCulled=first.frustumCulled;root.add(mesh);
  for(const object of objects){originalGeometries.add(object.geometry);object.removeFromParent();}
 }
 for(const geometry of originalGeometries)geometry.dispose();
}
