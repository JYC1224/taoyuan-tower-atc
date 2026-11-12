import snapshot from './schedules/tpe-2026-11-11.json';

export interface CarrierIdentity { code: string; name: string; localName: string }

const ENGLISH_NAMES: Record<string, string> = {
  '5J':'Cebu Pacific','7C':'Jeju Air','9G':'Sun PhuQuoc Airways','AA':'American Airlines','AC':'Air Canada',
  'AE':'Mandarin Airlines','AF':'Air France','AI':'Air India','AK':'AirAsia','AS':'Alaska Airlines',
  'AV':'Avianca','B7':'UNI Air','BR':'EVA Air','BX':'Air Busan','CA':'Air China','CI':'China Airlines',
  'CM':'Copa Airlines','CX':'Cathay Pacific','CZ':'China Southern Airlines','DL':'Delta Air Lines','EK':'Emirates',
  'EY':'Etihad Airways','FD':'Thai AirAsia','GK':'Jetstar Japan','HB':'Greater Bay Airlines','HO':'Juneyao Airlines',
  'HU':'Hainan Airlines','HX':'Hong Kong Airlines','IT':'Tigerair Taiwan','JL':'Japan Airlines','JX':'STARLUX Airlines',
  'KE':'Korean Air','KL':'KLM','LJ':'Jin Air','LO':'LOT Polish Airlines','MF':'Xiamen Airlines',
  'MH':'Malaysia Airlines','MM':'Peach Aviation','MU':'China Eastern Airlines','NH':'All Nippon Airways',
  'NU':'Japan Transocean Air','NX':'Air Macau','NZ':'Air New Zealand','OZ':'Asiana Airlines','PG':'Bangkok Airways',
  'PR':'Philippine Airlines','QF':'Qantas','RF':'Aero K Airlines','SL':'Thai Lion Air','SQ':'Singapore Airlines',
  'TG':'Thai Airways','TK':'Turkish Airlines','TR':'Scoot','TW':"T'way Air",'UA':'United Airlines',
  'UO':'HK Express','VJ':'VietJet Air','VN':'Vietnam Airlines','VZ':'Thai Vietjet Air','Z2':'Philippines AirAsia',
  'ZE':'Eastar Jet','ZH':'Shenzhen Airlines',
};

export const TPE_CARRIERS: Record<string, CarrierIdentity> = Object.fromEntries(
  Object.entries(snapshot.carriers).map(([code, localName]) => [code, {
    code,
    name: ENGLISH_NAMES[code] ?? code,
    localName,
  }]),
);

export const IATA_AIRLINE_ID: Record<string, string> = { BR:'EVA', CI:'CAL', JX:'SJX', IT:'TTW' };
export const airlineIdForIata = (code: string): string => IATA_AIRLINE_ID[code] ?? code;
