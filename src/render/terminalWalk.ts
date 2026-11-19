export const WALK_EYE_HEIGHT=1.7;
export const WALK_EDGE_CLEARANCE=.28;

export interface WalkPosition {x:number;y:number;z:number}
export interface WalkSlope {
 axis:'x'|'z';center:number;width:number;
 lowerEnd:number;upperEnd:number;lowerFloor:number;upperFloor:number;
}

export const atWalkHeight=(position:WalkPosition,floor:number)=>Math.abs(position.y-(floor+WALK_EYE_HEIGHT))<1e-6;

export function slopeFootprint(slope:WalkSlope){
 const along=(slope.lowerEnd+slope.upperEnd)/2,run=Math.abs(slope.upperEnd-slope.lowerEnd);
 return slope.axis==='x'?{x:along,z:slope.center,width:run,depth:slope.width}:
  {x:slope.center,z:along,width:slope.width,depth:run};
}

/** Enter a flight from one of its two mouths, and keep feet on the treads. */
export function walkOnSlope(slope:WalkSlope,from:WalkPosition,to:Pick<WalkPosition,'x'|'z'>):WalkPosition|undefined{
 const axis=slope.axis,cross=axis==='x'?'z':'x',direction=Math.sign(slope.upperEnd-slope.lowerEnd);
 const run=Math.abs(slope.upperEnd-slope.lowerEnd),progress=(from[axis]-slope.lowerEnd)*direction;
 const next=(to[axis]-slope.lowerEnd)*direction;
 const half=slope.width/2-Math.min(.22,slope.width*.22),offset=from[cross]-slope.center;
 if(Math.abs(offset)>half+1e-6)return;
 const low=slope.lowerFloor+WALK_EYE_HEIGHT,high=slope.upperFloor+WALK_EYE_HEIGHT;
 const atLow=atWalkHeight(from,slope.lowerFloor),atHigh=atWalkHeight(from,slope.upperFloor);
 const onFlight=!atLow&&!atHigh&&progress>=0&&progress<=run&&Math.abs(from.y-(low+(high-low)*progress/run))<1e-6;
 const entryDistance=atLow?-progress:progress-run;
 const nextDistance=atLow?-next:next-run;
 const mouth=.44;
 const aligned=Math.abs(to[cross]-slope.center)<=half;
 const entering=(atLow||atHigh)&&entryDistance>=-1e-6&&entryDistance<=.72&&nextDistance<mouth&&nextDistance<entryDistance;
 if(!onFlight&&(!entering||(!aligned&&nextDistance>=0)))return;
 const landing=mouth+.14,p=Math.max(-landing,Math.min(run+landing,next));
 const y=p<=0?low:p>=run?high:low+(high-low)*p/run;
 const side=Math.max(-half,Math.min(half,to[cross]-slope.center))+slope.center;
 return axis==='x'?{x:slope.lowerEnd+p*direction,y,z:side}:{x:side,y,z:slope.lowerEnd+p*direction};
}
