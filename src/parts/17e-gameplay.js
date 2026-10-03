/* =========================================================
   Gameplay-Vorfuehrung (03.10., Tom: "als haette ich das Spiel nahezu
   durchgespielt - grosser Laden mit den Produkten drin, Mitarbeiter,
   alles laeuft. Beobachten: wie ist das wirtschaftlich, wie sind die
   Texturen, wie arbeiten die Mitarbeiter; die einzelnen Bereiche
   anschauen, geht es wirtschaftlich weiter nach oben").
   - Start im Laptop > Laden (nur Entwicklung). Der eigene Spielstand
     wird vorher gesichert und beim Beenden zurueckgeholt; waehrend der
     Vorfuehrung speichert das Spiel nichts.
   - Aufbau ueber die echten Wege des Spiels: alle Lizenzen, jeder
     Ausbau ueber testKauf (mit seinen Nebenwirkungen), alle Mitarbeiter,
     Regale aller Arten im ganzen Laden, gefuellt mit dem Sortiment,
     Lagerregale mit Kartons. Dann oeffnet der Laden.
   - Es laeuft selbst: Laden auf, Feierabend, Tagesabschluss, naechster
     Tag; morgens bestellt ein Disponent nach, was knapp wird (echte
     Bestellung, echter LKW, die Einraeumer raeumen ein).
   - Leiste unten: Kontostand, Umsatz, Kunden, Ruf, Gewinn je Tag,
     Verlauf; Knoepfe/Tasten springen in die Bereiche; Zeitraffer.
   ========================================================= */
const GP_KEY='bb_gp_sicherung';
let gpAn=false, gpEl=null, gpTempo=1, gpTagAlt=-1, gpVerlauf=[], gpUhr=0, gpGestern=null;
/* Sprungpunkte: Name, x, z, Blickrichtung (yaw), Neigung */
const GP_ORTE=[
  ['Verkauf',      14.0, 2.0, Math.PI*0.08, -0.12],
  ['Kassen',        2.8, 4.6, Math.PI*0.55, -0.22],
  ['Halle Süd',    22.0,-8.0, Math.PI*0.95, -0.10],
  ['Lager',       -10.5, 1.0, Math.PI*0.62, -0.10],
  ['Versand',     -12.0,-9.0, Math.PI*0.70, -0.15],
  ['Logistik',    -30.0,-16.0, Math.PI*0.62, -0.05],
  ['Testfeld',      0.3,-8.5, 0, 0.05]
];
function gpStart(){
  if(gpAn||!S) return;
  try{ save(); localStorage.setItem(GP_KEY,localStorage.getItem(KEY)||''); }catch(e){}
  gpAn=true;
  if(laptopOpen) closeLaptop(true);
  if(typeof vfAn!=='undefined'&&vfAn&&typeof vorfuehrungAus==='function') vorfuehrungAus();
  if(typeof vpAn!=='undefined'&&vpAn&&typeof vpAus==='function') vpAus();
  DEMO=false;
  /* Spaete Spielphase */
  S.level=Math.max(S.level,typeof testLevel==='function'?testLevel():30); S.xp=0; S.money=Math.max(S.money,450000); S.rep=Math.max(S.rep,72);
  S.lic=LIZENZEN.map(l=>l.id);
  ORDER.forEach(t=>{ if(P[t]&&!(S.prices[t]>0)) S.prices[t]=r2(marketOf(t)*1.04); });
  /* Ausbau in Level-Reihenfolge, so oft, bis nichts mehr dazukommt
     (Voraussetzungen). testKauf geht den normalen Kauf samt Aufbau. */
  const ups=UPGRADES.slice().sort((a,b)=>(a.lvl||0)-(b.lvl||0));
  for(let runde=0;runde<8;runde++){ let neu=0;
    for(const u of ups){ if(u.done()||(u.req&&!S.up[u.req])||(u.lvl||0)>S.level) continue;
      S.money=Math.max(S.money,450000);
      try{ testKauf(u.id); }catch(e){ console.warn('GP Ausbau',u.id,e); }
      if(u.done()) neu++; }
    if(!neu) break; }
  /* Alle Mitarbeiter */
  STAFF.forEach(s=>{ if(S.staff[s.id]||(s.req&&!S.up[s.req])) return; S.staff[s.id]=true; try{ hireStaff(s.id); }catch(e){} });
  /* Verkaufsregale aller Arten, bis kein Platz mehr frei ist */
  const arten=['hoch','standard','gondel','standard','gross','tischgross','gitter3','hoch','kuehl','eck','tisch','gitter2','standard','gondel','hoch','gross','kuehl','gitter','klein'];
  const altToast=window.toast; window.toast=()=>{};
  try{
    let leer=0; for(let i=0;i<90&&leer<arten.length;i++){ const id=arten[i%arten.length]; if(!regalOf(id)) { leer++; continue; } if(regalAufbauen(id)) leer=0; else leer++; }
    /* Lagerregale */
    for(const id of ['rschwer','rhoch','rack']) for(let i=0;i<10;i++){ if(!regalOf(id)||!regalAufbauen(id)) break; }
  } finally { window.toast=altToast; }
  /* Fuellen: jedes Fach ein Produkt, das ganze Sortiment reihum */
  const ware=ORDER.filter(t=>P[t]&&isUnlocked(t)&&!P[t].noOrder&&!P[t].rezept&&pools[t]);
  let k=0;
  allLevels().forEach(lv=>{ if(lv.type&&lv.count>0) return;
    for(let j=0;j<ware.length;j++){ const t=ware[(k+j)%ware.length]; if(addToLevel(lv,t,1)){ let n=0; while(n++<400&&addToLevel(lv,t,1)); k=(k+j+1)%ware.length; return; } } });
  /* Lager: Kartons der meistverkauften Ware */
  const gut=ware.slice().sort((a,b)=>P[b].weight-P[a].weight);
  let g=0; racks.forEach(r=>r.slots.forEach(sl=>{ if(sl.box) return; const t=gut[g++%gut.length]; try{ putInSlot(sl,t,P[t].box,1); }catch(e){} }));
  /* Laden auf, Spieler in den Verkauf */
  gpTagAlt=S.day; gpVerlauf=[{tag:S.day,geld:S.money}]; gpGestern=null;
  if(phase==='closed'){ if(typeof ruhetag==='function'&&ruhetag()) ruhetagBeenden(); else openShop(); }
  gpSpringe(0);
  gpPanel(); gpZeichnen();
  toast('Gameplay-Vorführung: alles gebaut, Personal da, der Laden läuft. Tasten 1–7 springen in die Bereiche, T Zeitraffer, B beendet.','money');
}
/* Beenden: den alten Spielstand zurueckschreiben und neu laden */
function gpEnde(){
  if(!gpAn) return;
  let alt=''; try{ alt=localStorage.getItem(GP_KEY)||''; }catch(e){}
  /* gpAn bleibt an: beim Neuladen speichert das Spiel sonst den
     Vorfuehrungsstand ueber den eben zurueckgeschriebenen */
  try{ if(alt) localStorage.setItem(KEY,alt); else localStorage.removeItem(KEY); localStorage.removeItem(GP_KEY); }catch(e){}
  location.reload();
}
function gpSpringe(i){
  const o=GP_ORTE[i]; if(!o) return;
  pl.x=o[1]; pl.z=o[2]; yaw=o[3]; pitch=o[4]; aim=null; collide(pl,0.32);
}
function gpTempoWechsel(){ gpTempo=gpTempo===1?3:gpTempo===3?6:1; gpZeichnen(); }
/* Laeuft je Spielschritt: Tagesablauf ohne Klicks, Nachbestellen */
function gpTick(dt){
  if(!gpAn) return;
  /* Aufstieg und Tagesabschluss selbst wegklicken - wie der Spieler */
  if(typeof levelOpen!=='undefined'&&levelOpen){ const b=$('luBtn'); if(b) b.click(); return; }
  if(summaryOpen){
    /* Bilanz des Tages fuer den Verlauf merken, dann "Naechster Tag" */
    if(!gpGestern||gpGestern.tag!==S.day) gpGestern={tag:S.day,umsatz:DS.revenue,kunden:DS.customers};
    const b=$('sBtn'); if(b&&b.onclick) b.onclick(); else closeSummary(); return; }
  if(phase==='after'){ endDay(); return; }
  if(phase==='closed'){ if(typeof ruhetag==='function'&&ruhetag()) ruhetagBeenden(); else openShop(); }
  if(S.day!==gpTagAlt){ gpTagAlt=S.day; gpVerlauf.push({tag:S.day,geld:S.money}); if(gpVerlauf.length>14) gpVerlauf.shift(); gpBestellen(); }
  gpUhr-=dt; if(gpUhr<=0){ gpUhr=0.5; gpZeichnen(); }
}
/* Disponent: was im Laden und Lager zusammen unter einen Karton faellt,
   wird mit einem Karton nachbestellt - ueber den echten Warenkorb */
function gpBestellen(){
  const ware=ORDER.filter(t=>P[t]&&isUnlocked(t)&&!P[t].noOrder&&!P[t].rezept&&typeof canOrder==='function'&&canOrder(t));
  let n=0;
  for(const t of ware){ if(n>=24) break; if(stockOf(t)<P[t].box*0.6){ try{ cartAdd(t,1,(supplierFor(t)||{}).id); n++; }catch(e){} } }
  if(n){ try{ S.money=Math.max(S.money,0); cartOrder(); }catch(e){ console.warn('GP Bestellung',e); } }
}
function gpPanel(){
  if(gpEl) return;
  gpEl=document.createElement('div'); gpEl.id='gameplayVf';
  gpEl.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:60;background:rgba(14,18,30,.9);color:#eef2f8;font:14px "Barlow Condensed",Arial,sans-serif;border:1px solid rgba(255,210,63,.6);border-radius:10px;padding:8px 12px;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;pointer-events:auto';
  gpEl.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; e.stopPropagation();
    if(b.dataset.ort!==undefined) gpSpringe(+b.dataset.ort); else if(b.dataset.gp==='tempo') gpTempoWechsel(); else if(b.dataset.gp==='ende') gpEnde(); });
  document.body.appendChild(gpEl);
}
function gpZeichnen(){
  if(!gpEl) return;
  const v=gpVerlauf, d=v.length>1?v[v.length-1].geld-v[v.length-2].geld:0, h=Math.floor(clock/60), m=Math.floor(clock%60);
  const spark=v.length>1?(()=>{ const mn=Math.min(...v.map(x=>x.geld)), mx=Math.max(...v.map(x=>x.geld)), W=120, H=26;
    const pts=v.map((x,i)=>`${(i/(v.length-1)*W).toFixed(1)},${(H-(mx>mn?(x.geld-mn)/(mx-mn):0.5)*H).toFixed(1)}`).join(' ');
    return `<svg width="${W}" height="${H}" style="vertical-align:middle"><polyline points="${pts}" fill="none" stroke="#6cf2a8" stroke-width="2"/></svg>`; })():'';
  const btn=(txt,attr)=>`<button ${attr} style="font:inherit;padding:3px 9px;border-radius:6px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#eef2f8;cursor:pointer">${txt}</button>`;
  gpEl.innerHTML=`<b style="color:#ffd23f;letter-spacing:.06em">GAMEPLAY-VORFÜHRUNG</b>`+
    `<span>Tag ${S.day} · ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} · ${phase==='open'?'geöffnet':'geschlossen'}</span>`+
    `<span>Konto <b>${eur(S.money)}</b></span><span>heute ${eur(DS.revenue)} · ${DS.customers} Kunden</span>`+
    `<span>Ruf ${Math.round(S.rep)}</span>`+
    (v.length>1?`<span style="color:${d>=0?'#6cf2a8':'#ff7a7a'}">seit gestern ${d>=0?'+':''}${eur(d)}</span>`:'')+
    (gpGestern?`<span>gestern ${eur(gpGestern.umsatz)} Umsatz</span>`:'')+spark+
    `<span style="flex-basis:100%;height:0"></span>`+
    GP_ORTE.map((o,i)=>btn(`${i+1} ${o[0]}`,`data-ort="${i}"`)).join('')+
    btn(`T Zeitraffer ${gpTempo}×`,'data-gp="tempo"')+btn('B Beenden','data-gp="ende" style="background:#c0392b"');
}
/* Tasten waehrend der Vorfuehrung */
function gpTaste(e){
  if(!gpAn) return false;
  if(/^Digit[1-7]$/.test(e.code)){ gpSpringe(+e.code.slice(5)-1); return true; }
  if(e.code==='KeyT'){ gpTempoWechsel(); return true; }
  if(e.code==='KeyB'){ gpEnde(); return true; }
  return false;
}
