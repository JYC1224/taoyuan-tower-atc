/** Public-map proportions for built terminal interior footprints. */
/**
 * Public-service points marked on the current T1 1F airport map. The map
 * confirms the facilities and their broad side-of-hall placement, but does
 * not publish lease dimensions or measured coordinates; offsets are fit-out
 * estimates within the existing arrivals/public-hall footprint.
 */
export const T1_FIRST_FLOOR_SERVICES={
 desks:[
  {id:'baggage-service',side:-1,zRatio:.22,length:14,stations:2,label:'BAGGAGE SERVICE  行李服務',accent:'#65847c',kind:'baggage'},
  {id:'bank-taiwan',side:-1,zRatio:.31,length:16,stations:3,label:'BANK OF TAIWAN  臺灣銀行',accent:'#8f7946',kind:'bank'},
  {id:'megabank',side:-1,zRatio:.39,length:14,stations:2,label:'MEGA BANK  兆豐銀行',accent:'#587b74',kind:'bank'},
  {id:'tourist-service',side:1,zRatio:.27,length:14,stations:2,label:'TOURIST SERVICE  旅客服務',accent:'#31877f',kind:'information'},
  {id:'mobile-service',side:1,zRatio:.37,length:12,stations:2,label:'MOBILE SERVICE  電信服務',accent:'#517e89',kind:'telecom'},
 ],
 atms:[{id:'west-atm',side:-1,zRatio:.45},{id:'east-atm',side:1,zRatio:.45}],
 aeds:[{id:'west-aed',side:-1,zRatio:.18},{id:'east-aed',side:1,zRatio:.34}],
 meetingPoints:[{id:'north-meeting-point',side:-1,zRatio:.43,label:'MEETING POINT 會面點 A'},{id:'south-meeting-point',side:1,zRatio:.43,label:'MEETING POINT 會面點 B'}],
} as const;

export function t1FirstFloorServiceCenter(centerX:number,centerZ:number,width:number,depth:number,side:-1|1,zRatio:number){
 return {x:centerX+side*(width*.36-1.5),z:centerZ+depth*zRatio};
}

/**
 * T1's public 2F map depicts a large central opening with a narrow public
 * circulation band around it. The map is schematic, so these ratios are a
 * visual fit to its footprint rather than surveyed dimensions.
 */
export const T1_SECOND_FLOOR_LAYOUT={
 atrium:{widthRatio:.78,depthRatio:.66,xOffset:0,zOffset:0},
 shop:{width:17,depth:8.2},
 shops:[
  {id:'taiwan-beer',side:-1,zRatio:-.26},
  {id:'oli',side:-1,zRatio:-.02},
  {id:'hanlin',side:-1,zRatio:.20},
  {id:'kuo-yuan-ye',side:1,zRatio:-.26},
  {id:'mos',side:1,zRatio:-.02},
  {id:'bistro-d',side:1,zRatio:.20},
 ]
} as const;

/** T1 3F public-map tenants; storefront dimensions/coordinates are estimates. */
export const T1_THIRD_FLOOR_STORES=[
 {id:'starbucks',dx:-64,dz:-95,width:17,depth:12,label:'STARBUCKS  星巴克',accent:'#176b50',kind:'food',profile:'tea'},
 {id:'oli',dx:-12,dz:-9,width:17,depth:12,label:'OLI DESIGN  設計師商店',accent:'#637c75',kind:'retail',profile:'design'},
 {id:'taiwan-goods',dx:-12,dz:8,width:17,depth:8,label:'TAIWAN SPECIALTY GOODS  台灣特色商品館',accent:'#a17b4f',kind:'retail',profile:'taiwan-goods'},
 {id:'hanlin',dx:-8,dz:25,width:17,depth:12,label:'HANLIN TEA  翰林茶館',accent:'#8b4836',kind:'food',profile:'tea'},
 {id:'kuo-yuan-ye',dx:22,dz:-78,width:18,depth:12,label:'KUO YUAN YE  郭元益',accent:'#a17a45',kind:'food',profile:'bakery'},
 {id:'mos',dx:-60,dz:82,width:17,depth:12,label:'MOS BURGER  摩斯漢堡',accent:'#ad4538',kind:'food',profile:'burger'},
 {id:'vigor',dx:-8,dz:90,width:18,depth:12,label:'VIGOR BAKERY  維格餅家',accent:'#a17a45',kind:'food',profile:'bakery'},
 {id:'indigenous-crafts',dx:-70,dz:106,width:20,depth:12,label:'TAIWAN INDIGENOUS CRAFT  原住民精藝品展售館',accent:'#8d754c',kind:'retail',profile:'craft'},
] as const;

/** T1 3F map service locations; point and counter dimensions remain estimates. */
export const T1_THIRD_FLOOR_SERVICES={
 atm:{dx:-5,dz:-96},
 exchanges:[
  {id:'north-exchange',dx:53,dz:-96,label:'FOREIGN EXCHANGE  台外幣兌換機'},
  {id:'south-exchange',dx:53,dz:116,label:'FOREIGN EXCHANGE  台外幣兌換機'},
 ],
 banks:[
  {id:'taiwan-bank',dx:54,dz:-66,length:16,stations:3,label:'BANK OF TAIWAN  臺灣銀行',accent:'#786e50'},
  {id:'mega-bank',dx:-50,dz:127,length:15,stations:2,label:'MEGA BANK  兆豐銀行',accent:'#657b81'},
 ],
} as const;

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
 // Keep lounge suites in the side galleries outside the open atrium edge.
 lounge:{centerOffsetRatio:.34,width:27,depth:22,height:3.8},
} as const;

export const T2_FOURTH_FLOOR_SHOPS=[
 {id:'t2-shop-shishen-noodles',name:'仕紳品麵',side:-1,zRatio:-.31,depth:9.5,length:18,height:3.55,accent:'#9b6449',kind:'noodles'},
 {id:'t2-shop-starbucks',name:'STARBUCKS  星巴克',side:-1,zRatio:-.08,depth:9.5,length:17,height:3.55,accent:'#176b50',kind:'coffee'},
 {id:'t2-shop-baiba-fish',name:'百八漁場 桃機店',side:-1,zRatio:.18,depth:10.8,length:20,height:3.7,accent:'#587b7b',kind:'seafood'},
 {id:'t2-shop-xiaonanmen',name:'小南門',side:1,zRatio:-.31,depth:9.5,length:18,height:3.55,accent:'#a44b42',kind:'dining'},
 {id:'t2-shop-mos-burger',name:'摩斯漢堡',side:1,zRatio:-.13,depth:9.5,length:17,height:3.55,accent:'#b78639',kind:'burger'},
 {id:'t2-shop-xingbo-coffee',name:'興波咖啡',side:1,zRatio:.10,depth:9.5,length:17,height:3.5,accent:'#65584b',kind:'coffee'},
 {id:'t2-shop-shangshan-doujia',name:'上善豆家',side:1,zRatio:.32,depth:9.5,length:18,height:3.6,accent:'#718064',kind:'tofu'},
] as const;

export const T2_FOURTH_FLOOR_LOUNGES=[
 {name:'中華航空貴賓室',operator:'China Airlines',side:-1,zRatio:-.27,width:27,depth:36,height:3.8,accent:'#7b4d55',style:'china'},
 {name:'長榮航空貴賓室',operator:'EVA Air',side:-1,zRatio:-.06,width:27,depth:34,height:3.8,accent:'#8c7448',style:'eva'},
 {name:'長榮航空貴賓室',operator:'EVA Air',side:1,zRatio:.14,width:27,depth:36,height:3.8,accent:'#8c7448',style:'eva'},
 {name:'長榮航空貴賓室',operator:'EVA Air',side:1,zRatio:.32,width:27,depth:36,height:3.8,accent:'#8c7448',style:'eva'},
 {name:'東方宇逸貴賓室',operator:'Oriental Club',side:1,zRatio:.43,width:27,depth:32,height:3.8,accent:'#8b7059',style:'oriental'},
] as const;

/** 4F public amenities read from the official map; room sizes and offsets are schematic. */
export const T2_FOURTH_FLOOR_SERVICES={
 restroom:{dx:-78,dz:118,width:15,depth:10,facing:1 as const},
 showers:[
  {id:'north-showers',dx:82,dz:-135,width:16,depth:10,facing:-1 as const},
  {id:'central-showers',dx:82,dz:-43,width:16,depth:10,facing:-1 as const},
 ],
 aeds:[{id:'west-aed',dx:-74,dz:-18,facing:1 as const},{id:'south-aed',dx:24,dz:128,facing:1 as const}],
} as const;

/** T2's official 3F map names five separate airside retail/service frontages. */
export const T2_THIRD_FLOOR_LAYOUT={
 retail:{centerZOffset:85,frontOffsetRatio:.22,span:120,gap:1.5},
 services:[
  {id:'nursing',dx:-24,dz:-89,width:14,depth:10,label:'NURSING ROOM  哺集乳室',kind:'nursing',facing:-1 as const},
  {id:'restrooms',dx:55,dz:-98,width:18,depth:12,label:'RESTROOMS  廁所',kind:'restroom',facing:1 as const},
 ],
 atm:{wallDx:-90,dz:-100},
 bankServices:[
  {id:'west-bank',wallDx:-90,dz:-66,length:17,label:'BANK OF TAIWAN  臺灣銀行',accent:'#95804e',stations:3},
  {id:'central-bank',wallDx:18,dz:38,length:15,label:'BANK OF TAIWAN  臺灣銀行',accent:'#887b54',stations:2},
 ],
 exchange:{dx:-70,dz:-27},
 aeds:[{dx:55,dz:-5}]
} as const;

/**
 * Shop names follow the airport's current 3F map. Individual frontage lengths,
 * depths and internal fit-outs are interpretations because that map is not
 * dimensioned.
 */
export const T2_THIRD_FLOOR_RETAIL_BAYS=[
 {id:'diamond-watch',length:18,depth:13,label:'采盟免稅・鑽錶專門店',accent:'#8c7650',style:'watch'},
 {id:'international-goods',length:22,depth:14,label:'采盟免稅・國際精品',accent:'#647872',style:'luxury'},
 {id:'beauty-fragrance',length:28,depth:17,label:'昇恆昌免稅店・美妝香氛',accent:'#94614c',style:'beauty'},
 {id:'service-pickup',length:28,depth:16,label:'昇恆昌商品服務・網購提貨中心',accent:'#5b7778',style:'service'},
 {id:'watch-gallery',length:18,depth:13,label:'Watch Gallery・世界時區',accent:'#a08750',style:'watch'},
] as const;

export function t2ThirdFloorRetailUnits(centerX:number,centerZ:number,terminalWidth:number){
 const {retail}=T2_THIRD_FLOOR_LAYOUT,frontX=centerX+terminalWidth*retail.frontOffsetRatio,
  totalLength=T2_THIRD_FLOOR_RETAIL_BAYS.reduce((sum,bay)=>sum+bay.length,0)+T2_THIRD_FLOOR_LAYOUT.retail.gap*(T2_THIRD_FLOOR_RETAIL_BAYS.length-1);
 let cursor=centerZ+retail.centerZOffset-totalLength/2;
 return T2_THIRD_FLOOR_RETAIL_BAYS.map(bay=>{
  const z=cursor+bay.length/2;cursor+=bay.length+retail.gap;
  return {...bay,frontX,x:frontX+bay.depth/2,z};
 });
}

export function t2FourthFloorShopCenter(centerX:number,centerZ:number,terminalWidth:number,terminalDepth:number,side:-1|1,zRatio:number,shopDepth:number=T2_FOURTH_FLOOR_LAYOUT.shop.depth){
 const frontX=centerX+side*terminalWidth*T2_FOURTH_FLOOR_LAYOUT.shop.frontOffsetRatio;
 return {x:frontX+side*shopDepth/2,z:centerZ+terminalDepth*zRatio,frontX};
}

export function t2FourthFloorLoungeCenter(centerX:number,centerZ:number,terminalWidth:number,terminalDepth:number,side:-1|1,zRatio:number){
 return {x:centerX+side*terminalWidth*T2_FOURTH_FLOOR_LAYOUT.lounge.centerOffsetRatio,z:centerZ+terminalDepth*zRatio};
}

/** Regular two-column seating groups leave a continuous center aisle through each lounge. */
export function t2FourthFloorLoungeSeatCenters(centerX:number,centerZ:number,side:-1|1,depth:number){
 const rows=depth>=34?3:2,spacing=rows===3?8:7;
 return Array.from({length:rows*2},(_,index)=>{
  const row=Math.floor(index/2),column=index%2===0?-1:1;
  return {x:centerX+side*column*5.1,z:centerZ+(row-(rows-1)/2)*spacing};
 });
}
