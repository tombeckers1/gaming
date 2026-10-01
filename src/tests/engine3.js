/* Feuerwerk-Engine v2, Stufe 1 (26.09. nachts, Tom: "jedes Produkt eine
   Anomalie"). Prueft die gemeinsamen Grundlagen aus engine-zusatz.md und
   neue-effekte.md Abschnitt 2 an Probe-Drehbuechern:
   - FORMAT   {basis,rampe,spuren} statt Array
   - GRUPPEN  je:k mit takt zwischen den Gruppen, gap in der Gruppe
   - ZEIT     mit:Zahl, at:'ende'
   - ORT      x in Metern (je Schuss / je Gruppe), rohrFolge, rohre:'breit'
   - OEFFNUNG Versaetze breiter als das Produkt werden auf seine Oeffnung
              gestaucht, das Muster bleibt (28.09., Tom: "Effekte am Produkt
              rauslassen"); Duesenreihen ebenso. Die Probe-Station O ist
              12 m breit (hx 6,1), damit die Meterangaben dort ungestaucht
              bleiben; O2 ist eine 60-cm-Batterie.
   - KALIBER  kal als Liste je Platz in der Gruppe
   - FARBE    farbFolge, A/B auf der Phase, farbVert:'spektrum'
   - BOGEN    Brueche auf sieben... hier zwei Boegen, Radius r*30 m, 20-160 Grad
   - BILD     Herz: Paare spiegelgleich
   - HALBKREIS nie unter 8 m, Strahlen bis fast waagrecht
   - TREFFEN  x-Paar bricht zur selben Zeit am selben Punkt
   - MELODIE  Zeit aus den Notenlaengen, Hoehe aus dem Ton; akkord; welle
   - MINE     nurMine, Feuertopf-Sorte vs. Tiefbruch
   - PERLE    perleEff wandelperle/schwebeperle/zwilling, Perle folgt dem Winkel
   - BOMBE    mehrschlag (jeder Schlag hoeher), bombStufen relativ
   - BODEN    alle Felder durchgereicht, t = Startversatz, je:true am Gruppenort
   - STEIG    alle Aufstiege eindeutig verschieden + Einzelpruefungen
   - KUGEL    KUGEL-Sorte: kranz+drall, kranz:'reif', risse, lage:'schirm', kobana
   - RAKETE   A/B fest, farbRotation je Zuendung, Gravurtext, bruchOpt, Furzrakete
   - FONT     Phasenzeiten, blende, hKurve/hStufen, alle3 je Duese, neig/azi, ende
   - SPEICHER gestrichene Sorten werden beim Laden umgebucht
   - TAG      showLoeschen trifft nur die eigene Show
   - HAKEN    SCHUSS_EFF, EFF bekommt die Rakete (par), zielSchuss */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:60000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1000,height:700}}); p.setDefaultTimeout(600000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined&&window.__fwA!==undefined',{timeout:120000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{
    const W=window.__fwA, bb=window.__bb, o={}, O={x:0,y:1,z:-40,hx:6.1}, _s=(bb.rohrStreu=0) /* 29.09.: Geometrie ohne Rohrstreuung (streuung.js) */, O2={x:0,y:1,z:-40,hx:0.3,hz:0.2,jit:0.06,ab:0.08};
    const RA={sz:[1,1],pw:[0,0],hell:[1,1]};
    const warte=s=>bb.run(s,1/60);
    const lauf=(spuren,dauer,basis)=>{ const log=[]; log.brueche=[]; W.fwLog(log); const t0=W.uhr;
      W.playShow(O,{basis:basis||{pw:0,sz:1,th:'bunt'},rampe:RA,spuren},'__probe'); warte(dauer); W.fwLog(null);
      const rel=x=>Object.assign({},x,{t:+(x.t-t0).toFixed(2)});
      return {s:log.filter(x=>x.art==='schuss'||x.art==='kugel').map(rel),b:log.brueche.map(rel),p:log.filter(x=>x.art==='perle').map(rel),topf:log.filter(x=>x.art==='topf').map(rel)}; };
    const gl=(a,b,e)=>Math.abs(a-b)<=(e||0.07);
    warte(8);
    /* FORMAT */
    { const sh={basis:{pw:1,sz:1,th:'gold'},rampe:RA,spuren:[{n:3,gap:0.5,eff:'kugel'},{n:2,gap:0.5,eff:'ring'}]};
      const a=W.showNorm(sh); o.format={len:a.length,basis:!!a.basis,rampe:!!a.rampe,dauer:W.showDauer(sh)};
      const L=lauf(sh.spuren,3.5); o.format.schuesse=L.s.length; }
    /* GRUPPEN */
    { const pl=W.phPlan({n:6,je:3,gap:0.1,takt:[1.0]}); o.gruppenPlan={t:pl.schuesse.map(s=>+s.t.toFixed(2)),g:pl.schuesse.map(s=>s.g),dauer:pl.dauer};
      const L=lauf([{n:6,je:3,gap:0.1,takt:[1.0],eff:'kugel'}],3); o.gruppen=L.s.map(x=>x.t); }
    /* ZEIT */
    { const L=lauf([{n:3,gap:0.5,eff:'kugel'},{at:'ende',n:1,eff:'chrys'},{mit:0.3,n:1,eff:'ring'}],3); o.zeit=L.s.map(x=>[x.t,x.eff]); }
    /* ORT */
    { const L=lauf([{n:3,gap:0.2,x:[-5,0,5],eff:'kugel'}],2); o.ortX=L.s.map(x=>+(x.x-O.x).toFixed(2));
      const L2=lauf([{n:4,je:2,takt:[0.5],orte:[-6,6],eff:'kugel'}],2); o.orte=L2.s.map(x=>+(x.x-O.x).toFixed(2));
      const L3=lauf([{n:2,gap:0.2,rohrFolge:[-1,1],eff:'kugel'}],2); o.rohrFolge=L3.s.map(x=>+(x.x-O.x).toFixed(2)); }
    /* OEFFNUNG: dieselben Orte an einer 60-cm-Batterie */
    { const lauf2=(spuren,dauer)=>{ const log=[]; W.fwLog(log); W.playShow(O2,{basis:{pw:0,sz:1,th:'bunt'},rampe:RA,spuren},'__probe'); warte(dauer); W.fwLog(null);
        return log.filter(x=>x.art==='schuss').map(x=>+(x.x-O2.x).toFixed(2)); };
      o.oeX=lauf2([{n:3,gap:0.2,x:[-5,0,5],eff:'kugel'}],2);
      o.oeBreit=lauf2([{n:4,gap:0.2,muster:'x',ang:0.35,rohre:'breit',eff:'kugel'}],2);
      o.oeTreffen=lauf2([{n:2,gap:0.2,muster:'x',ang:0.35,rohre:'breit',treffen:true,eff:'kugel'}],2);
      W.fontPhasen(O2,{duesen:[-0.4,0,0.4],phasen:[{k:'fountain',t:0.5,hm:2,x:'alle3'}]},'__probe'); bb.run(0.1,0.05);
      o.oeDuesen=W.emitters.filter(e=>e.font&&e.k==='fountain').map(e=>+(e.o.x-O2.x).toFixed(2)).sort((a,b)=>a-b); warte(1.5);
      /* Fontaenen-Set: die Kegel des Modells (fontDuesenLage) sind genau die Duesen, aus denen es spruehet */
      o.oeLage={lage:W.fontDuesenLage('dreiklang'),dims:bb.P.dreiklang.dims[0]}; }
    /* KALIBER */
    { const L=lauf([{n:3,je:3,kal:['mini','mittel','riesig'],eff:'kugel'}],2); o.kal=L.s.map(x=>x.sz); }
    /* FARBE */
    { const L=lauf([{n:3,gap:0.2,farbFolge:['rot','gruen'],eff:'kugel'}],2); o.farbFolge=L.s.map(x=>[x.A.join(),x.B.join()]);
      const L2=lauf([{n:2,gap:0.2,A:'blau',B:'gold',eff:'kugel'}],2); o.farbAB=L2.s.map(x=>[x.A.join(),x.B.join()]);
      const L3=lauf([{n:7,gap:0.1,farbVert:'spektrum',eff:'kugel'}],2); o.spektrum=L3.s.map(x=>x.A.join());
      o.fw={rot:bb.FW.rot.join(),gruen:bb.FW.gruen.join(),weiss:bb.FW.weiss.join(),blau:bb.FW.blau.join(),gold:bb.FW.gold.join(),violett:bb.FW.violett.join(),orange:bb.FW.orange.join()}; }
    /* BOGEN */
    { const L=lauf([{n:14,je:7,gap:0,bogenGap:0.3,muster:'bogen',r:[1,0.7],rSkala:1,farbVert:'spektrum',eff:'kugel',steig:'keiner',bruchOpt:{kern:false,nachglitzer:false}}],4);
      o.bogen=L.b.filter(x=>!x.stufe).map(x=>({t:x.t,dx:x.x-O.x,dy:x.y-(O.y+4),A:x.A.join()})); }
    /* BILD */
    { const L=lauf([{n:14,je:2,takt:[0.3],muster:'bild',form:'herz',breite:30,mitteH:45,eff:'kugel',steig:'keiner'}],6);
      const Lb=lauf([{n:14,je:2,takt:[0.3],muster:'bild',form:'herz',eff:'kugel',steig:'keiner'}],6); o.bildStd=Lb.b.map(x=>+(x.y-O.y).toFixed(2));
      o.bild=L.b.map(x=>({t:x.t,dx:+(x.x-O.x).toFixed(2),y:+(x.y-O.y).toFixed(2)})); }
    /* HALBKREIS */
    { const L=lauf([{n:9,gap:0,muster:'halbkreis',ang:1.45,eff:'kugel',steig:'keiner'}],4);
      o.halbkreis=L.b.map(x=>({dx:+(x.x-O.x).toFixed(2),y:+(x.y-O.y).toFixed(2)})); }
    /* TREFFEN */
    { const L=lauf([{n:4,gap:0.8,muster:'x',ang:0.35,rohre:'breit',treffen:true,eff:'kugel',steig:'keiner'}],4);
      o.treffen={s:L.s.map(x=>+(x.x-O.x).toFixed(2)),b:L.b.map(x=>({t:x.t,x:x.x,y:x.y,z:x.z}))}; }
    /* MELODIE, AKKORD, WELLE */
    { const L=lauf([{n:5,muster:'gerade',hoehe:'melodie',noten:{ton:[0,2,4,2,0],dauer:[1,1,2,1,1]},viertel:0.5,hStufe:4,eff:'kugel',fuse:1.2,steig:'keiner'}],5);
      o.melodie={t:L.s.map(x=>x.t),h:L.b.map(x=>+(x.y-O.y).toFixed(2))};
      const L2=lauf([{n:5,gap:0,muster:'gerade',hoehe:'akkord',noten:{ton:[0,2,4,2,0]},eff:'kugel',fuse:1.2,steig:'keiner'}],3);
      o.akkord={t:L2.s.map(x=>x.t),h:L2.b.map(x=>+(x.y-O.y).toFixed(2))};
      const L3=lauf([{n:9,gap:0.1,hoehe:'welle',hSpanne:10,wellen:1,eff:'kugel'}],3); o.welle=L3.s.map(x=>+x.pw.toFixed(2)); }
    /* MINE */
    { const L=lauf([{n:2,gap:0.3,nurMine:true,mineEff:'kugel',mineSz:0.6,eff:'chrys'}],2); o.tiefbruch=L.s.map(x=>({eff:x.eff,h:+(x.hoehe-O.y).toFixed(2)}));
      const L2=lauf([{n:2,gap:0.3,mine:true,mineEff:'gold',eff:'chrys'}],3); o.topf={topf:L2.topf.map(x=>x.sorte),schuesse:L2.s.map(x=>x.eff)};
      const L3=lauf([{n:2,gap:0.3,nurMine:true,eff:'chrys'}],2); o.nurMine=L3.s.length;
      const L4=lauf([{n:2,gap:0.3,nurBoden:true,eff:'chrys'}],2); o.nurBodenAlt=L4.s.length; }
    /* PERLE */
    { const PS=W.ps(), zaehle=(fn)=>{ let n=0; for(const k in PS){ const ps=PS[k]; for(let i=0;i<ps.max;i++) if(ps.life[i]>0&&fn(ps,i,k)) n++; } return n; };
      /* B = violett (kommt sonst nirgends als psHuge*1,3 vor), Grundzaehlung vorher abziehen */
      const g=bb.FW.violett, istB=(ps,i,k)=>k==='psHuge'&&Math.abs(ps.base[i*3]-g[0]*1.3)<0.02&&Math.abs(ps.base[i*3+1]-g[1]*1.3)<0.02&&Math.abs(ps.base[i*3+2]-g[2]*1.3)<0.02;
      const b0=zaehle(istB);
      const L=lauf([{n:4,gap:0.3,perle:true,perleEff:'wandelperle',muster:'v',ang:0.3,A:'rot',B:'violett'}],0.05);
      warte(0.85); o.wandelB=zaehle(istB)-b0;
      warte(3); o.perleV=L.p.map(x=>[x.eff,x.v[0]]);
      lauf([{n:3,gap:0.6,perle:true,perleEff:'schwebeperle',A:'blau',B:'gold'}],3.2);
      o.schweben=zaehle((ps,i,k)=>k==='psHuge'&&Math.abs(ps.vel[i*3+1])<0.5&&ps.pos[i*3+1]>O.y+6&&ps.life[i]>0.5);
      o.girlande=zaehle((ps,i,k)=>k==='psMid'&&ps.md[i]===4&&Math.abs(ps.vel[i*3+1])<0.5&&ps.pos[i*3+1]>O.y+6&&ps.life[i]>0.3);
      warte(6);
      lauf([{n:1,perle:true,perleEff:'zwilling',A:'rot',B:'gold',muster:'gerade'}],0.05); let quer=[];
      for(let k=0;k<40&&!quer.length;k++){ bb.run(0.05,0.05); const P2=PS.psHuge; for(let i=0;i<P2.max;i++) if(P2.life[i]>0.9&&Math.abs(P2.vel[i*3])>5) quer.push(Math.sign(P2.vel[i*3])); }
      o.zwilling=quer; warte(3); }
    /* BOMBE */
    { const L=lauf([{n:1,bomb:3,bombEff:'mehrschlag',schlaege:3,bombStufen:['chrys','dahlie','schlussschlag']}],6);
      o.mehrschlag={b:L.b.map(x=>({t:x.t,y:+x.y.toFixed(2),eff:x.eff})),steig:L.s.map(x=>x.steig)};
      const L2=lauf([{n:1,bomb:2,bombEff:'dahlie',bombStufen:[{t:0.3,eff:'ring',sz:0.5}]}],5);
      o.bombRel=L2.b.map(x=>[x.eff,+x.sz.toFixed(2)]); }
    /* BODEN */
    { const e0=W.emitters.length; W.playShow(O,{rampe:RA,spuren:[{n:1,eff:'kugel',boden:{k:'kreisel',gt:2,i:3,klein:true,bis:2,t:0.5}}]},'__probe');
      bb.run(0.3,0.05); o.bodenFrueh=W.emitters.filter(e=>e.k==='kreisel').length; bb.run(0.4,0.05);
      const e=W.emitters.find(e=>e.k==='kreisel'); o.boden=e?{i:e.i,klein:e.klein,ziel:e.ziel?+(e.ziel.x-O.x).toFixed(2):null,t:+e.t.toFixed(2)}:null; warte(3);
      W.playShow(O,{rampe:RA,spuren:[{n:4,je:2,takt:[1],orte:[-5,5],eff:'kugel',boden:{k:'fountain',je:true,gt:3}}]},'__probe'); bb.run(1.2,0.05);
      o.bodenJe=W.emitters.filter(e=>e.k==='fountain').map(e=>+(e.o.x-O.x).toFixed(2)); warte(4); }
    /* STEIG: jeder Aufstieg einzeln, alle Emissionen waehrend des Flugs */
    { const PS=W.ps(), rec={on:false,L:[]};
      for(const [nm,ps] of Object.entries(PS)){ const alt=ps.emit; ps.emit=function(x,y,z,vx,vy,vz,r,g,b,life,grav,mode){ const res=alt.apply(this,arguments);
        if(rec.on) rec.L.push({ps:nm,x,y,z,vx,vy,vz,r,g,b,life,grav,mode:mode||0,t:W.uhr}); return res; }; ps.__alt=alt; }
      const ARTEN=['gold','silber','glut','knister','blink','wirbel','komet','keiner','pfeif','stamm','tonleiter','dreiklang','farbspur','tremolant','schleife','zickzack','pfeil','brokat',
        'rieselschweif','glasklang','stotter','spektralschweif','ratter','titanspur','perlenschnur','drachenschweif','zweistufe','blasen','silberdrache','ticktack'];
      const O2={x:60,y:1,z:-60,jit:0}; o.steig={}; o.steigBahn={};
      for(const sg of ARTEN){
        const r=W.shot(O2,{eff:'kugel',steig:sg,A:[1,0.1,0.1],B:[0.1,0.3,1],pw:0,fuse:1.3,dir:Math.PI/2,ang:0,fest:true,pfeif:sg==='pfeif'});
        rec.L=[]; rec.on=true; const bahn=[], t0=W.uhr; let dauer=0, bilder=0, leer=0;
        for(let k=0;k<400&&W.rockets.indexOf(r)>=0;k++){ if(r.fuse<=1/60+1e-4) { rec.on=false; }
          const n0=rec.L.length; bb.run(1/60,1/60); if(rec.on){ bilder++; if(rec.L.length===n0) leer++; dauer=W.uhr-t0; }
          bahn.push([+(r.p.x+(r.off?r.off[0]:0)).toFixed(3),+(r.p.y+(r.off?r.off[1]:0)).toFixed(3),+(r.p.z+(r.off?r.off[2]:0)).toFixed(3),+r.v.length().toFixed(2)]); }
        rec.on=false; const L=rec.L, n=Math.max(1,L.length), T=Math.max(0.1,dauer);
        const f={};
        for(const nm of ['psHuge','psBig','psMid','psSmall']) f[nm]=+(L.filter(e=>e.ps===nm).length/T).toFixed(1);
        const mw=g=>+(L.reduce((a,e)=>a+g(e),0)/n).toFixed(3);
        f.life=mw(e=>e.life); f.speed=mw(e=>Math.hypot(e.vx,e.vy,e.vz)); f.vy=mw(e=>e.vy); f.grav=mw(e=>e.grav);
        f.r=mw(e=>e.r/(e.r+e.g+e.b+1e-6)); f.g=mw(e=>e.g/(e.r+e.g+e.b+1e-6)); f.b=mw(e=>e.b/(e.r+e.g+e.b+1e-6)); f.hell=mw(e=>e.r+e.g+e.b);
        f.seite=mw(e=>Math.abs(e.x-O2.x)+Math.abs(e.z-O2.z)); f.m4=mw(e=>e.mode===4?1:0); f.leer=+(leer/Math.max(1,bilder)).toFixed(2);
        o.steig[sg]=f;
        o.steigBahn[sg]={bahn,hoehe:+(r.p.y-O2.y).toFixed(2),fuse0:+r.fuse0.toFixed(3),
          L:(sg==='perlenschnur'||sg==='spektralschweif'||sg==='schleife'||sg==='blasen'||sg==='tremolant')?L.filter((e,i)=>i%2===0).map(e=>[e.ps,+(e.x-O2.x).toFixed(2),+(e.y-O2.y).toFixed(2),+e.vx.toFixed(2),+e.vy.toFixed(2),+e.r.toFixed(2),+e.b.toFixed(2),+e.life.toFixed(2),+(e.t-t0).toFixed(3)]):null};
        warte(1.5);
      }
      /* kobana: drei kleine Blueten seitlich der Bahn */
      { const r=W.shot(O2,{eff:'kugel',steig:'silberdrache',kobana:3,A:[1,1,1],B:[1,0,1],pw:0,fuse:1.6,ang:0,dir:Math.PI/2,fest:true,C:[0.7,0.3,1]});
        rec.L=[]; rec.on=true; for(let k=0;k<200&&W.rockets.indexOf(r)>=0;k++){ if(r.fuse<=1/60+1e-4) rec.on=false; bb.run(1/60,1/60); } rec.on=false;
        const bl=rec.L.filter(e=>e.ps==='psBig'&&Math.abs(e.life-0.8)<1e-6); o.kobana={n:bl.length,y:[...new Set(bl.map(e=>Math.round(e.y)))].length,seite:[...new Set(bl.map(e=>Math.sign(Math.round(e.x-O2.x))))]}; warte(2); }
      for(const ps of Object.values(PS)) ps.emit=ps.__alt; }
    /* KUGEL-Sorten */
    { const b0=(k,d)=>{ const log=[]; log.brueche=[]; W.fwLog(log); const t0=W.uhr; W.kugelSorte(O,k); warte(d); W.fwLog(null); return {s:log.filter(x=>x.art==='kugel'),b:log.brueche.map(x=>Object.assign({},x,{t:+(x.t-t0).toFixed(2)}))}; };
      const K1=b0({kal:4,sz:3.95,pw:7.8,fuse:2.15,haupt:'kugel',A:'rot',B:'gold',steig:'ticktack',stufen:[{t:0.5,eff:'pistill',sz:0.3,n:10,kranz:0.55,drall:-0.4}]},4);
      const hb=K1.b.find(x=>!x.stufe), st=K1.b.filter(x=>x.stufe);
      o.kranz={steig:K1.s.map(x=>x.steig),n:st.length,sz:st.length?+st[0].sz.toFixed(2):0,r:st.map(x=>+Math.hypot(x.x-hb.x,x.y-hb.y,x.z-hb.z).toFixed(2)),
        dreh:st.map(x=>{ const rx=x.x-hb.x, ry=x.y-hb.y, rz=x.z-hb.z, e=x.erbe||[0,0,0], dot=(rx*e[0]+ry*e[1]+rz*e[2])/(Math.hypot(rx,ry,rz)*Math.hypot(...e)+1e-9);
          const cr=[ry*e[2]-rz*e[1],rz*e[0]-rx*e[2],rx*e[1]-ry*e[0]]; return {dot:+dot.toFixed(3),v:+Math.hypot(...e).toFixed(2),cr:cr.map(c=>+c.toFixed(1))}; })};
      const K2=b0({kal:3,sz:3.25,pw:5.8,fuse:2.0,haupt:'weltenbrand',A:'violett',B:'gold',steig:'knister',stufen:[{t:1.5,eff:'tausend',sz:0.26,n:6,kranz:'reif'}]},5);
      /* Reif: Abstand vom Hauptbruch und Lage in der Ebene des Feuerreifs
         (Schwerkraft 2,6 abgezogen: Fall nach 1,5 s) */
      const h2=K2.b.find(x=>!x.stufe), fall=2.6/1.1*(1.5-(1-Math.exp(-1.65))/1.1), E=h2.ebene;
      const nrm=E?[E[0][1]*E[1][2]-E[0][2]*E[1][1],E[0][2]*E[1][0]-E[0][0]*E[1][2],E[0][0]*E[1][1]-E[0][1]*E[1][0]]:[0,0,0];
      o.reif=K2.b.filter(x=>x.stufe).map(x=>+Math.hypot(x.x-h2.x,x.y-h2.y,x.z-h2.z).toFixed(2));
      o.reifEbene=K2.b.filter(x=>x.stufe).map(x=>{ const d=[x.x-h2.x,x.y-h2.y+fall,x.z-h2.z], l=Math.hypot(...d)||1; return +((d[0]*nrm[0]+d[1]*nrm[1]+d[2]*nrm[2])/l).toFixed(3); });
      const K3=b0({kal:5,sz:4.75,pw:10.8,fuse:2.3,haupt:'kugel',A:'silber',B:'himmel',steig:'titanspur',stufen:[{t:0.55,eff:'dahlie',sz:0.2,risse:{strahlen:6,je:4,r:[8,23],dt:0.15,zack:0.1}}]},4);
      const h3=K3.b.find(x=>!x.stufe); o.risse=K3.b.filter(x=>x.stufe).map(x=>({t:+(x.t-h3.t).toFixed(2),d:+Math.hypot(x.x-h3.x,x.y-h3.y,x.z-h3.z).toFixed(2),a:+Math.atan2(x.y-h3.y,x.x-h3.x).toFixed(2)}));
      const K4=b0({kal:4,sz:4.1,pw:8.3,fuse:2.15,haupt:'kugel',A:'pfirsich',B:'rose',steig:'blasen',stufen:[{t:0.6,eff:'strobe',sz:0.22,leise:true,lage:'schirm'}]},4);
      const h4=K4.b.find(x=>!x.stufe), s4=K4.b.find(x=>x.stufe); o.schirm=s4?+(s4.y-h4.y).toFixed(2):null;
      warte(6); }
    /* RAKETE */
    { const alt=W.RAKETEN_KL.raketen;
      W.RAKETEN_KL.raketen={n:1,gap:0,sz:1,pw:0,fuse:1.2,eff:['kugel'],A:'blau',B:'gold',farbRotation:['rot','gruen','blau'],steig:'zickzack',text:'Anna',bruchOpt:{kern:false}};
      const farben=[]; let tx=null, tx2=null, bo=null, sg=null;
      for(let k=0;k<3;k++){ W.igniteType('raketen',O); bb.run(0.02,0.02); const r=W.rockets[W.rockets.length-1]; farben.push([r.A.join(),r.B.join()]); tx=r.text; bo=r.bruchOpt; sg=r.steig; bb.run(0.1,0.05); }
      W.igniteType('raketen',O,{text:'Tom'}); bb.run(0.02,0.02); tx2=W.rockets[W.rockets.length-1].par.text;
      W.RAKETEN_KL.raketen=alt; warte(3);
      W.igniteType('furzrakete',O); bb.run(0.02,0.02); const fr=W.rockets[W.rockets.length-1];
      o.rakete={farben,tx,tx2,kern:bo&&bo.kern,sg,furz:fr?{steig:fr.steig,eff:fr.eff,knall:fr.knall}:null,furzfont:W.emitters.filter(e=>e.k==='furzfont').length};
      warte(4); }
    /* FONT */
    { const aufrufe=[];
      W.FONT_EREIGNIS.__probe=(e)=>aufrufe.push(e.nr);
      const spec={duesen:[-0.4,0,0.4],A:'gold',phasen:[
        {k:'fountain',t:2,hm:3,hKurve:[0.5,1],blende:0.5},
        {k:'fountain',t:2,hStufen:[2,4],x:'alle3',A:['rot','gruen','blau'],neig:15,azi:'innen',ende:'__probe'},
        {k:'volcano',mit:true,t:1,x:0.3,z:0.1,kegel:[10,20],dichte:[100,300]},
        {k:'riesen',at:5,t:1,hm:12}]};
      const PH=W.fontPhasenListe(spec), z=W.fontZeiten(PH); o.fontZeiten=z.z; o.fontEin=z.ein; o.fontDauer=W.fontDauer(spec);
      W.fontPhasen(O,spec,'__probe'); bb.run(0.1,0.05);
      const f0=W.emitters.filter(e=>e.font); o.font01={n:f0.length,h:f0[0]?+f0[0].hAkt.toFixed(2):null};
      bb.run(1.65,0.05);
      const F=W.emitters.filter(e=>e.font);
      const e0=F.find(e=>e.ph.hKurve), e1=F.filter(e=>e.ph.hStufen).sort((a,b)=>a.o.x-b.o.x), e2=F.find(e=>e.k==='volcano');
      o.font175={h:e0?+e0.hAkt.toFixed(2):null,st0:e0?+e0.staerke.toFixed(2):null,st1:e1.map(e=>+e.staerke.toFixed(2)),A:e1.map(e=>e.A.join()),x:e1.map(e=>+(e.o.x-O.x).toFixed(2)),
        dir:e1.map(e=>+e.dir[0].toFixed(2)),hS:e1.map(e=>e.hAkt),kegel:e2?+e2.kegelAkt.toFixed(2):null,kegelSoll:e2?+(10+10*e2.u).toFixed(2):null,uV:e2?+e2.u.toFixed(2):null,vz:e2?+(e2.o.z-O.z).toFixed(2):null,fw:{rot:bb.FW.rot.join(),gruen:bb.FW.gruen.join(),blau:bb.FW.blau.join()}};
      bb.run(1.5,0.05); o.fontSt2=W.emitters.filter(e=>e.font&&e.ph.hStufen).map(e=>e.hAkt);
      bb.run(2.2,0.05); o.fontEnde=aufrufe.slice(); const ri=W.emitters.find(e=>e.font&&e.k==='riesen'); o.fontRiesen=ri?+ri.h.toFixed(3):null;
      warte(2);
      W.FONT.fontaene={phasen:[{k:'fountain',t:1,hm:2}]}; W.igniteType('fontaene',O); bb.run(0.1,0.05); o.fontIgnite=W.emitters.filter(e=>e.font&&e.prod==='fontaene').length; delete W.FONT.fontaene; warte(2); }
    /* SPEICHER */
    { const d={v:3,shelves:[{levels:[{type:'goldperlen',count:3},{type:'raketen50',count:1},{type:'bengalduo',count:2}]}],racks:[{slots:[{type:'sternfontaene',count:2},null]}],
        boxes:[{type:'knallbonbonxxl',count:4}],cart:[{t:'konfettiknaller',n:2}],bestellungen:[{pos:[{t:'kometenfaecher',n:1},{t:'salutbatterie',n:2}]}],
        carrying:{type:'tischfeuerwerk2',count:1},prices:{goldperlen:9,roemisch:5},fwZaehler:{raketen50:2,titanraketen:1}};
      bb.sortenUmstellen(d); o.speicher=d; }
    /* TAG */
    { const T1=W.neuerShowTag(); W.playShow(O,{rampe:RA,spuren:[{n:3,gap:0.1,eff:'kugel',steig:'gold'}]},'__probe',T1);
      W.shot({x:O.x+30,y:1,z:O.z},{eff:'kugel',steig:'gold',fest:true});
      bb.run(1.0,0.05); const PS=W.ps(); const zaehl=t=>{ let n=0; for(const ps of Object.values(PS)) for(let i=0;i<ps.max;i++) if(ps.life[i]>0&&ps.tag[i]===t) n++; return n; };
      const vor=zaehl(T1), andere0=zaehl(0), rk=W.rockets.filter(r=>r.tag===T1).length; W.showLoeschen(T1); bb.run(0.05,0.05);
      o.tag={vor,nach:zaehl(T1),andere0,andere1:zaehl(0),rk,rk1:W.rockets.filter(r=>r.tag===T1).length}; warte(4); }
    /* HAKEN */
    { const calls=[]; W.SCHUSS_EFF.__rk=r=>calls.push({v:+r.v.length().toFixed(1),fuse:r.fuse}); const n0=W.rockets.length;
      W.shot(O,{eff:'__rk',steig:'keiner'}); o.schussEff={calls:calls.length,raketen:W.rockets.length-n0};
      let got=null; W.EFF.__e5=(p,A,B,s,r)=>{ got=r&&r.par?Object.assign({},r.par):null; };
      lauf([{n:1,eff:'__e5',art:'laser',split:2,steig:'keiner'}],2); o.par=got;
      const log=[]; log.brueche=[]; W.fwLog(log); const t0=W.uhr; W.zielSchuss(O,{x:O.x+5,y:O.y+25,z:O.z-2},1.6,{eff:'kugel',steig:'keiner'}); bb.run(2,1/120); W.fwLog(null);
      const zb=log.brueche[0]; o.ziel=zb?{t:+(zb.t-t0).toFixed(2),dx:+(zb.x-O.x-5).toFixed(2),dy:+(zb.y-O.y-25).toFixed(2),dz:+(zb.z-O.z+2).toFixed(2)}:null;
      delete W.EFF.__e5; delete W.SCHUSS_EFF.__rk; }
    return o; });
  const J=x=>JSON.stringify(x);
  const kurz=Object.assign({},r); delete kurz.steigBahn; console.log(J(kurz).slice(0,6000));
  /* FORMAT */
  pruef('FORMAT',r.format.len===2&&r.format.basis&&r.format.rampe&&Math.abs(r.format.dauer-2.5)<0.01&&r.format.schuesse===5,'Katalogschreibweise: '+J(r.format));
  /* GRUPPEN */
  pruef('GRUPPEN',J(r.gruppenPlan.t)==='[0,0.1,0.2,1,1.1,1.2]'&&Math.abs(r.gruppenPlan.dauer-2)<0.01,'je/takt/gap-Plan: '+J(r.gruppenPlan));
  pruef('GRUPPEN',r.gruppen.length===6&&Math.abs(r.gruppen[3]-r.gruppen[0]-1.0)<0.07&&Math.abs(r.gruppen[1]-r.gruppen[0]-0.1)<0.07,'je/takt im Lauf: '+J(r.gruppen));
  /* ZEIT */
  { const z=r.zeit, ch=z.find(x=>x[1]==='chrys'), ri=z.find(x=>x[1]==='ring');
    pruef('ZEIT',ch&&ri&&Math.abs(ch[0]-1.0)<0.07&&Math.abs(ri[0]-1.3)<0.07,"at:'ende' / mit:Zahl: "+J(z)); }
  /* ORT */
  pruef('ORT',r.ortX.length===3&&Math.abs(r.ortX[0]+5)<0.1&&Math.abs(r.ortX[1])<0.1&&Math.abs(r.ortX[2]-5)<0.1,'x je Schuss: '+J(r.ortX));
  pruef('ORT',r.orte.length===4&&Math.abs(r.orte[0]+6)<0.1&&Math.abs(r.orte[1]+6)<0.1&&Math.abs(r.orte[2]-6)<0.1&&Math.abs(r.orte[3]-6)<0.1,'orte je Gruppe: '+J(r.orte));
  pruef('ORT',r.rohrFolge.length===2&&r.rohrFolge[0]<-0.2&&r.rohrFolge[1]>0.2,'rohrFolge: '+J(r.rohrFolge));
  /* OEFFNUNG: halbe Oeffnung 0,3 - Streuung 0,06 - 0,01 = 0,23; mit Streuung
     bleibt jeder Start innerhalb 0,3 m + 3 cm */
  { const h=0.23, drin=a=>a.every(v=>Math.abs(v)<=0.33);
    pruef('OEFFNUNG',r.oeX.length===3&&Math.abs(r.oeX[0]+h)<0.07&&Math.abs(r.oeX[1])<0.07&&Math.abs(r.oeX[2]-h)<0.07,'x gestaucht: '+J(r.oeX));
    pruef('OEFFNUNG',r.oeBreit.length===4&&drin(r.oeBreit)&&Math.min(...r.oeBreit)<-0.15&&Math.max(...r.oeBreit)>0.15,'rohre breit: '+J(r.oeBreit));
    pruef('OEFFNUNG',r.oeTreffen.length===2&&drin(r.oeTreffen),'treffen: '+J(r.oeTreffen));
    pruef('OEFFNUNG',J(r.oeDuesen)===J([-h,0,h]),'Duesen: '+J(r.oeDuesen));
    /* Farbmischer: 79 cm breit, die drei Duesen (+-0,35 m) passen ungestaucht hinein */
    pruef('OEFFNUNG',J(r.oeLage.lage)===J([-0.35,0,0.35])&&r.oeLage.dims>0.75,'Fontaenen-Set: Duesen/Kegel '+J(r.oeLage)); }
  /* KALIBER */
  { const kl=r.kal.slice().sort((a,b)=>a-b); r.kal=kl; }
  /* 01.10.: Brueche ueber 1,0 werden gestaucht (bruchKappe in 14b, Tom:
     Batteriebrueche zu gross) - erwartet wird das Verhaeltnis nach der Kappe */
  const kappe=x=>x<=1?x:1+(x-1)*0.27, k0=r.kal[0];
  pruef('KALIBER',r.kal.length===3&&k0<=1&&Math.abs(r.kal[1]-kappe(k0/0.45))<0.02&&Math.abs(r.kal[2]-kappe(k0*1.6/0.45))<0.02,'kal-Liste: '+J(r.kal));
  /* FARBE */
  const F=r.fw;
  pruef('FARBE',J(r.farbFolge)===J([[F.rot,F.weiss],[F.gruen,F.weiss],[F.rot,F.weiss]]),'farbFolge: '+J(r.farbFolge));
  pruef('FARBE',J(r.farbAB)===J([[F.blau,F.gold],[F.blau,F.gold]]),'A/B auf der Phase: '+J(r.farbAB));
  pruef('FARBE',r.spektrum.length===7&&r.spektrum[0]===F.rot&&r.spektrum[1]===F.orange&&r.spektrum[6]===F.violett,'spektrum: '+J(r.spektrum));
  /* BOGEN */
  { const B=r.bogen, g0=B.filter(x=>x.A===F.rot), g1=B.filter(x=>x.A===F.orange), R=x=>Math.hypot(x.dx,x.dy), ang=x=>Math.atan2(x.dy,x.dx)*180/Math.PI;
    /* jeder Bogen steht auf einen Schlag, der innere 0,3 s nach dem aeusseren */
    const zeit=g=>g.map(x=>x.t), gleichz=g=>Math.max(...zeit(g))-Math.min(...zeit(g))<0.05;
    const ok=B.length===14&&g0.length===7&&g1.length===7&&g0.every(x=>Math.abs(R(x)-30)<0.8)&&g1.every(x=>Math.abs(R(x)-21)<0.8)&&gleichz(g0)&&gleichz(g1)
      &&Math.min(...B.map(ang))>18&&Math.max(...B.map(ang))<162&&Math.abs(g1[0].t-g0[0].t-0.3)<0.06;
    pruef('BOGEN',ok,'Boegen: '+J(B.map(x=>[x.t,+R(x).toFixed(1),+ang(x).toFixed(0),x.A===F.rot?'rot':x.A===F.orange?'orange':x.A]))); }
  /* BILD */
  { const B=r.bild.slice().sort((a,b)=>a.t-b.t), paare=[]; for(let i=0;i+1<B.length;i+=2) paare.push([B[i],B[i+1]]);
    const sym=paare.every(([a,b])=>Math.abs(a.dx+b.dx)<0.4&&Math.abs(a.y-b.y)<0.4), breit=Math.max(...B.map(x=>Math.abs(x.dx)));
    pruef('BILD',B.length===14&&sym&&breit>12&&breit<16.5&&paare[0][0].y<paare[3][0].y&&Math.abs(paare[0][0].dx)<Math.abs(paare[3][0].dx),'Herz: '+J(B)); }
  pruef('BILD',r.bildStd.length===14&&Math.min(...r.bildStd)>8&&Math.max(...r.bildStd)<38,'Herz-Vorgabe nicht im Blick: '+J(r.bildStd));
  /* HALBKREIS */
  pruef('HALBKREIS',r.halbkreis.length===9&&Math.min(...r.halbkreis.map(x=>x.y))>=7.6&&Math.max(...r.halbkreis.map(x=>Math.abs(x.dx)))>12,'Halbkreis: '+J(r.halbkreis));
  /* TREFFEN */
  { const T=r.treffen, b=T.b; let ok=T.s.length===4&&Math.abs(T.s[0]-T.s[1])>1.5&&b.length===4;
    for(let i=0;ok&&i<4;i+=2) ok=Math.abs(b[i].t-b[i+1].t)<0.05&&Math.hypot(b[i].x-b[i+1].x,b[i].y-b[i+1].y,b[i].z-b[i+1].z)<0.4;
    pruef('TREFFEN',ok,'Paar trifft sich nicht: '+J(T)); }
  /* MELODIE */
  { const M=r.melodie, h=M.h; pruef('MELODIE',J(M.t.map(x=>Math.round(x*10)/10))==='[0,0.5,1,2,2.5]'&&h.length===5&&h[2]>h[0]+10&&h[2]>h[4]+10&&h[1]>h[0]+3&&h[3]>h[4]+3,'Melodie: '+J(M));
    const Ak=r.akkord; pruef('MELODIE',Ak.t.every(t=>t===Ak.t[0])&&Ak.h[2]>Ak.h[0]+10&&Ak.h[2]>Ak.h[4]+10,'Akkord: '+J(Ak));
    const w=r.welle; pruef('MELODIE',w.length===9&&Math.abs(w[2]-w[6]-10)<0.3&&Math.abs(w[0]-w[4])<0.3,'hoehe welle: '+J(w)); }
  /* MINE */
  pruef('MINE',r.tiefbruch.length===2&&r.tiefbruch.every(x=>x.eff==='kugel'&&x.h>=4&&x.h<=8.5),'Tiefbruch 4-8 m: '+J(r.tiefbruch));
  pruef('MINE',J(r.topf.topf)==='["gold","gold"]'&&J(r.topf.schuesse)==='["chrys","chrys"]','Feuertopf-Sorte statt Mine: '+J(r.topf));
  pruef('MINE',r.nurMine===0&&r.nurBodenAlt===0,'nurMine/nurBoden schiesst trotzdem: '+r.nurMine+'/'+r.nurBodenAlt);
  /* PERLE */
  pruef('PERLE',r.perleV.length>=2&&r.perleV.every(x=>x[0]==='wandelperle')&&Math.sign(r.perleV[0][1])!==Math.sign(r.perleV[1][1])&&Math.abs(r.perleV[0][1])>2,'Perle folgt dem V: '+J(r.perleV));
  pruef('PERLE',r.wandelB>=6,'Wandelperle wird nicht B: '+r.wandelB);
  pruef('PERLE',r.schweben>=6&&r.girlande>=10,'Schwebeperle/Girlande: '+r.schweben+'/'+r.girlande);
  pruef('PERLE',r.zwilling.length>=2&&r.zwilling.includes(1)&&r.zwilling.includes(-1),'Zwilling teilt sich nicht: '+J(r.zwilling));
  /* BOMBE */
  { const M=r.mehrschlag.b; let ok=M.length===3&&J(M.map(x=>x.eff))==='["chrys","dahlie","schlussschlag"]'&&J(r.mehrschlag.steig)==='["gold"]';
    for(let i=1;ok&&i<3;i++){ const dt=M[i].t-M[i-1].t, dy=M[i].y-M[i-1].y; ok=dt>0.5&&dt<0.75&&dy>5.5&&dy<8.5; }
    pruef('BOMBE',ok,'Mehrschlag: '+J(r.mehrschlag));
    pruef('BOMBE',r.bombRel.length===2&&r.bombRel[1][0]==='ring'&&Math.abs(r.bombRel[1][1]-1.35)<0.02,'bombStufen relativ: '+J(r.bombRel)); }
  /* BODEN */
  pruef('BODEN',r.bodenFrueh===0&&r.boden&&r.boden.i===3&&r.boden.klein===true&&r.boden.ziel===2&&r.boden.t>1.5,'Boden-Felder: '+J([r.bodenFrueh,r.boden]));
  pruef('BODEN',r.bodenJe.length===2&&r.bodenJe.includes(-5)&&r.bodenJe.includes(5),'boden.je am Gruppenort: '+J(r.bodenJe));
  /* STEIG: eindeutig verschieden - je Paar ein Bau-Merkmal (Menge, Lebensdauer,
     Tempo, Fall, Seitenlage, Glitzer, Takt) um 35 % anders oder die Farbe um 50 % */
  { const S=r.steig, arten=Object.keys(S), bau=['psHuge','psBig','psMid','psSmall','life','speed','vy','grav','hell','seite','m4','leer'], farbe=['r','g','b'];
    const gleich=[], diff=(a,c,mk)=>Math.max(...mk.map(k=>{ const x=a[k], y=c[k], s=Math.abs(x)+Math.abs(y); return s<({psHuge:3,psBig:6,psMid:6,psSmall:6,seite:0.08,vy:0.2,grav:0.2,leer:0.1}[k]||0.02)?0:Math.abs(x-y)/s*2; }));
    for(let i=0;i<arten.length;i++) for(let j=i+1;j<arten.length;j++){ const a=S[arten[i]], c=S[arten[j]], db=diff(a,c,bau), df=diff(a,c,farbe);
      if(db<0.35&&df<0.5) gleich.push(arten[i]+'~'+arten[j]+'('+db.toFixed(2)+'/'+df.toFixed(2)+')'); }
    pruef('STEIG',!gleich.length,'nicht unterscheidbar: '+gleich.join(', '));
    const leer=arten.filter(a=>a!=='keiner'&&(S[a].psHuge+S[a].psBig+S[a].psMid+S[a].psSmall)<20);
    pruef('STEIG',!leer.length&&(S.keiner.psBig+S.keiner.psMid)<5,'kein Schweif: '+J(leer));
    /* Farbe aus der Rakete: farbspur, wirbel, zickzack ziehen A (rot), glasklang B (blau) */
    const nachA=['farbspur','wirbel','zickzack'].filter(a=>!(S[a].r>0.6)), nachB=S.glasklang.b>0.6;
    pruef('STEIG',!nachA.length&&nachB,'Schweif nicht in A/B: '+J(nachA)+' glasklang b '+S.glasklang.b); }
  { const Bn=r.steigBahn, H=Bn.gold.hoehe;
    /* Hoehe: gleich hoch wie Gold (pfeil, zweistufe), stotter etwas tiefer */
    pruef('STEIG',Math.abs(Bn.pfeil.hoehe-H)<1.5&&Math.abs(Bn.zweistufe.hoehe-H)<1.5&&Bn.stotter.hoehe<H-1&&Bn.stotter.hoehe>H-5,'Bruchhoehen: '+J({gold:H,pfeil:Bn.pfeil.hoehe,zweistufe:Bn.zweistufe.hoehe,stotter:Bn.stotter.hoehe}));
    /* pfeil 1,6-mal schneller, kuerzer unterwegs */
    pruef('STEIG',Bn.pfeil.fuse0<Bn.gold.fuse0*0.8&&Bn.pfeil.bahn[1][3]>Bn.gold.bahn[1][3]*1.5,'Pfeil nicht schneller: '+J([Bn.pfeil.fuse0,Bn.gold.fuse0,Bn.pfeil.bahn[1],Bn.gold.bahn[1]]));
    /* zweistufe: Tempo springt um 30 % */
    { const v=Bn.zweistufe.bahn.map(x=>x[3]); let spr=0; for(let i=1;i<v.length;i++) if(v[i]>v[i-1]*1.15) spr++; pruef('STEIG',spr===1,'Zweistufe ohne Tempo-Sprung: '+J(v)); }
    /* zickzack: zwei Knicke - die Seitenrichtung wechselt */
    { const b=Bn.zickzack.bahn, vx=b.slice(1).map((x,i)=>x[0]-b[i][0]); let kn=0, lauf=0;
      for(let i=1;i<vx.length;i++){ if(Math.abs(vx[i]-vx[i-1])>0.02){ if(!lauf) kn++; lauf=1; } else lauf=0; }
      pruef('STEIG',kn===2&&vx.some(x=>x>0.03)&&vx.some(x=>x<-0.03),'Zickzack: '+kn+' Knicke, '+J(vx.map(x=>+x.toFixed(3)))); }
    /* stotter: dreimal sackt die Rakete ab */
    { const y=Bn.stotter.bahn.map(x=>x[1]); let ab=0, run=0; for(let i=1;i<y.length;i++){ if(y[i]<y[i-1]-0.01){ if(!run) ab++; run=1; } else run=0; }
      pruef('STEIG',ab===3,'Stotter sackt '+ab+'-mal ab'); }
    /* Schlangenlinie / Schraube: seitlich 0,4-0,8 m */
    for(const a of ['drachenschweif','silberdrache']){ const b=Bn[a].bahn, xs=b.map(x=>x[0]-60); const amp=(Math.max(...xs)-Math.min(...xs))/2;
      pruef('STEIG',amp>0.4&&amp<0.8,a+' Ausschlag '+amp.toFixed(2)); }
    /* perlenschnur: stehende Perlen alle 3 m */
    { const P2=(Bn.perlenschnur.L||[]).filter(e=>e[0]==='psHuge'&&e[3]===0&&e[4]===0), ys=[...new Set(P2.map(e=>Math.round(e[2])))].sort((a,b)=>a-b);
      const abst=ys.slice(1).map((y,i)=>y-ys[i]); pruef('STEIG',ys.length>=3&&abst.every(d=>d>=2&&d<=4),'Perlenschnur: '+J(ys)); }
    /* spektralschweif: unten rot, oben violett-blau */
    { const L=(Bn.spektralschweif.L||[]).filter(e=>e[0]==='psBig'), lo=L.filter(e=>e[2]<3), hi=L.filter(e=>e[2]>12);
      const m=(A,k)=>A.reduce((a,e)=>a+e[k],0)/Math.max(1,A.length);
      pruef('STEIG',lo.length&&hi.length&&m(lo,5)>m(lo,6)+0.5&&m(hi,6)>m(hi,5),'Spektralschweif: unten r/b '+m(lo,5).toFixed(2)+'/'+m(lo,6).toFixed(2)+', oben '+m(hi,5).toFixed(2)+'/'+m(hi,6).toFixed(2)); }
    /* schleife: zwei Baender quer versetzt */
    { const L=(Bn.schleife.L||[]).filter(e=>e[0]==='psMid'&&e[8]<Bn.schleife.fuse0-0.4), li=L.filter(e=>e[5]>0.5), re=L.filter(e=>e[6]>0.5);
      const mx=A=>A.reduce((a,e)=>a+e[1],0)/Math.max(1,A.length); pruef('STEIG',li.length>5&&re.length>5&&mx(re)-mx(li)>0.2,'Schleife: '+mx(li).toFixed(2)+' / '+mx(re).toFixed(2)); }
    /* ratter und ticktack: der Schweif setzt im Takt aus */
    pruef('STEIG',r.steig.ratter.leer>0.3&&r.steig.ticktack.leer>0.3&&r.steig.gold.leer<0.1,'Takt-Schweife: '+J([r.steig.ratter.leer,r.steig.ticktack.leer,r.steig.gold.leer]));
    /* tremolant: jeder Funke blitzt spaeter einmal weiss auf */
    { const L=Bn.tremolant.L||[], gl=L.filter(e=>e[0]==='psSmall'&&e[5]>1.5&&e[7]<0.06); pruef('STEIG',gl.length>=10,'Tremolant ohne Aufblitzen: '+gl.length); }
    /* blasen: Ringe aus zehn Punkten mit gemeinsamem Tempo */
    { const L=(Bn.blasen.L||[]).filter(e=>e[0]==='psMid'), hoch=L.filter(e=>e[4]>0.3); pruef('STEIG',hoch.length>=20&&hoch.length>=L.length*0.9,'Blasen steigen nicht: '+hoch.length+'/'+L.length); }
    pruef('STEIG',r.kobana.n>=30&&r.kobana.y>=3&&r.kobana.seite.includes(1)&&r.kobana.seite.includes(-1),'Kobana: '+J(r.kobana)); }
  /* KUGEL */
  { const K=r.kranz, R=0.55*5.2*3.95;
    pruef('KUGEL',J(K.steig)==='["ticktack"]'&&K.n===10&&Math.abs(K.sz-1.19)<0.02&&K.r.every(x=>Math.abs(x-R)<0.3),'Kranz: '+J(K));
    /* Drehsinn: das Kreuzprodukt r x v zeigt fuer alle Blueten in dieselbe Richtung */
    const vSoll=2*Math.PI*0.4*0.35*R, dr=K.dreh, c0=dr.length?dr[0].cr:[0,0,0];
    pruef('KUGEL',dr.length===10&&dr.every(d=>Math.abs(d.dot)<0.02&&Math.abs(d.v-vSoll)<0.3&&(d.cr[0]*c0[0]+d.cr[1]*c0[1]+d.cr[2]*c0[2])>0),'Drall: '+J(dr.slice(0,3))+' soll v='+vSoll.toFixed(2));
    const Rr=10.45*3.25*(1-Math.exp(-1.65));
    pruef('KUGEL',r.reifEbene.length===6&&r.reifEbene.every(x=>Math.abs(x)<0.05),'Reif nicht in der Ebene des Feuerreifs: '+J(r.reifEbene));
    pruef('KUGEL',r.reif.length===6&&Math.max(...r.reif)<Rr*1.1&&Math.max(...r.reif)>Rr*0.75&&Math.min(...r.reif)>Rr*0.2,'Reif: '+J(r.reif)+' soll bis '+Rr.toFixed(1));
    const Ri=r.risse, ringe=[0,1,2,3].map(k=>Ri.filter(x=>Math.abs(x.t-0.55-0.15*k)<0.04));
    pruef('KUGEL',Ri.length===24&&ringe.every(g=>g.length===6)&&ringe.every((g,k)=>g.every(x=>Math.abs(x.d-(8+5*k))<0.6)),'Risse: '+J(Ri.map(x=>[x.t,x.d])));
    pruef('KUGEL',r.schirm!==null&&Math.abs(r.schirm-0.35*5.5*4.1)<0.3,'lage schirm: '+r.schirm); }
  /* RAKETE */
  { const R=r.rakete, Fr=r.font175.fw;
    pruef('RAKETE',J(R.farben.map(x=>x[0]))===J([Fr.rot,Fr.gruen,Fr.blau])&&R.farben.every(x=>x[1]===F.gold),'farbRotation/A/B: '+J(R.farben));
    pruef('RAKETE',R.tx==='Anna'&&R.tx2==='Tom'&&R.kern===false&&R.sg==='zickzack','Text/bruchOpt/steig: '+J(R));
    /* 28.09., Tom: echt - die Furzrakete bricht als Pupswolke (Rauch und schlapper Kohle-Rossschweif) statt als schwebende braune Punktwolke */
    pruef('RAKETE',R.furz&&R.furz.steig==='stotter'&&R.furz.eff==='pupswolke'&&R.furz.knall==='furz'&&R.furzfont===0,'Furzrakete: '+J(R.furz)+' furzfont '+R.furzfont); }
  /* FONT */
  { pruef('FONT',J(r.fontZeiten)==='[0,1.5,1.5,5]'&&J(r.fontEin)==='[0,0.5,0,0]'&&r.fontDauer===6,'Phasenzeiten: '+J([r.fontZeiten,r.fontEin,r.fontDauer]));
    pruef('FONT',r.font01.n===1&&r.font01.h>1.4&&r.font01.h<1.7,'Start/hKurve: '+J(r.font01));
    const f=r.font175, Fr=f.fw;
    pruef('FONT',f.h>2.6&&f.h<3.0&&Math.abs(f.st0-0.5)<0.12&&f.st1.length===3&&f.st1.every(s=>Math.abs(s-0.5)<0.12),'Ueberblendung/Hoehe: '+J(f));
    pruef('FONT',J(f.A)===J([Fr.rot,Fr.gruen,Fr.blau])&&J(f.x)==='[-0.4,0,0.4]'&&f.dir[0]>0.1&&f.dir[2]<-0.1&&J(f.hS)==='[2,2,2]','je Duese: '+J(f));
    pruef('FONT',Math.abs(f.kegel-f.kegelSoll)<0.02&&f.uV>0.15&&f.uV<0.45&&Math.abs(f.vz-0.1)<0.01,'kegel/z: '+J(f));
    pruef('FONT',J(r.fontSt2)==='[4,4,4]'&&r.fontEnde.length===3,'hStufen/ende: '+J([r.fontSt2,r.fontEnde]));
    pruef('FONT',r.fontRiesen!==null&&Math.abs(r.fontRiesen-12/10.2)<0.01&&r.fontIgnite===1,'riesen hm / igniteType: '+J([r.fontRiesen,r.fontIgnite])); }
  /* SPEICHER */
  { const d=r.speicher, typen=[...d.shelves[0].levels.map(l=>l.type),...d.racks[0].slots.filter(Boolean).map(s=>s.type),...d.boxes.map(x=>x.type),d.carrying.type,...d.cart.map(x=>x.t),...d.bestellungen[0].pos.map(x=>x.t)];
    pruef('SPEICHER',J(typen)===J(['roemisch','titanraketen','dreiklang','feuerberg','knallbonbon','tischbombe','partypopper','kometen','donnerschlag']) /* 29.09.: bengalduo, sternenbrunnen, tisch gestrichen - Ersatz nach Form/Level (02e ENTFERNT_ERSATZ) */&&d.prices.goldperlen===undefined&&d.prices.roemisch===5&&d.fwZaehler.titanraketen===3&&d.fwZaehler.raketen50===undefined,'Umbuchung: '+J(d)); }
  /* TAG */
  pruef('TAG',r.tag.vor>20&&r.tag.nach===0&&r.tag.andere1>=r.tag.andere0*0.8&&r.tag.andere0>20,'showLoeschen: '+J(r.tag));
  /* HAKEN */
  pruef('HAKEN',r.schussEff.calls===1&&r.schussEff.raketen===0,'SCHUSS_EFF: '+J(r.schussEff));
  pruef('HAKEN',r.par&&r.par.art==='laser'&&r.par.split===2,'EFF bekommt par nicht: '+J(r.par));
  pruef('HAKEN',r.ziel&&Math.abs(r.ziel.t-1.6)<0.06&&Math.hypot(r.ziel.dx,r.ziel.dy,r.ziel.dz)<0.4,'zielSchuss: '+J(r.ziel));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join(' | '):'keine');
  await b.close();
})();
