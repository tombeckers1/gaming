/* Doppelte Namen auf oberster Ebene: eine zweite "function x" ueber-
   schreibt die erste still - so hat die Musik (function teil) einmal
   alle Figuren kaputt gemacht. Liest nur die gebaute Datei. */
const fs=require('fs');
const src=fs.readFileSync(process.argv[2],'utf8');
const namen={}, doppelt=[];
for(const m of src.matchAll(/^(?:function|const|let|class) ([A-Za-z_$][\w$]*)/gm)){
  namen[m[1]]=(namen[m[1]]||0)+1; if(namen[m[1]]===2) doppelt.push(m[1]); }
console.log('NAMEN   ',Object.keys(namen).length,'auf oberster Ebene');
console.log('ERRORS:',doppelt.length?'doppelt: '+doppelt.join(', '):'keine');
