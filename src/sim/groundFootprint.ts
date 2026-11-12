import type {Point} from '../types';
export interface GroundBody {position:Point;length:number;span:number;heading:number}
const dot=(a:Point,b:Point)=>a.x*b.x+a.z*b.z;
function axes(a:GroundBody){return [{x:Math.sin(a.heading),z:-Math.cos(a.heading)},{x:Math.cos(a.heading),z:Math.sin(a.heading)}];}
function radius(body:GroundBody,axis:Point){const [forward,side]=axes(body);return Math.abs(dot(forward,axis))*(body.length/2+9)+Math.abs(dot(side,axis))*(body.span/2+4);}
function sweptRadius(body:GroundBody,axis:Point,headings:number[]){
 const wrap=(value:number)=>Math.atan2(Math.sin(value),Math.cos(value));
 const offsets=headings.map(h=>wrap(h-body.heading)),lo=Math.min(...offsets),hi=Math.max(...offsets),axisHeading=Math.atan2(axis.x,-axis.z),cornerAngle=Math.atan2(body.span/2+4,body.length/2+9);
 let extent=Math.max(...headings.map(heading=>radius({...body,heading},axis)));
 for(const sign of [-1,1])for(let k=-2;k<=2;k++){const offset=axisHeading+sign*cornerAngle+k*Math.PI-body.heading;if(offset>=lo&&offset<=hi)extent=Math.max(extent,Math.hypot(body.length/2+9,body.span/2+4));}
 return extent;
}
/** Conservative oriented rectangles enclose wings, nose and tail. Longitudinal
 * spacing and lateral wingtip spacing are distinct; a legal adjacent stand is
 * not treated as a circular obstacle as wide as the aircraft is long. */
export function groundOverlap(a:GroundBody,b:GroundBody):boolean {
 const delta={x:a.position.x-b.position.x,z:a.position.z-b.position.z};
 return [...axes(a),...axes(b)].every(axis=>Math.abs(dot(delta,axis))<radius(a,axis)+radius(b,axis)-.001);
}
/** Continuous swept SAT along each planned segment returns the first occupied
 * distance, not just proximity at a sampled endpoint. No physics is advanced. */
export function sweptGroundDistance(a:GroundBody,path:Point[],b:GroundBody,horizon=720):number {
 let along=0;
 for(let i=1;i<path.length&&along<horizon;i++){
  const start=path[i-1],end=path[i],dx=end.x-start.x,dz=end.z-start.z,length=Math.hypot(dx,dz);if(length<.001)continue;
  const direction={x:dx/length,z:dz/length},moving={...a,position:start,heading:Math.atan2(dx,-dz)},delta={x:start.x-b.position.x,z:start.z-b.position.z};
  const previous=i===1?a.heading:Math.atan2(start.x-path[i-2].x,-(start.z-path[i-2].z));
  const following=path[i+1]?Math.atan2(path[i+1].x-end.x,-(path[i+1].z-end.z)):moving.heading;
  // Include every orientation between the bend's tangents and current heading,
  // rather than substituting a circle that blocks legal adjacent stand access.
  const headings=[previous,moving.heading,following];
  let enter=0,leave=Math.min(length,horizon-along),possible=true;
  for(const axis of [...axes(moving),...axes(b)]){const extent=sweptRadius(moving,axis,headings)+radius(b,axis),offset=dot(delta,axis),velocity=dot(direction,axis);
   if(Math.abs(velocity)<1e-8){if(Math.abs(offset)>=extent){possible=false;break;}continue;}
   const t1=(-extent-offset)/velocity,t2=(extent-offset)/velocity;enter=Math.max(enter,Math.min(t1,t2));leave=Math.min(leave,Math.max(t1,t2));if(enter>leave){possible=false;break;}
  }
  // If a scenario starts within a buffer, allow movement out of it. Movement
  // deeper into a footprint still has zero authority and is stopped physically.
  if(possible&&leave>=0&&enter<=length){if(along===0&&enter<=0&&dot(delta,direction)>0){along+=length;continue;}return along+Math.max(0,enter);}
  along+=length;
 }
 return Infinity;
}
