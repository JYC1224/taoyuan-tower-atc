import type {FleetProfile} from '../types';

// Coordinates use distance along the family nose and radians from the top
// centreline. Each list describes one side; the other side is mirrored.
export type NosePoint=readonly [number,number];
export interface NoseSpec {family:'a320'|'a330'|'a350'|'a380'|'b737'|'b787'|'b777';length:number;roundness:number;drop:number;mask:readonly NosePoint[]|null;panes:readonly (readonly NosePoint[])[]}

const standardPanes:readonly (readonly NosePoint[])[]=[
 [[.31,0],[.45,0],[.83,.62],[.41,.68]],
 [[.44,.73],[.86,.68],[.97,.93],[.60,1.04]],
 [[.63,1.10],[.99,.99],[1.07,1.17],[1.00,1.28],[.76,1.25]]
];
const a350Panes:readonly (readonly NosePoint[])[]=[
 [[.31,0],[.45,0],[.83,.62],[.42,.68]],
 [[.44,.73],[.86,.67],[.96,.93],[.60,1.04]],
 [[.63,1.10],[.98,.99],[1.04,1.17],[.99,1.25],[.87,1.27],[.73,1.21]]
];
const a350Mask:readonly NosePoint[]=[[.25,-.06],[.48,-.06],[.84,.54],[1.01,.82],[1.10,1.13],[1.07,1.27],[.94,1.35],[.71,1.28],[.53,1.02],[.39,.77],[.29,.34]];
const b787Panes:readonly (readonly NosePoint[])[]=[
 [[.30,0],[.45,0],[.86,.66],[.42,.72]],
 [[.45,.79],[.89,.73],[1.04,1.15],[.99,1.27],[.73,1.25],[.57,1.08]]
];
const b737Panes:readonly (readonly NosePoint[])[]=[
 [[.29,0],[.45,0],[.79,.58],[.43,.68]],
 [[.44,.75],[.86,.69],[.99,1.04],[.93,1.19],[.70,1.20],[.56,1.05]]
];
const a380Panes:readonly (readonly NosePoint[])[]=[
 [[.29,0],[.45,0],[.78,.57],[.43,.67]],
 [[.43,.75],[.84,.69],[.97,1.04],[.91,1.18],[.69,1.19],[.55,1.04]]
];

/** Family dimensions are visual approximations in metres, independent of fuselage length. */
export function noseSpec(profile:FleetProfile):NoseSpec{
 if(profile.id==='A380')return {family:'a380',length:9.1,roundness:2.05,drop:.22,mask:null,panes:a380Panes};
 if(profile.id.startsWith('A35'))return {family:'a350',length:8.4,roundness:1.85,drop:.20,mask:a350Mask,panes:a350Panes};
 if(profile.id.startsWith('B73'))return {family:'b737',length:5.25,roundness:2.0,drop:.20,mask:null,panes:b737Panes};
 if(profile.id.startsWith('B78'))return {family:'b787',length:8.2,roundness:1.75,drop:.20,mask:null,panes:b787Panes};
 if(profile.id.startsWith('B77'))return {family:'b777',length:8.6,roundness:1.95,drop:.19,mask:null,panes:standardPanes};
 if(profile.id.startsWith('A33'))return {family:'a330',length:7.6,roundness:2.0,drop:.21,mask:null,panes:standardPanes};
 return {family:'a320',length:5.3,roundness:2.1,drop:.21,mask:null,panes:standardPanes};
}
