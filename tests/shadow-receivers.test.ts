import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {ShadowReceivers} from '../src/render/shadowReceivers';

test('the receiver frustum keeps casters outside the picture when they can shade visible surfaces',()=>{
 const camera=new THREE.PerspectiveCamera(53,16/9,.15,40000);
 camera.position.set(54,46,-112);camera.lookAt(0,10,-730);camera.updateMatrixWorld(true);
 const view=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 const volume=new ShadowReceivers();
 for(const direction of [new THREE.Vector3(.16,1,-.36),new THREE.Vector3(-.6,.15,.7),new THREE.Vector3(0,1,0)]){
  volume.set(view,direction);
  for(const x of [-.99,0,.99])for(const y of [-.99,0,.99])for(const z of [-.9,0,.99]){
   const receiver=new THREE.Vector3(x,y,z).unproject(camera);
   assert.ok(view.containsPoint(receiver));
   for(const length of [0,10,750,4500]){
    const caster=new THREE.Sphere(receiver.clone().addScaledVector(direction,length),.01);
    assert.ok(volume.intersects(caster,0),`Lost a caster at ${caster.center.toArray()}`);
   }
  }
 }
});

test('unrelated shadows are rejected and near-boundary PCF samples are retained',()=>{
 const camera=new THREE.OrthographicCamera(-2,2,2,-2,1,5);
 camera.updateMatrixWorld(true);
 const view=new THREE.Frustum().setFromProjectionMatrix(camera.projectionMatrix);
 const volume=new ShadowReceivers();volume.set(view,new THREE.Vector3(.5,1,0));
 assert.equal(volume.intersects(new THREE.Sphere(new THREE.Vector3(5,1,-3),.1),0),false);
 assert.equal(volume.intersects(new THREE.Sphere(new THREE.Vector3(5,8,-3),.1),0),true);
 const nearEdge=new THREE.Sphere(new THREE.Vector3(0,0,-.8),.1);
 assert.equal(volume.intersects(nearEdge,0),false);
 assert.equal(volume.intersects(nearEdge,.25),true);
});
