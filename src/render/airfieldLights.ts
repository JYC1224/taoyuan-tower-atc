import * as THREE from 'three';
export type Lamp={x:number;y:number;z:number;aim?:number};
/** One draw call, soft pixel-sized lenses. Threshold colours are view-directional. */
export function airfieldLights(parent:THREE.Group,white:Lamp[],blue:Lamp[],red:Lamp[],green:Lamp[]){
 const p:number[]=[],colors:number[]=[],aims:number[]=[];
 for(const [items,color]of [[white,'#ffeac8'],[blue,'#378cff'],[red,'#ff4430'],[green,'#65ffa0']] as [Lamp[],string][]){const c=new THREE.Color(color);for(const l of items){p.push(l.x,l.y,l.z);colors.push(c.r,c.g,c.b);aims.push(l.aim??0);}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('lampColor',new THREE.Float32BufferAttribute(colors,3));geo.setAttribute('aim',new THREE.Float32BufferAttribute(aims,1));
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{night:{value:0},pixelRatio:{value:1}},vertexShader:`
 #include <common>
 #include <logdepthbuf_pars_vertex>
 attribute vec3 lampColor;attribute float aim;varying vec3 vColor;varying float vFacing;uniform float night,pixelRatio;void main(){vec4 world=modelMatrix*vec4(position,1.0);vec4 mv=viewMatrix*world;vColor=lampColor;vFacing=abs(aim)<.5?1.0:smoothstep(0.0,.1,(cameraPosition.x-world.x)*aim/max(1.0,length(cameraPosition-world.xyz)));gl_Position=projectionMatrix*mv;gl_PointSize=(mix(1.35,3.8,night)+min(3.0,100.0/max(1.0,-mv.z)))*pixelRatio;
 #include <logdepthbuf_vertex>
 }`,fragmentShader:`
 #include <logdepthbuf_pars_fragment>
 varying vec3 vColor;varying float vFacing;uniform float night;void main(){
 #include <logdepthbuf_fragment>
 float d=length(gl_PointCoord-.5)*2.0;float alpha=exp(-d*d*4.5)*(1.0-smoothstep(.75,1.0,d))*vFacing;gl_FragColor=vec4(vColor,alpha*mix(.6,1.0,night));
 #include <colorspace_fragment>
 }`});const points=new THREE.Points(geo,mat);points.frustumCulled=false;parent.add(points);return mat;
}
