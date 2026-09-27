/* Anomalie (Tom, 26.09. nachts): "jede Batterie, jede Kugelbombe, jede
   Rakete eine Anomalie - alles einzigartig, eigene Reihenfolge, der
   Name passt; nicht immer links nach rechts". Der Test zuendet JEDES
   Feuerwerksprodukt und zeichnet auf, was wirklich passiert:
   Bruchbilder, Aufstiege, Winkelfolge, Boden-Emitter, Takt.
   - LAEUFT: jedes Produkt brennt ohne Fehler ab und zeigt etwas
   - EINZIG: keine zwei Produkte derselben Klasse haben denselben
     Fingerabdruck; Aehnlichkeit (Effekte + Ablauf) unter der Grenze
   - RAKETE: je Zuendung genau eine Rakete, jede Rakete eigener Bruch
     und eigener Aufstieg
   - KUGEL: jede Kugelsorte eigenes Hauptbild
   - SCHWENK: links->rechts / rechts->links (fan) ist die Ausnahme:
     hoechstens eine Phase je Show, unter 15 % aller Phasen
   - REGELN: kein Muster zweimal hintereinander, Anfang und Ende
     abwechslungsreich, Ebenen und Boden ab Level 12/16, Tempoklassen
   - FIGUREN: Regenbogen und Sternfiguren nur sparsam
   - SIGNATUR: jedes Produkt hat eine eigene Signatur (SIGNATUR[id])
   - STEIGERUNG: Grundstufe steigt mit dem Level */
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
  const p=await b.newPage({viewport:{width:900,height:600}}); p.setDefaultTimeout(1500000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const nur=process.argv[3]?JSON.parse(process.argv[3]):null;
  /* je Produkt ein eigener Aufruf: sonst laeuft ein einziger Aufruf
     ueber eine halbe Stunde und reisst das Zeitlimit */
  const ids0=await p.evaluate(nur=>{ const bb=window.__bb, P=bb.P; bb.S.level=99; bb.S.money=9e6; window.__stille=0;
    return Object.keys(P).filter(t=>P[t].cat>0&&(!nur||nur.includes(t))); },nur);
  const r={prod:{},fehler:{},shows:{},FIG:['stern','herz','schneeflocke','smiley','schmetterling','saturn','regenbogen']};
  for(const t of ids0){
    const x=await p.evaluate(t=>{ const bb=window.__bb, P=bb.P;
      const klasse=t=>{ const x=P[t]; if(bb.SHOWS[t]) return 'show'; if(x.shape==='rocketset') return 'rakete'; if(x.shape==='shell') return 'kugel';
        if(/fountain|cylinder/.test(x.shape)&&x.cat===2) return 'fontaene'; return 'klein'; };
      /* Himmel leeren: alle Raketen, Emitter und Partikel des Vorgaengers ausbrennen lassen */
      for(let i=0;i<60&&(bb.rockets.length||bb.emittersListe().length||bb.timersLen()>0);i++) bb.run(0.5,0.25);
      const log=[]; bb.fwLog(log); const t0=bb.fwUhr; const gesehen=new Set(bb.emittersListe()); const emi=[];
      try{ bb.igniteType(t); }catch(e){ bb.fwLog(null); return {fehler:e.message}; }
      const dauer=bb.SHOWS[t]?bb.showLength(t)+3:(bb.brennDauer?Math.min(45,bb.brennDauer(t)+3):15);
      for(let s=0;s<dauer;s+=0.25){ bb.run(0.25,0.125); for(const e of bb.emittersListe()){ if(!gesehen.has(e)){ gesehen.add(e); emi.push([+(bb.fwUhr-t0).toFixed(1),e.k]); } } }
      bb.fwLog(null);
      const sh=log.filter(x=>x.art==='schuss'||x.art==='kugel').map(x=>({t:+(x.t-t0).toFixed(2),eff:x.eff,ang:x.ang||0,steig:x.steig||null,stufen:x.stufenEff||[],x:x.x}));
      const out={prod:{k:klasse(t),lvl:P[t].lvl,name:P[t].name,sh,emi:emi.filter(e=>e[1]!=='fuse'),sig:bb.SIGNATUR&&bb.SIGNATUR[t]?JSON.stringify(bb.SIGNATUR[t]):null}};
      if(bb.SHOWS[t]){ const ph=bb.SHOWS[t]();
        out.show={lvl:P[t].lvl,basis:ph.basis||null,ph:ph.map(x=>({n:x.n===undefined?1:x.n,m:x.muster||(x.fan?(x.ang<0?'rfan':'fan'):x.vfan?'vfan':(x.perle?'perle':'gerade')),mit:!!x.mit||x.at!==undefined,boden:!!(x.boden||x.ground),gap:x.takt?Math.min(...x.takt):(x.gap===undefined?0.45:x.gap),eff:Array.isArray(x.eff)?x.eff:[x.eff||x.bombEff||x.perleEff||(x.perle?'perle':'?')]}))}; }
      return out; },t);
    if(x.fehler){ r.fehler[t]=x.fehler; continue; }
    r.prod[t]=x.prod; if(x.show) r.shows[t]=x.show;
    if(process.env.ANOM_LAUT) console.log('..',t,x.prod.sh.length,'Schuss',x.prod.emi.length,'Emitter');
  }
  const PR=r.prod, ids=Object.keys(PR);
  Object.entries(r.fehler).forEach(([t,e])=>pruef('LAEUFT',false,t+': '+e));
  /* LAEUFT: jedes Produkt zeigt etwas (Schuss oder Emitter); Kleinfeuerwerk darf eigene Wege haben */
  const leer=ids.filter(t=>PR[t].k!=='klein'&&!PR[t].sh.length&&!PR[t].emi.length);
  pruef('LAEUFT',!leer.length,'zeigt nichts: '+leer.join(', '));
  /* Fingerabdruck: Effekt-Menge, Aufstiege, Emitter, Winkelfolge, Takt */
  const tok=x=>{ const a=Math.abs(x.ang); return x.eff+'|'+(a<0.05?'s':(x.ang<0?'l':'r')+(a>0.35?'2':'1')); };
  const fp=t=>{ const q=PR[t]; return {eff:new Set(q.sh.map(x=>x.eff).concat(q.sh.flatMap(x=>x.stufen))),steig:new Set(q.sh.map(x=>x.steig).filter(Boolean)),emi:new Set(q.emi.map(e=>e[1])),seq:q.sh.map(tok)}; };
  const jac=(A,B)=>{ const u=new Set([...A,...B]); if(!u.size) return 1; let s=0; A.forEach(x=>{ if(B.has(x)) s++; }); return s/u.size; };
  const lcs=(a,b)=>{ if(!a.length||!b.length) return a.length===b.length?1:0; const n=Math.min(a.length,160), m=Math.min(b.length,160); let prev=new Array(m+1).fill(0);
    for(let i=1;i<=n;i++){ const cur=[0]; for(let j=1;j<=m;j++) cur[j]=a[i-1]===b[j-1]?prev[j-1]+1:Math.max(prev[j],cur[j-1]); prev=cur; } return prev[m]/Math.max(n,m); };
  const FP={}; ids.forEach(t=>FP[t]=fp(t));
  const sim=(a,b)=>{ const A=FP[a],B=FP[b]; const ja=jac(new Set([...A.eff,...A.steig,...A.emi]),new Set([...B.eff,...B.steig,...B.emi])); return 0.5*ja+0.5*lcs(A.seq,B.seq); };
  const GRENZE={show:0.45,rakete:0.5,kugel:0.5,fontaene:0.55,klein:0.6};
  const paare=[];
  for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++){ const a=ids[i],c=ids[j]; if(PR[a].k!==PR[c].k) continue;
    const s=sim(a,c); if(s>=GRENZE[PR[a].k]) paare.push(a+'~'+c+' '+s.toFixed(2)); }
  pruef('EINZIG',!paare.length,paare.length+' zu aehnliche Paare: '+paare.slice(0,25).join(', '));
  /* Raketen */
  const rak=ids.filter(t=>PR[t].k==='rakete'), rEff={}, rSteig={};
  rak.forEach(t=>{ const n=PR[t].sh.length; pruef('RAKETE',n===1,t+': '+n+' Raketen je Zuendung'); const q=PR[t].sh[0]; if(!q) return;
    (rEff[q.eff]=rEff[q.eff]||[]).push(t); (rSteig[q.steig||'?']=rSteig[q.steig||'?']||[]).push(t); });
  Object.entries(rEff).filter(([e,l])=>l.length>1).forEach(([e,l])=>pruef('RAKETE',false,'gleicher Bruch '+e+': '+l.join(',')));
  Object.entries(rSteig).filter(([e,l])=>l.length>1).forEach(([e,l])=>pruef('RAKETE',false,'gleicher Aufstieg '+e+': '+l.join(',')));
  /* Kugeln: Hauptbild = erster Kugel-Schuss */
  const kug=ids.filter(t=>PR[t].k==='kugel'), kEff={};
  kug.forEach(t=>{ const q=PR[t].sh[0]; if(q) (kEff[q.eff]=kEff[q.eff]||[]).push(t); });
  Object.entries(kEff).filter(([e,l])=>l.length>1).forEach(([e,l])=>pruef('KUGEL',false,'gleiches Hauptbild '+e+': '+l.join(',')));
  /* Show-Regeln */
  const SH=r.shows, sids=Object.keys(SH); let fanPh=0, alle=0; const anf={}, ende={};
  sids.forEach(t=>{ const s=SH[t], ph=s.ph.filter(x=>x.n>0);
    const fans=ph.filter(x=>x.m==='fan'||x.m==='rfan').length; fanPh+=fans; alle+=ph.length;
    pruef('SCHWENK',fans<=1,t+': '+fans+' Schwenk-Phasen');
    const seq=ph.filter(x=>!x.mit).map(x=>x.m); for(let i=1;i<seq.length;i++) if(seq[i]===seq[i-1]&&seq[i]!=='perle'&&seq[i]!=='gerade'){ pruef('REGELN',false,t+': Muster '+seq[i]+' zweimal hintereinander'); break; }
    if(ph.length){ const a=ph[0].eff[0]+'/'+ph[0].m; (anf[a]=anf[a]||[]).push(t); const l=ph[ph.length-1]; const e=(l.gap<0.15?'salve:':'')+l.eff.join('+'); (ende[e]=ende[e]||[]).push(t); }
    if(s.lvl>=12&&ph.length>2) pruef('REGELN',s.ph.some(x=>x.mit||x.boden),t+' (L'+s.lvl+'): keine zweite Ebene');
    if(s.lvl>=16&&ph.length>2) pruef('REGELN',s.ph.some(x=>x.boden)||PR[t]&&PR[t].emi.length>0,t+' (L'+s.lvl+'): kein Boden/Fontaene in der Show');
    const kl=new Set(ph.map(x=>x.gap<0.15?0:x.gap<0.4?1:x.gap<0.9?2:3)); if(ph.length>2) pruef('REGELN',kl.size>=(s.lvl>=14?3:2),t+': nur '+kl.size+' Tempoklassen');
  });
  pruef('SCHWENK',!alle||fanPh/alle<0.15,'Schwenk-Anteil '+(100*fanPh/Math.max(1,alle)).toFixed(0)+' %');
  Object.entries(anf).filter(([a,l])=>l.length>3).forEach(([a,l])=>pruef('REGELN',false,'gleicher Anfang '+a+': '+l.join(',')));
  const salut=Object.entries(ende).filter(([e])=>/salut/.test(e)).reduce((a,[e,l])=>a+l.length,0);
  pruef('REGELN',salut<=4,'Salut-Schluss in '+salut+' Shows');
  Object.entries(ende).filter(([e,l])=>e.startsWith('salve:')&&l.length>Math.max(2,sids.length/3)).forEach(([e,l])=>pruef('REGELN',false,'gleiches Ende '+e+': '+l.length));
  /* Figuren */
  r.FIG.forEach(f=>{ const bei=ids.filter(t=>FP[t].eff.has(f)); pruef('FIGUREN',bei.length<=3,f+' in '+bei.length+' Produkten: '+bei.join(',')); });
  /* Signatur */
  const ohne=ids.filter(t=>PR[t].k!=='klein'&&!PR[t].sig); pruef('SIGNATUR',!ohne.length,ohne.length+' ohne Signatur: '+ohne.slice(0,30).join(','));
  const sg={}; ids.forEach(t=>{ if(PR[t].sig) (sg[PR[t].sig]=sg[PR[t].sig]||[]).push(t); });
  Object.entries(sg).filter(([s,l])=>l.length>1).forEach(([s,l])=>pruef('SIGNATUR',false,'gleiche Signatur '+s+': '+l.join(',')));
  /* Steigerung der Grundstufe in Shows mit eigener basis */
  const mitB=sids.filter(t=>SH[t].basis).sort((a,c)=>SH[a].lvl-SH[c].lvl);
  for(let i=1;i<mitB.length;i++){ const a=SH[mitB[i-1]], c=SH[mitB[i]]; if(c.lvl>a.lvl) pruef('STEIGERUNG',c.basis.sz>=a.basis.sz-0.001&&c.basis.pw>=a.basis.pw-0.001,mitB[i]+' (L'+c.lvl+') kleiner als '+mitB[i-1]+' (L'+a.lvl+')'); }
  const nach={}; ids.forEach(t=>{ nach[PR[t].k]=(nach[PR[t].k]||0)+1; });
  console.log('PRODUKTE',JSON.stringify(nach),'| Paare >= Grenze:',paare.length,'| Schwenk',fanPh+'/'+alle);
  console.log('MANGEL:',mangel.length?mangel.length+' '+mangel.slice(0,60).join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).slice(0,80).join(' | '):'keine');
  await b.close();
})();
