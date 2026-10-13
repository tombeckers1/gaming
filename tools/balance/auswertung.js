/* Auswertung der Balance-Simulation (tools/balance/sim.js)
   node tools/balance/auswertung.js <lauf.jsonl> [weitere.jsonl ...] > anhang.md
   Schreibt Markdown-Tabellen und legt SVG-Kurven neben die jsonl
   (Pfad ueber SVG_DIR, Standard docs/balancing/).

   Echtzeit-Umrechnung (aus dem Code, 02-data.js):
   - Oeffnungszeit 8-22 Uhr = 840 Spielminuten, MIN_PER_SEC = 840/330
     -> 330 s Echtzeit; dazu das Ausklingen bis der letzte Kunde geht
     (gemessen: Schritte x 0,05 s im Lauf).
   - Vorbereitung am Morgen (Bestellen, Auspacken, Einraeumen Stueck fuer
     Stueck, Laptop) ist Spielerzeit ohne Uhr: Annahme PREP_S = 150 s,
     Ruhetag 45 s, Tagesabschluss 15 s. Einstellbar per Umgebung. */
const fs=require('fs'), path=require('path');
const PREP=+(process.env.PREP_S||150), RUHE=+(process.env.RUHE_S||45), ABSCHL=15;
const SVG_DIR=process.env.SVG_DIR||path.join(__dirname,'../../docs/balancing');
const lies=f=>(f.endsWith('.gz')?require('zlib').gunzipSync(fs.readFileSync(f)).toString('utf8'):fs.readFileSync(f,'utf8')).trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const fmtMin=s=>{ const m=Math.round(s/60); return Math.floor(m/60)+':'+String(m%60).padStart(2,'0'); };
const eur=x=>Math.round(x).toLocaleString('de-DE')+' €';
const out=[]; const P=(...a)=>out.push(a.join(''));

function echtzeit(rows){
  let t=0;
  for(const r of rows){
    const sek=r.ruhe?RUHE:(r.schritte*0.05+PREP+ABSCHL);
    r.sek=sek; t+=sek; r.tEnde=t;
  }
  return rows;
}
const istFortschritt=k=>!/^(Notkredit|Tilgung|Entlassen|Kredit)/.test(k);
const istGross=k=>!/^(Regal:|Notkredit|Tilgung|Entlassen|Kredit|Team:)/.test(k);

function kurve(rows,titel,datei,serien){
  /* kleines Liniendiagramm, x = Echtzeit in Stunden */
  const W=760,H=260,L=56,R=16,T=24,B=34;
  const xmax=rows[rows.length-1].tEnde/3600;
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="sans-serif" font-size="11">`+
    `<rect width="${W}" height="${H}" fill="#fff"/><text x="${L}" y="15" font-size="13" font-weight="bold">${titel}</text>`;
  const X=x=>L+(W-L-R)*x/xmax;
  for(let h=0;h<=Math.ceil(xmax);h++){ const x=X(h); if(x>W-R+1) break;
    svg+=`<line x1="${x}" y1="${T}" x2="${x}" y2="${H-B}" stroke="#eee"/><text x="${x}" y="${H-B+14}" text-anchor="middle" fill="#555">${h} h</text>`; }
  serien.forEach((s,i)=>{
    const vals=rows.map(s.f), alle=[].concat(...serien.map(z=>rows.map(z.f))), mx=Math.max(...alle,1), mn=Math.min(0,...alle);
    const Y=v=>T+(H-T-B)*(1-(v-mn)/(mx-mn||1));
    if(i===0){ svg+=`<line x1="${L}" y1="${Y(0)}" x2="${W-R}" y2="${Y(0)}" stroke="#999" stroke-dasharray="3,3"/>`;
      [mn,mx/2,mx].forEach(v=>{ svg+=`<text x="${L-4}" y="${Y(v)+4}" text-anchor="end" fill="${s.c}">${Math.round(v).toLocaleString('de-DE')}</text>`; }); }
    else svg+=`<text x="${W-R}" y="${T+12*i}" text-anchor="end" fill="${s.c}">${s.n} (max ${Math.round(Math.max(...vals))})</text>`;
    svg+=`<polyline fill="none" stroke="${s.c}" stroke-width="1.6" points="${rows.map((r,j)=>X(r.tEnde/3600).toFixed(1)+','+Y(vals[j]).toFixed(1)).join(' ')}"/>`;
  });
  svg+=`<text x="${L+4}" y="${T+12}" fill="${serien[0].c}">${serien[0].n}</text></svg>`;
  fs.writeFileSync(path.join(SVG_DIR,datei),svg);
}

function auswerten(rows,name,kat){
  echtzeit(rows);
  P(`\n## Lauf „${name}“: ${rows.length} Spieltage = ${fmtMin(rows[rows.length-1].tEnde)} h Echtzeit\n`);
  /* --- je Echtzeit-Stunde --- */
  P('\n### Je Echtzeit-Stunde\n');
  P('| Stunde | Spieltag (Datum) | Konto | Kredit | Gewinn/Tag Ø | Level | Kap. | Sorten | Regale | gekauft in dieser Stunde |');
  P('|---|---|---|---|---|---|---|---|---|---|');
  let h=1, von=0;
  for(let i=0;i<rows.length;i++){
    const r=rows[i];
    if(r.tEnde>=h*3600||i===rows.length-1){
      const sl=rows.slice(von,i+1), offen=sl.filter(x=>!x.ruhe);
      const g=offen.length?offen.reduce((a,x)=>a+x.gewinn,0)/offen.length:0;
      const k=[].concat(...sl.map(x=>x.kauf.filter(istFortschritt)));
      const kz={}; k.forEach(x=>{ const key=x.startsWith('Regal:')?'Regal':x; kz[key]=(kz[key]||0)+1; });
      P(`| ${h}${i===rows.length-1&&r.tEnde<h*3600?' (Teil)':''} | ${r.dayNr} (${r.tag}) | ${eur(r.money)} | ${r.loan?eur(r.loan):'–'} | ${eur(g)} | ${r.lvl} | ${r.kap} | ${r.sorten} | ${r.regale} | ${Object.entries(kz).map(([a,b])=>b>1?a+' ×'+b:a).join(', ')||'–'} |`);
      von=i+1; h++;
    }
  }
  /* --- Meilensteine --- */
  P('\n### Meilensteine (Echtzeit h:mm)\n');
  const ms=[]; let lvl0=rows[0].lvl0||1, kap0=1;
  for(const r of rows){
    for(const k of r.kauf) if(istGross(k)) ms.push([r.tEnde-r.sek,r.dayNr,k]);
    if(r.kap>kap0){ ms.push([r.tEnde,r.dayNr,'KAPITEL '+r.kap]); kap0=r.kap; }
  }
  P('| Zeit | Tag | Ereignis |'); P('|---|---|---|');
  ms.forEach(m=>P(`| ${fmtMin(m[0])} | ${m[1]} | ${m[2]} |`));
  /* --- Durststrecken --- */
  P('\n### Durststrecken (> 20 Min Echtzeit ohne spürbaren Fortschritt)\n');
  P('Spürbar = Ausbau, Lizenz, neue Mitarbeiter, Kapitel. Level-Aufstiege und Regale zählen nicht (Level schaltet nur frei, was man sich dann noch leisten muss).\n');
  const ts=[0].concat(ms.map(m=>m[0])).concat([rows[rows.length-1].tEnde]);
  const lueck=[];
  for(let i=1;i<ts.length;i++) if(ts[i]-ts[i-1]>20*60) lueck.push([ts[i-1],ts[i]]);
  if(!lueck.length) P('Keine.');
  else { P('| von | bis | Dauer | Spieltage | Level dabei | Konto am Ende |'); P('|---|---|---|---|---|---|');
    for(const [a,b] of lueck){ const sl=rows.filter(r=>r.tEnde>a&&r.tEnde<=b); if(!sl.length) continue;
      P(`| ${fmtMin(a)} | ${fmtMin(b)} | ${Math.round((b-a)/60)} min | ${sl[0].dayNr}–${sl[sl.length-1].dayNr} | ${sl[0].lvl}→${sl[sl.length-1].lvl} | ${eur(sl[sl.length-1].money)} |`); } }
  /* --- Geldstau: zu leicht --- */
  P('\n### Geld stapelt sich (zu leicht?)\n');
  P('Tage, an denen das Konto mehr als das Dreifache der teuersten jetzt kaufbaren, noch offenen Sache (Ausbau/Lizenz) zeigt – oder nichts mehr zu kaufen ist.\n');
  let stau=[];
  for(const r of rows){
    const kaufbar=(r.naechste||[]).filter(n=>n.lvl<=r.lvl&&!n.req&&n.cost>0);
    const teuerste=kaufbar.length?Math.max(...kaufbar.map(n=>n.cost)):0;
    if(r.money-(r.loan||0)>Math.max(3*teuerste,5000)) stau.push(r);
  }
  P(stau.length?`${stau.length} von ${rows.length} Tagen, erster: Tag ${stau[0].dayNr} (${fmtMin(stau[0].tEnde)} h).`:'Kein Tag.');
  /* --- naechste Investition --- */
  P('\n### Wie weit ist die nächste Fläche? (Stichproben je Stunde)\n');
  P('Nächste kaufbare Fläche (Level und Voraussetzung erfüllt) und die nächste, die noch am Level hängt. „Tage“ = bis das Konto den Preis zeigt, bei Ø-Gewinn der letzten 7 Tage.\n');
  P('| Stunde | Level | nächste kaufbare Fläche | Kosten | Konto | Tage bis bezahlbar | nächste Fläche per Level gesperrt | Level fehlen |');
  P('|---|---|---|---|---|---|---|---|');
  h=1;
  for(let i=0;i<rows.length;i++){ const r=rows[i]; if(r.tEnde<h*3600&&i<rows.length-1) continue;
    const off=rows.slice(Math.max(0,i-6),i+1).filter(x=>!x.ruhe); const g=off.reduce((a,x)=>a+x.gewinn,0)/Math.max(1,off.length);
    const fl=(r.naechste||[]).filter(n=>n.kat==='flaeche');
    const kaufbar=fl.filter(n=>n.lvl<=r.lvl&&!n.req).sort((a,b)=>a.cost-b.cost);
    const gesperrt=fl.filter(n=>n.lvl>r.lvl).sort((a,b)=>a.lvl-b.lvl);
    const k=kaufbar[0], s=gesperrt[0];
    const tage=k?(r.money>=k.cost?0:(g>0?Math.ceil((k.cost-r.money)/g):'∞')):'–';
    P(`| ${h} | ${r.lvl} | ${k?k.id:'–'} | ${k?eur(k.cost):'–'} | ${eur(r.money)} | ${tage} | ${s?s.id+' (L'+s.lvl+')':'–'} | ${s?s.lvl-r.lvl:'–'} |`);
    h++; }
  /* --- Amortisation --- */
  P('\n### Amortisation der Käufe (aus dem Lauf geschätzt)\n');
  P('Gewinn/Tag = Kontoveränderung ohne Investitionen und Kredite, saisonbereinigt (÷ Tagesfaktor dayMult). Vorher = Ø 5 offene Tage davor, nachher = Ø 7 offene Tage danach. Grob: Saison, Ereignisse und weitere Käufe in der Zeit mischen mit.\n');
  P('| Tag | Kauf | Kosten | Gewinn/Tag vorher | nachher | Δ/Tag | Amortisation (Spieltage ≈ Echtzeit) |'); P('|---|---|---|---|---|---|---|');
  const preis=id=>{ if(!kat) return 0; if(id.startsWith('Liz:')){ const l=kat.liz.find(x=>x.id===id.slice(4)); return l?l.cost:0; }
    if(id.startsWith('Team:')){ const s=kat.staff.find(x=>x.id===id.slice(5)); return s?s.hire:0; }
    const u=kat.up.find(x=>x.id===id); return u?u.cost:0; };
  rows.forEach((r,i)=>{ for(const k of r.kauf){ if(!istGross(k)&&!k.startsWith('Team:')) continue;
    const vor=rows.slice(Math.max(0,i-8),i).filter(x=>!x.ruhe).slice(-5), nach=rows.slice(i+1,i+12).filter(x=>!x.ruhe).slice(0,7);
    if(vor.length<3||nach.length<4) continue;
    const n=x=>x.gewinn/Math.max(0.4,x.mult);
    const a=vor.reduce((s,x)=>s+n(x),0)/vor.length, b=nach.reduce((s,x)=>s+n(x),0)/nach.length, d=b-a, c=preis(k);
    const lohn=k.startsWith('Team:')?' (Lohn läuft mit)':'';
    P(`| ${r.dayNr} | ${k}${lohn} | ${eur(c)} | ${eur(a)} | ${eur(b)} | ${eur(d)} | ${d>0&&c?Math.round(c/d)+' Tage ≈ '+fmtMin(c/d*510)+' h':'nicht messbar'} |`); } });
  /* --- Umsatzanteile --- */
  P('\n### Umsatzanteile (je 30 Spieltage)\n');
  P('| Tage | Feuerwerk (F1+F2) | Zubehör/Party/Essen | eigene Marke | Online-Pauschale | Versand (Pakete) | Umsatz gesamt |'); P('|---|---|---|---|---|---|---|');
  for(let a=0;a<rows.length;a+=30){ const sl=rows.slice(a,a+30); const s={fw:0,zub:0,ei:0,on:0,vs:0};
    sl.forEach(r=>{ s.fw+=r.rev.f1+r.rev.f2; s.zub+=r.rev.zub; s.ei+=r.rev.eigen; s.on+=r.onlinePausch; s.vs+=r.versand; });
    const tot=s.fw+s.zub+s.ei+s.on+s.vs||1, pc=x=>Math.round(100*x/tot)+' %';
    P(`| ${sl[0].dayNr}–${sl[sl.length-1].dayNr} | ${pc(s.fw)} | ${pc(s.zub)} | ${pc(s.ei)} | ${pc(s.on)} | ${pc(s.vs)} | ${eur(tot)} |`); }
  /* --- Tagestabelle (komprimiert) --- */
  P('\n<details><summary>Alle Spieltage</summary>\n');
  P('| Tag | Datum | Echtzeit | Umsatz | Kunden | verpasst | Ware | Gewinn | Konto | Kredit | Lvl | Kap | Ruf | Käufe |'); P('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  rows.forEach(r=>P(`| ${r.dayNr} | ${r.tag}${r.ruhe?' Ruhetag':''} | ${fmtMin(r.tEnde)} | ${r.umsatz} | ${r.kunden} | ${r.verpasst} | ${r.ware} | ${r.gewinn} | ${r.money} | ${r.loan||''} | ${r.lvl} | ${r.kap} | ${r.rep} | ${r.kauf.join(' ')} |`));
  P('\n</details>\n');
  /* --- Kurven --- */
  kurve(rows,`${name}: Kontostand (blau) und Kredit (rot) über Echtzeit`,`kurve-${name}-konto.svg`,
    [{n:'Konto €',c:'#1f5fbf',f:r=>r.money},{n:'Kredit €',c:'#c0392b',f:r=>r.loan||0}]);
  kurve(rows,`${name}: Level (grün), Kapitel (orange), Sorten (grau)`,`kurve-${name}-level.svg`,
    [{n:'Level',c:'#2e8b57',f:r=>r.lvl},{n:'Kapitel',c:'#e67e22',f:r=>r.kap},{n:'Sorten',c:'#888',f:r=>r.sorten}]);
  kurve(rows,`${name}: Gewinn je Spieltag (Cashflow ohne Investitionen)`,`kurve-${name}-gewinn.svg`,
    [{n:'Gewinn €',c:'#8e44ad',f:r=>r.gewinn}]);
  return rows;
}

const kf=f=>{ for(const k of [f.replace(/\.gz$/,'')+'.katalog.json',path.join(path.dirname(f),'katalog.json')]) if(fs.existsSync(k)) return JSON.parse(fs.readFileSync(k,'utf8')); return null; };
P(`Echtzeit-Annahme: Öffnung ${330} s + Ausklingen (gemessen) + Vorbereitung ${PREP} s + Abschluss ${ABSCHL} s je Verkaufstag, Ruhetag ${RUHE} s.`);
const dateien=process.argv.slice(2).filter(f=>fs.existsSync(f));
const kat0=dateien.map(kf).find(Boolean);
for(const f of dateien){
  const name=path.basename(f).replace(/\.jsonl(\.gz)?$/,'');
  const r=auswerten(lies(f),name,kf(f)||kat0);
  const minK=Math.min(...r.map(x=>x.money)), neg=r.filter(x=>x.money<0).length, minR=Math.min(...r.map(x=>x.rep));
  P(`\n**Kurz „${name}“:** tiefster Kontostand ${eur(minK)}, ${neg} von ${r.length} Tagen im Minus, tiefster Ruf ${minR}. Ende: Konto ${eur(r[r.length-1].money)}, Kredit ${eur(r[r.length-1].loan||0)}, Level ${r[r.length-1].lvl}, Kapitel ${r[r.length-1].kap}.\n`);
}
console.log(out.join('\n'));
