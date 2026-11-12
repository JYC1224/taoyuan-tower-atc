import type {FleetProfile} from '../types';

export type WingFamily='a320'|'a330'|'a350'|'a350k'|'a380'|'b737'|'b787'|'b777'|'b777r';
export interface WingTemplate { leading:readonly [number,number,number,number,number,number]; chord:readonly [number,number,number,number,number,number]; thickness:readonly [number,number,number,number,number,number] }
export interface VerticalTailTemplate {rootLeading:number;rootTrailing:number;tipLeading:number;tipTrailing:number}
export interface AirframeDesign {
  wingFamily:WingFamily;
  verticalTail:VerticalTailTemplate;
  engineRadius:number;
  engineZFraction:number;
  nacelleLength:number;
  nacelleVerticalScale:number;
  mainGearTrack:number;
  mainWheelTrack:number;
  noseWheelTrack:number;
  bodyGearTrack:number;
  bodyWheelTrack:number;
  mainWheelRadius:number;
  noseWheelRadius:number;
  mainAxles:readonly number[];
  tailplaneScale:number;
  tailplaneChords:readonly [number,number,number];
  doubleDeck:boolean;
}

/**
 * Family wing planforms are in metres, not fractions of fuselage length. This
 * keeps an A321's wing the same size as an A320's while the fuselage stretches.
 * Source geometry is simplified from manufacturer airport-planning drawings.
 */
const wings:Record<WingFamily,WingTemplate>={
  a320:{leading:[-3.55,-.95,.78,3.35,4.45,4.88],chord:[7.30,5.20,3.72,1.78,.86,.52],thickness:[.112,.100,.090,.075,.064,.050]},
  a330:{leading:[-5.70,-1.55,1.18,5.05,7.20,7.90],chord:[13.35,9.95,6.75,3.12,1.46,.72],thickness:[.112,.101,.091,.076,.065,.051]},
  a350:{leading:[-5.95,-1.70,1.25,5.15,7.15,7.85],chord:[14.20,10.25,6.68,3.08,1.38,.70],thickness:[.111,.100,.090,.075,.064,.050]},
  a350k:{leading:[-5.95,-1.70,1.25,5.15,7.20,7.92],chord:[14.20,10.40,6.95,3.34,1.50,.72],thickness:[.111,.100,.091,.076,.065,.050]},
  a380:{leading:[-7.80,-2.35,1.60,6.65,9.50,10.15],chord:[17.20,12.50,8.15,3.95,1.76,.78],thickness:[.114,.102,.092,.077,.066,.052]},
  b737:{leading:[-3.40,-.72,1.02,3.72,5.10,5.55],chord:[7.32,5.15,3.70,1.72,.82,.50],thickness:[.112,.100,.090,.075,.064,.050]},
  b787:{leading:[-5.80,-1.75,1.10,5.00,8.15,9.15],chord:[14.25,10.05,6.62,3.00,1.26,.54],thickness:[.108,.098,.089,.074,.063,.049]},
  b777:{leading:[-6.25,-1.90,1.55,6.25,9.10,9.72],chord:[15.25,10.90,7.22,3.42,1.55,.76],thickness:[.114,.102,.092,.077,.066,.052]},
  b777r:{leading:[-6.25,-1.90,1.55,6.25,9.95,11.05],chord:[15.25,10.90,7.22,3.42,1.40,.50],thickness:[.114,.102,.092,.077,.063,.048]},
};

// Normalized longitudinal stations for the fin. The leading and trailing edges
// vary by aircraft family; the renderer lofts between them with a swept curve.
const verticalTails:Record<WingFamily,VerticalTailTemplate>={
  a320:{rootLeading:.278,rootTrailing:.488,tipLeading:.405,tipTrailing:.458},
  a330:{rootLeading:.266,rootTrailing:.490,tipLeading:.397,tipTrailing:.462},
  a350:{rootLeading:.272,rootTrailing:.490,tipLeading:.412,tipTrailing:.464},
  a350k:{rootLeading:.270,rootTrailing:.490,tipLeading:.414,tipTrailing:.466},
  a380:{rootLeading:.255,rootTrailing:.492,tipLeading:.405,tipTrailing:.464},
  b737:{rootLeading:.286,rootTrailing:.490,tipLeading:.416,tipTrailing:.468},
  b787:{rootLeading:.258,rootTrailing:.490,tipLeading:.407,tipTrailing:.466},
  b777:{rootLeading:.252,rootTrailing:.491,tipLeading:.398,tipTrailing:.470},
  b777r:{rootLeading:.250,rootTrailing:.491,tipLeading:.398,tipTrailing:.472},
};

const engineRadius:Record<string,number>={
  A320:.99,A321:.99,A320C:.94,A321C:.94,A330:1.62,A332:1.62,A339:1.77,A350:1.72,A35K:1.78,A380:1.66,
  B789:1.68,B78X:1.68,B77W:1.91,B77F:1.91,B772:1.78,B773:1.78,B738:.94,B739:.94,B38M:1.04,
};
const mainAxles:Record<string,readonly number[]>={
  B77W:[-1.1,0,1.1],B77F:[-1.1,0,1.1],B772:[-1.1,0,1.1],B773:[-1.1,0,1.1],
  A35K:[-.9,0,.9],A380:[-.55,.55],
};

export function airframeDesign(profile:FleetProfile):AirframeDesign{
  const id=profile.id;
  const wingFamily:WingFamily=id==='A380'?'a380':id.startsWith('A35')?(id==='A35K'?'a350k':'a350'):id.startsWith('A33')?'a330':id.startsWith('A32')?'a320':id==='B38M'||id.startsWith('B73')?'b737':id.startsWith('B78')?'b787':id==='B77W'||id==='B77F'?'b777r':'b777';
  return{
    wingFamily,
    verticalTail:verticalTails[wingFamily],
    engineRadius:engineRadius[id]??1.12,
    // NEO/MAX engines sit farther forward on the wing; the MAX nacelle is
    // flattened to preserve the 737's tight ground-clearance envelope.
    engineZFraction:id==='B38M'?-.068:id==='A320'||id==='A321'||id==='A339'?-.050:-.025,
    nacelleLength:id==='A339'?1.09:id==='B38M'?1.08:id==='A320'||id==='A321'?1.05:1,
    nacelleVerticalScale:id==='B38M'?.84:1,
    // Center-to-center track dimensions are taken from the airport-planning
    // footprint drawings. Paired-tire tracks use the OEM tire-center callouts.
    mainGearTrack:id==='A380'?12.456:id.startsWith('A32')?7.590:id.startsWith('A33')?10.684:id.startsWith('A35')?10.734:id.startsWith('B78')?11.90:id==='B772'?10.97:id==='B773'?12.88:id.startsWith('B77')?12.90:5.72,
    mainWheelTrack:id==='A380'?1.70:id.startsWith('A32')?.927:id.startsWith('A33')?1.397:id.startsWith('A35')?1.397:id.startsWith('B78')?1.51:id.startsWith('B77')?1.45:.76,
    noseWheelTrack:id==='A380' ? 1.05 : id.startsWith('A33') ? .710 : id.startsWith('A35') ? .748 : id.startsWith('B77') ? .78 : id.startsWith('B78') ? .72 : (id.startsWith('B73')||id==='B38M') ? .58 : .50,
    bodyGearTrack:id==='A380'?5.264:0,
    bodyWheelTrack:id==='A380'?1.53:0,
    mainWheelRadius:id==='A380'?.70:id.startsWith('A35')?.635:id.startsWith('A33')?.70:id.startsWith('B77')?.635:id.startsWith('B78')?.686:id==='B38M'?.59:id.startsWith('B73')?.58:.584,
    noseWheelRadius:id==='A380' ? .635 : id.startsWith('B77') ? .53 : id.startsWith('B78') ? .508 : (id.startsWith('A35')||id.startsWith('A33')) ? .525 : id==='B38M' ? .35 : id.startsWith('B73') ? .35 : .381,
    mainAxles:mainAxles[id]??(profile.span>45?[-.55,.55]:[0]),
    tailplaneScale:id==='A332'?1.12:id==='A380'?1.16:1,
    tailplaneChords:id==='A380'?[11.8,7.6,2.8]:id==='A332'?[9.2,6.2,2.3]:id.startsWith('A33')?[8.8,5.9,2.2]:id==='A35K'?[9.8,6.6,2.35]:id.startsWith('A35')?[9.4,6.35,2.25]:id.startsWith('A32')?[5.5,3.55,1.3]:id.startsWith('B73')||id==='B38M'?[5.5,3.5,1.25]:id.startsWith('B78')?[9.3,6.2,2.2]:[10.2,6.8,2.45],
    doubleDeck:id==='A380',
  };
}

export function wingTemplate(profile:FleetProfile):WingTemplate{return wings[airframeDesign(profile).wingFamily];}
