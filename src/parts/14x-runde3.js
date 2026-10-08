/* =========================================================
   Korrekturrunde 07.10. (Toms Test V117: alle Feuerwerke in der
   Vorfuehrung durchgeschaut, scratchpad tom-test/befunde.md).
   Hier steht alles, was nach allen Drehbuechern greifen soll:
   1 Abschussklang je Rohr (keine stummen Abschuesse mehr)
   2 keine Bodenfontaenen in Batterien (ausser Vulkanausbruch)
   3 Einzelkorrekturen an Produkten (Drehbuecher, Lichter)
   4 Level-Ordnung (stetige Steigerung)
   5 Listen der zwei neuen Vorfuehrungen (Aenderungen, Kugelbomben)
   ========================================================= */

/* gestrichene Produkte (ENTFERNT, 02e): auch die Drehbuecher, die nach
   14r (dort wurde schon einmal aufgeraeumt) noch angelegt wurden (14v) */
if(typeof ENTFERNT!=='undefined') ENTFERNT.forEach(t=>[SHOWS,SIGNATUR,typeof THEMEN!=='undefined'?THEMEN:null].forEach(T=>{ if(T&&Object.prototype.hasOwnProperty.call(T,t)) delete T[t]; }));

/* ---------- 0. Welche Show gehoert zu welchem Produkt ----------
   FW_TAG ist die Kennung einer laufenden Show; hier merken wir uns das
   Produkt dazu - der Abschussklang waehlt danach seine Stimme */
const TAG_PROD={};
{ const ps=playShow; playShow=function(o,phases,prod,tag){ if(tag) TAG_PROD[tag]=prod; return ps.apply(this,arguments); }; }

/* ---------- 1. Abschussklang ----------
   Ursache (gemessen, Test abschussklang.js): jeder Batterie-Abschuss
   klang nur ueber sfx.thump - Rauschen unter 260 Hz plus ein 90-Hz-Ton.
   Das ist reiner Bass; aus Laptop- und Handylautsprechern kommt davon
   fast nichts. Normale Batterien fielen nicht auf, weil ihr Bruch laut
   knallt. Die Lichter-Batterien (Kometen, Perlen, dunkler Aufstieg)
   riefen den Bass zudem nur mit 30-70 % Lautstaerke (lStart laut 0,3-
   0,8), ihre Brueche sind leise (Plopp, Rieseln) - Gluehwuermchen,
   Pusteblume, Tautropfen, Weidenhain klangen beim Abschuss stumm.
   Jetzt bekommt jedes Rohr beim Feuern einen Abschuss mit hoerbarem
   Mittenanteil (400-1500 Hz). Die Stimme passt zur Ladung (Kugel und
   schwere Bombette wummern, Kometen und Lichter pfauchen, Roemische
   Lichter ploppen hohl) und jede Batterie hat ihre eigene Mischung
   (Saat aus dem Produktnamen) - nicht ueberall derselbe Ton. */
const ABSCHUSS={
  /* hohler Moerserschlag: Mitten-Plopp mit kurzem Bass */
  pock(v,k){ bkR(0,{dur:0.09*k,vol:0.34*v,typ:'bandpass',f:760/k,q:1.1}); bkT(0,175/k,88,0.11,0.2*v); bkR(0,{dur:0.17,vol:0.32*v,f:460/k,f2:160}); },
  /* trockenes Holz-Tock: kleine Kaliber, Jugendbatterien */
  tock(v,k){ bkR(0,{dur:0.05,vol:0.3*v,typ:'bandpass',f:1300/k,q:2.2}); bkT(0,215/k,120,0.07,0.13*v); bkR(0,{dur:0.12,vol:0.22*v,f:600/k,f2:220}); },
  /* Pfauchen: ein Komet oder Licht verlaesst das Rohr - weicher Stoss,
     dann ein kurzes Zischen */
  pff(v,k){ bkR(0,{dur:0.22*k,vol:0.27*v,typ:'bandpass',f:1500/k,f2:600,q:0.7,an:0.012}); bkT(0,140/k,70,0.09,0.1*v); bkR(0.03,{dur:0.45,vol:0.05*v,typ:'highpass',f:3600/k,an:0.05}); },
  /* schwerer Treibsatz: grosse Kaliber, Bomben - Wumms mit Mitten */
  fump(v,k){ bkR(0,{dur:0.3*k,vol:0.42*v,f:950/k,f2:200}); bkT(0,96/k,45,0.22,0.3*v); bkR(0,{dur:0.03,vol:0.18*v,typ:'highpass',f:2500}); },
  /* scharfer Klatsch: harte Ladung (Knallbomben, Salut-Rohre) */
  klatsch(v,k){ bkR(0,{dur:0.04,vol:0.36*v,typ:'highpass',f:1800/k}); bkR(0,{dur:0.18,vol:0.34*v,f:720/k,f2:220}); bkT(0,120/k,60,0.12,0.17*v); },
  /* sanfter Puff: Kinder- und Lichterbatterien */
  puff(v,k){ bkR(0,{dur:0.14*k,vol:0.25*v,typ:'bandpass',f:980/k,q:0.9,an:0.006}); bkT(0,190/k,110,0.07,0.08*v); },
  /* Doppelschlag: Zuendung und Treibsatz kurz nacheinander */
  doppel(v,k){ const d=0.035+Math.random()*0.03; bkR(0,{dur:0.06,vol:0.26*v,typ:'bandpass',f:1100/k,q:1.4}); bkR(d,{dur:0.16,vol:0.3*v,typ:'bandpass',f:620/k,q:0.9}); bkT(d,150/k,80,0.1,0.14*v); },
  /* Mine/Feuertopf: Ausstoss mit Fontaenenrauschen danach */
  topf(v,k){ bkR(0,{dur:0.2,vol:0.36*v,f:800/k,f2:250}); bkT(0,110/k,55,0.15,0.18*v); bkR(0.05,{dur:0.9,vol:0.07*v,typ:'bandpass',f:2400/k,q:0.6,rosa:true,an:0.05}); }
};
/* Stimmen je Ladung (aus dem Schuss, der gerade aus dem Rohr geht) */
const ABSCHUSS_ART={licht:['pff','puff','pock','doppel'],perle:['pock','tock','doppel'],schwer:['fump','pock','klatsch'],
  schuss:['pock','tock','doppel','klatsch','puff'],topf:['topf','fump']};
/* eigene Mischung je Batterie: zwei Stimmen je Art, Saat aus der Kennung */
function abschussStimme(prod,art){ const L=ABSCHUSS_ART[art]||ABSCHUSS_ART.schuss, h=saatZahl((prod||'x')+':ab:'+art);
  const a=L[h%L.length], b=L[(h>>>4)%L.length]; return Math.random()<0.72?a:b; }
let ABSCHUSS_LOG=null, SCHUSS_JETZT=null;
/* lStart (Lichter) behaelt seinen Bass, wird aber nicht mehr unter 60 %
   gedrueckt - leise heisst leise, nicht stumm */
lStart=function(m,k,laut){ muendungsblitz(m,m.y,k||1); if(laut) sfx.thump(distVol(m)*(ABSCHUSS_AUS?laut:Math.max(0.6,laut))); };
/* der Schuss, der eben aus dem Rohr ging: Art und Groesse */
{ const sh=shot, pe=perleSchuss, ls=lichtSchuss, ft=feuertopf, kb=kugelbombe;
  /* gesetzt NACH dem Aufruf: ruft eine Ladung intern eine andere auf
     (Kugel -> shot), zaehlt die aeussere */
  shot=function(o,opt){ const r=sh.apply(this,arguments); SCHUSS_JETZT={art:opt&&(opt.sz||1)>1.25?'schwer':'schuss',sz:opt&&opt.sz||1}; return r; };
  perleSchuss=function(o,A,s){ const r=pe.apply(this,arguments); SCHUSS_JETZT={art:'perle',sz:s||1}; return r; };
  lichtSchuss=function(o,name,A,B,s){ const r=ls.apply(this,arguments); SCHUSS_JETZT={art:/mine|saeule|topf|fontaene/.test(name)?'topf':'licht',sz:s||1,licht:name}; return r; };
  feuertopf=function(o,eff,A,B,s){ const r=ft.apply(this,arguments); SCHUSS_JETZT={art:'topf',sz:s||1}; return r; };
  kugelbombe=function(o,kal){ const r=kb.apply(this,arguments); SCHUSS_JETZT={art:'schwer',sz:1.4}; return r; }; }
/* jedes Rohr, das feuert, klingt: der Klang kommt im naechsten Bild,
   wenn klar ist, welche Ladung es war */
{ const rs=rohrSatz;
  rohrSatz=function(o,prod){ const R=rs.apply(this,arguments); if(!R) return R; const f=R.feuer;
    R.feuer=function(k,os){ const r=f.apply(this,arguments), tag=FW_TAG, q={x:os.x,y:os.y,z:os.z}; SCHUSS_JETZT=null;
      later(0,()=>{ const s=SCHUSS_JETZT||{art:'schuss',sz:1}, lvl=P[prod]&&P[prod].lvl||10;
        const st=(P[prod]&&P[prod].abschuss)||abschussStimme(prod,s.art);
        /* Lautstaerke: steigt mit dem Level und dem Kaliber, Einstieg leise */
        const laut=clamp(0.5+lvl*0.022,0.5,1.05)*clamp(0.75+0.3*(s.sz||1),0.8,1.25), k=rand(0.88,1.12);
        if(ABSCHUSS_LOG) ABSCHUSS_LOG.push({t:FW_UHR,prod,k,art:s.art,st});
        schall(q,v=>ABSCHUSS[st]&&ABSCHUSS[st](v*laut,k)); });
      return r; };
    return R; }; }

/* Klang-Mitschnitt (Test abschussklang.js): jeder Klangbaustein meldet
   Zeit, Lautstaerke und wie viel davon aus einem kleinen Lautsprecher
   kommt (Anteil ueber ~300 Hz, grob nach Filter und Frequenz) */
let KLANG_LOG=null;
const klangGewicht=(f,typ)=>{ f=f||1000; if(typ==='highpass') return 1; if(typ==='lowpass') return clamp((f-150)/700,0.03,1); return clamp((f-150)/450,0.03,1); };
function klangMelden(at,vol,f,typ,quelle){ if(KLANG_LOG) KLANG_LOG.push({t:FW_UHR+(at||0),v:vol||0,w:(vol||0)*klangGewicht(f,typ),q:quelle}); }
{ const _tone=tone, _noise=noise, _rauschF=rauschF, _bkR=bkR, _bkT=bkT, _tonGen=tonGen, _grollen=grollen;
  tone=function(f,dur,type,vol,f2){ klangMelden(0,vol*3,f2?Math.sqrt(f*f2):f,'ton','tone'); return _tone.apply(this,arguments); };
  noise=function(dur,vol,freq){ klangMelden(0,vol,freq,'lowpass','noise'); return _noise.apply(this,arguments); };
  rauschF=function(o){ if(o) klangMelden(0,o.vol,o.f2?Math.sqrt(o.f*o.f2):o.f,o.typ||'lowpass','rauschF'); return _rauschF.apply(this,arguments); };
  bkR=function(at,o){ if(o) klangMelden(at,o.vol,o.f2?Math.sqrt(o.f*o.f2):o.f,o.typ||'lowpass','bkR'); return _bkR.apply(this,arguments); };
  bkT=function(at,f,f2,dur,vol){ klangMelden(at,vol*1.5,Math.sqrt(f*f2),'ton','bkT'); return _bkT.apply(this,arguments); };
  tonGen=function(o){ if(o) klangMelden(0,(o.vol||0.04)*4,o.f,o.lp?'lowpass':'ton','tonGen'); return _tonGen.apply(this,arguments); };
  grollen=function(dur,vol,freq){ klangMelden(0,vol,freq*1.6,'lowpass','grollen'); return _grollen.apply(this,arguments); }; }

/* ---------- 2. Keine Bodenfontaenen in Batterien ----------
   Tom 07.10.: "ALLE Batterien: Bodenfontaenen (2-3 m hoch, am Tisch
   beginnend, viele kleine Funken) raus" - z. B. Glutschmiede, Pusteblume,
   Sterntor. Aufsteigende Geschosse und Kometen bleiben. Einzige Ausnahme:
   der Vulkanausbruch, dessen Tischfontaene der Krater ist ("darf
   bleiben, ruhig doller"). Jede Boden-Ebene (boden, ground) faellt aus
   dem Drehbuch jeder Batterie; eine reine Boden-Phase bleibt als leere
   Phase ohne Pause stehen (die Bezuege mit:true bleiben gleich). Greift
   in playShow (auch fuer spaeter angelegte Batterien) und - am Ende der
   Datei - in jedem Drehbuch (fuer die Pruefungen, die SHOWS lesen). */
const BODEN_ERLAUBT={lb_vulkan:1};
let BODEN_AUS=true;
function bodenRaus(t,s){ if(!BODEN_AUS||!Array.isArray(s)||BODEN_ERLAUBT[t]) return s;
  const p=P[t]; if(!p||(p.shape!=='battery'&&p.shape!=='fan')) return s;
  s.forEach((ph,i)=>{ if(!ph||!(ph.boden||ph.ground)) return; const x=Object.assign({},ph); delete x.boden; delete x.ground;
    if((x.n===0||x.nurBoden)&&!x.licht) x.pause=0;
    s[i]=x; });
  return s; }
{ const ps=playShow; playShow=function(o,phases,prod){ if(prod) bodenRaus(prod,phases); return ps.apply(this,arguments); }; }
function bodenRausAlle(){ Object.keys(SHOWS).forEach(t=>{ const f=SHOWS[t]; if(typeof f!=='function'||f.bodenRaus) return;
  const g=function(){ return bodenRaus(t,f.apply(this,arguments)); }; g.bodenRaus=true; SHOWS[t]=g; }); }

/* ---------- 3. Einzelkorrekturen ---------- */
/* Masse setzen (Karton und Raster ziehen mit, Rohr-Caches leeren) */
function r3Masse(t,dims){ const p=P[t]; if(!p) return; p.dims=dims.slice(); delete p.dims0;
  if(typeof massRaster==='function') massRaster(t); if(typeof kartonWahl==='function') kartonWahl(t); if(typeof lochFrisch==='function') lochFrisch(t); }
/* Drehbuch neu, mit Thema (Farbpaare) und Verzoegerungssatz wie die Lichter.
   kopf.basis: Grundstufe (Hoehe pw, Bruchgroesse sz) wie Produkte gleichen
   Levels - ohne basis brach Ozean auf 37 m, hoeher als jede Batterie
   (gerendert 07.10.: die ersten Brueche am oberen Bildrand) */
function r3Show(id,th,rampe,ph,kopf){ THEMEN[id]=th; SHOWS[id]=()=>show(Object.assign({rampe,verzoegerung:true},kopf||{}),ph.map(p=>Object.assign({th:id},p))); if(typeof lochFrisch==='function') lochFrisch(id); }
const ODE_TEIL=(a,b)=>({ton:ODE.ton.slice(a,b),dauer:ODE.dauer.slice(a,b)});

/* URWALD (Tom: "Kreis-Effekt unnatuerlich; nicht Koenigsklasse -> KOMPLETT
   NEU, deutlich intensiver, schoene realistische Effekte, Creme de la
   Creme"). Ein Tag im Regenwald in sechs Abschnitten, Gruen in allen
   Toenen mit Gold, die Blueten rot und orange:
   1 drei schwere Urwaldriesen (Kokospalmen) aus der Mitte - Wucht ab dem
     ersten Schuss, kein Opener-Faecher
   2 Lianen: gruen-goldene Haengeweiden mit gruenen Spitzen im Wellengang
   3 der Schwarm: Insekten (Bienen, Schwaerme) im Scheibenwischer, summend
   4 Tropenblueten: rote Pistille mit limettengruenem Kern, paarweise,
     dazwischen Donnerschlaege (Salut) - das Gewitter zieht auf
   5 Tropenregen: Zeitregen in Gold und Gruen, der lange niedergeht
   6 Finale: 24 Palmen, Tannen-Knisterkronen und Kokospalmen im W auf
     Schlag, drei Salute, dann ein Blaetterdach aus zehn riesigen
     Goldkamuro, das lange haengt.
   100 Schuss, ~50 s. */
r3Show('lb_jadekoenig',[['gruen','gold'],['limette','gold'],['jade','gold'],['gold','gruen'],['smaragd','orange'],['rot','limette']],
  {sz:[0.95,1.35],pw:[0,3],hell:[0.9,1.35],kurve:'spaet'},[
  {n:3,gap:1.7,muster:'mitte',ang:0.16,eff:'kokosnuss',kal:'riesig',pw:0,farbe:0,steig:'gold',knall:'bkWumms',pause:1.4},
  {n:14,takt:[0.2,0.2,0.2,0.7],muster:'welle',ang:0.3,eff:'haengeweide',kal:'mittel',farbe:2,steig:'brokat',knall:'bkBrokat',pause:1.0},
  {n:20,gap:0.12,muster:'wischer',ang:0.36,eff:['bienen','fischschwarm'],kal:'mittel',farbe:1,steig:'knister',pause:1.2},
  {n:12,gap:0.5,muster:'paar',ang:0.3,eff:'pistill',kal:'mittel',farbe:5,steig:'glut'},
  {mit:true,n:4,gap:1.3,muster:'aussen',ang:0.32,eff:'salut',kal:'mittel',pw:2,farbe:0,knall:'bkSalut',pause:1.4},
  {n:10,gap:0.32,muster:'v',ang:0.3,eff:'zeitregen',kal:'gross',farbe:3,steig:'brokat',knall:'bkRieseln',pause:1.6},
  {n:24,gap:0.09,muster:'w',ang:0.34,eff:['sternpalme','kiefernkrone','kokosnuss'],kal:'gross',pw:2,farbe:4,steig:'gold'},
  {mit:true,n:3,gap:0.55,muster:'mitte',ang:0.1,eff:'salut',kal:'gross',pw:4,farbe:0,knall:'bkSalut'},
  {n:10,gap:0.16,muster:'kreis',ang:0.3,eff:'kamuro',kal:'riesig',pw:4,farbe:3,steig:'brokat',knall:'bkDonnerhall',pause:7}],{basis:{pw:3.2,sz:1.27,th:'lb_jadekoenig'}});
lochName('lb_jadekoenig',{name:'Urwald · 100 Schuss Dschungelverbund',sub:'100 Schuss Dschungelverbund',
  desc:'Ein Tag im Regenwald: drei schwere Urwaldpalmen, Lianen aus grün-goldenen Hängeweiden, ein summender Insektenschwarm, rote Tropenblüten zwischen Donnerschlägen, ein langer Tropenregen – und als Finale 24 Palmen auf Schlag unter einem Blätterdach aus riesigen Goldkamuro.'});
r3Masse('lb_jadekoenig',[1.25,0.4,0.78]);
SIGNATUR.lb_jadekoenig={idee:'Urwald',eff:'kokosnuss',text:'Urwaldpalmen, Lianen-Haengeweiden, Insektenschwaerme, Tropenblueten mit Donner, Tropenregen und ein Blaetterdach aus Goldkamuro'};

/* OZEAN (Tom: "erste Schuesse zu nah beieinander; die ersten ~2/3 gefallen
   nicht -> neu; das Ende (verschiedene Sachen ineinander) bleibt").
   Neu: Duenung - drei Silberwellen ganz aussen und weit auseinander (die
   Silberchrysantheme wird nach einer Dunkelphase tuerkis), Wellengang -
   blaue Chrysanthemen im Wellenmuster mit wechselnder Hoehe, Meeres-
   leuchten - Silberglitzer mit blauen Spitzen, Gischt - weisse Sternspritzer
   knisternd im Scheibenwischer, Brandung - blaue Pistille mit weissem
   Kern paarweise. Das Finale (Quallen, Gischtkronen, Silberwellen) bleibt. */
r3Show('lb_saphirfaecher',[['silber','tuerkis'],['blau','silber'],['silber','blau'],['weiss','himmel'],['blau','weiss']],{sz:[0.95,1.25],pw:[0,1.5],hell:[0.9,1.25],kurve:'linear'},[
  {n:3,gap:2.0,muster:'aussen',ang:0.32,eff:'silberwelle',kal:'gross',farbe:0,steig:'silber',knall:'bkRieseln'},
  {n:6,gap:0.8,muster:'welle',ang:0.28,hoehe:'welle',hSpanne:5,eff:'chrys',kal:'gross',farbe:1,steig:'silber',pause:1.0},
  {n:5,gap:1.3,muster:'zufall',ang:0.24,eff:'glitzerbukett',kal:'gross',farbe:2,steig:'brokat',knall:'bkRieseln',pause:0.8},
  {n:6,gap:0.16,muster:'wischer',ang:0.36,eff:'sternspritzer',kal:'mittel',pw:2,farbe:3,steig:'silber',knall:'bkKnisterhall',pause:1.0},
  {n:4,gap:0.6,muster:'paar',ang:0.26,eff:'chrys',kal:'gross',farbe:4,steig:'silber',pause:1.0},
  {n:6,gap:0.35,muster:'mitte',ang:0.2,eff:['qualle','spritzkrone','wasserring'],A:['blau','himmel','silber'],B:['silber','weiss','blau'],kal:'gross',pw:6,steig:'silber',knall:'bkDonnerhall',pause:6}],{basis:{pw:-5,sz:0.78,th:'lb_saphirfaecher'}});
lochName('lb_saphirfaecher',{desc:'Blau, Türkis und Silber: drei Silberwellen weit auseinander, die nach einem Atemzug türkis weiterleuchten, blaue Chrysanthemen im Wellengang, Meeresleuchten aus Silberglitzer mit blauen Spitzen, knisternde weiße Gischt – zum Schluss sechs hohe Knalle: Quallen, Gischtkronen und Silberwellen.'});
SIGNATUR.lb_saphirfaecher={idee:'Ozean',eff:'silberwelle',text:'Silberwellen, blaue Chrysanthemen im Wellengang, Meeresleuchten, Gischt, hohe Quallen und Gischtkronen'};

/* GOLDADER (Tom: "zu viele goldene Fontaenen -> mehr/andere Effekte,
   spektakulaerer; z. B. kompletter goldener Regen, Funken mit Quallen-
   Bewegung (natuerlich)"). Keine Glitzerminen und Faecher mehr. Die Adern
   sind einzelne Goldkometen; dazwischen Goldkaskaden ueber Kreuz, goldene
   Quallen (Krone, deren Faeden pulsierend herabsinken), Weidenkometen,
   ein kompletter Goldregen (Kamuro, Goldvorhang und Zeitregen auf Schlag,
   der den Himmel fuellt), knisternde Dracheneier - Finale: zehn Quallen. */
r3Show('lb_goldader',[['gold','orange'],['bernstein','gold'],['zitrone','gold'],['gold','weiss']],{sz:[0.95,1.35],pw:[0,3],hell:[0.85,1.3],kurve:'spaet'},[
  {n:6,gap:0.65,muster:'aussen',ang:0.3,licht:'goldkomet',farbe:0},
  {n:4,gap:0.8,muster:'mitte',ang:0.2,eff:'qualle',farbe:2,kal:'gross',pw:2,steig:'brokat',pause:1.0},
  {n:8,gap:0.35,muster:'x',ang:0.3,eff:'goldkaskade',kal:'gross',farbe:1,steig:'gold',knall:'bkRieseln'},
  {n:12,takt:[0.24,0.24,0.95],muster:'welle',ang:0.3,licht:'weidenkomet',farbe:0,pause:1.5},
  {n:10,gap:0.07,muster:'schlag',ang:0.34,eff:['kamuro','goldvorhang','zeitregen'],kal:'gross',pw:2,farbe:3,steig:'brokat',knall:'bkBrokat',pause:2.0},
  {n:14,gap:0.2,muster:'wischer',ang:0.38,licht:'goldkomet',farbe:2},
  {mit:true,n:6,gap:0.5,muster:'v',ang:0.25,eff:'drachenei',kal:'gross',farbe:1,steig:'knister',knall:'bkKnisterhall',pause:1.0},
  {n:16,gap:0.08,muster:'w',ang:0.32,eff:['goldkaskade','kamuro'],kal:'gross',farbe:0,steig:'gold'},
  {mit:true,n:10,gap:0.18,muster:'mitte',ang:0.16,eff:'qualle',farbe:1,kal:'riesig',pw:4,steig:'brokat',knall:'bkDonnerhall',pause:6}],{basis:{pw:0.5,sz:1.05,th:'lb_goldader'}});
lochName('lb_goldader',{desc:'Goldkometen wie Adern im Gestein, Goldkaskaden über Kreuz, goldene Quallen, deren Fäden langsam pulsierend sinken, Weidenkometen, ein Goldregen, der den ganzen Himmel füllt, knisternde Dracheneier – das Finale zehn goldene Quallen über einem Goldwald.'});
SIGNATUR.lb_goldader={eff:'qualle',text:'Goldkometen, Goldkaskaden, goldene Quallen, ein kompletter Goldregen und knisternde Dracheneier'};

/* GOETTERFUNKEN (Tom: "zu langweilig/eintoenig v. a. am Anfang; Mitte
   besser"). Strophe 1 war eine senkrechte Reihe aus 30 kleinen Pistillen.
   Jetzt vier Phrasen, jede mit eigenem Bild und eigener Bewegung: die
   Melodie springt im Zickzack (Pistill), antwortet im V (Gold-Chrysan-
   theme), wandert ueber Kreuz (Kreuzsterne) und endet in einer Welle aus
   Dahlien mit einem Salut auf dem Schlusston. */
{ const alt=SHOWS.profi; if(alt) SHOWS.profi=()=>{ const s=alt(), i=s.findIndex(ph=>ph.noten===ODE&&ph.eff==='pistill');
  const k=s.map(ph=>Object.assign({},ph));
  if(i>=0){ const v=k[i].viertel||0.6, h=k[i].hStufe||2.5, pw=k[i].pw||0;
    k.splice(i,1,
      {n:8,muster:'z',seg:2,ang:0.32,hoehe:'melodie',noten:ODE_TEIL(0,8),viertel:v,hStufe:h,pw,eff:'pistill',kal:'klein',farbe:0,steig:'gold',pause:0.5},
      {n:7,muster:'v',ang:0.34,hoehe:'melodie',noten:ODE_TEIL(8,15),viertel:v,hStufe:h,pw:pw+1,eff:'chrys',kal:'mittel',farbe:1,steig:'gold',pause:0.6},
      {n:8,muster:'x',ang:0.38,hoehe:'melodie',noten:ODE_TEIL(15,23),viertel:v,hStufe:h,pw:pw+1,eff:'kreuzstern',kal:'mittel',farbe:2,steig:'knister',knall:'bkKaskade',pause:0.5},
      {n:7,muster:'welle',ang:0.4,hoehe:'melodie',noten:ODE_TEIL(23,30),viertel:v,hStufe:h,pw:pw+2,eff:['dahlie','dahlie','dahlie','dahlie','dahlie','dahlie','salut'],kal:'mittel',farbe:0,steig:'gold',pause:k[i].pause||2}); }
  return show({basis:s.basis,rampe:s.rampe,verzoegerung:s.verzoegerung},k); }; }

/* ZWILLINGSSONNE 200 (Tom: "3 Schuesse (links/rechts/Mitte), Explosion
   aber ganz woanders -> Bruch muss am Schussende sitzen"). Die zwei
   mitsteigenden Kometen (Abschuss) waren zwei Spuren, die nirgends
   endeten, und die Sonnen standen je 5-7 m neben dem Ende der Kugelspur.
   Jetzt steigt nur die Kugel; an ihrem Spurende zerlegt sie sich: zwei
   schwere Tochterkugeln fliegen mit hellem Schweif sichtbar vom Bruch-
   punkt nach links und rechts (wie bei einer echten Zwillingsbombe) und
   oeffnen sich dort als Sonnen - danach die Kometen ueber Kreuz und die
   Kiefernkrone genau ueber dem Spurende. */
EFF.zwillingssonne=function(p,A,B,s){ const [u]=basisBlick(p,0.2), d=4.0*s, T=0.5, G=1.2;   /* gerendert: mit 2,6 lagen die Sonnen ineinander */
  flash(p,[1,.9,.7],3,0.18); muendungsblitz(p,p.y,2);
  const sonne=(sd,fn)=>{ const v=[u[0]*sd*d/T,1.0,u[2]*sd*d/T]; nKomet(p,v,[1.6,1.3,.8],T,G,[1,.8,.42],120);
    kgSpaeter(T,()=>fn(sternNach(p,v[0],v[1],v[2],G,T))); };
  let L=null, R=null;
  /* gerendert 07.10.: die Sonnen waren klein und nach 3 s weg - groesser */
  sonne(-1,q=>{ L=q; EFF.tigerschweif(q,FW.gold,FW.orange,s*0.9); EFF.lavaregen(q,FW.gold,FW.orange,s*0.55); flash(q,[1,.8,.4],2.2,0.25); schall(q,x=>sfx.boom(x*1.1)); });
  sonne(1,q=>{ R=q; EFF.sternspritzer(q,A,B,s*0.95); EFF.sternspritzer(q,B,FW.gold,s*0.6); flash(q,kgMal(A,1),2.2,0.25); schall(q,x=>sfx.boom(x*0.95)); });
  kgSpaeter(T+0.9,()=>{ if(!L||!R) return; for(const [von,zu,c] of [[L,R,A],[R,L,B]]) for(let k=0;k<5;k++){ const dx=zu.x-von.x, dz=zu.z-von.z, l=Math.hypot(dx,dz)||1, w=5.5*Math.sqrt(s)*(0.8+0.2*k), v=[dx/l*w,1.5+k*1.2,dz/l*w];
      nKomet(von,v,kgMal(c,1.6),2.4,2.0,[1,.8,.42],60); } schall(p,x=>sfx.zischen(x*0.5,1.6)); });
  kgSpaeter(T+1.9,()=>{ EFF.kiefernkrone({x:p.x,y:p.y+0.5,z:p.z},FW.gold,A,s*0.5); });
  schall(p,x=>{ sfx.crack(x*0.9); sfx.plopp(x*0.8,0.7); }); };
if(KUGEL.zwillingssonne200) delete KUGEL.zwillingssonne200.abschuss;
/* GOLDWEIDENKREUZ 200 (Tom: "kraesser"). Vorher acht Crossetten im Kranz,
   je vier Goldweiden. Jetzt zwoelf Crossetten im Kranz, jede teilt sich
   knackend in vier schwere Goldweiden mit dichtem Brokatschweif, die
   lange haengen; eine halbe Sekunde spaeter ein zweiter, kleinerer Kranz
   aus acht Crossetten in der Farbe B darunter, in der Mitte ein
   gruener Kern, zum Schluss knistern die Weidenenden. */
EFF.goldweidenkreuz=function(p,A,B,s){ const G=2.4, t=0.8;
  const kranz=(n,w,el,cK,L,funken)=>nKranz(n,w,v=>{ nKomet(p,v,kgMal(cK,1.5),t,G,[1,.8,.42],55);
    kgSpaeter(t,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,t), wv=bahnTempo(v,G,t), a0=rand(0,Math.PI*2);
      for(let k=0;k<4;k++){ const a=a0+k*Math.PI/2, sp=4.6*Math.sqrt(s), dv=[Math.cos(a)*sp+wv[0]*0.3,1.3+wv[1]*0.3,Math.sin(a)*sp+wv[2]*0.3];
        kgStern(psBig,e,dv,[1.7,1.12,.5],L,1.5,0,0.5);   /* psHuge: weiche Ballen am Weidenende (gerendert) */ rkFunken(e,dv,1.5,0.05,L,funken,[1.25,.82,.32],{ps:psMid,life:[2.2,3.2],g:0.7,streu:0.12,mit:0.03,mode:0,spur:0.3});
        rkFunken(e,dv,1.5,0.1,L,funken*0.4,[1.35,1.05,.5],{ps:psBig,life:[1.6,2.4],g:0.6,streu:0.15,mit:0.03,mode:4});
        kgSpaeter(L*0.85,()=>{ const q=sternNach(e,dv[0],dv[1],dv[2],1.5,L*0.85); for(let j=0;j<Math.round(5*QUAL());j++){ const d=randDir(); psSmall.emit(q.x,q.y,q.z,d[0]*1.6,d[1]*1.6,d[2]*1.6,1.5,1.3,.9,rand(0.1,0.25),1,3); } }); }
      psHuge.emit(e.x,e.y,e.z,0,0,0,1.4,1.25,1,0.06,0,0); }); },el);
  kranz(12,8.6*s,0.15,A,4.4,70);
  kgSpaeter(0.5,()=>kranz(8,6*s,-0.1,B,3.6,55));
  /* gerendert 07.10.: die Weiden waren duenne Striche - dazu ein goldener
     Kamuro-Schleier in der Mitte, der die Weiden zu einem Vorhang schliesst */
  kgSpaeter(0.95,()=>EFF.kamuro(p,FW.gold,FW.bernstein,s*0.55));
  nKugel(Math.round(22*KQ(s)),3.2*s,v=>kgStern(psBig,p,v,kgMal(A,1.45),2.0,2.2,0,0.12));
  schall(p,x=>{ sfx.boom(x*1.0); later(0.8,()=>{ sfx.crack(x*0.8); later(0.07,()=>sfx.crack(x*0.6)); later(0.5,()=>sfx.crack(x*0.6)); later(0.58,()=>sfx.crack(x*0.45)); });
    later(1.4,()=>sfx.rieseln(x*0.8,5)); later(3.6,()=>sfx.crackle(x*0.5)); }); };
['zwillingssonne','goldweidenkreuz'].forEach(n=>{ const f=EFF[n]; EFF[n]=function(){ const alt=STERN_LEBEN; STERN_LEBEN=1.5; try{ return f.apply(this,arguments); } finally{ STERN_LEBEN=alt; } }; });
if(KUGEL.goldweidenkreuz200){ KUGEL.goldweidenkreuz200.raum=2.15; if(P.goldweidenkreuz200) P.goldweidenkreuz200.desc='Zwölf Crossetten im Kranz knacken auf, jede teilt sich in vier schwere Goldweiden, die lange hängen und am Ende knistern – darunter ein zweiter Kranz in Grün.'; }

/* VULKANAUSBRUCH (Tom: "gut; die am Tisch beginnende Fontaene DARF
   bleiben, ruhig doller; Blitze am Anfang realistischer (sehen aus wie
   1-Pixel-Drohnen); etwas mehr Schuss (Koenigsklasse), nicht viel").
   Blitz: vorher Punkte im Abstand von 20-30 cm (aus 30 m Entfernung eine
   Kette einzelner Pixel, die stehen blieb). Jetzt ein Blitz wie in einer
   echten Aschewolke: ein zackiger Hauptkanal von 6-11 m mit zwei, drei
   Aesten, als durchgehende Linie (Funken alle 6 cm), der in 0,3 s zwei-
   bis dreimal nachschlaegt und dabei die Wolke von innen anleuchtet. */
function r3Blitz(q,c,s){ const pfad=[], aeste=[];
  let p={x:q.x,y:q.y,z:q.z}; const n=Math.round(rand(5,8)), [u]=basisBlick(q,0.2), quer=rand(-1,1);
  for(let k=0;k<n;k++){ const l=rand(1.4,2.3)*Math.sqrt(s), sw=rand(-0.9,0.9)+quer*0.4, z={x:p.x+u[0]*sw*l,y:p.y-l*rand(0.6,1.0),z:p.z+u[2]*sw*l+rand(-0.3,0.3)};
    pfad.push([p,z]); if(k>0&&k<n-1&&Math.random()<0.45){ let a=z; for(let j=0;j<2;j++){ const sw2=(Math.random()<0.5?-1:1)*rand(0.6,1.2), b={x:a.x+u[0]*sw2*l*0.7,y:a.y-l*rand(0.3,0.6),z:a.z+u[2]*sw2*l*0.7}; aeste.push([a,b]); a=b; } }
    p=z; }
  const schlag=(t,k)=>kgSpaeter(t,()=>{ const alt=SCHWEIF; SCHWEIF=0;
    for(const [a,b] of pfad.concat(k>0.6?aeste:[])){ const L=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z), m=Math.max(2,Math.round(L/0.06));
      for(let i=0;i<=m;i++){ const f=i/m; psMid.emit(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,a.z+(b.z-a.z)*f,0,0,0,c[0]*k,c[1]*k,c[2]*k,0.07,0,0); }
      /* gerendert 07.10.: als reine Funkenlinie zu duenn - dazu ein Glimmen
         um den Kanal (grosse, schwache Sterne alle 20 cm) */
      const mg=Math.max(2,Math.round(L/0.2));
      for(let i=0;i<=mg;i++){ const f=i/mg; psBig.emit(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,a.z+(b.z-a.z)*f,0,0,0,c[0]*0.55*k,c[1]*0.55*k,c[2]*0.65*k,0.08,0,0); } }
    SCHWEIF=alt; flash(q,[0.8,0.8,1],1.6*k,0.1); });
  schlag(0,1); schlag(0.07,0.55); schlag(rand(0.16,0.26),0.85); }
/* gluehende Aschewolke: weiche, schwach leuchtende Ballen, die langsam
   treiben, darin einzelne Glutfunken - statt stehender Leuchtpunkte */
function r3Wolke(e,c,s,n){ const alt=SCHWEIF; SCHWEIF=0;
  for(let j=0;j<Math.max(6,Math.round(n/2));j++){ const a=rand(0,Math.PI*2), r=Math.sqrt(Math.random())*5.5*Math.sqrt(s);
    psHuge.emit(e.x+Math.cos(a)*r,e.y+rand(-1,1),e.z+Math.sin(a)*r,rand(-.3,.3),rand(-.1,.25),rand(-.3,.3),c[0]*0.3,c[1]*0.22,c[2]*0.2,rand(0.6,1.0),0,0); }
  for(let j=0;j<n;j++){ const a=rand(0,Math.PI*2), r=Math.sqrt(Math.random())*6*Math.sqrt(s);
    psMid.emit(e.x+Math.cos(a)*r,e.y+rand(-1.2,1.2),e.z+Math.sin(a)*r,rand(-.4,.4),rand(-.6,.2),rand(-.4,.4),c[0]*0.9,c[1]*0.5,c[2]*0.3,rand(0.4,0.9),0.6,2); }
  SCHWEIF=alt; }
LICHTYP.aschewolke=function(o,A,B,s,opt){
  thDunkel(o,s,opt,29,A,e=>{ let t=0; const glut=lHell(A,0.9);
    for(let k=0;k<9;k++){ t+=rand(0.18,0.45); const tt=t; kgSpaeter(tt,()=>{ const d=randDir(), r=rand(1,6)*Math.sqrt(s), q={x:e.x+d[0]*r,y:e.y+d[1]*r*0.3,z:e.z+d[2]*r};
      r3Wolke(q,glut,s,Math.round(24*QUAL())); if(k%3===1){ r3Blitz({x:q.x,y:q.y+2,z:q.z},[1.5,1.5,1.8],s); schall(q,x=>sfx.crack(x*0.5)); } }); }
    schall(e,x=>sfx.vulkangrollen(x)); });
};
/* Krater (nur der Vulkanausbruch, ein Fontaenen-Modul): staerker als die
   alte kleine Vulkan-Fontaene - ein dichter Lavakegel bis 6-9 m, der in
   Stoessen pumpt; bei jedem Stoss fliegen schwere gluehende Lavabrocken
   im Bogen heraus und kuehlen im Fallen ab, der Krater leuchtet rot und
   grollt. Er brennt ueber beide Ausbrueche (gt). */
NEU_EMIT.krater=(e,dt,o)=>{
  const A=e.A||FW.orange, B=e.B||FW.rot, H=e.h||1, q=QUAL(), y0=emY(o,0.05);
  if(e.alter===undefined){ e.alter=0; e.T=e.t+dt; e.stoss=0; e.fl=0; }
  const t=(e.alter+=dt), k=Math.min(1,t/0.8)*Math.min(1,Math.max(0,e.t)/1.2);
  /* Pumpen: alle 0,5-1,1 s ein Stoss, dazwischen brodelt es */
  e.stoss-=dt; let schub=0.55;
  if(e.stoss<=0){ e.stoss=rand(0.5,1.1); schub=1.6;
    const n=Math.round(rand(4,7)*q*k)+1;
    for(let i=0;i<n;i++){ const a=rand(0,Math.PI*2), w=rand(1.2,3.2)*H, vy=rand(9,14)*Math.sqrt(H);
      const c=mischF(A,[1.5,1.2,.5],0.4); kgStern(psBig,{x:o.x,y:y0,z:o.z},[Math.cos(a)*w,vy,Math.sin(a)*w],kgMal(c,1.5),rand(1.6,2.2),9,0,0.5);
      rkFunken({x:o.x,y:y0,z:o.z},[Math.cos(a)*w,vy,Math.sin(a)*w],9,0.02,1.8,22,[1.4,.42,.08],{ps:psMid,life:[0.5,0.9],g:2,streu:0.3,mit:0.05,mode:2}); }
    flash({x:o.x,y:o.y+2,z:o.z},[1,.45,.12],2.4*k*emLicht(e),0.35); schall(o,v=>{ sfx.wumms(v*0.5*k); sfx.prasseln(v*0.7); }); }
  e.fl-=dt; if(e.fl<=0){ e.fl=0.28; flash({x:o.x,y:o.y+1.5,z:o.z},A,1.6*k*emLicht(e),0.3); }
  zischBett(e,'rauschen',distVol(o)*1.6*k,dt);
  const alt=SCHWEIF; SCHWEIF=0.08;
  for(let i=0;i<Math.round(34*q*k*schub);i++){ const a=Math.random()*Math.PI*2, s=rand(0.3,2.2)*H, c=Math.random()<0.7?A:Math.random()<0.5?B:[1.5,1.25,.6];
    psMid.emit(o.x,y0,o.z,Math.cos(a)*s,rand(5,11)*Math.sqrt(H)*(schub>1?1.15:1),Math.sin(a)*s,c[0],c[1],c[2],rand(0.9,1.6),5.5,2); }
  SCHWEIF=alt;
};
thShow('lb_vulkan',{sz:[0.95,1.35],pw:[0,3],hell:[0.9,1.35],kurve:'spaet'},[
  {n:2,gap:1.8,muster:'v',ang:0.15,licht:'aschewolke',farbe:2,pause:1.5},
  {n:8,gap:0.18,muster:'mitte',ang:0.35,licht:'lavastrahl',farbe:0,boden:{k:'krater',alt:true,gt:22,gh:1.0,A:'orange',B:'rot'}},
  {n:6,gap:1.2,muster:'aussen',ang:0.3,licht:'lavabombe',farbe:1,pause:0.5},
  {mit:true,n:4,gap:1.4,muster:'zufall',ang:0.3,licht:'ascheregen',farbe:3,pause:1},
  {n:2,gap:0.6,muster:'paar',ang:0.2,licht:'aschewolke',farbe:2,pause:0.8},
  {n:14,gap:0.2,muster:'w',ang:0.4,licht:'lavastrahl',farbe:1},
  {n:16,gap:0.11,muster:'kreis',ang:0.35,licht:'lavabombe',kal:'gross',farbe:0,pause:6}]);
lochName('lb_vulkan',{name:'Vulkanausbruch · 52 Schuss Lavabomben',sub:'52 Schuss Lavabomben',
  desc:'Erst grollt es in einer glühenden Aschewolke, in der echte Blitze zucken, dann bricht der Vulkan aus: aus dem Krater auf dem Tisch schießt glühende Lava, Lavastrahlen steigen, schwere Lavabomben mit glühenden Schweifen und knisternder Ascheregen – zweimal, das zweite Mal größer.'});
lochGroesser('lb_vulkan',44,52);

/* ZITRONENFALTER (Tom: "gut, wirkt aber etwas unnatuerlich"). Vorher
   blieb der Kopf oben stehen und sprang in Hakenspruengen hin und her,
   die Falterpaare kreisten um einen Punkt, der in der Luft schwebte -
   das kann keine Ladung. Jetzt nach echtem Vorbild (Falling Leaves):
   - Flatterkomet: ein gelber Komet, dessen Glitzerschweif seitlich
     sprueht (der Stern dreht sich); oben zerfaellt er in sechs bis neun
     kleine Zitronenfalter, die flackernd hin- und herpendeln und langsam
     sinken - Schwerkraft und Luftwiderstand, kein Schweben.
   - Falterpaar: zwei grosse helle Falter, die gegenlaeufig pendelnd
     nebeneinander herabsegeln. */
function r3Falter(e,A,B,s,n,gross){ const Q=lQuer({dir:FANDIR}), wind=rand(-0.3,0.3), bl=[];
  for(let i=0;i<n;i++){ const d=randDir(), w=(gross?rand(1.8,2.4):rand(2.8,4.2))*Math.sqrt(s), dv=gross?[Q[0]*(i%2?1:-1)*w,rand(0.6,1.0),Q[2]*(i%2?1:-1)*w]:[d[0]*w,Math.abs(d[1])*w*0.5+0.8,d[2]*w];
    /* gerendert 07.10.: mit Helligkeit 1,35 waren die Falter aus 30 m nur
       Staubkoerner, ein zusaetzlicher grosser Stern (psHuge) eine weiche Scheibe -
       jetzt heller, mit Glitzerhauch beim Oeffnen, ohne Scheibe */
    const c=lHell(i%3===2?mischF(A,[1,1,1],0.5):(gross&&i%2?B:A),gross?1.85:1.7), h=kgStern(psBig,e,dv,c,gross?rand(4.2,4.8):rand(3.2,4.0),0.7,0,0.25);
    for(let j=0;j<Math.round(4*QUAL())+2;j++) psMid.emit(e.x,e.y,e.z,dv[0]*rand(0.3,0.9),dv[1]*rand(0.3,0.9),dv[2]*rand(0.3,0.9),c[0],c[1],c[2]*0.8,rand(0.5,0.9),1.2,4);
    bl.push({h,c,los:rand(0.3,0.5),ph:gross?(i%2?0:Math.PI):rand(0,6.3),om:gross?2.4:rand(2.6,3.6),amp:(gross?1.1:rand(0.5,0.9))*Math.sqrt(s),ph2:rand(0,6.3),om2:rand(5,8),x:dv[0]*0.15,z:dv[2]*0.15}); }
  thTaumeln(bl,gross?4.6:4.0,Q,wind); }
LICHTYP.flatterkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(27.5*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  lKopf(m,v,lHell(A,1.3),T,G,0,0.25);
  lFunken(m,v,G,0.03,T,70,mischF(lHell(A,1),[1,1,.8],0.4),{ps:psMid,life:[0.35,0.7],g:2,streu:0.4,mit:0.1,mode:4});
  lStart(m,0.8,0.6); sfx.fluegel(distVol(m)*0.5,Math.min(1.2,T));
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T); r3Falter(e,A,B,s,Math.round(6*QUAL())+6,false);
    schall(e,x=>{ sfx.plopp(x*0.3,1.3); later(0.3,()=>sfx.fluegel(x*0.6,1.6)); }); });
};
LICHTYP.falterpaar=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(28*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  kgStern(psBig,m,v,lHell(A,1.2),T,G,0,0.2); lFunken(m,v,G,0.03,T,40,mischF(lHell(A,1),[1,1,.8],0.4),{ps:psMid,life:[0.3,0.6],g:2,streu:0.15,mit:0.1,mode:4}); lStart(m,0.8,0.6);
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T); r3Falter(e,A,B,s,2,true);
    for(let j=0;j<Math.round(10*QUAL());j++){ const d=randDir(); psSmall.emit(e.x,e.y,e.z,d[0]*1.6,d[1]*1.6,d[2]*1.6,1.5,1.5,1.3,rand(0.2,0.5),1,1); }
    schall(e,x=>{ sfx.plopp(x*0.35,1.1); later(0.2,()=>sfx.fluegel(x*0.7,2.0)); }); });
};

/* KOLIBRI (Tom: "erster Effekt, der nach links und rechts oben am Himmel
   geht, wirkt unnatuerlich/unphysikalisch -> natuerlicher. Sonst echt
   schoen. Mehr auf Sounds achten"). Der Schwirrkomet sprang oben in
   geraden Strichen hin und her und stand dazwischen still. Jetzt wie
   echte Schwirrsterne (Hummel/Bienen): oben zerlegt sich der Komet in
   drei, vier kleine Sterne, die sich schnell um sich selbst drehen - sie
   schwirren auf engen Spiralen auseinander, werden vom Luftwiderstand
   gebremst, sinken und schillern gruen-tuerkis; zum Schluss blitzt die
   rubinrote Kehle. Dazu summt es. */
LICHTYP.schwirrkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(29*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  lKopf(m,v,lHell(A,1.2),T,G,0,0.3); lFunken(m,v,G,0.03,T,90,lHell(A,0.9),{ps:psMid,life:[0.4,0.8],g:2,streu:0.12,mit:0.1,mode:4}); lStart(m,0.8,0.6);
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T), n=3+(Math.random()<0.5?1:0), D=1.9, rubin=[1.7,.25,.45];
    const S=[]; for(let k=0;k<n;k++){ const a=k/n*Math.PI*2+rand(-0.4,0.4), w=rand(6,8)*Math.sqrt(s); S.push({v:[Math.cos(a)*w,rand(0.5,2.2),Math.sin(a)*w],om:rand(9,12)*(k%2?1:-1),ph:rand(0,6.3),r:rand(0.35,0.5)*Math.sqrt(s)}); }
    const [u1,u2]=basisBlick(e,0.2);
    thJeBild(D,t=>{ for(const z of S){ const b=sternNach(e,z.v[0],z.v[1],z.v[2],3,t), w=bahnTempo(z.v,3,t), r=z.r*(1-0.5*t/D), a=z.ph+z.om*t;
        const q={x:b.x+(u1[0]*Math.cos(a)+u2[0]*Math.sin(a))*r,y:b.y+(u1[1]*Math.cos(a)+u2[1]*Math.sin(a))*r,z:b.z+(u1[2]*Math.cos(a)+u2[2]*Math.sin(a))*r};
        const k=t>D-0.3?(D-t)/0.3:1, sch=0.5+0.5*Math.sin(t*7+z.ph), c=mischF(lHell(A,1.75),lHell(B,1.75),sch);
        SCHWEIF=0.12; thPunkt(psHuge,q,kgMal(w,0.1),kgMal(c,k),0.07);
        for(let i=0;i<Math.round(3*QUAL())+1;i++) psMid.emit(q.x,q.y,q.z,rand(-.3,.3),rand(-.5,0),rand(-.3,.3),c[0]*0.8,c[1]*0.85,c[2]*0.8,rand(0.4,0.8)*k,1,4);
        if(Math.abs(t-(D-0.12))<1/60) lBlitz(q,rubin,0.25); } });
    schall(e,x=>{ sfx.plopp(x*0.35,1.2); sfx.schwirren(x*0.9,D*0.9); later(D-0.15,()=>sfx.snap(x*0.4)); }); });
};

/* TROMMELFEUER (Tom: "mehr Sounds; alle Effekte texturell ueberarbeiten -
   Lichter sehen billig/'schlecht grafisches Spiel' aus, nicht echt (bei
   viel gleichzeitig am Himmel)"). Die Salven bestanden aus sechs gleichen
   Paeonien/Kugeln - sechs runde Punktbaelle nebeneinander. Jetzt hat jede
   Salve Sterne mit Schweif und Glitzer (Goldkaskaden, Sternspritzer,
   Brokat, Palmen mit Glitzerschweif) und jede Trommelfigur ihren eigenen
   Schlag: Viertel wummern, die Synkope schlaegt doppelt, der Pauken-
   schlag ist ein echter Salut (Knall), die Triolen knistern nach, der
   Wirbel knackt in Kaskaden, der Tusch rollt als Donner nach. */
{ const alt=SHOWS.donnerwand; if(alt) SHOWS.donnerwand=()=>{ const s=alt(), k=s.map(ph=>Object.assign({},ph));
  const tausch={kugel:'goldkaskade',chrys:'sternspritzer',weide:'glitzerweide',palme:'sternpalme'};
  const klang=[null,'bkWumms','bkDoppel','bkSalut','bkKnisterhall',null,'bkKaskade','bkDonnerhall'];
  let salve=0;
  k.forEach((ph,i)=>{ if(!ph.n) return; salve++;
    if(Array.isArray(ph.eff)) ph.eff=ph.eff.map(e=>tausch[e]||e); else if(tausch[ph.eff]) ph.eff=tausch[ph.eff];
    const kl=klang[Math.min(klang.length-1,salve)]; if(kl&&!ph.knall) ph.knall=kl;
    /* Paukenschlag: zwei der sechs Rohre sind Salute */
    if(ph.n===6&&ph.muster==='gerade'&&ph.eff!=='kamuro') ph.eff=['glitzerweide','salut','glitzerweide','glitzerweide','salut','glitzerweide'];
    /* gerendert 07.10.: jede Palme hatte einen weissen runden Kern (Leucht-
       scheibe) und die Salven lagen uebereinander - ohne Kern, etwas
       weiter gefaechert, damit jeder Stern fuer sich steht */
    ph.bruchOpt=Object.assign({},ph.bruchOpt||{},{kern:false,nachglitzer:false});
    if(ph.ang) ph.ang=+(ph.ang*1.2).toFixed(3); });
  return show({basis:s.basis,rampe:s.rampe,verzoegerung:s.verzoegerung},k); }; }
lochName('donnerwand',{desc:'Zwanzig Salven aus sechs Rohren im Takt eines Trommelsolos: wummernde Goldpalmen, Kokospalmen auf der Synkope, ein Paukenschlag mit zwei Saluten, knisternde Triolen aus Goldkaskaden und Sternspritzern, ein knackender Wirbel – und als Tusch sechs riesige Kamuro.'});

/* ROSENHERZ (Tom: "neu ausbalancieren - Effektkombination, Texturqualitaet,
   Farben; mehr Richtung Rosa, goldene Elemente ok aber mehr andere,
   stimmiger"). Ein Rosenstrauss in Rosa, Weiss und Rot, Gold nur als
   Hauch: Rosenknospen (rosa Pistille mit weissem Kern) paarweise, ein
   Schleier aus rosa und weissem Rieselregen, vier Herzbomben in Rosa mit
   rotem Rand, ein Strauss aus rosa Chrysanthemen mit Glitzerschweif und
   weissen Sternspritzern, zum Schluss zwei Ringe in Rosa und Weiss,
   darunter oeffnen sich rosa Blueten, die weiss verbluehen. Kein Gold
   mehr ausser im Aufstieg. 36 Schuss. */
r3Show('hochzeitsfaecher',[['rose','weiss'],['magenta','rose'],['weiss','rose'],['rot','rose'],['rose','rot']],{sz:[0.95,1.15],pw:[0,1.5],hell:[0.9,1.25],kurve:'flach'},[
  {n:8,gap:0.75,muster:'paar',ang:0.25,eff:'pistill',kal:'klein',farbe:0,steig:'glut',knall:'bkPuff',pause:1.0},
  {n:6,gap:1.1,muster:'mitte',ang:0.4,eff:'farbregen',A:'rose',B:'weiss',kal:'gross',steig:'silber',knall:'bkRieseln',pause:1.0},
  {n:4,gap:1.8,muster:'v',ang:0.18,eff:'herz',kal:'gross',A:'rose',B:'rot',steig:'silber',bruchOpt:{nachglitzer:false},pause:1.2},
  {n:10,gap:0.3,muster:'w',ang:0.35,eff:['chrys','sternspritzer'],farbe:1,steig:'glut',knall:'bkKnisterhall',pause:1.2},
  {n:2,gap:0,muster:'v',ang:0.2,eff:'ring',kal:'gross',A:'rose',B:'weiss',steig:'silber'},
  {mit:true,n:6,gap:0.18,muster:'zufall',ang:0.4,kal:'mittel',pw:-1,eff:'bluetenstern',A:'rose',B:'weiss',steig:'silber',knall:'bkPuff',pause:4.5}],{basis:{pw:2.0,sz:1.16,th:'hochzeitsfaecher'}});
lochName('hochzeitsfaecher',{desc:'Ein Rosenstrauß in Rosa, Weiß und Rot: Rosenknospen paarweise, ein Schleier aus rosa und weißem Rieselregen, vier Herzbomben in Rosa, ein Strauß aus rosa Chrysanthemen und weißen Sternspritzern – zum Schluss zwei Ringe, unter denen rosa Blüten aufgehen und weiß verblühen.'});

/* SONNENAUFGANG (Tom: "Explosionen teils nicht schoen, goldene/gelbe Sterne
   schlechte Textur -> ueberarbeiten"). Die goldenen Buketts waren
   Chrysanthemen und Kamuro aus glatten gelben Sternen ohne Schweif, das
   Hitzeflimmern kleine Brokat-Kugeln. Jetzt hat jeder goldene Stern
   Struktur: Goldkaskaden (drei Goldglocken uebereinander) und Brokat
   fuer den anbrechenden Tag, knisternde Sternspritzer in Gold und Orange
   als Hitzeflimmern, die Morgenroete als Zeitregen in Scharlach und Gold
   (grosse Sterne, die nach und nach Glitzer abwerfen). Nishiki und
   Goldglitzer bleiben den Raketen vorbehalten (steigerung.js EXKLUSIV). */
{ const alt=SHOWS.faecher; if(alt) SHOWS.faecher=()=>{ const s=alt(), k=s.map(ph=>Object.assign({},ph));
  k.forEach(ph=>{ const e=Array.isArray(ph.eff)?ph.eff.join(','):ph.eff;
    if(e==='chrys,kamuro'){ ph.eff=['goldkaskade','brokat']; ph.farbe=3; ph.knall='bkBrokat'; }
    else if(e==='brokat'&&ph.kal==='klein'){ ph.eff='sternspritzer'; ph.farbe=3; ph.knall='bkKnisterhall'; }
    else if(e==='wechsel'){ ph.eff='zeitregen'; ph.farbe=2; ph.knall='bkPuff'; }
    /* gerendert 07.10.: neben den Goldbruechen stand eine weisse runde
       Leuchtscheibe (Kern) - ohne Kern und Nachglitzern */
    if(ph.eff) ph.bruchOpt=Object.assign({},ph.bruchOpt||{},{kern:false,nachglitzer:false}); });
  return show({basis:s.basis,rampe:s.rampe,verzoegerung:s.verzoegerung},k); }; }

/* KNATTERSTURM: ohne die Knisterfontaene (Boden raus) stieg das Ende nur
   0,5 m ueber den Anfang (steigerung.js verlangt 1,5 m) - die Schlag-Salve
   geht 2 m hoeher auf */
{ const alt=SHOWS.knatter; if(alt) SHOWS.knatter=()=>{ const s=alt(); s.forEach((ph,i)=>{ if(ph&&ph.muster==='schlag'&&ph.eff==='tausend') s[i]=Object.assign({},ph,{pw:(ph.pw||0)+2}); }); return s; }; }

/* GLUTSCHMIEDE: die Bodenfontaenen sind raus (Tom: "z. B. Glutschmiede").
   Dafuer schlaegt der Schmied: in der Schlag-Salve sind zwei der sechs
   Rohre Salute (Hammer auf dem Amboss), und die Lavabrocken wummern. */
{ const alt=SHOWS.glutschmiede; if(alt) SHOWS.glutschmiede=()=>{ const s=alt(), k=s.map(ph=>Object.assign({},ph));
  k.forEach(ph=>{ if(ph.muster==='schlag'&&ph.n===6) ph.eff=['tigerschweif','salut','kiefernkrone','lavaregen','salut','tigerschweif'];
    if(ph.eff==='lavaregen'&&!ph.knall) ph.knall='bkWumms'; });
  return show({basis:s.basis,rampe:s.rampe,verzoegerung:s.verzoegerung},k); }; }

/* Ohne weissen Kern (runde Leuchtscheibe in der Bruchmitte, gerendert
   07.10. bei Sonnenaufgang und Trommelfeuer gesehen): alle in dieser
   Runde neu geschriebenen Batterien */
function r3OhneKern(id){ const alt=SHOWS[id]; if(!alt) return; SHOWS[id]=()=>{ const s=alt();
  s.forEach((ph,i)=>{ if(ph&&ph.eff&&!(ph.bruchOpt&&ph.bruchOpt.kern===false)) s[i]=Object.assign({},ph,{bruchOpt:Object.assign({},ph.bruchOpt||{},{kern:false,nachglitzer:false})}); });
  return s; }; }
['lb_jadekoenig','lb_saphirfaecher','lb_goldader','hochzeitsfaecher','profi','glutschmiede'].forEach(r3OhneKern);

/* ---------- Vorfuehrung: dieselben Abschussrohre wie im Spiel ----------
   Tom 07.10.: "Abschussrohre in der Vorfuehrung sehen anders aus als im
   echten Spiel -> dieselben Rohre wie im Spiel nehmen". Die Vorfuehranlage
   hatte glatte graue Zylinder ohne Innenseite (0,62 m Rohr, Moerser 0,6-
   1 m hoch). Jetzt wie an den Stationen (05d): Abschussrohr aus dunklem
   Stahl mit schwarzer Innenwand, Boden, Muendungsring, Schelle und
   schwerer Fussplatte mit zwei Stuetzen auf einem Lochblechtisch; Moerser
   wie die Moerserbatterie - Rohre 1,30/1,55/1,85 m auf 0,18 m, Muendungs-
   wulst, zwei Verstaerkungsringe, Boden, Schellen, Riffelblech-Platte. */
const VF_MOERSER_H=[1.30,1.55,1.85], VF_MOERSER_FUSS=0.18;
vfAnlageBauen=function(){
  if(vfAnlage){ vfAnlage.visible=true; return; }
  const g=new THREE.Group(), steel=std(0x8a929e,{metalness:0.65,roughness:0.38}), steelDark=std(0x3a4049,{metalness:0.6,roughness:0.45}), holz=std(0xa8844f,{roughness:0.8});
  const perf=std(0x5d646e,{metalness:0.55,roughness:0.5}), tubeM=std(0x3e4652,{metalness:0.72,roughness:0.34}), innenM=std(0x14161b,{roughness:0.9,side:THREE.DoubleSide});
  tubeM.side=THREE.DoubleSide;
  const box=(w,h,d,m,x,y,z)=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); b.position.set(x,y,z); b.castShadow=b.receiveShadow=true; g.add(b); return b; };
  const ring=(r,t,m,x,y,z)=>{ const o=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,20),m); o.rotation.x=Math.PI/2; o.position.set(x,y,z); g.add(o); return o; };
  /* Tisch fuer Batterien und Kleinfeuerwerk wie bisher */
  const T=VF_TISCH, tw=T.n*T.dx+0.2, tx=T.x0+(T.n-1)*T.dx/2;
  box(tw,0.06,0.9,holz,tx,T.y-0.03,VF_Z);
  for(const sx of [-1,1]) for(const sz of [-1,1]) box(0.08,T.y-0.06,0.08,steel,tx+sx*(tw/2-0.1),(T.y-0.06)/2,VF_Z+sz*0.35);
  /* Abschussrohre: Lochblechtisch in 0,76 m, Rohre 0,62 m, Muendung 1,38 m */
  const R=VF_ROHR, TT=RAMPE_TISCH, rw=(R.n-1)*R.dx+0.4, rx=R.x0+(R.n-1)*R.dx/2, H=0.62, yc=TT+0.012+H/2;
  box(rw,0.04,0.74,perf,rx,TT-0.02,VF_Z);
  box(rw+0.06,0.05,0.05,steelDark,rx,TT-0.025,VF_Z+0.37); box(rw+0.06,0.05,0.05,steelDark,rx,TT-0.025,VF_Z-0.37);
  for(const sx of [-1,1]) for(const sz of [-1,1]) box(0.06,TT-0.05,0.06,steelDark,rx+sx*(rw/2-0.08),(TT-0.05)/2,VF_Z+sz*0.3);
  box(rw-0.2,0.03,0.12,steelDark,rx,0.26,VF_Z+0.3); box(rw-0.2,0.03,0.12,steelDark,rx,0.26,VF_Z-0.3);
  for(let i=0;i<R.n;i++){ const x=R.x0+i*R.dx;
    const t=new THREE.Mesh(new THREE.CylinderGeometry(0.062,0.062,H,20,1,true),tubeM); t.position.set(x,yc,VF_Z); t.castShadow=true; g.add(t);
    const inn=new THREE.Mesh(new THREE.CylinderGeometry(0.056,0.056,H-0.03,16,1,true),innenM); inn.position.copy(t.position); g.add(inn);
    const bo=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.012,20),steelDark); bo.position.set(x,yc-H/2,VF_Z); g.add(bo);
    ring(0.064,0.013,steel,x,yc+H/2,VF_Z); ring(0.066,0.012,steelDark,x,yc-H/2*0.55,VF_Z);
    box(0.24,0.022,0.24,steelDark,x,TT+0.011,VF_Z);
    for(const sx of [-1,1]){ const st=box(0.014,0.2,0.014,steelDark,x+sx*0.085,TT+0.1,VF_Z+0.02); st.rotation.z=-sx*0.32; } }
  /* Moerser: je Kaliber vier Rohre wie an der Moerserbatterie */
  const M=VF_MOERSER, rohrM=std(0x2f353f,{metalness:0.78,roughness:0.3}), wulstM=std(0x454d59,{metalness:0.7,roughness:0.35}), bodenM=std(0x15171c,{roughness:1}), schwarz=std(0x0b0c10,{roughness:1,side:THREE.DoubleSide});
  rohrM.side=THREE.DoubleSide;
  for(let k=0;k<3;k++){ const gx=M.x0+k*M.gdx, hh=VF_MOERSER_H[k], r=MOERSER_R[k], y0=VF_MOERSER_FUSS;
    box(M.n*M.dx+0.16,0.05,0.62,perf,gx+(M.n-1)*M.dx/2,0.055,VF_Z);
    for(let i=0;i<M.n;i++){ const x=gx+i*M.dx;
      const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r,hh,22,1,true),rohrM); t.position.set(x,y0+hh/2,VF_Z); t.castShadow=true; g.add(t);
      const inn=new THREE.Mesh(new THREE.CylinderGeometry(r*0.9,r*0.9,hh-0.04,16,1,true),schwarz); inn.position.copy(t.position); g.add(inn);
      const bo=new THREE.Mesh(new THREE.CircleGeometry(r*0.9,16),bodenM); bo.rotation.x=-Math.PI/2; bo.position.set(x,y0+0.02,VF_Z); g.add(bo);
      ring(r*1.03,r*0.17,wulstM,x,y0+hh,VF_Z);
      for(const f of [0.3,0.62]) ring(r*1.02,r*0.1,rohrM,x,y0+hh*f,VF_Z);
      for(const y of [0.42,0.66]) ring(r+0.03,0.022,steel,x,y,VF_Z); } }
  scene.add(g); vfAnlage=g;
};
/* Muendungen passend zu den neuen Moersern (Rohrhoehe 1,48/1,73/2,03 m) */
{ const vm=vfMuendung; vfMuendung=function(t){ const o=vm.apply(this,arguments);
    if(o&&o.sid==='moerser'){ const k=moerserRohr(t)%3; o.y=VF_MOERSER_FUSS+VF_MOERSER_H[k]; }
    return o; }; }

/* ---------- 4. Level-Ordnung ----------
   Tom 07.10.: "Weltuntergang hebt sich in der Koenigsklasse stark ab ->
   Batterien nach Volumen/Wucht vergleichen und andere auf passende Level
   verschieben"; "Blitzpilz [Blitzpalmen] und Urwald nicht Koenigsklasse-
   wuerdig, es gibt kraessere davor"; "Jumbo Drache eher niedriger";
   Wunsch: stetige Steigerung von unten nach oben. Gemessen (wucht.js:
   Rohre, Dauer, Summe der Bruchflaechen, Spitzendichte in 3 s, Partikel)
   - die Reihenfolge folgt der Wucht. Lizenz je Level: Sternklasse (19),
   Grossfeuer (20), Profi (22), Meister (25). */
/* Gemessen 07.10. (Partikel je Abbrand, Rohre, Dauer): Weltuntergang 540k
   (300 Schuss, 84 s), Hexenkessel 242k (180), Goetterfunken 176k (200),
   Glutschmiede 151k (51), Trommelfeuer 107k (120), Farbsaeulen 101k (100),
   Vulkan 57k (44), Blitzpalmen 52k (25 Schuss in 8 s), Weidenhain 42k (72),
   Urwald alt 35k (34), Kronenfeuer 19k (32). Daraus die Leiter (Urwald neu
   mit 100 Schuss, Vulkan mit 52 und Krater): */
const R3_LEVEL={lb_kronenfeuer:[19,'sternklasse'],lb_blitzpalmen:[19,'sternklasse'],
  donnerwand:[21,'grossfeuer'],feuerpfau:[21,'grossfeuer'],lb_weidenhain:[21,'grossfeuer'],
  glutschmiede:[22,'profi'],lb_vulkan:[22,'profi'],hexenkessel:[23,'profi'],profi:[24,'profi'],feuerdrache:[23,'profi'],
  lb_jadekoenig:[25,'meister'],finale:[26,'meister']};
function r3Level(t,lvl,liz){ const p=P[t]; if(!p) return; p.lvl=lvl;
  if(!liz) return; const L=LIZENZEN.find(l=>l.id===liz); if(!L) return;
  LIZENZEN.forEach(l=>{ const i=l.items.indexOf(t); if(i>=0&&l!==L) l.items.splice(i,1); });
  if(L.items.indexOf(t)<0) L.items.push(t); LIZ_VON[t]=liz;
  /* Preis und Hype wandern mit dem Level (Lichter-Batterien: Level x 2,6) */
  if(/^lb_/.test(t)){ p.cost=Math.round(lvl*2.6); p.market=Math.round(lvl*2.6*2.3)-0.01; p.hype=40+lvl*2; } }
for(const [t,[l,z]] of Object.entries(R3_LEVEL)) r3Level(t,l,z);
/* Texte der Lizenzpakete zu den neuen Inhalten */
{ const d=(id,txt)=>{ const L=LIZENZEN.find(l=>l.id===id); if(L) L.desc=txt; };
  d('profi','Der Götterfunken-Verbund: zweihundert Schuss, und der halbe Ort steht auf der Straße. Dazu der Hexenkessel mit 180 Schuss, die Glutschmiede, der Vulkanausbruch und die Jumbo-Raketen »Polarstern« und »Feuerdrache«; die 200-mm-Kugel Feuerlilie und die 300-mm-Kugel Himmelsbrecher.');
  d('meister','Das Ende der Leiter: der Weltuntergang mit 300 Schuss, der Urwald mit hundert, die Jumbo-Rakete »Supernova« und die 300-mm-Kaiserkrone.');
  d('grossfeuer','Die Jumbo-Rakete »Juwelenpalme«, der Farbtiger, die Farbsäulen, der Weidenhain, das Trommelfeuer mit zwanzig Salven aus sechs Rohren und die 200-mm-Kugelbomben.');
  d('sternklasse','Die Jumbo-Rakete »Saphirkrone«, die Wendeltreppe, die sich zwölf Meter hochschraubt, die Blitzpalmen, das Kronenfeuer und die Crossettenkrone.'); }

/* ---------- Testzugang ---------- */
let ABSCHUSS_AUS=false;
{ const roh=ABSCHUSS; for(const n of Object.keys(roh)){ const f=roh[n]; roh[n]=function(){ if(!ABSCHUSS_AUS) return f.apply(this,arguments); }; } }
try{ window.__r3={
  klang(an){ KLANG_LOG=an?[]:null; ABSCHUSS_LOG=an?[]:null; },
  klangLog:()=>KLANG_LOG, abschussLog:()=>ABSCHUSS_LOG,
  /* Gegenprobe: der neue Abschussklang aus, lStart wieder wie vorher */
  abschussAus(aus){ ABSCHUSS_AUS=!!aus; },
  /* Gegenprobe Bodenfontaenen: aus = die alten Boden-Ebenen laufen wieder */
  bodenAus(an){ BODEN_AUS=!!an; }, BODEN_ERLAUBT,
  TAG_PROD
}; }catch(e){}
/* zuletzt: jedes Drehbuch (auch die oben neu geschriebenen) ohne Bodenfontaene */
bodenRausAlle();
