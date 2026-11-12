import * as THREE from 'three';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';

// Local, checksum-verified CC0 images. No runtime request to an asset service.
const root=new URL('assets/realism/',document.baseURI).href;
const loader=new THREE.TextureLoader();
const pending:Promise<unknown>[]=[];
const sets=new Map<string,Promise<{color:THREE.Texture;normal:THREE.Texture;roughness:THREE.Texture}>>();
const load=(name:string,color=false)=>{
 const promise=loader.loadAsync(root+name).then(texture=>{texture.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=8;texture.userData.shared=true;return texture;});pending.push(promise);return promise;
};
export function surfaceImages(kind:'concrete'|'asphalt'|'runway'|'facade'){
 const id=kind==='facade'?'rectangular_facade_tiles_02':kind==='concrete'?'concrete_floor_worn_001':kind==='runway'?'aerial_asphalt_01':'asphalt_01';let set=sets.get(id);
 const files=kind==='facade'?['rectangular_facade_tiles_02-Diffuse-1k.jpg','rectangular_facade_tiles_02-NormalGL-1k.jpg','rectangular_facade_tiles_02-Rough-1k.jpg']:kind==='runway'?['aerial_asphalt_01-Diffuse-2k.jpg','aerial_asphalt_01-NormalGL-2k.jpg','aerial_asphalt_01-Rough-2k.jpg']:[id+'-Diffuse.jpg',id+'-nor_gl.jpg',id+'-Rough.jpg'];
 if(!set){set=Promise.all([load(files[0],true),load(files[1]),load(files[2])]).then(([color,normal,roughness])=>({color,normal,roughness}));sets.set(id,set);}return set;
}
let hdr:Promise<THREE.DataTexture>|undefined;
export function skyImage(){
 hdr??=new HDRLoader().loadAsync(root+'kloppenheim_06_puresky-hdri.hdr').then(texture=>{texture.mapping=THREE.EquirectangularReflectionMapping;return texture;});return hdr;
}
export async function realEnvironment(renderer:THREE.WebGLRenderer){
 const texture=await skyImage(),generator=new THREE.PMREMGenerator(renderer);generator.compileEquirectangularShader();const environment=generator.fromEquirectangular(texture);generator.dispose();await Promise.all(pending);return environment;
}
