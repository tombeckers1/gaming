/* Bodenabstand (30.09., Tom: "Explosionen nicht mehr so tief, und die
   Funken treffen die Spielfigur"): Feuerwerke einzeln zuenden, Spieler
   am Zuendpult. Geprueft wird
   - TIEF: kein Luftbruch unter 10,5 m (BRUCH_MIN 11 m)
   - TREFFER: hoechstens 10 Partikel-Bilder mit hellen Sternen in
     Kopfhoehe (0-2,3 m) im Umkreis von 2 m um den Spieler.
   Gegenprobe (vorher): Profi-Verbund Brueche ab 4,9 m, 356 Treffer;
   Weltuntergang 175 Treffer. Aufruf: node bodenabstand.js test.html */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:60000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:640,height:400}}); p.setDefaultTimeout(1500000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await neuesSpiel(p);
  const nur=process.argv[3]&&process.argv[3].startsWith('[')?JSON.parse(process.argv[3]):['profi','finale','zfaecher','miniverbund','glitzerregen12','feuerpfau','legion','kanonade300'];
  const ids=await p.evaluate(nur=>{ const bb=window.__bb,P=bb.P; bb.S.level=99; bb.clock=1300; bb.applyTOD();
    return Object.keys(P).filter(t=>P[t].cat>0&&bb.stationOf(t)&&(!nur||nur.includes(t))); },nur);
  const out=[];
  for(const t of ids){
    const r=await p.evaluate(t=>{ const bb=window.__bb,P=bb.P, PP={x:1.0,z:-11.5+0.9};
      for(let i=0;i<80&&(bb.rockets.length||bb.emittersListe().length||bb.timersLen()>0);i++) bb.run(0.5,0.25);
      bb.setView(PP.x,PP.z,0,0.5);
      const log=[]; bb.fwLog(log); log.brueche=[];
      try{ bb.igniteType(t); }catch(e){ bb.fwLog(null); return {t,fehler:e.message}; }
      const dauer=bb.SHOWS[t]?bb.showLength(t)+8:(bb.brennDauer?Math.min(50,bb.brennDauer(t)+8):20);
      let treffer=0, nah=0, tiefstNah=99;
      for(let s=0;s<dauer;s+=0.1){ bb.run(0.1,0.05);
        for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]){ for(let k=0;k<ps.max;k++){ if(ps.life[k]<=0) continue; const j=k*3, y=ps.pos[j+1]; if(y>6) continue;
          const c=Math.max(ps.col[j],ps.col[j+1],ps.col[j+2]); if(c<0.08) continue;
          const d=Math.hypot(ps.pos[j]-PP.x,ps.pos[j+2]-PP.z);
          if(y<-0.1) continue; if(d<2&&y<2.3){ treffer++; } if(d<5&&y<4){ nah++; tiefstNah=Math.min(tiefstNah,y); } } } }
      bb.fwLog(null);
      const br=log.brueche.map(x=>x.y), sh=log.filter(x=>x.art==='schuss'||x.art==='kugel');
      return {t,lvl:P[t].lvl,st:bb.stationOf(t),minBruch:br.length?+Math.min(...br).toFixed(1):null,medBruch:br.length?+br.sort((a,b)=>a-b)[Math.floor(br.length/2)].toFixed(1):null,nBruch:br.length,treffer,nah,tiefstNah:tiefstNah<99?+tiefstNah.toFixed(2):null,tief:[...new Set(log.brueche.filter(x=>x.y<10).map(x=>x.eff+'@'+x.y.toFixed(0)))].slice(0,6)}; },t);
    out.push(r); console.log(JSON.stringify(r));
  }
  const mangel=[];
  out.forEach(r=>{ if(r.fehler) mangel.push('LAEUFT: '+r.t+' '+r.fehler);
    if(r.minBruch!==null&&r.minBruch<10.5) mangel.push('TIEF: '+r.t+' bricht schon bei '+r.minBruch+' m ('+r.tief.join(',')+')');
    if(r.treffer>10) mangel.push('TREFFER: '+r.t+' '+r.treffer+' Funken-Bilder am Spieler'); });
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join(' | '):'keine');
  await b.close();
})();
