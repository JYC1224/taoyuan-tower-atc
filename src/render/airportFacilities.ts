import * as THREE from 'three';
import {box,cylinder,material} from './primitives';

/** Detailed cargo and maintenance facilities sized to the airport's existing service-side footprints. */
export function addAirportFacilities(parent:THREE.Group,concrete:THREE.Material,cladding:THREE.MeshStandardMaterial){
 const wall=material('#a4aeab',.86,.08),wallDark=material('#75858a',.84,.12),roof=material('#c4cbca',.72,.2),
  door=material('#5d7077',.78,.16),doorRib=material('#9ca9aa',.7,.22),glass=material('#48636b',.3,.25),
  yellow=material('#dfb642',.75,.12),metal=material('#9ca9a8',.55,.36),dark=material('#37464b',.86,.08);
 const dockLight=new THREE.MeshStandardMaterial({color:'#d9d9cb',emissive:'#ffe3b3',emissiveIntensity:0,roughness:.5});
 const facilities=[
  {x:1650,z:160,w:310,d:180,h:18,type:'cargo'},
  {x:1640,z:410,w:280,d:130,h:23,type:'hangar'},
  {x:1890,z:-120,w:240,d:170,h:17,type:'freight'},
  {x:-2250,z:0,w:230,d:150,h:17,type:'workshop'}
 ] as const;
 const roofUnits=(x:number,z:number,w:number,d:number,h:number,count:number)=>{
  for(let i=0;i<count;i++){
   const px=x-w*.36+i*(w*.72/Math.max(1,count-1)),pz=z+(i%2?1:-1)*d*.2;
   box(parent,10,1.1,7,px,h+1.2,pz,metal);box(parent,7,.45,5,px,h+1.95,pz,roof);
   for(const s of [-1,1])box(parent,.16,.9,5,px+s*3.8,h+1.5,pz,dark);
  }
 };
 const loadingDoor=(x:number,z:number,width:number,height:number,baseY:number)=>{
  box(parent,width,height,.18,x,baseY+height/2,z,door);
  for(let y=1;y<height-1;y+=2.2)box(parent,width-.7,.10,.08,x,baseY+y,z-.12,doorRib);
  for(const s of [-1,1])box(parent,.46,height+.8,.42,x+s*(width/2+.35),baseY+height/2,z,yellow);
  box(parent,width+1.3,.35,3.5,x,.47,z-1.82,metal);
  box(parent,width+1.7,.12,4.2,x,.25,z-2.15,yellow);
  box(parent,2,.3,.8,x,baseY+height+.55,z-.65,metal);
  box(parent,1.55,.09,.55,x,baseY+height+.36,z-.65,dockLight);
 };

 for(const b of facilities){
  const baseZ=b.z-b.d/2;
  box(parent,b.w+110,.07,b.d+100,b.x,.06,b.z,concrete);
  const shellHeight=b.h;
  box(parent,b.w,shellHeight,b.d,b.x,shellHeight/2,b.z,b.type==='hangar'?wallDark:wall);
  box(parent,b.w+5,1.2,b.d+5,b.x,shellHeight+.6,b.z,roof);
  box(parent,b.w+2,.9,b.d+2,b.x,1.05,b.z,wallDark);
  // Textured precast bands break up broad service facades while preserving each dock opening.
  const frontZ=baseZ-.24;
  box(parent,b.w,1.35,.34,b.x,b.h-2.7,frontZ,cladding);
  for(const side of [-1,1])box(parent,.34,1.35,b.d,b.x+side*(b.w/2+.18),b.h-2.7,b.z,cladding);

  if(b.type==='hangar'){
   // A broad ribbed sliding door and clerestory make the maintenance shed read as an aircraft hangar.
   const doorW=174,doorH=17.5,doorZ=baseZ-.13;
   box(parent,doorW,doorH,.22,b.x,doorH/2+1.35,doorZ,door);
   for(let x=-doorW/2+5;x<doorW/2;x+=9)box(parent,.22,doorH,.12,b.x+x,doorH/2+1.35,doorZ-.15,doorRib);
   box(parent,doorW+5,.55,.62,b.x,doorH+1.7,doorZ-.02,yellow);
   box(parent,doorW+26,1.2,1.1,b.x,doorH+2.1,doorZ-.2,metal);
   for(let x=-110;x<=110;x+=22)box(parent,11,2.3,.12,b.x+x,b.h-2.6,doorZ-.16,glass);
   for(const x of [-b.w/2+20,b.w/2-20]){
    box(parent,4,b.h,4,b.x+x,b.h/2,b.z,wallDark);
    box(parent,13,9,.16,b.x+x,5,doorZ-.18,door);
    box(parent,15,.26,3,b.x+x,10,doorZ-1.6,metal);
   }
   // Roof vents and edge service ducts add scale without changing the established silhouette.
   roofUnits(b.x,b.z,b.w,b.d,b.h,5);
   box(parent,b.w*.62,1.0,9,b.x,b.h+1.72,b.z,wallDark);
   for(let x=-b.w*.29;x<b.w*.31;x+=13)box(parent,.2,.72,9,b.x+x,b.h+1.75,b.z,metal);
  }else{
   const count=b.type==='cargo'?7:b.type==='freight'?5:3;
   const doorW=b.type==='cargo'?24:b.type==='freight'?22:18,doorH=b.type==='cargo'?11:10;
   for(let i=0;i<count;i++){
    const x=b.x-(count-1)*(b.w-34)/(2*(count-1))+i*(b.w-34)/(count-1);
    loadingDoor(x,baseZ-.13,doorW,doorH,1.25);
    if(i%2===0){
     box(parent,doorW*.68,1.05,2.3,x,1.03,baseZ-3.35,wallDark);
     box(parent,doorW*.56,.78,.12,x,1.28,baseZ-4.55,glass);
    }
   }
   // High clerestory glazing, downpipes and a small raised roof plant deck.
   for(let i=0;i<Math.floor(b.w/22);i++)box(parent,12,2,.12,b.x-b.w*.43+i*22,b.h-3.4,baseZ-.17,glass);
   for(const x of [-b.w/2+8,b.w/2-8]){
    box(parent,.22,b.h,.22,b.x+x,b.h/2,baseZ-.18,metal);
    box(parent,.28,2,.3,b.x+x,2.1,baseZ-1.7,metal);
   }
   roofUnits(b.x,b.z,b.w,b.d,b.h,b.type==='cargo'?6:4);
   // Painted apron guidance directs vehicles into each dock rather than leaving an empty slab.
   const laneCount=b.type==='cargo'?4:3;
   for(let i=0;i<laneCount;i++){
    const x=b.x-(laneCount-1)*18/2+i*18;
    box(parent,.24,.018,21,x,.226,baseZ-15,yellow);
   }
   // Containers and pallets sit in the side staging area, clear of the dock approach lanes.
   for(let i=0;i<4;i++){
    const x=b.x+b.w/2+14+(i%2)*7,z=b.z-b.d*.24+Math.floor(i/2)*7;
    box(parent,5,.28,4,x,.37,z,dark);
    box(parent,4.5,3.1,3.6,x,2.04,z,i%2?wallDark:metal);
    box(parent,4.55,.12,3.65,x,3.66,z,doorRib);
    for(const side of [-1,1])box(parent,.1,2.8,.12,x+side*1.8,2.05,z-1.85,doorRib);
   }
  }
  // Short edge drains and corner bollards frame each service building.
  for(const s of [-1,1]){
   for(let k=0;k<5;k++)box(parent,2.6,.055,.22,b.x+s*(b.w/2-8),.225,b.z-b.d*.28+k*b.d*.14,dark);
   for(const zSign of [-1,1]){
    const bollard=cylinder(parent,.16,.16,1.05,b.x+s*(b.w/2-4),.74,b.z+zSign*(b.d/2-4),yellow,8);
    bollard.castShadow=true;
   }
  }
 }
 return dockLight;
}
