/* Rueckbau 16.10.2026 (Tom: "Mach die grosse Halle KOMPLETT weg und loesch sie aus dem Code"):
   Ein echter V141-Spielstand im Vollausbau (aus der Gameplay-Vorfuehrung gespeichert: Logistikhalle 1-3, Tore R2-R5,
   Lagerlogistik mit 125 belegten Hochregal-Plaetzen, Werk mit allen drei Straßen, Werker/Mischer, Rohstoffe,
   8 Lagerregale in Kartonlager 3, 5 Anbruch-Regale; src/tests/daten/v141-vollausbau.json) muss sauber laden:
   - LADEN       keine Seitenfehler, Spiel laeuft
   - WEG         keine entfernten Ausbauten, kein Werker/Mischer, kein hr/ll/pd im Spielstand
   - GUTSCHRIFT  Geld nachher - vorher = Ausbauten (Preise V141) + Rohstoffe (kg x Preis) + Regal- und Warenrueckkauf,
                 Ausbauten und Rohstoffe aus dem Spielstand nachgerechnet; Meldung "Rueckerstattung" einmal
   - WARE        je Sorte: Stueck in Lagerregalen/Boden/Hochregal/Werk vorher = Lagerregale + Boden + gutgeschrieben nachher
   - REGALE      alle Lagerregale im Lager (x > -20,1), keine Ueberlappung
   - EINMAL      Speichern und neu laden: keine zweite Gutschrift
   - WESTWAND    Lager Sued: Strahlen von innen nach Westen treffen auf ganzer Laenge (z -29,6 ... -6,4) und Hoehe die
                 Lagerwand bei x -19,9; Spieler kommt nicht hindurch; Kollision durchgehend
   - SZENE       kein Mesh mehr im alten Hallen-/Werkgebiet, keine Halle-Bauteile, keine Halle-Schnittstellen in __bb
   Gegenprobe GEGENPROBE=1: nach dem Laden verschwindet ein Karton und die Westwand bekommt ein Loch -> WARE und WESTWAND melden.
   Aufruf: BB_LOCK=/tmp/bb-testlock-rw sh tools/test/lauf.sh rueckbau */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'), path=require('path');
const H=require(path.join(__dirname,'../../tools/test/start-hilfe.js'));
const GP=process.env.GEGENPROBE==='1';
(async()=>{
  const stand=fs.readFileSync(path.join(__dirname,'daten','v141-vollausbau.json'),'utf8');
  const D=JSON.parse(stand);
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:960,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  const mangel=[]; const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); console.log((ok?'ok   ':'ROT  ')+n+(ok?'':' - '+was)); };
  await H.laden(p,process.argv[2]);
  await p.evaluate(st=>{ localStorage.clear(); localStorage.setItem('bb_gfx','niedrig'); localStorage.setItem('boellerbude_v3',st); },stand);
  await H.neuladen(p);
  /* Weiterspielen = erster Knopf; danach ein paar Sekunden Spielzeit (Meldung kommt nach 2,6 s) */
  await p.evaluate(()=>{ setTimeout(()=>document.querySelector('#startBtns button:first-child').click(),0); });
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:900000,polling:1000});
  await p.evaluate(()=>window.__bb.stoppSchleife());
  const r=await p.evaluate(gp=>{ const bb=window.__bb, S=bb.S;
    bb.run(4,0.05);
    const toasts=[...document.querySelectorAll('#toasts .toast')].map(e=>e.textContent);
    const R=bb.RUECKBAU;
    if(gp){ const sl=bb.racks.flatMap(r=>r.slots).find(s=>s.box); if(sl){ sl.rk.g.remove(sl.box.mesh); sl.box=null; } }
    const lager={}; const add=(t,c)=>{ lager[t]=(lager[t]||0)+c; };
    bb.racks.forEach(rk=>rk.slots.forEach(s=>{ if(s.box) add(s.box.type,s.box.count); }));
    bb.floorBoxes.forEach(x=>add(x.type,x.count));
    (R&&R.geldListe||[]).forEach(w=>add(w.t,w.c));
    const racks=bb.racks.map(rk=>({x:+rk.g.position.x.toFixed(2),z:+rk.g.position.z.toFixed(2),ry:rk.g.rotation.y,kind:rk.kind}));
    return {money:S.money,R:R?JSON.parse(JSON.stringify(Object.assign({},R,{ware:R.ware.length}))):null,lager,racks,
      up:bb.RUECKBAU_UP.filter(id=>S.up[id]),staff:bb.RUECKBAU_STAFF.filter(id=>S.staff[id]),hr:S.hr,ll:S.ll,pd:S.pd,toast:toasts.find(t=>/Rückerstattung/.test(t))||'',toastN:toasts.filter(t=>/Rückerstattung/.test(t)).length,
      level:S.level,day:S.day,racksN:bb.racks.length};
  },GP);
  /* --- Erwartung aus dem Spielstand --- */
  const PREIS={lager_west:22000,rampe2:12000,lager_west2:30000,rampe3:15000,rampe4:20000,lager_west3:42000,rampe5:26000,lagerlogistik:18500,fabrik:46000,fabrik2:26000,fabrik3:23000};
  const ausbauSoll=Object.keys(PREIS).filter(k=>D.up[k]).reduce((a,k)=>a+PREIS[k],0);
  const RP={huelsen:2.2,oxidator:5.8,metall:13.5,schwarzpulver:9.8}, PRE=1.2;
  let rohSoll=0; for(const k in (D.pd&&D.pd.lager)||{}){ const L=D.pd.lager[k]; rohSoll+=L.std*RP[k]+L.pre*RP[k]*PRE; }
  for(const x of (D.pd&&D.pd.bestellt)||[]) rohSoll+=x.kg*RP[x.r]*(x.pre?PRE:1);
  rohSoll=Math.round(rohSoll*100)/100;
  const vorher={}; const add=(t,c)=>{ if(t&&c>0) vorher[t]=(vorher[t]||0)+c; };
  D.racks.forEach(rd=>(rd.slots||[]).forEach(s=>s&&add(s.type,s.count)));
  (D.boxes||[]).forEach(x=>{ if(x.x!==undefined) add(x.type,x.count); });   /* ohne Lieferungen unterwegs (die kommen als neue Kartons) */
  if(D.hr){ D.hr.p.forEach(pl=>pl&&pl.forEach(x=>add(x.t,x.c))); D.hr.tr.forEach(l=>l.b.forEach(x=>add(x.t,x.c))); }
  if(D.pd){ D.pd.s.forEach(s=>{ (s.pal||[]).forEach(x=>add(x.t,x.c)); if(s.karton) add(s.karton.t,s.karton.n); });
    (D.pd.trocken||[]).forEach(x=>x.b.forEach(y=>add(y.t,y.c))); (D.pd.aus||[]).forEach(Q=>Q.forEach(pl=>pl.forEach(y=>add(y.t,y.c)))); }
  /* Lieferungen unterwegs (boxes ohne Position) kommen nach dem Laden als neue Bestellung - sie stehen in pending, nicht im Lager */
  console.log('RUECKBAU',JSON.stringify(Object.assign({},r.R,{geldListe:undefined})));
  pruef('LADEN',!errs.length,errs.slice(0,3).join(' | '));
  pruef('WEG',!r.up.length&&!r.staff.length&&!r.hr&&!r.ll&&!r.pd,'noch da: '+JSON.stringify({up:r.up,staff:r.staff,hr:!!r.hr,ll:!!r.ll,pd:!!r.pd}));
  const R=r.R||{};
  pruef('UMSTELLUNG',!!r.R,'keine Umstellung gelaufen');
  pruef('GUTSCHRIFT-AUSBAU',R.ausbau===ausbauSoll&&ausbauSoll===280500,'Ausbauten '+R.ausbau+' statt '+ausbauSoll);
  pruef('GUTSCHRIFT-ROH',Math.abs(R.roh-rohSoll)<0.02&&rohSoll>1000,'Rohstoffe '+R.roh+' statt '+rohSoll);
  const diff=Math.round((r.money-D.money)*100)/100;
  /* 4 s Spielzeit bei geschlossenem Laden: kein Umsatz, keine Kosten - Geld aendert sich nur durch die Gutschrift */
  pruef('GUTSCHRIFT-KONTO',Math.abs(diff-R.summe)<0.02&&Math.abs(R.summe-(R.ausbau+R.roh+R.regalGeld+R.wareGeld))<0.02,'Konto +'+diff+', Gutschrift '+R.summe);
  pruef('MELDUNG',r.toastN===1&&/gutgeschrieben/.test(r.toast),'Meldung ('+r.toastN+'x): '+r.toast);
  console.log('MELDUNG',r.toast);
  const fehl=[]; for(const t of new Set(Object.keys(vorher).concat(Object.keys(r.lager)))) if((vorher[t]||0)!==(r.lager[t]||0)) fehl.push(t+' '+(vorher[t]||0)+'->'+(r.lager[t]||0));
  const summe=o=>Object.values(o).reduce((a,c)=>a+c,0);
  console.log('WARE vorher',summe(vorher),'Stueck in',Object.keys(vorher).length,'Sorten, nachher',summe(r.lager),'| Regal',R.inRegal,'Boden',R.amBoden,'Geld',R.zuGeld,'| Regale um',R.regalUm,'weg',R.regalWeg,'Anbruch',R.anbruch);
  pruef('WARE',!fehl.length&&summe(vorher)>1000,'Abweichung: '+fehl.slice(0,8).join(', '));
  const imLager=r.racks.every(q=>q.x>-20.1&&q.x<-8.1&&q.z>-29.9&&q.z<5.9);
  pruef('REGALE',imLager&&r.racksN===D.racks.length-R.anbruch-R.regalWeg,'Regale: '+r.racksN+' (Spielstand '+D.racks.length+', Anbruch '+R.anbruch+', zurueck '+R.regalWeg+') '+JSON.stringify(r.racks.filter(q=>q.x<=-20.1)));
  /* --- Westwand, Kollision, Szene --- */
  const w=await p.evaluate(gp=>{ const bb=window.__bb, THREE=window.THREE, sc=bb.scene, o={loch:[],fremd:[],schieb:[],col:[]};
    const rc=new THREE.Raycaster(); const ziele=[]; sc.traverse(m=>{ if(m.isMesh) ziele.push(m); });
    const sicht=m=>{ for(let a=m;a;a=a.parent) if(a.visible===false) return false; return true; };
    /* Gegenprobe: das Wandstueck bei z -20 unsichtbar und seine Kollision weg - wie eine offene Schleuse */
    if(gp){ rc.set(new THREE.Vector3(-14,1,-20),new THREE.Vector3(-1,0,0)); rc.far=12; const h=rc.intersectObjects(ziele,false).filter(i=>sicht(i.object))[0]; if(h) h.object.visible=false;
      for(let i=bb.colliders.length-1;i>=0;i--){ const c=bb.colliders[i]; if(-20>c.minX&&-20<c.maxX&&-20>c.minZ&&-20<c.maxZ) bb.colliders.splice(i,1); } }
    for(let z=-29.6;z<=-6.4;z+=0.4) for(const y of [0.2,1.0,2.0,3.0,4.6]){
      rc.set(new THREE.Vector3(-14,y,z),new THREE.Vector3(-1,0,0)); rc.far=12;
      const h=rc.intersectObjects(ziele,false).filter(i=>sicht(i.object))[0];
      if(!h||h.point.x>-19.8||h.point.x<-20.15) o.loch.push(z.toFixed(1)+'/'+y+' '+(h?h.point.x.toFixed(2)+' '+(h.object.userData.bauteil||h.object.name||'?'):'nichts')); }
    /* Kollision: jeder Punkt der Wandflucht liegt in einem Kollisionsrechteck */
    for(let z=-29.8;z<=-6.2;z+=0.2) if(!bb.colliders.some(c=>-20.0>c.minX&&-20.0<c.maxX&&z>c.minZ&&z<c.maxZ)) o.col.push(z.toFixed(1));
    /* Spieler drueckt von innen gegen die Wand */
    for(const z of [-28,-24,-20.5,-17,-12,-8]){ const q=bb.schiebe(-19.6,z); for(let i=0;i<40;i++){ const r2=bb.schiebe(q.x-0.1,z); q.x=r2.x; } if(q.x<-19.85) o.schieb.push(z+': '+q.x.toFixed(2)); }
    /* Szene: Meshes ganz im alten Hallen-/Werk-/Hofgebiet (x -128 ... -20,3, z -68 ... -7) */
    const bx=new THREE.Box3();
    sc.traverse(m=>{ if(!(m.isMesh||m.isInstancedMesh)) return; bx.setFromObject(m); if(bx.isEmpty()) return;
      if(bx.min.x>-128&&bx.max.x<-20.3&&bx.min.z>-68&&bx.max.z<-7) o.fremd.push((m.userData.bauteil||m.name||m.type)+' '+bx.min.x.toFixed(1)+'/'+bx.min.z.toFixed(1)); });
    const BT=['hochregal','rbg','fts','foerderer','zelle','maschine','portalgreifer','treppe','erdwall','rohrraster','ladung'];
    o.bauteile=[]; sc.traverse(m=>{ const k=m.userData&&m.userData.bauteil; if(BT.includes(k)) o.bauteile.push(k); });
    o.schnitt=['LL','WK','HR','hrDaten','pdDaten','wkOffen','llOffen','WRAMPEN','wbays','LHALLE','logiStufe','GANG'].filter(k=>k in bb);
    o.bk=['hochregal','rbg','fts','foerderer','zelle','maschine','portalgreifer','treppe','erdwall','rohrraster'].filter(k=>k in bb.bk);
    o.nav={x0:bb.NAV.x0,w:bb.NAV.w,h:bb.NAV.h};
    return o; },GP);
  console.log('WESTWAND',JSON.stringify({loch:w.loch.length,col:w.col.length,schieb:w.schieb}),'SZENE',JSON.stringify({fremd:w.fremd.length,bauteile:w.bauteile.length,schnitt:w.schnitt,bk:w.bk,nav:w.nav}));
  pruef('WESTWAND',!w.loch.length&&!w.col.length&&!w.schieb.length,'Loch: '+w.loch.slice(0,6).join(', ')+' | ohne Kollision z '+w.col.slice(0,6).join(',')+' | durchgegangen '+w.schieb.join(','));
  pruef('SZENE',!w.fremd.length&&!w.bauteile.length&&!w.schnitt.length&&!w.bk.length,'im alten Gebiet: '+w.fremd.slice(0,8).join(', ')+' | Bauteile '+w.bauteile.slice(0,5)+' | __bb '+w.schnitt+' | bk '+w.bk);
  /* --- einmalig: speichern, neu laden, keine zweite Gutschrift --- */
  const m1=await p.evaluate(()=>{ const bb=window.__bb; bb.save(); return {money:bb.S.money,roh:localStorage.getItem('boellerbude_v3')}; });
  pruef('GESPEICHERT',!/"hr":|"pd":|"lager_west"|"lagerlogistik":true|"fabrik":true/.test(m1.roh),'Spielstand enthaelt noch Halle/Werk');
  await H.neuladen(p);
  await p.evaluate(()=>{ setTimeout(()=>document.querySelector('#startBtns button:first-child').click(),0); });
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:900000,polling:1000});
  const m2=await p.evaluate(()=>{ const bb=window.__bb; bb.stoppSchleife(); bb.run(4,0.05); return {money:bb.S.money,R:bb.RUECKBAU,toast:bb.toastLast}; });
  pruef('EINMAL',m2.R===null&&Math.abs(m2.money-m1.money)<0.02&&!/Rückerstattung/.test(m2.toast||''),'zweites Laden: '+JSON.stringify({vor:m1.money,nach:m2.money,R:!!m2.R,toast:m2.toast}));
  if(GP){ const ok=mangel.some(m=>/^WARE/.test(m))&&mangel.some(m=>/^WESTWAND/.test(m));
    console.log(ok?'GEGENPROBE OK: WARE und WESTWAND schlagen an':'GEGENPROBE FEHLGESCHLAGEN: '+mangel.join(' | ')); }
  else console.log(mangel.length?'MANGEL: '+mangel.join(' | '):'ALLES OK');
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
  process.exit(GP?0:(mangel.length?1:0));
})().catch(e=>{ console.error('FAIL',e); process.exit(1); });
