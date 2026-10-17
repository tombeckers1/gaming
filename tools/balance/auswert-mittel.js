/* Auswertung Lauf "mittel" -> mittel.json (Echtzeit = Spieltage x 8,5 Min, ist-analyse) */
const fs=require('fs');
const [,,IN,OUT]=process.argv;
const rows=fs.readFileSync(IN,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const kat=JSON.parse(fs.readFileSync(IN+'.katalog.json','utf8'));
const MIN=8.5, eh=d=>+(d*MIN/60).toFixed(2);
const name=id=>{ if(id.startsWith('Liz:')){ const l=kat.liz.find(x=>x.id===id.slice(4)); return l?'Lizenz '+l.name:id; }
  if(id.startsWith('Team:')){ const s=kat.staff.find(x=>x.id===id.slice(5)); return s?'Personal: '+s.name:id; }
  const u=kat.up.find(x=>x.id===id); return u?u.name:id; };
const def=id=>{ if(id.startsWith('Liz:')){ const l=kat.liz.find(x=>x.id===id.slice(4)); return l&&{lvl:l.lvl,req:null}; }
  if(id.startsWith('Team:')){ const s=kat.staff.find(x=>x.id===id.slice(5)); return s&&{lvl:s.lvl,req:s.req}; }
  if(id==='Werkbank-Batterie') return {lvl:0,req:'labor'};
  const u=kat.up.find(x=>x.id===id); return u&&{lvl:u.lvl,req:u.req}; };
const lvlStart=rows[0].lvl0||1;
const freiTag=id=>{ const d=def(id); if(!d) return null;
  const okAm=r=>r.lvl>=d.lvl&&(!d.req||(r.up||[]).includes(d.req)||(d.req==='packstation'&&(r.up||[]).includes('packstation')));
  if(d.lvl<=lvlStart&&!d.req) return 0;
  for(const r of rows) if(okAm(r)) return r.dayNr+1;   // abends erreicht -> ab naechstem Morgen kaufbar
  return null; };
const tage=rows.map(r=>({tag:r.dayNr,datum:r.tag,ruhetag:r.ruhe,saison:r.mult,ereignis:r.ev,level:r.lvl,xp:r.xp,xpNaechstes:r.xpNext,kapitel:r.kap,
  konto:r.money,umsatz:r.umsatz,wareneinsatz:r.ware,fixkosten:r.fix,loehne:r.lohn,kreditrate:r.rate,kredit:r.loan,betriebsgewinn:r.gewinn,
  kunden:r.kunden,verpasst:r.verpasst,ruf:r.rep,hypeMax:r.hypeMax,hypeSchnitt:r.hypeSchnitt,gezuendet:r.zuend,online:(r.onlinePausch||0)+(r.versand||0),
  onlinePauschale:r.onlinePausch,versandUmsatz:r.versand,sorten:r.sorten,regale:r.regale,personal:r.staff,kaeufe:r.kp,neu:r.neu,wbHinweis:r.wbGrund||undefined}));
const spuerbar=w=>!/^(Regal:|Kredit|Notkredit|Tilgung|Entlassen)/.test(w);
const meilensteine=[];
for(const r of rows) for(const k of (r.kp||[])){ if(/^Regal:/.test(k.was)) continue;
  const f=freiTag(k.was);
  meilensteine.push({tag:r.dayNr,datum:r.tag,echtzeit_h:eh(r.dayNr),level:r.lvl0,was:name(k.was),id:k.was,preis:k.preis,konto_vorher:Math.round(r.m0),
    wartezeit_seit_freischaltung_tage:f==null?null:Math.max(0,r.dayNr-f),wartezeit_h:f==null?null:eh(Math.max(0,r.dayNr-f)),extra:Object.fromEntries(Object.entries(k).filter(([a])=>!['was','preis'].includes(a)))}); }
const kapitel=[{nr:1,name:(kat.kapitel.find(k=>k.nr===1)||{}).name,tag:0,echtzeit_h:0}]; let k0=1;
for(const r of rows) while(r.kap>k0){ k0++; kapitel.push({nr:k0,name:(kat.kapitel.find(k=>k.nr===k0)||{}).name,tag:r.dayNr+1,echtzeit_h:eh(r.dayNr+1),zusammen_mit_naechstem:k0<r.kap||undefined}); }
/* Durststrecken: > 1 h Echtzeit (> 7 Spieltage) ohne spuerbaren Fortschritt (Ausbau, Lizenz, Personal, Werkbank, Kapitel) */
const ev=[0]; rows.forEach(r=>{ if((r.kp||[]).some(k=>spuerbar(k.was))) ev.push(r.dayNr); }); kapitel.forEach(k=>ev.push(k.tag)); ev.push(rows.length);
ev.sort((a,b)=>a-b);
const luecken=[]; for(let i=1;i<ev.length;i++){ const d=ev[i]-ev[i-1]; if(d*MIN>30) luecken.push({von_tag:ev[i-1],bis_tag:ev[i],dauer_h:eh(d)}); }
const durst=[]; for(let i=1;i<ev.length;i++){ const d=ev[i]-ev[i-1]; if(d*MIN>60){ const sl=rows.filter(r=>r.dayNr>=ev[i-1]&&r.dayNr<ev[i]);
  durst.push({von_tag:ev[i-1],bis_tag:ev[i],dauer_h:eh(d),von_h:eh(ev[i-1]),level:sl.length?sl[0].lvl+'→'+sl[sl.length-1].lvl:'',konto_ende:sl.length?sl[sl.length-1].money:null,
    worauf_gespart:(()=>{ const r=sl[sl.length-1]; if(!r) return ''; const kb=(r.naechste||[]).filter(n=>n.lvl<=r.lvl&&!n.req&&n.cost>0&&!/^labor[2-5]$/.test(n.id)).sort((a,b)=>a.cost-b.cost); return kb.slice(0,3).map(n=>n.id+' '+n.cost).join(', '); })()}); } }
/* offene Freischaltungen am Ende */
const last=rows[rows.length-1];
const offen=(last.naechste||[]).filter(n=>n.lvl<=last.lvl&&!n.req&&!/^labor[2-5]$/.test(n.id)).map(n=>{ const f=freiTag(n.id); return {id:n.id,was:name(n.id),preis:n.cost,frei_seit_tag:f,wartet_tage:f==null?null:rows.length-f,wartet_h:f==null?null:eh(rows.length-f)}; }).sort((a,b)=>(b.wartet_tage||0)-(a.wartet_tage||0));
/* Geld stapelt sich: Eigenkapital > 3x teuerste kaufbare offene Sache und > 5000 */
const stau=rows.filter(r=>{ const kb=(r.naechste||[]).filter(n=>n.lvl<=r.lvl&&!n.req&&n.cost>0&&!/^labor[2-5]$/.test(n.id)); const t=kb.length?Math.max(...kb.map(n=>n.cost)):0; return r.money-(r.loan||0)>Math.max(3*t,5000); }).map(r=>r.dayNr);
/* Silvester */
const sil=rows.filter(r=>/\.12\./.test(r.tag)&&+r.tag.split(' ')[1].split('.')[0]>=27||/ 31\.12\./.test(r.tag));
const nov=rows.filter(r=>/\.11\./.test(r.tag)&&!r.ruhe);
const avg=(a,f)=>a.length?Math.round(a.reduce((s,x)=>s+f(x),0)/a.length):null;
const silvester=rows.length>91?{tage:sil.map(r=>({tag:r.dayNr,datum:r.tag,umsatz:r.umsatz,kunden:r.kunden,verpasst:r.verpasst,gewinn:r.gewinn,ruf:r.rep,saison:r.mult,hypeMax:r.hypeMax})),
  nov_schnitt:{umsatz:avg(nov,r=>r.umsatz),kunden:avg(nov,r=>r.kunden),gewinn:avg(nov,r=>r.gewinn)},
  dez27_31_umsatz:sil.reduce((s,r)=>s+r.umsatz,0),dez27_31_gewinn:sil.reduce((s,r)=>s+r.gewinn,0)}:null;
/* Hype */
const mitZ=rows.filter(r=>!r.ruhe&&r.zuend&&r.zuend.length), ohneZ=rows.filter(r=>!r.ruhe&&!(r.zuend&&r.zuend.length));
const hype={erste_zuendung_tag:mitZ.length?mitZ[0].dayNr:null,tage_mit_zuendung:mitZ.length,hypeSchnitt_offen:+(mitZ.reduce((s,r)=>s+(r.hypeSchnitt||0),0)/Math.max(1,mitZ.length)).toFixed(1),
  hypeMax_schnitt:avg(mitZ,r=>r.hypeMax||0),theoretisch_mehr_kunden_proz:+((mitZ.reduce((s,r)=>s+(r.hypeSchnitt||0),0)/Math.max(1,mitZ.length))/50*100).toFixed(1),
  zuendungen:mitZ.reduce((s,r)=>s+r.zuend.length,0),fehler:rows.filter(r=>r.zFehler).map(r=>({tag:r.dayNr,f:r.zFehler})).slice(0,10)};
const gew=rows.filter(r=>!r.ruhe);
const zusammenfassung={tage:rows.length,echtzeit_h:eh(rows.length),formel:'Echtzeit = Spieltage × 8,5 Min (ist-analyse: 330 s Öffnung + Ausklingen + 150 s Vorbereitung + 15 s Abschluss)',
  ende:{datum:last.tag,konto:last.money,kredit:last.loan,level:last.lvl,kapitel:last.kap,sorten:last.sorten,regale:last.regale,personal:last.staff,ruf:last.rep,ausbau:last.up},
  tiefster_kontostand:Math.min(...rows.map(r=>r.money)),tage_im_minus:rows.filter(r=>r.money<0).length,hoechster_kontostand:Math.max(...rows.map(r=>r.money)),
  kredite:meilensteine.filter(m=>/Kredit/.test(m.id)),umsatz_summe:rows.reduce((s,r)=>s+r.umsatz,0),betriebsgewinn_summe:rows.reduce((s,r)=>s+r.gewinn,0),
  online_summe:rows.reduce((s,r)=>s+(r.onlinePausch||0)+(r.versand||0),0),gewinn_je_10_tage:Array.from({length:Math.ceil(rows.length/10)},(_,i)=>{ const sl=rows.slice(i*10,i*10+10); return {tage:sl[0].dayNr+'-'+sl[sl.length-1].dayNr,datum:sl[0].tag,gewinn_schnitt:avg(sl,r=>r.gewinn),umsatz_schnitt:avg(sl,r=>r.umsatz),kunden_schnitt:avg(sl,r=>r.kunden),konto_ende:sl[sl.length-1].money,level_ende:sl[sl.length-1].lvl}; }),
  durststrecken_ueber_1h:durst,luecken_ueber_30min:luecken,offene_freischaltungen_am_ende:offen,geldstau_tage:stau,silvester,hype,
  minus_ruhetage_kosten:'Ruhetage: Fixkosten laufen, kein Umsatz'};
fs.writeFileSync(OUT,JSON.stringify({tage,meilensteine,kapitel,zusammenfassung},null,1));
console.log(JSON.stringify({tage:rows.length,meilensteine:meilensteine.length,kapitel,durst:durst.map(d=>d.von_tag+'-'+d.bis_tag+' '+d.dauer_h+'h'),hype,stau:stau.length},null,0));
