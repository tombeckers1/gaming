/* Vergleich zweier Simulationslaeufe (Fundament Etappe 4, 13.10.2026)
   node tools/balance/vergleich.js <vorher.jsonl> <nachher.jsonl> [--toleranz 0.02]
   - Katalog (<lauf>.katalog.json: Preise, Level, Loehne, Kredite, XP, Ware) muss byte-gleich sein.
   - Je Spieltag werden die Kernspalten verglichen (Konto, Umsatz, Gewinn, Level, XP, Ruf, Kunden,
     Kaeufe). Ohne --toleranz muss alles exakt gleich sein (sim.js ist geseedet).
   Exit 1 bei Abweichung. */
const fs=require('fs');
const [,,A,B,...rest]=process.argv;
const ti=rest.indexOf('--toleranz'), TOL=ti>=0?+rest[ti+1]:0;
const lies=f=>fs.readFileSync(f,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const a=lies(A), b=lies(B);
let fehler=0;
const ka=fs.existsSync(A+'.katalog.json')?fs.readFileSync(A+'.katalog.json','utf8'):null, kb=fs.existsSync(B+'.katalog.json')?fs.readFileSync(B+'.katalog.json','utf8'):null;
if(ka!==null&&kb!==null){ if(ka===kb) console.log('Katalog: byte-gleich ('+ka.length+' Zeichen)'); else { console.log('Katalog: ABWEICHUNG'); fehler++; } }
else console.log('Katalog: fehlt bei einem Lauf');
const SP=['dayNr','money','umsatz','gewinn','lvl','xp','rep','kunden','verpasst','genervt','ware','versand','porto','onlinePausch','lohn','fix','rate','loan','kap','regale','racks','sorten'];
const n=Math.min(a.length,b.length);
if(a.length!==b.length){ console.log(`Tage: ${a.length} gegen ${b.length} (verglichen werden ${n})`); }
for(let i=0;i<n;i++){
  const d=[];
  for(const k of SP){ const x=a[i][k], y=b[i][k];
    if(typeof x==='number'&&typeof y==='number'){ const rel=Math.abs(x-y)/Math.max(1,Math.abs(x)); if(rel>TOL) d.push(`${k} ${x} -> ${y}`); }
    else if(JSON.stringify(x)!==JSON.stringify(y)) d.push(`${k} ${JSON.stringify(x)} -> ${JSON.stringify(y)}`); }
  if(JSON.stringify(a[i].kauf)!==JSON.stringify(b[i].kauf)) d.push(`kauf ${a[i].kauf.join(',')} -> ${b[i].kauf.join(',')}`);
  if(d.length){ fehler++; if(fehler<=8) console.log(`Tag ${a[i].dayNr} (${a[i].tag}): `+d.join(' | ')); }
}
const L=r=>r[r.length-1]||{};
console.log(`Ende vorher: Tag ${L(a).dayNr} Konto ${L(a).money} Level ${L(a).lvl} | nachher: Tag ${L(b).dayNr} Konto ${L(b).money} Level ${L(b).lvl}`);
if(fehler){ console.log('ABWEICHUNG an',fehler,'Stellen'); process.exit(1); }
console.log('GLEICH: alle',n,'Tage'+(TOL?` (Toleranz ${TOL*100} %)`:' exakt'));
