// Tabelle vorher/nachher aus tools/halle/messen.js: node tools/halle/messvergleich.js vorher-a.json,vorher-b.json nachher-a.json,nachher-b.json
const fs=require('fs');
const lies=l=>Object.assign({},...l.split(',').map(f=>JSON.parse(fs.readFileSync(f,'utf8'))));
const V=lies(process.argv[2]), N=lies(process.argv[3]);
const stufen=Object.keys(V).filter(k=>V[k]&&V[k].ansichten);
const ans=Object.keys(V[stufen[0]].ansichten);
console.log('| Stufe | '+ans.join(' | ')+' | Texturen MB | Meshes |');
console.log('|'+'---|'.repeat(ans.length+3));
for(const s of stufen){ const v=V[s], n=N[s]; if(!n) continue;
  console.log(`| ${s} Aufrufe | `+ans.map(a=>`${v.ansichten[a].calls} → ${n.ansichten[a].calls}`).join(' | ')+` | ${v.texMB} → ${n.texMB} | ${v.meshes} → ${n.meshes} |`);
  console.log(`| ${s} Dreiecke (k) | `+ans.map(a=>`${Math.round(v.ansichten[a].tris/1000)} → ${Math.round(n.ansichten[a].tris/1000)}`).join(' | ')+' | | |'); }
