import type { Scenario } from '../types';
import { AIRLINE_FLEET } from './fleet';
import { difficultyFor } from '../sim/difficulty';
import snapshot from './schedules/tpe-2026-11-11.json';

export interface ScheduledFlight {
  id:string; time:number; kind:'arrival'|'departure'; airline:string; type:string; number:string; airport:string;
  exact?:boolean; scheduledTime?:number; publishedScheduledTime?:number; reportedType?:string;
  gate?:string; terminal?:string; status?:string;
}
export interface ScheduleProvider { readonly label:string; readonly exact:boolean; flights(date:string, seed:number, density:number):ScheduledFlight[] }
export function seededRandom(seed:number):()=>number { let s=seed>>>0; return()=>{ s=(s+0x6D2B79F5)|0; let t=Math.imul(s^(s>>>15),1|s); t^=t+Math.imul(t^(t>>>7),61|t); return((t^(t>>>14))>>>0)/4294967296; }; }
export function secondsOfDay(text:string):number { const [h,m]=text.split(':').map(Number); return (Number.isFinite(h)?h:17)*3600+(Number.isFinite(m)?m:0)*60; }
export function plausiblePorts(type:string):string[] {return ['A320','A321'].includes(type)?['NRT','KIX','HKG','SIN','ICN','BKK','MNL','DAD','OKA','FUK']:type==='B77F'?['HKG','NRT','SIN','ANC','LAX','FRA']:['NRT','KIX','HKG','SIN','ICN','BKK','SFO','LAX','SEA','FRA','CDG'];}

/** Locally generated representative traffic banks. These are NOT published flights,
 * equipment assignments, a live feed, or an exact historical Taoyuan schedule. */
export class TypicalDayFallbackProvider implements ScheduleProvider {
  readonly label='Typical Taoyuan Traffic Day · synthetic schedule';
  readonly exact=false;
  flights(date:string, seed:number, density:number):ScheduledFlight[] {
    const dateHash=[...date].reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0),0);
    const random=seededRandom(seed^dateHash), result:ScheduledFlight[]=[];
    const hourly=[4,3,2,2,4,9,17,22,25,22,18,15,17,18,16,20,24,30,31,28,23,19,14,8];
    let serial=0;
    for(let day=0;day<2;day++) for(let hour=0;hour<24;hour++) {
      const count=Math.max(1,Math.round(hourly[hour]*Math.max(.2,Math.min(2,density))));
      const centers=[420+random()*300,1550+random()*500,2900+random()*350];
      for(let n=0;n<count;n++) {
        const airline=(['EVA','CAL','SJX','TTW'] as const)[Math.floor(random()*4)];
        const pool=AIRLINE_FLEET[airline], type=pool[Math.floor(random()*pool.length)];
        const ports=plausiblePorts(type),bank=Math.floor(random()*3), offset=(random()+random()+random()-1.5)*500;
        const time=day*86400+hour*3600+Math.max(0,Math.min(3599,centers[bank]+offset));
        result.push({id:`fixture-${++serial}`,time,kind:random()<(bank===0?.76:bank===1?.25:.51)?'arrival':'departure',airline,type,number:String(100+Math.floor(random()*890)),airport:ports[Math.floor(random()*ports.length)]});
      }
    }
    return result.sort((a,b)=>a.time-b.time || a.id.localeCompare(b.id));
  }
}

type SnapshotFlight = (typeof snapshot.flights)[number];
function dayOffset(date:string, baseDate:string):number {
  const dateValue=Date.parse(`${date}T00:00:00Z`),baseValue=Date.parse(`${baseDate}T00:00:00Z`);
  return Number.isFinite(dateValue)&&Number.isFinite(baseValue)?Math.round((dateValue-baseValue)/86400000):0;
}
function secondsOnDate(date:string,time:string,baseDate:string):number {return dayOffset(date,baseDate)*86400+secondsOfDay(time);}
function simulationTypeFor(model:string):string {
  const value=model.toUpperCase().replaceAll(' ','');
  if(value.startsWith('A380'))return 'A380';
  if(value.startsWith('A350-1000'))return 'A35K';
  if(value.startsWith('A350'))return 'A350';
  if(value.startsWith('A330-900'))return 'A339';
  if(value.startsWith('A330-200'))return 'A332';
  if(value.startsWith('A330'))return 'A330';
  if(value.startsWith('A321'))return /N(?:X)?$|NEO/.test(value)?'A321':'A321C';
  if(value.startsWith('A320'))return /N(?:X)?$|NEO/.test(value)?'A320':'A320C';
  if(value.startsWith('B777')){
    if(value.includes('FREIGHTER')||value.endsWith('F'))return 'B77F';
    if(value.includes('-200'))return 'B772';
    return value.includes('300ER')?'B77W':'B773';
  }
  if(value.startsWith('B787-10'))return 'B78X';
  if(value.startsWith('B787'))return 'B789';
  if(value.startsWith('B737-MAX8')||value.startsWith('B737-8 MAX'))return 'B38M';
  if(value.startsWith('B737-900'))return 'B739';
  if(value.startsWith('B737-800'))return 'B738';
  if(value.startsWith('B737'))return 'B738';
  return 'A320';
}

export const officialScheduleProvider:ScheduleProvider={
  label:`Taoyuan Airport official schedule snapshot · ${snapshot.snapshotDate}`,
  exact:true,
  flights(date:string):ScheduledFlight[]{
    if(date!==snapshot.snapshotDate)return [];
    return (snapshot.flights as SnapshotFlight[]).map((record,index)=>{
      const scheduled=secondsOnDate(record.date,record.scheduledTime,snapshot.snapshotDate);
      const hasEstimatedTime=!!record.expectedDate&&!!record.expectedTime;
      const statusHasUpdatedTime=['改時','出發','已到'].includes(record.status);
      const eventTime=hasEstimatedTime&&statusHasUpdatedTime?secondsOnDate(record.expectedDate,record.expectedTime,snapshot.snapshotDate):scheduled;
      const lead=record.kind==='departure'?15*60:5*60;
      const profile=record.aircraftModel?simulationTypeFor(record.aircraftModel):'A320';
      return {
        id:`tpe-${record.date}-${record.airlineCode}-${record.number.trim()}-${record.kind}-${index}`,
        time:eventTime-lead,
        scheduledTime:eventTime,
        publishedScheduledTime:scheduled,
        kind:record.kind as 'arrival'|'departure',
        airline:record.airlineCode,
        type:profile,
        number:record.number.trim(),
        airport:record.airport,
        exact:true,
        reportedType:record.aircraftModel||undefined,
        gate:record.gate||undefined,
        terminal:record.terminal,
        status:record.status||undefined,
      };
    }).sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));
  },
};

export const scheduleProvider:ScheduleProvider=new TypicalDayFallbackProvider();
export const OFFICIAL_SCHEDULE_DATE=snapshot.snapshotDate;
export const OFFICIAL_SCHEDULE_COUNT=snapshot.rowCount;
export const OFFICIAL_SCHEDULE_CAPTURED_AT=snapshot.capturedAt;
export function hasOfficialSchedule(date:string):boolean{return date===snapshot.snapshotDate;}
export function scenarioSchedule(scenario:Scenario):ScheduledFlight[] {
  if(hasOfficialSchedule(scenario.date))return officialScheduleProvider.flights(scenario.date,scenario.seed,1);
  return scheduleProvider.flights(scenario.date,scenario.seed,scenario.density*difficultyFor(scenario).density);
}

/** Continue an unlimited observation session with a dated synthetic day after its source runs out. */
export function explorationScheduleAfter(scenario:Scenario,after:number):ScheduledFlight[] {
  const day=Math.max(1,Math.floor(after/86400)+1);
  const date=new Date(Date.parse(`${scenario.date}T00:00:00Z`)+day*86400000).toISOString().slice(0,10);
  return scheduleProvider.flights(date,scenario.seed,scenario.density*difficultyFor(scenario).density)
    .filter(f=>f.time<86400)
    .map(f=>({...f,id:`roam-${day}-${f.id}`,time:f.time+day*86400}));
}
