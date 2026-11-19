import * as THREE from 'three';
import {box,canvasTexture,instances,material} from './primitives';

const pickupDestinations=[
 {zh:'停車場',en:'Car Park P4',mark:'P4'},
 {zh:'計程車',en:'Taxi',mark:'taxi'},
 {zh:'捷運（B2）',en:'Airport MRT',mark:'mrt'},
 {zh:'客運巴士',en:'Buses to city',mark:'bus'},
];
let pickupMaterials:THREE.MeshBasicMaterial[]|undefined;

export function arrivalPickupSigns(){
 return pickupMaterials??=pickupDestinations.map(({zh,en,mark})=>new THREE.MeshBasicMaterial({
  map:canvasTexture(512,144,ctx=>{
   const background=ctx.createLinearGradient(0,0,0,144);
   background.addColorStop(0,'#c7e3f2');background.addColorStop(.48,'#e5f3fa');background.addColorStop(1,'#d7e9f4');
   ctx.fillStyle=background;ctx.fillRect(0,0,512,144);ctx.fillStyle='#194581';ctx.textBaseline='middle';
   if(mark==='P4'){
    ctx.font='600 66px Arial,sans-serif';ctx.fillText(mark,36,73);
   }else{
    const taxi=mark==='taxi',top=taxi?55:41,height=taxi?42:56;
    ctx.beginPath();ctx.roundRect(49,top,62,height,7);ctx.fill();
    if(taxi)ctx.fillRect(69,47,22,9);
    ctx.fillRect(54,93,11,13);ctx.fillRect(95,93,11,13);
    ctx.fillStyle='#e5f3fa';ctx.fillRect(56,top+9,48,taxi?13:24);
    ctx.fillRect(56,85,9,5);ctx.fillRect(95,85,9,5);
    if(mark==='mrt'){ctx.font='700 12px Arial';ctx.fillText('MRT',67,78);}
    ctx.fillStyle='#194581';
   }
   ctx.font='500 45px "Microsoft JhengHei",sans-serif';ctx.fillText(zh,147,52,342);
   ctx.font='30px Arial,sans-serif';ctx.fillText(en,148,103,342);
  }),toneMapped:false,
 }));
}

type ReflectionPanel={x:number;y:number;z:number;sx:number;sz:number};
const reflectionFloor=new THREE.PlaneGeometry(1,1.9).rotateX(-Math.PI/2);
let reflectionMaterials:THREE.ShaderMaterial[]|undefined;

/** Project each luminous face into its virtual position below the stone.
 * The camera ray picks up the corresponding lettering as the walker moves. */
export function addArrivalPickupReflections(parent:THREE.Object3D,panels:ReflectionPanel[][]){
 reflectionMaterials??=arrivalPickupSigns().map(sign=>new THREE.ShaderMaterial({
  uniforms:{face:{value:sign.map}},transparent:true,depthWrite:false,toneMapped:false,
  vertexShader:`
   varying vec3 floorPoint;
   varying vec3 panelCenter;
   varying float panelWidth;
   varying vec2 footprint;
   #include <common>
   #include <logdepthbuf_pars_vertex>
   void main(){
    vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
    panelCenter = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    panelWidth = length((modelMatrix * instanceMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz);
    floorPoint = world.xyz;
    footprint = uv;
    gl_Position = projectionMatrix * viewMatrix * world;
    #include <logdepthbuf_vertex>
   }`,
  fragmentShader:`
   uniform sampler2D face;
   varying vec3 floorPoint;
   varying vec3 panelCenter;
   varying float panelWidth;
   varying vec2 footprint;
   #include <common>
   #include <logdepthbuf_pars_fragment>
   void main(){
    #include <logdepthbuf_fragment>
    vec3 ray = floorPoint - cameraPosition;
    if (abs(ray.x) < 0.0005 || ray.y >= 0.0) discard;
    float visibleSide = sign(cameraPosition.x - panelCenter.x);
    float wallX = panelCenter.x + visibleSide * 0.269;
    float t = (wallX - cameraPosition.x) / ray.x;
    if (t <= 1.0) discard;
    vec3 hit = cameraPosition + ray * t;
    vec2 signUV = vec2(0.5 - visibleSide * (hit.z - panelCenter.z) / panelWidth,
                      0.5 + (panelCenter.y - hit.y - 0.53) / 0.66);
    if (min(signUV.x, signUV.y) < 0.0 || max(signUV.x, signUV.y) > 1.0) discard;
    float distance = length(ray) * t;
    vec2 smear = vec2(0.017, 0.052) * (1.0 + 0.65 * smoothstep(4.0, 17.0, distance));
    vec3 glow = (texture2D(face, signUV).rgb * 2.0 +
                 texture2D(face, signUV + smear).rgb + texture2D(face, signUV - smear).rgb +
                 texture2D(face, signUV + vec2(-smear.x, smear.y)).rgb +
                 texture2D(face, signUV + vec2(smear.x, -smear.y)).rgb) / 6.0;
    float edges = smoothstep(0.0, 0.11, min(signUV.x, 1.0 - signUV.x)) *
                  smoothstep(0.0, 0.20, min(signUV.y, 1.0 - signUV.y));
    float coverage = smoothstep(0.0, 0.17, min(footprint.x, 1.0 - footprint.x)) *
                     smoothstep(0.0, 0.09, min(footprint.y, 1.0 - footprint.y));
    float grazing = pow(1.0 - abs(normalize(ray).y), 4.0);
    float strength = (0.055 + 0.17 * grazing) * (1.0 - smoothstep(7.0, 22.0, distance));
    gl_FragColor = vec4(glow * vec3(0.78, 0.85, 0.90), strength * edges * coverage);
    #include <colorspace_fragment>
   }`,
 }));
 panels.forEach((items,index)=>{
  if(!items.length)return;
  const mesh=instances(parent,reflectionFloor,reflectionMaterials![index],items);
  mesh.receiveShadow=false;mesh.renderOrder=2;
 });
}

const guidePanels=[
 {zh:'↑  出口・計程車',en:'EXIT / TAXI',width:8.35,height:.61,dy:-2.11,dz:0},
 {zh:'←  南會面點',en:'SOUTH MEETING POINT',width:7.9,height:.72,dy:-2.79,dz:4.08},
 {zh:'北會面點  →',en:'NORTH MEETING POINT',width:7.9,height:.72,dy:-2.79,dz:-4.08},
];
let welcomeFace:THREE.MeshBasicMaterial|undefined,welcomeStrip:THREE.MeshBasicMaterial|undefined,guideFaces:THREE.MeshBasicMaterial[]|undefined;

export function addTerminal2ArrivalNavigation(parent:THREE.Object3D,x:number,upperX:number,level:number,z:number){
 welcomeFace??=new THREE.MeshBasicMaterial({map:canvasTexture(1024,144,ctx=>{
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 77px "Microsoft JhengHei",sans-serif';
  const colors=['#dfef86','#9dd080','#f6d06b','#76cbd1','#ed8e73'];
  '台灣你好'.split('').forEach((letter,i)=>{ctx.fillStyle=colors[i];ctx.shadowColor=colors[i];ctx.shadowBlur=11;ctx.fillText(letter,158+i*88,73);});
  ctx.font='600 49px Arial,sans-serif';ctx.fillStyle='#f4d8a6';ctx.shadowColor='#e5bf83';ctx.fillText('HELLO TAIWAN',753,76,479);
 }),transparent:true,alphaTest:.06,depthWrite:false,toneMapped:false});
 welcomeStrip??=new THREE.MeshBasicMaterial({map:canvasTexture(1024,96,ctx=>{
  const finish=ctx.createLinearGradient(0,0,1024,0);finish.addColorStop(0,'#806248');finish.addColorStop(.65,'#b08b63');finish.addColorStop(1,'#94775b');
  ctx.fillStyle=finish;ctx.fillRect(0,0,1024,96);ctx.fillStyle='#f8ebcb';ctx.font='600 45px "Microsoft JhengHei",Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('歡迎來臺   WELCOME TO TAIWAN',512,49,946);
 }),toneMapped:false});
 guideFaces??=guidePanels.map(guide=>new THREE.MeshBasicMaterial({map:canvasTexture(640,128,ctx=>{
  ctx.fillStyle='#1d4184';ctx.fillRect(0,0,640,128);ctx.fillStyle='#f1f4f7';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='600 53px "Microsoft JhengHei",Arial,sans-serif';ctx.fillText(guide.zh,320,46,590);
  ctx.font='bold 26px Arial,sans-serif';ctx.fillText(guide.en,320,101,604);
 }),toneMapped:false}));
 const face=(mat:THREE.Material,fx:number,fy:number,fz:number,width:number,height:number)=>{
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);panel.position.set(fx,fy,fz);panel.rotation.y=Math.PI/2;parent.add(panel);
 };
 face(welcomeFace,upperX,level+1.08,z,12.5,.89);
 face(welcomeStrip,x+.061,level-.53,z,14.9,.65);
 guidePanels.forEach((guide,i)=>face(guideFaces![i],x+.150,level+guide.dy,z+guide.dz,guide.width,guide.height));
}

let clock: {texture:THREE.CanvasTexture;material:THREE.MeshBasicMaterial;minute:number}|undefined;
const clockCase=material('#25292c',.47,.36);
export function addTerminal2ArrivalClock(parent:THREE.Object3D,x:number,y:number,z:number){
 if(!clock){
  const texture=canvasTexture(384,112,()=>{});
  clock={texture,material:new THREE.MeshBasicMaterial({map:texture,toneMapped:false}),minute:-1};
 }
 box(parent,.20,.56,1.94,x,y,z,clockCase);
 const face=new THREE.Mesh(new THREE.PlaneGeometry(1.80,.49),clock.material);
 face.position.set(x+.104,y,z);face.rotation.y=Math.PI/2;parent.add(face);
}

export function updateTerminal2ArrivalClock(seconds:number){
 if(!clock)return;
 const minute=Math.floor(((seconds%86400)+86400)%86400/60);
 if(minute===clock.minute)return;
 clock.minute=minute;
 const ctx=(clock.texture.image as HTMLCanvasElement).getContext('2d')!,digits=[Math.floor(minute/60),minute%60].map(n=>String(n).padStart(2,'0')).join(':');
 ctx.fillStyle='#141416';ctx.fillRect(0,0,384,112);
 ctx.font='700 91px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ff3f2e';ctx.shadowColor='#ff4537';ctx.shadowBlur=12;ctx.fillText(digits,192,58,344);
 clock.texture.needsUpdate=true;
}
