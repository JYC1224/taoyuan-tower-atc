import * as THREE from 'three';
import {canvasTexture,seeded} from './primitives';

export function createSky(){
 const rand=seeded(8493),cloudMap=canvasTexture(2048,1024,ctx=>{
  ctx.fillStyle='#000';ctx.fillRect(0,0,2048,1024);
  // Grouped billows with a shaded lower edge; no repetitive billboard silhouettes.
  for(let bank=0;bank<32;bank++){const bx=rand()*2048,by=80+rand()*590,bw=80+rand()*190;
   for(let j=0;j<17;j++){const x=bx+(rand()-.5)*bw*2,y=by+(rand()-.5)*bw*.45,r=bw*(.10+rand()*.28);const g=ctx.createRadialGradient(x,y-r*.16,r*.12,x,y,r);g.addColorStop(0,'#ffffffbb');g.addColorStop(.48,'#d4d4d482');g.addColorStop(1,'#aaaaaa00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}}
 });cloudMap.wrapS=THREE.RepeatWrapping;
 const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{zenith:{value:new THREE.Color('#609bce')},horizon:{value:new THREE.Color('#d9e3e9')},ground:{value:new THREE.Color('#869c8e')},cloudColor:{value:new THREE.Color('#ffffff')},cloudCoverage:{value:.4},cloudMap:{value:cloudMap},photoSky:{value:null},hasPhotoSky:{value:0},cloudTime:{value:0},sunDirection:{value:new THREE.Vector3(.5,.6,-.5).normalize()},sunColor:{value:new THREE.Color('#fff3d9')},sunStrength:{value:1},twilight:{value:0},daylight:{value:1}},vertexShader:`varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`
 varying vec3 vDirection;uniform vec3 zenith,horizon,ground,cloudColor,sunDirection,sunColor;uniform sampler2D cloudMap,photoSky;uniform float cloudCoverage,cloudTime,sunStrength,hasPhotoSky,twilight,daylight;
 void main(){
 vec3 dir=normalize(vDirection);float h=dir.y;float altitude=clamp(h,0.0,1.0);
 vec3 col=mix(horizon,zenith,pow(altitude,.52));col=mix(col,ground,smoothstep(0.0,.25,-h));
 float azimuth=atan(dir.z,dir.x)/6.283185+.5;
 vec2 uv=vec2(azimuth+cloudTime,.38+altitude*.6);float n=texture2D(cloudMap,uv).r;
 float clouds=smoothstep(.48-cloudCoverage*.25,.79-cloudCoverage*.20,n);
 float shading=.75;
 if(hasPhotoSky>.5){
  vec2 photoUV=vec2(fract(azimuth+cloudTime*.18),asin(clamp(h,-1.0,1.0))/3.141593+.5);
  vec3 photo=texture2D(photoSky,photoUV).rgb;
  float brightness=dot(photo,vec3(.2126,.7152,.0722));
  // Preserve fine photographic sky detail while suppressing its baked-in sun.
  vec3 photographic=photo/(vec3(1.0)+photo);
  float photoMix=.50*daylight*(1.0-twilight*.65)*(1.0-smoothstep(2.0,8.0,brightness))*(1.0-smoothstep(.5,.9,cloudCoverage)*.45);
  col=mix(col,photographic*1.2,photoMix*smoothstep(.01,.12,h));
  float ratio=photo.r/max(.02,photo.b);
  float low=mix(.45,.32,cloudCoverage),high=mix(.63,.51,cloudCoverage);
  float first=smoothstep(low,high,ratio)*(1.0-smoothstep(4.0,18.0,brightness));
  float more=0.0;
  if(cloudCoverage>.25){vec3 second=texture2D(photoSky,vec2(fract(photoUV.x+.31),photoUV.y)).rgb;float ratio2=second.r/max(.02,second.b);more=smoothstep(low,high,ratio2)*(1.0-smoothstep(4.0,18.0,dot(second,vec3(.2126,.7152,.0722))));}
  clouds=max(first,more*smoothstep(.25,.85,cloudCoverage)*.75);
  shading=mix(.58,1.16,smoothstep(.28,1.65,brightness));
 }
 clouds*=smoothstep(.01,.13,h);
 float overcast=smoothstep(.55,.92,cloudCoverage);
 vec3 overcastBase=mix(horizon*.72,cloudColor*.68,pow(altitude,.35));
 col=mix(col,overcastBase,overcast*.65*smoothstep(.0,.22,h));
 float sun=max(dot(dir,sunDirection),0.0);
 vec3 cloudShade=cloudColor*shading;
 cloudShade=mix(cloudShade,cloudShade*sunColor*1.4,twilight*pow(sun,4.0)*.5);
 col=mix(col,cloudShade,clouds*mix(.82,.96,cloudCoverage));
 float halo=pow(sun,8.0)*.09+pow(sun,96.0)*.20+pow(sun,1800.0)*.85;
 col+=sunColor*halo*sunStrength*(1.0-clouds*.82);
 col+=sunColor*twilight*daylight*pow(sun,3.0)*pow(1.0-altitude,2.0)*.10;
 gl_FragColor=vec4(col,1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const sky=new THREE.Mesh(new THREE.SphereGeometry(14000,96,48),mat);sky.renderOrder=-10;sky.frustumCulled=false;return sky;
}

export function createRain(){
 const rand=seeded(193),vertices=new Float32Array(900*6);
 for(let i=0;i<900;i++){const x=(rand()-.5)*160,y=rand()*110,z=(rand()-.5)*160;vertices.set([x,y,z,x+.2,y-2.1,z+.12],i*6);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(vertices,3));const rain=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:'#c7d9e4',transparent:true,opacity:.23,depthWrite:false}));rain.visible=false;rain.frustumCulled=false;return rain;
}
