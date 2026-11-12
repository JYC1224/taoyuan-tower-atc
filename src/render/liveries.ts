import type {Airline} from '../types';
import {canvasTexture} from './primitives';

// The four original Taiwan liveries keep their bespoke artwork. Twelve frequent
// carriers now use local brand vectors; no web photographs are runtime textures.
const files={evaWord:'eva-wordmark.svg',eva:'eva-symbol.svg',cal:'cal-plum.png',calWord:'cal-wordmark.svg',star:'starlux-symbol.png',starWord:'starlux-wordmark.svg',tiger:'tigerair-brand.svg',airIndiaWord:'air-india-2023.svg',cathayLogo:'cathay-pacific-logo.svg',siaLogo:'singapore-airlines-logo.svg',siaWord:'singapore-airlines-wordmark.svg',siaBird:'singapore-airlines-bird.svg',koreanShort:'korean-air-2025-short.svg',koreanTaegeuk:'korean-air-taegeuk.svg',emiratesGold:'emirates-gold.svg',thaiLogo:'thai-airways-logo.svg',thaiOrchid:'thai-airways-orchid.svg',turkishLogo:'turkish-airlines-2019.svg',jalWord:'japan-airlines-wordmark.svg',jalTsurumaru:'japan-airlines-tsurumaru.svg',airNzLogo:'air-new-zealand-logo.svg',anaLogo:'ana-logo.svg',klmLogo:'klm-logo.svg',peachLogo:'peach-current-logo.svg'} as const;
type Art=keyof typeof files;
const art=new Map<Art,HTMLImageElement>();let ready:Promise<void>|undefined;
export function prepareLiveries(){
 return ready??=Promise.all(Object.entries(files).map(([key,file])=>new Promise<void>((resolve,reject)=>{
  const image=new Image();image.onload=()=>{art.set(key as Art,image);resolve();};image.onerror=()=>reject(new Error('Local airline artwork could not load: '+file));image.src=new URL('assets/liveries/'+file,document.baseURI).href;
 }))).then(()=>{});
}
export function liveryTexture(width:number,height:number,paint:(ctx:CanvasRenderingContext2D)=>void){
 const texture=canvasTexture(width,height,paint);let retired=false;texture.addEventListener('dispose',()=>{retired=true;});
 void prepareLiveries().then(()=>{if(!retired){paint((texture.image as HTMLCanvasElement).getContext('2d')!);texture.needsUpdate=true;}});return texture;
}

type Band='low'|'wave'|'swoosh'|'cheatline'|'slashes'|'tricolor'|'sunset'|'full'|'black'|'tailOnly'|'narrowStripe'|'tailSweep'|'fullBody'|'faceted'|'cathayStripe'|'siaStripe'|'koreanTop';
type TailMark='sunNine'|'maple'|'plum'|'phoenix'|'flag'|'copa'|'brush'|'kapok'|'delta'|'wing'|'geometric'|'bauhinia'|'crane'|'yinYang'|'taegeuk'|'crown'|'kite'|'peach'|'ribbon'|'coral'|'lotus'|'fern'|'orchid'|'sun'|'sunWheel'|'kangaroo'|'lion'|'bird'|'portrait'|'crescent'|'scoot'|'star'|'globe'|'koru'|'chevron'|'mountain'|'airasia'|'wordmark'|'afStripes'|'uaeFlag'|'eastSwallow'|'xiamenEgret'|'bangkok'|'vista'|'busan';
interface Scheme {body:string;belly:string;accent:string;tail:string;tailAccent:string;engine:string;tip:string;band:Band;mark:TailMark;wordmark:string;wordColor:string;tailWord?:string;stripe2?:string;}

// Colors and motifs were matched to current standard aircraft paint schemes.
// Special promotional liveries are intentionally not used as the default fleet paint.
const schemes:Record<string,Scheme>={
 '5J':{body:'#f8f8f4',belly:'#4e9b4b',accent:'#edc63d',tail:'#28723e',tailAccent:'#4e9b4b',engine:'#f5f5f1',tip:'#50a456',band:'wave',mark:'wordmark',wordmark:'CEBU PACIFIC',wordColor:'#278548',tailWord:'CEBU'},
 '7C':{body:'#f8f8f5',belly:'#f47d32',accent:'#f4bb40',tail:'#f37b32',tailAccent:'#e96d2a',engine:'#f5f5f2',tip:'#ef7c30',band:'swoosh',mark:'wordmark',wordmark:'JEJU air',wordColor:'#e96d2a',tailWord:'JEJU'},
 '9G':{body:'#fffdf8',belly:'#f1a044',accent:'#c83e32',tail:'#d94c35',tailAccent:'#f4bd51',engine:'#fffaf2',tip:'#e35337',band:'sunset',mark:'sunNine',wordmark:'SPA',wordColor:'#c83e32'},
 AA:{body:'#dadbd8',belly:'#45566b',accent:'#c94048',tail:'#17487a',tailAccent:'#e14c54',engine:'#e1e2df',tip:'#bd3b48',band:'cheatline',mark:'flag',wordmark:'American',wordColor:'#4f5967'},
 AC:{body:'#f8f8f5',belly:'#aeb3b4',accent:'#c92335',tail:'#161c22',tailAccent:'#e22c3d',engine:'#f2f2ef',tip:'#c72537',band:'low',mark:'maple',wordmark:'AIR CANADA',wordColor:'#14191e'},
 AE:{body:'#fcfaf5',belly:'#a8bbad',accent:'#ba4a54',tail:'#f1f0ec',tailAccent:'#cb6974',engine:'#f3f1ed',tip:'#9a5969',band:'wave',mark:'plum',wordmark:'MANDARIN AIRLINES',wordColor:'#775263'},
 AF:{body:'#f8f9f8',belly:'#123870',accent:'#dc293e',tail:'#172e59',tailAccent:'#d52d42',engine:'#f5f6f4',tip:'#274b82',band:'cheatline',mark:'afStripes',wordmark:'AIRFRANCE',wordColor:'#163766'},
 AI:{body:'#fffdf9',belly:'#d64c35',accent:'#f1a247',tail:'#bd3d35',tailAccent:'#eb9c42',engine:'#f9f6ef',tip:'#ce4938',band:'slashes',mark:'sunWheel',wordmark:'Air India',wordColor:'#b63a36'},
 AK:{body:'#fffdfa',belly:'#cb1f32',accent:'#e63840',tail:'#c91c2d',tailAccent:'#fff9f5',engine:'#f7f6f2',tip:'#c91e31',band:'wave',mark:'airasia',wordmark:'airasia.com',wordColor:'#cb1f32'},
 AS:{body:'#f8f9f7',belly:'#244a70',accent:'#56a1a0',tail:'#102d50',tailAccent:'#8bc6bc',engine:'#f0f2f1',tip:'#1b5279',band:'swoosh',mark:'portrait',wordmark:'Alaska',wordColor:'#183c5d'},
 AV:{body:'#f8f7f4',belly:'#b92539',accent:'#4b5054',tail:'#c92d3d',tailAccent:'#f1efea',engine:'#f4f3ef',tip:'#b72d3c',band:'wave',mark:'bird',wordmark:'avianca',wordColor:'#c22b3c'},
 B7:{body:'#f8f8f5',belly:'#9db984',accent:'#d47a9b',tail:'#f8f7f3',tailAccent:'#dd7f9e',engine:'#f4f4f0',tip:'#749b65',band:'low',mark:'plum',wordmark:'UNI AIR',wordColor:'#526b55'},
 BX:{body:'#f8faf9',belly:'#12639a',accent:'#2db2ac',tail:'#074776',tailAccent:'#43c3b7',engine:'#f5f7f6',tip:'#1474a2',band:'swoosh',mark:'wing',wordmark:'AIR BUSAN',wordColor:'#136792'},
 CA:{body:'#fbfaf6',belly:'#c52032',accent:'#d8ad60',tail:'#b51e2c',tailAccent:'#e3c47a',engine:'#f5f3ee',tip:'#ba2732',band:'low',mark:'phoenix',wordmark:'Air China',wordColor:'#b91f2b'},
 CM:{body:'#f8f9f8',belly:'#b7c5d0',accent:'#1680b4',tail:'#114f82',tailAccent:'#e44c3d',engine:'#f1f3f4',tip:'#1681b5',band:'cheatline',mark:'copa',wordmark:'copa airlines',wordColor:'#1b6594'},
 CX:{body:'#f9faf8',belly:'#006564',accent:'#b3bdaf',tail:'#005653',tailAccent:'#f8f8f3',engine:'#f1f4f1',tip:'#075f5c',band:'swoosh',mark:'brush',wordmark:'Cathay Pacific',wordColor:'#005a57'},
 CZ:{body:'#fafaf7',belly:'#17609b',accent:'#d4524f',tail:'#185f9a',tailAccent:'#e15a55',engine:'#f3f4f1',tip:'#1766a0',band:'wave',mark:'kapok',wordmark:'CHINA SOUTHERN',wordColor:'#1a6095'},
 DL:{body:'#fbfbf9',belly:'#193b68',accent:'#c3313a',tail:'#183b69',tailAccent:'#ca303c',engine:'#f5f5f2',tip:'#244574',band:'cheatline',mark:'delta',wordmark:'DELTA',wordColor:'#193c6b'},
 EK:{body:'#fbfaf6',belly:'#f1eee7',accent:'#00845b',tail:'#f7f5ed',tailAccent:'#f7f5ed',engine:'#f4f2eb',tip:'#b32631',band:'tailOnly',mark:'uaeFlag',wordmark:'Emirates',wordColor:'#c2a45f'},
 EY:{body:'#faf8f2',belly:'#c6a35e',accent:'#b49354',tail:'#8b795f',tailAccent:'#d5b971',engine:'#f3efe4',tip:'#c0a261',band:'wave',mark:'geometric',wordmark:'ETIHAD',wordColor:'#907a55'},
 FD:{body:'#fffdfa',belly:'#cf1e30',accent:'#ed323c',tail:'#c7192d',tailAccent:'#fff7f1',engine:'#f7f5ef',tip:'#cc1f31',band:'wave',mark:'airasia',wordmark:'Thai AirAsia',wordColor:'#c51c2f'},
 GK:{body:'#fbfaf8',belly:'#ef7628',accent:'#242b2f',tail:'#ee7629',tailAccent:'#20262a',engine:'#f5f3ef',tip:'#ed762b',band:'low',mark:'star',wordmark:'Jetstar Japan',wordColor:'#24282c'},
 HB:{body:'#fcfaf5',belly:'#d3b171',accent:'#244c70',tail:'#17456b',tailAccent:'#d5b86a',engine:'#f4f1e7',tip:'#bd9a56',band:'swoosh',mark:'wing',wordmark:'GREATER BAY AIRLINES',wordColor:'#193f62'},
 HO:{body:'#fffdfa',belly:'#9e1d34',accent:'#cf4655',tail:'#a91e35',tailAccent:'#d1a66a',engine:'#f6f1ee',tip:'#a92338',band:'wave',mark:'plum',wordmark:'JUNEYAO AIR',wordColor:'#a52239'},
 HU:{body:'#fffdf8',belly:'#b61f35',accent:'#d6a548',tail:'#b52036',tailAccent:'#e4c174',engine:'#f5f2e9',tip:'#b52236',band:'slashes',mark:'phoenix',wordmark:'HAINAN AIRLINES',wordColor:'#ae2035'},
 HX:{body:'#faf9f7',belly:'#7d2939',accent:'#c33c53',tail:'#8f2037',tailAccent:'#e6d4c8',engine:'#f3f1ee',tip:'#923044',band:'wave',mark:'bauhinia',wordmark:'HONG KONG AIRLINES',wordColor:'#8a283e'},
 JL:{body:'#fffdfa',belly:'#fffdfa',accent:'#c32230',tail:'#fffdfa',tailAccent:'#c82032',engine:'#f5f3ef',tip:'#c41e2d',band:'low',mark:'crane',wordmark:'JAPAN AIRLINES',wordColor:'#b51f2b'},
 KE:{body:'#e8f1f4',belly:'#bad7e2',accent:'#9bc5d6',tail:'#174c73',tailAccent:'#174c73',engine:'#e5eef0',tip:'#5b92aa',band:'wave',mark:'taegeuk',wordmark:'KOREAN',wordColor:'#174d73'},
 KL:{body:'#fbfbf9',belly:'#1692c4',accent:'#164a81',tail:'#00a1e4',tailAccent:'#f7f7f4',engine:'#f4f5f3',tip:'#108cc0',band:'cheatline',mark:'crown',wordmark:'KLM',wordColor:'#00a1e4'},
 LJ:{body:'#fffefa',belly:'#83ad3c',accent:'#bdd140',tail:'#9fbd39',tailAccent:'#f7f5ed',engine:'#f5f3ed',tip:'#87a936',band:'swoosh',mark:'wing',wordmark:'JIN AIR',wordColor:'#6f9633'},
 LO:{body:'#fbfaf8',belly:'#253e74',accent:'#5180ad',tail:'#102d60',tailAccent:'#f6f6f1',engine:'#f2f2ef',tip:'#274879',band:'cheatline',mark:'crane',wordmark:'LOT',wordColor:'#213b70'},
 MF:{body:'#fafaf7',belly:'#2788bb',accent:'#bf9b55',tail:'#1473a5',tailAccent:'#f1d47e',engine:'#f4f4f0',tip:'#2487b2',band:'wave',mark:'bird',wordmark:'XIAMENAIR',wordColor:'#176c9b'},
 MH:{body:'#fffdfa',belly:'#224982',accent:'#cc2e38',tail:'#173c6a',tailAccent:'#d84448',engine:'#f6f3ee',tip:'#244b7d',band:'slashes',mark:'kite',wordmark:'MALAYSIA AIRLINES',wordColor:'#183e6d'},
 MM:{body:'#fffafa',belly:'#d8297a',accent:'#f1a9c6',tail:'#d71b75',tailAccent:'#ffe8f1',engine:'#f7f2f4',tip:'#d3287a',band:'wave',mark:'peach',wordmark:'Peach',wordColor:'#cf2775'},
 MU:{body:'#fafaf7',belly:'#2573a4',accent:'#bb3340',tail:'#165d90',tailAccent:'#cf3e49',engine:'#f4f4f1',tip:'#2877a3',band:'wave',mark:'ribbon',wordmark:'CHINA EASTERN',wordColor:'#1f6392'},
 NH:{body:'#fbfbf9',belly:'#1e5a90',accent:'#98b9cc',tail:'#144f86',tailAccent:'#f9faf7',engine:'#f5f6f4',tip:'#225e91',band:'cheatline',mark:'wordmark',wordmark:'ANA',wordColor:'#164f83',tailWord:'ANA'},
 NU:{body:'#fffdf7',belly:'#088aa0',accent:'#e2ad3a',tail:'#0d778e',tailAccent:'#f2bf45',engine:'#f3f3ee',tip:'#0a8799',band:'slashes',mark:'coral',wordmark:'JAPAN TRANSOCEAN AIR',wordColor:'#087889'},
 NX:{body:'#fbf9f5',belly:'#8b1f38',accent:'#c8a156',tail:'#791b34',tailAccent:'#e1c378',engine:'#f4f0e8',tip:'#861d37',band:'wave',mark:'lotus',wordmark:'AIR MACAU',wordColor:'#8d203b'},
 NZ:{body:'#fafaf8',belly:'#25282b',accent:'#9ca4a4',tail:'#111518',tailAccent:'#f3f4f1',engine:'#f3f4f2',tip:'#202427',band:'black',mark:'koru',wordmark:'AIR NEW ZEALAND',wordColor:'#171a1d'},
 OZ:{body:'#fcfaf6',belly:'#9b2434',accent:'#d94c42',tail:'#8e1e30',tailAccent:'#f0be56',engine:'#f3eee7',tip:'#9e2638',band:'slashes',mark:'ribbon',wordmark:'ASIANA AIRLINES',wordColor:'#82243a'},
 PG:{body:'#fffdf8',belly:'#187ab0',accent:'#e14a43',tail:'#145c91',tailAccent:'#e7c847',engine:'#f3f4ee',tip:'#267bac',band:'wave',mark:'copa',wordmark:'BANGKOK AIRWAYS',wordColor:'#1c679a'},
 PR:{body:'#fbfaf7',belly:'#164786',accent:'#cc3438',tail:'#174879',tailAccent:'#cf363c',engine:'#f4f3ef',tip:'#194a80',band:'slashes',mark:'sun',wordmark:'PHILIPPINE AIRLINES',wordColor:'#17457d'},
 QF:{body:'#fffdfa',belly:'#bc2028',accent:'#da4241',tail:'#c51f28',tailAccent:'#fffaf7',engine:'#f6f3ef',tip:'#be242d',band:'wave',mark:'kangaroo',wordmark:'QANTAS',wordColor:'#b71e28'},
 RF:{body:'#fbfaf8',belly:'#34577e',accent:'#c33745',tail:'#173e67',tailAccent:'#c73843',engine:'#f4f3ef',tip:'#2c5077',band:'slashes',mark:'chevron',wordmark:'AERO K',wordColor:'#1a416b'},
 SL:{body:'#fffdfa',belly:'#be2634',accent:'#e0a441',tail:'#c42432',tailAccent:'#fff9f2',engine:'#f5f2ed',tip:'#c42b39',band:'wave',mark:'lion',wordmark:'THAI LION AIR',wordColor:'#b62331'},
 SQ:{body:'#fbfaf6',belly:'#b6a167',accent:'#183d68',tail:'#102c4f',tailAccent:'#d4bc7b',engine:'#f1eee5',tip:'#163b69',band:'cheatline',mark:'bird',wordmark:'SINGAPORE AIRLINES',wordColor:'#173c66'},
 TG:{body:'#fbfaf8',belly:'#532d69',accent:'#be9c48',tail:'#4c255f',tailAccent:'#d3b24e',engine:'#f3f0e9',tip:'#57336b',band:'wave',mark:'orchid',wordmark:'THAI',wordColor:'#5a2c69'},
 TK:{body:'#fffdfa',belly:'#b9142b',accent:'#d92739',tail:'#c3142b',tailAccent:'#fffaf8',engine:'#f6f2ee',tip:'#b9192e',band:'low',mark:'crescent',wordmark:'TURKISH AIRLINES',wordColor:'#be1b30'},
 TR:{body:'#fffdf7',belly:'#e8bd22',accent:'#21282c',tail:'#171b1e',tailAccent:'#efc52b',engine:'#f5f1de',tip:'#e2bd2a',band:'sunset',mark:'scoot',wordmark:'scoot',wordColor:'#25292b'},
 TW:{body:'#fffdfa',belly:'#b51d30',accent:'#e34047',tail:'#c31e32',tailAccent:'#fff8f5',engine:'#f4f2ef',tip:'#bc2032',band:'slashes',mark:'star',wordmark:'t’way AIR',wordColor:'#be1e33'},
 UA:{body:'#fbfbf9',belly:'#134c86',accent:'#5c9fca',tail:'#123d73',tailAccent:'#58a1ca',engine:'#f4f5f3',tip:'#174b81',band:'wave',mark:'globe',wordmark:'UNITED',wordColor:'#164b80'},
 UO:{body:'#fffafd',belly:'#ae287c',accent:'#e675b7',tail:'#9f1d72',tailAccent:'#f0b7d7',engine:'#f7f0f4',tip:'#b22b80',band:'swoosh',mark:'ribbon',wordmark:'HK EXPRESS',wordColor:'#aa267b'},
 VJ:{body:'#fffdfa',belly:'#d91e2b',accent:'#f5c329',tail:'#db202c',tailAccent:'#f5c329',engine:'#f5f2e9',tip:'#d82430',band:'wave',mark:'star',wordmark:'vietjetair.com',wordColor:'#ce1e2a'},
 VN:{body:'#fbfaf6',belly:'#efe8d7',accent:'#c7a958',tail:'#173e72',tailAccent:'#e1be61',engine:'#f3f0e7',tip:'#1b4c7e',band:'wave',mark:'lotus',wordmark:'VIETNAM AIRLINES',wordColor:'#12676b'},
 VZ:{body:'#fffdf8',belly:'#cc2732',accent:'#f3c744',tail:'#d32330',tailAccent:'#f4cb46',engine:'#f5f1e6',tip:'#d12d37',band:'slashes',mark:'star',wordmark:'THAI VIETJET AIR',wordColor:'#c32833'},
 Z2:{body:'#fffdfa',belly:'#c82131',accent:'#e43140',tail:'#c71f30',tailAccent:'#fff8f5',engine:'#f5f3ef',tip:'#c82032',band:'wave',mark:'airasia',wordmark:'airasia.com',wordColor:'#c51e30'},
 ZE:{body:'#fffdf9',belly:'#c72a38',accent:'#e57439',tail:'#cf2b3a',tailAccent:'#f3a441',engine:'#f5f1ea',tip:'#c62b39',band:'slashes',mark:'star',wordmark:'EASTAR JET',wordColor:'#c32435'},
 ZH:{body:'#fffdf8',belly:'#c02a37',accent:'#183f70',tail:'#b82331',tailAccent:'#e1bc69',engine:'#f4f1e9',tip:'#bd2937',band:'wave',mark:'phoenix',wordmark:'SHENZHEN AIRLINES',wordColor:'#b72332'},
};

// Standard-fleet paint layouts reviewed against current airline fleet imagery.
// The four Taiwanese primary carriers keep their existing bespoke local art.
const sideLayout:Record<string,Band>={
 '5J':'wave','7C':'tailOnly','9G':'sunset',AA:'cheatline',AC:'tailOnly',AE:'tailOnly',AF:'narrowStripe',AI:'narrowStripe',AK:'low',AS:'tailOnly',AV:'narrowStripe',B7:'tailOnly',BX:'tailSweep',CA:'narrowStripe',CM:'narrowStripe',CX:'narrowStripe',CZ:'narrowStripe',DL:'tailSweep',EK:'slashes',EY:'faceted',FD:'low',GK:'tailOnly',HB:'tailOnly',HO:'tailOnly',HU:'tailOnly',HX:'tailOnly',JL:'tailOnly',KE:'tailOnly',KL:'narrowStripe',LJ:'tailOnly',LO:'narrowStripe',MF:'tailOnly',MH:'tailSweep',MM:'tailOnly',MU:'tailOnly',NH:'tailOnly',NU:'narrowStripe',NX:'narrowStripe',NZ:'tailOnly',OZ:'tailOnly',PG:'tailOnly',PR:'tailSweep',QF:'tailSweep',RF:'tailOnly',SL:'narrowStripe',SQ:'narrowStripe',TG:'narrowStripe',TK:'narrowStripe',TR:'tailOnly',TW:'tailOnly',UA:'tailSweep',UO:'tailOnly',VJ:'low',VN:'tailSweep',VZ:'low',Z2:'low',ZE:'tailOnly',ZH:'tailOnly',
};
for(const [id,band] of Object.entries(sideLayout))if(schemes[id])schemes[id].band=band;

// Corrections based on current standard aircraft photos and airline identity pages.
// Keeping this separate makes the researched deviations from the old generic bands auditable.
const researchedPaint:Record<string,Partial<Scheme>>={
 '5J':{belly:'#39964b',accent:'#f3ca38',tail:'#287640',tailAccent:'#f5d04e',mark:'sunNine'},
 '7C':{body:'#fbfaf7',belly:'#e7e3dc',accent:'#ef762c',tail:'#f47a31',tailAccent:'#fff9ee',engine:'#f7f5ef',tip:'#ef762c',mark:'wordmark'},
 '9G':{body:'#fffdf8',belly:'#f2a241',accent:'#c83e32',tail:'#d94c35',tailAccent:'#f4bd51',mark:'sunNine'},
 AC:{body:'#f8f8f5',belly:'#9ca2a5',accent:'#c92335',tail:'#151a1e',tailAccent:'#e22c3d',engine:'#f2f2ef',mark:'maple'},
 AF:{body:'#fafaf8',belly:'#d7dce2',accent:'#d3263f',tail:'#182f5c',tailAccent:'#f4f4f0',engine:'#f5f6f4',mark:'afStripes',stripe2:'#203d69'},
 AI:{body:'#fbfaf8',belly:'#542039',accent:'#cfad68',tail:'#4e263f',tailAccent:'#e1c27b',engine:'#a91c35',tip:'#bb2336',band:'faceted',mark:'vista',wordmark:'AIR INDIA',wordColor:'#b21e36',stripe2:'#a61f3d'},
 AK:{body:'#faf8f5',belly:'#c8202d',accent:'#f7f4ed',tail:'#c8202d',tailAccent:'#fffaf4',engine:'#c8202d',tip:'#c8202d',mark:'airasia',wordmark:'airasia.com',wordColor:'#c8202d'},
 B7:{body:'#f9faf7',belly:'#2d8050',accent:'#e5ac42',tail:'#2f8050',tailAccent:'#f5f4ef',engine:'#f4f4f0',tip:'#2f8050',mark:'globe',wordmark:'UNI AIR',wordColor:'#2f8050'},
 BX:{body:'#fafaf8',belly:'#dce5e7',accent:'#25aaa8',tail:'#08709b',tailAccent:'#e9f5f3',engine:'#f5f6f3',mark:'busan'},
 CA:{body:'#fbfaf8',belly:'#d6dde0',accent:'#b92230',tail:'#f7f5f0',tailAccent:'#c32232',engine:'#f3f3ef',tip:'#b92230',band:'narrowStripe',mark:'phoenix',wordmark:'AIR CHINA',wordColor:'#b92230'},
 CX:{body:'#fbfaf8',belly:'#d3d6d2',accent:'#005d63',tail:'#00645f',tailAccent:'#f4f4ee',engine:'#eff1ee',band:'cathayStripe',mark:'brush',wordmark:'Cathay Pacific',wordColor:'#005d59'},
 EK:{band:'tailOnly',wordColor:'#c2a45f'},
 CZ:{body:'#fbfaf8',belly:'#d9e0e2',accent:'#d34a46',tail:'#07599a',tailAccent:'#e45750',engine:'#f2f3f0',tip:'#07599a',mark:'kapok',wordmark:'CHINA SOUTHERN',wordColor:'#135c98',stripe2:'#07599a'},
 FD:{body:'#fbfaf7',belly:'#c71d31',accent:'#f5f1e9',tail:'#c91d30',tailAccent:'#fff8f1',engine:'#c91d30',tip:'#c91d30',mark:'airasia',wordmark:'THAI AirAsia',wordColor:'#c51d30'},
 HO:{body:'#fffdfa',belly:'#b21f34',accent:'#d9b565',tail:'#ad2036',tailAccent:'#e3c77b',engine:'#a91f35',tip:'#a92338',mark:'ribbon',wordmark:'JUNEYAO AIR',wordColor:'#a52239'},
 JL:{body:'#fffdfa',belly:'#e2ded8',accent:'#c32230',tail:'#fffdfa',tailAccent:'#c82032',engine:'#f5f3ef',tip:'#c41e2d',mark:'crane',wordmark:'JAPAN AIRLINES',wordColor:'#b51f2b'},
 KE:{body:'#c8dfe8',belly:'#f5f7f5',accent:'#41718d',tail:'#86b0c1',tailAccent:'#b8d3dc',engine:'#e5eef0',tip:'#5b92aa',band:'koreanTop',mark:'taegeuk',wordmark:'KOREAN',wordColor:'#123b67'},
 MF:{body:'#fbfaf8',belly:'#e1e4e2',accent:'#c2a25d',tail:'#145984',tailAccent:'#e8c875',engine:'#f3f4f0',mark:'xiamenEgret',wordmark:'XIAMEN AIR',wordColor:'#145984'},
 MU:{body:'#fbfaf8',belly:'#dfe2e0',accent:'#ba2837',tail:'#fbfaf8',tailAccent:'#174f8a',engine:'#f2f2ef',tip:'#225b91',mark:'eastSwallow',wordmark:'CHINA EASTERN',wordColor:'#175387'},
 NH:{body:'#fbfbf9',belly:'#dce2e3',accent:'#0f4e8a',tail:'#124e85',tailAccent:'#f7f8f4',engine:'#f4f5f3',mark:'wordmark',wordmark:'ANA',wordColor:'#164f83',tailWord:'ANA'},
 PG:{body:'#fffdf8',belly:'#d7e3e7',accent:'#ed8b35',tail:'#145c91',tailAccent:'#f1c951',engine:'#f3f4ee',tip:'#267bac',mark:'bangkok',wordmark:'BANGKOK AIRWAYS',wordColor:'#1c679a'},
 SQ:{body:'#fbfaf8',belly:'#e7e7e2',accent:'#d3b264',tail:'#102d50',tailAccent:'#d8bd7d',engine:'#163b67',tip:'#163b69',band:'siaStripe',mark:'bird',wordmark:'SINGAPORE AIRLINES',wordColor:'#173c66',stripe2:'#163b67'},
 TR:{body:'#fbfaf7',belly:'#e9c428',accent:'#25292d',tail:'#171b1e',tailAccent:'#efc52b',engine:'#262a2d',tip:'#e2bd2a',mark:'scoot'},
 TW:{body:'#fffdfa',belly:'#d8d9d8',accent:'#c72b3b',tail:'#c72b3b',tailAccent:'#fff8f5',engine:'#f4f2ef',tip:'#bc2032',mark:'wordmark',wordmark:"t'way AIR",wordColor:'#be1e33',tailWord:"t'way"},
 'Z2':{body:'#faf8f5',belly:'#c8202d',accent:'#f6f2eb',tail:'#c8202d',tailAccent:'#fffaf4',engine:'#c8202d',tip:'#c8202d',mark:'airasia',wordmark:'airasia.com',wordColor:'#c8202d'},
};
for(const [id,paint] of Object.entries(researchedPaint))Object.assign(schemes[id],paint);

const palettes:Record<string,{body:string;belly:string;engine:string;tip:string}>={
 EVA:{body:'#f1f3f1',belly:'#008b48',engine:'#e7e9e8',tip:'#008b48'},
 CAL:{body:'#f4f4f1',belly:'#bec9da',engine:'#e7e9e8',tip:'#f1f2ef'},
 SJX:{body:'#f3f0e8',belly:'#292d36',engine:'#30343c',tip:'#2d3037'},
 TTW:{body:'#f4f4f1',belly:'#d6d9d8',engine:'#f7ae1d',tip:'#f7ae1d'}
};
export const liveryColors=(airline:Airline)=>palettes[airline.id]??(schemes[airline.id]?{body:schemes[airline.id].body,belly:schemes[airline.id].belly,engine:schemes[airline.id].engine,tip:schemes[airline.id].tip}:{body:'#eef0ef',belly:airline.color,engine:'#e7e9e8',tip:airline.color});

function image(ctx:CanvasRenderingContext2D,key:Art,x:number,y:number,w:number,h:number,mirror=false,crop?:[number,number,number,number]){
 const source=art.get(key);if(!source)return;ctx.save();if(mirror){ctx.translate(x+w,y);ctx.scale(-1,1);x=0;y=0;}
 if(crop)ctx.drawImage(source,...crop,x,y,w,h);else ctx.drawImage(source,x,y,w,h);ctx.restore();
}
function imageFit(ctx:CanvasRenderingContext2D,key:Art,x:number,y:number,maxW:number,maxH:number,mirror=false,crop?:[number,number,number,number]){
 const source=art.get(key);if(!source)return;const sw=crop?.[2]??source.naturalWidth,sh=crop?.[3]??source.naturalHeight,scale=Math.min(maxW/sw,maxH/sh),w=sw*scale,h=sh*scale;
 image(ctx,key,x+(maxW-w)/2,y+(maxH-h)/2,w,h,mirror,crop);
}
function customSide(ctx:CanvasRenderingContext2D,airline:Airline,W:number){
 if(airline.id==='EVA'){
  ctx.beginPath();ctx.moveTo(0,345);ctx.bezierCurveTo(W*.22,326,W*.44,325,W*.61,303);ctx.bezierCurveTo(W*.77,283,W*.82,157,W,105);ctx.lineTo(W,512);ctx.lineTo(0,512);ctx.closePath();ctx.fillStyle='#008b48';ctx.fill();
  ctx.beginPath();ctx.moveTo(0,345);ctx.bezierCurveTo(W*.22,326,W*.44,325,W*.61,303);ctx.bezierCurveTo(W*.77,283,W*.82,157,W,105);ctx.strokeStyle='#ee8d21';ctx.lineWidth=8;ctx.stroke();
 }else if(airline.id==='SJX'){
  ctx.fillStyle='#b08b63';ctx.beginPath();ctx.moveTo(0,319);ctx.bezierCurveTo(W*.16,286,W*.35,336,W*.59,354);ctx.bezierCurveTo(W*.8,370,W*.91,325,W,285);ctx.lineTo(W,319);ctx.bezierCurveTo(W*.86,370,W*.76,398,W*.57,380);ctx.bezierCurveTo(W*.35,363,W*.15,316,0,346);ctx.closePath();ctx.fill();
  ctx.fillStyle='#292d36';ctx.beginPath();ctx.moveTo(0,367);ctx.bezierCurveTo(W*.15,339,W*.39,384,W*.59,398);ctx.bezierCurveTo(W*.81,415,W*.93,357,W,334);ctx.lineTo(W,512);ctx.lineTo(0,512);ctx.closePath();ctx.fill();
 }else{ctx.fillStyle=liveryColors(airline).belly;ctx.fillRect(0,370,W,142);}
}
function channels(hex:string):[number,number,number]{const value=hex.replace('#','');return value.length===6?[parseInt(value.slice(0,2),16),parseInt(value.slice(2,4),16),parseInt(value.slice(4,6),16)]:[128,128,128];}
function tint(hex:string,amount:number){const c=channels(hex);return '#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v+(amount>=0?(255-v)*amount:-v*-amount)))).toString(16).padStart(2,'0')).join('');}
function rgba(hex:string,alpha:number){const [r,g,b]=channels(hex);return `rgba(${r},${g},${b},${alpha})`;}
function shadeFill(ctx:CanvasRenderingContext2D,color:string,y0:number,y1:number){const g=ctx.createLinearGradient(0,y0,0,y1);g.addColorStop(0,tint(color,.12));g.addColorStop(.22,tint(color,.035));g.addColorStop(.72,color);g.addColorStop(1,tint(color,-.10));ctx.fillStyle=g;}
function waveBand(ctx:CanvasRenderingContext2D,W:number,color:string,top:number,tailY:number){ctx.beginPath();ctx.moveTo(0,top);ctx.bezierCurveTo(W*.22,top-12,W*.43,top+12,W*.60,top-18);ctx.bezierCurveTo(W*.78,top-45,W*.85,tailY+32,W,tailY);ctx.lineTo(W,512);ctx.lineTo(0,512);ctx.closePath();shadeFill(ctx,color,top,512);ctx.fill();}
function paintTailRoot(ctx:CanvasRenderingContext2D,W:number,s:Scheme){
 const g=ctx.createLinearGradient(W*.58,0,W,0);g.addColorStop(0,rgba(s.tail,0));g.addColorStop(.34,rgba(s.tail,.48));g.addColorStop(1,rgba(s.tail,.96));
 ctx.beginPath();ctx.moveTo(W*.57,512);ctx.bezierCurveTo(W*.76,492,W*.87,410,W,260);ctx.lineTo(W,356);ctx.bezierCurveTo(W*.88,453,W*.75,501,W*.57,512);ctx.closePath();ctx.fillStyle=g;ctx.fill();
}
function paintSideFinish(ctx:CanvasRenderingContext2D,W:number,H:number){
 for(const y of [0,H/2]){ctx.save();ctx.beginPath();ctx.rect(0,y,W,H/2);ctx.clip();const g=ctx.createLinearGradient(0,y,0,y+H/2);g.addColorStop(0,'rgba(255,255,255,.20)');g.addColorStop(.20,'rgba(255,255,255,.045)');g.addColorStop(.54,'rgba(13,25,31,.025)');g.addColorStop(.76,'rgba(255,255,255,.07)');g.addColorStop(1,'rgba(0,0,0,.075)');ctx.globalCompositeOperation='soft-light';ctx.fillStyle=g;ctx.fillRect(0,y,W,H/2);ctx.restore();}
}
function schemeSide(ctx:CanvasRenderingContext2D,W:number,s:Scheme){
 const low=()=>{shadeFill(ctx,s.belly,370,512);ctx.fillRect(0,370,W,142);};
 switch(s.band){
  case 'tailOnly':break;
  case 'cathayStripe':{
   shadeFill(ctx,s.belly,438,512);ctx.fillRect(0,438,W,74);
   ctx.fillStyle=s.accent;ctx.fillRect(0,419,W,7);
   ctx.fillStyle=rgba(s.accent,.78);ctx.fillRect(0,431,W,3);break;
  }
  case 'siaStripe':{
   shadeFill(ctx,s.belly,451,512);ctx.fillRect(0,451,W,61);
   ctx.beginPath();ctx.moveTo(0,395);ctx.bezierCurveTo(W*.32,394,W*.59,398,W*.76,388);ctx.bezierCurveTo(W*.89,380,W*.96,364,W,350);ctx.lineTo(W,367);ctx.bezierCurveTo(W*.90,389,W*.81,401,W*.75,404);ctx.bezierCurveTo(W*.54,414,W*.31,408,0,409);ctx.closePath();shadeFill(ctx,s.stripe2??'#163b67',350,414);ctx.fill();
   ctx.beginPath();ctx.moveTo(0,410);ctx.bezierCurveTo(W*.32,409,W*.60,414,W*.77,403);ctx.bezierCurveTo(W*.90,395,W*.97,379,W,367);ctx.lineTo(W,375);ctx.bezierCurveTo(W*.91,397,W*.82,410,W*.76,412);ctx.bezierCurveTo(W*.53,424,W*.30,418,0,417);ctx.closePath();ctx.fillStyle=s.accent;ctx.fill();break;
  }
  case 'koreanTop':{
   const blue=ctx.createLinearGradient(0,0,0,424);blue.addColorStop(0,'#e1eef2');blue.addColorStop(.18,'#c9e0e8');blue.addColorStop(.58,'#b7d4df');blue.addColorStop(1,'#9fc5d3');
   ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W,0);ctx.lineTo(W,347);ctx.bezierCurveTo(W*.88,360,W*.83,386,W*.68,395);ctx.bezierCurveTo(W*.47,407,W*.25,396,0,401);ctx.closePath();ctx.fillStyle=blue;ctx.fill();
   ctx.beginPath();ctx.moveTo(0,401);ctx.bezierCurveTo(W*.25,396,W*.47,407,W*.68,395);ctx.bezierCurveTo(W*.83,386,W*.88,360,W,347);ctx.lineTo(W,512);ctx.lineTo(0,512);ctx.closePath();shadeFill(ctx,s.belly,347,512);ctx.fill();break;
  }
  case 'narrowStripe':{
   shadeFill(ctx,s.belly,438,512);ctx.fillRect(0,438,W,74);
   // A restrained classic cheatline, rising slightly into the rear fuselage.
   ctx.beginPath();ctx.moveTo(0,392);ctx.bezierCurveTo(W*.35,394,W*.55,397,W*.72,387);ctx.bezierCurveTo(W*.84,379,W*.93,366,W,352);ctx.lineTo(W,369);ctx.bezierCurveTo(W*.9,386,W*.82,400,W*.70,406);ctx.bezierCurveTo(W*.48,414,W*.27,407,0,405);ctx.closePath();shadeFill(ctx,s.accent,352,414);ctx.fill();
   ctx.beginPath();ctx.moveTo(0,411);ctx.bezierCurveTo(W*.38,414,W*.59,418,W*.75,406);ctx.bezierCurveTo(W*.88,397,W*.96,382,W,370);ctx.lineTo(W,376);ctx.bezierCurveTo(W*.88,404,W*.80,414,W*.74,418);ctx.bezierCurveTo(W*.52,432,W*.30,420,0,417);ctx.closePath();ctx.fillStyle=rgba(s.body,.88);ctx.fill();
   if(s.stripe2){ctx.beginPath();ctx.moveTo(0,427);ctx.bezierCurveTo(W*.36,429,W*.57,433,W*.74,421);ctx.bezierCurveTo(W*.88,411,W*.96,395,W,383);ctx.strokeStyle=s.stripe2;ctx.lineWidth=7;ctx.stroke();}break;
  }
  case 'tailSweep':{
   shadeFill(ctx,s.belly,440,512);ctx.fillRect(0,440,W,72);
   ctx.beginPath();ctx.moveTo(W*.36,391);ctx.bezierCurveTo(W*.58,389,W*.77,361,W,322);ctx.lineTo(W,351);ctx.bezierCurveTo(W*.78,394,W*.60,424,W*.36,418);ctx.closePath();shadeFill(ctx,s.belly,322,418);ctx.fill();
   ctx.beginPath();ctx.moveTo(W*.43,389);ctx.bezierCurveTo(W*.64,382,W*.82,347,W,309);ctx.lineTo(W,321);ctx.bezierCurveTo(W*.80,366,W*.63,400,W*.43,402);ctx.closePath();shadeFill(ctx,s.accent,309,402);ctx.fill();break;
  }
  case 'fullBody':ctx.fillStyle=s.belly;ctx.fillRect(0,0,W,512);break;
  case 'faceted':{
   if(s.mark==='vista'){
    ctx.beginPath();ctx.moveTo(0,422);ctx.bezierCurveTo(W*.27,424,W*.52,438,W*.68,421);ctx.bezierCurveTo(W*.82,406,W*.91,374,W,344);ctx.lineTo(W,512);ctx.lineTo(0,512);ctx.closePath();shadeFill(ctx,s.belly,344,512);ctx.fill();
    ctx.beginPath();ctx.moveTo(0,410);ctx.bezierCurveTo(W*.29,413,W*.55,427,W*.71,409);ctx.bezierCurveTo(W*.84,395,W*.93,364,W,336);ctx.strokeStyle=s.accent;ctx.lineWidth=10;ctx.stroke();
    ctx.beginPath();ctx.moveTo(W*.67,420);ctx.bezierCurveTo(W*.80,405,W*.91,371,W,340);ctx.lineTo(W,365);ctx.bezierCurveTo(W*.91,394,W*.83,424,W*.73,436);ctx.closePath();ctx.fillStyle=rgba(s.stripe2??'#a61f3d',.82);ctx.fill();
   }else{
    low();const g=ctx.createLinearGradient(W*.57,0,W,0);g.addColorStop(0,rgba(s.accent,0));g.addColorStop(.35,rgba(s.accent,.40));g.addColorStop(1,rgba(s.tailAccent,.68));ctx.fillStyle=g;ctx.fillRect(W*.56,275,W*.44,237);
    ctx.save();ctx.beginPath();ctx.rect(W*.58,270,W*.42,242);ctx.clip();ctx.globalAlpha=.55;
    for(let row=0;row<6;row++)for(let col=0;col<7;col++){const x=W*.59+col*W*.061+(row%2)*W*.028,y=290+row*39;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+W*.035,y+8);ctx.lineTo(x+W*.054,y+23);ctx.lineTo(x+W*.020,y+33);ctx.lineTo(x-W*.005,y+18);ctx.closePath();ctx.fillStyle=(row+col)%2?s.accent:s.tailAccent;ctx.fill();}
    ctx.restore();
   }break;
  }
  case 'low':low();shadeFill(ctx,s.accent,368,392);ctx.fillRect(0,373,W,18);break;
  case 'wave':waveBand(ctx,W,s.belly,383,318);ctx.beginPath();ctx.moveTo(W*.39,383);ctx.bezierCurveTo(W*.62,376,W*.81,341,W,301);ctx.lineTo(W,327);ctx.bezierCurveTo(W*.79,372,W*.60,398,W*.39,401);ctx.closePath();shadeFill(ctx,s.accent,301,401);ctx.fill();break;
  case 'swoosh':low();ctx.beginPath();ctx.moveTo(W*.37,380);ctx.bezierCurveTo(W*.60,385,W*.77,320,W,277);ctx.lineTo(W,315);ctx.bezierCurveTo(W*.78,367,W*.65,408,W*.38,403);ctx.closePath();shadeFill(ctx,s.accent,277,408);ctx.fill();ctx.beginPath();ctx.moveTo(W*.55,391);ctx.bezierCurveTo(W*.72,388,W*.86,348,W,316);ctx.lineTo(W,335);ctx.bezierCurveTo(W*.84,371,W*.71,405,W*.55,410);ctx.closePath();ctx.fillStyle=rgba(s.tailAccent,.48);ctx.fill();break;
  case 'cheatline':shadeFill(ctx,s.belly,352,422);ctx.fillRect(0,352,W,70);shadeFill(ctx,s.accent,346,374);ctx.fillRect(0,350,W,24);ctx.fillStyle=rgba(s.body,.88);ctx.fillRect(0,378,W,9);ctx.fillRect(0,416,W,11);break;
  case 'slashes':low();for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(W*(.64+i*.065),370);ctx.bezierCurveTo(W*(.68+i*.06),389,W*(.83+i*.04),476,W*(.90+i*.03),512);ctx.lineTo(W*(.84+i*.03),512);ctx.bezierCurveTo(W*(.77+i*.04),454,W*(.68+i*.06),394,W*(.64+i*.065),370);ctx.closePath();shadeFill(ctx,i%2?s.accent:s.tail,370,512);ctx.fill();}break;
  case 'tricolor':low();for(let i=0;i<3;i++){shadeFill(ctx,[s.tail,s.accent,s.belly][i],300,512);ctx.fillRect(W*(.69+i*.085),300,Math.max(48,W*.047),212);}break;
  case 'sunset':{const g=ctx.createLinearGradient(0,360,0,510);g.addColorStop(0,s.accent);g.addColorStop(.38,s.belly);g.addColorStop(1,s.tail);ctx.fillStyle=g;ctx.fillRect(0,372,W,140);ctx.beginPath();ctx.moveTo(W*.62,374);ctx.bezierCurveTo(W*.77,360,W*.9,330,W,305);ctx.lineTo(W,323);ctx.bezierCurveTo(W*.9,360,W*.78,386,W*.62,391);ctx.closePath();ctx.fillStyle=s.accent;ctx.fill();break;}
  case 'full':shadeFill(ctx,s.belly,320,512);ctx.fillRect(0,320,W,192);ctx.beginPath();ctx.moveTo(W*.24,330);ctx.bezierCurveTo(W*.52,346,W*.78,326,W,289);ctx.lineTo(W,312);ctx.bezierCurveTo(W*.76,351,W*.49,369,W*.24,350);ctx.closePath();shadeFill(ctx,s.accent,289,369);ctx.fill();break;
  case 'black':shadeFill(ctx,s.belly,285,512);ctx.fillRect(0,285,W,227);ctx.beginPath();ctx.moveTo(0,286);ctx.bezierCurveTo(W*.31,306,W*.65,279,W,236);ctx.lineTo(W,264);ctx.bezierCurveTo(W*.65,311,W*.31,338,0,316);ctx.closePath();shadeFill(ctx,s.accent,236,338);ctx.fill();break;
 }
}
export function paintFuselageBase(ctx:CanvasRenderingContext2D,airline:Airline,W:number,H:number){
 ctx.clearRect(0,0,W,H);ctx.fillStyle=liveryColors(airline).body;ctx.fillRect(0,0,W,H);
 const scheme=schemes[airline.id];
 if(scheme){schemeSide(ctx,W,scheme);paintTailRoot(ctx,W,scheme);}else customSide(ctx,airline,W);
 ctx.save();ctx.translate(0,H);ctx.scale(1,-1);if(scheme){schemeSide(ctx,W,scheme);paintTailRoot(ctx,W,scheme);}else customSide(ctx,airline,W);ctx.restore();
 if(scheme)paintSideFinish(ctx,W,H);
}
const textOrFlagMarks=new Set<TailMark>(['wordmark','airasia','scoot','flag','uaeFlag','portrait','afStripes','geometric','yinYang','taegeuk','vista','crescent','fern','kangaroo','mountain','crane','lion']);
const chineseFuselageTitles=new Set(['CA','CZ','HU','HO','MF','MU','NX','ZH','HX','UO']);
const narrowAirlineTitles=new Set(['5J','AA','AF','AI','CA','CM','CZ','DL','EK','EY','HX','JL','KE','KL','LO','MU','NH','NU','NX','PG','PR','QF','SL','SQ','TK','TW','UA','VN','ZH']);
const serifAirlineTitles=new Set(['AS','MH','TG']);
const italicAirlineTitles=new Set(['AS','AV','EK','TR','VJ']);
const trackedAirlineTitles=new Set(['AA','AF','CA','CX','CZ','DL','EY','JL','KE','KL','LO','MU','NH','PR','SQ','TK','VN']);
function paintWordmark(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,airlineId:string){
 const narrow=narrowAirlineTitles.has(airlineId),serif=serifAirlineTitles.has(airlineId),italic=italicAirlineTitles.has(airlineId),tracked=trackedAirlineTitles.has(airlineId);
 const size=text.length>15?84:text.length>10?94:106,weight=serif?600:italic?700:tracked?600:700;
 const family=serif?'Georgia, "Times New Roman", serif':narrow?'"Arial Narrow", Arial, sans-serif':'Arial, Helvetica, sans-serif';
 ctx.save();ctx.font=`${italic?'italic ':''}${weight} ${size}px ${family}`;ctx.textBaseline='middle';ctx.textAlign='left';
 const chars=Array.from(text),gap=tracked?Math.max(2,size*.045):0,total=chars.reduce((sum,char)=>sum+ctx.measureText(char).width,0)+Math.max(0,chars.length-1)*gap,scale=Math.min(1,maxWidth/Math.max(1,total));
 ctx.translate(x,0);ctx.scale(scale,1);let offset=0;for(const char of chars){ctx.fillText(char,offset,y);offset+=ctx.measureText(char).width+gap;}ctx.restore();
}
function visibleEmblemScheme(s:Scheme,body:string):Scheme{
 const a=channels(s.tailAccent),b=channels(body),distance=Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
 return distance>95?s:{...s,tailAccent:s.tail};
}
export function paintFuselageBrand(ctx:CanvasRenderingContext2D,airline:Airline,W:number,mirror:boolean,cargo:boolean){
 if(airline.id==='NZ')paintAirNewZealandFern(ctx,W,mirror);
 if(airline.id==='EVA')image(ctx,'evaWord',W*.245,96,W*.18,W*.18*95/600,mirror);
 else if(airline.id==='CAL')image(ctx,'calWord',W*.19,94,W*.28,W*.28*114/1067,mirror);
 else if(airline.id==='SJX'){
  image(ctx,'starWord',W*.175,78,W*.23,W*.23*16/109,mirror);
  ctx.save();ctx.filter='brightness(0) invert(1)';image(ctx,'starWord',W*.38,375,W*.22,W*.22*16/109,mirror);ctx.restore();
 }else if(airline.id==='TTW')image(ctx,'tiger',W*.20,64,W*.22,W*.22*91/244,mirror);
 else if(airline.id==='AI')imageFit(ctx,'airIndiaWord',W*.20,82,W*.19,116,mirror);
 else if(airline.id==='CX')imageFit(ctx,'cathayLogo',W*.17,84,W*.25,116,mirror);
 else if(airline.id==='SQ')imageFit(ctx,'siaLogo',W*.18,86,W*.25,116,mirror);
 else if(airline.id==='KE')imageFit(ctx,'koreanShort',W*.20,86,W*.20,112,mirror);
 else if(airline.id==='EK')imageFit(ctx,'emiratesGold',W*.12,42,W*.32,215,mirror);
 else if(airline.id==='TG')imageFit(ctx,'thaiLogo',W*.17,72,W*.30,142,mirror);
 else if(airline.id==='TK')imageFit(ctx,'turkishLogo',W*.16,72,W*.29,132,mirror);
 else if(airline.id==='JL')imageFit(ctx,'jalWord',W*.15,100,W*.34,100,mirror);
 else if(airline.id==='NZ')imageFit(ctx,'airNzLogo',W*.16,82,W*.31,116,mirror);
 else if(airline.id==='NH')imageFit(ctx,'anaLogo',W*.18,80,W*.24,112,mirror);
 else if(airline.id==='KL'){
  const source=art.get('klmLogo');if(source){const crop:[number,number,number,number]=[0,source.naturalHeight*.51,source.naturalWidth,source.naturalHeight*.49];imageFit(ctx,'klmLogo',W*.17,92,W*.18,94,mirror,crop);}
 }
 else if(airline.id==='MM')imageFit(ctx,'peachLogo',W*.18,83,W*.24,112,mirror);
 else{
  const s=schemes[airline.id];ctx.save();if(mirror){ctx.translate(W,0);ctx.scale(-1,1);}
  const useEmblem=!!s&&!textOrFlagMarks.has(s.mark)&&airline.id!=='VN',iconX=airline.id==='JL'?W*.16:W*.175,iconY=156;
  if(useEmblem){ctx.save();ctx.translate(iconX,iconY);ctx.scale(.24,.24);ctx.translate(-512,-520);if(airline.id==='JL')paintJapanRoundel(ctx,512,520,276);else if(airline.id==='TG')paintThaiOrchid(ctx,512,520,286);else tailMark(ctx,visibleEmblemScheme(s,liveryColors(airline).body));ctx.restore();}
  const airasia=['AK','FD','Z2'].includes(airline.id),wordmark=s?.wordmark??airline.name.toUpperCase(),titleX=useEmblem?W*.225:W*.19;
  ctx.fillStyle=airasia?'#fffaf4':s?.wordColor??'#48545a';
  if(chineseFuselageTitles.has(airline.id)){
   ctx.save();ctx.font='600 54px "Microsoft YaHei UI", "Noto Sans CJK SC", sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(airline.localName??airline.name,titleX,103,W*.54);ctx.restore();
  }
  paintWordmark(ctx,wordmark,titleX,airasia?427:chineseFuselageTitles.has(airline.id)?171:156,W*.58,airline.id);
  ctx.restore();
 }
 if(airline.id==='VN'){
  ctx.save();if(mirror){ctx.translate(W,0);ctx.scale(-1,1);}
  colorPetal(ctx,W*.80,160,56,7,'#d7b65e','#efe8d7');ctx.restore();
 }
 if(cargo){ctx.fillStyle='#254a82';ctx.font='italic 600 42px Arial';ctx.save();const x=W*.58,w=W*.15;if(mirror){ctx.translate(x+w,211);ctx.scale(-1,1);ctx.fillText('CARGO',0,0,w);}else ctx.fillText('CARGO',x,211,w);ctx.restore();}
}

function starPath(ctx:CanvasRenderingContext2D,cx:number,cy:number,r:number,points=5,inner=.43){ctx.beginPath();for(let i=0;i<points*2;i++){const a=-Math.PI/2+i*Math.PI/points,rr=i%2?r*inner:r;const x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();}
function maplePath(ctx:CanvasRenderingContext2D,cx:number,cy:number,size:number){const p=[[0,-1],[.13,-.48],[.48,-.72],[.40,-.30],[.79,-.38],[.54,-.05],[.90,.11],[.42,.22],[.51,.58],[.14,.39],[.08,1],[-.08,1],[-.14,.39],[-.51,.58],[-.42,.22],[-.90,.11],[-.54,-.05],[-.79,-.38],[-.40,-.30],[-.48,-.72],[-.13,-.48]];ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(cx+x*size,cy+y*size):ctx.moveTo(cx+x*size,cy+y*size));ctx.closePath();}
function petalFlower(ctx:CanvasRenderingContext2D,cx:number,cy:number,r:number,count:number,color:string,center:string){ctx.fillStyle=color;for(let i=0;i<count;i++){ctx.save();ctx.translate(cx,cy);ctx.rotate(i*Math.PI*2/count);ctx.beginPath();ctx.ellipse(0,-r*.55,r*.23,r*.48,0,0,Math.PI*2);ctx.fill();ctx.restore();}ctx.fillStyle=center;ctx.beginPath();ctx.arc(cx,cy,r*.16,0,Math.PI*2);ctx.fill();}
function paintAirIndiaVistaPattern(ctx:CanvasRenderingContext2D){
 const field='#4e263f',gold=ctx.createLinearGradient(80,120,940,900);gold.addColorStop(0,'#e4c77f');gold.addColorStop(.52,'#bd934d');gold.addColorStop(1,'#e8cf8f');
 ctx.save();ctx.translate(512,512);ctx.rotate(-.075);ctx.translate(-512,-512);ctx.globalAlpha=.84;
 for(let row=0;row<8;row++)for(let col=0;col<6;col++){
  const x=102+col*170+(row%2)*25,y=74+row*126,w=100-(row%3)*5,h=91-(col%2)*4,left=x-w/2,top=y-h/2;
  ctx.beginPath();ctx.moveTo(left,top+h);ctx.lineTo(left,top+h*.40);ctx.bezierCurveTo(left,top+h*.19,x-w*.30,top,x,top);ctx.bezierCurveTo(x+w*.30,top,left+w,top+h*.19,left+w,top+h*.40);ctx.lineTo(left+w,top+h);ctx.closePath();ctx.strokeStyle=gold;ctx.lineWidth=11;ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-w*.24,top+h*.88);ctx.lineTo(x-w*.24,top+h*.42);ctx.quadraticCurveTo(x-w*.24,top+h*.22,x,top+h*.20);ctx.quadraticCurveTo(x+w*.24,top+h*.22,x+w*.24,top+h*.42);ctx.lineTo(x+w*.24,top+h*.88);ctx.strokeStyle=rgba('#d83a4b',.82);ctx.lineWidth=7;ctx.stroke();
  ctx.fillStyle=gold;ctx.fillRect(x-4,top+h*.53,8,h*.28);
 }
 ctx.restore();
}
function paintUaeTailFlag(ctx:CanvasRenderingContext2D,cx:number,cy:number,r:number){
 const left=cx-r*.84,right=cx+r*.85,top=cy-r*.80,bottom=cy+r*.80,staff=left+r*.28;
 const band=(color:string,upper:number,lower:number,shift:number)=>{ctx.beginPath();ctx.moveTo(staff,top+upper+shift);ctx.bezierCurveTo(cx+r*.05,top+upper-r*.10+shift,cx+r*.48,top+upper+r*.10+shift,right,top+upper+r*.02+shift);ctx.lineTo(right,top+lower-r*.02+shift);ctx.bezierCurveTo(cx+r*.49,top+lower+r*.08+shift,cx+r*.08,top+lower-r*.08+shift,staff,top+lower+shift);ctx.closePath();const g=ctx.createLinearGradient(staff,top,right,bottom);g.addColorStop(0,tint(color,.10));g.addColorStop(.50,color);g.addColorStop(1,tint(color,-.14));ctx.fillStyle=g;ctx.fill();};
 ctx.save();ctx.shadowColor='rgba(21,27,27,.28)';ctx.shadowBlur=r*.08;ctx.shadowOffsetX=r*.035;ctx.shadowOffsetY=r*.04;
 ctx.beginPath();ctx.moveTo(left,top+r*.10);ctx.bezierCurveTo(cx-r*.12,top-r*.05,cx+r*.48,top+r*.06,right,top+r*.02);ctx.lineTo(right,bottom-r*.02);ctx.bezierCurveTo(cx+r*.47,bottom+r*.03,cx-r*.12,bottom-r*.05,left,bottom-r*.10);ctx.closePath();ctx.fillStyle='#f5f3ee';ctx.fill();
 ctx.fillStyle='#c7353d';ctx.beginPath();ctx.moveTo(left,top+r*.10);ctx.bezierCurveTo(left+r*.10,top+r*.05,left+r*.19,top+r*.02,staff,top+r*.025);ctx.lineTo(staff,bottom-r*.02);ctx.bezierCurveTo(left+r*.18,bottom-r*.01,left+r*.09,bottom-r*.05,left,bottom-r*.10);ctx.closePath();ctx.fill();
 ctx.shadowColor='transparent';band('#168458',0,r*.48,0);band('#f5f3ee',r*.49,r*.99,0);band('#151817',r,1.48*r,0);
 ctx.globalAlpha=.16;ctx.strokeStyle='#fff';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(staff+r*.03,top+r*.12);ctx.bezierCurveTo(cx+r*.15,top+r*.23,cx+r*.50,top+r*.16,right-r*.04,top+r*.11);ctx.stroke();ctx.restore();
}
function tailMark(ctx:CanvasRenderingContext2D,s:Scheme){
 const cx=512,cy=520,r=300,white='#fbfaf6',ink=s.tailAccent,hot=s.accent;
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 switch(s.mark){
  case 'sunNine':case 'sun':{
   const count=s.mark==='sunNine'?9:12,orange=s.mark==='sunNine'?'#d84b32':ink;
   for(let i=0;i<count;i++){ctx.save();ctx.translate(cx,cy+12);ctx.rotate(i*Math.PI*2/count);ctx.fillStyle=i%2?hot:orange;ctx.beginPath();ctx.ellipse(0,-r*.55,r*.135,r*.39,0,0,Math.PI*2);ctx.fill();ctx.restore();}
   ctx.fillStyle=s.mark==='sunNine'?'#e4b74d':white;ctx.beginPath();ctx.arc(cx,cy+12,r*.18,0,Math.PI*2);ctx.fill();break;
  }
  case 'maple':maplePath(ctx,cx,cy,r*.70);ctx.fillStyle=s.tailAccent;ctx.fill();break;
  case 'plum':petalFlower(ctx,cx,cy,r*.78,5,'#d9819a','#c7ab73');break;
  case 'bauhinia':{
   petalFlower(ctx,cx,cy,r*.82,5,'#fff8f2','#e8424f');ctx.strokeStyle='#d83745';ctx.lineWidth=9;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(cx,cy);const a=i*Math.PI*2/5;ctx.lineTo(cx+Math.cos(a)*r*.73,cy+Math.sin(a)*r*.73);ctx.stroke();}break;
  }
  case 'phoenix':{
   ctx.fillStyle=ink;ctx.beginPath();ctx.moveTo(cx,cy-r*.65);ctx.bezierCurveTo(cx-r*.25,cy-r*.25,cx-r*.83,cy-r*.68,cx-r,cy-r*.35);ctx.bezierCurveTo(cx-r*.63,cy-r*.25,cx-r*.58,cy+r*.12,cx-r*.18,cy+r*.02);ctx.lineTo(cx-r*.48,cy+r*.57);ctx.lineTo(cx-r*.02,cy+r*.38);ctx.lineTo(cx,cy+r*.8);ctx.lineTo(cx+r*.02,cy+r*.38);ctx.lineTo(cx+r*.48,cy+r*.57);ctx.lineTo(cx+r*.18,cy+r*.02);ctx.bezierCurveTo(cx+r*.58,cy+r*.12,cx+r*.63,cy-r*.25,cx+r,cy-r*.35);ctx.bezierCurveTo(cx+r*.83,cy-r*.68,cx+r*.25,cy-r*.25,cx,cy-r*.65);ctx.fill();ctx.fillStyle=hot;ctx.beginPath();ctx.arc(cx,cy-r*.36,r*.12,0,Math.PI*2);ctx.fill();break;
  }
  case 'flag':{
   ctx.fillStyle='#1b4775';ctx.fillRect(cx-r*.55,cy-r*.5,r*.48,r*.48);ctx.fillStyle='#f7f6f1';ctx.fillRect(cx-r*.07,cy-r*.5,r*.62,r*.13);ctx.fillRect(cx-r*.07,cy-r*.24,r*.62,r*.13);ctx.fillRect(cx-r*.55,cy+r*.02,r*1.1,r*.13);ctx.fillRect(cx-r*.55,cy+r*.28,r*1.1,r*.13);
   ctx.fillStyle='#e14a52';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(cx-r*.55,cy-r*.37+i*r*.26);ctx.lineTo(cx+r*.55,cy-r*.5+i*r*.26);ctx.lineTo(cx+r*.55,cy-r*.37+i*r*.26);ctx.lineTo(cx-r*.55,cy-r*.24+i*r*.26);ctx.closePath();ctx.fill();}break;
  }
  case 'copa':{
   const colors=['#0b8fba','#efbd35','#df433e','#51a969','#664988','#faf8f0'];ctx.save();ctx.translate(cx,cy);ctx.rotate(-.55);for(let i=0;i<6;i++){ctx.fillStyle=colors[i];ctx.fillRect(-r*.74+i*r*.25,-r*.76,r*.16,r*1.52);}ctx.restore();ctx.fillStyle=white;ctx.beginPath();ctx.arc(cx,cy,r*.20,0,Math.PI*2);ctx.fill();break;
  }
  case 'eastSwallow':{
   // China Eastern's red/blue swallow mark, rebuilt as two clean, tapered wings.
   const wing=(color:string,upper:boolean)=>{ctx.fillStyle=color;ctx.beginPath();if(upper){ctx.moveTo(cx-r*.79,cy-r*.04);ctx.bezierCurveTo(cx-r*.33,cy-r*.43,cx+r*.18,cy-r*.30,cx+r*.76,cy-r*.70);ctx.bezierCurveTo(cx+r*.52,cy-r*.17,cx+r*.18,cy+r*.02,cx-r*.28,cy+r*.03);ctx.bezierCurveTo(cx-r*.48,cy+r*.04,cx-r*.65,cy+r*.07,cx-r*.79,cy-r*.04);}else{ctx.moveTo(cx-r*.78,cy+r*.06);ctx.bezierCurveTo(cx-r*.30,cy+r*.48,cx+r*.17,cy+r*.32,cx+r*.76,cy+r*.71);ctx.bezierCurveTo(cx+r*.48,cy+r*.19,cx+r*.16,cy-r*.02,cx-r*.27,cy-r*.03);ctx.bezierCurveTo(cx-r*.48,cy-r*.03,cx-r*.65,cy-r*.01,cx-r*.78,cy+r*.06);}ctx.closePath();ctx.fill();};
   wing('#d32b39',true);wing('#18578c',false);ctx.fillStyle='#f3f3ef';ctx.beginPath();ctx.ellipse(cx-r*.25,cy,r*.16,r*.13,-.18,0,Math.PI*2);ctx.fill();break;
  }
  case 'xiamenEgret':{
   ctx.fillStyle='#d5b15f';ctx.beginPath();ctx.moveTo(cx-r*.82,cy+r*.38);ctx.bezierCurveTo(cx-r*.34,cy+r*.24,cx-r*.12,cy-r*.02,cx+r*.02,cy-r*.52);ctx.bezierCurveTo(cx+r*.06,cy-r*.70,cx+r*.25,cy-r*.75,cx+r*.32,cy-r*.58);ctx.lineTo(cx+r*.18,cy-r*.42);ctx.bezierCurveTo(cx+r*.56,cy-r*.35,cx+r*.72,cy-r*.04,cx+r*.86,cy+r*.18);ctx.bezierCurveTo(cx+r*.53,cy+r*.01,cx+r*.29,cy-r*.07,cx+r*.06,cy-r*.22);ctx.bezierCurveTo(cx-r*.08,cy+r*.17,cx-r*.35,cy+r*.45,cx-r*.82,cy+r*.38);ctx.closePath();ctx.fill();
   ctx.strokeStyle='#f0d994';ctx.lineWidth=r*.045;ctx.beginPath();ctx.moveTo(cx-r*.69,cy+r*.52);ctx.quadraticCurveTo(cx-r*.03,cy+r*.55,cx+r*.59,cy+r*.35);ctx.stroke();break;
  }
  case 'bangkok':{
   ctx.save();ctx.translate(cx,cy);ctx.rotate(-.30);const colors=['#167ab4','#e34c42','#e9c84c'];for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-r*.71,-r*.25+i*r*.25);ctx.bezierCurveTo(-r*.28,-r*.70+i*r*.18,r*.20,-r*.42+i*r*.12,r*.73,-r*.65+i*r*.14);ctx.lineTo(r*.49,-r*.02+i*r*.16);ctx.bezierCurveTo(r*.12,r*.34-i*r*.02,-r*.26,r*.20+i*r*.15,-r*.71,-r*.25+i*r*.25);ctx.closePath();ctx.fillStyle=colors[i];ctx.fill();}ctx.restore();break;
  }
  case 'busan':{
   const colors=['#12699d','#34b2aa','#65c7bd'];for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(cx-r*.74,cy+r*(.43-i*.29));ctx.bezierCurveTo(cx-r*.25,cy+r*(.39-i*.31),cx+r*.20,cy-r*(.02+i*.12),cx+r*.72,cy-r*(.50-i*.06));ctx.bezierCurveTo(cx+r*.39,cy-r*(.14-i*.12),cx+r*.08,cy+r*(.28-i*.24),cx-r*.74,cy+r*(.43-i*.29));ctx.closePath();ctx.fillStyle=colors[i];ctx.fill();}break;
  }
  case 'vista':{
   const gold='#d5b46d';ctx.strokeStyle=gold;ctx.lineWidth=r*.06;ctx.lineJoin='round';
   for(let row=-1;row<2;row++)for(let col=-1;col<2;col++){const x=cx+col*r*.34,y=cy+row*r*.40,w=r*.30,h=r*.37;ctx.beginPath();ctx.moveTo(x-w/2,y+h/2);ctx.lineTo(x-w/2,y-h*.10);ctx.bezierCurveTo(x-w/2,y-h*.62,x+w/2,y-h*.62,x+w/2,y-h*.10);ctx.lineTo(x+w/2,y+h/2);ctx.stroke();}break;
  }
  case 'brush':{
   // The combined source lockup starts with Cathay's brushwing. Cropping the
   // first 12% isolates that mark; the old crop landed on the CATH letters.
   const source=art.get('cathayLogo');if(source){const crop:[number,number,number,number]=[0,0,source.naturalWidth*.12,source.naturalHeight];ctx.filter='brightness(0) invert(1)';imageFit(ctx,'cathayLogo',cx-r*.48,cy-r*.66,r*.96,r*1.32,false,crop);ctx.filter='none';}break;
  }
  case 'kapok':case 'orchid':case 'lotus':{
   const count=s.mark==='kapok'?8:s.mark==='orchid'?6:7;colorPetal(ctx,cx,cy,r*.82,count,s.mark==='kapok'?'#e55c52':ink,s.mark==='lotus'?'#d4b267':hot);break;
  }
  case 'delta':{
   ctx.fillStyle=hot;ctx.beginPath();ctx.moveTo(cx,cy-r*.74);ctx.lineTo(cx+r*.72,cy+r*.62);ctx.lineTo(cx-r*.72,cy+r*.62);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(cx,cy-r*.20);ctx.lineTo(cx+r*.3,cy+r*.40);ctx.lineTo(cx-r*.3,cy+r*.40);ctx.closePath();ctx.fill();break;
  }
  case 'wing':case 'ribbon':case 'coral':{
   const colors=s.mark==='coral'?['#e5b13f','#ef7245','#1ba0a0']: [ink,hot,white];
   for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(cx-r*.72,cy+r*(.46-i*.35));ctx.bezierCurveTo(cx-r*.18,cy+r*(.38-i*.36),cx+r*.12,cy-r*(.20+i*.04),cx+r*.74,cy-r*(.53-i*.10));ctx.strokeStyle=colors[i];ctx.lineWidth=38-i*7;ctx.stroke();}break;
  }
  case 'geometric':{
   const grid=['#be9c63','#dfc88e','#f1e9d6'];for(let row=0;row<5;row++)for(let col=0;col<4;col++){ctx.fillStyle=grid[(row+col)%grid.length];ctx.beginPath();ctx.moveTo(cx-r*.50+col*r*.25,cy-r*.55+row*r*.23);ctx.lineTo(cx-r*.38+col*r*.25,cy-r*.55+row*r*.23);ctx.lineTo(cx-r*.26+col*r*.25,cy-r*.43+row*r*.23);ctx.lineTo(cx-r*.38+col*r*.25,cy-r*.31+row*r*.23);ctx.closePath();ctx.fill();}break;
  }
  case 'crane':{
   ctx.fillStyle=ink;ctx.beginPath();ctx.arc(cx,cy-r*.18,r*.47,0,Math.PI*2);ctx.fill();ctx.fillStyle=s.tail;ctx.beginPath();ctx.arc(cx,cy-r*.18,r*.34,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle=white;ctx.lineWidth=23;ctx.beginPath();ctx.moveTo(cx-r*.24,cy+r*.22);ctx.quadraticCurveTo(cx+r*.05,cy-r*.02,cx+r*.27,cy-r*.32);ctx.lineTo(cx+r*.51,cy-r*.28);ctx.moveTo(cx+r*.08,cy-r*.05);ctx.quadraticCurveTo(cx+r*.16,cy-r*.39,cx+r*.38,cy-r*.49);ctx.stroke();ctx.fillStyle=white;ctx.beginPath();ctx.arc(cx+r*.50,cy-r*.30,18,0,Math.PI*2);ctx.fill();break;
  }
  case 'yinYang':{
   ctx.fillStyle='#e3f1f5';ctx.beginPath();ctx.arc(cx,cy,r*.58,0,Math.PI*2);ctx.fill();ctx.fillStyle='#12638c';ctx.beginPath();ctx.arc(cx,cy-r*.29,r*.29,Math.PI/2,-Math.PI/2);ctx.arc(cx,cy+r*.29,r*.29,-Math.PI/2,Math.PI/2);ctx.fill();ctx.fillStyle='#e7edf0';ctx.beginPath();ctx.arc(cx,cy-r*.29,r*.08,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e4a7a7';ctx.beginPath();ctx.arc(cx,cy+r*.29,r*.08,0,Math.PI*2);ctx.fill();break;
  }
  case 'taegeuk':{
   imageFit(ctx,'koreanTaegeuk',cx-r*.68,cy-r*.72,r*1.36,r*1.44);break;
  }
  case 'crown':{
   ctx.fillStyle=ink;ctx.beginPath();ctx.moveTo(cx-r*.60,cy+r*.32);ctx.lineTo(cx-r*.74,cy-r*.36);ctx.lineTo(cx-r*.29,cy-r*.08);ctx.lineTo(cx,cy-r*.57);ctx.lineTo(cx+r*.29,cy-r*.08);ctx.lineTo(cx+r*.74,cy-r*.36);ctx.lineTo(cx+r*.60,cy+r*.32);ctx.closePath();ctx.fill();ctx.fillRect(cx-r*.60,cy+r*.38,r*1.20,r*.16);break;
  }
  case 'kite':{
   ctx.fillStyle=hot;ctx.beginPath();ctx.moveTo(cx,cy-r*.73);ctx.quadraticCurveTo(cx+r*.10,cy-r*.22,cx+r*.67,cy-r*.08);ctx.quadraticCurveTo(cx+r*.38,cy+r*.20,cx,cy+r*.74);ctx.quadraticCurveTo(cx-r*.36,cy+r*.25,cx-r*.68,cy-r*.08);ctx.quadraticCurveTo(cx-r*.16,cy-r*.24,cx,cy-r*.73);ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(cx,cy-r*.60);ctx.lineTo(cx,cy+r*.56);ctx.stroke();break;
  }
  case 'peach':{
   ctx.fillStyle='#f3a5c5';ctx.beginPath();ctx.moveTo(cx,cy+r*.60);ctx.bezierCurveTo(cx-r*.77,cy+r*.06,cx-r*.42,cy-r*.48,cx,cy-r*.17);ctx.bezierCurveTo(cx+r*.40,cy-r*.48,cx+r*.77,cy+r*.06,cx,cy+r*.60);ctx.fill();ctx.strokeStyle='#61954f';ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(cx,cy-r*.17);ctx.quadraticCurveTo(cx+r*.08,cy-r*.58,cx+r*.48,cy-r*.65);ctx.stroke();break;
  }
  case 'sunWheel':{
   ctx.strokeStyle='#e6b85f';ctx.lineWidth=24;ctx.beginPath();ctx.arc(cx,cy,r*.48,0,Math.PI*2);ctx.stroke();for(let i=0;i<16;i++){const a=i*Math.PI/8;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r*.18,cy+Math.sin(a)*r*.18);ctx.lineTo(cx+Math.cos(a)*r*.72,cy+Math.sin(a)*r*.72);ctx.stroke();}ctx.fillStyle='#e6b85f';ctx.beginPath();ctx.arc(cx,cy,r*.15,0,Math.PI*2);ctx.fill();break;
  }
  case 'afStripes':{
   // Air France's narrow red/white/blue diagonal fan sits at the fin's aft edge.
   ctx.save();ctx.translate(cx+r*.50,cy);ctx.rotate(-.34);for(let i=0;i<9;i++){ctx.fillStyle=['#f4f4ef','#bd243b','#f4f4ef','#315c8d'][i%4];ctx.fillRect(-r*.09+i*r*.06,-r*1.05,r*.045,r*2.10);}ctx.restore();break;
  }
  case 'uaeFlag':{
   paintUaeTailFlag(ctx,cx,cy,r*.94);break;
  }
  case 'star':starPath(ctx,cx,cy,r*.75,5,.43);ctx.fillStyle=ink;ctx.fill();break;
  case 'crescent':{
   ctx.fillStyle=ink;ctx.beginPath();ctx.arc(cx,cy,r*.58,0,Math.PI*2);ctx.arc(cx+r*.25,cy-r*.16,r*.49,0,Math.PI*2);ctx.fill('evenodd');starPath(ctx,cx+r*.42,cy-r*.02,r*.16,5,.45);ctx.fillStyle=ink;ctx.fill();break;
  }
  case 'globe':{
   ctx.strokeStyle=ink;ctx.lineWidth=18;ctx.beginPath();ctx.arc(cx,cy,r*.58,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(cx,cy,r*.28,r*.57,0,0,Math.PI*2);ctx.stroke();for(let i=-1;i<=1;i++){ctx.beginPath();ctx.ellipse(cx,cy+i*r*.20,r*.54,r*.19,0,0,Math.PI*2);ctx.stroke();}break;
  }
  case 'fern':{
   ctx.strokeStyle=ink;ctx.lineWidth=28;ctx.beginPath();ctx.moveTo(cx-r*.44,cy+r*.58);ctx.bezierCurveTo(cx-r*.08,cy+r*.08,cx+r*.16,cy-r*.22,cx+r*.45,cy-r*.65);ctx.stroke();for(let i=0;i<8;i++){const t=i/8,x=cx-r*.35+t*r*.76,y=cy+r*.45-t*r*1.04;const side=i%2?1:-1;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+side*r*.28,y-r*.05,x+side*r*.32,y-r*.25);ctx.stroke();}break;
  }
  case 'kangaroo':{
   ctx.fillStyle=ink;
   ctx.beginPath();ctx.moveTo(cx-r*.36,cy-r*.03);ctx.bezierCurveTo(cx-r*.22,cy-r*.22,cx+r*.01,cy-r*.23,cx+r*.17,cy-r*.10);ctx.lineTo(cx+r*.29,cy-r*.37);ctx.quadraticCurveTo(cx+r*.36,cy-r*.49,cx+r*.41,cy-r*.37);ctx.lineTo(cx+r*.46,cy-r*.52);ctx.quadraticCurveTo(cx+r*.55,cy-r*.52,cx+r*.51,cy-r*.32);ctx.lineTo(cx+r*.48,cy-r*.14);ctx.quadraticCurveTo(cx+r*.59,cy-r*.10,cx+r*.45,cy+r*.02);ctx.lineTo(cx+r*.27,cy+r*.10);ctx.quadraticCurveTo(cx+r*.24,cy+r*.27,cx+r*.42,cy+r*.48);ctx.lineTo(cx+r*.30,cy+r*.52);ctx.lineTo(cx+r*.06,cy+r*.32);ctx.quadraticCurveTo(cx-r*.09,cy+r*.23,cx-r*.20,cy+r*.17);ctx.lineTo(cx-r*.39,cy+r*.45);ctx.lineTo(cx-r*.51,cy+r*.42);ctx.lineTo(cx-r*.37,cy+r*.08);ctx.quadraticCurveTo(cx-r*.49,cy+r*.16,cx-r*.62,cy+r*.29);ctx.lineTo(cx-r*.83,cy+r*.48);ctx.quadraticCurveTo(cx-r*.91,cy+r*.45,cx-r*.85,cy+r*.35);ctx.lineTo(cx-r*.57,cy+r*.05);ctx.quadraticCurveTo(cx-r*.47,cy-r*.03,cx-r*.36,cy-r*.03);ctx.closePath();ctx.fill();
   ctx.beginPath();ctx.moveTo(cx-r*.24,cy+r*.13);ctx.quadraticCurveTo(cx-r*.01,cy+r*.16,cx+r*.12,cy+r*.31);ctx.lineTo(cx+r*.03,cy+r*.56);ctx.lineTo(cx-r*.10,cy+r*.58);ctx.lineTo(cx-r*.18,cy+r*.36);ctx.lineTo(cx-r*.39,cy+r*.28);ctx.closePath();ctx.fill();
   ctx.beginPath();ctx.moveTo(cx+r*.22,cy-r*.04);ctx.quadraticCurveTo(cx+r*.36,cy-r*.08,cx+r*.47,cy+r*.05);ctx.lineTo(cx+r*.56,cy+r*.30);ctx.lineTo(cx+r*.47,cy+r*.35);ctx.lineTo(cx+r*.31,cy+r*.17);ctx.closePath();ctx.fill();break;
  }
  case 'lion':{
   ctx.fillStyle=white;ctx.beginPath();ctx.arc(cx,cy,r*.45,0,Math.PI*2);ctx.fill();ctx.fillStyle=hot;ctx.beginPath();ctx.arc(cx,cy,r*.30,0,Math.PI*2);ctx.fill();ctx.fillStyle=white;ctx.beginPath();ctx.arc(cx+r*.08,cy-r*.02,r*.20,0,Math.PI*2);ctx.fill();break;
  }
  case 'bird':{
   // Use SIA's standalone kris-bird silhouette, not a crop of the wordmark.
   imageFit(ctx,'siaBird',cx-r*.68,cy-r*.82,r*1.36,r*1.64);break;
  }
  case 'portrait':{
   // Original, non-photographic portrait treatment evokes the Alaska Native tail portrait.
   ctx.strokeStyle='#48a9a5';ctx.lineWidth=34;ctx.beginPath();ctx.moveTo(cx-r*.92,cy+r*.56);ctx.bezierCurveTo(cx-r*.25,cy+r*.13,cx+r*.18,cy+r*.31,cx+r*.96,cy-r*.30);ctx.stroke();ctx.strokeStyle='#9ac3aa';ctx.lineWidth=22;ctx.beginPath();ctx.moveTo(cx-r*.84,cy+r*.73);ctx.bezierCurveTo(cx-r*.20,cy+r*.33,cx+r*.26,cy+r*.44,cx+r*.89,cy-r*.12);ctx.stroke();
   ctx.fillStyle='#c98e69';ctx.beginPath();ctx.moveTo(cx-r*.36,cy+r*.55);ctx.bezierCurveTo(cx-r*.53,cy+r*.06,cx-r*.34,cy-r*.51,cx+r*.03,cy-r*.57);ctx.bezierCurveTo(cx+r*.39,cy-r*.48,cx+r*.45,cy-r*.12,cx+r*.34,cy+r*.02);ctx.lineTo(cx+r*.50,cy+r*.19);ctx.lineTo(cx+r*.30,cy+r*.24);ctx.lineTo(cx+r*.26,cy+r*.55);ctx.closePath();ctx.fill();
   ctx.fillStyle='#20262a';ctx.beginPath();ctx.moveTo(cx-r*.40,cy+r*.20);ctx.bezierCurveTo(cx-r*.57,cy-r*.36,cx-r*.24,cy-r*.75,cx+r*.09,cy-r*.70);ctx.bezierCurveTo(cx+r*.47,cy-r*.59,cx+r*.57,cy-r*.18,cx+r*.34,cy+r*.02);ctx.lineTo(cx+r*.20,cy-r*.24);ctx.lineTo(cx-r*.08,cy-r*.10);ctx.lineTo(cx-r*.26,cy+r*.18);ctx.closePath();ctx.fill();
   ctx.fillStyle='#fff0d6';ctx.beginPath();ctx.arc(cx+r*.16,cy-r*.08,15,0,Math.PI*2);ctx.fill();break;
  }
  case 'scoot':{
   ctx.fillStyle=ink;ctx.font='900 160px Arial,sans-serif';ctx.textAlign='center';ctx.fillText('scoot',cx,cy+r*.14);break;
  }
  case 'koru':{
   const fern=ink;
   ctx.fillStyle=fern;ctx.beginPath();ctx.moveTo(cx-r*.72,cy+r*.63);ctx.bezierCurveTo(cx-r*.30,cy+r*.18,cx-r*.05,cy+r*.14,cx+r*.08,cy-r*.02);ctx.bezierCurveTo(cx+r*.27,cy-r*.28,cx+r*.17,cy-r*.62,cx-r*.05,cy-r*.56);ctx.bezierCurveTo(cx-r*.23,cy-r*.50,cx-r*.20,cy-r*.25,cx-r*.02,cy-r*.24);ctx.bezierCurveTo(cx+r*.02,cy-r*.39,cx-r*.10,cy-r*.40,cx-r*.16,cy-r*.31);ctx.bezierCurveTo(cx-r*.39,cy-r*.52,cx-r*.20,cy-r*.88,cx+r*.06,cy-r*.82);ctx.bezierCurveTo(cx+r*.42,cy-r*.74,cx+r*.51,cy-r*.30,cx+r*.31,cy+r*.02);ctx.bezierCurveTo(cx+r*.16,cy+r*.30,cx-r*.12,cy+r*.36,cx-r*.49,cy+r*.72);ctx.closePath();ctx.fill();
   ctx.fillStyle=s.tail;ctx.beginPath();ctx.arc(cx+r*.10,cy-r*.40,r*.12,0,Math.PI*2);ctx.fill();
   for(let i=0;i<6;i++){const t=i/6,x=cx-r*(.47-t*.78),y=cy+r*(.48-t*.48),len=r*(.30-.10*t);ctx.fillStyle=fern;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-r*.03,y-len*.63,x-len*.68,y-len);ctx.quadraticCurveTo(x-len*.46,y-len*.33,x,y);ctx.moveTo(x,y);ctx.quadraticCurveTo(x+r*.02,y-len*.62,x+len*.58,y-len*.89);ctx.quadraticCurveTo(x+len*.35,y-len*.28,x,y);ctx.fill();}
   break;
  }
  case 'chevron':{
   for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(cx-r*.64+i*r*.20,cy-r*.48);ctx.lineTo(cx-r*.43+i*r*.20,cy-r*.48);ctx.lineTo(cx+r*.55+i*r*.04,cy+r*.46);ctx.lineTo(cx+r*.32+i*r*.04,cy+r*.46);ctx.closePath();ctx.fillStyle=i%2?ink:hot;ctx.fill();}break;
  }
  case 'mountain':{
   ctx.fillStyle='#d7ece9';ctx.beginPath();ctx.moveTo(cx-r*.72,cy+r*.40);ctx.lineTo(cx-r*.16,cy-r*.40);ctx.lineTo(cx+r*.02,cy-r*.07);ctx.lineTo(cx+r*.25,cy-r*.56);ctx.lineTo(cx+r*.72,cy+r*.40);ctx.closePath();ctx.fill();ctx.fillStyle='#8ec2b7';ctx.beginPath();ctx.moveTo(cx-r*.16,cy-r*.40);ctx.lineTo(cx+r*.02,cy-r*.07);ctx.lineTo(cx-r*.1,cy+r*.04);ctx.closePath();ctx.fill();break;
  }
  case 'airasia':{
   ctx.fillStyle=white;ctx.font='900 112px Arial,sans-serif';ctx.textAlign='center';ctx.fillText('airasia.com',cx,cy+r*.12);break;
  }
  case 'wordmark':ctx.fillStyle=white;ctx.font='700 100px Arial,sans-serif';ctx.textAlign='center';ctx.fillText(s.tailWord??'',cx,cy);break;
 }
 ctx.restore();
}
function colorPetal(ctx:CanvasRenderingContext2D,cx:number,cy:number,r:number,count:number,petal:string,core:string){ctx.fillStyle=petal;for(let i=0;i<count;i++){ctx.save();ctx.translate(cx,cy);ctx.rotate(i*Math.PI*2/count);ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-r*.31,-r*.17,-r*.27,-r*.77,0,-r);ctx.bezierCurveTo(r*.30,-r*.74,r*.30,-r*.20,0,0);ctx.fill();ctx.restore();}ctx.fillStyle=core;ctx.beginPath();ctx.arc(cx,cy,r*.15,0,Math.PI*2);ctx.fill();}

function paintJapanRoundel(ctx:CanvasRenderingContext2D,cx:number,cy:number,r:number){
 const red=ctx.createRadialGradient(cx-r*.24,cy-r*.34,r*.08,cx,cy,r*1.15);red.addColorStop(0,'#ee3946');red.addColorStop(.68,'#d51f33');red.addColorStop(1,'#ac1728');
 ctx.fillStyle=red;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=r*.025;ctx.stroke();
 ctx.save();ctx.translate(cx,cy);ctx.scale(r/300,r/300);ctx.fillStyle='#fffdf8';ctx.beginPath();
 ctx.moveTo(-220,20);ctx.bezierCurveTo(-135,-25,-90,-48,-20,-42);ctx.bezierCurveTo(-62,-94,-60,-157,-7,-214);ctx.bezierCurveTo(6,-142,48,-92,96,-80);ctx.bezierCurveTo(133,-139,172,-164,218,-170);ctx.bezierCurveTo(180,-104,160,-50,116,-14);ctx.bezierCurveTo(164,-25,207,-10,239,22);ctx.bezierCurveTo(173,24,133,52,101,97);ctx.bezierCurveTo(135,109,164,143,176,184);ctx.bezierCurveTo(116,153,65,141,20,159);ctx.bezierCurveTo(25,206,6,246,-27,277);ctx.bezierCurveTo(-28,222,-55,183,-100,164);ctx.bezierCurveTo(-129,197,-168,211,-209,205);ctx.bezierCurveTo(-162,168,-144,127,-151,83);ctx.bezierCurveTo(-183,75,-213,55,-235,24);ctx.closePath();ctx.fill();
 ctx.fillStyle='#fffdf8';ctx.beginPath();ctx.ellipse(0,22,74,108,-.15,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#fffdf8';ctx.lineWidth=20;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-8,16);ctx.quadraticCurveTo(52,-17,104,-65);ctx.stroke();
 ctx.fillStyle='#fffdf8';ctx.beginPath();ctx.moveTo(48,10);ctx.lineTo(223,-1);ctx.lineTo(176,35);ctx.lineTo(77,35);ctx.closePath();ctx.fill();ctx.restore();
}
function paintThaiOrchid(ctx:CanvasRenderingContext2D,cx:number,cy:number,r:number){
 const petals=['#f5d88c','#dfbd70','#f7e6b5','#c9a04f','#efd48c'];
 const petal=(angle:number,scale:number,index:number)=>{ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);const g=ctx.createLinearGradient(0,-r*.05,0,-r*scale);g.addColorStop(0,petals[(index+2)%petals.length]);g.addColorStop(.42,petals[index%petals.length]);g.addColorStop(1,'#b38d42');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,r*.06);ctx.bezierCurveTo(-r*.20,-r*.17,-r*.19,-r*(scale*.78),0,-r*scale);ctx.bezierCurveTo(r*.22,-r*(scale*.79),r*.18,-r*.19,0,r*.06);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(255,250,222,.50)';ctx.lineWidth=r*.016;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(r*.045,-r*.34,0,-r*(scale*.84));ctx.stroke();ctx.restore();};
 for(let i=0;i<5;i++)petal(i*Math.PI*2/5,.78,i);petal(-Math.PI/2,.99,2);petal(Math.PI/2,.72,0);
 ctx.fillStyle='#762b61';ctx.beginPath();ctx.ellipse(cx,cy+r*.13,r*.16,r*.30,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e6c36d';ctx.beginPath();ctx.ellipse(cx,cy+r*.02,r*.075,r*.19,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='rgba(255,246,214,.78)';ctx.lineWidth=r*.028;ctx.beginPath();ctx.moveTo(cx-r*.07,cy+r*.17);ctx.quadraticCurveTo(cx,cy+r*.36,cx+r*.07,cy+r*.17);ctx.stroke();
}
function paintVietnamLotus(ctx:CanvasRenderingContext2D,cx:number,cy:number,r:number){
 const colors=['#f1d994','#d9b65e','#f8e8bb'];for(let layer=0;layer<2;layer++)for(let i=0;i<7;i++){
  const angle=-Math.PI/2+i*Math.PI/3.5+(layer?.23:0),scale=layer?.60:.82;ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);const g=ctx.createLinearGradient(0,-r*.08,0,-r*scale);g.addColorStop(0,colors[(i+layer)%3]);g.addColorStop(.7,'#d4ad54');g.addColorStop(1,'#a8833f');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,r*.12);ctx.bezierCurveTo(-r*.22,-r*.13,-r*.18,-r*(scale*.70),0,-r*scale);ctx.bezierCurveTo(r*.2,-r*(scale*.72),r*.22,-r*.14,0,r*.12);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(255,248,224,.72)';ctx.lineWidth=r*.017;ctx.beginPath();ctx.moveTo(0,r*.04);ctx.quadraticCurveTo(r*.02,-r*.33,0,-r*(scale*.86));ctx.stroke();ctx.restore();
 }
 const center=ctx.createRadialGradient(cx-r*.03,cy-r*.05,2,cx,cy,r*.20);center.addColorStop(0,'#fff2c3');center.addColorStop(.58,'#d8b35d');center.addColorStop(1,'#9b7741');ctx.fillStyle=center;ctx.beginPath();ctx.arc(cx,cy,r*.17,0,Math.PI*2);ctx.fill();
}
function paintAirNewZealandFern(ctx:CanvasRenderingContext2D,W:number,mirror:boolean){
 ctx.save();if(mirror){ctx.translate(W,0);ctx.scale(-1,1);}const x0=W*.94,y0=207,x1=W*.67,y1=84,leaf=ctx.createLinearGradient(x1,y1,x0,y0);leaf.addColorStop(0,'#f6f7f3');leaf.addColorStop(.52,'#c8d0d0');leaf.addColorStop(1,'#8e999b');ctx.globalAlpha=.91;ctx.strokeStyle=leaf;ctx.lineCap='round';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(x0,y0);ctx.bezierCurveTo(W*.83,174,W*.75,113,x1,y1);ctx.stroke();
 for(let i=1;i<=15;i++){const t=i/16,x=x0+(x1-x0)*t,y=y0+(y1-y0)*t,len=W*.076*Math.sin(Math.PI*t)**.58;for(const side of [-1,1]){const ex=x-len,ey=y+side*len*.62;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x-len*.24,y+side*len*.18,x-len*.72,y+side*len*.28,ex,ey);ctx.bezierCurveTo(x-len*.73,y+side*len*.09,x-len*.36,y-side*len*.03,x,y);ctx.closePath();ctx.fillStyle=leaf;ctx.fill();}}
 ctx.restore();
}
function drawTail(ctx:CanvasRenderingContext2D,airline:Airline){
 const s=schemes[airline.id];if(!s)return;
 // Keep the airline's solid colour field, with a soft enamel falloff and a
 // watermark-scale echo of the emblem so the fin reads as a finished paint job.
 const enamel=ctx.createLinearGradient(0,0,1024,1024);enamel.addColorStop(0,tint(s.tail,.11));enamel.addColorStop(.42,s.tail);enamel.addColorStop(1,tint(s.tail,-.12));ctx.fillStyle=enamel;ctx.fillRect(0,0,1024,1024);
 if(airline.id==='JL'){imageFit(ctx,'jalTsurumaru',512-315,495-315,630,630);return;}
 const bloom=ctx.createRadialGradient(512,468,30,512,468,560);bloom.addColorStop(0,rgba(s.tailAccent,.13));bloom.addColorStop(1,rgba(s.tailAccent,0));ctx.fillStyle=bloom;ctx.fillRect(0,0,1024,1024);
 if(airline.id==='AI'){paintAirIndiaVistaPattern(ctx);return;}
 if(airline.id==='EK'){paintUaeTailFlag(ctx,512,512,500);return;}
 if(airline.id==='TG'){
  imageFit(ctx,'thaiOrchid',512-230,300,460,430);return;
 }
 if(airline.id==='TK'){
  const source=art.get('turkishLogo');if(source){const crop:[number,number,number,number]=[0,0,source.naturalWidth*.165,source.naturalHeight];imageFit(ctx,'turkishLogo',512-290,300,580,430,false,crop);}return;
 }
 if(airline.id==='NZ'){
  const source=art.get('airNzLogo');if(source){const crop:[number,number,number,number]=[source.naturalWidth*.82,0,source.naturalWidth*.18,source.naturalHeight];ctx.save();ctx.filter='brightness(0) invert(1)';imageFit(ctx,'airNzLogo',512-245,280,490,500,false,crop);ctx.restore();}return;
 }
 if(airline.id==='NH'){ctx.save();ctx.filter='brightness(0) invert(1)';imageFit(ctx,'anaLogo',512-360,335,720,235);ctx.restore();return;}
 if(airline.id==='KL'){ctx.save();ctx.filter='brightness(0) invert(1)';imageFit(ctx,'klmLogo',512-325,260,650,500);ctx.restore();return;}
 if(airline.id==='MM'){ctx.save();ctx.filter='brightness(0) invert(1)';imageFit(ctx,'peachLogo',512-360,385,720,250);ctx.restore();return;}
  if(s.mark==='flag'&&airline.id==='AA'){
  ctx.fillStyle='#1b4775';ctx.fillRect(0,0,420,430);ctx.fillStyle='#f3f3ed';for(let i=0;i<7;i++)ctx.fillRect(0,440+i*90,1024,42);ctx.fillStyle='#cb3540';for(let i=0;i<7;i++)ctx.fillRect(0,482+i*90,1024,42);
  ctx.save();ctx.translate(512,224);ctx.scale(.44,.44);tailMark(ctx,{...s,mark:'star'});ctx.restore();
  }else{
  if(airline.id==='AC'){ctx.fillStyle='#f7f7f3';ctx.beginPath();ctx.arc(512,520,280,0,Math.PI*2);ctx.fill();}
  if(s.mark==='geometric'||s.mark==='vista'){
   ctx.save();ctx.globalAlpha=s.mark==='vista'?.72:.48;ctx.strokeStyle=s.mark==='vista'?'#dfc578':'#eee2c7';ctx.lineWidth=s.mark==='vista'?52:42;
   const cols=s.mark==='vista'?5:6,rows=s.mark==='vista'?7:8;
   for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const x=90+col*174+(row%2)*85,y=72+row*126;ctx.beginPath();ctx.moveTo(x-48,y+57);ctx.lineTo(x-48,y-4);ctx.quadraticCurveTo(x-48,y-58,x,y-58);ctx.quadraticCurveTo(x+48,y-58,x+48,y-4);ctx.lineTo(x+48,y+57);ctx.stroke();}
   ctx.restore();
  }
  ctx.save();if(['AK','FD','Z2'].includes(airline.id))ctx.fillStyle='#c91e30';
  if(airline.id==='VN')paintVietnamLotus(ctx,512,510,300);
  else if(airline.id==='SQ')tailMark(ctx,s);
  else if(!['geometric','vista'].includes(s.mark))tailMark(ctx,s);
  ctx.restore();
 }
}
function customTail(ctx:CanvasRenderingContext2D,airline:Airline){
 for(const mirrored of [false,true]){
  ctx.save();ctx.translate(mirrored?512:0,0);ctx.scale(.5,1);
  ctx.fillStyle=airline.id==='EVA'?'#00a650':airline.id==='TTW'?'#f7ae1d':'#f4f3ef';ctx.fillRect(0,0,1024,1024);
  const px=(x:number,w:number)=>mirrored?1024-x-w:x;
  if(airline.id==='EVA')image(ctx,'eva',px(575,340),245,340,420,false,[472,28,81,83]);
  if(airline.id==='CAL'){
   const g=ctx.createLinearGradient(0,830,0,1024);g.addColorStop(0,'#a4b8d100');g.addColorStop(1,'#4b6d9c');ctx.fillStyle=g;ctx.fillRect(0,790,1024,234);
   ctx.save();ctx.globalCompositeOperation='multiply';image(ctx,'cal',px(545,400),245,400,400);ctx.restore();
  }
  if(airline.id==='SJX'){
   ctx.save();if(mirrored){ctx.translate(1024,0);ctx.scale(-1,1);}ctx.fillStyle='#b38a60';ctx.beginPath();ctx.moveTo(40,1024);ctx.lineTo(1024,760);ctx.lineTo(1024,925);ctx.lineTo(650,1024);ctx.closePath();ctx.fill();ctx.restore();image(ctx,'star',px(598,302),252,302,330);
  }
  if(airline.id==='TTW'){
   ctx.save();if(mirrored){ctx.translate(1024,0);ctx.scale(-1,1);}ctx.fillStyle='#252726';for(const [x,y,w]of [[526,-80,415],[365,226,500],[204,510,560],[-20,814,650]]){ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+w*.35,y+45,x+w*.72,y+185,x+w,y+165);ctx.bezierCurveTo(x+w*.58,y+284,x+w*.2,y+143,x-65,y+137);ctx.closePath();ctx.fill();}ctx.restore();
  }
  ctx.restore();
 }
}
/** Each side is rendered independently in the tail atlas for crisp, mirrored fin markings. */
export function paintTail(ctx:CanvasRenderingContext2D,airline:Airline){
 ctx.clearRect(0,0,1024,1024);
 if(!schemes[airline.id]){customTail(ctx,airline);return;}
 const s=schemes[airline.id];
 for(const mirrored of [false,true]){
  ctx.save();ctx.translate(mirrored?512:0,0);ctx.scale(.5,1);drawTail(ctx,airline);
  if(s.tailWord&&s.mark!=='wordmark'){ctx.fillStyle=airline.id==='SQ'||airline.id==='TG'||airline.id==='VN'?'#f5f0df':'#fbfaf6';ctx.font='600 36px Arial,sans-serif';ctx.textAlign='center';ctx.fillText(s.tailWord,512,970,880);}
  ctx.restore();
 }
}
