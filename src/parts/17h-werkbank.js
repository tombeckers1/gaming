/* =========================================================
   WERKBANK - Bauprogramm (Tom 16.10.2026): eigene Batterie entwerfen,
   in der Vorschau zuenden, Namen geben, entwickeln und in Serie fertigen
   lassen. Geoeffnet nur an der Werkbank im Lager (06c, Aktion E bzw.
   Tippen), nicht im Laptop. Vollbild im Hausstil, am Handy bedienbar.
   Daten, Bewertung, Kalkulation: 02d-werkbank.js. Zahlen: WIRT.werkbank.
   Vorschau: echte Batterie-Engine und Abschuss-Baustein (14z4 abPlatz,
   abAufstellen, abZuenden) auf einem Zuendtisch am Testfeld, Abendlicht,
   eigene Kamera - kein Hype, keine Kosten, die Spielzeit steht still.
   ========================================================= */
let wbOpen=false, wbAnsicht='start', wbE=null, wbSel=0, wbKartons=0, wbPreis=0, wbLoeschArm=null, wbNachK={}, wbVs=null, wbVsN=0;
function wbEl(){ return $('werkbank'); }
const wbEsc=t=>String(t||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
function wbOeffnen(){
  if(!S||!S.up.labor){ toast('Erst die Werkbank kaufen (Ausbau, Kapitel 5).','bad'); return; }
  if(S.carrying){ toast('Erst den Karton abstellen.','bad'); return; }
  wbOpen=true; paused=true; for(const k in keys) keys[k]=false; mouseDown=false; touchAct=false;
  if(locked) document.exitPointerLock();
  if(wbAnsicht!=='bau'&&wbAnsicht!=='produkt') wbAnsicht='start';
  wbEl().classList.add('show'); wbRender();
}
function wbSchliessen(relock){
  wbOpen=false; wbEl().classList.remove('show'); paused=false; wbLoeschArm=null;
  wbSchirmZeichnen();
  if(relock) requestLock();
}
/* Schuss je Sekunde als Text */
const wbTaktText=x=>x.muster==='finale'?'5/s':WF.zahlKurz(WB_TAKT[x.takt|0])+'/s';
function wbFarbPunkt(id){ const f=farbVon(id); return `<i class="wbfp" style="background:${f.hex}" title="${f.name}"></i>`; }
function wbSterne(n){ let h=''; for(let i=1;i<=5;i++) h+=`<b class="${n>=i?'an':n>=i-0.5?'halb':''}">★</b>`; return `<span class="wbsterne">${h}</span>`; }
function wbKnopf(a,txt,o){ o=o||{}; return `<button data-a="${a}"${o.v!==undefined?` data-v="${o.v}"`:''}${o.i!==undefined?` data-i="${o.i}"`:''} class="${o.cls||''}"${o.aus?' disabled':''}${o.titel?` title="${o.titel}"`:''}>${txt}</button>`; }

/* ---------- Rendern ---------- */
function wbRender(){
  const el=wbEl(); if(!el) return;
  let h=`<div class="wbkopf"><b>WERKBANK</b><em>Eigene Marke · ${eigeneListe().length}/${WIRT.werkbank.slots} Batterien</em><span>${eur(S.money)}</span>${wbKnopf('zu','Schließen',{cls:'ghost'})}</div><div class="wbkoerper">`;
  if(wbAnsicht==='bau'&&wbE) h+=wbBauHtml();
  else if(wbAnsicht==='produkt'&&wbE) h+=wbProduktHtml();
  else h+=wbStartHtml();
  h+='</div>';
  el.querySelector('.wbcard').innerHTML=h;
  if(wbAnsicht==='produkt') wbVerpackungZeichnen();
}
/* Startseite: die fuenf Plaetze, Groessen und Stufen */
function wbStartHtml(){
  const L=eigeneListe(), W=WIRT.werkbank;
  let h=`<p class="wbtipp">Entwirf eigene Batterien aus den Effekten, die du schon am Himmel gesehen hast (${bruchListe().length} bisher). Ein Lohnfertiger stellt sie her – ab einer Mindestmenge, gegen Vorkasse, Lieferung nach ein paar Tagen mit dem LKW. Danach verkaufst du sie wie jede Ware.</p>`;
  h+='<div class="wbplaetze">';
  for(let i=0;i<W.slots;i++){ const e=L[i];
    if(!e){ h+=`<div class="wbplatz leer"><b>Platz ${i+1}</b><small>frei</small>${wbKnopf('neu','Neue Batterie',{i})}</div>`; continue; }
    const st=W.stufen[e.stufe], u=wbUnterwegs(e), m=st.mindest, k=wbNachK[e.id]||m, se=wbSerie(e,k);
    h+=`<div class="wbplatz"><img class="wbbild" ${prodPicTag(e.id)} alt=""><div class="wbinfo"><b>${wbEsc(e.name)}</b>${wbSterne(e.sterne||0)}`+
      `<small>${st.schuss} Schuss · ${st.kal} mm · ${e.abschnitte.length} Abschnitte · Dauer ca. ${wbDauer(e)} s</small>`+
      `<small>Stückkosten ${eur(e.cost)} · dein Preis ${eur(S.prices[e.id]||e.market)} · Marktwert ${eur(marketOf(e.id))}</small>`+
      `<small>Bestand ${stockOf(e.id)} Stück${u?` · <span class="warn">${u} Karton${u===1?'':'s'} in Fertigung (${(e.serien||[]).map(s=>s.rest+' Tag'+(s.rest===1?'':'e')).join(', ')})</span>`:''}</small></div>`+
      `<div class="wbaktion"><div class="wbstep">${wbKnopf('nk-','−',{v:e.id,aus:k<=m})}<span>${k} Kartons · ${se.stueck} Stück</span>${wbKnopf('nk+','+',{v:e.id})}</div>`+
      `${wbKnopf('nach',`Nachfertigen · ${eur(se.preis)}${se.rabatt?` (−${WF.prozent(se.rabatt)} %)`:''}`,{v:e.id,aus:verfuegbar()<se.preis})}`+
      `<div class="wbzeile">${wbKnopf('vor','Vorschau',{v:e.id,cls:'ghost'})}${wbKnopf('kopie','Als Vorlage',{v:e.id,cls:'ghost',aus:L.length>=W.slots})}${wbKnopf('weg',wbLoeschArm===e.id?'Wirklich löschen?':'Löschen',{v:e.id,cls:wbLoeschArm===e.id?'red':'ghost',aus:!!u})}</div></div></div>`;
  }
  h+='</div><div class="wbkopfzeile">Größen</div><div class="wbstufen">';
  W.stufen.forEach((st,i)=>{ const u=UPGRADES.find(x=>x.id===st.up), offen=wbStufeOffen(i), gekauft=!!S.up[st.up];
    const zu=!gekauft?(S.level<st.lvl?`ab Level ${st.lvl}`:u&&u.req&&!S.up[u.req]?`erst Stufe ${i}`:''):(S.level<st.lvl?`ab Level ${st.lvl}`:'');
    h+=`<div class="wbstufe${offen?' an':''}"><b>${st.schuss} Schuss</b><small>${WB_STUFEN[i].name} · ${st.kal} mm · ${wbBox(i)} je Karton</small>`+
      `<small>Entwicklung ab ${eur(st.entwicklung)} · Serie ab ${st.mindest} Kartons · ${st.liefertage} Tage</small>`+
      (offen?'<small class="ok">freigeschaltet</small>':gekauft?`<small class="warn">${zu}</small>`:zu?`<small class="warn">${zu}</small>`:
        wbKnopf('stufe',`Freischalten · ${eur(u.cost())}`,{v:st.up,aus:S.money<u.cost()}))+'</div>'; });
  h+='</div>';
  return h;
}
/* Bauprogramm */
function wbBauHtml(){
  const e=wbE, st=wbStufe(e.stufe), rest=wbRest(e), b=wbBewertung(e), A=e.abschnitte;
  if(wbSel>=A.length) wbSel=A.length-1;
  const x=A[wbSel];
  let h='<div class="wbleiste">';
  WIRT.werkbank.stufen.forEach((s,i)=>{ const an=wbStufeOffen(i);
    h+=wbKnopf('gr',`${s.schuss} Schuss`,{v:i,cls:i===e.stufe?'on':'',aus:!an,titel:an?WB_STUFEN[i].name:`ab Level ${s.lvl} und Stufe ${i+1} der Werkbank`}); });
  h+='</div>';
  /* Kennzahlen live */
  const voll=wbSchuss(e)/st.schuss;
  h+=`<div class="wbkenn"><div><small>Schuss</small><b class="${rest===0?'ok':'warn'}">${wbSchuss(e)} / ${st.schuss}</b><small>${rest>0?`noch ${rest} frei`:rest<0?`${-rest} zu viel`:'alle Rohre belegt'}</small></div>`+
    `<div><small>Dauer</small><b>ca. ${wbDauer(e)} s</b><small>${A.length} Abschnitte</small></div>`+
    `<div><small>Bewertung</small>${wbSterne(b.sterne)}<small>Effekt ${WF.prozent(b.effekt)} · Abwechslung ${WF.prozent(b.abwechslung)} · Ablauf ${WF.prozent(b.ablauf)}</small></div>`+
    `<div><small>Stückkosten</small><b>${eur(wbStueckkosten(e))}</b><small>Marktwert ${eur(wbMarkt(e,b))}</small></div></div>`;
  h+=`<div class="wbvoll"><i style="width:${Math.min(100,Math.round(voll*100))}%"></i></div>`;
  /* Zeitleiste */
  h+='<div class="wbzeit">'+A.map((y,i)=>{ const fa=farbVon(y.A).hex, fb=farbVon(y.B).hex;
    return `<button data-a="sel" data-i="${i}" class="${i===wbSel?'on':''}" style="flex:${Math.max(1,y.n|0)} 1 0;background:linear-gradient(90deg,${fa},${fb})"><span>${i+1}</span></button>`; }).join('')+
    (rest>0?`<i class="wbrest" style="flex:${rest} 1 0"></i>`:'')+'</div>';
  /* Abschnitte */
  h+='<div class="wbabschnitte">'+A.map((y,i)=>{ const f=wbEffekt(y.e)||{name:y.e};
    return `<div class="wbab${i===wbSel?' on':''}" data-a="sel" data-i="${i}"><b>${i+1}</b>${wbFarbPunkt(y.A)}${wbFarbPunkt(y.B)}<span>${f.name} · ${y.n|0} Schuss · ${wbTaktText(y)} · ${WB_MUSTER[y.muster].name}${y.pause?` · Pause ${WF.zahlKurz(y.pause)} s`:''}${wbLastFaktor(y)<0.99?` · <span class="warn" title="Leuchtlast: so dicht und schwer, dass die Brüche etwas kleiner ausfallen (Leistung)">Brüche −${WF.prozent(1-wbLastFaktor(y))} %</span>`:''}</span>`+
      `<em>${wbKnopf('auf','▲',{i,aus:i===0,titel:'nach vorn'})}${wbKnopf('ab','▼',{i,aus:i===A.length-1,titel:'nach hinten'})}${wbKnopf('dup','⧉',{i,aus:A.length>=WB_MAX_ABSCHNITTE,titel:'kopieren'})}${wbKnopf('del','✕',{i,aus:A.length<=1,titel:'löschen'})}</em></div>`; }).join('')+
    `<div class="wbab neu">${wbKnopf('plus','+ Abschnitt',{aus:A.length>=WB_MAX_ABSCHNITTE})}</div></div>`;
  /* Editor des gewaehlten Abschnitts */
  const chips=(f,liste,akt)=>liste.map(([v,t])=>wbKnopf('set',t,{v:f+':'+v,cls:String(akt)===String(v)?'on':''})).join('');
  const eff=bruchListe(), zu=BRUCH_IDS.length+Object.keys(WB_LICHT).length-eff.length;
  const effKnopf=k=>{ const f=wbEffekt(k); return wbKnopf('set',`${f.name} <i class="wbkl">${'●'.repeat(f.klasse)}${'○'.repeat(4-f.klasse)}</i>`,{v:'e:'+k,cls:x.e===k?'on':'',titel:f.desc}); };
  h+=`<div class="wbedit"><div class="wbkopfzeile">Abschnitt ${wbSel+1}</div>`;
  h+=`<div class="wbfeld"><label>Effekt <small>${(wbEffekt(x.e)||{desc:''}).desc}</small></label><div class="wbwahl">`+
    (eff.filter(k=>k.indexOf('licht:')<0).map(effKnopf).join('')||'<small class="warn">Noch kein Bruchbild gesehen.</small>')+'</div>'+
    (eff.some(k=>k.indexOf('licht:')===0)?`<label class="wbunter">Lichter aus dem Rohr</label><div class="wbwahl">${eff.filter(k=>k.indexOf('licht:')===0).map(effKnopf).join('')}</div>`:'')+
    (zu?`<small class="wbhinweis">${zu} weitere Effekte hast du noch nicht gesehen – zünde neue Ware auf dem Testfeld, dann kannst du sie hier verbauen.</small>`:'')+'</div>';
  h+=`<div class="wbfeld"><label>Schuss in diesem Abschnitt</label><div class="wbstep">${wbKnopf('n','−5',{v:-5})}${wbKnopf('n','−1',{v:-1})}<b>${x.n|0}</b>${wbKnopf('n','+1',{v:1})}${wbKnopf('n','+5',{v:5})}${wbKnopf('n','Rest',{v:'rest',aus:rest<=0})}</div></div>`;
  const farben=f=>WB_FARBEN.map(c=>`<button data-a="set" data-v="${f}:${c.id}" class="wbfarbe${x[f]===c.id?' on':''}" style="background:${c.hex}" title="${c.name}"></button>`).join('');
  h+=`<div class="wbfeld wbzwei"><div><label>Farbe 1</label><div class="wbfarben">${farben('A')}</div></div><div><label>Farbe 2</label><div class="wbfarben">${farben('B')}</div></div></div>`;
  h+=`<div class="wbfeld"><label>Abfolge</label><div class="wbwahl">${chips('muster',Object.keys(WB_MUSTER).map(k=>[k,WB_MUSTER[k].name]),x.muster)}</div></div>`;
  h+=`<div class="wbfeld wbzwei"><div><label>Takt</label><div class="wbwahl">${x.muster==='finale'?'<small>Finale: so schnell die Zündschnur erlaubt (5 Schuss je Sekunde)</small>':chips('takt',WB_TAKT.map((t,i)=>[i,WF.zahlKurz(t)+' Schuss/s']),x.takt|0)}</div></div>`+
    `<div><label>Pause danach</label><div class="wbwahl">${chips('pause',WB_PAUSE.map(p=>[p,p?WF.zahlKurz(p)+' s':'keine']),x.pause||0)}</div></div></div>`;
  h+=`<div class="wbfeld wbzwei"><div><label>Höhe</label><div class="wbwahl">${chips('hoehe',WB_HOEHE.map((t,i)=>[i,t]),x.hoehe|0)}</div></div>`+
    `<div><label>Kaliber</label><div class="wbwahl">${chips('kal',WB_KAL.map((t,i)=>[i,t]),x.kal|0)}</div></div></div>`;
  h+='</div>';
  const m=wbMangel(e);
  h+=`<div class="wbfuss"><small class="${m?'warn':'ok'}">${m||(b.finale?'Bereit: Vorschau ansehen oder weiter zu Name und Serie.':'Bereit. Tipp: ein schneller letzter Abschnitt (Finale) hebt die Bewertung.')}</small>`+
    `<div class="btns">${wbKnopf('start','Zurück',{cls:'ghost'})}${wbKnopf('vorschau','Vorschau zünden',{cls:'ghost',aus:!!m})}${wbKnopf('weiter','Weiter: Name & Serie',{aus:!!m})}</div></div>`;
  return h;
}
/* Name, Verpackung, Kalkulation, Serie */
function wbProduktHtml(){
  const e=wbE, W=WIRT.werkbank, st=wbStufe(e.stufe), b=wbBewertung(e), cost=wbStueckkosten(e), markt=wbMarkt(e,b), entw=wbEntwicklung(e);
  const mind=W.stufen[e.stufe].mindest; if(wbKartons<mind) wbKartons=mind; if(!(wbPreis>0)) wbPreis=markt;
  const tmp={stufe:e.stufe,cost}, se=wbSerie(tmp,wbKartons), db=r2(wbPreis-cost), be=db>0?Math.ceil(entw/db):null, summe=r2(entw+se.preis);
  const r=wbPreis/markt, tol=priceTol(), ampel=r<=tol?['ok','Kunden greifen gern zu']:r<=tol+WIRT.kunden.preisAmpel.einige?['warn','Einige zögern']:['no','Viele lassen es liegen'];
  const nach=wbGewicht(e,b), nachTxt=nach>=W.stufen[e.stufe].gewicht*1.1?'hoch':nach>=W.stufen[e.stufe].gewicht*0.85?'mittel':'niedrig';
  let h=`<div class="wbprodukt"><div class="wbpack"><canvas id="wbPack" width="300" height="420"></canvas><small>So kommt sie ins Regal: dein Name, das Markenfeld deines Ladens, die Farben der ersten Abschnitte.</small></div><div class="wbrechnung">`;
  h+=`<div class="wbfeld"><label>Name der Batterie (kommt auf die Verpackung)</label><input id="wbName" maxlength="22" placeholder="z. B. Nordlicht" value="${wbEsc(e.name)}"></div>`;
  h+=`<div class="wbfeld"><label>Bewertung</label>${wbSterne(b.sterne)} <small>Effektwert ${WF.prozent(b.effekt)} %, Abwechslung ${WF.prozent(b.abwechslung)} %, Ablauf ${WF.prozent(b.ablauf)} %${b.finale?'':' · ohne Finale am Ende'}${b.steigerung?' · steigert sich':''} · Nachfrage ${nachTxt}</small></div>`;
  const zeile=(k,v,cls)=>`<div class="wbwert${cls?' '+cls:''}"><span>${k}</span><b>${v}</b></div>`;
  h+=zeile('Stückkosten (Lohnfertiger)',eur(cost))+zeile('Marktwert – das erwarten Kunden',eur(markt));
  h+=`<div class="wbwert"><span>Dein Verkaufspreis</span><input id="wbPreis" type="number" step="0.5" min="0" value="${wbPreis.toFixed(2)}"></div>`;
  h+=`<small class="${ampel[0]}">${ampel[1]}</small>`;
  h+=zeile('Deckungsbeitrag je Stück',eur(db),db>0?'':'no');
  h+=zeile('Entwicklung (einmalig: Muster, Prüfung, Druck)',eur(entw));
  h+=zeile('Break-even',be?`nach ${be} verkauften Stück`:'nie – Preis unter den Stückkosten',be?'':'no');
  h+=`<div class="wbwert"><span>Erste Serie</span><div class="wbstep">${wbKnopf('k-','−',{aus:wbKartons<=mind})}<b>${wbKartons} Kartons</b>${wbKnopf('k+','+')}</div></div>`;
  h+=`<small>${se.stueck} Stück (${st.box} je Karton) · Mindestmenge ${mind} Kartons · ab ${W.rabatt[0].ab}× ${WF.prozent(W.rabatt[0].d)} %, ab ${W.rabatt[1].ab}× ${WF.prozent(W.rabatt[1].d)} % Rabatt · Lieferung in ${se.tage} Tagen</small>`;
  h+=zeile('Serie (Vorkasse)',eur(se.preis)+(se.rabatt?` (−${WF.prozent(se.rabatt)} %)`:''));
  h+=zeile('Jetzt zu zahlen',eur(summe),'gross');
  h+=`<small>Gebundenes Kapital: ${eur(se.preis)} liegen als Ware im Lager, bis sie verkauft ist. Erlös, wenn alles zu deinem Preis weggeht: ${eur(r2(se.stueck*wbPreis))}.</small>`;
  const voll=eigeneListe().length>=W.slots;
  h+=`<div class="wbfuss"><small class="warn" id="wbFehler">${voll?`Alle ${W.slots} Plätze belegt – lösche erst eine Batterie.`:S.money<summe?`Dir fehlen ${eur(r2(summe-S.money))}.`:''}</small>`+
    `<div class="btns">${wbKnopf('bau','Zurück zum Bauprogramm',{cls:'ghost'})}${wbKnopf('entwickeln','Entwickeln und Serie bestellen',{aus:voll||S.money<summe})}</div></div>`;
  h+='</div></div>';
  return h;
}
function wbVerpackungZeichnen(){
  const c=$('wbPack'); if(!c||!wbE) return; const g=c.getContext('2d'), st=wbStufe(wbE.stufe);
  const art=wbArt(Object.assign({},wbE,{name:wbE.name||'Dein Name'})), x0=wbE.abschnitte[0]||{e:'kugel'}, f=wbEffekt(x0.e)||{};
  const stil=fotoStil('x '+(f.name||'')+' '+x0.e);
  hausmarkeFront(g,c.width,c.height,art,{schuss:st.schuss,dauer:wbDauer(wbE),hoehe:st.hoeheM,kal:st.kal},zufallAus(hashStr('wb'+(wbE.name||''))),stil);
}

/* ---------- Bedienung ---------- */
function wbKlick(ev){
  const b=ev.target.closest('[data-a]'); if(!b||b.disabled) return; ev.stopPropagation();
  const a=b.dataset.a, v=b.dataset.v, i=b.dataset.i!==undefined?+b.dataset.i:-1;
  sfx.pop&&sfx.pop();
  if(a==='zu'){ wbSchliessen(true); return; }
  if(a==='start'){ wbAnsicht='start'; wbE=null; }
  else if(a==='neu'){ const st=WIRT.werkbank.stufen.map((s,k)=>k).filter(wbStufeOffen).pop(); wbE=wbEntwurfNeu(st===undefined?0:st); wbSel=0; wbAnsicht='bau'; wbKartons=0; wbPreis=0; }
  else if(a==='kopie'){ const e=eigeneListe().find(x=>x.id===v); if(e){ wbE=wbKopie(e); wbE.name=''; wbSel=0; wbAnsicht='bau'; wbKartons=0; wbPreis=0; } }
  else if(a==='gr'){ const k=+v; if(wbStufeOffen(k)) wbStufeWechsel(k); }
  else if(a==='sel'){ wbSel=i; }
  else if(a==='auf'&&i>0){ const A=wbE.abschnitte; [A[i-1],A[i]]=[A[i],A[i-1]]; wbSel=i-1; }
  else if(a==='ab'&&i<wbE.abschnitte.length-1){ const A=wbE.abschnitte; [A[i+1],A[i]]=[A[i],A[i+1]]; wbSel=i+1; }
  else if(a==='dup'){ const A=wbE.abschnitte; if(A.length<WB_MAX_ABSCHNITTE){ A.splice(i+1,0,Object.assign({},A[i])); wbSel=i+1; } }
  else if(a==='del'){ const A=wbE.abschnitte; if(A.length>1){ A.splice(i,1); wbSel=Math.max(0,Math.min(wbSel,A.length-1)); } }
  else if(a==='plus'){ const A=wbE.abschnitte, r=Math.max(1,wbRest(wbE)); if(A.length<WB_MAX_ABSCHNITTE){ A.push(wbAbschnitt({e:A[A.length-1].e,A:A[A.length-1].A,B:A[A.length-1].B,n:r})); wbSel=A.length-1; } }
  else if(a==='n'){ const x=wbE.abschnitte[wbSel]; if(v==='rest') x.n=(x.n|0)+Math.max(0,wbRest(wbE)); else x.n=Math.max(1,(x.n|0)+(+v)); }
  else if(a==='set'){ const x=wbE.abschnitte[wbSel], k=v.indexOf(':'), f=v.slice(0,k), w=v.slice(k+1);
    if(f==='e'){ if(bruchOffen(w)) x.e=w; } else if(f==='A'||f==='B'||f==='muster') x[f]=w; else x[f]=+w; }
  else if(a==='vorschau'){ wbVorschauStart(wbE); return; }
  else if(a==='vor'){ const e=eigeneListe().find(x=>x.id===v); if(e) wbVorschauStart(e,e.id); return; }
  else if(a==='weiter'){ if(!wbMangel(wbE)) wbAnsicht='produkt'; }
  else if(a==='bau'){ wbNameLesen(); wbAnsicht='bau'; }
  else if(a==='k-'){ wbKartons=Math.max(WIRT.werkbank.stufen[wbE.stufe].mindest,wbKartons-wbSchrittK(wbE.stufe)); }
  else if(a==='k+'){ wbKartons+=wbSchrittK(wbE.stufe); }
  else if(a==='entwickeln'){ wbNameLesen(); wbPreisLesen(); const r=wbEntwickeln(wbE,wbKartons,wbPreis);
    if(!r.ok){ const f=$('wbFehler'); if(f) f.textContent=r.grund; toast(r.grund,'bad'); return; }
    sfx.cash&&sfx.cash(); toast(`${r.e.name} ist entwickelt. ${r.serie.kartons} Kartons kommen in ${r.serie.tage} Tagen mit dem LKW.`,'money');
    wbE=null; wbAnsicht='start'; }
  else if(a==='nk-'||a==='nk+'){ const e=eigeneListe().find(x=>x.id===v); if(e){ const m=WIRT.werkbank.stufen[e.stufe].mindest; wbNachK[v]=Math.max(m,(wbNachK[v]||m)+(a==='nk+'?1:-1)*wbSchrittK(e.stufe)); } }
  else if(a==='nach'){ const e=eigeneListe().find(x=>x.id===v); if(e){ const r=wbNachbestellen(v,wbNachK[v]||WIRT.werkbank.stufen[e.stufe].mindest);
    if(r.ok){ sfx.cash&&sfx.cash(); toast(`${e.name}: ${r.serie.kartons} Kartons in Fertigung, Lieferung in ${r.serie.tage} Tagen.`,'money'); } else toast(r.grund,'bad'); } }
  else if(a==='weg'){ if(wbLoeschArm!==v){ wbLoeschArm=v; } else { const r=wbLoeschen(v); wbLoeschArm=null; if(!r.ok&&r.grund) toast(r.grund,'bad'); else toast('Gelöscht. Was noch im Laden liegt, bleibt verkaufbar.'); } }
  else if(a==='stufe'){ buyUp(v); }
  if(a!=='weg') wbLoeschArm=null;
  wbRender();
}
/* Mindestmenge als Schritt (eine Serie mehr) */
function wbSchrittK(stufe){ return Math.max(1,Math.round(WIRT.werkbank.stufen[stufe].mindest/2)); }
function wbNameLesen(){ const i=$('wbName'); if(i&&wbE) wbE.name=i.value.slice(0,22); }
function wbPreisLesen(){ const i=$('wbPreis'); if(i){ const v=parseFloat(String(i.value).replace(',','.')); if(v>0) wbPreis=r2(v); } }
/* Groesse wechseln: Abschnitte anteilig auf die neue Schusszahl strecken */
function wbStufeWechsel(k){
  const e=wbE, alt=Math.max(1,wbSchuss(e)), N=WIRT.werkbank.stufen[k].schuss; e.stufe=k;
  let s=0; e.abschnitte.forEach(x=>{ x.n=Math.max(1,Math.round((x.n|0)*N/alt)); s+=x.n; });
  const L=e.abschnitte[e.abschnitte.length-1]; L.n=Math.max(1,L.n+N-s); wbKartons=0; wbPreis=0;
}
function wbEingabe(ev){
  if(ev.target.id==='wbName'){ wbNameLesen(); wbVerpackungZeichnen(); }
  else if(ev.target.id==='wbPreis'){ wbPreisLesen(); }
}
function wbAenderung(ev){ if(ev.target.id==='wbPreis'){ wbPreisLesen(); wbRender(); } }

/* ---------- Vorschau: echte Zuendung am Testfeld, Abendlicht, eigene Kamera ---------- */
/* Zuendtisch am Testfeld neben der Moerserbatterie. Kamera erhoeht ueber dem Ladendach (Abendansicht): erst auf die Batterie,
   mit der Zuendung schwenkt sie nach oben in den Himmel (Brueche in 25-35 m), am Ende zurueck auf die rauchende Batterie */
const WB_VS={tisch:{x:4.6,z:-16.6,b:1.6},auge:[2.5,13,2.0],zielTisch:[4.6,0.9,-16.6],zielHimmel:[4.6,24,-16.6],fovTisch:48,fovHimmel:72,schwenk:1.8,vor:1.2,nach:3.0};
function wbVorschauStart(entwurf,echtId){
  if(wbVs) return;
  const m=wbMangel(entwurf); if(m){ toast(m,'bad'); return; }
  const id='proto_wb'+(++wbVsN), tmp=Object.assign(wbKopie(entwurf),{id});
  P[id]=Object.assign(wbProdukt(tmp),{proto:true,cost:0,market:0,hype:0,name:entwurf.name||'Vorschau'});
  SHOWS[id]=()=>wbShow(tmp);
  const T=WB_VS.tisch, g=new THREE.Group(); g.userData.bauteil='werkbankVorschau'; scene.add(g); abTischBau(g,T.x,T.z,T.b);
  const pl0=abPlatz('tisch',T.x,0.93,T.z,{ry:Math.PI,ort:'vorschau'});
  const h=abAufstellen(pl0,id);
  /* Zeitgeber, die vor der Vorschau schon liefen: alles danach Geplante gehoert zur Vorschau (Spiel steht still) */
  wbVs={id,g,pl:pl0,h,t:0,ende:Infinity,name:P[id].name,alt:{x:pl.x,z:pl.z,yaw,pitch,fov:camera.fov},offen:wbOpen,zurueck:wbAnsicht,vorher:new Set(timers)};
  if(wbOpen){ wbEl().classList.remove('show'); wbOpen=false; }
  paused=false; document.body.classList.add('wbvs');
  pl.x=WB_VS.auge[0]; pl.z=WB_VS.auge[2];
  lastF=-1; applyTOD(); if(typeof updateSonne==='function') updateSonne(T.x,T.z);
  wbVsKamera();
  later(WB_VS.vor,()=>{ if(!wbVs||wbVs.id!==id) return; const z=abZuenden(pl0,id,h,{fertig:()=>{ if(wbVs&&wbVs.id===id) abWeg(h); }}); wbVs.ende=wbVs.t+z.dauer+WB_VS.nach; wbVs.dauer=z.dauer; });
  wbVsLeiste();
}
function wbVsKamera(){ const a=WB_VS.auge, A=WB_VS.zielTisch, B=WB_VS.zielHimmel, t=wbVs?wbVs.t:0, v=WB_VS.vor+0.6;
  const ein=clamp((t-v)/WB_VS.schwenk,0,1), aus=wbVs&&wbVs.ende<Infinity?clamp((wbVs.ende-1.6-t)/WB_VS.schwenk,0,1):1, u=Math.min(ein,aus), k=u*u*(3-2*u);
  camera.position.set(a[0],a[1],a[2]); camera.fov=WB_VS.fovTisch+(WB_VS.fovHimmel-WB_VS.fovTisch)*k; camera.updateProjectionMatrix();
  camera.lookAt(A[0]+(B[0]-A[0])*k,A[1]+(B[1]-A[1])*k,A[2]+(B[2]-A[2])*k); camera.updateMatrixWorld(); }
/* Ein Schritt waehrend der Vorschau (statt step, 20-loop): nur Zeitgeber, Feuerwerk, Schnee und Licht - Kunden,
   Personal und Uhr stehen */
function wbVsStep(dt){
  if(!wbVs) return;
  wbVs.t+=dt;
  timerTakt(dt);
  updateFireworks(dt); updateSnow(dt); applyTOD();
  wbVsKamera();
  if(wbVs.t>=wbVs.ende) wbVorschauEnde();
  else if(((wbVs.t*4)|0)!==((wbVs.t*4-dt*4)|0)) wbVsLeiste();
}
function wbVsLeiste(){
  let el=$('wbVsBar'); if(!el){ el=document.createElement('div'); el.id='wbVsBar'; document.body.appendChild(el);
    el.addEventListener('click',e=>{ if(e.target.closest('button')){ e.stopPropagation(); wbVorschauEnde(true); } }); }
  if(!wbVs){ el.remove(); return; }
  const rest=wbVs.ende<Infinity?Math.max(0,Math.ceil(wbVs.ende-wbVs.t)):null;
  el.innerHTML=`<b>VORSCHAU</b><span>${wbEsc(wbVs.name)}</span><span>${rest===null?'Zündschnur brennt …':`noch ${rest} s`}</span><button>Beenden</button>`;
}
function wbVorschauEnde(abbruch){
  if(!wbVs) return; const V=wbVs; wbVs=null;
  /* was die Vorschau noch geplant hat (Schuesse, Nachrauch), faellt weg - das Probestueck ist gleich nicht mehr im Katalog */
  for(let i=timers.length-1;i>=0;i--) if(!V.vorher.has(timers[i])) timers.splice(i,1);
  if(abbruch){
    for(const ps of [psHuge,psBig,psMid,psSmall]) if(ps) for(let i=0;i<ps.max;i++) if(ps.life[i]>0) ps.life[i]=1e-4;
    rockets.length=0; emitters.length=0; if(typeof sfxSchnitt==='function') sfxSchnitt(); }
  abWeg(V.h); scene.remove(V.g); V.g.traverse(o=>{ if(o.geometry) o.geometry.dispose(); });
  abProtoWeg(V.id);
  pl.x=V.alt.x; pl.z=V.alt.z; yaw=V.alt.yaw; pitch=V.alt.pitch; camera.fov=V.alt.fov; camera.updateProjectionMatrix();
  document.body.classList.remove('wbvs'); wbVsLeiste();
  lastF=-1; applyTOD();
  if(V.offen){ wbAnsicht=V.zurueck; wbOeffnen(); }
}
/* Tasten: Esc schliesst die Werkbank bzw. beendet die Vorschau */
function wbTaste(e){
  if(wbVs){ if(e.code==='Escape'||e.code==='KeyB'){ wbVorschauEnde(true); } return true; }
  if(!wbOpen) return false;
  if(e.code==='Escape'){ if(document.activeElement&&document.activeElement.tagName==='INPUT') document.activeElement.blur(); else wbSchliessen(false); }
  return true;   /* solange die Werkbank offen ist, gehoeren alle Tasten ihr (Eingabefelder tippen normal) */
}
(function(){ const el=$('werkbank'); if(!el) return; el.addEventListener('click',wbKlick); el.addEventListener('input',wbEingabe); el.addEventListener('change',wbAenderung); })();

/* ---------- Bestellmenue (Laptop/Lager-PC/Tablet, Reiter "Eigene Marke"): Nachfertigen wie an der Werkbank ---------- */
function wbBestellHtml(){
  const L=eigeneListe();
  if(!L.length) return `<div class="row"><div class="rm"><b>Noch keine eigene Batterie</b><small>Entwürfe entstehen an der Werkbank im Lager. Hier kannst du danach nachfertigen lassen.</small></div></div>`;
  return `<div class="karten">`+L.map(e=>{ const st=WIRT.werkbank.stufen[e.stufe], m=st.mindest, se=wbSerie(e,m), u=wbUnterwegs(e);
    return `<div class="karte"><img class="kbild" ${prodPicTag(e.id)} alt=""><b>${wbEsc(e.name)} <span class="pill">eigene Marke</span></b>`+
      `<small>${st.schuss} Schuss · Stückkosten ${eur(e.cost)} · Bestand ${stockOf(e.id)}${u?` · ${u} Kartons in Fertigung`:''}</small>`+
      `<small>Mindestmenge ${m} Kartons (${se.stueck} Stück) · Lieferung in ${se.tage} Tagen · Vorkasse</small>`+
      `<div class="kpreis">${eur(se.preis)}</div><div class="steps"><button data-a="wbnach" data-t="${e.id}"${verfuegbar()<se.preis?' disabled':''}>Serie fertigen</button></div></div>`; }).join('')+`</div>`;
}
