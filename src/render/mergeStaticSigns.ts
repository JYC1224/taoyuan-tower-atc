import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Merge only explicitly marked, opaque, unlit signs with identical materials. */
export function mergeStaticSigns(root:THREE.Group){
 const buckets=new Map<string,THREE.Mesh[]>(),inverse=new THREE.Matrix4(),relative=new THREE.Matrix4(),position=new THREE.Vector3();
 root.updateWorldMatrix(true,true);inverse.copy(root.matrixWorld).invert();
 root.traverse(object=>{
  if(!(object instanceof THREE.Mesh)||object instanceof THREE.InstancedMesh||!object.userData.staticTerminalSign||!object.visible||object.children.length||!(object.material instanceof THREE.MeshBasicMaterial)||object.material.transparent||object.material.onBeforeCompile!==THREE.Material.prototype.onBeforeCompile||object.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender||!object.geometry.index)return;
  for(let p=object.parent;p&&p!==root;p=p.parent)if(!p.visible)return;
  relative.multiplyMatrices(inverse,object.matrixWorld);if(relative.determinant()<=0)return;
  position.setFromMatrixPosition(relative);
  const key=[object.material.uuid,object.layers.mask,object.castShadow,object.receiveShadow,object.renderOrder,object.frustumCulled,Math.floor(position.x/400),Math.floor(position.y/8),Math.floor(position.z/400)].join(':');
  const list=buckets.get(key);if(list)list.push(object);else buckets.set(key,[object]);
 });
 for(const objects of buckets.values()){
  if(objects.length<2)continue;
  const geometries=objects.map(object=>object.geometry.clone().applyMatrix4(relative.multiplyMatrices(inverse,object.matrixWorld)));
  const geometry=mergeGeometries(geometries);for(const part of geometries)part.dispose();if(!geometry)continue;
  const first=objects[0],merged=new THREE.Mesh(geometry,first.material);merged.layers.mask=first.layers.mask;merged.castShadow=first.castShadow;merged.receiveShadow=first.receiveShadow;merged.renderOrder=first.renderOrder;merged.frustumCulled=first.frustumCulled;root.add(merged);
  // These sign pairs share a source geometry, so dispose each source only once.
  const originals=new Set<THREE.BufferGeometry>();for(const object of objects){originals.add(object.geometry);object.removeFromParent();}for(const original of originals)original.dispose();
 }
}
