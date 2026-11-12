import type { Airline, FleetProfile } from '../types';
import { airlineIdForIata, TPE_CARRIERS } from './carriers';

/** Dimensions are manufacturer family specifications; all operational rates below
 * are deliberately conservative game calibrations, not certified performance. SI units. */
export const FLEET: Record<string, FleetProfile> = {
  A320: { id:'A320', name:'Airbus A320neo', length:37.57, span:35.8, height:11.76, mtow:79000, emptyWeight:44300, minWeight:54000, maxWeight:77000, taxiSpeed:8.0, taxiAcceleration:.48, taxiBraking:1.35, acceleration:2.02, v1:69, vr:74, climbRate:13.0, approachSpeed:70, landingSpeed:65, braking:1.8, wake:'M', turnRadius:28, engines:2 },
  A321: { id:'A321', name:'Airbus A321neo', length:44.51, span:35.8, height:11.76, mtow:97000, emptyWeight:50000, minWeight:62000, maxWeight:94000, taxiSpeed:7.6, taxiAcceleration:.42, taxiBraking:1.3, acceleration:1.9, v1:72, vr:77, climbRate:12.3, approachSpeed:73, landingSpeed:68, braking:1.65, wake:'M', turnRadius:33, engines:2 },
  A330: { id:'A330', name:'Airbus A330-300', length:63.66, span:60.3, height:16.79, mtow:242000, emptyWeight:124500, minWeight:150000, maxWeight:235000, taxiSpeed:6.8, taxiAcceleration:.32, taxiBraking:1.1, acceleration:1.64, v1:76, vr:82, climbRate:11.5, approachSpeed:75, landingSpeed:71, braking:1.42, wake:'H', turnRadius:45, engines:2 },
  A350: { id:'A350', name:'Airbus A350-900', length:66.8, span:64.75, height:17.05, mtow:283000, emptyWeight:142400, minWeight:174000, maxWeight:276000, taxiSpeed:7.0, taxiAcceleration:.34, taxiBraking:1.15, acceleration:1.8, v1:77, vr:83, climbRate:13.0, approachSpeed:74, landingSpeed:70, braking:1.5, wake:'H', turnRadius:47, engines:2 },
  B789: { id:'B789', name:'Boeing 787-9', length:62.81, span:60.12, height:17.02, mtow:254011, emptyWeight:128850, minWeight:157000, maxWeight:248000, taxiSpeed:7.2, taxiAcceleration:.35, taxiBraking:1.12, acceleration:1.85, v1:76, vr:81, climbRate:13.0, approachSpeed:74, landingSpeed:69, braking:1.52, wake:'H', turnRadius:44, engines:2 },
  B78X: { id:'B78X', name:'Boeing 787-10', length:68.28, span:60.12, height:17.02, mtow:254011, emptyWeight:135500, minWeight:167000, maxWeight:249000, taxiSpeed:6.8, taxiAcceleration:.32, taxiBraking:1.07, acceleration:1.72, v1:78, vr:84, climbRate:11.8, approachSpeed:77, landingSpeed:72, braking:1.44, wake:'H', turnRadius:49, engines:2 },
  B77W: { id:'B77W', name:'Boeing 777-300ER', length:73.86, span:64.8, height:18.5, mtow:351534, emptyWeight:167829, minWeight:218000, maxWeight:343000, taxiSpeed:6.2, taxiAcceleration:.27, taxiBraking:1.0, acceleration:1.58, v1:80, vr:86, climbRate:10.8, approachSpeed:79, landingSpeed:74, braking:1.35, wake:'H', turnRadius:53, engines:2 },
  B77F: { id:'B77F', name:'Boeing 777F', length:63.73, span:64.8, height:18.5, mtow:347815, emptyWeight:144379, minWeight:213000, maxWeight:338000, taxiSpeed:6.3, taxiAcceleration:.28, taxiBraking:1.02, acceleration:1.61, v1:80, vr:85, climbRate:11.0, approachSpeed:78, landingSpeed:73, braking:1.36, wake:'H', turnRadius:47, engines:2, cargo:true },
  A320C: { id:'A320C', name:'Airbus A320-200', length:37.57, span:35.8, height:11.76, mtow:78000, emptyWeight:42600, minWeight:51500, maxWeight:76500, taxiSpeed:8.0, taxiAcceleration:.48, taxiBraking:1.35, acceleration:2.02, v1:69, vr:74, climbRate:13.0, approachSpeed:70, landingSpeed:65, braking:1.8, wake:'M', turnRadius:28, engines:2 },
  A321C: { id:'A321C', name:'Airbus A321-200', length:44.51, span:35.8, height:11.76, mtow:93500, emptyWeight:47000, minWeight:60000, maxWeight:91000, taxiSpeed:7.6, taxiAcceleration:.42, taxiBraking:1.3, acceleration:1.9, v1:72, vr:77, climbRate:12.3, approachSpeed:73, landingSpeed:68, braking:1.65, wake:'M', turnRadius:33, engines:2 },
  A332: { id:'A332', name:'Airbus A330-200', length:58.82, span:60.3, height:17.39, mtow:251000, emptyWeight:120000, minWeight:148000, maxWeight:245000, taxiSpeed:6.8, taxiAcceleration:.32, taxiBraking:1.1, acceleration:1.64, v1:76, vr:82, climbRate:11.5, approachSpeed:75, landingSpeed:71, braking:1.42, wake:'H', turnRadius:42, engines:2 },
  A339: { id:'A339', name:'Airbus A330-900neo', length:63.69, span:64.0, height:16.79, mtow:253000, emptyWeight:128000, minWeight:155000, maxWeight:249000, taxiSpeed:6.8, taxiAcceleration:.32, taxiBraking:1.1, acceleration:1.64, v1:76, vr:82, climbRate:11.5, approachSpeed:75, landingSpeed:71, braking:1.42, wake:'H', turnRadius:45, engines:2 },
  A35K: { id:'A35K', name:'Airbus A350-1000', length:73.78, span:64.75, height:17.05, mtow:324000, emptyWeight:155000, minWeight:187000, maxWeight:317000, taxiSpeed:6.8, taxiAcceleration:.32, taxiBraking:1.08, acceleration:1.68, v1:79, vr:85, climbRate:12.0, approachSpeed:76, landingSpeed:71, braking:1.46, wake:'H', turnRadius:51, engines:2 },
  A380: { id:'A380', name:'Airbus A380-800', length:72.72, span:79.8, height:24.09, mtow:575000, emptyWeight:276800, minWeight:350000, maxWeight:565000, taxiSpeed:5.8, taxiAcceleration:.19, taxiBraking:.86, acceleration:1.36, v1:78, vr:84, climbRate:9.8, approachSpeed:77, landingSpeed:71, braking:1.28, wake:'H', turnRadius:64, engines:4 },
  B738: { id:'B738', name:'Boeing 737-800', length:39.5, span:35.8, height:12.5, mtow:79010, emptyWeight:41400, minWeight:53000, maxWeight:77500, taxiSpeed:8.0, taxiAcceleration:.48, taxiBraking:1.35, acceleration:2.02, v1:69, vr:74, climbRate:13.0, approachSpeed:70, landingSpeed:65, braking:1.8, wake:'M', turnRadius:29, engines:2 },
  B739: { id:'B739', name:'Boeing 737-900', length:42.1, span:35.8, height:12.5, mtow:85130, emptyWeight:43400, minWeight:57500, maxWeight:83500, taxiSpeed:7.8, taxiAcceleration:.45, taxiBraking:1.32, acceleration:1.96, v1:71, vr:76, climbRate:12.5, approachSpeed:72, landingSpeed:67, braking:1.72, wake:'M', turnRadius:31, engines:2 },
  B38M: { id:'B38M', name:'Boeing 737 MAX 8', length:39.52, span:35.92, height:12.3, mtow:82640, emptyWeight:45070, minWeight:55000, maxWeight:81000, taxiSpeed:8.0, taxiAcceleration:.48, taxiBraking:1.35, acceleration:2.02, v1:69, vr:74, climbRate:13.0, approachSpeed:70, landingSpeed:65, braking:1.8, wake:'M', turnRadius:29, engines:2 },
  B772: { id:'B772', name:'Boeing 777-200ER', length:63.73, span:60.9, height:18.5, mtow:297550, emptyWeight:138000, minWeight:180000, maxWeight:291000, taxiSpeed:6.3, taxiAcceleration:.28, taxiBraking:1.02, acceleration:1.61, v1:78, vr:84, climbRate:11.0, approachSpeed:78, landingSpeed:73, braking:1.36, wake:'H', turnRadius:46, engines:2 },
  B773: { id:'B773', name:'Boeing 777-300', length:73.86, span:60.9, height:18.5, mtow:299370, emptyWeight:160000, minWeight:210000, maxWeight:293000, taxiSpeed:6.3, taxiAcceleration:.28, taxiBraking:1.02, acceleration:1.61, v1:79, vr:85, climbRate:10.9, approachSpeed:78, landingSpeed:73, braking:1.36, wake:'H', turnRadius:51, engines:2 },
};

const establishedAirlines: Record<string, Airline> = {
  EVA: {id:'EVA',name:'EVA Air',localName:'長榮航空',prefix:'BR',telephonyCallsign:'Eva',color:'#08725e',secondary:'#efaa3c',tailText:'EVA'},
  CAL: {id:'CAL',name:'China Airlines',localName:'中華航空',prefix:'CI',telephonyCallsign:'Dynasty',color:'#183b80',secondary:'#ea7fa7',tailText:'CI'},
  SJX: {id:'SJX',name:'STARLUX Airlines',localName:'星宇航空',prefix:'JX',telephonyCallsign:'Starwalker',color:'#665348',secondary:'#c7a36a',tailText:'STARLUX'},
  TTW: {id:'TTW',name:'Tigerair Taiwan',localName:'台灣虎航',prefix:'IT',telephonyCallsign:'Smart Cat',color:'#f4bc20',secondary:'#202327',tailText:'tigerair'},
};

const additionalAirlines:Record<string,Airline>=Object.fromEntries(Object.entries(TPE_CARRIERS)
  .filter(([code])=>!['BR','CI','JX','IT'].includes(code))
  .map(([code,carrier])=>[code,{id:code,name:carrier.name,localName:carrier.localName,prefix:code,telephonyCallsign:'',color:'#73858a',secondary:'#d7dddc',tailText:code}]));

export const AIRLINES:Record<string,Airline>={...establishedAirlines,...additionalAirlines};
export { airlineIdForIata };

export const AIRLINE_FLEET: Record<string,string[]> = {
  EVA:['B78X','B789','B77W','A330'], CAL:['A321','A350','B77W','B77F'], SJX:['A321','A350','A339'], TTW:['A320','A320C'],
};
export const fleet = FLEET;
export const airlines = AIRLINES;
export const FLEET_DATA_NOTE = 'Family dimensions from Airbus / Boeing airport-planning specifications. Weight, speed, acceleration, braking and wake intervals are gameplay approximations; never use for flight operations.';
