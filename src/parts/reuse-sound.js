   Zeitgesteuerte Aufrufe & Sound
   ========================================================= */
const timers=[]; function later(t,fn){ timers.push({t,fn}); }
let AC=null, master=null, noiseBuf=null;
function ac(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); master=AC.createGain(); master.gain.value=0.7; master.connect(AC.destination); }catch(e){ AC=null; } } if(AC&&AC.state==='suspended') AC.resume(); return AC; }
function tone(f,dur,type,vol,f2){ if(!AC) return; const o=AC.createOscillator(), g=AC.createGain(), t=AC.currentTime; o.type=type||'square'; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(f2,t+dur); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+0.03); }
function noise(dur,vol,freq){ if(!AC||vol<0.005) return; if(!noiseBuf){ noiseBuf=AC.createBuffer(1,AC.sampleRate*1.5,AC.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; } const s=AC.createBufferSource(), f=AC.createBiquadFilter(), g=AC.createGain(), t=AC.currentTime; s.buffer=noiseBuf; f.type='lowpass'; f.frequency.value=freq; g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); s.connect(f); f.connect(g); g.connect(master); s.start(t,Math.random()*0.5); s.stop(t+dur+0.05); }
const distVol=p=>clamp(1-camera.position.distanceTo(p)/70,0.08,1);
const sfx={
  beep:()=>tone(1500,0.07,'square',0.045),
  pop:()=>tone(520,0.06,'triangle',0.08,300),
  cash:()=>{ tone(1046,0.09,'square',0.05); later(0.08,()=>tone(1568,0.22,'square',0.05)); },
  boom:v=>{ noise(1.0,0.9*v,420); noise(0.25,0.6*v,3200); },
  crack:v=>noise(0.07,0.45*v,5200),
  whistle:v=>tone(700,1.1,'sine',0.035*v,2600),
  fizz:v=>noise(1.4,0.12*v,7000)
};

