
/* =========================================================
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
  thump:v=>{ noise(0.16,0.55*v,260); tone(90,0.14,'sine',0.05*v,40); },
  crackle:v=>{ for(let i=0;i<9;i++) later(i*0.055+Math.random()*0.03,()=>noise(0.045,0.16*v,7000)); },
  rolltor:v=>{ noise(0.45,0.16*v,520); tone(62,0.4,'sawtooth',0.022*v,54); },
  schiebetuer:v=>{ noise(0.7,0.07*v,1500); tone(220,0.5,'sine',0.012*v,150); },
  whistle:v=>tone(700,1.1,'sine',0.035*v,2600),
  fizz:v=>noise(1.4,0.12*v,7000),
  alarm:()=>{ tone(880,0.12,'square',0.05); later(0.16,()=>tone(660,0.16,'square',0.05)); },
  ring:()=>{ for(let i=0;i<2;i++) later(i*0.42,()=>{ tone(1318,0.1,'sine',0.05); later(0.12,()=>tone(1046,0.12,'sine',0.05)); }); },
  spray:()=>noise(0.5,0.25,4200),
  /* Klebeband vom Abroller: kurzes Ratschen, dann das Abreissen */
  klebe:v=>{ v=v||1; noise(0.34,0.11*v,2300); later(0.36,()=>noise(0.05,0.2*v,5200)); },
  level:()=>{ tone(784,0.1,'square',0.05); later(0.1,()=>tone(1046,0.1,'square',0.05)); later(0.2,()=>tone(1318,0.28,'square',0.055)); },
  /* Furzrakete: flatternder Aufstieg und eine breite, tiefe Entladung */
  pfffft:v=>{ if(!AC) return;
    for(let i=0;i<7;i++) later(i*0.055,()=>tone(rand(105,190),0.11,'sawtooth',0.030*v,rand(65,130)));
    noise(0.5,0.09*v,900); },
  furz:v=>{ if(!AC) return;
    tone(92,0.55,'sawtooth',0.075*v,38);
    later(0.03,()=>tone(61,0.6,'square',0.055*v,29));
    for(let i=0;i<14;i++) later(0.04+i*0.035,()=>tone(rand(52,128),0.09,'sawtooth',0.040*v,rand(30,70)));
    noise(0.85,0.30*v,520); later(0.28,()=>noise(0.6,0.18*v,320)); },
  heul:v=>{ tone(340,1.5,'sawtooth',0.035*v,2100); later(0.2,()=>tone(300,1.3,'square',0.018*v,1700)); }
};
