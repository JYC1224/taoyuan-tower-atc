import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {mergeStaticMeshes} from '../src/render/mergeStaticMeshes';

test('static batching keeps the exact surfaces and UVs in separately cullable regions',()=>{
 const root=new THREE.Group(),wing=new THREE.Group(),stone=new THREE.MeshStandardMaterial();
 stone.userData.worldUV=.5;
 wing.position.set(8,0,6);root.add(wing);
 for(const x of [4,18,604,618]){
  const panel=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),stone);
  panel.position.set(x,7,16);panel.castShadow=panel.receiveShadow=true;wing.add(panel);
 }
 const expected=[] as number[][];
 root.updateMatrixWorld(true);
 const point=new THREE.Vector3();
 for(const mesh of wing.children as THREE.Mesh[]){
  const positions=mesh.geometry.getAttribute('position');
  for(let i=0;i<positions.count;i++)expected.push(point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).toArray());
 }
 mergeStaticMeshes(root);
 const batches=root.children.filter(object=>object instanceof THREE.Mesh);
 assert.equal(batches.length,2);
 const actual=[] as number[][];
 for(const {geometry,castShadow,receiveShadow} of batches){
  assert.equal(castShadow,true);assert.equal(receiveShadow,true);
  const positions=geometry.getAttribute('position'),uvs=geometry.getAttribute('uv');
  for(let i=0;i<positions.count;i++){
   const [x,y,z]=point.fromBufferAttribute(positions,i).toArray();
   actual.push([x,y,z]);
   assert.equal(uvs.getX(i),x*.5);assert.equal(uvs.getY(i),z*.5);
  }
 }
 assert.deepEqual(actual.sort(),expected.sort());
 const camera=new THREE.PerspectiveCamera(45,1,.15,2000);
 camera.position.set(21,7,120);camera.lookAt(21,7,22);camera.updateMatrixWorld(true);
 const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 assert.equal(batches.filter(mesh=>frustum.intersectsObject(mesh)).length,1);
});
