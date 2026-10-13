/* Rueckuebersetzung (Fundament Etappe 4, 13.10.2026): zweiter Beweis neben dem
   Snapshot. Fuer jede geaenderte Teil-Datei wird im NEUEN Text jeder Verweis
   WIRT.a.b.c durch seinen Zahlenwert ersetzt (Zahlen beidseitig vereinheitlicht:
   0.80 == 0.8). Steht danach wieder der alte Text da, war die Aenderung ein
   reiner Umzug. Was uebrig bleibt, ist "Struktur" (neue Konstanten-Aliase,
   erzeugte Texte, die Zentrale selbst) und wird zum Durchsehen ausgegeben.
   Aufruf: node tools/fundament/wirtschaft-rueck.js [BASIS-COMMIT] [--alles]
     --alles: auch die uebrig gebliebenen Zeilen zeigen (sonst nur die Zaehlung je Datei) */
const fs=require('fs'), path=require('path'), cp=require('child_process'), os=require('os');
const TA=path.join(os.tmpdir(),'rueck_a_'+process.pid), TB=path.join(os.tmpdir(),'rueck_b_'+process.pid);
const {laden}=require('./spiel-node.js');
const W=path.resolve(__dirname,'..','..');
const args=process.argv.slice(2), alles=args.includes('--alles');
const BASIS=args.find(a=>!a.startsWith('--'))||'73e52ef';
const spiel=laden(W);
let WIRT=null; try{ WIRT=spiel.ev('WIRT'); }catch(e){ console.log('Keine Zentrale (WIRT) gefunden.'); process.exit(1); }
const wert=(p)=>{ let o=WIRT; for(const k of p){ if(o==null) return undefined; o=o[k]; } return o; };
/* nur Code-Schreibweisen angleichen: 0.80 -> 0.8, 1.30 -> 1.3, .5 -> 0.5 (ein/zwei Nachkommastellen);
   deutsche Tausender wie 1.000 bleiben unangetastet */
const zahl=s=>s.replace(/(?<![\w$.])(\d+\.\d{1,2}|\.\d+)(?![\w$.\d])/g,(m)=>String(Number(m)));
const dateien=cp.execSync(`git -C ${W} diff --name-only ${BASIS} -- src/parts`,{encoding:'utf8'}).split('\n').filter(f=>f.endsWith('.js'));
let restGesamt=0;
for(const f of dateien){
  const neu=fs.readFileSync(path.join(W,f),'utf8');
  let alt=''; try{ alt=cp.execSync(`git -C ${W} show ${BASIS}:${f}`,{encoding:'utf8',maxBuffer:64<<20}); }catch(e){ console.log(f+': neu (kein Gegenstueck im Ausgangsstand)'); continue; }
  /* WIRT.x.y / WIRT.x['y'] / WIRT.x[3] -> Wert, wenn es eine Zahl ist */
  /* beide Seiten ruecksetzen: so geht auch der Vergleich gegen einen Zwischenstand */
  const rueck=t=>t.replace(/WIRT((?:\.[A-Za-z_$][\w$]*|\[\d+\]|\['[^']+'\])+)/g,(m,p)=>{
    const teile=[...p.matchAll(/\.([A-Za-z_$][\w$]*)|\[(\d+)\]|\['([^']+)'\]/g)].map(x=>x[1]||x[2]||x[3]);
    const v=wert(teile); return typeof v==='number'?String(v):m; });
  /* lokale Kurznamen (const T=WIRT.kunden.takt) aufloesen: gelten 15 Zeilen weit, VMW & Co. (>= 3 Zeichen) in der ganzen Datei;
     die Deklaration selbst faellt weg - steht danach die alte Zeile da, war es ein reiner Umzug */
  const alias=t=>{ const L=t.split('\n'), A=[];
    L.forEach((l,i)=>{ for(const m of l.matchAll(/\b([A-Z][A-Z0-9]{0,3})=WIRT((?:\.[A-Za-z_$][\w$]*)+)/g)) A.push({n:m[1],p:'WIRT'+m[2],von:i,bis:m[1].length>=3?L.length:i+25}); });
    for(const a of A){ for(let i=a.von;i<=Math.min(a.bis,L.length-1);i++) L[i]=L[i].replace(new RegExp('(?<![\\w$.])'+a.n+'\\.(?=[A-Za-z_$])','g'),a.p+'.'); }
    return L.map(l=>l.replace(/\b[A-Z][A-Z0-9]{0,3}=WIRT(?:\.[A-Za-z_$][\w$]*)+,\s*/g,'').replace(/,\s*[A-Z][A-Z0-9]{0,3}=WIRT(?:\.[A-Za-z_$][\w$]*)+(?=[;,])/g,'').replace(/const [A-Z][A-Z0-9]{0,3}=WIRT(?:\.[A-Za-z_$][\w$]*)+;\s*/g,'').replace(/^\s*\n/,'')).filter((l,i,arr)=>!(l.trim()===''&&L[i].trim()!=='')).join('\n'); };
  const a=zahl(rueck(alias(alt))).split('\n'), b=zahl(rueck(alias(neu))).split('\n');
  fs.writeFileSync(TA,a.join('\n')); fs.writeFileSync(TB,b.join('\n'));
  let d=''; try{ cp.execSync(`diff -w ${TA} ${TB}`,{encoding:'utf8'}); }catch(e){ d=e.stdout||''; }
  const zeilen=d.split('\n').filter(l=>l.startsWith('<')||l.startsWith('>'));
  restGesamt+=zeilen.length;
  console.log(`${f}: ${zeilen.length?zeilen.filter(l=>l[0]==='<').length+' alt / '+zeilen.filter(l=>l[0]==='>').length+' neu Zeilen bleiben (Struktur)':'reiner Umzug (nach Ruecksetzen identisch)'}`);
  if(alles&&d) console.log(d.split('\n').map(l=>'    '+l.slice(0,400)).join('\n'));
}
try{ fs.unlinkSync(TA); fs.unlinkSync(TB); }catch(e){}
console.log('Summe uebrig gebliebener Zeilen:',restGesamt);
