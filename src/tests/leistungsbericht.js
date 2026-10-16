/* Leistungsbericht im Spiel (Fundament Schritt 5, src/parts/17g-leistung.js).
   Prueft: die Route laeuft ueber die echte Spielschleife durch und der Bericht hat alle Orte mit Messwerten; Stufenwechsel
   wird zurueckgenommen; der Spielstand (localStorage) bleibt unveraendert - auch wenn waehrenddessen und danach gespeichert
   werden soll; Abbruch liefert ein Teilergebnis; Tabelle und "Kopieren" (Zwischenablage und Markier-Ausweichweg);
   Handy-Ansicht (390x844) ist bedienbar; die Pause-Seite zeigt alles an. Kurze Zeiten (2 s je Ort), die Route ist dieselbe.
   Aufruf: BB_LOCK=/tmp/bb-testlock-f sh tools/test/lauf.sh leistungsbericht   (im Arbeitsordner mit real.html)
   HANDY=1 = Handy-Ansicht; GEGENPROBE=1 = Sperre wird absichtlich ausgehebelt, der Test MUSS dann "Spielstand veraendert" melden;
   VOLL=1 = zusaetzlich eine Messung im Vollausbau (Gameplay-Vorfuehrung, braucht viel Speicher und Zeit); NUR_VOLL=1 = nur diese; ALLE=1 = zusaetzlich Lauf ueber alle 6 Stufen. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const HANDY=process.env.HANDY==='1', GEGEN=process.env.GEGENPROBE==='1', VOLL=process.env.VOLL==='1', NUR_VOLL=process.env.NUR_VOLL==='1', ALLE=process.env.ALLE==='1';
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const H=require('../../tools/test/start-hilfe.js');
  const ctx=await b.newContext(HANDY?{isMobile:true,hasTouch:true,viewport:{width:390,height:844}}:{viewport:{width:640,height:420}});
  try{ await ctx.grantPermissions(['clipboard-read','clipboard-write']); }catch(e){}
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  const mangel=[]; const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  /* ---- Vollausbau (optional, schwer): eigener frischer Start, damit kein Spielstand mit allen Ausbauten mitgebaut wird ---- */
  const voll=async()=>{
    await p.evaluate(()=>localStorage.clear()); await H.neuladen(p);
    await H.neuesSpiel(p,{stoppen:true});      /* Spielschleife aus: der Aufbau und die Messung werden von hier getrieben (swiftshader ist zu langsam fuer den rAF-Aufbau) */
    await p.evaluate(()=>{ window.__bb.gpStart(); });
    const v0=await p.evaluate(()=>localStorage.getItem('boellerbude_v3'));   /* gpStart hat den Stand eben gesichert */
    const tb=Date.now(); for(let k=0;;k++){ const fertig=await p.evaluate(()=>{ const bb=window.__bb, t0=performance.now(); while(performance.now()-t0<15000&&!bb.gpFertig) bb.gpBauSchritt(50); return bb.gpFertig; }); if(k%4===0) console.log('[voll] Aufbau '+Math.round((Date.now()-tb)/1000)+' s, fertig='+fertig); if(fertig) break; }
    await p.evaluate(()=>{ window.__bb.lmStart({modus:'voll',dauer:2,feuer:3,einschwing:0.5,stufen:['niedrig']}); });
    console.log('[voll] Aufbau fertig, Messung startet'); const tm=Date.now();
    for(let k=0;;k++){ const an=await p.evaluate(()=>{ const bb=window.__bb, t0=performance.now(); while(performance.now()-t0<15000&&bb.LM.an) bb.lmTakt(); return bb.LM.an; }); if(k%2===0) console.log('[voll] Messung '+Math.round((Date.now()-tm)/1000)+' s'); if(!an) break; }
    const v=await p.evaluate(()=>{ const bb=window.__bb; return {B:bb.LM.bericht,key:localStorage.getItem('boellerbude_v3'),gp:bb.gpAn}; });
    console.log('VOLL: Orte',v.B.laeufe[0].orte.map(o=>o.name+':'+(o.fps||o.fehlt)).join(' '),'| Texturen MB',v.B.vorfuehrungTex&&v.B.vorfuehrungTex.mb,'| Heap',v.B.heapVor,v.B.heapNachAufbau);
    pruef('VOLL-ORTE',v.B.laeufe[0].orte.length===9&&v.B.laeufe[0].orte.every(o=>!o.fehlt),'Vollausbau: Orte fehlen');
    pruef('VOLL-SPIELSTAND',v.key===v0&&v.gp===true,'Spielstand im Vollausbau veraendert');
  };
  await H.laden(p,process.argv[2]);
  if(NUR_VOLL){ await voll(); console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine'); console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine'); if(!mangel.length&&!errs.length) console.log('ALLES OK'); await b.close(); return; }
  await p.evaluate(()=>localStorage.clear());
  await H.neuladen(p);
  await H.neuesSpiel(p);          /* Spielschleife laeuft - die Haken in frame() werden mitgeprueft */
  /* alles gebaut, damit die ganze Route vorkommt (wie src/tests/waechter.js) */
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=99; for(const u of bb.UPGRADES) bb.S.up[u.id]=true; try{ bb.applyZonen(); }catch(e){} bb.save(); });
  const vor=await p.evaluate(()=>{ const bb=window.__bb; return {key:localStorage.getItem('boellerbude_v3'),gfx:bb.GFX,pos:bb.playerPos(),yaw:bb.camYaw(),pitch:bb.camPitch(),clock:bb.clock,money:bb.S.money,wahl:bb.GFX_WAHL}; });
  pruef('SPIELSTAND-DA',!!vor.key,'kein Spielstand vor der Messung');

  /* ---- Seite im Pausenmenue ---- */
  await p.evaluate(()=>window.__bb.showPause());
  await p.click('#pHaupt [data-pseite="pLeistung"]');
  const seite=await p.evaluate(()=>{ const q=id=>document.getElementById(id); const sicht=e=>!!e&&e.offsetParent!==null;
    return {seite:q('pLeistung').classList.contains('on'),go:sicht(q('lmGo')),voll:sicht(q('lmGoVoll')),alle:sicht(q('lmAlle')),dauer:q('lmDauer').textContent,ergebnisDa:!q('lmErgebnis').hidden}; });
  pruef('SEITE',seite.seite&&seite.go&&seite.voll&&seite.alle&&/Min/.test(seite.dauer)&&!seite.ergebnisDa,'Leistungs-Seite unvollstaendig: '+JSON.stringify(seite));

  /* ---- Messung ueber den Knopf (Spielstand-Modus, mit zwei Stufen) ---- */
  const t0=Date.now();
  await p.evaluate(()=>{ const bb=window.__bb; window.__lmSave=0;
    bb.lmStart({modus:'spiel',dauer:2,feuer:3,einschwing:0.5,stufen:['niedrig','mittel']}); });
  const mitten=await p.evaluate(()=>{ const bb=window.__bb; return {an:bb.LM.an,ov:getComputedStyle(document.getElementById('lmOv')).display,pause:bb.pauseOpen,zeile:document.getElementById('lmZeile').textContent}; });
  pruef('LAEUFT',mitten.an&&mitten.ov==='block'&&!mitten.pause,'Messung startet nicht: '+JSON.stringify(mitten));
  /* waehrend der Messung speichern wollen (Autosave): darf nichts schreiben */
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.money+=777; bb.save(); });
  if(GEGEN) await p.evaluate(()=>{ window.__bb.S.money+=12345; });
  const waehrend=await p.evaluate(()=>localStorage.getItem('boellerbude_v3'));
  if(!GEGEN) pruef('SPERRE-WAEHREND',waehrend===vor.key,'save() hat waehrend der Messung geschrieben');
  /* Esc darf nicht das Pausenmenue oeffnen, sondern bricht ab - hier erst spaeter; Tasten werden verschluckt */
  await p.keyboard.press('KeyW');
  await p.waitForFunction(()=>!window.__bb.LM.an,null,{timeout:1200000,polling:1000});
  const dauer=Math.round((Date.now()-t0)/1000);
  const nach=await p.evaluate(()=>{ const bb=window.__bb, B=bb.LM.bericht;
    return {bericht:B,key:localStorage.getItem('boellerbude_v3'),gfx:bb.GFX,pos:bb.playerPos(),yaw:bb.camYaw(),pitch:bb.camPitch(),pause:bb.pauseOpen,
      seite:document.querySelector('#pause .pseite.on').id,autoReset:bb.renderer.info.autoReset,ov:getComputedStyle(document.getElementById('lmOv')).display,
      zeilen:document.querySelectorAll('#lmTab tbody tr').length,tabellen:document.querySelectorAll('#lmTab table').length,
      pBtn:document.getElementById('pBtn').textContent,halt:bb.LM.halt,text:bb.lmText(bb.LM.bericht)}; });
  const B=nach.bericht;
  console.log('Messung ('+dauer+' s) Orte je Stufe:', B.laeufe.map(l=>l.name+':'+l.orte.length).join(' '));
  const ORTE=['Laden','Kasse','Halle Süd','Lager','Hochregal','Werk','Straße','Hof','Feuerwerk'];
  pruef('STUFEN',B.laeufe.length===2&&B.laeufe[0].stufe==='niedrig'&&B.laeufe[1].stufe==='mittel','Laeufe: '+B.laeufe.map(l=>l.stufe));
  for(const l of B.laeufe){
    const namen=l.orte.map(o=>o.name);
    pruef('ORTE-'+l.stufe,JSON.stringify(namen)===JSON.stringify(ORTE),'Orte: '+namen.join(','));
    for(const o of l.orte){
      pruef('WERTE-'+l.stufe+'-'+o.name,!o.fehlt&&o.n>0&&o.fps>0&&o.tief1>0&&o.tief1<=o.fps*1.001+0.01&&o.ms>0&&o.calls>0&&o.tris>0&&o.geo>0&&o.cpu>0&&o.msMax>=o.ms-0.5,JSON.stringify(o));
    }
    pruef('TEX-'+l.stufe,l.tex&&l.tex.n>20&&l.tex.mb>1,'Texturschaetzung: '+JSON.stringify(l.tex));
  }
  /* Feuerwerk muss spuerbar mehr zeichnen als die Strasse? (nicht zwingend) - aber das Feuerwerk muss Partikel in Bewegung gebracht haben: Dreiecke > 0 reicht oben */
  const g=B.geraet; pruef('GERAET',g.gpu&&g.webgl&&g.fenster&&g.kerne,'Geraetedaten: '+JSON.stringify(g));
  pruef('TEXT',ORTE.every(n=>nach.text.includes(n))&&/GPU:/.test(nach.text)&&/Stufe Niedrig/.test(nach.text)&&/Stufe Mittel/.test(nach.text)&&/Hinweis:/.test(nach.text),'Text unvollstaendig:\n'+nach.text.slice(0,600));
  pruef('ZURUECK',nach.gfx===vor.gfx&&Math.abs(nach.pos.x-vor.pos.x)<1e-6&&Math.abs(nach.pos.z-vor.pos.z)<1e-6&&Math.abs(nach.yaw-vor.yaw)<1e-6&&Math.abs(nach.pitch-vor.pitch)<1e-6&&nach.autoReset===true&&nach.ov==='none','Zustand nicht zurueck: '+JSON.stringify({vor,nach:{gfx:nach.gfx,pos:nach.pos,yaw:nach.yaw,autoReset:nach.autoReset,ov:nach.ov}}));
  pruef('ANZEIGE',nach.pause&&nach.seite==='pLeistung'&&nach.tabellen===2&&nach.zeilen===18,'Anzeige: '+JSON.stringify({pause:nach.pause,seite:nach.seite,tab:nach.tabellen,zeilen:nach.zeilen}));
  pruef('NEULADEN-KNOPF',nach.halt&&/Neu laden/.test(nach.pBtn),'Weiterspielen-Knopf nicht umgestellt: '+nach.pBtn);
  /* Spielstand: auch ein Speichern NACH der Messung (Sichtbarkeitswechsel, Menue) darf ihn nicht veraendern */
  await p.evaluate(()=>{ window.__bb.save(); });
  const danach=await p.evaluate(()=>localStorage.getItem('boellerbude_v3'));
  /* Gegenprobe: Sperre absichtlich aushebeln und speichern - dann MUSS der Test "Spielstand geaendert" melden */
  let fin=danach;
  if(GEGEN){ await p.evaluate(()=>{ window.__bb.LM.halt=false; window.__bb.save(); }); fin=await p.evaluate(()=>localStorage.getItem('boellerbude_v3')); }
  pruef('SPIELSTAND-UNVERAENDERT',fin===vor.key&&waehrend===vor.key,'localStorage geaendert ('+(fin||'').length+' statt '+vor.key.length+' Zeichen)');
  if(GEGEN){ console.log('MANGEL:',mangel.join(' | ')||'keine');
    console.log(mangel.some(m=>/^SPIELSTAND-UNVERAENDERT/.test(m))?'GEGENPROBE OK: der Test schlaegt bei geaendertem Spielstand an':'GEGENPROBE FEHLGESCHLAGEN: Test hat die Aenderung nicht bemerkt'); await b.close(); return; }
  /* die Simulation lief wirklich (sonst waere "unveraendert" leer): Geld/Uhr im Speicher haben sich bewegt */
  const lief=await p.evaluate(v=>({money:window.__bb.S.money,clock:window.__bb.clock,v}),vor);
  pruef('SIM-LIEF',lief.clock!==vor.clock||lief.money!==vor.money,'Uhr unveraendert - lief das Spiel?');

  /* ---- Kopieren ---- */
  await p.click('#lmKopie');
  await p.waitForTimeout(400);
  const kop=await p.evaluate(async()=>{ let clip=null; try{ clip=await navigator.clipboard.readText(); }catch(e){ clip='FEHLER '+e.message; }
    const ta=document.getElementById('lmText');
    return {clip:clip&&clip.slice(0,60),clipLen:clip&&clip.length,status:document.getElementById('lmKopieStatus').textContent,taSichtbar:!ta.hidden,taLen:ta.value.length}; });
  pruef('KOPIEREN',(kop.clipLen>200&&/LEISTUNGSBERICHT/.test(kop.clip||''))||(kop.taSichtbar&&kop.taLen>200),'weder Zwischenablage noch Markierfeld: '+JSON.stringify(kop));
  pruef('KOPIER-STATUS',kop.status.length>5,'keine Rueckmeldung nach Kopieren');
  /* Ausweichweg: Zwischenablage gesperrt -> Markierfeld mit dem Text */
  await p.evaluate(()=>{ Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('gesperrt'))},configurable:true}); document.getElementById('lmText').hidden=true; });
  await p.click('#lmKopie'); await p.waitForTimeout(300);
  const aus=await p.evaluate(()=>{ const ta=document.getElementById('lmText'); return {sicht:!ta.hidden,len:ta.value.length,sel:ta.selectionEnd-ta.selectionStart,status:document.getElementById('lmKopieStatus').textContent}; });
  pruef('AUSWEICH',aus.sicht&&aus.len>200&&aus.sel===aus.len&&/markiert/.test(aus.status),'Ausweichweg: '+JSON.stringify(aus));

  /* ---- Handy / Bedienbarkeit: Knoepfe sichtbar und gross genug, keine seitliche Seitenverschiebung ---- */
  const bed=await p.evaluate(()=>{ const out={};
    for(const id of ['lmGo','lmGoVoll','lmKopie','lmZurueck','lmAlle']){ const e=document.getElementById(id); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect();
      out[id]={x:Math.round(r.left),b:Math.round(r.width),h:Math.round(r.height),innen:r.left>=-0.5&&r.right<=innerWidth+0.5}; }
    out.seite={sw:document.documentElement.scrollWidth,iw:innerWidth,karte:document.querySelector('#pause .card').scrollWidth<=document.querySelector('#pause .card').clientWidth+1};
    const t=document.querySelector('#lmTab .lmtab'); out.tab={scrollt:t.scrollWidth>t.clientWidth,breite:t.clientWidth,iw:innerWidth};
    return out; });
  for(const id of ['lmGo','lmGoVoll','lmKopie','lmZurueck','lmAlle']) pruef('BEDIENBAR-'+id,bed[id].innen&&bed[id].h>=24&&bed[id].b>=24&&(id==='lmAlle'||bed[id].h>=43),JSON.stringify(bed[id]));
  pruef('KEIN-SEITENSCROLL',bed.seite.sw<=bed.seite.iw+1&&bed.seite.karte,'Seite wird breiter als der Bildschirm: '+JSON.stringify(bed.seite));
  pruef('TABELLE-PASST',bed.tab.breite<=bed.tab.iw,'Tabellenfeld breiter als Bildschirm');

  /* ---- Abbruch: Stopp-Knopf -> Teilergebnis, alles zurueck ---- */
  await p.evaluate(()=>{ const bb=window.__bb; bb.lmStart({modus:'spiel',dauer:2,feuer:3,einschwing:0.5,stufen:['niedrig']}); });
  await p.waitForFunction(()=>window.__bb.LM.an&&window.__bb.LM.lauf&&window.__bb.LM.lauf.orte.length>=1&&window.__bb.LM.z&&window.__bb.LM.z.roh.length>=1,null,{timeout:600000,polling:500});
  const sicht=await p.evaluate(()=>{ const r=document.getElementById('lmStopp').getBoundingClientRect(); return {innen:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,h:Math.round(r.height)}; });
  pruef('STOPP-SICHTBAR',sicht.innen&&sicht.h>=40,JSON.stringify(sicht));
  await p.evaluate(()=>{ document.getElementById('lmStopp').click(); });
  const ab=await p.evaluate(()=>{ const bb=window.__bb, B=bb.LM.bericht; return {an:bb.LM.an,abbruch:B&&B.abbruch,laeufe:B&&B.laeufe.length,orte:B&&B.laeufe[0]&&B.laeufe[0].orte.length,gfx:bb.GFX,pause:bb.pauseOpen,txt:bb.lmText(B).slice(0,70)}; });
  pruef('ABBRUCH',!ab.an&&ab.abbruch&&ab.laeufe===1&&ab.pause&&ab.gfx===vor.gfx&&/ABGEBROCHEN/.test(ab.txt),JSON.stringify(ab));
  /* Esc waehrend einer Messung bricht ab statt das Pausenmenue zu oeffnen */
  await p.evaluate(()=>{ const bb=window.__bb; bb.lmStart({modus:'spiel',dauer:2,feuer:3,einschwing:0.5,stufen:['niedrig']}); });
  await p.waitForFunction(()=>window.__bb.LM.z&&window.__bb.LM.z.roh.length>=1,null,{timeout:600000,polling:500});
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  const esc=await p.evaluate(()=>({an:window.__bb.LM.an,ab:window.__bb.LM.bericht&&window.__bb.LM.bericht.abbruch}));
  pruef('ESC-BRICHT-AB',!esc.an&&esc.ab,JSON.stringify(esc));

  /* ---- "Alle Grafikstufen nacheinander" (Haken) wirklich ueber alle Stufen, ohne Ultra Low ---- */
  if(ALLE){
    await p.evaluate(()=>{ const a=document.getElementById('lmAlle'); a.checked=true; window.__bb.lmStart({modus:'spiel',alle:true,dauer:1,feuer:1,einschwing:0.3}); });
    await p.waitForFunction(()=>!window.__bb.LM.an,null,{timeout:2400000,polling:2000});
    const al=await p.evaluate(()=>{ const bb=window.__bb, B=bb.LM.bericht; return {st:B.laeufe.map(l=>l.stufe+':'+l.orte.filter(o=>o.fps>0).length+'/'+l.w+'x'+l.h),gfx:bb.GFX}; });
    console.log('ALLE:',al.st.join(' '));
    pruef('ALLE-STUFEN',al.st.length===6&&al.st[0].startsWith('niedrig')&&al.st[5].startsWith('extrem')&&al.st.every(x=>/:9\//.test(x))&&al.gfx===vor.gfx,JSON.stringify(al));
  }
  /* ---- gespeicherter Bericht ueberlebt Neuladen (Seite zeigt ihn) ---- */
  await p.evaluate(()=>{ window.__bb.LM.halt=false; });
  await H.neuladen(p);
  const gesp=await p.evaluate(()=>{ try{ const b=JSON.parse(localStorage.getItem('bb_leistung_bericht')); return {n:b.laeufe.length,v:b.version}; }catch(e){ return null; } });
  pruef('BERICHT-GESPEICHERT',gesp&&gesp.v===1,'kein Bericht nach Neuladen: '+JSON.stringify(gesp));

  if(VOLL) await voll();
  console.log('BEISPIELBERICHT:\n'+nach.text);
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  if(!mangel.length&&!errs.length&&!GEGEN) console.log('ALLES OK');
  await b.close();
})();
