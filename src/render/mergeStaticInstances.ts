import * as THREE from 'three';

/**
 * Combine explicitly marked, immutable furniture batches that share geometry,
 * material and rendering flags. Each source keeps all of its instances intact;
 * modest spatial/floor buckets keep the resulting bounds useful for culling.
 */
export function mergeStaticInstances(root:THREE.Group){
 const buckets=new Map<string,THREE.InstancedMesh[]>(),relative=new THREE.Matrix4(),inverse=new THREE.Matrix4(),worldBounds=new THREE.Box3(),center=new THREE.Vector3();
 root.updateWorldMatrix(true,true);inverse.copy(root.matrixWorld).invert();
 root.traverse(object=>{
  if(!(object instanceof THREE.InstancedMesh)||!object.userData.staticFurnitureBatch||!object.visible||object.children.length||Array.isArray(object.material)||object.material.transparent||object.morphTexture||object.customDepthMaterial||object.customDistanceMaterial||object.material.onBeforeCompile!==THREE.Material.prototype.onBeforeCompile||object.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender)return;
  for(let p=object.parent;p&&p!==root;p=p.parent)if(!p.visible)return;
  relative.multiplyMatrices(inverse,object.matrixWorld);
  // Folding a non-uniform parent scale into the instance matrix can change
  // normal transformation. Leave those unusual objects untouched.
  const e=relative.elements,x=new THREE.Vector3(e[0],e[1],e[2]),y=new THREE.Vector3(e[4],e[5],e[6]),z=new THREE.Vector3(e[8],e[9],e[10]),s=x.length();
  if(s<1e-8||relative.determinant()<=0||Math.abs(y.length()-s)>1e-6||Math.abs(z.length()-s)>1e-6||Math.abs(x.dot(y))>1e-6||Math.abs(x.dot(z))>1e-6||Math.abs(y.dot(z))>1e-6)return;
  object.computeBoundingBox();if(!object.boundingBox||object.boundingBox.isEmpty())return;
  worldBounds.copy(object.boundingBox).applyMatrix4(relative);worldBounds.getCenter(center);
  // A wide source is kept separate so it cannot inflate many nearby bounds.
  if(worldBounds.max.x-worldBounds.min.x>800||worldBounds.max.z-worldBounds.min.z>800||worldBounds.max.y-worldBounds.min.y>16)return;
  const key=[object.geometry.uuid,object.material.uuid,object.layers.mask,object.castShadow,object.receiveShadow,object.renderOrder,object.frustumCulled,!!object.instanceColor,Math.floor(center.x/400),Math.floor(center.y/8),Math.floor(center.z/400)].join(':');
  const list=buckets.get(key);if(list)list.push(object);else buckets.set(key,[object]);
 });
 const instance=new THREE.Matrix4(),transform=new THREE.Matrix4(),color=new THREE.Color();
 for(const objects of buckets.values()){
  if(objects.length<2)continue;
  const first=objects[0],count=objects.reduce((n,o)=>n+o.count,0),merged=new THREE.InstancedMesh(first.geometry,first.material,count);
  merged.layers.mask=first.layers.mask;merged.castShadow=first.castShadow;merged.receiveShadow=first.receiveShadow;merged.renderOrder=first.renderOrder;merged.frustumCulled=first.frustumCulled;
  let index=0;
  for(const object of objects){
   transform.multiplyMatrices(inverse,object.matrixWorld);
   for(let i=0;i<object.count;i++){
    object.getMatrixAt(i,instance);instance.premultiply(transform);merged.setMatrixAt(index,instance);
    if(object.instanceColor){object.getColorAt(i,color);merged.setColorAt(index,color);}
    index++;
   }
  }
  merged.instanceMatrix.needsUpdate=true;if(merged.instanceColor)merged.instanceColor.needsUpdate=true;
  root.add(merged);
  for(const object of objects){object.removeFromParent();object.dispose();}
 }
}
