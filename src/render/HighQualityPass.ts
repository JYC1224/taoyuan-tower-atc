import * as THREE from 'three';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';

/**
 * High-quality edge smoothing after the scene has been drawn to the default
 * framebuffer. Keeping the post pass on the already tone-mapped image avoids
 * half-float intermediate targets, which can fail on some WebGL2/ANGLE GPUs.
 * High mode still uses native antialiasing, supersampling, detailed shadows,
 * environment reflections and high-resolution ground materials.
 */
export class HighQualityPass {
 private texture:THREE.FramebufferTexture|null=null;
 private readonly material=new THREE.ShaderMaterial({
  depthTest:false,
  depthWrite:false,
  toneMapped:false,
  uniforms:{image:{value:null},pixel:{value:new THREE.Vector2()}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
  fragmentShader:`
   uniform sampler2D image;uniform vec2 pixel;varying vec2 vUv;
   void main(){
    vec3 nw=texture2D(image,vUv+vec2(-1.0,-1.0)*pixel).rgb;
    vec3 ne=texture2D(image,vUv+vec2(1.0,-1.0)*pixel).rgb;
    vec3 sw=texture2D(image,vUv+vec2(-1.0,1.0)*pixel).rgb;
    vec3 se=texture2D(image,vUv+pixel).rgb;
    vec3 center=texture2D(image,vUv).rgb;
    vec3 weights=vec3(.299,.587,.114);
    float a=dot(nw,weights),b=dot(ne,weights),c=dot(sw,weights),d=dot(se,weights),l=dot(center,weights);
    float low=min(l,min(min(a,b),min(c,d))),high=max(l,max(max(a,b),max(c,d)));
    // Flat pixels already return the original colour. Avoid four more texture
    // reads there, while leaving the edge filter and output colour unchanged.
    if(high-low<.045){gl_FragColor=vec4(center,1.0);return;}
    vec2 direction=vec2(-((a+b)-(c+d)),(a+c)-(b+d));
    float reduce=max((a+b+c+d)*.03125,.0078125);
    direction=clamp(direction/(min(abs(direction.x),abs(direction.y))+reduce),vec2(-6.0),vec2(6.0))*pixel;
    vec3 mid=.5*(texture2D(image,vUv-direction/6.0).rgb+texture2D(image,vUv+direction/6.0).rgb);
    vec3 wide=mid*.5+.25*(texture2D(image,vUv-direction*.5).rgb+texture2D(image,vUv+direction*.5).rgb);
    float result=dot(wide,weights);
    vec3 antialiased=result<low||result>high?mid:wide;
    gl_FragColor=vec4(mix(center,antialiased,.7),1.0);
   }
  `
 });
 private readonly quad=new FullScreenQuad(this.material);

 constructor(private readonly renderer:THREE.WebGLRenderer,private readonly scene:THREE.Scene,private readonly camera:THREE.Camera){}

 resize(width:number,height:number){
  const ratio=this.renderer.getPixelRatio(),pixelWidth=Math.floor(width*ratio),pixelHeight=Math.floor(height*ratio);
  if(this.texture?.image.width===pixelWidth&&this.texture?.image.height===pixelHeight)return;
  this.texture?.dispose();
  this.texture=new THREE.FramebufferTexture(pixelWidth,pixelHeight);
  this.texture.minFilter=this.texture.magFilter=THREE.LinearFilter;
  this.material.uniforms.image.value=this.texture;
  this.material.uniforms.pixel.value.set(1/pixelWidth,1/pixelHeight);
 }

 render(){
  this.renderer.render(this.scene,this.camera);
  if(!this.texture)return;
  this.renderer.copyFramebufferToTexture(this.texture);
  const autoReset=this.renderer.info.autoReset;this.renderer.info.autoReset=false;
  this.quad.render(this.renderer);
  this.renderer.info.autoReset=autoReset;
 }

 dispose(){this.texture?.dispose();this.material.dispose();this.quad.dispose();}
}
