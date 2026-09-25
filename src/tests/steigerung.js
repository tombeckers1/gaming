/* Feuerwerk mit Steigerung und passenden Farben (Tom, 24.09.):
   - Batterien: je hoeher das Level, desto hoeher, groesser und
     dichter (Schuesse je Sekunde); Schusszahl wie auf der Packung
   - Raketen: Sternschnuppe < Sternenflug < Goldflug < Titan
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
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, out={};
    const messe=t=>{ const log=[]; bb.fwLog(log); const pos={x:0,y:0.4,z:-20};
      bb.igniteType(t,pos); const dauer=(bb.SHOWS[t]?bb.showLength(t):20)+10;
      for(let s=0;s<dauer;s+=1) bb.run(1,0.1);
      bb.fwLog(null);
      const sch=log.filter(e=>e.art==='schuss'||e.art==='kugel');
      const hoehen=log.filter(e=>e.art==='schuss').map(e=>e.hoehe), sz=sch.map(e=>e.sz);
      let dichte=0; for(const e of sch){ const n=sch.filter(f=>f.t>=e.t&&f.t<e.t+1).length; dichte=Math.max(dichte,n); }
      const key=c=>c.map(x=>x.toFixed(2)).join(',');
      const farben=new Set(log.filter(e=>e.art==='schuss'&&e.eff!=='regenbogen').map(e=>key(e.A)+'|'+key(e.B)));
      /* Farbpaare, die in keinem Thema stehen = Zufallsbunt */
      const erlaubt=new Set(); Object.values(bb.THEMEN).forEach(T=>T.forEach(([a,c])=>erlaubt.add(key(bb.FW[a])+'|'+key(bb.FW[c]))));
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
      return {unpass:[...new Set(unpass)],maxSz:+Math.max(0,...alle.map(e=>e.groesste||e.sz)).toFixed(3),maxHoehe:+Math.max(0,...alle.map(e=>e.hoehe)).toFixed(2),
        brueche:Math.max(0,...alle.map(e=>e.brueche||1)),fremd,n:sch.length,hoehe:+m(hoehen).toFixed(2),sz:+m(sz).toFixed(3),dichte,farben:farben.size,
        dauer:sch.length?+(sch[sch.length-1].t-sch[0].t).toFixed(1):0,eff:[...new Set(log.map(e=>e.eff).filter(Boolean))]}; };
    for(const t of ['batterie16','knatter','batterie49','faecher','batterie100','zfaecher','kometen','donnerwand','profi','finale','sortiment',
      'raketenklein','raketen','pfeifraketen','raketengold','titanraketen','jumbogold','jumboleiter','sternenbrunnen','vulkan','goldgeysir','feuersaeule','feuerbrunnen',
      'kugel75','kugel100','kugel150','kugel200','kugel300'])
      out[t]=messe(t);
    /* Feuerbrunnen: eigener Bodeneffekt */
    const pos={x:0,y:0.4,z:-20}; bb.igniteType('feuerbrunnen',pos); bb.run(0.3,0.1);
    out.brunnenEmitter=bb.emittersListe().some(e=>e.k==='feuerbrunnen');
    /* neue Effekte einzeln */
    out.neu={}; for(const e of ['flammenregen','kronleuchter','feuerrad','sternschnuppen','farbregen','spektrum','goldglitzer','sternpalme','steigkomet']){
      out.neu[e]=typeof bb.EFF[e]==='function'; try{ bb.shot(pos,{eff:e,sz:1}); bb.run(4,0.1); }catch(x){ out.neu[e]='Fehler '+x.message; } }
    /* Figuren zeigen zum Zuschauer: Ebene senkrecht zur Blickrichtung, aufrecht */
    { const c=bb.camera.position, q={x:c.x+3,y:c.y+18,z:c.z-28}; const [u,v]=bb.basisBlick(q,0);
      const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]], d=[c.x-q.x,c.y-q.y,c.z-q.z], l=Math.hypot(...d);
      out.blick={dot:+Math.abs((n[0]*d[0]+n[1]*d[1]+n[2]*d[2])/l).toFixed(3),auf:+v[1].toFixed(3)}; }
    out.lvl={}; Object.keys(out).forEach(t=>{ if(bb.P[t]) out.lvl[t]=bb.P[t].lvl; });
    return out; });
  const L=['batterie16','knatter','batterie49','faecher','batterie100','zfaecher','kometen','donnerwand','profi','finale'];
  const SOLL={batterie16:16,knatter:30,batterie49:49,faecher:36,batterie100:100,zfaecher:48,kometen:64,donnerwand:120,profi:200,finale:300};
  for(const t of Object.keys(r).filter(k=>r[k]&&r[k].n!==undefined))
    console.log(t.padEnd(14),'lvl',String(r.lvl[t]).padStart(2),'n',String(r[t].n).padStart(3),'hoehe',String(r[t].hoehe).padStart(6),'sz',String(r[t].sz).padStart(6),'dichte',String(r[t].dichte).padStart(2),'farben',String(r[t].farben).padStart(2),'dauer',String(r[t].dauer).padStart(6));
  /* Leiter: nur mit dem letzten Produkt NIEDRIGEREN Levels vergleichen */
  const leiter=(liste,name,feld,tol)=>{ for(let i=1;i<liste.length;i++){ const a=liste[i-1], c=liste[i];
      let v=null; for(let j=i-1;j>=0;j--) if(r.lvl[liste[j]]<r.lvl[c]){ v=liste[j]; break; } if(!v) continue;
      pruef(name,r[c][feld]+tol>=r[v][feld],`${c} (${r[c][feld]}) ${feld} unter ${v} (${r[v][feld]})`); } };
  leiter(L,'HOEHE','hoehe',0.25); leiter(L,'KALIBER','sz',0.01); leiter(L,'DICHTE','dichte',0);
  L.forEach(t=>pruef('ANZAHL',r[t].n===SOLL[t],`${t}: ${r[t].n} statt ${SOLL[t]} Schuss`));
  /* Jumbo »Goldene Krone« steht ueber Titan. Die Himmelsleiter nicht:
     ihr erster Bruch liegt tiefer, sie steigt erst in Stufen hoeher. */
  const R=['raketenklein','raketen','raketengold','titanraketen','jumbogold'];
  leiter(R,'RAKETEN','hoehe',0.25); leiter(R,'RAKETEN','sz',0.01);
  const PROFI=['dahlie','pistill','kamuro','kronleuchter','titan','zehnfach','zeitregen','brokat','sternschnuppen','glitzerweide'];
  Object.keys(r.lvl).forEach(t=>{ if(r.lvl[t]<=15&&t!=='raketengold'){ const f=r[t].eff.filter(e=>PROFI.indexOf(e)>=0); pruef('FRUEH',!f.length,`${t} (Level ${r.lvl[t]}) zeigt schon ${f.join(',')}`); } });
  L.concat(['sortiment','raketenklein','raketen','raketengold']).forEach(t=>{ const max=t==='finale'?18:t==='profi'?12:4;
    pruef('FARBEN',r[t].farben<=max&&r[t].fremd===0,`${t}: ${r[t].farben} Farbpaare, ${r[t].fremd} ausserhalb der Themen - zu bunt`); });
  /* Kugelbomben: jede Stufe groesser, hoeher, mit mehr Bruechen - und
     groesser und hoeher als jeder Batterieschuss bis zu ihrem Level */
  const KG=['kugel75','kugel100','kugel150','kugel200','kugel300'];
  for(let i=0;i<KG.length;i++){ const k=r[KG[i]];
    console.log(KG[i].padEnd(10),'lvl',r.lvl[KG[i]],'groesste',k.maxSz,'hoehe',k.maxHoehe,'brueche',k.brueche);
    if(i){ const v=r[KG[i-1]]; pruef('KUGELLEITER',k.maxSz>v.maxSz&&k.maxHoehe>v.maxHoehe&&k.brueche>v.brueche,`${KG[i]} nicht ueber ${KG[i-1]}: ${JSON.stringify([k.maxSz,k.maxHoehe,k.brueche])} / ${JSON.stringify([v.maxSz,v.maxHoehe,v.brueche])}`); }
    for(const t of L){ if(r.lvl[t]>r.lvl[KG[i]]+1) continue;
      pruef('KUGEL',k.maxSz>r[t].maxSz&&k.maxHoehe>r[t].maxHoehe,`${KG[i]} (Lvl ${r.lvl[KG[i]]}) nicht ueber ${t} (Lvl ${r.lvl[t]}): Groesse ${k.maxSz}/${r[t].maxSz}, Hoehe ${k.maxHoehe}/${r[t].maxHoehe}`); } }
  /* Raketen haben eigene Bruchbilder, die es in Batterien nicht gibt */
  const EXKL=['spektrum','goldglitzer'];
  ['raketenklein','raketen','pfeifraketen','raketengold'].forEach(t=>pruef('RAKETE',r[t].eff.some(e=>EXKL.indexOf(e)>=0),`${t} ohne eigenes Raketen-Bruchbild: ${r[t].eff}`));
  L.concat(['sortiment']).forEach(t=>pruef('EXKLUSIV',!r[t].eff.some(e=>EXKL.indexOf(e)>=0),`${t} nutzt Raketen-Bruchbild`));
  Object.keys(r).forEach(t=>{ if(r[t]&&r[t].unpass) pruef('PASST',!r[t].unpass.length,`${t}: ${r[t].unpass.slice(0,6).join(', ')}`); });
  pruef('BLICK',r.blick.dot>0.99&&r.blick.auf>0.5,'Figur zeigt nicht zum Zuschauer: '+JSON.stringify(r.blick));
  pruef('BRUNNEN',r.brunnenEmitter&&r.feuerbrunnen.eff.indexOf('flammenregen')>=0,'Feuerbrunnen ohne Flammen: '+JSON.stringify(r.feuerbrunnen));
  Object.keys(r.neu).forEach(e=>pruef('NEU',r.neu[e]===true,e+': '+r.neu[e]));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();
