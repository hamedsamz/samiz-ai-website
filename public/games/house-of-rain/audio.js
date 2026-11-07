// All audio is synthesized locally: no external streams, downloads or API keys.
export class HouseAudio{
  constructor(){this.ctx=null;this.master=null;this.ambience=null;this.music=null;this.effects=null;this.level=.65;this.musicLevel=.4;this.enabled=true;this.lastBeat=0;}
  start(){
    if(!this.ctx){
      const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;
      this.ctx=new AudioContext();const c=this.ctx;
      this.master=c.createGain();this.master.gain.value=this.level;this.master.connect(c.destination);
      this.ambience=c.createGain();this.ambience.gain.value=.34;this.ambience.connect(this.master);
      this.music=c.createGain();this.music.gain.value=this.musicLevel;this.music.connect(this.master);
      this.effects=c.createGain();this.effects.gain.value=.8;this.effects.connect(this.master);
      const buffer=c.createBuffer(1,c.sampleRate*4,c.sampleRate),data=buffer.getChannelData(0);let brown=0;
      for(let i=0;i<data.length;i++){brown=(brown+(Math.random()*2-1)*.018)/1.019;data[i]=brown*4+(Math.random()*2-1)*.09;}
      const rain=c.createBufferSource();rain.buffer=buffer;rain.loop=true;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=3500;rain.connect(filter);filter.connect(this.ambience);rain.start();
      const wind=c.createOscillator(),wg=c.createGain();wind.type='sine';wind.frequency.value=.09;wg.gain.value=.09;wind.connect(wg);wg.connect(this.ambience.gain);wind.start();
      for(const [i,f] of [55,82.41,110.2,116.54].entries()){
        const osc=c.createOscillator(),gain=c.createGain();osc.type='sine';osc.frequency.value=f;gain.gain.value=i<2?.07:.025;osc.connect(gain);gain.connect(this.music);osc.start();
        const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=.07+i*.021;lg.gain.value=.014;lfo.connect(lg);lg.connect(gain.gain);lfo.start();
      }
    }
    if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});this.setVolume(this.level);
  }
  setVolume(v){this.level=v;if(this.master&&this.ctx)this.master.gain.setTargetAtTime(this.enabled?v:0,this.ctx.currentTime,.1);}
  setMusic(v){this.musicLevel=v;if(this.music&&this.ctx)this.music.gain.setTargetAtTime(v,this.ctx.currentTime,.15);}
  suspend(){if(this.ctx&&this.ctx.state==='running')this.ctx.suspend().catch(()=>{});}
  tone(freq,duration=.2,volume=.2,type='sine',pan=0,target=null){
    if(!this.ctx||this.ctx.state!=='running')return;const c=this.ctx,t=c.currentTime,osc=c.createOscillator(),gain=c.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,t);if(target)osc.frequency.exponentialRampToValueAtTime(target,t+duration);gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.002,volume),t+.012);gain.gain.exponentialRampToValueAtTime(.001,t+duration);osc.connect(gain);
    if(c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=pan;gain.connect(p);p.connect(this.effects);}else gain.connect(this.effects);osc.start(t);osc.stop(t+duration+.03);
  }
  knock(pan=0){this.tone(140,.18,.26,'triangle',pan,55);this.tone(860,.05,.035,'sine',pan);}
  step(running=false){this.tone(72+Math.random()*20,.1,running?.12:.065,'triangle',Math.random()*.2-.1,32);}
  creak(pan=0){this.tone(210,.8,.06,'sawtooth',pan,390);}
  whisper(pan=0){this.tone(630,1.5,.025,'sawtooth',pan,1200);this.tone(340,1.1,.025,'triangle',pan,170);}
  door(){this.tone(100,.6,.18,'triangle',-.3,45);this.creak(.25);}
  success(){for(const [i,f]of[220,261.63,329.63].entries())setTimeout(()=>this.tone(f,1,.09),i*180);}
  scare(){this.tone(52,1.2,.25,'sawtooth',0,27);this.tone(1400,.3,.055,'sine',0,280);}
  update(time,danger){if(danger>0&&time-this.lastBeat>1.05-danger*.55){this.tone(48,.18,.12+danger*.1,'sine');this.lastBeat=time;}}
}
