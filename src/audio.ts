import type {RadioMessage,SimulationAPI} from './types';
import {AudioEvents} from './audioEvents';
import {radioSpeechText} from './radioSpeech';

/** Locally synthesized airport ambience and optional locally installed speech. */
export class AirportAudio {
 private context:AudioContext|null=null;
 private master:GainNode|null=null;
 private engine:OscillatorNode|null=null;
 private engineGain:GainNode|null=null;
 private ambientGain:GainNode|null=null;
 private jetGain:GainNode|null=null;
 private jetFilter:BiquadFilterNode|null=null;
 private rainGain:GainNode|null=null;
 private noise:AudioBuffer|null=null;
 private events=new AudioEvents();
 private lastRadioAt=-Infinity;
 private wasPlaying=false;
 enabled=true;
 volume=.65;
 radioVoice=true;

 async start(){
  if(this.context){await this.context.resume();this.ambientGain?.gain.setTargetAtTime(.12,this.context.currentTime,.2);return;}
  const ctx=this.context=new AudioContext();
  this.master=ctx.createGain();this.master.gain.value=this.enabled?this.volume*.22:0;this.master.connect(ctx.destination);
  const buffer=this.noise=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate);const data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  const ambient=ctx.createBufferSource();ambient.buffer=buffer;ambient.loop=true;
  const ambientFilter=ctx.createBiquadFilter();ambientFilter.type='lowpass';ambientFilter.frequency.value=180;
  this.ambientGain=ctx.createGain();this.ambientGain.gain.value=.12;ambient.connect(ambientFilter).connect(this.ambientGain).connect(this.master);ambient.start();
  const rain=ctx.createBufferSource();rain.buffer=buffer;rain.loop=true;
  const rainFilter=ctx.createBiquadFilter();rainFilter.type='lowpass';rainFilter.frequency.value=2600;
  this.rainGain=ctx.createGain();this.rainGain.gain.value=0;rain.connect(rainFilter).connect(this.rainGain).connect(this.master);rain.start();
  const jet=ctx.createBufferSource();jet.buffer=buffer;jet.loop=true;
  this.jetFilter=ctx.createBiquadFilter();this.jetFilter.type='bandpass';this.jetFilter.frequency.value=430;this.jetFilter.Q.value=.45;
  this.jetGain=ctx.createGain();this.jetGain.gain.value=0;jet.connect(this.jetFilter).connect(this.jetGain).connect(this.master);jet.start();
  this.engine=ctx.createOscillator();this.engine.type='sine';this.engine.frequency.value=55;
  this.engineGain=ctx.createGain();this.engineGain.gain.value=0;this.engine.connect(this.engineGain).connect(this.master);this.engine.start();
 }
 reset(sim:SimulationAPI){this.events.reset(sim.aircraft,sim.radio);this.lastRadioAt=-Infinity;this.wasPlaying=false;this.cancelVoice();}
 stop(){this.cancelVoice();this.wasPlaying=false;if(this.context){const now=this.context.currentTime;this.ambientGain?.gain.setTargetAtTime(0,now,.15);this.engineGain?.gain.setTargetAtTime(0,now,.15);this.jetGain?.gain.setTargetAtTime(0,now,.15);this.rainGain?.gain.setTargetAtTime(0,now,.15);}}
 private cancelVoice(){if(typeof window!=='undefined'&&'speechSynthesis' in window)window.speechSynthesis.cancel();}
 setEnabled(value:boolean){this.enabled=value;if(this.context&&this.master)this.master.gain.setTargetAtTime(value?this.volume*.22:0,this.context.currentTime,.1);if(!value)this.cancelVoice();}
 setVolume(value:number){this.volume=Math.max(0,Math.min(1,Number.isFinite(value)?value:.65));if(this.context&&this.master)this.master.gain.setTargetAtTime(this.enabled?this.volume*.22:0,this.context.currentTime,.1);if(this.volume===0)this.cancelVoice();}
 setRadioVoice(value:boolean){this.radioVoice=value;if(!value)this.cancelVoice();}
 click(){if(!this.context||!this.master||!this.enabled)return;const c=this.context,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=670;g.gain.setValueAtTime(.025,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.045);o.connect(g).connect(this.master);o.start();o.stop(c.currentTime+.05);o.onended=()=>{o.disconnect();g.disconnect();};}
 private burst(duration:number,frequency:number,gain:number){
  if(!this.context||!this.master||!this.noise||!this.enabled||this.volume===0)return;
  const c=this.context,source=c.createBufferSource(),filter=c.createBiquadFilter(),envelope=c.createGain(),now=c.currentTime;
  source.buffer=this.noise;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.7;
  envelope.gain.setValueAtTime(.0001,now);envelope.gain.linearRampToValueAtTime(gain,now+.025);envelope.gain.exponentialRampToValueAtTime(.0001,now+duration);
  source.connect(filter).connect(envelope).connect(this.master);source.start(now);source.stop(now+duration+.01);
  source.onended=()=>{source.disconnect();filter.disconnect();envelope.disconnect();};
 }
 private radio(message:RadioMessage,aircraft:SimulationAPI['aircraft']){
  if(!this.context||!this.enabled||this.volume===0||this.context.currentTime-this.lastRadioAt<3)return;
  this.lastRadioAt=this.context.currentTime;this.burst(.18,1800,.12);
  if(!this.radioVoice||!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined')return;
  const speech=window.speechSynthesis;if(speech.speaking||speech.pending)return;
  const voice=speech.getVoices().find(v=>v.localService&&/^en[-_]/i.test(v.lang));if(!voice)return;
  const utterance=new SpeechSynthesisUtterance(radioSpeechText(message,aircraft).slice(0,300));utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.93;utterance.pitch=.9;utterance.volume=this.volume*.55;speech.speak(utterance);
 }
 update(sim:SimulationAPI,listener:{x:number;y:number;z:number}){
  if(!this.context)return;const now=this.context.currentTime,playing=sim.timeScale>0&&!sim.ended;
  if(!playing&&this.wasPlaying)this.cancelVoice();this.wasPlaying=playing;
  let loudest=0,frequency=55;
  if(playing)for(const a of sim.aircraft){
   if(a.completed)continue;
   const power=a.state==='TAKEOFF_ROLL'?1:a.state==='DECELERATING'?.72:a.state==='TOUCHDOWN'?.85:a.state==='AIRBORNE'?.85:a.state==='FINAL'||a.state==='LANDING_CLEARED'?.52:a.speed>1&&a.position.y<12?.22:0;
   if(!power)continue;const distance=Math.hypot(a.position.x-listener.x,a.position.y-listener.y,a.position.z-listener.z);
   const level=power/(1+(distance/550)**2);if(level>loudest){loudest=level;frequency=46+Math.min(1,a.speed/85)*44;}
  }
  this.engine?.frequency.setTargetAtTime(frequency,now,.6);this.engineGain?.gain.setTargetAtTime(loudest*.16,now,.6);
  this.jetGain?.gain.setTargetAtTime(loudest*.8,now,.7);this.jetFilter?.frequency.setTargetAtTime(280+frequency*5,now,.7);
  this.rainGain?.gain.setTargetAtTime(sim.weather.wetness*.16,now,1);
  const events=this.events.update(sim.aircraft,sim.radio,playing);
  for(const a of events.touchdowns){const d=Math.hypot(a.position.x-listener.x,a.position.y-listener.y,a.position.z-listener.z);const gain=.4/(1+(d/550)**2);if(gain>.008)this.burst(.65,160,gain);}
  if(events.message&&sim.timeScale<=2)this.radio(events.message,sim.aircraft);
 }
}
