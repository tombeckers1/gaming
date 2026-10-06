/* =========================================================
   Batterien, Runde 2 (06.10., Toms PDF "Alles wichtige zum Feuerwerk").
   Grundregel: EIN LOCH = EIN SCHUSS (PDF, Dreisprung 9: "jeder Schuss
   ist ja logischerweise ein Loch. So, ausser du hast jetzt eine
   Fontaene. Aber eine Fontaene meine ich diese kleinen Funken, nicht
   diese grossen Fontaenen ... jedes ist ein Schuss").
   Name-Schusszahl = Rohre = sichtbare Schuesse (Kometen, Feuertoepfe,
   Kugeln, Sterne); nur kleine Funkenfontaenen brauchen kein Loch.
   ========================================================= */

/* ---------- Zaehlung der sichtbaren Starts (Test lochschuss.js) ----------
   Gezaehlt wird, was aus dem Produkt nach oben steigt: jeder Kometenkopf,
   der am Boden startet (lKopf unter LOCH.z.boden m), jeder Faecherkomet
   (kfKomet), jedes Licht ohne eigenen Kopf (Mine, dunkler Aufstieg) als
   ein Start. Schuesse, Kugeln, Roemische Lichter und Feuertoepfe zaehlt
   das Schussprotokoll (FW_LOG). */
const LOCH={z:null};
{ const lk=lKopf, kf=kfKomet, ls=lichtSchuss;
  lKopf=function(m,v,c,T,G,mode,spur){ const Z=LOCH.z;
    if(Z&&!Z.inKf&&m&&m.y<Z.boden){ if(Z.inLicht) Z.lk++; else Z.frei++; }
    return lk.apply(this,arguments); };
  kfKomet=function(){ const Z=LOCH.z; if(!Z) return kf.apply(this,arguments);
    Z.kf++; if(Z.inLicht) Z.lkf=true; const alt=Z.inKf; Z.inKf=true;
    try{ return kf.apply(this,arguments); } finally { Z.inKf=alt; } };
  lichtSchuss=function(o,name){ const Z=LOCH.z; if(!Z) return ls.apply(this,arguments);
    const alt=[Z.inLicht,Z.lk,Z.lkf]; Z.inLicht=true; Z.lk=0; Z.lkf=false;
    try{ return ls.apply(this,arguments); }
    finally { const n=/^breit/.test(name)||Z.lkf?0:Math.max(1,Z.lk); Z.licht+=n; Z.je[name]=(Z.je[name]||0)+n;
      [Z.inLicht,Z.lk,Z.lkf]=alt; } };
}
try{ window.__lochschuss={
  start(boden){ LOCH.z={boden:boden||3,lk:0,frei:0,kf:0,licht:0,je:{},inLicht:false,inKf:false,lkf:false}; },
  stop(){ const z=LOCH.z; LOCH.z=null; return z&&{koepfeFrei:z.frei,kometen:z.kf,lichter:z.licht,je:z.je}; },
  phasen(t){ return SHOWS[t]?JSON.parse(JSON.stringify(showNorm(SHOWS[t]()))):null; },
  breitBoden(an){ if(an) Object.assign(BREIT_BODEN,{fountain:1,volcano:1,torte:1,farbtorte:1,knisterbrunnen:1}); else for(const k in BREIT_BODEN) delete BREIT_BODEN[k]; return Object.keys(BREIT_BODEN).length; }
}; }catch(e){}

/* ---------- 1. Kein automatischer Kometenfaecher mehr aus dem Modul ----------
   03.10. hatte BREIT_BODEN (14b playShow) jede alte Bodenfontaene durch
   einen Faecher aus bis zu 28 Kometen aus EINEM Fontaenen-Modul ersetzt -
   der Hauptgrund fuer "mehr Schuss als Loecher" (PDF: Dreisprung 9 zeigte
   24, Glitzerregen 12 zeigte 41). Jetzt laeuft dort wieder die kleine
   Funkenfontaene (Toms Ausnahme: "diese kleinen Funken"); wo eine breite
   Fontaene gewollt ist, kommt sie Komet fuer Komet aus eigenen Rohren
   (Strahl-Lichter unten). PDF: "das macht auch jetzt keinen Sinn, das
   ueberall einzusetzen". */
for(const k in BREIT_BODEN) delete BREIT_BODEN[k];

/* ---------- 2. Je Rohr EIN heller Komet ----------
   Strahl: ein einzelner Faecherkomet (heller Kopf, zackiger Schweif, der
   stehen bleibt) aus seinem Rohr, in Rohrrichtung. Eine "breite
   Fontaene" ist jetzt eine Reihe solcher Rohre, die kurz nacheinander
   zuenden (wie echte Kometenfaecher-Batterien: jedes Rohr ein Komet).
   p: c Kopffarbe, art Schweifart (KF_ART), H Hoehe m, md Funkenmodus,
   mini(e) am Scheitel */
function lStrahl(o,A,B,s,opt,p){ p=p||{}; opt=opt||{};
  const m=lMund(o), Q=lQuer({dir:FANDIR}), r=lRicht(opt), a=clamp(Math.atan2(r[0]*Q[0]+r[2]*Q[2],r[1]),-0.7,0.7);
  const art=KF_ART[p.art]||KF_ART.faecher, k=kfKomet(m,Q,a,p.c||A,(p.H||25)*Math.sqrt(s),7.5,p.md,0,art);
  lStart(m,1.1,0.55); const v=distVol(m);
  if(art.ton==='rieseln'||art.ton==='zischen') sfx.zischen(v*0.35,0.9); else if(sfx[art.ton]) sfx[art.ton](v*0.4); else sfx.zischen(v*0.3,0.8);
  if(k&&p.mini) kgSpaeter(k.T,()=>p.mini(sternNach(k.e,k.v[0],k.v[1],k.v[2],7.5,k.T),k));
  return k;
}
/* Strahl-Lichter (je Rohr ein Komet): Gold-Brokat, Silber-Titan,
   Farbkopf mit Goldschweif, Farbe im Wechsel A/B, schwere Glut, knisternd */
LICHTYP.strahlgold=function(o,A,B,s,opt){ lStrahl(o,A,B,s,opt,{c:GOLDF,art:'faecher',md:4,H:24}); };
LICHTYP.strahlsilber=function(o,A,B,s,opt){ lStrahl(o,A,B,s,opt,{c:[1.3,1.32,1.4],art:'wisch',H:25}); };
LICHTYP.strahlfarbe=function(o,A,B,s,opt){ lStrahl(o,A,B,s,opt,{c:A,art:'welle',md:0,H:25}); };
LICHTYP.strahlwechsel=function(o,A,B,s,opt){ lStrahl(o,A,B,s,opt,{c:(opt.i||0)%2?B:A,art:'puls',md:0,H:25}); };
LICHTYP.strahlglut=function(o,A,B,s,opt){ lStrahl(o,A,B,s,opt,{c:[1.3,.62,.16],art:'stufen',md:2,H:22}); };
LICHTYP.strahlknister=function(o,A,B,s,opt){ lStrahl(o,A,B,s,opt,{c:A,art:'kreuz',md:0,H:24}); };
Object.assign(LICHT_BRENN,{strahlgold:4,strahlsilber:4,strahlfarbe:4,strahlwechsel:4,strahlglut:4.5,strahlknister:4});

/* Alle alten Faecher-Lichter (LICHTYP.breit*, auch die aus 14q/14r und
   jedes spaetere lBreit mit schuss): aus EINEM Rohr steigt jetzt genau
   EIN heller Komet in den Farben des Faechers - kein Faecher aus 13-28
   Kometen, kein zweiter Effekt ("ende") aus demselben Rohr mehr. */
{ const lb=lBreit; lBreit=function(o,A,B,s,opt,p){
    if(!p||!p.schuss) return lb.apply(this,arguments);
    const c=p.c?p.c(0.5,1):A, art=KF_ART[p.muster]?p.muster:(KF_ART[p.art]?p.art:'faecher');
    return lStrahl(o,A,B,s||1,opt||{},{c,art,md:p.md,H:clamp((p.H||9)*2.9,15,30),mini:p.mini?e=>p.mini(e,0.5,0):null}); }; }
/* breitkomet zuendete zusaetzlich sechs Farbkometen aus demselben Rohr */
LICHTYP.breitkomet=function(o,A,B,s,opt){ lStrahl(o,A,B,s,opt,{c:A,art:'kreuz',md:4,H:25}); };
for(const k in LICHT_BRENN) if(/^breit/.test(k)) LICHT_BRENN[k]=4.5;

/* Viele Koepfe aus einem Rohr (Kometenfaecher 5, Weidenfaecher 5,
   Goldfaecher 7, Zwilling 2, Drilling 3, Wassertor/Torbogen 2,
   Dreifachtor 3, Doppelfall 2): jetzt ein Kopf je Rohr. Wo der Faecher
   gewollt ist, zuenden mehrere Rohre kurz nacheinander (Drehbuch). */
{ const L=LICHTYP, farb=(A,B,opt)=>(opt.i||0)%2?B:A;
  L.kometenfaecher=function(o,A,B,s,opt){ L.farbkomet(o,farb(A,B,opt),B,s*0.9,opt); };
  L.weidenfaecher=function(o,A,B,s,opt){ L.weidenkomet(o,A,B,s,opt); };
  L.farbweidenfaecher=function(o,A,B,s,opt){ L.farbweidenkomet(o,farb(A,B,opt),B,s,opt); };
  L.goldfaecher=function(o,A,B,s,opt){ L.goldkomet(o,A,B,s,opt); };
  L.zwillingskomet=function(o,A,B,s,opt){ L.farbkomet(o,farb(A,B,opt),B,s,opt); };
  L.drillingskomet=function(o,A,B,s,opt){ L.farbkomet(o,A,B,s,opt); };
  L.wassertor=function(o,A,B,s,opt){ const sd=(opt.i||0)%2?1:-1; lFall(o,s,opt,{seite:sd,ang:0.5,H:17,c:sd>0?kgMal(A,1.15):[1.25,1.25,1.3],kopf:sd>0?kgMal(A,1.4):undefined}); };
  L.torbogen=function(o,A,B,s,opt){ lFall(o,s,opt,{ang:0.32,H:21,lang:1.5,kopf:kgMal(A,1.4),c:A,life:[1.8,2.4]}); };
  L.dreifachtor=function(o,A,B,s,opt){ lFall(o,s,opt,{ang:0.12,H:24,lang:1.4,kopf:kgMal(B,1.5),c:kgMal(B,1.05)}); };
  L.doppelfall=function(o,A,B,s,opt){ lFall(o,s,opt,{H:16,ang:0.62,kopf:kgMal(B,1.5),c:mischF(GOLDF,kgMal(B,1.2),0.4),md:4}); }; }

/* ---------- 3. Feuertopf UND Schuss aus demselben Rohr ----------
   Phasen mit mine/mineEff ohne nurMine zuendeten je Rohr einen Feuertopf
   (Sternsaeule) und zugleich eine Bombe - zwei Starts aus einem Loch.
   Jetzt wird die Phase geteilt: zwei Drittel der Rohre schiessen die
   Bombe, ein Drittel ist ein eigener Feuertopf (gleiche Zeit, eigene
   Rohre) - die Schusszahl der Batterie bleibt. */
function lochTopfTeilen(ph){
  const n=ph.n===undefined?1:ph.n; if(!(ph.mine||ph.mineEff)||ph.nurMine||n<1) return [ph];
  const nt=n>=2?Math.max(1,Math.floor(n/3)):0, a=Object.assign({},ph,{n:n-nt}); delete a.mine; delete a.mineEff; delete a.mineSz;
  if(!nt) return [a];
  const b={mit:0,n:nt,nurMine:true,mineEff:ph.mineEff||'farbe',mineSz:ph.mineSz,muster:ph.muster==='schlag'?'schlag':'gerade',rohre:ph.rohre,x:ph.x,
    gap:ph.gap,gapEnde:ph.gapEnde,takt:ph.takt,je:ph.je&&Math.max(1,Math.round(ph.je*nt/n)),bogenGap:ph.bogenGap,farbe:ph.farbe,th:ph.th,A:ph.A,B:ph.B};
  for(const k in b) if(b[k]===undefined) delete b[k];
  return [a,b];
}
/* Drehbuch-Umbau beim Lesen: showNorm rufen rohrBedarf, playShow,
   zuendPlan und showDauer - alle sehen dieselben Phasen */
const LOCH_UMBAU=[lochTopfTeilen];
/* ---------- Keine Fontaene als Auftakt ----------
   02.10. (Tom): "Du machst oft immer so eine Fontaene am Anfang, wo ganz
   viele Funken kommen und dann kommen die Effekte. Ich will den Ablauf
   gerne ein bisschen anders haben"; PDF (Rubinpalmen, Hexenkessel,
   Farbsaeulen): "am Anfang wieder diese ... Fontaenen ... Das muss weg".
   Boden-Fontaenen, die in den ersten 3 s einer Batterie starten, fallen
   weg (eine reine Boden-Phase ganz); spaeter im Ablauf bleiben die
   kleinen Funkenfontaenen als Akzent. */
const LOCH_AUFTAKT=3;
function lochOhneAuftakt(out){
  const z=showZeiten(out);
  out.forEach((ph,i)=>{ if(z[i]>=LOCH_AUFTAKT||!(ph.boden||ph.ground)) return;
    const bo=(Array.isArray(ph.boden)?ph.boden:ph.boden?[ph.boden]:[]).filter(b=>b.k==='lauffeuer'||z[i]+(+b.t||0)>=LOCH_AUFTAKT);
    const n=ph.n===undefined?1:ph.n, x=Object.assign({},ph); delete x.ground;
    if(bo.length) x.boden=bo.length===1?bo[0]:bo; else delete x.boden;
    /* reine Boden-Phase: bleibt als leere Phase ohne Pause stehen (die
       Bezuege mit:true der folgenden Phasen bleiben gleich) */
    if(n===0&&!x.boden) x.pause=0;
    out[i]=x; });
}
{ const sn=showNorm; showNorm=function(s){ const a=sn(s); if(!a||a.__loch) return a;
    const out=[]; a.forEach(ph=>{ let L=[ph]; for(const f of LOCH_UMBAU) L=[].concat(...L.map(f)); out.push(...L); });
    for(const k of Object.keys(a)) if(isNaN(+k)) out[k]=a[k];
    Object.defineProperty(out,'__loch',{value:true});
    lochOhneAuftakt(out);
    return out; }; }

/* ---------- 4. Werkzeuge fuer die einzelnen Batterien ---------- */
/* Mehr Schuss -> groessere Batterie (PDF: "die Batterie ist dann einfach
   groesser"; 01.10.: "mach die ruhig breiter und laenger" - nicht hoeher).
   Grundflaeche waechst mit der Rohrzahl (n0 -> n1), dann wie alle
   Packungen aufs Regalraster (06 massRaster) und die Kartongroesse neu. */
function lochGroesser(t,n0,n1){ const p=P[t]; if(!p||!(n1>n0)) return;
  const k=Math.sqrt(n1/n0), d=(p.dims0||p.dims).slice();
  p.dims=[+(d[0]*k).toFixed(3),d[1],+(d[2]*k).toFixed(3)]; delete p.dims0;
  if(typeof massRaster==='function') massRaster(t); if(typeof kartonWahl==='function') kartonWahl(t); }
/* Name, Kurzname, Aufdruck und Beschreibung in einem */
function lochName(t,o){ const p=P[t]; if(!p) return;
  if(o.name) p.name=o.name; if(o.short) p.short=o.short; if(o.desc) p.desc=o.desc;
  if(p.art&&o.sub) p.art.sub=o.sub; if(p.art&&o.titel) p.art.title=o.titel; }
/* Caches der Rohre nach dem Umbau leeren (04c) */
function lochFrisch(t){ [_rohrBedarf,_rohrLayout,_zplan,_korpus,_rohrGeo].forEach(c=>{ delete c[t]; }); }

/* Komet mit eigener Schweiffarbe (kfKomet gibt Farbkoepfen immer einen
   Goldschweif - Tom fuer Jadeader: "gruene Funken") */
function kfKometF(m,Q,a,c,sch,Hk,G,art){ art=art||KF_ART.faecher;
  const v0=vFuerHoehe(Hk*rand(0.92,1.03)*(1-Math.abs(a)*0.3),G), tf=rand(-0.06,0.06);
  const v=[Q[0]*Math.sin(a)*v0-Q[2]*tf*v0,Math.cos(a)*v0,Q[2]*Math.sin(a)*v0+Q[0]*tf*v0], T=lScheitel(v[1],G)*rand(0.84,0.94), q=Math.min(1,0.5+0.5*QUAL());
  const Z=LOCH.z; if(Z){ Z.kf++; if(Z.inLicht) Z.lkf=true; }
  lKopf(m,v,lHell(c,1.7),T,G,0,0.5);
  kfZackSchweif(m,v,G,T,kgMal(sch,1.3),q,art);
  const bb=art.b; rkFunken(m,v,G,0.05,T,Math.round(28*q),sch,{ps:bb.ps==='klein'?psSmall:psMid,life:bb.life,g:bb.g,streu:bb.streu,mit:0.03,mode:4});
  muendungsblitz(m,m.y,0.55);
  return {e:m,v,T};
}
function lQuerWinkel(opt){ const Q=lQuer({dir:FANDIR}), r=lRicht(opt||{}); return [Q,clamp(Math.atan2(r[0]*Q[0]+r[2]*Q[2],r[1]),-0.7,0.7)]; }
/* kfKometF zaehlt selbst (LOCH), sein lKopf darf nicht doppelt zaehlen */
function lochOhneKopf(fn){ const Z=LOCH.z; if(!Z) return fn(); const a=Z.inKf; Z.inKf=true; try{ return fn(); } finally { Z.inKf=a; } }

/* Neue Farben: Jade (Blaugruen) und Polargruen (Polarlicht) */
Object.assign(FW,{jade:[.08,.95,.52],polargruen:[.25,1,.45]});

/* Klang "Knattern" (PDF: "Knatter 30 = der Sound bei den Explosionen
   passt nicht"; 03.10.: "ich mag dieses, wenn es kurz so dann anfaengt zu
   knistern"): kein Knall, ein dumpfer Ausstoss, danach rollt ein dichtes
   Knattern aus hunderten kleinen Knacks an und ebbt ab - wie Drachen-
   eier, die nacheinander platzen. Jeder Bruch etwas anders. */
BRUCH_KLAENGE.knatter=function(v){ const k=bkV(0.85,1.15), D=bkV(1.3,1.9), n=Math.round(bkV(42,60));
  bkR(0,{dur:0.16,vol:0.28*v,f:240*k,f2:110}); bkR(0.01,{dur:0.03,vol:0.12*v,typ:'bandpass',f:1300*k,q:1.2});
  for(let i=0;i<n;i++){ const u=i/n, t=0.2+D*(0.55*u+0.45*u*u)+bkV(-0.025,0.025), hoch=i%4!==0;
    bkR(t,{dur:bkV(0.006,0.016),vol:v*bkV(0.07,0.17)*(1-u*0.55),typ:hoch?'highpass':'bandpass',f:hoch?bkV(3200,7200):bkV(900,1700),q:1.4}); }
  bkR(0.25,{dur:D,vol:0.035*v,typ:'highpass',f:4800,rosa:true,an:0.3}); };
sfx.bkKnatter=(v,s)=>BRUCH_KLAENGE.knatter(v,s||1);

/* Jade-Licht (Jadeader, PDF: "dass das bei Gruen bleibt ... gruene
   Funken"): Kometen, Weiden und Glitzersaeulen ganz in Gruen, auch die
   Funken - kein Gold, kein Silber mehr */
LICHTYP.jadekomet=function(o,A,B,s,opt){ const m=lMund(o), [Q,a]=lQuerWinkel(opt);
  const k=lochOhneKopf(()=>kfKometF(m,Q,a,A,mischF(lHell(B,1.15),[.6,1,.7],0.3),27*Math.sqrt(s),7.5,KF_ART.tor));
  lStart(m,1.1,0.5); sfx.zischen(distVol(m)*0.3,1.1);
  kgSpaeter(k.T,()=>qMini(sternNach(k.e,k.v[0],k.v[1],k.v[2],7.5,k.T),B,s*0.8,10)); };
LICHTYP.jadeweide=function(o,A,B,s,opt){
  const m=lMund(o), G=5, v=lAbschuss(27*Math.sqrt(s),G,opt,0.4), T=lScheitel(v[1],G)+1.3;
  lKopf(m,v,lHell(A,1.45),T,G,0,0.4);
  lFunken(m,v,G,0.05,T,80,lHell(B,0.95),{ps:psMid,life:[2.0,3.0],g:0.75,streu:0.12,mit:0.03,mode:4,spur:0.25});
  lStart(m,1.1,0.6); sfx.zischen(distVol(m)*0.3,T); later(1.2,()=>sfx.rieseln(distVol(m)*0.4,3)); };
LICHTYP.jademine=function(o,A,B,s,opt){ lMine(o,s,opt,{H:[13,20],kegel:0.13,md:4,c:i=>i%3?lHell(A,1.35):lHell(B,1.5)}); sfx.rieseln(distVol(o)*0.6,3); };
/* Gruener Knaller hoch oben: kurzer gruener Sternball mit weissem
   Knistersaum und einem trockenen Knall (Bruchklang salut) */
EFF.jadeknall=function(p,A,B,s){ const q=QUAL();
  for(let i=0;i<Math.round(70*s*q);i++){ const d=randDir(), w=rand(10,14)*s; kgStern(psBig,p,[d[0]*w,d[1]*w,d[2]*w],lHell(A,1.5),rand(0.55,0.85),2.4,0,0.12); }
  for(let i=0;i<Math.round(40*q);i++){ const d=randDir(), w=rand(6,11)*s; psSmall.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1.6,1.6,1.5,rand(0.12,0.3),1.5,1); }
  flash(p,A,5*s,0.2); later(0.5,()=>schall(p,v=>sfx.crackle(v*0.5))); };
EFF_FAMILIE.jadeknall='salut';

/* Regenbogenkomet (Regenbogenkometen L5, PDF: "zehn oder so ... viel zu
   krass fuer dieses niedrige Level"): je Rohr EIN heller Farbkomet, gut
   20 m hoch, langer haengender Schweif in seiner Farbe, kein Knall */
LICHTYP.regenbogenkomet=function(o,A,B,s,opt){ const m=lMund(o), [Q,a]=lQuerWinkel(opt);
  lochOhneKopf(()=>kfKometF(m,Q,a,A,mischF(lHell(A,1.1),[1,1,1],0.25),21*Math.sqrt(s),7.5,KF_ART.welle));
  lStart(m,0.9,0.4); sfx.zischen(distVol(m)*0.3,1.2); };
/* Ozeankomet (Ozean, PDF: "blaue breite Fontaenen, aber ohne Faecher-
   Effekt, sondern einzelne schoene helle"): ein heller blauer Komet je
   Rohr, Schweif blau-silber wie Gischt; oben zerstaeubt er leise weiss */
LICHTYP.ozeankomet=function(o,A,B,s,opt){ const m=lMund(o), [Q,a]=lQuerWinkel(opt);
  const k=lochOhneKopf(()=>kfKometF(m,Q,a,A,mischF(lHell(A,1.05),[1.3,1.32,1.4],0.45),28*Math.sqrt(s),7.5,KF_ART.welle));
  lStart(m,1.1,0.5); sfx.zischen(distVol(m)*0.35,1.2);
  kgSpaeter(k.T,()=>qMini(sternNach(k.e,k.v[0],k.v[1],k.v[2],7.5,k.T),B,s*0.6,7,'plopp')); };
/* Polarlicht-Vorhang (Polarnacht): dunkler Aufstieg, oben spannt sich
   quer ein Band aus gruenen Glitzersternen, das langsam als Vorhang
   herabsinkt und unten violett ausfranst - wie ein Nordlicht */
LICHTYP.polarvorhang=function(o,A,B,s,opt){
  lDunkel(o,s,opt,31,e=>{ const Q=lQuer({dir:FANDIR}), n=Math.round(30*QUAL())+8, W=rand(5,7)*Math.sqrt(s), ph=rand(0,6.3);
    for(let i=0;i<n;i++){ const u=i/(n-1)-0.5, x=u*W, y=Math.sin(u*5+ph)*1.2, q={x:e.x+Q[0]*x,y:e.y+y,z:e.z+Q[2]*x};
      const dv=[Q[0]*u*1.6+rand(-.15,.15),rand(-0.4,0.2),Q[2]*u*1.6+rand(-.15,.15)], L=rand(3.6,4.4);
      const h=kgStern(psBig,q,dv,lHell(A,1.25),L,0.55,4,0.9); kgSpaeter(L*rand(0.55,0.7),()=>kgFarbe(h,lHell(B,1.2)));
      lFunken(q,dv,0.55,0.2,L,10,mischF(lHell(A,0.75),lHell(B,0.75),0.4),{ps:psMid,life:[1.4,2.2],g:0.35,streu:0.05,mit:0.02,mode:4,spur:0.3}); }
    schall(e,x=>{ sfx.plopp(x*0.3,1.1); later(0.3,()=>sfx.rieseln(x*0.5,4)); }); });
};

/* ---------- 5. Die Batterien aus Toms PDF (05.10.) ---------- */

/* Regenbogenkometen, L5. PDF: "an sich schoen, nur viel zu viele ...
   zehn oder so ... das weniger intensiv machen". Vorher 10 Rohre mit
   234 Kometen. Jetzt 10 Rohre, 10 Kometen: einzeln in Regenbogenfolge
   (Rot, Orange, Gelb, Gruen, Tuerkis, Blau, Violett), aus der Mitte nach
   aussen verdrahtet; zum Schluss Rosa, Gelb und Hellblau zugleich. */
lbShow('lb_regenbogenbrunnen',[['rot','rot'],['orange','orange'],['zitrone','zitrone'],['gruen','gruen'],['tuerkis','tuerkis'],['blau','blau'],['violett','violett']],{sz:[0.85,1.0],pw:[0,0],hell:[0.9,1.1],kurve:'linear'},
  [0,1,2,3,4,5,6].map(f=>({n:1,licht:'regenbogenkomet',kal:'mittel',farbe:f,pause:f===6?1.6:0.55}))
  .concat([{n:3,gap:0.15,licht:'regenbogenkomet',kal:'mittel',A:['rose','zitrone','himmel'],pause:4.5}]),{verzoegerung:false});
LICHT_BRENN.regenbogenkomet=4;
lochName('lb_regenbogenbrunnen',{name:'Regenbogenkometen · 10 Schuss Farbkometen',sub:'10 Schuss Farbkometen',
  desc:'Zehn helle Kometen, jeder in einer Regenbogenfarbe – Rot, Orange, Gelb, Grün, Türkis, Blau, Violett –, einer nach dem anderen, aus der Mitte nach außen; zum Schluss drei zugleich. Leise, ohne Knall.'});
if(P.lb_regenbogenbrunnen) P.lb_regenbogenbrunnen.zuendung='mitte';
SIGNATUR.lb_regenbogenbrunnen={eff:'licht:regenbogenkomet',text:'Zehn Farbkometen nacheinander in Regenbogenfolge, je Rohr einer'};

/* Dreisprung, L8. PDF: "Den Effekt und die Batterie finde ich super, aber
   das sind mehr Schuss als 9 ... die Batterie ist dann einfach groesser".
   Gezaehlt: 9 Bomben + 15 Kometen aus dem Fontaenen-Modul = 24. Der
   Ablauf bleibt, die 15 Goldkometen kommen jetzt aus 15 eigenen Rohren
   -> Dreisprung 24, die Batterie waechst von 18 auf knapp 30 cm. */
{ const alt=SHOWS.miniverbund; SHOWS.miniverbund=()=>{ const s=alt(), k=show({basis:s.basis,rampe:s.rampe},s.map(ph=>Object.assign({},ph)));
  const b=k[2].boden; delete k[2].boden;
  k.push({mit:(b&&b.t)||1.9,n:15,gap:0.2,licht:'strahlgold',kal:'mittel'}); return k; }; }
lochName('miniverbund',{name:'Dreisprung · 24 Schuss Stufenbatterie',short:'Dreisprung 24',
  desc:'Hop, Step, Jump: dreimal drei Schuss, jeder Sprung landet höher als der letzte. Der dritte Satz endet mit einer Goldpalme, darunter steigen fünfzehn Goldkometen aus fünfzehn Rohren.'});
lochGroesser('miniverbund',9,24);
/* Verpackung: drei Stufenbloecke mit je acht statt drei Rohren (2 x 4) */
VP_FORM.miniverbund=t=>{ const k=neu(t), e=0.003, bw=(k.w-2*e)/3, d=k.d-2*e, H=k.h-0.003, hs=[0.6,0.8,1], nb=Math.ceil(rohrBedarf(t).schuss/3), cols=2, rows=Math.ceil(nb/2);
  hs.forEach((f,i)=>{ const x=-k.w/2+e+bw*(i+0.5), h=H*f, F=['#f28a1c','#ffd23f','#d8322a'][i], rv=reg(k,'rv'+i,bw,h,pRohrSeite({n:cols,farbe:F,kopf:'#f2f5ff'}));
    kasten(k,bw-0.001,h,d,tm(x,h/2,0),{pz:rv,nz:rv,px:reg(k,'rs'+i,d,h,pRohrSeite({n:rows,farbe:F,kopf:'#f2f5ff'})),nx:'rs'+i,py:reg(k,'rd'+i,bw,d,pRohrDeckel({cols,rows,kappe:['#5a1a02','#f28a1c','#ffd23f'][i],wand:F,schnur:false})),ny:farbe(k,'#2a2018')});
    klar(k,new THREE.BoxGeometry(bw,h+0.002,d+2*e),tm(x,(h+0.002)/2,0)); });
  banderole(k,{w:k.w-2*e,d,x:0,z:0},0.008,H*0.58);
  return fertig(k); };

/* Glitzerregen, L9. PDF: "ahnlich wie bei der anderen Batterie ... mehr
   Schuss ... die Batterie muss ein bisschen groesser sein". Gezaehlt:
   12 + 29 Modul-Kometen. Jetzt 12 Goldbuketts + 16 Glitzerkometen aus
   eigenen Rohren = 28 */
{ const alt=SHOWS.glitzerregen12; SHOWS.glitzerregen12=()=>{ const s=alt(), k=show({basis:s.basis,rampe:s.rampe},s.map(ph=>Object.assign({},ph)));
  delete k[2].boden; k.push({mit:0,n:16,gap:0.18,licht:'strahlgold',kal:'mittel'}); return k; }; }
lochName('glitzerregen12',{name:'Glitzerregen · 28 Schuss',short:'Glitzerregen 28',
  desc:'Zwölf Goldbuketts, die hinter sich einen funkelnden Regen herziehen. Zum Schluss wird der Glitzerregen immer dichter: sechzehn Glitzerkometen steigen aus sechzehn Rohren.'});
lochGroesser('glitzerregen12',12,28);

/* Schneeballschlacht, L10. PDF: "bitte ohne die breiten Fontaenen ...
   Ersetze den Effekt durch einen anderen - gerne auch andere Anordnung
   ... passend und kohaerent schoen". Keine Fontaene mehr; die Rohre
   sind links/rechts im Wechsel verdrahtet - die Schneebaelle fliegen
   hin und her wie bei einer Schneeballschlacht; zum Schluss faellt
   Schnee: zwei Silberregen, die lange haengen, und zwei letzte
   Pulverschnee-Wuerfe hoch darueber. Zwoelf Rohre, zwoelf Schuss. */
SHOWS.schneeballschlacht=()=>show({basis:{pw:-7.5,sz:0.60,th:'silber'}, rampe:{sz:[0.9,1.2],pw:[-1,1.5],hell:[0.9,1.2],kurve:'linear'}}, [
  {n:2,gap:1.4,muster:'gerade',eff:'pulverschnee',kal:'klein',steig:'silber',pause:0.8},
  {n:6,gap:0.9,muster:'x',ang:0.38,rohre:'breit',eff:'pulverschnee',steig:'silber',pause:1.4},
  {n:2,gap:0.6,muster:'v',ang:0.2,eff:'silberregen',A:'silber',B:'weiss',kal:'mittel',steig:'silber',pause:0.5},
  {n:2,gap:0.3,muster:'paar',ang:0.3,eff:'pulverschnee',kal:'mittel',pw:2,steig:'silber',pause:4.0}]);
SHOW_BASIS.schneeballschlacht={pw:-7.5,sz:0.60,th:'silber'};
if(P.schneeballschlacht) P.schneeballschlacht.zuendung='wechsel';
lochName('schneeballschlacht',{desc:'Schneebälle fliegen von links und rechts hin und her und zerfallen zu sinkendem Silberschnee; zum Schluss rieselt ein Schneefall aus Silberregen, darüber die letzten zwei Würfe.'});
SIGNATUR.schneeballschlacht={idee:'kreuzwurf',eff:'pulverschnee',text:'Schneebaelle fliegen hin und her und zerfallen zu Silberschnee, zum Schluss Schneefall'};

/* Pfauenrad, L11. PDF: "sehr schoen - aber Name passt nicht. Ansonsten
   top". Das Bild: Goldpalmen, an deren Wedelspitzen tuerkise Augen
   aufgehen, dazu Goldkometen - Palmen ueber tuerkisem Wasser: Oase.
   Ablauf bleibt; die Faecher-Fontaene im Finale (29 Kometen aus einem
   Modul) kommt jetzt als zehn Goldkometen aus zehn Rohren: 19 + 10 = 29. */
{ const alt=SHOWS.pfauenrad; SHOWS.pfauenrad=()=>{ const s=alt(), k=show({basis:s.basis,rampe:s.rampe},s.map(ph=>Object.assign({},ph)));
  delete k[3].boden; k.push({mit:0,n:10,gap:0.2,licht:'strahlgold',kal:'mittel'}); return k; }; }
lochName('pfauenrad',{name:'Oase · 29 Schuss Goldpalmen',short:'Oase 29',titel:'OASE',sub:'29 Schuss Goldpalmen',
  desc:'Goldene Palmen, an deren Wedelspitzen türkise Lichter aufgehen wie Wasser zwischen den Palmen – erst einzeln, dann fünf auf einmal, zum Schluss sieben Palmen über zehn Goldkometen.'});
lochGroesser('pfauenrad',19,29);
/* Verpackung: zwei Reihen Faecherrohre wie bisher, jetzt 15 + 14 statt 9 + 9 */
VP_FORM.pfauenrad=t=>{ const k=neu(t), w=k.w, h=k.h, d=k.d, hb=h*0.7, N=rohrBedarf(t).schuss||18, tr=Math.min(0.017,w*0.78/Math.ceil(N/2)*0.45);
  kasten(k,w,hb,d,tm(0,hb/2,0),{pz:reg(k,'front',w,hb,pFront(k)),nz:'front',px:reg(k,'seite',d,hb,pSeite(k)),nx:'seite',py:farbe(k,'#b8925f'),ny:farbe(k,'#2a2018')});
  const L=h-hb+0.03; for(let r=0;r<2;r++){ const n=r?Math.floor(N/2):Math.ceil(N/2); for(let i=0;i<n;i++){ const f=n>1?i/(n-1)-0.5:0, til=f*0.7, x=f*w*0.78, z=(r-0.5)*d*0.45, cy=hb-0.03+L/2*Math.cos(til);
    vzyl(k,tr,tr,L,10,x-Math.sin(til)*L/2,cy,z,'#b8925f',0,0,-til); vzyl(k,tr*0.85,tr*0.85,0.004,10,x-Math.sin(til)*L,hb-0.03+L*Math.cos(til)+0.001,z,['#5cff9e','#ffd23f'][(i+r)%2],0,0,-til); } }
  vbox(k,w*0.9,0.03,0.003,0,hb+0.005,d/2-0.004,'#c9a676');
  return fertig(k); };
SIGNATUR.pfauenrad={eff:'pfauenauge',text:'Goldpalmen mit tuerkisen Spitzen, als Faecher auf Schlag - eine Oase'};

/* Ozean, L11. PDF: "Ozean Produkt bitte neu. Will hier schoene blaue
   Effekte. Blaue breite Fontaenen (aber ohne Faecher-Effekt, sondern
   einzelne schoene helle), dann am Ende auch hoch fliegende Knalle mit
   schoenen Effekten". Abschnitte: Duenung (blaue Kometen einzeln, aus
   der Mitte), Wellenkaemme (Zackenkometen mit weisser Gischt),
   Brandung (zehn helle blaue Kometen kurz nacheinander - die "breite
   Fontaene", je Rohr einer), Meeresleuchten (Wechselblueten), zum
   Schluss sechs hohe Knalle: Quallen, Gischtkronen, Silberwellen. */
nbShow('lb_saphirfaecher',[['blau','himmel'],['himmel','weiss'],['tuerkis','blau'],['blau','silber']],{sz:[0.9,1.2],pw:[0,1],hell:[0.9,1.25],kurve:'linear'},[
  {n:4,gap:1.1,muster:'mitte',ang:0.25,licht:'ozeankomet',kal:'mittel',farbe:0},
  {n:6,gap:0.45,muster:'w',ang:0.3,licht:'zackkomet',farbe:1,pause:1.0},
  {n:10,gap:0.12,muster:'welle',ang:0.35,licht:'ozeankomet',kal:'gross',farbe:2,pause:1.2},
  {n:4,gap:0.4,muster:'aussen',ang:0.35,licht:'wechselbluete',farbe:3,pause:1.0},
  {n:6,gap:0.35,muster:'mitte',ang:0.2,eff:['qualle','spritzkrone','wasserring'],A:['blau','himmel','silber'],B:['silber','weiss','blau'],kal:'gross',pw:6,steig:'silber',knall:'bkDonnerhall',pause:6}]);
LICHT_BRENN.ozeankomet=4.5;
lochName('lb_saphirfaecher',{name:'Ozean · 30 Schuss Wellen & Gischt',sub:'30 Schuss Wellen & Gischt',
  desc:'Blau, Türkis und Silber: helle blaue Kometen steigen einzeln wie Wellen, Zackenkometen zerstäuben oben zu weißer Gischt, dann eine Brandung aus zehn blauen Kometen, Wechselblüten wie Meeresleuchten – zum Schluss sechs hohe Knalle: Quallen, Gischtkronen und Silberwellen.'});
lochGroesser('lb_saphirfaecher',16,30);
SIGNATUR.lb_saphirfaecher={idee:'Ozean',eff:'licht:ozeankomet',text:'Helle blaue Kometen je Rohr wie Wellen, Gischt, Brandung, hohe Quallen und Gischtkronen'};

/* Palmenhain, L13. PDF: "die Effekte oben am Himmel extrem schoen, aber
   ... zu viel in dieser Faecher-Variante ... mehr als 25 Schuss". Der
   Himmel bleibt, der Kometenfaecher aus dem Modul (29 Kometen) faellt
   weg - an seiner Stelle wieder die kleine Goldfontaene. 25 Rohre, 25 Schuss. */

/* Knattersturm, L14. PDF: "der Sound bei den Explosionen passt nicht".
   Jeder Bruch knattert jetzt (Klang knatter), kein Peng. Dazu Rohre =
   Starts: das Finale zuendete je Rohr einen Feuertopf UND eine Bombe -
   jetzt sechs Bomben und sechs Toepfe aus eigenen Rohren: 36. */
SHOWS.knatter=()=>show({basis:{pw:-4,sz:0.90,th:'eis'}, rampe:{sz:[0.85,1.3],pw:[-1.5,3],hell:[0.85,1.3],kurve:'spaet'}}, [
  {n:4,gap:1.5,muster:'gerade',eff:'drachenei',kal:'klein',steig:'knister',knall:'bkKnatter',pause:0.6},
  {n:6,gap:0.8,muster:'paar',ang:0.3,rohre:'breit',mineEff:'knister',mineSz:0.7,nurMine:true},
  {n:6,mit:true,gap:0.4,muster:'mitte',ang:0.3,eff:'tausend',steig:'knister',knall:'bkKnatter',pause:1.0},
  {n:8,gap:0.15,muster:'wischer',seg:2,ang:0.35,eff:'knister',kal:'klein',steig:'silber',knall:'bkKnatter',boden:{k:'knisterbrunnen',gt:4,gh:0.8,A:'silber',B:'weiss'},pause:1.2},
  {n:6,gap:0,muster:'schlag',ang:0.4,eff:'tausend',kal:'mittel',pw:2,steig:'knister',knall:'bkKnatter'},
  {n:6,mit:0,gap:0,muster:'schlag',rohre:'breit',mineEff:'knister',mineSz:0.8,nurMine:true,pause:3.5}]);
SHOW_BASIS.knatter={pw:-4,sz:0.90,th:'eis'};
lochName('knatter',{name:'Knattersturm · 36 Schuss Doppeldeck',short:'Knatter 36',sub:'36 Schuss Crackling'});
lochGroesser('knatter',30,36);

/* Rubinpalmen, L14. PDF: "am Anfang wieder diese gleichen Fontaenen ...
   zu eintoenig. Das muss geaendert werden". Statt des Kometenfaechers
   eroeffnet jetzt eine einzelne grosse rote Koenigspalme mit goldener
   Krone - danach alles wie bisher. */
nbShow('lb_rubinpalmen',[['rot','gold'],['scharlach','weiss'],['rose','gold']],{sz:[0.9,1.25],pw:[0,2],hell:[0.9,1.25],kurve:'spaet'},[
  {n:1,licht:'koenigspalme',kal:'gross',farbe:0,pause:2.5},
  {n:4,gap:1.2,muster:'aussen',ang:0.25,licht:'farbpalme',farbe:0},
  {n:6,gap:0.3,muster:'paar',ang:0.35,licht:'knistercrossette',farbe:1},
  {mit:true,n:4,gap:0.8,muster:'gerade',licht:'farbweidenkomet',farbe:2,pause:0.8},
  {n:7,gap:0.12,muster:'mitte',ang:0.3,licht:'farbpalme',kal:'gross',farbe:1,pause:5.5}]);
lochName('lb_rubinpalmen',{desc:'Eine große rote Königspalme eröffnet, dann rote Palmen mit rot-goldenen Wedeln, deren Enden in kleinen Explosionen zerstieben, knisternde Crossetten und rote Weiden.'});

/* Jadeader, L8. PDF: "diese gruenen Kometen am Anfang echt schoen, aber
   dann wird's halt auch verschiedene Farben ... dass das bei Gruen
   bleibt ... zwei, drei Knaller am Ende oben in der Luft ... gruene
   Funken ... lass den Namen erst mal". Name und 20 Schuss bleiben;
   alles in Gruen (Kopf, Schweif, Funken, Mini-Explosionen), zum Schluss
   drei gruene Knaller hoch oben. */
nbShow('lb_jadeader',[['gruen','jade'],['jade','limette'],['limette','gruen'],['polargruen','gruen']],{sz:[0.85,1.15],pw:[0,1],hell:[0.9,1.2],kurve:'spaet'},[
  {n:4,gap:1.0,muster:'aussen',ang:0.3,licht:'jadekomet',farbe:0},
  {n:4,gap:0.5,muster:'z',ang:0.35,licht:'jadeweide',farbe:1},
  {mit:true,n:2,gap:1.2,rohrFolge:[-1,1],licht:'jademine',farbe:2,pause:0.8},
  {n:7,gap:0.12,muster:'welle',ang:0.4,licht:'jadekomet',kal:'gross',farbe:3,pause:1.2},
  {n:3,gap:0.45,muster:'v',ang:0.15,eff:'jadeknall',A:'gruen',B:'jade',kal:'mittel',pw:7,steig:'farbspur',knall:'bkSalut',pause:4}]);
lochName('lb_jadeader',{desc:'Ganz in Grün: Jadekometen mit grünem Funkenschweif, hängende Jadeweiden, zwei grüne Glitzersäulen und eine Welle aus sieben Kometen – zum Schluss drei grüne Knaller hoch oben.'});
SIGNATUR.lb_jadeader={eff:'licht:jadekomet',text:'Gruene Kometen mit gruenen Funken, Jadeweiden, zum Schluss drei gruene Knaller'};

/* Polarnacht, L15. PDF: "noch kohaerenter machen und paar mehr Schuesse
   hinzufuegen". Eine Farbfamilie: Polarlicht-Gruen und Tuerkis, nur die
   Saeume werden violett. Neu ein Abschnitt Polarlicht-Vorhaenge (quer
   haengende Lichtbaender, die langsam sinken). 26 Schuss. */
nbShow('lb_polarweiden',[['polargruen','tuerkis'],['mint','aqua'],['tuerkis','violett'],['gruen','tuerkis']],{sz:[0.9,1.25],pw:[0,2],hell:[0.85,1.25],kurve:'spaet'},[
  {n:3,gap:1.6,muster:'v',ang:0.2,licht:'polarweide',farbe:0},
  {n:6,gap:0.35,muster:'wischer',ang:0.4,licht:'fallkomet',farbe:1},
  {mit:true,n:3,gap:1.0,rohrFolge:RF3,licht:'farbschirm',farbe:3,pause:1},
  {n:6,gap:0.7,muster:'aussen',ang:0.3,licht:'polarvorhang',farbe:2,pause:1},
  {n:8,gap:0.13,muster:'kreis',ang:0.3,licht:'polarweide',kal:'gross',farbe:2,pause:6}]);
LICHT_BRENN.polarvorhang=6;
lochName('lb_polarweiden',{name:'Polarnacht · 26 Schuss Polarlichter',sub:'26 Schuss Polarlichter',
  desc:'Polarlicht in Grün und Türkis: Weiden, deren Fäden im Sinken türkis und violett werden, Sternschnuppen, Glitzerschirme und quer hängende Lichtvorhänge, die langsam sinken – zum Schluss acht Polarweiden im Kreis.'});
lochGroesser('lb_polarweiden',20,26);
SIGNATUR.lb_polarweiden={eff:'licht:polarvorhang',text:'Polarlicht: gruene Weiden und quer haengende Lichtvorhaenge, die violett ausfransen'};

/* Sonnenaufgang, L16 (Tom nennt sie "Rakete"; es ist die Faecherbatterie
   faecher). PDF: "von Anfang bis 80-90 Prozent ist gut und dann am Ende
   ... kommt nochmal so ein Schuss und die letzten Fontaenen. Das passt
   nicht ganz zusammen". Bis zum Strahlenkranz bleibt alles; die Fontaene
   mitten im Tag (vorher 20 Modul-Kometen) steigt als sechs Goldkometen
   aus eigenen Rohren. Neuer Schluss: kein einzelner Nachzuegler und keine
   Bodenfontaene mehr - mit dem Strahlenkranz zugleich geht die Sonne als
   drei goldene Glitzerweiden in der Mitte auf, die lange haengen und
   langsam verglimmen. 36 - 1 + 6 + 3 = 44 Schuss. */
{ const alt=SHOWS.faecher; SHOWS.faecher=()=>{ const s=alt(), k=show({basis:s.basis,rampe:s.rampe},s.map(ph=>Object.assign({},ph)));
  const tag=k.findIndex(ph=>ph.boden&&ph.muster==='v'); if(tag>=0){ delete k[tag].boden; k.splice(tag+1,0,{mit:0,n:6,gap:0.9,licht:'strahlgold',kal:'mittel'}); }
  const L=k.length-1; if(k[L].mit&&k[L].eff==='pistill'){
    k[L]={mit:0.25,n:3,gap:0.3,muster:'mitte',ang:0.08,eff:'kamuro',A:'gold',B:'bernstein',kal:'gross',pw:13,steig:'brokat',bruchOpt:{nachglitzer:false},knall:'bkBrokat',pause:5}; }
  return k; }; }
lochName('faecher',{name:'Sonnenaufgang · 44 Schuss Halbkreisfächer',sub:'44 Schuss Halbkreisfächer',
  desc:'Erst glüht die Morgenröte tiefrot am Himmel, dann schießen goldene Strahlen bis flach über den Boden hinaus – zum Schluss geht mit dem Strahlenkranz in der Mitte die Sonne auf und sinkt als goldener Glitzerregen.'});
lochGroesser('faecher',36,44);
SIGNATUR.faecher={muster:'halbkreis',text:'Strahlenkranz bis zum Horizont, darin geht die Sonne als goldene Weide auf'};

/* Hexenkessel, L20. PDF: "am Anfang wieder diese goldenen Fontaenen. Es
   sieht alles zu eintoenig aus. Das muss weg ... und ansonsten ein
   bisschen abaendern". Keine Fontaene mehr; sieben Abschnitte, jeder mit
   einem anderen Bild, alle in Limette/Violett: der Kessel brodelt
   (Feuertoepfe aus eigenen Rohren, darueber Polarweiden), Hexenringe,
   Irrlichter, Hexenbesen (knisternde Kometen kreuz und quer), Beschwoerung
   (violette Schirme), Hexentanz (Kiefern und Lava), Walpurgisnacht
   (Ringe auf acht Rohren, dazwischen Feuertoepfe aus eigenen Rohren).
   180 Rohre, 180 Starts. */
SHOWS.hexenkessel=()=>show({verzoegerung:true,basis:{pw:2.15,sz:1.175,th:'hexe2'},rampe:{sz:[0.90,1.25],pw:[0,2],hell:[0.90,1.35],kurve:'spaet'}},[
  {n:8,gap:0.45,muster:'gerade',rohre:'breit',mineEff:'knister',mineSz:0.8,nurMine:true,farbe:0},
  {mit:0.8,n:4,takt:[1.4],muster:'v',ang:0.40,licht:'polarweide',farbe:0,pause:1.2},
  {n:32,je:8,takt:[0.9,0.9,0.5],muster:'kreis',ang:0.40,eff:['wechsel','tigerschweif'],kal:'mittel',farbVert:'wechsel',pause:1.2},
  {n:16,gap:0.35,muster:'zufall',ang:0.35,eff:'irrlicht',kal:'klein',farbe:2,steig:'keiner',pause:1.0},
  {n:20,gap:0.18,muster:'x',ang:0.45,licht:'strahlknister',A:'limette',B:'violett',farbe:2,pause:1.0},
  {n:6,gap:1.0,muster:'gerade',licht:'farbschirm',farbe:1,pause:0.6},
  {n:14,gap:0.25,muster:'aussen',ang:0.40,licht:'zackkomet',farbe:3,pause:0.8},
  {n:16,gap:0.35,muster:'spirale',ang:0.35,eff:['kiefernkrone','lavaregen'],farbe:3,pause:1.0},
  {n:48,je:8,takt:[0.35],muster:'kreis',ang:0.50,rohre:'breit',kal:'gross',eff:['palme','wechsel','sternspritzer','tigerschweif'],farbe:0},
  {mit:0,n:16,je:2,takt:[1.05],muster:'gerade',rohre:'breit',mineEff:'farbe',mineSz:0.9,nurMine:true,farbe:3,pause:4.5}]);
lochName('hexenkessel',{name:'Hexenkessel · 180 Schuss Walpurgisnacht',sub:'180 Schuss · Walpurgisnacht',
  desc:'Erst brodelt der Kessel: knisternde Feuertöpfe, darüber Weiden, die von Limette zu Violett werden. Dann Hexenringe aus acht Rohren, Irrlichter, Hexenbesen kreuz und quer, violette Schirme, ein Hexentanz aus Kiefern und Lava – das Finale eine Walpurgisnacht aus Ringen und Feuertöpfen.'});
SIGNATUR.hexenkessel={idee:'Walpurgisnacht',eff:'tigerschweif',text:'Brodelnder Kessel aus Feuertoepfen, Hexenringe, Irrlichter, Hexenbesen und Walpurgisnacht'};

/* Farbsaeulen, L20. PDF (wie Hexenkessel): goldene Fontaenen am Anfang
   weg, Abwechslung. Das Thema sind Saeulen aus Farbe: eroeffnet wird mit
   einem Saeulengang aus Feuertoepfen (Sternsaeulen Magenta/Limette, jede
   aus ihrem Rohr), darueber Pistillbomben mit Farbkomet-Aufstieg und
   weiteren Saeulen, Kronenkometen ueber Blinksaeulen, Farbpalmen,
   Zackenkometen und ein Finale aus Dahlien und Kronleuchtern ueber zehn
   Saeulen. Kein Rohr feuert zweimal: 100 Rohre, 100 Starts. */
SHOWS.feuerpfau=()=>show({verzoegerung:true,basis:{pw:2.10,sz:1.170,th:'saeulen'},rampe:{sz:[0.90,1.25],pw:[-1,2],hell:[0.95,1.35],kurve:'frueh'}},[
  {n:8,gap:0.7,muster:'gerade',rohre:'breit',mineEff:'farbe',mineSz:1.0,nurMine:true,farbVert:'wechsel',pause:1.2},
  {n:12,gap:0.55,muster:'aussen',ang:0.50,steig:'farbkomet',eff:'pistill',farbVert:'wechsel'},
  {mit:0,n:6,gap:1.1,muster:'gerade',rohre:'breit',mineEff:'farbe',mineSz:0.9,nurMine:true,farbe:1,pause:1.2},
  {n:12,gap:0.9,muster:'v',ang:0.35,licht:'kronenkomet',farbe:1},
  {mit:0,n:6,gap:1.8,nurMine:true,mineEff:'blink',muster:'gerade',farbe:0,pause:0.8},
  {n:16,gap:0.30,muster:'paar',ang:0.45,licht:'farbpalme',farbe:0,pause:1.2},
  {n:14,gap:0.14,muster:'mitte',ang:0.55,licht:'zackkomet',kal:'gross',farbe:2,pause:1.0},
  {n:16,je:8,takt:[0.8],muster:'schlag',ang:0.60,steig:'farbkomet',eff:['dahlie','kronleuchter'],kal:'riesig',farbe:2,farbVert:'mitte'},
  {mit:0,n:10,gap:0.25,muster:'gerade',rohre:'breit',mineEff:'farbe',mineSz:1.1,nurMine:true,farbe:2,pause:4.5}]);
lochName('feuerpfau',{desc:'Erst ein Säulengang aus Farbe: Feuertöpfe stellen Säulen aus Magenta und Limette auf, darüber Pistillbomben mit farbigem Aufstieg. Dann Kronenkometen über blinkenden Säulen, Farbpalmen, Zackenkometen – das Finale Dahlien und Kronleuchter über zehn Säulen.'});
SIGNATUR.feuerpfau={idee:'Saeulengang',eff:'pistill',text:'Saeulen aus Farbe: Feuertoepfe, Pistille, Kronenkometen ueber Blinksaeulen'};

/* ---------- 6. Die anderen Lichter-Batterien: kein Faecher-Opener ----------
   Toms Muster (02.10.: "du machst oft immer so eine Fontaene am Anfang";
   PDF Rubinpalmen/Hexenkessel: "am Anfang wieder diese gleichen
   Fontaenen ... zu eintoenig"): Farbtiger, Kronenfeuer, Blitzpalmen und
   Urwald begannen alle mit einem Kometenfaecher und 5-6 s Pause. Aus dem
   Faecher wurde ein einzelner Komet - danach stand der Himmel leer. Jetzt
   beginnt jede mit ihrem eigenen Bild; die Rohre des Openers gehen ins
   Finale (Schusszahl bleibt). */
function lochOhneOpener(id,plus){ const alt=SHOWS[id]; if(!alt) return;
  SHOWS[id]=()=>{ const s=alt(), k=show({rampe:s.rampe,basis:s.basis,verzoegerung:s.verzoegerung},s.map(ph=>Object.assign({},ph)));
    if(k[0]&&/^breit/.test(k[0].licht||'')){ const n=k[0].n===undefined?1:k[0].n; k.shift(); const L=k[k.length-1]; L.n=(L.n===undefined?1:L.n)+(plus===undefined?n:plus); }
    return k; }; }
['lb_farbtiger','lb_kronenfeuer','lb_blitzpalmen','lb_jadekoenig'].forEach(id=>lochOhneOpener(id));
lochName('lb_farbtiger',{desc:'Dunkler Aufstieg, dann schwere Tigerkometen in Grün, Blau und Magenta mit breitem Glitzerband, knisternde Crossetten und Farbweiden – das Finale zehn Tiger aus der Mitte.'});
lochName('lb_kronenfeuer',{desc:'Kronenkometen wie die Crossettenkrone: sechs Arme wechseln die Farbe, an jedem Ende hängt eine Glitzerkrone – in Rot, Blau, Grün und Violett mit Gold, dazu Farb- und Doppelkronen; das Finale zehn Kronen.'});
lochName('lb_blitzpalmen',{desc:'Jede Palme anders: Blitzpalme, Farbpalme, Königspalme mit Silberkrone, Palmenweide, Stufenpalme – Finale aus sieben Doppelpalmen.'});
lochName('lb_jadekoenig',{desc:'Grün in allen Tönen: Blütenkreuze, lang hängende Lianen-Weiden, knisternde Zackenkometen wie schwirrende Insekten und grüne Glitzersäulen; Finale: zwölf Urwaldpalmen im W.'});
lochName('lb_goldader',{desc:'Goldkometen kreuz und quer – mal links, mal rechts –, Glitzerminen, Weidenkometen und Goldkometen im W; ein Finale aus sechzehn Goldkometen über einer kleinen Goldfontäne, zum Schluss acht Weiden.'});
lochName('kreuzfeuer90',{desc:'Crossetten teilen sich im Kreuz, farbige Crossetten und Farbkometen im Wischer, zum Schluss Dreifach-Crossetten – neunzig Schuss ohne großen Knall.'});
