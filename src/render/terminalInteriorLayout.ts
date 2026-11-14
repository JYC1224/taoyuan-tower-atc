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
 * The official T1 B1 layer labels two 7-ELEVEN locations, Da-You bus service,
 * three food outlets, two ATMs/AEDs, elevators, a restroom and a nursing room.
 * The map is schematic, so only the named points are treated as evidence;
 * shop bays, corridor widths and the basement elevation are layout estimates.
 */
// Keep T1 1F aligned with the airport reference grade; with a shallow B1, the
// basement ceiling must sit below the terrain mesh instead of coplanar with it.
export const T1_FLOOR_LEVELS=[-5.51,0,5.44,10.94,16.34] as const;
/**
 * The official visitor photograph near T1 counter 10 shows the hall's tall
 * airport-name landmark. Its precise surveyed position and dimensions are
 * unpublished; keep the authored panel tied to the modeled counter-10 island.
 */
export const T1_DEPARTURE_LANDMARK_LAYOUT={
 checkInCenterOffset:-42,
 checkInSpanRatio:.6,
 islandIndex:4,
 islandCount:6,
 xOffset:-27,
 width:9.2,
 depth:2.1,
 height:9.2,
} as const;
export const T1_BASEMENT_LAYOUT={
 shops:[
  {id:'7-eleven-north',name:'7-ELEVEN',dx:-56,side:1 as const,zOffset:-104,length:15,depth:9,accent:'#e95638',kind:'convenience' as const},
  {id:'7-eleven-south',name:'7-ELEVEN',dx:-56,side:1 as const,zOffset:104,length:15,depth:9,accent:'#e95638',kind:'convenience' as const},
  {id:'chatime',name:'日出茶太  Chatime',dx:56,side:-1 as const,zOffset:-46,length:17,depth:10,accent:'#6d8a52',kind:'tea' as const},
  {id:'burger-king',name:'BURGER KING  漢堡王',dx:56,side:-1 as const,zOffset:-11,length:17,depth:10,accent:'#93462f',kind:'burger' as const},
  {id:'han-zhan-ge',name:'韓饌閣',dx:56,side:-1 as const,zOffset:25,length:16,depth:9,accent:'#9a5948',kind:'dining' as const},
 ],
 bus:{dx:-55,dz:8,length:19,accent:'#4c8178'},
 atms:[{dx:59,dz:-119},{dx:59,dz:119}],
 aeds:[{dx:-69,dz:-73},{dx:-69,dz:73}],
 lifts:[{dx:-62,dz:-86},{dx:-62,dz:91}],
 restroom:{dx:-62,dz:116,width:18,depth:10,facing:1 as const},
 nursing:{dx:59,dz:84,width:16,depth:10,facing:-1 as const},
} as const;

export function t1BasementShopCenter(centerX:number,centerZ:number,shop:typeof T1_BASEMENT_LAYOUT.shops[number]){
 const x=centerX+shop.dx,frontX=x+shop.side*shop.depth/2;
 return {x,z:centerZ+shop.zOffset,frontX};
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

/** Counter 15 and counter 21 are explicitly marked on the airport's T1 3F map.
 * The public diagram is not dimensioned, so these footprints and offsets are estimates. */
export const T1_THIRD_FLOOR_CHECKIN_ZONES=[
 {counter:15,dx:-38,dz:-34,length:28,depth:15,stations:5},
 {counter:21,dx:38,dz:76,length:28,depth:15,stations:5},
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

/**
 * The airport identifies both T2 5F viewing areas as outdoor decks. Their
 * public photographs show open-air metal guardrails rather than a glazed
 * room. The map is schematic and publishes no deck section, so projection,
 * width and access opening below are dimensional estimates.
 */
export const T2_OBSERVATION_DECK_LAYOUT={
 spanRatio:.68,
 projection:13,
 accessXOffset:-40,
 accessWidth:4.8,
 accessHeight:2.7,
 railHeight:1.18,
 statueInset:4.2,
} as const;

/**
 * The official visitor photo places Taiwan Temple Avenue on T2's south 5F and
 * shows a painted old-street frontage, vivid promenade floor art and a large
 * circular ceiling feature. The airport's public map is schematic, so these
 * proportions define a visual fit rather than surveyed dimensions.
 */
export const T2_TEMPLE_AVENUE_LAYOUT={
 centerZRatio:.31,
 widthRatio:.82,
 depthRatio:.32,
 facadeSpanRatio:.5,
 facadeOffsetRatio:.32,
 facadeHeight:5.8,
 ceilingFeatureDiameter:17,
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

/**
 * T2 has two documented basement levels. The airport's public B2 map shows a
 * west-side passenger passage, a linked Airport MRT area, six dining
 * frontages, lifts/escalators and public amenities. The map is schematic and
 * the B1 layer does not publish interior zoning, so vertical dimensions and
 * all interior footprints below are model estimates; B1 is kept structural.
 */
export const T2_FLOOR_LEVELS=[-10.7,-5.2,.36,6.25,12.35,18.55,23.45] as const;
export const T2_BASEMENT_LAYOUT={
 aisle:{xOffsetRatio:-.4,width:16,northZOffset:-132,southZOffset:132},
 shops:[
  {id:'mi-alone',name:'米A LONE 個人燒肉',side:-1 as const,zOffset:48,length:15,depth:10,accent:'#8f523a',kind:'grill' as const},
  {id:'le-pai-dui',name:'樂排隊＋全藥燉排骨',side:-1 as const,zOffset:73,length:17,depth:10,accent:'#a24b3e',kind:'soup' as const},
  {id:'fuhang',name:'福勝亭',side:-1 as const,zOffset:103,length:14,depth:10,accent:'#9d683d',kind:'dining' as const},
  {id:'royal-heritage',name:'皇家傳承',side:1 as const,zOffset:59,length:14,depth:10,accent:'#9f7546',kind:'bakery' as const},
  {id:'songhe',name:'松鶴館',side:1 as const,zOffset:84,length:15,depth:10,accent:'#718064',kind:'dining' as const},
  {id:'xiaonanmen',name:'小南門',side:1 as const,zOffset:112,length:14,depth:10,accent:'#a64c42',kind:'soup' as const},
 ],
 atm:{dx:-78,dz:-104},
 aeds:[{dx:-63,dz:-68},{dx:-42,dz:-5}],
 restroom:{dx:82,dz:118,width:16,depth:11,facing:-1 as const},
 mrtLink:{zOffset:-40,width:18,length:38},
 escalators:[{dx:-.26,zOffset:5},{dx:-.26,zOffset:40}],
} as const;

export function t2BasementAisleX(centerX:number,terminalWidth:number){
 return centerX+terminalWidth*T2_BASEMENT_LAYOUT.aisle.xOffsetRatio;
}

export function t2BasementShopCenter(centerX:number,centerZ:number,terminalWidth:number,shop:typeof T2_BASEMENT_LAYOUT.shops[number]){
 const aisleX=t2BasementAisleX(centerX,terminalWidth),frontX=aisleX+shop.side*T2_BASEMENT_LAYOUT.aisle.width/2;
 return {x:frontX+shop.side*shop.depth/2,z:centerZ+shop.zOffset,frontX};
}

export function t2StructuralColumnCenters(centerX:number,centerZ:number,width:number,depth:number){
 const columns:{x:number;z:number}[]=[];
 for(const side of [-1,1])for(let z=centerZ-depth*.4;z<=centerZ+depth*.4;z+=27.5)columns.push({x:centerX+side*width*.29,z});
 return columns;
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
