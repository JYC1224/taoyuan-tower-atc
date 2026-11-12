import type { Aircraft, RadioMessage } from './types';
import { AIRLINES } from './data/fleet';

// ICAO Annex 10 radiotelephony spelling alphabet and digit pronunciations.
const LETTERS:Record<string,string>={
  A:'Alfa',B:'Bravo',C:'Charlie',D:'Delta',E:'Echo',F:'Foxtrot',G:'Golf',H:'Hotel',I:'India',J:'Juliett',K:'Kilo',L:'Lima',M:'Mike',
  N:'November',O:'Oscar',P:'Papa',Q:'Quebec',R:'Romeo',S:'Sierra',T:'Tango',U:'Uniform',V:'Victor',W:'Whiskey',X:'X-ray',Y:'Yankee',Z:'Zulu',
};
const DIGITS=['zero','wun','too','tree','fower','fife','six','seven','ait','niner'];
const TELEPHONY_WORDS=new Set(Object.values(AIRLINES).map(airline=>airline.telephonyCallsign.toUpperCase()));

function speakDigits(value:string):string{return [...value].map(d=>DIGITS[Number(d)]??d).join(' ');}
function speakCode(value:string):string{return [...value.toUpperCase()].map(char=>LETTERS[char]??DIGITS[Number(char)]??char).join(' ');}
function escapeRegExp(value:string):string{return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}

/** Converts only the spoken copy. The controller's visible radio log remains untouched. */
export function radioSpeechText(message:RadioMessage,aircraft:Aircraft[]):string {
  let text=message.text;
  const a=message.aircraftId?aircraft.find(candidate=>candidate.id===message.aircraftId):undefined;
  if(a){
    const carrier=AIRLINES[a.airline];
    const flightDigits=a.callsign.match(/\d+/g)?.join('')??a.flightNumber.match(/\d+/g)?.join('')??'';
    const spokenCarrier=carrier?.telephonyCallsign||speakCode(AIRLINES[a.airline]?.prefix??a.airline);
    const spokenCallsign=`${spokenCarrier} ${speakDigits(flightDigits)}`.trim();
    text=text.replace(new RegExp(`\\b${escapeRegExp(a.callsign)}\\b`,'g'),spokenCallsign);
  }

  // Runway numbers are spoken as two separate digits, followed by the full side.
  text=text.replace(/\b(?:runway|rwy)\s*(\d{1,2})([LRC]?)\b/gi,(_match,number:string,side:string)=>{
    const runwayNumber=number.padStart(2,'0');
    const sideName=side.toUpperCase()==='L'?'left':side.toUpperCase()==='R'?'right':side.toUpperCase()==='C'?'center':'';
    return `runway ${speakDigits(runwayNumber)}${sideName?` ${sideName}`:''}`;
  });

  // Callsigns, taxiway names, stand IDs and airport abbreviations are identifiers,
  // so spell their letters with the ICAO words instead of English letter names.
  text=text.replace(/\b([A-Z]{1,2}\d{1,2})\b/g,code=>speakCode(code));
  text=text.replace(/\b([A-Z]{1,3})\b/g,code=>TELEPHONY_WORDS.has(code)?code:[...code].map(char=>LETTERS[char]??char).join(' '));

  // ATC wind groups are three direction digits and individually spoken speed digits.
  text=text.replace(/\bwind\s+(\d{1,3})\/(\d{1,2})\b/gi,(_match,direction:string,speed:string)=>
    `wind ${speakDigits(direction.padStart(3,'0'))} degrees ${speakDigits(speed)} knots`);
  return text;
}
