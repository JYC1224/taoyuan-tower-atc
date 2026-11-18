import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {mergeStaticSigns} from '../src/render/mergeStaticSigns';

function vertices(root:THREE.Group){
 const result:string[]=[],point=new THREE.Vector3();root.updateWorldMatrix(true,true);
 root.traverse(object=>{
  if(!(object instanceof THREE.Mesh)||object instanceof THREE.InstancedMesh||!object.geometry.index)return;
  const p=object.geometry.getAttribute('position'),uv=object.geometry.getAttribute('uv'),index=object.geometry.index;
  for(let i=0;i<index.count;i++){const n=index.getX(i);point.fromBufferAttribute(p,n).applyMatrix4(object.matrixWorld);result.push([object.layers.mask,point.x,point.y,point.z,uv.getX(n),uv.getY(n)].map(v=>typeof v==='number'?v.toFixed(4):v).join(','));}
 });
 return result.sort();
}

test('sign merging preserves both faces, UVs, transforms and reflection layers',()=>{
 const root=new THREE.Group(),nested=new THREE.Group(),material=new THREE.MeshBasicMaterial(),shared=new THREE.PlaneGeometry(8,2);root.position.set(8,0,3);nested.position.set(5,1,7);nested.rotation.y=.3;root.add(nested);
 for(const angle of [0,Math.PI]){const face=new THREE.Mesh(shared,material);face.position.z=angle?-.02:.02;face.rotation.y=angle;face.layers.enable(2);face.userData.staticTerminalSign=true;nested.add(face);}
 const expected=vertices(root);mergeStaticSigns(root);assert.deepEqual(vertices(root),expected);
 const signs=root.children.filter((o):o is THREE.Mesh=>o instanceof THREE.Mesh);assert.equal(signs.length,1);assert.equal(signs[0].layers.mask,5);
});

test('unmarked, transparent and differently layered signs stay separate',()=>{
 const root=new THREE.Group(),geometry=new THREE.PlaneGeometry(1,1),material=new THREE.MeshBasicMaterial();
 const add=()=>{const mesh=new THREE.Mesh(geometry,material);mesh.userData.staticTerminalSign=true;root.add(mesh);return mesh;};
 const a=add(),b=add(),unmarked=add(),otherLayer=add(),transparent=add();delete unmarked.userData.staticTerminalSign;otherLayer.layers.enable(3);transparent.material=new THREE.MeshBasicMaterial({transparent:true});
 const expected=vertices(root);mergeStaticSigns(root);assert.deepEqual(vertices(root),expected);assert.equal(a.parent,null);assert.equal(b.parent,null);for(const mesh of [unmarked,otherLayer,transparent])assert.ok(mesh.parent);
});
