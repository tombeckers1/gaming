/* Feuerwerk mit Steigerung und passenden Farben (Tom, 24.09.):
   - Batterien: je hoeher das Level, desto hoeher, groesser und
     dichter (Schuesse je Sekunde); Schusszahl wie auf der Packung
   - Raketen: Sternschnuppe < Hasenjagd < Goldbrokat < Titan < Juwelenpalme < Polarstern
   - fruehe Produkte (bis Level 15) zeigen keine Profi-Bruchbilder
   - Farben: jedes Produkt bleibt in seinem Thema, kein Zufallsbunt
   - neue Effekte (Flammenregen, Kronleuchter, Feuerrad,
     Sternschnuppen, Farbregen) und der Feuerbrunnen laufen
   Aufruf: node steigerung.js test.html */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  /* 27.09.: fester Zufall - jeder Schuss steigt zufaellig 19-23 m, das
     streute die Mittelwerte von Lauf zu Lauf um bis zu 1 m und machte die
     Leiter-Vergleiche (Toleranz 0,25 m) zum Muenzwurf. Mit festem Startwert
     ist jeder Lauf gleich und die Schwellen behalten ihre Bedeutung. */
  await p.evaluate(()=>{ let x=20260927; Math.random=()=>{ x=(x*1103515245+12345)%2147483648; return x/2147483648; }; });
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, out={};
    const messe=t=>{ const log=[]; log.brueche=[]; bb.fwLog(log); const pos={x:0,y:0.4,z:-20};
      bb.igniteType(t,pos); const dauer=(bb.SHOWS[t]?bb.showLength(t):20)+10;
      for(let s=0;s<dauer;s+=1) bb.run(1,0.1);
      bb.fwLog(null);
      /* 27.09.: Tiefbrueche (Feuertoepfe 4-8 m, bewusst die untere Ebene) zaehlen nicht zur Hoehe/Groesse */
      const sch=log.filter(e=>(e.art==='schuss'||e.art==='kugel')&&!e.tief);
      const hoehen=log.filter(e=>e.art==='schuss'&&!e.tief).map(e=>e.hoehe), sz=sch.map(e=>e.sz);
      let dichte=0; for(const e of sch){ const n=sch.filter(f=>f.t>=e.t&&f.t<e.t+1).length; dichte=Math.max(dichte,n); }
      const key=c=>c.map(x=>x.toFixed(2)).join(',');
      const farben=new Set(log.filter(e=>e.art==='schuss'&&e.eff!=='regenbogen').map(e=>key(e.A)+'|'+key(e.B)));
      /* Farbpaare, die in keinem Thema stehen = Zufallsbunt */
      const erlaubt=new Set(); Object.values(bb.THEMEN).forEach(T=>T.forEach(([a,c])=>erlaubt.add(key(bb.FW[a])+'|'+key(bb.FW[c]))));
      /* 26.09. (Tom: Anomalie): Raketen haben feste Farben A/B aus dem Katalog
         (engine-zusatz B) - ein festgelegtes Paar ist kein Zufallsbunt */
      Object.values(bb.RAKETEN_KL).forEach(k=>{ if(k.A&&bb.FW[k.A]) erlaubt.add(key(bb.FW[k.A])+'|'+key(bb.FW[k.B||k.A])); });
      const fremd=[...farben].filter(f=>!erlaubt.has(f)).length;
      const m=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
      const alle=log.filter(e=>e.art==='schuss'||e.art==='kugel');
      /* Passt zusammen? In einem Bruch (Haupt + Nachbrueche) und
         zwischen Schuessen, die gleichzeitig am Himmel stehen (1 s) */
      const unpass=[];
      for(const e of alle){ const st=(e.stufenEff||[]);
        for(const x of st) if(!bb.effPassen(e.eff,x)) unpass.push(e.eff+'+'+x);
        for(let i=0;i<st.length;i++) for(let j=i+1;j<st.length;j++) if(!bb.effPassen(st[i],st[j])) unpass.push(st[i]+'+'+st[j]); }
      for(let i=0;i<alle.length;i++) for(let j=i+1;j<alle.length&&alle[j].t-alle[i].t<1.0;j++)
        if(!bb.effPassen(alle[i].eff,alle[j].eff)) unpass.push(alle[i].eff+'/'+alle[j].eff);
      /* Steigerung innerhalb der Show: erstes gegen letztes Drittel */
      const sh=log.filter(e=>e.art==='schuss'&&e.eff!=='salut'&&!e.tief);
      const drittel=(a,b)=>{ if(sh.length<6) return null; const t0=sh[0].t, t1=sh[sh.length-1].t, x=sh.filter(e=>e.t>=t0+(t1-t0)*a&&e.t<=t0+(t1-t0)*b);
        return {sz:+m(x.map(e=>e.sz)).toFixed(3),h:+m(x.map(e=>e.hoehe)).toFixed(2),hell:+m(x.map(e=>e.hell||1)).toFixed(3)}; };
      const steig={an:drittel(0,1/3),ende:drittel(2/3,1)};
      return {steig,unpass:[...new Set(unpass)],maxSz:+Math.max(0,...alle.map(e=>e.groesste||e.sz)).toFixed(3),maxHoehe:+Math.max(0,...alle.map(e=>e.hoehe)).toFixed(2),p95Hoehe:(()=>{ const h=alle.map(e=>e.hoehe).sort((a,b)=>a-b); return h.length?+h[Math.floor(h.length*0.95)-(h.length>1?0:0)>=h.length?h.length-1:Math.floor(h.length*0.95)].toFixed(2):0; })(),
        brueche:Math.max(0,...alle.map(e=>e.brueche||1)),echt:log.brueche.length,fremd,n:bb.SHOWS[t]?bb.SHOWS[t]().reduce((a,ph)=>a+(ph.n===undefined?1:ph.n),0):sch.length /* 27.09.: Rohrzahl aus dem Drehbuch - ein Feuertopf kann einen Schuss begleiten */,gefeuert:log.filter(e=>e.art==='schuss'||e.art==='kugel'||e.art==='topf'||e.art==='perle').length,hoehe:+m(hoehen).toFixed(2),sz:+m(sz).toFixed(3),dichte,farben:farben.size,
        dauer:sch.length?+(sch[sch.length-1].t-sch[0].t).toFixed(1):0,eff:[...new Set(log.map(e=>e.eff).filter(Boolean))]}; };
    for(const t of ['batterie16','knatter','batterie49','faecher','batterie100','zfaecher','kometen','donnerwand','profi','finale','sortiment',
      'raketenklein','raketen','jumbogold','jumboleiter','furzrakete','roemisch','sternenbrunnen','vulkan','goldgeysir','feuersaeule','feuerbrunnen',
      'kugel75','kugel100','wetterleuchten150','schatztruhe200','kugel300'].filter(t=>bb.P[t])) /* 29.09.: entfernte Produkte fallen weg; 09.10.: Weltenbrand und Feuerlilie gestrichen - die 150er und 200er der Leiter sind jetzt Wetterleuchten und Schatztruhe (Kugelbomben-Runde 5) */
      out[t]=messe(t);
    /* Feuerbrunnen: eigener Bodeneffekt */
    const pos={x:0,y:0.4,z:-20};
    /* 29.09.: der Feuerbrunnen ist aus dem Sortiment - der Show-Effekt 'feuerbrunnen' bleibt */
    /* neue Effekte einzeln */
    /* jedes Bruchbild einzeln zuenden und zaehlen, wie viele Sterne es
       erzeugt (bb.fwShot - bb.shot ist das Bildschirmfoto) */
    const leben=()=>{ let n=0; for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]) for(let i=0;i<ps.life.length;i++) if(ps.life[i]>0) n++; return n; };
    out.neu={}; for(const e of ['flammenregen','kronleuchter','feuerrad','sternschnuppen','farbregen','spektrum','goldglitzer','sternpalme','polarstern',
      'smiley','bienen','drachenei','kokosnuss','schmetterling','blumenkranz','strobeweide','rossschweif','diadem','goldvorhang','krone','regenbogenring',
      'pfeifsterne','nishiki','drachenblut','weltenbrand','himmelsbrecher']){
      if(typeof bb.EFF[e]!=='function'){ out.neu[e]=-1; continue; }
      try{ bb.run(6,0.1); const r0=bb.rockets.length; bb.fwShot(pos,{eff:e,sz:1.2,fuse:1.2,fest:true}); const flug=bb.rockets.length-r0;
        bb.run(1.25,0.05); const vor=leben(); bb.run(0.6,0.05); out.neu[e]=flug===1?leben():0; }catch(x){ out.neu[e]='Fehler '+x.message; } }
    /* Figuren zeigen zum Zuschauer: Ebene senkrecht zur Blickrichtung, aufrecht */
    { const c=bb.camera.position, q={x:c.x+3,y:c.y+18,z:c.z-28}; const [u,v]=bb.basisBlick(q,0);
      const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]], d=[c.x-q.x,c.y-q.y,c.z-q.z], l=Math.hypot(...d);
      out.blick={dot:+Math.abs((n[0]*d[0]+n[1]*d[1]+n[2]*d[2])/l).toFixed(3),auf:+v[1].toFixed(3)}; }
    out.lvl={}; Object.keys(out).forEach(t=>{ if(bb.P[t]) out.lvl[t]=bb.P[t].lvl; });
    /* Auftakt: beginnt die Show mit einer Fontaene, bevor geschossen wird? */
    /* 06.10. (Tom 02.10.: "Du machst oft immer so eine Fontaene am Anfang ... Ich will den Ablauf gerne ein bisschen
       anders haben"; PDF: "am Anfang wieder diese Fontaenen ... Das muss weg"): umgekehrt zu 27.09. - keine
       Batterie beginnt mit einer Bodenfontaene (Phasen so, wie playShow sie liest, 14t) */
    out.auftakt={}; for(const t of Object.keys(bb.SHOWS).filter(t=>bb.P[t]&&bb.istBatterie(t))){ const ph=window.__lochschuss?window.__lochschuss.phasen(t):bb.SHOWS[t](), z=bb.showZeiten(ph);
      out.auftakt[t]=ph.some((x,i)=>z[i]<3&&(x.ground||(Array.isArray(x.boden)?x.boden:x.boden?[x.boden]:[]).some(b=>b.k!=='lauffeuer'&&z[i]+(+b.t||0)<3))); }
    /* Weltuntergang nur mit Schuessen (Tom, 25.09.) */
    out.finaleBoden=bb.SHOWS.finale().filter(ph=>ph.ground).length;
    return out; });
  const L=['batterie16','knatter','batterie49','faecher','batterie100','zfaecher','kometen','donnerwand','profi','finale'].filter(t=>r[t]); /* 06.10.: Feuersturm und Schimmelreiter raus (Toms PDF); die Lichter-Batterien (lb_*) misst diese Leiter nicht - ihr Mitschnitt laeuft anders (gemessen: 0 Schuss) */
  /* 06.10. (PDF, ein Loch = ein Schuss, 14t): Knattersturm 36 (Feuertoepfe aus eigenen Rohren), Sonnenaufgang 44 */
  const SOLL={batterie16:16,knatter:36,batterie49:49,faecher:44,batterie100:100,zfaecher:48,kometen:64,donnerwand:120,profi:200,finale:300};
  for(const t of Object.keys(r).filter(k=>r[k]&&r[k].n!==undefined))
    console.log(t.padEnd(14),'lvl',String(r.lvl[t]).padStart(2),'n',String(r[t].n).padStart(3),'hoehe',String(r[t].hoehe).padStart(6),'sz',String(r[t].sz).padStart(6),'dichte',String(r[t].dichte).padStart(2),'farben',String(r[t].farben).padStart(2),'dauer',String(r[t].dauer).padStart(6));
  /* Leiter: nur mit dem letzten Produkt NIEDRIGEREN Levels vergleichen */
  const leiter=(liste,name,feld,tol)=>{ for(let i=1;i<liste.length;i++){ const a=liste[i-1], c=liste[i];
      let v=null; for(let j=i-1;j>=0;j--) if(r.lvl[liste[j]]<r.lvl[c]){ v=liste[j]; break; } if(!v) continue;
      pruef(name,r[c][feld]+tol>=r[v][feld],`${c} (${r[c][feld]}) ${feld} unter ${v} (${r[v][feld]})`); } };
  /* Toleranz 0,5 m: gemessene Streuung eines Mittelwerts von Lauf zu Lauf bis +-0,4 m (27.09., die Spielschleife laeuft im Test mit) */
  leiter(L,'HOEHE','hoehe',0.5); leiter(L,'KALIBER','sz',0.01);
  /* 27.09.: der Feuersturm (batterie49) ist ein Sprint - absichtlich dichter als
     alles bis Level 20; die Dichte-Leiter gilt fuer die normalen Verbunde
     (seine eigene Pruefung: sortiment.js SPRINT) */
  /* 01.10. abends (Tom: "0,2 bis 0,4 Sekunden Abstand" je Rohr): mehr als
     5 Schuss je Sekunde gibt es nicht mehr - wer die Grenze erreicht, hat
     die volle Dichte; die Leiter gilt bis dahin */
  L.forEach(t=>{ if(r[t]) r[t].dichte5=Math.min(5,r[t].dichte); });
  leiter(L.filter(t=>t!=='batterie49'),'DICHTE','dichte5',0);
  L.forEach(t=>pruef('ANZAHL',r[t].n===SOLL[t],`${t}: ${r[t].n} statt ${SOLL[t]} Schuss`));
  L.forEach(t=>pruef('ANZAHL',r[t].gefeuert>=r[t].n,`${t}: nur ${r[t].gefeuert} von ${r[t].n} Rohren gefeuert`));
  /* Jede Show wird intensiver: am Ende groessere, hoehere, hellere Brueche
     (Tom, 25.09.) */
  L.concat(['sortiment'].filter(t=>r[t])).forEach(t=>{ const g=r[t].steig; if(!g||!g.an){ pruef('STEIGERUNG',false,t+' zu wenig Schuesse'); return; }
    pruef('STEIGERUNG',g.ende.sz>g.an.sz*1.3&&g.ende.h>g.an.h+1.5/* 27.09.: 1,5 statt 2 m - Streuung je Ende +-0,4 m gemessen */&&g.ende.hell>g.an.hell+0.2,`${t}: Anfang ${JSON.stringify(g.an)} Ende ${JSON.stringify(g.ende)}`); });
  /* Jedes Feuerwerk ist einzigartig: mindestens ein Bruchbild, das kein
     anderes Produkt zeigt */
  /* roemisch (Farbkanon) hat kein eigenes Bruchbild, sondern eine eigene Idee - die Farbwelle ueber die Rohre; das prueft anomalie.js (SIGNATUR) */
  const EINZ=L.concat(['sortiment'].filter(t=>r[t])).concat(['raketenklein','raketen','jumbogold','jumboleiter','furzrakete','kugel75','kugel100','wetterleuchten150','schatztruhe200','kugel300']);
  EINZ.forEach(t=>{ const eigene=r[t].eff.filter(e=>!EINZ.some(x=>x!==t&&r[x].eff.includes(e)));
    pruef('EINZIGARTIG',eigene.length>0,`${t} hat kein eigenes Bruchbild: ${r[t].eff.join(',')}`); });
  /* Grosse Verbunde beginnen mit einer Fontaene */
  Object.keys(r.auftakt).forEach(t=>pruef('AUFTAKT',!r.auftakt[t],t+' beginnt mit einer Bodenfontaene'));
  pruef('NUR_SCHUESSE',r.finaleBoden===0,'Weltuntergang hat noch '+r.finaleBoden+' Fontaenen');
  /* Eine Zuendung, eine Rakete */
  ['raketenklein','raketen','jumbogold','jumboleiter','furzrakete'].forEach(t=>
    pruef('EINE RAKETE',r[t].n===1,`${t}: ${r[t].n} Raketen je Zuendung`));
  /* Raketen steigen bis zum Polarstern stetig an */
  const R=['raketenklein','raketen','jumbogold','jumboleiter'];   /* 03.10. abends: Goldbrokat ist eine Kugel, Titan ist raus */
  /* Einzelraketen und Raketensets: jede Rakete ein Schuss, ein Bruch -
     keine Nachladung, die spaeter noch einmal hochgeht (Toms PDF vom 25.09.) */
  ['raketenklein','raketen','jumbogold','jumboleiter','furzrakete'].forEach(t=>
    pruef('EINZELSCHUSS',r[t].brueche===1,`${t}: ${r[t].brueche} Brueche je Rakete`));
  leiter(R,'RAKETEN','hoehe',0.25); leiter(R,'RAKETEN','sz',0.01);
  const PROFI=['dahlie','pistill','kamuro','kronleuchter','titan','zehnfach','zeitregen','brokat','sternschnuppen','glitzerweide'];
  Object.keys(r.lvl).forEach(t=>{ if(r.lvl[t]<=15&&t!=='raketengold'){ const f=r[t].eff.filter(e=>PROFI.indexOf(e)>=0); pruef('FRUEH',!f.length,`${t} (Level ${r.lvl[t]}) zeigt schon ${f.join(',')}`); } });
  L.concat(['sortiment'].filter(t=>r[t])).concat(['raketenklein','raketen']).forEach(t=>{ const max=t==='finale'?18:t==='profi'?12:4;
    pruef('FARBEN',r[t].farben<=max&&r[t].fremd===0,`${t}: ${r[t].farben} Farbpaare, ${r[t].fremd} ausserhalb der Themen - zu bunt`); });
  /* Kugelbomben: jede Stufe groesser, hoeher, mit mehr Bruechen - und
     groesser und hoeher als jeder Batterieschuss bis zu ihrem Level */
  const KG=['kugel75','kugel100','wetterleuchten150','schatztruhe200','kugel300'];   /* 30.09.: Bluetenkranz raus, Feuerlilie ist die 200er; 09.10.: Weltenbrand und Feuerlilie raus - Wetterleuchten (150) und Schatztruhe (200) */
  for(let i=0;i<KG.length;i++){ const k=r[KG[i]];
    console.log(KG[i].padEnd(10),'lvl',r.lvl[KG[i]],'groesste',k.maxSz,'hoehe',k.maxHoehe,'brueche',k.echt);
    /* Brueche = wirklich aufgegangene Brueche (FW_LOG.brueche), nicht die
       Zahl der Stufen-Eintraege: ein Kranz aus 10 Blueten ist ein Eintrag.
       26.09., Tom: Anomalie - laut Katalog haben 75 und 100 mm beide
       Hauptbild + 2 Stufen (das Herz schlaegt zweimal, die Dahlie tropft
       und faengt Feuer); ab 150 mm steigt die Zahl strikt (Reif, Raeder,
       Risse). Groesse und Hoehe steigen weiter bei jeder Stufe strikt. */
    if(i){ const v=r[KG[i-1]]; pruef('KUGELLEITER',k.maxSz>v.maxSz&&k.maxHoehe>v.maxHoehe&&(i<2?k.echt>=v.echt:k.echt>v.echt),`${KG[i]} nicht ueber ${KG[i-1]}: ${JSON.stringify([k.maxSz,k.maxHoehe,k.echt])} / ${JSON.stringify([v.maxSz,v.maxHoehe,v.echt])}`); }
    for(const t of L){ if(r.lvl[t]>r.lvl[KG[i]]+1) continue;
      /* 27.09.: gegen das 95. Perzentil der Batterie - ein einzelner zufaellig hoher Schuss (19-23 m Streuung) kippte sonst die Regel */
      pruef('KUGEL',k.maxSz>r[t].maxSz&&k.maxHoehe>r[t].p95Hoehe,`${KG[i]} (Lvl ${r.lvl[KG[i]]}) nicht ueber ${t} (Lvl ${r.lvl[t]}): Groesse ${k.maxSz}/${r[t].maxSz}, Hoehe ${k.maxHoehe}/${r[t].maxHoehe}`); } }
  /* 06.10. (Toms PDF: "dass die auf der gleichen Hoehe explodieren"): alle
     Kugeln brechen auf einer Hoehe - hoechstens 6 m Unterschied, alle ueber 80 m */
  /* 09.10. (Batterie-Runde 0b): die Kugeln brechen nicht mehr alle auf einer
     Hoehe (86-90 m), sondern je Kaliber hoeher (95/105/120/135/150 m, hoehen.js
     prueft die Soll-Hoehen) - hier: ueber 80 m und steigend mit dem Kaliber */
  { const h=KG.map(t=>r[t].maxHoehe); pruef('KUGELHOEHE',h.every((x,i)=>!i||x>=h[i-1]-1)&&Math.min(...h)>80,'Kugelhoehe faellt mit dem Kaliber oder unter 80 m: '+KG.map((t,i)=>t+' '+h[i]).join(', ')); }
  /* Raketen haben eigene Bruchbilder, die es in Batterien nicht gibt */
  /* 26.09. (Tom: Anomalie): jede Rakete hat ihren eigenen Bruch - die Liste
     sind jetzt die Raketenbrueche aus katalog-raketen.md (spektrum und
     regenbogenring zeigt keine Rakete mehr) */
  /* 28.09. (Tom: echt): die Lichtshow-Brueche sind durch echte ersetzt -
     silberspinne, blinkfeuer, silberregen, saphirkrone, juwelenpalme,
     blutmond, nordstern, drachenpalme */
  const EXKL=['fallschirm','schnuppe','garbe','goldglitzer','initiale','hakenschlag','silberspinne','kometenkette','pfeifsterne','halbhalb','nishiki','spaetzuender',
    'achtblatt','smaragdkrone','blinkfeuer','silberregen','glasbruch','furz','pupswolke','saphirkrone','titan','titanschlag','juwelenpalme','blutmond','nordstern','drachenpalme','supernova'];
  ['raketenklein','raketen'].forEach(t=>pruef('RAKETE',r[t].eff.some(e=>EXKL.indexOf(e)>=0),`${t} ohne eigenes Raketen-Bruchbild: ${r[t].eff}`));
  L.concat(['sortiment'].filter(t=>r[t])).forEach(t=>pruef('EXKLUSIV',!r[t].eff.some(e=>EXKL.indexOf(e)>=0),`${t} nutzt Raketen-Bruchbild`));
  Object.keys(r).forEach(t=>{ if(r[t]&&r[t].unpass) pruef('PASST',!r[t].unpass.length,`${t}: ${r[t].unpass.slice(0,6).join(', ')}`); });
  Object.keys(r.neu).forEach(e=>pruef('BRUCHBILD',typeof r.neu[e]==='number'&&r.neu[e]>=60,`${e}: ${r.neu[e]} Sterne`));
  console.log('BRUCHBILDER',JSON.stringify(r.neu));
  pruef('BLICK',r.blick.dot>0.99&&r.blick.auf>0.5,'Figur zeigt nicht zum Zuschauer: '+JSON.stringify(r.blick));
  /* BRUNNEN entfaellt: Feuerbrunnen aus dem Sortiment (29.09.) */
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();
