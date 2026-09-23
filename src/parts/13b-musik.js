
/* =========================================================
   Musik. Selbst komponiert und live im Browser erzeugt (Web
   Audio): keine Aufnahmen, keine fremden Rechte. Vier Stuecke
   mit festen Akkordfolgen. Die Melodie steht als Motiv in
   Tonstufen ueber dem jeweiligen Akkord - so passt sie auf
   jeden Takt und kehrt wie ein Refrain wieder.
   ========================================================= */
const MUSIK={an:true,vol:0.5,stueck:0};
try{ const m=JSON.parse(localStorage.getItem('bb_musik')||'null'); if(m&&typeof m==='object'){ if(typeof m.an==='boolean') MUSIK.an=m.an; if(typeof m.vol==='number') MUSIK.vol=clamp(m.vol,0,1); if(typeof m.stueck==='number') MUSIK.stueck=m.stueck|0; } }catch(e){}
function musikSpeichern(){ try{ localStorage.setItem('bb_musik',JSON.stringify({an:MUSIK.an,vol:MUSIK.vol,stueck:MUSIK.stueck})); }catch(e){} }

const mtof=n=>440*Math.pow(2,(n-69)/12);
const SKALA={dur:[0,2,4,5,7,9,11],moll:[0,2,3,5,7,8,10]};
/* Tonstufe (0 = Grundton, 7 = Oktave) in Halbtoene */
function stufe(sk,d){ const o=Math.floor(d/7), i=((d%7)+7)%7; return SKALA[sk][i]+12*o; }

/* Die Stuecke. prog: Akkordstufe je Takt, ein Durchgang sind acht
   Takte. motiv: je Takt 16 Sechzehntel, Zahl = Tonstufe ueber dem
   Akkordgrundton, null = Pause, '-' = Ton klingt weiter. */
const STUECKE=[
  { name:'Ladenfunk', pegel:1.0, bpm:108, ton:65, skala:'dur', prog:[0,5,3,4,0,5,3,4],
    stil:'funk',
    motivA:[4,null,'-',2, 4,null,5,'-', 4,null,2,null, 0,'-','-',null],
    motivB:[7,'-',6,'-', 4,null,2,4, 5,'-','-',4, 2,null,null,null] },
  { name:'Schneeflocken', pegel:1.0, bpm:82, ton:62, skala:'dur', prog:[0,4,5,3,0,4,3,4],
    stil:'winter',
    motivA:[7,'-','-',6, 4,'-','-',null, 2,'-',4,'-', 7,'-','-','-'],
    motivB:[9,'-',7,'-', 6,'-',4,'-', 5,'-','-',4, 2,'-','-','-'] },
  { name:'Mitternacht', pegel:0.9, bpm:124, ton:57, skala:'moll', prog:[0,5,2,6,0,5,2,6],
    stil:'dance',
    motivA:[7,null,7,null, 9,null,7,'-', 4,null,4,null, 2,'-',4,null],
    motivB:[9,'-',11,'-', 9,null,7,null, 7,'-',4,'-', 2,null,4,null] },
  { name:'Pixelparty', pegel:1.15, bpm:138, ton:55, skala:'dur', prog:[0,3,1,4,0,3,4,4],
    stil:'chip',
    motivA:[4,null,7,null, 9,7,4,null, 2,null,4,7, 4,null,null,null],
    motivB:[11,null,9,null, 7,null,9,11, 12,'-','-',9, 7,null,4,null] }
];
let mBus=null, mHall=null, mStep=0, mNext=0, mTakte=0, mNoise=null;
function musikBus(){
  if(mBus||!AC) return mBus;
  const comp=AC.createDynamicsCompressor(); comp.threshold.value=-18; comp.ratio.value=3;
  mBus=AC.createGain(); mBus.gain.value=0; mBus.connect(comp); comp.connect(AC.destination);
  /* Hall aus abklingendem Rauschen fuer Flaechen und Glocken */
  try{ const L=AC.sampleRate*2.2, ir=AC.createBuffer(2,L,AC.sampleRate);
    for(let c=0;c<2;c++){ const d=ir.getChannelData(c); for(let i=0;i<L;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/L,3); }
    const cv=AC.createConvolver(); cv.buffer=ir; mHall=AC.createGain(); mHall.gain.value=0.35; mHall.connect(cv); cv.connect(mBus);
  }catch(e){ mHall=null; }
  mNoise=AC.createBuffer(1,AC.sampleRate,AC.sampleRate); const nd=mNoise.getChannelData(0); for(let i=0;i<nd.length;i++) nd[i]=Math.random()*2-1;
  return mBus;
}
/* --- Klangerzeuger --- */
function hk(){ return AC.createGain(); }
function env(g,t,a,v,d){ g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(v,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+d); }
function ziel(n,hall){ n.connect(mBus); if(hall&&mHall) n.connect(mHall); }
function osz(typ,f,t,dauer){ const o=AC.createOscillator(); o.type=typ; o.frequency.setValueAtTime(f,t); o.start(t); o.stop(t+dauer+0.05); return o; }
const KLANG={
  kick(t,v){ const o=osz('sine',150,t,0.3), g=hk(); o.frequency.exponentialRampToValueAtTime(42,t+0.13); env(g,t,0.002,0.9*v,0.26); o.connect(g); ziel(g); },
  snare(t,v){ const s=AC.createBufferSource(); s.buffer=mNoise; const f=AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1900; f.Q.value=0.7;
    const g=hk(); env(g,t,0.001,0.45*v,0.16); s.connect(f); f.connect(g); ziel(g,true); s.start(t); s.stop(t+0.25);
    const o=osz('triangle',190,t,0.12), g2=hk(); env(g2,t,0.001,0.25*v,0.08); o.connect(g2); ziel(g2); },
  clap(t,v){ for(let k=0;k<3;k++){ const s=AC.createBufferSource(); s.buffer=mNoise; const f=AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1400; f.Q.value=1.2;
    const g=hk(); env(g,t+k*0.011,0.001,0.32*v,0.09); s.connect(f); f.connect(g); ziel(g,true); s.start(t+k*0.011); s.stop(t+0.2); } },
  hat(t,v,offen){ const s=AC.createBufferSource(); s.buffer=mNoise; const f=AC.createBiquadFilter(); f.type='highpass'; f.frequency.value=7500;
    const g=hk(); env(g,t,0.001,0.16*v,offen?0.2:0.04); s.connect(f); f.connect(g); ziel(g); s.start(t,Math.random()*0.5); s.stop(t+0.3); },
  bass(t,n,dauer,v,typ){ const o=osz(typ||'sawtooth',mtof(n),t,dauer), f=AC.createBiquadFilter(), g=hk();
    f.type='lowpass'; f.frequency.setValueAtTime(900,t); f.frequency.exponentialRampToValueAtTime(260,t+dauer); f.Q.value=4;
    env(g,t,0.005,0.42*v,dauer); o.connect(f); f.connect(g); ziel(g); },
  flaeche(t,noten,dauer,v){ const f=AC.createBiquadFilter(), g=hk(); f.type='lowpass'; f.frequency.value=1300;
    g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.09*v,t+0.35); g.gain.setValueAtTime(0.09*v,t+dauer-0.3); g.gain.linearRampToValueAtTime(0.0001,t+dauer+0.4);
    for(const n of noten) for(const dt of [-6,6]){ const o=osz('sawtooth',mtof(n),t,dauer+0.5); o.detune.value=dt; o.connect(f); }
    f.connect(g); ziel(g,true); },
  epiano(t,noten,v){ for(const n of noten){ const o=osz('sine',mtof(n),t,0.9), o2=osz('triangle',mtof(n+12),t,0.5), g=hk(), g2=hk();
    env(g,t,0.004,0.12*v,0.85); env(g2,t,0.002,0.04*v,0.35); o.connect(g); o2.connect(g2); ziel(g,true); ziel(g2); } },
  zupf(t,n,dauer,v){ const o=osz('square',mtof(n),t,dauer+0.2), f=AC.createBiquadFilter(), g=hk();
    f.type='lowpass'; f.frequency.setValueAtTime(3200,t); f.frequency.exponentialRampToValueAtTime(700,t+0.25);
    env(g,t,0.003,0.13*v,Math.max(0.2,dauer)); o.connect(f); f.connect(g); ziel(g,true); },
  glocke(t,n,v){ const tr=osz('sine',mtof(n),t,1.8), mo=osz('sine',mtof(n)*3.5,t,1.8), mg=hk(), g=hk();
    mg.gain.setValueAtTime(mtof(n)*2.2,t); mg.gain.exponentialRampToValueAtTime(1,t+1.2); mo.connect(mg); mg.connect(tr.frequency);
    env(g,t,0.002,0.16*v,1.6); tr.connect(g); ziel(g,true); },
  saege(t,n,dauer,v){ const f=AC.createBiquadFilter(), g=hk(); f.type='lowpass'; f.frequency.value=2600;
    for(const dt of [-9,0,9]){ const o=osz('sawtooth',mtof(n),t,dauer+0.1); o.detune.value=dt; o.connect(f); }
    env(g,t,0.01,0.06*v,dauer+0.1); f.connect(g); ziel(g,true); },
  chip(t,n,dauer,v){ const o=osz('square',mtof(n),t,dauer), g=hk(); env(g,t,0.002,0.07*v,dauer); o.connect(g); ziel(g); }
};
/* Akkord als Tonstufen ueber dem Grundton des Stuecks */
function akkord(s,d,oktave){ return [0,2,4].map(k=>s.ton+oktave*12+stufe(s.skala,d+k)); }
/* Wie viel gerade spielt: Einleitung, voller Teil, Refrain, Pause */
function musikTeil(takt){ const a=Math.floor(takt/8)%4; return ['intro','a','b','bruch'][a]; }
function spielSchritt(s,schritt,t){
  const sec=60/s.bpm/4, takt=Math.floor(schritt/16), i=schritt%16, grad=s.prog[takt%8], tl=musikTeil(takt);
  const voll=tl==='a'||tl==='b', mot=tl==='b'?s.motivB:s.motivA;
  const grund=s.ton-12+stufe(s.skala,grad);
  /* Melodie aus dem Motiv; Laenge bis zum naechsten Ton */
  const melodie=()=>{ if(tl==='intro'&&takt%8<4) return; const m=mot[i]; if(m===null||m==='-') return;
    let L=1; while(i+L<16&&mot[i+L]==='-') L++;
    const n=s.ton+12+stufe(s.skala,grad+m);
    return {n,d:L*sec}; };
  const mel=melodie();
  if(s.stil==='funk'){
    if(i===0||i===10) KLANG.kick(t,1); if(voll&&i===7) KLANG.kick(t,0.6);
    if(i===4||i===12) KLANG.snare(t,tl==='bruch'?0.4:1);
    if(i%2===0) KLANG.hat(t,i%4===2?0.9:0.5);
    const bm=[0,null,null,12,null,null,0,null,7,null,0,null,null,12,10,null][i];
    if(bm!==null&&tl!=='bruch') KLANG.bass(t,grund+bm,sec*1.6,1,'sawtooth');
    if((i===2||i===6||i===10||i===14)&&voll) KLANG.epiano(t,akkord(s,grad,0),1);
    if(i===0) KLANG.flaeche(t,akkord(s,grad,0),sec*16,tl==='bruch'?1.2:0.7);
    if(mel) KLANG.zupf(t,mel.n,mel.d,1);
  } else if(s.stil==='winter'){
    if(i===0) KLANG.kick(t,0.55); if(voll&&i===8) KLANG.kick(t,0.4);
    if(voll&&(i===4||i===12)) KLANG.snare(t,0.35);
    if(voll&&i%4===2) KLANG.hat(t,0.35);
    if(i===0||i===8) KLANG.bass(t,grund,sec*7,0.8,'triangle');
    if(i===0) KLANG.flaeche(t,akkord(s,grad,0),sec*16,1);
    if(i%4===0&&tl!=='bruch') KLANG.glocke(t,akkord(s,grad,1)[(i/4)%3],0.45);
    if(mel) KLANG.glocke(t,mel.n+12,1);
  } else if(s.stil==='dance'){
    if(i%4===0&&tl!=='bruch') KLANG.kick(t,1);
    if(i===4||i===12) KLANG.clap(t,tl==='bruch'?0.5:1);
    if(i%4===2) KLANG.hat(t,0.9,true); else if(voll) KLANG.hat(t,0.35);
    if(i%4===2&&tl!=='intro') KLANG.bass(t,grund,sec*1.8,1,'sawtooth');
    if(i===0) KLANG.flaeche(t,akkord(s,grad,0),sec*16,tl==='bruch'?1.4:0.8);
    if(voll&&i%2===0){ const ak=akkord(s,grad,1); KLANG.zupf(t,ak[(i/2)%3],sec*1.5,0.6); }
    if(mel) KLANG.saege(t,mel.n,mel.d,1);
  } else {
    if(i===0||i===8||(voll&&i===11)) KLANG.kick(t,0.8);
    if(i===4||i===12) KLANG.snare(t,0.7);
    if(i%2===0) KLANG.hat(t,0.5);
    const b=[0,12,7,12][(i/2|0)%4];
    if(i%2===0&&tl!=='bruch') KLANG.chip(t,grund+b,sec*1.6,1.3);
    if(voll){ const ak=akkord(s,grad,1); KLANG.chip(t,ak[i%3],sec*0.9,0.5); }
    if(mel) KLANG.chip(t,mel.n+12,mel.d*0.9,1.2);
  }
}
/* Nach so vielen Takten kommt das naechste Stueck */
const MUSIK_TAKTE=48;
let mZiel=-1;
function musikLautstaerke(){ if(!mBus) return; /* jedes Stueck hat seinen Pegel, damit keins lauter ist als das andere */
  const st=STUECKE[MUSIK.stueck]||STUECKE[0], z=MUSIK.an&&!document.hidden?MUSIK.vol*0.55*(st.pegel||1):0; if(z===mZiel) return; mZiel=z; mBus.gain.setTargetAtTime(z,AC.currentTime,0.25); }
function musikTick(){
  if(!AC||!MUSIK.an||document.hidden||AC.state!=='running') return;
  if(!musikBus()) return;
  const s=STUECKE[((MUSIK.stueck%STUECKE.length)+STUECKE.length)%STUECKE.length];
  if(mNext<AC.currentTime) mNext=AC.currentTime+0.08;
  const sec=60/s.bpm/4;
  while(mNext<AC.currentTime+0.3){
    try{ spielSchritt(s,mStep,mNext); }catch(e){}
    mNext+=sec; mStep++;
    if(mStep%16===0){ mTakte++; if(mTakte>=MUSIK_TAKTE){ musikWeiter(true); return; } }
  }
}
function musikWeiter(auto){
  MUSIK.stueck=(MUSIK.stueck+1)%STUECKE.length; mStep=0; mTakte=0; if(AC) mNext=AC.currentTime+(auto?1.2:0.3);
  musikSpeichern(); musikAnzeige();
  if(!auto&&typeof toast==='function') toast('♪ '+STUECKE[MUSIK.stueck].name);
}
function musikAn(an){
  MUSIK.an=an===undefined?!MUSIK.an:!!an; musikSpeichern();
  if(MUSIK.an){ ac(); musikBus(); mStep=0; mTakte=0; if(AC) mNext=AC.currentTime+0.1; }
  musikLautstaerke(); musikAnzeige();
  if(typeof toast==='function') toast(MUSIK.an?'♪ Musik an: '+STUECKE[MUSIK.stueck].name:'Musik aus');
}
function musikVol(v){ MUSIK.vol=clamp(v,0,1); musikSpeichern(); musikLautstaerke(); musikAnzeige(); }
function musikAnzeige(){
  const n=STUECKE[MUSIK.stueck]?STUECKE[MUSIK.stueck].name:'';
  const b=document.getElementById('musikBtn'); if(b){ b.textContent=MUSIK.an?'♪ '+n:'♪ aus'; b.classList.toggle('aus',!MUSIK.an); }
  const pm=document.getElementById('pMusikAn'); if(pm) pm.textContent=MUSIK.an?'Musik an':'Musik aus';
  const pn=document.getElementById('pMusikName'); if(pn) pn.textContent=MUSIK.an?'Läuft: '+n:'Stumm';
  const pv=document.getElementById('pMusikVol'); if(pv&&document.activeElement!==pv) pv.value=Math.round(MUSIK.vol*100);
}
setInterval(()=>{ musikTick(); if(mBus) musikLautstaerke(); },40);
document.addEventListener('visibilitychange',()=>{ if(mBus) musikLautstaerke(); });
musikAnzeige();
