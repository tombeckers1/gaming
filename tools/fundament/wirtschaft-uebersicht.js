/* Wirtschafts-Uebersicht erzeugen (Fundament Etappe 4, 13.10.2026)
   Liest die Wirtschaftszentrale (src/parts/01c-wirtschaft.js: WIRT, WIRT_KETTEN) ueber das in Node
   geladene Spiel und schreibt
   - docs/fundament/wirtschaft.md: Abschnitt zwischen <!-- AUTO:KETTEN --> und <!-- /AUTO:KETTEN -->
     ("Entscheidung -> Folge" mit aktuellen Werten, Formel, Datei:Zeile, Warum, Luecken)
   - docs/fundament/wirtschaft-werte.md: jede Zahl der Zentrale mit Kommentar und wo sie gelesen wird.
   Platzhalter in Texten: {pfad} = Zahl, {pfad|%} = Prozent. Zeilennummern sucht das Werkzeug selbst
   (ort = Datei:Funktion), damit nichts veraltet.
   Aufruf: node tools/fundament/wirtschaft-uebersicht.js            -> schreiben
           node tools/fundament/wirtschaft-uebersicht.js --pruefen  -> nur pruefen (Exit 1, wenn veraltet,
              ein Ort fehlt, ein Platzhalter ins Leere zeigt oder eine Zahl nirgends gelesen wird) */
const fs=require('fs'), path=require('path');
const {laden}=require('./spiel-node.js');
const W=path.resolve(__dirname,'..','..'), PARTS=path.join(W,'src/parts');
const pruefen=process.argv.includes('--pruefen');
const spiel=laden(W);
const WIRT=spiel.ev('WIRT'), KETTEN=spiel.ev('WIRT_KETTEN');
const probleme=[];

/* ---------- Werte ---------- */
const get=p=>p.split('.').reduce((o,k)=>o==null?undefined:o[k],WIRT);
const zahl=v=>typeof v!=='number'?String(v):v===Infinity?'unendlich':Math.abs(v)>=1000?v.toLocaleString('de-DE'):String(v).replace('.',',');
const zeig=v=>typeof v==='number'?zahl(v):Array.isArray(v)?(v.every(x=>typeof x!=='object')?v.map(zahl).join(' / '):v.map(x=>x&&typeof x==='object'?'{'+Object.entries(x).filter(([a,b])=>a!=='text').map(([a,b])=>a+' '+zeig(b)).join(', ')+'}':zeig(x)).join('; ')):v&&typeof v==='object'?'(Gruppe)':String(v);
const WFX=spiel.ev('WF');
const fuell=(t,wo)=>t.replace(/\{WF:([A-Za-z]+)\}/g,(m,f)=>{ if(typeof WFX[f]!=='function'){ probleme.push(`WF.${f} fehlt (${wo})`); return m; } return WFX[f](); })
  .replace(/\{([a-zA-Z0-9_.]+)(\|%|\|€)?\}/g,(m,p,fm)=>{ const v=get(p); if(v===undefined){ probleme.push(`Platzhalter ins Leere: {${p}} in ${wo}`); return m; }
  if(fm==='|%') return typeof v==='number'?zahl(Math.round(v*1e4)/100)+' %':zeig(v);
  if(fm==='|€') return typeof v==='number'?v.toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})+' €':zeig(v);
  return zeig(v); })
  .replace(/\{[^}]*\}/g,m=>{ probleme.push(`Platzhalter nicht aufgeloest: ${m} in ${wo}`); return m; });

/* ---------- Orte: Datei:Funktion -> Zeile ---------- */
const quellen={}; for(const f of fs.readdirSync(PARTS)) if(f.endsWith('.js')) quellen[f]=fs.readFileSync(path.join(PARTS,f),'utf8').split('\n');
function ortZeile(ort){
  const [f,fn]=ort.split(':'); const L=quellen[f]; if(!L) return null;
  const muster=[new RegExp(`^\\s*function ${fn}\\b`),new RegExp(`^\\s*(const|let) ${fn}\\b`),new RegExp(`^\\s*class ${fn}\\b`),new RegExp(`^\\s*${fn}\\s*\\([^)]*\\)\\s*\\{`)];
  for(const m of muster){ const i=L.findIndex(l=>m.test(l)); if(i>=0) return i+1; }
  return null;
}
const ortText=ort=>{ const z=ortZeile(ort); if(!z) probleme.push('Ort nicht gefunden: '+ort); return z?`\`${ort.split(':')[0]}:${z}\` (${ort.split(':')[1]})`:`\`${ort}\` (nicht gefunden!)`; };

/* ---------- Kommentare aus 01c je Pfad ---------- */
const src=fs.readFileSync(path.join(PARTS,'01c-wirtschaft.js'),'utf8').split('\n');
const kommentar={};
{ const a=src.findIndex(l=>/^const WIRT=\{/.test(l)), stack=[];
  for(let i=a+1;i<src.length&&!/^\};/.test(src[i]);i++){
    const l=src[i], code=l.replace(/\/\/.*$/,'').replace(/\/\*.*?\*\//g,''), kom=(l.match(/\/\/\s*(.*)$/)||[])[1];
    const erst=code.match(/^\s*([A-Za-z_$][\w$]*)\s*:/);
    // Blockkommentar direkt darueber gehoert zum Schluessel dieser Zeile
    let block=''; if(erst){ let j=i-1, teile=[]; if(/\*\/\s*$/.test(src[j]||'')){ while(j>a&&!/\/\*/.test(src[j])){ teile.unshift(src[j]); j--; } teile.unshift(src[j]); block=teile.join(' ').replace(/\/\*|\*\//g,'').replace(/-{3,}/g,'').replace(/\s+/g,' ').trim(); } }
    if(erst&&(kom||block)){ const p=stack.concat(erst[1]).join('.'); if(!kommentar[p]) kommentar[p]=[block,kom?kom.trim():''].filter(Boolean).join(' – '); }
    /* Klammern zaehlen: key:{ oeffnet eine Ebene */
    let rest=code; const re=/([A-Za-z_$][\w$]*)\s*:\s*\{|\{|\}/g; let m;
    while((m=re.exec(rest))){ if(m[0]==='}') stack.pop(); else stack.push(m[1]||'#'); }
  } }
const kommentarVon=p=>{ let q=p; while(q){ if(kommentar[q]) return (q===p?'':'(Gruppe) ')+kommentar[q]; q=q.includes('.')?q.slice(0,q.lastIndexOf('.')):''; } return ''; };

/* ---------- Wer liest welchen Pfad ---------- */
const lesen={};
/* nur der Teil, den es in WIRT gibt (WIRT.auftrag.kartons.find -> auftrag.kartons) */
const echt=p=>{ const t=p.split('.'), r=[]; let o=WIRT; for(const k of t){ if(o&&typeof o==='object'&&Object.prototype.hasOwnProperty.call(o,k)){ r.push(k); o=o[k]; } else break; } return r.join('.'); };
/* Kommentare im Code zaehlen nicht als Lesen */
const ohneKommentar=l=>l.replace(/\/\*.*?\*\//g,'').replace(/\/\/.*$/,'').replace(/^\s*\*.*$/,'').replace(/\/\*.*$/,'');
for(const [f,L] of Object.entries(quellen)){ if(f==='01c-wirtschaft.js') continue;
  L.forEach((l,i)=>{ for(const m of ohneKommentar(l).matchAll(/WIRT((?:\.[A-Za-z_$][\w$]*|\[\d+\])+)/g)){ const p=echt(m[1].replace(/\[(\d+)\]/g,'.$1').slice(1)); (lesen[p]=lesen[p]||new Set()).add(`${f}:${i+1}`); } }); }
/* in 01c selbst: Formeln (WF) lesen WIRT ebenfalls */
src.forEach((l,i)=>{ if(/^const WIRT=\{/.test(l)) return; const ab=src.findIndex(x=>/^const WF=\{/.test(x)); if(i<ab) return;
  for(const m of ohneKommentar(l).matchAll(/WIRT((?:\.[A-Za-z_$][\w$]*)+)/g)){ const p=echt(m[1].slice(1)); (lesen[p]=lesen[p]||new Set()).add(`01c-wirtschaft.js:${i+1} (WF)`); } });
const leser=p=>{ const out=new Set(); let q=p;
  while(q){ if(lesen[q]) for(const x of lesen[q]) out.add(x); if(out.size) break; q=q.includes('.')?q.slice(0,q.lastIndexOf('.')):''; }
  /* Kinder, die direkt gelesen werden, zaehlen auch fuer den Elternpfad */
  if(!out.size) for(const k in lesen) if(k.startsWith(p+'.')) for(const x of lesen[k]) out.add(x);
  return [...out]; };

/* ---------- 1. Ketten fuer wirtschaft.md ---------- */
let K='<!-- AUTO:KETTEN (erzeugt von tools/fundament/wirtschaft-uebersicht.js aus WIRT_KETTEN - nicht von Hand aendern) -->\n';
for(const k of KETTEN){
  K+=`\n### ${k.entscheidung}\n`;
  for(const f of k.folgen) K+=`- ${fuell(f.text,k.id)} → ${ortText(f.ort)}\n`;
  K+=`- **Warum:** ${fuell(k.warum,k.id)}\n`;
  if(k.quelle) K+=`- **Quelle:** ${k.quelle}\n`;
  if(k.luecken&&k.luecken.length) K+=`- **Lücke heute (fürs Balancing):** ${k.luecken.map(x=>fuell(x,k.id)).join(' · ')}\n`;
  for(const f of k.folgen) for(const w of (f.werte||[])) if(get(w)===undefined) probleme.push(`Kette ${k.id}: Wert ${w} gibt es nicht`);
}
K+='\n<!-- /AUTO:KETTEN -->';

/* ---------- 2. Alle Werte fuer wirtschaft-werte.md ---------- */
const blaetter=[];
(function geh(o,p){ for(const k of Object.keys(o)){ const v=o[k], q=p?p+'.'+k:k;
  const blattObj=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.values(x).every(y=>typeof y==='number'||(Array.isArray(y)&&y.every(z=>typeof z==='number')));
  if(v&&typeof v==='object'&&!Array.isArray(v)&&!blattObj(v)) geh(v,q);
  else blaetter.push(q); } })(WIRT,'');
const kette=p=>KETTEN.filter(k=>k.folgen.some(f=>(f.werte||[]).some(w=>p===w||p.startsWith(w+'.')||w.startsWith(p+'.')))).map(k=>k.id);
let T=`# Wirtschaftszentrale: alle Werte (erzeugt)\n\nErzeugt von \`tools/fundament/wirtschaft-uebersicht.js\` aus \`src/parts/01c-wirtschaft.js\` – nicht von Hand ändern.\n`+
  `Spalte „gelesen in“: wo der Wert (oder seine Gruppe) im Spiel benutzt wird. Spalte „Kette“: welche Wirkungskette in \`wirtschaft.md\` ihn erklärt.\n`;
let grp='';
let unbenutzt=[];
for(const p of blaetter){
  const g=p.split('.')[0]; if(g!==grp){ grp=g; T+=`\n## ${g}\n\n| Größe | Wert | Bedeutung | gelesen in | Kette |\n|---|---|---|---|---|\n`; }
  const v=get(p), L=leser(p);
  if(!L.length&&!p.startsWith('historie')) unbenutzt.push(p);
  const w=v&&typeof v==='object'&&!Array.isArray(v)?Object.entries(v).map(([a,b])=>a+' '+zeig(b)).join(', '):zeig(v);
  T+=`| \`${p}\` | ${w} | ${(kommentarVon(p)||'').replace(/\|/g,'/')} | ${L.slice(0,4).map(x=>'`'+x+'`').join(', ')}${L.length>4?` +${L.length-4}`:''} | ${kette(p).join(', ')} |\n`;
}
if(unbenutzt.length) probleme.push('Nirgends gelesen: '+unbenutzt.join(', '));

/* ---------- schreiben / pruefen ---------- */
const MD=path.join(W,'docs/fundament/wirtschaft.md'), WE=path.join(W,'docs/fundament/wirtschaft-werte.md');
const md=fs.existsSync(MD)?fs.readFileSync(MD,'utf8'):'';
const a=md.indexOf('<!-- AUTO:KETTEN'), b=md.indexOf('<!-- /AUTO:KETTEN -->');
const mdNeu=a>=0&&b>a?md.slice(0,a)+K+md.slice(b+'<!-- /AUTO:KETTEN -->'.length):md+'\n'+K+'\n';
const weAlt=fs.existsSync(WE)?fs.readFileSync(WE,'utf8'):'';
if(pruefen){
  if(mdNeu!==md) probleme.push('docs/fundament/wirtschaft.md ist veraltet (Werkzeug ohne --pruefen laufen lassen)');
  if(T!==weAlt) probleme.push('docs/fundament/wirtschaft-werte.md ist veraltet');
} else { fs.writeFileSync(MD,mdNeu); fs.writeFileSync(WE,T); console.log('geschrieben:',path.relative(W,MD),path.relative(W,WE),`(${KETTEN.length} Ketten, ${blaetter.length} Werte)`); }
if(probleme.length){ console.log('PROBLEME:'); probleme.forEach(x=>console.log('  '+x)); process.exit(pruefen?1:0); }
console.log('Uebersicht OK: alle Orte gefunden, alle Platzhalter gueltig, jede Zahl wird gelesen.');
