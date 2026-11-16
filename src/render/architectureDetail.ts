import * as THREE from 'three';
import type {Terminal} from '../data/airport';
import {box,cylinder,material,pavement,instances,canvasTexture,seeded} from './primitives';
import {isSea} from './coastline';
import {roofMaterial} from './roofMaterial';
import {T2_FLOOR_LEVELS,T2_OBSERVATION_DECK_LAYOUT} from './terminalInteriorLayout';
import {t1RoofHeight} from './terminalPublicHallLayout';

const pearl=material('#d3d8d8',.62,.18),silver=material('#aab7bf',.4,.58),dark=material('#566b78',.38,.25);
const roofPearl=roofMaterial('#d6d8d3',.62,.14),roofSilver=roofMaterial('#615c52',.68,.14);

/** Architectural interpretation of ANWS' folded west / curved white east shell. */
export function towerSkin(parent:THREE.Group,floor:number){
 const curve=new THREE.CatmullRomCurve3([[8,0,0],[6,8,0],[5.8,22,0],[8.5,36,0],[12,44,0],[12.3,floor-2,0]].map(p=>new THREE.Vector3(...p as [number,number,number])));
 for(const west of [false,true]){
  const positions:number[]=[],uv:number[]=[],index:number[]=[],rings=32,steps=west?6:40;
  for(let j=0;j<=rings;j++){const p=curve.getPoint(j/rings);for(let k=0;k<=steps;k++){const angle=(west?Math.PI/2:-Math.PI/2)+k/steps*Math.PI;const twist=west?Math.sin(j/rings*Math.PI)*.09:0;positions.push(Math.cos(angle+twist)*p.x,p.y,Math.sin(angle+twist)*p.x*.8);uv.push(k/steps,j/rings);}}
  for(let j=0;j<rings;j++)for(let k=0;k<steps;k++){const a=j*(steps+1)+k,b=a+steps+1;index.push(a,b,a+1,a+1,b,b+1);}
  let geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(index);if(west)geo=geo.toNonIndexed();geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,west?silver:pearl);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
 }
 // Panel joints follow the shell, at millimetre visual offset rather than crossed slabs.
 for(let h=5;h<floor-3;h+=3.6){let closest=curve.getPoint(0);for(let j=0;j<=120;j++){const p=curve.getPoint(j/120);if(Math.abs(p.y-h)<Math.abs(closest.y-h))closest=p;}const rim=new THREE.Mesh(new THREE.TorusGeometry(closest.x+.015,.025,4,64),silver);rim.rotation.x=Math.PI/2;rim.scale.y=.8;rim.position.y=h;parent.add(rim);}
 box(parent,2.1,3.3,.12,0,1.65,6.3,dark);
}

/** Curbside interpretation based on CECI's published T2 coach-drop-off photo.
 * Its long axis follows the mapped west-side service frontage (OSM way
 * 1126518022); dimensions are visual estimates, not survey measurements.
 */
function terminal2CurbsideCanopy(parent:THREE.Group,t:Terminal){
 // The curb road runs beside T2's west long face. Model in a local frame,
 // then rotate the canopy so its long axis tracks the mapped service road.
 const length=t.width*.58,innerX=t.x-length/2,outerX=t.x+length/2;
 const innerZ=t.z-94,outerZ=innerZ+32,depth=outerZ-innerZ;
 const roofAt=(z:number)=>13.65-(z-innerZ)/depth*2.15;
 // Keep the long curbside roof outside the west wall, spanning the walk and
 // coach lane. A positive offset had put most of this canopy inside the shell.
 const canopyRoot=new THREE.Group(),targetCenterX=t.x-t.width/2-16,targetCenterZ=t.z-70;
 canopyRoot.position.set(targetCenterX-(innerZ+outerZ)/2,0,targetCenterZ+t.x);canopyRoot.rotation.y=Math.PI/2;parent.add(canopyRoot);
 const xGrid:number[]=[];for(let x=innerX;x<outerX-.01;x+=8.4)xGrid.push(x);xGrid.push(outerX);
 const zGrid:number[]=[];for(let z=innerZ;z<outerZ-.01;z+=5.35)zGrid.push(z);zGrid.push(outerZ);
 const topY=(z:number)=>roofAt(z)-.28,bottomY=(z:number)=>topY(z)-1.45;

 // Separate the two public forecourt surfaces instead of leaving one blank
 // concrete slab: the terminal-side strip is a pedestrian walk, with curb
 // stones between it and the coach/drop-off lanes.
 const walkDepth=7.2,curbWidth=.42,roadNear=innerZ+1.6,walkNear=outerZ-walkDepth,roadFar=walkNear-curbWidth,roadDepth=roadFar-roadNear;
 const roadMat=material('#394144',.95,.005),walkMat=material('#c7c9c3',.91,.015),curbMat=material('#dbdad2',.83,.035),jointMat=material('#858d8a',.96,0),laneMat=material('#e5e5db',.88,0);
 const roadSurface=box(canopyRoot,length+8,.1,roadDepth,t.x,.08,(roadNear+roadFar)/2,roadMat),walkSurface=box(canopyRoot,length+8,.1,walkDepth,t.x,.08,(walkNear+outerZ)/2,walkMat);
 const curb=box(canopyRoot,length+8,.22,curbWidth,t.x,.19,(walkNear+roadFar)/2,curbMat);
 for(const surface of [roadSurface,walkSurface,curb]){surface.castShadow=false;surface.receiveShadow=true;}
 const walkJoints:Parameters<typeof instances>[3]=[],roadMarkings:Parameters<typeof instances>[3]=[];
 for(let z=walkNear+2.4;z<outerZ-.2;z+=2.4)walkJoints.push({x:t.x,y:.135,z,sx:length+6,sy:.012,sz:.025});
 for(let x=innerX+4;x<outerX-2;x+=4)walkJoints.push({x,y:.135,z:(walkNear+outerZ)/2,sx:.025,sy:.012,sz:walkDepth});
 for(const z of [roadNear+roadDepth/3,roadNear+roadDepth*2/3])for(let x=innerX+4;x<outerX-3;x+=16)roadMarkings.push({x:x+3.8,y:.137,z,sx:7.6,sy:.012,sz:.14});
 const tileJoints=instances(canopyRoot,new THREE.BoxGeometry(1,1,1),jointMat,walkJoints),laneLines=instances(canopyRoot,new THREE.BoxGeometry(1,1,1),laneMat,roadMarkings);
 for(const detail of [tileJoints,laneLines]){detail.castShadow=false;detail.receiveShadow=false;}

 // Roof glazing is a single batched, sloped surface with a restrained blue-grey tint.
 const roofPositions:number[]=[],roofUvs:number[]=[],roofIndices:number[]=[];
 for(let ix=0;ix<xGrid.length-1;ix++)for(let iz=0;iz<zGrid.length-1;iz++){
  const x0=xGrid[ix],x1=xGrid[ix+1],z0=zGrid[iz],z1=zGrid[iz+1],base=roofPositions.length/3;
  roofPositions.push(x0,roofAt(z0)+.18,z0,x1,roofAt(z0)+.18,z0,x0,roofAt(z1)+.18,z1,x1,roofAt(z1)+.18,z1);
  roofUvs.push(0,0,1,0,0,1,1,1);roofIndices.push(base,base+2,base+1,base+1,base+2,base+3);
 }
 const roofGeometry=new THREE.BufferGeometry();roofGeometry.setAttribute('position',new THREE.Float32BufferAttribute(roofPositions,3));roofGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(roofUvs,2));roofGeometry.setIndex(roofIndices);roofGeometry.computeVertexNormals();
 const canopyGlass=new THREE.MeshPhysicalMaterial({color:'#b8c9c7',roughness:.3,metalness:.06,transparent:true,opacity:.48,depthWrite:false,side:THREE.DoubleSide,clearcoat:.32,clearcoatRoughness:.28});
 const roof=new THREE.Mesh(roofGeometry,canopyGlass);roof.castShadow=false;roof.receiveShadow=true;canopyRoot.add(roof);

 const topMembers:Parameters<typeof instances>[3]=[],lowerMembers:Parameters<typeof instances>[3]=[],nodes:Parameters<typeof instances>[3]=[],braceMatrices:THREE.Matrix4[]=[];
 const chordFinish=material('#e1e5e1',.4,.5),braceFinish=material('#c0c9c6',.46,.5),steelNode=material('#d2d9d6',.4,.48);
 const beamGeometry=new THREE.CylinderGeometry(.5,.5,1,6,1,false),beamDummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),from=new THREE.Vector3(),to=new THREE.Vector3(),delta=new THREE.Vector3();
 const addBrace=(ax:number,ay:number,az:number,bx:number,by:number,bz:number)=>{
  from.set(ax,ay,az);to.set(bx,by,bz);delta.subVectors(to,from);beamDummy.position.copy(from).add(to).multiplyScalar(.5);beamDummy.quaternion.setFromUnitVectors(up,delta.clone().normalize());beamDummy.scale.set(.095,delta.length(),.095);beamDummy.updateMatrix();braceMatrices.push(beamDummy.matrix.clone());
 };
 for(let ix=0;ix<xGrid.length-1;ix++)for(let iz=0;iz<zGrid.length;iz++){
  const x0=xGrid[ix],x1=xGrid[ix+1],z=zGrid[iz],span=x1-x0,mid=(x0+x1)/2;
  topMembers.push({x:mid,y:topY(z),z,sx:span,sy:.26,sz:.24});lowerMembers.push({x:mid,y:bottomY(z),z,sx:span,sy:.2,sz:.2});
 }
 for(let ix=0;ix<xGrid.length;ix++)for(let iz=0;iz<zGrid.length-1;iz++){
  const x=xGrid[ix],z0=zGrid[iz],z1=zGrid[iz+1],mid=(z0+z1)/2,span=z1-z0;
  topMembers.push({x,y:(topY(z0)+topY(z1))/2,z:mid,sx:.24,sy:.26,sz:span});lowerMembers.push({x,y:(bottomY(z0)+bottomY(z1))/2,z:mid,sx:.2,sy:.2,sz:span});
 }
 for(let ix=0;ix<xGrid.length;ix++)for(let iz=0;iz<zGrid.length;iz++){
  const x=xGrid[ix],z=zGrid[iz];nodes.push({x,y:topY(z),z,sx:.34,sy:.34,sz:.34},{x,y:bottomY(z),z,sx:.3,sy:.3,sz:.3});
  if(ix<xGrid.length-1&&iz<zGrid.length-1){
   const nextX=xGrid[ix+1],nextZ=zGrid[iz+1];
   if((ix+iz)%2===0){addBrace(x,topY(z),z,nextX,bottomY(nextZ),nextZ);addBrace(nextX,topY(z),z,x,bottomY(nextZ),nextZ);}
   else{addBrace(nextX,topY(z),z,x,bottomY(nextZ),nextZ);addBrace(x,topY(z),z,nextX,bottomY(nextZ),nextZ);}
  }
 }
 const top=instances(canopyRoot,new THREE.BoxGeometry(1,1,1),chordFinish,topMembers),lower=instances(canopyRoot,new THREE.BoxGeometry(1,1,1),braceFinish,lowerMembers),joint=instances(canopyRoot,new THREE.SphereGeometry(.5,7,5),steelNode,nodes);
 for(const mesh of [top,lower,joint]){mesh.castShadow=false;mesh.receiveShadow=true;}
 const braces=new THREE.InstancedMesh(beamGeometry,braceFinish,braceMatrices.length);braceMatrices.forEach((matrix,index)=>braces.setMatrixAt(index,matrix));braces.instanceMatrix.needsUpdate=true;braces.castShadow=false;braces.receiveShadow=true;canopyRoot.add(braces);

 // One outer column line carries the long roof edge. It sits beside the road
 // rather than in the curb lane; the nearest D-concourse end remains clear.
 const canopyColumnFinish=material('#d5dbd8',.55,.18),columnGeometry=new THREE.CylinderGeometry(.52,.78,1,12,1,false),columnItems:Parameters<typeof instances>[3]=[],baseItems:Parameters<typeof instances>[3]=[];
 // Put the support line at the roadway edge of the cantilever, clear of the
 // wall-side pedestrian strip.
 const supportZ=innerZ+1.4;
 for(let x=innerX+5;x<outerX-3;x+=13){const height=bottomY(supportZ)-.05;columnItems.push({x,y:height/2,z:supportZ,sy:height});baseItems.push({x,y:.28,z:supportZ,sx:1.65,sy:.56,sz:1.65});}
 const columns=instances(canopyRoot,columnGeometry,canopyColumnFinish,columnItems);columns.castShadow=true;columns.receiveShadow=true;
 const bases=instances(canopyRoot,new THREE.BoxGeometry(1,1,1),canopyColumnFinish,baseItems);bases.castShadow=false;bases.receiveShadow=true;
 // The published curbside view also shows larger piers along the terminal
 // frontage; pair them with the outer row so the glazed roof is not a floating
 // cantilever and the pedestrian strip reads as a real colonnade.
 const facadeSupports:Parameters<typeof instances>[3]=[],facadeSupportBases:Parameters<typeof instances>[3]=[];
 const facadeSupportZ=outerZ-.58;
 for(let x=innerX+8;x<outerX-5;x+=18){const height=bottomY(outerZ)-.04;facadeSupports.push({x,y:height/2,z:facadeSupportZ,sy:height});facadeSupportBases.push({x,y:.24,z:facadeSupportZ,sx:1.35,sy:.48,sz:1.15});}
 const frontageColumns=instances(canopyRoot,columnGeometry,canopyColumnFinish,facadeSupports),frontageBases=instances(canopyRoot,new THREE.BoxGeometry(1,1,1),canopyColumnFinish,facadeSupportBases);
 frontageColumns.castShadow=true;frontageColumns.receiveShadow=true;frontageBases.castShadow=false;frontageBases.receiveShadow=true;

 // A thin fascia and underside lighting make the roof legible from ground level.
 const fascia=box(canopyRoot,length,.72,.68,t.x,roofAt(outerZ)+.04,outerZ,canopyColumnFinish);fascia.castShadow=false;
 const soffit=material('#e4e2d7',.66,.08),soffitLines:Parameters<typeof instances>[3]=[];
 for(let z=innerZ+4;z<outerZ-2;z+=8)soffitLines.push({x:t.x,y:roofAt(z)-.04,z,sx:length,sy:.07,sz:.08});
 const lights=instances(canopyRoot,new THREE.BoxGeometry(1,1,1),soffit,soffitLines);lights.castShadow=false;lights.receiveShadow=false;
 const lightMaterial=new THREE.MeshBasicMaterial({color:'#f7e9c9',toneMapped:false});
 for(let x=innerX+9;x<outerX-4;x+=18){const lamp=box(canopyRoot,5,.07,.42,x,roofAt((innerZ+outerZ)/2)-.11,(innerZ+outerZ)/2,lightMaterial);lamp.castShadow=false;lamp.receiveShadow=false;}

 const signTexture=canvasTexture(768,220,ctx=>{
  ctx.fillStyle='#202422';ctx.fillRect(0,0,768,220);ctx.fillStyle='#f2d247';ctx.fillRect(0,0,7,220);
  ctx.fillStyle='#f2d247';ctx.fillRect(31,63,82,94);ctx.fillStyle='#202422';ctx.fillRect(47,77,50,47);ctx.fillRect(42,125,59,14);ctx.beginPath();ctx.arc(52,152,7,0,Math.PI*2);ctx.arc(91,152,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f5dd63';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.font='bold 56px Arial';ctx.fillText('遊覽車下車處',142,93);ctx.font='bold 35px Arial';ctx.fillText('TOUR BUS DEPARTING AREA',144,158);
 });
 const signMat=new THREE.MeshStandardMaterial({map:signTexture,roughness:.78,metalness:.04,side:THREE.DoubleSide}),signPositions=[t.x-length*.28,t.x+length*.28],signZ=innerZ+4;
 for(const x of signPositions){
  const z=signZ,y=8.8,back=box(canopyRoot,.3,2.75,9.2,x,y,z,roofSilver);back.castShadow=false;
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(8.9,2.55),signMat);sign.rotation.y=-Math.PI/2;sign.position.set(x-.17,y,z);canopyRoot.add(sign);
  for(const dz of [-3.6,3.6]){const hanger=box(canopyRoot,.12,Math.max(.4,bottomY(z)-y-1.35),.12,x,(bottomY(z)+y+1.35)/2,z+dz,steelNode);hanger.castShadow=false;}
 }
}

export function terminalRoof(parent:THREE.Group,t:Terminal){
 if(t.id==='T1'){
  // The renovated T1 roof is a pair of raised catenary wings with a lower
  // central saddle and dropped outer eaves. Both skin and piers share the
  // section profile, rather than two independent Gaussian approximations.
  const w=t.width+24,d=t.depth+14,segments=48,p:number[]=[],uv:number[]=[],indices:number[]=[];
  const roofY=(x:number)=>t1RoofHeight(x,t.width,t.height);
  for(let j=0;j<=segments;j++){const u=j/segments,x=(u-.5)*w,y=roofY(x);for(const z of [-d/2,d/2]){p.push(t.x+x,y,t.z+z);uv.push(u,z>0?1:0);}}
  for(let j=0;j<segments;j++){const a=j*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();roofPearl.side=THREE.DoubleSide;const mesh=new THREE.Mesh(g,roofPearl);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
  // The renewed shell is covered by shallow, overlapping sunshade strips.
  // A single buffered surface keeps the repeated tile rhythm inexpensive while
  // catching light along the same catenary profile as the structural girders.
  const louverPositions:number[]=[],louverColors:number[]=[],louverIndices:number[]=[],louverStep=2.55,louverWidth=.42;
  for(let band=0,z=-d/2+1;z<d/2-1;band++,z+=louverStep){
   const z0=z,z1=Math.min(z+louverWidth,d/2),tone=band%5===0?.95:band%2===0?.985:1;
   for(let j=0;j<=segments;j++){
    const x=(j/segments-.5)*w,y=roofY(x)+.08,base=louverPositions.length/3;
    louverPositions.push(t.x+x,y,t.z+z0,t.x+x,y,t.z+z1);
    for(let vertex=0;vertex<2;vertex++)louverColors.push(tone,tone,tone*.985);
    if(j<segments){const a=base;louverIndices.push(a,a+1,a+2,a+1,a+3,a+2);}
   }
  }
  const louverGeometry=new THREE.BufferGeometry();louverGeometry.setAttribute('position',new THREE.Float32BufferAttribute(louverPositions,3));louverGeometry.setAttribute('color',new THREE.Float32BufferAttribute(louverColors,3));louverGeometry.setIndex(louverIndices);louverGeometry.computeVertexNormals();
  const louverMaterial=new THREE.MeshStandardMaterial({color:'#f0f0e9',vertexColors:true,roughness:.69,metalness:.035,side:THREE.DoubleSide});
  const louvers=new THREE.Mesh(louverGeometry,louverMaterial);louvers.castShadow=false;louvers.receiveShadow=true;parent.add(louvers);
  // The public hall sees a bright acoustic liner beneath the weather roof.
  // Keeping this as a separate inner skin gives T1 its photographed white,
  // folded ceiling while leaving the exterior roof finish intact.
  const innerPositions=Float32Array.from(p,(value,index)=>index%3===1?value-.28:value),innerGeometry=new THREE.BufferGeometry();
  innerGeometry.setAttribute('position',new THREE.Float32BufferAttribute(innerPositions,3));innerGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));innerGeometry.setIndex(indices);innerGeometry.computeVertexNormals();
  const innerFinish=new THREE.MeshStandardMaterial({color:'#f2f2ed',roughness:.82,metalness:.012,emissive:'#d8d9d1',emissiveIntensity:.4,side:THREE.DoubleSide});
  const innerSkin=new THREE.Mesh(innerGeometry,innerFinish);innerSkin.castShadow=false;innerSkin.receiveShadow=false;parent.add(innerSkin);
  const interiorRib=new THREE.MeshStandardMaterial({color:'#e1e3de',roughness:.64,metalness:.035,emissive:'#858b85',emissiveIntensity:.08});
  const innerY=(x:number)=>roofY(x)-.28;
  // The catenary ribs span the building width and repeat along the terminal;
  // shallow broad sections read as structural girders instead of ceiling stripes.
  const ribSection=new THREE.Shape();
  for(let j=0;j<=segments;j++){const x=(j/segments-.5)*w;if(j===0)ribSection.moveTo(x,innerY(x)-.16);else ribSection.lineTo(x,innerY(x)-.16);}
  for(let j=segments;j>=0;j--){const x=(j/segments-.5)*w;ribSection.lineTo(x,innerY(x)-1.28);}
  ribSection.closePath();
  const ribGeometry=new THREE.ExtrudeGeometry(ribSection,{depth:.82,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.055,bevelThickness:.055,curveSegments:2}),ribStations=Math.floor(d/12)+1,ribs=new THREE.InstancedMesh(ribGeometry,interiorRib,ribStations),ribTransform=new THREE.Object3D();
  let ribIndex=0;for(let z=-d/2;z<=d/2;z+=12){ribTransform.position.set(t.x,0,t.z+z-.41);ribTransform.updateMatrix();ribs.setMatrixAt(ribIndex++,ribTransform.matrix);}ribs.count=ribIndex;ribs.instanceMatrix.needsUpdate=true;ribs.castShadow=false;ribs.receiveShadow=false;parent.add(ribs);
  // Longitudinal purlins stitch the catenary girders together, as in the
  // published roof detail, without turning the liner into a dense false grid.
  for(let x=-w/2+8;x<w/2;x+=8){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(t.x+x,innerY(x)-.36,t.z-d/2),new THREE.Vector3(t.x+x,innerY(x)-.36,t.z+d/2)]),purlin=new THREE.Mesh(new THREE.TubeGeometry(curve,2,.07,6,false),interiorRib);purlin.castShadow=false;parent.add(purlin);}
  const ceilingLight=new THREE.MeshBasicMaterial({color:'#fff0d3',toneMapped:false});
  for(let x=-w/2+20;x<w/2-12;x+=18){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(t.x+x,innerY(x)-.64,t.z-d/2),new THREE.Vector3(t.x+x,innerY(x)-.64,t.z+d/2)]),strip=new THREE.Mesh(new THREE.TubeGeometry(curve,2,.065,6,false),ceilingLight);strip.castShadow=false;parent.add(strip);}
 }else if(t.id==='T2'){
  // T2's high public hall reads as a glazed space frame. The previous solid
  // two-metre inner slab hid this structure and made the atrium look sealed.
  // Keep the roof glazing daylight-readable from the departure hall while the
  // double-layer truss remains legible through it. Dark tinted glass made the
  // public atrium read as a black ceiling in ordinary evening conditions.
  const glassRoof=new THREE.MeshPhysicalMaterial({color:'#a9bbb6',roughness:.3,metalness:.035,transparent:true,opacity:.3,depthWrite:false,side:THREE.DoubleSide,envMapIntensity:.28,emissive:'#344b48',emissiveIntensity:.08,clearcoat:.38,clearcoatRoughness:.28});
  glassRoof.forceSinglePass=true;
  const panels:Parameters<typeof instances>[3]=[],opaquePanels:Parameters<typeof instances>[3]=[],frameMembers:Parameters<typeof instances>[3]=[],spaceFrameNodes:Parameters<typeof instances>[3]=[],webMatrices:THREE.Matrix4[]=[];
 const panelStep=7.6,panelSize=7.15,roofY=t.height+.28;
  const topChordY=t.height-.1,bottomChordY=t.height-1.8;
  const xGrid=Array.from({length:Math.ceil(t.width/panelStep)+1},(_,i)=>-t.width/2+Math.min(i*panelStep,t.width));
  const zGrid=Array.from({length:Math.ceil(t.depth/panelStep)+1},(_,i)=>-t.depth/2+Math.min(i*panelStep,t.depth));
  for(let x=-t.width/2+panelStep/2;x<t.width/2;x+=panelStep){
   for(let z=-t.depth/2+panelStep/2;z<t.depth/2;z+=panelStep){
    const destination=Math.abs(x)<t.width*.115?panels:opaquePanels;
    destination.push({x:t.x+x,y:roofY,z:t.z+z,sx:panelSize,sy:.1,sz:panelSize});
   }
  }
  // A double-layer space frame has upper and lower chord grids, with vertical
  // nodes and alternating diagonal webs. The old coplanar X pattern looked like
  // a printed ceiling grid and had no structural depth.
  // Model the chords as individual bay members meeting at nodes. A single
  // full-length beam made the roof read as a printed grid rather than a built
  // space frame with real depth and repeating structural bays.
  for(const x of xGrid)for(let iz=0;iz<zGrid.length-1;iz++){
   const z0=zGrid[iz],z1=zGrid[iz+1],mid=(z0+z1)/2,length=z1-z0;
   frameMembers.push({x:t.x+x,y:topChordY,z:t.z+mid,sx:.2,sy:.22,sz:length});
   frameMembers.push({x:t.x+x,y:bottomChordY,z:t.z+mid,sx:.16,sy:.18,sz:length});
  }
  for(const z of zGrid)for(let ix=0;ix<xGrid.length-1;ix++){
   const x0=xGrid[ix],x1=xGrid[ix+1],mid=(x0+x1)/2,length=x1-x0;
   frameMembers.push({x:t.x+mid,y:topChordY,z:t.z+z,sx:length,sy:.22,sz:.2});
   frameMembers.push({x:t.x+mid,y:bottomChordY,z:t.z+z,sx:length,sy:.18,sz:.16});
  }
  for(const x of xGrid)for(const z of zGrid){
   spaceFrameNodes.push({x:t.x+x,y:topChordY,z:t.z+z,sx:.38,sy:.38,sz:.38});
   spaceFrameNodes.push({x:t.x+x,y:bottomChordY,z:t.z+z,sx:.32,sy:.32,sz:.32});
  }
  const webGeometry=new THREE.CylinderGeometry(.5,.5,1,6,1,false),beamDummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),beamStart=new THREE.Vector3(),beamEnd=new THREE.Vector3(),beamDirection=new THREE.Vector3();
  const addWeb=(ax:number,ay:number,az:number,bx:number,by:number,bz:number,radius=.085)=>{
   beamStart.set(t.x+ax,ay,t.z+az);beamEnd.set(t.x+bx,by,t.z+bz);beamDirection.subVectors(beamEnd,beamStart);
   beamDummy.position.copy(beamStart).add(beamEnd).multiplyScalar(.5);beamDummy.quaternion.setFromUnitVectors(up,beamDirection.clone().normalize());beamDummy.scale.set(radius,beamDirection.length(),radius);beamDummy.updateMatrix();webMatrices.push(beamDummy.matrix.clone());
  };
  for(let ix=0;ix<xGrid.length;ix++)for(let iz=0;iz<zGrid.length;iz++){
   const x=xGrid[ix],z=zGrid[iz];addWeb(x,topChordY,z,x,bottomChordY,z,.1);
   if(ix>=xGrid.length-1||iz>=zGrid.length-1)continue;
   const xNext=xGrid[ix+1],zNext=zGrid[iz+1];
   if((ix+iz)%2===0)addWeb(x,topChordY,z,xNext,bottomChordY,zNext,.085);
   else addWeb(xNext,topChordY,z,x,bottomChordY,zNext,.085);
  }
  const trussFinish=new THREE.MeshStandardMaterial({color:'#62695f',roughness:.56,metalness:.32}),braceFinish=new THREE.MeshStandardMaterial({color:'#7f877c',roughness:.5,metalness:.36});
  const glazing=instances(parent,new THREE.BoxGeometry(1,1,1),glassRoof,panels);glazing.castShadow=false;glazing.receiveShadow=false;
  // The hall photograph shows a dark opaque roof field with a clear skylight
  // strip, not a uniform all-glass square grid. The strip width is a visual fit.
  const liner=new THREE.MeshStandardMaterial({color:'#8c8675',roughness:.88,metalness:.025,emissive:'#615c4e',emissiveIntensity:.08});
  const opaque=instances(parent,new THREE.BoxGeometry(1,1,1),liner,opaquePanels);opaque.castShadow=false;opaque.receiveShadow=true;
  const frame=instances(parent,new THREE.BoxGeometry(1,1,1),trussFinish,frameMembers);frame.castShadow=false;frame.receiveShadow=true;
  const nodeGeometry=new THREE.SphereGeometry(.5,8,6),nodes=instances(parent,nodeGeometry,trussFinish,spaceFrameNodes);nodes.castShadow=false;nodes.receiveShadow=true;
  const bracing=new THREE.InstancedMesh(webGeometry,braceFinish,webMatrices.length);webMatrices.forEach((matrix,index)=>bracing.setMatrixAt(index,matrix));bracing.instanceMatrix.needsUpdate=true;bracing.castShadow=false;bracing.receiveShadow=true;parent.add(bracing);
  for(const side of [-1,1]){
   box(parent,t.width+18,.8,2.6,t.x,t.height+.15,t.z+side*(t.depth/2+1),roofPearl);
   box(parent,2.6,.8,t.depth+18,t.x+side*(t.width/2+1),t.height+.15,t.z,roofPearl);
   box(parent,t.width+35,.8,25,t.x,t.height*.6,t.z+side*(t.depth/2+8),pearl);
  for(let x=-t.width/2;x<=t.width/2;x+=15){
   // Keep the documented outdoor viewing balconies clear of the tall outer
   // roof-frame posts; the main space frame remains supported behind them.
   if(t.id==='T2'&&Math.abs(x)<t.width*T2_OBSERVATION_DECK_LAYOUT.spanRatio/2+2)continue;
   const truss=box(parent,.7,t.height,1,t.x+x,t.height/2,t.z+side*(t.depth/2+4),silver);truss.rotation.x=side*.14;
  }
  }
 }else{
  box(parent,t.width+9,1.5,t.depth+9,t.x,t.height+.7,t.z,roofPearl);
  for(let x=-t.width/2+12;x<t.width/2;x+=18)box(parent,1,.6,t.depth+8,t.x+x,t.height+1.8,t.z,silver);
 }
 // Facade floors and mullions give human scale without extra transparent sorting.
 for(const side of [-1,1]){
  const wallZ=t.z+side*(t.depth/2+.12),doorFloor=T2_FLOOR_LEVELS[6],doorCenter=T2_OBSERVATION_DECK_LAYOUT.accessXOffset,doorHalf=T2_OBSERVATION_DECK_LAYOUT.accessWidth/2;
  for(let y=5;y<t.height;y+=5){
   if(t.id==='T2'&&y>doorFloor&&y<doorFloor+T2_OBSERVATION_DECK_LAYOUT.accessHeight){
    const left=-t.width/2,right=t.width/2,openingLeft=doorCenter-doorHalf,openingRight=doorCenter+doorHalf;
    box(parent,openingLeft-left,.28,.22,t.x+(left+openingLeft)/2,y,wallZ,pearl);
    box(parent,right-openingRight,.28,.22,t.x+(openingRight+right)/2,y,wallZ,pearl);
   }else if(t.id==='T1'){
    // Stop facade transoms where the real roof has already dropped to its eave.
    for(let x=-t.width/2;x<t.width/2;x+=4)if(y<t1RoofHeight(x+2,t.width,t.height)-.45)box(parent,4,.18,.2,t.x+x+2,y,wallZ,pearl);
   }else box(parent,t.width,.28,.22,t.x,y,wallZ,pearl);
  }
  for(let x=-t.width/2;x<=t.width/2;x+=4){
   if(t.id==='T2'&&Math.abs(x-doorCenter)<doorHalf)continue;
   const height=t.id==='T1'?t1RoofHeight(x,t.width,t.height)-.4:t.height;
   box(parent,.14,height,.22,t.x+x,height/2,wallZ,silver);
  }
 }
 if(t.id==='T2')terminal2CurbsideCanopy(parent,t);
}

export function landsideDetail(parent:THREE.Group){
 const rand=seeded(678);
 const roofs:Parameters<typeof instances>[3]=[],blocks:Parameters<typeof instances>[3]=[],wallPalette=['#aaaead','#c0bdb1','#969f9f','#b7b6aa','#8b9694'],roofPalette=['#778589','#9a9b91','#596c73','#a6a295','#7e8a83'];
 for(let i=0;i<230;i++){const x=(rand()-.5)*9000,z=(rand()-.5)*6800;if(Math.abs(x)<2750&&Math.abs(z)<1450||z< -2800||isSea(x,z))continue;const h=5+rand()*15,w=22+rand()*80,d=24+rand()*80,ry=rand()<.5?0:Math.PI/2;blocks.push({x,y:h/2,z,sx:w,sy:h,sz:d,ry,color:wallPalette[Math.floor(rand()*wallPalette.length)]});roofs.push({x,y:h+.25,z,sx:w+2,sy:.7,sz:d+2,ry,color:roofPalette[Math.floor(rand()*roofPalette.length)]});}
 const white=material('#ffffff',.92),roofMat=material('#ffffff',.8,.05);instances(parent,new THREE.BoxGeometry(1,1,1),white,blocks);instances(parent,new THREE.BoxGeometry(1,1,1),roofMat,roofs);
 // The airport's north observation deck identifies coastal wind turbines. These
 // are generalized scenery, not surveyed turbine locations or operational data.
 for(let i=0;i<7;i++){const x=-1750+i*540,z=-3180+(i%3)*50;cylinder(parent,1.1,2.4,64,x,32,z,pearl,12);const rotor=new THREE.Group();rotor.position.set(x,64,z);for(let k=0;k<3;k++){const blade=box(rotor,1.7,25,.35,0,13,0,pearl);const angle=k*Math.PI*2/3+i*.67;blade.position.set(Math.sin(angle)*13,Math.cos(angle)*13,0);blade.rotation.z=-angle;}parent.add(rotor);}
}

export function apronLightTexture(){return canvasTexture(128,128,ctx=>{const g=ctx.createRadialGradient(64,64,0,64,64,63);g.addColorStop(0,'#e9f1ff69');g.addColorStop(.35,'#e9f1ff30');g.addColorStop(1,'#e9f1ff00');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);});}
