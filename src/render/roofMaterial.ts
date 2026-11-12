import * as THREE from 'three';

/** Fine, subdued metal variation in world space so merged roof pieces remain aligned. */
export function roofMaterial(color:THREE.ColorRepresentation,roughness=.62,metalness=.18){
 const material=new THREE.MeshStandardMaterial({color,roughness,metalness});
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 roofWorld;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nroofWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 roofWorld;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float roofGrain=sin(roofWorld.x*.73+sin(roofWorld.z*.08))*.012+sin(roofWorld.z*.25)*.012;
   float roofPanel=abs(fract(roofWorld.x/3.0)-.5);
   float roofSeam=smoothstep(.495-max(fwidth(roofWorld.x/3.0),.0001),.5,roofPanel);
   diffuseColor.rgb*=1.0+roofGrain-roofSeam*.045;
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor=clamp(roughnessFactor*(.96+.04*sin(roofWorld.x*.19)*sin(roofWorld.z*.17)),.04,1.0);
  `);
 };
 material.customProgramCacheKey=()=> 'architectural-roof-v1';
 return material;
}
