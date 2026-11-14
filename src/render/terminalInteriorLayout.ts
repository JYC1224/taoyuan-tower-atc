/** Public-map proportions for built terminal interior footprints. */
export const T1_FOURTH_FLOOR_LAYOUT = {
 // The operator's archived T1 Zone C specification gives 376 m². Its current
 // listing describes a 100-guest capacity. Zone D has no public measured plan,
 // so it uses the same footprint as an explicit proxy. T1 is 175 m × 270 m in
 // the airport model, so these ratios produce ~376 m² per modeled room.
 widthRatio: .112,
 depthRatio: .58,
 suiteDepthRatio: .071,
 suiteCenterOffsetRatio: .17,
 spineWidthRatio: .036,
 suiteCenterXOffsetRatio: .074
} as const;

export const T1_FOURTH_FLOOR_LOUNGES = [
 // Negative Z is the north/A-gate end (Zone D); positive Z is the south/B-gate
 // end (Zone C), following the airport's current map orientation.
 {nameEn:'The Blossom',nameZh:'環亞貴賓室・The Blossom',zone:'D',style:'booth',accent:'#a9855f',seat:'#958a80',pillow:'#d6cbbf'},
 {nameEn:'The Jade',nameZh:'環亞貴賓室・The Jade',zone:'C',style:'dining',accent:'#28706c',seat:'#647b77',pillow:'#ddd6ca'}
] as const;

export function t1FourthFloorSuiteCenters(centerZ:number,terminalDepth:number){
 const offset=terminalDepth*T1_FOURTH_FLOOR_LAYOUT.suiteCenterOffsetRatio;
 return [centerZ-offset,centerZ+offset] as const;
}

export function t1FourthFloorSuiteCenterX(centerX:number,terminalWidth:number){
 return centerX+terminalWidth*T1_FOURTH_FLOOR_LAYOUT.suiteCenterXOffsetRatio;
}

/**
 * T2's public 4F diagram shows separate shop, dining and lounge footprints
 * beside the atrium. These ratios preserve those distinct zones in the game
 * footprint; the airport map is schematic and does not publish dimensions.
 */
export const T2_FOURTH_FLOOR_LAYOUT={
 atrium:{xOffset:0,zOffset:-42,width:110,depth:140},
 foodCourt:{xOffset:0,zRatio:.29,widthRatio:.52,depthRatio:.24},
 shop:{frontOffsetRatio:.43,depth:8.4,length:13.2,height:3.65},
 lounge:{centerOffsetRatio:.36,width:27,depth:22,height:3.8},
} as const;

export const T2_FOURTH_FLOOR_SHOPS=[
 {name:'MANNER COFFEE',side:1,zRatio:-.36,accent:'#ad1d2c',kind:'coffee'},
 {name:'MOS BURGER',side:-1,zRatio:-.30,accent:'#d3a52f',kind:'burger'},
 {name:'STARBUCKS',side:-1,zRatio:-.17,accent:'#176b50',kind:'coffee'},
 {name:'XINGBO COFFEE',side:1,zRatio:-.12,accent:'#55695c',kind:'coffee'},
 {name:'YOUSHAN DOUJIA',side:1,zRatio:.24,accent:'#8c5838',kind:'dining'},
] as const;

export const T2_FOURTH_FLOOR_LOUNGES=[
 {name:'EVERGREEN LOUNGE',operator:'EVA Air',side:-1,zRatio:.28,accent:'#8c7448',style:'quiet'},
 {name:'EVERGREEN LOUNGE',operator:'EVA Air',side:1,zRatio:.27,accent:'#8c7448',style:'quiet'},
 {name:'EVERGREEN LOUNGE',operator:'EVA Air',side:-1,zRatio:.39,accent:'#8c7448',style:'quiet'},
 {name:'PLAZA PREMIUM LOUNGE',operator:'Plaza Premium',side:1,zRatio:.39,accent:'#88744e',style:'dining'},
] as const;

export function t2FourthFloorShopCenter(centerX:number,centerZ:number,terminalWidth:number,terminalDepth:number,side:-1|1,zRatio:number){
 const frontX=centerX+side*terminalWidth*T2_FOURTH_FLOOR_LAYOUT.shop.frontOffsetRatio;
 return {x:frontX+side*T2_FOURTH_FLOOR_LAYOUT.shop.depth/2,z:centerZ+terminalDepth*zRatio,frontX};
}

export function t2FourthFloorLoungeCenter(centerX:number,centerZ:number,terminalWidth:number,terminalDepth:number,side:-1|1,zRatio:number){
 return {x:centerX+side*terminalWidth*T2_FOURTH_FLOOR_LAYOUT.lounge.centerOffsetRatio,z:centerZ+terminalDepth*zRatio};
}
