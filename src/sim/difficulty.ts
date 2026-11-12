import type {Scenario} from '../types';
export interface DifficultyProfile {
 initialDepartures:number;initialArrivals:number;density:number;routine:boolean;
 priority:'auto'|'important'|'all';routeRecommendation:boolean;
 guidance:'full'|'predictions'|'limited'|'minimal';delayDivisor:number;safetyFactor:number;
 warningBuffer:number;wakeFactor:number;requestAging:number;
}
export const DIFFICULTIES:Record<Scenario['difficulty'],DifficultyProfile>={
 assisted:{initialDepartures:4,initialArrivals:2,density:.72,routine:true,priority:'auto',routeRecommendation:true,guidance:'full',delayDivisor:55,safetyFactor:.65,warningBuffer:25,wakeFactor:1,requestAging:1.6},
 standard:{initialDepartures:6,initialArrivals:3,density:1,routine:true,priority:'important',routeRecommendation:true,guidance:'predictions',delayDivisor:35,safetyFactor:1,warningBuffer:18,wakeFactor:1,requestAging:1},
 advanced:{initialDepartures:8,initialArrivals:4,density:1.2,routine:true,priority:'all',routeRecommendation:false,guidance:'limited',delayDivisor:27,safetyFactor:1.2,warningBuffer:12,wakeFactor:1,requestAging:.85},
 hardcore:{initialDepartures:9,initialArrivals:5,density:1.35,routine:false,priority:'all',routeRecommendation:false,guidance:'minimal',delayDivisor:23,safetyFactor:1.45,warningBuffer:8,wakeFactor:1.15,requestAging:.7}
};
export const difficultyFor=(scenario:Scenario)=>DIFFICULTIES[scenario.difficulty];
export const routineEnabled=(scenario:Scenario)=>!scenario.tutorial&&(scenario.routineAutomation??difficultyFor(scenario).routine);
