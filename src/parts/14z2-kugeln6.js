/* =========================================================
   Kugelbomben-Runde 6 (Tom, 09.10.2026 nachmittags, nach V122,
   docs/uebergabe/kugelbomben-0910b.md). Daten/Preise: 02i-kugeln6.js,
   Verpackung: 04k-form-kugeln6.js.
   1. KNALL NEU. Tom: "Der Bruchknall klingt wie ein Schalldaempfer-
      Schuss - ich will eine tiefe, echte Explosion, ein richtiges WUMMS/
      BOOM, gerade bei den grossen. Vorbild Urknall, aber jede anders."
      Gemessen (09.10., OfflineAudioContext, __kg5.messen): der alte
      Bruchknall (Runde 5) hatte seine Energie in Rauschen - ein
      Hochpass-Zischen (Crack, 2,4-5,2 kHz) und tiefpassgefiltertes
      Rauschen unter ~300 Hz, dazu ein leiser Sinus. Das ist genau der
      Klang eines Schalldaempfers: "Pfft" ohne Druckstoss. Ein Laptop-
      Lautsprecher gibt unter ~200 Hz fast nichts wieder - uebrig blieb
      das Zischen.
      Wie eine echte Kugelbombe klingt (Quellen):
      - Der Bruch ist ein Luftstoss (Friedlander-Welle): ein senkrechter
        Druckanstieg, dann Abfall in einen Unterdruck. Eine 75-mm-Salute
        auf ~100 m hat eine Periode um 7 ms (~140 Hz) - je laenger die
        Phase, desto mehr "weicher Boom" statt "scharfer Knall", und
        desto staerker der Schlag in der Brust (K. L. & B. J. Kosanke,
        "Firework Salute Sound Characteristics and Perception", Journal
        of Pyrotechnics 34, jpyro.co.uk).
      - Bodennah gemessen: Bruchknall breitbandig, Tiefton-Pegel bis
        125 dB mit Spitze bei 16-25 Hz (Infraschall, Fenster klirren),
        grosse Kaliber tiefer (Yamada u. a., J. Occup. Health 58 (2016),
        "Noise and low-frequency sound levels due to aerial fireworks").
      - Die Luft schluckt Hoehen: 125 Hz 0,45 dB/100 m, 2 kHz 9,9, 8 kHz
        104 dB/100 m (ebd. Kosanke) - aus 90 m kommt kein Zischen an,
        nur Knack und Wumms.
      - Danach rollt der Schall: Reflexionen von Haeusern (20-80 ms),
        spaete Rueckwuerfe von Waldrand/Huegeln (Hunderte ms bis
        Sekunden), Donnerrollen; Licht kommt vor dem Schall (schall()).
      - Klanggestaltung fuer kleine Lautsprecher: Tiefton mit Ober-
        toenen (Saettigung) in 80-250 Hz, Koerper 150-800 Hz, kurzer
        Anschlag, Kompressor, Hall nur auf Koerper/Rollen (sonusgearflow.
        com "How to Build Explosions Patches", "Layer Harmonic Content
        for Rich Impacts"; tonalux.org "Layering Techniques for Impact
        Sounds").
      Neuer Aufbau je Knall (k6Knall): DRUCKSTOSS (gerechnete Friedlander-
      Welle mit Bodenreflexion, Periode 6-22 ms je Kaliber), ANSCHLAG
      (kurzer Knack 1,2-3 kHz statt Zischen), TIEFTON (Sinus mit Fall,
      durch einen tanh-Saettiger: Obertoene 2f/3f/5f, die ein Laptop
      spielt), KOERPER (rosa Rauschen, saettigt), DONNERROLLEN (an- und
      abschwellendes Grollen, 1-7 s) und RAUM (Faltungshall: Strasse mit
      Haeusern, Tal mit Echo vom Waldrand, Donner). Alles laeuft ueber
      einen gemeinsamen Kompressor (keine Uebersteuerung, auch wenn
      mehrere Kugeln gleichzeitig brechen). Der Monster-Schlag des
      Urknalls (Toms Vorbild) bleibt unveraendert.
   2. GROESSER: alle Kugeln (K6_RAUM unten, Tabelle vorher/nachher in
      UEBERGABE.md 5.3).
   3. RAUS: Aurora, Granatapfel, Sonnensturm, Drachennest (02i).
      Silberdistel NEU, Fackelhimmel mit echten Flammenzungen.
   4. NEU: acht Koenigsklasse-Kugeln (Level 27-30), mehrstufig, jede mit
      eigenem Monster-Knall - Steigerung bis zum Himmelssturz.
   ========================================================= */

/* =========================================================
   1. Der Knall
   ========================================================= */
/* Werk je AudioContext und Hauptregler: Eingang -> Hochpass 28 Hz (der
   unhoerbare Infraschall frisst sonst Aussteuerung) -> Kompressor ->
   Ausgang; drei Faltungsraeume speisen denselben Eingang. Ruhige
   Faltungsknoten rechnet der Browser nicht (Stille + Nachhallzeit). */
const K6_WERKE=new WeakMap();
let K6_AUS=false;
function k6Werk(){ if(!AC) return null; let w=K6_WERKE.get(AC); if(w&&w.master===master) return w;
  const ein=AC.createGain(), hp=AC.createBiquadFilter(), k=AC.createDynamicsCompressor(), auf=AC.createGain(), lim=AC.createDynamicsCompressor();
  hp.type='highpass'; hp.frequency.value=K6_BUS.hp; hp.Q.value=0.7;
  k.threshold.value=K6_BUS.thr; k.knee.value=12; k.ratio.value=4; k.attack.value=0.004; k.release.value=0.4;
  auf.gain.value=K6_BUS.auf;
  /* Begrenzer: kein Ausschlag ueber -1 dB vor dem Hauptregler (0,7) */
  lim.threshold.value=K6_BUS.lim; lim.knee.value=0; lim.ratio.value=20; lim.attack.value=0.0005; lim.release.value=0.15;
  ein.connect(hp); hp.connect(k); k.connect(auf); auf.connect(lim); lim.connect(master);
  w={master,ein,raum:{},sat:{}};
  for(const r of ['stadt','tal','donner']){ const c=AC.createConvolver(); c.normalize=false; c.buffer=k6IR(AC,r); c.connect(ein); w.raum[r]=c; }
  K6_WERKE.set(AC,w); return w; }
/* Abstimmung (gemessen 09.10.): Tiefton unter ~60 Hz frisst Aussteuerung
   (der Kompressor duckt dann alles), hoerbar wird der Boom in 80-1000 Hz */
const K6_BUS={hp:42,thr:-20,auf:0.9,lim:-1,tief:0.6,koerperF2:1.6,rollF:1.35,mitte:1.6};
/* Raumantworten (Stereo), einmal gerechnet:
   stadt  - dichte fruehe Reflexionen von Hauswaenden (35-380 ms), kurzer Nachhall
   tal    - wenige klare Echos vom Waldrand/Huegel (0,4-2,7 s), dumpf
   donner - rollendes Grollen: Wellen, die an- und abschwellen (bis 5,5 s) */
function k6IR(ac,typ){ const sr=ac.sampleRate, T={stadt:2.4,tal:4.2,donner:5.6}[typ], n=Math.floor(sr*T), b=ac.createBuffer(2,n,sr);
  let seed=typ.length*7919+13; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  for(let ch=0;ch<2;ch++){ const d=b.getChannelData(ch), blips=[], wellen=[];
    if(typ==='stadt'){ for(let k=0;k<13;k++){ const t=0.035+Math.pow(rnd(),1.3)*0.35; blips.push([t,0.6*Math.exp(-t/0.22)*(0.45+0.55*rnd()),0.004+rnd()*0.006]); } }
    if(typ==='tal'){ for(let k=0;k<4;k++){ const t=0.08+rnd()*0.14; blips.push([t,0.25*(0.5+rnd()*0.5),0.01]); }
      [[0.42,0.5],[0.78,0.4],[1.25,0.3],[1.85,0.2],[2.6,0.12]].forEach(([t,a])=>blips.push([t*(0.92+rnd()*0.16),a,0.04+rnd()*0.05])); }
    if(typ==='donner'){ for(let k=0;k<11;k++){ const t=0.12+Math.pow(rnd(),0.8)*4.4; wellen.push([t,(0.4+0.6*rnd())*Math.exp(-t/2.2),0.15+rnd()*0.45]); } }
    let lp=0, lp2=0;
    for(let i=0;i<n;i++){ const t=i/sr, w=rnd()*2-1; let a=0;
      for(const [t0,A,L] of blips){ const x=t-t0; if(x>=0&&x<L*5) a+=A*Math.exp(-x/L); }
      if(typ==='stadt') a+=t>0.05?0.13*Math.exp(-(t-0.05)/0.55):0;
      if(typ==='tal') a+=t>0.06?0.06*Math.exp(-t/1.3):0;
      if(typ==='donner'){ for(const [t0,A,L] of wellen){ const x=(t-t0)/L; if(x>-3&&x<3) a+=A*Math.exp(-x*x); } a+=0.08*Math.exp(-t/1.8); }
      /* Luft schluckt Hoehen: je spaeter, desto dumpfer */
      const fc=typ==='stadt'?Math.max(350,4200*Math.exp(-t/0.35)):typ==='tal'?Math.max(180,1600*Math.exp(-t/0.6)):Math.max(90,420*Math.exp(-t/1.2));
      const al=1-Math.exp(-2*Math.PI*fc/sr); lp+=(w*a-lp)*al; lp2+=(lp-lp2)*al; d[i]=lp2; }
    /* Energie auf 1 (der Raum gibt so viel Energie zurueck, wie hineingeht) */
    let e=0; for(let i=0;i<n;i++) e+=d[i]*d[i]; const s=1/Math.sqrt(e||1); for(let i=0;i<n;i++) d[i]*=s; }
  return b; }
/* tanh-Saettiger: Obertoene fuer kleine Lautsprecher */
function k6Sat(w,drive){ const key=Math.round(drive*2)/2; if(w.sat[key]) return w.sat[key];
  const N=2048, c=new Float32Array(N), k=Math.max(0.5,key), nt=Math.tanh(k); for(let i=0;i<N;i++){ const x=i/(N-1)*2-1; c[i]=Math.tanh(k*x)/nt; }
  return (w.sat[key]=c); }
/* Druckstoss: Friedlander-Welle p(t)=(1-t/T)e^(-1,3t/T), dann Unterdruck,
   dazu die Bodenreflexion (~9 ms spaeter, 0,6) - je Periode einmal gerechnet */
const K6_PULS=new WeakMap();
function k6PulsBuf(ms){ let m=K6_PULS.get(AC); if(!m){ m={}; K6_PULS.set(AC,m); } const key=Math.round(ms); if(m[key]) return m[key];
  const sr=AC.sampleRate, Tp=key/1000*0.4, Tn=key/1000*0.6, n=Math.floor(sr*(Tp+Tn+0.03)), b=AC.createBuffer(1,n,sr), d=b.getChannelData(0);
  const welle=t=>t<0?0:t<Tp?(1-t/Tp)*Math.exp(-1.3*t/Tp):t<Tp+Tn?-0.42*Math.sin(Math.PI*(t-Tp)/Tn):0;
  for(let i=0;i<n;i++){ const t=i/sr; d[i]=welle(t)+0.6*welle(t-0.009); }
  return (m[key]=b); }
/* Bausteine; at = Start ab jetzt (Audio-Uhr), z = Ziel (Knallknoten) */
function k6Puls(z,at,ms,vol,lp){ const t=AC.currentTime+at, s=AC.createBufferSource(), f=AC.createBiquadFilter(), g=AC.createGain();
  s.buffer=k6PulsBuf(ms); f.type='lowpass'; f.frequency.value=lp; f.Q.value=0.5; g.gain.value=vol;
  s.connect(f); f.connect(g); g.connect(z); s.start(t); klangMelden(at,vol*1.2,700,'bandpass','k6Puls'); }
function k6Tief(w,z,at,f0,f1,dur,vol,drive){ const t=AC.currentTime+at, o=AC.createOscillator(), g=AC.createGain(), sh=AC.createWaveShaper(), lp=AC.createBiquadFilter(), g2=AC.createGain();
  o.type='sine'; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur*0.7);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(drive,t+0.006); g.gain.exponentialRampToValueAtTime(drive*0.0003,t+dur);
  sh.curve=k6Sat(w,drive); sh.oversample='2x'; lp.type='lowpass'; lp.frequency.value=1400; g2.gain.value=vol;
  o.connect(g); g.connect(sh); sh.connect(lp); lp.connect(g2); g2.connect(z); o.start(t); o.stop(t+dur+0.05);
  klangMelden(at,vol*1.5,Math.sqrt(f0*f1)*3,'ton','k6Tief'); }
function k6Rausch(z,at,o,sat,w){ const t=AC.currentTime+at, d=o.dur, s=AC.createBufferSource(), f=AC.createBiquadFilter(), g=AC.createGain();
  s.buffer=o.rosa?rosaRausch():weissBuf(); s.loop=d>1.2; f.type=o.typ||'lowpass'; f.frequency.setValueAtTime(o.f,t); if(o.f2) f.frequency.exponentialRampToValueAtTime(o.f2,t+d); if(o.q) f.Q.value=o.q;
  if(o.wellen){ /* Donnerrollen: Wellen schwellen an und ab */ g.gain.setValueAtTime(0.0001,t); let tt=t;
    for(const [dt,a,an,ab] of o.wellen){ tt=t+dt; g.gain.setTargetAtTime(o.vol*a,tt,an); g.gain.setTargetAtTime(o.vol*a*0.25,tt+an*2.5,ab); }
    g.gain.setTargetAtTime(0.0001,t+d*0.85,d*0.06); }
  else { g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(o.vol,t+(o.an||0.004)); g.gain.exponentialRampToValueAtTime(0.0001,t+d); }
  let k=g; if(sat){ const sh=AC.createWaveShaper(), g2=AC.createGain(); sh.curve=k6Sat(w,sat); g2.gain.value=1/Math.max(1,sat*0.6); g.connect(sh); sh.connect(g2); k=g2; }
  s.connect(f); f.connect(g); k.connect(z); s.start(t,Math.random()*0.4); s.stop(t+d+0.1);
  klangMelden(at,o.vol,o.f2?Math.sqrt(o.f*o.f2):o.f,o.typ||'lowpass','k6Rausch'); }
/* Wellen fuer das Donnerrollen: n Schwellungen ueber dur s, die erste kraeftig */
function k6Wellen(n,dur){ const L=[]; for(let i=0;i<n;i++){ const u=i/Math.max(1,n-1), dt=i?bkV(0.12,0.95)*dur*Math.pow(u,1.1)+0.05:0.03;
    L.push([dt,i?bkV(0.45,0.95)*Math.exp(-u*1.4):1,bkV(0.05,0.14),bkV(0.18,0.45)]); }
  return L.sort((a,b)=>a[0]-b[0]); }
/* Ein Knall nach Rezept o (Lautstaerke am Ohr v):
   P   Periode des Druckstosses (ms), puls Lautstaerke, lp Tiefpass (Hz)
   tief [f0, f1, Dauer, vol, Saettigung]   Sinus mit Fall
   koerper [vol, Hz, Hz2, Dauer]          rosa Rauschen, gesaettigt
   knack [vol, Hz, Dauer]                 kurzer Anschlag (Bandpass)
   mitte [vol, Hz, Dauer]                 Krachen in der Mitte (Bandpass, gesaettigt)
   roll [vol, Dauer, Wellen, Hz]          Donnerrollen
   raum 'stadt'|'tal'|'donner', hall Anteil (0..1)
   doppel [s, Faktor]  zweiter Schlag;  schlaege [[s, Faktor], ...] weitere
   knister/zisch/zusatz wie Runde 5 */
function k6Knall(o,v,at0){ const w=k6Werk(); if(!w) return; at0=at0||0;
  const k=bkV(0.94,1.06)*(o.f||1), L=k5Laut(v)*(o.laut||1), z=AC.createGain(); z.gain.value=L; z.connect(w.ein);
  if(o.raum){ const s=AC.createGain(); s.gain.value=o.hall===undefined?0.6:o.hall; z.connect(s); s.connect(w.raum[o.raum]); }
  const schlag=(at,f)=>{
    if(o.P) k6Puls(z,at,o.P/k,(o.puls||0.8)*f,(o.lp||3000)*k);
    if(o.knack) k6Rausch(z,at,{dur:o.knack[2],vol:o.knack[0]*f,typ:'bandpass',f:o.knack[1]*k,q:0.8});
    if(o.mitte) k6Rausch(z,at+0.003,{dur:o.mitte[2]*bkV(0.9,1.1),vol:o.mitte[0]*f*K6_BUS.mitte,typ:'bandpass',f:o.mitte[1]*k,f2:o.mitte[1]*k*0.6,q:0.7,rosa:true},2,w);
    if(o.tief) k6Tief(w,z,at+0.002,o.tief[0]*k,o.tief[1]*k,o.tief[2]*bkV(0.92,1.08),o.tief[3]*f*K6_BUS.tief,o.tief[4]||3);
    if(o.koerper) k6Rausch(z,at+0.004,{dur:o.koerper[3]*bkV(0.9,1.1),vol:o.koerper[0]*f,f:o.koerper[1]*k,f2:o.koerper[2]*k*K6_BUS.koerperF2,rosa:true,an:0.01},o.koerperSat||2.5,w); };
  schlag(at0,1);
  if(o.doppel) schlag(at0+o.doppel[0]*bkV(0.9,1.1),o.doppel[1]);
  if(o.schlaege) o.schlaege.forEach(([t,f])=>schlag(at0+t*bkV(0.95,1.05),f));
  if(o.roll) k6Rausch(z,at0+0.02,{dur:o.roll[1]*bkV(0.9,1.1),vol:o.roll[0],f:(o.roll[3]||220)*k*K6_BUS.rollF,f2:(o.roll[3]||220)*k*0.5*K6_BUS.rollF,rosa:true,wellen:k6Wellen(o.roll[2]||5,o.roll[1])},2,w);
  if(o.knister) bkKn(at0+o.knister[1],at0+o.knister[2],Math.round(o.knister[0]*bkV(0.85,1.15)),o.knister[3]*L);
  if(o.zisch) bkR(at0+0.08,{dur:o.zisch[1]*bkV(0.9,1.1),vol:o.zisch[0]*L,typ:'highpass',f:4200*k,rosa:true,an:0.15});
  if(o.zusatz&&sfx[o.zusatz]&&!at0) sfx[o.zusatz](v,1);
}
/* der Runde-5-Knall bleibt fuer die Gegenprobe (kugelknall.js '{"alt5":true}')
   und fuer Toms Vorbild, den Monster-Schlag des Urknalls */
const k5KnallAlt=k5Knall;
let K6_ALT5=false;
k5Knall=function(o,v){ if(o.v5||!o.k6) return k5KnallAlt(o,v);
  if(K6_ALT5||K6_AUS) return k5KnallAlt(o.alt5||K6_ALT5_STD,v);
  return k6Knall(o,v); };
/* neue Kugeln hatten keinen Runde-5-Knall: Gegenprobe mit dem alten Kanonenschlag */
const K6_ALT5_STD=Object.assign({art:'kanone'},KNALL5_ART.kanone,{f:0.9,laut:1.15,blitz:1.3});
KNALL5_MONSTER.v5=true;

/* Klangarten (Grundrezepte) - jede Kugel waehlt eine und aendert sie ab */
const K6_ART={
  /* Kanonenschlag: harter, langer Druckstoss, Strasse mit Haeusern */
  kanone:{P:12,puls:0.95,lp:2600,knack:[0.52,2200,0.018],mitte:[0.4,850,0.3],tief:[70,36,0.7,0.4,4],koerper:[0.5,420,90,0.9],roll:[0.3,2.2,5,200],raum:'stadt',hall:0.55},
  /* Peitsche: kurze Periode, heller Knack, hartes Echo von den Haeusern */
  peitsche:{P:7,puls:1.0,lp:4200,knack:[0.83,3000,0.012],mitte:[0.4,850,0.3],tief:[95,48,0.4,0.3,3],koerper:[0.35,700,160,0.5],roll:[0.22,1.6,4,260],raum:'stadt',hall:0.75},
  /* Dumpf: lange Periode, viel Tiefton, Donner */
  dumpf:{P:18,puls:0.85,lp:1900,knack:[0.3,1500,0.02],mitte:[0.6,620,0.45],tief:[56,30,1.0,0.5,5],koerper:[0.65,300,70,1.3],roll:[0.38,3.2,6,170],raum:'donner',hall:0.5},
  /* Donner: Schlag und langes Rollen */
  donner:{P:14,puls:0.9,lp:2200,knack:[0.45,1900,0.02],mitte:[0.4,850,0.3],tief:[62,32,0.85,0.42,4],koerper:[0.5,380,80,1.0],roll:[0.5,4.5,8,180],raum:'donner',hall:0.6},
  /* Doppel: Kern und Schale */
  doppel:{P:11,puls:0.9,lp:2800,knack:[0.52,2300,0.015],mitte:[0.4,850,0.3],tief:[76,38,0.6,0.38,3.5],koerper:[0.45,480,110,0.7],roll:[0.25,1.8,4,210],raum:'stadt',hall:0.5,doppel:[0.13,0.75]},
  /* Knister: Schlag, dann knistern die Sterne */
  knister:{P:10,puls:0.9,lp:3000,knack:[0.52,2500,0.015],mitte:[0.4,850,0.3],tief:[80,40,0.5,0.36,3],koerper:[0.42,520,120,0.7],roll:[0.22,1.8,4,220],raum:'stadt',hall:0.5,knister:[26,0.25,1.6,0.16]},
  /* Zisch: Schlag und Glitzerrauschen */
  zisch:{P:11,puls:0.9,lp:2800,knack:[0.48,2300,0.016],mitte:[0.4,850,0.3],tief:[74,38,0.6,0.38,3.5],koerper:[0.45,460,100,0.8],roll:[0.26,2.0,5,200],raum:'stadt',hall:0.5,zisch:[0.1,1.6]},
  /* Hall: Schlag, Echo vom Waldrand */
  hall:{P:13,puls:0.9,lp:2400,knack:[0.42,2000,0.02],mitte:[0.4,850,0.3],tief:[66,34,0.75,0.42,4],koerper:[0.5,400,90,0.9],roll:[0.3,2.6,5,190],raum:'tal',hall:0.95},
  /* Trommel: drei Schlaege kurz hintereinander */
  trommel:{P:12,puls:0.9,lp:2600,knack:[0.52,2100,0.016],mitte:[0.4,850,0.3],tief:[70,36,0.6,0.38,4],koerper:[0.45,420,100,0.7],roll:[0.3,2.4,5,200],raum:'stadt',hall:0.55,schlaege:[[0.09,0.65],[0.2,0.5]]}
};
/* je Kugel: Art und Abwandlung. f = Tonhoehe (x Frequenzen), laut,
   blitz (Zerlegerblitz), P (Periode: groessere Kugel, tieferer Boom) */
const K6_WAHL={
  kugel75:['doppel',{f:1.2,laut:0.61,blitz:0.6,P:8,zusatz:'herzton'}],
  silberdistel75:['peitsche',{f:1.15,laut:0.58,blitz:0.6,P:6.5,knister:[22,0.6,1.8,0.12]}],
  goldbrokat100:['zisch',{f:1.1,laut:1.1,blitz:0.7,P:9}],
  hummelschwarm75:['trommel',{f:1.2,laut:0.63,blitz:0.6,P:7.5,schlaege:[[0.07,0.55]],zisch:[0.08,1.6]}],
  kugel100:['dumpf',{f:1.1,laut:1.68,blitz:0.7,P:12,roll:[0.3,2.4,5,180]}],
  blauregen100:['hall',{f:1.12,laut:0.57,blitz:0.6,P:9.5}],
  fackelhimmel150:['dumpf',{f:0.98,laut:1.94,blitz:0.8,P:14,zisch:[0.06,3.0]}],
  crossettennetz150:['peitsche',{f:0.95,laut:0.78,blitz:0.9,P:9,roll:[0.28,2.2,5,240]}],
  tigerkrone150:['zisch',{f:0.92,laut:1.4,blitz:0.9,P:12,zisch:[0.14,2.4]}],
  farbcrossette150:['doppel',{f:1.0,laut:1.09,blitz:0.9,P:11,doppel:[0.17,0.7]}],
  wetterleuchten150:['donner',{f:0.95,laut:0.99,blitz:1.0,P:11,raum:'stadt'}],
  schatztruhe200:['kanone',{f:1.05,laut:1.39,blitz:1.0,P:13}],
  kronenkranz200:['hall',{f:0.98,laut:1.19,blitz:1.0,P:14}],
  zwillingssonne200:['doppel',{f:0.95,laut:1.28,blitz:1.0,P:13,doppel:[0.22,0.9]}],
  blitzpalme200:['dumpf',{f:1.0,laut:2.68,blitz:0.8,P:15}],
  goldweidenkreuz200:['hall',{f:1.02,laut:2.74,blitz:0.9,P:13,raum:'donner'}],
  bluetenhagel200:['knister',{f:1.05,laut:1.43,blitz:1.0,P:11,knister:[34,0.2,1.4,0.18]}],
  kugel300:['peitsche',{f:0.85,laut:0.62,blitz:1.2,P:12,raum:'tal',hall:0.9,roll:[0.4,3.0,6,220]}],
  ringnebel300:['doppel',{f:0.85,laut:1.27,blitz:1.2,P:15,doppel:[0.16,0.85],raum:'tal',hall:0.8}],
  kanonade300:['trommel',{f:0.95,laut:1.32,blitz:1.2,P:15}],
  sternensturm300:['donner',{f:1.0,laut:2.51,blitz:1.2,P:16}],
  riesenpalme300:['dumpf',{f:0.85,laut:2.6,blitz:1.0,P:20,tief:[46,20,1.4,0.75,5]}],
  kometensturm300:['zisch',{f:0.9,laut:1.52,blitz:1.2,P:16,zisch:[0.14,2.6],roll:[0.42,3.6,7,190]}],
  urknall300:['kanone',{f:0.9,laut:2.59,blitz:1.3,P:16}]
};
/* der Runde-5-Knall jeder Kugel bleibt am neuen Rezept haengen (alt5) - fuer die Gegenprobe */
for(const id in K6_WAHL){ const [art,o]=K6_WAHL[id], alt=KNALL5[id]; KNALL5[id]=Object.assign({art,k6:true,alt5:alt||null},K6_ART[art],o); }

/* ---------- Messen (kugelknall.js, Runde 6) ----------
   Der Knall wird in einem OfflineAudioContext gerechnet (alle Bausteine
   laufen auf der Audio-Uhr) und ausgewertet:
   spitze  hoechster Ausschlag am Ausgang (nach dem Hauptregler 0,7)
   energie Summe der Quadrate (s)
   laptop  Energie, die ein Laptop-Lautsprecher wiedergibt (Hochpass
           2. Ordnung 200 Hz, Tiefpass 12 kHz), davon
   boom    der Anteil 80-700 Hz (Wumms/Druck) und
   zisch   der Anteil ueber 2,5 kHz (Zischen)
   lautA   die Laptop-Energie nach Gehoer gewichtet (A-Kurve, x 10000) -
           ein grobes Mass fuer die Lautheit
   tief    Energie unter 150 Hz (Brust, grosse Lautsprecher)
   schwer  Schwerpunkt des Spektrums (Hz)
   dauer   Zeit, bis der Pegel 30 dB unter der Spitze bleibt (s) */
function k6Fft(re,im){ const n=re.length; for(let i=1,j=0;i<n;i++){ let b=n>>1; for(;j&b;b>>=1) j^=b; j^=b; if(i<j){ let t=re[i]; re[i]=re[j]; re[j]=t; t=im[i]; im[i]=im[j]; im[j]=t; } }
  for(let len=2;len<=n;len<<=1){ const a=-2*Math.PI/len, wr=Math.cos(a), wi=Math.sin(a);
    for(let i=0;i<n;i+=len){ let cr=1, ci=0; for(let j=0;j<len/2;j++){ const u=i+j, v=u+len/2, xr=re[v]*cr-im[v]*ci, xi=re[v]*ci+im[v]*cr;
      re[v]=re[u]-xr; im[v]=im[u]-xi; re[u]+=xr; im[u]+=xi; const nr=cr*wr-ci*wi; ci=cr*wi+ci*wr; cr=nr; } } } }
function k6Auswerten(buf){ const sr=buf.sampleRate, n=buf.length, a=buf.getChannelData(0), b=buf.numberOfChannels>1?buf.getChannelData(1):a;
  let sp=0, en=0; const m=new Float32Array(n); for(let i=0;i<n;i++){ const x=(a[i]+b[i])/2; m[i]=x; sp=Math.max(sp,Math.abs(a[i]),Math.abs(b[i])); en+=x*x/sr; }
  /* Dauer: Huellkurve in 20-ms-Fenstern */
  const W=Math.floor(sr*0.02); let mx=0; const env=[]; for(let i=0;i+W<=n;i+=W){ let e=0; for(let k=i;k<i+W;k++) e+=m[k]*m[k]; env.push(e/W); mx=Math.max(mx,e/W); }
  let last=0; env.forEach((e,i)=>{ if(e>mx*1e-3) last=i; });
  let N=1; while(N<n) N<<=1; const re=new Float32Array(N), im=new Float32Array(N); re.set(m); k6Fft(re,im);
  let lap=0, boom=0, zisch=0, tief=0, sw=0, s0=0, la=0;
  const aw=f=>{ const f2=f*f, r=148840000*f2*f2/((f2+424.36)*Math.sqrt((f2+11599.29)*(f2+544496.41))*(f2+148840000)); return r*1.2589; };
  for(let i=1;i<N/2;i++){ const f=i*sr/N, p=(re[i]*re[i]+im[i]*im[i])/N/sr*2, hp=Math.pow(f,4)/(Math.pow(f,4)+Math.pow(200,4)), lp=1/(1+Math.pow(f/12000,4)), q=p*hp*lp;
    lap+=q; la+=q*aw(f)*aw(f); if(f>=80&&f<=700) boom+=q; if(f>2500) zisch+=q; if(f<150) tief+=p; sw+=f*p; s0+=p; }
  return {spitze:+sp.toFixed(3),energie:+en.toFixed(4),laptop:+lap.toFixed(5),lautA:+(la*1e4).toFixed(2),boom:+boom.toFixed(5),zisch:+zisch.toFixed(5),boomAnteil:+(boom/(lap||1)).toFixed(3),zischAnteil:+(zisch/(lap||1)).toFixed(3),
    tief:+tief.toFixed(5),schwer:Math.round(sw/(s0||1)),dauer:+(last*0.02).toFixed(2)}; }
/* fn() spielt Klaenge ab jetzt; gerechnet werden dauer s */
async function k6Messen(fn,dauer){ if(!ac()) return null; const real=AC, rm=master, sr=48000, off=new OfflineAudioContext(2,Math.floor(sr*(dauer||8)),sr);
  const m=off.createGain(); m.gain.value=0.7; m.connect(off.destination);
  AC=off; master=m; const tw=timers.length; try{ fn(); } finally { AC=real; master=rm; }
  /* Teile, die mit later() geplant wurden (Zusatzklaenge), laufen offline nicht mit */
  const verpasst=timers.length-tw; timers.length=tw;
  const buf=await off.startRendering(); const r=k6Auswerten(buf); r.verpasst=verpasst; return r; }
/* Messung je Kugel: id, 'monster' (Urknall-Monster-Schlag mit Grollen),
   alt=true: der Runde-5-Knall derselben Kugel (Gegenprobe) */
function k6MessKnall(id,v,alt,nurHaupt,stufe){ v=v===undefined?0.19:v;
  return k6Messen(()=>{ const a=K6_ALT5; K6_ALT5=!!alt; try{
      if(stufe!==undefined&&stufe!==null){ const st=K6_MONSTER[id].stufen[stufe]; k6Knall(st[1],v); }
      else if(id==='monster'){ k5Knall(KNALL5_MONSTER,v); grollen(7,0.9*k5Laut(v),160,0.4); }
      else if(K6_MONSTER[id]) k6MonsterKnall(id,v,!nurHaupt);
      else if(KNALL5[id]) k5Knall(KNALL5[id],v); }
    finally { K6_ALT5=a; } },id==='monster'||(K6_MONSTER[id]&&!nurHaupt&&stufe==null)?12:8); }

/* =========================================================
   2. Silberdistel neu, Fackelhimmel mit Flammenzungen
   ========================================================= */
const k6F=()=>FW_RAUM?FW_RAUM.f:1;   /* Geschwindigkeiten, die ein Effekt spaeter direkt setzt, im Massstab des Bruchs */
/* Silberdistel 75 (L14, Tom: "neu machen"): eine Distel, die verblueht.
   Ein violetter Distelkopf, darum ein Kranz silberner Strahlen mit
   feiner Spur; nach 1,2 s loest sich an jeder Strahlspitze ein Flaum-
   buschel - fuenf, sechs silberweisse Glitzerfunken, die langsam
   davonschweben, vom Wind seitlich getragen, und dabei funkeln. */
EFF.silberdistel=function(p,A,B,s){ const q=QUAL(), G=1.8, T=1.25, n=Math.round(34*q)+16;
  const wind=[rand(-1,1),0,rand(-1,1)], wl=Math.hypot(wind[0],wind[2])||1;
  /* Distelkopf: dichte, kurze violette Sterne */
  nKugel(Math.round(22*q)+10,1.5*s,v=>k5Stern(p,v,[1.25,.35,1.7],rand(1.5,1.9),1.0,{spur:0.04,weiss:0.25}));
  nKugel(n,6.2*s,(v,i)=>{ k5Stern(p,v,[1.55,1.6,1.75],T,G,{spur:0.32,weiss:0.35});
    kgSpaeter(T*rand(0.96,1.02),()=>{ const e=sternNach(p,v[0],v[1],v[2],G,T), a=SCHWEIF; SCHWEIF=0.02;
      /* Flaumbueschel: zwei helle Koepfe und ein Woelkchen feiner Glitzerfaeden */
      SCHWEIF=0.18; for(let j=0;j<4;j++){ const sp=rand(0.3,0.8);
        psBig.emit(e.x,e.y,e.z,wind[0]/wl*1.1+rand(-sp,sp),rand(0.1,0.7),(wind[2]/wl*1.1+rand(-sp,sp)),1.95,1.95,2.1,rand(2.2,3.0),0.28,4); }
      SCHWEIF=0.12; for(let j=0;j<Math.round(9*q)+3;j++){ const d=randDir(), sp=rand(0.4,1.1);
        psMid.emit(e.x,e.y,e.z,wind[0]/wl*1.1+d[0]*sp,d[1]*sp+0.3,wind[2]/wl*1.1+d[2]*sp,1.45,1.48,1.6,rand(1.4,2.4),0.3,4); }
      SCHWEIF=a; }); });
  schall(p,x=>later(T,()=>sfx.rieseln(x*0.6,3))); };
EFF_SCHWEIF.silberdistel=0.3; EFF_FAMILIE.silberdistel='haenger';
/* Fackelhimmel 150 (Tom: "an sich geil, aber feine Textur viel besser -
   nicht ein paar Punkte am Himmel, echte lodernde Flammen"). Vorher war
   jede Flamme ein Kopf (psHuge) und 1-5 Zungen je 0,08 s - aus 100 m drei
   Punkte. Jetzt hat jede Flamme einen Leib: an ihrem Fuss entstehen alle
   0,05 s neue Flammenteilchen, die gleich schnell aufsteigen, sich nach
   oben spitz zusammenlaufen und dabei abkuehlen (weissgelb -> orange -> dunkelrot,
   Farbverlauf mode 2); ein weicher, dunkler Glutschein (psHuge) gibt
   der Flamme Volumen, die Zunge flackert seitlich (gemeinsamer Wind,
   eigener Takt), oben reissen Funken ab. So steht eine echte Flammen-
   zunge von 4-6 m am Himmel, die zuengelt und lodert. */
EFF.fackelhimmel=function(p,A,B,s){ const q=QUAL(), n=Math.round(6*s*q)+10, G=0.5, fl=[];
  nKugel(n,4.6*s,v=>{ const T=rand(8.2,9.6), h=kgStern(psHuge,p,v,[1.4,.62,.16],T,G,0,0.01); fl.push({h,T,ph:rand(0,6.3),om:rand(5,9),gr:rand(1.0,1.4)}); });
  const DT=0.05, F0=[2.3,1.9,1.1], F1=[2.2,1.05,.25], F2=[1.6,.38,.06], ROT=[.35,.05,.01];
  for(let t=0.1;t<9.6;t+=DT){ const tt=t;
    kgSpaeter(tt,()=>{ const a=SCHWEIF; SCHWEIF=0;
      for(const L of fl){ if(tt>L.T-0.15) continue; const e=k5Pos(L.h); if(!e) continue;
        const aus=tt>L.T-1.2?(L.T-tt)/1.2:1, flack=0.65+0.35*Math.sin(tt*L.om+L.ph)+rand(-0.15,0.15), hx=Math.sin(tt*2.3+L.ph)*0.8+Math.sin(tt*7.1+L.ph*2)*0.35, hz=Math.cos(tt*1.9+L.ph)*0.8+Math.cos(tt*6.3+L.ph)*0.35;
        /* Leib der Flamme: 7-10 Teilchen am Fuss, steigen 6-9 m/s und
           laufen zur Mitte zusammen (die Zunge wird oben spitz), kuehlen ab */
        const nz=Math.round((q>0.7?9:5)*aus*flack*L.gr)+1;
        for(let j=0;j<nz;j++){ const c=j%3?F1:F0, up=rand(5.5,9)*L.gr, r=rand(0,0.5)*L.gr, w=rand(0,6.3), ox=Math.cos(w)*r, oz=Math.sin(w)*r;
          psBig.emit(e.x+ox,e.y+rand(-.2,.2),e.z+oz,hx*0.5-ox*1.4+rand(-.12,.12),up,hz*0.5-oz*1.4+rand(-.12,.12),c[0]*flack,c[1]*flack,c[2]*flack,rand(0.4,0.7),-0.6,2,ROT[0],ROT[1],ROT[2]); }
        /* feine Flammenspitzen (psMid) - die Zunge franst nach oben aus */
        for(let j=0;j<Math.round(5*q*aus)+1;j++) psMid.emit(e.x+rand(-.2,.2),e.y+rand(1.5,3.5)*L.gr,e.z+rand(-.2,.2),hx*0.9+rand(-.3,.3),rand(5,8),hz*0.9+rand(-.3,.3),F2[0]*1.3,F2[1]*1.4,F2[2],rand(0.25,0.5),-0.6,2,0.2,0.02,0);
        /* Glutschein: weich und dunkelorange, gibt Volumen */
        if(Math.random()<0.45*aus) psHuge.emit(e.x,e.y+rand(0.5,2.0)*L.gr,e.z,hx*0.4,rand(3,5),hz*0.4,0.6*flack,0.22*flack,0.04,rand(0.3,0.5),-0.4,2,0.12,0.02,0);
        /* abreissende Funken */
        if(Math.random()<0.35*q) psMid.emit(e.x,e.y+rand(1,2.2),e.z,rand(-1.2,1.2),rand(2.5,5),rand(-1.2,1.2),1.7,1.25,.5,rand(0.5,1.0),0.6,4);
        kgFarbe(L.h,[1.4,.62,.16],0.6+0.5*flack*aus); }
      SCHWEIF=a; }); }
  for(const L of fl) kgSpaeter(L.T-0.1,()=>{ const e=k5Pos(L.h); if(e) k5Knister(e,Math.round(6*q)+3,1.6,[1.7,1.3,.6]); });
  /* der Zuendkern: ein kurzer Glutball, der sofort zerfaellt */
  for(let i=0;i<Math.round(40*q);i++){ const d=randDir(); kgStern(psBig,p,kgMal(d,rand(1.5,3)*s),F1,rand(0.5,0.9),1,0,0.05); }
  schall(p,x=>{ sfx.fauchen(x*0.6,7,false); later(1.2,()=>sfx.fauchen(x*0.4,6)); later(7.6,()=>{ sfx.crackle(x*0.6); later(0.6,()=>sfx.crackle(x*0.45)); later(1.3,()=>sfx.crackle(x*0.3)); }); }); };

/* =========================================================
   3. Acht neue Koenigsklasse-Kugeln (Level 27-30). Tom: "richtig
   intensiv, noch krasser als Urknall, jeweils mit verschiedenen
   Effekten in einer Bombe (mehrstufig), Steigerung bis zur teuersten".
   Jede hat einen eigenen Monster-Knall (K6_MONSTER: Hauptschlag und die
   Schlaege ihrer Stufen, je am Ort der Stufe - Licht vor Schall).
   ========================================================= */
/* Monster-Rezepte (Grundlage K6_ART, groesser): Periode bis 34 ms, Tiefton
   bis 16 Hz hinab, Rollen bis 8 s */
const K6_MON={
  sturm:{P:18,puls:1.0,lp:2200,knack:[0.4,1800,0.025],mitte:[0.55,700,0.5],tief:[50,22,1.4,0.8,6],koerper:[0.7,360,70,1.6],roll:[0.6,6,10,170],raum:'donner',hall:0.7,zisch:[0.1,4]},
  eisbruch:{P:11,puls:1.1,lp:4600,knack:[0.75,3200,0.012],mitte:[0.55,700,0.5],tief:[78,30,1.1,0.65,5],koerper:[0.5,620,100,1.0],roll:[0.45,4.8,7,240],raum:'tal',hall:1.1},
  faust:{P:22,puls:1.25,lp:2400,knack:[0.5,2000,0.02],mitte:[0.55,700,0.5],tief:[56,22,1.3,0.9,7],koerper:[0.75,380,70,1.4],roll:[0.5,5,8,180],raum:'stadt',hall:0.75},
  vulkan:{P:27,puls:1.0,lp:1300,knack:[0.25,1400,0.03],mitte:[0.55,700,0.5],tief:[42,18,2.1,0.95,6],koerper:[0.85,260,55,2.3],roll:[0.72,7,12,150],raum:'donner',hall:0.6},
  tiefraum:{P:25,puls:0.95,lp:1800,knack:[0.2,1600,0.025],mitte:[0.55,700,0.5],tief:[38,16,2.5,0.95,5],koerper:[0.6,300,60,2.0],roll:[0.62,7.5,9,160],raum:'tal',hall:1.15},
  brandung:{P:20,puls:1.05,lp:2000,knack:[0.35,1900,0.02],mitte:[0.55,700,0.5],tief:[48,22,1.5,0.85,6],koerper:[0.78,340,65,1.8],roll:[0.68,6.5,10,190],raum:'donner',hall:0.7},
  goetter:{P:30,puls:1.3,lp:2000,knack:[0.55,1900,0.03],mitte:[0.55,700,0.5],tief:[40,16,2.6,1.0,8],koerper:[0.9,320,50,2.6],roll:[0.85,8,13,160],raum:'donner',hall:0.75},
  sturz:{P:34,puls:1.4,lp:1900,knack:[0.6,1800,0.035],mitte:[0.55,700,0.5],tief:[36,15,3.0,1.1,9],koerper:[1.0,300,45,3.0],roll:[0.95,8.5,14,150],raum:'donner',hall:0.85}
};
/* die neuen Kugeln sind dichter als alle anderen (Tom: "richtig intensiv") */
const K6_DICHTE=1.8;
const K6_M=(art,o)=>Object.assign({art,k6:true},K6_MON[art],o||{});
/* je Kugel: haupt = Bruchknall (kk_<id>), stufen = [Zeit nach dem Bruch, Rezept, Name] */
const K6_MONSTER={
  herbststurm300:{haupt:K6_M('sturm',{f:1.0,laut:3.1,blitz:1.3}),stufen:[[0.9,K6_M('sturm',{f:1.25,laut:0.75,roll:[0.4,3.5,6,200],zisch:[0.16,3.5]}),'zuendschlag']]},
  eiszeit300:{haupt:K6_M('eisbruch',{f:1.0,laut:0.68,blitz:1.4}),stufen:[[1.6,K6_M('eisbruch',{f:1.2,laut:0.55,P:8,roll:[0.3,3.2,5,300]}),'eis bricht'],[4.2,K6_M('eisbruch',{f:1.4,laut:0.4,P:6,tief:null,roll:[0.22,2.6,4,320],knister:[40,0.1,2.2,0.06]}),'eisregen']]},
  titanenfaust300:{haupt:K6_M('faust',{f:1.0,laut:1.17,blitz:1.6}),stufen:[0,1,2,3,4].map(k=>[0.78+k*0.08,K6_M('faust',{f:1.15+k*0.07,laut:0.62,P:12,roll:k===4?[0.45,4,7,190]:null,koerper:[0.4,450,100,0.8]}),'finger'])},
  lavastrom300:{haupt:K6_M('vulkan',{f:1.0,laut:3.2,blitz:1.3}),stufen:[[0.6,K6_M('vulkan',{f:1.3,laut:0.7,P:16,roll:[0.4,4,7,170]}),'ausbruch'],[3.7,K6_M('vulkan',{f:1.6,laut:0.4,P:9,tief:null,roll:null,knister:[60,0,2.4,0.22]}),'asche']]},
  galaxie300:{haupt:K6_M('tiefraum',{f:1.0,laut:0.95,blitz:1.4}),stufen:[[2.2,K6_M('tiefraum',{f:1.35,laut:0.7,P:12,roll:[0.35,3.5,6,220],schlaege:[[0.08,0.6],[0.17,0.5],[0.27,0.4]]}),'sternhaufen']]},
  sturmflut300:{haupt:K6_M('brandung',{f:1.0,laut:3.3,blitz:1.4}),stufen:[[1.4,K6_M('brandung',{f:1.1,laut:0.95,P:18}),'welle 1'],[1.95,K6_M('brandung',{f:0.95,laut:1.6,P:21}),'welle 2'],[2.6,K6_M('brandung',{f:1.25,laut:0.7,P:14,roll:[0.5,5,8,200]}),'gischt']]},
  goetterdaemmerung300:{haupt:K6_M('goetter',{f:1.25,laut:1.0,P:16,blitz:1.2,roll:[0.5,3.5,6,190]}),stufen:[[1.15,K6_M('goetter',{f:1.1,laut:1.15,P:22,roll:[0.6,4.5,8,170]}),'zweiter schlag'],[2.45,K6_M('goetter',{f:0.95,laut:2.1,schlaege:[[0.1,0.7]],roll:[1.0,8,13,170]}),'goetterschlag']]},
  himmelssturz300:{haupt:K6_M('sturz',{f:1.2,laut:1.09,P:18,blitz:1.3,roll:[0.55,4,7,200]}),stufen:[
    ...[0,1,2,3,4,5].map(k=>[1.3+k*0.11,K6_M('sturz',{f:1.5+k*0.04,laut:0.6,P:9,tief:[90,40,0.5,0.45,4],koerper:[0.35,600,140,0.6],roll:k===5?[0.5,4,7,220]:null,knack:[0.55,2600,0.012]}),'donnerkranz']),
    [2.7,K6_M('sturz',{f:0.95,laut:3.4,schlaege:[[0.12,0.85],[0.32,0.65],[0.62,0.5]],roll:[1.3,9,16,170],mitte:[0.75,700,0.7]}),'himmelssturz'],[4.6,K6_M('sturz',{f:0.85,laut:2.33,P:30,knack:null,koerper:[0.7,220,40,2.6],roll:[0.8,7,10,120],tief:[30,14,3.2,1.1,9]}),'nachbeben']]}
};
for(const id in K6_MONSTER) KNALL5[id]=K6_MONSTER[id].haupt;
/* Stufenknall am Ort e (Licht vor Schall) */
function k6Stufe(id,k,e){ const M=K6_MONSTER[id]; if(!M||KNALL5_AUS) return; const st=M.stufen[k]; if(!st) return;
  if(K5_LOG) K5_LOG.push({t:FW_UHR,id,stufe:k,art:st[2]});
  schall(e,x=>{ if(K6_ALT5) return; k6Knall(st[1],x); }); }
/* zur Messung: der ganze Klang einer Kugel (alle Stufen auf ihrer Zeit) */
function k6MonsterKnall(id,v,alles){ const M=K6_MONSTER[id]; k5Knall(M.haupt,v); if(alles&&!K6_ALT5) M.stufen.forEach(([t,o])=>k6Knall(o,v,t)); }
/* grosser Titanblitz mit Beben */
function k6Titan(e,n,w,hell){ const q=QUAL(), a=SCHWEIF; SCHWEIF=0.05;
  for(let i=0;i<4;i++) psHuge.emit(e.x,e.y,e.z,rand(-.4,.4),rand(-.4,.4),rand(-.4,.4),2.4,2.35,2.2,rand(0.08,0.14),0,0);
  for(let i=0;i<Math.round(n*q);i++){ const d=randDir(), s=rand(0.6,1)*w; psMid.emit(e.x,e.y,e.z,d[0]*s,d[1]*s,d[2]*s,1.8,1.75,1.6,rand(0.1,0.22),0.5,0); }
  SCHWEIF=a; flash(e,[1,1,1],(hell||1)*8,0.45); later(0.06,()=>flash(e,[1,.85,.6],(hell||1)*6,0.6));
  { const v=distVol(e); shake=Math.max(shake,Math.min(1.6,0.8+v*2)); } }
/* aufsteigender Kern (Bombe in der Bombe) mit hellem Schweif */
function k6Kern(p,TK,fn,c){ const vk=[rand(-0.5,0.5),15,rand(-0.5,0.5)];
  kgStern(psHuge,p,vk,c||[2,1.9,1.7],TK,2.4,0,0.4); rkFunken(p,vk,2.4,0.02,TK,80,[1.4,1.2,.8],{ps:psMid,life:[0.4,0.8],g:1.5,streu:0.3,mit:0.05,mode:4});
  kgSpaeter(TK,()=>fn(sternNach(p,vk[0],vk[1],vk[2],2.4,TK))); }

/* 1. HERBSTSTURM 300 (L27): eine goldorange Kamuro-Krone; nach 0,9 s
   entzuenden sich vierzig Flammenblaetter, die flatternd und schaukelnd
   herabsegeln (das chinesische "Falling Leaves") - jedes mit einer
   kleinen Flamme -, zum Schluss steigt ein pfeifender Funkenschwarm
   auf. Knall: Sturm - Boom mit langem, windigem Rollen. */
EFF.herbststurm=function(p,A,B,s){ const q=QUAL()*K6_DICHTE, G=1.2;
  k5Brokat(p,Math.round(60*q)+50,5.4*s,5.2,G,{glanz:6,staub:14,kopf:[1.95,1.15,.4]});
  nKugel(Math.round(14*q)+8,1.8*s,v=>k5Stern(p,v,[1.8,.5,.1],rand(1.6,2.0),1.6,{spur:0.05}));
  kgSpaeter(0.9,()=>{ k6Stufe('herbststurm300',0,p); const N=Math.round(34*q)+16, F=[[2.0,1.2,.35],[1.9,.75,.15],[1.7,.4,.08]];
    for(let i=0;i<N;i++){ const d=randDir(), r=Math.cbrt(rand(0.15,1))*4.2*s, e={x:p.x+d[0]*r,y:p.y+d[1]*r*0.7,z:p.z+d[2]*r}, T=rand(4.8,6.2), c=F[i%3];
      const h=kgStern(psHuge,e,[0,-0.3,0],c,T,0.25,0,0.02), ph=rand(0,6.3), om=rand(2.4,3.6), amp=rand(1.6,2.6), ax=rand(0,6.3);
      k5Punkt(e,[2,1.6,.9],4,4,0.7);
      for(let t=0.1;t<T-0.1;t+=0.1){ const tt=t; kgSpaeter(tt,()=>{ if(!kgLebt(h)) return; const j=h.i*3, V=h.ps.vel, f=k6F(), sw=Math.sin(om*tt+ph);
        /* Blatt schaukelt: seitlich hin und her, sinkt schneller, wenn es kippt */
        V[j]=Math.cos(ax)*sw*amp*f; V[j+2]=Math.sin(ax)*sw*amp*f; V[j+1]=-(0.6+0.9*Math.abs(Math.cos(om*tt+ph)))*f;
        const P0=k5Pos(h), a=SCHWEIF; SCHWEIF=0; for(let k=0;k<(q>0.7?2:1);k++) psBig.emit(P0.x+rand(-.2,.2),P0.y,P0.z+rand(-.2,.2),rand(-.3,.3),rand(1.4,2.6),rand(-.3,.3),c[0],c[1],c[2],rand(0.3,0.5),-0.5,2,.3,.04,0); SCHWEIF=a; }); }
      kgSpaeter(T-0.12,()=>{ const x=k5Pos(h); if(x) k5Knister(x,3,1.4,[1.7,1.2,.5]); }); }
    schall(p,x=>{ sfx.fauchen(x*0.55,5.5); later(4.5,()=>sfx.crackle(x*0.6)); }); });
  /* pfeifender Schwarm zum Schluss */
  kgSpaeter(3.4,()=>{ k5Bruch(p,'pfeifschwarm',0.6); for(let i=0;i<Math.round(10*q)+8;i++){ const d=randDir(), v=[d[0]*2.2*s,Math.abs(d[1])*2.6*s+3,d[2]*2.2*s];
      nKomet(p,v,[1.8,1.6,1.1],1.6,1.4,[1.3,1.1,.6],34); }
    schall(p,x=>{ for(let k=0;k<5;k++) later(k*0.13,()=>sfx.pfeifTon(x*1.4,rand(-2,6),{dur:1.5})); }); }); };

/* 2. EISZEIT 300 (L27): eine eisblaue Chrysantheme mit langen
   Silberschleiern; bei 1,6 s bricht das Eis - jeder Stern zersplittert
   in drei weisse Eissplitter (Kometen mit Spur, spitz auseinander),
   dazwischen blitzen Eiskristalle (Strobe); bei 4,2 s taut alles zu
   einer Silberweide, die knisternd herabrieselt. Knall: Eisbruch -
   harter, heller Schlag und klare Echos vom Waldrand.
   (09.10.: die erste Fassung mit eingefrorenen, stehenden Sternen war im
   Render nur ein Feld loser Punkte - genau das, was Tom nicht will.) */
EFF.eiszeit=function(p,A,B,s){ const q=QUAL()*K6_DICHTE, G=2.0, N=Math.round(40*q)+30, T1=1.6, sterne=[];
  nKugel(N,6.4*s,v=>{ k5Stern(p,v,[.45,.8,1.9],T1+0.05,G,{spur:0.3,weiss:0.35}); k5Schleier(p,v,G,0.05,T1,[1.15,1.3,1.55],3,10,{sl:[0.8,1.3],sg:0.7}); sterne.push(v); });
  nKugel(Math.round(10*q)+6,1.2*s,v=>kgStern(psHuge,p,v,[1.6,1.8,2.1],2.8,0.6,1,0));
  kgSpaeter(T1,()=>{ k6Stufe('eiszeit300',0,p); k5Bruch(p,'eisbruch',0.8); flash(p,[.75,.88,1],5,0.25);
    sterne.forEach(v=>{ const e=sternNach(p,v[0],v[1],v[2],G,T1), vv=bahnTempo(v,G,T1), l=Math.hypot(vv[0],vv[1],vv[2])||1, d=[vv[0]/l,vv[1]/l,vv[2]/l], [q1,q2]=quer(d), b0=rand(0,6.3);
      for(let k=0;k<3;k++){ const b=b0+k*2.094, sp=2.4*Math.sqrt(s), dv=[d[0]*sp*0.8+(q1[0]*Math.cos(b)+q2[0]*Math.sin(b))*sp,d[1]*sp*0.8+(q1[1]*Math.cos(b)+q2[1]*Math.sin(b))*sp,d[2]*sp*0.8+(q1[2]*Math.cos(b)+q2[2]*Math.sin(b))*sp];
        kgStern(psBig,e,dv,[1.75,1.85,2.05],rand(2.2,2.6),1.6,0,0.35); }
      const a=SCHWEIF; SCHWEIF=0; for(let j=0;j<Math.round(3*q)+1;j++){ const r=randDir(), w=rand(0.8,2.2); psBig.emit(e.x,e.y,e.z,r[0]*w,r[1]*w,r[2]*w,1.9,1.95,2.1,rand(1.8,2.4),0.5,1); } SCHWEIF=a; }); });
  kgSpaeter(4.2,()=>{ k6Stufe('eiszeit300',1,p); sterne.forEach((v,i)=>{ if(i%2) return; const e=sternNach(p,v[0],v[1],v[2],G,T1), w=[rand(-.5,.5),-0.3,rand(-.5,.5)];
      const x={x:e.x+rand(-2,2)*s*0.3,y:e.y-rand(1,3),z:e.z+rand(-2,2)*s*0.3};
      kgStern(psBig,x,w,[1.5,1.55,1.7],rand(2.4,3.0),1.4,4,0.4); rkFunken(x,w,1.4,0.05,2.4,16,[1.2,1.25,1.4],{ps:psMid,life:[0.7,1.2],g:1.0,streu:0.1,mit:0.1,mode:4}); });
    schall(p,x=>sfx.rieseln(x*0.8,3.5)); }); };

/* 3. TITANENFAUST 300 (L28): ein Titan-Salut - weisser Blitz, die Erde
   bebt -, aus dem Blitz schiessen fuenf schwere Fingerbomben wie die
   Finger einer sich oeffnenden Faust nach oben und aussen; jede bricht
   nach 0,8 s mit eigenem Schlag zu einer Paeonie (Rot, Gold, Gruen, Blau,
   Violett), zum Schluss sinkt eine Wolke aus Silberflitter. */
const K6_FINGER=[[1.9,.18,.12],[1.9,1.3,.35],[.25,1.8,.45],[.3,.5,1.9],[1.3,.4,1.8]];
EFF.titanenfaust=function(p,A,B,s){ const q=QUAL()*K6_DICHTE, G=2.0;
  k6Titan(p,180,30,1.2);
  nKugel(Math.round(60*q)+30,7.0*s,v=>{ kgStern(psBig,p,v,[1.85,1.85,1.95],0.9,G,0,0.3); });
  const [u,w]=basisBlick(p,0.2);
  for(let k=0;k<5;k++){ const a=Math.PI*(0.12+0.19*k), d=[u[0]*Math.cos(a)+w[0]*Math.sin(a)*1.0,u[1]*Math.cos(a)+w[1]*Math.sin(a)+0.25,u[2]*Math.cos(a)+w[2]*Math.sin(a)], l=Math.hypot(d[0],d[1],d[2]);
    const v=kgMal([d[0]/l,d[1]/l,d[2]/l],5.6*s), T=0.78+k*0.08, c=K6_FINGER[k];
    nKomet(p,v,[1.9,1.7,1.3],T,G,[1.3,1.1,.7],70);
    kgSpaeter(T,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,T); k6Stufe('titanenfaust300',k,e); k5Bruch(e,'finger',0.9); k5Punkt(e,mischF(c,[2,2,2],0.5),14,9,1);
      k5HaltSammeln(()=>nKugel(Math.round(44*q)+26,3.4*s,vv=>k5Stern(e,vv,c,rand(2.2,2.6),2.0,{spur:0.14,weiss:0.3}))); }); }
  kgSpaeter(2.3,()=>{ k5Bruch(p,'flitter',0.6); const a=SCHWEIF; SCHWEIF=0;
    for(let i=0;i<Math.round(220*q)+60;i++){ const d=randDir(), r=Math.cbrt(Math.random())*6.5*s; psMid.emit(p.x+d[0]*r,p.y+d[1]*r,p.z+d[2]*r,rand(-.3,.3),rand(-.5,0),rand(-.3,.3),1.6,1.6,1.7,rand(1.8,2.8),0.4,3); }
    SCHWEIF=a; schall(p,x=>{ sfx.rieseln(x*0.9,3); later(0.4,()=>sfx.crackle(x*0.7)); }); }); };

/* 4. LAVASTROM 300 (L28): eine karminrote Brokatkugel bricht auf, bei
   0,6 s speit der Kern 26 schwere Lavabrocken aus, die langsam und
   schwer herabsinken und dabei breite, glutrote Glitzerstroeme ziehen;
   wo ein Brocken verlischt, zerplatzt er zu knisternder Asche mit einem
   goldenen Funken. Knall: Vulkan - tiefer, langer Druck und Grollen. */
EFF.lavastrom=function(p,A,B,s){ const q=QUAL()*K6_DICHTE, G=1.4;
  k5Brokat(p,Math.round(56*q)+34,5.2*s,4.2,G,{glanz:5,staub:12,kopf:[1.95,.5,.18]});
  nKugel(Math.round(16*q)+10,2.0*s,v=>k5Stern(p,v,[1.8,.15,.05],rand(2.6,3.2),1.2,{spur:0.06}));
  kgSpaeter(0.6,()=>{ k6Stufe('lavastrom300',0,p); k5Bruch(p,'ausbruch',0.8); flash(p,[1,.4,.1],5,0.6);
    const n=Math.round(20*q)+14;
    for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+rand(-0.2,0.2), el=rand(-0.2,0.9), sp=rand(3.4,4.4)*s, v=[Math.cos(a)*Math.cos(el)*sp,Math.sin(el)*sp,Math.sin(a)*Math.cos(el)*sp], T=rand(3.0,3.5);
      k5Tiger(p,v,[1.5,.38,.06],T,3.0,{glanz:8,staub:30,gold:0.25});
      kgSpaeter(T*0.98,()=>{ const e=sternNach(p,v[0],v[1],v[2],3.0,T); k5Knister(e,Math.round(7*q)+3,2.4,[1.6,.9,.4]); psHuge.emit(e.x,e.y,e.z,0,0,0,1.8,1.2,.4,0.08,0,0);
        for(let j=0;j<Math.round(5*q)+2;j++){ const d=randDir(); kgStern(psBig,e,kgMal(d,rand(1.2,2.0)),[1.6,1.1,.35],rand(0.6,1.0),2,4,0.06); } }); }
    schall(p,x=>sfx.fauchen(x*0.5,3.5)); });
  kgSpaeter(3.7,()=>k6Stufe('lavastrom300',1,p)); };

/* 5. GALAXIE 300 (L29): eine Spiralgalaxie - zwei Arme aus Gold, nach
   aussen blauweiss, liegen als schraege Scheibe am Himmel und drehen
   sich langsam; im Kern pulsiert ein weisser Blinkstern-Haufen; bei
   2,2 s zerspringen die Armsterne zu kleinen silbernen Sternhaufen
   (Crossetten). Knall: Tiefraum - sehr tiefer Druck, schwellendes
   Brummen, Echo vom Tal. */
EFF.galaxie=function(p,A,B,s){ const q=QUAL()*K6_DICHTE, G=0.9, [u,w]=basisBlick(p,0.55), n=Math.round(150*q)+70, arme=[];
  const nrm=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];
  for(let i=0;i<n;i++){ const arm=i%2, x=rand(0.12,1), th=arm*Math.PI+x*4.2+rand(-0.18,0.18), sp=(1.2+6.4*x)*s;
    const d=[u[0]*Math.cos(th)+w[0]*Math.sin(th)*0.85+nrm[0]*rand(-.06,.06),u[1]*Math.cos(th)+w[1]*Math.sin(th)*0.85+nrm[1]*rand(-.06,.06),u[2]*Math.cos(th)+w[2]*Math.sin(th)*0.85+nrm[2]*rand(-.06,.06)];
    const c=x<0.45?[1.9,1.4,.55]:mischF([.55,.75,1.9],[1.7,1.75,1.9],(x-0.45)), h=k5Stern(p,kgMal(d,sp),c,3.4,G,{spur:0.22,weiss:0.3}); arme.push({h,x,th});
    if(i%4===0) rkFunken(p,kgMal(d,sp),G,0.05,2.0,12,mischF(c,[1,1,1],0.3),{ps:psMid,life:[0.7,1.2],g:0.6,streu:0.1,mit:0.05,mode:4}); }
  /* die Scheibe dreht sich: jeder Stern bekommt eine Querkomponente */
  for(let t=0.15;t<2.2;t+=0.15){ const tt=t; kgSpaeter(tt,()=>{ const f=k6F(); arme.forEach(({h,x})=>{ if(!kgLebt(h)) return; const j=h.i*3, V=h.ps.vel, r=[V[0+j],V[1+j],V[2+j]];
      const t2=[nrm[1]*r[2]-nrm[2]*r[1],nrm[2]*r[0]-nrm[0]*r[2],nrm[0]*r[1]-nrm[1]*r[0]], k=0.07*(1.4-x);
      V[j]+=t2[0]*k; V[j+1]+=t2[1]*k; V[j+2]+=t2[2]*k; }); }); }
  /* pulsierender Kern */
  nKugel(Math.round(22*q)+14,0.9*s,v=>kgStern(psHuge,p,v,[1.9,1.9,2.1],rand(3.6,4.4),0.3,1,0));
  nKugel(Math.round(30*q)+10,1.6*s,v=>kgStern(psBig,p,v,[1.8,1.6,1.1],rand(2.6,3.2),0.4,1,0));
  kgSpaeter(2.2,()=>{ k6Stufe('galaxie300',0,p); arme.forEach(({h,x},i)=>{ if(i%2||!kgLebt(h)) return; const [o,v]=kgOrt(h), [q1,q2]=quer([v[0],v[1],v[2]].map(z=>z/(Math.hypot(v[0],v[1],v[2])||1))), b0=rand(0,6.3);
      kgSpaeter(rand(0,0.3),()=>{ for(let k=0;k<4;k++){ const b=b0+k*Math.PI/2, sp=2.6*Math.sqrt(s), dv=[(q1[0]*Math.cos(b)+q2[0]*Math.sin(b))*sp,(q1[1]*Math.cos(b)+q2[1]*Math.sin(b))*sp,(q1[2]*Math.cos(b)+q2[2]*Math.sin(b))*sp];
        kgStern(psBig,o,dv,[1.6,1.7,1.95],rand(0.9,1.2),1.4,0,0.25); } psHuge.emit(o.x,o.y,o.z,0,0,0,1.6,1.7,2,0.05,0,0); }); });
    k5Bruch(p,'sternhaufen',0.7); schall(p,x=>later(0.1,()=>BRUCH_KLAENGE.kaskade(k5Laut(x)*0.9))); }); };

/* 6. STURMFLUT 300 (L29): drei Wellen - ein flacher Ring aus blauweissen
   Tigerkometen rollt nach aussen und bricht bei 1,4 s wie eine Welle:
   an jeder Spitze stuerzt Silbergischt herab; 0,5 s spaeter eine
   goldene Welle tiefer, die bei 1,95 s bricht, zuletzt eine weisse
   Welle nach oben. Jede Brandung mit eigenem Schlag. */
EFF.sturmflut=function(p,A,B,s){ const q=QUAL()*K6_DICHTE, G=2.2;
  const welle=(t0,c,el,T,sp,k,gischt)=>kgSpaeter(t0,()=>{ const n=Math.round(26*q)+18, a0=rand(0,6.3);
    for(let i=0;i<n;i++){ const a=a0+i/n*Math.PI*2, e=el+rand(-0.06,0.06), v=[Math.cos(a)*Math.cos(e)*sp,Math.sin(e)*sp,Math.sin(a)*Math.cos(e)*sp];
      k5Tiger(p,v,c,T,G,{glanz:8,staub:24});
      kgSpaeter(T*rand(0.98,1.02),()=>{ const x=sternNach(p,v[0],v[1],v[2],G,T), vv=bahnTempo(v,G,T), a2=SCHWEIF; SCHWEIF=0.3;
        for(let j=0;j<Math.round(8*q)+3;j++) psBig.emit(x.x,x.y,x.z,vv[0]*0.25+rand(-1,1),rand(-2.5,0.5),vv[2]*0.25+rand(-1,1),gischt[0],gischt[1],gischt[2],rand(1.4,2.2),2.6,4);
        SCHWEIF=a2; if(i%4===0) k5Knister(x,3,1.6,[1.7,1.75,1.9]); }); }
    if(k!==null) kgSpaeter(T,()=>{ k6Stufe('sturmflut300',k,p); k5Bruch(p,'brandung',0.8); }); });
  welle(0,[.45,.75,1.9],0.05,1.4,7.4*s,0,[1.5,1.6,1.8]);
  welle(0.5,[1.6,1.1,.3],-0.28,1.45,6.8*s,1,[1.7,1.4,.7]);
  welle(1.1,[1.6,1.65,1.8],0.45,1.5,6.2*s,2,[1.6,1.65,1.8]);
  nKugel(Math.round(16*q)+8,1.4*s,v=>k5Stern(p,v,[1.4,1.6,1.9],2.4,1.4,{spur:0.05})); };

/* 7. GOETTERDAEMMERUNG 300 (L30): drei Schlaege, jeder hoeher und
   groesser - eine blutrote Paeonie; der Kern steigt weiter und bricht
   zu einer schweren Goldpalme mit Brokat; ein zweiter Kern steigt noch
   hoeher und zerreisst im Goetterschlag: Titanblitz, eine riesige weisse
   Chrysantheme mit Silberschleier und ein Knistern ueber den ganzen
   Himmel. */
EFF.goetterdaemmerung=function(p,A,B,s){ const q=QUAL()*K6_DICHTE, G=2.2;
  nKugel(Math.round(60*q)+34,5.4*s,v=>k5Stern(p,v,[1.9,.2,.1],2.2,G,{spur:0.16,weiss:0.25}));
  k6Kern(p,1.15,e=>{ k6Stufe('goetterdaemmerung300',0,e); k5Bruch(e,'goldpalme',1.0); k6Titan(e,60,16,0.6);
    k5HaltSammeln(()=>{ const n=Math.round(6*q)+10;
      for(let i=0;i<n;i++){ const a=i/n*Math.PI*2, el=rand(0.05,0.6), sp=6.2*s, v=[Math.cos(a)*Math.cos(el)*sp,Math.sin(el)*sp+1.2*s,Math.sin(a)*Math.cos(el)*sp]; k5Tiger(e,v,[1.7,1.15,.35],2.8,2.6,{glanz:10,staub:30,gold:0.6}); }
      k5Brokat(e,Math.round(16*q)+14,3.4*s,4.2,1.2,{glanz:4,staub:9}); });
    k6Kern(e,1.3,e2=>{ k6Stufe('goetterdaemmerung300',1,e2); k5Bruch(e2,'goetterschlag',1.6); k6Titan(e2,200,34,1.4);
      k5HaltSammeln(()=>{ const S=s*1.3;
        nKugel(Math.round(100*q)+50,7.8*S,v=>{ kgStern(psBig,e2,v,[1.85,1.85,1.95],rand(2.8,3.2),G,4,0.3); });
        nKugel(Math.round(12*q)+8,7.4*S,v=>k5Schleier(e2,v,G,0.05,2.6,[1.25,1.28,1.38],3,12,{sl:[0.6,1.1]}));
        nKugel(Math.round(18*q)+12,4.4*S,v=>k5Stern(e2,v,[1.9,1.4,.5],2.6,G,{spur:0.12})); });
      kgSpaeter(1.7,()=>{ for(let i=0;i<Math.round(90*q)+30;i++){ const d=randDir(), r=Math.cbrt(Math.random())*7.5*s*1.3, x={x:e2.x+d[0]*r,y:e2.y+d[1]*r-2,z:e2.z+d[2]*r};
          kgSpaeter(rand(0,1.6),()=>k5Knister(x,Math.round(4*q)+2,2.4,[1.75,1.65,1.4])); }
        schall(e2,x=>{ sfx.crackle(x); later(0.4,()=>sfx.crackle(x*0.85)); later(0.9,()=>sfx.crackle(x*0.7)); }); }); },[2,1.6,1]); },[2,1.4,1]); };

/* 8. HIMMELSSTURZ 300 (L30, die letzte und teuerste): eine riesige
   Crossette-Palme aus Goldtigern, deren Arme bei 1,0 s in je vier
   Silberkometen zerspringen; dann laeuft ein Donnerkranz aus 24 Salut-
   schlaegen um die Palme (Blitz um Blitz); bei 2,7 s der Himmelssturz:
   doppelter Titanblitz, eine gewaltige Goldkrone (Kamuro), die sich bis
   fast zum Boden senkt, darin eine weisse Chrysantheme; bei 4,6 s
   knistert die ganze Krone, und ein Nachbeben rollt ueber die Stadt -
   der groesste Knall im Spiel. */
EFF.himmelssturz=function(p,A,B,s){ const q=QUAL()*K6_DICHTE, G=2.2;
  /* Auftakt: dichter weissgoldener Strauss um die Palme */
  nKugel(Math.round(40*q)+30,4.6*s,v=>k5Stern(p,v,[1.9,1.55,.8],1.3,G,{spur:0.22,weiss:0.4}));
  const n=Math.round(12*q)+14, a0=rand(0,6.3);
  for(let i=0;i<n;i++){ const a=a0+i/n*Math.PI*2, el=rand(0.0,0.7), sp=6.6*s, v=[Math.cos(a)*Math.cos(el)*sp,Math.sin(el)*sp+1.0*s,Math.sin(a)*Math.cos(el)*sp];
    k5Tiger(p,v,[1.6,1.1,.3],1.0,G,{glanz:8,staub:24,gold:0.6});
    kgSpaeter(1.0,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,1.0), vv=bahnTempo(v,G,1.0), l=Math.hypot(vv[0],vv[1],vv[2])||1, [q1,q2]=quer([vv[0]/l,vv[1]/l,vv[2]/l]), b0=rand(0,6.3);
      for(let k=0;k<4;k++){ const b=b0+k*Math.PI/2, sp2=3.6*Math.sqrt(s), dv=[(q1[0]*Math.cos(b)+q2[0]*Math.sin(b))*sp2+vv[0]*0.4,(q1[1]*Math.cos(b)+q2[1]*Math.sin(b))*sp2+vv[1]*0.4,(q1[2]*Math.cos(b)+q2[2]*Math.sin(b))*sp2+vv[2]*0.4];
        nKomet(e,dv,[1.7,1.75,1.9],1.4,2.6,[1.2,1.2,1.3],22); }
      psHuge.emit(e.x,e.y,e.z,0,0,0,1.8,1.6,1.2,0.05,0,0); }); }
  /* Donnerkranz: 24 Salutschlaege im Kreis, sechs Klanggruppen */
  const [u,w]=basisBlick(p,0.15), R=7.6*s, b0=rand(0,6.3);
  for(let k=0;k<24;k++){ const a=b0+k/24*Math.PI*2, e={x:p.x+(u[0]*Math.cos(a)+w[0]*Math.sin(a))*R,y:p.y+(u[1]*Math.cos(a)+w[1]*Math.sin(a))*R,z:p.z+(u[2]*Math.cos(a)+w[2]*Math.sin(a))*R};
    kgSpaeter(1.3+k*0.028,()=>{ k5Punkt(e,[2.2,2.15,2.0],Math.round(14*q)+6,12,1.2); k5Bruch(e,'salut',0.5); if(k%4===0){ flash(e,[1,.95,.85],4,0.12); k6Stufe('himmelssturz300',k/4,e); } }); }
  /* der Himmelssturz */
  kgSpaeter(2.7,()=>{ k6Stufe('himmelssturz300',6,p); k5Bruch(p,'himmelssturz',2.0); k6Titan(p,240,38,1.6); later(0.12,()=>k6Titan(p,80,26,1.2));
    k5HaltSammeln(()=>{ const S=s*1.25;
      k5Brokat(p,Math.round(90*q)+60,6.6*S,7.2,0.9,{glanz:7,staub:15,kopf:[1.95,1.5,.75]});
      nKugel(Math.round(70*q)+30,5.0*S,v=>{ kgStern(psBig,p,v,[1.85,1.88,1.98],rand(2.4,2.8),G,4,0.28); }); });
    schall(p,x=>later(1.5,()=>sfx.rieseln(x*1.0,5.5))); });
  kgSpaeter(4.6,()=>{ k6Stufe('himmelssturz300',7,p);
    for(let i=0;i<Math.round(120*q)+40;i++){ const d=randDir(), r=Math.cbrt(Math.random())*8*s, x={x:p.x+d[0]*r,y:p.y+d[1]*r-6,z:p.z+d[2]*r};
      kgSpaeter(rand(0,1.8),()=>k5Knister(x,Math.round(4*q)+2,2.4,[1.8,1.5,.8])); }
    schall(p,x=>{ sfx.crackle(x); later(0.5,()=>sfx.crackle(x*0.9)); later(1.0,()=>sfx.crackle(x*0.75)); later(1.6,()=>sfx.crackle(x*0.6)); }); }); };

/* ---------- Eintraege der neuen Kugeln ---------- */
Object.assign(EFF_FAMILIE,{herbststurm:'haenger',eiszeit:'kugel',titanenfaust:'kugel',lavastrom:'haenger',galaxie:'kugel',sturmflut:'komet',goetterdaemmerung:'kugel',himmelssturz:'haenger'});
Object.assign(EFF_SCHWEIF,{fackelhimmel:0.0,herbststurm:0.1,eiszeit:0.2,titanenfaust:0.16,lavastrom:0.12,galaxie:0.18,sturmflut:0.16,goetterdaemmerung:0.16,himmelssturz:0.14});
const K6_KUGEL={
  herbststurm300:{th:'glut',haupt:'herbststurm',A:'gold',B:'orange',steig:'brokat',abschuss:'goldfontaene',flash:0.8},
  eiszeit300:{th:'nacht',haupt:'eiszeit',A:'himmel',B:'silber',steig:'blink',flash:0.8},
  titanenfaust300:{th:'silber',haupt:'titanenfaust',A:'silber',B:'gold',steig:'titanspur',abschuss:'kometen',flash:1.0},
  lavastrom300:{th:'glut',haupt:'lavastrom',A:'rot',B:'orange',steig:'glut',abschuss:'goldfontaene',flash:0.8},
  galaxie300:{th:'nacht',haupt:'galaxie',A:'gold',B:'blau',steig:'komet',flash:0.7},
  sturmflut300:{th:'nacht',haupt:'sturmflut',A:'blau',B:'gold',steig:'titanspur',abschuss:'farbkometen',flash:0.8},
  goetterdaemmerung300:{th:'koenig',haupt:'goetterdaemmerung',A:'rot',B:'gold',steig:'kometenkopf',abschuss:'kometen',flash:0.9},
  himmelssturz300:{th:'gold',haupt:'himmelssturz',A:'gold',B:'silber',steig:'titanspur',abschuss:'goldfontaene',flash:1.0}
};
for(const id in K6_KUGEL){ const k=K6_KUGEL[id];
  KUGEL[id]=Object.assign({},KAL_WERTE[5],{kal:5,th:k.th,haupt:k.haupt,A:k.A,B:k.B,steig:k.steig,abschuss:k.abschuss,bruchOpt:{kern:false,nachglitzer:false,flash:k.flash},stufen:[]}); }
Object.assign(SIGNATUR,{
  silberdistel75:{eff:'silberdistel',text:'Violetter Distelkopf, Silberstrahlen, an jeder Spitze schwebt ein Flaumbüschel davon'},
  fackelhimmel150:{eff:'fackelhimmel',text:'Dreißig lodernde Flammenzungen, die fast zehn Sekunden am Himmel stehen'},
  herbststurm300:{eff:'herbststurm',text:'Goldorange Kamuro, vierzig flatternde Flammenblätter, pfeifender Schwarm'},
  eiszeit300:{eff:'eiszeit',text:'Eisblaue Chrysantheme zersplittert in Eissplitter und Kristalle, taut zur Silberweide'},
  titanenfaust300:{eff:'titanenfaust',text:'Titan-Salut, fünf Fingerbomben mit eigenem Schlag, Silberflitter'},
  lavastrom300:{eff:'lavastrom',text:'Karminbrokat, schwere Lavabrocken mit Glutströmen, knisternde Asche'},
  galaxie300:{eff:'galaxie',text:'Drehende Spiralgalaxie in Gold und Blau, pulsierender Kern, Sternhaufen'},
  sturmflut300:{eff:'sturmflut',text:'Drei Wellen aus Tigerkometen brechen nacheinander zu Gischt'},
  goetterdaemmerung300:{eff:'goetterdaemmerung',text:'Rot, dann Goldpalme, dann der Götterschlag - drei Schläge, jeder höher'},
  himmelssturz300:{eff:'himmelssturz',text:'Crossette-Palme, Donnerkranz aus 24 Schlägen, Titansturz mit riesiger Goldkrone'}
});
/* gestrichen (02i): Bruchbild, Knall und Eintrag weg */
for(const id of ['aurora200','granatapfel200','sonnensturm300','drachennest300']){ delete KUGEL[id]; delete KNALL5[id]; delete SIGNATUR[id]; delete K5_RAUM[id]; delete K5_TON_ALT[id]; }

/* ---------- Groesse (FW_RAUM, 14u) ----------
   Tom: "ALLE Kugeln groesser, auch die ersten Stufen; Tigerkrone,
   Farbcrossette, Blitzpalme, Sternensturm viel groesser". Gemessen
   (Durchmesser von 90 % der Sterne, Vorfuehrung), vorher -> Ziel:
   75 mm 79-86 -> ~110 m, 100 mm 84-88 -> ~118 m, Profi 150 109-120 ->
   150 m (Tigerkrone, Farbcrossette 165 m), Profi 200 112-120 -> 155-160 m
   (Blitzpalme 178 m), Koenigsklasse 118-128 -> ~170 m (Sternensturm
   190 m), Urknall 181 -> 205 m, die neuen 210-260 m. Werte nach der
   Messung eingestellt (Tabelle UEBERGABE.md 5.3). */
const K6_RAUM={
  kugel75:4.0,silberdistel75:5.5,hummelschwarm75:3.1,goldbrokat100:3.4,kugel100:2.26,blauregen100:4.8,
  fackelhimmel150:5.2,crossettennetz150:3.8,tigerkrone150:3.47,farbcrossette150:4.05,wetterleuchten150:3.7,
  schatztruhe200:3.75,bluetenhagel200:3.6,kronenkranz200:2.45,zwillingssonne200:1.86,blitzpalme200:6.9,goldweidenkreuz200:2.83,
  kugel300:2.76,kanonade300:4.6,sternensturm300:3.49,riesenpalme300:2.92,ringnebel300:2.99,kometensturm300:2.32,urknall300:2.36,
  herbststurm300:4.5,eiszeit300:3.85,titanenfaust300:3.7,lavastrom300:4.8,galaxie300:4.6,sturmflut300:4.5,goetterdaemmerung300:2.5,himmelssturz300:3.85};
/* 09.10. (Batterie-Runde 0b): Schatztruhe, Bluetenhagel, Kronenkranz und
   Zwillingssonne etwas groesser - gemessen lag der 200er-Mittelwert (156 m)
   unter dem der 150er (158 m), die Kaliber-Leiter (hoehen.js KALIBER) kippte */
for(const id of Object.keys(K6_RAUM)) if(KUGEL[id]) KUGEL[id].raum=K6_RAUM[id];
/* Bruchhoehe (09.10., 14u kgHoehe): die Koenigsklasse-Kugeln ab Level 27
   brechen hoeher (165 m), der Himmelssturz mit der sinkenden Goldkrone
   und dem Knistern ueber den ganzen Himmel 175 m (gemessen bei 165 m:
   tiefster Stern 16 m - knapp; bei 90 m reichte er bis 75 m unter den Boden) */
for(const id of ['herbststurm300','eiszeit300','titanenfaust300','lavastrom300','galaxie300','sturmflut300','goetterdaemmerung300']) if(KUGEL[id]) KUGEL[id].hoehe=165;
if(KUGEL.himmelssturz300) KUGEL.himmelssturz300.hoehe=175;

/* ---------- Knall fuer die neuen Kugeln ---------- */
for(const id in K6_MONSTER){ if(!KUGEL[id]) continue; K5_TON_ALT[id]=null; KUGEL[id].ton='kk_'+id; sfx['kk_'+id]=(v,s)=>k5KnallId(id,v,s); }

try{ window.__kg6={K6_ART,K6_MON,K6_MONSTER,K6_RAUM,K6_WAHL,messen:k6MessKnall,messenFn:k6Messen,alt5(f){ K6_ALT5=!!f; },istAlt5:()=>K6_ALT5,aus(f){ K6_AUS=!!f; }}; }catch(e){}
