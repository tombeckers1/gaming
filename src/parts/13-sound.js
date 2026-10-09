
/* =========================================================
   Zeitgesteuerte Aufrufe & Sound
   ========================================================= */
/* FW_KTX > 0: gerade laeuft Feuerwerk - was jetzt geplant wird, gehoert
   dazu (fw) und laesst sich in der Vorfuehrung auf einen Schlag
   abbrechen (03.10., Tom: "Taste druecken, dann beendet das Feuerwerk") */
let FW_KTX=0;
const timers=[]; function later(t,fn){ timers.push({t,fn,fw:FW_KTX>0}); }
/* Ton sofort abschneiden: neuer Hauptregler, der alte blendet in 80 ms
   aus und wird abgehaengt - alles, was gerade klingt, verstummt */
function sfxSchnitt(){ if(!AC||!master) return; const alt=master, t=AC.currentTime;
  master=AC.createGain(); master.gain.value=0.7*SFX_VOL; master.connect(AC.destination);
  try{ alt.gain.cancelScheduledValues(t); alt.gain.setValueAtTime(alt.gain.value,t); alt.gain.linearRampToValueAtTime(0,t+0.08); }catch(e){}
  setTimeout(()=>{ try{ alt.disconnect(); }catch(e){} },200); }
let AC=null, master=null, noiseBuf=null;
/* Lautstaerke aller Soundeffekte (Pausenmenue > Audio, 03.10.): 0..1,
   gemerkt; die Musik hat ihren eigenen Regler (13b) */
let SFX_VOL=1; try{ const v=parseFloat(localStorage.getItem('bb_sfx')); if(isFinite(v)) SFX_VOL=Math.max(0,Math.min(1,v)); }catch(e){}
function sfxVol(v){ SFX_VOL=Math.max(0,Math.min(1,v)); try{ localStorage.setItem('bb_sfx',String(SFX_VOL)); }catch(e){} if(master) master.gain.value=0.7*SFX_VOL; sfxAnzeige(); }
function sfxAnzeige(){ const el=typeof document!=='undefined'&&document.getElementById('pSfxVol'); if(el&&document.activeElement!==el) el.value=Math.round(SFX_VOL*100); const w=typeof document!=='undefined'&&document.getElementById('pSfxWert'); if(w) w.textContent=Math.round(SFX_VOL*100)+' %'; }
function ac(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); master=AC.createGain(); master.gain.value=0.7*SFX_VOL; master.connect(AC.destination); }catch(e){ AC=null; } } if(AC&&AC.state==='suspended') AC.resume(); return AC; }
function tone(f,dur,type,vol,f2){ if(!AC) return; const o=AC.createOscillator(), g=AC.createGain(), t=AC.currentTime; o.type=type||'square'; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(f2,t+dur); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+0.03); }
function noise(dur,vol,freq){ if(!AC||vol<0.005) return; if(!noiseBuf){ noiseBuf=AC.createBuffer(1,AC.sampleRate*1.5,AC.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; } const s=AC.createBufferSource(), f=AC.createBiquadFilter(), g=AC.createGain(), t=AC.currentTime; s.buffer=noiseBuf; f.type='lowpass'; f.frequency.value=freq; g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); s.connect(f); f.connect(g); g.connect(master); s.start(t,Math.random()*0.5); s.stop(t+dur+0.05); }
/* Langes Grollen: Rauschen in Schleife, schwillt an und klingt langsam ab */
function grollen(dur,vol,freq,an){ if(!AC||vol<0.005) return; if(!noiseBuf) noise(0.01,0.006,100);
  const s=AC.createBufferSource(), f=AC.createBiquadFilter(), g=AC.createGain(), t=AC.currentTime;
  s.buffer=noiseBuf; s.loop=true; f.type='lowpass'; f.frequency.setValueAtTime(freq*2.2,t); f.frequency.exponentialRampToValueAtTime(freq,t+dur*0.6);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+(an||0.3)); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t,Math.random()*0.5); s.stop(t+dur+0.05); }
/* Flatternder Ton: Saegezahn, dessen Lautstaerke schnell auf und zu geht -
   so klingt ein Furz und nicht ein Brummen */
function flattern(f0,f1,dur,vol,rate){ if(!AC) return;
  const o=AC.createOscillator(), lp=AC.createBiquadFilter(), g=AC.createGain(), am=AC.createGain(), lfo=AC.createOscillator(), tiefe=AC.createGain(), t=AC.currentTime;
  o.type='sawtooth'; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  lp.type='lowpass'; lp.frequency.setValueAtTime(900,t); lp.frequency.exponentialRampToValueAtTime(380,t+dur); lp.Q.value=4;
  lfo.type='square'; lfo.frequency.setValueAtTime(rate,t); lfo.frequency.linearRampToValueAtTime(rate*0.6,t+dur);
  am.gain.value=0.5; tiefe.gain.value=0.5; lfo.connect(tiefe); tiefe.connect(am.gain);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.03); g.gain.setValueAtTime(vol,t+dur*0.7); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(lp); lp.connect(am); am.connect(g); g.connect(master); o.start(t); lfo.start(t); o.stop(t+dur+0.03); lfo.stop(t+dur+0.03); }
/* 06.10.: was hoch am Himmel knallt (Raketen ab 38 m, Kugeln auf 86-90 m,
   Toms PDF vom 05.10.), hoert man weit - kein Haus, kein Baum dazwischen.
   Ueber 35 m zaehlt die Hoehe nur noch zu 40 %; darunter wie bisher. Die
   Kugel auf 88 m klang sonst mit dem Mindestwert 0,08 (jetzt ~0,2). */
/* 09.10.: ueber 90 m zaehlt die Hoehe nicht mehr - die Kugeln brechen seit
   der Batterie-Runde 95-185 m hoch, ihr Knall ist auf 90 m geeicht
   (Runde 6, kugelknall.js); die Laufzeit (Licht vor Schall, schall())
   rechnet weiter mit der echten Entfernung */
const distVol=p=>{ const c=camera.position, dy=Math.min(p.y-c.y,90), ve=dy>35?35+(dy-35)*0.4:dy;
  return clamp(1-Math.hypot(p.x-c.x,ve,p.z-c.z)/70,0.08,1); };
/* Alltagsgeraeusche (Scanner, Kasse, Tuer) sind leise Nahgeraeusche:
   nach gut 20 m hoert man sie nicht mehr. */
const nahVol=p=>{ const d=camera.position.distanceTo(p); return d>22?0:Math.pow(1-d/22,1.5); };
const sfx={
  /* --- Alltagsgeraeusche (03.10., Tom: "dezent, man hoert es, aber nicht
     zu laut, und realistisch") --- */
  /* Scanner an der Kasse: kurzer, reiner Piepton um 2,7 kHz */
  scan:v=>{ v=v===undefined?1:v; tone(2730,0.075,'sine',0.042*v); },
  /* Kasse: Schublade rollt auf, eine kleine Glocke, Muenzen klimpern */
  kasse:v=>{ v=v===undefined?1:v; noise(0.22,0.05*v,1400); later(0.05,()=>noise(0.12,0.03*v,3800));
    later(0.18,()=>{ tone(2093,0.55,'sine',0.026*v); tone(2637,0.45,'sine',0.017*v); tone(4186,0.25,'sine',0.006*v); });
    later(0.24,()=>{ for(let i=0;i<4;i++) later(i*0.045+Math.random()*0.02,()=>tone(rand(5200,6800),0.03,'triangle',0.008*v)); }); },
  /* Automatische Schiebetuer: Motor surrt an, die Fluegel gleiten */
  tuerAuf:v=>{ v=v===undefined?1:v; tone(118,0.95,'sawtooth',0.0045*v,96); noise(0.9,0.022*v,700); later(0.82,()=>noise(0.08,0.02*v,300)); },
  tuerZu:v=>{ v=v===undefined?1:v; tone(104,0.85,'sawtooth',0.004*v,88); noise(0.8,0.018*v,620); later(0.78,()=>{ noise(0.06,0.03*v,240); tone(70,0.06,'sine',0.012*v,50); }); },
  /* Schritte: drinnen ein weicher Absatz auf Fliesen, draussen Schnee */
  schritt:(v,draussen)=>{ v=v===undefined?1:v;
    if(draussen){ noise(0.13,0.028*v,850+Math.random()*250); later(0.03,()=>noise(0.07,0.016*v,2600)); }
    else { noise(0.045,0.024*v,1300+Math.random()*500); tone(rand(95,125),0.05,'sine',0.010*v,60); } },
  /* Paket: Karton zusammenfalten, Ware hineinlegen */
  karton:v=>{ v=v===undefined?1:v; noise(0.16,0.045*v,650); later(0.2,()=>noise(0.12,0.035*v,900)); later(0.34,()=>tone(150,0.06,'sine',0.012*v,90)); },
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
  /* Furzboeller: ein kurzer Knall, dann der lange, flatternde Pups */
  pups:v=>{ if(!AC) return; noise(0.06,0.28*v,2600);
    later(0.04,()=>flattern(rand(135,160),rand(58,70),0.95,0.16*v,rand(26,34)));
    later(0.1,()=>flattern(rand(88,100),rand(40,48),0.8,0.09*v,rand(19,24)));
    later(0.05,()=>noise(0.7,0.12*v,450)); },
  /* Monsterboeller: Peitschenknall, Schlag in den Magen, zwei Echos */
  monster:v=>{ noise(0.16,1.1*v,7200); noise(1.7,1.25*v,340); tone(52,1.3,'sine',0.32*v,22);
    later(0.02,()=>noise(0.5,0.8*v,1400));
    later(0.42,()=>noise(1.1,0.45*v,260)); later(1.15,()=>noise(1.0,0.22*v,200)); },
  /* Atombombe: Knall, dann acht Sekunden Grollen mit tiefem Druck. Sie
     geht hoch am Himmel auf - hoeren soll man sie trotzdem voll. */
  atom:v=>{ v=Math.max(v,0.8); noise(0.24,1.1*v,6500); noise(1.8,1.35*v,300); tone(40,3.6,'sine',0.42*v,16);
    tone(63,2.4,'sawtooth',0.07*v,30);
    later(0.05,()=>grollen(8,1.5*v,170,0.45)); later(0.3,()=>grollen(5.5,0.8*v,440,0.7));
    later(1.6,()=>noise(1.4,0.5*v,220)); later(3.2,()=>noise(1.3,0.3*v,180)); },
};
/* =========================================================
   Neue Geraeusche fuer die Anomalie-Ueberarbeitung (Tom, 26.09. nachts:
   "jedes Produkt eine Anomalie"). Alles prozedural wie oben. v ist die
   Lautstaerke (meist distVol), die Schallverzoegerung macht schall().
   ========================================================= */
function weissBuf(){ if(!noiseBuf&&AC){ noiseBuf=AC.createBuffer(1,AC.sampleRate*1.5,AC.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; } return noiseBuf; }
/* Rosa Rauschen (Regen, Rieseln): weicher als weisses */
let rosaBuf=null;
function rosaRausch(){ if(!rosaBuf&&AC){ rosaBuf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate); const d=rosaBuf.getChannelData(0); let b0=0,b1=0,b2=0;
    for(let i=0;i<d.length;i++){ const w=Math.random()*2-1; b0=0.99765*b0+w*0.099046; b1=0.963*b1+w*0.2965164; b2=0.57*b2+w*1.0526913; d[i]=(b0+b1+b2+w*0.1848)*0.2; } }
  return rosaBuf; }
/* Gefiltertes Rauschen: typ lowpass|highpass|bandpass, f -> f2 gleitend,
   an = Anschwellen (s), hart = endet abrupt, rosa = rosa Rauschen */
function rauschF(o){ if(!AC||!(o.vol>=0.004)) return null;
  const s=AC.createBufferSource(), f=AC.createBiquadFilter(), g=AC.createGain(), t=AC.currentTime, d=o.dur||0.3;
  s.buffer=o.rosa?rosaRausch():weissBuf(); s.loop=d>0.9;
  f.type=o.typ||'lowpass'; f.frequency.setValueAtTime(o.f||1000,t); if(o.f2) f.frequency.exponentialRampToValueAtTime(o.f2,t+d); if(o.q) f.Q.value=o.q;
  if(o.an){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(o.vol,t+Math.min(o.an,d*0.98)); } else g.gain.setValueAtTime(o.vol,t);
  if(o.hart){ g.gain.setValueAtTime(o.vol,t+Math.max(d-0.02,o.an||0)); g.gain.linearRampToValueAtTime(0,t+d); } else g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  s.connect(f); f.connect(g); g.connect(master); s.start(t,Math.random()*0.5); s.stop(t+d+0.05); return g; }
/* tonGen: ein Synth fuer alle Pfeif-, Kreisch- und Brummtoene.
   o = {f Grundton Hz, f2 Zielton (Glissando ueber gl oder dur),
        spruenge:[[t,Hz],...] harte Tonspruenge, am Zerhacken Hz (Rechteck),
        amTiefe 0..1, rausch 0..1 Rauschanteil um den Ton, vib:{hz,cent},
        typ Wellenform, lp Tiefpass Hz, dur s (ohne: laeuft bis stop, max 60 s),
        vol, an Anschwellen s, ab Ausklingen s}
   Rueckgabe {f(hz,zeit) Ton live nachfuehren, vol(v), stop(ab)} */
function tonGen(o){ if(!AC) return null;
  const t=AC.currentTime, D=o.dur||60, vol=Math.max(0.0002,o.vol||0.04), an=o.an||0.02, ab=o.ab||0.08;
  const osc=AC.createOscillator(), am=AC.createGain(), g=AC.createGain(), quellen=[osc];
  osc.type=o.typ||'sine'; osc.frequency.setValueAtTime(o.f,t);
  if(o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2,t+(o.gl||D));
  (o.spruenge||[]).forEach(([ts,f])=>osc.frequency.setValueAtTime(f,t+ts));
  if(o.vib){ const vib=AC.createOscillator(), vg=AC.createGain(); vib.frequency.value=o.vib.hz||5;
    vg.gain.value=o.f*(Math.pow(2,(o.vib.cent||30)/1200)-1); vib.connect(vg); vg.connect(osc.frequency); quellen.push(vib); }
  let k=osc;
  if(o.lp){ const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=o.lp; lp.Q.value=o.q||1; k.connect(lp); k=lp; }
  k.connect(am);
  if(o.am){ const lfo=AC.createOscillator(), tf=AC.createGain(), T=o.amTiefe===undefined?1:o.amTiefe;
    lfo.type='square'; lfo.frequency.value=o.am; am.gain.value=1-T/2; tf.gain.value=T/2; lfo.connect(tf); tf.connect(am.gain); quellen.push(lfo); }
  let rf=null;
  if(o.rausch){ const rs=AC.createBufferSource(), rg=AC.createGain(); rf=AC.createBiquadFilter();
    rs.buffer=weissBuf(); rs.loop=true; rf.type='bandpass'; rf.frequency.setValueAtTime(o.f,t); if(o.f2) rf.frequency.exponentialRampToValueAtTime(o.f2,t+(o.gl||D)); rf.Q.value=3;
    rg.gain.value=o.rausch*4; rs.connect(rf); rf.connect(rg); rg.connect(am); quellen.push(rs); }
  am.connect(g); g.connect(master);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+an);
  g.gain.setValueAtTime(vol,t+Math.max(an,D-ab)); g.gain.exponentialRampToValueAtTime(0.0001,t+D);
  quellen.forEach(q=>{ q.start(t); q.stop(t+D+0.05); });
  return { f(hz,zeit){ const n=AC.currentTime; osc.frequency.cancelScheduledValues(n); osc.frequency.setTargetAtTime(hz,n,zeit||0.05); if(rf){ rf.frequency.cancelScheduledValues(n); rf.frequency.setTargetAtTime(hz,n,zeit||0.05); } },
    vol(v){ g.gain.cancelScheduledValues(AC.currentTime); g.gain.setTargetAtTime(Math.max(0.0001,v),AC.currentTime,0.05); },
    stop(a){ const n=AC.currentTime; a=a||0.08; g.gain.cancelScheduledValues(n); g.gain.setTargetAtTime(0.0001,n,a/4); quellen.forEach(q=>{ try{ q.stop(n+a+0.03); }catch(e){} }); } };
}
/* Schall kommt nach dem Licht: fn(v) nach Laufzeit Abstand/343 */
function schall(p,fn){ const d=camera.position.distanceTo(p)/343, v=distVol(p); if(d<0.02) fn(v); else later(d,()=>fn(v)); }
let tickAktiv=0;
Object.assign(sfx,{
  /* trockener Startknall ohne Zischen (Silberpfeil) */
  startknall:v=>{ rauschF({dur:0.1,vol:0.7*v,f:2200}); tone(130,0.12,'sine',0.12*v,50); },
  /* Glasklang: zwei Sinus 1,6-1,9 kHz, 3 Hz Schwebung (Kristall) */
  glasklang:(v,f)=>{ f=f||rand(1600,1900); tone(f,1.6,'sine',0.045*v); tone(f+3,1.6,'sine',0.045*v); tone(f*2.76,0.45,'sine',0.01*v); },
  /* Klirren: 6-10 helle Tinks in 0,25 s */
  klirren:v=>{ const n=6+Math.floor(Math.random()*5); for(let i=0;i<n;i++) later(Math.random()*0.25,()=>tone(rand(3000,6000),rand(0.04,0.1),'sine',0.03*v)); },
  /* Eisknistern: 40 leise Klicks ueber 4 kHz in 0,8 s */
  eisknistern:v=>{ for(let i=0;i<40;i++) later(Math.random()*0.8,()=>rauschF({dur:0.012,vol:0.07*v,typ:'highpass',f:4000})); },
  /* Kreischen (Schwaermer): 1,2-2 kHz, zerhackt 12-18 Hz, mit Rauschen; gl = faellt ab */
  kreischen:(v,dur,gl)=>{ const f=rand(1200,2000); return tonGen({f,f2:gl?f*0.55:undefined,am:rand(12,18),amTiefe:0.8,rausch:0.35,typ:'square',lp:3600,dur:dur||1.5,vol:0.02*v}); },
  /* Rattern (Titanrakete): derselbe Generator, haerter zerhackt, mehr Rauschen */
  ratter:(v,dur)=>tonGen({f:rand(1200,1500),am:rand(22,28),amTiefe:1,rausch:0.6,typ:'sawtooth',lp:2600,dur:dur||1.2,vol:0.022*v}),
  /* Brummen (Kreisel, Blitzturm): Saegezahn mit Tiefpass, Ton live
     nachfuehrbar: const h=sfx.brummen(v,120); ... h.f(600) */
  brummen:(v,f,dur)=>tonGen({f:f||120,typ:'sawtooth',lp:1800,q:2,dur,vol:0.028*v,an:0.1}),
  /* Fauchen: tiefes Rauschen, schwillt an (Drache, Fackel, Geysir) */
  fauchen:(v,dur,hart)=>rauschF({dur:dur||1.5,vol:0.32*v,f:300,an:(dur||1.5)*0.4,hart}),
  /* Bruellen: Rauschen, Tonhoehe 200 -> 90 Hz in 1,2 s */
  bruellen:v=>{ rauschF({dur:1.2,vol:0.5*v,typ:'bandpass',f:200,f2:90,q:2.5,an:0.08}); tone(200,1.2,'sawtooth',0.03*v,90); },
  /* Ansaugen: umgekehrter Rauschanstieg 0,4 s, endet hart */
  ansaugen:v=>rauschF({dur:0.4,vol:0.35*v,typ:'bandpass',f:500,f2:2500,q:0.8,an:0.38,hart:true}),
  pling:v=>tone(2640,0.25,'sine',0.03*v),
  regen:(v,dur)=>rauschF({dur:dur||2.5,vol:0.18*v,typ:'bandpass',f:2500,q:0.6,rosa:true,an:0.3}),
  snap:v=>rauschF({dur:0.02,vol:0.5*v,typ:'bandpass',f:4500,q:1.2}),
  /* Plopp: tiefer Sinus 110 -> 60 Hz und dumpfes Rauschen; h > 1 hoeher */
  plopp:(v,h)=>{ h=h||1; tone(110*h,0.08,'sine',0.14*v,60*h); rauschF({dur:0.08,vol:0.12*v,f:400*h}); },
  ratsch:v=>rauschF({dur:0.15,vol:0.25*v,typ:'bandpass',f:1500,f2:3200,q:2}),
  rieseln:(v,dur)=>rauschF({dur:dur||2.5,vol:0.08*v,typ:'highpass',f:5000,rosa:true,an:0.2}),
  herzton:v=>{ tone(rand(55,70),0.18,'sine',0.25*v,45); tone(1000,0.012,'square',0.03*v); },
  poka:v=>rauschF({dur:0.2,vol:0.55*v,f:320}),
  /* Tick-Tack: Klicks 2 kHz und 1,5 kHz im Wechsel, n Paare */
  ticktack:(v,n)=>{ for(let i=0;i<(n||1)*2;i++) later(i*0.25,()=>tone(i%2?1500:2000,0.015,'square',0.04*v)); },
  /* Glocke: 110 Hz mit unharmonischen Obertoenen, 4 s */
  dong:v=>{ [[1,0.16],[2,0.06],[2.76,0.05],[5.4,0.02],[8.93,0.01]].forEach(([k,a])=>tone(110*k,4/Math.sqrt(k),'sine',a*v)); tone(55,4,'sine',0.05*v); },
  /* Donner: Knacken, dann Grollen (lang: Weltenblitz) */
  donner:(v,lang)=>{ rauschF({dur:0.09,vol:0.7*v,typ:'highpass',f:2500}); later(0.05,()=>grollen(lang?4:2.2,0.9*v,120,0.25)); later(0.4,()=>noise(0.8,0.3*v,200)); },
  /* Tick: 1-kHz-Korn, hoechstens 8 gleichzeitig (Hagel bei 10 Schuss/s) */
  tick:v=>{ if(tickAktiv>=8) return false; tickAktiv++; tone(1000,0.012,'square',0.035*v); later(0.03,()=>{ tickAktiv--; }); return true; },
  /* Klick eines Knisterpops, h = Tonhoehe */
  klick:(v,h)=>rauschF({dur:0.018,vol:0.16*v,typ:'highpass',f:3000*(h||1)}),
  /* Pfeifton mit Tonhoehe: ton Halbtoene ueber 1,6 kHz, steigt beim
     Steigen 2 Halbtoene. o.gleit: tief, sinkt ueber 2,5 s eine Quarte und
     vibriert (Heulboje). o.fallend: Glissando abwaerts */
  pfeifTon:(v,ton,o)=>{ o=o||{}; const f=1600*Math.pow(2,((ton||0)-(o.gleit?12:0))/12), d=o.dur||(o.gleit?2.5:1.3);
    const f2=o.gleit?f*Math.pow(2,-5/12):o.fallend?f*0.6:f*Math.pow(2,2/12);
    return tonGen({f,f2,dur:d,vol:0.03*v,vib:o.gleit?{hz:6,cent:35}:null,rausch:0.08,an:0.05}); },
  /* Zischen (Lauffeuer), Brodeln (Kessel), Prasseln (Flitterbrunnen), Wumms (Einschlag) */
  zischen:(v,dur)=>rauschF({dur:dur||0.8,vol:0.1*v,typ:'highpass',f:3500,an:0.05}),
  brodeln:(v,dur)=>{ dur=dur||1; rauschF({dur,vol:0.12*v,f:180,an:0.2});
    for(let i=0;i<Math.round(dur*4);i++) later(Math.random()*dur,()=>tone(rand(60,110),0.12,'sine',0.07*v,rand(120,170))); },
  prasseln:v=>{ for(let i=0;i<4;i++) later(Math.random()*0.3,()=>rauschF({dur:0.015,vol:0.06*v,typ:'highpass',f:rand(2500,5000)})); },
  wumms:v=>{ tone(48,0.6,'sine',0.35*v,28); noise(0.5,0.5*v,180); }
});
/* =========================================================
   Bruchklaenge (03.10. abends, Tom: "Du kannst auch verschiedene
   Explosionssounds waehlen - die Sounds machen es echt aus ... es soll
   schon eine Explosion sein, aber verschiedene Toene, immer ein bisschen
   unterschiedlich, und darauf passende Effekte. Kein Pfeifen.")
   Jeder Klang ist ein Bruch nach echtem Vorbild (30-mm-Batterie,
   75-150-mm-Kugel aus 30-80 m): ein Knall aus gefiltertem Rauschen plus
   Tiefton, danach - je nach Satz - Nachhall, Knistern oder Rieseln.
   Alle Teile werden auf der Audio-Uhr geplant (bkR/bkT mit at), nicht mit
   later - so laesst sich jeder Klang in einem OfflineAudioContext messen.
   Jeder Aufruf variiert Tonhoehe und Laenge um etwa 10-15 Prozent.
   ========================================================= */
const bkV=(a,b)=>a+Math.random()*(b-a);
/* gefiltertes Rauschen ab jetzt+at: dur, vol, typ, f(->f2), q, an, rosa */
function bkR(at,o){ if(!AC||!(o.vol>=0.003)) return; const s=AC.createBufferSource(), f=AC.createBiquadFilter(), g=AC.createGain(), t=AC.currentTime+at, d=o.dur;
  s.buffer=o.rosa?rosaRausch():weissBuf(); s.loop=d>1.2; f.type=o.typ||'lowpass'; f.frequency.setValueAtTime(o.f,t); if(o.f2) f.frequency.exponentialRampToValueAtTime(o.f2,t+d); if(o.q) f.Q.value=o.q;
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(o.vol,t+(o.an||0.004)); g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  s.connect(f); f.connect(g); g.connect(master); s.start(t,Math.random()*0.4); s.stop(t+d+0.05); }
/* Sinus-Tiefton ab jetzt+at, f -> f2 */
function bkT(at,f,f2,dur,vol){ if(!AC||vol<0.003) return; const o=AC.createOscillator(), g=AC.createGain(), t=AC.currentTime+at;
  o.type='sine'; o.frequency.setValueAtTime(f,t); o.frequency.exponentialRampToValueAtTime(f2,t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.005); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+0.03); }
/* Knister-Folge: n trockene Mini-Knacke zwischen t0 und t1 */
function bkKn(t0,t1,n,vol){ for(let i=0;i<n;i++) bkR(bkV(t0,t1),{dur:bkV(0.012,0.03),vol:vol*bkV(0.5,1),typ:'highpass',f:bkV(2800,6500)}); }
const BRUCH_KLAENGE={
  /* dumpfer Bass-Wumms: grosse Kugel, schwere Weide - Druck mehr als Knall */
  wumms(v){ const k=bkV(0.85,1.15); bkR(0,{dur:0.9*k,vol:0.75*v,f:200*k,f2:80}); bkT(0,58*k,30,0.55*k,0.32*v); bkR(0,{dur:0.08,vol:0.25*v,typ:'bandpass',f:900*k,q:0.8}); },
  /* trockener Crack: scharfe, schnelle Brueche (Crossette, Kreuzstern) */
  crack(v){ const k=bkV(0.85,1.2); bkR(0,{dur:0.06*k,vol:0.55*v,typ:'highpass',f:2600*k}); bkR(0,{dur:0.03,vol:0.35*v,typ:'bandpass',f:5200*k,q:1.5}); bkR(0.16*k,{dur:0.05,vol:0.12*v,typ:'highpass',f:2400}); },
  /* weicher Puff: leichte, schwebende Sterne (Paeonie, Bluete) */
  puff(v){ const k=bkV(0.85,1.15); bkR(0,{dur:0.28*k,vol:0.42*v,f:520*k,f2:220,an:0.012}); bkT(0,95*k,60,0.14,0.12*v); },
  /* doppelter Schlag: Kern und Schale (Pistill, Wechsler) */
  doppel(v){ const k=bkV(0.85,1.15), d=bkV(0.11,0.17); bkR(0,{dur:0.35,vol:0.5*v,f:420*k,f2:200}); bkR(0,{dur:0.05,vol:0.25*v,typ:'highpass',f:3000}); bkR(d,{dur:0.3,vol:0.38*v,f:300*k,f2:150}); bkT(d,70*k,40,0.2,0.15*v); },
  /* ferner Donnerhall mit Echo: Riesenbruch, Kamuro - der Knall rollt nach */
  donnerhall(v){ const k=bkV(0.85,1.1); bkR(0,{dur:0.7,vol:0.62*v,f:380*k,f2:120}); bkR(0,{dur:0.06,vol:0.3*v,typ:'highpass',f:2800});
    bkR(0.08,{dur:2.4*k,vol:0.22*v,f:160*k,f2:70,an:0.25}); bkR(0.42*k,{dur:0.4,vol:0.16*v,f:300,f2:120}); bkR(0.95*k,{dur:0.5,vol:0.08*v,f:260,f2:100}); },
  /* gedaempfter Plopp: leichte Geschosse, kleine Lichter */
  plopp(v){ const k=bkV(0.8,1.25); bkT(0,120*k,62*k,0.09,0.16*v); bkR(0,{dur:0.09,vol:0.16*v,f:450*k}); },
  /* Knister-Nachhall: Knall, dann knistern die Sterne nach */
  knisterhall(v){ const k=bkV(0.85,1.15); bkR(0,{dur:0.3,vol:0.4*v,f:450*k,f2:200}); bkR(0,{dur:0.04,vol:0.28*v,typ:'highpass',f:3000}); bkKn(bkV(0.28,0.45),bkV(1.0,1.5),Math.round(bkV(14,22)),0.14*v); },
  /* Brokat-Rauschen: goldener Brokat, Weide - ein langes, weiches Rauschen */
  brokat(v){ const k=bkV(0.85,1.15); bkR(0,{dur:0.4,vol:0.45*v,f:350*k,f2:160}); bkR(0.1,{dur:2.6*k,vol:0.07*v,typ:'bandpass',f:1700*k,q:0.6,rosa:true,an:0.35}); },
  /* Glitzer-Rieseln: Glitzersterne, Chrysantheme */
  rieseln(v){ const k=bkV(0.85,1.15); bkR(0,{dur:0.25,vol:0.38*v,f:600*k,f2:250}); bkR(0.15,{dur:2.2*k,vol:0.06*v,typ:'highpass',f:5200*k,rosa:true,an:0.3}); bkKn(0.6,2.0,6,0.05*v); },
  /* Salut-Crack: der harte Kanonenschlag */
  salut(v){ const k=bkV(0.9,1.1); bkR(0,{dur:0.12,vol:0.85*v,typ:'bandpass',f:2100*k,q:0.7}); bkR(0,{dur:0.8,vol:0.7*v,f:420*k,f2:110}); bkT(0,48,28,0.4,0.3*v); },
  /* Sternplatzen in Kaskade: Kranz, Zehnfach, Crossetten - viele kleine Schlaege nacheinander */
  kaskade(v){ const k=bkV(0.85,1.15); bkR(0,{dur:0.25,vol:0.35*v,f:500*k,f2:220}); let t=bkV(0.18,0.3); const n=Math.round(bkV(4,7));
    for(let i=0;i<n;i++){ bkR(t,{dur:0.05,vol:0.3*v*(1-i/n*0.6),typ:'highpass',f:bkV(2200,3800)}); bkT(t,bkV(140,200),90,0.06,0.05*v); t+=bkV(0.05,0.13); } },
  /* zischendes Aufplatzen: Fische, Kometen, Schwaerme */
  zisch(v){ const k=bkV(0.85,1.15); bkR(0,{dur:0.12,vol:0.3*v,f:600*k}); bkR(0.05,{dur:1.1*k,vol:0.09*v,typ:'highpass',f:3600*k,an:0.08}); },
  /* Klack: Ringe und Figuren - kurz, hoelzern */
  klack(v){ const k=bkV(0.85,1.2); bkR(0,{dur:0.07,vol:0.35*v,typ:'bandpass',f:950*k,q:2.5}); bkT(0,160*k,110,0.07,0.1*v); }
};
/* als sfx fuer r.knall: bkWumms, bkCrack ... */
Object.keys(BRUCH_KLAENGE).forEach(n=>{ sfx['bk'+n[0].toUpperCase()+n.slice(1)]=(v,s)=>BRUCH_KLAENGE[n](v,s||1); });
