import {T1_FLOOR_LEVELS,T2_FLOOR_LEVELS,ESCALATOR_TREAD_WIDTH,ESCALATOR_LANE_OFFSET,escalatorRun,escalatorOpening,t2VerticalCores,type BuildingBounds,type TerminalCore} from './terminalBuildingLayout';
import {T1_SECOND_FLOOR_LAYOUT} from './terminalInteriorLayout';
import type {WalkSlope} from './terminalWalk';

export function t1VerticalCores(b:BuildingBounds,level:number):TerminalCore[]{
 const layout=T1_SECOND_FLOOR_LAYOUT.escalatorCores;
 if(level===0)return [
  {x:b.x,z:b.z-b.depth*.035,direction:1},
  {x:b.x-b.width*.32,z:b.z-42,direction:1},
 ];
 if(level===3)return [{x:b.x,z:b.z+b.depth*.17,direction:1}];
 return layout.zRatios.map(ratio=>{
  const side=ratio<0?-1:1;
  return {x:b.x+b.width*layout.xRatio,z:b.z+b.depth*ratio+side*(level===2?18:0),direction:side};
 });
}

export function t1EscalatorOpenings(b:BuildingBounds,level:number){
 const run=escalatorRun(T1_FLOOR_LEVELS[level]-T1_FLOOR_LEVELS[level-1]);
 return t1VerticalCores(b,level-1).map(core=>escalatorOpening(core,run));
}

export function terminalEscalators(b:BuildingBounds,terminal:'T1'|'T2'){
 const levels=terminal==='T1'?T1_FLOOR_LEVELS:T2_FLOOR_LEVELS;
 const cores=terminal==='T1'?t1VerticalCores:t2VerticalCores;
 return levels.slice(0,-1).flatMap((lowerFloor,i)=>{
  const upperFloor=levels[i+1],run=escalatorRun(upperFloor-lowerFloor);
  return cores(b,i).flatMap(core=>[-1,1].map(lane=>({
   axis:'z' as const,center:core.x+lane*ESCALATOR_LANE_OFFSET,width:ESCALATOR_TREAD_WIDTH,
   lowerEnd:core.z-core.direction*run/2,upperEnd:core.z+core.direction*run/2,
   lowerFloor,upperFloor,
  } satisfies WalkSlope)));
 });
}
