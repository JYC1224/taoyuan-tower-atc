import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {mergeStaticInstances} from '../src/render/mergeStaticInstances';

function records(root:THREE.Group){
 const out:string[]=[],matrix=new THREE.Matrix4(),world=new THREE.Matrix4(),color=new THREE.Color();root.updateWorldMatrix(true,true);
 root.traverse(o=>{if(!(o instanceof THREE.InstancedMesh))return;for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);world.multiplyMatrices(o.matrixWorld,matrix);if(o.instanceColor)o.getColorAt(i,color);else color.setRGB(1,1,1);out.push([o.layers.mask,o.castShadow,o.receiveShadow,o.material instanceof THREE.Material?o.material.uuid:'array',...world.elements.map(v=>v.toFixed(4)),color.r.toFixed(4),color.g.toFixed(4),color.b.toFixed(4)].join('|'));}});
 return out.sort();
}

test('merging furniture preserves each instance transform, colour and rendering flags',()=>{
 const root=new THREE.Group(),parent=new THREE.Group(),geometry=new THREE.BoxGeometry(1,1,1),material=new THREE.MeshStandardMaterial();
 root.position.set(20,2,-30);parent.position.set(4,0,5);parent.rotation.y=.3;root.add(parent);
 const add=(x:number,color:number)=>{const mesh=new THREE.InstancedMesh(geometry,material,1),matrix=new THREE.Matrix4().compose(new THREE.Vector3(x,1,2),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),.15),new THREE.Vector3(1,2,3));mesh.setMatrixAt(0,matrix);mesh.setColorAt(0,new THREE.Color(color));mesh.userData.staticFurnitureBatch=true;mesh.layers.enable(2);mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 add(1,0xff0000);add(3,0x00ff00);
 const expected=records(root);mergeStaticInstances(root);
 assert.deepEqual(records(root),expected);
 const merged=root.children.find((o):o is THREE.InstancedMesh=>o instanceof THREE.InstancedMesh);
 assert.ok(merged);assert.equal(merged.count,2);assert.equal(merged.layers.mask,5);assert.equal(merged.receiveShadow,true);
});

test('different layers, floors, transparency and unmarked objects remain separate',()=>{
 const root=new THREE.Group(),geometry=new THREE.BoxGeometry(1,1,1),material=new THREE.MeshStandardMaterial();
 const add=(x:number,y:number)=>{const mesh=new THREE.InstancedMesh(geometry,material,1);mesh.setMatrixAt(0,new THREE.Matrix4().makeTranslation(x,y,0));mesh.userData.staticFurnitureBatch=true;root.add(mesh);return mesh;};
 const nearA=add(1,1),nearB=add(2,1),upper=add(3,21),layer=add(4,1),unmarked=add(5,1),transparent=add(6,1),customShader=add(8,1),scaledParent=new THREE.Group();
 layer.layers.enable(3);delete unmarked.userData.staticFurnitureBatch;transparent.material=new THREE.MeshStandardMaterial({transparent:true});
 customShader.material=new THREE.MeshStandardMaterial();customShader.material.onBeforeCompile=()=>{};
 scaledParent.scale.set(2,1,1);root.add(scaledParent);const scaled=add(7,1);scaled.removeFromParent();scaledParent.add(scaled);
 const expected=records(root);mergeStaticInstances(root);
 assert.deepEqual(records(root),expected);
 assert.equal(nearA.parent,null);assert.equal(nearB.parent,null);
 for(const object of [upper,layer,unmarked,transparent,customShader,scaled])assert.ok(object.parent);
});
