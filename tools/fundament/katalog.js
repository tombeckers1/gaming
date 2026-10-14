// Katalog-Generator (Fundament, 13.10.2026) - Material-, Textur-, Bauteil- und "Vorher"-Katalog mit Bildern.
// Aufruf:  node tools/fundament/katalog.js <real.html> <ausgabeordner>
//   real.html bauen: UEBERGABE.md Abschnitt 9 (build + mkreal.py). Beispiel mit eigener Sperre:
//   flock /tmp/bb-testlock-katalog nice -n 10 timeout 2400 node tools/fundament/katalog.js /pfad/real.html docs/fundament/katalog
// Ausgabe: <ausgabeordner>/katalog.json + Bilder in materialien/ texturen/ bauteile/ vorher/ verpackungen/
// Umgebungsvariablen: KATALOG_PROFIL=0 (ohne Zaehl-Wrapper pre/post.js: keine Baufunktions-Herkunft, Vorher-Katalog
//   weitgehend leer), GFXW=<stufe> (Grafikstufe wie messen3.js), MAXBILDER=<n> (Testlauf: je Abschnitt hoechstens n Bilder)
// Das Spiel bleibt unveraendert: der Generator laedt tools/fundament/katalog-seite.js in die Seite, sammelt nur lesend und
// rendert in einer eigenen Studio-Szene (eigener Renderer, gleiche Belichtung/ToneMapping wie das Spiel).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'), path=require('path'), os=require('os');

const html=process.argv[2], out=process.argv[3];
if(!html||!out){ console.error('Aufruf: node katalog.js <real.html> <ausgabeordner>'); process.exit(2); }
const HIER=__dirname, QUELLEN=path.join(HIER,'..','..','src','parts');
const MAX=process.env.MAXBILDER?+process.env.MAXBILDER:1e9;
const t0=Date.now(); const log=(...a)=>console.log(((Date.now()-t0)/1000).toFixed(0)+'s',...a);

/* ---- Zaehl-Wrapper einbauen (pre.js vor dem Spielskript, post.js vor 22-start) + Texturherkunft ---- */
const HAKEN=`
/* Katalog-Haken: Herkunft (Baufunktion) jeder per tex() gemalten Textur merken */
try{ const _t=tex; tex=function(){ const t=_t.apply(this,arguments); try{ const P=window.__P; if(t&&t.isTexture){ (t.userData||(t.userData={})).__lab=P.stack.length?P.stack[P.stack.length-1]:'(top)'; } }catch(e){} return t; }; }catch(e){}
`;
function profilHtml(src){
  let h=fs.readFileSync(src,'utf8');
  const pre=fs.readFileSync(path.join(HIER,'pre.js'),'utf8'), post=fs.readFileSync(path.join(HIER,'post.js'),'utf8');
  const i2=h.lastIndexOf('<script>'); if(i2<0) throw new Error('kein <script> in '+src);
  h=h.slice(0,i2+8)+'\n'+pre+'\n'+h.slice(i2+8);
  const mk='/* =========================================================\n   Start\n   ========================================================= */';
  const k=h.indexOf(mk); if(k<0) throw new Error('Marker "Start" (22-start.js) nicht gefunden - Teil umbenannt? Dann KATALOG_PROFIL=0 oder Marker anpassen');
  h=h.slice(0,k)+post+'\n'+HAKEN+'\n'+h.slice(k);
  return h;
}
/* Baufunktion -> Datei:Zeile (aus dem Quellcode, fuer die Spalte "Fundort im Code") */
function quellenIndex(){
  const idx={}; if(!fs.existsSync(QUELLEN)) return idx;
  for(const f of fs.readdirSync(QUELLEN).filter(f=>f.endsWith('.js')).sort()){
    const L=fs.readFileSync(path.join(QUELLEN,f),'utf8').split('\n');
    L.forEach((z,i)=>{ const m=/^\s*(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/.exec(z); if(m&&!idx[m[1]]) idx[m[1]]=f+':'+(i+1); });
  }
  return idx;
}
function dateiVon(dataUrl){ const m=/^data:image\/(\w+);base64,(.*)$/.exec(dataUrl||''); return m?{ext:m[1]==='jpeg'?'jpg':m[1],buf:Buffer.from(m[2],'base64')}:null; }
let gesamt=0;
function speichern(rel,dataUrl){ const d=dateiVon(dataUrl); if(!d) return null; const p=rel+'.'+d.ext; fs.mkdirSync(path.dirname(path.join(out,p)),{recursive:true}); fs.writeFileSync(path.join(out,p),d.buf); gesamt+=d.buf.length; return p; }
const pad=(n,l)=>String(n).padStart(l||3,'0');

(async()=>{
  fs.mkdirSync(out,{recursive:true});
  let seite=html, tmp=null;
  if(process.env.KATALOG_PROFIL!=='0'){
    tmp=path.join(path.dirname(path.resolve(html)),'.katalog-profil-'+process.pid+'.html');
    try{ fs.writeFileSync(tmp,profilHtml(html)); seite=tmp; }catch(e){ log('Profil-Einbau nicht moeglich ('+e.message+') - weiter ohne'); tmp=null; }
  }
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:640,height:400}}); p.setDefaultTimeout(900000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE: '+m.text().slice(0,200)); });
  const fehler=[]; const sicher=async(name,fn)=>{ try{ return await fn(); }catch(e){ fehler.push(name+': '+String(e&&e.message||e).slice(0,300)); log('FEHLER',name,String(e&&e.message||e).slice(0,200)); return null; } };
  try{
    /* ---- neues Spiel starten, alle Zonen offen (wie messen3.js) ---- */
    /* frischer Browser: localStorage ist leer; nur die Grafikstufe (GFXW) setzen - kein zweiter Ladevorgang noetig */
    await p.addInitScript(g=>{ try{ localStorage.clear(); if(g) localStorage.setItem('bb_gfx',g); }catch(e){} },process.env.GFXW||null);
    await p.goto('file://'+path.resolve(seite)); log('Seite geladen');
    await p.waitForFunction('window.__bb!==undefined',null,{timeout:900000}); log('__bb da');
    await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:900000});
    await p.click('#startBtns button:last-child',{timeout:900000});
    await p.waitForSelector('#nameBox.show',{state:'visible',timeout:900000}); log('Namensfeld');
    await p.click('#nameGo');
    await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:900000});
    await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=99; for(const u of bb.UPGRADES) bb.S.up[u.id]=true; try{ bb.applyZonen(); }catch(e){} bb.run(1,0.05); });
    log('Spiel gestartet, Profil:',!!tmp);
    await p.addScriptTag({content:fs.readFileSync(path.join(HIER,'katalog-seite.js'),'utf8')});

    const katalog={erzeugt:new Date().toISOString(),quelle:path.basename(html),profil:!!tmp,fehler};
    katalog.spiel=await p.evaluate(()=>{ const bb=window.__bb; return {grafikstufe:bb.MAT.stufe().name,meshes:(()=>{ let n=0; bb.scene.traverse(o=>{ if(o.isMesh) n++; }); return n; })(),
      renderer:{toneMapping:bb.renderer.toneMapping,belichtung:bb.renderer.toneMappingExposure}}; });
    const qidx=quellenIndex();

    /* ---- Baukasten und Bibliothek (Definitionen) ---- */
    katalog.baukasten=await sicher('baukasten',()=>p.evaluate(()=>{ const bb=window.__bb, M=bb.MAT; const hx=v=>'#'+('000000'+(v>>>0).toString(16)).slice(-6); const L=M.liste();
      const zahl=v=>Array.isArray(v)?v[0]:v;                       /* FARBE: Hex-Zahl (alt) oder [hex,Name,wofuer,RAL] (neu) */
      return {funktionen:Object.keys(bb.bk).sort(),mat:Object.keys(M).sort(),
        /* neuer Katalog der Bibliothek (Farben mit Zweck/RAL, Klassen, Rezepte, Texturen), falls vorhanden */
        bibliothek:L.katalog||null,
        farben:Object.keys(M.PALETTE||M.FARBE).map(k=>{ const v=(M.PALETTE||M.FARBE)[k]; return {name:k,hex:hx(zahl(v)),anzeige:Array.isArray(v)?v[1]:null,wofuer:Array.isArray(v)?v[2]:null,ral:Array.isArray(v)?v[3]:null}; }),
        klassen:M.KLASSE?Object.keys(M.KLASSE).map(k=>Object.assign({name:k},M.KLASSE[k])):[],
        rezepte:Object.keys(M.REZEPT).map(k=>{ const r=M.REZEPT[k]; let h=null; try{ h=hx(zahl(typeof r.f==='string'?(M.PALETTE||M.FARBE)[r.f]:r.f)); }catch(e){} return {name:k,farbe:r.f,farbeHex:h,klasse:r.k||null,roughness:r.r===undefined?null:r.r,metalness:r.m===undefined?null:r.m,textur:r.tex||null,wofuer:r.w||r.wofuer||null}; }),
        texturen:L.texturen,bk:bb.bk.liste()}; }));

    /* ---- 1. Materialien ---- */
    const mat=await sicher('materialien',()=>p.evaluate(()=>window.__K.materialien()));
    if(mat){
      const n=Math.min(mat.eintraege.length,MAX);
      for(let i=0;i<n;i+=20){ const r=await sicher('matBilder '+i,()=>p.evaluate(([a,c])=>window.__K.matBilder(a,c),[i,Math.min(n,i+20)])); if(!r) continue;
        for(const k in r){ const e=mat.eintraege[+k]; e.bild=speichern('materialien/'+(e.art==='bibliothek'?'b':'f')+pad(k),r[k]); } }
      mat.eintraege.forEach((e,i)=>{ e.id=i; for(const v of e.verwendung) if(v.art==='baufunktion'&&qidx[v.name]) v.code=qidx[v.name]; });
      mat.eintraege=mat.eintraege.map(e=>{ delete e.objId; return e; });
      katalog.materialien=mat; log('Materialien',mat.eintraege.length,'(Bibliothek',mat.bibliothek+', eigen/fremd',mat.fremd+')');
    }

    /* ---- 2. Texturen ---- */
    const tx=await sicher('texturen',()=>p.evaluate(()=>window.__K.texturen()));
    if(tx){
      const n=Math.min(tx.eintraege.length,MAX);
      for(let i=0;i<n;i+=30){ const r=await sicher('texBilder '+i,()=>p.evaluate(([a,c])=>window.__K.texBilder(a,c),[i,Math.min(n,i+30)])); if(!r) continue;
        for(const k in r) tx.eintraege[+k].bild=speichern('texturen/t'+pad(k),r[k]); }
      for(const e of tx.eintraege){ for(const v of e.verwendung) if(v.art==='baufunktion'&&qidx[v.name]) v.code=qidx[v.name]; if(e.herkunftArt==='baufunktion'&&e.herkunft){ e.herkunftCode=e.herkunft.split(', ').map(h=>qidx[h]).filter(Boolean)[0]||null; } }
      katalog.texturen=tx; log('Texturen',tx.einzigartig,'einzigartig,',tx.texturObjekte,'Objekte,',tx.dubletten,'Dubletten,',tx.rohMB,'MB roh');
    }

    /* ---- 3. Bauteile (userData.bauteil) ---- */
    const bt=await sicher('bauteile',()=>p.evaluate(()=>window.__K.bauteile()));
    if(bt){
      for(const a of bt.eintraege){
        const bilder=Math.min(a.varianten.length,8);
        for(let v=0;v<bilder;v++){ const u=await sicher('btBild '+a.name,()=>p.evaluate(([x,y])=>window.__K.btBild(x,y),[a.id,a.varianten[v].beispiel])); a.varianten[v].bild=speichern('bauteile/'+a.name.replace(/[^\w-]/g,'_')+'-v'+v,u); }
        a.bild=a.varianten[0]&&a.varianten[0].bild||null;
      }
      katalog.bauteile=bt; log('Bauteile',bt.arten,'Arten');
    }

    /* ---- 4. Vorher: wiederkehrende Objekte ausserhalb des Baukastens ---- */
    const vo=await sicher('vorher',()=>p.evaluate(()=>window.__K.vorher()));
    if(vo){
      const flach=[]; for(const e of vo.eintraege) for(const v of e.varianten) flach.push(v);
      const n=Math.min(flach.length?Math.max.apply(null,flach.map(v=>v.bildIx))+1:0,MAX);
      const bilder={};
      for(let i=0;i<n;i+=8){ const r=await sicher('vBilder '+i,()=>p.evaluate(([a,c])=>window.__K.vBilder(a,c),[i,Math.min(n,i+8)])); if(r) Object.assign(bilder,r); }
      for(const e of vo.eintraege){ e.code=qidx[e.baufunktion]?e.datei+' / '+qidx[e.baufunktion]:e.datei;
        e.varianten.forEach((v,j)=>{ v.bild=speichern('vorher/'+e.id+'-'+(v.kind||j),bilder[v.bildIx]); delete v.bildIx; }); }
      /* nach Kategorie ordnen (Reihenfolge wie im Spiel-Inventar, inventar-optik.md Abschnitt 2) */
      const kat={}; for(const e of vo.eintraege) for(const v of e.varianten){ const k=v.kat||e.kat; (kat[k]||(kat[k]=[])).push(Object.assign({eintrag:e.id,baufunktion:e.baufunktion,code:e.code},v)); }
      vo.kategorien=Object.keys(kat).map(k=>({name:k,varianten:kat[k]}));
      katalog.vorher=vo; log('Vorher-Objekte',flach.length,'Varianten in',vo.kategorien.length,'Kategorien');
    }

    /* ---- 5. Verpackungen (Versandkartons je Sorte) als Kontaktbogen ---- */
    const kt=await sicher('kartons',()=>p.evaluate(()=>window.__K.kartons(64,16)));
    if(kt){ kt.bild=speichern('verpackungen/kartons',kt.sheet); delete kt.sheet; katalog.verpackungen=kt; log('Kartons',kt.anzahl); }

    katalog.bilderMB=+(gesamt/1048576).toFixed(2);
    katalog.zaehlung={materialien:katalog.materialien?katalog.materialien.eintraege.length:0,texturen:katalog.texturen?katalog.texturen.einzigartig:0,
      bauteile:katalog.bauteile?katalog.bauteile.arten:0,vorherVarianten:katalog.vorher?katalog.vorher.eintraege.reduce((s,e)=>s+e.varianten.length,0):0,kartons:katalog.verpackungen?katalog.verpackungen.anzahl:0};
    katalog.seitenfehler=errs.slice(0,10);
    fs.writeFileSync(path.join(out,'katalog.json'),JSON.stringify(katalog));
    log('fertig',JSON.stringify(katalog.zaehlung),'Bilder',katalog.bilderMB,'MB, Fehler',fehler.length,'Seitenfehler',errs.length);
  } catch(e){ log('Abbruch:',String(e&&e.message||e).slice(0,300),'| Seitenfehler:',JSON.stringify(errs.slice(0,5))); throw e; } finally {
    await b.close(); if(tmp) try{ fs.unlinkSync(tmp); }catch(e){}
  }
})().catch(e=>{ console.error('FAIL',e); process.exit(1); });
