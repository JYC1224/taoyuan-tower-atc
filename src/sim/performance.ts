import type { Aircraft, FleetProfile, Weather } from '../types';
import { FLEET } from '../data/fleet';
export interface EffectivePerformance { taxiSpeed:number; taxiAcceleration:number; taxiBraking:number; acceleration:number; vr:number; v1:number; climbRate:number; approachSpeed:number; landingSpeed:number; braking:number; stoppingDistance:number }
export function performanceFor(aircraft:Pick<Aircraft,'type'|'weight'>,weather:Weather):EffectivePerformance {
  const p:FleetProfile=FLEET[aircraft.type]??FLEET.A320;
  const ratio=Math.max(.65,Math.min(1.08,aircraft.weight/p.mtow));
  const heavy=ratio/.82, wet=1-weather.wetness*.32;
  const braking=p.braking*wet/Math.sqrt(heavy);
  const landingSpeed=p.landingSpeed*Math.sqrt(heavy);
  return { taxiSpeed:p.taxiSpeed*(weather.visibility<1000?.65:1), taxiAcceleration:p.taxiAcceleration/heavy, taxiBraking:p.taxiBraking*wet, acceleration:p.acceleration/heavy*(1-weather.wetness*.045), vr:p.vr*Math.sqrt(heavy),v1:p.v1*Math.sqrt(heavy), climbRate:p.climbRate/heavy, approachSpeed:p.approachSpeed*Math.sqrt(heavy),landingSpeed,braking,stoppingDistance:landingSpeed*landingSpeed/(2*braking) };
}
export function wakeSeconds(leaderType:string,followerType:string):number { return FLEET[leaderType]?.wake==='H'?(FLEET[followerType]?.wake==='M'?120:90):60; }
