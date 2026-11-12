import type {Aircraft,Scenario,Weather} from '../types';
import {runways,type Runway} from '../data/airport';
import {FLEET} from '../data/fleet';
import {performanceFor,wakeSeconds} from './performance';
import {difficultyFor} from './difficulty';
export interface RunwayUse {time:number;type:string}
export interface ArrivalPrediction {id:string;callsign:string;type:string;wake:string;distanceNm:number;speedKt:number;thresholdSeconds:number;occupancySeconds:number;vacateSeconds:number;compressed:boolean}
export interface DeparturePrediction {id:string;callsign:string;type:string;wake:string;lineUpSeconds:number;occupancySeconds:number;wakeWaitSeconds:number;delay:number}
export interface DepartureWindow {start:number;end:number;after?:string;before?:string}
export interface RunwayPlan {id:string;name:string;occupants:string[];clearIn:number;arrivals:ArrivalPrediction[];departures:DeparturePrediction[];windows:DepartureWindow[]}
export function aircraftRunway(a:Aircraft):Runway{return runways.find(r=>r.ends.includes(a.runway))??runways[0];}
export function thresholdETA(a:Aircraft):number {
 const r=aircraftRunway(a),direction=a.runway===r.ends[1]?'23':'05',sign=direction==='05'?1:-1,threshold=r.x-sign*(r.length/2-r.thresholdOffsets[direction]);
 return Math.max(0,(threshold-a.position.x)*sign)/Math.max(35,a.speed);
}
export function takeoffEstimate(a:Aircraft,weather:Weather){
 const p=performanceFor(a,weather),roll=Math.max(0,p.vr-a.speed)/p.acceleration,climb=9/(p.climbRate*.65)+11/p.climbRate;
 return Math.ceil(roll+climb+(a.state==='TAKEOFF_ROLL'?0:a.pilot.responseDelay));
}
export function lineUpEstimate(a:Aircraft){return ['READY_FOR_TAKEOFF','TAKEOFF_CLEARED','TAKEOFF_ROLL'].includes(a.state)?0:a.state==='LINING_UP'?20:Math.ceil(145/4+a.pilot.responseDelay);}
export function landingClearEstimate(a:Aircraft,weather:Weather,fromThreshold=true){
 const r=aircraftRunway(a),direction=a.runway===r.ends[1]?'23':'05',sign=direction==='05'?1:-1,p=performanceFor(a,weather);
 // Integrates the game's existing deceleration targets, so the displayed estimate
 // reflects wetness, aircraft weight and the selected modeled runway exit.
 const exit=runwayExitPositions[r.id+'-'+direction],threshold=r.x-sign*(r.length/2-r.thresholdOffsets[direction]);
 let remaining=fromThreshold?(exit-threshold)*sign-250:(exit-a.position.x)*sign,speed=fromThreshold?p.landingSpeed:a.speed,seconds=fromThreshold?250/Math.max(35,a.speed):0;
 for(let i=0;i<600&&remaining>20;i++){speed=Math.max(remaining>250?10:4,speed-p.braking);remaining-=speed;seconds++;}
 return Math.ceil(seconds+(r.width/2+Math.max(FLEET[a.type].length,FLEET[a.type].span)/2+8)/5+3);
}
// Read exit coordinates from the immutable graph, never guessed from runway length.
import {nodeById} from './routing';
const runwayExitPositions=Object.fromEntries(runways.flatMap(r=>Object.entries(r.exitNodes).map(([d,id])=>[r.id+'-'+d,nodeById.get(id)!.x])));
export function occupiedClearEstimate(a:Aircraft|undefined,weather:Weather):number {
 if(!a)return Infinity;
 if(['TAKEOFF_CLEARED','TAKEOFF_ROLL'].includes(a.state))return takeoffEstimate(a,weather);
 if(a.state==='AIRBORNE'||a.state==='DEPARTURE')return Math.ceil(Math.max(0,20-a.position.y)/performanceFor(a,weather).climbRate);
 if(['TOUCHDOWN','DECELERATING'].includes(a.state))return landingClearEstimate(a,weather,false);
 if(a.state==='VACATING_RUNWAY'){const r=aircraftRunway(a);return Math.ceil(Math.max(0,r.width/2+Math.max(FLEET[a.type].length,FLEET[a.type].span)/2+8-Math.abs(a.position.z-r.z))/Math.max(2,a.speed)+3);}
 return Infinity;
}
export function buildRunwayPlans(aircraft:Aircraft[],weather:Weather,elapsed:number,direction:'05'|'23',occupancy:Map<string,string[]>,lastUse:Map<string,RunwayUse>,scenario:Scenario):RunwayPlan[]{
 const profile=difficultyFor(scenario);
 return runways.map(r=>{
  const traffic=aircraft.filter(a=>!a.completed&&r.ends.includes(a.runway));
  const arrivals:ArrivalPrediction[]=traffic.filter(a=>['APPROACH','FINAL','LANDING_CLEARED'].includes(a.state)).map(a=>({id:a.id,callsign:a.callsign,type:a.type,wake:FLEET[a.type].wake,distanceNm:thresholdETA(a)*Math.max(35,a.speed)/1852,speedKt:a.speed/.514444,thresholdSeconds:thresholdETA(a),occupancySeconds:landingClearEstimate(a,weather),vacateSeconds:thresholdETA(a)+landingClearEstimate(a,weather),compressed:false})).sort((a,b)=>a.thresholdSeconds-b.thresholdSeconds||a.id.localeCompare(b.id));
  for(let i=1;i<arrivals.length;i++){const leader=arrivals[i-1],follower=arrivals[i];follower.compressed=follower.thresholdSeconds-leader.thresholdSeconds<Math.max(leader.occupancySeconds,wakeSeconds(leader.type,follower.type)*profile.wakeFactor)+profile.warningBuffer;}
  const previous=lastUse.get(r.id);
  const departures:DeparturePrediction[]=traffic.filter(a=>['HOLDING_SHORT','LINE_UP_CLEARED','LINING_UP','READY_FOR_TAKEOFF','TAKEOFF_CLEARED','TAKEOFF_ROLL'].includes(a.state)).map(a=>({id:a.id,callsign:a.callsign,type:a.type,wake:FLEET[a.type].wake,lineUpSeconds:lineUpEstimate(a),occupancySeconds:takeoffEstimate(a,weather),wakeWaitSeconds:previous?Math.max(0,Math.ceil(previous.time+wakeSeconds(previous.type,a.type)*profile.wakeFactor-elapsed)):0,delay:a.delay})).sort((a,b)=>a.lineUpSeconds-b.lineUpSeconds||b.delay-a.delay||a.id.localeCompare(b.id));
  const occupants=occupancy.get(r.id)??[],clearIn=occupants.length?Math.max(...occupants.map(id=>occupiedClearEstimate(aircraft.find(a=>a.id===id),weather))):0;
  const candidate=departures[0],occupancyTime=candidate?.occupancySeconds??65,windows:DepartureWindow[]=[];
  if(!candidate)return {id:r.id,name:r.ends[direction==='05'?0:1],occupants,clearIn,arrivals,departures,windows};
  const blocking=occupants.filter(id=>id!==candidate?.id),departureClear=blocking.length?Math.max(...blocking.map(id=>occupiedClearEstimate(aircraft.find(a=>a.id===id),weather))):0;
  let start=Math.max(departureClear+candidate.lineUpSeconds,candidate.wakeWaitSeconds),after:string|undefined;
  for(const arrival of arrivals){const end=arrival.thresholdSeconds-occupancyTime-profile.warningBuffer;if(end>start)windows.push({start:Math.ceil(start),end:Math.floor(end),after,before:arrival.id});start=Math.max(start,arrival.vacateSeconds+candidate.lineUpSeconds,wakeSeconds(arrival.type,candidate.type)*profile.wakeFactor+arrival.thresholdSeconds);after=arrival.id;}
  if(start<900)windows.push({start:Math.ceil(start),end:900,after});
  return {id:r.id,name:r.ends[direction==='05'?0:1],occupants,clearIn,arrivals,departures,windows};
 });
}
