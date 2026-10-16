/* Werkbank - eigene Batterien (Tom 16.10.2026, docs/werkbank/werkbank.md)
   Prueft: Werkbank im Lager (Kauf, Platz, Kollision, Ansprechen mit E), Bauprogramm je Groesse (Abschnitte, Rest,
   Dauer = Engine), Bedienung per Klick (Abschnitt dazu/kopieren/verschieben/loeschen, Effekt nur wenn gesehen),
   Vorschau ueber den Abschuss-Baustein (Rohre = Schuss, jedes Rohr einmal, Abfolge links -> rechts, kein Hype,
   Probestueck danach weg), Entwickeln (Kosten aus WIRT, Mindestmenge, Vorkasse), Lieferung nach Tagen mit dem LKW,
   Regal, Verkauf (Zaehler eigene Marke, Nachfrage am Spieltag gemessen), 5-Platz-Grenze, Loeschen -> Altbestand,
   Nachbestellen (Werkbank und Bestellmenue), Speichern/Laden, Migration alter Labor-Rezepturen, Handy-Ansicht.
   Aufruf: BB_LOCK=/tmp/bb-testlock-rw sh tools/test/lauf.sh werkbank   (im Arbeitsordner mit real.html)
   BILDER=<ordner> schreibt Bilder (Werkbank, Bauprogramm, Vorschau, Verpackung, Regal, Handy). */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'), path=require('path');
const H=require(path.join(__dirname,'../../tools/test/start-hilfe.js'));
const BILDER=process.env.BILDER||'';
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:800}}); p.setDefaultTimeout(120000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ if(m.type()==='error'&&m.text().indexOf('ERR_')<0) errs.push('CONSOLE: '+m.text()); });
  const mangel=[]; const pruef=(ok,txt)=>{ if(!ok) mangel.push(txt); };
  const bild=async(name,fn)=>{ if(!BILDER) return; fs.mkdirSync(BILDER,{recursive:true});
    const u=await p.evaluate(fn); if(u) fs.writeFileSync(path.join(BILDER,name+'.jpg'),Buffer.from(u.split(',')[1],'base64')); console.log('BILD',name); };
  const schuss=async(name,sel)=>{ if(!BILDER) return; fs.mkdirSync(BILDER,{recursive:true}); const el=sel?await p.$(sel):null;
    await (el||p).screenshot({path:path.join(BILDER,name+'.png')}); console.log('BILD',name); };
  /* Kamerabild aus Spielersicht (p = Auge, t = Ziel) */
  const blick=(v)=>{ const bb=window.__bb, cam=bb.camera, R=bb.renderer; const dx=v.t[0]-v.p[0], dz=v.t[2]-v.p[2];
    bb.setView(v.p[0],v.p[2],Math.atan2(-dx,-dz),0); if(v.zeit) bb.clock=v.zeit; bb.applyTOD();
    for(let i=0;i<3;i++){ bb.kameraSetzen(); cam.position.set(v.p[0],v.p[1],v.p[2]); cam.lookAt(v.t[0],v.t[1],v.t[2]); cam.updateMatrixWorld(); bb.renderFrame(0.05); }
    return R.domElement.toDataURL('image/jpeg',0.88); };

  await H.laden(p,process.argv[2]);
  await p.evaluate(()=>{ try{ localStorage.removeItem('boellerbude_v3'); }catch(e){} });
  await H.neuesSpiel(p,{stoppen:true});

  /* --- 1. Vor dem Kauf: kein Laptop-Reiter, keine Werkbank --- */
  const vor=await p.evaluate(()=>{ const bb=window.__bb, o={};
    o.reiterRez=!!document.querySelector('#ltabs [data-tab="rez"]');
    o.gebaut=!!bb.wbG; o.offen=(bb.wbOeffnen(),bb.wbOpen);
    const u=bb.UPGRADES.filter(x=>/^labor/.test(x.id)); o.stufen=u.map(x=>x.id+':'+x.lvl+':'+x.cost()+':'+x.req);
    return o; });
  console.log('VOR',JSON.stringify(vor));
  pruef(!vor.reiterRez,'Laptop hat noch den Reiter Entwicklung'); pruef(!vor.gebaut&&!vor.offen,'Werkbank ohne Kauf da/offen');
  pruef(vor.stufen.length===5,'nicht fuenf Werkbank-Stufen');

  /* --- 2. Kauf, Platz, Ansprechen --- */
  const kauf=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    S.level=20; S.money=200000; ['shop_halb','lager','lager_nord','shop_gross','testfeld','labor'].forEach(id=>bb.testKauf(id));
    o.labor=!!S.up.labor; o.gebaut=!!bb.wbG;
    const g=bb.wbG; o.pos=g?[+g.position.x.toFixed(2),+g.position.z.toFixed(2),+g.rotation.y.toFixed(2)]:null;
    /* steht im Lager (Basis + Nord), nicht in Halle/West */
    o.imLager=g&&g.position.x>-19.9&&g.position.x<-8.1&&g.position.z>-5.9&&g.position.z<5.9;
    const drin=(x,z)=>bb.colliders.some(c=>x>c.minX&&x<c.maxX&&z>c.minZ&&z<c.maxZ);
    o.kollision=drin(g.position.x,g.position.z);
    /* frei von Regalplaetzen: kein Lagerregal-Platz ueberschneidet die Werkbank */
    const bx={x0:g.position.x-0.45,x1:g.position.x+0.45,z0:g.position.z-1.05,z1:g.position.z+1.05};
    o.regalKonflikt=bb.RACKS.filter(r=>!r.weg&&Math.abs(r.x-g.position.x)<1.3+0.45&&Math.abs(r.z-g.position.z)<0.55+1.05).map(r=>r.x+'/'+r.z);
    /* hinstellen, ansehen, E */
    bb.setView(g.position.x+1.4,g.position.z,Math.PI/2,-0.35); bb.kameraSetzen(); bb.updateTarget();
    o.ziel=bb.target&&bb.target.kind; const pr=bb.promptFor(bb.target); o.prompt=pr&&pr.t;
    bb.doAction(); o.offen=bb.wbOpen; o.ansicht=bb.wbAnsicht;
    o.html=document.querySelector('#werkbank .wbcard').innerHTML.length;
    o.bauteile=[]; g.traverse(m=>{ if(m.userData&&m.userData.bauteil) o.bauteile.push(m.userData.bauteil); }); o.bauteile=[...new Set(o.bauteile)];
    return o; });
  console.log('KAUF',JSON.stringify(kauf));
  pruef(kauf.labor&&kauf.gebaut,'Werkbank nach Kauf nicht gebaut'); pruef(kauf.imLager,'Werkbank nicht im Lager ①');
  pruef(kauf.kollision,'Werkbank ohne Kollision'); pruef(!kauf.regalKonflikt.length,'Werkbank auf Regalplatz: '+kauf.regalKonflikt);
  pruef(kauf.ziel==='werkbank'&&/Werkbank/.test(kauf.prompt||''),'Werkbank nicht ansprechbar: '+kauf.ziel+' '+kauf.prompt);
  pruef(kauf.offen&&kauf.ansicht==='start','E oeffnet die Werkbank nicht');
  if(BILDER){ await p.evaluate(()=>window.__bb.wbSchliessen(false));
    await bild('werkbank',()=>{ const bb=window.__bb, g=bb.wbG; return (function(v){ const cam=bb.camera; const dx=v.t[0]-v.p[0], dz=v.t[2]-v.p[2]; bb.setView(v.p[0],v.p[2],Math.atan2(-dx,-dz),0); bb.clock=600; bb.applyTOD();
      for(let i=0;i<3;i++){ bb.kameraSetzen(); cam.position.set(v.p[0],v.p[1],v.p[2]); cam.lookAt(v.t[0],v.t[1],v.t[2]); cam.updateMatrixWorld(); bb.renderFrame(0.05); } return bb.renderer.domElement.toDataURL('image/jpeg',0.88); })({p:[g.position.x+2.6,1.7,g.position.z+1.6],t:[g.position.x,1.1,g.position.z]}); });
    await bild('werkbank-lager',()=>{ const bb=window.__bb, g=bb.wbG; const cam=bb.camera; const v={p:[-10.5,1.75,-1.5],t:[g.position.x,1.0,g.position.z]}; const dx=v.t[0]-v.p[0], dz=v.t[2]-v.p[2]; bb.setView(v.p[0],v.p[2],Math.atan2(-dx,-dz),0);
      for(let i=0;i<3;i++){ bb.kameraSetzen(); cam.position.set(v.p[0],v.p[1],v.p[2]); cam.lookAt(v.t[0],v.t[1],v.t[2]); cam.updateMatrixWorld(); bb.renderFrame(0.05); } return bb.renderer.domElement.toDataURL('image/jpeg',0.88); });
    await p.evaluate(()=>window.__bb.wbOeffnen()); }

  /* --- 3. Bauprogramm je Groesse --- */
  const bau=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={stufen:[]};
    S.level=40; ['labor2','labor3','labor4','labor5'].forEach(id=>bb.testKauf(id));
    S.gesehen.length=0; o.ohneEffekte=bb.bruchListe().length;
    bb.BRUCH_IDS.forEach(e=>bb.bruchGesehen(e)); Object.keys(bb.WB_LICHT).forEach(k=>bb.bruchGesehen('licht:'+k));
    o.effekte=bb.bruchListe().length; o.brucharten=bb.stat('brucharten');
    for(let i=0;i<5;i++){ const d=bb.wbEntwurfNeu(i), st=bb.WIRT.werkbank.stufen[i];
      o.stufen.push({i,schuss:st.schuss,offen:bb.wbStufeOffen(i),rest:bb.wbRest(d),gueltig:bb.wbGueltig(d),mangel:bb.wbMangel(d),dauer:bb.wbDauer(d),b:bb.wbBewertung(d).sterne,
        kosten:bb.wbStueckkosten(d),markt:bb.wbMarkt(d),entw:bb.wbEntwicklung(d)}); }
    return o; });
  console.log('BAU',JSON.stringify(bau));
  pruef(bau.ohneEffekte===0,'Effekte ohne Gesehen freigeschaltet'); pruef(bau.effekte>=40,'zu wenige Effekte nach Freischaltung: '+bau.effekte);
  for(const s of bau.stufen){ pruef(s.offen&&s.rest===0&&s.gueltig&&!s.mangel,`Stufe ${s.i+1}: Entwurf nicht gueltig (${s.rest}, ${s.mangel})`); pruef(s.markt>s.kosten,`Stufe ${s.i+1}: Markt unter Kosten`); }
  pruef(bau.stufen.map(s=>s.schuss).join()==='25,60,110,200,500','Schusszahlen nicht 25/60/110/200/500');

  /* Bedienung per Klick im Bauprogramm */
  await p.evaluate(()=>{ const bb=window.__bb; bb.wbAnsicht='start'; bb.wbRender(); });
  await p.click('#werkbank [data-a="neu"]');
  const klick=async(sel)=>{ await p.click('#werkbank '+sel); };
  const zust=()=>p.evaluate(()=>{ const bb=window.__bb, e=bb.wbE; return {n:e.abschnitte.length,rest:bb.wbRest(e),stufe:e.stufe,sel:bb.wbSel,ab:e.abschnitte.map(x=>x.e+':'+x.n+':'+x.muster)}; });
  const z0=await zust();
  await klick('[data-a="gr"][data-v="0"]'); const z1=await zust();
  await klick('[data-a="plus"]'); const z2=await zust();
  await klick('[data-a="sel"][data-i="0"]'); await klick('[data-a="n"][data-v="-5"]'); const z3=await zust();
  await klick('[data-a="n"][data-v="rest"]'); const z4=await zust();
  await klick('[data-a="dup"][data-i="0"]'); const z5=await zust();
  await klick('[data-a="ab"][data-i="0"]'); const z6=await zust();
  await klick('[data-a="del"][data-i="1"]'); const z7=await zust();
  await klick('[data-a="set"][data-v="muster:rl"]'); await klick('[data-a="set"][data-v="e:dahlie"]'); await klick('[data-a="set"][data-v="A:blau"]'); const z8=await zust();
  console.log('KLICK',JSON.stringify({z0,z1,z2,z3,z4,z5,z6,z7,z8}));
  pruef(z1.stufe===0&&z1.rest===0,'Groessenwechsel streckt die Abschnitte nicht');
  pruef(z2.n===z1.n+1,'+ Abschnitt'); pruef(z3.rest===5,'Schuss -5 zeigt Rest nicht'); pruef(z4.rest===0,'Rest auffuellen');
  pruef(z5.n===z2.n+1,'Abschnitt kopieren'); pruef(z6.sel===1,'Abschnitt verschieben'); pruef(z7.n===z5.n-1,'Abschnitt loeschen');
  pruef(/dahlie:\d+:rl/.test(z8.ab[z8.sel]),'Effekt/Muster setzen: '+z8.ab[z8.sel]);
  /* Live-Anzeige: Schuss frei */
  await klick('[data-a="n"][data-v="-1"]');
  const live=await p.evaluate(()=>{ const t=document.querySelector('#werkbank .wbkenn').textContent; return {t,knopf:document.querySelector('#werkbank [data-a="vorschau"]').disabled}; });
  pruef(/noch 1 frei/.test(live.t)&&live.knopf,'Restschuss-Anzeige/Sperre fehlt: '+live.t.slice(0,80));
  await klick('[data-a="n"][data-v="1"]');
  /* gesperrter Effekt laesst sich nicht setzen */
  const sperre=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, x=bb.wbE.abschnitte[bb.wbSel]; const alt=x.e; S.gesehen=S.gesehen.filter(k=>k!=='kamuro');
    const v=document.createElement('button'); v.dataset.a='set'; v.dataset.v='e:kamuro'; document.querySelector('#werkbank .wbcard').appendChild(v); v.click();
    const r=x.e; bb.bruchGesehen('kamuro'); return {alt,r}; });
  pruef(sperre.r!=='kamuro','ungesehener Effekt verbaubar');
  if(BILDER){ await p.evaluate(()=>{ const bb=window.__bb; bb.wbStufeWechsel(2); bb.wbSel=1; bb.wbRender(); }); await schuss('bauprogramm','#werkbank .wbcard'); }

  /* --- 4. Vorschau: echte Engine, Abschuss-Baustein, Abfolge --- */
  const vs=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, A=window.__abschuss, o={};
    const d={stufe:1,name:'Probe',abschnitte:[bb.wbAbschnitt({e:'chrys',A:'gold',B:'rot',n:20,takt:0,muster:'lr'}),bb.wbAbschnitt({e:'licht:goldkomet',A:'gold',B:'weiss',n:20,takt:1,muster:'gerade',pause:1.5}),
      bb.wbAbschnitt({e:'kamuro',A:'gold',B:'violett',n:20,muster:'finale',hoehe:2,kal:2})]};
    o.dauerPlan=bb.wbDauer(d);
    const AL=[]; A.log(AL); const log=[]; bb.fwLog(log); bb.ROHR_LOG=[];
    const P0=Object.keys(bb.P).length, hype0=bb.hype, xp0=S.xp, money0=S.money, tag0=S.day, uhr0=bb.clock;
    bb.wbVorschauStart(d); o.vs=!!bb.wbVs; o.offen=bb.wbOpen; o.nacht=bb.todUhr?bb.todUhr():null;
    o.kamera=[+bb.camera.position.x.toFixed(1),+bb.camera.position.y.toFixed(1),+bb.camera.position.z.toFixed(1)];
    bb.run(1.4,0.05);
    const auf=AL.find(x=>x.was==='auf'), zu=AL.find(x=>x.was==='zuend');
    o.ort=auf&&auf.pl.ort; o.form=auf&&auf.form; o.dauerEngine=zu?+zu.dauer.toFixed(1):null;
    const id=auf&&auf.t; o.id=id; o.proto=id&&bb.P[id]&&bb.P[id].proto; o.zplan=id?Math.round(bb.zuendPlan(id).dauer):null;
    const L=id?A.rohrLayout(id):null; o.rohre=L?L.rohre.length:0;
    /* Abfolge Abschnitt 1 (links -> rechts): Rohr-x der ersten 20 Schuss steigend */
    const xs=L?L.folge.slice(0,20).map(k=>L.rohre[k].x):[]; let steig=0; for(let i=1;i<xs.length;i++) if(xs[i]>=xs[i-1]-1e-6) steig++; o.lrAnteil=xs.length?+(steig/(xs.length-1)).toFixed(2):0;
    const ng=L?L.folge.slice(20,40).map(k=>Math.abs(bb.P[id].rohrNeig(k))):[]; o.geradeNeig=ng.length?+Math.max(...ng).toFixed(3):null;
    let n=0; while(bb.wbVs&&n++<600) bb.run(0.5,0.25);
    o.schuesse=log.filter(e=>e.art==='schuss'||e.art==='perle').length;
    const ri=(bb.ROHR_LOG||[]).filter(e=>e.i!==undefined&&e.i>=0).map(e=>e.i); o.rohrGefeuert=ri.length; o.rohrEinzeln=new Set(ri).size; o.ohneRohr=(bb.ROHR_LOG||[]).filter(e=>e.i===-1).length;
    o.hoehen=log.filter(e=>e.art==='schuss').map(e=>e.hoehe||0); o.hMax=Math.round(Math.max(...o.hoehen,0)); o.hMin=Math.round(Math.min(...o.hoehen)); delete o.hoehen;
    A.log(null); bb.fwLog(null); bb.ROHR_LOG=null;
    o.ende={vs:!!bb.wbVs,protoWeg:!bb.P[id],P:Object.keys(bb.P).length-P0,hype:bb.hype-hype0,xp:S.xp-xp0,geld:S.money-money0,tag:S.day-tag0,uhr:Math.round(bb.clock-uhr0),wieder:bb.wbOpen};
    return o; });
  console.log('VORSCHAU',JSON.stringify(vs));
  pruef(vs.vs&&!vs.offen,'Vorschau startet nicht'); pruef(vs.ort==='vorschau'&&vs.form==='batterie','Vorschau nicht ueber den Abschuss-Baustein ('+vs.ort+'/'+vs.form+')');
  pruef(vs.proto,'Vorschau ohne Probestueck'); pruef(vs.rohre===60,'Rohre != 60: '+vs.rohre);
  pruef(vs.schuesse===60&&vs.rohrGefeuert===60&&vs.rohrEinzeln===60&&vs.ohneRohr===0,`Loch = Schuss verletzt: ${vs.schuesse} Starts, ${vs.rohrGefeuert}/${vs.rohrEinzeln} Rohre, ${vs.ohneRohr} ohne`);
  pruef(vs.lrAnteil>=0.85,'Abschnitt links->rechts laeuft nicht von links nach rechts: '+vs.lrAnteil);
  pruef(vs.geradeNeig!==null&&vs.geradeNeig<0.01,'Abschnitt senkrecht hat schraege Rohre: '+vs.geradeNeig);
  pruef(Math.abs(vs.dauerPlan-vs.zplan)<=3,`Dauer Anzeige ${vs.dauerPlan} s, Engine ${vs.zplan} s`);
  pruef(vs.ende.protoWeg&&vs.ende.P===0,'Probestueck bleibt im Katalog'); pruef(vs.ende.hype===0&&vs.ende.xp===0&&vs.ende.geld===0,'Vorschau kostet/bringt etwas: '+JSON.stringify(vs.ende));
  pruef(vs.ende.tag===0&&Math.abs(vs.ende.uhr)<1,'Spielzeit laeuft waehrend der Vorschau'); pruef(vs.ende.wieder,'nach der Vorschau nicht zurueck an der Werkbank');
  if(BILDER){
    /* Vorschau-Bild: Abend, Batterie auf dem Tisch, nach ein paar Sekunden mitten im Ablauf */
    await p.evaluate(()=>{ const bb=window.__bb; const d=bb.wbEntwurfNeu(2); d.name='Probe'; bb.wbVorschauStart(d); bb.run(6,0.05); });
    await bild('vorschau',()=>{ const bb=window.__bb; bb.renderFrame(0.05); return bb.renderer.domElement.toDataURL('image/jpeg',0.88); });
    await p.evaluate(()=>{ const bb=window.__bb; bb.run(4,0.05); });
    await bild('vorschau2',()=>{ const bb=window.__bb; bb.renderFrame(0.05); return bb.renderer.domElement.toDataURL('image/jpeg',0.88); });
    await p.evaluate(()=>{ const bb=window.__bb; bb.wbVorschauEnde(true); });
  }

  /* --- 5. Entwickeln: Name, Preis, Serie --- */
  await p.evaluate(()=>{ const bb=window.__bb; bb.wbE=bb.wbEntwurfNeu(0); bb.wbAnsicht='bau'; bb.wbRender(); });
  await p.click('#werkbank [data-a="weiter"]');
  await p.fill('#wbName','Testfeuer Gold');
  await p.fill('#wbPreis','29.99'); await p.dispatchEvent('#wbPreis','change');
  if(BILDER) await schuss('produkt','#werkbank .wbcard');
  const ent=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, W=bb.WIRT.werkbank, o={};
    const e0=bb.wbE; o.kosten=bb.wbStueckkosten(e0); o.entw=bb.wbEntwicklung(e0); o.kartons=bb.wbKartons; o.mind=W.stufen[0].mindest;
    const g0=S.money; document.querySelector('#werkbank [data-a="entwickeln"]').click();
    const e=bb.eigeneListe()[0]; o.da=!!e; if(!e) return o;
    o.id=e.id; o.name=e.name; o.bezahlt=+(g0-S.money).toFixed(2); o.soll=+(o.entw+o.kosten*W.stufen[0].mindest*bb.WB_STUFEN[0].box).toFixed(2);
    o.preis=S.prices[e.id]; o.imKatalog=!!bb.P[e.id]&&bb.ORDER.includes(e.id); o.show=!!bb.istBatterie(e.id); o.schuss=bb.rohrBedarf(e.id).schuss;
    o.serien=e.serien.map(s=>s.kartons+'/'+s.rest); o.stat=bb.stat('eigene');
    o.verpackt=bb.P[e.id].art.title; o.linie=bb.linieVon?bb.linieVon(e.id):null;
    /* nicht beim Fachhandel bestellbar */
    bb.cartClear(); bb.cartAdd(e.id,1,'fachhandel'); o.korb=bb.cartBoxes(); bb.cartClear();
    return o; });
  console.log('ENTWICKELN',JSON.stringify(ent));
  pruef(ent.da&&ent.name==='Testfeuer Gold','Entwickeln fehlgeschlagen'); pruef(Math.abs(ent.bezahlt-ent.soll)<0.05,`bezahlt ${ent.bezahlt}, soll ${ent.soll}`);
  pruef(ent.preis===29.99,'Verkaufspreis nicht uebernommen: '+ent.preis); pruef(ent.imKatalog&&ent.show&&ent.schuss===25,'Produkt nicht im Katalog/keine Batterie');
  pruef(ent.serien.join()===`${ent.mind}/2`,'Serie falsch: '+ent.serien); pruef(ent.korb===0,'eigene Batterie beim Fachhandel bestellbar');
  pruef(ent.linie==='hausmarke','Verpackung nicht Hausmarke');

  /* --- 6. Lieferung nach Tagen, LKW, Regal, Verkauf --- */
  const lief=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={}, e=bb.eigeneListe()[0], id=e.id;
    const pend=()=>bb.pendingListe().filter(x=>x.type===id).length;
    bb.wbTick(); o.tag1=pend(); bb.wbTick(); o.tag2=pend(); o.offen=e.serien.length;
    return o; });
  await H.vorspulen(p,{sek:2,dt:0.1,max:400,bis:`bb.floorBoxes.some(x=>x.type===bb.eigeneListe()[0].id)||(bb.truck&&bb.truck.boxes&&bb.truck.boxes.some(m=>m.userData&&m.userData.ref&&m.userData.ref.type===bb.eigeneListe()[0].id))`,name:'LKW'});
  const regal=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={}, e=bb.eigeneListe()[0], id=e.id;
    o.boden=bb.floorBoxes.filter(x=>x.type===id).length; o.lkw=bb.truck?bb.truck.state:null;
    /* ins Regal: Regal aufstellen und einraeumen wie der Einraeumer */
    for(let i=0;i<3;i++) bb.regalStellen('standard');
    const lv=bb.emptyLevel(id); o.fach=!!lv; let k=0; if(lv) while(k<40&&bb.addToLevel(lv,id,1)) k++; o.eingeraeumt=k;
    o.regalBestand=bb.shelfStockOf?bb.shelfStockOf(id):null; o.bestand=bb.stockOf(id);
    return o; });
  console.log('LIEFERUNG',JSON.stringify(lief),JSON.stringify(regal));
  pruef(lief.tag1===0&&lief.tag2>0&&lief.offen===0,'Serie kommt nicht nach 2 Tagen auf den Weg: '+JSON.stringify(lief));
  pruef(regal.boden>0||regal.lkw,'LKW bringt die Serie nicht'); pruef(regal.eingeraeumt>0,'eigene Batterie passt nicht ins Regal');
  if(BILDER) await bild('regal',()=>{ const bb=window.__bb, id=bb.eigeneListe()[0].id; const lv=bb.allLevels?bb.allLevels().find(l=>l.type===id):null; const sh=lv?lv.sh.g:null;
    const P0=sh?sh.position:{x:0,z:0}, ry=sh?sh.rotation.y:0; const fx=Math.sin(ry), fz=Math.cos(ry); const cam=bb.camera;
    const v={p:[P0.x+fx*1.7,1.45,P0.z+fz*1.7],t:[P0.x,1.0,P0.z]}; const dx=v.t[0]-v.p[0], dz=v.t[2]-v.p[2]; bb.setView(v.p[0],v.p[2],Math.atan2(-dx,-dz),0); bb.clock=600; bb.applyTOD();
    for(let i=0;i<3;i++){ bb.kameraSetzen(); cam.position.set(v.p[0],v.p[1],v.p[2]); cam.lookAt(v.t[0],v.t[1],v.t[2]); cam.updateMatrixWorld(); bb.renderFrame(0.05); } return bb.renderer.domElement.toDataURL('image/jpeg',0.88); });
  /* Verkauf: ein Verkaufstag, die eigene Marke im Regal - Nachfrage messen */
  const v0=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S; S.rep=70; const id=bb.eigeneListe()[0].id; const lv=bb.allLevels().find(l=>l.type===id); return {v:bb.stat('v_eigene'),im:lv?lv.count:0,tag:S.day}; });
  await p.evaluate(()=>{ const bb=window.__bb; bb.openShop(); });
  await H.vorspulen(p,{sek:3,dt:0.1,max:2000,bis:`bb.S.day>a.day||bb.phase==='after'||(bb.clock>=1300)`,name:'Verkaufstag'});
  const verk=await p.evaluate((v0)=>{ const bb=window.__bb, S=bb.S, id=bb.eigeneListe()[0].id; const lv=bb.allLevels().filter(l=>l.type===id);
    return {verkauft:bb.stat('v_eigene')-v0.v,imRegal:lv.reduce((a,l)=>a+l.count,0),vorher:v0.im,uhr:Math.round(bb.clock),kunden:bb.DS?bb.DS.customers:null}; },v0);
  console.log('VERKAUF',JSON.stringify(verk));
  pruef(verk.verkauft>0,'eigene Batterie wird nicht verkauft');

  /* --- 7. Nachbestellen, 5 Plaetze, Loeschen --- */
  const plaetze=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={}; S.money=500000;
    const e=bb.eigeneListe()[0]; const r=bb.wbNachbestellen(e.id,bb.WIRT.werkbank.stufen[0].mindest*4); o.nach=r.ok&&r.serie.rabatt; o.serien=e.serien.length;
    /* Bestellmenue: Reiter Eigene Marke mit Knopf */
    bb.openLaptop('order','buero'); bb.lsup='eigen'; try{ bb.renderLaptop(); }catch(x){ o.fehlerLaptop=x.message; }
    o.bestellReiter=!!document.querySelector('#lbody [data-a="wbnach"]'); bb.closeLaptop&&bb.closeLaptop(false);
    for(let i=1;i<6;i++){ const d=bb.wbEntwurfNeu(i%5); d.name='Platz '+i; const r2=bb.wbEntwickeln(d,0,0); o['p'+i]=r2.ok?'ok':r2.grund; }
    o.anzahl=bb.eigeneListe().length;
    /* Loeschen nur ohne offene Serie; mit Bestand -> Altbestand */
    const L=bb.eigeneListe(), z=L[L.length-1]; z.serien=[]; bb.floorBoxes; const r3=bb.wbLoeschen(z.id); o.loeschen=r3.ok; o.nachLoeschen=bb.eigeneListe().length;
    const r4=bb.wbLoeschen(L[0].id); o.loeschenMitSerie=r4.ok;
    return o; });
  console.log('PLAETZE',JSON.stringify(plaetze));
  pruef(plaetze.nach,'Nachbestellen mit Rabatt'); pruef(plaetze.bestellReiter,'Bestellmenue ohne Eigene Marke'); pruef(plaetze.anzahl===5&&plaetze.p5!=='ok','5-Platz-Grenze greift nicht');
  pruef(plaetze.loeschen&&plaetze.nachLoeschen===4,'Loeschen'); pruef(!plaetze.loeschenMitSerie,'Loeschen trotz laufender Serie');

  /* --- 8. Speichern und Laden --- */
  const vorSpeichern=await p.evaluate(()=>{ const bb=window.__bb; bb.save(); return {n:bb.eigeneListe().length,ids:bb.eigeneListe().map(e=>e.id),preis:bb.S.prices[bb.eigeneListe()[0].id],wb:[+bb.wbG.position.x.toFixed(2),+bb.wbG.position.z.toFixed(2)],serien:bb.eigeneListe()[0].serien.length}; });
  await H.neuladen(p);
  await p.click('#startBtns button:first-child');
  await H.warte(p,"!document.getElementById('start').classList.contains('show')",'Weiterspielen');
  await p.evaluate(()=>window.__bb.stoppSchleife());
  const geladen=await p.evaluate(()=>{ const bb=window.__bb, L=bb.eigeneListe(); return {n:L.length,ids:L.map(e=>e.id),preis:bb.S.prices[L[0].id],wb:bb.wbG?[+bb.wbG.position.x.toFixed(2),+bb.wbG.position.z.toFixed(2)]:null,serien:L[0].serien.length,
    katalog:L.every(e=>bb.P[e.id]&&bb.istBatterie(e.id)),regal:bb.allLevels().filter(l=>l.type===L[0].id).reduce((a,l)=>a+l.count,0)}; });
  console.log('LADEN',JSON.stringify(vorSpeichern),JSON.stringify(geladen));
  pruef(geladen.n===vorSpeichern.n&&geladen.ids.join()===vorSpeichern.ids.join()&&geladen.preis===vorSpeichern.preis,'eigene Batterien nicht gespeichert');
  pruef(geladen.wb&&geladen.wb.join()===vorSpeichern.wb.join(),'Werkbank nach dem Laden nicht da'); pruef(geladen.katalog,'nach dem Laden nicht im Katalog');
  pruef(geladen.serien===vorSpeichern.serien,'offene Serien nicht gespeichert'); pruef(geladen.regal>0,'Regalbestand der eigenen Marke verloren');

  /* --- 9. Migration alter Labor-Rezepturen --- */
  await p.evaluate(()=>{ const bb=window.__bb; bb.save(); const k=Object.keys(localStorage).find(x=>{ try{ const d=JSON.parse(localStorage.getItem(x)); return d&&d.v===3&&d.up; }catch(e){ return false; } });
    const d=JSON.parse(localStorage.getItem(k)); delete d.wbv; delete d.werkbank; d.eigeneAlt=[];
    d.eigene=[{id:'eigenalt1',name:'Alte Batterie',traeger:'batterie',eff:'chrys',eff2:null,A:'rot',B:'gold',etikett:'klassik',cost:9,market:21,hype:30,rest:0,fertig:true},
              {id:'eigenalt2',name:'Altes Raketenset',traeger:'rakete3',eff:'kugel',eff2:null,A:'gold',B:'blau',etikett:'klassik',cost:3,market:7,hype:10,rest:0,fertig:true}];
    d.up.labor2=true; d.boxes=(d.boxes||[]).concat([{type:'eigenalt2',count:8,q:1,x:-12,y:0.2,z:-3,ry:0},{type:'eigenalt1',count:6,q:1,x:-13,y:0.2,z:-3,ry:0}]);
    localStorage.setItem(k,JSON.stringify(d)); window.__migGeld=d.money; });
  await H.neuladen(p);
  const geld0=await p.evaluate(()=>{ try{ const k=Object.keys(localStorage).find(x=>{ try{ const d=JSON.parse(localStorage.getItem(x)); return d&&d.v===3&&d.up; }catch(e){ return false; } }); return JSON.parse(localStorage.getItem(k)).money; }catch(e){ return null; } });
  await p.click('#startBtns button:first-child');
  await H.warte(p,"!document.getElementById('start').classList.contains('show')",'Weiterspielen (Migration)');
  await p.evaluate(()=>window.__bb.stoppSchleife());
  const mig=await p.evaluate((geld0)=>{ const bb=window.__bb, S=bb.S, L=bb.eigeneListe(), o={};
    const a=L.find(e=>e.id==='eigenalt1'); o.batterie=a?{stufe:a.stufe,schuss:bb.wbSchuss(a),ist:bb.istBatterie('eigenalt1')}:null;
    o.rakete=!!L.find(e=>e.id==='eigenalt2'); o.alt=(S.eigeneAlt||[]).map(x=>x.id); o.altProdukt=!!bb.P.eigenalt2&&bb.P.eigenalt2.noOrder;
    o.boden=bb.floorBoxes.filter(x=>x.type==='eigenalt2').length; o.erst=+(S.money-geld0).toFixed(2); o.labor2=!!S.up.labor2;
    bb.run(4,0.1); o.meldung=[...document.querySelectorAll('#toasts .toast')].map(t=>t.textContent).find(t=>/Werkbank/.test(t))||null;
    o.text=bb.wbMigrationText({bat:1,weg:1,erst:1});
    return o; },geld0);
  console.log('MIGRATION',JSON.stringify(mig));
  pruef(mig.batterie&&mig.batterie.stufe===0&&mig.batterie.schuss===25&&mig.batterie.ist,'Batterie-Rezeptur nicht umgewandelt');
  pruef(!mig.rakete&&mig.alt.includes('eigenalt2')&&mig.altProdukt&&mig.boden>0,'Raketen-Rezeptur: Bestand nicht als Altbestand verkaufbar');
  pruef(mig.labor2&&mig.erst>0,'alte zweite Zuendstufe nicht erstattet: '+mig.erst); pruef(!!mig.meldung,'keine Meldung zur Umstellung');

  /* --- 10. Handy: Werkbank am schmalen Bildschirm --- */
  await p.setViewportSize({width:390,height:844});
  const handy=await p.evaluate(()=>{ const bb=window.__bb, o={}; bb.wbOeffnen(); bb.wbE=bb.wbEntwurfNeu(1); bb.wbAnsicht='bau'; bb.wbRender();
    const c=document.querySelector('#werkbank .wbkoerper'); o.ueberlauf=c.scrollWidth-c.clientWidth;
    const kn=[...document.querySelectorAll('#werkbank button')].filter(x=>x.offsetParent); o.knoepfe=kn.length;
    o.klein=kn.filter(x=>{ const r=x.getBoundingClientRect(); return r.height<30||r.width<28; }).map(x=>x.textContent.trim().slice(0,12)).slice(0,8);
    return o; });
  console.log('HANDY',JSON.stringify(handy));
  pruef(handy.ueberlauf<=2,'Handy: Werkbank laeuft seitlich ueber ('+handy.ueberlauf+' px)'); pruef(!handy.klein.length,'Handy: Knoepfe zu klein: '+handy.klein.join(', '));
  if(BILDER){ await schuss('handy-bau'); await p.evaluate(()=>{ const bb=window.__bb; bb.wbAnsicht='produkt'; bb.wbE.name='Nordlicht'; bb.wbRender(); }); await schuss('handy-produkt'); }

  console.log(errs.length?'ERRORS: '+errs.slice(0,8).join(' | '):'keine Seitenfehler');
  console.log(mangel.length?'MANGEL: '+mangel.join(' | '):'ALLES OK');
  await b.close();
  process.exit(mangel.length||errs.length?1:0);
})().catch(e=>{ console.error('ABBRUCH',e); process.exit(2); });
