// Short tactile effects only. No soundtrack or repeating scheduler.
export class StoryAudio {
  constructor(){this.enabled=true;this.volume=.35;this.context=null;this.playing=false;this.effectsPlayed=0;}
  async start(){if(!this.enabled)return;const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!this.context){this.context=new A();this.master=this.context.createGain();this.master.gain.value=this.volume*.45;this.master.connect(this.context.destination);}await this.context.resume();this.playing=true;}
  setEnabled(v){this.enabled=v;if(!v){this.playing=false;this.context?.suspend();}else this.start();}
  setVolume(v){this.volume=v;this.master?.gain.setTargetAtTime(v*.45,this.context.currentTime,.04);}
  pluck(f,d=.12,delay=0,v=.3){if(!this.context||!this.enabled||!this.playing)return;const t=this.context.currentTime+delay,o=this.context.createOscillator(),g=this.context.createGain();o.type='sine';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.63,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+d+.01);}
  rustle(){if(!this.context||!this.enabled||!this.playing)return;const c=this.context,n=Math.floor(c.sampleRate*.095),b=c.createBuffer(1,n,c.sampleRate),data=b.getChannelData(0);for(let i=0;i<n;i++)data[i]=(Math.random()*2-1)*.06*(1-i/n);const src=c.createBufferSource(),filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1300;src.buffer=b;src.connect(filter);filter.connect(this.master);src.start();}
  effect(k){if(!this.enabled||!this.context)return;this.effectsPlayed++;if(k==='page'){this.rustle();this.pluck(340,.06,0,.1);}else if(k==='collect'){this.pluck(950,.14,0,.17);this.pluck(1240,.13,.035,.09);}else if(k==='good'||k==='ending'){this.pluck(560,.17,0,.18);this.pluck(840,.16,.055,.12);}else if(k==='bad')this.pluck(190,.13,0,.25);else this.pluck(460,.065,0,.22);}
  destroy(){this.context?.close();}
}
