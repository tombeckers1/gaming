/* Test-Harness (nur Testumgebung, keine Pruefung wird entschaerft). Aufruf: node -r ./ladezeit-preload.js <test>.js real.html
   1) Fristen: swiftshader braucht ~36 s zum Laden, bei Last mehr. Navigation mind. 240 s, waitForFunction mind. 300 s
      (Polling 500 ms statt rAF), waitForSelector/click mind. 120 s.
   2) Herzschlag (alle 45 s, BB_HERZSCHLAG=Sekunden): "[hb 300s] evaluate seit 40 s | RSS ... | frei ... GB" - so ist ein
      langsamer Lauf von einem Haenger zu unterscheiden. Seitenfehler (pageerror) kommen sofort als "[seitenfehler] ...".
   3) Renderer-Tod (14.10. gefunden): der Container hat ~15 GB gemeinsam fuer alle Agenten; ein Spiel mit allen Ausbauten
      belegt 5-7 GB. Wird ein Renderer vom OOM-Killer beendet, wirft Playwright KEINEN Fehler - der Test haengt stumm bis zum
      Zeitlimit. Der Herzschlag erkennt das (Seite offen, aber kein Renderer-Prozess) und beendet mit Meldung "RENDERER TOT" und
      Exit-Code 4 samt letzter OOM-Zeile aus dmesg. Ebenso das Playwright-Ereignis "crash".
   4) Speicher-Vorlauf: vor dem Browserstart wartet das Skript (max. 20 min), bis MemAvailable >= BB_MEM_MB (Standard 10000)
      frei ist, damit sich zwei Agenten nicht gegenseitig die Renderer abschiessen. BB_MEM_MB=0 schaltet das ab.
   Die gemeinsame Start-/Neulade-/Vorspul-Hilfe steht in start-hilfe.js (require('../../tools/test/start-hilfe.js')). */
const pw=require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'), cp=require('child_process');
const T0=Date.now(), sek=()=>((Date.now()-T0)/1000).toFixed(0), sleep=ms=>new Promise(r=>setTimeout(r,ms));
const HB=Math.max(5,+(process.env.BB_HERZSCHLAG||45))*1000, MEM_MB=+(process.env.BB_MEM_MB===undefined?10000:process.env.BB_MEM_MB);
const evals=new Map(); let evN=0, offen=0, ohneRenderer=0, letzte='Start';
const memFrei=()=>{ try{ const m=fs.readFileSync('/proc/meminfo','utf8').match(/MemAvailable:\s+(\d+)/); return Math.round(+m[1]/1024); }catch(e){ return -1; } };
/* Prozessbaum unter diesem Node-Prozess: RSS je Typ (browser/renderer/gpu-process ...) */
function baum(){ const kids={}, rss={}, typ={};
  try{ for(const d of fs.readdirSync('/proc')){ if(!/^\d+$/.test(d)) continue; try{
    const st=fs.readFileSync('/proc/'+d+'/stat','utf8'), m=st.match(/^\d+ \(.*\) \S (\d+) /); (kids[m[1]]=kids[m[1]]||[]).push(d);
    rss[d]=+fs.readFileSync('/proc/'+d+'/statm','utf8').split(' ')[1]*4096/1048576;
    const t=fs.readFileSync('/proc/'+d+'/cmdline','utf8').match(/--type=([a-z-]+)/); typ[d]=t?t[1]:'browser'; }catch(e){} } }catch(e){}
  const by={}; const walk=x=>{ if(x!==String(process.pid)){ const t=typ[x]||'?'; by[t]=(by[t]||0)+(rss[x]||0); } (kids[x]||[]).forEach(walk); }; walk(String(process.pid)); return by; }
function oomZeile(){ try{ const o=cp.execSync("dmesg 2>/dev/null | grep -E 'Killed process' | tail -2",{encoding:'utf8',timeout:5000}).trim(); return o||'(keine dmesg-Zeile lesbar)'; }catch(e){ return '(dmesg nicht lesbar)'; } }
function herzschlag(){
  const by=baum(), sum=Math.round(Object.values(by).reduce((a,b)=>a+b,0));
  const ev=[...evals.values()].sort((a,b)=>a-b)[0];
  console.log(`[hb ${sek()}s] ${ev?'evaluate seit '+Math.round((Date.now()-ev)/1000)+' s':'kein evaluate'} | zuletzt: ${letzte} | RSS ${sum} MB (${Object.entries(by).filter(e=>e[1]>60).map(e=>e[0]+' '+Math.round(e[1])).join(', ')}) | Spitze ${spitze} | frei ${(memFrei()/1024).toFixed(1)} GB`);
  if(offen>0&&(by.browser||0)>0&&!(by.renderer>0)){ if(++ohneRenderer>=2){
    console.log('RENDERER TOT: Seite offen, aber kein Renderer-Prozess mehr (OOM-Killer? Speicher teilen sich alle Agenten). '+oomZeile());
    console.log('ERRORS: RENDERER TOT (Speicher) - Lauf mit weniger parallelen Browsern wiederholen'); process.exit(4); } } else ohneRenderer=0;
}
setInterval(herzschlag,HB).unref();
/* Eigene Speicherobergrenze (BB_MAX_MB, Standard 12500, 0 = aus): lieber selbst abbrechen (Exit 4, damit lauf.sh wiederholt), als den
   OOM-Killer eines gemeinsamen 15-GB-Containers entscheiden zu lassen, welcher Agent seinen Renderer verliert. Spitze steht im Herzschlag. */
const MAX_MB=+(process.env.BB_MAX_MB===undefined?12500:process.env.BB_MAX_MB); let spitze=0;
setInterval(()=>{ const by=baum(), sum=Math.round(Object.values(by).reduce((a,b)=>a+b,0)); if(sum>spitze) spitze=sum;
  if(MAX_MB>0&&sum>MAX_MB){ console.log(`SPEICHER-ABBRUCH: dieser Test belegt ${sum} MB (> ${MAX_MB}): `+Object.entries(by).map(e=>e[0]+' '+Math.round(e[1])).join(', ')+` | zuletzt: ${letzte}`);
    console.log('ERRORS: Speichergrenze ueberschritten (RENDERER TOT vermieden)'); try{ cp.execSync('pkill -9 -P '+process.pid); }catch(e){} process.exit(4); } },1000).unref();
process.on('exit',()=>{ if(spitze) console.log(`[speicher] Spitze ${spitze} MB (ohne node)`); });

function seite(p){
  offen++; p.on('close',()=>{ offen--; });
  p.setDefaultNavigationTimeout(240000); p.setDefaultTimeout(120000);
  p.on('pageerror',e=>console.log('[seitenfehler '+sek()+'s] '+String(e.message).slice(0,300)));
  p.on('crash',()=>{ console.log('RENDERER TOT: Playwright meldet "crash". '+oomZeile()); console.log('ERRORS: Seite abgestuerzt (crash)'); process.exit(4); });
  const mind=(o,ms)=>Object.assign({},o||{},{timeout:(o&&o.timeout===0)?0:Math.max((o&&o.timeout)||0,ms)});
  for(const m of ['waitForSelector','click']){ const f=p[m].bind(p); p[m]=(s,o)=>{ letzte=m+' '+String(s).slice(0,40); return f(s,mind(o,120000)); }; }
  for(const m of ['goto','reload']){ const f=p[m].bind(p); p[m]=(...a)=>{ letzte=m; const i=m==='goto'?1:0; a[i]=mind(a[i],240000); return f(...a); }; }
  { const f=p.waitForFunction.bind(p); p.waitForFunction=(fn,arg,o)=>{ letzte='waitForFunction '+String(fn).slice(0,50); return f(fn,arg,Object.assign({polling:500},mind(o,300000))); }; }
  { const f=p.evaluate.bind(p); p.evaluate=(...a)=>{ const id=++evN; evals.set(id,Date.now()); return f(...a).finally(()=>evals.delete(id)); }; }
  return p;
}
function kontext(c){ const np=c.newPage.bind(c); c.newPage=async(...x)=>seite(await np(...x)); return c; }
const orig=pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch=async(...a)=>{
  if(MEM_MB>0){ const t=Date.now(); let n=0; while(memFrei()<MEM_MB&&Date.now()-t<20*60*1000){ if(n++%6===0) console.log(`[hb ${sek()}s] warte auf Speicher: frei ${memFrei()} MB < ${MEM_MB} MB (andere Browser laufen)`); await sleep(5000); }
    if(memFrei()<MEM_MB) console.log(`[hb ${sek()}s] Speicher nach 20 min immer noch knapp (${memFrei()} MB) - starte trotzdem`); }
  /* BB_CHROME_ARGS="--flag1 --flag2": zusaetzliche Chromium-Argumente (Experimente, z. B. --disable-accelerated-2d-canvas) */
  if(process.env.BB_CHROME_ARGS){ const o=Object.assign({},a[0]||{}); o.args=(o.args||[]).concat(process.env.BB_CHROME_ARGS.split(/\s+/).filter(Boolean)); a[0]=o; }
  const b=await orig(...a);
  const np=b.newPage.bind(b); b.newPage=async(...x)=>seite(await np(...x));
  const nc=b.newContext.bind(b); b.newContext=async(...x)=>kontext(await nc(...x));
  return b; };
