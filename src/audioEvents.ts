import type {Aircraft,AircraftState,RadioMessage} from './types';

/** Detect one-shot sound events from snapshots, including a skipped TOUCHDOWN frame. */
export class AudioEvents {
 private states=new Map<string,AircraftState>();
 private lastRadioId=0;
 reset(aircraft:Aircraft[],radio:RadioMessage[]){
  this.states=new Map(aircraft.map(a=>[a.id,a.state]));this.lastRadioId=radio[0]?.id??0;
 }
 update(aircraft:Aircraft[],radio:RadioMessage[],playing:boolean){
  const touchdowns:Aircraft[]=[];
  const active=new Set<string>();
  for(const a of aircraft){
   active.add(a.id);const old=this.states.get(a.id);
   if(playing&&old&&['APPROACH','FINAL','LANDING_CLEARED'].includes(old)&&['TOUCHDOWN','DECELERATING'].includes(a.state))touchdowns.push(a);
   this.states.set(a.id,a.state);
  }
  for(const id of this.states.keys())if(!active.has(id))this.states.delete(id);
  const latest=radio[0]?.id??0;
  const message=playing?radio.find(m=>m.id>this.lastRadioId&&!!m.aircraftId):undefined;
  this.lastRadioId=latest;
  return {touchdowns,message};
 }
}
