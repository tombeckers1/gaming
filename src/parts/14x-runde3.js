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

/* ---------- Testzugang ---------- */
let ABSCHUSS_AUS=false;
{ const roh=ABSCHUSS; for(const n of Object.keys(roh)){ const f=roh[n]; roh[n]=function(){ if(!ABSCHUSS_AUS) return f.apply(this,arguments); }; } }
try{ window.__r3={
  klang(an){ KLANG_LOG=an?[]:null; ABSCHUSS_LOG=an?[]:null; },
  klangLog:()=>KLANG_LOG, abschussLog:()=>ABSCHUSS_LOG,
  /* Gegenprobe: der neue Abschussklang aus, lStart wieder wie vorher */
  abschussAus(aus){ ABSCHUSS_AUS=!!aus; },
  TAG_PROD
}; }catch(e){}
