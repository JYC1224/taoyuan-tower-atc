import type { Aircraft, AircraftState, Command, CommandResult, Point, RadioMessage, Role, RouteProposal, Scenario, Scores, SimulationAPI, Weather, WeatherKind } from '../types';
import { gates, runways, taxiEdges, taxiNodes } from '../data/airport';
import { AIRLINES, AIRLINE_FLEET, FLEET, airlineIdForIata } from '../data/fleet';
import { plausiblePorts, scenarioSchedule, secondsOfDay, seededRandom, type ScheduledFlight } from '../data/schedule';
import { performanceFor, wakeSeconds } from './performance';
import { distance, edgeBetween, nearestTaxiNode, nodeById, shortestRoute, smoothPath, type PathPoint } from './routing';
import { GroundTraffic, projectSegment, type GroundIntent } from './GroundTraffic';
import { groundOverlap, sweptGroundDistance } from './groundFootprint';
import { difficultyFor,routineEnabled } from './difficulty';
import { buildRunwayPlans,thresholdETA,takeoffEstimate,lineUpEstimate,landingClearEstimate,occupiedClearEstimate } from './RunwayPlanner';
import { RequestQueue } from './RequestQueue';

type Direction='05'|'23';
interface Motion { path:PathPoint[]; point:number; direction:Direction; runwayId:string; phase:number; pushDelay:number; delivery:boolean; vacateRequested:boolean; collisionWarned:boolean; finishAt?:number; blockedTime:number; nextAssist:number; rejected:boolean; currentEdge?:string; edgeFrom?:string; missedPath?:Point[]; missedPoint?:number; resumeApproach?:boolean; routeRevision?:number; nextRecovery?:number; cancelled?:boolean; taxiAnchor?:string; crossing?:string }
const GROUND_STATES=new Set<AircraftState>(['PARKED','REQUESTING_PUSHBACK','PUSHBACK_CLEARED','PUSHING','ENGINE_START','READY_TO_TAXI','TAXI_CLEARED','TAXIING','HOLDING_SHORT','LINE_UP_CLEARED','LINING_UP','READY_FOR_TAKEOFF','TAKEOFF_CLEARED','TAKEOFF_ROLL','TOUCHDOWN','DECELERATING','VACATING_RUNWAY','GROUND_CONTACT','TAXIING_TO_GATE','ENTERING_STAND','DOCKED','COLLISION']);
const WAITING_STATES=new Set<AircraftState>(['REQUESTING_PUSHBACK','READY_TO_TAXI','HOLDING_SHORT','READY_FOR_TAKEOFF','GROUND_CONTACT']);
const WEATHER:Record<WeatherKind,{visibility:number;wetness:number;windSpeed:number}>={clear:{visibility:25000,wetness:0,windSpeed:7},cloudy:{visibility:16000,wetness:0,windSpeed:10},overcast:{visibility:10000,wetness:.05,windSpeed:12},rain:{visibility:5000,wetness:.8,windSpeed:15},storm:{visibility:2200,wetness:1,windSpeed:24},fog:{visibility:650,wetness:.25,windSpeed:3}};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const angle=(v:number)=>Math.atan2(Math.sin(v),Math.cos(v));
const headingTo=(a:Point,b:Point)=>Math.atan2(b.x-a.x,-(b.z-a.z));

/** Fixed-step deterministic simulation. Rendering consumes SI-unit aircraft snapshots
 * and never owns movement, clearances, schedule advancement or safety decisions. */
export class Simulation implements SimulationAPI {
  aircraft:Aircraft[]=[]; time=0; elapsed=0; timeScale=1; weather:Weather={kind:'clear',windDirection:50,windSpeed:7,visibility:25000,wetness:0};
  activeDirection:Direction='05'; recommendedDirection:Direction='05'; scores:Scores=this.freshScores(); radio:RadioMessage[]=[];
  pendingDirection?:Direction;
  private nextFlowCheck=0;
  scenario:Scenario; ended=false; gateOccupancy=new Map<string,string>(); runwayOccupancy=new Map<string,string[]>();
  readonly ground=new GroundTraffic(taxiNodes,taxiEdges);
  private readonly requestQueue=new RequestQueue();
  private operationsAt=-Infinity;
  private operationsCache?:ReturnType<Simulation['buildOperations']>;
  private nextGroundUpdate=0;
  private commandHistory=new Map<string,{command:string;time:number;state:string;contradictions:number}>();
  private motion=new Map<string,Motion>(); private random:()=>number=seededRandom(1); private accumulator=0; private serial=0; private radioSerial=0;
  private schedule:ScheduledFlight[]=[];private scheduleIndex=0;private lastRunwayUse=new Map<string,{time:number;type:string}>();private incidentAt=Infinity;
  private debugOccupants=new Set<string>();private eventCooldown=new Map<string,number>(); private demandIntegral=0; private delayIntegral=0; private tutorialArrival=false;private weatherAt=480;
  constructor(scenario:Scenario){this.scenario=scenario;this.reset(scenario);}
  private freshScores():Scores{return {safety:100,efficiency:100,delay:100,passenger:100,workload:100,overall:100,departures:0,arrivals:0,commands:0,playerCommands:0,decisions:0,routineCommands:0,commandEfficiency:100,decisionRate:0,commandRate:0,events:[]};}
  reset(scenario:Scenario):void {
    this.scenario={...scenario,positions:[...scenario.positions]};this.aircraft=[];this.time=secondsOfDay(scenario.startTime);this.elapsed=0;this.timeScale=1;this.ended=false;this.nextGroundUpdate=0;this.commandHistory.clear();this.pendingDirection=undefined;this.nextFlowCheck=0;
    this.random=seededRandom(scenario.seed);this.accumulator=0;this.serial=0;this.radioSerial=0;this.radio=[];this.motion.clear();this.ground.reset();this.gateOccupancy.clear();this.runwayOccupancy.clear();this.lastRunwayUse.clear();this.debugOccupants.clear();this.eventCooldown.clear();this.scores=this.freshScores();this.demandIntegral=0;this.delayIntegral=0;this.tutorialArrival=false;this.weatherAt=480;
    const kind=scenario.weather==='random'?(['clear','clear','cloudy','cloudy','overcast','rain','fog','storm'] as WeatherKind[])[Math.floor(this.random()*8)]:scenario.weather;
    this.setWeather(kind,50+Math.round(this.random()*32-16));this.activeDirection=this.recommendedDirection;
    this.schedule=scenarioSchedule(scenario);
    const officialSchedule=this.schedule.some(f=>f.exact);
    if(officialSchedule){this.schedule=this.schedule.filter(f=>(f.scheduledTime??f.time)>=this.time);this.scheduleIndex=0;}
    else {this.scheduleIndex=this.schedule.findIndex(f=>f.time>this.time+100);if(this.scheduleIndex<0)this.scheduleIndex=this.schedule.length;}
    this.incidentAt=scenario.incidents==='off'?Infinity:scenario.incidents==='training'?180:scenario.incidents==='normal'?600+this.random()*500:1500+this.random()*1200;
    this.log(officialSchedule?'Taoyuan Tower online. Official TPE flight schedule snapshot loaded; simulated movement and runway use remain game approximations.':'Taoyuan Tower online. Typical Taoyuan Traffic Day — synthetic local schedule.','info');
    if(scenario.tutorial){this.spawn('departure','A320');this.log('Training: select the departure strip and approve pushback. One arrival will join later.','advisory');}
    else if(!officialSchedule){const profile=difficultyFor(scenario);for(let i=0;i<profile.initialDepartures;i++)this.spawn('departure');for(let i=0;i<profile.initialArrivals;i++)this.spawn('arrival');}
    this.requestQueue.reset();this.operationsAt=-Infinity;this.refreshOccupancy();this.getOperations(true);
  }
  clearTraffic():void{this.aircraft=[];this.motion.clear();this.ground.reset();this.requestQueue.reset();this.operationsAt=-Infinity;this.gateOccupancy.clear();this.runwayOccupancy.clear();this.debugOccupants.clear();this.log('Developer: traffic cleared. Scheduled traffic will continue.','advisory');}
  spawn(kind:'departure'|'arrival',type?:string):Aircraft|null{return this.addAircraft(kind,type);}
  private addAircraft(kind:'departure'|'arrival',type?:string,flight?:ScheduledFlight):Aircraft|null {
    if(this.aircraft.length>=18)return null;
    const airline=flight?.exact?airlineIdForIata(flight.airline):flight?.airline??(type?Object.keys(AIRLINE_FLEET).find(id=>AIRLINE_FLEET[id].includes(type!)):undefined)??(['EVA','CAL','SJX','TTW'][Math.floor(this.random()*4)]);
    const options=AIRLINE_FLEET[airline]??AIRLINE_FLEET.EVA, selectedType=flight?.type??(type&&FLEET[type]?type:options[Math.floor(this.random()*options.length)]),profile=FLEET[selectedType]??FLEET.A320;
    const compatible=gates.filter(g=>g.maxSpan>=profile.span&&!this.gateOccupancy.has(g.id)&&(kind==='arrival'||!this.aircraft.some(a=>a.position.y<12&&distance(a.position,g)<(FLEET[a.type].length+profile.length)*.5+20)));
    if(!compatible.length){this.log('Traffic waiting off-field: no compatible free stand.','caution');return null;}
    const scheduledGate=flight?.gate?.replace(/R$/,'');
    const matchedGate=scheduledGate?compatible.find(g=>g.id===scheduledGate):undefined;
    const nearbyGate=scheduledGate?compatible.filter(g=>g.id[0]===scheduledGate[0]).sort((a,b)=>Math.abs(Number(a.id.slice(1))-Number(scheduledGate.slice(1)))-Math.abs(Number(b.id.slice(1))-Number(scheduledGate.slice(1))))[0]:undefined;
    let gate=matchedGate??nearbyGate??compatible[(this.serial*3)%compatible.length];
    // Occasional schedule pressure: a planned inbound stand may still contain a
    // departing flight. Physical stand ownership remains separate from planning.
    if(kind==='arrival'&&this.scenario.difficulty!=='assisted'&&!this.scenario.tutorial&&this.serial%7===0){const pressured=gates.find(g=>g.maxSpan>=profile.span&&this.aircraft.some(a=>a.gate===g.id&&a.kind==='departure'&&!a.completed&&['REQUESTING_PUSHBACK','PUSHBACK_CLEARED'].includes(a.state))&&!this.aircraft.some(a=>a.kind==='arrival'&&!a.completed&&a.gate===g.id));if(pressured)gate=pressured;}
    const rw=runways[this.serial%runways.length],dir=this.activeDirection,sign=dir==='05'?1:-1;
    const id=`AC-${++this.serial}`,number=flight?.number??String(100+Math.floor(this.random()*890));
    const arrivingCount=this.aircraft.filter(a=>a.kind==='arrival'&&!a.completed&&a.runway===rw.ends[dir==='05'?0:1]).length;
    const approachDistance=flight?.exact&&kind==='arrival'?clamp((flight.scheduledTime!-this.time)*profile.approachSpeed,1200,70000):24000+arrivingCount*11500,threshold=this.threshold(rw,dir);
    const start=kind==='departure'?{x:gate.x,y:0,z:gate.z}:{x:threshold.x-sign*approachDistance,y:Math.min(2400,approachDistance*.0524),z:rw.z};
    const weight=profile.minWeight+(profile.maxWeight-profile.minWeight)*(kind==='arrival'?.12+this.random()*.28:.32+this.random()*.63);
    const delivery=this.scenario.positions.includes('Delivery');
    const ports=plausiblePorts(selectedType);
    const flightNumber=AIRLINES[airline].prefix+number;
    const aircraft:Aircraft={id,airline,flightNumber,callsign:flight?.exact?flightNumber:airline+number,type:selectedType,kind,origin:kind==='arrival'?(flight?.airport??ports[this.serial%ports.length]):'TPE',destination:kind==='departure'?(flight?.airport??ports[this.serial%ports.length]):'TPE',scheduledTime:flight?.scheduledTime??(flight?.time??this.time)+(kind==='departure'?360:approachDistance/75),state:kind==='departure'?'REQUESTING_PUSHBACK':'APPROACH',position:start,heading:kind==='departure'?this.gateHeading(gate):sign*Math.PI/2,pitch:0,speed:kind==='departure'?0:profile.approachSpeed,weight,gate:gate.id,runway:rw.ends[dir==='05'?0:1],route:[],routeIndex:0,routeNames:[],held:false,role:kind==='departure'?(delivery?'Delivery':'Ground'):'Approach',timer:0,elapsed:0,completed:false,clearance:kind==='departure'?(delivery?'Requesting departure clearance':'Requesting pushback'):'Inbound; requesting approach',landingCleared:false,delay:0,pilot:{responseDelay:1.2+this.random()*2.8,familiarity:.6+this.random()*.4},...(flight?.exact?{flightSource:'official' as const,publishedType:flight.reportedType,scheduledGate:flight.gate,scheduledTerminal:flight.terminal,flightStatus:flight.status,publishedScheduledTime:flight.publishedScheduledTime}:{})};
    this.aircraft.push(aircraft);this.motion.set(id,{path:[],point:0,direction:dir,runwayId:rw.id,phase:0,pushDelay:0,delivery:!delivery,vacateRequested:false,collisionWarned:false,blockedTime:0,nextAssist:this.elapsed+4+this.random()*4,rejected:false});
    if(kind==='departure')this.gateOccupancy.set(gate.id,id);
    this.log(`${aircraft.callsign}, ${kind==='departure'?`stand ${flight?.gate??gate.id}, ${aircraft.clearance.toLowerCase()}.`:`inbound from ${aircraft.origin}, ${Math.round(approachDistance/1852)} miles, runway ${aircraft.runway}.`}`,'info',id);
    return aircraft;
  }
  private gateHeading(gate:typeof gates[number]):number {const push=nodeById.get(gate.pushbackNodeId);return push?headingTo(push,gate):0;}
  private threshold(rw:typeof runways[number],dir:Direction):Point {const sign=dir==='05'?1:-1;return {x:rw.x-sign*(rw.length/2-rw.thresholdOffsets[dir]),z:rw.z};}
  private runway(a:Aircraft){return runways.find(r=>r.id===this.motion.get(a.id)?.runwayId)??runways[0];}
  private log(text:string,level:RadioMessage['level']='info',aircraftId?:string):void{this.radio.unshift({id:++this.radioSerial,time:this.time,text,level,aircraftId});if(this.radio.length>100)this.radio.length=100;}
  private safety(text:string,penalty:number,severity:'advisory'|'caution'|'critical'='caution',key=text):void{
    if(this.elapsed-(this.eventCooldown.get(key)??-Infinity)<30)return;
    penalty=Math.round(penalty*difficultyFor(this.scenario).safetyFactor);
    this.eventCooldown.set(key,this.elapsed);this.scores.safety=clamp(this.scores.safety-penalty,0,100);this.scores.events.unshift({time:this.time,text,severity,penalty});this.scores.events=this.scores.events.slice(0,50);this.log(text,severity);this.updateScores();
  }
  setWeather(kind:WeatherKind,windDirection?:number,windSpeed?:number):void{
    this.operationsAt=-Infinity;
    const p=WEATHER[kind];this.weather={kind,...p,windDirection:((windDirection??this.weather.windDirection)%360+360)%360,windSpeed:Math.max(0,windSpeed??p.windSpeed)};
    this.recommendedDirection=Math.cos((this.weather.windDirection-50)*Math.PI/180)>=0?'05':'23';
    if(this.elapsed>0)this.log(`${kind.toUpperCase()}: wind ${String(Math.round(this.weather.windDirection)).padStart(3,'0')}/${this.weather.windSpeed} kt, visibility ${this.weather.visibility} m. Recommended direction ${this.recommendedDirection}.`,'advisory');
  }
  setDirection(direction:Direction):CommandResult {
    if(direction===this.activeDirection)return {ok:true};this.refreshOccupancy();
    const committed=this.aircraft.find(a=>!a.completed&&(a.route.length>0||a.kind==='arrival'||['FINAL','LANDING_CLEARED','TOUCHDOWN','DECELERATING','READY_FOR_TAKEOFF','TAKEOFF_ROLL','AIRBORNE','DEPARTURE','VACATING_RUNWAY'].includes(a.state)));
    if(committed||[...this.runwayOccupancy.values()].some(v=>v.length))return {ok:false,reason:'Runway change blocked: clear committed taxi routes, final approaches and runway traffic first.'};
    this.activeDirection=direction;
    for(const a of this.aircraft){const m=this.motion.get(a.id)!;m.direction=direction;a.runway=this.runway(a).ends[direction==='05'?0:1];}
    this.log(`Active runway direction changed to ${direction}. Verify every new taxi route.`,'advisory');return {ok:true};
  }
  planDirection(direction:Direction):CommandResult {
    if(direction===this.activeDirection){this.pendingDirection=undefined;this.operationsAt=-Infinity;return {ok:true};}
    if(this.pendingDirection===direction)return {ok:true};this.pendingDirection=direction;this.nextFlowCheck=0;this.operationsAt=-Infinity;this.scores.commands++;this.scores.playerCommands++;this.scores.decisions++;
    this.log(`Runway direction ${direction} planned. New traffic and unstarted departure taxi clearances wait while committed flights finish.`,'advisory');return {ok:true};
  }
  proposeRoute(id:string,gateId?:string):RouteProposal|null {
    const a=this.aircraft.find(a=>a.id===id);if(!a)return null;const m=this.motion.get(id)!;const rw=this.runway(a);
    const occupiedNodes=new Set(gates.filter(g=>this.gateOccupancy.has(g.id)&&this.gateOccupancy.get(g.id)!==id).map(g=>g.nodeId));
    const busyEdges=new Set<string>();for(const other of this.aircraft)if(other.id!==id&&other.route.length){const i=Math.max(1,other.routeIndex),e=edgeBetween(other.route[i-1],other.route[i]);if(e)busyEdges.add(e.id);}
    let start=m.taxiAnchor??nearestTaxiNode(a.position),end=rw.holdNodes[m.direction];
    if(!m.taxiAnchor&&a.kind==='departure'&&['REQUESTING_PUSHBACK','READY_TO_TAXI','ENGINE_START','PUSHBACK_CLEARED','PUSHING'].includes(a.state))start=gates.find(g=>g.id===a.gate)!.pushbackNodeId;
    if(a.kind==='arrival'){
      const gate=gates.find(g=>g.id===(gateId??a.gate));if(!gate)return null;
      if(gate.maxSpan<FLEET[a.type].span)return {nodes:[],names:[],distance:0,warning:`Stand ${gate.id} is too small for ${FLEET[a.type].name}.`};
      if(this.gateOccupancy.has(gate.id)&&this.gateOccupancy.get(gate.id)!==id)return {nodes:[],names:[],distance:0,warning:`Stand ${gate.id} is occupied. Select an alternate free stand.`};
      end=gate.nodeId;
    }
    return shortestRoute(start,end,{span:FLEET[a.type].span,occupiedNodes,busyEdges});
  }
  proposeRoutes(id:string,gateId?:string):RouteProposal[]{
    const base=this.proposeRoute(id,gateId),a=this.aircraft.find(a=>a.id===id);if(!base||!a)return[];if(!base.nodes.length)return[base];
    const start=base.nodes[0],end=base.nodes.at(-1)!,occupiedNodes=new Set(gates.filter(g=>this.gateOccupancy.has(g.id)&&this.gateOccupancy.get(g.id)!==id).map(g=>g.nodeId));
    const busyEdges=new Set([...this.ground.reservations.values()].filter(r=>r.owner!==id).flatMap(r=>{const zone=this.ground.zones.get(r.zone);return zone?.edgeId?[zone.edgeId]:zone?.edgeIds??[];}));
    const list:RouteProposal[]=[base];const add=(route:RouteProposal|null)=>{if(route&&route.distance<base.distance*1.85+250&&!list.some(r=>r.nodes.join('|')===route.nodes.join('|')))list.push(route);};
    add(shortestRoute(start,end,{span:FLEET[a.type].span,occupiedNodes}));
    for(let i=2;i<base.nodes.length-1&&list.length<3;i++){const edge=edgeBetween(base.nodes[i-1],base.nodes[i]);if(edge)add(shortestRoute(start,end,{span:FLEET[a.type].span,occupiedNodes,busyEdges,blockedEdges:new Set([edge.id])}));}
    return list.slice(0,3).map((r,index)=>{const edges=r.nodes.slice(1).map((n,i)=>edgeBetween(r.nodes[i],n)!),conflicts=edges.filter(e=>busyEdges.has(e.id)).length;let hash=2166136261;for(const c of r.nodes.join('|'))hash=Math.imul(hash^c.charCodeAt(0),16777619);return {...r,id:(hash>>>0).toString(36),estimatedSeconds:Math.ceil(r.distance/Math.max(3,performanceFor(a,this.weather).taxiSpeed*.72)+conflicts*25),conflicts,crossings:[...new Set(edges.flatMap(e=>e.runway?[e.runway]:[]))],recommended:index===0&&difficultyFor(this.scenario).routeRecommendation};});
  }
  assignGate(id:string,gateId:string):CommandResult {
    const a=this.aircraft.find(a=>a.id===id),gate=gates.find(g=>g.id===gateId);
    if(!a||a.kind!=='arrival'||!['APPROACH','FINAL','LANDING_CLEARED','GO_AROUND','GROUND_CONTACT'].includes(a.state))return {ok:false,reason:'Assign an inbound or a stationary arrival before taxi clearance.'};
    if(!gate||gate.maxSpan<FLEET[a.type].span)return {ok:false,reason:'Stand incompatible with aircraft wingspan.'};
    if(this.aircraft.some(o=>o.id!==id&&!o.completed&&o.kind==='arrival'&&o.gate===gateId))return {ok:false,reason:'Another inbound already plans to use this stand.'};
    if(a.gate===gateId)return {ok:true};a.gate=gateId;this.operationsAt=-Infinity;this.scores.commands++;this.scores.playerCommands++;this.scores.decisions++;this.log(`${a.callsign}, plan stand ${gateId}.`,'advisory',id);return {ok:true};
  }
  pushbackInfo(id:string){
    const a=this.aircraft.find(a=>a.id===id),gate=gates.find(g=>g.id===a?.gate);if(!a||!gate)return {traffic:[],incoming:[]};
    const push=nodeById.get(gate.pushbackNodeId)!,traffic=this.aircraft.filter(o=>o.id!==id&&!o.completed&&o.position.y<12&&distance(o.position,push)<180&&['PUSHBACK_CLEARED','PUSHING','ENGINE_START','READY_TO_TAXI','TAXIING','TAXI_CLEARED','TAXIING_TO_GATE'].includes(o.state)).map(o=>o.id);
    const incoming=this.aircraft.filter(o=>o.kind==='arrival'&&!o.completed&&['APPROACH','FINAL','LANDING_CLEARED'].includes(o.state)&&Math.abs((gates.find(g=>g.id===o.gate)?.x??Infinity)-gate.x)<170&&Math.abs((gates.find(g=>g.id===o.gate)?.z??Infinity)-gate.z)<170&&thresholdETA(o)<600).map(o=>({id:o.id,seconds:Math.ceil(thresholdETA(o)),gate:o.gate}));return {traffic,incoming};
  }
  availableCommands(id:string):Command[]{
    const a=this.aircraft.find(a=>a.id===id);if(!a||a.completed||this.ended||a.state==='COLLISION')return[];
    const m=this.motion.get(id)!;if(m.cancelled)return[];if(a.held)return ['resume',...(['TAXIING','TAXI_CLEARED','TAXIING_TO_GATE'].includes(a.state)?['cancelTaxi' as Command]:[])];
    switch(a.state){
      case 'PARKED':return[];
      case 'REQUESTING_PUSHBACK':return !m.delivery?['delivery']:['approvePushback','delayPushback'];
      case 'PUSHBACK_CLEARED':case 'PUSHING':return['hold'];
      case 'ENGINE_START':return a.timer===0?['startEngines']:[];
      case 'READY_TO_TAXI':return['taxi','hold'];
      case 'TAXI_CLEARED':case 'TAXIING':case 'TAXIING_TO_GATE':return[...(this.ground.waits.get(id)?.reason==='Runway crossing clearance required'?['crossRunway' as Command]:[]),'hold','holdShort','cancelTaxi'];
      case 'HOLDING_SHORT':return['lineUp','hold'];
      case 'LINE_UP_CLEARED':case 'LINING_UP':return['hold'];
      case 'READY_FOR_TAKEOFF':return['takeoff','hold'];
      case 'TAKEOFF_CLEARED':case 'TAKEOFF_ROLL':return['cancelTakeoff'];
      case 'AIRBORNE':return['contactDeparture'];
      case 'DEPARTURE':return['heading','altitude','speed'];
      case 'APPROACH':return['clearApproach','continueApproach','heading','altitude','speed','goAround'];
      case 'FINAL':return a.role==='Approach'?['contactTower','goAround']:['land','goAround'];
      case 'LANDING_CLEARED':return['goAround'];
      case 'TOUCHDOWN':case 'DECELERATING':return m.vacateRequested?[]:['vacate'];
      case 'GROUND_CONTACT':return a.role==='Tower'?['contactGround']:['taxiToGate','hold'];
      case 'GO_AROUND':return a.elapsed>30?['clearApproach','heading','altitude','speed']:['heading','altitude','speed'];
      default:return[];
    }
  }
  command(id:string,cmd:Command,override=false,value?:number|string,source:'player'|'assist'|'routine'='player'):CommandResult{
    const a=this.aircraft.find(a=>a.id===id);if(!a)return {ok:false,reason:'Aircraft no longer available.'};
    if(!this.availableCommands(id).includes(cmd))return {ok:false,reason:`${cmd} is unavailable in ${a.state.replaceAll('_',' ')}.`};
    if(cmd==='taxi'&&this.pendingDirection)return {ok:false,reason:`Runway configuration transition to ${this.pendingDirection}: finish committed traffic before issuing new departure taxi clearances.`};
    const m=this.motion.get(id)!,rw=this.runway(a);this.refreshOccupancy();
    if(['lineUp','takeoff','land'].includes(cmd)){
      const hazards=this.clearanceHazards(a,cmd);if(hazards.length&&!override)return {ok:false,warning:hazards.join(' '),reason:'Unsafe clearance requires explicit override.'};
      if(hazards.length&&override){if(this.scenario.difficulty==='assisted')return {ok:false,reason:'Assisted mode protects unsafe runway clearances. Wait until the runway is safe.'};this.safety(`${a.callsign}: unsafe ${cmd} override. ${hazards.join(' ')}`,this.scenario.difficulty==='hardcore'?22:15,'critical');}
    }
    const succeed=(text:string)=>{this.operationsAt=-Infinity;this.recordCommand(a,cmd,source);a.clearance=text;this.log(`${a.callsign}, ${text}.`,'info',a.id);m.nextAssist=this.elapsed+5;return {ok:true} as CommandResult;};
    switch(cmd){
      case 'delivery':m.delivery=true;a.role='Ground';return succeed(`departure cleared, contact Ground, request pushback`);
      case 'delayPushback':m.pushDelay=this.elapsed+60;return succeed('pushback delayed one minute, standby');
      case 'approvePushback':if(this.elapsed<m.pushDelay)return {ok:false,reason:`Pushback delayed; ${Math.ceil(m.pushDelay-this.elapsed)} seconds remaining.`};this.setState(a,'PUSHBACK_CLEARED');a.timer=a.pilot.responseDelay;return succeed('pushback approved, face taxi lane');
      case 'startEngines':a.timer=15+FLEET[a.type].engines*3;return succeed('start engines approved');
      case 'taxi':{const routes=this.proposeRoutes(id),route=typeof value==='string'&&value.startsWith('route:')?routes.find(r=>r.id===value.slice(6)):routes[0];if(!route?.nodes.length)return {ok:false,reason:'Route changed or unavailable. Review a new compatible taxi route.'};this.assignRoute(a,route);this.setState(a,'TAXI_CLEARED');a.timer=a.pilot.responseDelay;return succeed(`taxi via ${route.names.join(', ')}, hold short runway ${a.runway}`);}
      case 'cancelTaxi':m.cancelled=true;m.taxiAnchor=a.route[m.path[m.point]?.routeIndex??a.route.length-1];a.held=false;this.ground.release(a.id);this.nextGroundUpdate=0;return succeed('taxi clearance cancelled; stopping on current centerline for new clearance');
      case 'crossRunway':{const zone=this.ground.zones.get(this.ground.waits.get(id)?.zone??''),runway=zone?.runway;if(!runway)return {ok:false,reason:'No runway crossing is pending.'};const occupied=this.runwayOccupancy.get(runway)??[];if(occupied.some(id=>id!==a.id))return {ok:false,reason:'Runway occupied; crossing remains held.'};const rw=runways.find(r=>r.id===runway),arrival=this.aircraft.find(o=>o.kind==='arrival'&&rw?.ends.includes(o.runway)&&['FINAL','LANDING_CLEARED'].includes(o.state)&&thresholdETA(o)<90);if(arrival)return {ok:false,reason:'Arrival approaching crossing; wait until runway clears.'};m.crossing=runway;this.nextGroundUpdate=0;return succeed(`cross runway ${runway}, continue cleared taxi route`);}
      case 'hold':case 'holdShort':a.held=true;this.ground.release(a.id);this.nextGroundUpdate=0;a.previousState=a.state;return succeed(cmd==='holdShort'?'hold position at the next safe point; runway hold remains in force':'hold position');
      case 'resume':a.held=false;this.nextGroundUpdate=0;return succeed('resume previous clearance');
      case 'lineUp':{const path=shortestRoute(rw.holdNodes[m.direction],rw.entryNodes[m.direction],{span:FLEET[a.type].span,allowRunway:true});if(!path)return {ok:false,reason:'Runway entry is closed or incompatible.'};this.assignRoute(a,path);const entry=nodeById.get(rw.entryNodes[m.direction])!;const sign=m.direction==='05'?1:-1;const radius=45;m.path=[{x:entry.x,z:entry.z+(a.position.z>entry.z?radius:-radius),routeIndex:1}];for(let i=1;i<=12;i++){const t=i/12,side=a.position.z>entry.z?1:-1;m.path.push({x:entry.x+sign*radius*t*t,z:entry.z+side*radius*(1-t)*(1-t),routeIndex:1});}m.path.push({x:entry.x+sign*90,z:entry.z,routeIndex:1});this.setState(a,'LINE_UP_CLEARED');a.timer=a.pilot.responseDelay;return succeed(`runway ${a.runway}, line up and wait`);}
      case 'takeoff':this.setState(a,'TAKEOFF_CLEARED');a.timer=a.pilot.responseDelay;return succeed(`runway ${a.runway}, cleared for takeoff, wind ${this.weather.windDirection}/${this.weather.windSpeed}`);
      case 'cancelTakeoff':if(a.speed>=performanceFor(a,this.weather).v1)return {ok:false,reason:'Aircraft is at or above modeled V1; takeoff cannot safely be cancelled.'};m.rejected=true;this.setState(a,'TAKEOFF_ROLL');return succeed('cancel takeoff clearance, stop immediately');
      case 'contactDeparture':a.role='Departure';this.setState(a,'DEPARTURE');a.targetAltitude??=2800;return succeed('contact Departure, climb to 9,000 feet');
      case 'continueApproach':case 'clearApproach':if(a.state==='GO_AROUND'){m.resumeApproach=true;a.targetHeading=undefined;return succeed(`rejoin approach runway ${a.runway} via the missed approach circuit`);}this.setState(a,'FINAL');a.landingCleared=false;a.targetHeading=undefined;a.targetAltitude=undefined;return succeed(`cleared approach runway ${a.runway}, report established`);
      case 'contactTower':a.role='Tower';return succeed(`contact Tower, runway ${a.runway}`);
      case 'land':a.landingCleared=true;m.vacateRequested=routineEnabled(this.scenario);this.setState(a,'LANDING_CLEARED');return succeed(`runway ${a.runway}, cleared to land${m.vacateRequested?', vacate when safely slowed':''}`);
      case 'goAround':this.goAround(a,'controller instruction');return succeed('go around, climb straight ahead, contact Approach');
      case 'vacate':m.vacateRequested=true;return succeed('vacate via the planned exit when safely slowed');
      case 'contactGround':a.role='Ground';return succeed('runway vacated, contact Ground');
      case 'taxiToGate':{const [gateId,routeId]=(typeof value==='string'?value:a.gate).split('@'),routes=this.proposeRoutes(id,gateId),route=routeId?routes.find(r=>r.id===routeId):routes[0];if(!route?.nodes.length)return {ok:false,reason:route?.warning??'No compatible taxi route to stand.'};if(this.gateOccupancy.get(a.gate)===id)this.gateOccupancy.delete(a.gate);a.gate=gateId;this.gateOccupancy.set(gateId,id);this.assignRoute(a,route);this.setState(a,'TAXIING_TO_GATE');return succeed(`taxi to stand ${gateId} via ${route.names.join(', ')}`);}
      case 'heading':{const v=Number(value);if(!Number.isFinite(v)||v<0||v>360)return {ok:false,reason:'Enter a heading from 0 to 360 degrees.'};a.targetHeading=(v+90-rw.trueBearing)*Math.PI/180;return succeed(`fly heading ${Math.round(v)}`);}
      case 'altitude':{const v=Number(value);if(!Number.isFinite(v)||v<1500||v>20000)return {ok:false,reason:'Enter an altitude from 1,500 to 20,000 feet.'};a.targetAltitude=v*.3048;return succeed(`maintain ${Math.round(v)} feet`);}
      case 'speed':{const v=Number(value);if(!Number.isFinite(v)||v<130||v>300)return {ok:false,reason:'Enter a speed from 130 to 300 knots.'};a.targetSpeed=v*.514444;return succeed(`maintain ${Math.round(v)} knots`);}
      default:return {ok:false,reason:'Command is not implemented for this clearance context.'};
    }
  }
  private clearanceHazards(a:Aircraft,cmd:Command):string[]{
    const m=this.motion.get(a.id)!,hazards:string[]=[];const others=(this.runwayOccupancy.get(m.runwayId)??[]).filter(id=>id!==a.id);
    const profile=difficultyFor(this.scenario),eta=cmd==='land'?thresholdETA(a):0;
    const blocked=others.filter(id=>cmd!=='land'||occupiedClearEstimate(this.aircraft.find(o=>o.id===id),this.weather)+profile.warningBuffer>eta);
    if(blocked.length)hazards.push(`Runway ${a.runway} occupied by ${blocked.map(id=>this.aircraft.find(o=>o.id===id)?.callsign??'test vehicle').join(', ')}.`);
    const last=this.lastRunwayUse.get(m.runwayId),wakeWait=last?last.time+wakeSeconds(last.type,a.type)*profile.wakeFactor-this.elapsed-eta:0;
    if(wakeWait>0&&cmd!=='lineUp')hazards.push(`Wake spacing: wait ${Math.ceil(wakeWait)} seconds.`);
    const arrivals=this.aircraft.filter(o=>o.id!==a.id&&!o.completed&&this.motion.get(o.id)?.runwayId===m.runwayId&&['FINAL','LANDING_CLEARED'].includes(o.state));
    for(const other of arrivals){const otherETA=thresholdETA(other);
      if(cmd==='land'){
        if(otherETA<=eta&&(eta-otherETA<Math.max(landingClearEstimate(other,this.weather),wakeSeconds(other.type,a.type)*profile.wakeFactor)+profile.warningBuffer))hazards.push(`${other.callsign} ahead: threshold ETA ${Math.ceil(otherETA)} s, runway clear estimate ${Math.ceil(otherETA+landingClearEstimate(other,this.weather))} s.`);
      }else{const required=takeoffEstimate(a,this.weather)+(cmd==='lineUp'?lineUpEstimate(a):0)+profile.warningBuffer;if(otherETA<required)hazards.push(`${other.callsign} threshold ETA ${Math.ceil(otherETA)} s; departure needs approximately ${required} s including margin.`);}
    }
    const tailwind=-Math.cos((this.weather.windDirection-(m.direction==='05'?50:230))*Math.PI/180)*this.weather.windSpeed;
    if(tailwind>10)hazards.push(`Tailwind ${Math.round(tailwind)} kt exceeds the modeled 10 kt limit.`);
    if(cmd==='land'&&this.weather.visibility<800)hazards.push('Visibility below 800 m: instrument landing minima are not modeled.');
    return hazards;
  }
  private setState(a:Aircraft,state:AircraftState):void{a.state=state;a.elapsed=0;this.nextGroundUpdate=0;this.operationsAt=-Infinity;const m=this.motion.get(a.id)!;m.phase=0;m.currentEdge=undefined;m.edgeFrom=undefined;}
  private assignRoute(a:Aircraft,route:RouteProposal):void{this.ground.release(a.id);this.nextGroundUpdate=0;a.route=[...route.nodes];a.routeNames=[...route.names];a.routeIndex=0;const m=this.motion.get(a.id)!;m.taxiAnchor=undefined;m.crossing=undefined;m.routeRevision=(m.routeRevision??0)+1;m.path=smoothPath(a,route.nodes);m.point=0;m.blockedTime=0;}
  update(dt:number):void{
    if(this.ended||this.timeScale<=0||!Number.isFinite(dt)||dt<=0)return;
    this.accumulator+=Math.min(dt,60)*clamp(this.timeScale,0,16);
    while(this.accumulator>=.1-1e-9&&!this.ended){this.accumulator-=.1;this.step(.1);}
  }
  private step(dt:number):void{
    this.elapsed+=dt;this.time+=dt;
    if(this.scenario.duration>0&&this.elapsed+1e-7>=this.scenario.duration*60){this.elapsed=this.scenario.duration*60;this.time=Math.round(this.time*10)/10;this.ended=true;this.log('Shift complete. Review safety, throughput, delay, passenger impact and workload.','info');this.updateScores();return;}
    this.refreshOccupancy();
    this.updateGroundTraffic();
    if(this.pendingDirection&&this.elapsed>=this.nextFlowCheck){this.nextFlowCheck=this.elapsed+5;if(this.setDirection(this.pendingDirection).ok){this.pendingDirection=undefined;this.operationsAt=-Infinity;}}
    for(const a of this.aircraft){if(a.completed)continue;a.elapsed+=dt;this.motion.get(a.id)!.phase+=dt;this.advanceAircraft(a,dt);}
    if(this.ground.cycles.length)this.recoverGroundTraffic();
    this.refreshOccupancy();
    for(const a of this.aircraft)if(!a.completed){this.routine(a);this.assist(a);}
    this.scheduleTraffic();this.incidents();this.recycle();
    if(this.scenario.weather==='random'&&!this.scenario.tutorial&&this.elapsed>=this.weatherAt){
      const kinds:WeatherKind[]=['clear','cloudy','overcast','rain','storm','fog'];
      const next=this.random()<.35?kinds[Math.floor(this.random()*kinds.length)]:this.weather.kind;
      this.setWeather(next,this.weather.windDirection+Math.round(this.random()*70-35),clamp(this.weather.windSpeed+Math.round(this.random()*10-4),2,28));
      this.weatherAt=this.elapsed+360+this.random()*300;
    }
    this.demandIntegral+=Math.max(0,this.aircraft.filter(a=>!a.completed&&WAITING_STATES.has(a.state)).length-4)*dt;
    for(const a of this.aircraft){if(!a.completed){a.delay=Math.max(0,this.time-a.scheduledTime);if(a.held||WAITING_STATES.has(a.state))this.delayIntegral+=dt;}}
    this.updateScores();this.getOperations();
  }
  private advanceAircraft(a:Aircraft,dt:number):void {
    const m=this.motion.get(a.id)!,p=performanceFor(a,this.weather),rw=this.runway(a),sign=m.direction==='05'?1:-1,threshold=this.threshold(rw,m.direction);
    if(m.cancelled){a.speed=Math.max(0,a.speed-p.taxiBraking*dt);if(a.speed>0)this.followPath(a,dt,a.speed,true);else{m.cancelled=false;m.path=[];m.point=0;a.route=[];a.routeNames=[];this.setState(a,a.kind==='arrival'?'GROUND_CONTACT':'READY_TO_TAXI');a.role='Ground';}return;}
    if(a.held){a.speed=Math.max(0,a.speed-p.taxiBraking*dt);if(a.speed>0&&m.path.length)this.followPath(a,dt,a.speed,true);return;}
    switch(a.state){
      case 'PARKED':if(a.elapsed>15){this.setState(a,'REQUESTING_PUSHBACK');a.clearance='Requesting pushback';}break;
      case 'PUSHBACK_CLEARED':a.timer-=dt;if(a.timer<=0){const gate=gates.find(g=>g.id===a.gate)!;this.assignRoute(a,{nodes:[gate.nodeId,gate.pushbackNodeId],names:['Stand lead-out'],distance:0});this.setState(a,'PUSHING');}break;
      case 'PUSHING':if(this.followPath(a,dt,1.9)){this.gateOccupancy.delete(a.gate);this.setState(a,'ENGINE_START');a.timer=0;a.clearance='Pushback complete; requesting engine start';this.log(`${a.callsign}, pushback complete, request engine start.`,'info',a.id);}break;
      case 'ENGINE_START':if(a.timer>0){a.timer-=dt;if(a.timer<=0){this.setState(a,'READY_TO_TAXI');a.timer=0;a.clearance='Ready to taxi';this.log(`${a.callsign}, ready to taxi runway ${a.runway}.`,'info',a.id);}}break;
      case 'TAXI_CLEARED':a.timer-=dt;if(a.timer<=0)this.setState(a,'TAXIING');break;
      case 'TAXIING':if(this.followPath(a,dt,p.taxiSpeed)){this.setState(a,'HOLDING_SHORT');a.role='Tower';a.clearance=`Holding short runway ${a.runway}`;this.log(`${a.callsign}, holding short runway ${a.runway}.`,'info',a.id);}break;
      case 'LINE_UP_CLEARED':a.timer-=dt;if(a.timer<=0)this.setState(a,'LINING_UP');break;
      case 'LINING_UP':if(this.followPath(a,dt,4)){this.setState(a,'READY_FOR_TAKEOFF');a.heading=sign*Math.PI/2;a.clearance='Lined up; awaiting takeoff clearance';}break;
      case 'TAKEOFF_CLEARED':a.timer-=dt;if(a.timer<=0)this.setState(a,'TAKEOFF_ROLL');break;
      case 'TAKEOFF_ROLL':{
        if(m.rejected){a.speed=Math.max(0,a.speed-p.braking*dt);if(!a.speed){m.rejected=false;this.setState(a,'READY_FOR_TAKEOFF');a.clearance='Takeoff cancelled; stopped on runway';}else if(this.safeGroundStep(a,{x:a.position.x+sign*a.speed*dt,z:a.position.z},dt))this.moveStraight(a,dt);break;}
        const acceleration=p.acceleration;const nextSpeed=a.speed+acceleration*dt;
        if(!this.safeGroundStep(a,{x:a.position.x+sign*nextSpeed*dt,z:a.position.z},dt)){a.speed=Math.max(0,a.speed-p.braking*dt);m.rejected=true;this.safety(`${a.callsign}: rejected takeoff to avoid occupied runway.`,8,'critical',`reject-${a.id}`);break;}
        a.speed=nextSpeed;a.heading=sign*Math.PI/2;this.moveStraight(a,dt);
        if(a.speed>=p.vr){a.pitch=Math.min(.13,a.pitch+dt*.055);a.position.y+=p.climbRate*dt*.65;if(a.position.y>9){this.setState(a,'AIRBORNE');this.lastRunwayUse.set(rw.id,{time:this.elapsed,type:a.type});a.clearance='Airborne; request Departure handoff';this.log(`${a.callsign}, airborne, request Departure.`,'info',a.id);}}
        if(Math.abs(a.position.x-rw.x)>rw.length/2+150&&a.position.y<2){a.speed=0;a.held=true;this.safety(`${a.callsign}: runway overrun; aircraft stopped.`,30,'critical');}
        break;
      }
      case 'AIRBORNE':case 'DEPARTURE':{
        const desired=a.targetHeading??sign*Math.PI/2;a.heading+=clamp(angle(desired-a.heading),-dt*.024,dt*.024);a.speed+=clamp((a.targetSpeed??125)-a.speed,-dt*.7,dt*.85);
        const altitude=a.targetAltitude??2000;a.position.y+=clamp(altitude-a.position.y,-p.climbRate*dt,p.climbRate*dt);a.pitch=a.position.y<altitude-5?.09:0;this.moveStraight(a,dt);
        if(a.state==='DEPARTURE'&&a.elapsed>65&&a.position.y>700){this.setState(a,'HANDED_OFF');this.complete(a);this.scores.departures++;this.log(`${a.callsign}, radar contact; departure handed off.`,'info',a.id);}break;
      }
      case 'APPROACH':{
        a.speed+=clamp((a.targetSpeed??p.approachSpeed)-a.speed,-dt*.4,dt*.4);a.heading+=clamp(angle((a.targetHeading??headingTo(a.position,threshold))-a.heading),-dt*.025,dt*.025);
        const target=a.targetAltitude??Math.max(800,Math.min(2400,distance(a.position,threshold)*.0524));a.position.y+=clamp(target-a.position.y,-dt*6,dt*6);this.moveStraight(a,dt);
        if(distance(a.position,threshold)<4500){this.goAround(a,'no approach clearance before terminal boundary');this.scores.passenger=clamp(this.scores.passenger-2,0,100);}break;
      }
      case 'FINAL':case 'LANDING_CLEARED':{
        const ahead=(threshold.x-a.position.x)*sign;const target={x:threshold.x+sign*300,z:rw.z};
        a.heading+=clamp(angle(headingTo(a.position,target)-a.heading),-dt*.04,dt*.04);a.speed+=clamp((ahead<1500?p.landingSpeed:(a.targetSpeed??p.approachSpeed))-a.speed,-dt*.6,dt*.5);
        const idealAltitude=Math.max(0,(ahead+260)*.0524);a.position.y+=clamp(idealAltitude-a.position.y,-dt*8,dt*5);a.pitch=ahead<350?.025:-.025;this.moveStraight(a,dt);
        const last=this.lastRunwayUse.get(rw.id),wakeBlocked=!!last&&last.time+wakeSeconds(last.type,a.type)*difficultyFor(this.scenario).wakeFactor>this.elapsed+Math.max(0,ahead)/Math.max(35,a.speed);
        const blocked=(this.runwayOccupancy.get(rw.id)??[]).some(id=>id!==a.id)||wakeBlocked;
        if(ahead<950&&(!a.landingCleared||blocked)){this.goAround(a,blocked?'runway occupied at landing decision point':'landing clearance not received');this.scores.passenger=clamp(this.scores.passenger-3,0,100);if(blocked)this.safety(`${a.callsign}: go-around prevented a runway conflict.`,4,'critical',`final-conflict-${a.id}`);}
        else if(ahead< -250&&a.position.y<=7){a.position.y=0;a.pitch=0;a.heading=sign*Math.PI/2;this.setState(a,'TOUCHDOWN');a.clearance='Touchdown; decelerating';this.lastRunwayUse.set(rw.id,{time:this.elapsed,type:a.type});}
        break;
      }
      case 'TOUCHDOWN':this.setState(a,'DECELERATING');this.moveStraight(a,dt);break;
      case 'DECELERATING':{
        const exit=nodeById.get(rw.exitNodes[m.direction])!,remaining=(exit.x-a.position.x)*sign;
        const targetSpeed=remaining>250?10:4;
        a.speed=Math.max(targetSpeed,a.speed-p.braking*dt);
        if(remaining<=Math.max(20,a.speed*dt+2)){
          if(m.vacateRequested){this.assignRoute(a,{nodes:[rw.exitNodes[m.direction]],names:['Runway exit'],distance:distance(a.position,exit)});this.setState(a,'VACATING_RUNWAY');}
          else {a.speed=0;a.clearance='At runway exit; awaiting vacate instruction';}
        }else if(this.safeGroundStep(a,{x:a.position.x+sign*a.speed*dt,z:a.position.z},dt))this.moveStraight(a,dt);else a.speed=0;
        break;
      }
      case 'VACATING_RUNWAY':if(this.followPath(a,dt,5)){this.setState(a,'GROUND_CONTACT');a.role='Tower';a.clearance='Runway vacated; request Ground';a.route=[];this.log(`${a.callsign}, runway ${a.runway} vacated, request Ground.`,'info',a.id);}break;
      case 'TAXIING_TO_GATE':{
        const gate=gates.find(g=>g.id===a.gate)!;if(this.followPath(a,dt,distance(a.position,gate)<90?2.3:p.taxiSpeed)){this.setState(a,'ENTERING_STAND');a.heading=this.gateHeading(gate);a.clearance='On stand; marshalling and docking';}break;
      }
      case 'ENTERING_STAND':if(a.elapsed>14){this.setState(a,'DOCKED');this.complete(a);this.scores.arrivals++;a.clearance='Parked; engines off, docking complete';this.log(`${a.callsign}, parked stand ${a.gate}, flight complete.`,'info',a.id);}break;
      case 'GO_AROUND':{
        const waypoints=m.missedPath!,index=m.missedPoint??0,target=waypoints[Math.min(index,waypoints.length-1)];
        a.speed+=clamp((a.targetSpeed??110)-a.speed,-dt*.5,dt*.8);const heading=a.targetHeading??headingTo(a.position,target);a.heading+=clamp(angle(heading-a.heading),-dt*.045,dt*.045);a.position.y+=clamp((a.targetAltitude??1800)-a.position.y,-dt*8,dt*p.climbRate);a.pitch=.07;this.moveStraight(a,dt);
        if(distance(a.position,target)<1900){m.missedPoint=index+1;if(m.missedPoint>=waypoints.length){this.setState(a,m.resumeApproach?'FINAL':'APPROACH');a.role='Approach';a.targetHeading=undefined;a.targetAltitude=undefined;a.clearance=m.resumeApproach?'Approach cleared; contact Tower when established':'Repositioned; requesting a new approach';}}break;
      }
    }
  }
  private moveStraight(a:Aircraft,dt:number):void{a.position.x+=Math.sin(a.heading)*a.speed*dt;a.position.z-=Math.cos(a.heading)*a.speed*dt;}
  private updateGroundTraffic(){
    if(this.elapsed<this.nextGroundUpdate)return;this.nextGroundUpdate=this.elapsed+.5;
    const moving=new Set<AircraftState>(['PUSHING','TAXI_CLEARED','TAXIING','LINE_UP_CLEARED','LINING_UP','VACATING_RUNWAY','TAXIING_TO_GATE']);
    const intents:GroundIntent[]=this.aircraft.filter(a=>a.position.y<12&&GROUND_STATES.has(a.state)).map(a=>{const m=this.motion.get(a.id)!,p=performanceFor(a,this.weather),landing=['TOUCHDOWN','DECELERATING'].includes(a.state),exit=nodeById.get(this.runway(a).exitNodes[m.direction])!,sign=m.direction==='05'?1:-1;return {id:a.id,position:a.position,length:FLEET[a.type].length,span:FLEET[a.type].span,heading:a.heading,speed:a.speed,braking:p.taxiBraking,route:landing?[exit.id]:a.route,nextIndex:landing?0:m.path[m.point]?.routeIndex??a.route.length,path:landing?[a.position,{x:exit.x-sign*20,z:this.runway(a).z},exit]:[a.position,...m.path.slice(m.point)],revision:m.routeRevision??0,moving:landing||moving.has(a.state)&&m.point<m.path.length,held:a.held||!!m.cancelled,runwayClearances:[...(m.crossing?[m.crossing]:[]),...(['LINE_UP_CLEARED','LINING_UP'].includes(a.state)?[m.runwayId]:[])],urgency:landing||a.state==='VACATING_RUNWAY'?300:a.state==='LINING_UP'?150:a.state==='PUSHING'?50:0,state:a.state};});
    this.ground.update(intents,this.elapsed,this.scenario.positions.includes('Ground')?difficultyFor(this.scenario).priority:'auto',this.runwayOccupancy);
    this.recoverGroundTraffic();
  }
  private recoverGroundTraffic(){
    const candidates=[...this.ground.waits.values()].filter(w=>this.ground.cycles.some(c=>c.includes(w.aircraftId))||this.scenario.difficulty!=='hardcore'&&(this.elapsed-w.since>90||this.ground.conflicts.some(c=>c.kind==='opposing'&&c.aircraftIds.includes(w.aircraftId))));
    if(this.scenario.difficulty==='hardcore')for(const wait of this.ground.waits.values())if(this.elapsed-wait.since>90)this.ground.markIntervention(wait.aircraftId);
    // Lower operational priority yields first. Within a tie the later flight ID
    // takes the detour, independently of the order of the aircraft array.
    candidates.sort((a,b)=>b.aircraftId.localeCompare(a.aircraftId));
    for(const wait of candidates){const a=this.aircraft.find(a=>a.id===wait.aircraftId),m=a&&this.motion.get(a.id);if(!a||!m||a.held||!['TAXIING','TAXI_CLEARED','TAXIING_TO_GATE'].includes(a.state)||this.elapsed<(m.nextRecovery??0))continue;m.nextRecovery=this.elapsed+15;
      const peers=wait.owners.map(id=>this.aircraft.find(a=>a.id===id)).filter((a):a is Aircraft=>!!a);
      if(peers.every(peer=>!['TAXIING','TAXI_CLEARED','TAXIING_TO_GATE','PUSHING','VACATING_RUNWAY'].includes(peer.state)))continue;
      if(this.replanGround(a,peers)){this.ground.record([a.id,...wait.owners],'Alternate taxi route assigned');this.log(`${a.callsign}, revised taxi via ${a.routeNames.join(', ')} to release conflicting surface traffic.`,'advisory',a.id);break;}
      if(this.elapsed-wait.since>90){this.ground.markIntervention(a.id);if(m.blockedTime<.1)this.log(`${a.callsign}, route unavailable; Ground review required at ${wait.reason.toLowerCase()}.`,'caution',a.id);}
    }
  }
  private replanGround(a:Aircraft,peers:Aircraft[]):boolean {
    const m=this.motion.get(a.id)!,end=a.route.at(-1);if(!end||m.point>=m.path.length)return false;
    let index=Math.max(0,m.path[m.point].routeIndex);let anchor=nodeById.get(a.route[index]);if(!anchor)return false;
    const next=m.path[m.point];if((anchor.x-a.position.x)*(next.x-a.position.x)+(anchor.z-a.position.z)*(next.z-a.position.z)<-1&&index<a.route.length-1)anchor=nodeById.get(a.route[++index]);if(!anchor)return false;
    const occupiedNodes=new Set<string>(),blockedEdges=new Set<string>();
    // Continue toward the forward junction, then choose an exit that does not
    // double back into the segment just travelled. A graph detour is not a
    // clearance to make a physically impossible U-turn on a taxiway centerline.
    const approach={x:anchor.x-a.position.x,z:anchor.z-a.position.z},approachLength=Math.hypot(approach.x,approach.z);
    if(approachLength>2)for(const edge of taxiEdges){const id=edge.from===anchor.id?edge.to:edge.to===anchor.id?edge.from:undefined;if(!id)continue;const node=nodeById.get(id)!,dx=node.x-anchor.x,dz=node.z-anchor.z;if((approach.x*dx+approach.z*dz)/(approachLength*Math.hypot(dx,dz))<-.75)blockedEdges.add(edge.id);}
    for(const other of this.aircraft){if(other.id===a.id||other.position.y>12||!GROUND_STATES.has(other.state))continue;const spacing=(FLEET[a.type].length+FLEET[other.type].length)/2+20;for(const node of taxiNodes)if(node.id!==anchor.id&&node.id!==end&&distance(node,other.position)<spacing)occupiedNodes.add(node.id);
      for(const edge of taxiEdges){const p=projectSegment(other.position,nodeById.get(edge.from)!,nodeById.get(edge.to)!);if(p.raw>.01&&p.raw<.99&&p.distance<spacing&&edge.from!==anchor.id&&edge.to!==anchor.id)blockedEdges.add(edge.id);}
    }
    for(const peer of peers){let length=0;for(let i=Math.max(1,peer.routeIndex);i<peer.route.length&&length<400;i++){const edge=edgeBetween(peer.route[i-1],peer.route[i]);if(edge){length+=edge.length;if(edge.from!==end&&edge.to!==end)blockedEdges.add(edge.id);}}}
    const route=shortestRoute(anchor.id,end,{span:FLEET[a.type].span,occupiedNodes,blockedEdges});if(!route||route.nodes.length<2||route.nodes.join('|')===a.route.slice(index).join('|'))return false;
    // Preserve the existing path to a forward graph junction; no relocation or
    // shortcut across an apron is used to reach the alternate route.
    const prefix=a.route.slice(Math.max(0,index-1),index);const actualPrefix=prefix.filter(id=>{const n=nodeById.get(id)!;return distance(n,a.position)<2;});
    const nodes=[...actualPrefix,...route.nodes],path=[a.position,...smoothPath(a,nodes)],profile=FLEET[a.type],exitSpace=distance(a.position,anchor)+profile.length+40;
    // A detour must clear its first junction with the complete turning envelope.
    // Changing to a blocked turn after entering a corridor can otherwise trap
    // an adjacent staged aircraft that could pass the original straight route.
    for(const other of this.aircraft){if(other.id===a.id||other.position.y>12||!GROUND_STATES.has(other.state))continue;const body=FLEET[other.type];if(Number.isFinite(sweptGroundDistance({position:a.position,length:profile.length,span:profile.span,heading:a.heading},path,{position:other.position,length:body.length,span:body.span,heading:other.heading},exitSpace)))return false;}
    this.assignRoute(a,{...route,nodes});return true;
  }
  private followPath(a:Aircraft,dt:number,maxSpeed:number,coasting=false):boolean {
    const m=this.motion.get(a.id)!,p=performanceFor(a,this.weather);while(m.point<m.path.length&&distance(a.position,m.path[m.point])<.05)m.point++;if(m.point>=m.path.length){a.speed=0;return true;}
    const target=m.path[m.point],next=m.path[m.point+1];let desired=maxSpeed;
    const routeStep=Math.max(1,target.routeIndex),edge=edgeBetween(a.route[routeStep-1],a.route[routeStep]);
    if(edge)desired=Math.min(desired,edge.speedLimit);
    if(next&&Math.abs(angle(headingTo(target,next)-headingTo(a.position,target)))>.1)desired=Math.min(desired,3.5);
    const remaining=m.path.slice(m.point).reduce((sum,pt,i)=>sum+distance(i?m.path[m.point+i-1]:a.position,pt),0);
    desired=Math.min(desired,Math.sqrt(Math.max(0,2*p.taxiBraking*remaining)));
    const authority=this.ground.limit(a.id);desired=Math.min(desired,Math.sqrt(Math.max(0,2*p.taxiBraking*(authority-.5))));
    if(!coasting)a.speed+=clamp(desired-a.speed,-p.taxiBraking*dt,p.taxiAcceleration*dt);
    let travel=Math.min(a.speed*dt,Math.max(0,authority));
    if(authority<1&&a.speed<.1){m.blockedTime+=dt;return false;}
    while(travel>1e-7&&m.point<m.path.length){const point=m.path[m.point],d=distance(a.position,point),step=Math.min(d,travel);
      if(d<.05){m.point++;continue;}
      const candidate={x:a.position.x+(point.x-a.position.x)*step/d,z:a.position.z+(point.z-a.position.z)*step/d};
      const desiredHeading=headingTo(a.position,point)+(a.state==='PUSHING'?Math.PI:0),nextHeading=a.heading+clamp(angle(desiredHeading-a.heading),-dt*.22,dt*.22);
      if(!this.safeGroundStep(a,candidate,dt,nextHeading)){a.speed=Math.max(0,a.speed-p.taxiBraking*dt);m.blockedTime+=dt;if(m.blockedTime>8&&!m.collisionWarned){m.collisionWarned=true;this.log(`${a.callsign}, holding for conflicting surface traffic.`,'caution',a.id);}return false;}
      a.heading=nextHeading;a.position.x=candidate.x;a.position.z=candidate.z;a.routeIndex=point.routeIndex;m.currentEdge=edge?.id;m.edgeFrom=a.route[routeStep-1];m.blockedTime=0;m.collisionWarned=false;travel-=step;this.ground.consume(a.id,step);if(step>=d-.001)m.point++;
    }
    if(m.point>=m.path.length){a.speed=0;m.currentEdge=undefined;m.edgeFrom=undefined;return true;}return false;
  }
  private safeGroundStep(a:Aircraft,candidate:Point,_dt:number,heading=a.heading):boolean{
    const profile=FLEET[a.type];
    for(const other of this.aircraft){if(other.id===a.id||other.position.y>12||!GROUND_STATES.has(other.state)||other.state==='DOCKED'&&other.completed&&distance(candidate,other.position)>150)continue;
      const otherProfile=FLEET[other.type],spacing=(profile.length+otherProfile.length)*.5+18;
      const current=distance(a.position,other.position),projected=distance(candidate,other.position);
      const body={position:candidate,length:profile.length,span:profile.span,heading},otherBody={position:other.position,length:otherProfile.length,span:otherProfile.span,heading:other.heading};
      if(groundOverlap(body,otherBody)&&(!groundOverlap({...body,position:a.position,heading:a.heading},otherBody)||projected<current-.00001)){
        this.ground.reportPhysicalWait(a.id,other.id,this.elapsed,a.position);
        return false;
      }
    }
    // A debug runway vehicle is a real obstruction in the safety system.
    const m=this.motion.get(a.id)!;if(this.debugOccupants.has(m.runwayId)&&['LINING_UP','TAKEOFF_ROLL'].includes(a.state))return false;
    this.ground.clearPhysicalWait(a.id);
    return true;
  }
  private goAround(a:Aircraft,reason:string):void{this.setState(a,'GO_AROUND');const m=this.motion.get(a.id)!,rw=this.runway(a),sign=m.direction==='05'?1:-1,threshold=this.threshold(rw,m.direction),side=rw.id==='north'?-1:1;m.missedPath=[{x:threshold.x+sign*6500,z:rw.z},{x:threshold.x+sign*6500,z:rw.z+side*7500},{x:threshold.x-sign*28500,z:rw.z+side*7500},{x:threshold.x-sign*28500,z:rw.z}];m.missedPoint=0;m.resumeApproach=false;a.role='Approach';a.landingCleared=false;a.targetHeading=undefined;a.targetAltitude=1800;a.targetSpeed=undefined;a.clearance=`Go around: ${reason}`;this.log(`${a.callsign}, going around: ${reason}.`,'caution',a.id);}
  private assist(a:Aircraft):void{
    if(this.scenario.difficulty==='hardcore'||this.scenario.positions.includes(a.role)||a.held)return;
    const m=this.motion.get(a.id)!;if(this.elapsed<m.nextAssist)return;m.nextAssist=this.elapsed+5+a.pilot.responseDelay;
    let cmd:Command|undefined;
    switch(a.state){case 'REQUESTING_PUSHBACK':cmd=m.delivery?'approvePushback':'delivery';break;case 'ENGINE_START':if(a.timer===0)cmd='startEngines';break;case 'READY_TO_TAXI':cmd='taxi';break;case 'HOLDING_SHORT':cmd='lineUp';break;case 'READY_FOR_TAKEOFF':cmd='takeoff';break;case 'AIRBORNE':cmd='contactDeparture';break;case 'APPROACH':cmd='clearApproach';break;case 'FINAL':cmd=a.role==='Approach'?'contactTower':'land';break;case 'DECELERATING':if(!m.vacateRequested)cmd='vacate';break;case 'GROUND_CONTACT':cmd=a.role==='Tower'?'contactGround':'taxiToGate';break;}
    if(cmd){const result=this.command(a.id,cmd,false,undefined,'assist');if(!result.ok&&cmd==='taxiToGate'){const alternative=gates.find(g=>g.maxSpan>=FLEET[a.type].span&&!this.gateOccupancy.has(g.id));if(alternative)this.command(a.id,'taxiToGate',false,alternative.id,'assist');}}
  }
  private routine(a:Aircraft){
    if(!routineEnabled(this.scenario)||a.held||a.elapsed<2)return;
    const m=this.motion.get(a.id)!;let cmd:Command|undefined;
    if(a.state==='REQUESTING_PUSHBACK'&&!m.delivery)cmd='delivery';
    else if(a.state==='ENGINE_START'&&a.timer===0)cmd='startEngines';
    else if(a.state==='AIRBORNE')cmd='contactDeparture';
    else if(a.state==='FINAL'&&a.role==='Approach')cmd='contactTower';
    else if(a.state==='DECELERATING'&&!m.vacateRequested)cmd='vacate';
    else if(a.state==='GROUND_CONTACT'&&a.role==='Tower')cmd='contactGround';
    if(cmd)this.command(a.id,cmd,false,undefined,'routine');
  }
  private recordCommand(a:Aircraft,cmd:Command,source:'player'|'assist'|'routine'){
    this.scores.commands++;if(source!=='player'){if(source==='routine')this.scores.routineCommands++;return;}
    this.scores.playerCommands++;const last=this.commandHistory.get(a.id),recent=!!last&&this.elapsed-last.time<30;
    const contradictory=recent&&(['hold','holdShort'].includes(cmd)&&last.command==='resume'||cmd==='resume'&&['hold','holdShort'].includes(last.command));
    const safetyReason=this.ground.waits.has(a.id)||this.ground.conflicts.some(c=>c.aircraftIds.includes(a.id))||this.clearanceHazards(a,a.kind==='arrival'?'land':'takeoff').length>0;
    const count=contradictory?(last?.contradictions??0)+1:0;
    if(contradictory&&count>=2&&!safetyReason)this.scores.commandEfficiency=clamp(this.scores.commandEfficiency-2,0,100);
    if(recent&&last.command===cmd&&['taxi','taxiToGate'].includes(cmd)&&!safetyReason)this.scores.commandEfficiency=clamp(this.scores.commandEfficiency-1,0,100);
    if(!['delivery','startEngines','vacate','contactTower','contactGround','contactDeparture'].includes(cmd)&&(!recent||last?.command!==cmd||last.state!==a.state))this.scores.decisions++;
    this.commandHistory.set(a.id,{command:cmd,time:this.elapsed,state:a.state,contradictions:count});
  }
  private refreshOccupancy():void {
    this.runwayOccupancy.clear();for(const rw of runways){const occupied:string[]=[];if(this.debugOccupants.has(rw.id))occupied.push(`debug-${rw.id}`);
      for(const a of this.aircraft){if(a.completed||a.position.y>20)continue;const p=FLEET[a.type],lateral=Math.abs(Math.cos(a.heading))*p.length/2+Math.abs(Math.sin(a.heading))*p.span/2;if(Math.abs(a.position.z-rw.z)<rw.width/2+lateral+8&&Math.abs(a.position.x-rw.x)<rw.length/2+p.length*.5)occupied.push(a.id);}
      this.runwayOccupancy.set(rw.id,occupied);for(const end of rw.ends)this.runwayOccupancy.set(end,occupied);
    }
  }
  debugOccupyRunway():void{const id=runways[0].id;if(this.debugOccupants.has(id)){this.debugOccupants.delete(id);this.log('Developer runway obstruction cleared.','advisory');}else{this.debugOccupants.add(id);this.log(`Developer test vehicle occupying ${runways[0].ends.join('/')}.`,'critical');}this.refreshOccupancy();}
  private scheduleTraffic():void{
    if(this.pendingDirection)return;
    if(this.scenario.tutorial){if(!this.tutorialArrival&&this.scores.departures>0){this.addAircraft('arrival','A321');this.tutorialArrival=true;}return;}
    if(this.aircraft.filter(a=>!a.completed).length>=18)return;
    let count=0;while(this.scheduleIndex<this.schedule.length&&this.schedule[this.scheduleIndex].time<=this.time&&count<2){const flight=this.schedule[this.scheduleIndex];const a=this.addAircraft(flight.kind,flight.type,flight);if(!a)break;this.scheduleIndex++;count++;}
  }
  private incidents():void{
    if(this.elapsed<this.incidentAt)return;
    const active=this.aircraft.filter(a=>!a.completed);const pick=this.random();
    if(pick<.4){const a=active.find(a=>a.state==='LANDING_CLEARED'||a.state==='FINAL');if(a){this.goAround(a,'reported unstable approach');this.scores.passenger=clamp(this.scores.passenger-2,0,100);this.log('Incident: pilot initiated a routine go-around. Re-sequence with Approach.','advisory');}}
    else if(pick<.72){const a=active.find(a=>a.kind==='departure'&&a.state==='READY_TO_TAXI');if(a){a.held=true;a.clearance='Pilot requests brief technical check; resume when ready';this.log(`${a.callsign}, minor indication check, request hold. Resume authorizes return to service.`,'advisory',a.id);}}
    else {const newKind=this.weather.kind==='rain'?'cloudy':'rain';this.setWeather(newKind);this.log('Incident: a local weather change affects visibility and braking.','advisory');}
    const factor=this.scenario.incidents==='training'?1:this.scenario.incidents==='normal'?3:7;this.incidentAt=this.elapsed+(180+this.random()*180)*factor;
  }
  private complete(a:Aircraft):void{a.completed=true;a.speed=0;this.motion.get(a.id)!.finishAt=this.elapsed;a.route=[];this.ground.release(a.id);}
  private recycle():void{for(let i=this.aircraft.length-1;i>=0;i--){const a=this.aircraft[i],m=this.motion.get(a.id)!;if(a.completed&&this.elapsed-(m.finishAt??this.elapsed)>(a.kind==='arrival'?180:50)){if(this.gateOccupancy.get(a.gate)===a.id)this.gateOccupancy.delete(a.gate);this.aircraft.splice(i,1);this.motion.delete(a.id);}}}
  private updateScores():void{
    const finished=this.scores.departures+this.scores.arrivals,active=this.aircraft.filter(a=>!a.completed).length;
    const avgDelay=this.aircraft.reduce((sum,a)=>sum+a.delay,0)/Math.max(1,this.aircraft.length);
    this.scores.delay=clamp(100-avgDelay/difficultyFor(this.scenario).delayDivisor,0,100);this.scores.efficiency=clamp(100-this.delayIntegral/Math.max(360,this.elapsed*3)+finished*.2-(100-this.scores.commandEfficiency)*.12,0,100);
    this.scores.decisionRate=this.scores.decisions/Math.max(1,this.elapsed/60);this.scores.commandRate=this.scores.playerCommands/Math.max(1,this.elapsed/60);
    this.scores.workload=clamp(100-this.demandIntegral/Math.max(60,this.elapsed)*5-Math.max(0,active-12)*1.5,0,100);
    this.scores.passenger=Math.min(this.scores.passenger,clamp(100-avgDelay/50,0,100));
    this.scores.overall=Math.round(this.scores.safety*.45+this.scores.efficiency*.18+this.scores.delay*.15+this.scores.passenger*.12+this.scores.workload*.1);
  }
  getSummary():Scores{this.updateScores();return {...this.scores,events:this.scores.events.map(e=>({...e}))};}
  chooseGroundPriority(conflictId:string,id?:string):CommandResult {
    const conflict=this.ground.conflicts.find(c=>c.id===conflictId);
    if(!this.ground.choose(conflictId,id))return {ok:false,reason:'This movement is already committed, or the conflict has cleared.'};
    this.nextGroundUpdate=0;this.operationsAt=-Infinity;this.scores.playerCommands++;this.scores.commands++;this.scores.decisions++;
    this.log(`Ground priority: ${this.aircraft.find(a=>a.id===(id??conflict?.suggested))?.callsign} first at ${conflict?.label}.`,'advisory');
    this.updateGroundTraffic();return {ok:true};
  }
  getOperations(force=false){if(force||!this.operationsCache||this.elapsed-this.operationsAt>=1){this.operationsCache=this.buildOperations();this.operationsAt=this.elapsed;}return this.operationsCache;}
  private buildOperations(){
    const runways=buildRunwayPlans(this.aircraft,this.weather,this.elapsed,this.activeDirection,this.runwayOccupancy,this.lastRunwayUse,this.scenario);
    const requests=this.requestQueue.update({aircraft:this.aircraft,time:this.time,elapsed:this.elapsed,scenario:this.scenario,conflicts:this.ground.conflicts,waits:this.ground.waits,runways,gates:this.gateOccupancy,directionMismatch:this.activeDirection!==this.recommendedDirection});
    const active=this.aircraft.filter(a=>!a.completed),ground=active.filter(a=>GROUND_STATES.has(a.state));
    const congestion=[{name:'North apron / N–P',list:ground.filter(a=>a.position.z<0)},{name:'South apron / Q–S',list:ground.filter(a=>a.position.z>=0)}].map(region=>({name:region.name,traffic:region.list.length,waiting:region.list.filter(a=>this.ground.waits.has(a.id)&&a.speed<.5).length}));
    const upcoming=this.schedule.slice(this.scheduleIndex).filter(f=>f.time<=this.time+600),arrivals=upcoming.filter(f=>f.kind==='arrival').length,departures=upcoming.length-arrivals;
    const phase=upcoming.length<=1?(active.length>8?'recovery':'quiet'):upcoming.length<4?'building':arrivals>departures*1.5?'arrival wave':departures>arrivals*1.5?'departure wave':'mixed peak';
    return {runways,requests,congestion,phase,pendingDirection:this.pendingDirection,upcoming:{arrivals,departures},counts:{arrivals:active.filter(a=>a.kind==='arrival').length,departures:active.filter(a=>a.kind==='departure').length,ground:ground.length},guidance:difficultyFor(this.scenario).guidance};
  }
}
