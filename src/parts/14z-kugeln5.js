/* =========================================================
   Kugelbomben-Runde 5 (Tom, 09.10.2026, docs/uebergabe/kugelbomben-0910.md)
   Daten: 02h-kugeln5.js, Verpackung: 04j-form-kugeln5.js.
   1. KNALL: "Oft fehlen die Explosionen - jede Kugelbombe macht einen
      lauten Knall beim Zerlegen, je Bombe unterschiedlich."
      Gemessen (09.10., Klang-Mitschnitt wie abschussklang.js, Anteil ueber
      ~300 Hz): der Bruch auf 86-90 m kommt mit distVol ~0,19 an, der
      Bruchklang war ein Klang aus der Batterie-Palette (Puff, Plopp, Wumms,
      Doppel) oder ein eigener Ton (Herzton, Wumms) - am Ohr 0,02-0,08 bei
      Herzschlag, Leuchtqualle, Granatapfel, Riesenpalme, Blauregen,
      Goldbrokat; der Abschuss am Moerser misst dagegen ~0,9. Der Bruch war
      also 10- bis 40-mal leiser als der Abschuss und dazu meist Bass, den
      ein Laptop nicht wiedergibt. Neu: jede Kugel hat einen eigenen
      Bruchknall (KNALL5) aus Schlag (hoher Crack), Mitte (Druck, hoerbar
      aus kleinen Lautsprechern), Koerper und Tiefton, dazu je nach Art
      Doppelschlag, Echo, rollender Nachhall, Knistern oder Zischen. Laut
      wie ein echter Kugelbruch: hoch am Himmel faellt er kaum ab (k5Laut).
      Dazu ein kurzer Zerlegerblitz (0,06 s, kein Leuchtball).
   2. GROESSE: Profi (Level 17-21) um 118 m, Koenigsklasse um 125 m
      (Himmelsbrecher 121 m ist Toms Massstab), Urknall ueber 165 m -
      Durchmesser von 90 % der Sterne, gemessen in der Vorfuehrung.
   3. OPTIK: Brokat-Gold (heller Kopf, glitzernder Funkenschleier, der
      abkuehlt und haengt - statt gleichfarbiger Haarlinien), Sterne mit
      weissheissem Kern und farbigem Hof, Tigerkometen mit breitem
      Glitzerband.
   4. NEU: 10 Kugeln (5 Profi, 5 Koenigsklasse), jede eine Anomalie.
   ========================================================= */

/* ---------- Werkzeuge ---------- */
/* Stern mit weissheissem Kern und farbigem Hof (Kugel aus 90 m: ohne Kern
   nur ein matter Fleck) */
function k5Stern(p,v,c,T,G,o){ o=o||{}; const md=o.mode||0;
  const h=kgStern(psHuge,p,v,kgMal(c,o.hof||1),T,G,md,o.spur!==undefined?o.spur:0.12,o.maxl);
  kgStern(psBig,p,v,mischF(c,[1.65,1.6,1.5],o.weiss!==undefined?o.weiss:0.38),T*0.93,G,md,0,o.maxl?o.maxl*0.93:undefined);
  return h; }
/* Glitzer-Funkenschleier entlang einer Bahn: wenige helle Glanzpunkte
   (psBig, sichtbar aus 90 m) und viel feiner Staub (psMid) */
function k5Schleier(p,v,G,t0,t1,c,glanz,staub,o){ o=o||{};
  if(glanz) rkFunken(p,v,G,t0,t1,glanz,mischF(c,[1.6,1.4,1.0],0.35),{ps:psBig,life:o.gl||[0.3,0.65],g:o.gg!==undefined?o.gg:1.0,streu:o.streu||0.25,mit:0.04,mode:4,spur:0});
  if(staub) rkFunken(p,v,G,t0,t1,staub,c,{ps:psMid,life:o.sl||[0.9,1.6],g:o.sg!==undefined?o.sg:0.6,streu:o.streu||0.2,mit:0.03,mode:4,spur:0.06}); }
/* Brokat-Gold (Kamuro/Brokat): ein warmweisser, flackernder Kopf mit
   kurzer Flamme, dahinter ein Schleier aus Glitzerfunken - erst gelbweiss,
   dann orange abkuehlend; die Sterne sinken langsam wie eine Krone */
const K5_GOLD_STAUB=[[1.25,.86,.34],[1.15,.66,.2],[1.3,.98,.5]];
function k5Brokat(p,n,w,T,G,o){ o=o||{}; const hs=[], kopf=o.kopf||[1.85,1.4,0.7];
  (o.vert||nKugel)(n,w,(v,i)=>{ const L=T*rand(0.9,1.05);
    hs.push([kgStern(psBig,p,v,kopf,L,G,4,0.1),v,L]);
    k5Schleier(p,v,G,0.05,L*0.92,K5_GOLD_STAUB[i%3],o.glanz!==undefined?o.glanz:7,o.staub!==undefined?o.staub:20,{gg:0.7,sg:0.45,sl:[1.0,1.8]}); });
  return hs; }
/* Tigerkomet: schwerer Kopf, breites Glitzerband (Farbtiger) */
function k5Tiger(p,v,c,T,G,o){ o=o||{};
  const h=k5Stern(p,v,kgMal(c,1.5),T,G,{spur:0.18,weiss:0.3});
  k5Schleier(p,v,G,0.04,T*0.95,mischF(c,[1.2,.85,.35],o.gold!==undefined?o.gold:0.45),o.glanz||12,o.staub||40,{streu:0.45,gl:[0.35,0.7],sl:[0.9,1.5],sg:0.8});
  return h; }
/* Knister-Nest: n dunkle Sterne, die einmal hart aufknacken (Drachenei) */
/* aus 90 m sind psSmall-Funken (7 cm) kleiner als ein Pixel - das
   Knacken braucht sichtbare Punkte: jeder zweite Funke ist ein psBig */
function k5Knister(e,n,w,c,o){ o=o||{}; const a=SCHWEIF; SCHWEIF=0;
  for(let i=0;i<n;i++){ const d=randDir(), s=rand(0.3,1)*w; (i%2?psSmall:psBig).emit(e.x,e.y,e.z,d[0]*s,d[1]*s,d[2]*s,c[0],c[1],c[2],rand(o.L?o.L[0]:0.3,o.L?o.L[1]:0.7),o.g||1,3); }
  SCHWEIF=a; }
/* Tochterbruch: im Protokoll als eigener Bruch (steigerung.js zaehlt Brueche) */
function k5Bruch(e,eff,sz){ if(typeof bruchGesehen==='function') bruchGesehen(eff);
  if(!(FW_LOG&&FW_LOG.brueche)) return; const R=FW_RAUM, f=R?R.f:1, P0=R?R.p:[e.x,e.y,e.z];
  FW_LOG.brueche.push({t:FW_UHR,eff,x:+(P0[0]+(e.x-P0[0])*f).toFixed(2),y:+(P0[1]+(e.y-P0[1])*f).toFixed(2),z:+(P0[2]+(e.z-P0[2])*f).toFixed(2),sz,tag:FW_TAG,stufe:true}); }
/* kurzer weisser Zerlegerblitz an einem Punkt (Tochter, Donnerschlag) */
function k5Punkt(e,c,n,w,hell){ const a=SCHWEIF; SCHWEIF=0; c=c||[1.9,1.9,1.85];
  psHuge.emit(e.x,e.y,e.z,0,0,0,c[0]*(hell||1),c[1]*(hell||1),c[2]*(hell||1),0.06,0,0);
  for(let i=0;i<(n||10);i++){ const d=randDir(), s=rand(0.6,1)*(w||9); psMid.emit(e.x,e.y,e.z,d[0]*s,d[1]*s,d[2]*s,1.6,1.55,1.4,rand(0.05,0.1),0,0); }
  SCHWEIF=a; }
const k5Pos=h=>kgLebt(h)?kgOrt(h)[0]:null;
/* Vektor d um die Achse ax (Einheitsvektor) um den Winkel a drehen */
function k5Dreh(d,ax,a){ const c=Math.cos(a), s=Math.sin(a), k=d[0]*ax[0]+d[1]*ax[1]+d[2]*ax[2];
  const x=[ax[1]*d[2]-ax[2]*d[1],ax[2]*d[0]-ax[0]*d[2],ax[0]*d[1]-ax[1]*d[0]];
  return [d[0]*c+x[0]*s+ax[0]*k*(1-c),d[1]*c+x[1]*s+ax[1]*k*(1-c),d[2]*c+x[2]*s+ax[2]*k*(1-c)]; }

/* =========================================================
   1. Der Bruchknall
   ========================================================= */
/* Lautstaerke am Ohr: ein Kugelbruch auf 90 m ist laut - er faellt mit
   der Entfernung kaum ab (v = distVol: 0,19 in der Vorfuehrung) */
/* 09.10.: nicht lauter als der Monsterboeller aus 10 m (boeller.js LAUT:
   der Boeller muss 1,25-mal so laut sein wie eine 150er Kugel) */
function k5Laut(v){ return clamp(0.5+(v||0)*1.4,0.45,1.0); }
/* Klangarten. Teile (Lautstaerke relativ):
   crack [vol, Hz, s, Filter]  harter Schlag (hoch)
   mitte [vol, Hz, s]          Druckwelle im hoerbaren Band (Bandpass)
   body  [vol, Hz, Hz2, s]     Koerper (Tiefpass, gleitet nach unten)
   sub   [vol, Hz, Hz2, s]     Tiefton
   doppel [s, Faktor]          zweiter Schlag
   echo [n, s, Faktor]         Echo von Haeusern und Waldrand
   hall [vol, s, Hz]           rollender Nachhall (Donner)
   knister [n, von, bis, vol]  Knistern nach dem Schlag
   zisch [vol, s]              Zischen der Glitzersterne */
const KNALL5_ART={
  kanone:{crack:[0.55,3200,0.06,'highpass'],mitte:[0.42,950,0.16],body:[0.85,560,140,0.9],sub:[0.45,58,30,0.6],echo:[2,0.42,0.38]},
  peitsche:{crack:[0.8,5200,0.05,'highpass'],mitte:[0.3,1500,0.1],body:[0.45,900,240,0.35],sub:[0.2,90,50,0.2],echo:[3,0.28,0.32]},
  dumpf:{crack:[0.22,2000,0.05,'bandpass'],mitte:[0.55,700,0.24],body:[0.95,320,70,1.2],sub:[0.6,44,24,0.9],hall:[0.16,1.6,160]},
  donner:{crack:[0.48,2600,0.08,'highpass'],mitte:[0.4,800,0.2],body:[0.75,400,110,0.8],sub:[0.5,48,26,0.8],hall:[0.36,3.4,170]},
  doppel:{crack:[0.5,3000,0.05,'highpass'],mitte:[0.38,1100,0.12],body:[0.7,480,150,0.6],sub:[0.35,64,36,0.4],doppel:[0.13,0.75]},
  knister:{crack:[0.5,3800,0.05,'highpass'],mitte:[0.36,1250,0.12],body:[0.65,600,180,0.5],sub:[0.3,70,40,0.35],knister:[26,0.25,1.6,0.16]},
  zisch:{crack:[0.45,3400,0.06,'highpass'],mitte:[0.4,1000,0.14],body:[0.7,560,160,0.6],sub:[0.35,60,34,0.5],zisch:[0.12,1.6]},
  hall:{crack:[0.4,2400,0.07,'bandpass'],mitte:[0.45,850,0.2],body:[0.8,420,120,0.8],sub:[0.4,52,28,0.7],hall:[0.25,2.4,210],echo:[1,0.9,0.4]},
  trommel:{crack:[0.6,2800,0.06,'highpass'],mitte:[0.45,780,0.16],body:[0.8,340,90,0.7],sub:[0.55,50,28,0.6],doppel:[0.09,0.6],echo:[2,0.35,0.3]}
};
/* je Kugel: Art, Tonhoehe f (x Frequenzen), Lautstaerke laut, Blitz, eigene Zusaetze */
const KNALL5_WAHL={
  kugel75:['doppel',{f:1.3,laut:0.8,blitz:0.6,zusatz:'herzton'}],
  silberdistel75:['knister',{f:1.35,laut:0.8,blitz:0.6}],
  goldbrokat100:['zisch',{f:1.15,laut:0.85,blitz:0.7}],
  hummelschwarm75:['peitsche',{f:1.25,laut:0.78,blitz:0.6}],
  kugel100:['dumpf',{f:1.15,laut:0.9,blitz:0.7}],
  blauregen100:['hall',{f:1.2,laut:0.85,blitz:0.6}],
  fackelhimmel150:['dumpf',{f:0.95,laut:0.95,blitz:0.8,hall:[0.22,2.2,140]}],
  crossettennetz150:['peitsche',{f:1.0,laut:0.95,blitz:0.9}],
  tigerkrone150:['zisch',{f:0.9,laut:1.0,blitz:0.9,zisch:[0.16,2.4]}],
  farbcrossette150:['doppel',{f:1.05,laut:0.95,blitz:0.9,doppel:[0.17,0.7]}],
  wetterleuchten150:['peitsche',{f:0.9,laut:1.0,blitz:1.0,echo:[3,0.34,0.4]}],
  schatztruhe200:['kanone',{f:1.1,laut:1.0,blitz:1.0}],
  kronenkranz200:['kanone',{f:1.0,laut:1.0,blitz:1.0,echo:[3,0.5,0.35]}],
  zwillingssonne200:['doppel',{f:0.95,laut:1.0,blitz:1.0,doppel:[0.22,0.9]}],
  blitzpalme200:['dumpf',{f:1.0,laut:1.0,blitz:0.8}],
  goldweidenkreuz200:['hall',{f:1.0,laut:1.0,blitz:0.9}],
  bluetenhagel200:['knister',{f:1.05,laut:1.0,blitz:1.0,knister:[34,0.2,1.4,0.18]}],
  aurora200:['hall',{f:0.9,laut:1.0,blitz:0.9,hall:[0.3,3.0,180]}],
  granatapfel200:['kanone',{f:0.95,laut:1.05,blitz:1.1,knister:[14,0.6,1.5,0.1]}],
  sonnensturm300:['donner',{f:0.95,laut:1.1,blitz:1.2}],
  kugel300:['peitsche',{f:0.85,laut:1.1,blitz:1.2,hall:[0.22,2.2,200]}],
  drachennest300:['knister',{f:0.9,laut:1.1,blitz:1.1,knister:[40,0.3,2.2,0.2]}],
  ringnebel300:['doppel',{f:0.85,laut:1.1,blitz:1.2,doppel:[0.16,0.85],echo:[2,0.5,0.35]}],
  kanonade300:['trommel',{f:1.0,laut:1.1,blitz:1.2}],
  sternensturm300:['donner',{f:1.08,laut:1.1,blitz:1.2}],
  riesenpalme300:['dumpf',{f:0.85,laut:1.1,blitz:1.0,sub:[0.7,40,22,1.1]}],
  kometensturm300:['zisch',{f:0.9,laut:1.15,blitz:1.2,zisch:[0.16,2.6]}],
  urknall300:['kanone',{f:0.9,laut:1.15,blitz:1.3,echo:[3,0.45,0.42]}]
};
const KNALL5={};
for(const id in KNALL5_WAHL){ const [art,o]=KNALL5_WAHL[id]; KNALL5[id]=Object.assign({art},KNALL5_ART[art],o); }
/* der Monster-Schlag des Urknalls - der lauteste Knall im Spiel */
const KNALL5_MONSTER={art:'monster',crack:[1.0,6500,0.16,'highpass'],mitte:[0.9,600,0.5],body:[1.25,340,60,1.8],sub:[0.95,34,16,2.6],
  echo:[3,0.55,0.5],hall:[0.6,6,150],knister:[60,0.5,3.2,0.24],f:1,laut:1.25};
/* Gegenprobe (kugelknall.js): KNALL5_AUS=true - der alte Bruchklang */
let KNALL5_AUS=false, K5_LOG=null;
function k5Knall(o,v){ const k=bkV(0.93,1.07)*(o.f||1), L=k5Laut(v)*(o.laut||1);
  const schlag=(t,f)=>{
    if(o.crack) bkR(t,{dur:o.crack[2]*bkV(0.9,1.1),vol:o.crack[0]*L*f,typ:o.crack[3],f:o.crack[1]*k,q:0.8});
    if(o.mitte) bkR(t,{dur:o.mitte[2],vol:o.mitte[0]*L*f,typ:'bandpass',f:o.mitte[1]*k,q:0.7});
    if(o.body) bkR(t,{dur:o.body[3]*bkV(0.9,1.1),vol:o.body[0]*L*f,f:o.body[1]*k,f2:o.body[2]*k});
    if(o.sub) bkT(t,o.sub[1]*k,o.sub[2]*k,o.sub[3],o.sub[0]*L*f); };
  schlag(0,1);
  if(o.doppel) schlag(o.doppel[0]*bkV(0.9,1.1),o.doppel[1]);
  if(o.echo){ const b=o.body||[0.5,450]; for(let i=1;i<=o.echo[0];i++) bkR(o.echo[1]*i*bkV(0.9,1.1),{dur:0.32+0.12*i,vol:b[0]*L*Math.pow(o.echo[2],i),f:b[1]*k*0.85,f2:130}); }
  if(o.hall) bkR(0.05,{dur:o.hall[1]*bkV(0.9,1.1),vol:o.hall[0]*L,f:o.hall[2]*k,f2:60,an:0.22});
  if(o.knister) bkKn(o.knister[1],o.knister[2],Math.round(o.knister[0]*bkV(0.85,1.15)),o.knister[3]*L);
  if(o.zisch) bkR(0.08,{dur:o.zisch[1]*bkV(0.9,1.1),vol:o.zisch[0]*L,typ:'highpass',f:4200*k,rosa:true,an:0.15});
  if(o.zusatz&&sfx[o.zusatz]) sfx[o.zusatz](v,1);
}
/* alter Bruchklang je Kugel (fuer die Gegenprobe) */
const K5_TON_ALT={};
function k5KnallId(id,v,s){ const k=KUGEL[id];
  if(KNALL5_AUS){ const alt=K5_TON_ALT[id];
    if(alt&&sfx[alt]) return sfx[alt](v,s);
    if(k&&typeof showKlang==='function'){ const K4=Math.max(1,Math.min(5,k.kal|0)), n=showKlang('kugel'+K4,k.haupt,1.5+K4*0.2); if(sfx[n]) sfx[n](Math.min(1.4,v*1.3),s); }
    return; }
  if(K5_LOG) K5_LOG.push({t:FW_UHR,id,art:KNALL5[id].art});
  k5Knall(KNALL5[id],v); }
Object.keys(KNALL5).forEach(id=>{ sfx['kk_'+id]=(v,s)=>k5KnallId(id,v,s); });
/* Zerlegerblitz: die Ausstossladung leuchtet einen Augenblick weiss auf -
   kein stehender Leuchtball (28.09., Tom), sondern 0,06 s Blitz, ein paar
   radiale Funken und Licht auf Schnee und Haeuser */
function k5Blitz(p,o){ const b=o.blitz||1;
  flash(p,[1,0.94,0.82],2.4+2.2*b,0.16);
  k5Punkt(p,[2.2,2.15,2.0],Math.round(16*b*QUAL())+6,16*b,1);
  if(K5_LOG) K5_LOG.push({t:FW_UHR,blitz:b,y:p.y}); }
/* Brennen statt Verblassen (Optik, alle Kugeln): ein Stern wird im Spiel
   vom ersten Augenblick an linear dunkler (PS.update: Helligkeit = Rest-
   brenndauer) - nach der halben Zeit leuchtet er nur noch halb so hell,
   und zwei Sekunden nach dem Bruch war jede Kugel ein matter Staub
   (Renderbilder 09.10.). Ein echter Stern brennt gleichmaessig und
   verlischt erst am Ende. Darum bekommen die Sterne des Hauptbruchs (ab
   1,1 s Brenndauer) bei 30, 50 und 70 % ihrer Zeit die Helligkeit
   zurueck; die letzten 30 % verloeschen sie wie bisher. */
const K5_HALT=[[0.3,1/0.7],[0.5,0.7/0.5],[0.7,0.5/0.3]];
function k5Halten(L){ if(!L.length) return; const N=Math.min(L.length,2400), sch=L.length/N;
  for(let k=0;k<N;k++){ const h=L[Math.floor(k*sch)]; h.mx=h.ps.maxl[h.i]; const T=h.ps.life[h.i];
    for(const [f,m] of K5_HALT) imBild(T*f,()=>{ if(!kgLebt(h)) return; const j=h.i*3, b=h.ps.base; b[j]*=m; b[j+1]*=m; b[j+2]*=m; }); } }
function k5HaltSammeln(fn){ const L=[], pools=[psHuge,psBig], orig=pools.map(ps=>ps.emit);
  pools.forEach((ps,k)=>{ ps.emit=function(x,y,z,vx,vy,vz,r,g,b,life,grav,mode){ const i=ps.next; const res=orig[k].apply(this,arguments); if(life>=1.1&&mode!==1&&mode!==3) L.push({ps,i,mx:0}); return res; }; });
  try{ return fn(); } finally { pools.forEach((ps,k)=>{ ps.emit=orig[k]; }); if(!K5_HALT_AUS) k5Halten(L); } }
let K5_HALT_AUS=false;
/* Alles, was ein Kugelbruch fuer spaeter plant (Toechter, Knistern,
   Knall, Helligkeit), gehoert zum Feuerwerk (FW_KTX, 13-sound): der Stopp
   der Vorfuehrung (X) raeumt es mit ab. Vorher lief z. B. das Knistern
   einer gestoppten Kugel noch in die naechste Zuendung hinein (hoehen.js
   mass dabei eine Rakete mit 139 m). */
{ const fb=fwBurst;
  fwBurst=function(r){ const self=this, args=arguments, kg=r&&r.kugel&&!r.stufe;
    if(kg) FW_KTX++;
    let x; try{ x=kg?k5HaltSammeln(()=>fb.apply(self,args)):fb.apply(this,arguments); } finally { if(kg) FW_KTX--; }
    if(!KNALL5_AUS&&kg&&typeof r.knall==='string'&&r.knall.slice(0,3)==='kk_'){ const o=KNALL5[r.knall.slice(3)]; if(o) k5Blitz(r.p,o); }
    return x; }; }

/* =========================================================
   2. Optik der bestehenden Kugeln
   ========================================================= */
/* Tigerkrone 150 (Tom: "schoen, aber viel krasser"): doppelt so viele
   schwere Tigerkometen mit breitem Glitzerband, die lange stehen; nach
   1,7 s zerplatzt jede Spitze zu einer knisternden Goldkrone; im Kern ein
   glutroter Pistill */
EFF.tigerkrone=function(p,A,B,s){ const G=2.4, T=2.6, n=Math.round(15*s*QUAL())+12, hs=[];
  nKugel(n,8.2*s,(v,i)=>{ hs.push([k5Tiger(p,v,i%4?A:mischF(A,[1,.3,.05],0.5),T,G,{glanz:10,staub:34}),v]); });
  for(let i=0;i<Math.round(22*s*QUAL());i++){ const d=randDir(); k5Stern(p,kgMal(d,rand(2.0,2.6)*s),[1.7,.4,.1],rand(1.8,2.2),1.8,{spur:0.06}); }
  kgSpaeter(1.7,()=>{ hs.forEach(([h,v],i)=>{ const e=sternNach(p,v[0],v[1],v[2],G,1.7);
      kgSpaeter(rand(0,0.35),()=>{ wKrone(e,j=>j%3?[1.6,1.15,.45]:[1.6,1.5,1.2],s*0.9,Math.round(9*QUAL())+3,1.6); k5Knister(e,Math.round(6*QUAL())+2,2.2,[1.6,1.4,1.0]); }); });
    schall(p,x=>{ sfx.crackle(x*0.8); later(0.2,()=>sfx.crackle(x*0.6)); later(0.45,()=>sfx.crackle(x*0.4)); }); });
  schall(p,x=>sfx.fauchen(x*0.5,2.2)); };
EFF_SCHWEIF.tigerkrone=0.18;
/* Kanonade 300 (Tom: "das Goldene schoener"): die dreissig Knallkugeln
   bleiben, darueber statt des Kamuro aus Goldstrichen eine echte
   Brokatkrone - warmweisse Koepfe, glitzernde, abkuehlende Schleier, die
   sich langsam wie eine Trauerweide senken */
EFF.k5brokatkrone=function(p,A,B,s){ const n=Math.round(70*s*QUAL())+30;
  k5Brokat(p,n,6.4*s,4.6,1.15,{glanz:9,staub:16});
  kgSpaeter(3.4,()=>schall(p,x=>sfx.rieseln(x*0.9,3.5))); };
EFF_FAMILIE.k5brokatkrone='haenger'; EFF_SCHWEIF.k5brokatkrone=0.1;

/* =========================================================
   3. Die neuen Kugeln
   ========================================================= */
/* Fackelhimmel 150 (Profi, L17; Tom: "Flammen/Funken, die wie lodernd am
   Himmel stehen und LANGE haengen bleiben"): dreissig Flammenbueschel -
   ein glutoranger Kern, aus dem staendig Flammenzungen nach oben lecken
   (gelb -> orange -> dunkelrot abkuehlend, sie steigen, weil heisse Luft
   steigt), dazu Glutfunken. Sie bremsen schnell und sinken dann ganz
   langsam, knapp zehn Sekunden; zum Schluss verlischt eine nach der
   anderen mit einem Knacken. Es gibt keinen Schweif und keinen Strich -
   nur Feuer. */
/* Puffer: psHuge (Kopf und Kern) bekommt keinen Strom - sonst ueberschreibt
   der Ringpuffer nach drei Sekunden die eigenen Koepfe (gemessen 09.10.:
   die Flammen erloschen nach 3,6 statt 9 s); die Zungen (psBig, 1600 je
   Sekunde) leben nur eine halbe Sekunde */
EFF.fackelhimmel=function(p,A,B,s){ const q=QUAL(), n=Math.round(10*s*q)+10, G=0.55;
  const F=[[2.4,1.8,.6],[2.2,.95,.2],[1.8,.4,.08]];
  nKugel(n,4.6*s,(v,i)=>{ const T=rand(8.2,9.8), h=kgStern(psHuge,p,v,[2.6,1.3,.35],T,G,0,0.02);
    const kern=kgStern(psHuge,p,v,[1.6,1.25,.55],T*0.98,G,0,0);
    for(let t=0.1;t<T-0.15;t+=0.08){ const tt=t;
      kgSpaeter(tt,()=>{ const e=k5Pos(h); if(!e) return; const a=SCHWEIF; SCHWEIF=0.06;
        /* flackern */ kgFarbe(kern,[1.6,1.25,.55],rand(0.5,1.4));
        /* Flammenzungen lecken nach oben und kuehlen ab */
        const nz=Math.round(rand(1,5)*(q>0.7?1:0.6));   /* zuengeln: mal eine, mal fuenf Zungen */
        for(let j=0;j<nz;j++){ const c=F[(Math.random()*3)|0], up=rand(2.0,4.5);
          psBig.emit(e.x+rand(-.3,.3),e.y+rand(-.1,.3),e.z+rand(-.3,.3),rand(-.5,.5),up,rand(-.5,.5),c[0],c[1],c[2],rand(0.4,0.75),-1.2,2,c[0]*0.3,c[1]*0.1,c[2]*0.08); }
        if(Math.random()<0.5*q) psMid.emit(e.x,e.y,e.z,rand(-1,1),rand(1.5,3.5),rand(-1,1),1.6,1.2,.55,rand(0.3,0.7),0.4,4);
        SCHWEIF=a; }); }
    kgSpaeter(T-0.1,()=>{ const e=k5Pos(h); if(e) k5Knister(e,Math.round(6*q)+3,1.6,[1.7,1.3,.6]); }); });
  /* der Zuendkern: ein kurzer Glutball, der sofort zerfaellt */
  for(let i=0;i<Math.round(40*q);i++){ const d=randDir(); kgStern(psBig,p,kgMal(d,rand(1.5,3)*s),F[i%3],rand(0.5,0.9),1,0,0.05); }
  schall(p,x=>{ sfx.fauchen(x*0.55,6,false); later(1.2,()=>sfx.fauchen(x*0.35,5)); later(7.6,()=>{ sfx.crackle(x*0.6); later(0.6,()=>sfx.crackle(x*0.45)); later(1.3,()=>sfx.crackle(x*0.3)); }); }); };

/* Wetterleuchten 150 (Profi, L18; nach Silbergewitter, Toms Liebling):
   ein eisblau blinkender Gewitterkern, darum knisternde Silberkometen;
   nach einer Sekunde laufen zwoelf Donnerschlaege im Uhrzeigersinn um die
   Kugel (jeder ein Blitz und ein Knall, Ton steigt), dann tropft aus den
   Kometen eine Silberweide, in der blaue Blitze zucken */
EFF.wetterleuchten=function(p,A,B,s){ const q=QUAL(), G=2.4, T=2.0, ends=[];
  /* Gewitterkern */
  nKugel(Math.round(14*s*q)+10,2.3*s,v=>kgStern(psHuge,p,v,[1.3,1.8,2.2],rand(3.0,3.6),1.1,1,0));
  /* Silberkometen */
  nKugel(Math.round(30*s*q)+12,7.2*s,(v,i)=>{ kgStern(psBig,p,v,[1.75,1.8,1.95],T,G,0,0.22); kgStern(psHuge,p,v,[.75,.9,1.2],T*0.95,G,0,0);
    k5Schleier(p,v,G,0.05,T,[1.2,1.22,1.32],4,16,{sl:[0.5,0.9],sg:1.4});
    if(i%3===0) ends.push(v); kgSpaeter(T*rand(0.95,1.0),()=>k5Knister(sternNach(p,v[0],v[1],v[2],G,T),Math.round(4*q)+2,2,[1.5,1.55,1.7])); });
  /* zwoelf Donnerschlaege im Kreis */
  const [u,w]=basisBlick(p,0.15), R=6.2*s, a0=rand(0,Math.PI*2);
  for(let k=0;k<12;k++){ const a=a0-k/12*Math.PI*2, e={x:p.x+(u[0]*Math.cos(a)+w[0]*Math.sin(a))*R,y:p.y+(u[1]*Math.cos(a)+w[1]*Math.sin(a))*R,z:p.z+(u[2]*Math.cos(a)+w[2]*Math.sin(a))*R};
    kgSpaeter(1.0+k*0.075,()=>{ k5Punkt(e,[1.9,2.0,2.2],Math.round(12*q)+4,10); k5Bruch(e,'donnerschlag',0.4); if(k%3===0) flash(e,[0.85,0.92,1],2.2,0.08);
      schall(e,x=>{ bkR(0,{dur:0.06,vol:0.55*k5Laut(x),typ:'highpass',f:2600+k*160}); bkR(0,{dur:0.18,vol:0.3*k5Laut(x),typ:'bandpass',f:900+k*40,q:0.8}); }); }); }
  /* Silberweide mit blauen Blitzen */
  kgSpaeter(1.9,()=>{ ends.forEach(v=>{ const e=sternNach(p,v[0],v[1],v[2],G,1.9), a=SCHWEIF; SCHWEIF=0.25;
      for(let j=0;j<Math.round(9*q)+3;j++) psBig.emit(e.x,e.y,e.z,rand(-.6,.6),rand(-0.5,0.4),rand(-.6,.6),1.45,1.5,1.6,rand(2.0,2.8),0.7,4);
      SCHWEIF=a; if(Math.random()<0.5) kgSpaeter(rand(0.3,2.2),()=>psHuge.emit(e.x,e.y-rand(1,4),e.z,0,0,0,0.6,0.95,2.2,0.07,0,0)); });
    schall(p,x=>sfx.rieseln(x*0.7,3)); });
  schall(p,x=>later(T,()=>{ sfx.crackle(x*0.7); later(0.15,()=>sfx.crackle(x*0.5)); })); };

/* Schatztruhe 200 (Profi, L19): eine schwere Goldbrokat-Kugel oeffnet
   sich; nach 0,85 s springen acht Juwelen in einer Spirale auf (Rubin,
   Smaragd, Saphir, Amethyst, Topas, Aquamarin ...) - jedes eine kleine
   Paeonie mit eigenem Ton; acht Funkelsterne antworten in der
   Gegenrichtung, zum Schluss knistern die Brokatkoepfe */
const K5_JUWEL=[[1,.1,.22],[.12,1,.42],[.2,.38,1],[.72,.3,1],[1,.62,.1],[.25,1,.9],[1,.35,.7],[.6,1,.2]];
EFF.schatztruhe=function(p,A,B,s){ const q=QUAL(), G=1.6;
  const hs=k5Brokat(p,Math.round(28*s*q)+20,6.2*s,3.6,G,{glanz:5,staub:14});
  const [u,w]=basisBlick(p,0.35), R=4.0*s, a0=rand(0,Math.PI*2);
  for(let k=0;k<8;k++){ const a=a0+k/8*Math.PI*2, r=R*(0.8+0.05*k), e={x:p.x+(u[0]*Math.cos(a)+w[0]*Math.sin(a))*r,y:p.y+(u[1]*Math.cos(a)+w[1]*Math.sin(a))*r,z:p.z+(u[2]*Math.cos(a)+w[2]*Math.sin(a))*r}, c=K5_JUWEL[k];
    kgSpaeter(0.85+k*0.11,()=>{ k5Bruch(e,'juwel',0.5); k5Punkt(e,mischF(c,[2,2,2],0.6),6,6,0.8);
      nKugel(Math.round(9*s*q)+12,2.4*s,v=>k5Stern(e,v,kgMal(c,1.7),rand(1.5,1.9),2.0,{spur:0.1}));
      schall(e,x=>{ bkR(0,{dur:0.12,vol:0.45*k5Laut(x),typ:'bandpass',f:700+k*120,q:1.2}); bkT(0,140+k*14,80,0.1,0.12*k5Laut(x)); }); }); }
  /* Funkelsterne in der Gegenrichtung */
  for(let k=0;k<8;k++){ const a=a0-k/8*Math.PI*2+0.39, r=R*1.25, e={x:p.x+(u[0]*Math.cos(a)+w[0]*Math.sin(a))*r,y:p.y+(u[1]*Math.cos(a)+w[1]*Math.sin(a))*r,z:p.z+(u[2]*Math.cos(a)+w[2]*Math.sin(a))*r};
    kgSpaeter(1.9+k*0.09,()=>{ k5Bruch(e,'funkel',0.3); for(let j=0;j<Math.round(22*q)+6;j++){ const d=randDir(), sp=rand(0.8,1.6)*s*0.5; psBig.emit(e.x,e.y,e.z,d[0]*sp,d[1]*sp,d[2]*sp,1.8,1.75,1.6,rand(0.9,1.4),0.6,1); } }); }
  /* Goldknistern an den Brokatkoepfen */
  kgSpaeter(2.6,()=>{ hs.forEach(([h])=>{ const e=k5Pos(h); if(e&&Math.random()<0.7) kgSpaeter(rand(0,0.6),()=>k5Knister(e,Math.round(4*q)+2,1.8,[1.6,1.3,.6])); });
    schall(p,x=>{ sfx.crackle(x*0.8); later(0.3,()=>sfx.crackle(x*0.6)); }); }); };

/* Bluetenhagel 200 (Profi, L20; Senrin/Kowari): ein kurzer weissgoldener
   Strauss, dann platzen vierzig kleine Blueten in Rosa, Weiss, Zitrone und
   Mint auf - von innen nach aussen, wie ein Hagelschauer -, jede mit einem
   trockenen Knack; zum Schluss rieselt Bluetenstaub */
const K5_BLUETE=[[1,.46,.74],[1.2,1.2,1.2],[1,.97,.34],[.36,1,.7],[.4,.72,1]];
EFF.bluetenhagel=function(p,A,B,s){ const q=QUAL(), G=2.2;
  nKugel(Math.round(40*s*q)+16,6.5*s,v=>{ kgStern(psBig,p,v,[1.8,1.6,1.1],rand(1.0,1.25),G,0,0.2); });
  const N=Math.round(16*s*q)+20, L=[];
  for(let i=0;i<N;i++){ const d=randDir(), r=Math.cbrt(rand(0.05,1))*5.6*s; L.push({e:{x:p.x+d[0]*r,y:p.y+d[1]*r,z:p.z+d[2]*r},r}); }
  L.sort((a,b)=>a.r-b.r);
  L.forEach((b,i)=>{ const c=K5_BLUETE[i%5], t=0.5+1.1*b.r/(5.6*s)+rand(-0.04,0.04);
    kgSpaeter(t,()=>{ k5Bruch(b.e,'bluete',0.2); const a=SCHWEIF; SCHWEIF=0.04;
      for(let j=0;j<Math.round(16*q)+6;j++){ const d=randDir(), sp=rand(1.6,2.2)*Math.sqrt(s); psBig.emit(b.e.x,b.e.y,b.e.z,d[0]*sp,d[1]*sp,d[2]*sp,c[0]*1.7,c[1]*1.7,c[2]*1.7,rand(0.9,1.3),1.6,0); }
      psHuge.emit(b.e.x,b.e.y,b.e.z,0,0,0,c[0]*1.2,c[1]*1.2,c[2]*1.2,0.12,0,0); SCHWEIF=a;
      if(i%3===0) schall(b.e,x=>bkR(0,{dur:0.03,vol:0.22*k5Laut(x),typ:'highpass',f:2400+(i%7)*300})); }); });
  kgSpaeter(2.1,()=>{ for(let i=0;i<Math.round(60*q);i++){ const d=randDir(), r=rand(0.3,1)*5*s; psBig.emit(p.x+d[0]*r,p.y+d[1]*r,p.z+d[2]*r,rand(-.3,.3),rand(-.6,0),rand(-.3,.3),1.3,1.15,1.2,rand(1.2,2.0),0.5,4); }
    schall(p,x=>sfx.rieseln(x*0.6,2.5)); }); };

/* Aurora 200 (Profi, L21): violetter Blinkkern; eine gruene Chrysantheme,
   deren Sterne nach 1,1 s kurz aussetzen und violett weiterbrennen (Wechsel
   mit Dunkelphase); ein schraeger Ring aus mintgruenen Rossschweifen, die
   hochsteigen und als Vorhang herabfallen; im Vorhang funkeln weisse Sterne */
EFF.aurora=function(p,A,B,s){ const q=QUAL(), G=2.2, gruen=[.2,1.5,.5], viol=[1.05,.42,1.6], mint=[.55,1.5,1.05];
  nKugel(Math.round(10*s*q)+8,1.6*s,v=>kgStern(psHuge,p,v,kgMal(viol,1.2),rand(2.6,3.2),0.9,1,0));
  nKugel(Math.round(38*s*q)+16,6.4*s,v=>{ const h=k5Stern(p,v,gruen,2.4,G,{spur:0.22,weiss:0.25}); kgSpaeter(1.1+rand(-0.05,0.05),()=>kgWechsel(h,viol,0.12,1.4,G,0,0.2)); });
  const hs=[]; nRing(p,Math.round(6*s*q)+14,5.6*s,v=>{ const w=[v[0],v[1]+2.6*s,v[2]], T=3.4;
    const h=kgStern(psBig,p,w,mint,T,4.2,0,0.3); hs.push(h);
    rkFunken(p,w,4.2,0.1,T,46,[.6,1.25,.95],{ps:psMid,life:[1.4,2.2],g:1.2,streu:0.06,mit:0.0,mode:4,spur:0.12}); },0.25);
  kgSpaeter(2.2,()=>{ hs.forEach(h=>{ const e=k5Pos(h); if(!e) return; for(let j=0;j<Math.round(6*q)+2;j++){ const sp=rand(0.2,0.6); psBig.emit(e.x+rand(-1,1),e.y-rand(0,3),e.z+rand(-1,1),rand(-sp,sp),rand(-0.4,0),rand(-sp,sp),1.8,1.8,1.9,rand(1.2,2.0),0.4,1); } });
    schall(p,x=>sfx.rieseln(x*0.55,3)); }); };

/* Sonnensturm 300 (Koenigsklasse, L22): eine riesige Goldbrokat-Krone;
   darueber hinaus schiessen vierzehn glutorange Sonnenfackeln (schwere
   Tigerkometen), die sich weit nach aussen und unten biegen und an ihren
   Enden nacheinander als knisternde Protuberanzen zerplatzen; im Kern
   brennt eine rote Sonne */
EFF.sonnensturm=function(p,A,B,s){ const q=QUAL(), G=1.25;
  k5Brokat(p,Math.round(30*s*q)+28,5.6*s,4.6,G,{glanz:4,staub:12});
  nKugel(Math.round(16*s*q)+14,2.3*s,v=>k5Stern(p,v,[1.8,.25,.08],rand(2.4,2.9),1.4,{spur:0.08}));
  const T=2.5, GF=3.0, a0=rand(0,Math.PI*2);
  for(let k=0;k<14;k++){ const a=a0+k/14*Math.PI*2, el=rand(0.05,0.55), sp=9.2*s, v=[Math.cos(a)*Math.cos(el)*sp,Math.sin(el)*sp+1.5*s,Math.sin(a)*Math.cos(el)*sp];
    k5Tiger(p,v,[1,.48,.08],T,GF,{glanz:10,staub:30,gold:0.35});
    kgSpaeter(T+k*0.06,()=>{ const e=sternNach(p,v[0],v[1],v[2],GF,T); k5Bruch(e,'protuberanz',0.5);
      for(let j=0;j<Math.round(22*q)+8;j++){ const d=randDir(); kgStern(psBig,e,kgMal(d,rand(1.4,2.2)*Math.sqrt(s)),j%2?[1.6,.5,.1]:[1.6,1.2,.45],rand(0.9,1.4),1.8,4,0.08); }
      k5Knister(e,Math.round(8*q)+3,2.4,[1.6,1.3,.7]); }); }
  kgSpaeter(T,()=>schall(p,x=>{ sfx.crackle(x*0.9); later(0.25,()=>sfx.crackle(x*0.75)); later(0.55,()=>sfx.crackle(x*0.5)); }));
  schall(p,x=>sfx.fauchen(x*0.5,2.6)); };

/* Drachennest 300 (Koenigsklasse, L23; Knister wie der Hexenkessel): ein
   rotes Nest (Paeonie, die zu Glut abkuehlt) - dann knistern hundertsechzig
   goldene Dracheneier von oben nach unten los, eine silberne Welle antwortet
   von unten nach oben, und aus dem Nest fallen glutrote Tropfen */
EFF.drachennest=function(p,A,B,s){ const q=QUAL(), G=2.0;
  nKugel(Math.round(46*s*q)+24,5.0*s,v=>{ kgStern(psHuge,p,v,[1.9,.25,.08],3.0,G,0,0.2); kgStern(psBig,p,v,[2.0,.8,.4],2.8,G,0,0); });
  const welle=(n,c,t0,dauer,auf)=>{ const E=[]; for(let i=0;i<n;i++){ const d=randDir(), r=Math.cbrt(rand(0.1,1))*6.2*s; E.push({x:p.x+d[0]*r,y:p.y+d[1]*r,z:p.z+d[2]*r}); }
    const y0=p.y-6.2*s, y1=p.y+6.2*s;
    E.forEach(e=>{ const u=(e.y-y0)/(y1-y0), t=t0+dauer*(auf?u:1-u)+rand(-0.05,0.05);
      kgSpaeter(Math.max(0.05,t-0.9),()=>kgStern(psBig,e,[rand(-.3,.3),rand(-.3,.2),rand(-.3,.3)],kgMal(c,1.25),0.92,0.6,4,0));
      kgSpaeter(t,()=>{ k5Knister(e,Math.round(8*q)+4,2.8,mischF(c,[1.9,1.9,1.9],0.4),{L:[0.12,0.4]}); psHuge.emit(e.x,e.y,e.z,0,0,0,c[0]*1.2,c[1]*1.2,c[2]*1.2,0.05,0,0); }); });
    schall(p,x=>{ const L=k5Laut(x); later(t0,()=>bkKn(0,dauer+0.4,Math.round(70*q)+20,0.2*L)); }); };
  welle(Math.round(42*s*q)+40,[1.6,1.2,.45],0.8,1.4,false);
  welle(Math.round(26*s*q)+20,[1.45,1.5,1.65],2.3,1.1,true);
  kgSpaeter(3.0,()=>{ for(let i=0;i<Math.round(16*q)+8;i++){ const d=randDir(), r=rand(0,3)*s, e={x:p.x+d[0]*r,y:p.y+d[1]*r,z:p.z+d[2]*r}, v=[rand(-.8,.8),rand(-1,0.5),rand(-.8,.8)];
      kgStern(psBig,e,v,[1.5,.35,.08],rand(2.2,3.0),3.2,0,0.35); } }); };

/* Ringnebel 300 (Koenigsklasse, L24; Saturnbombe): eine blaue Kugel, die
   Stern fuer Stern zu Weiss wechselt; zwei schraege Goldringe aus
   Glitzerkometen umkreisen sie; nach 1,1 s zerspringt jeder Ringkomet zu
   einem roten Kreuz (Crossette); in der Mitte pulsiert ein weisser Stern */
EFF.ringnebel=function(p,A,B,s){ const q=QUAL(), G=2.2, blau=[.3,.5,1.6], weiss=[1.55,1.6,1.7], gold=[1.6,1.15,.4];
  nKugel(Math.round(34*s*q)+20,4.4*s,v=>{ const h=k5Stern(p,v,blau,2.8,G,{spur:0.16,weiss:0.3}); kgSpaeter(1.3+rand(-0.08,0.08),()=>kgWechsel(h,weiss,0.1,1.5,G,0,0.12)); });
  nKugel(Math.round(6*s*q)+6,0.8*s,v=>kgStern(psHuge,p,v,[1.9,1.9,2],3.4,0.3,1,0));
  /* Saturnring: waagerechter Kreis, um die Querachse des Blicks gekippt */
  const ring=kipp=>{ const [u]=basisBlick(p,0), n=Math.round(6*s*q)+14, a0=rand(0,Math.PI*2);
    for(let i=0;i<n;i++){ const a=a0+i/n*Math.PI*2, d=k5Dreh([Math.cos(a),0,Math.sin(a)],u,kipp), sp=8.0*s, v=kgMal(d,sp);
      nKomet(p,v,gold,1.1,G,[1,.75,.32],60);
      kgSpaeter(1.1,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,1.1), vv=bahnTempo(v,G,1.1), [q1,q2]=quer(d), b0=rand(0,Math.PI*2);
        for(let k=0;k<4;k++){ const b=b0+k*Math.PI/2, sp2=3.2*Math.sqrt(s), dv=[(q1[0]*Math.cos(b)+q2[0]*Math.sin(b))*sp2+vv[0]*0.3,(q1[1]*Math.cos(b)+q2[1]*Math.sin(b))*sp2+vv[1]*0.3,(q1[2]*Math.cos(b)+q2[2]*Math.sin(b))*sp2+vv[2]*0.3];
          nKomet(e,dv,[1.6,.2,.12],1.3,2.8,[1,.5,.2],24); }
        psHuge.emit(e.x,e.y,e.z,0,0,0,1.4,1.2,1,0.05,0,0); }); } };
  ring(0.38); kgSpaeter(0.08,()=>ring(-0.26));
  schall(p,x=>later(1.1,()=>{ BRUCH_KLAENGE.kaskade(k5Laut(x)*0.8); later(0.12,()=>BRUCH_KLAENGE.kaskade(k5Laut(x)*0.6)); })); };

/* Kometensturm 300 (Koenigsklasse, L25; nach Farbtiger): drei Wellen
   schwerer Tigerkometen mit breitem Glitzerband - gruen nach oben, 0,3 s
   spaeter blau rundum, 0,6 s spaeter magenta nach unten - um einen
   Goldbrokat-Kern; jede Bahn endet in einem knisternden Funkenkranz */
EFF.kometensturm=function(p,A,B,s){ const q=QUAL(), G=2.4, T=2.3;
  k5Brokat(p,Math.round(16*s*q)+10,2.6*s,3.0,1.2,{glanz:4,staub:10});
  const welle=(t,c,el0,el1)=>kgSpaeter(t,()=>{ const n=Math.round(4*s*q)+10, a0=rand(0,Math.PI*2);
    for(let i=0;i<n;i++){ const a=a0+i/n*Math.PI*2+rand(-0.1,0.1), el=rand(el0,el1), sp=8.6*s, v=[Math.cos(a)*Math.cos(el)*sp,Math.sin(el)*sp,Math.sin(a)*Math.cos(el)*sp];
      k5Tiger(p,v,c,T,G,{glanz:9,staub:28});
      kgSpaeter(T*rand(0.97,1.02),()=>{ const e=sternNach(p,v[0],v[1],v[2],G,T); wKrone(e,()=>mischF(c,[1.6,1.5,1.3],0.5),s*0.7,Math.round(5*q)+2,1.2); k5Knister(e,Math.round(5*q)+2,2.2,[1.6,1.55,1.4]); }); }
    schall(p,x=>sfx.zischen(x*0.6,1.4)); });
  welle(0,[.2,1,.45],0.45,1.2); welle(0.3,[.25,.45,1],-0.18,0.18); welle(0.6,[1,.25,.9],-1.2,-0.45);
  kgSpaeter(T,()=>schall(p,x=>{ sfx.crackle(x*0.9); later(0.3,()=>sfx.crackle(x*0.8)); later(0.6,()=>sfx.crackle(x*0.6)); })); };

/* Urknall 300 (Koenigsklasse, L26, ersetzt die Himmelstreppe; Tom: "erst
   ein Boom, dann ein MONSTER-Boom - der letzte Knall ist der groesste,
   eine richtig heftige Monster-Explosion"). Erster Schlag: ein Silberkranz
   mit grellem Blitz und Knall (KNALL5.urknall300). Der Kern (eine
   Bombe in der Bombe) steigt mit hellem Schweif 1,3 s weiter - dann der
   MONSTER-Schlag: weisser Titanblitz, die Erde bebt, eine riesige
   Titan-Silber-Chrysantheme, ein roter Feuerball, eine haengende
   Goldkrone und ein Knistern, das den ganzen Himmel fuellt. Der groesste
   Bruch und der lauteste Knall im Spiel. */
EFF.urknall=function(p,A,B,s){ const q=QUAL(), G=2.4;
  /* 1. Schlag: Silberkranz */
  nRing(p,Math.round(10*s*q)+24,6.0*s,v=>{ kgStern(psBig,p,v,[1.8,1.82,1.95],1.6,G,0,0.22); k5Schleier(p,v,G,0.05,1.5,[1.2,1.22,1.3],0,14,{sl:[0.4,0.8]}); },0.3);
  /* der Kern steigt weiter */
  const vk=[rand(-0.4,0.4),15,rand(-0.4,0.4)], TK=1.3;
  kgStern(psHuge,p,vk,[2,1.9,1.7],TK,2.4,0,0.4); rkFunken(p,vk,2.4,0.02,TK,90,[1.4,1.2,.8],{ps:psMid,life:[0.4,0.8],g:1.5,streu:0.3,mit:0.05,mode:4});
  kgSpaeter(TK,()=>{ const e=sternNach(p,vk[0],vk[1],vk[2],2.4,TK); k5Bruch(e,'monster',s*1.4); k5HaltSammeln(()=>urknallMonster(e,s)); }); };
function urknallMonster(e,s){ const q=QUAL(), G=2.0, S=s*1.38;
  /* Titanblitz: mehrere Blitzlichter, Funkenwolke, Beben */
  for(let i=0;i<6;i++) psHuge.emit(e.x,e.y,e.z,rand(-.5,.5),rand(-.5,.5),rand(-.5,.5),2.4,2.35,2.2,rand(0.08,0.14),0,0);
  const a=SCHWEIF; SCHWEIF=0.06; for(let i=0;i<Math.round(160*q);i++){ const d=randDir(), w=rand(18,32); psMid.emit(e.x,e.y,e.z,d[0]*w,d[1]*w,d[2]*w,1.8,1.75,1.6,rand(0.08,0.16),0,0); } SCHWEIF=a;
  flash(e,[1,1,1],9,0.5); later(0.05,()=>flash(e,[1,.8,.5],7,0.7)); later(0.12,()=>flash(e,[1,.35,.15],6,1.0));
  { const v=distVol(e); shake=Math.max(shake,Math.min(1.6,0.9+v*2)); }
  /* Titan-Silber-Chrysantheme */
  nKugel(Math.round(60*S*q)+40,7.6*S,v=>{ kgStern(psBig,e,v,[1.8,1.82,1.95],rand(2.6,3.1),G,4,0.3); });
  nKugel(Math.round(14*S*q)+10,7.2*S,v=>k5Schleier(e,v,G,0.05,2.6,[1.25,1.28,1.38],3,12,{sl:[0.6,1.1]}));
  /* roter Feuerball */
  nKugel(Math.round(26*S*q)+20,5.0*S,v=>k5Stern(e,v,[1.8,.22,.1],2.6,G,{spur:0.14,weiss:0.25}));
  /* haengende Goldkrone */
  kgSpaeter(0.15,()=>k5Brokat(e,Math.round(16*S*q)+20,4.8*S,5.6,1.0,{glanz:3,staub:9}));
  /* Knistern, das den Himmel fuellt */
  kgSpaeter(1.8,()=>{ for(let i=0;i<Math.round(110*q)+30;i++){ const d=randDir(), r=Math.cbrt(Math.random())*7*S, x={x:e.x+d[0]*r,y:e.y+d[1]*r-2,z:e.z+d[2]*r};
      kgSpaeter(rand(0,1.6),()=>k5Knister(x,Math.round(4*q)+2,2.4,[1.7,1.6,1.3])); } });
  schall(e,v=>{ k5Knall(KNALL5_MONSTER,v); if(typeof grollen==='function') later(0.1,()=>grollen(7,0.9*k5Laut(v),160,0.4));
    if(K5_LOG) K5_LOG.push({t:FW_UHR,id:'urknall300',art:'monster'}); }); }

/* Effekt-Familien (effPassen), Schweife, Signaturen */
Object.assign(EFF_FAMILIE,{fackelhimmel:'flamme',wetterleuchten:'knister',schatztruhe:'haenger',bluetenhagel:'knister',aurora:'haenger',
  sonnensturm:'haenger',drachennest:'knister',ringnebel:'kugel',kometensturm:'komet',urknall:'kugel'});
Object.assign(EFF_SCHWEIF,{fackelhimmel:0.02,wetterleuchten:0.14,schatztruhe:0.1,bluetenhagel:0.1,aurora:0.2,sonnensturm:0.1,drachennest:0.1,ringnebel:0.12,kometensturm:0.18,urknall:0.18});
Object.assign(KUGEL,{
  fackelhimmel150:{kal:3,th:'glut',haupt:'fackelhimmel',A:'orange',B:'gold',steig:'glut',bruchOpt:{kern:false,nachglitzer:false,flash:0.7},stufen:[]},
  wetterleuchten150:{kal:3,th:'silber',haupt:'wetterleuchten',A:'silber',B:'himmel',steig:'blink',bruchOpt:{kern:false,nachglitzer:false,flash:0.6},stufen:[]},
  schatztruhe200:{kal:4,th:'gold',haupt:'schatztruhe',A:'gold',B:'rot',steig:'brokat',bruchOpt:{kern:false,nachglitzer:false,flash:0.6},stufen:[]},
  bluetenhagel200:{kal:4,th:'pastell',haupt:'bluetenhagel',A:'rose',B:'mint',steig:'silber',bruchOpt:{kern:false,nachglitzer:false,flash:0.6},stufen:[]},
  aurora200:{kal:4,th:'aurora',haupt:'aurora',A:'gruen',B:'violett',steig:'dunkel',bruchOpt:{kern:false,nachglitzer:false,flash:0.5},stufen:[]},
  sonnensturm300:{kal:5,th:'sonne',haupt:'sonnensturm',A:'gold',B:'orange',steig:'kometenkopf',abschuss:'goldfontaene',bruchOpt:{kern:false,nachglitzer:false,flash:0.7},stufen:[]},
  drachennest300:{kal:5,th:'glut',haupt:'drachennest',A:'rot',B:'gold',steig:'knister',bruchOpt:{kern:false,nachglitzer:false,flash:0.6},stufen:[]},
  ringnebel300:{kal:5,th:'nacht',haupt:'ringnebel',A:'blau',B:'gold',steig:'titanspur',bruchOpt:{kern:false,nachglitzer:false,flash:0.6},stufen:[]},
  kometensturm300:{kal:5,th:'pfau',haupt:'kometensturm',A:'gruen',B:'magenta',steig:'komet',abschuss:'farbkometen',bruchOpt:{kern:false,nachglitzer:false,flash:0.6},stufen:[]},
  urknall300:{kal:5,th:'silber',haupt:'urknall',A:'silber',B:'rot',steig:'titanspur',abschuss:'kometen',bruchOpt:{kern:false,nachglitzer:false,flash:0.8},stufen:[]}
});
for(const id of ['fackelhimmel150','wetterleuchten150','schatztruhe200','bluetenhagel200','aurora200','sonnensturm300','drachennest300','ringnebel300','kometensturm300','urknall300'])
  Object.assign(KUGEL[id],Object.assign({},KAL_WERTE[KUGEL[id].kal],KUGEL[id]));
Object.assign(SIGNATUR,{
  fackelhimmel150:{eff:'fackelhimmel',text:'Dreißig lodernde Flammenbüschel, die fast zehn Sekunden am Himmel stehen'},
  wetterleuchten150:{eff:'wetterleuchten',text:'Blinkender Gewitterkern, Silberkometen, zwölf Donnerschläge im Kreis, Silberweide mit Blitzen'},
  schatztruhe200:{eff:'schatztruhe',text:'Goldbrokat-Kugel, acht Juwelen in einer Spirale, Funkelsterne, knisterndes Gold'},
  bluetenhagel200:{eff:'bluetenhagel',text:'Weißgoldener Strauß, vierzig Blüten platzen von innen nach außen'},
  aurora200:{eff:'aurora',text:'Violetter Blinkkern, Grün wird Violett, ein Vorhang aus mintgrünen Rossschweifen'},
  sonnensturm300:{eff:'sonnensturm',text:'Goldbrokat-Krone, vierzehn Sonnenfackeln mit knisternden Protuberanzen, rote Sonne'},
  drachennest300:{eff:'drachennest',text:'Rotes Nest, goldene Dracheneier knistern von oben nach unten, silberne Welle zurück'},
  ringnebel300:{eff:'ringnebel',text:'Blau wird Weiß, zwei Goldringe zerspringen zu roten Kreuzen, pulsierender Kern'},
  kometensturm300:{eff:'kometensturm',text:'Drei Wellen Tigerkometen in Grün, Blau, Magenta um einen Goldbrokat-Kern'},
  urknall300:{eff:'urknall',text:'Erst ein Silberkranz, dann der Monster-Schlag: der größte Bruch im Spiel'}
});
/* Kanonade: Brokatkrone statt Goldstrich-Kamuro */
if(KUGEL.kanonade300&&KUGEL.kanonade300.stufen&&KUGEL.kanonade300.stufen[0]) KUGEL.kanonade300.stufen[0]=Object.assign({},KUGEL.kanonade300.stufen[0],{eff:'k5brokatkrone',sz:0.62});

/* ---------- Groesse (raeumlicher Massstab, 14u) ----------
   Gemessen 09.10. in der Vorfuehrung (Durchmesser 90 % der Sterne, m).
   Ziel Profi ~118 m, Koenigsklasse ~125 m, Urknall > 165 m.
   Tabelle vorher/nachher: UEBERGABE.md (Kugelbomben-Runde 5) */
const K5_RAUM={
  /* Profi (vorher: Crossettennetz 91, Tigerkrone 92, Farbcrossette 94, Kronenkranz 103, Zwillingssonne 123, Blitzpalme 88, Goldweidenkreuz 125 m) */
  crossettennetz150:3.05,tigerkrone150:2.3,farbcrossette150:2.89,kronenkranz200:1.77,zwillingssonne200:1.32,blitzpalme200:4.3,goldweidenkreuz200:1.95,
  fackelhimmel150:4.05,wetterleuchten150:2.71,schatztruhe200:2.56,bluetenhagel200:2.6,aurora200:2.92,
  /* Koenigsklasse (vorher: Granatapfel 104, Himmelsbrecher 121, Kanonade 100, Sternensturm 117, Riesenpalme 111 m) */
  granatapfel200:3.7,kugel300:1.95,kanonade300:3.35,sternensturm300:2.35,riesenpalme300:2.07,
  sonnensturm300:1.66,drachennest300:2.17,ringnebel300:2.18,kometensturm300:1.61,urknall300:2.09};
for(const id of Object.keys(K5_RAUM)) if(KUGEL[id]) KUGEL[id].raum=K5_RAUM[id];

/* ---------- Knall fuer jede Kugel ---------- */
for(const id of Object.keys(KNALL5)) if(KUGEL[id]){ K5_TON_ALT[id]=KUGEL[id].ton||null; KUGEL[id].ton='kk_'+id; }

try{ window.__kg5={KNALL5,KNALL5_ART,KNALL5_MONSTER,KUGEL,K5_RAUM,aus(f){ KNALL5_AUS=!!f; },log(an){ K5_LOG=an?[]:null; },get logListe(){ return K5_LOG; },k5Laut}; }catch(e){}
