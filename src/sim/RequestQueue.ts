import type {Aircraft,Role,Scenario} from '../types';
import type {GroundConflict,GroundWait} from './GroundTraffic';
import type {RunwayPlan} from './RunwayPlanner';
import {difficultyFor,routineEnabled} from './difficulty';
export type RequestKind='delivery'|'pushback'|'engines'|'taxi'|'departure'|'approach'|'landing'|'ground'|'gate'|'blocked'|'priority'|'configuration'|'crossing';
export type Urgency='low'|'medium'|'high'|'critical';
export interface ControllerRequest {id:string;aircraftId?:string;kind:RequestKind;role:Role;since:number;time:number;age:number;urgency:Urgency;level:'advisory'|'caution'|'warning';detail:string;related?:string;zone?:string}
interface QueueInput {aircraft:Aircraft[];time:number;elapsed:number;scenario:Scenario;conflicts:GroundConflict[];waits:Map<string,GroundWait>;runways:RunwayPlan[];gates:Map<string,string>;directionMismatch:boolean}
export class RequestQueue {
 private pending=new Map<string,ControllerRequest>();
 reset(){this.pending.clear();}
 update(input:QueueInput):ControllerRequest[]{
  const {aircraft,time,elapsed,scenario}=input,seen=new Set<string>(),aging=difficultyFor(scenario).requestAging;
  const add=(id:string,kind:RequestKind,role:Role,base:Urgency,detail:string,aircraftId?:string,related?:string,zone?:string)=>{
   seen.add(id);const old=this.pending.get(id),since=old?.since??elapsed,age=Math.max(0,elapsed-since);let urgency=base;
   if(base==='low'&&age>180*aging)urgency='medium';if((base==='low'||base==='medium')&&age>600*aging)urgency='high';
   this.pending.set(id,{id,kind,role,since,time:old?.time??time,age,urgency,level:urgency==='critical'?'warning':urgency==='high'?'caution':'advisory',detail,aircraftId,related,zone});
  };
  for(const a of aircraft){if(a.completed)continue;let kind:RequestKind|undefined,role=a.role,urgency:Urgency='low',detail=a.clearance;
   if(a.held){kind='blocked';detail='Controller hold';}
   else switch(a.state){
    case 'REQUESTING_PUSHBACK':kind=a.role==='Delivery'?'delivery':'pushback';break;
    case 'ENGINE_START':if(!routineEnabled(scenario)&&a.timer===0)kind='engines';break;
    case 'READY_TO_TAXI':kind='taxi';role='Ground';break;
    case 'HOLDING_SHORT':case 'READY_FOR_TAKEOFF':kind='departure';role='Tower';urgency='medium';break;
    case 'APPROACH':kind='approach';urgency='medium';break;
    case 'FINAL':kind='landing';role='Tower';urgency='medium';break;
    case 'GROUND_CONTACT':kind='ground';role='Ground';break;
   }
   const prediction=input.runways.flatMap(r=>r.arrivals).find(p=>p.id===a.id),runway=input.runways.find(r=>r.arrivals.some(p=>p.id===a.id));
   if(prediction){if(prediction.thresholdSeconds<120)urgency='high';if(prediction.thresholdSeconds<50&&(!a.landingCleared||!!runway?.occupants.length))urgency='critical';if(!kind&&a.state==='LANDING_CLEARED'&&runway&&runway.clearIn>prediction.thresholdSeconds){kind='landing';detail='Arrival / departure occupancy conflict';urgency=prediction.thresholdSeconds<60?'critical':'high';}}
   if(kind)add(a.id+':'+kind,kind,role,urgency,detail,a.id);
   const gateOwner=input.gates.get(a.gate);if(a.kind==='arrival'&&gateOwner&&gateOwner!==a.id&&prediction&&prediction.thresholdSeconds<600)add(a.id+':gate','gate','Ground',prediction.thresholdSeconds<180?'high':'medium',`Stand ${a.gate} occupied`,a.id,gateOwner);
   const wait=input.waits.get(a.id);if(wait&&elapsed-wait.since>5&&!a.held)add(a.id+':surface',wait.reason==='Runway crossing clearance required'?'crossing':'blocked','Ground',wait.intervention?'high':'medium',wait.reason,a.id,wait.owners[0],wait.zone);
  }
  const pairs=new Set<string>();
  for(const c of [...input.conflicts].sort((a,b)=>Number(b.needsDecision)-Number(a.needsDecision)||a.since-b.since))if(c.needsDecision||c.kind==='opposing'||c.aircraftIds.length>2){const pair=[...c.aircraftIds].sort().join('|');if(pairs.has(pair))continue;pairs.add(pair);add('priority:'+pair,'priority','Ground',c.needsDecision?'high':'medium',c.label,c.aircraftIds[0],c.id,c.zone);}
  if(input.directionMismatch)add('airport:flow','configuration','Tower','medium','Wind favors a different runway direction');
  for(const key of this.pending.keys())if(!seen.has(key))this.pending.delete(key);
  const rank:Record<Urgency,number>={low:0,medium:1,high:2,critical:3};
  return [...this.pending.values()].sort((a,b)=>rank[b.urgency]-rank[a.urgency]||a.since-b.since||a.id.localeCompare(b.id));
 }
}
