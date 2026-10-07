/* Themen-Batterien (06.10., Tom im PDF: "10 neue Batterien ... Kirschbluete
   als Referenz ... themenbasierte Batterien, unterschiedliche Level";
   dazu "jeder Schuss ist ja logischerweise ein Loch").
   Prueft die zehn Batterien aus 02f/14v/04h in der Feuerwerk-Vorfuehrung:
   - PRODUKT: im Katalog, Level wie geplant, Lizenz und Warengruppe,
     in der Vorfuehrungsliste, Name "<Thema> · N Schuss <Text>"
   - LOCH: Zahl im Namen = Rohre = gezuendete Lichter; jedes Rohr genau
     einmal, kein Schuss ohne Rohr; keine breite Fontaene / Kometenfaecher
     (lKometenFaecher, breitBoden, kfKomet) und kein Mehrkometen-Licht
     aus einem Rohr; hoechstens ein kleines Fontaenen-Modul
   - OPENER: der erste Abschnitt ist keine Fontaene
   - FOLGE: eigene Rohrfolge (nicht Reihe fuer Reihe von links), jede
     Batterie eine andere
   - STEIGERUNG: von Level zu Level nie niedriger, nie kuerzer, nie
     weniger Schuss, nie kleiner (Hoehe p90 der Sterne, Dauer, Schuss,
     groesste Breite) - Toleranzen 0,5 m / 1 s / 10 %
   - VERPACKUNG: eigene Form je Produkt, am Handy hoechstens 550 Dreiecke
   Aufruf: node -r ./ladezeit-preload.js themen.js real.html
   GEGEN=1: Gegenprobe - Lavendelfeld bekommt einen Kometenfaecher aus
   einem Rohr und Herbstlaub (bis 07.10. Vollmond) einen Fontaenen-Opener; LOCH und OPENER muessen
   anschlagen (06.10.: Lavendelfeld Name 18 / Rohre 19 / breitjade,
   Vollmond 2 Module und Opener - angeschlagen). */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
/* 07.10. (Toms Test V117): Vollmond, Lagune und Gletscher sind gestrichen */
const PLAN={lb_tautropfen:4,lb_zitronenfalter:7,lb_lavendelfeld:9,lb_herbstlaub:12,lb_kolibri:14,lb_sonnenblumen:20,lb_vulkan:25};
const MEHRFACH=['kometenfaecher','zwillingskomet','drillingskomet','weidenfaecher','goldfaecher','farbweidenfaecher','wassertor','dreifachtor','torbogen'];
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:240000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:60000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:60000});
}
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}}); p.setDefaultTimeout(1800000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:240000});
  await neuesSpiel(p);
  const mangel=[]; const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  if(process.env.GEGEN) await p.evaluate(()=>{ const S=window.__bb.SHOWS;
    const a=S.lb_lavendelfeld, b=S.lb_herbstlaub;
    S.lb_lavendelfeld=()=>{ const x=a(); const y=x.slice(); Object.assign(y,x); y.splice(1,0,{n:1,rohrFolge:[0],licht:'breitjade',th:'lb_lavendelfeld',farbe:0,pause:2}); return y; };
    S.lb_herbstlaub=()=>{ const x=b(); const y=x.slice(); Object.assign(y,x); y.unshift({n:0,boden:{k:'fountain',gt:4,gh:1}}); return y; }; });
  const VGL=(process.env.VGL||'').split(',').filter(Boolean);
  const r=await p.evaluate(({PLAN,MEHRFACH,VGL})=>{ const bb=window.__bb, P=bb.P, out={prod:{},folgen:{}};
    bb.S.level=99;
    /* Zaehler fuer Kometenfaecher und Fontaenen-Module: greift nur, wenn die
       Funktionen ueber window erreichbar sind (im Bau sind sie es nicht -
       Gegenprobe 06.10.: 0 gezaehlt). Darum zusaetzlich die Drehbuch-Pruefung
       unten (breit*-Lichter, Boden ohne alt = BREIT_BODEN-Faecher) */
    const Z={kff:0,bb:0,kf:0};
    for(const [f,k] of [['lKometenFaecher','kff'],['breitBoden','bb'],['kfKomet','kf']]){ const alt=window[f]; if(typeof alt==='function') window[f]=function(){ Z[k]++; return alt.apply(this,arguments); }; }
    const vf=bb.fwTestProdukte();
    bb.vorfuehrungAn(); bb.run(0.5,0.1);
    for(const t of Object.keys(PLAN).concat(VGL)){ const x=P[t], o={}; out.prod[t]=o; if(!x){ o.fehlt=true; continue; }
      o.lvl=x.lvl; o.name=x.name; o.liz=bb.LIZENZEN.some(l=>l.items.indexOf(t)>=0&&l.lvl<=x.lvl); o.gruppe=(bb.GRUPPE.batterien||[]).indexOf(t)>=0; o.vf=vf.indexOf(t)>=0;
      const m=/^[^·]+ · (\d+) Schuss \S/.exec(x.name||''); o.nameZahl=m?+m[1]:null;
      const L=bb.rohrLayout(t); o.rohre=L.rohre.length; o.module=L.module.length;
      o.folge=L.folge.slice(); out.folgen[t]=L.folge.join(',');
      /* Standard-Schlange: Reihe fuer Reihe von links */
      const std=L.rohre.map((q,i)=>i).sort((a,c)=>L.rohre[a].row-L.rohre[c].row||(L.rohre[a].row%2?L.rohre[c].col-L.rohre[a].col:L.rohre[a].col-L.rohre[c].col));
      let gleich=0; for(let i=0;i<std.length;i++) if(std[i]===L.folge[i]) gleich++; o.stdAnteil=+(gleich/std.length).toFixed(2);
      const ph=bb.SHOWS[t](); o.opener=!!(ph[0]&&(ph[0].boden||ph[0].ground||(ph[0].licht&&/^breit/.test(ph[0].licht))||!ph[0].n));
      /* Zuenden wie Tom: Vorfuehrung */
      bb.vfStopp(); bb.run(0.5,0.1);
      Z.kff=Z.bb=Z.kf=0; const log=[]; log.brueche=[]; bb.fwLog(log); bb.ROHR_LOG=[];
      const t0=bb.fwUhr; bb.vfZuenden(t); const D=bb.brennDauer(t);
      const y0=0.93, hs=[], ws=[]; let peak=0, x0=null;
      for(let s=0;s<D+4;s+=0.25){ bb.run(0.25,0.05); let n=0;
        for(const ps of [bb.psHuge,bb.psBig]) for(let i=0;i<ps.max;i++){ if(ps.life[i]<=0||ps.tag[i]===0) continue; const y=ps.pos[i*3+1]; if(y<8) continue; n++; if((i&3)===0){ hs.push(y-y0); if(x0!==null) ws.push(Math.abs(ps.pos[i*3]-x0)); } }
        if(x0===null&&bb.ROHR_LOG&&bb.ROHR_LOG.length){ const q=bb.ROHR_LOG.find(e=>e.i>=0); if(q) x0=q.x; }
        peak=Math.max(peak,n); }
      const RL=bb.ROHR_LOG||[]; bb.ROHR_LOG=null; bb.fwLog(null);
      const ri=RL.filter(e=>e.prod===t&&e.i>=0).map(e=>e.i);
      o.gezuendet=ri.length; o.rohreEinzig=new Set(ri).size; o.ohneRohr=RL.filter(e=>e.prod===t&&e.i<0).length; o.modulEv=RL.filter(e=>e.prod===t&&e.modul!==undefined).length;
      const L2=log.filter(e=>e.art==='perle'&&/^licht:/.test(e.eff||'')); o.lichter=L2.length; o.lichtTypen=[...new Set(L2.map(e=>e.eff.slice(6)))];
      o.mehrfach=o.lichtTypen.filter(e=>MEHRFACH.indexOf(e)>=0||/^breit/.test(e));
      o.kff=Z.kff; o.bb=Z.bb; o.kf=Z.kf;
      /* Drehbuch: breite Fontaene aus dem Modul (Boden ohne alt wird per
         BREIT_BODEN zum Kometenfaecher) oder breit*-Licht aus einem Rohr */
      o.bb+=ph.filter(q=>[].concat(q.boden||[]).some(x=>['fountain','volcano','torte','farbtorte','knisterbrunnen'].indexOf(x.k)>=0&&!x.alt)).length;
      o.kff+=ph.filter(q=>q.licht&&/^breit/.test(q.licht)).length;
      hs.sort((a,c)=>a-c); ws.sort((a,c)=>a-c);
      o.h90=hs.length?+hs[Math.floor(hs.length*0.9)].toFixed(1):0; o.hMax=hs.length?+hs[hs.length-1].toFixed(1):0;
      o.breite=ws.length?+(2*ws[Math.floor(ws.length*0.9)]).toFixed(1):0; o.peak=peak; o.dauer=+bb.showLength(t).toFixed(1);
      /* Verpackung */
      o.form=!!bb.VP_FORM[t];
      window.__wareSpar=true; window.__wareStufe=undefined; try{ const q=bb.buildProduct(t); o.triHandy=Math.round(q.reduce((n,x)=>n+(x.geo.index?x.geo.index.count:x.geo.attributes.position.count)/3,0)); }catch(e){ o.triHandy='Fehler '+e.message; } window.__wareSpar=undefined;
      try{ const q=bb.buildProduct(t); o.triPC=Math.round(q.reduce((n,x)=>n+(x.geo.index?x.geo.index.count:x.geo.attributes.position.count)/3,0)); }catch(e){ o.triPC='Fehler '+e.message; }
    }
    bb.vfStopp(); return out; },{PLAN,MEHRFACH,VGL});
  const ids=Object.keys(PLAN);
  console.log('id                 L  Schuss Rohre Lichter Modul H90  Hmax Breite Peak Dauer Std  Handy  PC   Lichter');
  for(const t of ids){ const o=r.prod[t]; if(o.fehlt){ pruef('PRODUKT',false,t+' fehlt'); continue; }
    console.log(t.padEnd(18),String(o.lvl).padStart(2),String(o.nameZahl).padStart(6),String(o.rohre).padStart(5),String(o.lichter).padStart(7),String(o.module).padStart(5),String(o.h90).padStart(5),String(o.hMax).padStart(5),String(o.breite).padStart(6),String(o.peak).padStart(5),String(o.dauer).padStart(5),String(o.stdAnteil).padStart(5),String(o.triHandy).padStart(6),String(o.triPC).padStart(5),' '+o.lichtTypen.join(','));
    pruef('PRODUKT',o.lvl===PLAN[t],t+' Level '+o.lvl+' statt '+PLAN[t]);
    pruef('PRODUKT',o.liz&&o.gruppe,t+' ohne Lizenz/Warengruppe');
    pruef('PRODUKT',o.vf,t+' nicht in der Vorfuehrung');
    pruef('PRODUKT',o.nameZahl!==null,t+' Name ohne "N Schuss": '+o.name);
    pruef('LOCH',o.nameZahl===o.rohre&&o.rohre===o.lichter&&o.gezuendet===o.rohre,`${t}: Name ${o.nameZahl}, Rohre ${o.rohre}, Lichter ${o.lichter}, gezuendet ${o.gezuendet}`);
    pruef('LOCH',o.rohreEinzig===o.rohre&&o.ohneRohr===0,`${t}: ${o.rohreEinzig} verschiedene Rohre fuer ${o.gezuendet} Schuss, ${o.ohneRohr} ohne Rohr`);
    pruef('LOCH',!o.kff&&!o.bb&&!o.kf&&!o.mehrfach.length,`${t}: Kometenfaecher ${o.kff}, breitBoden ${o.bb}, Faecherkometen ${o.kf}, Mehrfach-Lichter ${o.mehrfach.join(',')}`);
    pruef('LOCH',o.module<=1&&o.modulEv<=1,`${t}: ${o.module} Fontaenen-Module`);
    pruef('OPENER',!o.opener,t+' beginnt mit einer Fontaene');
    pruef('FOLGE',o.stdAnteil<0.5,`${t}: Rohrfolge zu ${Math.round(o.stdAnteil*100)} % die Standard-Schlange`);
    pruef('VERPACKUNG',o.form&&typeof o.triHandy==='number'&&o.triHandy<=550&&typeof o.triPC==='number',`${t}: Form ${o.form}, Handy ${o.triHandy}, PC ${o.triPC}`);
  }
  /* VGL=id,id: bestehende Batterien zum Vergleich messen (nur Ausgabe) */
  for(const t of VGL){ const o=r.prod[t]; if(!o||o.fehlt) continue; console.log('VGL',t.padEnd(20),'L'+o.lvl,'Rohre',o.rohre,'Lichter',o.lichter,'H90',o.h90,'Hmax',o.hMax,'Breite',o.breite,'Peak',o.peak,'Dauer',o.dauer); }
  const fl=ids.map(t=>r.folgen[t]); pruef('FOLGE',new Set(fl).size===fl.length,'zwei Batterien mit derselben Rohrfolge');
  for(let i=1;i<ids.length;i++){ const a=r.prod[ids[i-1]], c=r.prod[ids[i]]; if(a.fehlt||c.fehlt) continue;
    pruef('STEIGERUNG',c.h90+0.5>=a.h90,`${ids[i]} Hoehe ${c.h90} unter ${ids[i-1]} ${a.h90}`);
    pruef('STEIGERUNG',c.dauer+1>=a.dauer,`${ids[i]} Dauer ${c.dauer} unter ${ids[i-1]} ${a.dauer}`);
    pruef('STEIGERUNG',c.rohre>a.rohre,`${ids[i]} ${c.rohre} Schuss, ${ids[i-1]} ${a.rohre}`);
    pruef('STEIGERUNG',c.breite*1.1>=a.breite,`${ids[i]} Breite ${c.breite} unter ${ids[i-1]} ${a.breite}`); }
  console.log('MANGEL:',mangel.length?mangel.length+' '+mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).slice(0,40).join(' | '):'keine');
  await b.close();
})();
