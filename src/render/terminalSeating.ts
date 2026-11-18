import * as THREE from 'three';

/** Cupped pan and bent back of linked-airport seating. */
export function terminalSeatGeometry(curveSegments=5,bevelEnabled=true){
 const profile=new THREE.Shape();
 profile.moveTo(-.32,.49);profile.quadraticCurveTo(-.12,.445,.19,.47);profile.quadraticCurveTo(.31,.48,.325,.62);
 profile.lineTo(.355,1.0);profile.quadraticCurveTo(.35,1.075,.29,1.085);profile.lineTo(.273,1.045);
 profile.lineTo(.283,.62);profile.quadraticCurveTo(.27,.525,.18,.515);profile.quadraticCurveTo(-.1,.49,-.32,.53);profile.closePath();
 const geometry=new THREE.ExtrudeGeometry(profile,{depth:.59,bevelEnabled,bevelSegments:1,bevelSize:.012,bevelThickness:.012,curveSegments});
 geometry.translate(0,0,-.295);return geometry.rotateY(Math.PI/2);
}
