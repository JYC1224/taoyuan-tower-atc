/** RCTP AIRAC 05/26. Local metres, +x toward RWY 05 departures; +z southeast.
 * AIP coordinates are projected to a tangent plane. Building outlines, stand lead-ins,
 * holding offsets and graph corner smoothing are gameplay approximations; see DATA_SOURCES.md.
 */
export type Point = { x: number; z: number };
export type RunwayId = 'north' | 'south';
export type Direction = '05' | '23';
export interface SourceMetadata { source: string; sourceDate: string | null; effectiveDate: string | null; expires: string | null; confidence: 'high' | 'medium' | 'approximation'; lastVerified: string; note?: string }
const base = 'https://ais.caa.gov.tw/eaip/AIRAC%20AIP%20AMDT%2005-26_2026_10_29/';
export const airportSource: SourceMetadata = { source: base + 'index.html', sourceDate: '2026-09-17', effectiveDate: '2026-10-29', expires: '2026-12-24', confidence: 'high', lastVerified: '2026-11-13', note: 'AD 2.8, AD 2.9, AD 2.12 and AD 2.14 and the current aerodrome chart checked; taxi-graph geometry remains simplified and live NOTAM data is not connected.' };
export interface Runway extends Point { id: RunwayId; ends: [string,string]; length: number; width: number; heading: number; trueBearing: number; thresholdOffsets: Record<Direction,number>; holdNodes: Record<Direction,string>; entryNodes: Record<Direction,string>; exitNodes: Record<Direction,string>; declared: Record<Direction,{tora:number;toda:number;asda:number;lda:number}>; source: SourceMetadata }
export interface Gate extends Point { id: string; terminal: string; maxSpan: number; remote: boolean; nodeId: string; pushbackNodeId: string; heading: number; source: SourceMetadata }
export interface TaxiNode extends Point { id: string; kind: 'intersection'|'stand'|'pushback'|'hold'|'entry'|'exit'; runway?: RunwayId }
export type TaxiSurface = 'asphalt'|'concrete'|'mixed'|'approximation';
export interface TaxiEdge { id: string; from: string; to: string; name: string; length: number; width: number; surface?: TaxiSurface; surfaceSource?: 'AD 2.8'|'visual default'; speedLimit: number; maxSpan: number; active: boolean; oneWay?: boolean; runway?: RunwayId; geometryConfidence: 'projected'|'approximation' }
export interface Terminal extends Point { id: string; name: string; width: number; depth: number; height: number; status: 'operational'|'construction'; }

export const runways: Runway[] = [
  { id:'north', ends:['05L','23R'], x:0,z:-760,length:3660,width:60,heading:Math.PI/2,trueBearing:49.08,thresholdOffsets:{'05':0,'23':0},holdNodes:{'05':'hold-north-05','23':'hold-north-23'},entryNodes:{'05':'entry-north-05','23':'entry-north-23'},exitNodes:{'05':'exit-north-05','23':'exit-north-23'},declared:{'05':{tora:3660,toda:3660,asda:3660,lda:3660},'23':{tora:3660,toda:3660,asda:3660,lda:3660}},source:airportSource },
  { id:'south', ends:['05R','23L'], x:-235,z:748,length:3800,width:60,heading:Math.PI/2,trueBearing:49.07,thresholdOffsets:{'05':100,'23':350},holdNodes:{'05':'hold-south-05','23':'hold-south-23'},entryNodes:{'05':'entry-south-05','23':'entry-south-23'},exitNodes:{'05':'exit-south-05','23':'exit-south-23'},declared:{'05':{tora:3800,toda:3800,asda:3800,lda:3700},'23':{tora:3800,toda:3800,asda:3800,lda:3450}},source:airportSource }
];

/** Convert AIP compact DMS; north runway midpoint is x0,z-760. */
function dms(value: string): number { const n=value.endsWith('N')?2:3; return Number(value.slice(0,n))+Number(value.slice(n,n+2))/60+Number(value.slice(n+2,-1))/3600; }
export function projectCoordinate(latitude:string,longitude:string):Point { const lat=25.08369583333333,lon=121.22971388888888,h=49.08*Math.PI/180; const n=(dms(latitude)-lat)*111132,e=(dms(longitude)-lon)*111320*Math.cos(lat*Math.PI/180); return {x:Math.round(e*Math.sin(h)+n*Math.cos(h)),z:Math.round(e*Math.cos(h)-n*Math.sin(h)-760)}; }

const gateCoordinates: [string,string,string][] = [
 ['A1','250504.72N','1211418.47E'],['A2','250504.81N','1211417.11E'],['A3','250504.08N','1211416.12E'],['A4','250501.88N','1211414.59E'],['A5','250500.09N','1211412.32E'],['A6','250458.30N','1211410.05E'],['A7','250456.52N','1211407.78E'],['A8','250454.74N','1211405.51E'],['A9','250453.70N','1211402.64E'],
 ['B1','250454.52N','1211427.99E'],['B2','250453.30N','1211427.94E'],['B3','250452.57N','1211427.04E'],['B4','250451.50N','1211424.46E'],['B5','250449.73N','1211422.18E'],['B6','250447.94N','1211419.92E'],['B7','250446.16N','1211417.64E'],['B8','250444.37N','1211415.38E'],['B9','250441.98N','1211413.76E'],
 ['C1','250440.67N','1211411.46E'],['C2','250438.79N','1211409.09E'],['C3','250437.20N','1211407.06E'],['C4','250435.60N','1211405.03E'],['C5','250434.01N','1211403.01E'],['C6','250432.42N','1211400.98E'],['C7','250430.82N','1211358.96E'],['C8','250429.23N','1211356.93E'],['C9','250427.64N','1211354.91E'],['C10','250426.04N','1211352.88E'],
 ['D1','250452.19N','1211400.56E'],['D2','250450.35N','1211358.22E'],['D3','250449.02N','1211356.49E'],['D4','250447.42N','1211354.50E'],['D5','250445.73N','1211352.33E'],['D6','250443.86N','1211349.95E'],['D7','250442.19N','1211347.63E'],['D8','250440.33N','1211345.47E'],['D9','250438.80N','1211343.40E'],['D10','250437.43N','1211341.77E'],
 ['D11','250435.30N','1211338.29E'],['D12','250433.45N','1211335.93E'],['D13','250431.59N','1211333.56E'],['D14','250429.73N','1211331.20E'],['D14L','250430.78N','1211331.24E'],['D14R','250429.29N','1211330.74E'],['D15','250427.87N','1211328.84E'],['D15L','250428.92N','1211328.88E'],['D15R','250427.43N','1211328.38E'],['D16','250426.01N','1211326.47E'],['D17','250424.15N','1211324.11E'],['D18','250422.29N','1211321.75E'],
 ['501','250536.74N','1211451.97E'],['502','250535.04N','1211449.82E'],['503','250533.30N','1211447.69E'],['504','250531.60N','1211445.53E'],['505','250529.76N','1211443.50E'],['506','250528.28N','1211441.62E'],['507','250526.79N','1211439.72E'],['508','250525.31N','1211437.83E'],['509','250523.82N','1211435.94E'],['510','250522.34N','1211434.05E'],['511','250520.85N','1211432.15E'],['512','250519.36N','1211430.27E'],['513','250517.48N','1211427.48E'],['514','250515.12N','1211424.87E'],['515','250513.42N','1211422.71E'],['516','250540.44N','1211411.21E'],['517','250542.35N','1211413.64E'],['518','250544.27N','1211416.07E'],['519','250546.18N','1211418.50E'],['520','250548.09N','1211420.93E'],['521','250550.64N','1211424.17E'],['522','250552.66N','1211426.74E'],['523','250554.78N','1211429.44E'],['524','250556.90N','1211432.14E'],['525','250558.92N','1211434.70E'],
 ['601','250449.75N','1211435.99E'],['602','250448.16N','1211433.96E'],['603','250443.63N','1211428.20E'],['604','250441.88N','1211425.98E'],['605','250440.13N','1211423.75E'],['606','250438.37N','1211421.52E'],['607','250436.62N','1211419.30E'],['608','250434.86N','1211417.07E'],['609','250430.71N','1211411.79E'],['610','250429.61N','1211410.40E'],['611','250427.85N','1211408.15E'],['612','250426.25N','1211406.12E'],['613','250424.24N','1211403.56E'],['614','250422.66N','1211401.55E'],['615','250420.91N','1211359.32E'],['632','250501.65N','1211423.59E'],['633','250500.65N','1211424.53E'],['634','250459.66N','1211425.48E']
];
export const gates: Gate[] = gateCoordinates.map(([id,lat,lon])=> { const north=/^[AD]/.test(id)||id.startsWith('5'),dNumber=Number(id.match(/^D(\d+)/)?.[1]??0); return {id,...projectCoordinate(lat,lon),terminal:id.startsWith('5')?'Cargo':id.startsWith('6')?'Remote':/^[AB]/.test(id)?'T1':id.startsWith('D')&&dNumber>=11?'T3 North':'T2',maxSpan:id==='A1'||id==='B1'?36:id==='D6'?82:65,remote:/^[56]/.test(id),nodeId:'gate-'+id,pushbackNodeId:'push-'+id,heading:north?0:Math.PI,source:{...airportSource,note:'Stand coordinate from AD2.8; D6 is sized for the A380-861 in the 2026-11-11 airport schedule snapshot. Other maxSpan and lead-in values are conservative game settings, not certified stand limits.'}}; });

export const taxiNodes: TaxiNode[] = [];
export const taxiEdges: TaxiEdge[] = [];
const nodeById = new Map<string,TaxiNode>();
function node(id:string,x:number,z:number,kind:TaxiNode['kind']='intersection',runway?:RunwayId):TaxiNode { const n={id,x,z,kind,runway}; taxiNodes.push(n);nodeById.set(id,n);return n; }
function geo(id:string,lat:string,lon:string):TaxiNode { const p=projectCoordinate(lat,lon);return node(id,p.x,p.z); }
type TaxiwaySpec={width:number;surface:Exclude<TaxiSurface,'approximation'>};
const taxiwaySpecs:Record<string,TaxiwaySpec>={
 E:{width:30,surface:'concrete'},L:{width:30,surface:'concrete'},L1:{width:25,surface:'concrete'},L2:{width:25,surface:'concrete'},
 N1:{width:26,surface:'concrete'},N2:{width:27,surface:'asphalt'},N3:{width:27,surface:'asphalt'},N4:{width:25,surface:'asphalt'},N5:{width:25,surface:'asphalt'},N6:{width:25,surface:'asphalt'},N7:{width:29,surface:'asphalt'},N8:{width:28,surface:'asphalt'},N9:{width:28,surface:'mixed'},N10:{width:26,surface:'asphalt'},N11:{width:26,surface:'asphalt'},
 P1:{width:26,surface:'asphalt'},P2:{width:27,surface:'asphalt'},P3:{width:25,surface:'asphalt'},P4:{width:25,surface:'asphalt'},P5:{width:25,surface:'asphalt'},P6:{width:30,surface:'concrete'},P7:{width:45,surface:'asphalt'},P8:{width:25,surface:'asphalt'},P9:{width:29,surface:'asphalt'},P10:{width:30,surface:'concrete'},
 Q1:{width:25,surface:'asphalt'},Q2:{width:25,surface:'asphalt'},Q4:{width:25,surface:'asphalt'},Q5:{width:25,surface:'concrete'},Q6:{width:25,surface:'concrete'},Q7:{width:30,surface:'asphalt'},
 R1:{width:26,surface:'asphalt'},R2:{width:25,surface:'asphalt'},R3:{width:25,surface:'concrete'},
 S1:{width:26,surface:'concrete'},S2:{width:27,surface:'concrete'},S3:{width:27,surface:'asphalt'},S4:{width:25,surface:'mixed'},S5:{width:25,surface:'mixed'},S6:{width:25,surface:'asphalt'},S7:{width:25,surface:'asphalt'},S8:{width:27,surface:'asphalt'},S9:{width:27,surface:'concrete'},S10:{width:26,surface:'concrete'},
 W:{width:30,surface:'asphalt'},W1:{width:25,surface:'asphalt'},W2:{width:25,surface:'asphalt'}
};
function taxiwaySegmentSpec(name:string,from:string,to:string):TaxiwaySpec|undefined{
 if(name.startsWith('Stand ')||name.startsWith('Apron '))return{width:25,surface:'concrete'};
 if(name==='N'){
  const pair=[from,to].sort((a,b)=>Number(a.slice(1))-Number(b.slice(1))).join('-');
  if(['N1-N2','N2-N3','N3-N4','N4-N5','N5-N6','N6-N7','N7-N8'].includes(pair))return{width:25,surface:'asphalt'};
  if(['N8-N9','N9-N10'].includes(pair))return{width:30,surface:'concrete'};
  if(pair==='N10-N11')return{width:29,surface:'asphalt'};
 }
 if(name==='P'){
  const a=Number(from.match(/^P(\d+)$/)?.[1]??0),b=Number(to.match(/^P(\d+)$/)?.[1]??0);
  if(a>0&&b>0)return{width:25,surface:Math.max(a,b)<=6?'asphalt':'concrete'};
 }
 if(name==='Q'){
  const pair=[from,to].sort((a,b)=>Number(a.slice(1))-Number(b.slice(1))).join('-');
  if(pair==='Q1-Q2')return{width:25,surface:'asphalt'};
  if(pair==='Q2-Q4'||['Q4-Q5','Q5-Q6','Q6-Q7'].includes(pair))return{width:25,surface:'concrete'};
 }
 if(name==='S'){
  const pair=[from,to].sort((a,b)=>Number(a.slice(1))-Number(b.slice(1))).join('-');
  if(['S1-S2','S2-S3','S3-S4','S4-S5','S5-S6'].includes(pair))return{width:25,surface:'asphalt'};
  if(['S6-S7','S7-S8'].includes(pair))return{width:25,surface:'concrete'};
  if(pair==='S8-S9')return{width:25,surface:'mixed'};
  if(pair==='S9-S10')return{width:25,surface:'concrete'};
 }
 return taxiwaySpecs[name];
}
function edge(from:string,to:string,name:string,width=25,runway?:RunwayId,maxSpan=82,approx=false):void { const a=nodeById.get(from)!,b=nodeById.get(to)!,spec=taxiwaySegmentSpec(name,from,to);taxiEdges.push({id:from+'__'+to,from,to,name,width:spec?.width??width,surface:spec?.surface??'approximation',surfaceSource:spec?'AD 2.8':'visual default',length:Math.hypot(a.x-b.x,a.z-b.z),speedLimit:runway?6:8,maxSpan,active:true,runway,geometryConfidence:approx?'approximation':'projected'}); }
// Named intersections from AIP AD 2 RCTP-39. Retain source spellings;
// malformed published center N1/P9 coordinates are deliberately not used.
const coords: [string,string,string][] = [
 ['N1','250417.54N','1211303.06E'],['N2','250420.98N','1211307.43E'],['N3','250423.64N','1211310.81E'],['N4','250425.76N','1211313.51E'],['N5','250434.73N','1211324.88E'],['N6','250441.49N','1211333.49E'],['N7','250450.11N','1211344.45E'],['N8','250455.86N','1211351.76E'],['N9','250505.56N','1211404.09E'],['N10','250515.27N','1211416.43E'],['N11','250523.79N','1211427.26E'],['N12','250531.09N','1211436.53E'],['N13','250534.54N','1211440.92E'],
 ['P1','250414.85N','1211305.62E'],['P2','250418.29N','1211309.98E'],['P3','250420.95N','1211313.36E'],['P4','250423.07N','1211316.06E'],['P5','250432.04N','1211327.43E'],['P6','250438.80N','1211336.04E'],['P7','250447.42N','1211347.01E'],['P8','250453.17N','1211354.32E'],['P9','250502.87N','1211406.64E'],['P10','250512.58N','1211418.98E'],
 ['Q1','250402.12N','1211331.21E'],['Q2','250404.24N','1211333.93E'],['Q4','250420.09N','1211353.79E'],['Q5','250434.46N','1211412.05E'],['Q6','250448.10N','1211429.39E'],['Q7','250453.87N','1211436.73E'],
 ['S1','250344.28N','1211322.65E'],['S2','250346.67N','1211322.88E'],['S3','250349.27N','1211326.18E'],['S4','250357.04N','1211336.03E'],['S5','250359.17N','1211338.73E'],['S6','250414.88N','1211358.73E'],['S7','250429.25N','1211416.99E'],['S8','250442.87N','1211434.31E'],['S9','250448.68N','1211441.65E'],['S10','250457.10N','1211452.39E'],['S11','250504.65N','1211501.96E'],
 ['R1','250349.10N','1211320.57E'],['R2','250351.69N','1211323.87E'],['R3','250359.47N','1211333.73E'],['R4','250401.60N','1211336.43E'],['R5','250417.31N','1211356.42E']
];
coords.forEach(c=>geo(...c));
// IDs N12/N13 etc are internal vertex keys, not taxiway designations.
const chains: Record<string,string[]> = {N:Array.from({length:13},(_,i)=>'N'+(i+1)),P:Array.from({length:10},(_,i)=>'P'+(i+1)),Q:['Q1','Q2','Q4','Q5','Q6','Q7'],S:Array.from({length:11},(_,i)=>'S'+(i+1)),R:['R1','R2','R3','R4','R5']};
// Chart depicts N continuing beyond N11 along the cargo apron. Endpoint is digitized.
node('north-cargo-end',2190,-548);chains.N.push('north-cargo-end');
// Create stand/lead-in nodes and insert a projected access point along its real apron spine.
for(const g of gates){ node(g.nodeId,g.x,g.z,'stand'); const spine=g.id.startsWith('5')?'N':/^[AD]/.test(g.id)?'P':'Q'; const list=chains[spine]; const sorted=list.map(id=>nodeById.get(id)!).sort((a,b)=>a.x-b.x); let a=sorted[0],b=sorted[sorted.length-1]; for(let i=1;i<sorted.length;i++){if(g.x<=sorted[i].x){a=sorted[i-1];b=sorted[i];break;}} const t=Math.max(0,Math.min(1,(g.x-a.x)/(b.x-a.x))); const accessX=Math.max(a.x,Math.min(b.x,g.x));const accessZ=a.z+(b.z-a.z)*t; const toward=Math.sign(accessZ-g.z)||1;node(g.pushbackNodeId,g.x,g.z+toward*48,'pushback');const access='apron-'+g.id;node(access,accessX,accessZ);list.push(access);edge(g.nodeId,g.pushbackNodeId,'Stand '+g.id,25,undefined,g.maxSpan,true);edge(g.pushbackNodeId,access,'Apron '+g.terminal,25,undefined,g.maxSpan,true); }
for(const [name,ids] of Object.entries(chains)){ ids.sort((a,b)=>nodeById.get(a)!.x-nodeById.get(b)!.x);for(let i=1;i<ids.length;i++) edge(ids[i-1],ids[i],name,name==='N'?25:25); }
for(let i=1;i<=10;i++) edge('N'+i,'P'+i,'P'+i,i===6||i===10?30:i===7?45:25);
edge('P3','Q1','W1',25,undefined,36);edge('P4','Q2','W2',25,undefined,36);edge('P10','Q7','E',30);
edge('Q1','R3','Q1');edge('R3','S4','Q1');edge('Q2','R4','Q2');edge('R4','S5','Q2');edge('Q4','R5','Q4');edge('R5','S6','Q4');edge('Q5','S7','Q5');edge('Q6','S8','Q6');edge('Q7','S9','Q7');edge('R1','S2','R2');edge('R2','S3','R3');

// Full-length entries, protected holds and usable exits. Hold locations are an abstraction.
const links: [RunwayId,Direction,string,string,string,string][] = [
 ['north','05','N1','N1','250422.81N','1211258.06E'],['north','23','N13','N11','250539.81N','1211435.93E'],
 ['south','05','S1','S1','250339.28N','1211324.95E'],['south','23','S11','S10','250459.49N','1211506.86E']
];
for(const [rid,dir,spine,name,lat,lon] of links){ const r=runways.find(r=>r.id===rid)!;const p=projectCoordinate(lat,lon),s=nodeById.get(spine)!;const hold='hold-'+rid+'-'+dir,entry='entry-'+rid+'-'+dir;node(hold,p.x,r.z+Math.sign(s.z-r.z)*95,'hold',rid);node(entry,p.x,r.z,'entry',rid);edge(spine,hold,name,26,undefined,82,true);edge(hold,entry,name,26,rid,82,true); }
const exits: [RunwayId,Direction,string,string,string,string][] = [
 ['north','05','N10','N8','250514.10N','1211409.61E'],['north','23','N6','N4','250446.60N','1211335.43E'],
 ['south','05','S8','S7','250440.49N','1211433.39E'],['south','23','S6','S5','250415.63N','1211405.14E']
];
for(const [rid,dir,spine,name,lat,lon] of exits){const p=projectCoordinate(lat,lon);node('exit-'+rid+'-'+dir,p.x,p.z,'exit',rid);edge('exit-'+rid+'-'+dir,spine,name,27,undefined,82,true);}
export const nodes=taxiNodes;
export const edges=taxiEdges;
export const terminals: Terminal[] = [
 {id:'T1',name:'Terminal 1',x:440,z:-45,width:175,depth:270,height:22,status:'operational'},
  {id:'T2',name:'Terminal 2',x:-285,z:-50,width:210,depth:290,height:34,status:'operational'},
 {id:'T3-N',name:'T3 North Concourse · D11–D18',x:-1090,z:-240,width:738,depth:55,height:13,status:'operational'},
 {id:'T3',name:'Terminal 3 · construction',x:-1110,z:0,width:414,depth:242,height:31,status:'construction'},
 {id:'T3-S',name:'T3 South · construction',x:-1120,z:220,width:520,depth:70,height:24,status:'construction'}
];
export const tower={x:5,z:-104,height:62,antennaHeight:65,cabHeight:55,radius:13,source:{source:'https://www.anws.gov.tw/OpenInformation/ApproachTower/Plan.htm',sourceDate:null,effectiveDate:'2019-12-16',expires:null,confidence:'medium',lastVerified:'2026-09-06',note:'62m building /65m including antenna confirmed; location projected from OpenStreetMap tower footprint; cab dimensions approximated.'} as SourceMetadata};
const supplementBase='https://ais.caa.gov.tw/eaip/AIRAC%20AIP%20AMDT%2003-26_2026_08_06/';
export const airportSupplements = [
 {id:'19/26',source:supplementBase+'eSUP/19-26_2026_08_03/SUP-en-GB.html',sourceDate:'2026-08-03',effectiveDate:'2026-08-03',expires:'2027-12-31',confidence:'high',lastVerified:'2026-09-06',note:'Code F restrictions; A380 and B748 intentionally outside the supported fleet.'},
 {id:'18/26',source:supplementBase+'eSUP/18-26_2026_08_15/SUP-en-GB.html',sourceDate:'2026-07-30',effectiveDate:'2026-08-15',expires:'2027-07-01',confidence:'high',lastVerified:'2026-09-06',note:'Crane area northwest of airport; daily 23:00–11:00 UTC; obstacle evaluation not simulated.'},
 {id:'21/26',source:supplementBase+'eSUP/21-26_2026_08_30/SUP-en-GB.html',sourceDate:'2026-08-25',effectiveDate:'2026-08-30',expires:'2027-07-01',confidence:'high',lastVerified:'2026-09-06',note:'Fixed crane south of airport; H24; obstacle evaluation not simulated.'}
] satisfies (SourceMetadata & {id:string})[];
export const airportGeometryByEra = { '2026 Current':{id:'2026-current',referenceDate:'2026-11-13',validFrom:'2026-10-29',validTo:'2026-12-24',runways,gates,nodes,edges,terminals,tower}, 'Future Completed Airport':{id:'future-concept',referenceDate:null,playable:false,description:'Reserved adapter; no future operational topology assumed.'} };
export const airportOperationalRules={ referenceDate:'2026-11-13',source:airportSource,defaultDirection:'05' as Direction,routeSpeedUnit:'metres/second',geometryNotice:'AIRAC 05/26 runway, stand, pavement, and lighting data; simplified chart-based taxi graph',notamStatus:'No live NOTAM synchronization',frequencies:{tower:'118.700',groundNorth:'121.700',groundSouth:'121.600',delivery:'121.800',atis:'127.600'},wakeSeparationSeconds:{M_M:60,H_M:120,H_H:90,M_H:60},wakeNotice:'Gameplay timing, not a transcription of Taiwan operational separation standards',gateLimitNotice:'Simulation wingspan caps; current AD2.8 lists stand MAX ACFT as NIL',sizeRestrictedTaxiway:{name:'W',maxSpan:36},publishedRoutineClosures:{north:{dailyUtc:'03:30–04:00',overnightUtc:'17:00–22:40 on even UTC dates and specified month ends'},south:{dailyUtc:'02:30–03:00',overnightUtc:'17:00–22:40 on odd UTC dates except specified month ends'},implemented:false},requiredDockingGuidance:true };
export const airport={icao:'RCTP',iata:'TPE',name:'Taiwan Taoyuan International Airport',referenceDate:'2026-11-13',runways,gates,nodes,edges,taxiNodes,taxiEdges,terminals,tower,source:airportSource};
export const AIRPORT=airport;
